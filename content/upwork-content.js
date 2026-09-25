/**
 * Content Script for Upwork.com
 * Injected into Upwork pages to securely extract job posts from the user's active session
 */

(() => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'EXTRACT_UPWORK_JOBS') {
      try {
        // Multi-tier resilient selectors for Upwork job tiles (Claude Review Resilience Fix)
        const selectors = [
          'article[data-test="JobTile"]',
          'section[data-qa="job-tile"]',
          '[data-test="job-tile-list"] > div',
          '.air3-card-section',
          '.job-tile'
        ];

        let jobCards = [];
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            jobCards = Array.from(elements);
            break;
          }
        }

        if (jobCards.length === 0) {
          console.warn('[LanceUp] Không tìm thấy thẻ job nào trên Upwork. DOM có thể đã đổi hoặc trang đang tải.');
          sendResponse({
            success: false,
            error: 'DOM_STRUCTURE_CHANGED_OR_EMPTY',
            jobs: [],
            _telemetry: {
              url: window.location.href,
              timestamp: new Date().toISOString(),
              triedSelectors: selectors
            }
          });
          return true;
        }

        const extractedJobs = jobCards.map((card, index) => {

          // Resilient title selection
          const titleEl = card.querySelector(
            'h2 a, h3 a, [data-test="job-tile-title"] a, .job-title a, a[data-qa="job-title"]'
          );

          // Resilient description selection
          const descEl = card.querySelector(
            '[data-test="job-description-text"], [data-test="JobDescription"], .air3-line-clamp-2, .description'
          );

          // Resilient budget selection
          const budgetEl = card.querySelector(
            '[data-test="job-type-label"], [data-test="is-hourly"], [data-test="budget"], [data-qa="budget"], .budget'
          );

          // Resilient proposals selection
          const proposalEl = card.querySelector(
            '[data-test="proposals-tier"], [data-test="proposals"], [data-qa="proposals"], .proposals-tier'
          );

          // Resilient skills selection
          const skillEls = Array.from(card.querySelectorAll(
            '[data-test="attr-item"], .air3-token, a[href*="/freelance-jobs/"], .skill-tag'
          ));

          const title = titleEl ? titleEl.textContent.trim() : `Upwork Job #${index + 1}`;
          const url = titleEl && titleEl.href ? titleEl.href : window.location.href;
          const description = descEl ? descEl.textContent.trim() : '';
          const budgetText = budgetEl ? budgetEl.textContent.trim() : '';
          const proposalsText = proposalEl ? proposalEl.textContent.trim() : '';
          const skills = skillEls.map(s => s.textContent.trim()).filter(Boolean);

          return {
            id: `up-${Date.now()}-${index}`,
            title,
            url,
            description,
            budgetText,
            proposalsText,
            skills,
            extractedAt: new Date().toISOString()
          };
        });

        sendResponse({ success: true, count: extractedJobs.length, jobs: extractedJobs });
      } catch (err) {
        sendResponse({ success: false, error: err.message || String(err), jobs: [] });
      }
      return true; // Keep message channel open for async response
    }
    return false;
  });
})();
