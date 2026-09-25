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
          <div class="tip-card__label">🎯 Con số này (ví dụ 60) là gì?</div>
          <div class="tip-card__desc">
            Đây là <strong>điểm sàn chất lượng tối thiểu</strong> bạn đặt ra. Bất kỳ công việc nào có điểm tổng kết 
            <strong style="color: var(--color-success-text);">&ge; 60đ</strong> sẽ được đưa vào danh sách 
            <strong>"Đạt yêu cầu"</strong>. Công việc <strong style="color: var(--color-danger-text);">&lt; 60đ</strong> 
            sẽ tự động bị <strong>"Loại bỏ"</strong> và ẩn đi để bạn không tốn thời gian đọc.
          </div>
        </div>

        <div class="tip-card__block">
          <div class="tip-card__label">📊 Điểm 100 từ đâu ra? Cách tính:</div>
          <div class="tip-card__formula">
            <div class="tip-card__formula-row">
              <span class="tip-tag tip-tag--budget">1. Thù lao (tối đa 40đ)</span>
              <span>Ngân sách càng cao điểm càng nhiều: Job &ge; $2,500 hoặc &ge; $60/h: <strong>40đ</strong>; &ge; $750 hoặc &ge; $35/h: <strong>30đ</strong>; &ge; $250 hoặc &ge; $20/h: <strong>20đ</strong>.</span>
            </div>
            <div class="tip-card__formula-row">
              <span class="tip-tag tip-tag--tech">2. Kỹ năng (tối đa 40đ)</span>
              <span>Khớp từ 2 kỹ năng yêu cầu (Core): <strong>30đ</strong> (1 kỹ năng: <strong>20đ</strong>) + Mỗi kỹ năng phụ (Support) cộng thêm: <strong>+10đ</strong> (tối đa 20đ).</span>
            </div>
            <div class="tip-card__formula-row">
              <span class="tip-tag tip-tag--bids">3. Cạnh tranh (tối đa 20đ)</span>
              <span>Số lượng chào thầu &le; mức "Bid ít" của bạn: nhận trọn <strong>20đ</strong> (ít đối thủ cạnh tranh, xác suất chốt hợp đồng cao nhất).</span>
            </div>
          </div>
        </div>

        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">💡 Khi nào nên NÂNG hoặc HẠ điểm này?</div>
          <div class="tip-card__guide-list">
            <div class="tip-card__guide-item">
              <span class="tip-dir tip-dir--up">⬆️ NÂNG LÊN (70 - 85đ) — Khi muốn săn "kèo thơm / job VIP":</span>
              <span>Bộ lọc sẽ siết rất chặt, chỉ giữ lại các việc ngân sách khủng, rất ít đối thủ và trúng tủ 100% kỹ năng. Số lượng job hiển thị sẽ ít đi nhưng đáng giá từng job.</span>
            </div>
            <div class="tip-card__guide-item">
              <span class="tip-dir tip-dir--down">⬇️ HẠ XUỐNG (30 - 50đ) — Khi muốn nhận nhiều việc hơn:</span>
              <span>Nới lỏng tiêu chuẩn để không bỏ sót cơ hội. Chấp nhận các dự án nhỏ hơn, nhiều người nộp hơn hoặc chỉ cần khớp 1 kỹ năng để team luôn có việc làm liên tục.</span>
            </div>
          </div>
        </div>

        <div class="tip-card__footer">
          <span>💡 Rê chuột để xem nhanh • Click vào icon (?) để ghim mở • Bấm Esc để đóng</span>
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
          Mức thù lao dự án tối thiểu theo USD ($) cho cả dự án Fixed. Mọi công việc Fixed có ngân sách thấp hơn con số này sẽ tự động bị <strong>Loại bỏ</strong>.
        </div>
        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">💡 Hướng dẫn điều chỉnh:</div>
          <div class="tip-card__desc">
            • <strong>Nâng lên (300$ - 1,000$):</strong> Bỏ qua các job nhỏ lẻ, tốn thời gian trao đổi.<br>
            • <strong>Hạ xuống (50$ - 150$):</strong> Nhận thêm các dự án task ngắn hạn, giải quyết nhanh kiếm đánh giá tốt.
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
          Mức thù lao trả theo giờ tối thiểu theo USD ($/giờ). Mọi công việc Hourly có đơn giá thấp hơn con số này sẽ tự động bị <strong>Loại bỏ</strong>.
        </div>
        <div class="tip-card__block tip-card__block--guide">
          <div class="tip-card__label">💡 Hướng dẫn điều chỉnh:</div>
          <div class="tip-card__desc">
            Đặt theo mức rate tối thiểu mà team hoặc cá nhân bạn sẵn sàng làm việc (ví dụ 20$/h - 45$/h).
          </div>
        </div>
      </div>
    `,
  },
  'few-bids': {
    title: 'Mức trần chào thầu "Bid ít" (người)',
    badge: 'Độ cạnh tranh',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Mức trần chào thầu "Bid ít" (người)</span>
          <span class="tip-card__badge">Độ cạnh tranh</span>
        </div>
        <div class="tip-card__desc">
          Số lượng nộp hồ sơ/proposals tối đa để nhận trọn <strong>20 điểm cạnh tranh</strong>.
        </div>
        <div class="tip-card__block">
          <div class="tip-card__desc">
            • Job có <strong>&le; số này</strong> (ví dụ &le; 20 bids): Nhận trọn <strong>20đ</strong> (dễ chốt hợp đồng).<br>
            • Job có <strong>nhiều hơn số này</strong>: Bị trừ điểm cạnh tranh dần về 0đ do đối thủ quá đông.
          </div>
        </div>
        <div class="tip-card__footer">
          <span>💡 Khuyên dùng: 15 - 25 bids để ưu tiên các job mới đăng chưa bị spam bid.</span>
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
          Chọn các sàn việc làm muốn quét tự động: <strong>Freelancer.com, Upwork và We Work Remotely</strong>. Hệ thống sẽ chuẩn hóa dữ liệu về cùng một thang đo và bảng điểm 100 minh bạch.
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
          <strong>Bắt buộc:</strong> Job phải có ít nhất 1 kỹ năng trong nhóm này. Nếu không có, job sẽ bị <strong>Loại bỏ</strong> ngay lập tức.<br>
          Khớp 1 kỹ năng: <strong>+20đ</strong>. Khớp từ 2 kỹ năng trở lên: <strong>+30đ</strong>. Bỏ tick kỹ năng nào thì kỹ năng đó sẽ chuyển xuống "Kỹ năng khác".
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
          Không bắt buộc job phải có, nhưng nếu có sẽ được cộng thêm <strong>+10đ</strong> cho mỗi kỹ năng phụ (tối đa <strong>+20đ</strong>). Bỏ tick kỹ năng nào thì kỹ năng đó sẽ chuyển xuống "Kỹ năng khác".
        </div>
      </div>
    `,
  },
  'skills-exclude': {
    title: 'Kỹ năng khác / Loại trừ (Exclude)',
    badge: 'Loại bỏ',
    html: `
      <div class="tip-card">
        <div class="tip-card__header">
          <span class="tip-card__title">Kỹ năng khác / Loại trừ (Exclude)</span>
          <span class="tip-card__badge" style="background: var(--color-danger-soft); color: var(--color-danger-text); border-color: var(--color-danger-border);">Loại bỏ</span>
        </div>
        <div class="tip-card__desc">
          Các kỹ năng bạn không nhận làm. Bất kỳ công việc nào chứa kỹ năng trong nhóm này sẽ bị <strong>Loại bỏ ngay lập tức</strong>.<br>
          Click vào ô checkbox để hoàn tác kỹ năng trở lại nhóm trên.
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
