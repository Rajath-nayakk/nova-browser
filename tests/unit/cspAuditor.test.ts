import { describe, it, expect } from 'vitest';
import {
  parseCspHeader,
  auditContentSecurityPolicy,
  auditSecurityHeaders,
} from '../../src/shared/cspAuditor';

describe('Content Security Policy & Network Security Auditor', () => {
  describe('parseCspHeader', () => {
    it('parses single directive properly', () => {
      const parsed = parseCspHeader("default-src 'self'");
      expect(parsed['default-src']).toEqual(["'self'"]);
    });

    it('parses multiple directives separated by semicolons', () => {
      const header = "default-src 'self'; script-src 'self' https://apis.google.com; object-src 'none'";
      const parsed = parseCspHeader(header);

      expect(parsed['default-src']).toEqual(["'self'"]);
      expect(parsed['script-src']).toEqual(["'self'", 'https://apis.google.com']);
      expect(parsed['object-src']).toEqual(["'none'"]);
    });

    it('handles empty or non-string inputs safely', () => {
      expect(parseCspHeader('')).toEqual({});
      expect(parseCspHeader(null as any)).toEqual({});
      expect(parseCspHeader(undefined as any)).toEqual({});
    });
  });

  describe('auditContentSecurityPolicy', () => {
    it('rates absent CSP header as Grade F (score 0)', () => {
      const result = auditContentSecurityPolicy(undefined);
      expect(result.score).toBe(0);
      expect(result.grade).toBe('F');
      expect(result.status).toBe('absent');
      expect(result.findings.some((f) => f.severity === 'critical')).toBe(true);
    });

    it('detects unsafe-inline and reduces security score', () => {
      const raw = "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
      const result = auditContentSecurityPolicy(raw);

      expect(result.hasUnsafeInline).toBe(true);
      expect(result.score).toBeLessThan(100);
      expect(result.findings.some((f) => f.directive === 'script-src' && f.severity === 'high')).toBe(true);
    });

    it('detects unsafe-eval and reduces security score', () => {
      const raw = "default-src 'self'; script-src 'self' 'unsafe-eval'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
      const result = auditContentSecurityPolicy(raw);

      expect(result.hasUnsafeEval).toBe(true);
      expect(result.score).toBeLessThan(100);
      expect(result.findings.some((f) => f.directive === 'script-src' && f.severity === 'medium')).toBe(true);
    });

    it('detects wildcard host and insecure http in script sources as critical', () => {
      const raw = "default-src 'self'; script-src * http:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
      const result = auditContentSecurityPolicy(raw);

      expect(result.hasWildcardHost).toBe(true);
      expect(result.findings.some((f) => f.severity === 'critical')).toBe(true);
    });

    it('rewards hardened, zero-trust CSP with Grade A+ (score 100)', () => {
      const strictHeader =
        "default-src 'none'; script-src 'self' 'nonce-rAnd0m'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
      const result = auditContentSecurityPolicy(strictHeader);

      expect(result.score).toBe(100);
      expect(result.grade).toBe('A+');
      expect(result.status).toBe('optimal');
      expect(result.blocksObject).toBe(true);
      expect(result.blocksFraming).toBe(true);
      expect(result.hasUnsafeInline).toBe(false);
      expect(result.hasUnsafeEval).toBe(false);
    });
  });

  describe('auditSecurityHeaders', () => {
    it('evaluates comprehensive security posture with full headers', () => {
      const headers = {
        'content-security-policy': "default-src 'none'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
        'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'referrer-policy': 'strict-origin-when-cross-origin',
      };

      const audit = auditSecurityHeaders('https://secure.bank.com/dashboard', headers);

      expect(audit.domain).toBe('secure.bank.com');
      expect(audit.score).toBeGreaterThanOrEqual(90);
      expect(audit.grade).toBe('A+');
      expect(audit.hsts.present).toBe(true);
      expect(audit.hsts.valid).toBe(true);
      expect(audit.hsts.includeSubDomains).toBe(true);
      expect(audit.hsts.preload).toBe(true);
      expect(audit.xContentTypeOptions.isNoSniff).toBe(true);
      expect(audit.xFrameOptions.value).toBe('DENY');
    });

    it('flags missing HSTS and nosniff headers on insecure origins', () => {
      const headers = {
        'content-security-policy': "default-src * 'unsafe-inline'",
      };

      const audit = auditSecurityHeaders('http://insecure-site.org/page', headers);

      expect(audit.hsts.present).toBe(false);
      expect(audit.xContentTypeOptions.isNoSniff).toBe(false);
      expect(audit.score).toBeLessThan(60);
      expect(audit.findings.some((f) => f.directive === 'strict-transport-security')).toBe(true);
      expect(audit.findings.some((f) => f.directive === 'x-content-type-options')).toBe(true);
    });
  });
});
