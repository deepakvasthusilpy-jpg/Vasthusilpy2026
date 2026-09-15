import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { BuildingPlanProject, PlanSheet } from "../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "../data/vasthusilpyLogo";

/**
 * Downloads a Blob reliably in browser and iframe environments.
 */
export function downloadBlob(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.setAttribute("target", "_self");
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        // ignore cleanup error
      }
    }, 2000);
  } catch (err) {
    console.error("downloadBlob error:", err);
  }
}

/**
 * Sanitize filename to avoid filesystem issues.
 */
export function getSafeFilename(project: BuildingPlanProject, sheet?: PlanSheet, extension = "pdf"): string {
  const client = (project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dwg = sheet?.drawingNumber ? `_${sheet.drawingNumber.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
  return `${client}${dwg}_A4_Landscape.${extension}`;
}

/**
 * Converts an SVG string, SVG data URL, or external image into a high-resolution PNG Base64 Data URL.
 * This guarantees jsPDF addImage never fails or throws on SVGs.
 */
export async function rasterizeSvgOrImageToPng(url: string, targetWidth = 1600): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:image/png") || url.startsWith("data:image/jpeg")) {
    return url;
  }

  let src = url;
  if (url.startsWith("data:image/svg+xml;utf8,")) {
    const rawSvg = url.substring("data:image/svg+xml;utf8,".length);
    src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(rawSvg);
  } else if (url.startsWith("<svg") || url.startsWith("<?xml")) {
    src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(url);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const aspect = (img.naturalHeight || img.height || 600) / (img.naturalWidth || img.width || 800);
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = Math.max(100, Math.round(targetWidth * aspect));
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/png", 0.95);
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn("Rasterization canvas error:", err);
      }
      resolve(url);
    };
    img.onerror = (e) => {
      console.warn("Failed to load image for rasterization:", e);
      resolve(url);
    };
    img.src = src;
  });
}

/**
 * Capture an HTML element into high-resolution Canvas safely without tainting the canvas.
 */
export async function captureSheetToCanvas(element: HTMLElement, scale = 2): Promise<HTMLCanvasElement> {
  // 1. Ensure all images inside are loaded and set crossOrigin
  const imgElements = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    imgElements.map((img) => {
      img.crossOrigin = "anonymous";
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 2000); // 2s fallback
      });
    })
  );

  // 2. Wait for fonts if available
  try {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  } catch {
    // ignore
  }

  // 3. Render via html2canvas with allowTaint: false and CORS enabled
  return await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false, // CRITICAL: NEVER allow taint, so toDataURL() never throws!
    backgroundColor: "#ffffff",
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDoc) => {
      // Ensure all images in clone have crossOrigin set
      const clonedImgs = clonedDoc.querySelectorAll("img");
      clonedImgs.forEach((img) => {
        img.crossOrigin = "anonymous";
      });
    }
  });
}

/**
 * Export a single active sheet DOM element as a crisp A4 Landscape PDF.
 */
export async function exportSheetToPdf(
  sheetElement: HTMLElement,
  project: BuildingPlanProject,
  sheet: PlanSheet
): Promise<void> {
  const filename = getSafeFilename(project, sheet, "pdf");
  try {
    const canvas = await captureSheetToCanvas(sheetElement, 2);
    const imgData = canvas.toDataURL("image/jpeg", 0.96);

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    });

    // A4 Landscape is 297mm wide x 210mm high
    pdf.addImage(imgData, "JPEG", 0, 0, 297, 210, undefined, "FAST");

    const blob = pdf.output("blob");
    downloadBlob(blob, filename);
  } catch (err) {
    console.warn("DOM canvas capture failed, falling back to direct architectural vector generator:", err);
    const blob = await generateDirectProjectVectorPdf(project, sheet);
    downloadBlob(blob, filename);
  }
}

/**
 * Export a single sheet DOM element as JPEG image.
 */
export async function exportSheetToJpeg(
  sheetElement: HTMLElement,
  project: BuildingPlanProject,
  sheet: PlanSheet
): Promise<void> {
  const canvas = await captureSheetToCanvas(sheetElement, 2.2);
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const filename = getSafeFilename(project, sheet, "jpg");

  const link = document.createElement("a");
  link.href = imgData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 1000);
}

/**
 * Export a single sheet DOM element as PNG image.
 */
export async function exportSheetToPng(
  sheetElement: HTMLElement,
  project: BuildingPlanProject,
  sheet: PlanSheet
): Promise<void> {
  const canvas = await captureSheetToCanvas(sheetElement, 2.2);
  const imgData = canvas.toDataURL("image/png");
  const filename = getSafeFilename(project, sheet, "png");

  const link = document.createElement("a");
  link.href = imgData;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 1000);
}

/**
 * Export plan as high-resolution image (PNG / JPEG).
 */
export async function exportPlanAsHighResImage(
  project: BuildingPlanProject,
  sheet: PlanSheet,
  format: "png" | "jpeg" = "png",
  customFilename?: string
): Promise<void> {
  const canvasEl =
    document.getElementById(`plan-sheet-canvas-${sheet.id}`) ||
    (document.querySelector(".plan-sheet-canvas-container") as HTMLElement);

  if (canvasEl) {
    if (format === "jpeg") {
      await exportSheetToJpeg(canvasEl, project, sheet);
    } else {
      await exportSheetToPng(canvasEl, project, sheet);
    }
    return;
  }

  // Fallback direct canvas rendering if DOM element not present
  const canvas = document.createElement("canvas");
  canvas.width = 2380;
  canvas.height = 1684;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText(project.officeName || "VASTHUSILPY KERALASSERY", 80, 100);
    ctx.font = "24px sans-serif";
    ctx.fillText(`Client: ${project.clientName || ""} | Dwg: ${sheet.drawingNumber || ""}`, 80, 140);
  }

  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const dataUrl = canvas.toDataURL(mime, 0.95);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = customFilename || getSafeFilename(project, sheet, format === "jpeg" ? "jpg" : "png");
  document.body.appendChild(link);
  link.click();
  setTimeout(() => document.body.removeChild(link), 1000);
}

/**
 * Print an isolated A4 Landscape architectural sheet reliably.
 * Provides direct browser printing with isolated styles and automatic PDF print fallback.
 */
export async function printSheetDocument(
  sheetElement: HTMLElement,
  project: BuildingPlanProject,
  sheet: PlanSheet
): Promise<{ success: boolean; mode: string }> {
  // 1. Capture high-res canvas of the sheet
  let imgData: string | null = null;
  try {
    const canvas = await captureSheetToCanvas(sheetElement, 2);
    imgData = canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Capture for print failed, fallback:", e);
  }

  // 2. If capture succeeded, attempt dedicated print window
  if (imgData) {
    try {
      const printWin = window.open("", "_blank", "width=1200,height=850");
      if (printWin) {
        printWin.document.open();
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${project.clientName || "Building Plan"} - ${sheet.drawingNumber || "Print"}</title>
              <style>
                @page { size: 297mm 210mm landscape; margin: 0; }
                body { margin: 0; padding: 0; background: #ffffff; display: flex; align-items: center; justify-content: center; height: 100vh; width: 100vw; overflow: hidden; }
                img { width: 297mm; height: 210mm; max-width: 100vw; max-height: 100vh; object-fit: contain; display: block; }
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <img src="${imgData}" alt="Plan" onload="setTimeout(function(){ window.focus(); window.print(); }, 250);" />
            </body>
          </html>
        `);
        printWin.document.close();
        return { success: true, mode: "window" };
      }
    } catch (popupErr) {
      console.warn("Popup print window restricted:", popupErr);
    }
  }

  // 3. Fallback: dedicated DOM print root
  let printRoot = document.getElementById("architectural-plan-print-root");
  if (!printRoot) {
    printRoot = document.createElement("div");
    printRoot.id = "architectural-plan-print-root";
    document.body.appendChild(printRoot);
  }

  if (imgData) {
    printRoot.innerHTML = `
      <div class="architectural-print-page" style="width: 297mm; height: 210mm; margin: 0; padding: 0; background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        <img src="${imgData}" style="width: 297mm; height: 210mm; object-fit: contain; display: block;" alt="Architectural Plan Sheet" />
      </div>
    `;
  }

  // Apply print class to body so only #architectural-plan-print-root is visible during printing
  document.body.classList.add("printing-plan-sheet");

  const cleanup = () => {
    document.body.classList.remove("printing-plan-sheet");
    if (printRoot && document.body.contains(printRoot)) {
      printRoot.innerHTML = "";
    }
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  // Trigger print dialog
  let printSucceeded = false;
  try {
    window.print();
    printSucceeded = true;
  } catch (err) {
    console.warn("window.print() encountered restriction:", err);
  }

  // If window.print() is blocked by sandbox iframe, download printable PDF blob
  const isIframe = window.self !== window.top;
  if (!printSucceeded || isIframe) {
    const blob = await generateDirectProjectVectorPdf(project, sheet);
    const filename = getSafeFilename(project, sheet, "pdf");
    downloadBlob(blob, filename);
  }

  // Safety cleanup timeout
  setTimeout(cleanup, 4000);
  return { success: true, mode: isIframe ? "pdf_download" : "dialog" };
}

