import { ReaderArticle } from './types';

/**
 * Strips script tags, style tags, comments, and boilerplate from raw HTML.
 */
export function cleanRawHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, '');
}

/**
 * Decodes basic HTML entities.
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/**
 * Strips all HTML tags from a string.
 */
export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Extracts page title from HTML using og:title, <h1>, or <title>.
 */
export function extractTitle(html: string): string {
  const ogTitleMatch =
    html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) return decodeHtmlEntities(ogTitleMatch[1].trim());

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    const text = stripTags(h1Match[1]).trim();
    if (text) return decodeHtmlEntities(text);
  }

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const text = stripTags(titleMatch[1]).trim();
    if (text) return decodeHtmlEntities(text);
  }

  return 'Untitled Article';
}

/**
 * Extracts author / byline from meta tags or common author classes.
 */
export function extractByline(html: string): string | undefined {
  const authorMeta =
    html.match(/<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i) ||
    html.match(/<meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i);
  if (authorMeta && authorMeta[1]) return decodeHtmlEntities(authorMeta[1].trim());

  const bylineClass = html.match(
    /class=["'][^"']*\b(?:byline|author|writer)\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i
  );
  if (bylineClass && bylineClass[1]) {
    const text = stripTags(bylineClass[1]).trim();
    if (text && text.length < 80) return decodeHtmlEntities(text);
  }
  return undefined;
}

/**
 * Extracts publication date from metadata or <time> element.
 */
export function extractPublishedTime(html: string): string | undefined {
  const pubMeta = html.match(
    /<meta\s+(?:property|name)=["'](?:article:published_time|date|pubdate)["']\s+content=["']([^"']+)["']/i
  );
  if (pubMeta && pubMeta[1]) return pubMeta[1].trim();

  const timeMatch = html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i);
  if (timeMatch && timeMatch[1]) return timeMatch[1].trim();

  return undefined;
}

/**
 * Extracts excerpt from meta description.
 */
export function extractExcerpt(html: string): string | undefined {
  const descMeta = html.match(
    /<meta\s+(?:name|property)=["'](?:description|og:description)["']\s+content=["']([^"']+)["']/i
  );
  if (descMeta && descMeta[1]) {
    return decodeHtmlEntities(descMeta[1].trim());
  }
  return undefined;
}

/**
 * Calculates word count from plain text.
 */
export function calculateWordCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/**
 * Estimates reading time based on standard 200 words per minute.
 */
export function estimateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Sanitizes extracted article HTML, retaining only safe reading tags.
 */
export function sanitizeArticleHtml(raw: string): string {
  let safe = raw
    .replace(/\son\w+=["'][^"']*["']/gi, '')
    .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');

  safe = safe.replace(
    /<(form|button|input|select|textarea|dialog)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi,
    ''
  );

  return safe.trim();
}

/**
 * Extracts the primary article body, prioritizing <article> or high paragraph density.
 */
export function extractArticleContent(html: string): string {
  const cleaned = cleanRawHtml(html);

  // 1. Look for <article> tag
  const articleMatch = cleaned.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1]) {
    const sanitized = sanitizeArticleHtml(articleMatch[1]);
    if (calculateWordCount(stripTags(sanitized)) > 20) {
      return sanitized;
    }
  }

  // 2. Look for common article content classes (.article-body, .entry-content, .post-content)
  const classMatch = cleaned.match(
    /<div\b[^>]*class=["'][^"']*\b(?:article[-_]body|entry[-_]content|post[-_]content|story[-_]body|main[-_]content)\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  );
  if (classMatch && classMatch[1]) {
    const sanitized = sanitizeArticleHtml(classMatch[1]);
    if (calculateWordCount(stripTags(sanitized)) > 20) {
      return sanitized;
    }
  }

  // 3. Fallback: extract all paragraphs <p> with meaningful length
  const paragraphs: string[] = [];
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(cleaned)) !== null) {
    const pContent = match[1];
    const text = stripTags(pContent).trim();
    if (text.length > 20) {
      paragraphs.push(`<p>${pContent.trim()}</p>`);
    }
  }

  if (paragraphs.length > 0) {
    return paragraphs.join('\n');
  }

  return '<p>No readable article content could be extracted from this page.</p>';
}

/**
 * Full extraction pipeline: extracts ReaderArticle from raw HTML.
 */
export function extractReaderArticle(html: string, url: string): ReaderArticle {
  const title = extractTitle(html);
  const byline = extractByline(html);
  const publishedTime = extractPublishedTime(html);
  const excerpt = extractExcerpt(html);
  const content = extractArticleContent(html);
  const plainText = stripTags(content);
  const wordCount = calculateWordCount(plainText);
  const readingTimeMinutes = estimateReadingTime(wordCount);

  return {
    url,
    title,
    byline,
    publishedTime,
    excerpt,
    content,
    wordCount,
    readingTimeMinutes,
  };
}
