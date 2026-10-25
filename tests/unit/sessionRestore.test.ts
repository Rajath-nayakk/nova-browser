import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  buildSessionSnapshot,
  sanitizeRestoredUrl,
  shouldLazyLoadTab,
  restoreTabState,
} from '../../src/main/sessionRestore';
import { LocalStorageManager } from '../../src/main/storage';
import { Tab } from '../../src/shared/types';
import { NEW_TAB_URL } from '../../src/shared/constants';

describe('Cold-Boot Startup Optimization & Lazy Session Restore', () => {
  let tempDir: string;
  let storage: LocalStorageManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-session-test-'));
    storage = new LocalStorageManager(tempDir);
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('buildSessionSnapshot', () => {
    it('persists non-private tabs and excludes incognito tabs', () => {
      const mockTabs: Tab[] = [
        {
          id: 'tab-1',
          url: 'https://duckduckgo.com',
          title: 'DuckDuckGo',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isSecure: true,
          blockedCount: 0,
          isMuted: false,
          zoomFactor: 1.0,
          isPinned: true,
        },
        {
          id: 'tab-private',
          url: 'https://secret.example.com',
          title: 'Secret Incognito',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isSecure: true,
          blockedCount: 0,
          isMuted: false,
          zoomFactor: 1.0,
          isPrivate: true,
        },
        {
          id: 'tab-2',
          url: 'https://eff.org',
          title: 'EFF',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isSecure: true,
          blockedCount: 0,
          isMuted: false,
          zoomFactor: 1.0,
        },
      ];

      const snapshot = buildSessionSnapshot(mockTabs, 'tab-2');
      expect(snapshot.tabs).toHaveLength(2);
      expect(snapshot.tabs.map((t) => t.id)).toEqual(['tab-1', 'tab-2']);
      expect(snapshot.tabs[0].isPinned).toBe(true);
      expect(snapshot.activeTabId).toBe('tab-2');
      expect(snapshot.savedAt).toBeGreaterThan(0);
    });

    it('falls back to first eligible tab if active tab was private', () => {
      const mockTabs: Tab[] = [
        {
          id: 'tab-1',
          url: 'https://duckduckgo.com',
          title: 'DuckDuckGo',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isSecure: true,
          blockedCount: 0,
          isMuted: false,
          zoomFactor: 1.0,
        },
        {
          id: 'tab-private',
          url: 'https://secret.example.com',
          title: 'Private Tab',
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isSecure: true,
          blockedCount: 0,
          isMuted: false,
          zoomFactor: 1.0,
          isPrivate: true,
        },
      ];

      const snapshot = buildSessionSnapshot(mockTabs, 'tab-private');
      expect(snapshot.tabs).toHaveLength(1);
      expect(snapshot.activeTabId).toBe('tab-1');
    });
  });

  describe('sanitizeRestoredUrl', () => {
    it('preserves valid web and internal URLs', () => {
      expect(sanitizeRestoredUrl('https://en.wikipedia.org')).toBe('https://en.wikipedia.org');
      expect(sanitizeRestoredUrl('nova://bookmarks')).toBe('nova://bookmarks');
    });

    it('sanitizes unsafe schemes and empty inputs to NEW_TAB_URL', () => {
      expect(sanitizeRestoredUrl('')).toBe(NEW_TAB_URL);
      expect(sanitizeRestoredUrl('javascript:alert(1)')).toBe(NEW_TAB_URL);
      expect(sanitizeRestoredUrl('data:text/html,<h1>bad</h1>')).toBe(NEW_TAB_URL);
      expect(sanitizeRestoredUrl('file:///etc/passwd')).toBe(NEW_TAB_URL);
    });

    it('recovers original target URL from warning or error pages', () => {
      const warningUrl = `nova://warning?url=${encodeURIComponent('https://example.com/login')}&threat=malware`;
      expect(sanitizeRestoredUrl(warningUrl)).toBe('https://example.com/login');

      const errorUrl = `nova://error?url=${encodeURIComponent('https://eff.org')}&code=-105`;
      expect(sanitizeRestoredUrl(errorUrl)).toBe('https://eff.org');
    });
  });

  describe('shouldLazyLoadTab & restoreTabState', () => {
    it('marks background web tabs as suspended for lazy loading', () => {
      expect(shouldLazyLoadTab('https://example.com', false)).toBe(true);
      expect(shouldLazyLoadTab('https://example.com', true)).toBe(false);
      expect(shouldLazyLoadTab(NEW_TAB_URL, false)).toBe(false);

      const backgroundTab = restoreTabState(
        { id: 'tab-bg', url: 'https://news.ycombinator.com', title: 'Hacker News' },
        false
      );
      expect(backgroundTab.isSuspended).toBe(true);
      expect(backgroundTab.isLoading).toBe(false);

      const activeTab = restoreTabState(
        { id: 'tab-act', url: 'https://news.ycombinator.com', title: 'Hacker News' },
        true
      );
      expect(activeTab.isSuspended).toBe(false);
    });
  });

  describe('LocalStorageManager Session Integration', () => {
    it('saves and restores session atomically', () => {
      expect(storage.getLastSession()).toBeNull();

      const session = {
        tabs: [
          { id: 'tab-1', url: 'https://duckduckgo.com', title: 'DDG', isPinned: true },
          { id: 'tab-2', url: 'https://wikipedia.org', title: 'Wikipedia' },
        ],
        activeTabId: 'tab-1',
        savedAt: Date.now(),
      };

      storage.saveSession(session);

      const loaded = storage.getLastSession();
      expect(loaded).not.toBeNull();
      expect(loaded?.tabs).toHaveLength(2);
      expect(loaded?.activeTabId).toBe('tab-1');
      expect(loaded?.tabs[0].isPinned).toBe(true);

      storage.clearSession();
      expect(storage.getLastSession()).toBeNull();
    });

    it('handles corrupted session files without crashing', () => {
      const sessionPath = path.join(tempDir, 'session.json');
      fs.writeFileSync(sessionPath, 'invalid json content!@#$', 'utf-8');

      const loaded = storage.getLastSession();
      expect(loaded).toBeNull();
    });
  });
});
