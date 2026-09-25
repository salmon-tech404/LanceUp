/**
 * Tooltip Manager Component
 * Provides modern, accessible, floating tooltips with rounded corners, smart positioning,
 * rich HTML content, hover delay, and click-to-pin support.
 */
import { icon } from '../../../shared/utils/icons.js';

export const TOOLTIPS = {
  'score-threshold': {
    title: 'Điểm chuẩn chất lượng nhận job (0 - 100đ)',
    badge: 'Bộ lọc cốt lõi',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Điểm chuẩn chất lượng nhận job</span>
          <span class="tip-card__badge">Thang 100đ</span>
        </div>
        
        <div class="tip-card__block">
          <div class="tip-card__label">Ý nghĩa của con số này (ví dụ: 60)</div>
          <div class="tip-card__desc">
            Đây là điểm sàn chất lượng tối thiểu bạn đặt ra. Công việc đạt từ 60 điểm trở lên được xếp vào danh sách Đạt yêu cầu. Công việc dưới 60 điểm sẽ tự động chuyển sang mục Loại bỏ để bạn không mất thời gian xem.
          </div>
        </div>

        <div class="tip-card__block">
          <div class="tip-card__label">Cách tính điểm (Thang 100)</div>
          <div class="tip-card__formula">
            <div class="tip-card__formula-row">
              <span class="tip-tag tip-tag--budget">Thù lao (tối đa 40đ)</span>
              <span>Dự án cố định từ $2,500 hoặc từ $60/h nhận 40đ; từ $750 hoặc từ $35/h nhận 30đ; từ $250 hoặc từ $20/h nhận 20đ.</span>
            </div>
            <div class="tip-card__formula-row">
              <span class="tip-tag tip-tag--tech">Kỹ năng (tối đa 40đ)</span>
              <span>Khớp từ 2 kỹ năng chính nhận 30đ (khớp 1 kỹ năng nhận 20đ), mỗi kỹ năng phụ cộng thêm 10đ.</span>
            </div>
            <div class="tip-card__formula-row">
              <span class="tip-tag tip-tag--bids">Cạnh tranh (tối đa 20đ)</span>
              <span>Số lượng chào thầu bằng hoặc thấp hơn mức ít đối thủ sẽ nhận đủ 20đ.</span>
            </div>
          </div>
        </div>

        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">Hướng dẫn điều chỉnh</div>
          <div class="tip-card__guide-list">
            <div class="tip-card__guide-item">
              <span class="tip-dir tip-dir--up">Nâng lên (70 - 85đ) - Khi muốn chọn lọc kỹ:</span>
              <span>Bộ lọc siết chặt, chỉ giữ lại các việc ngân sách lớn, ít đối thủ và trúng tủ kỹ năng.</span>
            </div>
            <div class="tip-card__guide-item">
              <span class="tip-dir tip-dir--down">Hạ xuống (30 - 50đ) - Khi muốn nhận nhiều việc:</span>
              <span>Tiêu chí nới lỏng để không bỏ sót cơ hội, phù hợp khi muốn mở rộng danh sách công việc.</span>
            </div>
          </div>
        </div>

        <div class="tip-card__footer">
          <span>Rê chuột để xem nhanh • Click vào biểu tượng để ghim mở • Bấm Esc để đóng</span>
        </div>
      </div>
    `,
  },
  'min-fixed': {
    title: 'Thù lao trọn gói tối thiểu ($)',
    badge: 'Fixed Budget',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Thù lao trọn gói tối thiểu ($)</span>
          <span class="tip-card__badge">Fixed Budget</span>
        </div>
        <div class="tip-card__desc">
          Mức thù lao dự án tối thiểu tính theo USD cho dự án cố định. Những việc có ngân sách thấp hơn con số này sẽ tự động bị loại.
        </div>
        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">Hướng dẫn điều chỉnh</div>
          <div class="tip-card__desc">
            • Nâng lên ($300 - $1,000): Bỏ qua các job nhỏ lẻ, tốn thời gian trao đổi.<br>
            • Hạ xuống ($50 - $150): Nhận thêm dự án ngắn hạn, hoàn thành nhanh.
          </div>
        </div>
      </div>
    `,
  },
  'min-hourly': {
    title: 'Thù lao theo giờ tối thiểu ($/h)',
    badge: 'Hourly Rate',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Thù lao theo giờ tối thiểu ($/h)</span>
          <span class="tip-card__badge">Hourly Rate</span>
        </div>
        <div class="tip-card__desc">
          Mức thù lao trả theo giờ tối thiểu tính theo USD/giờ. Công việc có đơn giá thấp hơn mức này sẽ bị loại.
        </div>
        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">Hướng dẫn điều chỉnh</div>
          <div class="tip-card__desc">
            Đặt theo mức rate tối thiểu mà bạn sẵn sàng nhận (ví dụ $20/h - $45/h).
          </div>
        </div>
      </div>
    `,
  },
  'few-bids': {
    title: 'Mốc ít đối thủ cạnh tranh (Số người nộp)',
    badge: 'Độ cạnh tranh (Tối đa +20đ)',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Mốc ít đối thủ cạnh tranh (Bids)</span>
          <span class="tip-card__badge">Tối đa +20đ</span>
        </div>
        
        <div class="tip-card__block">
          <div class="tip-card__label">Ý nghĩa của con số này</div>
          <div class="tip-card__desc">
            Khi nộp hồ sơ vào công việc ít người nộp, khách hàng sẽ thấy bạn sớm hơn và cơ hội được chọn cao hơn. Đây là số người nộp tối đa để công việc được cộng đủ 20 điểm ưu tiên.
          </div>
        </div>

        <div class="tip-card__block">
          <div class="tip-card__label">Ví dụ cụ thể khi đặt mốc 20:</div>
          <div class="tip-card__desc" style="display: flex; flex-direction: column; gap: var(--space-1); margin-top: 4px;">
            <div>• Job có 8 người nộp (dưới 20): Ít đối thủ, cộng đủ 20 điểm.</div>
            <div>• Job có 45 người nộp (trên 20): Bắt đầu đông đối thủ, giảm còn 10 điểm.</div>
            <div>• Job có 80 người nộp: Quá nhiều người tham gia, giảm còn 5 điểm.</div>
            <div>• Job trên 100 người nộp: Quá tải chào thầu, nhận 0 điểm cạnh tranh.</div>
          </div>
        </div>

        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">Hướng dẫn điều chỉnh</div>
          <div class="tip-card__desc">
            • Đặt 15 - 25: Ưu tiên công việc mới đăng chưa bị nộp dồn dập.<br>
            • Đặt 50 - 100: Nới lỏng tiêu chuẩn nếu muốn thấy nhiều công việc hơn.
          </div>
        </div>

        <div class="tip-card__footer">
          <span>Rê chuột để xem nhanh • Click vào biểu tượng để ghim mở • Bấm Esc để đóng</span>
        </div>
      </div>
    `,
  },
  'platforms': {
    title: 'Sàn việc làm & Nguồn tuyển dụng',
    badge: 'Multi-Source',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Sàn việc làm & Nguồn tuyển dụng</span>
          <span class="tip-card__badge">Multi-Source</span>
        </div>
        <div class="tip-card__desc">
          Chọn các sàn việc làm muốn quét tự động: Freelancer.com, Upwork, We Work Remotely, RemoteOK, Jobicy. Hệ thống chuẩn hóa dữ liệu về cùng thang điểm 100 thống nhất.
        </div>
      </div>
    `,
  },
  'skills-core': {
    title: 'Kỹ năng yêu cầu (Core Skills)',
    badge: 'Bắt buộc',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Kỹ năng yêu cầu (Core Skills)</span>
          <span class="tip-card__badge">Bắt buộc</span>
        </div>
        <div class="tip-card__desc">
          Công việc phải có ít nhất một kỹ năng trong nhóm này. Nếu không có, công việc sẽ bị chuyển sang mục Loại bỏ.<br>
          Khớp 1 kỹ năng: cộng 20đ. Khớp từ 2 kỹ năng: cộng 30đ. Bỏ chọn kỹ năng nào thì kỹ năng đó sẽ chuyển xuống Kỹ năng khác.
        </div>
      </div>
    `,
  },
  'skills-support': {
    title: 'Kỹ năng phụ (Support Skills)',
    badge: 'Cộng điểm',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Kỹ năng phụ (Support Skills)</span>
          <span class="tip-card__badge">Cộng điểm</span>
        </div>
        <div class="tip-card__desc">
          Nhóm kỹ năng bổ trợ không bắt buộc. Mỗi kỹ năng phụ phù hợp được cộng thêm 10đ (tối đa 20đ). Bỏ chọn kỹ năng nào thì kỹ năng đó sẽ chuyển xuống Kỹ năng khác.
        </div>
      </div>
    `,
  },
  'skills-exclude': {
    title: 'Kỹ năng loại trừ (Exclude)',
    badge: 'Loại bỏ',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Kỹ năng loại trừ (Exclude)</span>
          <span class="tip-card__badge" style="background: var(--color-danger-soft); color: var(--color-danger-text); border-color: var(--color-danger-border);">Loại bỏ</span>
        </div>
        <div class="tip-card__desc">
          Các kỹ năng bạn không nhận làm. Bất kỳ công việc nào chứa kỹ năng trong nhóm này sẽ bị loại ngay lập tức.<br>
          Chọn lại vào ô checkbox để chuyển kỹ năng trở lại nhóm phía trên.
        </div>
      </div>
    `,
  },
};

