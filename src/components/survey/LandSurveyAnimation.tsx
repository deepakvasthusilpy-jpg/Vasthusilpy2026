import React from "react";
import { Compass, Radio, Zap, Shield, Crosshair } from "lucide-react";

interface LandSurveyAnimationProps {
  status: "idle" | "recording" | "evaluating" | "speaking";
}

export const LandSurveyAnimation: React.FC<LandSurveyAnimationProps> = ({ status }) => {
  return (
    <div className="relative w-full h-44 sm:h-52 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center bg-blueprint-grid">
      {/* Background Laser Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

      {/* SVG Canvas for Geodetic Plot & Survey Total Station */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 220" fill="none">
        <defs>
          <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="laserBeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Geodetic Circles */}
        <circle cx="300" cy="110" r="90" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="300" cy="110" r="65" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="300" cy="110" r="40" stroke="#334155" strokeWidth="1" />

        {/* Crosshair Axes */}
        <line x1="160" y1="110" x2="440" y2="110" stroke="#1e293b" strokeWidth="1" />
        <line x1="300" y1="20" x2="300" y2="200" stroke="#1e293b" strokeWidth="1" />

        {/* Irregular Boundary Plot Polygon (Cadastral / FMB Plot) */}
        <polygon
          points="220,60 380,45 420,150 280,175 190,130"
          stroke={status === "evaluating" ? "#06b6d4" : status === "recording" ? "#ef4444" : "#3b82f6"}
          strokeWidth="2"
          fill={status === "evaluating" ? "#06b6d4" : status === "recording" ? "#ef4444" : "#3b82f6"}
          fillOpacity={status === "evaluating" ? "0.15" : "0.08"}
          className={status === "evaluating" ? "animate-pulse" : ""}
          filter="url(#glow)"
        />

        {/* G-Lines (Diagonals for Triangulation) */}
        <line x1="220" y1="60" x2="420" y2="150" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <line x1="380" y1="45" x2="190" y2="130" stroke="#0284c7" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

        {/* Boundary Corner Pillars (Survey Stones) */}
        <g>
          {/* Corner 1 */}
          <circle cx="220" cy="60" r="4" fill="#38bdf8" filter="url(#glow)" />
          <text x="210" y="52" fill="#38bdf8" fontSize="10" fontFamily="monospace">A (12.4m)</text>

          {/* Corner 2 */}
          <circle cx="380" cy="45" r="4" fill="#38bdf8" filter="url(#glow)" />
          <text x="388" y="42" fill="#38bdf8" fontSize="10" fontFamily="monospace">B (18.2m)</text>

          {/* Corner 3 */}
          <circle cx="420" cy="150" r="4" fill="#38bdf8" filter="url(#glow)" />
          <text x="428" y="155" fill="#38bdf8" fontSize="10" fontFamily="monospace">C (14.6m)</text>

          {/* Corner 4 */}
          <circle cx="280" cy="175" r="4" fill="#38bdf8" filter="url(#glow)" />
          <text x="275" y="190" fill="#38bdf8" fontSize="10" fontFamily="monospace">D (11.0m)</text>

          {/* Corner 5 */}
          <circle cx="190" cy="130" r="4" fill="#38bdf8" filter="url(#glow)" />
          <text x="165" y="135" fill="#38bdf8" fontSize="10" fontFamily="monospace">E (8.5m)</text>
        </g>

        {/* Total Station / Theodolite Tripod & Laser Ray */}
        <g transform="translate(100, 120)">
          {/* Tripod Legs */}
          <line x1="25" y1="25" x2="5" y2="65" stroke="#64748b" strokeWidth="2.5" />
          <line x1="25" y1="25" x2="25" y2="68" stroke="#64748b" strokeWidth="2.5" />
          <line x1="25" y1="25" x2="45" y2="65" stroke="#64748b" strokeWidth="2.5" />

          {/* Tribrach Base */}
          <rect x="15" y="20" width="20" height="6" fill="#334155" rx="1" />

          {/* Total Station Housing */}
          <rect x="18" y="6" width="14" height="15" fill="#0284c7" rx="2" />
          <circle cx="25" cy="13" r="3" fill="#38bdf8" />

          {/* Laser Emitter Beam */}
          <line
            x1="25"
            y1="13"
            x2="280"
            y2="-45"
            stroke={status === "recording" ? "#ef4444" : "#06b6d4"}
            strokeWidth={status === "evaluating" || status === "recording" ? "2.5" : "1"}
            strokeDasharray={status === "idle" ? "4 4" : "none"}
            className={status === "evaluating" ? "animate-pulse" : ""}
            filter="url(#glow)"
          />
        </g>

        {/* Rotating Radar Sweep Line */}
        <g transform="translate(300, 110)">
          <line
            x1="0"
            y1="0"
            x2="90"
            y2="0"
            stroke={status === "recording" ? "#ef4444" : "#3b82f6"}
            strokeWidth="2"
            opacity="0.8"
            filter="url(#glow)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur={status === "evaluating" ? "2s" : status === "recording" ? "1.5s" : "6s"}
              repeatCount="indefinite"
            />
          </line>
        </g>
      </svg>

      {/* Floating Status Badge & Live Readouts */}
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            status === "recording"
              ? "bg-rose-500 animate-ping"
              : status === "evaluating"
              ? "bg-cyan-400 animate-spin"
              : status === "speaking"
              ? "bg-emerald-400 animate-bounce"
              : "bg-blue-500 animate-pulse"
          }`}
        ></div>

        <span className="font-bold text-white uppercase text-[11px]">
          {status === "recording"
            ? "RECORDING VOICE INPUT (ശബ്ദം റെക്കോർഡ് ചെയ്യുന്നു)..."
            : status === "evaluating"
            ? "SURVEY AI CALCULATING (വിശകലനം ചെയ്യുന്നു)..."
            : status === "speaking"
            ? "VOICE AUDIO OUTPUT PLAYING (മറുപടി വായിക്കുന്നു)..."
            : "TOTAL STATION ACTIVE • FMB RADAR ONLINE"}
        </span>
      </div>

      {/* Top Right Live Coordinates */}
      <div className="absolute top-3 right-3 hidden sm:flex flex-col items-end font-mono text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
        <span className="text-cyan-400 font-bold">LAT: 10° 31' 24" N</span>
        <span className="text-blue-400 font-bold">LON: 76° 12' 40" E</span>
      </div>

      {/* Bottom Center Audio/Scanning Waves when active */}
      {status === "speaking" && (
        <div className="absolute bottom-3 flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-800 px-3 py-1 rounded-full text-emerald-300 font-mono text-xs animate-pulse">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-[10px] tracking-wider">SPEAKING RESPONSE AUDIO...</span>
          <div className="flex items-center gap-0.5 h-3">
            <span className="w-1 bg-emerald-400 h-2 animate-bounce"></span>
            <span className="w-1 bg-emerald-400 h-3 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1 bg-emerald-400 h-1 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}

      {status === "recording" && (
        <div className="absolute bottom-3 flex items-center gap-1.5 bg-rose-950/90 border border-rose-800 px-3.5 py-1 rounded-full text-rose-300 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span className="font-bold text-[11px] uppercase tracking-wider">LISTENING... HOLD BUTTON TO RECORD</span>
        </div>
      )}
    </div>
  );
};
