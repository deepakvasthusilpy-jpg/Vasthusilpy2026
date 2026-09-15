import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertTriangle, Layers, Calculator, Info } from "lucide-react";
import {
  OccupancyCode,
  TABLE_6_STANDARDS,
  OccupancyFloorAreaItem
} from "../masterCalcTypes";
import { calculateFsiAndCoverage } from "../masterCalcEngine";

interface Props {
  plotAreaSqM: number;
  onPlotAreaChange?: (val: number) => void;
  groundFloorPlinthSqM: number;
  onGroundFloorPlinthChange?: (val: number) => void;
  totalFloorAreaSqM: number;
  onTotalFloorAreaChange?: (val: number) => void;
  occupancy: OccupancyCode;
  onOccupancyChange?: (val: OccupancyCode) => void;
  category: "Category-I" | "Category-II";
  onCategoryChange?: (val: "Category-I" | "Category-II") => void;
}

export const FsiCoverageCalculator: React.FC<Props> = ({
  plotAreaSqM,
  onPlotAreaChange,
  groundFloorPlinthSqM,
  onGroundFloorPlinthChange,
  totalFloorAreaSqM,
  onTotalFloorAreaChange,
  occupancy,
  onOccupancyChange,
  category,
  onCategoryChange
}) => {
  const [localPlotArea, setLocalPlotArea] = useState<number>(plotAreaSqM || 250);
  const [localPlinth, setLocalPlinth] = useState<number>(groundFloorPlinthSqM || 110);
  const [localTotalArea, setLocalTotalArea] = useState<number>(totalFloorAreaSqM || 220);
  const [localOccupancy, setLocalOccupancy] = useState<OccupancyCode>(occupancy || "A1");
  const [localCategory, setLocalCategory] = useState<"Category-I" | "Category-II">(category || "Category-II");

  // Multi-occupancy state
  const [isMultiOccupancy, setIsMultiOccupancy] = useState<boolean>(false);
  const [blocks, setBlocks] = useState<OccupancyFloorAreaItem[]>([
    { id: "1", occupancy: "F", label: "Ground Floor Commercial", floorAreaSqM: 100 },
    { id: "2", occupancy: "A1", label: "First Floor Residential", floorAreaSqM: 120 }
  ]);

  const pArea = onPlotAreaChange ? plotAreaSqM : localPlotArea;
  const plinth = onGroundFloorPlinthChange ? groundFloorPlinthSqM : localPlinth;
  const tArea = onTotalFloorAreaChange ? totalFloorAreaSqM : localTotalArea;
  const occ = onOccupancyChange ? occupancy : localOccupancy;
  const cat = onCategoryChange ? category : localCategory;

  const result = calculateFsiAndCoverage(
    pArea,
    plinth,
    tArea,
    occ,
    cat,
    isMultiOccupancy,
    blocks
  );

  const handleAddBlock = () => {
    const newId = Date.now().toString();
    setBlocks([...blocks, { id: newId, occupancy: "A1", label: `Floor Block ${blocks.length + 1}`, floorAreaSqM: 80 }]);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const handleBlockChange = (id: string, field: keyof OccupancyFloorAreaItem, val: any) => {
    setBlocks(
      blocks.map((b) => {
        if (b.id === id) {
          return { ...b, [field]: val };
        }
        return b;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                KPBR Rule 27 & Table 6
              </span>
              <span className="text-xs font-mono text-slate-400">Statutory FSI & Coverage Standards</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              പ്ലോട്ട് കവറേജ് & ഫ്ലോർ സ്പേസ് ഇൻഡക്സ് (FSI) കാൽക്കുലേറ്റർ
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              ഏക അല്ലെങ്കിൽ ഒന്നിലധികം ഉപയോഗങ്ങളുള്ള കെട്ടിടങ്ങളുടെ (Multiple Occupancy) വെയ്റ്റഡ് FSI സൂത്രവാക്യവും
              തറ വിസ്തൃതി കവറേജും KPBR ചട്ടം 27 & പട്ടിക 6 പ്രകാരം കണക്കാക്കുക.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-right">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">തദ്ദേശ ഭരണ വിഭാഗം</span>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={() => {
                  if (onCategoryChange) onCategoryChange("Category-I");
                  else setLocalCategory("Category-I");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                  cat === "Category-I"
                    ? "bg-emerald-500 text-slate-950 font-black shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Cat-I (കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി)
              </button>
              <button
                onClick={() => {
                  if (onCategoryChange) onCategoryChange("Category-II");
                  else setLocalCategory("Category-II");
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                  cat === "Category-II"
                    ? "bg-emerald-500 text-slate-950 font-black shadow"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                Cat-II (ഗ്രാമപഞ്ചായത്ത്)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Inputs & Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Interactive Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>പ്ലോട്ട് & കെട്ടിട വിസ്തീർണ്ണ വിവരങ്ങൾ (Basic Parameters)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  പ്ലോട്ട് വിസ്തീർണ്ണം (Plot Area)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={pArea}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onPlotAreaChange) onPlotAreaChange(v);
                      else setLocalPlotArea(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  {(pArea / 40.4686).toFixed(2)} സെന്റ് (Cents)
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  പ്ലിന്ത് വിസ്തൃതി (Ground Footprint)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={plinth}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onGroundFloorPlinthChange) onGroundFloorPlinthChange(v);
                      else setLocalPlinth(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  ഭൂമിയിലെ അടിത്തറ വിസ്തൃതി
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  ആകെ തറ വിസ്തൃതി (Total Floor Area - All Floors)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={tArea}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onTotalFloorAreaChange) onTotalFloorAreaChange(v);
                      else setLocalTotalArea(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  എല്ലാ നിലകളുടെയും ആകെ വിസ്തൃതി
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  കെട്ടിട ഉപയോഗ ഗണം (Primary Occupancy)
                </label>
                <select
                  value={occ}
                  onChange={(e) => {
                    const v = e.target.value as OccupancyCode;
                    if (onOccupancyChange) onOccupancyChange(v);
                    else setLocalOccupancy(v);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-emerald-500 outline-none"
                >
                  {Object.values(TABLE_6_STANDARDS).map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.nameMl}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  Table 6 അനുസരിച്ചുള്ള ഗ്രൂപ്പ്
                </span>
              </div>
            </div>

            {/* Toggle Multiple Occupancy Mode */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMultiOccupancy}
                  onChange={(e) => setIsMultiOccupancy(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-950 border-slate-800"
                />
                <span className="text-xs font-mono font-bold text-slate-300">
                  ബഹുവിധ ഉപയോഗം (Multiple Occupancy Building - Weighted FSI Formula)
                </span>
              </label>
              <span className="text-[10px] font-mono text-cyan-400">Rule 27 Formula</span>
            </div>

            {/* Multiple Occupancy Table */}
            {isMultiOccupancy && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
                    <Layers className="w-3.5 h-3.5" />
                    <span>ഉപയോഗ വിഭജന പട്ടിക (Multiple Occupancy Breakdown)</span>
                  </div>
                  <button
                    onClick={handleAddBlock}
                    className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-bold rounded-lg border border-cyan-500/30 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>പുതിയ നില / ഭാഗം ചേർക്കുക</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {blocks.map((b, idx) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs font-mono"
                    >
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={b.label}
                          onChange={(e) => handleBlockChange(b.id, "label", e.target.value)}
                          placeholder="വിവരണം (Eg. Ground Floor)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs outline-none"
                        />
                      </div>
                      <div className="col-span-4">
                        <select
                          value={b.occupancy}
                          onChange={(e) => handleBlockChange(b.id, "occupancy", e.target.value as OccupancyCode)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs outline-none"
                        >
                          {Object.values(TABLE_6_STANDARDS).map((s) => (
                            <option key={s.code} value={s.code}>
                              Group {s.code} (FSI: {cat === "Category-I" ? s.maxFsiCat1 : s.maxFsiCat2})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={b.floorAreaSqM}
                            onChange={(e) =>
                              handleBlockChange(b.id, "floorAreaSqM", parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-bold text-xs outline-none"
                          />
                          <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">m²</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        {blocks.length > 1 && (
                          <button
                            onClick={() => handleRemoveBlock(b.id)}
                            className="text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono flex justify-between items-center text-slate-400">
                  <span>ആകെ നിലകളുടെ വിസ്തീർണ്ണം (A): {blocks.reduce((s, b) => s + (Number(b.floorAreaSqM) || 0), 0)} m²</span>
                  <span className="text-cyan-300 font-bold">
                    അനുവദനീയ വെയ്റ്റഡ് FSI: {result.weightedFsiPermissible ?? result.maxPermissibleFsi}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statutory Reference Table 6 */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>പട്ടിക 6 ലെ പ്രധാന മാനദണ്ഡങ്ങൾ (TABLE 6 KEY STANDARDS)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                    <th className="pb-2">Occupancy Group</th>
                    <th className="pb-2">Max Coverage (Cat-II / Cat-I)</th>
                    <th className="pb-2">Max FSI (Basic / Max)</th>
                    <th className="pb-2">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className={occ === "A1" ? "bg-emerald-500/10 text-emerald-300 font-bold" : ""}>
                    <td className="py-2">Group A1 (Residential)</td>
                    <td className="py-2">60% (Cat-II) / 65% (Cat-I)</td>
                    <td className="py-2">2.5</td>
                    <td className="py-2 text-[10px] text-slate-400">താമസ വീടുകൾ / ഫ്ലാറ്റുകൾ</td>
                  </tr>
                  <tr className={occ === "A2" ? "bg-emerald-500/10 text-emerald-300 font-bold" : ""}>
                    <td className="py-2">Group A2 (Lodging / Hostels)</td>
                    <td className="py-2">55% (Cat-II) / 65% (Cat-I)</td>
                    <td className="py-2">1.5 (Up to 2.25 with fee)</td>
                    <td className="py-2 text-[10px] text-slate-400">ലോഡ്ജ്, ഹോസ്റ്റലുകൾ</td>
                  </tr>
                  <tr className={occ === "F" ? "bg-emerald-500/10 text-emerald-300 font-bold" : ""}>
                    <td className="py-2">Group F (Commercial)</td>
                    <td className="py-2">60% (Cat-II) / 65% (Cat-I)</td>
                    <td className="py-2">2.75 (Up to 3.5 with fee)</td>
                    <td className="py-2 text-[10px] text-slate-400">കടകൾ, ഷോപ്പിംഗ് സെന്റർ</td>
                  </tr>
                  <tr className={occ === "G1" ? "bg-emerald-500/10 text-emerald-300 font-bold" : ""}>
                    <td className="py-2">Group G1 (Industrial-I)</td>
                    <td className="py-2">55% (Cat-II) / 65% (Cat-I)</td>
                    <td className="py-2">2.75</td>
                    <td className="py-2 text-[10px] text-slate-400">വ്യവസായ ശാലകൾ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Result Gauges & Verdict */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Verdict Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              FSI & കവറേജ് ഫലം (SCRUTINY VERDICT)
            </span>

            {/* Coverage Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">പ്ലോട്ട് കവറേജ് (Coverage %):</span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    result.isCoveragePassed
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {result.isCoveragePassed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" /> EXCEEDED
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-white">{result.achievedCoveragePct}%</span>
                <span className="text-xs text-slate-500">/ അനുവദനീയ പരിധി {result.maxPermissibleCoveragePct}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${result.isCoveragePassed ? "bg-emerald-400" : "bg-rose-500"}`}
                  style={{
                    width: `${Math.min(100, (result.achievedCoveragePct / result.maxPermissibleCoveragePct) * 100)}%`
                  }}
                />
              </div>

              <span className="text-[10px] font-mono text-slate-500 block">
                സൂത്രവാക്യം: (പ്ലിന്ത് ഏരിയ {plinth}m² / പ്ലോട്ട് ഏരിയ {pArea}m²) × 100
              </span>
            </div>

            {/* FSI Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  {result.isWeightedFsiUsed ? "വെയ്റ്റഡ് FSI (Weighted FSI):" : "ഫ്ലോർ സ്പേസ് ഇൻഡക്സ് (FSI):"}
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    result.isFsiPassed
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}
                >
                  {result.isFsiPassed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> PASSED
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" /> EXCEEDED
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-white">{result.achievedFsi}</span>
                <span className="text-xs text-slate-500">/ Max അനുവദനീയം {result.maxPermissibleFsi}</span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${result.isFsiPassed ? "bg-cyan-400" : "bg-rose-500"}`}
                  style={{
                    width: `${Math.min(100, (result.achievedFsi / result.maxPermissibleFsi) * 100)}%`
                  }}
                />
              </div>

              {result.maxFsiWithFee && (
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[10px] font-mono text-amber-300">
                  കൂടുതൽ ഫീസ് ഒടുക്കി പരമാവധി {result.maxFsiWithFee} FSI വരെ ലഭ്യമാക്കാം.
                </div>
              )}

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
                {result.detailedFormulaText}
              </div>
            </div>

            {/* Formula Reference Box */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-slate-400 text-xs font-mono">
              <span className="font-bold text-slate-300 block text-[11px] uppercase">
                നിയമപരമായ സമവാക്യങ്ങൾ (Statutory Formulas)
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                • <b>FSI = </b> ആകെ തറവിസ്തൃതി / പ്ലോട്ട് വിസ്തീർണ്ണം
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                • <b>Weighted FSI = </b> [(f₁ × A₁) + (f₂ × A₂) + ...] / A
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                • <b>Coverage % = </b> (പ്ലിന്ത് ഏരിയ / പ്ലോട്ട് ഏരിയ) × 100
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
