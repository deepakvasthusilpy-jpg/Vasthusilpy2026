import QRCode from "qrcode";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  ConstructionAgreement,
  ConstructionProject,
  ConstructionSettings,
  ConstructionAuditLog,
  ConstructionStageDefinition,
  GeneralConditionClause,
  DetailedWorkSpecifications,
  ClientDetails,
  BuildingLocation,
  FloorAreaEntry,
  PaymentScheduleItem
} from "../types";

const STORAGE_KEYS = {
  PROJECTS: "vasthusilpy_construction_projects",
  AGREEMENTS: "vasthusilpy_construction_agreements",
  SETTINGS: "vasthusilpy_construction_settings",
  AUDIT_LOGS: "vasthusilpy_construction_audit_logs",
  VERIFICATION_TOKENS: "vasthusilpy_construction_verification_tokens"
};

// ============================================================================
// 1. INDIAN CURRENCY & NUMBER TO WORDS UTILITIES
// ============================================================================

export function formatIndianCurrency(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0";
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });
  return formatter.format(amount);
}

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertLessThanThousand(num: number): string {
  let str = "";
  if (num >= 100) {
    str += ONES[Math.floor(num / 100)] + " Hundred ";
    num %= 100;
  }
  if (num >= 20) {
    str += TENS[Math.floor(num / 10)] + " ";
    num %= 10;
  }
  if (num > 0) {
    str += ONES[num] + " ";
  }
  return str.trim();
}

/**
 * Converts Indian Rupee amounts to standard words (Crore, Lakh, Thousand, Hundred)
 * e.g. 2082400 -> "Rupees Twenty Lakh Eighty-Two Thousand Four Hundred Only"
 */
export function convertAmountToWords(amount: number): string {
  const num = Math.floor(Math.abs(amount));
  if (num === 0) return "Rupees Zero Only";

  const crore = Math.floor(num / 10000000);
  const remainderCrore = num % 10000000;
  const lakh = Math.floor(remainderCrore / 100000);
  const remainderLakh = remainderCrore % 100000;
  const thousand = Math.floor(remainderLakh / 1000);
  const remainderThousand = remainderLakh % 1000;

  let words = "Rupees ";
  if (crore > 0) {
    words += convertLessThanThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + " Thousand ";
  }
  if (remainderThousand > 0) {
    words += convertLessThanThousand(remainderThousand) + " ";
  }

  const paise = Math.round((Math.abs(amount) - num) * 100);
  if (paise > 0) {
    words += `and ${convertLessThanThousand(paise)} Paise `;
  }

  return words.trim() + " Only";
}

/**
 * Malayalam words conversion helper for formal agreements
 */
