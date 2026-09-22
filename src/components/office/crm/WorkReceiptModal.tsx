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
  FileText,
  CreditCard,
  Building2,
  MapPin,
  Phone,
  Calendar,
  User
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
        message: res.message || `Work receipt successfully prepared for ${cleanEmail}!`
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
        message: err.message || "Failed to dispatch email."
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Financial calculations with Advance Payment Provision
  const billAmount = invoice?.grandTotal || project.estimatedAmount || 0;
  const advanceAmount = project.advancePayment || invoice?.advancePayment || 0;
  const totalPaid = (invoice?.totalPaid !== undefined && invoice.totalPaid > 0)
    ? invoice.totalPaid
    : (advanceAmount > 0 ? advanceAmount : 0);
  const balanceDue = invoice?.balanceDue !== undefined
    ? invoice.balanceDue
    : Math.max(0, billAmount - totalPaid);

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

  // Component to render single receipt preview (guaranteeing exact same size and structure)
  const renderReceiptSlip = (copyType: "CUSTOMER COPY" | "OFFICE COPY") => {
    const isCustomer = copyType === "CUSTOMER COPY";
    return (
      <div className="p-4 bg-white space-y-3 text-slate-900 font-sans border border-slate-200 rounded-xl shadow-xs">
        {/* Top Header & Copy Type Badge */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 shrink-0"
              dangerouslySetInnerHTML={{ __html: VASTHUSILPY_LOGO_SVG }}
            />
            <div>
              <h3 className="text-xs md:text-sm font-black text-red-700 tracking-tight leading-tight">
                VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS
              </h3>
              <p className="text-[10px] text-slate-700 font-semibold leading-tight">
                Architectural Plans • 3D Elevation • KPBR & K-SMART Approvals • Valuation • Estimates
              </p>
              <p className="text-[9.5px] text-slate-500 leading-tight">
                Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 7012383137, 9747995961 | deepak.vasthusilpy@gmail.com
              </p>
            </div>
          </div>

          <div
            className={`text-right px-3 py-1.5 rounded-lg border shrink-0 ${
              isCustomer
                ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                : "bg-rose-50 border-rose-200 text-rose-950"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider block">
              {copyType}
            </span>
            <span className="text-xs font-black text-red-700 block font-mono">
              {receiptNumber}
            </span>
            <span className="text-[9px] text-slate-600 block font-mono">
              DATE: {entryDate}
            </span>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500 font-medium">RECEIPT NO: </span>
              <strong className="font-black text-slate-950 text-xs">{receiptNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ENTRY DATE: </span>
              <strong className="font-bold text-slate-900">{entryDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-medium">ASSIGNED LEAD: </span>
              <strong className="font-bold text-cyan-700">{project.assignee || "DEEPAK"}</strong>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
            STATUS: {project.status || "REGISTERED"}
          </span>
        </div>

        {/* Middle Columns: Left Details + Right QR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
          {/* Left 3 Columns: Client Details, Work Details, Financials */}
          <div className="md:col-span-3 space-y-2.5">
            {/* Client & Work Box */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <div>
                  <span className="text-slate-500 font-medium">Client Name: </span>
                  <strong className="text-slate-950 font-black text-sm">
                    {project.clientName || "Client"}
                  </strong>
                </div>
                <div className="text-slate-700 font-mono">
                  <span className="text-slate-500">Phone: </span>
                  <strong>{project.clientPhone || "+91 9747995961"}</strong>
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500">Location: </span>
                  <span className="font-semibold">{project.location || "Palakkad, Kerala"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-medium">Work / Project: </span>
                <strong className="text-red-700 font-black text-xs">
                  {project.title || "Civil Architectural Work"}
                </strong>
              </div>

              <div className="text-slate-600 text-[11px] leading-relaxed">
                <span className="text-slate-500 font-medium">Work Scope: </span>
                <span>{project.description || "Vasthu planning, 3D architectural drawings & municipal submission."}</span>
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                <span>Subtasks: <strong className="text-slate-800 font-bold">{(project.subTasks || []).filter(s => s.completed).length} of {(project.subTasks || []).length} done</strong></span>
                <span>Target Due: <strong className="text-red-700 font-bold">{project.dueDate || "As Scheduled"}</strong></span>
              </div>
            </div>

            {/* Financial Details with Advance Payment Provision */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/90 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Financial Statement & Advance Payment</span>
                </span>
                {invoice?.invoiceNumber && (
                  <span className="text-[10px] text-cyan-700 font-bold">
                    Invoice #{invoice.invoiceNumber}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <span className="text-[9.5px] text-slate-500 block font-medium">TOTAL BILL</span>
                  <strong className="text-xs font-black text-slate-950 block">
                    ₹{Number(billAmount).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="text-[9.5px] text-emerald-700 block font-bold">ADVANCE PAID</span>
                  <strong className="text-xs font-black text-emerald-700 block">
                    ₹{Number(advanceAmount).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-teal-50 border border-teal-200">
                  <span className="text-[9.5px] text-teal-700 block font-medium">TOTAL PAID</span>
                  <strong className="text-xs font-black text-teal-700 block">
                    ₹{Number(totalPaid).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-[9.5px] text-rose-700 block font-bold">BALANCE DUE</span>
                  <strong className={`text-xs font-black block ${balanceDue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                    {balanceDue <= 0 ? "NIL (PAID)" : `₹${Number(balanceDue).toLocaleString("en-IN")}`}
                  </strong>
                </div>
              </div>

              {advanceAmount > 0 && (
                <div className="text-[10.5px] text-emerald-800 bg-emerald-100/60 p-1.5 rounded-md flex items-center justify-between">
                  <span>Advance Received: <strong>₹{advanceAmount.toLocaleString("en-IN")}</strong> ({project.advancePaymentMode || "Cash/UPI"})</span>
                  {project.advancePaymentDate && <span>Date: {project.advancePaymentDate}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Column: File Tracking QR Code (Clean with no instructions below) */}
          <div className="md:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-white text-center">
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-cyan-600" />
              <span>LIVE TRACKING QR</span>
            </span>
            
            <div className="w-28 h-28 p-1 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="File Tracking QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Footer info line */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
          <span>Official Vasthusilpy Work Receipt & Project Acknowledgement</span>
          <strong className="font-bold text-slate-700">--- {copyType} ---</strong>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm overflow-y-auto font-sans">
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
                <span className="text-xs font-bold text-red-400 bg-red-950/70 border border-red-500/40 px-2.5 py-0.5 rounded-md font-mono">
                  {receiptNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                2 Identical Receipts on Vertical A4 Sheet • Customer Copy & Office Copy • Advance Payment Enabled
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Official Document Format
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Dual Receipt A4 Sheet (Customer + Office Copies)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold font-mono">
                  Same Size • Advance Payment Provision
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generates exactly two receipts one below another on the same size (Customer Copy on top, Office Copy on bottom) separated by a clear scissor cut line.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm disabled:opacity-50 cursor-pointer font-mono"
              >
                <Download className="w-4 h-4" />
                <span>{downloadingPdf ? "Generating PDF..." : "Download 2-in-1 A4 Receipt PDF"}</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* EXACT LIVE PREVIEW: 2 IDENTICAL RECEIPTS (CUSTOMER COPY & OFFICE COPY)    */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                Vertical A4 Document Layout (2 Receipts • One Below Another)
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Receipt No: <strong className="text-slate-900 dark:text-white">{receiptNumber}</strong>
              </span>
            </div>

            {/* Vertical A4 Sheet Container Preview */}
            <div className="mx-auto w-full max-w-3xl bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-300 dark:border-slate-800 p-4 space-y-4">
              
              {/* 1. RECEIPT 1: CUSTOMER COPY (TOP) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-400">
                  <span>RECEIPT #1: TOP HALF</span>
                  <span>CUSTOMER COPY</span>
                </div>
                {renderReceiptSlip("CUSTOMER COPY")}
              </div>

              {/* 2. SCISSOR CUT SEPARATOR LINE IN THE MIDDLE */}
              <div className="py-2.5 px-4 bg-slate-100 dark:bg-slate-950 border-t-2 border-dashed border-slate-400 dark:border-slate-600 relative flex items-center justify-center rounded-lg">
                <div className="absolute left-3 -top-2.5 bg-white dark:bg-slate-900 px-1 text-slate-500 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-slate-600 rotate-90" />
                </div>
                <span className="bg-white dark:bg-slate-900 px-3 text-[10.5px] font-mono font-bold text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                  ✂ CUT HERE (SEPARATE CUSTOMER COPY & OFFICE COPY) ✂
                </span>
                <div className="absolute right-3 -top-2.5 bg-white dark:bg-slate-900 px-1 text-slate-500 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-slate-600 -rotate-90" />
                </div>
              </div>

              {/* 3. RECEIPT 2: OFFICE COPY (BOTTOM, EXACT SAME SIZE) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 text-[11px] font-mono font-bold text-rose-700 dark:text-rose-400">
                  <span>RECEIPT #2: BOTTOM HALF (SAME SIZE)</span>
                  <span>OFFICE COPY</span>
                </div>
                {renderReceiptSlip("OFFICE COPY")}
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition cursor-pointer font-mono"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-sky-600 dark:hover:bg-sky-700 transition font-mono"
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
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sent: {new Date(project.lastEmailedAt).toLocaleDateString("en-IN")}
                </span>
              )}
            </div>

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
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
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Optional Note to Client:
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Work started, advance payment received, site inspection completed..."
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm disabled:opacity-50 cursor-pointer font-mono"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingEmail ? "Preparing..." : "Send Receipt via Email"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
          <span>Vasthusilpy Engineering Records • Dual Work Receipt A4 Sheet</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
