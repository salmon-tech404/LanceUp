/**
 * Freelancer.com Adapter
 * Uses public REST API with snapshot fallback
 */
import { JobSourceAdapter } from './base_source.js';
import { fetchProjects } from '../freelancer_api.js';

export class FreelancerAdapter extends JobSourceAdapter {
  constructor() {
    super('freelancer', 'Freelancer', 'api');
  }

  async fetchJobs(options = {}) {
    const jobs = await fetchProjects(options.coreSkillIds || []);
    return jobs.map(j => ({ ...j, platform: 'freelancer' }));
  }
}
