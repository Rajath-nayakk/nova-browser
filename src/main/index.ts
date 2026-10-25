import {
  app,
  BrowserWindow,
  WebContentsView,
  ipcMain,
  session,
  shell,
  dialog,
  Menu,
} from 'electron';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { FilterEngineManager } from './filterEngine';
import { ThreatProtectionManager } from './threatProtection';
import { LocalVaultManager } from './vault';
import { LocalStorageManager } from './storage';
import {
  ClearDataOptions,
  DownloadItem,
  PermissionRequest,
  Tab,
} from '../shared/types';
import {
  analyzeLinkWithLens,
  extractDomain,
  extractOrigin,
  isExecutableFile,
  isHttpsUrl,
  isInternalUrl,
  isSafeNavigationUrl,
  normalizeUserInput,
  stripTrackingParameters,
} from '../shared/validation';
import {
  NEW_TAB_URL,
  TOP_BAR_HEIGHT_NORMAL,
  TOP_BAR_HEIGHT_WITH_BOOKMARKS,
  WARNING_URL,
} from '../shared/constants';

// Prevent multiple instances
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

let storage: LocalStorageManager;
let filterEngine: FilterEngineManager;
let threatProtection: ThreatProtectionManager;
let vault: LocalVaultManager;
let mainWindow: BrowserWindow | null = null;

// Track authorized renderer WebContents IDs to prevent unauthorized IPC calls
const authorizedWebContentsIds = new Set<number>();

function assertAuthorizedSender(event: Electron.IpcMainInvokeEvent): void {
  if (!authorizedWebContentsIds.has(event.sender.id)) {
    throw new Error(`Unauthorized IPC call rejected from webContents ID ${event.sender.id}`);
  }
}

// Tab Management State
interface ManagedTab {
  tab: Tab;
  view: WebContentsView;
}

const tabs = new Map<string, ManagedTab>();
let activeTabId = '';
const recentlyClosedTabs: string[] = [];
let pendingPermissions = new Map<string, (allowed: boolean) => void>();

// Privacy Shield Stats Tracking
let totalTrackersBlocked = 0;
const trackerBreakdown = {
  ads: 0,
  trackers: 0,
  analytics: 0,
  cryptominers: 0,
  threats: 0,
};

function getTopBarHeight(): number {
  const settings = storage.getSettings();
  return settings.showBookmarksBar
    ? TOP_BAR_HEIGHT_WITH_BOOKMARKS
    : TOP_BAR_HEIGHT_NORMAL;
}

function updateActiveViewBounds(): void {
  if (!mainWindow || !activeTabId) return;
  const managed = tabs.get(activeTabId);
  if (!managed) return;

  const [winWidth, winHeight] = mainWindow.getContentSize();
  const topBarHeight = getTopBarHeight();

  // If active tab is on an internal page (like nova://newtab), don't attach view to window
  if (isInternalUrl(managed.tab.url)) {
    try {
      mainWindow.contentView.removeChildView(managed.view);
    } catch {
      // ignore
    }
    return;
  }

  // Ensure view is attached and sized accurately below top bar
  try {
    mainWindow.contentView.addChildView(managed.view);
    managed.view.setBounds({
      x: 0,
      y: topBarHeight,
      width: winWidth,
      height: Math.max(0, winHeight - topBarHeight),
    });
  } catch (err) {
    console.error('Error updating active view bounds:', err);
  }
}

function applyTorSettings(targetSession: Electron.Session): void {
  if (!storage) return;
  const settings = storage.getSettings();
  if (settings.enableTorRouting) {
    targetSession.setProxy({ proxyRules: `socks5://127.0.0.1:${settings.torSocksPort || 9050}` });
    (targetSession as any).setWebRTCIPHandlingPolicy?.('disable_non_proxied_udp');
  } else {
    targetSession.setProxy({ proxyRules: '' });
    (targetSession as any).setWebRTCIPHandlingPolicy?.('default');
  }
}

