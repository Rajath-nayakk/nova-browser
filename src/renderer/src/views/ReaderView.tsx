import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ArrowLeft,
  ExternalLink,
  Type,
  Minus,
  Plus,
  Clock,
  FileText,
  Share2,
  RefreshCw,
  Sun,
  Moon,
  Coffee,
} from 'lucide-react';
import { ReaderArticle } from '@shared/types';
import { isInternalUrl } from '@shared/validation';

interface ReaderViewProps {
  url: string;
  onNavigate: (url: string) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({ url, onNavigate }) => {
  const [article, setArticle] = useState<ReaderArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reader Customization Preferences
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [readerTheme, setReaderTheme] = useState<'dark' | 'light' | 'sepia'>('dark');
  const [maxWidth, setMaxWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');

  // Extract target URL from query parameter
  const getTargetUrl = (): string => {
    try {
      const parsed = new URL(url);
      return parsed.searchParams.get('url') || '';
    } catch {
      return '';
    }
  };

  const targetUrl = getTargetUrl();

  const loadArticle = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.novaAPI?.extractReaderArticle) {
        const extracted = await window.novaAPI.extractReaderArticle(targetUrl || undefined);
        if (extracted && extracted.content) {
          setArticle(extracted);
        } else {
          setError('Could not extract readable article content from this page.');
        }
      } else {
        // Fallback demo for standalone tests
        setArticle({
          url: targetUrl || 'https://example.com/article',
          title: 'Distraction-Free Reading with NOVA Reader',
          byline: 'NOVA Editorial',
          publishedTime: new Date().toISOString(),
          excerpt: 'Experience web articles cleanly stripped of tracking scripts, popup overlays, and banner clutter.',
          content: '<p>Welcome to NOVA Distraction-Free Reader Mode. Long-form journalism and technical documentation are best enjoyed without intrusive advertisements, persistent video overlays, or tracking pixels.</p><p>You can customize typography, adjust font sizes, or switch between Dark, Light, and Sepia parchment reading palettes using the toolbar above.</p>',
          wordCount: 52,
          readingTimeMinutes: 1,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to extract article content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticle();
  }, [url]);

  const getThemeStyles = () => {
    switch (readerTheme) {
      case 'sepia':
        return {
          bg: '#fbf0d9',
          surface: '#f4e4c1',
          text: '#433422',
          muted: '#7a6347',
          border: 'rgba(67, 52, 34, 0.15)',
          accent: '#b45309',
        };
      case 'light':
        return {
          bg: '#ffffff',
          surface: '#f8fafc',
          text: '#0f172a',
          muted: '#64748b',
          border: 'rgba(0, 0, 0, 0.08)',
          accent: '#0284c7',
        };
      case 'dark':
      default:
        return {
          bg: '#0f111a',
          surface: '#181b29',
          text: '#f1f5f9',
          muted: '#94a3b8',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#38bdf8',
        };
    }
  };

  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case 'serif':
        return '"Merriweather", "Georgia", "Cambria", serif';
      case 'mono':
        return '"JetBrains Mono", "Fira Code", monospace';
      case 'sans':
      default:
        return 'var(--font-family)';
    }
  };

