import { Invoice, PaymentRecord } from "../types";
import { generateUpiPaymentUri, generateInvoicePdfBlob, generateReceiptPdfBlob } from "./invoicePdfGenerator";
import { getCachedToken, ensureGoogleAccessToken } from "../lib/googleWorkspace";

export const getInvoiceSharePortalUrl = (invoice: Invoice | string): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const identifier = typeof invoice === "string" ? invoice : (invoice.id || invoice.invoiceNumber);
  return `${origin}/?invoice_share=${encodeURIComponent(identifier)}`;
};

export const formatInvoiceWhatsAppMessage = (invoice: Invoice): string => {
  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const isPartial = invoice.paymentStatus === "PARTIALLY PAID" || ((invoice.totalPaid || 0) > 0 && (invoice.balanceDue || 0) > 0);
  const statusEmoji = isPaid ? "✅ FULLY PAID & CLOSED" : isPartial ? "⏳ PARTIALLY PAID" : "⚠️ PAYMENT DUE";
  
  const requiredAmount = typeof invoice.balanceDue === "number" && invoice.balanceDue > 0
    ? invoice.balanceDue
    : (invoice.grandTotal || 0);

  const upiPayUri = generateUpiPaymentUri(invoice);
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiPayUri)}`;
  const portalUrl = getInvoiceSharePortalUrl(invoice);

  const itemsText = (invoice.items || [])
    .map((item, idx) => `  ${idx + 1}. ${item.description} (${item.quantity} ${item.unit || "unit"}) - ₹${Number(item.amount || 0).toLocaleString("en-IN")}`)
    .join("\n");

  const upiId = "7012383137@okbizaxis";

  return `🏛️ *VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS*
📍 Near Panchayath Office, Keralassery, Palakkad - 678641
📞 Contact: +91 9747995961 | +91 7012383137
✉️ Email: deepak.vasthusilpy@gmail.com

━━━━━━━━━━━━━━━━━━━━
📄 *TAX INVOICE #${invoice.invoiceNumber}*
━━━━━━━━━━━━━━━━━━━━
👤 *Client Name:* ${invoice.applicantName}
📱 *Mobile:* +91 ${invoice.applicantMobile || "-"}
${invoice.applicantAddress ? `📍 *Address:* ${invoice.applicantAddress}\n` : ""}${invoice.projectTitle ? `📁 *Project:* ${invoice.projectTitle}\n` : ""}📅 *Invoice Date:* ${invoice.invoiceDate}
⏰ *Due Date:* ${invoice.dueDate}
📊 *Status:* ${statusEmoji}

📋 *ITEMS & SERVICES BREAKDOWN:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ₹${Number(invoice.subTotal || invoice.grandTotal || 0).toLocaleString("en-IN")}
${invoice.discount > 0 ? `🎁 *Discount:* -₹${Number(invoice.discount).toLocaleString("en-IN")}\n` : ""}💰 *Grand Total:* ₹${Number(invoice.grandTotal || 0).toLocaleString("en-IN")}
✅ *Total Paid:* ₹${Number(invoice.totalPaid || 0).toLocaleString("en-IN")}
🔴 *REQUIRED PAYMENT AMOUNT (Balance Due):* ₹${Number(requiredAmount).toLocaleString("en-IN")}
━━━━━━━━━━━━━━━━━━━━

📄 *VIEW / DOWNLOAD VERIFIED INVOICE ONLINE:*
👉 ${portalUrl}

${!isPaid ? `💳 *INSTANT PAYMENT LINK (Google Pay / PhonePe / Paytm / BHIM):*
👉 ${upiPayUri}

📲 *SCAN & PAY QR CODE LINK (Amount Due: ₹${Number(requiredAmount).toLocaleString("en-IN")}):*
👉 ${qrCodeImageUrl}

🏦 *BANK & UPI PAYMENT DETAILS:*
• NAME : DEEPAK C
• ACCOUNT NO : 1062 5047 526
• IFSC CODE : SBIN0007624
• BANK : SBI , KERALASSERY
• UPI PAYMENT :
  9567627277@naviaxis
  7012383137@naviaxis
• QR PAYMENT UPI ID : 7012383137@okbizaxis
` : "🎉 *INVOICE IS FULLY SETTLED & ARCHIVED.*"}

