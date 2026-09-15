import React, { useState, useMemo, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  CreditCard,
  QrCode,
  IndianRupee,
  ChevronRight,
  Filter,
  Printer,
  MessageCircle,
  Trash2,
  Edit3,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Building2,
  Phone,
  Layers,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  Check,
  Copy,
  X,
  SlidersHorizontal,
  FileSpreadsheet
} from "lucide-react";
import { Invoice, PaymentRecord } from "../../../types";
import { numberToIndianWords } from "../../../data/estimateData";
import { triggerPrint } from "../../../utils/printHelper";
import { InvoiceQrCode } from "../invoices/InvoiceQrCode";

interface ClientPaymentHistoryViewProps {
  invoices: Invoice[];
  onRecordPayment: (
    invoiceId: string,
    payment: Omit<PaymentRecord, "id" | "createdAt">
  ) => void;
  onUpdateInvoiceStatus: (
    invoiceId: string,
    newStatus: "UNPAID" | "PARTIALLY PAID" | "PAID",
    notes?: string
  ) => void;
  onDeletePayment: (invoiceId: string, paymentId: string) => void;
}

export const ClientPaymentHistoryView: React.FC<ClientPaymentHistoryViewProps> = ({
  invoices,
  onRecordPayment,
  onUpdateInvoiceStatus,
  onDeletePayment
}) => {
  // Tab inside Payment History
  const [activeLedgerTab, setActiveLedgerTab] = useState<
    "TRANSACTIONS" | "CLIENT_BREAKDOWN" | "STATUS_MANAGER"
  >("TRANSACTIONS");

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [invoiceFilter, setInvoiceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(
    invoices[0] || null
  );

  // Status Update Modal State
  const [statusUpdateInvoice, setStatusUpdateInvoice] = useState<Invoice | null>(null);
  const [newStatusValue, setNewStatusValue] = useState<"UNPAID" | "PARTIALLY PAID" | "PAID">("PAID");
  const [statusChangeNotes, setStatusChangeNotes] = useState<string>("");

  // In-app deletion and status confirmations (eliminating window.confirm)
  const [paymentToDelete, setPaymentToDelete] = useState<{ invoiceId: string; payment: PaymentRecord } | null>(null);
  const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<Invoice | null>(null);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<{
    invoice: Invoice;
    payment: PaymentRecord;
  } | null>(null);

  const [copiedReceiptId, setCopiedReceiptId] = useState<string | null>(null);

  // Flatten all payment records across all invoices with invoice context
  interface EnrichedPaymentRecord extends PaymentRecord {
    invoiceId: string;
    invoiceNumber: string;
    applicantName: string;
    applicantMobile: string;
    projectTitle?: string;
    invoiceGrandTotal: number;
    invoiceBalanceDue: number;
    invoicePaymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID";
  }

  const allPayments = useMemo(() => {
    const list: EnrichedPaymentRecord[] = [];
    invoices.forEach((inv) => {
      if (inv.payments && Array.isArray(inv.payments)) {
        inv.payments.forEach((pay) => {
          list.push({
            ...pay,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            applicantName: inv.applicantName,
            applicantMobile: inv.applicantMobile,
            projectTitle: inv.projectTitle,
            invoiceGrandTotal: inv.grandTotal,
            invoiceBalanceDue: inv.balanceDue,
            invoicePaymentStatus: inv.paymentStatus
          });
        });
      }
    });

    // Sort latest first
    return list.sort(
      (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
    );
  }, [invoices]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      const matchSearch =
        p.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.paymentMode && p.paymentMode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (invoiceFilter !== "ALL" && p.invoiceId !== invoiceFilter) return false;

      if (modeFilter !== "ALL") {
        if (modeFilter === "UPI" && !p.paymentMode.toUpperCase().includes("UPI") && p.method !== "UPI_QR") {
          return false;
        }
        if (modeFilter === "CASH" && !p.paymentMode.toUpperCase().includes("CASH")) {
          return false;
        }
        if (
          modeFilter === "BANK" &&
          !p.paymentMode.toUpperCase().includes("BANK") &&
          !p.paymentMode.toUpperCase().includes("NEFT") &&
          !p.paymentMode.toUpperCase().includes("RTGS")
        ) {
          return false;
        }
        if (modeFilter === "CHEQUE" && !p.paymentMode.toUpperCase().includes("CHEQUE")) {
          return false;
        }
      }

      if (statusFilter !== "ALL" && p.invoicePaymentStatus !== statusFilter) return false;

      return true;
    });
  }, [allPayments, searchTerm, invoiceFilter, modeFilter, statusFilter]);

  // Calculations
  const totalInvoiced = useMemo(() => invoices.reduce((acc, c) => acc + c.grandTotal, 0), [invoices]);
  const totalCollected = useMemo(() => invoices.reduce((acc, c) => acc + c.totalPaid, 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.reduce((acc, c) => acc + c.balanceDue, 0), [invoices]);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;
  const fullyPaidCount = invoices.filter((i) => i.paymentStatus === "PAID").length;
  const partialCount = invoices.filter((i) => i.paymentStatus === "PARTIALLY PAID").length;
  const unpaidCount = invoices.filter((i) => i.paymentStatus === "UNPAID").length;

  // Handlers
  const handleOpenLogModal = (inv?: Invoice) => {
    setSelectedInvoiceForPayment(inv || invoices[0] || null);
    setIsLogModalOpen(true);
  };

  const handleOpenStatusModal = (inv: Invoice) => {
    setStatusUpdateInvoice(inv);
    setNewStatusValue(inv.paymentStatus);
    setStatusChangeNotes("");
  };

  const handleSaveStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateInvoice) return;
    onUpdateInvoiceStatus(statusUpdateInvoice.id, newStatusValue, statusChangeNotes);
    setStatusUpdateInvoice(null);
  };

  const handleShareReceiptWhatsApp = (invoice: Invoice, payment: PaymentRecord) => {
    const text = encodeURIComponent(
      `*VASTHUSILPY - PAYMENT RECEIPT (Payment Acknowledgement)*\n` +
      `Dear ${invoice.applicantName},\n\n` +
      `Payment has been successfully received towards invoice #${invoice.invoiceNumber}:\n\n` +
      `💰 *Amount Received:* ₹${payment.amount.toLocaleString("en-IN")}\n` +
      `📅 *Date:* ${payment.date}\n` +
      `💳 *Payment Mode:* ${payment.paymentMode}\n` +
      (payment.referenceNo ? `🔢 *Ref/UTR No:* ${payment.referenceNo}\n` : "") +
      (payment.notes ? `📝 *Notes:* ${payment.notes}\n` : "") +
      `\n` +
      `📊 *Project Financial Status:*\n` +
      `• Total Billed: ₹${invoice.grandTotal.toLocaleString("en-IN")}\n` +
      `• Total Paid: ₹${invoice.totalPaid.toLocaleString("en-IN")}\n` +
      `• Balance Due: ₹${invoice.balanceDue.toLocaleString("en-IN")}\n\n` +
      `🔗 View Live Invoice & Receipt: ${window.location.origin}/?invoice_share=${invoice.id || invoice.invoiceNumber}\n\n` +
      `Vasthusilpy Architectural & Engineering - Keralassery\n📞 +91 70123 83137`
    );
    window.open(`https://api.whatsapp.com/send?phone=91${invoice.applicantMobile}&text=${text}`, "_blank");
  };

  const handleCopyReceiptText = (invoice: Invoice, payment: PaymentRecord) => {
    const text =
      `VASTHUSILPY PAYMENT RECEIPT\n` +
      `Receipt Ref: ${payment.referenceNo || payment.id}\n` +
      `Invoice #: ${invoice.invoiceNumber}\n` +
      `Client: ${invoice.applicantName}\n` +
      `Amount Paid: ₹${payment.amount.toLocaleString("en-IN")}\n` +
      `Date: ${payment.date}\n` +
      `Payment Mode: ${payment.paymentMode}\n` +
      `Remaining Balance: ₹${invoice.balanceDue.toLocaleString("en-IN")}\n` +
      `Vasthusilpy Keralassery (+91 70123 83137)`;
    navigator.clipboard.writeText(text);
    setCopiedReceiptId(payment.id);
    setTimeout(() => setCopiedReceiptId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP BANNER & COMPREHENSIVE PAYMENT KPIs */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                PAYMENT HISTORY & PARTIAL PAYMENTS LEDGER
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight">
              Payment History & Partial Payments Ledger
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Track client installment collections, automate remaining balance computations, and manage invoice status lifecycles.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => handleOpenLogModal()}
              className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Log Partial Payment</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-slate-500 block">Total Collected (Paid)</span>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                ₹{totalCollected.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 font-bold">
                {collectionRate}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-slate-500 block">Outstanding Balance</span>
            <div className="flex items-center justify-between">
              <span
                className={`text-lg sm:text-xl font-bold font-mono ${
                  totalOutstanding > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                ₹{totalOutstanding.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-slate-400">DUE</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Across {unpaidCount + partialCount} pending invoices
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-slate-500 block">Total Logged Transactions</span>
            <div className="flex items-center justify-between">
              <span className="text-lg sm:text-xl font-bold text-cyan-400 font-mono">
                {allPayments.length}
              </span>
              <Receipt className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-500">
              Across {invoices.length} Client Invoices
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
            <span className="text-slate-500 block">Invoice Status Split</span>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                {fullyPaidCount} Paid
              </span>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800">
                {partialCount} Part
              </span>
              <span className="text-[11px] font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800">
                {unpaidCount} Unpaid
              </span>
            </div>
            <div className="text-[10px] text-slate-500">Active accounts</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-NAVIGATION TABS (TRANSACTIONS vs CLIENT BREAKDOWN vs STATUS MANAGER) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveLedgerTab("TRANSACTIONS")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeLedgerTab === "TRANSACTIONS"
              ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>1. Master Transactions Ledger</span>
          <span className="text-[10px] bg-slate-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
            {filteredPayments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveLedgerTab("CLIENT_BREAKDOWN")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeLedgerTab === "CLIENT_BREAKDOWN"
              ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2. Client Installment Tracker</span>
          <span className="text-[10px] bg-slate-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
            {invoices.length} Clients
          </span>
        </button>

        <button
          onClick={() => setActiveLedgerTab("STATUS_MANAGER")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeLedgerTab === "STATUS_MANAGER"
              ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>3. Status Manager</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH AND FILTER TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by client, invoice #, UTR, mode, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Payment Modes</option>
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="CASH">Cash Payment</option>
            <option value="BANK">Bank Transfer (NEFT/RTGS)</option>
            <option value="CHEQUE">Cheque / DD</option>
          </select>

          <select
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[200px] truncate"
          >
            <option value="ALL">All Clients / Invoices</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                #{inv.invoiceNumber} - {inv.applicantName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Invoice Statuses</option>
            <option value="PAID">Paid in Full</option>
            <option value="PARTIALLY PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {(searchTerm || modeFilter !== "ALL" || invoiceFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setModeFilter("ALL");
                setInvoiceFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={() => handleOpenLogModal()}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MASTER TRANSACTIONS LEDGER TABLE */}
      {/* ========================================================================= */}
      {activeLedgerTab === "TRANSACTIONS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <span>Payment Transactions Ledger</span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                {filteredPayments.length} Records
              </span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Click on receipt to view official voucher
            </span>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-300">No Transactions Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No payment records match the selected filters or none have been logged yet.
                </p>
              </div>
              <button
                onClick={() => handleOpenLogModal()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono rounded-xl cursor-pointer"
              >
                + Log First Payment
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Invoice & Client</th>
                      <th className="p-3.5">Payment Mode</th>
                      <th className="p-3.5">Ref / UTR No.</th>
                      <th className="p-3.5">Notes / Purpose</th>
                      <th className="p-3.5 text-right">Amount Paid (₹)</th>
                      <th className="p-3.5 text-center">Receipt & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    {filteredPayments.map((p) => {
                      const parentInvoice = invoices.find((inv) => inv.id === p.invoiceId);
                      const isUpi =
                        p.paymentMode.toUpperCase().includes("UPI") || p.method === "UPI_QR";
                      const isCash = p.paymentMode.toUpperCase().includes("CASH");
                      const isBank =
                        p.paymentMode.toUpperCase().includes("BANK") ||
                        p.paymentMode.toUpperCase().includes("NEFT");

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Date */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-white">{p.date}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(p.createdAt || p.date).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </td>

                          {/* Invoice & Client */}
                          <td className="p-3.5">
                            <div className="font-bold text-white font-sans text-sm">
                              {p.applicantName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono mt-0.5">
                              <span>#{p.invoiceNumber}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 truncate max-w-[160px]">
                                {p.projectTitle || "Architecture & Plan"}
                              </span>
                            </div>
                          </td>

                          {/* Payment Mode */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                isUpi
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                  : isCash
                                  ? "bg-amber-950 text-amber-300 border-amber-800"
                                  : isBank
                                  ? "bg-cyan-950 text-cyan-300 border-cyan-800"
                                  : "bg-purple-950 text-purple-300 border-purple-800"
                              }`}
                            >
                              {isUpi && <QrCode className="w-3 h-3 text-emerald-400" />}
                              {isCash && <IndianRupee className="w-3 h-3 text-amber-400" />}
                              {isBank && <Building2 className="w-3 h-3 text-cyan-400" />}
                              <span>{p.paymentMode}</span>
                            </span>
                          </td>

                          {/* Ref / UTR */}
                          <td className="p-3.5 font-mono text-[11px]">
                            {p.referenceNo ? (
                              <span className="bg-slate-950 text-slate-300 px-2 py-1 rounded-md border border-slate-800 font-bold">
                                {p.referenceNo}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">Direct Entry</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="p-3.5 text-slate-400 text-xs max-w-[200px] truncate">
                            {p.notes || <span className="text-slate-600 italic">No notes</span>}
                          </td>

                          {/* Amount */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="text-base font-black text-emerald-400 font-mono">
                              +₹{p.amount.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Bal: ₹{p.invoiceBalanceDue.toLocaleString("en-IN")}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {parentInvoice && (
                                <>
                                  <button
                                    onClick={() =>
                                      setActiveReceipt({ invoice: parentInvoice, payment: p })
                                    }
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="View & Print Official Receipt"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span className="text-[11px]">Receipt</span>
                                  </button>

                                  <button
                                    onClick={() => handleShareReceiptWhatsApp(parentInvoice, p)}
                                    className="p-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-lg transition-colors cursor-pointer"
                                    title="Share Receipt on WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setPaymentToDelete({ invoiceId: p.invoiceId, payment: p })}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Rollback / Delete this payment"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLIENT-BY-CLIENT INSTALLMENT TRACKER */}
      {/* ========================================================================= */}
      {activeLedgerTab === "CLIENT_BREAKDOWN" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <span>Client Installments Summary</span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                {invoices.length} Clients
              </span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Manage installments and balances per client
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => {
              const paidPercent =
                inv.grandTotal > 0 ? Math.min(100, Math.round((inv.totalPaid / inv.grandTotal) * 100)) : 0;
              const paymentsCount = inv.payments?.length || 0;

              return (
                <div
                  key={inv.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 transition-all shadow-lg"
                >
                  {/* Client Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white font-sans text-base">
                          {inv.applicantName}
                        </h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            inv.paymentStatus === "PAID"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : inv.paymentStatus === "PARTIALLY PAID"
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : "bg-rose-950 text-rose-300 border-rose-800"
                          }`}
                        >
                          ● {inv.paymentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        #{inv.invoiceNumber} • {inv.projectTitle || "Architecture Consultation"}
                      </p>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Mob: {inv.applicantMobile}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenStatusModal(inv)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                      title="Update invoice payment status"
                    >
                      <Edit3 className="w-3 h-3 text-cyan-400" />
                      <span>Status</span>
                    </button>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="space-y-1.5 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Paid: {paidPercent}%</span>
                      <span className="text-slate-400">
                        ₹{inv.totalPaid.toLocaleString("en-IN")} / ₹{inv.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          paidPercent >= 100
                            ? "bg-emerald-500"
                            : paidPercent > 0
                            ? "bg-gradient-to-r from-amber-500 to-emerald-500"
                            : "bg-slate-700"
                        }`}
                        style={{ width: `${paidPercent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono pt-1">
                      <span className="text-emerald-400 font-bold">
                        Collected: ₹{inv.totalPaid.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`font-bold ${
                          inv.balanceDue > 0 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        Balance Due: ₹{inv.balanceDue.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* List of Logged Installments */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-1">
                      <span>Recorded Installments ({paymentsCount}):</span>
                      <button
                        onClick={() => handleOpenLogModal(inv)}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Log Next Installment</span>
                      </button>
                    </div>

                    {paymentsCount === 0 ? (
                      <div className="text-[11px] text-slate-500 italic py-1">
                        No payments recorded yet for this invoice.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {inv.payments.map((p) => (
                          <div
                            key={p.id}
                            className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 text-[11px] font-mono"
                          >
                            <div>
                              <span className="font-bold text-white">
                                ₹{p.amount.toLocaleString("en-IN")}
                              </span>
                              <span className="text-slate-400"> • {p.paymentMode}</span>
                              <span className="text-slate-500"> ({p.date})</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setActiveReceipt({ invoice: inv, payment: p })}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-md transition-colors"
                                title="View Receipt"
                              >
                                <Printer className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleShareReceiptWhatsApp(inv, p)}
                                className="p-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-md transition-colors"
                                title="WhatsApp Receipt"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <a
                      href={`/?invoice_share=${inv.id || inv.invoiceNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Zero-Login Public Portal</span>
                    </a>

                    <button
                      onClick={() => handleOpenLogModal(inv)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Payment</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICE STATUS MANAGER */}
      {/* ========================================================================= */}
      {activeLedgerTab === "STATUS_MANAGER" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <span>Invoice Payment Status Manager</span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                {invoices.length} Invoices
              </span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Quickly update or override payment status
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Client Name</th>
                    <th className="p-3.5 text-right">Grand Total</th>
                    <th className="p-3.5 text-right">Total Paid</th>
                    <th className="p-3.5 text-right">Balance Due</th>
                    <th className="p-3.5 text-center">Current Status</th>
                    <th className="p-3.5 text-center">Quick Change Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-emerald-400">#{inv.invoiceNumber}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white font-sans text-sm">{inv.applicantName}</div>
                        <div className="text-[10px] text-slate-500">{inv.applicantMobile}</div>
                      </td>
                      <td className="p-3.5 text-right font-bold text-white">
                        ₹{inv.grandTotal.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        ₹{inv.totalPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-400">
                        ₹{inv.balanceDue.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                            inv.paymentStatus === "PAID"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : inv.paymentStatus === "PARTIALLY PAID"
                              ? "bg-amber-950 text-amber-300 border-amber-800"
                              : "bg-rose-950 text-rose-300 border-rose-800"
                          }`}
                        >
                          ● {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenStatusModal(inv)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Change Status</span>
                          </button>

                          {inv.paymentStatus !== "PAID" && (
                            <button
                              onClick={() => setInvoiceToMarkPaid(inv)}
                              className="px-2.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
                              title="Mark Full Paid"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: LOG PARTIAL PAYMENT MODAL */}
      {/* ========================================================================= */}
      {isLogModalOpen && selectedInvoiceForPayment && (
        <LogPartialPaymentModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          invoices={invoices}
          selectedInvoice={selectedInvoiceForPayment}
          onSelectInvoice={(inv) => setSelectedInvoiceForPayment(inv)}
          onRecordPayment={(invId, pay) => {
            onRecordPayment(invId, pay);
            setIsLogModalOpen(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: STATUS UPDATE MODAL */}
      {/* ========================================================================= */}
      {statusUpdateInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-md border border-cyan-800">
                  INVOICE #{statusUpdateInvoice.invoiceNumber}
                </span>
                <h3 className="text-lg font-black text-white mt-1 font-sans">
                  Update Payment Status
                </h3>
                <p className="text-xs text-slate-400">
                  Client: <strong className="text-slate-200">{statusUpdateInvoice.applicantName}</strong>
                </p>
              </div>
              <button
                onClick={() => setStatusUpdateInvoice(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatusUpdate} className="space-y-4 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Grand Total:</span>
                  <span className="text-white font-bold">
                    ₹{statusUpdateInvoice.grandTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Paid So Far:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{statusUpdateInvoice.totalPaid.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Balance Due:</span>
                  <span className="text-rose-400 font-bold">
                    ₹{statusUpdateInvoice.balanceDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Select New Status:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["UNPAID", "PARTIALLY PAID", "PAID"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatusValue(st)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        newStatusValue === st
                          ? st === "PAID"
                            ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black"
                            : st === "PARTIALLY PAID"
                            ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black"
                            : "bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/20 font-black"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Audit Remarks / Reason:</label>
                <textarea
                  value={statusChangeNotes}
                  onChange={(e) => setStatusChangeNotes(e.target.value)}
                  placeholder="e.g. Paid in full via cash at office / Discount approved / Verified with bank..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusUpdateInvoice(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFICIAL DIGITAL PAYMENT RECEIPT MODAL */}
      {/* ========================================================================= */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 text-slate-100 my-8">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  OFFICIAL PAYMENT RECEIPT & ACKNOWLEDGEMENT
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    triggerPrint(
                      `Receipt_${activeReceipt.invoice.invoiceNumber}_${activeReceipt.payment.id}`,
                      "printable-payment-receipt"
                    )
                  }
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={() =>
                    handleShareReceiptWhatsApp(activeReceipt.invoice, activeReceipt.payment)
                  }
                  className="px-3.5 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={() =>
                    handleCopyReceiptText(activeReceipt.invoice, activeReceipt.payment)
                  }
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="Copy receipt details"
                >
                  {copiedReceiptId === activeReceipt.payment.id ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Container */}
            <div
              id="printable-payment-receipt"
              className="bg-white text-slate-900 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl font-sans border border-slate-200"
            >
              {/* Receipt Letterhead */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-5">
                <div>
                  <div className="text-xl font-black text-slate-900 tracking-tight">
                    VASTHUSILPY
                  </div>
                  <div className="text-xs text-teal-800 font-bold uppercase tracking-wider mt-0.5">
                    Architectural & Valuation Services • Keralassery
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-1 space-y-0.5">
                    <div>Palakkad, Kerala • PIN: 678641</div>
                    <div>Phone: +91 70123 83137 • Email: deepak.vasthusilpy@gmail.com</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                    OFFICIAL PAYMENT RECEIPT
                  </div>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    #{activeReceipt.payment.referenceNo || activeReceipt.payment.id}
                  </div>
                  <div className="text-xs font-mono text-slate-600 mt-1">
                    Receipt Date: <strong>{activeReceipt.payment.date}</strong>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[11px] font-mono font-bold">
                      ✓ PAYMENT RECEIVED
                    </span>
                  </div>
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">
                    Received From:
                  </span>
                  <div className="text-sm font-bold text-slate-900 font-sans mt-0.5">
                    {activeReceipt.invoice.applicantName}
                  </div>
                  <div className="text-slate-600">Mob: {activeReceipt.invoice.applicantMobile}</div>
                  {activeReceipt.invoice.applicantAddress && (
                    <div className="text-slate-600 mt-0.5">{activeReceipt.invoice.applicantAddress}</div>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 block uppercase text-[10px] font-bold">
                    Account & Invoice Reference:
                  </span>
                  <div className="text-xs font-bold text-teal-800 mt-0.5">
                    Invoice #{activeReceipt.invoice.invoiceNumber}
                  </div>
                  <div className="text-slate-600 truncate">
                    {activeReceipt.invoice.projectTitle || "Architecture & Plan Consultation"}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Payment Mode: <strong>{activeReceipt.payment.paymentMode}</strong>
                  </div>
                </div>
              </div>

              {/* Amount Highlight Box */}
              <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase block">
                    Amount Received:
                  </span>
                  <div className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                    ₹{activeReceipt.payment.amount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs font-serif italic text-emerald-950 mt-1">
                    (Rupees {numberToIndianWords(activeReceipt.payment.amount)} Only)
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-600 bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                  <div>
                    Invoice Grand Total:{" "}
                    <strong>₹{activeReceipt.invoice.grandTotal.toLocaleString("en-IN")}</strong>
                  </div>
                  <div>
                    Total Paid to Date:{" "}
                    <strong className="text-emerald-700">
                      ₹{activeReceipt.invoice.totalPaid.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="pt-1 border-t border-slate-200 font-bold">
                    Balance Due:{" "}
                    <span
                      className={
                        activeReceipt.invoice.balanceDue > 0 ? "text-rose-700" : "text-emerald-700"
                      }
                    >
                      ₹{activeReceipt.invoice.balanceDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {activeReceipt.payment.notes && (
                <div className="text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="font-mono font-bold text-slate-600">Notes / Remarks: </span>
                  <span className="text-slate-800">{activeReceipt.payment.notes}</span>
                </div>
              )}

              {/* Signatory & Security Seal */}
              <div className="pt-4 border-t-2 border-slate-300 flex flex-wrap items-end justify-between gap-4 text-xs font-mono text-slate-600">
                <div>
                  <div className="font-bold text-slate-900">VASTHUSILPY ENGINEERING & VALUATION</div>
                  <div className="text-[11px] text-slate-500">
                    Digital Verification ID: #{activeReceipt.payment.id} • SHA-256
                  </div>
                  <div className="text-[11px] text-emerald-800 font-bold">
                    Er. Deepak & Technical Team
                  </div>
                </div>

                <div className="text-right">
                  <div className="w-36 h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1 text-[10px] text-slate-400">
                    Authorized Signatory
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Vasthusilpy Official Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP PAYMENT DELETION MODAL */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white font-sans">
                Delete Payment Record?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Remove payment of <strong className="text-emerald-400 font-mono">₹{paymentToDelete.payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> logged on <span className="text-white font-mono">{paymentToDelete.payment.date}</span>?
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Invoice balance due will be automatically recalculated.
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
                  onDeletePayment(paymentToDelete.invoiceId, paymentToDelete.payment.id);
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

      {/* IN-APP MARK FULL PAID MODAL */}
      {invoiceToMarkPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-white font-sans">
                Mark Invoice as Full Paid?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Mark Invoice #{invoiceToMarkPaid.invoiceNumber} for <strong>{invoiceToMarkPaid.applicantName}</strong> as fully PAID? Remaining balance <strong className="text-emerald-400 font-mono">₹{invoiceToMarkPaid.balanceDue.toLocaleString("en-IN")}</strong> will be settled.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceToMarkPaid(null)}
                className="px-4 py-2 border border-slate-700 text-slate-300 font-semibold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateInvoiceStatus(invoiceToMarkPaid.id, "PAID", "Marked as PAID via Status Manager");
                  setInvoiceToMarkPaid(null);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
              >
                Confirm Full Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: LOG PARTIAL PAYMENT MODAL
// =========================================================================
interface LogPartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  selectedInvoice: Invoice;
  onSelectInvoice: (invoice: Invoice) => void;
  onRecordPayment: (
    invoiceId: string,
    payment: Omit<PaymentRecord, "id" | "createdAt">
  ) => void;
}

const LogPartialPaymentModal: React.FC<LogPartialPaymentModalProps> = ({
  isOpen,
  onClose,
  invoices,
  selectedInvoice,
  onSelectInvoice,
  onRecordPayment
}) => {
  const [activeTab, setActiveTab] = useState<"MANUAL" | "UPI_QR">("MANUAL");
  const [amount, setAmount] = useState<number>(() =>
    selectedInvoice ? (selectedInvoice.balanceDue > 0 ? selectedInvoice.balanceDue : selectedInvoice.grandTotal) : 0
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState<string>("UPI / GPay / PhonePe");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (selectedInvoice && isOpen) {
      setAmount(selectedInvoice.balanceDue > 0 ? selectedInvoice.balanceDue : selectedInvoice.grandTotal);
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setReferenceNo("");
      setNotes("");
      setError("");
    }
  }, [selectedInvoice, isOpen]);

  if (!isOpen || !selectedInvoice) return null;

  // Quick percentage presets based on current balance
  const remainingBalance = selectedInvoice.balanceDue > 0 ? selectedInvoice.balanceDue : selectedInvoice.grandTotal;

  const handleSelectPreset = (percent: number) => {
    const val = Math.round((remainingBalance * percent) / 100);
    setAmount(val > 0 ? val : remainingBalance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    const finalMode =
      activeTab === "UPI_QR" ? "UPI QR (7012383137@okbizaxis)" : paymentMode;

    onRecordPayment(selectedInvoice.id, {
      amount: Number(amount),
      date: paymentDate,
      method: activeTab,
      paymentMode: finalMode,
      referenceNo: referenceNo.trim() || undefined,
      notes: notes.trim() || undefined
    });
  };

  // Preview calculations
  const previewNewPaid = selectedInvoice.totalPaid + Number(amount || 0);
  const previewNewBalance = Math.max(0, selectedInvoice.grandTotal - previewNewPaid);
  const previewNewStatus = previewNewBalance === 0 ? "PAID" : "PARTIALLY PAID";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-slate-100 my-8">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-md border border-emerald-800">
                + LOG PARTIAL PAYMENT
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                  selectedInvoice.paymentStatus === "PAID"
                    ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                    : selectedInvoice.paymentStatus === "PARTIALLY PAID"
                    ? "bg-amber-950 text-amber-400 border-amber-800"
                    : "bg-rose-950 text-rose-400 border-rose-800"
                }`}
              >
                ● {selectedInvoice.paymentStatus}
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-1 font-sans">
              Record Client Payment / Installment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Picker */}
        <div className="space-y-1.5 font-mono text-xs">
          <label className="block text-slate-300 font-bold">Select Client & Invoice:</label>
          <select
            value={selectedInvoice.id}
            onChange={(e) => {
              const found = invoices.find((i) => i.id === e.target.value);
              if (found) {
                onSelectInvoice(found);
                setAmount(found.balanceDue > 0 ? found.balanceDue : found.grandTotal);
              }
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                #{inv.invoiceNumber} - {inv.applicantName} (Due: ₹{inv.balanceDue.toLocaleString("en-IN")})
              </option>
            ))}
          </select>
        </div>

        {/* Financial Summary Strip */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Grand Total</div>
            <div className="text-sm font-bold text-slate-200">
              ₹{selectedInvoice.grandTotal.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Already Paid</div>
            <div className="text-sm font-bold text-emerald-400">
              ₹{selectedInvoice.totalPaid.toLocaleString("en-IN")}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Balance Due</div>
            <div className="text-sm font-black text-cyan-400">
              ₹{selectedInvoice.balanceDue.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Payment Entry Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          {/* Method selector */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("MANUAL")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "MANUAL"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>MANUAL ENTRY</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("UPI_QR")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeTab === "UPI_QR"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI QR SCANNER</span>
            </button>
          </div>

          {/* Amount Field + Quick Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold">Payment Amount (₹):</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectPreset(25)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(50)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset(100)}
                  className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold"
                >
                  Full Due
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                min="1"
                max={selectedInvoice.grandTotal}
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="Enter partial or full payment amount..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Payment Mode & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeTab === "MANUAL" ? (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Payment Mode:</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="UPI / GPay / PhonePe">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Cash">Cash (Office Cash)</option>
                  <option value="Direct Bank Transfer (NEFT/RTGS/IMPS)">
                    Direct Bank Transfer (NEFT/RTGS)
                  </option>
                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                  <option value="Debit / Credit Card">Debit / Credit Card</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">UPI Recipient ID:</label>
                <input
                  type="text"
                  readOnly
                  value="7012383137@okbizaxis"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-cyan-400 font-bold"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">Payment Date:</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Reference No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">Ref / UTR / Cheque No (Optional):</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. UTR-49201928, CHQ-8812"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold">Notes / Description:</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Stage 2 foundation installment"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Post-Payment Preview Strip */}
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-500 block">After this payment:</span>
              <span className="text-white font-bold">
                Total Paid: ₹{previewNewPaid.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Remaining Due:</span>
              <span className="text-rose-400 font-bold">
                ₹{previewNewBalance.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">New Status:</span>
              <span
                className={`font-bold ${
                  previewNewStatus === "PAID" ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                ● {previewNewStatus}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-950 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs">
              ⚠️ {error}
            </div>
          )}

          {/* Submit / Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Save Payment & Update Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
