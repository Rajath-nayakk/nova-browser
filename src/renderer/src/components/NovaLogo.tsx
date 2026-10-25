import React from 'react';

interface NovaLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export const NovaLogo: React.FC<NovaLogoProps> = ({
  size = 28,
  showText = false,
  className = '',
  textClassName = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_0_12px_rgba(139,92,246,0.4)]"
      >
        <defs>
          <linearGradient id="novaGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="shieldBorder" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {/* Outer Shield Hexagon */}
        <polygon
          points="50,6 92,26 92,72 50,94 8,72 8,26"
          fill="url(#novaGradient)"
          fillOpacity="0.18"
          stroke="url(#shieldBorder)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Inner Pulsar Starburst / Nova Core */}
        <path
          d="M50 20 L55 42 L77 47 L55 52 L50 74 L45 52 L23 47 L45 42 Z"
          fill="url(#novaGradient)"
          stroke="#ffffff"
          strokeWidth="1.2"
        />

        {/* Central Core Light */}
        <circle cx="50" cy="47" r="4.5" fill="#ffffff" />
        <circle cx="50" cy="47" r="9" stroke="#67e8f9" strokeWidth="1.5" strokeOpacity="0.8" />
      </svg>

      {showText && (
        <span
          className={`font-bold tracking-wider uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 ${textClassName}`}
        >
          NOVA
        </span>
      )}
    </div>
  );
};
