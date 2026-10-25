# NOVA Browser — Threat Model & Security Architecture Specification

## 1. Executive Summary & Philosophy

NOVA Browser is engineered around three foundational tenets:
1. **Defense-in-Depth:** Multiple redundant controls across Main, Preload, and Renderer layers.
2. **Zero Involuntary Telemetry:** All network filtering, phishing checks, and security audits execute 100% locally on the user's device. No browsing destinations or URLs are dispatched to third-party reputation engines.
3. **Rigorous Process Isolation:** Chromium process sandboxing with strictly validated Inter-Process Communication (IPC) boundaries.

---

## 2. Process Boundary & IPC Security Architecture

```
+-------------------------------------------------------------------+
|                        ELECTRON MAIN PROCESS                      |
|  - Process lifecycle & window orchestration                       |
|  - WebContentsView container & tab layout                         |
|  - Local storage & AES-256-GCM Encrypted Vault                   |
|  - AdBlocker network filter & threat intelligence engine          |
|  - Cookie lifetime cap & CSP header auditor                       |
|  - Tor SOCKS5 circuit dispatcher                                  |
+-------------------------------------------------------------------+
                                ^
                                | IPC with assertAuthorizedSender()
                                v
+-------------------------------------------------------------------+
|                     PRELOAD CONTEXT BRIDGE                        |
|  - contextIsolation: true                                         |
|  - nodeIntegration: false                                         |
|  - Strictly typed novaAPI namespace                               |
|  - Zero leakage of raw ipcRenderer or Node modules                |
+-------------------------------------------------------------------+
                                ^
                                | Pure JavaScript Object Reference
                                v
+-------------------------------------------------------------------+
|                   RENDERER BROWSER CHROME (React)                 |
|  - UI Tabs, address bar, bookmarks, history, settings            |
|  - WebContentsViews rendered as isolated OS-level child views     |
+-------------------------------------------------------------------+
```

### 2.1 IPC Authorization Gate (`assertAuthorizedSender`)

A common vulnerability in Electron applications is malicious child frames or rogue renderer webContents sending IPC messages intended only for the primary browser chrome.

NOVA Browser mitigates this through `assertAuthorizedSender(event)`:
- Every `ipcMain.handle` and `ipcMain.on` invocation verifies that `event.sender === mainWindow.webContents`.
- Messages originating from third-party WebContentsViews, embedded iframes, or non-chrome windows are immediately rejected with an `Unauthorized IPC sender` exception.
- Payload arguments are strictly validated against TypeScript schema definitions with defensive null/type checking.

### 2.2 Sandboxing & Execution Contexts

- **Node Integration:** Disabled (`nodeIntegration: false`) across all browser chrome and guest views.
- **Context Isolation:** Enabled (`contextIsolation: true`) to ensure prototypes between the Preload script and web application scripts are physically decoupled.
- **WebPreferences Lockdown:**
  - `webSecurity: true`
  - `allowRunningInsecureContent: false`
  - `webviewTag: false`

---

## 3. Threat Defense & Mitigations

| Threat Vector | Attack Mechanism | NOVA Browser Mitigation |
| :--- | :--- | :--- |
| **Phishing & Brand Impersonation** | Visual spoofing of high-value brands (e.g. `g00gle.com`, `paypa1.com`) | Levenshtein distance typosquatting engine + IDN Punycode homograph defense in `src/shared/validation.ts`. Routes to `nova://warning`. |
| **Malware Downloads** | Drive-by downloads of dangerous binaries (`.exe`, `.bat`, `.cmd`, `.msi`, `.ps1`) | Automatic file extension screening, SHA-256 integrity calculator, and explicit user execution confirmation prompt. |
| **Cross-Site Scripting (XSS)** | Injection of malicious inline JavaScript | Content Security Policy (CSP) static auditor analyzes response headers, penalizing `'unsafe-inline'` and wildcard hosts (`*`). |
| **Cross-Site Tracking** | Third-party tracking cookies persisting across domains | Automatic 24-hour cookie lifetime capping for third-party trackers; option to strip cookies and cache on browser exit. |
| **Tracking URL Leakage** | Appended campaign and user tracking parameters (`utm_*`, `fbclid`, `gclid`) | Automatic URL parameter sanitization engine (`stripTrackingParameters`) on address bar copy and link navigation. |
| **Clickjacking & UI Redressing** | Embedding sensitive pages inside invisible iframes | CSP `frame-ancestors` and `X-Frame-Options` inspection with audit grading in AddressBar badge. |
| **Network Snooping (MITM)** | Intercepting unencrypted cleartext HTTP traffic | Native Chromium TLS certificate verification, HSTS enforcement detection, and cipher suite inspector (`TLS_AES_256_GCM_SHA384`). |
| **IP Leakage over Tor** | WebRTC STUN/TURN queries leaking public IPv4/IPv6 | WebRTC policy locked to `disable_non_proxied_udp` when Tor mode is activated. |
| **Renderer Memory Corruption / Crash** | Out-of-memory or heap exhaustion in complex web pages | Renderer crash detection (`render-process-gone`) with automatic crash recovery routing to `nova://error?code=ERR_RENDERER_CRASHED`. |

---

## 4. Cryptographic Specification (NOVA Vault)

The NOVA Encrypted Vault (`src/main/vault.ts`) implements enterprise-grade local secrets encryption:

1. **Algorithm:** AES-256-GCM (Authenticated Encryption with Associated Data).
2. **Key Derivation Function:** PBKDF2 with HMAC-SHA-256.
   - **Salt:** 32 cryptographically secure random bytes generated via `crypto.randomBytes(32)`.
   - **Iterations:** 100,000 rounds.
   - **Derived Key Length:** 256 bits (32 bytes).
3. **Initialization Vector (IV):** 12 cryptographically random bytes generated fresh on each encryption cycle.
4. **Authentication Tag:** 16-byte GCM authentication tag verifying ciphertext integrity before decryption.
5. **Memory Sanitization:**
   - Master passwords and derived encryption keys are explicitly zeroed out (`Buffer.fill(0)`) when the vault is locked or closed.
   - Decrypted items are stored only in volatile process memory and never written to plain-text disk storage.

---

## 5. Security Audit Checklist for Developers

When contributing code to NOVA Browser:
- [ ] Never pass raw user-entered input directly into `shell.openExternal` or `child_process.exec`.
- [ ] Verify that all navigation targets are vetted by `isSafeNavigationUrl` (block `file:`, `javascript:`, `data:`).
- [ ] Ensure all IPC handlers call `assertAuthorizedSender(event)`.
- [ ] Run `npm run typecheck` and `npm test` before committing.
- [ ] Never import Node.js built-in modules (`fs`, `net`, `crypto`, `path`) into files compiled for the renderer process.
