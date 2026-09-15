import { EstimateItem } from "./estimateData";

export type WorkItemCategory =
  | "Earthwork & Excavation"
  | "Concrete & Foundation"
  | "Masonry & Walling"
  | "RCC & Structural"
  | "Plastering & Pointing"
  | "Flooring & Tiling"
  | "Woodwork & Openings"
  | "Finishing & Painting"
  | "Roofing & Waterproofing"
  | "Plumbing & Sanitary"
  | "Electrical & Conduits"
  | "Miscellaneous & External";

export interface MasterSubItem {
  id: string;
  particulars: string;
  nos: number;
  length: number;
  breadth: number;
  depth: number;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  remarks?: string;
  isDeduction?: boolean;
}

export interface MasterWorkItem {
  id: string;
  itemCode?: string;
  category: WorkItemCategory;
  particulars: string;
  hasSubItems: boolean;
  subItems: MasterSubItem[];
  // Direct values if hasSubItems is false
  nos: number;
  length: number;
  breadth: number;
  depth: number;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  remarks?: string;
  isDeduction?: boolean;
}

export const WORK_ITEM_CATEGORIES: WorkItemCategory[] = [
  "Earthwork & Excavation",
  "Concrete & Foundation",
  "Masonry & Walling",
  "RCC & Structural",
  "Plastering & Pointing",
  "Flooring & Tiling",
  "Woodwork & Openings",
  "Finishing & Painting",
  "Roofing & Waterproofing",
  "Plumbing & Sanitary",
  "Electrical & Conduits",
  "Miscellaneous & External"
];

