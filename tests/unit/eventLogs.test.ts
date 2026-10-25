import { describe, it, expect, beforeEach } from 'vitest';
import { DiagnosticLogger } from '../../src/main/diagnosticLogger';

describe('DiagnosticLogger (Security Event Logs)', () => {
  let logger: DiagnosticLogger;

  beforeEach(() => {
    logger = new DiagnosticLogger(10);
  });

  it('records diagnostic log entry with ID and timestamp', () => {
    const entry = logger.log('threat', 'sentinel', 'Phishing URL detected', {
      url: 'https://evil-login.com',
    });

    expect(entry).toBeDefined();
    expect(entry.id).toMatch(/^log_/);
    expect(entry.level).toBe('threat');
    expect(entry.category).toBe('sentinel');
    expect(entry.message).toBe('Phishing URL detected');
    expect(entry.details?.url).toBe('https://evil-login.com');
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it('calculates summary counts across levels and categories', () => {
    logger.log('threat', 'sentinel', 'Malware blocked');
    logger.log('info', 'shield', 'Ad request blocked');
    logger.log('info', 'shield', 'Tracker request blocked');
    logger.log('warning', 'tls', 'Expired certificate detected');
    logger.log('info', 'permission', 'Camera access allowed');

    const summary = logger.getSummary();
    expect(summary.total).toBe(5);
    expect(summary.byLevel.threat).toBe(1);
    expect(summary.byLevel.info).toBe(3);
    expect(summary.byLevel.warning).toBe(1);
    expect(summary.byCategory.sentinel).toBe(1);
    expect(summary.byCategory.shield).toBe(2);
    expect(summary.byCategory.tls).toBe(1);
    expect(summary.byCategory.permission).toBe(1);
  });

  it('filters logs by category, level, and keyword search', () => {
    logger.log('threat', 'sentinel', 'Phishing scam domain', { host: 'scam.xyz' });
    logger.log('info', 'shield', 'Doubleclick ad banner', { host: 'doubleclick.net' });
    logger.log('warning', 'tls', 'Self-signed TLS certificate', { host: 'internal.dev' });

    // Category filter
    const shieldLogs = logger.getLogs({ category: 'shield' });
    expect(shieldLogs.length).toBe(1);
    expect(shieldLogs[0].category).toBe('shield');

    // Level filter
    const threatLogs = logger.getLogs({ level: 'threat' });
    expect(threatLogs.length).toBe(1);
    expect(threatLogs[0].level).toBe('threat');

    // Search filter
    const searchLogs = logger.getLogs({ search: 'doubleclick' });
    expect(searchLogs.length).toBe(1);
    expect(searchLogs[0].message).toContain('Doubleclick');
  });

  it('caps buffer to maxLogs', () => {
    for (let i = 0; i < 20; i++) {
      logger.log('info', 'system', `Event ${i}`);
    }

    const summary = logger.getSummary();
    expect(summary.total).toBe(10);
    const logs = logger.getLogs();
    expect(logs.length).toBe(10);
    expect(logs[0].message).toBe('Event 19');
  });

  it('exports diagnostics report in JSON format', () => {
    logger.log('threat', 'sentinel', 'Threat event');
    const exportedStr = logger.exportDiagnostics({ appVersion: '1.0.0' });

    expect(typeof exportedStr).toBe('string');
    const parsed = JSON.parse(exportedStr);
    expect(parsed.generator).toContain('NOVA Browser');
    expect(parsed.metadata.appVersion).toBe('1.0.0');
    expect(parsed.summary.total).toBe(1);
    expect(parsed.entries.length).toBe(1);
  });

  it('clears logs cleanly', () => {
    logger.log('info', 'shield', 'Item 1');
    logger.log('info', 'shield', 'Item 2');
    expect(logger.getSummary().total).toBe(2);

    logger.clearLogs();
    expect(logger.getSummary().total).toBe(0);
    expect(logger.getLogs().length).toBe(0);
  });
});
