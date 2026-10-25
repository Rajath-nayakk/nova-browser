import { NEW_TAB_URL, SEARCH_ENGINES } from './constants';

/**
 * Checks if input looks like an explicit URL scheme
 */
export function hasProtocol(input: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input) || input.startsWith('about:');
}

/**
 * Checks if input is an internal NOVA browser page
 */
export function isInternalUrl(url: string): boolean {
  return url.startsWith('nova://') || url === 'about:blank';
}

/**
 * Verifies that a URL has a safe navigation scheme for web content.
 * Strictly rejects javascript:, data:, vbscript:, shell:, and unauthorized schemes.
 */
export function isSafeNavigationUrl(urlStr: string): boolean {
  if (!urlStr) return false;
  const trimmed = urlStr.trim().toLowerCase();

  // Explicitly block dangerous script execution schemes
  const dangerousPrefixes = [
    'javascript:',
    'vbscript:',
    'data:',
    'shell:',
    'chrome:',
    'electron:',
    'file:',
  ];
  if (dangerousPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
    return false;
  }

  // Internal nova URLs are safe
  if (trimmed.startsWith('nova://') || trimmed === 'about:blank') {
    return true;
  }

  // Only allow standard HTTP and HTTPS schemes for web navigation
  return /^https?:\/\//i.test(trimmed);
}

/**
 * Checks if an input is a valid domain or IP address (with optional port & path)
 */
export function isValidDomainOrHost(input: string): boolean {
  const trimmed = input.trim();
  // Don't treat strings with spaces as domains
  if (/\s/.test(trimmed)) {
    return false;
  }

  // Matches localhost or localhost:port
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
    return true;
  }

  // Matches IPv4 addresses like 127.0.0.1:8080 or 192.168.1.1
  if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed)) {
    return true;
  }

  // Matches domains with valid TLD e.g. example.com, sub.domain.org, google.co.uk
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+(\/.*)?$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Normalizes user input in the omnibox into either a navigable URL or search URL
 */
export function normalizeUserInput(
  input: string,
  searchEngineKey: string = 'duckduckgo',
  customSearchUrl?: string
): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return NEW_TAB_URL;
  }

  // Check if it's an internal URL
  if (isInternalUrl(trimmed)) {
    return trimmed;
  }

  // If input contains dangerous scheme (javascript:, data:, etc.), treat as search query
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
    let template = SEARCH_ENGINES[searchEngineKey]?.urlTemplate || SEARCH_ENGINES.duckduckgo.urlTemplate;
    if (searchEngineKey === 'custom' && customSearchUrl && customSearchUrl.includes('%s')) {
      template = customSearchUrl;
    }
    return template.replace('%s', encodeURIComponent(trimmed));
  }

  // Check if it starts with standard http/https protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Check if it's a valid domain or host
  if (isValidDomainOrHost(trimmed)) {
    return `https://${trimmed}`;
  }

  // Otherwise treat as search query
  let template = SEARCH_ENGINES[searchEngineKey]?.urlTemplate || SEARCH_ENGINES.duckduckgo.urlTemplate;
  if (searchEngineKey === 'custom' && customSearchUrl && customSearchUrl.includes('%s')) {
    template = customSearchUrl;
  }

  return template.replace('%s', encodeURIComponent(trimmed));
}

/**
 * Extracts clean domain name for display (e.g. "github.com")
 */
export function extractDomain(urlStr: string): string {
  if (!urlStr || isInternalUrl(urlStr)) {
    return '';
  }
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

/**
 * Extracts exact web origin (e.g. "https://meet.jit.si") for secure permission scoping
 */
export function extractOrigin(urlStr: string): string {
  if (!urlStr || isInternalUrl(urlStr)) {
    return '';
  }
  try {
    const parsed = new URL(urlStr);
    return parsed.origin;
  } catch {
    return '';
  }
}

/**
 * Checks if a URL is HTTPS
 */
export function isHttpsUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if a filename or path is potentially an executable or dangerous file
 */
export function isExecutableFile(filename: string): boolean {
  const dangerousExts = [
    '.exe', '.bat', '.cmd', '.msi', '.vbs', '.vbe', '.js', '.jse',
    '.wsf', '.wsh', '.ps1', '.psm1', '.scr', '.pif', '.reg', '.com',
  ];
  const lower = filename.toLowerCase();
  return dangerousExts.some((ext) => lower.endsWith(ext));
}

/**
 * Expanded tracking query parameters (Google, Meta, Microsoft, Twitter, TikTok, Yandex, CRMs)
 */
export const KNOWN_TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id', 'utm_source_platform',
  'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'twclid', 'ttclid', 'yclid', 'ysclid',
  '_ga', '_gl', 'dclid', 'mc_eid', 'vero_id', '_hsenc', '_hsmi', 'mkt_tok', 'wickedid', 'zanpid', 'igshid', 's_kwcid'
];

/**
 * Strips tracking parameters from a URL
 */
export function stripTrackingParameters(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    let modified = false;
    KNOWN_TRACKING_PARAMS.forEach((param) => {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        modified = true;
      }
    });
    return modified ? url.toString() : urlStr;
  } catch {
    return urlStr;
  }
}

/**
 * High-value domains targeted by phishing / impersonation attacks
 */