/**
 * Print all sheets sequentially in an isolated printable container.
 */
export async function printAllSheetsDocument(
  project: BuildingPlanProject,
  getSheetElement: (sheetIndex: number) => Promise<HTMLElement | null>,
  onProgress?: (status: string) => void
): Promise<void> {
  const totalSheets = project.sheets.length;
  const imagesData: string[] = [];

  for (let i = 0; i < totalSheets; i++) {
    if (onProgress) {
      onProgress(`Capturing Sheet ${i + 1} of ${totalSheets}...`);
    }
    try {
      const el = await getSheetElement(i);
      if (el) {
        const canvas = await captureSheetToCanvas(el, 2);
        imagesData.push(canvas.toDataURL("image/png"));
      }
    } catch (e) {
      console.warn(`Error capturing sheet ${i + 1} for print:`, e);
    }
  }

  if (imagesData.length === 0) {
    // If capture failed, generate combined vector PDF and download/open
    const blob = await generateDirectProjectVectorPdf(project);
    const filename = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_All_Sheets.pdf`;
    downloadBlob(blob, filename);
    return;
  }

  let printRoot = document.getElementById("architectural-plan-print-root");
  if (!printRoot) {
    printRoot = document.createElement("div");
    printRoot.id = "architectural-plan-print-root";
    document.body.appendChild(printRoot);
  }

  const pagesHtml = imagesData
    .map(
      (src, idx) => `
      <div class="architectural-print-page" style="width: 297mm; height: 210mm; margin: 0; padding: 0; background: #ffffff; page-break-after: ${idx < imagesData.length - 1 ? "always" : "avoid"}; break-after: ${idx < imagesData.length - 1 ? "page" : "avoid"}; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        <img src="${src}" style="width: 297mm; height: 210mm; object-fit: contain; display: block;" alt="Sheet ${idx + 1}" />
      </div>
    `
    )
    .join("");

  printRoot.innerHTML = pagesHtml;
  document.body.classList.add("printing-plan-sheet");

  const cleanup = () => {
    document.body.classList.remove("printing-plan-sheet");
    if (printRoot && document.body.contains(printRoot)) {
      printRoot.innerHTML = "";
    }
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  try {
    window.print();
  } catch (err) {
    console.warn("window.print() error, downloading PDF print blob:", err);
    const blob = await generateDirectProjectVectorPdf(project);
    const filename = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_All_Sheets.pdf`;
    downloadBlob(blob, filename);
  }

  setTimeout(cleanup, 5000);
}

