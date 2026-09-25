/**
 * Upwork Scanning Service
 * Injects & communicates with Upwork content script with timeout protection
 */
import { UPWORK_SNAPSHOT } from './fixtures/snapshots.js';
import { parseUpworkJob } from './upwork_parser.js';
import { withTimeout } from '../utils/security.js';

async function sendExtractMessage(tabId) {
  return withTimeout(
    new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_UPWORK_JOBS' }, (res) => {
        if (chrome.runtime.lastError) {
          // Reading chrome.runtime.lastError consumes it cleanly so Chrome doesn't flag an unhandled error
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
  ).catch(() => null);
}

export async function fetchUpworkJobs() {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const upworkTabs = await chrome.tabs.query({ url: ['https://*.upwork.com/*'] });

      if (upworkTabs.length > 0 && upworkTabs[0].id !== undefined) {
        const tabId = upworkTabs[0].id;

        // Attempt 1: Message existing content script
        let response = await sendExtractMessage(tabId);

        // Attempt 2: If tab was loaded before extension install/reload, inject content script on the fly
        if (!response && chrome.scripting && chrome.scripting.executeScript) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId },
              files: ['content/upwork-content.js'],
            });
            await new Promise(r => setTimeout(r, 200));
            response = await sendExtractMessage(tabId);
          } catch (injectErr) {
            console.warn('[LanceUp] Auto-inject Upwork content script failed:', injectErr);
          }
        }

        if (response && response.success && Array.isArray(response.jobs) && response.jobs.length > 0) {
          return response.jobs.map((item, idx) => {
            const job = parseUpworkJob(item, idx);
            return { ...job, isLive: true, isSnapshot: false };
          });
        }
      }
    } catch {
      console.info('[LanceUp] Tab Upwork chưa có kết nối content script, chuyển sang dữ liệu snapshot mẫu.');
    }
  }

  // Graceful fallback to verified Upwork snapshot
  return UPWORK_SNAPSHOT.map(job => ({ ...job, isSnapshot: true, isLive: false }));
}

/**
 * Checks if user has an open Upwork tab
 */
export async function getUpworkTabStatus() {
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
    return { hasTab: false, tabCount: 0 };
  }
  try {
    const tabs = await chrome.tabs.query({ url: ['https://*.upwork.com/*'] });
    return { hasTab: tabs.length > 0, tabCount: tabs.length };
  } catch {
    return { hasTab: false, tabCount: 0 };
  }
}

