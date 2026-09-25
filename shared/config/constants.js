/**
 * System Constants & Default Settings
 */

export const STORAGE_KEYS = {
  PERSONAL_STORE: 'lanceup:v1',
  THEME: 'lanceup:theme',
  FILTERS: 'lanceup:filters',
};

export const PLATFORMS = {
  freelancer: {
    id: 'freelancer',
    name: 'Freelancer',
    category: 'freelance',
    categoryLabel: 'Sàn Freelance Truyền Thống',
    badgeClass: 'platform-badge--freelancer',
    icon: 'layers',
    typeTag: 'REST API',
    description: 'API công khai Freelancer.com',
  },
  upwork: {
    id: 'upwork',
    name: 'Upwork',
    category: 'freelance',
    categoryLabel: 'Sàn Freelance Truyền Thống',
    badgeClass: 'platform-badge--upwork',
    icon: 'globe',
    typeTag: 'Session Tab',
    requiresLogin: true,
    description: 'Cào dữ liệu từ phiên đăng nhập Upwork',
  },
  weremotely: {
    id: 'weremotely',
    name: 'We Work Remotely',
    category: 'remote',
    categoryLabel: 'Remote & Tech Global',
    badgeClass: 'platform-badge--weremotely',
    icon: 'briefcase',
    typeTag: 'RSS Feed',
    description: 'Nguồn cấp RSS Tech & Programming',
  },
  remoteok: {
    id: 'remoteok',
    name: 'RemoteOK',
    category: 'remote',
    categoryLabel: 'Remote & Tech Global',
    badgeClass: 'platform-badge--remoteok',
    icon: 'radar',
    typeTag: 'REST API',
    description: 'API việc làm Remote chất lượng cao',
  },
  jobicy: {
    id: 'jobicy',
    name: 'Jobicy',
    category: 'remote',
    categoryLabel: 'Remote & Tech Global',
    badgeClass: 'platform-badge--jobicy',
    icon: 'code-xml',
    typeTag: 'REST API',
    description: 'API việc làm Developer & Engineering',
  },
};

export const ALL_PLATFORM_IDS = Object.keys(PLATFORMS);

export const DEFAULTS = {
  platforms: ['freelancer', 'upwork', 'weremotely', 'remoteok', 'jobicy'],

  minFixed: 250,
  minHourly: 20,
  minScore: 60,
  fewBids: 20,
  sort: 'score',
  showDiscarded: false,
};

export const SCORING = {
  budgetFixed: [[1000, 40], [500, 30], [0, 20]],
  budgetHourly: [[40, 40], [25, 30], [0, 20]],
  techMultiCore: 30,
  techSingleCore: 20,
  techSupportBonus: 10,
  fewBidsPoints: 20,
  bidTiers: [[50, 10], [100, 5]],
};

export const SCORE_MAX = {
  budget: 40,
  technology: 40,
  competition: 20,
  total: 100,
};
