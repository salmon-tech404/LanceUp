/**
 * Main Application Entry Point
 * Orchestrates UI, filter store, personal store, multi-platform querying, and job evaluation
 */
import { initTheme } from './ui/theme_manager.js';
import { createFilterSidebar } from './ui/filter_sidebar.js';
import { renderJobsList, renderSkeleton, renderEmptyState } from './ui/jobs_list.js';
import { readStore, writeStore } from './store/personal_store.js';
import { readFilters, writeFilters } from './store/filter_store.js';
import { showExportModal } from './ui/export_dialog.js';
import { fetchMultiPlatformJobs } from '../../shared/services/orchestrator.js';
import { evaluateJob } from '../../shared/domain/evaluate.js';
import { DEFAULTS } from '../../shared/config/constants.js';
import { SKILL_GROUPS } from '../../shared/config/skills.js';
import { icon } from '../../shared/utils/icons.js';

// Global state
let personalStore = readStore();
let rawFilters = readFilters();

// Initialize filters with Set instances for O(1) lookups
let filters = {
  platforms: rawFilters?.platforms || DEFAULTS.platforms,
  core: new Set(rawFilters?.core || SKILL_GROUPS.core.map(s => s.id)),
  support: new Set(rawFilters?.support || SKILL_GROUPS.support.map(s => s.id)),
  exclude: new Set(rawFilters?.exclude || SKILL_GROUPS.exclude.map(s => s.id)),
  minFixed: rawFilters?.minFixed ?? DEFAULTS.minFixed,
  minHourly: rawFilters?.minHourly ?? DEFAULTS.minHourly,
  minScore: rawFilters?.minScore ?? DEFAULTS.minScore,
  fewBids: rawFilters?.fewBids ?? DEFAULTS.fewBids,
  showDiscarded: rawFilters?.showDiscarded ?? DEFAULTS.showDiscarded,
  sort: rawFilters?.sort || DEFAULTS.sort,
};

let activeTab = 'all'; // 'all' | 'saved' | 'hidden'
let visibleLimit = 25;
let cachedJobs = [];
let evaluations = [];
let isScanning = false;
let sidebarEl = null;

// DOM references
const jobsContainer = document.getElementById('jobsContainer');
const statTotal = document.getElementById('statTotal');
const statPassed = document.getElementById('statPassed');
const statDiscarded = document.getElementById('statDiscarded');
const statAverage = document.getElementById('statAverage');
const countSaved = document.getElementById('countSaved');
const countHidden = document.getElementById('countHidden');
const selectSort = document.getElementById('selectSort');
const chkShowDiscarded = document.getElementById('chkShowDiscarded');
const btnExport = document.getElementById('btnExport');
const btnScanNow = document.getElementById('btnScanNow');
const themeToggle = document.getElementById('themeToggle');
const sidebarMount = document.getElementById('sidebarMount');
const btnMobileFilterToggle = document.getElementById('btnMobileFilterToggle');

/**
 * Update stats bar & segmented tab badges
 */
function updateStats() {
  const total = evaluations.length;
  const passed = evaluations.filter(e => e.status === 'passed');
  const discarded = evaluations.filter(e => e.status === 'discarded');

  let avgScore = 0;
  if (passed.length > 0) {
    const sum = passed.reduce((acc, curr) => acc + (curr.score || 0), 0);
    avgScore = Math.round(sum / passed.length);
  }

  // Count saved & hidden from current evaluations
  const isStarred = (id) => personalStore.starred.has(id) || personalStore.starred.has(Number(id)) || personalStore.starred.has(String(id));
  const isHidden = (id) => personalStore.hidden.has(id) || personalStore.hidden.has(Number(id)) || personalStore.hidden.has(String(id));

  const savedCount = evaluations.filter(e => isStarred(e.job.id)).length;
  const hiddenCount = evaluations.filter(e => isHidden(e.job.id)).length;

  if (statTotal) statTotal.textContent = total;
  if (statPassed) statPassed.textContent = passed.length;
  if (statDiscarded) statDiscarded.textContent = discarded.length;
  if (statAverage) statAverage.textContent = passed.length > 0 ? `${avgScore}đ` : '—';

  if (countSaved) countSaved.textContent = savedCount > 0 ? `(${savedCount})` : '';
  if (countHidden) countHidden.textContent = hiddenCount > 0 ? `(${hiddenCount})` : '';
}

/**
 * Re-evaluate all cached jobs and re-render feed
 */
function reEvaluateAndRender() {
  evaluations = cachedJobs.map(job => evaluateJob(job, filters));
  updateStats();
  renderJobsFeed();
}

/**
 * Render jobs list based on active tab and options
 */
function renderJobsFeed() {
  renderJobsList(jobsContainer, evaluations, {
    personalStore,
    onStoreChange: (shouldRerender = true) => {
      writeStore(personalStore);
      updateStats();
      if (shouldRerender && (activeTab === 'saved' || activeTab === 'hidden')) {
        renderJobsFeed();
      }
    },
    activeTab,
    sort: filters.sort,
    showDiscarded: filters.showDiscarded,
    limit: visibleLimit,
    onLoadMore: () => {
      visibleLimit += 25;
      renderJobsFeed();
    },
  });
}

