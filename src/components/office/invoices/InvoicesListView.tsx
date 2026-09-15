import React, { useState } from "react";
import { Invoice, PaymentRecord } from "../../../types";
import {
  Receipt,
  Search,
  Plus,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  Printer,
  MessageSquare,
  Mail,
  Table as TableIcon,
  LayoutGrid,
  Calendar,
  Phone,
  User,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Download
} from "lucide-react";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail, sendInvoiceViaEmailAutomatically, sendInvoiceOrReceiptViaWhatsApp } from "../../../utils/invoiceShareHelper";
import { triggerPrint } from "../../../utils/printHelper";
import { triggerAppNotification } from "../../../context/NotificationContext";
import { generateInvoicePdfBlob } from "../../../utils/invoicePdfGenerator";
import { Loader2, Send as SendIcon, X as CloseIcon } from "lucide-react";

interface InvoicesListViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onOpenNewInvoiceModal: () => void;
  onOpenRecordPaymentModal: (invoice: Invoice, paymentToEdit?: PaymentRecord | null) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onDeletePayment?: (invoiceId: string, paymentId: string) => void;
}

// Categorize every invoice strictly into UNPAID, PARTIALLY PAID, or PAID
export const getInvoiceCategory = (inv: Invoice): "UNPAID" | "PARTIALLY PAID" | "PAID" => {
  if (!inv) return "UNPAID";
  const totalPaid = Number(inv.totalPaid) || 0;
  const grandTotal = Number(inv.grandTotal) || 0;
  const balanceDue = typeof inv.balanceDue === "number" ? inv.balanceDue : Math.max(0, grandTotal - totalPaid);

  if (inv.paymentStatus === "PAID" || (grandTotal > 0 && totalPaid >= grandTotal) || (grandTotal > 0 && balanceDue <= 0)) {
    return "PAID";
  }
  if (inv.paymentStatus === "PARTIALLY PAID" || (totalPaid > 0 && balanceDue > 0)) {
    return "PARTIALLY PAID";
  }
  return "UNPAID";
};

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices,
  onSelectInvoice,
  onOpenNewInvoiceModal,
  onOpenRecordPaymentModal,
  onEditInvoice,
  onDeleteInvoice
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeSubtab, setActiveSubtab] = useState<"ALL" | "UNPAID" | "PARTIALLY PAID" | "PAID">("ALL");
  const [viewMode, setViewMode] = useState<"TABLE" | "GRID">("TABLE");
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [invoiceToEmail, setInvoiceToEmail] = useState<Invoice | null>(null);
  const [emailInput, setEmailInput] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Summary statistics
  const safeInvoices = invoices || [];
  const totalInvoiced = safeInvoices.reduce((sum, inv) => sum + (Number(inv?.grandTotal) || 0), 0);
  const totalCollected = safeInvoices.reduce((sum, inv) => sum + (Number(inv?.totalPaid) || 0), 0);
  const totalOutstanding = safeInvoices.reduce((sum, inv) => sum + (Number(inv?.balanceDue) || 0), 0);

  // Categorized lists
  const unpaidInvoices = safeInvoices.filter((inv) => getInvoiceCategory(inv) === "UNPAID");
  const partialInvoices = safeInvoices.filter((inv) => getInvoiceCategory(inv) === "PARTIALLY PAID");
  const paidInvoices = safeInvoices.filter((inv) => getInvoiceCategory(inv) === "PAID");

  const unpaidTotalDue = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || Number(inv.grandTotal) || 0), 0);
  const partialTotalDue = partialInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);
  const paidTotalCollected = paidInvoices.reduce((sum, inv) => sum + (Number(inv.totalPaid) || Number(inv.grandTotal) || 0), 0);

  const collectionRate = totalInvoiced > 0 ? ((totalCollected / totalInvoiced) * 100).toFixed(1) : "0";

  // Filtered invoices based on subtab + search
  const filteredInvoices = safeInvoices.filter((inv) => {
    if (!inv) return false;
    const category = getInvoiceCategory(inv);
    const matchesSubtab = activeSubtab === "ALL" || category === activeSubtab;
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchLower)) ||
      (inv.applicantName && inv.applicantName.toLowerCase().includes(searchLower)) ||
      (inv.applicantMobile && inv.applicantMobile.includes(searchLower)) ||
      (inv.projectTitle && inv.projectTitle.toLowerCase().includes(searchLower));

    return matchesSubtab && matchesSearch;
  });

  const subtabsConfig = [
    {
      id: "ALL" as const,
      label: "All Invoices",
      shortLabel: "All",
      count: safeInvoices.length,
      amountText: `₹${totalInvoiced.toLocaleString("en-IN")}`,
      caption: "Total Invoiced",
      icon: Receipt,
      activeColor: "border-cyan-500 bg-cyan-950/80 text-cyan-300 shadow-cyan-900/20",
      badgeActive: "bg-cyan-500 text-slate-950 font-black",
      badgeInactive: "bg-slate-800 text-slate-400"
    },
    {
      id: "UNPAID" as const,
      label: "Unpaid",
      shortLabel: "Unpaid",
      count: unpaidInvoices.length,
      amountText: `₹${unpaidTotalDue.toLocaleString("en-IN")}`,
      caption: "Payment Pending",
      icon: AlertCircle,
      activeColor: "border-red-500 bg-red-950/80 text-red-300 shadow-red-900/20",
      badgeActive: "bg-red-500 text-white font-black",
      badgeInactive: "bg-slate-800 text-red-400/80"
    },
    {
      id: "PARTIALLY PAID" as const,
      label: "Partially Paid",
      shortLabel: "Partial",
      count: partialInvoices.length,
      amountText: `₹${partialTotalDue.toLocaleString("en-IN")}`,
      caption: "Balance Due",
      icon: Clock,
      activeColor: "border-amber-500 bg-amber-950/80 text-amber-300 shadow-amber-900/20",
      badgeActive: "bg-amber-500 text-slate-950 font-black",
      badgeInactive: "bg-slate-800 text-amber-400/80"
    },
    {
      id: "PAID" as const,
      label: "Paid",
      shortLabel: "Paid",
      count: paidInvoices.length,
      amountText: `₹${paidTotalCollected.toLocaleString("en-IN")}`,
      caption: "Fully Cleared",
      icon: CheckCircle2,
      activeColor: "border-emerald-500 bg-emerald-950/80 text-emerald-300 shadow-emerald-900/20",
      badgeActive: "bg-emerald-500 text-slate-950 font-black",
      badgeInactive: "bg-slate-800 text-emerald-400/80"
    }
  ];

  const handlePrintInvoice = (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onSelectInvoice(inv);
    setTimeout(() => {
      triggerPrint(
        `Invoice_${inv.invoiceNumber}_${inv.applicantName.replace(/\s+/g, "_")}_A4`,
        "printable-invoice-document",
        { isInvoice: true, pageMargin: "15mm" }
      );
    }, 150);
  };

  const handleDownloadInvoicePdf = async (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const { blob } = await generateInvoicePdfBlob(inv);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${inv.invoiceNumber}_${inv.applicantName.replace(/\s+/g, "_")}_A4.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerAppNotification(
        "INVOICE_GENERATED",
        "A4 PDF Downloaded",
        `Invoice #${inv.invoiceNumber} (A4 Paper • Default Margin) exported to PDF.`,
        { invoiceId: inv.id }
      );
    } catch (err) {
      console.warn("Direct PDF export fallback to print:", err);
      handlePrintInvoice(inv, e);
    }
  };

  const handleWhatsAppSend = async (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await sendInvoiceOrReceiptViaWhatsApp(inv);
    triggerAppNotification(
      "INVOICE_GENERATED",
      "WhatsApp Opened",
      `Invoice #${inv.invoiceNumber} details prepared with attached PDF & payment link for ${inv.applicantName}`,
      { invoiceId: inv.id }
    );
  };

  const handleEmailSend = (inv: Invoice, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInvoiceToEmail(inv);
    setEmailInput(inv.applicantEmail || "");
    setEmailStatusMessage(null);
  };

  const handleSendAutomaticEmailSubmit = async () => {
    if (!invoiceToEmail) return;
    const targetEmail = (emailInput || invoiceToEmail.applicantEmail || "").trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setEmailStatusMessage({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setIsSendingEmail(true);
    setEmailStatusMessage(null);

    try {
      const res = await sendInvoiceViaEmailAutomatically(invoiceToEmail, targetEmail);
      if (res.success) {
        setEmailStatusMessage({
          type: "success",
          text: `Invoice #${invoiceToEmail.invoiceNumber} with attached PDF invoice and Payment QR code successfully sent from deepak.vasthusilpy@gmail.com to ${targetEmail}!`
        });
        triggerAppNotification(
          "INVOICE_GENERATED",
          "Email Sent",
          `Invoice #${invoiceToEmail.invoiceNumber} emailed to ${targetEmail}`,
          { invoiceId: invoiceToEmail.id }
        );
      } else {
        throw new Error(res.error || "Failed to send email.");
      }
    } catch (err: any) {
      setEmailStatusMessage({
        type: "error",
        text: err.message || "Failed to send email. You can still use the standard mail application."
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <button
          type="button"
          onClick={() => setActiveSubtab("ALL")}
          className={`bg-slate-950 border rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden text-left cursor-pointer transition-all ${
            activeSubtab === "ALL" ? "border-cyan-500/80 ring-2 ring-cyan-500/20" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Total Invoiced</span>
              <span className="text-cyan-400">({safeInvoices.length})</span>
            </div>
            <div className="text-2xl font-black font-mono text-white tracking-tight">
              ₹{totalInvoiced.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {paidInvoices.length} Paid • {unpaidInvoices.length + partialInvoices.length} Pending
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </button>

        {/* Total Payments Collected */}
        <button
          type="button"
          onClick={() => setActiveSubtab("PAID")}
          className={`bg-slate-950 border rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden text-left cursor-pointer transition-all ${
            activeSubtab === "PAID" ? "border-emerald-500/80 ring-2 ring-emerald-500/20" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Payments Received</span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-full text-[9px]">
                {collectionRate}%
              </span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
              ₹{totalCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-emerald-400/80 font-mono">
              {paidInvoices.length} Invoices Cleared
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </button>

        {/* Outstanding Balance (Partially Paid) */}
        <button
          type="button"
          onClick={() => setActiveSubtab("PARTIALLY PAID")}
          className={`bg-slate-950 border rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden text-left cursor-pointer transition-all ${
            activeSubtab === "PARTIALLY PAID" ? "border-amber-500/80 ring-2 ring-amber-500/20" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Partially Paid</span>
              <span className="text-amber-300">({partialInvoices.length})</span>
            </div>
            <div className="text-2xl font-black font-mono text-amber-400 tracking-tight">
              ₹{partialTotalDue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Partial Balance Remaining
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-950/80 border border-amber-800/80 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
        </button>

        {/* Unpaid Invoices */}
        <button
          type="button"
          onClick={() => setActiveSubtab("UNPAID")}
          className={`bg-slate-950 border rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden text-left cursor-pointer transition-all ${
            activeSubtab === "UNPAID" ? "border-red-500/80 ring-2 ring-red-500/20" : "border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="space-y-1">
            <div className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Unpaid Invoices</span>
              <span className="text-red-300">({unpaidInvoices.length})</span>
            </div>
            <div className="text-2xl font-black font-mono text-red-400 tracking-tight">
              ₹{unpaidTotalDue.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-red-400/80 font-mono">
              Action Required
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 text-red-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
        </button>
      </div>

      {/* CATEGORIZATION SUBTABS BAR */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2 mb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 tracking-wider">
              Categorised Invoices:
            </span>
            <span className="text-xs font-mono font-black text-cyan-400">
              {filteredInvoices.length} of {safeInvoices.length} showing
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Click subtab to filter • Zero automatic deletion active
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {subtabsConfig.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeSubtab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubtab(tab.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                  isActive
                    ? `${tab.activeColor} shadow-lg ring-1 ring-white/10`
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono font-bold text-xs">
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black transition-colors ${
                      isActive ? tab.badgeActive : tab.badgeInactive
                    }`}
                  >
                    {tab.count}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-1 font-mono">
                  <span className="text-[10px] text-slate-400 font-sans">{tab.caption}</span>
                  <span className={`text-xs font-bold ${isActive ? "text-white" : "text-slate-300"}`}>
                    {tab.amountText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Invoice #, Client Name, Phone, or Project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-sans text-white focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* View Mode Toggle & Create Button */}
        <div className="flex items-center gap-2">
          {/* Table / Grid Switch */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 font-mono ${
                viewMode === "TABLE"
                  ? "bg-slate-800 text-cyan-400 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View (Spreadsheet format)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Table</span>
            </button>

            <button
              onClick={() => setViewMode("GRID")}
              className={`p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 font-mono ${
                viewMode === "GRID"
                  ? "bg-slate-800 text-cyan-400 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Cards</span>
            </button>
          </div>

          {/* Create Invoice Primary Button */}
          <button
            onClick={onOpenNewInvoiceModal}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* INVOICES CONTENT AREA */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-sans">No Invoices Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchTerm || activeSubtab !== "ALL"
                ? "No invoices match the selected subtab or search query. Try switching subtabs or resetting the search."
                : "No tax invoices created yet. Click '+ Create Invoice' to generate your first invoice with automated QR code and client sharing."}
            </p>
          </div>
          {(searchTerm || activeSubtab !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveSubtab("ALL");
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs font-mono font-bold cursor-pointer"
            >
              Reset Filters (View All)
            </button>
          )}
        </div>
      ) : viewMode === "TABLE" ? (
        /* TABLE / SPREADSHEET VIEW */
        <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-800 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice #</th>
                  <th className="p-4">Date / Due</th>
                  <th className="p-4">Client / Project</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4 text-right">Paid</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredInvoices.map((inv) => {
                  const category = getInvoiceCategory(inv);
                  const isPaid = category === "PAID";
                  const isPartial = category === "PARTIALLY PAID";

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-slate-900/60 transition-colors cursor-pointer group"
                    >
                      {/* Invoice Number */}
                      <td className="p-4 pl-6 font-mono font-bold text-cyan-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-xl text-xs group-hover:border-cyan-500 transition-colors">
                            #{inv.invoiceNumber}
                          </span>
                          {inv.lastSentDate && (
                            <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-lg" title={`Last sent: ${inv.lastSentDate}`}>
                              Sent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date / Due */}
                      <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <div className="text-slate-200">{inv.invoiceDate}</div>
                        <div className="text-[10px] text-slate-400">Due: {inv.dueDate}</div>
                      </td>

                      {/* Client / Project */}
                      <td className="p-4">
                        <div className="font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 max-w-[200px]">
                          {inv.applicantName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>📱 {inv.applicantMobile}</span>
                          {inv.projectTitle && (
                            <span className="text-slate-400 truncate max-w-[120px] bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                              📁 {inv.projectTitle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="p-4 text-right font-mono font-bold text-white whitespace-nowrap">
                        ₹{inv.grandTotal.toLocaleString("en-IN")}
                      </td>

                      {/* Paid */}
                      <td className="p-4 text-right font-mono whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-emerald-400">
                            ₹{inv.totalPaid.toLocaleString("en-IN")}
                          </span>
                          {inv.payments && inv.payments.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectInvoice(inv);
                              }}
                              className="text-[10px] text-slate-400 hover:text-emerald-300 underline underline-offset-2 transition-colors cursor-pointer"
                              title="Click to view, edit, or delete payments in invoice workstation"
                            >
                              {inv.payments.length} {inv.payments.length === 1 ? "payment" : "payments"}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Balance Due */}
                      <td className="p-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={inv.balanceDue > 0 ? "text-cyan-400" : "text-emerald-400"}>
                          ₹{inv.balanceDue.toLocaleString("en-IN")}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center whitespace-nowrap font-mono">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider inline-flex items-center gap-1 ${
                            isPaid
                              ? "bg-emerald-950/90 text-emerald-400 border-emerald-800"
                              : isPartial
                              ? "bg-amber-950/90 text-amber-400 border-amber-800"
                              : "bg-red-950/90 text-red-400 border-red-800"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{category}</span>
                        </span>
                      </td>

                      {/* Row Actions */}
                      <td className="p-4 pr-6 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5 font-mono">
                          {/* Record Payment */}
                          <button
                            type="button"
                            onClick={() => onOpenRecordPaymentModal(inv)}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-[11px] shadow-sm cursor-pointer transition-all flex items-center gap-1"
                            title="Record Payment"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Pay</span>
                          </button>

                          {/* Download A4 PDF */}
                          <button
                            type="button"
                            onClick={(e) => handleDownloadInvoicePdf(inv, e)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded-xl border border-slate-800 cursor-pointer transition-colors"
                            title="Download A4 PDF (Default Margins)"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Print Invoice */}
                          <button
                            type="button"
                            onClick={(e) => handlePrintInvoice(inv, e)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 cursor-pointer transition-colors"
                            title="Print A4 Invoice (Default Margins)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Send */}
                          <button
                            type="button"
                            onClick={(e) => handleWhatsAppSend(inv, e)}
                            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 rounded-xl border border-emerald-800/80 cursor-pointer transition-colors"
                            title="Send via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Email Send */}
                          <button
                            type="button"
                            onClick={(e) => handleEmailSend(inv, e)}
                            className="p-1.5 bg-blue-950/60 hover:bg-blue-900 text-blue-400 rounded-xl border border-blue-800/80 cursor-pointer transition-colors"
                            title="Send via Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Invoice */}
                          <button
                            type="button"
                            onClick={() => onEditInvoice(inv)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 cursor-pointer transition-colors"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Invoice */}
                          <button
                            type="button"
                            onClick={() => setInvoiceToDelete(inv)}
                            className="p-1.5 bg-red-950/50 hover:bg-red-900 text-red-300 rounded-xl border border-red-800/60 cursor-pointer transition-colors"
                            title="Delete Invoice"
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
      ) : (
        /* GRID / CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredInvoices.map((inv) => {
            const category = getInvoiceCategory(inv);
            const isPaid = category === "PAID";
            const isPartial = category === "PARTIALLY PAID";

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice(inv)}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar: Invoice # & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-xl">
                      #{inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider ${
                        isPaid
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : isPartial
                          ? "bg-amber-950 text-amber-400 border-amber-800"
                          : "bg-red-950 text-red-400 border-red-800"
                      }`}
                    >
                      ● {category}
                    </span>
                  </div>

                  {/* Applicant Details */}
                  <div>
                    <h3 className="text-sm font-black text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {inv.applicantName}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>📱 {inv.applicantMobile}</span>
                    </div>
                  </div>

                  {/* Linked Project Title */}
                  {inv.projectTitle && (
                    <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2 text-[11px] font-sans text-slate-300 line-clamp-1">
                      📁 <strong className="text-slate-200">{inv.projectTitle}</strong>
                    </div>
                  )}

                  {/* Pricing Breakdown Grid */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 grid grid-cols-2 gap-2 text-center font-mono">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">Grand Total</div>
                      <div className="text-xs font-bold text-white">₹{inv.grandTotal.toLocaleString("en-IN")}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase">
                        {isPaid ? "Paid" : "Balance Due"}
                      </div>
                      <div className={`text-xs font-black ${isPaid ? "text-emerald-400" : "text-cyan-400"}`}>
                        ₹{(isPaid ? inv.totalPaid : inv.balanceDue).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <div className="text-[10px] text-slate-400">
                    Date: {inv.invoiceDate}
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Record Payment */}
                    <button
                      type="button"
                      onClick={() => onOpenRecordPaymentModal(inv)}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-[10px] shadow-sm cursor-pointer transition-all flex items-center gap-1"
                      title="Record Payment"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Pay</span>
                    </button>

                    {/* Download A4 PDF */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadInvoicePdf(inv, e)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-xl border border-slate-800 cursor-pointer"
                      title="Download A4 PDF (Default Margins)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Print */}
                    <button
                      type="button"
                      onClick={(e) => handlePrintInvoice(inv, e)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer"
                      title="Print A4 Invoice (Default Margins)"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={(e) => handleWhatsAppSend(inv, e)}
                      className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-400 rounded-xl border border-emerald-800/80 cursor-pointer"
                      title="Send WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Email */}
                    <button
                      type="button"
                      onClick={(e) => handleEmailSend(inv, e)}
                      className="p-1.5 bg-blue-950/60 hover:bg-blue-900 text-blue-400 rounded-xl border border-blue-800/80 cursor-pointer"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => onEditInvoice(inv)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 cursor-pointer"
                      title="Edit Invoice"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setInvoiceToDelete(inv)}
                      className="p-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-xl border border-red-800/60 cursor-pointer transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Email Dispatcher Modal */}
      {invoiceToEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white font-mono">
                    Send Invoice #{invoiceToEmail.invoiceNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans">
                    Auto-send from <span className="text-blue-400 font-mono">deepak.vasthusilpy@gmail.com</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceToEmail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl text-xs space-y-2 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Client Name:</span>
                <strong className="text-white">{invoiceToEmail.applicantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Balance Due:</span>
                <strong className="text-amber-400 font-mono">
                  ₹{(typeof invoiceToEmail.balanceDue === "number" && invoiceToEmail.balanceDue > 0
                    ? invoiceToEmail.balanceDue
                    : invoiceToEmail.grandTotal || 0).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed">
                Includes: 💳 <strong>Payment Link</strong> • 📲 <strong>Dynamic QR Code</strong> • 📎 <strong>PDF Invoice Attachment</strong>
              </div>
            </div>

            {emailStatusMessage && (
              <div
                className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                  emailStatusMessage.type === "success"
                    ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                    : "bg-red-950/40 border-red-800 text-red-300"
                }`}
              >
                {emailStatusMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-relaxed">{emailStatusMessage.text}</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase">
                Client Email Address:
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setInvoiceToEmail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer font-bold transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSendingEmail}
                onClick={handleSendAutomaticEmailSubmit}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 cursor-pointer transition-all flex items-center gap-1.5"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <SendIcon className="w-3.5 h-3.5" />
                    <span>Send via Gmail</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider">
                Delete Invoice?
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Are you sure you want to permanently delete Invoice <strong className="text-white">#{invoiceToDelete.invoiceNumber}</strong> for client <strong className="text-cyan-400">{invoiceToDelete.applicantName}</strong>?
              </p>
              <p className="text-[11px] text-red-400 font-mono font-semibold">
                This will remove all associated payment logs for this invoice.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteInvoice(invoiceToDelete.id);
                  setInvoiceToDelete(null);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-600/30 cursor-pointer transition-colors"
              >
                Yes, Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
