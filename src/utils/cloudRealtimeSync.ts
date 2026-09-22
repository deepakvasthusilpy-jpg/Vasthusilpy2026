import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from "firebase/firestore";
import { broadcastMessage } from "./broadcastSync";
import { sanitizeForFirestore } from "./storageManager";

// Local storage key constants
export const SYNC_KEYS = {
  PROJECTS: "vasthusilpy_crm_projects",
  INVOICES: "vasthusilpy_invoices",
  ESTIMATES: "vasthusilpy_estimates",
  CUSTOMERS: "vasthusilpy_customers",
  RATE_ITEMS: "vasthusilpy_rate_items",
  CAD_FOLDERS: "vasthusilpy_cad_folders_v3",
  CAD_FILES: "vasthusilpy_cad_files_vault_v3",
  IMPORTANT_SITES: "vasthusilpy_important_sites_v1",
  ONLINE_APPLICATIONS: "vasthusilpy_online_applications_v1",
  CONSTRUCTION_AGREEMENTS: "vasthusilpy_construction_agreements",
  SUBSCRIPTIONS: "vasthusilpy_subscription_requests",
  LAST_CLOUD_SYNC: "vasthusilpy_last_cloud_autosync_time",
  CLOUD_SYNC_STATUS: "vasthusilpy_cloud_sync_status"
};

// Track recently written hashes/timestamps to avoid echo loops
const recentLocalWrites = new Map<string, number>();

function markLocalWrite(key: string) {
  recentLocalWrites.set(key, Date.now());
}

function wasWrittenRecently(key: string, thresholdMs = 1500): boolean {
  const last = recentLocalWrites.get(key);
  if (!last) return false;
  return Date.now() - last < thresholdMs;
}

/**
 * Dispatch all standard UI refresh events across the entire web application
 */
export function dispatchAllSyncEvents(targetKey?: string) {
  window.dispatchEvent(new Event("vasthusilpy_storage_update"));
  window.dispatchEvent(new CustomEvent("vasthusilpy_realtime_cloud_sync", { detail: { targetKey, timestamp: Date.now() } }));

  if (!targetKey || targetKey === SYNC_KEYS.INVOICES) {
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
  }
  if (!targetKey || targetKey === SYNC_KEYS.CUSTOMERS) {
    window.dispatchEvent(new Event("vasthusilpy_customers_updated"));
  }
  if (!targetKey || targetKey === SYNC_KEYS.RATE_ITEMS) {
    window.dispatchEvent(new Event("vasthusilpy_rate_items_updated"));
  }
  if (!targetKey || targetKey === SYNC_KEYS.CAD_FOLDERS || targetKey === SYNC_KEYS.CAD_FILES) {
    window.dispatchEvent(new Event("vasthusilpy_cad_vault_update"));
  }
  if (!targetKey || targetKey === SYNC_KEYS.SUBSCRIPTIONS) {
    window.dispatchEvent(new Event("vasthusilpy_subscription_update"));
  }
  if (!targetKey || targetKey === SYNC_KEYS.IMPORTANT_SITES) {
    window.dispatchEvent(new Event("vasthusilpy_important_sites_updated"));
  }
  if (!targetKey || targetKey === SYNC_KEYS.ONLINE_APPLICATIONS) {
    window.dispatchEvent(new Event("vasthusilpy_online_applications_updated"));
  }
}

/**
 * Safely parse JSON from localStorage
 */
function readLocalList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn(`[CloudSync] Error reading local key ${key}:`, e);
  }
  return [];
}

/**
 * Safely write JSON to localStorage without triggering local echo
 */
