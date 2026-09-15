import React, { useState } from "react";
import { HelpCircle, Calculator, RefreshCw, Layers, Package, FileText, PieChart, ChevronDown, ChevronUp, Info, CheckCircle2, Box } from "lucide-react";

type UnitType = "FEET_INCH" | "METER_CM";
type BlockSizeUnit = "INCH" | "CM_MM";

const WALL_THICKNESS_PRESETS = [
  { label: "23 CM Wall (9 inch - Full Block Wall)", valueMeters: 0.23 },
  { label: "20 CM Wall (8 inch Standard CMU)", valueMeters: 0.20 },
  { label: "15 CM Wall (6 inch Solid/Hollow Block)", valueMeters: 0.15 },
  { label: "10 CM Wall (4 inch Partition Block)", valueMeters: 0.10 },
  { label: "Custom Thickness", valueMeters: -1 }
];

const RATIO_PRESETS = [
  { label: "C.M 1:6 (1 Cement : 6 Sand)", cementRatio: 1, sandRatio: 6 },
  { label: "C.M 1:5 (1 Cement : 5 Sand)", cementRatio: 1, sandRatio: 5 },
  { label: "C.M 1:4 (1 Cement : 4 Sand)", cementRatio: 1, sandRatio: 4 },
  { label: "C.M 1:3 (1 Cement : 3 Sand)", cementRatio: 1, sandRatio: 3 }
];

const BLOCK_SIZE_PRESETS = [
  { label: 'Standard 9" x 4" x 3" (Inch)', l: 9, w: 4, h: 3, unit: "INCH" as BlockSizeUnit },
  { label: 'Solid Block 400 x 200 x 200 mm (16"x8"x8")', l: 40, w: 20, h: 20, unit: "CM_MM" as BlockSizeUnit },
  { label: 'Solid Block 400 x 200 x 150 mm (16"x8"x6")', l: 40, w: 20, h: 15, unit: "CM_MM" as BlockSizeUnit },
  { label: 'Partition Block 400 x 200 x 100 mm (16"x8"x4")', l: 40, w: 20, h: 10, unit: "CM_MM" as BlockSizeUnit },
  { label: 'AAC Block 600 x 200 x 100 mm', l: 60, w: 20, h: 10, unit: "CM_MM" as BlockSizeUnit },
  { label: 'Custom Block Size', l: -1, w: -1, h: -1, unit: "INCH" as BlockSizeUnit }
];

