import React, { useState } from "react";
import { ArrowRightLeft, Copy, Check, RefreshCw, Calculator, Ruler, MapPin, Sparkles, Compass } from "lucide-react";

// Length Conversion factors to Base Unit: Meters (m)
const LENGTH_FACTORS: Record<string, number> = {
  feet: 0.3048,
  meters: 1.0,
  inches: 0.0254,
  cm: 0.01,
  yards: 0.9144,
  km: 1000.0,
  miles: 1609.344,
};

// Area Conversion factors to Base Unit: Sq. Meters (m²)
// 1 Cent = 435.6 sq ft = 40.468564224 sq m
// 1 Are = 100 sq m
// 1 Acre = 100 Cents = 4046.8564224 sq m
// 1 Hectare = 10,000 sq m
const AREA_FACTORS: Record<string, number> = {
  are: 100.0,
  sqMeters: 1.0,
  acre: 4046.8564224,
  sqFeet: 0.09290304,
  cents: 40.468564224,
  hectare: 10000.0,
};

export const SurveyConvertersTab: React.FC = () => {
  // Length State (Base in Meters)
  const [baseLengthMeters, setBaseLengthMeters] = useState<number>(0.3048); // default 1 feet
  const [lastLengthKey, setLastLengthKey] = useState<string>("feet");
  const [lengthInputValues, setLengthInputValues] = useState<Record<string, string>>({
    feet: "1",
    meters: "0.3048",
    inches: "12",
    cm: "30.48",
    yards: "0.3333",
    km: "0.0003048",
    miles: "0.0001894",
  });

  // Area State (Base in Sq. Meters)
  const [baseAreaSqMeters, setBaseAreaSqMeters] = useState<number>(100.0); // default 1 Are = 100 sq m
  const [lastAreaKey, setLastAreaKey] = useState<string>("are");
  const [areaInputValues, setAreaInputValues] = useState<Record<string, string>>({
    are: "1",
    sqMeters: "100",
    acre: "0.0247",
    sqFeet: "1076.39",
    cents: "2.4707",
    hectare: "0.01",
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Helper function to format numbers cleanly
  const formatNumber = (num: number, key: string): string => {
    if (isNaN(num) || num === 0) return "0";

    if (Math.abs(num) < 0.0001) {
      return num.toFixed(6).replace(/\.?0+$/, "");
    } else if (Math.abs(num) < 0.01) {
      return num.toFixed(5).replace(/\.?0+$/, "");
    } else if (Math.abs(num) < 1) {
      return num.toFixed(4).replace(/\.?0+$/, "");
    } else if (Math.abs(num) > 10000) {
      return num.toFixed(2).replace(/\.?0+$/, "");
    } else {
      return Number(num.toFixed(4)).toString();
    }
  };

  // Handle Length Change
  const handleLengthChange = (key: string, val: string) => {
    const newInputs = { ...lengthInputValues, [key]: val };

    if (val.trim() === "" || isNaN(Number(val))) {
      setLengthInputValues(newInputs);
      return;
    }

    const numVal = parseFloat(val);
    const inMeters = numVal * LENGTH_FACTORS[key];
    setBaseLengthMeters(inMeters);
    setLastLengthKey(key);

    // Update all other units
    Object.keys(LENGTH_FACTORS).forEach((unitKey) => {
      if (unitKey !== key) {
        const converted = inMeters / LENGTH_FACTORS[unitKey];
        newInputs[unitKey] = formatNumber(converted, unitKey);
      }
    });

    setLengthInputValues(newInputs);
  };

  // Handle Area Change
  const handleAreaChange = (key: string, val: string) => {
    const newInputs = { ...areaInputValues, [key]: val };

    if (val.trim() === "" || isNaN(Number(val))) {
      setAreaInputValues(newInputs);
      return;
    }

    const numVal = parseFloat(val);
    const inSqMeters = numVal * AREA_FACTORS[key];
    setBaseAreaSqMeters(inSqMeters);
    setLastAreaKey(key);

    // Update all other units
    Object.keys(AREA_FACTORS).forEach((unitKey) => {
      if (unitKey !== key) {
        const converted = inSqMeters / AREA_FACTORS[unitKey];
        newInputs[unitKey] = formatNumber(converted, unitKey);
      }
    });

    setAreaInputValues(newInputs);
  };

  const handleCopyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(`${value} ${label}`);
    setCopiedKey(`${label}-${value}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Reset Length
  const resetLength = (feetVal: number = 1) => {
    handleLengthChange("feet", feetVal.toString());
  };

  // Reset Area
  const resetArea = (areVal: number = 1) => {
    handleAreaChange("are", areVal.toString());
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl bg-blueprint-grid text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl text-slate-950 shadow-lg shadow-cyan-500/20">
            <ArrowRightLeft className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                SURVEY UNIT CONVERTERS
              </span>
              <span className="text-[10px] font-mono text-blue-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                REAL-TIME MULTI-UNIT SYNC
              </span>
            </div>
            <h2 className="text-2xl font-black font-sans text-white tracking-tight flex items-center gap-2">
              <span>നീളം & വിസ്തീർണ്ണം യൂണിറ്റ് കൺവെർട്ടർ</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Length (Feet, Meters, Inches, cm, Yards, Kilometers, Miles) & Area (Are, Sq.Meters, Acre, Sq.Feet, Cent, Hectare).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetLength(1);
              resetArea(1);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>RESET DEFAULTS</span>
          </button>
        </div>
      </div>

      {/* 1. LENGTH CONVERTER TABLE */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden space-y-0">
        {/* Table Title Bar */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Ruler className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono tracking-wider text-cyan-300 uppercase">
              LENGTH CONVERTER (നീള അളവ് മാറ്റങ്ങൾ)
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">Quick Presets:</span>
            <button
              onClick={() => handleLengthChange("feet", "1")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition"
            >
              1 Feet
            </button>
            <button
              onClick={() => handleLengthChange("meters", "1")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition"
            >
              1 Meter
            </button>
            <button
              onClick={() => handleLengthChange("feet", "100")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition"
            >
              100 Feet
            </button>
          </div>
        </div>

        {/* Table Header & Inputs Row */}
        <div className="p-4 sm:p-6 bg-slate-950/60 overflow-x-auto">
          {/* Styled Banner Matching Reference Image */}
          <div className="min-w-[700px] border border-cyan-900/60 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
            {/* Header Columns Header */}
            <div className="grid grid-cols-7 bg-cyan-900/80 text-cyan-100 font-mono font-bold text-xs uppercase divide-x divide-cyan-800/80 text-center py-3 px-1">
              <div className="px-1">Feet</div>
              <div className="px-1">Meters</div>
              <div className="px-1">Inches</div>
              <div className="px-1">cm</div>
              <div className="px-1">Yards</div>
              <div className="px-1">Kilometers</div>
              <div className="px-1">Miles</div>
            </div>

            {/* Input Values Row */}
            <div className="grid grid-cols-7 divide-x divide-slate-800 p-3 bg-slate-900/90 items-center">
              {/* Feet */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.feet}
                  onChange={(e) => handleLengthChange("feet", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "feet"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* Meters */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.meters}
                  onChange={(e) => handleLengthChange("meters", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "meters"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* Inches */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.inches}
                  onChange={(e) => handleLengthChange("inches", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "inches"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* cm */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.cm}
                  onChange={(e) => handleLengthChange("cm", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "cm"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* Yards */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.yards}
                  onChange={(e) => handleLengthChange("yards", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "yards"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* Kilometers */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.km}
                  onChange={(e) => handleLengthChange("km", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "km"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* Miles */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={lengthInputValues.miles}
                  onChange={(e) => handleLengthChange("miles", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastLengthKey === "miles"
                      ? "border-cyan-400 ring-cyan-500/30 bg-cyan-950/20"
                      : "border-slate-800 focus:border-cyan-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference Equivalents */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <span>
            💡 <strong>1 Foot</strong> = 0.3048 Meters = 12 Inches = 30.48 cm = 0.333 Yards
          </span>
          <span>
            <strong>1 Meter</strong> = 3.28084 Feet = 39.37 Inches = 100 cm
          </span>
        </div>
      </div>

      {/* 2. AREA CONVERTER TABLE */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden space-y-0">
        {/* Table Title Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold font-mono tracking-wider text-emerald-300 uppercase">
              AREA CONVERTER (വിസ്തീർണ്ണ അളവ് മാറ്റങ്ങൾ)
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="text-slate-500">Quick Presets:</span>
            <button
              onClick={() => handleAreaChange("cents", "1")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition"
            >
              1 Cent
            </button>
            <button
              onClick={() => handleAreaChange("are", "1")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition"
            >
              1 Are
            </button>
            <button
              onClick={() => handleAreaChange("acre", "1")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition"
            >
              1 Acre
            </button>
            <button
              onClick={() => handleAreaChange("sqFeet", "1000")}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition"
            >
              1000 Sq.Ft
            </button>
          </div>
        </div>

        {/* Table Header & Inputs Row */}
        <div className="p-4 sm:p-6 bg-slate-950/60 overflow-x-auto">
          {/* Styled Banner Matching Reference Image */}
          <div className="min-w-[700px] border border-emerald-900/60 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
            {/* Header Columns Header */}
            <div className="grid grid-cols-6 bg-teal-900/80 text-teal-100 font-mono font-bold text-xs uppercase divide-x divide-teal-800/80 text-center py-3 px-1">
              <div className="px-1">Are</div>
              <div className="px-1">Sq. Mtrs</div>
              <div className="px-1">Acre</div>
              <div className="px-1">Sq. Feet</div>
              <div className="px-1">Cents</div>
              <div className="px-1">Hectare</div>
            </div>

            {/* Input Values Row */}
            <div className="grid grid-cols-6 divide-x divide-slate-800 p-3 bg-slate-900/90 items-center">
              {/* Are */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={areaInputValues.are}
                  onChange={(e) => handleAreaChange("are", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastAreaKey === "are"
                      ? "border-emerald-400 ring-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>

              {/* Sq. Mtrs */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={areaInputValues.sqMeters}
                  onChange={(e) => handleAreaChange("sqMeters", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastAreaKey === "sqMeters"
                      ? "border-emerald-400 ring-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>

              {/* Acre */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={areaInputValues.acre}
                  onChange={(e) => handleAreaChange("acre", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastAreaKey === "acre"
                      ? "border-emerald-400 ring-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>

              {/* Sq. Feet */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={areaInputValues.sqFeet}
                  onChange={(e) => handleAreaChange("sqFeet", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastAreaKey === "sqFeet"
                      ? "border-emerald-400 ring-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>

              {/* Cents */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={areaInputValues.cents}
                  onChange={(e) => handleAreaChange("cents", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastAreaKey === "cents"
                      ? "border-emerald-400 ring-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>

              {/* Hectare */}
              <div className="px-1.5">
                <input
                  type="number"
                  step="any"
                  value={areaInputValues.hectare}
                  onChange={(e) => handleAreaChange("hectare", e.target.value)}
                  className={`w-full bg-slate-950 border px-2.5 py-2 rounded-lg text-xs font-mono font-bold text-white text-center focus:outline-none focus:ring-2 transition ${
                    lastAreaKey === "hectare"
                      ? "border-emerald-400 ring-emerald-500/30 bg-emerald-950/20"
                      : "border-slate-800 focus:border-emerald-500"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Reference Equivalents */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
          <span>
            📍 <strong>1 Cent</strong> = 435.6 Sq.Feet = 40.4686 Sq.Meters = 2.47 Cents per Are
          </span>
          <span>
            <strong>1 Are</strong> = 100 Sq.Meters = 2.4707 Cents = 1076.39 Sq.Feet
          </span>
          <span>
            <strong>1 Acre</strong> = 100 Cents = 40.468 Ares = 43,560 Sq.Feet
          </span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Length Summary */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2 font-mono">
            <Ruler className="w-4 h-4" />
            <span>LENGTH CONVERSION SUMMARY</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Feet:</span>
              <span className="text-white font-bold">{lengthInputValues.feet} ft</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Meters:</span>
              <span className="text-white font-bold">{lengthInputValues.meters} m</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Inches:</span>
              <span className="text-white font-bold">{lengthInputValues.inches} in</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Centimeters:</span>
              <span className="text-white font-bold">{lengthInputValues.cm} cm</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Yards:</span>
              <span className="text-white font-bold">{lengthInputValues.yards} yd</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Kilometers:</span>
              <span className="text-white font-bold">{lengthInputValues.km} km</span>
            </div>
          </div>
        </div>

        {/* Area Summary */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2 font-mono">
            <MapPin className="w-4 h-4" />
            <span>AREA CONVERSION SUMMARY</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Are:</span>
              <span className="text-white font-bold">{areaInputValues.are} Are</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Sq. Meters:</span>
              <span className="text-white font-bold">{areaInputValues.sqMeters} m²</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Acre:</span>
              <span className="text-white font-bold">{areaInputValues.acre} Acre</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Sq. Feet:</span>
              <span className="text-white font-bold">{areaInputValues.sqFeet} sq.ft</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Cents:</span>
              <span className="text-white font-bold">{areaInputValues.cents} Cent</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between">
              <span className="text-slate-400">Hectare:</span>
              <span className="text-white font-bold">{areaInputValues.hectare} Ha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
