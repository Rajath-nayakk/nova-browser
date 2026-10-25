# NOVA Browser — Incremental Development Roadmap

This living roadmap tracks the structured, iterative engineering milestones for NOVA Browser. Every task represents a real, independently testable and reviewable improvement to security, privacy, performance, user experience, and browser capabilities.

---

## 🗺️ Milestone Tracker

### Milestone 1: Navigation, Tab Ergonomics & UI Polish
- [x] **M1.1**: Add tab pinning functionality (`isPinned`) to preserve persistent work tabs across sessions.
- [x] **M1.2**: Add tab duplication (`duplicateTab`) and context menu options on tabs.
- [x] **M1.3**: Implement audio playback indicator on tabs with one-click quick mute toggle.
- [x] **M1.4**: Add a Page Loading Progress Bar to the Navbar for visual feedback during network requests.
- [x] **M1.5**: Implement a Toast notification system (`ToastContext`) for non-blocking feedback (e.g., "Copied clean URL", "Bookmark saved").
- [x] **M1.6**: Add URL copy and page sharing actions to Navbar / AddressBar.
- [x] **M1.7**: Add zoom control indicators and reset buttons (`100%`) in Navbar.

### Milestone 2: Bookmarks, History & Data Mobility
- [x] **M2.1**: Implement Netscape Bookmark Format HTML import (`importBookmarksHtml`).
- [x] **M2.2**: Implement Netscape Bookmark Format HTML export (`exportBookmarksHtml`).
- [x] **M2.3**: Add folder hierarchy support for bookmarks (`folderId`, nested subfolders).
- [x] **M2.4**: Add date range filtering and domain aggregation view in History (`nova://history`).
- [x] **M2.5**: Add quick-clear history for "Last hour", "Last 24 hours", "Last 7 days", "All time".

### Milestone 3: Downloads Safety & Management
- [ ] **M3.1**: Implement download pause, resume, and cancel controls via Electron IPC.
- [x] **M3.2**: Add SHA-256 file checksum calculation and verification in Downloads view (`nova://downloads`).
- [x] **M3.3**: Add dangerous download warning prompt with explicit user acknowledgement before opening executable files.
- [ ] **M3.4**: Add download speed and estimated time remaining (ETA) calculation.

### Milestone 4: NOVA Shield & Sentinel Enhancements
- [x] **M4.1**: Add Custom User Filter Rules support (allow users to add custom Adblock Plus/uBlock syntax rules in Settings).
- [ ] **M4.2**: Implement Live Blocked Elements Inspector / Logger dialog (`PrivacyShieldPopup`).
- [x] **M4.3**: Add anti-circumvention scriptlet injection safeguards for video ad evasion.
- [x] **M4.4**: Enhance lookalike domain heuristics with Levenshtein distance typosquatting scores against top 100 brands.
- [x] **M4.5**: Add SSL certificate expiration and cipher suite details in connection security popover.

### Milestone 5: Privacy Controls, Profiles & Vault
- [x] **M5.1**: Add per-site permission manager panel in Settings (`nova://settings` -> Permissions).
- [x] **M5.2**: Implement automatic cookie & cache clearing on window exit (configurable in Privacy Settings).
- [ ] **M5.3**: Add custom profile avatar icons and color theme accents for multi-profile isolation.
- [x] **M5.4**: Add clipboard auto-clear timer (30 seconds) when copying sensitive credentials in NOVA Vault.
- [x] **M5.5**: Add encrypted vault backup export and import (`.novavault` format with master password).

### Milestone 6: Accessibility, Shortcuts & Error Handling
- [x] **M6.1**: Implement interactive Keyboard Shortcuts Cheat Sheet modal (`Ctrl+/` or `?`).
- [x] **M6.2**: Add internal Error View (`nova://error`) for offline state, DNS failures, and connection timeouts.
- [ ] **M6.3**: Implement diagnostic logging viewer (`nova://logs`) for inspecting local security events without leaking user data.
- [ ] **M6.4**: Full ARIA accessibility audit and keyboard focus ring enhancements across all dialogs.

### Milestone 7: Performance, Tab Suspension & Memory Management
- [x] **M7.1**: Implement automatic tab discard / memory suspension for inactive background tabs after configurable timeout.
- [x] **M7.2**: Implement manual "Suspend Tab" action in tab context menu.
- [ ] **M7.3**: Optimize startup cold-boot by lazy-loading non-active tab webviews.

### Milestone 8: Automation, CI/CD & Cross-Platform Packaging
- [x] **M8.1**: Create GitHub Actions CI workflow for automated linting, typechecks, and Vitest runs.
- [ ] **M8.2**: Add release packaging automation for Windows portable and NSIS artifacts.

---
*Roadmap updated continuously as features are designed, implemented, tested, and committed.*
