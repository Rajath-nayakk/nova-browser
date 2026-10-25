import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  isSafeNavigationUrl,
  extractOrigin,
  isExecutableFile,
  stripTrackingParameters,
  normalizeUserInput,
} from '../../src/shared/validation';
import { checkUrlAgainstBlocklist } from '../../src/main/blocklist';

describe('Security Audit Automated Checks', () => {
  describe('Navigation Scheme Security', () => {
    it('strictly rejects javascript: execution schemes', () => {
      expect(isSafeNavigationUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(isSafeNavigationUrl('JAVASCRIPT:void(0)')).toBe(false);
      expect(isSafeNavigationUrl('javascript://%0aalert(1)')).toBe(false);
    });

    it('strictly rejects data: and vbscript: schemes', () => {
      expect(isSafeNavigationUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeNavigationUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('strictly rejects file: and shell: schemes', () => {
      expect(isSafeNavigationUrl('file:///C:/Windows/system32/cmd.exe')).toBe(false);
      expect(isSafeNavigationUrl('shell:open')).toBe(false);
      expect(isSafeNavigationUrl('electron:reload')).toBe(false);
    });

    it('allows safe HTTPS, HTTP, and internal nova:// schemes', () => {
      expect(isSafeNavigationUrl('https://www.eff.org')).toBe(true);
      expect(isSafeNavigationUrl('https://duckduckgo.com/?q=privacy')).toBe(true);
      expect(isSafeNavigationUrl('http://localhost:3000')).toBe(true);
      expect(isSafeNavigationUrl('nova://newtab')).toBe(true);
      expect(isSafeNavigationUrl('nova://settings')).toBe(true);
      expect(isSafeNavigationUrl('nova://history')).toBe(true);
      expect(isSafeNavigationUrl('about:blank')).toBe(true);
    });

    it('converts dangerous schemes in omnibox to safe search queries', () => {
      const sanitized = normalizeUserInput('javascript:alert(1)');
      expect(sanitized).toBe('https://duckduckgo.com/?q=javascript%3Aalert(1)');
      expect(sanitized).not.toBe('javascript:alert(1)');
    });
  });

  describe('Origin Extraction & Permission Scoping', () => {
    it('extracts exact origin without confusing path or subdomain', () => {
      expect(extractOrigin('https://meet.jit.si/room123')).toBe('https://meet.jit.si');
      expect(extractOrigin('https://evil.com/fake/google.com')).toBe('https://evil.com');
      expect(extractOrigin('http://localhost:8080/app')).toBe('http://localhost:8080');
      expect(extractOrigin('nova://settings')).toBe('');
    });
  });

  describe('Download Path Traversal Defense', () => {
    it('sanitizes filename to prevent directory traversal', () => {
      const maliciousFilenames = [
        '../../../../Windows/System32/evil.exe',
        '..\\..\\..\\Windows\\System32\\evil.exe',
        'sub/folder/file.pdf',
        'file\x00.exe',
      ];

      for (const raw of maliciousFilenames) {
        const safe = path.basename(raw).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
        expect(safe).not.toContain('..');
        expect(safe).not.toContain('/');
        expect(safe).not.toContain('\\');
        expect(safe).not.toContain('\x00');
      }
    });

    it('identifies dangerous executable extensions', () => {
      expect(isExecutableFile('payload.exe')).toBe(true);
      expect(isExecutableFile('setup.bat')).toBe(true);
      expect(isExecutableFile('run.cmd')).toBe(true);
      expect(isExecutableFile('install.msi')).toBe(true);
      expect(isExecutableFile('exploit.ps1')).toBe(true);
      expect(isExecutableFile('readme.txt')).toBe(false);
      expect(isExecutableFile('photo.jpeg')).toBe(false);
    });
  });

  describe('Privacy & Telemetry Stripping', () => {
    it('strips all standard marketing and surveillance parameters', () => {
      const trackedUrl =
        'https://example.org/article?utm_source=ad&utm_medium=cpc&fbclid=123&gclid=456&msclkid=789&mc_eid=abc&real_param=keep_me';
      const cleanUrl = stripTrackingParameters(trackedUrl);
      expect(cleanUrl).toBe('https://example.org/article?real_param=keep_me');
      expect(cleanUrl).not.toContain('utm_');
      expect(cleanUrl).not.toContain('fbclid');
      expect(cleanUrl).not.toContain('gclid');
      expect(cleanUrl).not.toContain('msclkid');
    });

    it('blocks tracking beacons without false-positive blocking of valid assets', () => {
      expect(checkUrlAgainstBlocklist('https://google-analytics.com/analytics.js').blocked).toBe(true);
      expect(checkUrlAgainstBlocklist('https://connect.facebook.net/en_US/fbevents.js').blocked).toBe(true);
      expect(checkUrlAgainstBlocklist('https://en.wikipedia.org/static/images/icons/wikipedia.png').blocked).toBe(false);
    });
  });
});
