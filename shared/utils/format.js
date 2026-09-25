/**
 * Formatting & Display Helpers
 */

export function formatMoney(amount, currency = 'USD') {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return '–';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount < 100 && currency === 'USD' ? 2 : 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatRelative(timestamp, baseTimestamp) {
  const now = baseTimestamp ?? Math.floor(Date.now() / 1000);
  const diffSec = Math.max(0, now - timestamp);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 60) return `${Math.max(1, diffMin)} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${diffDay} ngày trước`;
}
