export interface MaterialCostItem {
  id: string;
  category: "STRUCTURAL" | "FINISHING" | "MEP" | "LABOUR";
  name: string;
  malayalamName: string;
  quantityPer1000SqFt: number;
  unit: string;
  qualityGrade: "Standard" | "Medium" | "Premium";
  qualityOptions: Array<{
    label: string;
    rate: number;
  }>;
  unitRate: number;
  description: string;
  isIncluded: boolean;
}

export interface PhaseTimelineItem {
  id: string;
  name: string;
  malayalamName: string;
  durationDays: number;
  baseCostPer1000SqFt: number;
  percentage: number;
  color: string;
  description: string;
}

// Reference Data from UltraTech & Kerala Construction Industry
export const DEFAULT_MATERIAL_ITEMS: MaterialCostItem[] = [
  {
    id: "mat_cement",
    category: "STRUCTURAL",
    name: "Cement (UltraTech / Coromandel / ACC)",
    malayalamName: "സിമന്റ് (Cement)",
    quantityPer1000SqFt: 450,
    unit: "Bags (ചാക്ക്)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Normal PPC/PSC (₹343/bag)", rate: 343 },
      { label: "UltraTech Super / Weatherplus (₹410/bag)", rate: 410 },
      { label: "UltraTech Weather Plus Premium (₹440/bag)", rate: 440 }
    ],
    unitRate: 410,
    description: "450 Bags per 1000 Sq.Ft (0.45 bags/sq.ft for RCC, Masonry & Plastering)",
    isIncluded: true
  },
  {
    id: "mat_steel",
    category: "STRUCTURAL",
    name: "Steel (TMT Fe550D Rebars)",
    malayalamName: "സ്റ്റീൽ / കമ്പി (TMT Steel)",
    quantityPer1000SqFt: 3500,
    unit: "KG (കിലോഗ്രാം)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Grade (₹46/kg)", rate: 46 },
      { label: "Medium Grade Fe550D (₹58/kg)", rate: 58 },
      { label: "Premium TMT (Tata Tiscon / JSW) (₹68/kg)", rate: 68 }
    ],
    unitRate: 58,
    description: "3.5 kg/sq.ft reinforcement for Footing, Columns, Beams & Roof Slabs",
    isIncluded: true
  },
  {
    id: "mat_bricks",
    category: "STRUCTURAL",
    name: "Bricks / Red Wirecut / Blocks",
    malayalamName: "ഇഷ്ടിക / സിമന്റ് കട്ട (Bricks/Blocks)",
    quantityPer1000SqFt: 19000,
    unit: "Per Piece (എണ്ണം)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Country Bricks (₹7/pc)", rate: 7 },
      { label: "Red Wirecut Bricks (₹9.5/pc)", rate: 9.5 },
      { label: "Solid Concrete Blocks (₹42/pc)", rate: 42 }
    ],
    unitRate: 9.5,
    description: "19,000 Country/Wirecut Bricks or ~1,600 Solid Concrete Blocks per 1000 sq.ft",
    isIncluded: true
  },
  {
    id: "mat_aggregate",
    category: "STRUCTURAL",
    name: "Coarse Aggregate (20mm & 40mm Metal)",
    malayalamName: "മെറ്റൽ / കരിങ്കൽ ചല്ലി (Aggregate)",
    quantityPer1000SqFt: 1900,
    unit: "Cubic Feet (Cu.Ft / അടി)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic 20mm (₹33/cft)", rate: 33 },
      { label: "Medium Blue Metal (₹38/cft)", rate: 38 },
      { label: "Premium Washed Quarry Metal (₹44/cft)", rate: 44 }
    ],
    unitRate: 38,
    description: "1.9 cu.ft per sq.ft for RCC Foundations, Lintels & Slabs",
    isIncluded: true
  },
  {
    id: "mat_sand",
    category: "STRUCTURAL",
    name: "Sand (M-Sand & P-Sand)",
    malayalamName: "എം-സാൻഡ് & പി-സാൻഡ് (Sand)",
    quantityPer1000SqFt: 2000,
    unit: "Cubic Feet (Cu.Ft / അടി)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic M-Sand (₹36/cft)", rate: 36 },
      { label: "Washed M-Sand + P-Sand (₹44/cft)", rate: 44 },
      { label: "Triple-Washed Premium P-Sand (₹52/cft)", rate: 52 }
    ],
    unitRate: 44,
    description: "2.0 cu.ft per sq.ft for Concreting, Masonry mortar and Plastering",
    isIncluded: true
  },
  {
    id: "mat_flooring",
    category: "FINISHING",
    name: "Flooring & Tiling (Vitrified / Granite)",
    malayalamName: "ഫ്ലോറിംഗ് & ടൈലുകൾ (Flooring & Tiles)",
    quantityPer1000SqFt: 1000,
    unit: "Sq.Feet (ചതുരശ്രയടി)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Ceramic / Basic Vitrified (₹65/sq.ft)", rate: 65 },
      { label: "Double Charge Vitrified 2x2/4x2 (₹98/sq.ft)", rate: 98 },
      { label: "Premium Granite & GVT Glazed (₹160/sq.ft)", rate: 160 }
    ],
    unitRate: 98,
    description: "Living, Dining, Bedroom vitrified tiles, skirting and adhesive grout",
    isIncluded: true
  },
  {
    id: "mat_windows",
    category: "FINISHING",
    name: "Windows & Safety Grills (UPVC / Hardwood)",
    malayalamName: "ജനലുകൾ & ഗ്രില്ലുകൾ (Windows & Grills)",
    quantityPer1000SqFt: 170,
    unit: "Sq.Feet (ചതുരശ്രയടി)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Hardwood / Steel Windows (₹160/sq.ft)", rate: 160 },
      { label: "UPVC Sliding Glazed + MS Grills (₹220/sq.ft)", rate: 220 },
      { label: "Teak / Premium UPVC Casement (₹340/sq.ft)", rate: 340 }
    ],
    unitRate: 220,
    description: "170 sq.ft total window openings with glass panes, locking and MS security grills",
    isIncluded: true
  },
  {
    id: "mat_doors",
    category: "FINISHING",
    name: "Doors (Teak Main Door, Flush & WPC/FRP)",
    malayalamName: "വാതിലുകൾ & ഫ്രെയിമുകൾ (Doors & Frames)",
    quantityPer1000SqFt: 180,
    unit: "Sq.Feet (ചതുരശ്രയടി)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Flush Doors (₹190/sq.ft)", rate: 190 },
      { label: "Teak Main + Hardwood Interior (₹280/sq.ft)", rate: 280 },
      { label: "Carved First Quality Teak (₹420/sq.ft)", rate: 420 }
    ],
    unitRate: 280,
    description: "180 sq.ft doors (Teak front door + 4 interior flush doors + 2 water-proof toilet doors)",
    isIncluded: true
  },
  {
    id: "mat_electrical",
    category: "MEP",
    name: "Electrical Materials & Fittings",
    malayalamName: "ഇലക്ട്രിക്കൽ വയറിംഗ് & ഫിറ്റിംഗ്സ് (Electrical)",
    quantityPer1000SqFt: 150,
    unit: "Points / Sq.Ft Rate",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Standard Conduits & Switches (₹65/sq.ft)", rate: 65 },
      { label: "Finolex/Havells + Modular Legrand (₹95/sq.ft)", rate: 95 },
      { label: "Schneider / Smart Automation (₹145/sq.ft)", rate: 145 }
    ],
    unitRate: 95,
    description: "FR PVC Wires, Heavy PVC pipes, Metal boxes, Modular switches, MCB & DB distribution board",
    isIncluded: true
  },
  {
    id: "mat_painting",
    category: "FINISHING",
    name: "Painting (Putty 2 coats, Primer & Emulsion)",
    malayalamName: "പെയിന്റിംഗ് & പുട്ടി (Painting)",
    quantityPer1000SqFt: 6000,
    unit: "Sq.Feet Wall Area (ചതുരശ്രയടി)",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Distemper / Whitewash (₹14/sq.ft)", rate: 14 },
      { label: "Birla Putty + Apex Interior/Exterior (₹24/sq.ft)", rate: 24 },
      { label: "Royale Luxury Emulsion & Texture (₹36/sq.ft)", rate: 36 }
    ],
    unitRate: 24,
    description: "Approx 6,000 sq.ft internal and external surface area per 1,000 sq.ft plinth area",
    isIncluded: true
  },
  {
    id: "mat_plumbing",
    category: "MEP",
    name: "Sanitaryware & Plumbing Materials",
    malayalamName: "പ്ലംബിംഗ് & സാനിറ്ററി ഫിറ്റിംഗ്സ് (Plumbing)",
    quantityPer1000SqFt: 1000,
    unit: "Sq.Feet Plinth Area",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Cera / PVC Fittings (₹45/sq.ft)", rate: 45 },
      { label: "CPVC Supreme + Jaquar Fittings (₹75/sq.ft)", rate: 75 },
      { label: "Kohler / Grohe Luxury Fittings (₹130/sq.ft)", rate: 130 }
    ],
    unitRate: 75,
    description: "CPVC/PVC pipes, drainage lines, EWC closets, wash basins, chrome CP bib taps & 1000L tank",
    isIncluded: true
  },
  {
    id: "mat_kitchen",
    category: "FINISHING",
    name: "Kitchen Work (Granite Slab & Sink)",
    malayalamName: "അടുക്കള സ്ലാബ് & സിങ്ക് (Kitchen Work)",
    quantityPer1000SqFt: 55,
    unit: "Sq.Feet Countertop",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Platform & Basic Sink (₹600/sq.ft)", rate: 600 },
      { label: "Black Pearl Granite + SS Sink (₹950/sq.ft)", rate: 950 },
      { label: "Fully Modular Quartz Countertop (₹1,500/sq.ft)", rate: 1500 }
    ],
    unitRate: 950,
    description: "Jet black granite countertop, stainless steel sink, wall dado tiles & faucet",
    isIncluded: true
  },
  {
    id: "mat_labour_rcc",
    category: "LABOUR",
    name: "Masonry, RCC & Plastering Labour",
    malayalamName: "നിർമ്മാണ ലേബർ പണി (RCC & Masonry Labour)",
    quantityPer1000SqFt: 1000,
    unit: "Sq.Feet Plinth Area",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Contractor Rate (₹190/sq.ft)", rate: 190 },
      { label: "Experienced Masons & Shuttering (₹280/sq.ft)", rate: 280 },
      { label: "High-Rise / Precision Finish (₹340/sq.ft)", rate: 340 }
    ],
    unitRate: 280,
    description: "Excavation, Foundation, Column/Beam RCC casting, Shuttering, Brickwork & Plastering labour",
    isIncluded: true
  },
  {
    id: "mat_labour_electrical",
    category: "LABOUR",
    name: "Electrical Works Labour (വയറിംഗ് കൂലി)",
    malayalamName: "ഇലക്ട്രിക്കൽ വയറിംഗ് കൂലി (Electrician Labour)",
    quantityPer1000SqFt: 1000,
    unit: "Sq.Feet Plinth Area",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Point Wiring (₹35/sq.ft)", rate: 35 },
      { label: "Full Concealed + DB Dressing (₹50/sq.ft)", rate: 50 },
      { label: "Architectural & Automation (₹75/sq.ft)", rate: 75 }
    ],
    unitRate: 50,
    description: "Chipping, conduit laying, wire pulling, switchboard fitting and earth pit installation",
    isIncluded: true
  },
  {
    id: "mat_labour_plumbing",
    category: "LABOUR",
    name: "Plumbing Works Labour (പ്ലംബിംഗ് കൂലി)",
    malayalamName: "പ്ലംബിംഗ് & സാനിറ്ററി കൂലി (Plumbing Labour)",
    quantityPer1000SqFt: 1000,
    unit: "Sq.Feet Plinth Area",
    qualityGrade: "Medium",
    qualityOptions: [
      { label: "Basic Piping (₹30/sq.ft)", rate: 30 },
      { label: "CPVC + Waste Drainage + Tank (₹45/sq.ft)", rate: 45 },
      { label: "Concealed Diverters & Solar (₹65/sq.ft)", rate: 65 }
    ],
    unitRate: 45,
    description: "Internal hot & cold piping, sanitary fixture installation, septic tank connections",
    isIncluded: true
  }
];

