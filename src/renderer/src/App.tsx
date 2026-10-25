import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { Navbar } from './components/Navbar';
import { BookmarksBar } from './components/BookmarksBar';
import { FindInPageBar } from './components/FindInPageBar';
import { PermissionModal } from './components/PermissionModal';
import { ClearDataModal } from './components/ClearDataModal';
import { AboutModal } from './components/AboutModal';

import { StartPage } from './views/StartPage';
import { BookmarksView } from './views/BookmarksView';
import { HistoryView } from './views/HistoryView';
import { DownloadsView } from './views/DownloadsView';
import { SettingsView } from './views/SettingsView';
import { WarningView } from './views/WarningView';
import { VaultView } from './views/VaultView';
import { LinkLensModal } from './components/LinkLensModal';

import {
  Bookmark,
  BrowserSettings,
  ClearDataOptions,
  DownloadItem,
  FindInPageResult,
  HistoryItem,
  PermissionRequest,
  PrivacyShieldStats,
  ShortcutItem,
  Tab,
} from '@shared/types';
import { DEFAULT_SETTINGS, NEW_TAB_URL } from '@shared/constants';
import { isInternalUrl } from '@shared/validation';

export const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [settings, setSettings] = useState<BrowserSettings>(DEFAULT_SETTINGS);
  const [isMaximized, setIsMaximized] = useState(false);

  // Modals & Floating Bars
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLinkLensModal, setShowLinkLensModal] = useState(false);
  const [showFindInPage, setShowFindInPage] = useState(false);
  const [findResult, setFindResult] = useState<FindInPageResult | undefined>();
  const [activePermissionReq, setActivePermissionReq] = useState<PermissionRequest | null>(null);

  // Privacy stats
  const [privacyStats, setPrivacyStats] = useState<PrivacyShieldStats>({
    totalBlocked: 0,
    pageBlocked: 0,
    breakdown: { ads: 0, trackers: 0, analytics: 0, cryptominers: 0, threats: 0 },
    isShieldEnabled: true,
    currentDomain: '',
    isSiteWhitelisted: false,
    filterLists: [],
    lastUpdated: Date.now(),
  });

  const api = window.novaAPI;

  // Initialize and register event listeners
  useEffect(() => {
    if (!api) return;

    // Load initial data
    api.getBookmarks().then(setBookmarks).catch(console.error);
    api.getHistory().then(setHistory).catch(console.error);
    api.getDownloads().then(setDownloads).catch(console.error);
    api.getSettings().then(setSettings).catch(console.error);
    api.isMaximized().then(setIsMaximized).catch(console.error);
    api.getPrivacyStats().then(setPrivacyStats).catch(console.error);

    const unsubTabInit = api.onTabInit((data) => {
      setTabs(data.tabs);
      setActiveTabId(data.activeTabId);
      if (data.settings) setSettings(data.settings);
    });

    const unsubTabUpdated = api.onTabUpdated((updatedTab) => {
      setTabs((prev) => prev.map((t) => (t.id === updatedTab.id ? updatedTab : t)));
      api.getPrivacyStats().then(setPrivacyStats).catch(console.error);
    });

    const unsubTabSwitched = api.onTabSwitched((id) => {
      setActiveTabId(id);
      api.getPrivacyStats().then(setPrivacyStats).catch(console.error);
    });

    const unsubTabClosed = api.onTabClosed((id) => {
      setTabs((prev) => prev.filter((t) => t.id !== id));
    });

    const unsubWindowState = api.onWindowStateChanged((state) => {
      setIsMaximized(state.isMaximized);
    });

    const unsubDownloadCreated = api.onDownloadCreated((item) => {
      setDownloads((prev) => [item, ...prev]);
    });

    const unsubDownloadUpdated = api.onDownloadUpdated((updated) => {
      setDownloads((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    });

    const unsubPermission = api.onPermissionRequested((req) => {
      setActivePermissionReq(req);
    });

    const unsubFind = api.onFoundInPage((data) => {
      if (data.tabId === activeTabId) {
        setFindResult(data.result);
      }
    });

    return () => {
      unsubTabInit();
      unsubTabUpdated();
      unsubTabSwitched();
      unsubTabClosed();
      unsubWindowState();
      unsubDownloadCreated();
      unsubDownloadUpdated();
      unsubPermission();
      unsubFind();
    };
  }, [api, activeTabId]);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Tab operations
  const handleSelectTab = useCallback((id: string) => {
    api?.switchTab(id);
  }, [api]);

  const handleCloseTab = useCallback((id: string) => {
    api?.closeTab(id);
  }, [api]);

  const handleNewTab = useCallback(() => {
    api?.createTab(NEW_TAB_URL);
  }, [api]);

  const handleToggleMute = useCallback((id: string) => {
    api?.toggleMute(id);
  }, [api]);

  const handleTogglePinTab = useCallback((id: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  }, []);

  const handleDuplicateTab = useCallback((id: string) => {
    const tabToDuplicate = tabs.find((t) => t.id === id);
    if (tabToDuplicate) {
      api?.createTab(tabToDuplicate.url);
    }
  }, [api, tabs]);

  const handleCloseOtherTabs = useCallback((id: string) => {
    tabs.forEach((t) => {
      if (t.id !== id && !t.isPinned) {
        api?.closeTab(t.id);
      }
    });
  }, [api, tabs]);

  const handleNavigate = useCallback((url: string) => {
    if (activeTabId) {
      api?.navigateTab(activeTabId, url);
    }
  }, [api, activeTabId]);

  const handleBack = useCallback(() => {
    if (activeTabId) api?.goBack(activeTabId);
  }, [api, activeTabId]);

  const handleForward = useCallback(() => {
    if (activeTabId) api?.goForward(activeTabId);
  }, [api, activeTabId]);

  const handleReload = useCallback(() => {
    if (activeTabId) api?.reloadTab(activeTabId);
  }, [api, activeTabId]);

  const handleStop = useCallback(() => {
    if (activeTabId) api?.stopTab(activeTabId);
  }, [api, activeTabId]);

  const handleHome = useCallback(() => {
    handleNavigate(settings.homePageUrl || NEW_TAB_URL);
  }, [handleNavigate, settings.homePageUrl]);

  // Bookmarks
  const isCurrentBookmarked = Boolean(
    activeTab && bookmarks.some((b) => b.url === activeTab.url)
  );

  const handleToggleBookmark = useCallback(async (title: string, url: string) => {
    const existing = bookmarks.find((b) => b.url === url);
    if (existing) {
      await api?.removeBookmark(existing.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
    } else {
      const added = await api?.addBookmark({ title, url });
      if (added) {
        setBookmarks((prev) => [added, ...prev]);
      }
    }
  }, [api, bookmarks]);

  // Zoom
  const handleZoom = useCallback((factor: number) => {
    if (activeTabId) {
      api?.setZoom(activeTabId, factor);
    }
  }, [api, activeTabId]);

  // Find in page
  const handleFind = useCallback((text: string, forward = true, findNext = false) => {
    if (activeTabId) {
      api?.findInPage(activeTabId, text, forward, findNext);
    }
  }, [api, activeTabId]);

  const handleStopFind = useCallback(() => {
    if (activeTabId) {
      api?.stopFindInPage(activeTabId);
    }
    setShowFindInPage(false);
    setFindResult(undefined);
  }, [api, activeTabId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleNewTab();
      } else if (isCtrl && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) handleCloseTab(activeTabId);
      } else if (isCtrl && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        api?.reopenClosedTab();
      } else if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        api?.openPrivateWindow();
      } else if (isCtrl && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReload();
      } else if (isCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (activeTab) handleToggleBookmark(activeTab.title, activeTab.url);
      } else if (isCtrl && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handleNavigate('nova://history');
      } else if (isCtrl && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleNavigate('nova://downloads');
      } else if (isCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        api?.updateSettings({ showBookmarksBar: !settings.showBookmarksBar }).then(setSettings);
      } else if (isCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFindInPage(true);
      } else if (isCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const nextZoom = Math.min(3.0, (activeTab?.zoomFactor || 1.0) + 0.1);
        handleZoom(nextZoom);
      } else if (isCtrl && e.key === '-') {
        e.preventDefault();
        const nextZoom = Math.max(0.5, (activeTab?.zoomFactor || 1.0) - 0.1);
        handleZoom(nextZoom);
      } else if (isCtrl && e.key === '0') {
        e.preventDefault();
        handleZoom(1.0);
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleForward();
      } else if (e.key === 'Escape') {
        if (showFindInPage) {
          handleStopFind();
        }
      } else if (isCtrl && e.key >= '1' && e.key <= '8') {
        const index = parseInt(e.key, 10) - 1;
        if (tabs[index]) {
          handleSelectTab(tabs[index].id);
        }
      } else if (isCtrl && e.key === '9') {
        if (tabs.length > 0) {
          handleSelectTab(tabs[tabs.length - 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTab,
    activeTabId,
    api,
    handleBack,
    handleCloseTab,
    handleForward,
    handleNewTab,
    handleReload,
    handleSelectTab,
    handleStopFind,
    handleToggleBookmark,
    handleZoom,
    settings.showBookmarksBar,
    showFindInPage,
    tabs,
  ]);

  // Shield per-site toggle
  const handleToggleSiteShield = useCallback(async (domain: string, disabled: boolean) => {
    await api?.toggleSiteShield(domain, disabled);
    const updated = await api?.getPrivacyStats();
    if (updated) setPrivacyStats(updated);
  }, [api]);

  // Clear data
  const handleClearData = useCallback(async (options: ClearDataOptions) => {
    await api?.clearBrowsingData(options);
    if (options.history) setHistory([]);
    if (options.downloads) setDownloads([]);
    const updated = await api?.getPrivacyStats();
    if (updated) setPrivacyStats(updated);
  }, [api]);

  // Permissions response
  const handlePermissionResponse = useCallback((decision: 'allow' | 'deny', remember: boolean) => {
    if (!activePermissionReq) return;
    api?.respondToPermission(
      activePermissionReq.id,
      decision,
      remember,
      activePermissionReq.origin,
      activePermissionReq.permission
    );
    setActivePermissionReq(null);
  }, [activePermissionReq, api]);

  // Render internal pages if current tab url is nova://...
  const renderInternalContent = () => {
    if (!activeTab || !isInternalUrl(activeTab.url)) {
      return null;
    }

    const path = activeTab.url.replace('nova://', '').toLowerCase();

    switch (path) {
      case 'bookmarks':
        return (
          <BookmarksView
            bookmarks={bookmarks}
            onNavigate={handleNavigate}
            onAddBookmark={async (t, u) => {
              const b = await api?.addBookmark({ title: t, url: u });
              if (b) setBookmarks((prev) => [b, ...prev]);
            }}
            onRemoveBookmark={async (id) => {
              await api?.removeBookmark(id);
              setBookmarks((prev) => prev.filter((b) => b.id !== id));
            }}
            onUpdateBookmark={async (id, updates) => {
              const updated = await api?.updateBookmark(id, updates);
              if (updated) {
                setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
              }
            }}
          />
        );
      case 'history':
        return (
          <HistoryView
            history={history}
            saveHistory={settings.saveHistory}
            onNavigate={handleNavigate}
            onRemoveItem={async (id) => {
              await api?.removeHistoryItem(id);
              setHistory((prev) => prev.filter((h) => h.id !== id));
            }}
            onClearHistory={async (range) => {
              await api?.clearHistory(range);
              setHistory([]);
            }}
            onToggleSaveHistory={async (enabled) => {
              const s = await api?.updateSettings({ saveHistory: enabled });
              if (s) setSettings(s);
            }}
          />
        );
      case 'downloads':
        return (
          <DownloadsView
            downloads={downloads}
            onOpenFolder={(f) => api?.showInFolder(f)}
            onOpenFile={(f) => api?.openDownloadedFile(f)}
            onClearDownloads={async () => {
              await api?.clearDownloads();
              setDownloads([]);
            }}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSettings={async (partial) => {
              const s = await api?.updateSettings(partial);
              if (s) setSettings(s);
            }}
            onResetSettings={async () => {
              const s = await api?.resetSettings();
              if (s) setSettings(s);
            }}
            onOpenClearData={() => setShowClearDataModal(true)}
          />
        );
      case 'warning':
        return (
          <WarningView
            url={activeTab?.url || ''}
            onNavigate={handleNavigate}
          />
        );
      case 'vault':
        return <VaultView />;
      case 'newtab':
      default:
        return (
          <StartPage
            settings={settings}
            bookmarks={bookmarks}
            history={history}
            onNavigate={handleNavigate}
            onUpdateShortcuts={async (sc: ShortcutItem[]) => {
              const s = await api?.updateSettings({ shortcuts: sc });
              if (s) setSettings(s);
            }}
            onOpenSettings={() => handleNavigate('nova://settings')}
            isPrivate={activeTab?.isPrivate || false}
          />
        );
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--bg-app)',
      }}
    >
      {/* Top Title Bar with Tabs & Native Window Controls */}
      <TitleBar
        tabs={tabs}
        activeTabId={activeTabId}
        isMaximized={isMaximized}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        onToggleMute={handleToggleMute}
        onTogglePinTab={handleTogglePinTab}
        onDuplicateTab={handleDuplicateTab}
        onCloseOtherTabs={handleCloseOtherTabs}
        onMinimize={() => api?.minimize()}
        onMaximize={() => api?.maximize()}
        onCloseWindow={() => api?.closeWindow()}
      />

      {/* Navigation Toolbar */}
      <Navbar
        activeTab={activeTab}
        bookmarks={bookmarks}
        history={history}
        downloads={downloads}
        privacyStats={privacyStats}
        onNavigate={handleNavigate}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onStop={handleStop}
        onHome={handleHome}
        onToggleBookmark={handleToggleBookmark}
        isBookmarked={isCurrentBookmarked}
        onToggleSiteShield={handleToggleSiteShield}
        onOpenSettings={() => handleNavigate('nova://settings')}
        onOpenFolder={(f) => api?.showInFolder(f)}
        onOpenFile={(f) => api?.openDownloadedFile(f)}
        onOpenDownloadsPage={() => handleNavigate('nova://downloads')}
        onNewTab={handleNewTab}
        onNewPrivateWindow={() => api?.openPrivateWindow()}
        onOpenBookmarks={() => handleNavigate('nova://bookmarks')}
        onOpenHistory={() => handleNavigate('nova://history')}
        onFindInPage={() => setShowFindInPage(true)}
        onZoomIn={() => handleZoom((activeTab?.zoomFactor || 1.0) + 0.1)}
        onZoomOut={() => handleZoom((activeTab?.zoomFactor || 1.0) - 0.1)}
        onResetZoom={() => handleZoom(1.0)}
        currentZoom={activeTab?.zoomFactor || 1.0}
        onOpenClearData={() => setShowClearDataModal(true)}
        onToggleDevTools={() => {
          if (activeTabId) api?.openDevTools(activeTabId);
        }}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenLinkLens={() => setShowLinkLensModal(true)}
        onOpenVault={() => handleNavigate('nova://vault')}
        theme={settings.theme}
        onToggleTheme={async () => {
          const next = settings.theme === 'dark' ? 'light' : 'dark';
          const s = await api?.updateSettings({ theme: next });
          if (s) setSettings(s);
        }}
      />

      {/* Bookmarks Bar */}
      {settings.showBookmarksBar && (
        <BookmarksBar
          bookmarks={bookmarks}
          onNavigate={handleNavigate}
          onOpenBookmarksManager={() => handleNavigate('nova://bookmarks')}
        />
      )}

      {/* Find in Page floating search bar */}
      {showFindInPage && (
        <FindInPageBar
          onFind={handleFind}
          onClose={handleStopFind}
          result={findResult}
        />
      )}

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {renderInternalContent()}
      </div>

      {/* Site Permission Prompt Modal */}
      {activePermissionReq && (
        <PermissionModal
          request={activePermissionReq}
          onRespond={handlePermissionResponse}
        />
      )}

      {/* Clear Browsing Data Modal */}
      {showClearDataModal && (
        <ClearDataModal
          onClose={() => setShowClearDataModal(false)}
          onClear={handleClearData}
        />
      )}

      {/* Link Lens URL Deep Inspector Modal */}
      {showLinkLensModal && (
        <LinkLensModal
          initialUrl={activeTab && !isInternalUrl(activeTab.url) ? activeTab.url : ''}
          onClose={() => setShowLinkLensModal(false)}
          onNavigate={handleNavigate}
        />
      )}

      {/* About Modal */}
      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
    </div>
  );
};
