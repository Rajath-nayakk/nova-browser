import React from 'react';
import { Star, Globe, Plus, Folder } from 'lucide-react';
import { Bookmark } from '@shared/types';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onOpenBookmarksManager: () => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onOpenBookmarksManager,
}) => {
  return (
    <div
      style={{
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '4px',
        background: 'var(--bg-topbar)',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
        overflowY: 'hidden',
        fontSize: '12px',
      }}
    >
      {bookmarks.slice(0, 12).map((bm) => (
        <button
          key={bm.id}
          onClick={() => onNavigate(bm.url)}
          style={{
            height: '24px',
            padding: '0 8px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-main)',
            whiteSpace: 'nowrap',
            maxWidth: '180px',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title={`${bm.title}\n${bm.url}`}
        >
          {bm.favicon ? (
            <img
              src={bm.favicon}
              alt=""
              style={{ width: '13px', height: '13px', borderRadius: '2px' }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <Globe size={13} style={{ color: 'var(--text-muted)' }} />
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {bm.title}
          </span>
        </button>
      ))}

      <button
        onClick={onOpenBookmarksManager}
        style={{
          height: '24px',
          padding: '0 6px',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-faint)',
          marginLeft: 'auto',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
        title="Manage all bookmarks"
      >
        <Star size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />
        <span>All Bookmarks</span>
      </button>
    </div>
  );
};
