import React, { useState } from "react";
import { Building2, ArrowUpDown, CheckCircle2, AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { calculateHeightAndSetbacks } from "../masterCalcEngine";

interface Props {
  roadWidthM: number;
  onRoadWidthChange?: (width: number) => void;
  frontYardM: number;
  onFrontYardChange?: (yard: number) => void;
  buildingHeightM: number;
  onBuildingHeightChange?: (height: number) => void;
}

export const HeightSetbackCalculator: React.FC<Props> = ({
  roadWidthM,
  onRoadWidthChange,
  frontYardM,
  onFrontYardChange,
  buildingHeightM,
  onBuildingHeightChange
}) => {
  const [localRoad, setLocalRoad] = useState<number>(roadWidthM || 5.0);
  const [localFrontYard, setLocalFrontYard] = useState<number>(frontYardM || 3.0);
  const [localHeight, setLocalHeight] = useState<number>(buildingHeightM || 12.5);
  const [baseSetback, setBaseSetback] = useState<number>(3.0);

  const road = onRoadWidthChange ? roadWidthM : localRoad;
  const front = onFrontYardChange ? frontYardM : localFrontYard;
  const height = onBuildingHeightChange ? buildingHeightM : localHeight;

  const result = calculateHeightAndSetbacks(road, front, height, baseSetback);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
            KPBR Rules 23, 24 & 26(2)
          </span>
          <span className="text-xs font-mono text-slate-400">Height Limitations & Progressive Setback Additions</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          കെട്ടിട ഉയര പരിധിയും സെറ്റ്ബാക്ക് വർദ്ധനവും (HEIGHT & SETBACK ADDITIONS)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          റോഡ് വീതിയും മുൻമുറ്റവും അടിസ്ഥാനമാക്കിയുള്ള പരമാവധി അനുവദനീയ കെട്ടിട ഉയരവും (Rule 24),
          10 മീറ്ററിന് മുകളിൽ ഉയരമുള്ള കെട്ടിടങ്ങൾക്ക് ഓരോ 3 മീറ്ററിനും 0.5 മീറ്റർ വീതം സെറ്റ്ബാക്ക്
          വർദ്ധിപ്പിക്കേണ്ട ചട്ടവും (Rule 26(2)) കൃത്യമായി നിർണ്ണയിക്കുക.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6: Form Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>അളവുകൾ നൽകുക (Dimensional Inputs)</span>
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  റോഡ് വീതി (Abutting Street Width)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={road}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onRoadWidthChange) onRoadWidthChange(v);
                      else setLocalRoad(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-purple-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  നൽകിയിട്ടുള്ള മുൻമുറ്റം (Front Yard Setback Provided)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    value={front}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onFrontYardChange) onFrontYardChange(v);
                      else setLocalFrontYard(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-purple-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  നിർദ്ദിഷ്ട കെട്ടിട ഉയരം (Proposed Building Height)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={height}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onBuildingHeightChange) onBuildingHeightChange(v);
                      else setLocalHeight(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-purple-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  തറനിരപ്പിൽ നിന്നുള്ള ഉയരം
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  അടിസ്ഥാന സെറ്റ്ബാക്ക് (Base Mandatory Setback at Ground)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={baseSetback}
                    onChange={(e) => setBaseSetback(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-purple-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Rule Formula */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 font-mono text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px]">
              <Info className="w-3.5 h-3.5 text-purple-400" />
              <span>ചട്ട സമവാക്യങ്ങൾ (Statutory Formulas):</span>
            </span>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-purple-300 font-bold block">1. പരമാവധി ഉയര പരിധി (Rule 24):</span>
                <span>Max Permissible Height &le; (2 × Street Width) + (2 × Front Setback)</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-purple-300 font-bold block">2. 10m ന് മുകളിലെ സെറ്റ്ബാക്ക് വർദ്ധനവ് (Rule 26(2)):</span>
                <span>10 മീറ്ററിന് മുകളിലുള്ള ഓരോ 3.0 മീറ്ററിനും (അല്ലെങ്കിൽ അതിന്റെ അംശത്തിനും) 0.5 മീറ്റർ വീതം ഓരോ മുറ്റത്തും അധികമായി നൽകണം (പരമാവധി 16m വരെ).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6: Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                ഉയര & സെറ്റ്ബാക്ക് പരിശോധനാ ഫലം
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  result.isHeightPermissible
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : "bg-rose-950 text-rose-300 border-rose-800"
                }`}
              >
                {result.isHeightPermissible ? "HEIGHT PASSED" : "HEIGHT EXCEEDED"}
              </span>
            </div>

            {/* Height Rule 24 Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">പരമാവധി അനുവദനീയ ഉയരം (Max Permissible):</span>
                <span className="text-2xl font-black text-purple-400">
                  {result.maxPermissibleHeightM} m
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>നിർദ്ദിഷ്ട ഉയരം:</span>
                  <span className="text-white font-bold">{height} m</span>
                </div>
                <div className="flex justify-between">
                  <span>കണക്കുകൂട്ടൽ:</span>
                  <span className="text-slate-300">
                    2×({road}m) + 2×({front}m) = {(2 * road).toFixed(1)} + {(2 * front).toFixed(1)} = {result.maxPermissibleHeightM}m
                  </span>
                </div>
              </div>
            </div>

            {/* Height > 10m Setback Additions Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">10 മീറ്ററിന് മുകളിലുള്ള അധിക സെറ്റ്ബാക്ക്:</span>
                <span className="text-xl font-black text-amber-400">
                  +{result.additionalSetbackPerSideM} m
                </span>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>അടിസ്ഥാന സെറ്റ്ബാക്ക്:</span>
                  <span>{baseSetback} m</span>
                </div>
                <div className="flex justify-between">
                  <span>ഉയരം കാരണം അധികം കൂട്ടേണ്ടത്:</span>
                  <span className="text-amber-400 font-bold">+{result.additionalSetbackPerSideM} m</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 text-white font-bold">
                  <span>ആകെ നിർബന്ധിത സെറ്റ്ബാക്ക് (Total Required):</span>
                  <span className="text-emerald-400">
                    {Math.min(16.0, Number((baseSetback + result.additionalSetbackPerSideM).toFixed(2)))} m
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-400">
                {result.setbackRuleExplanation}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
