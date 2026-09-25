/**
 * Domain Logic: Evaluation & Filtering Rules (FJ-DATA-004)
 */
import { SKILL_GROUPS, SKILL_SHORT_NAMES } from '../config/skills.js';
import { scoreJob } from './scoring.js';

export function toUsd(amount, currency, rates) {
  if (currency === 'USD') return amount;
  if (!rates || typeof rates !== 'object') return null;
  const rate = rates[currency];
  return typeof rate === 'number' ? Math.round(amount * rate * 100) / 100 : null;
}


export function reasonText(reason) {
  if (!reason) return '';
  switch (reason.kind) {
    case 'excluded':
      return `Chứa kỹ năng loại trừ: ${reason.names.join(', ')}`;
    case 'no-core':
      return 'Không chứa kỹ năng yêu cầu nào';
    case 'fx-unknown':
      return `Không thể quy đổi ngoại tệ (${reason.currency})`;
    case 'budget-low':
      if (!reason.usd) {
        return `Chưa rõ ngân sách (thấp hơn mức tối thiểu $${reason.threshold}${reason.hourly ? '/giờ' : ''})`;
      }
      return `Ngân sách $${Math.round(reason.usd)} ${reason.hourly ? '/giờ' : ''} thấp hơn mức tối thiểu $${reason.threshold}`;

    case 'score-low':
      return `Điểm chất lượng ${reason.score} chưa đạt mức tối thiểu ${reason.threshold}`;
    default:
      return 'Không đạt tiêu chí lọc';
  }
}

export function evaluateJob(job, cfg, rates = { USD: 1 }) {
  const maxUsd = toUsd(job.budgetMax, job.currency, rates);
  const base = {
    job,
    maxUsd,
    score: null,
    breakdown: null,
    matchedCore: [],
    matchedSupport: [],
  };

  // 1. Any excluded skill: discard
  const excluded = job.skills.filter(skill => cfg.exclude && cfg.exclude.has(skill.id));
  if (excluded.length > 0) {
    return {
      ...base,
      status: 'discarded',
      reason: {
        kind: 'excluded',
        names: excluded.map(s => SKILL_SHORT_NAMES[s.id] || s.name),
      },
    };
  }

  // 2. No core required skill: discard
  const matchedCore = job.skills.filter(skill => cfg.core && cfg.core.has(skill.id));
  if (matchedCore.length === 0) {
    return { ...base, status: 'discarded', reason: { kind: 'no-core' } };
  }


  // 3. Unknown currency: discard
  if (maxUsd === null) {
    return { ...base, status: 'discarded', reason: { kind: 'fx-unknown', currency: job.currency } };
  }

  // 4. Budget below threshold: discard
  const threshold = job.type === 'hourly' ? cfg.minHourly : cfg.minFixed;
  if (maxUsd < threshold) {
    return {
      ...base,
      status: 'discarded',
      reason: {
        kind: 'budget-low',
        usd: maxUsd,
        threshold,
        hourly: job.type === 'hourly',
      },
    };
  }

  // 5. Calculate Score
  const matchedSupport = job.skills.filter(skill => cfg.support.has(skill.id));
  const breakdown = scoreJob(job, maxUsd, matchedCore, matchedSupport, cfg);
  const score = breakdown.budget + breakdown.technology + breakdown.competition;

  // 6. Score below minScore: discard
  if (score < cfg.minScore) {
    return {
      ...base,
      status: 'discarded',
      score,
      breakdown,
      matchedCore,
      matchedSupport,
      reason: { kind: 'score-low', score, threshold: cfg.minScore },
    };
  }

  // Passed!
  return {
    ...base,
    status: 'passed',
    score,
    breakdown,
    matchedCore,
    matchedSupport,
    reason: null,
  };
}
