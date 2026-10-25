import React, { useState } from 'react';
import { Camera, Mic, MapPin, Bell, Shield, X } from 'lucide-react';
import { PermissionRequest } from '@shared/types';

interface PermissionModalProps {
  request: PermissionRequest;
  onRespond: (decision: 'allow' | 'deny', remember: boolean) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  request,
  onRespond,
}) => {
  const [remember, setRemember] = useState(true);

  const getIcon = () => {
    switch (request.permission) {
      case 'camera':
        return <Camera size={20} style={{ color: 'var(--accent)' }} />;
      case 'microphone':
        return <Mic size={20} style={{ color: 'var(--accent-orange)' }} />;
      case 'geolocation':
        return <MapPin size={20} style={{ color: 'var(--accent-green)' }} />;
      case 'notifications':
        return <Bell size={20} style={{ color: 'var(--accent-purple)' }} />;
      default:
        return <Shield size={20} style={{ color: 'var(--accent)' }} />;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        className="glass animate-fade-in"
        style={{
          width: '380px',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'var(--bg-surface-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIcon()}
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Permission Request</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              <strong>{request.origin}</strong> wants to use your{' '}
              <strong>{request.permission}</strong>
            </p>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-faint)', lineHeight: '1.5', marginBottom: '16px' }}>
          NOVA denies sensitive device permissions by default to protect your privacy. Only grant access if you trust this website.
        </p>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          <span>Remember my decision for this site</span>
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onRespond('deny', remember)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Block
          </button>
          <button
            onClick={() => onRespond('allow', remember)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#000',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
};