// Timeline Tracking Cost Per Phase from UltraTech Document (Page 1)
export const DEFAULT_PHASE_TIMELINES: PhaseTimelineItem[] = [
  {
    id: "phase_design",
    name: "Home Design & Municipal Approval",
    malayalamName: "പ്ലാൻ ഡിസൈൻ & അനുമതി (Approval)",
    durationDays: 46,
    baseCostPer1000SqFt: 120000,
    percentage: 5.5,
    color: "#eab308", // Yellow
    description: "Architectural drawing, 3D Elevation, Structural design & LSGD KSMART permit approval"
  },
  {
    id: "phase_excavation",
    name: "Site Clearing & Earth Excavation",
    malayalamName: "ഭൂമി ഒരുക്കൽ & കുഴിയെടുക്കൽ (Excavation)",
    durationDays: 14,
    baseCostPer1000SqFt: 65000,
    percentage: 3.0,
    color: "#22c55e", // Green
    description: "Leveling, layout marking, foundation trench excavation and earth disposal"
  },
  {
    id: "phase_footing",
    name: "Footing, Foundation & Basement",
    malayalamName: "ഫൗണ്ടേഷൻ & ബേസ്മെൻ്റ് (Foundation)",
    durationDays: 41,
    baseCostPer1000SqFt: 480000,
    percentage: 22.0,
    color: "#0284c7", // Blue
    description: "Rubbler/PCC foundation, isolated footings, plinth beam RCC and basement filling"
  },
  {
    id: "phase_rcc_columns",
    name: "RCC Work - Columns & Beams",
    malayalamName: "കോളങ്ങൾ & ബീമുകൾ (Columns & Beams)",
    durationDays: 17,
    baseCostPer1000SqFt: 320000,
    percentage: 14.5,
    color: "#2563eb", // Deep Blue
    description: "RCC columns casting, shuttering, lintel beams, sunshades and steel tying"
  },
  {
    id: "phase_roof_slab",
    name: "Roof Slab Shuttering & Concreting",
    malayalamName: "റൂഫ് കോൺക്രീറ്റ് (Roof Slab)",
    durationDays: 37,
    baseCostPer1000SqFt: 380000,
    percentage: 17.5,
    color: "#ef4444", // Red
    description: "Steel bar bending, electrical conduit laying, M20/M25 concrete pouring & curing"
  },
  {
    id: "phase_brickwork",
    name: "Brickwork & Plastering",
    malayalamName: "ഇഷ്ടികപ്പണി & പ്ലാസ്റ്ററിംഗ് (Brick & Plaster)",
    durationDays: 25,
    baseCostPer1000SqFt: 220000,
    percentage: 10.0,
    color: "#ec4899", // Pink
    description: "Wall masonry, interior ceiling & wall plastering, exterior double-coat plastering"
  },
  {
    id: "phase_flooring",
    name: "Flooring & Wall Tiling",
    malayalamName: "ഫ്ലോറിംഗ് & ടൈലുകൾ (Flooring & Tiling)",
    durationDays: 25,
    baseCostPer1000SqFt: 240000,
    percentage: 11.0,
    color: "#7e22ce", // Purple
    description: "Floor screeding, vitrified tile laying, skirting, bathroom anti-skid and wall tiles"
  },
  {
    id: "phase_electrical",
    name: "Electric Wiring & Switch Fittings",
    malayalamName: "ഇലക്ട്രിക് വയറിംഗ് & ഫിറ്റിംഗ്സ് (Electric)",
    durationDays: 14,
    baseCostPer1000SqFt: 110000,
    percentage: 5.0,
    color: "#f97316", // Orange
    description: "Conduit wiring, modular switches, DB, lights, fan fixtures and Earthing"
  },
  {
    id: "phase_plumbing",
    name: "Water Supply & Plumbing Fixtures",
    malayalamName: "വാട്ടർ സപ്ലൈ & പ്ലംബിംഗ് (Plumbing)",
    durationDays: 18,
    baseCostPer1000SqFt: 95000,
    percentage: 4.5,
    color: "#64748b", // Slate
    description: "Piping lines, overhead water tank, sanitaryware, taps, septic tank connection"
  },
  {
    id: "phase_doors_paint",
    name: "Doors, Windows & Final Painting",
    malayalamName: "വാതിലുകൾ & പെയിന്റിംഗ് (Doors & Paint)",
    durationDays: 15,
    baseCostPer1000SqFt: 160000,
    percentage: 7.0,
    color: "#14b8a6", // Teal
    description: "Teak main door fixing, interior doors, window glazing, putty finish & 2 coats emulsion"
  }
];

