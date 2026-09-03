import { describe, it, expect } from 'vitest';
import { timeAgo, stripHtml, escapeHtml, isWithinHours, decodeHtmlEntities } from '../src/utils';

describe('utils.js', () => {
  describe('timeAgo', () => {
    it('should return "Just now" for very recent dates', () => {
      const now = new Date().toISOString();
      expect(timeAgo(now)).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
      expect(timeAgo(tenMinsAgo)).toBe('10m ago');
    });

    it('should return hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      expect(timeAgo(twoHoursAgo)).toBe('2h ago');
    });

    it('should return days ago', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
      expect(timeAgo(twoDaysAgo)).toBe('2d ago');
    });

    it('should return locale date for old dates', () => {
      const oldDate = '2023-01-01T10:00:00Z';
      expect(timeAgo(oldDate)).toContain('Jan');
    });
  });

  describe('HTML utilities', () => {
    it('should strip HTML tags', () => {
      expect(stripHtml('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should handle null/empty in stripHtml', () => {
      expect(stripHtml('')).toBe('');
      expect(stripHtml(null)).toBe('');
    });

    it('should escape HTML', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
    });

    it('should handle null/empty in escapeHtml', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
    });

    it('should decode HTML entities', () => {
      expect(decodeHtmlEntities('Hello &amp; World')).toBe('Hello & World');
    });

    it('should handle null/empty in decodeHtmlEntities', () => {
      expect(decodeHtmlEntities('')).toBe('');
      expect(decodeHtmlEntities(null)).toBe('');
    });
  });

  describe('isWithinHours', () => {
    it('should return true for dates within limit', () => {
      const recent = new Date(Date.now() - 12 * 3600000).toISOString();
      expect(isWithinHours(recent, 24)).toBe(true);
    });

    it('should return false for dates outside limit', () => {
      const old = new Date(Date.now() - 48 * 3600000).toISOString();
      expect(isWithinHours(old, 24)).toBe(false);
    });
  });
});
