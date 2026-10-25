import { describe, it, expect } from 'vitest';
import {
  getUserAgentPresets,
  resolveUserAgent,
  generateFingerprintNoiseScript,
} from '../../src/shared/userAgentManager';

describe('User-Agent Spoofing & Anti-Fingerprinting Manager', () => {
  describe('getUserAgentPresets', () => {
    it('returns standard list of supported desktop and mobile platform presets', () => {
      const presets = getUserAgentPresets();
      expect(presets.length).toBeGreaterThanOrEqual(5);

      const platforms = presets.map((p) => p.platform);
      expect(platforms).toContain('Default');
      expect(platforms).toContain('Windows');
      expect(platforms).toContain('macOS');
      expect(platforms).toContain('Linux');
      expect(platforms).toContain('iOS');
      expect(platforms).toContain('Android');
    });

    it('flags mobile presets with isMobile=true', () => {
      const presets = getUserAgentPresets();
      const iphone = presets.find((p) => p.id === 'ios-iphone');
      const android = presets.find((p) => p.id === 'android-chrome');
      const windows = presets.find((p) => p.id === 'windows-chrome');

      expect(iphone?.isMobile).toBe(true);
      expect(android?.isMobile).toBe(true);
      expect(windows?.isMobile).toBe(false);
    });
  });

  describe('resolveUserAgent', () => {
    it('returns null for default preset to preserve native Chromium engine UA', () => {
      expect(resolveUserAgent('default')).toBeNull();
      expect(resolveUserAgent(undefined)).toBeNull();
      expect(resolveUserAgent('')).toBeNull();
    });

    it('returns valid User-Agent string for Windows Chrome preset', () => {
      const ua = resolveUserAgent('windows-chrome');
      expect(ua).toContain('Windows NT 10.0');
      expect(ua).toContain('Chrome/');
      expect(ua).toContain('AppleWebKit/');
    });

    it('returns valid User-Agent string for macOS Safari preset', () => {
      const ua = resolveUserAgent('macos-safari');
      expect(ua).toContain('Macintosh; Intel Mac OS X');
      expect(ua).toContain('Version/');
      expect(ua).toContain('Safari/');
    });

    it('returns valid User-Agent string for Linux Firefox preset', () => {
      const ua = resolveUserAgent('linux-firefox');
      expect(ua).toContain('X11; Ubuntu; Linux x86_64');
      expect(ua).toContain('Firefox/');
    });

    it('prioritizes explicit custom User-Agent override when provided', () => {
      const customString = 'Mozilla/5.0 (CustomBot/1.0; +http://custom.org)';
      expect(resolveUserAgent('windows-chrome', customString)).toBe(customString);
      expect(resolveUserAgent('default', '  MySpecialBrowser/2.0  ')).toBe('MySpecialBrowser/2.0');
    });

    it('returns null for unknown preset IDs', () => {
      expect(resolveUserAgent('unknown-platform-xyz')).toBeNull();
    });
  });

  describe('generateFingerprintNoiseScript', () => {
    it('returns self-executing JavaScript injection string', () => {
      const script = generateFingerprintNoiseScript();
      expect(typeof script).toBe('string');
      expect(script).toContain('(function()');
      expect(script).toContain('__novaFingerprintNoiseInjected');
    });

    it('patches CanvasRenderingContext2D.prototype.getImageData with deterministic micro-noise', () => {
      const script = generateFingerprintNoiseScript();
      expect(script).toContain('CanvasRenderingContext2D.prototype.getImageData');
      expect(script).toContain('HTMLCanvasElement.prototype.toDataURL');
    });

    it('patches AudioBuffer.prototype.getChannelData to prevent acoustic fingerprinting', () => {
      const script = generateFingerprintNoiseScript();
      expect(script).toContain('AudioBuffer.prototype.getChannelData');
    });
  });
});
