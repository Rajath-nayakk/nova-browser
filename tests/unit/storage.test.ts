import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { LocalStorageManager } from '../../src/main/storage';

describe('LocalStorageManager', () => {
  let tempDir: string;
  let manager: LocalStorageManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-test-'));
    manager = new LocalStorageManager(tempDir);
  });

  afterEach(() => {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  });

  it('initializes with default privacy-focused settings', () => {
    const settings = manager.getSettings();
    expect(settings.searchEngine).toBe('duckduckgo');
    expect(settings.blockTrackers).toBe(true);
    expect(settings.blockAds).toBe(true);
    expect(settings.sendDoNotTrack).toBe(true);
    expect(settings.theme).toBe('dark');
  });

  it('updates settings and persists to disk', () => {
    manager.updateSettings({ theme: 'light', blockAds: false });
    const freshManager = new LocalStorageManager(tempDir);
    const loaded = freshManager.getSettings();
    expect(loaded.theme).toBe('light');
    expect(loaded.blockAds).toBe(false);
    expect(loaded.blockTrackers).toBe(true); // preserved
  });

  it('resets settings cleanly without erasing bookmarks', () => {
    manager.addBookmark({ title: 'Important Link', url: 'https://eff.org' });
    manager.updateSettings({ theme: 'light', searchEngine: 'brave' });

    manager.resetSettings();
    const settings = manager.getSettings();
    expect(settings.searchEngine).toBe('duckduckgo');
    expect(settings.theme).toBe('dark');

    const bookmarks = manager.getBookmarks();
    expect(bookmarks.some((b) => b.url === 'https://eff.org')).toBe(true);
  });

  it('adds, updates, and removes bookmarks', () => {
    const bm = manager.addBookmark({ title: 'Wikipedia', url: 'https://en.wikipedia.org' });
    expect(bm.id).toBeDefined();

    manager.updateBookmark(bm.id, { title: 'Wikipedia (Main)' });
    let current = manager.getBookmarks().find((b) => b.id === bm.id);
    expect(current?.title).toBe('Wikipedia (Main)');

    manager.removeBookmark(bm.id);
    current = manager.getBookmarks().find((b) => b.id === bm.id);
    expect(current).toBeUndefined();
  });

  it('records history when enabled', () => {
    manager.addHistory({ title: 'Page 1', url: 'https://site1.org' });
    const history = manager.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].url).toBe('https://site1.org');
  });

  it('strictly does NOT record history when saveHistory is disabled', () => {
    manager.updateSettings({ saveHistory: false });
    manager.addHistory({ title: 'Secret Page', url: 'https://private-link.org' });
    const history = manager.getHistory();
    expect(history.some((h) => h.url === 'https://private-link.org')).toBe(false);
  });

  it('clears history correctly by time range', () => {
    manager.addHistory({ title: 'Item 1', url: 'https://a.com' });
    manager.addHistory({ title: 'Item 2', url: 'https://b.com' });
    expect(manager.getHistory().length).toBe(2);

    manager.clearHistory('all');
    expect(manager.getHistory().length).toBe(0);
  });

  it('manages site permissions securely', () => {
    expect(manager.getSitePermission('meet.jit.si', 'camera')).toBeUndefined();

    manager.setSitePermission('meet.jit.si', 'camera', 'allow');
    expect(manager.getSitePermission('meet.jit.si', 'camera')).toBe('allow');

    manager.revokeSitePermission('meet.jit.si', 'camera');
    expect(manager.getSitePermission('meet.jit.si', 'camera')).toBeUndefined();
  });

  it('recovers gracefully from corrupted JSON files', () => {
    const settingsPath = path.join(tempDir, 'settings.json');
    fs.writeFileSync(settingsPath, '{ this is corrupted json!@#$', 'utf-8');

    // Should not throw, should restore default and create a backup
    const newManager = new LocalStorageManager(tempDir);
    expect(newManager.getSettings().searchEngine).toBe('duckduckgo');

    const files = fs.readdirSync(tempDir);
    expect(files.some((f) => f.includes('corrupt'))).toBe(true);
  });
});
