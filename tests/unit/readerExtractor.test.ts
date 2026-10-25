import { describe, it, expect } from 'vitest';
import {
  cleanRawHtml,
  extractTitle,
  extractByline,
  extractPublishedTime,
  extractExcerpt,
  calculateWordCount,
  estimateReadingTime,
  sanitizeArticleHtml,
  extractReaderArticle,
} from '../../src/shared/readerExtractor';

describe('Distraction-Free Reader Mode & Article Extraction', () => {
  const sampleArticleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>The Architecture of Secure Browsers — Tech Dispatch</title>
        <meta property="og:title" content="The Architecture of Secure Browsers" />
        <meta name="author" content="Alice Cipher" />
        <meta property="article:published_time" content="2026-10-25T12:00:00Z" />
        <meta name="description" content="An in-depth analysis of sandboxing and process isolation in modern privacy-first browsers." />
        <style>.banner { background: red; }</style>
        <script>console.log("analytics tracking code");</script>
      </head>
      <body>
        <header><nav><a href="/">Home</a><a href="/news">News</a></nav></header>
        <aside><div class="ad">Buy our sponsored VPN today!</div></aside>
        
        <article>
          <h1>The Architecture of Secure Browsers</h1>
          <p class="byline">By Alice Cipher</p>
          <p>
            Modern desktop web browsers execute millions of lines of untrusted JavaScript code every day.
            Without robust sandboxing, privilege separation, and proactive network shielding, web users
            remain vulnerable to tracking beacons, cryptojacking, and memory corruption exploits.
          </p>
          <p>
            NOVA Browser tackles these fundamental threats by isolating renderer processes, stripping
            tracking parameters before network requests leave the machine, and offering private storage
            partitions that guarantee zero disk leakage.
          </p>
          <p>
            Furthermore, by removing telemetry and third-party advertising frameworks, user memory and CPU
            cycles are preserved exclusively for content rendering and essential application tasks.
          </p>
        </article>

        <footer>
          <p>Copyright 2026 Tech Dispatch. All rights reserved.</p>
        </footer>
      </body>
    </html>
  `;

  it('cleans raw HTML by stripping boilerplate headers, footers, navs, and scripts', () => {
    const cleaned = cleanRawHtml(sampleArticleHtml);
    expect(cleaned).not.toContain('analytics tracking code');
    expect(cleaned).not.toContain('<style>');
    expect(cleaned).not.toContain('<nav>');
    expect(cleaned).not.toContain('<header>');
    expect(cleaned).not.toContain('<footer>');
    expect(cleaned).not.toContain('<aside>');
    expect(cleaned).toContain('The Architecture of Secure Browsers');
  });

  it('extracts title accurately preferring og:title', () => {
    const title = extractTitle(sampleArticleHtml);
    expect(title).toBe('The Architecture of Secure Browsers');
  });

  it('extracts author byline and published timestamp', () => {
    const byline = extractByline(sampleArticleHtml);
    expect(byline).toBe('Alice Cipher');

    const published = extractPublishedTime(sampleArticleHtml);
    expect(published).toBe('2026-10-25T12:00:00Z');
  });

  it('extracts article excerpt from meta description', () => {
    const excerpt = extractExcerpt(sampleArticleHtml);
    expect(excerpt).toContain('An in-depth analysis of sandboxing');
  });

  it('calculates word count and reading time correctly', () => {
    const words = calculateWordCount('This is a simple sentence with exactly eight words');
    expect(words).toBe(9);

    expect(estimateReadingTime(150)).toBe(1);
    expect(estimateReadingTime(450)).toBe(3);
  });

  it('sanitizes dangerous attributes from article HTML', () => {
    const maliciousHtml = '<p>Safe text <a href="javascript:alert(1)" onclick="steal()">Click me</a></p>';
    const sanitized = sanitizeArticleHtml(maliciousHtml);
    expect(sanitized).not.toContain('javascript:alert(1)');
    expect(sanitized).not.toContain('onclick');
    expect(sanitized).toContain('Safe text');
  });

  it('extracts complete ReaderArticle payload from full web page', () => {
    const article = extractReaderArticle(sampleArticleHtml, 'https://techdispatch.example.com/secure-browsers');
    expect(article.title).toBe('The Architecture of Secure Browsers');
    expect(article.byline).toBe('Alice Cipher');
    expect(article.publishedTime).toBe('2026-10-25T12:00:00Z');
    expect(article.url).toBe('https://techdispatch.example.com/secure-browsers');
    expect(article.wordCount).toBeGreaterThan(50);
    expect(article.readingTimeMinutes).toBeGreaterThanOrEqual(1);
    expect(article.content).toContain('Modern desktop web browsers execute millions of lines');
    expect(article.content).not.toContain('Buy our sponsored VPN today!');
  });
});
