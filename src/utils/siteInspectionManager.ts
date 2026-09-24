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

export const DEFAULT_INSPECTION_EMAIL = "deepak.vasthusilpy@gmail.com";
export const DEFAULT_INSPECTION_WHATSAPP = "+918848241463";
export const CLEAN_WHATSAPP_NUMBER = "918848241463";

const STORAGE_KEY_INSPECTIONS = "vasthusilpy_site_inspections_v1";
const STORAGE_KEY_TEMPLATES = "vasthusilpy_site_inspection_templates_v1";

// Built-in Standard Inspection Templates
export const DEFAULT_TEMPLATES: InspectionTemplate[] = [
  {
    id: "tpl_standard_site",
    name: "General Land & Site Inspection",
    nameMl: "സ്ഥല പരിശോധന (ജനറൽ)",
    description: "Standard site visit checklist for plot verification, boundary, access, and terrain.",
    isDefault: true,
    questions: [
      {
        id: "q_access_road",
        question: "Is there proper motorable road access to the site?",
        questionMl: "സ്ഥലത്തേക്ക് വാഹനം എത്താൻ സാധിക്കുന്ന വഴിയുണ്ടോ?",
        type: "yes_no",
        category: "boundaries_access",
        required: true,
        helpText: "Check minimum width required for vehicle movement (e.g. 3m+)."
      },
      {
        id: "q_road_width",
        question: "Road width in front of site (in meters / feet)",
        questionMl: "വഴിയുടെ വീതി (മീറ്ററിൽ / അടിയിൽ)",
        type: "descriptive",
        category: "boundaries_access"
      },
      {
        id: "q_boundary_clear",
        question: "Are all boundary stones/fences clearly demarcated on-site?",
        questionMl: "അതിരുകൾ കൃത്യമായി കല്ലിട്ട് വേർതിരിച്ചിട്ടുണ്ടോ?",
        type: "yes_no",
        category: "boundaries_access",
        required: true
      },
      {
        id: "q_terrain_slope",
        question: "Site terrain / slope condition",
        questionMl: "സ്ഥലത്തിന്റെ കിടപ്പ് / ചരിവ്",
        type: "select",
        category: "site_conditions",
        options: ["Level / Flat (നിരപ്പായ സ്ഥലം)", "Mild Slope (നേരിയ ചരിവ്)", "Steep Slope / Hillside (കൂടിയ ചരിവ്)", "Waterlogged / Low-lying (താഴ്ന്ന പ്രദേശം)"],
        required: true
      },
      {
        id: "q_electricity_water",
        question: "Is electricity & drinking water source available nearby?",
        questionMl: "വൈദ്യുതി ലൈനും കുടിവെള്ള ലഭ്യതയും അടുത്ത ലഭ്യമാണോ?",
        type: "yes_no",
        category: "utilities_services"
      },
      {
        id: "q_ht_line",
        question: "Are high tension electric lines or transformers passing over/near the plot?",
        questionMl: "സ്ഥലത്തിന് മുകളിലൂടെ HT ലൈനോ സമീപത്ത് ട്രാൻസ്ഫോർമറോ ഉണ്ടോ?",
        type: "yes_no",
        category: "statutory_compliance"
      },
      {
        id: "q_water_body",
        question: "Is there any river, canal, or waterbody within 10–50 meters?",
        questionMl: "തോട്, പുഴ, കുളം എന്നിവ സമീപത്തുണ്ടോ?",
        type: "yes_no",
        category: "statutory_compliance"
      },
      {
        id: "q_soil_condition",
        question: "Observed Soil Type & Foundation Suitability",
        questionMl: "മണ്ണിന്റെ സ്വഭാവവും അടിത്തറയുടെ അനുയോജ്യതയും",
        type: "descriptive",
        category: "site_conditions",
        helpText: "Red soil, sandy, clayey, hard rock, reclaimed marshland, etc."
      },
      {
        id: "q_special_observations",
        question: "Site Inspector's Special Observations & Recommendations",
        questionMl: "പ്രത്യേക നിരീക്ഷണങ്ങളും നിർദ്ദേശങ്ങളും",
        type: "descriptive",
        category: "custom"
      }
    ]
  },
  {
    id: "tpl_ksmart_permit",
    name: "KSMART / LSGD Permit Verification Inspection",
    nameMl: "കെ-സ്മാർട്ട് ബിൽഡിംഗ് പെർമിറ്റ് പരിശോധന",
    description: "Verification checklist for Panchayat/Municipality building permit compliance & KPBR setbacks.",
    questions: [
      {
        id: "ks_front_setback",
        question: "Front Setback availability from road boundary (minimum 3m required)?",
        questionMl: "മുൻവശത്തെ സെറ്റ്ബാക്ക് ലഭ്യമാണോ (3m)?",
        type: "yes_no",
        category: "statutory_compliance",
        required: true
      },
      {
        id: "ks_side_rear_setback",
        question: "Rear & Side Setbacks adhere to KPBR rules (minimum 1m to 1.5m)?",
        questionMl: "വശങ്ങളിലെയും പിൻവശത്തെയും സെറ്റ്ബാക്കുകൾ ലഭ്യമാണോ?",
        type: "yes_no",
        category: "statutory_compliance",
        required: true
      },
      {
        id: "ks_kseb_distance",
        question: "Sufficient clearance from electrical lines/poles?",
        questionMl: "വൈദ്യുത ലൈനുകളിൽ നിന്നുമുള്ള കൃത്യമായ അകലം ഉണ്ടോ?",
        type: "yes_no",
        category: "statutory_compliance"
      },
      {
        id: "ks_rainwater_harvesting",
        question: "Space available for Rain Water Harvesting & Septic Tank / Soak Pit?",
        questionMl: "മഴവെള്ള സംഭരണി, സെപ്റ്റിക് ടാങ്ക് എന്നിവയ്ക്ക് സൗകര്യമുണ്ടോ?",
        type: "yes_no",
        category: "utilities_services"
      },
      {
        id: "ks_descriptive_findings",
        question: "Detailed Setback & Dimension Findings",
        questionMl: "സെറ്റ്ബാക്ക് വിശദാംശങ്ങൾ",
        type: "descriptive",
        category: "custom"
      }
    ]
  },
  {
    id: "tpl_construction_progress",
    name: "Construction Stage Progress Inspection",
    nameMl: "നിർമ്മാണ ഘട്ട പരിശോധന",
    description: "Site visit for ongoing building construction quality check, steel reinforcement, curing & alignment.",
    questions: [
      {
        id: "cp_stage",
        question: "Current Construction Stage",
        questionMl: "നിലവിലെ നിർമ്മാണ ഘട്ടം",
        type: "select",
        category: "construction_stage",
        options: ["Foundation / Basement", "Lintel & Beam Level", "Roof Slab Casting Ready", "Brick Masonry & Plastering", "Finishing & Electrical/Plumbing"],
        required: true
      },
      {
        id: "cp_plan_compliance",
        question: "Is construction strictly matching approved Vasthusilpy plan dimensions?",
        questionMl: "നിർമ്മാണം അംഗീകൃത പ്ലാൻ അനുസരിച്ചാണോ നടക്കുന്നത്?",
        type: "yes_no",
        category: "construction_stage",
        required: true
      },
      {
        id: "cp_material_quality",
        question: "Quality of steel, cement, M-sand and aggregate verified satisfactory?",
        questionMl: "മെറ്റീരിയൽ ഗുണനിലവാരം തൃപ്തികരമാണോ?",
        type: "yes_no",
        category: "construction_stage"
      },
      {
        id: "cp_curing_status",
        question: "Is water curing being performed adequately (min 7-14 days)?",
        questionMl: "കൃത്യമായ നനയ്ക്കൽ (Curing) നടക്കുന്നുണ്ടോ?",
        type: "yes_no",
        category: "construction_stage"
      },
      {
        id: "cp_contractor_notes",
        question: "Instructions Given to Site Supervisor / Contractor",
        questionMl: "സൈറ്റ് സൂപ്പർവൈസർക്ക് നൽകിയ നിർദ്ദേശങ്ങൾ",
        type: "descriptive",
        category: "custom"
      }
    ]
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
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    return [];
  } catch (e) {
    return [];
  }
};

