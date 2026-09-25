/**
 * Export / Import Filter Configuration Dialog (Team Sharing)
 */
import { SKILL_GROUPS } from '../../../shared/config/skills.js';
import { icon } from '../../../shared/utils/icons.js';
import { showToast } from './toast_manager.js';
import { parseAndValidateFilterConfig } from '../../../shared/domain/config_parser.js';
import { DEFAULTS } from '../../../shared/config/constants.js';

export function showExportModal(filters, onApply) {
  const selectedCore = [...(filters.core || [])].sort((a, b) => a - b);
  const selectedSupport = [...(filters.support || [])].sort((a, b) => a - b);
  const selectedExclude = [...(filters.exclude || [])].sort((a, b) => a - b);

  const yamlContent = `# CẤU HÌNH BỘ LỌC LANCEUP (TEAM SHARING)
platforms:
${(filters.platforms || DEFAULTS.platforms).map(p => `  - ${p}`).join('\n')}

thresholds:
  min_fixed_usd: ${filters.minFixed}
  min_hourly_usd: ${filters.minHourly}
  min_quality_score: ${filters.minScore}
  few_bids_threshold: ${filters.fewBids}

core_skills:
${selectedCore.map(id => `  - ${id}  # ${SKILL_GROUPS.core.find(s => s.id === id)?.name || id}`).join('\n')}

support_skills:
${selectedSupport.map(id => `  - ${id}  # ${SKILL_GROUPS.support.find(s => s.id === id)?.name || id}`).join('\n')}

exclude_skills:
${selectedExclude.map(id => `  - ${id}  # ${SKILL_GROUPS.exclude.find(s => s.id === id)?.name || id}`).join('\n')}
`;

  const jsonContent = JSON.stringify(
    {
      platforms: filters.platforms || DEFAULTS.platforms,
      thresholds: {
        minFixed: filters.minFixed,
        minHourly: filters.minHourly,
        minScore: filters.minScore,
        fewBids: filters.fewBids,
      },
      core: selectedCore,
      support: selectedSupport,
      exclude: selectedExclude,
    },
    null,
    2
  );

  let activeTab = 'yaml'; // 'yaml' | 'json' | 'import'

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="exportModalTitle" style="max-width: 38rem;">
      <div class="modal__head">
        <h3 id="exportModalTitle" class="heading">Chia sẻ cấu hình bộ lọc</h3>
        <button type="button" class="btn btn--ghost btn--icon" data-action="close">
          ${icon('x', 'sm')}
        </button>
      </div>

      <div style="display: flex; gap: var(--space-2); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2);">
        <button type="button" class="btn btn--secondary btn--sm is-active" data-tab="yaml">Xuất YAML</button>
        <button type="button" class="btn btn--ghost btn--sm" data-tab="json">Xuất JSON</button>
        <button type="button" class="btn btn--ghost btn--sm" data-tab="import">
          ${icon('download', 'xs')}
          <span>Nhập cấu hình (Import)</span>
        </button>
      </div>

      <!-- Export View -->
      <div id="exportView" style="display: flex; flex-direction: column; gap: var(--space-3);">
        <textarea id="exportText" readonly style="width: 100%; height: 16rem; font-family: var(--font-mono); font-size: var(--text-xs); background: var(--color-surface-raised); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); padding: var(--space-3); resize: none;">${yamlContent}</textarea>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="caption">Dùng file này để chia sẻ cấu hình lọc cho các thành viên trong team</span>
          <div style="display: flex; gap: var(--space-2);">
            <button type="button" class="btn btn--secondary btn--sm" data-action="copy">
              ${icon('copy', 'xs')}
              <span>Sao chép</span>
            </button>
            <button type="button" class="btn btn--primary btn--sm" data-action="download">
              ${icon('download', 'xs')}
              <span>Tải về</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Import View -->
      <div id="importView" style="display: none; flex-direction: column; gap: var(--space-3);">
        <textarea id="importText" placeholder="Dán nội dung cấu hình JSON hoặc YAML tại đây..." style="width: 100%; height: 16rem; font-family: var(--font-mono); font-size: var(--text-xs); background: var(--color-surface-raised); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); padding: var(--space-3); resize: none;"></textarea>

        <div id="importErrorMsg" class="caption" style="display: none; color: var(--color-danger); font-weight: var(--weight-medium);"></div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: var(--space-2);">
            <button type="button" class="btn btn--secondary btn--sm" data-action="paste-clipboard">
              ${icon('clipboard-paste', 'xs')}
              <span>Dán từ bộ nhớ tạm</span>
            </button>
            <button type="button" class="btn btn--ghost btn--sm" data-action="sample-import">
              <span>Mẫu mặc định</span>
            </button>
          </div>
          <button type="button" class="btn btn--primary btn--sm" data-action="apply-import">
            ${icon('check', 'xs')}
            <span>Áp dụng cấu hình</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const exportView = overlay.querySelector('#exportView');
  const importView = overlay.querySelector('#importView');
  const textarea = overlay.querySelector('#exportText');
  const importTextarea = overlay.querySelector('#importText');
  const importErrorMsg = overlay.querySelector('#importErrorMsg');

  const yamlBtn = overlay.querySelector('[data-tab="yaml"]');
  const jsonBtn = overlay.querySelector('[data-tab="json"]');
  const importBtn = overlay.querySelector('[data-tab="import"]');

  function setTab(tab) {
    activeTab = tab;
    yamlBtn.className = tab === 'yaml' ? 'btn btn--secondary btn--sm is-active' : 'btn btn--ghost btn--sm';
    jsonBtn.className = tab === 'json' ? 'btn btn--secondary btn--sm is-active' : 'btn btn--ghost btn--sm';
    importBtn.className = tab === 'import' ? 'btn btn--secondary btn--sm is-active' : 'btn btn--ghost btn--sm';

    if (tab === 'yaml') {
      exportView.style.display = 'flex';
      importView.style.display = 'none';
      textarea.value = yamlContent;
    } else if (tab === 'json') {
      exportView.style.display = 'flex';
      importView.style.display = 'none';
      textarea.value = jsonContent;
    } else if (tab === 'import') {
      exportView.style.display = 'none';
      importView.style.display = 'flex';
      importTextarea.focus();
    }
  }

  yamlBtn.addEventListener('click', () => setTab('yaml'));
  jsonBtn.addEventListener('click', () => setTab('json'));
  importBtn.addEventListener('click', () => setTab('import'));

  overlay.querySelector('[data-action="copy"]').addEventListener('click', () => {
    navigator.clipboard.writeText(textarea.value);
    showToast({ message: 'Đã sao chép cấu hình vào Clipboard!', tone: 'success' });
  });

  overlay.querySelector('[data-action="download"]').addEventListener('click', () => {
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter-config.${activeTab}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: `Đã tải về file filter-config.${activeTab}`, tone: 'success' });
  });

  // Import actions
  overlay.querySelector('[data-action="paste-clipboard"]').addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        importTextarea.value = text;
        importErrorMsg.style.display = 'none';
      }
    } catch {
      showToast({ message: 'Không thể truy cập Clipboard, vui lòng dán thủ công bằng Ctrl+V.', tone: 'info' });
    }
  });

  overlay.querySelector('[data-action="sample-import"]').addEventListener('click', () => {
    importTextarea.value = yamlContent;
    importErrorMsg.style.display = 'none';
  });

  overlay.querySelector('[data-action="apply-import"]').addEventListener('click', () => {
    importErrorMsg.style.display = 'none';
    const text = importTextarea.value.trim();

    if (!text) {
      importErrorMsg.textContent = 'Vui lòng dán nội dung cấu hình trước khi áp dụng.';
      importErrorMsg.style.display = 'block';
      return;
    }

    try {
      const validated = parseAndValidateFilterConfig(text);
      if (typeof onApply === 'function') {
        onApply(validated);
      }
      showToast({ message: 'Đã nhập và áp dụng cấu hình bộ lọc thành công!', tone: 'success' });
      close();
    } catch (err) {
      importErrorMsg.textContent = err.message || 'Cấu hình không hợp lệ.';
      importErrorMsg.style.display = 'block';
      showToast({ message: err.message, tone: 'danger' });
    }
  });

  const close = () => overlay.remove();
  overlay.querySelectorAll('[data-action="close"]').forEach(btn => btn.addEventListener('click', close));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
}
