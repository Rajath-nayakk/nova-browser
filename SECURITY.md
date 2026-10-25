# NOVA Browser — Security Policy & Architecture

## Security Philosophy

NOVA Browser is engineered around a strict principle: **defense-in-depth, zero unprompted outbound telemetry, and transparent user agency.** 

We do not believe in security-by-obscurity or claiming immunity to web threats. Instead, we implement verifiable boundaries across the browser's execution layers and disclose all technical limits honestly.

---

## 1. Multi-Layer Security Architecture

### A. Process Isolation & Renderer Sandboxing
- **Context Isolation Enforced:** Renderer scripts run in isolated V8 contexts. Web pages cannot access or modify internal browser APIs.
- **Node.js Integration Disabled:** `nodeIntegration: false` is strictly enforced on all `WebContentsView` instances and child browser windows.
- **Sandboxing:** Browser renderer instances run within Chromium process sandboxes without administrative or direct file system capabilities.
- **IPC Validation:** All Inter-Process Communication channels (`ipcRenderer.invoke`) undergo schema and origin validation in `src/main/index.ts`. No arbitrary renderer commands are executed.

### B. Navigation & Protocol Defense
- **Safe Protocols Only:** Only `http:`, `https:`, and internal `nova:` schemes are permitted. Dangerous protocols (`javascript:`, `data:`, `file:`, `blob:`, `vbscript:`, custom shell handlers) are blocked from URL bar navigation.
- **Strict Content Security Policy (CSP):** Internal browser pages (`nova://*`) enforce restrictive CSP directives prohibiting inline remote scripts and unverified script sources.
- **TLS Certificate Validation:** NOVA preserves Chromium's native TLS certificate validation. Expired, revoked, or untrusted SSL/TLS certificates cannot be silently bypassed.

### C. NOVA Sentinel — Scam & Threat Protection
- **100% Offline Local Lookup:** Threat matching is performed against bundled and locally updated databases (`threats.json`). Unlike Google Safe Browsing or Microsoft SmartScreen, **zero URLs, hostnames, or browsing history are ever transmitted to remote reputation servers.**
- **IDN Homograph & Punycode Defense:** Automatic detection of Cyrillic/Greek lookalike glyphs and `xn--` punycode spoofs of high-value domains (`paypal.com`, `google.com`, `apple.com`, `chase.com`, etc.).
- **Deliberate Bypass Interstitial:** Known threats immediately route to `nova://warning`. Bypassing requires conscious multi-step user confirmation, preventing accidental click-throughs.
- **Download Reputation & Path Safety:** Downloads are checked for dangerous executable extensions (`.exe`, `.bat`, `.cmd`, `.msi`, `.ps1`, `.scr`). Downloaded files are never automatically executed.

### D. NOVA Shield — Ad & Content Filtering
- **High-Performance Filter Engine:** Integrates `@ghostery/adblocker` (`FiltersEngine`), compiling EasyList, EasyPrivacy, and specialized YouTube anti-ad rules into binary memory models.
- **Cosmetic & Network Filtering:** Suppresses intrusive ad network requests, tracking endpoints, and cryptominers while injecting non-breaking cosmetic CSS element-hiding rules.
- **Per-Site Allowlist:** Users retain granular per-site control to whitelist trusted sites or publishers.
- **Tamper-Resistant Updates:** Filter updates over HTTPS are strictly validated; failed or malformed updates roll back to last-known-good definitions.

### E. NOVA Ghost — Private Browsing
- **In-Memory Partitions:** Private browsing tabs and windows use dedicated ephemeral session partitions (`incognito-${id}`).
- **Zero Disk Residue:** Cookies, HTTP caches, DOM storage, and session records exist exclusively in RAM and are purged upon window closure.
- **Realistic Privacy Disclosures:** Ghost mode prevents local disk history logging; it does not conceal browsing activity from internet service providers, network administrators, or destination web servers.

### F. NOVA Tor Route — Optional Tor Networking
- **SOCKS5 Proxy Tunneling:** When enabled, browser traffic is routed through a local Tor daemon (default `127.0.0.1:9050`).
- **WebRTC IP Leak Prevention:** WebRTC is locked to `disable_non_proxied_udp`, preventing local or public IP address exposure via STUN/TURN queries.
- **Honest Security Disclosure:** Electron does not integrate the Tor Project's low-level C++ canvas/font anti-fingerprinting patches. Users facing high-threat adversaries (nation-states, targeted surveillance) should use the official **Tor Browser**.

### G. NOVA Vault — Local Encrypted Storage
- **Authenticated Cryptography:** Encrypted with **AES-256-GCM** using a 12-byte cryptographically secure random IV generated on every save.
- **Robust Key Derivation:** Master passwords derive 256-bit keys using **PBKDF2** (HMAC-SHA-256) with 100,000 iterations and a 32-byte random salt.
- **Zero Memory Residue:** Master passwords are never written to disk; key buffers in memory are explicitly zeroed out (`Buffer.fill(0)`) upon locking.

---

## 2. Responsible Disclosure & Reporting Vulnerabilities

If you discover a security vulnerability in NOVA Browser, please do **NOT** open a public GitHub issue.

Please report vulnerabilities privately:
- **Email:** security@novabrowser.dev (or via private GitHub Vulnerability Reporting on [Rajath-nayakk/nova-browser](https://github.com/Rajath-nayakk/nova-browser))
- **Response Window:** We acknowledge security reports within 48 hours and provide a remediation timeline within 7 days.
- **PGP Key:** Available upon request.

Please include:
1. Clear steps to reproduce the issue (PoC).
2. The operating system and NOVA Browser version tested.
3. Potential impact and attack vector.

---

## 3. Code Signing & Installer Verification

The current community Windows installer (`NOVA Browser-Setup-1.0.0.exe`) is generated using standard NSIS. **It is not signed with an EV Code Signing Certificate.** 

Windows SmartScreen may display an *"Unknown Publisher"* advisory on first install until application reputation builds. Binary SHA-256 checksums are published with every official release.
