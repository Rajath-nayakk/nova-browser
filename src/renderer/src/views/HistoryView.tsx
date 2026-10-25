import React, { useState } from 'react';
import { History as HistoryIcon, Search, Trash2, Globe, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { HistoryItem } from '@shared/types';

interface HistoryViewProps {
  history: HistoryItem[];
  saveHistory: boolean;
  onNavigate: (url: string) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: (range: string) => void;
  onToggleSaveHistory: (enabled: boolean) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  saveHistory,
  onNavigate,
  onRemoveItem,
  onClearHistory,
  onToggleSaveHistory,
}) => {
  const [search, setSearch] = useState('');

  const filteredHistory = history.filter(
    (h) =>
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.url.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateGroup = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group history by date
  const grouped = filteredHistory.reduce((acc, item) => {
    const group = formatDateGroup(item.visitedAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-app)',
        padding: '36px 48px',
      }}
    >
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <HistoryIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Browsing History</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {history.length} items stored strictly on your local device
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={saveHistory}
                onChange={(e) => onToggleSaveHistory(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span>Record history</span>
            </label>

            {history.length > 0 && (
              <button
                onClick={() => onClearHistory('all')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--accent-red)',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* History Recording Status Notice */}
        {!saveHistory && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'var(--accent-orange)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={16} />
            <span>History recording is disabled. Visited pages will not be saved locally.</span>
          </div>
        )}

        {/* Search input */}
        <div
          style={{
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search browsing history..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
            }}
          />
        </div>

        {/* Grouped History List */}
        {Object.keys(grouped).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--text-faint)',
              fontSize: '13px',
            }}
          >
            {search ? 'No history entries match your search' : 'No browsing history recorded'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {(Object.entries(grouped) as [string, HistoryItem[]][]).map(([dateGroup, items]) => (
              <div key={dateGroup}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '10px',
                    paddingLeft: '4px',
                  }}
                >
                  {dateGroup}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div
                        onClick={() => onNavigate(item.url)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                          minWidth: 0,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)', minWidth: '55px' }}>
                          {formatTime(item.visitedAt)}
                        </span>
                        {item.favicon ? (
                          <img
                            src={item.favicon}
                            alt=""
                            style={{ width: '16px', height: '16px', borderRadius: '3px' }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Globe size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
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

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        style={{ padding: '4px', borderRadius: '4px', color: 'var(--text-faint)' }}
                        title="Remove from history"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