function writeLocalList(key: string, list: any[]) {
  try {
    const serialized = JSON.stringify(list);
    const existing = localStorage.getItem(key);
    if (existing === serialized) return false; // No changes
    localStorage.setItem(key, serialized);

    // If CAD files are updated, regenerate and store metadata index immediately
    if (key === SYNC_KEYS.CAD_FILES && Array.isArray(list)) {
      try {
        const metadataIndex = list.map((file: any) => ({
          id: file.id,
          name: file.name || "Untitled_File",
          title: file.title || file.name || "Untitled File",
          folderId: file.folderId || "folder-deepak",
          folderPath: file.folderPath || "/DEEPAK",
          projectCode: file.projectCode || "",
          projectName: file.projectName || file.ownerName || "",
          ownerName: file.ownerName || file.clientName || "",
          clientName: file.ownerName || file.clientName || "",
          mobileNo: file.mobileNo || file.clientPhone || "",
          clientPhone: file.mobileNo || file.clientPhone || "",
          facing: file.facing || "",
          bedrooms: file.bedrooms || "",
          floors: file.floors || "",
          vasthuChuttu: file.vasthuChuttu || "",
          category: file.category || "PLAN",
          fileType: file.fileType || "DWG",
          fileSize: file.fileSize || 0,
          keywords: file.keywords || [],
          attachmentCount: file.attachments?.length || 0,
          hasDwgAttachment: (file.attachments || []).some((a: any) => a.isDwgOrDxf || (a.name && a.name.toLowerCase().endsWith(".dwg"))),
          hasPdfAttachment: (file.attachments || []).some((a: any) => a.isPdf || (a.name && a.name.toLowerCase().endsWith(".pdf"))),
          hasImageAttachment: (file.attachments || []).some((a: any) => a.isImage || (a.name && /\.(png|jpe?g|webp|svg)$/i.test(a.name))),
          hasCadVector: Boolean(file.drawingData && file.drawingData.entities && file.drawingData.entities.length > 0),
          isStarred: Boolean(file.isStarred),
          isShared: Boolean(file.shareSettings?.isShared),
          googleDriveSyncedAt: file.googleDriveSyncedAt,
          createdAt: file.createdAt || new Date().toISOString(),
          updatedAt: file.updatedAt || new Date().toISOString()
        }));
        localStorage.setItem("vasthusilpy_cad_metadata_index_v3", JSON.stringify(metadataIndex));
      } catch (idxErr) {
        console.warn("[CloudSync] Error generating metadata index:", idxErr);
      }
    }
    return true;
  } catch (e) {
    console.warn(`[CloudSync] Error writing local key ${key}:`, e);
    return false;
  }
}

/**
 * Directly pushes a single record to Cloud Firestore and Cloud Server API
 */
export async function cloudSyncRecord(collectionName: string, id: string, data: any): Promise<void> {
  if (!id || !data) return;
  const cleanId = String(id).trim();
  markLocalWrite(`${collectionName}_${cleanId}`);

  // 1. Write to Firestore in real time
  if (db) {
    try {
      const sanitized = sanitizeForFirestore({ ...data, id: cleanId, _syncedAt: new Date().toISOString() });
      await setDoc(doc(db, collectionName, cleanId), sanitized, { merge: true });
    } catch (fsErr) {
      console.warn(`[CloudSync] Firestore save error for ${collectionName}/${cleanId}:`, fsErr);
    }
  }

  // 2. Mirror to Cloud Server backend API
  try {
    fetch("/api/cloud-sync/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection: collectionName, id: cleanId, data })
    }).catch(() => {});
  } catch {}
}

/**
 * Directly deletes a single record from Cloud Firestore and Cloud Server API
 */
