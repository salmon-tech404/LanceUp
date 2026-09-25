/**
 * Filter Sidebar Component
 * Manages 3-tier skill two-way movement, platform selection, thresholds, and live search
 */
import { ALL_CATALOG_SKILLS, SKILL_ORIGIN_MAP } from '../../../shared/config/skills.js';
import { icon } from '../../../shared/utils/icons.js';
import { escapeHtml } from '../../../shared/utils/security.js';
import { PLATFORMS, ALL_PLATFORM_IDS } from '../../../shared/config/constants.js';

export function createFilterSidebar({ initialFilters, onReload }) {
  // Staging draft state so user clicks don't lag or trigger network reloads until Reload is clicked
  const draft = {
    platforms: [...(initialFilters.platforms || ['freelancer', 'upwork', 'weremotely'])],
    core: new Set(initialFilters.core || []),
    support: new Set(initialFilters.support || []),
    exclude: new Set(initialFilters.exclude || []),
    minFixed: initialFilters.minFixed ?? 200,
    minHourly: initialFilters.minHourly ?? 20,
    minScore: initialFilters.minScore ?? 40,
    fewBids: initialFilters.fewBids ?? 20,
    showDiscarded: initialFilters.showDiscarded ?? false,
    sort: initialFilters.sort || 'score',
  };

  let searchQuery = '';
  const collapsed = {
    core: false,
    support: true,
    exclude: true,
  };

  let updatePlatformTrigger = () => {};
  let renderPlatformDropdownItems = () => {};

  const sidebarEl = document.createElement('aside');
  sidebarEl.id = 'filterSidebar';
  sidebarEl.className = 'filters';

  /**
   * Render static shell once
   */
  function renderSkeleton() {
    sidebarEl.innerHTML = `
      <div class="filters__head">
        <h2 class="heading">Bộ lọc</h2>
        <button type="button" class="btn btn--primary" id="btnReloadSidebar" title="Tải lại và lọc những job phù hợp nhất theo tiêu chí">
          ${icon('refresh-cw', 'xs')}
          <span>Reload</span>
        </button>
      </div>

      <!-- Platform Selector Dropdown -->
      <div style="display: flex; flex-direction: column; gap: var(--space-2); padding-bottom: var(--space-2); border-bottom: 1px solid var(--color-border);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            ${icon('layers', 'sm', 'text-accent')}
            <span class="heading" style="font-size: var(--text-sm);">Sàn việc làm</span>
          </div>
          <span class="tip-icon" title="Chọn các sàn việc làm và nguồn tuyển dụng muốn quét tự động">${icon('circle-help', 'xs')}</span>
        </div>

        <div class="platform-dropdown" id="platformDropdownWrap">
          <button type="button" class="platform-dropdown__trigger" id="btnPlatformDropdown" aria-haspopup="true" aria-expanded="false" title="Nhấp để chọn các sàn việc làm">
            <span style="display: flex; align-items: center; gap: 0.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              <span id="lblPlatformSummary">Sàn đã chọn:</span>
            </span>
            <span style="display: flex; align-items: center; gap: 0.35rem; flex-shrink: 0;">
              <span class="platform-dropdown__pill" id="lblPlatformCount"></span>
              ${icon('chevron-down', 'xs')}
            </span>
          </button>

          <div class="platform-dropdown__menu" id="platformDropdownMenu" style="display: none;" role="menu">
            <div class="platform-dropdown__header">
              <div class="platform-dropdown__search-wrap">
                ${icon('search', 'xs')}
                <input type="search" id="inputPlatformSearch" placeholder="Tìm sàn việc làm..." class="platform-dropdown__search-input" />
              </div>
              <div class="platform-dropdown__toolbar">
                <button type="button" class="platform-dropdown__btn-link" id="btnSelectAllPlatforms">Chọn tất cả</button>
                <button type="button" class="platform-dropdown__btn-link" id="btnDeselectAllPlatforms" style="color: var(--color-text-muted);">Bỏ chọn</button>
              </div>
            </div>

            <div class="platform-dropdown__list" id="platformDropdownList">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>
      </div>

      <!-- Search Skills (Isolated - Never destroyed on keystroke) -->
      <div style="position: relative;">
        <input type="search" id="inputSkillSearch" placeholder="Tìm kỹ năng" class="input" style="padding-left: 2rem;" />
        <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--color-text-muted);">
          ${icon('search', 'xs')}
        </span>
      </div>

      <!-- Group 1: Kỹ năng yêu cầu (Core) -->
      <div style="display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <button type="button" class="btn btn--ghost" id="toggleCoreGroup" style="flex: 1; justify-content: flex-start; padding: 0;">
            ${icon('radar', 'sm')}
            <span class="heading" style="font-size: var(--text-sm);">Kỹ năng yêu cầu</span>
            <span id="coreCountBadge" class="caption" style="margin-left: auto; padding-right: 0.5rem;">0</span>
            <span id="coreChevron" style="display: inline-flex; transition: transform var(--duration-fast);">${icon('chevron-down', 'xs')}</span>
          </button>
          <span class="tip-icon" title="Bắt buộc job phải có ít nhất một kỹ năng yêu cầu. Bỏ chọn kỹ năng nào thì kỹ năng đó sẽ chuyển xuống Kỹ năng khác.">${icon('circle-help', 'xs')}</span>
        </div>
        <div id="coreChipsContainer" class="chips-grid"></div>
      </div>

      <!-- Group 2: Kỹ năng phụ (Support) -->
      <div style="display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <button type="button" class="btn btn--ghost" id="toggleSupportGroup" style="flex: 1; justify-content: flex-start; padding: 0;">
            ${icon('wrench', 'sm')}
            <span class="heading" style="font-size: var(--text-sm);">Kỹ năng phụ</span>
            <span id="supportCountBadge" class="caption" style="margin-left: auto; padding-right: 0.5rem;">0</span>
            <span id="supportChevron" style="display: inline-flex; transition: transform var(--duration-fast);">${icon('chevron-down', 'xs')}</span>
          </button>
          <span class="tip-icon" title="Kỹ năng phụ chỉ cộng thêm điểm. Bỏ chọn kỹ năng nào thì kỹ năng đó sẽ chuyển xuống Kỹ năng khác.">${icon('circle-help', 'xs')}</span>
        </div>
        <div id="supportChipsContainer" class="chips-grid"></div>
      </div>

      <!-- Group 3: Kỹ năng khác (Exclude/Other) -->
      <div style="display: flex; flex-direction: column; gap: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <button type="button" class="btn btn--ghost" id="toggleOtherGroup" style="flex: 1; justify-content: flex-start; padding: 0;">
            ${icon('ban', 'sm')}
            <span class="heading" style="font-size: var(--text-sm);">Kỹ năng khác</span>
            <span id="otherCountBadge" class="caption" style="margin-left: auto; padding-right: 0.5rem;">0</span>
            <span id="otherChevron" style="display: inline-flex; transition: transform var(--duration-fast);">${icon('chevron-down', 'xs')}</span>
          </button>
          <span class="tip-icon" title="Các kỹ năng không được chọn. Job chứa bất kỳ kỹ năng nào trong nhóm này sẽ bị loại. Click vào ô chọn để chuyển kỹ năng trở lại nhóm trên.">${icon('circle-help', 'xs')}</span>
        </div>
        <div id="otherChipsContainer" class="chips-grid"></div>
      </div>

      <!-- Thresholds Group -->
      <div style="display: flex; flex-direction: column; gap: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: var(--space-2);">
            ${icon('sliders-horizontal', 'sm')}
            <span class="heading" style="font-size: var(--text-sm);">Thù lao & Tiêu chí nhận job</span>
          </div>
          <span class="tip-icon" title="Cấu hình mức thù lao tối thiểu và số lượt bid tối đa bạn muốn nhận">${icon('circle-help', 'xs')}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2);">
          <div>
            <label class="caption" style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Fixed ≥ ($)</span>
              <span class="tip-icon" title="Mức thù lao trọn gói tối thiểu theo USD ($) cho cả dự án">${icon('circle-help', 'xs')}</span>
            </label>
            <input type="number" id="inputMinFixed" value="${draft.minFixed}" min="0" step="50" class="input" />
          </div>

          <div>
            <label class="caption" style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Hourly ≥ ($/h)</span>
              <span class="tip-icon" title="Mức thù lao trả theo giờ tối thiểu theo USD ($/giờ)">${icon('circle-help', 'xs')}</span>
            </label>
            <input type="number" id="inputMinHourly" value="${draft.minHourly}" min="0" step="5" class="input" />
          </div>

          <div>
            <label class="caption" style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Điểm ≥ (0-100)</span>
              <span class="tip-icon" title="Điểm chất lượng sàn: Kết hợp giữa Thù lao (max 40đ) + Công nghệ (max 40đ) + Cạnh tranh (max 20đ)">${icon('circle-help', 'xs')}</span>
            </label>
            <input type="number" id="inputMinScore" value="${draft.minScore}" min="0" max="100" class="input" />
          </div>

          <div>
            <label class="caption" style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span>Bid ít ≤ (n)</span>
              <span class="tip-icon" title="Mức trần số lượng người chào thầu/proposals để nhận tối đa 20 điểm cạnh tranh">${icon('circle-help', 'xs')}</span>
            </label>
            <input type="number" id="inputFewBids" value="${draft.fewBids}" min="1" max="500" class="input" />
          </div>
        </div>

        <!-- Discarded Job Toggle in Sidebar (Unique ID to prevent collision) -->
        <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding-top: var(--space-2);">
          <span class="label" style="font-size: var(--text-sm);">Hiển thị cả job bị loại</span>
          <input type="checkbox" id="sidebarShowDiscarded" ${draft.showDiscarded ? 'checked' : ''} style="accent-color: var(--color-accent); width: 1.25rem; height: 1.25rem;" />
        </label>
      </div>
    `;
  }

  /**
   * Render dynamic skill chips without touching the rest of sidebar DOM
   */
  function renderSkillChips() {
    const isSearching = searchQuery.trim().length > 0;
    const q = searchQuery.toLowerCase().trim();

    // 1. Core skills
    const coreSkills = ALL_CATALOG_SKILLS.filter(s => draft.core.has(s.id));
    const filteredCore = isSearching ? coreSkills.filter(s => s.name.toLowerCase().includes(q)) : coreSkills;

    // 2. Support skills
    const supportSkills = ALL_CATALOG_SKILLS.filter(s => draft.support.has(s.id));
    const filteredSupport = isSearching ? supportSkills.filter(s => s.name.toLowerCase().includes(q)) : supportSkills;

    // 3. Other skills (unchecked in both core and support)
    const otherSkills = ALL_CATALOG_SKILLS.filter(s => !draft.core.has(s.id) && !draft.support.has(s.id));
    const filteredOther = isSearching ? otherSkills.filter(s => s.name.toLowerCase().includes(q)) : otherSkills;

    // Update counts
    const coreCountEl = sidebarEl.querySelector('#coreCountBadge');
    const supportCountEl = sidebarEl.querySelector('#supportCountBadge');
    const otherCountEl = sidebarEl.querySelector('#otherCountBadge');

    if (coreCountEl) coreCountEl.textContent = coreSkills.length;
    if (supportCountEl) supportCountEl.textContent = supportSkills.length;
    if (otherCountEl) otherCountEl.textContent = otherSkills.length;

    // Render Core Chips
    const coreContainer = sidebarEl.querySelector('#coreChipsContainer');
    if (coreContainer) {
      if (filteredCore.length === 0) {
        coreContainer.innerHTML = '<span class="caption" style="grid-column: 1 / -1;">Không có kỹ năng nào.</span>';
      } else {
        coreContainer.innerHTML = filteredCore.map(s => `
          <label class="chip">
            <input type="checkbox" checked data-skill-id="${s.id}" data-action="uncheck-core" />
            <span>${escapeHtml(s.name)}</span>
          </label>
        `).join('');
      }

      coreContainer.querySelectorAll('[data-action="uncheck-core"]').forEach(input => {
        input.addEventListener('change', () => {
          const id = parseInt(input.dataset.skillId, 10);
          draft.core.delete(id);
          renderSkillChips();
        });
      });
    }

    // Render Support Chips
    const supportContainer = sidebarEl.querySelector('#supportChipsContainer');
    if (supportContainer) {
      if (filteredSupport.length === 0) {
        supportContainer.innerHTML = '<span class="caption" style="grid-column: 1 / -1;">Không có kỹ năng nào.</span>';
      } else {
        supportContainer.innerHTML = filteredSupport.map(s => `
          <label class="chip">
            <input type="checkbox" checked data-skill-id="${s.id}" data-action="uncheck-support" />
            <span>${escapeHtml(s.name)}</span>
          </label>
        `).join('');
      }

      supportContainer.querySelectorAll('[data-action="uncheck-support"]').forEach(input => {
        input.addEventListener('change', () => {
          const id = parseInt(input.dataset.skillId, 10);
          draft.support.delete(id);
          renderSkillChips();
        });
      });
    }

    // Render Other Chips
    const otherContainer = sidebarEl.querySelector('#otherChipsContainer');
    if (otherContainer) {
      if (filteredOther.length === 0) {
        otherContainer.innerHTML = '<span class="caption" style="grid-column: 1 / -1;">Không có kỹ năng nào.</span>';
      } else {
        otherContainer.innerHTML = filteredOther.map(s => `
          <label class="chip" style="opacity: 0.7;">
            <input type="checkbox" data-skill-id="${s.id}" data-action="restore-skill" />
            <span>${escapeHtml(s.name)}</span>
          </label>
        `).join('');
      }

      otherContainer.querySelectorAll('[data-action="restore-skill"]').forEach(input => {
        input.addEventListener('change', () => {
          const id = parseInt(input.dataset.skillId, 10);
          const origin = SKILL_ORIGIN_MAP.get(id);
          if (origin === 'core') {
            draft.core.add(id);
          } else {
            draft.support.add(id);
          }
          renderSkillChips();
        });
      });
    }

    updateCollapseStates();
  }

  /**
   * Update visibility of chip grids and chevron rotations
   */
  function updateCollapseStates() {
    const isSearching = searchQuery.trim().length > 0;

    const coreContainer = sidebarEl.querySelector('#coreChipsContainer');
    const supportContainer = sidebarEl.querySelector('#supportChipsContainer');
    const otherContainer = sidebarEl.querySelector('#otherChipsContainer');

    const coreChevron = sidebarEl.querySelector('#coreChevron');
    const supportChevron = sidebarEl.querySelector('#supportChevron');
    const otherChevron = sidebarEl.querySelector('#otherChevron');

    if (coreContainer) {
      const showCore = isSearching || !collapsed.core;
      coreContainer.style.display = showCore ? 'grid' : 'none';
      if (coreChevron) coreChevron.style.transform = showCore ? 'rotate(0deg)' : 'rotate(-90deg)';
    }

    if (supportContainer) {
      const showSupport = isSearching || !collapsed.support;
      supportContainer.style.display = showSupport ? 'grid' : 'none';
      if (supportChevron) supportChevron.style.transform = showSupport ? 'rotate(0deg)' : 'rotate(-90deg)';
    }

    if (otherContainer) {
      const showOther = isSearching || !collapsed.exclude;
      otherContainer.style.display = showOther ? 'grid' : 'none';
      if (otherChevron) otherChevron.style.transform = showOther ? 'rotate(0deg)' : 'rotate(-90deg)';
    }
  }

  /**
   * Bind static event listeners
   */
  function bindEvents() {
    // Reload button - Serializes Sets to Arrays for clean message passing
    const reloadBtn = sidebarEl.querySelector('#btnReloadSidebar');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', () => {
        const otherSkills = ALL_CATALOG_SKILLS.filter(s => !draft.core.has(s.id) && !draft.support.has(s.id));
        draft.exclude = new Set(otherSkills.map(s => s.id));

        onReload({
          platforms: [...draft.platforms],
          core: Array.from(draft.core),
          support: Array.from(draft.support),
          exclude: Array.from(draft.exclude),
          minFixed: draft.minFixed,
          minHourly: draft.minHourly,
          minScore: draft.minScore,
          fewBids: draft.fewBids,
          showDiscarded: draft.showDiscarded,
          sort: draft.sort,
        });
      });
    }

    // Platforms Dropdown Logic
    const dropdownWrap = sidebarEl.querySelector('#platformDropdownWrap');
    const btnDropdown = sidebarEl.querySelector('#btnPlatformDropdown');
    const menuDropdown = sidebarEl.querySelector('#platformDropdownMenu');
    const listDropdown = sidebarEl.querySelector('#platformDropdownList');
    const inputPlatformSearch = sidebarEl.querySelector('#inputPlatformSearch');
    const lblPlatformCount = sidebarEl.querySelector('#lblPlatformCount');
    const lblPlatformSummary = sidebarEl.querySelector('#lblPlatformSummary');
    const btnSelectAll = sidebarEl.querySelector('#btnSelectAllPlatforms');
    const btnDeselectAll = sidebarEl.querySelector('#btnDeselectAllPlatforms');

    let platformSearchQuery = '';

    updatePlatformTrigger = () => {
      const count = draft.platforms.length;
      const total = ALL_PLATFORM_IDS.length;
      if (lblPlatformCount) {
        lblPlatformCount.textContent = `${count}/${total} sàn`;
      }
      if (lblPlatformSummary) {
        if (count === total) {
          lblPlatformSummary.textContent = 'Tất cả các sàn:';
        } else if (count === 1) {
          const single = PLATFORMS[draft.platforms[0]];
          lblPlatformSummary.textContent = single ? `${single.name}:` : '1 sàn:';
        } else {
          lblPlatformSummary.textContent = `${count} sàn đã chọn:`;
        }
      }
    };

    renderPlatformDropdownItems = () => {
      if (!listDropdown) return;
      const query = platformSearchQuery.toLowerCase().trim();

      const categories = [
        { id: 'freelance', label: 'Sàn Freelance Truyền Thống' },
        { id: 'remote', label: 'Remote & Tech Global' },
      ];

      let html = '';

      categories.forEach(cat => {
        const catPlatforms = ALL_PLATFORM_IDS
          .map(id => PLATFORMS[id])
          .filter(p => p && p.category === cat.id)
          .filter(p => !query || p.name.toLowerCase().includes(query) || (p.typeTag && p.typeTag.toLowerCase().includes(query)));

        if (catPlatforms.length > 0) {
          html += `<div class="platform-dropdown__group-title">${escapeHtml(cat.label)}</div>`;
          catPlatforms.forEach(p => {
            const isChecked = draft.platforms.includes(p.id);
            html += `
              <label class="platform-dropdown__item" data-platform-id="${p.id}">
                <div class="platform-dropdown__item-left">
                  <input type="checkbox" value="${p.id}" ${isChecked ? 'checked' : ''} style="accent-color: var(--color-accent); cursor: pointer;" />
                  <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: var(--text-xs); font-weight: var(--weight-medium);">
                    ${icon(p.icon, 'xs', 'text-accent')}
                    <span>${escapeHtml(p.name)}</span>
                  </span>
                </div>
                <span class="platform-dropdown__tag">${escapeHtml(p.typeTag || '')}</span>
              </label>
            `;
          });
        }
      });

      if (!html) {
        html = `<div style="padding: var(--space-3); text-align: center; color: var(--color-text-muted); font-size: var(--text-xs);">Không tìm thấy sàn nào</div>`;
      }

      listDropdown.innerHTML = html;

      // Attach change listeners to checkboxes
      listDropdown.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const id = e.target.value;
          if (e.target.checked) {
            if (!draft.platforms.includes(id)) {
              draft.platforms.push(id);
            }
          } else {
            // Keep at least 1 platform checked
            if (draft.platforms.length > 1) {
              draft.platforms = draft.platforms.filter(p => p !== id);
            } else {
              e.target.checked = true; // Revert
            }
          }
          updatePlatformTrigger();
        });
      });
    }

    function togglePlatformDropdown(forceClose) {
      if (!menuDropdown) return;
      const willClose = forceClose === true || menuDropdown.style.display !== 'none';
      if (willClose) {
        menuDropdown.style.display = 'none';
        btnDropdown?.classList.remove('is-open');
        btnDropdown?.setAttribute('aria-expanded', 'false');
      } else {
        menuDropdown.style.display = 'flex';
        btnDropdown?.classList.add('is-open');
        btnDropdown?.setAttribute('aria-expanded', 'true');
        if (inputPlatformSearch) {
          inputPlatformSearch.focus();
        }
      }
    }

    if (btnDropdown) {
      btnDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlatformDropdown();
      });
    }

    if (inputPlatformSearch) {
      inputPlatformSearch.addEventListener('input', (e) => {
        platformSearchQuery = e.target.value;
        renderPlatformDropdownItems();
      });
      inputPlatformSearch.addEventListener('click', (e) => e.stopPropagation());
    }

    if (btnSelectAll) {
      btnSelectAll.addEventListener('click', (e) => {
        e.stopPropagation();
        draft.platforms = [...ALL_PLATFORM_IDS];
        renderPlatformDropdownItems();
        updatePlatformTrigger();
      });
    }

    if (btnDeselectAll) {
      btnDeselectAll.addEventListener('click', (e) => {
        e.stopPropagation();
        draft.platforms = ['freelancer'];
        renderPlatformDropdownItems();
        updatePlatformTrigger();
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (dropdownWrap && !dropdownWrap.contains(e.target)) {
        togglePlatformDropdown(true);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuDropdown && menuDropdown.style.display !== 'none') {
        togglePlatformDropdown(true);
      }
    });

    // Initial render of platform dropdown
    renderPlatformDropdownItems();
    updatePlatformTrigger();

    // Search (high performance: updates chips without destroying search input or losing focus)
    const searchInput = sidebarEl.querySelector('#inputSkillSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderSkillChips();
      });
    }

    // Collapses
    sidebarEl.querySelector('#toggleCoreGroup')?.addEventListener('click', () => {
      collapsed.core = !collapsed.core;
      updateCollapseStates();
    });
    sidebarEl.querySelector('#toggleSupportGroup')?.addEventListener('click', () => {
      collapsed.support = !collapsed.support;
      updateCollapseStates();
    });
    sidebarEl.querySelector('#toggleOtherGroup')?.addEventListener('click', () => {
      collapsed.exclude = !collapsed.exclude;
      updateCollapseStates();
    });

    // Numeric inputs
    sidebarEl.querySelector('#inputMinFixed')?.addEventListener('change', (e) => {
      draft.minFixed = Math.max(0, parseInt(e.target.value, 10) || 0);
    });
    sidebarEl.querySelector('#inputMinHourly')?.addEventListener('change', (e) => {
      draft.minHourly = Math.max(0, parseInt(e.target.value, 10) || 0);
    });
    sidebarEl.querySelector('#inputMinScore')?.addEventListener('change', (e) => {
      draft.minScore = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
    });
    sidebarEl.querySelector('#inputFewBids')?.addEventListener('change', (e) => {
      draft.fewBids = Math.max(1, parseInt(e.target.value, 10) || 1);
    });
    sidebarEl.querySelector('#sidebarShowDiscarded')?.addEventListener('change', (e) => {
      draft.showDiscarded = e.target.checked;
    });
  }

  // Initial render
  renderSkeleton();
  renderSkillChips();
  bindEvents();

  // Expose API on sidebar element for two-way synchronization
  sidebarEl.setShowDiscarded = (show) => {
    draft.showDiscarded = Boolean(show);
    const chk = sidebarEl.querySelector('#sidebarShowDiscarded');
    if (chk) chk.checked = draft.showDiscarded;
  };

  sidebarEl.setDraft = (newFilters) => {
    if (newFilters.platforms) {
      draft.platforms = [...newFilters.platforms];
      renderPlatformDropdownItems();
      updatePlatformTrigger();
    }
    if (newFilters.core) draft.core = new Set(newFilters.core);
    if (newFilters.support) draft.support = new Set(newFilters.support);
    if (newFilters.exclude) draft.exclude = new Set(newFilters.exclude);
    if (newFilters.minFixed !== undefined) {
      draft.minFixed = newFilters.minFixed;
      const el = sidebarEl.querySelector('#inputMinFixed');
      if (el) el.value = draft.minFixed;
    }
    if (newFilters.minHourly !== undefined) {
      draft.minHourly = newFilters.minHourly;
      const el = sidebarEl.querySelector('#inputMinHourly');
      if (el) el.value = draft.minHourly;
    }
    if (newFilters.minScore !== undefined) {
      draft.minScore = newFilters.minScore;
      const el = sidebarEl.querySelector('#inputMinScore');
      if (el) el.value = draft.minScore;
    }
    if (newFilters.fewBids !== undefined) {
      draft.fewBids = newFilters.fewBids;
      const el = sidebarEl.querySelector('#inputFewBids');
      if (el) el.value = draft.fewBids;
    }
    if (newFilters.showDiscarded !== undefined) {
      sidebarEl.setShowDiscarded(newFilters.showDiscarded);
    }
    renderSkillChips();
  };

  return sidebarEl;
}
