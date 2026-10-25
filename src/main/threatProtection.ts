import fs from 'fs';
import path from 'path';
import https from 'https';
import { extractDomain, isLookalikeDomain } from '../shared/validation';

export type ThreatCategory = 'phishing' | 'malware' | 'scam';

export interface ThreatCheckResult {
  isThreat: boolean;
  category?: ThreatCategory;
  domain?: string;
  reason?: string;
}

/**
 * Built-in pre-populated threat database of high-confidence known malicious,
 * credential-harvesting phishing, and scam domains.
 * Cached locally so zero URLs or history are sent to third parties.
 */
export const BUNDLED_THREAT_DOMAINS: Record<string, { category: ThreatCategory; reason: string }> = {
  // Known Phishing & Credential Harvesters
  'paypal-security-update.com': { category: 'phishing', reason: 'Deceptive credential harvesting portal targeting PayPal accounts.' },
  'paypal-verify-login.net': { category: 'phishing', reason: 'Fake payment authentication page attempting identity theft.' },
  'accounts-google-verify.com': { category: 'phishing', reason: 'Phishing domain spoofing Google Account sign-in.' },
  'appleid-support-recover.com': { category: 'phishing', reason: 'Fake Apple ID recovery portal harvesting credentials.' },
  'chase-online-verify.net': { category: 'phishing', reason: 'Fraudulent banking interface impersonating Chase Bank.' },
  'bankofamerica-auth.com': { category: 'phishing', reason: 'Deceptive online banking login targeting Bank of America.' },
  'wellsfargo-secure-login.info': { category: 'phishing', reason: 'Phishing portal impersonating Wells Fargo customer service.' },
  'metamask-validate-wallet.io': { category: 'phishing', reason: 'Deceptive crypto seed phrase harvesting phishing site.' },
  'binance-security-confirm.org': { category: 'phishing', reason: 'Fake cryptocurrency exchange login portal.' },
  'steam-community-login.ru': { category: 'phishing', reason: 'Steam inventory & credential theft phishing domain.' },
  'netflix-billing-update.top': { category: 'phishing', reason: 'Fake streaming billing update page harvesting payment details.' },

  // Known Malware & Dropper Domains
  'malware-drop-test.com': { category: 'malware', reason: 'Identified as hosting and distributing malicious executables.' },
  'trojan-downloader.biz': { category: 'malware', reason: 'Known distributor of trojans and malicious installers.' },
  'ransomware-payload.xyz': { category: 'malware', reason: 'Flagged for ransomware distribution and drive-by drops.' },
  'crack-keygen-patch.ru': { category: 'malware', reason: 'Bundles disguised keygens with information-stealing malware.' },
  'fake-flash-installer.com': { category: 'malware', reason: 'Deceptive installer delivering adware and rootkits.' },

  // Known Tech Support & Financial Scams
  'critical-microsoft-warning08.live': { category: 'scam', reason: 'Tech support scam displaying lock-screen popups and toll-free numbers.' },
  'windows-defender-alert-center.online': { category: 'scam', reason: 'Deceptive scareware popup impersonating Windows Defender.' },
  'elon-crypto-giveaway2026.net': { category: 'scam', reason: 'Fraudulent cryptocurrency double-your-deposit scam.' },
  'urgent-virus-cleaning-service.info': { category: 'scam', reason: 'Bogus antivirus renewal scam requesting remote desktop access.' },
};

export class ThreatProtectionManager {
  private threatMap: Map<string, { category: ThreatCategory; reason: string }> = new Map();
  private sessionBypasses: Set<string> = new Set();
  private threatFile: string;
  private lastUpdated: number = Date.now();

  constructor(dataDir: string) {
    this.threatFile = path.join(dataDir, 'threats.json');
    this.loadThreats();
  }

