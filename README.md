# NOVA Browser 🛡️

**NOVA Browser** is a fast, modern, privacy-first desktop web browser built from scratch with Electron, React, TypeScript, and Vite. It is engineered with zero commercial noise: **no advertisements in the browser UI, zero application telemetry, no sponsored search placements, and complete local-only data storage.**

---

## 🌟 Key Features

### 1. Privacy By Default
- **Zero Telemetry:** Absolutely no analytics SDKs, session recording, usage metrics, or crash uploads.
- **Privacy Shield:** High-performance, categorized network request blocker targeting tracking domains, advertising networks, analytics scripts, and cryptominers.
- **Header Injection:** Enforces `DNT: 1` (Do Not Track) and `Sec-GPC: 1` (Global Privacy Control) on every outgoing web request.
- **Query Parameter Cleaner:** Automatically strips pervasive tracking tokens (`utm_*`, `fbclid`, `gclid`, `msclkid`, etc.) from navigated URLs.
- **Local Data Only:** Bookmarks, history, settings, and download records are stored in atomic local JSON stores on the user's computer.

### 2. Genuine Desktop Browser Engine
- **Chromium Native Engine:** Powered by Electron's modern `WebContentsView` architecture. Real web pages are rendered natively—**never in a simulated iframe**.
- **Full Navigation:** Back, Forward, Reload, Stop, Home, and smooth in-page navigation.
- **Padlock & TLS Security:** Transparent connection security indicators with full TLS certificate details. Insecure connections or certificate failures are prominently flagged.
- **Smart Omnibox:** Intelligent address bar accepting full URLs, naked domains, local endpoints (`localhost`, `127.0.0.1`), and search queries with local-only autocomplete.

### 3. Tab Management & Session Isolation
- **Multi-Tab Architecture:** Create, switch, reorder, mute, and close tabs with instant resource cleanup.
- **Reopen Closed Tabs:** `Ctrl+Shift+T` restores recently closed web tabs.
- **Private Browsing Window (`Ctrl+Shift+N`):** Non-persistent, isolated in-memory session partition (`partition: 'incognito-...'`). Never writes to disk history or saves persistent cookies.

### 4. Security Architecture
- **Deny-by-Default Device Permissions:** Camera, microphone, geolocation, and notifications are blocked unless explicitly authorized via an interactive prompt.
- **Safe Downloads Manager:** Intercepts downloads with explicit save path confirmation. Never silently executes files; highlights executable binaries (`.exe`, `.bat`, etc.) with warnings.
- **Strict Sandboxing:** Website rendering runs with context isolation enabled and Node.js integration disabled.
- **Find in Page:** Floating search tool (`Ctrl+F`) with match counter, forward/backward navigation, and keyboard controls.

### 5. Built-in Internal Views
- `nova://newtab` — Clean start page with privacy search, customizable quick dial shortcuts, and privacy status.
- `nova://bookmarks` — Bookmarks manager with search, editing, and organization.
- `nova://history` — Local history manager grouped by date with selective removal and complete clear controls.
- `nova://downloads` — Downloads manager with file size, progress, and folder access.
- `nova://settings` — Comprehensive settings for search engines, shields, permissions, themes, and storage.

---

## 💻 Technology Stack

| Layer | Technology |
|---|---|
| **Desktop Application** | Electron (v33+) |
| **User Interface** | React 19, TypeScript |
| **Bundler & Build Tool** | Vite 8, esbuild |
| **Styling** | Vanilla CSS Design System with dark & light mode |
| **Iconography** | Lucide React |
| **Test Runner** | Vitest |
| **Packaging** | Electron Builder (NSIS & Portable) |

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
| `Ctrl+H` | Open browsing history |
| `Ctrl+J` | Open downloads |
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
Clone or open the repository directory:
```bash
cd nova-browser
npm install
```

### 2. Development Mode
Run the development environment (starts Vite dev server and launches Electron with hot-reload):
```bash
npm run dev
```

### 3. Run Automated Tests
Execute the automated test suite with Vitest:
```bash
npm test
```

To run TypeScript type checks:
```bash
npm run typecheck
```

### 4. Production Build
Compile the React frontend, Electron main process, and preload scripts into `dist/`:
```bash
npm run build
```

Run the built application:
```bash
npm start
```

### 5. Windows Packaging
Generate the standalone Windows unpacked directory (`release/win-unpacked/NOVA Browser.exe`):
```bash
npm run package:dir
```

