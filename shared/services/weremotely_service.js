/**
 * We Work Remotely (WWR) Job Service
 * Fetches remote programming leads directly from public RSS feed with timeout protection
 */
import { ALL_CATALOG_SKILLS } from '../config/skills.js';
import { withTimeout } from '../utils/security.js';

// Pre-compiled regex patterns for skill matching
const SKILL_MATCHERS = ALL_CATALOG_SKILLS.map(skill => {
  // Escape regex special chars in skill name
  const escaped = skill.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match as whole word / boundary
  const pattern = new RegExp(`(?:^|[\\s,.;/()])${escaped}(?:$|[\\s,.;/()])`, 'i');
  return { skill, pattern };
});

export function extractSkillsFromText(text) {
  if (!text) return [];
  const matched = [];
  const seenIds = new Set();

  for (const { skill, pattern } of SKILL_MATCHERS) {
    if (!seenIds.has(skill.id) && pattern.test(text)) {
      seenIds.add(skill.id);
      matched.push({ id: skill.id, name: skill.name });
    }
  }

  // Also match common aliases
  if (/(\bnextjs\b|\bnext\.js\b)/i.test(text) && !seenIds.has(2376)) {
    matched.push({ id: 2376, name: 'Next.js' });
  }
  if (/(\breactjs\b|\breact\.js\b)/i.test(text) && !seenIds.has(759)) {
    matched.push({ id: 759, name: 'React.js' });
  }
  if (/(\bnodejs\b|\bnode\.js\b)/i.test(text) && !seenIds.has(500)) {
    matched.push({ id: 500, name: 'Node.js' });
  }
  if (/(\btailwind\b|\btailwindcss\b)/i.test(text) && !seenIds.has(2435)) {
    matched.push({ id: 2435, name: 'Tailwind CSS' });
  }

  return matched;
}

export function parseWWRBudget(text) {
  if (!text) return { budgetMin: 0, budgetMax: 0, type: 'fixed', currency: 'USD' };

  // Look for salary range first ($90k - $140k or $90k-$140k)
  const rangeKMatch = text.match(/\$\s*(\d{2,3})\s*k\s*[-–—]\s*\$?\s*(\d{2,3})\s*k\b/i);
  if (rangeKMatch) {
    const min = parseInt(rangeKMatch[1], 10) * 1000;
    const max = parseInt(rangeKMatch[2], 10) * 1000;
    return { budgetMin: min, budgetMax: max, type: 'fixed', currency: 'USD' };
  }

  // Look for single $120k
  const kMatch = text.match(/\$\s*(\d{2,3})\s*k\b/i);
  if (kMatch) {
    const amount = parseInt(kMatch[1], 10) * 1000;
    return { budgetMin: amount, budgetMax: amount, type: 'fixed', currency: 'USD' };
  }

  const matches = text.replace(/,/g, '').match(/\$\s*(\d{2,6})/g);
  if (matches && matches.length > 0) {
    const nums = matches.map(m => parseFloat(m.replace(/[$\s]/g, ''))).filter(n => n >= 50);
    if (nums.length >= 2) {
      nums.sort((a, b) => a - b);
      return { budgetMin: nums[0], budgetMax: nums[nums.length - 1], type: 'fixed', currency: 'USD' };
    } else if (nums.length === 1) {
      return { budgetMin: nums[0], budgetMax: nums[0], type: 'fixed', currency: 'USD' };
    }
  }

  return { budgetMin: 0, budgetMax: 0, type: 'fixed', currency: 'USD' };
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

export async function fetchWeRemotelyJobs(limit = 100) {
  const url = 'https://weworkremotely.com/categories/remote-programming-jobs.rss';

  try {
    const fetchPromise = fetch(url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      });

    const xmlText = await withTimeout(fetchPromise, 5000, 'We Work Remotely RSS timeout');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    const items = Array.from(doc.querySelectorAll('item')).slice(0, limit);

    return items.map((item, index) => {
      const title = item.querySelector('title')?.textContent?.trim() || `Remote Job #${index + 1}`;
      const link = item.querySelector('link')?.textContent?.trim() || '';
      const rawDesc = item.querySelector('description')?.textContent?.trim() || '';
      const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';

      const plainDesc = stripHtml(rawDesc);
      const combinedText = `${title} ${plainDesc}`;

      const skills = extractSkillsFromText(combinedText);
      const budget = parseWWRBudget(combinedText);
      const submittedAt = pubDate ? Math.floor(new Date(pubDate).getTime() / 1000) : Math.floor(Date.now() / 1000);

      // Create a deterministic hash from URL/title
      let hash = 0;
      for (let i = 0; i < link.length; i++) {
        hash = (hash << 5) - hash + link.charCodeAt(i);
        hash |= 0;
      }
      const id = `wwr-${Math.abs(hash)}`;

      return {
        id,
        platform: 'weremotely',
        title,
        url: link,
        type: budget.type,
        currency: budget.currency,
        budgetMin: budget.budgetMin,
        budgetMax: budget.budgetMax,
        bids: 0, // Direct application = 0 competition bids
        submittedAt,
        skills,
        description: plainDesc.slice(0, 350),
        client: {},
      };
    });
  } catch (err) {
    console.info('[LanceUp] Không thể lấy RSS We Work Remotely, sử dụng fallback:', err.message);
    return WWR_FALLBACK_JOBS;
  }
}

export const WWR_FALLBACK_JOBS = [
  {
    id: 'wwr-sample-1',
    platform: 'weremotely',
    title: 'Senior Full Stack React & Node.js Engineer (Remote)',
    url: 'https://weworkremotely.com',
    type: 'fixed',
    currency: 'USD',
    budgetMin: 80000,
    budgetMax: 120000,
    bids: 0,
    submittedAt: Math.floor(Date.now() / 1000) - 3600 * 3,
    skills: [
      { id: 759, name: 'React.js' },
      { id: 979, name: 'TypeScript' },
      { id: 500, name: 'Node.js' },
      { id: 319, name: 'AWS' }
    ],
    description: 'We are seeking an experienced Senior Full Stack Engineer proficient with React, TypeScript, and AWS cloud architecture for a 100% remote position.',
    client: {}
  },
  {
    id: 'wwr-sample-2',
    platform: 'weremotely',
    title: 'Lead Python / FastAPI Backend Architect',
    url: 'https://weworkremotely.com',
    type: 'fixed',
    currency: 'USD',
    budgetMin: 90000,
    budgetMax: 140000,
    bids: 0,
    submittedAt: Math.floor(Date.now() / 1000) - 3600 * 6,
    skills: [
      { id: 13, name: 'Python' },
      { id: 2688, name: 'FastAPI' },
      { id: 1002, name: 'Docker' },
      { id: 1541, name: 'Kubernetes' }
    ],
    description: 'Design and scale distributed microservices built with Python and FastAPI running in Kubernetes clusters.',
    client: {}
  }
];
