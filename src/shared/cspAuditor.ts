/**
 * Content Security Policy (CSP) & Network Security Header Auditor
 * Provides enterprise-grade static analysis for web application security headers.
 */

export type CspSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CspFinding {
  directive: string;
  severity: CspSeverity;
  message: string;
  remediation?: string;
}

export interface CspAuditResult {
  rawHeader?: string;
  directives: Record<string, string[]>;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'optimal' | 'moderate' | 'weak' | 'absent';
  findings: CspFinding[];
  hasUnsafeInline: boolean;
  hasUnsafeEval: boolean;
  hasWildcardHost: boolean;
  blocksObject: boolean;
  blocksFraming: boolean;
}

export interface SecurityHeadersAuditResult {
  url: string;
  domain: string;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  csp: CspAuditResult;
  hsts: {
    present: boolean;
    includeSubDomains: boolean;
    preload: boolean;
    maxAge?: number;
    valid: boolean;
  };
  xContentTypeOptions: {
    present: boolean;
    isNoSniff: boolean;
  };
  xFrameOptions: {
    present: boolean;
    value?: string;
  };
  referrerPolicy: {
    present: boolean;
    value?: string;
  };
  findings: CspFinding[];
}

/**
 * Parses raw CSP header string into directive tokens.
 */
export function parseCspHeader(rawHeader: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!rawHeader || typeof rawHeader !== 'string') return result;

  const directiveStrings = rawHeader.split(';').map((d) => d.trim()).filter(Boolean);

  for (const dirStr of directiveStrings) {
    const parts = dirStr.split(/\s+/).filter(Boolean);
    if (parts.length === 0) continue;

    const dirName = parts[0].toLowerCase();
    const sources = parts.slice(1).map((s) => s.trim().toLowerCase());
    result[dirName] = sources;
  }

  return result;
}

/**
 * Audits a raw Content-Security-Policy header string for vulnerabilities and posture weaknesses.
 */
export function auditContentSecurityPolicy(rawHeader?: string): CspAuditResult {
  if (!rawHeader || !rawHeader.trim()) {
    return {
      rawHeader: undefined,
      directives: {},
      score: 0,
      grade: 'F',
      status: 'absent',
      findings: [
        {
          directive: 'general',
          severity: 'critical',
          message: 'No Content-Security-Policy header configured. Site is vulnerable to cross-site scripting (XSS) and code injection.',
          remediation: "Deploy a strict CSP with default-src 'self' and nonces or hashes for scripts.",
        },
      ],
      hasUnsafeInline: false,
      hasUnsafeEval: false,
      hasWildcardHost: false,
      blocksObject: false,
      blocksFraming: false,
    };
  }

  const directives = parseCspHeader(rawHeader);
  const findings: CspFinding[] = [];
  let score = 100;

  const scriptSrc = directives['script-src'] || directives['default-src'] || [];
  const objectSrc = directives['object-src'] || directives['default-src'] || [];
  const baseUri = directives['base-uri'] || [];
  const frameAncestors = directives['frame-ancestors'] || [];

  // Check 1: 'unsafe-inline' in script sources
  const hasUnsafeInline = scriptSrc.includes("'unsafe-inline'");
  if (hasUnsafeInline) {
    score -= 30;
    findings.push({
      directive: 'script-src',
      severity: 'high',
      message: "Detected 'unsafe-inline' without strict nonce/hash protection. Enables reflected and stored XSS.",
      remediation: "Remove 'unsafe-inline' and utilize cryptographically random nonces or SHA hashes.",
    });
  }

  // Check 2: 'unsafe-eval' in script sources
  const hasUnsafeEval = scriptSrc.includes("'unsafe-eval'");
  if (hasUnsafeEval) {
    score -= 15;
    findings.push({
      directive: 'script-src',
      severity: 'medium',
      message: "Detected 'unsafe-eval'. Allows dynamic string execution via eval() and setTimeout(string).",
      remediation: "Refactor dynamic evaluation to use native JSON parsers and structured data.",
    });
  }

  // Check 3: Wildcard * or insecure http: in script or default sources
  const hasWildcardHost = scriptSrc.includes('*') || scriptSrc.includes('http:');
  if (hasWildcardHost) {
    score -= 25;
    findings.push({
      directive: 'script-src',
      severity: 'critical',
      message: 'Permits wildcards (*) or unencrypted HTTP (http:) in script sources. Trivially bypassed.',
      remediation: "Restrict sources to explicit origins or 'self' with HTTPS.",
    });
  }

  // Check 4: Flash / Java Plugin object execution
  const blocksObject = objectSrc.includes("'none'") || (objectSrc.length === 1 && objectSrc[0] === "'none'");
  if (!blocksObject) {
    score -= 10;
    findings.push({
      directive: 'object-src',
      severity: 'medium',
      message: "Missing 'object-src \\'none\\''. Exposes the application to legacy plugin vulnerabilities.",
      remediation: "Add 'object-src \\'none\\'' to the CSP header.",
    });
  }

  // Check 5: Base URI injection (<base href="...">)
  const restrictsBaseUri = baseUri.includes("'self'") || baseUri.includes("'none'");
  if (!restrictsBaseUri) {
    score -= 10;
    findings.push({
      directive: 'base-uri',
      severity: 'low',
      message: "Missing 'base-uri \\'self\\' or \\'none\\''. Attackers may hijack relative URLs via base tag injection.",
      remediation: "Set 'base-uri \\'self\\''.",
    });
  }

  // Check 6: Frame Ancestors (Clickjacking defense)
  const blocksFraming =
    frameAncestors.includes("'none'") ||
    frameAncestors.includes("'self'") ||
    directives['frame-ancestors'] !== undefined;
  if (!blocksFraming) {
    score -= 10;
    findings.push({
      directive: 'frame-ancestors',
      severity: 'low',
      message: "Missing 'frame-ancestors'. Leaves application vulnerable to UI redressing (Clickjacking).",
      remediation: "Specify 'frame-ancestors \\'none\\'' or 'frame-ancestors \\'self\\' <trusted-domains>'.",
    });
  }

  // Bound score [0, 100]
  score = Math.max(0, Math.min(100, score));

  // Determine Grade
  let grade: CspAuditResult['grade'] = 'F';
  let status: CspAuditResult['status'] = 'weak';

  if (score >= 95) {
    grade = 'A+';
    status = 'optimal';
  } else if (score >= 85) {
    grade = 'A';
    status = 'optimal';
  } else if (score >= 70) {
    grade = 'B';
    status = 'moderate';
  } else if (score >= 50) {
    grade = 'C';
    status = 'moderate';
  } else if (score >= 30) {
    grade = 'D';
    status = 'weak';
  }

  return {
    rawHeader,
    directives,
    score,
    grade,
    status,
    findings,
    hasUnsafeInline,
    hasUnsafeEval,
    hasWildcardHost,
    blocksObject,
    blocksFraming,
  };
}

