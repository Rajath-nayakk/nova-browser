import { describe, it, expect } from 'vitest';
import { exportBookmarksToHtml, parseBookmarksFromHtml } from '../../src/shared/bookmarkParser';
import { Bookmark } from '../../src/shared/types';

describe('Netscape Bookmark HTML Parser (M2.1 & M2.2)', () => {
  const sampleBookmarks: Bookmark[] = [
    {
      id: 'bm-1',
      title: 'Electronic Frontier Foundation',
      url: 'https://www.eff.org',
      createdAt: 1700000000000,
      favicon: 'https://www.eff.org/favicon.ico',
    },
    {
      id: 'bm-2',
      title: 'DuckDuckGo Privacy Search',
      url: 'https://duckduckgo.com',
      createdAt: 1700000500000,
    },
  ];

  it('exports bookmarks into valid Netscape Bookmark HTML format', () => {
    const html = exportBookmarksToHtml(sampleBookmarks);
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('<H1>Bookmarks</H1>');
    expect(html).toContain('HREF="https://www.eff.org"');
    expect(html).toContain('Electronic Frontier Foundation');
    expect(html).toContain('HREF="https://duckduckgo.com"');
  });

  it('parses exported Netscape HTML bookmarks back into structured data', () => {
    const html = exportBookmarksToHtml(sampleBookmarks);
    const parsed = parseBookmarksFromHtml(html);

    expect(parsed.count).toBe(2);
    expect(parsed.bookmarks[0].title).toBe('Electronic Frontier Foundation');
    expect(parsed.bookmarks[0].url).toBe('https://www.eff.org');
    expect(parsed.bookmarks[1].title).toBe('DuckDuckGo Privacy Search');
    expect(parsed.bookmarks[1].url).toBe('https://duckduckgo.com');
  });

  it('filters out dangerous javascript: and data: schemes', () => {
    const maliciousHtml = `
      <!DOCTYPE NETSCAPE-Bookmark-file-1>
      <DL><p>
        <DT><A HREF="javascript:alert('xss')">Malicious Script</A>
        <DT><A HREF="data:text/html,<script>alert(1)</script>">Dangerous Data</A>
        <DT><A HREF="https://safe-site.org">Legitimate Safe Bookmark</A>
      </DL><p>
    `;

    const parsed = parseBookmarksFromHtml(maliciousHtml);
    expect(parsed.count).toBe(1);
    expect(parsed.bookmarks[0].url).toBe('https://safe-site.org');
    expect(parsed.bookmarks[0].title).toBe('Legitimate Safe Bookmark');
  });

  it('handles empty or malformed HTML inputs gracefully', () => {
    expect(parseBookmarksFromHtml('').count).toBe(0);
    expect(parseBookmarksFromHtml('just plain text').count).toBe(0);
  });
});
