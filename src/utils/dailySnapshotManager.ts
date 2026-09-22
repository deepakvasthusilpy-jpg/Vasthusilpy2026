import { VasthusilpyBackupPackage, generateFullBackupPackage, restoreBackupPackage } from "./backupRestoreManager";

export interface DailySnapshotRecord {
  id: string; // e.g. "SNAP-2026-09-22"
  dateKey: string; // e.g. "2026-09-22"
  createdAt: string; // ISO string
  formattedDate: string;
  formattedTime: string;
  sizeKb: number;
  stats: {
    vaultFiles: number;
    vaultFolders: number;
    constructionProjects: number;
    constructionAgreements: number;
    quotations: number;
    estimates: number;
    crmProjects: number;
    customers: number;
    invoices: number;
    personalBills: number;
    totalRecords: number;
  };
  data: VasthusilpyBackupPackage;
}

const STORAGE_KEY_DAILY_SNAPSHOTS = "vasthusilpy_daily_snapshots_v1";
const STORAGE_KEY_LAST_AUTO_SNAPSHOT = "vasthusilpy_last_auto_snapshot_date";
const MAX_STORED_SNAPSHOTS = 14; // Keep up to 14 days of automatic daily snapshots in local storage

/**
 * Retrieve all saved daily snapshots from Local Storage
 */
export function getDailySnapshots(): DailySnapshotRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_SNAPSHOTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Sort newest first
      return parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (err) {
    console.warn("Error reading daily snapshots from local storage:", err);
  }
  return [];
}

/**
 * Save snapshots array back to Local Storage safely
 */
function saveDailySnapshots(snapshots: DailySnapshotRecord[]): boolean {
  try {
    // Keep within MAX_STORED_SNAPSHOTS
    const trimmed = snapshots.slice(0, MAX_STORED_SNAPSHOTS);
    localStorage.setItem(STORAGE_KEY_DAILY_SNAPSHOTS, JSON.stringify(trimmed));
    return true;
  } catch (err: any) {
    console.warn("Storage quota limit reached when saving daily snapshot. Pruning older snapshots...", err);
    // If quota exceeded, prune older snapshots one by one
    try {
      if (snapshots.length > 3) {
        const reduced = snapshots.slice(0, Math.floor(snapshots.length / 2));
        localStorage.setItem(STORAGE_KEY_DAILY_SNAPSHOTS, JSON.stringify(reduced));
        return true;
      }
    } catch (innerErr) {
      console.error("Critical storage quota error in daily snapshots:", innerErr);
    }
    return false;
  }
}

/**
 * Create a new daily snapshot right now and store it in Local Storage
 */
export function createDailySnapshot(force: boolean = false): DailySnapshotRecord {
  const pkg = generateFullBackupPackage();
  const now = new Date();
  const dateKey = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const formattedDate = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const formattedTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const stats = {
    vaultFiles: pkg.dataStorageVault?.files?.length || 0,
    vaultFolders: pkg.dataStorageVault?.folders?.length || 0,
    constructionProjects: pkg.constructionWork?.projects?.length || 0,
    constructionAgreements: pkg.constructionWork?.agreements?.length || 0,
    quotations: pkg.quotation?.quotations?.length || 0,
    estimates: (pkg.estimator?.estimates?.length ?? pkg.estimates?.length) || 0,
    crmProjects: (pkg.crm?.projects?.length ?? pkg.crmProjects?.length) || 0,
    customers: (pkg.crm?.customers?.length ?? pkg.customers?.length) || 0,
    invoices: (pkg.invoicePayments?.invoices?.length ?? pkg.invoices?.length) || 0,
    personalBills:
      (pkg.personalBills?.poovMalaRows?.length || 0) +
      (pkg.personalBills?.ksebBills?.length || 0) +
      (pkg.personalBills?.vendorBills?.length || 0) +
      (pkg.personalBills?.staffSalary?.length || 0),
    totalRecords: 0
  };

  stats.totalRecords =
    stats.vaultFiles +
    stats.vaultFolders +
    stats.constructionProjects +
    stats.constructionAgreements +
    stats.quotations +
    stats.estimates +
    stats.crmProjects +
    stats.customers +
    stats.invoices +
    stats.personalBills;

  const jsonStr = JSON.stringify(pkg);
  const sizeKb = Math.round((jsonStr.length / 1024) * 10) / 10;

  const newSnapshot: DailySnapshotRecord = {
    id: `SNAP-${dateKey}-${now.getTime().toString().slice(-4)}`,
    dateKey,
    createdAt: now.toISOString(),
    formattedDate,
    formattedTime,
    sizeKb,
    stats,
    data: pkg
  };

  const existing = getDailySnapshots();
  // If we already have a snapshot for today and force is false, replace today's snapshot to stay fresh
  const filtered = existing.filter((s) => s.dateKey !== dateKey || force);
  const updated = [newSnapshot, ...filtered];

  saveDailySnapshots(updated);
  localStorage.setItem(STORAGE_KEY_LAST_AUTO_SNAPSHOT, dateKey);

  window.dispatchEvent(new Event("vasthusilpy_snapshots_updated"));
  return newSnapshot;
}

