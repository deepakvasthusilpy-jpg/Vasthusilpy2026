import { broadcastMessage } from "./broadcastSync";
import { db } from "../lib/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { emailToDocId } from "../lib/firebase";
import { filterOutDeletedRecords, isRecordDeleted, getGlobalDeletedIds } from "./deletionRegistry";

export interface WebDataSyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  syncedCounts: {
    projects: number;
    invoices: number;
    estimates: number;
    customers: number;
    rateItems: number;
    cadFolders: number;
    cadFiles: number;
    userProfiles: number;
    subscriptionRequests: number;
  };
}

const LAST_SYNC_KEY = "vasthusilpy_last_web_data_sync_timestamp";

/**
 * Gets the last recorded sync timestamp from local storage
 */
export function getLastWebDataSyncTime(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

/**
 * Formats a friendly relative or localized time string
 */
export function formatSyncTimestamp(isoString: string | null): string {
  if (!isoString) return "Never synced";
  try {
    const date = new Date(isoString);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Unknown";
  }
}

/**
 * Safely reads and parses JSON from localStorage
 */
function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[WebDataSync] Error parsing local ${key}:`, e);
  }
  return fallback;
}

/**
 * Gathers all web application data from local storage
 */
export function collectLocalWebData() {
  const projects = filterOutDeletedRecords(readLocalJson("vasthusilpy_crm_projects", []));
  const invoices = filterOutDeletedRecords(readLocalJson("vasthusilpy_invoices", []));
  const estimates = filterOutDeletedRecords(readLocalJson("vasthusilpy_estimates", []));
  const customers = filterOutDeletedRecords(readLocalJson("vasthusilpy_customers", []));
  const rateItems = filterOutDeletedRecords(readLocalJson("vasthusilpy_rate_items", []));
  const cadFolders = filterOutDeletedRecords(readLocalJson("vasthusilpy_cad_folders_v3", []));
  const cadFiles = filterOutDeletedRecords(readLocalJson("vasthusilpy_cad_files_vault_v3", []));
  
  // Unify subscription requests from both primary and secondary keys
  const subsMain = readLocalJson<any[]>("vasthusilpy_subscription_requests", []);
  const subsV2 = readLocalJson<any[]>("vasthusilpy_subscription_requests_v2", []);
  const subMap = new Map<string, any>();
  subsV2.forEach((s) => s?.id && subMap.set(s.id, s));
  subsMain.forEach((s) => s?.id && subMap.set(s.id, s));
  const subscriptionRequests = Array.from(subMap.values());

  const applicationEntries = filterOutDeletedRecords(readLocalJson("vasthusilpy_application_entries", []));

  let currentUserProfile = null;
  const emailUserRaw = localStorage.getItem("vasthusilpy_email_user");
  if (emailUserRaw) {
    try {
      currentUserProfile = JSON.parse(emailUserRaw);
    } catch {}
  }
  if (!currentUserProfile) {
    const subUserRaw = localStorage.getItem("vasthusilpy_subscription_user");
    if (subUserRaw) {
      try {
        currentUserProfile = JSON.parse(subUserRaw);
      } catch {}
    }
  }

  return {
    projects,
    invoices,
    estimates,
    customers,
    rateItems,
    cadFolders,
    cadFiles,
    subscriptionRequests,
    applicationEntries,
    currentUserProfile
  };
}

/**
 * Master function to perform full bidirectional Web Data & Profile synchronization
 */
export async function performFullWebDataSync(): Promise<{
  success: boolean;
  syncedAt: string;
  counts: Record<string, number>;
  message: string;
}> {
  const localData = collectLocalWebData();

  // 1. Send all gathered data to Server-side Web Data Persistence endpoint
  let serverMerged: any = null;
  let syncedAt = new Date().toISOString();

  try {
    const res = await fetch("/api/web-data/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...localData,
        userProfiles: localData.currentUserProfile ? [localData.currentUserProfile] : []
      })
    });

    if (res.ok) {
      const result = await res.json();
      if (result.success && result.merged) {
        serverMerged = result.merged;
        syncedAt = result.syncedAt || syncedAt;
      }
    }
  } catch (serverErr) {
    console.warn("[WebDataSync] Server sync warning (will continue with Firestore):", serverErr);
  }

  // 2. Dual-Sync key records with Cloud Firestore if reachable
  if (db) {
    try {
      // Sync User Profile to Firestore
      if (localData.currentUserProfile?.email) {
        const docId = emailToDocId(localData.currentUserProfile.email);
        await setDoc(doc(db, "users", docId), {
          ...localData.currentUserProfile,
          lastSyncAt: syncedAt
        }, { merge: true }).catch(() => {});
      }

      // Sync Subscription Requests to Firestore
      if (Array.isArray(localData.subscriptionRequests)) {
        for (const sub of localData.subscriptionRequests.slice(0, 15)) {
          if (sub?.id) {
            await setDoc(doc(db, "subscription_requests", sub.id), sub, { merge: true }).catch(() => {});
          }
        }
      }

      // Sync top active CRM projects to Firestore
      if (Array.isArray(localData.projects)) {
        for (const proj of localData.projects.slice(0, 15)) {
          if (proj?.id) {
            await setDoc(doc(db, "projects", proj.id), proj, { merge: true }).catch(() => {});
          }
        }
      }

      // Sync top invoices to Firestore
      if (Array.isArray(localData.invoices)) {
        for (const inv of localData.invoices.slice(0, 15)) {
          if (inv?.id) {
            await setDoc(doc(db, "invoices", inv.id), inv, { merge: true }).catch(() => {});
          }
        }
      }
    } catch (firestoreErr) {
      console.warn("[WebDataSync] Firestore cloud sync notice:", firestoreErr);
    }
  }

  // 3. If server provided merged data, update localStorage to keep device in perfect parity
  if (serverMerged) {
    try {
      if (Array.isArray(serverMerged.projects) && serverMerged.projects.length > 0) {
        localStorage.setItem("vasthusilpy_crm_projects", JSON.stringify(serverMerged.projects));
      }
      if (Array.isArray(serverMerged.invoices) && serverMerged.invoices.length > 0) {
        localStorage.setItem("vasthusilpy_invoices", JSON.stringify(serverMerged.invoices));
      }
      if (Array.isArray(serverMerged.estimates) && serverMerged.estimates.length > 0) {
        localStorage.setItem("vasthusilpy_estimates", JSON.stringify(serverMerged.estimates));
      }
      if (Array.isArray(serverMerged.customers) && serverMerged.customers.length > 0) {
        localStorage.setItem("vasthusilpy_customers", JSON.stringify(serverMerged.customers));
      }
      if (Array.isArray(serverMerged.rateItems) && serverMerged.rateItems.length > 0) {
        localStorage.setItem("vasthusilpy_rate_items", JSON.stringify(serverMerged.rateItems));
      }
      if (Array.isArray(serverMerged.cadFolders) && serverMerged.cadFolders.length > 0) {
        localStorage.setItem("vasthusilpy_cad_folders_v3", JSON.stringify(serverMerged.cadFolders));
      }
      if (Array.isArray(serverMerged.cadFiles) && serverMerged.cadFiles.length > 0) {
        localStorage.setItem("vasthusilpy_cad_files_vault_v3", JSON.stringify(serverMerged.cadFiles));
      }
      if (Array.isArray(serverMerged.subscriptionRequests) && serverMerged.subscriptionRequests.length > 0) {
        localStorage.setItem("vasthusilpy_subscription_requests", JSON.stringify(serverMerged.subscriptionRequests));
        localStorage.setItem("vasthusilpy_subscription_requests_v2", JSON.stringify(serverMerged.subscriptionRequests));
      }
    } catch (saveErr) {
      console.warn("[WebDataSync] Error writing merged data back to localStorage:", saveErr);
    }
  }

  // 4. Save last sync timestamp
  try {
    localStorage.setItem(LAST_SYNC_KEY, syncedAt);
  } catch {}

  // 5. Dispatch UI refresh events & Cross-Tab Broadcast
  window.dispatchEvent(new Event("vasthusilpy_storage_update"));
  window.dispatchEvent(new Event("vasthusilpy_cad_vault_update"));
  window.dispatchEvent(new Event("vasthusilpy_subscription_update"));
  window.dispatchEvent(new CustomEvent("vasthusilpy_web_data_synced", { detail: { syncedAt } }));

  broadcastMessage({
    type: "WEB_DATA_SYNC_COMPLETED",
    data: { syncedAt }
  });

  const counts = {
    projects: serverMerged?.projects?.length || localData.projects.length,
    invoices: serverMerged?.invoices?.length || localData.invoices.length,
    estimates: serverMerged?.estimates?.length || localData.estimates.length,
    customers: serverMerged?.customers?.length || localData.customers.length,
    rateItems: serverMerged?.rateItems?.length || localData.rateItems.length,
    cadFolders: serverMerged?.cadFolders?.length || localData.cadFolders.length,
    cadFiles: serverMerged?.cadFiles?.length || localData.cadFiles.length,
    subscriptionRequests: serverMerged?.subscriptionRequests?.length || localData.subscriptionRequests.length
  };

  return {
    success: true,
    syncedAt,
    counts,
    message: "Web Data & User Profile synchronized successfully across Server, Cloud & Local storage."
  };
}

/**
 * Dedicated helper to synchronize User Profile (Email & Mobile Number) across all layers
 */
export async function syncUserProfileDirect(profile?: {
  email?: string;
  phone?: string;
  displayName?: string;
  profession?: string;
  role?: string;
  lastAdminTotpVerifiedAt?: number;
}): Promise<{ success: boolean; error?: string }> {
  if (!profile || !profile.email) {
    return { success: false, error: "Missing email in user profile" };
  }
  try {
    const cleanEmail = (profile.email || "").toLowerCase().trim();
    const cleanPhone = (profile.phone || "").trim();

    // 1. Send to server profile sync endpoint
    await fetch("/api/web-data/sync-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        email: cleanEmail,
        phone: cleanPhone
      })
    }).catch((e) => console.warn("[WebDataSync] Server profile sync notice:", e));

    // 2. Firestore sync
    if (db && cleanEmail) {
      const docId = emailToDocId(cleanEmail);
      await setDoc(doc(db, "users", docId), {
        ...profile,
        email: cleanEmail,
        phone: cleanPhone,
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch(() => {});
    }

    // 3. LocalStorage sessions update
    const emailUserPayload = {
      email: cleanEmail,
      displayName: profile.displayName || cleanEmail.split("@")[0],
      phone: cleanPhone,
      profession: profile.profession || "Vasthu Architect / Engineer",
      role: profile.role || "authorized_user",
      lastAdminTotpVerifiedAt: profile.lastAdminTotpVerifiedAt,
      loginTimestamp: Date.now()
    };
    localStorage.setItem("vasthusilpy_email_user", JSON.stringify(emailUserPayload));

    // Also update active subscription user session if present
    const subUserRaw = localStorage.getItem("vasthusilpy_subscription_user");
    if (subUserRaw) {
      try {
        const subUser = JSON.parse(subUserRaw);
        subUser.email = cleanEmail;
        if (cleanPhone) subUser.phone = cleanPhone;
        if (profile.displayName) subUser.fullName = profile.displayName;
        localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(subUser));
      } catch {}
    }

    // 4. Update matching record in subscription_requests array
    try {
      const subsRaw = localStorage.getItem("vasthusilpy_subscription_requests_v2");
      if (subsRaw) {
        const subs = JSON.parse(subsRaw);
        let changed = false;
        subs.forEach((s: any) => {
          const sEmail = (s.email || "").toLowerCase().trim();
          const sPhone = (s.phone || "").replace(/\D/g, "");
          const targetDigits = cleanPhone.replace(/\D/g, "");
          if ((cleanEmail && sEmail === cleanEmail) || (targetDigits && sPhone === targetDigits)) {
            s.email = cleanEmail;
            s.phone = cleanPhone;
            if (profile.displayName) s.fullName = profile.displayName;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("vasthusilpy_subscription_requests", JSON.stringify(subs));
          localStorage.setItem("vasthusilpy_subscription_requests_v2", JSON.stringify(subs));
          window.dispatchEvent(new Event("vasthusilpy_subscription_update"));
        }
      }
    } catch {}

    // 5. Broadcast across tabs
    broadcastMessage({
      type: "SYNC_USER_PROFILE",
      data: emailUserPayload
    });

    return { success: true };
  } catch (err: any) {
    console.error("[WebDataSync] Error syncing profile:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Master Pull & Hydration function:
 * Fetches authoritative server web data and hydrates local browser storage.
 * Ensures that logging in on ANY device/browser with either Mobile Number OR Email ID
 * loads the exact same projects, CAD drawings, invoices, and estimates.
 */
export async function pullAndHydrateWebDataFromServer(accountIdentifier?: string | null): Promise<{
  success: boolean;
  syncedAt: string;
  counts: Record<string, number>;
  account?: any;
}> {
  try {
    const res = await fetch("/api/web-data/pull").catch((netErr) => {
      console.warn("[WebDataSync] Server not reachable or operating offline:", netErr?.message || netErr);
      return null;
    });

    if (!res || !res.ok) {
      // Graceful offline fallback
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        counts: {}
      };
    }
    const result = await res.json().catch(() => null);
    if (!result || !result.success || !result.data) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        counts: {}
      };
    }

    const d = result.data;
    const syncedAt = result.syncedAt || new Date().toISOString();

    // Helper to merge arrays preserving unique records by id (server authoritative, tombstone protected)
    const mergeById = (localKey: string, serverItems: any[]): any[] => {
      const deletedIds = getGlobalDeletedIds();
      const local = readLocalJson<any[]>(localKey, []).filter(
        (item) => item?.id && !deletedIds.includes(item.id) && !isRecordDeleted(item.id)
      );

      if (!Array.isArray(serverItems) || serverItems.length === 0) {
        return local;
      }

      const map = new Map<string, any>();
      // First populate with local items
      local.forEach((item) => {
        if (item?.id) map.set(item.id, item);
      });

      // Then merge authoritative server items only if NOT deleted
      serverItems.forEach((item) => {
        if (item?.id && !deletedIds.includes(item.id) && !isRecordDeleted(item.id)) {
          const prev = map.get(item.id);
          map.set(item.id, prev ? { ...prev, ...item } : item);
        }
      });
      const merged = Array.from(map.values()).filter(
        (item) => item?.id && !deletedIds.includes(item.id) && !isRecordDeleted(item.id)
      );
      try {
        localStorage.setItem(localKey, JSON.stringify(merged));
      } catch (e) {
        console.warn(`[WebDataSync] Local storage quota notice for ${localKey}:`, e);
      }
      return merged;
    };

    const projects = mergeById("vasthusilpy_crm_projects", d.projects);
    const invoices = mergeById("vasthusilpy_invoices", d.invoices);
    const estimates = mergeById("vasthusilpy_estimates", d.estimates);
    const customers = mergeById("vasthusilpy_customers", d.customers);
    const rateItems = mergeById("vasthusilpy_rate_items", d.rateItems);
    const cadFolders = mergeById("vasthusilpy_cad_folders_v3", d.cadFolders);
    const cadFiles = mergeById("vasthusilpy_cad_files_vault_v3", d.cadFiles);

    // Save subscriptions to both storage keys for 100% interoperability
    const subs = mergeById("vasthusilpy_subscription_requests", d.subscriptionRequests);
    try {
      localStorage.setItem("vasthusilpy_subscription_requests_v2", JSON.stringify(subs));
    } catch {}

    if (Array.isArray(d.applicationEntries) && d.applicationEntries.length > 0) {
      mergeById("vasthusilpy_application_entries", d.applicationEntries);
    }

    // Resolve unified account details across Email & Mobile Number
    let resolvedAccount: any = null;
    const ident = (accountIdentifier && typeof accountIdentifier === "string" ? accountIdentifier : "") || localStorage.getItem("vasthusilpy_saved_login_id") || "";
    if (ident) {
      resolvedAccount = await resolveAccountDetails(ident);
      if (resolvedAccount) {
        // Link both email and mobile in session storage
        const emailSessionRaw = localStorage.getItem("vasthusilpy_email_user");
        if (emailSessionRaw) {
          try {
            const current = JSON.parse(emailSessionRaw);
            const updated = {
              ...current,
              email: resolvedAccount.email || current.email,
              phone: resolvedAccount.phone || current.phone,
              displayName: resolvedAccount.displayName || current.displayName,
              role: resolvedAccount.role || current.role
            };
            localStorage.setItem("vasthusilpy_email_user", JSON.stringify(updated));
          } catch {}
        }

        const subSessionRaw = localStorage.getItem("vasthusilpy_subscription_user");
        if (subSessionRaw) {
          try {
            const current = JSON.parse(subSessionRaw);
            const updated = {
              ...current,
              email: resolvedAccount.email || current.email,
              phone: resolvedAccount.phone || current.phone,
              fullName: resolvedAccount.displayName || current.fullName,
              subscriptionId: resolvedAccount.subscriptionId || current.subscriptionId
            };
            localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(updated));
          } catch {}
        }
      }
    }

    try {
      localStorage.setItem(LAST_SYNC_KEY, syncedAt);
    } catch {}

    // Dispatch real-time events to immediately refresh UI components & tabs
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));
    window.dispatchEvent(new Event("vasthusilpy_cad_vault_update"));
    window.dispatchEvent(new Event("vasthusilpy_subscription_update"));
    window.dispatchEvent(new CustomEvent("vasthusilpy_web_data_synced", { detail: { syncedAt } }));

    broadcastMessage({
      type: "WEB_DATA_SYNC_COMPLETED",
      data: { syncedAt }
    });

    return {
      success: true,
      syncedAt,
      counts: {
        projects: projects.length,
        invoices: invoices.length,
        estimates: estimates.length,
        customers: customers.length,
        rateItems: rateItems.length,
        cadFolders: cadFolders.length,
        cadFiles: cadFiles.length,
        subscriptionRequests: subs.length
      },
      account: resolvedAccount
    };
  } catch (err: any) {
    console.warn("[WebDataSync] pullAndHydrateWebDataFromServer fallback notice:", err?.message || err);
    return {
      success: false,
      syncedAt: new Date().toISOString(),
      counts: {}
    };
  }
}

/**
 * Resolves account identity by either Email OR Mobile Number,
 * ensuring both login identifiers point to the identical canonical account.
 */
export async function resolveAccountDetails(
  identifier?: string | null,
  password?: string | null
): Promise<any | null> {
  if (!identifier || typeof identifier !== "string" || !identifier.trim()) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("/api/web-data/resolve-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password ? password.trim() : undefined
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.account) {
        return data.account;
      }
    }
  } catch (e) {
    console.warn("[WebDataSync] resolveAccountDetails notice:", e);
  }
  return null;
}

/**
 * Authoritatively verifies subscription login credentials with backend server.
 * Guarantees cross-browser login parity regardless of local storage state.
 */
export async function verifySubscriptionLoginOnServer(
  identifier: string,
  password: string
): Promise<{ success: boolean; isPrimaryAdmin?: boolean; subscription?: any; account?: any; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("/api/web-data/verify-subscription-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password: password.trim()
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => null);
    if (res.ok && data && data.success) {
      return {
        success: true,
        isPrimaryAdmin: data.isPrimaryAdmin,
        subscription: data.subscription,
        account: data.account
      };
    }
    return {
      success: false,
      error: data?.error || (res.status === 401 ? "നൽകിയ പാസ്‌വേഡ് തെറ്റാണ്. (Incorrect Password)." : "ലോഗിൻ സാധ്യമായില്ല.")
    };
  } catch (e: any) {
    console.warn("[WebDataSync] verifySubscriptionLoginOnServer offline fallback notice:", e);
    return { success: false, error: "SERVER_UNREACHABLE" };
  }
}

/**
 * Changes/resets subscription password and persists authoritatively to server.
 */
export async function changeSubscriptionPasswordOnServer(
  identifier: string,
  verificationCodeOrUpi: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch("/api/web-data/change-subscription-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: identifier.trim(),
        verificationCodeOrUpi: verificationCodeOrUpi.trim(),
        newPassword: newPassword.trim()
      })
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data?.error || "പാസ്‌വേഡ് മാറ്റാൻ കഴിഞ്ഞില്ല." };
  } catch (e: any) {
    console.warn("[WebDataSync] changeSubscriptionPasswordOnServer error:", e);
    return { success: false, error: e.message };
  }
}

/**
 * Fetches authoritative subscriptions directly from the server.
 */
export async function fetchServerSubscriptionRequests(): Promise<any[]> {
  try {
    const res = await fetch("/api/web-data/subscriptions");
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.subscriptions)) {
        return data.subscriptions;
      }
    }
  } catch (e) {
    console.warn("[WebDataSync] fetchServerSubscriptionRequests notice:", e);
  }
  return [];
}

/**
 * Background Auto-Sync Service that runs periodically and when device reconnects online
 */
export function initializeAutoSyncService(intervalMs = 120000): () => void {
  // Initial sync pull on app boot
  pullAndHydrateWebDataFromServer().catch(() => {});

  const intervalId = setInterval(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      performFullWebDataSync().catch(() => {});
    }
  }, intervalMs);

  const handleOnline = () => {
    pullAndHydrateWebDataFromServer().catch(() => {});
  };

  const handleVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible" && navigator.onLine) {
      performFullWebDataSync().catch(() => {});
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
  }
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibility);
  }

  return () => {
    clearInterval(intervalId);
    if (typeof window !== "undefined") {
      window.removeEventListener("online", handleOnline);
    }
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibility);
    }
  };
}

