# NOVA Browser — Technical Architecture & Engineering Guide

## 1. System Overview & Directory Structure

NOVA Browser is built using modern Electron, React 18, TypeScript, and Vite. The codebase adheres strictly to process boundaries and separation of concerns:

```
nova-browser/
├── src/
│   ├── main/                    # Electron Main Process (Node.js runtime)
│   │   ├── index.ts             # Application lifecycle, IPC handlers, window layout
│   │   ├── filterEngine.ts      # Adblocking & network filter compiler
│   │   ├── threatProtection.ts  # Phishing & malware offline lookup engine
│   │   ├── vault.ts             # AES-256-GCM encrypted credential vault
│   │   ├── storage.ts           # JSON-backed atomic persistence manager
│   │   ├── cookieManager.ts     # Cookie expiry & origin storage auditor
│   │   ├── diagnosticLogger.ts  # In-memory security event diagnostic buffer
│   │   ├── sessionRestore.ts    # Startup optimization & lazy tab restoration
│   │   ├── tabSuspension.ts     # Memory suspension heuristic engine
│   │   ├── tlsInspector.ts      # Certificate chain & cipher suite analyzer
│   │   ├── torService.ts        # Tor SOCKS5 circuit health probe
│   │   └── shieldLogger.ts      # Real-time blocked request telemetry
│   ├── preload/                 # Preload context bridge
│   │   └── index.ts             # Exposes typed window.novaAPI
│   ├── renderer/                # Browser Chrome UI (Vite + React + CSS)
│   │   ├── index.html           # Main UI entrypoint
│   │   └── src/
│   │       ├── App.tsx          # Root container & keyboard shortcut dispatcher
│   │       ├── main.tsx         # React bootstrap
│   │       ├── index.css        # Vanilla CSS Design System & tokens
│   │       ├── components/      # UI components (TitleBar, Navbar, AddressBar, etc.)
│   │       └── views/           # Internal views (Settings, History, Bookmarks, Logs, Error)
│   └── shared/                  # Isomorphic modules (zero Node-specific imports)
│       ├── types.ts             # Canonical TypeScript domain interfaces
│       ├── constants.ts         # Application constants & defaults
│       ├── validation.ts        # Safe navigation, domain extraction, typosquatting
│       ├── cspAuditor.ts        # Content Security Policy & header evaluation engine
│       ├── cookieExpiry.ts      # Cookie normalization & lifetime capping logic
│       ├── searchSuggestions.ts # Offline omnibox search & keyword engines
│       ├── readerExtractor.ts   # Readability heuristic article extractor
│       ├── tabGroupUtils.ts     # Color-coded tab grouping models & helpers
│       ├── profileUtils.ts      # User profile management & color accents
│       └── crashRecovery.ts     # Process crash reason mapper & recovery URLs
├── tests/
│   ├── unit/                    # Vitest unit test suites
│   └── security/                # Process isolation & security boundary tests
├── docs/                        # Architecture & security documentation
├── ROADMAP.md                   # Long-term incremental development milestones
└── package.json                 # Dependency manifests & packaging config
```

---

## 2. Multi-Tab Architecture (`WebContentsView`)

NOVA uses Electron's modern `WebContentsView` architecture (replacing deprecated `BrowserView` and insecure `<webview>` tags).

```
+------------------------------------------------------------------------+
| NOVA TitleBar (Tabs Strip, Tab Groups, Audio Indicators, Window Controls) |
+------------------------------------------------------------------------+
| NOVA Navbar (Back, Forward, Reload, AddressBar, Shield Badge, Profiles)|
+------------------------------------------------------------------------+
| [Optional Bookmarks Bar]                                               |
+------------------------------------------------------------------------+
|                                                                        |
|                       Active WebContentsView                           |
|               (Sandboxed, Node-Disabled Guest Page)                    |
|                                                                        |
+------------------------------------------------------------------------+
```

### 2.1 Tab Lifecycle & State Management
- Each tab is modeled by the `Tab` interface (`id`, `url`, `title`, `favicon`, `isLoading`, `isSuspended`, `isMuted`, `groupId`, `isPinned`).
- Background tabs can be dynamically **suspended** after an inactivity threshold (`tabSuspension.ts`) to reclaim memory.
- In-page audio is actively monitored; when a media element plays, an audio badge illuminates in the tab strip with a one-click mute toggle.
- On browser exit, active tab state is persisted atomically to `session.json` (`sessionRestore.ts`). On cold start, the active tab loads immediately while background tabs load lazily on first click.

---

## 3. NOVA Shield (Content & Privacy Protection)

The Shield system combines declarative network request blocking with cosmetic CSS rules and anti-circumvention scriptlet injection.

1. **Network Interception:** `session.defaultSession.webRequest.onBeforeRequest` evaluates all outgoing URLs against the compiled `FiltersEngine`.
2. **Category Classification:** Matching URLs are categorized into `ads`, `analytics`, `trackers`, `cryptominers`, or `threats`.
3. **Cosmetic Injection:** For supported domains, element-hiding CSS is injected directly into the guest frame.
4. **Scriptlet Defense:** Evaluates and injects standard uBlock scriptlets (e.g. `set-constant`, `abort-on-property-read`) to neutralize anti-adblock detection scripts.
5. **Cookie Expiry Policy:** Automatically intercepts third-party cookies living longer than 24 hours and clamps their expiration timestamps (`cookieManager.ts`).

---

## 4. NOVA Sentinel (Threat Intelligence)

1. **Typosquatting & Lookalike Defense:** Uses Levenshtein distance calculations against a curated corpus of top internet domains (banking, e-commerce, cloud services). Domains within an edit distance of 1–2 are flagged.
2. **Punycode IDN Defense:** Analyzes internationalized domain names for mixed-script attacks (e.g. Cyrillic `а` substituting Latin `a`).
3. **Malware Extension Defense:** Downloads are evaluated against dangerous binary file signatures and flagged with executable warnings.

---

## 5. Storage & Persistence Engine

All browser data is persisted locally without remote telemetry:

- **`LocalStorageManager` (`storage.ts`):**
  - Manages `settings.json`, `bookmarks.json`, `history.json`, and `session.json`.
  - Performs atomic disk writes (writing to temporary files and renaming) to eliminate disk corruption risks on power loss.
  - Automatically creates `.bak` backups and restores defaults if JSON syntax corruption is detected.
- **`LocalVaultManager` (`vault.ts`):**
  - Encrypts saved logins, private notes, and credentials using AES-256-GCM.
  - Generates unique 12-byte IVs for each item.
  - Derives keys using PBKDF2 (100,000 iterations).

---

## 6. Developer Workflows & Quality Verification

All engineering modifications must strictly satisfy the verification pipeline:

```bash
# 1. Run full unit and security test suites
npm test

# 2. Run TypeScript strict type verification
npm run typecheck

# 3. Check for whitespace and line-ending anomalies
git diff --check

# 4. Build production desktop bundles
npm run build:win
```
