/**
 * Domain Logic: Transparent Scoring Engine (0 - 100 points)
 * Budget (max 40) + Technology (max 40) + Competition (max 20)
 */
import { SCORING } from '../config/constants.js';

export function tierPoints(tiers, value) {
  const tier = tiers.find(([threshold]) => value >= threshold);
  return tier ? tier[1] : 0;
}

export function competitionPoints(bids, fewBids) {
  if (bids <= fewBids) return SCORING.fewBidsPoints;
  const tier = SCORING.bidTiers.find(([maxBids]) => bids <= maxBids);
  return tier ? tier[1] : 0;
}

export function scoreJob(job, maxUsd, matchedCore, matchedSupport, cfg) {
  const budgetTiers = job.type === 'hourly' ? SCORING.budgetHourly : SCORING.budgetFixed;
  const budget = tierPoints(budgetTiers, maxUsd);
  const technology =
    (matchedCore.length >= 2 ? SCORING.techMultiCore : SCORING.techSingleCore) +
    (matchedSupport.length > 0 ? SCORING.techSupportBonus : 0);
  const competition = competitionPoints(job.bids, cfg.fewBids);

  return { budget, technology, competition };
}
