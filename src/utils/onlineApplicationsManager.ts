import { OnlineApplicantRecord, ApplicationDetailItem } from "../types";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { safeSetDoc } from "./storageManager";
import { broadcastMessage, getBroadcastChannel } from "./broadcastSync";
import {
  filterOutDeletedRecords,
  isRecordDeleted,
  recordGlobalDeletion,
  getGlobalDeletedIds,
  PERMANENT_DEMO_TOMBSTONES
} from "./deletionRegistry";

export const ONLINE_APP_STORAGE_KEYS = {
  APPLICANTS: "vasthusilpy_online_applications_v1",
  DELETED_IDS: "vasthusilpy_deleted_online_app_ids_v1",
  INITIALIZED: "vasthusilpy_online_applications_initialized_v1",
  PORTAL_TYPES: "vasthusilpy_stored_application_types_v1"
};

export interface StoredPortalOption {
  name: string;
  url?: string;
  category?: string;
}

export const DEFAULT_PORTAL_OPTIONS: StoredPortalOption[] = [
  { name: "POSSESSION CERTIFICATE", url: "", category: "70 Rs • USER ID" }
];

export function loadStoredPortals(): StoredPortalOption[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(ONLINE_APP_STORAGE_KEYS.PORTAL_TYPES) : null;
    let list: StoredPortalOption[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, StoredPortalOption>();
    DEFAULT_PORTAL_OPTIONS.forEach((p) => map.set(p.name.toLowerCase().trim(), p));
    if (Array.isArray(list)) {
      list.forEach((p) => {
        if (p && p.name) map.set(p.name.toLowerCase().trim(), p);
      });
    }

    const applicants = loadOnlineApplicants();
    applicants.forEach((applicant) => {
      (applicant.applications || []).forEach((app) => {
        if (app.portal && !map.has(app.portal.toLowerCase().trim())) {
          map.set(app.portal.toLowerCase().trim(), {
            name: app.portal.trim(),
            url: app.portalUrl || ""
          });
        }
      });
    });

    return Array.from(map.values());
  } catch (e) {
    console.warn("Failed reading stored portals", e);
    return DEFAULT_PORTAL_OPTIONS;
  }
}

export function saveStoredPortals(portals: StoredPortalOption[]): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ONLINE_APP_STORAGE_KEYS.PORTAL_TYPES, JSON.stringify(portals));
    }
  } catch (e) {
    console.warn("Failed saving stored portals", e);
  }
}

export function addStoredPortal(name: string, url?: string, category?: string): StoredPortalOption[] {
  const cleanName = name.trim();
  if (!cleanName) return loadStoredPortals();

  const current = loadStoredPortals();
  const exists = current.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
  if (exists) {
    if (url && !exists.url) {
      exists.url = url;
      saveStoredPortals(current);
    }
    return current;
  }

  const updated = [
    { name: cleanName, url: url || "", category: category || "Custom" },
    ...current
  ];
  saveStoredPortals(updated);
  return updated;
}

export function deleteStoredPortal(name: string): StoredPortalOption[] {
  const current = loadStoredPortals();
  const updated = current.filter((p) => p.name.toLowerCase() !== name.toLowerCase().trim());
  saveStoredPortals(updated);
  return updated;
}

export const DEFAULT_RECEIVER_UPI = "9567627277@SLC";
export const DEFAULT_BENEFICIARY_NAME = "VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS";

export function getDeletedOnlineAppIds(): string[] {
  return getGlobalDeletedIds();
}

export function addDeletedOnlineAppId(id: string): void {
  recordGlobalDeletion(id, "online_applications");
}

export const DEMO_APPLICANT_IDS = PERMANENT_DEMO_TOMBSTONES;

/**
 * Load online applicants from localStorage, strictly filtering out any deleted records
 */
