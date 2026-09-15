import { Invoice, PaymentRecord } from "../types";
import { generateReceiptPdfBlob } from "./invoicePdfGenerator";
import { uploadReceiptPdfToStorage } from "../lib/firebase";
import { uploadReceiptPdfToGoogleDrive, uploadInvoicePdfToGoogleDrive } from "./googleDriveStorage";
import {
  sendPaymentReceiptViaEmailAutomatically,
  sendInvoiceOrReceiptViaWhatsApp,
  getInvoiceSharePortalUrl,
  SendInvoiceEmailResult,
  ShareWhatsAppResult
} from "./invoiceShareHelper";
import { triggerAppNotification } from "../context/NotificationContext";

export interface PostPaymentPipelineOptions {
  autoUploadToFirebaseStorage?: boolean;
  autoUploadToGoogleDrive?: boolean;
  autoSendEmail?: boolean;
  autoSendWhatsApp?: boolean;
  recipientEmail?: string;
  customNotes?: string;
  onProgress?: (step: string, message: string) => void;
}

export interface PostPaymentPipelineResult {
  success: boolean;
  receiptNumber: string;
  pdfBlob?: Blob;
  pdfBase64?: string;
  storageResult?: {
    success: boolean;
    downloadUrl?: string;
    storagePath?: string;
    error?: string;
  };
  googleDriveResult?: {
    success: boolean;
    fileId?: string;
    webViewLink?: string;
    folderViewLink?: string;
    error?: string;
  };
  emailResult?: {
    attempted: boolean;
    success: boolean;
    senderEmail?: string;
    message?: string;
    error?: string;
  };
  whatsAppResult?: {
    attempted: boolean;
    success: boolean;
    waUrl?: string;
    message?: string;
    sharedWithAttachment?: boolean;
    error?: string;
  };
  updatedPaymentRecord: PaymentRecord;
  updatedInvoice: Invoice;
}

/**
 * Automated Post-Payment Hook Pipeline:
 * 1. Formats official Receipt Number & metadata
 * 2. Generates high-fidelity formatted PDF Receipt & Statement
 * 3. Saves and archives PDF in Firebase Cloud Storage (under `receipts/{invoiceNo}/{receiptNo}.pdf`)
 * 4. Triggers automated Email pipeline from deepak.vasthusilpy@gmail.com with attached PDF & portal link
 * 5. Prepares WhatsApp communication pipeline with formatted receipt statement & portal link
 * 6. Updates PaymentRecord & Invoice with cloud storage link and communication status
 */