export interface CostCalculationResult {
  totalPlinthAreaSqFt: number;
  totalMaterialCost: number;
  totalLabourCost: number;
  baseRatePerSqFt: number;
  grandTotalCost: number;
  totalDurationDays: number;
  materialBreakdown: Array<{
    item: MaterialCostItem;
    calculatedQty: number;
    calculatedCost: number;
    costPerSqFt: number;
    percentageOfTotal: number;
  }>;
  categoryBreakdown: {
    structuralCost: number;
    finishingCost: number;
    mepCost: number;
    labourCost: number;
    structuralPct: number;
    finishingPct: number;
    mepPct: number;
    labourPct: number;
  };
  phaseBreakdown: Array<{
    phase: PhaseTimelineItem;
    cost: number;
    durationDays: number;
    costPerSqFt: number;
    percentage: number;
  }>;
}

export function computeBaseRateFromMaterials(
  materials: MaterialCostItem[],
  totalAreaSqFt: number,
  additionalWorks: number = 0,
  contingencyPct: number = 3,
  discount: number = 0
): CostCalculationResult {
  const scale = totalAreaSqFt / 1000;
  let totalMaterial = 0;
  let totalLabour = 0;

  let structuralCost = 0;
  let finishingCost = 0;
  let mepCost = 0;
  let labourCost = 0;

  const materialBreakdown = materials.map((item) => {
    if (!item.isIncluded) {
      return {
        item,
        calculatedQty: 0,
        calculatedCost: 0,
        costPerSqFt: 0,
        percentageOfTotal: 0
      };
    }

    const calculatedQty = Math.round(item.quantityPer1000SqFt * scale * 100) / 100;
    const calculatedCost = Math.round(calculatedQty * item.unitRate);
    const costPerSqFt = totalAreaSqFt > 0 ? calculatedCost / totalAreaSqFt : 0;

    if (item.category === "LABOUR") {
      totalLabour += calculatedCost;
      labourCost += calculatedCost;
    } else {
      totalMaterial += calculatedCost;
      if (item.category === "STRUCTURAL") structuralCost += calculatedCost;
      else if (item.category === "FINISHING") finishingCost += calculatedCost;
      else if (item.category === "MEP") mepCost += calculatedCost;
    }

    return {
      item,
      calculatedQty,
      calculatedCost,
      costPerSqFt,
      percentageOfTotal: 0 // calculated next
    };
  });

  const rawSubtotal = totalMaterial + totalLabour;
  const contingencyAmount = (rawSubtotal * contingencyPct) / 100;
  const grandTotalCost = Math.round(rawSubtotal + additionalWorks + contingencyAmount - discount);
  const baseRatePerSqFt = totalAreaSqFt > 0 ? Math.round(rawSubtotal / totalAreaSqFt) : 0;

  // Update percentages
  materialBreakdown.forEach((mb) => {
    mb.percentageOfTotal = rawSubtotal > 0 ? Math.round((mb.calculatedCost / rawSubtotal) * 1000) / 10 : 0;
  });

  const structuralPct = rawSubtotal > 0 ? Math.round((structuralCost / rawSubtotal) * 1000) / 10 : 0;
  const finishingPct = rawSubtotal > 0 ? Math.round((finishingCost / rawSubtotal) * 1000) / 10 : 0;
  const mepPct = rawSubtotal > 0 ? Math.round((mepCost / rawSubtotal) * 1000) / 10 : 0;
  const labourPct = rawSubtotal > 0 ? Math.round((labourCost / rawSubtotal) * 1000) / 10 : 0;

  // Compute Phase Timeline items
  const totalPhaseDuration = DEFAULT_PHASE_TIMELINES.reduce((sum, p) => sum + p.durationDays, 0);
  const phaseBreakdown = DEFAULT_PHASE_TIMELINES.map((p) => {
    const cost = Math.round((grandTotalCost * p.percentage) / 100);
    return {
      phase: p,
      cost,
      durationDays: p.durationDays,
      costPerSqFt: totalAreaSqFt > 0 ? Math.round(cost / totalAreaSqFt) : 0,
      percentage: p.percentage
    };
  });

  return {
    totalPlinthAreaSqFt: totalAreaSqFt,
    totalMaterialCost: totalMaterial,
    totalLabourCost: totalLabour,
    baseRatePerSqFt,
    grandTotalCost,
    totalDurationDays: totalPhaseDuration,
    materialBreakdown,
    categoryBreakdown: {
      structuralCost,
      finishingCost,
      mepCost,
      labourCost,
      structuralPct,
      finishingPct,
      mepPct,
      labourPct
    },
    phaseBreakdown
  };
}