export const STANDARD_KERALA_WORK_ITEMS: MasterWorkItem[] = [
  {
    id: "mwi_001",
    itemCode: "CIV-EXC-01",
    category: "Earthwork & Excavation",
    particulars: "Earth work excavation in ordinary soil for foundation trenches up to 1.5m depth including dressing of sides, ramming of bottom, lift up to 1.5m and lead up to 50m with all labour and tools.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 57.54,
    unit: "cum",
    rate: 249,
    amount: 14327,
    remarks: "Foundation excavation breakdown",
    subItems: [
      {
        id: "sub_001_1",
        particulars: "Main Long walls foundation excavation (Front & Rear)",
        nos: 2,
        length: 24.5,
        breadth: 0.9,
        depth: 0.8,
        quantity: 35.28,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Long walls"
      },
      {
        id: "sub_001_2",
        particulars: "Cross Short walls foundation excavation",
        nos: 3,
        length: 12.2,
        breadth: 0.75,
        depth: 0.8,
        quantity: 21.96,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Cross walls"
      },
      {
        id: "sub_001_3",
        particulars: "Portico & sitout steps excavation",
        nos: 1,
        length: 3.5,
        breadth: 0.6,
        depth: 0.35,
        quantity: 0.3,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Steps"
      }
    ]
  },
  {
    id: "mwi_002",
    itemCode: "CIV-PCC-01",
    category: "Concrete & Foundation",
    particulars: "Placing plain cement concrete (PCC) 1:4:8 (1 cement : 4 coarse sand : 8 graded stone aggregate 40mm nominal size) in foundation bed including consolidation, curing, all lead and lift.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 6.70,
    unit: "cum",
    rate: 7146,
    amount: 47878,
    remarks: "PCC 1:4:8 Bed",
    subItems: [
      {
        id: "sub_002_1",
        particulars: "Under main long walls foundation bed (100mm thick)",
        nos: 2,
        length: 24.5,
        breadth: 0.9,
        depth: 0.1,
        quantity: 4.41,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Long walls bed"
      },
      {
        id: "sub_002_2",
        particulars: "Under cross short walls foundation bed (100mm thick)",
        nos: 3,
        length: 12.2,
        breadth: 0.75,
        depth: 0.1,
        quantity: 2.29,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Cross walls bed"
      }
    ]
  },
  {
    id: "mwi_003",
    itemCode: "CIV-RR-01",
    category: "Masonry & Walling",
    particulars: "Random Rubble (RR) masonry in cement mortar 1:6 (1 cement : 6 coarse sand) in foundation and basement including scaffolding, watering and curing complete.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 24.18,
    unit: "cum",
    rate: 4900,
    amount: 118482,
    remarks: "RR Basement Breakdown",
    subItems: [
      {
        id: "sub_003_1",
        particulars: "Foundation 1st footing RR masonry (0.60m width)",
        nos: 1,
        length: 49.0,
        breadth: 0.6,
        depth: 0.45,
        quantity: 13.23,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "1st Footing"
      },
      {
        id: "sub_003_2",
        particulars: "Basement RR masonry above GL (0.45m width)",
        nos: 1,
        length: 49.0,
        breadth: 0.45,
        depth: 0.45,
        quantity: 9.92,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Basement level"
      },
      {
        id: "sub_003_3",
        particulars: "Portico & porch foundation RR masonry",
        nos: 1,
        length: 5.5,
        breadth: 0.45,
        depth: 0.45,
        quantity: 1.03,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Porch"
      }
    ]
  },
  {
    id: "mwi_004",
    itemCode: "CIV-PLB-01",
    category: "RCC & Structural",
    particulars: "Providing Reinforced Cement Concrete (RCC) M20 grade (1:1.5:3) in plinth beam of 200mm x 300mm including centring, shuttering, compaction, de-shuttering and curing (excluding steel).",
    hasSubItems: false,
    nos: 1,
    length: 79.92,
    breadth: 0.23,
    depth: 0.3,
    quantity: 5.5145,
    unit: "cum",
    rate: 16500,
    amount: 90989,
    remarks: "M20 Plinth Belt",
    subItems: []
  },
  {
    id: "mwi_005",
    itemCode: "CIV-BRK-01",
    category: "Masonry & Walling",
    particulars: "Brick work with modular / country burnt clay bricks of class designation 35 in foundation and superstructure in cement mortar 1:6 (1 cement : 6 coarse sand) including scaffolding and curing.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 57.017,
    unit: "cum",
    rate: 7246,
    amount: 413145,
    remarks: "Superstructure Brickwork Breakdown",
    subItems: [
      {
        id: "sub_005_1",
        particulars: "Main outer load bearing walls (230mm thick)",
        nos: 1,
        length: 52.0,
        breadth: 0.23,
        depth: 3.1,
        quantity: 37.076,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Outer walls"
      },
      {
        id: "sub_005_2",
        particulars: "Internal partition walls (115mm thick half-brick)",
        nos: 1,
        length: 42.0,
        breadth: 0.115,
        depth: 3.1,
        quantity: 14.973,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Internal partitions"
      },
      {
        id: "sub_005_3",
        particulars: "Parapet wall above terrace (115mm thick, 0.9m height)",
        nos: 1,
        length: 48.0,
        breadth: 0.115,
        depth: 0.9,
        quantity: 4.968,
        unit: "cum",
        rate: 0,
        amount: 0,
        remarks: "Terrace parapet"
      }
    ]
  },
  {
    id: "mwi_006",
    itemCode: "CIV-STL-01",
    category: "RCC & Structural",
    particulars: "Thermo-Mechanically Treated (TMT) Fe 500D steel bar reinforcement for RCC work including straightening, cutting, bending, placing in position and binding with 18 gauge annealed wire complete.",
    hasSubItems: false,
    nos: 1,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 2450,
    unit: "kg",
    rate: 88.5,
    amount: 216825,
    remarks: "Fe 500D Rebar",
    subItems: []
  },
  {
    id: "mwi_007",
    itemCode: "CIV-RCC-SLB",
    category: "RCC & Structural",
    particulars: "RCC M20 mix in roof slabs, beams, cantilevers and sunshades 120mm thick including hoisting, vibrating, centring, shuttering and curing.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 0,
    unit: "",
    rate: 0,
    amount: 326700,
    remarks: "Slab & Beams Breakdown",
    subItems: [
      {
        id: "sub_007_1",
        particulars: "Main roof slab (120mm thick)",
        nos: 1,
        length: 15.0,
        breadth: 10.0,
        depth: 0.12,
        quantity: 18.0,
        unit: "cum",
        rate: 16500,
        amount: 297000,
        remarks: "Roof slab"
      },
      {
        id: "sub_007_2",
        particulars: "Continuous lintels & chajjas / sunshades",
        nos: 1,
        length: 30.0,
        breadth: 0.45,
        depth: 0.08,
        quantity: 1.08,
        unit: "cum",
        rate: 16500,
        amount: 17820,
        remarks: "Sunshades"
      },
      {
        id: "sub_007_3",
        particulars: "Portico cantilever slab projection",
        nos: 1,
        length: 4.5,
        breadth: 1.5,
        depth: 0.11,
        quantity: 0.72,
        unit: "cum",
        rate: 16500,
        amount: 11880,
        remarks: "Porch slab"
      }
    ]
  },
  {
    id: "mwi_008",
    itemCode: "CIV-PLS-01",
    category: "Plastering & Pointing",
    particulars: "12mm to 15mm cement plaster in CM 1:4 (1 cement : 4 fine sand) on wall surfaces finished smooth with sponge finish including scaffolding and curing for 14 days.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 0,
    unit: "",
    rate: 0,
    amount: 166440,
    remarks: "Plastering Internal & External",
    subItems: [
      {
        id: "sub_008_1",
        particulars: "Internal walls plastering 12mm thick CM 1:4",
        nos: 1,
        length: 280,
        breadth: 0,
        depth: 0,
        quantity: 280,
        unit: "sqm",
        rate: 320,
        amount: 89600,
        remarks: "Internal surfaces"
      },
      {
        id: "sub_008_2",
        particulars: "External walls plastering 15mm thick CM 1:4 with waterproof compound",
        nos: 1,
        length: 190,
        breadth: 0,
        depth: 0,
        quantity: 190,
        unit: "sqm",
        rate: 360,
        amount: 68400,
        remarks: "External weather face"
      },
      {
        id: "sub_008_3",
        particulars: "Ceiling plastering 6mm thick in CM 1:3",
        nos: 1,
        length: 32,
        breadth: 0,
        depth: 0,
        quantity: 32,
        unit: "sqm",
        rate: 265,
        amount: 8440,
        remarks: "Ceiling underside"
      }
    ]
  },
  {
    id: "mwi_009",
    itemCode: "CIV-FLR-01",
    category: "Flooring & Tiling",
    particulars: "Flooring with Vitrified tiles (600mm x 600mm or 800mm x 800mm) of premium quality laid on 20mm thick cement mortar bed 1:4 with neat cement slurry, jointed with matching epoxy grout.",
    hasSubItems: false,
    nos: 1,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 145,
    unit: "sqm",
    rate: 1450,
    amount: 210250,
    remarks: "Premium Vitrified",
    subItems: []
  },
  {
    id: "mwi_010",
    itemCode: "CIV-PNT-01",
    category: "Finishing & Painting",
    particulars: "Painting with premium acrylic emulsion paint of approved brand and shade (2 or more coats) over one coat of primer and two coats of wall putty on newly plastered surfaces.",
    hasSubItems: false,
    nos: 1,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 520,
    unit: "sqm",
    rate: 185,
    amount: 96200,
    remarks: "Interior / Exterior Emulsion",
    subItems: []
  },
  {
    id: "mwi_011",
    itemCode: "CIV-WD-01",
    category: "Woodwork & Openings",
    particulars: "Providing and fixing 1st class Teak wood / Anjili / Mahogany frame and panelled shutters for main doors & bedrooms including brass hardware fittings, mortise lock and polishing.",
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 0,
    unit: "",
    rate: 0,
    amount: 148000,
    remarks: "Doors & Frames",
    subItems: [
      {
        id: "sub_011_1",
        particulars: "Main Entrance Teak Wood carved door (1.05m x 2.1m)",
        nos: 1,
        length: 1.05,
        breadth: 2.1,
        depth: 0,
        quantity: 2.2,
        unit: "sqm",
        rate: 22000,
        amount: 48400,
        remarks: "Teak Main Door"
      },
      {
        id: "sub_011_2",
        particulars: "Bedrooms & Kitchen flush / panelled doors with frames",
        nos: 6,
        length: 0.9,
        breadth: 2.1,
        depth: 0,
        quantity: 11.34,
        unit: "sqm",
        rate: 7500,
        amount: 85050,
        remarks: "Internal doors"
      },
      {
        id: "sub_011_3",
        particulars: "FRP / PVC waterproof doors for bathrooms",
        nos: 3,
        length: 0.75,
        breadth: 2.0,
        depth: 0,
        quantity: 4.5,
        unit: "sqm",
        rate: 3233,
        amount: 14550,
        remarks: "Toilet doors"
      }
    ]
  },
  {
    id: "mwi_012",
    itemCode: "CIV-ELC-01",
    category: "Electrical & Conduits",
    particulars: "Wiring for light, fan, exhaust, 6A & 16A power points with FRLS PVC insulated copper conductor wire in concealed PVC conduits including modular switches, MCBs and distribution boards.",
    hasSubItems: false,
    nos: 1,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 1,
    unit: "l/s",
    rate: 185000,
    amount: 185000,
    remarks: "Electrical electrification",
    subItems: []
  },
  {
    id: "mwi_013",
    itemCode: "CIV-PLM-01",
    category: "Plumbing & Sanitary",
    particulars: "Providing and laying CPVC/PVC water supply pipeline, drainage pipes, sanitary fixtures (EWC, wash basins, faucets, shower) including septic tank, soak pit and connection complete.",
    hasSubItems: false,
    nos: 1,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: 1,
    unit: "l/s",
    rate: 195000,
    amount: 195000,
    remarks: "Plumbing & Sanitary",
    subItems: []
  }
];

