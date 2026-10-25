import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { FindInPageResult } from '@shared/types';

interface FindInPageBarProps {
  onFind: (text: string, forward?: boolean, findNext?: boolean) => void;
  onClose: () => void;
  result?: FindInPageResult;
}

export const FindInPageBar: React.FC<FindInPageBarProps> = ({
  onFind,
  onClose,
  result,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
      onFind(val.trim(), true, false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onFind(text.trim(), !e.shiftKey, true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="glass animate-fade-in"
      style={{
        position: 'absolute',
        top: '90px',
        right: '24px',
        borderRadius: 'var(--radius-md)',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        zIndex: 500,
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-color)',
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        placeholder="Find on page..."
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        style={{
          width: '180px',
          height: '26px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0 8px',
          fontSize: '12px',
          color: 'var(--text-main)',
        }}
      />

      {text && result && (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '45px' }}>
          {result.matches > 0
            ? `${result.activeMatchOrdinal} of ${result.matches}`
            : '0 / 0'}
        </span>
      )}

      <button
        onClick={() => onFind(text.trim(), false, true)}
        style={{ padding: '3px', borderRadius: '4px', color: 'var(--text-muted)' }}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp size={14} />
      </button>

      <button
        onClick={() => onFind(text.trim(), true, true)}
        style={{ padding: '3px', borderRadius: '4px', color: 'var(--text-muted)' }}
        title="Next match (Enter)"
      >
        <ChevronDown size={14} />
      </button>

      <button
        onClick={onClose}
        style={{ padding: '3px', borderRadius: '4px', color: 'var(--text-muted)' }}
        title="Close (Esc)"
      >
        <X size={14} />
      </button>
    </div>
  );
};
