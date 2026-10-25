import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { Bookmark, BrowserSettings, DownloadItem, HistoryItem, PersistedTabSession } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

export class LocalStorageManager {
  private dataDir: string;
  private settingsFile: string;
  private bookmarksFile: string;
  private historyFile: string;
  private downloadsFile: string;
  private sessionFile: string;

  private settingsCache: BrowserSettings = { ...DEFAULT_SETTINGS };
  private bookmarksCache: Bookmark[] = [];
  private historyCache: HistoryItem[] = [];
  private downloadsCache: DownloadItem[] = [];

  constructor(customDataDir?: string) {
    this.dataDir = customDataDir || path.join(app.getPath('userData'), 'nova_data');
    this.ensureDirectory(this.dataDir);

    this.settingsFile = path.join(this.dataDir, 'settings.json');
    this.bookmarksFile = path.join(this.dataDir, 'bookmarks.json');
    this.historyFile = path.join(this.dataDir, 'history.json');
    this.downloadsFile = path.join(this.dataDir, 'downloads.json');
    this.sessionFile = path.join(this.dataDir, 'session.json');

    this.loadAll();
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('Failed to create storage directory:', err);
      }
    }
  }

  private safeReadJson<T>(filePath: string, fallback: T): T {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (err) {
      console.warn(`Corrupted storage file at ${filePath}, creating backup and resetting to default:`, err);
      try {
        const backupPath = `${filePath}.corrupt-${Date.now()}`;
        fs.renameSync(filePath, backupPath);
      } catch {
        // ignore
      }
      return fallback;
    }
  }

  private safeAtomicWrite(filePath: string, data: any): void {
    const tmpPath = `${filePath}.tmp-${Date.now()}`;
    try {
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      console.error(`Failed to write atomically to ${filePath}:`, err);
      try {
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
      } catch {
        // ignore
      }
    }
  }

  private loadAll(): void {
    const loadedSettings = this.safeReadJson<Partial<BrowserSettings>>(this.settingsFile, {});
    this.settingsCache = { ...DEFAULT_SETTINGS, ...loadedSettings };

    this.bookmarksCache = this.safeReadJson<Bookmark[]>(this.bookmarksFile, [
      {
        id: 'bm-1',
        title: 'DuckDuckGo — Privacy Search',
        url: 'https://duckduckgo.com',
        createdAt: Date.now(),
      },
      {
        id: 'bm-2',
        title: 'Electronic Frontier Foundation',
        url: 'https://www.eff.org',
        createdAt: Date.now(),
      },
      {
        id: 'bm-3',
        title: 'Wikipedia, the Free Encyclopedia',
        url: 'https://en.wikipedia.org',
        createdAt: Date.now(),
      },
    ]);

    this.historyCache = this.safeReadJson<HistoryItem[]>(this.historyFile, []);
    this.downloadsCache = this.safeReadJson<DownloadItem[]>(this.downloadsFile, []);
  }

  public getDataDir(): string {
    return this.dataDir;
  }

  // Settings
  public getSettings(): BrowserSettings {
    return { ...this.settingsCache };
  }

  public updateSettings(partial: Partial<BrowserSettings>): BrowserSettings {
    this.settingsCache = { ...this.settingsCache, ...partial };
    this.safeAtomicWrite(this.settingsFile, this.settingsCache);
    return this.getSettings();
  }

  public resetSettings(): BrowserSettings {
    this.settingsCache = { ...DEFAULT_SETTINGS };
    this.safeAtomicWrite(this.settingsFile, this.settingsCache);
    return this.getSettings();
  }

  // Bookmarks
  public getBookmarks(): Bookmark[] {
    return [...this.bookmarksCache];
  }

  public addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const newBm: Bookmark = {
      ...bookmark,
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    this.bookmarksCache.unshift(newBm);
    this.safeAtomicWrite(this.bookmarksFile, this.bookmarksCache);
    return newBm;
  }

  public removeBookmark(id: string): void {
    this.bookmarksCache = this.bookmarksCache.filter((b) => b.id !== id);
    this.safeAtomicWrite(this.bookmarksFile, this.bookmarksCache);
  }

  public updateBookmark(id: string, updates: Partial<Omit<Bookmark, 'id'>>): Bookmark | null {
    const index = this.bookmarksCache.findIndex((b) => b.id === id);
    if (index === -1) return null;
    this.bookmarksCache[index] = { ...this.bookmarksCache[index], ...updates };
    this.safeAtomicWrite(this.bookmarksFile, this.bookmarksCache);
    return this.bookmarksCache[index];
  }

  // History
  public getHistory(): HistoryItem[] {
    return [...this.historyCache];
  }

  public addHistory(item: Omit<HistoryItem, 'id' | 'visitedAt'>): void {
    // If user disabled history, strictly do not record!
    if (!this.settingsCache.saveHistory) {
      return;
    }
    // Prevent duplicate entries for the exact same URL within 2 minutes
    const now = Date.now();
    const existingIndex = this.historyCache.findIndex(
      (h) => h.url === item.url && now - h.visitedAt < 120000
    );
    if (existingIndex !== -1) {
      this.historyCache[existingIndex].visitedAt = now;
      if (item.title) this.historyCache[existingIndex].title = item.title;
      if (item.favicon) this.historyCache[existingIndex].favicon = item.favicon;
      this.safeAtomicWrite(this.historyFile, this.historyCache);
      return;
    }

    const newItem: HistoryItem = {
      ...item,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      visitedAt: now,
    };
    this.historyCache.unshift(newItem);
    // Limit local history size to 5000 entries
    if (this.historyCache.length > 5000) {
      this.historyCache = this.historyCache.slice(0, 5000);
    }
    this.safeAtomicWrite(this.historyFile, this.historyCache);
  }

  public removeHistoryItem(id: string): void {
    this.historyCache = this.historyCache.filter((h) => h.id !== id);
    this.safeAtomicWrite(this.historyFile, this.historyCache);
  }

  public clearHistory(timeRange: '15m' | '1h' | '24h' | '7d' | 'all'): void {
    if (timeRange === 'all') {
      this.historyCache = [];
    } else {
      const now = Date.now();
      const cutoffMap: Record<string, number> = {
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };
      const cutoff = now - (cutoffMap[timeRange] || 0);
      this.historyCache = this.historyCache.filter((h) => h.visitedAt < cutoff);
    }
    this.safeAtomicWrite(this.historyFile, this.historyCache);
  }

  // Downloads
  public getDownloads(): DownloadItem[] {
    return [...this.downloadsCache];
  }

  public addDownload(item: DownloadItem): void {
    this.downloadsCache.unshift(item);
    this.safeAtomicWrite(this.downloadsFile, this.downloadsCache);
  }

  public updateDownload(id: string, updates: Partial<DownloadItem>): void {
    const index = this.downloadsCache.findIndex((d) => d.id === id);
    if (index !== -1) {
      this.downloadsCache[index] = { ...this.downloadsCache[index], ...updates };
      this.safeAtomicWrite(this.downloadsFile, this.downloadsCache);
    }
  }

  public clearDownloads(): void {
    this.downloadsCache = [];
    this.safeAtomicWrite(this.downloadsFile, this.downloadsCache);
  }

  // Permissions
  public getSitePermission(origin: string, permission: string): 'allow' | 'deny' | undefined {
    return this.settingsCache.sitePermissions[origin]?.[permission];
  }

  public setSitePermission(origin: string, permission: string, decision: 'allow' | 'deny'): void {
    const current = { ...this.settingsCache.sitePermissions };
    if (!current[origin]) {
      current[origin] = {};
    }
    current[origin][permission] = decision;
    this.updateSettings({ sitePermissions: current });
  }

  public revokeSitePermission(origin: string, permission?: string): void {
    const current = { ...this.settingsCache.sitePermissions };
    if (permission && current[origin]) {
      delete current[origin][permission];
      if (Object.keys(current[origin]).length === 0) {
        delete current[origin];
      }
    } else if (origin) {
      delete current[origin];
    }
    this.updateSettings({ sitePermissions: current });
  }

  // Shield Per-Site Exceptions
  public isSiteShieldDisabled(originOrDomain: string): boolean {
    return !!this.settingsCache.siteShieldExceptions[originOrDomain];
  }

  public setSiteShieldDisabled(originOrDomain: string, disabled: boolean): void {
    const exceptions = { ...this.settingsCache.siteShieldExceptions };
    if (disabled) {
      exceptions[originOrDomain] = true;
    } else {
      delete exceptions[originOrDomain];
    }
    this.updateSettings({ siteShieldExceptions: exceptions });
  }

  // Tab Session Persistence & Cold-Boot Restoration
  public getLastSession(): PersistedTabSession | null {
    if (!fs.existsSync(this.sessionFile)) {
      return null;
    }
    return this.safeReadJson<PersistedTabSession | null>(this.sessionFile, null);
  }

  public saveSession(sessionData: PersistedTabSession): void {
    this.safeAtomicWrite(this.sessionFile, sessionData);
  }

  public clearSession(): void {
    if (fs.existsSync(this.sessionFile)) {
      try {
        fs.unlinkSync(this.sessionFile);
      } catch (err) {
        console.error('Failed to clear session file:', err);
      }
    }
  }
}
