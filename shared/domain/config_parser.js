/**
 * Filter Configuration Parser & Validator
 * Supports both JSON and YAML formats for team filter sharing
 * Zero dependencies — Pure Native JS
 */
import { DEFAULTS, ALL_PLATFORM_IDS } from '../config/constants.js';

/**
 * Parse YAML text into a structured object for filter config
 */
export function parseYamlFilterConfig(yamlStr) {
  const result = {
    platforms: [],
    thresholds: {},
    core: [],
    support: [],
    exclude: [],
  };

  let currentSection = null;
  const lines = yamlStr.split('\n');

  for (const rawLine of lines) {
    // Strip comments after # unless inside quotes
    const lineWithoutComment = rawLine.replace(/#.*$/, '').trim();
    if (!lineWithoutComment) continue;

    // Check section headers
    if (/^platforms\s*:/i.test(lineWithoutComment)) {
      currentSection = 'platforms';
      continue;
    }
    if (/^thresholds\s*:/i.test(lineWithoutComment)) {
      currentSection = 'thresholds';
      continue;
    }
    if (/^(core_skills|core)\s*:/i.test(lineWithoutComment)) {
      currentSection = 'core';
      continue;
    }
    if (/^(support_skills|support)\s*:/i.test(lineWithoutComment)) {
      currentSection = 'support';
      continue;
    }
    if (/^(exclude_skills|exclude)\s*:/i.test(lineWithoutComment)) {
      currentSection = 'exclude';
      continue;
    }

    // Parse list items or key-values in current section
    if (currentSection === 'platforms') {
      const itemMatch = lineWithoutComment.match(/^-\s*([a-zA-Z0-9_-]+)/);
      if (itemMatch) {
        const p = itemMatch[1].toLowerCase();
        if (ALL_PLATFORM_IDS.includes(p)) {
          result.platforms.push(p);
        }
      }
    } else if (currentSection === 'thresholds') {
      const kvMatch = lineWithoutComment.match(/^([a-zA-Z0-9_]+)\s*:\s*([0-9.]+)/);
      if (kvMatch) {
        const key = kvMatch[1].toLowerCase();
        const val = parseFloat(kvMatch[2]);
        if (key.includes('fixed')) result.thresholds.minFixed = val;
        else if (key.includes('hourly')) result.thresholds.minHourly = val;
        else if (key.includes('score')) result.thresholds.minScore = val;
        else if (key.includes('bids')) result.thresholds.fewBids = val;
      }
    } else if (currentSection === 'core' || currentSection === 'support' || currentSection === 'exclude') {
      const itemMatch = lineWithoutComment.match(/^-\s*(\d+)/);
      if (itemMatch) {
        result[currentSection].push(parseInt(itemMatch[1], 10));
      }
    }
  }

  return result;
}

/**
 * Parse any raw input string (JSON or YAML) and validate against domain schema
 */
export function parseAndValidateFilterConfig(rawText) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Nội dung cấu hình trống.');
  }

  const trimmed = rawText.trim();
  let rawObj = null;

  // Try JSON first if it starts with '{'
  if (trimmed.startsWith('{')) {
    try {
      rawObj = JSON.parse(trimmed);
    } catch (err) {
      throw new Error(`Định dạng JSON không hợp lệ: ${err.message}`);
    }
  } else {
    // Parse as YAML
    try {
      rawObj = parseYamlFilterConfig(trimmed);
    } catch (err) {
      throw new Error(`Định dạng YAML không hợp lệ: ${err.message}`);
    }
  }

  if (!rawObj || typeof rawObj !== 'object') {
    throw new Error('Dữ liệu cấu hình không hợp lệ.');
  }

  // Extract platforms
  const rawPlatforms = Array.isArray(rawObj.platforms) ? rawObj.platforms : [];
  const validPlatforms = ALL_PLATFORM_IDS;
  const platforms = rawPlatforms
    .map(p => String(p).toLowerCase().trim())
    .filter(p => validPlatforms.includes(p));

  // Extract skills
  const core = Array.isArray(rawObj.core || rawObj.core_skills)
    ? (rawObj.core || rawObj.core_skills).map(n => Number(n)).filter(n => !isNaN(n))
    : [];

  const support = Array.isArray(rawObj.support || rawObj.support_skills)
    ? (rawObj.support || rawObj.support_skills).map(n => Number(n)).filter(n => !isNaN(n))
    : [];

  const exclude = Array.isArray(rawObj.exclude || rawObj.exclude_skills)
    ? (rawObj.exclude || rawObj.exclude_skills).map(n => Number(n)).filter(n => !isNaN(n))
    : [];

  if (core.length === 0) {
    throw new Error('Cấu hình bắt buộc phải có ít nhất 1 kỹ năng yêu cầu (core).');
  }

  // Extract thresholds
  const th = rawObj.thresholds || {};
  const minFixed = Math.max(0, Number(th.minFixed ?? th.min_fixed_usd ?? rawObj.minFixed ?? rawObj.min_fixed_usd ?? DEFAULTS.minFixed));
  const minHourly = Math.max(0, Number(th.minHourly ?? th.min_hourly_usd ?? rawObj.minHourly ?? rawObj.min_hourly_usd ?? DEFAULTS.minHourly));
  const minScore = Math.min(100, Math.max(0, Number(th.minScore ?? th.min_quality_score ?? rawObj.minScore ?? rawObj.min_quality_score ?? DEFAULTS.minScore)));
  const fewBids = Math.max(1, Number(th.fewBids ?? th.few_bids_threshold ?? rawObj.fewBids ?? rawObj.few_bids_threshold ?? DEFAULTS.fewBids));

  return {
    platforms: platforms.length > 0 ? platforms : [...DEFAULTS.platforms],
    core,
    support,
    exclude,
    minFixed,
    minHourly,
    minScore,
    fewBids,
    showDiscarded: Boolean(rawObj.showDiscarded ?? DEFAULTS.showDiscarded),
  };
}
