import React, { useState } from "react";
import {
  findExactThachuRow,
  getClosestThachuRows,
  getClosestUtthamamRows,
  lookupOrCalculateRow,
} from "../data/thachuShastraData";
import { triggerPrint } from "../utils/printHelper";
import {
  Ruler,
  Calculator,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Printer,
  Square,
  ArrowRightLeft,
  Compass,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

type UnitMode = "kol_viral" | "cm" | "meter";

export const SideFinderTab: React.FC = () => {
  const [unitMode, setUnitMode] = useState<UnitMode>("kol_viral");

  // Input states for Perimeter (ചുറ്റ്)
  const [pKolStr, setPKolStr] = useState<string>("15");
  const [pViralStr, setPViralStr] = useState<string>("0");
  const [pCmStr, setPCmStr] = useState<string>("1080");
  const [pMeterStr, setPMeterStr] = useState<string>("10.80");

  // Input states for Known Side A (അറിവുള്ള വശം)
  const [sAKolStr, setSAKolStr] = useState<string>("8");
  const [sAViralStr, setSAViralStr] = useState<string>("0");
  const [sACmStr, setSACmStr] = useState<string>("576");
  const [sAMeterStr, setSAMeterStr] = useState<string>("5.76");

  const [copied, setCopied] = useState<boolean>(false);

  // Calculate virals for Perimeter and Known Side A based on active unit mode
  let totalViralP = 360; // default 15 Kol * 24 = 360 virals
  let totalViralA = 192; // default 8 Kol * 24 = 192 virals

  if (unitMode === "kol_viral") {
    const pK = Math.max(0, parseInt(pKolStr) || 0);
    const pV = Math.max(0, parseInt(pViralStr) || 0);
    totalViralP = pK * 24 + pV;

    const sAK = Math.max(0, parseInt(sAKolStr) || 0);
    const sAV = Math.max(0, parseInt(sAViralStr) || 0);
    totalViralA = sAK * 24 + sAV;
  } else if (unitMode === "cm") {
    const pCm = Math.max(0, parseFloat(pCmStr) || 0);
    totalViralP = Math.round(pCm / 3);

    const sACm = Math.max(0, parseFloat(sACmStr) || 0);
    totalViralA = Math.round(sACm / 3);
  } else if (unitMode === "meter") {
    const pM = Math.max(0, parseFloat(pMeterStr) || 0);
    totalViralP = Math.round((pM * 100) / 3);

    const sAM = Math.max(0, parseFloat(sAMeterStr) || 0);
    totalViralA = Math.round((sAM * 100) / 3);
  }

  // Derived dimensions
  const halfPerimeterViral = totalViralP / 2;
  const totalViralB = halfPerimeterViral - totalViralA;

  const isValidCalculation = totalViralP > 0 && totalViralA > 0 && totalViralB > 0;

  // Breakdown for Perimeter P
  const kolP = Math.floor(totalViralP / 24);
  const viralP = Math.round(totalViralP % 24);
  const cmP = totalViralP * 3;
  const mP = cmP / 100;

  // Breakdown for Side A
  const kolA = Math.floor(totalViralA / 24);
  const viralA = Math.round(totalViralA % 24);
  const cmA = totalViralA * 3;
  const mA = cmA / 100;

  // Breakdown for Side B (Missing Side)
  const kolB = totalViralB > 0 ? Math.floor(totalViralB / 24) : 0;
  const viralB = totalViralB > 0 ? Math.round(totalViralB % 24) : 0;
  const cmB = totalViralB > 0 ? totalViralB * 3 : 0;
  const mB = cmB / 100;

  // Feet/Inches for Side B
  const totalInchesB = cmB / 2.54;
  const ftB = Math.floor(totalInchesB / 12);
  const inB = Math.round(totalInchesB % 12);

  // Look up exact Vastu specifications for the Total Perimeter in Pattika
  const exactPattikaRow = findExactThachuRow(kolP, viralP);
  const isPresentInPattika = exactPattikaRow !== null;
  const vastuRow = exactPattikaRow || lookupOrCalculateRow(kolP, viralP);
  const closestPattikaEntries = getClosestThachuRows(kolP, viralP, 3);
  const nearbyUtthamam = getClosestUtthamamRows(kolP, viralP, 3);

  // Synchronize inputs when unit mode changes
  const handleUnitModeChange = (mode: UnitMode) => {
    setUnitMode(mode);

    if (mode === "kol_viral") {
      setPKolStr(String(kolP));
      setPViralStr(String(viralP));
      setSAKolStr(String(kolA));
      setSAViralStr(String(viralA));
    } else if (mode === "cm") {
      setPCmStr(String(cmP));
      setSACmStr(String(cmA));
    } else if (mode === "meter") {
      setPMeterStr(String(mP.toFixed(2)));
      setSAMeterStr(String(mA.toFixed(2)));
    }
  };

  const applyPreset = (
    pKol: number,
    pViral: number,
    sAKol: number,
    sAViral: number
  ) => {
    const pVir = pKol * 24 + pViral;
    const pCm = pVir * 3;
    const pM = pCm / 100;

    const sAVir = sAKol * 24 + sAViral;
    const sACm = sAVir * 3;
    const sAM = sACm / 100;

    setPKolStr(String(pKol));
    setPViralStr(String(pViral));
    setPCmStr(String(pCm));
    setPMeterStr(String(pM.toFixed(2)));

    setSAKolStr(String(sAKol));
    setSAViralStr(String(sAViral));
    setSACmStr(String(sACm));
    setSAMeterStr(String(sAM.toFixed(2)));
  };

  const handleCopy = () => {
    const text = `തച്ചു ശാസ്ത്രം വശം കണ്ടെത്തുന്ന കണക്ക് (Vastu Side Calculation):
--------------------------------------------------
ആകെ ചുറ്റ് (Total Perimeter): ${kolP} കോൽ ${viralP} വിരൽ = ${cmP} cm (${mP.toFixed(2)} m)
അറിവുള്ള വശം (Known Side A): ${kolA} കോൽ ${viralA} വിരൽ = ${cmA} cm (${mA.toFixed(2)} m)
കണ്ടെത്തിയ മറ്റേ വശം (Calculated Side B): ${kolB} കോൽ ${viralB} വിരൽ = ${cmB} cm (${mB.toFixed(2)} m / ${ftB} ft ${inB} in)

വാസ്തു ഗുണ ദോഷ ഫലം (Vastu Phalam for Perimeter):
ഫലം: ${vastuRow.phalam}
യോനി: ${vastuRow.yoniName}
ആയം: ${vastuRow.aayamKol} കോൽ ${vastuRow.aayamViral} വിരൽ
വ്യയം: ${vastuRow.vayam}
നക്ഷത്രം: ${vastuRow.nakshatram}
വയസ്സ്: ${vastuRow.vayassu}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    triggerPrint("Vasthusilpy_Side_Vasam_Report");
  };

  const presets = [
    {
      label: "ചുറ്റ് 15 കോൽ, വശം 8 കോൽ",
      pKol: 15,
      pViral: 0,
      sAKol: 8,
      sAViral: 0,
    },
    {
      label: "ചുറ്റ് 16 കോൽ 8 വിരൽ, വശം 9 കോൽ",
      pKol: 16,
      pViral: 8,
      sAKol: 9,
      sAViral: 0,
    },
    {
      label: "ചുറ്റ് 20 കോൽ 8 വിരൽ, വശം 11 കോൽ",
      pKol: 20,
      pViral: 8,
      sAKol: 11,
      sAViral: 0,
    },
    {
      label: "ചുറ്റ് 27 കോൽ, വശം 15 കോൽ",
      pKol: 27,
      pViral: 0,
      sAKol: 15,
      sAViral: 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner - Corporate Tech Blueprint */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm bg-blueprint-grid">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                DIMENSIONAL REVERSE SIDE CALCULATOR
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5 font-sans">
              <ArrowRightLeft className="w-5 h-5 text-cyan-400" />
              <span>വശങ്ങൾ കണ്ടെത്തുക (Find Missing Side from Perimeter)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ആകെ ചുറ്റും (Perimeter) ഒരു വശത്തിന്റെ അളവും നൽകുമ്പോൾ മറ്റേ വശത്തിന്റെ അളവ് (ലമ്പം / വീതി) കോൽ-വിരൽ, സെന്റീമീറ്റർ, മീറ്റർ യൂണിറ്റുകളിൽ തൽക്ഷണം കണ്ടെത്താം.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{copied ? "COPIED" : "COPY DATA"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>PRINT</span>
            </button>
          </div>
        </div>

        {/* Unit Mode Selector */}
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

          {/* Input Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Input Group 1: Total Perimeter */}
            <div className="space-y-3 bg-slate-950 p-4.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <Square className="w-3.5 h-3.5" />
                  <span>1. ആകെ ചുറ്റ് (TOTAL PERIMETER - P)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">P = 2 × (Side A + Side B)</span>
              </div>

              {unitMode === "kol_viral" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">കോൽ (KOL)</label>
                    <input
                      type="number"
                      min={1}
                      value={pKolStr}
                      onChange={(e) => setPKolStr(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">വിരൽ (VIRAL)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={pViralStr}
                      onChange={(e) => setPViralStr(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="e.g. 0"
                    />
                  </div>
                </div>
              )}

              {unitMode === "cm" && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">സെന്റിമീറ്റർ (CM)</label>
                  <input
                    type="number"
                    min={1}
                    value={pCmStr}
                    onChange={(e) => setPCmStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="e.g. 1080"
                  />
                </div>
              )}

              {unitMode === "meter" && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">മീറ്റർ (METERS)</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={pMeterStr}
                    onChange={(e) => setPMeterStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="e.g. 10.80"
                  />
                </div>
              )}

              <div className="text-xs font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span>CONVERTED PERIMETER:</span>
                <strong className="text-slate-200">
                  {kolP} കോൽ {viralP} വിരൽ ({cmP} cm / {mP.toFixed(2)} m)
                </strong>
              </div>
            </div>

            {/* Input Group 2: Known Side A */}
            <div className="space-y-3 bg-slate-950 p-4.5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>2. അറിവുള്ള വശം (KNOWN SIDE A)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">നീളം അല്ലെങ്കിൽ വീതി</span>
              </div>

              {unitMode === "kol_viral" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">കോൽ (KOL)</label>
                    <input
                      type="number"
                      min={1}
                      value={sAKolStr}
                      onChange={(e) => setSAKolStr(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="e.g. 8"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">വിരൽ (VIRAL)</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={sAViralStr}
                      onChange={(e) => setSAViralStr(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                      placeholder="e.g. 0"
                    />
                  </div>
                </div>
              )}

              {unitMode === "cm" && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">സെന്റിമീറ്റർ (CM)</label>
                  <input
                    type="number"
                    min={1}
                    value={sACmStr}
                    onChange={(e) => setSACmStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="e.g. 576"
                  />
                </div>
              )}

              {unitMode === "meter" && (
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">മീറ്റർ (METERS)</label>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={sAMeterStr}
                    onChange={(e) => setSAMeterStr(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 transition"
                    placeholder="e.g. 5.76"
                  />
                </div>
              )}

              <div className="text-xs font-mono text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between">
                <span>CONVERTED SIDE A:</span>
                <strong className="text-slate-200">
                  {kolA} കോൽ {viralA} വിരൽ ({cmA} cm / {mA.toFixed(2)} m)
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>PRESETS:</span>
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p.pKol, p.pViral, p.sAKol, p.sAViral)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded text-xs font-mono cursor-pointer transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CALCULATION RESULTS PANEL */}
      {!isValidCalculation ? (
        <div className="bg-rose-950/80 border border-rose-800 p-6 rounded-2xl text-rose-200 space-y-2 font-mono">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>അസാധുവായ അളവ് ഇൻപുട്ട് (Invalid Dimension Inputs)</span>
          </div>
          <p className="text-xs text-rose-300 leading-relaxed">
            അറിവുള്ള ഒരു വശം (Side A = {kolA} കോൽ {viralA} വിരൽ / {cmA} cm) ആകെ ചുറ്റിന്റെ പകുതിയേക്കാൾ (Half Perimeter = {halfPerimeterViral / 24} കോൽ / {cmP / 2} cm) കുറവായിരിക്കണം. ദയവായി അളവുകൾ തിരുത്തി നൽകുക.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calculated Side B Output */}
          <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border-2 border-cyan-500/80 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  RESULTING MISSING SIDE B
                </span>
                <h3 className="text-2xl font-black text-white font-sans mt-1">
                  കണ്ടെത്തിയ മറ്റേ വശം (Side B)
                </h3>
              </div>
              <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/40 text-cyan-300">
                <Ruler className="w-8 h-8" />
              </div>
            </div>

            {/* Units Display Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Kol & Viral */}
              <div className="bg-slate-950 p-4 rounded-xl border border-cyan-800/80 space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 font-bold block">
                  1. കോൽ & വിരൽ (KOL & VIRAL)
                </span>
                <strong className="text-2xl font-mono font-black text-white block">
                  {kolB} കോൽ {viralB} വിരൽ
                </strong>
                <span className="text-[10px] font-mono text-slate-400 block">
                  ({kolB * 24 + viralB} Total Virals)
                </span>
              </div>

              {/* 2. Centimeters */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 font-bold block">
                  2. സെന്റിമീറ്റർ (CENTIMETER)
                </span>
                <strong className="text-2xl font-mono font-black text-cyan-300 block">
                  {cmB} cm
                </strong>
                <span className="text-[10px] font-mono text-slate-400 block">
                  ({(cmB * 10).toFixed(0)} mm)
                </span>
              </div>

              {/* 3. Meters */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 font-bold block">
                  3. മീറ്റർ (METER)
                </span>
                <strong className="text-2xl font-mono font-black text-white block">
                  {mB.toFixed(2)} m
                </strong>
                <span className="text-[10px] font-mono text-slate-400 block">
                  ({ftB} ft {inB} in)
                </span>
              </div>
            </div>

            {/* Visual Rectangle Blueprint Diagram */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>RECTANGLE GEOMETRY SCHEMATIC</span>
                <span className="text-cyan-400">P = 2 × ({cmA} + {cmB}) = {cmP} cm</span>
              </div>

              <div className="relative border-2 border-dashed border-cyan-500/60 bg-slate-900/80 p-8 rounded-xl flex items-center justify-center min-h-[160px]">
                {/* Top Label (Side A) */}
                <div className="absolute top-2 text-xs font-mono font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Side A (നീളം): {kolA} കോൽ {viralA} വിരൽ ({cmA} cm / {mA.toFixed(2)} m)
                </div>

                {/* Right Label (Side B) */}
                <div className="absolute right-2 text-xs font-mono font-bold text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Side B (വീതി): {kolB} കോൽ {viralB} വിരൽ ({cmB} cm / {mB.toFixed(2)} m)
                </div>

                {/* Center Content */}
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Perimeter (ചുറ്റ്)</span>
                  <span className="text-xl font-mono font-black text-white block">
                    {kolP} കോൽ {viralP} വിരൽ ({cmP} cm)
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                      vastuRow.phalam === "ഉത്തമം"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : vastuRow.phalam === "മധ്യമം"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        : "bg-rose-950 text-rose-300 border border-rose-800"
                    }`}
                  >
                    {vastuRow.phalam} (Vastu Evaluation)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Corresponding Vastu Shastra Row Specs for the Total Perimeter */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 uppercase">
                <Compass className="w-4 h-4" />
                <span>തച്ചു ശാസ്ത്രം പരിശോധന</span>
              </span>
              {isPresentInPattika ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  PAGE #{vastuRow.page} • ROW #{vastuRow.id}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  NOT IN PATTIKA
                </span>
              )}
            </div>

            {/* If NOT present in Pattika: Warning output */}
            {!isPresentInPattika ? (
              <div className="bg-amber-950/70 border border-amber-700/80 p-3.5 rounded-xl text-amber-200 text-xs space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ഈ അളവ് &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിൽ ഉൾപ്പെട്ടിട്ടില്ല</span>
                </div>
                <p className="text-[11px] text-amber-200/90 font-sans leading-relaxed">
                  നൽകിയ ചുറ്റ് <strong>{kolP} കോൽ {viralP} വിരൽ ({cmP} cm)</strong> ആധികാരിക പട്ടികയിലുള്ളതല്ല (THE ENTRY IS NOT PRESENT IN &quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;).
                </p>
                <div className="pt-1.5 border-t border-amber-800/60 text-[11px]">
                  <span className="text-slate-400 block mb-1">പട്ടികയിലെ അടുത്ത സാധുവായ ചുറ്റളവുകൾ:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {closestPattikaEntries.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => applyPreset(row.kol, row.viral, kolA, viralA)}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-amber-600/50 text-amber-300 text-[10px] font-mono transition cursor-pointer"
                      >
                        {row.kol}k {row.viral}v ({row.chuttuCm}cm) - {row.phalam}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-800/80 text-[11px] text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>&quot;തച്ചു ശാസ്ത്രം പട്ടിക&quot;യിലെ സാധുവായ അളവ് (Verified Entry)</span>
              </div>
            )}

            <div className="space-y-2.5 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">1. വാസ്തു ഫലം:</span>
                <strong
                  className={
                    vastuRow.phalam === "ഉത്തമം"
                      ? "text-emerald-400 font-bold"
                      : vastuRow.phalam === "മധ്യമം"
                      ? "text-cyan-400 font-bold"
                      : "text-rose-400 font-bold"
                  }
                >
                  {vastuRow.phalam}
                </strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">2. യോനി:</span>
                <strong className="text-slate-200">{vastuRow.yoniName}</strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">3. ആയം (Income):</span>
                <strong className="text-slate-200">
                  {vastuRow.aayamKol} കോൽ {vastuRow.aayamViral} വിരൽ
                </strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">4. വ്യയം (Expenditure):</span>
                <strong className="text-slate-200">{vastuRow.vayam}</strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">5. നക്ഷത്രം:</span>
                <strong className="text-slate-200">{vastuRow.nakshatram}</strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">6. വയസ്സ് (Age):</span>
                <strong className="text-slate-200">{vastuRow.vayassu}</strong>
              </div>
            </div>

            {vastuRow.phalam === "ഉത്തമം" && isPresentInPattika ? (
              <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800 text-[11px] text-emerald-300 font-sans leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  ആകെ ചുറ്റ് {kolP} കോൽ {viralP} വിരൽ ഉത്തമമായ അളവാണ്. കണ്ടെത്തിയ വശം {kolB} കോൽ {viralB} വിരൽ ({cmB} cm) ഉപയോഗിക്കാം.
                </span>
              </div>
            ) : vastuRow.phalam !== "ഉത്തമം" ? (
              <div className="bg-rose-950/60 p-3 rounded-xl border border-rose-800 text-[11px] text-rose-300 font-sans leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  ഈ ചുറ്റ് {vastuRow.phalam} ആണ്. നിർമ്മാണത്തിന് മുൻപ് ചുറ്റിന്റെ അളവിൽ അല്പം വിരലുകൾ കൂട്ടി ഉത്തമമാക്കാൻ ശുപാർശ ചെയ്യുന്നു.
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
