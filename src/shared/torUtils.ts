/**
 * Validates whether a domain or URL represents a Tor Hidden Service (.onion).
 */
export function isOnionDomain(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  let hostname = input.trim().toLowerCase();
  try {
    if (hostname.includes('://')) {
      const parsed = new URL(hostname);
      hostname = parsed.hostname;
    } else {
      hostname = hostname.split('/')[0].split(':')[0];
    }
  } catch {
    // fallback to string check
  }

  return hostname.endsWith('.onion');
}

/**
 * Validates standard Tor v3 onion address format:
 * 56 base32 characters (a-z, 2-7) ending in .onion.
 */
export function isValidV3OnionAddress(input: string): boolean {
  if (!input || typeof input !== 'string') return false;

  let hostname = input.trim().toLowerCase();
  try {
    if (hostname.includes('://')) {
      const parsed = new URL(hostname);
      hostname = parsed.hostname;
    } else {
      hostname = hostname.split('/')[0].split(':')[0];
    }
  } catch {
    // fallback
  }

  // Remove port if present
  hostname = hostname.split(':')[0];

  return /^[a-z2-7]{56}\.onion$/.test(hostname);
}

/**
 * Generates user-facing routing diagnostic message for Onion navigation.
 */
export function getOnionRoutingStatus(
  url: string,
  isTorRoutingEnabled: boolean,
  torPort = 9050
): {
  isOnion: boolean;
  canRoute: boolean;
  message: string;
  actionRequired?: 'enable_tor' | 'check_daemon';
} {
  const onion = isOnionDomain(url);
  if (!onion) {
    return {
      isOnion: false,
      canRoute: true,
      message: 'Standard clearnet destination.',
    };
  }

  if (!isTorRoutingEnabled) {
    return {
      isOnion: true,
      canRoute: false,
      message: 'Tor Onion Service detected. Tor routing is currently disabled in your privacy settings.',
      actionRequired: 'enable_tor',
    };
  }

  return {
    isOnion: true,
    canRoute: true,
    message: `Routing encrypted onion traffic through local Tor SOCKS5 proxy on port ${torPort}.`,
  };
}
