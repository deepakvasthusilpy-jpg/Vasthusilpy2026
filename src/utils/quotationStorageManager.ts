import { Quotation, QuotationLineItem, QuotationService, Contractor, TermsClause, QuotationStatus, CompanyDetails } from "../types";
import { db } from "../lib/firebase";
import { doc } from "firebase/firestore";
import { safeSetDoc } from "./storageManager";

export const QUOTATION_STORAGE_KEYS = {
  QUOTATIONS: "vasthusilpy_quotations_v2",
  SERVICES: "vasthusilpy_quotation_services_v2",
  CONTRACTORS: "vasthusilpy_quotation_contractors_v2",
  TERMS: "vasthusilpy_quotation_terms_v2",
  COMPANY_SETTINGS: "vasthusilpy_quotation_company_v2"
};

export function loadSavedCompanyDetails(): CompanyDetails | null {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEYS.COMPANY_SETTINGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed loading saved company details", e);
  }
  return null;
}

export function saveCompanyDetailsToStorage(details: CompanyDetails | null): void {
  try {
    if (details) {
      localStorage.setItem(QUOTATION_STORAGE_KEYS.COMPANY_SETTINGS, JSON.stringify(details));
    } else {
      localStorage.removeItem(QUOTATION_STORAGE_KEYS.COMPANY_SETTINGS);
    }
  } catch (e) {
    console.warn("Failed saving company details", e);
  }
}

// Indian Currency Formatter (e.g., ₹8,42,000)
export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "₹0";
  const num = Math.round(val);
  const isNegative = num < 0;
  const absVal = Math.abs(num);

  const str = absVal.toString();
  let result = "";
  if (str.length <= 3) {
    result = str;
  } else {
    const lastThree = str.substring(str.length - 3);
    const otherNumbers = str.substring(0, str.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    result = formattedOther + "," + lastThree;
  }

  return (isNegative ? "-₹" : "₹") + result;
}

// Compute dynamic status (Expiring soon if within 7 days, Expired if past expiry date)
export function getComputedStatus(quotation: Quotation): QuotationStatus {
  if (quotation.status === "approved" || quotation.status === "draft") {
    return quotation.status;
  }

  if (quotation.expiry_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(quotation.expiry_date);
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "expired";
    }
    if (diffDays <= 7) {
      return "expiring_soon";
    }
  }

  return quotation.status || "pending";
}

