import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldAlert,
  Search,
  Trash2,
  Download,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { DiagnosticCategory, DiagnosticLevel, DiagnosticLogEntry } from '@shared/types';

interface LogsViewProps {
  onNavigate?: (url: string) => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ onNavigate }) => {
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
  }>({
    total: 0,
    byLevel: { info: 0, warning: 0, error: 0, threat: 0 },
    byCategory: { shield: 0, sentinel: 0, tls: 0, permission: 0, session: 0, system: 0 },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedLogs, fetchedSummary] = await Promise.all([
        window.novaAPI?.getDiagnosticLogs?.({
          category: selectedCategory,
          level: selectedLevel,
          search: search.trim() || undefined,
          limit: 250,
        }),
        window.novaAPI?.getDiagnosticSummary?.(),
      ]);

      if (fetchedLogs) setLogs(fetchedLogs);
      if (fetchedSummary) setSummary(fetchedSummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedLevel]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleClear = async () => {
    if (confirm('Clear local diagnostic event logs? This cannot be undone.')) {
      await window.novaAPI?.clearDiagnosticLogs?.();
      setLogs([]);
      setSummary({
        total: 0,
        byLevel: { info: 0, warning: 0, error: 0, threat: 0 },
        byCategory: { shield: 0, sentinel: 0, tls: 0, permission: 0, session: 0, system: 0 },
      });
    }
  };

  const handleExport = async () => {
    if (!window.novaAPI?.exportDiagnostics) return;
    const jsonStr = await window.novaAPI.exportDiagnostics();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-diagnostic-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyDetails = (id: string, details: any) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2));
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const getLevelStyle = (level: DiagnosticLevel) => {
    switch (level) {
      case 'threat':
        return {
          icon: <ShieldAlert size={14} style={{ color: '#ef4444' }} />,
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={14} style={{ color: '#f59e0b' }} />,
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
        };
      case 'error':
        return {
          icon: <AlertTriangle size={14} style={{ color: '#f43f5e' }} />,
          bg: 'rgba(244, 63, 94, 0.15)',
          color: '#fb7185',
          border: 'rgba(244, 63, 94, 0.3)',
        };
      case 'info':
      default:
        return {
          icon: <Info size={14} style={{ color: '#38bdf8' }} />,
          bg: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          border: 'rgba(56, 189, 248, 0.3)',
        };
    }
  };

  const getCategoryBadge = (category: DiagnosticCategory) => {
    switch (category) {
      case 'sentinel':
        return { label: 'Sentinel Threat', color: '#ef4444' };
      case 'shield':
        return { label: 'Shield Adblock', color: '#a855f7' };
      case 'tls':
        return { label: 'TLS Security', color: '#10b981' };
      case 'permission':
        return { label: 'Permissions', color: '#38bdf8' };
      case 'session':
        return { label: 'Session Isolation', color: '#f59e0b' };
      case 'security':
        return { label: 'Security Audit', color: '#06b6d4' };
      case 'system':
      default:
        return { label: 'System', color: 'var(--text-muted)' };
    }
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-app)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '960px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <Activity size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Security & Diagnostic Event Console
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
                Safe, zero-telemetry audit trail of privacy shield blocks, sentinel interceptions, and TLS certificates
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Refresh logs"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExport}
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
              title="Export local diagnostic report to JSON file"
            >
              <Download size={14} />
              <span>Export Report</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--accent-red)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
                title="Clear all stored diagnostic logs"
              >
                <Trash2 size={14} />
                <span>Clear Logs</span>
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            className="glass"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Logged Events
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
              {summary.total}
            </div>
          </div>

          <div
            className="glass"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--accent-red)', textTransform: 'uppercase', fontWeight: 600 }}>
              Threats Intercepted
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171', marginTop: '4px' }}>
              {summary.byLevel.threat || 0}
            </div>
          </div>

          <div
            className="glass"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>
              Shield Rule Matches
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#c084fc', marginTop: '4px' }}>
              {summary.byCategory.shield || 0}
            </div>
          </div>

          <div
            className="glass"
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--accent-green)', textTransform: 'uppercase', fontWeight: 600 }}>
              TLS Verified Audits
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-green)', marginTop: '4px' }}>
              {summary.byCategory.tls || 0}
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div
          className="glass"
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-faint)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events by URL, domain, or message..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  width: '100%',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: '#000',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Filter
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="all">All Categories</option>
                <option value="sentinel">Sentinel Threats</option>
                <option value="shield">Privacy Shield</option>
                <option value="security">Security & CSP</option>
                <option value="tls">TLS Certificates</option>
                <option value="permission">Permissions</option>
                <option value="session">Session</option>
                <option value="system">System</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Level:</span>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  outline: 'none',
                }}
              >
                <option value="all">All Levels</option>
                <option value="threat">Threats Only</option>
                <option value="warning">Warnings</option>
                <option value="error">Errors</option>
                <option value="info">Informational</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table / Cards */}
        {logs.length === 0 ? (
          <div
            className="glass"
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-faint)',
            }}
          >
            <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
              No diagnostic events match current filters
            </h3>
            <p style={{ fontSize: '13px', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
              Security and privacy operations performed during web browsing (filter matches, threat detections, and TLS security verifications) are recorded locally.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {logs.map((log) => {
              const levelStyle = getLevelStyle(log.level);
              const categoryBadge = getCategoryBadge(log.category);
              const isExpanded = expandedId === log.id;
              const dateStr = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div
                  key={log.id}
                  className="glass"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: levelStyle.bg,
                          border: `1px solid ${levelStyle.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {levelStyle.icon}
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: categoryBadge.color,
                          background: 'var(--bg-surface-elevated)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          flexShrink: 0,
                        }}
                      >
                        {categoryBadge.label}
                      </span>

                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-main)',
                          fontWeight: log.level === 'threat' ? 600 : 400,
                          wordBreak: 'break-word',
                        }}
                      >
                        {log.message}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{dateStr}</span>
                      {log.details && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          <span>Details</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON details */}
                  {isExpanded && log.details && (
                    <div
                      style={{
                        marginTop: '4px',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                          Diagnostic Payload
                        </span>
                        <button
                          onClick={() => handleCopyDetails(log.id, log.details)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            color: copiedId === log.id ? 'var(--accent-green)' : 'var(--text-muted)',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          {copiedId === log.id ? <Check size={10} /> : <Copy size={10} />}
                          <span>{copiedId === log.id ? 'Copied' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre
                        style={{
                          margin: 0,
                          fontSize: '11px',
                          color: 'var(--accent)',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          lineHeight: 1.4,
                        }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
