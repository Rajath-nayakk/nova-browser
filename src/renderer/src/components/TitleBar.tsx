import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Plus, Volume2, VolumeX, Shield, Lock, Pin, Copy } from 'lucide-react';
import { Tab } from '@shared/types';

interface TitleBarProps {
  tabs: Tab[];
  activeTabId: string;
  isMaximized: boolean;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  onToggleMute: (id: string) => void;
  onTogglePinTab?: (id: string) => void;
  onDuplicateTab?: (id: string) => void;
  onCloseOtherTabs?: (id: string) => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onCloseWindow: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  tabs,
  activeTabId,
  isMaximized,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onToggleMute,
  onTogglePinTab,
  onDuplicateTab,
  onCloseOtherTabs,
  onMinimize,
  onMaximize,
  onCloseWindow,
}) => {
  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isPrivate = activeTab?.isPrivate;

  return (
    <div
      style={{
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        background: isPrivate ? '#0e0f17' : 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-color)',
        paddingLeft: '12px',
        paddingRight: '0px',
      }}
      className="drag-region"
    >
      {/* Brand Logo & Name */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginRight: '14px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: isPrivate
              ? 'linear-gradient(135deg, #a855f7, #6366f1)'
              : 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: isPrivate
              ? '0 0 10px rgba(168, 85, 247, 0.4)'
              : '0 0 10px rgba(56, 189, 248, 0.4)',
          }}
        >
          <Shield size={14} strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.6px',
            color: 'var(--text-main)',
          }}
        >
          NOVA
        </span>
        {isPrivate && (
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(168, 85, 247, 0.2)',
              color: '#c084fc',
              fontWeight: 600,
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}
          >
            PRIVATE
          </span>
        )}
      </div>

      {/* Tabs Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '100%',
          paddingTop: '6px',
        }}
        className="no-drag"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isPinned = tab.isPinned;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
              }}
              style={{
                height: '34px',
                minWidth: isPinned ? '40px' : '130px',
                maxWidth: isPinned ? '40px' : '220px',
                flex: isPinned ? '0 0 40px' : '0 1 180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isPinned ? 'center' : 'flex-start',
                gap: '8px',
                padding: isPinned ? '0' : '0 10px',
                borderRadius: '8px 8px 0 0',
                background: isActive
                  ? 'var(--bg-surface)'
                  : 'transparent',
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                borderTop: isActive
                  ? `2px solid ${isPrivate ? '#a855f7' : 'var(--accent)'}`
                  : '2px solid transparent',
                borderLeft: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                borderRight: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
              title={tab.title || tab.url}
            >
              {/* Tab Favicon or Loading Spinner */}
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {tab.isLoading ? (
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid var(--border-color)',
                      borderTopColor: 'var(--accent)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                ) : tab.favicon ? (
                  <img
                    src={tab.favicon}
                    alt=""
                    style={{ width: '15px', height: '15px', borderRadius: '3px' }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Lock size={12} style={{ color: 'var(--text-faint)' }} />
                )}

                {/* Pin indicator on pinned tabs */}
                {isPinned && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-3px',
                      right: '-4px',
                      background: 'var(--accent)',
                      borderRadius: '50%',
                      width: '6px',
                      height: '6px',
                    }}
                  />
                )}
              </div>

              {/* Tab Title (hidden for pinned tabs) */}
              {!isPinned && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: isActive ? 500 : 400,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: 1,
                  }}
                >
                  {tab.title || 'New Tab'}
                </span>
              )}

              {/* Audio Mute Indicator */}
              {tab.isMuted ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleMute(tab.id);
                  }}
                  style={{
                    padding: '2px',
                    color: 'var(--accent-red)',
                    borderRadius: '4px',
                  }}
                  title="Unmute tab"
                  aria-label="Unmute tab"
                >
                  <VolumeX size={13} />
                </button>
              ) : null}

              {/* Close Tab Button (hidden for pinned tabs) */}
              {!isPinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    padding: 0,
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.color = '#f87171';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                  title="Close tab (Ctrl+W)"
                  aria-label="Close tab"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            color: 'var(--text-muted)',
            marginLeft: '4px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title="New Tab (Ctrl+T)"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Window Controls (Minimize, Maximize, Close) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
        className="no-drag"
      >
        <button
          onClick={onMinimize}
          style={{
            width: '44px',
            height: '100%',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title="Minimize"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={onMaximize}
          style={{
            width: '44px',
            height: '100%',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-surface-hover)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Square size={12} />
        </button>

        <button
          onClick={onCloseWindow}
          style={{
            width: '46px',
            height: '100%',
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#dc2626';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
          title="Close"
        >
          <X size={15} />
        </button>
      </div>

      {/* Tab Context Menu */}
      {contextMenu && (
        <div
          className="glass animate-fade-in"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 9999,
            minWidth: '170px',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const targetTab = tabs.find((t) => t.id === contextMenu.tabId);
            if (!targetTab) return null;
            return (
              <>
                <button
                  onClick={() => {
                    onTogglePinTab?.(targetTab.id);
                    setContextMenu(null);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-xs)',
                    justifyContent: 'flex-start',
                    gap: '8px',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Pin size={13} />
                  {targetTab.isPinned ? 'Unpin tab' : 'Pin tab'}
                </button>

                <button
                  onClick={() => {
                    onDuplicateTab?.(targetTab.id);
                    setContextMenu(null);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-xs)',
                    justifyContent: 'flex-start',
                    gap: '8px',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Copy size={13} />
                  Duplicate tab
                </button>

                <button
                  onClick={() => {
                    onToggleMute(targetTab.id);
                    setContextMenu(null);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-xs)',
                    justifyContent: 'flex-start',
                    gap: '8px',
                    color: 'var(--text-main)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {targetTab.isMuted ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  {targetTab.isMuted ? 'Unmute tab' : 'Mute tab'}
                </button>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '2px 0' }} />

                <button
                  onClick={() => {
                    onCloseTab(targetTab.id);
                    setContextMenu(null);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: 'var(--radius-xs)',
                    justifyContent: 'flex-start',
                    gap: '8px',
                    color: '#f87171',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <X size={13} />
                  Close tab
                </button>

                {tabs.length > 1 && (
                  <button
                    onClick={() => {
                      onCloseOtherTabs?.(targetTab.id);
                      setContextMenu(null);
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: 'var(--radius-xs)',
                      justifyContent: 'flex-start',
                      gap: '8px',
                      color: 'var(--text-muted)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Close other tabs
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
