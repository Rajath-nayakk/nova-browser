import { Bookmark } from './types';

/**
 * Netscape Bookmark File 1 format generator.
 * Universally supported by Firefox, Chrome, Brave, Safari, and Edge.
 */
export function exportBookmarksToHtml(bookmarks: Bookmark[]): string {
  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file. -->',
    '<!-- It will be read and overwritten. -->',
    '<!-- DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ];

  bookmarks.forEach((b) => {
    const addDate = Math.floor((b.createdAt || Date.now()) / 1000);
    const escapedUrl = escapeHtml(b.url);
    const escapedTitle = escapeHtml(b.title || b.url);
    const iconAttr = b.favicon ? ` ICON="${escapeHtml(b.favicon)}"` : '';

    lines.push(`    <DT><A HREF="${escapedUrl}" ADD_DATE="${addDate}"${iconAttr}>${escapedTitle}</A>`);
  });

  lines.push('</DL><p>');
  return lines.join('\n');
}

/**
 * Parses Netscape Bookmark File 1 format HTML into structured bookmark items.
 * Uses safe regex parsing without DOM script evaluation.
 */
export function parseBookmarksFromHtml(htmlContent: string): { bookmarks: Omit<Bookmark, 'id'>[]; count: number } {
  const results: Omit<Bookmark, 'id'>[] = [];
  if (!htmlContent || typeof htmlContent !== 'string') {
    return { bookmarks: [], count: 0 };
  }

  // Regex matching <DT><A HREF="url" ...>Title</A>
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const rawUrl = match[2]?.trim();
    const rawTitle = match[3]?.replace(/<[^>]+>/g, '').trim();

    if (!rawUrl || rawUrl.startsWith('javascript:') || rawUrl.startsWith('data:')) {
      continue; // Skip dangerous or empty schemes
    }

    // Try extracting ADD_DATE if present
    const addDateMatch = /ADD_DATE=(["'])(\d+)\1/i.exec(match[0]);
    const createdAt = addDateMatch ? parseInt(addDateMatch[2], 10) * 1000 : Date.now();

    // Try extracting ICON if present
    const iconMatch = /ICON=(["'])(.*?)\1/i.exec(match[0]);
    const favicon = iconMatch ? iconMatch[2] : undefined;

    results.push({
      url: unescapeHtml(rawUrl),
      title: unescapeHtml(rawTitle) || unescapeHtml(rawUrl),
      createdAt: isNaN(createdAt) ? Date.now() : createdAt,
      favicon,
    });
  }

  return { bookmarks: results, count: results.length };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function unescapeHtml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
