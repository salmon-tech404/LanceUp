/**
 * Unit Tests for Configuration Parser & Validator (JSON & YAML)
 */
import { parseAndValidateFilterConfig, parseYamlFilterConfig } from '../shared/domain/config_parser.js';
import { test, assertEqual, assertTrue } from './run_tests.js';

export function runConfigParserTests() {
  test('parseYamlFilterConfig extracts platforms, thresholds, and skills', () => {
    const yaml = `
platforms:
  - freelancer
  - upwork
  - weremotely

thresholds:
  min_fixed_usd: 300
  min_hourly_usd: 35
  min_quality_score: 50
  few_bids_threshold: 15

core_skills:
  - 3  # Python
  - 759 # React.js

support_skills:
  - 2  # PHP

exclude_skills:
  - 5  # Node.js
`;
    const res = parseYamlFilterConfig(yaml);
    assertEqual(res.platforms.length, 3);
    assertTrue(res.platforms.includes('weremotely'));
    assertEqual(res.thresholds.minFixed, 300);
    assertEqual(res.thresholds.minHourly, 35);
    assertEqual(res.thresholds.minScore, 50);
    assertEqual(res.thresholds.fewBids, 15);
    assertEqual(res.core[0], 3);
    assertEqual(res.core[1], 759);
    assertEqual(res.support[0], 2);
    assertEqual(res.exclude[0], 5);
  });

  test('parseAndValidateFilterConfig successfully parses valid JSON', () => {
    const jsonStr = JSON.stringify({
      platforms: ['upwork', 'weremotely'],
      thresholds: {
        minFixed: 400,
        minHourly: 45,
        minScore: 60,
        fewBids: 10,
      },
      core: [3, 114],
      support: [13],
      exclude: [24],
    });

    const validated = parseAndValidateFilterConfig(jsonStr);
    assertEqual(validated.platforms.length, 2);
    assertTrue(validated.platforms.includes('upwork'));
    assertTrue(validated.platforms.includes('weremotely'));
    assertEqual(validated.minFixed, 400);
    assertEqual(validated.minHourly, 45);
    assertEqual(validated.minScore, 60);
    assertEqual(validated.fewBids, 10);
    assertEqual(validated.core.length, 2);
    assertEqual(validated.support.length, 1);
  });

  test('parseAndValidateFilterConfig successfully parses valid YAML', () => {
    const yamlStr = `
platforms:
  - freelancer

thresholds:
  min_fixed_usd: 250
  min_hourly_usd: 25
  min_quality_score: 40
  few_bids_threshold: 20

core_skills:
  - 3
  - 759
`;
    const validated = parseAndValidateFilterConfig(yamlStr);
    assertEqual(validated.platforms.length, 1);
    assertEqual(validated.platforms[0], 'freelancer');
    assertEqual(validated.minFixed, 250);
    assertEqual(validated.core.length, 2);
    assertEqual(validated.core[0], 3);
  });

  test('parseAndValidateFilterConfig rejects empty or missing core skills', () => {
    const invalidYaml = `
platforms:
  - upwork
thresholds:
  min_fixed_usd: 100
`;
    let threw = false;
    try {
      parseAndValidateFilterConfig(invalidYaml);
    } catch (err) {
      threw = true;
      assertTrue(err.message.includes('kỹ năng yêu cầu'));
    }
    assertTrue(threw, 'Should throw error when core skills are empty');
  });

  test('parseAndValidateFilterConfig provides fallback defaults for missing optional thresholds', () => {
    const yaml = `
core_skills:
  - 3
`;
    const validated = parseAndValidateFilterConfig(yaml);
    assertEqual(validated.core.length, 1);
    assertTrue(validated.platforms.length > 0);
    assertTrue(validated.minFixed >= 0);
    assertTrue(validated.minScore >= 0);
  });
}
