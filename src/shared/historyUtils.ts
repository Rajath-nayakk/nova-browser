import { HistoryItem } from './types';
import { extractDomain } from './validation';

export type HistoryDateRange = 'all' | 'today' | '7d' | '30d';

export interface DomainVisitSummary {
  domain: string;
  count: number;
  lastVisited: number;
}

/**
 * Filter history items by date range
 */
export function filterHistoryByDateRange(
  items: HistoryItem[],
  range: HistoryDateRange,
  nowTimestamp = Date.now()
): HistoryItem[] {
  if (range === 'all') return items;

  const now = new Date(nowTimestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (range === 'today') {
    return items.filter((item) => item.visitedAt >= startOfToday);
  }

  if (range === '7d') {
    const cutoff = startOfToday - 6 * 24 * 60 * 60 * 1000;
    return items.filter((item) => item.visitedAt >= cutoff);
  }

  if (range === '30d') {
    const cutoff = startOfToday - 29 * 24 * 60 * 60 * 1000;
    return items.filter((item) => item.visitedAt >= cutoff);
  }

  return items;
}

/**
 * Aggregates visit counts by domain and returns sorted top domains
 */
export function aggregateTopDomains(items: HistoryItem[], limit = 6): DomainVisitSummary[] {
  const map = new Map<string, { count: number; lastVisited: number }>();

  for (const item of items) {
    const domain = extractDomain(item.url) || 'unknown';
    const existing = map.get(domain);
    if (!existing) {
      map.set(domain, { count: 1, lastVisited: item.visitedAt });
    } else {
      existing.count += 1;
      if (item.visitedAt > existing.lastVisited) {
        existing.lastVisited = item.visitedAt;
      }
    }
  }

  const results: DomainVisitSummary[] = Array.from(map.entries()).map(([domain, data]) => ({
    domain,
    count: data.count,
    lastVisited: data.lastVisited,
  }));

  results.sort((a, b) => b.count - a.count || b.lastVisited - a.lastVisited);
  return results.slice(0, limit);
}

/**
 * Groups history items by date string
 */
export function getHistoryDateGroupLabel(ts: number, nowTimestamp = Date.now()): string {
  const d = new Date(ts);
  const now = new Date(nowTimestamp);
  if (d.toDateString() === now.toDateString()) return 'Today';

  const yesterday = new Date(nowTimestamp);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
