/**
 * Multi-Platform Job Orchestrator (v2.2.0 - Adapter Architecture)
 * Queries selected platforms concurrently with batching, timeout protection & deduplication
 */
import { getAdapter } from './sources/index.js';
import { withTimeout } from '../utils/security.js';
import { DEFAULTS } from '../config/constants.js';

export async function fetchMultiPlatformJobs(
  platforms = DEFAULTS.platforms,
  coreSkillIds = []
) {
  const selectedPlatformIds = Array.isArray(platforms) && platforms.length > 0
    ? platforms
    : DEFAULTS.platforms;

  const validAdapters = selectedPlatformIds
    .map(id => getAdapter(id))
    .filter(Boolean);

  if (validAdapters.length === 0) {
    return {
      jobs: [],
      counts: {},
      freelancerCount: 0,
      upworkCount: 0,
      weremotelyCount: 0,
      remoteokCount: 0,
      jobicyCount: 0,
    };
  }

  // Concurrency throttling: batching 4 sources in parallel
  const MAX_CONCURRENCY = 4;
  let allJobs = [];
  const platformCounts = {};

  for (let i = 0; i < validAdapters.length; i += MAX_CONCURRENCY) {
    const batch = validAdapters.slice(i, i + MAX_CONCURRENCY);

    const batchPromises = batch.map(adapter =>
      withTimeout(
        adapter.fetchJobs({ coreSkillIds }),
        6500,
        `${adapter.name} fetch timeout`
      )
    );

    const settled = await Promise.allSettled(batchPromises);

    settled.forEach((res, idx) => {
      const adapter = batch[idx];
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        const items = res.value;
        platformCounts[adapter.id] = items.length;
        allJobs = allJobs.concat(items);
      } else {
        console.warn(`[LanceUp] Sàn ${adapter.name} không tải được:`, res.reason);
        platformCounts[adapter.id] = 0;
      }
    });
  }

  // Deduplicate by job id
  const seen = new Set();
  const uniqueJobs = allJobs.filter(job => {
    if (!job || !job.id || seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });

  return {
    jobs: uniqueJobs,
    counts: platformCounts,
    freelancerCount: platformCounts['freelancer'] || 0,
    upworkCount: platformCounts['upwork'] || 0,
    weremotelyCount: platformCounts['weremotely'] || 0,
    remoteokCount: platformCounts['remoteok'] || 0,
    jobicyCount: platformCounts['jobicy'] || 0,
  };
}
