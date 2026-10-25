import React, { useState, useRef } from 'react';
import { Bookmark as BookmarkIcon, Search, Plus, Trash2, Edit2, ExternalLink, Globe, Download, Upload } from 'lucide-react';
import { Bookmark } from '@shared/types';
import { exportBookmarksToHtml, parseBookmarksFromHtml } from '@shared/bookmarkParser';
import { useToast } from '../components/Toast';

interface BookmarksViewProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onAddBookmark: (title: string, url: string) => void;
  onRemoveBookmark: (id: string) => void;
  onUpdateBookmark: (id: string, updates: Partial<Bookmark>) => void;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  bookmarks,
  onNavigate,
  onAddBookmark,
  onRemoveBookmark,
  onUpdateBookmark,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportHtml = () => {
    if (bookmarks.length === 0) {
      showToast('No bookmarks to export', 'warning');
      return;
    }
    const htmlContent = exportBookmarksToHtml(bookmarks);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `nova_bookmarks_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
    showToast(`Exported ${bookmarks.length} bookmarks to Netscape HTML`, 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseBookmarksFromHtml(content);
      if (parsed.count === 0) {
        showToast('No valid bookmarks found in HTML file', 'warning');
        return;
      }
      parsed.bookmarks.forEach((bm) => {
        onAddBookmark(bm.title, bm.url);
      });
      showToast(`Successfully imported ${parsed.count} bookmarks`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.url.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editingId) {
      onUpdateBookmark(editingId, { title: title.trim(), url: finalUrl });
    } else {
      onAddBookmark(title.trim(), finalUrl);
    }

    setTitle('');
    setUrl('');
    setEditingId(null);
    setShowAddModal(false);
  };

  const startEdit = (bm: Bookmark) => {
    setEditingId(bm.id);
    setTitle(bm.title);
    setUrl(bm.url);
    setShowAddModal(true);
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg-app)',
        padding: '36px 48px',
      }}
    >
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <BookmarkIcon size={20} fill="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Bookmarks</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {bookmarks.length} saved bookmarks (Stored locally)
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".html,.htm"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Import Bookmarks from Netscape HTML"
              aria-label="Import HTML"
            >
              <Upload size={14} />
              <span>Import HTML</span>
            </button>

            <button
              onClick={handleExportHtml}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Export Bookmarks to Netscape HTML"
              aria-label="Export HTML"
            >
              <Download size={14} />
              <span>Export HTML</span>
            </button>

            <button
              onClick={() => {
                setEditingId(null);
                setTitle('');
                setUrl('');
                setShowAddModal(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)',
                color: '#000000',
                fontWeight: 600,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={15} />
              <span>Add Bookmark</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div
          style={{
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            gap: '10px',
            marginBottom: '20px',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
            }}
          />
        </div>

        {/* Bookmarks List */}
        {filteredBookmarks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--text-faint)',
              fontSize: '13px',
            }}
          >
            {search ? 'No bookmarks match your search' : 'No bookmarks saved yet'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredBookmarks.map((bm) => (
              <div
                key={bm.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div
                  onClick={() => onNavigate(bm.url)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: 1,
                    minWidth: 0,
                    cursor: 'pointer',
                  }}
                >
                  {bm.favicon ? (
                    <img
                      src={bm.favicon}
                      alt=""
                      style={{ width: '18px', height: '18px', borderRadius: '3px' }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {bm.title}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-faint)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {bm.url}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => startEdit(bm)}
                    style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-muted)' }}
                    title="Edit bookmark"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bm.id)}
                    style={{ padding: '6px', borderRadius: '4px', color: 'var(--accent-red)' }}
                    title="Delete bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
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
            zIndex: 1000,
          }}
        >
          <div
            className="glass animate-fade-in"
            style={{
              width: '380px',
              padding: '22px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
              {editingId ? 'Edit Bookmark' : 'Add Bookmark'}
            </h3>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Website Name"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    fontSize: '12px',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
