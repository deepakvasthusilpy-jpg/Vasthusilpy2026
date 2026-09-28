import {
  generateFullBackupPackage,
  restoreBackupPackage,
  validateBackupFile,
  VasthusilpyBackupPackage,
  BackupValidationResult
} from "./backupRestoreManager";
import {
  getCachedToken,
  ensureGoogleAccessToken,
  googleSignIn,
  clearCachedGoogleToken
} from "../lib/googleWorkspace";

export const GOOGLE_BACKUP_STORAGE_KEYS = {
  LAST_BACKUP_TIME: "vasthusilpy_last_google_drive_backup_time",
  LAST_BACKUP_INFO: "vasthusilpy_last_google_drive_backup_info",
  AUTO_BACKUP_ENABLED: "vasthusilpy_gdrive_auto_backup_enabled",
  AUTO_BACKUP_INTERVAL_HOURS: "vasthusilpy_gdrive_auto_backup_hours"
};

export interface GoogleDriveBackupResult {
  success: boolean;
  backupId?: string;
  timestamp?: string;
  formattedDate?: string;
  rootFolderId?: string;
  rootFolderLink?: string;
  snapshotFolderId?: string;
  snapshotFolderName?: string;
  snapshotFolderLink?: string;
  masterFileId?: string;
  masterFileLink?: string;
  totalFilesUploaded?: number;
  itemCounts?: {
    siteInspections: number;
    crmProjects: number;
    customers: number;
    invoices: number;
    estimates: number;
    quotations: number;
    personalBills: number;
    registeredTasks: number;
    onlineApplications: number;
    importantSites: number;
  };
  message?: string;
  error?: string;
  unauthorized?: boolean;
}

export interface GoogleDriveBackupItem {
  folderId: string;
  folderName: string;
  folderLink: string;
  createdTime: string;
  totalFiles: number;
  masterFileId?: string;
  masterFileName?: string;
  masterFileSize?: string;
  masterFileLink?: string;
  files: Array<{
    id: string;
    name: string;
    size?: string;
    webViewLink?: string;
  }>;
}

/**
 * Backs up ALL data on the website to the user's Google Drive cloud drive
 */
export async function backupAllWebsiteDataToGoogleDrive(
  userEmail?: string,
  onProgress?: (status: string, percentage: number) => void
): Promise<GoogleDriveBackupResult> {
  try {
    if (onProgress) onProgress("Checking Google Workspace authorization...", 10);

    // 1. Ensure active Google OAuth Token
    let token = getCachedToken();
    if (!token) {
      if (onProgress) onProgress("Opening Google Sign-In...", 20);
      const signinRes = await googleSignIn(true);
      if (!signinRes || !signinRes.accessToken) {
        throw new Error("Google Workspace authorization was not completed.");
      }
      token = signinRes.accessToken;
    }

    if (onProgress) onProgress("Compiling complete website database package...", 35);

    // 2. Generate Universal Backup Package across all website modules
    const backupPackage = generateFullBackupPackage(userEmail);

    if (onProgress) onProgress("Connecting to Google Drive Cloud Storage...", 55);

    // 3. Post to Server Endpoint for Google Drive Multipart Creation & Folder Hierarchy
    if (onProgress) onProgress("Uploading full master backup & categorized data modules...", 75);

    let res = await fetch("/api/google/drive/backup-all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accessToken: token,
        backupPackage,
        options: {
          includeCsvReports: true
        }
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || "";
      if (
        res.status === 401 ||
        res.status === 403 ||
        errMsg.toLowerCase().includes("insufficient") ||
        errMsg.toLowerCase().includes("invalid authentication") ||
        errMsg.toLowerCase().includes("unauthorized")
      ) {
        clearCachedGoogleToken();
        if (onProgress) onProgress("Re-authenticating with Google Drive...", 80);
        const signinRes = await googleSignIn(true);
        if (signinRes?.accessToken) {
          token = signinRes.accessToken;
          res = await fetch("/api/google/drive/backup-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: token, backupPackage, options: { includeCsvReports: true } })
          });
        } else {
          return {
            success: false,
            unauthorized: true,
            error: "Google Drive authorization required. Please sign in with Google to grant Drive permissions."
          };
        }
      }

      if (!res.ok) {
        const finalErrData = await res.json().catch(() => ({}));
        throw new Error(finalErrData.error || `Google Drive backup failed with status ${res.status}`);
      }
    }

    const result: GoogleDriveBackupResult = await res.json();

    if (result.success) {
      const nowIso = new Date().toISOString();
      localStorage.setItem(GOOGLE_BACKUP_STORAGE_KEYS.LAST_BACKUP_TIME, nowIso);
      localStorage.setItem(
        GOOGLE_BACKUP_STORAGE_KEYS.LAST_BACKUP_INFO,
        JSON.stringify({
          backupId: result.backupId,
          timestamp: nowIso,
          snapshotFolderName: result.snapshotFolderName,
          snapshotFolderLink: result.snapshotFolderLink,
          masterFileLink: result.masterFileLink,
          itemCounts: result.itemCounts
        })
      );

      // Dispatch global event
      window.dispatchEvent(new CustomEvent("vasthusilpy_gdrive_backup_completed", { detail: result }));
      if (onProgress) onProgress("Backup completed successfully!", 100);
    }

    return result;
  } catch (error: any) {
    console.error("[GoogleDriveBackup] Backup error:", error);
    if (onProgress) onProgress(`Error: ${error.message || "Failed"}`, 0);
    return {
      success: false,
      error: error.message || "Failed to backup website data to Google Drive."
    };
  }
}

