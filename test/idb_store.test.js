import { test, assertEqual, assertTrue } from './run_tests.js';
import {
  initDB,
  saveJobs,
  getAllJobs,
  saveStarredJob,
  removeStarredJob,
  getAllStarredJobs,
  syncPersonalStoreToIDB,
  pruneOldJobs,
} from '../dashboard/js/store/idb_store.js';

export async function runIDBTests() {
  await test('initDB rejects gracefully when indexedDB is undefined in raw Node environment', async () => {
    const originalIDB = globalThis.indexedDB;
    try {
      delete globalThis.indexedDB;
      let caught = false;
      try {
        await initDB();
      } catch (err) {
        caught = true;
        assertTrue(err.message.includes('IndexedDB is not supported'));
      }
      assertTrue(caught);
    } finally {
      if (originalIDB) globalThis.indexedDB = originalIDB;
    }
  });

  await test('IndexedDB operations work correctly with in-memory storage mock', async () => {
    // Setup lightweight mock IDB for Node.js unit testing
    const mockStorage = {
      jobs: new Map(),
      saved_jobs: new Map(),
      job_meta: new Map(),
    };

    const mockDB = {
      objectStoreNames: {
        contains: (name) => name in mockStorage,
      },
      createObjectStore: (name) => {
        mockStorage[name] = new Map();
        return {
          createIndex: () => {},
        };
      },
      transaction: (storeNames) => {
        const storeName = storeNames[0];
        const storeMap = mockStorage[storeName];

        const tx = {
          objectStore: () => ({
            put: (item) => {
              storeMap.set(String(item.id), item);
            },
            delete: (id) => {
              storeMap.delete(String(id));
            },
            clear: () => {
              storeMap.clear();
            },
            getAll: () => {
              const req = { result: Array.from(storeMap.values()) };
              setTimeout(() => req.onsuccess && req.onsuccess(), 0);
              return req;
            },
            index: () => ({
              openCursor: (query, direction) => {
                const items = Array.from(storeMap.values()).sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
                let idx = 0;
                const req = {};
                const makeCursor = () => {
                  if (idx >= items.length) {
                    req.result = null;
                  } else {
                    const currentItem = items[idx];
                    req.result = {
                      value: currentItem,
                      continue: () => {
                        idx++;
                        makeCursor();
                        req.onsuccess && req.onsuccess({ target: req });
                      },
                      delete: () => {
                        storeMap.delete(String(currentItem.id));
                      },
                    };
                  }
                };
                makeCursor();
                setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 0);
                return req;
              },
            }),
          }),
          oncomplete: null,
          onerror: null,
        };

        setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
        return tx;
      },
    };

    globalThis.indexedDB = {
      open: () => {
        const req = {
          result: mockDB,
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };
        setTimeout(() => {
          if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
          if (req.onsuccess) req.onsuccess({ target: req });
        }, 0);
        return req;
      },
    };

    // Test saving jobs
    const sampleJobs = [
      { id: 'job-1', title: 'React Dev', submittedAt: 100 },
      { id: 'job-2', title: 'Python Engineer', submittedAt: 200 },
    ];

    const savedCount = await saveJobs(sampleJobs);
    assertEqual(savedCount, 2);

    // Test querying jobs
    const allJobs = await getAllJobs(10);
    assertEqual(allJobs.length, 2);
    assertEqual(allJobs[0].id, 'job-2'); // Most recent first (200 > 100)

    // Test saving and retrieving starred jobs
    await saveStarredJob({ id: 'starred-1', title: 'Senior Architect', platform: 'upwork' });
    const starredList = await getAllStarredJobs();
    assertEqual(starredList.length, 1);
    assertEqual(starredList[0].id, 'starred-1');

    // Test removing starred job
    await removeStarredJob('starred-1');
    const updatedStarred = await getAllStarredJobs();
    assertEqual(updatedStarred.length, 0);

    // Test syncing personal store
    const personalStore = {
      starred: new Set(['job-1']),
      hidden: new Set(['job-2']),
      viewed: new Set(['job-1', 'job-2']),
    };
    const syncSuccess = await syncPersonalStoreToIDB(personalStore);
    assertTrue(syncSuccess);

    // Test pruning old jobs
    for (let i = 3; i <= 15; i++) {
      await saveJobs([{ id: `job-${i}`, title: `Job ${i}`, submittedAt: i * 10 }]);
    }
    const prunedCount = await pruneOldJobs(5);
    assertTrue(prunedCount > 0);

    // Clean up
    delete globalThis.indexedDB;
  });
}