export async function cloudDeleteRecord(collectionName: string, id: string): Promise<void> {
  if (!id) return;
  const cleanId = String(id).trim();
  markLocalWrite(`${collectionName}_${cleanId}`);

  // 1. Delete from Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, collectionName, cleanId));
    } catch (fsErr) {
      console.warn(`[CloudSync] Firestore delete error for ${collectionName}/${cleanId}:`, fsErr);
    }
  }

  // 2. Delete on Cloud Server
  try {
    fetch(`/api/cloud-sync/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection: collectionName, id: cleanId, deleted: true })
    }).catch(() => {});
  } catch {}
}

/**
 * Pushes a batch or list of records to Cloud Firestore
 */
export async function cloudSyncBatch(collectionName: string, items: any[]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;
  markLocalWrite(collectionName);

  // 1. Firestore Cloud Sync
  if (db) {
    try {
      // Chunk into batches of up to 25 to respect Firestore limits
      const chunks: any[][] = [];
      for (let i = 0; i < items.length; i += 25) {
        chunks.push(items.slice(i, i + 25));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        for (const item of chunk) {
          if (item && item.id) {
            const docRef = doc(db, collectionName, String(item.id).trim());
            const sanitized = sanitizeForFirestore({ ...item, _syncedAt: new Date().toISOString() });
            batch.set(docRef, sanitized, { merge: true });
          }
        }
        await batch.commit().catch(async (batchErr) => {
          // Fallback to individual setDoc if batch fails
          for (const item of chunk) {
            if (item && item.id) {
              await setDoc(doc(db, collectionName, String(item.id).trim()), sanitizeForFirestore(item), { merge: true }).catch(() => {});
            }
          }
        });
      }
    } catch (err) {
      console.warn(`[CloudSync] Batch Firestore sync warning for ${collectionName}:`, err);
    }
  }

  // 2. Cloud Server backend bulk sync
  try {
    fetch("/api/cloud-sync/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection: collectionName, items })
    }).catch(() => {});
  } catch {}
}

/**
 * Master Realtime Cloud Synchronization Engine
 * Connects Firestore onSnapshot listeners + Server SSE stream to achieve instant zero-delay sync across all browsers and computers
 */
let isInitialized = false;
let activeUnsubscribers: (() => void)[] = [];
let sseSource: EventSource | null = null;

export function initializeCloudRealtimeSync(): () => void {
  if (isInitialized) {
    return () => {};
  }
  isInitialized = true;

  console.log("[CloudSync] Initializing Universal Realtime Cloud AutoSync Engine...");

  // Collections mapping to local keys
  const syncMap: { collection: string; storageKey: string; idKey?: string }[] = [
    { collection: "projects", storageKey: SYNC_KEYS.PROJECTS },
    { collection: "invoices", storageKey: SYNC_KEYS.INVOICES },
    { collection: "estimates", storageKey: SYNC_KEYS.ESTIMATES },
    { collection: "customers", storageKey: SYNC_KEYS.CUSTOMERS },
    { collection: "rate_items", storageKey: SYNC_KEYS.RATE_ITEMS },
    { collection: "cad_folders", storageKey: SYNC_KEYS.CAD_FOLDERS },
    { collection: "cad_files", storageKey: SYNC_KEYS.CAD_FILES },
    { collection: "important_sites", storageKey: SYNC_KEYS.IMPORTANT_SITES },
    { collection: "online_applications", storageKey: SYNC_KEYS.ONLINE_APPLICATIONS },
    { collection: "construction_agreements", storageKey: SYNC_KEYS.CONSTRUCTION_AGREEMENTS },
    { collection: "subscription_requests", storageKey: SYNC_KEYS.SUBSCRIPTIONS }
  ];

  // 1. Attach Real-Time Firestore onSnapshot Listeners for each collection
  if (db) {
    syncMap.forEach(({ collection: colName, storageKey }) => {
      try {
        const unsub = onSnapshot(
          collection(db, colName),
          (snapshot) => {
            if (snapshot.metadata.hasPendingWrites) {
              // Local echo, already applied
              return;
            }

            if (!snapshot.empty) {
              const remoteDocs: any[] = [];
              snapshot.forEach((d) => {
                const data = d.data();
                if (data && (data.id || d.id)) {
                  remoteDocs.push({ ...data, id: data.id || d.id });
                }
              });

              if (remoteDocs.length > 0) {
                // Read existing local list to merge or replace
                const localList = readLocalList<any>(storageKey);
                const localMap = new Map<string, any>(localList.map((item) => [String(item.id), item]));

                // Update with remote docs
                remoteDocs.forEach((r) => {
                  localMap.set(String(r.id), r);
                });

                // Also check if remote snapshot contains the full collection; if snapshot has documents, update
                const merged = Array.from(localMap.values());
                const changed = writeLocalList(storageKey, merged);

                if (changed) {
                  localStorage.setItem(SYNC_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());
                  dispatchAllSyncEvents(storageKey);
                  broadcastMessage({ type: "CLOUD_AUTOSYNC_APPLIED", data: { collection: colName, count: merged.length } });
                }
              }
            }
          },
          (err) => {
            console.warn(`[CloudSync] Snapshot listener warning for ${colName}:`, err?.message || err);
          }
        );

        activeUnsubscribers.push(unsub);
      } catch (err) {
        console.warn(`[CloudSync] Error attaching listener to ${colName}:`, err);
      }
    });
  }

  // 2. Connect to Server-Sent Events (SSE) stream on Cloud Run backend
  try {
    if (typeof EventSource !== "undefined") {
      sseSource = new EventSource("/api/cloud-sync/events");

      sseSource.onopen = () => {
        console.log("[CloudSync] Connected to Cloud Server Live SSE Stream.");
        localStorage.setItem(SYNC_KEYS.CLOUD_SYNC_STATUS, "connected");
      };

      sseSource.onmessage = (e) => {
        try {
          if (!e.data) return;
          const payload = JSON.parse(e.data);
          if (payload && payload.collection) {
            const targetMap = syncMap.find((m) => m.collection === payload.collection);
            if (targetMap) {
              if (payload.items && Array.isArray(payload.items)) {
                writeLocalList(targetMap.storageKey, payload.items);
                dispatchAllSyncEvents(targetMap.storageKey);
              } else if (payload.item && payload.item.id) {
                const current = readLocalList<any>(targetMap.storageKey);
                const filtered = current.filter((x) => String(x.id) !== String(payload.item.id));
                if (!payload.deleted) {
                  filtered.push(payload.item);
                }
                writeLocalList(targetMap.storageKey, filtered);
                dispatchAllSyncEvents(targetMap.storageKey);
              }
            }
          }
        } catch (parseErr) {
          // Non-JSON ping
        }
      };

      sseSource.onerror = () => {
        localStorage.setItem(SYNC_KEYS.CLOUD_SYNC_STATUS, "reconnecting");
      };
    }
  } catch (sseErr) {
    console.warn("[CloudSync] SSE connection notice:", sseErr);
  }

  // 3. Initial Cloud Hydration: Fetch full latest state immediately
  pullFullCloudDatabaseState();

  // 4. Return cleanup function
  return () => {
    activeUnsubscribers.forEach((u) => u());
    activeUnsubscribers = [];
    if (sseSource) {
      sseSource.close();
      sseSource = null;
    }
    isInitialized = false;
  };
}

/**
 * Pulls all records from Cloud Server & Firestore to hydrate any newly opened browser or computer immediately
 */
export async function pullFullCloudDatabaseState(): Promise<boolean> {
  let hasHydrated = false;

  // 1. Try pulling from Cloud Server
  try {
    const res = await fetch("/api/cloud-sync/pull");
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.store) {
        const store = data.store;

        if (Array.isArray(store.projects) && store.projects.length > 0) {
          writeLocalList(SYNC_KEYS.PROJECTS, store.projects);
          hasHydrated = true;
        }
        if (Array.isArray(store.invoices) && store.invoices.length > 0) {
          writeLocalList(SYNC_KEYS.INVOICES, store.invoices);
          hasHydrated = true;
        }
        if (Array.isArray(store.estimates) && store.estimates.length > 0) {
          writeLocalList(SYNC_KEYS.ESTIMATES, store.estimates);
          hasHydrated = true;
        }
        if (Array.isArray(store.customers) && store.customers.length > 0) {
          writeLocalList(SYNC_KEYS.CUSTOMERS, store.customers);
          hasHydrated = true;
        }
        if (Array.isArray(store.rateItems) && store.rateItems.length > 0) {
          writeLocalList(SYNC_KEYS.RATE_ITEMS, store.rateItems);
          hasHydrated = true;
        }
        if (Array.isArray(store.cadFolders) && store.cadFolders.length > 0) {
          writeLocalList(SYNC_KEYS.CAD_FOLDERS, store.cadFolders);
          hasHydrated = true;
        }
        if (Array.isArray(store.cadFiles) && store.cadFiles.length > 0) {
          writeLocalList(SYNC_KEYS.CAD_FILES, store.cadFiles);
          hasHydrated = true;
        }
        if (Array.isArray(store.importantSites) && store.importantSites.length > 0) {
          writeLocalList(SYNC_KEYS.IMPORTANT_SITES, store.importantSites);
          hasHydrated = true;
        }
        if (Array.isArray(store.onlineApplications) && store.onlineApplications.length > 0) {
          writeLocalList(SYNC_KEYS.ONLINE_APPLICATIONS, store.onlineApplications);
          hasHydrated = true;
        }

        if (hasHydrated) {
          localStorage.setItem(SYNC_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());
          dispatchAllSyncEvents();
        }
      }
    }
  } catch (err) {
    console.warn("[CloudSync] Server pull notice:", err);
  }

  // 2. Also perform initial snapshot query from Firestore for any items not yet locally present
  if (db) {
    const fetchFirestoreCollection = async (colName: string, localKey: string) => {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const list: any[] = [];
          snap.forEach((d) => {
            const item = d.data();
            if (item) list.push({ ...item, id: item.id || d.id });
          });
          if (list.length > 0) {
            const local = readLocalList<any>(localKey);
            const localMap = new Map<string, any>(local.map((i) => [String(i.id), i]));
            list.forEach((i) => localMap.set(String(i.id), i));
            writeLocalList(localKey, Array.from(localMap.values()));
            hasHydrated = true;
          }
        }
      } catch {}
    };

    await Promise.all([
      fetchFirestoreCollection("projects", SYNC_KEYS.PROJECTS),
      fetchFirestoreCollection("invoices", SYNC_KEYS.INVOICES),
      fetchFirestoreCollection("estimates", SYNC_KEYS.ESTIMATES),
      fetchFirestoreCollection("customers", SYNC_KEYS.CUSTOMERS),
      fetchFirestoreCollection("rate_items", SYNC_KEYS.RATE_ITEMS),
      fetchFirestoreCollection("cad_folders", SYNC_KEYS.CAD_FOLDERS),
      fetchFirestoreCollection("cad_files", SYNC_KEYS.CAD_FILES),
      fetchFirestoreCollection("important_sites", SYNC_KEYS.IMPORTANT_SITES),
      fetchFirestoreCollection("online_applications", SYNC_KEYS.ONLINE_APPLICATIONS)
    ]);

    if (hasHydrated) {
      dispatchAllSyncEvents();
    }
  }

  return hasHydrated;
}
