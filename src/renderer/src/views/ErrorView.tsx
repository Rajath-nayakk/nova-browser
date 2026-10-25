import React from 'react';
import { WifiOff, Globe, ServerOff, AlertTriangle, RotateCcw, Home, ExternalLink } from 'lucide-react';
import { parseNetworkErrorCode } from '../../../shared/validation';
import { NEW_TAB_URL } from '../../../shared/constants';

interface ErrorViewProps {
  url: string;
  onNavigate: (url: string) => void;
  onReload?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ url, onNavigate, onReload }) => {
  let targetUrl = '';
  let errorCode = -1;
  let errorDesc = '';

  try {
    const parsed = new URL(url);
    targetUrl = parsed.searchParams.get('url') || '';
    errorCode = parseInt(parsed.searchParams.get('code') || '-1', 10);
    errorDesc = parsed.searchParams.get('desc') || '';
  } catch {
    targetUrl = url;
  }

  const errorInfo = parseNetworkErrorCode(errorCode, errorDesc);

  const getCategoryIcon = () => {
    switch (errorInfo.category) {
      case 'offline':
        return <WifiOff size={44} className="text-amber-400" />;
      case 'dns':
        return <Globe size={44} className="text-cyan-400" />;
      case 'connection':
      case 'timeout':
        return <ServerOff size={44} className="text-rose-400" />;
      case 'ssl':
        return <AlertTriangle size={44} className="text-orange-400" />;
      default:
        return <AlertTriangle size={44} className="text-zinc-400" />;
    }
  };

  const handleRetry = () => {
    if (targetUrl) {
      onNavigate(targetUrl);
    } else if (onReload) {
      onReload();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] select-none animate-fade-in">
      <div className="max-w-xl w-full flex flex-col items-center text-center p-8 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-2xl">
        <div className="p-4 rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] mb-6 shadow-inner">
          {getCategoryIcon()}
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {errorInfo.userMessage}
        </h1>

        <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md leading-relaxed">
          {errorInfo.suggestion}
        </p>

        {targetUrl && (
          <div className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-6 rounded-lg bg-[var(--color-bg-tertiary)] text-xs text-[var(--color-text-muted)] font-mono break-all max-w-md border border-[var(--color-border-subtle)]">
            <ExternalLink size={13} className="shrink-0" />
            <span className="truncate">{targetUrl}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <RotateCcw size={15} />
            Try Again
          </button>

          <button
            onClick={() => onNavigate(NEW_TAB_URL)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] transition-all"
          >
            <Home size={15} />
            Go Home
          </button>
        </div>

        <div className="mt-8 pt-4 border-t border-[var(--color-border-subtle)] w-full flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
          <span>Error Code: {errorInfo.code}</span>
          <span className="truncate max-w-[240px]">{errorInfo.description}</span>
        </div>
      </div>
    </div>
  );
};