function setupSessionShield(targetSession: Electron.Session, isPrivate = false): void {
  applyTorSettings(targetSession);

  // Setup Ad, Tracker, and Threat Blocking via webRequest
  targetSession.webRequest.onBeforeRequest((details, callback) => {
    const settings = storage.getSettings();

    // 1. Phishing & Malware Subresource Defense
    if (settings.blockMalwareAndPhishing && threatProtection) {
      const threat = threatProtection.checkUrl(details.url);
      if (threat.isThreat) {
        totalTrackersBlocked++;
        trackerBreakdown.threats++;
        callback({ cancel: true });
        return;
      }
    }

    // 2. If global shields disabled, pass through
    if (!settings.blockTrackers && !settings.blockAds) {
      callback({});
      return;
    }

    // Check site exception
    const currentDomain = extractDomain(details.referrer || details.url);
    if (currentDomain && storage.isSiteShieldDisabled(currentDomain)) {
      callback({});
      return;
    }

    // 3. Match against FilterEngine (EasyList + EasyPrivacy + YouTube rules)
    if (filterEngine) {
      const match = filterEngine.match(details.url, details.referrer, details.resourceType);
      if (match.blocked) {
        totalTrackersBlocked++;
        if (match.category) {
          trackerBreakdown[match.category]++;
        }

        // Find which tab this belongs to and increment its count
        for (const [id, managed] of tabs.entries()) {
          if (managed.view.webContents.id === details.webContentsId) {
            managed.tab.blockedCount = (managed.tab.blockedCount || 0) + 1;
            mainWindow?.webContents.send('tab:updated', managed.tab);
            break;
          }
        }

        callback({ cancel: true });
        return;
      }
    }

    callback({});
  });

  // Inject DNT & Global Privacy Control (GPC) headers
  targetSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const settings = storage.getSettings();
    const requestHeaders = { ...details.requestHeaders };

    if (settings.sendDoNotTrack) {
      requestHeaders['DNT'] = '1';
      requestHeaders['Sec-GPC'] = '1';
    }

    callback({ requestHeaders });
  });

  // Third-Party Tracking Cookie Protection
  targetSession.webRequest.onHeadersReceived((details, callback) => {
    const settings = storage.getSettings();
    const responseHeaders = { ...details.responseHeaders };

    if (settings.blockThirdPartyCookies && details.referrer) {
      const reqDomain = extractDomain(details.url);
      const refDomain = extractDomain(details.referrer);
      // If request is from an unrelated third-party domain, strip Set-Cookie to stop cross-site tracking
      if (reqDomain && refDomain && reqDomain !== refDomain && !reqDomain.endsWith(`.${refDomain}`) && !refDomain.endsWith(`.${reqDomain}`)) {
        delete responseHeaders['set-cookie'];
        delete responseHeaders['Set-Cookie'];
      }
    }

    callback({ responseHeaders });
  });

  // Permission Requests (Camera, Mic, Geolocation, etc.)
  targetSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details.requestingUrl || webContents.getURL();
    // Scope permission strictly to origin (e.g. https://domain.com) to prevent origin confusion
    const origin = extractOrigin(requestingUrl) || extractDomain(requestingUrl);

    if (!origin) {
      callback(false);
      return;
    }

    // Check stored user decision
    const saved = storage.getSitePermission(origin, permission);
    if (saved === 'allow') {
      callback(true);
      return;
    }
    if (saved === 'deny') {
      callback(false);
      return;
    }

    // Create a pending interactive permission request in the UI
    const reqId = `perm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    pendingPermissions.set(reqId, callback);

    // Find tabId
    let targetTabId = '';
    for (const [id, m] of tabs.entries()) {
      if (m.view.webContents.id === webContents.id) {
        targetTabId = id;
        break;
      }
    }

    const permRequest: PermissionRequest = {
      id: reqId,
      tabId: targetTabId,
      origin,
      permission: permission as any,
    };

    mainWindow?.webContents.send('permission:requested', permRequest);
  });

  // Safe Downloads Handling with Path Traversal Defense
  targetSession.on('will-download', (event, item, webContents) => {
    const rawFilename = item.getFilename();
    // Sanitize filename to prevent path traversal
    const safeFilename = path.basename(rawFilename).replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
    const totalBytes = item.getTotalBytes();
    const url = item.getURL();
    const downloadId = `dl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const settings = storage.getSettings();

    // Default download directory or user Downloads folder
    const defaultDownloadFolder = path.resolve(settings.downloadPath || app.getPath('downloads'));
    const targetPath = path.resolve(defaultDownloadFolder, safeFilename);

    // Verify target path does not escape the download folder
    if (!targetPath.startsWith(defaultDownloadFolder)) {
      item.cancel();
      return;
    }

    // If file is potentially executable or dangerous, always prompt save location
    if (isExecutableFile(safeFilename) || !settings.downloadPath) {
      item.setSaveDialogOptions({
        defaultPath: targetPath,
        title: `Save Download: ${safeFilename}`,
      });
    } else {
      item.setSavePath(targetPath);
    }

    const downloadRecord: DownloadItem = {
      id: downloadId,
      filename: safeFilename,
      url,
      savePath: item.getSavePath() || targetPath,
      totalBytes,
      receivedBytes: 0,
      state: 'progressing',
      startTime: Date.now(),
    };

    // Only persist downloads in normal browsing; private browsing stays in-memory
    if (!isPrivate) {
      storage.addDownload(downloadRecord);
    }
    mainWindow?.webContents.send('download:created', downloadRecord);

    item.on('updated', (ev, state) => {
      downloadRecord.receivedBytes = item.getReceivedBytes();
      downloadRecord.savePath = item.getSavePath();
      if (state === 'interrupted') {
        downloadRecord.state = 'interrupted';
      } else if (state === 'progressing') {
        downloadRecord.state = 'progressing';
      }
      if (!isPrivate) {
        storage.updateDownload(downloadId, downloadRecord);
      }
      mainWindow?.webContents.send('download:updated', downloadRecord);
    });

    item.once('done', (ev, state) => {
      downloadRecord.receivedBytes = item.getReceivedBytes();
      downloadRecord.savePath = item.getSavePath();
      downloadRecord.state = state === 'completed' ? 'completed' : 'cancelled';
      if (!isPrivate) {
        storage.updateDownload(downloadId, downloadRecord);
      }
      mainWindow?.webContents.send('download:updated', downloadRecord);
    });
  });
}

