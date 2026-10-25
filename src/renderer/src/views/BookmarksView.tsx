import React, { useState, useRef } from 'react';
import {
  Bookmark as BookmarkIcon,
  Search,
  Plus,
  Trash2,
  Edit2,
  Globe,
  Download,
  Upload,
  Folder,
  FolderPlus,
  FolderMinus,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Bookmark } from '@shared/types';
import { exportBookmarksToHtml, parseBookmarksFromHtml } from '@shared/bookmarkParser';
import {
  ALL_BOOKMARKS_FOLDER,
  ROOT_FOLDER,
  getUniqueFolders,
  getFolderBookmarkCounts,
  filterBookmarksByFolder,
} from '@shared/bookmarkFolderUtils';
import { useToast } from '../components/Toast';

interface BookmarksViewProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onAddBookmark: (title: string, url: string, folder?: string) => void;
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
  const [activeFolder, setActiveFolder] = useState<string>(ALL_BOOKMARKS_FOLDER);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingFolders = getUniqueFolders(bookmarks);
  const folderCounts = getFolderBookmarkCounts(bookmarks);

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
        onAddBookmark(bm.title, bm.url, bm.folder);
      });
      showToast(`Successfully imported ${parsed.count} bookmarks`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const folderFiltered = filterBookmarksByFolder(bookmarks, activeFolder);
  const filteredBookmarks = folderFiltered.filter(
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

    const folderVal = selectedFolder.trim() || undefined;

    if (editingId) {
      onUpdateBookmark(editingId, { title: title.trim(), url: finalUrl, folder: folderVal });
      showToast('Bookmark updated', 'success');
    } else {
      onAddBookmark(title.trim(), finalUrl, folderVal);
      showToast('Bookmark saved', 'success');
    }

    setTitle('');
    setUrl('');
    setSelectedFolder('');
    setEditingId(null);
    setShowAddModal(false);
  };

  const startEdit = (bm: Bookmark) => {
    setEditingId(bm.id);
    setTitle(bm.title);
    setUrl(bm.url);
    setSelectedFolder(bm.folder || '');
    setShowAddModal(true);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    setActiveFolder(trimmed);
    setSelectedFolder(trimmed);
    setNewFolderName('');
    setShowNewFolderModal(false);
    showToast(`Created folder "${trimmed}"`, 'success');
  };

  const handleDeleteFolder = (folderToDelete: string) => {
    const affected = bookmarks.filter((b) => b.folder?.trim() === folderToDelete.trim());
    if (affected.length === 0) return;

    if (
      window.confirm(
        `Remove folder "${folderToDelete}"? ${affected.length} bookmarks will move to Unsorted.`
      )
    ) {
      affected.forEach((b) => {
        onUpdateBookmark(b.id, { folder: undefined });
      });
      if (activeFolder === folderToDelete) {
        setActiveFolder(ALL_BOOKMARKS_FOLDER);
      }
      showToast(`Removed folder "${folderToDelete}"`, 'info');
    }
  };

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '24px 36px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
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
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Bookmarks Manager</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {bookmarks.length} bookmarks across {existingFolders.length} folders
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
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Import Bookmarks from Netscape HTML"
            aria-label="Import HTML"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>

          <button
            onClick={handleExportHtml}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Export Bookmarks to Netscape HTML"
            aria-label="Export HTML"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          <button
            onClick={() => setShowNewFolderModal(true)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Create New Bookmark Folder"
          >
            <FolderPlus size={14} />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              setTitle('');
              setUrl('');
              setSelectedFolder(activeFolder !== ALL_BOOKMARKS_FOLDER && activeFolder !== ROOT_FOLDER ? activeFolder : '');
              setShowAddModal(true);
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#000000',
              fontWeight: 600,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            <Plus size={15} />
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>

      {/* Main Content: Sidebar + Bookmarks List */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Sidebar: Folders */}
        <div
          style={{
            width: '240px',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-color)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '0 8px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Folders
          </div>

          <button
            onClick={() => setActiveFolder(ALL_BOOKMARKS_FOLDER)}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: activeFolder === ALL_BOOKMARKS_FOLDER ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeFolder === ALL_BOOKMARKS_FOLDER ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeFolder === ALL_BOOKMARKS_FOLDER ? 600 : 400,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={14} className="text-amber-400" />
              <span>All Bookmarks</span>
            </div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{folderCounts[ALL_BOOKMARKS_FOLDER] || 0}</span>
          </button>

          <button
            onClick={() => setActiveFolder(ROOT_FOLDER)}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: activeFolder === ROOT_FOLDER ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeFolder === ROOT_FOLDER ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeFolder === ROOT_FOLDER ? 600 : 400,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Folder size={14} style={{ opacity: 0.6 }} />
              <span>Unsorted</span>
            </div>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>{folderCounts[ROOT_FOLDER] || 0}</span>
          </button>

          {existingFolders.length > 0 && (
            <div style={{ height: '1px', background: 'var(--border-color)', margin: '8px 0' }} />
          )}

          {existingFolders.map((fName) => (
            <div
              key={fName}
              style={{
                borderRadius: 'var(--radius-sm)',
                background: activeFolder === fName ? 'var(--bg-surface-elevated)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
              }}
            >
              <button
                onClick={() => setActiveFolder(fName)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: activeFolder === fName ? 'var(--text-main)' : 'var(--text-muted)',
                  fontWeight: activeFolder === fName ? 600 : 400,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '4px',
                  overflow: 'hidden',
                }}
              >
                <Folder size={14} className="text-amber-400 shrink-0" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {fName}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>{folderCounts[fName] || 0}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(fName);
                  }}
                  style={{
                    padding: '2px 4px',
                    borderRadius: '3px',
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title={`Delete folder "${fName}"`}
                >
                  <FolderMinus size={12} className="hover:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 36px' }}>
          {/* Search bar */}
          <div
            style={{
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              gap: '10px',
              marginBottom: '18px',
            }}
          >
            <Search size={15} style={{ color: 'var(--text-faint)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search in ${activeFolder === ALL_BOOKMARKS_FOLDER ? 'all bookmarks' : activeFolder}...`}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
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
              {search
                ? 'No bookmarks match your search'
                : activeFolder === ALL_BOOKMARKS_FOLDER
                ? 'No bookmarks saved yet. Click "Add Bookmark" above.'
                : `No bookmarks in folder "${activeFolder}"`}
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
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>{bm.title}</span>
                        {bm.folder && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFolder(bm.folder!);
                            }}
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.25)',
                              cursor: 'pointer',
                            }}
                          >
                            {bm.folder}
                          </span>
                        )}
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
                      style={{ padding: '6px', borderRadius: '4px', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      title="Edit bookmark"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => onRemoveBookmark(bm.id)}
                      style={{ padding: '6px', borderRadius: '4px', color: 'var(--accent-red)', background: 'transparent', border: 'none', cursor: 'pointer' }}
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
      </div>

      {/* Add / Edit Bookmark Modal */}
      {showAddModal && (
        <div
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
            zIndex: 1000,
          }}
        >
          <div
            className="glass animate-fade-in"
            style={{
              width: '400px',
              padding: '24px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
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
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
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
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Folder (Optional)
                </label>
                <input
                  type="text"
                  list="bookmark-folders-list"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  placeholder="Select or enter folder name (e.g. Work, Tech)"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                  }}
                />
                <datalist id="bookmark-folders-list">
                  {existingFolders.map((f) => (
                    <option key={f} value={f} />
                  ))}
                </datalist>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '7px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--accent)',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div
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
            zIndex: 1000,
          }}
        >
          <div
            className="glass animate-fade-in"
            style={{
              width: '360px',
              padding: '22px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px' }}>
              Create New Folder
            </h3>
            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Work, Research, Reading"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '12px',
                    cursor: 'pointer',
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
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
