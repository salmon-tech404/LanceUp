/**
 * Canonical Skill Catalog & Skill Groups (Verified against live APIs)
 */

export const SKILL_GROUPS = {
  core: [
    { id: 759, name: 'React.js' },
    { id: 2376, name: 'Next.js' },
    { id: 3286, name: 'Vite' },
    { id: 979, name: 'TypeScript' },
    { id: 9, name: 'JavaScript' },
    { id: 2435, name: 'Tailwind CSS' },
    { id: 500, name: 'Node.js' },
    { id: 13, name: 'Python' },
    { id: 2688, name: 'FastAPI' },
    { id: 7, name: 'Java' },
    { id: 1119, name: 'Java Spring' },
    { id: 1678, name: 'DevOps' },
    { id: 319, name: 'AWS' },
    { id: 1610, name: 'Azure' },
    { id: 1184, name: 'Google' },
    { id: 989, name: 'Blockchain' },
    { id: 2060, name: 'Solidity' },
    { id: 2061, name: 'Smart Contracts' },
  ],
  support: [
    { id: 335, name: 'HTML' },
    { id: 323, name: 'HTML5' },
    { id: 77, name: 'CSS' },
    { id: 1042, name: 'CSS3' },
    { id: 1002, name: 'Docker' },
    { id: 1541, name: 'Kubernetes' },
    { id: 741, name: 'Git' },
  ],
  exclude: [
    { id: 3, name: 'PHP' },
    { id: 69, name: 'WordPress' },
    { id: 788, name: 'WooCommerce' },
    { id: 502, name: 'Shopify' },
    { id: 90, name: 'Magento' },
    { id: 873, name: 'Wix' },
    { id: 875, name: 'Squarespace' },
    { id: 304, name: 'Prestashop' },
    { id: 106, name: 'C# Programming' },
    { id: 15, name: '.NET' },
    { id: 690, name: 'ASP.NET' },
  ],
};

export const SKILL_SHORT_NAMES = {
  319: 'AWS',
  1610: 'Azure',
  1184: 'Google',
};

export const ALL_CATALOG_SKILLS = [
  ...SKILL_GROUPS.core.map(s => ({ ...s, origin: 'core' })),
  ...SKILL_GROUPS.support.map(s => ({ ...s, origin: 'support' })),
  ...SKILL_GROUPS.exclude.map(s => ({ ...s, origin: 'other' })),
];

export const SKILL_ORIGIN_MAP = new Map();
ALL_CATALOG_SKILLS.forEach(s => {
  SKILL_ORIGIN_MAP.set(s.id, s.origin);
});
