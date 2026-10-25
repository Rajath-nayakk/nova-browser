import { Session } from 'electron';
import { CookieSummaryItem, OriginStorageDetails } from '../shared/types';
import {
  capCookieExpirationDate,
  normalizeCookieDomain,
  shouldCapCookieExpiration,
  MAX_TRACKER_COOKIE_LIFETIME_SECONDS,
} from '../shared/cookieExpiry';
import { extractDomain, extractOrigin } from '../shared/validation';

/**
 * Retrieves granular cookie and storage statistics for a specific URL or origin.
 */
export async function getOriginStorageDetails(
  targetSession: Session,
  targetUrlOrOrigin: string
): Promise<OriginStorageDetails> {
  const origin = extractOrigin(targetUrlOrOrigin);
  const domain = extractDomain(targetUrlOrOrigin);

  try {
    const allCookies = await targetSession.cookies.get({});
    const matchingCookies = allCookies.filter((c) => {
      const cDom = normalizeCookieDomain(c.domain || '');
      return cDom === domain || domain.endsWith('.' + cDom) || cDom.endsWith('.' + domain);
    });

    const cookies: CookieSummaryItem[] = matchingCookies.map((c) => ({
      name: c.name,
      domain: c.domain || domain,
      path: c.path || '/',
      secure: !!c.secure,
      httpOnly: !!c.httpOnly,
      expirationDate: c.expirationDate,
      isSession: !!c.session,
    }));

    return {
      origin,
      domain,
      cookieCount: cookies.length,
      cookies,
    };
  } catch (err) {
    console.warn(`Failed to inspect origin storage for ${targetUrlOrOrigin}:`, err);
    return {
      origin,
      domain,
      cookieCount: 0,
      cookies: [],
    };
  }
}

/**
 * Purges all cookies and storage data specifically for a target origin.
 */
export async function clearOriginStorage(
  targetSession: Session,
  targetUrlOrOrigin: string
): Promise<boolean> {
  const origin = extractOrigin(targetUrlOrOrigin);
  const domain = extractDomain(targetUrlOrOrigin);

  try {
    // 1. Remove matching cookies
    const allCookies = await targetSession.cookies.get({});
    for (const c of allCookies) {
      const cDom = normalizeCookieDomain(c.domain || '');
      if (cDom === domain || domain.endsWith('.' + cDom)) {
        const dom = c.domain || domain;
        const cleanDom = dom.startsWith('.') ? dom.slice(1) : dom;
        const url = `${c.secure ? 'https' : 'http'}://${cleanDom}${c.path || '/'}`;
        await targetSession.cookies.remove(url, c.name).catch(() => {});
      }
    }

    // 2. Clear origin-specific storage data (localStorage, indexedDB, cache)
    if (origin.startsWith('http')) {
      await targetSession.clearStorageData({
        origin,
        storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage'],
      });
    }

    return true;
  } catch (err) {
    console.warn(`Failed to clear origin storage for ${targetUrlOrOrigin}:`, err);
    return false;
  }
}

/**
 * Enforces the maximum cookie lifetime policy across all cookies in the active session.
 * Re-sets cookies with capped expiration dates.
 */
export async function enforceCookieLifetimePolicy(
  targetSession: Session,
  maxLifetimeSeconds = MAX_TRACKER_COOKIE_LIFETIME_SECONDS
): Promise<{ cappedCount: number; inspectedCount: number }> {
  try {
    const allCookies = await targetSession.cookies.get({});
    const now = Math.floor(Date.now() / 1000);
    let cappedCount = 0;

    for (const c of allCookies) {
      if (c.session || !c.expirationDate || !c.domain) continue;

      const lifetime = c.expirationDate - now;
      if (lifetime > maxLifetimeSeconds) {
        const newExpiration = capCookieExpirationDate(c.expirationDate, maxLifetimeSeconds, now);
        const protocol = c.secure ? 'https' : 'http';
        const cleanDomain = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
        const cookieUrl = `${protocol}://${cleanDomain}${c.path || '/'}`;

        try {
          await targetSession.cookies.set({
            url: cookieUrl,
            name: c.name,
            value: c.value,
            domain: c.domain,
            path: c.path || '/',
            secure: c.secure,
            httpOnly: c.httpOnly,
            expirationDate: newExpiration,
            sameSite: c.sameSite as any,
          });
          cappedCount++;
        } catch {
          // ignore individual cookie set failure
        }
      }
    }

    return { cappedCount, inspectedCount: allCookies.length };
  } catch (err) {
    console.warn('Failed to enforce cookie lifetime policy:', err);
    return { cappedCount: 0, inspectedCount: 0 };
  }
}
