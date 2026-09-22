import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { CrmProject, Invoice } from "../types";
import { VASTHUSILPY_LOGO_DATA_URL } from "../data/vasthusilpyLogo";
import { getOrAssignReceiptNumber } from "./receiptNumberManager";

/**
 * Builds the public zero-login client live status URL for a project
 */
export function getClientProjectPortalUrl(projectId: string): string {
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    return `${origin}/?project=${encodeURIComponent(projectId)}`;
  }
  return `https://vasthusilpyai.netlify.app/?project=${encodeURIComponent(projectId)}`;
}

let cachedLogoPng: string | null = null;

/**
 * Converts the Vasthusilpy circular logo into a clean, high-resolution PNG data URL
 * so that jsPDF can embed it seamlessly without SVG encoding issues.
 */
async function getVasthusilpyLogoPng(): Promise<string> {
  if (cachedLogoPng) return cachedLogoPng;
  if (typeof window === "undefined" || !document) return "";

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, 400, 400);
            ctx.drawImage(img, 0, 0, 400, 400);
            const pngData = canvas.toDataURL("image/png");
            cachedLogoPng = pngData;
            resolve(pngData);
            return;
          }
        } catch (err) {
          console.warn("Failed canvas drawing of logo:", err);
        }
        resolve("");
      };
      img.onerror = () => resolve("");
      img.src = VASTHUSILPY_LOGO_DATA_URL;
    } catch {
      resolve("");
    }
  });
}

/**
 * Draws a sharp, vector scissors icon for the cut line in jsPDF
 */
function drawVectorScissors(doc: jsPDF, cx: number, cy: number, scale = 1) {
  doc.saveGraphicsState();
  doc.setDrawColor(100, 116, 139); // slate-500
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.3 * scale);

  // Left & right handle loops
  doc.circle(cx - 2.6 * scale, cy - 1.3 * scale, 1.2 * scale, "FD");
  doc.circle(cx - 2.6 * scale, cy + 1.3 * scale, 1.2 * scale, "FD");

  // Crossed blades
  doc.line(cx - 1.4 * scale, cy + 1.0 * scale, cx + 4.2 * scale, cy - 1.5 * scale);
  doc.line(cx - 1.4 * scale, cy - 1.0 * scale, cx + 4.2 * scale, cy + 1.5 * scale);

  // Central pivot screw
  doc.setFillColor(71, 85, 105);
  doc.circle(cx + 0.5 * scale, cy, 0.4 * scale, "F");

  doc.restoreGraphicsState();
}

/**
 * Draws a single complete work receipt at the given Y coordinate.
 * Exactly identical layout, proportions, typography, and dimensions
 * for both CUSTOMER COPY and OFFICE COPY.
 * 
 * Sized to fit precisely in 40% of A4 page with 2 receipts stacked vertically.
 */
