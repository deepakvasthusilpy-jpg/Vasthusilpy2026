import { BuildingPlanProject } from "../types/buildingPlanTemplate";
import { INITIAL_BUILDING_PLAN_PROJECT, SAMPLE_GROUND_FLOOR_SVG, SAMPLE_FIRST_FLOOR_SVG } from "./sampleBuildingPlans";
import { VASTHUSILPY_LOGO_DATA_URL } from "./vasthusilpyLogo";
import { autoSavePlanToCloud } from "../utils/cloudPlanSync";

export const PROJECTS_STORAGE_KEY = "VAS_BUILDING_PLAN_PROJECTS_LIST";
export const ACTIVE_PROJECT_ID_KEY = "VAS_ACTIVE_BUILDING_PLAN_ID";

// Second sample project for rich multi-project dashboard experience
export const SAMPLE_COMMERCIAL_PROJECT: BuildingPlanProject = {
  id: "proj-commercial-02",
  projectTitle: "Commercial Complex & Diagnostic Clinic",
  createdAt: "2026-08-20",
  updatedAt: "2026-09-07",
  sheetOrientation: "landscape",
  paperSize: "A4",
  titleBlockPosition: "right",
  stripWidthMm: 70,
  marginConfig: {
    leftMm: 15,
    rightMm: 10,
    topMm: 10,
    bottomMm: 10,
    presetName: "standard_kerala"
  },

  officeName: "VASTHUSILPY KERALASSERY",
  officeAddress: "Main Road, Keralassery, Palakkad - 678641, Kerala",
  officeMobile: "7012383137",
  officeWhatsapp: "+918848241463",
  officeEmail: "deepak.vasthusilpy@gmail.com",
  officeWebsite: "www.vasthusilpy.com",
  logoUrl: VASTHUSILPY_LOGO_DATA_URL,

  licenseeName: "Deepak .C",
  licenseNumber: "SUPERVISOR-A (Civil) & Vasthu Silpy",
  registrationNumber: "E-2050/08/14087/KKD/318/2018/CA",
  departmentAuthority: "Dept. of Urban Affairs, Govt. of Kerala",
  engineerSealId: "eng_deepak",
  engineerCallNumber: "7012383137",
  engineerWhatsappNumber: "+918848241463",
  defaultNorthRotation: 0,
  enableQrScanning: true,

  projectLocation: "Resurvey No: 182/4, Ward 12, Perinthalmanna Municipality, Malappuram",
  clientName: "Dr. Ananthakrishnan & Partners",
  defaultScale: "1 : 100",
  defaultDate: "07-09-2026",
  defaultRevision: "R0",

  areaTable: [
    {
      id: "c-row-1",
      floor: "Ground Floor (Pharmacy & OPD)",
      proposedSqM: 182.40,
      proposedSqFt: 1963.33,
      existingSqM: 0,
      existingSqFt: 0,
      builtUpSqM: 182.40,
      builtUpSqFt: 1963.33,
      floorAreaSqM: 172.50,
      floorAreaSqFt: 1856.77
    },
    {
      id: "c-row-2",
      floor: "First Floor (Diagnostic Lab & Scan)",
      proposedSqM: 165.80,
      proposedSqFt: 1784.65,
      existingSqM: 0,
      existingSqFt: 0,
      builtUpSqM: 165.80,
      builtUpSqFt: 1784.65,
      floorAreaSqM: 156.90,
      floorAreaSqFt: 1688.85
    }
  ],
  areaUnit: "both",

  vasthuGrade: "Uttamam",
  vasthuPerimeterKol: "36 Kol 8 Viral",
  vasthuPerimeterMeter: "28.80 m",
  vasthuRemarks: "Commercial Ayadi Shadvarga - Dhana Yoni (1) with North-East Entry",

  revisionTable: [
    {
      id: "c-rev-0",
      rev: "R0",
      date: "07-09-2026",
      description: "Initial K-SMART LSGD Submission",
      preparedBy: "PK",
      checkedBy: "DC"
    }
  ],

  sheets: [
    {
      id: "c-sheet-1",
      sheetNumber: 1,
      drawingNumber: "DWG-COMM-2026/01",
      drawingName: "PROPOSED CLINIC & LAB - GROUND FLOOR PLAN",
      floorName: "Ground Floor Plan",
      scale: "1 : 100",
      date: "07-09-2026",
      revision: "R0",
      planImageUrl: SAMPLE_GROUND_FLOOR_SVG,
      planFileName: "Ground_Floor_Commercial.svg",
      zoom: 100,
      panX: 0,
      panY: 0,
      rotation: 0,
      fitMode: "contain",
      sheetNotes: "Plinth Area: 182.40 Sq.M. Accessible ramps with 1:12 slope provided."
    },
    {
      id: "c-sheet-2",
      sheetNumber: 2,
      drawingNumber: "DWG-COMM-2026/02",
      drawingName: "PROPOSED CLINIC & LAB - FIRST FLOOR PLAN",
      floorName: "First Floor Plan",
      scale: "1 : 100",
      date: "07-09-2026",
      revision: "R0",
      planImageUrl: SAMPLE_FIRST_FLOOR_SVG,
      planFileName: "First_Floor_Commercial.svg",
      zoom: 100,
      panX: 0,
      panY: 0,
      rotation: 0,
      fitMode: "contain",
      sheetNotes: "First Floor Plinth Area: 165.80 Sq.M. Fire escape staircase as per KPBR."
    }
  ]
};

