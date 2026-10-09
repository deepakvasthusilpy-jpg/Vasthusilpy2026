import {
  ConstructionProject,
  ConstructionAgreement,
  ConstructionSettings,
  ConstructionAuditLog,
  Quotation,
  QuotationService,
  Contractor,
  TermsClause,
  CompanyDetails
} from "../types";
import { EstimateProject } from "../data/estimateData";
import {
  loadEstimatesList,
  saveEstimatesList,
  getDeletedEstimateIds,
  STORAGE_KEYS,
  safeSetDoc
} from "./storageManager";
import { loadRegisteredTasks, RegisteredTask } from "../data/registeredTasksData";
import { db } from "../lib/firebase";
import { doc } from "firebase/firestore";

// Storage Key Constants
const STORAGE_KEYS_CONSTRUCTION = {
  PROJECTS: "vasthusilpy_construction_projects",
  AGREEMENTS: "vasthusilpy_construction_agreements",
  SETTINGS: "vasthusilpy_construction_settings",
  AUDIT_LOGS: "vasthusilpy_construction_audit_logs",
  VERIFICATION_TOKENS: "vasthusilpy_construction_verification_tokens"
};

const STORAGE_KEYS_QUOTATION = {
  QUOTATIONS: "vasthusilpy_quotations_v2",
  SERVICES: "vasthusilpy_quotation_services_v2",
  CONTRACTORS: "vasthusilpy_quotation_contractors_v2",
  TERMS: "vasthusilpy_quotation_terms_v2",
  COMPANY_SETTINGS: "vasthusilpy_quotation_company_v2"
};

const STORAGE_KEYS_EXTRA = {
  BUILDING_PLANS: "VAS_BUILDING_PLAN_PROJECTS_LIST",
  APP_TYPES: "vasthusilpy_app_types_clean_v3",
  MASTER_WORK_ITEMS: "vasthusilpy_estimate_master_work_items",
  CUSTOM_WORK_ITEMS: "vasthusilpy_custom_items_of_work",
  CLIENT_SHARE_LINKS: "vasthusilpy_client_share_links"
};

/**
 * Universal Backup Package Interface supporting core modules
 */
export interface VasthusilpyBackupPackage {
  metadata: {
    app: "Vasthusilpy Engineering & Architecture ERP";
    version: "3.0.0";
    exportedAt: string; // ISO string
    exportedAtFormatted: string;
    // Core Counts
    totalConstructionProjects: number;
    totalConstructionAgreements: number;
    totalQuotations: number;
    totalEstimates: number;
    totalRegisteredTasks: number;
    userEmail?: string;
  };

  // 1. CONSTRUCTION WORK
  constructionWork: {
    projects: ConstructionProject[];
    agreements: ConstructionAgreement[];
    settings: ConstructionSettings | null;
    auditLogs: ConstructionAuditLog[];
    verificationTokens?: any;
  };

  // 3. QUOTATION
  quotation: {
    quotations: Quotation[];
    services: QuotationService[];
    contractors: Contractor[];
    terms: TermsClause[];
    companyDetails: CompanyDetails | null;
  };

  // 4. ESTIMATOR
  estimator: {
    estimates: EstimateProject[];
    masterWorkItems?: any[];
    customWorkItems?: any[];
  };

  // Backwards compatibility root fields (for older versions)
  estimates: EstimateProject[];
  registeredTasks: RegisteredTask[];
  deletedEstimateIds: string[];
  customWorkItems?: any[];
  clientShareLinks?: any[];
}

/**
 * Safe JSON parse helper for localStorage items
 */
function readStorageJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
  }
  return fallback;
}

/**
 * Compile all office data into a unified, complete backup package
 */
