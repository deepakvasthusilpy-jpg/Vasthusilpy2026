import React, { useState, useMemo } from "react";
import {
  Calculator,
  Layers,
  FileCode,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Info,
  ShieldCheck,
  Package,
  Boxes,
  ArrowRight,
  Download,
  Upload,
  BookOpen
} from "lucide-react";

export type StructuralMemberType = "beam" | "column" | "slab" | "footing";

export interface BbsInputData {
  memberType: StructuralMemberType;
  quantity: number;
  dimensions: {
    length_m: number;
    breadth_m: number;
    depth_or_thickness_m: number;
    clearCover_mm: number;
  };
  concreteGrade: string;
  mixRatio: string;
  reinforcement: {
    mainBars: {
      diameter_mm: number;
      count: number;
      spacing_mm: number;
    };
    topHangerBars?: {
      diameter_mm: number;
      count: number;
    };
    distributionOrStirrupBars: {
      diameter_mm: number;
      spacing_mm: number;
    };
    developmentLength_bar_dia_multiple: number;
    lapLength_bar_dia_multiple: number;
  };
  wastagePercent: number;
}

export interface BbsItemResult {
  barMark: string;
  member: string;
  diameter_mm: number;
  shape: string;
  cuttingLength_m: number;
  numberOfBars: number;
  totalLength_m: number;
  unitWeight_kgPerM: number;
  totalWeight_kg: number;
}

export interface CalculationOutput {
  summary: {
    memberType: string;
    concreteVolume_m3: number;
    cementBags: number;
    sandVolume_m3: number;
    sandWeight_kg: number;
    aggregateVolume_m3: number;
    aggregateWeight_kg: number;
    totalSteelWeight_kg: number;
    totalSteelWeight_quintals: number;
    wastageAllowance_kg: number;
  };
  barBendingSchedule: BbsItemResult[];
  notes: string[];
}

const NOMINAL_MIX_RATIOS: Record<string, string> = {
  M10: "1:3:6",
  M15: "1:2:4",
  M20: "1:1.5:3",
  M25: "1:1:2",
  M30: "1:0.75:1.5",
  M35: "1:0.5:1"
};

const DEFAULT_COVERS: Record<StructuralMemberType, number> = {
  slab: 20,
  beam: 25,
  column: 40,
  footing: 50
};

const PRESETS: Record<string, { label: string; desc: string; data: BbsInputData }> = {
  plinth_beam: {
    label: "Standard Kerala Plinth Beam (200x300mm)",
    desc: "4.5m span, M20 grade, 4-T16 main, 2-T12 hanger, 8mm stirrups @ 150 c/c",
    data: {
      memberType: "beam",
      quantity: 1,
      dimensions: {
        length_m: 4.5,
        breadth_m: 0.2,
        depth_or_thickness_m: 0.3,
        clearCover_mm: 25
      },
      concreteGrade: "M20",
      mixRatio: "1:1.5:3",
      reinforcement: {
        mainBars: {
          diameter_mm: 16,
          count: 4,
          spacing_mm: 0
        },
        topHangerBars: {
          diameter_mm: 12,
          count: 2
        },
        distributionOrStirrupBars: {
          diameter_mm: 8,
          spacing_mm: 150
        },
        developmentLength_bar_dia_multiple: 50,
        lapLength_bar_dia_multiple: 50
      },
      wastagePercent: 5
    }
  },
  column_standard: {
    label: "Standard R.C.C Column (200x300mm)",
    desc: "3.0m height, M20 grade, 6-T16 vertical bars, 8mm lateral ties @ 150 c/c",
    data: {
      memberType: "column",
      quantity: 1,
      dimensions: {
        length_m: 3.0, // height
        breadth_m: 0.2,
        depth_or_thickness_m: 0.3,
        clearCover_mm: 40
      },
      concreteGrade: "M20",
      mixRatio: "1:1.5:3",
      reinforcement: {
        mainBars: {
          diameter_mm: 16,
          count: 6,
          spacing_mm: 0
        },
        distributionOrStirrupBars: {
          diameter_mm: 8,
          spacing_mm: 150
        },
        developmentLength_bar_dia_multiple: 50,
        lapLength_bar_dia_multiple: 50
      },
      wastagePercent: 5
    }
  },
  roof_slab: {
    label: "Residential Roof Slab (6.0m x 4.0m x 120mm)",
    desc: "M20 concrete, 10mm main bars @ 150 c/c, 8mm distribution @ 175 c/c",
    data: {
      memberType: "slab",
      quantity: 1,
      dimensions: {
        length_m: 6.0,
        breadth_m: 4.0,
        depth_or_thickness_m: 0.12,
        clearCover_mm: 20
      },
      concreteGrade: "M20",
      mixRatio: "1:1.5:3",
      reinforcement: {
        mainBars: {
          diameter_mm: 10,
          count: 0,
          spacing_mm: 150
        },
        distributionOrStirrupBars: {
          diameter_mm: 8,
          spacing_mm: 175
        },
        developmentLength_bar_dia_multiple: 50,
        lapLength_bar_dia_multiple: 50
      },
      wastagePercent: 4
    }
  },
  isolated_footing: {
    label: "Isolated Column Footing (1.5m x 1.5m x 350mm)",
    desc: "M20 concrete, 12mm mesh reinforcement @ 150 c/c both ways",
    data: {
      memberType: "footing",
      quantity: 1,
      dimensions: {
        length_m: 1.5,
        breadth_m: 1.5,
        depth_or_thickness_m: 0.35,
        clearCover_mm: 50
      },
      concreteGrade: "M20",
      mixRatio: "1:1.5:3",
      reinforcement: {
        mainBars: {
          diameter_mm: 12,
          count: 0,
          spacing_mm: 150
        },
        distributionOrStirrupBars: {
          diameter_mm: 12,
          spacing_mm: 150
        },
        developmentLength_bar_dia_multiple: 50,
        lapLength_bar_dia_multiple: 50
      },
      wastagePercent: 5
    }
  }
};

