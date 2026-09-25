/**
 * Filter Store: Criteria & Settings Persistence
 * Persists in localStorage (lanceup:filters)
 */
import { STORAGE_KEYS, DEFAULTS, ALL_PLATFORM_IDS } from '../../../shared/config/constants.js';
import { SKILL_GROUPS } from '../../../shared/config/skills.js';

export function readFilters() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.FILTERS) || window.localStorage.getItem('flf:filters');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const validPlatforms = Array.isArray(parsed.platforms)
      ? parsed.platforms.filter(p => ALL_PLATFORM_IDS.includes(p))
      : DEFAULTS.platforms;


    return {
      platforms: validPlatforms.length > 0 ? validPlatforms : DEFAULTS.platforms,
      core: Array.isArray(parsed.core) ? parsed.core.filter(n => typeof n === 'number') : SKILL_GROUPS.core.map(s => s.id),
      support: Array.isArray(parsed.support) ? parsed.support.filter(n => typeof n === 'number') : SKILL_GROUPS.support.map(s => s.id),
      exclude: Array.isArray(parsed.exclude) ? parsed.exclude.filter(n => typeof n === 'number') : SKILL_GROUPS.exclude.map(s => s.id),
      minFixed: typeof parsed.minFixed === 'number' ? parsed.minFixed : DEFAULTS.minFixed,
      minHourly: typeof parsed.minHourly === 'number' ? parsed.minHourly : DEFAULTS.minHourly,
      minScore: typeof parsed.minScore === 'number' ? parsed.minScore : DEFAULTS.minScore,
      fewBids: typeof parsed.fewBids === 'number' ? parsed.fewBids : DEFAULTS.fewBids,
      showDiscarded: Boolean(parsed.showDiscarded),
      sort: typeof parsed.sort === 'string' ? parsed.sort : DEFAULTS.sort,
    };
  } catch {
    return null;
  }
}

export function writeFilters(state) {
  try {
    const payload = {
      platforms: state.platforms || DEFAULTS.platforms,
      core: [...(state.core || [])],
      support: [...(state.support || [])],
      exclude: [...(state.exclude || [])],
      minFixed: state.minFixed,
      minHourly: state.minHourly,
      minScore: state.minScore,
      fewBids: state.fewBids,
      showDiscarded: state.showDiscarded,
      sort: state.sort,
    };
    window.localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save filter settings:', err);
  }
}
