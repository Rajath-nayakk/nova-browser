import { Bookmark, HistoryItem } from './types';

export interface KeywordEngine {
  prefix: string;
  name: string;
  searchUrl: string;
  icon: string;
}

export const KEYWORD_ENGINES: KeywordEngine[] = [
  { prefix: '@d', name: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=', icon: '🦆' },
  { prefix: '@g', name: 'Google', searchUrl: 'https://www.google.com/search?q=', icon: '🔍' },
  { prefix: '@w', name: 'Wikipedia', searchUrl: 'https://en.wikipedia.org/wiki/Special:Search?search=', icon: '📖' },
  { prefix: '@gh', name: 'GitHub', searchUrl: 'https://github.com/search?q=', icon: '🐙' },
  { prefix: '@yt', name: 'YouTube', searchUrl: 'https://www.youtube.com/results?search_query=', icon: '▶️' },
  { prefix: '@b', name: 'Brave', searchUrl: 'https://search.brave.com/search?q=', icon: '🦁' },
];

export interface OmniboxSuggestion {
  id: string;
  type: 'keyword' | 'bookmark' | 'history' | 'search';
  title: string;
  url: string;
  subtitle?: string;
  badge?: string;
  icon?: string;
  score: number;
}

/**
 * Checks whether the input begins with an explicit search engine keyword prefix (e.g. '@w space exploration').
 */
export function parseKeywordSearch(input: string): {
  isKeyword: boolean;
  engine?: KeywordEngine;
  query: string;
  searchUrl?: string;
} {
  const trimmed = input.trim();
  const firstSpaceIdx = trimmed.indexOf(' ');
  const prefix = (firstSpaceIdx > 0 ? trimmed.slice(0, firstSpaceIdx) : trimmed).toLowerCase();

  const engine = KEYWORD_ENGINES.find((e) => e.prefix === prefix);
  if (!engine) {
    return { isKeyword: false, query: trimmed };
  }

  const query = firstSpaceIdx > 0 ? trimmed.slice(firstSpaceIdx + 1).trim() : '';
  const searchUrl = query ? `${engine.searchUrl}${encodeURIComponent(query)}` : undefined;

  return {
    isKeyword: true,
    engine,
    query,
    searchUrl,
  };
}

/**
 * Computes a relevance score between search query and target text.
 * Higher score indicates closer match (starts-with > word-boundary > substring).
 */
export function computeMatchScore(query: string, text: string): number {
  if (!query || !text) return 0;
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();

  if (t === q) return 100;
  if (t.startsWith(q)) return 80;

  const wordIndex = t.indexOf(' ' + q);
  if (wordIndex !== -1) return 60;

  const subIndex = t.indexOf(q);
  if (subIndex !== -1) return 40;

  // Partial sequential characters match
  let qIdx = 0;
  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) qIdx++;
  }
  if (qIdx === q.length) return 20;

  return 0;
}

/**
 * Generates ranked omnibox suggestions combining keyword shortcuts, local bookmarks, and history.
 */
export function generateOmniboxSuggestions(
  input: string,
  bookmarks: Bookmark[],
  history: HistoryItem[],
  maxResults = 7
): OmniboxSuggestion[] {
  if (!input || !input.trim()) return [];
  const trimmed = input.trim();

  const results: OmniboxSuggestion[] = [];

  // 1. Check keyword search prefix
  const kw = parseKeywordSearch(trimmed);
  if (kw.isKeyword && kw.engine) {
    results.push({
      id: `kw_${kw.engine.prefix}`,
      type: 'keyword',
      title: kw.query ? `Search ${kw.engine.name} for "${kw.query}"` : `Type search query for ${kw.engine.name}`,
      url: kw.searchUrl || `https://${kw.engine.name.toLowerCase()}.com`,
      badge: kw.engine.prefix,
      icon: kw.engine.icon,
      subtitle: kw.engine.name,
      score: 1000,
    });

    if (kw.query) {
      return results;
    }
  }

  // 2. Score bookmarks
  for (const bm of bookmarks) {
    const titleScore = computeMatchScore(trimmed, bm.title);
    const urlScore = computeMatchScore(trimmed, bm.url);
    const highestScore = Math.max(titleScore, urlScore);

    if (highestScore > 0) {
      results.push({
        id: `bm_${bm.id}`,
        type: 'bookmark',
        title: bm.title || bm.url,
        url: bm.url,
        subtitle: bm.folder ? `Bookmark in ${bm.folder}` : 'Bookmark',
        badge: 'Bookmark',
        score: highestScore + 15, // Bookmarks given priority boost
      });
    }
  }

  // 3. Score history (deduplicated by URL)
  const seenUrls = new Set(results.map((r) => r.url));
  for (const h of history) {
    if (seenUrls.has(h.url)) continue;

    const titleScore = computeMatchScore(trimmed, h.title);
    const urlScore = computeMatchScore(trimmed, h.url);
    const highestScore = Math.max(titleScore, urlScore);

    if (highestScore > 0) {
      seenUrls.add(h.url);
      results.push({
        id: `hist_${h.id}`,
        type: 'history',
        title: h.title || h.url,
        url: h.url,
        subtitle: 'Visited site',
        badge: 'History',
        score: highestScore,
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}
