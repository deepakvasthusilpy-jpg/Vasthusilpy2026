export type VasthuKolGrade = "Uttamam" | "Madhyamam" | "Adhamam";

export interface AreaTableRow {
  id: string;
  floor: string; // e.g. "Ground Floor", "First Floor", "Second Floor", "Stair Room"
  proposedSqM: number;
  proposedSqFt: number;
  existingSqM: number;
  existingSqFt: number;
  builtUpSqM: number;
  builtUpSqFt: number;
  floorAreaSqM: number;
  floorAreaSqFt: number;
  // Sub-columns for Proposed & Existing (sqm)
  proposedBuiltUpSqM?: number;
  proposedFloorAreaSqM?: number;
  existingBuiltUpSqM?: number;
  existingFloorAreaSqM?: number;
}

export interface RevisionTableRow {
  id: string;
  rev: string; // e.g. "R0", "R1", "R2"
  date: string; // e.g. "07-09-2026"
  description: string; // e.g. "Initial Submission", "Revised as per client"
  preparedBy: string; // e.g. "CD"
  checkedBy: string; // e.g. "DC"
}

// Architectural Plan Attachment (Multiple per sheet)
export interface PlanAttachment {
  id: string;
  title: string; // e.g. "Ground Floor Plan", "First Floor Plan", "Key Plan", "Site Plan", "Section A-A"
  imageUrl: string;
  fileName?: string;
  x: number; // percentage (0 - 100) or mm offset
  y: number; // percentage (0 - 100) or mm offset
  width: number; // percentage of drawing canvas width (e.g. 48 for 48%)
  height?: number; // percentage of drawing canvas height or auto
  scale: string; // e.g. "1 : 100", "1 : 50", "1 : 200"
  zoom: number; // zoom percentage (50 to 250)
  rotation: number; // 0, 90, 180, 270
  zIndex: number;
  opacity?: number;
  locked?: boolean;
}

export interface SheetMarginConfig {
  leftMm: number; // e.g. 15mm (binding/filing edge)
  rightMm: number; // e.g. 10mm
  topMm: number; // e.g. 10mm
  bottomMm: number; // e.g. 10mm
  presetName: "standard_kerala" | "nbc_sp46" | "compact_10mm" | "full_5mm" | "custom";
}

// Rotatable & Resizable North Sign configuration
export interface NorthSignConfig {
  x: number; // percentage (0 - 100) from left
  y: number; // percentage (0 - 100) from top
  scale: number; // scale multiplier 0.5 to 2.5 (default 1.0)
  rotation: number; // 0 to 360 degrees
  style?: "standard" | "vasthu_ashtadik" | "circle_compass" | "minimal";
  locked?: boolean;
}

// 2D Architectural Symbols & Furniture Types
export type PlanSymbolCategory = "door" | "furniture" | "kitchen" | "sanitary";

export type DoorSwingDirection = "left_in" | "right_in" | "left_out" | "right_out";

export interface PlanSymbolItem {
  id: string;
  type: string; // e.g. "door_single", "door_double", "door_sliding", "bed_single", "bed_double", "bed_king", "chair", "sofa_1seater", "sofa_2seater", "sofa_3seater", "sofa_l_shape", "dining_4seater", "dining_6seater", "kitchen_sink_single", "kitchen_sink_double", "kitchen_slab_straight", "kitchen_slab_l", "kitchen_gas_stove", "toilet_commode", "wash_basin";
  name: string;
  category: PlanSymbolCategory;
  x: number; // percentage of canvas (0 - 100)
  y: number; // percentage of canvas (0 - 100)
  width: number; // percentage or relative size (e.g. 6 to 25)
  height: number; // percentage or relative size
  rotation: number; // 0, 45, 90, 135, 180, 225, 270, 315
  flipH?: boolean; // Flip horizontal (e.g. change swing hinge or left/right mirror)
  flipV?: boolean; // Flip vertical (e.g. swing inward vs outward)
  doorSwing?: DoorSwingDirection;
  doorOpenAngle?: number; // 90, 45, 180
  scale?: number; // scale multiplier 0.5 to 3.0
  label?: string; // e.g. "D1", "D2", "Bed", "Slab"
  color?: string; // stroke color
  fillColor?: string; // fill color
  zIndex?: number;
}

