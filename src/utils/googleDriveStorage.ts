import { Invoice, PaymentRecord } from "../types";
import { generateInvoicePdfBlob, generateReceiptPdfBlob } from "./invoicePdfGenerator";
import { getCachedToken, ensureGoogleAccessToken } from "../lib/googleWorkspace";

export interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webViewLink?: string;
  webContentLink?: string;
  folderId?: string;
  folderViewLink?: string;
  error?: string;
}

/**
 * Converts a Blob to a base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Uploads an Invoice PDF to the user's Google Drive under "Vasthusilpy Invoices & Receipts"
 */
export async function uploadInvoicePdfToGoogleDrive(
  invoice: Invoice,
  providedToken?: string
): Promise<GoogleDriveUploadResult> {
  try {
    const token = providedToken || getCachedToken();
    if (!token) {
      return {
        success: false,
        error: "Google Workspace authorization is required. Sign in with Google to sync to Drive."
      };
    }

    // 1. Generate Invoice PDF Blob
    const { blob } = await generateInvoicePdfBlob(invoice);
    const fileBase64 = await blobToBase64(blob);

    const invoiceTitle = `Invoice_${invoice.invoiceNumber}_${(invoice.applicantName || "Client").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    // 2. Call backend Google Drive upload endpoint
    const res = await fetch("/api/google/upload-drive-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: invoiceTitle,
        fileBase64,
        mimeType: "application/pdf",
        folderName: "Vasthusilpy Invoices & Receipts",
        description: `Official Tax / Fee Invoice ${invoice.invoiceNumber} for ${invoice.applicantName || "Client"} - Total ₹${invoice.grandTotal}`,
        accessToken: token
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      return {
        success: false,
        error: errData.error || "Failed to upload invoice to Google Drive."
      };
    }

    const data = await res.json();
    return {
      success: true,
      fileId: data.fileId,
      fileName: data.fileName,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      folderId: data.folderId,
      folderViewLink: data.folderViewLink
    };
  } catch (error: any) {
    console.warn("Google Drive Invoice Upload Notice:", error);
    return {
      success: false,
      error: error.message || "Network error while saving invoice to Google Drive."
    };
  }
}

/**
 * Uploads a Payment Receipt PDF to the user's Google Drive under "Vasthusilpy Invoices & Receipts"
 */
export async function uploadReceiptPdfToGoogleDrive(
  invoice: Invoice,
  payment: PaymentRecord,
  providedToken?: string
): Promise<GoogleDriveUploadResult> {
  try {
    const token = providedToken || getCachedToken();
    if (!token) {
      return {
        success: false,
        error: "Google Workspace authorization is required. Sign in with Google to sync to Drive."
      };
    }

    const receiptNo = payment.receiptNumber || `REC-${invoice.invoiceNumber}-${payment.id ? payment.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4) : "001"}`;

    // 1. Generate Receipt PDF Blob
    const { blob } = await generateReceiptPdfBlob(invoice, payment);
    const fileBase64 = await blobToBase64(blob);

    const receiptTitle = `Receipt_${receiptNo}_${invoice.invoiceNumber}_${(invoice.applicantName || "Client").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    // 2. Call backend Google Drive upload endpoint
    const res = await fetch("/api/google/upload-drive-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: receiptTitle,
        fileBase64,
        mimeType: "application/pdf",
        folderName: "Vasthusilpy Invoices & Receipts",
        description: `Official Payment Receipt ${receiptNo} for Invoice ${invoice.invoiceNumber} - Amount Paid ₹${payment.amount}`,
        accessToken: token
      })
    });

    if (!res.ok) {
      const errData = await res.json();
      return {
        success: false,
        error: errData.error || "Failed to upload receipt to Google Drive."
      };
    }

    const data = await res.json();
    return {
      success: true,
      fileId: data.fileId,
      fileName: data.fileName,
      webViewLink: data.webViewLink,
      webContentLink: data.webContentLink,
      folderId: data.folderId,
      folderViewLink: data.folderViewLink
    };
  } catch (error: any) {
    console.warn("Google Drive Receipt Upload Notice:", error);
    return {
      success: false,
      error: error.message || "Network error while saving receipt to Google Drive."
    };
  }
}
