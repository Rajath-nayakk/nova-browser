import { describe, it, expect } from 'vitest';
import {
  normalizeUserInput,
  extractDomain,
  isHttpsUrl,
  isInternalUrl,
  isExecutableFile,
  stripTrackingParameters,
  isValidDomainOrHost,
  isLookalikeDomain,
  analyzeLinkWithLens,
} from '../../src/shared/validation';
import { NEW_TAB_URL } from '../../src/shared/constants';

describe('URL Normalization & Validation', () => {
  it('returns NEW_TAB_URL for empty or whitespace input', () => {
    expect(normalizeUserInput('')).toBe(NEW_TAB_URL);
    expect(normalizeUserInput('   ')).toBe(NEW_TAB_URL);
  });

  it('preserves internal nova:// URLs', () => {
    expect(normalizeUserInput('nova://newtab')).toBe('nova://newtab');
    expect(normalizeUserInput('nova://settings')).toBe('nova://settings');
    expect(normalizeUserInput('nova://history')).toBe('nova://history');
    expect(normalizeUserInput('nova://bookmarks')).toBe('nova://bookmarks');
    expect(normalizeUserInput('nova://downloads')).toBe('nova://downloads');
  });

  it('preserves existing HTTPS and HTTP URLs', () => {
    expect(normalizeUserInput('https://www.eff.org')).toBe('https://www.eff.org');
    expect(normalizeUserInput('http://localhost:3000/dashboard')).toBe('http://localhost:3000/dashboard');
  });

  it('correctly detects valid domains and prepends https://', () => {
    expect(isValidDomainOrHost('duckduckgo.com')).toBe(true);
    expect(isValidDomainOrHost('en.wikipedia.org/wiki/Privacy')).toBe(true);
    expect(isValidDomainOrHost('localhost:8080')).toBe(true);
    expect(isValidDomainOrHost('127.0.0.1:3000')).toBe(true);

    expect(normalizeUserInput('duckduckgo.com')).toBe('https://duckduckgo.com');
    expect(normalizeUserInput('github.com/torvalds/linux')).toBe('https://github.com/torvalds/linux');
  });

  it('encodes ordinary search queries using default DuckDuckGo engine', () => {
    expect(normalizeUserInput('what is open source')).toBe(
      'https://duckduckgo.com/?q=what%20is%20open%20source'
    );
    expect(normalizeUserInput('rust vs typescript')).toBe(
      'https://duckduckgo.com/?q=rust%20vs%20typescript'
    );
  });

  it('supports custom search engine templates', () => {
    const customTemplate = 'https://searx.be/search?q=%s';
    expect(normalizeUserInput('privacy browser', 'custom', customTemplate)).toBe(
      'https://searx.be/search?q=privacy%20browser'
    );
  });

  it('extracts clean domain names without www', () => {
    expect(extractDomain('https://www.eff.org/pages/about')).toBe('eff.org');
    expect(extractDomain('https://sub.domain.co.uk/path?q=1')).toBe('sub.domain.co.uk');
    expect(extractDomain('nova://settings')).toBe('');
  });

  it('detects HTTPS correctly', () => {
    expect(isHttpsUrl('https://github.com')).toBe(true);
    expect(isHttpsUrl('http://insecure-site.com')).toBe(false);
    expect(isHttpsUrl('nova://newtab')).toBe(false);
  });

  it('identifies dangerous executable extensions', () => {
    expect(isExecutableFile('installer.exe')).toBe(true);
    expect(isExecutableFile('script.bat')).toBe(true);
    expect(isExecutableFile('payload.cmd')).toBe(true);
    expect(isExecutableFile('package.msi')).toBe(true);
    expect(isExecutableFile('powershell.ps1')).toBe(true);
    expect(isExecutableFile('document.pdf')).toBe(false);
    expect(isExecutableFile('image.png')).toBe(false);
    expect(isExecutableFile('source.ts')).toBe(false);
  });

  it('strips tracking parameters without breaking URL query', () => {
    const urlWithTracking = 'https://example.com/item?id=123&utm_source=newsletter&utm_medium=email&fbclid=xyz987';
    const cleaned = stripTrackingParameters(urlWithTracking);
    expect(cleaned).toBe('https://example.com/item?id=123');
    expect(cleaned).not.toContain('utm_source');
    expect(cleaned).not.toContain('fbclid');
  });

  it('detects lookalike and typosquatting domains', () => {
    // Homoglyphs / punycode lookalikes
    expect(isLookalikeDomain('xn--pypal-4ve.com').isLookalike).toBe(true);
    expect(isLookalikeDomain('paypa1.com').isLookalike).toBe(true);
    expect(isLookalikeDomain('g00gle.com').isLookalike).toBe(true);
    expect(isLookalikeDomain('paypal.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('google.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('github.com').isLookalike).toBe(false);

    // Link Lens deep inspection
    const report1 = analyzeLinkWithLens('http://paypa1.com/login?utm_source=spam&gclid=123');
    expect(report1.suspiciousReasons.length).toBeGreaterThan(0);
    expect(report1.isLookalike).toBe(true);
    expect(report1.isSecure).toBe(false);
    expect(report1.trackingParamsFound).toContain('utm_source');
    expect(report1.cleanUrl).toBe('http://paypa1.com/login');

    const report2 = analyzeLinkWithLens('https://www.eff.org/deeplinks?utm_campaign=tracker');
    expect(report2.suspiciousReasons.length).toBe(0);
    expect(report2.isSecure).toBe(true);
    expect(report2.trackingParamsFound).toContain('utm_campaign');
    expect(report2.cleanUrl).toBe('https://www.eff.org/deeplinks');
  });
});

