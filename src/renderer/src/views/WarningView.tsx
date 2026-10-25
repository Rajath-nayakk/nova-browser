import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { NovaLogo } from '../components/NovaLogo';

interface WarningViewProps {
  url: string;
  onNavigate: (url: string) => void;
}

export const WarningView: React.FC<WarningViewProps> = ({ url, onNavigate }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Parse query parameters from url e.g. nova://warning?url=...&threat=...&reason=...&domain=...
  let targetUrl = '';
  let threatType = 'malware';
  let threatReason = 'Identified as potentially dangerous or deceptive.';
  let threatDomain = '';

  try {
    const parsed = new URL(url);
    targetUrl = parsed.searchParams.get('url') || '';
    threatType = parsed.searchParams.get('threat') || 'malware';
    threatReason = parsed.searchParams.get('reason') || threatReason;
    threatDomain = parsed.searchParams.get('domain') || targetUrl;
  } catch {
    targetUrl = url;
  }

  const getThreatTitle = () => {
    switch (threatType) {
      case 'phishing':
        return 'Deceptive Website Ahead (Phishing Alert)';
      case 'malware':
        return 'Malicious Website Ahead (Malware Alert)';
      case 'scam':
        return 'Suspicious Scam Website Ahead';
      default:
        return 'Security Warning Ahead';
    }
  };

  const getThreatDescription = () => {
    switch (threatType) {
      case 'phishing':
        return 'NOVA Sentinel detected that this site may be an impersonation or credential harvester designed to trick you into disclosing passwords, credit card numbers, or personal identity details.';
      case 'malware':
        return 'NOVA Sentinel flagged this website as distributing unauthorized software, trojans, or malicious payloads that could harm your computer or compromise your files.';
      case 'scam':
        return 'NOVA Sentinel identified this site as exhibiting fraudulent scam characteristics, scareware popups, or deceptive financial schemes.';
      default:
        return 'This destination has been flagged as unsafe by NOVA Browser security shields.';
    }
  };

  const handleBackToSafety = () => {
    onNavigate('nova://newtab');
  };

  const handleProceedUnsafe = async () => {
    if (threatDomain && window.novaAPI?.bypassThreat) {
      await window.novaAPI.bypassThreat(threatDomain);
    }
    if (targetUrl) {
      onNavigate(targetUrl);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0d0f17] text-white p-6 select-none animate-fadeIn">
      <div className="max-w-2xl w-full bg-[#161926]/90 border border-red-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Ambient Red Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start gap-5">
          <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl shrink-0 text-red-400 shadow-lg">
            <ShieldAlert size={38} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <NovaLogo size={20} />
              <span className="text-xs font-semibold text-red-400 tracking-wider uppercase">
                NOVA Sentinel Defense
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white mb-3">
              {getThreatTitle()}
            </h1>

            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              {getThreatDescription()}
            </p>

            <div className="bg-[#0b0d14] border border-gray-800 rounded-xl p-3 mb-6 font-mono text-xs break-all text-red-300 flex items-center justify-between gap-2">
              <span className="truncate">{targetUrl || threatDomain}</span>
              <span className="shrink-0 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] uppercase font-sans font-bold">
                {threatType}
              </span>
            </div>

            {threatReason && (
              <div className="text-xs text-gray-400 mb-6 flex items-start gap-2 bg-red-950/20 border border-red-900/30 rounded-lg p-2.5">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{threatReason}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-800/80">
              <button
                onClick={handleBackToSafety}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-red-600/30 active:scale-95"
              >
                <ArrowLeft size={16} />
                Back to Safety (Recommended)
              </button>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors"
              >
                Advanced Options
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-gray-800/60 text-xs text-gray-400 space-y-3 animate-fadeIn">
                <p>
                  NOVA Browser shields protect you by validating web destinations against locally cached reputation data without revealing your visited URLs to external services.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    If you understand the security risks and trust this host:
                  </span>
                  <button
                    onClick={handleProceedUnsafe}
                    className="text-red-400 hover:text-red-300 underline font-medium ml-2 flex items-center gap-1 shrink-0"
                  >
                    Proceed anyway (unsafe)
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
