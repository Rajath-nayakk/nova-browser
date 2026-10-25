import { BlockedRequestEvent } from '../shared/types';
import { extractDomain } from '../shared/validation';

export class ShieldLogger {
  private events: BlockedRequestEvent[] = [];
  private maxEvents: number;

  constructor(maxEvents = 300) {
    this.maxEvents = maxEvents;
  }

  public recordEvent(params: {
    url: string;
    tabId?: string;
    category: 'ads' | 'analytics' | 'trackers' | 'cryptominers' | 'threats' | 'general';
    filterRule?: string;
    resourceType?: string;
  }): BlockedRequestEvent {
    const domain = extractDomain(params.url) || params.url;
    const event: BlockedRequestEvent = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tabId: params.tabId,
      url: params.url,
      domain,
      category: params.category,
      filterRule: params.filterRule,
      resourceType: params.resourceType || 'other',
      timestamp: Date.now(),
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    return event;
  }

  public getEvents(tabId?: string, category?: string, limit = 100): BlockedRequestEvent[] {
    let result = this.events;
    if (tabId) {
      result = result.filter((e) => e.tabId === tabId);
    }
    if (category && category !== 'all') {
      result = result.filter((e) => e.category === category);
    }
    return result.slice(0, limit);
  }

  public clearEvents(tabId?: string): void {
    if (tabId) {
      this.events = this.events.filter((e) => e.tabId !== tabId);
    } else {
      this.events = [];
    }
  }

  public getEventCount(tabId?: string): number {
    if (tabId) {
      return this.events.filter((e) => e.tabId === tabId).length;
    }
    return this.events.length;
  }
}

export const shieldLogger = new ShieldLogger();
