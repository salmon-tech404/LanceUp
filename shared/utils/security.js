/**
 * Security & Reliability Utilities
 * Implements origin validation, XSS escaping, and message timeouts
 */

/**
 * Validates that an incoming message originated from within our extension
 * @param {chrome.runtime.MessageSender} sender
 * @returns {boolean}
 */
export function validateSender(sender) {
  if (!sender) return false;
  // Verify that sender ID matches our extension's runtime ID
  if (typeof chrome === 'undefined' || !chrome.runtime) return false;
  return sender.id === chrome.runtime.id;
}


/**
 * Escapes HTML characters to prevent XSS from third-party job descriptions
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips HTML tags and decodes common HTML entities (e.g. &nbsp;, &amp;)
 * @param {string} str
 * @returns {string}
 */
export function stripAndCleanHtml(str) {
  if (typeof str !== 'string' || !str) return '';
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Wraps a promise with a timeout to prevent hanging indefinitely
 * @template T
 * @param {Promise<T>} promise
 * @param {number} [timeoutMs=5000]
 * @param {string} [errorMsg='Operation timed out']
 * @returns {Promise<T>}
 */
export function withTimeout(promise, timeoutMs = 5000, errorMsg = 'Operation timed out') {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}
