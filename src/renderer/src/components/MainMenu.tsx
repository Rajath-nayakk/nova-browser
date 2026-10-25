import React from 'react';
import {
  Plus,
  Shield,
  Bookmark,
  History,
  Download,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Trash2,
  Code,
  Settings,
  Info,
  Sun,
  Moon,
} from 'lucide-react';

interface MainMenuProps {
  onClose: () => void;
  onNewTab: () => void;
  onNewPrivateWindow: () => void;
  onOpenBookmarks: () => void;
  onOpenHistory: () => void;
  onOpenDownloads: () => void;
  onFindInPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  currentZoom: number;
  onOpenClearData: () => void;
  onToggleDevTools: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onClose,
  onNewTab,
  onNewPrivateWindow,
  onOpenBookmarks,
  onOpenHistory,
  onOpenDownloads,
  onFindInPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentZoom,
  onOpenClearData,
  onToggleDevTools,
  onOpenSettings,
  onOpenAbout,
  theme,
  onToggleTheme,
}) => {
  const menuItems = [
    {
      icon: <Plus size={15} />,
      label: 'New Tab',
      shortcut: 'Ctrl+T',
      onClick: onNewTab,
    },
    {
      icon: <Shield size={15} style={{ color: 'var(--accent-purple)' }} />,
      label: 'New Private Window',
      shortcut: 'Ctrl+Shift+N',
      onClick: onNewPrivateWindow,
    },
    { divider: true },
    {
      icon: <Bookmark size={15} style={{ color: '#f59e0b' }} />,
      label: 'Bookmarks',
      shortcut: 'Ctrl+B',
      onClick: onOpenBookmarks,
    },
    {
      icon: <History size={15} style={{ color: 'var(--accent)' }} />,
      label: 'History',
      shortcut: 'Ctrl+H',
      onClick: onOpenHistory,
    },
    {
      icon: <Download size={15} style={{ color: 'var(--accent-green)' }} />,
      label: 'Downloads',
      shortcut: 'Ctrl+J',
      onClick: onOpenDownloads,
    },
    { divider: true },
    {
      icon: <Search size={15} />,
      label: 'Find in Page',
      shortcut: 'Ctrl+F',
      onClick: onFindInPage,
    },
    {
      custom: (
        <div
          key="zoom"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            fontSize: '12px',
          }}
        >
          <span style={{ color: 'var(--text-main)' }}>Zoom</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onZoomOut}
              style={{
                padding: '4px',
                borderRadius: '4px',
                background: 'var(--bg-surface-elevated)',
              }}
              title="Zoom Out (Ctrl+-)"
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '11px', minWidth: '36px', textAlign: 'center', fontWeight: 600 }}>
              {Math.round(currentZoom * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              style={{
                padding: '4px',
                borderRadius: '4px',
                background: 'var(--bg-surface-elevated)',
              }}
              title="Zoom In (Ctrl++)"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={onResetZoom}
              style={{
                padding: '4px',
                borderRadius: '4px',
                background: 'var(--bg-surface-elevated)',
              }}
              title="Reset Zoom (Ctrl+0)"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      ),
    },
    { divider: true },
    {
      icon: <Trash2 size={15} style={{ color: 'var(--accent-red)' }} />,
      label: 'Clear Browsing Data',
      onClick: onOpenClearData,
    },
    {
      icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />,
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      onClick: onToggleTheme,
    },
    {
      icon: <Code size={15} />,
      label: 'Developer Tools',
      shortcut: 'F12',
      onClick: onToggleDevTools,
    },
    { divider: true },
    {
      icon: <Settings size={15} />,
      label: 'Settings',
      onClick: onOpenSettings,
    },
    {
      icon: <Info size={15} />,
      label: 'About NOVA',
      onClick: onOpenAbout,
    },
  ];

  return (
    <div
      className="glass animate-fade-in"
      style={{
        position: 'absolute',
        top: '46px',
        right: '10px',
        width: '260px',
        borderRadius: 'var(--radius-md)',
        padding: '6px 0',
        zIndex: 1000,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
      }}
    >
      {menuItems.map((item, idx) => {
        if (item.divider) {
          return (
            <div
              key={idx}
              style={{
                height: '1px',
                background: 'var(--border-color)',
                margin: '5px 0',
              }}
            />
          );
        }

        if (item.custom) {
          return item.custom;
        }

        return (
          <div
            key={idx}
            onClick={() => {
              item.onClick?.();
              onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              color: 'var(--text-main)',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
