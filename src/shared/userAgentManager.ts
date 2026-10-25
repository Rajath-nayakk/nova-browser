/**
 * User-Agent Spoofing & Anti-Fingerprinting Subsystem
 * Neutralizes device tracking, canvas hash fingerprinting, and passive profiling.
 */

export interface UserAgentProfile {
  id: string;
  name: string;
  platform: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android' | 'Default';
  uaString: string;
  isMobile: boolean;
}

export const USER_AGENT_PRESETS: UserAgentProfile[] = [
  {
    id: 'default',
    name: 'Default (Chromium Native)',
    platform: 'Default',
    uaString: '', // Empty indicates using native Electron/Chromium UA
    isMobile: false,
  },
  {
    id: 'windows-chrome',
    name: 'Windows 11 — Chrome 124',
    platform: 'Windows',
    uaString: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    isMobile: false,
  },
  {
    id: 'macos-safari',
    name: 'macOS Sonoma — Safari 17.4',
    platform: 'macOS',
    uaString: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    isMobile: false,
  },
  {
    id: 'linux-firefox',
    name: 'Linux (Ubuntu) — Firefox 125',
    platform: 'Linux',
    uaString: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
    isMobile: false,
  },
  {
    id: 'ios-iphone',
    name: 'Apple iPhone (iOS 17.4) — Mobile Safari',
    platform: 'iOS',
    uaString: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    isMobile: true,
  },
  {
    id: 'android-chrome',
    name: 'Google Pixel 8 (Android 14) — Mobile Chrome',
    platform: 'Android',
    uaString: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
    isMobile: true,
  },
];

/**
 * Returns available user-agent presets.
 */
export function getUserAgentPresets(): UserAgentProfile[] {
  return USER_AGENT_PRESETS;
}

/**
 * Resolves the active user agent string based on selected preset ID or custom override.
 */
export function resolveUserAgent(presetId = 'default', customUa?: string): string | null {
  if (customUa && customUa.trim()) {
    return customUa.trim();
  }

  if (!presetId || presetId === 'default') {
    return null; // Return null to preserve native browser UA
  }

  const found = USER_AGENT_PRESETS.find((p) => p.id === presetId);
  return found?.uaString || null;
}

/**
 * Generates an in-page anti-fingerprinting script that subtly adds randomized noise
 * to HTMLCanvasElement and AudioContext buffers to defeat hash-based tracker fingerprinting.
 */
export function generateFingerprintNoiseScript(): string {
  return `
    (function() {
      if (window.__novaFingerprintNoiseInjected) return;
      window.__novaFingerprintNoiseInjected = true;

      // 1. Canvas Noise Injection
      try {
        const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
        CanvasRenderingContext2D.prototype.getImageData = function(...args) {
          const imgData = origGetImageData.apply(this, args);
          const d = imgData.data;
          // Apply minimal 1-bit non-destructive deterministic noise to color channels
          for (let i = 0; i < d.length; i += 40) {
            d[i] = d[i] ^ 1;
          }
          return imgData;
        };

        const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(...args) {
          const ctx = this.getContext('2d');
          if (ctx && this.width > 0 && this.height > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.001)';
            ctx.fillRect(0, 0, 1, 1);
          }
          return origToDataURL.apply(this, args);
        };
      } catch (e) {
        // Silently preserve functionality on constrained contexts
      }

      // 2. AudioContext Noise Injection
      try {
        if (window.AudioBuffer && window.AudioBuffer.prototype.getChannelData) {
          const origGetChannelData = AudioBuffer.prototype.getChannelData;
          AudioBuffer.prototype.getChannelData = function(channel) {
            const data = origGetChannelData.call(this, channel);
            for (let i = 0; i < data.length; i += 100) {
              data[i] += (Math.random() - 0.5) * 0.000001;
            }
            return data;
          };
        }
      } catch (e) {
        // Ignore audio injection failure
      }
    })();
  `;
}
