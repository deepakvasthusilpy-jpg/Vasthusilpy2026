import { ValuationCertificate } from "../types";
import { numberToIndianWords } from "./estimateData";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

export const SQM_TO_SQFT = 10.7639104;

export interface CpwdRatePreset {
  id: string;
  name: string;
  nameMl: string;
  ratePerSqM: number;
  description: string;
}

export const CPWD_RATE_PRESETS: CpwdRatePreset[] = [
  {
    id: "residential_rcc_plinth",
    name: "Residential Building (RCC Framed Structure)",
    nameMl: "താമസ കെട്ടിടം (RCC ഫ്രെയിംഡ് സ്ട്രക്ചർ)",
    ratePerSqM: 24500,
    description: "Standard CPWD Plinth Area Rate for Residential Multi-Storey / Framed Building"
  },
  {
    id: "residential_luxury_apartment",
    name: "Luxury Apartment / Multi-storey Flat",
    nameMl: "ലക്ഷ്വറി അപ്പാർട്ട്മെന്റ് / ഫ്ലാറ്റ്",
    ratePerSqM: 28200,
    description: "High-spec multi-storey apartment with modern amenities & lifts"
  },
  {
    id: "residential_load_bearing",
    name: "Residential Building (Load Bearing Masonry)",
    nameMl: "താമസ കെട്ടിടം (ലോഡ് ബെയറിംഗ് മൺപണി / കട്ടപ്പണി)",
    ratePerSqM: 19800,
    description: "Traditional / Brick / Solid Block load-bearing structure"
  },
  {
    id: "commercial_office_building",
    name: "Commercial & Office Complex",
    nameMl: "വാണിജ്യ & ഓഫീസ് സമുച്ചയം",
    ratePerSqM: 26800,
    description: "Commercial building with high live loads & services"
  },
  {
    id: "industrial_shed_storage",
    name: "Industrial Shed / Godown / Warehouse",
    nameMl: "ഇൻഡസ്ട്രിയൽ ഷെഡ് / ഗോഡൗൺ",
    ratePerSqM: 16500,
    description: "Steel truss roofing / GI sheet / Warehouse construction"
  }
];

export interface CostIndexPreset {
  district: string;
  districtMl: string;
  index: number;
  locationName: string;
}

export const KERALA_DISTRICT_COST_INDICES: CostIndexPreset[] = [
  { district: "Alappuzha", districtMl: "ആലപ്പുഴ", index: 1.33, locationName: "Alappuzha Cost Index (1.33)" },
  { district: "Palakkad", districtMl: "പാലക്കാട്", index: 1.30, locationName: "Palakkad Cost Index (1.30)" },
  { district: "Ernakulam", districtMl: "എറണാകുളം (Kochi)", index: 1.36, locationName: "Ernakulam Cost Index (1.36)" },
  { district: "Thiruvananthapuram", districtMl: "തിരുവനന്തപുരം", index: 1.35, locationName: "Thiruvananthapuram Cost Index (1.35)" },
  { district: "Kozhikode", districtMl: "കോഴിക്കോട്", index: 1.34, locationName: "Kozhikode Cost Index (1.34)" },
  { district: "Thrissur", districtMl: "തൃശ്ശൂർ", index: 1.32, locationName: "Thrissur Cost Index (1.32)" },
  { district: "Kottayam", districtMl: "കോട്ടയം", index: 1.32, locationName: "Kottayam Cost Index (1.32)" },
  { district: "Kannur", districtMl: "കണ്ണൂർ", index: 1.35, locationName: "Kannur Cost Index (1.35)" },
  { district: "Malappuram", districtMl: "മലപ്പുറം", index: 1.31, locationName: "Malappuram Cost Index (1.31)" },
  { district: "Kollam", districtMl: "കൊല്ലം", index: 1.33, locationName: "Kollam Cost Index (1.33)" },
  { district: "Pathanamthitta", districtMl: "പത്തനംതിട്ട", index: 1.32, locationName: "Pathanamthitta Cost Index (1.32)" },
  { district: "Kasaragod", districtMl: "കാസർഗോഡ്", index: 1.36, locationName: "Kasaragod Cost Index (1.36)" },
  { district: "Idukki", districtMl: "ഇടുക്കി", index: 1.38, locationName: "Idukki High-range Cost Index (1.38)" },
  { district: "Wayanad", districtMl: "വയനാട്", index: 1.38, locationName: "Wayanad High-range Cost Index (1.38)" }
];