${invoice.notes ? `\n📌 *Notes:* ${invoice.notes}\n` : ""}${invoice.terms ? `📝 *Terms:* ${invoice.terms}\n` : ""}
📎 *Attached Document:* Official Tax Invoice PDF with payment details.

Thank you for choosing Vasthusilpy Architectural & Engineering Consultants!`;
};

export const formatPaymentReceiptWhatsAppMessage = (
  invoice: Invoice,
  payment?: PaymentRecord
): string => {
  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const paymentAmount = payment ? payment.amount : invoice.totalPaid;
  const receiptNo = `REC-${invoice.invoiceNumber}-${payment?.id ? payment.id.slice(-4) : "TX"}`;
  const receiptDate = payment?.date || new Date().toISOString().split("T")[0];
  const portalUrl = getInvoiceSharePortalUrl(invoice);

  return `🏛️ *VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS*
📍 Near Panchayath Office, Keralassery, Palakkad - 678641
📞 Contact: +91 9747995961 | +91 7012383137
✉️ Email: deepak.vasthusilpy@gmail.com

━━━━━━━━━━━━━━━━━━━━
🧾 *OFFICIAL PAYMENT RECEIPT & INVOICE SETTLEMENT*
━━━━━━━━━━━━━━━━━━━━
🔢 *Receipt Number:* ${receiptNo}
📅 *Receipt Date:* ${receiptDate}
📄 *Invoice Reference:* #${invoice.invoiceNumber}
👤 *Client Name:* ${invoice.applicantName}
📱 *Mobile:* +91 ${invoice.applicantMobile || "-"}
${invoice.projectTitle ? `📁 *Project:* ${invoice.projectTitle}\n` : ""}
━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT RECEIVED:* ₹${Number(paymentAmount).toLocaleString("en-IN")}
💳 *Payment Mode:* ${payment?.paymentMode || "Bank payment / UPI"}
${payment?.referenceNo ? `🔢 *Ref / UTR Number:* ${payment.referenceNo}\n` : ""}${payment?.account ? `🏦 *Credited To:* ${payment.account}\n` : ""}${payment?.memo ? `📝 *Memo:* ${payment.memo}\n` : ""}━━━━━━━━━━━━━━━━━━━━

📊 *ACCOUNT RECONCILIATION SUMMARY:*
• Invoice Grand Total: ₹${Number(invoice.grandTotal || 0).toLocaleString("en-IN")}
• Total Amount Paid: ₹${Number(invoice.totalPaid || 0).toLocaleString("en-IN")}
• Remaining Balance Due: ${isPaid ? "₹0.00 (FULLY SETTLED)" : `₹${Number(invoice.balanceDue || 0).toLocaleString("en-IN")}`}
• Status: ${isPaid ? "🎉 INVOICE CLOSED & FULLY PAID" : "⏳ PARTIAL PAYMENT RECORDED"}

📄 *VIEW & DOWNLOAD OFFICIAL RECEIPT & CLOSED INVOICE:*
👉 ${portalUrl}

📎 *Attached:* The official Payment Receipt & Closed Tax Invoice PDF document.

