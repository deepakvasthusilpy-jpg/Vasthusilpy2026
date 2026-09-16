import { SubscriptionRequest, SubscriptionStatus, AccessLevel, MainSectionType, TabType } from "../types";
import { db } from "../lib/firebase";
import { doc, setDoc, getDoc, collection, onSnapshot, deleteDoc } from "firebase/firestore";

export const UPI_ID = "7012383137@okbizaxis";
export const UPI_PAYEE_NAME = "Vasthusilpy Deepak K";
export const UPI_NOTE = "Vasthusilpy Engineering Portal Subscription";
export const DEFAULT_SUBSCRIPTION_FEE_INR = 200;
export const SUBSCRIPTION_FEE_INR = 200;

export interface UpiPricingPlan {
  amount: number;
  label: string;
  labelMl: string;
  durationDays: number;
  durationLabel: string;
  popular?: boolean;
  isFree?: boolean;
}

export const UPI_PRICING_PLANS: UpiPricingPlan[] = [
  {
    amount: 0,
    label: "7-Day Free Trial Pass",
    labelMl: "സൗജന്യ ട്രയൽ (Free Trial)",
    durationDays: 7,
    durationLabel: "7 Days Free",
    isFree: true
  },
  {
    amount: 200,
    label: "1 Month Pro Pass",
    labelMl: "1 മാസം (₹200)",
    durationDays: 30,
    durationLabel: "30 Days Access",
    popular: true
  },
  {
    amount: 400,
    label: "2 Months Pro Pass",
    labelMl: "2 മാസം (₹400)",
    durationDays: 60,
    durationLabel: "60 Days Access"
  },
  {
    amount: 600,
    label: "3 Months Quarter Pass",
    labelMl: "3 മാസം (₹600)",
    durationDays: 90,
    durationLabel: "90 Days Access"
  },
  {
    amount: 1200,
    label: "6 Months Half-Yearly Pass",
    labelMl: "6 മാസം (₹1,200)",
    durationDays: 180,
    durationLabel: "180 Days Access"
  },
  {
    amount: 2400,
    label: "Annual Full Access Pass",
    labelMl: "1 വർഷം / Annual (₹2,400)",
    durationDays: 365,
    durationLabel: "365 Days Full Access"
  }
];

/**
 * Validates whether the amount is either 0 or a multiple of 200
 */
export function isValidUpiAmount(amount: number): boolean {
  if (amount === 0) return true;
  return amount > 0 && amount % 200 === 0;
}

/**
 * Normalizes an amount to 0 or the nearest multiple of 200
 */
export function normalizeUpiAmount(amount: number): number {
  if (amount <= 0) return 0;
  return Math.round(amount / 200) * 200;
}

/**
 * Generates standard UPI payment URL link
 */
export function getUpiPaymentUrl(amount: number = DEFAULT_SUBSCRIPTION_FEE_INR, refNote: string = UPI_NOTE, payeeName: string = UPI_PAYEE_NAME): string {
  if (amount <= 0) {
    return "";
  }
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: refNote
  });
  return `upi://pay?${params.toString()}`;
}

/**
 * Generates QR Code image URL for UPI payment
 */
