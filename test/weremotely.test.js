/**
 * Unit Tests for We Work Remotely Service (Parser & Skill Extractor)
 */
import { extractSkillsFromText, parseWWRBudget } from '../shared/services/weremotely_service.js';
import { test, assertEqual, assertTrue } from './run_tests.js';

export function runWeRemotelyTests() {
  test('extractSkillsFromText detects core technologies from job text', () => {
    const text = 'We are hiring a Senior Python Engineer experienced with React.js, Docker, and Git.';
    const skills = extractSkillsFromText(text);
    const skillNames = skills.map(s => s.name);

    assertTrue(skillNames.includes('Python'), 'Should detect Python');
    assertTrue(skillNames.includes('React.js'), 'Should detect React.js');
    assertTrue(skillNames.includes('Docker'), 'Should detect Docker');
    assertTrue(skillNames.includes('Git'), 'Should detect Git');
  });

  test('extractSkillsFromText detects modern aliases like Next.js and Tailwind CSS', () => {
    const text = 'Looking for frontend dev with nextjs, reactjs, and tailwindcss experience.';
    const skills = extractSkillsFromText(text);
    const skillNames = skills.map(s => s.name);

    assertTrue(skillNames.includes('Next.js'), 'Should detect Next.js from nextjs');
    assertTrue(skillNames.includes('React.js'), 'Should detect React.js from reactjs');
    assertTrue(skillNames.includes('Tailwind CSS'), 'Should detect Tailwind CSS from tailwindcss');
  });

  test('extractSkillsFromText does not produce false positives on empty input', () => {
    const skills = extractSkillsFromText('');
    assertEqual(skills.length, 0);
  });

  test('parseWWRBudget parses single dollar amounts with K suffix', () => {
    const text = 'Compensation is $120k annually plus equity and benefits.';
    const budget = parseWWRBudget(text);
    assertEqual(budget.budgetMin, 120000);
    assertEqual(budget.budgetMax, 120000);
    assertEqual(budget.currency, 'USD');
  });

  test('parseWWRBudget parses salary range with K suffix', () => {
    const text = 'Salary range: $90k - $140k depending on experience.';
    const budget = parseWWRBudget(text);
    assertEqual(budget.budgetMin, 90000);
    assertEqual(budget.budgetMax, 140000);
    assertEqual(budget.currency, 'USD');
  });

  test('parseWWRBudget safely falls back to 0 if no budget found', () => {
    const text = 'Competitive salary based on candidate experience.';
    const budget = parseWWRBudget(text);
    assertEqual(budget.budgetMin, 0);
    assertEqual(budget.budgetMax, 0);
  });
}