Thank you for your payment and continued trust in Vasthusilpy Architectural & Engineering Consultants!`;
};

/**
 * Downloads a Blob as a file in the browser
 */
export const triggerDownloadPdf = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
};

export interface ShareWhatsAppResult {
  success: boolean;
  sharedWithAttachment: boolean;
  downloaded: boolean;
  waUrl: string;
  message: string;
}

/**
 * Sends Invoice or Payment Receipt via WhatsApp.
 * - First attempts native Web Share API with the PDF file attached!
 * - If Web Share is not supported or canceled, downloads the PDF file automatically and opens WhatsApp Web/App with the pre-filled direct portal link.
 */
export const sendInvoiceOrReceiptViaWhatsApp = async (
  invoice: Invoice,
  options?: {
    isReceipt?: boolean;
    payment?: PaymentRecord;
    customNotes?: string;
  }
): Promise<ShareWhatsAppResult> => {
  const isReceipt = !!options?.isReceipt;
  const payment = options?.payment;

  const cleanPhone = (invoice.applicantMobile || "").replace(/\D/g, "");
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const messageText = isReceipt
    ? formatPaymentReceiptWhatsAppMessage(invoice, payment)
    : formatInvoiceWhatsAppMessage(invoice);

  const filename = isReceipt
    ? `Payment_Receipt_Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf`
    : `Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf`;

  // 1. Generate the appropriate PDF Blob
  let pdfBlob: Blob | null = null;
  try {
    if (isReceipt) {
      const receiptData = await generateReceiptPdfBlob(invoice, payment);
      pdfBlob = receiptData.blob;
    } else {
      const invoiceData = await generateInvoicePdfBlob(invoice);
      pdfBlob = invoiceData.blob;
    }
  } catch (err) {
    console.error("Error generating PDF for WhatsApp sharing:", err);
  }

  // 2. Check if Web Share API with Files is supported (mobile browsers & supported desktops)
  if (pdfBlob && typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
    try {
      const file = new File([pdfBlob], filename, { type: "application/pdf" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: isReceipt
            ? `Payment Receipt - Invoice #${invoice.invoiceNumber}`
            : `Tax Invoice #${invoice.invoiceNumber} - Vasthusilpy`,
          text: messageText,
          files: [file],
        });

        return {
          success: true,
          sharedWithAttachment: true,
          downloaded: false,
          waUrl: "",
          message: "Official PDF document and details shared directly to WhatsApp attachment!",
        };
      }
    } catch (shareErr: any) {
      // If user aborted the share sheet, do not crash
      if (shareErr.name === "AbortError") {
        return {
          success: true,
          sharedWithAttachment: false,
          downloaded: false,
          waUrl: "",
          message: "Share dialog closed.",
        };
      }
      console.warn("Web Share API file share failed or canceled, falling back to download + WhatsApp link:", shareErr);
    }
  }

  // 3. Fallback: Automatically download the PDF to client device and open WhatsApp with direct link
  if (pdfBlob) {
    triggerDownloadPdf(pdfBlob, filename);
  }

  const encoded = encodeURIComponent(messageText);
  const waUrl = targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  
  if (typeof window !== "undefined") {
    window.open(waUrl, "_blank");
  }

  return {
    success: true,
    sharedWithAttachment: false,
    downloaded: !!pdfBlob,
    waUrl,
    message: "PDF downloaded to your device & WhatsApp opened with verified direct portal link!",
  };
};

export const sendInvoiceViaWhatsApp = (invoice: Invoice) => {
  sendInvoiceOrReceiptViaWhatsApp(invoice, { isReceipt: false });
};

export const formatInvoiceEmailSubject = (invoice: Invoice): string => {
  const requiredAmount = typeof invoice.balanceDue === "number" && invoice.balanceDue > 0
    ? invoice.balanceDue
    : (invoice.grandTotal || 0);
  return `Tax Invoice #${invoice.invoiceNumber} from Vasthusilpy Consultants - ${invoice.applicantName} (Due: ₹${Number(requiredAmount).toLocaleString("en-IN")})`;
};

export const formatPaymentReceiptEmailSubject = (invoice: Invoice, payment?: PaymentRecord): string => {
  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const amount = payment ? payment.amount : invoice.totalPaid;
  const statusStr = isPaid ? "Closed & Paid in Full" : "Partial Payment Received";
  return `Official Payment Receipt & Statement: Invoice #${invoice.invoiceNumber} - ₹${Number(amount).toLocaleString("en-IN")} (${statusStr}) - Vasthusilpy Consultants`;
};

export interface SendInvoiceEmailResult {
  success: boolean;
  message?: string;
  error?: string;
  senderEmail?: string;
  method?: "gmail_oauth" | "smtp_backend";
}

function encodeUtf8Base64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Automatically sends the invoice email from the user's Gmail account (deepak.vasthusilpy@gmail.com).
 */
