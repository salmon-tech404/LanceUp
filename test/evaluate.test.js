import { test, assertEqual, assertTrue } from './run_tests.js';
import { evaluateJob, toUsd, reasonText } from '../shared/domain/evaluate.js';

export function runEvaluateTests() {
  const baseCfg = {
    core: new Set([759, 979]),     // React, TypeScript
    support: new Set([2435, 741]), // Tailwind CSS, Git
    exclude: new Set([69, 3]),     // WordPress, PHP
    minFixed: 250,
    minHourly: 20,
    minScore: 60,
    fewBids: 20,
  };

  test('toUsd returns exact amount for USD currency', () => {
    assertEqual(toUsd(500, 'USD', { USD: 1 }), 500);
  });

  test('toUsd correctly converts foreign currency using rates', () => {
    const rates = { EUR: 1.1, GBP: 1.3 };
    assertEqual(toUsd(100, 'EUR', rates), 110);
    assertEqual(toUsd(100, 'GBP', rates), 130);
  });

  test('toUsd returns null for unknown currency', () => {
    const rates = { EUR: 1.1 };
    assertEqual(toUsd(100, 'XYZ', rates), null);
  });

  test('evaluateJob passes qualifying job with high score', () => {
    const job = {
      id: 101,
      title: 'Fullstack Next.js Developer',
      type: 'fixed',
      currency: 'USD',
      budgetMin: 500,
      budgetMax: 1500,
      bids: 8,
      skills: [{ id: 759, name: 'React.js' }, { id: 979, name: 'TypeScript' }, { id: 2435, name: 'Tailwind CSS' }],
    };

    const res = evaluateJob(job, baseCfg);
    assertEqual(res.status, 'passed');
    assertEqual(res.score, 100);
    assertEqual(res.reason, null);
    assertEqual(res.matchedCore.length, 2);
    assertEqual(res.matchedSupport.length, 1);
  });

  test('evaluateJob discards job containing excluded skill', () => {
    const job = {
      id: 102,
      title: 'React developer with WordPress theme knowledge',
      type: 'fixed',
      currency: 'USD',
      budgetMin: 500,
      budgetMax: 1500,
      bids: 8,
      skills: [{ id: 759, name: 'React.js' }, { id: 69, name: 'WordPress' }],
    };

    const res = evaluateJob(job, baseCfg);
    assertEqual(res.status, 'discarded');
    assertEqual(res.reason.kind, 'excluded');
    assertTrue(res.reason.names.includes('WordPress'));
  });

  test('evaluateJob discards job without any core skill', () => {
    const job = {
      id: 103,
      title: 'Git and CSS setup',
      type: 'fixed',
      currency: 'USD',
      budgetMin: 500,
      budgetMax: 1500,
      bids: 8,
      skills: [{ id: 2435, name: 'Tailwind CSS' }, { id: 741, name: 'Git' }],
    };

    const res = evaluateJob(job, baseCfg);
    assertEqual(res.status, 'discarded');
    assertEqual(res.reason.kind, 'no-core');
  });

  test('evaluateJob discards job below budget threshold', () => {
    const job = {
      id: 104,
      title: 'Quick React button fix',
      type: 'fixed',
      currency: 'USD',
      budgetMin: 50,
      budgetMax: 100,
      bids: 8,
      skills: [{ id: 759, name: 'React.js' }],
    };

    const res = evaluateJob(job, baseCfg);
    assertEqual(res.status, 'discarded');
    assertEqual(res.reason.kind, 'budget-low');
    assertEqual(res.reason.threshold, 250);
  });

  test('evaluateJob discards job below quality score threshold', () => {
    const job = {
      id: 105,
      title: 'React high bid contest',
      type: 'fixed',
      currency: 'USD',
      budgetMin: 250,
      budgetMax: 260, // 20 budget pts
      bids: 150,      // 0 competition pts
      skills: [{ id: 759, name: 'React.js' }], // 20 tech pts -> total 40 pts < 60 minScore
    };

    const res = evaluateJob(job, baseCfg);
    assertEqual(res.status, 'discarded');
    assertEqual(res.reason.kind, 'score-low');
    assertEqual(res.score, 40);
  });

  test('reasonText formats understandable Vietnamese explanations', () => {
    assertEqual(reasonText({ kind: 'excluded', names: ['WordPress'] }), 'Chứa kỹ năng loại trừ: WordPress');
    assertEqual(reasonText({ kind: 'no-core' }), 'Không chứa kỹ năng yêu cầu nào');
    assertTrue(reasonText({ kind: 'budget-low', usd: 0, threshold: 250 }).includes('Chưa rõ ngân sách'));
    assertTrue(reasonText({ kind: 'score-low', score: 40, threshold: 60 }).includes('chưa đạt'));
  });
}
