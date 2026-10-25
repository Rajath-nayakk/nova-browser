import { describe, it, expect } from 'vitest';
import {
  isOnionDomain,
  isValidV3OnionAddress,
  getOnionRoutingStatus,
} from '../../src/shared/torUtils';

describe('Tor and Onion Routing Utilities', () => {
  describe('isOnionDomain', () => {
    it('detects simple .onion domain strings', () => {
      expect(isOnionDomain('duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion')).toBe(true);
      expect(isOnionDomain('privacy35728492.onion')).toBe(true);
    });

    it('detects .onion domain from full URLs', () => {
      expect(isOnionDomain('http://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion/search?q=test')).toBe(true);
      expect(isOnionDomain('https://darknetnews.onion/articles/1')).toBe(true);
    });

    it('detects .onion domain with port number', () => {
      expect(isOnionDomain('http://service.onion:8080/api')).toBe(true);
      expect(isOnionDomain('service.onion:9050')).toBe(true);
    });

    it('rejects regular clearnet domains', () => {
      expect(isOnionDomain('google.com')).toBe(false);
      expect(isOnionDomain('https://duckduckgo.com')).toBe(false);
      expect(isOnionDomain('https://onion.com')).toBe(false);
      expect(isOnionDomain('https://onion.example.org')).toBe(false);
    });

    it('handles empty or non-string inputs safely', () => {
      expect(isOnionDomain('')).toBe(false);
      expect(isOnionDomain(null as any)).toBe(false);
      expect(isOnionDomain(undefined as any)).toBe(false);
    });
  });

  describe('isValidV3OnionAddress', () => {
    it('accepts valid 56-character base32 v3 onion addresses', () => {
      // 56 lowercase letters (a-z) and digits (2-7)
      const validV3 = 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion';
      expect(isValidV3OnionAddress(validV3)).toBe(true);
      expect(isValidV3OnionAddress(`http://${validV3}/search`)).toBe(true);
    });

    it('rejects deprecated 16-character v2 onion addresses', () => {
      const v2Address = 'expyuzz5wqqfdgah.onion';
      expect(isValidV3OnionAddress(v2Address)).toBe(false);
    });

    it('rejects addresses containing non-base32 characters like 0, 1, 8, 9', () => {
      // 56 characters but contains '8', '9', '0', '1'
      const invalidChars = 'duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzcz08.onion';
      expect(isValidV3OnionAddress(invalidChars)).toBe(false);
    });

    it('rejects wrong length or missing suffix', () => {
      expect(isValidV3OnionAddress('short.onion')).toBe(false);
      expect(isValidV3OnionAddress('duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.com')).toBe(false);
      expect(isValidV3OnionAddress('')).toBe(false);
    });
  });

  describe('getOnionRoutingStatus', () => {
    it('returns canRoute=true for standard clearnet URLs', () => {
      const status = getOnionRoutingStatus('https://example.com', false);
      expect(status.isOnion).toBe(false);
      expect(status.canRoute).toBe(true);
      expect(status.message).toContain('clearnet');
    });

    it('blocks onion URLs when Tor routing is disabled', () => {
      const status = getOnionRoutingStatus('http://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion', false);
      expect(status.isOnion).toBe(true);
      expect(status.canRoute).toBe(false);
      expect(status.actionRequired).toBe('enable_tor');
      expect(status.message).toContain('Tor routing is currently disabled');
    });

    it('allows onion URLs when Tor routing is enabled and specifies port', () => {
      const status = getOnionRoutingStatus(
        'http://duckduckgogg42xjoc72x3sjasowoarfbgcmvfimaftt6twagswzczad.onion',
        true,
        9150
      );
      expect(status.isOnion).toBe(true);
      expect(status.canRoute).toBe(true);
      expect(status.message).toContain('9150');
    });
  });
});
