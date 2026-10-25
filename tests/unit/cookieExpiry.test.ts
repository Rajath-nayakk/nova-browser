import { describe, it, expect } from 'vitest';
import {
  normalizeCookieDomain,
  isThirdPartyCookie,
  shouldCapCookieExpiration,
  capCookieExpirationDate,
  formatCookieExpiration,
  MAX_TRACKER_COOKIE_LIFETIME_SECONDS,
} from '../../src/shared/cookieExpiry';

describe('Cookie Expiry & Storage Privacy Utilities', () => {
  describe('normalizeCookieDomain', () => {
    it('strips leading dot and port from domain names', () => {
      expect(normalizeCookieDomain('.example.com')).toBe('example.com');
      expect(normalizeCookieDomain('sub.example.com:8080')).toBe('sub.example.com');
      expect(normalizeCookieDomain('.sub.example.com:443')).toBe('sub.example.com');
    });

    it('converts domain names to lowercase and trims whitespace', () => {
      expect(normalizeCookieDomain('  EXAMPLE.COM  ')).toBe('example.com');
    });

    it('handles empty or non-string domain safely', () => {
      expect(normalizeCookieDomain('')).toBe('');
      expect(normalizeCookieDomain(null as any)).toBe('');
      expect(normalizeCookieDomain(undefined as any)).toBe('');
    });
  });

  describe('isThirdPartyCookie', () => {
    it('returns false when cookie domain matches origin domain exactly', () => {
      expect(isThirdPartyCookie('example.com', 'example.com')).toBe(false);
      expect(isThirdPartyCookie('.example.com', 'example.com')).toBe(false);
    });

    it('returns false for first-party subdomains', () => {
      expect(isThirdPartyCookie('example.com', 'app.example.com')).toBe(false);
      expect(isThirdPartyCookie('.example.com', 'cdn.sub.example.com')).toBe(false);
      expect(isThirdPartyCookie('api.example.com', 'example.com')).toBe(false);
    });

    it('returns true when cookie domain belongs to a distinct third-party tracker', () => {
      expect(isThirdPartyCookie('doubleclick.net', 'news.com')).toBe(true);
      expect(isThirdPartyCookie('tracker-cdn.biz', 'shop.org')).toBe(true);
      expect(isThirdPartyCookie('facebook.com', 'myblog.io')).toBe(true);
    });

    it('returns false safely when either domain is missing', () => {
      expect(isThirdPartyCookie('', 'example.com')).toBe(false);
      expect(isThirdPartyCookie('example.com', '')).toBe(false);
    });
  });

  describe('shouldCapCookieExpiration', () => {
    const now = 1700000000;

    it('returns false for session cookies without an expiration date', () => {
      expect(shouldCapCookieExpiration('tracker.com', 'site.com', undefined, now)).toBe(false);
    });

    it('returns false for already expired cookies', () => {
      expect(shouldCapCookieExpiration('tracker.com', 'site.com', now - 100, now)).toBe(false);
    });

    it('returns true for third-party cookies living longer than 24 hours (86400s)', () => {
      const expirationDate = now + 86400 + 100; // 24 hours and 100 seconds
      expect(shouldCapCookieExpiration('tracker.com', 'site.com', expirationDate, now)).toBe(true);
    });

    it('returns false for third-party cookies with short lifetime within 24 hours', () => {
      const expirationDate = now + 3600; // 1 hour
      expect(shouldCapCookieExpiration('tracker.com', 'site.com', expirationDate, now)).toBe(false);
    });

    it('applies 30-day threshold for first-party cookies', () => {
      const thirtyDays = 86400 * 30;
      const withinThirtyDays = now + thirtyDays - 1000;
      const overThirtyDays = now + thirtyDays + 5000;

      expect(shouldCapCookieExpiration('site.com', 'site.com', withinThirtyDays, now)).toBe(false);
      expect(shouldCapCookieExpiration('site.com', 'site.com', overThirtyDays, now)).toBe(true);
    });
  });

  describe('capCookieExpirationDate', () => {
    const now = 1700000000;

    it('caps future expiration date to now + maxLifetimeSeconds', () => {
      const twoYears = now + 86400 * 730;
      const capped = capCookieExpirationDate(twoYears, MAX_TRACKER_COOKIE_LIFETIME_SECONDS, now);
      expect(capped).toBe(now + MAX_TRACKER_COOKIE_LIFETIME_SECONDS);
    });

    it('preserves expiration date if already within the allowed threshold', () => {
      const oneHour = now + 3600;
      const capped = capCookieExpirationDate(oneHour, MAX_TRACKER_COOKIE_LIFETIME_SECONDS, now);
      expect(capped).toBe(oneHour);
    });

    it('sets maxAllowed if no current expiration is provided', () => {
      const capped = capCookieExpirationDate(undefined, MAX_TRACKER_COOKIE_LIFETIME_SECONDS, now);
      expect(capped).toBe(now + MAX_TRACKER_COOKIE_LIFETIME_SECONDS);
    });
  });

  describe('formatCookieExpiration', () => {
    it('formats session cookies clearly', () => {
      expect(formatCookieExpiration(undefined)).toBe('Session (until browser closed)');
    });

    it('formats expired cookies', () => {
      const past = Math.floor(Date.now() / 1000) - 100;
      expect(formatCookieExpiration(past)).toBe('Expired');
    });

    it('formats upcoming expiration in minutes or hours or days', () => {
      const now = Math.floor(Date.now() / 1000);
      expect(formatCookieExpiration(now + 1200)).toContain('minutes');
      expect(formatCookieExpiration(now + 7200)).toContain('hours');
      expect(formatCookieExpiration(now + 86400 * 5)).toContain('days');
    });
  });
});
