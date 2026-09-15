import React, { useState, useEffect } from "react";
import { HelpCircle, Calculator, RefreshCw, Layers, FileText, PieChart, ChevronDown, ChevronUp, Info, Truck, ShieldAlert } from "lucide-react";

type UnitType = "METER_CM" | "FEET_INCH";

interface ConcreteGradeOption {
  label: string;
  grade: string;
  cement: number;
  sand: number;
  aggregate: number;
  strength: string;
}

const CONCRETE_GRADES: ConcreteGradeOption[] = [
  { label: "M20 (1:1.5:3) - Standard Structural", grade: "M20", cement: 1, sand: 1.5, aggregate: 3, strength: "20 N/mm² (200 Kg/cm²)" },
  { label: "M15 (1:2:4) - PCC Bedding / Flooring", grade: "M15", cement: 1, sand: 2, aggregate: 4, strength: "15 N/mm² (150 Kg/cm²)" },
  { label: "M10 (1:3:6) - Levelling Course / PCC", grade: "M10", cement: 1, sand: 3, aggregate: 6, strength: "10 N/mm² (100 Kg/cm²)" },
  { label: "M25 (1:1:2) - Heavy Reinforced RCC", grade: "M25", cement: 1, sand: 1, aggregate: 2, strength: "25 N/mm² (250 Kg/cm²)" },
  { label: "M7.5 (1:4:8) - Mass Concrete", grade: "M7.5", cement: 1, sand: 4, aggregate: 8, strength: "7.5 N/mm² (75 Kg/cm²)" },
  { label: "M5 (1:5:10) - Foundation Base", grade: "M5", cement: 1, sand: 5, aggregate: 10, strength: "5 N/mm² (50 Kg/cm²)" }
];