export function getUpiQrCodeUrl(amount: number = DEFAULT_SUBSCRIPTION_FEE_INR, refNote: string = UPI_NOTE): string {
  if (amount <= 0) {
    return "";
  }
  const upiUrl = getUpiPaymentUrl(amount, refNote);
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(upiUrl)}&margin=10`;
}


export interface TabPermissionDefinition {
  sectionId: MainSectionType;
  sectionTitle: string;
  sectionTitleMl: string;
  tabs: {
    id: TabType;
    label: string;
    labelMl: string;
    description: string;
    badge?: string;
  }[];
}

export const ALL_APP_MODULES: TabPermissionDefinition[] = [
  {
    sectionId: "home",
    sectionTitle: "Home & Business Overview",
    sectionTitleMl: "ഹോം & പ്രൊഫൈൽ",
    tabs: [
      {
        id: "home_overview" as TabType,
        label: "Home & Profile Overview",
        labelMl: "ഹോം & ബിസിനസ്സ് വിവരണം",
        description: "Official portfolio, engineer profile, contact & quick navigation"
      },
      {
        id: "all_tools" as TabType,
        label: "All Tools Dashboard (35)",
        labelMl: "എല്ലാ ടൂളുകളും (35)",
        description: "Comprehensive multi-discipline engineering, vastu, survey & estimation tools suite"
      }
    ]
  },
  {
    sectionId: "ai_agent",
    sectionTitle: "Unified AI Chief Architect & Engineer",
    sectionTitleMl: "AI ആർക്കിടെക്റ്റ് & എഞ്ചിനീയർ",
    tabs: [
      {
        id: "ai_agent_chat" as TabType,
        label: "AI Chief Engineer Live Chat",
        labelMl: "AI ചീഫ് എഞ്ചിനീയർ ചാറ്റ്",
        description: "Live male AI avatar with voice conversation & multimodality"
      },
      {
        id: "ai_vastu" as TabType,
        label: "Thachu Shastra & Vastu Audit",
        labelMl: "തച്ചു ശാസ്ത്ര & വാസ്തു ഓഡിറ്റ്",
        description: "Traditional Kol calculations, Yonis, Aayam and room placement"
      },
      {
        id: "ai_kpbr" as TabType,
        label: "KPBR 2019/2026 Building Rules AI",
        labelMl: "KPBR 2019/2026 കെട്ടിട ചട്ടങ്ങൾ",
        description: "Setback checks, FAR, coverage and August 2026 Gazette rules"
      },
      {
        id: "ai_survey" as TabType,
        label: "Land Survey & FMB AI",
        labelMl: "ഭൂമി സർവ്വേ & FMB പരിശോധന",
        description: "FMB ladder readings, tie lines, offsets and land conversions"
      },
      {
        id: "ai_estimate" as TabType,
        label: "Rate Estimator & BOQ AI",
        labelMl: "എസ്റ്റിമേറ്റ് & നിരക്ക് വിശകലനം",
        description: "Kerala PWD DSR rates, materials quantity and cost reduction"
      },
      {
        id: "ai_structural" as TabType,
        label: "Civil & Structural Guide AI",
        labelMl: "സിവിൽ & സ്ട്രക്ചറൽ ഗൈഡ്",
        description: "IS 456 concrete mixes, BBS bar bending and shuttering times"
      },
      {
        id: "ai_visual_scanner" as TabType,
        label: "Blueprint & Plan Vision Scanner",
        labelMl: "ബ്ലൂപ്രിന്റ് & പ്ലാൻ സ്കാനർ",
        description: "Multimodal OCR drawing and floor plan audit"
      }
    ]
  },
  {
    sectionId: "office_dashboard",
    sectionTitle: "CRM",
    sectionTitleMl: "CRM",
    tabs: [
      {
        id: "office_crm_projects" as TabType,
        label: "Projects Pipeline",
        labelMl: "പ്രോജക്ട്സ് പൈപ്പ്ലൈൻ",
        description: "Live projects tracking, stages, and client assignment"
      },
      {
        id: "office_tasks" as TabType,
        label: "Tasks & Sub-Tasks",
        labelMl: "ടാസ്കുകൾ & ഉപടാസ്കുകൾ",
        description: "Task delegations, milestones and progress checklists"
      },
      {
        id: "office_activities" as TabType,
        label: "Activity History",
        labelMl: "ആക്ടിവിറ്റി ഹിസ്റ്ററി",
        description: "Audit trail, logs and operations history"
      }
    ]
  },
  {
    sectionId: "invoices_payments",
    sectionTitle: "Invoices & Payments Workstation",
    sectionTitleMl: "ഇൻവോയ്‌സ് & പേയ്‌മെന്റുകൾ",
    tabs: [
      {
        id: "invoices_list" as TabType,
        label: "Invoices & Billing",
        labelMl: "ഇൻവോയ്‌സ് ലിസ്റ്റ് & ബില്ലിംഗ്",
        description: "GST/Standard invoice generator, receipts & payment logs"
      },
      {
        id: "products_services" as TabType,
        label: "Products & Services Catalog",
        labelMl: "പ്രൊഡക്ട്സ് & സർവീസസ് കാറ്റലോഗ്",
        description: "Master rate lists, units, and SAC codes"
      },
      {
        id: "customers" as TabType,
        label: "Customers Directory",
        labelMl: "കസ്റ്റമേഴ്സ് / ക്ലയന്റ് വിവരങ്ങൾ",
        description: "Clients, billing addresses, and contact ledger"
      },
      {
        id: "reports_analysis" as TabType,
        label: "Reports & Financial Analysis",
        labelMl: "റിപ്പോർട്ടുകൾ & അനലിറ്റിക്‌സ്",
        description: "Cash flows, receivables, and revenue charts"
      },
      {
        id: "client_view" as TabType,
        label: "Client View Portal & Links",
        labelMl: "ക്ലൈൻ്റ് വ്യൂ പോർട്ടൽ",
        description: "Secure sharing links for client live progress & invoice review"
      }
    ]
  },
  {
    sectionId: "vasthu",
    sectionTitle: "Vasthu Shastra Calculation Suite",
    sectionTitleMl: "വാസ്തു ശാസ്ത്രം",
    tabs: [
      {
        id: "calculator" as TabType,
        label: "Vasthu Calculator",
        labelMl: "വാസ്തു കാൽക്കുലേറ്റർ",
        description: "Kol, Viral, Chuttu, Aayam, Vyayam, Yoni & Gunadosha"
      },
      {
        id: "side_finder" as TabType,
        label: "Side Finder",
        labelMl: "വശങ്ങൾ കണ്ടെത്തുക",
        description: "Optimal length/breadth dimensions based on perimeter"
      },
      {
        id: "perimeter_vasthu" as TabType,
        label: "2-Side Perimeter Vastu",
        labelMl: "ഇരുവശ ചുറ്റളവ് & വാസ്തു",
        description: "2-side perimeter calculation and energy balance"
      },
      {
        id: "table" as TabType,
        label: "Full Vasthu Data Table",
        labelMl: "പൂർണ്ണ വാസ്തു പട്ടിക",
        description: "Comprehensive 1,000+ row Thachu Shastra reference data"
      },
      {
        id: "attachment" as TabType,
        label: "Original Manuscript Pages",
        labelMl: "മൂലരേഖ താളുകൾ (17 Pages)",
        description: "High-resolution scanned pages of traditional manuscripts"
      },
      {
        id: "guide" as TabType,
        label: "Vasthu Guidelines & Rules",
        labelMl: "തച്ചുശാസ്ത്ര നിയമ പുസ്തകം",
        description: "Principles, orientation, and layout best practices"
      }
    ]
  },
  {
    sectionId: "building_rules",
    sectionTitle: "Kerala Building Rules (KPBR 2019/2026)",
    sectionTitleMl: "കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ (KPBR)",
    tabs: [
      {
        id: "rules_ai_chat" as TabType,
        label: "KPBR AI Chat Assistant",
        labelMl: "vasthusilpy-ai ചട്ട ചാറ്റ്",
        description: "Instant answers on Kerala Municipality & Panchayat building rules"
      },
      {
        id: "rules_search" as TabType,
        label: "Rule Search & Gazette Index",
        labelMl: "നിയമ തിരച്ചിൽ & ഗസറ്റ്",
        description: "Searchable database of gazette notifications and amendments"
      },
      {
        id: "rules_occupancies" as TabType,
        label: "Occupancies A1 to J",
        labelMl: "ഉപയോഗ ഗണങ്ങൾ (A1 - J)",
        description: "Residential, commercial, educational & industrial norms"
      },
      {
        id: "rules_calculator" as TabType,
        label: "Setback Calculator",
        labelMl: "സെറ്റ്ബാക്ക് കാൽക്കുലേറ്റർ",
        description: "Front, rear, side open space and road widening requirements"
      },
      {
        id: "rules_calculators" as TabType,
        label: "Building Technical Calculators",
        labelMl: "ബിൽഡിംഗ് കാൽക്കുലേറ്ററുകൾ",
        description: "FAR, coverage, parking requirement & access road calculators"
      }
    ]
  },
  {
    sectionId: "ksmart",
    sectionTitle: "KSMART Kerala LSGD Portal & Tracking",
    sectionTitleMl: "കെ-സ്മാർട്ട് (KSMART LSGD)",
    tabs: [
      {
        id: "rules_ksmart" as TabType,
        label: "KSMART File Tracking",
        labelMl: "KSMART ഫയൽ ട്രാക്കിംഗ്",
        description: "Live LSGD permit application tracker and status lookup"
      },
      {
        id: "ksmart_plan_scrutiny" as TabType,
        label: "Auto-DCR CAD Plan Scrutiny",
        labelMl: "CAD പ്ലാൻ സ്ക്രൂട്ടീനി",
        description: "KSMART official building plan scrutiny suite and Auto-DCR compliance"
      },
      {
        id: "ksmart_quick_certificates" as TabType,
        label: "Quick Certificates Portal",
        labelMl: "ക്വിക്ക് സർട്ടിഫിക്കറ്റുകൾ",
        description: "Official KSMART portal for Birth, Death, Marriage certificates and trade licenses"
      },
      {
        id: "ksmart_property_tax" as TabType,
        label: "Property Tax & Assessment",
        labelMl: "കെട്ടിട നികുതി",
        description: "LSGD Sanchaya and K-SMART property tax lookup and online payments"
      }
    ]
  },
  {
    sectionId: "survey",
    sectionTitle: "Land Survey & Coordinates",
    sectionTitleMl: "സർവ്വേ & ലാൻഡ് ഏരിയ",
    tabs: [
      {
        id: "missing_side" as TabType,
        label: "Missing Side Calculator (GEO-04)",
        labelMl: "മിസ്സിംഗ് സൈഡ് കാൽക്കുലേറ്റർ",
        description: "Coordinate geometry and missing boundary edge computations"
      },
      {
        id: "land_area" as TabType,
        label: "Land Area Calculator (Heron's Formula)",
        labelMl: "ഭൂവിസ്തൃതി കണക്കുകൂട്ടൽ",
        description: "Triangulation, cent, acre, sq.m & sq.ft calculations"
      },
      {
        id: "unit_converters" as TabType,
        label: "Length & Area Converters",
        labelMl: "യൂണിറ്റ് കൺവെർട്ടർ",
        description: "Kole, Link, Meter, Feet, Guntha, Cent, Ares conversions"
      },
      {
        id: "survey_ai_agent" as TabType,
        label: "Survey AI Agent",
        labelMl: "സർവ്വേ AI ഏജന്റ്",
        description: "Intelligent land survey, FMB sketch analysis & advice"
      }
    ]
  },
  {
    sectionId: "civil",
    sectionTitle: "Civil Engineering & Structural Estimators",
    sectionTitleMl: "സിവിൽ എഞ്ചിനീയറിംഗ്",
    tabs: [
      {
        id: "brick_masonry" as TabType,
        label: "Brick Masonry Calculator",
        labelMl: "ബ്രിക്ക് മേസൺറി കാൽക്കുലേറ്റർ",
        description: "IS 1077 Standard brick counts, sand and cement requirements"
      },
      {
        id: "concrete_block" as TabType,
        label: "Concrete Block Calculator",
        labelMl: "കോൺക്രീറ്റ് ബ്ലോക്ക് കാൽക്കുലേറ്റർ",
        description: "Solid & hollow CMU block estimation with mortar quantities"
      },
      {
        id: "cement_concrete" as TabType,
        label: "Cement Concrete Mix Calculator",
        labelMl: "സിമന്റ് കോൺക്രീറ്റ് മിക്സ് (PCC/RCC)",
        description: "IS 456 M15, M20, M25 mix design, dry volume & aggregates"
      },
      {
        id: "material_quantity_bbs" as TabType,
        label: "Material Quantity & BBS",
        labelMl: "മെറ്റീരിയൽ ക്വാണ്ടിറ്റി & ബാർ ബെൻഡിംഗ് (BBS)",
        description: "Reinforcement bar cutting schedules, steel weight & BOQ"
      }
    ]
  },
  {
    sectionId: "estimate",
    sectionTitle: "Estimater",
    sectionTitleMl: "എസ്റ്റിമേറ്റർ",
    tabs: [
      {
        id: "estimate_dashboard" as TabType,
        label: "Estimate Projects Dashboard",
        labelMl: "എസ്റ്റിമേറ്റ് ഡാഷ്‌ബോർഡ്",
        description: "All client estimates directory, duplication, and exports"
      },
      {
        id: "estimate_sheet" as TabType,
        label: "Detailed Quantity Estimate Sheet",
        labelMl: "വിശദമായ റേറ്റ് എസ്റ്റിമേറ്റ് ഷീറ്റ് (BOQ)",
        description: "Deductions, sub-items, CPWD/DSR rates and stage totals"
      },
      {
        id: "stage_completion_certificate" as TabType,
        label: "Stage & Completion Certificate",
        labelMl: "സ്റ്റേജ് & കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ്",
        description: "Stage progress and building completion certificates with engineer seal"
      },
      {
        id: "items_of_work" as TabType,
        label: "Items of Work Master Library",
        labelMl: "ഐറ്റം ഓഫ് വർക്ക് ലൈബ്രറി",
        description: "Standard specifications, rates, and deduction item templates"
      },
      {
        id: "engineer_seals" as TabType,
        label: "Engineer Seals & Signatures",
        labelMl: "എഞ്ചിനീയർ സീൽ & സൈൻ",
        description: "Consultant seal configuration, signature canvas & stamps"
      },
      {
        id: "estimate_ai_agent" as TabType,
        label: "Estimate AI Agent",
        labelMl: "എസ്റ്റിമേറ്റ് AI ഏജന്റ്",
        description: "Automated BOQ generation and rate optimization assistant"
      }
    ]
  },
  {
    sectionId: "personal_bills",
    sectionTitle: "Personal Bills & Payments",
    sectionTitleMl: "വ്യക്തിഗത ബില്ലുകളും പേയ്‌മെന്റുകളും",
    tabs: [
      {
        id: "poov_mala_bill" as TabType,
        label: "Poov Mala & Floral Bills",
        labelMl: "പൂവ് മാല ബിൽ",
        description: "Spreadsheet calculation, reference photos, rate per unit and balance tracker"
      },
      {
        id: "kseb_bills" as TabType,
        label: "KSEB Electricity Bills",
        labelMl: "KSEB വൈദ്യുതി ബില്ലുകൾ",
        description: "Consumer numbers, bi-monthly bills, dues, and KSEB quick-pay"
      },
      {
        id: "health_insurance" as TabType,
        label: "Health Insurance & Mediclaim",
        labelMl: "ആരോഗ്യ ഇൻഷുറൻസ്",
        description: "Policy renewals, sums insured, premium schedules and TPA support"
      },
      {
        id: "rd_accounts" as TabType,
        label: "Recurring Deposits (RD)",
        labelMl: "ആവർത്തന നിക്ഷേപം (RD)",
        description: "60-month passbook matrix, interest rates, and maturity ledger"
      },
      {
        id: "panchayath_bills" as TabType,
        label: "Panchayath Fees & Licences",
        labelMl: "പഞ്ചായത്ത് ഫീസ് & ലൈസൻസുകൾ",
        description: "D&O trade licences, building property taxes and K-SMART records"
      },
      {
        id: "personal_vendors" as TabType,
        label: "Vendors & Bills Ledger",
        labelMl: "വെണ്ടർമാരും ബില്ലുകളും",
        description: "Vendor directory, custom bill creation, GPay UPI QR codes and ledger"
      }
    ]
  },
  {
    sectionId: "data_storage_vault",
    sectionTitle: "Data Storage Vault",
    sectionTitleMl: "ഡാറ്റാ സ്റ്റോറേജ് & ഫയൽ വോൾട്ട്",
    tabs: [
      {
        id: "vault_dashboard" as TabType,
        label: "Vault Dashboard",
        labelMl: "ഡാഷ്‌ബോർഡ്",
        description: "Storage overview, category distribution, recent uploads and search"
      },
      {
        id: "vault_plan" as TabType,
        label: "1. Plan (Architectural & Vastu)",
        labelMl: "1. പ്ലാൻ",
        description: "2D Floor plans, Vastu layout, structural drawings and CAD files"
      },
      {
        id: "vault_3d" as TabType,
        label: "2. 3D (Elevations & Renders)",
        labelMl: "2. 3D എലിവേഷൻ",
        description: "3D exterior elevations, interior renders and walkthroughs"
      },
      {
        id: "vault_estimate" as TabType,
        label: "3. Estimate (BOQ & Costing)",
        labelMl: "3. എസ്റ്റിമേറ്റ്",
        description: "Detailed estimation sheets, BOQ reports and rate cards"
      },
      {
        id: "vault_survey" as TabType,
        label: "4. Survey (Land & FMB)",
        labelMl: "4. സർവ്വേ & FMB",
        description: "Land survey sketches, FMB subdivision plans and plot layouts"
      },
      {
        id: "vault_documents" as TabType,
        label: "5. Documents & Permits",
        labelMl: "5. ഡോക്യുമെന്റുകൾ",
        description: "LSGD building permits, office documents, deeds and contracts"
      },
      {
        id: "vault_settings" as TabType,
        label: "Vault Settings & Folders",
        labelMl: "ഫോൾഡർ ക്രമീകരണങ്ങൾ",
        description: "Add, edit, delete folders, storage quota and cloud sync"
      }
    ]
  }
];

export const ALL_TAB_IDS: TabType[] = ALL_APP_MODULES.flatMap((m) => m.tabs.map((t) => t.id));

export const DEFAULT_FULL_PERMISSIONS: Record<string, AccessLevel> = ALL_TAB_IDS.reduce((acc, tabId) => {
  acc[tabId] = "full";
  return acc;
}, {} as Record<string, AccessLevel>);

export const DEFAULT_PREVIEW_PERMISSIONS: Record<string, AccessLevel> = ALL_TAB_IDS.reduce((acc, tabId) => {
  acc[tabId] = "preview";
  return acc;
}, {} as Record<string, AccessLevel>);

export const PRESET_ESTIMATE_CIVIL_PERMISSIONS: Record<string, AccessLevel> = ALL_TAB_IDS.reduce((acc, tabId) => {
  if (
    tabId.startsWith("estimate") ||
    tabId === "items_of_work" ||
    tabId === "stage_completion_certificate" ||
    tabId === "engineer_seals" ||
    tabId === "brick_masonry" ||
    tabId === "concrete_block" ||
    tabId === "cement_concrete" ||
    tabId === "material_quantity_bbs" ||
    tabId.startsWith("invoices_") ||
    tabId === "home_overview" ||
    tabId === "all_tools"
  ) {
    acc[tabId] = "full";
  } else {
    acc[tabId] = "preview";
  }
  return acc;
}, {} as Record<string, AccessLevel>);

export const PRESET_VASTHU_RULES_PERMISSIONS: Record<string, AccessLevel> = ALL_TAB_IDS.reduce((acc, tabId) => {
  if (
    tabId === "calculator" ||
    tabId === "side_finder" ||
    tabId === "perimeter_vasthu" ||
    tabId.startsWith("ai_") ||
    tabId === "table" ||
    tabId === "attachment" ||
    tabId === "guide" ||
    tabId.startsWith("rules_") ||
    tabId.startsWith("missing_") ||
    tabId.startsWith("land_") ||
    tabId === "home_overview" ||
    tabId === "all_tools"
  ) {
    acc[tabId] = "full";
  } else {
    acc[tabId] = "preview";
  }
  return acc;
}, {} as Record<string, AccessLevel>);

/**
 * Calculates end date in YYYY-MM-DD format based on either validity in days or specific date string.
 */
export function calculateExpiryDate(
  validityType: "days" | "date",
  validDays: number = 30,
  specificDateStr?: string
): string {
  if (validityType === "date" && specificDateStr && specificDateStr.trim()) {
    return specificDateStr.trim().slice(0, 10);
  }
  const date = new Date();
  date.setDate(date.getDate() + (validDays > 0 ? validDays : 30));
  return date.toISOString().split("T")[0];
}

/**
 * Checks if subscription is expired
 */
export function isSubscriptionExpired(sub: { validUntil?: string; status?: SubscriptionStatus }): boolean {
  if (sub.status === "expired") return true;
  if (!sub.validUntil) return false;
  try {
    const expiry = new Date(sub.validUntil);
    // Set expiry to end of day in local time
    expiry.setHours(23, 59, 59, 999);
    return Date.now() > expiry.getTime();
  } catch {
    return false;
  }
}

/**
 * Gets remaining days until expiration
 */
export function getRemainingDays(validUntil?: string): number {
  if (!validUntil) return 0;
  try {
    const expiry = new Date(validUntil);
    expiry.setHours(23, 59, 59, 999);
    const diffMs = expiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

const STORAGE_KEY = "vasthusilpy_subscription_requests";
export const FREE_TRIAL_CLAIMS_KEY = "vasthusilpy_free_trial_claims";
export const DELETED_SUBS_KEY = "vasthusilpy_deleted_sub_ids";

export function getDeletedSubIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_SUBS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordDeletedSubId(id: string): void {
  try {
    const prev = getDeletedSubIds();
    if (!prev.includes(id)) {
      localStorage.setItem(DELETED_SUBS_KEY, JSON.stringify([...prev, id]));
    }
  } catch {}
}

export interface FreeTrialClaim {
  email: string;
  phone: string;
  claimedAt: string;
  subId?: string;
}

/**
 * Loads all recorded Free Trial claims
 */
export function getClaimedFreeTrials(): FreeTrialClaim[] {
  try {
    const raw = localStorage.getItem(FREE_TRIAL_CLAIMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading free trial claims:", err);
    return [];
  }
}

/**
 * Checks whether an email address OR a phone number has already used a Free Trial
 */
export function hasUsedFreeTrial(
  email?: string,
  phone?: string,
  subsList?: SubscriptionRequest[]
): boolean {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPhoneDigits = (phone || "").trim().replace(/\D/g, "").slice(-10);

  if (!cleanEmail && !cleanPhoneDigits) return false;

  // 1. Check local claimed free trials store
  const claims = getClaimedFreeTrials();
  const foundInClaims = claims.some((c) => {
    const cEmail = (c.email || "").toLowerCase().trim();
    const cPhoneDigits = (c.phone || "").replace(/\D/g, "").slice(-10);
    const emailMatch = cleanEmail && cEmail && cEmail === cleanEmail;
    const phoneMatch = cleanPhoneDigits && cPhoneDigits && cleanPhoneDigits.length >= 10 && cPhoneDigits === cleanPhoneDigits;
    return emailMatch || phoneMatch;
  });
  if (foundInClaims) return true;

  // 2. Check loaded / active subscription requests list for ₹0 or Free Trial plan
  const subs = subsList || loadSavedSubscriptionRequests();
  const foundInSubs = subs.some((s) => {
    const isTrial =
      s.amountPaid === 0 ||
      (s.planName && s.planName.toLowerCase().includes("free trial")) ||
      (s.notes && s.notes.toLowerCase().includes("free trial")) ||
      s.upiRefId === "FREE-TRIAL";

    if (!isTrial) return false;

    const sEmail = (s.email || "").toLowerCase().trim();
    const sPhoneDigits = (s.phone || "").replace(/\D/g, "").slice(-10);
    const emailMatch = cleanEmail && sEmail && sEmail === cleanEmail;
    const phoneMatch = cleanPhoneDigits && sPhoneDigits && cleanPhoneDigits.length >= 10 && sPhoneDigits === cleanPhoneDigits;
    return emailMatch || phoneMatch;
  });

  return foundInSubs;
}

/**
 * Records a free trial claim for an email and mobile number both in localStorage and Firestore
 */
export async function recordFreeTrialClaim(email?: string, phone?: string, subId?: string): Promise<void> {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPhone = (phone || "").trim().replace(/\D/g, "");
  const newClaim: FreeTrialClaim = {
    email: cleanEmail,
    phone: cleanPhone,
    claimedAt: new Date().toISOString(),
    subId: subId || ""
  };

  try {
    const existing = getClaimedFreeTrials();
    const filtered = existing.filter(
      (c) => c.email !== cleanEmail && c.phone.replace(/\D/g, "").slice(-10) !== cleanPhone.slice(-10)
    );
    const updated = [newClaim, ...filtered];
    localStorage.setItem(FREE_TRIAL_CLAIMS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving free trial claim to localStorage:", err);
  }

  // Also sync claim to Firestore collection
  try {
    const claimDocId = cleanEmail.replace(/[^a-z0-9]/g, "_") || `phone_${cleanPhone}`;
    await setDoc(doc(db, "free_trial_claims", claimDocId), newClaim, { merge: true });
    if (cleanPhone) {
      await setDoc(doc(db, "free_trial_claims", `phone_${cleanPhone.slice(-10)}`), newClaim, { merge: true });
    }
  } catch (err) {
    console.warn("Firestore free_trial_claims sync note (offline fallback):", err);
  }
}

// Canonical Admin Subscription Profiles (Guarantees Admin subscription details are always available)
export const CANONICAL_ADMIN_SUB: SubscriptionRequest = {
  id: "SUB-ADMIN-DEEPAK",
  fullName: "DEEPAK C",
  email: "deepak.vasthusilpy@gmail.com",
  phone: "9747995961",
  password: "5161",
  upiRefId: "UPI-ADMIN-CANONICAL",
  requestedAt: "2026-01-01T00:00:00.000Z",
  planName: "Primary Admin Full Access Pass",
  amountPaid: 2400,
  validityType: "days",
  validUntil: "2099-12-31",
  validDays: 36500,
  status: "approved",
  notes: "Primary Admin Account with Unified Multi-Login Sync (9747995961 / deepak.vasthusilpy@gmail.com)",
  approvedAt: "2026-01-01T00:00:00.000Z",
  tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
};

export const CANONICAL_ADMIN_SUBS: SubscriptionRequest[] = [
  CANONICAL_ADMIN_SUB,
  {
    id: "SUB-2026-4188",
    fullName: "DEEPAK",
    email: "deepak.vasthusilpy@gmail.com",
    phone: "9747995961",
    password: "5161",
    upiRefId: "DIRECT-ADMIN",
    requestedAt: "2026-09-15T12:26:12.194Z",
    planName: "Admin Direct Authorization",
    amountPaid: 999,
    validityType: "days",
    validUntil: "2027-09-15",
    validDays: 365,
    status: "approved",
    notes: "deepak-user",
    approvedAt: "2026-09-15T12:26:12.194Z",
    approvedBy: "deepak.vasthusilpy@gmail.com",
    tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
  },
  {
    id: "SUB-2026-8947",
    fullName: "DIBIN",
    email: "dibindeepak1@gmail.com",
    phone: "9567627277",
    password: "5161",
    upiRefId: "DIRECT-ADMIN",
    requestedAt: "2026-09-15T12:26:43.369Z",
    planName: "Admin Direct Authorization",
    amountPaid: 999,
    validityType: "days",
    validUntil: "2027-09-15",
    validDays: 365,
    status: "approved",
    notes: "dibin-user",
    approvedAt: "2026-09-15T12:26:43.369Z",
    approvedBy: "deepak.vasthusilpy@gmail.com",
    tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
  },
  {
    id: "SUB-ADMIN-DEEPAK-2",
    fullName: "DEEPAK C",
    email: "deepak.vasthusilpy@gmail.com",
    phone: "9567627277",
    password: "5161",
    upiRefId: "UPI-ADMIN-CANONICAL-2",
    requestedAt: "2026-01-01T00:00:00.000Z",
    planName: "Primary Admin Full Access Pass",
    amountPaid: 2400,
    validityType: "days",
    validUntil: "2099-12-31",
    validDays: 36500,
    status: "approved",
    notes: "Primary Admin Account (9567627277)",
    approvedAt: "2026-01-01T00:00:00.000Z",
    tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
  },
  {
    id: "SUB-ADMIN-DIBIN",
    fullName: "DIBIN DEEPAK",
    email: "dibindeepak1@gmail.com",
    phone: "7012383137",
    password: "5161",
    upiRefId: "UPI-ADMIN-DIBIN",
    requestedAt: "2026-01-01T00:00:00.000Z",
    planName: "Admin Full Access Pass",
    amountPaid: 2400,
    validityType: "days",
    validUntil: "2099-12-31",
    validDays: 36500,
    status: "approved",
    notes: "Admin Account (7012383137)",
    approvedAt: "2026-01-01T00:00:00.000Z",
    tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
  }
];

export const INITIAL_SUBSCRIPTION_REQUESTS: SubscriptionRequest[] = [...CANONICAL_ADMIN_SUBS];

export function loadSavedSubscriptionRequests(): SubscriptionRequest[] {
  try {
    const deletedIds = new Set(getDeletedSubIds());
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: SubscriptionRequest[] = [];
    
    if (raw === null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(CANONICAL_ADMIN_SUBS));
      return CANONICAL_ADMIN_SUBS;
    }
    
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json)) parsed = json;
    } catch {}

    // Ensure canonical admin subscriptions are always present unless specifically deleted
    CANONICAL_ADMIN_SUBS.forEach((adminSub) => {
      if (!deletedIds.has(adminSub.id)) {
        const exists = parsed.some(
          (s) =>
            s &&
            (s.id === adminSub.id ||
              (s.email && s.email.toLowerCase().trim() === adminSub.email.toLowerCase().trim()) ||
              (s.phone && s.phone.replace(/\D/g, "").slice(-10) === adminSub.phone.replace(/\D/g, "").slice(-10)))
        );
        if (!exists) {
          parsed.unshift(adminSub);
        }
      }
    });

    return parsed
      .filter((item) => item && item.id && !deletedIds.has(item.id))
      .map((item) => {
        // Auto update status if expired
        if (item.status === "approved" && isSubscriptionExpired(item)) {
          return { ...item, status: "expired" as SubscriptionStatus };
        }
        return item;
      });
  } catch (err) {
    console.error("Error reading saved subscription requests:", err);
    return [...CANONICAL_ADMIN_SUBS];
  }
}

export function saveSubscriptionRequests(requests: SubscriptionRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    window.dispatchEvent(new CustomEvent("vasthusilpy_subscription_update", { detail: requests }));
  } catch (err) {
    console.error("Error saving subscription requests:", err);
  }
}

export function generateUniqueSubId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SUB-${new Date().getFullYear()}-${rand}`;
}
