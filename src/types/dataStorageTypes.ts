export type CADCategory =
  | "PLAN"
  | "3D"
  | "ESTIMATE"
  | "SURVEY"
  | "DOCUMENTS"
  | "ARCHITECTURAL_PLAN"
  | "STRUCTURAL_DETAILS"
  | "VASTU_THACHU_SHASTRA"
  | "LSGD_KSMART_PERMIT"
  | "ELEVATION_3D"
  | "MEP_ELECTRICAL_PLUMBING"
  | "LAND_SURVEY_FMB"
  | "SITE_LAYOUT"
  | "ESTIMATE_BOQ"
  | "GENERAL_OFFICE";

export type VaultStandardCategory = "PLAN" | "3D" | "ESTIMATE" | "SURVEY" | "DOCUMENTS";

export function mapToVaultCategory(cat?: string): VaultStandardCategory {
  if (!cat) return "PLAN";
  const c = cat.toUpperCase();
  if (c === "3D" || c.includes("3D") || c.includes("ELEVATION")) return "3D";
  if (c === "ESTIMATE" || c.includes("ESTIMATE") || c.includes("BOQ") || c.includes("COST")) return "ESTIMATE";
  if (c === "SURVEY" || c.includes("SURVEY") || c.includes("FMB") || c.includes("TRAVERSE")) return "SURVEY";
  if (c === "DOCUMENTS" || c.includes("DOCUMENT") || c.includes("OFFICE") || c.includes("PERMIT") || c.includes("LSGD")) return "DOCUMENTS";
  return "PLAN";
}

export type CADFileType = "DWG" | "DXF" | "PDF" | "IMAGE" | "DOC" | "EXCEL" | "CAD_VECTOR" | "OTHER";

export interface CADFolder {
  id: string; // e.g. "folder-vishnu", "folder-deepak", "folder-dibin" or uuid
  name: string; // "VISHNU", "DEEPAK", "DIBIN" or subfolder name
  parentId?: string | null; // null for root folders
  path: string; // e.g. "/VISHNU", "/DEEPAK/Residential", "/DIBIN/Permits"
  color?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isSystemDefault?: boolean;
}

export interface CADAttachment {
  id: string;
  name: string;
  type: string; // MIME type or extension
  size: number; // bytes
  dataUrl?: string; // base64 or object URL for offline/local view
  downloadUrl?: string;
  uploadedAt: string;
  isDwgOrDxf?: boolean;
  isPdf?: boolean;
  isImage?: boolean;
}

export interface CADLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
}

export interface CADEntity {
  id: string;
  type:
    | "line"
    | "polyline"
    | "rect"
    | "circle"
    | "arc"
    | "dimension"
    | "text"
    | "wall"
    | "door"
    | "window"
    | "vastu_grid";
  layer: string;
  color?: string;
  strokeWidth?: number;
  // Geometric properties (in world coordinates - meters or feet)
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  fontSize?: number;
  dimValue?: string;
  rotation?: number;
  wallThickness?: number;
}

export interface CADDrawingData {
  version: string;
  units: "meters" | "feet_inches" | "mm";
  scale: number;
  layers: CADLayer[];
  entities: CADEntity[];
  rasterBackground?: string; // Data URL of floor plan / layout sketch
  rasterOpacity?: number;
  rasterScale?: number;
  rasterOffsetX?: number;
  rasterOffsetY?: number;
}

export interface CADShareSettings {
  isShared: boolean;
  isPublic?: boolean;
  shareToken?: string;
  pin?: string;
  allowDownload: boolean;
  allowEdit?: boolean;
  allowPrinting?: boolean;
  requirePin?: boolean;
  expiresAt?: string;
}

export interface CADDrawingRecord {
  id: string; // e.g. "CAD-2026-001"
  name: string; // e.g. "Keralassery_3BHK_GroundFloor_Vastu_Plan.dwg"
  title: string; // e.g. "Ground Floor Architectural Plan & Vastu Layout"
  folderId: string; // "folder-vishnu" | "folder-deepak" | "folder-dibin" or custom folder ID
  folderPath: string; // "/VISHNU", "/DEEPAK", "/DIBIN", etc.
  projectCode?: string; // e.g. "PRJ-2026-024"
  projectName: string; // e.g. "Santhosh Kumar Residence"
  ownerName?: string; // Owner Name
  clientName?: string; // Client Name (alias)
  mobileNo?: string; // Mobile Number
  clientPhone?: string; // Client Phone (alias)
  facing?: string; // "East" | "West" | "North" | "South" | "North-East" | "North-West" | "South-East" | "South-West"
  bedrooms?: string; // "1 BHK" | "2 BHK" | "3 BHK" | "4 BHK" | "5+ BHK"
  floors?: string; // "Single Floor (Ground)" | "G + 1 (2 Floors)" | "G + 2 (3 Floors)" | "Multi-Storey"
  vasthuChuttu?: string; // e.g. "43 Kol 16 Viral (Dhana Porutham)"
  plotArea?: string; // e.g. "5.5 Cents"
  builtUpArea?: string; // e.g. "1680 Sq.Ft (156 Sq.M)"
  location?: string;
  category: CADCategory;
  customCategory?: string;
  fileType: CADFileType;
  fileSize: number; // in bytes
  keywords: string[]; // e.g. ["keralassery", "3bhk", "north entry", "vastu", "dwg"]
  description?: string;
  notes?: string;
  attachments: CADAttachment[];
  drawingData?: CADDrawingData;
  shareSettings: CADShareSettings;
  googleDriveId?: string;
  googleDriveUrl?: string;
  googleDriveSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // email of creator
  version: number;
  isStarred?: boolean;
}

export interface CADMetadataIndexItem {
  id: string;
  name: string;
  title: string;
  folderId: string;
  folderPath: string;
  projectCode?: string;
  projectName: string;
  ownerName?: string;
  clientName?: string;
  mobileNo?: string;
  facing?: string;
  bedrooms?: string;
  floors?: string;
  vasthuChuttu?: string;
  category: CADCategory;
  fileType: CADFileType;
  fileSize: number;
  keywords: string[];
  attachmentCount: number;
  hasDwgAttachment: boolean;
  hasPdfAttachment: boolean;
  hasImageAttachment: boolean;
  hasCadVector: boolean;
  isStarred?: boolean;
  isShared?: boolean;
  googleDriveSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CADStorageFilter {
  searchTerm: string;
  folderId: "ALL" | string;
  facing: "ALL" | string;
  bedrooms: "ALL" | string;
  floors: "ALL" | string;
  category: "ALL" | CADCategory;
  fileType: "ALL" | CADFileType;
  hasDwgOnly: boolean;
  starredOnly: boolean;
  sharedOnly: boolean;
  dateRange: "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR";
  sortBy: "updatedAt_desc" | "updatedAt_asc" | "name_asc" | "size_desc" | "project_asc" | "owner_asc";
}
