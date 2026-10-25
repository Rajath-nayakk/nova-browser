import React, { useState } from 'react';
import {
  History as HistoryIcon,
  Search,
  Trash2,
  Globe,
  Clock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { HistoryItem } from '@shared/types';
import {
  aggregateTopDomains,
  filterHistoryByDateRange,
  getHistoryDateGroupLabel,
  HistoryDateRange,
} from '@shared/historyUtils';
import { extractDomain } from '@shared/validation';

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
  const [dateRange, setDateRange] = useState<HistoryDateRange>('all');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showClearDropdown, setShowClearDropdown] = useState(false);

  // Top visited domains from history
  const topDomains = aggregateTopDomains(history, 7);

  // Apply date range, search, and domain filter
  const dateFiltered = filterHistoryByDateRange(history, dateRange);
  const filteredHistory = dateFiltered.filter((h) => {
    const matchesSearch =
      h.title.toLowerCase().includes(search.toLowerCase()) ||
      h.url.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedDomain) {
      return extractDomain(h.url) === selectedDomain;
    }
    return true;
  });

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group history by date
  const grouped = filteredHistory.reduce((acc, item) => {
    const group = getHistoryDateGroupLabel(item.visitedAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, HistoryItem[]>);

  const clearOptions = [
    { label: 'Last 15 minutes', value: '15m' },
    { label: 'Last hour', value: '1h' },
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'All time', value: 'all' },
  ];

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
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowClearDropdown(!showClearDropdown)}
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
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                  <span>Clear History</span>
                  <ChevronDown size={13} />
                </button>

                {showClearDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '6px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                      zIndex: 100,
                      width: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {clearOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          onClearHistory(opt.value);
                          setShowClearDropdown(false);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: 'transparent',
                          color: opt.value === 'all' ? 'var(--accent-red)' : 'var(--text-main)',
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

        {/* Top Visited Domains Bar */}
        {topDomains.length > 0 && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrendingUp size={13} style={{ color: 'var(--accent)' }} />
              <span>Top Visited Domains:</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {topDomains.map((td) => {
                const isSelected = selectedDomain === td.domain;
                return (
                  <button
                    key={td.domain}
                    onClick={() => setSelectedDomain(isSelected ? null : td.domain)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isSelected ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? '#000000' : 'var(--text-main)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{td.domain}</span>
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: '10px',
                        background: isSelected ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                        fontSize: '10px',
                        fontWeight: 600,
                      }}
                    >
                      {td.count}
                    </span>
                    {isSelected && <X size={11} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Date Range Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateRange(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 500,
                background: dateRange === tab.id ? 'var(--accent)' : 'var(--bg-surface)',
                color: dateRange === tab.id ? '#000000' : 'var(--text-muted)',
                border: `1px solid ${dateRange === tab.id ? 'var(--accent)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

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
            placeholder={
              selectedDomain
                ? `Search history in ${selectedDomain}...`
                : 'Search browsing history...'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
            }}
          />
          {selectedDomain && (
            <button
              onClick={() => setSelectedDomain(null)}
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Domain: {selectedDomain}</span>
              <X size={12} />
            </button>
          )}
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
