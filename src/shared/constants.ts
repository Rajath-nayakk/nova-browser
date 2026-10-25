import { BrowserSettings, ShortcutItem } from './types';

export const SEARCH_ENGINES: Record<string, { name: string; urlTemplate: string }> = {
  duckduckgo: {
    name: 'DuckDuckGo',
    urlTemplate: 'https://duckduckgo.com/?q=%s',
  },
  brave: {
    name: 'Brave Search',
    urlTemplate: 'https://search.brave.com/search?q=%s',
  },
  google: {
    name: 'Google',
    urlTemplate: 'https://www.google.com/search?q=%s',
  },
  bing: {
    name: 'Bing',
    urlTemplate: 'https://www.bing.com/search?q=%s',
  },
  custom: {
    name: 'Custom',
    urlTemplate: 'https://duckduckgo.com/?q=%s',
  },
};

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { id: '1', title: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: '🦆' },
  { id: '2', title: 'Wikipedia', url: 'https://en.wikipedia.org', icon: '📚' },
  { id: '3', title: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { id: '4', title: 'Internet Archive', url: 'https://archive.org', icon: '🏛️' },
  { id: '5', title: 'OpenStreetMap', url: 'https://www.openstreetmap.org', icon: '🗺️' },
  { id: '6', title: 'Hacker News', url: 'https://news.ycombinator.com', icon: '⚡' },
  { id: '7', title: 'NASA', url: 'https://www.nasa.gov', icon: '🚀' },
  { id: '8', title: 'EFF Privacy', url: 'https://www.eff.org', icon: '🛡️' },
];

export const DEFAULT_SETTINGS: BrowserSettings = {
  theme: 'dark',
  searchEngine: 'duckduckgo',
  customSearchUrl: 'https://duckduckgo.com/?q=%s',
  homePageUrl: 'nova://newtab',
  restoreSession: false,
  showBookmarksBar: true,
  saveHistory: true,
  blockTrackers: true,
  blockAds: true,
  blockMalwareAndPhishing: true,
  blockThirdPartyCookies: true,
  stripTrackingParams: true,
  sendDoNotTrack: true,
  defaultZoom: 1.0,
  downloadPath: '',
  sitePermissions: {},
  siteShieldExceptions: {},
  shortcuts: DEFAULT_SHORTCUTS,
  filterListsLastUpdated: Date.now(),
};

export const TOP_BAR_HEIGHT_NORMAL = 86;
export const TOP_BAR_HEIGHT_WITH_BOOKMARKS = 118;
export const NEW_TAB_URL = 'nova://newtab';
export const WARNING_URL = 'nova://warning';
