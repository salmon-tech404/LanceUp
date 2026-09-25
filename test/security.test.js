import { test, assertEqual, assertTrue } from './run_tests.js';
import { escapeHtml, stripAndCleanHtml, withTimeout, validateSender } from '../shared/utils/security.js';

export async function runSecurityTests() {
  test('escapeHtml neutralizes dangerous characters against XSS', () => {
    const raw = '<script>alert("xss & hack")</script>';
    const escaped = escapeHtml(raw);
    assertEqual(escaped, '&lt;script&gt;alert(&quot;xss &amp; hack&quot;)&lt;/script&gt;');
  });

  test('stripAndCleanHtml removes tags and decodes entities like &nbsp;', () => {
    const input = '<p>Job Type:&nbsp;Full-Time &amp; Remote</p>';
    assertEqual(stripAndCleanHtml(input), 'Job Type: Full-Time & Remote');
  });

  test('escapeHtml handles quotes and special characters safely', () => {
    assertEqual(escapeHtml("Tom's & Jerry's > Cat & Mouse"), "Tom&#039;s &amp; Jerry&#039;s &gt; Cat &amp; Mouse");
    assertEqual(escapeHtml(null), '');
    assertEqual(escapeHtml(undefined), '');
  });

  test('validateSender rejects falsy or missing sender', () => {
    assertEqual(validateSender(null), false);
    assertEqual(validateSender(undefined), false);
    assertEqual(validateSender({ id: 'wrong-id' }), false);
  });

  test('validateSender accepts sender when matching extension runtime id', () => {
    const originalChrome = globalThis.chrome;
    try {
      globalThis.chrome = { runtime: { id: 'lanceup-extension-id-123' } };
      assertEqual(validateSender({ id: 'lanceup-extension-id-123' }), true);
      assertEqual(validateSender({ id: 'malicious-extension-id' }), false);
    } finally {
      globalThis.chrome = originalChrome;
    }
  });

  await test('withTimeout resolves quickly if promise settles before timeout', async () => {
    const quickPromise = new Promise(resolve => setTimeout(() => resolve('OK'), 20));
    const result = await withTimeout(quickPromise, 100);
    assertEqual(result, 'OK');
  });

  await test('withTimeout rejects with custom message if promise times out', async () => {
    const hangingPromise = new Promise(resolve => setTimeout(() => resolve('LATE'), 200));
    let timedOut = false;
    try {
      await withTimeout(hangingPromise, 30, 'Custom timeout error');
    } catch (err) {
      timedOut = true;
      assertEqual(err.message, 'Custom timeout error');
    }
    assertTrue(timedOut, 'Expected withTimeout to reject on timeout');
  });
}
