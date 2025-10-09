/**
 * Normalizes a URL to ensure it has proper protocol
 * Accepts: example.com, www.example.com, http://example.com, https://example.com
 * Returns: https://example.com (or original if already has protocol)
 */
export function normalizeUrl(url: string): string {
  if (!url || url.trim() === '') {
    return '';
  }

  const trimmed = url.trim();

  // If already has a protocol, return as-is
  if (trimmed.match(/^https?:\/\//i)) {
    return trimmed;
  }

  // Remove www. prefix temporarily to handle it consistently
  const withoutWww = trimmed.replace(/^www\./i, '');

  // Add https:// protocol
  return `https://${withoutWww}`;
}

/**
 * Formats URL input for display (removes protocol for cleaner UX)
 */
export function formatUrlForDisplay(url: string): string {
  if (!url) return '';
  return url.replace(/^https?:\/\//i, '');
}

/**
 * Validates if a string is a valid URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty is valid (optional field)

  try {
    const normalized = normalizeUrl(url);
    const urlObj = new URL(normalized);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}