function drawSingleReceipt(
  doc: jsPDF,
  project: CrmProject,
  invoice: Invoice | undefined,
  startY: number,
  receiptHeight: number,
  copyType: "CUSTOMER COPY" | "OFFICE COPY",
  receiptNo: string,
  entryDate: string,
  logoPng: string,
  qrDataUrl: string
) {
  const pageWidth = 210;
  const margin = 7;
  const contentWidth = pageWidth - margin * 2; // 196 mm
  const endY = startY + receiptHeight;

  // 1. Outer Receipt Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, startY, contentWidth, receiptHeight, 1.2, 1.2, "FD");

  // Top Accent Header Band
  const headerBandHeight = 8.8;
  const isCustomer = copyType === "CUSTOMER COPY";
  doc.setFillColor(isCustomer ? 248 : 241, isCustomer ? 250 : 245, isCustomer ? 252 : 249);
  doc.roundedRect(margin, startY, contentWidth, headerBandHeight, 1.2, 1.2, "F");
  // Retouch bottom corners of header band
  doc.rect(margin, startY + headerBandHeight - 1.5, contentWidth, 1.5, "F");

  // Bottom line of header band
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, startY + headerBandHeight, margin + contentWidth, startY + headerBandHeight);

  // 2. Logo & Office Branding
  const logoSize = 7.2;
  const logoX = margin + 2.2;
  const logoY = startY + 0.8;

  if (logoPng) {
    try {
      doc.addImage(logoPng, "PNG", logoX, logoY, logoSize, logoSize);
    } catch {
      // Fallback vector emblem
      doc.setFillColor(185, 28, 28);
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("VS", logoX + logoSize / 2, logoY + 4.8, { align: "center" });
    }
  } else {
    doc.setFillColor(185, 28, 28);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("VS", logoX + logoSize / 2, logoY + 4.8, { align: "center" });
  }

  // Office Details Text
  const textX = logoX + logoSize + 2.5;
  doc.setTextColor(185, 28, 28); // Vasthusilpy Red
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS", textX, startY + 3.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.8);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text("Architectural Plans • 3D Elevation • KPBR & K-SMART Approvals • Structural Valuation • Estimates", textX, startY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.2);
  doc.setTextColor(71, 85, 105);
  doc.text("Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 7012383137, 9747995961 | deepak.vasthusilpy@gmail.com", textX, startY + 7.8);

  // 3. Top Right Badge (CUSTOMER COPY vs OFFICE COPY)
  const badgeWidth = 40;
  const badgeX = margin + contentWidth - badgeWidth - 2;
  const badgeY = startY + 1.0;
  const badgeHeight = 6.8;

  doc.setFillColor(isCustomer ? 238 : 254, isCustomer ? 242 : 242, isCustomer ? 255 : 242);
  doc.setDrawColor(isCustomer ? 99 : 185, isCustomer ? 102 : 28, isCustomer ? 241 : 28);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 0.8, 0.8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.0);
  doc.setTextColor(isCustomer ? 67 : 153, isCustomer ? 56 : 27, isCustomer ? 202 : 27);
  doc.text(copyType, badgeX + badgeWidth / 2, badgeY + 2.8, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(185, 28, 28);
  doc.text(`${receiptNo} • ${entryDate}`, badgeX + badgeWidth / 2, badgeY + 5.6, { align: "center" });

  // 4. Main Body: Left (Particulars & Financials) + Right (Clean QR Code with NO instruction below)
  const y = startY + headerBandHeight + 1.2;
  const qrBoxWidth = 35;
  const leftBoxWidth = contentWidth - qrBoxWidth - 4; // 196 - 35 - 4 = 157 mm
  const qrBoxX = margin + leftBoxWidth + 3;

  // --- LEFT CARD: Client Particulars & Work Scope (Height = 22.5 mm) ---
  const particularsHeight = 21.0;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin + 1, y, leftBoxWidth, particularsHeight, 0.8, 0.8, "FD");

  // Row 1: Client Name, Phone, Location & Lead
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("CLIENT:", margin + 3, y + 3.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  const clientName = project.clientName || "Client";
  doc.text(clientName.length > 22 ? clientName.slice(0, 20) + "..." : clientName, margin + 17, y + 3.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("PHONE:", margin + 62, y + 3.8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(15, 23, 42);
  doc.text(project.clientPhone || "+91 9747995961", margin + 74, y + 3.8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("SITE:", margin + 106, y + 3.8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.0);
  doc.setTextColor(30, 41, 59);
  const loc = project.location || "Palakkad, Kerala";
  doc.text(loc.length > 22 ? loc.slice(0, 20) + "..." : loc, margin + 116, y + 3.8);

  // Row 2: Work Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("WORK:", margin + 3, y + 8.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(185, 28, 28);
  const workTitle = project.title || "Civil Architectural Work";
  doc.text(workTitle.length > 55 ? workTitle.slice(0, 53) + "..." : workTitle, margin + 17, y + 8.2);

  // Row 3: Description Snippet
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  const rawDesc = project.description || "Vasthu planning, 3D architectural drawings & K-SMART municipal submission.";
  const cleanDesc = rawDesc.replace(/[\n\r]+/g, " ");
  const descSnippet = cleanDesc.length > 100 ? cleanDesc.slice(0, 98) + "..." : cleanDesc;
  doc.text(descSnippet, margin + 3, y + 12.5);

  // Row 4: Status, Due Date, Subtasks & Assigned Lead
  const totalSubtasks = (project.subTasks || []).length;
  const completedSubtasks = (project.subTasks || []).filter((s) => s.completed).length;
  const statusLabel = project.status || "REGISTERED";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(185, 28, 28);
  doc.text(`STATUS: ${statusLabel}`, margin + 3, y + 17.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("DUE:", margin + 48, y + 17.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text(project.dueDate || "As Scheduled", margin + 57, y + 17.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(14, 116, 144);
  doc.text(`Subtasks: ${completedSubtasks}/${totalSubtasks}`, margin + 92, y + 17.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("LEAD:", margin + 124, y + 17.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.8);
  doc.setTextColor(14, 116, 144);
  doc.text(project.assignee || "DEEPAK", margin + 135, y + 17.5);

  // --- FINANCIAL STATEMENT BOX (WITH ADVANCE PAYMENT PROVISION) ---
  const finY = y + particularsHeight + 1.5;
  const finHeight = 16.5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin + 1, finY, leftBoxWidth, finHeight, 0.8, 0.8, "FD");

  // Calculate amounts with Advance Payment Provision
  const billAmount = invoice?.grandTotal || project.estimatedAmount || 0;
  const advanceAmount = project.advancePayment || invoice?.advancePayment || 0;
  const totalPaid = (invoice?.totalPaid !== undefined && invoice.totalPaid > 0)
    ? invoice.totalPaid
    : (advanceAmount > 0 ? advanceAmount : (invoice?.totalPaid || 0));
  const balanceDue = invoice?.balanceDue !== undefined
    ? invoice.balanceDue
    : Math.max(0, billAmount - totalPaid);

  // 4-Column Financial Metric Grid (Total Bill, Advance Paid, Total Paid, Balance Due)
  const colWidth = (leftBoxWidth - 5) / 4;
  const metricY = finY + 1.2;

  // 1. Total Bill
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 2, metricY, colWidth, 9.2, 0.6, 0.6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.6);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL BILL", margin + 2 + colWidth / 2, metricY + 3.0, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 23, 42);
  doc.text(`₹${billAmount.toLocaleString("en-IN")}`, margin + 2 + colWidth / 2, metricY + 7.2, { align: "center" });

  // 2. Advance Paid
  doc.setFillColor(240, 253, 244); // light emerald
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + 3 + colWidth, metricY, colWidth, 9.2, 0.6, 0.6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text("ADVANCE PAID", margin + 3 + colWidth + colWidth / 2, metricY + 3.0, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(21, 128, 61);
  doc.text(`₹${advanceAmount.toLocaleString("en-IN")}`, margin + 3 + colWidth + colWidth / 2, metricY + 7.2, { align: "center" });

  // 3. Total Paid
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(204, 251, 241);
  doc.roundedRect(margin + 4 + colWidth * 2, metricY, colWidth, 9.2, 0.6, 0.6, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.6);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text("TOTAL PAID", margin + 4 + colWidth * 2 + colWidth / 2, metricY + 3.0, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(15, 118, 110);
  doc.text(`₹${totalPaid.toLocaleString("en-IN")}`, margin + 4 + colWidth * 2 + colWidth / 2, metricY + 7.2, { align: "center" });

  // 4. Balance Due
  const hasBalance = balanceDue > 0;
  doc.setFillColor(hasBalance ? 254 : 240, hasBalance ? 242 : 253, hasBalance ? 242 : 244);
  doc.setDrawColor(hasBalance ? 254 : 187, hasBalance ? 202 : 247, hasBalance ? 202 : 208);
  doc.roundedRect(margin + 5 + colWidth * 3, metricY, colWidth, 9.2, 0.6, 0.6, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(hasBalance ? 185 : 21, hasBalance ? 28 : 128, hasBalance ? 28 : 61);
  doc.text("BALANCE DUE", margin + 5 + colWidth * 3 + colWidth / 2, metricY + 3.0, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(hasBalance ? 185 : 21, hasBalance ? 28 : 128, hasBalance ? 28 : 61);
  doc.text(hasBalance ? `₹${balanceDue.toLocaleString("en-IN")}` : "NIL (PAID)", margin + 5 + colWidth * 3 + colWidth / 2, metricY + 7.2, { align: "center" });

  // Advance Payment Mode / Note
  doc.setFont("helvetica", "normal");
  doc.setFontSize(4.8);
  doc.setTextColor(71, 85, 105);
  if (advanceAmount > 0) {
    const advMode = project.advancePaymentMode || "Cash / UPI";
    const advDate = project.advancePaymentDate || entryDate;
    const advRef = project.advancePaymentRef ? `Ref: ${project.advancePaymentRef}` : "";
    doc.text(`Advance Receipt: ₹${advanceAmount.toLocaleString("en-IN")} via ${advMode} on ${advDate} ${advRef}`.trim(), margin + 3, finY + 13.8);
  } else {
    doc.text("UPI Payment: 7012383137@okbizaxis / 9567627277@naviaxis | Bank: SBI, Keralassery", margin + 3, finY + 13.8);
  }

  // --- RIGHT BOX: CLEAN QR CODE (STRICTLY NO INSTRUCTION TEXT BELOW QR) ---
  const qrBoxHeight = particularsHeight + finHeight + 1.5; // 21 + 16.5 + 1.5 = 39.0 mm
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(qrBoxX, y, qrBoxWidth, qrBoxHeight, 0.8, 0.8, "FD");

  // Render QR Code centered in the box (without any text below it)
  if (qrDataUrl) {
    try {
      const qrSize = 34.0;
      const qrX = qrBoxX + (qrBoxWidth - qrSize) / 2;
      const qrY = y + (qrBoxHeight - qrSize) / 2;
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    } catch (e) {
      console.warn("QR render failed:", e);
    }
  }

  // 5. Bottom Footer Signoff & Copy Label
  const footerY = endY - 1.8;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(margin + 2, endY - 3.2, margin + contentWidth - 2, endY - 3.2);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(4.4);
  doc.setTextColor(100, 116, 139);
  doc.text("Official Vasthusilpy Work Receipt & Project Acknowledgement • Computer Generated", margin + 3, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(4.6);
  doc.setTextColor(isCustomer ? 67 : 153, isCustomer ? 56 : 27, isCustomer ? 202 : 27);
  doc.text(`--- ${copyType} ---`, margin + contentWidth - 3, footerY, { align: "right" });
}

/**
 * Generates an official vector PDF Work Receipt for a CRM project.
 * 
 * Strict User Requirements:
 * - Exactly 2 receipts one below another on the SAME SIZE.
 * - Top Receipt: CUSTOMER RECEIPT (CUSTOMER COPY).
 * - Bottom Receipt: OFFICE RECEIPT (OFFICE COPY).
 * - Separated by a clear scissor cut line in the middle.
 * - Integrated provision for Advance Payment, Total Bill, and Balance Due.
 */
export const generateWorkReceiptPdfBlob = async (
  project: CrmProject,
  invoice?: Invoice
): Promise<{ blob: Blob; base64: string; dataUri: string }> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4", // 210 mm x 297 mm
  });

  const pageWidth = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2; // 194 mm

  // 1. Sequential receipt number (VS000001, VS000002, etc.)
  const receiptNo = getOrAssignReceiptNumber(project);

  // 2. Format Entry Date
  let entryDate = project.createdAt || new Date().toISOString().split("T")[0];
  try {
    const d = new Date(entryDate);
    if (!isNaN(d.getTime())) {
      entryDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
  } catch {
    // keep default
  }

  // 3. Prepare Logo PNG and QR Data URL
  const logoPng = await getVasthusilpyLogoPng();
  const portalUrl = getClientProjectPortalUrl(project.id);
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(portalUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Failed to generate QR Code for Work Receipt:", err);
  }

  // 4. Calculate receipt heights for exactly 2 receipts on top 40% of A4 (297mm total height)
  // 40% of 297mm = 118.8mm.
  // Each receipt height = 52.0 mm
  // Top receipt: 5.0mm -> 57.0mm
  // Cut line: 60.2mm
  // Bottom receipt: 63.4mm -> 115.4mm (~38.8% ≈ 40% of A4 page, remaining 60%+ is blank white space)
  const receiptHeight = 52.0;
  
  // RECEIPT 1 (Top): CUSTOMER COPY
  const receipt1StartY = 5.0;
  drawSingleReceipt(
    doc,
    project,
    invoice,
    receipt1StartY,
    receiptHeight,
    "CUSTOMER COPY",
    receiptNo,
    entryDate,
    logoPng,
    qrDataUrl
  );

  // 5. SCISSOR CUT SEPARATOR LINE IN THE MIDDLE
  const cutY = receipt1StartY + receiptHeight + 3.2; // ~60.2 mm
  
  // Left scissor
  drawVectorScissors(doc, margin + 4, cutY, 0.75);
  
  // Left dashed line
  doc.saveGraphicsState();
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2.0, 2.0], 0);
  doc.line(margin + 10, cutY, pageWidth / 2 - 36, cutY);
  doc.restoreGraphicsState();

  // Center Cut Text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("✂  CUT HERE (CUSTOMER COPY / OFFICE COPY)  ✂", pageWidth / 2, cutY + 0.8, { align: "center" });

  // Right dashed line
  doc.saveGraphicsState();
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2.0, 2.0], 0);
  doc.line(pageWidth / 2 + 36, cutY, pageWidth - margin - 10, cutY);
  doc.restoreGraphicsState();

  // Right scissor
  drawVectorScissors(doc, pageWidth - margin - 4, cutY, 0.75);

  // RECEIPT 2 (Bottom): OFFICE COPY (EXACT SAME SIZE & PROPORTIONS)
  const receipt2StartY = cutY + 3.2; // ~63.4 mm (End Y = 115.4 mm, occupying ~40% of A4 page; rest 60% is blank white space)
  drawSingleReceipt(
    doc,
    project,
    invoice,
    receipt2StartY,
    receiptHeight,
    "OFFICE COPY",
    receiptNo,
    entryDate,
    logoPng,
    qrDataUrl
  );

  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];
  const blob = doc.output("blob");

  return { blob, base64, dataUri };
};

/**
 * Downloads the Work Receipt PDF directly in the browser
 */
export async function downloadWorkReceiptPdf(
  project: CrmProject,
  invoice?: Invoice
): Promise<void> {
  const { blob } = await generateWorkReceiptPdfBlob(project, invoice);
  const receiptNo = getOrAssignReceiptNumber(project);
  const safeClientName = (project.clientName || "Client").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Work_Receipt_${receiptNo}_${safeClientName}_Vasthusilpy.pdf`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sends the Work Receipt PDF via email or mail client
 */
export async function sendWorkReceiptEmail({
  project,
  invoice,
  recipientEmail,
  customNotes
}: {
  project: CrmProject;
  invoice?: Invoice;
  recipientEmail: string;
  customNotes?: string;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const receiptNo = getOrAssignReceiptNumber(project);
    const portalUrl = getClientProjectPortalUrl(project.id);
    const billAmount = invoice?.grandTotal || project.estimatedAmount || 0;
    const advanceAmount = project.advancePayment || invoice?.advancePayment || 0;
    const totalPaid = (invoice?.totalPaid !== undefined && invoice.totalPaid > 0)
      ? invoice.totalPaid
      : (advanceAmount > 0 ? advanceAmount : 0);
    const balanceDue = invoice?.balanceDue !== undefined
      ? invoice.balanceDue
      : Math.max(0, billAmount - totalPaid);

    // Trigger download of receipt PDF for immediate client attachment
    await downloadWorkReceiptPdf(project, invoice);

    const subject = encodeURIComponent(
      `Official Work Receipt #${receiptNo} - Vasthusilpy Architectural Consultants`
    );

    const body = encodeURIComponent(
      `Dear ${project.clientName || "Client"},\n\n` +
      `Thank you for entrusting your project to Vasthusilpy Architectural & Engineering Consultants.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `OFFICIAL WORK RECEIPT & PROJECT ACKNOWLEDGEMENT\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• Receipt Number: ${receiptNo}\n` +
      `• Work / Project: ${project.title || "Civil Architectural Work"}\n` +
      `• Site Location: ${project.location || "Palakkad, Kerala"}\n` +
      `• Assigned Lead: ${project.assignee || "DEEPAK"}\n` +
      `• Target Due Date: ${project.dueDate || "As Scheduled"}\n` +
      `• Total Bill: ₹${billAmount.toLocaleString("en-IN")}\n` +
      (advanceAmount > 0 ? `• Advance Paid: ₹${advanceAmount.toLocaleString("en-IN")}\n` : "") +
      `• Total Amount Paid: ₹${totalPaid.toLocaleString("en-IN")}\n` +
      `• Balance Due: ₹${balanceDue.toLocaleString("en-IN")}\n\n` +
      `📱 ZERO-LOGIN LIVE CLIENT TRACKING PORTAL:\n` +
      `You can check your project's live progress, download plans, view structural 3D revisions & municipal submission status anytime without a password:\n` +
      `👉 ${portalUrl}\n\n` +
      (customNotes ? `📌 Note from Consultant:\n${customNotes}\n\n` : "") +
      `📎 Your official work receipt PDF has been prepared.\n\n` +
      `Warm regards,\n` +
      `VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS\n` +
      `Near Panchayath Office, Keralassery, Palakkad - 678641\n` +
      `Ph: +91 7012383137, +91 9747995961\n` +
      `Email: deepak.vasthusilpy@gmail.com\n` +
      `Web: www.vasthusilpy.com`
    );

    // Open native mailto with filled details
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, "_blank");

    return {
      success: true,
      message: `Work receipt generated and mail composer opened for ${recipientEmail}.`
    };
  } catch (err: any) {
    console.error("Failed to send work receipt email:", err);
    throw new Error(err.message || "Failed to dispatch work receipt email.");
  }
}