// Auto-generate sequential quotation number: QTN-2026-001
export function generateNextQuotationNo(quotations: Quotation[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `QTN-${currentYear}-`;

  let maxSeq = 0;
  quotations.forEach((q) => {
    if (q.quotation_no && q.quotation_no.startsWith(prefix)) {
      const parts = q.quotation_no.split("-");
      const seqStr = parts[parts.length - 1];
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const padded = nextSeq.toString().padStart(3, "0");
  return `${prefix}${padded}`;
}

// Default Kerala Construction Services & Rates
export const DEFAULT_SERVICES: QuotationService[] = [
  {
    id: "srv_rubble_masonry",
    name: "Rubble Soling & Basement RR Masonry in CM 1:6",
    category: "Substructure & Foundation",
    unit: "cum",
    material_rate: 3400,
    labour_rate: 1800,
    combined_rate: 5200,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_dpc_waterproofing",
    name: "Damp Proof Course (DPC) 50mm thick with Dr. Fixit",
    category: "Substructure & Foundation",
    unit: "sq.ft",
    material_rate: 65,
    labour_rate: 45,
    combined_rate: 110,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_solid_block_6inch",
    name: "Solid Concrete Block Masonry 6\" (CM 1:6) with curing",
    category: "Superstructure",
    unit: "sq.ft",
    material_rate: 98,
    labour_rate: 52,
    combined_rate: 150,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_country_brickwork",
    name: "First Class Country Burnt Brickwork in CM 1:6",
    category: "Superstructure",
    unit: "sq.ft",
    material_rate: 125,
    labour_rate: 65,
    combined_rate: 190,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_rcc_m20_structure",
    name: "RCC M20 (1:1.5:3) for Columns, Beams & Lintels",
    category: "Superstructure",
    unit: "cum",
    material_rate: 8500,
    labour_rate: 3500,
    combined_rate: 12000,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_rcc_roof_slab",
    name: "RCC Roof Slab 120mm with Shuttering & Vibrator compaction",
    category: "Superstructure",
    unit: "sq.ft",
    material_rate: 220,
    labour_rate: 110,
    combined_rate: 330,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_steel_reinforcement",
    name: "TMT Fe500D Reinforcement Steel Cutting, Bending & Binding",
    category: "Superstructure",
    unit: "kg",
    material_rate: 68,
    labour_rate: 14,
    combined_rate: 82,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_internal_plastering",
    name: "Internal Wall Plastering 12mm thick in CM 1:4 smooth finish",
    category: "Plastering & Masonry",
    unit: "sq.ft",
    material_rate: 26,
    labour_rate: 28,
    combined_rate: 54,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_external_plastering",
    name: "External Sand-faced Weather Plastering 18mm in CM 1:4 with waterproofing",
    category: "Plastering & Masonry",
    unit: "sq.ft",
    material_rate: 38,
    labour_rate: 34,
    combined_rate: 72,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_vitrified_flooring",
    name: "Vitrified Tile Flooring 800x800 / 600x1200 with Kajaria / Somany",
    category: "Flooring & Finishes",
    unit: "sq.ft",
    material_rate: 85,
    labour_rate: 35,
    combined_rate: 120,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_granite_flooring",
    name: "Black Galaxy / Tan Brown Granite for Sitout, Steps & Kitchen Counter",
    category: "Flooring & Finishes",
    unit: "sq.ft",
    material_rate: 180,
    labour_rate: 70,
    combined_rate: 250,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_electrical_wiring",
    name: "Concealed Electrical Point Wiring with Finolex FRLS & Legrand switches",
    category: "Electrical & Plumbing",
    unit: "point",
    material_rate: 750,
    labour_rate: 450,
    combined_rate: 1200,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_plumbing_sanitary",
    name: "Concealed CPVC/PVC Plumbing, drainage & Sanitary fixtures installation",
    category: "Electrical & Plumbing",
    unit: "point",
    material_rate: 1100,
    labour_rate: 650,
    combined_rate: 1750,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_teak_door_joinery",
    name: "First Class Teak Wood Main Door Frame & 35mm Carved Shutter with brass fittings",
    category: "Doors & Windows",
    unit: "sq.ft",
    material_rate: 1800,
    labour_rate: 600,
    combined_rate: 2400,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_upvc_windows",
    name: "UPVC 3-Track Sliding Windows with Saint-Gobain Glass & SS Mosquito Mesh",
    category: "Doors & Windows",
    unit: "sq.ft",
    material_rate: 420,
    labour_rate: 110,
    combined_rate: 530,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_interior_painting",
    name: "Interior 2 coats Birla Putty + Primer + 2 coats Asian Paints Royale Emulsion",
    category: "Painting & Polish",
    unit: "sq.ft",
    material_rate: 24,
    labour_rate: 18,
    combined_rate: 42,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_exterior_painting",
    name: "Exterior Primer + 2 coats Asian Paints Apex Ultima Weatherproof Paint",
    category: "Painting & Polish",
    unit: "sq.ft",
    material_rate: 28,
    labour_rate: 20,
    combined_rate: 48,
    last_updated: "2026-03-01"
  },
  {
    id: "srv_truss_roofing",
    name: "GI Truss Work with Kerala Clay Terracotta Tiles / Polycarbonate sheet",
    category: "Roofing & Fabrication",
    unit: "sq.ft",
    material_rate: 195,
    labour_rate: 85,
    combined_rate: 280,
    last_updated: "2026-03-01"
  }
];

// Default Contractors Master List
export const DEFAULT_CONTRACTORS: Contractor[] = [
  {
    id: "cntr_rajesh_electricals",
    name: "Rajesh K.",
    company_name: "Rajesh Electricals & Automation",
    trade: "Electrical",
    phone: "+91 94471 23456",
    email: "rajesh.elec@gmail.com",
    notes: "Specializes in 3-phase wiring, smart home DB boxes, and architectural cove lighting.",
    created_at: "2026-01-15"
  },
  {
    id: "cntr_santhosh_masonry",
    name: "Santhosh Kumar",
    company_name: "SK Builders & Masonry Works",
    trade: "Masonry / Structure",
    phone: "+91 98472 34567",
    notes: "Expert Kerala masons team for RR foundation, block masonry, and concrete casting.",
    created_at: "2026-01-15"
  },
  {
    id: "cntr_murali_plumbing",
    name: "Muralidharan P.",
    company_name: "Murali Plumbing Solutions",
    trade: "Plumbing & Sanitary",
    phone: "+91 97453 45678",
    notes: "Concealed CPVC hot/cold piping, septic tank drainage, overhead solar line installation.",
    created_at: "2026-01-20"
  },
  {
    id: "cntr_vinod_woodcrafts",
    name: "Vinod Achari",
    company_name: "Vinod Traditional & Modern Woodcrafts",
    trade: "Carpentry / Joinery",
    phone: "+91 99464 56789",
    notes: "Master carpenter for carved Teakwood entrance doors, charupady, and modular kitchen carcasses.",
    created_at: "2026-02-01"
  },
  {
    id: "cntr_sujith_tiles",
    name: "Sujith M.",
    company_name: "Sujith Granite & Tile Laying",
    trade: "Flooring & Tile",
    phone: "+91 96455 67890",
    notes: "Precision epoxy grouting, large slab 4x2 handling, book-matched granite sitout steps.",
    created_at: "2026-02-05"
  },
  {
    id: "cntr_apex_fabrication",
    name: "Nandakumar",
    company_name: "Apex Aluminium & Metal Fabrications",
    trade: "Fabrication / Metal",
    phone: "+91 95446 78901",
    notes: "Tough glass railings, GI truss roofs, and powder-coated UPVC/Aluminium windows.",
    created_at: "2026-02-10"
  },
  {
    id: "cntr_shine_painting",
    name: "Shine V. G.",
    company_name: "Shine Painting & Wood Polish Works",
    trade: "Painting & Polish",
    phone: "+91 98957 89012",
    notes: "Melamine/PU wood finish, texture wall application, and Apex Ultima exterior spray.",
    created_at: "2026-02-12"
  }
];

// Default Terms & Conditions Clauses
export const DEFAULT_TERMS: TermsClause[] = [
  {
    id: "term_validity",
    order: 1,
    title: "Quotation Validity",
    text: "This quotation is valid for 30 days from the date of issue. Rates quoted are subject to revision thereafter based on prevailing market costs of cement, steel, and fuel.",
    is_default: true
  },
  {
    id: "term_payment_schedule",
    order: 2,
    title: "Progressive Payment Milestones",
    text: "Payments shall be released strictly in progressive stages: Advance with Work Order (15%), Foundation/Plinth Level (20%), Lintel & Roof Slab (25%), Masonry & Plastering (20%), Flooring & Joinery (15%), Final Handover (5%).",
    is_default: true
  },
  {
    id: "term_water_electricity",
    order: 3,
    title: "Site Water and Electricity",
    text: "Continuous single/three-phase electrical supply and adequate clean water for construction and 21-day curing shall be provided at the site by the client at their own expense.",
    is_default: true
  },
  {
    id: "term_site_handover",
    order: 4,
    title: "Site Access & Obstructions",
    text: "The site shall be handed over clear of trees, vegetation, roots, and existing structures. Any rock cutting, hard-blasting, or special piling works will be estimated and billed separately.",
    is_default: true
  },
  {
    id: "term_variations_extra",
    order: 5,
    title: "Variations and Extra Work",
    text: "Any deviations, structural revisions, or additional works requested by the client beyond this approved schedule of quantities will be estimated and billed as extra items before execution.",
    is_default: true
  },
  {
    id: "term_material_selection",
    order: 6,
    title: "Client Material Selection",
    text: "Finishing materials such as vitrified tiles, granite slabs, sanitary fittings, switch plates, and paint color codes must be approved by the client at least 14 days prior to stage execution to avoid project stoppage.",
    is_default: true
  },
  {
    id: "term_statutory_approvals",
    order: 7,
    title: "Statutory Approvals & Permits",
    text: "Local self-government (K-SMART LSGD) building permits, fire/pollution NOCs, and electricity/water service connections shall be arranged by the client unless specifically contracted in writing.",
    is_default: true
  },
  {
    id: "term_defects_liability",
    order: 8,
    title: "Defects Liability Period",
    text: "A defect liability warranty of 12 months from the date of physical key handover covers structural integrity and workmanship issues (ordinary wear & tear, weathering, or misuse excluded).",
    is_default: true
  }
];

// Initial Seed Quotations
export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: "qtn_2026_001",
    quotation_no: "QTN-2026-001",
    status: "approved",
    client_name: "Dr. Harikrishnan Nambiar",
    client_phone: "+91 98471 89230",
    client_email: "dr.hari.kerala@gmail.com",
    site_address: "Plot 14, Haritha Valley, Keralassery, Palakkad",
    plot_area_sqft: 2450,
    date_issued: "2026-02-10",
    expiry_date: "2026-03-12",
    line_items: [
      {
        id: "li_1",
        service_id: "srv_rubble_masonry",
        description: "Rubble Soling & Basement RR Masonry in CM 1:6",
        unit: "cum",
        quantity: 45,
        rate: 5200,
        include_material: true,
        include_labour: true,
        material_rate: 3400,
        labour_rate: 1800,
        amount: 234000
      },
      {
        id: "li_2",
        service_id: "srv_rcc_roof_slab",
        description: "RCC Roof Slab 120mm with Shuttering & Vibrator compaction",
        unit: "sq.ft",
        quantity: 1850,
        rate: 330,
        include_material: true,
        include_labour: true,
        material_rate: 220,
        labour_rate: 110,
        amount: 610500
      },
      {
        id: "li_3",
        service_id: "srv_vitrified_flooring",
        description: "Vitrified Tile Flooring 800x800 Kajaria with adhesive",
        unit: "sq.ft",
        quantity: 1600,
        rate: 120,
        include_material: true,
        include_labour: true,
        material_rate: 85,
        labour_rate: 35,
        amount: 192000
      },
      {
        id: "li_4",
        service_id: "srv_interior_painting",
        description: "Interior 2 coats Putty + Primer + Asian Paints Royale Emulsion",
        unit: "sq.ft",
        quantity: 4200,
        rate: 42,
        include_material: true,
        include_labour: true,
        material_rate: 24,
        labour_rate: 18,
        amount: 176400
      }
    ],
    discount_type: "amount",
    discount_value: 20000,
    discount_amount: 20000,
    enable_tax: false,
    tax_rate: 0,
    tax_amount: 0,
    subtotal: 1212900,
    material_subtotal: 802300,
    labour_subtotal: 410600,
    total: 1192900,
    notes: "Quotation includes structural execution, premium floor finishes, and complete interior aesthetic paint as per drawing Rev 2.2.",
    terms_clause_ids: ["term_validity", "term_payment_schedule", "term_water_electricity", "term_variations_extra", "term_defects_liability"],
    contractor_ids: ["cntr_santhosh_masonry", "cntr_sujith_tiles", "cntr_shine_painting"],
    created_at: "2026-02-10T10:30:00.000Z",
    updated_at: "2026-02-12T14:15:00.000Z"
  },
  {
    id: "qtn_2026_002",
    quotation_no: "QTN-2026-002",
    status: "pending",
    client_name: "Adv. Sreevalsan Menon",
    client_phone: "+91 94462 77119",
    client_email: "sreevalsan.legal@yahoo.com",
    site_address: "Near Sree Rama Temple, Keralassery Grama Panchayat",
    plot_area_sqft: 1800,
    date_issued: "2026-02-24",
    expiry_date: "2026-03-26",
    line_items: [
      {
        id: "li_21",
        service_id: "srv_solid_block_6inch",
        description: "Solid Concrete Block Masonry 6\" (CM 1:6) with curing",
        unit: "sq.ft",
        quantity: 2100,
        rate: 150,
        include_material: true,
        include_labour: true,
        material_rate: 98,
        labour_rate: 52,
        amount: 315000
      },
      {
        id: "li_22",
        service_id: "srv_internal_plastering",
        description: "Internal Wall Plastering 12mm thick in CM 1:4 smooth finish",
        unit: "sq.ft",
        quantity: 3800,
        rate: 54,
        include_material: true,
        include_labour: true,
        material_rate: 26,
        labour_rate: 28,
        amount: 205200
      },
      {
        id: "li_23",
        service_id: "srv_truss_roofing",
        description: "GI Truss Work with Kerala Clay Terracotta Tiles",
        unit: "sq.ft",
        quantity: 1200,
        rate: 280,
        include_material: true,
        include_labour: true,
        material_rate: 195,
        labour_rate: 85,
        amount: 336000
      }
    ],
    discount_type: "percentage",
    discount_value: 3,
    discount_amount: 25686,
    enable_tax: false,
    tax_rate: 0,
    tax_amount: 0,
    subtotal: 856200,
    material_subtotal: 538600,
    labour_subtotal: 317600,
    total: 830514,
    notes: "Special sloped traditional roof truss with heritage terracotta tiles over first-floor terrace.",
    terms_clause_ids: ["term_validity", "term_payment_schedule", "term_water_electricity", "term_variations_extra"],
    contractor_ids: ["cntr_santhosh_masonry", "cntr_apex_fabrication"],
    created_at: "2026-02-24T11:00:00.000Z",
    updated_at: "2026-02-24T11:00:00.000Z"
  }
];

// --- Persistent Storage Helpers ---

export function loadQuotations(): Quotation[] {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEYS.QUOTATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed loading quotations from storage:", e);
  }
  // Store default seed
  saveQuotations(INITIAL_QUOTATIONS);
  return INITIAL_QUOTATIONS;
}

export function saveQuotations(list: Quotation[]): void {
  try {
    localStorage.setItem(QUOTATION_STORAGE_KEYS.QUOTATIONS, JSON.stringify(list));
    // Optional firestore sync for each quotation if available
    if (db) {
      list.forEach((q) => {
        safeSetDoc(doc(db, "quotations", q.id), q, { merge: true }).catch(() => {});
      });
    }
  } catch (e) {
    console.warn("Failed saving quotations:", e);
  }
}

export function loadQuotationServices(): QuotationService[] {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEYS.SERVICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed loading quotation services:", e);
  }
  saveQuotationServices(DEFAULT_SERVICES);
  return DEFAULT_SERVICES;
}

