import { describe, it, expect } from 'vitest';
import {
  formatDownloadSpeed,
  formatEta,
  formatFileSize,
  calculateDownloadProgress,
} from '../../src/shared/downloadUtils';

describe('Download Controls & Formatters (downloadUtils)', () => {
  describe('formatDownloadSpeed', () => {
    it('returns 0 B/s for zero or negative or undefined speed', () => {
      expect(formatDownloadSpeed(0)).toBe('0 B/s');
      expect(formatDownloadSpeed(-50)).toBe('0 B/s');
      expect(formatDownloadSpeed(undefined)).toBe('0 B/s');
    });

    it('formats bytes per second', () => {
      expect(formatDownloadSpeed(512)).toBe('512 B/s');
    });

    it('formats kilobytes per second', () => {
      expect(formatDownloadSpeed(1024)).toBe('1.0 KB/s');
      expect(formatDownloadSpeed(500 * 1024)).toBe('500.0 KB/s');
    });

    it('formats megabytes per second', () => {
      expect(formatDownloadSpeed(2.5 * 1024 * 1024)).toBe('2.5 MB/s');
      expect(formatDownloadSpeed(10 * 1024 * 1024)).toBe('10.0 MB/s');
    });

    it('formats gigabytes per second', () => {
      expect(formatDownloadSpeed(1.2 * 1024 * 1024 * 1024)).toBe('1.2 GB/s');
    });
  });

  describe('formatEta', () => {
    it('returns -- for invalid or missing eta', () => {
      expect(formatEta(undefined)).toBe('--');
      expect(formatEta(-1)).toBe('--');
      expect(formatEta(Infinity)).toBe('--');
    });

    it('formats seconds left', () => {
      expect(formatEta(45)).toBe('45s left');
      expect(formatEta(0)).toBe('0s left');
    });

    it('formats minutes and seconds left', () => {
      expect(formatEta(125)).toBe('2m 5s left');
      expect(formatEta(60)).toBe('1m 0s left');
    });

    it('formats hours and minutes left', () => {
      expect(formatEta(3665)).toBe('1h 1m left');
      expect(formatEta(7200)).toBe('2h 0m left');
    });
  });

  describe('formatFileSize', () => {
    it('returns 0 B for 0 or negative bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(-100)).toBe('0 B');
    });

    it('formats sizes correctly across units', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(15 * 1024 * 1024)).toBe('15.0 MB');
      expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
    });
  });

  describe('calculateDownloadProgress', () => {
    it('returns 0 when total is 0 or negative', () => {
      expect(calculateDownloadProgress(50, 0)).toBe(0);
      expect(calculateDownloadProgress(50, -10)).toBe(0);
    });

    it('calculates correct percentages and bounds between 0 and 100', () => {
      expect(calculateDownloadProgress(50, 100)).toBe(50);
      expect(calculateDownloadProgress(250, 1000)).toBe(25);
      expect(calculateDownloadProgress(150, 100)).toBe(100);
      expect(calculateDownloadProgress(-10, 100)).toBe(0);
    });
  });
});
