import {
  SiteInspection,
  InspectionTemplate,
  InspectionQuestion,
  InspectionGPS,
  InspectionMedia,
  InspectionAnswer
} from "../types/siteInspection";
import { db } from "../lib/firebase";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import jsPDF from "jspdf";
import JSZip from "jszip";

export const DEFAULT_INSPECTION_EMAIL = "deepak.vasthusilpy@gmail.com";
export const DEFAULT_INSPECTION_WHATSAPP = "+918848241463";
export const CLEAN_WHATSAPP_NUMBER = "918848241463";
export const DEFAULT_TELEGRAM_NUMBER = "+91 9747995961";
export const DEFAULT_TELEGRAM_PHONE_CLEAN = "919747995961";


const STORAGE_KEY_INSPECTIONS = "vasthusilpy_site_inspections_v1";
const STORAGE_KEY_TEMPLATES = "vasthusilpy_site_inspection_templates_v2";
const STORAGE_KEY_DELETED_INSPECTIONS = "vasthusilpy_site_inspections_deleted_ids_v1";

// Deleted Inspection IDs registry for persistent sync protection
export const getDeletedInspectionIds = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_INSPECTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addDeletedInspectionId = (id: string): void => {
  try {
    const current = getDeletedInspectionIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(STORAGE_KEY_DELETED_INSPECTIONS, JSON.stringify(updated));
    }
  } catch {}
};

export const DEFAULT_INSPECTION_QUESTIONS: InspectionQuestion[] = [
  {
    id: "q_ward_no",
    question: "WARD NO",
    type: "descriptive",
    category: "site_conditions",
    helpText: "Enter local authority / Panchayat Ward Number"
  },
  {
    id: "q_nearest_building_no",
    question: "NEAREST BUILDING NO",
    type: "descriptive",
    category: "site_conditions",
    helpText: "Enter nearest door / assessment building number"
  },
  {
    id: "q_ele_post_no",
    question: "ELE.POST NO",
    type: "descriptive",
    category: "site_conditions",
    helpText: "Enter KSEB / Electric post identification number"
  },
  {
    id: "q_work",
    question: "WORK",
    type: "descriptive",
    category: "site_conditions",
    helpText: "Type of proposed work / construction nature"
  },
  {
    id: "q_plot_subdivision",
    question: "PLOT SUBDIVISION",
    type: "yes_no_na",
    category: "site_conditions"
  },
  {
    id: "q_overheadele_cable",
    question: "OVERHEADELE CABLE",
    type: "yes_no_na",
    category: "statutory_compliance"
  },
  {
    id: "q_abut_neighbour_boundary",
    question: "ABUT NEIGHBOUR BOUNDARY",
    type: "yes_no_na",
    category: "boundaries_access"
  },
  {
    id: "q_neeighbour_concent",
    question: "NEEIGHBOUR CONCENT",
    type: "yes_no_na",
    category: "boundaries_access"
  },
  {
    id: "q_well_borewell",
    question: "WELL/BOREWELL",
    type: "descriptive",
    category: "site_conditions",
    helpText: "Existing or proposed well / borewell location & distance"
  },
  {
    id: "q_rain_water_storage_tank",
    question: "RAIN WATER STORAGE TANK",
    type: "yes_no_na",
    category: "utilities_services"
  },
  {
    id: "q_septic_tank",
    question: "SEPTIC TANK",
    type: "yes_no_na",
    category: "utilities_services"
  },
  {
    id: "q_waste_pit",
    question: "WASTE PIT",
    type: "yes_no_na",
    category: "utilities_services"
  },
  {
    id: "q_percolation_pit",
    question: "PERCOLATION PIT",
    type: "yes_no_na",
    category: "utilities_services"
  },
  {
    id: "q_court_case",
    question: "COURT CASE",
    type: "yes_no_na",
    category: "statutory_compliance"
  },
  {
    id: "q_land_survey_sketch",
    question: "LAND SURVEY SKETCH / DIGITAL SURVEY",
    type: "yes_no_na",
    category: "site_conditions"
  }
];

// Built-in Standard Inspection Templates
export const DEFAULT_TEMPLATES: InspectionTemplate[] = [
  {
    id: "tpl_standard_site",
    name: "Site Inspection & Verification Checklist",
    nameMl: "സൈറ്റ് പരിശോധന ചെക്ക്‌ലിസ്റ്റ്",
    description: "Official 15-point site verification checklist covering ward, electric post, boundary, setbacks, and utilities.",
    isDefault: true,
    questions: DEFAULT_INSPECTION_QUESTIONS
  }
];

