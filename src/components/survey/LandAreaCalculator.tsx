import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Bookmark,
  BarChart3,
  AlertCircle,
  Printer,
  FileSpreadsheet,
  Compass,
  Maximize2,
  X,
  Layers,
  MapPin
} from "lucide-react";
import { triggerPrint } from "../../utils/printHelper";

interface TriangleInput {
  id: string;
  sideA: string;
  sideB: string;
  sideC: string;
  label?: string;
}

interface LandSurveyMeta {
  clientName: string;
  surveyNo: string;
  village: string;
  taluk: string;
  district: string;
  surveyorName: string;
  surveyDate: string;
  notes: string;
}

export const LandAreaCalculator: React.FC = () => {
  const [triangles, setTriangles] = useState<TriangleInput[]>([
    { id: "tri_1", sideA: "12.50", sideB: "16.80", sideC: "14.20", label: "T1 (North Plot)" },
    { id: "tri_2", sideA: "14.20", sideB: "15.60", sideC: "11.40", label: "T2 (South Plot)" }
  ]);

  const [meta, setMeta] = useState<LandSurveyMeta>({
    clientName: "Client 1",
    surveyNo: "124/8-B",
    village: "Kottayam",
    taluk: "Kottayam",
    district: "Kottayam",
    surveyorName: "Er. Deepak Vasthusilpy",
    surveyDate: new Date().toISOString().split("T")[0],
    notes: "Heron's Formula triangulation land measurement"
  });

  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const addTriangle = () => {
    const nextIdx = triangles.length + 1;
    setTriangles((prev) => [
      ...prev,
      { id: `tri_${Date.now()}`, sideA: "", sideB: "", sideC: "", label: `T${nextIdx}` }
    ]);
  };

  const removeTriangle = (id: string) => {
    if (triangles.length <= 1) return;
    setTriangles((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTriangleSide = (id: string, side: "sideA" | "sideB" | "sideC" | "label", val: string) => {
    setTriangles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [side]: val } : t))
    );
  };

  const handleReset = () => {
    setTriangles([{ id: "tri_1", sideA: "", sideB: "", sideC: "", label: "T1" }]);
    setSaveSuccessMsg(null);
  };

  // Helper: calculate single triangle area via Heron's formula
  const getTriangleCalculations = (t: TriangleInput) => {
    const a = parseFloat(t.sideA);
    const b = parseFloat(t.sideB);
    const c = parseFloat(t.sideC);

    if (isNaN(a) || isNaN(b) || isNaN(c) || a <= 0 || b <= 0 || c <= 0) {
      return { area: 0, s: 0, a: 0, b: 0, c: 0, isValid: false, isFilled: false, error: null };
    }

    // Check triangle inequality
    if (a + b <= c || a + c <= b || b + c <= a) {
      return {
        area: 0,
        s: (a + b + c) / 2,
        a,
        b,
        c,
        isValid: false,
        isFilled: true,
        error: "അളവുകൾ ത്രികോണത്തിന് അസാധ്യമാണ് (Triangle inequality violation: a+b>c, a+c>b, b+c>a)."
      };
    }

    const s = (a + b + c) / 2;
    const areaSqM = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));

    return { area: areaSqM, s, a, b, c, isValid: true, isFilled: true, error: null };
  };

  // Calculate totals
  let totalAreaSqM = 0;
  triangles.forEach((t) => {
    const calc = getTriangleCalculations(t);
    if (calc.isValid) {
      totalAreaSqM += calc.area;
    }
  });

  const totalCents = totalAreaSqM / 40.468564;
  const totalAcres = totalAreaSqM / 4046.8564;
  const totalHectares = totalAreaSqM / 10000.0;
  const totalAres = totalAreaSqM / 100.0;
  const totalSqFeet = totalAreaSqM * 10.76391;

  const handlePrintPlan = () => {
    triggerPrint(`Land_Survey_Plan_${meta.surveyNo || "Plot"}_Area_Statement`, "land-survey-print-sheet");
  };

  const handleSaveReport = () => {
    const reportText = `
=== VASTHUSILPY LAND SURVEY REPORT ===
Client Name: ${meta.clientName}
Survey No: ${meta.surveyNo} | Village: ${meta.village}, ${meta.taluk}, ${meta.district}
Surveyor: ${meta.surveyorName} | Date: ${meta.surveyDate}
Triangles Decomposed: ${triangles.length}

TOTAL AREA RESULTS:
- Sq. Meter: ${totalAreaSqM.toFixed(2)} m²
- Cent: ${totalCents.toFixed(2)} Cents
- Acre: ${totalAcres.toFixed(4)} Acres
- Hectare: ${totalHectares.toFixed(4)} Hec
- Are: ${totalAres.toFixed(2)} Are
- Sq. Feet: ${totalSqFeet.toFixed(2)} sq.ft

Triangle Breakdown:
${triangles
  .map((t, idx) => {
    const c = getTriangleCalculations(t);
    return `${t.label || `Triangle ${idx + 1}`}: a=${t.sideA || 0}m, b=${t.sideB || 0}m, c=${t.sideC || 0}m (s=${c.s.toFixed(2)}m) => Area: ${c.area.toFixed(2)} m² (${(c.area / 40.468564).toFixed(2)} Cents)`;
  })
  .join("\n")}
======================================
    `.trim();

    try {
      navigator.clipboard.writeText(reportText);
      setSaveSuccessMsg("സർവ്വേ റിപ്പോർട്ട് ക്ലിപ്ബോർഡിലേക്ക് കോപ്പി ചെയ്തു! (Report copied to clipboard)");
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch {
      alert(reportText);
    }
  };

  // Helper to generate SVG geometric shapes for all valid triangles
  const renderTrianglesSvg = (isPrintMode = false) => {
    const validCalcs = triangles
      .map((t, idx) => ({ t, calc: getTriangleCalculations(t), idx }))
      .filter((item) => item.calc.isValid);

    if (validCalcs.length === 0) {
      return (
        <div className="h-48 flex flex-col items-center justify-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl p-4">
          <Compass className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
          <span>നൽകിയ വശങ്ങൾ പൂർത്തിയാക്കുമ്പോൾ പ്ലോട്ട് ഡ്രോയിംഗ് ഇവിടെ കാണാം.</span>
          <span className="text-[10px] text-slate-600 mt-1">(Enter valid side lengths a, b, c to plot geometry)</span>
        </div>
      );
    }

    const svgWidth = isPrintMode ? 700 : 640;
    const padding = 30;
    const numCols = Math.min(2, validCalcs.length);
    const cellW = (svgWidth - padding * 2) / numCols;
    const cellH = 170;
    const totalRows = Math.ceil(validCalcs.length / numCols);
    const svgHeight = Math.max(200, totalRows * cellH + padding * 2);

    return (
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className={`w-full h-auto ${isPrintMode ? "bg-white" : "bg-slate-950/80 rounded-xl border border-slate-800"}`}
        style={{ maxHeight: isPrintMode ? "320px" : "340px" }}
      >
        <defs>
          <pattern id="survey-grid-print" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isPrintMode ? "#e2e8f0" : "#1e293b"} strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width={svgWidth} height={svgHeight} fill="url(#survey-grid-print)" />

        {validCalcs.map(({ t, calc, idx }) => {
          const row = Math.floor(idx / numCols);
          const col = idx % numCols;
          const originX = padding + col * cellW + 30;
          const originY = padding + row * cellH + cellH - 35;

          const { a, b, c } = calc;
          const maxDim = Math.max(a, b, c, 1);
          const targetScale = (cellW - 75) / maxDim;

          const scaledC = c * targetScale;
          const cosA = (b * b + c * c - a * a) / (2 * b * c);
          const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
          const scaledBx = b * cosA * targetScale;
          const scaledBy = b * sinA * targetScale;

          const pA = { x: originX, y: originY };
          const pB = { x: originX + scaledC, y: originY };
          const pC = { x: originX + scaledBx, y: originY - scaledBy };

          const strokeColor = isPrintMode ? "#000000" : "#38bdf8";
          const fillColor = isPrintMode ? "rgba(0, 0, 0, 0.04)" : "rgba(56, 189, 248, 0.12)";
          const textColor = isPrintMode ? "#000000" : "#ffffff";
          const subTextColor = isPrintMode ? "#000000" : "#94a3b8";

          const centerX = (pA.x + pB.x + pC.x) / 3;
          const centerY = (pA.y + pB.y + pC.y) / 3;

          return (
            <g key={t.id}>
              <polygon
                points={`${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}`}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isPrintMode ? "1.8" : "2"}
                strokeLinejoin="round"
              />

              <circle cx={pA.x} cy={pA.y} r={isPrintMode ? 3 : 4} fill={isPrintMode ? "#000" : "#38bdf8"} />
              <circle cx={pB.x} cy={pB.y} r={isPrintMode ? 3 : 4} fill={isPrintMode ? "#000" : "#38bdf8"} />
              <circle cx={pC.x} cy={pC.y} r={isPrintMode ? 3 : 4} fill={isPrintMode ? "#000" : "#38bdf8"} />

              <text x={pA.x - 10} y={pA.y + 12} fill={textColor} fontSize="10" fontFamily="monospace" fontWeight="bold">
                A
              </text>
              <text x={pB.x + 6} y={pB.y + 12} fill={textColor} fontSize="10" fontFamily="monospace" fontWeight="bold">
                B
              </text>
              <text x={pC.x} y={pC.y - 6} fill={textColor} fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                C
              </text>

              <text
                x={(pA.x + pB.x) / 2}
                y={pA.y + 14}
                fill={subTextColor}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
                fontWeight="bold"
              >
                c={c.toFixed(2)}m
              </text>

              <text
                x={(pA.x + pC.x) / 2 - 10}
                y={(pA.y + pC.y) / 2}
                fill={subTextColor}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
                fontWeight="bold"
              >
                b={b.toFixed(2)}m
              </text>

              <text
                x={(pB.x + pC.x) / 2 + 10}
                y={(pB.y + pC.y) / 2}
                fill={subTextColor}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="start"
                fontWeight="bold"
              >
                a={a.toFixed(2)}m
              </text>

              <rect
                x={centerX - 40}
                y={centerY - 10}
                width="80"
                height="20"
                rx="3"
                fill={isPrintMode ? "#ffffff" : "#0f172a"}
                stroke={isPrintMode ? "#000000" : "#38bdf8"}
                strokeWidth="1"
              />
              <text
                x={centerX}
                y={centerY + 3}
                fill={isPrintMode ? "#000000" : "#38bdf8"}
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {t.label || `T${idx + 1}`}: {calc.area.toFixed(2)} m²
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <span>Land Survey & Area Calculator (Heron's Formula)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Decompose irregular land plots into triangles to compute precise total plot area, geometric drawings, and print-ready Area Statement tables.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
            title="Open Print Plan & Area Statement Sheet"
          >
            <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Print Plan & Area Table</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-200 bg-slate-900 border border-slate-700 hover:border-cyan-500 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Guide Info Box */}
      {showGuide && (
        <div className="bg-slate-900/90 border border-cyan-800/80 rounded-2xl p-5 space-y-2 text-xs font-mono text-slate-300">
          <h3 className="text-cyan-300 font-bold font-sans uppercase text-sm">
            ഹെറോൺസ് ഫോർമുല സർവ്വേ ഗൈഡ് (HERON'S FORMULA LAND SURVEY)
          </h3>
          <p className="leading-relaxed">
            ചതുരമല്ലാത്തതും ക്രമമില്ലാത്തതുമായ ഏത് അതിരുകളുള്ള ഭൂമിയെയും ത്രികോണങ്ങളായി തിരിച്ച് ഓരോ ത്രികോണത്തിന്റെയും മൂന്ന് അതിരുകളുടെ നീളം (a, b, c) അളന്ന് കൂട്ടിയാൽ ആകെ വിസ്തീർണ്ണം കൃത്യമായി ലഭിക്കും.
          </p>
          <p className="text-cyan-400 font-bold">
            • Area = √(s(s-a)(s-b)(s-c)) | ഇവിടെ s = (a+b+c) / 2
          </p>
        </div>
      )}

      {/* Survey Metadata Info Strip */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Land Plot & Client Details</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">Auto-included in Print Plan Sheet</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Client / Owner Name</label>
            <input
              type="text"
              value={meta.clientName}
              onChange={(e) => setMeta({ ...meta, clientName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Re-Survey / Plot No.</label>
            <input
              type="text"
              value={meta.surveyNo}
              onChange={(e) => setMeta({ ...meta, surveyNo: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Village / Panchayat</label>
            <input
              type="text"
              value={meta.village}
              onChange={(e) => setMeta({ ...meta, village: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-0.5">Surveyor / Engineer</label>
            <input
              type="text"
              value={meta.surveyorName}
              onChange={(e) => setMeta({ ...meta, surveyorName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Measurement Inputs) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Measurement Inputs ({triangles.length} Triangles)</span>
              </h2>

              <button
                type="button"
                onClick={addTriangle}
                className="bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Triangle</span>
              </button>
            </div>

            {/* List of Triangles */}
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {triangles.map((t, idx) => {
                const calc = getTriangleCalculations(t);

                return (
                  <div
                    key={t.id}
                    className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 space-y-3 relative transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 font-mono text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={t.label || `Triangle ${idx + 1}`}
                          onChange={(e) => updateTriangleSide(t.id, "label", e.target.value)}
                          className="bg-transparent border-none text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1"
                        />
                      </div>

                      {triangles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTriangle(t.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                          title="Remove Triangle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {/* Side a */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-mono text-slate-400 w-16">
                          Side a (m)
                        </label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="any"
                            value={t.sideA}
                            onChange={(e) => updateTriangleSide(t.id, "sideA", e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none font-bold"
                          />
                          <span className="absolute right-3 top-1.5 text-xs font-mono text-slate-500">
                            m
                          </span>
                        </div>
                      </div>

                      {/* Side b */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-mono text-slate-400 w-16">
                          Side b (m)
                        </label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="any"
                            value={t.sideB}
                            onChange={(e) => updateTriangleSide(t.id, "sideB", e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none font-bold"
                          />
                          <span className="absolute right-3 top-1.5 text-xs font-mono text-slate-500">
                            m
                          </span>
                        </div>
                      </div>

                      {/* Side c */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-mono text-slate-400 w-16">
                          Side c (m)
                        </label>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            step="any"
                            value={t.sideC}
                            onChange={(e) => updateTriangleSide(t.id, "sideC", e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-1.5 text-xs font-mono text-white outline-none font-bold"
                          />
                          <span className="absolute right-3 top-1.5 text-xs font-mono text-slate-500">
                            m
                          </span>
                        </div>
                      </div>

                      {calc.error && (
                        <div className="p-2 bg-rose-950/80 border border-rose-800 text-rose-300 text-[11px] font-mono rounded flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{calc.error}</span>
                        </div>
                      )}

                      {/* Triangle Area Footer */}
                      <div className="flex items-center justify-between pt-1 font-mono text-xs border-t border-slate-800/40">
                        <span className="text-slate-500 font-bold">
                          s = {calc.isValid ? `${calc.s.toFixed(2)} m` : "—"}
                        </span>
                        <span className="text-cyan-300 font-bold">
                          AREA: {calc.isValid ? `${calc.area.toFixed(2)} m² (${(calc.area / 40.468564).toFixed(2)} Cents)` : "0.00 m²"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="w-full bg-slate-950 hover:bg-slate-900 text-slate-400 font-mono font-bold py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs transition cursor-pointer text-center"
              >
                Reset Form
              </button>
            </div>
          </div>

          {/* Interactive Geometric Drawing Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>Geometric Plot Drawing Preview</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" /> Full Print View
              </button>
            </div>

            {renderTrianglesSvg(false)}
          </div>
        </div>

        {/* Right Column (Survey Report & Area Statement Table) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-white font-sans uppercase">
                  Survey Area Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Sheet
              </button>
            </div>

            {/* Dark Blue Total Area Card */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-600 rounded-2xl p-5 text-center space-y-1 shadow-xl">
              <span className="text-[10px] font-mono font-bold tracking-widest text-blue-200 uppercase block">
                TOTAL COMPUTED LAND AREA
              </span>

              <div className="text-3xl md:text-4xl font-black font-mono text-white py-1">
                {totalAreaSqM.toFixed(2)} <span className="text-xl font-normal">m²</span>
              </div>

              <div className="text-base font-mono font-bold text-emerald-300">
                {totalCents.toFixed(2)} Cents
              </div>
            </div>

            {/* Area Statement Breakdown Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                <span>Area Statement Table (Heron's Method)</span>
              </span>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px] border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[9px] border-b border-slate-800">
                    <tr>
                      <th className="p-2">Part</th>
                      <th className="p-2 text-right">a (m)</th>
                      <th className="p-2 text-right">b (m)</th>
                      <th className="p-2 text-right">c (m)</th>
                      <th className="p-2 text-right text-cyan-400 font-bold">Area (m²)</th>
                      <th className="p-2 text-right text-emerald-400 font-bold">Cents</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                    {triangles.map((t, idx) => {
                      const c = getTriangleCalculations(t);
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/60">
                          <td className="p-2 font-bold text-slate-300 truncate max-w-[80px]">
                            {t.label || `T${idx + 1}`}
                          </td>
                          <td className="p-2 text-right text-slate-400">{t.sideA || "—"}</td>
                          <td className="p-2 text-right text-slate-400">{t.sideB || "—"}</td>
                          <td className="p-2 text-right text-slate-400">{t.sideC || "—"}</td>
                          <td className="p-2 text-right text-cyan-300 font-bold">
                            {c.isValid ? c.area.toFixed(2) : "—"}
                          </td>
                          <td className="p-2 text-right text-emerald-300 font-bold">
                            {c.isValid ? (c.area / 40.468564).toFixed(2) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 font-bold text-white border-t border-slate-700">
                    <tr>
                      <td colSpan={4} className="p-2 uppercase text-[10px]">
                        Total Land Area
                      </td>
                      <td className="p-2 text-right text-cyan-300">{totalAreaSqM.toFixed(2)}</td>
                      <td className="p-2 text-right text-emerald-300">{totalCents.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Conversions Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                STANDARD LAND UNIT CONVERSIONS
              </span>

              <div className="bg-slate-950 border border-slate-800/80 rounded-xl divide-y divide-slate-800/60 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-400">Square Meters (m²)</span>
                  <span className="text-white font-bold">{totalAreaSqM.toFixed(2)} m²</span>
                </div>

                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-400">Cents (Kerala Standard)</span>
                  <span className="text-emerald-400 font-bold">{totalCents.toFixed(2)} Cents</span>
                </div>

                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-400">Square Feet (sq.ft)</span>
                  <span className="text-white font-bold">{totalSqFeet.toFixed(2)} sq.ft</span>
                </div>

                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-400">Ares</span>
                  <span className="text-white font-bold">{totalAres.toFixed(2)} Are</span>
                </div>

                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-400">Acres</span>
                  <span className="text-white font-bold">{totalAcres.toFixed(4)} Acres</span>
                </div>

                <div className="flex items-center justify-between p-2.5">
                  <span className="text-slate-400">Hectares (Hec)</span>
                  <span className="text-white font-bold">{totalHectares.toFixed(4)} Hec</span>
                </div>
              </div>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-mono text-center">
                {saveSuccessMsg}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black py-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer uppercase"
              >
                <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span>Print Official Plan & Area Statement</span>
              </button>

              <button
                type="button"
                onClick={handleSaveReport}
                className="w-full bg-slate-950 hover:bg-slate-900 text-slate-300 font-mono font-bold py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 text-xs transition cursor-pointer uppercase"
              >
                <Bookmark className="w-4 h-4 text-cyan-400" />
                <span>Copy Text Summary to Clipboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT PLAN & AREA STATEMENT MODAL / PREVIEW */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white font-sans uppercase">
                  Survey Plan & Area Statement Sheet (A4 Print Preview)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPlan}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>PRINT / SAVE PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Printable Document Container */}
            <div className="p-6 bg-slate-950 flex justify-center">
              <div
                id="land-survey-print-sheet"
                className="bg-white text-black p-8 rounded-lg shadow-2xl w-full max-w-[780px] font-sans border border-slate-300"
                style={{ minHeight: "1000px" }}
              >
                {/* Official Title Block */}
                <div className="border-b-2 border-black pb-3 mb-4 text-center">
                  <div className="text-[11px] font-mono tracking-widest uppercase font-bold text-slate-700">
                    GOVERNMENT OF KERALA / KPBR STANDARD LAND SURVEY
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-black mt-0.5">
                    LAND SURVEY PLAN & AREA STATEMENT
                  </h1>
                  <div className="text-xs font-mono font-bold text-slate-800 mt-1">
                    SURVEY TRIANGULATION METHOD (HERON'S FORMULA DECOMPOSITION)
                  </div>
                </div>

                {/* Plot & Owner Metadata Table */}
                <div className="border border-black p-2.5 mb-4 text-[11px] font-mono grid grid-cols-2 gap-x-6 gap-y-1.5 bg-slate-50">
                  <div>
                    <strong>Client / Owner:</strong> {meta.clientName}
                  </div>
                  <div>
                    <strong>Re-Survey No:</strong> {meta.surveyNo}
                  </div>
                  <div>
                    <strong>Village & Taluk:</strong> {meta.village}, {meta.taluk}
                  </div>
                  <div>
                    <strong>District:</strong> {meta.district}
                  </div>
                  <div>
                    <strong>Surveyed By:</strong> {meta.surveyorName}
                  </div>
                  <div>
                    <strong>Date of Survey:</strong> {meta.surveyDate}
                  </div>
                </div>

                {/* SECTION 1: GRAPHICAL PLAN DRAWING */}
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 font-mono flex items-center justify-between">
                    <span>1. GEOMETRICAL SURVEY PLOT DRAWING</span>
                    <span className="text-[10px] font-normal">SCALE: NOT TO SCALE (NTS)</span>
                  </div>

                  <div className="border border-black p-2 bg-white flex justify-center">
                    {renderTrianglesSvg(true)}
                  </div>
                </div>

                {/* SECTION 2: AREA STATEMENT TABLE */}
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 font-mono">
                    2. DETAILED AREA STATEMENT & HERON'S FORMULA BREAKDOWN
                  </div>

                  <table className="w-full text-left font-mono text-[10px] border-collapse border border-black">
                    <thead>
                      <tr className="bg-slate-100 border-b border-black">
                        <th className="border border-black p-1.5 text-center">SL</th>
                        <th className="border border-black p-1.5">PART / TRIANGLE</th>
                        <th className="border border-black p-1.5 text-right">SIDE a (m)</th>
                        <th className="border border-black p-1.5 text-right">SIDE b (m)</th>
                        <th className="border border-black p-1.5 text-right">SIDE c (m)</th>
                        <th className="border border-black p-1.5 text-right">SEMI-PERIMETER s (m)</th>
                        <th className="border border-black p-1.5 text-right font-bold">AREA (SQ.M)</th>
                        <th className="border border-black p-1.5 text-right font-bold">AREA (CENTS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triangles.map((t, idx) => {
                        const c = getTriangleCalculations(t);
                        return (
                          <tr key={t.id} className="border-b border-black">
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 font-bold">{t.label || `Triangle ${idx + 1}`}</td>
                            <td className="border border-black p-1.5 text-right">{t.sideA || "—"}</td>
                            <td className="border border-black p-1.5 text-right">{t.sideB || "—"}</td>
                            <td className="border border-black p-1.5 text-right">{t.sideC || "—"}</td>
                            <td className="border border-black p-1.5 text-right">{c.isValid ? c.s.toFixed(2) : "—"}</td>
                            <td className="border border-black p-1.5 text-right font-bold">
                              {c.isValid ? c.area.toFixed(2) : "—"}
                            </td>
                            <td className="border border-black p-1.5 text-right font-bold">
                              {c.isValid ? (c.area / 40.468564).toFixed(2) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-black">
                        <td colSpan={6} className="border border-black p-2 text-right uppercase text-[11px]">
                          TOTAL PLOT AREA
                        </td>
                        <td className="border border-black p-2 text-right text-xs font-black">
                          {totalAreaSqM.toFixed(2)} m²
                        </td>
                        <td className="border border-black p-2 text-right text-xs font-black">
                          {totalCents.toFixed(2)} Cents
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* SECTION 3: UNIT CONVERSION SUMMARY */}
                <div className="mb-8 border border-black p-3 bg-slate-50 font-mono text-[10px]">
                  <div className="font-bold border-b border-black pb-1 mb-2 uppercase flex justify-between">
                    <span>3. COMPREHENSIVE AREA CONVERSIONS</span>
                    <span>1 CENT = 40.4686 SQ.M | 435.6 SQ.FT</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><strong>Square Meters:</strong> {totalAreaSqM.toFixed(2)} m²</div>
                    <div><strong>Cents:</strong> {totalCents.toFixed(2)} Cents</div>
                    <div><strong>Square Feet:</strong> {totalSqFeet.toFixed(2)} sq.ft</div>
                    <div><strong>Ares:</strong> {totalAres.toFixed(2)} Ares</div>
                    <div><strong>Acres:</strong> {totalAcres.toFixed(4)} Acres</div>
                    <div><strong>Hectares:</strong> {totalHectares.toFixed(4)} Hec</div>
                  </div>
                </div>

                {/* SIGNATURES BLOCK */}
                <div className="pt-8 border-t border-black flex justify-between items-end font-mono text-[11px]">
                  <div className="text-center space-y-1">
                    <div className="w-44 border-b border-black pb-8"></div>
                    <div className="font-bold">SIGNATURE OF OWNER</div>
                    <div className="text-[9px] text-slate-600">({meta.clientName})</div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-48 border-b border-black pb-8"></div>
                    <div className="font-bold">REGISTERED SURVEYOR / ENGINEER</div>
                    <div className="text-[9px] text-slate-600">({meta.surveyorName})</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
