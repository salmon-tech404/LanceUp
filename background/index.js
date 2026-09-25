/**
 * Background Service Worker (Manifest V3)
 * Manages dashboard tab lifecycle and secure message routing
 */
import { validateSender } from '../shared/utils/security.js';

// Service Worker Lifecycle Logging
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[LanceUp] Extension installed / updated:', details.reason, 'Version: 2.0.0');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[LanceUp] Extension Service Worker started');
});


// Open or focus the full-tab dashboard when extension icon is clicked
chrome.action.onClicked.addListener(async () => {
  const dashboardUrl = chrome.runtime.getURL('dashboard/index.html');
  const tabs = await chrome.tabs.query({});
  
  const existingTab = tabs.find(tab => tab.url && tab.url.startsWith(dashboardUrl));

  if (existingTab && existingTab.id !== undefined) {
    await chrome.tabs.update(existingTab.id, { active: true });
    if (existingTab.windowId !== undefined) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: dashboardUrl });
  }
});

// Secure message listener with sender origin validation (Claude Review Security Fix)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!validateSender(sender)) {
    console.warn('Rejected unauthorized message from untrusted sender:', sender);
    return false;
  }

  if (message.type === 'PING') {
    sendResponse({ status: 'ok', version: '2.0.0' });
    return false;
  }

  return false;
});
