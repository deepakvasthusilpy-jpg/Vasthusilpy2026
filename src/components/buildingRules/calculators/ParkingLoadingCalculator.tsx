import React, { useState } from "react";
import { Car, Bike, Truck, CheckCircle2, AlertTriangle, Info, Accessibility } from "lucide-react";
import { OccupancyCode, TABLE_6_STANDARDS } from "../masterCalcTypes";
import { calculateParkingAndLoading } from "../masterCalcEngine";

interface Props {
  occupancy: OccupancyCode;
  onOccupancyChange?: (occ: OccupancyCode) => void;
  totalFloorAreaSqM: number;
  onTotalFloorAreaChange?: (area: number) => void;
}

export const ParkingLoadingCalculator: React.FC<Props> = ({
  occupancy,
  onOccupancyChange,
  totalFloorAreaSqM,
  onTotalFloorAreaChange
}) => {
  const [localOcc, setLocalOcc] = useState<OccupancyCode>(occupancy || "F");
  const [localArea, setLocalArea] = useState<number>(totalFloorAreaSqM || 600);

  // Specific flags
  const [isSingleFamily, setIsSingleFamily] = useState<boolean>(false);
  const [isApartmentVisitors, setIsApartmentVisitors] = useState<boolean>(true);
  const [isEduHostel, setIsEduHostel] = useState<boolean>(false);
  const [isGeneralHostel, setIsGeneralHostel] = useState<boolean>(false);
  const [isCollege, setIsCollege] = useState<boolean>(false);
  const [assemblyRate, setAssemblyRate] = useState<number>(18);

  // User provided slots
  const [carsProvided, setCarsProvided] = useState<number>(8);
  const [twoWheelersProvided, setTwoWheelersProvided] = useState<number>(10);
  const [loadingProvided, setLoadingProvided] = useState<number>(1);

  const occ = onOccupancyChange ? occupancy : localOcc;
  const area = onTotalFloorAreaChange ? totalFloorAreaSqM : localArea;

  const result = calculateParkingAndLoading(
    area,
    occ,
    isSingleFamily,
    isApartmentVisitors,
    isEduHostel,
    isGeneralHostel,
    isCollege,
    assemblyRate,
    carsProvided,
    twoWheelersProvided,
    loadingProvided
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
            KPBR Rule 29 & Tables 9, 10, 10A
          </span>
          <span className="text-xs font-mono text-slate-400">Off-Street Parking & Loading Norms</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-white">
          വാഹന പാർക്കിംഗ് & ലോഡിംഗ് കണക്കുകൂട്ടൽ (PARKING & LOADING CALCULATOR)
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          കാർ പാർക്കിംഗ് സ്ലോട്ടുകൾ, 25% വിസ്തൃതിയിലുള്ള ഇരുചക്ര പാർക്കിംഗ്, 3% ഭിന്നശേഷി പാർക്കിംഗ്,
          ഫ്ലാറ്റുകളിലെ 15% സന്ദർശക പാർക്കിംഗ്, ലോഡിംഗ്/അൺലോഡിംഗ് യാർഡുകൾ എന്നിവ ചട്ടപ്രകാരം പരിശോധിക്കുക.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-400" />
              <span>കെട്ടിടവും പാർക്കിംഗ് വിവരങ്ങളും (Parameters)</span>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-amber-500 outline-none"
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
                  ആകെ തറ വിസ്തൃതി (Floor Area for Parking)
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
              </div>
            </div>

            {/* Occupancy Specific Concession / Flags */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-xs font-mono">
              {occ === "A1" && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSingleFamily}
                      onChange={(e) => setIsSingleFamily(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800"
                    />
                    <span>ഏക കുടുംബ താമസ വീട് (Single Family Residential &lt;= 150m²: 1 slot)</span>
                  </label>

                  {!isSingleFamily && (
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isApartmentVisitors}
                        onChange={(e) => setIsApartmentVisitors(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800"
                      />
                      <span>അപ്പാർട്ട്മെന്റ് സന്ദർശക പാർക്കിംഗ് ബാധകം (15% Additional Visitors Parking)</span>
                    </label>
                  )}
                </div>
              )}

              {occ === "A2" && (
                <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    Group A2 ഇളവുകൾ (Rule 29 Table 10 Concessions):
                  </span>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEduHostel}
                      onChange={(e) => {
                        setIsEduHostel(e.target.checked);
                        if (e.target.checked) setIsGeneralHostel(false);
                      }}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800"
                    />
                    <span>അനാഥാലയം / വൃദ്ധസദനം / കാമ്പസ് ഹോസ്റ്റൽ (25% Parking മാത്രം മതി)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGeneralHostel}
                      onChange={(e) => {
                        setIsGeneralHostel(e.target.checked);
                        if (e.target.checked) setIsEduHostel(false);
                      }}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800"
                    />
                    <span>ജനറൽ ഹോസ്റ്റലുകൾ (50% Parking മാത്രം മതി)</span>
                  </label>
                </div>
              )}

              {occ === "B" && (
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCollege}
                    onChange={(e) => setIsCollege(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800"
                  />
                  <span>കോളേജ് കെട്ടിടം (1 per 120m²). അൺചെക്ക് ചെയ്താൽ സ്കൂൾ (1 per 300m²)</span>
                </label>
              )}

              {["D", "D1", "J"].includes(occ) && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">അസംബ്ലി പാർക്കിംഗ് നിരക്ക്:</span>
                  <select
                    value={assemblyRate}
                    onChange={(e) => setAssemblyRate(parseInt(e.target.value) || 18)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white text-xs"
                  >
                    <option value={15}>1 per 15 m²</option>
                    <option value={18}>1 per 18 m²</option>
                    <option value={20}>1 per 20 m²</option>
                  </select>
                </div>
              )}
            </div>

            {/* Provided Slots Input */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase block">
                പ്ലാനിൽ ലഭ്യമാക്കിയ പാർക്കിംഗ് (Parking Provided in Site Plan):
              </span>

              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">കാർ പാർക്കിംഗ് നൽകിയത്</label>
                  <input
                    type="number"
                    min="0"
                    value={carsProvided}
                    onChange={(e) => setCarsProvided(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">2-വീലർ പാർക്കിംഗ് നൽകിയത്</label>
                  <input
                    type="number"
                    min="0"
                    value={twoWheelersProvided}
                    onChange={(e) => setTwoWheelersProvided(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1">ലോഡിംഗ് ബേ നൽകിയത്</label>
                  <input
                    type="number"
                    min="0"
                    value={loadingProvided}
                    onChange={(e) => setLoadingProvided(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Unit Slot Dimensions Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg text-[11px] font-mono text-slate-400 space-y-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>ചട്ടപ്രകാരമുള്ള പാർക്കിംഗ് അളവുകൾ (Standard Dimensions - Table 9):</span>
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">കാർ സ്ലോട്ട്:</span>
                <span>5.5 m × 2.7 m (14.85 m²)</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">ഇരുചക്ര സ്ലോട്ട്:</span>
                <span>3.0 m² (കുറഞ്ഞ വീതി 1.5 m)</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">ഭിന്നശേഷി പാർക്കിംഗ്:</span>
                <span>3% കാർ സ്ലോട്ടുകൾ (വീതി 3.6 m)</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="font-bold text-white block">ലോഡിംഗ് ബേ (Table 10A):</span>
                <span>30 m² വീതം (പ്രത്യേക പ്രവേശനത്തോടെ)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Results & Pass/Fail */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                പാർക്കിംഗ് പരിശോധനാ ഫലം
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  result.isOverallParkingPassed
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : "bg-rose-950 text-rose-300 border-rose-800"
                }`}
              >
                {result.isOverallParkingPassed ? "PASSED" : "DEFICIT"}
              </span>
            </div>

            {/* Car Parking Requirement */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-amber-400" />
                  <span>ആവശ്യമായ കാർ പാർക്കിംഗ്:</span>
                </span>
                <span className="text-xl font-black text-amber-400">
                  {result.totalRequiredCarSlots} സ്ലോട്ട്
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded-xl text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>അടിസ്ഥാന പാർക്കിംഗ് (Base):</span>
                  <span className="text-white">{result.baseCarSlots} സ്ലോട്ട്</span>
                </div>
                {result.visitorsParkingSlots > 0 && (
                  <div className="flex justify-between">
                    <span>സന്ദർശക പാർക്കിംഗ് (Visitors 15%):</span>
                    <span className="text-cyan-300">+{result.visitorsParkingSlots} സ്ലോട്ട്</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>ഭിന്നശേഷി സംവരണം (DA 3%):</span>
                  <span className="text-emerald-300">{result.differentlyAbledCarSlots} സ്ലോട്ട് (3.6m വീതി)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span>നിർബന്ധിത കാർ പാർക്കിംഗ് വിസ്തീർണ്ണം:</span>
                  <span className="text-white font-bold">{result.mandatoryCarParkingAreaSqM} m²</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-400">നൽകിയത്: <b>{carsProvided} സ്ലോട്ട്</b></span>
                <span className={`font-bold ${result.isCarParkingPassed ? "text-emerald-400" : "text-rose-400"}`}>
                  {result.isCarParkingPassed ? "✓ തൃപ്തികരം" : `✗ ${result.totalRequiredCarSlots - carsProvided} സ്ലോട്ട് കുറവാണ്`}
                </span>
              </div>
            </div>

            {/* Two-Wheeler Requirement */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-cyan-400" />
                  <span>ഇരുചക്ര പാർക്കിംഗ് (25% Area):</span>
                </span>
                <span className="text-xl font-black text-cyan-400">
                  {result.requiredTwoWheelerSlots} എണ്ണം
                </span>
              </div>

              <div className="bg-slate-900 p-2 rounded-xl text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>ആവശ്യമായ വിസ്തീർണ്ണം (25% of Car Area):</span>
                  <span className="text-white">{result.requiredTwoWheelerAreaSqM} m²</span>
                </div>
                <div className="flex justify-between">
                  <span>ഒരു സ്ലോട്ടിന്റെ അളവ്:</span>
                  <span className="text-slate-300">3.0 m² (Min 1.5m)</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 text-xs">
                <span className="text-slate-400">നൽകിയത്: <b>{twoWheelersProvided} എണ്ണം</b></span>
                <span className={`font-bold ${result.isTwoWheelerPassed ? "text-emerald-400" : "text-rose-400"}`}>
                  {result.isTwoWheelerPassed ? "✓ തൃപ്തികരം" : `✗ ${result.requiredTwoWheelerSlots - twoWheelersProvided} എണ്ണം കുറവ്`}
                </span>
              </div>
            </div>

            {/* Loading / Unloading Requirement (Table 10A) */}
            {result.requiredLoadingBays > 0 ? (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span>ലോഡിംഗ് യാർഡ് (Table 10A):</span>
                  </span>
                  <span className="text-base font-black text-emerald-400">
                    {result.requiredLoadingBays} ബേ ({result.requiredLoadingAreaSqM} m²)
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  നൽകിയത്: {loadingProvided} ബേ ({loadingProvided >= result.requiredLoadingBays ? "✓ തൃപ്തികരം" : "✗ കുറവ്"})
                </span>
              </div>
            ) : (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-500">
                ലോഡിംഗ്/അൺലോഡിംഗ് സ്പേസ് ആവശ്യമില്ല (വിസ്തീർണ്ണം പരിധിയിൽ താഴെ).
              </div>
            )}

            {/* Explanation Note */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[10px] font-mono text-slate-400">
              <span className="text-slate-300 font-bold block mb-0.5">ബാധകമായ ചട്ടക്കുറിപ്പ്:</span>
              {result.ruleExplanation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
