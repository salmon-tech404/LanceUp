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
import { DEFAULTS, PLATFORMS } from '../../shared/config/constants.js';
import { SKILL_GROUPS } from '../../shared/config/skills.js';
import { icon } from '../../shared/utils/icons.js';
import { escapeHtml } from '../../shared/utils/security.js';
import { initTooltips } from './ui/tooltip_manager.js';
import { showToast } from './ui/toast_manager.js';
import { getUpworkTabStatus } from '../../shared/services/upwork_service.js';

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
const statsEl = document.querySelector('.stats');
const statTotal = document.getElementById('statTotal');
const statPassed = document.getElementById('statPassed');
const statDiscarded = document.getElementById('statDiscarded');
const statAverage = document.getElementById('statAverage');
const countAll = document.getElementById('countAll');
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

  const visiblePassed = filters.showDiscarded ? total : passed.length;
  if (countAll) countAll.textContent = visiblePassed > 0 ? `(${visiblePassed})` : '';
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
  // Only show the global scan stats bar on the "All" tab to prevent confusion on Saved/Hidden tabs
  if (statsEl) {
    statsEl.style.display = activeTab === 'all' ? 'grid' : 'none';
  }

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
 * Update top header notice for platforms requiring login session
 * (Rendered in red, italic, unbolded as requested)
 */
function updateHeaderLoginNotice(selectedPlatforms = filters.platforms) {
  const noticeEl = document.getElementById('headerLoginNotice');
  if (!noticeEl) return;

  const currentPlatforms = Array.isArray(selectedPlatforms) ? selectedPlatforms : [];
  const loginRequiredPlatforms = currentPlatforms
    .map(id => PLATFORMS[id])
    .filter(p => p && p.requiresLogin);

  if (loginRequiredPlatforms.length === 0) {
    noticeEl.style.display = 'none';
    noticeEl.innerHTML = '';
    return;
  }

  const names = loginRequiredPlatforms.map(p => p.name).join(', ');
  noticeEl.style.display = 'inline-flex';

  if (loginRequiredPlatforms.length === 1 && loginRequiredPlatforms[0].id === 'upwork') {
    noticeEl.innerHTML = `* Lưu ý: Bạn cần đăng nhập vào <a href="https://www.upwork.com/" target="_blank" rel="noopener noreferrer">Upwork</a> trên trình duyệt trước khi click Reload / Quét việc làm.`;
  } else {
    noticeEl.innerHTML = `* Lưu ý: Bạn cần đăng nhập vào ${escapeHtml(names)} trên trình duyệt trước khi click Reload / Quét việc làm.`;
  }

  const link = noticeEl.querySelector('a');
  if (link) {
    link.addEventListener('click', (e) => {
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        e.preventDefault();
        chrome.tabs.create({ url: link.href });
      }
    });
  }
}

/**
 * Update Upwork Live Sync notice banner based on tab status
 */
async function updateUpworkNotice() {
  const container = document.getElementById('feedNoticeContainer');
  if (!container) return;

  const isUpworkSelected = filters.platforms.includes('upwork');
  if (!isUpworkSelected) {
    container.innerHTML = '';
    return;
  }

  const { hasTab } = await getUpworkTabStatus();
  if (hasTab) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="sync-banner" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); margin-bottom: var(--space-3);">
      <div style="display: flex; align-items: center; gap: var(--space-2);">
        ${icon('info', 'sm')}
        <span style="font-size: var(--text-xs); color: var(--color-text); line-height: 1.4;">
          <strong>Upwork đang hiển thị tin mẫu (Snapshot):</strong> Mở một tab tìm kiếm Upwork để LanceUp tự động quét việc làm thực tế theo thời gian thực.
        </span>
      </div>
      <button type="button" class="btn btn--secondary btn--sm" id="btnOpenUpworkTab" style="flex-shrink: 0; white-space: nowrap;">
        ${icon('external-link', 'xs')}
        <span>Mở tab Upwork Search</span>
      </button>
    </div>
  `;

  const btn = document.getElementById('btnOpenUpworkTab');
  if (btn) {
    btn.addEventListener('click', () => {
      const url = 'https://www.upwork.com/nx/search/jobs/';
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    });
  }
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
  if (sidebarEl && sidebarEl.setReloading) {
    sidebarEl.setReloading(true);
  }

  renderSkeleton(jobsContainer, 4);

  try {
    const coreSkillIds = [...filters.core];
    const result = await fetchMultiPlatformJobs(filters.platforms, coreSkillIds);
    cachedJobs = result.jobs;
  } catch (err) {
    console.error('Failed to load multi-platform jobs:', err);
    renderEmptyState(jobsContainer, {
      type: 'error',
      title: 'Không thể kết nối lấy dữ liệu',
      message: 'Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.',
      actionText: 'Thử lại',
      onAction: () => loadJobs(),
    });
    return;
  } finally {
    isScanning = false;
    if (btnScanNow) {
      btnScanNow.disabled = false;
      btnScanNow.classList.remove('is-loading');
    }
    if (sidebarEl && sidebarEl.setReloading) {
      sidebarEl.setReloading(false);
    }
  }

  try {
    reEvaluateAndRender();
    updateUpworkNotice();
  } catch (err) {
    console.error('Failed to render jobs list:', err);
    renderEmptyState(jobsContainer, {
      type: 'error',
      title: 'Lỗi hiển thị danh sách việc làm',
      message: 'Đã nhận được dữ liệu nhưng xảy ra lỗi trong quá trình hiển thị giao diện.',
      actionText: 'Thử lại',
      onAction: () => reEvaluateAndRender(),
    });
  }
}

/**
 * Initialize application UI and event listeners
 */
function initApp() {
  // 1. Theme toggle, global tooltips, and header login notice
  initTheme(themeToggle);
  initTooltips();
  updateHeaderLoginNotice(filters.platforms);

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
        updateHeaderLoginNotice(filters.platforms);

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
      onPlatformChange: (newPlatforms) => {
        updateHeaderLoginNotice(newPlatforms);
      },
      onReload: async (newFilters) => {
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
        updateHeaderLoginNotice(filters.platforms);

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
          await loadJobs();
        } else {
          // Pure re-filtering without network request
          reEvaluateAndRender();
          updateUpworkNotice();
          showToast({ message: 'Đã cập nhật tiêu chí và lọc lại bảng tin!', tone: 'success' });
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
