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
  Globe,
  Radio,
  Users,
  Compass,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { BrowserSettings } from '@shared/types';
import { SEARCH_ENGINES } from '@shared/constants';
import { NovaLogo } from '../components/NovaLogo';

interface SettingsViewProps {
  settings: BrowserSettings;
  onUpdateSettings: (partial: Partial<BrowserSettings>) => void;
  onResetSettings: () => void;
  onOpenClearData: () => void;
}

type TabType = 'general' | 'shield' | 'sentinel' | 'privacy' | 'tor' | 'profiles' | 'focus' | 'appearance' | 'about';

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onOpenClearData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [updatingFilters, setUpdatingFilters] = useState(false);
  const [filterUpdateMsg, setFilterUpdateMsg] = useState<string | null>(null);
  const [updatingThreats, setUpdatingThreats] = useState(false);
  const [threatUpdateMsg, setThreatUpdateMsg] = useState<string | null>(null);
  const [customRulesText, setCustomRulesText] = useState((settings.customFilterRules || []).join('\n'));

  const showSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleUpdate = (partial: Partial<BrowserSettings>) => {
    onUpdateSettings(partial);
    showSaved();
  };

  const handleUpdateFilters = async () => {
    if (!window.novaAPI?.updateFilterLists) return;
    setUpdatingFilters(true);
    setFilterUpdateMsg(null);
    try {
      const res = await window.novaAPI.updateFilterLists();
      setFilterUpdateMsg(res.message);
    } catch {
      setFilterUpdateMsg('Failed to update filter lists. Preserved current rules.');
    } finally {
      setUpdatingFilters(false);
    }
  };

  const handleUpdateThreats = async () => {
    if (!window.novaAPI?.updateThreatFeeds) return;
    setUpdatingThreats(true);
    setThreatUpdateMsg(null);
    try {
      const res = await window.novaAPI.updateThreatFeeds();
      setThreatUpdateMsg(res.message);
    } catch {
      setThreatUpdateMsg('Failed to update threat intelligence.');
    } finally {
      setUpdatingThreats(false);
    }
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
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px 16px' }}>
          <NovaLogo size={22} />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>Control Center</h2>
        </div>

        <button
          onClick={() => setActiveTab('general')}
          className={`nav-btn ${activeTab === 'general' ? 'active' : ''}`}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'general' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'general' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'general' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Sliders size={16} />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('shield')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'shield' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'shield' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'shield' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Shield size={16} className="text-purple-400" />
          <span>NOVA Shield (AdBlock)</span>
        </button>

        <button
          onClick={() => setActiveTab('sentinel')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'sentinel' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'sentinel' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'sentinel' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <ShieldAlert size={16} className="text-red-400" />
          <span>NOVA Sentinel (Threats)</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'privacy' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'privacy' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'privacy' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <EyeOff size={16} className="text-cyan-400" />
          <span>Privacy & Cookies</span>
        </button>

        <button
          onClick={() => setActiveTab('tor')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'tor' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'tor' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'tor' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Radio size={16} className="text-amber-400" />
          <span>NOVA Tor Route</span>
        </button>

        <button
          onClick={() => setActiveTab('profiles')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'profiles' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'profiles' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'profiles' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Users size={16} className="text-blue-400" />
          <span>Identity Profiles</span>
        </button>

        <button
          onClick={() => setActiveTab('focus')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'focus' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'focus' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'focus' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Compass size={16} className="text-emerald-400" />
          <span>Focus & Reading</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'appearance' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'appearance' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'appearance' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Sun size={16} />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'about' ? 'var(--bg-surface-elevated)' : 'transparent',
            color: activeTab === 'about' ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: activeTab === 'about' ? 600 : 400,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Globe size={16} />
          <span>About NOVA</span>
        </button>

        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <button
            onClick={onResetSettings}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-faint)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <RotateCcw size={14} />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '36px 48px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {savedFeedback && (
            <div
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                background: 'rgba(16, 185, 129, 0.9)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                zIndex: 3000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <CheckCircle size={14} />
              <span>Settings saved</span>
            </div>
          )}

          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">General Preferences</h2>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Default Search Engine</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(SEARCH_ENGINES).map(([key, item]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdate({ searchEngine: key as any })}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition ${
                        settings.searchEngine === key
                          ? 'bg-purple-600/15 border-purple-500/50 text-white font-semibold'
                          : 'bg-[#0b0d14] border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <span>{item.name}</span>
                      {settings.searchEngine === key && <CheckCircle size={14} className="text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Interface & Bookmarks</h3>
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <span>Show Bookmarks Toolbar below Address Bar</span>
                  <input
                    type="checkbox"
                    checked={settings.showBookmarksBar}
                    onChange={(e) => handleUpdate({ showBookmarksBar: e.target.checked })}
                    className="accent-purple-500 w-4 h-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <span>Display Clock on New Tab Page</span>
                  <input
                    type="checkbox"
                    checked={settings.showClockOnNewTab !== false}
                    onChange={(e) => handleUpdate({ showClockOnNewTab: e.target.checked })}
                    className="accent-purple-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB: NOVA SHIELD (ADBLOCK) */}
          {activeTab === 'shield' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">NOVA Shield — Content Filtering</h2>
                  <p className="text-xs text-gray-400">Powered by EasyList, EasyPrivacy, and YouTube Enhanced Rules.</p>
                </div>
                <button
                  onClick={handleUpdateFilters}
                  disabled={updatingFilters}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-medium transition"
                >
                  <RefreshCw size={13} className={updatingFilters ? 'animate-spin' : ''} />
                  <span>{updatingFilters ? 'Updating...' : 'Update Filter Lists'}</span>
                </button>
              </div>

              {filterUpdateMsg && (
                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-xs text-purple-300">
                  {filterUpdateMsg}
                </div>
              )}

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Block Banner & Video Advertisements (EasyList)</div>
                    <div className="text-gray-500 text-[11px]">Blocks banner ad servers, display networks, and popups.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.blockAds}
                    onChange={(e) => handleUpdate({ blockAds: e.target.checked })}
                    className="accent-purple-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Block Trackers & Analytics (EasyPrivacy)</div>
                    <div className="text-gray-500 text-[11px]">Stops cross-site tracking scripts and user telemetry pixels.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.blockTrackers}
                    onChange={(e) => handleUpdate({ blockTrackers: e.target.checked })}
                    className="accent-purple-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* Site Allowlist */}
              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-2">Shield Site Exceptions (Allowlist)</h3>
                <p className="text-xs text-gray-400 mb-4">Sites where shields are paused to prevent website breakage.</p>
                {siteExceptionsList.length === 0 ? (
                  <div className="text-xs text-gray-500 italic">No site exceptions configured.</div>
                ) : (
                  <div className="space-y-2">
                    {siteExceptionsList.map((domain) => (
                      <div key={domain} className="flex items-center justify-between p-2.5 bg-[#0b0d14] border border-gray-800 rounded-xl text-xs">
                        <span className="font-mono text-gray-200">{domain}</span>
                        <button
                          onClick={() => {
                            const next = { ...settings.siteShieldExceptions };
                            delete next[domain];
                            handleUpdate({ siteShieldExceptions: next });
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Adblock Rules Editor */}
              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Custom Filter Rules</h3>
                    <p className="text-xs text-gray-400">
                      Add custom network blocking and cosmetic rules (Adblock Plus & uBlock syntax). One rule per line.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded-md">
                    {(settings.customFilterRules || []).length} active rule(s)
                  </span>
                </div>

                <textarea
                  value={customRulesText}
                  onChange={(e) => setCustomRulesText(e.target.value)}
                  placeholder={`! Custom Filter Examples:\n||doubleclick.net^\n||example-tracker.com^$third-party\nnews-website.com##.sponsored-post\n! Comments start with an exclamation mark`}
                  rows={6}
                  className="w-full bg-[#0b0d14] border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    Syntax: <code className="text-purple-300">||domain.com^</code> to block domain, <code className="text-purple-300">domain##.class</code> to hide element.
                  </span>
                  <button
                    onClick={() => {
                      const rules = customRulesText
                        .split('\n')
                        .map((r) => r.trim())
                        .filter((r) => r.length > 0);
                      handleUpdate({ customFilterRules: rules });
                    }}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition"
                  >
                    Apply Rules
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SENTINEL (THREAT PROTECTION) */}
          {activeTab === 'sentinel' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">NOVA Sentinel — Threat Defense</h2>
                  <p className="text-xs text-gray-400">Protects against phishing, malware, lookalike domains, and scams.</p>
                </div>
                <button
                  onClick={handleUpdateThreats}
                  disabled={updatingThreats}
                  className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-medium transition"
                >
                  <RefreshCw size={13} className={updatingThreats ? 'animate-spin' : ''} />
                  <span>{updatingThreats ? 'Updating...' : 'Update Threat Feed'}</span>
                </button>
              </div>

              {threatUpdateMsg && (
                <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl text-xs text-red-300">
                  {threatUpdateMsg}
                </div>
              )}

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Block Phishing, Scam & Malware Websites</div>
                    <div className="text-gray-500 text-[11px]">Inspects destinations locally before loading, warning before access.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.blockMalwareAndPhishing}
                    onChange={(e) => handleUpdate({ blockMalwareAndPhishing: e.target.checked })}
                    className="accent-red-500 w-4 h-4"
                  />
                </label>

                <div className="pt-3 border-t border-gray-800/80 text-xs text-gray-400 space-y-2">
                  <div className="font-semibold text-white">Privacy Guarantee:</div>
                  <p>
                    All threat checks occur entirely locally on your device. Your visited URLs are never sent to external servers or telemetry collectors.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRIVACY & COOKIES */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-6">Privacy & Tracking Protection</h2>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Block Third-Party Tracking Cookies</div>
                    <div className="text-gray-500 text-[11px]">Stops third-party ad networks from reading or setting cross-site cookies.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.blockThirdPartyCookies}
                    onChange={(e) => handleUpdate({ blockThirdPartyCookies: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Strip URL Tracking Parameters</div>
                    <div className="text-gray-500 text-[11px]">Automatically strips utm_*, fbclid, gclid, and analytics tags.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.stripTrackingParams}
                    onChange={(e) => handleUpdate({ stripTrackingParams: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Send Do Not Track (DNT) & Global Privacy Control (GPC)</div>
                    <div className="text-gray-500 text-[11px]">Signals to servers that you opt out of data sharing and tracking.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sendDoNotTrack}
                    onChange={(e) => handleUpdate({ sendDoNotTrack: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4"
                  />
                </label>
              </div>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Clear Browsing Data</div>
                  <div className="text-xs text-gray-400">Clear cookies, cache, local history, and active sessions.</div>
                </div>
                <button
                  onClick={onOpenClearData}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-semibold transition"
                >
                  Clear Data...
                </button>
              </div>
            </div>
          )}

          {/* TAB: TOR ROUTE */}
          {activeTab === 'tor' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">NOVA Tor Route (Optional SOCKS5)</h2>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Route Browser Traffic through Tor SOCKS5 Proxy</div>
                    <div className="text-gray-500 text-[11px]">Directs HTTP/HTTPS requests through local Tor daemon.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableTorRouting}
                    onChange={(e) => handleUpdate({ enableTorRouting: e.target.checked })}
                    className="accent-amber-500 w-4 h-4"
                  />
                </label>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Tor SOCKS5 Port
                  </label>
                  <input
                    type="number"
                    value={settings.torSocksPort || 9050}
                    onChange={(e) => handleUpdate({ torSocksPort: parseInt(e.target.value) || 9050 })}
                    className="w-32 bg-[#0b0d14] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                  <span className="text-[11px] text-gray-500 ml-3">Default: 9050 (or 9150 for Tor Browser)</span>
                </div>

                <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-xl text-xs text-amber-300 space-y-1.5">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>Honest Architecture Disclosure:</span>
                  </div>
                  <p className="leading-relaxed">
                    When Tor routing is active, traffic and DNS requests route through the SOCKS5 proxy, and WebRTC non-proxied UDP is disabled to prevent IP leaks. However, Electron does not contain Tor Browser's specialized C++ browser fingerprinting resistance patches. For high-threat anonymity, the official Tor Browser is recommended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: IDENTITY PROFILES */}
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Identity Profiles</h2>
              <p className="text-xs text-gray-400">Keep work, personal, shopping, and research tabs completely isolated.</p>

              <div className="grid grid-cols-2 gap-4">
                {(settings.profiles || []).map((prof) => {
                  const isActive = settings.activeProfileId === prof.id;
                  return (
                    <div
                      key={prof.id}
                      onClick={async () => {
                        if (window.novaAPI?.switchProfile) {
                          const updated = await window.novaAPI.switchProfile(prof.id);
                          onUpdateSettings(updated);
                        }
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                        isActive
                          ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                          : 'bg-[#161926] border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{prof.icon}</span>
                        <div>
                          <div className="font-semibold text-sm text-white">{prof.name}</div>
                          <div className="text-[11px] text-gray-500">Isolated session partition</div>
                        </div>
                      </div>
                      {isActive && <CheckCircle size={16} className="text-purple-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: FOCUS & READING */}
          {activeTab === 'focus' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">NOVA Focus & Reader</h2>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <label className="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                  <div>
                    <div className="font-semibold text-white">Focus Mode Session</div>
                    <div className="text-gray-500 text-[11px]">Minimizes visual distractions and notification prompts.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.focusModeActive || false}
                    onChange={(e) => handleUpdate({ focusModeActive: e.target.checked })}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Focus Timer Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.focusDurationMinutes || 25}
                    onChange={(e) => handleUpdate({ focusDurationMinutes: parseInt(e.target.value) || 25 })}
                    className="w-24 bg-[#0b0d14] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Appearance & Theme</h2>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">Color Palette Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'dark', label: 'Dark Void', icon: Moon },
                    { key: 'light', label: 'Daylight', icon: Sun },
                    { key: 'system', label: 'System Default', icon: Laptop },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => handleUpdate({ theme: t.key as any })}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs transition ${
                        settings.theme === t.key
                          ? 'bg-purple-600/15 border-purple-500 text-white font-semibold'
                          : 'bg-[#0b0d14] border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <t.icon size={18} />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="text-center py-6">
                <NovaLogo size={64} className="mx-auto mb-3" />
                <h2 className="text-2xl font-extrabold text-white">NOVA Browser</h2>
                <p className="text-xs text-gray-400">Version 1.0.0 (Production Release)</p>
              </div>

              <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 text-xs text-gray-300 space-y-3 leading-relaxed">
                <div className="font-bold text-white text-sm">Our Privacy Manifesto</div>
                <p>
                  NOVA Browser was built on the fundamental principle that internet browsing should belong exclusively to you. The browser contains zero analytics code, zero telemetry, zero advertisements in the user interface, and zero third-party cloud synchronization.
                </p>
                <p>
                  All browsing history, cookies, bookmarks, settings, and encryption keys remain exclusively on your local device.
                </p>
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-gray-500">Source Repository:</span>
                  <a
                    href="https://github.com/Rajath-nayakk/nova-browser"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono"
                  >
                    github.com/Rajath-nayakk/nova-browser
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
