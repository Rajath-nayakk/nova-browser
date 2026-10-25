import React, { useState } from 'react';
import { Shield, ShieldAlert, X, ExternalLink, RefreshCw, CheckCircle2, ShieldCheck, Sparkles, RotateCcw } from 'lucide-react';
import { PrivacyShieldStats } from '@shared/types';

interface PrivacyShieldPopupProps {
  stats: PrivacyShieldStats;
  onClose: () => void;
  onToggleSiteShield: (domain: string, disabled: boolean) => void;
  onOpenSettings: () => void;
  onOpenLinkLens?: () => void;
}

export const PrivacyShieldPopup: React.FC<PrivacyShieldPopupProps> = ({
  stats,
  onClose,
  onToggleSiteShield,
  onOpenSettings,
  onOpenLinkLens,
}) => {
  const isSiteShielded = !stats.isSiteWhitelisted;
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleUpdateFilters = async () => {
    if (!window.novaAPI?.updateFilterLists) return;
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const res = await window.novaAPI.updateFilterLists();
      setUpdateMsg(res.message);
      setTimeout(() => setUpdateMsg(null), 3500);
    } catch {
      setUpdateMsg('Update failed. Preserved local rules.');
      setTimeout(() => setUpdateMsg(null), 3500);
    } finally {
      setUpdating(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (confirm('Restore default privacy and shield settings?')) {
      await window.novaAPI.resetSettings();
      onClose();
    }
  };

  return (
    <div
      className="glass animate-fade-in"
      style={{
        position: 'absolute',
        top: '46px',
        right: '120px',
        width: '360px',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        zIndex: 1000,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              background: isSiteShielded
                ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)'
                : 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSiteShielded ? '#fff' : 'var(--accent-red)',
            }}
          >
            {isSiteShielded ? <Shield size={17} /> : <ShieldAlert size={17} />}
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              NOVA Privacy Shield
            </h4>
            <span style={{ fontSize: '11px', color: isSiteShielded ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isSiteShielded ? 'Shield Active (EasyList + Sentinel)' : 'Shield Paused for this domain'}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '2px' }}>
          <X size={15} />
        </button>
      </div>

      {/* Target Domain & Allowlist Toggle */}
      {stats.currentDomain && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            marginBottom: '12px',
          }}
        >
          <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {stats.currentDomain}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {isSiteShielded ? 'Protected against ads, trackers & scams' : 'Site allowlisted (Shields off)'}
            </div>
          </div>
          <button
            onClick={() => onToggleSiteShield(stats.currentDomain, isSiteShielded)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '11px',
              fontWeight: 600,
              background: isSiteShielded ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)',
              color: isSiteShielded ? 'var(--accent-red)' : 'var(--accent-green)',
              whiteSpace: 'nowrap',
            }}
          >
            {isSiteShielded ? 'Pause Shield' : 'Resume Shield'}
          </button>
        </div>
      )}

      {/* Blocked Count Stats Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <div
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8' }}>
            {stats.pageBlocked}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Blocked on Page</div>
        </div>

        <div
          style={{
            padding: '10px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#a78bfa' }}>
            {stats.totalBlocked}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Session Blocks</div>
        </div>
      </div>

      {/* Categorized Breakdown */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', background: 'var(--bg-surface)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Threat & Filter Breakdown</span>
          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>100% Local</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Ads & Video Overlays:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown?.ads || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Behavioral Trackers:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown?.trackers || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Analytics & Telemetry:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown?.analytics || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Cryptomining Endpoints:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown?.cryptominers || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
          <span>Phishing & Malware Blocks:</span>
          <span style={{ fontWeight: 600, color: '#ef4444' }}>{stats.breakdown?.threats || 0}</span>
        </div>
      </div>

      {/* Filter Lists Status & Updater */}
      <div style={{ marginBottom: '12px', padding: '8px 10px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Active Filter Lists:</span>
          <button
            onClick={handleUpdateFilters}
            disabled={updating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#38bdf8',
              cursor: updating ? 'not-allowed' : 'pointer',
              background: 'transparent',
              border: 'none',
              padding: 0,
            }}
          >
            <RefreshCw size={11} className={updating ? 'animate-spin' : ''} />
            <span>{updating ? 'Updating...' : 'Update Lists'}</span>
          </button>
        </div>
        <div style={{ color: 'var(--text-faint)', fontSize: '10px', lineHeight: '1.3' }}>
          EasyList • EasyPrivacy • NOVA YouTube Shields • Sentinel Threat Feed
        </div>
        {updateMsg && (
          <div style={{ marginTop: '4px', color: '#10b981', fontSize: '10px', fontWeight: 500 }}>
            {updateMsg}
          </div>
        )}
      </div>

      {/* Action Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {onOpenLinkLens && (
          <button
            onClick={() => {
              onOpenLinkLens();
              onClose();
            }}
            style={{
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Sparkles size={12} />
            <span>Link Lens</span>
          </button>
        )}

        <button
          onClick={handleRestoreDefaults}
          style={{
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-muted)',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <RotateCcw size={12} />
          <span>Restore Defaults</span>
        </button>
      </div>

      <button
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
        style={{
          marginTop: '6px',
          width: '100%',
          padding: '7px',
          borderRadius: 'var(--radius-sm)',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15))',
          color: '#a78bfa',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        <span>Configure Control Center</span>
        <ExternalLink size={11} />
      </button>
    </div>
  );
};