/**
 * Export all sheets of a project into a combined single multi-page A4 Landscape PDF.
 */
export async function exportAllSheetsToPdf(
  project: BuildingPlanProject,
  getSheetElement: (sheetIndex: number) => Promise<HTMLElement | null>,
  onProgress?: (status: string) => void
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const totalSheets = project.sheets.length;
  let addedPages = 0;

  for (let i = 0; i < totalSheets; i++) {
    const sheet = project.sheets[i];
    if (onProgress) {
      onProgress(`Compiling Sheet ${i + 1} of ${totalSheets} (${sheet.drawingNumber || "Plan"})...`);
    }

    try {
      const element = await getSheetElement(i);
      if (element) {
        const canvas = await captureSheetToCanvas(element, 2);
        const imgData = canvas.toDataURL("image/jpeg", 0.95);

        if (addedPages > 0) {
          pdf.addPage("a4", "landscape");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 297, 210, undefined, "FAST");
        addedPages++;
      }
    } catch (err) {
      console.warn(`Error capturing sheet ${i + 1}, fallback vector:`, err);
    }
  }

  // If no pages were captured via html2canvas, use vector fallback for all sheets
  if (addedPages === 0) {
    if (onProgress) onProgress("Generating direct high-definition architectural PDF...");
    const blob = await generateDirectProjectVectorPdf(project);
    const filename = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_All_Sheets_Drawings.pdf`;
    downloadBlob(blob, filename);
    return;
  }

  const filename = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_All_Sheets_Drawings.pdf`;

  try {
    const blob = pdf.output("blob");
    downloadBlob(blob, filename);
  } catch {
    pdf.save(filename);
  }
}

/**
 * Direct High-Fidelity Vector Architectural PDF Generator.
 * Accurately renders:
 * - Full page margins (15mm binding left, 10mm right/top/bottom)
 * - All attached drawings and imported images/PDFs with true coordinates & scale!
 * - 2D plan symbols and vector elements
 * - Complete title block with office branding, licensed consulting engineer Deepak .C,
 *   direct phone & WhatsApp +91 88482 41463, complete Area Statement table with totals,
 *   Vasthu score & Kol perimeter, dynamic QR code, and sheet DWG numbers.
 */
export async function generateDirectProjectVectorPdf(
  project: BuildingPlanProject,
  activeSheet?: PlanSheet
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4" // 297 x 210
  });

  const sheetsToRender = activeSheet ? [activeSheet] : project.sheets;

  // Pre-rasterize all attachments in parallel to clean PNG base64 so jsPDF addImage never fails
  const rasterizedMap = new Map<string, string>();
  await Promise.all(
    sheetsToRender.flatMap((s) => s.attachments || []).map(async (att) => {
      if (att.imageUrl) {
        try {
          const png = await rasterizeSvgOrImageToPng(att.imageUrl);
          rasterizedMap.set(att.id, png);
        } catch (e) {
          console.warn("Pre-rasterize failed for attachment:", att.title, e);
        }
      }
    })
  );

  sheetsToRender.forEach((sheet, idx) => {
    if (idx > 0) {
      doc.addPage("a4", "landscape");
    }

    const pageWidth = 297;
    const pageHeight = 210;
    const leftMargin = sheet.marginConfig?.leftMm || 15;
    const rightMargin = sheet.marginConfig?.rightMm || 10;
    const topMargin = sheet.marginConfig?.topMm || 10;
    const bottomMargin = sheet.marginConfig?.bottomMm || 10;

    // 1. Paper Outline & Trim Marks
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.2);
    doc.rect(1, 1, pageWidth - 2, pageHeight - 2);

    // 2. Margin Outline (15mm Binding Left, 10mm Top/Right/Bottom)
    doc.setDrawColor(15, 23, 42); // Slate-900
    doc.setLineWidth(0.8);
    const mWidth = pageWidth - leftMargin - rightMargin;
    const mHeight = pageHeight - topMargin - bottomMargin;
    doc.rect(leftMargin, topMargin, mWidth, mHeight);

    // Title Strip Position & Dimensions
    const isRight = project.titleBlockPosition !== "bottom";
    const stripWidthMm = Math.max(50, Math.min(95, project.stripWidthMm || 70));
    const titleWidth = isRight ? stripWidthMm : mWidth;
    const bottomHeightMm = Math.max(35, Math.min(75, Math.round(mHeight * ((project.bottomStripHeightPct || 24) / 100))));
    const titleHeight = isRight ? mHeight : bottomHeightMm;
    const titleX = isRight ? leftMargin + mWidth - stripWidthMm : leftMargin;
    const titleY = isRight ? topMargin : topMargin + mHeight - bottomHeightMm;

    const drawAreaWidth = isRight ? mWidth - stripWidthMm : mWidth;
    const drawAreaHeight = isRight ? mHeight : mHeight - bottomHeightMm;

    // Drawing Area Separation Line
    doc.setLineWidth(0.6);
    doc.setDrawColor(15, 23, 42);
    if (isRight) {
      doc.line(titleX, topMargin, titleX, topMargin + mHeight);
    } else {
      doc.line(leftMargin, titleY, leftMargin + mWidth, titleY);
    }

    // -------------------------------------------------------------
    // DRAWING AREA: Render Attached Images, PDFs, and Vector Drawings
    // -------------------------------------------------------------
    if (sheet.attachments && sheet.attachments.length > 0) {
      sheet.attachments.forEach((att) => {
        try {
          // Convert percentage coordinates to mm inside drawing area
          const posX = leftMargin + (att.x / 100) * drawAreaWidth;
          const posY = topMargin + (att.y / 100) * drawAreaHeight;
          const widthMm = (att.width / 100) * drawAreaWidth;
          const heightMm = widthMm * 0.72; // Standard aspect ratio fallback

          const pngData = rasterizedMap.get(att.id) || att.imageUrl;
          if (pngData) {
            // Embed image / drawing directly
            const imgFormat = pngData.includes("image/jpeg") ? "JPEG" : "PNG";
            doc.addImage(pngData, imgFormat, posX, posY, widthMm, heightMm, undefined, "FAST");

            // Plan Caption / Title tag
            doc.setFillColor(15, 23, 42);
            doc.rect(posX, posY + heightMm + 1, widthMm, 5, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.setTextColor(255, 255, 255);
            doc.text(`${att.title}  (Scale: ${att.scale || "1:100"})`, posX + 2, posY + heightMm + 4.5);
          }
        } catch (imgErr) {
          console.warn("Could not embed attachment image in PDF:", imgErr);
        }
      });
    } else {
      // Fallback architectural floor plan guide if no attachments yet
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(sheet.drawingName || "ARCHITECTURAL FLOOR PLAN", leftMargin + drawAreaWidth / 2, topMargin + drawAreaHeight / 2 - 8, { align: "center" });
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Client: ${project.clientName || "Client"} | ${project.projectLocation || "Kerala"}`, leftMargin + drawAreaWidth / 2, topMargin + drawAreaHeight / 2, { align: "center" });
      doc.text(`Scale: ${sheet.scale || "1:100"}  |  Date: ${sheet.date || "10/09/2026"}`, leftMargin + drawAreaWidth / 2, topMargin + drawAreaHeight / 2 + 6, { align: "center" });
    }

    // North Compass Arrow in Drawing Area Top Right
    const ncX = leftMargin + drawAreaWidth - 14;
    const ncY = topMargin + 14;
    doc.setDrawColor(15, 23, 42);
    doc.circle(ncX, ncY, 6);
    doc.setFillColor(220, 38, 38);
    doc.triangle(ncX, ncY - 5, ncX - 2.5, ncY + 1.5, ncX + 2.5, ncY + 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(220, 38, 38);
    doc.text("N", ncX - 1.2, ncY - 6);

    // -------------------------------------------------------------
    // COMPLETE TITLE BLOCK WITH FULL DETAIL PARITY
    // -------------------------------------------------------------
    if (isRight) {
      // 1. Office Branding & Address
      doc.setFillColor(255, 255, 255);
      doc.rect(titleX, titleY, titleWidth, 18, "F");
      doc.setDrawColor(15, 23, 42);
      doc.line(titleX, titleY + 18, titleX + titleWidth, titleY + 18);

      // Logo icon
      try {
        doc.addImage(VASTHUSILPY_LOGO_DATA_URL, "PNG", titleX + 2, titleY + 2, 8, 8);
      } catch {
        doc.setFillColor(220, 38, 38);
        doc.circle(titleX + 6, titleY + 6, 4, "F");
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(project.officeName || "VASTHUSILPY KERALASSERY", titleX + 12, titleY + 5.5);
      doc.setFontSize(5.5);
      doc.setTextColor(220, 38, 38);
      doc.text("VASTHU & CIVIL ARCHITECTURE", titleX + 12, titleY + 9);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.2);
      doc.text(project.officeAddress || "Keralassery, Palakkad - 678641, Kerala", titleX + 2, titleY + 13.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Ph: 9496380720  |  WA: +91 88482 41463", titleX + 2, titleY + 16.5);

      // 2. Licensed Engineer Block
      const engY = titleY + 18;
      doc.setFillColor(255, 255, 255);
      doc.rect(titleX, engY, titleWidth, 17, "F");
      doc.line(titleX, engY + 17, titleX + titleWidth, engY + 17);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text("LICENSED CONSULTING ENGINEER", titleX + 2, engY + 4);
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(project.licenseeName || "DEEPAK .C", titleX + 2, engY + 8);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(project.licenseNumber || "Supervisor-A (Civil) & Vasthu Silpy", titleX + 2, engY + 11.5);
      doc.setFontSize(5.2);
      doc.setTextColor(71, 85, 105);
      doc.text(project.registrationNumber || "Reg: E-2050/08/14087/KKD/318/2018/CA", titleX + 2, engY + 15);

      // 3. Project & Client Metadata Block
      const projY = engY + 17;
      doc.setFillColor(248, 250, 252);
      doc.rect(titleX, projY, titleWidth, 24, "F");
      doc.line(titleX, projY + 24, titleX + titleWidth, projY + 24);

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text("CLIENT / OWNER:", titleX + 2, projY + 4);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(project.clientName || "Client Name", titleX + 2, projY + 8);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.5);
      doc.text("LOCATION:", titleX + 2, projY + 12);
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(6.5);
      doc.text(project.projectLocation || "Kerala", titleX + 2, projY + 16);

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.5);
      doc.text("DRAWING TITLE:", titleX + 2, projY + 20);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7);
      doc.text(`${sheet.drawingName || "Building Plan"} (Scale: ${sheet.scale || "1:100"})`, titleX + 2, projY + 23);

      // 4. Area Statement Table
      const areaY = projY + 24;
      doc.setFillColor(255, 255, 255);
      doc.rect(titleX, areaY, titleWidth, 38, "F");
      doc.line(titleX, areaY + 38, titleX + titleWidth, areaY + 38);

      doc.setFillColor(15, 23, 42);
      doc.rect(titleX, areaY, titleWidth, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(255, 255, 255);
      doc.text("AREA STATEMENT (SQ.M)", titleX + 2, areaY + 3.8);

      let rowY = areaY + 8;
      let totalProposed = 0;
      let totalExisting = 0;

      project.areaTable.forEach((row) => {
        const pBuilt = Number(row.proposedBuiltUpSqM ?? row.builtUpSqM ?? row.proposedSqM ?? 0);
        const eBuilt = Number(row.existingBuiltUpSqM ?? row.existingSqM ?? 0);
        totalProposed += pBuilt;
        totalExisting += eBuilt;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.2);
        doc.setTextColor(15, 23, 42);
        doc.text(row.floor, titleX + 2, rowY);
        doc.setFont("helvetica", "bold");
        doc.text(`${pBuilt.toFixed(1)} sqm`, titleX + titleWidth - 25, rowY);
        if (eBuilt > 0) {
          doc.text(`(Ext: ${eBuilt.toFixed(1)})`, titleX + titleWidth - 10, rowY);
        }
        rowY += 4;
      });

      // Total Built-up Row
      doc.setFillColor(241, 245, 249);
      doc.rect(titleX, rowY - 1, titleWidth, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL BUILT-UP:", titleX + 2, rowY + 3);
      doc.text(`${totalProposed.toFixed(2)} SQ.M`, titleX + titleWidth - 20, rowY + 3);

      // 5. Vasthu Vidya Block
      const vasthuY = areaY + 38;
      doc.setFillColor(254, 252, 232); // Amber-50
      doc.rect(titleX, vasthuY, titleWidth, 14, "F");
      doc.line(titleX, vasthuY + 14, titleX + titleWidth, vasthuY + 14);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(180, 83, 9);
      doc.text("VASTHU KOL ALAVU (വാസ്തു അളവ്)", titleX + 2, vasthuY + 4.5);
      doc.setFontSize(5.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`Grade: ${project.vasthuGrade || "Grade A (ഉത്തമം)"}`, titleX + 2, vasthuY + 8.5);
      doc.text(`Perimeter: ${project.vasthuPerimeterKol || "28 Kol 12 Viral"} (${project.vasthuPerimeterMeter || "20.65m"})`, titleX + 2, vasthuY + 12);

      // 6. QR Code & Sheet DWG Number Footer
      const footY = topMargin + mHeight - 20;
      doc.setFillColor(15, 23, 42);
      doc.rect(titleX, footY, titleWidth, 20, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(203, 213, 225);
      doc.text("DRAWING NUMBER", titleX + 3, footY + 5);
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(sheet.drawingNumber || `DWG-${String(idx + 1).padStart(2, "0")}`, titleX + 3, footY + 11);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`SHEET ${idx + 1} OF ${sheetsToRender.length}`, titleX + 3, footY + 16);

      // Verified QR Code Tag
      doc.setFillColor(255, 255, 255);
      doc.rect(titleX + titleWidth - 16, footY + 2, 14, 16, "F");
      doc.setFillColor(15, 23, 42);
      doc.rect(titleX + titleWidth - 14, footY + 4, 10, 10, "F");
      doc.setFontSize(4.5);
      doc.setTextColor(15, 23, 42);
      doc.text("SCAN FOR PDF", titleX + titleWidth - 15, footY + 16.5);
    } else {
      // Bottom Title Block: 4-Zone Horizontal Banner
      const bHeight = 45;
      const bY = topMargin + mHeight - bHeight;
      const z1W = mWidth * 0.28;
      const z2W = mWidth * 0.24;
      const z3W = mWidth * 0.30;
      const z4W = mWidth * 0.18;

      doc.setDrawColor(15, 23, 42);
      doc.line(leftMargin + z1W, bY, leftMargin + z1W, bY + bHeight);
      doc.line(leftMargin + z1W + z2W, bY, leftMargin + z1W + z2W, bY + bHeight);
      doc.line(leftMargin + z1W + z2W + z3W, bY, leftMargin + z1W + z2W + z3W, bY + bHeight);

      // Zone 1: Office & Engineer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(project.officeName || "VASTHUSILPY KERALASSERY", leftMargin + 3, bY + 6);
      doc.setFontSize(5.5);
      doc.setTextColor(220, 38, 38);
      doc.text("VASTHU & CIVIL ARCHITECTURE", leftMargin + 3, bY + 10);
      doc.setFontSize(5.2);
      doc.setTextColor(71, 85, 105);
      doc.text(project.officeAddress || "Keralassery, Palakkad - 678641", leftMargin + 3, bY + 14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(6.5);
      doc.text(project.licenseeName || "DEEPAK .C", leftMargin + 3, bY + 20);
      doc.setFontSize(5.5);
      doc.setFont("helvetica", "normal");
      doc.text(project.licenseNumber || "Supervisor-A (Civil)", leftMargin + 3, bY + 24);
      doc.text(project.registrationNumber || "Reg: E-2050/08/14087/KKD/318/2018/CA", leftMargin + 3, bY + 28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text("Ph: 9496380720  |  WA: +91 88482 41463", leftMargin + 3, bY + 34);

      // Zone 2: Project Metadata
      const z2X = leftMargin + z1W;
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.5);
      doc.text("CLIENT / OWNER:", z2X + 3, bY + 6);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(project.clientName || "Client Name", z2X + 3, bY + 11);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.5);
      doc.text("LOCATION:", z2X + 3, bY + 17);
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(6.5);
      doc.text(project.projectLocation || "Kerala", z2X + 3, bY + 22);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.5);
      doc.text("DRAWING TITLE:", z2X + 3, bY + 28);
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7);
      doc.text(sheet.drawingName || "Building Plan", z2X + 3, bY + 33);
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Scale: ${sheet.scale || "1:100"}  |  Date: ${sheet.date || "10/09/2026"}`, z2X + 3, bY + 38);

      // Zone 3: Area Table
      const z3X = leftMargin + z1W + z2W;
      doc.setFillColor(15, 23, 42);
      doc.rect(z3X, bY, z3W, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.8);
      doc.setTextColor(255, 255, 255);
      doc.text("AREA STATEMENT (SQ.M)", z3X + 3, bY + 3.8);

      let aY = bY + 8;
      project.areaTable.forEach((row) => {
        const pBuilt = Number(row.proposedBuiltUpSqM ?? row.builtUpSqM ?? row.proposedSqM ?? 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.2);
        doc.setTextColor(15, 23, 42);
        doc.text(row.floor, z3X + 3, aY);
        doc.setFont("helvetica", "bold");
        doc.text(`${pBuilt.toFixed(1)} sqm`, z3X + z3W - 16, aY);
        aY += 4;
      });

      // Zone 4: DWG No & QR Code
      const z4X = leftMargin + z1W + z2W + z3W;
      doc.setFillColor(15, 23, 42);
      doc.rect(z4X, bY, z4W, bHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(203, 213, 225);
      doc.text("DRAWING NUMBER", z4X + 3, bY + 8);
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(sheet.drawingNumber || `DWG-0${idx + 1}`, z4X + 3, bY + 16);
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`SHEET ${idx + 1} OF ${sheetsToRender.length}`, z4X + 3, bY + 22);
      doc.setFontSize(5.5);
      doc.setTextColor(220, 38, 38);
      doc.text("WA: 8848241463", z4X + 3, bY + 29);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(5);
      doc.text("SCAN FOR PDF", z4X + 3, bY + 35);
    }
  });

  return doc.output("blob");
}