export function calculateValuationDetails(
  input: Partial<ValuationCertificate>
): ValuationCertificate {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentYear = now.getFullYear();

  const areaSqM = Number(input.areaSqM) || 0;
  let areaSqFt = Number(input.areaSqFt) || 0;
  if (!areaSqFt && areaSqM > 0) {
    areaSqFt = Math.round(areaSqM * SQM_TO_SQFT * 100) / 100;
  }

  const cpwdRatePerSqM = Number(input.cpwdRatePerSqM) || 24500;
  const ratePerSqFtBase = Math.round((cpwdRatePerSqM / SQM_TO_SQFT) * 100) / 100;

  const costIndex = Number(input.costIndex) || 1.33;
  const costIndexName = input.costIndexName || "Alappuzha Cost Index (1.33)";

  const ratePerSqFtComputed = Math.round(ratePerSqFtBase * costIndex * 100) / 100;
  const ratePerSqFtAdjusted = input.ratePerSqFtAdjusted ? Number(input.ratePerSqFtAdjusted) : undefined;
  const effectiveRatePerSqFt = ratePerSqFtAdjusted && ratePerSqFtAdjusted > 0 ? ratePerSqFtAdjusted : ratePerSqFtComputed;

  const grossStructureValue = Math.round(effectiveRatePerSqFt * areaSqFt);

  // Age & Depreciation
  const yearOfConstruction = Number(input.yearOfConstruction) || (currentYear - 5);
  const certDate = input.certificateDate || todayStr;
  const certYear = parseInt(certDate.split("-")[0], 10) || currentYear;
  const ageOfBuilding = Math.max(0, certYear - yearOfConstruction);

  const depreciationMethod = input.depreciationMethod || "straight_line_1_5";
  const depreciationRatePerYear = input.depreciationRatePerYear !== undefined ? Number(input.depreciationRatePerYear) : 1.5;
  const depreciationCap = input.depreciationCap !== undefined ? Number(input.depreciationCap) : 75;

  let totalDepreciationPct = 0;
  if (depreciationMethod === "straight_line_1_5" || depreciationMethod === "custom") {
    totalDepreciationPct = Math.min(Math.round(ageOfBuilding * depreciationRatePerYear * 100) / 100, depreciationCap);
  }

  const depreciationAmount = Math.round(grossStructureValue * (totalDepreciationPct / 100));
  const netStructureValue = Math.max(0, grossStructureValue - depreciationAmount);

  // Optional Land / Undivided share
  const landAreaCents = input.landAreaCents ? Number(input.landAreaCents) : undefined;
  const landFairValuePerCent = input.landFairValuePerCent ? Number(input.landFairValuePerCent) : undefined;
  const totalLandValue = landAreaCents && landFairValuePerCent ? Math.round(landAreaCents * landFairValuePerCent) : undefined;

  const grandTotalValuation = netStructureValue + (totalLandValue || 0);
  const grandTotalWords = numberToIndianWords(grandTotalValuation);

  return {
    id: input.id || `VAL-${currentYear}-${String(Math.floor(Math.random() * 900) + 100)}`,
    certificateNo: input.certificateNo || `VC-${currentYear}/${String(Math.floor(Math.random() * 9000) + 1000)}`,
    sectionType: input.sectionType || "28B",

    // Valuer Information (Default blank except designation title)
    valuerName: input.valuerName || "",
    valuerAddress: input.valuerAddress || "",
    designation: input.designation || "Licensed Building Supervisor / Registered Valuer",
    regNo: input.regNo || "",
    subRegistryOffice: input.subRegistryOffice || "",
    inspectionDate: input.inspectionDate || todayStr,

    // Property Owner & Details
    ownerName: input.ownerName || "",
    ownerAddress: input.ownerAddress || "",
    propertyAddress: input.propertyAddress || "",
    doorNo: input.doorNo || "",
    syNo: input.syNo || "",
    blockNo: input.blockNo || "",
    wardNo: input.wardNo || "",
    villagePanchayat: input.villagePanchayat || "",
    districtPincode: input.districtPincode || "",
    yearOfConstruction,
    ageOfBuilding,

    // Technical calculations
    areaSqM,
    areaSqFt,
    cpwdRatePerSqM,
    ratePerSqFtBase,
    costIndexName,
    costIndex,
    ratePerSqFtComputed,
    ratePerSqFtAdjusted,
    effectiveRatePerSqFt,

    // Amounts
    grossStructureValue,
    depreciationMethod,
    depreciationRatePerYear,
    depreciationCap,
    totalDepreciationPct,
    depreciationAmount,
    netStructureValue,

    // Land
    landAreaCents,
    landFairValuePerCent,
    totalLandValue,

    // Grand total
    grandTotalValuation,
    grandTotalWords,

    // Details & Certification
    buildingDescription: input.buildingDescription || "RCC framed structure with solid block masonry walls, vitrified tile flooring, teak wood doors, anodized aluminium glazed windows, concealed electrical & plumbing fittings, emulsion painting in sound habitable condition.",
    place: input.place || "",
    certificateDate: certDate,

    // Official Valuer Seal & Signature
    showSealStamp: false,
    engineerSealId: input.engineerSealId || "blank_engineer",
    engineerPhone: input.engineerPhone || "",
    engineerEmail: input.engineerEmail || "",

    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: input.status || "DRAFT"
  };
}

