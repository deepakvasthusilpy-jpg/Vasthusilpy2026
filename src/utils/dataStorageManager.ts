import {
  CADDrawingRecord,
  CADMetadataIndexItem,
  CADStorageFilter,
  CADAttachment,
  CADDrawingData,
  CADEntity,
  CADFolder
} from "../types/dataStorageTypes";
import { broadcastMessage } from "./broadcastSync";

export const CAD_VAULT_STORAGE_KEY = "vasthusilpy_cad_files_vault_v3";
export const CAD_METADATA_INDEX_KEY = "vasthusilpy_cad_metadata_index_v3";
export const CAD_FOLDERS_STORAGE_KEY = "vasthusilpy_cad_folders_v3";
export const CAD_SETTINGS_KEY = "vasthusilpy_cad_vault_settings_v3";

// Initial 3 Default Top-Level Folders requested by user
export const DEFAULT_ROOT_FOLDERS: CADFolder[] = [
  {
    id: "folder-vishnu",
    name: "VISHNU",
    parentId: null,
    path: "/VISHNU",
    color: "#38bdf8",
    description: "Architectural & Civil Project Drawings Workspace for Vishnu",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystemDefault: true
  },
  {
    id: "folder-deepak",
    name: "DEEPAK",
    parentId: null,
    path: "/DEEPAK",
    color: "#f59e0b",
    description: "Chief Architect & Vasthu Vidya Engineering Drawings Vault",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystemDefault: true
  },
  {
    id: "folder-dibin",
    name: "DIBIN",
    parentId: null,
    path: "/DIBIN",
    color: "#10b981",
    description: "Structural, Site & K-SMART Permit Drawing Archives for Dibin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystemDefault: true
  }
];

// Clean initial empty file list (all old files wiped)
export const INITIAL_CAD_FILES: CADDrawingRecord[] = [];

// Authorized Admin Emails
export const AUTHORIZED_CAD_VAULT_EMAILS = [
  "deepak.vasthusilpy@gmail.com",
  "dibindeepak1@gmail.com"
];

export function isAuthorizedCADUser(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return AUTHORIZED_CAD_VAULT_EMAILS.some((e) => e.toLowerCase() === clean);
}

// ==========================================
// FOLDER STORAGE MANAGEMENT
// ==========================================

export function getStoredCADFolders(): CADFolder[] {
  try {
    const raw = localStorage.getItem(CAD_FOLDERS_STORAGE_KEY);
    if (!raw) {
      // Initialize with default 3 folders
      saveStoredCADFolders(DEFAULT_ROOT_FOLDERS);
      return DEFAULT_ROOT_FOLDERS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Verify if default 3 folders exist; if not, merge them in
      const hasVishnu = parsed.some((f: CADFolder) => f.name.toUpperCase() === "VISHNU");
      const hasDeepak = parsed.some((f: CADFolder) => f.name.toUpperCase() === "DEEPAK");
      const hasDibin = parsed.some((f: CADFolder) => f.name.toUpperCase() === "DIBIN");

      let updated = [...parsed];
      if (!hasVishnu) updated.unshift(DEFAULT_ROOT_FOLDERS[0]);
      if (!hasDeepak) updated.unshift(DEFAULT_ROOT_FOLDERS[1]);
      if (!hasDibin) updated.unshift(DEFAULT_ROOT_FOLDERS[2]);

      if (updated.length !== parsed.length) {
        saveStoredCADFolders(updated);
      }
      return updated;
    }
    saveStoredCADFolders(DEFAULT_ROOT_FOLDERS);
    return DEFAULT_ROOT_FOLDERS;
  } catch (e) {
    console.error("Error reading stored CAD folders:", e);
    return DEFAULT_ROOT_FOLDERS;
  }
}

export function saveStoredCADFolders(folders: CADFolder[]): void {
  try {
    localStorage.setItem(CAD_FOLDERS_STORAGE_KEY, JSON.stringify(folders));
    broadcastMessage({ type: "CAD_FOLDERS_UPDATED", data: { count: folders.length } });
  } catch (e) {
    console.error("Error saving CAD folders:", e);
  }
}

