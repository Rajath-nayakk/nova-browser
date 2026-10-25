import { describe, it, expect } from 'vitest';
import {
  getCrashRecoveryInfo,
  CrashLoopGuard,
} from '../../src/shared/crashRecovery';

describe('Process Crash Recovery and Diagnostics', () => {
  describe('getCrashRecoveryInfo', () => {
    it('returns memory exhaustion explanation for OOM reason', () => {
      const info = getCrashRecoveryInfo('oom');
      expect(info.title).toContain('Out of Memory');
      expect(info.canReload).toBe(true);
      expect(info.recommendation).toContain('Tab Suspension');
    });

    it('returns OS termination explanation for killed reason with exit code', () => {
      const info = getCrashRecoveryInfo('killed', 137);
      expect(info.title).toContain('Terminated');
      expect(info.explanation).toContain('137');
      expect(info.canReload).toBe(true);
    });

    it('returns security violation and disables reload for integrity-failure', () => {
      const info = getCrashRecoveryInfo('integrity-failure');
      expect(info.title).toContain('Integrity');
      expect(info.canReload).toBe(false);
      expect(info.recommendation).toContain('malware');
    });

    it('returns launch failure guidance for launch-failed reason', () => {
      const info = getCrashRecoveryInfo('launch-failed');
      expect(info.title).toContain('Launch Failure');
      expect(info.canReload).toBe(true);
    });

    it('returns generic crash explanation for standard crash reason', () => {
      const info = getCrashRecoveryInfo('crashed', 1);
      expect(info.title).toContain('Crashed Unexpectedly');
      expect(info.explanation).toContain('code 1');
      expect(info.canReload).toBe(true);
    });

    it('handles unexpected or empty reason gracefully', () => {
      const info = getCrashRecoveryInfo('');
      expect(info.title).toBeDefined();
      expect(info.canReload).toBe(true);
    });
  });

  describe('CrashLoopGuard', () => {
    it('allows initial crashes without triggering loop detection', () => {
      const guard = new CrashLoopGuard(3, 60000);
      const res1 = guard.recordCrash('https://example.com/crashy', 1000);
      expect(res1.loopDetected).toBe(false);
      expect(res1.crashCount).toBe(1);

      const res2 = guard.recordCrash('https://example.com/crashy', 2000);
      expect(res2.loopDetected).toBe(false);
      expect(res2.crashCount).toBe(2);
    });

    it('detects crash loops when threshold is met within time window', () => {
      const guard = new CrashLoopGuard(3, 60000);
      guard.recordCrash('https://badsite.com', 1000);
      guard.recordCrash('https://badsite.com', 5000);
      const res3 = guard.recordCrash('https://badsite.com', 10000);

      expect(res3.loopDetected).toBe(true);
      expect(res3.crashCount).toBe(3);
    });

    it('discards timestamps older than window duration', () => {
      const guard = new CrashLoopGuard(3, 10000); // 10s window
      guard.recordCrash('https://oldsite.com', 1000);
      guard.recordCrash('https://oldsite.com', 2000);

      // 15 seconds later
      const res = guard.recordCrash('https://oldsite.com', 17000);
      expect(res.loopDetected).toBe(false);
      expect(res.crashCount).toBe(1);
    });

    it('clears crash records on manual reset', () => {
      const guard = new CrashLoopGuard(3, 60000);
      guard.recordCrash('https://reset.com', 1000);
      guard.clear('https://reset.com');

      const res = guard.recordCrash('https://reset.com', 2000);
      expect(res.crashCount).toBe(1);
    });
  });
});
