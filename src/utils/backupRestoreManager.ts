import {
  CrmProject,
  Invoice,
  Customer,
  RateItem,
  ConstructionProject,
  ConstructionAgreement,
  ConstructionSettings,
  ConstructionAuditLog,
  Quotation,
  QuotationService,
  Contractor,
  TermsClause,
  CompanyDetails,
  PoovMalaBillRow,
  PoovMalaVendorConfig,
  KsebBillRecord,
  HealthInsurancePolicy,
  RdAccount,
  PanchayathBillRecord,
  PersonalVendor,
  PersonalVendorBill,
  StaffSalaryRecord
} from "../types";
import { CADDrawingRecord, CADFolder, CADMetadataIndexItem } from "../types/dataStorageTypes";
import { EstimateProject } from "../data/estimateData";
import {
  loadCrmProjects,
  saveCrmProjects,
  loadInvoices,
  saveInvoices,
  loadEstimatesList,
  saveEstimatesList,
  getDeletedProjectIds,
  getDeletedInvoiceIds,
  getDeletedEstimateIds,
  STORAGE_KEYS,
  safeSetDoc
} from "./storageManager";
import { loadRegisteredTasks, saveRegisteredTasks, RegisteredTask } from "../data/registeredTasksData";
import { db } from "../lib/firebase";
import { doc } from "firebase/firestore";
import { broadcastMessage } from "./broadcastSync";

// Storage Key Constants
const STORAGE_KEYS_VAULT = {
  FILES: "vasthusilpy_cad_files_vault_v3",
  FOLDERS: "vasthusilpy_cad_folders_v3",
  INDEX: "vasthusilpy_cad_metadata_index_v3",
  SETTINGS: "vasthusilpy_cad_vault_settings_v3"
};

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

const STORAGE_KEYS_PERSONAL = {
  POOV_MALA_ROWS: "vasthusilpy_poov_mala_rows_v2",
  POOV_MALA_CONFIG: "vasthusilpy_poov_mala_config_v1",
  KSEB_BILLS: "vasthusilpy_kseb_bills_v1",
  HEALTH_INSURANCE: "vasthusilpy_health_insurance_v1",
  RD_ACCOUNTS: "vasthusilpy_rd_accounts_v1",
  PANCHAYATH_BILLS: "vasthusilpy_panchayath_bills_v1",
  PERSONAL_VENDORS: "vasthusilpy_personal_vendors_v1",
  VENDOR_BILLS: "vasthusilpy_personal_vendor_bills_v1",
  STAFF_SALARY: "vasthusilpy_staff_salary_records_v1"
};

const STORAGE_KEYS_EXTRA = {
  BUILDING_PLANS: "VAS_BUILDING_PLAN_PROJECTS_LIST",
  APP_TYPES: "vasthusilpy_app_types_clean_v3",
  RECEIPT_COUNTER: "vasthusilpy_receipt_number_counter",
  RECEIPT_PROJECTS: "vasthusilpy_receipt_assigned_projects",
  MASTER_WORK_ITEMS: "vasthusilpy_estimate_master_work_items",
  CUSTOM_WORK_ITEMS: "vasthusilpy_custom_items_of_work",
  CLIENT_SHARE_LINKS: "vasthusilpy_client_share_links"
};

/**
 * Universal Backup Package Interface supporting all 7 Core Modules
 */
export interface VasthusilpyBackupPackage {
  metadata: {
    app: "Vasthusilpy Engineering & Architecture ERP";
    version: "3.0.0";
    exportedAt: string; // ISO string
    exportedAtFormatted: string;
    // Core Counts
    totalVaultFiles: number;
    totalVaultFolders: number;
    totalConstructionProjects: number;
    totalConstructionAgreements: number;
    totalQuotations: number;
    totalEstimates: number;
    totalCrmProjects: number;
    totalCustomers: number;
    totalInvoices: number;
    totalPersonalBills: number;
    totalRegisteredTasks: number;
    totalRateItems: number;
    userEmail?: string;
  };