function hydrateProject(p: BuildingPlanProject): BuildingPlanProject {
  const needsLogo = !p.logoUrl || p.logoUrl.trim() === "";
  const logo = needsLogo ? VASTHUSILPY_LOGO_DATA_URL : p.logoUrl;
  const callNum = p.engineerCallNumber || "7012383137";
  const waNum = p.engineerWhatsappNumber || "+918848241463";

  const sheets = (p.sheets || []).map((sheet, idx) => {
    const hasAttachments = sheet.attachments && sheet.attachments.length > 0;
    const attachments = hasAttachments
      ? sheet.attachments!
      : sheet.planImageUrl
      ? [
          {
            id: `att-${sheet.id || idx}-1`,
            title: sheet.floorName || sheet.drawingName || "Main Architectural Plan",
            imageUrl: sheet.planImageUrl,
            fileName: sheet.planFileName || "drawing.svg",
            x: 4,
            y: 5,
            width: 92,
            scale: sheet.scale || "1 : 100",
            zoom: sheet.zoom || 100,
            rotation: sheet.rotation || 0,
            zIndex: 1
          }
        ]
      : [];

    return {
      ...sheet,
      northRotation: typeof sheet.northRotation === "number" ? sheet.northRotation : 0,
      showNorthArrow: sheet.showNorthArrow !== false,
      showQrCode: sheet.showQrCode !== false,
      attachments
    };
  });

  return {
    ...p,
    officeName: p.officeName || "VASTHUSILPY KERALASSERY",
    officeMobile: p.officeMobile || "7012383137",
    officeWhatsapp: p.officeWhatsapp || "+918848241463",
    engineerCallNumber: callNum,
    engineerWhatsappNumber: waNum,
    logoUrl: logo,
    defaultNorthRotation: typeof p.defaultNorthRotation === "number" ? p.defaultNorthRotation : 0,
    enableQrScanning: p.enableQrScanning !== false,
    marginConfig: p.marginConfig || {
      leftMm: 15,
      rightMm: 10,
      topMm: 10,
      bottomMm: 10,
      presetName: "standard_kerala"
    },
    sheets
  };
}

export function loadBuildingPlanProjects(): BuildingPlanProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(hydrateProject);
      }
    }
  } catch (err) {
    console.warn("Failed to read building plan projects from storage:", err);
  }

  // Also check legacy single project key
  try {
    const singleRaw = localStorage.getItem("VAS_BUILDING_PLAN_PROJECT");
    if (singleRaw) {
      const single = JSON.parse(singleRaw);
      if (single && single.id && single.sheets) {
        const initialList = [hydrateProject(single), SAMPLE_COMMERCIAL_PROJECT];
        saveBuildingPlanProjects(initialList);
        return initialList;
      }
    }
  } catch (err) {
    console.warn("Failed to check legacy single project key:", err);
  }

  // Fallback default list
  const defaults = [INITIAL_BUILDING_PLAN_PROJECT, SAMPLE_COMMERCIAL_PROJECT];
  saveBuildingPlanProjects(defaults);
  return defaults;
}

export function saveBuildingPlanProjects(projects: BuildingPlanProject[]): void {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    
    // Automatically save to Cloud Drive for zero-login QR code downloading
    const activeId = getActiveProjectId(projects);
    const activeProject = projects.find((p) => p.id === activeId) || projects[0];
    if (activeProject) {
      autoSavePlanToCloud(activeProject);
    }
  } catch (err) {
    console.warn("Failed to persist building plan projects:", err);
  }
}

