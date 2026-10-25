import React from 'react';
import { Shield, ShieldAlert, CheckCircle, Eye, AlertCircle, X, ExternalLink } from 'lucide-react';
import { PrivacyShieldStats } from '@shared/types';

interface PrivacyShieldPopupProps {
  stats: PrivacyShieldStats;
  onClose: () => void;
  onToggleSiteShield: (domain: string, disabled: boolean) => void;
  onOpenSettings: () => void;
}

export const PrivacyShieldPopup: React.FC<PrivacyShieldPopupProps> = ({
  stats,
  onClose,
  onToggleSiteShield,
  onOpenSettings,
}) => {
  const isSiteShielded = !stats.isSiteWhitelisted;

  return (
    <div
      className="glass animate-fade-in"
      style={{
        position: 'absolute',
        top: '46px',
        right: '120px',
        width: '330px',
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
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: isSiteShielded
                ? 'linear-gradient(135deg, #0284c7, #38bdf8)'
                : 'rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSiteShielded ? '#fff' : 'var(--accent-red)',
            }}
          >
            {isSiteShielded ? <Shield size={16} /> : <ShieldAlert size={16} />}
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600 }}>NOVA Privacy Shield</h4>
            <span style={{ fontSize: '11px', color: isSiteShielded ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isSiteShielded ? 'Shield Active' : 'Shield Paused for this site'}
            </span>
          </div>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '2px' }}>
          <X size={15} />
        </button>
      </div>

      {/* Target Domain & Toggle */}
      {stats.currentDomain && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            marginBottom: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              {stats.currentDomain}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isSiteShielded ? 'Protected against ads & trackers' : 'Allowing all connections'}
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
          marginBottom: '14px',
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
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--shield-active)' }}>
            {stats.pageBlocked}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Blocked on page</div>
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
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-purple)' }}>
            {stats.totalBlocked}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total session blocks</div>
        </div>
      </div>

      {/* Categorized Breakdown */}
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
          Blocked Threats Breakdown:
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
          <span>Ad Servers & Banners:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown.ads}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
          <span>Behavioral Trackers:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown.trackers}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
          <span>Analytics & Telemetry:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown.analytics}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
          <span>Cryptomining Scripts:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{stats.breakdown.cryptominers}</span>
        </div>
      </div>

      {/* Transparency Note */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-faint)',
          lineHeight: '1.4',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '10px',
        }}
      >
        NOVA runs 100% locally. Zero telemetry is sent to any server. Blockers reduce invasive tracking but cannot guarantee 100% ad removal on every site.
      </div>

      {/* Settings link */}
      <button
        onClick={() => {
          onOpenSettings();
          onClose();
        }}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-elevated)',
          color: 'var(--accent)',
          fontSize: '11px',
          fontWeight: 600,
          gap: '4px',
        }}
      >
        <span>Configure Privacy Settings</span>
        <ExternalLink size={11} />
      </button>
    </div>
  );
};
