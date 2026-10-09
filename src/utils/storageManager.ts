import { EstimateProject, INITIAL_ESTIMATES_LIST, normalizeProjectBlocks } from "../data/estimateData";
import { db } from "../lib/firebase";
import { doc, deleteDoc, setDoc } from "firebase/firestore";
import { recordGlobalDeletion } from "./deletionRegistry";
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
  ESTIMATES: "vasthusilpy_estimates",
  DELETED_ESTIMATE_IDS: "vasthusilpy_deleted_estimate_ids",
  ESTIMATES_INITIALIZED: "vasthusilpy_estimates_initialized_v2"
};

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
    // 1. Clear CAD Vault Local Keys
    localStorage.removeItem("vasthusilpy_cad_files_vault_v3");
    localStorage.removeItem("vasthusilpy_cad_folders_v3");
    localStorage.removeItem("vasthusilpy_cad_metadata_index_v3");
    localStorage.removeItem("vasthusilpy_cad_files_vault_v2");

    // 2. Clear Estimates
    localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ESTIMATES_INITIALIZED, "true");
    
    // General storage reactivity
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));

    // 3. Durable Server Reset
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

    // 1. Clean up and rename localStorage estimates
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

    // 2. Clean up and rename client shares
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

export function safeDeleteEstimate(estimateId: string): EstimateProject[] {
  addDeletedEstimateId(estimateId);
  deleteCloudRecord("estimates", estimateId);
  const current = loadEstimatesList();
  const remaining = current.filter((p) => p.id !== estimateId);
  saveEstimatesList(remaining, true);
  if (db) {
    deleteDoc(doc(db, "estimates", estimateId)).catch((err) =>
      console.warn("Firestore delete estimate error:", err)
    );
  }
  return remaining;
}
