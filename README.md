# NOVA Browser 🛡️ — Next-Generation Privacy Browser

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 56 Passing](https://img.shields.io/badge/Tests-56%20Passing-brightgreen.svg)](tests/)
[![TypeScript: Strict](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](tsconfig.json)
[![Zero Telemetry](https://img.shields.io/badge/Telemetry-Zero-success.svg)](PRIVACY.md)

**NOVA Browser** is a fast, modern, privacy-focused desktop web browser engineered from scratch with **Electron, React 19, TypeScript, and Vite**.

Designed with absolute transparency and zero commercial noise: **no advertisements inside the browser UI, zero application telemetry, no sponsored search placements, and complete local-first data ownership.**

---

## 🌟 Core Feature Suite

### 1. 🛡️ NOVA Shield — Advanced Content & Ad Blocking
- **High-Performance Filtering Engine:** Integrates `@ghostery/adblocker` (`FiltersEngine`), compiling EasyList, EasyPrivacy, Cryptominer Shields, and YouTube filters directly into memory.
- **Network & Cosmetic Filtering:** Neutralizes tracking endpoints, ad servers, analytics pixels, and web miners while injecting cosmetic CSS rules to eliminate unsightly ad placeholders.
- **YouTube Ad Suppression:** Proactively suppresses video ad telemetry, companion ads, overlays, and banner slots without breaking video playback, sign-in, or captions.
- **Site Allowlists & Live Updates:** Provides granular per-site allowlisting to support trusted publishers, paired with safe HTTPS filter list updates that automatically roll back to last-known-good rules if interrupted.

### 2. ⚡ NOVA Sentinel — Scam & Threat Protection
- **100% Offline Local Lookup:** Verifies destinations against an offline database of confirmed phishing, malware, and financial scam domains (`threats.json`). **Zero URLs or hostnames are ever transmitted to third-party reputation servers.**
- **IDN Homograph & Punycode Defense:** Detects sneaky lookalike domains using Cyrillic/Greek glyphs or `xn--` punycode spoofs of major platforms (PayPal, Google, Apple, Chase, etc.).
- **Warning Interstitial (`nova://warning`):** Prevents navigation to confirmed threats with an explanatory security warning, an instant "Back to Safety" action, and an intentional multi-step bypass.
- **Safe Downloads Inspection:** Inspects downloads for dangerous executable extensions (`.exe`, `.bat`, `.cmd`, `.msi`, `.ps1`, `.scr`) with mandatory save confirmation.

### 3. 👻 NOVA Ghost — Ephemeral Private Browsing
- **In-Memory Partition Isolation:** Dedicated private windows (`Ctrl+Shift+N`) run inside isolated ephemeral partitions (`incognito-${id}`).
- **Zero Disk Residue:** Cookies, HTTP caches, and browsing records exist only in RAM and are thoroughly purged upon window closure.
- **Honest Disclosures:** Ghost mode prevents local disk history logging; it does not conceal activity from internet service providers, local network administrators, or destination servers.

### 4. 🧅 NOVA Tor Route — Optional Tor Networking
- **SOCKS5 Proxy Tunneling:** Route traffic through a local Tor daemon (default `127.0.0.1:9050`).
- **WebRTC Leak Prevention:** Locks WebRTC handling to `disable_non_proxied_udp`, preventing IP address exposure via STUN queries.
- **Transparent Boundaries:** Electron does not integrate Tor Browser's specialized C++ canvas/font anti-fingerprinting patches. High-risk anonymity users are directed to the official Tor Browser.

### 5. 👥 NOVA Identity Profiles
- **Multi-Profile Management:** Create and switch between distinct browsing profiles (**Personal**, **Work**, **Shopping**, **Research**).
- **Session & Storage Isolation:** Each profile maintains independent cookies, local storage partitions, and browsing states to prevent cross-profile tracking.

### 6. 🔐 NOVA Vault — Local Encrypted Storage (`nova://vault`)
- **Authenticated Cryptography:** Encrypted with **AES-256-GCM** using a 12-byte cryptographically secure random IV generated on every save.
- **Key Derivation:** Master passwords derive 256-bit keys using **PBKDF2** (HMAC-SHA-256) with 100,000 iterations and a 32-byte salt.
- **Zero Memory Residue:** Master passwords are never written to disk; key buffers in memory are explicitly zeroed out (`Buffer.fill(0)`) upon locking.

### 7. 🔍 NOVA Link Lens
- **Deep URL Inspection:** Pre-inspect suspicious or untrusted links without navigating to them.
- **Homoglyph & Punycode Warnings:** Flags impersonation tactics, plain HTTP connections, and raw IP address destinations.
- **Tracking Parameter Stripper:** Automatically removes pervasive query tracking tokens (`utm_*`, `fbclid`, `gclid`, `msclkid`, `twclid`, etc.) and copies clean URLs.

### 8. 🎯 NOVA Focus
- **Productivity Timer:** Configurable distraction-free focus sessions.
- **Distraction-Free Mode:** Hides distracting elements for pure reading and research.

### 9. ⚙️ NOVA Control Center (`nova://settings`)
- **Unified Settings Dashboard:** 9 categorized panels (General, Shield, Sentinel, Privacy, Tor, Profiles, Focus, Appearance, About).
- **Data Agency:** Reset settings to defaults and purge browsing data with interactive confirmation.

---

## 🎨 NOVA Design System & Internal Views

NOVA features a custom, modern design system engineered with CSS glassmorphism, responsive controls, and high-contrast Dark and Light modes:
- `nova://newtab` — Start page with privacy search, custom quick dials, live clock/date, and real-time shield status.
- `nova://vault` — Authenticated encrypted vault for secure notes, credentials, and recovery codes.
- `nova://warning` — Sentinel threat warning interstitial.
- `nova://bookmarks` — Local bookmarks manager with search and folder management.
- `nova://history` — Date-grouped browsing history with search and selective removal.
- `nova://downloads` — File download manager with progress tracking and safe folder reveals.
- `nova://settings` — Comprehensive browser configuration center.

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Desktop Framework** | Electron 33+ (Chromium Native Engine via `WebContentsView`) |
| **Frontend UI** | React 19, TypeScript |
| **Build Tools** | Vite 8, esbuild |
| **Filter Engine** | `@ghostery/adblocker` (`FiltersEngine`), EasyList, EasyPrivacy |
| **Cryptography** | Node.js `crypto` (PBKDF2, AES-256-GCM) |
| **Icons** | Lucide React |
| **Testing** | Vitest (56 Unit & Security Tests) |
| **Packaging** | Electron Builder (NSIS Installer & Portable Windows Executable) |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+T` | Open new tab |
| `Ctrl+W` | Close current tab |
| `Ctrl+Shift+T` | Reopen recently closed tab |
| `Ctrl+Shift+N` | Open new Private Window |
| `Ctrl+L` | Focus address bar |
| `Ctrl+R` | Reload current page |
| `Ctrl+D` | Bookmark current page |
| `Ctrl+H` | Open browsing history (`nova://history`) |
| `Ctrl+J` | Open downloads (`nova://downloads`) |
| `Ctrl+B` | Toggle bookmarks bar |
| `Ctrl+F` | Find in page |
| `Ctrl++` / `Ctrl+-` | Zoom in / Zoom out |
| `Ctrl+0` | Reset zoom to 100% |
| `Alt+Left` / `Alt+Right` | Navigate back / forward |
| `Ctrl+1` – `Ctrl+8` | Switch to tab by index |
| `Ctrl+9` | Switch to last tab |
| `Esc` | Stop loading / close active modal |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Operating System**: Windows 10 / 11

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Rajath-nayakk/nova-browser.git
cd nova-browser
npm install
```

### 2. Development Mode
Start the development server with Vite hot-reload and Electron:
```bash
npm run dev
```

### 3. Automated Testing & Verification
Run the complete unit and security test suite:
```bash
npm test
```

Perform strict TypeScript typechecking:
```bash
npm run typecheck
```

Verify dependency security:
```bash
npm audit
```

### 4. Production Build
Compile production bundles:
```bash
npm run build
```

### 5. Windows Packaging
Generate the Windows NSIS Installer (`release/NOVA Browser-Setup-1.0.0.exe`):
```bash
npm run package:win
```

---

## 📁 Project Structure

```
nova-browser/
├── package.json               # Dependencies, scripts, and build configuration
├── tsconfig.json              # TypeScript root configuration
├── vite.config.ts             # Vite frontend bundler config
├── vitest.config.ts           # Vitest unit test runner config
├── src/
│   ├── main/                  # Electron Main Process
│   │   ├── index.ts           # Window lifecycle, WebContentsView tabs, IPC handlers
│   │   ├── filterEngine.ts    # NOVA Shield (@ghostery/adblocker, EasyList, YouTube)
│   │   ├── threatProtection.ts# NOVA Sentinel (offline threats.json, homoglyph check)
│   │   ├── vault.ts           # NOVA Vault (PBKDF2 + AES-256-GCM local encryption)
│   │   ├── storage.ts         # Atomic local storage manager (settings, history, bookmarks)
│   │   └── blocklist.ts       # Fallback domain rule definitions
│   ├── preload/               # Preload Script
│   │   └── index.ts           # Secure contextBridge API (`window.novaAPI`)
│   ├── shared/                # Shared Types, Constants & Validation
│   │   ├── types.ts           # Shared interfaces (Tab, Profile, Vault, Settings, etc.)
│   │   ├── constants.ts       # Layout metrics, defaults, internal URLs
│   │   └── validation.ts      # Link Lens analysis, lookalike detection, tracking sanitization
│   └── renderer/              # React User Interface
│       ├── index.html         # HTML root document
│       └── src/
│           ├── main.tsx       # React mounting entrypoint
│           ├── App.tsx        # Top-level browser state & layout orchestrator
│           ├── index.css      # Design tokens, glassmorphism, responsive themes
│           ├── components/    # Reusable UI controls
│           │   ├── NovaLogo.tsx          # Brand mark cosmic shield component
│           │   ├── TitleBar.tsx          # Multi-tab strip, new tab, window controls
│           │   ├── Navbar.tsx            # Navigation, address bar, quick triggers
│           │   ├── AddressBar.tsx        # Smart omnibox, TLS indicator, suggestions
│           │   ├── PrivacyShieldPopup.tsx# Shield metrics, threat stats, allowlist toggle
│           │   ├── LinkLensModal.tsx     # Deep link inspection dialog
│           │   ├── MainMenu.tsx          # 3-dots application menu
│           │   └── ...                   # Additional dialogs and toolbars
│           └── views/         # Built-in internal pages (nova://...)
│               ├── StartPage.tsx         # nova://newtab (Quick dials, clock, search)
│               ├── SettingsView.tsx      # nova://settings (9-panel Control Center)
│               ├── WarningView.tsx       # nova://warning (Sentinel threat interstitial)
│               ├── VaultView.tsx         # nova://vault (Encrypted secrets manager)
│               ├── BookmarksView.tsx     # nova://bookmarks (Full manager)
│               ├── HistoryView.tsx       # nova://history (Date-grouped local history)
│               └── DownloadsView.tsx     # nova://downloads (Active & past files)
└── tests/
    ├── security/
    │   └── security.test.ts   # Electron sandbox, IPC validation, CSP tests
    └── unit/
        ├── filterEngine.test.ts     # Shield rule matching & cosmetic CSS tests
        ├── threatProtection.test.ts # Sentinel phishing & homograph tests
        ├── vault.test.ts            # Encrypted vault PBKDF2/AES-GCM tests
        ├── validation.test.ts       # Link Lens & URL normalization tests
        ├── blocklist.test.ts        # Domain matching tests
        └── storage.test.ts          # Atomic persistence & recovery tests
```

---

## 🔒 Security & Privacy Architecture

- **Zero Remote Telemetry:** No user activity, keystrokes, URLs, or hardware metrics are transmitted to any external server.
- **Atomic Local Storage:** Critical files are written atomically (`write to .tmp -> rename`) inside `%APPDATA%/nova-browser/nova_data/`. Damaged files are safely backed up and restored without application crashes.
- **Chromium Native Engine:** Web pages are rendered natively in Electron's `WebContentsView` with `nodeIntegration: false` and `contextIsolation: true`.
- **Code Signing:** The community installer is currently unsigned. Users installing on Windows may encounter an "Unknown Publisher" advisory. Binary SHA-256 checksums are published with every GitHub Release.

---

## 📜 License
MIT License. Built with pride for an open, private web.