export interface PlanSheet {
  id: string;
  sheetNumber: number; // 1, 2, ...
  drawingNumber: string; // {{DRAWING_NUMBER}} e.g. "DWG-01", "A-101"
  drawingName: string; // {{DRAWING_NAME}} e.g. "PROPOSED RESIDENCE - GROUND FLOOR PLAN"
  floorName: string; // {{FLOOR_NAME}} e.g. "Ground Floor", "First Floor", "Site Plan"
  scale: string; // {{SCALE}} e.g. "1 : 100"
  date: string; // {{DATE}} e.g. "07-09-2026"
  revision: string; // {{REVISION}} e.g. "R0"
  
  // Single/primary plan graphic (backward compatible)
  planImageUrl?: string; // Data URL or Image URL
  planFileName?: string;
  zoom: number; // percentage, e.g. 100
  panX: number; // offset in px
  panY: number; // offset in px
  rotation: number; // 0, 90, 180, 270
  fitMode: "contain" | "fill" | "cover";

  // Multiple plan attachments on the same sheet
  attachments?: PlanAttachment[];

  // 2D Doors & Furniture symbols placed on this sheet
  symbols?: PlanSymbolItem[];

  // Rotatable & Resizable North Indicator (0° to 360°)
  northRotation?: number; // 0 is True North upward
  showNorthArrow?: boolean;
  northSign?: NorthSignConfig;

  // Printable sheet margins
  marginConfig?: SheetMarginConfig;

  // QR Code on sheet
  showQrCode?: boolean;

  // Optional sheet-specific notes
  sheetNotes?: string;
}

export interface BuildingPlanProject {
  id: string;
  projectTitle: string;
  createdAt: string;
  updatedAt: string;

  // Layout & Sheet Setup
  sheetOrientation: "landscape" | "portrait";
  paperSize: "A4" | "A3";
  titleBlockPosition: "right" | "bottom";
  stripWidthMm: number; // 70mm standard right strip or 45mm bottom strip
  bottomStripHeightPct?: number; // 18% - 38% adjustable bottom title block height
  marginConfig?: SheetMarginConfig;

  // 1. Logo Box & Office Branding
  officeName: string; // {{OFFICE_NAME}} e.g. "VASTHUSILPY KERALASSERY"
  officeAddress: string;
  officeMobile: string; // "7012383137"
  officeWhatsapp: string; // "+918848241463"
  officeEmail: string;
  officeWebsite: string;
  logoUrl?: string;

  // 2. Licensed Professional Block & Engineer Contact
  licenseeName: string; // {{LICENSEY_NAME}}
  licenseNumber: string; // {{LICENSE_NUMBER}}
  registrationNumber: string; // {{REGISTRATION_NUMBER}}
  departmentAuthority: string; // e.g. "Dept. of Urban Affairs, Govt. of Kerala"
  engineerSealId?: string;
  engineerCallNumber: string; // "7012383137"
  engineerWhatsappNumber: string; // "+918848241463"

  // 3. Project Info (Global Defaults)
  projectLocation: string; // {{PROJECT_LOCATION}}
  clientName: string; // {{CLIENT_NAME}}
  defaultScale: string; // {{SCALE}}
  defaultDate: string; // {{DATE}}
  defaultRevision: string; // {{REVISION}}

  // 4. Area Table Grid
  areaTable: AreaTableRow[];
  areaUnit: "sqm" | "sqft" | "both";

  // 5. Vasthu Kol Alavu
  vasthuGrade: VasthuKolGrade; // Uttamam / Madhyamam / Adhamam
  vasthuPerimeterKol: string; // e.g. "28 Kol 12 Viral"
  vasthuPerimeterMeter: string; // e.g. "22.40 m"
  vasthuRemarks: string; // e.g. "Ayadi Shadvarga - Dhana Yoni (1) & Shubha Nakshatram"

  // 6. Revision Table Grid
  revisionTable: RevisionTableRow[];

  // 7. Global North Sign & QR Code Provisions
  defaultNorthRotation: number; // 0° - 360°
  enableQrScanning: boolean;

  // 8. Plan Sheets
  sheets: PlanSheet[];

  // 9. Cloud Drive & Auto-Sync
  cloudSaved?: boolean;
  cloudSyncAt?: string;
  cloudFileId?: string;
  cloudDownloadUrl?: string;
  driveFileId?: string;
  driveViewLink?: string;
  driveDownloadLink?: string;
}