export async function executePostPaymentPipeline(
  invoice: Invoice,
  paymentRecord: PaymentRecord,
  options?: PostPaymentPipelineOptions
): Promise<PostPaymentPipelineResult> {
  const {
    autoUploadToFirebaseStorage = true,
    autoUploadToGoogleDrive = true,
    autoSendEmail = true,
    autoSendWhatsApp = false,
    recipientEmail = invoice.applicantEmail || "",
    customNotes = "",
    onProgress
  } = options || {};

  const cleanReceiptSuffix = paymentRecord.id ? paymentRecord.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4) : "001";
  const receiptNumber = paymentRecord.receiptNumber || `REC-${invoice.invoiceNumber}-${cleanReceiptSuffix}`;
  const nowIso = new Date().toISOString();

  onProgress?.("generating_pdf", "Generating official high-resolution PDF payment receipt...");

  // 1. Generate formatted PDF Receipt Blob & Base64
  let pdfBlob: Blob | undefined;
  let pdfBase64: string | undefined;
  try {
    const pdfData = await generateReceiptPdfBlob(invoice, paymentRecord);
    pdfBlob = pdfData.blob;
    pdfBase64 = pdfData.base64;
  } catch (err: any) {
    console.error("[Post-Payment Hook] Error generating receipt PDF:", err);
  }

  // 2. Upload to Firebase Cloud Storage
  let storageResult: PostPaymentPipelineResult["storageResult"] = {
    success: false,
    error: "Storage upload skipped"
  };

  let receiptPdfUrl: string | undefined = paymentRecord.receiptPdfUrl;
  let receiptStoragePath: string | undefined = paymentRecord.receiptStoragePath;

  if (autoUploadToFirebaseStorage && pdfBlob) {
    onProgress?.("uploading_storage", "Archiving PDF receipt in Firebase Cloud Storage...");
    try {
      const uploadRes = await uploadReceiptPdfToStorage(
        pdfBlob,
        invoice.invoiceNumber,
        receiptNumber,
        {
          clientName: invoice.applicantName || "Client",
          amount: String(paymentRecord.amount),
          invoiceId: invoice.id
        }
      );

      storageResult = uploadRes;
      if (uploadRes.success && uploadRes.downloadUrl) {
        receiptPdfUrl = uploadRes.downloadUrl;
        receiptStoragePath = uploadRes.storagePath;
      }
    } catch (storageErr: any) {
      console.warn("[Post-Payment Hook] Firebase Storage upload warning:", storageErr);
      storageResult = {
        success: false,
        storagePath: `receipts/${invoice.invoiceNumber}/${receiptNumber}.pdf`,
        error: storageErr?.message || "Storage upload failed"
      };
    }
  }

  // 2.2 Automatically Upload to Google Drive Cloud Storage
  let googleDriveResult: PostPaymentPipelineResult["googleDriveResult"] = {
    success: false,
    error: "Google Drive upload skipped"
  };
  let receiptGoogleDriveUrl: string | undefined = paymentRecord.googleDriveUrl;
  let receiptGoogleDriveFileId: string | undefined = paymentRecord.googleDriveFileId;

  if (autoUploadToGoogleDrive !== false) {
    onProgress?.("uploading_gdrive", "Archiving PDF receipt in Google Drive Cloud Storage...");
    try {
      const gdriveRes = await uploadReceiptPdfToGoogleDrive(invoice, { ...paymentRecord, receiptNumber });
      googleDriveResult = gdriveRes;
      if (gdriveRes.success && gdriveRes.webViewLink) {
        receiptGoogleDriveUrl = gdriveRes.webViewLink;
        receiptGoogleDriveFileId = gdriveRes.fileId;
      }
    } catch (gdriveErr: any) {
      console.warn("[Post-Payment Hook] Google Drive receipt upload warning:", gdriveErr);
      googleDriveResult = {
        success: false,
        error: gdriveErr?.message || "Google Drive upload failed"
      };
    }
  }

  // Update working payment record with generated info
  let updatedPayment: PaymentRecord = {
    ...paymentRecord,
    receiptNumber,
    receiptGeneratedAt: nowIso,
    receiptPdfUrl: receiptPdfUrl || paymentRecord.receiptPdfUrl,
    receiptStoragePath: receiptStoragePath || paymentRecord.receiptStoragePath,
    googleDriveUrl: receiptGoogleDriveUrl || paymentRecord.googleDriveUrl,
    googleDriveFileId: receiptGoogleDriveFileId || paymentRecord.googleDriveFileId,
    googleDriveSyncedAt: receiptGoogleDriveUrl ? nowIso : paymentRecord.googleDriveSyncedAt,
    autoDispatched: {
      ...(paymentRecord.autoDispatched || {}),
      firebaseStorageSaved: storageResult.success,
      googleDriveSaved: googleDriveResult?.success || false,
      timestamp: nowIso
    }
  };

  // 3. Automated Email Dispatch Pipeline (via Gmail API / Backend SMTP)
  let emailResult: PostPaymentPipelineResult["emailResult"] = {
    attempted: false,
    success: false
  };

  const targetEmail = (recipientEmail || invoice.applicantEmail || "").trim();
  const shouldSendEmail = autoSendEmail && targetEmail && targetEmail.includes("@");

  if (shouldSendEmail) {
    onProgress?.("sending_email", `Dispatching official payment receipt email to ${targetEmail}...`);
    emailResult.attempted = true;
    try {
      const sendRes: SendInvoiceEmailResult = await sendPaymentReceiptViaEmailAutomatically(
        invoice,
        updatedPayment,
        targetEmail,
        customNotes
      );

      emailResult.success = sendRes.success;
      emailResult.senderEmail = sendRes.senderEmail || "deepak.vasthusilpy@gmail.com";
      emailResult.message = sendRes.message;

      updatedPayment = {
        ...updatedPayment,
        autoDispatched: {
          ...updatedPayment.autoDispatched,
          email: sendRes.success,
          emailSentTo: targetEmail,
          emailSentAt: nowIso,
          timestamp: nowIso
        }
      };
    } catch (emailErr: any) {
      console.warn("[Post-Payment Hook] Automatic receipt email dispatch error:", emailErr);
      emailResult.success = false;
      emailResult.error = emailErr?.message || "Email dispatch failed";
    }
  }

  // 4. WhatsApp Communication Pipeline
  let whatsAppResult: PostPaymentPipelineResult["whatsAppResult"] = {
    attempted: false,
    success: false
  };

  if (autoSendWhatsApp && invoice.applicantMobile) {
    onProgress?.("sending_whatsapp", "Preparing WhatsApp communication pipeline...");
    whatsAppResult.attempted = true;
    try {
      const waRes: ShareWhatsAppResult = await sendInvoiceOrReceiptViaWhatsApp(invoice, {
        isReceipt: true,
        payment: updatedPayment,
        customNotes
      });

      whatsAppResult.success = waRes.success;
      whatsAppResult.waUrl = waRes.waUrl;
      whatsAppResult.message = waRes.message;
      whatsAppResult.sharedWithAttachment = waRes.sharedWithAttachment;

      updatedPayment = {
        ...updatedPayment,
        autoDispatched: {
          ...updatedPayment.autoDispatched,
          whatsApp: true,
          whatsAppSentTo: invoice.applicantMobile,
          whatsAppSentAt: nowIso,
          timestamp: nowIso
        }
      };
    } catch (waErr: any) {
      console.warn("[Post-Payment Hook] WhatsApp trigger warning:", waErr);
      whatsAppResult.error = waErr?.message;
    }
  }

  // 5. Update Invoice Payments Array
  const updatedPayments = (invoice.payments || []).map((p) =>
    p.id === updatedPayment.id ? updatedPayment : p
  );

  // If new payment is not in array yet, add it
  if (!updatedPayments.some((p) => p.id === updatedPayment.id)) {
    updatedPayments.push(updatedPayment);
  }

  const updatedTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
  const updatedBalanceDue = Math.max(0, invoice.grandTotal - updatedTotalPaid);
  let paymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID" = "UNPAID";
  if (updatedTotalPaid >= invoice.grandTotal && invoice.grandTotal > 0) {
    paymentStatus = "PAID";
  } else if (updatedTotalPaid > 0) {
    paymentStatus = "PARTIALLY PAID";
  }

  const updatedInvoice: Invoice = {
    ...invoice,
    payments: updatedPayments,
    totalPaid: updatedTotalPaid,
    balanceDue: updatedBalanceDue,
    paymentStatus
  };

  // 6. In-App Notification Trigger
  triggerAppNotification(
    "INVOICE_GENERATED",
    "Receipt & Pipeline Processed",
    `Payment Receipt #${receiptNumber} generated for ₹${paymentRecord.amount.toLocaleString("en-IN")}.${storageResult.success ? " Saved to Firebase Storage." : ""}${emailResult.success ? ` Emailed to ${targetEmail}.` : ""}`,
    { invoiceId: invoice.id }
  );

  onProgress?.("complete", "Post-payment pipeline execution complete.");

  return {
    success: true,
    receiptNumber,
    pdfBlob,
    pdfBase64,
    storageResult,
    googleDriveResult,
    emailResult,
    whatsAppResult,
    updatedPaymentRecord: updatedPayment,
    updatedInvoice
  };
}
