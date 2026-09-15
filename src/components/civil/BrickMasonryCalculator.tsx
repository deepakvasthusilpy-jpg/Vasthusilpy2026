import React, { useState } from "react";
import { HelpCircle, Calculator, RefreshCw, Layers, Package, FileText, PieChart, ChevronDown, ChevronUp, Info, CheckCircle2 } from "lucide-react";

type UnitType = "METER_CM" | "FEET_INCH";

interface BrickSize {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

const WALL_THICKNESS_PRESETS = [
  { label: "23 CM Wall (9 inch - Double Brick / 1 Wall)", valueMeters: 0.23 },
  { label: "10 CM Wall (4 inch - Half Brick Wall)", valueMeters: 0.10 },
  { label: "11.5 CM Wall (4.5 inch Wall)", valueMeters: 0.115 },
  { label: "15 CM Wall (6 inch Block Wall)", valueMeters: 0.15 },
  { label: "Custom Thickness", valueMeters: -1 }
];

const RATIO_PRESETS = [
  { label: "C.M 1:3 (1 Cement : 3 Sand)", cementRatio: 1, sandRatio: 3 },
  { label: "C.M 1:4 (1 Cement : 4 Sand)", cementRatio: 1, sandRatio: 4 },
  { label: "C.M 1:5 (1 Cement : 5 Sand)", cementRatio: 1, sandRatio: 5 },
  { label: "C.M 1:6 (1 Cement : 6 Sand)", cementRatio: 1, sandRatio: 6 }
];

export const BrickMasonryCalculator: React.FC = () => {
  const [unitType, setUnitType] = useState<UnitType>("METER_CM");

  // Meter/CM inputs
  const [lengthMeter, setLengthMeter] = useState<string>("3");
  const [lengthCm, setLengthCm] = useState<string>("6");
  const [heightMeter, setHeightMeter] = useState<string>("3");
  const [heightCm, setHeightCm] = useState<string>("6");

  // Feet/Inch inputs
  const [lengthFeet, setLengthFeet] = useState<string>("10");
  const [lengthInch, setLengthInch] = useState<string>("0");
  const [heightFeet, setHeightFeet] = useState<string>("10");
  const [heightInch, setHeightInch] = useState<string>("0");

  // Wall Thickness
  const [selectedThicknessIdx, setSelectedThicknessIdx] = useState<number>(0);
  const [customThicknessCm, setCustomThicknessCm] = useState<string>("23");

  // Mortar Ratio
  const [selectedRatioIdx, setSelectedRatioIdx] = useState<number>(1); // C.M 1:4

  // Modular Brick Size (IS 1077 default: 19 x 9 x 9 cm)
  const [brickLengthCm, setBrickLengthCm] = useState<string>("19");
  const [brickWidthCm, setBrickWidthCm] = useState<string>("9");
  const [brickHeightCm, setBrickHeightCm] = useState<string>("9");

  // Mortar joint thickness (default 1 cm / 10 mm)
  const mortarJointCm = 1;

  // UI state
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState<boolean>(true);

  // Computed results state
  const [results, setResults] = useState<{
    wallVolumeM3: number;
    wallVolumeFt3: number;
    totalBricks: number;
    actualBrickVolM3: number;
    wetMortarVolM3: number;
    mortarWithWastageM3: number;
    dryMortarVolM3: number;
    cementVolM3: number;
    cementBags: number;
    cementKg: number;
    sandVolM3: number;
    sandKg: number;
    sandTons: number;
  } | null>(null);

  const calculateMasonry = () => {
    let lMeters = 0;
    let hMeters = 0;

    if (unitType === "METER_CM") {
      const lM = parseFloat(lengthMeter) || 0;
      const lC = parseFloat(lengthCm) || 0;
      lMeters = lM + lC / 100;

      const hM = parseFloat(heightMeter) || 0;
      const hC = parseFloat(heightCm) || 0;
      hMeters = hM + hC / 100;
    } else {
      const lF = parseFloat(lengthFeet) || 0;
      const lI = parseFloat(lengthInch) || 0;
      lMeters = (lF + lI / 12) * 0.3048;

      const hF = parseFloat(heightFeet) || 0;
      const hI = parseFloat(heightInch) || 0;
      hMeters = (hF + hI / 12) * 0.3048;
    }

    let thickMeters = WALL_THICKNESS_PRESETS[selectedThicknessIdx].valueMeters;
    if (thickMeters === -1) {
      thickMeters = (parseFloat(customThicknessCm) || 23) / 100;
    }

    // 1. Total Volume of Brick Masonry
    const wallVolumeM3 = lMeters * hMeters * thickMeters;
    const wallVolumeFt3 = wallVolumeM3 * 35.3147;

    // Brick Size without mortar (convert cm -> meters)
    const bL = (parseFloat(brickLengthCm) || 19) / 100;
    const bW = (parseFloat(brickWidthCm) || 9) / 100;
    const bH = (parseFloat(brickHeightCm) || 9) / 100;

    const singleBrickVolM3 = bL * bW * bH;

    // Brick Size WITH Mortar Joint (add 1 cm = 0.01 m to each dimension)
    const mortarM = mortarJointCm / 100;
    const bL_m = bL + mortarM;
    const bW_m = bW + mortarM;
    const bH_m = bH + mortarM;

    const singleBrickWithMortarVolM3 = bL_m * bW_m * bH_m;

    // 2. Number of Bricks
    const rawBricksCount = wallVolumeM3 / singleBrickWithMortarVolM3;
    const totalBricks = Math.ceil(rawBricksCount);

    // 3. Actual Volume of Bricks Without Mortar
    const actualBrickVolM3 = totalBricks * singleBrickVolM3;

    // 4. Wet Mortar Volume = Masonry Volume - Actual Bricks Volume
    const wetMortarVolM3 = Math.max(0, wallVolumeM3 - actualBrickVolM3);

    // Add 15% for wastage & non-uniform joints
    const mortarWithWastageM3 = wetMortarVolM3 * 1.15;

    // Add 25% for Dry Volume
    const dryMortarVolM3 = mortarWithWastageM3 * 1.25;

    // 5. Cement & Sand calculation
    const ratioPreset = RATIO_PRESETS[selectedRatioIdx];
    const sumRatio = ratioPreset.cementRatio + ratioPreset.sandRatio;

    // Cement Volume
    const cementVolM3 = (ratioPreset.cementRatio / sumRatio) * dryMortarVolM3;
    // 1 Bag Cement = 0.035 m³ = 50 kg
    const cementBagsRaw = cementVolM3 / 0.035;
    const cementBags = Math.round(cementBagsRaw * 10) / 10;
    const cementKg = Math.round(cementBagsRaw * 50);

    // Sand Volume
    const sandVolM3 = (ratioPreset.sandRatio / sumRatio) * dryMortarVolM3;
    // Sand density = 1500 kg/m³
    const sandKg = Math.round(sandVolM3 * 1500);
    const sandTons = Math.round((sandKg / 1000) * 100) / 100;

    setResults({
      wallVolumeM3,
      wallVolumeFt3,
      totalBricks,
      actualBrickVolM3,
      wetMortarVolM3,
      mortarWithWastageM3,
      dryMortarVolM3,
      cementVolM3,
      cementBags,
      cementKg,
      sandVolM3,
      sandKg,
      sandTons
    });
  };

  // Run initial calculation on load
  React.useEffect(() => {
    calculateMasonry();
  }, [
    unitType,
    lengthMeter,
    lengthCm,
    heightMeter,
    heightCm,
    lengthFeet,
    lengthInch,
    heightFeet,
    heightInch,
    selectedThicknessIdx,
    customThicknessCm,
    selectedRatioIdx,
    brickLengthCm,
    brickWidthCm,
    brickHeightCm
  ]);

  const handleReset = () => {
    setUnitType("METER_CM");
    setLengthMeter("3");
    setLengthCm("6");
    setHeightMeter("3");
    setHeightCm("6");
    setSelectedThicknessIdx(0);
    setCustomThicknessCm("23");
    setSelectedRatioIdx(1);
    setBrickLengthCm("19");
    setBrickWidthCm("9");
    setBrickHeightCm("9");
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <span>Brick Masonry Calculator</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
              IS 1077
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Estimate total bricks, cement bags, and sand required for wall construction based on IS 1077 standard specifications
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
            ഇഷ്ടിക കെട്ട് നിർമ്മാണ കണക്കുകൂട്ടൽ രീതി (BRICK MASONRY GUIDELINES - IS 1077)
          </h3>
          <p className="leading-relaxed">
            ഇന്ത്യൻ സ്റ്റാൻഡേർഡ് IS 1077 അനുസരിച്ച് സാധാരണ മോഡുലാർ ബ്രിക്കിന്റെ അളവ് 19cm × 9cm × 9cm ആണ്. 10mm സിമന്റ് കൂട്ട് ചേർക്കുമ്പോൾ ബ്രിക്കിന്റെ കണക്കാക്കാവുന്ന അളവ് 20cm × 10cm × 10cm (0.002 m³) ആകുന്നു.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-cyan-400">
            <div>• 1 ചതുരശ്ര മീറ്റർ (m³) = 35.3147 cubic feet</div>
            <div>• 1 ബാഗ് സിമന്റ് = 50 kg = 0.035 m³</div>
            <div>• മണലിന്റെ സാന്ദ്രത (Sand Bulk Density) = 1500 kg/m³</div>
          </div>
        </div>
      )}

