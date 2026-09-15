import { BuildingPlanProject, PlanSheet } from "../types/buildingPlanTemplate";
import { generateDirectProjectVectorPdf } from "./planExportUtils";
import { getCachedToken } from "../lib/googleWorkspace";
import { saveCADDrawingRecord, getStoredCADFolders } from "./dataStorageManager";
import { CADDrawingRecord } from "../types/dataStorageTypes";

export interface CloudSaveResult {
  success: boolean;
  cloudId?: string;
  cloudDownloadUrl?: string;
  driveViewLink?: string;
  driveDownloadLink?: string;
  savedAt?: string;
  error?: string;
}

// Global debouncing map so multiple fast changes don't fire parallel uploads
const pendingSaveTimers = new Map<string, any>();

/**
 * Converts a Blob to a base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Builds the direct zero-login download URL for a cloud-saved plan
 */
export function getCloudDownloadUrl(projectId: string, sheetId?: string): string {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://vasthusilpy.com";
  
  const query = sheetId ? `?sheetId=${encodeURIComponent(sheetId)}` : "";
  return `${origin}/api/cloud-plans/download/${encodeURIComponent(projectId)}${query}`;
}

/**
 * Synchronizes the plan project into the CAD Vault / Cloud Drive system
 * so it automatically appears in the user's CAD Drawings & Blueprints Cloud Drive
 */
export function syncPlanToCadVault(project: BuildingPlanProject, sheet?: PlanSheet, pdfDataUrl?: string): void {
  try {
    const folders = getStoredCADFolders();
    const targetFolder = folders.find((f) => f.name.toUpperCase() === "DEEPAK") || folders[0];
    const sheetTarget = sheet || project.sheets[0];

    const cadRecord: CADDrawingRecord = {
      id: `cad-plan-${project.id}`,
      name: `${project.projectTitle || "Building Plan"} - ${sheetTarget?.drawingName || "Architectural Sheet"}`,
      title: project.projectTitle || "Architectural Floor Plan",
      projectName: project.projectTitle || "Building Plan Project",
      category: "ARCHITECTURAL_PLAN",
      fileType: "PDF",
      fileSize: pdfDataUrl ? Math.round(pdfDataUrl.length * 0.75) : 10240,
      folderId: targetFolder ? targetFolder.id : "folder-deepak",
      folderPath: targetFolder ? targetFolder.path : "/DEEPAK",
      clientName: project.clientName || "Client",
      ownerName: project.clientName || "Client",
      clientPhone: project.officeMobile || "7012383137",
      mobileNo: project.officeMobile || "7012383137",
      location: project.projectLocation || "Kerala",
      description: `Architectural Blueprint created under Building Plan Templates. Sheet: ${sheetTarget?.drawingNumber || "DWG-1"}. Auto-saved to Cloud Drive.`,
      keywords: ["Building Plan", "Blueprint", "AutoCloud", project.clientName || ""].filter(Boolean),
      isStarred: true,
      shareSettings: {
        isShared: true,
        isPublic: true,
        shareToken: `share-${project.id}`,
        allowDownload: true,
        allowPrinting: true,
        requirePin: false
      },
      attachments: pdfDataUrl ? [
        {
          id: `att-${project.id}-${Date.now()}`,
          name: `${(project.clientName || "Plan").replace(/\s+/g, "_")}_${sheetTarget?.drawingNumber || "DWG"}.pdf`,
          type: "application/pdf",
          size: Math.round(pdfDataUrl.length * 0.75),
          dataUrl: pdfDataUrl,
          downloadUrl: getCloudDownloadUrl(project.id, sheetTarget?.id),
          uploadedAt: new Date().toISOString(),
          isPdf: true
        }
      ] : [],
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "deepak@vasthusilpy.com",
      version: 1
    };

    saveCADDrawingRecord(cadRecord, true);
  } catch (err) {
    console.warn("Notice: CAD Vault auto-sync:", err);
  }
}

