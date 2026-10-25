import React from 'react';
import { Check, Settings, X, Shield, Plus } from 'lucide-react';
import { BrowserProfile } from '@shared/types';

interface ProfileSwitcherPopupProps {
  profiles: BrowserProfile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onManageProfiles: () => void;
  onClose: () => void;
}

export const ProfileSwitcherPopup: React.FC<ProfileSwitcherPopupProps> = ({
  profiles,
  activeProfileId,
  onSwitchProfile,
  onManageProfiles,
  onClose,
}) => {
  return (
    <div
      className="glass animate-fade-in"
      style={{
        position: 'absolute',
        top: '46px',
        right: '40px',
        width: '270px',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        zIndex: 1000,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
          Identity Profiles
        </span>
        <button
          onClick={onClose}
          style={{ color: 'var(--text-muted)', padding: '2px', cursor: 'pointer' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Profiles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
        {profiles.map((prof) => {
          const isActive = prof.id === activeProfileId;
          return (
            <button
              key={prof.id}
              onClick={() => {
                onSwitchProfile(prof.id);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                border: isActive ? `1px solid ${prof.color}60` : '1px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    background: `${prof.color}20`,
                    border: `1px solid ${prof.color}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px',
                  }}
                >
                  {prof.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, color: 'var(--text-main)' }}>
                    {prof.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                    Isolated storage
                  </div>
                </div>
              </div>

              {isActive && (
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: prof.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <button
        onClick={() => {
          onManageProfiles();
          onClose();
        }}
        style={{
          width: '100%',
          padding: '7px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
        }}
      >
        <Settings size={12} />
        <span>Manage Profiles in Settings</span>
      </button>
    </div>
  );
};
