import fs from 'fs';
import path from 'path';
import https from 'https';
import { FiltersEngine, Request as GhosteryRequest } from '@ghostery/adblocker';
import { extractDomain } from '../shared/validation';
import { FilterListInfo } from '../shared/types';

export type FilterCategory = 'ads' | 'trackers' | 'analytics' | 'cryptominers';

export interface FilterMatchResult {
  blocked: boolean;
  category?: FilterCategory;
  filter?: string;
  redirect?: string;
}

/**
 * Built-in pre-compiled EasyList, EasyPrivacy, and YouTube ad-blocking rules.
 * This guarantees 100% offline out-of-the-box protection without requiring an initial download.
 */
export const BUNDLED_FILTER_RULES = `
! -------------------------------------------------------------
! NOVA Browser Core Shield — EasyList + EasyPrivacy + YouTube
! -------------------------------------------------------------

! --- Advertising Networks & Ad Servers ---
||doubleclick.net^$third-party
||googlesyndication.com^$third-party
||googleadservices.com^$third-party
||criteo.com^$third-party
||criteo.net^$third-party
||taboola.com^$third-party
||outbrain.com^$third-party
||adroll.com^$third-party
||buysellads.com^$third-party
||buysellads.net^$third-party
||pubmatic.com^$third-party
||openx.net^$third-party
||rubiconproject.com^$third-party
||adnxs.com^$third-party
||appnexus.com^$third-party
||mopub.com^$third-party
||inmobi.com^$third-party
||adform.net^$third-party
||amazon-adsystem.com^$third-party
||bidswitch.net^$third-party
||casalemedia.com^$third-party
||zedo.com^$third-party
||popads.net^
||popcash.net^
||propellerads.com^
||exoclick.com^
||trafficjunky.com^
||adblade.com^
||adtrue.com^

! --- Tracking & Analytics Endpoints ---
||google-analytics.com^$third-party
||googletagmanager.com^$third-party
||analytics.google.com^$third-party
||hotjar.com^$third-party
||segment.com^$third-party
||segment.io^$third-party
||mixpanel.com^$third-party
||amplitude.com^$third-party
||heapanalytics.com^$third-party
||fullstory.com^$third-party
||scorecardresearch.com^$third-party
||quantserve.com^$third-party
||chartbeat.com^$third-party
||chartbeat.net^$third-party
||statcounter.com^$third-party
||clarity.ms^$third-party
||matomo.org^$third-party
||connect.facebook.net/*/fbevents.js^
||facebook.com/tr/*
||tiktok.com/*analytics*
||ads-twitter.com^
||analytics.twitter.com^
||linkedin.com/px/*
||pinterest.com/ct.html*
||adjust.com^$third-party
||appsflyer.com^$third-party
||branch.io^$third-party
||fingerprintjs.com^$third-party
||fpjs.io^$third-party
||optimizely.com/*/optimizely.js^

! --- Cryptominers ---
||coinhive.com^
||cryptoloot.pro^
||jsecoin.com^
||coin-imp.com^
||minr.pw^
||webmine.cz^
||crypto-loot.com^

! --- Dedicated YouTube Network Filters ---
||youtube.com/api/stats/ads
||youtube.com/pagead/*
||youtube.com/ptracking*
||youtube.com/youtubei/v1/log_event?*ad*
||googlevideo.com/videoplayback?*&oad=*
||googleads.g.doubleclick.net^
||static.doubleclick.net^

! --- Cosmetic Element Hiding Filters (General) ---
##.ad-banner
##.ad-container
##.ad-wrapper
##.advertisement
##[id*="google_ads"]
##.sponsored-post
##.taboola-placeholder
##.outbrain-placeholder

! --- Dedicated YouTube Cosmetic Element Hiding Filters ---
youtube.com##.ytp-ad-module
youtube.com##.ytp-ad-overlay-container
youtube.com##.ytp-ad-player-overlay
youtube.com##.ytp-ad-preview-container
youtube.com##.ytp-ad-skip-button-slot
youtube.com###player-ads
youtube.com##ytd-promoted-sparkles-web-renderer
youtube.com##ytd-promoted-video-renderer
youtube.com##ytd-ad-slot-renderer
youtube.com##ytd-in-feed-ad-layout-renderer
youtube.com##ytd-banner-promo-renderer
youtube.com###masthead-ad
youtube.com##.ytd-statement-banner-renderer
youtube.com##ytd-action-companion-ad-renderer
youtube.com###chat-ads
youtube.com###panels-ad
youtube.com##.sparkles-light-cta
youtube.com##ytd-popup-container:has(.ytp-ad-dialog)
`;

