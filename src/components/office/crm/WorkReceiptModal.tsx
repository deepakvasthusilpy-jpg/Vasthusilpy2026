import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { CrmProject, Invoice } from "../../../types";
import {
  downloadWorkReceiptPdf,
  sendWorkReceiptEmail,
  getClientProjectPortalUrl
} from "../../../utils/workReceiptPdfGenerator";
import { getOrAssignReceiptNumber } from "../../../utils/receiptNumberManager";
import { VASTHUSILPY_LOGO_SVG } from "../../../data/vasthusilpyLogo";
import {
  X,
  QrCode,
  Download,
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Scissors,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";

interface WorkReceiptModalProps {
  project: CrmProject;
  invoice?: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (updatedProject: CrmProject) => void;
}

export const WorkReceiptModal: React.FC<WorkReceiptModalProps> = ({
  project,
  invoice,
  isOpen,
  onClose,
  onUpdateProject
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>(
    project.clientEmail || ""
  );
  const [customNotes, setCustomNotes] = useState<string>("");
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [emailStatus, setEmailStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Assign or get sequential receipt number (e.g. VS000001, VS000002)
  const [receiptNumber, setReceiptNumber] = useState<string>(() => {
    return getOrAssignReceiptNumber(project, undefined, onUpdateProject);
  });

  const portalUrl = getClientProjectPortalUrl(project.id);

  useEffect(() => {
    if (project?.id) {
      const assigned = getOrAssignReceiptNumber(project, undefined, onUpdateProject);
      setReceiptNumber(assigned);
    }
  }, [project.id]);

  // Auto-generate QR code data URL for preview
  useEffect(() => {
    if (project?.id) {
      QRCode.toDataURL(portalUrl, {
        width: 250,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        },
        errorCorrectionLevel: "M"
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Failed to generate modal QR code:", err));
    }
  }, [project.id, portalUrl]);

  useEffect(() => {
    if (project.clientEmail && !recipientEmail) {
      setRecipientEmail(project.clientEmail);
    }
  }, [project.clientEmail]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      await downloadWorkReceiptPdf(project, invoice);
    } catch (err: any) {
      alert("Failed to download PDF receipt: " + (err.message || err));
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = recipientEmail.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailStatus({
        type: "error",
        message: "Please enter a valid recipient email address."
      });
      return;
    }

    try {
      setSendingEmail(true);
      setEmailStatus({ type: null, message: "" });

      const res = await sendWorkReceiptEmail({
        project: {
          ...project,
          clientEmail: cleanEmail,
          receiptNumber
        },
        invoice,
        recipientEmail: cleanEmail,
        customNotes
      });

      setEmailStatus({
        type: "success",
        message: res.message || `Work receipt successfully emailed to ${cleanEmail}!`
      });

      if (onUpdateProject) {
        onUpdateProject({
          ...project,
          clientEmail: cleanEmail,
          receiptNumber,
          lastEmailedTo: cleanEmail,
          lastEmailedAt: new Date().toISOString(),
          workReceiptGeneratedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setEmailStatus({
        type: "error",
        message: err.message || "Failed to dispatch email. Please verify SMTP credentials."
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Financial calculations
  const billAmount = invoice?.grandTotal || project.estimatedAmount || 0;
  const paidAmount = invoice?.totalPaid || 0;
  const balanceDue = invoice ? (invoice.balanceDue || 0) : Math.max(0, billAmount - paidAmount);

  // Formatted Entry Date
  let entryDate = project.createdAt || new Date().toISOString().split("T")[0];
  try {
    const d = new Date(entryDate);
    if (!isNaN(d.getTime())) {
      entryDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
  } catch {
    // keep default
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-red-400 border border-red-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ഔദ്യോഗിക വർക്ക് രസീത് (Work Receipt)
                <span className="text-xs font-bold text-red-400 bg-red-950/70 border border-red-500/40 px-2.5 py-0.5 rounded-md">
                  {receiptNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Vertical A4 Sheet • Top 20% Slip Format • Small Logo • Zero-Login QR Code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100/70 dark:bg-slate-950/50">
          {/* Top Info Banner & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Official Document Format
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Vertical A4 Sheet (20% Top Slip Layout)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                  Small Logo & Cut Line
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receipt occupies strictly the top 20% (~59mm) of the vertical A4 sheet. The remaining 80% is left clean and blank for neat scissors cutting.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? "PDF തയ്യാറാക്കുന്നു..." : "Download Vertical A4 Receipt PDF"}</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* EXACT LIVE PREVIEW: VERTICAL VIEW OF A4 SHEET (TOP 20% RECEIPT SLIP)      */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                Vertical A4 Sheet Preview (Top 20% Receipt Slip • 210mm × 297mm)
              </span>
              <span className="text-xs text-slate-400">
                Receipt No: <strong className="text-slate-900 dark:text-white">{receiptNumber}</strong>
              </span>
            </div>

            {/* Vertical A4 Sheet Container Preview (Portrait orientation) */}
            <div className="mx-auto w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
              {/* Top 20% Slip Area */}
              <div className="p-4 bg-white space-y-2.5 border-b border-slate-100">
                {/* 1. Office Details & Small Logo on Top */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Small Vasthusilpy Red Circular Logo */}
                    <div
                      className="w-9 h-9 shrink-0"
                      dangerouslySetInnerHTML={{ __html: VASTHUSILPY_LOGO_SVG }}
                    />
                    <div>
                      <h3 className="text-xs md:text-sm font-extrabold text-red-700 tracking-tight leading-tight">
                        VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS
                      </h3>
                      <p className="text-[10px] text-slate-600 font-medium leading-tight">
                        Civil Architectural Consultancy • Planning • 3D • K-SMART Approvals • Valuation
                      </p>
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 7012383137, 9747995961 | deepak.vasthusilpy@gmail.com
                      </p>
                    </div>
                  </div>

                  <div className="text-right bg-slate-50 border border-slate-200 rounded-md px-2 py-1 shrink-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">WORK RECEIPT</span>
                    <span className="text-xs font-extrabold text-red-700 block">
                      {receiptNumber}
                    </span>
                    <span className="text-[9px] text-slate-600 block">
                      ENTRY: {entryDate}
                    </span>
                  </div>
                </div>

                {/* 2. Metadata Strip */}
                <div className="flex items-center justify-between px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[11px]">
                  <div className="flex items-center gap-4">
                    <p>
                      <span className="text-slate-500 font-medium">RECEIPT NO: </span>
                      {/* Highlight Receipt No in BOLD */}
                      <strong className="font-extrabold text-slate-950 text-xs">{receiptNumber}</strong>
                    </p>
                    <p>
                      <span className="text-slate-500 font-medium">ENTRY DATE: </span>
                      <strong className="font-bold text-slate-900">{entryDate}</strong>
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                    STATUS: {project.status || "ACTIVE"}
                  </span>
                </div>

                {/* 3. Middle Section: Particulars + File Tracking QR Code */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-stretch">
                  {/* Left 3 Columns: Client Details, Work Details, Bill Details */}
                  <div className="md:col-span-3 space-y-2">
                    {/* Client & Work Box */}
                    <div className="p-2 rounded border border-slate-200 bg-white space-y-1.5 text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1">
                        <div>
                          <span className="text-slate-500">Client Name: </span>
                          {/* Highlight Client Name in BOLD */}
                          <strong className="text-slate-950 font-extrabold text-xs">
                            {project.clientName || "Client"}
                          </strong>
                        </div>
                        <div className="text-slate-600">
                          <span className="text-slate-500">Phone: </span>
                          <strong className="text-slate-900">{project.clientPhone || "+91 9747995961"}</strong>
                        </div>
                        <div className="text-slate-600">
                          <span className="text-slate-500">Location: </span>
                          <span className="text-slate-800 font-medium">{project.location || "Palakkad, Kerala"}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">Work / Project: </span>
                        {/* Highlight Work in BOLD */}
                        <strong className="text-slate-950 font-extrabold text-xs">
                          {project.title || "Civil Architectural Work"}
                        </strong>
                      </div>

                      <div className="text-slate-600 text-[10.5px]">
                        <span className="text-slate-500">Work Scope: </span>
                        <span>{project.description || "Building Plan, Structural Drawings & Approval"}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>Lead: <strong className="text-slate-800">{project.assignee || "Deepak V"}</strong></span>
                        <span>Target Due: <strong className="text-slate-800">{project.dueDate || "As Scheduled"}</strong></span>
                      </div>
                    </div>

                    {/* Bill Details and Payment Details Strip */}
                    <div className="p-2 rounded border border-slate-200 bg-slate-50 text-[11px]">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        BILL DETAILS & PAYMENT DETAILS
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1 rounded bg-white border border-slate-200">
                          <span className="text-[9px] text-slate-500 block">Total Bill</span>
                          <strong className="text-xs font-extrabold text-slate-950 block">
                            ₹{Number(billAmount).toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div className="p-1 rounded bg-white border border-slate-200">
                          <span className="text-[9px] text-slate-500 block">Amount Paid</span>
                          <strong className="text-xs font-extrabold text-emerald-600 block">
                            ₹{Number(paidAmount).toLocaleString("en-IN")}
                          </strong>
                        </div>
                        <div className="p-1 rounded bg-white border border-slate-200">
                          <span className="text-[9px] text-slate-500 block">Balance Due</span>
                          <strong className={`text-xs font-extrabold block ${balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            {balanceDue <= 0 ? "₹0.00 (PAID)" : `₹${Number(balanceDue).toLocaleString("en-IN")}`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right 1 Column: File Tracking QR Code */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center p-2 rounded border border-slate-200 bg-white text-center">
                    <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      FILE TRACKING QR
                    </span>
                    <div className="w-20 h-20 p-1 rounded bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="File Tracking QR Code"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-900 mt-1 block leading-tight">
                      SCAN TO TRACK FILE
                    </span>
                    <span className="text-[8.5px] text-slate-500 block leading-tight">
                      Live Status 24/7
                    </span>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SCISSOR CUT LINE & CUT SYMBOL (EXACTLY AT 20% MARK OF A4 VERTICAL SHEET)  */}
              {/* ========================================================================= */}
              <div className="py-2.5 px-4 bg-slate-50 border-t-2 border-dashed border-slate-400 relative flex items-center justify-center">
                <div className="absolute left-3 -top-2.5 bg-white px-1 text-slate-500 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-slate-600 rotate-90" />
                </div>
                <span className="bg-white px-3 text-[10.5px] font-bold text-slate-600 tracking-wider flex items-center gap-1.5 -translate-y-1/2">
                  ✂ CUT HERE (TOP 20% SLIP) ✂
                </span>
                <div className="absolute right-3 -top-2.5 bg-white px-1 text-slate-500 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-slate-600 -rotate-90" />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* REMAINING 80% BLANK AREA OF THE VERTICAL A4 SHEET                         */}
              {/* ========================================================================= */}
              <div className="h-44 bg-slate-50/50 flex flex-col items-center justify-center text-center p-6 border-t border-slate-100 text-slate-400">
                <div className="w-10 h-10 rounded-full border border-slate-300/80 flex items-center justify-center mb-2 text-slate-400">
                  <Scissors className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-500">
                  Remaining 80% Blank A4 Sheet Area
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                  The printed vertical A4 paper leaves this 80% area blank for clean, crisp scissors cutting of the top 20% slip.
                </p>
              </div>
            </div>
          </div>

          {/* Client Portal Link and QR Details */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero-Login Client Live File Tracking URL
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct client access to status & blueprint files without username or password
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-sky-600 dark:hover:bg-sky-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Portal</span>
              </a>
            </div>
          </div>

          {/* Automated Email Dispatch Section */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-red-600 dark:text-red-400" />
                Email Receipt to Client
              </h4>
              {project.lastEmailedAt && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sent: {new Date(project.lastEmailedAt).toLocaleDateString("en-IN")}
                </span>
              )}
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client Email Address:
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Note to Client:
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Work started, site inspection completed..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {emailStatus.message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    emailStatus.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                  }`}
                >
                  {emailStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{emailStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={sendingEmail || !recipientEmail}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? "Sending..." : "Send Receipt PDF via Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Vasthusilpy Engineering Records • Official Vertical A4 Slip (Top 20%)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