export function convertAmountToMalayalamWords(amount: number): string {
  const num = Math.floor(Math.abs(amount));
  if (num === 0) return "പൂജ്യം രൂപ മാത്രം";

  const lakh = Math.floor(num / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;

  let ml = "";
  if (lakh > 0) {
    ml += `${lakh} ലക്ഷത്തി `;
  }
  if (thousand > 0) {
    ml += `${thousand} ആയിരത്തി `;
  }
  if (hundreds > 0) {
    ml += `${hundreds} `;
  }
  return ml.trim() ? `${ml.trim()} രൂപ മാത്രം` : `${num} രൂപ മാത്രം`;
}

// ============================================================================
// 2. DEFAULT 25 CONSTRUCTION STAGES MASTER
// ============================================================================

export const DEFAULT_CONSTRUCTION_STAGES: ConstructionStageDefinition[] = [
  {
    id: "stage_01",
    order: 1,
    name: "Agreement / Advance",
    nameMl: "കരാർ ഒപ്പിടുമ്പോഴുള്ള അഡ്വാൻസ്",
    description: "Initial mobilization and agreement signing advance",
    percentage: 10,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "On signing of construction agreement",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_02",
    order: 2,
    name: "Site Clearing & Setting Out",
    nameMl: "സൈറ്റ് ക്ലിയറിംഗ് & ലേഔട്ട്",
    description: "Vegetation clearing, surface dressing, bench marking & pegging",
    percentage: 2,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of site clearing and center line layout",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_03",
    order: 3,
    name: "Earth Work Excavation",
    nameMl: "മണ്ണെടുപ്പ് & ട്രെഞ്ച് എക്സ്കവേഷൻ",
    description: "Excavation in ordinary/hard soil for foundation trenches",
    percentage: 3,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of trench excavation and pit leveling",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_04",
    order: 4,
    name: "Foundation & Footing",
    nameMl: "ഫൗണ്ടേഷൻ കോൺക്രീറ്റ് & റബ്ബിൾ",
    description: "PCC bed and rubble foundation up to ground level",
    percentage: 5,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of foundation masonry to ground level",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_05",
    order: 5,
    name: "Substructure & Basement",
    nameMl: "ബേസ്മെന്റ് മേസൺറി & പ്ലിന്ത് ബെൽറ്റ്",
    description: "Basement masonry in RR stone / solid blocks with cement mortar",
    percentage: 5,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of basement to plinth level",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_06",
    order: 6,
    name: "Plinth Beam / RCC Belt",
    nameMl: "പ്ലിന്ത് ബീം / RCC ബെൽറ്റ്",
    description: "RCC plinth beam casting with reinforcement and shuttering",
    percentage: 4,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Plinth beam casting and earth filling/consolidation",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_07",
    order: 7,
    name: "Ground Floor Masonry (Sill Level)",
    nameMl: "ഗ്രൗണ്ട് ഫ്ലോർ മേസൺറി (സിൽ ലെവൽ)",
    description: "Brick/block masonry up to window sill level with door frames fixed",
    percentage: 5,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Masonry up to window sill height",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_08",
    order: 8,
    name: "Lintel & Sunshade Casting",
    nameMl: "ലിന്റൽ ബീം & സൺഷെയ്ഡ് കാസ്റ്റിംഗ്",
    description: "Continuous RCC lintel, chajja/sunshade and cut-lintels",
    percentage: 8,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of lintel casting & sunshades",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_09",
    order: 9,
    name: "Masonry up to Slab Level",
    nameMl: "സ്ലാബ് ലെവൽ വരെയുള്ള മേസൺറി",
    description: "Superstructure wall masonry from lintel to roof ceiling level",
    percentage: 4,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Walls erected to ceiling slab bottom height",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_10",
    order: 10,
    name: "Ground Floor Main Slab Concrete",
    nameMl: "ഗ്രൗണ്ട് ഫ്ലോർ മെയിൻ സ്ലാബ് കോൺക്രീറ്റ്",
    description: "Centering, shuttering, steel reinforcement and M20 concrete slab casting",
    percentage: 15,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Casting of ground floor roof slab & beams",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_11",
    order: 11,
    name: "First Floor Masonry & Lintel",
    nameMl: "ഫസ്റ്റ് ഫ്ലോർ മേസൺറി & ലിന്റൽ",
    description: "First floor wall masonry, door frames, lintels & sunshades",
    percentage: 6,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "First floor walls and lintels completion",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_12",
    order: 12,
    name: "First Floor / Roof Slab Concrete",
    nameMl: "ഫസ്റ്റ് ഫ്ലോർ / റൂഫ് സ്ലാബ് കോൺക്രീറ്റ്",
    description: "Centering, shuttering, beam reinforcement and final roof casting",
    percentage: 8,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Casting of top roof slab / head room slab",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_13",
    order: 13,
    name: "Staircase Concrete & Parapet",
    nameMl: "സ്റ്റെയർകെയ്സ് കോൺക്രീറ്റ് & പാരപെറ്റ്",
    description: "Internal/external RCC staircase waist slab and parapet wall",
    percentage: 3,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of staircase and roof parapet walls",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_14",
    order: 14,
    name: "Brick Concealed Piping & Conduit",
    nameMl: "കൺസീൽഡ് ഇലക്ട്രിക്കൽ & പ്ലംബിംഗ് പൈപ്പിംഗ്",
    description: "Wall chasing, PVC conduits, metal switch boxes and drainage plumbing",
    percentage: 4,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Chasing and conduit box fixing before plastering",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_15",
    order: 15,
    name: "Internal & Ceiling Plastering",
    nameMl: "ഇന്റീരിയൽ & സീലിംഗ് പ്ലാസ്റ്ററിംഗ്",
    description: "Cement mortar 1:4/1:5 smooth finish internal plastering",
    percentage: 5,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of internal wall & ceiling plastering",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_16",
    order: 16,
    name: "External Rough & Sponge Plastering",
    nameMl: "എക്സ്റ്റീരിയൽ പ്ലാസ്റ്ററിംഗ്",
    description: "Two-coat external waterproof plastering with grooving",
    percentage: 4,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of all exterior wall plastering",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_17",
    order: 17,
    name: "Floor Bed Concrete (PCC)",
    nameMl: "ഫ്ലോർ ബെഡ് കോൺക്രീറ്റ് (PCC)",
    description: "Ground floor leveling, compaction and 1:4:8 PCC floor bed casting",
    percentage: 2,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of sub-floor concrete leveling",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_18",
    order: 18,
    name: "Tile & Granite Flooring Work",
    nameMl: "ടൈൽ & ഗ്രാനൈറ്റ് ഫ്ലോറിംഗ്",
    description: "Laying of vitrified floor tiles, granite for sit-out/steps & toilet wall cladding",
    percentage: 7,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of all room flooring and bathroom tiling",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_19",
    order: 19,
    name: "Doors, Windows & Glass Fixing",
    nameMl: "വാതിലുകൾ, ജനലുകൾ, ഗ്ലാസ്",
    description: "Teak main door, panel room doors, FRP bathroom doors and window shutters",
    percentage: 5,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Fitting of all doors, windows, glass panes and locks",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_20",
    order: 20,
    name: "Electrical Wiring & Modular Switches",
    nameMl: "ഇലക്ട്രിക്കൽ വയറിംഗ് & സ്വിച്ചുകൾ",
    description: "FRLS copper wiring, distribution board, MCBs, modular switches & plates",
    percentage: 3,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Wiring pull-through, DB setup & switch fixing",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_21",
    order: 21,
    name: "Plumbing, CP & Sanitary Fittings",
    nameMl: "പ്ലംബിംഗ്, CP & സാനിറ്ററി ഫിറ്റിംഗ്സ്",
    description: "Fixing of closets, wash basins, taps, showers, tank & connection testing",
    percentage: 3,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Fixing and water testing of all sanitary fixtures",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_22",
    order: 22,
    name: "Painting & Polishing Work",
    nameMl: "പെയിന്റിംഗ് & വുഡ് പോളിഷിംഗ്",
    description: "Putty application, primer coats, 2 coats premium emulsion & wood polish",
    percentage: 4,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of interior/exterior painting coats",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_23",
    order: 23,
    name: "Kitchen Counter & Sink Setup",
    nameMl: "കിച്ചൻ കൗണ്ടർ & സിങ്ക്",
    description: "Granite slab laying, sink installation, dado tiling and tap fixing",
    percentage: 2,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Kitchen counter granite & sink completion",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_24",
    order: 24,
    name: "Septic Tank & Soak Pit External Works",
    nameMl: "സെപ്റ്റിക് ടാങ്ക് & സോക്ക് പിറ്റ്",
    description: "Septic tank masonry, RCC slab cover, soak pit and yard leveling",
    percentage: 2,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Completion of septic tank connection and final external grading",
    displayInAgreement: true,
    isActive: true
  },
  {
    id: "stage_25",
    order: 25,
    name: "Final Cleaning & Key Handover",
    nameMl: "ഫൈനൽ ക്ലീനിംഗ് & കീ ഹാൻഡ്‌ഓവർ",
    description: "Final chemical cleaning of tiles, touch-ups, inspection and official handover",
    percentage: 2,
    calculationMode: "percentage",
    labourIncluded: true,
    paymentTrigger: "Final key handover and client satisfaction sign-off",
    displayInAgreement: true,
    isActive: true
  }
];

// ============================================================================
// 3. DEFAULT VASTHUSILPY WORK SPECIFICATIONS
// ============================================================================

export const DEFAULT_WORK_SPECIFICATIONS: DetailedWorkSpecifications = {
  substructure: {
    siteClearing: "Site clearing of vegetation, surface dressing, bench marking and setting out as per approved plan.",
    earthExcavation: "Excavation in ordinary soil and soft rock up to firm ground level (minimum 3.0 to 4.5 ft depth).",
    soilFilling: "Filling basement with selected excavated earth and good quality red earth / quarry muck in 15cm layers well compacted and watered.",
    foundation: "PCC bed 1:4:8 using 40mm broken granite metal of 10cm thickness.",
    foundationMasonry: "Random Rubble (RR) masonry in cement mortar 1:6 using hard blue granite stone for foundation.",
    basementMasonry: "Basement masonry in RR stone / Solid cement concrete blocks in CM 1:6 up to 2.5 ft above ground level.",
    rccBelt: "Continuous RCC plinth belt of 15cm x 20cm in M20 concrete using 10mm/8mm Fe500D TMT bars with 6mm stirrups.",
    cementSpec: "53 / 43 Grade PPC / OPC Cement (UltraTech / Ramco / ACC / Sankar).",
    steelSpec: "Fe-500D Grade TMT Steel bars (TATA Tiscon / Jindal / Kairali / Kalliyath).",
    sandSpec: "Manufactured Sand (M-Sand) for masonry and concrete, P-Sand (Plastering Sand) for plastering."
  },
  superstructure: {
    masonry: "Solid cement concrete blocks (12\"x8\"x6\" or 12\"x8\"x4\") or good quality wire-cut red bricks in cement mortar 1:6.",
    frames: "Good quality treated Hardwood / Mahagony / Anjili / Pressed steel frames for door & window openings.",
    lintel: "Continuous RCC lintel beam of 15cm depth in M20 concrete with 10mm & 8mm reinforcement.",
    mainRoofSlab: "10cm to 12cm thick RCC roof slab in M20 grade concrete (1:1.5:3) with Fe500D TMT reinforcement, vibrated and cured for 21 days.",
    toiletSlab: "Sunken / lowered RCC slab with water-proofing treatment using Dr. Fixit / Fosroc.",
    sunshade: "RCC cantilever sunshades of 45cm to 60cm projection with drip moulds.",
    kitchenSlab: "RCC kitchen counter slab with polished jet black granite top and stainless steel sink cutout.",
    staircase: "RCC waist-slab staircase with riser 15cm and tread 30cm in M20 concrete.",
    plastering: "Internal walls & ceiling plastered in CM 1:4 smooth finish (12mm). External walls plastered in CM 1:4 with 15mm double-coat sponge finish.",
    floorConcrete: "1:4:8 cement concrete floor bed 7.5cm thick compacted on filled basement before tiling.",
    labourSpec: "All skilled and unskilled masonry, carpentry, barbending, plumbing and electrical labour included in contract.",
    concreteMaterials: "20mm and 12mm graded machine crushed granite aggregate for RCC works."
  },
  sanitary: [
    { id: "san_1", name: "Wall Hung / Floor Mount EWC with Flush Tank", nameMl: "ക്ലോസറ്റ് & ഫ്ലഷ് ടാങ്ക്", quantity: 3, unit: "Nos", maxAllowedRate: 6500, isIncluded: true, specification: "Cera / Hindware / Parryware white vitreous china with soft-close seat cover." },
    { id: "san_2", name: "Wash Basin with Pillar Tap & Bottle Trap", nameMl: "വാഷ് ബേസിൻ", quantity: 4, unit: "Nos", maxAllowedRate: 3200, isIncluded: true, specification: "Cera / Jaquar counter top / wall hung ceramic wash basins." },
    { id: "san_3", name: "Kitchen Sink Single Bowl with Drain Board", nameMl: "കിച്ചൻ സിങ്ക് & ഡ്രെയിൻ ബോർഡ്", quantity: 1, unit: "Nos", maxAllowedRate: 5000, isIncluded: true, specification: "Nirali / Diamond SS 304 satin finish sink (36\" x 18\")." },
    { id: "san_4", name: "Work Area Small Single Bowl Sink", nameMl: "വർക്ക് ഏരിയ സിങ്ക്", quantity: 1, unit: "Nos", maxAllowedRate: 2500, isIncluded: true, specification: "SS 304 compact sink." },
    { id: "san_5", name: "Health Faucet with 1m Flexible Hose", nameMl: "ഹെൽത്ത് ഫോസെറ്റ്", quantity: 3, unit: "Nos", maxAllowedRate: 1100, isIncluded: true, specification: "Jaquar / Cera chrome finish brass faucet." },
    { id: "san_6", name: "Overhead Shower with Shower Arm", nameMl: "ഷവർ & ആം", quantity: 3, unit: "Nos", maxAllowedRate: 1500, isIncluded: true, specification: "Jaquar / Cera single flow rain shower." },
    { id: "san_7", name: "Wall Mixer / Diverter for Hot & Cold Water", nameMl: "വാൾ മിക്സർ / ഡൈവർട്ടർ", quantity: 2, unit: "Nos", maxAllowedRate: 3800, isIncluded: true, specification: "Jaquar / Cera brass chrome plated wall mixer." },
    { id: "san_8", name: "CP Angle Valves & Bib Taps", nameMl: "ആംഗിൾ വാൽവുകൾ & ടാപ്പുകൾ", quantity: 12, unit: "Nos", maxAllowedRate: 750, isIncluded: true, specification: "Jaquar / Cera half-turn ceramic disc valves." },
    { id: "san_9", name: "Overhead Water Tank (1000 Litres)", nameMl: "ഓവർഹെഡ് വാട്ടർ ടാങ്ക് (1000L)", quantity: 1, unit: "Nos", maxAllowedRate: 8500, isIncluded: true, specification: "Sintex / Supreme / Aqua Tech 3-layer UV protected tank." },
    { id: "san_10", name: "Septic Tank & Soak Pit Construction", nameMl: "സെപ്റ്റിക് ടാങ്ക് & സോക്ക് പിറ്റ്", quantity: 1, unit: "Set", maxAllowedRate: 35000, isIncluded: true, specification: "Standard 25-user brick masonry septic tank with RCC slab and 6ft dia soak pit." },
    { id: "san_11", name: "Bathroom Accessories Set (Mirror, Towel Rod, Soap Dish)", nameMl: "ബാത്ത്റൂം ആക്സസറീസ്", quantity: 3, unit: "Sets", maxAllowedRate: 1800, isIncluded: false, specification: "Stainless steel / glass bathroom accessory kit (Optional)." }
  ],
  electrical: {
    wiring: "Concealed copper wiring in PVC conduits (Finolex / V-Guard / Polycab FRLS wires).",
    cableBrand: "Finolex / V-Guard / Polycab",
    switchBrand: "Legrand / Schneider / Crabtree / GM Modular",
    dbBreakers: "Legrand / Schneider SPN DB with 40A RCCB and 6A/16A/25A MCBs.",
    points: [
      { id: "el_1", name: "Light Points (Interior & Exterior)", nameMl: "ലൈറ്റ് പോയിന്റുകൾ", pointCount: 42, unitRate: 850, isIncluded: true, specification: "Concealed point with ceiling rose / batten holder." },
      { id: "el_2", name: "Ceiling Fan Points with Electronic Regulator", nameMl: "ഫാൻ പോയിന്റുകൾ & റെഗുലേറ്റർ", pointCount: 8, unitRate: 950, isIncluded: true, specification: "Concealed point with hook and stepped modular regulator." },
      { id: "el_3", name: "6A Plug Sockets for Appliances", nameMl: "6A പ്ലഗ് സോക്കറ്റുകൾ", pointCount: 22, unitRate: 750, isIncluded: true, specification: "Modular 6A 5-pin socket with independent switch." },
      { id: "el_4", name: "16A Power Sockets (Kitchen, Geyser, Washing Machine)", nameMl: "16A പവർ പോയിന്റുകൾ", pointCount: 8, unitRate: 1100, isIncluded: true, specification: "Heavy duty 16A modular socket with indicator switch." },
      { id: "el_5", name: "Air Conditioner (AC) Points with 25A Isolator", nameMl: "AC പോയിന്റുകൾ", pointCount: 3, unitRate: 1600, isIncluded: true, specification: "Dedicated 4 sq.mm copper circuit with starter/MCB socket." },
      { id: "el_6", name: "TV / DTH & Internet LAN RJ45 Points", nameMl: "ടിവി & ഇന്റർനെറ്റ് പോയിന്റുകൾ", pointCount: 3, unitRate: 850, isIncluded: true, specification: "RG-6 coaxial & Cat6 shielded data outlet." },
      { id: "el_7", name: "Water Pump / Motor Starter Point", nameMl: "മോട്ടോർ സ്റ്റാർട്ടർ പോയിന്റ്", pointCount: 1, unitRate: 1400, isIncluded: true, specification: "Dedicated circuit with manual/auto starter switch." },
      { id: "el_8", name: "EV Charging / Solar Inverter Provision", nameMl: "ഇവി ചാർജിംഗ് / സോളാർ പ്രൊവിഷൻ", pointCount: 1, unitRate: 2500, isIncluded: false, specification: "Provisioning heavy gauge wiring to portico/roof (Optional)." }
    ]
  },
  flooring: [
    { id: "fl_1", areaName: "Sit-out & Entrance Steps", material: "Jet Black / Tan Brown Polished Granite", brand: "First Quality Granite", ratePerSqFt: 180, areaSqFt: 120, totalCost: 21600, isIncluded: true, remarks: "Chamfered / half-bullnose edges" },
    { id: "fl_2", areaName: "Living, Dining & Foyer", material: "GVT Vitrified Tiles (4x2 or 2x2 ft)", brand: "Kajaria / Somany / Simpolo", ratePerSqFt: 75, areaSqFt: 650, totalCost: 48750, isIncluded: true, remarks: "Nano polished stain resistant" },
    { id: "fl_3", areaName: "Bedrooms & Family Living", material: "Vitrified Floor Tiles (4x2 or 2x2 ft)", brand: "Kajaria / Somany / Cera", ratePerSqFt: 65, areaSqFt: 600, totalCost: 39000, isIncluded: true, remarks: "Matte or Glossy finish" },
    { id: "fl_4", areaName: "Kitchen & Pantry", material: "Anti-skid Ceramic / Vitrified Tiles", brand: "Kajaria / Somany", ratePerSqFt: 65, areaSqFt: 150, totalCost: 9750, isIncluded: true, remarks: "Easy clean surface" },
    { id: "fl_5", areaName: "Work Area & Utility", material: "Rustic Anti-skid Heavy Duty Tiles", brand: "Johnson / Cera", ratePerSqFt: 55, areaSqFt: 100, totalCost: 5500, isIncluded: true, remarks: "Sturdy non-slip flooring" },
    { id: "fl_6", areaName: "Bathroom Floors", material: "Anti-skid Ceramic Tiles (1x1 ft)", brand: "Kajaria / Somany", ratePerSqFt: 55, areaSqFt: 120, totalCost: 6600, isIncluded: true, remarks: "Proper slope towards drain" },
    { id: "fl_7", areaName: "Bathroom Wall Cladding", material: "Glazed Ceramic Wall Tiles up to 7ft Height", brand: "Kajaria / Somany / Cera", ratePerSqFt: 55, areaSqFt: 380, totalCost: 20900, isIncluded: true, remarks: "Full height up to lintel" },
    { id: "fl_8", areaName: "Kitchen Dado Wall Tiles", material: "Designer Ceramic Wall Tiles up to 2ft Height", brand: "Kajaria / Somany", ratePerSqFt: 60, areaSqFt: 45, totalCost: 2700, isIncluded: true, remarks: "Above counter platform" }
  ],
  painting: {
    interior: { brand: "Asian Paints Royale / Berger Silk", coats: 2, putty: true, primer: true, rate: 22, remarks: "2 coats acrylic putty + 1 coat primer + 2 coats luxury emulsion" },
    exterior: { brand: "Asian Paints Apex / Berger WeatherCoat", coats: 2, primer: true, rate: 18, remarks: "1 coat exterior primer + 2 coats anti-fungal weather-proof emulsion" },
    ceiling: { brand: "Asian Paints Tractor / Premium Emulsion", coats: 2, rate: 14, remarks: "White ceiling paint" },
    woodPolishing: { type: "Melamine / PU Gloss or Matt Polish", coats: 2, rate: 80, remarks: "Main door teak high gloss polish" },
    grills: { paintType: "Synthetic Enamel Paint over Zinc Chromate Red Oxide Primer", coats: 2, rate: 16, remarks: "Satin Black / Dark Grey finish" }
  },
  doorsWindows: [
    { id: "dw_1", name: "Main Entrance Door (Teak Wood Frame & Shutter)", quantity: 1, unit: "Set", unitRate: 35000, maxRate: 40000, isIncluded: true, specification: "Seasoned First Quality Teak Wood frame (5\"x3\") with carved teak panel shutter & brass fittings.", remarks: "Godrej / Yale brass lock included" },
    { id: "dw_2", name: "Bedroom & Interior Room Doors", quantity: 4, unit: "Sets", unitRate: 7500, maxRate: 8500, isIncluded: true, specification: "Hardwood frames with skin moulded / flush shutters and SS hinges.", remarks: "Cylindrical locks included" },
    { id: "dw_3", name: "Bathroom & Toilet Doors", quantity: 3, unit: "Sets", unitRate: 4500, maxRate: 5000, isIncluded: true, specification: "FRP / Solid WPC water-proof doors with PVC frames and SS tower bolts.", remarks: "100% water resistant" },
    { id: "dw_4", name: "Window Frames & Glazed Shutters", quantity: 12, unit: "Sets", unitRate: 6500, maxRate: 7500, isIncluded: true, specification: "Treated hardwood / UPVC window frames with pin-headed / plain float glass shutters.", remarks: "Smooth sliding or hinged" },
    { id: "dw_5", name: "MS Safety Window Grills", quantity: 12, unit: "Sets", unitRate: 2200, maxRate: 2500, isIncluded: true, specification: "12mm square / round MS bright bars welded in neat patterns and fixed to frame.", remarks: "Anti-rust coated" },
    { id: "dw_6", name: "Main Staircase Handrail & Balustrades", quantity: 1, unit: "Lumpsum", unitRate: 32000, maxRate: 35000, isIncluded: true, specification: "Stainless Steel 304 Grade / Teak wood top handrail with vertical SS balusters.", remarks: "Elegant aesthetic finish" }
  ]
};

// ============================================================================
// 4. DEFAULT GENERAL CONDITION CLAUSES
// ============================================================================

export const DEFAULT_GENERAL_CLAUSES: GeneralConditionClause[] = [
  {
    id: "clause_01",
    clauseNo: 1,
    title: "Scope & Approved Drawings",
    titleMl: "കരാറിന്റെ വ്യാപ്തിയും പ്ലാനും",
    content: "The Second Party (Contractor) agrees to execute the construction of the building strictly adhering to the architectural drawings and structural plans approved by the First Party (Client) and sanctioned by the respective Local Self Government Institution (LSGD).",
    contentMl: "ഒന്നാം കക്ഷി (ഉടമസ്ഥൻ) അംഗീകരിച്ചതും തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം (പഞ്ചായത്ത്/മുനിസിപ്പാലിറ്റി) പാസാക്കിയതുമായ പ്ലാനും എസ്റ്റിമേറ്റും അനുസരിച്ച് കെട്ടിട നിർമ്മാണം രണ്ടാം കക്ഷി (കോൺട്രാക്ടർ) പൂർത്തിയാക്കേണ്ടതാണ്.",
    isMandatory: true,
    isEnabled: true
  },
  {
    id: "clause_02",
    clauseNo: 2,
    title: "Additional / Extra Works & Plan Deviations",
    titleMl: "അധിക ജോലികളും പ്ലാനിലെ മാറ്റങ്ങളും",
    content: "Any deviation, addition or alteration from the approved plan requested by the First Party will be treated as Extra Work. The cost of such extra works will be calculated separately based on actual measurements and mutually agreed rates, and shall be paid by the First Party in advance before execution.",
    contentMl: "അംഗീകരിച്ച പ്ലാനിലോ സ്പെസിഫിക്കേഷനിലോ ഒന്നാം കക്ഷിയുടെ ആവശ്യപ്രകാരം വരുത്തുന്ന അധിക ജോലികൾക്ക് (Extra Works) നിലവിലുള്ള അളവും നിരക്കും അനുസരിച്ച് പ്രത്യേക തുക ഒന്നാം കക്ഷി മുൻകൂറായി നൽകേണ്ടതാണ്.",
    isMandatory: true,
    isEnabled: true
  },
  {
    id: "clause_03",
    clauseNo: 3,
    title: "Permit Expenses, Building Tax & Labour Cess",
    titleMl: "പെർമിറ്റ് ഫീസ്, കെട്ടിട നികുതി, സെസ്സ്",
    content: "All statutory government fees, including Building Permit application fees, Kerala LSGD Property Tax, Revenue One-Time Building Tax, and Building & Other Construction Workers Welfare Cess (1% Labour Cess) shall be the sole responsibility of the First Party (Client).",
    contentMl: "കെട്ടിട പെർമിറ്റ് ഫീസ്, ഗവണ്മെന്റ് ലേബർ വെൽഫെയർ സെസ്സ് (1% Cess), വില്ലേജ്/പഞ്ചായത്ത് നികുതികൾ എന്നിവ പൂർണ്ണമായും ഒന്നാം കക്ഷിയുടെ ഉത്തരവാദിത്തത്തിൽ അടക്കേണ്ടതാണ്.",
    isMandatory: true,
    isEnabled: true
  },
  {
    id: "clause_04",
    clauseNo: 4,
    title: "Water & Electricity Supply at Site",
    titleMl: "നിർമ്മാണത്തിനുള്ള വെള്ളവും വൈദ്യുതിയും",
    content: "The First Party shall provide adequate potable water and three-phase / single-phase electricity connection free of cost at the construction site throughout the project period.",
    contentMl: "നിർമ്മാണ ആവശ്യങ്ങൾക്ക് ആവശ്യമായ ശുദ്ധജലവും വൈദ്യുതിയും സൈറ്റിൽ ഒന്നാം കക്ഷി സ്വന്തം ചെലവിൽ ലഭ്യമാക്കേണ്ടതാണ്.",
    isMandatory: true,
    isEnabled: true
  },
  {
    id: "clause_05",
    clauseNo: 5,
    title: "Stage-Wise Payment Schedule & Work Continuity",
    titleMl: "സ്റ്റേജ് തിരിച്ചുള്ള പെയ്‌മെന്റും നിർമ്മാണ തുടർച്ചയും",
    content: "The First Party agrees to release stage payments promptly upon completion of each defined construction milestone. In the event of payment delays exceeding 10 days, the contractor reserves the right to halt work until dues are cleared, and the completion deadline will be extended accordingly.",
    contentMl: "നിശ്ചയിച്ചിട്ടുള്ള ഓരോ നിർമ്മാണ ഘട്ടവും പൂർത്തിയാകുന്ന മുറയ്ക്ക് ഒന്നാം കക്ഷി കൃത്യമായി പണം നൽകേണ്ടതാണ്. പെയ്‌മെന്റിൽ കാലതാമസം ഉണ്ടായാൽ നിർമ്മാണം താൽക്കാലികമായി നിർത്തിവെക്കാൻ കോൺട്രാക്ടർക്ക് അവകാശമുണ്ടായിരിക്കും.",
    isMandatory: true,
    isEnabled: true
  },
  {
    id: "clause_06",
    clauseNo: 6,
    title: "Quality of Materials & Site Inspection",
    titleMl: "സാധനങ്ങളുടെ ഗുണനിലവാരവും പരിശോധനയും",
    content: "The Contractor shall use only first-quality materials conforming to the agreed specifications. The Client or their authorized supervising architect/engineer has full authority to inspect materials and workmanship at all stages.",
    contentMl: "കരാറിൽ പറഞ്ഞിരിക്കുന്ന ഒന്നാംതരം സാധനങ്ങൾ മാത്രമേ നിർമ്മാണത്തിന് ഉപയോഗിക്കാവൂ. ഒന്നാം കക്ഷിക്കോ അവർ ചുമതലപ്പെടുത്തുന്ന എൻജിനീയർക്കോ ഏതു സമയത്തും നിർമ്മാണം പരിശോധിക്കാവുന്നതാണ്.",
    isMandatory: false,
    isEnabled: true
  },
  {
    id: "clause_07",
    clauseNo: 7,
    title: "Completion Period & Force Majeure",
    titleMl: "നിർമ്മാണ കാലാവധിയും തടസ്സങ്ങളും",
    content: "The construction shall be completed within the agreed timeframe from the date of commencement, subject to exemptions for unseasonal natural calamities, government bans, material strikes, or delays in client payments.",
    contentMl: "കരാർ ഒപ്പിട്ട് നിർമ്മാണം ആരംഭിച്ച തീയതി മുതൽ നിശ്ചിത മാസങ്ങൾക്കുള്ളിൽ പണി പൂർത്തിയാക്കേണ്ടതാണ്. പ്രകൃതിക്ഷോഭം, പണിമുടക്ക്, പെയ്മെന്റ് തടസ്സങ്ങൾ എന്നിവയുണ്ടായാൽ കാലാവധി നീട്ടി നൽകുന്നതാണ്.",
    isMandatory: false,
    isEnabled: true
  },
  {
    id: "clause_08",
    clauseNo: 8,
    title: "Work Stoppage & Agreement Termination",
    titleMl: "കരാർ റദ്ദാക്കലും നിർമ്മാണം നിർത്തലും",
    content: "If either party breaches fundamental terms of this agreement, a 15-day written notice shall be served. In case of premature termination, a certified quantity survey by a licensed engineer shall determine the value of work completed, and final settlement shall be concluded within 30 days.",
    contentMl: "ഇരുകക്ഷികളിൽ ആരെങ്കിലും കരാർ ലംഘനം നടത്തിയാൽ 15 ദിവസത്തെ നോട്ടീസ് നൽകി കരാർ അവസാനിപ്പിക്കാവുന്നതും, ലൈസൻസ്ഡ് എൻജിനീയറുടെ നേതൃത്വത്തിൽ പൂർത്തിയായ പണിയുടെ കൃത്യമായ കണക്കെടുത്ത് സെറ്റിൽമെന്റ് നടത്തേണ്ടതുമാണ്.",
    isMandatory: false,
    isEnabled: true
  },
  {
    id: "clause_09",
    clauseNo: 9,
    title: "Final Settlement & Building Handover",
    titleMl: "ഫൈനൽ സെറ്റിൽമെന്റും താക്കോൽ കൈമാറ്റവും",
    content: "Upon completion of all works, final cleaning, and defect rectifications, the First Party shall clear the remaining balance, after which the Contractor shall formally hand over the keys and possession of the building.",
    contentMl: "നിർമ്മാണം പൂർത്തിയാക്കി ഫൈനൽ ക്ലീനിംഗും അവസാന മിനുക്കുപണികളും കഴിഞ്ഞ ശേഷം ഒന്നാം കക്ഷി ബാക്കി തുക നൽകി രസീത് വാങ്ങി താക്കോൽ ഏറ്റുവാങ്ങേണ്ടതാണ്.",
    isMandatory: true,
    isEnabled: true
  }
];

// ============================================================================
// 5. DEFAULT SETTINGS OBJECT
// ============================================================================

export const DEFAULT_CONSTRUCTION_SETTINGS: ConstructionSettings = {
  contractor: {
    companyName: "VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS",
    proprietorName: "Er. Deepak K",
    designation: "Chief Consultant & Chartered Civil Engineer",
    address: "Keralassery Main Road, Palakkad District, Kerala - 678641",
    phone: "+91 7012383137",
    email: "deepak.vasthusilpy@gmail.com",
    gstNumber: "32AAAAA0000A1Z5",
    licenseNumber: "LSGD/E-2024/PKD-0419"
  },
  stages: DEFAULT_CONSTRUCTION_STAGES,
  defaultRates: {
    baseRatePerSqFt: 2250,
    flooringRates: {
      granite: 180,
      vitrifiedPremium: 75,
      vitrifiedStandard: 65,
      antiSkid: 55
    },
    electricalPointRate: 850
  },
  agreementTemplate: {
    defaultCompletionMonths: 10,
    place: "Keralassery, Palakkad",
    clauses: DEFAULT_GENERAL_CLAUSES,
    defaultSpecifications: DEFAULT_WORK_SPECIFICATIONS,
    numberingPrefix: "CW-2026-"
  },
  printSettings: {
    paperSize: "A4",
    eStampTopMarginMm: 210, // 8.3 - 8.5 inches reserved for Kerala e-stamp
    standardTopMarginMm: 20,
    leftMarginMm: 35,
    rightMarginMm: 15,
    bottomMarginMm: 25
  }
};

// ============================================================================
// 6. INITIAL SAMPLE SEED DATA (EMPTY - NO DEMO DATA)
// ============================================================================

export const SAMPLE_PROJECTS: ConstructionProject[] = [];

export const SAMPLE_AGREEMENTS: ConstructionAgreement[] = [];

// ============================================================================
// 7. STORAGE MANAGER IMPLEMENTATION
// ============================================================================

export class ConstructionStorageManager {
  /**
   * Helper to filter out any legacy demo projects or demo clients
   */
  private static isDemoProject(p: ConstructionProject): boolean {
    if (!p) return false;
    const name = p.client?.clientName?.toLowerCase() || "";
    const title = p.title?.toLowerCase() || "";
    const id = p.id || "";
    const projectNo = p.projectNo || "";

    if (id === "PRJ-2026-001" || id === "PRJ-2026-002") return true;
    if (projectNo === "PRJ-2026-001" || projectNo === "PRJ-2026-002") return true;
    if (name.includes("rameshan") || name.includes("anitha kumar")) return true;
    if (title.includes("rameshan") || title.includes("anitha kumar")) return true;
    return false;
  }

  private static isDemoAgreement(a: ConstructionAgreement): boolean {
    if (!a) return false;
    const name = a.client?.clientName?.toLowerCase() || "";
    const title = a.title?.toLowerCase() || "";
    const id = a.id || "";
    const agreementNo = a.agreementNo || "";

    if (id === "CW-2026-00001" || id === "CW-2026-00002") return true;
    if (agreementNo === "CW-2026-00001" || agreementNo === "CW-2026-00002") return true;
    if (name.includes("rameshan") || name.includes("anitha kumar")) return true;
    if (title.includes("rameshan") || title.includes("anitha kumar")) return true;
    return false;
  }

  /**
   * Purge all demo projects, clients and agreements from localStorage
   */
  static purgeAllDemoData(): void {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) {
        const parsed: ConstructionProject[] = JSON.parse(storedProjects);
        const filtered = Array.isArray(parsed) ? parsed.filter(p => !this.isDemoProject(p)) : [];
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
      }

      const storedAgreements = localStorage.getItem(STORAGE_KEYS.AGREEMENTS);
      if (storedAgreements) {
        const parsed: ConstructionAgreement[] = JSON.parse(storedAgreements);
        const filtered = Array.isArray(parsed) ? parsed.filter(a => !this.isDemoAgreement(a)) : [];
        localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn("Error purging demo construction data", e);
    }
  }

  static sanitizeDesignation(des?: string): string {
    if (!des || des.toUpperCase().includes("PRINCIPLE") || des.toLowerCase().includes("b tec") || des.toLowerCase().includes("m.phill") || des.toLowerCase().includes("b.tech, m.tech")) {
      return "Chief Consultant & Chartered Civil Engineer";
    }
    return des;
  }

  /**
   * Initialize settings if not already present
   */
  static getSettings(): ConstructionSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        const parsed: ConstructionSettings = JSON.parse(stored);
        if (parsed.contractor && parsed.contractor.designation) {
          parsed.contractor.designation = this.sanitizeDesignation(parsed.contractor.designation);
        }
        return parsed;
      }
    } catch (e) {
      console.warn("Error parsing construction settings from localStorage", e);
    }
    this.saveSettings(DEFAULT_CONSTRUCTION_SETTINGS);
    return DEFAULT_CONSTRUCTION_SETTINGS;
  }

  static saveSettings(settings: ConstructionSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.logAudit("SETTINGS", "SYSTEM", "Updated Construction Settings and Stage Specifications");
  }

  /**
   * Get all Projects (with demo projects automatically filtered out)
   */
  static getProjects(): ConstructionProject[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (stored) {
        const parsed: ConstructionProject[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(p => !this.isDemoProject(p));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn("Error parsing construction projects", e);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([]));
    return [];
  }

  static getAllProjects(): ConstructionProject[] {
    return this.getProjects();
  }

  static saveProject(project: ConstructionProject): ConstructionProject {
    const list = this.getProjects();
    const existingIndex = list.findIndex(p => p.id === project.id);
    const now = new Date().toISOString();
    let saved: ConstructionProject;

    if (existingIndex >= 0) {
      saved = { ...project, updatedAt: now };
      list[existingIndex] = saved;
      this.logAudit("PROJECT", project.id, `Updated project: ${project.title}`);
    } else {
      saved = { ...project, createdAt: now, updatedAt: now };
      list.unshift(saved);
      this.logAudit("PROJECT", project.id, `Created new project: ${project.title}`);
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
    return saved;
  }

  static deleteProject(id: string): boolean {
    const list = this.getProjects();
    const filtered = list.filter(p => p.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered));
      this.logAudit("PROJECT", id, `Deleted project ID ${id}`);
      return true;
    }
    return false;
  }

  static archiveProject(id: string, isArchived: boolean = true): boolean {
    const list = this.getProjects();
    const target = list.find(p => p.id === id);
    if (target) {
      target.isArchived = isArchived;
      target.status = isArchived ? "ARCHIVED" : (target.status === "ARCHIVED" ? "IN_PROGRESS" : target.status);
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
      this.logAudit("PROJECT", id, `${isArchived ? "Archived" : "Restored/Unarchived"} project ${target.projectNo}`);
      return true;
    }
    return false;
  }

  /**
   * Generates standard engineering checklist for any construction stage
   */
  static getDefaultStageChecklist(stageName: string): { id: string; title: string; titleMl: string; isCompleted: boolean }[] {
    const lower = stageName.toLowerCase();
    let tasks: { title: string; titleMl: string }[] = [];

    if (lower.includes("advance") || lower.includes("കരാർ") || lower.includes("agreement")) {
      tasks = [
        { title: "Architectural plan & working drawings approved", titleMl: "പ്ലാൻ & വർക്കിംഗ് ഡ്രോയിംഗ്സ് അംഗീകരിച്ചു" },
        { title: "Building permit / LSGD sanction obtained", titleMl: "കെട്ടിട നിർമ്മാണ പെർമിറ്റ് / തദ്ദേശ സ്വയംഭരണ അനുമതി" },
        { title: "Water & temporary electricity connection established", titleMl: "നിർമ്മാണ ആവശ്യത്തിനുള്ള വെള്ളവും വൈദ്യുതിയും ലഭ്യമാക്കി" },
        { title: "Initial mobilization advance paid", titleMl: "കരാർ അഡ്വാൻസ് തുക കൈമാറി" }
      ];
    } else if (lower.includes("clearing") || lower.includes("layout") || lower.includes("സൈറ്റ്")) {
      tasks = [
        { title: "Site vegetation & topsoil cleared", titleMl: "സൈറ്റിലെ അടിക്കാടും പുല്ലും വൃത്തിയാക്കി" },
        { title: "Benchmarking & plot boundary verified", titleMl: "അതിർത്തി തിരിച്ച് ബെഞ്ച് മാർക്കിംഗ് സ്ഥാപിച്ചു" },
        { title: "Center-line grid layout & pegging completed", titleMl: "സെന്റർ ലൈൻ ലേഔട്ടും പെഗ്ഗിംഗും പൂർത്തിയാക്കി" },
        { title: "Vasthu orientation (Kettu/Kolu) verified on ground", titleMl: "വാസ്തു പ്രകാരമുള്ള ദിക്കുകളും അളവുകളും പരിശോധിച്ചു" }
      ];
    } else if (lower.includes("excavation") || lower.includes("മണ്ണെടുപ്പ്")) {
      tasks = [
        { title: "Trench excavation to solid strata level", titleMl: "ഉറപ്പുള്ള മണ്ണിന്റെ തട്ട് വരെ ട്രെഞ്ച് എടുത്തു" },
        { title: "Pit bottom leveled & compacted", titleMl: "കുഴികളുടെ അടിത്തട്ട് നിരപ്പാക്കി അടിച്ചുറപ്പിച്ചു" },
        { title: "Anti-termite chemical spray applied to trenches", titleMl: "ചിതൽ പ്രതിരോധ മരുന്ന് തളിച്ചു" }
      ];
    } else if (lower.includes("foundation") || lower.includes("ഫൗണ്ടേഷൻ") || lower.includes("substructure")) {
      tasks = [
        { title: "PCC 1:4:8 base bed concrete laid (100mm min)", titleMl: "PCC അടിത്തട്ട് കോൺക്രീറ്റ് ഉറപ്പിച്ചു" },
        { title: "Random Rubble (RR) stone masonry in CM 1:6", titleMl: "റബ്ബിൾ ഫൗണ്ടേഷൻ മേസൺറി പൂർത്തിയാക്കി" },
        { title: "Basement walls erected up to plinth height", titleMl: "ബേസ്മെന്റ് ഭിത്തികൾ പ്ലിന്ത് ലെവൽ വരെ ഉയർത്തി" },
        { title: "Damp Proof Course (DPC) applied", titleMl: "ഈർപ്പ പ്രതിരോധ DPC കോട്ടിംഗ് നൽകി" }
      ];
    } else if (lower.includes("plinth") || lower.includes("ബെൽറ്റ്") || lower.includes("belt")) {
      tasks = [
        { title: "Plinth beam reinforcement steel fabrication", titleMl: "പ്ലിന്ത് ബീം കമ്പി കെട്ടി തയ്യാറാക്കി" },
        { title: "Side shuttering aligned with cover blocks", titleMl: "കവർ ബ്ലോക്കുകൾ നൽകി ഷട്ടറിംഗ് ഉറപ്പിച്ചു" },
        { title: "M20 concrete poured & vibrated", titleMl: "M20 കോൺക്രീറ്റ് ഒഴിച്ച് വൈബ്രേറ്റർ അടിച്ചു" },
        { title: "Basement soil backfilled, watered & consolidated", titleMl: "ബേസ്മെന്റിൽ മണ്ണ് നിറച്ച് വെള്ളമൊഴിച്ച് അടിച്ചുറപ്പിച്ചു" }
      ];
    } else if (lower.includes("masonry") || lower.includes("മേസൺറി") || lower.includes("brick") || lower.includes("block")) {
      tasks = [
        { title: "Superstructure brick/solid block masonry in CM 1:5", titleMl: "സൂപ്പർ സ്ട്രക്ചർ ഭിത്തി നിർമ്മാണം" },
        { title: "Door & window timber/concrete frames fixed in plumb", titleMl: "വാതിലുകളുടെയും ജനലുകളുടെയും ഫ്രെയിമുകൾ ഉറപ്പിച്ചു" },
        { title: "Sill level band / RCC stiffeners casted", titleMl: "സിൽ ലെവൽ ബാൻഡ് / സ്റ്റീഫനർ കോൺക്രീറ്റ് ചെയ്തു" },
        { title: "Curing performed for minimum 7 days", titleMl: "കുറഞ്ഞത് 7 ദിവസം ഭിത്തികൾ നനച്ചു (Curing)" }
      ];
    } else if (lower.includes("lintel") || lower.includes("ലിന്റൽ") || lower.includes("sunshade")) {
      tasks = [
        { title: "Continuous RCC lintel beam shuttering & steel tying", titleMl: "ലിന്റൽ ബീം ഷട്ടറിംഗും കമ്പി കെട്ടലും" },
        { title: "Sunshade / chajja cantilever projections prepared", titleMl: "സൺഷെയ്ഡ് / ചാജ്ജ പ്രൊജക്ഷനുകൾ ക്രമീകരിച്ചു" },
        { title: "M20 concrete casting completed", titleMl: "M20 കോൺക്രീറ്റ് കാസ്റ്റിംഗ് പൂർത്തിയാക്കി" },
        { title: "Lintel curing done for 14 days", titleMl: "14 ദിവസം നനയ്ക്കൽ പൂർത്തിയാക്കി" }
      ];
    } else if (lower.includes("slab") || lower.includes("സ്ലാബ്") || lower.includes("roof") || lower.includes("റൂഫ്")) {
      tasks = [
        { title: "Heavy-duty prop scaffolding & level shuttering", titleMl: "പ്രോപ്സ് സ്കഫോൾഡിംഗും ലെവൽ ഷട്ടറിംഗും" },
        { title: "Steel reinforcement tying (main & distribution bars)", titleMl: "മെയിൻ & ഡിസ്ട്രിബ്യൂഷൻ കമ്പികൾ കൃത്യമായി കെട്ടി" },
        { title: "Concealed electrical conduit pipes & fan boxes fixed", titleMl: "കൺസീൽഡ് ഇലക്ട്രിക്കൽ പൈപ്പുകളും ഫാൻ ബോക്സുകളും സ്ഥാപിച്ചു" },
        { title: "Plumbing drain sleeves & sunken slab waterproofing", titleMl: "പ്ലംബിംഗ് സ്ലീവുകളും സൺകൻ വാട്ടർപ്രൂഫിംഗും" },
        { title: "Grade M20/M25 concrete poured with mechanical vibrators", titleMl: "മെക്കാനിക്കൽ വൈബ്രേറ്റർ ഉപയോഗിച്ച് സ്ലാബ് കോൺക്രീറ്റ് ചെയ്തു" },
        { title: "Water ponding curing for minimum 14-21 days", titleMl: "കുറഞ്ഞത് 14-21 ദിവസം വെള്ളം നിർത്തി ക്യൂറിംഗ് ചെയ്തു" },
        { title: "De-shuttering inspected for honeycombs", titleMl: "ഷട്ടറിംഗ് അഴിച്ച് പ്രതലം പരിശോധിച്ചു" }
      ];
    } else if (lower.includes("plastering") || lower.includes("പ്ലാസ്റ്ററിംഗ്")) {
      tasks = [
        { title: "Wall hacking & chicken mesh fixing on RCC joints", titleMl: "RCC ജോയിന്റുകളിൽ ഹാക്കിംഗും ചിക്കൻ മെഷും ഉറപ്പിച്ചു" },
        { title: "Ceiling plastering 1:3 smooth finish", titleMl: "സീലിംഗ് പ്ലാസ്റ്ററിംഗ് 1:3 സ്മൂത്ത് ഫിനിഷ്" },
        { title: "Internal wall plastering 1:4 with sponge finish", titleMl: "ഇന്റീരിയർ ഭിത്തി പ്ലാസ്റ്ററിംഗ് സ്പോഞ്ച് ഫിനിഷ്" },
        { title: "External two-coat waterproof plastering with drip grooves", titleMl: "എക്സ്റ്റീരിയർ ഡബിൾ കോട്ട് വാട്ടർപ്രൂഫ് പ്ലാസ്റ്ററിംഗ്" },
        { title: "Proper wet curing for 10-14 days", titleMl: "10-14 ദിവസം പൂർണ്ണമായി നനച്ചു" }
      ];
    } else if (lower.includes("flooring") || lower.includes("ഫ്ലോറിംഗ്") || lower.includes("tile") || lower.includes("ടൈൽ")) {
      tasks = [
        { title: "Sub-floor PCC bed leveling & compaction", titleMl: "ഫ്ലോർ ബെഡ് കോൺക്രീറ്റ് ലെവലിംഗ്" },
        { title: "Granite / Vitrified tiles layout & spacer fixing", titleMl: "ടൈലുകൾ / ഗ്രാനൈറ്റ് കൃത്യമായ ലെവലിൽ പതിച്ചു" },
        { title: "Toilet floor anti-skid & wall tile cladding up to 7ft", titleMl: "ടോയ്‌ലറ്റ് ഫ്ലോറും വാൾ ടൈലുകളും 7 അടി വരെ പതിച്ചു" },
        { title: "Epoxy/polymer tile joint grouting & surface cleaning", titleMl: "ടൈൽ ജോയിന്റ് ഗ്രൗട്ടിംഗും വൃത്തിയാക്കലും" }
      ];
    } else if (lower.includes("electrical") || lower.includes("plumbing") || lower.includes("ഇലക്ട്രിക്കൽ") || lower.includes("പ്ലംബിംഗ്")) {
      tasks = [
        { title: "Concealed wiring pulling (FRLS copper wires)", titleMl: "കൺസീൽഡ് വയറിംഗ് (FRLS കോപ്പർ വയർ)" },
        { title: "Distribution board, MCB & RCCB installed", titleMl: "മെയിൻ ഡിസ്ട്രിബ്യൂഷൻ ബോർഡും MCB കളും ഘടിപ്പിച്ചു" },
        { title: "CPVC water supply pipes & drainage pressure tested", titleMl: "വാട്ടർ സപ്ലൈ പൈപ്പുകൾ പ്രഷർ ടെസ്റ്റ് ചെയ്തു" },
        { title: "Sanitary fixtures (EWC, wash basin, taps, health faucet)", titleMl: "സാനിറ്ററി ഫിറ്റിംഗ്സുകൾ ഘടിപ്പിച്ചു" },
        { title: "Overhead water tank & booster pump connected", titleMl: "ഓവർഹെഡ് വാട്ടർ ടാങ്കും മോട്ടോർ പമ്പും ബന്ധിപ്പിച്ചു" }
      ];
    } else if (lower.includes("painting") || lower.includes("പെയിന്റിംഗ്") || lower.includes("finishing")) {
      tasks = [
        { title: "Interior acrylic putty (2 coats) & sanding", titleMl: "ഇന്റീരിയർ പുട്ടി 2 കോട്ട് അടിച്ചു മിനുക്കി" },
        { title: "Interior primer coat + 2 coats premium emulsion", titleMl: "ഇന്റീരിയർ പ്രൈമറും 2 കോട്ട് പ്രീമിയം പെയിന്റും" },
        { title: "Exterior weather-proof paint 2 coats", titleMl: "എക്സ്റ്റീരിയർ വെതർ ഷീൽഡ് പെയിന്റ് 2 കോട്ട്" },
        { title: "Wood polish / PU coat on front door & wood trims", titleMl: "മെയിൻ ഡോർ & തടി ഉരുപ്പടികളിൽ പോളിഷ് ചെയ്തു" },
        { title: "Enamel paint on window MS grills & iron works", titleMl: "ജനൽ ഗ്രില്ലുകളിൽ ഇനാമൽ പെയിന്റ് അടിച്ചു" }
      ];
    } else if (lower.includes("handover") || lower.includes("താക്കോൽ") || lower.includes("കൈമാറ്റം") || lower.includes("settlement")) {
      tasks = [
        { title: "Deep chemical cleaning of all floors, glasses & toilets", titleMl: "മുറികളും ഗ്ലാസുകളും ഫ്ലോറും വൃത്തിയാക്കി" },
        { title: "All electrical switches & plumbing fittings checked", titleMl: "എല്ലാ ഇലക്ട്രിക്കൽ & പ്ലംബിംഗ് ഫിറ്റിംഗ്സും പരിശോധിച്ചു" },
        { title: "Final measurements & extra works settled", titleMl: "അളവുകളും അധിക ചിലവുകളും കൃത്യമായി കണക്കാക്കി" },
        { title: "Keys handed over to client with satisfaction signoff", titleMl: "ക്ലയന്റിന് താക്കോൽ കൈമാറി സംതൃപ്തി പത്രം ഒപ്പിട്ടു" }
      ];
    } else {
      tasks = [
        { title: "Materials delivered & inspected on site", titleMl: "സാമഗ്രികൾ സൈറ്റിൽ എത്തിച്ച് പരിശോധിച്ചു" },
        { title: "Workmanship executed as per specification", titleMl: "കരാർ സ്പെസിഫിക്കേഷൻ പ്രകാരം ജോലി ചെയ്തു" },
        { title: "Quality check & dimensions verified by engineer", titleMl: "ഗുണനിലവാരവും അളവുകളും എഞ്ചിനീയർ പരിശോധിച്ചു" },
        { title: "Stage work completed and approved", titleMl: "ഘട്ട ജോലി വിജയകരമായി പൂർത്തിയാക്കി" }
      ];
    }

    return tasks.map((t, idx) => ({
      id: `chk_${Date.now()}_${idx}`,
      title: t.title,
      titleMl: t.titleMl,
      isCompleted: false
    }));
  }

  /**
   * Computes progress % of a stage based on checklist completion
   */
  static calculateStageProgress(stage: PaymentScheduleItem): number {
    if (stage.status === "PAID" || stage.isCompleted) return 100;
    if (!stage.checklist || stage.checklist.length === 0) return stage.progressPercent || 0;
    const completed = stage.checklist.filter(c => c.isCompleted).length;
    return Math.round((completed / stage.checklist.length) * 100);
  }

  /**
   * Computes overall project progress % from all stages and their checklists
   */
  static calculateProjectOverallProgress(schedule: PaymentScheduleItem[]): number {
    if (!schedule || schedule.length === 0) return 0;
    let totalWeighted = 0;
    let totalWeight = 0;

    schedule.forEach(stage => {
      const weight = stage.percentage || (100 / schedule.length);
      const stagePct = this.calculateStageProgress(stage);
      totalWeighted += (stagePct * weight) / 100;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.min(100, Math.round((totalWeighted / totalWeight) * 100)) : 0;
  }

  /**
   * Get all Agreements (with demo agreements automatically filtered out)
   */
  static getAgreements(): ConstructionAgreement[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AGREEMENTS);
      if (stored) {
        const parsed: ConstructionAgreement[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter(a => !this.isDemoAgreement(a)).map(a => {
            if (a.contractor && a.contractor.designation) {
              a.contractor.designation = this.sanitizeDesignation(a.contractor.designation);
            }
            return a;
          });
          return cleaned;
        }
      }
    } catch (e) {
      console.warn("Error parsing construction agreements", e);
    }
    localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify([]));
    return [];
  }

  static getAllAgreements(): ConstructionAgreement[] {
    return this.getAgreements();
  }

  static getAgreementById(id: string): ConstructionAgreement | undefined {
    const list = this.getAgreements();
    const clean = (id || "").trim();
    return list.find(
      a =>
        a.id.toLowerCase() === clean.toLowerCase() ||
        a.agreementNo.toLowerCase() === clean.toLowerCase() ||
        a.verificationToken.toLowerCase() === clean.toLowerCase()
    );
  }

  /**
   * Asynchronous lookup checking both local storage cache and Firestore cloud collection
   * Allows any device / public user to verify scanned QR codes without signing in
   */
  static async getAgreementByIdAsync(idOrToken: string): Promise<ConstructionAgreement | null> {
    const clean = (idOrToken || "").trim();
    if (!clean) return null;

    // 1. Check local storage cache
    const local = this.getAgreementById(clean);
    if (local) return local;

    // 2. Fetch from Firestore Cloud Database
    try {
      if (db) {
        // Direct Doc ID lookup
        const docRef = doc(db, "construction_agreements", clean);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ConstructionAgreement;
          if (data && data.agreementNo) {
            this.cacheAgreementLocally(data);
            return data;
          }
        }

        // Query by verificationToken
        const tokenQuery = query(
          collection(db, "construction_agreements"),
          where("verificationToken", "==", clean)
        );
        const tokenSnap = await getDocs(tokenQuery);
        if (!tokenSnap.empty) {
          const data = tokenSnap.docs[0].data() as ConstructionAgreement;
          if (data && data.agreementNo) {
            this.cacheAgreementLocally(data);
            return data;
          }
        }

        // Query by agreementNo (e.g. CW-2026-00001)
        const noQuery = query(
          collection(db, "construction_agreements"),
          where("agreementNo", "==", clean)
        );
        const noSnap = await getDocs(noQuery);
        if (!noSnap.empty) {
          const data = noSnap.docs[0].data() as ConstructionAgreement;
          if (data && data.agreementNo) {
            this.cacheAgreementLocally(data);
            return data;
          }
        }
      }
    } catch (err) {
      console.warn("Firestore agreement lookup fallback", err);
    }

    return null;
  }

  /**
   * Helper to cache fetched cloud agreement locally
   */
  static cacheAgreementLocally(agreement: ConstructionAgreement): void {
    try {
      const list = this.getAgreements();
      const existingIdx = list.findIndex(a => a.id === agreement.id || a.verificationToken === agreement.verificationToken);
      if (existingIdx >= 0) {
        list[existingIdx] = agreement;
      } else {
        list.unshift(agreement);
      }
      localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(list));
    } catch (e) {
      console.warn("Cache agreement error", e);
    }
  }

  /**
   * Generate canonical public verification URL
   */
  static getPublicVerificationUrl(agreement: { verificationToken: string; agreementNo?: string }): string {
    const token = agreement.verificationToken || "";
    return `${window.location.origin}/?verify_agreement=${encodeURIComponent(token)}`;
  }

  static async saveAgreement(agreement: ConstructionAgreement): Promise<ConstructionAgreement> {
    const list = this.getAgreements();
    const existingIndex = list.findIndex(a => a.id === agreement.id);
    const now = new Date().toISOString();

    // Ensure verification token exists
    let token = agreement.verificationToken;
    if (!token) {
      token = this.generateVerificationToken();
    }

    // Generate QR Code data url linking to public verification endpoint
    let qrUrl = agreement.qrCodeDataUrl;
    try {
      const verifyUrl = `${window.location.origin}/?verify_agreement=${encodeURIComponent(token)}`;
      qrUrl = await QRCode.toDataURL(verifyUrl, {
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" }
      });
    } catch (e) {
      console.warn("QR code generation fallback", e);
    }

    let saved: ConstructionAgreement;
    if (existingIndex >= 0) {
      saved = {
        ...agreement,
        verificationToken: token,
        qrCodeDataUrl: qrUrl,
        version: (agreement.version || 1) + 1,
        updatedAt: now
      };
      list[existingIndex] = saved;
      this.logAudit("AGREEMENT", agreement.id, `Updated agreement: ${agreement.agreementNo} v${saved.version}`);
    } else {
      saved = {
        ...agreement,
        verificationToken: token,
        qrCodeDataUrl: qrUrl,
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(saved);
      this.logAudit("AGREEMENT", agreement.id, `Generated new agreement: ${agreement.agreementNo}`);
    }

    localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(list));

    // Asynchronously synchronize to Firestore for cross-device public QR verification
    try {
      if (db) {
        setDoc(doc(db, "construction_agreements", saved.id), saved, { merge: true }).catch(err =>
          console.warn("Error syncing agreement to Firestore", err)
        );
      }
    } catch (e) {
      console.warn("Cloud agreement sync failed", e);
    }

    // Also update associated project if any
    if (saved.projectId) {
      const projects = this.getProjects();
      const proj = projects.find(p => p.id === saved.projectId);
      if (proj) {
        proj.agreementId = saved.id;
        proj.finalContractAmount = saved.finalContractAmount;
        proj.totalBuiltUpArea = saved.totalBuiltUpArea;
        proj.effectiveRatePerSqFt = saved.effectiveRatePerSqFt;
        this.saveProject(proj);
      }
    }

    return saved;
  }

  /**
   * Duplicate Agreement (Copies specifications & clauses, creates new ID as Draft)
   */
  static async duplicateAgreement(sourceId: string): Promise<ConstructionAgreement | null> {
    const source = this.getAgreementById(sourceId);
    if (!source) return null;

    const newAgreementNo = this.generateNextAgreementNo();
    const newId = newAgreementNo;
    const newToken = this.generateVerificationToken();

    // Reset payment statuses to PENDING
    const duplicatedSchedule: PaymentScheduleItem[] = source.paymentSchedule.map(item => ({
      ...item,
      id: `ps_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: "PENDING",
      paidAmount: 0,
      balance: item.amount,
      paymentDate: undefined,
      paymentRef: undefined
    }));

    const duplicatedAgreement: ConstructionAgreement = {
      ...source,
      id: newId,
      agreementNo: newAgreementNo,
      title: `${source.title} (Copy)`,
      status: "DRAFT",
      version: 1,
      verificationToken: newToken,
      paymentSchedule: duplicatedSchedule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return await this.saveAgreement(duplicatedAgreement);
  }

  static archiveAgreement(id: string): boolean {
    const list = this.getAgreements();
    const target = list.find(a => a.id === id);
    if (target) {
      target.status = "ARCHIVED";
      target.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(list));
      this.logAudit("AGREEMENT", id, `Archived agreement ${target.agreementNo}`);
      return true;
    }
    return false;
  }

  static deleteAgreement(id: string): boolean {
    const list = this.getAgreements();
    const filtered = list.filter(a => a.id !== id);
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEYS.AGREEMENTS, JSON.stringify(filtered));
      this.logAudit("AGREEMENT", id, `Permanently deleted agreement ID ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Generate Next Unique Agreement Number: e.g. "CW-2026-00003"
   */
  static generateNextAgreementNo(): string {
    const agreements = this.getAgreements();
    const currentYear = new Date().getFullYear();
    const prefix = `CW-${currentYear}-`;
    const yearAgreements = agreements.filter(a => a.agreementNo.startsWith(prefix));

    let maxNum = 0;
    yearAgreements.forEach(a => {
      const numPart = parseInt(a.agreementNo.replace(prefix, ""), 10);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    });

    const nextNum = maxNum + 1;
    return `${prefix}${nextNum.toString().padStart(5, "0")}`;
  }

  /**
   * Generate Verification Token
   */
  static generateVerificationToken(): string {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeHex = Date.now().toString(36).slice(-4).toUpperCase();
    return `VST-CW-${rand}${timeHex}`;
  }

  /**
   * Log Audit Trail
   */
  static logAudit(entityType: "AGREEMENT" | "PROJECT" | "PAYMENT" | "SETTINGS", entityId: string, details: string): void {
    try {
      const logs = this.getAuditLogs();
      const newLog: ConstructionAuditLog = {
        id: `LOG_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: "Deepak (Vasthusilpy)",
        action: details,
        entityType,
        entityId,
        details
      };
      logs.unshift(newLog);
      // Keep recent 200 logs
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.warn("Error logging audit", e);
    }
  }

  static getAuditLogs(): ConstructionAuditLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Error parsing audit logs", e);
    }
    return [];
  }
}
