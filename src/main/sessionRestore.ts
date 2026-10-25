import { Tab, PersistedTabSession } from '../shared/types';
import { NEW_TAB_URL } from '../shared/constants';
import { isInternalUrl, isSafeNavigationUrl } from '../shared/validation';

/**
 * Builds a clean snapshot of non-private tabs for cold-boot session restoration.
 */
export function buildSessionSnapshot(tabs: Tab[], activeTabId: string): PersistedTabSession {
  // Never persist incognito / private browsing tabs
  const eligibleTabs = tabs.filter((t) => !t.isPrivate);

  const serializedTabs = eligibleTabs.map((t) => ({
    id: t.id,
    url: t.url,
    title: t.title,
    favicon: t.favicon,
    isPinned: !!t.isPinned,
  }));

  let validActiveId = activeTabId;
  if (!eligibleTabs.some((t) => t.id === validActiveId)) {
    validActiveId = eligibleTabs.length > 0 ? eligibleTabs[0].id : '';
  }

  return {
    tabs: serializedTabs,
    activeTabId: validActiveId,
    savedAt: Date.now(),
  };
}

/**
 * Validates and sanitizes a restored URL, recovering from warning or error URLs.
 */
export function sanitizeRestoredUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return NEW_TAB_URL;
  }

  const trimmed = rawUrl.trim();
  if (!isSafeNavigationUrl(trimmed) && !isInternalUrl(trimmed)) {
    return NEW_TAB_URL;
  }

  // If previous session left off on a temporary warning or error page, recover target or fallback to new tab
  if (trimmed.startsWith('nova://warning') || trimmed.startsWith('nova://error')) {
    try {
      const parsed = new URL(trimmed);
      const targetParam = parsed.searchParams.get('url');
      if (targetParam && isSafeNavigationUrl(targetParam)) {
        return targetParam;
      }
    } catch {
      // ignore
    }
    return NEW_TAB_URL;
  }

  return trimmed;
}

/**
 * Determines whether a tab's WebContentsView should be deferred / lazily loaded.
 */
export function shouldLazyLoadTab(url: string, isActive: boolean): boolean {
  if (isActive) return false;
  if (isInternalUrl(url)) return false;
  return true;
}

/**
 * Reconstitutes a Tab object from persisted session data.
 */
export function restoreTabState(
  persisted: { id: string; url: string; title: string; favicon?: string; isPinned?: boolean },
  isActive: boolean
): Tab {
  const finalUrl = sanitizeRestoredUrl(persisted.url);
  const lazy = shouldLazyLoadTab(finalUrl, isActive);

  return {
    id: persisted.id || `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    url: finalUrl,
    title: persisted.title || (finalUrl === NEW_TAB_URL ? 'New Tab' : finalUrl),
    favicon: persisted.favicon,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isSecure: finalUrl.startsWith('https://'),
    blockedCount: 0,
    isMuted: false,
    isPlayingAudio: false,
    zoomFactor: 1.0,
    isPrivate: false,
    isPinned: !!persisted.isPinned,
    isSuspended: lazy,
  };
}
