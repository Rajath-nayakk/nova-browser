import { describe, it, expect } from 'vitest';
import { getLevenshteinDistance, isLookalikeDomain } from '../../src/shared/validation';

describe('Levenshtein Distance & Brand Typosquatting Detection', () => {
  it('correctly calculates Levenshtein edit distance', () => {
    expect(getLevenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(getLevenshteinDistance('google', 'google')).toBe(0);
    expect(getLevenshteinDistance('', 'hello')).toBe(5);
    expect(getLevenshteinDistance('world', '')).toBe(5);
    expect(getLevenshteinDistance('google', 'gogle')).toBe(1);
    expect(getLevenshteinDistance('paypal', 'payapl')).toBe(2); // swap of two adjacent characters is 2 operations in standard Levenshtein
    expect(getLevenshteinDistance('amazon', 'amzon')).toBe(1);
    expect(getLevenshteinDistance('netflix', 'netflx')).toBe(1);
  });

  it('detects typosquatting domains with distance 1 against target brands', () => {
    const gogle = isLookalikeDomain('gogle.com');
    expect(gogle.isLookalike).toBe(true);
    expect(gogle.targetBrand).toBe('google.com');
    expect(gogle.reason).toContain('Typosquatting candidate');

    const amzon = isLookalikeDomain('amzon.com');
    expect(amzon.isLookalike).toBe(true);
    expect(amzon.targetBrand).toBe('amazon.com');

    const netflx = isLookalikeDomain('netflx.com');
    expect(netflx.isLookalike).toBe(true);
    expect(netflx.targetBrand).toBe('netflix.com');

    const facebok = isLookalikeDomain('facebok.com');
    expect(facebok.isLookalike).toBe(true);
    expect(facebok.targetBrand).toBe('facebook.com');
  });

  it('detects typosquatting with distance 2 on long brand names', () => {
    // 'mcrosoft' vs 'microsoft' (missing 'i') is distance 1
    // 'mcrosofft' vs 'microsoft' is distance 2
    const mcrosoft = isLookalikeDomain('mcrosoft.com');
    expect(mcrosoft.isLookalike).toBe(true);
    expect(mcrosoft.targetBrand).toBe('microsoft.com');
  });

  it('does not flag authentic brand domains or legitimate subdomains', () => {
    expect(isLookalikeDomain('google.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('mail.google.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('accounts.google.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('paypal.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('github.com').isLookalike).toBe(false);
    expect(isLookalikeDomain('example.org').isLookalike).toBe(false);
    expect(isLookalikeDomain('wikipedia.org').isLookalike).toBe(false);
  });
});
