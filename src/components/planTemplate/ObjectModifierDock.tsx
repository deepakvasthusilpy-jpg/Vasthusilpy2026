import React from "react";
import {
  PlanSheet,
  PlanSymbolItem,
  PlanAttachment,
  NorthSignConfig,
  BuildingPlanProject
} from "../../types/buildingPlanTemplate";
import {
  Trash2,
  Move,
  RotateCw,
  RotateCcw,
  Sliders,
  Palette,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check,
  X,
  Tag,
  Compass,
  FileText,
  Stamp,
  ZoomIn,
  ZoomOut
} from "lucide-react";

export type SelectedObjectType = "symbol" | "attachment" | "north" | "title_block" | null;

export interface SelectedTargetInfo {
  type: "symbol" | "attachment" | "north" | "title_block";
  id?: string;
}

interface ObjectModifierDockProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  selectedTarget: SelectedTargetInfo | null;
  onClose: () => void;
  onUpdateSheet: (updatedSheet: PlanSheet) => void;
  onUpdateProject?: (updatedProject: BuildingPlanProject) => void;
  onSwitchSubtab?: (tabId: string) => void;
}

const COLOR_PALETTE = [
  { name: "Black (Standard)", value: "#0f172a", bg: "bg-slate-900" },
  { name: "Blueprint Blue", value: "#1d4ed8", bg: "bg-blue-700" },
  { name: "LSGD Red", value: "#dc2626", bg: "bg-red-600" },
  { name: "Forest Green", value: "#15803d", bg: "bg-emerald-700" },
  { name: "Teak Wood", value: "#92400e", bg: "bg-amber-800" },
  { name: "Slate Gray", value: "#64748b", bg: "bg-slate-500" },
  { name: "Cyan Technical", value: "#0891b2", bg: "bg-cyan-600" },
  { name: "Purple Accent", value: "#7c3aed", bg: "bg-purple-600" }
];

const FILL_PALETTE = [
  { name: "Solid White", value: "#ffffff", border: "border-slate-300", bg: "bg-white" },
  { name: "Light Soft Slate", value: "#f1f5f9", border: "border-slate-300", bg: "bg-slate-100" },
  { name: "Soft Cyan", value: "#ecfeff", border: "border-cyan-200", bg: "bg-cyan-50" },
  { name: "Soft Sand", value: "#fef3c7", border: "border-amber-200", bg: "bg-amber-100" },
  { name: "Soft Sage", value: "#f0fdf4", border: "border-emerald-200", bg: "bg-emerald-50" },
  { name: "Transparent", value: "none", border: "border-dashed border-slate-400", bg: "bg-transparent" }
];

