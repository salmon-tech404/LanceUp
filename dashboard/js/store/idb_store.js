/**
 * LanceUp IndexedDB Engine (idb_store.js)
 * High-capacity, asynchronous client-side database for jobs and metadata
 * Zero dependencies — Pure Native Web Standards
 */

const DB_NAME = 'LanceUpDB';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Open or initialize the IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
export function initDB() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. All Scanned Jobs Cache Store
      if (!db.objectStoreNames.contains('jobs')) {
        const jobsStore = db.createObjectStore('jobs', { keyPath: 'id' });
        jobsStore.createIndex('submittedAt', 'submittedAt', { unique: false });
        jobsStore.createIndex('platform', 'platform', { unique: false });
        jobsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
      }

      // 2. Saved / Starred Jobs Store (Permanent archive)
      if (!db.objectStoreNames.contains('saved_jobs')) {
        const savedStore = db.createObjectStore('saved_jobs', { keyPath: 'id' });
        savedStore.createIndex('savedAt', 'savedAt', { unique: false });
        savedStore.createIndex('platform', 'platform', { unique: false });
      }

      // 3. User Metadata Store (starred, hidden, viewed, notes)
      if (!db.objectStoreNames.contains('job_meta')) {
        const metaStore = db.createObjectStore('job_meta', { keyPath: 'id' });
        metaStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(event.target.error || new Error('Failed to open LanceUpDB'));
    };
  });
}

/**
 * Bulk save or update jobs in IndexedDB
 * @param {Array<Object>} jobs 
 * @returns {Promise<number>} Number of jobs saved
 */
export async function saveJobs(jobs = []) {
  if (!Array.isArray(jobs) || jobs.length === 0) return 0;
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['jobs'], 'readwrite');
    const store = tx.objectStore('jobs');
    const now = Date.now();

    for (const job of jobs) {
      if (job && job.id) {
        store.put({
          ...job,
          cachedAt: job.cachedAt || now,
        });
      }
    }

    tx.oncomplete = () => resolve(jobs.length);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all cached jobs sorted by submission date (most recent first)
 * @param {number} limit 
 * @returns {Promise<Array<Object>>}
 */
export async function getAllJobs(limit = 300) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['jobs'], 'readonly');
    const store = tx.objectStore('jobs');
    const index = store.index('submittedAt');
    const request = index.openCursor(null, 'prev');
    const results = [];

    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Permanently save a starred job with full details
 * @param {Object} job 
 * @returns {Promise<boolean>}
 */
export async function saveStarredJob(job) {
  if (!job || !job.id) return false;
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['saved_jobs'], 'readwrite');
    const store = tx.objectStore('saved_jobs');
    store.put({
      ...job,
      savedAt: Date.now(),
    });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Remove a job from permanent starred archive
 * @param {string|number} id 
 * @returns {Promise<boolean>}
 */
export async function removeStarredJob(id) {
  if (!id) return false;
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['saved_jobs'], 'readwrite');
    const store = tx.objectStore('saved_jobs');
    store.delete(String(id));
    store.delete(Number(id));
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all permanently starred jobs
 * @returns {Promise<Array<Object>>}
 */
export async function getAllStarredJobs() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['saved_jobs'], 'readonly');
    const store = tx.objectStore('saved_jobs');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Synchronize personalStore (starred, hidden, viewed) sets into IndexedDB
 * @param {{ starred: Set, hidden: Set, viewed: Set }} store 
 * @returns {Promise<boolean>}
 */
export async function syncPersonalStoreToIDB(store) {
  if (!store) return false;
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['job_meta'], 'readwrite');
    const metaStore = tx.objectStore('job_meta');
    const now = Date.now();

    if (store.starred) {
      for (const id of store.starred) {
        metaStore.put({ id: String(id), isStarred: true, updatedAt: now });
      }
    }
    if (store.hidden) {
      for (const id of store.hidden) {
        metaStore.put({ id: String(id), isHidden: true, updatedAt: now });
      }
    }
    if (store.viewed) {
      for (const id of store.viewed) {
        metaStore.put({ id: String(id), isViewed: true, updatedAt: now });
      }
    }

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Automatically prune old uncategorized jobs beyond max limit to save disk space
 * @param {number} keepCount 
 * @returns {Promise<number>} Number of pruned jobs
 */
export async function pruneOldJobs(keepCount = 1000) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['jobs'], 'readwrite');
    const store = tx.objectStore('jobs');
    const index = store.index('submittedAt');
    const request = index.openCursor(null, 'prev');
    let count = 0;
    let deleted = 0;

    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        count++;
        if (count > keepCount) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear cached jobs
 * @returns {Promise<boolean>}
 */
export async function clearAllCache() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['jobs'], 'readwrite');
    tx.objectStore('jobs').clear();
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}
