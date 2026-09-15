import React, { useState } from "react";
import { ThachuRow } from "../types";
import {
  findExactThachuRow,
  getClosestThachuRows,
  getClosestUtthamamRows,
  THACHU_DATA,
} from "../data/thachuShastraData";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Ruler,
  Info,
  Layers,
  Calculator,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Bot,
} from "lucide-react";
import { triggerPrint } from "../utils/printHelper";

interface CalculatorTabProps {
  onSelectRowInTable: (row: ThachuRow) => void;
  onOpenAIAgent?: () => void;
}

type UnitMode = "kol_viral" | "cm" | "meter";

export const CalculatorTab: React.FC<CalculatorTabProps> = ({ onSelectRowInTable, onOpenAIAgent }) => {
  const [unitMode, setUnitMode] = useState<UnitMode>("kol_viral");

  // String states for direct enter-type input
  const [kolStr, setKolStr] = useState<string>("5");
  const [viralStr, setViralStr] = useState<string>("0");
  const [cmStr, setCmStr] = useState<string>("360");
  const [meterStr, setMeterStr] = useState<string>("3.6");

  const [copied, setCopied] = useState<boolean>(false);

  // Determine active Kol & Viral based on unit mode
  let activeKol = 5;
  let activeViral = 0;

  if (unitMode === "kol_viral") {
    activeKol = Math.max(1, parseInt(kolStr) || 0);
    activeViral = Math.max(0, parseInt(viralStr) || 0);
  } else if (unitMode === "cm") {
    const cmVal = Math.max(0, parseFloat(cmStr) || 0);
    const totalViral = Math.round(cmVal / 3);
    activeKol = Math.floor(totalViral / 24);
    activeViral = totalViral % 24;
  } else if (unitMode === "meter") {
    const mVal = Math.max(0, parseFloat(meterStr) || 0);
    const cmVal = mVal * 100;
    const totalViral = Math.round(cmVal / 3);
    activeKol = Math.floor(totalViral / 24);
    activeViral = totalViral % 24;
  }

  // Exact look up in Authentic Thachu Shasthram Pattika (17 Pages / 408 Rows)
  const exactRow = findExactThachuRow(activeKol, activeViral);
  const isPresentInPattika = exactRow !== null;

  // Closest valid entries in the authentic table
  const closestPattikaEntries = getClosestThachuRows(activeKol, activeViral, 4);
  const nearbyUtthamam = getClosestUtthamamRows(activeKol, activeViral, 4);

  const activeTotalVirals = activeKol * 24 + activeViral;
  const activeCm = activeTotalVirals * 3;
  const activeMeters = activeCm / 100;
  const activeTotalInches = activeCm / 2.54;
  const activeFeet = Math.floor(activeTotalInches / 12);
  const activeInches = Math.round(activeTotalInches % 12);

  // Synchronize inputs when unit mode changes
  const handleUnitModeChange = (mode: UnitMode) => {
    setUnitMode(mode);
    if (mode === "kol_viral") {
      setKolStr(String(activeKol));
      setViralStr(String(activeViral));
    } else if (mode === "cm") {
      setCmStr(String(activeCm));
    } else if (mode === "meter") {
      setMeterStr(String(activeMeters.toFixed(2)));
    }
  };

  // Preset / Suggestion Selection
  const applyPreset = (kol: number, viral: number) => {
    const totalViral = kol * 24 + viral;
    const cm = totalViral * 3;
    const meters = cm / 100;

    setKolStr(String(kol));
    setViralStr(String(viral));
    setCmStr(String(cm));
    setMeterStr(String(meters.toFixed(2)));
  };

  const handleCopySummary = () => {
    if (!exactRow) {
      const summary = `തച്ചു ശാസ്ത്രം പരിശോധന (Thachu Shasthram Verification):
അളവ്: ${activeKol} കോൽ ${activeViral} വിരൽ (${activeCm} cm / ${activeMeters.toFixed(2)} m)
ഫലം: ഈ അളവ് "തച്ചു ശാസ്ത്രം പട്ടിക"യിൽ ലഭ്യമല്ല (ENTRY IS NOT PRESENT IN THACHU SHASTHRAM PATTIKA).
അടുത്ത സാധുവായ അളവ്: ${closestPattikaEntries[0]?.kol} കോൽ ${closestPattikaEntries[0]?.viral} വിരൽ (${closestPattikaEntries[0]?.chuttuCm} cm)`;
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const summary = `തച്ചു ശാസ്ത്രം കണക്കു വിവരങ്ങൾ (Technical Vastu Measurement):
കോൽ: ${exactRow.kol}, വിരൽ: ${exactRow.viral}
ചുറ്റ്: ${exactRow.chuttuCm} cm (${exactRow.chuttuMeters.toFixed(2)}m / ${exactRow.chuttuFeetInches})
യോനി: ${exactRow.yoniName}
വ്യയം: ${exactRow.vayam}
ആയം: ${exactRow.aayamKol} കോൽ ${exactRow.aayamViral} വിരൽ (${exactRow.aayamCm} cm)
നക്ഷത്രം: ${exactRow.nakshatram} (${exactRow.nakshatramNazhika} നാഴിക)
വയസ്സ്: ${exactRow.vayassu}
തിഥി: ${exactRow.pakshamTithi} (${exactRow.tithiNazhika} നാഴിക)
കരണo: ${exactRow.karanam}
ആഴ്ച: ${exactRow.azhchaFullName}
ഗുണ ദോഷ ഫലം: ${exactRow.phalam}
(തച്ചു ശാസ്ത്രം പട്ടിക പേജ്: ${exactRow.page}, റോ: #${exactRow.id})`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    triggerPrint("Vasthusilpy_Vasthu_Chuttu_Report");
  };

  const presetMeasurements = [
    { label: "5 കോൽ 0 വിരൽ (360 cm)", kol: 5, viral: 0 },
    { label: "8 കോൽ 8 വിരൽ (600 cm)", kol: 8, viral: 8 },
    { label: "15 കോൽ 0 വിരൽ (1080 cm)", kol: 15, viral: 0 },
    { label: "16 കോൽ 8 വിരൽ (1176 cm)", kol: 16, viral: 8 },
    { label: "20 കോൽ 8 വിരൽ (1464 cm)", kol: 20, viral: 8 },
    { label: "27 കോൽ 0 വിരൽ (1944 cm)", kol: 27, viral: 0 },
    { label: "33 കോൽ 0 വിരൽ (2376 cm)", kol: 33, viral: 0 },
    { label: "47 കോൽ 0 വിരൽ (3384 cm)", kol: 47, viral: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Input Panel - Corporate Tech Blueprint */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm bg-blueprint-grid">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                DIRECT ENTRY INPUT PANEL
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                തച്ചു ശാസ്ത്രം പട്ടിക പരിശോധന
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 font-sans">
              <Ruler className="w-5 h-5 text-cyan-400" />
              <span>അളവ് ഇൻപുട്ട് (Measurement Calculator)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              നൽകുന്ന അളവ് 17-പേജ് &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിലെ (408 കൃത്യമായ കണക്കുകൾ) അംഗീകൃത അളവാണോ എന്ന് പരിശോധിച്ച് ഫലങ്ങൾ ലഭ്യമാക്കുന്നു.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {onOpenAIAgent && (
              <button
                type="button"
                onClick={onOpenAIAgent}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 transition cursor-pointer"
                title="Consult AI Vasthu Agent"
              >
                <Bot className="w-4 h-4" />
                <span>AI VASTHU AGENT</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-950/40 text-[9px] text-white">AI</span>
              </button>
            )}
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold transition cursor-pointer"
              title="Copy row summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? "COPIED" : "COPY DATA"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold transition cursor-pointer"
              title="Print blueprint"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>PRINT</span>
            </button>
          </div>
        </div>

        {/* Unit Selector Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs font-mono font-bold text-slate-400 mr-2 uppercase tracking-wider">
              SELECT INPUT UNIT:
            </span>
            <button
              type="button"
              onClick={() => handleUnitModeChange("kol_viral")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border flex items-center gap-2 ${
                unitMode === "kol_viral"
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>കോൽ & വിരൽ (Kol & Viral)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUnitModeChange("cm")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border flex items-center gap-2 ${
                unitMode === "cm"
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>സെന്റിമീറ്റർ (Centimeter - cm)</span>
            </button>

            <button
              type="button"
              onClick={() => handleUnitModeChange("meter")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border flex items-center gap-2 ${
                unitMode === "meter"
                  ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800"
              }`}
            >
              <Ruler className="w-4 h-4" />
              <span>മീറ്റർ (Meter - m)</span>
            </button>
          </div>

          {/* Form Controls - Enter Type Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {/* 1. Kol & Viral Enter Type Mode */}
            {unitMode === "kol_viral" && (
              <>
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                    <span>കോൽ (KOL)</span>
                    <span className="text-cyan-400">ENTER VALUE</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={kolStr}
                      onChange={(e) => setKolStr(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xl font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="e.g. 5"
                    />
                    <span className="absolute right-3 top-3.5 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded border border-cyan-800">
                      KOL
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-1">
                    1 Kol = 24 Viral = 72 cm
                  </div>
                </div>

                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                    <span>വിരൽ (VIRAL)</span>
                    <span className="text-cyan-400">ENTER VALUE</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={viralStr}
                      onChange={(e) => setViralStr(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xl font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                      placeholder="e.g. 0"
                    />
                    <span className="absolute right-3 top-3.5 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded border border-cyan-800">
                      VIRAL
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 pt-1">
                    1 Viral = 3 cm (പട്ടിക അളവുകൾ: 0, 8, 16 വിരൽ)
                  </div>
                </div>
              </>
            )}

            {/* 2. Centimeter (cm) Enter Type Mode */}
            {unitMode === "cm" && (
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 col-span-1 md:col-span-2">
                <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>സെന്റിമീറ്റർ (PERIMETER / CHUTTU IN CM)</span>
                  <span className="text-cyan-400">ENTER VALUE IN CM</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    step="1"
                    value={cmStr}
                    onChange={(e) => setCmStr(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xl font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="e.g. 360"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded border border-cyan-800">
                    CM
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 p-2 rounded-lg border border-cyan-900">
                  <span>EQUIVALENT VASTU MEASUREMENT:</span>
                  <strong className="text-white">
                    {activeKol} കോൽ {activeViral} വിരൽ
                  </strong>
                  <span>({activeMeters.toFixed(2)} m)</span>
                </div>
              </div>
            )}

            {/* 3. Meter (m) Enter Type Mode */}
            {unitMode === "meter" && (
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 col-span-1 md:col-span-2">
                <label className="block text-xs font-mono font-bold text-slate-300 flex items-center justify-between">
                  <span>മീറ്റർ (PERIMETER / CHUTTU IN METERS)</span>
                  <span className="text-cyan-400">ENTER VALUE IN METERS</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={meterStr}
                    onChange={(e) => setMeterStr(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xl font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                    placeholder="e.g. 3.60"
                  />
                  <span className="absolute right-3 top-3.5 text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded border border-cyan-800">
                    METERS
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 p-2 rounded-lg border border-cyan-900">
                  <span>EQUIVALENT VASTU MEASUREMENT:</span>
                  <strong className="text-white">
                    {activeCm} cm = {activeKol} കോൽ {activeViral} വിരൽ
                  </strong>
                </div>
              </div>
            )}

            {/* Presets Column */}
            <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>തച്ചു ശാസ്ത്രം പട്ടിക ഉദാഹരണങ്ങൾ</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {presetMeasurements.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p.kol, p.viral)}
                    className={`px-2 py-1.5 rounded text-[11px] font-mono truncate transition cursor-pointer border text-left ${
                      activeKol === p.kol && activeViral === p.viral
                        ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold"
                        : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONDITIONAL OUTPUT: EXACT PATTIKA ENTRY vs NOT PRESENT IN PATTIKA */}
      {!isPresentInPattika ? (
        /* ===================== NOT PRESENT IN THACHU SHASTHRAM PATTIKA ===================== */
        <div className="rounded-2xl border-2 border-amber-500/80 bg-slate-900 shadow-2xl shadow-amber-950/30 overflow-hidden">
          {/* Header Bar */}
          <div className="px-6 py-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-b border-amber-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/50 shrink-0">
                <ShieldAlert className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  VALIDATION RESULT • തച്ചു ശാസ്ത്രം പട്ടിക പരിശോധന
                </div>
                <h3 className="text-xl md:text-2xl font-black font-sans tracking-wide text-amber-300 mt-0.5">
                  ഈ അളവ് &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിൽ ഉൾപ്പെട്ടിട്ടില്ല
                </h3>
                <div className="text-xs font-mono text-amber-200/80 mt-0.5 font-semibold">
                  ENTRY IS NOT PRESENT IN &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;
                </div>
              </div>
            </div>

            <div className="px-4 py-2 bg-amber-950/80 border border-amber-800 rounded-xl text-xs font-mono text-amber-300">
              നൽകിയ അളവ്: <strong>{activeKol} കോൽ {activeViral} വിരൽ ({activeCm} cm)</strong>
            </div>
          </div>

          {/* Body with Explanation and Authentic Alternatives */}
          <div className="p-6 space-y-6">
            <div className="bg-slate-950/90 border border-amber-900/60 p-4 rounded-xl text-slate-300 text-sm space-y-2">
              <p className="font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>അറിയിപ്പ് (Measurement Notice):</span>
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                നിങ്ങൾ നൽകിയ <strong className="text-white">{activeKol} കോൽ {activeViral} വിരൽ ({activeCm} cm / {activeMeters.toFixed(2)} m)</strong> എന്ന അളവ് 17-പേജുള്ള ആധികാരിക <strong>&quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;</strong>യിലെ 408 പ്രധാന മൂലരേഖാ അളവുകളിൽ ഉൾപ്പെട്ടിട്ടുള്ളതല്ല. തച്ചു ശാസ്ത്ര വിധിപ്രകാരം യോനി, ആയം, വ്യയം തുടങ്ങിയ ഗണനങ്ങൾ സാധുവായ പട്ടിക അളവുകൾക്ക് മാത്രമേ നിർദ്ദേശിക്കപ്പെട്ടിട്ടുള്ളൂ.
              </p>
            </div>

            {/* Recommended Closest Authentic Table Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>&quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിലെ ഏറ്റവും അടുത്ത സാധുവായ അളവുകൾ (Nearest Valid Pattika Entries):</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {closestPattikaEntries.map((row) => (
                  <div
                    key={row.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-cyan-500/60 transition flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                          പേജ് #{row.page} • റോ #{row.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            row.phalam === "ഉത്തമം"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : row.phalam === "മധ്യമം"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                              : "bg-rose-950 text-rose-300 border border-rose-800"
                          }`}
                        >
                          {row.phalam}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white font-mono mt-2">
                        {row.kol} കോൽ {row.viral} വിരൽ
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {row.chuttuCm} cm ({row.chuttuMeters.toFixed(2)} m / {row.chuttuFeetInches})
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-sans">
                        യോനി: {row.yoniName.split("-")[0]} | നക്ഷത്രം: {row.nakshatram} | ആയം: {row.aayamKol} കോൽ {row.aayamViral} വി
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => applyPreset(row.kol, row.viral)}
                      className="w-full mt-2 py-2 px-3 bg-cyan-950/80 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>ഈ പട്ടിക അളവ് തിരഞ്ഞെടുക്കുക</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Auspicious (Utthamam) Alternatives */}
            {nearbyUtthamam.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>പട്ടികയിലെ തൊട്ടടുത്ത ഉത്തമ (AUSPICIOUS) അളവുകൾ:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {nearbyUtthamam.map((alt) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => applyPreset(alt.kol, alt.viral)}
                      className="bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-slate-200 p-3 rounded-xl text-xs font-mono font-bold flex flex-col justify-between gap-1 transition cursor-pointer text-left"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-emerald-400 font-bold">
                          {alt.kol} കോൽ {alt.viral} വി
                        </span>
                        <span className="bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-black">
                          ഉത്തമം
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {alt.chuttuCm} cm (Pg #{alt.page})
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===================== EXACT ENTRY PRESENT IN PATTIKA ===================== */
        <div
          className={`rounded-2xl border-2 shadow-2xl transition-all overflow-hidden bg-slate-900 ${
            exactRow.phalam === "ഉത്തമം"
              ? "border-emerald-500/80 shadow-emerald-950/20"
              : exactRow.phalam === "മധ്യമം"
              ? "border-cyan-500/80 shadow-cyan-950/20"
              : "border-rose-500/80 shadow-rose-950/20"
          }`}
        >
          {/* Phalam Status Header */}
          <div
            className={`px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b ${
              exactRow.phalam === "ഉത്തമം"
                ? "bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-emerald-800"
                : exactRow.phalam === "മധ്യമം"
                ? "bg-gradient-to-r from-cyan-950 via-slate-900 to-slate-950 text-white border-cyan-800"
                : "bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white border-rose-800"
            }`}
          >
            <div className="flex items-center gap-3.5">
              {exactRow.phalam === "ഉത്തമം" && (
                <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
              )}
              {exactRow.phalam === "മധ്യമം" && (
                <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/40">
                  <Info className="w-8 h-8 text-cyan-400" />
                </div>
              )}
              {exactRow.phalam === "അധമം" && (
                <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/40">
                  <AlertTriangle className="w-8 h-8 text-rose-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    തച്ചു ശാസ്ത്രം പട്ടികയിലെ സാധുവായ അളവ്
                  </span>
                </div>
                <h3 className="text-2xl font-black font-sans tracking-wide flex items-center gap-3 mt-1">
                  <span
                    className={
                      exactRow.phalam === "ഉത്തമം"
                        ? "text-emerald-400"
                        : exactRow.phalam === "മധ്യമം"
                        ? "text-cyan-400"
                        : "text-rose-400"
                    }
                  >
                    {exactRow.phalam}
                  </span>
                  <span className="text-xs font-mono font-normal text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                    {exactRow.phalam === "ഉത്തമം"
                      ? "AUSPICIOUS (RECOMMENDED)"
                      : exactRow.phalam === "മധ്യമം"
                      ? "NEUTRAL / MODERATE"
                      : "INAUSPICIOUS (AVOID)"}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-800 text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>പട്ടിക പേജ് #{exactRow.page}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">റോ #{exactRow.id}</span>
            </div>
          </div>

          {/* FULL CORRESPONDING ROW - 17 PARAMETER GRID */}
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  TECHNICAL SPECIFICATION BREAKDOWN (ആയാദി ഷഡ്വർഗ്ഗം)
                </h4>
                <div className="text-lg font-bold text-white font-mono mt-0.5">
                  {exactRow.kol} KOL {exactRow.viral} VIRAL — {exactRow.chuttuCm} CM ({exactRow.chuttuFeetInches})
                </div>
              </div>
              <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800/60 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>17 VERIFIED PARAMETERS</span>
              </div>
            </div>

            {/* Grid of all parameters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {/* 1. Kol & Viral */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">1. കോൽ & വിരൽ</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.kol} കോൽ {exactRow.viral} വിരൽ
                </div>
              </div>

              {/* 2. Total Perimeter (Cm / Metre / Feet) */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-900/60 col-span-2 sm:col-span-1 lg:col-span-2">
                <div className="text-[11px] font-mono text-cyan-400">2. ചുറ്റ് (PERIMETER)</div>
                <div className="text-base font-mono font-bold text-white mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="text-cyan-300">{exactRow.chuttuCm} cm</span>
                  <span className="text-xs text-slate-300 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {exactRow.chuttuMeters.toFixed(2)}m / {exactRow.chuttuFeetInches}
                  </span>
                </div>
              </div>

              {/* 3. Yoni */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">3. യോനി (YONI)</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.yoniName}
                </div>
              </div>

              {/* 4. Vyayam */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">4. വ്യയം (VYAYAM)</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.vayam}
                </div>
              </div>

              {/* 5. Aayam (Kol, Viral, Cm) */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1 lg:col-span-2">
                <div className="text-[11px] font-mono text-slate-400">5. ആയം (AAYAM - INCOME)</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.aayamKol} കോൽ {exactRow.aayamViral} വിരൽ ({exactRow.aayamCm} cm)
                </div>
              </div>

              {/* 6. Nakshatram & Nazhika */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">6. നക്ഷത്രം & നാഴിക</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.nakshatram} ({exactRow.nakshatramNazhika} നാഴിക)
                </div>
              </div>

              {/* 7. Vayassu */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">7. വയസ്സ് (AGE)</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.vayassu}
                </div>
              </div>

              {/* 8. Tithi / Paksham */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">8. തിഥി & പക്ഷം (TITHI)</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.pakshamTithi} ({exactRow.tithiNazhika} നാഴിക)
                </div>
              </div>

              {/* 9. Karanam */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">9. കരണം (KARANAM)</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.karanam}
                </div>
              </div>

              {/* 10. Azhcha / Planet */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">10. ആഴ്ച / ഗ്രഹം</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.azhchaFullName}
                </div>
              </div>

              {/* 11. Pakshanthara Vyayam */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                <div className="text-[11px] font-mono text-slate-400">11. പക്ഷാന്തര വ്യയം</div>
                <div className="text-sm font-mono font-bold text-white mt-1">
                  {exactRow.pakshantharaVyayam}
                </div>
              </div>
            </div>

            {/* Vastu Guidance & Recommendations */}
            {exactRow.phalam === "അധമം" && (
              <div className="bg-rose-950/60 border border-rose-800/80 p-4 rounded-xl text-slate-200 text-sm space-y-3">
                <div className="font-mono font-bold text-rose-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>VASTU COMPLIANCE WARNING & RECOMMENDATION:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  കോൽ {exactRow.kol} വിരൽ {exactRow.viral} (ചുറ്റ് {exactRow.chuttuCm} cm) എന്നത് തച്ചുശാസ്ത്രപ്രകാരം{" "}
                  <strong className="text-rose-400">അധമം (Inauspicious)</strong> ആണ്. ഗൃഹനിർമ്മാണത്തിൽ ഈ അളവ് ഒഴിവാക്കി പകരം
                  തൊട്ടടുത്തുള്ള ഉത്തമ അളവുകളിലേക്ക് മാറുക.
                </p>

                {nearbyUtthamam.length > 0 && (
                  <div className="pt-2 border-t border-rose-900/60">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                      NEARBY AUSPICIOUS (ഉത്തമം) ALTERNATIVES IN PATTIKA:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {nearbyUtthamam.map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => applyPreset(alt.kol, alt.viral)}
                          className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-slate-200 p-2.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer"
                        >
                          <span>
                            {alt.kol} KOL {alt.viral} VIRAL ({alt.chuttuCm} cm)
                          </span>
                          <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                            ഉത്തമം
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {onOpenAIAgent && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onOpenAIAgent}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-rose-900/60 hover:bg-rose-900/90 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-rose-300" />
                      <span>ഈ അളവിനെക്കുറിച്ച് AI വാസ്തു ഏജന്റിനോട് പരിഹാരം ചോദിക്കുക (Remedy Advice)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {exactRow.phalam === "ഉത്തമം" && (
              <div className="bg-emerald-950/60 border border-emerald-800/80 p-4 rounded-xl text-slate-200 text-sm space-y-3">
                <div className="font-mono font-bold text-emerald-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>VASTU COMPLIANCE VERIFICATION:</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  കോൽ {exactRow.kol} വിരൽ {exactRow.viral} (ചുറ്റ് {exactRow.chuttuCm} cm) എന്നത് തച്ചുശാസ്ത്രപ്രകാരം{" "}
                  <strong className="text-emerald-400">ഉത്തമം (Auspicious)</strong> ആണ്. ഗൃഹനിർമ്മാണം, മുറികളുടെ അളവ്, കട്ടള, വാതിൽ, മതിൽ എന്നിവയ്ക്ക് ഈ അളവ് അനുയോജ്യമാണ്.
                </p>
                {onOpenAIAgent && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={onOpenAIAgent}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-900/40 hover:bg-emerald-900/70 text-emerald-200 border border-emerald-700/60 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-emerald-300" />
                      <span>ഈ അളവ് വെച്ച് AI വാസ്തു ഓഡിറ്റ് റിപ്പോർട്ട് കാണുക (Generate Audit)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