  // 1. DATA STORAGE VAULT
  dataStorageVault: {
    files: CADDrawingRecord[];
    folders: CADFolder[];
    metadataIndex?: CADMetadataIndexItem[];
    settings?: any;
  };

  // 2. CONSTRUCTION WORK
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
    rateItems: RateItem[];
    masterWorkItems?: any[];
    customWorkItems?: any[];
  };

  // 5. CRM
  crm: {
    projects: CrmProject[];
    customers: Customer[];
    registeredTasks: RegisteredTask[];
    buildingPlans?: any[];
    applicationTypes?: any[];
    receiptCounter?: number;
    receiptProjects?: any[];
  };

  // 6. INVOICE PAYMENTS
  invoicePayments: {
    invoices: Invoice[];
  };

  // 7. PERSONAL BILLS & PAYMENTS
  personalBills: {
    poovMalaRows: PoovMalaBillRow[];
    poovMalaConfig: PoovMalaVendorConfig | null;
    ksebBills: KsebBillRecord[];
    healthInsurance: HealthInsurancePolicy[];
    rdAccounts: RdAccount[];
    panchayathBills: PanchayathBillRecord[];
    personalVendors: PersonalVendor[];
    vendorBills: PersonalVendorBill[];
    staffSalary: StaffSalaryRecord[];
  };

  // Backwards compatibility root fields (for older versions)
  crmProjects: CrmProject[];
  invoices: Invoice[];
  estimates: EstimateProject[];
  customers: Customer[];
  rateItems: RateItem[];
  registeredTasks: RegisteredTask[];
  deletedProjectIds: string[];
  deletedInvoiceIds: string[];
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
 * Compile all office data from all 7 tabs into a unified, complete backup package
 */
