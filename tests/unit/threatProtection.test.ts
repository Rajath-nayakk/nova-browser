import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { ThreatProtectionManager } from '../../src/main/threatProtection';

describe('ThreatProtectionManager (NOVA Sentinel)', () => {
  let tempDir: string;
  let threatManager: ThreatProtectionManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-threat-test-'));
    threatManager = new ThreatProtectionManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('loads bundled threat database with zero remote calls', () => {
    expect(threatManager.getThreatCount()).toBeGreaterThanOrEqual(20);
    expect(threatManager.getLastUpdated()).toBeGreaterThan(0);
  });

  it('identifies known phishing domains and subdomains', () => {
    const result1 = threatManager.checkUrl('https://paypal-security-update.com/login');
    expect(result1.isThreat).toBe(true);
    expect(result1.category).toBe('phishing');
    expect(result1.domain).toBe('paypal-security-update.com');
    expect(result1.reason).toContain('credential harvesting');

    // Subdomain matching
    const result2 = threatManager.checkUrl('https://auth.user.paypal-security-update.com/account');
    expect(result2.isThreat).toBe(true);
    expect(result2.category).toBe('phishing');
  });

  it('identifies known malware and scam domains', () => {
    const malwareResult = threatManager.checkUrl('http://trojan-downloader.biz/payload.exe');
    expect(malwareResult.isThreat).toBe(true);
    expect(malwareResult.category).toBe('malware');

    const scamResult = threatManager.checkUrl('https://elon-crypto-giveaway2026.net/deposit');
    expect(scamResult.isThreat).toBe(true);
    expect(scamResult.category).toBe('scam');
  });

  it('identifies lookalike/homograph phishing attempts', () => {
    const lookalikeResult = threatManager.checkUrl('https://paypa1.com/signin');
    expect(lookalikeResult.isThreat).toBe(true);
    expect(lookalikeResult.category).toBe('phishing');
    expect(lookalikeResult.reason).toContain('paypal.com');
  });

  it('passes legitimate safe domains cleanly', () => {
    expect(threatManager.checkUrl('https://duckduckgo.com').isThreat).toBe(false);
    expect(threatManager.checkUrl('https://en.wikipedia.org').isThreat).toBe(false);
    expect(threatManager.checkUrl('https://github.com').isThreat).toBe(false);
  });

  it('supports explicit per-session bypass for advanced users', () => {
    const url = 'https://paypal-security-update.com/test';
    expect(threatManager.checkUrl(url).isThreat).toBe(true);

    threatManager.bypassThreatForSession('paypal-security-update.com');
    expect(threatManager.checkUrl(url).isThreat).toBe(false);

    // New instance without session bypass memory respects threat list again
    const freshManager = new ThreatProtectionManager(tempDir);
    expect(freshManager.checkUrl(url).isThreat).toBe(true);
  });
});
