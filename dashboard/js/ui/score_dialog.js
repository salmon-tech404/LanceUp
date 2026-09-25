/**
 * Score Breakdown Modal Dialog
 */
import { icon } from '../../../shared/utils/icons.js';

export function showScoreModal(evaluation) {
  const { job, score, breakdown } = evaluation;
  if (!breakdown) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.className = 'modal-overlay';
  modalOverlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="scoreModalTitle">
      <div class="modal__head">
        <h3 id="scoreModalTitle" class="heading">Phân rã điểm chất lượng: ${score}/100</h3>
        <button type="button" class="btn btn--ghost btn--icon" data-action="close">
          ${icon('x', 'sm')}
        </button>
      </div>

      <div style="font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-2);">
        ${job.title}
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-3); border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); padding: var(--space-3) 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: var(--weight-medium); color: var(--color-text);">1. Thù lao khách trả (Tối đa 40đ)</div>
            <div class="caption">Tính theo mức trần ngân sách quy đổi USD</div>
          </div>
          <span style="font-size: var(--text-lg); font-weight: var(--weight-strong); color: var(--color-accent-text);">${breakdown.budget}đ</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: var(--weight-medium); color: var(--color-text);">2. Độ khớp công nghệ (Tối đa 40đ)</div>
            <div class="caption">30đ cho ≥2 core skills (20đ cho 1 skill) + 10đ bonus kỹ năng phụ</div>
          </div>
          <span style="font-size: var(--text-lg); font-weight: var(--weight-strong); color: var(--color-accent-text);">${breakdown.technology}đ</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: var(--weight-medium); color: var(--color-text);">3. Mức độ cạnh tranh (Tối đa 20đ)</div>
            <div class="caption">20đ nếu số lượng bid ít, giảm dần theo mật độ cạnh tranh</div>
          </div>
          <span style="font-size: var(--text-lg); font-weight: var(--weight-strong); color: var(--color-accent-text);">${breakdown.competition}đ</span>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end;">
        <button type="button" class="btn btn--secondary" data-action="close">Đóng</button>
      </div>
    </div>
  `;

  const close = () => modalOverlay.remove();
  modalOverlay.querySelectorAll('[data-action="close"]').forEach(btn => btn.addEventListener('click', close));
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) close();
  });

  document.body.appendChild(modalOverlay);
}
