import React, { useState, useMemo } from "react";
import { ConstructionSettings } from "../../types";
import {
  formatIndianCurrency,
  convertAmountToWords,
  convertAmountToMalayalamWords
} from "../../utils/constructionStorageManager";
import {
  MaterialCostItem,
  PhaseTimelineItem,
  DEFAULT_MATERIAL_ITEMS,
  DEFAULT_PHASE_TIMELINES,
  computeBaseRateFromMaterials,
  CostCalculationResult
} from "../../utils/materialCostCalculator";
import {
  Calculator,
  Layers,
  Sparkles,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  Sliders,
  Plus,
  Trash2,
  Package,
  Clock,
  BarChart3,
  PieChart,
  HardHat,
  Printer,
  Download,
  RotateCcw,
  Info,
  ShieldCheck,
  Building2,
  Check,
  ChevronRight,
  Flame
} from "lucide-react";

interface ConstructionCostCalculatorTabProps {
  settings: ConstructionSettings;
  onProceedToProject: (calculatedData: {
    totalArea: number;
    baseRate: number;
    totalCost: number;
    floors: Array<{ floorName: string; areaSqFt: number }>;
  }) => void;
}

type CalculationViewMode = "MATERIALS" | "TIMELINE_PHASES" | "DETAILED_STAGES" | "SIMPLE";

