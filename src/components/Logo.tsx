import React from "react";

interface LogoProps {
  className?: string;
  size?: number; // size in px
  showTextBeside?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 44, showTextBeside = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md rounded-full"
      >
        {/* Red Circle Background */}
        <circle cx="250" cy="250" r="245" fill="#EE1C25" />

        {/* Left V-Curve Sweeping Up */}
        <path
          d="M 100 135 C 130 250 170 320 230 310 C 270 300 290 200 315 135 C 300 200 270 310 220 320 C 150 330 115 230 100 135 Z"
          fill="#FFFFFF"
        />

        {/* Right A-Arch Curve */}
        <path
          d="M 270 310 C 290 240 320 135 385 135 C 440 135 480 250 500 315 C 475 250 440 165 385 165 C 330 165 305 240 270 310 Z"
          fill="#FFFFFF"
        />

        {/* Circle Dot under the Arch */}
        <circle cx="385" cy="230" r="25" fill="#FFFFFF" />

        {/* Brand Text: VASTHUSILPY */}
        <text
          x="250"
          y="370"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="48"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="2"
        >
          VASTHUSILPY
        </text>

        {/* Sub-text: KERALASSERY */}
        <text
          x="250"
          y="410"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="34"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="4"
        >
          KERALASSERY
        </text>
      </svg>

      {showTextBeside && (
        <div className="leading-tight">
          <div className="text-xs font-mono font-bold tracking-widest text-red-500 bg-red-950/80 px-2 py-0.5 rounded border border-red-800 uppercase inline-block mb-0.5">
            VASTHUSILPY
          </div>
          <div className="text-base font-black tracking-tight text-white font-sans uppercase">
            KERALASSERY
          </div>
        </div>
      )}
    </div>
  );
};