function createTab(initialUrl: string = NEW_TAB_URL, isPrivate = false): Tab {
  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const settings = storage.getSettings();

  let tabSession: Electron.Session;
  if (isPrivate) {
    tabSession = session.fromPartition(`incognito-${Date.now()}`, { cache: false });
  } else {
    const activeProfile = settings.profiles?.find((p) => p.id === settings.activeProfileId);
    const partition = activeProfile?.partition || 'persist:profile_personal';
    tabSession = session.fromPartition(partition);
  }

  setupSessionShield(tabSession, isPrivate);

  const view = new WebContentsView({
    webPreferences: {
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      session: tabSession,
    },
  });

  const tabData: Tab = {
    id,
    url: initialUrl,
    title: initialUrl === NEW_TAB_URL ? 'New Tab' : initialUrl,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    isSecure: isHttpsUrl(initialUrl),
    blockedCount: 0,
    isMuted: false,
    zoomFactor: 1.0,
    isPrivate,
  };

  tabs.set(id, { tab: tabData, view });

  // Hook WebContents navigation events
  const wc = view.webContents;

  wc.on('did-start-loading', () => {
    tabData.isLoading = true;
    mainWindow?.webContents.send('tab:updated', tabData);
  });

  wc.on('did-stop-loading', () => {
    tabData.isLoading = false;
    tabData.canGoBack = wc.canGoBack();
    tabData.canGoForward = wc.canGoForward();
    mainWindow?.webContents.send('tab:updated', tabData);
  });

  // Inject cosmetic CSS and YouTube ad-skipping logic when page finishes loading
  wc.on('did-finish-load', () => {
    const navUrl = wc.getURL();
    if (!isInternalUrl(navUrl) && filterEngine) {
      const cosmeticCss = filterEngine.getCosmeticFilters(navUrl);
      if (cosmeticCss) {
        wc.insertCSS(cosmeticCss).catch(() => {});
      }
      if (navUrl.includes('youtube.com')) {
        wc.executeJavaScript(`
          (() => {
            if (window.__nova_ad_shield_active) return;
            window.__nova_ad_shield_active = true;
            const checkAndSkip = () => {
              const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, button.ytp-ad-skip-button');
              if (skipBtn) (skipBtn as HTMLElement).click();
              const video = document.querySelector('video');
              const adShowing = document.querySelector('.ad-showing, .ytp-ad-player-overlay');
              if (adShowing && video && video.duration && !video.paused) {
                video.muted = true;
                video.currentTime = video.duration;
              }
              const closeBtn = document.querySelector('.ytp-ad-overlay-close-button');
              if (closeBtn) (closeBtn as HTMLElement).click();
            };
            setInterval(checkAndSkip, 400);
          })();
        `).catch(() => {});
      }
    }
  });

  // Intercept and prevent dangerous navigations and phishing/malware threats
  wc.on('will-navigate', (event, navigationUrl) => {
    if (!isSafeNavigationUrl(navigationUrl)) {
      event.preventDefault();
      console.warn(`Blocked unsafe navigation attempt to: ${navigationUrl}`);
      return;
    }

    if (settings.blockMalwareAndPhishing && !isInternalUrl(navigationUrl) && threatProtection) {
      const threat = threatProtection.checkUrl(navigationUrl);
      if (threat.isThreat) {
        event.preventDefault();
        const warnUrl = `${WARNING_URL}?url=${encodeURIComponent(navigationUrl)}&threat=${threat.category || 'malware'}&reason=${encodeURIComponent(threat.reason || '')}&domain=${encodeURIComponent(threat.domain || '')}`;
        navigateTab(id, warnUrl);
        return;
      }
    }
  });

  wc.on('did-navigate', (event, navigatedUrl) => {
    tabData.url = navigatedUrl;
    tabData.isSecure = isHttpsUrl(navigatedUrl);
    tabData.canGoBack = wc.canGoBack();
    tabData.canGoForward = wc.canGoForward();
    tabData.title = wc.getTitle() || navigatedUrl;

    // Record to history if valid URL and not private
    if (!isPrivate && !isInternalUrl(navigatedUrl)) {
      storage.addHistory({
        title: tabData.title,
        url: navigatedUrl,
        favicon: tabData.favicon,
      });
    }

    mainWindow?.webContents.send('tab:updated', tabData);
  });

  wc.on('did-navigate-in-page', (event, navigatedUrl) => {
    tabData.url = navigatedUrl;
    tabData.canGoBack = wc.canGoBack();
    tabData.canGoForward = wc.canGoForward();
    mainWindow?.webContents.send('tab:updated', tabData);
  });

  wc.on('page-title-updated', (event, title) => {
    tabData.title = title;
    mainWindow?.webContents.send('tab:updated', tabData);
  });

  wc.on('page-favicon-updated', (event, favicons) => {
    if (favicons.length > 0) {
      tabData.favicon = favicons[0];
      mainWindow?.webContents.send('tab:updated', tabData);
    }
  });

  // Strict TLS certificate error enforcement: always reject invalid certificates
  wc.on('certificate-error', (event, urlStr, error, certificate, callback) => {
    event.preventDefault();
    callback(false); // Reject certificate and abort connection!
    tabData.isSecure = false;
    tabData.certError = error;
    mainWindow?.webContents.send('tab:updated', tabData);
  });

  wc.on('found-in-page', (event, result) => {
    mainWindow?.webContents.send('tab:found-in-page', {
      tabId: id,
      result: {
        activeMatchOrdinal: result.activeMatchOrdinal,
        matches: result.matches,
        finalUpdate: result.finalUpdate,
      },
    });
  });

  // Handle new-window requests securely with scheme validation
  wc.setWindowOpenHandler((details) => {
    if (!isSafeNavigationUrl(details.url)) {
      console.warn(`Blocked unsafe window.open attempt to: ${details.url}`);
      return { action: 'deny' };
    }
    createTab(details.url, isPrivate);
    return { action: 'deny' };
  });

  if (!isInternalUrl(initialUrl)) {
    if (isSafeNavigationUrl(initialUrl)) {
      wc.loadURL(initialUrl).catch((err) => {
        console.warn(`Failed to load ${initialUrl}:`, err);
      });
    }
  }

  return tabData;
}

