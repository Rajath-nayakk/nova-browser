import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertTriangle, Star, Search, Globe, Shield, X } from 'lucide-react';
import { Bookmark, HistoryItem, Tab } from '@shared/types';
import { extractDomain, isHttpsUrl, isInternalUrl } from '@shared/validation';

interface AddressBarProps {
  activeTab?: Tab;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onToggleBookmark: (title: string, url: string) => void;
  isBookmarked: boolean;
}

export const AddressBar: React.FC<AddressBarProps> = ({
  activeTab,
  bookmarks,
  history,
  onNavigate,
  onToggleBookmark,
  isBookmarked,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUrl = activeTab?.url || '';
  const isInternal = isInternalUrl(currentUrl);
  const domain = extractDomain(currentUrl);
  const isSecure = activeTab ? isHttpsUrl(activeTab.url) && !activeTab.certError : false;

  // Sync address bar input with active tab URL when not focused
  useEffect(() => {
    if (!isFocused) {
      if (currentUrl === 'nova://newtab') {
        setInputValue('');
      } else {
        setInputValue(currentUrl);
      }
    }
  }, [currentUrl, isFocused]);

  // Handle global keyboard shortcuts like Ctrl+L
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter local bookmarks and history for autocompletion
  const suggestions = React.useMemo(() => {
    if (!isFocused || !inputValue.trim()) return [];
    const query = inputValue.toLowerCase().trim();

    const matchedBm = bookmarks
      .filter((b) => b.title.toLowerCase().includes(query) || b.url.toLowerCase().includes(query))
      .slice(0, 4)
      .map((b) => ({ type: 'bookmark' as const, title: b.title, url: b.url }));

    const matchedHist = history
      .filter((h) => h.title.toLowerCase().includes(query) || h.url.toLowerCase().includes(query))
      .slice(0, 4)
      .map((h) => ({ type: 'history' as const, title: h.title, url: h.url }));

    return [...matchedBm, ...matchedHist];
  }, [inputValue, isFocused, bookmarks, history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue.trim());
      inputRef.current?.blur();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        maxWidth: '820px',
      }}
    >
      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
        <div
          style={{
            height: '34px',
            borderRadius: 'var(--radius-full)',
            background: isFocused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
            border: `1px solid ${isFocused ? 'var(--border-focus)' : 'var(--border-color)'}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 10px',
            gap: '8px',
            boxShadow: isFocused ? '0 0 12px rgba(56, 189, 248, 0.2)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          {/* Connection Security Indicator */}
          {!isInternal && domain ? (
            <button
              type="button"
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                background: isSecure
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(239, 68, 68, 0.15)',
                color: isSecure ? 'var(--accent-green)' : 'var(--accent-red)',
                fontSize: '11px',
                fontWeight: 600,
              }}
              title={isSecure ? 'Secure Connection (HTTPS)' : 'Insecure Connection or Certificate Warning'}
            >
              {isSecure ? <Lock size={12} /> : <AlertTriangle size={12} />}
              <span>{isSecure ? 'Secure' : 'Not Secure'}</span>
            </button>
          ) : (
            <Search size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          )}

          {/* Omnibox Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            placeholder="Search with DuckDuckGo or enter address..."
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              inputRef.current?.select();
            }}
            onBlur={() => {
              // Delay blur slightly to allow clicking suggestions
              setTimeout(() => setIsFocused(false), 200);
            }}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
              letterSpacing: '0.2px',
            }}
          />

          {/* Clear input button when typing */}
          {inputValue && isFocused && (
            <button
              type="button"
              onClick={() => setInputValue('')}
              style={{
                color: 'var(--text-muted)',
                padding: '2px',
                borderRadius: '50%',
              }}
            >
              <X size={13} />
            </button>
          )}

          {/* Bookmark Button */}
          {!isInternal && currentUrl && (
            <button
              type="button"
              onClick={() => onToggleBookmark(activeTab?.title || domain, currentUrl)}
              style={{
                color: isBookmarked ? '#f59e0b' : 'var(--text-muted)',
                padding: '4px',
                borderRadius: '4px',
              }}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this tab (Ctrl+D)'}
            >
              <Star size={15} fill={isBookmarked ? '#f59e0b' : 'none'} />
            </button>
          )}
        </div>
      </form>

      {/* Security Certificate Info Popup */}
      {showSecurityInfo && !isInternal && (
        <div
          className="glass animate-fade-in"
          style={{
            position: 'absolute',
            top: '42px',
            left: 0,
            width: '320px',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            zIndex: 1000,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSecure ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSecure ? 'var(--accent-green)' : 'var(--accent-red)',
                }}
              >
                {isSecure ? <Lock size={15} /> : <AlertTriangle size={15} />}
              </div>
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600 }}>{domain || 'Website'}</h4>
                <p style={{ fontSize: '11px', color: isSecure ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                  {isSecure ? 'Connection is encrypted' : 'Connection is unencrypted'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSecurityInfo(false)}
              style={{ color: 'var(--text-muted)', padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {isSecure ? (
              <>
                <p>
                  Your information (passwords, credit cards, messages) is encrypted with TLS when sent to this site.
                </p>
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '11px',
                  }}
                >
                  <p><strong>Protocol:</strong> HTTPS</p>
                  <p><strong>Domain:</strong> {domain}</p>
                  <p><strong>Certificate:</strong> Valid TLS</p>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--accent-red)' }}>
                Warning: You should not enter sensitive info on this site (e.g. passwords or payment info) because it can be intercepted.
                {activeTab?.certError && (
                  <span style={{ display: 'block', marginTop: '6px', fontFamily: 'monospace' }}>
                    Reason: {activeTab.certError}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Local Suggestions Dropdown */}
      {isFocused && suggestions.length > 0 && (
        <div
          className="glass animate-fade-in"
          style={{
            position: 'absolute',
            top: '38px',
            left: 0,
            right: 0,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onMouseDown={() => {
                onNavigate(item.url);
                setIsFocused(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                cursor: 'pointer',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {item.type === 'bookmark' ? (
                <Star size={13} style={{ color: '#f59e0b', flexShrink: 0 }} fill="#f59e0b" />
              ) : (
                <Globe size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.url}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