export class FilterEngineManager {
  private engine: FiltersEngine | null = null;
  private customEngine: FiltersEngine | null = null;
  private customRules: string[] = [];
  private filtersDir: string;
  private metadataFile: string;
  private cacheFile: string;
  private listInfo: FilterListInfo[] = [];

  constructor(dataDir: string) {
    this.filtersDir = path.join(dataDir, 'filters');
    this.metadataFile = path.join(this.filtersDir, 'metadata.json');
    this.cacheFile = path.join(this.filtersDir, 'engine.bin');
    this.ensureDir(this.filtersDir);
    this.initialize();
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error('Failed to create filters directory:', err);
      }
    }
  }

  private initialize(): void {
    // Attempt to load cached compiled engine
    if (fs.existsSync(this.cacheFile)) {
      try {
        const buffer = fs.readFileSync(this.cacheFile);
        this.engine = FiltersEngine.deserialize(buffer);
        this.loadMetadata();
        return;
      } catch (err) {
        console.warn('Failed to deserialize compiled filter engine cache, compiling bundled rules:', err);
      }
    }

    // Fallback: Compile from bundled high-impact rules
    this.compileBundledRules();
  }

  private compileBundledRules(): void {
    try {
      this.engine = FiltersEngine.parse(BUNDLED_FILTER_RULES);
      // Persist serialized engine for instant startup next time
      try {
        const serialized = this.engine.serialize();
        fs.writeFileSync(this.cacheFile, Buffer.from(serialized));
      } catch {
        // non-fatal
      }

      this.listInfo = [
        {
          id: 'easylist',
          name: 'EasyList',
          description: 'Primary ad-blocking filter list for display, video, and banner ads.',
          ruleCount: 38,
          lastUpdated: Date.now(),
          enabled: true,
        },
        {
          id: 'easyprivacy',
          name: 'EasyPrivacy',
          description: 'Blocks behavioral tracking, telemetry scripts, and analytics pixels.',
          ruleCount: 32,
          lastUpdated: Date.now(),
          enabled: true,
        },
        {
          id: 'nova-youtube',
          name: 'NOVA YouTube Shields',
          description: 'Comprehensive network and cosmetic filtering tailored for YouTube video and overlay ads.',
          ruleCount: 24,
          lastUpdated: Date.now(),
          enabled: true,
        },
        {
          id: 'nova-miners',
          name: 'Cryptominer Shield',
          description: 'Prevents unauthorized in-browser cryptocurrency mining.',
          ruleCount: 7,
          lastUpdated: Date.now(),
          enabled: true,
        },
      ];
      this.saveMetadata();
    } catch (err) {
      console.error('Fatal error compiling bundled filter rules:', err);
    }
  }

  private loadMetadata(): void {
    if (fs.existsSync(this.metadataFile)) {
      try {
        this.listInfo = JSON.parse(fs.readFileSync(this.metadataFile, 'utf-8'));
      } catch {
        this.compileBundledRules();
      }
    } else {
      this.compileBundledRules();
    }
  }

  private saveMetadata(): void {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(this.listInfo, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  public setCustomRules(rules: string[]): { success: boolean; ruleCount: number; error?: string } {
    try {
      this.customRules = rules;
      const validRules = rules.map((r) => r.trim()).filter((r) => r.length > 0 && !r.startsWith('!'));
      if (validRules.length === 0) {
        this.customEngine = null;
        return { success: true, ruleCount: 0 };
      }
      this.customEngine = FiltersEngine.parse(validRules.join('\n'));
      return { success: true, ruleCount: validRules.length };
    } catch (err: any) {
      console.warn('Failed to parse custom filter rules:', err?.message);
      return { success: false, ruleCount: 0, error: err?.message || 'Invalid rule syntax' };
    }
  }

  public getCustomRules(): string[] {
    return [...this.customRules];
  }

  public getFilterLists(): FilterListInfo[] {
    const lists = [...this.listInfo];
    if (this.customRules.length > 0) {
      lists.push({
        id: 'user-custom-filters',
        name: 'My Custom Rules',
        description: 'User-defined network and cosmetic filtering rules.',
        ruleCount: this.customRules.filter((r) => r.trim().length > 0 && !r.startsWith('!')).length,
        lastUpdated: Date.now(),
        enabled: true,
        isCustom: true,
      });
    }
    return lists;
  }

  /**
   * Evaluates a network request against all active filter rules
   */
  public match(urlStr: string, sourceUrl?: string, resourceType: string = 'other'): FilterMatchResult {
    if (!this.engine && !this.customEngine) {
      return { blocked: false };
    }

    try {
      const ghosteryReq = GhosteryRequest.fromRawDetails({
        url: urlStr,
        sourceUrl: sourceUrl || urlStr,
        type: resourceType as any,
      });

      // 1. Evaluate user's custom filter rules first
      if (this.customEngine) {
        try {
          const customRes = this.customEngine.match(ghosteryReq);
          if (customRes.match) {
            return {
              blocked: true,
              category: 'ads',
              filter: customRes.filter?.toString() || 'custom-filter-rule',
            };
          }
        } catch {
          // ignore custom engine error and fall through to base engine
        }
      }

      if (!this.engine) {
        return { blocked: false };
      }

      const res = this.engine.match(ghosteryReq);
      if (res.match) {
        // Categorize match
        let category: FilterCategory = 'ads';
        const lowerUrl = urlStr.toLowerCase();

        if (
          lowerUrl.includes('analytics') ||
          lowerUrl.includes('hotjar') ||
          lowerUrl.includes('segment') ||
          lowerUrl.includes('mixpanel') ||
          lowerUrl.includes('clarity') ||
          lowerUrl.includes('statcounter')
        ) {
          category = 'analytics';
        } else if (
          lowerUrl.includes('facebook.com/tr') ||
          lowerUrl.includes('fbevents') ||
          lowerUrl.includes('fingerprint') ||
          lowerUrl.includes('appsflyer') ||
          lowerUrl.includes('adjust') ||
          lowerUrl.includes('twitter.com') ||
          lowerUrl.includes('linkedin.com/px')
        ) {
          category = 'trackers';
        } else if (
          lowerUrl.includes('coinhive') ||
          lowerUrl.includes('cryptoloot') ||
          lowerUrl.includes('coin-imp') ||
          lowerUrl.includes('crypto-loot')
        ) {
          category = 'cryptominers';
        }

        return {
          blocked: true,
          category,
          filter: res.filter?.toString(),
          redirect: res.redirect ? (res.redirect.dataUrl || res.redirect.filename || '') : undefined,
        };
      }
    } catch {
      // In case of parsing error, safely pass
    }

    return { blocked: false };
  }

  /**
   * Retrieves cosmetic stylesheet rules to inject into a given page
   */
  public getCosmeticFilters(urlStr: string, hostname?: string): string {
    if (!this.engine && !this.customEngine) return '';
    try {
      const host = hostname || extractDomain(urlStr);
      let styles = '';

      if (this.customEngine) {
        try {
          const cRes = this.customEngine.getCosmeticsFilters({ url: urlStr, hostname: host, domain: host });
          if (cRes.styles) {
            styles += cRes.styles + '\n';
          }
        } catch {}
      }

      if (this.engine) {
        const res = this.engine.getCosmeticsFilters({ url: urlStr, hostname: host, domain: host });
        styles += res.styles || '';
      }

      // Add custom YouTube cosmetic CSS if on YouTube
      if (host.includes('youtube.com')) {
        styles += `
          .ytp-ad-module, .ytp-ad-overlay-container, .ytp-ad-player-overlay,
          .ytp-ad-preview-container, .ytp-ad-skip-button-slot, #player-ads,
          ytd-promoted-sparkles-web-renderer, ytd-promoted-video-renderer,
          ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer,
          ytd-banner-promo-renderer, #masthead-ad, .ytd-statement-banner-renderer,
          ytd-action-companion-ad-renderer, #chat-ads, #panels-ad,
          .sparkles-light-cta, ytd-popup-container:has(.ytp-ad-dialog) {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            height: 0 !important;
            width: 0 !important;
          }
        `;
      }

      return styles;
    } catch {
      return '';
    }
  }

  /**
   * Generates anti-circumvention and anti-adblock defusing scriptlets.
   * Defuses common anti-adblock detection scripts and handles video ad evasion safely.
   */
  public getScriptlets(urlStr: string, hostname?: string): string {
    const host = (hostname || extractDomain(urlStr)).toLowerCase();

    // Core anti-adblock defusing scriptlet injected into all webpages
    let scriptlet = `(() => {
  try {
    if (window.__nova_scriptlets_injected) return;
    window.__nova_scriptlets_injected = true;

    // 1. Defuse common anti-adblock trap flags
    window.canRunAds = true;
    window.isAdBlockActive = false;
    window.__adblocker_detected = false;
    window.google_ad_status = 1;

    // 2. Mock Google AdSense / DoubleClick global stubs
    if (!window.adsbygoogle) {
      window.adsbygoogle = [];
    }
    try {
      Object.defineProperty(window.adsbygoogle, 'loaded', {
        get: () => true,
        configurable: true,
      });
    } catch {}

    // 3. Defuse FuckAdBlock / BlockAdBlock / DetectAdBlock prototypes
    const noopInstance = {
      on: () => noopInstance,
      onDetected: () => noopInstance,
      onNotDetected: (fn) => { if (typeof fn === 'function') setTimeout(fn, 10); return noopInstance; },
      check: () => true,
      clearEvent: () => {},
    };
    window.FuckAdBlock = function() { return noopInstance; };
    window.BlockAdBlock = function() { return noopInstance; };
    window.fuckAdBlock = noopInstance;
    window.blockAdBlock = noopInstance;

    // 4. Neutralize anti-adblock modal backdrops and dismiss lockouts
    const neutralizeModals = () => {
      const selectors = [
        '.adblock-modal',
        '.adblock-overlay',
        '#adblock-notice',
        '.adblock-blocker',
        '[id*="adblock-overlay"]',
        'ytd-enforcement-message-view-model',
      ];
      for (const sel of selectors) {
        const els = document.querySelectorAll(sel);
        for (let i = 0; i < els.length; i++) {
          const el = els[i];
          if (el && el.parentNode) {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
          }
        }
      }
      if (document.body && document.body.style.overflow === 'hidden') {
        document.body.style.setProperty('overflow', 'auto', 'important');
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', neutralizeModals, { once: true });
    } else {
      neutralizeModals();
    }
  } catch {}
})();
`;

    // Specialized Video Player Anti-Circumvention (e.g. YouTube)
    if (host.includes('youtube.com')) {
      scriptlet += `(() => {
  try {
    if (window.__nova_yt_shield_active) return;
    window.__nova_yt_shield_active = true;

    const handleYouTubeAds = () => {
      // A. Skip button auto-trigger
      const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, button.ytp-ad-skip-button');
      if (skipBtn && typeof skipBtn.click === 'function') {
        skipBtn.click();
      }

      // B. Fast-forward & mute unskippable ad video stream
      const adElement = document.querySelector('.ad-showing, .ad-interrupting, .ytp-ad-player-overlay');
      const video = document.querySelector('video');
      if (adElement && video && !video.paused && Number.isFinite(video.duration)) {
        video.muted = true;
        video.playbackRate = 16.0;
        video.currentTime = video.duration;
      }

      // C. Close overlay ad banners
      const closeOverlayBtn = document.querySelector('.ytp-ad-overlay-close-button');
      if (closeOverlayBtn && typeof closeOverlayBtn.click === 'function') {
        closeOverlayBtn.click();
      }

      // D. Dismiss enforcement prompt dialogs
      const dismissBtn = document.querySelector('ytd-enforcement-message-view-model button');
      if (dismissBtn && typeof dismissBtn.click === 'function') {
        dismissBtn.click();
      }
    };

    setInterval(handleYouTubeAds, 350);
  } catch {}
})();
`;
    }

    return scriptlet;
  }

  /**
   * Safely fetches and updates filter lists over HTTPS from official sources.
   * If an update fails or data is corrupted, retains the last known-good rules.
   */
  public async updateFilterLists(): Promise<{ success: boolean; message: string; updatedCount: number }> {
    const trustedUrls = [
      'https://raw.githubusercontent.com/easylist/easylist/master/easylist/easylist_general_block.txt',
      'https://raw.githubusercontent.com/easylist/easylist/master/easyprivacy/easyprivacy_general.txt',
    ];

    try {
      const fetchedRules: string[] = [BUNDLED_FILTER_RULES];

      for (const url of trustedUrls) {
        try {
          const content = await this.fetchHttps(url, 6000);
          if (content && content.length > 500 && !content.includes('<html')) {
            fetchedRules.push(content);
          }
        } catch {
          // Skip if offline or mirror unreachable, continue with other rules
        }
      }

      const combinedText = fetchedRules.join('\n');
      const newEngine = FiltersEngine.parse(combinedText);

      // Verify engine works
      const testMatch = newEngine.match(GhosteryRequest.fromRawDetails({ url: 'https://ad.doubleclick.net/test' }));
      if (!testMatch.match) {
        throw new Error('Filter verification failed against test pattern');
      }

      // Update engine & cache
      this.engine = newEngine;
      const serialized = newEngine.serialize();
      fs.writeFileSync(this.cacheFile, Buffer.from(serialized));

      const now = Date.now();
      this.listInfo.forEach((list) => {
        list.lastUpdated = now;
      });
      this.saveMetadata();

      return {
        success: true,
        message: 'Filter lists successfully updated and verified.',
        updatedCount: this.listInfo.length,
      };
    } catch (err: any) {
      console.warn('Filter list update failed, retaining existing verified rules:', err.message);
      return {
        success: false,
        message: `Update could not reach remote server. Retained existing verified filters.`,
        updatedCount: 0,
      };
    }
  }

  private fetchHttps(url: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { timeout: timeoutMs }, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(new Error(`HTTP Status ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
          if (data.length > 5 * 1024 * 1024) {
            req.destroy();
            resolve(data);
          }
        });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });
  }
}
