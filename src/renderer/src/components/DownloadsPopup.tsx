import React from 'react';
import { Download, Folder, File, CheckCircle2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { DownloadItem } from '@shared/types';

interface DownloadsPopupProps {
  downloads: DownloadItem[];
  onClose: () => void;
  onOpenFolder: (filePath: string) => void;
  onOpenFile: (filePath: string) => void;
  onOpenDownloadsPage: () => void;
}

export const DownloadsPopup: React.FC<DownloadsPopupProps> = ({
  downloads,
  onClose,
  onOpenFolder,
  onOpenFile,
  onOpenDownloadsPage,
}) => {
  const recentDownloads = downloads.slice(0, 5);

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div
      className="glass animate-fade-in"
      style={{
        position: 'absolute',
        top: '46px',
        right: '60px',
        width: '320px',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        zIndex: 1000,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={15} style={{ color: 'var(--accent)' }} />
          <h4 style={{ fontSize: '13px', fontWeight: 600 }}>Downloads</h4>
        </div>
        <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '2px' }}>
          <X size={14} />
        </button>
      </div>

      {recentDownloads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-faint)', fontSize: '12px' }}>
          No recent downloads
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentDownloads.map((dl) => {
            const isCompleted = dl.state === 'completed';
            const isProgressing = dl.state === 'progressing';
            const progress = dl.totalBytes > 0 ? (dl.receivedBytes / dl.totalBytes) * 100 : 0;

            return (
              <div
                key={dl.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div style={{ color: isCompleted ? 'var(--accent-green)' : 'var(--accent)' }}>
                  <File size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={dl.filename}
                  >
                    {dl.filename}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {formatBytes(dl.receivedBytes)}
                    {dl.totalBytes > 0 && ` / ${formatBytes(dl.totalBytes)}`}
                    {` • ${dl.state}`}
                  </div>
                  {isProgressing && (
                    <div
                      style={{
                        height: '3px',
                        background: 'var(--border-color)',
                        borderRadius: '2px',
                        marginTop: '4px',
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

                {isCompleted && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onOpenFolder(dl.savePath)}
                      style={{ padding: '4px', color: 'var(--text-muted)' }}
                      title="Show in folder"
                    >
                      <Folder size={14} />
                    </button>
                    <button
                      onClick={() => onOpenFile(dl.savePath)}
                      style={{ padding: '4px', color: 'var(--text-muted)' }}
                      title="Open file"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => {
          onOpenDownloadsPage();
          onClose();
        }}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          color: 'var(--accent)',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        View All Downloads
      </button>
    </div>
  );
};
