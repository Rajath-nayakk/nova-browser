import { contextBridge, ipcRenderer } from 'electron';
import {
  Bookmark,
  BrowserSettings,
  ClearDataOptions,
  DownloadItem,
  FileChecksumResult,
  FindInPageResult,
  HistoryItem,
  PermissionRequest,
  PrivacyShieldStats,
  Tab,
} from '../shared/types';

const novaAPI = {
  // Tabs
  createTab: (url?: string, isPrivate?: boolean): Promise<Tab> =>
    ipcRenderer.invoke('tab:create', { url, isPrivate }),
  closeTab: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:close', { id }),
  switchTab: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:switch', { id }),
  navigateTab: (id: string, url: string): Promise<void> =>
    ipcRenderer.invoke('tab:navigate', { id, url }),
  goBack: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:back', { id }),
  goForward: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:forward', { id }),
  reloadTab: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:reload', { id }),
  stopTab: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:stop', { id }),
  setZoom: (id: string, factor: number): Promise<void> =>
    ipcRenderer.invoke('tab:set-zoom', { id, factor }),
  toggleMute: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:toggle-mute', { id }),
  openDevTools: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:open-devtools', { id }),
  findInPage: (id: string, text: string, forward?: boolean, findNext?: boolean): Promise<void> =>
    ipcRenderer.invoke('tab:find', { id, text, forward, findNext }),
  stopFindInPage: (id: string): Promise<void> =>
    ipcRenderer.invoke('tab:stop-find', { id }),
  reopenClosedTab: (): Promise<Tab | null> =>
    ipcRenderer.invoke('tab:reopen-closed'),

  // Window controls
  minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
  openPrivateWindow: (): Promise<void> => ipcRenderer.invoke('window:open-private'),

  // Bookmarks
  getBookmarks: (): Promise<Bookmark[]> => ipcRenderer.invoke('bookmarks:get'),
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<Bookmark> =>
    ipcRenderer.invoke('bookmarks:add', bookmark),
  removeBookmark: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('bookmarks:remove', { id }),
  updateBookmark: (id: string, updates: Partial<Omit<Bookmark, 'id'>>): Promise<Bookmark | null> =>
    ipcRenderer.invoke('bookmarks:update', { id, updates }),

  // History
  getHistory: (): Promise<HistoryItem[]> => ipcRenderer.invoke('history:get'),
  removeHistoryItem: (id: string): Promise<boolean> =>
    ipcRenderer.invoke('history:remove', { id }),
  clearHistory: (timeRange: string): Promise<boolean> =>
    ipcRenderer.invoke('history:clear', { timeRange }),

  // Downloads
  getDownloads: (): Promise<DownloadItem[]> => ipcRenderer.invoke('downloads:get'),
  clearDownloads: (): Promise<boolean> => ipcRenderer.invoke('downloads:clear'),
  showInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('downloads:show-in-folder', { filePath }),
  openDownloadedFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('downloads:open-file', { filePath }),
  computeFileChecksum: (filePath: string, algorithm?: string): Promise<FileChecksumResult> =>
    ipcRenderer.invoke('downloads:compute-hash', { filePath, algorithm }),

  // Settings
  getSettings: (): Promise<BrowserSettings> => ipcRenderer.invoke('settings:get'),
  updateSettings: (partial: Partial<BrowserSettings>): Promise<BrowserSettings> =>
    ipcRenderer.invoke('settings:update', partial),
  resetSettings: (): Promise<BrowserSettings> => ipcRenderer.invoke('settings:reset'),

  // Privacy Shield & Content Blocking
  getPrivacyStats: (): Promise<PrivacyShieldStats> =>
    ipcRenderer.invoke('privacy:get-stats'),
  toggleSiteShield: (domain: string, disabled: boolean): Promise<boolean> =>
    ipcRenderer.invoke('privacy:toggle-site-shield', { domain, disabled }),
  clearBrowsingData: (options: ClearDataOptions): Promise<boolean> =>
    ipcRenderer.invoke('privacy:clear-data', options),
  updateFilterLists: (): Promise<{ success: boolean; message: string; updatedCount: number }> =>
    ipcRenderer.invoke('privacy:update-filter-lists'),
  updateThreatFeeds: (): Promise<{ success: boolean; message: string; count: number }> =>
    ipcRenderer.invoke('privacy:update-threat-feeds'),
  bypassThreat: (domain: string): Promise<boolean> =>
    ipcRenderer.invoke('threat:bypass', { domain }),

  // Link Lens
  inspectLink: (url: string): Promise<any> =>
    ipcRenderer.invoke('link:inspect', { url }),

  // Profiles
  switchProfile: (profileId: string): Promise<BrowserSettings> =>
    ipcRenderer.invoke('profile:switch', { profileId }),

  // Vault
  vaultIsInitialized: (): Promise<boolean> =>
    ipcRenderer.invoke('vault:is-initialized'),
  vaultIsUnlocked: (): Promise<boolean> =>
    ipcRenderer.invoke('vault:is-unlocked'),
  vaultInit: (masterPassword: string): Promise<boolean> =>
    ipcRenderer.invoke('vault:init', { masterPassword }),
  vaultUnlock: (masterPassword: string): Promise<any> =>
    ipcRenderer.invoke('vault:unlock', { masterPassword }),
  vaultLock: (): Promise<void> =>
    ipcRenderer.invoke('vault:lock'),
  vaultGetItems: (): Promise<any[]> =>
    ipcRenderer.invoke('vault:get-items'),
  vaultSaveItems: (items: any[]): Promise<boolean> =>
    ipcRenderer.invoke('vault:save-items', { items }),

  // Permissions
  respondToPermission: (
    id: string,
    decision: 'allow' | 'deny',
    remember: boolean,
    origin: string,
    permission: string
  ): Promise<void> =>
    ipcRenderer.invoke('permission:respond', { id, decision, remember, origin, permission }),

  // Event Listeners
  onTabInit: (callback: (data: { tabs: Tab[]; activeTabId: string; settings: BrowserSettings }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('tab:init', handler);
    return () => ipcRenderer.removeListener('tab:init', handler);
  },
  onTabUpdated: (callback: (tab: Tab) => void) => {
    const handler = (_event: any, tab: Tab) => callback(tab);
    ipcRenderer.on('tab:updated', handler);
    return () => ipcRenderer.removeListener('tab:updated', handler);
  },
  onTabSwitched: (callback: (tabId: string) => void) => {
    const handler = (_event: any, tabId: string) => callback(tabId);
    ipcRenderer.on('tab:switched', handler);
    return () => ipcRenderer.removeListener('tab:switched', handler);
  },
  onTabClosed: (callback: (tabId: string) => void) => {
    const handler = (_event: any, tabId: string) => callback(tabId);
    ipcRenderer.on('tab:closed', handler);
    return () => ipcRenderer.removeListener('tab:closed', handler);
  },
  onWindowStateChanged: (callback: (state: { isMaximized: boolean }) => void) => {
    const handler = (_event: any, state: { isMaximized: boolean }) => callback(state);
    ipcRenderer.on('window:state-changed', handler);
    return () => ipcRenderer.removeListener('window:state-changed', handler);
  },
  onDownloadCreated: (callback: (item: DownloadItem) => void) => {
    const handler = (_event: any, item: DownloadItem) => callback(item);
    ipcRenderer.on('download:created', handler);
    return () => ipcRenderer.removeListener('download:created', handler);
  },
  onDownloadUpdated: (callback: (item: DownloadItem) => void) => {
    const handler = (_event: any, item: DownloadItem) => callback(item);
    ipcRenderer.on('download:updated', handler);
    return () => ipcRenderer.removeListener('download:updated', handler);
  },
  onPermissionRequested: (callback: (req: PermissionRequest) => void) => {
    const handler = (_event: any, req: PermissionRequest) => callback(req);
    ipcRenderer.on('permission:requested', handler);
    return () => ipcRenderer.removeListener('permission:requested', handler);
  },
  onFoundInPage: (callback: (data: { tabId: string; result: FindInPageResult }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('tab:found-in-page', handler);
    return () => ipcRenderer.removeListener('tab:found-in-page', handler);
  },
};

export type NovaAPI = typeof novaAPI;

contextBridge.exposeInMainWorld('novaAPI', novaAPI);