// Load Templates
export const loadInspectionTemplates = (): InspectionTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
      return DEFAULT_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const hasNewQuestions = parsed.some((tpl) =>
        tpl.questions?.some((q: InspectionQuestion) => q.question === "WARD NO" || q.id === "q_ward_no")
      );
      if (!hasNewQuestions) {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
        return DEFAULT_TEMPLATES;
      }
      return parsed;
    }
    return DEFAULT_TEMPLATES;
  } catch (e) {
    return DEFAULT_TEMPLATES;
  }
};

// Save Templates
export const saveInspectionTemplates = (templates: InspectionTemplate[], syncToFirebase = true): void => {
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    window.dispatchEvent(new Event("vasthusilpy_inspection_templates_updated"));

    if (syncToFirebase && db) {
      templates.forEach(async (tpl) => {
        try {
          const docRef = doc(db, "inspection_templates", tpl.id);
          await setDoc(docRef, tpl, { merge: true });
        } catch (err) {
          // ignore offline
        }
      });
    }
  } catch (e) {
    console.error("Failed to save inspection templates:", e);
  }
};

// Load Inspections
export const loadSiteInspections = (): SiteInspection[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const deletedIds = getDeletedInspectionIds();
    if (Array.isArray(parsed)) {
      const active = parsed.filter((i) => i && i.id && !deletedIds.includes(i.id));
      return active.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return [];
  } catch (e) {
    return [];
  }
};

// Save Inspections
export const saveSiteInspections = (inspections: SiteInspection[], syncToFirebase = true): void => {
  try {
    const deletedIds = getDeletedInspectionIds();
    const cleanInspections = inspections.filter((i) => i && i.id && !deletedIds.includes(i.id));
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(cleanInspections));
    window.dispatchEvent(new Event("vasthusilpy_site_inspections_updated"));

    if (syncToFirebase && db) {
      cleanInspections.forEach(async (item) => {
        try {
          const docRef = doc(db, "site_inspections", item.id);
          await setDoc(docRef, item, { merge: true });
        } catch (err) {
          // silent fallback
        }
      });
    }
  } catch (e) {
    console.error("Failed to save site inspections:", e);
  }
};

// Delete Inspection
export const deleteSiteInspection = (id: string): SiteInspection[] => {
  addDeletedInspectionId(id);
  const current = loadSiteInspections();
  const updated = current.filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(updated));
  window.dispatchEvent(new Event("vasthusilpy_site_inspections_updated"));

  if (db) {
    try {
      deleteDoc(doc(db, "site_inspections", id)).catch(() => {});
    } catch (e) {}
  }
  return updated;
};

// Generate unique Inspection Number
export const generateInspectionNumber = (): string => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `SI-${year}-${randomSuffix}`;
};

export interface GPSProgressUpdate {
  currentAccuracy: number | null;
  bestAccuracy: number | null;
  attempts: number;
  message: string;
  isHighPrecision: boolean;
}

// High Accuracy Live GPS Fetcher with continuous satellite triangulation sampling (5-10m accuracy target)
export const fetchHighAccuracyGPSLocation = (
  options?: {
    targetAccuracyMeters?: number; // e.g., 5 or 10 meters
    maxWaitTimeMs?: number;
    onProgress?: (update: GPSProgressUpdate) => void;
  }
): { promise: Promise<InspectionGPS>; cancel: () => void } => {
  let watchId: number | null = null;
  let timer: any = null;
  let isDone = false;

  const targetAccuracy = options?.targetAccuracyMeters ?? 10;
  const maxWait = options?.maxWaitTimeMs ?? 20000;
  const onProgress = options?.onProgress;

  let bestPosition: GeolocationPosition | null = null;
  let attempts = 0;

  const cancel = () => {
    if (isDone) return;
    isDone = true;
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
    if (timer) clearTimeout(timer);
  };

  const promise = new Promise<InspectionGPS>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your mobile browser."));
      return;
    }

    const finalize = (pos: GeolocationPosition) => {
      cancel();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy);
      const altitude = pos.coords.altitude ? Math.round(pos.coords.altitude) : null;
      const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;

      resolve({
        latitude: lat,
        longitude: lng,
        accuracy,
        altitude,
        mapUrl,
        fetchedAt: new Date().toISOString()
      });
    };

    onProgress?.({
      currentAccuracy: null,
      bestAccuracy: null,
      attempts: 0,
      message: "Calibrating GPS satellite receiver (Target: ≤5–10m)...",
      isHighPrecision: false
    });

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          attempts++;
          const currentAcc = Math.round(position.coords.accuracy);

          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }

          const bestAcc = Math.round(bestPosition.coords.accuracy);
          const isHighPrecision = bestAcc <= targetAccuracy;

          onProgress?.({
            currentAccuracy: currentAcc,
            bestAccuracy: bestAcc,
            attempts,
            message: isHighPrecision
              ? `🎯 High precision fix acquired (±${bestAcc}m)! Locking coordinates...`
              : `🛰️ Triangulating GPS satellites (Current: ±${bestAcc}m → Waiting for ≤${targetAccuracy}m)...`,
            isHighPrecision
          });

          // Stop and resolve as soon as we achieve target accuracy (<= 5-10m)
          if (position.coords.accuracy <= targetAccuracy) {
            finalize(position);
          }
        },
        (error) => {
          if (bestPosition) {
            finalize(bestPosition);
            return;
          }
          let msg = "Could not retrieve GPS coordinates.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location access was denied. Please allow GPS permission in mobile settings.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "GPS location unavailable. Please enable device Location/GPS.";
          } else if (error.code === error.TIMEOUT) {
            msg = "GPS request timed out. Please step under open sky for satellite signal.";
          }
          cancel();
          reject(new Error(msg));
        },
        {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 0
        }
      );

      // Fallback timer: resolve with the best fix obtained within maxWait
      timer = setTimeout(() => {
        if (bestPosition) {
          finalize(bestPosition);
        } else {
          cancel();
          reject(new Error("Could not acquire accurate GPS fix. Please verify device GPS is active and try outdoors."));
        }
      }, maxWait);
    } catch (err: any) {
      cancel();
      reject(err);
    }
  });

  return { promise, cancel };
};

