/**
 * Upwork Job Data Parser & Normalizer
 * Resolves skills to canonical catalog, parses proposals and budgets accurately
 */
import { SKILL_GROUPS } from '../config/skills.js';

// Build canonical lookup table
const CANONICAL_SKILL_MAP = new Map();

function register(alias, skill) {
  CANONICAL_SKILL_MAP.set(alias.toLowerCase().trim(), skill);
}

Object.values(SKILL_GROUPS).forEach(group => {
  group.forEach(s => register(s.name, s));
});

// Common Upwork alias mappings
register('react', { id: 759, name: 'React.js' });
register('reactjs', { id: 759, name: 'React.js' });
register('react.js', { id: 759, name: 'React.js' });
register('nextjs', { id: 2376, name: 'Next.js' });
register('next.js', { id: 2376, name: 'Next.js' });
register('next js', { id: 2376, name: 'Next.js' });
register('vite', { id: 3286, name: 'Vite' });
register('typescript', { id: 979, name: 'TypeScript' });
register('ts', { id: 979, name: 'TypeScript' });
register('javascript', { id: 9, name: 'JavaScript' });
register('js', { id: 9, name: 'JavaScript' });
register('tailwind', { id: 2435, name: 'Tailwind CSS' });
register('tailwindcss', { id: 2435, name: 'Tailwind CSS' });
register('tailwind css', { id: 2435, name: 'Tailwind CSS' });
register('nodejs', { id: 500, name: 'Node.js' });
register('node.js', { id: 500, name: 'Node.js' });
register('python', { id: 13, name: 'Python' });
register('python 3', { id: 13, name: 'Python' });
register('fastapi', { id: 2688, name: 'FastAPI' });
register('java', { id: 7, name: 'Java' });
register('java spring', { id: 1119, name: 'Java Spring' });
register('spring boot', { id: 1119, name: 'Java Spring' });
register('devops', { id: 1678, name: 'DevOps' });
register('aws', { id: 319, name: 'AWS' });
register('amazon web services', { id: 319, name: 'AWS' });
register('azure', { id: 1610, name: 'Azure' });
register('microsoft azure', { id: 1610, name: 'Azure' });
register('google cloud', { id: 1184, name: 'Google' });
register('gcp', { id: 1184, name: 'Google' });
register('blockchain', { id: 989, name: 'Blockchain' });
register('solidity', { id: 2060, name: 'Solidity' });
register('smart contracts', { id: 2061, name: 'Smart Contracts' });
register('html', { id: 335, name: 'HTML' });
register('html5', { id: 323, name: 'HTML5' });
register('css', { id: 77, name: 'CSS' });
register('css3', { id: 1042, name: 'CSS3' });
register('docker', { id: 1002, name: 'Docker' });
register('kubernetes', { id: 1541, name: 'Kubernetes' });
register('git', { id: 741, name: 'Git' });
register('php', { id: 3, name: 'PHP' });
register('wordpress', { id: 69, name: 'WordPress' });
register('woocommerce', { id: 788, name: 'WooCommerce' });
register('shopify', { id: 502, name: 'Shopify' });
register('magento', { id: 90, name: 'Magento' });
register('c#', { id: 106, name: 'C# Programming' });
register('.net', { id: 15, name: '.NET' });
register('asp.net', { id: 690, name: 'ASP.NET' });

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 100000;
}

export function normalizeSkill(skillName) {
  const clean = String(skillName || '').trim();
  const matched = CANONICAL_SKILL_MAP.get(clean.toLowerCase());
  if (matched) return matched;
  return {
    id: 800000 + hashStr(clean),
    name: clean,
  };
}

export function parseProposals(text) {
  if (!text) return 10;
  const lower = String(text).toLowerCase();
  if (lower.includes('less than 5') || lower.includes('< 5') || lower.includes('under 5')) return 3;
  if (lower.includes('5 to 10') || lower.includes('5-10')) return 7;
  if (lower.includes('10 to 15') || lower.includes('10-15')) return 12;
  if (lower.includes('15 to 20') || lower.includes('15-20')) return 17;
  if (lower.includes('20 to 50') || lower.includes('20-50')) return 35;
  if (lower.includes('50+') || lower.includes('50 or more') || lower.includes('> 50')) return 60;

  const numbers = text.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const num = parseInt(numbers[0], 10);
    if (!isNaN(num)) return num;
  }
  return 10;
}

/**
 * Parses Upwork budget text.
 * Claude Review Fix: Fallback to 0 if unknown rather than inflating with fictitious numbers.
 */
export function parseBudget(text) {
  if (!text) {
    return { type: 'fixed', budgetMin: 0, budgetMax: 0, currency: 'USD' };
  }

  const isHourly = /hourly|\/hr|\/hour/i.test(text);
  const cleaned = text.replace(/,/g, '');
  const matches = cleaned.match(/\$\s*(\d+(?:\.\d+)?)/g);

  if (!matches || matches.length === 0) {
    return {
      type: isHourly ? 'hourly' : 'fixed',
      budgetMin: 0,
      budgetMax: 0,
      currency: 'USD',
    };
  }

  const amounts = matches
    .map(m => parseFloat(m.replace(/[$\s]/g, '')))
    .filter(n => !isNaN(n));

  if (amounts.length >= 2) {
    const sorted = [...amounts].sort((a, b) => a - b);
    return {
      type: isHourly ? 'hourly' : 'fixed',
      budgetMin: sorted[0],
      budgetMax: sorted[sorted.length - 1],
      currency: 'USD',
    };
  }

  const single = amounts[0] || 0;
  return {
    type: isHourly ? 'hourly' : 'fixed',
    budgetMin: single,
    budgetMax: single,
    currency: 'USD',
  };
}

export function parseUpworkJob(raw, fallbackIndex = 0) {
  const budget = parseBudget(raw.budgetText);
  const bids = parseProposals(raw.proposalsText);
  const skills = (raw.skills || []).map(normalizeSkill);
  const id = raw.id || `up-${Date.now()}-${fallbackIndex}`;

  return {
    id,
    platform: 'upwork',
    title: String(raw.title || '').trim(),
    url: raw.url || `https://www.upwork.com/jobs/${id}`,
    type: budget.type,
    currency: budget.currency,
    budgetMin: budget.budgetMin,
    budgetMax: budget.budgetMax,
    bids,
    submittedAt: raw.postedAt || Math.floor(Date.now() / 1000) - fallbackIndex * 600,
    skills,
    description: String(raw.description || '').trim(),
    client: raw.client || {},
  };
}
