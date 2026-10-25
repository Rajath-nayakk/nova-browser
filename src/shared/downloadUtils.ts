/**
 * Utility functions for formatting download speed, ETA, and progress.
 */

export function formatDownloadSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 B/s';
  if (bytesPerSec >= 1024 * 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
  }
  if (bytesPerSec >= 1024 * 1024) {
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  if (bytesPerSec >= 1024) {
    return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  }
  return `${Math.round(bytesPerSec)} B/s`;
}

export function formatEta(seconds?: number): string {
  if (seconds === undefined || seconds === null || seconds < 0 || !isFinite(seconds)) {
    return '--';
  }
  if (seconds < 60) {
    return `${Math.round(seconds)}s left`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s left`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m left`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const unitIndex = Math.min(i, units.length - 1);
  const size = bytes / Math.pow(1024, unitIndex);
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function calculateDownloadProgress(received: number, total: number): number {
  if (!total || total <= 0) return 0;
  const pct = (received / total) * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}