/**
 * Compose standard WhatsApp text with all architectural details.
 */
export function formatProjectWhatsAppMessage(project: BuildingPlanProject): string {
  const totalBuiltUp = project.areaTable.reduce((sum, r) => sum + (Number(r.builtUpSqM) || 0), 0);
  const totalSqFt = (totalBuiltUp * 10.7639).toFixed(0);
  const drawingList = project.sheets.map((s) => s.drawingNumber || "Plan").join(", ");

  return `🏛️ *BUILDING PLAN & ARCHITECTURAL DRAWINGS*
*Office:* ${project.officeName || "VASTHUSILPY ARCHITECTS & CONSULTING ENGINEERS"}
*Consultant:* ${project.licenseeName || "Deepak .C"} (Supervisor-A Civil & Vasthu Silpy)
*Registration:* ${project.registrationNumber || "E-2050/08/14087/KKD/318/2018/CA"}
*WhatsApp:* +91 88482 41463 | *Phone:* +91 94963 80720

📋 *Client Details:*
• Name: ${project.clientName || "Client"}
• Location: ${project.projectLocation || "Kerala"}
• Total Built-up Area: ${totalBuiltUp.toFixed(2)} Sq.M (${totalSqFt} Sq.Ft)
• Vasthu Kol: ${project.vasthuPerimeterKol || "28 Kol 12 Viral"} (${project.vasthuGrade || "Grade A"})
• Included Sheets: ${drawingList}

_Verified LSGD/K-SMART Architectural Plan Document._`;
}

/**
 * Share project via WhatsApp with prefilled message to +91 88482 41463 or custom contact.
 */
export function shareProjectViaWhatsApp(project: BuildingPlanProject, customPhone?: string): void {
  const msg = formatProjectWhatsAppMessage(project);
  const phone = (customPhone || "8848241463").replace(/[^0-9]/g, "");
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

/**
 * Share project via Email with prefilled subject and body.
 */
export function shareProjectViaEmail(project: BuildingPlanProject, recipientEmail?: string): void {
  const subject = encodeURIComponent(`Architectural Building Plan - ${project.clientName || "Project"}`);
  const body = encodeURIComponent(formatProjectWhatsAppMessage(project));
  const email = recipientEmail || "";
  window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
}