export const DEFAULT_MASTER_WORK_ITEMS: MasterWorkItem[] = [];

const LOCAL_STORAGE_MASTER_ITEMS_KEY = "vasthusilpy_estimate_master_work_items";

export function loadMasterWorkItems(): MasterWorkItem[] {
  try {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(LOCAL_STORAGE_MASTER_ITEMS_KEY);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load master work items from localStorage:", e);
  }
  return [];
}

export function saveMasterWorkItems(items: MasterWorkItem[], dispatchEvent = true): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_MASTER_ITEMS_KEY, JSON.stringify(items));
      if (dispatchEvent) {
        window.dispatchEvent(new Event("vasthusilpy_items_of_work_updated"));
        window.dispatchEvent(new Event("vasthusilpy_storage_update"));
      }
    }
  } catch (e) {
    console.error("Failed to save master work items to localStorage:", e);
  }
}

export function deleteMasterWorkItem(id: string): MasterWorkItem[] {
  const current = loadMasterWorkItems();
  const updated = current.filter((item) => item.id !== id);
  saveMasterWorkItems(updated);
  return updated;
}

export function clearAllMasterWorkItems(): void {
  saveMasterWorkItems([]);
}

export function recalculateMasterItem(item: MasterWorkItem): MasterWorkItem {
  const isItemDeduct = Boolean(
    item.isDeduction ||
    (typeof item.nos === "number" && item.nos < 0) ||
    (typeof item.quantity === "number" && item.quantity < 0) ||
    (typeof item.particulars === "string" && /^\s*(-|deduct|subtraction|less)\b/i.test(item.particulars))
  );

  if (!item.hasSubItems || !item.subItems || item.subItems.length === 0) {
    // Single item without sub-items: calculate quantity & amount
    const rawNos = Number(item.nos) || 0;
    const l = Math.abs(Number(item.length) || 0);
    const b = Math.abs(Number(item.breadth) || 0);
    const d = Math.abs(Number(item.depth) || 0);

    const isNegative = isItemDeduct || rawNos < 0;
    const nosMag = Math.abs(rawNos);
    const effectiveNosMag = nosMag > 0 ? nosMag : (l > 0 || b > 0 || d > 0 ? 1 : 0);
    const sign = isNegative ? -1 : 1;

    let mag = 0;
    if (l > 0 && b > 0 && d > 0) {
      mag = effectiveNosMag * l * b * d;
    } else if (l > 0 && b > 0) {
      mag = effectiveNosMag * l * b;
    } else if (l > 0) {
      mag = effectiveNosMag * l;
    } else if (effectiveNosMag > 0) {
      mag = effectiveNosMag;
    }

    const q = Number((sign * mag).toFixed(4));
    const r = Number(item.rate) || 0;
    const amt = Math.round(q * r);

    return {
      ...item,
      isDeduction: isNegative,
      hasSubItems: false,
      nos: rawNos !== 0 ? (isNegative ? -nosMag : nosMag) : 0,
      length: l,
      breadth: b,
      depth: d,
      quantity: q,
      rate: r,
      amount: amt
    };
  }

  // Item WITH Sub-Items:
  // 1. Recalculate each sub-item (values up to quantity only, no rate or amount)
  const updatedSubItems = item.subItems.map((sub) => {
    const isSubDeduct = Boolean(
      sub.isDeduction ||
      (typeof sub.nos === "number" && sub.nos < 0) ||
      (typeof sub.quantity === "number" && sub.quantity < 0) ||
      (typeof sub.particulars === "string" && /^\s*(-|deduct|subtraction|less)\b/i.test(sub.particulars))
    );

    const rawNos = Number(sub.nos) || 0;
    const l = Math.abs(Number(sub.length) || 0);
    const b = Math.abs(Number(sub.breadth) || 0);
    const d = Math.abs(Number(sub.depth) || 0);

    const isNegative = isSubDeduct || rawNos < 0;
    const nosMag = Math.abs(rawNos);
    const effectiveNosMag = nosMag > 0 ? nosMag : (l > 0 || b > 0 || d > 0 ? 1 : 0);
    const sign = isNegative ? -1 : 1;

    let mag = 0;
    if (l > 0 && b > 0 && d > 0) {
      mag = effectiveNosMag * l * b * d;
    } else if (l > 0 && b > 0) {
      mag = effectiveNosMag * l * b;
    } else if (l > 0) {
      mag = effectiveNosMag * l;
    } else if (effectiveNosMag > 0) {
      mag = effectiveNosMag;
    }

    const q = Number((sign * mag).toFixed(4));

    return {
      ...sub,
      isDeduction: isNegative,
      nos: rawNos !== 0 ? (isNegative ? -nosMag : nosMag) : 0,
      length: l,
      breadth: b,
      depth: d,
      quantity: q,
      rate: 0, // Sub-items cannot have rate
      amount: 0 // Sub-items do not have individual amount
    };
  });

  const sumTotalQty = updatedSubItems.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
  const roundedQty = Number(sumTotalQty.toFixed(4));
  const mainRate = Number(item.rate) || 0;
  const mainUnit = item.unit || updatedSubItems[0]?.unit || "cum";
  const mainAmount = Math.round(roundedQty * mainRate);

  // Requirement: Main item dimensions are 0 (measurements are in sub-items),
  // Main item QTY is sum of sub-item quantities, with Main Item Rate and Amount.
  return {
    ...item,
    hasSubItems: true,
    nos: 0,
    length: 0,
    breadth: 0,
    depth: 0,
    quantity: roundedQty,
    unit: mainUnit,
    rate: mainRate,
    amount: mainAmount,
    subItems: updatedSubItems
  };
}

