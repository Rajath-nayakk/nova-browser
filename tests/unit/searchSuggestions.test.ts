import { describe, it, expect } from 'vitest';
import {
  parseKeywordSearch,
  computeMatchScore,
  generateOmniboxSuggestions,
  KEYWORD_ENGINES,
} from '../../src/shared/searchSuggestions';
import { Bookmark, HistoryItem } from '../../src/shared/types';

describe('Omnibox Search Suggestions & Keyword Engines', () => {
  describe('parseKeywordSearch', () => {
    it('detects Wikipedia keyword search prefix @w', () => {
      const parsed = parseKeywordSearch('@w quantum computing');
      expect(parsed.isKeyword).toBe(true);
      expect(parsed.engine?.name).toBe('Wikipedia');
      expect(parsed.query).toBe('quantum computing');
      expect(parsed.searchUrl).toBe('https://en.wikipedia.org/wiki/Special:Search?search=quantum%20computing');
    });

    it('detects DuckDuckGo keyword search prefix @d', () => {
      const parsed = parseKeywordSearch('@d privacy tools');
      expect(parsed.isKeyword).toBe(true);
      expect(parsed.engine?.name).toBe('DuckDuckGo');
      expect(parsed.query).toBe('privacy tools');
      expect(parsed.searchUrl).toBe('https://duckduckgo.com/?q=privacy%20tools');
    });

    it('detects GitHub keyword search prefix @gh', () => {
      const parsed = parseKeywordSearch('@gh electron');
      expect(parsed.isKeyword).toBe(true);
      expect(parsed.engine?.name).toBe('GitHub');
      expect(parsed.query).toBe('electron');
      expect(parsed.searchUrl).toBe('https://github.com/search?q=electron');
    });

    it('detects YouTube keyword search prefix @yt', () => {
      const parsed = parseKeywordSearch('@yt ambient music');
      expect(parsed.isKeyword).toBe(true);
      expect(parsed.engine?.name).toBe('YouTube');
      expect(parsed.searchUrl).toBe('https://www.youtube.com/results?search_query=ambient%20music');
    });

    it('handles keyword prefix without trailing query', () => {
      const parsed = parseKeywordSearch('@w');
      expect(parsed.isKeyword).toBe(true);
      expect(parsed.query).toBe('');
      expect(parsed.searchUrl).toBeUndefined();
    });

    it('rejects unknown @ prefix', () => {
      const parsed = parseKeywordSearch('@unknown query');
      expect(parsed.isKeyword).toBe(false);
      expect(parsed.query).toBe('@unknown query');
    });

    it('rejects standard web address or search query', () => {
      const parsed = parseKeywordSearch('https://example.com');
      expect(parsed.isKeyword).toBe(false);
    });
  });

  describe('computeMatchScore', () => {
    it('gives top score 100 for exact match', () => {
      expect(computeMatchScore('github', 'github')).toBe(100);
      expect(computeMatchScore('GitHub', 'github')).toBe(100);
    });

    it('gives score 80 for prefix match', () => {
      expect(computeMatchScore('git', 'github.com')).toBe(80);
    });

    it('gives score 60 for word boundary match', () => {
      expect(computeMatchScore('browser', 'nova browser privacy')).toBe(60);
    });

    it('gives score 40 for substring match', () => {
      expect(computeMatchScore('hub', 'github.com')).toBe(40);
    });

    it('gives score 20 for subsequence match', () => {
      expect(computeMatchScore('gtb', 'github')).toBe(20);
    });

    it('returns 0 for no match or empty input', () => {
      expect(computeMatchScore('xyz', 'apple banana')).toBe(0);
      expect(computeMatchScore('', 'text')).toBe(0);
      expect(computeMatchScore('test', '')).toBe(0);
    });
  });

  describe('generateOmniboxSuggestions', () => {
    const mockBookmarks: Bookmark[] = [
      { id: 'b1', title: 'GitHub: Let’s build from here', url: 'https://github.com', folder: 'Dev', createdAt: 1000 },
      { id: 'b2', title: 'DuckDuckGo Search Engine', url: 'https://duckduckgo.com', createdAt: 2000 },
    ];

    const mockHistory: HistoryItem[] = [
      { id: 'h1', title: 'GitHub Documentation', url: 'https://docs.github.com', visitedAt: 3000 },
      { id: 'h2', title: 'Wikipedia Main Page', url: 'https://en.wikipedia.org', visitedAt: 4000 },
      { id: 'h3', title: 'GitHub: Duplicate Bookmark', url: 'https://github.com', visitedAt: 5000 },
    ];

    it('returns empty array when query is empty or whitespace', () => {
      expect(generateOmniboxSuggestions('', mockBookmarks, mockHistory)).toEqual([]);
      expect(generateOmniboxSuggestions('   ', mockBookmarks, mockHistory)).toEqual([]);
    });

    it('ranks keyword search at top with priority score', () => {
      const results = generateOmniboxSuggestions('@w science', mockBookmarks, mockHistory);
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('keyword');
      expect(results[0].badge).toBe('@w');
      expect(results[0].title).toContain('Wikipedia');
    });

    it('finds bookmarks and gives them priority over history with same score', () => {
      const results = generateOmniboxSuggestions('git', mockBookmarks, mockHistory);
      expect(results.length).toBeGreaterThan(0);
      // First match should be the bookmark due to the +15 boost
      expect(results[0].type).toBe('bookmark');
      expect(results[0].url).toBe('https://github.com');
    });

    it('deduplicates matching URLs between bookmarks and history', () => {
      const results = generateOmniboxSuggestions('github', mockBookmarks, mockHistory);
      const githubUrls = results.filter((r) => r.url === 'https://github.com');
      expect(githubUrls.length).toBe(1);
    });

    it('respects the maxResults limit', () => {
      const results = generateOmniboxSuggestions('e', mockBookmarks, mockHistory, 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});
