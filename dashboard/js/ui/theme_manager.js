/**
 * Theme Manager: Dark/Light Mode
 */
import { STORAGE_KEYS } from '../../../shared/config/constants.js';

export function getStoredTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.THEME) || window.localStorage.getItem('flf:theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {}
}

export function initTheme(themeToggleBtn) {
  const current = getStoredTheme();
  applyTheme(current);
  updateThemeIcon(themeToggleBtn, current);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(active);
      updateThemeIcon(themeToggleBtn, active);
    });
  }
}

function updateThemeIcon(btn, theme) {
  if (!btn) return;
  const useEl = btn.querySelector('use');
  if (useEl) {
    useEl.setAttribute('href', theme === 'light' ? '#i-moon' : '#i-sun');
  }
  btn.setAttribute('data-tip', theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng');
}