export function generateFullBackupPackage(userEmail?: string): VasthusilpyBackupPackage {
  // 1. Construction Work
  const constructionProjects: ConstructionProject[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.PROJECTS, []);
  const constructionAgreements: ConstructionAgreement[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.AGREEMENTS, []);
  const constructionSettings: ConstructionSettings | null = readStorageJson(STORAGE_KEYS_CONSTRUCTION.SETTINGS, null);
  const constructionAuditLogs: ConstructionAuditLog[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.AUDIT_LOGS, []);
  const constructionTokens = readStorageJson(STORAGE_KEYS_CONSTRUCTION.VERIFICATION_TOKENS, {});

  // 3. Quotation
  const quotations: Quotation[] = readStorageJson(STORAGE_KEYS_QUOTATION.QUOTATIONS, []);
  const quotationServices: QuotationService[] = readStorageJson(STORAGE_KEYS_QUOTATION.SERVICES, []);
  const quotationContractors: Contractor[] = readStorageJson(STORAGE_KEYS_QUOTATION.CONTRACTORS, []);
  const quotationTerms: TermsClause[] = readStorageJson(STORAGE_KEYS_QUOTATION.TERMS, []);
  const quotationCompany: CompanyDetails | null = readStorageJson(STORAGE_KEYS_QUOTATION.COMPANY_SETTINGS, null);

  // 4. ESTIMATOR
  const estimates = loadEstimatesList();
  const masterWorkItems = readStorageJson(STORAGE_KEYS_EXTRA.MASTER_WORK_ITEMS, []);
  const customWorkItems = readStorageJson(STORAGE_KEYS_EXTRA.CUSTOM_WORK_ITEMS, []);

  const deletedEstimateIds = getDeletedEstimateIds();

  const now = new Date();
  const formatted = `${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${now.toLocaleTimeString("en-IN")}`;

  return {
    metadata: {
      app: "Vasthusilpy Engineering & Architecture ERP",
      version: "3.0.0",
      exportedAt: now.toISOString(),
      exportedAtFormatted: formatted,
      totalConstructionProjects: constructionProjects.length,
      totalConstructionAgreements: constructionAgreements.length,
      totalQuotations: quotations.length,
      totalEstimates: estimates.length,
      totalRegisteredTasks: loadRegisteredTasks().length,
      userEmail: userEmail || "deepak.vasthusilpy@gmail.com"
    },
    constructionWork: {
      projects: constructionProjects,
      agreements: constructionAgreements,
      settings: constructionSettings,
      auditLogs: constructionAuditLogs,
      verificationTokens: constructionTokens
    },
    quotation: {
      quotations: quotations,
      services: quotationServices,
      contractors: quotationContractors,
      terms: quotationTerms,
      companyDetails: quotationCompany
    },
    estimator: {
      estimates: estimates,
      masterWorkItems: masterWorkItems,
      customWorkItems: customWorkItems
    },

    // Legacy flat properties for compatibility
    estimates: estimates,
    registeredTasks: loadRegisteredTasks(),
    deletedEstimateIds: deletedEstimateIds,
    customWorkItems: customWorkItems,
    clientShareLinks: readStorageJson(STORAGE_KEYS_EXTRA.CLIENT_SHARE_LINKS, [])
  };
}

/**
 * Trigger immediate download of full JSON backup file to device
 */
export function downloadOfflineBackup(userEmail?: string): { filename: string; sizeKb: number } {
  const backup = generateFullBackupPackage(userEmail);
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });

  const dateSlug = new Date().toISOString().split("T")[0];
  const timeSlug = new Date().toTimeString().split(" ")[0].replace(/:/g, "-").slice(0, 5);
  const filename = `Vasthusilpy_Full_Backup_${dateSlug}_${timeSlug}.json`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    filename,
    sizeKb: Math.round((blob.size / 1024) * 10) / 10
  };
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  package?: VasthusilpyBackupPackage;
  summary?: {
    vaultFilesCount?: number;
    vaultFoldersCount?: number;
    constructionProjectsCount: number;
    constructionAgreementsCount: number;
    quotationsCount: number;
    estimatesCount: number;
    exportedAtFormatted: string;
    version: string;
  };
}

/**
 * Validate imported JSON backup file before applying
 */
