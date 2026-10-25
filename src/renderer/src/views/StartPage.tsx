import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Plus,
  Trash2,
  Lock,
  Globe,
  Clock,
  Bookmark as BookmarkIcon,
  Download,
  History,
  Settings,
  Sparkles,
  Key,
} from 'lucide-react';
import { Bookmark, BrowserSettings, HistoryItem, ShortcutItem } from '@shared/types';
import { SEARCH_ENGINES } from '@shared/constants';
import { NovaLogo } from '../components/NovaLogo';

interface StartPageProps {
  settings: BrowserSettings;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onUpdateShortcuts: (shortcuts: ShortcutItem[]) => void;
  onOpenSettings: () => void;
  isPrivate?: boolean;
}

export const StartPage: React.FC<StartPageProps> = ({
  settings,
  bookmarks,
  history,
  onNavigate,
  onUpdateShortcuts,
  onOpenSettings,
  isPrivate = false,
}) => {
  const [query, setQuery] = useState('');
  const [showAddShortcut, setShowAddShortcut] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const recentHistory = isPrivate ? [] : history.slice(0, 6);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

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
        padding: '40px 24px 60px',
      }}
    >
      {/* Clock & Greeting */}
      {settings.showClockOnNewTab !== false && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '38px', fontWeight: 800, letterSpacing: '-1px', color: 'var(--text-main)', textShadow: '0 0 24px rgba(139,92,246,0.3)' }}>
            {timeString}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {dateString}
          </div>
        </div>
      )}

      {/* Brand Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '28px',
        }}
      >
        <NovaLogo size={48} showText textClassName="text-2xl tracking-widest font-extrabold" />
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>
          {isPrivate
            ? 'NOVA Ghost — Isolated Private Browsing Session'
            : 'Next-Generation Privacy Browser • Ad-Free • Zero Telemetry'}
        </p>
      </div>

      {/* Main Search Input */}
      <form
        onSubmit={handleSearch}
        style={{
          width: '100%',
          maxWidth: '640px',
          marginBottom: '24px',
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
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            border: '1px solid var(--border-hover)',
          }}
        >
          <Search size={18} style={{ color: '#8b5cf6' }} />
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
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 18px',
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(139,92,246,0.3)',
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Quick Access Tiles */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '32px',
          maxWidth: '640px',
        }}
      >
        <button
          onClick={() => onNavigate('nova://vault')}
          className="glass hover-border"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          <Lock size={14} className="text-purple-400" />
          <span>Encrypted Vault</span>
        </button>

        <button
          onClick={() => onNavigate('nova://bookmarks')}
          className="glass hover-border"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          <BookmarkIcon size={14} className="text-amber-400" />
          <span>Bookmarks</span>
        </button>

        <button
          onClick={() => onNavigate('nova://history')}
          className="glass hover-border"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          <History size={14} className="text-blue-400" />
          <span>History</span>
        </button>

        <button
          onClick={() => onNavigate('nova://downloads')}
          className="glass hover-border"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          <Download size={14} className="text-green-400" />
          <span>Downloads</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="glass hover-border"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-main)',
            cursor: 'pointer',
          }}
        >
          <Settings size={14} className="text-cyan-400" />
          <span>Control Center</span>
        </button>
      </div>

      {/* Quick Dial / Shortcuts Grid */}
      <div style={{ width: '100%', maxWidth: '780px', marginBottom: '32px' }}>
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
            Favorite Websites
          </span>
          <button
            onClick={() => setShowAddShortcut(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--accent)',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Add Shortcut</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
            gap: '12px',
          }}
        >
          {settings.shortcuts.map((sc) => (
            <div
              key={sc.id}
              onClick={() => onNavigate(sc.url)}
              className="glass hover-border"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 8px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginBottom: '8px',
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
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sc.title}
              </span>
              <button
                onClick={(e) => handleRemoveShortcut(sc.id, e)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  padding: '2px',
                  borderRadius: '4px',
                  color: 'var(--text-faint)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Visits (Subject to saveHistory and not in private browsing) */}
      {!isPrivate && settings.saveHistory && recentHistory.length > 0 && (
        <div style={{ width: '100%', maxWidth: '780px', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', padding: '0 4px' }}>
            Recent Local Visits
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
                className="glass hover-border"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={13} style={{ color: 'var(--accent)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.title || item.url}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
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

      {/* Add Shortcut Dialog */}
      {showAddShortcut && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div
            className="glass"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
              Add Favorite Website
            </h3>
            <form onSubmit={handleAddShortcut} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
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
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Web Address (URL)
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="e.g. github.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddShortcut(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Add Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