/**
 * Automatically saves any plan created or edited in Building Plan Templates to Cloud Drive
 * Zero login required for scanning / downloading later.
 */
export async function autoSavePlanToCloud(
  project: BuildingPlanProject,
  sheet?: PlanSheet,
  options?: { forceImmediate?: boolean }
): Promise<CloudSaveResult> {
  const projectId = project.id;
  if (!projectId) return { success: false, error: "Missing project id" };

  // Clear existing debounced timer for this project
  if (pendingSaveTimers.has(projectId)) {
    clearTimeout(pendingSaveTimers.get(projectId));
    pendingSaveTimers.delete(projectId);
  }

  const performUpload = async (): Promise<CloudSaveResult> => {
    try {
      const activeSheet = sheet || project.sheets[0];
      let pdfBase64 = "";

      // Generate vector PDF representation for physical cloud storage
      try {
        const pdfBlob = await generateDirectProjectVectorPdf(project, activeSheet);
        if (pdfBlob && pdfBlob.size > 0) {
          pdfBase64 = await blobToBase64(pdfBlob);
        }
      } catch (pdfErr) {
        console.warn("Notice: Direct PDF rendering for cloud auto-save:", pdfErr);
      }

      // Check Google OAuth token
      const accessToken = getCachedToken();

      // Dispatch to Server-side Cloud Drive API
      const res = await fetch("/api/cloud-plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project,
          sheet: activeSheet,
          pdfBase64,
          accessToken: accessToken || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Cloud save failed (HTTP ${res.status})`);
      }

      const data = await res.json();

      // Sync to CAD Vault Cloud Drive
      syncPlanToCadVault(project, activeSheet, pdfBase64);

      // Notify window listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("vasthusilpy_cloud_plan_synced", {
            detail: {
              projectId,
              cloudId: data.cloudId,
              cloudDownloadUrl: data.cloudDownloadUrl,
              driveViewLink: data.driveViewLink,
              savedAt: data.savedAt
            }
          })
        );
      }

      return {
        success: true,
        cloudId: data.cloudId,
        cloudDownloadUrl: data.cloudDownloadUrl,
        driveViewLink: data.driveViewLink,
        driveDownloadLink: data.driveDownloadLink,
        savedAt: data.savedAt
      };
    } catch (err: any) {
      console.warn("Cloud auto-save error:", err);
      return {
        success: false,
        error: err.message || "Network error while saving to Cloud Drive."
      };
    }
  };

  if (options?.forceImmediate) {
    return await performUpload();
  }

  // Debounced auto-save (800ms)
  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      pendingSaveTimers.delete(projectId);
      const res = await performUpload();
      resolve(res);
    }, 800);
    pendingSaveTimers.set(projectId, timer);
  });
}

/**
 * Fetches a cloud-saved plan from Cloud Drive (Public, zero login required)
 */
export async function fetchCloudPlan(projectId: string): Promise<{
  success: boolean;
  project?: BuildingPlanProject;
  metadata?: any;
  hasPdf?: boolean;
  cloudDownloadUrl?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`/api/cloud-plans/${encodeURIComponent(projectId)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Plan not found on Cloud Drive (${res.status})`
      };
    }
    const data = await res.json();
    return {
      success: true,
      project: data.project,
      metadata: data.metadata,
      hasPdf: data.hasPdf,
      cloudDownloadUrl: data.cloudDownloadUrl
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to connect to Cloud Drive."
    };
  }
}

/**
 * Fetches all registered cloud plans
 */
export async function fetchAllCloudPlans(): Promise<any[]> {
  try {
    const res = await fetch("/api/cloud-plans/all");
    if (!res.ok) return [];
    const data = await res.json();
    return data.plans || [];
  } catch (err) {
    console.warn("Could not fetch all cloud plans:", err);
    return [];
  }
}