// Save Inspections
export const saveSiteInspections = (inspections: SiteInspection[], syncToFirebase = true): void => {
  try {
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(inspections));
    window.dispatchEvent(new Event("vasthusilpy_site_inspections_updated"));

    if (syncToFirebase && db) {
      inspections.forEach(async (item) => {
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
  const current = loadSiteInspections();
  const updated = current.filter((i) => i.id !== id);
  saveSiteInspections(updated, false);

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

// Fetch Device Geolocation
export const fetchCurrentGPSLocation = (): Promise<InspectionGPS> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser or mobile device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        const altitude = position.coords.altitude ? Math.round(position.coords.altitude) : null;
        const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;

        resolve({
          latitude: lat,
          longitude: lng,
          accuracy,
          altitude,
          mapUrl,
          fetchedAt: new Date().toISOString()
        });
      },
      (error) => {
        let msg = "Could not retrieve GPS coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Location access was denied. Please allow GPS permission in your mobile browser.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "GPS location is currently unavailable. Please turn on device Location/GPS.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS location request timed out. Please retry outdoors.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
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
    lines.push(`----------------------------------`, `📋 *Key Inspection Observations:*`);
    inspection.answers.slice(0, 6).forEach((ans, idx) => {
      const displayAns = typeof ans.answer === "boolean" ? (ans.answer ? "✅ YES" : "❌ NO") : `${ans.answer}`;
      lines.push(`${idx + 1}. *${ans.questionText}*`);
      lines.push(`   ↳ ${displayAns}`);
    });
    if (inspection.answers.length > 6) {
      lines.push(`   *(+ ${inspection.answers.length - 6} more observations in full report)*`);
    }
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

    const answerStr = typeof item.answer === "boolean" ? (item.answer ? "YES [Compliant]" : "NO [Non-Compliant]") : String(item.answer || "—");

    if (answerStr.startsWith("YES")) {
      doc.setTextColor(5, 150, 105);
      doc.setFont("helvetica", "bold");
    } else if (answerStr.startsWith("NO")) {
      doc.setTextColor(225, 29, 72);
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