/**
 * Pure calculation function implementing exact IS 456 & IS 2502 standards
 */
export function calculateStructuralQuantityAndBBS(input: BbsInputData): CalculationOutput {
  const notes: string[] = [];

  const {
    memberType,
    quantity = 1,
    dimensions,
    concreteGrade = "M20",
    mixRatio,
    reinforcement,
    wastagePercent = 5
  } = input || {};

  const length_m = Number(dimensions?.length_m) || 0;
  const breadth_m = Number(dimensions?.breadth_m) || 0;
  const depth_m = Number(dimensions?.depth_or_thickness_m) || 0;
  let clearCover_mm = Number(dimensions?.clearCover_mm);

  // Validate required inputs
  if (!length_m || length_m <= 0) {
    notes.push("Length / Span (length_m) is missing or 0. Please supply a valid positive dimension.");
  }
  if (!breadth_m || breadth_m <= 0) {
    notes.push("Breadth / Width (breadth_m) is missing or 0. Please supply a valid positive dimension.");
  }
  if (!depth_m || depth_m <= 0) {
    notes.push("Depth / Thickness (depth_or_thickness_m) is missing or 0. Please supply a valid positive dimension.");
  }

  if (isNaN(clearCover_mm) || clearCover_mm <= 0) {
    clearCover_mm = DEFAULT_COVERS[memberType] || 25;
    notes.push(`Clear cover not specified; assumed IS 456 standard ${clearCover_mm}mm for ${memberType}.`);
  }

  // Sanity check flags
  if (memberType === "column" && depth_m > 2.0) {
    notes.push("Warning: Column depth exceeds 2.0m. Verify if this is a shear wall or large pier.");
  }
  if (memberType === "slab" && depth_m > 0.5) {
    notes.push("Warning: Slab thickness exceeds 500mm. Verify if this is a raft foundation or transfer slab.");
  }

  // If critical fields are missing, return early empty output
  if (!length_m || !breadth_m || !depth_m) {
    return {
      summary: {
        memberType: memberType || "unknown",
        concreteVolume_m3: 0,
        cementBags: 0,
        sandVolume_m3: 0,
        sandWeight_kg: 0,
        aggregateVolume_m3: 0,
        aggregateWeight_kg: 0,
        totalSteelWeight_kg: 0,
        totalSteelWeight_quintals: 0,
        wastageAllowance_kg: 0
      },
      barBendingSchedule: [],
      notes
    };
  }

  /* ----------------------------------------------------
   * 1. CONCRETE VOLUME & DRY MIX FACTOR (1.54)
   * ---------------------------------------------------- */
  const concreteVolume_m3 = Number((length_m * breadth_m * depth_m * (quantity || 1)).toFixed(3));
  const dryVolume_m3 = concreteVolume_m3 * 1.54;

  /* ----------------------------------------------------
   * 2. MATERIAL SPLIT FROM MIX RATIO (IS 456)
   * ---------------------------------------------------- */
  let ratioStr = mixRatio;
  if (!ratioStr || ratioStr.trim() === "") {
    ratioStr = NOMINAL_MIX_RATIOS[concreteGrade] || "1:1.5:3";
    notes.push(`Mix ratio not provided; using nominal mix ${ratioStr} for grade ${concreteGrade} per IS 456.`);
  }

  const parts = ratioStr.split(":").map((p) => parseFloat(p.trim()));
  const a = parts[0] || 1;
  const b = parts[1] || 1.5;
  const c = parts[2] || 3;
  const sumRatio = a + b + c;

  const cementVol_m3 = dryVolume_m3 * (a / sumRatio);
  const cementBags = Number((cementVol_m3 / 0.0347).toFixed(2)); // 1 bag = 0.0347 m³ (50kg)

  const sandVol_m3 = Number((dryVolume_m3 * (b / sumRatio)).toFixed(3));
  const sandWeight_kg = Number((sandVol_m3 * 1600).toFixed(1)); // 1 m³ sand ≈ 1600 kg

  const aggVol_m3 = Number((dryVolume_m3 * (c / sumRatio)).toFixed(3));
  const aggWeight_kg = Number((aggVol_m3 * 1450).toFixed(1)); // 1 m³ coarse aggregate ≈ 1450 kg

  /* ----------------------------------------------------
   * 3. STEEL REINFORCEMENT & BAR BENDING SCHEDULE (BBS)
   * ---------------------------------------------------- */
  const Ld_mult = Number(reinforcement?.developmentLength_bar_dia_multiple) || 50;
  if (!reinforcement?.developmentLength_bar_dia_multiple) {
    notes.push("Development length (Ld) multiple not specified; assumed 50d per IS 456 (M20/Fe500).");
  }

  const cover_m = clearCover_mm / 1000;
  const bbsList: BbsItemResult[] = [];

  const mainDia = Number(reinforcement?.mainBars?.diameter_mm) || 12;
  const mainCount = Number(reinforcement?.mainBars?.count) || 0;
  const mainSpacing = Number(reinforcement?.mainBars?.spacing_mm) || 150;

  const secDia = Number(reinforcement?.distributionOrStirrupBars?.diameter_mm) || 8;
  const secSpacing = Number(reinforcement?.distributionOrStirrupBars?.spacing_mm) || 150;

  const getUnitWeight = (d_mm: number) => Number(((d_mm * d_mm) / 162).toFixed(3));

  if (memberType === "beam") {
    // 1. Bottom Main Tension Bars
    const Ld_m = (Ld_mult * mainDia) / 1000;
    // Straight length + 2 L-bends - 2 * 90deg bend deductions (2d per bend per IS 2502)
    const bendDeduction_m = (2 * (2 * mainDia)) / 1000;
    const cutLen_main = Math.max(0, length_m - 2 * cover_m + 2 * Ld_m - bendDeduction_m);
    const num_main = (mainCount || 4) * quantity;
    const totLen_main = Number((cutLen_main * num_main).toFixed(2));
    const unitWt_main = getUnitWeight(mainDia);
    const totWt_main = Number((totLen_main * unitWt_main).toFixed(2));

    bbsList.push({
      barMark: "BM-01",
      member: `Beam (${breadth_m * 1000}x${depth_m * 1000}mm)`,
      diameter_mm: mainDia,
      shape: "L-bend (Bottom Main)",
      cuttingLength_m: Number(cutLen_main.toFixed(3)),
      numberOfBars: num_main,
      totalLength_m: totLen_main,
      unitWeight_kgPerM: unitWt_main,
      totalWeight_kg: totWt_main
    });

    // 2. Top Hanger Bars (if provided or default 2 bars)
    const topDia = Number(reinforcement?.topHangerBars?.diameter_mm) || 12;
    const topCount = Number(reinforcement?.topHangerBars?.count) || 2;
    if (topCount > 0) {
      const topLd_m = (Ld_mult * topDia) / 1000;
      const topBendDeduct_m = (2 * (2 * topDia)) / 1000;
      const cutLen_top = Math.max(0, length_m - 2 * cover_m + 2 * topLd_m - topBendDeduct_m);
      const num_top = topCount * quantity;
      const totLen_top = Number((cutLen_top * num_top).toFixed(2));
      const unitWt_top = getUnitWeight(topDia);
      const totWt_top = Number((totLen_top * unitWt_top).toFixed(2));

      bbsList.push({
        barMark: "BM-02",
        member: `Beam Top Hangers`,
        diameter_mm: topDia,
        shape: "L-bend (Top Anchor)",
        cuttingLength_m: Number(cutLen_top.toFixed(3)),
        numberOfBars: num_top,
        totalLength_m: totLen_top,
        unitWeight_kgPerM: unitWt_top,
        totalWeight_kg: totWt_top
      });
    }

    // 3. Stirrups (2-Legged Vertical Stirrups)
    const stirrupA = Math.max(0.05, breadth_m - 2 * cover_m);
    const stirrupB = Math.max(0.05, depth_m - 2 * cover_m);
    // IS 2502: Hook allowance = 2 * 9d; Bend deduction = 4 * 90deg bends (-2d each = -8d)
    const hookLen_m = (2 * (9 * secDia)) / 1000;
    const bendDeductStirrup_m = (4 * (2 * secDia)) / 1000;
    const cutLen_stirrup = Number((2 * (stirrupA + stirrupB) + hookLen_m - bendDeductStirrup_m).toFixed(3));

    const clearSpan_m = Math.max(0, length_m - 2 * cover_m);
    const stirrupsPerBeam = Math.ceil((clearSpan_m / (secSpacing / 1000))) + 1;
    const num_stirrups = stirrupsPerBeam * quantity;
    const totLen_stirrup = Number((cutLen_stirrup * num_stirrups).toFixed(2));
    const unitWt_stirrup = getUnitWeight(secDia);
    const totWt_stirrup = Number((totLen_stirrup * unitWt_stirrup).toFixed(2));

    bbsList.push({
      barMark: "BM-03",
      member: `Beam Stirrups`,
      diameter_mm: secDia,
      shape: "2-Legged Stirrup (135° hook)",
      cuttingLength_m: cutLen_stirrup,
      numberOfBars: num_stirrups,
      totalLength_m: totLen_stirrup,
      unitWeight_kgPerM: unitWt_stirrup,
      totalWeight_kg: totWt_stirrup
    });
  } else if (memberType === "column") {
    // 1. Column Vertical Main Bars
    // Clear height + Footing embedment (Ld) + Lap length (Ld) - 90deg bend
    const Ld_m = (Ld_mult * mainDia) / 1000;
    const lap_m = (Ld_mult * mainDia) / 1000;
    const bendDeduct_m = (2 * mainDia) / 1000; // 1 bend into footing
    const cutLen_main = Math.max(0, length_m + Ld_m + lap_m - bendDeduct_m);
    const num_main = (mainCount || 6) * quantity;
    const totLen_main = Number((cutLen_main * num_main).toFixed(2));
    const unitWt_main = getUnitWeight(mainDia);
    const totWt_main = Number((totLen_main * unitWt_main).toFixed(2));

    bbsList.push({
      barMark: "COL-01",
      member: `Column Vertical Bars`,
      diameter_mm: mainDia,
      shape: "L-bend with Lap Splice",
      cuttingLength_m: Number(cutLen_main.toFixed(3)),
      numberOfBars: num_main,
      totalLength_m: totLen_main,
      unitWeight_kgPerM: unitWt_main,
      totalWeight_kg: totWt_main
    });

    // 2. Lateral Ties
    const tieA = Math.max(0.05, breadth_m - 2 * cover_m);
    const tieB = Math.max(0.05, depth_m - 2 * cover_m);
    const hookLen_m = (2 * (9 * secDia)) / 1000;
    const bendDeductTie_m = (4 * (2 * secDia)) / 1000;
    const cutLen_tie = Number((2 * (tieA + tieB) + hookLen_m - bendDeductTie_m).toFixed(3));

    const tiesPerColumn = Math.ceil((length_m - 2 * cover_m) / (secSpacing / 1000)) + 1;
    const num_ties = tiesPerColumn * quantity;
    const totLen_tie = Number((cutLen_tie * num_ties).toFixed(2));
    const unitWt_tie = getUnitWeight(secDia);
    const totWt_tie = Number((totLen_tie * unitWt_tie).toFixed(2));

    bbsList.push({
      barMark: "COL-02",
      member: `Column Lateral Ties`,
      diameter_mm: secDia,
      shape: "Rectangular Tie (135° hook)",
      cuttingLength_m: cutLen_tie,
      numberOfBars: num_ties,
      totalLength_m: totLen_tie,
      unitWeight_kgPerM: unitWt_tie,
      totalWeight_kg: totWt_tie
    });
  } else if (memberType === "slab") {
    // 1. Main Bars (along Short Span breadth_m)
    const Ld_m = (Ld_mult * mainDia) / 1000;
    const bendDeduct_m = (2 * (2 * mainDia)) / 1000;
    const cutLen_main = Math.max(0, breadth_m - 2 * cover_m + 2 * Ld_m - bendDeduct_m);
    const barsInLongSpan = Math.ceil((length_m - 2 * cover_m) / (mainSpacing / 1000)) + 1;
    const num_main = barsInLongSpan * quantity;
    const totLen_main = Number((cutLen_main * num_main).toFixed(2));
    const unitWt_main = getUnitWeight(mainDia);
    const totWt_main = Number((totLen_main * unitWt_main).toFixed(2));

    bbsList.push({
      barMark: "SLB-01",
      member: `Slab Main Bars (Short Span)`,
      diameter_mm: mainDia,
      shape: "Straight / L-Hook into support",
      cuttingLength_m: Number(cutLen_main.toFixed(3)),
      numberOfBars: num_main,
      totalLength_m: totLen_main,
      unitWeight_kgPerM: unitWt_main,
      totalWeight_kg: totWt_main
    });

    // 2. Distribution Bars (along Long Span length_m)
    const distLd_m = (Ld_mult * secDia) / 1000;
    const distBendDeduct_m = (2 * (2 * secDia)) / 1000;
    const cutLen_dist = Math.max(0, length_m - 2 * cover_m + 2 * distLd_m - distBendDeduct_m);
    const barsInShortSpan = Math.ceil((breadth_m - 2 * cover_m) / (secSpacing / 1000)) + 1;
    const num_dist = barsInShortSpan * quantity;
    const totLen_dist = Number((cutLen_dist * num_dist).toFixed(2));
    const unitWt_dist = getUnitWeight(secDia);
    const totWt_dist = Number((totLen_dist * unitWt_dist).toFixed(2));

    bbsList.push({
      barMark: "SLB-02",
      member: `Slab Distribution Bars`,
      diameter_mm: secDia,
      shape: "Straight / L-Hook",
      cuttingLength_m: Number(cutLen_dist.toFixed(3)),
      numberOfBars: num_dist,
      totalLength_m: totLen_dist,
      unitWeight_kgPerM: unitWt_dist,
      totalWeight_kg: totWt_dist
    });
  } else if (memberType === "footing") {
    // 1. Mesh Bars X-Direction
    const upstand_m = Math.max(0.1, depth_m - 2 * cover_m);
    const bendDeduct_m = (2 * (2 * mainDia)) / 1000; // 2 x 90deg bends
    const cutLen_x = Math.max(0, length_m - 2 * cover_m + 2 * upstand_m - bendDeduct_m);
    const bars_y = Math.ceil((breadth_m - 2 * cover_m) / (mainSpacing / 1000)) + 1;
    const num_x = bars_y * quantity;
    const totLen_x = Number((cutLen_x * num_x).toFixed(2));
    const unitWt_x = getUnitWeight(mainDia);
    const totWt_x = Number((totLen_x * unitWt_x).toFixed(2));

    bbsList.push({
      barMark: "FTG-01",
      member: `Footing Mesh (X-Direction)`,
      diameter_mm: mainDia,
      shape: "U-Bend / Upstand Mesh",
      cuttingLength_m: Number(cutLen_x.toFixed(3)),
      numberOfBars: num_x,
      totalLength_m: totLen_x,
      unitWeight_kgPerM: unitWt_x,
      totalWeight_kg: totWt_x
    });

    // 2. Mesh Bars Y-Direction
    const cutLen_y = Math.max(0, breadth_m - 2 * cover_m + 2 * upstand_m - bendDeduct_m);
    const bars_x = Math.ceil((length_m - 2 * cover_m) / (secSpacing / 1000)) + 1;
    const num_y = bars_x * quantity;
    const totLen_y = Number((cutLen_y * num_y).toFixed(2));
    const unitWt_y = getUnitWeight(secDia);
    const totWt_y = Number((totLen_y * unitWt_y).toFixed(2));

    bbsList.push({
      barMark: "FTG-02",
      member: `Footing Mesh (Y-Direction)`,
      diameter_mm: secDia,
      shape: "U-Bend / Upstand Mesh",
      cuttingLength_m: Number(cutLen_y.toFixed(3)),
      numberOfBars: num_y,
      totalLength_m: totLen_y,
      unitWeight_kgPerM: unitWt_y,
      totalWeight_kg: totWt_y
    });
  }

  // Steel Summaries
  const baseSteelWeight_kg = bbsList.reduce((acc, it) => acc + it.totalWeight_kg, 0);
  const wastage_kg = Number((baseSteelWeight_kg * (wastagePercent / 100)).toFixed(2));
  const totalSteel_kg = Number((baseSteelWeight_kg + wastage_kg).toFixed(2));
  const totalSteel_quintals = Number((totalSteel_kg / 100).toFixed(2));

  notes.push(`Standard hook allowances (9d) & 90° bend deductions (-2d per bend) applied per IS 2502 / SP-34.`);
  notes.push(`Unit weight calculated as d²/162 kg/m per Indian Standard practice.`);
  notes.push(`Dry volume multiplier 1.54 applied for void bulking & cement-mortar shrinkage.`);

  return {
    summary: {
      memberType,
      concreteVolume_m3,
      cementBags,
      sandVolume_m3: sandVol_m3,
      sandWeight_kg: sandWeight_kg,
      aggregateVolume_m3: aggVol_m3,
      aggregateWeight_kg: aggWeight_kg,
      totalSteelWeight_kg: totalSteel_kg,
      totalSteelWeight_quintals: totalSteel_quintals,
      wastageAllowance_kg: wastage_kg
    },
    barBendingSchedule: bbsList,
    notes
  };
}

