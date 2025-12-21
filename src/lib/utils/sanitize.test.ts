/**
 * Input Sanitization Tests
 *
 * These tests serve as living documentation of XSS prevention and input sanitization behavior.
 * They explicitly cover security edge cases to prevent XSS vulnerabilities.
 *
 * DESIGN DECISIONS DOCUMENTED BY THESE TESTS:
 * 1. All HTML entities are escaped (&, <, >, ", ', /) to prevent XSS
 * 2. Null/undefined inputs return safe defaults (empty string or "Unknown User")
 * 3. Non-string inputs are coerced to strings before sanitization
 * 4. Control characters (\x00, etc.) are stripped from user names and content
 * 5. User names are truncated to 100 characters + "..." (103 max)
 * 6. Timestamps are truncated to 50 characters + "..." (53 max)
 * 7. Content accepts custom maxLength parameter for flexibility
 * 8. Empty/whitespace-only user names return "Unknown User" for display safety
 * 9. Normal text passes through unchanged (no false positives)
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeUserName,
  sanitizeTimestamp,
  sanitizeContent,
} from './sanitize';

describe('sanitizeText', () => {
  it('escapes HTML entities', () => {
    expect(sanitizeText('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('escapes ampersands', () => {
    expect(sanitizeText('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes single quotes', () => {
    expect(sanitizeText("O'Connor")).toBe('O&#x27;Connor');
  });

  it('handles null and undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('handles non-string inputs', () => {
    expect(sanitizeText(123 as unknown as string)).toBe('123');
  });
});

describe('sanitizeUserName', () => {
  it('sanitizes XSS payloads in user names', () => {
    const malicious = '<img src=x onerror=alert(1)>';
    const result = sanitizeUserName(malicious);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('returns Unknown User for null/undefined', () => {
    expect(sanitizeUserName(null)).toBe('Unknown User');
    expect(sanitizeUserName(undefined)).toBe('Unknown User');
  });

  it('returns Unknown User for empty/whitespace strings', () => {
    expect(sanitizeUserName('')).toBe('Unknown User');
    expect(sanitizeUserName('   ')).toBe('Unknown User');
  });

  it('removes control characters', () => {
    expect(sanitizeUserName('John\x00Doe')).toBe('JohnDoe');
  });

  it('truncates long names', () => {
    const longName = 'A'.repeat(150);
    const result = sanitizeUserName(longName);
    expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
  });

  it('preserves normal names', () => {
    expect(sanitizeUserName('John Doe')).toBe('John Doe');
  });
});

describe('sanitizeTimestamp', () => {
  it('sanitizes XSS in timestamps', () => {
    const malicious = '<script>evil()</script>';
    const result = sanitizeTimestamp(malicious);
    expect(result).not.toContain('<script>');
  });

  it('handles null/undefined', () => {
    expect(sanitizeTimestamp(null)).toBe('');
    expect(sanitizeTimestamp(undefined)).toBe('');
  });

  it('truncates very long timestamps', () => {
    const longTimestamp = '2024-01-01T00:00:00.000Z'.repeat(10);
    const result = sanitizeTimestamp(longTimestamp);
    expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
  });

  it('preserves normal timestamps', () => {
    expect(sanitizeTimestamp('2 hours ago')).toBe('2 hours ago');
    expect(sanitizeTimestamp('Dec 15, 2024')).toBe('Dec 15, 2024');
  });
});

describe('sanitizeContent', () => {
  it('sanitizes XSS payloads', () => {
    const malicious = 'Hello <script>alert(document.cookie)</script> World';
    const result = sanitizeContent(malicious);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });

  it('handles null/undefined', () => {
    expect(sanitizeContent(null)).toBe('');
    expect(sanitizeContent(undefined)).toBe('');
  });

  it('respects custom maxLength', () => {
    const content = 'A'.repeat(100);
    const result = sanitizeContent(content, 50);
    expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
  });

  it('removes control characters', () => {
    expect(sanitizeContent('Hello\x00World')).toBe('HelloWorld');
  });
});