export function getActiveProjectId(projects: BuildingPlanProject[]): string {
  try {
    const savedId = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
    if (savedId && projects.some((p) => p.id === savedId)) {
      return savedId;
    }
  } catch (e) {
    // ignore
  }
  return projects[0]?.id || INITIAL_BUILDING_PLAN_PROJECT.id;
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  } catch (e) {
    // ignore
  }
}

export function createBlankBuildingPlanProject(): BuildingPlanProject {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().split("T")[0];
  const newId = `proj-${timestamp}`;

  const newProject: BuildingPlanProject = {
    id: newId,
    projectTitle: "New Building Plan Project",
    createdAt: dateStr,
    updatedAt: dateStr,
    sheetOrientation: "landscape",
    paperSize: "A4",
    titleBlockPosition: "right",
    stripWidthMm: 70,

    officeName: "VASTHUSILPY KERALASSERY",
    officeAddress: "Main Road, Keralassery, Palakkad - 678641, Kerala",
    officeMobile: "7012383137",
    officeWhatsapp: "+918848241463",
    officeEmail: "deepak.vasthusilpy@gmail.com",
    officeWebsite: "www.vasthusilpy.com",
    logoUrl: VASTHUSILPY_LOGO_DATA_URL,

    licenseeName: "Deepak .C",
    licenseNumber: "SUPERVISOR-A (Civil) & Vasthu Silpy",
    registrationNumber: "E-2050/08/14087/KKD/318/2018/CA",
    departmentAuthority: "Dept. of Urban Affairs, Govt. of Kerala",
    engineerSealId: "eng_deepak",
    engineerCallNumber: "7012383137",
    engineerWhatsappNumber: "+918848241463",
    defaultNorthRotation: 0,
    enableQrScanning: true,
    marginConfig: {
      leftMm: 15,
      rightMm: 10,
      topMm: 10,
      bottomMm: 10,
      presetName: "standard_kerala"
    },

    projectLocation: "Sy. No. ---/--, Village, Panchayath/Municipality",
    clientName: "New Client Name",
    defaultScale: "1 : 100",
    defaultDate: dateStr,
    defaultRevision: "R0",

    areaTable: [
      {
        id: `area-${timestamp}-1`,
        floor: "Ground Floor",
        proposedSqM: 120.0,
        proposedSqFt: 1291.66,
        existingSqM: 0,
        existingSqFt: 0,
        builtUpSqM: 120.0,
        builtUpSqFt: 1291.66,
        floorAreaSqM: 112.0,
        floorAreaSqFt: 1205.56
      }
    ],
    areaUnit: "both",

    vasthuGrade: "Uttamam",
    vasthuPerimeterKol: "28 Kol 08 Viral",
    vasthuPerimeterMeter: "22.40 m",
    vasthuRemarks: "Ayadi Shadvarga - Dhana Yoni (1)",

    revisionTable: [
      {
        id: `rev-${timestamp}-0`,
        rev: "R0",
        date: dateStr,
        description: "Initial Draft Plan",
        preparedBy: "DC",
        checkedBy: "DC"
      }
    ],

    sheets: [
      {
        id: `sheet-${timestamp}-1`,
        sheetNumber: 1,
        drawingNumber: "DWG-01",
        drawingName: "PROPOSED BUILDING - GROUND FLOOR PLAN",
        floorName: "Ground Floor Plan",
        scale: "1 : 100",
        date: dateStr,
        revision: "R0",
        planImageUrl: SAMPLE_GROUND_FLOOR_SVG,
        planFileName: "Ground_Floor.svg",
        zoom: 100,
        panX: 0,
        panY: 0,
        rotation: 0,
        fitMode: "contain",
        sheetNotes: "Check all site boundary dimensions before commencing foundation."
      }
    ]
  };

  return newProject;
}

export function duplicateBuildingPlanProject(sourceProject: BuildingPlanProject): BuildingPlanProject {
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().split("T")[0];

  const duplicated: BuildingPlanProject = {
    ...JSON.parse(JSON.stringify(sourceProject)),
    id: `proj-${timestamp}`,
    projectTitle: `${sourceProject.projectTitle} (Copy)`,
    createdAt: dateStr,
    updatedAt: dateStr,
    defaultRevision: "R0",
    sheets: sourceProject.sheets.map((sheet, index) => ({
      ...sheet,
      id: `sheet-${timestamp}-${index + 1}`
    }))
  };

  return duplicated;
}
