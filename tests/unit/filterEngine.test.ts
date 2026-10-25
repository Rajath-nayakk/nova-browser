import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FilterEngineManager } from '../../src/main/filterEngine';

describe('FilterEngineManager (NOVA Shield)', () => {
  let tempDir: string;
  let filterManager: FilterEngineManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-filter-test-'));
    filterManager = new FilterEngineManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('compiles bundled EasyList and EasyPrivacy rules and lists info', () => {
    const lists = filterManager.getFilterLists();
    expect(lists.length).toBeGreaterThanOrEqual(4);
    expect(lists.some((l) => l.id === 'easylist')).toBe(true);
    expect(lists.some((l) => l.id === 'easyprivacy')).toBe(true);
    expect(lists.some((l) => l.id === 'nova-youtube')).toBe(true);
    expect(lists.some((l) => l.id === 'nova-miners')).toBe(true);
  });

  it('blocks known third-party advertising requests', () => {
    const adResult = filterManager.match(
      'https://securepubads.g.doubleclick.net/gampad/ads?iu=123',
      'https://news-site.com',
      'script'
    );
    expect(adResult.blocked).toBe(true);
    expect(adResult.category).toBe('ads');
  });

  it('blocks known tracking and analytics requests', () => {
    const trackerResult = filterManager.match(
      'https://www.google-analytics.com/analytics.js',
      'https://ecommerce.com',
      'script'
    );
    expect(trackerResult.blocked).toBe(true);
    expect(trackerResult.category).toBe('analytics');

    const fbResult = filterManager.match(
      'https://connect.facebook.net/en_US/fbevents.js',
      'https://ecommerce.com',
      'script'
    );
    expect(fbResult.blocked).toBe(true);
    expect(fbResult.category).toBe('trackers');
  });

  it('blocks known cryptominers', () => {
    const minerResult = filterManager.match(
      'https://coinhive.com/lib/coinhive.min.js',
      'https://blog.com',
      'script'
    );
    expect(minerResult.blocked).toBe(true);
    expect(minerResult.category).toBe('cryptominers');
  });

  it('blocks YouTube ad telemetry endpoints', () => {
    const ytAdResult = filterManager.match(
      'https://www.youtube.com/api/stats/ads?ns=yt',
      'https://www.youtube.com/watch?v=12345',
      'xmlhttprequest'
    );
    expect(ytAdResult.blocked).toBe(true);
  });

  it('permits legitimate first-party content requests', () => {
    const normalResult = filterManager.match(
      'https://en.wikipedia.org/static/images/project-logos/enwiki.png',
      'https://en.wikipedia.org',
      'image'
    );
    expect(normalResult.blocked).toBe(false);
  });

  it('extracts cosmetic styling rules for hiding ad placeholders', () => {
    const styles = filterManager.getCosmeticFilters('https://example.com', 'example.com');
    expect(styles).toContain('display: none !important');
    expect(styles).toContain('google_ads');
  });

  it('appends dedicated YouTube ad-suppression CSS on YouTube pages', () => {
    const ytStyles = filterManager.getCosmeticFilters('https://www.youtube.com', 'youtube.com');
    expect(ytStyles).toContain('.ytp-ad-module');
    expect(ytStyles).toContain('.ytp-ad-skip-button-slot');
    expect(ytStyles).toContain('ytd-ad-slot-renderer');
  });
});
