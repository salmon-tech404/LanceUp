/**
 * Freelancer.com Public API Client
 * Includes graceful offline fallback to verified snapshot
 */
import { FREELANCER_SNAPSHOT } from './fixtures/snapshots.js';
import { withTimeout } from '../utils/security.js';

export function normalizeProject(raw) {
  return {
    id: raw.id,
    platform: 'freelancer',
    title: raw.title,
    seoUrl: raw.seo_url,
    url: raw.seo_url ? `https://www.freelancer.com/projects/${raw.seo_url}` : `https://www.freelancer.com/projects/${raw.id}`,
    type: raw.type === 'hourly' ? 'hourly' : 'fixed',
    currency: raw.currency ? raw.currency.code : 'USD',
    budgetMin: raw.budget ? raw.budget.minimum : 0,
    budgetMax: raw.budget ? raw.budget.maximum : 0,
    bids: raw.bid_stats ? raw.bid_stats.bid_count : (raw.bids || 0),
    submittedAt: raw.submitdate || raw.time_updated || Math.floor(Date.now() / 1000),
    skills: (raw.jobs || []).map(s => ({
      ...s,
      name: s.id === 319 ? 'AWS' : s.id === 1610 ? 'Azure' : s.id === 1184 ? 'Google' : s.name,
    })),
    description: raw.description || raw.preview_description || '',
    client: {},
  };
}

export async function fetchProjects(coreSkillIds = []) {
  try {
    const params = new URLSearchParams();
    params.set('job_details', 'true');
    params.set('full_description', 'true');
    params.set('limit', '100');

    for (const skillId of coreSkillIds) {
      params.append('jobs[]', String(skillId));
    }

    const url = `https://www.freelancer.com/api/projects/0.1/projects/active/?${params.toString()}`;
    
    const fetchPromise = fetch(url, { headers: { Accept: 'application/json' } })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      });

    const data = await withTimeout(fetchPromise, 6000, 'Freelancer API timeout');
    if (data && data.result && Array.isArray(data.result.projects)) {
      return data.result.projects.map(normalizeProject);
    }
    return FREELANCER_SNAPSHOT.jobs.map(normalizeProject);
  } catch (err) {
    console.warn('Freelancer API fetch failed, using snapshot fallback:', err.message);
    return FREELANCER_SNAPSHOT.jobs.map(normalizeProject);
  }
}

export async function fetchCurrencies() {
  try {
    const fetchPromise = fetch('https://www.freelancer.com/api/projects/0.1/currencies/', {
      headers: { Accept: 'application/json' },
    }).then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });

    const data = await withTimeout(fetchPromise, 4000, 'Currencies timeout');
    if (data && data.result && Array.isArray(data.result.currencies)) {
      const rates = {};
      data.result.currencies.forEach(c => {
        if (c.code && typeof c.exchange_rate === 'number') {
          rates[c.code] = c.exchange_rate;
        }
      });
      return rates;
    }
    return getFallbackFxRates();
  } catch (err) {
    return getFallbackFxRates();
  }
}

function getFallbackFxRates() {
  const captured = FREELANCER_SNAPSHOT.capturedAt ? new Date(FREELANCER_SNAPSHOT.capturedAt).getTime() : 0;
  const ageHours = (Date.now() - captured) / (1000 * 3600);
  if (ageHours > 24) {
    console.warn(`[LanceUp] Tỷ giá snapshot dự phòng đã cũ (${ageHours.toFixed(1)}h), có thể có chênh lệch nhỏ.`);
  }
  return FREELANCER_SNAPSHOT.fxRates;
}

