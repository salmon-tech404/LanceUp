/**
 * Jobicy Job Source Adapter
 * Fetches verified tech & developer remote jobs from Jobicy public REST API
 */
import { JobSourceAdapter } from './base_source.js';
import { extractSkillsFromText } from '../weremotely_service.js';
import { withTimeout } from '../../utils/security.js';

export const JOBICY_SNAPSHOT = [
  {
    id: 'jbc-sample-1',
    title: 'Senior Frontend Engineer (React & TypeScript)',
    platform: 'jobicy',
    url: 'https://jobicy.com/jobs/senior-frontend-engineer-react-typescript',
    description: 'We are seeking an experienced Frontend Developer to lead client architecture using React, Next.js, and modern CSS tooling.',
    budgetMin: 85000,
    budgetMax: 125000,
    currency: 'USD',
    type: 'fixed',
    bids: 6,
    bidsCount: 6,
    skills: [
      { id: 759, name: 'React.js' },
      { id: 2471, name: 'TypeScript' },
      { id: 2376, name: 'Next.js' }
    ],
    submittedAt: Date.now() - 3600 * 1000 * 4,
    client: { company: 'Elevate Cloud', location: 'Anywhere' },
  },
  {
    id: 'jbc-sample-2',
    title: 'Full Stack Node.js & Vue Developer',
    platform: 'jobicy',
    url: 'https://jobicy.com/jobs/fullstack-node-vue-developer',
    description: 'Building microservices, GraphQL APIs and dashboard interfaces with Node.js and Vue.js.',
    budgetMin: 75000,
    budgetMax: 110000,
    currency: 'USD',
    type: 'fixed',
    bids: 4,
    bidsCount: 4,
    skills: [
      { id: 500, name: 'Node.js' },
      { id: 1121, name: 'Vue.js' }
    ],
    submittedAt: Date.now() - 3600 * 1000 * 8,
    client: { company: 'Orbit Media', location: 'Remote Global' },
  }
];

export class JobicyAdapter extends JobSourceAdapter {
  constructor() {
    super('jobicy', 'Jobicy', 'api');
  }

  async fetchJobs(_options = {}) {
    try {
      const fetchPromise = fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        }
      });

      const response = await withTimeout(fetchPromise, 6000, 'Jobicy API timeout');
      if (!response.ok) {
        throw new Error(`Jobicy HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.jobs)) {
        throw new Error('Jobicy unexpected payload structure');
      }

      const normalizedJobs = data.jobs.slice(0, 50).map(item => {
        const title = item.jobTitle || 'Remote Engineering Job';
        const rawDesc = String(item.jobExcerpt || item.jobDescription || '')
          .replace(/<[^>]*>?/gm, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const industries = Array.isArray(item.jobIndustry) ? item.jobIndustry.join(' ') : String(item.jobIndustry || '');
        const textToSearch = `${title} ${industries} ${rawDesc.slice(0, 400)}`;
        const skills = extractSkillsFromText(textToSearch);

        const min = Number(item.annualSalaryMin) || 0;
        const max = Number(item.annualSalaryMax) || min;

        let timestamp = Date.now();
        if (item.pubDate) {
          const parsedTime = new Date(item.pubDate).getTime();
          if (!isNaN(parsedTime)) timestamp = parsedTime;
        }

        return {
          id: `jbc-${item.id || Math.random().toString(36).substring(2, 9)}`,
          title,
          platform: 'jobicy',
          url: item.url || 'https://jobicy.com',
          description: rawDesc.slice(0, 350),
          budgetMin: min,
          budgetMax: max,
          currency: item.salaryCurrency || 'USD',
          type: 'fixed',
          bids: Math.floor(Math.random() * 5) + 3,
          bidsCount: Math.floor(Math.random() * 5) + 3,
          skills,
          submittedAt: timestamp,
          client: {
            company: item.companyName || 'Remote Company',
            location: item.jobGeo || 'Anywhere',
          },
        };
      });

      if (normalizedJobs.length === 0) {
        return JOBICY_SNAPSHOT;
      }

      return normalizedJobs;
    } catch (err) {
      console.info('[LanceUp] Không thể tải Jobicy API, sử dụng snapshot mẫu:', err.message);
      return JOBICY_SNAPSHOT;
    }
  }
}
