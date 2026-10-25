export interface TlsSecurityDetails {
  protocol: string;
  cipherSuite: string;
  issuer: string;
  subjectName: string;
  validFrom: number;
  validTo: number;
  daysRemaining: number;
  isExpired: boolean;
}

export interface TabGroup {
  id: string;
  title: string;
  color: string;
  isCollapsed?: boolean;
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
  certError?: string;
  securityDetails?: TlsSecurityDetails;
  blockedCount: number;
  isMuted: boolean;
  isPlayingAudio?: boolean;
  zoomFactor: number;
  isPrivate?: boolean;
  isPinned?: boolean;
  isSuspended?: boolean;
  groupId?: string;
}

export interface PersistedTabSession {
  tabs: {
    id: string;
    url: string;
    title: string;
    favicon?: string;
    isPinned?: boolean;
    groupId?: string;
  }[];
  groups?: TabGroup[];
  activeTabId: string;
  savedAt: number;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  folder?: string;
  favicon?: string;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
  favicon?: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  savePath: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted' | 'paused';
  startTime: number;
  speed?: number;
  etaSeconds?: number;
}

export interface FileChecksumResult {
  filePath: string;
  hash?: string;
  algorithm?: string;
  sizeBytes?: number;
  error?: string;
}

export interface ShortcutItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface FilterListInfo {
  id: string;
  name: string;
  description: string;
  ruleCount: number;
  lastUpdated: number;
  enabled: boolean;
  isCustom?: boolean;
}

export interface BrowserProfile {
  id: string;
  name: string;
  icon: string;
  color: string;
  partition: string;
}

export interface VaultItem {
  id: string;
  title: string;
  category: 'note' | 'credential' | 'code' | 'bookmark';
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface VaultData {
  items: VaultItem[];
}

export interface BrowserSettings {
  theme: 'dark' | 'light' | 'system';
  searchEngine: 'duckduckgo' | 'brave' | 'google' | 'bing' | 'custom';
  customSearchUrl: string;
  homePageUrl: string;
  restoreSession: boolean;
  showBookmarksBar: boolean;
  saveHistory: boolean;
  blockTrackers: boolean;
  blockAds: boolean;
  blockMalwareAndPhishing: boolean;
  blockThirdPartyCookies: boolean;
  stripTrackingParams: boolean;
  sendDoNotTrack: boolean;
  defaultZoom: number;
  downloadPath: string;
  sitePermissions: Record<string, Record<string, 'allow' | 'deny'>>;
  siteShieldExceptions: Record<string, boolean>;
  shortcuts: ShortcutItem[];
  filterListsLastUpdated?: number;
  customFilterRules: string[];
  // NOVA Tor Route
  enableTorRouting: boolean;
  torSocksPort: number;
  // NOVA Identity Profiles
  activeProfileId: string;
  profiles: BrowserProfile[];
  // NOVA Focus
  focusModeActive: boolean;
  focusDurationMinutes: number;
  showClockOnNewTab: boolean;
  clearDataOnExit: boolean;
  enableTabSuspension: boolean;
  tabSuspensionMinutes: number;
  hardwareAcceleration: boolean;
}

export interface PrivacyShieldStats {
  totalBlocked: number;
  pageBlocked: number;
  breakdown: {
    ads: number;
    trackers: number;
    analytics: number;
    cryptominers: number;
    threats: number;
  };
  isShieldEnabled: boolean;
  currentDomain: string;
  isSiteWhitelisted: boolean;
  filterLists: FilterListInfo[];
  lastUpdated: number;
}

export interface SecurityDetails {
  isSecure: boolean;
  protocol: string;
  domain: string;
  issuer?: string;
  validTo?: string;
  cipher?: string;
  certError?: string;
}

export interface PermissionRequest {
  id: string;
  tabId: string;
  origin: string;
  permission: 'camera' | 'microphone' | 'geolocation' | 'notifications' | 'clipboard-read' | 'media';
}

export interface FindInPageResult {
  activeMatchOrdinal: number;
  matches: number;
  finalUpdate: boolean;
}

export interface ClearDataOptions {
  history: boolean;
  cookies: boolean;
  cache: boolean;
  storage: boolean;
  downloads: boolean;
  permissions: boolean;
  timeRange: '15m' | '1h' | '24h' | '7d' | 'all';
}

export interface BlockedRequestEvent {
  id: string;
  tabId?: string;
  url: string;
  domain: string;
  category: 'ads' | 'analytics' | 'trackers' | 'cryptominers' | 'threats' | 'general';
  filterRule?: string;
  resourceType: string;
  timestamp: number;
}

export type DiagnosticLevel = 'info' | 'warning' | 'error' | 'threat';
export type DiagnosticCategory = 'shield' | 'sentinel' | 'tls' | 'permission' | 'session' | 'system' | 'security';

export interface DiagnosticLogEntry {
  id: string;
  timestamp: number;
  level: DiagnosticLevel;
  category: DiagnosticCategory;
  message: string;
  details?: Record<string, any>;
}

export interface ReaderArticle {
  url: string;
  title: string;
  byline?: string;
  publishedTime?: string;
  excerpt?: string;
  content: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface CookieSummaryItem {
  name: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  expirationDate?: number;
  isSession: boolean;
}

export interface OriginStorageDetails {
  origin: string;
  domain: string;
  cookieCount: number;
  cookies: CookieSummaryItem[];
}

export type {
  CspSeverity,
  CspFinding,
  CspAuditResult,
  SecurityHeadersAuditResult,
} from './cspAuditor';
