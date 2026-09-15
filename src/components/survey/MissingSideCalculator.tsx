import React, { useState } from "react";
import { HelpCircle, Calculator, RefreshCw, AlertCircle, FileText, CheckCircle2 } from "lucide-react";

type AreaUnit = "sq_m" | "cent" | "sq_ft" | "acre" | "are" | "hectare";

const UNIT_LABELS: Record<AreaUnit, string> = {
  sq_m: "Sq. m",
  cent: "Cent",
  sq_ft: "Sq. Feet",
  acre: "Acre",
  are: "Are",
  hectare: "Hectare"
};

const UNIT_TO_SQM: Record<AreaUnit, number> = {
  sq_m: 1.0,
  cent: 40.468564,
  sq_ft: 0.09290304,
  acre: 4046.8564,
  are: 100.0,
  hectare: 10000.0
};

export const MissingSideCalculator: React.FC = () => {
  const [sideA, setSideA] = useState<string>("");
  const [sideB, setSideB] = useState<string>("");
  const [totalAreaInput, setTotalAreaInput] = useState<string>("");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sq_m");
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Calculation Results
  const [calculatedSideC, setCalculatedSideC] = useState<number | null>(null);
  const [includedAngleDeg, setIncludedAngleDeg] = useState<number | null>(null);
  const [computedAreaSqM, setComputedAreaSqM] = useState<number | null>(null);
  const [calcStatus, setCalcStatus] = useState<"PENDING" | "CALCULATED" | "ERROR">("PENDING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCalculate = () => {
    const a = parseFloat(sideA);
    const b = parseFloat(sideB);
    const areaVal = parseFloat(totalAreaInput);

    if (isNaN(a) || a <= 0 || isNaN(b) || b <= 0 || isNaN(areaVal) || areaVal <= 0) {
      setErrorMessage("ദയവായി സാധുവായ അളവുകൾ നൽകുക (Please enter valid positive numbers for Side a, Side b, and Area).");
      setCalcStatus("ERROR");
      setCalculatedSideC(null);
      setIncludedAngleDeg(null);
      setComputedAreaSqM(null);
      return;
    }

    const areaInSqM = areaVal * UNIT_TO_SQM[areaUnit];
    setComputedAreaSqM(areaInSqM);

    // Math check: sin(C) = (2 * Area) / (a * b)
    const sinC = (2 * areaInSqM) / (a * b);

    if (sinC > 1.0000001) {
      setErrorMessage(
        `സ്വീകരിച്ച വിസ്തീർണ്ണം നൽകിയ വശങ്ങൾക്ക് അസാധ്യമാണ് (2 × Area > a × b). ഈ വശങ്ങളിൽ വരാവുന്ന പരമാവധി വിസ്തീർണ്ണം ${((a * b) / 2).toFixed(2)} m² ആണ്.`
      );
      setCalcStatus("ERROR");
      setCalculatedSideC(null);
      setIncludedAngleDeg(null);
      return;
    }

    // Clamp sinC to 1.0 to avoid precision issues
    const clampedSinC = Math.min(1.0, Math.max(-1.0, sinC));
    const angleRad = Math.asin(clampedSinC);
    const angleDeg = (angleRad * 180) / Math.PI;

    // Law of Cosines: c = sqrt(a^2 + b^2 - 2ab * cos(C))
    const sideCSquared = a * a + b * b - 2 * a * b * Math.cos(angleRad);
    const sideC = Math.sqrt(Math.max(0, sideCSquared));

    setCalculatedSideC(sideC);
    setIncludedAngleDeg(angleDeg);
    setErrorMessage(null);
    setCalcStatus("CALCULATED");
  };

  const handleReset = () => {
    setSideA("");
    setSideB("");
    setTotalAreaInput("");
    setAreaUnit("sq_m");
    setCalculatedSideC(null);
    setIncludedAngleDeg(null);
    setComputedAreaSqM(null);
    setCalcStatus("PENDING");
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <span>Missing Side Calculator (GEO-04)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Extrapolate unknown boundary length using known side measurements and plot area
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
            തീകട്ട / വിസ്തീർണ്ണത്തിൽ നിന്ന് വിട്ടുപോയ വശം കണ്ടെത്തുന്ന രീതി (GEO-04 GUIDE)
          </h3>
          <p className="leading-relaxed">
            ഭൂമിയുടെ രണ്ടു വശങ്ങളുടെ നീളവും (Side a, Side b) മൊത്തം വിസ്തീർണ്ണവും (Total Area) അറിയാമെങ്കിൽ trigonometrical formula ഉം Law of Cosines ഉം ഉപയോഗിച്ച് വിട്ടുപോയ മൂന്നാമത്തെ അതിരുകളുടെ നീളവും ഉൾക്കൊള്ളുന്ന കോണും (Included Angle) കൃത്യമായി കണക്കാക്കാവുന്നതാണ്.
          </p>
          <p className="text-cyan-400 font-bold">
            • 1 സെന്റ് (Cent) = 40.4686 ചതുരശ്ര മീറ്റർ (Sq. Meters)
          </p>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Inputs & Math approach) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input Parameters Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 bg-blueprint-grid relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white font-sans uppercase">
                Input Parameters
              </h2>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800 uppercase">
                GEO-04
              </span>
            </div>

            <div className="space-y-4">
              {/* Row 1: Side a & Side b */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Known Side a
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={sideA}
                      onChange={(e) => setSideA(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-sm font-mono text-white outline-none font-bold placeholder:text-slate-600"
                    />
                    <span className="absolute right-3 top-3 text-xs font-mono text-slate-400">
                      m
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                    Known Side b
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={sideB}
                      onChange={(e) => setSideB(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-sm font-mono text-white outline-none font-bold placeholder:text-slate-600"
                    />
                    <span className="absolute right-3 top-3 text-xs font-mono text-slate-400">
                      m
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Total Area + Unit Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                  Total Area
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      value={totalAreaInput}
                      onChange={(e) => setTotalAreaInput(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-sm font-mono text-white outline-none font-bold placeholder:text-slate-600"
                    />
                  </div>

                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
                    className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-3 text-xs font-mono text-white font-bold outline-none cursor-pointer"
                  >
                    {Object.entries(UNIT_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Buttons: Calculate & Reset */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-mono font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-700/20 transition cursor-pointer uppercase"
                >
                  <Calculator className="w-4 h-4 text-white" />
                  <span>Calculate Missing Side</span>
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

          {/* Mathematical Approach Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              MATHEMATICAL APPROACH
            </span>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-slate-300 leading-relaxed">
              <p>1. Area = 0.5 × a × b × sin(C)</p>
              <p>2. Solve for included angle C: C = arcsin((2 × Area) / (a × b))</p>
              <p>3. Law of Cosines for side c: c = √(a² + b² - 2ab × cos(C))</p>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 italic">
                * Note: 1 Cent = 40.4686 Sq. Meters
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Survey Report) */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 bg-blueprint-grid relative">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white font-sans uppercase">
                Survey Report
              </h2>
            </div>

            {/* Input Summaries */}
            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Side a</span>
                <span className="text-white font-bold">
                  {sideA ? `${parseFloat(sideA).toFixed(2)} m` : "-- m"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Side b</span>
                <span className="text-white font-bold">
                  {sideB ? `${parseFloat(sideB).toFixed(2)} m` : "-- m"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">Area</span>
                <span className="text-white font-bold">
                  {computedAreaSqM ? `${computedAreaSqM.toFixed(2)} sq.m` : "-- sq.m"}
                </span>
              </div>
            </div>

            {/* CALCULATED MISSING SIDE BOX */}
            <div className="bg-blue-950/40 border border-blue-800/80 rounded-2xl p-6 text-center space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-300 uppercase block">
                CALCULATED MISSING SIDE (c)
              </span>

              <div className="text-3xl md:text-4xl font-black font-mono text-cyan-300 py-1">
                {calculatedSideC !== null ? `${calculatedSideC.toFixed(2)} m` : "-- m"}
              </div>
            </div>

            {/* Included Angle */}
            <div className="flex items-center justify-between border-t border-b border-slate-800/80 py-3 text-xs font-mono">
              <span className="text-slate-400">Included Angle (C)</span>
              <span className="text-cyan-300 font-bold">
                {includedAngleDeg !== null ? `${includedAngleDeg.toFixed(2)} °` : "-- °"}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="pt-2">
              <span
                className={`inline-block text-[10px] font-mono font-bold px-3 py-1 rounded border uppercase ${
                  calcStatus === "CALCULATED"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : calcStatus === "ERROR"
                    ? "bg-rose-950 text-rose-300 border-rose-800"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
              >
                STATUS: {calcStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
