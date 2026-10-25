import { describe, it, expect } from 'vitest';
import {
  filterHistoryByDateRange,
  aggregateTopDomains,
  getHistoryDateGroupLabel,
} from '../../src/shared/historyUtils';
import { HistoryItem } from '../../src/shared/types';

describe('History Filtering & Domain Analytics', () => {
  const fixedNow = new Date('2026-10-25T12:00:00Z').getTime();
  const oneHourAgo = fixedNow - 3600 * 1000;
  const twoDaysAgo = fixedNow - 2 * 24 * 3600 * 1000;
  const tenDaysAgo = fixedNow - 10 * 24 * 3600 * 1000;
  const fortyDaysAgo = fixedNow - 40 * 24 * 3600 * 1000;

  const mockHistory: HistoryItem[] = [
    { id: '1', title: 'Google Search', url: 'https://google.com/search?q=nova', visitedAt: fixedNow },
    { id: '2', title: 'Google Mail', url: 'https://google.com/mail', visitedAt: oneHourAgo },
    { id: '3', title: 'GitHub Repo', url: 'https://github.com/Rajath-nayakk/nova', visitedAt: twoDaysAgo },
    { id: '4', title: 'GitHub Issues', url: 'https://github.com/issues', visitedAt: tenDaysAgo },
    { id: '5', title: 'Wikipedia Article', url: 'https://en.wikipedia.org/wiki/Browser', visitedAt: fortyDaysAgo },
  ];

  it('filters history items for "all" range without dropping any', () => {
    const result = filterHistoryByDateRange(mockHistory, 'all', fixedNow);
    expect(result).toHaveLength(5);
  });

  it('filters history items for "today"', () => {
    const result = filterHistoryByDateRange(mockHistory, 'today', fixedNow);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(['1', '2']);
  });

  it('filters history items for "7d"', () => {
    const result = filterHistoryByDateRange(mockHistory, '7d', fixedNow);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(['1', '2', '3']);
  });

  it('filters history items for "30d"', () => {
    const result = filterHistoryByDateRange(mockHistory, '30d', fixedNow);
    expect(result).toHaveLength(4);
    expect(result.map((i) => i.id)).toEqual(['1', '2', '3', '4']);
  });

  it('aggregates top domains and ranks by frequency', () => {
    const domains = aggregateTopDomains(mockHistory, 5);
    expect(domains[0].domain).toBe('google.com');
    expect(domains[0].count).toBe(2);

    expect(domains[1].domain).toBe('github.com');
    expect(domains[1].count).toBe(2);

    expect(domains[2].domain).toBe('en.wikipedia.org');
    expect(domains[2].count).toBe(1);
  });

  it('respects the limit argument for domain aggregation', () => {
    const domains = aggregateTopDomains(mockHistory, 2);
    expect(domains).toHaveLength(2);
  });

  it('returns Today and Yesterday date labels correctly', () => {
    expect(getHistoryDateGroupLabel(fixedNow, fixedNow)).toBe('Today');
    const yesterday = fixedNow - 24 * 3600 * 1000;
    expect(getHistoryDateGroupLabel(yesterday, fixedNow)).toBe('Yesterday');
  });
});
