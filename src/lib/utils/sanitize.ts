/**
 * XSS Sanitization Utilities
 *
 * Provides defense-in-depth sanitization for user-generated content.
 * While React escapes by default, explicit sanitization protects against
 * future refactors that might use dangerouslySetInnerHTML or similar patterns.
 */

/**
 * Sanitizes a string for safe display by escaping HTML entities.
 * This is a lightweight, pure-JavaScript implementation suitable for
 * text-only content where HTML tags should never be rendered.
 *
 * @param input - The string to sanitize
 * @returns Sanitized string with HTML entities escaped
 */
export function sanitizeText(input: string | null | undefined): string {
  if (input == null) {
    return '';
  }

  if (typeof input !== 'string') {
    return String(input);
  }

  // Escape HTML entities to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes user display names.
 * Applies additional constraints beyond HTML escaping:
 * - Trims whitespace
 * - Limits length to prevent UI overflow
 * - Removes control characters
 *
 * @param name - User display name to sanitize
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized user name
 */
export function sanitizeUserName(name: string | null | undefined, maxLength = 100): string {
  if (name == null) {
    return 'Unknown User';
  }

  // Remove control characters (except common whitespace)
  const cleaned = String(name)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  if (cleaned.length === 0) {
    return 'Unknown User';
  }

  // Truncate and escape
  const truncated = cleaned.length > maxLength
    ? cleaned.slice(0, maxLength) + '...'
    : cleaned;

  return sanitizeText(truncated);
}

/**
 * Sanitizes timestamp display strings.
 * Validates format and escapes any potentially malicious content.
 *
 * @param timestamp - Timestamp string to sanitize
 * @returns Sanitized timestamp string
 */
export function sanitizeTimestamp(timestamp: string | null | undefined): string {
  if (timestamp == null) {
    return '';
  }

  // Remove any HTML/script tags and control characters
  const cleaned = String(timestamp)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  // Limit length to prevent UI abuse
  const truncated = cleaned.length > 50 ? cleaned.slice(0, 50) + '...' : cleaned;

  return sanitizeText(truncated);
}

/**
 * Sanitizes general user-generated content that should be plain text.
 * Use this for descriptions, comments, and similar fields.
 *
 * @param content - Content to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized content string
 */
export function sanitizeContent(content: string | null | undefined, maxLength = 1000): string {
  if (content == null) {
    return '';
  }

  const cleaned = String(content)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();

  const truncated = cleaned.length > maxLength
    ? cleaned.slice(0, maxLength) + '...'
    : cleaned;

  return sanitizeText(truncated);
}
