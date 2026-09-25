/**
 * Base Job Source Adapter
 * Standard interface for all job boards & web scraping sources
 */
export class JobSourceAdapter {
  /**
   * @param {string} id - Unique identifier (e.g. 'remoteok', 'freelancer')
   * @param {string} name - Display name (e.g. 'RemoteOK')
   * @param {'api'|'rss'|'html'|'session'} type - Scraping mechanism
   */
  constructor(id, name, type = 'api') {
    this.id = id;
    this.name = name;
    this.type = type;
  }

  /**
   * Fetch and normalize jobs from this source into UnifiedJob[]
   * @param {object} options - Filtering options { coreSkillIds, ... }
   * @returns {Promise<Array>} Array of standardized job objects
   */
  async fetchJobs(_options = {}) {
    throw new Error(`fetchJobs() must be implemented by adapter ${this.id}`);
  }
}