function switchTab(id: string): void {
  if (!tabs.has(id)) return;

  const prevTab = tabs.get(activeTabId);
  if (prevTab && mainWindow) {
    try {
      mainWindow.contentView.removeChildView(prevTab.view);
    } catch {
      // ignore
    }
  }

  activeTabId = id;
  updateActiveViewBounds();
  mainWindow?.webContents.send('tab:switched', id);
}

function closeTab(id: string): void {
  const managed = tabs.get(id);
  if (!managed) return;

  if (!isInternalUrl(managed.tab.url) && !managed.tab.isPrivate) {
    recentlyClosedTabs.push(managed.tab.url);
  }

  if (mainWindow) {
    try {
      mainWindow.contentView.removeChildView(managed.view);
    } catch {
      // ignore
    }
  }

  // Close webContents safely
  try {
    (managed.view.webContents as any).close?.();
  } catch {
    // ignore
  }

  tabs.delete(id);

  if (tabs.size === 0) {
    // Always keep at least one tab open
    const newTab = createTab();
    switchTab(newTab.id);
  } else if (activeTabId === id) {
    // Switch to adjacent tab
    const nextTabId = Array.from(tabs.keys())[0];
    switchTab(nextTabId);
  }

  mainWindow?.webContents.send('tab:closed', id);
}

