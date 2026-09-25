/**
 * Job Card Component
 * Renders individual job card with platform badges, score figure, and interactive actions
 */
import { formatMoney, formatRelative } from '../../../shared/utils/format.js';
import { reasonText } from '../../../shared/domain/evaluate.js';
import { icon } from '../../../shared/utils/icons.js';
import { escapeHtml } from '../../../shared/utils/security.js';
import { PLATFORMS } from '../../../shared/config/constants.js';

export function renderJobCard(evaluation, isStarred, isHidden, isViewed) {
  const { job, maxUsd, score, breakdown, status, reason, matchedCore, matchedSupport } = evaluation;
  const isPassed = status === 'passed';
  const isHourly = job.type === 'hourly';
  const isUpwork = job.platform === 'upwork';

  const meta = PLATFORMS[job.platform] || {
    badgeClass: 'platform-badge--freelancer',
    icon: 'layers',
    name: job.platform || 'Freelancer',
  };
  const badgeClass = meta.badgeClass;
  const badgeIcon = meta.icon;
  const badgeLabel = meta.name;


  let budgetDisplay;
  if (!job.budgetMax && !job.budgetMin) {
    budgetDisplay = 'Thỏa thuận (Chưa rõ)';
  } else if (job.budgetMin === job.budgetMax || !job.budgetMin) {
    budgetDisplay = `${formatMoney(job.budgetMax, job.currency)}${isHourly ? '/giờ' : ''}`;
  } else {
    budgetDisplay = `${formatMoney(job.budgetMin, job.currency)} – ${formatMoney(job.budgetMax, job.currency)}${isHourly ? '/giờ' : ''}`;
  }

  const coreIds = new Set((matchedCore || []).map(s => s.id));
  const supportIds = new Set((matchedSupport || []).map(s => s.id));

  const card = document.createElement('li');
  card.className = `job ${isPassed ? 'job--passed' : 'job--discarded'}`;
  card.dataset.id = String(job.id);
  card.dataset.status = status;
  if (isViewed) card.dataset.viewed = 'true';

  card.innerHTML = `
    <div class="job__head">
      <div>
        <h3 class="job__title">
          <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="job__link" data-action="view">
            ${escapeHtml(job.title)}
            ${icon('external-link', 'xs', 'inline')}
          </a>
        </h3>

        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
          <span class="platform-badge ${badgeClass}">
            ${icon(badgeIcon, 'xs')}
            <span>${badgeLabel}</span>
          </span>


          <div class="status ${isPassed ? 'status--success' : 'status--danger'}">
            ${icon(isPassed ? 'circle-check' : 'circle-x', 'xs')}
            <span>${isPassed ? 'Đạt yêu cầu' : escapeHtml(reasonText(reason))}</span>
          </div>
        </div>
      </div>

      ${score !== null ? `
        <div class="job__score">
          <span class="figure">${score}</span>
          <span class="caption">Điểm chất lượng</span>
        </div>
      ` : ''}
    </div>

    <dl class="meta-list">
      <div class="meta">
        <dt>${icon('banknote', 'xs')} ${isHourly ? 'Ngân sách giờ' : 'Ngân sách fixed'}</dt>
        <dd>${escapeHtml(budgetDisplay)}</dd>
      </div>

      ${job.currency !== 'USD' && maxUsd !== null ? `
        <div class="meta">
          <dt>Quy đổi USD</dt>
          <dd style="color: var(--color-accent-text);">≈ ${formatMoney(maxUsd, 'USD')}${isHourly ? '/giờ' : ''}</dd>
        </div>
      ` : ''}

      <div class="meta">
        <dt>${icon('users', 'xs')} ${isUpwork ? 'Proposals (bids)' : 'Số lượng bid'}</dt>
        <dd>${typeof job.bids === 'number' ? job.bids : (typeof job.bidsCount === 'number' ? job.bidsCount : 0)}</dd>
      </div>

      <div class="meta">
        <dt>${icon('clock', 'xs')} Đăng lúc</dt>
        <dd><time>${formatRelative(job.submittedAt)}</time></dd>
      </div>
    </dl>

    ${job.description ? `
      <div class="job__desc-wrapper">
        <p class="job__desc" style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.5; white-space: pre-line;">
          ${escapeHtml(job.description.slice(0, 240))}${job.description.length > 240 ? '...' : ''}
        </p>
      </div>
    ` : ''}

    <div class="job__tags" style="display: flex; flex-wrap: wrap; gap: var(--space-1);">
      ${job.skills.map(s => {
        const isCore = coreIds.has(s.id);
        const isSupport = supportIds.has(s.id);
        let tagBg = 'var(--color-surface-raised)';
        let tagColor = 'var(--color-text-muted)';
        let tagBorder = 'var(--color-border)';

        if (isCore) {
          tagBg = 'var(--color-accent-soft)';
          tagColor = 'var(--color-accent-text)';
          tagBorder = 'var(--color-accent)';
        } else if (isSupport) {
          tagColor = 'var(--color-text)';
          tagBorder = 'var(--color-border-strong)';
        }

        return `<span style="font-size: var(--text-xs); padding: 0.125rem 0.5rem; border-radius: var(--radius-sm); border: 1px solid ${tagBorder}; background: ${tagBg}; color: ${tagColor};">${escapeHtml(s.name)}</span>`;
      }).join('')}
    </div>

    <div class="job__actions" style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-border); padding-top: var(--space-3); margin-top: var(--space-1);">
      <div style="display: flex; gap: var(--space-2);">
        <button type="button" class="btn btn--secondary btn--sm" data-action="star">
          ${icon('star', 'xs', isStarred ? 'fill-current' : '')}
          <span>${isStarred ? 'Đã lưu' : 'Lưu job'}</span>
        </button>

        <button type="button" class="btn btn--secondary btn--sm" data-action="hide">
          ${icon('eye-off', 'xs')}
          <span>${isHidden ? 'Bỏ ẩn' : 'Ẩn'}</span>
        </button>

        <button type="button" class="btn btn--ghost btn--sm" data-action="copy">
          ${icon('copy', 'xs')}
          <span>Sao chép link</span>
        </button>
      </div>

      ${breakdown ? `
        <button type="button" class="btn btn--ghost btn--sm" data-action="score-detail" style="color: var(--color-accent-text);">
          ${icon('info', 'xs')}
          <span>Xem phân rã điểm</span>
        </button>
      ` : ''}
    </div>
  `;

  return card;
}