export function loadOnlineApplicants(): OnlineApplicantRecord[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = filterOutDeletedRecords(parsed) as OnlineApplicantRecord[];
        if (cleaned.length !== parsed.length && typeof localStorage !== "undefined") {
          localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify([]));
      localStorage.setItem(ONLINE_APP_STORAGE_KEYS.INITIALIZED, "true");
    }
    return [];
  } catch (e) {
    console.error("Failed loading online applicants from storage", e);
    return [];
  }
}

/**
 * Save online applicants to localStorage, Firestore, and backend API with real-time broadcast
 */
export function saveOnlineApplicants(records: OnlineApplicantRecord[], syncToCloud = true): void {
  try {
    const cleanRecords = filterOutDeletedRecords(records || []) as OnlineApplicantRecord[];

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(cleanRecords));
      localStorage.setItem(ONLINE_APP_STORAGE_KEYS.INITIALIZED, "true");
    }

    // 1. In-tab reactive event
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("vasthusilpy_online_applications_updated", { detail: cleanRecords })
      );
      window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    }

    // 2. Cross-tab BroadcastChannel
    broadcastMessage({
      type: "SYNC_ONLINE_APPLICATIONS",
      data: cleanRecords
    });

    // 3. Online Cloud sync: Server API + Firestore
    if (syncToCloud) {
      // Server API sync (for multi-browser and non-Firebase logins)
      if (typeof fetch !== "undefined") {
        fetch("/api/online-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: cleanRecords })
        }).catch(() => {});
      }

      // Firestore Cloud sync
      if (db) {
        cleanRecords.forEach((record) => {
          if (record && record.id && !isRecordDeleted(record.id)) {
            safeSetDoc(doc(db, "online_applications", record.id), record, { merge: true }).catch((err) => {
              console.warn("Firestore online_applications save error:", err);
            });
          }
        });
      }
    }
  } catch (e) {
    console.error("Failed saving online applicants", e);
  }
}

/**
 * Add or update an online applicant
 */
export function upsertOnlineApplicant(record: OnlineApplicantRecord): OnlineApplicantRecord[] {
  if (isRecordDeleted(record.id)) return loadOnlineApplicants();

  const current = loadOnlineApplicants();
  const existingIdx = current.findIndex((r) => r.id === record.id);
  let updated: OnlineApplicantRecord[];

  const now = new Date().toISOString();
  const preparedRecord: OnlineApplicantRecord = {
    ...record,
    updatedAt: now,
    createdAt: record.createdAt || now
  };

  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = preparedRecord;
  } else {
    updated = [preparedRecord, ...current];
  }

  saveOnlineApplicants(updated, true);
  return updated;
}

/**
 * Permanently delete an applicant record across all tabs, logins, and databases
 */
export function deleteOnlineApplicant(idToDelete: string): OnlineApplicantRecord[] {
  recordGlobalDeletion(idToDelete, "online_applications");

  const current = loadOnlineApplicants();
  const updated = current.filter((r) => r.id !== idToDelete);

  // Save updated state without syncing deleted doc
  saveOnlineApplicants(updated, false);

  // Explicitly delete from server backend
  if (typeof fetch !== "undefined") {
    fetch(`/api/online-applications/${encodeURIComponent(idToDelete)}`, {
      method: "DELETE"
    }).catch(() => {});
  }

  // Explicitly delete from Firestore
  if (db) {
    deleteDoc(doc(db, "online_applications", idToDelete)).catch((err) => {
      console.warn("Firestore delete online_applications error:", err);
    });
  }

  // Broadcast deletion to all open tabs
  broadcastMessage({
    type: "ONLINE_APPLICANT_DELETED",
    data: { id: idToDelete }
  });

  return updated;
}

/**
 * Add a new application item to an applicant
 */