export function createCADFolder(
  name: string,
  parentId?: string | null,
  description?: string,
  color?: string
): CADFolder {
  const folders = getStoredCADFolders();
  const cleanName = name.trim();
  
  // Calculate folder path
  let parentPath = "";
  if (parentId) {
    const parent = folders.find((f) => f.id === parentId);
    if (parent) {
      parentPath = parent.path;
    }
  }
  const folderPath = `${parentPath}/${cleanName}`.replace(/\/+/g, "/");

  const newFolder: CADFolder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: cleanName,
    parentId: parentId || null,
    path: folderPath,
    color: color || "#38bdf8",
    description: description?.trim() || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isSystemDefault: false
  };

  const updatedFolders = [...folders, newFolder];
  saveStoredCADFolders(updatedFolders);
  return newFolder;
}

export function updateCADFolder(folder: CADFolder): void {
  const folders = getStoredCADFolders();
  const updated = folders.map((f) => (f.id === folder.id ? { ...folder, updatedAt: new Date().toISOString() } : f));
  saveStoredCADFolders(updated);
}

export function deleteCADFolder(folderId: string): { success: boolean; error?: string } {
  const folders = getStoredCADFolders();
  const target = folders.find((f) => f.id === folderId);
  
  if (!target) {
    return { success: false, error: "Folder not found." };
  }

  // Find all subfolder IDs recursively
  const getSubfolderIds = (id: string): string[] => {
    const directChildren = folders.filter((f) => f.parentId === id).map((f) => f.id);
    let all: string[] = [...directChildren];
    for (const childId of directChildren) {
      all = [...all, ...getSubfolderIds(childId)];
    }
    return all;
  };

  const toDeleteFolderIds = [folderId, ...getSubfolderIds(folderId)];
  const remainingFolders = folders.filter((f) => !toDeleteFolderIds.includes(f.id));

  // Relocate or delete files in these folders
  const files = getStoredCADFiles();
  const defaultFallbackFolder = remainingFolders.find((f) => f.id === "folder-deepak") || remainingFolders[0];
  
  const updatedFiles = files.map((file) => {
    if (toDeleteFolderIds.includes(file.folderId)) {
      return {
        ...file,
        folderId: defaultFallbackFolder ? defaultFallbackFolder.id : "folder-deepak",
        folderPath: defaultFallbackFolder ? defaultFallbackFolder.path : "/DEEPAK",
        updatedAt: new Date().toISOString()
      };
    }
    return file;
  });

  saveStoredCADFolders(remainingFolders);
  saveAllCADFiles(updatedFiles);
  return { success: true };
}

// ==========================================
// FILE STORAGE & METADATA MANAGEMENT
// ==========================================

