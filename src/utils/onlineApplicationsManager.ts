import { OnlineApplicantRecord, ApplicationDetailItem } from "../types";
import { INITIAL_ONLINE_APPLICANTS } from "../data/onlineApplicationsData";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, getDocs } from "firebase/firestore";
import { safeSetDoc } from "./storageManager";
import { broadcastMessage } from "./broadcastSync";

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
    const raw = localStorage.getItem(ONLINE_APP_STORAGE_KEYS.PORTAL_TYPES);
    let list: StoredPortalOption[] = raw ? JSON.parse(raw) : [];

    // Ensure all default portals exist
    const map = new Map<string, StoredPortalOption>();
    DEFAULT_PORTAL_OPTIONS.forEach((p) => map.set(p.name.toLowerCase().trim(), p));
    if (Array.isArray(list)) {
      list.forEach((p) => {
        if (p && p.name) map.set(p.name.toLowerCase().trim(), p);
      });
    }

    // Also harvest any portal names from existing applicants
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

    const result = Array.from(map.values());
    return result;
  } catch (e) {
    console.warn("Failed reading stored portals", e);
    return DEFAULT_PORTAL_OPTIONS;
  }
}

export function saveStoredPortals(portals: StoredPortalOption[]): void {
  try {
    localStorage.setItem(ONLINE_APP_STORAGE_KEYS.PORTAL_TYPES, JSON.stringify(portals));
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
  try {
    const raw = localStorage.getItem(ONLINE_APP_STORAGE_KEYS.DELETED_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed reading deleted applicant IDs", e);
  }
  return [];
}

export function addDeletedOnlineAppId(id: string): void {
  try {
    const current = getDeletedOnlineAppIds();
    if (!current.includes(id)) {
      localStorage.setItem(ONLINE_APP_STORAGE_KEYS.DELETED_IDS, JSON.stringify([...current, id]));
    }
  } catch (e) {
    console.warn("Failed recording deleted applicant ID", e);
  }
}

export const DEMO_APPLICANT_IDS = [
  "app_ramachandran_01",
  "app_asharaf_02",
  "app_sunitha_03",
  "app_george_04",
  "app_anoop_05"
];

/**
 * Load online applicants from localStorage or fallback to defaults
 */
export function loadOnlineApplicants(): OnlineApplicantRecord[] {
  try {
    const deletedIds = getDeletedOnlineAppIds();
    const raw = localStorage.getItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS);

    if (raw) {
      const parsed: OnlineApplicantRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(
          (item) => item && item.id && !deletedIds.includes(item.id) && !DEMO_APPLICANT_IDS.includes(item.id)
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }

    localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify([]));
    localStorage.setItem(ONLINE_APP_STORAGE_KEYS.INITIALIZED, "true");
    return [];
  } catch (e) {
    console.error("Failed loading online applicants from storage", e);
  }
  return [];
}

/**
 * Save online applicants to localStorage and optional Cloud Firestore
 */
export function saveOnlineApplicants(records: OnlineApplicantRecord[], syncToCloud = true): void {
  try {
    const deletedIds = getDeletedOnlineAppIds();
    const cleanRecords = (records || []).filter((r) => r && r.id && !deletedIds.includes(r.id));

    localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(cleanRecords));
    localStorage.setItem(ONLINE_APP_STORAGE_KEYS.INITIALIZED, "true");

    broadcastMessage({
      type: "SYNC_ONLINE_APPLICATIONS",
      data: cleanRecords
    });

    if (syncToCloud && db) {
      cleanRecords.forEach((record) => {
        if (record && record.id) {
          safeSetDoc(doc(db, "online_applications", record.id), record, { merge: true }).catch((err) => {
            console.warn("Firestore online_applications save error:", err);
          });
        }
      });
    }
  } catch (e) {
    console.error("Failed saving online applicants", e);
  }
}

/**
 * Add or update an online applicant
 */
export function upsertOnlineApplicant(record: OnlineApplicantRecord): OnlineApplicantRecord[] {
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
 * Delete an applicant record
 */
export function deleteOnlineApplicant(idToDelete: string): OnlineApplicantRecord[] {
  addDeletedOnlineAppId(idToDelete);
  const current = loadOnlineApplicants();
  const updated = current.filter((r) => r.id !== idToDelete);
  saveOnlineApplicants(updated, false);

  if (db) {
    deleteDoc(doc(db, "online_applications", idToDelete)).catch((err) => {
      console.warn("Firestore delete online_applications error:", err);
    });
  }

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

  // Calculate totals from individual applications if present
  let totalBill = 0;
  let totalPaid = 0;
  updatedApps.forEach((a) => {
    totalBill += a.billAmount || 0;
    totalPaid += a.paidAmount || 0;
  });

  // Fallback to applicant bill if no app bills are defined
  if (totalBill === 0 && target.billAmount > 0) {
    totalBill = target.billAmount;
    totalPaid = Math.max(0, (target.paidAmount || 0) + amountReceived);
  }

  const isFullyPaid = totalBill > 0 && totalPaid >= totalBill;

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
  const isFullyPaid = target.billAmount > 0 && newPaidAmount >= target.billAmount;

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
  // If applications exist with bill amounts, verify them
  if (applicant.applications && applicant.applications.length > 0) {
    const hasAppBills = applicant.applications.some((a) => (a.billAmount || 0) > 0);
    if (hasAppBills) {
      const allAppsPaid = applicant.applications.every(
        (a) => (a.billAmount || 0) <= (a.paidAmount || 0)
      );
      if (allAppsPaid) return true;
    }
  }

  // Fallback to top-level bill and paid amounts
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
 * Real-time listener for Firestore collection
 */
export function subscribeToOnlineApplicants(
  onUpdate: (applicants: OnlineApplicantRecord[]) => void
): () => void {
  if (!db) {
    onUpdate(loadOnlineApplicants());
    return () => {};
  }

  try {
    const q = collection(db, "online_applications");
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const deletedIds = getDeletedOnlineAppIds();
          const cloudApplicants: OnlineApplicantRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as OnlineApplicantRecord;
            if (data && data.id && !deletedIds.includes(data.id)) {
              cloudApplicants.push(data);
            }
          });

          if (cloudApplicants.length > 0) {
            cloudApplicants.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
            localStorage.setItem(ONLINE_APP_STORAGE_KEYS.APPLICANTS, JSON.stringify(cloudApplicants));
            onUpdate(cloudApplicants);
            return;
          }
        }
        onUpdate(loadOnlineApplicants());
      },
      (error) => {
        console.warn("Firestore snapshot error for online_applications:", error);
        onUpdate(loadOnlineApplicants());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Failed subscribing to online_applications:", err);
    onUpdate(loadOnlineApplicants());
    return () => {};
  }
}
