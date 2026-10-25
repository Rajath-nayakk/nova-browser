export interface CrashRecoveryInfo {
  title: string;
  explanation: string;
  recommendation: string;
  canReload: boolean;
  suggestSafeMode?: boolean;
}

/**
 * Returns structured diagnostic and user recovery guidance for crashed renderer processes.
 */
export function getCrashRecoveryInfo(reason: string, exitCode?: number): CrashRecoveryInfo {
  const normReason = (reason || '').toLowerCase();

  switch (normReason) {
    case 'oom':
      return {
        title: 'Tab Out of Memory',
        explanation: 'This webpage was terminated because your system or browser ran out of available RAM.',
        recommendation: 'Try closing unneeded background tabs or enabling Tab Suspension in Settings.',
        canReload: true,
      };

    case 'killed':
      return {
        title: 'Tab Process Terminated',
        explanation: `The background process was terminated by the operating system (exit code: ${exitCode ?? 'unknown'}).`,
        recommendation: 'Click Reload below to restore the webpage and re-initialize its session.',
        canReload: true,
      };

    case 'integrity-failure':
      return {
        title: 'Code Integrity Verification Failed',
        explanation: 'The code loaded by this webpage failed system integrity and signature validation.',
        recommendation: 'For your security, execution was halted. Check for conflicting system software or malware.',
        canReload: false,
      };

    case 'launch-failed':
      return {
        title: 'Process Launch Failure',
        explanation: 'NOVA was unable to allocate or spawn an isolated sandbox process for this tab.',
        recommendation: 'Restart NOVA Browser or ensure your system meets minimum process limits.',
        canReload: true,
      };

    case 'crashed':
    default:
      return {
        title: 'Webpage Crashed Unexpectedly',
        explanation: `An unexpected internal engine crash occurred while rendering this page${exitCode !== undefined ? ` (code ${exitCode})` : ''}.`,
        recommendation: 'Click Reload to refresh and attempt automatic tab recovery.',
        canReload: true,
      };
  }
}

/**
 * Registry to track crash frequencies per URL/domain to prevent repeated crash loops.
 */
export class CrashLoopGuard {
  private crashTimestamps: Map<string, number[]> = new Map();
  private maxCrashesInWindow: number;
  private windowMs: number;

  constructor(maxCrashesInWindow = 3, windowMs = 60000) {
    this.maxCrashesInWindow = maxCrashesInWindow;
    this.windowMs = windowMs;
  }

  recordCrash(key: string, now = Date.now()): { loopDetected: boolean; crashCount: number } {
    const list = this.crashTimestamps.get(key) || [];
    const valid = list.filter((ts) => now - ts < this.windowMs);
    valid.push(now);
    this.crashTimestamps.set(key, valid);

    return {
      loopDetected: valid.length >= this.maxCrashesInWindow,
      crashCount: valid.length,
    };
  }

  clear(key: string): void {
    this.crashTimestamps.delete(key);
  }

  resetAll(): void {
    this.crashTimestamps.clear();
  }
}
