import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FilterEngineManager } from '../../src/main/filterEngine';

describe('NOVA Shield Anti-Circumvention Scriptlets', () => {
  let tempDir: string;
  let filterManager: FilterEngineManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-scriptlets-test-'));
    filterManager = new FilterEngineManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates generic anti-adblock defusing scriptlets for all websites', () => {
    const script = filterManager.getScriptlets('https://news-portal.example.com/article');

    expect(script).toContain('window.canRunAds = true');
    expect(script).toContain('window.isAdBlockActive = false');
    expect(script).toContain('window.adsbygoogle');
    expect(script).toContain('window.FuckAdBlock');
    expect(script).toContain('window.BlockAdBlock');
    expect(script).toContain('.adblock-modal');
  });

  it('includes specialized video ad evasion scriptlets for YouTube', () => {
    const ytScript = filterManager.getScriptlets('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    expect(ytScript).toContain('window.__nova_yt_shield_active');
    expect(ytScript).toContain('.ytp-ad-skip-button');
    expect(ytScript).toContain('video.playbackRate = 16.0');
    expect(ytScript).toContain('ytd-enforcement-message-view-model');
  });

  it('omits video-specific evasion handlers for generic sites', () => {
    const genericScript = filterManager.getScriptlets('https://wikipedia.org');

    expect(genericScript).not.toContain('__nova_yt_shield_active');
    expect(genericScript).not.toContain('video.playbackRate = 16.0');
  });

  it('produces valid ECMAScript without TypeScript runtime artifacts', () => {
    const script = filterManager.getScriptlets('https://www.youtube.com');

    // Verify absence of TypeScript casting keywords inside the raw JS string
    expect(script).not.toContain('as HTMLElement');
    expect(script).not.toContain('as any');
    expect(script).not.toContain(': void');
    expect(script).not.toContain(': boolean');

    // Verify syntax validity by parsing through Function constructor
    expect(() => new Function(script)).not.toThrow();
  });
});
