import { ClientShareLink } from "../types";
import { db } from "../lib/firebase";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { safeSetDoc } from "../utils/storageManager";

const STORAGE_KEY = "vasthusilpy_client_share_links";

export const INITIAL_CLIENT_SHARES: ClientShareLink[] = [];

export function loadSavedClientShares(): ClientShareLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((s: ClientShareLink) => {
            const c = (s.clientName || "").toLowerCase();
            if (
              c.includes("mohan kumar") ||
              (c.includes("mohan") && c.includes("priya")) ||
              c.includes("v. r. suresh") ||
              c.includes("v.r. suresh") ||
              c.includes("vr suresh") ||
              c.includes("suresh kumar")
            ) {
              return false;
            }
            return true;
          })
          .map((s: ClientShareLink) => {
            const c = (s.clientName || "").toLowerCase();
            if ((c.includes("dasan") && c.includes("preetha")) || c === "1. dasan 2. preetha (copy)" || c === "1. dasan 2. preetha" || c.startsWith("1. dasan")) {
              return { ...s, clientName: "Client 1" };
            }
            return s;
          });
      }
    }
  } catch (e) {
    console.error("Failed to load client share links from localStorage", e);
  }
  return INITIAL_CLIENT_SHARES;
}

export function saveClientShares(links: ClientShareLink[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
    window.dispatchEvent(new Event("vasthusilpy_client_shares_updated"));
  } catch (e) {
    console.error("Failed to save client share links", e);
  }
}

/**
 * Generates a unique, high-entropy unguessable token
 */
export function generateClientShareToken(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let token = "vst-";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Creates a new client share record and syncs to Firestore
 */
export async function createClientShareLink(
  data: Omit<ClientShareLink, "id" | "token" | "createdAt" | "expiresAt" | "viewsCount" | "status"> & {
    durationHours: number;
    durationLabel?: string;
    customExpiresAt?: string;
    customToken?: string;
  }
): Promise<ClientShareLink> {
  const existing = loadSavedClientShares();
  const newId = `CSL-2026-${String(existing.length + 1).padStart(3, "0")}`;
  const token = data.customToken && data.customToken.trim().length > 3
    ? data.customToken.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-")
    : generateClientShareToken();

  const now = new Date();
  let expiresAtStr: string;

  if (data.customExpiresAt) {
    expiresAtStr = new Date(data.customExpiresAt).toISOString();
  } else {
    const expDate = new Date(now.getTime() + data.durationHours * 60 * 60 * 1000);
    expiresAtStr = expDate.toISOString();
  }

  const durationLabel = data.durationLabel || (
    data.durationHours === 24 ? "24 Hours" :
    data.durationHours === 72 ? "3 Days" :
    data.durationHours === 168 ? "7 Days" :
    data.durationHours === 336 ? "14 Days" :
    data.durationHours === 720 ? "30 Days" : `${data.durationHours} Hours`
  );

  const newLink: ClientShareLink = {
    id: newId,
    token,
    estimateId: data.estimateId,
    estimateProjectName: data.estimateProjectName,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    houseName: data.houseName,
    location: data.location,
    createdAt: now.toISOString(),
    expiresAt: expiresAtStr,
    durationHours: data.durationHours,
    durationLabel,
    status: "ACTIVE",
    viewsCount: 0,
    allowStageExpenditure: data.allowStageExpenditure ?? true,
    allowWorkItemsBreakdown: data.allowWorkItemsBreakdown ?? true,
    allowDownloadPdf: data.allowDownloadPdf ?? true,
    allowEngineerSeal: data.allowEngineerSeal ?? true,
    progressPercentage: data.progressPercentage ?? 50,
    customStageStatus: data.customStageStatus || "Construction & stage work in progress",
    accessPin: data.accessPin?.trim() || "",
    customNote: data.customNote || ""
  };

  const updated = [newLink, ...existing];
  saveClientShares(updated);

  // Sync to Firestore
  try {
    await safeSetDoc(doc(db, "client_shares", newLink.token), newLink, { merge: true });
    // Also save by ID
    await safeSetDoc(doc(db, "client_share_records", newLink.id), newLink, { merge: true });
  } catch (err) {
    console.warn("Firestore sync error for client share link:", err);
  }

  return newLink;
}

/**
 * Revokes a client share link immediately
 */
export async function revokeClientShareLink(id: string): Promise<ClientShareLink[]> {
  const existing = loadSavedClientShares();
  const target = existing.find((l) => l.id === id);
  const updated = existing.map((link) => {
    if (link.id === id) {
      return { ...link, status: "REVOKED" as const };
    }
    return link;
  });
  saveClientShares(updated);

  if (target) {
    try {
      await safeSetDoc(doc(db, "client_shares", target.token), { status: "REVOKED" }, { merge: true });
      await safeSetDoc(doc(db, "client_share_records", target.id), { status: "REVOKED" }, { merge: true });
    } catch (err) {
      console.warn("Firestore revoke client share error:", err);
    }
  }

  return updated;
}

/**
 * Extends the expiry of an existing link by specified hours
 */
export async function extendClientShareLink(id: string, additionalHours: number): Promise<ClientShareLink[]> {
  const existing = loadSavedClientShares();
  let modifiedTarget: ClientShareLink | null = null;

  const updated = existing.map((link) => {
    if (link.id === id) {
      const currentExpiry = new Date(link.expiresAt).getTime();
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + additionalHours * 3600 * 1000).toISOString();
      const updatedItem: ClientShareLink = {
        ...link,
        expiresAt: newExpiry,
        status: "ACTIVE",
        durationHours: link.durationHours + additionalHours
      };
      modifiedTarget = updatedItem;
      return updatedItem;
    }
    return link;
  });

  saveClientShares(updated);

  if (modifiedTarget) {
    try {
      await safeSetDoc(doc(db, "client_shares", (modifiedTarget as ClientShareLink).token), modifiedTarget, { merge: true });
      await safeSetDoc(doc(db, "client_share_records", (modifiedTarget as ClientShareLink).id), modifiedTarget, { merge: true });
    } catch (err) {
      console.warn("Firestore extend client share error:", err);
    }
  }

  return updated;
}