export const CementConcreteCalculator: React.FC = () => {
  const [unitType, setUnitType] = useState<UnitType>("METER_CM");

  // Meter/CM inputs (default matching reference screenshot 1: 10m x 7m x 4m)
  const [lengthMeter, setLengthMeter] = useState<string>("10");
  const [lengthCm, setLengthCm] = useState<string>("0");
  const [widthMeter, setWidthMeter] = useState<string>("7");
  const [widthCm, setWidthCm] = useState<string>("0");
  const [depthMeter, setDepthMeter] = useState<string>("4");
  const [depthCm, setDepthCm] = useState<string>("0");

  // Feet/Inch inputs
  const [lengthFeet, setLengthFeet] = useState<string>("32");
  const [lengthInch, setLengthInch] = useState<string>("9");
  const [widthFeet, setWidthFeet] = useState<string>("22");
  const [widthInch, setWidthInch] = useState<string>("11");
  const [depthFeet, setDepthFeet] = useState<string>("13");
  const [depthInch, setDepthInch] = useState<string>("1");

  // Selected Concrete Grade
  const [selectedGradeIdx, setSelectedGradeIdx] = useState<number>(0); // M20 default

  // Custom ratio state if needed
  const [customSandRatio, setCustomSandRatio] = useState<string>("1.5");
  const [customAggRatio, setCustomAggRatio] = useState<string>("3");

  // Accordion UI state
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState<boolean>(true);
  const [showGradesTable, setShowGradesTable] = useState<boolean>(true);

  // Calculation Results State
  const [results, setResults] = useState<{
    concreteVolM3: number;
    concreteVolFt3: number;
    wetMixVolM3: number;
    cementVolM3: number;
    cementBags: number;
    cementKg: number;
    sandVolM3: number;
    sandKg: number;
    sandTons: number;
    aggregateVolM3: number;
    aggregateKg: number;
    aggregateTons: number;
    cementRatio: number;
    sandRatio: number;
    aggRatio: number;
    sumRatio: number;
  } | null>(null);

  const calculateConcrete = () => {
    let lM = 0;
    let wM = 0;
    let dM = 0;

    if (unitType === "METER_CM") {
      const lMeterVal = parseFloat(lengthMeter) || 0;
      const lCmVal = parseFloat(lengthCm) || 0;
      lM = lMeterVal + lCmVal / 100;

      const wMeterVal = parseFloat(widthMeter) || 0;
      const wCmVal = parseFloat(widthCm) || 0;
      wM = wMeterVal + wCmVal / 100;

      const dMeterVal = parseFloat(depthMeter) || 0;
      const dCmVal = parseFloat(depthCm) || 0;
      dM = dMeterVal + dCmVal / 100;
    } else {
      const lFtVal = parseFloat(lengthFeet) || 0;
      const lInVal = parseFloat(lengthInch) || 0;
      lM = (lFtVal + lInVal / 12) * 0.3048;

      const wFtVal = parseFloat(widthFeet) || 0;
      const wInVal = parseFloat(widthInch) || 0;
      wM = (wFtVal + wInVal / 12) * 0.3048;

      const dFtVal = parseFloat(depthFeet) || 0;
      const dInVal = parseFloat(depthInch) || 0;
      dM = (dFtVal + dInVal / 12) * 0.3048;
    }

    // 1. Concrete Volume
    const concreteVolM3 = lM * wM * dM;
    const concreteVolFt3 = concreteVolM3 * 35.3147;

    // 2. Wet Volume of Mix (Dry volume factor = 1.524, i.e. 52.4% extra for dry volume conversion)
    const wetMixVolM3 = concreteVolM3 * 1.524;

    // Ratios
    const currentGrade = CONCRETE_GRADES[selectedGradeIdx];
    const cRatio = currentGrade.cement;
    const sRatio = currentGrade.sand;
    const aRatio = currentGrade.aggregate;
    const sumRatio = cRatio + sRatio + aRatio;

    // 3. Cement Requirement
    const cementVolM3 = (cRatio / sumRatio) * wetMixVolM3;
    // 1 Bag Cement = 0.035 m³ = 50 kg
    const cementBagsRaw = cementVolM3 / 0.035;
    const cementBags = Math.round(cementBagsRaw * 100) / 100;
    const cementKg = Math.round(cementBagsRaw * 50 * 100) / 100;

    // 4. Sand Requirement
    const sandVolM3 = (sRatio / sumRatio) * wetMixVolM3;
    // Dry loose bulk density of sand = 1550 kg/m³
    const sandKg = Math.round(sandVolM3 * 1550 * 100) / 100;
    const sandTons = Math.round((sandKg / 1000) * 100) / 100;

    // 5. Aggregate Requirement
    const aggregateVolM3 = (aRatio / sumRatio) * wetMixVolM3;
    // Dry loose bulk density of aggregate = 1350 kg/m³
    const aggregateKg = Math.round(aggregateVolM3 * 1350 * 100) / 100;
    const aggregateTons = Math.round((aggregateKg / 1000) * 100) / 100;

    setResults({
      concreteVolM3,
      concreteVolFt3,
      wetMixVolM3,
      cementVolM3,
      cementBags,
      cementKg,
      sandVolM3,
      sandKg,
      sandTons,
      aggregateVolM3,
      aggregateKg,
      aggregateTons,
      cementRatio: cRatio,
      sandRatio: sRatio,
      aggRatio: aRatio,
      sumRatio
    });
  };

  useEffect(() => {
    calculateConcrete();
  }, [
    unitType,
    lengthMeter,
    lengthCm,
    widthMeter,
    widthCm,
    depthMeter,
    depthCm,
    lengthFeet,
    lengthInch,
    widthFeet,
    widthInch,
    depthFeet,
    depthInch,
    selectedGradeIdx
  ]);

  const handleReset = () => {
    setUnitType("METER_CM");
    setLengthMeter("10");
    setLengthCm("0");
    setWidthMeter("7");
    setWidthCm("0");
    setDepthMeter("4");
    setDepthCm("0");
    setSelectedGradeIdx(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <span>Cement Concrete Calculator</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
              IS 456 STANDARD
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculate Cement Bags, Sand (Fine Aggregate), and Stone Aggregates for PCC & RCC Concrete
          </p>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 bg-slate-900 border border-slate-700 hover:border-cyan-500 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Guide</span>
        </button>
      </div>

      {/* Guide Info Box */}
      {showGuide && (
        <div className="bg-slate-900/90 border border-cyan-800/80 rounded-2xl p-5 space-y-2 text-xs font-mono text-slate-300">
          <h3 className="text-cyan-300 font-bold font-sans uppercase text-sm">
            സിമന്റ് കോൺക്രീറ്റ് കണക്കുകൂട്ടൽ രീതി (PCC & RCC)
          </h3>
          <p className="leading-relaxed">
            സിമന്റ്, മണൽ (Fine Aggregate), കല്ല് (Coarse Aggregate) എന്നിവ നിശ്ചിത അനുപാതത്തിൽ വെള്ളം ചേർത്ത് കലർത്തുന്നതാണ് കോൺക്രീറ്റ്. ഉണങ്ങിയ മിശ്രിതത്തിന്റെ വ്യാപ്തി (Dry Volume) നനഞ്ഞ മിശ്രിതത്തേക്കാൾ (Wet Volume) 52.4% കൂടുതലായി കണക്കാക്കുന്നു.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-cyan-400">
            <div>• 1 Bag Cement = 50 kg = 0.035 m³</div>
            <div>• Dry Bulk Density of Sand = 1550 kg/m³</div>
            <div>• Dry Bulk Density of Aggregate = 1350 kg/m³</div>
          </div>
        </div>
      )}

      {/* Main Grid: Input Form & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 bg-blueprint-grid relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Cement Concrete Calculation</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setUnitType("METER_CM")}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                  unitType === "METER_CM"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Meter/CM
              </button>
              <button
                type="button"
                onClick={() => setUnitType("FEET_INCH")}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                  unitType === "FEET_INCH"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Feet/Inch
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Grade of Concrete */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Grade of Concrete (കോൺക്രീറ്റ് ഗ്രേഡ്)
              </label>

              <select
                value={selectedGradeIdx}
                onChange={(e) => setSelectedGradeIdx(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none cursor-pointer font-bold"
              >
                {CONCRETE_GRADES.map((g, idx) => (
                  <option key={idx} value={idx}>
                    {g.label}
                  </option>
                ))}
              </select>

              <div className="mt-1.5 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Compressive Strength (28 Days):</span>
                <span className="text-cyan-400 font-bold">
                  {CONCRETE_GRADES[selectedGradeIdx].strength}
                </span>
              </div>
            </div>

            {/* Length */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Length (നീളം)
              </label>

              {unitType === "METER_CM" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={lengthMeter}
                      onChange={(e) => setLengthMeter(e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      meter
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={lengthFeet}
                      onChange={(e) => setLengthFeet(e.target.value)}
                      placeholder="32"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      feet
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={lengthInch}
                      onChange={(e) => setLengthInch(e.target.value)}
                      placeholder="9"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Width */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Width (വീതി)
              </label>

              {unitType === "METER_CM" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={widthMeter}
                      onChange={(e) => setWidthMeter(e.target.value)}
                      placeholder="7"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      meter
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={widthCm}
                      onChange={(e) => setWidthCm(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={widthFeet}
                      onChange={(e) => setWidthFeet(e.target.value)}
                      placeholder="22"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      feet
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={widthInch}
                      onChange={(e) => setWidthInch(e.target.value)}
                      placeholder="11"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Depth / Thickness */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Depth / Thickness (കനം / ആഴം)
              </label>

              {unitType === "METER_CM" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={depthMeter}
                      onChange={(e) => setDepthMeter(e.target.value)}
                      placeholder="4"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      meter
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={depthCm}
                      onChange={(e) => setDepthCm(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      cm
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={depthFeet}
                      onChange={(e) => setDepthFeet(e.target.value)}
                      placeholder="13"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      feet
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={depthInch}
                      onChange={(e) => setDepthInch(e.target.value)}
                      placeholder="1"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={calculateConcrete}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-cyan-500/20 transition cursor-pointer uppercase"
              >
                <Calculator className="w-4 h-4 text-slate-950" />
                <span>Calculate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono font-bold px-4 py-3.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs transition cursor-pointer shrink-0"
              >
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output: Results Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 bg-blueprint-grid relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Cement Concrete Results</span>
              </h2>
            </div>

            {results && (
              <>
                {/* Total Volume Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    TOTAL VOLUME OF CEMENT CONCRETE
                  </span>
                  <div className="text-3xl md:text-4xl font-black font-mono text-rose-500 py-1">
                    {results.concreteVolM3.toFixed(2)} m³
                  </div>
                  <div className="text-sm font-mono text-cyan-300">
                    {results.concreteVolFt3.toFixed(2)} ft³
                  </div>
                </div>

                {/* Materials Summary Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3">Sr.</th>
                        <th className="p-3">Material</th>
                        <th className="p-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-white">
                      <tr>
                        <td className="p-3 text-slate-500 font-bold">1</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>Cement (സിമന്റ്)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-cyan-300">
                          {results.cementBags} Bags
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-500 font-bold">2</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-rose-400" />
                          <span>Sand (മണൽ)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-300">
                          {results.sandTons} Ton
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-500 font-bold">3</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <Truck className="w-4 h-4 text-amber-400" />
                          <span>Aggregate (കല്ല്)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-amber-300">
                          {results.aggregateTons} Ton
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Visual Weight Pills */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                  <div className="p-2.5 bg-cyan-950/60 border border-cyan-800/80 rounded-xl">
                    <div className="text-[10px] text-cyan-400 font-bold">CEMENT IN KG</div>
                    <div className="text-xs sm:text-sm font-bold text-cyan-200 mt-0.5">
                      {results.cementKg.toFixed(0)} kg
                    </div>
                  </div>

                  <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl">
                    <div className="text-[10px] text-rose-400 font-bold">SAND IN KG</div>
                    <div className="text-xs sm:text-sm font-bold text-rose-200 mt-0.5">
                      {results.sandKg.toFixed(0)} kg
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl">
                    <div className="text-[10px] text-amber-400 font-bold">AGGREGATE IN KG</div>
                    <div className="text-xs sm:text-sm font-bold text-amber-200 mt-0.5">
                      {results.aggregateKg.toFixed(0)} kg
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Breakdown (Matching Reference Screenshots 2 & 3) */}
      {results && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-mono text-xs text-slate-300">
          <div
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center justify-between border-b border-slate-800 pb-3 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white font-sans uppercase">
                Step-by-Step Mathematical Calculation Breakdown
              </h2>
            </div>

            <button className="text-slate-400 hover:text-white">
              {showSteps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {showSteps && (
            <div className="space-y-6 pt-2">
              {/* Volume & Wet Mix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                  <h3 className="text-cyan-300 font-bold uppercase text-xs">
                    Cement Concrete Volume
                  </h3>
                  <p>= Length × Width × Depth</p>
                  <p className="text-white font-bold">
                    = {results.concreteVolM3.toFixed(2)} m³ = {results.concreteVolFt3.toFixed(2)} ft³
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                  <h3 className="text-cyan-300 font-bold uppercase text-xs">
                    Wet Volume of Mix (Dry Volume Conversion)
                  </h3>
                  <p>= Total Volume + (Total Volume × 52.4 / 100)</p>
                  <p className="text-white font-bold">
                    = {results.concreteVolM3.toFixed(2)} × 1.524 = {results.wetMixVolM3.toFixed(2)} m³
                  </p>
                  <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded text-[11px] mt-1">
                    ✓ Wet volume of mix is 52.4% higher than dry volume for shrinkage & voids.
                  </div>
                </div>
              </div>

              {/* 3 Steps Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1: Cement */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-cyan-300 font-bold uppercase text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Amount of Cement Required</span>
                  </h3>

                  <p className="text-[11px]">
                    Cement Vol = ({results.cementRatio} / {results.sumRatio}) × {results.wetMixVolM3.toFixed(2)}
                  </p>
                  <p className="text-white font-bold">
                    = {results.cementVolM3.toFixed(2)} m³
                  </p>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-[11px] space-y-1">
                    <p className="text-slate-400">No. of Cement Bags = {results.cementVolM3.toFixed(2)} / 0.035</p>
                    <p className="text-cyan-300 font-bold">= {results.cementBags} Bags</p>
                    <p className="text-slate-400 pt-1">Cement in Kg = {results.cementBags} × 50</p>
                    <p className="text-cyan-300 font-bold">= {results.cementKg.toFixed(2)} kg</p>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
                    Note: 1 Bag of cement = 0.035 m³ = 50 kg
                  </div>
                </div>

                {/* Step 2: Sand */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-rose-300 font-bold uppercase text-xs flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Amount of Sand Required</span>
                  </h3>

                  <p className="text-[11px]">
                    Sand Vol = ({results.sandRatio} / {results.sumRatio}) × {results.wetMixVolM3.toFixed(2)}
                  </p>
                  <p className="text-white font-bold">
                    = {results.sandVolM3.toFixed(2)} m³
                  </p>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-[11px] space-y-1">
                    <p className="text-slate-400">Sand in Kg = {results.sandVolM3.toFixed(2)} × 1550</p>
                    <p className="text-rose-300 font-bold">= {results.sandKg.toFixed(2)} kg</p>
                    <p className="text-slate-400 pt-1">Sand in Ton = {results.sandKg.toFixed(2)} / 1000</p>
                    <p className="text-rose-300 font-bold">= {results.sandTons} Ton</p>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
                    Note: Dry loose bulk density of sand = 1550 kg/m³
                  </div>
                </div>

                {/* Step 3: Aggregate */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-amber-300 font-bold uppercase text-xs flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Amount of Aggregate Required</span>
                  </h3>

                  <p className="text-[11px]">
                    Agg Vol = ({results.aggRatio} / {results.sumRatio}) × {results.wetMixVolM3.toFixed(2)}
                  </p>
                  <p className="text-white font-bold">
                    = {results.aggregateVolM3.toFixed(2)} m³
                  </p>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-[11px] space-y-1">
                    <p className="text-slate-400">Aggregate in Kg = {results.aggregateVolM3.toFixed(2)} × 1350</p>
                    <p className="text-amber-300 font-bold">= {results.aggregateKg.toFixed(2)} kg</p>
                    <p className="text-slate-400 pt-1">Aggregate in Ton = {results.aggregateKg.toFixed(2)} / 1000</p>
                    <p className="text-amber-300 font-bold">= {results.aggregateTons} Ton</p>
                  </div>

                  <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
                    Note: Dry loose bulk density of aggregate = 1350 kg/m³
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IS 456 Concrete Code & Grade Reference Table (Matching Screenshots 4, 5 & 6) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-mono text-xs text-slate-300">
        <div
          onClick={() => setShowGradesTable(!showGradesTable)}
          className="flex items-center justify-between border-b border-slate-800 pb-3 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white font-sans uppercase">
              IS 456 Concrete Code & Mix Ratios Reference Table
            </h2>
          </div>

          <button className="text-slate-400 hover:text-white">
            {showGradesTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showGradesTable && (
          <div className="space-y-4 pt-1">
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left bg-slate-950">
                <thead className="bg-slate-900 text-cyan-300 text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Concrete Grade</th>
                    <th className="p-3">Proportion (Cement : Sand : Stone)</th>
                    <th className="p-3">Expected Compressive Strength at 28 days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 text-xs">
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-cyan-400">M10 or M100</td>
                    <td className="p-3">1 : 3 : 6</td>
                    <td className="p-3">10 N/mm² or 100 Kg/cm²</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-cyan-400">M15 or M150</td>
                    <td className="p-3">1 : 2 : 4</td>
                    <td className="p-3">15 N/mm² or 150 Kg/cm²</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50 bg-cyan-950/20">
                    <td className="p-3 font-bold text-cyan-300">M20 or M200 (Standard)</td>
                    <td className="p-3 font-bold text-white">1 : 1.5 : 3</td>
                    <td className="p-3 font-bold text-cyan-300">20 N/mm² or 200 Kg/cm²</td>
                  </tr>
                  <tr className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-cyan-400">M25 or M250</td>
                    <td className="p-3">1 : 1 : 2</td>
                    <td className="p-3">25 N/mm² or 250 Kg/cm²</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-white font-bold text-xs uppercase font-sans flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>PCC (Plain Cement Concrete)</span>
                </h3>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  PCC is a mixture of cement, fine aggregate (sand), and coarse aggregate. Used for levelling, bedding for footings, grade slabs, and concrete roads to provide a rigid, firm bed for laying RCC.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-white font-bold text-xs uppercase font-sans flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>RCC (Reinforced Cement Concrete)</span>
                </h3>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  RCC is concrete reinforced with steel rebar to resist tensile stresses in structural members like footings, columns, beams, slabs, and lintels as per IS 456.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
