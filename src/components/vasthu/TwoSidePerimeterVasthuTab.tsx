import React, { useState } from "react";
import {
  findExactThachuRow,
  getClosestThachuRows,
  getClosestUtthamamRows,
  lookupOrCalculateRow,
  THACHU_DATA,
} from "../../data/thachuShastraData";
import {
  Ruler,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Info,
  Maximize2,
  Box,
  Compass,
  ArrowRightLeft,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { triggerPrint } from "../../utils/printHelper";

type UnitType = "kol_viral" | "meter" | "cm";

export const TwoSidePerimeterVasthuTab: React.FC = () => {
  // Unit mode selection for Side 1 & Side 2
  const [unitSide1, setUnitSide1] = useState<UnitType>("kol_viral");
  const [unitSide2, setUnitSide2] = useState<UnitType>("kol_viral");

  // Side 1 Inputs
  const [s1KolStr, setS1KolStr] = useState<string>("5");
  const [s1ViralStr, setS1ViralStr] = useState<string>("0");
  const [s1MeterStr, setS1MeterStr] = useState<string>("3.6");
  const [s1CmStr, setS1CmStr] = useState<string>("360");

  // Side 2 Inputs
  const [s2KolStr, setS2KolStr] = useState<string>("4");
  const [s2ViralStr, setS2ViralStr] = useState<string>("0");
  const [s2MeterStr, setS2MeterStr] = useState<string>("2.88");
  const [s2CmStr, setS2CmStr] = useState<string>("288");

  const [copied, setCopied] = useState<boolean>(false);

  // Helper to convert input to virals for Side 1
  const getSide1Virals = (): number => {
    if (unitSide1 === "kol_viral") {
      const k = Math.max(0, parseInt(s1KolStr) || 0);
      const v = Math.max(0, parseInt(s1ViralStr) || 0);
      return k * 24 + v;
    } else if (unitSide1 === "meter") {
      const m = Math.max(0, parseFloat(s1MeterStr) || 0);
      return Math.round((m * 100) / 3);
    } else {
      const cm = Math.max(0, parseFloat(s1CmStr) || 0);
      return Math.round(cm / 3);
    }
  };

  // Helper to convert input to virals for Side 2
  const getSide2Virals = (): number => {
    if (unitSide2 === "kol_viral") {
      const k = Math.max(0, parseInt(s2KolStr) || 0);
      const v = Math.max(0, parseInt(s2ViralStr) || 0);
      return k * 24 + v;
    } else if (unitSide2 === "meter") {
      const m = Math.max(0, parseFloat(s2MeterStr) || 0);
      return Math.round((m * 100) / 3);
    } else {
      const cm = Math.max(0, parseFloat(s2CmStr) || 0);
      return Math.round(cm / 3);
    }
  };

  const side1Virals = getSide1Virals();
  const side2Virals = getSide2Virals();

  // Side 1 Representations
  const s1Kol = Math.floor(side1Virals / 24);
  const s1Viral = side1Virals % 24;
  const s1Cm = side1Virals * 3;
  const s1Meters = s1Cm / 100;

  // Side 2 Representations
  const s2Kol = Math.floor(side2Virals / 24);
  const s2Viral = side2Virals % 24;
  const s2Cm = side2Virals * 3;
  const s2Meters = s2Cm / 100;

  // Perimeter Calculation: 2 * (Side 1 + Side 2)
  const totalPerimeterVirals = 2 * (side1Virals + side2Virals);
  const perimeterKol = Math.floor(totalPerimeterVirals / 24);
  const perimeterViral = totalPerimeterVirals % 24;
  const perimeterCm = totalPerimeterVirals * 3;
  const perimeterMeters = perimeterCm / 100;

  // Vasthu lookup and Pattika verification for calculated Perimeter
  const exactPattikaRow = findExactThachuRow(perimeterKol, perimeterViral);
  const isPresentInPattika = exactPattikaRow !== null;
  const vasthuResult = exactPattikaRow || lookupOrCalculateRow(perimeterKol, perimeterViral);
  const closestPattikaEntries = getClosestThachuRows(perimeterKol, perimeterViral, 4);

  // Synchronize unit changes
  const handleUnitSide1Change = (newUnit: UnitType) => {
    setUnitSide1(newUnit);
    if (newUnit === "kol_viral") {
      setS1KolStr(String(s1Kol));
      setS1ViralStr(String(s1Viral));
    } else if (newUnit === "meter") {
      setS1MeterStr(String(s1Meters.toFixed(2)));
    } else if (newUnit === "cm") {
      setS1CmStr(String(s1Cm));
    }
  };

  const handleUnitSide2Change = (newUnit: UnitType) => {
    setUnitSide2(newUnit);
    if (newUnit === "kol_viral") {
      setS2KolStr(String(s2Kol));
      setS2ViralStr(String(s2Viral));
    } else if (newUnit === "meter") {
      setS2MeterStr(String(s2Meters.toFixed(2)));
    } else if (newUnit === "cm") {
      setS2CmStr(String(s2Cm));
    }
  };

  // Nearby Utthamam (Auspicious) perimeters suggestions
  const nearbyUtthamam = THACHU_DATA.filter(
    (r) =>
      r.phalam === "ഉത്തമം" &&
      Math.abs(r.kol * 24 + r.viral - totalPerimeterVirals) <= 120
  ).slice(0, 4);

  const handleCopySummary = () => {
    const summary = `ഇരുവശ ചുറ്റളവ് വാസ്തു റിപ്പോർട്ട് (2-Side Vastu Perimeter Report):
വശം 1 (Side 1): ${s1Kol} കോൽ ${s1Viral} വിരൽ (${s1Meters.toFixed(2)}m / ${s1Cm} cm)
വശം 2 (Side 2): ${s2Kol} കോൽ ${s2Viral} വിരൽ (${s2Meters.toFixed(2)}m / ${s2Cm} cm)
ആകെ ചുറ്റ് (Total Perimeter): 2 × (${s1Kol}കോൽ ${s1Viral}വി + ${s2Kol}കോൽ ${s2Viral}വി) = ${perimeterKol} കോൽ ${perimeterViral} വിരൽ (${perimeterCm} cm / ${perimeterMeters.toFixed(2)}m)

വാസ്തു വിവരണം (Ayadi Shadbarga):
ഫലം: ${vasthuResult.phalam}
യോനി: ${vasthuResult.yoniName}
വ്യയം: ${vasthuResult.vayam}
ആയം: ${vasthuResult.aayamKol} കോൽ ${vasthuResult.aayamViral} വിരൽ
നക്ഷത്രം: ${vasthuResult.nakshatram}
വയസ്സ്: ${vasthuResult.vayassu}
തിഥി: ${vasthuResult.pakshamTithi}
കരണo: ${vasthuResult.karanam}
ആഴ്ച: ${vasthuResult.azhchaFullName}
മൂലരേഖ പേജ്: ${vasthuResult.page}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    triggerPrint("Vasthusilpy_TwoSide_Perimeter_Vastu_Report");
  };

  // Quick preset sizes
  const applyPresetBothSides = (k1: number, v1: number, k2: number, v2: number) => {
    setUnitSide1("kol_viral");
    setUnitSide2("kol_viral");
    setS1KolStr(String(k1));
    setS1ViralStr(String(v1));
    setS2KolStr(String(k2));
    setS2ViralStr(String(v2));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden bg-blueprint-grid">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-full border border-cyan-800 uppercase flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                VASTHU PERIMETER CALCULATOR
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800 font-bold">
                2 SIDES • (കോൽ, വിരൽ, മീറ്റർ, cm)
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Compass className="w-7 h-7 text-cyan-400" />
              <span>ചുറ്റളവ് (TOTAL PERIMETER)</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              കെട്ടിടത്തിന്റെയോ മുറിയുടെയോ രണ്ടു വശങ്ങളുടെ അളവുകൾ (നീളവും വീതിയും) കോൽ, വിരൽ, മീറ്റർ അല്ലെങ്കിൽ സെന്റീമീറ്ററിൽ നൽകി ആകെ ചുറ്റളവും അതിൻ്റെ ആയാദി ഷഡ്വർഗ്ഗ വാസ്തു ഫലങ്ങളും കണ്ടെത്തുക.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800 px-4 py-2.5 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? "കോപ്പി ചെയ്തു!" : "റിപ്പോർട്ട് കോപ്പി"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2.5 rounded-2xl font-mono text-xs font-black transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>പ്രിന്റ്</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formula Reference Card (User's Reference Image Specification) */}
      <div className="bg-cyan-950/40 border border-cyan-800/80 rounded-2xl p-4 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs font-mono uppercase">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>വാസ്തു ചുറ്റളവ് സൂത്രവാക്യം & മാനദണ്ഡം (FORMULA REFERENCE)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200 font-sans leading-relaxed">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-900/60 space-y-1">
            <p className="font-bold text-cyan-200">
              • <span className="text-cyan-400 font-mono font-bold">ചുറ്റ് (Perimeter):</span> കെട്ടിടത്തിന്റെയോ മുറിയുടെയോ ആകെ വശങ്ങളുടെ തുക.
            </p>
            <p className="font-mono text-emerald-300 text-[11px] font-black bg-slate-900 p-1.5 rounded border border-slate-800">
              ചുറ്റ് = 2 × (വശം 1 + വശം 2) = (കോൽ × 24 + വിരൽ) × 3 cm.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-cyan-900/60 space-y-1 font-mono text-[11px]">
            <p className="text-slate-300 font-bold">• യൂണിറ്റ് പരിവർത്തന മാനദണ്ഡങ്ങൾ (Unit Standard):</p>
            <div className="text-emerald-400 font-bold grid grid-cols-2 gap-1 pt-0.5">
              <span>1 കോൽ = 24 വിരൽ = 72 cm</span>
              <span>1 വിരൽ = 3 cm = 0.03 m</span>
              <span>1 മീറ്റർ = 33.33 വിരൽ</span>
              <span>1 അടി (ft) = 10.16 വിരൽ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Input & Calculation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: 2-Side Measurements Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-slate-200 uppercase flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-cyan-400" />
                <span>അളവുകൾ നൽകുക (2 SIDES INPUT)</span>
              </span>
              <button
                onClick={() => applyPresetBothSides(5, 0, 4, 0)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>റീസെറ്റ്</span>
              </button>
            </h3>

            {/* SIDE 1 INPUT CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <span>വശം 1 / നീളം (SIDE 1 - LENGTH)</span>
                </label>
                {/* Unit Switcher Side 1 */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleUnitSide1Change("kol_viral")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      unitSide1 === "kol_viral" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    കോൽ/വിരൽ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSide1Change("meter")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      unitSide1 === "meter" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    മീറ്റർ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSide1Change("cm")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      unitSide1 === "cm" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    cm
                  </button>
                </div>
              </div>

              {/* Side 1 Input Fields */}
              {unitSide1 === "kol_viral" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">കോൽ (Kol)</span>
                    <input
                      type="number"
                      min="0"
                      value={s1KolStr}
                      onChange={(e) => setS1KolStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">വിരൽ (Viral)</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={s1ViralStr}
                      onChange={(e) => setS1ViralStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ) : unitSide1 === "meter" ? (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">മീറ്റർ (Meters)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={s1MeterStr}
                    onChange={(e) => setS1MeterStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">സെന്റീമീറ്റർ (Centimeters)</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={s1CmStr}
                    onChange={(e) => setS1CmStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Side 1 Summary Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
                  {s1Kol} കോൽ {s1Viral} വി
                </span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                  {s1Meters.toFixed(2)} m
                </span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                  {s1Cm} cm
                </span>
              </div>
            </div>

            {/* SIDE 2 INPUT CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <span>വശം 2 / വീതി (SIDE 2 - WIDTH)</span>
                </label>
                {/* Unit Switcher Side 2 */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleUnitSide2Change("kol_viral")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      unitSide2 === "kol_viral" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    കോൽ/വിരൽ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSide2Change("meter")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      unitSide2 === "meter" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    മീറ്റർ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitSide2Change("cm")}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      unitSide2 === "cm" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    cm
                  </button>
                </div>
              </div>

              {/* Side 2 Input Fields */}
              {unitSide2 === "kol_viral" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">കോൽ (Kol)</span>
                    <input
                      type="number"
                      min="0"
                      value={s2KolStr}
                      onChange={(e) => setS2KolStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">വിരൽ (Viral)</span>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={s2ViralStr}
                      onChange={(e) => setS2ViralStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              ) : unitSide2 === "meter" ? (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">മീറ്റർ (Meters)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={s2MeterStr}
                    onChange={(e) => setS2MeterStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ) : (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">സെന്റീമീറ്റർ (Centimeters)</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={s2CmStr}
                    onChange={(e) => setS2CmStr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm font-mono text-white font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Side 2 Summary Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-300">
                  {s2Kol} കോൽ {s2Viral} വി
                </span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
                  {s2Meters.toFixed(2)} m
                </span>
                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                  {s2Cm} cm
                </span>
              </div>
            </div>

            {/* Quick Presets Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono font-bold text-slate-400 block uppercase">
                സാധാരണ മുറി നിർമ്മിതികൾ (PRESETS)
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => applyPresetBothSides(5, 0, 4, 0)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold text-cyan-300">5k x 4k Room</span>
                  <span className="text-[10px] text-slate-500">Chuttu: 18 Kol</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetBothSides(6, 8, 5, 16)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold text-cyan-300">6k 8v x 5k 16v</span>
                  <span className="text-[10px] text-slate-500">Chuttu: 24 Kol</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetBothSides(8, 0, 6, 0)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold text-cyan-300">8k x 6k Building</span>
                  <span className="text-[10px] text-slate-500">Chuttu: 28 Kol</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetBothSides(10, 12, 8, 6)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white text-left transition-all cursor-pointer"
                >
                  <span className="block font-bold text-cyan-300">10k 12v x 8k 6v</span>
                  <span className="text-[10px] text-slate-500">Chuttu: 37 Kol 12v</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Calculation Output & Vasthu Analysis (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* CALCULATED PERIMETER HIGHLIGHT CARD */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase block">
                    കണക്കാക്കിയ ആകെ ചുറ്റളവ് (CALCULATED TOTAL PERIMETER)
                  </span>
                  {isPresentInPattika ? (
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                      തച്ചു ശാസ്ത്രം പട്ടിക പേജ് #{vasthuResult.page} • റോ #{vasthuResult.id}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 font-bold">
                      NOT IN PATTIKA
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 mt-1">
                  <h3 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">
                    {perimeterKol} <span className="text-sm font-sans font-normal text-cyan-300">കോൽ</span>{" "}
                    {perimeterViral} <span className="text-sm font-sans font-normal text-cyan-300">വിരൽ</span>
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800 font-bold">
                    = {perimeterCm} cm ({perimeterMeters.toFixed(2)} m)
                  </span>
                </div>
              </div>

              {/* Phalam Badge */}
              <div
                className={`w-[150px] h-[50px] px-3 py-1.5 rounded-2xl border flex items-center justify-center gap-1.5 font-mono font-black shadow-lg shrink-0 ${
                  vasthuResult.phalam === "ഉത്തമം"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-emerald-500/20"
                    : vasthuResult.phalam === "മധ്യമം"
                    ? "bg-amber-950 text-amber-300 border-amber-500 shadow-amber-500/20"
                    : "bg-red-950 text-red-300 border-red-500 shadow-red-500/20"
                }`}
              >
                {vasthuResult.phalam === "ഉത്തമം" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div className="flex flex-col text-left leading-none">
                  <span className="text-sm font-sans font-bold">{vasthuResult.phalam}</span>
                  <span className="text-[8px] opacity-80 uppercase tracking-tighter">VASTU RESULT</span>
                </div>
              </div>
            </div>

            {/* Validation Banner if Not Present in Thachu Shasthram Pattika */}
            {!isPresentInPattika && (
              <div className="bg-amber-950/80 border border-amber-700/80 p-4 rounded-2xl text-amber-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-amber-300 text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>ഈ ചുറ്റളവ് &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിൽ ഉൾപ്പെട്ടിട്ടില്ല</span>
                </div>
                <p className="text-xs text-amber-200/90 font-sans leading-relaxed">
                  കണക്കാക്കിയ ചുറ്റ് <strong className="text-white">{perimeterKol} കോൽ {perimeterViral} വിരൽ ({perimeterCm} cm)</strong> 17-പേജുള്ള &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിലെ നേരിട്ടുള്ള മൂലരേഖാ അളവുകളിൽ ഉൾപ്പെട്ടിട്ടുള്ളതല്ല (THE ENTRY IS NOT PRESENT IN &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;).
                </p>
                <div className="pt-2 border-t border-amber-800/60">
                  <span className="text-[11px] text-slate-400 block mb-1.5 font-mono">പട്ടികയിലെ ഏറ്റവും അടുത്ത ചുറ്റളവുകൾ:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                    {closestPattikaEntries.map((row) => (
                      <div
                        key={row.id}
                        className="bg-slate-950/80 border border-amber-800/60 p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="text-white font-bold block">{row.kol} കോൽ {row.viral} വിരൽ</span>
                          <span className="text-[10px] text-slate-400">{row.chuttuCm} cm (Pg #{row.page})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.phalam === "ഉത്തമം" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-900 text-slate-400"
                        }`}>
                          {row.phalam}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2D Floor Plan SVG Blueprint */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative bg-blueprint-grid">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold self-start">
                2D വശങ്ങളുടെയും ചുറ്റിൻ്റെയും മാതൃക (ROOM / BUILDING BLUEPRINT)
              </span>

              <div className="w-full max-w-md py-2 flex items-center justify-center">
                <svg viewBox="0 0 320 200" className="w-full h-auto max-h-48 drop-shadow-xl">
                  {/* Outer Wall Rect */}
                  <rect
                    x="50"
                    y="30"
                    width="220"
                    height="130"
                    fill="#0f172a"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    rx="8"
                  />
                  {/* Inner Hatch */}
                  <rect
                    x="58"
                    y="38"
                    width="204"
                    height="114"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    rx="4"
                  />

                  {/* Side 1 Label (Top) */}
                  <text
                    x="160"
                    y="22"
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    വശം 1 (Side 1): {s1Kol}കോൽ {s1Viral}വി ({s1Meters.toFixed(2)}m)
                  </text>

                  {/* Side 2 Label (Right) */}
                  <text
                    x="280"
                    y="100"
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="start"
                  >
                    വശം 2: {s2Kol}ക {s2Viral}വി
                  </text>

                  {/* Center Total Perimeter Text */}
                  <g transform="translate(160, 95)">
                    <rect
                      x="-85"
                      y="-20"
                      width="170"
                      height="40"
                      fill="#020617"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      rx="10"
                    />
                    <text
                      x="0"
                      y="-3"
                      fill="#10b981"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      ആകെ ചുറ്റ് (Perimeter)
                    </text>
                    <text
                      x="0"
                      y="13"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {perimeterKol} കോൽ {perimeterViral} വിരൽ
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* AYADI SHADBARGA DETAILED RESULTS GRID */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ആയാദി ഷഡ്വർഗ്ഗ കണക്കുകൾ (AYADI SHADBARGA ANALYSIS)</span>
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">യോനി (YONI)</span>
                  <span className="text-sm font-bold text-cyan-300 font-sans block">
                    {vasthuResult.yoniName}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">ആയം (INCOME)</span>
                  <span className="text-sm font-bold text-emerald-400 block">
                    {vasthuResult.aayamKol} ക {vasthuResult.aayamViral} വി ({vasthuResult.aayamCm} cm)
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">വ്യയം (EXPENSE)</span>
                  <span className="text-sm font-bold text-amber-400 block">
                    {vasthuResult.vayam}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">നക്ഷത്രം (STAR)</span>
                  <span className="text-sm font-bold text-white font-sans block">
                    {vasthuResult.nakshatram} ({vasthuResult.nakshatramNazhika} നാ)
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">വയസ്സ് (AGE)</span>
                  <span className="text-sm font-bold text-purple-300 font-sans block">
                    {vasthuResult.vayassu}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">തിഥി (TITHI)</span>
                  <span className="text-sm font-bold text-slate-200 font-sans block">
                    {vasthuResult.pakshamTithi}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">ആഴ്ച (DAY / PLANET)</span>
                  <span className="text-sm font-bold text-cyan-200 font-sans block truncate">
                    {vasthuResult.azhchaFullName}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block">ഗ്രന്ഥ പേജ് (PAGE)</span>
                  <span className="text-sm font-bold text-emerald-400 block">
                    PAGE {vasthuResult.page}
                  </span>
                </div>
              </div>
            </div>

            {/* NEARBY UTTHAMAM ALTERNATIVES */}
            {vasthuResult.phalam !== "ഉത്തമം" && nearbyUtthamam.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>സമീപത്തെ ഉത്തമം (AUSPICIOUS) ചുറ്റളവുകൾ</span>
                </span>
                <p className="text-[11px] text-slate-400">
                  നിലവിലെ ചുറ്റളവ് {vasthuResult.phalam} ആയതിനാൽ, ഏതെങ്കിലും ഒരു വശത്തിൽ ചെറുതായ വ്യത്യാസം വരുത്തി താഴെ പറയുന്ന ഉത്തമ ചുറ്റളവിലെത്താം:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {nearbyUtthamam.map((ut) => {
                    const diffVirals = (ut.kol * 24 + ut.viral) - totalPerimeterVirals;
                    const diffMeters = (diffVirals * 3) / 100;
                    return (
                      <div
                        key={ut.id}
                        className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/70 flex items-center justify-between text-slate-200"
                      >
                        <div>
                          <span className="font-bold text-emerald-300 block">
                            {ut.kol} കോൽ {ut.viral} വിരൽ
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Yoni: {ut.yoniName.split(" ")[0]} • {ut.nakshatram}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-amber-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {diffVirals > 0 ? `+${diffVirals}വി (${diffMeters.toFixed(2)}m)` : `${diffVirals}വി (${diffMeters.toFixed(2)}m)`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
