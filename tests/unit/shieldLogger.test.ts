import { describe, it, expect, beforeEach } from 'vitest';
import { ShieldLogger } from '../../src/main/shieldLogger';

describe('ShieldLogger (Blocked Elements Inspector)', () => {
  let logger: ShieldLogger;

  beforeEach(() => {
    logger = new ShieldLogger(5); // small buffer for testing
  });

  it('records blocked event and extracts domain correctly', () => {
    const event = logger.recordEvent({
      url: 'https://ad.doubleclick.net/pcs/view?x=123',
      tabId: 'tab-1',
      category: 'ads',
      filterRule: '||doubleclick.net^',
      resourceType: 'script',
    });

    expect(event).toBeDefined();
    expect(event.id).toMatch(/^blk_/);
    expect(event.domain).toBe('ad.doubleclick.net');
    expect(event.category).toBe('ads');
    expect(event.filterRule).toBe('||doubleclick.net^');
    expect(event.tabId).toBe('tab-1');
    expect(event.resourceType).toBe('script');
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('filters events by tab ID and category', () => {
    logger.recordEvent({ url: 'https://ads.google.com/ad.js', tabId: 'tab-1', category: 'ads' });
    logger.recordEvent({ url: 'https://analytics.google.com/r.js', tabId: 'tab-1', category: 'analytics' });
    logger.recordEvent({ url: 'https://malware.test/trojan', tabId: 'tab-2', category: 'threats' });

    const tab1Events = logger.getEvents('tab-1');
    expect(tab1Events.length).toBe(2);
    expect(tab1Events.every((e) => e.tabId === 'tab-1')).toBe(true);

    const threatEvents = logger.getEvents(undefined, 'threats');
    expect(threatEvents.length).toBe(1);
    expect(threatEvents[0].domain).toBe('malware.test');

    const allEvents = logger.getEvents();
    expect(allEvents.length).toBe(3);
  });

  it('caps buffer size to maxEvents', () => {
    for (let i = 0; i < 10; i++) {
      logger.recordEvent({
        url: `https://tracker-${i}.com/t.js`,
        tabId: 'tab-1',
        category: 'trackers',
      });
    }

    expect(logger.getEventCount()).toBe(5);
    const events = logger.getEvents();
    expect(events.length).toBe(5);
    // Most recent event should be tracker-9
    expect(events[0].domain).toBe('tracker-9.com');
  });

  it('clears events for a specific tab or globally', () => {
    logger.recordEvent({ url: 'https://ads.com/1', tabId: 'tab-1', category: 'ads' });
    logger.recordEvent({ url: 'https://ads.com/2', tabId: 'tab-2', category: 'ads' });

    expect(logger.getEventCount()).toBe(2);

    logger.clearEvents('tab-1');
    expect(logger.getEventCount()).toBe(1);
    expect(logger.getEvents()[0].tabId).toBe('tab-2');

    logger.clearEvents();
    expect(logger.getEventCount()).toBe(0);
  });
});
