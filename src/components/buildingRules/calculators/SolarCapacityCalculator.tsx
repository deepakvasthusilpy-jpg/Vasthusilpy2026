import React, { useState } from "react";
import { Sun, Zap, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { OccupancyCode } from "../masterCalcTypes";
import { calculateSolarEnergyCapacity } from "../masterCalcEngine";

interface Props {
  occupancy: OccupancyCode;
  onOccupancyChange?: (occ: OccupancyCode) => void;
  totalFloorAreaSqM: number;
  onTotalFloorAreaChange?: (area: number) => void;
}

export const SolarCapacityCalculator: React.FC<Props> = ({
  occupancy,
  onOccupancyChange,
  totalFloorAreaSqM,
  onTotalFloorAreaChange
}) => {
  const [localOcc, setLocalOcc] = useState<OccupancyCode>(occupancy || "A1");
  const [localArea, setLocalArea] = useState<number>(totalFloorAreaSqM || 650);
  const [isSingleFamily, setIsSingleFamily] = useState<boolean>(false);

  const occ = onOccupancyChange ? occupancy : localOcc;
  const area = onTotalFloorAreaChange ? totalFloorAreaSqM : localArea;

  const result = calculateSolarEnergyCapacity(area, occ, isSingleFamily);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
            KPBR Rule 77 & Table 19
          </span>
          <span className="text-xs font-mono text-slate-400">Rooftop Solar Energy Capacity Norms</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          റൂഫ്‌ടോപ്പ് സൗരോർജ്ജ പ്ലാന്റ് നിർണ്ണയം (SOLAR CAPACITY CALCULATOR)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          കെട്ടിടത്തിന്റെ തറവിസ്തൃതി 500 ചതുരശ്ര മീറ്ററിൽ കൂടുതൽ വരുന്ന പുതിയ കെട്ടിടങ്ങളിൽ (Groups A1, A2, C, D)
          നിർബന്ധമായ സോളാർ പവർ പ്ലാന്റ് ശേഷി കണക്കാക്കുക.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6: Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>സോളാർ ആവശ്യകത നിർണ്ണയിക്കുക (Input Details)</span>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-amber-500 outline-none"
                >
                  <option value="A1">Group A1 - Residential (Single/Flats)</option>
                  <option value="A2">Group A2 - Lodging / Hostels / Hotels</option>
                  <option value="C">Group C - Hospitals & Clinics</option>
                  <option value="D">Group D - Assembly & Auditoriums</option>
                  <option value="E">Group E - Offices (Non-mandatory)</option>
                  <option value="F">Group F - Commercial (Non-mandatory)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  ആകെ നിർമ്മിതി വിസ്തീർണ്ണം (Total Built-Up Area - BUA)
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-amber-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                  500 m² ന് മുകളിൽ നിർബന്ധമാണ്
                </span>
              </div>

              {occ === "A1" && (
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isSingleFamily}
                    onChange={(e) => setIsSingleFamily(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800"
                  />
                  <span className="font-mono text-xs">
                    ഏക കുടുംബ വീട് &gt; 400 m² (നിരക്ക്: 0.0023 kW / m²). അൺചെക്ക് ചെയ്താൽ ഫ്ലാറ്റ്/അപ്പാർട്ട്മെന്റ് (0.0017 kW / m²)
                  </span>
                </label>
              )}
            </div>
          </div>

          {/* Table 19 Standards */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 font-mono text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px]">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>പട്ടിക 19 ചട്ട നിരക്കുകൾ (Table 19 Statutory Rates):</span>
            </span>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Group A1 (Single/Dual &gt; 400 m²):</span>
                <span className="text-white font-bold">0.0023 kW / m²</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Group A1 (Flats / Apartments):</span>
                <span className="text-white font-bold">0.0017 kW / m²</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Group A2 (Lodges / Hostels):</span>
                <span className="text-white font-bold">0.0027 kW / m²</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Group C (Hospitals):</span>
                <span className="text-white font-bold">0.0033 kW / m²</span>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span>Group D (Assembly / Auditoriums):</span>
                <span className="text-white font-bold">0.0050 kW / m²</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6: Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                സോളാർ നിർണ്ണയ ഫലം (SOLAR CAPACITY VERDICT)
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  result.isSolarMandatory
                    ? "bg-amber-950 text-amber-300 border-amber-800"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                {result.isSolarMandatory ? "MANDATORY" : "OPTIONAL / EXEMPT"}
              </span>
            </div>

            {/* Capacity Dial */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>കുറഞ്ഞ സോളാർ ശേഷി:</span>
                </span>
                <span className="text-2xl font-black text-amber-400">
                  {result.minimumCapacityKw} kWp
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ആവശ്യമായ പാനൽ വിസ്തീർണ്ണം:</span>
                  <span className="text-base font-black text-white">{result.approximatePanelAreaSqM} m²</span>
                  <span className="text-[9px] text-slate-500 block">(~8 m² per kWp)</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">പ്രതിദിന ഉത്പാദനം (Est.):</span>
                  <span className="text-base font-black text-emerald-400">{result.estimatedDailyUnitsKwh} യൂണിറ്റ്</span>
                  <span className="text-[9px] text-slate-500 block">(~4 kWh/day in Kerala)</span>
                </div>
              </div>

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
