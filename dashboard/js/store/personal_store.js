/**
 * Personal Store: Starred, Hidden & Viewed Jobs
 * Persists in localStorage (lanceup:v1)
 */
import { STORAGE_KEYS } from '../../../shared/config/constants.js';

function readIds(value) {
  return Array.isArray(value)
    ? value.filter(n => (typeof n === 'number' && Number.isFinite(n)) || (typeof n === 'string' && n.length > 0))
    : [];
}

export function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.PERSONAL_STORE) || window.localStorage.getItem('flf:v1');
    if (!raw) return { starred: new Set(), hidden: new Set(), viewed: new Set() };
    const data = JSON.parse(raw);
    return {
      starred: new Set(readIds(data.starred)),
      hidden: new Set(readIds(data.hidden)),
      viewed: new Set(readIds(data.viewed)),
    };
  } catch {
    return { starred: new Set(), hidden: new Set(), viewed: new Set() };
  }
}

export function writeStore(store) {
  try {
    const payload = {
      starred: [...store.starred],
      hidden: [...store.hidden],
      viewed: [...store.viewed],
    };
    window.localStorage.setItem(STORAGE_KEYS.PERSONAL_STORE, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save personal store:', err);
  }
}
