# Changelog

All notable changes to the **NOVA Browser** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-25

### Added
- **NOVA Brand Identity & Design System**:
  - Distinctive cosmic shield brand mark with central starburst icon.
  - Cohesive design system supporting high-contrast Dark and Light themes.
  - Polished browser toolbar, refined multi-tab strip, and omnibox address bar.
- **NOVA New Tab Experience (`nova://newtab`)**:
  - Live local clock and date widget (customizable toggle).
  - Search engine selector (DuckDuckGo, SearXNG, Brave Search, Google, Custom).
  - Quick Dial grid with customizable website shortcuts and local favicon rendering.
  - Real-time privacy and security status indicators.
  - Quick action launcher for Bookmarks, History, Downloads, Settings, and Encrypted Vault.
- **NOVA Shield (Advanced Content & Ad Blocking)**:
  - Integration with `@ghostery/adblocker` (`FiltersEngine`) pure engine.
  - Bundled EasyList and EasyPrivacy rule compilation for 100% offline out-of-the-box filtering.
  - Advanced cosmetic CSS stylesheet injection to suppress ad wrappers, banners, and empty spaces.
  - Specialized YouTube anti-ad filters (suppression of pre-roll ad requests, companions, and overlays).
  - Per-site allowlist switch to whitelist trusted creators.
  - Tamper-resistant HTTPS filter list updater with rollback to last known-good rules.
- **NOVA Sentinel (Scam & Threat Protection)**:
  - 100% offline, local-only threat database for phishing, scam, and malware domains (`threats.json`).
  - Zero telemetry: zero browsing URLs or hostnames transmitted to external reputation services.
  - IDN Homograph & Punycode detection (`xn--`, Cyrillic/Greek character spoofs).
  - High-impact interstitial warning view (`nova://warning`) with safe return and conscious multi-step bypass.
  - Dangerous executable download detection (`.exe`, `.bat`, `.cmd`, `.msi`, `.ps1`, `.scr`).
- **NOVA Ghost (Private Browsing)**:
  - Ephemeral in-memory session partitions (`incognito-${id}`).
  - Automated session cleanup on window closure (cookies, HTTP cache, storage purged).
  - Honest privacy disclosures regarding ISP and network-level visibility.
- **NOVA Tor Route (Optional Tor Networking)**:
  - SOCKS5 proxy routing via local Tor service (`127.0.0.1:9050`).
  - WebRTC IP leak prevention (`disable_non_proxied_udp`).
  - Transparent documentation of Electron vs Tor Browser C++ anti-fingerprinting.
- **NOVA Identity Profiles**:
  - Isolated profiles: Personal, Work, Shopping, Research.
  - Independent cookies, localStorage, and browsing partitions.
- **NOVA Vault (Local Encrypted Storage)**:
  - PBKDF2 (100,000 iterations, SHA-256) master key derivation.
  - Authenticated AES-256-GCM encryption with 12-byte IV and 16-byte authentication tag.
  - Memory zeroing on lock; protected storage for sensitive notes, credentials, and recovery keys (`nova://vault`).
- **NOVA Link Lens**:
  - Deep URL inspection dialog with homoglyph/punycode warning, tracking parameter removal, and safe clipboard copying.
- **NOVA Control Center (`nova://settings`)**:
  - 9 organized categories: General, Shield, Sentinel, Privacy, Tor, Profiles, Focus, Appearance, About.
- **NOVA Focus**:
  - Focus session timer, distraction-free view, and clock toggle.
- **Comprehensive Test Suite**:
  - 56 passing automated unit and security tests covering filter matching, threat detection, vault encryption, link lens, and local storage recovery.
- **Windows Packaging**:
  - Production-ready NSIS installer (`release/NOVA Browser-Setup-1.0.0.exe`) and portable binary.