export function createNewBlankValuation(existingCount = 0): ValuationCertificate {
  const currentYear = new Date().getFullYear();
  const nextSeq = existingCount + 1;
  const certNo = `VC-${currentYear}/${String(nextSeq).padStart(3, "0")}`;
  const id = `VAL-${currentYear}-${String(nextSeq).padStart(3, "0")}`;

  return calculateValuationDetails({
    id,
    certificateNo: certNo,
    sectionType: "28B",
    valuerName: "",
    valuerAddress: "",
    designation: "Licensed Building Valuer / Chartered Engineer",
    regNo: "",
    subRegistryOffice: "",
    ownerName: "",
    ownerAddress: "",
    propertyAddress: "",
    doorNo: "",
    yearOfConstruction: currentYear - 5,
    areaSqM: 100,
    areaSqFt: 1076.39,
    cpwdRatePerSqM: 24500,
    costIndex: 1.33,
    costIndexName: "Alappuzha Cost Index (1.33)",
    place: "",
    buildingDescription: "RCC framed structure with brick/block masonry, vitrified tile flooring, teak wood main door and standard sanitary & electrical installations in sound structural condition."
  });
}

export const INITIAL_SAMPLE_VALUATIONS: ValuationCertificate[] = [
  calculateValuationDetails({
    id: "VAL-2026-003",
    certificateNo: "VC-2026/003",
    sectionType: "28C",
    valuerName: "Pradeep ck",
    valuerAddress: "Kanjirani (H), Parakkad, Kalladikode -678596",
    designation: "Licenced Building Engineer –A",
    regNo: "E-2050/08/12212/KKD/197/2018/EA",
    subRegistryOffice: "Kadambazhipuram",
    inspectionDate: "2026-09-02",
    ownerName: "Ussainar",
    ownerAddress: "Nellikkunnu\nMucheeri po, Kongad",
    propertyAddress: "Nellikkunnu, Mucheeri po, Kongad",
    doorNo: "9/703(Kongad Grama Panchayth)",
    villagePanchayat: "Kongad Grama Panchayth",
    yearOfConstruction: 2023,
    areaSqM: 271.74,
    areaSqFt: 2925.0,
    cpwdRatePerSqM: 20750,
    costIndex: 1.36,
    costIndexName: "DPAR 2025 / Cost Index 136 For Palakkad",
    ratePerSqFtBase: 1928.43,
    ratePerSqFtAdjusted: 2622.66,
    grandTotalValuation: 5200000,
    netStructureValue: 5200000,
    place: "Kalladikode",
    certificateDate: "2026-09-02",
    buildingDescription: "RCC roof building\nDifference in main door\nDifference in windows\nDifference in electrical work\nDifference in plumbing work\nDifference in floor",
    status: "FINAL"
  }),
  calculateValuationDetails({
    id: "VAL-2026-001",
    certificateNo: "VC-2026/001",
    sectionType: "28B",
    valuerName: "",
    valuerAddress: "",
    designation: "Licensed Building Valuer & Supervisor",
    regNo: "",
    subRegistryOffice: "Alappuzha",
    inspectionDate: "2026-08-20",
    ownerName: "Adv. Thomas Mathew & Anitha Thomas",
    ownerAddress: "Flat 4B, Palm Breeze Apartments, Boat Jetty Road, Alappuzha",
    propertyAddress: "Flat No. 4B, 4th Floor, Palm Breeze Apartments, Ward 14, Alappuzha Municipality",
    doorNo: "14/412-B",
    syNo: "248/12",
    blockNo: "4",
    wardNo: "14",
    villagePanchayat: "Alappuzha West Village",
    districtPincode: "Alappuzha - 688001",
    yearOfConstruction: 2000,
    areaSqM: 92.9,
    areaSqFt: 1000.0,
    cpwdRatePerSqM: 24500,
    costIndex: 1.33,
    costIndexName: "Alappuzha Cost Index (1.33)",
    ratePerSqFtAdjusted: 3027.25,
    place: "Alappuzha",
    certificateDate: "2026-08-20",
    buildingDescription: "Multi-storeyed RCC framed apartment building with vitrified tile flooring, hardwood joinery, concealed copper wiring, granite kitchen counter and standard quality sanitary fittings. Structure is structurally sound and well maintained.",
    status: "FINAL"
  }),
  calculateValuationDetails({
    id: "VAL-2026-002",
    certificateNo: "VC-2026/002",
    sectionType: "28C",
    valuerName: "",
    valuerAddress: "",
    designation: "Licensed Building Valuer & Engineer",
    regNo: "",
    subRegistryOffice: "Parli",
    inspectionDate: "2026-08-18",
    ownerName: "Unnikrishnan K. & Geetha Unnikrishnan",
    ownerAddress: "Sreerangam, Keralassery P.O, Palakkad - 678641",
    propertyAddress: "Residential Building 'Sreerangam', Ward 06, Keralassery Grama Panchayat",
    doorNo: "6/289",
    syNo: "112/4",
    blockNo: "2",
    wardNo: "06",
    villagePanchayat: "Keralassery Grama Panchayat",
    districtPincode: "Palakkad - 678641",
    yearOfConstruction: 2012,
    areaSqM: 148.64,
    areaSqFt: 1600.0,
    cpwdRatePerSqM: 24500,
    costIndex: 1.30,
    costIndexName: "Palakkad Cost Index (1.30)",
    place: "Palakkad",
    certificateDate: "2026-08-18",
    buildingDescription: "Two-storied RCC framed residential building with solid concrete block walls, vitrified tile flooring, teak wood main door, CP fittings and superior electrical installations.",
    status: "FINAL"
  })
];

