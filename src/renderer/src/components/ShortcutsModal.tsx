import React, { useState, useEffect } from 'react';
import { Keyboard, Search, X, Command } from 'lucide-react';

interface ShortcutDefinition {
  keys: string[];
  description: string;
  category: 'Tabs & Windows' | 'Navigation' | 'Page & Zoom' | 'Tools & Security';
}

const SHORTCUTS_DATA: ShortcutDefinition[] = [
  // Tabs & Windows
  { keys: ['Ctrl', 'T'], description: 'Open a new tab', category: 'Tabs & Windows' },
  { keys: ['Ctrl', 'W'], description: 'Close current tab', category: 'Tabs & Windows' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Reopen last closed tab', category: 'Tabs & Windows' },
  { keys: ['Ctrl', 'Shift', 'N'], description: 'Open new private browsing window', category: 'Tabs & Windows' },
  { keys: ['Ctrl', '1 - 8'], description: 'Switch to tab 1 through 8', category: 'Tabs & Windows' },
  { keys: ['Ctrl', '9'], description: 'Switch to the last tab', category: 'Tabs & Windows' },

  // Navigation
  { keys: ['Alt', '←'], description: 'Go back to previous page', category: 'Navigation' },
  { keys: ['Alt', '→'], description: 'Go forward to next page', category: 'Navigation' },
  { keys: ['Ctrl', 'R'], description: 'Reload current tab', category: 'Navigation' },
  { keys: ['Ctrl', 'L'], description: 'Focus address bar', category: 'Navigation' },
  { keys: ['Ctrl', 'D'], description: 'Bookmark current page', category: 'Navigation' },

  // Page & Zoom
  { keys: ['Ctrl', '+'], description: 'Zoom in (+10%)', category: 'Page & Zoom' },
  { keys: ['Ctrl', '-'], description: 'Zoom out (-10%)', category: 'Page & Zoom' },
  { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%', category: 'Page & Zoom' },
  { keys: ['Ctrl', 'F'], description: 'Find in page', category: 'Page & Zoom' },
  { keys: ['Esc'], description: 'Close find in page / dialogs', category: 'Page & Zoom' },

  // Tools & Security
  { keys: ['Ctrl', 'H'], description: 'Open Browsing History', category: 'Tools & Security' },
  { keys: ['Ctrl', 'J'], description: 'Open Downloads Manager', category: 'Tools & Security' },
  { keys: ['Ctrl', 'B'], description: 'Toggle Bookmarks Toolbar', category: 'Tools & Security' },
  { keys: ['Ctrl', '/'], description: 'Toggle Keyboard Shortcuts Cheat Sheet', category: 'Tools & Security' },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = ['all', 'Tabs & Windows', 'Navigation', 'Page & Zoom', 'Tools & Security'];

  const filtered = SHORTCUTS_DATA.filter((s) => {
    const matchesCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '680px',
          maxHeight: '85vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Keyboard size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Keyboard Shortcuts</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Press <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>Ctrl</kbd> + <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)' }}>/</kbd> to toggle anytime
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter bar */}
        <div style={{ padding: '14px 24px 8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '8px',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-faint)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts..."
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '11px',
                  fontWeight: 500,
                  background: selectedCategory === cat ? 'var(--accent)' : 'var(--bg-surface-elevated)',
                  color: selectedCategory === cat ? '#000000' : 'var(--text-muted)',
                  border: `1px solid ${selectedCategory === cat ? 'var(--accent)' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat === 'all' ? 'All Shortcuts' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-faint)', fontSize: '13px' }}>
              No shortcuts found matching &quot;{search}&quot;
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
                      {item.description}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '10px',
                        color: 'var(--text-faint)',
                        marginTop: '2px',
                      }}
                    >
                      {item.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        {kIdx > 0 && <span style={{ color: 'var(--text-faint)', fontSize: '11px' }}>+</span>}
                        <kbd
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--accent)',
                          }}
                        >
                          {k}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
