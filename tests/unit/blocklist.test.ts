import { describe, it, expect } from 'vitest';
import { checkUrlAgainstBlocklist } from '../../src/main/blocklist';

describe('Privacy Shield Content Blocking Engine', () => {
  it('blocks known analytics and telemetry endpoints', () => {
    expect(checkUrlAgainstBlocklist('https://www.google-analytics.com/analytics.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://www.googletagmanager.com/gtm.js?id=GTM-XXXX').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://static.hotjar.com/c/hotjar-12345.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://cdn.segment.com/analytics.js/v1/key/analytics.min.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://api.mixpanel.com/track').blocked).toBe(true);
  });

  it('blocks advertising networks and banner servers', () => {
    expect(checkUrlAgainstBlocklist('https://ad.doubleclick.net/ddm/adj/N1234.site').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://static.criteo.net/js/ld/ld.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://cdn.taboola.com/libtrc/unip/loader.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://widgets.outbrain.com/outbrain.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://d.adroll.com/ipixel/12345').blocked).toBe(true);
  });

  it('blocks social trackers and cryptominers', () => {
    expect(checkUrlAgainstBlocklist('https://connect.facebook.net/en_US/fbevents.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://www.facebook.com/tr/?id=12345').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://coinhive.com/lib/coinhive.min.js').blocked).toBe(true);
    expect(checkUrlAgainstBlocklist('https://crypto-loot.com/lib/miner.js').blocked).toBe(true);
  });

  it('correctly categorizes blocked requests', () => {
    expect(checkUrlAgainstBlocklist('https://google-analytics.com/ga.js').category).toBe('analytics');
    expect(checkUrlAgainstBlocklist('https://doubleclick.net/ad').category).toBe('ads');
    expect(checkUrlAgainstBlocklist('https://connect.facebook.net/fbevents.js').category).toBe('trackers');
    expect(checkUrlAgainstBlocklist('https://coinhive.com/script.js').category).toBe('cryptominers');
  });

  it('permits legitimate ordinary website content without false positives', () => {
    expect(checkUrlAgainstBlocklist('https://en.wikipedia.org/wiki/Main_Page').blocked).toBe(false);
    expect(checkUrlAgainstBlocklist('https://github.com/torvalds/linux').blocked).toBe(false);
    expect(checkUrlAgainstBlocklist('https://duckduckgo.com').blocked).toBe(false);
    expect(checkUrlAgainstBlocklist('https://developer.mozilla.org/en-US/docs/Web/API').blocked).toBe(false);
    expect(checkUrlAgainstBlocklist('https://archive.org/details/texts').blocked).toBe(false);
  });
});
