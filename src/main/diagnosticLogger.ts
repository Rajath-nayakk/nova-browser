import { DiagnosticCategory, DiagnosticLevel, DiagnosticLogEntry } from '../shared/types';

export interface DiagnosticFilters {
  category?: string;
  level?: string;
  search?: string;
  limit?: number;
}

export interface DiagnosticSummary {
  total: number;
  byLevel: Record<DiagnosticLevel, number>;
  byCategory: Record<DiagnosticCategory, number>;
}

export class DiagnosticLogger {
  private logs: DiagnosticLogEntry[] = [];
  private maxLogs: number;

  constructor(maxLogs = 500) {
    this.maxLogs = maxLogs;
  }

  public log(
    level: DiagnosticLevel,
    category: DiagnosticCategory,
    message: string,
    details?: Record<string, any>
  ): DiagnosticLogEntry {
    const entry: DiagnosticLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return entry;
  }

  public getLogs(filters?: DiagnosticFilters): DiagnosticLogEntry[] {
    let result = this.logs;

    if (filters?.category && filters.category !== 'all') {
      result = result.filter((l) => l.category === filters.category);
    }

    if (filters?.level && filters.level !== 'all') {
      result = result.filter((l) => l.level === filters.level);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          (l.details && JSON.stringify(l.details).toLowerCase().includes(q))
      );
    }

    const limit = filters?.limit || 150;
    return result.slice(0, limit);
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getSummary(): DiagnosticSummary {
    const summary: DiagnosticSummary = {
      total: this.logs.length,
      byLevel: {
        info: 0,
        warning: 0,
        error: 0,
        threat: 0,
      },
      byCategory: {
        shield: 0,
        sentinel: 0,
        tls: 0,
        permission: 0,
        session: 0,
        system: 0,
        security: 0,
      },
    };

    for (const log of this.logs) {
      if (summary.byLevel[log.level] !== undefined) {
        summary.byLevel[log.level]++;
      }
      if (summary.byCategory[log.category] !== undefined) {
        summary.byCategory[log.category]++;
      }
    }

    return summary;
  }

  public exportDiagnostics(extraMetadata?: Record<string, any>): string {
    const summary = this.getSummary();
    const payload = {
      exportedAt: new Date().toISOString(),
      generator: 'NOVA Browser Diagnostic Engine',
      summary,
      metadata: extraMetadata || {},
      entries: this.logs.map((e) => ({
        timestamp: new Date(e.timestamp).toISOString(),
        level: e.level,
        category: e.category,
        message: e.message,
        details: e.details,
      })),
    };

    return JSON.stringify(payload, null, 2);
  }
}

export const diagnosticLogger = new DiagnosticLogger();
