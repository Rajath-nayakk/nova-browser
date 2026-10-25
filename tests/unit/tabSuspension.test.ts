import { describe, it, expect } from 'vitest';
import { shouldSuspendTab } from '../../src/main/tabSuspension';
import { Tab } from '../../src/shared/types';

describe('Tab Memory Suspension & Discard Logic', () => {
  const baseTab: Tab = {
    id: 'tab-1',
    url: 'https://news.ycombinator.com',
    title: 'Hacker News',
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isSecure: true,
    blockedCount: 0,
    isMuted: false,
    isPlayingAudio: false,
    zoomFactor: 1.0,
    isSuspended: false,
  };

  const timeoutMs = 30 * 60 * 1000; // 30 mins
  const now = Date.now();

  it('suspends background tab that has been inactive longer than threshold', () => {
    const lastActiveTime = now - (31 * 60 * 1000); // 31 mins ago
    const shouldSuspend = shouldSuspendTab(baseTab, lastActiveTime, 'tab-2', timeoutMs, now);
    expect(shouldSuspend).toBe(true);
  });

  it('does not suspend tab if inactive time is within threshold', () => {
    const lastActiveTime = now - (15 * 60 * 1000); // 15 mins ago
    const shouldSuspend = shouldSuspendTab(baseTab, lastActiveTime, 'tab-2', timeoutMs, now);
    expect(shouldSuspend).toBe(false);
  });

  it('never suspends the current foreground active tab', () => {
    const lastActiveTime = now - (60 * 60 * 1000);
    const shouldSuspend = shouldSuspendTab(baseTab, lastActiveTime, 'tab-1', timeoutMs, now);
    expect(shouldSuspend).toBe(false);
  });

  it('never suspends pinned tabs', () => {
    const pinnedTab: Tab = { ...baseTab, isPinned: true };
    const lastActiveTime = now - (60 * 60 * 1000);
    const shouldSuspend = shouldSuspendTab(pinnedTab, lastActiveTime, 'tab-2', timeoutMs, now);
    expect(shouldSuspend).toBe(false);
  });

  it('never suspends tabs actively streaming media / audio', () => {
    const audioTab: Tab = { ...baseTab, isPlayingAudio: true };
    const lastActiveTime = now - (60 * 60 * 1000);
    const shouldSuspend = shouldSuspendTab(audioTab, lastActiveTime, 'tab-2', timeoutMs, now);
    expect(shouldSuspend).toBe(false);
  });

  it('never suspends internal nova:// browser pages', () => {
    const internalTab: Tab = { ...baseTab, url: 'nova://newtab' };
    const lastActiveTime = now - (60 * 60 * 1000);
    const shouldSuspend = shouldSuspendTab(internalTab, lastActiveTime, 'tab-2', timeoutMs, now);
    expect(shouldSuspend).toBe(false);
  });

  it('does not resuspend already suspended tabs', () => {
    const alreadySuspended: Tab = { ...baseTab, isSuspended: true };
    const lastActiveTime = now - (60 * 60 * 1000);
    const shouldSuspend = shouldSuspendTab(alreadySuspended, lastActiveTime, 'tab-2', timeoutMs, now);
    expect(shouldSuspend).toBe(false);
  });
});
