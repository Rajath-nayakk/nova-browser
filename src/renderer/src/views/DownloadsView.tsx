import React, { useState } from 'react';
import { Download, Folder, File, ExternalLink, Trash2, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { DownloadItem } from '@shared/types';
import { isExecutableFile } from '@shared/validation';

interface DownloadsViewProps {
  downloads: DownloadItem[];
  onOpenFolder: (filePath: string) => void;
  onOpenFile: (filePath: string) => void;
  onClearDownloads: () => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  onOpenFolder,
  onOpenFile,
  onClearDownloads,
}) => {
  const [search, setSearch] = useState('');

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filtered = downloads.filter((d) =>
    d.filename.toLowerCase().includes(search.toLowerCase()) ||
    d.url.toLowerCase().includes(search.toLowerCase())
  );

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
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)',
              }}
            >
              <Download size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Downloads</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {downloads.length} files downloaded
              </p>
            </div>
          </div>

          {downloads.length > 0 && (
            <button
              onClick={onClearDownloads}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-main)',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={13} />
              <span>Clear List</span>
            </button>
          )}
        </div>

        {/* Search */}
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
            placeholder="Search downloads..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '13px',
              color: 'var(--text-main)',
            }}
          />
        </div>

        {/* Safety Note */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontSize: '12px',
            lineHeight: '1.4',
            marginBottom: '20px',
          }}
        >
          <strong>Security Notice:</strong> NOVA never silently executes downloaded files. For your safety, always verify the source of executable programs before opening them.
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: 'var(--text-faint)',
              fontSize: '13px',
            }}
          >
            {search ? 'No downloads match your search' : 'No downloads yet'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((dl) => {
              const isExec = isExecutableFile(dl.filename);
              const isCompleted = dl.state === 'completed';
              const isProgressing = dl.state === 'progressing';
              const progress = dl.totalBytes > 0 ? (dl.receivedBytes / dl.totalBytes) * 100 : 0;

              return (
                <div
                  key={dl.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: isExec
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isCompleted
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isExec
                          ? 'var(--accent-red)'
                          : isCompleted
                          ? 'var(--accent-green)'
                          : 'var(--accent)',
                      }}
                    >
                      {isExec ? <AlertTriangle size={18} /> : <File size={18} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'var(--text-main)',
                        }}
                      >
                        {dl.filename}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                        {formatBytes(dl.receivedBytes)}
                        {dl.totalBytes > 0 && ` of ${formatBytes(dl.totalBytes)}`}
                        {` • ${dl.state}`}
                        {isExec && <span style={{ color: 'var(--accent-red)', marginLeft: '6px' }}>[Executable File]</span>}
                      </div>

                      {isProgressing && (
                        <div
                          style={{
                            height: '4px',
                            background: 'var(--bg-surface-elevated)',
                            borderRadius: '2px',
                            marginTop: '6px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: 'var(--accent)',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onOpenFolder(dl.savePath)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                      title="Show in File Explorer"
                    >
                      <Folder size={14} />
                      <span>Show in folder</span>
                    </button>

                    {isCompleted && !isExec && (
                      <button
                        onClick={() => onOpenFile(dl.savePath)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--accent)',
                          color: '#000000',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <ExternalLink size={14} />
                        <span>Open</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
