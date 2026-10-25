import React, { useState } from 'react';
import { Search, X, ShieldAlert, ShieldCheck, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { NovaLogo } from './NovaLogo';
import { LinkLensReport } from '@shared/validation';

interface LinkLensModalProps {
  initialUrl?: string;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

export const LinkLensModal: React.FC<LinkLensModalProps> = ({ initialUrl = '', onClose, onNavigate }) => {
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [report, setReport] = useState<LinkLensReport | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  React.useEffect(() => {
    if (initialUrl) {
      inspect(initialUrl);
    }
  }, [initialUrl]);

  const inspect = async (urlStr: string) => {
    if (!urlStr.trim()) return;
    if (window.novaAPI?.inspectLink) {
      const rep = await window.novaAPI.inspectLink(urlStr.trim());
      setReport(rep);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    inspect(inputUrl);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        inspect(text);
      }
    } catch {
      // ignore
    }
  };

  const copyCleanUrl = () => {
    if (report?.cleanUrl) {
      navigator.clipboard.writeText(report.cleanUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#161926] border border-gray-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <NovaLogo size={20} />
            <span className="font-bold text-white text-base">NOVA Link Lens</span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded">
              Deep Inspector
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex items-center gap-2 bg-[#0b0d14] border border-gray-800 focus-within:border-cyan-500 rounded-xl px-3 py-2 transition">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste or type any link to analyze without loading..."
              className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handlePaste}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium shrink-0 px-2 py-1 bg-cyan-500/10 rounded-lg"
            >
              Paste
            </button>
            <button
              type="submit"
              className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-medium shrink-0 px-3 py-1 rounded-lg transition"
            >
              Analyze
            </button>
          </div>
        </form>

        {/* Report Output */}
        {report && (
          <div className="space-y-4 animate-fadeIn text-xs">
            {/* Verdict Badge */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                report.suspiciousReasons.length > 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-green-500/10 border-green-500/30 text-green-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {report.suspiciousReasons.length > 0 ? (
                  <ShieldAlert size={18} className="text-amber-400 shrink-0" />
                ) : (
                  <ShieldCheck size={18} className="text-green-400 shrink-0" />
                )}
                <span className="font-semibold">
                  {report.suspiciousReasons.length > 0
                    ? `${report.suspiciousReasons.length} Security Advisory Flag(s) Found`
                    : 'Clean URL & Verified Scheme'}
                </span>
              </div>
              <span className="font-mono text-[11px] uppercase opacity-80">{report.scheme}</span>
            </div>

            {/* Link Details Card */}
            <div className="bg-[#0b0d14] border border-gray-800/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Target Hostname:</span>
                <span className="font-mono text-white font-medium">{report.domain || '(None)'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Connection Encryption:</span>
                <span className={report.isSecure ? 'text-green-400' : 'text-amber-400 font-semibold'}>
                  {report.isSecure ? 'HTTPS Encrypted' : 'Insecure (Plain HTTP)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Homograph / Lookalike:</span>
                <span className={report.isLookalike ? 'text-red-400 font-bold' : 'text-gray-400'}>
                  {report.isLookalike ? `Impersonation Risk (${report.lookalikeTarget || 'Spoofed'})` : 'None detected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tracking Parameters:</span>
                <span className={report.hasTrackingParams ? 'text-cyan-400' : 'text-gray-400'}>
                  {report.hasTrackingParams
                    ? `${report.trackingParamsFound.length} tracking tags identified`
                    : 'Clean (No tracking tags)'}
                </span>
              </div>
            </div>

            {/* Suspicious Reasons List */}
            {report.suspiciousReasons.length > 0 && (
              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-red-400">
                  <AlertTriangle size={14} />
                  <span>Advisories & Potential Risks:</span>
                </div>
                <ul className="list-disc list-inside text-gray-300 space-y-1 pl-1">
                  {report.suspiciousReasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cleaned URL Strip Box */}
            {report.hasTrackingParams && (
              <div className="bg-[#0b0d14] border border-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1 text-gray-400">
                  <span>De-Tracked URL:</span>
                  <button
                    onClick={copyCleanUrl}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-[11px]"
                  >
                    {isCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    {isCopied ? 'Copied' : 'Copy Clean Link'}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-gray-300 break-all">{report.cleanUrl}</div>
              </div>
            )}

            {/* Action Buttons */}
            {onNavigate && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    onNavigate(report.cleanUrl);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium text-xs shadow-lg shadow-cyan-600/20 transition active:scale-95"
                >
                  <ExternalLink size={13} />
                  Open Cleaned Link
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
