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
  ZoomIn,
} from 'lucide-react';
import { Bookmark, BrowserProfile, DownloadItem, HistoryItem, PrivacyShieldStats, Tab } from '@shared/types';
import { AddressBar } from './AddressBar';
import { PrivacyShieldPopup } from './PrivacyShieldPopup';
import { DownloadsPopup } from './DownloadsPopup';
import { MainMenu } from './MainMenu';
import { BlockedElementsModal } from './BlockedElementsModal';
import { ProfileSwitcherPopup } from './ProfileSwitcherPopup';

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
  onOpenLinkLens?: () => void;
  onOpenVault?: () => void;
  onOpenShortcuts?: () => void;
  onOpenLogs?: () => void;
  profiles?: BrowserProfile[];
  activeProfileId?: string;
  onSwitchProfile?: (profileId: string) => void;
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
  onOpenLinkLens,
  onOpenVault,
  onOpenShortcuts,
  onOpenLogs,
  profiles,
  activeProfileId,
  onSwitchProfile,
  theme,
  onToggleTheme,
}) => {
  const [showShieldPopup, setShowShieldPopup] = useState(false);
  const [showDownloadsPopup, setShowDownloadsPopup] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showBlockedInspector, setShowBlockedInspector] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const activeProfile = (profiles || []).find((p) => p.id === activeProfileId) || profiles?.[0];

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

      {/* Right Action Icons: Zoom, Shield, Downloads, Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Zoom Level Indicator (click to reset to 100%) */}
        {Math.round(currentZoom * 100) !== 100 && (
          <button
            onClick={onResetZoom}
            style={{
              height: '26px',
              padding: '0 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Reset Zoom to 100% (Ctrl+0)"
            aria-label="Reset Zoom to 100%"
          >
            <ZoomIn size={12} />
            {Math.round(currentZoom * 100)}%
          </button>
        )}

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

        {/* Identity Profile Quick Switcher Button */}
        {activeProfile && (
          <button
            onClick={() => {
              setShowProfilePopup(!showProfilePopup);
              setShowMainMenu(false);
              setShowShieldPopup(false);
              setShowDownloadsPopup(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '16px',
              background: 'var(--bg-surface-elevated)',
              border: `1px solid ${activeProfile.color}70`,
              color: 'var(--text-main)',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title={`Active Profile: ${activeProfile.name} (Click to switch)`}
          >
            <span style={{ fontSize: '13px' }}>{activeProfile.icon}</span>
            <span style={{ fontWeight: 600, maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeProfile.name}
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: activeProfile.color,
                flexShrink: 0,
              }}
            />
          </button>
        )}

        {/* Main Menu Button */}
        <button
          onClick={() => {
            setShowMainMenu(!showMainMenu);
            setShowShieldPopup(false);
            setShowDownloadsPopup(false);
            setShowProfilePopup(false);
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
          onOpenLinkLens={onOpenLinkLens}
          onOpenBlockedInspector={() => setShowBlockedInspector(true)}
        />
      )}

      <BlockedElementsModal
        isOpen={showBlockedInspector}
        onClose={() => setShowBlockedInspector(false)}
        tabId={activeTab?.id}
      />

      {showProfilePopup && profiles && (
        <ProfileSwitcherPopup
          profiles={profiles}
          activeProfileId={activeProfileId || 'personal'}
          onSwitchProfile={(id) => onSwitchProfile?.(id)}
          onManageProfiles={() => onNavigate('nova://settings')}
          onClose={() => setShowProfilePopup(false)}
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
          onOpenVault={onOpenVault}
          onOpenLinkLens={onOpenLinkLens}
          onOpenShortcuts={onOpenShortcuts}
          onOpenLogs={onOpenLogs}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
      )}

      {/* Page Loading Progress Bar */}
      {isLoading && (
        <div
          data-testid="navbar-loading-bar"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2.5px',
            overflow: 'hidden',
            background: 'rgba(56, 189, 248, 0.12)',
            pointerEvents: 'none',
          }}
        >
          <div
            className="animate-progress-bar"
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--shield-active), var(--accent-purple))',
              borderRadius: 'var(--radius-full)',
              boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
            }}
          />
        </div>
      )}
    </div>
  );
};