function navigateTab(id: string, rawInput: string): void {
  const managed = tabs.get(id);
  if (!managed) return;

  const settings = storage.getSettings();
  let finalUrl = normalizeUserInput(
    rawInput,
    settings.searchEngine,
    settings.customSearchUrl
  );

  // Validate scheme security
  if (!isSafeNavigationUrl(finalUrl)) {
    finalUrl = NEW_TAB_URL;
  }

  if (settings.stripTrackingParams) {
    finalUrl = stripTrackingParameters(finalUrl);
  }

  // Check threat protection on user navigation
  if (settings.blockMalwareAndPhishing && !isInternalUrl(finalUrl) && threatProtection) {
    const threat = threatProtection.checkUrl(finalUrl);
    if (threat.isThreat) {
      finalUrl = `${WARNING_URL}?url=${encodeURIComponent(finalUrl)}&threat=${threat.category || 'malware'}&reason=${encodeURIComponent(threat.reason || '')}&domain=${encodeURIComponent(threat.domain || '')}`;
    }
  }

  managed.tab.url = finalUrl;
  managed.tab.blockedCount = 0;

  if (isInternalUrl(finalUrl)) {
    managed.tab.title =
      finalUrl === NEW_TAB_URL
        ? 'New Tab'
        : finalUrl.replace('nova://', '').toUpperCase();
    managed.tab.isSecure = true;
    if (mainWindow) {
      try {
        mainWindow.contentView.removeChildView(managed.view);
      } catch {
        // ignore
      }
    }
    mainWindow?.webContents.send('tab:updated', managed.tab);
  } else {
    updateActiveViewBounds();
    managed.view.webContents.loadURL(finalUrl).catch((err) => {
      console.warn(`Failed to navigate to ${finalUrl}:`, err);
    });
  }
}

function createMainWindow(isPrivate = false): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 520,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: isPrivate ? '#121217' : '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Register window's webContents as authorized for IPC
  authorizedWebContentsIds.add(win.webContents.id);

  win.on('resize', () => {
    updateActiveViewBounds();
  });

  win.on('maximize', () => {
    win.webContents.send('window:state-changed', { isMaximized: true });
    updateActiveViewBounds();
  });

  win.on('unmaximize', () => {
    win.webContents.send('window:state-changed', { isMaximized: false });
    updateActiveViewBounds();
  });

  win.on('closed', () => {
    authorizedWebContentsIds.delete(win.webContents.id);
  });

  // Load the React application
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return win;
}

// App lifecycle
app.whenReady().then(() => {
  storage = new LocalStorageManager();
  const dataDir = storage.getDataDir();
  filterEngine = new FilterEngineManager(dataDir);
  filterEngine.setCustomRules(storage.getSettings().customFilterRules || []);
  threatProtection = new ThreatProtectionManager(dataDir);
  vault = new LocalVaultManager(dataDir);

  setupSessionShield(session.defaultSession);

  // Disable default menu bar
  Menu.setApplicationMenu(null);

  mainWindow = createMainWindow();

  // Create initial tab
  const initialTab = createTab(NEW_TAB_URL);
  activeTabId = initialTab.id;

  mainWindow.webContents.once('did-finish-load', () => {
    // Send initial tabs and settings to renderer
    const tabList = Array.from(tabs.values()).map((m) => m.tab);
    mainWindow?.webContents.send('tab:init', {
      tabs: tabList,
      activeTabId,
      settings: storage.getSettings(),
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler Registrations with Authorized Sender Enforcement
ipcMain.handle('tab:create', (event, { url, isPrivate }) => {
  assertAuthorizedSender(event);
  const tab = createTab(url || NEW_TAB_URL, !!isPrivate);
  switchTab(tab.id);
  return tab;
});

ipcMain.handle('tab:close', (event, { id }) => {
  assertAuthorizedSender(event);
  closeTab(id);
});

ipcMain.handle('tab:switch', (event, { id }) => {
  assertAuthorizedSender(event);
  switchTab(id);
});

ipcMain.handle('tab:navigate', (event, { id, url }) => {
  assertAuthorizedSender(event);
  navigateTab(id, url);
});

ipcMain.handle('tab:back', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m && m.view.webContents.canGoBack()) {
    m.view.webContents.goBack();
  }
});

ipcMain.handle('tab:forward', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m && m.view.webContents.canGoForward()) {
    m.view.webContents.goForward();
  }
});

ipcMain.handle('tab:reload', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m) {
    m.view.webContents.reload();
  }
});

