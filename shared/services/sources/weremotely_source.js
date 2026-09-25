/**
 * We Work Remotely Adapter
 * Parses public RSS feed with timeout protection
 */
import { JobSourceAdapter } from './base_source.js';
import { fetchWeRemotelyJobs } from '../weremotely_service.js';

export class WeRemotelyAdapter extends JobSourceAdapter {
  constructor() {
    super('weremotely', 'We Work Remotely', 'rss');
  }

  async fetchJobs(_options = {}) {
    const jobs = await fetchWeRemotelyJobs();
    return jobs.map(j => ({ ...j, platform: 'weremotely' }));
  }
}