/**
 * Initialize global custom tooltip system
 */
export function initTooltips() {
  let tooltipEl = document.getElementById('appTooltip');
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'appTooltip';
    tooltipEl.className = 'app-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    tooltipEl.setAttribute('aria-hidden', 'true');
    tooltipEl.innerHTML = `
      <div class="app-tooltip__card">
        <div class="app-tooltip__content"></div>
      </div>
      <div class="app-tooltip__arrow"></div>
    `;
    document.body.appendChild(tooltipEl);
  }

  const contentEl = tooltipEl.querySelector('.app-tooltip__content');
  const arrowEl = tooltipEl.querySelector('.app-tooltip__arrow');

  let showTimer = null;
  let hideTimer = null;
  let currentTarget = null;
  let isPinned = false;

  function getContent(el) {
    const tipId = el.dataset.tooltipId;
    if (tipId && TOOLTIPS[tipId]) {
      return TOOLTIPS[tipId].html;
    }
    if (el.dataset.tooltipHtml) {
      return el.dataset.tooltipHtml;
    }
    if (el.dataset.tooltip) {
      return `<div class="tip-simple">${el.dataset.tooltip}</div>`;
    }
    return '';
  }

  function positionTooltip(target) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const margin = 10;

    // Determine vertical placement: top if space permits, else bottom
    const spaceAbove = targetRect.top - tooltipRect.height - margin;
    const placement = spaceAbove >= margin ? 'top' : 'bottom';

    let top = 0;
    if (placement === 'top') {
      top = targetRect.top - tooltipRect.height - margin;
      tooltipEl.classList.remove('app-tooltip--bottom');
      tooltipEl.classList.add('app-tooltip--top');
    } else {
      top = targetRect.bottom + margin;
      tooltipEl.classList.remove('app-tooltip--top');
      tooltipEl.classList.add('app-tooltip--bottom');
    }

    // Determine horizontal placement (center-aligned with bounds checking)
    const targetCenter = targetRect.left + targetRect.width / 2;
    let left = targetCenter - tooltipRect.width / 2;

    const minLeft = margin;
    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    tooltipEl.style.top = `${Math.round(top)}px`;
    tooltipEl.style.left = `${Math.round(left)}px`;

    // Center arrow over trigger
    if (arrowEl) {
      const arrowLeft = targetCenter - left - 5;
      const boundedArrowLeft = Math.max(14, Math.min(arrowLeft, tooltipRect.width - 24));
      arrowEl.style.left = `${Math.round(boundedArrowLeft)}px`;
    }
  }

  function show(target, pin = false) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);

    // Convert native title attribute to prevent browser default tooltip
    if (target.hasAttribute('title')) {
      target.dataset.tooltip = target.getAttribute('title');
      target.removeAttribute('title');
    }

    const html = getContent(target);
    if (!html) return;

    currentTarget = target;
    isPinned = pin;

    contentEl.innerHTML = html;
    tooltipEl.classList.remove('is-visible', 'app-tooltip--top', 'app-tooltip--bottom');
    tooltipEl.style.left = '-9999px';
    tooltipEl.style.top = '-9999px';

    if (isPinned) {
      tooltipEl.classList.add('is-pinned');
    } else {
      tooltipEl.classList.remove('is-pinned');
    }

    // Position after rendering DOM
    requestAnimationFrame(() => {
      positionTooltip(target);
      tooltipEl.classList.add('is-visible');
      tooltipEl.setAttribute('aria-hidden', 'false');
    });
  }

  function scheduleShow(target) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    showTimer = setTimeout(() => show(target, false), 140);
  }

  function hide(immediate = false) {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);

    if (immediate) {
      isPinned = false;
      currentTarget = null;
      tooltipEl.classList.remove('is-visible', 'is-pinned');
      tooltipEl.setAttribute('aria-hidden', 'true');
    } else {
      hideTimer = setTimeout(() => {
        if (!isPinned) {
          currentTarget = null;
          tooltipEl.classList.remove('is-visible', 'is-pinned');
          tooltipEl.setAttribute('aria-hidden', 'true');
        }
      }, 120);
    }
  }

  // Delegated event handling
  document.addEventListener('pointerover', (e) => {
    if (isPinned) return;
    const trigger = e.target.closest('[data-tooltip-id], [data-tooltip], [data-tooltip-html], .tip-icon, [title]');
    if (trigger) {
      scheduleShow(trigger);
    }
  });

  document.addEventListener('pointerout', (e) => {
    if (isPinned) return;
    const trigger = e.target.closest('[data-tooltip-id], [data-tooltip], [data-tooltip-html], .tip-icon, [title]');
    if (!trigger) return;

    const to = e.relatedTarget;
    if (to && (trigger.contains(to) || tooltipEl.contains(to))) {
      return;
    }
    hide();
  });

  // Keep tooltip open when pointer moves inside the tooltip itself
  tooltipEl.addEventListener('pointerenter', () => {
    clearTimeout(hideTimer);
  });

  tooltipEl.addEventListener('pointerleave', () => {
    if (!isPinned) hide();
  });

  // Click on trigger to toggle pin
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-tooltip-id], [data-tooltip], .tip-icon');
    if (trigger) {
      if (isPinned && currentTarget === trigger) {
        hide(true);
      } else {
        show(trigger, true);
      }
      return;
    }

    // Click outside to dismiss pinned tooltip
    if (isPinned && !tooltipEl.contains(e.target)) {
      hide(true);
    }
  });

  // Escape key to dismiss
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tooltipEl.classList.contains('is-visible')) {
      hide(true);
    }
  });

  // Window resize & scroll repositioning
  window.addEventListener('scroll', () => {
    if (currentTarget && tooltipEl.classList.contains('is-visible')) {
      positionTooltip(currentTarget);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (currentTarget && tooltipEl.classList.contains('is-visible')) {
      positionTooltip(currentTarget);
    }
  }, { passive: true });
}
