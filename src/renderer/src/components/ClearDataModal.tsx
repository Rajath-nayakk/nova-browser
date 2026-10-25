import React, { useState } from 'react';
import { Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ClearDataOptions } from '@shared/types';

interface ClearDataModalProps {
  onClose: () => void;
  onClear: (options: ClearDataOptions) => Promise<void>;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  onClose,
  onClear,
}) => {
  const [timeRange, setTimeRange] = useState<'15m' | '1h' | '24h' | '7d' | 'all'>('all');
  const [history, setHistory] = useState(true);
  const [cookies, setCookies] = useState(true);
  const [cache, setCache] = useState(true);
  const [storage, setStorage] = useState(true);
  const [downloads, setDownloads] = useState(true);
  const [permissions, setPermissions] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClear = async () => {
    setIsClearing(true);
    await onClear({
      timeRange,
      history,
      cookies,
      cache,
      storage,
      downloads,
      permissions,
    });
    setIsClearing(false);
    setClearedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cleardata-modal-title"
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '440px',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trash2 size={20} style={{ color: 'var(--accent-red)' }} />
            <h3 id="cleardata-modal-title" style={{ fontSize: '16px', fontWeight: 600 }}>Clear Browsing Data</h3>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '2px' }} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>

        {/* Time Range Selector */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Time range:
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Checkbox Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={history}
              onChange={(e) => setHistory(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>Browsing History</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                Clears visited URLs from local history and search address bar suggestions
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cookies}
              onChange={(e) => setCookies(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>Cookies and Site Data</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                Signs you out of most websites and removes tracking cookies
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={cache}
              onChange={(e) => setCache(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>Cached Images and Files</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                Frees up local storage space; some sites may load slower next visit
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={storage}
              onChange={(e) => setStorage(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>Website Local Storage & IndexedDB</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                Removes offline data stored by web applications
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={downloads}
              onChange={(e) => setDownloads(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>Download History</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                Clears download records (does not delete files already on disk)
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={permissions}
              onChange={(e) => setPermissions(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
            />
            <div>
              <div style={{ fontWeight: 500 }}>Saved Site Permissions</div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                Resets all camera, microphone, and location permissions granted to sites
              </div>
            </div>
          </label>
        </div>

        {/* Transparency notice */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-faint)',
            background: 'var(--bg-surface-elevated)',
            padding: '8px 10px',
            borderRadius: '6px',
            marginBottom: '16px',
            lineHeight: '1.4',
          }}
        >
          Notice: Clearing browsing data removes client copies stored on your computer. It cannot alter logs kept by remote websites, ISPs, or network routers.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {clearedSuccess ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-green)', fontSize: '13px' }}>
              <CheckCircle size={16} />
              <span>Data cleared successfully!</span>
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isClearing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-red)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  opacity: isClearing ? 0.7 : 1,
                }}
              >
                {isClearing ? 'Clearing...' : 'Clear Data'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