/**
 * Trigger download of a specific daily snapshot as a JSON file
 */
export function downloadDailySnapshotJson(snapshot: DailySnapshotRecord): { filename: string; sizeKb: number } {
  const jsonString = JSON.stringify(snapshot.data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const filename = `Vasthusilpy_DailyBackup_${snapshot.dateKey}.json`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    filename,
    sizeKb: Math.round((blob.size / 1024) * 10) / 10
  };
}

/**
 * Restore data from a selected Daily Snapshot
 */
export async function restoreFromDailySnapshot(
  snapshot: DailySnapshotRecord,
  mode: "REPLACE" | "MERGE" = "REPLACE"
): Promise<{ success: boolean; message: string }> {
  return restoreBackupPackage(snapshot.data, mode);
}

/**
 * Delete a specific snapshot
 */
export function deleteDailySnapshot(snapshotId: string): void {
  const existing = getDailySnapshots();
  const filtered = existing.filter((s) => s.id !== snapshotId);
  saveDailySnapshots(filtered);
  window.dispatchEvent(new Event("vasthusilpy_snapshots_updated"));
}

/**
 * Check if today's automatic daily snapshot has been taken; if not, create it.
 * This runs automatically every day on app boot, tab focus, or periodic timer.
 */
export function checkAndRunDailyAutoSnapshot(): DailySnapshotRecord | null {
  try {
    const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const lastRunKey = localStorage.getItem(STORAGE_KEY_LAST_AUTO_SNAPSHOT);

    // If last run is not today, take today's snapshot
    if (lastRunKey !== todayKey) {
      console.log(`[AutoBackup] Taking daily snapshot for ${todayKey}...`);
      return createDailySnapshot(false);
    }
  } catch (e) {
    console.warn("[AutoBackup] Failed running auto snapshot check:", e);
  }
  return null;
}

/**
 * Anti-Data-Loss Shield:
 * Evaluates whether current data might be empty or lost while previous snapshots had data.
 */
export interface DataLossAuditResult {
  hasPotentialDataLoss: boolean;
  emptyTabs: string[];
  lastAvailableSnapshotDate?: string;
  recommendedSnapshot?: DailySnapshotRecord;
  message?: string;
}

export function detectPotentialDataLoss(): DataLossAuditResult {
  const snapshots = getDailySnapshots();
  if (snapshots.length === 0) {
    return { hasPotentialDataLoss: false, emptyTabs: [] };
  }

  const latestSnapshot = snapshots[0];
  const pkg = generateFullBackupPackage();

  const emptyTabs: string[] = [];

  // Check 1: Data Storage Vault
  const currentVaultFiles = pkg.dataStorageVault?.files?.length || 0;
  if (currentVaultFiles === 0 && (latestSnapshot.stats.vaultFiles || 0) > 0) {
    emptyTabs.push("Data Storage Vault");
  }

  // Check 2: Construction Work
  const currentConstProjects = pkg.constructionWork?.projects?.length || 0;
  if (currentConstProjects === 0 && (latestSnapshot.stats.constructionProjects || 0) > 0) {
    emptyTabs.push("Construction Work");
  }

  // Check 3: Quotations
  const currentQuotes = pkg.quotation?.quotations?.length || 0;
  if (currentQuotes === 0 && (latestSnapshot.stats.quotations || 0) > 0) {
    emptyTabs.push("Quotations");
  }

  // Check 4: Estimator
  const currentEstimates = (pkg.estimator?.estimates?.length ?? pkg.estimates?.length) || 0;
  if (currentEstimates === 0 && (latestSnapshot.stats.estimates || 0) > 0) {
    emptyTabs.push("Estimator");
  }

  // Check 5: CRM
  const currentCrmProjects = (pkg.crm?.projects?.length ?? pkg.crmProjects?.length) || 0;
  if (currentCrmProjects === 0 && (latestSnapshot.stats.crmProjects || 0) > 0) {
    emptyTabs.push("CRM Projects");
  }

  // Check 6: Invoices
  const currentInvoices = (pkg.invoicePayments?.invoices?.length ?? pkg.invoices?.length) || 0;
  if (currentInvoices === 0 && (latestSnapshot.stats.invoices || 0) > 0) {
    emptyTabs.push("Invoice Payments");
  }

  // Check 7: Personal Bills
  const currentPersonalBills =
    (pkg.personalBills?.poovMalaRows?.length || 0) +
    (pkg.personalBills?.ksebBills?.length || 0) +
    (pkg.personalBills?.vendorBills?.length || 0);
  if (currentPersonalBills === 0 && (latestSnapshot.stats.personalBills || 0) > 0) {
    emptyTabs.push("Personal Bills & Payments");
  }

  if (emptyTabs.length > 0) {
    return {
      hasPotentialDataLoss: true,
      emptyTabs,
      lastAvailableSnapshotDate: latestSnapshot.formattedDate,
      recommendedSnapshot: latestSnapshot,
      message: `Data in [${emptyTabs.join(", ")}] appears empty, but a daily snapshot from ${latestSnapshot.formattedDate} is available to restore!`
    };
  }

  return { hasPotentialDataLoss: false, emptyTabs: [] };
}
