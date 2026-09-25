/**
 * SVG Sprite Icon Helper
 * Generates an SVG reference to the inline symbol sprite
 */

export function icon(name, size = 'sm', className = '') {
  return `<svg class="icon icon--${size} ${className}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}
