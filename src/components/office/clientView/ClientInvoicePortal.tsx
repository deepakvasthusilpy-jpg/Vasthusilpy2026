import React, { useState, useEffect } from "react";
import { Invoice } from "../../../types";
import { INITIAL_INVOICES } from "../../../data/crmData";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { InvoiceQrCode } from "../invoices/InvoiceQrCode";
import {
  Printer,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  Download,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Clock,
  FileText,
  QrCode
} from "lucide-react";
import { triggerPrint } from "../../../utils/printHelper";
import { generateInvoicePdfBlob } from "../../../utils/invoicePdfGenerator";

interface ClientInvoicePortalProps {
  invoiceId?: string;
  invoiceNumber?: string;
  onGoToLogin?: () => void;
}

export const ClientInvoicePortal: React.FC<ClientInvoicePortalProps> = ({
  invoiceId,
  invoiceNumber,
  onGoToLogin
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(() => {
    // 1. Check localStorage first
    try {
      const saved = localStorage.getItem("vasthusilpy_invoices");
      if (saved) {
        const parsed: Invoice[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const match = parsed.find(
            (inv) =>
              inv.id === invoiceId ||
              inv.invoiceNumber === invoiceId ||
              inv.id === invoiceNumber ||
              inv.invoiceNumber === invoiceNumber
          );
          if (match) return match;
        }
      }
    } catch (e) {
      console.error("Error reading invoices from localStorage", e);
    }

    // 2. Check initial invoices
    const initialMatch = INITIAL_INVOICES.find(
      (inv) =>
        inv.id === invoiceId ||
        inv.invoiceNumber === invoiceId ||
        inv.id === invoiceNumber ||
        inv.invoiceNumber === invoiceNumber
    );
    if (initialMatch) return initialMatch;

    return null;
  });

  const [loading, setLoading] = useState<boolean>(!invoice);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Fetch latest from Firestore if not resolved or to ensure up-to-date payment status
  useEffect(() => {
    let isMounted = true;

    const fetchRemoteInvoice = async () => {
      const searchKey = invoiceId || invoiceNumber;
      if (!searchKey) return;

      try {
        // Try direct doc lookup
        const docRef = doc(db, "invoices", searchKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setInvoice(docSnap.data() as Invoice);
          setLoading(false);
          return;
        }

        // Try searching all invoices in collection
        const colSnap = await getDocs(collection(db, "invoices"));
        if (!colSnap.empty && isMounted) {
          let found: Invoice | null = null;
          colSnap.forEach((d) => {
            const data = d.data() as Invoice;
            if (
              data.id === searchKey ||
              data.invoiceNumber === searchKey ||
              data.projectId === searchKey
            ) {
              found = data;
            }
          });

          if (found) {
            setInvoice(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Error fetching invoice from Firestore:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRemoteInvoice();

    return () => {
      isMounted = false;
    };
  }, [invoiceId, invoiceNumber]);

  const handlePrint = () => {
    if (!invoice) return;
    triggerPrint(`Invoice_${invoice.invoiceNumber}_Vasthusilpy_A4`, "printable-invoice-document", { isInvoice: true, pageMargin: "15mm" });
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
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
    } catch (e) {
      console.warn("Direct PDF generation fallback to print:", e);
      handlePrint();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `Hello Vasthusilpy Team, I am inquiring regarding Invoice #${invoice?.invoiceNumber || ""} (${invoice?.applicantName || ""}).`
    );
    window.open(`https://api.whatsapp.com/send?phone=917012383137&text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-400">Loading authentic invoice portal...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-sans">Invoice Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md font-sans">
          The invoice link you accessed is invalid or may have expired. Please contact the office helpline for assistance.
        </p>
        <button
          onClick={handleWhatsAppContact}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Contact Vasthusilpy Helpline</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-lg print:hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black font-mono">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black font-sans text-white tracking-wide uppercase">
                  VASTHUSILPY CLIENT INVOICE & PAYMENT PORTAL
                </span>
                <span className="text-[10px] font-mono font-black bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  NO SIGN-IN REQUIRED • DIRECT CLIENT VIEW
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Official Digital Invoice & Receipt • Keralassery, Palakkad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy shareable invoice link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{copiedLink ? "Link Copied" : "Copy Link"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleWhatsAppContact}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-mono font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Office Helpline</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        {/* Status Bar Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">Invoice:</span>
              <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800">
                #{invoice.invoiceNumber}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-sans text-slate-300 font-bold">
                {invoice.applicantName}
              </span>
              <span className="text-slate-600">•</span>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  invoice.paymentStatus === "PAID"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : invoice.paymentStatus === "PARTIALLY PAID"
                    ? "bg-amber-950 text-amber-300 border-amber-800"
                    : "bg-rose-950 text-rose-300 border-rose-800"
                }`}
              >
                ● {invoice.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {invoice.paymentStatus === "PAID"
                ? "This invoice has been fully settled and an official payment receipt has been issued."
                : `Remaining balance due: ₹${invoice.balanceDue.toLocaleString("en-IN")}. Scan the UPI QR code below to pay instantly.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Grand Total</div>
              <div className="text-xl font-black text-emerald-400">
                ₹{invoice.grandTotal.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL A4 PAPER INVOICE DOCUMENT (STANDARD A4 WITH DEFAULT 15MM MARGIN) */}
        {/* ========================================================================= */}
        <div className="w-full flex flex-col items-center justify-center py-2 px-1 sm:px-2 bg-slate-950/40 rounded-3xl border border-slate-800/80 overflow-x-auto print:bg-transparent print:p-0 print:border-none print:overflow-visible">
          {/* A4 Paper Specs Indicator Strip (Screen Only) */}
          <div className="w-full max-w-[210mm] flex flex-wrap items-center justify-between px-2 pb-2.5 text-xs text-slate-400 font-mono print:hidden gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-200">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>A4 Paper (210mm × 297mm) • Default Page Margin (15mm)</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-full">
                Strict A4 Layout
              </span>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Download A4 PDF"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Download A4 PDF</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="Print A4"
              >
                <Printer className="w-3 h-3" />
                <span>Print A4</span>
              </button>
            </div>
          </div>

          <div
            id="printable-invoice-document"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-black rounded-none shadow-2xl p-[8mm] sm:p-[10mm] space-y-2.5 font-sans border border-slate-300 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full print:min-h-0 print:m-0 mx-auto box-border"
          >
          {/* Top Document Corporate Header - Side by Side Office & Tax Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start border-b-2 border-black pb-2.5">
            {/* Office Details (Left) */}
            <div className="md:col-span-7 space-y-0.5">
              <div className="flex flex-wrap items-baseline gap-2">
                <div className="text-2xl font-black text-black tracking-tight font-sans uppercase leading-none">
                  VASTHUSILPY
                </div>
                <span className="text-[10px] font-mono font-bold bg-neutral-100 text-black px-1.5 py-0.5 rounded border border-black uppercase tracking-tight">
                  KPBR & KMBR Regd. Engineer • Valuer
                </span>
              </div>
              <div className="text-[10px] font-black text-black uppercase tracking-wider font-mono">
                Architectural • Engineering • Survey • Valuation
              </div>
              <div className="text-[11px] text-black font-semibold leading-tight font-sans space-y-0.5 pt-0.5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-black shrink-0" />
                  <span>Keralassery, Palakkad District, Kerala - 678641</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-[10.5px]">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-black shrink-0" />
                    <span className="font-mono">+91 70123 83137 / +91 97479 95961</span>
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
                  INVOICE & RECEIPT
                </span>
                <span className="inline-block text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase border border-black bg-white text-black tracking-wider">
                  {invoice.paymentStatus}
                </span>
              </div>
              <div className="w-full max-w-[240px] bg-neutral-50 border border-black rounded-lg p-1.5 text-[11px] font-mono text-black space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-semibold">Invoice No:</span>
                  <strong className="font-black text-black">#{invoice.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-semibold">Date of Issue:</span>
                  <strong className="font-black text-black">{invoice.invoiceDate}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600 font-semibold">Due Date:</span>
                  <strong className="font-black text-black">{invoice.dueDate}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To Client & Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-3 bg-white border border-black rounded-lg p-2.5 text-xs text-black">
            <div className="md:col-span-7 print:col-span-7 space-y-0.5">
              <div className="text-[10px] font-mono font-black text-black uppercase tracking-widest border-b border-black pb-0.5 mb-1">
                Billed To (Client / Applicant)
              </div>
              <div className="text-sm font-black text-black font-sans leading-snug">{invoice.applicantName}</div>
              <div className="flex flex-wrap items-center gap-2 text-black font-bold font-mono text-[11px] pt-0.5">
                <span>Mobile: +91 {invoice.applicantMobile}</span>
                {invoice.applicantEmail && <span>• Email: {invoice.applicantEmail}</span>}
              </div>
              {invoice.applicantAddress && (
                <div className="text-black font-medium text-[11px] leading-tight font-sans pt-0.5">
                  {invoice.applicantAddress}
                </div>
              )}
            </div>

            <div className="md:col-span-5 print:col-span-5 md:border-l md:border-black md:pl-3 print:border-l print:border-black print:pl-3 space-y-0.5 font-mono">
              <div className="text-[10px] font-mono font-black text-black uppercase tracking-widest border-b border-black pb-0.5 mb-1">
                Project & Reference
              </div>
              {invoice.projectTitle ? (
                <>
                  <div className="text-xs font-black text-black line-clamp-1">{invoice.projectTitle}</div>
                  <div className="text-black font-bold font-mono text-[11px]">
                    Ref Project ID: #{invoice.projectId}
                  </div>
                </>
              ) : (
                <div className="text-black font-semibold text-[11px]">Professional Engineering Consultation & Valuation</div>
              )}
              <div className="text-[10px] text-neutral-600 font-semibold pt-0.5">
                LSGD / KSMART Kerala Jurisdiction
              </div>
            </div>
          </div>

          {/* Itemized Services / Products Breakdown Table */}
          <div className="overflow-x-auto border-2 border-black rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-100 text-black border-b-2 border-black font-mono uppercase text-[11px] font-black">
                  <th className="py-1.5 px-2.5 text-center w-10 border-r border-black">#</th>
                  <th className="py-1.5 px-2.5 border-r border-black">Item & Service Description</th>
                  <th className="py-1.5 px-2.5 text-center w-20 border-r border-black">Qty</th>
                  <th className="py-1.5 px-2.5 text-center w-20 border-r border-black">Unit</th>
                  <th className="py-1.5 px-2.5 text-right w-28 border-r border-black">Rate (₹)</th>
                  <th className="py-1.5 px-2.5 text-right w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-sans text-black">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="bg-white">
                    <td className="py-1.5 px-2.5 font-mono font-bold text-black text-center border-r border-black text-[11px]">{index + 1}</td>
                    <td className="py-1.5 px-2.5 font-bold text-black border-r border-black text-xs leading-snug">{item.description}</td>
                    <td className="py-1.5 px-2.5 text-center font-mono font-semibold text-black border-r border-black text-xs">{item.quantity}</td>
                    <td className="py-1.5 px-2.5 text-center font-mono font-semibold text-black border-r border-black text-xs">{item.unit}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-semibold text-black border-r border-black text-xs">₹{item.rate.toLocaleString("en-IN")}</td>
                    <td className="py-1.5 px-2.5 text-right font-mono font-black text-black text-xs">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes Summary */}
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

              {invoice.notes && (
                <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-2 text-[10px] font-sans text-black">
                  <div className="font-bold font-mono text-[9.5px] uppercase text-neutral-600 mb-0.5">Special Note:</div>
                  <div className="whitespace-pre-line leading-relaxed text-black font-medium">{invoice.notes}</div>
                </div>
              )}
            </div>

            {/* Bottom Right: Financial Breakdown (No signature / seal) */}
            <div className="md:col-span-5 print:col-span-5 space-y-1.5 font-mono text-xs bg-white p-2.5 rounded-lg border border-black text-black">
              <div className="flex justify-between text-black font-semibold text-xs">
                <span>Subtotal:</span>
                <span>₹{invoice.subTotal.toLocaleString("en-IN")}</span>
              </div>

              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-black font-semibold text-xs">
                  <span>Tax ({invoice.taxRate}%):</span>
                  <span>+₹{invoice.taxAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {invoice.discount > 0 && (
                <div className="flex justify-between text-black font-semibold text-xs">
                  <span>Discount:</span>
                  <span className="text-rose-700">-₹{invoice.discount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between text-black font-black text-sm pt-1 border-t border-black">
                <span>Grand Total:</span>
                <span>₹{invoice.grandTotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-black font-semibold text-xs pt-0.5">
                <span>Total Paid:</span>
                <span className="text-emerald-700 font-bold">₹{invoice.totalPaid.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between text-black font-black pt-1 border-t border-black text-sm">
                <span>Balance Due:</span>
                <span>
                  ₹{invoice.balanceDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Receipts History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="border-t-2 border-black pt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-black" />
                <span className="text-xs font-mono font-black text-black uppercase tracking-wider">
                  Official Payment Transactions History ({invoice.payments.length})
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                {invoice.payments.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-black p-2 rounded-lg flex flex-wrap items-center justify-between gap-2 text-black"
                  >
                    <div>
                      <span className="font-black text-black text-xs">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-black font-bold text-xs"> • {p.paymentMode}</span>
                      <span className="text-black font-medium text-[10.5px]"> (Date: {p.date})</span>
                    </div>

                    {p.referenceNo && (
                      <div className="text-[10px] text-black font-mono font-bold bg-neutral-100 px-2 py-0.5 rounded border border-black">
                        Ref/UTR: #{p.referenceNo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
      </main>
    </div>
  );
};
