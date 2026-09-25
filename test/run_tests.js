/**
 * Native ES Module Test Runner
 * Zero dependencies — runs natively with Node.js
 */
import { runScoringTests } from './scoring.test.js';
import { runEvaluateTests } from './evaluate.test.js';
import { runParserTests } from './upwork_parser.test.js';
import { runSecurityTests } from './security.test.js';
import { runConfigParserTests } from './config_parser.test.js';
import { runWeRemotelyTests } from './weremotely.test.js';
import { runSourcesTests } from './sources.test.js';
import { runIDBTests } from './idb_store.test.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

export async function test(name, fn) {
  totalTests++;
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      await res;
    }
    passedTests++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    \x1b[31mError: ${err.message}\x1b[0m`);
    if (err.stack) {
      const relevantLine = err.stack.split('\n')[1];
      if (relevantLine) console.error(`    \x1b[90m${relevantLine.trim()}\x1b[0m`);
    }
  }
}

export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
  }
}

export function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be truthy');
  }
}

async function runAll() {
  console.log('\n\x1b[1m=== LANCEUP — UNIT TEST SUITE ===\x1b[0m\n');

  console.log('\x1b[36m[1/7] Testing Scoring Engine (scoring.js)...\x1b[0m');
  runScoringTests();

  console.log('\n\x1b[36m[2/7] Testing Evaluation & Discard Rules (evaluate.js)...\x1b[0m');
  runEvaluateTests();

  console.log('\n\x1b[36m[3/7] Testing Upwork Parser & Budget Fallbacks (upwork_parser.js)...\x1b[0m');
  runParserTests();

  console.log('\n\x1b[36m[4/7] Testing Security & Reliability Helpers (security.js)...\x1b[0m');
  await runSecurityTests();

  console.log('\n\x1b[36m[5/7] Testing Team Filter Sharing Parser (config_parser.js)...\x1b[0m');
  runConfigParserTests();

  console.log('\n\x1b[36m[6/7] Testing We Work Remotely Service (weremotely_service.js)...\x1b[0m');
  runWeRemotelyTests();

  console.log('\n\x1b[36m[7/7] Testing Multi-Platform Adapters & Orchestrator (sources/)...\x1b[0m');
  await runSourcesTests();

  console.log('\n\x1b[36m[8/8] Testing Native IndexedDB Engine (idb_store.js)...\x1b[0m');
  await runIDBTests();

  console.log('\n\x1b[1m--------------------------------------------------\x1b[0m');
  console.log(`Total: ${totalTests} | \x1b[32mPassed: ${passedTests}\x1b[0m | \x1b[31mFailed: ${failedTests}\x1b[0m`);

  if (failedTests > 0) {
    console.log('\x1b[31m❌ TEST SUITE FAILED\x1b[0m\n');
    process.exit(1);
  } else {
    console.log('\x1b[32m✅ ALL TESTS PASSED SUCCESSFULLY (100% SUCCESS RATE)\x1b[0m\n');
    process.exit(0);
  }
}

runAll();
