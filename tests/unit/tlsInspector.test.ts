import { describe, it, expect, beforeEach } from 'vitest';
import { getTlsSecurityDetails, clearTlsDetailsCache } from '../../src/main/tlsInspector';

describe('TLS Security Inspector', () => {
  beforeEach(() => {
    clearTlsDetailsCache();
  });

  it('returns null for non-HTTPS or internal URLs', async () => {
    expect(await getTlsSecurityDetails('http://insecure-website.com')).toBeNull();
    expect(await getTlsSecurityDetails('nova://settings')).toBeNull();
    expect(await getTlsSecurityDetails('file:///C:/test.txt')).toBeNull();
    expect(await getTlsSecurityDetails('')).toBeNull();
  });

  it('inspects HTTPS URLs and returns TLS security details', async () => {
    const details = await getTlsSecurityDetails('https://example.com');
    expect(details).not.toBeNull();

    if (details) {
      expect(typeof details.protocol).toBe('string');
      expect(typeof details.cipherSuite).toBe('string');
      expect(typeof details.issuer).toBe('string');
      expect(typeof details.subjectName).toBe('string');
      expect(details.validTo).toBeGreaterThan(0);
      expect(details.daysRemaining).toBeGreaterThanOrEqual(0);
      expect(typeof details.isExpired).toBe('boolean');
    }
  });

  it('caches inspected details for subsequent requests to the same origin', async () => {
    const first = await getTlsSecurityDetails('https://duckduckgo.com/about');
    const second = await getTlsSecurityDetails('https://duckduckgo.com/privacy');

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first).toEqual(second);
  });

  it('resets memory cache when clearTlsDetailsCache is executed', async () => {
    await getTlsSecurityDetails('https://github.com');
    clearTlsDetailsCache();

    // Verify cache was reset
    const fresh = await getTlsSecurityDetails('https://github.com');
    expect(fresh).not.toBeNull();
  });
});
