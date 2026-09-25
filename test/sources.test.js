/**
 * Multi-Platform Job Source Adapters Unit Tests
 * Tests JobSourceAdapter contract, Adapter Registry, RemoteOK & Jobicy parsers
 */
import { test, assertEqual, assertTrue } from './run_tests.js';
import { JobSourceAdapter } from '../shared/services/sources/base_source.js';
import { getAdapter, getAllAdapters } from '../shared/services/sources/index.js';
import { RemoteOKAdapter, REMOTEOK_SNAPSHOT } from '../shared/services/sources/remoteok_source.js';
import { JobicyAdapter, JOBICY_SNAPSHOT } from '../shared/services/sources/jobicy_source.js';
import { fetchMultiPlatformJobs } from '../shared/services/orchestrator.js';

export async function runSourcesTests() {
  await test('JobSourceAdapter base class throws if fetchJobs not implemented', async () => {
    const base = new JobSourceAdapter('custom', 'Custom Source');
    assertEqual(base.id, 'custom');
    assertEqual(base.name, 'Custom Source');
    let threw = false;
    try {
      await base.fetchJobs();
    } catch {
      threw = true;
    }
    assertTrue(threw, 'Should throw error when calling fetchJobs on base adapter');
  });

  await test('Adapter Registry provides all 5 standard platform adapters', () => {
    const all = getAllAdapters();
    assertEqual(all.length, 5, 'Should have exactly 5 adapters registered');

    const fl = getAdapter('freelancer');
    const up = getAdapter('upwork');
    const wwr = getAdapter('weremotely');
    const rok = getAdapter('remoteok');
    const jbc = getAdapter('jobicy');

    assertTrue(Boolean(fl), 'Freelancer adapter must exist');
    assertTrue(Boolean(up), 'Upwork adapter must exist');
    assertTrue(Boolean(wwr), 'We Work Remotely adapter must exist');
    assertTrue(Boolean(rok), 'RemoteOK adapter must exist');
    assertTrue(Boolean(jbc), 'Jobicy adapter must exist');

    assertEqual(getAdapter('non_existent'), null);
  });

  await test('RemoteOK adapter normalizes jobs to UnifiedJob contract', async () => {
    const adapter = new RemoteOKAdapter();
    assertEqual(adapter.id, 'remoteok');
    assertEqual(adapter.type, 'api');

    const jobs = await adapter.fetchJobs();
    assertTrue(Array.isArray(jobs), 'RemoteOK jobs must be an array');
    assertTrue(jobs.length > 0, 'RemoteOK must return at least 1 job');

    const sample = jobs[0];
    assertTrue(typeof sample.id === 'string' && sample.id.startsWith('rok-'), 'ID must start with rok-');
    assertEqual(sample.platform, 'remoteok');
    assertTrue(sample.title.length > 0, 'Job must have a title');
    assertTrue(typeof sample.budgetMin === 'number', 'budgetMin must be number');
    assertTrue(typeof sample.budgetMax === 'number', 'budgetMax must be number');
    assertTrue(Array.isArray(sample.skills), 'skills must be an array');
    assertTrue(typeof sample.submittedAt === 'number', 'submittedAt must be epoch ms');
  });

  await test('Jobicy adapter normalizes jobs to UnifiedJob contract', async () => {
    const adapter = new JobicyAdapter();
    assertEqual(adapter.id, 'jobicy');
    assertEqual(adapter.type, 'api');

    const jobs = await adapter.fetchJobs();
    assertTrue(Array.isArray(jobs), 'Jobicy jobs must be an array');
    assertTrue(jobs.length > 0, 'Jobicy must return at least 1 job');

    const sample = jobs[0];
    assertTrue(typeof sample.id === 'string' && sample.id.startsWith('jbc-'), 'ID must start with jbc-');
    assertEqual(sample.platform, 'jobicy');
    assertTrue(sample.title.length > 0, 'Job must have a title');
    assertTrue(typeof sample.budgetMin === 'number', 'budgetMin must be number');
    assertTrue(Array.isArray(sample.skills), 'skills must be an array');
    assertTrue(typeof sample.submittedAt === 'number', 'submittedAt must be epoch ms');
  });

  await test('Multi-Platform Orchestrator queries multiple adapters concurrently', async () => {
    const res = await fetchMultiPlatformJobs(['remoteok', 'jobicy']);
    assertTrue(Array.isArray(res.jobs), 'Result must contain jobs array');
    assertTrue(res.jobs.length >= 2, 'Result must contain aggregated jobs');
    assertTrue(res.remoteokCount > 0, 'remoteokCount must be tracked');
    assertTrue(res.jobicyCount > 0, 'jobicyCount must be tracked');

    // Check that there are no duplicate job IDs
    const ids = res.jobs.map(j => j.id);
    const uniqueIds = new Set(ids);
    assertEqual(ids.length, uniqueIds.size, 'All aggregated jobs must have unique IDs');
  });
}
