import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  X,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Activity,
  Layers,
} from 'lucide-react';
import { BlockedRequestEvent } from '@shared/types';

interface BlockedElementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tabId?: string;
}

export const BlockedElementsModal: React.FC<BlockedElementsModalProps> = ({
  isOpen,
  onClose,
  tabId,
}) => {
  const [events, setEvents] = useState<BlockedRequestEvent[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load initial blocked events
    window.novaAPI?.getBlockedEvents?.(tabId).then((data) => {
      if (data) setEvents(data);
    });

    // Subscribe to live events
    const unsubscribe = window.novaAPI?.onBlockedEvent?.((newEv) => {
      setEvents((prev) => {
        // Prevent duplicate IDs
        if (prev.some((e) => e.id === newEv.id)) return prev;
        return [newEv, ...prev].slice(0, 300);
      });
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (unsubscribe) unsubscribe();
    };
  }, [isOpen, tabId]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handleClear = async () => {
    await window.novaAPI?.clearBlockedEvents?.(tabId);
    setEvents([]);
  };

  if (!isOpen) return null;

  const filteredEvents = events.filter((ev) => {
    const matchesCategory =
      selectedCategory === 'all' || ev.category === selectedCategory;
    const matchesSearch =
      ev.url.toLowerCase().includes(search.toLowerCase()) ||
      ev.domain.toLowerCase().includes(search.toLowerCase()) ||
      (ev.filterRule && ev.filterRule.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'threats':
        return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'cryptominers':
        return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'trackers':
        return { bg: 'rgba(168, 85, 247, 0.2)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'analytics':
        return { bg: 'rgba(56, 189, 248, 0.2)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
      case 'ads':
      default:
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.25)' };
    }
  };

  const counts = {
    all: events.length,
    ads: events.filter((e) => e.category === 'ads').length,
    trackers: events.filter((e) => e.category === 'trackers').length,
    analytics: events.filter((e) => e.category === 'analytics').length,
    threats: events.filter((e) => e.category === 'threats').length,
    cryptominers: events.filter((e) => e.category === 'cryptominers').length,
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '85vh',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Live Blocked Elements Inspector
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: 'var(--accent-red)',
                    fontWeight: 600,
                  }}
                >
                  {events.length} blocked
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
                Real-time monitor of network requests blocked by NOVA Privacy Shield & Sentinel
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {events.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title="Clear blocked requests log"
              >
                <Trash2 size={13} />
                <span>Clear Log</span>
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              border: '1px solid var(--border-color)',
              gap: '8px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-faint)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by blocked domain, full URL, or rule pattern..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-main)',
                fontSize: '13px',
                width: '100%',
              }}
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ color: 'var(--text-faint)', padding: '2px', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'ads', label: 'Ads', count: counts.ads },
              { id: 'trackers', label: 'Trackers', count: counts.trackers },
              { id: 'analytics', label: 'Analytics', count: counts.analytics },
              { id: 'threats', label: 'Threats', count: counts.threats },
              { id: 'cryptominers', label: 'Miners', count: counts.cryptominers },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: selectedCategory === cat.id ? 600 : 400,
                  background:
                    selectedCategory === cat.id
                      ? 'var(--accent)'
                      : 'var(--bg-surface-elevated)',
                  color: selectedCategory === cat.id ? '#000' : 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{cat.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    background:
                      selectedCategory === cat.id
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Blocked Requests List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {filteredEvents.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                color: 'var(--text-faint)',
              }}
            >
              <Shield size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
                {search ? 'No matching blocked elements found' : 'No blocked requests recorded yet'}
              </h4>
              <p style={{ fontSize: '12px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                {search
                  ? 'Try refining or clearing your search term.'
                  : 'As active websites make background network requests to third-party ad networks, telemetries, or tracker endpoints, they will appear in this live inspector.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredEvents.map((ev) => {
                const color = getCategoryBadgeColor(ev.category);
                const timeStr = new Date(ev.timestamp).toLocaleTimeString();
                return (
                  <div
                    key={ev.id}
                    className="glass"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: color.bg,
                            color: color.text,
                            border: `1px solid ${color.border}`,
                          }}
                        >
                          {ev.category}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {ev.domain}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-faint)',
                          }}
                        >
                          {ev.resourceType}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{timeStr}</span>
                        <button
                          onClick={() => handleCopy(ev.id, ev.url)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: copiedId === ev.id ? 'var(--accent-green)' : 'var(--text-muted)',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                          title="Copy blocked URL to clipboard"
                        >
                          {copiedId === ev.id ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedId === ev.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        background: 'rgba(0, 0, 0, 0.2)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {ev.url}
                    </div>

                    {ev.filterRule && (
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                        Rule matched: <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{ev.filterRule}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
