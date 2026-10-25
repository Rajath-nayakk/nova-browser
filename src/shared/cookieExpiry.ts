export const MAX_TRACKER_COOKIE_LIFETIME_SECONDS = 86400; // 24 hours

/**
 * Normalizes domains by stripping leading dots and port numbers.
 */
export function normalizeCookieDomain(domain: string): string {
  if (!domain || typeof domain !== 'string') return '';
  let d = domain.trim().toLowerCase();
  if (d.startsWith('.')) d = d.slice(1);
  return d.split(':')[0];
}

/**
 * Checks whether a cookie domain belongs to a third-party relative to the parent page origin.
 */
export function isThirdPartyCookie(cookieDomain: string, originDomain: string): boolean {
  const cDom = normalizeCookieDomain(cookieDomain);
  const oDom = normalizeCookieDomain(originDomain);

  if (!cDom || !oDom) return false;
  if (cDom === oDom) return false;

  // Same base domain check (e.g. sub.example.com and example.com)
  if (oDom.endsWith('.' + cDom) || cDom.endsWith('.' + oDom)) {
    return false;
  }

  return true;
}

/**
 * Determines whether a cookie's expiration date exceeds the allowable privacy threshold.
 */
export function shouldCapCookieExpiration(
  cookieDomain: string,
  originDomain: string,
  expirationDate?: number,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxLifetimeSeconds = MAX_TRACKER_COOKIE_LIFETIME_SECONDS
): boolean {
  if (!expirationDate) return false; // Session cookie, will expire on close
  if (expirationDate <= nowSeconds) return false; // Already expired

  const lifetime = expirationDate - nowSeconds;
  const isThirdParty = isThirdPartyCookie(cookieDomain, originDomain);

  // Cap if it is third-party and exceeds 24h, or first-party exceeds 30 days
  const threshold = isThirdParty ? maxLifetimeSeconds : maxLifetimeSeconds * 30;
  return lifetime > threshold;
}

/**
 * Calculates the capped expiration timestamp in seconds.
 */
export function capCookieExpirationDate(
  currentExpiration?: number,
  maxLifetimeSeconds = MAX_TRACKER_COOKIE_LIFETIME_SECONDS,
  nowSeconds = Math.floor(Date.now() / 1000)
): number {
  const maxAllowed = nowSeconds + maxLifetimeSeconds;
  if (!currentExpiration || currentExpiration > maxAllowed) {
    return maxAllowed;
  }
  return currentExpiration;
}

/**
 * Formats a cookie expiration timestamp for user-facing display.
 */
export function formatCookieExpiration(expirationDate?: number): string {
  if (!expirationDate) return 'Session (until browser closed)';
  const now = Math.floor(Date.now() / 1000);
  const diffSec = expirationDate - now;

  if (diffSec <= 0) return 'Expired';
  if (diffSec < 3600) return `In ${Math.ceil(diffSec / 60)} minutes`;
  if (diffSec < 86400) return `In ${Math.round(diffSec / 3600)} hours`;
  return `In ${Math.round(diffSec / 86400)} days`;
}