export function getStoredCADFiles(): CADDrawingRecord[] {
  try {
    const raw = localStorage.getItem(CAD_VAULT_STORAGE_KEY);
    if (!raw) {
      // Check legacy key if exists, or initialize fresh empty list
      const legacyRaw = localStorage.getItem("vasthusilpy_cad_files_vault_v2");
      if (legacyRaw) {
        localStorage.removeItem("vasthusilpy_cad_files_vault_v2");
      }
      saveAllCADFiles(INITIAL_CAD_FILES);
      return INITIAL_CAD_FILES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_CAD_FILES;
  } catch (e) {
    console.error("Error reading stored CAD files:", e);
    return INITIAL_CAD_FILES;
  }
}

export function saveAllCADFiles(files: CADDrawingRecord[], skipBroadcast = false): void {
  try {
    localStorage.setItem(CAD_VAULT_STORAGE_KEY, JSON.stringify(files));
    
    // Generate and save lightweight metadata index
    const index = generateCADMetadataIndex(files);
    localStorage.setItem(CAD_METADATA_INDEX_KEY, JSON.stringify(index));

    if (!skipBroadcast) {
      broadcastMessage({ type: "CAD_FILES_UPDATED", data: { count: files.length } });
    }
  } catch (e) {
    console.error("Error saving all CAD files:", e);
  }
}

export function saveCADDrawingRecord(record: CADDrawingRecord, skipBroadcast = false): CADDrawingRecord {
  const files = getStoredCADFiles();
  const index = files.findIndex((f) => f.id === record.id);
  
  const folders = getStoredCADFolders();
  const folder = folders.find((f) => f.id === record.folderId);
  const folderPath = folder ? folder.path : record.folderPath || "/DEEPAK";

  const updatedRecord: CADDrawingRecord = {
    ...record,
    folderPath,
    ownerName: record.ownerName || record.clientName || "",
    clientName: record.ownerName || record.clientName || "",
    mobileNo: record.mobileNo || record.clientPhone || "",
    clientPhone: record.mobileNo || record.clientPhone || "",
    updatedAt: new Date().toISOString()
  };

  let updatedFiles: CADDrawingRecord[];
  if (index >= 0) {
    updatedFiles = [...files];
    updatedFiles[index] = updatedRecord;
  } else {
    updatedFiles = [updatedRecord, ...files];
  }

  saveAllCADFiles(updatedFiles, skipBroadcast);
  return updatedRecord;
}

export function getCADDrawingRecordById(id: string): CADDrawingRecord | null {
  const files = getStoredCADFiles();
  return files.find((f) => f.id === id) || null;
}

export function getCADDrawingByShareToken(token: string): CADDrawingRecord | null {
  if (!token) return null;
  const clean = decodeURIComponent(token).trim();
  const files = getStoredCADFiles();

  // 1. Match by shareToken
  let match = files.find((f) => f.shareSettings?.shareToken === clean);
  if (match) return match;

  // 2. Match by file id
  match = files.find((f) => f.id === clean || f.id.toLowerCase() === clean.toLowerCase());
  if (match) return match;

  // 3. Match case-insensitively
  match = files.find((f) => f.shareSettings?.shareToken?.toLowerCase() === clean.toLowerCase());
  if (match) return match;

  return null;
}

export function toggleStarCADDrawing(id: string): boolean {
  const files = getStoredCADFiles();
  const file = files.find((f) => f.id === id);
  if (file) {
    file.isStarred = !file.isStarred;
    file.updatedAt = new Date().toISOString();
    saveAllCADFiles(files);
    return file.isStarred;
  }
  return false;
}

export const getCADMetadataIndex = getLocalCADMetadataIndex;

export function deleteCADDrawingRecord(id: string): void {
  const files = getStoredCADFiles();
  const remaining = files.filter((f) => f.id !== id);
  saveAllCADFiles(remaining);
}

export function deleteAllCADFiles(folderId?: string): void {
  if (folderId && folderId !== "ALL") {
    const files = getStoredCADFiles();
    const remaining = files.filter((f) => f.folderId !== folderId);
    saveAllCADFiles(remaining);
  } else {
    saveAllCADFiles([]);
  }
}

/**
 * Completely Wipes All CAD Storage & Settings and initializes 3 root folders (VISHNU, DEEPAK, DIBIN)
 */
export function resetAndWipeCadStorage(): void {
  localStorage.removeItem(CAD_VAULT_STORAGE_KEY);
  localStorage.removeItem(CAD_METADATA_INDEX_KEY);
  localStorage.removeItem(CAD_FOLDERS_STORAGE_KEY);
  localStorage.removeItem(CAD_SETTINGS_KEY);
  localStorage.removeItem("vasthusilpy_cad_files_vault_v2");
  localStorage.removeItem("vasthusilpy_cad_metadata_index_v2");
  
  saveStoredCADFolders(DEFAULT_ROOT_FOLDERS);
  saveAllCADFiles([]);
}

// ==========================================
// METADATA INDEXING & SEARCH
// ==========================================

export function generateCADMetadataIndex(files: CADDrawingRecord[]): CADMetadataIndexItem[] {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    title: file.title,
    folderId: file.folderId || "folder-deepak",
    folderPath: file.folderPath || "/DEEPAK",
    projectCode: file.projectCode,
    projectName: file.projectName,
    ownerName: file.ownerName || file.clientName,
    clientName: file.ownerName || file.clientName,
    mobileNo: file.mobileNo || file.clientPhone,
    facing: file.facing,
    bedrooms: file.bedrooms,
    floors: file.floors,
    vasthuChuttu: file.vasthuChuttu,
    category: file.category,
    fileType: file.fileType,
    fileSize: file.fileSize,
    keywords: file.keywords || [],
    attachmentCount: file.attachments?.length || 0,
    hasDwgAttachment: (file.attachments || []).some((a) => a.isDwgOrDxf || a.name.toLowerCase().endsWith(".dwg")),
    hasPdfAttachment: (file.attachments || []).some((a) => a.isPdf || a.name.toLowerCase().endsWith(".pdf")),
    hasImageAttachment: (file.attachments || []).some((a) => a.isImage || /\.(png|jpe?g|webp|svg)$/i.test(a.name)),
    hasCadVector: Boolean(file.drawingData && file.drawingData.entities && file.drawingData.entities.length > 0),
    isStarred: file.isStarred,
    isShared: file.shareSettings?.isShared,
    googleDriveSyncedAt: file.googleDriveSyncedAt,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt
  }));
}