export const sendInvoiceViaEmailAutomatically = async (
  invoice: Invoice,
  recipientEmailInput?: string,
  customNotes?: string
): Promise<SendInvoiceEmailResult> => {
  const recipientEmail = (recipientEmailInput || invoice.applicantEmail || "").trim();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("A valid recipient email address is required.");
  }

  // 1. Generate the official PDF Invoice Blob & Base64
  let pdfBase64 = "";
  try {
    const pdfData = await generateInvoicePdfBlob(invoice);
    pdfBase64 = pdfData.base64;
  } catch (pdfErr) {
    console.warn("Could not generate PDF attachment, will proceed with HTML email:", pdfErr);
  }

  // 2. Obtain Google Access Token with Gmail permissions
  try {
    const accessToken = await ensureGoogleAccessToken();
    if (accessToken) {
      return await sendInvoiceViaGmailApi(invoice, recipientEmail, accessToken, pdfBase64, customNotes);
    }
  } catch (authOrGmailErr: any) {
    console.warn("Direct Gmail API attempt had issue, attempting server backend or retry:", authOrGmailErr);

    // Fallback: Try server-side route
    try {
      const upiPayUri = generateUpiPaymentUri(invoice);
      const requiredAmount = typeof invoice.balanceDue === "number" && invoice.balanceDue > 0
        ? invoice.balanceDue
        : (invoice.grandTotal || 0);
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiPayUri)}`;

      const res = await fetch("/api/invoices/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice,
          recipientEmail,
          pdfBase64,
          customNotes,
          upiPayUri,
          qrImageUrl,
          requiredAmount,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: `Invoice #${invoice.invoiceNumber} successfully emailed to ${recipientEmail} from deepak.vasthusilpy@gmail.com with PDF attachment and Payment QR Code!`,
          senderEmail: data.senderEmail || "deepak.vasthusilpy@gmail.com",
          method: "smtp_backend",
        };
      }
    } catch (serverErr) {
      console.error("Backend send failed as well:", serverErr);
    }

    throw new Error(authOrGmailErr.message || "Failed to dispatch email automatically from Gmail.");
  }

  throw new Error("Unable to complete Gmail email dispatch.");
};

/**
 * Automatically sends the Official Payment Receipt & Closed Invoice Acknowledgement Email from deepak.vasthusilpy@gmail.com
 */
export const sendPaymentReceiptViaEmailAutomatically = async (
  invoice: Invoice,
  payment?: PaymentRecord,
  recipientEmailInput?: string,
  customNotes?: string
): Promise<SendInvoiceEmailResult> => {
  const recipientEmail = (recipientEmailInput || invoice.applicantEmail || "").trim();
  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("A valid recipient email address is required.");
  }

  // 1. Generate the official Payment Receipt & Closed Invoice PDF Blob & Base64
  let pdfBase64 = "";
  try {
    const pdfData = await generateReceiptPdfBlob(invoice, payment);
    pdfBase64 = pdfData.base64;
  } catch (pdfErr) {
    console.warn("Could not generate receipt PDF attachment:", pdfErr);
  }

  // 2. Send via Google Workspace Gmail API
  try {
    const accessToken = await ensureGoogleAccessToken();
    if (accessToken) {
      return await sendReceiptViaGmailApi(invoice, payment, recipientEmail, accessToken, pdfBase64, customNotes);
    }
  } catch (authOrGmailErr: any) {
    console.warn("Direct Gmail API receipt send failed, trying server fallback:", authOrGmailErr);

    try {
      const portalUrl = getInvoiceSharePortalUrl(invoice);
      const res = await fetch("/api/invoices/send-receipt-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice,
          payment,
          recipientEmail,
          pdfBase64,
          customNotes,
          portalUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: `Payment Receipt for Invoice #${invoice.invoiceNumber} successfully emailed to ${recipientEmail} from deepak.vasthusilpy@gmail.com with PDF attachment!`,
          senderEmail: data.senderEmail || "deepak.vasthusilpy@gmail.com",
          method: "smtp_backend",
        };
      }
    } catch (serverErr) {
      console.error("Backend receipt send failed:", serverErr);
    }

    throw new Error(authOrGmailErr.message || "Failed to dispatch payment receipt from Gmail.");
  }

  throw new Error("Unable to dispatch payment receipt email.");
};

/**
 * Direct Google Workspace Gmail API Sender for Invoice
 */