ipcMain.handle('tab:stop', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m) {
    m.view.webContents.stop();
  }
});

ipcMain.handle('tab:set-zoom', (event, { id, factor }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m && typeof factor === 'number' && factor >= 0.25 && factor <= 5.0) {
    m.view.webContents.setZoomFactor(factor);
    m.tab.zoomFactor = factor;
    mainWindow?.webContents.send('tab:updated', m.tab);
  }
});

ipcMain.handle('tab:toggle-mute', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m) {
    const nextMuted = !m.view.webContents.isAudioMuted();
    m.view.webContents.setAudioMuted(nextMuted);
    m.tab.isMuted = nextMuted;
    mainWindow?.webContents.send('tab:updated', m.tab);
  }
});

ipcMain.handle('tab:open-devtools', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m) {
    if (m.view.webContents.isDevToolsOpened()) {
      m.view.webContents.closeDevTools();
    } else {
      m.view.webContents.openDevTools({ mode: 'detach' });
    }
  }
});

ipcMain.handle('tab:find', (event, { id, text, forward, findNext }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m && typeof text === 'string') {
    m.view.webContents.findInPage(text, {
      forward: forward !== false,
      findNext: findNext === true,
    });
  }
});

ipcMain.handle('tab:stop-find', (event, { id }) => {
  assertAuthorizedSender(event);
  const m = tabs.get(id);
  if (m) {
    m.view.webContents.stopFindInPage('clearSelection');
  }
});

ipcMain.handle('tab:reopen-closed', (event) => {
  assertAuthorizedSender(event);
  if (recentlyClosedTabs.length > 0) {
    const url = recentlyClosedTabs.pop();
    if (url) {
      const tab = createTab(url);
      switchTab(tab.id);
      return tab;
    }
  }
  return null;
});

// Window controls
ipcMain.handle('window:minimize', (event) => {
  assertAuthorizedSender(event);
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', (event) => {
  assertAuthorizedSender(event);
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', (event) => {
  assertAuthorizedSender(event);
  mainWindow?.close();
});

ipcMain.handle('window:is-maximized', (event) => {
  assertAuthorizedSender(event);
  return mainWindow?.isMaximized() || false;
});

ipcMain.handle('window:open-private', (event) => {
  assertAuthorizedSender(event);
  const privWin = createMainWindow(true);
  const privTab = createTab(NEW_TAB_URL, true);

  privWin.webContents.once('did-finish-load', () => {
    privWin.webContents.send('tab:init', {
      tabs: [privTab],
      activeTabId: privTab.id,
      settings: storage.getSettings(),
    });
  });

  // Secure cleanup when private window closes
  privWin.on('closed', async () => {
    authorizedWebContentsIds.delete(privWin.webContents.id);
    closeTab(privTab.id);
  });
});

// Bookmarks
ipcMain.handle('bookmarks:get', (event) => {
  assertAuthorizedSender(event);
  return storage.getBookmarks();
});

ipcMain.handle('bookmarks:add', (event, bookmark) => {
  assertAuthorizedSender(event);
  return storage.addBookmark(bookmark);
});

ipcMain.handle('bookmarks:remove', (event, { id }) => {
  assertAuthorizedSender(event);
  storage.removeBookmark(id);
  return true;
});

ipcMain.handle('bookmarks:update', (event, { id, updates }) => {
  assertAuthorizedSender(event);
  return storage.updateBookmark(id, updates);
});

// History
ipcMain.handle('history:get', (event) => {
  assertAuthorizedSender(event);
  return storage.getHistory();
});

