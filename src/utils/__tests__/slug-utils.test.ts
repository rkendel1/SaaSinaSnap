/**
 * Tests for slug generation utilities
 */

import { extractDomainFromUrl, generateCleanSlug, isValidSlug,sanitizeSlug } from '../slug-utils';

describe('slug-utils', () => {
  describe('generateCleanSlug', () => {
    it('should handle the original problematic case', () => {
      expect(generateCleanSlug('httpz://www.vibe-fix.com')).toBe('vibe-fix');
    });

    it('should handle correct URLs properly', () => {
      expect(generateCleanSlug('https://www.vibe-fix.com')).toBe('vibe-fix');
      expect(generateCleanSlug('http://example.com')).toBe('example');
      expect(generateCleanSlug('www.test-site.org')).toBe('test-site');
    });

    it('should handle various TLDs', () => {
      expect(generateCleanSlug('example.co.uk')).toBe('example');
      expect(generateCleanSlug('test.io')).toBe('test');
      expect(generateCleanSlug('company.ai')).toBe('company');
    });

    it('should handle malformed protocols', () => {
      expect(generateCleanSlug('malformed://weird.url.com')).toBe('weird-url');
      expect(generateCleanSlug('xyz123://test.com')).toBe('test');
    });

    it('should handle company names without URLs', () => {
      expect(generateCleanSlug('My Great Company!')).toBe('my-great-company');
      expect(generateCleanSlug('test-company')).toBe('test-company');
    });

    it('should handle URLs with paths', () => {
      expect(generateCleanSlug('https://api.stripe.com/v1')).toBe('api-stripe');
      expect(generateCleanSlug('https://app.example.com/dashboard')).toBe('app-example');
    });
  });

  describe('extractDomainFromUrl', () => {
    it('should extract domains from various URL formats', () => {
      expect(extractDomainFromUrl('https://www.example.com')).toBe('www.example.com');
      expect(extractDomainFromUrl('http://subdomain.example.co.uk')).toBe('subdomain.example.co.uk');
      expect(extractDomainFromUrl('example.com')).toBe('example.com');
    });

    it('should handle malformed URLs', () => {
      expect(extractDomainFromUrl('httpz://www.test.com')).toBe('www.test.com');
      expect(extractDomainFromUrl('malformed://example.org')).toBe('example.org');
    });

    it('should return null for invalid input', () => {
      expect(extractDomainFromUrl('')).toBe(null);
      expect(extractDomainFromUrl(null as any)).toBe(null);
      expect(extractDomainFromUrl(undefined as any)).toBe(null);
    });
  });

  describe('sanitizeSlug', () => {
    it('should sanitize strings properly', () => {
      expect(sanitizeSlug('My Great Company!!!')).toBe('my-great-company');
      expect(sanitizeSlug('test@#$%company')).toBe('test-company');
      expect(sanitizeSlug('---test---')).toBe('test');
    });

    it('should handle multiple hyphens correctly', () => {
      expect(sanitizeSlug('test---company---name')).toBe('test-company-name');
    });

    it('should throw error for invalid input', () => {
      expect(() => sanitizeSlug('')).toThrow();
      expect(() => sanitizeSlug('---')).toThrow();
    });
  });

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('vibe-fix')).toBe(true);
      expect(isValidSlug('test-company')).toBe(true);
      expect(isValidSlug('example123')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('-invalid')).toBe(false);
      expect(isValidSlug('invalid-')).toBe(false);
      expect(isValidSlug('test--company')).toBe(false);
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug('Test-Company')).toBe(false); // uppercase
    });
  });
});