export interface GoogleDriveListResult {
  success: boolean;
  unauthorized?: boolean;
  backups: GoogleDriveBackupItem[];
  rootFolderLink?: string;
  error?: string;
}

export interface EnsureFolderResult {
  success: boolean;
  folderId?: string;
  folderName?: string;
  webViewLink?: string;
  createdNew?: boolean;
  message?: string;
  error?: string;
  unauthorized?: boolean;
}

/**
 * Ensures 'Vasthusilpy Cloud Backups' folder exists in user's Google Drive root (My Drive).
 * Creates it immediately if not found.
 */
export async function ensureGoogleDriveRootFolder(
  interactive: boolean = false
): Promise<EnsureFolderResult> {
  try {
    let token = getCachedToken();
    if (!token) {
      if (interactive) {
        const signinRes = await googleSignIn(true);
        if (!signinRes?.accessToken) {
          return { success: false, unauthorized: true, error: "Google authorization required." };
        }
        token = signinRes.accessToken;
      } else {
        return { success: false, unauthorized: true, error: "Sign in with Google to create or access cloud folders." };
      }
    }

    const res = await fetch("/api/google/drive/ensure-root-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || "";
      if (
        res.status === 401 ||
        res.status === 403 ||
        errMsg.toLowerCase().includes("insufficient") ||
        errMsg.toLowerCase().includes("invalid authentication") ||
        errMsg.toLowerCase().includes("unauthorized")
      ) {
        clearCachedGoogleToken();
        if (interactive) {
          const signinRes = await googleSignIn(true);
          if (signinRes?.accessToken) {
            return ensureGoogleDriveRootFolder(false);
          }
        }
        return {
          success: false,
          unauthorized: true,
          error: "Google Drive authorization required with Drive permissions. Please click 'Re-authorize Google Drive'."
        };
      }
      return { success: false, error: errMsg || "Failed to create folder on Google Drive." };
    }

    const data = await res.json();
    return {
      success: true,
      folderId: data.folderId,
      folderName: data.folderName,
      webViewLink: data.webViewLink,
      createdNew: data.createdNew,
      message: data.message
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to communicate with Google Drive."
    };
  }
}

/**
 * Fetch all available backup snapshots directly from user's Google Drive
 */
