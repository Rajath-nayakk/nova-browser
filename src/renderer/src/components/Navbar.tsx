import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  X as StopIcon,
  Home,
  Shield,
  Download,
  MoreVertical,
} from 'lucide-react';
import { Bookmark, DownloadItem, HistoryItem, PrivacyShieldStats, Tab } from '@shared/types';
import { AddressBar } from './AddressBar';
import { PrivacyShieldPopup } from './PrivacyShieldPopup';
import { DownloadsPopup } from './DownloadsPopup';
import { MainMenu } from './MainMenu';

interface NavbarProps {
  activeTab?: Tab;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  downloads: DownloadItem[];
  privacyStats: PrivacyShieldStats;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onToggleBookmark: (title: string, url: string) => void;
  isBookmarked: boolean;
  onToggleSiteShield: (domain: string, disabled: boolean) => void;
  onOpenSettings: () => void;
  onOpenFolder: (filePath: string) => void;
  onOpenFile: (filePath: string) => void;
  onOpenDownloadsPage: () => void;
  onNewTab: () => void;
  onNewPrivateWindow: () => void;
  onOpenBookmarks: () => void;
  onOpenHistory: () => void;
  onFindInPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  currentZoom: number;
  onOpenClearData: () => void;
  onToggleDevTools: () => void;
  onOpenAbout: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  bookmarks,
  history,
  downloads,
  privacyStats,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onToggleBookmark,
  isBookmarked,
  onToggleSiteShield,
  onOpenSettings,
  onOpenFolder,
  onOpenFile,
  onOpenDownloadsPage,
  onNewTab,
  onNewPrivateWindow,
  onOpenBookmarks,
  onOpenHistory,
  onFindInPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentZoom,
  onOpenClearData,
  onToggleDevTools,
  onOpenAbout,
  theme,
  onToggleTheme,
}) => {
  const [showShieldPopup, setShowShieldPopup] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);

  const canGoBack = activeTab?.canGoBack || false;
  const canGoForward = activeTab?.canGoForward || false;
  const isLoading = activeTab?.isLoading || false;
  const blockedOnPage = activeTab?.blockedCount || 0;

  return (
    <div
      style={{
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '8px',
        background: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-color)',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* Navigation Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <button
          onClick={onBack}
          disabled={!canGoBack}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            color: canGoBack ? 'var(--text-main)' : 'var(--text-faint)',
            opacity: canGoBack ? 1 : 0.4,
          }}
          title="Back (Alt+Left)"
        >
          <ArrowLeft size={16} />
        </button>

        <button
          onClick={onForward}
          disabled={!canGoForward}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            color: canGoForward ? 'var(--text-main)' : 'var(--text-faint)',
            opacity: canGoForward ? 1 : 0.4,
          }}
          title="Forward (Alt+Right)"
        >
          <ArrowRight size={16} />
        </button>

        <button
          onClick={isLoading ? onStop : onReload}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
          }}
          title={isLoading ? 'Stop loading (Esc)' : 'Reload page (Ctrl+R)'}
        >
          {isLoading ? <StopIcon size={16} /> : <RotateCw size={15} />}
        </button>

        <button
          onClick={onHome}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-main)',
          }}
          title="Home page"
        >
          <Home size={15} />
        </button>
      </div>

      {/* Omnibox / Address Bar */}
      <AddressBar
        activeTab={activeTab}
        bookmarks={bookmarks}
        history={history}
        onNavigate={onNavigate}
        onToggleBookmark={onToggleBookmark}
        isBookmarked={isBookmarked}
      />

      {/* Right Action Icons: Shield, Downloads, Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Privacy Shield Button */}
        <button
          onClick={() => {
            setShowShieldPopup(!showShieldPopup);
            setShowDownloadsPopup(false);
            setShowMainMenu(false);
          }}
          style={{
            height: '30px',
            padding: '0 8px',
            borderRadius: 'var(--radius-full)',
            background: showShieldPopup
              ? 'var(--bg-surface-elevated)'
              : blockedOnPage > 0
              ? 'rgba(6, 182, 212, 0.12)'
              : 'transparent',
            color: blockedOnPage > 0 ? 'var(--shield-active)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="NOVA Privacy Shield"
        >
          <Shield size={16} strokeWidth={2.2} />
          {blockedOnPage > 0 && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--shield-active)',
              }}
            >
              {blockedOnPage}
            </span>
          )}
        </button>

        {/* Downloads Button */}
        <button
          onClick={() => {
            setShowDownloadsPopup(!showDownloadsPopup);
            setShowShieldPopup(false);
            setShowMainMenu(false);
          }}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            color: downloads.some((d) => d.state === 'progressing')
              ? 'var(--accent)'
              : 'var(--text-muted)',
            position: 'relative',
          }}
          title="Downloads (Ctrl+J)"
        >
          <Download size={16} />
          {downloads.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent)',
              }}
            />
          )}
        </button>

        {/* Main Menu Button */}
        <button
          onClick={() => {
            setShowMainMenu(!showMainMenu);
            setShowShieldPopup(false);
            setShowDownloadsPopup(false);
          }}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)',
          }}
          title="Customize and control NOVA"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Popups */}
      {showShieldPopup && (
        <PrivacyShieldPopup
          stats={{ ...privacyStats, pageBlocked: blockedOnPage }}
          onClose={() => setShowShieldPopup(false)}
          onToggleSiteShield={onToggleSiteShield}
          onOpenSettings={onOpenSettings}
        />
      )}

      {showDownloadsPopup && (
        <DownloadsPopup
          downloads={downloads}
          onClose={() => setShowDownloadsPopup(false)}
          onOpenFolder={onOpenFolder}
          onOpenFile={onOpenFile}
          onOpenDownloadsPage={onOpenDownloadsPage}
        />
      )}

      {showMainMenu && (
        <MainMenu
          onClose={() => setShowMainMenu(false)}
          onNewTab={onNewTab}
          onNewPrivateWindow={onNewPrivateWindow}
          onOpenBookmarks={onOpenBookmarks}
          onOpenHistory={onOpenHistory}
          onOpenDownloads={onOpenDownloadsPage}
          onFindInPage={onFindInPage}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
          currentZoom={currentZoom}
          onOpenClearData={onOpenClearData}
          onToggleDevTools={onToggleDevTools}
          onOpenSettings={onOpenSettings}
          onOpenAbout={onOpenAbout}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      )}
    </div>
  );
};