export const StructuralQuantityBbsCalculator: React.FC = () => {
  // Active preset or state
  const [activePresetKey, setActivePresetKey] = useState<string>("plinth_beam");
  const [inputData, setInputData] = useState<BbsInputData>(PRESETS.plinth_beam.data);
  const [copiedJson, setCopiedJson] = useState(false);
  const [jsonInputModal, setJsonInputModal] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Compute results
  const output = useMemo(() => {
    return calculateStructuralQuantityAndBBS(inputData);
  }, [inputData]);

  // Handle Preset Load
  const handleSelectPreset = (key: string) => {
    setActivePresetKey(key);
    if (PRESETS[key]) {
      setInputData(JSON.parse(JSON.stringify(PRESETS[key].data)));
    }
  };

  // Handle Member Type Change
  const handleMemberTypeChange = (type: StructuralMemberType) => {
    const defaultCover = DEFAULT_COVERS[type];
    setInputData((prev) => ({
      ...prev,
      memberType: type,
      dimensions: {
        ...prev.dimensions,
        clearCover_mm: defaultCover
      }
    }));
  };

  // Handle Grade Change
  const handleGradeChange = (grade: string) => {
    const defaultRatio = NOMINAL_MIX_RATIOS[grade] || "1:1.5:3";
    setInputData((prev) => ({
      ...prev,
      concreteGrade: grade,
      mixRatio: defaultRatio
    }));
  };

  const jsonOutputString = useMemo(() => {
    return JSON.stringify(output, null, 2);
  }, [output]);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonOutputString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleImportJson = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(rawJsonText);
      if (!parsed.memberType || !parsed.dimensions) {
        throw new Error("JSON must include 'memberType' and 'dimensions' objects.");
      }
      setInputData(parsed);
      setJsonInputModal(false);
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON format");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                IS 456:2000 & IS 2502:1963 STANDARDS
              </span>
              <span className="bg-slate-800 text-slate-300 text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-700">
                KERALA PWD & STRUCTURAL DETAILING
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Material Quantity & BBS Estimator
              </span>
            </h1>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Calculate exact concrete volumes, cement bag counts, sand & aggregate splits, and complete 
              <strong className="text-amber-300"> Bar Bending Schedules (BBS)</strong> with standard 90°/135° hook allowances and bend deductions.
            </p>
          </div>

          {/* Quick Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setRawJsonText(JSON.stringify(inputData, null, 2));
                setJsonInputModal(true);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Import JSON Payload"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Input JSON</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy Output JSON Payload"
            >
              {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span>{copiedJson ? "Copied!" : "Copy Output JSON"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print BBS Report</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mr-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Presets:
          </span>
          {Object.entries(PRESETS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleSelectPreset(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                activePresetKey === key
                  ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
              }`}
            >
              {item.label.split(" (")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Inputs & Realtime Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                1. Structural Member & Geometry
              </h2>
              <span className="text-[11px] font-mono text-slate-400">IS 456 Details</span>
            </div>

            {/* Member Type Selection Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Member Classification</label>
              <div className="grid grid-cols-4 gap-2">
                {(["beam", "column", "slab", "footing"] as StructuralMemberType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleMemberTypeChange(t)}
                    className={`py-2 px-1 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                      inputData.memberType === t
                        ? "bg-amber-500 text-slate-950 shadow-md"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity of Identical Members */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">No. of Members (Qty)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={inputData.quantity || 1}
                  onChange={(e) =>
                    setInputData({
                      ...inputData,
                      quantity: Math.max(1, parseInt(e.target.value) || 1)
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-400">Clear Cover (mm)</label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={inputData.dimensions.clearCover_mm}
                  onChange={(e) =>
                    setInputData({
                      ...inputData,
                      dimensions: {
                        ...inputData.dimensions,
                        clearCover_mm: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Dimensions (Length, Breadth, Depth) */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-mono font-bold text-amber-400">
                Member Dimensions (in Meters)
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">
                    {inputData.memberType === "column" ? "Height (m)" : "Length (m)"}
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={inputData.dimensions.length_m}
                    onChange={(e) =>
                      setInputData({
                        ...inputData,
                        dimensions: {
                          ...inputData.dimensions,
                          length_m: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Breadth / Width (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputData.dimensions.breadth_m}
                    onChange={(e) =>
                      setInputData({
                        ...inputData,
                        dimensions: {
                          ...inputData.dimensions,
                          breadth_m: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">
                    {inputData.memberType === "slab" ? "Thickness (m)" : "Depth (m)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputData.dimensions.depth_or_thickness_m}
                    onChange={(e) =>
                      setInputData({
                        ...inputData,
                        dimensions: {
                          ...inputData.dimensions,
                          depth_or_thickness_m: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Concrete Mix & Grade */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-mono font-bold text-amber-400">
                2. Concrete Mix Specification
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Concrete Grade</label>
                  <select
                    value={inputData.concreteGrade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                  >
                    <option value="M10">M10 (1:3:6)</option>
                    <option value="M15">M15 (1:2:4)</option>
                    <option value="M20">M20 (1:1.5:3)</option>
                    <option value="M25">M25 (1:1:2)</option>
                    <option value="M30">M30 (1:0.75:1.5)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-slate-400">Volumetric Mix Ratio</label>
                  <input
                    type="text"
                    value={inputData.mixRatio}
                    onChange={(e) =>
                      setInputData({
                        ...inputData,
                        mixRatio: e.target.value
                      })
                    }
                    placeholder="e.g. 1:1.5:3"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Reinforcement Specifications */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs font-mono font-bold text-amber-400">
                3. Reinforcement & BBS Parameters
              </div>

              {/* Main Bars */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono font-bold text-slate-300">
                  Main Reinforcement ({inputData.memberType === "slab" || inputData.memberType === "footing" ? "Mesh / Spacing" : "Bars Count"})
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400">Bar Diameter (mm)</label>
                    <select
                      value={inputData.reinforcement.mainBars.diameter_mm}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          reinforcement: {
                            ...inputData.reinforcement,
                            mainBars: {
                              ...inputData.reinforcement.mainBars,
                              diameter_mm: parseInt(e.target.value) || 12
                            }
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    >
                      {[8, 10, 12, 16, 20, 25, 32].map((d) => (
                        <option key={d} value={d}>
                          {d} mm ({(d * d / 162).toFixed(3)} kg/m)
                        </option>
                      ))}
                    </select>
                  </div>

                  {inputData.memberType === "slab" || inputData.memberType === "footing" ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400">Spacing (mm c/c)</label>
                      <input
                        type="number"
                        step="10"
                        value={inputData.reinforcement.mainBars.spacing_mm}
                        onChange={(e) =>
                          setInputData({
                            ...inputData,
                            reinforcement: {
                              ...inputData.reinforcement,
                              mainBars: {
                                ...inputData.reinforcement.mainBars,
                                spacing_mm: parseInt(e.target.value) || 150
                              }
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400">No. of Bars</label>
                      <input
                        type="number"
                        min="2"
                        step="1"
                        value={inputData.reinforcement.mainBars.count}
                        onChange={(e) =>
                          setInputData({
                            ...inputData,
                            reinforcement: {
                              ...inputData.reinforcement,
                              mainBars: {
                                ...inputData.reinforcement.mainBars,
                                count: parseInt(e.target.value) || 4
                              }
                            }
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Stirrups / Distribution Bars */}
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[11px] font-mono font-bold text-slate-300">
                  {inputData.memberType === "beam"
                    ? "Stirrup Ties (2-Legged)"
                    : inputData.memberType === "column"
                    ? "Lateral Ties"
                    : inputData.memberType === "slab"
                    ? "Distribution Bars (Long Span)"
                    : "Footing Transverse Mesh (Y-Direction)"}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400">Diameter (mm)</label>
                    <select
                      value={inputData.reinforcement.distributionOrStirrupBars.diameter_mm}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          reinforcement: {
                            ...inputData.reinforcement,
                            distributionOrStirrupBars: {
                              ...inputData.reinforcement.distributionOrStirrupBars,
                              diameter_mm: parseInt(e.target.value) || 8
                            }
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    >
                      {[6, 8, 10, 12, 16].map((d) => (
                        <option key={d} value={d}>
                          {d} mm ({(d * d / 162).toFixed(3)} kg/m)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400">Spacing (mm c/c)</label>
                    <input
                      type="number"
                      step="10"
                      value={inputData.reinforcement.distributionOrStirrupBars.spacing_mm}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          reinforcement: {
                            ...inputData.reinforcement,
                            distributionOrStirrupBars: {
                              ...inputData.reinforcement.distributionOrStirrupBars,
                              spacing_mm: parseInt(e.target.value) || 150
                            }
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Ld, Lap & Wastage */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Dev Length (Ld)</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                    <input
                      type="number"
                      value={inputData.reinforcement.developmentLength_bar_dia_multiple}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          reinforcement: {
                            ...inputData.reinforcement,
                            developmentLength_bar_dia_multiple: parseInt(e.target.value) || 50
                          }
                        })
                      }
                      className="w-full bg-transparent text-white font-mono text-xs outline-none text-center"
                    />
                    <span className="text-slate-500 font-mono text-[10px]">×d</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Lap Length</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                    <input
                      type="number"
                      value={inputData.reinforcement.lapLength_bar_dia_multiple}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          reinforcement: {
                            ...inputData.reinforcement,
                            lapLength_bar_dia_multiple: parseInt(e.target.value) || 50
                          }
                        })
                      }
                      className="w-full bg-transparent text-white font-mono text-xs outline-none text-center"
                    />
                    <span className="text-slate-500 font-mono text-[10px]">×d</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Wastage (%)</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5">
                    <input
                      type="number"
                      value={inputData.wastagePercent}
                      onChange={(e) =>
                        setInputData({
                          ...inputData,
                          wastagePercent: parseFloat(e.target.value) || 0
                        })
                      }
                      className="w-full bg-transparent text-white font-mono text-xs outline-none text-center"
                    />
                    <span className="text-slate-500 font-mono text-[10px]">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary & BBS Schedule (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Concrete & Materials Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Concrete Vol</span>
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-300">
                {output.summary.concreteVolume_m3} <span className="text-xs text-slate-400 font-normal">m³</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Dry: {(output.summary.concreteVolume_m3 * 1.54).toFixed(2)} m³
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Cement Bags</span>
                <Package className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {output.summary.cementBags} <span className="text-xs text-slate-400 font-normal">bags</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {(output.summary.cementBags * 50).toFixed(0)} kg ({output.summary.cementBags ? (output.summary.cementBags * 50 / 1000).toFixed(2) : 0} T)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Sand (Fine Agg)</span>
                <Layers className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div className="text-xl font-bold font-mono text-yellow-300">
                {output.summary.sandVolume_m3} <span className="text-xs text-slate-400 font-normal">m³</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {output.summary.sandWeight_kg} kg ({(output.summary.sandWeight_kg / 1000).toFixed(2)} T)
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center justify-between">
                <span>Coarse Agg (20mm)</span>
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300">
                {output.summary.aggregateVolume_m3} <span className="text-xs text-slate-400 font-normal">m³</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {output.summary.aggregateWeight_kg} kg ({(output.summary.aggregateWeight_kg / 1000).toFixed(2)} T)
              </div>
            </div>
          </div>

          {/* Steel Reinforcement Grand Total Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Grand Total Steel Reinforcement (Fe500D)
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {output.summary.totalSteelWeight_kg} <span className="text-sm font-normal text-slate-400">kg</span>
                <span className="mx-2 text-slate-600">/</span>
                <span className="text-indigo-300">{output.summary.totalSteelWeight_quintals}</span>{" "}
                <span className="text-sm font-normal text-indigo-400">Quintals</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 space-y-1">
              <div className="text-[11px] font-mono text-slate-400">
                Base Net: {(output.summary.totalSteelWeight_kg - output.summary.wastageAllowance_kg).toFixed(2)} kg
              </div>
              <div className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/80">
                +{output.summary.wastageAllowance_kg} kg ({inputData.wastagePercent}% wastage)
              </div>
            </div>
          </div>

          {/* Bar Bending Schedule (BBS) Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  Bar Bending Schedule (BBS Table)
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Standard cutting lengths with IS 2502 hook additions and bend deductions
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Mark</th>
                    <th className="p-2.5">Member / Detail</th>
                    <th className="p-2.5 text-center">Dia</th>
                    <th className="p-2.5">Shape</th>
                    <th className="p-2.5 text-right">Cut L (m)</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Tot L (m)</th>
                    <th className="p-2.5 text-right">Unit Wt</th>
                    <th className="p-2.5 text-right font-bold text-amber-300">Total Wt (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {output.barBendingSchedule.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-emerald-400">{item.barMark}</td>
                      <td className="p-2.5 text-slate-300 font-sans">{item.member}</td>
                      <td className="p-2.5 text-center font-bold text-white">#{item.diameter_mm}</td>
                      <td className="p-2.5 text-slate-400">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                          {item.shape}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-200">{item.cuttingLength_m}</td>
                      <td className="p-2.5 text-center font-bold text-white">{item.numberOfBars}</td>
                      <td className="p-2.5 text-right text-slate-300">{item.totalLength_m}</td>
                      <td className="p-2.5 text-right text-slate-400">{item.unitWeight_kgPerM}</td>
                      <td className="p-2.5 text-right font-bold text-amber-400">{item.totalWeight_kg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & IS Compliance Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Structural Notes & Standards Compliance
            </div>

            <ul className="space-y-1.5 text-xs text-slate-400 font-sans">
              {output.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-mono">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* JSON Payload Inspector & Direct API View */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Exact Output JSON Schema (IS 456 / IS 2502 Standard)
            </h3>
          </div>
          <button
            onClick={handleCopyJson}
            className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedJson ? "Copied" : "Copy Schema"}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 scrollbar-thin">
          {jsonOutputString}
        </pre>
      </div>

      {/* JSON Input Modal */}
      {jsonInputModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                Paste / Import Custom Input JSON
              </h3>
              <button
                onClick={() => setJsonInputModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {jsonError && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs font-mono rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <p className="text-xs text-slate-400 font-mono">
              Provide input JSON containing memberType, dimensions, mixRatio, and reinforcement specifications:
            </p>

            <textarea
              rows={12}
              value={rawJsonText}
              onChange={(e) => setRawJsonText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setJsonInputModal(false)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono rounded-xl border border-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleImportJson}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Calculate from JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
