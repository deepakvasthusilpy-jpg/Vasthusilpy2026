import {
  recordGlobalDeletion,
  filterOutDeletedRecords,
  isRecordDeleted,
  getGlobalDeletedIds
} from "./deletionRegistry";
import { broadcastMessage, getBroadcastChannel } from "./broadcastSync";

let isClientInitialized = false;
let sseConnection: EventSource | null = null;
let reconnectTimer: any = null;

const COLLECTION_STORAGE_MAP: Record<string, { storageKey: string; eventName: string }> = {
  online_applications: {
    storageKey: "vasthusilpy_online_applications_v1",
    eventName: "vasthusilpy_online_applications_updated"
  },
  crm_projects: {
    storageKey: "vasthusilpy_crm_projects",
    eventName: "vasthusilpy_storage_update"
  },
  crm_invoices: {
    storageKey: "vasthusilpy_crm_invoices",
    eventName: "vasthusilpy_storage_update"
  },
  estimates: {
    storageKey: "vasthusilpy_estimates",
    eventName: "vasthusilpy_storage_update"
  },
  valuations: {
    storageKey: "vasthusilpy_valuation_certificates_v1",
    eventName: "vasthusilpy_valuations_updated"
  },
  quotations: {
    storageKey: "vasthusilpy_quotations_v1",
    eventName: "vasthusilpy_storage_update"
  },
  rate_items: {
    storageKey: "vasthusilpy_rate_items",
    eventName: "vasthusilpy_storage_update"
  },
  customers: {
    storageKey: "vasthusilpy_customers",
    eventName: "vasthusilpy_storage_update"
  }
};

/**
 * Push an entity creation or update to the Cloud hosting backend
 */
export async function pushCloudSync(collectionName: string, records: any[]): Promise<boolean> {
  try {
    const cleanRecords = filterOutDeletedRecords(records);
    const res = await fetch("/api/cloud-sync/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collection: collectionName, records: cleanRecords })
    });
    return res.ok;
  } catch (err) {
    console.warn(`[CloudSync] Failed to push ${collectionName}:`, err);
    return false;
  }
}

/**
 * Permanently delete an entity across all devices & browsers via Cloud hosting
 */
export async function deleteCloudRecord(collectionName: string, id: string): Promise<boolean> {
  // 1. Local tombstone
  recordGlobalDeletion(id, collectionName);

  // 2. Broadcast across open tabs
  broadcastMessage({
    type: "RECORD_DELETED",
    data: { collection: collectionName, id }
  });

  // 3. Remove from localStorage immediately
  const config = COLLECTION_STORAGE_MAP[collectionName];
  if (config && typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(config.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((item: any) => item && item.id !== id);
          localStorage.setItem(config.storageKey, JSON.stringify(filtered));
          window.dispatchEvent(new CustomEvent(config.eventName, { detail: filtered }));
        }
      }
    } catch {}
  }

  // 4. Send to server deletion registry & cloud store
  try {
    const res = await fetch("/api/deletion-registry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, collection: collectionName })
    });
    return res.ok;
  } catch (err) {
    console.warn(`[CloudSync] Failed to register deletion for ${id}:`, err);
    return false;
  }
}

/**
 * Perform initial state reconciliation with cloud hosting
 */
