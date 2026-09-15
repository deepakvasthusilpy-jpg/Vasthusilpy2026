import React from "react";
import { BuildingPlanProject, PlanSheet, NorthSignConfig } from "../../../types/buildingPlanTemplate";
import {
  Compass,
  RotateCw,
  RotateCcw,
  Sliders,
  Check,
  Move,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Crosshair
} from "lucide-react";

interface NorthCompassRotationToolProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onUpdateSheet: (updatedSheet: PlanSheet) => void;
  onUpdateProject: (updatedProject: BuildingPlanProject) => void;
}

export const NorthCompassRotationTool: React.FC<NorthCompassRotationToolProps> = ({
  project,
  activeSheet,
  onUpdateSheet,
  onUpdateProject
}) => {
  const currentAngle = typeof activeSheet.northRotation === "number" ? activeSheet.northRotation : project.defaultNorthRotation || 0;
  const northSign: NorthSignConfig = activeSheet.northSign || {
    x: 88,
    y: 8,
    scale: 1.0,
    rotation: currentAngle,
    style: "standard"
  };

  const isVisible = activeSheet.showNorthArrow !== false;

  const handleAngleChange = (newAngle: number) => {
    const normalized = (newAngle % 360 + 360) % 360;
    onUpdateSheet({
      ...activeSheet,
      northRotation: normalized,
      northSign: {
        ...northSign,
        rotation: normalized
      }
    });
  };

  const handleScaleChange = (scale: number) => {
    const clamped = Math.max(0.5, Math.min(2.5, scale));
    onUpdateSheet({
      ...activeSheet,
      northSign: {
        ...northSign,
        scale: clamped
      }
    });
  };

  const handlePositionChange = (x: number, y: number) => {
    onUpdateSheet({
      ...activeSheet,
      northSign: {
        ...northSign,
        x: Math.max(2, Math.min(95, x)),
        y: Math.max(2, Math.min(95, y))
      }
    });
  };

  const handleStyleChange = (style: "standard" | "vasthu_ashtadik" | "circle_compass" | "minimal") => {
    onUpdateSheet({
      ...activeSheet,
      northSign: {
        ...northSign,
        style
      }
    });
  };

  const handleToggleVisibility = () => {
    onUpdateSheet({
      ...activeSheet,
      showNorthArrow: !isVisible
    });
  };

  const handleApplyToAllSheets = () => {
    const updatedSheets = project.sheets.map((s) => ({
      ...s,
      northRotation: currentAngle,
      showNorthArrow: isVisible,
      northSign: {
        ...northSign,
        rotation: currentAngle
      }
    }));
    onUpdateProject({
      ...project,
      defaultNorthRotation: currentAngle,
      sheets: updatedSheets
    });
  };

  // Cardinal direction text
  const getDirectionName = (deg: number): { code: string; name: string; vasthu: string } => {
    if (deg >= 337.5 || deg < 22.5) return { code: "N", name: "North (വടക്ക്)", vasthu: "Kuberan (Wealth & Prosperity)" };
    if (deg >= 22.5 && deg < 67.5) return { code: "NE", name: "North-East (ഈശാനകോൺ)", vasthu: "Ishanya (Pooja, Well, Water tank)" };
    if (deg >= 67.5 && deg < 112.5) return { code: "E", name: "East (കിഴക്ക്)", vasthu: "Adithya / Indra (Main Entrance, Light)" };
    if (deg >= 112.5 && deg < 157.5) return { code: "SE", name: "South-East (അഗ്നികോൺ)", vasthu: "Agneya (Kitchen, Hearth, Electricals)" };
    if (deg >= 157.5 && deg < 202.5) return { code: "S", name: "South (തെക്ക്)", vasthu: "Yama (Heavy Structures, Bedrooms)" };
    if (deg >= 202.5 && deg < 247.5) return { code: "SW", name: "South-West (കന്നികോൺ)", vasthu: "Nirruthi (Master Bedroom, Highest Point)" };
    if (deg >= 247.5 && deg < 292.5) return { code: "W", name: "West (പടിഞ്ഞാറ്)", vasthu: "Varunan (Dining, Children study)" };
    return { code: "NW", name: "North-West (വായുകോൺ)", vasthu: "Vayu (Guest room, Granary, Vehicles)" };
  };

  const dir = getDirectionName(currentAngle);

  const CARDINAL_PRESETS = [
    { label: "North (0°)", deg: 0, code: "N" },
    { label: "North-East (45°)", deg: 45, code: "NE" },
    { label: "East (90°)", deg: 90, code: "E" },
    { label: "South-East (135°)", deg: 135, code: "SE" },
    { label: "South (180°)", deg: 180, code: "S" },
    { label: "South-West (225°)", deg: 225, code: "SW" },
    { label: "West (270°)", deg: 270, code: "W" },
    { label: "North-West (315°)", deg: 315, code: "NW" }
  ];

  const POSITION_PRESETS = [
    { label: "Top-Right", x: 88, y: 6 },
    { label: "Top-Left", x: 6, y: 6 },
    { label: "Bottom-Right", x: 88, y: 86 },
    { label: "Bottom-Left", x: 6, y: 86 },
    { label: "Center-Top", x: 47, y: 6 }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">North Sign: Resize, Reposition & Rotate</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Freely resize the North sign, reposition it anywhere across the architectural drawing sheet, rotate from 0° to 360°, and choose custom compass styles to comply with LSGD and Vasthu Shastra rules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleVisibility}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
              isVisible
                ? "bg-slate-800 text-slate-200 border-slate-700"
                : "bg-red-950/40 text-red-400 border-red-800"
            }`}
          >
            {isVisible ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-red-400" />}
            <span>{isVisible ? "Visible" : "Hidden"}</span>
          </button>

          <button
            onClick={handleApplyToAllSheets}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply to All Sheets</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Compass Dial Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center justify-between">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Live Needle Compass
            </span>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-950/60 px-2.5 py-0.5 rounded-full border border-red-800">
              {currentAngle}° • {dir.code}
            </span>
          </div>

          {/* Compass Dial Graphic */}
          <div className="relative w-56 h-56 rounded-full border-4 border-slate-800 bg-slate-950/90 shadow-2xl flex items-center justify-center p-4 my-2">
            <div className="absolute inset-2 rounded-full border border-dashed border-slate-700/50" />
            
            <span className="absolute top-2 font-mono text-xs font-black text-red-500">N (0°)</span>
            <span className="absolute right-2 font-mono text-xs font-bold text-slate-400">E (90°)</span>
            <span className="absolute bottom-2 font-mono text-xs font-bold text-slate-400">S (180°)</span>
            <span className="absolute left-2 font-mono text-xs font-bold text-slate-400">W (270°)</span>

            {/* Rotatable Needle Container */}
            <div
              className="w-32 h-32 flex items-center justify-center transition-transform duration-200"
              style={{
                transform: `rotate(${currentAngle}deg) scale(${northSign.scale || 1})`
              }}
            >
              <svg viewBox="0 0 40 40" className="w-28 h-28 drop-shadow-lg">
                <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="2.5" fill="#0f172a" />
                {/* Red North Arrow */}
                <polygon points="20,3 25,20 20,17" fill="#dc2626" />
                <polygon points="20,3 15,20 20,17" fill="#991b1b" />
                {/* Slate South Tail */}
                <polygon points="20,37 25,20 20,23" fill="#64748b" />
                <polygon points="20,37 15,20 20,23" fill="#94a3b8" />
                <text x="20" y="2.5" textAnchor="middle" fontSize="6" fontWeight="black" fill="#dc2626">
                  N
                </text>
              </svg>
            </div>
          </div>

          {/* Current Orientation Summary */}
          <div className="mt-4 w-full bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Orientation:</span>
              <strong className="text-white">{dir.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Size Scale:</span>
              <span className="text-blue-400 font-mono font-bold">{Math.round((northSign.scale || 1) * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Position on Sheet:</span>
              <span className="text-slate-300 font-mono">X: {Math.round(northSign.x)}%, Y: {Math.round(northSign.y)}%</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Vasthu Shastra Rule:</span>
              <span className="text-amber-400 font-medium text-right max-w-[200px] truncate">{dir.vasthu}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Resize, Reposition & Rotation Controls (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          
          {/* 1. RESIZE CONTROLS */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                RESIZE NORTH SIGN (SCALE)
              </span>
              <span className="font-mono text-sm text-blue-400 font-black">
                {Math.round((northSign.scale || 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={northSign.scale || 1}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex items-center gap-2 pt-1">
              {[
                { label: "Compact (70%)", scale: 0.7 },
                { label: "Standard (100%)", scale: 1.0 },
                { label: "Large (130%)", scale: 1.3 },
                { label: "Prominent (175%)", scale: 1.75 }
              ].map((sz) => (
                <button
                  key={sz.label}
                  onClick={() => handleScaleChange(sz.scale)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition ${
                    Math.abs((northSign.scale || 1) - sz.scale) < 0.05
                      ? "bg-blue-600 border-blue-500 text-white font-bold"
                      : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. REPOSITION CONTROLS */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                REPOSITION POSITION ON SHEET
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                (Can also drag directly on drawing)
              </span>
            </div>

            {/* Quick Position Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {POSITION_PRESETS.map((pos) => {
                const isMatch = Math.abs(northSign.x - pos.x) < 5 && Math.abs(northSign.y - pos.y) < 5;
                return (
                  <button
                    key={pos.label}
                    onClick={() => handlePositionChange(pos.x, pos.y)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-mono border text-center transition ${
                      isMatch
                        ? "bg-amber-500 text-slate-950 font-bold border-amber-500 shadow"
                        : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>

            {/* Coordinate Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block mb-0.5">X Position (%):</span>
                <input
                  type="number"
                  min="2"
                  max="95"
                  value={Math.round(northSign.x)}
                  onChange={(e) => handlePositionChange(parseFloat(e.target.value) || 0, northSign.y)}
                  className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block mb-0.5">Y Position (%):</span>
                <input
                  type="number"
                  min="2"
                  max="95"
                  value={Math.round(northSign.y)}
                  onChange={(e) => handlePositionChange(northSign.x, parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. ROTATION SLIDER & CARDINAL PRESETS */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                ROTATION ANGLE (0° TO 360°)
              </span>
              <span className="font-mono text-sm text-emerald-400 font-black">{currentAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={currentAngle}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => handleAngleChange(currentAngle - 15)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>- 15°</span>
              </button>
              <button
                onClick={() => handleAngleChange(0)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
              >
                Reset 0° (North Up)
              </button>
              <button
                onClick={() => handleAngleChange(currentAngle + 15)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>+ 15°</span>
              </button>
            </div>

            {/* 8 Cardinal Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
              {CARDINAL_PRESETS.map((p) => {
                const isActive = currentAngle === p.deg;
                return (
                  <button
                    key={p.deg}
                    onClick={() => handleAngleChange(p.deg)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isActive
                        ? "bg-red-600 border-red-500 text-white font-bold shadow-md shadow-red-600/30"
                        : "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="text-xs font-black">{p.code}</div>
                    <div className="text-[10px] opacity-80">{p.deg}°</div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
