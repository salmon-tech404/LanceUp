/**
 * Upwork Adapter
 * Injects content script into active Upwork tab with snapshot fallback
 */
import { JobSourceAdapter } from './base_source.js';
import { fetchUpworkJobs } from '../upwork_service.js';

export class UpworkAdapter extends JobSourceAdapter {
  constructor() {
    super('upwork', 'Upwork', 'session');
  }

  async fetchJobs(_options = {}) {
    const jobs = await fetchUpworkJobs();
    return jobs.map(j => ({ ...j, platform: 'upwork' }));
  }
}