export function addApplicationToApplicant(
  applicantId: string,
  newApp: Omit<ApplicationDetailItem, "id">
): OnlineApplicantRecord[] {
  const current = loadOnlineApplicants();
  const target = current.find((r) => r.id === applicantId);
  if (!target) return current;

  const appItem: ApplicationDetailItem = {
    ...newApp,
    id: `app_entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };

  const updatedTarget: OnlineApplicantRecord = {
    ...target,
    applications: [...(target.applications || []), appItem],
    updatedAt: new Date().toISOString()
  };

  return upsertOnlineApplicant(updatedTarget);
}

/**
 * Update a specific application item within an applicant
 */
export function updateApplicationInApplicant(
  applicantId: string,
  updatedApp: ApplicationDetailItem
): OnlineApplicantRecord[] {
  const current = loadOnlineApplicants();
  const target = current.find((r) => r.id === applicantId);
  if (!target) return current;

  const updatedApps = (target.applications || []).map((app) =>
    app.id === updatedApp.id ? updatedApp : app
  );

  const updatedTarget: OnlineApplicantRecord = {
    ...target,
    applications: updatedApps,
    updatedAt: new Date().toISOString()
  };

  return upsertOnlineApplicant(updatedTarget);
}

/**
 * Delete a specific application item from an applicant
 */
export function deleteApplicationFromApplicant(
  applicantId: string,
  applicationId: string
): OnlineApplicantRecord[] {
  const current = loadOnlineApplicants();
  const target = current.find((r) => r.id === applicantId);
  if (!target) return current;

  const updatedApps = (target.applications || []).filter((app) => app.id !== applicationId);

  const updatedTarget: OnlineApplicantRecord = {
    ...target,
    applications: updatedApps,
    updatedAt: new Date().toISOString()
  };

  return upsertOnlineApplicant(updatedTarget);
}

/**
 * Record payment for a specific individual application item under an applicant
 */
export function recordApplicationPayment(
  applicantId: string,
  applicationId: string,
  amountReceived: number,
  mode: string = "UPI_QR",
  refNo?: string,
  note?: string
): OnlineApplicantRecord[] {
  const current = loadOnlineApplicants();
  const target = current.find((r) => r.id === applicantId);
  if (!target) return current;

  const nowStr = new Date().toISOString();
  const todayStr = nowStr.split("T")[0];

  const updatedApps = (target.applications || []).map((app) => {
    if (app.id !== applicationId) return app;
    const currentPaid = app.paidAmount || 0;
    const billAmt = app.billAmount || 0;
    const newAppPaid = Math.max(0, currentPaid + amountReceived);
    const newStatus: "PENDING" | "PARTIAL" | "PAID" =
      billAmt > 0 && newAppPaid >= billAmt
        ? "PAID"
        : newAppPaid > 0
        ? "PARTIAL"
        : "PENDING";

    const newPaymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: todayStr,
      amount: amountReceived,
      mode,
      refNo: refNo || `UPI/APP-${Date.now().toString().slice(-6)}`,
      note: note || `Payment for ${app.portal}`
    };

    return {
      ...app,
      paidAmount: newAppPaid,
      paymentStatus: newStatus,
      payments: [...(app.payments || []), newPaymentRecord]
    };
  });

  let totalBill = 0;
  let totalPaid = 0;
  updatedApps.forEach((a) => {
    totalBill += a.billAmount || 0;
    totalPaid += a.paidAmount || 0;
  });

  if (totalBill === 0 && target.billAmount > 0) {
    totalBill = target.billAmount;
    totalPaid = Math.max(0, (target.paidAmount || 0) + amountReceived);
  }

  const updatedTarget: OnlineApplicantRecord = {
    ...target,
    applications: updatedApps,
    billAmount: totalBill,
    paidAmount: totalPaid,
    paymentMode: mode,
    lastPaymentDate: todayStr,
    updatedAt: nowStr
  };

  return upsertOnlineApplicant(updatedTarget);
}

/**
 * Record a payment for an applicant (e.g. from UPI QR)
 */
export function recordApplicantPayment(
  applicantId: string,
  amountReceived: number,
  mode: string = "UPI_QR"
): OnlineApplicantRecord[] {
  const current = loadOnlineApplicants();
  const target = current.find((r) => r.id === applicantId);
  if (!target) return current;

  const newPaidAmount = Math.max(0, (target.paidAmount || 0) + amountReceived);

  const updatedTarget: OnlineApplicantRecord = {
    ...target,
    paidAmount: newPaidAmount,
    paymentMode: mode,
    lastPaymentDate: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString()
  };

  return upsertOnlineApplicant(updatedTarget);
}

/**
 * Check if applicant payment is completed
 */
export function isApplicantPaymentCompleted(applicant: OnlineApplicantRecord): boolean {
  if (!applicant) return false;
  if (applicant.applications && applicant.applications.length > 0) {
    const hasAppBills = applicant.applications.some((a) => (a.billAmount || 0) > 0);
    if (hasAppBills) {
      const allAppsPaid = applicant.applications.every(
        (a) => (a.billAmount || 0) <= (a.paidAmount || 0)
      );
      if (allAppsPaid) return true;
    }
  }

  if (applicant.billAmount > 0 && applicant.paidAmount >= applicant.billAmount) {
    return true;
  }
  if (applicant.status === "COMPLETED" && (applicant.billAmount <= 0 || applicant.paidAmount >= applicant.billAmount)) {
    return true;
  }
  return false;
}

/**
 * Generate UPI Payment Link for a specific application
 */
export function generateApplicationItemUpiUrl(
  applicant: OnlineApplicantRecord,
  appItem: ApplicationDetailItem,
  amount?: number,
  upiId: string = DEFAULT_RECEIVER_UPI,
  beneficiaryName: string = DEFAULT_BENEFICIARY_NAME
): string {
  const balance = Math.max(0, (appItem.billAmount || 0) - (appItem.paidAmount || 0));
  const finalAmount = amount !== undefined ? amount : balance > 0 ? balance : (appItem.billAmount || 0);
  const cleanNote = `${appItem.portal} Fee: ${applicant.applicantName} (${appItem.applicationNumber || ""})`.trim().slice(0, 50);

  const params = new URLSearchParams();
  params.append("pa", upiId);
  params.append("pn", beneficiaryName);
  if (finalAmount > 0) {
    params.append("am", finalAmount.toFixed(2));
  }
  params.append("cu", "INR");
  params.append("tn", cleanNote);

  return `upi://pay?${params.toString()}`;
}

/**
 * Generate UPI Payment Link
 */
export function generateApplicantUpiUrl(
  applicant: OnlineApplicantRecord,
  amount?: number,
  upiId: string = DEFAULT_RECEIVER_UPI,
  beneficiaryName: string = DEFAULT_BENEFICIARY_NAME
): string {
  const finalAmount = amount !== undefined ? amount : Math.max(0, applicant.billAmount - applicant.paidAmount);
  const appNotes = (applicant.applications || []).map((a) => a.portal).join(", ");
  const cleanNote = `Online App Fee: ${applicant.applicantName} ${appNotes ? `(${appNotes})` : ""}`.trim().slice(0, 50);

  const params = new URLSearchParams();
  params.append("pa", upiId);
  params.append("pn", beneficiaryName);
  if (finalAmount > 0) {
    params.append("am", finalAmount.toFixed(2));
  }
  params.append("cu", "INR");
  params.append("tn", cleanNote);

  return `upi://pay?${params.toString()}`;
}

/**
 * Universal Real-time subscriber for Online Applications:
 * Instantaneous sync across tabs (BroadcastChannel), windows (Events),
 * browsers & devices (SSE stream + Firestore real-time onSnapshot)
 */
export function subscribeToOnlineApplicants(
  onUpdate: (applicants: OnlineApplicantRecord[]) => void
): () => void {
  // Immediately supply current state
  onUpdate(loadOnlineApplicants());

  // 1. Cross-tab BroadcastChannel listener (0ms latency between tabs on same device)
  const bc = getBroadcastChannel();
  const handleBroadcast = (event: MessageEvent) => {
    if (event?.data?.type === "SYNC_ONLINE_APPLICATIONS" && Array.isArray(event.data.data)) {
      const clean = filterOutDeletedRecords(event.data.data) as OnlineApplicantRecord[];
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(clean));
      }
      onUpdate(clean);
    } else if (event?.data?.type === "ONLINE_APPLICANT_DELETED" && event.data.data?.id) {
      const deletedId = event.data.data.id;
      const current = loadOnlineApplicants();
      const filtered = current.filter((a) => a.id !== deletedId);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(filtered));
      }
      onUpdate(filtered);
    } else if (event?.data?.type === "RECORD_DELETED") {
      const deletedId = event.data.data?.id;
      if (deletedId) {
        const current = loadOnlineApplicants();
        const filtered = current.filter((a) => a.id !== deletedId);
        onUpdate(filtered);
      }
    }
  };

  if (bc) {
    bc.addEventListener("message", handleBroadcast);
  }

  // 2. In-window custom event listener
  const handleLocalUpdate = (e: Event) => {
    const custom = e as CustomEvent;
    if (Array.isArray(custom?.detail)) {
      onUpdate(custom.detail);
    } else {
      onUpdate(loadOnlineApplicants());
    }
  };

  // 3. Storage event listener (when another tab updates localStorage)
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === ONLINE_APP_STORAGE_KEYS.APPLICANTS) {
      onUpdate(loadOnlineApplicants());
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("vasthusilpy_online_applications_updated", handleLocalUpdate);
    window.addEventListener("storage", handleStorageEvent);
  }

  // 4. Server-Sent Events (SSE) listener for instantaneous sync across different browsers / computers
  let eventSource: EventSource | null = null;
  if (typeof window !== "undefined" && typeof EventSource !== "undefined") {
    try {
      eventSource = new EventSource("/api/sync/events");
      eventSource.addEventListener("sync_update", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload && (payload.collection === "online_applications" || payload.type === "FULL_SYNC")) {
            if (Array.isArray(payload.records)) {
              const clean = filterOutDeletedRecords(payload.records) as OnlineApplicantRecord[];
              if (typeof localStorage !== "undefined") {
                localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(clean));
              }
              onUpdate(clean);
            } else {
              onUpdate(loadOnlineApplicants());
            }
          }
        } catch {}
      });
      eventSource.addEventListener("record_deleted", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.id) {
            recordGlobalDeletion(payload.id, payload.collection);
            const current = loadOnlineApplicants();
            const filtered = current.filter((a) => a.id !== payload.id);
            onUpdate(filtered);
          }
        } catch {}
      });
    } catch (e) {
      console.warn("SSE connection for online applications failed:", e);
    }
  }

  // 5. Firestore real-time onSnapshot listener
  let unsubFirestore = () => {};
  if (db) {
    try {
      const q = collection(db, "online_applications");
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          const cloudApplicants: OnlineApplicantRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as OnlineApplicantRecord;
            if (data && data.id && !isRecordDeleted(data.id)) {
              cloudApplicants.push(data);
            }
          });

          cloudApplicants.sort(
            (a, b) =>
              new Date(b.updatedAt || b.createdAt).getTime() -
              new Date(a.updatedAt || a.createdAt).getTime()
          );

          if (typeof localStorage !== "undefined") {
            localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(cloudApplicants));
          }
          onUpdate(cloudApplicants);
        },
        (error) => {
          console.warn("Firestore snapshot notice for online_applications:", error);
        }
      );
    } catch (err) {
      console.warn("Failed subscribing to Firestore online_applications:", err);
    }
  }

  return () => {
    if (bc) {
      bc.removeEventListener("message", handleBroadcast);
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("vasthusilpy_online_applications_updated", handleLocalUpdate);
      window.removeEventListener("storage", handleStorageEvent);
    }
    if (eventSource) {
      eventSource.close();
    }
    unsubFirestore();
  };
}
