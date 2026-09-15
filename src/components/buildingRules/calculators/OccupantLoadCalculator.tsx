import React, { useState } from "react";
import { Users, LogOut, Droplets, Info } from "lucide-react";
import { OccupancyCode, TABLE_6_STANDARDS } from "../masterCalcTypes";
import { calculateOccupantLoad } from "../masterCalcEngine";

interface Props {
  occupancy: OccupancyCode;
  onOccupancyChange?: (occ: OccupancyCode) => void;
  totalFloorAreaSqM: number;
  onTotalFloorAreaChange?: (area: number) => void;
}

export const OccupantLoadCalculator: React.FC<Props> = ({
  occupancy,
  onOccupancyChange,
  totalFloorAreaSqM,
  onTotalFloorAreaChange
}) => {
  const [localOcc, setLocalOcc] = useState<OccupancyCode>(occupancy || "F");
  const [localArea, setLocalArea] = useState<number>(totalFloorAreaSqM || 500);

  const occ = onOccupancyChange ? occupancy : localOcc;
  const area = onTotalFloorAreaChange ? totalFloorAreaSqM : localArea;

  const result = calculateOccupantLoad(occ, area);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
            KPBR Tables 13 & 17
          </span>
          <span className="text-xs font-mono text-slate-400">Occupant Load Factor Scrutiny</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          കെട്ടിട നിവാസികളുടെ എണ്ണം കണക്കാക്കൽ (OCCUPANT LOAD CALCULATOR)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          കെട്ടിടത്തിൽ ഉൾക്കൊള്ളുന്ന പരമാവധി ആളുകളുടെ എണ്ണം കണക്കാക്കി എക്സിറ്റ് വീതികളും (Exit Width - Table 17),
          ശുചിത്വ ഉപകരണങ്ങളുടെ ആവശ്യകതയും (Sanitation - Table 13) നിർണ്ണയിക്കുക.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span>കെട്ടിട വിവരങ്ങൾ നൽകുക (Input Parameters)</span>
            </h3>

            <div className="space-y-4 font-sans text-xs">
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-blue-500 outline-none"
                >
                  {Object.values(TABLE_6_STANDARDS).map((s) => (
                    <option key={s.code} value={s.code}>
                      Group {s.code} - {s.nameMl}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  പട്ടിക 13 & 17 അനുസരിച്ച് ആളുകളുടെ എണ്ണം നിർണ്ണയിക്കുന്നു
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  ആകെ തറ വിസ്തൃതി (Total Floor Area / Built-up Area)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={area}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (onTotalFloorAreaChange) onTotalFloorAreaChange(v);
                      else setLocalArea(v);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-blue-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>പട്ടിക 13 & 17 ചട്ട മാനദണ്ഡങ്ങൾ (STATUTORY STANDARDS)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                    <th className="pb-2">Occupancy Group</th>
                    <th className="pb-2">Exit Area (Table 17)</th>
                    <th className="pb-2">Sanitation Area (Table 13)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr className={occ === "A1" ? "bg-blue-500/10 text-blue-300 font-bold" : ""}>
                    <td className="py-2">Group A1 (Residential)</td>
                    <td className="py-2">12.5 m² / person</td>
                    <td className="py-2 text-slate-500">— (Dwelling Unit)</td>
                  </tr>
                  <tr className={["A2", "B", "C", "E", "F"].includes(occ) ? "bg-blue-500/10 text-blue-300 font-bold" : ""}>
                    <td className="py-2">Group A2, B, C, E, F</td>
                    <td className="py-2">4.0 m² / person</td>
                    <td className="py-2">5.9 m² / person</td>
                  </tr>
                  <tr className={["D", "D1", "J"].includes(occ) ? "bg-blue-500/10 text-blue-300 font-bold" : ""}>
                    <td className="py-2">Group D & J (Assembly / Cinema)</td>
                    <td className="py-2">1.5 m² / person</td>
                    <td className="py-2">1.8 m² / person</td>
                  </tr>
                  <tr className={["G1", "G2", "G3", "H", "I"].includes(occ) ? "bg-blue-500/10 text-blue-300 font-bold" : ""}>
                    <td className="py-2">Group G, H, I (Industrial/Storage)</td>
                    <td className="py-2">10.0 m² / person</td>
                    <td className="py-2">30.0 m² / person</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Calculated Outputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
              കണക്കുകൂട്ടിയ ആളുകളുടെ എണ്ണം (CALCULATED OCCUPANT LOAD)
            </span>

            {/* Exit Width Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      എക്സിറ്റ് വീതി നിശ്ചയിക്കുന്നതിനുള്ള എണ്ണം
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Table 17 (Exit & Evacuation Occupant Load)
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-black font-mono text-amber-400">
                  {result.exitOccupantLoad} <span className="text-xs text-slate-400">ആളുകൾ</span>
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>മാനദണ്ഡം:</span>
                  <span className="text-slate-200">{result.exitOccupantRate} m² / ആൾ</span>
                </div>
                <div className="flex justify-between">
                  <span>ആവശ്യമായ കുറഞ്ഞ എക്സിറ്റ് വീതി (Total Exit Width):</span>
                  <span className="text-amber-300 font-bold">{result.minExitWidthMetres} m</span>
                </div>
              </div>
            </div>

            {/* Sanitation Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-white block">
                      ശുചിത്വ കണക്കുകൂട്ടലിനുള്ള എണ്ണം
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Table 13 (Sanitation Fixtures Occupant Load)
                    </span>
                  </div>
                </div>
                <span className="text-2xl font-black font-mono text-cyan-400">
                  {result.sanitationOccupantLoad || "N/A"}{" "}
                  {result.sanitationOccupantLoad > 0 && <span className="text-xs text-slate-400">ആളുകൾ</span>}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>മാനദണ്ഡം:</span>
                  <span className="text-slate-200">
                    {result.sanitationOccupantRate > 0 ? `${result.sanitationOccupantRate} m² / ആൾ` : "താമസ യൂണിറ്റ് അടിസ്ഥാനം"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ആൺ / പെൺ അനുപാതം (50:50 കണക്ക്):</span>
                  <span className="text-cyan-300 font-bold">
                    {result.sanitationOccupantLoad > 0
                      ? `${Math.ceil(result.sanitationOccupantLoad * 0.5)} ആൺ / ${Math.floor(result.sanitationOccupantLoad * 0.5)} പെൺ`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="text-slate-300 font-bold block mb-0.5">വിവരണം / Statutory Note:</span>
              {result.notes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