export function generateFullBackupPackage(userEmail?: string): VasthusilpyBackupPackage {
  // 1. Data Storage Vault
  const vaultFiles: CADDrawingRecord[] = readStorageJson(STORAGE_KEYS_VAULT.FILES, []);
  const vaultFolders: CADFolder[] = readStorageJson(STORAGE_KEYS_VAULT.FOLDERS, []);
  const vaultIndex: CADMetadataIndexItem[] = readStorageJson(STORAGE_KEYS_VAULT.INDEX, []);
  const vaultSettings = readStorageJson(STORAGE_KEYS_VAULT.SETTINGS, null);

  // 2. Construction Work
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

  // 4. Estimator
  const estimates = loadEstimatesList();
  const rateItems: RateItem[] = readStorageJson(STORAGE_KEYS.RATE_ITEMS, []);
  const masterWorkItems = readStorageJson(STORAGE_KEYS_EXTRA.MASTER_WORK_ITEMS, []);
  const customWorkItems = readStorageJson(STORAGE_KEYS_EXTRA.CUSTOM_WORK_ITEMS, []);

  // 5. CRM
  const crmProjects = loadCrmProjects();
  const customers: Customer[] = readStorageJson(STORAGE_KEYS.CUSTOMERS, []);
  const registeredTasks = loadRegisteredTasks();
  const buildingPlans = readStorageJson(STORAGE_KEYS_EXTRA.BUILDING_PLANS, []);
  const applicationTypes = readStorageJson(STORAGE_KEYS_EXTRA.APP_TYPES, []);
  const receiptCounter = Number(localStorage.getItem(STORAGE_KEYS_EXTRA.RECEIPT_COUNTER) || "1");
  const receiptProjects = readStorageJson(STORAGE_KEYS_EXTRA.RECEIPT_PROJECTS, []);
  const clientShareLinks = readStorageJson(STORAGE_KEYS_EXTRA.CLIENT_SHARE_LINKS, []);

  // 6. Invoice Payments
  const invoices = loadInvoices();

  // 7. Personal Bills & Payments
  const poovMalaRows: PoovMalaBillRow[] = readStorageJson(STORAGE_KEYS_PERSONAL.POOV_MALA_ROWS, []);
  const poovMalaConfig: PoovMalaVendorConfig | null = readStorageJson(STORAGE_KEYS_PERSONAL.POOV_MALA_CONFIG, null);
  const ksebBills: KsebBillRecord[] = readStorageJson(STORAGE_KEYS_PERSONAL.KSEB_BILLS, []);
  const healthInsurance: HealthInsurancePolicy[] = readStorageJson(STORAGE_KEYS_PERSONAL.HEALTH_INSURANCE, []);
  const rdAccounts: RdAccount[] = readStorageJson(STORAGE_KEYS_PERSONAL.RD_ACCOUNTS, []);
  const panchayathBills: PanchayathBillRecord[] = readStorageJson(STORAGE_KEYS_PERSONAL.PANCHAYATH_BILLS, []);
  const personalVendors: PersonalVendor[] = readStorageJson(STORAGE_KEYS_PERSONAL.PERSONAL_VENDORS, []);
  const vendorBills: PersonalVendorBill[] = readStorageJson(STORAGE_KEYS_PERSONAL.VENDOR_BILLS, []);
  const staffSalary: StaffSalaryRecord[] = readStorageJson(STORAGE_KEYS_PERSONAL.STAFF_SALARY, []);

  const deletedProjectIds = getDeletedProjectIds();
  const deletedInvoiceIds = getDeletedInvoiceIds();
  const deletedEstimateIds = getDeletedEstimateIds();

  const now = new Date();
  const formatted = `${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${now.toLocaleTimeString("en-IN")}`;

  const totalPersonalBills = poovMalaRows.length + ksebBills.length + vendorBills.length + staffSalary.length;

  return {
    metadata: {
      app: "Vasthusilpy Engineering & Architecture ERP",
      version: "3.0.0",
      exportedAt: now.toISOString(),
      exportedAtFormatted: formatted,
      totalVaultFiles: vaultFiles.length,
      totalVaultFolders: vaultFolders.length,
      totalConstructionProjects: constructionProjects.length,
      totalConstructionAgreements: constructionAgreements.length,
      totalQuotations: quotations.length,
      totalEstimates: estimates.length,
      totalCrmProjects: crmProjects.length,
      totalCustomers: customers.length,
      totalInvoices: invoices.length,
      totalPersonalBills: totalPersonalBills,
      totalRegisteredTasks: registeredTasks.length,
      totalRateItems: rateItems.length,
      userEmail: userEmail || "deepak.vasthusilpy@gmail.com"
    },
    dataStorageVault: {
      files: vaultFiles,
      folders: vaultFolders,
      metadataIndex: vaultIndex,
      settings: vaultSettings
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
      rateItems: rateItems,
      masterWorkItems: masterWorkItems,
      customWorkItems: customWorkItems
    },
    crm: {
      projects: crmProjects,
      customers: customers,
      registeredTasks: registeredTasks,
      buildingPlans: buildingPlans,
      applicationTypes: applicationTypes,
      receiptCounter: receiptCounter,
      receiptProjects: receiptProjects
    },
    invoicePayments: {
      invoices: invoices
    },
    personalBills: {
      poovMalaRows: poovMalaRows,
      poovMalaConfig: poovMalaConfig,
      ksebBills: ksebBills,
      healthInsurance: healthInsurance,
      rdAccounts: rdAccounts,
      panchayathBills: panchayathBills,
      personalVendors: personalVendors,
      vendorBills: vendorBills,
      staffSalary: staffSalary
    },
    // Legacy flat properties for compatibility
    crmProjects: crmProjects,
    invoices: invoices,
    estimates: estimates,
    customers: customers,
    rateItems: rateItems,
    registeredTasks: registeredTasks,
    deletedProjectIds: deletedProjectIds,
    deletedInvoiceIds: deletedInvoiceIds,
    deletedEstimateIds: deletedEstimateIds,
    customWorkItems: customWorkItems,
    clientShareLinks: clientShareLinks
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
    vaultFilesCount: number;
    vaultFoldersCount: number;
    constructionProjectsCount: number;
    constructionAgreementsCount: number;
    quotationsCount: number;
    estimatesCount: number;
    crmProjectsCount: number;
    customersCount: number;
    invoicesCount: number;
    personalBillsCount: number;
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
        data.dataStorageVault ||
        data.constructionWork ||
        data.quotation ||
        data.personalBills ||
        Array.isArray(data.crmProjects) ||
        Array.isArray(data.projects) ||
        Array.isArray(data.invoices) ||
        Array.isArray(data.estimates));

    if (!isVasthusilpyPackage) {
      return {
        isValid: false,
        error: "Invalid file format: Not a recognized Vasthusilpy ERP backup file."
      };
    }

    // Extract Data Storage Vault
    const vaultFiles: CADDrawingRecord[] =
      data.dataStorageVault?.files || (Array.isArray(data.cadFiles) ? data.cadFiles : []);
    const vaultFolders: CADFolder[] =
      data.dataStorageVault?.folders || (Array.isArray(data.cadFolders) ? data.cadFolders : []);
    const vaultIndex: CADMetadataIndexItem[] = data.dataStorageVault?.metadataIndex || [];
    const vaultSettings = data.dataStorageVault?.settings || null;

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
    const rateItems: RateItem[] =
      data.estimator?.rateItems || (Array.isArray(data.rateItems) ? data.rateItems : []);

    // Extract CRM
    const crmProjects: CrmProject[] =
      data.crm?.projects || (Array.isArray(data.crmProjects) ? data.crmProjects : Array.isArray(data.projects) ? data.projects : []);
    const customers: Customer[] =
      data.crm?.customers || (Array.isArray(data.customers) ? data.customers : []);
    const registeredTasks: RegisteredTask[] =
      data.crm?.registeredTasks || (Array.isArray(data.registeredTasks) ? data.registeredTasks : []);

    // Extract Invoices
    const invoices: Invoice[] =
      data.invoicePayments?.invoices || (Array.isArray(data.invoices) ? data.invoices : []);

    // Extract Personal Bills
    const poovMalaRows: PoovMalaBillRow[] =
      data.personalBills?.poovMalaRows || (Array.isArray(data.poovMalaRows) ? data.poovMalaRows : []);
    const poovMalaConfig: PoovMalaVendorConfig | null =
      data.personalBills?.poovMalaConfig || data.poovMalaConfig || null;
    const ksebBills: KsebBillRecord[] =
      data.personalBills?.ksebBills || (Array.isArray(data.ksebBills) ? data.ksebBills : []);
    const healthInsurance: HealthInsurancePolicy[] =
      data.personalBills?.healthInsurance || (Array.isArray(data.healthInsurance) ? data.healthInsurance : []);
    const rdAccounts: RdAccount[] =
      data.personalBills?.rdAccounts || (Array.isArray(data.rdAccounts) ? data.rdAccounts : []);
    const panchayathBills: PanchayathBillRecord[] =
      data.personalBills?.panchayathBills || (Array.isArray(data.panchayathBills) ? data.panchayathBills : []);
    const personalVendors: PersonalVendor[] =
      data.personalBills?.personalVendors || (Array.isArray(data.personalVendors) ? data.personalVendors : []);
    const vendorBills: PersonalVendorBill[] =
      data.personalBills?.vendorBills || (Array.isArray(data.vendorBills) ? data.vendorBills : []);
    const staffSalary: StaffSalaryRecord[] =
      data.personalBills?.staffSalary || (Array.isArray(data.staffSalary) ? data.staffSalary : []);

    const totalPersonalBills = poovMalaRows.length + ksebBills.length + vendorBills.length + staffSalary.length;

    const normalizedPackage: VasthusilpyBackupPackage = {
      metadata: {
        app: "Vasthusilpy Engineering & Architecture ERP",
        version: data.metadata?.version || "3.0.0",
        exportedAt: data.metadata?.exportedAt || new Date().toISOString(),
        exportedAtFormatted:
          data.metadata?.exportedAtFormatted ||
          (data.metadata?.exportedAt ? new Date(data.metadata.exportedAt).toLocaleString("en-IN") : "Original Backup"),
        totalVaultFiles: vaultFiles.length,
        totalVaultFolders: vaultFolders.length,
        totalConstructionProjects: constructionProjects.length,
        totalConstructionAgreements: constructionAgreements.length,
        totalQuotations: quotations.length,
        totalEstimates: estimates.length,
        totalCrmProjects: crmProjects.length,
        totalCustomers: customers.length,
        totalInvoices: invoices.length,
        totalPersonalBills: totalPersonalBills,
        totalRegisteredTasks: registeredTasks.length,
        totalRateItems: rateItems.length,
        userEmail: data.metadata?.userEmail
      },
      dataStorageVault: {
        files: vaultFiles,
        folders: vaultFolders,
        metadataIndex: vaultIndex,
        settings: vaultSettings
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
        rateItems: rateItems,
        masterWorkItems: data.estimator?.masterWorkItems || [],
        customWorkItems: data.estimator?.customWorkItems || []
      },
      crm: {
        projects: crmProjects,
        customers: customers,
        registeredTasks: registeredTasks,
        buildingPlans: data.crm?.buildingPlans || [],
        applicationTypes: data.crm?.applicationTypes || [],
        receiptCounter: data.crm?.receiptCounter || 1,
        receiptProjects: data.crm?.receiptProjects || []
      },
      invoicePayments: {
        invoices: invoices
      },
      personalBills: {
        poovMalaRows: poovMalaRows,
        poovMalaConfig: poovMalaConfig,
        ksebBills: ksebBills,
        healthInsurance: healthInsurance,
        rdAccounts: rdAccounts,
        panchayathBills: panchayathBills,
        personalVendors: personalVendors,
        vendorBills: vendorBills,
        staffSalary: staffSalary
      },
      crmProjects: crmProjects,
      invoices: invoices,
      estimates: estimates,
      customers: customers,
      rateItems: rateItems,
      registeredTasks: registeredTasks,
      deletedProjectIds: Array.isArray(data.deletedProjectIds) ? data.deletedProjectIds : [],
      deletedInvoiceIds: Array.isArray(data.deletedInvoiceIds) ? data.deletedInvoiceIds : [],
      deletedEstimateIds: Array.isArray(data.deletedEstimateIds) ? data.deletedEstimateIds : [],
      customWorkItems: Array.isArray(data.customWorkItems) ? data.customWorkItems : [],
      clientShareLinks: Array.isArray(data.clientShareLinks) ? data.clientShareLinks : []
    };

    return {
      isValid: true,
      package: normalizedPackage,
      summary: {
        vaultFilesCount: vaultFiles.length,
        vaultFoldersCount: vaultFolders.length,
        constructionProjectsCount: constructionProjects.length,
        constructionAgreementsCount: constructionAgreements.length,
        quotationsCount: quotations.length,
        estimatesCount: estimates.length,
        crmProjectsCount: crmProjects.length,
        customersCount: customers.length,
        invoicesCount: invoices.length,
        personalBillsCount: totalPersonalBills,
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
 * Restore data with either CLEAN REPLACE or MERGE mode across all 7 tabs
 */
export async function restoreBackupPackage(
  pkg: VasthusilpyBackupPackage,
  mode: "REPLACE" | "MERGE" = "REPLACE"
): Promise<{ success: boolean; message: string }> {
  try {
    // ----------------------------------------------------
    // 1. DATA STORAGE VAULT
    // ----------------------------------------------------
    const incomingVaultFiles = pkg.dataStorageVault?.files || [];
    const incomingVaultFolders = pkg.dataStorageVault?.folders || [];

    if (mode === "REPLACE") {
      if (incomingVaultFiles.length > 0 || incomingVaultFolders.length > 0) {
        localStorage.setItem(STORAGE_KEYS_VAULT.FILES, JSON.stringify(incomingVaultFiles));
        if (incomingVaultFolders.length > 0) {
          localStorage.setItem(STORAGE_KEYS_VAULT.FOLDERS, JSON.stringify(incomingVaultFolders));
        }
      }
    } else {
      // MERGE Vault Files
      const existingVaultFiles: CADDrawingRecord[] = readStorageJson(STORAGE_KEYS_VAULT.FILES, []);
      const fileMap = new Map<string, CADDrawingRecord>();
      existingVaultFiles.forEach((f) => fileMap.set(f.id, f));
      incomingVaultFiles.forEach((f) => fileMap.set(f.id, f));
      localStorage.setItem(STORAGE_KEYS_VAULT.FILES, JSON.stringify(Array.from(fileMap.values())));

      // MERGE Vault Folders
      const existingFolders: CADFolder[] = readStorageJson(STORAGE_KEYS_VAULT.FOLDERS, []);
      const folderMap = new Map<string, CADFolder>();
      existingFolders.forEach((f) => folderMap.set(f.id, f));
      incomingVaultFolders.forEach((f) => folderMap.set(f.id, f));
      localStorage.setItem(STORAGE_KEYS_VAULT.FOLDERS, JSON.stringify(Array.from(folderMap.values())));
    }

    // ----------------------------------------------------
    // 2. CONSTRUCTION WORK
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
      const existingProjects: ConstructionProject[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.PROJECTS, []);
      const cpMap = new Map<string, ConstructionProject>();
      existingProjects.forEach((p) => cpMap.set(p.id, p));
      incomingConstProjects.forEach((p) => cpMap.set(p.id, p));
      localStorage.setItem(STORAGE_KEYS_CONSTRUCTION.PROJECTS, JSON.stringify(Array.from(cpMap.values())));

      // MERGE Construction Agreements
      const existingAgreements: ConstructionAgreement[] = readStorageJson(STORAGE_KEYS_CONSTRUCTION.AGREEMENTS, []);
      const caMap = new Map<string, ConstructionAgreement>();
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
      const existingQuotes: Quotation[] = readStorageJson(STORAGE_KEYS_QUOTATION.QUOTATIONS, []);
      const qMap = new Map<string, Quotation>();
      existingQuotes.forEach((q) => qMap.set(q.id, q));
      incomingQuotes.forEach((q) => qMap.set(q.id, q));
      localStorage.setItem(STORAGE_KEYS_QUOTATION.QUOTATIONS, JSON.stringify(Array.from(qMap.values())));

      // MERGE Services
      const existingServices: QuotationService[] = readStorageJson(STORAGE_KEYS_QUOTATION.SERVICES, []);
      const sMap = new Map<string, QuotationService>();
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
    const incomingRateItems = pkg.estimator?.rateItems || pkg.rateItems || [];

    let finalEstimates: EstimateProject[] = [];
    let finalRateItems: RateItem[] = [];

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

      const existingRates: RateItem[] = readStorageJson(STORAGE_KEYS.RATE_ITEMS, []);
      const rMap = new Map<string, RateItem>();
      existingRates.forEach((r) => rMap.set(r.id, r));
      incomingRateItems.forEach((r) => rMap.set(r.id, r));
      finalRateItems = Array.from(rMap.values());
    }

    saveEstimatesList(finalEstimates, false);
    if (finalRateItems.length > 0) {
      localStorage.setItem(STORAGE_KEYS.RATE_ITEMS, JSON.stringify(finalRateItems));
    }

    // ----------------------------------------------------
    // 5. CRM
    // ----------------------------------------------------
    const incomingCrmProjects = pkg.crm?.projects || pkg.crmProjects || [];
    const incomingCustomers = pkg.crm?.customers || pkg.customers || [];
    const incomingTasks = pkg.crm?.registeredTasks || pkg.registeredTasks || [];

    let finalCrmProjects: CrmProject[] = [];
    let finalCustomers: Customer[] = [];
    let finalTasks: RegisteredTask[] = [];

    if (mode === "REPLACE") {
      localStorage.setItem(STORAGE_KEYS.DELETED_CRM_PROJECT_IDS, JSON.stringify([]));
      finalCrmProjects = incomingCrmProjects;
      finalCustomers = incomingCustomers;
      finalTasks = incomingTasks;
    } else {
      const existingCrm = loadCrmProjects();
      const cpMap = new Map<string, CrmProject>();
      existingCrm.forEach((p) => cpMap.set(p.id, p));
      incomingCrmProjects.forEach((p) => cpMap.set(p.id, p));
      finalCrmProjects = Array.from(cpMap.values());

      const existingCust: Customer[] = readStorageJson(STORAGE_KEYS.CUSTOMERS, []);
      const cuMap = new Map<string, Customer>();
      existingCust.forEach((c) => cuMap.set(c.id, c));
      incomingCustomers.forEach((c) => cuMap.set(c.id, c));
      finalCustomers = Array.from(cuMap.values());

      const existingTasks = loadRegisteredTasks();
      const tMap = new Map<string, RegisteredTask>();
      existingTasks.forEach((t) => tMap.set(t.id, t));
      incomingTasks.forEach((t) => tMap.set(t.id, t));
      finalTasks = Array.from(tMap.values());
    }

    saveCrmProjects(finalCrmProjects, false);
    if (finalCustomers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(finalCustomers));
    }
    if (finalTasks.length > 0) {
      saveRegisteredTasks(finalTasks);
    }

    // Receipt Counter & Assigned Projects
    if (pkg.crm?.receiptCounter) {
      localStorage.setItem(STORAGE_KEYS_EXTRA.RECEIPT_COUNTER, String(pkg.crm.receiptCounter));
    }
    if (pkg.crm?.receiptProjects && pkg.crm.receiptProjects.length > 0) {
      localStorage.setItem(STORAGE_KEYS_EXTRA.RECEIPT_PROJECTS, JSON.stringify(pkg.crm.receiptProjects));
    }

    // ----------------------------------------------------
    // 6. INVOICE PAYMENTS
    // ----------------------------------------------------
    const incomingInvoices = pkg.invoicePayments?.invoices || pkg.invoices || [];
    let finalInvoices: Invoice[] = [];

    if (mode === "REPLACE") {
      localStorage.setItem(STORAGE_KEYS.DELETED_INVOICE_IDS, JSON.stringify([]));
      finalInvoices = incomingInvoices;
    } else {
      const existingInvoices = loadInvoices();
      const invMap = new Map<string, Invoice>();
      existingInvoices.forEach((i) => invMap.set(i.id, i));
      incomingInvoices.forEach((i) => invMap.set(i.id, i));
      finalInvoices = Array.from(invMap.values());
    }

    saveInvoices(finalInvoices, false);

    // ----------------------------------------------------
    // 7. PERSONAL BILLS & PAYMENTS
    // ----------------------------------------------------
    if (pkg.personalBills) {
      const {
        poovMalaRows,
        poovMalaConfig,
        ksebBills,
        healthInsurance,
        rdAccounts,
        panchayathBills,
        personalVendors,
        vendorBills,
        staffSalary
      } = pkg.personalBills;

      if (mode === "REPLACE") {
        if (poovMalaRows) localStorage.setItem(STORAGE_KEYS_PERSONAL.POOV_MALA_ROWS, JSON.stringify(poovMalaRows));
        if (poovMalaConfig) localStorage.setItem(STORAGE_KEYS_PERSONAL.POOV_MALA_CONFIG, JSON.stringify(poovMalaConfig));
        if (ksebBills) localStorage.setItem(STORAGE_KEYS_PERSONAL.KSEB_BILLS, JSON.stringify(ksebBills));
        if (healthInsurance) localStorage.setItem(STORAGE_KEYS_PERSONAL.HEALTH_INSURANCE, JSON.stringify(healthInsurance));
        if (rdAccounts) localStorage.setItem(STORAGE_KEYS_PERSONAL.RD_ACCOUNTS, JSON.stringify(rdAccounts));
        if (panchayathBills) localStorage.setItem(STORAGE_KEYS_PERSONAL.PANCHAYATH_BILLS, JSON.stringify(panchayathBills));
        if (personalVendors) localStorage.setItem(STORAGE_KEYS_PERSONAL.PERSONAL_VENDORS, JSON.stringify(personalVendors));
        if (vendorBills) localStorage.setItem(STORAGE_KEYS_PERSONAL.VENDOR_BILLS, JSON.stringify(vendorBills));
        if (staffSalary) localStorage.setItem(STORAGE_KEYS_PERSONAL.STAFF_SALARY, JSON.stringify(staffSalary));
      } else {
        // MERGE Personal Bills
        if (poovMalaRows && poovMalaRows.length > 0) {
          const ex: PoovMalaBillRow[] = readStorageJson(STORAGE_KEYS_PERSONAL.POOV_MALA_ROWS, []);
          const map = new Map<string, PoovMalaBillRow>();
          ex.forEach((r) => map.set(r.id, r));
          poovMalaRows.forEach((r) => map.set(r.id, r));
          localStorage.setItem(STORAGE_KEYS_PERSONAL.POOV_MALA_ROWS, JSON.stringify(Array.from(map.values())));
        }
        if (ksebBills && ksebBills.length > 0) {
          const ex: KsebBillRecord[] = readStorageJson(STORAGE_KEYS_PERSONAL.KSEB_BILLS, []);
          const map = new Map<string, KsebBillRecord>();
          ex.forEach((b) => map.set(b.id, b));
          ksebBills.forEach((b) => map.set(b.id, b));
          localStorage.setItem(STORAGE_KEYS_PERSONAL.KSEB_BILLS, JSON.stringify(Array.from(map.values())));
        }
        if (vendorBills && vendorBills.length > 0) {
          const ex: PersonalVendorBill[] = readStorageJson(STORAGE_KEYS_PERSONAL.VENDOR_BILLS, []);
          const map = new Map<string, PersonalVendorBill>();
          ex.forEach((b) => map.set(b.id, b));
          vendorBills.forEach((b) => map.set(b.id, b));
          localStorage.setItem(STORAGE_KEYS_PERSONAL.VENDOR_BILLS, JSON.stringify(Array.from(map.values())));
        }
        if (staffSalary && staffSalary.length > 0) {
          const ex: StaffSalaryRecord[] = readStorageJson(STORAGE_KEYS_PERSONAL.STAFF_SALARY, []);
          const map = new Map<string, StaffSalaryRecord>();
          ex.forEach((s) => map.set(s.id, s));
          staffSalary.forEach((s) => map.set(s.id, s));
          localStorage.setItem(STORAGE_KEYS_PERSONAL.STAFF_SALARY, JSON.stringify(Array.from(map.values())));
        }
      }
    }

    // ----------------------------------------------------
    // BACKGROUND FIRESTORE SYNC & EVENT DISPATCHING
    // ----------------------------------------------------
    try {
      finalCrmProjects.forEach((p) => {
        safeSetDoc(doc(db, "projects", p.id), p, { merge: true }).catch(() => {});
      });
      finalInvoices.forEach((i) => {
        safeSetDoc(doc(db, "invoices", i.id), i, { merge: true }).catch(() => {});
      });
      finalEstimates.forEach((e) => {
        safeSetDoc(doc(db, "estimates", e.id), e, { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.warn("Firestore sync during restore skipped/offline:", e);
    }

    // Dispatch global events for instant reactivity across all opened tabs
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
    window.dispatchEvent(new Event("vasthusilpy_cad_storage_updated"));
    window.dispatchEvent(new Event("vasthusilpy_construction_updated"));
    window.dispatchEvent(new Event("vasthusilpy_quotations_updated"));
    window.dispatchEvent(new Event("vasthusilpy_personal_bills_updated"));
    window.dispatchEvent(new Event("vasthusilpy_backup_restored"));
    window.dispatchEvent(new Event("vasthusilpy_snapshots_updated"));

    broadcastMessage({ type: "SYNC_PROJECTS", data: finalCrmProjects });
    broadcastMessage({ type: "SYNC_INVOICES", data: finalInvoices });

    return {
      success: true,
      message: `Complete system restore finished! Restored Data Storage Vault, Construction Work, Quotations, Estimator, CRM, Invoices, and Personal Bills seamlessly.`
    };
  } catch (err: any) {
    console.error("Failed to execute restore:", err);
    return {
      success: false,
      message: `Restore failed: ${err.message || "Unknown error"}`
    };
  }
}
