import React, { useState } from 'react';
import {
  Download,
  Folder,
  File,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Hash,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
  Pause,
  Play,
  X,
} from 'lucide-react';
import { DownloadItem, FileChecksumResult } from '@shared/types';
import { analyzeFileRisk, isExecutableFile } from '@shared/validation';
import { formatDownloadSpeed, formatEta } from '@shared/downloadUtils';

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
  const [filterType, setFilterType] = useState<'all' | 'executables' | 'completed'>('all');
  const [hashState, setHashState] = useState<Record<string, { loading?: boolean; result?: FileChecksumResult }>>({});
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleComputeHash = async (dl: DownloadItem) => {
    if (!window.novaAPI?.computeFileChecksum) return;
    setHashState((prev) => ({
      ...prev,
      [dl.id]: { loading: true },
    }));

    try {
      const res = await window.novaAPI.computeFileChecksum(dl.savePath, 'sha256');
      setHashState((prev) => ({
        ...prev,
        [dl.id]: { loading: false, result: res },
      }));
    } catch (err: any) {
      setHashState((prev) => ({
        ...prev,
        [dl.id]: { loading: false, result: { filePath: dl.savePath, error: err?.message || 'Calculation error' } },
      }));
    }
  };

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => {
      setCopiedHashId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const handlePause = async (id: string) => {
    await window.novaAPI?.pauseDownload(id);
  };

  const handleResume = async (id: string) => {
    await window.novaAPI?.resumeDownload(id);
  };

  const handleCancel = async (id: string) => {
    await window.novaAPI?.cancelDownload(id);
  };

  const filtered = downloads.filter((d) => {
    const matchesSearch =
      d.filename.toLowerCase().includes(search.toLowerCase()) ||
      d.url.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === 'executables') {
      return isExecutableFile(d.filename);
    }
    if (filterType === 'completed') {
      return d.state === 'completed';
    }
    return true;
  });

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

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {(['all', 'completed', 'executables'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterType(mode)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 500,
                background: filterType === mode ? 'var(--accent)' : 'var(--bg-surface)',
                color: filterType === mode ? '#000000' : 'var(--text-muted)',
                border: `1px solid ${filterType === mode ? 'var(--accent)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode === 'all' && 'All Downloads'}
              {mode === 'completed' && 'Completed'}
              {mode === 'executables' && 'Executables & Scripts'}
            </button>
          ))}
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
            {search ? 'No downloads match your search' : 'No downloads in this view'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((dl) => {
              const risk = analyzeFileRisk(dl.filename);
              const isExec = risk.isDangerous;
              const isCompleted = dl.state === 'completed';
              const isProgressing = dl.state === 'progressing';
              const progress = dl.totalBytes > 0 ? (dl.receivedBytes / dl.totalBytes) * 100 : 0;
              const currentHash = hashState[dl.id];

              return (
                <div
                  key={dl.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: `1px solid ${isExec ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
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
                          flexShrink: 0,
                        }}
                      >
                        {isExec ? <AlertTriangle size={20} /> : <File size={20} />}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{dl.filename}</span>
                          {isExec && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: 'var(--accent-red)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                              }}
                            >
                              Executable
                            </span>
                          )}
                          {risk.category === 'archive' && (
                            <span
                              style={{
                                fontSize: '10px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(56, 189, 248, 0.2)',
                                color: 'var(--accent)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                              }}
                            >
                              Archive
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px' }}>
                          {formatBytes(dl.receivedBytes)}
                          {dl.totalBytes > 0 && ` of ${formatBytes(dl.totalBytes)}`}
                          {` • `}
                          <span
                            style={{
                              textTransform: 'capitalize',
                              fontWeight: dl.state === 'progressing' || dl.state === 'paused' ? 600 : 400,
                              color:
                                dl.state === 'completed'
                                  ? 'var(--accent-green)'
                                  : dl.state === 'paused'
                                  ? 'var(--accent-amber)'
                                  : dl.state === 'cancelled' || dl.state === 'interrupted'
                                  ? 'var(--accent-red)'
                                  : 'var(--accent)',
                            }}
                          >
                            {dl.state}
                          </span>
                          {dl.state === 'progressing' && dl.speed !== undefined && dl.speed > 0 && (
                            <>
                              {` • `}
                              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                {formatDownloadSpeed(dl.speed)}
                              </span>
                            </>
                          )}
                          {dl.state === 'progressing' && dl.etaSeconds !== undefined && dl.etaSeconds > 0 && (
                            <>
                              {` • `}
                              <span>ETA: {formatEta(dl.etaSeconds)}</span>
                            </>
                          )}
                        </div>

                        {(isProgressing || dl.state === 'paused') && (
                          <div
                            style={{
                              height: '4px',
                              background: 'var(--bg-surface-elevated)',
                              borderRadius: '2px',
                              marginTop: '8px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${progress}%`,
                                background: dl.state === 'paused' ? 'var(--accent-amber)' : 'var(--accent)',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {dl.state === 'progressing' && (
                        <button
                          onClick={() => handlePause(dl.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-surface-elevated)',
                            color: 'var(--text-main)',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Pause Download"
                        >
                          <Pause size={13} />
                          <span>Pause</span>
                        </button>
                      )}

                      {dl.state === 'paused' && (
                        <button
                          onClick={() => handleResume(dl.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--accent)',
                            color: '#000000',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Resume Download"
                        >
                          <Play size={13} />
                          <span>Resume</span>
                        </button>
                      )}

                      {(dl.state === 'progressing' || dl.state === 'paused') && (
                        <button
                          onClick={() => handleCancel(dl.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: 'var(--accent-red)',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Cancel Download"
                        >
                          <X size={13} />
                          <span>Cancel</span>
                        </button>
                      )}
                      {isCompleted && (
                        <button
                          onClick={() => handleComputeHash(dl)}
                          disabled={currentHash?.loading}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-surface-elevated)',
                            color: 'var(--text-main)',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: currentHash?.loading ? 'wait' : 'pointer',
                          }}
                          title="Calculate SHA-256 integrity checksum"
                        >
                          {currentHash?.loading ? (
                            <Loader2 size={13} className="spin-animation" />
                          ) : (
                            <Hash size={13} />
                          )}
                          <span>SHA-256</span>
                        </button>
                      )}

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
                        <span>Folder</span>
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

                  {/* Warning banner for dangerous files */}
                  {risk.warning && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: 'var(--accent-red)',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                      <span>{risk.warning}</span>
                    </div>
                  )}

                  {/* Checksum Result Panel */}
                  {currentHash?.result && (
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        fontSize: '11px',
                      }}
                    >
                      {currentHash.result.error ? (
                        <span style={{ color: 'var(--accent-red)' }}>
                          Checksum error: {currentHash.result.error}
                        </span>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <span style={{ color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>
                              {currentHash.result.algorithm || 'SHA-256'}:
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                color: 'var(--text-main)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {currentHash.result.hash}
                            </span>
                          </div>
                          {currentHash.result.hash && (
                            <button
                              onClick={() => handleCopyHash(dl.id, currentHash.result!.hash!)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: copiedHashId === dl.id ? 'var(--accent-green)' : 'var(--bg-surface)',
                                color: copiedHashId === dl.id ? '#ffffff' : 'var(--text-main)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                border: '1px solid var(--border-color)',
                                flexShrink: 0,
                                cursor: 'pointer',
                              }}
                            >
                              {copiedHashId === dl.id ? <Check size={12} /> : <Copy size={12} />}
                              <span>{copiedHashId === dl.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
