# Contributing to NOVA Browser

Thank you for your interest in contributing to **NOVA Browser**! We are committed to building an honest, privacy-first web browser with zero advertisements and zero surveillance.

---

## 🧭 Code of Conduct & Guiding Principles

1. **Zero Telemetry Non-Negotiable:** PRs adding analytics libraries, remote tracking pixels, third-party error trackers, or unprompted network calls will be rejected immediately.
2. **Local-First Data Storage:** All user history, bookmarks, vault secrets, and profile information must remain on the user's local disk.
3. **Honest Security & Privacy:** Never make claims of absolute anonymity. Always disclose the boundaries of private browsing and Tor routing honestly.
4. **Clean Code & Strong Types:** All code must be written in TypeScript with full strict typing. Run `npm run typecheck` and `npm test` before submitting.

---

## 🛠️ Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Rajath-nayakk/nova-browser.git
   cd nova-browser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development mode with hot-reloading:
   ```bash
   npm run dev
   ```

4. Run the test suite:
   ```bash
   npm test
   ```

5. Run typecheck:
   ```bash
   npm run typecheck
   ```

6. Build production bundles:
   ```bash
   npm run build
   ```

---

## 📋 Pull Request Guidelines

- Ensure all new features or bug fixes include corresponding unit or security tests in `tests/unit/` or `tests/security/`.
- Verify that `npm run typecheck` and `npm test` pass with 0 errors.
- Ensure `npm audit` reports 0 vulnerabilities.
- Provide a clear PR description explaining the rationale, security implications, and testing performed.
