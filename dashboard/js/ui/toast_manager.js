/**
 * Non-blocking Toast Feedback Manager
 */
import { icon } from '../../../shared/utils/icons.js';
import { escapeHtml } from '../../../shared/utils/security.js';

let container = null;

export function initToastContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
}

export function showToast(options) {
  const { message, tone = 'info', actionLabel, onAction, duration = 3000 } =
    typeof options === 'string' ? { message: options } : (options || {});
  initToastContainer();


  const toast = document.createElement('div');
  toast.className = `toast toast--${tone}`;
  
  const iconName = tone === 'success' ? 'circle-check' : tone === 'danger' ? 'circle-x' : 'info';
  
  toast.innerHTML = `
    ${icon(iconName, 'sm')}
    <span class="toast__msg">${escapeHtml(message)}</span>
    ${actionLabel ? `<button type="button" class="btn btn--ghost toast__action">${escapeHtml(actionLabel)}</button>` : ''}
  `;

  if (actionLabel && onAction) {
    const actionBtn = toast.querySelector('.toast__action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        onAction();
        toast.remove();
      });
    }
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