export const LOCAL_STORAGE_VALUATIONS_KEY = "vasthusilpy_valuation_certificates_v1";

/**
 * Loads valuation certificates from localStorage with fallback to initial sample data
 */
export function loadSavedValuations(): ValuationCertificate[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VALUATIONS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const hasAttachmentCert = parsed.some((p: ValuationCertificate) => p.id === "VAL-2026-003" || p.ownerName === "Ussainar");
        const list = !hasAttachmentCert && INITIAL_SAMPLE_VALUATIONS.length > 0
          ? [INITIAL_SAMPLE_VALUATIONS[0], ...parsed]
          : parsed;
        return list.map((item) => calculateValuationDetails(item));
      }
    }
    // First time init: save sample valuations
    localStorage.setItem(LOCAL_STORAGE_VALUATIONS_KEY, JSON.stringify(INITIAL_SAMPLE_VALUATIONS));
    return INITIAL_SAMPLE_VALUATIONS;
  } catch (e) {
    console.warn("Error loading valuation certificates from localStorage:", e);
    return INITIAL_SAMPLE_VALUATIONS;
  }
}

/**
 * Persists valuation certificates list to localStorage and triggers event
 */
export function saveValuations(list: ValuationCertificate[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_VALUATIONS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("vasthusilpy_valuations_updated"));
  } catch (e) {
    console.error("Failed to save valuation certificates to localStorage:", e);
  }
}

/**
 * Syncs a valuation certificate to Firestore online cloud database
 */
export async function syncValuationToCloud(cert: ValuationCertificate): Promise<boolean> {
  try {
    const colRef = collection(db, "valuation_certificates");
    const docRef = doc(colRef, cert.id);
    await setDoc(docRef, cert, { merge: true });
    return true;
  } catch (err) {
    console.warn("Could not sync valuation to Firestore online database:", err);
    return false;
  }
}

/**
 * Fetches all valuation certificates from Firestore online cloud database
 */
export async function fetchValuationsFromCloud(): Promise<ValuationCertificate[] | null> {
  try {
    const colRef = collection(db, "valuation_certificates");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return null;
    const list: ValuationCertificate[] = [];
    snapshot.forEach((d) => {
      list.push(calculateValuationDetails(d.data() as ValuationCertificate));
    });
    return list;
  } catch (err) {
    console.warn("Could not fetch valuation certificates from cloud:", err);
    return null;
  }
}

/**
 * Deletes a valuation certificate from cloud
 */
export async function deleteValuationFromCloud(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "valuation_certificates", id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.warn("Error deleting valuation from cloud:", err);
    return false;
  }
}

export function generateUniqueValuationNumber(
  existingList: ValuationCertificate[]
): string {
  const currentYear = new Date().getFullYear();
  let maxSeq = 0;
  existingList.forEach((c) => {
    const m = (c.id || "").match(/VAL-(\d{4})-(\d+)/i);
    if (m) {
      const seq = parseInt(m[2], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  });
  const nextSeq = Math.max(maxSeq + 1, existingList.length + 1);
  return `VAL-${currentYear}-${String(nextSeq).padStart(3, "0")}`;
}