export const ObjectModifierDock: React.FC<ObjectModifierDockProps> = ({
  project,
  activeSheet,
  selectedTarget,
  onClose,
  onUpdateSheet,
  onUpdateProject,
  onSwitchSubtab
}) => {
  if (!selectedTarget) return null;

  // 1. SYMBOL MODIFIER
  if (selectedTarget.type === "symbol" && selectedTarget.id) {
    const symbol = (activeSheet.symbols || []).find((s) => s.id === selectedTarget.id);
    if (!symbol) {
      return (
        <div className="p-4 text-center text-slate-400 text-xs font-mono">
          Object not found or deleted.
          <button onClick={onClose} className="mt-2 block mx-auto px-3 py-1 bg-slate-800 rounded text-slate-200">
            Close
          </button>
        </div>
      );
    }

    const updateSymbol = (updates: Partial<PlanSymbolItem>) => {
      const updatedSymbols = (activeSheet.symbols || []).map((s) =>
        s.id === symbol.id ? { ...s, ...updates } : s
      );
      onUpdateSheet({ ...activeSheet, symbols: updatedSymbols });
    };

    const handleDelete = () => {
      const updatedSymbols = (activeSheet.symbols || []).filter((s) => s.id !== symbol.id);
      onUpdateSheet({ ...activeSheet, symbols: updatedSymbols });
      onClose();
    };

    const handleNudge = (dx: number, dy: number) => {
      const nextX = Math.max(0, Math.min(95, Math.round(((symbol.x || 0) + dx) * 10) / 10));
      const nextY = Math.max(0, Math.min(95, Math.round(((symbol.y || 0) + dy) * 10) / 10));
      updateSymbol({ x: nextX, y: nextY });
    };

    return (
      <div className="space-y-4 text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800/60">
                {symbol.category?.toUpperCase() || "SYMBOL"}
              </span>
              <h4 className="font-bold text-white text-sm truncate max-w-[170px]">{symbol.name}</h4>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Click canvas to reposition or use tools below</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
            title="Deselect object"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: Delete */}
        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px]">Quick Action:</span>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Delete this 2D symbol"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Symbol</span>
          </button>
        </div>

        {/* 1. MOVE & POSITION */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-cyan-400" />
              <span>Position & Nudge</span>
            </span>
            <span className="text-[10px] text-slate-500">X: {symbol.x}%, Y: {symbol.y}%</span>
          </div>

          {/* 4-Way Nudge Controller */}
          <div className="flex items-center justify-center gap-1 py-1">
            <button
              onClick={() => handleNudge(-1, 0)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
              title="Move Left (1%)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNudge(0, -1)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
                title="Move Up (1%)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNudge(0, 1)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
                title="Move Down (1%)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => handleNudge(1, 0)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
              title="Move Right (1%)"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Coordinate Sliders */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="text-slate-400 block mb-1">X Offset ({symbol.x}%)</label>
              <input
                type="range"
                min="0"
                max="95"
                step="0.5"
                value={symbol.x}
                onChange={(e) => updateSymbol({ x: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Y Offset ({symbol.y}%)</label>
              <input
                type="range"
                min="0"
                max="95"
                step="0.5"
                value={symbol.y}
                onChange={(e) => updateSymbol({ y: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* 2. ROTATION */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotation ({symbol.rotation || 0}°)</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateSymbol({ rotation: (((symbol.rotation || 0) - 45) + 360) % 360 })}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px]"
                title="Rotate -45°"
              >
                -45°
              </button>
              <button
                onClick={() => updateSymbol({ rotation: ((symbol.rotation || 0) + 45) % 360 })}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-[10px]"
                title="Rotate +45°"
              >
                +45°
              </button>
            </div>
          </div>

          {/* Angle Presets */}
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => updateSymbol({ rotation: deg })}
                className={`py-1 rounded border text-center font-bold transition ${
                  (symbol.rotation || 0) === deg
                    ? "bg-amber-600 text-white border-amber-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="355"
            step="5"
            value={symbol.rotation || 0}
            onChange={(e) => updateSymbol({ rotation: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500"
          />
        </div>

        {/* 3. RESIZE / SCALE */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scale / Resize</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-400">{(symbol.scale || 1.0).toFixed(1)}x</span>
          </div>

          <input
            type="range"
            min="0.4"
            max="2.5"
            step="0.1"
            value={symbol.scale || 1.0}
            onChange={(e) => updateSymbol({ scale: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500"
          />

          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {[0.8, 1.0, 1.2, 1.5].map((sc) => (
              <button
                key={sc}
                onClick={() => updateSymbol({ scale: sc })}
                className={`py-1 rounded border text-center font-bold transition ${
                  Math.abs((symbol.scale || 1.0) - sc) < 0.05
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {sc}x
              </button>
            ))}
          </div>
        </div>

        {/* 4. COLOUR CHANGE */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Line / Stroke Color</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase">{symbol.color || "#0f172a"}</span>
          </div>

          {/* Palette Colors */}
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.value}
                onClick={() => updateSymbol({ color: c.value })}
                className={`flex items-center gap-1.5 p-1 rounded-lg border text-left text-[9px] transition cursor-pointer ${
                  (symbol.color || "#0f172a") === c.value
                    ? "border-purple-400 bg-purple-950/40 text-white"
                    : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                }`}
                title={c.name}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${c.bg} flex-shrink-0 border border-white/20`} />
                <span className="truncate">{c.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>

          {/* Fill Color */}
          <div className="pt-2 border-t border-slate-900">
            <label className="text-slate-400 text-[10px] block mb-1.5">Fill Interior Color:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {FILL_PALETTE.map((f) => (
                <button
                  key={f.value}
                  onClick={() => updateSymbol({ fillColor: f.value })}
                  className={`flex items-center gap-1.5 p-1 rounded-lg border text-left text-[9px] transition cursor-pointer ${
                    (symbol.fillColor || "#ffffff") === f.value
                      ? "border-cyan-400 bg-cyan-950/40 text-white"
                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                  }`}
                  title={f.name}
                >
                  <span className={`w-3.5 h-3.5 rounded ${f.bg} ${f.border} flex-shrink-0`} />
                  <span className="truncate">{f.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. ATTRIBUTES & FLIP */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <span className="font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Attributes & Swing</span>
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Flip Horizontal */}
            <button
              onClick={() => updateSymbol({ flipH: !symbol.flipH })}
              className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                symbol.flipH
                  ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Flip Swing Direction horizontally"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Flip H</span>
            </button>

            {/* Flip Vertical */}
            <button
              onClick={() => updateSymbol({ flipV: !symbol.flipV })}
              className={`py-1.5 px-2 rounded-lg border text-center text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                symbol.flipV
                  ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Flip Swing Inward/Outward vertically"
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip V</span>
            </button>
          </div>

          {/* Label Input */}
          <div>
            <label className="text-slate-400 text-[10px] block mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>Custom Label / Room Code:</span>
            </label>
            <input
              type="text"
              value={symbol.label || ""}
              onChange={(e) => updateSymbol({ label: e.target.value })}
              placeholder="e.g. D1, W1, Master Bed"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. ATTACHMENT MODIFIER (Floor Plan, Elevation, Section)
  if (selectedTarget.type === "attachment" && selectedTarget.id) {
    const attachments = activeSheet.attachments || [];
    const att = attachments.find((a) => a.id === selectedTarget.id);

    if (!att) {
      return (
        <div className="p-4 text-center text-slate-400 text-xs font-mono">
          Plan drawing not found.
          <button onClick={onClose} className="mt-2 block mx-auto px-3 py-1 bg-slate-800 rounded text-slate-200">
            Close
          </button>
        </div>
      );
    }

    const updateAtt = (updates: Partial<PlanAttachment>) => {
      const updated = attachments.map((a) => (a.id === att.id ? { ...a, ...updates } : a));
      onUpdateSheet({ ...activeSheet, attachments: updated });
    };

    const handleDelete = () => {
      const updated = attachments.filter((a) => a.id !== att.id);
      onUpdateSheet({ ...activeSheet, attachments: updated });
      onClose();
    };

    const handleNudge = (dx: number, dy: number) => {
      const nextX = Math.max(0, Math.min(95, Math.round(((att.x || 0) + dx) * 10) / 10));
      const nextY = Math.max(0, Math.min(95, Math.round(((att.y || 0) + dy) * 10) / 10));
      updateAtt({ x: nextX, y: nextY });
    };

    return (
      <div className="space-y-4 text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold text-[10px] border border-blue-800/60">
                PLAN DRAWING
              </span>
              <h4 className="font-bold text-white text-sm truncate max-w-[170px]">{att.title}</h4>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Architectural Plan Layer</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
            title="Deselect drawing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Delete button */}
        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
          <span className="text-slate-400 text-[11px]">Layer Action:</span>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Remove plan from this sheet"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove Drawing</span>
          </button>
        </div>

        {/* Drawing Title & Scale */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <span className="font-bold text-slate-200 block">Drawing Info</span>
          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Title Caption:</label>
            <input
              type="text"
              value={att.title}
              onChange={(e) => updateAtt({ title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">Scale Tag:</label>
              <select
                value={att.scale || "1 : 100"}
                onChange={(e) => updateAtt({ scale: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="1 : 50">1 : 50</option>
                <option value="1 : 100">1 : 100</option>
                <option value="1 : 200">1 : 200</option>
                <option value="1 : 500">1 : 500</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">Lock Position:</label>
              <button
                onClick={() => updateAtt({ locked: !att.locked })}
                className={`w-full py-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition ${
                  att.locked
                    ? "bg-amber-950/60 border-amber-600 text-amber-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {att.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                <span>{att.locked ? "Locked" : "Unlocked"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. MOVE & NUDGE */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-blue-400" />
              <span>Position (X: {att.x}%, Y: {att.y}%)</span>
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 py-1">
            <button
              onClick={() => handleNudge(-2, 0)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
              title="Nudge Left"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNudge(0, -2)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
                title="Nudge Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleNudge(0, 2)}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
                title="Nudge Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => handleNudge(2, 0)}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-800"
              title="Nudge Right"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <label className="text-slate-400 block mb-1">X Coord ({att.x}%)</label>
              <input
                type="range"
                min="0"
                max="90"
                value={att.x}
                onChange={(e) => updateAtt({ x: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Y Coord ({att.y}%)</label>
              <input
                type="range"
                min="0"
                max="90"
                value={att.y}
                onChange={(e) => updateAtt({ y: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 2. RESIZE & ZOOM */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Canvas Width & Zoom</span>
            </span>
            <span className="text-emerald-400 font-bold">{att.width || 90}%</span>
          </div>

          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Sheet Width Footprint ({att.width || 90}%):</label>
            <input
              type="range"
              min="20"
              max="98"
              value={att.width || 90}
              onChange={(e) => updateAtt({ width: parseInt(e.target.value, 10) })}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-400 text-[10px] block mb-1">Zoom Factor ({att.zoom || 100}%):</label>
            <input
              type="range"
              min="40"
              max="220"
              value={att.zoom || 100}
              onChange={(e) => updateAtt({ zoom: parseInt(e.target.value, 10) })}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* 3. ROTATION */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Rotate Drawing ({att.rotation || 0}°)</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => updateAtt({ rotation: deg })}
                className={`py-1 rounded border text-center font-bold transition ${
                  (att.rotation || 0) === deg
                    ? "bg-amber-600 text-white border-amber-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. NORTH SIGN MODIFIER
  if (selectedTarget.type === "north") {
    const northAngle =
      typeof activeSheet.northRotation === "number"
        ? activeSheet.northRotation
        : activeSheet.northSign?.rotation || 0;
    const northConfig: NorthSignConfig = activeSheet.northSign || {
      x: 88,
      y: 5,
      scale: 1,
      rotation: northAngle,
      style: "standard"
    };

    const updateNorth = (updates: Partial<NorthSignConfig>, newAngle?: number) => {
      const angle = newAngle !== undefined ? newAngle : northConfig.rotation;
      onUpdateSheet({
        ...activeSheet,
        northRotation: angle,
        northSign: {
          ...northConfig,
          ...updates,
          rotation: angle
        }
      });
    };

    return (
      <div className="space-y-4 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-red-500" />
            <h4 className="font-bold text-white text-sm">North Orientation</h4>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Angle Slider */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200">Angle Direction</span>
            <span className="text-red-400 font-bold text-sm">{northAngle}°</span>
          </div>

          <input
            type="range"
            min="0"
            max="355"
            step="5"
            value={northAngle}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              updateNorth({}, val);
            }}
            className="w-full accent-red-500"
          />

          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {[
              { label: "N (0°)", deg: 0 },
              { label: "E (90°)", deg: 90 },
              { label: "S (180°)", deg: 180 },
              { label: "W (270°)", deg: 270 }
            ].map((d) => (
              <button
                key={d.deg}
                onClick={() => updateNorth({}, d.deg)}
                className={`py-1 rounded border text-center font-bold transition ${
                  northAngle === d.deg
                    ? "bg-red-600 text-white border-red-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compass Style */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <span className="font-bold text-slate-200 block">Compass Symbol Style</span>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {[
              { id: "standard", label: "Standard Architectural" },
              { id: "vasthu_ashtadik", label: "Vasthu 8-Directions" },
              { id: "circle_compass", label: "Circular Compass" },
              { id: "minimal", label: "Minimalist Arrow" }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => updateNorth({ style: st.id as any })}
                className={`p-2 rounded-lg border text-left font-bold transition ${
                  (northConfig.style || "standard") === st.id
                    ? "bg-red-950/60 border-red-500 text-red-300"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scale */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200">Scale Multiplier</span>
            <span className="text-cyan-400">{(northConfig.scale || 1.0).toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="2.2"
            step="0.1"
            value={northConfig.scale || 1.0}
            onChange={(e) => updateNorth({ scale: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>
      </div>
    );
  }

  // 4. TITLE BLOCK MODIFIER
  if (selectedTarget.type === "title_block") {
    const stripWidthMm = project.stripWidthMm || 70;

    return (
      <div className="space-y-4 text-xs font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Stamp className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-white text-sm">Title Block & Strip</h4>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title Block Width Control (User specifically requested draggable/adjustable width) */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Title Block Width</span>
            </span>
            <span className="text-cyan-300 font-bold text-sm">{stripWidthMm} mm</span>
          </div>

          <p className="text-[10px] text-slate-400">
            Drag the vertical divider line on the canvas or use the slider below to increase / decrease Title Block width:
          </p>

          <input
            type="range"
            min="50"
            max="115"
            step="1"
            value={stripWidthMm}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (onUpdateProject) {
                onUpdateProject({ ...project, stripWidthMm: val });
              }
            }}
            className="w-full accent-cyan-500"
          />

          <div className="grid grid-cols-5 gap-1 text-[10px]">
            {[50, 60, 70, 85, 100].map((mm) => (
              <button
                key={mm}
                onClick={() => {
                  if (onUpdateProject) {
                    onUpdateProject({ ...project, stripWidthMm: mm });
                  }
                }}
                className={`py-1 rounded border text-center font-bold transition ${
                  stripWidthMm === mm
                    ? "bg-cyan-600 text-white border-cyan-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {mm}mm
              </button>
            ))}
          </div>
        </div>

        {/* Link to Full Title Block & Margins Tool */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <span className="font-bold text-slate-200 block">Complete Title Block Details</span>
          <p className="text-[10px] text-slate-400">
            Edit Licensee credentials, Area statement table, Client name, and Vasthu score:
          </p>
          <button
            onClick={() => {
              if (onSwitchSubtab) onSwitchSubtab("title_block");
              onClose();
            }}
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition"
          >
            Open Title Block & Margins Tool
          </button>
        </div>
      </div>
    );
  }

  return null;
};