// Fetch Device Geolocation with High Accuracy target
export const fetchCurrentGPSLocation = async (targetAccuracyMeters = 10): Promise<InspectionGPS> => {
  const { promise } = fetchHighAccuracyGPSLocation({ targetAccuracyMeters, maxWaitTimeMs: 18000 });
  return promise;
};

// Format WhatsApp Message
export const formatWhatsAppInspectionMessage = (inspection: SiteInspection): string => {
  const dateStr = new Date(inspection.dateTime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const lines: string[] = [
    `🏛️ *VASTHUSILPY SITE INSPECTION REPORT*`,
    `📌 *Inspection Ref:* ${inspection.inspectionNumber}`,
    `🗓️ *Date & Time:* ${dateStr}`,
    `----------------------------------`,
    `👤 *Owner Name:* ${inspection.ownerName}`,
    `📱 *Mobile No:* ${inspection.mobileNumber}`,
    `📍 *Place / Site:* ${inspection.place}${inspection.panchayathMunicipality ? `, ${inspection.panchayathMunicipality}` : ""}`,
    inspection.surveyNumber ? `📐 *Survey No:* ${inspection.surveyNumber}` : "",
    inspection.inspectorName ? `👷 *Inspected By:* ${inspection.inspectorName}` : ""
  ].filter(Boolean);

  if (inspection.gps) {
    lines.push(
      `----------------------------------`,
      `🗺️ *Exact GPS Coordinates:*`,
      `📍 Lat: ${inspection.gps.latitude.toFixed(6)}, Lng: ${inspection.gps.longitude.toFixed(6)} (±${inspection.gps.accuracy || 0}m)`,
      `🔗 *Google Maps Link:*`,
      `${inspection.gps.mapUrl}`
    );
  }

  if (inspection.answers && inspection.answers.length > 0) {
    lines.push(`----------------------------------`, `📋 *Inspection Observations:*`);
    inspection.answers.forEach((ans, idx) => {
      let displayAns = "";
      if (typeof ans.answer === "boolean") {
        displayAns = ans.answer ? "✅ YES" : "❌ NO";
      } else if (ans.answer === "YES") {
        displayAns = "✅ YES";
      } else if (ans.answer === "NO") {
        displayAns = "❌ NO";
      } else if (ans.answer === "N/A") {
        displayAns = "⚪ N/A";
      } else {
        displayAns = `${ans.answer || "—"}`;
      }
      lines.push(`${idx + 1}. *${ans.questionText}*`);
      lines.push(`   ↳ ${displayAns}${ans.notes ? ` (${ans.notes})` : ""}`);
    });
  }

  if (inspection.overallRemarks) {
    lines.push(`----------------------------------`, `📝 *Inspector Remarks:*`, `${inspection.overallRemarks}`);
  }

  if (inspection.media && inspection.media.length > 0) {
    const photoCount = inspection.media.filter((m) => m.type === "photo").length;
    const videoCount = inspection.media.filter((m) => m.type === "video").length;
    lines.push(`----------------------------------`, `📸 *Attached Media:* ${photoCount} Photos, ${videoCount} Videos`);
  }

  lines.push(
    `----------------------------------`,
    `✅ *Status:* ${(inspection.status || "Submitted").toUpperCase()}`,
    `Vasthusilpy Architectural & Engineering Consultants`
  );

  return lines.join("\n");
};

// Open WhatsApp direct link
export const sendWhatsAppNotification = (
  inspection: SiteInspection,
  targetPhone: string = CLEAN_WHATSAPP_NUMBER
): void => {
  const message = formatWhatsAppInspectionMessage(inspection);
  const cleanPhone = targetPhone.replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
};

// Generate Printable A4 PDF Report using jsPDF
export const generateSiteInspectionPdf = async (inspection: SiteInspection): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text("OFFICIAL SITE INSPECTION & VERIFICATION REPORT", margin, 18);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Ref: ${inspection.inspectionNumber}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin, 18, { align: "right" });

  y = 34;

  // Overview Information Grid Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 42, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("SITE & CLIENT DETAILS", margin + 4, y + 6);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);

  const col1 = margin + 4;
  const col2 = margin + 95;
  let gridY = y + 13;

  doc.text("Owner / Client:", col1, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.ownerName || "—", col1 + 28, gridY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Inspection Date:", col2, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(new Date(inspection.dateTime).toLocaleString(), col2 + 28, gridY);

  gridY += 6.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Mobile Number:", col1, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.mobileNumber || "—", col1 + 28, gridY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Site Location:", col2, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.place || "—", col2 + 28, gridY);

  gridY += 6.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Panchayath/LGD:", col1, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.panchayathMunicipality || "—", col1 + 28, gridY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Survey Number:", col2, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.surveyNumber || "—", col2 + 28, gridY);

  gridY += 6.5;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Inspected By:", col1, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.inspectorName ? `${inspection.inspectorName} (${inspection.inspectorPhone || ""})` : "Vasthusilpy Field Engineer", col1 + 28, gridY);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Template Type:", col2, gridY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(inspection.templateName || "General Site Inspection", col2 + 28, gridY);

  y = 80;

  // GPS Location Section Box
  if (inspection.gps) {
    doc.setFillColor(240, 253, 250); // emerald-50
    doc.setDrawColor(52, 211, 153);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, "FD");

    doc.setTextColor(6, 78, 59); // emerald-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("🛰️ VERIFIED GPS GEOLOCATION DATA", margin + 4, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(`Latitude: ${inspection.gps.latitude.toFixed(7)}   |   Longitude: ${inspection.gps.longitude.toFixed(7)}   |   Accuracy: ±${inspection.gps.accuracy || 0} meters`, margin + 4, y + 11.5);

    doc.setTextColor(2, 132, 199); // cyan-600
    doc.setFont("helvetica", "bold");
    doc.text(`Google Maps URL: ${inspection.gps.mapUrl}`, margin + 4, y + 17);

    y += 26;
  }

  // Inspection Checklist / Dynamic Answers Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("INSPECTION CHECKLIST & OBSERVATIONS", margin, y + 4);
  y += 7;

  // Table Header
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 6, "F");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text("#", margin + 2, y + 4.2);
  doc.text("Inspection Parameter / Question", margin + 10, y + 4.2);
  doc.text("Recorded Finding / Status", pageWidth - margin - 50, y + 4.2);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  inspection.answers.forEach((item, index) => {
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);

    doc.setTextColor(100, 116, 139);
    doc.text(`${index + 1}`, margin + 2, y + 4.5);

    doc.setTextColor(15, 23, 42);
    const questionLines = doc.splitTextToSize(item.questionText, 115);
    doc.text(questionLines, margin + 10, y + 4.5);

    let answerStr = "";
    if (typeof item.answer === "boolean") {
      answerStr = item.answer ? "YES" : "NO";
    } else {
      answerStr = String(item.answer || "—");
    }

    if (item.notes) {
      answerStr += ` (${item.notes})`;
    }

    if (answerStr === "YES" || answerStr.startsWith("YES")) {
      doc.setTextColor(5, 150, 105);
      doc.setFont("helvetica", "bold");
    } else if (answerStr === "NO" || answerStr.startsWith("NO")) {
      doc.setTextColor(225, 29, 72);
      doc.setFont("helvetica", "bold");
    } else if (answerStr === "N/A" || answerStr.startsWith("N/A")) {
      doc.setTextColor(180, 83, 9);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
    }

    const answerLines = doc.splitTextToSize(answerStr, 50);
    doc.text(answerLines, pageWidth - margin - 50, y + 4.5);

    const rowHeight = Math.max(questionLines.length, answerLines.length) * 4.5 + 3;
    y += Math.max(rowHeight, 7);
  });

  y += 4;

  // Remarks Box
  if (inspection.overallRemarks) {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text("ENGINEER'S SUMMARY REMARKS & RECOMMENDATION:", margin + 3, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const remarkLines = doc.splitTextToSize(inspection.overallRemarks, pageWidth - margin * 2 - 8);
    doc.text(remarkLines, margin + 3, y + 10);

    y += 28;
  }

  // Media Photos Grid Section
  const photos = inspection.media.filter((m) => m.type === "photo" && m.url && m.url.startsWith("data:image"));
  if (photos.length > 0) {
    if (y > pageHeight - 65) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(`CAPTURED ON-SITE PHOTOGRAPHS (${photos.length})`, margin, y + 4);
    y += 8;

    let photoX = margin;
    const photoWidth = 56;
    const photoHeight = 42;

    for (let i = 0; i < Math.min(photos.length, 6); i++) {
      if (photoX + photoWidth > pageWidth - margin) {
        photoX = margin;
        y += photoHeight + 10;
        if (y > pageHeight - 50) {
          doc.addPage();
          y = margin;
        }
      }

      try {
        doc.addImage(photos[i].url, "JPEG", photoX, y, photoWidth, photoHeight);
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(photos[i].caption || `Photo ${i + 1}`, photoX, y + photoHeight + 3.5);
      } catch (err) {
        // skip corrupt image
      }

      photoX += photoWidth + 7;
    }

    y += photoHeight + 12;
  }

  // Footer Sign-Off
  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Official site report verified and generated via Vasthusilpy Field App.", margin, pageHeight - 15);
  doc.text("Authorized Engineer Signature", pageWidth - margin - 45, pageHeight - 15);

  return doc;
};

