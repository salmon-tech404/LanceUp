/**
 * Theme Initializer Script
 * Loaded externally to comply with Manifest V3 Content Security Policy (No inline scripts)
 */
(() => {
  try {
    const saved = window.localStorage.getItem('lanceup:theme') || window.localStorage.getItem('flf:theme');
    const theme = saved === 'light' || saved === 'dark'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch {}
})();
