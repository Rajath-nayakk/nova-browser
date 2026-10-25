/**
 * Privacy Shield & Content Blocking Engine for NOVA Browser.
 * Blocks ad networks, behavioral trackers, analytics, and cryptominers without telemetry.
 */

export type BlockCategory = 'ads' | 'trackers' | 'analytics' | 'cryptominers';

export interface BlockRule {
  pattern: RegExp;
  category: BlockCategory;
}

// Curated high-impact filter list targeting pervasive trackers, ads, and telemetry endpoints
export const TRACKER_RULES: BlockRule[] = [
  // Analytics & Telemetry
  { pattern: /([a-z0-9-]+\.)?google-analytics\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?googletagmanager\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?analytics\.google\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?hotjar\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?segment\.(com|io)/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?mixpanel\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?amplitude\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?heap(analytics)?\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?fullstory\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?yandex\.(ru|com)\/metrika/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?scorecardresearch\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?quantserve\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?chartbeat\.(com|net)/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?statcounter\.com/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?clarity\.ms/i, category: 'analytics' },
  { pattern: /([a-z0-9-]+\.)?matomo\.(org|cloud)/i, category: 'analytics' },

  // Advertising Networks & Ad Servers
  { pattern: /([a-z0-9-]+\.)?doubleclick\.net/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?googlesyndication\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?googleadservices\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?criteo\.(com|net)/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?taboola\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?outbrain\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?adroll\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?buysellads\.(com|net)/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?pubmatic\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?openx\.net/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?rubiconproject\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?adnxs\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?appnexus\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?mopub\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?inmobi\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?adform\.net/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?amazon-adsystem\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?bidswitch\.net/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?casalemedia\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?zedo\.com/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?popads\.net/i, category: 'ads' },
  { pattern: /([a-z0-9-]+\.)?popcash\.net/i, category: 'ads' },

  // Trackers & Fingerprinting
  { pattern: /connect\.facebook\.net\/(.*\/)?fbevents\.js/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?facebook\.com\/tr(\/|\?)/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?tiktok\.com\/.*analytics/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?ads-twitter\.com/i, category: 'trackers' },
  { pattern: /analytics\.twitter\.com/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?linkedin\.com\/px/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?pinterest\.com\/ct\.html/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?adjust\.com/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?appsflyer\.com/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?branch\.io/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?fingerprintjs\.(com|net)/i, category: 'trackers' },
  { pattern: /([a-z0-9-]+\.)?optimizely\.com\/.*\/optimizely\.js/i, category: 'trackers' },

  // Cryptominers
  { pattern: /([a-z0-9-]+\.)?coinhive\.com/i, category: 'cryptominers' },
  { pattern: /([a-z0-9-]+\.)?cryptoloot\.pro/i, category: 'cryptominers' },
  { pattern: /([a-z0-9-]+\.)?jsecoin\.com/i, category: 'cryptominers' },
  { pattern: /([a-z0-9-]+\.)?coin-imp\.com/i, category: 'cryptominers' },
  { pattern: /([a-z0-9-]+\.)?minr\.pw/i, category: 'cryptominers' },
  { pattern: /([a-z0-9-]+\.)?webmine\.cz/i, category: 'cryptominers' },
  { pattern: /([a-z0-9-]+\.)?crypto-loot\.com/i, category: 'cryptominers' },
];

/**
 * Checks if a given request URL matches any ad, tracker, or cryptominer rule
 */
export function checkUrlAgainstBlocklist(urlStr: string): { blocked: boolean; category?: BlockCategory } {
  for (const rule of TRACKER_RULES) {
    if (rule.pattern.test(urlStr)) {
      return { blocked: true, category: rule.category };
    }
  }
  return { blocked: false };
}
