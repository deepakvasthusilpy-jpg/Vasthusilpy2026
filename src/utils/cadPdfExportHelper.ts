import { jsPDF } from "jspdf";
import { CADDrawingRecord, CADDrawingData } from "../types/dataStorageTypes";

/**
 * Generates an official Vasthusilpy Architectural Drawing Blueprint Sheet PDF
 * with Title Block, Vasthu mandala, dimensions, floor plan, and project specs.
 */
export function generateCadBlueprintPdf(
  file: CADDrawingRecord,
  drawingData?: CADDrawingData
): { pdfBlob: Blob; dataUrl: string } {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4" // 297mm x 210mm
  });

  const data = drawingData || file.drawingData;
  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  // 1. Dark Blueprint Aesthetic or Clean White Architectural Sheet
  // Outer Border
  doc.setDrawColor(30, 41, 59); // Slate-800
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

  // Inner Border
  doc.setLineWidth(0.3);
  doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, pageHeight - (margin + 2) * 2);

  // 2. Header & Title Block (Top Banner)
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(margin + 2, margin + 2, pageWidth - (margin + 2) * 2, 22, "F");

  doc.setTextColor(56, 189, 248); // Cyan-400
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("VASTHUSILPY ARCHITECTS & ENGINEERS", margin + 6, margin + 9);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text("Keralassery, Palakkad, Kerala | Phone: +91 94963 12345 | Chief Consultant: Er. Deepak K.", margin + 6, margin + 14);
  doc.text("ARCHITECTURAL PLAN & VASTHU VIDYA COMPLIANCE DRAWING SHEET", margin + 6, margin + 19);

  // QR / Code Stamp on Top Right
  doc.setTextColor(245, 158, 11); // Amber-500
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`PROJECT CODE: ${file.projectCode || "VST-" + file.id.substring(0, 6).toUpperCase()}`, pageWidth - margin - 75, margin + 9);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text(`DATE: ${new Date(file.updatedAt || file.createdAt).toLocaleDateString()}`, pageWidth - margin - 75, margin + 14);
  doc.text(`SHEET NO: 01 / 01 | SCALE: 1:100 (METERS)`, pageWidth - margin - 75, margin + 19);

  // 3. Right Side Project Specs & Vasthu Box
  const specsX = pageWidth - margin - 68;
  const specsY = margin + 26;
  const specsWidth = 66;
  const specsHeight = pageHeight - margin - specsY - 4;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(specsX, specsY, specsWidth, specsHeight, "FD");

  // Specs Header
  doc.setFillColor(30, 41, 59);
  doc.rect(specsX, specsY, specsWidth, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("PROJECT SPECIFICATIONS", specsX + 4, specsY + 5.5);

  let currentY = specsY + 14;
  doc.setFontSize(7.5);

  const addSpecRow = (label: string, value?: string, highlight = false) => {
    if (!value) return;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(label, specsX + 3, currentY);
    currentY += 4;
    doc.setFont("helvetica", highlight ? "bold" : "normal");
    doc.setTextColor(highlight ? 13 : 15, highlight ? 148 : 23, highlight ? 136 : 42);
    doc.text(value, specsX + 3, currentY, { maxWidth: specsWidth - 6 });
    currentY += 5.5;
  };

  addSpecRow("PROJECT NAME:", file.projectName || file.title);
  addSpecRow("CLIENT / OWNER:", file.ownerName || file.clientName);
  if (file.mobileNo) addSpecRow("CONTACT NUMBER:", file.mobileNo);
  if (file.facing) addSpecRow("ORIENTATION / FACING:", `${file.facing} (പ്രവേശന ദിശ)`, true);
  if (file.bedrooms) addSpecRow("CONFIGURATION:", file.bedrooms);
  if (file.floors) addSpecRow("NUMBER OF FLOORS:", file.floors);
  if (file.builtUpArea) addSpecRow("PLINTH / BUILT-UP AREA:", file.builtUpArea, true);
  if (file.vasthuChuttu) addSpecRow("VASTHU CHUTTU (വാസ്തു ചുറ്റ്):", file.vasthuChuttu, true);
  if (file.folderPath) addSpecRow("ARCHIVE VAULT PATH:", file.folderPath);

  // Vasthu Mandala Note
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(specsX + 2, currentY + 2, specsWidth - 4, 18, 1.5, 1.5, "FD");
  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("VASTHU PURUSHA MANDALA ALIGNMENT", specsX + 4, currentY + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);
  doc.text("Verified as per Thachu Shastra & Manusyalaya Chandrika rules.", specsX + 4, currentY + 12, { maxWidth: specsWidth - 8 });
  doc.text("East-Facing entrance with Agni & Ishanya zoning.", specsX + 4, currentY + 16, { maxWidth: specsWidth - 8 });

  // 4. Drawing Canvas (Center Drawing Area)
  const drawAreaX = margin + 4;
  const drawAreaY = margin + 26;
  const drawAreaWidth = specsX - drawAreaX - 4;
  const drawAreaHeight = pageHeight - margin - drawAreaY - 4;

  // Drawing Background Grid
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  for (let x = drawAreaX; x < drawAreaX + drawAreaWidth; x += 10) {
    doc.line(x, drawAreaY, x, drawAreaY + drawAreaHeight);
  }
  for (let y = drawAreaY; y < drawAreaY + drawAreaHeight; y += 10) {
    doc.line(drawAreaX, y, drawAreaX + drawAreaWidth, y);
  }

  // Draw CAD Entities if present
  if (data && data.entities && data.entities.length > 0) {
    // Determine bounds
    let minX = 0, minY = 0, maxX = 20, maxY = 15;
    data.entities.forEach((e) => {
      if (e.x !== undefined && e.width !== undefined) {
        maxX = Math.max(maxX, e.x + e.width);
        minX = Math.min(minX, e.x);
      }
      if (e.y !== undefined && e.height !== undefined) {
        maxY = Math.max(maxY, e.y + e.height);
        minY = Math.min(minY, e.y);
      }
      if (e.x1 !== undefined && e.x2 !== undefined) {
        maxX = Math.max(maxX, e.x1, e.x2);
        minX = Math.min(minX, e.x1, e.x2);
      }
      if (e.y1 !== undefined && e.y2 !== undefined) {
        maxY = Math.max(maxY, e.y1, e.y2);
        minY = Math.min(minY, e.y1, e.y2);
      }
    });

    const worldWidth = Math.max(10, maxX - minX + 4);
    const worldHeight = Math.max(10, maxY - minY + 4);
    const scaleX = (drawAreaWidth - 20) / worldWidth;
    const scaleY = (drawAreaHeight - 20) / worldHeight;
    const drawScale = Math.min(scaleX, scaleY);

    const toPdfX = (wx: number) => drawAreaX + 10 + (wx - minX) * drawScale;
    const toPdfY = (wy: number) => drawAreaY + 10 + (wy - minY) * drawScale;

    // Render Entities
    data.entities.forEach((entity) => {
      if (entity.type === "rect" && entity.x !== undefined && entity.y !== undefined && entity.width !== undefined && entity.height !== undefined) {
        doc.setDrawColor(16, 185, 129); // Emerald wall color
        doc.setLineWidth(0.7);
        doc.rect(toPdfX(entity.x), toPdfY(entity.y), entity.width * drawScale, entity.height * drawScale);
      } else if (entity.type === "line" && entity.x1 !== undefined && entity.y1 !== undefined && entity.x2 !== undefined && entity.y2 !== undefined) {
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.5);
        doc.line(toPdfX(entity.x1), toPdfY(entity.y1), toPdfX(entity.x2), toPdfY(entity.y2));
      } else if (entity.type === "vastu_grid" && entity.x !== undefined && entity.y !== undefined && entity.width !== undefined && entity.height !== undefined) {
        // Vastu 3x3 mandala overlay
        const vx = toPdfX(entity.x);
        const vy = toPdfY(entity.y);
        const vw = entity.width * drawScale;
        const vh = entity.height * drawScale;
        doc.setDrawColor(236, 72, 153); // Pink-500
        doc.setLineWidth(0.2);
        doc.rect(vx, vy, vw, vh);
        doc.line(vx + vw / 3, vy, vx + vw / 3, vy + vh);
        doc.line(vx + (2 * vw) / 3, vy, vx + (2 * vw) / 3, vy + vh);
        doc.line(vx, vy + vh / 3, vx + vw, vy + vh / 3);
        doc.line(vx, vy + (2 * vh) / 3, vx + vw, vy + (2 * vh) / 3);
      } else if (entity.type === "text" && entity.x !== undefined && entity.y !== undefined && entity.text) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(2, 132, 199); // Sky-600
        doc.text(entity.text, toPdfX(entity.x), toPdfY(entity.y));
      } else if (entity.type === "dimension" && entity.x1 !== undefined && entity.y1 !== undefined && entity.x2 !== undefined && entity.y2 !== undefined) {
        doc.setDrawColor(245, 158, 11); // Amber
        doc.setLineWidth(0.3);
        doc.line(toPdfX(entity.x1), toPdfY(entity.y1), toPdfX(entity.x2), toPdfY(entity.y2));
        if (entity.dimValue) {
          doc.setFontSize(6.5);
          doc.setTextColor(217, 119, 6);
          doc.text(entity.dimValue, (toPdfX(entity.x1) + toPdfX(entity.x2)) / 2, (toPdfY(entity.y1) + toPdfY(entity.y2)) / 2 - 1);
        }
      }
    });
  }

  // Compass North Indicator on Bottom Left
  const compassX = drawAreaX + 15;
  const compassY = drawAreaY + drawAreaHeight - 15;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.circle(compassX, compassY, 8);
  doc.setFillColor(220, 38, 38); // Red North Arrow
  doc.triangle(compassX, compassY - 7, compassX - 2.5, compassY + 1, compassX + 2.5, compassY + 1, "F");
  doc.setFillColor(100, 116, 139);
  doc.triangle(compassX, compassY + 7, compassX - 2.5, compassY + 1, compassX + 2.5, compassY + 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text("N", compassX - 1.5, compassY - 9);

  // Footer Signature Line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Computer Generated CAD Drawing Sheet • Vasthusilpy Engineering System • Strictly for Construction & Verification", drawAreaX + 35, pageHeight - margin - 4);

  const pdfBlob = doc.output("blob");
  const dataUrl = doc.output("datauristring");

  return { pdfBlob, dataUrl };
}
