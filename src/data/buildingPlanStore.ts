import { BuildingPlanProject } from "../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL } from "./vasthusilpyLogo";
import { autoSavePlanToCloud } from "../utils/cloudPlanSync";

export const PROJECTS_STORAGE_KEY = "VAS_BUILDING_PLAN_PROJECTS_LIST";
export const ACTIVE_PROJECT_ID_KEY = "VAS_ACTIVE_BUILDING_PLAN_ID";

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
      if (Array.isArray(parsed)) {
        const cleaned = parsed
          .filter((p: BuildingPlanProject) => {
            if (!p || !p.id) return false;
            const pid = String(p.id).toLowerCase();
            const client = String(p.clientName || "").toLowerCase();
            const title = String(p.projectTitle || "").toLowerCase();
            if (
              pid === "initial-plan-01" ||
              pid === "proj-lekha-01" ||
              pid === "proj-commercial-02" ||
              pid === "proj-sample-01" ||
              pid === "proj-sample-02" ||
              client.includes("lekha haridas") ||
              client.includes("ananthakrishnan") ||
              title.includes("lekha haridas") ||
              title.includes("commercial complex & diagnostic clinic") ||
              title.includes("commercial complex")
            ) {
              return false;
            }
            return true;
          })
          .map(hydrateProject);

        if (cleaned.length !== parsed.length) {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.warn("Failed to read building plan projects from storage:", err);
  }

  return [];
}

export function saveBuildingPlanProjects(projects: BuildingPlanProject[]): void {
  try {
    const cleaned = (projects || []).filter((p: BuildingPlanProject) => {
      if (!p || !p.id) return false;
      const pid = String(p.id).toLowerCase();
      const client = String(p.clientName || "").toLowerCase();
      const title = String(p.projectTitle || "").toLowerCase();
      if (
        pid === "initial-plan-01" ||
        pid === "proj-lekha-01" ||
        pid === "proj-commercial-02" ||
        pid === "proj-sample-01" ||
        pid === "proj-sample-02" ||
        client.includes("lekha haridas") ||
        client.includes("ananthakrishnan") ||
        title.includes("lekha haridas") ||
        title.includes("commercial complex & diagnostic clinic") ||
        title.includes("commercial complex")
      ) {
        return false;
      }
      return true;
    });

    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(cleaned));
    
    // Automatically save to Cloud Drive for zero-login QR code downloading
    const activeId = getActiveProjectId(cleaned);
    const activeProject = cleaned.find((p) => p.id === activeId) || cleaned[0];
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
  return projects[0]?.id || "";
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

    projectLocation: "",
    clientName: "",
    defaultScale: "1 : 100",
    defaultDate: dateStr,
    defaultRevision: "R0",

    areaTable: [
      {
        id: `area-${timestamp}-1`,
        floor: "Ground Floor",
        proposedSqM: 0,
        proposedSqFt: 0,
        existingSqM: 0,
        existingSqFt: 0,
        builtUpSqM: 0,
        builtUpSqFt: 0,
        floorAreaSqM: 0,
        floorAreaSqFt: 0
      }
    ],
    areaUnit: "both",

    vasthuGrade: "Uttamam",
    vasthuPerimeterKol: "",
    vasthuPerimeterMeter: "",
    vasthuRemarks: "Ayadi Shadvarga Calculation",

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
        planImageUrl: undefined,
        planFileName: undefined,
        zoom: 100,
        panX: 0,
        panY: 0,
        rotation: 0,
        fitMode: "contain",
        sheetNotes: "Check all site boundary dimensions before commencing foundation.",
        attachments: [],
        symbols: []
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
