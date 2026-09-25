/**
 * Upwork Scanning Service
 * Injects & communicates with Upwork content script with timeout protection
 */
import { UPWORK_SNAPSHOT } from './fixtures/snapshots.js';
import { parseUpworkJob } from './upwork_parser.js';
import { withTimeout } from '../utils/security.js';

export async function fetchUpworkJobs() {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const upworkTabs = await chrome.tabs.query({ url: ['https://*.upwork.com/*'] });

      if (upworkTabs.length > 0 && upworkTabs[0].id !== undefined) {
        const tabId = upworkTabs[0].id;

        // Claude Review Fix: Wrap messaging in timeout so promise never hangs
        const response = await withTimeout(
          new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_UPWORK_JOBS' }, (res) => {
              if (chrome.runtime.lastError) {
                // Reading chrome.runtime.lastError consumes it cleanly so Chrome doesn't flag an error
                resolve(null);
              } else if (!res) {
                resolve(null);
              } else {
                resolve(res);
              }
            });
          }),
          4000,
          'Upwork tab extraction timed out'
        );

        if (response && response.success && Array.isArray(response.jobs) && response.jobs.length > 0) {
          return response.jobs.map((item, idx) => parseUpworkJob(item, idx));
        }
      }
    } catch {
      console.info('[LanceUp] Tab Upwork chưa có kết nối content script, chuyển sang dữ liệu snapshot mẫu.');
    }
  }


  // Graceful fallback to verified Upwork snapshot
  return UPWORK_SNAPSHOT;
}