// Download Inspection PDF
export const downloadInspectionPdf = async (inspection: SiteInspection): Promise<void> => {
  const doc = await generateSiteInspectionPdf(inspection);
  doc.save(`Vasthusilpy_Site_Inspection_${inspection.inspectionNumber}.pdf`);
};

// Format Comprehensive Email Body for Site Inspection
export const formatInspectionEmail = (
  inspection: SiteInspection
): { subject: string; body: string } => {
  const dateStr = new Date(inspection.dateTime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const subject = `Vasthusilpy Site Inspection Report - ${inspection.ownerName} (${inspection.inspectionNumber})`;

  const lines: string[] = [
    `VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS`,
    `OFFICIAL SITE INSPECTION & VERIFICATION REPORT`,
    `==================================================`,
    ``,
    `REFERENCE NO  : ${inspection.inspectionNumber}`,
    `DATE & TIME   : ${dateStr}`,
    `TEMPLATE TYPE : ${inspection.templateName || "Standard Site Verification Checklist"}`,
    `STATUS        : ${(inspection.status || "Submitted").toUpperCase()}`,
    ``,
    `1. OWNER & CLIENT INFORMATION:`,
    `--------------------------------------------------`,
    `Owner / Client Name : ${inspection.ownerName}`,
    `Mobile Number       : ${inspection.mobileNumber}`,
    `Site Location / Place: ${inspection.place}`,
    inspection.panchayathMunicipality ? `Local Authority     : ${inspection.panchayathMunicipality}` : ``,
    inspection.surveyNumber ? `Survey Number       : ${inspection.surveyNumber}` : ``,
    inspection.inspectorName ? `Inspected By        : ${inspection.inspectorName}` : ``,
    inspection.inspectorPhone ? `Inspector Contact   : ${inspection.inspectorPhone}` : ``,
    ``
  ].filter(Boolean);

  // GPS Coordinates Section
  if (inspection.gps) {
    lines.push(
      `2. LIVE GPS GEOLOCATION:`,
      `--------------------------------------------------`,
      `Latitude   : ${inspection.gps.latitude.toFixed(6)}`,
      `Longitude  : ${inspection.gps.longitude.toFixed(6)}`,
      `GPS Accuracy: ±${inspection.gps.accuracy || 0} meters ${inspection.gps.accuracy && inspection.gps.accuracy <= 10 ? "(5–10m Precision Verified)" : ""}`,
      inspection.gps.altitude ? `Elevation  : ${inspection.gps.altitude} meters` : ``,
      `Google Maps: ${inspection.gps.mapUrl}`,
      ``
    );
  }

  // Checklist Observations
  if (inspection.answers && inspection.answers.length > 0) {
    lines.push(
      `3. SITE OBSERVATIONS & 15-POINT CHECKLIST:`,
      `--------------------------------------------------`
    );

    inspection.answers.forEach((ans, idx) => {
      let displayAns = "";
      if (typeof ans.answer === "boolean") {
        displayAns = ans.answer ? "YES" : "NO";
      } else if (ans.answer === "YES" || ans.answer === "NO" || ans.answer === "N/A") {
        displayAns = ans.answer;
      } else {
        displayAns = `${ans.answer || "—"}`;
      }

      lines.push(`${idx + 1}. ${ans.questionText}: [${displayAns}]`);
      if (ans.notes) {
        lines.push(`   Remarks: ${ans.notes}`);
      }
    });
    lines.push(``);
  }

  // Overall Remarks
  if (inspection.overallRemarks) {
    lines.push(
      `4. ENGINEER'S SUMMARY REMARKS & RECOMMENDATIONS:`,
      `--------------------------------------------------`,
      `${inspection.overallRemarks}`,
      ``
    );
  }

  // Media Summary
  if (inspection.media && inspection.media.length > 0) {
    const photos = inspection.media.filter((m) => m.type === "photo");
    const videos = inspection.media.filter((m) => m.type === "video");

    lines.push(
      `5. CAPTURED MEDIA FILES (${photos.length} Photos, ${videos.length} Videos):`,
      `--------------------------------------------------`
    );

    inspection.media.forEach((item, index) => {
      lines.push(
        `• [${item.type.toUpperCase()}] ${item.name || `Media ${index + 1}`} (${item.caption || "On-site capture"})${item.size ? ` - ${(item.size / 1024).toFixed(1)} KB` : ""}`
      );
    });

    lines.push(
      ``,
      `* Note: All photos are also embedded inside the official A4 PDF report generated for this inspection.`
    );
  }

  lines.push(
    ``,
    `==================================================`,
    `Vasthusilpy Architectural & Engineering Consultants`,
    `Website: Vasthusilpy Field Services`,
    `Sent automatically via Vasthusilpy Mobile Site Inspection System`
  );

  return {
    subject,
    body: lines.filter((l) => l !== undefined).join("\n")
  };
};

// Open in Gmail Web composer directly
export const openGmailWebCompose = (
  inspection: SiteInspection,
  recipient: string = DEFAULT_INSPECTION_EMAIL
): void => {
  const { subject, body } = formatInspectionEmail(inspection);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    recipient
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, "_blank", "noopener,noreferrer");
};