/**
 * Deletes a client share link permanently
 */
export async function deleteClientShareLink(id: string): Promise<ClientShareLink[]> {
  const existing = loadSavedClientShares();
  const target = existing.find((l) => l.id === id);
  const updated = existing.filter((link) => link.id !== id);
  saveClientShares(updated);

  if (target) {
    try {
      await deleteDoc(doc(db, "client_shares", target.token));
      await deleteDoc(doc(db, "client_share_records", target.id));
    } catch (err) {
      console.warn("Firestore delete client share error:", err);
    }
  }

  return updated;
}

/**
 * Formats time remaining until link expiration
 */
export function getTimeRemainingFormatted(expiresAt: string, status: "ACTIVE" | "EXPIRED" | "REVOKED"): {
  label: string;
  isExpired: boolean;
  isUrgent: boolean;
  badgeColor: string;
} {
  if (status === "REVOKED") {
    return {
      label: "റദ്ദാക്കി (Revoked)",
      isExpired: true,
      isUrgent: false,
      badgeColor: "bg-rose-950/80 text-rose-300 border-rose-800/80"
    };
  }

  const exp = new Date(expiresAt).getTime();
  const now = Date.now();
  const diffMs = exp - now;

  if (diffMs <= 0) {
    return {
      label: "കാലാവധി കഴിഞ്ഞു (Expired)",
      isExpired: true,
      isUrgent: false,
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800/80"
    };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return {
      label: `${days}d ${remainingHours}h left`,
      isExpired: false,
      isUrgent: days <= 1,
      badgeColor: days <= 1
        ? "bg-amber-950/80 text-amber-300 border-amber-800/80"
        : "bg-emerald-950/80 text-emerald-300 border-emerald-800/80"
    };
  }

  if (hours > 0) {
    return {
      label: `${hours}h ${minutes}m left`,
      isExpired: false,
      isUrgent: true,
      badgeColor: "bg-amber-950/80 text-amber-300 border-amber-800/80"
    };
  }

  return {
    label: `${minutes} mins left`,
    isExpired: false,
    isUrgent: true,
    badgeColor: "bg-red-950/80 text-red-300 border-red-800/80 animate-pulse"
  };
}

/**
 * Builds full shareable client link URL
 */
export function buildClientShareUrl(token: string): string {
  const origin = window.location.origin;
  return `${origin}/?client_view=${encodeURIComponent(token)}`;
}
