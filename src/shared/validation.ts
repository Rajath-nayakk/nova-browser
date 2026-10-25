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

export type FileRiskCategory = 'executable' | 'script' | 'archive' | 'document' | 'media' | 'code' | 'safe';

export interface FileRiskAnalysis {
  category: FileRiskCategory;
  isDangerous: boolean;
  extension: string;
  warning?: string;
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
 * Analyzes file security risk based on file extension
 */
export function analyzeFileRisk(filename: string): FileRiskAnalysis {
  const ext = filename.lastIndexOf('.') !== -1 ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : '';
  const executableExts = ['.exe', '.com', '.scr', '.pif', '.msi'];
  const scriptExts = ['.bat', '.cmd', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.ps1', '.psm1', '.reg', '.sh'];
  const archiveExts = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.dmg'];
  const documentExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.csv'];
  const mediaExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.mkv', '.webm', '.mp3', '.wav', '.flac'];
  const codeExts = ['.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.py', '.cpp', '.c', '.h', '.java', '.go', '.rs'];

  if (executableExts.includes(ext)) {
    return {
      category: 'executable',
      isDangerous: true,
      extension: ext,
      warning: 'Executables can execute native code with full user permissions. Verify integrity before running.',
    };
  }
  if (scriptExts.includes(ext)) {
    return {
      category: 'script',
      isDangerous: true,
      extension: ext,
      warning: 'Script files can execute command line instructions. Exercise caution.',
    };
  }
  if (archiveExts.includes(ext)) {
    return { category: 'archive', isDangerous: false, extension: ext };
  }
  if (documentExts.includes(ext)) {
    return { category: 'document', isDangerous: false, extension: ext };
  }
  if (mediaExts.includes(ext)) {
    return { category: 'media', isDangerous: false, extension: ext };
  }
  if (codeExts.includes(ext)) {
    return { category: 'code', isDangerous: false, extension: ext };
  }
  return { category: 'safe', isDangerous: false, extension: ext };
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
  'twitter.com', 'x.com', 'linkedin.com', 'steamcommunity.com', 'discord.com',
  'dropbox.com', 'spotify.com', 'reddit.com'
];

/**
 * Calculates Levenshtein edit distance between two strings
 */
export function getLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const aChar = a.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

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
  const parts = lower.split('.');
  if (parts.length >= 2) {
    const domainLabel = parts[parts.length - 2];
    const canonicalLabel = domainLabel
      .replace(/0/g, 'o')
      .replace(/1/g, 'l')
      .replace(/rn/g, 'm')
      .replace(/vv/g, 'w');

    for (const brand of TARGET_BRAND_DOMAINS) {
      const brandParts = brand.split('.');
      const brandLabel = brandParts[0];

      if (lower === brand || lower.endsWith(`.${brand}`)) {
        continue;
      }

      if (canonicalLabel === brandLabel && domainLabel !== brandLabel) {
        return {
          isLookalike: true,
          targetBrand: brand,
          reason: `Character substitution visually resembling "${brand}".`,
        };
      }
    }
  }

  // 5. Levenshtein Distance Typosquatting Analysis against Top Brands
  if (parts.length >= 2) {
    const domainLabel = parts[parts.length - 2];

    for (const brand of TARGET_BRAND_DOMAINS) {
      const brandParts = brand.split('.');
      const brandLabel = brandParts[0];

      // Skip if domain belongs to the authentic brand
      if (lower === brand || lower.endsWith(`.${brand}`)) {
        continue;
      }

      if (domainLabel !== brandLabel && Math.abs(domainLabel.length - brandLabel.length) <= 2) {
        const dist = getLevenshteinDistance(domainLabel, brandLabel);

        // Edit distance 1 is almost universally an intentional typosquatting probe
        if (dist === 1) {
          return {
            isLookalike: true,
            targetBrand: brand,
            reason: `Typosquatting candidate (edit distance 1) closely targeting legitimate brand "${brand}".`,
          };
        }

        // Edit distance 2 on longer brand names (e.g., 8+ letters)
        if (dist === 2 && brandLabel.length >= 8) {
          return {
            isLookalike: true,
            targetBrand: brand,
            reason: `Typosquatting candidate (edit distance 2) closely targeting legitimate brand "${brand}".`,
          };
        }
      }
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

export interface NetworkErrorInfo {
  code: number;
  description: string;
  category: 'dns' | 'connection' | 'timeout' | 'offline' | 'ssl' | 'generic';
  userMessage: string;
  suggestion: string;
}

/**
 * Categorizes and humanizes Chromium network error codes
 */
export function parseNetworkErrorCode(code: number, description?: string): NetworkErrorInfo {
  const desc = (description || '').toUpperCase();

  // Chromium net errors:
  // -105: ERR_NAME_NOT_RESOLVED
  // -106: ERR_INTERNET_DISCONNECTED
  // -102: ERR_CONNECTION_REFUSED
  // -100: ERR_CONNECTION_CLOSED
  // -101: ERR_CONNECTION_RESET
  // -118: ERR_CONNECTION_TIMED_OUT
  // -7: ERR_TIMED_OUT
  if (code === -105 || desc.includes('NAME_NOT_RESOLVED')) {
    return {
      code,
      description: description || 'ERR_NAME_NOT_RESOLVED',
      category: 'dns',
      userMessage: 'Server IP address could not be found.',
      suggestion: 'Check for typos in the address or verify your DNS server configuration.',
    };
  }

  if (code === -106 || desc.includes('INTERNET_DISCONNECTED')) {
    return {
      code,
      description: description || 'ERR_INTERNET_DISCONNECTED',
      category: 'offline',
      userMessage: 'You are currently offline.',
      suggestion: 'Check your Wi-Fi, Ethernet connection, and router status.',
    };
  }

  if (code === -102 || desc.includes('CONNECTION_REFUSED')) {
    return {
      code,
      description: description || 'ERR_CONNECTION_REFUSED',
      category: 'connection',
      userMessage: 'Connection was refused by host.',
      suggestion: 'The web server may be down, or a firewall/proxy might be blocking the port.',
    };
  }

  if (code === -118 || code === -7 || desc.includes('TIMED_OUT')) {
    return {
      code,
      description: description || 'ERR_CONNECTION_TIMED_OUT',
      category: 'timeout',
      userMessage: 'Connection timed out while waiting for a response.',
      suggestion: 'The server took too long to reply. Check your connection or try again later.',
    };
  }

  if (code <= -200 && code >= -299) {
    return {
      code,
      description: description || 'ERR_CERTIFICATE_ERROR',
      category: 'ssl',
      userMessage: 'Secure connection could not be established.',
      suggestion: 'The website presented an invalid or untrusted TLS certificate.',
    };
  }

  return {
    code,
    description: description || `ERR_FAILED (${code})`,
    category: 'generic',
    userMessage: 'This page cannot be loaded.',
    suggestion: 'Reload the page or verify the web address.',
  };
}

/**
 * Builds internal error page URL with query parameters
 */
export function formatErrorUrl(targetUrl: string, errorCode: number, errorDesc: string): string {
  const params = new URLSearchParams({
    url: targetUrl,
    code: String(errorCode),
    desc: errorDesc || '',
  });
  return `nova://error?${params.toString()}`;
}

