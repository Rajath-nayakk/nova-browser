import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Search,
  EyeOff,
  Sliders,
  Trash2,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  Folder,
  Lock,
  Camera,
  Mic,
  MapPin,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { BrowserSettings } from '@shared/types';
import { SEARCH_ENGINES } from '@shared/constants';

interface SettingsViewProps {
  settings: BrowserSettings;
  onUpdateSettings: (partial: Partial<BrowserSettings>) => void;
  onResetSettings: () => void;
  onOpenClearData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onOpenClearData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'appearance' | 'about'>('general');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const showSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleUpdate = (partial: Partial<BrowserSettings>) => {
    onUpdateSettings(partial);
    showSaved();
  };

  const sitePermissionsList: { origin: string; permission: string; decision: string }[] = [];
  if (settings.sitePermissions) {
    Object.entries(settings.sitePermissions).forEach(([origin, perms]) => {
      if (perms) {
        Object.entries(perms).forEach(([perm, decision]) => {
          sitePermissionsList.push({ origin, permission: perm, decision: String(decision) });
        });
      }
    });
  }

  const siteExceptionsList = Object.keys(settings.siteShieldExceptions || {});

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        background: 'var(--bg-app)',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar Nav */}
      <div
        style={{
          width: '240px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-color)',
          padding: '24px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 16px' }}>
          <Settings size={20} style={{ color: 'var(--accent)' }} />
          <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Settings</h2>
        </div>

        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'general' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'general' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'general' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <Sliders size={16} />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'privacy' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'privacy' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'privacy' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <Shield size={16} style={{ color: 'var(--shield-active)' }} />
          <span>Privacy & Shields</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'appearance' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'appearance' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'appearance' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <Sun size={16} />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          style={{
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'about' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'about' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'about' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <Lock size={16} />
          <span>About & Manifesto</span>
        </button>

        {savedFeedback && (
          <div
            style={{
              marginTop: 'auto',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-green)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle size={14} />
            <span>Saved locally</span>
          </div>
        )}
      </div>

      {/* Main Settings Content Area */}
      <div
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          padding: '36px 48px',
        }}
      >
        <div style={{ maxWidth: '680px' }}>
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
                General Settings
              </h3>

              {/* Search Engine */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  Default Search Engine
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Search queries submitted in the address bar will use this search engine.
                </div>

                <select
                  value={settings.searchEngine}
                  onChange={(e) => handleUpdate({ searchEngine: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                    marginBottom: settings.searchEngine === 'custom' ? '10px' : '0',
                  }}
                >
                  <option value="duckduckgo">DuckDuckGo (Recommended Privacy Default)</option>
                  <option value="brave">Brave Search (Independent Index)</option>
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                  <option value="custom">Custom Search Engine URL</option>
                </select>

                {settings.searchEngine === 'custom' && (
                  <input
                    type="text"
                    value={settings.customSearchUrl}
                    onChange={(e) => handleUpdate({ customSearchUrl: e.target.value })}
                    placeholder="https://example.com/search?q=%s"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                    }}
                  />
                )}
              </div>

              {/* Startup Behavior */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  On Startup
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings.restoreSession}
                    onChange={(e) => handleUpdate({ restoreSession: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Restore previous session tabs on browser restart</span>
                </label>
              </div>

              {/* Bookmarks bar */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  Bookmarks Toolbar
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    checked={settings.showBookmarksBar}
                    onChange={(e) => handleUpdate({ showBookmarksBar: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Always show bookmarks bar below the navigation bar</span>
                </label>
              </div>
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === 'privacy' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
                Privacy & Content Blocking
              </h3>

              {/* Master Shield Controls */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>NOVA Privacy Shield</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Automatically blocks known advertising networks and telemetry trackers.
                    </div>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.blockTrackers}
                    onChange={(e) => handleUpdate({ blockTrackers: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Block behavioral trackers and analytics scripts</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.blockAds}
                    onChange={(e) => handleUpdate({ blockAds: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Block third-party ad networks and banners</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.stripTrackingParams}
                    onChange={(e) => handleUpdate({ stripTrackingParams: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Strip tracking parameters (utm_*, fbclid, gclid) from visited URLs</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.sendDoNotTrack}
                    onChange={(e) => handleUpdate({ sendDoNotTrack: e.target.checked })}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span>Send "Do Not Track" (DNT) and "Global Privacy Control" (GPC) headers</span>
                </label>
              </div>

              {/* Browsing Data & History */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  Browsing Data & Storage
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Clear cookies, cache, storage, and history at any time.
                </div>

                <button
                  onClick={onOpenClearData}
                  style={{
                    padding: '8px 16px',
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
                  <Trash2 size={14} />
                  <span>Clear Browsing Data...</span>
                </button>
              </div>

              {/* Site Permissions Manager */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  Site Permissions
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Permissions granted or blocked for specific websites (Default: Denied).
                </div>

                {sitePermissionsList.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                    No custom site permissions saved. All sites must prompt or are denied by default.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sitePermissionsList.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-input)',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <strong>{item.origin}</strong>: {item.permission} ({item.decision})
                        </div>
                        <button
                          onClick={() => {
                            const updated = { ...settings.sitePermissions };
                            if (updated[item.origin]) {
                              delete updated[item.origin][item.permission];
                              if (Object.keys(updated[item.origin]).length === 0) {
                                delete updated[item.origin];
                              }
                            }
                            handleUpdate({ sitePermissions: updated });
                          }}
                          style={{ color: 'var(--accent-red)', padding: '2px 6px', fontSize: '11px' }}
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
                Appearance
              </h3>

              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                  Theme Mode
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => handleUpdate({ theme: 'dark' })}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: settings.theme === 'dark' ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
                      border: `2px solid ${settings.theme === 'dark' ? 'var(--accent)' : 'var(--border-color)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Moon size={20} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Dark Stealth</span>
                  </button>

                  <button
                    onClick={() => handleUpdate({ theme: 'light' })}
                    style={{
                      flex: 1,
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      background: settings.theme === 'light' ? 'var(--bg-surface-elevated)' : 'var(--bg-input)',
                      border: `2px solid ${settings.theme === 'light' ? 'var(--accent)' : 'var(--border-color)'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Sun size={20} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Light Clean</span>
                  </button>
                </div>
              </div>

              {/* Reset to defaults */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  Reset Settings
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Restores default settings. This will not delete your bookmarks.
                </div>
                <button
                  onClick={onResetSettings}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Restore Default Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
                About NOVA Browser
              </h3>

              <div
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  lineHeight: '1.6',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <Shield size={24} style={{ color: 'var(--accent)' }} />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                      NOVA Browser v1.0.0
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)' }}>
                      Private & Ad-Free Desktop Browser
                    </span>
                  </div>
                </div>

                <p style={{ marginBottom: '14px' }}>
                  NOVA was engineered to provide a tranquil, telemetry-free desktop browsing experience. Unlike mainstream commercial browsers, NOVA does not profile your browsing, insert affiliate search parameters, monetize keystrokes, or sell ad space in the interface.
                </p>

                <h5 style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '16px', marginBottom: '6px' }}>
                  Security & Architecture Standards:
                </h5>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>Strict Context Isolation & Node.js sandboxing for website rendering.</li>
                  <li>Genuine native WebContentsView architecture — no fake iframes or screenshots.</li>
                  <li>In-memory non-persistent sessions for Private Browsing.</li>
                  <li>Deny-by-default permission policy for cameras, microphones, and location.</li>
                  <li>Atomic local storage serialization to protect data against disk corruption.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