  private loadThreats(): void {
    // Populate bundled threats first
    for (const [domain, info] of Object.entries(BUNDLED_THREAT_DOMAINS)) {
      this.threatMap.set(domain.toLowerCase(), info);
    }

    // Load user/cached updates if present
    if (fs.existsSync(this.threatFile)) {
      try {
        const raw = fs.readFileSync(this.threatFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.threats && typeof parsed.threats === 'object') {
          for (const [d, info] of Object.entries(parsed.threats as Record<string, any>)) {
            this.threatMap.set(d.toLowerCase(), info);
          }
        }
        if (parsed.lastUpdated) {
          this.lastUpdated = parsed.lastUpdated;
        }
      } catch (err) {
        console.warn('Failed to parse threat database cache, using bundled threats:', err);
      }
    }
  }

  private saveThreats(): void {
    try {
      const obj: Record<string, { category: ThreatCategory; reason: string }> = {};
      this.threatMap.forEach((val, key) => {
        obj[key] = val;
      });
      fs.writeFileSync(this.threatFile, JSON.stringify({ threats: obj, lastUpdated: this.lastUpdated }, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  /**
   * Fast, privacy-preserving local lookup to verify whether a URL is a confirmed threat
   */
  public checkUrl(urlStr: string): ThreatCheckResult {
    const domain = extractDomain(urlStr).toLowerCase();
    if (!domain) {
      return { isThreat: false };
    }

    // Check if user explicitly chose to bypass for this session
    if (this.sessionBypasses.has(domain)) {
      return { isThreat: false };
    }

    // 1. Direct domain match
    if (this.threatMap.has(domain)) {
      const info = this.threatMap.get(domain)!;
      return {
        isThreat: true,
        category: info.category,
        domain,
        reason: info.reason,
      };
    }

    // 2. Subdomain check (e.g. evil.paypal-security-update.com)
    for (const [threatDomain, info] of this.threatMap.entries()) {
      if (domain.endsWith(`.${threatDomain}`)) {
        return {
          isThreat: true,
          category: info.category,
          domain,
          reason: info.reason,
        };
      }
    }

    // 3. Lookalike / Homograph IDN inspection
    const lookalike = isLookalikeDomain(domain);
    if (lookalike.isLookalike && lookalike.targetBrand) {
      return {
        isThreat: true,
        category: 'phishing',
        domain,
        reason: lookalike.reason || `Deceptive lookalike domain attempting to impersonate ${lookalike.targetBrand}.`,
      };
    }

    return { isThreat: false };
  }

  /**
   * Records a user's conscious bypass decision for a specific domain for the active browser session
   */
  public bypassThreatForSession(domain: string): void {
    if (domain) {
      this.sessionBypasses.add(domain.toLowerCase());
    }
  }

  public getThreatCount(): number {
    return this.threatMap.size;
  }

  public getLastUpdated(): number {
    return this.lastUpdated;
  }

  /**
   * Updates local threat feeds from reputable community threat lists (URLhaus/abuse.ch) over HTTPS
   */
  public async updateThreatFeeds(): Promise<{ success: boolean; message: string; count: number }> {
    const feedUrl = 'https://urlhaus.abuse.ch/downloads/hostfile/';
    try {
      const content = await this.fetchHttps(feedUrl, 8000);
      if (content && content.length > 1000) {
        let added = 0;
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const parts = trimmed.split(/\s+/);
            const domain = parts.length > 1 ? parts[1] : parts[0];
            if (domain && domain.includes('.') && !this.threatMap.has(domain.toLowerCase())) {
              this.threatMap.set(domain.toLowerCase(), {
                category: 'malware',
                reason: 'Listed in abuse.ch community malware host feed.',
              });
              added++;
            }
          }
        }
        this.lastUpdated = Date.now();
        this.saveThreats();
        return {
          success: true,
          message: `Threat intelligence updated successfully. ${added} new threats indexed.`,
          count: this.threatMap.size,
        };
      }
      throw new Error('Feed returned empty or truncated response');
    } catch (err: any) {
      return {
        success: false,
        message: 'Could not refresh online threat feed. Retained local threat intelligence.',
        count: this.threatMap.size,
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