export async function pullCloudSync(): Promise<void> {
  if (typeof window === "undefined" || typeof fetch === "undefined") return;

  try {
    const res = await fetch("/api/cloud-sync/pull");
    if (!res.ok) return;

    const body = await res.json();
    if (!body?.success || !body?.data) return;

    const data = body.data;

    // First register all deleted tombstones from server
    if (Array.isArray(data.deleted_records)) {
      data.deleted_records.forEach((delId: string) => {
        recordGlobalDeletion(delId);
      });
    }

    // Now reconcile each collection
    for (const [colName, cloudRecords] of Object.entries(data)) {
      if (colName === "deleted_records" || !Array.isArray(cloudRecords)) continue;

      const config = COLLECTION_STORAGE_MAP[colName];
      if (!config) continue;

      const filtered = filterOutDeletedRecords(cloudRecords);

      // Compare with local data - take the newer or merged set
      const raw = localStorage.getItem(config.storageKey);
      let localRecords: any[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localRecords = filterOutDeletedRecords(parsed);
        } catch {}
      }

      // Merge map by ID
      const mergedMap = new Map<string, any>();
      filtered.forEach((r) => {
        if (r?.id && !isRecordDeleted(r.id)) mergedMap.set(r.id, r);
      });
      localRecords.forEach((r) => {
        if (r?.id && !isRecordDeleted(r.id) && !mergedMap.has(r.id)) {
          mergedMap.set(r.id, r);
        }
      });

      const finalRecords = Array.from(mergedMap.values());
      localStorage.setItem(config.storageKey, JSON.stringify(finalRecords));

      // Trigger UI update
      window.dispatchEvent(new CustomEvent(config.eventName, { detail: finalRecords }));
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    }
  } catch (e) {
    console.warn("[CloudSync] Pull reconciliation error:", e);
  }
}

/**
 * Initialize real-time instantaneous cloud listener via Server-Sent Events (SSE)
 */
export function initCloudRealtimeSync() {
  if (isClientInitialized || typeof window === "undefined" || typeof EventSource === "undefined") {
    return;
  }
  isClientInitialized = true;

  // Initial pull from cloud hosting
  pullCloudSync();

  // Establish SSE stream
  function connectSSE() {
    try {
      if (sseConnection) {
        sseConnection.close();
      }

      sseConnection = new EventSource("/api/sync/events");

      sseConnection.addEventListener("connected", () => {
        console.log("[CloudSync] Real-time cloud sync connected.");
      });

      // Handle instantaneous updates from other computers / browsers / logins
      sseConnection.addEventListener("sync_update", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (!payload || !payload.collection) return;

          const colName = payload.collection;
          const config = COLLECTION_STORAGE_MAP[colName];
          if (!config) return;

          const incoming = Array.isArray(payload.records) ? payload.records : [];
          const clean = filterOutDeletedRecords(incoming);

          localStorage.setItem(config.storageKey, JSON.stringify(clean));

          // Notify React components in real time
          window.dispatchEvent(new CustomEvent(config.eventName, { detail: clean }));
          window.dispatchEvent(new Event("vasthusilpy_storage_update"));

          // Broadcast to tabs on same browser
          broadcastMessage({
            type: "SYNC_" + colName.toUpperCase(),
            data: clean
          });
        } catch (err) {
          console.warn("[CloudSync] Error handling sync_update event:", err);
        }
      });

      // Handle instantaneous deletions across all devices
      sseConnection.addEventListener("record_deleted", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          const { id, collection: colName } = payload || {};
          if (!id) return;

          recordGlobalDeletion(id, colName);

          const config = colName ? COLLECTION_STORAGE_MAP[colName] : null;
          if (config) {
            const raw = localStorage.getItem(config.storageKey);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                const filtered = parsed.filter((item: any) => item && item.id !== id);
                localStorage.setItem(config.storageKey, JSON.stringify(filtered));
                window.dispatchEvent(new CustomEvent(config.eventName, { detail: filtered }));
              }
            }
          }

          window.dispatchEvent(new Event("vasthusilpy_storage_update"));
          window.dispatchEvent(new Event("vasthusilpy_valuations_updated"));
        } catch (err) {
          console.warn("[CloudSync] Error handling record_deleted event:", err);
        }
      });

      sseConnection.onerror = () => {
        if (sseConnection) {
          sseConnection.close();
          sseConnection = null;
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectSSE, 3000);
      };
    } catch (e) {
      console.warn("[CloudSync] Failed to create EventSource:", e);
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectSSE, 5000);
    }
  }

  connectSSE();
}
