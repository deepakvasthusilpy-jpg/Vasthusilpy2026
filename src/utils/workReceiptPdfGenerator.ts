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
 * Generates an official vector PDF Work Receipt for a CRM project.
 * 
 * Strict Layout Mandate:
 * - Printed strictly on a VERTICAL (PORTRAIT) A4 sheet (210mm × 297mm).
 * - Receipt occupies ONLY 20% OF THE TOP OF THE A4 SHEET (0mm to ~59.4mm).
 * - Small Vasthusilpy logo on top with office details.
 * - Highlighted in bold: Client Name, Work Title, and Receipt No (starting with VS000001).
 * - Bill details, payment details, and entry date.
 * - File tracking QR code on the right.
 * - Scissor cut symbol & dashed line exactly below the receipt at the 20% mark (59.4mm).
 * - Bottom 80% of the A4 sheet is left clean and blank for easy cutting.
 * - No instructions, no text links, no working stages, no signature blocks.
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
  const pageHeight = 297;
  const margin = 7;
  const contentWidth = pageWidth - margin * 2; // 196 mm

  // 1. Ensure sequential receipt number (VS000001, VS000002, etc.)
  const receiptNo = getOrAssignReceiptNumber(project);

  // Format Entry Date
  let entryDate = project.createdAt || new Date().toISOString().split("T")[0];
  try {
    const d = new Date(entryDate);
    if (!isNaN(d.getTime())) {
      entryDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
  } catch {
    // keep default
  }

  // Financial details
  const billAmount = invoice?.grandTotal || project.estimatedAmount || 0;
  const paidAmount = invoice?.totalPaid || 0;
  const balanceDue = invoice ? (invoice.balanceDue || 0) : Math.max(0, billAmount - paidAmount);

  // ==========================================
  // TOP OFFICE DETAILS & SMALL LOGO (Y = 3.2 to 12.8 mm)
  // ==========================================
  const logoPng = await getVasthusilpyLogoPng();
  const logoSize = 8.5; // Small logo as requested
  const logoX = margin;
  const logoY = 3.5;

  if (logoPng) {
    try {
      doc.addImage(logoPng, "PNG", logoX, logoY, logoSize, logoSize);
    } catch {
      // Fallback vector circular emblem if image fails
      doc.setFillColor(230, 0, 0);
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text("VA", logoX + logoSize / 2, logoY + 5.2, { align: "center" });
    }
  } else {
    // Fallback vector circular emblem
    doc.setFillColor(230, 0, 0);
    doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text("VA", logoX + logoSize / 2, logoY + 5.2, { align: "center" });
  }

  // Office Details text beside small logo
  const textX = logoX + logoSize + 2.5;
  doc.setTextColor(185, 28, 28); // Vasthusilpy Red
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS", textX, 6.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Civil Architectural Consultancy • Planning • 3D • K-SMART Approvals • Valuation", textX, 9.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 7012383137, 9747995961 | deepak.vasthusilpy@gmail.com", textX, 12.0);

  // Top Right Badge: WORK RECEIPT (Y = 3.5 to 13.0)
  const badgeWidth = 36;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, 3.5, badgeWidth, 9.5, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text("WORK RECEIPT", badgeX + badgeWidth / 2, 6.7, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  // Highlight Receipt No in bold
  doc.text(receiptNo, badgeX + badgeWidth / 2, 9.8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(71, 85, 105);
  doc.text(`ENTRY: ${entryDate}`, badgeX + badgeWidth / 2, 12.2, { align: "center" });

  // Divider line below header
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(margin, 13.8, pageWidth - margin, 13.8);

  // =========================================================================
  // BODY SECTION: LEFT PARTICULARS & RIGHT QR CODE (Y = 15.0 to 53.0 mm)
  // =========================================================================
  const qrColWidth = 36;
  const leftColWidth = contentWidth - qrColWidth - 3; // 196 - 36 - 3 = 157 mm
  const qrColX = margin + leftColWidth + 3; // 7 + 157 + 3 = 167 mm

  // --- 1. RECEIPT METADATA BAR (Y = 15.0 to 19.5, height = 4.5 mm) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, 15.0, leftColWidth, 4.5, 0.8, 0.8, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("RECEIPT NO:", margin + 2.5, 18.2);

  // Highlight Receipt No in BOLD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(receiptNo, margin + 20, 18.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("ENTRY DATE:", margin + 55, 18.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(entryDate, margin + 73, 18.2);

  // Status Badge
  const statusColors: Record<string, string> = {
    COMPLETED: "COMPLETED",
    IN_PROGRESS: "IN PROGRESS",
    PENDING: "REGISTERED",
    ON_HOLD: "ON HOLD",
    CANCELLED: "CANCELLED"
  };
  const statusLabel = statusColors[project.status] || project.status || "ACTIVE";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(14, 116, 144);
  doc.text(`[ STATUS: ${statusLabel} ]`, margin + leftColWidth - 3, 18.2, { align: "right" });

  // --- 2. CLIENT DETAILS & WORK DETAILS (Y = 20.5 to 37.5, height = 17.0 mm) ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, 20.5, leftColWidth, 17.0, 1, 1, "FD");

  // Client Details Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Client Name:", margin + 2.5, 24.2);

  // Highlight Client Name in BOLD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const clientName = project.clientName || "Client";
  doc.text(clientName.length > 25 ? clientName.slice(0, 23) + "..." : clientName, margin + 20, 24.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Phone:", margin + 75, 24.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(project.clientPhone || "+91 9747995961", margin + 85, 24.2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Location:", margin + 118, 24.2);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const loc = project.location || "Palakkad, Kerala";
  doc.text(loc.length > 18 ? loc.slice(0, 16) + "..." : loc, margin + 130, 24.2);

  // Work Details Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Work / Project:", margin + 2.5, 28.5);

  // Highlight Work in BOLD
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const workTitle = project.title || "Civil Architectural Work";
  doc.text(workTitle.length > 65 ? workTitle.slice(0, 63) + "..." : workTitle, margin + 20, 28.5);

  // Work Scope Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text("Work Scope:", margin + 2.5, 32.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const desc = project.description || "Architectural Drawing, 3D Elevation & Municipal Approval";
  doc.text(desc.length > 75 ? desc.slice(0, 73) + "..." : desc, margin + 20, 32.5);

  // Lead & Target Date Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text("Assigned Lead:", margin + 2.5, 36.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(project.assignee || "Deepak V", margin + 20, 36.2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Target Due Date:", margin + 75, 36.2);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(project.dueDate || "As Scheduled", margin + 98, 36.2);

  // --- 3. BILL DETAILS AND PAYMENT DETAILS (Y = 38.5 to 53.0, height = 14.5 mm) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(margin, 38.5, leftColWidth, 14.5, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text("BILL DETAILS & PAYMENT DETAILS", margin + 2.5, 41.5);

  // Col 1: Total Bill
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Total Bill Amount:", margin + 2.5, 45.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`INR ${Number(billAmount).toLocaleString("en-IN")}`, margin + 2.5, 49.0);

  // Col 2: Amount Paid
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Amount Paid:", margin + 55, 45.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`INR ${Number(paidAmount).toLocaleString("en-IN")}`, margin + 55, 49.0);

  // Col 3: Balance Due
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Balance Due:", margin + 105, 45.2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(balanceDue > 0 ? 220 : 16, balanceDue > 0 ? 38 : 185, balanceDue > 0 ? 38 : 129);
  doc.text(balanceDue <= 0 ? "INR 0.00 (PAID)" : `INR ${Number(balanceDue).toLocaleString("en-IN")}`, margin + 105, 49.0);

  // Sub-note: Linked Invoice info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  const invLabel = invoice?.invoiceNumber ? `Linked Invoice #${invoice.invoiceNumber}` : (project.invoiceId ? `Linked Invoice #${project.invoiceId}` : "Invoice Pending");
  doc.text(`Status: ${balanceDue <= 0 ? "Settled" : (paidAmount > 0 ? "Partially Paid" : "Payment Due")} | ${invLabel}`, margin + 2.5, 52.0);

  // --- 4. RIGHT CARD: FILE TRACKING QR CODE (Y = 15.0 to 53.0, height = 38.0 mm) ---
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(qrColX, 15.0, qrColWidth, 38.0, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text("FILE TRACKING QR", qrColX + qrColWidth / 2, 18.5, { align: "center" });

  // Generate and embed tracking QR code
  const portalUrl = getClientProjectPortalUrl(project.id);
  const qrSize = 25;
  const qrX = qrColX + (qrColWidth - qrSize) / 2;
  const qrY = 19.8;

  try {
    const qrDataUrl = await QRCode.toDataURL(portalUrl, {
      width: 250,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M"
    });
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } catch (err) {
    console.error("Failed to generate tracking QR code:", err);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(15, 23, 42);
  doc.text("SCAN TO TRACK FILE", qrColX + qrColWidth / 2, 48.0, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text("Live Status 24/7", qrColX + qrColWidth / 2, 51.0, { align: "center" });

  // =========================================================================
  // SCISSOR CUT LINE & CUT SYMBOL (Y = 59.4mm - EXACTLY AT 20% MARK OF 297mm A4)
  // =========================================================================
  const cutY = 59.4; // 20% of 297mm = 59.4mm

  // Vector scissors on both sides
  drawVectorScissors(doc, margin + 4, cutY, 0.75);
  drawVectorScissors(doc, pageWidth - margin - 4, cutY, 0.75);

  // Dashed Cut Line
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(margin + 12, cutY, pageWidth / 2 - 25, cutY);
  doc.line(pageWidth / 2 + 25, cutY, pageWidth - margin - 12, cutY);

  // Reset dash pattern
  doc.setLineDashPattern([], 0);

  // Centered Cut Symbol text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("✂  CUT HERE (TOP 20% SLIP)  ✂", pageWidth / 2, cutY + 0.6, { align: "center" });

  // Note: The rest of the page (from 59.4mm to 297mm, i.e. 80% of vertical A4) is completely clean & blank.

  // Output PDF
  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];
  const blob = doc.output("blob");

  return { blob, base64, dataUri };
};

/**
 * Downloads the Work Receipt PDF directly in the browser
 */
export async function downloadWorkReceiptPdf(project: CrmProject, invoice?: Invoice): Promise<void> {
  const { blob } = await generateWorkReceiptPdfBlob(project, invoice);
  const receiptNo = project.receiptNumber || `VS_${project.id}`;
  const cleanTitle = (project.title || "Work").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
  const fileName = `Vasthusilpy_Work_Receipt_${receiptNo}_${cleanTitle}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Dispatches the Work Receipt PDF via email to the client's entered mail ID
 * Uses the backend /api/crm/send-work-receipt-email endpoint with nodemailer
 */
export async function sendWorkReceiptEmail(params: {
  project: CrmProject;
  invoice?: Invoice;
  recipientEmail?: string;
  customNotes?: string;
}): Promise<{ success: boolean; message: string; senderEmail?: string }> {
  const targetEmail = (params.recipientEmail || params.project.clientEmail || "").trim();
  if (!targetEmail || !targetEmail.includes("@")) {
    throw new Error("A valid recipient email address is required to dispatch the work receipt.");
  }

  // 1. Generate PDF base64
  const { base64 } = await generateWorkReceiptPdfBlob(params.project, params.invoice);

  // 2. Call backend server endpoint
  const response = await fetch("/api/crm/send-work-receipt-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      project: params.project,
      invoice: params.invoice,
      recipientEmail: targetEmail,
      customNotes: params.customNotes || "",
      pdfBase64: base64
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  const result = await response.json();
  return result;
}
