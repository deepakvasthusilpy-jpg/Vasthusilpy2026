import { db } from "../lib/firebase";
import { doc, onSnapshot, collection, setDoc } from "firebase/firestore";
import { broadcastMessage, getBroadcastChannel } from "./broadcastSync";

export const GLOBAL_DELETED_STORAGE_KEY = "vasthusilpy_global_deleted_ids_v1";

// Universal hardcoded list of demo IDs that must never be resurrected
export const PERMANENT_DEMO_TOMBSTONES = [
  // Demo online applicants
  "app_ramachandran_01",
  "app_asharaf_02",
  "app_sunitha_03",
  "app_george_04",
  "app_anoop_05",
  // Demo estimates
  "EST-2026-003",
  // Demo valuations
  "VAL-2026-003",
  // Demo invoices
  "inv_1",
  "inv_2",
  "inv_demo_1",
  "inv_demo_2",
  "inv_demo_3",
  // Demo crm projects
  "crm_proj_1",
  "crm_proj_2",
  "crm_proj_3",
  "crm_proj_4",
  "crm_proj_5",
  // Demo construction projects & agreements
  "PRJ-2026-001",
  "PRJ-2026-002",
  "CW-2026-00001",
  "CW-2026-00002"
];

// In-memory cache for ultra-fast instantaneous lookups
let cachedDeletedIdsSet: Set<string> | null = null;

/**
 * Loads all globally deleted IDs from localStorage merged with permanent tombstones
 */
export function getGlobalDeletedIds(): string[] {
  if (cachedDeletedIdsSet) {
    return Array.from(cachedDeletedIdsSet);
  }

  const set = new Set<string>(PERMANENT_DEMO_TOMBSTONES);

  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(GLOBAL_DELETED_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => {
          if (typeof id === "string" && id.trim()) {
            set.add(id.trim());
          }
        });
      }
    }
  } catch (e) {
    console.warn("[DeletionRegistry] Error reading deleted IDs:", e);
  }

  cachedDeletedIdsSet = set;
  return Array.from(set);
}

/**
 * Checks whether a specific record ID has been permanently deleted
 */
export function isRecordDeleted(id?: string | null): boolean {
  if (!id) return false;
  const cleanId = String(id).trim();
  if (!cleanId) return false;

  if (!cachedDeletedIdsSet) {
    getGlobalDeletedIds();
  }

  return cachedDeletedIdsSet?.has(cleanId) ?? false;
}

/**
 * Filters out all deleted and demo-tombstoned items from any array of records
 */
export function filterOutDeletedRecords<T extends { id?: string; clientName?: string; applicantName?: string }>(
  items: T[]
): T[] {
  if (!Array.isArray(items)) return [];
  const deleted = getGlobalDeletedIds();
  const set = new Set(deleted);

  return items.filter((item) => {
    if (!item || !item.id) return false;
    if (set.has(item.id)) return false;

    // Check client name for purged demo clients
    const client = (item.clientName || item.applicantName || "").toLowerCase();
    if (
      client.includes("rameshan") ||
      client.includes("anitha kumar") ||
      client.includes("ramachandran") ||
      client.includes("asharaf") ||
      client.includes("ussainar")
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Records a permanent deletion: updates local storage, notifies all open browser tabs
 * via BroadcastChannel & DOM events, syncs to server and stores tombstone in Firestore.
 */
export function recordGlobalDeletion(id: string, collectionName: string = "general"): void {
  if (!id || typeof id !== "string") return;
  const cleanId = id.trim();
  if (!cleanId) return;

  if (!cachedDeletedIdsSet) {
    getGlobalDeletedIds();
  }
  cachedDeletedIdsSet?.add(cleanId);

  // 1. Save to local storage
  try {
    if (typeof localStorage !== "undefined") {
      const currentList = Array.from(cachedDeletedIdsSet || []);
      localStorage.setItem(GLOBAL_DELETED_STORAGE_KEY, JSON.stringify(currentList));
    }
  } catch (e) {
    console.warn("[DeletionRegistry] Failed to save deleted ID to localStorage:", e);
  }

  // 2. Broadcast immediately across all browser tabs with 0ms latency
  broadcastMessage({
    type: "RECORD_DELETED",
    data: { id: cleanId, collection: collectionName }
  });

  // 3. Dispatch in-window event for local reactive components
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("vasthusilpy_record_deleted", {
        detail: { id: cleanId, collection: collectionName }
      })
    );
  }

  // 4. Record tombstone in Firestore so any other device or future login knows it's deleted
  if (db) {
    setDoc(doc(db, "deleted_records", cleanId), {
      id: cleanId,
      collection: collectionName,
      deletedAt: new Date().toISOString()
    }).catch(() => {});
  }

  // 5. Send to Server backend
  if (typeof fetch !== "undefined") {
    fetch("/api/sync/deletions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cleanId, collection: collectionName })
    }).catch(() => {});
  }
}

/**
 * Subscribes to real-time deletion events across tabs, windows, and Firestore
 */
export function subscribeToGlobalDeletions(
  onDeleted: (deletedId: string, collectionName?: string) => void
): () => void {
  const handleLocalEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom?.detail?.id) {
      onDeleted(custom.detail.id, custom.detail.collection);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === GLOBAL_DELETED_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          parsed.forEach((id) => {
            if (typeof id === "string") {
              cachedDeletedIdsSet?.add(id);
              onDeleted(id);
            }
          });
        }
      } catch {}
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("vasthusilpy_record_deleted", handleLocalEvent);
    window.addEventListener("storage", handleStorage);
  }

  // BroadcastChannel listener
  const bc = getBroadcastChannel();
  const handleBroadcast = (event: MessageEvent) => {
    if (event?.data?.type === "RECORD_DELETED" && event.data.data?.id) {
      const id = event.data.data.id;
      if (!cachedDeletedIdsSet) getGlobalDeletedIds();
      cachedDeletedIdsSet?.add(id);
      onDeleted(id, event.data.data.collection);
    }
  };
  if (bc) {
    bc.addEventListener("message", handleBroadcast);
  }

  // Firestore real-time onSnapshot listener for tombstones
  let unsubFirestore = () => {};
  if (db) {
    try {
      unsubFirestore = onSnapshot(
        collection(db, "deleted_records"),
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              const data = change.doc.data();
              const id = data?.id || change.doc.id;
              if (id) {
                if (!cachedDeletedIdsSet) getGlobalDeletedIds();
                cachedDeletedIdsSet?.add(id);
                onDeleted(id, data?.collection);
              }
            }
          });
        },
        () => {}
      );
    } catch {}
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("vasthusilpy_record_deleted", handleLocalEvent);
      window.removeEventListener("storage", handleStorage);
    }
    if (bc) {
      bc.removeEventListener("message", handleBroadcast);
    }
    unsubFirestore();
  };
}