export function saveQuotationServices(list: QuotationService[]): void {
  try {
    localStorage.setItem(QUOTATION_STORAGE_KEYS.SERVICES, JSON.stringify(list));
    if (db) {
      list.forEach((s) => {
        safeSetDoc(doc(db, "quotation_services", s.id), s, { merge: true }).catch(() => {});
      });
    }
  } catch (e) {
    console.warn("Failed saving services:", e);
  }
}

export function loadContractors(): Contractor[] {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEYS.CONTRACTORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed loading contractors:", e);
  }
  saveContractors(DEFAULT_CONTRACTORS);
  return DEFAULT_CONTRACTORS;
}

export function saveContractors(list: Contractor[]): void {
  try {
    localStorage.setItem(QUOTATION_STORAGE_KEYS.CONTRACTORS, JSON.stringify(list));
    if (db) {
      list.forEach((c) => {
        safeSetDoc(doc(db, "quotation_contractors", c.id), c, { merge: true }).catch(() => {});
      });
    }
  } catch (e) {
    console.warn("Failed saving contractors:", e);
  }
}

export function loadTermsClauses(): TermsClause[] {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEYS.TERMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed loading terms:", e);
  }
  saveTermsClauses(DEFAULT_TERMS);
  return DEFAULT_TERMS;
}

export function saveTermsClauses(list: TermsClause[]): void {
  try {
    localStorage.setItem(QUOTATION_STORAGE_KEYS.TERMS, JSON.stringify(list));
    if (db) {
      list.forEach((t) => {
        safeSetDoc(doc(db, "quotation_terms", t.id), t, { merge: true }).catch(() => {});
      });
    }
  } catch (e) {
    console.warn("Failed saving terms:", e);
  }
}
