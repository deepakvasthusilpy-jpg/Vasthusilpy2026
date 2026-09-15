import React, { useState, useEffect } from "react";
import { Invoice, PaymentRecord } from "../../../types";
import {
  sendInvoiceOrReceiptViaWhatsApp,
  sendPaymentReceiptViaEmailAutomatically,
  getInvoiceSharePortalUrl,
  formatPaymentReceiptWhatsAppMessage,
  formatPaymentReceiptEmailSubject,
  triggerDownloadPdf,
} from "../../../utils/invoiceShareHelper";
import { generateReceiptPdfBlob, generateInvoicePdfBlob } from "../../../utils/invoicePdfGenerator";
import { executePostPaymentPipeline } from "../../../utils/postPaymentHook";
import { uploadReceiptPdfToStorage } from "../../../lib/firebase";
import { uploadReceiptPdfToGoogleDrive } from "../../../utils/googleDriveStorage";
import {
  CheckCircle2,
  X,
  MessageCircle,
  Mail,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  Receipt,
  FileText,
  Loader2,
  Send,
  Cloud,
  HardDrive
} from "lucide-react";

interface PaymentReceiptDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  paymentRecord?: PaymentRecord;
  onViewInvoice?: (invoice: Invoice) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
}

export const PaymentReceiptDispatchModal: React.FC<PaymentReceiptDispatchModalProps> = ({
  isOpen,
  onClose,
  invoice,
  paymentRecord,
  onViewInvoice,
  onUpdateInvoice,
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>(invoice.applicantEmail || "");
  const [customNotes, setCustomNotes] = useState<string>("");
  
  // Status states
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sharingWhatsApp, setSharingWhatsApp] = useState<boolean>(false);
  const [waStatus, setWaStatus] = useState<{ type: "success" | "info"; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  
  // Cloud Storage Status (Firebase + Google Drive)
  const [isUploadingToStorage, setIsUploadingToStorage] = useState<boolean>(false);
  const [storageUrl, setStorageUrl] = useState<string | undefined>(paymentRecord?.receiptPdfUrl);
  const [storagePath, setStoragePath] = useState<string | undefined>(paymentRecord?.receiptStoragePath);

  const [isUploadingToDrive, setIsUploadingToDrive] = useState<boolean>(false);
  const [driveUrl, setDriveUrl] = useState<string | undefined>(paymentRecord?.googleDriveUrl);
  const [driveFileId, setDriveFileId] = useState<string | undefined>(paymentRecord?.googleDriveFileId);

  const receiptNo = paymentRecord?.receiptNumber || `REC-${invoice.invoiceNumber}-${paymentRecord?.id ? paymentRecord.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4) : "001"}`;
  const receiptDate = paymentRecord?.date || new Date().toISOString().split("T")[0];
  const portalUrl = getInvoiceSharePortalUrl(invoice);
  const isClosed = (invoice.balanceDue || 0) <= 0 || invoice.paymentStatus === "PAID";
  const paymentAmount = paymentRecord ? paymentRecord.amount : invoice.totalPaid;

  // Auto-trigger Firebase & Google Drive Cloud Storage archival on modal open
  useEffect(() => {
    let isMounted = true;
    if (isOpen && invoice && paymentRecord) {
      // 1. Firebase Storage Archival
      if (!storageUrl && !isUploadingToStorage) {
        setIsUploadingToStorage(true);
        (async () => {
          try {
            const { blob } = await generateReceiptPdfBlob(invoice, paymentRecord);
            const uploadRes = await uploadReceiptPdfToStorage(
              blob,
              invoice.invoiceNumber,
              receiptNo,
              { clientName: invoice.applicantName || "Client", amount: String(paymentRecord.amount) }
            );

            if (!isMounted) return;

            if (uploadRes.success && uploadRes.downloadUrl) {
              setStorageUrl(uploadRes.downloadUrl);
              setStoragePath(uploadRes.storagePath);

              if (onUpdateInvoice) {
                const updatedPayments = (invoice.payments || []).map((p) =>
                  p.id === paymentRecord.id
                    ? { ...p, receiptPdfUrl: uploadRes.downloadUrl, receiptStoragePath: uploadRes.storagePath, receiptNumber: receiptNo }
                    : p
                );
                onUpdateInvoice({ ...invoice, payments: updatedPayments });
              }
            }
          } catch (err: any) {
            console.warn("Auto Firebase storage upload notice:", err);
          } finally {
            if (isMounted) setIsUploadingToStorage(false);
          }
        })();
      }

      // 2. Google Drive Cloud Storage Archival
      if (!driveUrl && !isUploadingToDrive) {
        setIsUploadingToDrive(true);
        (async () => {
          try {
            const driveRes = await uploadReceiptPdfToGoogleDrive(invoice, { ...paymentRecord, receiptNumber: receiptNo });
            if (!isMounted) return;

            if (driveRes.success && driveRes.webViewLink) {
              setDriveUrl(driveRes.webViewLink);
              setDriveFileId(driveRes.fileId);

              if (onUpdateInvoice) {
                const updatedPayments = (invoice.payments || []).map((p) =>
                  p.id === paymentRecord.id
                    ? {
                        ...p,
                        googleDriveUrl: driveRes.webViewLink,
                        googleDriveFileId: driveRes.fileId,
                        googleDriveSyncedAt: new Date().toISOString()
                      }
                    : p
                );
                onUpdateInvoice({ ...invoice, payments: updatedPayments });
              }
            }
          } catch (dErr: any) {
            console.warn("Auto Google Drive upload notice:", dErr);
          } finally {
            if (isMounted) setIsUploadingToDrive(false);
          }
        })();
      }
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, invoice?.id, paymentRecord?.id]);

  if (!isOpen) return null;

  // 1. WhatsApp Handler
  const handleSendWhatsApp = async () => {
    setSharingWhatsApp(true);
    setWaStatus(null);
    try {
      const result = await sendInvoiceOrReceiptViaWhatsApp(invoice, {
        isReceipt: true,
        payment: { ...paymentRecord, receiptNumber: receiptNo, receiptPdfUrl: storageUrl } as any,
        customNotes: customNotes.trim() || undefined,
      });

      if (result.sharedWithAttachment) {
        setWaStatus({
          type: "success",
          message: "Official PDF receipt & link shared directly to WhatsApp!",
        });
      } else {
        setWaStatus({
          type: "info",
          message: "PDF downloaded to your device & WhatsApp opened with verified direct portal link!",
        });
      }
    } catch (err: any) {
      setWaStatus({
        type: "info",
        message: "WhatsApp window opened. You can also copy the link or download the PDF below.",
      });
    } finally {
      setSharingWhatsApp(false);
    }
  };

  // 2. Email Handler (Gmail API / Backend)
  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setEmailStatus({
        type: "error",
        message: "Please enter a valid client email address.",
      });
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    try {
      const result = await sendPaymentReceiptViaEmailAutomatically(
        invoice,
        { ...paymentRecord, receiptNumber: receiptNo, receiptPdfUrl: storageUrl } as any,
        recipientEmail.trim(),
        customNotes.trim() || undefined
      );

      setEmailStatus({
        type: "success",
        message: result.message || `Payment receipt emailed successfully from deepak.vasthusilpy@gmail.com!`,
      });
    } catch (err: any) {
      setEmailStatus({
        type: "error",
        message: err.message || "Failed to dispatch email from Gmail. Please verify permissions.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // 3. Download Receipt PDF
  const handleDownloadReceiptPdf = async () => {
    setGeneratingPdf(true);
    try {
      const { blob } = await generateReceiptPdfBlob(invoice, paymentRecord);
      triggerDownloadPdf(blob, `Payment_Receipt_Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // 4. Download Full Closed Invoice PDF
  const handleDownloadInvoicePdf = async () => {
    setGeneratingPdf(true);
    try {
      const { blob } = await generateInvoicePdfBlob(invoice);
      triggerDownloadPdf(blob, `Closed_Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // 5. Copy Direct Link
  const handleCopyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="invoice-modal-container bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 border-b-2 border-emerald-500 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                  Payment Recorded
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Receipt #{receiptNo}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Payment Receipt & Closed Invoice Dispatch Pipeline
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Status & Amount Hero Card */}
          <div className={`p-4 rounded-xl border ${
            isClosed
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              : "bg-amber-50/80 border-amber-200 text-amber-950"
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold font-mono uppercase tracking-wide opacity-75">
                  {isClosed ? "🎉 FULLY PAID & CLOSED" : "⏳ PARTIAL PAYMENT RECORDED"}
                </div>
                <div className="text-2xl font-black font-mono mt-0.5 text-slate-900">
                  ₹{Number(paymentAmount).toLocaleString("en-IN")}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Received for <strong>Tax Invoice #{invoice.invoiceNumber}</strong> ({invoice.applicantName})
                </div>
              </div>

              <div className="text-right font-mono text-xs space-y-1 bg-white/70 p-3 rounded-lg border border-slate-200/60">
                <div className="text-slate-600">
                  Total Billed: <strong>₹{Number(invoice.grandTotal).toLocaleString("en-IN")}</strong>
                </div>
                <div className="text-emerald-700 font-bold">
                  Total Paid: <strong>₹{Number(invoice.totalPaid).toLocaleString("en-IN")}</strong>
                </div>
                <div className={`font-bold ${isClosed ? "text-emerald-700" : "text-rose-600"}`}>
                  Balance Due: {isClosed ? "₹0.00 (CLOSED)" : `₹${Number(invoice.balanceDue).toLocaleString("en-IN")}`}
                </div>
              </div>
            </div>

            {paymentRecord && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700 font-sans">
                <span>📅 Date: <strong>{paymentRecord.date}</strong></span>
                <span>💳 Mode: <strong>{paymentRecord.paymentMode || "Bank payment / UPI"}</strong></span>
                {paymentRecord.referenceNo && <span>🔢 Ref/UTR: <strong>{paymentRecord.referenceNo}</strong></span>}
                {paymentRecord.account && <span>🏦 A/C: <strong>{paymentRecord.account}</strong></span>}
              </div>
            )}
          </div>

          {/* Dual Cloud Storage Status (Google Drive + Firebase Storage) */}
          <div className="space-y-2">
            {/* Google Drive Cloud Storage */}
            <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {isUploadingToDrive ? (
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                ) : driveUrl ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-bold flex items-center gap-2">
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" />
                      Google Drive Cloud Storage
                    </span>
                    {driveUrl ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded font-mono font-normal border border-emerald-500/30">
                        DRIVE ARCHIVED
                      </span>
                    ) : isUploadingToDrive ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded font-mono font-normal">
                        UPLOADING...
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.2 rounded font-mono font-normal">
                        AUTO-SYNC
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {isUploadingToDrive
                      ? "Uploading receipt PDF to 'Vasthusilpy Invoices & Receipts' folder..."
                      : driveUrl
                      ? `Stored in Google Drive: Receipt_${receiptNo}.pdf`
                      : "Saved automatically to Google Drive Cloud Storage"}
                  </div>
                </div>
              </div>

              {driveUrl && (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold rounded-lg flex items-center gap-1 border border-emerald-500/30 transition text-[11px]"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in Drive</span>
                </a>
              )}
            </div>

            {/* Firebase Cloud Storage */}
            <div className="p-2.5 bg-slate-900/70 text-slate-300 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {isUploadingToStorage ? (
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
                ) : storageUrl ? (
                  <div className="w-4 h-4 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </div>
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <div className="truncate">
                  <div className="font-medium flex items-center gap-2 text-slate-200">
                    <span>Firebase Storage Mirror</span>
                    {storageUrl && (
                      <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-mono">
                        SYNCED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {storagePath || `receipts/${invoice.invoiceNumber}/${receiptNo}.pdf`}
                  </div>
                </div>
              </div>

              {storageUrl && (
                <a
                  href={storageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded flex items-center gap-1 border border-slate-700 transition text-[10px]"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                  <span>Raw PDF</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Choice Channels (WhatsApp vs Gmail vs Link) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
              Trigger Customer Communication Pipeline:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* WhatsApp Card */}
              <div className="border-2 border-emerald-500/40 hover:border-emerald-600 bg-emerald-50/40 p-4 rounded-xl transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <span>Send via WhatsApp</span>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
                      +91 {invoice.applicantMobile || "-"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Dispatches the official payment receipt & closed invoice with direct PDF access link and auto-attachment.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  disabled={sharingWhatsApp}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {sharingWhatsApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing WhatsApp...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      Open WhatsApp with Receipt
                    </>
                  )}
                </button>
              </div>

              {/* Gmail Card */}
              <div className="border-2 border-blue-500/40 hover:border-blue-600 bg-blue-50/40 p-4 rounded-xl transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <Mail className="w-4 h-4" />
                      </div>
                      <span>Send via Gmail</span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-900 bg-blue-200/70 px-2 py-0.5 rounded-md font-bold truncate max-w-[120px]">
                      {invoice.applicantEmail || "Enter email"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    Automated email sent directly from <strong>deepak.vasthusilpy@gmail.com</strong> with PDF receipt attached.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendingEmail}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dispatching via Gmail...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send via Gmail Account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Email Recipient Input (Editable if needed) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">
                Customer Email Address for Receipt:
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client.email@example.com"
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72 font-mono"
              />
            </div>

            <div>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Add optional note in receipt / email (e.g. 'Advance for structural drawing work received with thanks')..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notification Banners */}
          {waStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{waStatus.message}</span>
              </div>
              <button
                onClick={() => setWaStatus(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {emailStatus && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              emailStatus.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}>
              <div className="flex items-center gap-2">
                {emailStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{emailStatus.message}</span>
              </div>
              <button
                onClick={() => setEmailStatus(null)}
                className="font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Direct Link & PDF Tools Row */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPortalLink}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Direct Portal Link</span>
                  </>
                )}
              </button>

              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-4 h-4 text-slate-600" />
                <span>Open Client View</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadReceiptPdf}
                disabled={generatingPdf}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Download Receipt PDF</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadInvoicePdf}
                disabled={generatingPdf}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Closed Invoice PDF</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-sans">
            Client can view verified payment records & download PDF anytime with zero login.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-800 font-bold text-xs rounded-lg transition cursor-pointer"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
};

