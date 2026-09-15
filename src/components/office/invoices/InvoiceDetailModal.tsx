import React, { useState } from "react";
import { Invoice, PaymentRecord } from "../../../types";
import { InvoiceQrCode } from "./InvoiceQrCode";
import { PaymentReceiptDispatchModal } from "./PaymentReceiptDispatchModal";
import { triggerPrint } from "../../../utils/printHelper";
import { triggerAppNotification } from "../../../context/NotificationContext";
import {
  sendInvoiceViaWhatsApp,
  sendInvoiceViaEmail,
  sendInvoiceViaEmailAutomatically,
  sendInvoiceOrReceiptViaWhatsApp,
  getInvoiceSharePortalUrl,
  formatInvoiceWhatsAppMessage
} from "../../../utils/invoiceShareHelper";
import {
  X,
  Printer,
  Download,
  CreditCard,
  Edit2,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  ChevronDown,
  Copy,
  Send,
  Bell,
  Clock,
  ArrowLeft,
  FileText,
  Building2,
  Check,
  Share2,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Loader2,
  QrCode,
  Receipt,
  HardDrive,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw
} from "lucide-react";
import { uploadInvoicePdfToGoogleDrive } from "../../../utils/googleDriveStorage";
import { generateInvoicePdfBlob } from "../../../utils/invoicePdfGenerator";

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onOpenRecordPayment?: (invoice: Invoice, paymentToEdit?: PaymentRecord | null) => void;
  onOpenPaymentModal?: (invoice: Invoice) => void;
  onDeletePayment?: (invoiceId: string, paymentId: string) => void;
  onDuplicateInvoice?: (invoice: Invoice) => void;
  onMarkAsSent?: (invoiceId: string) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onOpenRecordPayment,
  onOpenPaymentModal,
  onDeletePayment,
  onDuplicateInvoice,
  onMarkAsSent,
  onEditInvoice,
  onDeleteInvoice,
  onUpdateInvoice
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState<boolean>(false);
  const [isActivityOpen, setIsActivityOpen] = useState<boolean>(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState<boolean>(false);
  const [sendRecipientEmail, setSendRecipientEmail] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<string | null>(null);
  
  // Payment Receipt Dispatch Modal State
  const [isReceiptDispatchOpen, setIsReceiptDispatchOpen] = useState<boolean>(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<PaymentRecord | undefined>(undefined);
  
  // Payment Deletion Confirmation Modal State (In-app safe, no window.confirm)
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
  
  // Landscape Document View Scale State (100% fit to screen)
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);

  if (!isOpen || !invoice) return null;

  const handleRecordPaymentTrigger = (paymentToEdit?: PaymentRecord | null) => {
    if (onOpenRecordPayment) {
      onOpenRecordPayment(invoice, paymentToEdit);
    } else if (onOpenPaymentModal) {
      onOpenPaymentModal(invoice);
    }
  };

  const isPaid = invoice.paymentStatus === "PAID";
  const isPartial = invoice.paymentStatus === "PARTIALLY PAID";
  const isSent = !!invoice.lastSentDate || isPaid || isPartial;

  const requiredAmount = typeof invoice.balanceDue === "number" && invoice.balanceDue > 0
    ? invoice.balanceDue
    : (invoice.grandTotal || 0);

  const handleDownloadPdf = async () => {
    try {
      const { blob } = await generateInvoicePdfBlob(invoice);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${invoice.invoiceNumber}_Vasthusilpy_A4.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerAppNotification(
        "INVOICE_GENERATED",
        "A4 PDF Downloaded",
        `Invoice #${invoice.invoiceNumber} (A4 Paper Size • Default Margin) exported to PDF.`,
        { invoiceId: invoice.id }
      );
    } catch (err) {
      console.warn("Direct PDF export fallback to print:", err);
      triggerPrint(`Invoice_${invoice.invoiceNumber}_Vasthusilpy_A4`, "printable-invoice-document", { isInvoice: true, pageMargin: "15mm" });
    }
  };

  const handlePrint = () => {
    triggerPrint(`Invoice_${invoice.invoiceNumber}_Vasthusilpy_A4`, "printable-invoice-document", { isInvoice: true, pageMargin: "15mm" });
  };

  const handleSendAutomaticEmail = async () => {
    const targetEmail = (sendRecipientEmail || invoice.applicantEmail || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEmailStatusMessage({ type: "error", text: "Please provide a valid client email address." });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMessage(null);

    try {
      const res = await sendInvoiceViaEmailAutomatically(invoice, targetEmail);
      if (res.success) {
        setEmailStatusMessage({
          type: "success",
          text: `Invoice #${invoice.invoiceNumber} successfully dispatched to ${targetEmail} from deepak.vasthusilpy@gmail.com with PDF invoice attachment and Payment QR Code!`
        });
        if (onMarkAsSent) onMarkAsSent(invoice.id);
        triggerAppNotification(
          "INVOICE_GENERATED",
          "Email Sent Successfully",
          `Invoice #${invoice.invoiceNumber} sent from Gmail to ${targetEmail} with PDF & QR code`,
          { invoiceId: invoice.id }
        );
      } else {
        throw new Error(res.error || "Failed to send invoice email.");
      }
    } catch (err: any) {
      console.error("Automatic invoice send error:", err);
      setEmailStatusMessage({
        type: "error",
        text: err.message || "Failed to send email. You can also use client-side mailto fallback below."
      });
      triggerAppNotification(
        "SYSTEM",
        "Email Send Failed",
        err.message || "Could not send email automatically",
        { invoiceId: invoice.id }
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendReminder = () => {
    triggerAppNotification(
      "INVOICE_GENERATED",
      "Payment Reminder Sent",
      `Payment reminder sent to ${invoice.applicantName} (${invoice.applicantMobile})`,
      { invoiceId: invoice.id }
    );
  };

  const handleCopyUpiText = () => {
    navigator.clipboard.writeText("7012383137@okbizaxis");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSyncToGoogleDrive = async () => {
    setIsSyncingDrive(true);
    setDriveStatusMsg("Syncing invoice PDF to Google Drive...");
    try {
      const res = await uploadInvoicePdfToGoogleDrive(invoice);
      if (res.success && res.webViewLink) {
        setDriveStatusMsg("Successfully archived in Google Drive!");
        const updatedInvoice: Invoice = {
          ...invoice,
          googleDriveFileId: res.fileId,
          googleDriveUrl: res.webViewLink,
          googleDriveFolderId: res.folderId,
          googleDriveSyncedAt: new Date().toISOString()
        };
        if (onUpdateInvoice) {
          onUpdateInvoice(updatedInvoice);
        }
        triggerAppNotification(
          "INVOICE_GENERATED",
          "Google Drive Synced",
          `Invoice #${invoice.invoiceNumber} uploaded to Google Drive.`,
          { invoiceId: invoice.id }
        );
      } else {
        setDriveStatusMsg(res.error || "Failed to sync to Google Drive.");
      }
    } catch (err: any) {
      setDriveStatusMsg(err.message || "Google Drive sync error.");
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setDriveStatusMsg(null), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 bg-slate-950/90 backdrop-blur-md overflow-hidden print:p-0 print:bg-white print:static">
      {/* Selected Modal Window (Landscape & Fit to Screen 100%) */}
      <div className="bg-slate-950 text-slate-100 rounded-2xl md:rounded-3xl w-full max-w-[99vw] 2xl:max-w-[1900px] h-[98vh] max-h-[98vh] shadow-2xl border border-slate-800 flex flex-col overflow-hidden my-auto print:border-none print:shadow-none print:p-0 print:my-0 print:max-w-none print:bg-white print:h-auto print:overflow-visible">
        
        {/* ========================================================================= */}
        {/* 1. TOP STICKY EXECUTIVE TOOLBAR (Compact ~54px, Never scrolls out of view) */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0 z-20 print:hidden">
          {/* Left: Navigation, Title, Status & Metadata */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Back to Invoices"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Invoices /</span>
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight font-sans">
                  Invoice #{invoice.invoiceNumber}
                </h1>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isPaid
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                      : isPartial
                      ? "bg-amber-950 text-amber-300 border border-amber-700"
                      : isSent
                      ? "bg-blue-950 text-blue-300 border border-blue-700"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {isPaid ? "● Paid in Full" : isPartial ? "● Partially Paid" : isSent ? "● Sent" : "● Draft"}
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-md">
                  LANDSCAPE 100% FIT
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                Client: <strong className="text-slate-200">{invoice.applicantName}</strong>
                {invoice.applicantMobile && <span> • +91 {invoice.applicantMobile}</span>}
                <span> • Due: {invoice.dueDate}</span>
              </p>
            </div>
          </div>

          {/* Center: Document Zoom / Scale Controls for 100% Fit */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs font-mono">
            <span className="text-slate-400 text-[10px] font-bold uppercase mr-1">Preview Scale:</span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(Number((prev - 0.08).toFixed(2)), 0.6))}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-bold text-cyan-300 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(Number((prev + 0.08).toFixed(2)), 1.4))}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(0.92)}
              className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer font-bold ml-1 border border-slate-800"
              title="Fit to Screen"
            >
              100% Fit
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1.0)}
              className="px-1.5 py-0.5 text-[10px] text-slate-300 hover:text-white hover:bg-slate-800 rounded cursor-pointer font-bold border border-slate-800"
              title="Actual 100% Scale"
            >
              1:1
            </button>
          </div>

          {/* Right: Actions Hub & Close Button */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. Record Payment */}
            <button
              type="button"
              onClick={() => handleRecordPaymentTrigger()}
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Record a payment for this invoice"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>

            {/* Send Receipt */}
            {(isPaid || (invoice.payments && invoice.payments.length > 0)) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedPaymentForReceipt(
                    invoice.payments && invoice.payments.length > 0
                      ? invoice.payments[invoice.payments.length - 1]
                      : undefined
                  );
                  setIsReceiptDispatchOpen(true);
                }}
                className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Send Payment Receipt & Closed Invoice to Client"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Receipt</span>
              </button>
            )}

            {/* Send Invoice */}
            <button
              type="button"
              onClick={() => {
                setSendRecipientEmail(invoice.applicantEmail || "");
                setIsSendModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Send invoice via WhatsApp or Email"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Download Invoice as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">PDF</span>
            </button>

            {/* Google Drive */}
            {invoice.googleDriveUrl ? (
              <a
                href={invoice.googleDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold border border-emerald-700 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer"
                title="Open Stored PDF in Google Drive"
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xl:inline">Drive</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-70" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleSyncToGoogleDrive}
                disabled={isSyncingDrive}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 rounded-xl text-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Save & sync this invoice to Google Drive"
              >
                {isSyncingDrive ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="hidden xl:inline">Drive</span>
              </button>
            )}

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* WhatsApp */}
            <button
              type="button"
              onClick={() => {
                sendInvoiceViaWhatsApp(invoice);
                if (onMarkAsSent) onMarkAsSent(invoice.id);
                triggerAppNotification(
                  "INVOICE_GENERATED",
                  "WhatsApp Opened",
                  `Invoice #${invoice.invoiceNumber} prepared for ${invoice.applicantName}`,
                  { invoiceId: invoice.id }
                );
              }}
              className="p-1.5 bg-emerald-950/80 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 font-bold rounded-xl text-xs transition-colors flex items-center cursor-pointer"
              title="Send via WhatsApp"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Edit */}
            {onEditInvoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditInvoice(invoice);
                }}
                className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                title="Edit Invoice"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Edit</span>
              </button>
            )}

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreActionsOpen(!moreActionsOpen)}
                className="p-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors flex items-center cursor-pointer"
                title="More Actions"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              {moreActionsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 py-1.5 text-xs divide-y divide-slate-800 font-sans text-slate-200">
                  <div className="py-1">
                    {onEditInvoice && (
                      <button
                        type="button"
                        onClick={() => {
                          setMoreActionsOpen(false);
                          onClose();
                          onEditInvoice(invoice);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Edit invoice</span>
                      </button>
                    )}
                    {(isPaid || (invoice.payments && invoice.payments.length > 0)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMoreActionsOpen(false);
                          setSelectedPaymentForReceipt(
                            invoice.payments && invoice.payments.length > 0
                              ? invoice.payments[invoice.payments.length - 1]
                              : undefined
                          );
                          setIsReceiptDispatchOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-emerald-300 flex items-center gap-2 font-semibold"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Send payment receipt</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMoreActionsOpen(false);
                        sendInvoiceViaWhatsApp(invoice);
                        if (onMarkAsSent) onMarkAsSent(invoice.id);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-emerald-300 flex items-center gap-2 font-medium"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Send via WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreActionsOpen(false);
                        setSendRecipientEmail(invoice.applicantEmail || "");
                        setIsSendModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-blue-300 flex items-center gap-2 font-medium"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>Send via Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMoreActionsOpen(false);
                        handleSendReminder();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                    >
                      <Bell className="w-3.5 h-3.5 text-slate-400" />
                      <span>Send payment reminder</span>
                    </button>
                  </div>

                  <div className="py-1">
                    {onDuplicateInvoice && (
                      <button
                        type="button"
                        onClick={() => {
                          setMoreActionsOpen(false);
                          onDuplicateInvoice(invoice);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Duplicate Invoice</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMoreActionsOpen(false);
                        handleDownloadPdf();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-800 text-slate-200 flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {onDeleteInvoice && (
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMoreActionsOpen(false);
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-950/60 text-red-400 font-semibold flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        <span>Delete invoice</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. EXECUTIVE FINANCIAL & TIMELINE RIBBON (Height ~40px, Fit-to-Screen)    */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 print:hidden font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Grand Total:</span>
              <span className="text-sm font-black text-white">
                ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Paid Amount:</span>
              <span className="text-sm font-black text-emerald-400">
                ₹{invoice.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Balance Due:</span>
              <span
                className={`text-sm font-black ${
                  invoice.balanceDue > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                ₹{invoice.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Timeline & Progress Bar */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-sans">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Check className="w-3 h-3" /> 1. Created
              </span>
              <span className="text-slate-600">→</span>
              <span
                className={`flex items-center gap-1 font-semibold ${
                  isSent ? "text-emerald-400" : "text-slate-500"
                }`}
              >
                {isSent ? <Check className="w-3 h-3" /> : "2."} Sent
              </span>
              <span className="text-slate-600">→</span>
              <span
                className={`flex items-center gap-1 font-semibold ${
                  isPaid
                    ? "text-emerald-400"
                    : isPartial
                    ? "text-amber-400"
                    : "text-slate-500"
                }`}
              >
                {isPaid ? <Check className="w-3 h-3" /> : "3."}{" "}
                {isPaid ? "Settled" : isPartial ? "Partial" : "Payment Pending"}
              </span>
            </div>

            {invoice.googleDriveUrl && (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                <HardDrive className="w-3 h-3" /> Drive Synced
              </span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DUAL-PANE LANDSCAPE WORKSTATION (Left: A4 Document, Right: Tools)      */}
        {/* ========================================================================= */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden bg-slate-950">
          
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: A4 DOCUMENT VIEWER (7 cols on lg, 8 cols on 2xl)            */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-7 2xl:col-span-8 flex flex-col min-h-0 border-r border-slate-800/90 bg-slate-900/40 relative">
            {/* Document Bar at top of preview */}
            <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0 print:hidden">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold truncate">
                <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">A4 Tax Invoice Document (210mm × 297mm) • 100% Fit-to-Screen</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-sans text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>

            {/* Document Scrollable Area (Scrolls throughout window from top to bottom) */}
            <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-5 flex justify-center items-start custom-scrollbar">
              <div
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s ease-out"
                }}
                className="w-full flex justify-center"
              >
                {/* Printable Invoice Document */}
                <div
                  id="printable-invoice-document"
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black rounded-none shadow-2xl p-[8mm] sm:p-[10mm] space-y-2.5 font-sans border border-slate-300 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:min-h-0 print:m-0 mx-auto box-border"
                >
                  {/* Top Document Corporate Header - Side by Side Office & Tax Invoice Details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start border-b-2 border-black pb-2.5">
                    {/* Office Details (Left) */}
                    <div className="md:col-span-7 space-y-0.5">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h2 className="text-2xl font-black text-black tracking-tight font-sans uppercase leading-none">
                          VASTHUSILPY
                        </h2>
                        <span className="text-[10px] font-mono font-bold bg-neutral-100 text-black px-1.5 py-0.5 rounded border border-black uppercase tracking-tight">
                          KPBR & KMBR Regd. Engineer • Valuer
                        </span>
                      </div>
                      <div className="text-[10px] font-black text-black uppercase tracking-wider font-mono">
                        Architectural • Engineering • Survey • Valuation • 3D Design
                      </div>
                      <div className="text-[11px] text-black font-semibold leading-tight font-sans space-y-0.5 pt-0.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-black shrink-0" />
                          <span>Near Panchayath Office, Keralassery, Palakkad, Kerala - 678641</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-[10.5px]">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-black shrink-0" />
                            <span className="font-mono">+91 97479 95961 / 70123 83137</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-black shrink-0" />
                            <span>deepak.vasthusilpy@gmail.com</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tax Invoice Details (Right) */}
                    <div className="md:col-span-5 flex flex-col items-end text-right">
                      <div className="flex items-center justify-end gap-2 mb-1">
                        <span className="text-xl font-black text-black uppercase font-mono tracking-wider">
                          TAX INVOICE
                        </span>
                        <span className="inline-block text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase border border-black bg-white text-black tracking-wider">
                          {isPaid ? "PAID IN FULL" : isPartial ? "PARTIAL" : "PAYMENT DUE"}
                        </span>
                      </div>
                      <div className="w-full max-w-[240px] bg-neutral-50 border border-black rounded-lg p-1.5 text-[11px] font-mono text-black space-y-0.5">
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600 font-semibold">Invoice No:</span>
                          <strong className="font-black text-black">#{invoice.invoiceNumber}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600 font-semibold">Invoice Date:</span>
                          <strong className="font-black text-black">{invoice.invoiceDate}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600 font-semibold">Payment Due:</span>
                          <strong className="font-black text-black">{invoice.dueDate}</strong>
                        </div>
                        {invoice.poNumber && (
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-600 font-semibold">P.O. No:</span>
                            <strong className="font-black text-black">{invoice.poNumber}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Billed To Customer Card (Black and White Layout) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3 bg-white border border-black rounded-lg p-2.5 text-xs text-black">
                    <div className="md:col-span-7 print:col-span-7 space-y-0.5">
                      <div className="text-[10px] font-black text-black uppercase tracking-widest font-mono border-b border-black pb-0.5 mb-1">
                        BILLED TO (CLIENT)
                      </div>
                      <div className="text-sm font-black text-black font-sans leading-snug">{invoice.applicantName}</div>
                      {invoice.applicantContactPerson && (
                        <div className="text-black font-semibold text-[11px] font-sans">Attn: {invoice.applicantContactPerson}</div>
                      )}
                      {invoice.applicantAddress && (
                        <div className="text-black font-medium text-[11px] leading-tight font-sans">{invoice.applicantAddress}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-black font-bold font-mono text-[11px] pt-0.5">
                        {invoice.applicantMobile && <span>Mob: +91 {invoice.applicantMobile}</span>}
                        {invoice.applicantEmail && <span>• Email: {invoice.applicantEmail}</span>}
                      </div>
                    </div>

                    <div className="md:col-span-5 print:col-span-5 md:border-l md:border-black md:pl-3 print:border-l print:border-black print:pl-3 space-y-0.5 font-mono">
                      <div className="text-[10px] font-black text-black uppercase tracking-widest border-b border-black pb-0.5 mb-1">
                        PROJECT & WORK REFERENCE
                      </div>
                      <div className="text-xs font-black text-black font-sans line-clamp-1">
                        {invoice.projectTitle || "Architectural & Engineering Consulting"}
                      </div>
                      <div className="text-black font-semibold text-[11px] pt-0.5 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Currency:</span>
                          <strong className="font-black text-black">INR (₹)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Payment Terms:</span>
                          <strong className="font-black text-black">Due on Receipt</strong>
                        </div>
                        {invoice.projectId && (
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Project Ref:</span>
                            <strong className="font-black text-black">#{invoice.projectId}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Professional Line Items Table - Streamlined for maximum items per page */}
                  <div className="overflow-x-auto border-2 border-black rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-100 text-black border-b-2 border-black font-mono font-black text-[11px] uppercase">
                          <th className="py-1.5 px-2.5 text-center w-10 border-r border-black">#</th>
                          <th className="py-1.5 px-2.5 border-r border-black">Scope of Work / Service Description</th>
                          <th className="py-1.5 px-2.5 text-center w-24 border-r border-black">Unit / Qty</th>
                          <th className="py-1.5 px-2.5 text-right w-28 border-r border-black">Rate (₹)</th>
                          <th className="py-1.5 px-2.5 text-right w-32">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black font-sans text-black">
                        {(invoice.items || []).map((item, index) => (
                          <tr key={item.id} className="bg-white">
                            <td className="py-1.5 px-2.5 text-center font-mono font-bold text-black border-r border-black text-[11px]">
                              {index + 1}
                            </td>
                            <td className="py-1.5 px-2.5 font-bold text-black font-sans border-r border-black text-xs leading-snug">
                              {item.description}
                            </td>
                            <td className="py-1.5 px-2.5 text-center font-mono font-semibold text-black border-r border-black text-xs">
                              {item.unit || item.quantity || "1"}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-black border-r border-black text-xs">
                              ₹{item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-black text-black text-xs">
                              ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotals & Payment Settlement Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3 pt-0.5 items-start">
                    {/* Bottom Left: Official Bank Details & UPI QR Code */}
                    <div className="md:col-span-7 print:col-span-7 space-y-2">
                      <div className="bg-white border-2 border-black rounded-lg p-2.5 text-black">
                        <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
                          <span className="font-black text-black uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                            <Building2 className="w-3.5 h-3.5 text-black shrink-0" />
                            <span>Bank Account & Payment Details</span>
                          </span>
                          <span className="text-[9px] text-black font-black uppercase border border-black px-1.5 py-0.5 rounded">
                            Official
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          {/* Specified Bank Account Details */}
                          <div className="flex-1 space-y-0.5 text-black font-semibold leading-tight min-w-0 text-[10px] font-mono">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-neutral-600 font-normal">NAME :</span>
                              <strong className="text-black font-black">DEEPAK C</strong>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-neutral-600 font-normal">ACCOUNT NO :</span>
                              <strong className="text-black font-black tracking-wide">1062 5047 526</strong>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-neutral-600 font-normal">IFSC CODE :</span>
                              <strong className="text-black font-black">SBIN0007624</strong>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-neutral-600 font-normal">BANK :</span>
                              <strong className="text-black font-black">SBI , KERALASSERY</strong>
                            </div>
                            <div className="pt-1 mt-1 border-t border-dotted border-neutral-300">
                              <div className="text-neutral-600 font-normal text-[9px] uppercase tracking-wider">UPI PAYMENT :</div>
                              <div className="text-black font-bold text-[10px]">9567627277@naviaxis</div>
                              <div className="text-black font-bold text-[10px]">7012383137@naviaxis</div>
                            </div>
                          </div>

                          {/* Clean UPI QR Code for paying 7012383137@okbizaxis with balance due amount */}
                          <div className="shrink-0 pl-2.5 border-l border-black flex flex-col items-center justify-center">
                            <InvoiceQrCode
                              upiId="7012383137@okbizaxis"
                              payeeName="DEEPAK C"
                              amount={invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal}
                              invoiceNumber={invoice.invoiceNumber}
                              size={82}
                              minimal={true}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Special Notes if present */}
                      {invoice.notes && (
                        <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-[10px] font-sans text-black">
                          <div className="font-bold font-mono text-[9.5px] uppercase text-neutral-600 mb-0.5">Special Note:</div>
                          <div className="whitespace-pre-line leading-relaxed text-black font-medium">{invoice.notes}</div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Right: Total Calculation Breakdown (No signature / seal) */}
                    <div className="md:col-span-5 print:col-span-5 space-y-2 text-xs font-sans text-black">
                      <div className="bg-white border border-black rounded-lg p-2.5 space-y-1.5">
                        <div className="flex justify-between items-center text-black text-xs">
                          <span className="font-semibold">Subtotal:</span>
                          <span className="font-mono font-bold text-black">
                            ₹{invoice.subTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {invoice.discount > 0 && (
                          <div className="flex justify-between items-center text-black text-xs">
                            <span className="font-semibold">Discount:</span>
                            <span className="font-mono font-bold text-rose-700">
                              -₹{invoice.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-1 border-t border-black text-black">
                          <span className="font-black uppercase text-xs">Grand Total:</span>
                          <span className="font-mono font-black text-base text-black">
                            ₹{invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-black text-xs">
                          <span className="font-semibold">Amount Paid:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            ₹{invoice.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-black text-sm font-black text-black">
                          <span className="text-black uppercase">Balance Due:</span>
                          <span className="font-mono font-black text-black">
                            ₹{invoice.balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Terms & Conditions */}
                  <div className="border-t border-black pt-1.5 text-[10px] text-black space-y-0.5 font-sans">
                    <div className="font-black text-black uppercase tracking-wider text-[10px]">TERMS & CONDITIONS:</div>
                    <div className="leading-tight font-medium text-black">
                      {invoice.terms ||
                        "1. Payment should be made by UPI, Bank Transfer (NEFT/RTGS), or Cheque in favor of VASTHUSILPY. 2. Please quote invoice number during transfer. 3. Computer-generated tax invoice."}
                    </div>
                    <div className="text-center font-bold text-black pt-0.5 text-[10px] uppercase tracking-wider">
                      Thank you for your business!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: MANAGEMENT & OPERATIONS CONSOLE (5 cols on lg, 4 on 2xl)   */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-5 2xl:col-span-4 flex flex-col min-h-0 overflow-y-auto p-3.5 md:p-4 space-y-3.5 bg-slate-950/80 custom-scrollbar print:hidden">
            
            {/* Quick Record Payment Hero Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Payment Collection Hub
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans">
                      {isPaid ? "All payments completed" : `₹${invoice.balanceDue.toLocaleString("en-IN")} pending collection`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRecordPaymentTrigger()}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Collection Progress:</span>
                  <span className="font-bold text-emerald-400">
                    {invoice.grandTotal > 0
                      ? `${Math.min(100, Math.round((invoice.totalPaid / invoice.grandTotal) * 100))}%`
                      : "0%"}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{
                      width: `${invoice.grandTotal > 0 ? Math.min(100, (invoice.totalPaid / invoice.grandTotal) * 100) : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Mini Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-center">
                <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">Total</div>
                  <div className="text-xs font-bold text-white truncate">₹{invoice.grandTotal.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">Paid</div>
                  <div className="text-xs font-bold text-emerald-400 truncate">₹{invoice.totalPaid.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-400">Due</div>
                  <div className="text-xs font-bold text-rose-400 truncate">₹{invoice.balanceDue.toLocaleString("en-IN")}</div>
                </div>
              </div>
            </div>

            {/* Client Info & Direct Communication Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Client Contact Details</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Billed To</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-bold text-sm text-white">{invoice.applicantName}</div>
                {invoice.applicantAddress && (
                  <div className="text-slate-400 text-[11px] leading-relaxed">{invoice.applicantAddress}</div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                  {invoice.applicantMobile && (
                    <a
                      href={`tel:+91${invoice.applicantMobile}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-cyan-400" />
                      <span>+91 {invoice.applicantMobile}</span>
                    </a>
                  )}
                  {invoice.applicantEmail && (
                    <a
                      href={`mailto:${invoice.applicantEmail}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Mail className="w-3 h-3 text-blue-400" />
                      <span className="truncate max-w-[160px]">{invoice.applicantEmail}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Fast Sharing Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    sendInvoiceViaWhatsApp(invoice);
                    if (onMarkAsSent) onMarkAsSent(invoice.id);
                  }}
                  className="py-2 px-3 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSendRecipientEmail(invoice.applicantEmail || "");
                    setIsSendModalOpen(true);
                  }}
                  className="py-2 px-3 bg-blue-950/80 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Email Invoice</span>
                </button>
              </div>
            </div>

            {/* Recorded Payments History Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Payment History ({invoice.payments?.length || 0})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRecordPaymentTrigger()}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  + Add Payment
                </button>
              </div>

              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden text-xs">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className="p-2.5 hover:bg-slate-800/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-white font-mono flex items-center gap-2">
                          <span className="text-emerald-400">
                            ₹{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-[10px] font-sans text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded font-semibold">
                            {p.paymentMode}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          Date: {p.date} {p.referenceNo ? `• UTR: ${p.referenceNo}` : ""}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentForReceipt(p);
                            setIsReceiptDispatchOpen(true);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-950/60 rounded border border-emerald-800/60 transition-colors cursor-pointer flex items-center gap-1"
                          title="Generate & Send Receipt"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecordPaymentTrigger(p)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {onDeletePayment && (
                          <button
                            type="button"
                            onClick={() => setPaymentToDelete(p)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Payment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-center space-y-1">
                  <p className="text-xs text-slate-400">No payments logged yet for this invoice.</p>
                  <button
                    type="button"
                    onClick={() => handleRecordPaymentTrigger()}
                    className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                  >
                    Click here to record a payment
                  </button>
                </div>
              )}
            </div>

            {/* Instant UPI & Bank Transfer Hub Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Official UPI & Bank Details</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">Active</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">QR UPI (Direct Pay)</span>
                    <span className="font-bold text-cyan-300 font-mono text-xs">7012383137@okbizaxis</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("7012383137@okbizaxis");
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUpi ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1 font-mono leading-relaxed">
                  <div>NAME : <strong className="text-white">DEEPAK C</strong></div>
                  <div>ACCOUNT NO : <strong className="text-white">1062 5047 526</strong></div>
                  <div>IFSC CODE : <strong className="text-white">SBIN0007624</strong></div>
                  <div>BANK : <strong className="text-white">SBI , KERALASSERY</strong></div>
                  <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                    <div>UPI PAYMENT :</div>
                    <div className="text-cyan-400 font-bold">9567627277@naviaxis</div>
                    <div className="text-cyan-400 font-bold">7012383137@naviaxis</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Drive Archival Card */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center">
                    <HardDrive className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200 font-mono">Google Drive Archival</div>
                    <div className="text-[10px] text-slate-400 font-sans">Automatic cloud PDF storage</div>
                  </div>
                </div>
                {invoice.googleDriveUrl ? (
                  <a
                    href={invoice.googleDriveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleSyncToGoogleDrive}
                    disabled={isSyncingDrive}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSyncingDrive ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDrive className="w-3 h-3" />}
                    <span>Sync Now</span>
                  </button>
                )}
              </div>
            </div>

            {/* Copy Summary Text Button */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(formatInvoiceWhatsAppMessage(invoice));
                triggerAppNotification(
                  "INVOICE_GENERATED",
                  "Copied to Clipboard",
                  `Invoice #${invoice.invoiceNumber} summary text copied!`
                );
              }}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Invoice Text with Payment Link</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. BOTTOM FOOTER BAR (Print Hidden, Compact ~38px)                        */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-t border-slate-800 text-xs text-slate-500 font-mono shrink-0 print:hidden">
          <div className="truncate">
            Document ID: #{invoice.id} • Vasthusilpy Certified System • 100% Fit Landscape
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>

        {/* Delete Invoice Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Delete invoice #{invoice.invoiceNumber}?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete this invoice for <strong>{invoice.applicantName}</strong>? All recorded payment records for this invoice will be removed.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-full text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteInvoice) {
                      onDeleteInvoice(invoice.id);
                    }
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full text-xs shadow-md shadow-red-500/20 cursor-pointer"
                >
                  Delete invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Payment Confirmation Modal (Replacing blocked window.confirm) */}
        {paymentToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white font-sans">
                  Delete Payment Record?
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  Remove payment of <strong className="text-emerald-400 font-mono">₹{paymentToDelete.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> logged on <span className="text-white font-mono">{paymentToDelete.date}</span>?
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Invoice balance due and status will be automatically updated.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentToDelete(null)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeletePayment && paymentToDelete) {
                      onDeletePayment(invoice.id, paymentToDelete.id);
                    }
                    setPaymentToDelete(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 transition-colors cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Send Invoice Modal (WhatsApp, Email & Copy) */}
        {isSendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Send Invoice #{invoice.invoiceNumber}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <strong className="text-slate-900">{invoice.applicantName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mobile:</span>
                  <strong className="text-slate-900">+91 {invoice.applicantMobile}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grand Total:</span>
                  <strong className="text-slate-900 font-mono">₹{invoice.grandTotal.toLocaleString("en-IN")}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Balance Due:</span>
                  <strong className="text-rose-600 font-mono">₹{invoice.balanceDue.toLocaleString("en-IN")}</strong>
                </div>
              </div>

              {/* Status Alert Message */}
              {emailStatusMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-sans border flex items-start gap-2 ${
                    emailStatusMessage.type === "success"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                      : "bg-red-50 border-red-300 text-red-900"
                  }`}
                >
                  {emailStatusMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed">{emailStatusMessage.text}</div>
                </div>
              )}

              {/* Fast Send Channels */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Select Delivery Channel
                </label>

                {/* 1. WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => {
                    sendInvoiceViaWhatsApp(invoice);
                    if (onMarkAsSent) onMarkAsSent(invoice.id);
                    triggerAppNotification(
                      "INVOICE_GENERATED",
                      "WhatsApp Opened",
                      `Invoice #${invoice.invoiceNumber} prepared for ${invoice.applicantName} with payment link and QR`,
                      { invoiceId: invoice.id }
                    );
                  }}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Send via WhatsApp (+91 {invoice.applicantMobile})</span>
                  </div>
                  <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded-full font-mono">
                    Includes UPI & QR Link
                  </span>
                </button>

                {/* 2. Automated Gmail Sending Box */}
                <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Automated Email via Gmail</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono font-bold">
                      deepak.vasthusilpy@gmail.com
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-normal">
                    Directly dispatches email to client with:
                    <br />
                    • 💳 <strong>Instant Payment Link</strong> (GPay/PhonePe/Paytm)
                    <br />
                    • 📲 <strong>Dynamic QR Code</strong> for required amount (<strong>₹{Number(requiredAmount).toLocaleString("en-IN")}</strong>)
                    <br />
                    • 📎 <strong>Attached Official Tax Invoice PDF</strong>
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase">
                      Recipient Email Address:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={sendRecipientEmail}
                        onChange={(e) => setSendRecipientEmail(e.target.value)}
                        placeholder="client@example.com"
                        className="flex-1 bg-white border border-slate-300 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSendingEmail}
                        onClick={handleSendAutomaticEmail}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        {isSendingEmail ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send via Gmail</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Copy Summary Text */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(formatInvoiceWhatsAppMessage(invoice));
                    triggerAppNotification(
                      "INVOICE_GENERATED",
                      "Copied to Clipboard",
                      `Invoice #${invoice.invoiceNumber} summary text with Payment Link & QR copied!`
                    );
                  }}
                  className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Invoice Summary with Payment Link & QR</span>
                </button>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Receipt & Closed Invoice Dispatch Modal */}
        {isReceiptDispatchOpen && invoice && (
          <PaymentReceiptDispatchModal
            isOpen={isReceiptDispatchOpen}
            onClose={() => {
              setIsReceiptDispatchOpen(false);
              setSelectedPaymentForReceipt(undefined);
            }}
            invoice={invoice}
            paymentRecord={selectedPaymentForReceipt}
            onUpdateInvoice={onEditInvoice}
          />
        )}
      </div>
    </div>
  );
};
