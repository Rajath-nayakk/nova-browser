import { Tab } from '../shared/types';

/**
 * Evaluates whether an inactive tab qualifies for memory suspension/discard.
 * Pinned tabs, currently playing audio tabs, active foreground tabs, and internal pages are never suspended.
 */
export function shouldSuspendTab(
  tab: Tab,
  lastActiveTime: number,
  activeTabId: string,
  timeoutMs: number,
  now: number = Date.now()
): boolean {
  // Never suspend the current active tab
  if (tab.id === activeTabId) return false;

  // Never suspend if already suspended
  if (tab.isSuspended) return false;

  // Protect user's pinned work tabs
  if (tab.isPinned) return false;

  // Protect tabs actively streaming audio or media
  if (tab.isPlayingAudio) return false;

  // Do not discard internal browser pages (nova://)
  if (tab.url.startsWith('nova://') || tab.url === 'about:blank') return false;

  // Verify inactivity threshold
  return now - lastActiveTime >= timeoutMs;
}
