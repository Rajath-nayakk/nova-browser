import React, { useState } from 'react';
import {
  Shield,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Zap,
  Globe,
  Database,
  EyeOff,
} from 'lucide-react';
import { Bookmark, BrowserSettings, HistoryItem, ShortcutItem } from '@shared/types';
import { SEARCH_ENGINES } from '@shared/constants';

interface StartPageProps {
  settings: BrowserSettings;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onUpdateShortcuts: (shortcuts: ShortcutItem[]) => void;
  onOpenSettings: () => void;
}

export const StartPage: React.FC<StartPageProps> = ({
  settings,
  bookmarks,
  history,
  onNavigate,
  onUpdateShortcuts,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState('');
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const activeEngine = SEARCH_ENGINES[settings.searchEngine]?.name || 'DuckDuckGo';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onNavigate(query.trim());
    }
  };

  const handleAddShortcut = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim() && newUrl.trim()) {
      let finalUrl = newUrl.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = `https://${finalUrl}`;
      }
      const newItems: ShortcutItem[] = [
        ...settings.shortcuts,
        {
          id: `sc-${Date.now()}`,
          title: newTitle.trim(),
          url: finalUrl,
          icon: '🌐',
        },
      ];
      onUpdateShortcuts(newItems);
      setNewTitle('');
      setNewUrl('');
      setShowAddShortcut(false);
    }
  };

  const handleRemoveShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = settings.shortcuts.filter((s) => s.id !== id);
    onUpdateShortcuts(updated);
  };

  const recentHistory = history.slice(0, 6);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'radial-gradient(ellipse at top, #131726 0%, #0c0d14 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '50px 24px 60px',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 35px rgba(56, 189, 248, 0.45)',
          }}
        >
          <Shield size={36} strokeWidth={2.4} />
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            color: 'var(--text-main)',
          }}
        >
          NOVA Browser
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>
          Private • Ad-Free • Zero Telemetry
        </p>
      </div>

      {/* Main Search Input */}
      <form
        onSubmit={handleSearch}
        style={{
          width: '100%',
          maxWidth: '640px',
          marginBottom: '28px',
        }}
      >
        <div
          className="glass"
          style={{
            height: '52px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-hover)',
          }}
        >
          <Search size={18} style={{ color: 'var(--accent)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search privately with ${activeEngine} or enter a URL...`}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '15px',
              color: 'var(--text-main)',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent)',
              color: '#000000',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Go
          </button>
        </div>
      </form>

      {/* Privacy Status Banner */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '36px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--shield-active)',
            }}
          >
            <Lock size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
              NOVA Privacy Shield Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              0 bytes telemetry sent • Local only storage • Content filters active
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--accent)',
            padding: '4px 8px',
            borderRadius: '4px',
          }}
        >
          Preferences
        </button>
      </div>

      {/* Quick Dial / Shortcuts Grid */}
      <div style={{ width: '100%', maxWidth: '780px', marginBottom: '36px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            padding: '0 4px',
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Quick Shortcuts
          </span>
          <button
            onClick={() => setShowAddShortcut(true)}
            style={{
              fontSize: '12px',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500,
            }}
          >
            <Plus size={14} />
            <span>Add Shortcut</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '14px',
          }}
        >
          {settings.shortcuts.map((sc) => (
            <div
              key={sc.id}
              onClick={() => onNavigate(sc.url)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-surface)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                {sc.icon || '🌐'}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--text-main)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                }}
              >
                {sc.title}
              </span>

              {/* Remove Shortcut button on hover */}
              <button
                onClick={(e) => handleRemoveShortcut(sc.id, e)}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  color: 'var(--text-faint)',
                  padding: '2px',
                  borderRadius: '4px',
                }}
                title="Remove shortcut"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Shortcut Modal */}
      {showAddShortcut && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="glass animate-fade-in"
            style={{
              width: '360px',
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
              Add Quick Shortcut
            </h4>
            <form onSubmit={handleAddShortcut}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. GitHub"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  URL
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="e.g. https://github.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddShortcut(false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Save Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recent Local History (if enabled & available) */}
      {settings.saveHistory && recentHistory.length > 0 && (
        <div style={{ width: '100%', maxWidth: '780px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', padding: '0 4px' }}>
            Recently Visited (Local)
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: '10px',
            }}
          >
            {recentHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.url)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-elevated)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <Globe size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title || item.url}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--text-faint)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.url}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
