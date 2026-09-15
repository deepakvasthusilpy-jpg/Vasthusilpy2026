import React, { useState } from "react";
import {
  Droplets,
  Accessibility,
  Info,
  CheckCircle2,
  Sliders,
  Sparkles,
  Bath
} from "lucide-react";
import { OccupancyCode, TABLE_6_STANDARDS } from "../masterCalcTypes";
import { calculateSanitationFacilities } from "../masterCalcEngine";

interface Props {
  occupancy: OccupancyCode;
  onOccupancyChange?: (occ: OccupancyCode) => void;
  totalFloorAreaSqM: number;
  onTotalFloorAreaChange?: (area: number) => void;
}

export const SanitationCalculator: React.FC<Props> = ({
  occupancy,
  onOccupancyChange,
  totalFloorAreaSqM,
  onTotalFloorAreaChange
}) => {
  const [localOcc, setLocalOcc] = useState<OccupancyCode>(occupancy || "F");
  const [localArea, setLocalArea] = useState<number>(totalFloorAreaSqM || 1500);

  // Parking deduction
  const [coveredParkingDeduction, setCoveredParkingDeduction] = useState<number>(200);

  // Specific subtypes
  const [isSingleFamily, setIsSingleFamily] = useState<boolean>(false);
  const [hospitalBeds, setHospitalBeds] = useState<number>(50);
  const [hospitalType, setHospitalType] = useState<"IP_WARD" | "OPD" | "ADMIN">("IP_WARD");
  const [assemblySubtype, setAssemblySubtype] = useState<
    "BUS_TERMINAL" | "AIRPORT_RAILWAY" | "RECREATIONAL_TURF" | "AUDITORIUM"
  >("BUS_TERMINAL");
  const [isItPark, setIsItPark] = useState<boolean>(false);
  const [isCommercialSmallShop, setIsCommercialSmallShop] = useState<boolean>(false);
  const [hazardousWorkers, setHazardousWorkers] = useState<number>(4);

  const occ = onOccupancyChange ? occupancy : localOcc;
  const area = onTotalFloorAreaChange ? totalFloorAreaSqM : localArea;

  const result = calculateSanitationFacilities(
    area,
    coveredParkingDeduction,
    occ,
    isSingleFamily,
    hospitalBeds,
    hospitalType,
    assemblySubtype,
    isItPark,
    isCommercialSmallShop,
    hazardousWorkers
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
            KPBR Rule 34 & Tables 13, 14, 15, 15A
          </span>
          <span className="text-xs font-mono text-slate-400">Sanitary Fitment Scales & Reductions</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          ശുചിത്വ ഉപകരണങ്ങൾ & പട്ടിക 15A സ്കെയിൽ റിഡക്ഷൻ കാൽക്കുലേറ്റർ
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          കെട്ടിടത്തിന്റെ ഉപയോഗഗണവും വിസ്തീർണ്ണവും അടിസ്ഥാനമാക്കി വാട്ടർ ക്ലോസറ്റുകൾ (WC), യൂറിനലുകൾ,
          വാഷ് ബേസിനുകൾ, കുളുമുറികൾ, പാർക്കിംഗ് ഏരിയ കിഴിവ് (Deduction), വലിയ കെട്ടിടങ്ങൾക്കുള്ള
          പട്ടിക 15A സ്കെയിൽ കുറവ് എന്നിവ കൃത്യമായി കണക്കാക്കുക.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Form Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>ശുചിത്വ വിവരങ്ങൾ നൽകുക (Sanitation Parameters)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
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
              </div>

              <div>
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  ആകെ തറ വിസ്തൃതി (Total Floor Area)
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-cyan-500 outline-none"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
                </div>
              </div>
            </div>

            {/* Covered Parking Area Deduction */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300">
                  ഉൾപ്പെടുത്തിയ പാർക്കിംഗ് വിസ്തൃതി (Covered Parking Inside Building):
                </label>
                <span className="text-[10px] font-mono text-emerald-400">ചട്ടപ്രകാരം കുറയ്ക്കാം</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={coveredParkingDeduction}
                  onChange={(e) => setCoveredParkingDeduction(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold focus:border-emerald-500 outline-none"
                />
                <span className="absolute right-3 top-2 text-slate-500 font-mono text-xs">m²</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                Rule 34 Proviso: കെട്ടിടത്തിനകത്തുള്ള കവേർഡ് പാർക്കിംഗ് ഏരിയ തറവിസ്തൃതിയിൽ നിന്നും കുറച്ച് ബാക്കി വരുന്ന
                വിസ്തീർണ്ണത്തിനാണ് ({result.netSanitationAreaSqM} m²) ശുചിത്വ കണക്കുകൂട്ടൽ നടത്തുന്നത്.
              </span>
            </div>

            {/* Specific Occupancy Configurations */}
            <div className="pt-2 border-t border-slate-800 space-y-3 text-xs font-mono">
              {occ === "C" && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-cyan-300 block">ആശുപത്രി ഉപവിഭാഗം (Hospital Section):</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setHospitalType("IP_WARD")}
                      className={`p-2 rounded-xl text-center transition ${
                        hospitalType === "IP_WARD" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      കിടത്തിചികിത്സ (IP Ward)
                    </button>
                    <button
                      onClick={() => setHospitalType("OPD")}
                      className={`p-2 rounded-xl text-center transition ${
                        hospitalType === "OPD" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      ഒ.പി വിഭാഗം (OPD)
                    </button>
                    <button
                      onClick={() => setHospitalType("ADMIN")}
                      className={`p-2 rounded-xl text-center transition ${
                        hospitalType === "ADMIN" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      അഡ്മിൻ (Admin)
                    </button>
                  </div>

                  {hospitalType === "IP_WARD" && (
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">കിടക്കകളുടെ എണ്ണം (Bed Count):</label>
                      <input
                        type="number"
                        min="1"
                        value={hospitalBeds}
                        onChange={(e) => setHospitalBeds(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        മാനദണ്ഡം: 8 ബെഡിന് 1 WC, 30 ബെഡിന് 1 WB, 8 ബെഡിന് 1 കുളിമുറി
                      </span>
                    </div>
                  )}
                </div>
              )}

              {["D", "D1"].includes(occ) && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-cyan-300 block">അസംബ്ലി തരം (Assembly Type):</span>
                  <select
                    value={assemblySubtype}
                    onChange={(e) => setAssemblySubtype(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="BUS_TERMINAL">ബസ് ടെർമിനൽ / ബസ് സ്റ്റാൻഡ് (Bus Terminal)</option>
                    <option value="AIRPORT_RAILWAY">വിമാനത്താവളം / റെയിൽവേ സ്റ്റേഷൻ (Airport / Railway)</option>
                    <option value="RECREATIONAL_TURF">ടർഫ് / സ്പോർട്സ് കോർട്ട് (Recreational Turf / Court)</option>
                    <option value="AUDITORIUM">ഓഡിറ്റോറിയം / കൺവെൻഷൻ സെന്റർ (Auditorium)</option>
                  </select>
                </div>
              )}

              {occ === "E" && (
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isItPark}
                    onChange={(e) => setIsItPark(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-800"
                  />
                  <span>ഐ.ടി പാർക്ക് / സോഫ്റ്റ്‌വെയർ കോംപ്ലക്സ് (75% Standard Fitments Concession)</span>
                </label>
              )}

              {occ === "F" && (
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <input
                    type="checkbox"
                    checked={isCommercialSmallShop}
                    onChange={(e) => setIsCommercialSmallShop(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-800"
                  />
                  <span>ചെറുകിട കട (Floor area &lt;= 100 m²: Min 1 Male WC & 1 Female WC)</span>
                </label>
              )}

              {occ === "I" && (
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <label className="block text-slate-400 text-[10px]">തൊഴിലാളികളുടെ എണ്ണം (Hazardous Workers):</label>
                  <input
                    type="number"
                    min="1"
                    value={hazardousWorkers}
                    onChange={(e) => setHazardousWorkers(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-bold"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    തൊഴിലാളികൾ 5 എണ്ണത്തിൽ കുറവാണെങ്കിൽ കുറഞ്ഞത് 1 WC നിർബന്ധം
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Statutory Size Minimums */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-3 font-mono text-xs text-slate-400">
            <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[11px]">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>ചട്ടപ്രകാരമുള്ള ശുചിമുറി അളവുകൾ (Statutory Minimum Dimensions):</span>
            </span>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">കുളിമുറി (Bathroom):</span>
                <span>കുറഞ്ഞത് 1.50 m² (ഒരു വശം Min 1.1 m)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">ടോയ്‌ലറ്റ് (Latrine / WC):</span>
                <span>കുറഞ്ഞത് 1.10 m² (ഒരു വശം Min 1.0 m)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">ബാത്ത് & WC സംയുക്തം:</span>
                <span>കുറഞ്ഞത് 2.20 m² (ഒരു വശം Min 1.1 m)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">യൂറിനൽ അളവ് (Urinal):</span>
                <span>കുറഞ്ഞത് 0.60 m × 0.70 m</span>
              </div>
              <div className="col-span-2 bg-slate-950 p-2.5 rounded-xl border border-cyan-500/30 flex items-center gap-2">
                <Accessibility className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-cyan-300 block">ഭിന്നശേഷി സൗഹൃദ ടോയ്‌ലറ്റ് (DA Toilet):</span>
                  <span>കുറഞ്ഞത് 1.50 m × 1.75 m (വാതിൽ 90 cm പുറത്തേക്ക് തുറക്കുന്നത് / സ്ലൈഡിംഗ്)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Scale Reduction Matrix & Fitment Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            {/* Table 15A Matrix Badge */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  <span>പട്ടിക 15A സ്കെയിൽ റിഡക്ഷൻ (TABLE 15A MATRIX)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {result.scaleReductionPercentage}% സ്കെയിൽ ബാധകം
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono pt-1 text-center">
                <div
                  className={`p-1.5 rounded-lg border ${
                    result.netSanitationAreaSqM <= 2000
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  &lt;= 2,000m²: <b>100%</b>
                </div>
                <div
                  className={`p-1.5 rounded-lg border ${
                    result.netSanitationAreaSqM > 2000 && result.netSanitationAreaSqM <= 5000
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  2,001–5,000m²: <b>90%</b>
                </div>
                <div
                  className={`p-1.5 rounded-lg border ${
                    result.netSanitationAreaSqM > 5000 && result.netSanitationAreaSqM <= 8000
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  5,001–8,000m²: <b>80%</b>
                </div>
                <div
                  className={`p-1.5 rounded-lg border ${
                    result.netSanitationAreaSqM > 8000 && result.netSanitationAreaSqM <= 12000
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  8,001–12,000m²: <b>70%</b>
                </div>
                <div
                  className={`p-1.5 rounded-lg border ${
                    result.netSanitationAreaSqM > 12000 && result.netSanitationAreaSqM <= 18000
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  12,001–18,000m²: <b>60%</b>
                </div>
                <div
                  className={`p-1.5 rounded-lg border ${
                    result.netSanitationAreaSqM > 18000
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500 font-bold"
                      : "bg-slate-900 text-slate-500 border-slate-800"
                  }`}
                >
                  &gt; 18,000m²: <b>50%</b>
                </div>
              </div>
            </div>

            {/* Calculated Fitments Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 font-mono">
              <span className="text-xs font-bold text-slate-300 uppercase block">
                ആകെ ആവശ്യമായ ശുചിത്വ ഉപകരണങ്ങൾ (Required Fitments Schedule):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ആൺ WC (Male WC):</span>
                  <span className="text-xl font-black text-white">{result.finalMaleWc}</span>
                  <span className="text-[9px] text-slate-500 block">(Unscaled: {result.rawMaleWc})</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">പെൺ WC (Female WC):</span>
                  <span className="text-xl font-black text-white">{result.finalFemaleWc}</span>
                  <span className="text-[9px] text-slate-500 block">(Unscaled: {result.rawFemaleWc})</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-cyan-500/40">
                  <span className="text-[10px] text-cyan-400 block font-bold">ആകെ ക്ലോസറ്റ് (Total WC):</span>
                  <span className="text-xl font-black text-cyan-300">{result.finalTotalWc}</span>
                  <span className="text-[9px] text-cyan-400/80 block">ക്ലോസറ്റുകൾ</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">യൂറിനലുകൾ (Male Urinals):</span>
                  <span className="text-xl font-black text-white">{result.finalMaleUrinals}</span>
                  <span className="text-[9px] text-slate-500 block">(Unscaled: {result.rawMaleUrinals})</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">പെൺ പ്രത്യേക യൂറിനൽ / WC:</span>
                  <span className="text-xl font-black text-white">{result.finalFemaleSpecialUrinals}</span>
                  <span className="text-[9px] text-slate-500 block">(Special Urinal)</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">വാഷ് ബേസിനുകൾ (Wash Basins):</span>
                  <span className="text-xl font-black text-white">{result.finalWashBasins}</span>
                  <span className="text-[9px] text-slate-500 block">(Unscaled: {result.rawWashBasins})</span>
                </div>

                {result.finalBaths > 0 && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">കുളിമുറികൾ (Baths / Showers):</span>
                    <span className="text-xl font-black text-emerald-400">{result.finalBaths}</span>
                  </div>
                )}

                {result.finalBedPanSinks > 0 && (
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">ബെഡ് പാൻ സിങ്ക് (Bed Pan):</span>
                    <span className="text-xl font-black text-amber-400">{result.finalBedPanSinks}</span>
                  </div>
                )}

                <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/40 flex items-center justify-between col-span-2 sm:col-span-3">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold block">ഭിന്നശേഷി സൗഹൃദ ടോയ്‌ലറ്റ്:</span>
                    <span className="text-xs text-white">പ്രവേശന നിലയിൽ നിർബന്ധം (Min 1.50m × 1.75m)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300">
                    MANDATORY
                  </span>
                </div>
              </div>

              {/* Occupancy Formula Explanation */}
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-300 font-bold block mb-0.5">ബാധകമായ ചട്ട സമവാക്യം:</span>
                {result.occupancySpecificFormula}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
