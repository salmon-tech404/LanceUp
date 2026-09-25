import { test, assertEqual } from './run_tests.js';
import { scoreJob, tierPoints, competitionPoints } from '../shared/domain/scoring.js';
import { SCORING } from '../shared/config/constants.js';

export function runScoringTests() {
  test('Fixed budget tiers correctly allocate 40, 30, 20 points', () => {
    assertEqual(tierPoints(SCORING.budgetFixed, 1500), 40);
    assertEqual(tierPoints(SCORING.budgetFixed, 1000), 40);
    assertEqual(tierPoints(SCORING.budgetFixed, 999), 30);
    assertEqual(tierPoints(SCORING.budgetFixed, 500), 30);
    assertEqual(tierPoints(SCORING.budgetFixed, 250), 20);
    assertEqual(tierPoints(SCORING.budgetFixed, 0), 20);
  });

  test('Hourly budget tiers correctly allocate 40, 30, 20 points', () => {
    assertEqual(tierPoints(SCORING.budgetHourly, 50), 40);
    assertEqual(tierPoints(SCORING.budgetHourly, 40), 40);
    assertEqual(tierPoints(SCORING.budgetHourly, 35), 30);
    assertEqual(tierPoints(SCORING.budgetHourly, 25), 30);
    assertEqual(tierPoints(SCORING.budgetHourly, 15), 20);
  });

  test('Competition points reward few bids up to 20 points', () => {
    assertEqual(competitionPoints(5, 20), 20);
    assertEqual(competitionPoints(20, 20), 20);
    assertEqual(competitionPoints(30, 20), 10);
    assertEqual(competitionPoints(50, 20), 10);
    assertEqual(competitionPoints(80, 20), 5);
    assertEqual(competitionPoints(100, 20), 5);
    assertEqual(competitionPoints(150, 20), 0);
  });

  test('scoreJob calculates perfect 100 score for top tier criteria', () => {
    const job = { type: 'fixed', bids: 5 };
    const maxUsd = 1200;
    const matchedCore = [{ id: 759 }, { id: 979 }];
    const matchedSupport = [{ id: 2435 }];
    const cfg = { fewBids: 20 };

    const breakdown = scoreJob(job, maxUsd, matchedCore, matchedSupport, cfg);
    assertEqual(breakdown.budget, 40);
    assertEqual(breakdown.technology, 40); // 30 (multi core) + 10 (support)
    assertEqual(breakdown.competition, 20);

    const total = breakdown.budget + breakdown.technology + breakdown.competition;
    assertEqual(total, 100);
  });

  test('scoreJob gives 20 tech points for single core and no support', () => {
    const job = { type: 'fixed', bids: 5 };
    const maxUsd = 1200;
    const matchedCore = [{ id: 759 }];
    const matchedSupport = [];
    const cfg = { fewBids: 20 };

    const breakdown = scoreJob(job, maxUsd, matchedCore, matchedSupport, cfg);
    assertEqual(breakdown.technology, 20);
  });
}
