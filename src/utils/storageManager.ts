import { CrmProject, Invoice, RateItem, Customer } from "../types";
import { INITIAL_CRM_PROJECTS, INITIAL_INVOICES, INITIAL_RATE_ITEMS, INITIAL_CUSTOMERS } from "../data/crmData";
import { EstimateProject, INITIAL_ESTIMATES_LIST, normalizeProjectBlocks } from "../data/estimateData";
import { db } from "../lib/firebase";
import { doc, deleteDoc, setDoc } from "firebase/firestore";
import { broadcastMessage } from "./broadcastSync";
import { recordGlobalDeletion, filterOutDeletedRecords } from "./deletionRegistry";
import { deleteCloudRecord, pushCloudSync } from "./cloudRealtimeClient";

/**
 * Recursively removes all `undefined` fields from an object or array before sending to Firestore,
 * preventing "FirebaseError: Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}

export function safeSetDoc(docRef: any, data: any, options?: any): Promise<void> {
  if (!db || !docRef) return Promise.resolve();
  try {
    return setDoc(docRef, sanitizeForFirestore(data), options).catch(() => {});
  } catch (e) {
    return Promise.resolve();
  }
}

export const STORAGE_KEYS = {
  CRM_PROJECTS: "vasthusilpy_crm_projects",
  DELETED_CRM_PROJECT_IDS: "vasthusilpy_deleted_crm_project_ids",
  CRM_INITIALIZED: "vasthusilpy_crm_projects_initialized_v2",

  INVOICES: "vasthusilpy_invoices",
  DELETED_INVOICE_IDS: "vasthusilpy_deleted_invoice_ids",
  INVOICES_INITIALIZED: "vasthusilpy_invoices_initialized_v2",

  ESTIMATES: "vasthusilpy_estimates",
  DELETED_ESTIMATE_IDS: "vasthusilpy_deleted_estimate_ids",
  ESTIMATES_INITIALIZED: "vasthusilpy_estimates_initialized_v2",

  RATE_ITEMS: "vasthusilpy_rate_items",
  DELETED_RATE_ITEM_IDS: "vasthusilpy_deleted_rate_item_ids",
  RATE_ITEMS_INITIALIZED: "vasthusilpy_rate_items_initialized_v2",

  CUSTOMERS: "vasthusilpy_customers",
  DELETED_CUSTOMER_IDS: "vasthusilpy_deleted_customer_ids",
  CUSTOMERS_INITIALIZED: "vasthusilpy_customers_initialized_v2"
};

// Permanently purged initial demo projects and linked demo invoices
export const PURGED_PROJECT_IDS = [
  "crm_proj_1",
  "crm_proj_2",
  "crm_proj_3",
  "crm_proj_4",
  "crm_proj_5"
];

export const PURGED_INVOICE_IDS = [
  "inv_1",
  "inv_2",
  "inv_3",
  "inv_4",
  "inv_5",
  "inv_demo_1",
  "inv_demo_2",
  "inv_demo_3",
  "inv_sample_1",
  "inv_sample_2"
];

export const PURGED_CUSTOMER_IDS = [
  "cust_1",
  "cust_2",
  "cust_3",
  "cust_4",
  "cust_5"
];

// Safe check for demo/purged invoices on initial seed only
export function isDemoOrPurgedInvoice(inv: any): boolean {
  if (!inv) return true;
  if (shouldPurgeClient(inv.customerName) || shouldPurgeClient(inv.clientName)) return true;
  return false;
}

export function shouldRenameClient(name?: string): boolean {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return (
    (clean.includes("dasan") && clean.includes("preetha")) ||
    clean === "1. dasan 2. preetha (copy)" ||
    clean === "1. dasan 2. preetha" ||
    clean.startsWith("1. dasan")
  );
}

export function renameClientName(name?: string): string {
  if (!name) return "Client 1";
  if (shouldRenameClient(name)) {
    return "Client 1";
  }
  return name;
}

export function shouldPurgeClient(name?: string): boolean {
  if (!name) return false;
  const clean = name.trim().toLowerCase();
  return (
    clean.includes("mohan kumar") ||
    (clean.includes("mohan") && clean.includes("priya")) ||
    clean.includes("v. r. suresh") ||
    clean.includes("v.r. suresh") ||
    clean.includes("vr suresh") ||
    clean.includes("suresh kumar")
  );
}

// Self-invoking database purge for Firestore and LocalStorage
export function wipeSpecifiedTabsDataVaultAndCrmAndBills(): void {
  try {
    // 1. Data Storage Vault files
    localStorage.setItem("vasthusilpy_cad_files_vault_v3", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_cad_metadata_index_v3", JSON.stringify([]));
    localStorage.removeItem("vasthusilpy_cad_files_vault_v2");
    window.dispatchEvent(new CustomEvent("vasthusilpy_cad_vault_update", { detail: { count: 0 } }));

    // 2. CRM Projects & Online Applications
    localStorage.setItem(STORAGE_KEYS.CRM_PROJECTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CRM_INITIALIZED, "true");
    localStorage.setItem("vasthusilpy_online_applications", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_application_form_entries", JSON.stringify([]));
    window.dispatchEvent(new Event("vasthusilpy_crm_projects_updated"));

    // 3. Invoices, Payments, Customers & Rate Catalog
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVOICES_INITIALIZED, "true");
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS_INITIALIZED, "true");
    localStorage.setItem(STORAGE_KEYS.RATE_ITEMS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.RATE_ITEMS_INITIALIZED, "true");
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
    window.dispatchEvent(new Event("vasthusilpy_customers_updated"));
    window.dispatchEvent(new Event("vasthusilpy_rate_items_updated"));

    // 4. Personal Bills & Payments
    localStorage.setItem("vasthusilpy_poov_mala_rows_v2", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_kseb_bills_v1", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_health_insurance_v1", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_rd_accounts_v1", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_panchayath_bills_v1", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_personal_vendors_v1", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_personal_vendor_bills_v1", JSON.stringify([]));
    localStorage.setItem("vasthusilpy_staff_salary_records_v1", JSON.stringify([]));
    window.dispatchEvent(new Event("personal_bills_updated"));

    // General storage reactivity
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));

    // 5. Durable Server Reset
    if (typeof fetch !== "undefined") {
      fetch("/api/web-data/reset-tabs-storage", { method: "POST" }).catch(() => {});
    }

    localStorage.setItem("vasthusilpy_clean_reset_v2026_done", "true");
  } catch (e) {
    console.error("Error running wipeSpecifiedTabsDataVaultAndCrmAndBills:", e);
  }
}

export function purgeDeletedEntitiesFromDatabase(): void {
  try {
    // Check if clean reset needed
    if (typeof localStorage !== "undefined" && !localStorage.getItem("vasthusilpy_clean_reset_v2026_done")) {
      wipeSpecifiedTabsDataVaultAndCrmAndBills();
    }

    // 1. Delete project docs from Firestore
    PURGED_PROJECT_IDS.forEach((id) => {
      deleteDoc(doc(db, "projects", id)).catch(() => {});
    });

    // 2. Delete invoice docs from Firestore
    PURGED_INVOICE_IDS.forEach((id) => {
      deleteDoc(doc(db, "invoices", id)).catch(() => {});
    });

    // 3. Clean up and rename localStorage projects
    const rawProjects = localStorage.getItem(STORAGE_KEYS.CRM_PROJECTS);
    if (rawProjects) {
      try {
        const parsed = JSON.parse(rawProjects);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((p: any) => !PURGED_PROJECT_IDS.includes(p.id) && !shouldPurgeClient(p.clientName) && !shouldPurgeClient(p.title))
            .map((p: any) => {
              if (shouldRenameClient(p.clientName)) {
                const renamed = {
                  ...p,
                  clientName: "Client 1",
                  title: (p.title || "").replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1").replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1")
                };
                safeSetDoc(doc(db, "projects", p.id), renamed, { merge: true }).catch(() => {});
                return renamed;
              }
              return p;
            });
          localStorage.setItem(STORAGE_KEYS.CRM_PROJECTS, JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 4. Clean up and rename localStorage invoices
    const rawInvoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (rawInvoices) {
      try {
        const parsed = JSON.parse(rawInvoices);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((inv: any) => !isDemoOrPurgedInvoice(inv) && !shouldPurgeClient(inv.applicantName) && !shouldPurgeClient(inv.customerName) && !shouldPurgeClient(inv.clientName))
            .map((inv: any) => {
              if (shouldRenameClient(inv.applicantName) || shouldRenameClient(inv.customerName)) {
                const renamed = {
                  ...inv,
                  applicantName: "Client 1"
                };
                safeSetDoc(doc(db, "invoices", inv.id), renamed, { merge: true }).catch(() => {});
                return renamed;
              }
              return inv;
            });
          localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 5. Clean up and rename localStorage customers
    const rawCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (rawCustomers) {
      try {
        const parsed = JSON.parse(rawCustomers);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((c: any) => !PURGED_CUSTOMER_IDS.includes(c.id) && !shouldPurgeClient(c.name))
            .map((c: any) => {
              if (shouldRenameClient(c.name)) {
                const renamed = {
                  ...c,
                  name: "Client 1"
                };
                safeSetDoc(doc(db, "customers", c.id), renamed, { merge: true }).catch(() => {});
                return renamed;
              }
              return c;
            });
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 6. Clean up and rename localStorage estimates
    const rawEstimates = localStorage.getItem(STORAGE_KEYS.ESTIMATES);
    if (rawEstimates) {
      try {
        const parsed = JSON.parse(rawEstimates);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((p: any) => !shouldPurgeClient(p.clientName))
            .map((p: any) => {
              if (shouldRenameClient(p.clientName)) {
                const renamed = {
                  ...p,
                  clientName: "Client 1",
                  headlineNarrative: (p.headlineNarrative || "")
                    .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                    .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1")
                };
                if (renamed.completionCertificate?.certificationStatement) {
                  renamed.completionCertificate.certificationStatement = renamed.completionCertificate.certificationStatement
                    .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                    .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1");
                }
                safeSetDoc(doc(db, "estimates", p.id), renamed, { merge: true }).catch(() => {});
                return renamed;
              }
              return p;
            });
          localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(cleaned));
        }
      } catch {}
    }

    // 7. Clean up and rename client shares
    const rawShares = localStorage.getItem("vasthusilpy_client_share_links");
    if (rawShares) {
      try {
        const parsed = JSON.parse(rawShares);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter((s: any) => !shouldPurgeClient(s.clientName))
            .map((s: any) => {
              if (shouldRenameClient(s.clientName)) {
                const renamed = { ...s, clientName: "Client 1" };
                safeSetDoc(doc(db, "client_shares", s.token), renamed, { merge: true }).catch(() => {});
                return renamed;
              }
              return s;
            });
          localStorage.setItem("vasthusilpy_client_share_links", JSON.stringify(cleaned));
        }
      } catch {}
    }
  } catch (e) {
    console.warn("Error running purgeDeletedEntitiesFromDatabase", e);
  }
}

// Run immediately on module evaluation
if (typeof window !== "undefined") {
  setTimeout(() => {
    purgeDeletedEntitiesFromDatabase();
  }, 100);
}

// -------------------------------------------------------------
// DELETED IDS TRACKING
// -------------------------------------------------------------
export function getDeletedProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_CRM_PROJECT_IDS);
    let list: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
    return Array.from(new Set([...list, ...PURGED_PROJECT_IDS]));
  } catch (e) {
    console.warn("Failed to read deleted project IDs", e);
  }
  return PURGED_PROJECT_IDS;
}

export function addDeletedProjectId(id: string): void {
  recordGlobalDeletion(id, "crm_projects");
  try {
    const current = getDeletedProjectIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_CRM_PROJECT_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save deleted project ID", e);
  }
}

export function getDeletedInvoiceIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_INVOICE_IDS);
    let list: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
    return Array.from(new Set([...list, ...PURGED_INVOICE_IDS]));
  } catch (e) {
    console.warn("Failed to read deleted invoice IDs", e);
  }
  return PURGED_INVOICE_IDS;
}

export function addDeletedInvoiceId(id: string): void {
  recordGlobalDeletion(id, "crm_invoices");
  try {
    const current = getDeletedInvoiceIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_INVOICE_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save deleted invoice ID", e);
  }
}

export function getDeletedEstimateIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_ESTIMATE_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read deleted estimate IDs", e);
  }
  return [];
}

export function addDeletedEstimateId(id: string): void {
  recordGlobalDeletion(id, "estimates");
  try {
    const current = getDeletedEstimateIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_ESTIMATE_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save deleted estimate ID", e);
  }
}

export function getDeletedRateItemIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_RATE_ITEM_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read deleted rate item IDs", e);
  }
  return [];
}

export function addDeletedRateItemId(id: string): void {
  recordGlobalDeletion(id, "rate_items");
  try {
    const current = getDeletedRateItemIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_RATE_ITEM_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save deleted rate item ID", e);
  }
}

export function getDeletedCustomerIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_CUSTOMER_IDS);
    let list: string[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
    return Array.from(new Set([...list, ...PURGED_CUSTOMER_IDS]));
  } catch (e) {
    console.warn("Failed to read deleted customer IDs", e);
  }
  return PURGED_CUSTOMER_IDS;
}

export function addDeletedCustomerId(id: string): void {
  recordGlobalDeletion(id, "customers");
  try {
    const current = getDeletedCustomerIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEYS.DELETED_CUSTOMER_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save deleted customer ID", e);
  }
}

// -------------------------------------------------------------
// CRM PROJECTS
// -------------------------------------------------------------
export function loadCrmProjects(): CrmProject[] {
  const deletedIds = getDeletedProjectIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CRM_PROJECTS);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.CRM_INITIALIZED);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p: CrmProject) => !deletedIds.includes(p.id) && !shouldPurgeClient(p.clientName) && !shouldPurgeClient(p.title))
          .map((p: CrmProject) => {
            if (shouldRenameClient(p.clientName)) {
              return {
                ...p,
                clientName: "Client 1",
                title: (p.title || "").replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1").replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1")
              };
            }
            return p;
          });
      }
    }

    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.CRM_INITIALIZED, "true");
      const initial = INITIAL_CRM_PROJECTS
        .filter((p) => !deletedIds.includes(p.id) && !shouldPurgeClient(p.clientName) && !shouldPurgeClient(p.title))
        .map((p) => (shouldRenameClient(p.clientName) ? { ...p, clientName: "Client 1" } : p));
      localStorage.setItem(STORAGE_KEYS.CRM_PROJECTS, JSON.stringify(initial));
      return initial;
    }
  } catch (e) {
    console.error("Failed to load CRM projects from localStorage", e);
  }
  return [];
}

export async function fetchServerCrmProjects(): Promise<CrmProject[]> {
  try {
    const res = await fetch("/api/crm/projects");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.projects)) {
        return data.projects;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch CRM projects from server:", err);
  }
  return [];
}

export async function saveCrmProjectToServer(project: CrmProject): Promise<void> {
  try {
    await fetch("/api/crm/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project })
    });
  } catch (err) {
    console.warn("Failed to save CRM project to server:", err);
  }
}

export async function deleteCrmProjectFromServer(projectId: string): Promise<void> {
  try {
    await fetch(`/api/crm/projects/${projectId}`, {
      method: "DELETE"
    });
  } catch (err) {
    console.warn("Failed to delete CRM project on server:", err);
  }
}

export async function syncCrmProjectsWithServer(projects: CrmProject[]): Promise<CrmProject[]> {
  try {
    const res = await fetch("/api/crm/projects/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projects })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.projects)) {
        return data.projects;
      }
    }
  } catch (err) {
    console.warn("Failed to sync CRM projects with server:", err);
  }
  return projects;
}

export function saveCrmProjects(projects: CrmProject[], dispatchEvents = true): void {
  const deletedIds = getDeletedProjectIds();
  const filtered = projects.filter((p) => !deletedIds.includes(p.id));
  try {
    localStorage.setItem(STORAGE_KEYS.CRM_PROJECTS, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_KEYS.CRM_INITIALIZED, "true");
    if (dispatchEvents) {
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
      broadcastMessage({ type: "SYNC_PROJECTS", data: filtered });
    }
    // Realtime Cloud push (broadcasts via SSE to all open tabs and devices instantly)
    pushCloudSync("crm_projects", filtered);
    // Background durable sync to server
    syncCrmProjectsWithServer(filtered).catch(() => {});
  } catch (e) {
    console.error("Failed to save CRM projects", e);
  }
}

// -------------------------------------------------------------
// INVOICES
// -------------------------------------------------------------
export async function fetchServerInvoices(): Promise<Invoice[]> {
  try {
    const res = await fetch("/api/crm/invoices");
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.invoices)) {
        return data.invoices;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch invoices from server:", err);
  }
  return [];
}

export async function saveInvoiceToServer(invoice: Invoice): Promise<void> {
  try {
    await fetch("/api/crm/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice })
    });
  } catch (err) {
    console.warn("Failed to save invoice to server:", err);
  }
}

export async function deleteInvoiceFromServer(invoiceId: string): Promise<void> {
  try {
    await fetch(`/api/crm/invoices/${invoiceId}`, {
      method: "DELETE"
    });
  } catch (err) {
    console.warn("Failed to delete invoice on server:", err);
  }
}

export async function syncInvoicesWithServer(invoices: Invoice[]): Promise<Invoice[]> {
  try {
    const res = await fetch("/api/crm/invoices/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoices })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.invoices)) {
        return data.invoices;
      }
    }
  } catch (err) {
    console.warn("Failed to sync invoices with server:", err);
  }
  return invoices;
}
export function loadInvoices(): Invoice[] {
  const deletedInvoiceIds = getDeletedInvoiceIds();
  const deletedProjectIds = getDeletedProjectIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.INVOICES_INITIALIZED);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((inv: Invoice) => !deletedInvoiceIds.includes(inv.id) && !isDemoOrPurgedInvoice(inv) && !shouldPurgeClient(inv.applicantName))
          .map((inv: Invoice) => {
            let processed = inv;
            if (shouldRenameClient(inv.applicantName)) {
              processed = { ...processed, applicantName: "Client 1" };
            }
            // If linked project was deleted, unlink it cleanly so no broken demo link persists
            if (processed.projectId && deletedProjectIds.includes(processed.projectId)) {
              return {
                ...processed,
                projectId: undefined
              };
            }
            return processed;
          });
      }
    }

    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.INVOICES_INITIALIZED, "true");
      const initial = INITIAL_INVOICES.filter((inv) => {
        if (deletedInvoiceIds.includes(inv.id) || isDemoOrPurgedInvoice(inv) || shouldPurgeClient(inv.applicantName)) return false;
        if (inv.projectId && deletedProjectIds.includes(inv.projectId)) return false;
        return true;
      }).map((inv) => (shouldRenameClient(inv.applicantName) ? { ...inv, applicantName: "Client 1" } : inv));
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initial));
      return initial;
    }
  } catch (e) {
    console.error("Failed to load invoices from localStorage", e);
  }
  return [];
}

export function saveInvoices(invoices: Invoice[], dispatchEvents = true): void {
  const deletedInvoiceIds = getDeletedInvoiceIds();
  const filtered = invoices.filter((i) => !deletedInvoiceIds.includes(i.id));
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_KEYS.INVOICES_INITIALIZED, "true");
    if (dispatchEvents) {
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
      window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
      broadcastMessage({ type: "SYNC_INVOICES", data: filtered });
    }
    // Realtime Cloud push
    pushCloudSync("crm_invoices", filtered);
    // Background durable sync to server
    syncInvoicesWithServer(filtered).catch(() => {});
  } catch (e) {
    console.error("Failed to save invoices", e);
  }
}

// -------------------------------------------------------------
// ESTIMATES
// -------------------------------------------------------------
export function loadEstimatesList(): EstimateProject[] {
  const deletedIds = getDeletedEstimateIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ESTIMATES);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.ESTIMATES_INITIALIZED);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p: EstimateProject) => !deletedIds.includes(p.id) && !shouldPurgeClient(p.clientName))
          .map((p) => {
            const norm = normalizeProjectBlocks(p);
            if (shouldRenameClient(norm.clientName)) {
              norm.clientName = "Client 1";
              if (norm.headlineNarrative) {
                norm.headlineNarrative = norm.headlineNarrative
                  .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                  .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1");
              }
              if (norm.completionCertificate?.certificationStatement) {
                norm.completionCertificate.certificationStatement = norm.completionCertificate.certificationStatement
                  .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                  .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1");
              }
            }
            return norm;
          });
      }
    }

    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.ESTIMATES_INITIALIZED, "true");
      const initial = INITIAL_ESTIMATES_LIST
        .filter((p) => !deletedIds.includes(p.id) && !shouldPurgeClient(p.clientName))
        .map((p) => {
          const norm = normalizeProjectBlocks(p);
          if (shouldRenameClient(norm.clientName)) {
            norm.clientName = "Client 1";
          }
          return norm;
        });
      localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(initial));
      return initial;
    }
  } catch (e) {
    console.error("Failed to load estimates from localStorage", e);
  }
  return [];
}

export function saveEstimatesList(projects: EstimateProject[], dispatchEvents = true): void {
  const deletedIds = getDeletedEstimateIds();
  const filtered = projects.filter((p) => !deletedIds.includes(p.id));
  try {
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_KEYS.ESTIMATES_INITIALIZED, "true");
    if (dispatchEvents) {
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    }
    // Realtime Cloud push
    pushCloudSync("estimates", filtered);
  } catch (e) {
    console.error("Failed to save estimates", e);
  }
}

// -------------------------------------------------------------
// PRODUCTS & SERVICES CATALOG (RATE ITEMS)
// -------------------------------------------------------------
export function loadRateItems(): RateItem[] {
  const deletedIds = getDeletedRateItemIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RATE_ITEMS);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.RATE_ITEMS_INITIALIZED);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: RateItem) => !deletedIds.includes(item.id));
      }
    }

    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.RATE_ITEMS_INITIALIZED, "true");
      const initial = INITIAL_RATE_ITEMS.filter((item) => !deletedIds.includes(item.id));
      localStorage.setItem(STORAGE_KEYS.RATE_ITEMS, JSON.stringify(initial));
      return initial;
    }
  } catch (e) {
    console.error("Failed to load rate items from localStorage", e);
  }
  return [];
}

export function saveRateItems(items: RateItem[], dispatchEvents = true): void {
  const deletedIds = getDeletedRateItemIds();
  const filtered = items.filter((i) => !deletedIds.includes(i.id));
  try {
    localStorage.setItem(STORAGE_KEYS.RATE_ITEMS, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_KEYS.RATE_ITEMS_INITIALIZED, "true");
    if (dispatchEvents) {
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
      window.dispatchEvent(new Event("vasthusilpy_rate_items_updated"));
    }
    // Realtime Cloud push
    pushCloudSync("rate_items", filtered);
  } catch (e) {
    console.error("Failed to save rate items", e);
  }
}

export function addOrUpdateRateItem(itemData: Omit<RateItem, "id"> & { id?: string }): RateItem {
  const currentItems = loadRateItems();
  // Check if item with exact same name or ID exists
  const existing = currentItems.find(
    (i) => (itemData.id && i.id === itemData.id) || i.name.trim().toLowerCase() === itemData.name.trim().toLowerCase()
  );

  let savedItem: RateItem;
  if (existing) {
    savedItem = {
      ...existing,
      ...itemData,
      id: existing.id
    };
    const updatedList = currentItems.map((i) => (i.id === existing.id ? savedItem : i));
    saveRateItems(updatedList, true);
  } else {
    savedItem = {
      id: itemData.id || `rate_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: itemData.name.trim(),
      category: itemData.category || "SERVICE",
      unit: itemData.unit || "Sq.Ft",
      rate: Number(itemData.rate) || 0,
      description: itemData.description || ""
    };
    saveRateItems([savedItem, ...currentItems], true);
  }
  return savedItem;
}

// -------------------------------------------------------------
// CUSTOMERS
// -------------------------------------------------------------
export function loadCustomers(): Customer[] {
  const deletedIds = getDeletedCustomerIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    const isInitialized = localStorage.getItem(STORAGE_KEYS.CUSTOMERS_INITIALIZED);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((cust: Customer) => !deletedIds.includes(cust.id) && !shouldPurgeClient(cust.name))
          .map((cust: Customer) => (shouldRenameClient(cust.name) ? { ...cust, name: "Client 1" } : cust));
      }
    }

    if (!isInitialized) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS_INITIALIZED, "true");
      const initial = INITIAL_CUSTOMERS
        .filter((c) => !deletedIds.includes(c.id) && !shouldPurgeClient(c.name))
        .map((c) => (shouldRenameClient(c.name) ? { ...c, name: "Client 1" } : c));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initial));
      return initial;
    }
  } catch (e) {
    console.error("Failed to load customers from localStorage", e);
  }
  return [];
}

export function saveCustomers(customers: Customer[], dispatchEvents = true): void {
  const deletedIds = getDeletedCustomerIds();
  const filtered = customers.filter((c) => !deletedIds.includes(c.id));
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS_INITIALIZED, "true");
    if (dispatchEvents) {
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
      window.dispatchEvent(new Event("vasthusilpy_customers_updated"));
    }
    // Realtime Cloud push
    pushCloudSync("customers", filtered);
  } catch (e) {
    console.error("Failed to save customers", e);
  }
}

export function addOrUpdateCustomer(customerData: Omit<Customer, "id"> & { id?: string }): Customer {
  const currentCustomers = loadCustomers();
  const existing = currentCustomers.find(
    (c) => (customerData.id && c.id === customerData.id) || (c.name.trim().toLowerCase() === customerData.name.trim().toLowerCase() && c.phone === customerData.phone)
  );

  let savedCustomer: Customer;
  if (existing) {
    savedCustomer = {
      ...existing,
      ...customerData,
      id: existing.id
    };
    const updated = currentCustomers.map((c) => (c.id === existing.id ? savedCustomer : c));
    saveCustomers(updated, true);
  } else {
    savedCustomer = {
      id: customerData.id || `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      email: customerData.email?.trim(),
      contactPerson: customerData.contactPerson?.trim(),
      houseName: customerData.houseName?.trim(),
      villagePanchayat: customerData.villagePanchayat?.trim(),
      district: customerData.district?.trim(),
      addressLine: customerData.addressLine?.trim(),
      gstNo: customerData.gstNo?.trim()
    };
    saveCustomers([savedCustomer, ...currentCustomers], true);
  }
  return savedCustomer;
}

// -------------------------------------------------------------
// UNIFIED SAFE DELETION HANDLERS
// -------------------------------------------------------------
export function safeDeleteProject(projectId: string): { remainingProjects: CrmProject[]; remainingInvoices: Invoice[] } {
  // 1. Mark project ID as deleted permanently in local and cloud registry
  addDeletedProjectId(projectId);
  deleteCloudRecord("crm_projects", projectId);

  // 2. Remove from CRM Projects list
  const currentProjects = loadCrmProjects();
  const remainingProjects = currentProjects.filter((p) => p.id !== projectId);
  saveCrmProjects(remainingProjects, true);

  // 3. Clean up linked invoices:
  // Invoices are NEVER automatically deleted. If linked to this project, safely unlink projectId so the invoice remains fully intact as standalone.
  const currentInvoices = loadInvoices();
  const remainingInvoices: Invoice[] = currentInvoices.map((inv) => {
    if (inv.projectId === projectId) {
      const unlinked = { ...inv, projectId: undefined };
      safeSetDoc(doc(db, "invoices", inv.id), unlinked, { merge: true }).catch(() => {});
      return unlinked;
    }
    return inv;
  });

  saveInvoices(remainingInvoices, true);

  // 4. Remove draft invoice associated with this project
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("vasthusilpy_invoice_draft_")) {
        const draft = localStorage.getItem(key);
        if (draft && draft.includes(projectId)) {
          localStorage.removeItem(key);
        }
      }
    }
  } catch (e) {
    console.warn("Error cleaning up draft invoices:", e);
  }

  // 5. Delete from Firestore
  deleteDoc(doc(db, "projects", projectId)).catch((err) =>
    console.warn("Firestore deleteDoc error:", err)
  );

  return { remainingProjects, remainingInvoices };
}

export function safeDeleteInvoice(invoiceId: string): { remainingInvoices: Invoice[]; remainingProjects: CrmProject[] } {
  // 1. Mark invoice ID as deleted permanently in local and cloud registry
  addDeletedInvoiceId(invoiceId);
  deleteCloudRecord("crm_invoices", invoiceId);

  // 2. Remove from Invoices list
  const currentInvoices = loadInvoices();
  const remainingInvoices = currentInvoices.filter((i) => i.id !== invoiceId);
  saveInvoices(remainingInvoices, true);

  // 3. Unlink from any CRM project that referenced this invoiceId
  const currentProjects = loadCrmProjects();
  const remainingProjects = currentProjects.map((proj) => {
    if (proj.invoiceId === invoiceId) {
      return {
        ...proj,
        invoiceId: undefined
      };
    }
    return proj;
  });
  saveCrmProjects(remainingProjects, true);

  // 4. Delete draft
  try {
    localStorage.removeItem(`vasthusilpy_invoice_draft_${invoiceId}`);
  } catch (e) {}

  // 5. Delete from Firestore
  deleteDoc(doc(db, "invoices", invoiceId)).catch((err) =>
    console.warn("Firestore deleteDoc invoice error:", err)
  );

  return { remainingInvoices, remainingProjects };
}

export function safeDeleteEstimate(estimateId: string): EstimateProject[] {
  addDeletedEstimateId(estimateId);
  deleteCloudRecord("estimates", estimateId);
  const current = loadEstimatesList();
  const remaining = current.filter((p) => p.id !== estimateId);
  saveEstimatesList(remaining, true);
  deleteDoc(doc(db, "estimates", estimateId)).catch((err) =>
    console.warn("Firestore delete estimate error:", err)
  );
  return remaining;
}

export function safeDeleteRateItem(rateItemId: string): RateItem[] {
  addDeletedRateItemId(rateItemId);
  deleteCloudRecord("rate_items", rateItemId);
  const current = loadRateItems();
  const remaining = current.filter((item) => item.id !== rateItemId);
  saveRateItems(remaining, true);
  deleteDoc(doc(db, "rate_items", rateItemId)).catch(() => {});
  return remaining;
}

export function safeDeleteCustomer(customerId: string): Customer[] {
  addDeletedCustomerId(customerId);
  deleteCloudRecord("customers", customerId);
  const current = loadCustomers();
  const remaining = current.filter((cust) => cust.id !== customerId);
  saveCustomers(remaining, true);
  deleteDoc(doc(db, "customers", customerId)).catch(() => {});
  return remaining;
}