ipcMain.handle('history:remove', (event, { id }) => {
  assertAuthorizedSender(event);
  storage.removeHistoryItem(id);
  return true;
});

ipcMain.handle('history:clear', (event, { timeRange }) => {
  assertAuthorizedSender(event);
  storage.clearHistory(timeRange);
  return true;
});

// Downloads
ipcMain.handle('downloads:get', (event) => {
  assertAuthorizedSender(event);
  return storage.getDownloads();
});

ipcMain.handle('downloads:clear', (event) => {
  assertAuthorizedSender(event);
  storage.clearDownloads();
  return true;
});

ipcMain.handle('downloads:show-in-folder', (event, { filePath }) => {
  assertAuthorizedSender(event);
  if (filePath && typeof filePath === 'string' && path.isAbsolute(filePath)) {
    const resolved = path.resolve(filePath);
    if (fs.existsSync(resolved)) {
      shell.showItemInFolder(resolved);
    }
  }
});

ipcMain.handle('downloads:open-file', (event, { filePath }) => {
  assertAuthorizedSender(event);
  if (filePath && typeof filePath === 'string' && path.isAbsolute(filePath)) {
    const resolved = path.resolve(filePath);
    const defaultFolder = path.resolve(storage.getSettings().downloadPath || app.getPath('downloads'));
    // Enforce that file must be inside downloads directory and not an executable
    if (resolved.startsWith(defaultFolder) && fs.existsSync(resolved) && !isExecutableFile(resolved)) {
      shell.openPath(resolved);
    }
  }
});

ipcMain.handle('downloads:compute-hash', async (event, { filePath, algorithm = 'sha256' }) => {
  assertAuthorizedSender(event);
  const supportedAlgs = ['sha256', 'sha512', 'sha1', 'md5'];
  const targetAlg = supportedAlgs.includes(algorithm) ? algorithm : 'sha256';

  if (!filePath || typeof filePath !== 'string' || !path.isAbsolute(filePath)) {
    return { filePath: String(filePath), error: 'Invalid file path' };
  }

  const resolved = path.resolve(filePath);
  const defaultFolder = path.resolve(storage.getSettings().downloadPath || app.getPath('downloads'));

  if (!resolved.startsWith(defaultFolder) && !fs.existsSync(resolved)) {
    return { filePath: resolved, error: 'File access outside download directory is restricted' };
  }

  if (!fs.existsSync(resolved)) {
    return { filePath: resolved, error: 'File does not exist on disk' };
  }

  try {
    const stats = fs.statSync(resolved);
    const hash = crypto.createHash(targetAlg);
    const stream = fs.createReadStream(resolved);
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    return {
      filePath: resolved,
      hash: hash.digest('hex'),
      algorithm: targetAlg,
      sizeBytes: stats.size,
    };
  } catch (err: any) {
    return { filePath: resolved, error: err?.message || 'Failed to compute file checksum' };
  }
});

// Settings
ipcMain.handle('settings:get', (event) => {
  assertAuthorizedSender(event);
  return storage.getSettings();
});

ipcMain.handle('settings:update', (event, partial) => {
  assertAuthorizedSender(event);
  const updated = storage.updateSettings(partial);
  if (partial.customFilterRules && filterEngine) {
    filterEngine.setCustomRules(updated.customFilterRules || []);
  }
  updateActiveViewBounds();
  return updated;
});

ipcMain.handle('settings:reset', (event) => {
  assertAuthorizedSender(event);
  const reset = storage.resetSettings();
  if (filterEngine) {
    filterEngine.setCustomRules(reset.customFilterRules || []);
  }
  updateActiveViewBounds();
  return reset;
});

// Privacy Shield & Content Blocking
ipcMain.handle('privacy:get-stats', (event) => {
  assertAuthorizedSender(event);
  const activeManaged = tabs.get(activeTabId);
  const domain = extractDomain(activeManaged?.tab.url || '');
  return {
    totalBlocked: totalTrackersBlocked,
    pageBlocked: activeManaged?.tab.blockedCount || 0,
    breakdown: trackerBreakdown,
    isShieldEnabled: storage.getSettings().blockTrackers,
    currentDomain: domain,
    isSiteWhitelisted: domain ? storage.isSiteShieldDisabled(domain) : false,
    filterLists: filterEngine ? filterEngine.getFilterLists() : [],
    lastUpdated: storage.getSettings().filterListsLastUpdated || Date.now(),
  };
});

