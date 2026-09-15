import { CrmProject, Invoice, Customer, RateItem } from "../types";
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
import { doc, setDoc } from "firebase/firestore";
import { broadcastMessage } from "./broadcastSync";

export interface VasthusilpyBackupPackage {
  metadata: {
    app: "Vasthusilpy Engineering & Architecture ERP";
    version: "2.5.0";
    exportedAt: string; // ISO string
    exportedAtFormatted: string;
    totalProjects: number;
    totalInvoices: number;
    totalEstimates: number;
    totalCustomers: number;
    totalRateItems: number;
    totalRegisteredTasks: number;
    userEmail?: string;
  };
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
 * Compile all office data into a clean, unified backup package
 */
export function generateFullBackupPackage(userEmail?: string): VasthusilpyBackupPackage {
  const projects = loadCrmProjects();
  const invoices = loadInvoices();
  const estimates = loadEstimatesList();

  let customers: Customer[] = [];
  try {
    const rawCust = localStorage.getItem("vasthusilpy_customers");
    if (rawCust) customers = JSON.parse(rawCust);
  } catch (e) {
    console.error("Error reading customers for backup", e);
  }

  let rateItems: RateItem[] = [];
  try {
    const rawRates = localStorage.getItem("vasthusilpy_rate_items");
    if (rawRates) rateItems = JSON.parse(rawRates);
  } catch (e) {
    console.error("Error reading rate items for backup", e);
  }

  const registeredTasks = loadRegisteredTasks();
  const deletedProjectIds = getDeletedProjectIds();
  const deletedInvoiceIds = getDeletedInvoiceIds();
  const deletedEstimateIds = getDeletedEstimateIds();

  let customWorkItems: any[] = [];
  try {
    const rawWorkItems = localStorage.getItem("vasthusilpy_custom_items_of_work");
    if (rawWorkItems) customWorkItems = JSON.parse(rawWorkItems);
  } catch (e) {}

  let clientShareLinks: any[] = [];
  try {
    const rawLinks = localStorage.getItem("vasthusilpy_client_share_links");
    if (rawLinks) clientShareLinks = JSON.parse(rawLinks);
  } catch (e) {}

  const now = new Date();
  const formatted = `${now.toLocaleDateString("en-IN")} at ${now.toLocaleTimeString("en-IN")}`;

  return {
    metadata: {
      app: "Vasthusilpy Engineering & Architecture ERP",
      version: "2.5.0",
      exportedAt: now.toISOString(),
      exportedAtFormatted: formatted,
      totalProjects: projects.length,
      totalInvoices: invoices.length,
      totalEstimates: estimates.length,
      totalCustomers: customers.length,
      totalRateItems: rateItems.length,
      totalRegisteredTasks: registeredTasks.length,
      userEmail: userEmail || "deepak.vasthusilpy@gmail.com"
    },
    crmProjects: projects,
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
 * Trigger immediate download of JSON backup file to device
 */
export function downloadOfflineBackup(userEmail?: string): { filename: string; sizeKb: number } {
  const backup = generateFullBackupPackage(userEmail);
  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });

  const dateSlug = new Date().toISOString().split("T")[0];
  const timeSlug = new Date().toTimeString().split(" ")[0].replace(/:/g, "-").slice(0, 5);
  const filename = `Vasthusilpy_Offline_Backup_${dateSlug}_${timeSlug}.json`;

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
    projectsCount: number;
    invoicesCount: number;
    estimatesCount: number;
    customersCount: number;
    rateItemsCount: number;
    registeredTasksCount: number;
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

    const projects: CrmProject[] = Array.isArray(data.crmProjects)
      ? data.crmProjects
      : Array.isArray(data.projects)
      ? data.projects
      : [];

    const invoices: Invoice[] = Array.isArray(data.invoices) ? data.invoices : [];
    const estimates: EstimateProject[] = Array.isArray(data.estimates) ? data.estimates : [];
    const customers: Customer[] = Array.isArray(data.customers) ? data.customers : [];
    const rateItems: RateItem[] = Array.isArray(data.rateItems) ? data.rateItems : [];
    const registeredTasks: RegisteredTask[] = Array.isArray(data.registeredTasks) ? data.registeredTasks : [];

    const normalizedPackage: VasthusilpyBackupPackage = {
      metadata: {
        app: "Vasthusilpy Engineering & Architecture ERP",
        version: data.metadata?.version || "2.5.0",
        exportedAt: data.metadata?.exportedAt || new Date().toISOString(),
        exportedAtFormatted:
          data.metadata?.exportedAtFormatted ||
          (data.metadata?.exportedAt
            ? new Date(data.metadata.exportedAt).toLocaleString()
            : "Original Backup"),
        totalProjects: projects.length,
        totalInvoices: invoices.length,
        totalEstimates: estimates.length,
        totalCustomers: customers.length,
        totalRateItems: rateItems.length,
        totalRegisteredTasks: registeredTasks.length,
        userEmail: data.metadata?.userEmail
      },
      crmProjects: projects,
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
        projectsCount: projects.length,
        invoicesCount: invoices.length,
        estimatesCount: estimates.length,
        customersCount: customers.length,
        rateItemsCount: rateItems.length,
        registeredTasksCount: registeredTasks.length,
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
 * Restore data with either CLEAN REPLACE or MERGE mode
 */
export async function restoreBackupPackage(
  pkg: VasthusilpyBackupPackage,
  mode: "REPLACE" | "MERGE" = "REPLACE"
): Promise<{ success: boolean; message: string }> {
  try {
    let finalProjects: CrmProject[] = [];
    let finalInvoices: Invoice[] = [];
    let finalEstimates: EstimateProject[] = [];
    let finalCustomers: Customer[] = [];
    let finalRateItems: RateItem[] = [];
    let finalRegisteredTasks: RegisteredTask[] = [];

    if (mode === "REPLACE") {
      // Clear old deleted IDs so restored items aren't suppressed
      localStorage.setItem(STORAGE_KEYS.DELETED_CRM_PROJECT_IDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DELETED_INVOICE_IDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.DELETED_ESTIMATE_IDS, JSON.stringify([]));

      finalProjects = pkg.crmProjects || [];
      finalInvoices = pkg.invoices || [];
      finalEstimates = pkg.estimates || [];
      finalCustomers = pkg.customers || [];
      finalRateItems = pkg.rateItems || [];
      finalRegisteredTasks = pkg.registeredTasks && pkg.registeredTasks.length > 0
        ? pkg.registeredTasks
        : loadRegisteredTasks();
    } else {
      // MERGE MODE
      const existingProjects = loadCrmProjects();
      const existingInvoices = loadInvoices();
      const existingEstimates = loadEstimatesList();

      let existingCustomers: Customer[] = [];
      try {
        const raw = localStorage.getItem("vasthusilpy_customers");
        if (raw) existingCustomers = JSON.parse(raw);
      } catch (e) {}

      let existingRates: RateItem[] = [];
      try {
        const raw = localStorage.getItem("vasthusilpy_rate_items");
        if (raw) existingRates = JSON.parse(raw);
      } catch (e) {}

      const existingTasks = loadRegisteredTasks();

      // Merge maps by ID
      const projMap = new Map<string, CrmProject>();
      existingProjects.forEach((p) => projMap.set(p.id, p));
      (pkg.crmProjects || []).forEach((p) => projMap.set(p.id, p));
      finalProjects = Array.from(projMap.values());

      const invMap = new Map<string, Invoice>();
      existingInvoices.forEach((i) => invMap.set(i.id, i));
      (pkg.invoices || []).forEach((i) => invMap.set(i.id, i));
      finalInvoices = Array.from(invMap.values());

      const estMap = new Map<string, EstimateProject>();
      existingEstimates.forEach((e) => estMap.set(e.id, e));
      (pkg.estimates || []).forEach((e) => estMap.set(e.id, e));
      finalEstimates = Array.from(estMap.values());

      const custMap = new Map<string, Customer>();
      existingCustomers.forEach((c) => custMap.set(c.id, c));
      (pkg.customers || []).forEach((c) => custMap.set(c.id, c));
      finalCustomers = Array.from(custMap.values());

      const rateMap = new Map<string, RateItem>();
      existingRates.forEach((r) => rateMap.set(r.id, r));
      (pkg.rateItems || []).forEach((r) => rateMap.set(r.id, r));
      finalRateItems = Array.from(rateMap.values());

      const taskMap = new Map<string, RegisteredTask>();
      existingTasks.forEach((t) => taskMap.set(t.id, t));
      (pkg.registeredTasks || []).forEach((t) => taskMap.set(t.id, t));
      finalRegisteredTasks = Array.from(taskMap.values());
    }

    // Save CRM Projects
    saveCrmProjects(finalProjects, false);

    // Save Invoices
    saveInvoices(finalInvoices, false);

    // Save Estimates
    saveEstimatesList(finalEstimates, false);

    // Save Customers
    if (finalCustomers.length > 0) {
      localStorage.setItem("vasthusilpy_customers", JSON.stringify(finalCustomers));
    }

    // Save Rate Items
    if (finalRateItems.length > 0) {
      localStorage.setItem("vasthusilpy_rate_items", JSON.stringify(finalRateItems));
    }

    // Save Registered Tasks
    if (finalRegisteredTasks.length > 0) {
      saveRegisteredTasks(finalRegisteredTasks);
    }

    // Optional work items / share links
    if (pkg.customWorkItems && pkg.customWorkItems.length > 0) {
      localStorage.setItem("vasthusilpy_custom_items_of_work", JSON.stringify(pkg.customWorkItems));
    }
    if (pkg.clientShareLinks && pkg.clientShareLinks.length > 0) {
      localStorage.setItem("vasthusilpy_client_share_links", JSON.stringify(pkg.clientShareLinks));
    }

    // Sync to Firestore in background for online resilience
    try {
      finalProjects.forEach((p) => {
        safeSetDoc(doc(db, "projects", p.id), p, { merge: true }).catch(() => {});
      });
      finalInvoices.forEach((i) => {
        safeSetDoc(doc(db, "invoices", i.id), i, { merge: true }).catch(() => {});
      });
    } catch (e) {
      console.warn("Firestore sync during restore skipped/offline:", e);
    }

    // Dispatch global events for real-time reactivity
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
    window.dispatchEvent(new Event("vasthusilpy_backup_restored"));

    broadcastMessage({ type: "SYNC_PROJECTS", data: finalProjects });
    broadcastMessage({ type: "SYNC_INVOICES", data: finalInvoices });

    return {
      success: true,
      message: `Offline restore complete! Loaded ${finalProjects.length} Projects, ${finalInvoices.length} Invoices, ${finalEstimates.length} Estimates, and ${finalCustomers.length} Customers.`
    };
  } catch (err: any) {
    console.error("Failed to execute restore:", err);
    return {
      success: false,
      message: `Restore failed: ${err.message || "Unknown error"}`
    };
  }
}