export function getLocalCADMetadataIndex(): CADMetadataIndexItem[] {
  try {
    const raw = localStorage.getItem(CAD_METADATA_INDEX_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    const files = getStoredCADFiles();
    return generateCADMetadataIndex(files);
  } catch (e) {
    console.error("Error reading local CAD metadata index:", e);
    return [];
  }
}

/**
 * High-precision Search & Filter supporting Name, Owner, Mobile, Facing, Bedrooms, Floors, Vasthu Chuttu, Keywords, Folders
 */
export function searchCADIndex(
  filter: CADStorageFilter,
  indexList: CADMetadataIndexItem[]
): CADMetadataIndexItem[] {
  const searchTerms = filter.searchTerm
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return indexList
    .filter((item) => {
      // 1. Folder Filter
      if (filter.folderId && filter.folderId !== "ALL") {
        if (item.folderId !== filter.folderId) {
          return false;
        }
      }

      // 2. Facing Filter
      if (filter.facing && filter.facing !== "ALL") {
        if (!item.facing || item.facing.toLowerCase() !== filter.facing.toLowerCase()) {
          return false;
        }
      }

      // 3. Bedrooms Filter
      if (filter.bedrooms && filter.bedrooms !== "ALL") {
        if (!item.bedrooms || !item.bedrooms.toLowerCase().includes(filter.bedrooms.toLowerCase())) {
          return false;
        }
      }

      // 4. Floors Filter
      if (filter.floors && filter.floors !== "ALL") {
        if (!item.floors || !item.floors.toLowerCase().includes(filter.floors.toLowerCase())) {
          return false;
        }
      }

      // 5. Category Filter
      if (filter.category !== "ALL" && item.category !== filter.category) {
        return false;
      }

      // 6. File Type Filter
      if (filter.fileType !== "ALL" && item.fileType !== filter.fileType) {
        return false;
      }

      // 7. DWG only
      if (filter.hasDwgOnly && !item.hasDwgAttachment && item.fileType !== "DWG") {
        return false;
      }

      // 8. Starred only
      if (filter.starredOnly && !item.isStarred) {
        return false;
      }

      // 9. Shared only
      if (filter.sharedOnly && !item.isShared) {
        return false;
      }

      // 10. Date Range
      if (filter.dateRange !== "ALL") {
        const itemDate = new Date(item.updatedAt || item.createdAt).getTime();
        const now = Date.now();
        if (filter.dateRange === "TODAY") {
          const oneDay = 24 * 60 * 60 * 1000;
          if (now - itemDate > oneDay) return false;
        } else if (filter.dateRange === "THIS_WEEK") {
          const oneWeek = 7 * 24 * 60 * 60 * 1000;
          if (now - itemDate > oneWeek) return false;
        } else if (filter.dateRange === "THIS_MONTH") {
          const oneMonth = 30 * 24 * 60 * 60 * 1000;
          if (now - itemDate > oneMonth) return false;
        } else if (filter.dateRange === "THIS_YEAR") {
          const oneYear = 365 * 24 * 60 * 60 * 1000;
          if (now - itemDate > oneYear) return false;
        }
      }

      // 11. Multi-keyword fuzzy and tokenized search across all metadata fields
      if (searchTerms.length > 0) {
        const searchableBlob = [
          item.name,
          item.title,
          item.projectName,
          item.ownerName || "",
          item.clientName || "",
          item.mobileNo || "",
          item.facing || "",
          item.bedrooms || "",
          item.floors || "",
          item.vasthuChuttu || "",
          item.folderPath || "",
          item.projectCode || "",
          item.category,
          item.fileType,
          ...(item.keywords || [])
        ]
          .join(" ")
          .toLowerCase();

        const matchesAllTerms = searchTerms.every((term) => searchableBlob.includes(term));
        if (!matchesAllTerms) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filter.sortBy === "updatedAt_desc") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (filter.sortBy === "updatedAt_asc") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (filter.sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (filter.sortBy === "size_desc") {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      if (filter.sortBy === "project_asc") {
        return (a.projectName || "").localeCompare(b.projectName || "");
      }
      if (filter.sortBy === "owner_asc") {
        return (a.ownerName || a.clientName || "").localeCompare(b.ownerName || b.clientName || "");
      }
      return 0;
    });
}

// ==========================================
// IMPORT & EXPORT UTILITIES
// ==========================================

export function exportOfficeCADVaultJSON(folderId?: string): string {
  let files = getStoredCADFiles();
  let folders = getStoredCADFolders();

  if (folderId && folderId !== "ALL") {
    files = files.filter((f) => f.folderId === folderId);
  }

  const exportPayload = {
    version: "3.0",
    exportDate: new Date().toISOString(),
    exportedBy: "Vasthusilpy CAD Vault Engine",
    folders,
    files
  };

  return JSON.stringify(exportPayload, null, 2);
}

export function exportCADVaultAsJson(folderId?: string): void {
  const jsonStr = exportOfficeCADVaultJSON(folderId);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Vasthusilpy_CAD_Vault_Backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importCADVaultFromJson(jsonString: string): number {
  const res = importOfficeCADVaultJSON(jsonString);
  return res.success ? res.count : -1;
}

export function importOfficeCADVaultJSON(
  jsonString: string,
  targetFolderId?: string
): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    let incomingFiles: CADDrawingRecord[] = [];
    let incomingFolders: CADFolder[] = [];

    if (Array.isArray(data)) {
      incomingFiles = data;
    } else if (data && typeof data === "object") {
      if (Array.isArray(data.files)) {
        incomingFiles = data.files;
      }
      if (Array.isArray(data.folders)) {
        incomingFolders = data.folders;
      }
    }

    if (incomingFiles.length === 0 && incomingFolders.length === 0) {
      return { success: false, count: 0, error: "No valid CAD drawings or folders found in JSON." };
    }

    // Merge folders
    if (incomingFolders.length > 0) {
      const existingFolders = getStoredCADFolders();
      const folderMap = new Map<string, CADFolder>();
      existingFolders.forEach((f) => folderMap.set(f.id, f));
      incomingFolders.forEach((f) => folderMap.set(f.id, f));
      saveStoredCADFolders(Array.from(folderMap.values()));
    }

    // Merge files
    const existingFiles = getStoredCADFiles();
    const fileMap = new Map<string, CADDrawingRecord>();
    existingFiles.forEach((f) => fileMap.set(f.id, f));

    const folders = getStoredCADFolders();
    const defaultFolder = folders.find((f) => f.id === targetFolderId) || folders[0];

    incomingFiles.forEach((f) => {
      const assignedFolderId = targetFolderId || f.folderId || defaultFolder.id;
      const assignedFolder = folders.find((fold) => fold.id === assignedFolderId) || defaultFolder;
      
      const record: CADDrawingRecord = {
        ...f,
        folderId: assignedFolderId,
        folderPath: assignedFolder.path,
        ownerName: f.ownerName || f.clientName || "",
        clientName: f.ownerName || f.clientName || "",
        mobileNo: f.mobileNo || f.clientPhone || "",
        clientPhone: f.mobileNo || f.clientPhone || "",
        updatedAt: new Date().toISOString()
      };
      fileMap.set(f.id, record);
    });

    const merged = Array.from(fileMap.values());
    saveAllCADFiles(merged);

    return { success: true, count: incomingFiles.length };
  } catch (e: any) {
    return { success: false, count: 0, error: e.message || "Invalid JSON format." };
  }
}

// ==========================================
// DXF GENERATION & EXPORT
// ==========================================

export function generateDxfString(drawingData: CADDrawingData, title = "Vasthusilpy CAD Drawing"): string {
  const lines: string[] = [];

  // DXF HEADER
  lines.push("0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1015", "0", "ENDSEC");

  // DXF TABLES (Layers)
  lines.push("0", "SECTION", "2", "TABLES", "0", "TABLE", "2", "LAYER", "70", `${drawingData.layers?.length || 1}`);
  for (const layer of drawingData.layers || []) {
    lines.push("0", "LAYER", "2", layer.name || "0", "70", "0", "62", "7", "6", "CONTINUOUS");
  }
  lines.push("0", "ENDTAB", "0", "ENDSEC");

  // DXF ENTITIES
  lines.push("0", "SECTION", "2", "ENTITIES");

  for (const entity of drawingData.entities || []) {
    const layerName = entity.layer || "0";

    if (entity.type === "line" && entity.x1 !== undefined && entity.y1 !== undefined && entity.x2 !== undefined && entity.y2 !== undefined) {
      lines.push("0", "LINE", "8", layerName, "10", `${entity.x1}`, "20", `${entity.y1}`, "30", "0.0", "11", `${entity.x2}`, "21", `${entity.y2}`, "31", "0.0");
    } else if (entity.type === "rect" && entity.x !== undefined && entity.y !== undefined && entity.width !== undefined && entity.height !== undefined) {
      const x1 = entity.x;
      const y1 = entity.y;
      const x2 = entity.x + entity.width;
      const y2 = entity.y + entity.height;
      // 4 lines for rectangle
      lines.push("0", "LINE", "8", layerName, "10", `${x1}`, "20", `${y1}`, "30", "0.0", "11", `${x2}`, "21", `${y1}`, "31", "0.0");
      lines.push("0", "LINE", "8", layerName, "10", `${x2}`, "20", `${y1}`, "30", "0.0", "11", `${x2}`, "21", `${y2}`, "31", "0.0");
      lines.push("0", "LINE", "8", layerName, "10", `${x2}`, "20", `${y2}`, "30", "0.0", "11", `${x1}`, "21", `${y2}`, "31", "0.0");
      lines.push("0", "LINE", "8", layerName, "10", `${x1}`, "20", `${y2}`, "30", "0.0", "11", `${x1}`, "21", `${y1}`, "31", "0.0");
    } else if (entity.type === "circle" && entity.x !== undefined && entity.y !== undefined && entity.radius !== undefined) {
      lines.push("0", "CIRCLE", "8", layerName, "10", `${entity.x}`, "20", `${entity.y}`, "30", "0.0", "40", `${entity.radius}`);
    } else if (entity.type === "text" && entity.x !== undefined && entity.y !== undefined && entity.text) {
      lines.push("0", "TEXT", "8", layerName, "10", `${entity.x}`, "20", `${entity.y}`, "30", "0.0", "40", `${entity.fontSize || 12}`, "1", entity.text);
    }
  }

  lines.push("0", "ENDSEC", "0", "EOF");
  return lines.join("\n");
}

export function triggerDxfDownload(drawingData: CADDrawingData, filename = "Vasthusilpy_Drawing.dxf"): void {
  const dxfContent = generateDxfString(drawingData, filename);
  const blob = new Blob([dxfContent], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".dxf") ? filename : `${filename}.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAttachment(att: CADAttachment, fallbackName = "CAD_File"): void {
  if (att.dataUrl) {
    const a = document.createElement("a");
    a.href = att.dataUrl;
    a.download = att.name || fallbackName;
    a.click();
  } else if (att.downloadUrl) {
    window.open(att.downloadUrl, "_blank");
  } else {
    // Generate text/binary placeholder blob if missing dataUrl
    const blob = new Blob([`Vasthusilpy CAD Storage Attachment: ${att.name}\nSize: ${att.size} bytes\nDate: ${att.uploadedAt}`], {
      type: att.type || "application/octet-stream"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = att.name || fallbackName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
