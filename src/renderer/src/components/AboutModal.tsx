import React from 'react';
import { Shield, Check, Lock, EyeOff, Cpu, X, ExternalLink } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
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
        zIndex: 2000,
      }}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '460px',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Shield size={26} strokeWidth={2.4} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>
                NOVA Browser
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                Version 1.0.0 (Release Build)
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '18px' }}>
          NOVA is an independent, high-performance desktop web browser engineered from the ground up for privacy, speed, and clean browsing without commercial noise.
        </p>

        {/* Core Principles Matrix */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <Check size={14} style={{ color: 'var(--accent-green)' }} />
            <span><strong>Zero Telemetry:</strong> No usage metrics, crash pings, or analytics.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <Check size={14} style={{ color: 'var(--accent-green)' }} />
            <span><strong>Zero UI Ads:</strong> No sponsored links, banner widgets, or promotional tiles.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <Check size={14} style={{ color: 'var(--accent-green)' }} />
            <span><strong>Local Data Only:</strong> Bookmarks, history, and settings stay on your PC.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <Check size={14} style={{ color: 'var(--accent-green)' }} />
            <span><strong>Privacy Shield:</strong> Network request blocking against ad & tracking servers.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <Check size={14} style={{ color: 'var(--accent-green)' }} />
            <span><strong>No Account Needed:</strong> Open, fast, and unrestricted out of the box.</span>
          </div>
        </div>

        {/* Transparent Limitations */}
        <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: '1.5', marginBottom: '20px' }}>
          <strong>Transparency Notice:</strong> While NOVA blocks external trackers and enforces sandboxed isolation, it cannot guarantee complete anonymity on the public internet. Sites you log into can track your session, and your internet service provider can see domain lookups unless using an encrypted DNS/VPN tunnel.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#000000',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