export function validateBackupFile(fileContent: string): BackupValidationResult {
  try {
    const data = JSON.parse(fileContent);

    // Validate standard structure or legacy structure
    const isVasthusilpyPackage =
      data &&
      (data.metadata?.app?.includes("Vasthusilpy") ||
        data.constructionWork ||
        data.quotation ||
        Array.isArray(data.estimates));

    if (!isVasthusilpyPackage) {
      return {
        isValid: false,
        error: "Invalid file format: Not a recognized Vasthusilpy ERP backup file."
      };
    }

    // Extract Construction Work
    const constructionProjects: ConstructionProject[] =
      data.constructionWork?.projects || (Array.isArray(data.constructionProjects) ? data.constructionProjects : []);
    const constructionAgreements: ConstructionAgreement[] =
      data.constructionWork?.agreements || (Array.isArray(data.constructionAgreements) ? data.constructionAgreements : []);
    const constructionSettings: ConstructionSettings | null =
      data.constructionWork?.settings || data.constructionSettings || null;
    const constructionAuditLogs: ConstructionAuditLog[] =
      data.constructionWork?.auditLogs || (Array.isArray(data.constructionAuditLogs) ? data.constructionAuditLogs : []);

    // Extract Quotation
    const quotations: Quotation[] =
      data.quotation?.quotations || (Array.isArray(data.quotations) ? data.quotations : []);
    const quotationServices: QuotationService[] =
      data.quotation?.services || (Array.isArray(data.quotationServices) ? data.quotationServices : []);
    const quotationContractors: Contractor[] =
      data.quotation?.contractors || (Array.isArray(data.contractors) ? data.contractors : []);
    const quotationTerms: TermsClause[] =
      data.quotation?.terms || (Array.isArray(data.quotationTerms) ? data.quotationTerms : []);
    const quotationCompany: CompanyDetails | null =
      data.quotation?.companyDetails || data.quotationCompany || null;

    // Extract Estimator
    const estimates: EstimateProject[] =
      data.estimator?.estimates || (Array.isArray(data.estimates) ? data.estimates : []);

    const normalizedPackage: VasthusilpyBackupPackage = {
      metadata: {
        app: "Vasthusilpy Engineering & Architecture ERP",
        version: data.metadata?.version || "3.0.0",
        exportedAt: data.metadata?.exportedAt || new Date().toISOString(),
        exportedAtFormatted:
          data.metadata?.exportedAtFormatted ||
          (data.metadata?.exportedAt ? new Date(data.metadata.exportedAt).toLocaleString("en-IN") : "Original Backup"),
        totalConstructionProjects: constructionProjects.length,
        totalConstructionAgreements: constructionAgreements.length,
        totalQuotations: quotations.length,
        totalEstimates: estimates.length,
        totalRegisteredTasks: loadRegisteredTasks().length,
        userEmail: data.metadata?.userEmail
      },
      constructionWork: {
        projects: constructionProjects,
        agreements: constructionAgreements,
        settings: constructionSettings,
        auditLogs: constructionAuditLogs,
        verificationTokens: data.constructionWork?.verificationTokens || {}
      },
      quotation: {
        quotations: quotations,
        services: quotationServices,
        contractors: quotationContractors,
        terms: quotationTerms,
        companyDetails: quotationCompany
      },
      estimator: {
        estimates: estimates,
        masterWorkItems: data.estimator?.masterWorkItems || [],
        customWorkItems: data.estimator?.customWorkItems || []
      },

      // Legacy flat properties for compatibility
      estimates: estimates,
      registeredTasks: loadRegisteredTasks(),
      deletedEstimateIds: Array.isArray(data.deletedEstimateIds) ? data.deletedEstimateIds : [],
      customWorkItems: Array.isArray(data.customWorkItems) ? data.customWorkItems : [],
      clientShareLinks: Array.isArray(data.clientShareLinks) ? data.clientShareLinks : []
    };

    return {
      isValid: true,
      package: normalizedPackage,
      summary: {
        constructionProjectsCount: constructionProjects.length,
        constructionAgreementsCount: constructionAgreements.length,
        quotationsCount: quotations.length,
        estimatesCount: estimates.length,
        exportedAtFormatted: normalizedPackage.metadata.exportedAtFormatted,
        version: normalizedPackage.metadata.version
      }
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to parse JSON backup file: ${err.message || "Syntax error"}`
    };
  }
}

/**
 * Restore data with either CLEAN REPLACE or MERGE mode across core tabs
 */
export async function restoreBackupPackage(
  pkg: VasthusilpyBackupPackage,
  mode: "REPLACE" | "MERGE" = "REPLACE"
): Promise<{ success: boolean; message: string }> {
  try {
    // ----------------------------------------------------
    // 1. CONSTRUCTION WORK
    // ----------------------------------------------------
    const incomingConstProjects = pkg.constructionWork?.projects || [];
    const incomingConstAgreements = pkg.constructionWork?.agreements || [];
    const incomingConstSettings = pkg.constructionWork?.settings || null;
    const incomingConstLogs = pkg.constructionWork?.auditLogs || [];

    if (mode === "REPLACE") {
      localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.PROJECTS, JSON.stringify(incomingConstProjects));
      localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.AGREEMENTS, JSON.stringify(incomingConstAgreements));
      if (incomingConstSettings) {
        localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.SETTINGS, JSON.stringify(incomingConstSettings));
      }
      localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.AUDIT_LOGS, JSON.stringify(incomingConstLogs));
    } else {
      // MERGE Construction Projects
      const cpMap = new Map<string, ConstructionProject>();
      const existingProjects: ConstructionProject[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.PROJECTS, []);
      existingProjects.forEach((p) => cpMap.set(p.id, p));
      incomingConstProjects.forEach((p) => cpMap.set(p.id, p));
      localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.PROJECTS, JSON.stringify(Array.from(cpMap.values())));

      // MERGE Construction Agreements
      const caMap = new Map<string, ConstructionAgreement>();
      const existingAgreements: ConstructionAgreement[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.AGREEMENTS, []);
      existingAgreements.forEach((a) => caMap.set(a.id, a));
      incomingConstAgreements.forEach((a) => caMap.set(a.id, a));
      localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.AGREEMENTS, JSON.stringify(Array.from(caMap.values())));

      if (incomingConstSettings) {
        localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.SETTINGS, JSON.stringify(incomingConstSettings));
      }
    }

    // ----------------------------------------------------
    // 3. QUOTATION
    // ----------------------------------------------------
    const incomingQuotes = pkg.quotation?.quotations || [];
    const incomingServices = pkg.quotation?.services || [];
    const incomingContractors = pkg.quotation?.contractors || [];
    const incomingTerms = pkg.quotation?.terms || [];
    const incomingCompany = pkg.quotation?.companyDetails || null;

    if (mode === "REPLACE") {
      localStorage.setItem(STORAGE_KEYS_QUOTATION.QUOTATIONS, JSON.stringify(incomingQuotes));
      if (incomingServices.length > 0) localStorage.setItem(STORAGE_KEYS_QUOTATION.SERVICES, JSON.stringify(incomingServices));
      if (incomingContractors.length > 0) localStorage.setItem(STORAGE_KEYS_QUOTATION.CONTRACTORS, JSON.stringify(incomingContractors));
      if (incomingTerms.length > 0) localStorage.setItem(STORAGE_KEYS_QUOTATION.TERMS, JSON.stringify(incomingTerms));
      if (incomingCompany) localStorage.setItem(STORAGE_KEYS_QUOTATION.COMPANY_SETTINGS, JSON.stringify(incomingCompany));
    } else {
      // MERGE Quotations
      const qMap = new Map<string, Quotation>();
      const existingQuotes: Quotation[] = readStorageJson(STORAGE_KEYS_QUOTATION.QUOTATIONS, []);
      existingQuotes.forEach((q) => qMap.set(q.id, q));
      incomingQuotes.forEach((q) => qMap.set(q.id, q));
      localStorage.setItem(STORAGE_KEYS_QUOTATION.QUOTATIONS, JSON.stringify(Array.from(qMap.values())));

      // MERGE Services
      const sMap = new Map<string, QuotationService>();
      const existingServices: QuotationService[] = readStorageJson(STORAGE_KEYS_QUOTATION.SERVICES, []);
      existingServices.forEach((s) => sMap.set(s.id, s));
      incomingServices.forEach((s) => sMap.set(s.id, s));
      if (incomingServices.length > 0) {
        localStorage.setItem(STORAGE_KEYS_QUOTATION.SERVICES, JSON.stringify(Array.from(sMap.values())));
      }
    }

    // ----------------------------------------------------
    // 4. ESTIMATOR
    // ----------------------------------------------------
    const incomingEstimates = pkg.estimator?.estimates || pkg.estimates || [];
    const incomingRateItems = (pkg.estimator as any)?.rateItems || (pkg as any).rateItems || [];

    let finalEstimates: EstimateProject[] = [];
    let finalRateItems: any[] = [];

    if (mode === "REPLACE") {
      localStorage.setItem(STORAGE_KEYS.DELETED_ESTIMATE_IDS, JSON.stringify([]));
      finalEstimates = incomingEstimates;
      finalRateItems = incomingRateItems;
    } else {
      const existingEstimates = loadEstimatesList();
      const eMap = new Map<string, EstimateProject>();
      existingEstimates.forEach((e) => eMap.set(e.id, e));
      incomingEstimates.forEach((e) => eMap.set(e.id, e));
      finalEstimates = Array.from(eMap.values());

      const existingRates: any[] = readStorageJson(STORAGE_KEYS.RATE_ITEMS, []);
      const rMap = new Map<string, any>();
      existingRates.forEach((r) => rMap.set(r.id, r));
      incomingRateItems.forEach((r: any) => rMap.set(r.id, r));
      finalRateItems = Array.from(rMap.values());
    }

    saveEstimatesList(finalEstimates, false);
    if (finalRateItems.length > 0) {
      localStorage.setItem(STORAGE_KEYS.RATE_ITEMS, JSON.stringify(finalRateItems));
    }

    // ----------------------------------------------------
    // BACKGROUND FIRESTORE SYNC & EVENT DISPATCHING
    // ----------------------------------------------------
    try {
      finalEstimates.forEach((e) => {
        safeSetDoc(doc(db, "estimates", e.id), e, { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.warn("Firestore sync during restore skipped/offline:", e);
    }

    // Dispatch global events
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    window.dispatchEvent(new Event("vasthusilpy_construction_updated"));
    window.dispatchEvent(new Event("vasthusilpy_quotations_updated"));
    window.dispatchEvent(new Event("vasthusilpy_backup_restored"));

    return {
      success: true,
      message: `Complete system restore finished! Restored Construction Work, Quotations, and Estimator seamlessly.`
    };
  } catch (err: any) {
    console.error("Failed to execute restore:", err);
    return {
      success: false,
      message: `Restore failed: ${err.message || "Unknown error"}`
    };
  }
}
