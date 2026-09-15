import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Invoice, PaymentRecord } from "../types";

export const generateUpiPaymentUri = (invoice: Invoice): string => {
  const upiId = "7012383137@okbizaxis";
  const payeeName = "DEEPAK C";
  const requiredAmount = typeof invoice.balanceDue === "number" && invoice.balanceDue > 0 
    ? invoice.balanceDue 
    : (invoice.grandTotal || 0);
  
  const cleanNote = `Invoice ${invoice.invoiceNumber || "Payment"}`;
  
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${requiredAmount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;
};

export const generateInvoicePdfBlob = async (invoice: Invoice): Promise<{ blob: Blob; base64: string; dataUri: string }> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Document Top Corporate Header (Pure Black & White)
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS", margin, 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Near Panchayath Office, Keralassery, Palakkad - 678641, Kerala", margin, 21);
  doc.text("Ph: +91 9747995961, +91 7012383137 | Email: deepak.vasthusilpy@gmail.com", margin, 26);
  doc.text("Architectural Plans • Structural 3D • KPBR & K-SMART Approvals • Valuation • PWD Estimates", margin, 31);

  // Solid black divider rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, 35, pageWidth - margin, 35);

  y = 45;

  // TAX INVOICE Header & Badge
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TAX INVOICE", margin, y);

  // Status Badge (Black and white with solid border)
  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const isPartial = invoice.paymentStatus === "PARTIALLY PAID" || ((invoice.totalPaid || 0) > 0 && (invoice.balanceDue || 0) > 0);
  const statusText = isPaid ? "PAID IN FULL" : isPartial ? "PARTIALLY PAID" : "PAYMENT DUE";

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth - margin - 44, y - 6, 44, 8, 1.5, 1.5, "FD");
  doc.setTextColor(0, 0, 0);
  doc.text(`[ ${statusText} ]`, pageWidth - margin - 44 + 22, y - 0.8, { align: "center" });

  y += 8;

  // Metadata Grid (Invoice details & Client details)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth / 2 - 2, 35, 1.5, 1.5, "FD");
  doc.roundedRect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 35, 1.5, 1.5, "FD");

  // Left Box: Bill To
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("BILLED TO / CLIENT DETAILS:", margin + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(invoice.applicantName || "Client", margin + 4, y + 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`Mobile: +91 ${invoice.applicantMobile || "-"}`, margin + 4, y + 17);
  if (invoice.applicantEmail) {
    doc.text(`Email: ${invoice.applicantEmail}`, margin + 4, y + 22);
  }
  if (invoice.applicantAddress) {
    const splitAddr = doc.splitTextToSize(`Address: ${invoice.applicantAddress}`, contentWidth / 2 - 10);
    doc.text(splitAddr, margin + 4, y + (invoice.applicantEmail ? 27 : 22));
  }

  // Right Box: Invoice Reference Info
  const rightX = margin + contentWidth / 2 + 6;
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("INVOICE PARTICULARS:", rightX, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Invoice Number:", rightX, y + 12);
  doc.setFont("helvetica", "bold");
  doc.text(`#${invoice.invoiceNumber}`, rightX + 32, y + 12);

  doc.setFont("helvetica", "normal");
  doc.text("Invoice Date:", rightX, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.invoiceDate || "-", rightX + 32, y + 17);

  doc.setFont("helvetica", "normal");
  doc.text("Due Date:", rightX, y + 22);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.dueDate || "-", rightX + 32, y + 22);

  if (invoice.projectTitle) {
    doc.setFont("helvetica", "normal");
    doc.text("Project Title:", rightX, y + 27);
    doc.setFont("helvetica", "bold");
    doc.text(invoice.projectTitle.slice(0, 26), rightX + 32, y + 27);
  }

  y += 42;

  // Work Items Table Header (Solid Black Bar with crisp white text, or clean bordered header)
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("SL", margin + 3, y + 5.5);
  doc.text("DESCRIPTION OF WORK / SERVICE", margin + 14, y + 5.5);
  doc.text("QTY", margin + contentWidth - 65, y + 5.5, { align: "right" });
  doc.text("UNIT", margin + contentWidth - 45, y + 5.5, { align: "center" });
  doc.text("RATE (INR)", margin + contentWidth - 25, y + 5.5, { align: "right" });
  doc.text("AMOUNT (INR)", margin + contentWidth - 3, y + 5.5, { align: "right" });

  y += 8;

  // Table Rows (Crisp white rows with black text and black borders)
  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);

  items.forEach((item, idx) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 7, "F");

    // Row borders
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 7, margin + contentWidth, y + 7);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(String(idx + 1), margin + 3, y + 4.8);

    doc.setFont("helvetica", "bold");
    const desc = item.description || `Item #${idx + 1}`;
    doc.text(desc.length > 55 ? desc.slice(0, 52) + "..." : desc, margin + 14, y + 4.8);

    doc.text(String(item.quantity || 1), margin + contentWidth - 65, y + 4.8, { align: "right" });
    doc.text(item.unit || "unit", margin + contentWidth - 45, y + 4.8, { align: "center" });
    doc.text(Number(item.rate || 0).toLocaleString("en-IN"), margin + contentWidth - 25, y + 4.8, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text(Number(item.amount || 0).toLocaleString("en-IN"), margin + contentWidth - 3, y + 4.8, { align: "right" });

    y += 7;
  });

  // Table Outer Frame Box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + contentWidth, y);

  y += 6;

  // Totals Breakdown (Right Aligned Box - Pure Black and White)
  const totalsBoxWidth = 85;
  const totalsX = margin + contentWidth - totalsBoxWidth;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(totalsX, y, totalsBoxWidth, 38, 1.5, 1.5, "FD");

  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", totalsX + 4, y + 6);
  doc.text(`INR ${Number(invoice.subTotal || invoice.grandTotal || 0).toLocaleString("en-IN")}`, totalsX + totalsBoxWidth - 4, y + 6, { align: "right" });

  if (invoice.discount > 0) {
    doc.text("Discount:", totalsX + 4, y + 12);
    doc.text(`- INR ${Number(invoice.discount).toLocaleString("en-IN")}`, totalsX + totalsBoxWidth - 4, y + 12, { align: "right" });
  }

  doc.line(totalsX + 3, y + 15, totalsX + totalsBoxWidth - 3, y + 15);

  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", totalsX + 4, y + 20);
  doc.text(`INR ${Number(invoice.grandTotal || 0).toLocaleString("en-IN")}`, totalsX + totalsBoxWidth - 4, y + 20, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Total Paid:", totalsX + 4, y + 26);
  doc.setFont("helvetica", "bold");
  doc.text(`INR ${Number(invoice.totalPaid || 0).toLocaleString("en-IN")}`, totalsX + totalsBoxWidth - 4, y + 26, { align: "right" });

  // Highlight Balance Due Box in crisp black border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(totalsX + 3, y + 29, totalsX + totalsBoxWidth - 3, y + 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("BALANCE DUE:", totalsX + 4, y + 34.5);
  if (isPaid) {
    doc.text("INR 0.00 (PAID IN FULL)", totalsX + totalsBoxWidth - 4, y + 34.5, { align: "right" });
  } else {
    doc.text(`INR ${Number(invoice.balanceDue || 0).toLocaleString("en-IN")}`, totalsX + totalsBoxWidth - 4, y + 34.5, { align: "right" });
  }

  // Left side: If Paid, show Official Settlement & Receipt Badge. If Unpaid, show QR Code in black and white.
  const qrBoxWidth = contentWidth - totalsBoxWidth - 6;
  if (isPaid) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, qrBoxWidth, 38, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    doc.text("PAYMENT RECEIVED IN FULL - INVOICE SETTLED", margin + 5, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Amount Received: INR ${Number(invoice.totalPaid || invoice.grandTotal).toLocaleString("en-IN")}`, margin + 5, y + 15);
    doc.text(`Settlement Status: Closed & Discharged`, margin + 5, y + 20);

    const lastPayment = (invoice.payments && invoice.payments.length > 0) ? invoice.payments[invoice.payments.length - 1] : null;
    if (lastPayment) {
      doc.text(`Latest Transaction: INR ${lastPayment.amount.toLocaleString("en-IN")} via ${lastPayment.paymentMode || "UPI"} on ${lastPayment.date}`, margin + 5, y + 25);
      if (lastPayment.referenceNo) {
        doc.text(`Reference / UTR: ${lastPayment.referenceNo}`, margin + 5, y + 30);
      }
    } else {
      doc.text("All outstanding dues against this tax invoice have been fully cleared.", margin + 5, y + 26);
    }
  } else {
    // QR Code & Payment Instructions on Left (Black & White)
    const upiUri = generateUpiPaymentUri(invoice);
    try {
      const qrDataUrl = await QRCode.toDataURL(upiUri, {
        width: 250,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, qrBoxWidth, 38, 1.5, 1.5, "FD");

      // Embed QR Image
      doc.addImage(qrDataUrl, "PNG", margin + 3, y + 3, 32, 32);

      // QR payment instructions (Pure Black)
      const payTextX = margin + 38;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text("SCAN QR TO PAY VIA UPI", payTextX, y + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(`Amount Due: INR ${Number(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal).toLocaleString("en-IN")}`, payTextX, y + 11);
      doc.text("UPI ID: 7012383137@okbizaxis", payTextX, y + 15);
      doc.text("Payee: DEEPAK C", payTextX, y + 19);
      doc.text(`Invoice Reference: #${invoice.invoiceNumber}`, payTextX, y + 23);
      doc.text("Google Pay • PhonePe • Paytm • BHIM • Any UPI", payTextX, y + 27);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text("Scan with any UPI app to pay invoice balance due.", payTextX, y + 31);
    } catch (e) {
      console.error("Failed to render QR Code into PDF:", e);
    }
  }

  y += 44;

  // Official Bank Details & Notes (Crisp Black and White)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  const extraNotes = invoice.notes || invoice.terms;
  const boxHeight = extraNotes ? 24 : 18;
  doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("OFFICIAL BANK ACCOUNT & PAYMENT DETAILS:", margin + 4, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("NAME : DEEPAK C   |   ACCOUNT NO : 1062 5047 526   |   IFSC CODE : SBIN0007624   |   BANK : SBI , KERALASSERY", margin + 4, y + 10);
  doc.text("UPI PAYMENT : 9567627277@naviaxis   |   7012383137@naviaxis      (QR PAY : 7012383137@okbizaxis)", margin + 4, y + 14);

  if (extraNotes) {
    const combinedNotes = `${invoice.notes ? `Notes: ${invoice.notes}` : ""}${invoice.terms ? ` | Terms: ${invoice.terms}` : ""}`;
    const splitNotes = doc.splitTextToSize(combinedNotes, contentWidth - 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(splitNotes, margin + 4, y + 19);
    y += boxHeight + 4;
  } else {
    y += boxHeight + 4;
  }

  // Footer & Digital Verification (Crisp Black and White, No signature / seal)
  const footerY = Math.max(y + 6, 260);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Thank you for choosing Vasthusilpy Architectural & Engineering Consultants.", margin, footerY + 5);
  doc.text("This is an official computer-generated tax invoice verified with digital records.", margin, footerY + 9);

  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];
  const blob = doc.output("blob");

  return { blob, base64, dataUri };
};

