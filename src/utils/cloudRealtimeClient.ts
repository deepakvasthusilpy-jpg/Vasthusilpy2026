import {
  recordGlobalDeletion,
  filterOutDeletedRecords,
  isRecordDeleted,
  getGlobalDeletedIds
} from "./deletionRegistry";
import { broadcastMessage, getBroadcastChannel } from "./broadcastSync";
import { pullAndHydrateWebDataFromServer } from "./webDataSyncManager";

let isClientInitialized = false;
let sseConnection: EventSource | null = null;
let reconnectTimer: any = null;

export interface CollectionConfig {
  storageKeys: string[];
  events: string[];
}

const COLLECTION_STORAGE_MAP: Record<string, CollectionConfig> = {
  // CRM & Work Orders
  crm_projects: {
    storageKeys: ["vasthusilpy_crm_projects", "vasthusilpy_projects"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_projects_updated", "vasthusilpy_crm_updated"]
  },
  projects: {
    storageKeys: ["vasthusilpy_crm_projects", "vasthusilpy_projects"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_projects_updated", "vasthusilpy_crm_updated"]
  },

  // Invoices & Payments
  crm_invoices: {
    storageKeys: ["vasthusilpy_crm_invoices", "vasthusilpy_invoices"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_invoices_updated"]
  },
  invoices: {
    storageKeys: ["vasthusilpy_invoices", "vasthusilpy_crm_invoices"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_invoices_updated"]
  },

  // Estimates & Cost Calculations
  estimates: {
    storageKeys: ["vasthusilpy_estimates"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_estimates_updated"]
  },

  // Quotations & Rate Schedule
  quotations: {
    storageKeys: ["vasthusilpy_quotations_v1", "vasthusilpy_quotations"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_quotations_updated"]
  },
  rate_items: {
    storageKeys: ["vasthusilpy_rate_items"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_rate_items_updated"]
  },

  // Customers & Client Directory
  customers: {
    storageKeys: ["vasthusilpy_customers"],
    events: ["vasthusilpy_storage_update", "vasthusilpy_customers_updated"]
  },

  // Construction Works Management
  construction_projects: {
    storageKeys: ["vasthusilpy_construction_projects_v1"],
    events: ["vasthusilpy_construction_projects_updated", "vasthusilpy_storage_update"]
  },
  construction_agreements: {
    storageKeys: ["vasthusilpy_construction_agreements_v1", "vasthusilpy_construction_agreements"],
    events: ["vasthusilpy_construction_agreements_updated", "vasthusilpy_storage_update"]
  },
  construction_settings: {
    storageKeys: ["vasthusilpy_construction_settings_v1"],
    events: ["vasthusilpy_construction_settings_updated", "vasthusilpy_storage_update"]
  },

  // Site Inspections & Field Reports
  site_inspections: {
    storageKeys: ["vasthusilpy_site_inspections_v1", "vasthusilpy_inspections"],
    events: ["vasthusilpy_site_inspections_updated", "vasthusilpy_storage_update"]
  },
  inspection_templates: {
    storageKeys: ["vasthusilpy_site_inspection_templates_v1"],
    events: ["vasthusilpy_inspection_templates_updated", "vasthusilpy_storage_update"]
  },

  // Building Plans & Drafting Projects
  building_plans: {
    storageKeys: ["vasthusilpy_building_plan_projects_master_v1", "VAS_BUILDING_PLAN_PROJECTS_LIST"],
    events: ["vasthusilpy_building_plans_updated", "vasthusilpy_storage_update"]
  },
  building_plan_projects: {
    storageKeys: ["vasthusilpy_building_plan_projects_master_v1", "VAS_BUILDING_PLAN_PROJECTS_LIST"],
    events: ["vasthusilpy_building_plans_updated", "vasthusilpy_storage_update"]
  },

  // CAD Vault Files & Folders
  cad_files: {
    storageKeys: ["vasthusilpy_cad_vault_files"],
    events: ["vasthusilpy_cad_vault_updated", "vasthusilpy_storage_update"]
  },
  cad_vault_files: {
    storageKeys: ["vasthusilpy_cad_vault_files"],
    events: ["vasthusilpy_cad_vault_updated", "vasthusilpy_storage_update"]
  },
  cad_vault_folders: {
    storageKeys: ["vasthusilpy_cad_vault_folders"],
    events: ["vasthusilpy_cad_vault_updated", "vasthusilpy_storage_update"]
  },

  // Online Applications & Valuation
  online_applications: {
    storageKeys: ["vasthusilpy_online_applications_v1", "vasthusilpy_online_applications"],
    events: ["vasthusilpy_online_applications_updated", "vasthusilpy_storage_update"]
  },
  valuations: {
    storageKeys: ["vasthusilpy_valuation_certificates_v1"],
    events: ["vasthusilpy_valuations_updated", "vasthusilpy_storage_update"]
  },
  application_entries: {
    storageKeys: ["vasthusilpy_application_entries_v1"],
    events: ["vasthusilpy_applications_updated", "vasthusilpy_storage_update"]
  },

  // Subscriptions & User Access
  subscription_requests: {
    storageKeys: ["vasthusilpy_subscription_requests_v1", "vasthusilpy_subscription_requests"],
    events: ["vasthusilpy_subscription_update", "vasthusilpy_storage_update"]
  },
  user_profiles: {
    storageKeys: ["vasthusilpy_user_profiles_v1"],
    events: ["vasthusilpy_user_profiles_updated", "vasthusilpy_storage_update"]
  },
  authorized_emails: {
    storageKeys: ["vasthusilpy_authorized_emails_v1"],
    events: ["vasthusilpy_authorized_emails_updated", "vasthusilpy_storage_update"]
  },

  // Important Sites & Folders
  important_sites: {
    storageKeys: ["vasthusilpy_important_sites_v1"],
    events: ["vasthusilpy_important_sites_updated", "vasthusilpy_storage_update"]
  },
  important_folders: {
    storageKeys: ["vasthusilpy_site_folders_v1", "vasthusilpy_important_folders_v1"],
    events: ["vasthusilpy_site_folders_updated", "vasthusilpy_storage_update"]
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

  // 3. Remove from all local storage keys immediately
  const config = COLLECTION_STORAGE_MAP[collectionName];
  if (config && typeof localStorage !== "undefined") {
    config.storageKeys.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((item: any) => item && (item.id !== id && item.fileNumber !== id));
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      } catch {}
    });

    config.events.forEach((eventName) => {
      window.dispatchEvent(new Event(eventName));
    });
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
    // Parallel pull from both sync endpoints
    const [cloudRes] = await Promise.all([
      fetch("/api/cloud-sync/pull").catch(() => null),
      pullAndHydrateWebDataFromServer().catch(() => null)
    ]);

    if (!cloudRes || !cloudRes.ok) return;

    const body = await cloudRes.json();
    if (!body?.success || !body?.data) return;

    const data = body.data;

    // First register all deleted tombstones from server
    if (Array.isArray(data.deleted_records)) {
      data.deleted_records.forEach((delId: string) => {
        recordGlobalDeletion(delId);
      });
    }

    // Reconcile each collection
    for (const [colName, cloudRecords] of Object.entries(data)) {
      if (colName === "deleted_records" || !Array.isArray(cloudRecords)) continue;

      const config = COLLECTION_STORAGE_MAP[colName];
      if (!config) continue;

      const filtered = filterOutDeletedRecords(cloudRecords);

      config.storageKeys.forEach((key) => {
        const raw = localStorage.getItem(key);
        let localRecords: any[] = [];
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) localRecords = filterOutDeletedRecords(parsed);
          } catch {}
        }

        const mergedMap = new Map<string, any>();
        filtered.forEach((r) => {
          const rId = r?.id || r?.fileNumber;
          if (rId && !isRecordDeleted(rId)) mergedMap.set(String(rId), r);
        });
        localRecords.forEach((r) => {
          const rId = r?.id || r?.fileNumber;
          if (rId && !isRecordDeleted(rId) && !mergedMap.has(String(rId))) {
            mergedMap.set(String(rId), r);
          }
        });

        const finalRecords = Array.from(mergedMap.values());
        try {
          localStorage.setItem(key, JSON.stringify(finalRecords));
        } catch {}
      });

      config.events.forEach((evName) => {
        window.dispatchEvent(new Event(evName));
      });
    }

    window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    window.dispatchEvent(new CustomEvent("vasthusilpy_realtime_cloud_sync", { detail: { timestamp: Date.now() } }));
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
      const handleIncomingSync = (payload: any) => {
        if (!payload || !payload.collection) return;

        const colName = payload.collection;
        const config = COLLECTION_STORAGE_MAP[colName];
        if (!config) return;

        const incoming = Array.isArray(payload.records) ? payload.records : (Array.isArray(payload.items) ? payload.items : []);
        const clean = filterOutDeletedRecords(incoming);

        config.storageKeys.forEach((key) => {
          try {
            localStorage.setItem(key, JSON.stringify(clean));
          } catch {}
        });

        config.events.forEach((eventName) => {
          window.dispatchEvent(new CustomEvent(eventName, { detail: clean }));
        });
        window.dispatchEvent(new Event("vasthusilpy_storage_update"));
        window.dispatchEvent(new CustomEvent("vasthusilpy_realtime_cloud_sync", { detail: { collection: colName, timestamp: Date.now() } }));

        // Broadcast to tabs on same browser
        broadcastMessage({
          type: "SYNC_" + colName.toUpperCase(),
          data: clean
        });
      };

      sseConnection.addEventListener("sync_update", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          handleIncomingSync(payload);
        } catch (err) {
          console.warn("[CloudSync] Error handling sync_update event:", err);
        }
      });

      sseConnection.addEventListener("web_data_sync", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          handleIncomingSync(payload);
        } catch (err) {
          console.warn("[CloudSync] Error handling web_data_sync event:", err);
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
            config.storageKeys.forEach((key) => {
              const raw = localStorage.getItem(key);
              if (raw) {
                try {
                  const parsed = JSON.parse(raw);
                  if (Array.isArray(parsed)) {
                    const filtered = parsed.filter((item: any) => item && (item.id !== id && item.fileNumber !== id));
                    localStorage.setItem(key, JSON.stringify(filtered));
                  }
                } catch {}
              }
            });

            config.events.forEach((evName) => {
              window.dispatchEvent(new Event(evName));
            });
          }

          window.dispatchEvent(new Event("vasthusilpy_storage_update"));
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