Generate the official Windows NSIS Installer (`release/NOVA Browser-Setup-1.0.0.exe`):
```bash
npm run package:win
```

---

## 📁 Project Structure

```
nova-browser/
├── package.json               # Dependencies, scripts, and build metadata
├── tsconfig.json              # TypeScript root configuration
├── vite.config.ts             # Vite frontend bundler config
├── vitest.config.ts           # Vitest unit test runner config
├── assets/                    # Application icons and branding assets
├── src/
│   ├── main/                  # Electron Main Process
│   │   ├── index.ts           # Window management, WebContentsView tabs, IPC
│   │   ├── blocklist.ts       # Privacy Shield tracker & ad filter engine
│   │   └── storage.ts         # Atomic local storage manager
│   ├── preload/               # Preload Script
│   │   └── index.ts           # Secure contextBridge API (`window.novaAPI`)
│   ├── shared/                # Shared Types, Constants & Validation
│   │   ├── types.ts           # TypeScript interfaces (Tab, Bookmark, Settings, etc.)
│   │   ├── constants.ts       # Search engines, layout dimensions, defaults
│   │   └── validation.ts      # URL parsing, sanitization, and security helpers
│   └── renderer/              # React User Interface
│       ├── index.html         # HTML root document
│       └── src/
│           ├── main.tsx       # React 19 mounting entrypoint
│           ├── App.tsx        # Top-level browser state & layout orchestrator
│           ├── index.css      # Design system, CSS tokens, glassmorphism
│           ├── components/    # Reusable UI controls
│           │   ├── TitleBar.tsx          # Tab bar, new tab, window buttons
│           │   ├── Navbar.tsx            # Navigation, address bar, popups
│           │   ├── AddressBar.tsx        # Smart omnibox, TLS indicator, suggestions
│           │   ├── BookmarksBar.tsx      # Quick access bookmark toolbar
│           │   ├── FindInPageBar.tsx     # In-page text search overlay
│           │   ├── PrivacyShieldPopup.tsx# Tracker blocking metrics & site whitelist
│           │   ├── DownloadsPopup.tsx    # Recent downloads dropdown
│           │   ├── MainMenu.tsx          # 3-dots settings & actions menu
│           │   ├── PermissionModal.tsx   # Interactive device access prompt
│           │   ├── ClearDataModal.tsx    # Selective client data purging dialog
│           │   └── AboutModal.tsx        # Version, architecture, and principles
│           └── views/         # Built-in internal pages (nova://...)
│               ├── StartPage.tsx         # nova://newtab (Quick dials & privacy search)
│               ├── BookmarksView.tsx     # nova://bookmarks (Full manager)
│               ├── HistoryView.tsx       # nova://history (Date-grouped local history)
│               ├── DownloadsView.tsx     # nova://downloads (Active & past files)
│               └── SettingsView.tsx      # nova://settings (Customization panel)
└── tests/
    └── unit/
        ├── validation.test.ts # URL normalization & security tests
        ├── blocklist.test.ts  # Privacy Shield filter matching tests
        └── storage.test.ts    # Local storage persistence & corruption recovery
```

---

## 🔒 Privacy & Security Architecture

### Zero Telemetry Guarantee
NOVA Browser contains **no remote telemetry endpoints**. When you open NOVA, type in the address bar, or browse websites, NOVA does not send your keystrokes, bookmarks, visited URLs, or system profile to any server.

### Local Atomic Storage
User data is stored inside `%APPDATA%/nova-browser/nova_data/`:
- `settings.json` — User preferences, theme, and site permissions.
- `bookmarks.json` — User bookmarks and folders.
- `history.json` — Local browsing history (can be disabled at any time).
- `downloads.json` — Download records.

All disk writes are performed atomically (`write to .tmp -> rename`) to prevent file corruption during sudden system shutdowns. If a configuration file is damaged, NOVA safely isolates the corrupted file into a timestamped backup and restores defaults without crashing.

### Honest Security & Privacy Limitations
1. **Internet Service Providers (ISPs):** Unless you connect through an encrypted VPN or DNS-over-HTTPS tunnel, your local network operator or ISP can see domain names queried by your computer.
2. **First-Party Data:** When you log into an online account (e.g. email, social media), that service can track your activity on their domain.
3. **Ad Block Limitations:** Server-side sponsored content and dynamic first-party ads cannot always be completely eliminated without breaking legitimate website logic.

---

## 📜 License
MIT License. Built with pride for private and open computing.
