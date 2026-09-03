/**
 * Brievox — Utility Functions
 */

/**
 * Format a date string to a relative time (e.g. "2h ago", "5 min ago")
 */
export function timeAgo(dateStr) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Strip HTML tags from a string
 */
export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Decode HTML entities like &#8217; back to real characters
 */
export function decodeHtmlEntities(str) {
  if (!str) return '';
  const doc = new DOMParser().parseFromString(str, "text/html");
  return doc.documentElement.textContent;
}

/**
 * Check if an article was published in the last N hours
 */
export function isWithinHours(dateStr, hours = 24) {
  const date = new Date(dateStr).getTime();
  const cutoff = Date.now() - (hours * 3600000);
  return date >= cutoff;
}