ipcMain.handle('privacy:toggle-site-shield', (event, { domain, disabled }) => {
  assertAuthorizedSender(event);
  storage.setSiteShieldDisabled(domain, disabled);
  return true;
});

ipcMain.handle('privacy:update-filter-lists', async (event) => {
  assertAuthorizedSender(event);
  if (!filterEngine) {
    return { success: false, message: 'Filter engine not ready', updatedCount: 0 };
  }
  const result = await filterEngine.updateFilterLists();
  if (result.success) {
    storage.updateSettings({ filterListsLastUpdated: Date.now() });
  }
  return result;
});

ipcMain.handle('privacy:update-threat-feeds', async (event) => {
  assertAuthorizedSender(event);
  if (!threatProtection) {
    return { success: false, message: 'Threat protection not ready', count: 0 };
  }
  return await threatProtection.updateThreatFeeds();
});

ipcMain.handle('threat:bypass', (event, { domain }) => {
  assertAuthorizedSender(event);
  if (threatProtection && domain) {
    threatProtection.bypassThreatForSession(domain);
  }
  return true;
});

// Link Lens URL Inspector
ipcMain.handle('link:inspect', (event, { url }) => {
  assertAuthorizedSender(event);
  return analyzeLinkWithLens(url || '');
});

// Identity Profiles
ipcMain.handle('profile:switch', (event, { profileId }) => {
  assertAuthorizedSender(event);
  const updated = storage.updateSettings({ activeProfileId: profileId });
  // Create a clean new tab in the chosen profile
  const tab = createTab(NEW_TAB_URL);
  switchTab(tab.id);
  return updated;
});

// NOVA Encrypted Vault
ipcMain.handle('vault:is-initialized', (event) => {
  assertAuthorizedSender(event);
  return vault ? vault.isInitialized() : false;
});

ipcMain.handle('vault:is-unlocked', (event) => {
  assertAuthorizedSender(event);
  return vault ? vault.isUnlocked() : false;
});

ipcMain.handle('vault:init', (event, { masterPassword }) => {
  assertAuthorizedSender(event);
  return vault ? vault.initialize(masterPassword) : false;
});

ipcMain.handle('vault:unlock', (event, { masterPassword }) => {
  assertAuthorizedSender(event);
  return vault ? vault.unlock(masterPassword) : null;
});

ipcMain.handle('vault:lock', (event) => {
  assertAuthorizedSender(event);
  if (vault) {
    vault.lock();
  }
});

ipcMain.handle('vault:get-items', (event) => {
  assertAuthorizedSender(event);
  return vault ? vault.getItems() : [];
});

ipcMain.handle('vault:save-items', (event, { items }) => {
  assertAuthorizedSender(event);
  return vault ? vault.saveItems(items) : false;
});

ipcMain.handle('privacy:clear-data', async (event, options: ClearDataOptions) => {
  assertAuthorizedSender(event);
  if (options.history) {
    storage.clearHistory(options.timeRange);
  }
  if (options.downloads) {
    storage.clearDownloads();
  }
  if (options.permissions) {
    storage.updateSettings({ sitePermissions: {} });
  }

  // Clear session storage/cookies/cache in Electron session
  const clearTypes: (
    | 'cookies'
    | 'filesystem'
    | 'indexdb'
    | 'localstorage'
    | 'shadercache'
    | 'serviceworkers'
    | 'cachestorage'
  )[] = [];

  if (options.cookies) clearTypes.push('cookies');
  if (options.storage) {
    clearTypes.push('filesystem', 'indexdb', 'localstorage', 'serviceworkers', 'cachestorage');
  }

  if (clearTypes.length > 0) {
    await session.defaultSession.clearStorageData({ storages: clearTypes });
  }

  if (options.cache) {
    await session.defaultSession.clearCache();
  }

  return true;
});

// Permission response from UI
ipcMain.handle('permission:respond', (event, { id, decision, remember, origin, permission }) => {
  assertAuthorizedSender(event);
  const resolver = pendingPermissions.get(id);
  if (resolver) {
    resolver(decision === 'allow');
    pendingPermissions.delete(id);
  }
  if (remember && origin && permission) {
    storage.setSitePermission(origin, permission, decision);
  }
});