async function sendInvoiceViaGmailApi(
  invoice: Invoice,
  recipientEmail: string,
  accessToken: string,
  pdfBase64: string,
  customNotes?: string,
  isRetry = false
): Promise<SendInvoiceEmailResult> {
  const upiPayUri = generateUpiPaymentUri(invoice);
  const requiredAmount = typeof invoice.balanceDue === "number" && invoice.balanceDue > 0
    ? invoice.balanceDue
    : (invoice.grandTotal || 0);
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiPayUri)}`;
  const portalUrl = getInvoiceSharePortalUrl(invoice);

  const subject = formatInvoiceEmailSubject(invoice);
  const encodedSubject = `=?UTF-8?B?${encodeUtf8Base64(subject)}?=`;
  const boundary = `vasthusilpy_boundary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const isPartial = invoice.paymentStatus === "PARTIALLY PAID" || ((invoice.totalPaid || 0) > 0 && (invoice.balanceDue || 0) > 0);
  const statusLabel = isPaid ? "FULLY PAID & CLOSED" : isPartial ? "PARTIALLY PAID" : "PAYMENT DUE";
  const statusBg = isPaid ? "#d1fae5" : isPartial ? "#fef3c7" : "#fee2e2";
  const statusColor = isPaid ? "#065f46" : isPartial ? "#92400e" : "#991b1b";

  // Build items rows
  const itemsHtml = (invoice.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 10px; color: #64748b; font-size: 12px; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; color: #1e293b; font-size: 13px; font-weight: 500;">
        ${item.description || `Item #${idx + 1}`}
      </td>
      <td style="padding: 10px; color: #475569; font-size: 12px; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px; color: #475569; font-size: 12px; text-align: center;">${item.unit || "unit"}</td>
      <td style="padding: 10px; color: #475569; font-size: 12px; text-align: right; font-family: monospace;">₹${Number(item.rate || 0).toLocaleString("en-IN")}</td>
      <td style="padding: 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">₹${Number(item.amount || 0).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #10b981;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">VASTHUSILPY ARCHITECTURAL CONSULTANTS</h1>
          <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 9747995961, 7012383137</p>
        </div>

        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <h2 style="color: #0f172a; margin: 0; font-size: 18px;">Tax Invoice #${invoice.invoiceNumber}</h2>
              <p style="color: #64748b; font-size: 12px; margin: 2px 0 0 0;">Date: ${invoice.invoiceDate} | Due: <strong style="color: #dc2626;">${invoice.dueDate}</strong></p>
            </div>
            <div style="text-align: right;">
              <span style="background: ${statusBg}; color: ${statusColor}; padding: 6px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px;">${statusLabel}: ₹${Number(requiredAmount).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <p style="font-size: 14px; margin: 0 0 12px 0;">Dear <strong>${invoice.applicantName}</strong>,</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
            Please find your attached official Tax Invoice <strong>#${invoice.invoiceNumber}</strong>. You can view it online, pay conveniently using UPI (Google Pay / PhonePe / Paytm), or make a direct bank transfer.
          </p>

          <div style="text-align: center; margin: 16px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 8px; font-size: 13px;">
              🌐 View & Download Invoice Online
            </a>
          </div>

          ${customNotes ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 16px; border-radius: 4px;"><strong>Note:</strong> ${customNotes}</div>` : ""}

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase;">
                <th style="padding: 8px 10px; text-align: center; width: 30px;">#</th>
                <th style="padding: 8px 10px; text-align: left;">Description</th>
                <th style="padding: 8px 10px; text-align: center; width: 45px;">Qty</th>
                <th style="padding: 8px 10px; text-align: center; width: 50px;">Unit</th>
                <th style="padding: 8px 10px; text-align: right; width: 70px;">Rate</th>
                <th style="padding: 8px 10px; text-align: right; width: 85px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #cbd5e1; background-color: #f8fafc; font-weight: 700;">
                <td colspan="5" style="padding: 10px; text-align: right; color: #0f172a; font-size: 13px;">Total Amount:</td>
                <td style="padding: 10px; text-align: right; color: #0f172a; font-size: 14px; font-family: monospace;">₹${Number(invoice.grandTotal || 0).toLocaleString("en-IN")}</td>
              </tr>
              ${(invoice.totalPaid || 0) > 0 ? `
                <tr style="background-color: #f8fafc; font-size: 12px; color: #059669;">
                  <td colspan="5" style="padding: 6px 10px; text-align: right;">Total Paid:</td>
                  <td style="padding: 6px 10px; text-align: right; font-family: monospace;">- ₹${Number(invoice.totalPaid || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr style="background-color: #fef2f2; font-weight: 800; font-size: 13px; color: #dc2626;">
                  <td colspan="5" style="padding: 8px 10px; text-align: right;">Balance Due:</td>
                  <td style="padding: 8px 10px; text-align: right; font-family: monospace;">₹${Number(invoice.balanceDue || 0).toLocaleString("en-IN")}</td>
                </tr>
              ` : ''}
            </tfoot>
          </table>

          <!-- Payment QR Section -->
          ${!isPaid ? `
          <div style="background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <h3 style="color: #0f172a; margin: 0 0 8px 0; font-size: 15px;">📲 Scan QR to Pay (₹${Number(requiredAmount).toLocaleString("en-IN")})</h3>
            <p style="color: #64748b; font-size: 11px; margin: 0 0 12px 0;">Google Pay • PhonePe • Paytm • BHIM UPI</p>
            <img src="${qrImageUrl}" alt="Payment QR Code" width="200" height="200" style="display: block; margin: 0 auto 14px auto; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; padding: 6px;" />
            
            <div>
              <a href="${upiPayUri}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(16,185,129,0.3);">
                💳 Click Here to Pay with UPI (GPay/PhonePe/Paytm)
              </a>
            </div>
            <p style="font-size: 11px; color: #64748b; margin: 10px 0 0 0;">QR Payment UPI ID: <strong style="color: #0f172a; font-family: monospace;">7012383137@okbizaxis</strong></p>
          </div>

          <!-- Bank Details -->
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 12px; margin-bottom: 20px; font-family: monospace;">
            <strong style="color: #0f172a; font-family: sans-serif; font-size: 13px;">Official Bank & UPI Details:</strong>
            <p style="margin: 6px 0 2px 0; color: #334155;">NAME : <strong>DEEPAK C</strong></p>
            <p style="margin: 2px 0; color: #334155;">ACCOUNT NO : <strong>1062 5047 526</strong></p>
            <p style="margin: 2px 0; color: #334155;">IFSC CODE : <strong>SBIN0007624</strong></p>
            <p style="margin: 2px 0; color: #334155;">BANK : <strong>SBI , KERALASSERY</strong></p>
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; color: #334155;">
              <div>UPI PAYMENT :</div>
              <strong style="color: #0284c7;">9567627277@naviaxis</strong><br/>
              <strong style="color: #0284c7;">7012383137@naviaxis</strong>
            </div>
          </div>
          ` : `
          <div style="background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
            <h3 style="color: #166534; margin: 0 0 6px 0; font-size: 16px;">✅ INVOICE FULLY PAID & CLOSED</h3>
            <p style="color: #15803d; font-size: 13px; margin: 0;">Thank you! All accounts and dues against this invoice have been fully settled.</p>
          </div>
          `}

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
            📎 The complete tax invoice PDF document is attached to this email. For any queries, please contact us at +91 9747995961 or +91 7012383137.
          </p>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
          Vasthusilpy Architectural & Engineering Consultants • Keralassery, Palakkad, Kerala
        </div>
      </div>
    </body>
    </html>
  `;

  // Encode HTML body as base64
  const base64Html = encodeUtf8Base64(htmlBody);

  // Construct MIME Message
  let mimeMessage = `From: "Vasthusilpy Consultants" <deepak.vasthusilpy@gmail.com>\r\n`;
  mimeMessage += `To: ${recipientEmail}\r\n`;
  mimeMessage += `Subject: ${encodedSubject}\r\n`;
  mimeMessage += `MIME-Version: 1.0\r\n`;
  mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  // HTML Body Part
  mimeMessage += `--${boundary}\r\n`;
  mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
  mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
  mimeMessage += `${base64Html}\r\n\r\n`;

  // PDF Attachment Part
  if (pdfBase64) {
    const cleanPdf = pdfBase64.replace(/\s+/g, "");
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: application/pdf; name="Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf"\r\n`;
    mimeMessage += `Content-Disposition: attachment; filename="Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf"\r\n`;
    mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeMessage += `${cleanPdf}\r\n\r\n`;
  }

  mimeMessage += `--${boundary}--`;

  // Safe Base64URL encode
  const rawBase64Url = btoa(mimeMessage)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && !isRetry) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vasthusilpy_google_token");
      }
      const freshToken = await ensureGoogleAccessToken();
      return sendInvoiceViaGmailApi(invoice, recipientEmail, freshToken, pdfBase64, customNotes, true);
    }
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to send email via Gmail API");
  }

  return {
    success: true,
    message: `Invoice #${invoice.invoiceNumber} successfully dispatched to ${recipientEmail} from deepak.vasthusilpy@gmail.com with PDF invoice attachment and Payment QR Code!`,
    senderEmail: "deepak.vasthusilpy@gmail.com",
    method: "gmail_oauth",
  };
}

