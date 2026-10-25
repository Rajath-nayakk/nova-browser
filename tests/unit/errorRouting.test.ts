import { describe, it, expect } from 'vitest';
import { parseNetworkErrorCode, formatErrorUrl } from '../../src/shared/validation';

describe('Network Error Routing and Parsing', () => {
  it('correctly categorizes DNS name resolution failure (-105)', () => {
    const error = parseNetworkErrorCode(-105, 'net::ERR_NAME_NOT_RESOLVED');
    expect(error.category).toBe('dns');
    expect(error.userMessage).toContain('IP address could not be found');
    expect(error.suggestion).toContain('DNS');
  });

  it('correctly categorizes internet disconnected / offline (-106)', () => {
    const error = parseNetworkErrorCode(-106, 'net::ERR_INTERNET_DISCONNECTED');
    expect(error.category).toBe('offline');
    expect(error.userMessage).toContain('offline');
    expect(error.suggestion).toContain('Wi-Fi');
  });

  it('correctly categorizes connection refused (-102)', () => {
    const error = parseNetworkErrorCode(-102, 'net::ERR_CONNECTION_REFUSED');
    expect(error.category).toBe('connection');
    expect(error.userMessage).toContain('refused');
    expect(error.suggestion).toContain('firewall');
  });

  it('correctly categorizes connection timeout (-118 and -7)', () => {
    const err118 = parseNetworkErrorCode(-118, 'net::ERR_CONNECTION_TIMED_OUT');
    expect(err118.category).toBe('timeout');
    expect(err118.userMessage).toContain('timed out');

    const err7 = parseNetworkErrorCode(-7, 'net::ERR_TIMED_OUT');
    expect(err7.category).toBe('timeout');
  });

  it('correctly categorizes SSL/TLS certificate errors (-200..-299)', () => {
    const certError = parseNetworkErrorCode(-202, 'net::ERR_CERT_AUTHORITY_INVALID');
    expect(certError.category).toBe('ssl');
    expect(certError.userMessage).toContain('Secure connection');
    expect(certError.suggestion).toContain('certificate');
  });

  it('provides safe generic fallback for unexpected error codes', () => {
    const generic = parseNetworkErrorCode(-324, 'net::ERR_EMPTY_RESPONSE');
    expect(generic.category).toBe('generic');
    expect(generic.userMessage).toBe('This page cannot be loaded.');
    expect(generic.code).toBe(-324);
  });

  it('formats nova://error URL with accurate query parameters', () => {
    const formatted = formatErrorUrl('https://example.com/login?ref=1', -105, 'ERR_NAME_NOT_RESOLVED');
    expect(formatted.startsWith('nova://error?')).toBe(true);

    const parsed = new URL(formatted);
    expect(parsed.searchParams.get('url')).toBe('https://example.com/login?ref=1');
    expect(parsed.searchParams.get('code')).toBe('-105');
    expect(parsed.searchParams.get('desc')).toBe('ERR_NAME_NOT_RESOLVED');
  });
});