// Open in Default Mail Client (mailto:)
export const openDefaultMailClient = (
  inspection: SiteInspection,
  recipient: string = DEFAULT_INSPECTION_EMAIL
): void => {
  const { subject, body } = formatInspectionEmail(inspection);
  const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
};

// ==========================================
// TELEGRAM & ALL-IN-ONE ARCHIVE DISPATCH (9747995961)
// ==========================================

// Format Telegram Message for Site Inspection Dispatch
export const formatTelegramInspectionMessage = (inspection: SiteInspection): string => {
  const dateStr = new Date(inspection.dateTime).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const lines: string[] = [
    `🏛️ *VASTHUSILPY SITE INSPECTION REPORT*`,
    `📋 *Ref No:* \`${inspection.inspectionNumber}\``,
    `📅 *Date & Time:* ${dateStr}`,
    `👤 *Client / Owner:* *${inspection.ownerName}*`,
    `📱 *Mobile:* \`${inspection.mobileNumber}\``,
    `📍 *Place:* ${inspection.place}`,
    inspection.panchayathMunicipality ? `🏛️ *Panchayath / Munc.:* ${inspection.panchayathMunicipality}` : ``,
    inspection.surveyNumber ? `📐 *Survey No:* ${inspection.surveyNumber}` : ``,
    inspection.inspectorName ? `👷 *Inspected By:* ${inspection.inspectorName}` : ``,
    ``
  ].filter(Boolean);

  if (inspection.gps) {
    lines.push(
      `🌐 *LIVE GPS LOCATION:*`,
      `• Lat: \`${inspection.gps.latitude.toFixed(6)}\` | Long: \`${inspection.gps.longitude.toFixed(6)}\``,
      `• Accuracy: ±${inspection.gps.accuracy || 0}m ${inspection.gps.accuracy && inspection.gps.accuracy <= 10 ? "(5–10m Precision Verified ✅)" : ""}`,
      `🗺️ *Google Maps:* ${inspection.gps.mapUrl}`,
      ``
    );
  }

  // Checklist Highlights
  if (inspection.answers && inspection.answers.length > 0) {
    lines.push(`📝 *15-POINT SITE CHECKLIST:*`);
    inspection.answers.forEach((ans, i) => {
      let val = "";
      if (typeof ans.answer === "boolean") val = ans.answer ? "YES" : "NO";
      else if (ans.answer === "YES" || ans.answer === "NO" || ans.answer === "N/A") val = ans.answer;
      else val = `${ans.answer || "-"}`;
      lines.push(`${i + 1}. ${ans.questionText}: *[${val}]*${ans.notes ? ` _(${ans.notes})_` : ""}`);
    });
    lines.push(``);
  }

  // Media Breakdown
  const photos = inspection.media?.filter((m) => m.type === "photo") || [];
  const videos = inspection.media?.filter((m) => m.type === "video") || [];
  lines.push(
    `📸 *ATTACHED MEDIA PACKAGE:*`,
    `• Photos: ${photos.length} captured`,
    `• Videos: ${videos.length} recorded`,
    `• Complete Archive (.ZIP / .RAR) & A4 PDF Report generated.`,
    ``,
    `⚡ _Sent to Vasthusilpy Central via Telegram Field Dispatch System_`
  );

  return lines.join("\n");
};

