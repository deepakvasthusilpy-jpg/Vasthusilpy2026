import React, { useState } from "react";
import { Droplets, Container, Info } from "lucide-react";
import { OccupancyCode, TABLE_6_STANDARDS } from "../masterCalcTypes";
import { calculateRwhStorage } from "../masterCalcEngine";

interface Props {
  occupancy: OccupancyCode;
  onOccupancyChange?: (occ: OccupancyCode) => void;
  totalFloorAreaSqM: number;
  onTotalFloorAreaChange?: (area: number) => void;
  groundCoveredAreaSqM?: number;
  onGroundCoveredAreaChange?: (area: number) => void;
}

export const RwhStorageCalculator: React.FC<Props> = ({
  occupancy,
  onOccupancyChange,
  totalFloorAreaSqM,
  onTotalFloorAreaChange,
  groundCoveredAreaSqM,
  onGroundCoveredAreaChange
}) => {
  const [localOcc, setLocalOcc] = useState<OccupancyCode>(occupancy || "A1");
  const [localBua, setLocalBua] = useState<number>(totalFloorAreaSqM || 450);
  const [localPlinth, setLocalPlinth] = useState<number>(groundCoveredAreaSqM || 180);

  const occ = onOccupancyChange ? occupancy : localOcc;
  const bua = onTotalFloorAreaChange ? totalFloorAreaSqM : localBua;
  const plinth = onGroundCoveredAreaChange ? (groundCoveredAreaSqM || 180) : localPlinth;

  const result = calculateRwhStorage(bua, plinth, occ);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
            KPBR Rule 76
          </span>
          <span className="text-xs font-mono text-slate-400">Rainwater Harvesting Storage Standards</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          മഴവെള്ള സംഭരണി ശേഷി കാൽക്കുലേറ്റർ (RWH STORAGE TANK CALCULATOR)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          കെട്ടിടത്തിന്റെ തറവിസ്തൃതി 300 ചതുരശ്ര മീറ്ററിൽ കൂടുതൽ വരുന്ന പുതിയ നിർമ്മിതികളിൽ (ഗ്രൂപ്പ് H ഒഴികെ)
          ഭൂമിയിലെ കവേർഡ് ഏരിയ അടിസ്ഥാനമാക്കി ആവശ്യമായ ആർ.സി.സി മഴവെള്ള സംഭരണശേഷി കണക്കാക്കുക.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6: Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>വിസ്തീർണ്ണ വിവരങ്ങൾ (Parameters)</span>
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  കെട്ടിട ഉപയോഗ ഗണം (Occupancy Group)
                </label>
                <select
                  value={occ}
                  onChange={(e) => {
                    const v = e.target.value as OccupancyCode;
                    if (onOccupancyChange) onOccupancyChange(v);
                    else setLocalOcc(v);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-cyan-500 outline-none"
                >
                  {Object.values(TABLE_6_STANDARDS).map((s) => (
                    <option key={s.code} value={s.code}>
                      Group {s.code} - {s.nameMl}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  A1, A2, F, J: 25 L/m² | B, C, D, E, G: 50 L/m²
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  ആകെ നിർമ്മിതി വിസ്തീർണ്ണം (Total Built-Up Area)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={bua}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onTotalFloorAreaChange) onTotalFloorAreaChange(v);
                      else setLocalBua(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-cyan-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  300 m² ന് മുകളിൽ സംഭരണി നിർബന്ധം
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  മേൽക്കൂര / കവേർഡ് ഏരിയ (Covered Ground Footprint)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={plinth}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onGroundCoveredAreaChange) onGroundCoveredAreaChange(v);
                      else setLocalPlinth(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-cyan-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  ഭൂമിയിലെ അടിത്തറ വിസ്തൃതി
                </span>
              </div>
            </div>
          </div>

          {/* Statutory Rates Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 font-mono text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px]">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>ചട്ടം 76 ലെ നിരക്കുകൾ (Rule 76 Standards):</span>
            </span>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Groups A1, A2, F, J:</span>
                <span className="text-cyan-300 font-bold">25 Litres / m² of Covered Area</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Groups B, C, D, E, G1, G2:</span>
                <span className="text-cyan-300 font-bold">50 Litres / m² of Covered Area</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Group H (Storage & Warehouses):</span>
                <span className="text-slate-500 font-bold">ഒഴിവ് (Exempted)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6: Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                മഴവെള്ള സംഭരണി നിർണ്ണയ ഫലം
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  result.isRwhMandatory
                    ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {result.isRwhMandatory ? "MANDATORY" : "NOT MANDATORY"}
              </span>
            </div>

            {/* Storage Volume Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Container className="w-4 h-4 text-cyan-400" />
                  <span>കുറഞ്ഞ സംഭരണ ശേഷി (Min Storage):</span>
                </span>
                <span className="text-2xl font-black text-cyan-400">
                  {result.minimumCapacityLitres.toLocaleString("en-IN")} ലിറ്റർ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ക്യുബിക് മീറ്റർ വ്യാപ്തി:</span>
                  <span className="text-base font-black text-white">{result.minimumCapacityM3} m³</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ബാധകമായ ചട്ട നിരക്ക്:</span>
                  <span className="text-base font-black text-white">{result.rateLitresPerSqM} L/m²</span>
                </div>
              </div>

              {/* Recommended Tank Dimensions */}
              {result.minimumCapacityM3 > 0 && (
                <div className="bg-slate-900 p-3 rounded-xl border border-cyan-500/30 space-y-1 text-xs">
                  <span className="font-bold text-cyan-300 block text-[11px]">
                    നിർദ്ദിഷ്ട RCC ടാങ്ക് അളവുകൾ (Suggested Tank Dimensions):
                  </span>
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span>നീളം (Length): <b>{result.suggestedTankLengthM} m</b></span>
                    <span>വീതി (Width): <b>{result.suggestedTankWidthM} m</b></span>
                    <span>ആഴം (Depth): <b>{result.suggestedTankDepthM} m</b></span>
                  </div>
                </div>
              )}

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                <span className="text-slate-400 block mb-0.5">ബാധകമായ ചട്ടക്കുറിപ്പ്:</span>
                {result.explanation}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
