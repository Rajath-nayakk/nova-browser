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
 * Strips tracking parameters (utm_*, fbclid, etc.) from a URL
 */
export function stripTrackingParameters(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'gbraid', 'wbraid', 'msclkid', 'mc_eid', 'vero_id',
      '_hsenc', '_hsmi', 'yclid', 'zanpid', 'igshid', 's_kwcid'
    ];
    let modified = false;
    trackingParams.forEach((param) => {
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