export const ConcreteBlockCalculator: React.FC = () => {
  const [unitType, setUnitType] = useState<UnitType>("FEET_INCH");

  // Feet/Inch inputs (default 10 ft 6 in x 10 ft 6 in to match reference default)
  const [lengthFeet, setLengthFeet] = useState<string>("10");
  const [lengthInch, setLengthInch] = useState<string>("6");
  const [heightFeet, setHeightFeet] = useState<string>("10");
  const [heightInch, setHeightInch] = useState<string>("6");

  // Meter/CM inputs
  const [lengthMeter, setLengthMeter] = useState<string>("3");
  const [lengthCm, setLengthCm] = useState<string>("20");
  const [heightMeter, setHeightMeter] = useState<string>("3");
  const [heightCm, setHeightCm] = useState<string>("20");

  // Wall Thickness
  const [selectedThicknessIdx, setSelectedThicknessIdx] = useState<number>(0);
  const [customThicknessCm, setCustomThicknessCm] = useState<string>("23");

  // Mortar Ratio (default C.M 1:6 matching reference)
  const [selectedRatioIdx, setSelectedRatioIdx] = useState<number>(0);

  // Block Size
  const [selectedBlockPresetIdx, setSelectedBlockPresetIdx] = useState<number>(0);
  const [blockSizeUnit, setBlockSizeUnit] = useState<BlockSizeUnit>("INCH");
  const [blockLengthInput, setBlockLengthInput] = useState<string>("9");
  const [blockWidthInput, setBlockWidthInput] = useState<string>("4");
  const [blockHeightInput, setBlockHeightInput] = useState<string>("3");

  // Mortar Joint thickness (default 15 mm / 0.015 m matching reference screenshot step 1)
  const mortarJointMm = 15;

  // UI state
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSteps, setShowSteps] = useState<boolean>(true);

  // Results state
  const [results, setResults] = useState<{
    wallVolumeM3: number;
    wallVolumeFt3: number;
    totalBlocks: number;
    actualBlockVolM3: number;
    wetMortarVolM3: number;
    mortarWithWastageM3: number;
    dryMortarVolM3: number;
    cementVolM3: number;
    cementBags: number;
    cementKg: number;
    sandVolM3: number;
    sandKg: number;
    sandTons: number;
    blockLenMeter: number;
    blockWidMeter: number;
    blockHeiMeter: number;
  } | null>(null);

  const calculateConcreteBlock = () => {
    let lMeters = 0;
    let hMeters = 0;

    if (unitType === "FEET_INCH") {
      const lF = parseFloat(lengthFeet) || 0;
      const lI = parseFloat(lengthInch) || 0;
      lMeters = (lF + lI / 12) * 0.3048;

      const hF = parseFloat(heightFeet) || 0;
      const hI = parseFloat(heightInch) || 0;
      hMeters = (hF + hI / 12) * 0.3048;
    } else {
      const lM = parseFloat(lengthMeter) || 0;
      const lC = parseFloat(lengthCm) || 0;
      lMeters = lM + lC / 100;

      const hM = parseFloat(heightMeter) || 0;
      const hC = parseFloat(heightCm) || 0;
      hMeters = hM + hC / 100;
    }

    let thickMeters = WALL_THICKNESS_PRESETS[selectedThicknessIdx].valueMeters;
    if (thickMeters === -1) {
      thickMeters = (parseFloat(customThicknessCm) || 23) / 100;
    }

    // 1. Total Volume of Concrete Block Masonry
    const wallVolumeM3 = lMeters * hMeters * thickMeters;
    const wallVolumeFt3 = wallVolumeM3 * 35.3147;

    // Block Dimensions conversion to Meters
    let blockL_m = 0;
    let blockW_m = 0;
    let blockH_m = 0;

    const rawL = parseFloat(blockLengthInput) || 9;
    const rawW = parseFloat(blockWidthInput) || 4;
    const rawH = parseFloat(blockHeightInput) || 3;

    if (blockSizeUnit === "INCH") {
      blockL_m = rawL * 0.0254;
      blockW_m = rawW * 0.0254;
      blockH_m = rawH * 0.0254;
    } else {
      // CM inputs
      blockL_m = rawL / 100;
      blockW_m = rawW / 100;
      blockH_m = rawH / 100;
    }

    const singleBlockVolM3 = blockL_m * blockW_m * blockH_m;

    // Block Size WITH Mortar Joint (15 mm = 0.015 m)
    const mortarM = mortarJointMm / 1000;
    const blockL_m_mortar = blockL_m + mortarM;
    const blockW_m_mortar = blockW_m + mortarM;
    const blockH_m_mortar = blockH_m + mortarM;

    const singleBlockWithMortarVolM3 = blockL_m_mortar * blockW_m_mortar * blockH_m_mortar;

    // 2. Number of Concrete Blocks required
    const rawBlocksCount = wallVolumeM3 / singleBlockWithMortarVolM3;
    const totalBlocks = Math.ceil(rawBlocksCount);

    // 3. Actual Volume of Concrete Blocks Without Mortar
    const actualBlockVolM3 = totalBlocks * singleBlockVolM3;

    // 4. Wet Mortar Volume = Masonry Volume - Actual Blocks Volume
    const wetMortarVolM3 = Math.max(0, wallVolumeM3 - actualBlockVolM3);

    // Add 15% for wastage & non-uniform mortar joints
    const mortarWithWastageM3 = wetMortarVolM3 * 1.15;

    // Add 25% for Dry Volume
    const dryMortarVolM3 = mortarWithWastageM3 * 1.25;

    // 5. Cement & Sand ratio calculation
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
    // Dry loose bulk density of sand = 1550 kg/m³ (as noted in step 3 of reference)
    const sandKg = Math.round(sandVolM3 * 1550);
    const sandTons = Math.round((sandKg / 1000) * 100) / 100;

    setResults({
      wallVolumeM3,
      wallVolumeFt3,
      totalBlocks,
      actualBlockVolM3,
      wetMortarVolM3,
      mortarWithWastageM3,
      dryMortarVolM3,
      cementVolM3,
      cementBags,
      cementKg,
      sandVolM3,
      sandKg,
      sandTons,
      blockLenMeter: blockL_m,
      blockWidMeter: blockW_m,
      blockHeiMeter: blockH_m
    });
  };

  // Re-calculate on state updates
  React.useEffect(() => {
    calculateConcreteBlock();
  }, [
    unitType,
    lengthFeet,
    lengthInch,
    heightFeet,
    heightInch,
    lengthMeter,
    lengthCm,
    heightMeter,
    heightCm,
    selectedThicknessIdx,
    customThicknessCm,
    selectedRatioIdx,
    selectedBlockPresetIdx,
    blockSizeUnit,
    blockLengthInput,
    blockWidthInput,
    blockHeightInput
  ]);

  const handleBlockPresetChange = (idx: number) => {
    setSelectedBlockPresetIdx(idx);
    const preset = BLOCK_SIZE_PRESETS[idx];
    if (preset.l !== -1) {
      setBlockSizeUnit(preset.unit);
      setBlockLengthInput(preset.l.toString());
      setBlockWidthInput(preset.w.toString());
      setBlockHeightInput(preset.h.toString());
    }
  };

  const handleReset = () => {
    setUnitType("FEET_INCH");
    setLengthFeet("10");
    setLengthInch("6");
    setHeightFeet("10");
    setHeightInch("6");
    setSelectedThicknessIdx(0);
    setCustomThicknessCm("23");
    setSelectedRatioIdx(0);
    setSelectedBlockPresetIdx(0);
    setBlockSizeUnit("INCH");
    setBlockLengthInput("9");
    setBlockWidthInput("4");
    setBlockHeightInput("3");
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <span>Concrete Block Calculator</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
              CONCRETE MASONRY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Estimate solid/hollow concrete blocks (CMU), cement bags, and sand required for wall construction
          </p>
        </div>

        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 bg-slate-900 border border-slate-700 hover:border-amber-500 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Guide</span>
        </button>
      </div>

      {/* Guide Info Box */}
      {showGuide && (
        <div className="bg-slate-900/90 border border-amber-800/80 rounded-2xl p-5 space-y-2 text-xs font-mono text-slate-300">
          <h3 className="text-amber-300 font-bold font-sans uppercase text-sm">
            കോൺക്രീറ്റ് ബ്ലോക്ക് നിർമ്മാണ കണക്കുകൂട്ടൽ രീതി (CONCRETE BLOCK MASONRY)
          </h3>
          <p className="leading-relaxed">
            കോൺക്രീറ്റ് ബ്ലോക്കുകൾ (Solid & Hollow Blocks / CMU) പ്രധാനമായും കെട്ടിട നിർമ്മാണത്തിന് ഉപയോഗിക്കുന്നു. തുന്നൽ ചാന്തിനായി (Mortar Joint) 15mm കനം കൂട്ടിയാണ് ബ്ലോക്കുകളുടെ എണ്ണം കണക്കാക്കുന്നത്.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-amber-400">
            <div>• 1 m³ = 35.3147 cubic feet</div>
            <div>• 1 Bag Cement = 50 kg = 0.035 m³</div>
            <div>• മണലിന്റെ സാന്ദ്രത (Sand Density) = 1550 kg/m³</div>
          </div>
        </div>
      )}

      {/* Main Form & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 bg-blueprint-grid relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
              <Box className="w-4 h-4 text-amber-400" />
              <span>Concrete Block Calculation</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setUnitType("FEET_INCH")}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                  unitType === "FEET_INCH"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Feet/Inch
              </button>
              <button
                type="button"
                onClick={() => setUnitType("METER_CM")}
                className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-md transition cursor-pointer ${
                  unitType === "METER_CM"
                    ? "bg-amber-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Meter/CM
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Length Input */}
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5">
                Length (നീളം)
              </label>

              {unitType === "FEET_INCH" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={lengthFeet}
                      onChange={(e) => setLengthFeet(e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
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
                      placeholder="6"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={lengthMeter}
                      onChange={(e) => setLengthMeter(e.target.value)}
                      placeholder="3"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
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
                      placeholder="20"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      cm
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

              {unitType === "FEET_INCH" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      placeholder="10"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
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
                      placeholder="6"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      inch
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={heightMeter}
                      onChange={(e) => setHeightMeter(e.target.value)}
                      placeholder="3"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
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
                      placeholder="20"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400">
                      cm
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none cursor-pointer font-bold"
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none font-bold"
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
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white outline-none cursor-pointer font-bold"
              >
                {RATIO_PRESETS.map((r, idx) => (
                  <option key={idx} value={idx}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size of Concrete Block */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-slate-300 font-bold">
                  Size of Block (ബ്ലോക്കിന്റെ അളവുകൾ)
                </label>

                <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono">
                  <span className="text-slate-400">Unit:</span>
                  <button
                    type="button"
                    onClick={() => setBlockSizeUnit("INCH")}
                    className={`px-1.5 py-0.5 rounded ${blockSizeUnit === "INCH" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                  >
                    Inch
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockSizeUnit("CM_MM")}
                    className={`px-1.5 py-0.5 rounded ${blockSizeUnit === "CM_MM" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400"}`}
                  >
                    CM
                  </button>
                </div>
              </div>

              <select
                value={selectedBlockPresetIdx}
                onChange={(e) => handleBlockPresetChange(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white outline-none cursor-pointer font-bold"
              >
                {BLOCK_SIZE_PRESETS.map((b, idx) => (
                  <option key={idx} value={idx}>
                    {b.label}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Length</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={blockLengthInput}
                      onChange={(e) => setBlockLengthInput(e.target.value)}
                      placeholder="9"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                      {blockSizeUnit === "INCH" ? "inch" : "cm"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Width</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={blockWidthInput}
                      onChange={(e) => setBlockWidthInput(e.target.value)}
                      placeholder="4"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                      {blockSizeUnit === "INCH" ? "inch" : "cm"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Height</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={blockHeightInput}
                      onChange={(e) => setBlockHeightInput(e.target.value)}
                      placeholder="3"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none font-bold"
                    />
                    <span className="absolute right-2 top-2 text-[10px] font-mono text-slate-500">
                      {blockSizeUnit === "INCH" ? "inch" : "cm"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={calculateConcreteBlock}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer uppercase"
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
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Concrete Block Results</span>
              </h2>
            </div>

            {results && (
              <>
                {/* Total Concrete Block Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      TOTAL CONCRETE BLOCK REQUIRED
                    </span>
                    <div className="text-3xl md:text-4xl font-black font-mono text-rose-500 py-1">
                      {results.totalBlocks}
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      VOLUME OF CONSTRUCTION
                    </span>
                    <div className="text-lg md:text-xl font-bold font-mono text-amber-300 py-1">
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
                        <th className="p-3">Sr No.</th>
                        <th className="p-3">Material</th>
                        <th className="p-3 text-right">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-white">
                      <tr>
                        <td className="p-3 text-slate-500 font-bold">1</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <Box className="w-4 h-4 text-amber-400" />
                          <span>Blocks (ബ്ലോക്കുകൾ)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-amber-300">
                          {results.totalBlocks}
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-500 font-bold">2</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>Cement (സിമന്റ്)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-cyan-300">
                          {results.cementBags} Bags
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-slate-500 font-bold">3</td>
                        <td className="p-3 font-bold flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-rose-400" />
                          <span>Sand (മണൽ)</span>
                        </td>
                        <td className="p-3 text-right font-bold text-rose-300">
                          {results.sandTons} ton
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Visual Material Proportion Cards */}
                <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                  <div className="p-2.5 bg-amber-950/60 border border-amber-800/80 rounded-xl">
                    <div className="text-[10px] text-amber-400 font-bold">NO OF BLOCKS</div>
                    <div className="text-sm font-bold text-amber-200 mt-0.5">
                      {results.totalBlocks}
                    </div>
                  </div>

                  <div className="p-2.5 bg-cyan-950/60 border border-cyan-800/80 rounded-xl">
                    <div className="text-[10px] text-cyan-400 font-bold">CEMENT IN KG</div>
                    <div className="text-sm font-bold text-cyan-200 mt-0.5">
                      {results.cementKg} kg
                    </div>
                  </div>

                  <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl">
                    <div className="text-[10px] text-rose-400 font-bold">SAND IN KG</div>
                    <div className="text-sm font-bold text-rose-200 mt-0.5">
                      {results.sandKg} kg
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Detailed Breakdown (Matching Reference Screenshots 2 & 3) */}
      {results && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 font-mono text-xs text-slate-300">
          <div
            onClick={() => setShowSteps(!showSteps)}
            className="flex items-center justify-between border-b border-slate-800 pb-3 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400" />
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
                <h3 className="text-amber-300 font-bold uppercase text-xs">
                  Step 1 : Volume of Concrete Block & Quantity of Blocks
                </h3>

                <div className="space-y-1 text-slate-300 leading-relaxed">
                  <p>
                    Volume of Concrete Block = Length (m) × Depth (m) × Wall Thickness (m)
                  </p>
                  <p className="text-white font-bold">
                    Volume of Concrete Block = {results.wallVolumeM3.toFixed(2)} m³ ({results.wallVolumeFt3.toFixed(2)} ft³)
                  </p>

                  <div className="pt-2 text-slate-400">
                    <p>
                      Block Size = {blockLengthInput} ({blockSizeUnit === "INCH" ? "inch" : "cm"}) × {blockWidthInput} ({blockSizeUnit === "INCH" ? "inch" : "cm"}) × {blockHeightInput} ({blockSizeUnit === "INCH" ? "inch" : "cm"})
                    </p>
                    <p>
                      Block Size (meters) = {results.blockLenMeter.toFixed(4)} m × {results.blockWidMeter.toFixed(4)} m × {results.blockHeiMeter.toFixed(4)} m
                    </p>
                    <p>
                      Size of Block with 15mm Mortar Joint = {(results.blockLenMeter + 0.015).toFixed(4)} m × {(results.blockWidMeter + 0.015).toFixed(4)} m × {(results.blockHeiMeter + 0.015).toFixed(4)} m
                    </p>
                  </div>

                  <p className="pt-1">
                    No of Blocks = Volume of Concrete Block / Volume of one Block with Mortar
                  </p>
                  <p className="text-rose-400 font-bold">
                    No of Blocks = {results.totalBlocks} Blocks
                  </p>

                  <div className="pt-2 text-slate-400">
                    <p>
                      Actual Volume of Blocks Without Mortar = {results.totalBlocks} × ({results.blockLenMeter.toFixed(4)} × {results.blockWidMeter.toFixed(4)} × {results.blockHeiMeter.toFixed(4)}) = {results.actualBlockVolM3.toFixed(4)} m³
                    </p>
                    <p>
                      Quantity of Mortar = Volume of Concrete Block - Actual Volume of Blocks without mortar = {results.wallVolumeM3.toFixed(4)} - {results.actualBlockVolM3.toFixed(4)} = {results.wetMortarVolM3.toFixed(4)} m³
                    </p>
                  </div>

                  <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-lg text-emerald-300 text-[11px] mt-2">
                    ✓ Add 15% more for wastage, non-uniform thickness of mortar joints = {results.mortarWithWastageM3.toFixed(4)} m³<br />
                    ✓ Add 25% more for Dry Volume = {results.dryMortarVolM3.toFixed(4)} m³
                  </div>
                </div>
              </div>

              {/* Step 2 & 3 Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-amber-300 font-bold uppercase text-xs">
                    Step 2 : Amount of Cement
                  </h3>

                  <p>
                    Cement = (Cement / Sum of Ratio) × Quantity Of Mortar
                  </p>
                  <p className="text-white font-bold">
                    Cement Volume = {results.cementVolM3.toFixed(4)} m³
                  </p>

                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded mt-2">
                    1 Bag of Cement = 0.035 m³<br />
                    No. of Cement Bags = {results.cementVolM3.toFixed(4)} / 0.035 = <strong className="text-cyan-300">{results.cementBags} Bags ({results.cementKg} kg)</strong>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <h3 className="text-amber-300 font-bold uppercase text-xs">
                    Step 3 : Amount of Sand Required
                  </h3>

                  <p>
                    Sand = (Sand / Sum of Ratio) × Quantity Of Mortar
                  </p>
                  <p className="text-white font-bold">
                    Sand Volume = {results.sandVolM3.toFixed(4)} m³
                  </p>

                  <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 text-[11px] rounded mt-2">
                    By considering dry loose bulk density of sand = 1550 kg/m³<br />
                    Sand Weight = {results.sandVolM3.toFixed(2)} × 1550 = <strong className="text-rose-300">{results.sandKg} kg ({results.sandTons} ton)</strong>
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
