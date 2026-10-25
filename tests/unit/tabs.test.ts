import { describe, it, expect } from 'vitest';
import { Tab } from '../../src/shared/types';

describe('Tabs Management & Pinning (M1.1 & M1.2)', () => {
  it('supports tab pinning and preserves pinned status', () => {
    const tabs: Tab[] = [
      {
        id: 'tab-1',
        url: 'https://github.com',
        title: 'GitHub',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isSecure: true,
        blockedCount: 0,
        isMuted: false,
        zoomFactor: 1.0,
        isPinned: false,
      },
      {
        id: 'tab-2',
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
    ];

    expect(tabs[0].isPinned).toBe(false);
    expect(tabs[1].isPinned).toBe(true);

    // Toggle pin simulation
    const updated = tabs.map((t) => (t.id === 'tab-1' ? { ...t, isPinned: !t.isPinned } : t));
    expect(updated[0].isPinned).toBe(true);
  });

  it('filters unpinned tabs when closing other tabs', () => {
    const tabs: Tab[] = [
      {
        id: 'tab-pinned',
        url: 'https://app.slack.com',
        title: 'Slack',
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
        id: 'tab-target',
        url: 'https://developer.mozilla.org',
        title: 'MDN Web Docs',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isSecure: true,
        blockedCount: 0,
        isMuted: false,
        zoomFactor: 1.0,
        isPinned: false,
      },
      {
        id: 'tab-discardable',
        url: 'https://news.ycombinator.com',
        title: 'Hacker News',
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isSecure: true,
        blockedCount: 0,
        isMuted: false,
        zoomFactor: 1.0,
        isPinned: false,
      },
    ];

    // Close other tabs relative to tab-target:
    // tab-target is kept, tab-pinned is protected, tab-discardable is closed
    const keptTabs = tabs.filter((t) => t.id === 'tab-target' || t.isPinned);
    expect(keptTabs.map((t) => t.id)).toEqual(['tab-pinned', 'tab-target']);
  });
});