export const generateReceiptPdfBlob = async (
  invoice: Invoice,
  payment?: PaymentRecord
): Promise<{ blob: Blob; base64: string; dataUri: string }> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  // Header Titles (Crisp Black and White)
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS", margin, 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text("Near Panchayath Office, Keralassery, Palakkad - 678641, Kerala", margin, 21);
  doc.text("Ph: +91 9747995961, +91 7012383137 | Email: deepak.vasthusilpy@gmail.com", margin, 26);
  doc.text("Architectural Plans • Structural 3D • KPBR & K-SMART Approvals • Valuation • PWD Estimates", margin, 31);

  // Solid black divider rule
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, 35, pageWidth - margin, 35);

  y = 45;

  // Title & Receipt Badge
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("OFFICIAL PAYMENT RECEIPT & SETTLEMENT", margin, y);

  const isClosed = (invoice.balanceDue || 0) <= 0;
  doc.setFontSize(9);
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth - margin - 48, y - 6, 48, 8, 1.5, 1.5, "FD");
  doc.setTextColor(0, 0, 0);
  doc.text(isClosed ? "[ INVOICE CLOSED • PAID ]" : "[ PARTIAL RECEIPT ]", pageWidth - margin - 48 + 24, y - 0.8, { align: "center" });

  y += 8;

  // Receipt Number & Date Strip
  const receiptNo = `REC-${invoice.invoiceNumber}-${payment?.id ? payment.id.slice(-4) : "TX"}`;
  const receiptDate = payment?.date || new Date().toISOString().split("T")[0];

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text("RECEIPT NUMBER:", margin + 4, y + 6);
  doc.text(receiptNo, margin + 36, y + 6);

  doc.text("RECEIPT DATE:", margin + contentWidth / 2 + 4, y + 6);
  doc.text(receiptDate, margin + contentWidth / 2 + 30, y + 6);

  doc.text("INVOICE REF:", margin + 4, y + 11);
  doc.text(`#${invoice.invoiceNumber} (${invoice.projectTitle || "Consultancy Services"})`, margin + 36, y + 11);

  y += 18;

  // Received From & Payment Mode
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 54, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("Received with thanks from:", margin + 6, y + 8);
  doc.setFontSize(11);
  doc.text(invoice.applicantName, margin + 6, y + 15);

  doc.setFontSize(8.5);
  doc.text(`Mobile: +91 ${invoice.applicantMobile || "-"} | Address: ${invoice.applicantAddress || "Keralassery, Palakkad"}`, margin + 6, y + 21);

  // Large Amount Box
  const paymentAmount = payment ? payment.amount : invoice.totalPaid;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 4, y + 26, contentWidth - 8, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text("AMOUNT RECEIVED:", margin + 8, y + 33);

  doc.setFontSize(16);
  doc.text(`INR ${Number(paymentAmount).toLocaleString("en-IN")}`, margin + 8, y + 42);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const modeText = payment?.paymentMode || "Bank payment / UPI";
  const refText = payment?.referenceNo ? ` | Ref / UTR: ${payment.referenceNo}` : "";
  const accText = payment?.account ? ` | Credited To: ${payment.account}` : "";
  doc.text(`Payment Mode: ${modeText}${refText}${accText}`, margin + 80, y + 42);

  y += 60;

  // Account Statement / Invoice Settlement Summary Table
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("INVOICE PARTICULARS & ACCOUNT RECONCILIATION", margin + 4, y + 5.5);

  y += 8;

  // Table row
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, 38, "F");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, y, contentWidth, 38, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);

  doc.text("Invoice Total Amount:", margin + 6, y + 8);
  doc.text(`INR ${Number(invoice.grandTotal).toLocaleString("en-IN")}`, margin + contentWidth - 6, y + 8, { align: "right" });

  doc.text("Total Paid to Date (including this receipt):", margin + 6, y + 16);
  doc.text(`INR ${Number(invoice.totalPaid).toLocaleString("en-IN")}`, margin + contentWidth - 6, y + 16, { align: "right" });

  doc.setDrawColor(0, 0, 0);
  doc.line(margin + 4, y + 20, margin + contentWidth - 4, y + 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  if (isClosed) {
    doc.text("REMAINING BALANCE DUE:", margin + 6, y + 28);
    doc.text("INR 0.00 (FULLY SETTLED & CLOSED)", margin + contentWidth - 6, y + 28, { align: "right" });
    doc.setFontSize(7.5);
    doc.text("✓ This invoice is officially closed and archived in Vasthusilpy digital records.", margin + 6, y + 34);
  } else {
    doc.text("REMAINING BALANCE DUE:", margin + 6, y + 28);
    doc.text(`INR ${Number(invoice.balanceDue).toLocaleString("en-IN")}`, margin + contentWidth - 6, y + 28, { align: "right" });
    doc.setFontSize(7.5);
    doc.text(`Due Date for remaining balance: ${invoice.dueDate}`, margin + 6, y + 34);
  }

  y += 44;

  // Memo / Notes
  if (payment?.memo || payment?.notes || invoice.notes) {
    const noteContent = payment?.memo || payment?.notes || invoice.notes || "";
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text("MEMO / TRANSACTION REMARKS:", margin + 4, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(noteContent, margin + 4, y + 10);
    y += 20;
  }

  // Footer Signatory
  const footerY = Math.max(y + 6, 255);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, margin + contentWidth, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("This is an official computer-generated receipt from Vasthusilpy Consultants.", margin, footerY + 5);
  doc.text("Verified with digital banking ledger records.", margin, footerY + 9);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("For VASTHUSILPY CONSULTANTS", pageWidth - margin - 55, footerY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Authorized Signatory / Accounts Desk", pageWidth - margin - 55, footerY + 12);

  const dataUri = doc.output("datauristring");
  const base64 = dataUri.split(",")[1];
  const blob = doc.output("blob");

  return { blob, base64, dataUri };
};