/**
 * Direct Google Workspace Gmail API Sender for Payment Receipt & Closed Invoice
 */
async function sendReceiptViaGmailApi(
  invoice: Invoice,
  payment: PaymentRecord | undefined,
  recipientEmail: string,
  accessToken: string,
  pdfBase64: string,
  customNotes?: string,
  isRetry = false
): Promise<SendInvoiceEmailResult> {
  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const paymentAmount = payment ? payment.amount : invoice.totalPaid;
  const receiptNo = `REC-${invoice.invoiceNumber}-${payment?.id ? payment.id.slice(-4) : "TX"}`;
  const receiptDate = payment?.date || new Date().toISOString().split("T")[0];
  const portalUrl = getInvoiceSharePortalUrl(invoice);

  const subject = formatPaymentReceiptEmailSubject(invoice, payment);
  const encodedSubject = `=?UTF-8?B?${encodeUtf8Base64(subject)}?=`;
  const boundary = `vasthusilpy_receipt_boundary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; margin: 0;">
      <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 3px solid #10b981;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">VASTHUSILPY ARCHITECTURAL CONSULTANTS</h1>
          <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0;">Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 9747995961, 7012383137</p>
        </div>

        <div style="padding: 24px;">
          <!-- Green Header Banner -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 20px;">
            <span style="background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; letter-spacing: 0.5px;">
              ${isPaid ? "INVOICE CLOSED • FULLY PAID" : "OFFICIAL PAYMENT RECEIPT"}
            </span>
            <h2 style="color: #14532d; margin: 10px 0 4px 0; font-size: 22px; font-weight: 800;">
              ₹${Number(paymentAmount).toLocaleString("en-IN")} Received
            </h2>
            <p style="color: #166534; font-size: 12px; margin: 0;">
              Receipt #${receiptNo} • Date: ${receiptDate}
            </p>
          </div>

          <p style="font-size: 14px; margin: 0 0 12px 0;">Dear <strong>${invoice.applicantName}</strong>,</p>
          <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
            We gratefully acknowledge receipt of payment towards Tax Invoice <strong>#${invoice.invoiceNumber}</strong>. Please find your official payment receipt and account statement below.
          </p>

          ${customNotes ? `<div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 10px 14px; font-size: 12px; color: #92400e; margin-bottom: 16px; border-radius: 4px;"><strong>Note:</strong> ${customNotes}</div>` : ""}

          <!-- Payment Details Box -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 13px;">
            <h3 style="color: #0f172a; margin: 0 0 12px 0; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Transaction Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #64748b; width: 45%;">Amount Paid:</td>
                <td style="padding: 4px 0; color: #059669; font-weight: 700; font-family: monospace;">₹${Number(paymentAmount).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Payment Date:</td>
                <td style="padding: 4px 0; color: #1e293b; font-weight: 500;">${receiptDate}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Payment Mode:</td>
                <td style="padding: 4px 0; color: #1e293b; font-weight: 500;">${payment?.paymentMode || "Bank payment / UPI"}</td>
              </tr>
              ${payment?.referenceNo ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Ref / UTR Number:</td>
                <td style="padding: 4px 0; color: #1e293b; font-family: monospace;">${payment.referenceNo}</td>
              </tr>
              ` : ''}
              ${payment?.account ? `
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Credited Account:</td>
                <td style="padding: 4px 0; color: #1e293b;">${payment.account}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Account Statement / Reconciliation Table -->
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 20px; font-size: 13px;">
            <h3 style="color: #0f172a; margin: 0 0 10px 0; font-size: 14px;">Invoice Summary & Status</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; color: #64748b;">Invoice Total:</td>
                <td style="padding: 6px 0; text-align: right; color: #0f172a; font-weight: 600; font-family: monospace;">₹${Number(invoice.grandTotal).toLocaleString("en-IN")}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px 0; color: #64748b;">Total Paid to Date:</td>
                <td style="padding: 6px 0; text-align: right; color: #059669; font-weight: 700; font-family: monospace;">₹${Number(invoice.totalPaid).toLocaleString("en-IN")}</td>
              </tr>
              <tr style="font-weight: 800; ${isPaid ? 'color: #059669;' : 'color: #dc2626;'}">
                <td style="padding: 8px 0;">Balance Due:</td>
                <td style="padding: 8px 0; text-align: right; font-family: monospace;">
                  ${isPaid ? "₹0.00 (FULLY CLOSED)" : `₹${Number(invoice.balanceDue).toLocaleString("en-IN")}`}
                </td>
              </tr>
            </table>
          </div>

          <!-- Direct Portal Link Button -->
          <div style="text-align: center; margin: 20px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(16,185,129,0.3);">
              📄 View & Download Receipt & Closed Invoice
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
            📎 The official Payment Receipt & Closed Invoice PDF document has been attached to this email. For any assistance, please reach us at +91 9747995961 or +91 7012383137.
          </p>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px 24px; font-size: 11px; color: #94a3b8; text-align: center;">
          Vasthusilpy Architectural & Engineering Consultants • Keralassery, Palakkad, Kerala
        </div>
      </div>
    </body>
    </html>
  `;

  const base64Html = encodeUtf8Base64(htmlBody);

  let mimeMessage = `From: "Vasthusilpy Consultants" <deepak.vasthusilpy@gmail.com>\r\n`;
  mimeMessage += `To: ${recipientEmail}\r\n`;
  mimeMessage += `Subject: ${encodedSubject}\r\n`;
  mimeMessage += `MIME-Version: 1.0\r\n`;
  mimeMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  mimeMessage += `--${boundary}\r\n`;
  mimeMessage += `Content-Type: text/html; charset=UTF-8\r\n`;
  mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
  mimeMessage += `${base64Html}\r\n\r\n`;

  if (pdfBase64) {
    const cleanPdf = pdfBase64.replace(/\s+/g, "");
    mimeMessage += `--${boundary}\r\n`;
    mimeMessage += `Content-Type: application/pdf; name="Payment_Receipt_Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf"\r\n`;
    mimeMessage += `Content-Disposition: attachment; filename="Payment_Receipt_Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf"\r\n`;
    mimeMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    mimeMessage += `${cleanPdf}\r\n\r\n`;
  }

  mimeMessage += `--${boundary}--`;

  const rawBase64Url = btoa(mimeMessage)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: rawBase64Url }),
  });

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && !isRetry) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("vasthusilpy_google_token");
      }
      const freshToken = await ensureGoogleAccessToken();
      return sendReceiptViaGmailApi(invoice, payment, recipientEmail, freshToken, pdfBase64, customNotes, true);
    }
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Failed to send receipt email via Gmail API");
  }

  return {
    success: true,
    message: `Payment Receipt for Invoice #${invoice.invoiceNumber} dispatched to ${recipientEmail} from deepak.vasthusilpy@gmail.com with PDF receipt attachment!`,
    senderEmail: "deepak.vasthusilpy@gmail.com",
    method: "gmail_oauth",
  };
}

/**
 * Standard client fallback for mailto
 */
export const sendInvoiceViaEmail = (invoice: Invoice, recipientEmail?: string) => {
  const email = recipientEmail || invoice.applicantEmail || "";
  const subject = encodeURIComponent(formatInvoiceEmailSubject(invoice));
  const body = encodeURIComponent(formatInvoiceWhatsAppMessage(invoice));
  const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
  window.open(mailtoUrl, "_blank");
};