/**
 * Converts a MasterWorkItem into an array of EstimateItem objects ready to be added to an estimate floor.
 */
export function convertMasterToEstimateItems(
  masterItem: MasterWorkItem,
  startingSlNo: number
): EstimateItem[] {
  const recalculated = recalculateMasterItem(masterItem);
  const mainId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (recalculated.hasSubItems && recalculated.subItems && recalculated.subItems.length > 0) {
    // 1. Main item: holds the sum total quantity, unit, rate, and calculated amount
    const mainEstimateItem: EstimateItem = {
      id: mainId,
      slNo: `${startingSlNo}`,
      particulars: recalculated.particulars,
      nos: 0,
      length: 0,
      breadth: 0,
      depth: 0,
      quantity: recalculated.quantity,
      unit: recalculated.unit || "cum",
      rate: recalculated.rate || 0,
      amount: recalculated.amount || 0,
      remarks: recalculated.remarks || "",
      isSubItem: false,
      isDeduction: recalculated.isDeduction
    };

    // 2. Sub items: have values up to quantity only; no rate or individual amount
    const letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"];
    const subEstimateItems: EstimateItem[] = recalculated.subItems.map((sub, sIdx) => {
      const subLetter = letters[sIdx % letters.length] || `${sIdx + 1}`;
      return {
        id: `sub_${Date.now()}_${sIdx}_${Math.random().toString(36).substring(2, 6)}`,
        slNo: `${startingSlNo}.${subLetter}`,
        particulars: sub.particulars,
        nos: sub.nos,
        length: sub.length,
        breadth: sub.breadth,
        depth: sub.depth,
        quantity: sub.quantity,
        unit: sub.unit || recalculated.unit || "cum",
        rate: 0, // Sub-items cannot have rate
        amount: 0, // Sub-items do not have individual amount
        remarks: sub.remarks || "Sub-item",
        isSubItem: true,
        parentItemId: mainId,
        isDeduction: sub.isDeduction
      };
    });

    return [mainEstimateItem, ...subEstimateItems];
  }

  // Single Item
  const singleEstimateItem: EstimateItem = {
    id: mainId,
    slNo: `${startingSlNo}`,
    particulars: recalculated.particulars,
    nos: recalculated.nos,
    length: recalculated.length,
    breadth: recalculated.breadth,
    depth: recalculated.depth,
    quantity: recalculated.quantity,
    unit: recalculated.unit || "cum",
    rate: recalculated.rate,
    amount: recalculated.amount,
    remarks: recalculated.remarks || "",
    isSubItem: false,
    isDeduction: recalculated.isDeduction
  };

  return [singleEstimateItem];
}