      {/* Main Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 bg-blueprint-grid relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <span>Brick Masonry Calculation</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setUnitType("METER_CM")}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                  unitType === "METER_CM"
                    ? "bg-blue-600 text-white shadow"
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
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Feet/Inch
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Length Input */}
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
                      placeholder="3"
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
                      placeholder="6"
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
                      placeholder="10"
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
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Height / Depth Input */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Height / Depth (ഉയരം)
              </label>

              {unitType === "METER_CM" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={heightMeter}
                      onChange={(e) => setHeightMeter(e.target.value)}
                      placeholder="3"
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
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="6"
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
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="10"
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
                      value={heightInch}
                      onChange={(e) => setHeightInch(e.target.value)}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Wall Thickness Dropdown */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Wall Thickness (മതിലിന്റെ കനം)
              </label>

              <select
                value={selectedThicknessIdx}
                onChange={(e) => setSelectedThicknessIdx(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none cursor-pointer font-bold"
              >
                {WALL_THICKNESS_PRESETS.map((p, idx) => (
                  <option key={idx} value={idx}>
                    {p.label}
                  </option>
                ))}
              </select>

              {WALL_THICKNESS_PRESETS[selectedThicknessIdx].valueMeters === -1 && (
                <div className="mt-2 relative">
                  <input
                    type="number"
                    step="any"
                    value={customThicknessCm}
                    onChange={(e) => setCustomThicknessCm(e.target.value)}
                    placeholder="23"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none font-bold"
                  />
                  <span className="absolute right-3 top-2 text-xs font-mono text-slate-400">
                    cm
                  </span>
                </div>
              )}
            </div>

            {/* Mortar Ratio */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Mortar Ratio (സിമന്റ് മണൽ അനുപാതം)
              </label>

              <select
                value={selectedRatioIdx}
                onChange={(e) => setSelectedRatioIdx(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none cursor-pointer font-bold"
              >
                {RATIO_PRESETS.map((r, idx) => (
                  <option key={idx} value={idx}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size of Brick (IS 1077 Modular standard) */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Size of Brick (ഇഷ്ടികയുടെ അളവുകൾ - IS 1077)
              </label>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Length</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={brickLengthCm}
                      onChange={(e) => setBrickLengthCm(e.target.value)}
                      placeholder="19"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Width</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={brickWidthCm}
                      onChange={(e) => setBrickWidthCm(e.target.value)}
                      placeholder="9"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                      cm
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Height</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={brickHeightCm}
                      onChange={(e) => setBrickHeightCm(e.target.value)}
                      placeholder="9"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                      cm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={calculateMasonry}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-600/20 transition cursor-pointer uppercase"
              >
                <Calculator className="w-4 h-4 text-white" />
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

        {/* Right Output: Results Summary & Chart */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 bg-blueprint-grid relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Masonry Estimation Results</span>
              </h2>
            </div>

            {results && (
              <>
                {/* Total Bricks Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      TOTAL BRICKS REQUIRED
                    </span>
                    <div className="text-3xl md:text-4xl font-black font-mono text-rose-500 py-1">
                      {results.totalBricks}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      VOLUME OF CONSTRUCTION
                    </span>
                    <div className="text-lg md:text-xl font-bold font-mono text-cyan-300 py-1">
                      {results.wallVolumeM3.toFixed(2)} m³
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      OR {results.wallVolumeFt3.toFixed(2)} ft³
                    </div>
                  </div>
                </div>

                {/* Materials Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-3">Sr.</th>
                        <th className="p-3">Material</th>
                        <th className="p-3 text-right">Quantity / Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-white">
                      <tr>
                        <td className="p-3 text-slate-500 font-bold">1</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <Package className="w-4 h-4 text-cyan-400" />
                          <span>Bricks (ഇഷ്ടിക)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-cyan-300">
                          {results.totalBricks} Nos
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-500 font-bold">2</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <Layers className="w-4 h-4 text-rose-400" />
                          <span>Cement (സിമന്റ്)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-300">
                          {results.cementBags} Bags ({results.cementKg} kg)
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-500 font-bold">3</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-amber-400" />
                          <span>Sand (മണൽ)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-amber-300">
                          {results.sandTons} Ton ({results.sandKg} kg)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Visual Material Proportion Cards */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                  <div className="p-2.5 bg-cyan-950/60 border border-cyan-800/80 rounded-xl">
                    <div className="text-[10px] text-cyan-400 font-bold">BRICKS</div>
                    <div className="text-sm font-bold text-cyan-200 mt-0.5">
                      {results.totalBricks}
                    </div>
                  </div>

                  <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl">
                    <div className="text-[10px] text-rose-400 font-bold">CEMENT KG</div>
                    <div className="text-sm font-bold text-rose-200 mt-0.5">
                      {results.cementKg} kg
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl">
                    <div className="text-[10px] text-amber-400 font-bold">SAND KG</div>
                    <div className="text-sm font-bold text-amber-200 mt-0.5">
                      {results.sandKg} kg
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-step Detailed Calculation Breakdown (Matching Reference Screenshots 2 & 3) */}
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
              {/* Step 1 */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <h3 className="text-cyan-300 font-bold uppercase text-xs">
                  Step 1 : Masonry Volume & Bricks Count
                </h3>

                <div className="space-y-1 text-slate-300 leading-relaxed">
                  <p>
                    Volume of Brick Masonry = Length (m) × Height (m) × Wall Thickness (m)
                  </p>
                  <p className="text-white font-bold">
                    Volume = {results.wallVolumeM3.toFixed(3)} m³
                  </p>

                  <div className="pt-2 text-slate-400">
                    <p>
                      Brick Size (without mortar) = {brickLengthCm}cm × {brickWidthCm}cm × {brickHeightCm}cm
                    </p>
                    <p>
                      Size of Brick with 10mm Mortar = {(parseFloat(brickLengthCm) + 1) / 100}m × {(parseFloat(brickWidthCm) + 1) / 100}m × {(parseFloat(brickHeightCm) + 1) / 100}m
                    </p>
                  </div>

                  <p className="pt-1">
                    No. of Bricks = Volume of Brick Masonry / Volume of One Brick with Mortar
                  </p>
                  <p className="text-rose-400 font-bold">
                    No. of Bricks = {results.totalBricks} Bricks
                  </p>

                  <div className="pt-2 text-slate-400">
                    <p>
                      Actual Volume of Bricks = {results.totalBricks} × ({parseFloat(brickLengthCm)/100} × {parseFloat(brickWidthCm)/100} × {parseFloat(brickHeightCm)/100}) = {results.actualBrickVolM3.toFixed(4)} m³
                    </p>
                    <p>
                      Wet Volume of Mortar = {results.wallVolumeM3.toFixed(4)} - {results.actualBrickVolM3.toFixed(4)} = {results.wetMortarVolM3.toFixed(4)} m³
                    </p>
                  </div>

                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-[11px] mt-2">
                    ✓ Add 15% for wastage & non-uniform mortar joints = {results.mortarWithWastageM3.toFixed(4)} m³<br />
                    ✓ Add 25% for Dry Volume = {results.dryMortarVolM3.toFixed(4)} m³
                  </div>
                </div>
              </div>

              {/* Step 2 & 3 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-cyan-300 font-bold uppercase text-xs">
                    Step 2 : Amount of Cement
                  </h3>

                  <p>
                    Cement = (Cement Ratio / Sum of Ratio) × Dry Mortar Volume
                  </p>
                  <p className="text-white font-bold">
                    Cement Volume = {results.cementVolM3.toFixed(4)} m³
                  </p>

                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded mt-2">
                    1 Bag of Cement = 0.035 m³ = 50 kg<br />
                    No. of Cement Bags = {results.cementVolM3.toFixed(4)} / 0.035 = <strong className="text-rose-300">{results.cementBags} Bags ({results.cementKg} kg)</strong>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-cyan-300 font-bold uppercase text-xs">
                    Step 3 : Amount of Sand Required
                  </h3>

                  <p>
                    Sand = (Sand Ratio / Sum of Ratio) × Dry Mortar Volume
                  </p>
                  <p className="text-white font-bold">
                    Sand Volume = {results.sandVolM3.toFixed(4)} m³
                  </p>

                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded mt-2">
                    Dry loose bulk density of sand = 1500 kg/m³<br />
                    Sand Weight = {results.sandVolM3.toFixed(2)} × 1500 = <strong className="text-amber-300">{results.sandKg} kg ({results.sandTons} Ton)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
