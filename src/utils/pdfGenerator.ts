import { jsPDF } from "jspdf";
import { PoovMalaBillRow, PoovMalaVendorConfig } from "../types";

/**
 * Generates and downloads a high quality, professional PDF statement for Poov Mala bills.
 */
export function generatePoovMalaStatementPdf(
  rows: PoovMalaBillRow[],
  vendor: PoovMalaVendorConfig
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  // Background Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 28, "F");

  // Title & Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("Civil, Architectural & Vasthu Consulting Office | Keralassery, Palakkad", margin + 6, y + 16);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text("POOV MALA (FLOWER GARLAND) BILLING & LEDGER STATEMENT", margin + 6, y + 23);

  y += 34;

  // Vendor & Statement Meta Info Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, "FD");

  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Vendor: ${vendor.vendorName.toUpperCase()}`, margin + 5, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`GPay / Mobile: ${vendor.gpayNumber}`, margin + 5, y + 12);
  doc.text(`Rate per Mala: Rs. ${vendor.defaultDailyRate} / day`, margin + 5, y + 18);

  const currentDateStr = new Date().toLocaleDateString("en-GB");
  doc.setFont("helvetica", "bold");
  doc.text(`Statement Date: ${currentDateStr}`, pageWidth - margin - 65, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Billing Periods: ${rows.length}`, pageWidth - margin - 65, y + 12);
  doc.text(`Exclusion Rule: Sundays Auto Excluded`, pageWidth - margin - 65, y + 18);

  y += 28;

  // Table Column Headers
  const colX = {
    period: margin + 2,
    sundays: margin + 48,
    leaves: margin + 74,
    working: margin + 98,
    rate: margin + 118,
    bill: margin + 133,
    paid: margin + 150,
    due: margin + 167
  };

  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("BILL PERIOD (FROM - TO)", colX.period, y + 5.5);
  doc.text("EXCL. SUN", colX.sundays, y + 5.5);
  doc.text("LEAVES", colX.leaves, y + 5.5);
  doc.text("NET DAYS", colX.working, y + 5.5);
  doc.text("RATE", colX.rate, y + 5.5);
  doc.text("BILL (Rs.)", colX.bill, y + 5.5);
  doc.text("PAID (Rs.)", colX.paid, y + 5.5);
  doc.text("STATUS", colX.due, y + 5.5);

  y += 8;

  let totalBill = 0;
  let totalPaid = 0;
  let totalWorkingDays = 0;
  let totalLeaves = 0;

  if (rows.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - margin * 2, 14, "S");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("No billing records recorded in the ledger yet.", pageWidth / 2, y + 9, { align: "center" });
    y += 14;
  } else {
    rows.forEach((row, i) => {
      // Check for page break
      if (y > 255) {
        doc.addPage();
        y = 16;
      }

      const rowWorkingDays = Math.max(0, (row.daysExcludeSundays || 0) - (row.otherLeave || 0));
      const rowDue = Math.max(0, row.amount - row.paidAmount);

      totalBill += Number(row.amount) || 0;
      totalPaid += Number(row.paidAmount) || 0;
      totalWorkingDays += rowWorkingDays;
      totalLeaves += Number(row.otherLeave) || 0;

      // Alternate row background
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 10, "F");
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 10, pageWidth - margin, y + 10);

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${row.dateFrom} to ${row.dateTo}`, colX.period, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(`${row.daysExcludeSundays}d`, colX.sundays, y + 4.5);

      if (row.otherLeave > 0) {
        doc.setTextColor(180, 83, 9); // amber-700
        doc.text(`${row.otherLeave}d`, colX.leaves, y + 4.5);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text(`0`, colX.leaves, y + 4.5);
      }

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`${rowWorkingDays}d`, colX.working, y + 4.5);

      doc.setFont("helvetica", "normal");
      doc.text(`Rs.${row.ratePerDay}`, colX.rate, y + 4.5);

      doc.setFont("helvetica", "bold");
      doc.text(`Rs.${row.amount.toLocaleString("en-IN")}`, colX.bill, y + 4.5);

      doc.setTextColor(16, 149, 193); // cyan
      doc.text(row.paidAmount > 0 ? `Rs.${row.paidAmount.toLocaleString("en-IN")}` : "-", colX.paid, y + 4.5);

      // Status pill
      if (row.status === "PAYMENT COMPLETED") {
        doc.setTextColor(22, 101, 52); // green
        doc.text("PAID", colX.due, y + 4.5);
      } else if (row.status === "PARTIAL") {
        doc.setTextColor(180, 83, 9); // amber
        doc.text(`PART (Rs.${rowDue})`, colX.due, y + 4.5);
      } else {
        doc.setTextColor(190, 24, 93); // rose
        doc.text("PENDING", colX.due, y + 4.5);
      }

      // Remarks / Leave reason under row if any
      if (row.leaveDetails || row.remarks) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const remarkText = `Note/Leave: ${row.leaveDetails || row.remarks}`;
        doc.text(remarkText.slice(0, 75), colX.period, y + 8.5);
      }

      y += 10;
    });
  }

  const totalDue = Math.max(0, totalBill - totalPaid);

  y += 4;
  if (y > 240) {
    doc.addPage();
    y = 16;
  }

  // Summary Card
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FINANCIAL SUMMARY & SETTLEMENT BALANCE", margin + 6, y + 7);

  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Total Bill Amount: Rs. ${totalBill.toLocaleString("en-IN")}`, margin + 6, y + 14);
  doc.text(`Total Paid: Rs. ${totalPaid.toLocaleString("en-IN")}`, margin + 6, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  if (totalDue > 0) {
    doc.setTextColor(251, 113, 133); // rose-400
    doc.text(`BALANCE DUE: Rs. ${totalDue.toLocaleString("en-IN")}`, pageWidth - margin - 75, y + 14);
  } else {
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(`STATUS: FULLY SETTLED (Rs. 0 DUE)`, pageWidth - margin - 75, y + 14);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Total Working Days: ${totalWorkingDays} days (${totalLeaves} leaves)`, pageWidth - margin - 75, y + 21);

  y += 34;

  // Payment Instruction & Signature
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 1, 1, "S");

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("GPay / UPI Payment Instructions:", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`Pay to Mobile / GPay: ${vendor.gpayNumber} (${vendor.vendorName})`, margin + 4, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Authorized Signature / Office Stamp:", pageWidth - margin - 65, y + 6);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("Vasthusilpy Engineering Accounts", pageWidth - margin - 65, y + 13);

  // Footer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("This is an electronically generated statement from Vasthusilpy Office Accounts Management System.", pageWidth / 2, 290, { align: "center" });

  // Save PDF file
  const fileName = `Poov_Mala_Statement_${vendor.vendorName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

/**
 * Generates and downloads a single bill voucher PDF for Poov Mala.
 */
export function generateSinglePoovMalaBillPdf(
  row: PoovMalaBillRow,
  vendor: PoovMalaVendorConfig
): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a5" // Clean A5 voucher format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 12;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, pageWidth - margin * 2, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VASTHUSILPY ARCHITECTURAL & ENGINEERING", margin + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(56, 189, 248);
  doc.text("POOV MALA BILLING RECEIPT / PAYMENT VOUCHER", margin + 4, y + 16);

  y += 28;

  // Bill Period Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 85, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Voucher ID: ${row.id}`, margin + 5, y + 8);
  doc.text(`Bill Period: ${row.dateFrom} to ${row.dateTo}`, margin + 5, y + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Vendor Name: ${vendor.vendorName}`, margin + 5, y + 24);
  doc.text(`GPay Number: ${vendor.gpayNumber}`, margin + 5, y + 31);
  doc.text(`Calendar Days Excl. Sundays: ${row.daysExcludeSundays} Days`, margin + 5, y + 38);
  doc.text(`Leaves Deducted: ${row.otherLeave} Day(s)`, margin + 5, y + 45);

  const netWorkingDays = Math.max(0, (row.daysExcludeSundays || 0) - (row.otherLeave || 0));
  doc.setFont("helvetica", "bold");
  doc.text(`Net Working Days: ${netWorkingDays} Days`, margin + 5, y + 52);
  doc.text(`Rate per Garland: Rs. ${row.ratePerDay}`, margin + 5, y + 59);

  if (row.leaveDetails || row.remarks) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Leave / Note: ${row.leaveDetails || row.remarks}`, margin + 5, y + 66);
  }

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 5, y + 71, pageWidth - margin - 5, y + 71);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Bill Amount: Rs. ${row.amount.toLocaleString("en-IN")}`, margin + 5, y + 78);

  const rowDue = Math.max(0, row.amount - row.paidAmount);
  if (row.paidAmount > 0) {
    doc.setTextColor(16, 149, 193);
    doc.text(`Paid: Rs. ${row.paidAmount.toLocaleString("en-IN")}`, pageWidth - margin - 50, y + 78);
  } else {
    doc.setTextColor(190, 24, 93);
    doc.text(`Due: Rs. ${rowDue.toLocaleString("en-IN")}`, pageWidth - margin - 50, y + 78);
  }

  y += 92;

  // Status & Payment Method
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`Payment Status: ${row.status}`, margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  if (row.paidDate) {
    doc.text(`Paid Date: ${row.paidDate} | Mode: ${row.paymentMode || "GPay"}`, margin + 5, y + 14);
  } else {
    doc.text(`Pending payment of Rs. ${rowDue} to GPay: ${vendor.gpayNumber}`, margin + 5, y + 14);
  }

  const fileName = `Poov_Mala_Bill_${row.dateFrom}_to_${row.dateTo}.pdf`.replace(/\//g, "-");
  doc.save(fileName);
}