// Open Telegram Chat directly with 9747995961
export const openTelegramChat = (
  inspection: SiteInspection,
  phoneNumber: string = DEFAULT_TELEGRAM_PHONE_CLEAN
): void => {
  const message = formatTelegramInspectionMessage(inspection);
  const encodedMsg = encodeURIComponent(message);
  
  // Try direct Telegram URL protocols
  // 1. Direct phone link
  const tgWebUrl = `https://t.me/+${phoneNumber}?text=${encodedMsg}`;
  const tgShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    window.location.origin + "/?portal=site_inspection"
  )}&text=${encodedMsg}`;

  // Open share or chat window
  window.open(tgWebUrl, "_blank", "noopener,noreferrer");
};

// Helper: Convert Data URL / Base64 to Uint8Array for JSZip
const dataUrlToUint8Array = (dataUrl: string): Uint8Array => {
  const base64Index = dataUrl.indexOf(";base64,");
  if (base64Index !== -1) {
    const base64Data = dataUrl.substring(base64Index + 8);
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
  }
  return new TextEncoder().encode(dataUrl);
};

// Create Complete All-in-One Inspection Archive (.ZIP / .RAR compatible package)
export const createInspectionArchiveBundle = async (
  inspection: SiteInspection,
  onProgress?: (percent: number, step: string) => void
): Promise<Blob> => {
  const zip = new JSZip();

  // Root folder inside the archive
  const rootFolderName = `Vasthusilpy_Inspection_${inspection.inspectionNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
  const root = zip.folder(rootFolderName) || zip;

  onProgress?.(15, "Generating Official A4 PDF Document...");

  // 1. Generate and attach the A4 PDF Document
  try {
    const doc = await generateSiteInspectionPdf(inspection);
    const pdfBlob = doc.output("blob");
    root.file(`Vasthusilpy_Site_Inspection_${inspection.inspectionNumber}.pdf`, pdfBlob);
  } catch (err) {
    console.error("Failed to generate PDF for archive:", err);
  }

  onProgress?.(35, "Compiling Summary & JSON Data...");

  // 2. Inspection Summary Text File
  const emailData = formatInspectionEmail(inspection);
  const summaryText = `${emailData.subject}\n\n${emailData.body}\n\nGenerated for Telegram & Archive Dispatch to: ${DEFAULT_TELEGRAM_NUMBER}`;
  root.file("INSPECTION_SUMMARY.txt", summaryText);

  // 3. Raw Structured JSON File
  root.file(
    "INSPECTION_DATA.json",
    JSON.stringify(
      {
        ...inspection,
        dispatchedToTelegram: DEFAULT_TELEGRAM_NUMBER,
        dispatchedToEmail: DEFAULT_INSPECTION_EMAIL,
        exportedAt: new Date().toISOString()
      },
      null,
      2
    )
  );

  // 4. Attach Photos & Videos
  if (inspection.media && inspection.media.length > 0) {
    const photosFolder = root.folder("Photos");
    const videosFolder = root.folder("Videos");

    const totalMedia = inspection.media.length;
    for (let i = 0; i < totalMedia; i++) {
      const item = inspection.media[i];
      const progressPercent = 40 + Math.round(((i + 1) / totalMedia) * 45);
      onProgress?.(progressPercent, `Packaging ${item.type} ${i + 1} of ${totalMedia}...`);

      const cleanFileName = (item.name || `${item.type}_${i + 1}`)
        .replace(/[^a-zA-Z0-9_.-]/g, "_");

      try {
        if (item.url && item.url.startsWith("data:")) {
          const fileBytes = dataUrlToUint8Array(item.url);
          if (item.type === "photo") {
            photosFolder?.file(cleanFileName.endsWith(".jpg") || cleanFileName.endsWith(".png") ? cleanFileName : `${cleanFileName}.jpg`, fileBytes);
          } else {
            videosFolder?.file(cleanFileName.endsWith(".mp4") || cleanFileName.endsWith(".webm") ? cleanFileName : `${cleanFileName}.mp4`, fileBytes);
          }
        } else if (item.url && (item.url.startsWith("http://") || item.url.startsWith("https://") || item.url.startsWith("blob:"))) {
          // Fetch remote/blob URL
          const response = await fetch(item.url);
          const blob = await response.blob();
          if (item.type === "photo") {
            photosFolder?.file(cleanFileName.endsWith(".jpg") || cleanFileName.endsWith(".png") ? cleanFileName : `${cleanFileName}.jpg`, blob);
          } else {
            videosFolder?.file(cleanFileName.endsWith(".mp4") || cleanFileName.endsWith(".webm") ? cleanFileName : `${cleanFileName}.mp4`, blob);
          }
        }
      } catch (mediaErr) {
        console.warn(`Could not add media file ${item.name} to archive:`, mediaErr);
      }
    }
  }

  onProgress?.(90, "Compressing All Files into Archive Package...");

  // Generate ZIP Blob
  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      onProgress?.(90 + Math.round(metadata.percent * 0.1), `Compressing: ${Math.round(metadata.percent)}%`);
    }
  );

  onProgress?.(100, "Archive Package Ready!");
  return zipBlob;
};