export const TARGET_BRAND_DOMAINS = [
  'google.com', 'accounts.google.com', 'paypal.com', 'apple.com', 'microsoft.com',
  'amazon.com', 'netflix.com', 'chase.com', 'bankofamerica.com', 'wellsfargo.com',
  'binance.com', 'coinbase.com', 'github.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'x.com', 'linkedin.com', 'steamcommunity.com', 'discord.com'
];

/**
 * Checks for IDN homograph / punycode lookalike domain attacks or deceptive typosquatting
 */
export function isLookalikeDomain(domain: string): { isLookalike: boolean; targetBrand?: string; reason?: string } {
  if (!domain) return { isLookalike: false };
  const lower = domain.toLowerCase();

  // 1. Detect Punycode / IDN internationalized domains targeting ASCII names
  if (lower.startsWith('xn--') || lower.includes('.xn--')) {
    return {
      isLookalike: true,
      reason: 'Contains Punycode (IDN) representation which may conceal lookalike Cyrillic or Greek characters.',
    };
  }

  // 2. Detect mixed script / invisible unicode characters
  // Check for Cyrillic characters commonly used to spoof Latin letters (а, с, е, о, р, х, у, etc.)
  if (/[\u0400-\u04FF\u0370-\u03FF]/.test(domain)) {
    return {
      isLookalike: true,
      reason: 'Contains non-Latin (Cyrillic/Greek) glyphs visually resembling standard Latin characters.',
    };
  }

  // 3. Detect subdomain impersonation (e.g. paypal.com.account-verify.xyz)
  for (const brand of TARGET_BRAND_DOMAINS) {
    const brandName = brand.split('.')[0];
    // If brand name is part of subdomain but not the registered second-level domain
    if (lower.includes(`${brandName}.com.`) || lower.includes(`${brandName}-verify.`) || lower.includes(`${brandName}-login.`)) {
      return {
        isLookalike: true,
        targetBrand: brand,
        reason: `Deceptive hostname attempting to impersonate legitimate brand "${brand}".`,
      };
    }
  }

  // 4. Character substitution typosquatting (e.g., paypa1, g00gle, rnicrosoft)
  const canonical = lower
    .replace(/0/g, 'o')
    .replace(/1/g, 'l')
    .replace(/rn/g, 'm')
    .replace(/vv/g, 'w');

  for (const brand of TARGET_BRAND_DOMAINS) {
    if (canonical.includes(brand) && !lower.endsWith(`.${brand}`) && lower !== brand) {
      return {
        isLookalike: true,
        targetBrand: brand,
        reason: `Character substitution visually resembling "${brand}".`,
      };
    }
  }

  return { isLookalike: false };
}

export interface LinkLensReport {
  url: string;
  domain: string;
  scheme: string;
  isSecure: boolean;
  isInternal: boolean;
  isLookalike: boolean;
  lookalikeTarget?: string;
  hasTrackingParams: boolean;
  trackingParamsFound: string[];
  cleanUrl: string;
  suspiciousReasons: string[];
}

/**
 * Analyzes a URL with NOVA Link Lens, providing deep inspection without loading
 */
export function analyzeLinkWithLens(urlStr: string): LinkLensReport {
  const reasons: string[] = [];
  let domain = '';
  let scheme = '';
  let isSecure = false;
  let hasTrackingParams = false;
  const trackingParamsFound: string[] = [];
  let cleanUrl = urlStr;
  const isInternal = isInternalUrl(urlStr);

  try {
    const parsed = new URL(urlStr);
    scheme = parsed.protocol.replace(':', '');
    domain = parsed.hostname;
    isSecure = parsed.protocol === 'https:';

    if (parsed.protocol === 'http:') {
      reasons.push('Insecure connection (plain HTTP without encryption).');
    }

    if (!isSafeNavigationUrl(urlStr)) {
      reasons.push('Dangerous or non-standard protocol.');
    }

    // Check tracking parameters
    KNOWN_TRACKING_PARAMS.forEach((param) => {
      if (parsed.searchParams.has(param)) {
        hasTrackingParams = true;
        trackingParamsFound.push(param);
      }
    });

    if (hasTrackingParams) {
      cleanUrl = stripTrackingParameters(urlStr);
    }

    // Check IP address navigation
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(domain)) {
      reasons.push('Navigates directly to an IP address rather than a verified domain name.');
    }

    // Check lookalike / homograph
    const lookalike = isLookalikeDomain(domain);
    if (lookalike.isLookalike && lookalike.reason) {
      reasons.push(lookalike.reason);
    }

    return {
      url: urlStr,
      domain,
      scheme,
      isSecure,
      isInternal,
      isLookalike: lookalike.isLookalike,
      lookalikeTarget: lookalike.targetBrand,
      hasTrackingParams,
      trackingParamsFound,
      cleanUrl,
      suspiciousReasons: reasons,
    };
  } catch {
    return {
      url: urlStr,
      domain: '',
      scheme: 'invalid',
      isSecure: false,
      isInternal,
      isLookalike: false,
      hasTrackingParams: false,
      trackingParamsFound: [],
      cleanUrl: urlStr,
      suspiciousReasons: ['Malformed or unparseable URL string.'],
    };
  }
}

