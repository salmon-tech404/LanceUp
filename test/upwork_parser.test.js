import { test, assertEqual, assertTrue } from './run_tests.js';
import { parseBudget, parseProposals, normalizeSkill, parseUpworkJob } from '../shared/services/upwork_parser.js';

export function runParserTests() {
  test('parseBudget handles empty or non-numeric strings safely by returning 0 (Claude Finding 3)', () => {
    const empty = parseBudget('');
    assertEqual(empty.budgetMin, 0);
    assertEqual(empty.budgetMax, 0);

    const nonNumeric = parseBudget('Looking for a top developer with experience');
    assertEqual(nonNumeric.budgetMin, 0);
    assertEqual(nonNumeric.budgetMax, 0);
  });

  test('parseBudget accurately extracts fixed single and range budgets', () => {
    const single = parseBudget('Fixed price - $500 - Intermediate');
    assertEqual(single.type, 'fixed');
    assertEqual(single.budgetMin, 500);
    assertEqual(single.budgetMax, 500);

    const range = parseBudget('Fixed price - $1,000 - $2,500 - Expert');
    assertEqual(range.type, 'fixed');
    assertEqual(range.budgetMin, 1000);
    assertEqual(range.budgetMax, 2500);
  });

  test('parseBudget accurately extracts hourly rates and ranges', () => {
    const hourly = parseBudget('Hourly: $35.00 - $65.00/hr');
    assertEqual(hourly.type, 'hourly');
    assertEqual(hourly.budgetMin, 35);
    assertEqual(hourly.budgetMax, 65);

    const singleHourly = parseBudget('Hourly: $40.00/hour');
    assertEqual(singleHourly.type, 'hourly');
    assertEqual(singleHourly.budgetMin, 40);
    assertEqual(singleHourly.budgetMax, 40);
  });

  test('parseProposals converts text tiers to numbers', () => {
    assertEqual(parseProposals('Less than 5 proposals'), 3);
    assertEqual(parseProposals('5 to 10 proposals'), 7);
    assertEqual(parseProposals('10 to 15 proposals'), 12);
    assertEqual(parseProposals('15 to 20 proposals'), 17);
    assertEqual(parseProposals('20 to 50 proposals'), 35);
    assertEqual(parseProposals('50+ proposals'), 60);
    assertEqual(parseProposals('24 proposals'), 24);
  });

  test('normalizeSkill maps common aliases to canonical catalog IDs', () => {
    assertEqual(normalizeSkill('React').id, 759);
    assertEqual(normalizeSkill('react.js').id, 759);
    assertEqual(normalizeSkill('TypeScript').id, 979);
    assertEqual(normalizeSkill('Next.js').id, 2376);
    assertEqual(normalizeSkill('Tailwind CSS').id, 2435);
    assertEqual(normalizeSkill('Node.js').id, 500);
    assertEqual(normalizeSkill('AWS').id, 319);
  });

  test('normalizeSkill handles unknown skills gracefully with stable hash ID', () => {
    const s1 = normalizeSkill('CustomNicheLibraryXYZ');
    const s2 = normalizeSkill('CustomNicheLibraryXYZ');
    assertTrue(s1.id >= 800000);
    assertEqual(s1.id, s2.id);
    assertEqual(s1.name, 'CustomNicheLibraryXYZ');
  });

  test('parseUpworkJob aggregates raw scraped data into standard model', () => {
    const raw = {
      id: 'up-123',
      title: 'Fullstack React App',
      url: 'https://www.upwork.com/jobs/~01abc',
      budgetText: 'Fixed-price - $1,500',
      proposalsText: 'Less than 5 proposals',
      skills: ['React', 'TypeScript'],
      description: 'Build an internal dashboard',
    };

    const job = parseUpworkJob(raw);
    assertEqual(job.platform, 'upwork');
    assertEqual(job.id, 'up-123');
    assertEqual(job.budgetMax, 1500);
    assertEqual(job.bids, 3);
    assertEqual(job.skills.length, 2);
    assertEqual(job.skills[0].id, 759);
  });
}