  const getMaxWidthPx = () => {
    switch (maxWidth) {
      case 'narrow':
        return '600px';
      case 'wide':
        return '900px';
      case 'normal':
      default:
        return '720px';
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: themeStyles.bg,
        color: themeStyles.text,
        overflow: 'hidden',
        transition: 'background 0.2s ease, color 0.2s ease',
      }}
    >
      {/* Reader Controls Toolbar */}
      <div
        style={{
          height: '52px',
          borderBottom: `1px solid ${themeStyles.border}`,
          background: themeStyles.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {targetUrl && (
            <button
              onClick={() => onNavigate(targetUrl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: themeStyles.bg,
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.text,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Return to original website"
            >
              <ArrowLeft size={14} />
              <span>Back to Page</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} style={{ color: themeStyles.accent }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.text }}>
              NOVA Reader Mode
            </span>
          </div>

          {article && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '11px',
                color: themeStyles.muted,
                borderLeft: `1px solid ${themeStyles.border}`,
                paddingLeft: '14px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {article.readingTimeMinutes} min read
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileText size={12} />
                {article.wordCount} words
              </span>
            </div>
          )}
        </div>

        {/* Customization Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Typography Selector */}
          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
              background: themeStyles.bg,
              border: `1px solid ${themeStyles.border}`,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setFontFamily('sans')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: fontFamily === 'sans' ? 700 : 500,
                background: fontFamily === 'sans' ? themeStyles.accent : 'transparent',
                color: fontFamily === 'sans' ? '#000' : themeStyles.muted,
              }}
            >
              Sans
            </button>
            <button
              onClick={() => setFontFamily('serif')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontFamily: 'Georgia, serif',
                fontWeight: fontFamily === 'serif' ? 700 : 500,
                background: fontFamily === 'serif' ? themeStyles.accent : 'transparent',
                color: fontFamily === 'serif' ? '#000' : themeStyles.muted,
              }}
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('mono')}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: fontFamily === 'mono' ? 700 : 500,
                background: fontFamily === 'mono' ? themeStyles.accent : 'transparent',
                color: fontFamily === 'mono' ? '#000' : themeStyles.muted,
              }}
            >
              Mono
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-sm)',
              background: themeStyles.bg,
              border: `1px solid ${themeStyles.border}`,
              padding: '2px 4px',
            }}
          >
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              style={{ padding: '4px 6px', color: themeStyles.muted }}
              title="Decrease font size"
            >
              <Minus size={12} />
            </button>
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '0 6px', minWidth: '32px', textAlign: 'center' }}>
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              style={{ padding: '4px 6px', color: themeStyles.muted }}
              title="Increase font size"
            >
              <Plus size={12} />
            </button>
          </div>

          {/* Theme Palette */}
          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius-sm)',
              background: themeStyles.bg,
              border: `1px solid ${themeStyles.border}`,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setReaderTheme('dark')}
              style={{
                padding: '6px 8px',
                background: readerTheme === 'dark' ? themeStyles.accent : 'transparent',
                color: readerTheme === 'dark' ? '#000' : themeStyles.muted,
              }}
              title="Dark Mode"
            >
              <Moon size={13} />
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              style={{
                padding: '6px 8px',
                background: readerTheme === 'sepia' ? themeStyles.accent : 'transparent',
                color: readerTheme === 'sepia' ? '#000' : themeStyles.muted,
              }}
              title="Sepia Mode"
            >
              <Coffee size={13} />
            </button>
            <button
              onClick={() => setReaderTheme('light')}
              style={{
                padding: '6px 8px',
                background: readerTheme === 'light' ? themeStyles.accent : 'transparent',
                color: readerTheme === 'light' ? '#000' : themeStyles.muted,
              }}
              title="Light Mode"
            >
              <Sun size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Article Content Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 24px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: getMaxWidthPx(),
            fontFamily: getFontFamilyStyle(),
            fontSize: `${fontSize}px`,
            lineHeight: '1.75',
          }}
        >
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <RefreshCw size={24} style={{ color: themeStyles.accent, animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', color: themeStyles.muted }}>Extracting clean article content...</div>
            </div>
          )}

          {!loading && error && (
            <div
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: themeStyles.surface,
                border: `1px solid ${themeStyles.border}`,
                textAlign: 'center',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Reader Mode Unavailable</h3>
              <p style={{ fontSize: '13px', color: themeStyles.muted, marginBottom: '16px' }}>{error}</p>
              {targetUrl && (
                <button
                  onClick={() => onNavigate(targetUrl)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 'var(--radius-sm)',
                    background: themeStyles.accent,
                    color: '#000',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  Return to Webpage
                </button>
              )}
            </div>
          )}

          {!loading && article && (
            <article>
              {/* Header */}
              <header style={{ marginBottom: '32px', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '24px' }}>
                <h1
                  style={{
                    fontSize: `${fontSize * 1.8}px`,
                    fontWeight: 800,
                    lineHeight: '1.25',
                    letterSpacing: '-0.5px',
                    marginBottom: '14px',
                  }}
                >
                  {article.title}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: themeStyles.muted,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {article.byline && <span>By <strong>{article.byline}</strong></span>}
                    {article.publishedTime && (
                      <span>{new Date(article.publishedTime).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                    )}
                  </div>

                  {article.url && (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(article.url);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: themeStyles.accent,
                        textDecoration: 'none',
                        fontSize: '12px',
                      }}
                    >
                      <span>Original</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {article.excerpt && (
                  <p
                    style={{
                      fontSize: `${fontSize * 1.05}px`,
                      fontStyle: 'italic',
                      color: themeStyles.muted,
                      marginTop: '16px',
                      lineHeight: '1.6',
                    }}
                  >
                    {article.excerpt}
                  </p>
                )}
              </header>

              {/* Body */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                }}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </article>
          )}
        </div>
      </div>
    </div>
  );
};