/**
 * Synchronize show discarded jobs setting across toolbar and sidebar
 */
function setDiscardedVisibility(show) {
  filters.showDiscarded = Boolean(show);
  if (chkShowDiscarded) chkShowDiscarded.checked = filters.showDiscarded;
  if (sidebarEl && sidebarEl.setShowDiscarded) {
    sidebarEl.setShowDiscarded(filters.showDiscarded);
  }
  writeFilters(filters);
  renderJobsFeed();
}

/**
 * Fetch jobs from selected platforms and evaluate
 */
async function loadJobs() {
  if (isScanning) return;
  isScanning = true;

  if (btnScanNow) {
    btnScanNow.disabled = true;
    btnScanNow.classList.add('is-loading');
  }

  renderSkeleton(jobsContainer, 4);

  try {
    const coreSkillIds = [...filters.core];
    const result = await fetchMultiPlatformJobs(filters.platforms, coreSkillIds);
    cachedJobs = result.jobs;
    reEvaluateAndRender();
  } catch (err) {
    console.error('Failed to load multi-platform jobs:', err);
    renderEmptyState(jobsContainer, {
      type: 'error',
      title: 'Không thể kết nối lấy dữ liệu',
      message: 'Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.',
      actionText: 'Thử lại',
      onAction: () => loadJobs(),
    });
  } finally {
    isScanning = false;
    if (btnScanNow) {
      btnScanNow.disabled = false;
      btnScanNow.classList.remove('is-loading');
    }
  }
}

/**
 * Initialize application UI and event listeners
 */
function initApp() {
  // 1. Theme toggle
  initTheme(themeToggle);

  // 2. Set control initial values
  if (selectSort) {
    selectSort.value = filters.sort;
    selectSort.addEventListener('change', (e) => {
      filters.sort = e.target.value;
      writeFilters(filters);
      renderJobsFeed();
    });
  }

  if (chkShowDiscarded) {
    chkShowDiscarded.checked = filters.showDiscarded;
    chkShowDiscarded.addEventListener('change', (e) => {
      setDiscardedVisibility(e.target.checked);
    });
  }

  // 3. Tab switching (All / Saved / Hidden)
  document.querySelectorAll('[data-scope]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-scope]').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      activeTab = btn.dataset.scope;
      visibleLimit = 25;
      renderJobsFeed();
    });
  });

  // 4. Export / Import modal with live configuration syncing
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      showExportModal(filters, (importedFilters) => {
        const newCoreSet = new Set(importedFilters.core);
        const platformsChanged = JSON.stringify(filters.platforms.slice().sort()) !== JSON.stringify(importedFilters.platforms.slice().sort());
        const coreChanged = filters.core.size !== newCoreSet.size || [...filters.core].some(id => !newCoreSet.has(id));

        // Update filters state
        filters = {
          ...filters,
          ...importedFilters,
          platforms: [...importedFilters.platforms],
          core: newCoreSet,
          support: new Set(importedFilters.support),
          exclude: new Set(importedFilters.exclude),
        };

        // Persist to storage
        writeFilters(filters);

        // Update sidebar draft & controls
        if (sidebarEl && sidebarEl.setDraft) {
          sidebarEl.setDraft(filters);
        }
        if (chkShowDiscarded) {
          chkShowDiscarded.checked = filters.showDiscarded;
        }

        // Re-fetch if platform or core skills changed, else re-evaluate
        if (platformsChanged || coreChanged) {
          loadJobs();
        } else {
          reEvaluateAndRender();
        }
      });
    });
  }

  // 5. Scan now button in header
  if (btnScanNow) {
    btnScanNow.addEventListener('click', () => {
      loadJobs();
    });
  }

  // 6. Mount Filter Sidebar
  if (sidebarMount) {
    sidebarEl = createFilterSidebar({
      initialFilters: filters,
      onReload: (newFilters) => {
        const newCoreSet = new Set(newFilters.core);
        const platformsChanged = JSON.stringify(filters.platforms.slice().sort()) !== JSON.stringify(newFilters.platforms.slice().sort());
        const coreChanged = filters.core.size !== newCoreSet.size || [...filters.core].some(id => !newCoreSet.has(id));

        // Update filters state
        filters = {
          ...filters,
          ...newFilters,
          platforms: [...newFilters.platforms],
          core: newCoreSet,
          support: new Set(newFilters.support),
          exclude: new Set(newFilters.exclude),
        };

        // Persist
        writeFilters(filters);

        // Close mobile sidebar if open
        if (sidebarEl.classList.contains('is-open')) {
          sidebarEl.classList.remove('is-open');
        }

        // Keep toolbar showDiscarded in sync
        if (chkShowDiscarded) {
          chkShowDiscarded.checked = filters.showDiscarded;
        }

        // If platform selection or core skills changed, re-fetch from platforms
        if (platformsChanged || coreChanged) {
          loadJobs();
        } else {
          // Pure re-filtering without network request
          reEvaluateAndRender();
        }
      },
    });

    sidebarMount.replaceWith(sidebarEl);

    // Mobile filter toggle button
    if (btnMobileFilterToggle) {
      btnMobileFilterToggle.addEventListener('click', () => {
        sidebarEl.classList.toggle('is-open');
      });
    }
  }

  // 7. Initial scan
  loadJobs();
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