export const ConstructionCostCalculatorTab: React.FC<ConstructionCostCalculatorTabProps> = ({
  settings,
  onProceedToProject
}) => {
  const [viewMode, setViewMode] = useState<CalculationViewMode>("MATERIALS");
  const [materials, setMaterials] = useState<MaterialCostItem[]>(() =>
    JSON.parse(JSON.stringify(DEFAULT_MATERIAL_ITEMS))
  );
  const [floors, setFloors] = useState<Array<{ floorName: string; areaSqFt: number }>>([
    { floorName: "Ground Floor (ഗ്രൗണ്ട് ഫ്ലോർ)", areaSqFt: 1000 },
    { floorName: "First Floor (ഒന്നാം നില)", areaSqFt: 850 }
  ]);
  const [additionalWorksCost, setAdditionalWorksCost] = useState<number>(50000);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [contingencyPct, setContingencyPct] = useState<number>(3);
  const [simpleBaseRate, setSimpleBaseRate] = useState<number>(
    settings.defaultRates?.baseRatePerSqFt || 2250
  );

  // Stage-wise manual rates
  const [detailedStages, setDetailedStages] = useState([
    { name: "Substructure & Foundation (ഫൗണ്ടേഷൻ)", ratePerSqFt: 380, enabled: true },
    { name: "Superstructure & Brick Masonry (ഇഷ്ടികപ്പണി)", ratePerSqFt: 460, enabled: true },
    { name: "RCC Roof Slabs & Beams (റൂഫ് സ്ലാബ്)", ratePerSqFt: 540, enabled: true },
    { name: "Plastering (പ്ലാസ്റ്ററിംഗ്)", ratePerSqFt: 220, enabled: true },
    { name: "Flooring & Tiling (ഫ്ലോറിംഗ് & ടൈലുകൾ)", ratePerSqFt: 260, enabled: true },
    { name: "Plumbing & Sanitary (പ്ലംബിംഗ് & സാനിറ്ററി)", ratePerSqFt: 180, enabled: true },
    { name: "Electrical Wiring & Fittings (ഇലക്ട്രിക്കൽ)", ratePerSqFt: 160, enabled: true },
    { name: "Doors, Windows & Woodwork (വാതിലുകൾ & ജനലുകൾ)", ratePerSqFt: 210, enabled: true },
    { name: "Painting & Putty Coat (പെയിന്റിംഗ്)", ratePerSqFt: 140, enabled: true }
  ]);

  const totalArea = useMemo(() => {
    return floors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
  }, [floors]);

  // Compute from materials
  const materialCalcResult: CostCalculationResult = useMemo(() => {
    return computeBaseRateFromMaterials(
      materials,
      totalArea,
      additionalWorksCost,
      contingencyPct,
      discountAmount
    );
  }, [materials, totalArea, additionalWorksCost, contingencyPct, discountAmount]);

  const detailedComputedRate = detailedStages
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.ratePerSqFt, 0);

  // Determine Effective Base Rate & Grand Total based on selected View Mode
  const effectiveBaseRate = useMemo(() => {
    if (viewMode === "MATERIALS" || viewMode === "TIMELINE_PHASES") {
      return materialCalcResult.baseRatePerSqFt;
    } else if (viewMode === "DETAILED_STAGES") {
      return detailedComputedRate;
    } else {
      return simpleBaseRate;
    }
  }, [viewMode, materialCalcResult.baseRatePerSqFt, detailedComputedRate, simpleBaseRate]);

  const effectiveGrandTotal = useMemo(() => {
    if (viewMode === "MATERIALS" || viewMode === "TIMELINE_PHASES") {
      return materialCalcResult.grandTotalCost;
    }
    const raw = totalArea * effectiveBaseRate;
    const cont = (raw * contingencyPct) / 100;
    return Math.round(raw + additionalWorksCost + cont - discountAmount);
  }, [
    viewMode,
    materialCalcResult.grandTotalCost,
    totalArea,
    effectiveBaseRate,
    contingencyPct,
    additionalWorksCost,
    discountAmount
  ]);

  const effectiveRatePerSqFt = totalArea > 0 ? Math.round(effectiveGrandTotal / totalArea) : effectiveBaseRate;

  // Preset Handlers
  const handleApplyPreset = (presetType: "ULTRATECH" | "STANDARD" | "PREMIUM" | "LUXURY") => {
    if (presetType === "ULTRATECH") {
      // Benchmark based on UltraTech reference document
      const copy = JSON.parse(JSON.stringify(DEFAULT_MATERIAL_ITEMS));
      setMaterials(copy);
      setContingencyPct(3);
      setAdditionalWorksCost(35000);
      setSimpleBaseRate(2250);
    } else if (presetType === "STANDARD") {
      const copy: MaterialCostItem[] = JSON.parse(JSON.stringify(DEFAULT_MATERIAL_ITEMS));
      copy.forEach((item) => {
        item.qualityGrade = "Standard";
        if (item.qualityOptions[0]) item.unitRate = item.qualityOptions[0].rate;
      });
      setMaterials(copy);
      setSimpleBaseRate(2050);
    } else if (presetType === "PREMIUM") {
      const copy: MaterialCostItem[] = JSON.parse(JSON.stringify(DEFAULT_MATERIAL_ITEMS));
      copy.forEach((item) => {
        item.qualityGrade = "Medium";
        if (item.qualityOptions[1]) item.unitRate = item.qualityOptions[1].rate;
      });
      setMaterials(copy);
      setSimpleBaseRate(2450);
    } else if (presetType === "LUXURY") {
      const copy: MaterialCostItem[] = JSON.parse(JSON.stringify(DEFAULT_MATERIAL_ITEMS));
      copy.forEach((item) => {
        item.qualityGrade = "Premium";
        if (item.qualityOptions[2]) item.unitRate = item.qualityOptions[2].rate;
      });
      setMaterials(copy);
      setSimpleBaseRate(3100);
    }
  };

  const handleUpdateMaterialItem = (id: string, updates: Partial<MaterialCostItem>) => {
    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...updates };
      })
    );
  };

  const handleQualityChange = (id: string, grade: "Standard" | "Medium" | "Premium") => {
    setMaterials((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const optIndex = grade === "Standard" ? 0 : grade === "Medium" ? 1 : 2;
        const selectedOpt = item.qualityOptions[optIndex] || item.qualityOptions[0];
        return {
          ...item,
          qualityGrade: grade,
          unitRate: selectedOpt.rate
        };
      })
    );
  };

  const handlePrintCostSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-800 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>MATERIAL & LABOUR BASE RATE ENGINE</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-800">
              ULTRATECH REFERENCE BENCHMARK
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight font-sans">
            അടിസ്ഥാന നിരക്ക് & നിർമ്മാണ ചെലവ് കാൽക്കുലേറ്റർ
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            CALCULATE SQUARE FEET BASE RATE (₹/SQ.FT) FROM MATERIALS, LABOUR & TIMELINE PHASES
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("MATERIALS")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "MATERIALS"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>മെറ്റീരിയൽ & ലേബർ നിരക്ക് (Materials & Labour)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("TIMELINE_PHASES")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "TIMELINE_PHASES"
                ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ടൈംലൈൻ & ഫേസ് കോസ്റ്റ് (Timeline Tracking)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("DETAILED_STAGES")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "DETAILED_STAGES"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>സ്റ്റേജ് ബ്രേക്ക്ഡൗൺ (Stages)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("SIMPLE")}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === "SIMPLE"
                ? "bg-slate-800 text-white shadow-md shadow-slate-950"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ലളിതമായ രീതി (Simple)</span>
          </button>
        </div>
      </div>

      {/* Market Presets & Quick Selectors */}
      <div className="bg-slate-900/90 border border-slate-800/80 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="font-bold">കേരള മാർക്കറ്റ് നിരക്ക് പ്രീസെറ്റുകൾ (Quick Presets):</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset("ULTRATECH")}
            className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>UltraTech Benchmark (₹2,250/Sq.Ft)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("STANDARD")}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
          >
            <span>Standard Budget (₹2,050/Sq.Ft)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("PREMIUM")}
            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
          >
            <span>Premium Residential (₹2,450/Sq.Ft)</span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset("LUXURY")}
            className="px-3 py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-700 text-purple-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
          >
            <span>Luxury Architect Villa (₹3,100/Sq.Ft)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Floor Areas & Config */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Floor Area Entry */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <Layers className="w-4 h-4" />
                <span>നിലകളുടെ വിസ്തീർണ്ണം (Floor Plinth Areas)</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFloors([
                    ...floors,
                    {
                      floorName: `Floor ${floors.length + 1} (${floors.length === 1 ? "ഒന്നാം നില" : "മുകൾ നില"})`,
                      areaSqFt: 600
                    }
                  ])
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ഫ്ലോർ ചേർക്കുക</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {floors.map((floor, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    value={floor.floorName}
                    onChange={(e) => {
                      const copy = [...floors];
                      copy[idx].floorName = e.target.value;
                      setFloors(copy);
                    }}
                    className="flex-1 bg-transparent text-white font-mono text-xs border-b border-slate-700 pb-1 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="relative w-36">
                    <input
                      type="number"
                      min={0}
                      value={floor.areaSqFt || ""}
                      onChange={(e) => {
                        const copy = [...floors];
                        copy[idx].areaSqFt = parseFloat(e.target.value) || 0;
                        setFloors(copy);
                      }}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-right text-emerald-400 font-mono font-bold text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-mono">
                      Sq.Ft
                    </span>
                  </div>
                  {floors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFloors(floors.filter((_, i) => i !== idx))}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                      title="Remove Floor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-cyan-950/40 border border-cyan-700/50 rounded-2xl flex justify-between items-center font-mono">
              <span className="text-xs text-slate-300 font-bold">
                ആകെ പ്ലിന്ത് ഏരിയ (Total Built-up Area):
              </span>
              <span className="text-cyan-400 font-bold text-base">
                {totalArea.toLocaleString()} Sq.Ft
              </span>
            </div>
          </div>

          {/* 2. MODE: MATERIALS & LABOUR BREAKDOWN (Page 2 of PDF) */}
          {viewMode === "MATERIALS" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span>മെറ്റീരിയൽ & ലേബർ നിരക്കുകൾ (Materials, Rates & Quality)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Based on UltraTech Cost Calculator Reference (1,000 Sq.Ft Base Scaling)
                  </p>
                </div>
                <div className="text-xs font-mono font-bold px-3 py-1 bg-slate-950 text-cyan-300 border border-cyan-800 rounded-xl">
                  Calculated: ₹{materialCalcResult.baseRatePerSqFt} / Sq.Ft
                </div>
              </div>

              {/* Category Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">സ്ട്രക്ചറൽ (Structural)</div>
                  <div className="text-cyan-400 font-bold mt-0.5">
                    {formatIndianCurrency(materialCalcResult.categoryBreakdown.structuralCost)}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {materialCalcResult.categoryBreakdown.structuralPct}%
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">ഫിനിഷിംഗ് (Finishing)</div>
                  <div className="text-purple-400 font-bold mt-0.5">
                    {formatIndianCurrency(materialCalcResult.categoryBreakdown.finishingCost)}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {materialCalcResult.categoryBreakdown.finishingPct}%
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">MEP (വയറിംഗ്/പ്ലംബിംഗ്)</div>
                  <div className="text-amber-400 font-bold mt-0.5">
                    {formatIndianCurrency(materialCalcResult.categoryBreakdown.mepCost)}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {materialCalcResult.categoryBreakdown.mepPct}%
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">ലേബർ കൂലി (Labour)</div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    {formatIndianCurrency(materialCalcResult.categoryBreakdown.labourCost)}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {materialCalcResult.categoryBreakdown.labourPct}%
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                {materials.map((item, idx) => {
                  const mb = materialCalcResult.materialBreakdown.find((b) => b.item.id === item.id);
                  const calculatedQty = mb ? mb.calculatedQty : 0;
                  const calculatedCost = mb ? mb.calculatedCost : 0;
                  const isLabour = item.category === "LABOUR";

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        item.isIncluded
                          ? "bg-slate-950 border-slate-800 hover:border-slate-700"
                          : "bg-slate-950/40 border-slate-900 opacity-60"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Title & Checkbox */}
                        <div className="flex items-start gap-2.5 flex-1">
                          <input
                            type="checkbox"
                            checked={item.isIncluded}
                            onChange={(e) =>
                              handleUpdateMaterialItem(item.id, { isIncluded: e.target.checked })
                            }
                            className="mt-1 text-cyan-500 rounded cursor-pointer"
                          />
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{item.malayalamName}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                ({item.name})
                              </span>
                              {isLabour && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px]">
                                  LABOUR
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {calculatedQty.toLocaleString()} {item.unit} • {item.description}
                            </div>
                          </div>
                        </div>

                        {/* Quality Grade Radios */}
                        {!isLabour && item.qualityOptions.length > 0 && (
                          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                            {(["Standard", "Medium", "Premium"] as const).map((grade) => (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => handleQualityChange(item.id, grade)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                                  item.qualityGrade === grade
                                    ? "bg-cyan-600 text-white font-bold"
                                    : "text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {grade}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Rate & Cost Inputs */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-[9px] text-slate-500 font-mono">Unit Rate</div>
                            <div className="relative w-24">
                              <input
                                type="number"
                                value={item.unitRate}
                                onChange={(e) =>
                                  handleUpdateMaterialItem(item.id, {
                                    unitRate: parseFloat(e.target.value) || 0
                                  })
                                }
                                className="w-full p-1 bg-slate-900 border border-slate-700 rounded-lg text-right font-mono font-bold text-xs text-amber-300 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="text-right min-w-24">
                            <div className="text-[9px] text-slate-500 font-mono">Total Amount</div>
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              {formatIndianCurrency(calculatedCost)}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              ₹{(calculatedCost / (totalArea || 1)).toFixed(1)}/sq.ft
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. MODE: TIMELINE & PHASE-WISE TRACKING (Page 1 of PDF) */}
          {viewMode === "TIMELINE_PHASES" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>ടൈംലൈൻ & ഘട്ടം തിരിച്ചുള്ള ചെലവ് (Timeline Tracking)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Horizontal Graph Analysis (Overall duration: {materialCalcResult.totalDurationDays} Days)
                  </p>
                </div>
                <div className="px-3 py-1 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 font-mono text-xs font-bold">
                  {materialCalcResult.totalDurationDays} Days Total
                </div>
              </div>

              {/* Visual Horizontal Graph Bars (Matching PDF Page 1) */}
              <div className="space-y-3.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono border-b border-slate-800 pb-1.5">
                  <span>PHASE & DURATION</span>
                  <span>ESTIMATED COST & SHARE (%)</span>
                </div>

                {materialCalcResult.phaseBreakdown.map((item, idx) => {
                  return (
                    <div key={item.phase.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.phase.color }}
                          />
                          <span className="font-bold text-slate-200">
                            {item.phase.malayalamName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({item.phase.name})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[11px]">
                            {item.durationDays < 10 ? `0${item.durationDays}` : item.durationDays} Days
                          </span>
                          <span className="font-bold text-emerald-400">
                            {formatIndianCurrency(item.cost)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 bg-slate-900 rounded-full overflow-hidden flex relative">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(item.percentage * 4, 8)}%`,
                            backgroundColor: item.phase.color
                          }}
                        />
                        <span className="absolute right-2 top-0 text-[8px] text-slate-500 font-mono">
                          {item.percentage}% ({formatIndianCurrency(item.costPerSqFt, false)}/sq.ft)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans pl-4">
                        {item.phase.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. MODE: DETAILED STAGES BREAKDOWN */}
          {viewMode === "DETAILED_STAGES" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>ഘട്ടം തിരിച്ചുള്ള നിരക്കുകൾ (Detailed Stage Rates)</span>
                </div>
                <div className="text-xs font-mono font-bold text-indigo-300">
                  Total: ₹{detailedComputedRate} / Sq.Ft
                </div>
              </div>

              <div className="space-y-2.5">
                {detailedStages.map((st, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={st.enabled}
                        onChange={(e) => {
                          const copy = [...detailedStages];
                          copy[idx].enabled = e.target.checked;
                          setDetailedStages(copy);
                        }}
                        className="text-indigo-500 rounded"
                      />
                      <span
                        className={
                          st.enabled
                            ? "text-white font-mono font-bold"
                            : "text-slate-500 line-through font-mono"
                        }
                      >
                        {st.name}
                      </span>
                    </label>

                    <div className="relative w-32">
                      <input
                        type="number"
                        disabled={!st.enabled}
                        value={st.ratePerSqFt}
                        onChange={(e) => {
                          const copy = [...detailedStages];
                          copy[idx].ratePerSqFt = parseFloat(e.target.value) || 0;
                          setDetailedStages(copy);
                        }}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-xl text-right font-mono font-bold text-indigo-300"
                      />
                      <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">
                        ₹/Sq.Ft
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. MODE: SIMPLE BASE RATE */}
          {viewMode === "SIMPLE" && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-emerald-400">
                <Sliders className="w-4 h-4" />
                <span>അടിസ്ഥാന നിരക്ക് (Base Rate / Sq.Ft)</span>
              </div>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="number"
                    value={simpleBaseRate}
                    onChange={(e) => setSimpleBaseRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-2xl text-emerald-400 font-mono font-black text-xl"
                  />
                  <span className="absolute right-4 top-4 text-xs text-slate-500 font-mono font-bold">
                    ₹ / Sq.Ft
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  {[2000, 2150, 2250, 2350, 2500, 2750, 3000, 3250].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSimpleBaseRate(r)}
                      className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                        simpleBaseRate === r
                          ? "bg-emerald-600 text-white border-emerald-500 font-bold"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      ₹{r}/Sq.Ft
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Calculations Summary & Proceed Button */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <Calculator className="w-4 h-4" />
                <span>ചെലവ് കണക്ക് (Estimated Cost Summary)</span>
              </div>
              <button
                type="button"
                onClick={handlePrintCostSheet}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
                title="Print Cost Sheet"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

            {/* Computation Breakdown */}
            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span>
                  പ്രാഥമിക തുക ({totalArea.toLocaleString()} Sq.Ft × ₹{effectiveBaseRate}):
                </span>
                <span className="font-bold text-white">
                  {formatIndianCurrency(totalArea * effectiveBaseRate)}
                </span>
              </div>

              {viewMode === "MATERIALS" && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400 text-[11px] pl-2">
                    <span>• സാധനസാമഗ്രികൾ (Materials Total):</span>
                    <span className="text-cyan-300">
                      {formatIndianCurrency(materialCalcResult.totalMaterialCost)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60 text-slate-400 text-[11px] pl-2">
                    <span>• ലേബർ കൂലി (Labour Total):</span>
                    <span className="text-emerald-300">
                      {formatIndianCurrency(materialCalcResult.totalLabourCost)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
                <span>അധിക ജോലികൾ (Additional Works):</span>
                <div className="relative w-32">
                  <input
                    type="number"
                    value={additionalWorksCost}
                    onChange={(e) => setAdditionalWorksCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded-xl text-right text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span>കണ്ടിൻജൻസി (Contingency):</span>
                  <select
                    value={contingencyPct}
                    onChange={(e) => setContingencyPct(parseFloat(e.target.value) || 0)}
                    className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] rounded px-1.5 py-0.5"
                  >
                    <option value={0}>0%</option>
                    <option value={2}>2%</option>
                    <option value={3}>3%</option>
                    <option value={5}>5%</option>
                  </select>
                </div>
                <span className="text-white">
                  {formatIndianCurrency(((totalArea * effectiveBaseRate) * contingencyPct) / 100)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 text-slate-300">
                <span>ഇളവ് / ഡിസ്കൗണ്ട് (Discount):</span>
                <div className="relative w-32">
                  <input
                    type="number"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 rounded-xl text-right text-rose-400 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Grand Total Box */}
              <div className="p-4 bg-slate-950 border border-cyan-900/50 rounded-2xl space-y-2 mt-4 shadow-inner">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span>ആകെ നിർമ്മാണ ചെലവ്:</span>
                  <span className="text-emerald-400 font-black text-xl">
                    {formatIndianCurrency(effectiveGrandTotal)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-serif leading-tight">
                  {convertAmountToWords(effectiveGrandTotal)}
                </div>
                <div className="text-[11px] text-slate-300 font-sans leading-tight">
                  ({convertAmountToMalayalamWords(effectiveGrandTotal)})
                </div>
                <div className="flex justify-between items-center text-[10px] text-cyan-400 pt-2 border-t border-slate-800 font-mono font-bold">
                  <span>യഥാർത്ഥ നിരക്ക്: ₹{effectiveRatePerSqFt} / Sq.Ft</span>
                  <span>വിസ്തീർണ്ണം: {totalArea.toLocaleString()} Sq.Ft</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() =>
                  onProceedToProject({
                    totalArea,
                    baseRate: effectiveBaseRate,
                    totalCost: effectiveGrandTotal,
                    floors
                  })
                }
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-xl shadow-emerald-950 transition cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                <span>ഈ അടിസ്ഥാന നിരക്കിൽ പ്രോജക്ട് / കരാർ ആരംഭിക്കുക</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
