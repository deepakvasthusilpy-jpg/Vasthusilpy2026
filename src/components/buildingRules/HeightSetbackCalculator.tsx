import React, { useState } from "react";
import { OCCUPANCY_COMPARISON_DATA, OccupancyComparisonRow } from "../../data/occupancyComparisonData";
import { Sliders, ArrowRight, ShieldAlert, CheckCircle2, Building, Info } from "lucide-react";

export const HeightSetbackCalculator: React.FC = () => {
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>("Group A1");
  const [buildingHeight, setBuildingHeight] = useState<number>(14);

  const selectedGroup = OCCUPANCY_COMPARISON_DATA.find((g) => g.groupCode === selectedGroupCode) || OCCUPANCY_COMPARISON_DATA[0];

  // Rule 26(6) calculation:
  // For building height > 10m, +0.5m per 3m (or part thereof) above 10m.
  const heightAbove10 = Math.max(0, buildingHeight - 10);
  const increments = heightAbove10 > 0 ? Math.ceil(heightAbove10 / 3) : 0;
  const additionalSetback = increments * 0.5;

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                KPBR RULE 26(6)
              </span>
              <span className="text-xs text-slate-400 font-mono">Interactive Auditor</span>
            </div>
            <h3 className="text-base font-bold text-white font-sans">
              Height-Based Setback Increment Calculator
            </h3>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800 self-start sm:self-auto">
          +0.5m per 3m above 10m
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Controls */}
        <div className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div>
            <label className="text-xs font-mono font-bold text-slate-300 uppercase block mb-1.5">
              1. Select Occupancy Group:
            </label>
            <select
              value={selectedGroupCode}
              onChange={(e) => setSelectedGroupCode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-sans"
            >
              {OCCUPANCY_COMPARISON_DATA.map((g) => (
                <option key={g.groupCode} value={g.groupCode}>
                  {g.groupCode}: {g.titleEn} ({g.titleMl})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                2. Proposed Building Height:
              </label>
              <span className="text-sm font-mono font-black text-cyan-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700">
                {buildingHeight.toFixed(1)} metres
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="36"
              step="0.5"
              value={buildingHeight}
              onChange={(e) => setBuildingHeight(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>3m (Single Flr)</span>
              <span className="text-amber-400 font-bold">10m (Standard Base)</span>
              <span>15m (Fire NOC)</span>
              <span>24m+ (High Rise)</span>
              <span>36m</span>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-mono text-slate-400 self-center">Presets:</span>
            {[8, 10, 12, 14, 16, 20, 24].map((h) => (
              <button
                key={h}
                onClick={() => setBuildingHeight(h)}
                className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                  buildingHeight === h
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {h}m
              </button>
            ))}
          </div>
        </div>

        {/* Calculation Result */}
        <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="text-xs font-mono text-slate-400 uppercase font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>Statutory Increment Breakdown</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
              buildingHeight > 10 ? "bg-amber-950 text-amber-300 border border-amber-800" : "bg-emerald-950 text-emerald-300 border border-emerald-800"
            }`}>
              {buildingHeight > 10 ? "Rule 26(6) Triggered" : "Standard Base Setback"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Height &gt; 10m</span>
              <span className="text-sm font-bold text-white">
                {heightAbove10 > 0 ? `${heightAbove10.toFixed(1)}m` : "0m"}
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">3m Slabs</span>
              <span className="text-sm font-bold text-cyan-400">
                {increments} {increments === 1 ? "step" : "steps"}
              </span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Add. Setback</span>
              <span className={`text-sm font-bold ${additionalSetback > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                +{additionalSetback.toFixed(2)}m
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-xs font-sans text-slate-300">
              <strong>Base Setbacks for {selectedGroup.groupCode} (&le;10m):</strong>
              <div className="text-[11px] font-mono text-cyan-300 mt-0.5">
                {selectedGroup.setbacksUpTo10m.display}
              </div>
            </div>

            {additionalSetback > 0 ? (
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mandatory Additional Setback: +{additionalSetback.toFixed(2)}m to ALL sides</span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  As the proposed height of {buildingHeight}m exceeds 10m by {heightAbove10.toFixed(1)}m, an extra{" "}
                  <strong className="text-white">+{additionalSetback.toFixed(2)} metres</strong> must be added to the Front, Rear, and both Side yards.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-300 font-sans">
                  Building height does not exceed 10m. No additional setback increment required under Rule 26(6).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
