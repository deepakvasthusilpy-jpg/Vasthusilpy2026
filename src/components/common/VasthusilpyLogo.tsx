import React from "react";

interface VasthusilpyLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  className?: string;
  showText?: boolean;
}

export const VasthusilpyLogo: React.FC<VasthusilpyLogoProps> = ({
  size = "md",
  className = "",
  showText = true
}) => {
  const sizeMap: Record<string, string> = {
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const isNumeric = typeof size === "number";
  const currentSizeClass = !isNumeric ? (sizeMap[size] || "w-8 h-8") : "";
  const customDimensionStyle = isNumeric ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Red Circular Logo Badge */}
      <div
        style={customDimensionStyle}
        className={`${currentSizeClass} shrink-0 rounded-full bg-[#EE1C25] p-0.5 shadow-md shadow-red-600/30 border border-red-400/40 flex items-center justify-center relative overflow-hidden`}
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
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
      </div>

      {/* External Text Label if requested */}
      {showText && (
        <div className="flex flex-col text-left">
          <span className="font-mono font-black text-slate-100 tracking-wider text-base sm:text-lg leading-tight">
            VASTHUSILPY
          </span>
          <span className="text-[11px] font-mono font-bold text-red-500 tracking-widest uppercase">
            KERALASSERY • DIGITAL PORTAL
          </span>
        </div>
      )}
    </div>
  );
};