export async function fetchGoogleDriveBackupsList(
  providedToken?: string,
  interactive: boolean = false
): Promise<GoogleDriveListResult> {
  try {
    let token = providedToken || getCachedToken();
    if (!token) {
      if (interactive) {
        const signinRes = await googleSignIn(true);
        if (!signinRes?.accessToken) {
          return { success: false, unauthorized: true, backups: [], error: "Google authorization required." };
        }
        token = signinRes.accessToken;
      } else {
        return {
          success: false,
          unauthorized: true,
          backups: [],
          error: "Sign in with Google to view cloud backup history."
        };
      }
    }

    const res = await fetch(`/api/google/drive/list-backups?accessToken=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData.error || "";
      if (
        res.status === 401 ||
        res.status === 403 ||
        errMsg.toLowerCase().includes("insufficient") ||
        errMsg.toLowerCase().includes("invalid authentication") ||
        errMsg.toLowerCase().includes("unauthorized")
      ) {
        clearCachedGoogleToken();
        if (interactive) {
          const signinRes = await googleSignIn(true);
          if (signinRes?.accessToken) {
            return fetchGoogleDriveBackupsList(signinRes.accessToken, false);
          }
        }
        return {
          success: false,
          unauthorized: true,
          backups: [],
          error: "Google Drive authorization expired or permissions missing. Please sign in with Google."
        };
      }
      return {
        success: false,
        backups: [],
        error: errMsg || "Failed to list backups from Google Drive."
      };
    }

    const data = await res.json();
    return {
      success: true,
      backups: data.backups || [],
      rootFolderLink: data.rootFolderLink
    };
  } catch (err: any) {
    const msg = err.message || "";
    if (
      msg.toLowerCase().includes("insufficient") ||
      msg.toLowerCase().includes("invalid authentication") ||
      msg.toLowerCase().includes("unauthorized")
    ) {
      clearCachedGoogleToken();
      return {
        success: false,
        unauthorized: true,
        backups: [],
        error: "Google authorization required. Please sign in with Google."
      };
    }
    console.warn("[GoogleDriveBackup] Notice retrieving backups:", msg);
    return {
      success: false,
      backups: [],
      error: msg || "Failed to retrieve backups from Google Drive."
    };
  }
}

/**
 * Restore website data from a selected Google Drive backup file
 */
export async function restoreBackupFromGoogleDrive(
  fileId: string,
  mode: "REPLACE" | "MERGE" = "REPLACE",
  onProgress?: (msg: string) => void
): Promise<{ success: boolean; message: string; summary?: any }> {
  try {
    if (onProgress) onProgress("Authenticating with Google Drive...");
    let token = getCachedToken();
    if (!token) {
      const signinRes = await googleSignIn();
      if (!signinRes?.accessToken) throw new Error("Google sign-in required to restore.");
      token = signinRes.accessToken;
    }

    if (onProgress) onProgress("Downloading backup file from Google Drive...");
    const res = await fetch("/api/google/drive/download-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken: token, fileId })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to download backup file from Drive.");
    }

    const { package: backupPackage } = await res.json();

    if (onProgress) onProgress("Validating backup dataset integrity...");
    const validation = validateBackupFile(JSON.stringify(backupPackage));
    if (!validation.isValid || !validation.package) {
      throw new Error(validation.error || "Corrupt or invalid backup format.");
    }

    if (onProgress) onProgress(`Restoring data (${mode === "REPLACE" ? "Clean Overwrite" : "Safe Merge"})...`);
    const restoreRes = await restoreBackupPackage(validation.package, mode);

    if (restoreRes.success) {
      if (onProgress) onProgress("Restore completed successfully!");
      return {
        success: true,
        message: restoreRes.message,
        summary: validation.summary
      };
    } else {
      throw new Error(restoreRes.message);
    }
  } catch (err: any) {
    console.error("[GoogleDriveBackup] Restore error:", err);
    return {
      success: false,
      message: err.message || "Failed to restore backup from Google Drive."
    };
  }
}

/**
 * Get formatted timestamp of last Google Drive backup
 */
export function getLastGoogleDriveBackupTime(): string | null {
  try {
    return localStorage.getItem(GOOGLE_BACKUP_STORAGE_KEYS.LAST_BACKUP_TIME);
  } catch {
    return null;
  }
}

export function getLastGoogleDriveBackupInfo(): any | null {
  try {
    const raw = localStorage.getItem(GOOGLE_BACKUP_STORAGE_KEYS.LAST_BACKUP_INFO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function formatBackupDate(isoString?: string | null): string {
  if (!isoString) return "Never backed up";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Unknown date";
    return `${d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })} at ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return "Unknown date";
  }
}