// Download Multiple/All Inspections Bundle
export const downloadAllInspectionsArchive = async (
  inspections: SiteInspection[],
  onProgress?: (percent: number, step: string) => void
): Promise<void> => {
  if (!inspections || inspections.length === 0) {
    throw new Error("No inspection records to download.");
  }

  const zip = new JSZip();
  const masterFolder = zip.folder(`Vasthusilpy_All_Site_Inspections_${new Date().toISOString().slice(0, 10)}`) || zip;

  const totalCount = inspections.length;
  for (let idx = 0; idx < totalCount; idx++) {
    const item = inspections[idx];
    const baseProgress = Math.round((idx / totalCount) * 85);
    onProgress?.(baseProgress, `Processing inspection ${idx + 1} of ${totalCount} (${item.inspectionNumber})...`);

    const subFolderName = `${item.inspectionNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}_${item.ownerName.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const subFolder = masterFolder.folder(subFolderName) || masterFolder;

    // 1. PDF
    try {
      const doc = await generateSiteInspectionPdf(item);
      const pdfBlob = doc.output("blob");
      subFolder.file(`Report_${item.inspectionNumber}.pdf`, pdfBlob);
    } catch (pdfErr) {
      console.warn(`Could not add PDF for ${item.inspectionNumber}:`, pdfErr);
    }

    // 2. Summary text & JSON
    const emailData = formatInspectionEmail(item);
    subFolder.file("SUMMARY.txt", `${emailData.subject}\n\n${emailData.body}`);
    subFolder.file("DATA.json", JSON.stringify(item, null, 2));

    // 3. Media files
    if (item.media && item.media.length > 0) {
      const photosFolder = subFolder.folder("Photos");
      const videosFolder = subFolder.folder("Videos");

      for (let mIdx = 0; mIdx < item.media.length; mIdx++) {
        const media = item.media[mIdx];
        const cleanName = (media.name || `${media.type}_${mIdx + 1}`).replace(/[^a-zA-Z0-9_.-]/g, "_");
        try {
          if (media.url && media.url.startsWith("data:")) {
            const bytes = dataUrlToUint8Array(media.url);
            if (media.type === "photo") {
              photosFolder?.file(cleanName.endsWith(".jpg") || cleanName.endsWith(".png") ? cleanName : `${cleanName}.jpg`, bytes);
            } else {
              videosFolder?.file(cleanName.endsWith(".mp4") || cleanName.endsWith(".webm") ? cleanName : `${cleanName}.mp4`, bytes);
            }
          } else if (media.url && (media.url.startsWith("http://") || media.url.startsWith("https://") || media.url.startsWith("blob:"))) {
            const resp = await fetch(media.url);
            const blob = await resp.blob();
            if (media.type === "photo") {
              photosFolder?.file(cleanName.endsWith(".jpg") || cleanName.endsWith(".png") ? cleanName : `${cleanName}.jpg`, blob);
            } else {
              videosFolder?.file(cleanName.endsWith(".mp4") || cleanName.endsWith(".webm") ? cleanName : `${cleanName}.mp4`, blob);
            }
          }
        } catch (mErr) {
          console.warn(`Could not add media file for ${item.inspectionNumber}:`, mErr);
        }
      }
    }
  }

  onProgress?.(90, "Compressing master package...");
  const zipBlob = await zip.generateAsync(
    {
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    },
    (meta) => {
      onProgress?.(90 + Math.round(meta.percent * 0.1), `Compressing: ${Math.round(meta.percent)}%`);
    }
  );

  onProgress?.(100, "Download ready!");
  const fileName = `Vasthusilpy_Site_Inspections_Bundle_${new Date().toISOString().slice(0, 10)}.zip`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};

// Download Complete Archive File for a single inspection (.zip / .rar bundle)
export const downloadInspectionArchive = async (
  inspection: SiteInspection,
  onProgress?: (percent: number, step: string) => void
): Promise<void> => {
  const archiveBlob = await createInspectionArchiveBundle(inspection, onProgress);
  const fileName = `Vasthusilpy_Inspection_${inspection.inspectionNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}_All_Files.zip`;
  
  const link = document.createElement("a");
  link.href = URL.createObjectURL(archiveBlob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};