/**
 * Normalizes HTTP header lookup regardless of case.
 */
function getHeader(headers: Record<string, string | string[]>, name: string): string | undefined {
  const target = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) {
      if (Array.isArray(v)) return v[0];
      return v;
    }
  }
  return undefined;
}

/**
 * Comprehensive evaluator for all primary web defense response headers.
 */
export function auditSecurityHeaders(
  url: string,
  headers: Record<string, string | string[]>
): SecurityHeadersAuditResult {
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url;
  }

  const rawCsp = getHeader(headers, 'content-security-policy') || getHeader(headers, 'content-security-policy-report-only');
  const csp = auditContentSecurityPolicy(rawCsp);

  const findings: CspFinding[] = [...csp.findings];

  // 1. HSTS Check
  const rawHsts = getHeader(headers, 'strict-transport-security');
  const hstsPresent = !!rawHsts;
  let hstsSubDomains = false;
  let hstsPreload = false;
  let hstsMaxAge: number | undefined = undefined;
  let hstsValid = false;

  if (rawHsts) {
    const parts = rawHsts.split(';').map((p) => p.trim().toLowerCase());
    hstsSubDomains = parts.includes('includesubdomains');
    hstsPreload = parts.includes('preload');

    const maxAgePart = parts.find((p) => p.startsWith('max-age='));
    if (maxAgePart) {
      const seconds = parseInt(maxAgePart.split('=')[1], 10);
      if (!isNaN(seconds)) {
        hstsMaxAge = seconds;
        hstsValid = seconds >= 15768000; // at least 6 months
      }
    }
  }

  if (!hstsPresent) {
    findings.push({
      directive: 'strict-transport-security',
      severity: 'high',
      message: 'Missing HTTP Strict Transport Security (HSTS). Browsers may connect over unencrypted HTTP.',
      remediation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    });
  } else if (!hstsValid) {
    findings.push({
      directive: 'strict-transport-security',
      severity: 'medium',
      message: 'HSTS max-age is below recommended 1-year threshold (31,536,000 seconds).',
    });
  }

  // 2. X-Content-Type-Options
  const rawNosniff = getHeader(headers, 'x-content-type-options');
  const isNoSniff = rawNosniff?.toLowerCase() === 'nosniff';
  if (!isNoSniff) {
    findings.push({
      directive: 'x-content-type-options',
      severity: 'medium',
      message: "Missing 'X-Content-Type-Options: nosniff'. Exposes users to MIME-type sniffing attacks.",
      remediation: 'Set X-Content-Type-Options: nosniff',
    });
  }

  // 3. X-Frame-Options
  const rawFrameOptions = getHeader(headers, 'x-frame-options');

  // 4. Referrer-Policy
  const rawReferrer = getHeader(headers, 'referrer-policy');
  if (!rawReferrer) {
    findings.push({
      directive: 'referrer-policy',
      severity: 'low',
      message: 'Missing Referrer-Policy header. May leak full path parameters in referer headers.',
      remediation: 'Set Referrer-Policy: strict-origin-when-cross-origin',
    });
  }

  // Overall Score Calculation (weighted: CSP 50%, HSTS 25%, nosniff 15%, Referrer 10%)
  let totalScore = Math.round(csp.score * 0.5);
  if (hstsValid) totalScore += 25;
  else if (hstsPresent) totalScore += 15;

  if (isNoSniff) totalScore += 15;
  if (rawReferrer) totalScore += 10;

  totalScore = Math.max(0, Math.min(100, totalScore));

  let grade: SecurityHeadersAuditResult['grade'] = 'F';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 65) grade = 'B';
  else if (totalScore >= 50) grade = 'C';
  else if (totalScore >= 35) grade = 'D';

  return {
    url,
    domain,
    score: totalScore,
    grade,
    csp,
    hsts: {
      present: hstsPresent,
      includeSubDomains: hstsSubDomains,
      preload: hstsPreload,
      maxAge: hstsMaxAge,
      valid: hstsValid,
    },
    xContentTypeOptions: {
      present: !!rawNosniff,
      isNoSniff,
    },
    xFrameOptions: {
      present: !!rawFrameOptions,
      value: rawFrameOptions,
    },
    referrerPolicy: {
      present: !!rawReferrer,
      value: rawReferrer,
    },
    findings,
  };
}
