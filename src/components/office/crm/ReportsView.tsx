import React, { useState } from "react";
import { Invoice, CrmProject } from "../../../types";
import { useLanguage } from "../../../context/LanguageContext";
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Mail,
  Download,
  TrendingUp,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  PieChart,
  X
} from "lucide-react";

interface ReportsViewProps {
  invoices: Invoice[];
  projects: CrmProject[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ invoices, projects }) => {
  const { t } = useLanguage();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Calculate Metrics
  const safeInvoices = invoices || [];
  const totalBilled = safeInvoices.reduce((sum, inv) => sum + (inv?.grandTotal || 0), 0);
  const totalCollected = safeInvoices.reduce((sum, inv) => sum + (inv?.totalPaid || 0), 0);
  const totalOutstanding = safeInvoices.reduce((sum, inv) => sum + (inv?.balanceDue || 0), 0);

  const totalInvoicesCount = safeInvoices.length;
  const paidInvoicesCount = safeInvoices.filter((inv) => inv?.paymentStatus === "PAID").length;
  const unpaidInvoicesCount = safeInvoices.filter((inv) => inv?.paymentStatus !== "PAID").length;

  // Breakdown of line items across all invoices to find top selling services
  const itemMap: Record<string, { count: number; totalAmount: number }> = {};
  safeInvoices.forEach((inv) => {
    (inv?.items || []).forEach((item) => {
      const name = item?.description || "General Fee";
      if (!itemMap[name]) {
        itemMap[name] = { count: 0, totalAmount: 0 };
      }
      itemMap[name].count += item?.quantity || 1;
      itemMap[name].totalAmount += item?.amount || 0;
    });
  });

  const topSellingServices = Object.entries(itemMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Trigger Print / Export to PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // Trigger Share via Email
  const handleShareEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    const subject = encodeURIComponent("Vasthusilpy Financial & Sales Report");
    const bodyText = `VASTHUSILPY TECHNICAL SYSTEM - SALES & TRANSACTIONS REPORT\n
--------------------------------------------------
Total Invoices Billed: ₹${totalBilled.toLocaleString("en-IN")}
Total Payments Collected: ₹${totalCollected.toLocaleString("en-IN")}
Outstanding Balance Due: ₹${totalOutstanding.toLocaleString("en-IN")}

Invoices Summary:
- Total Invoices: ${totalInvoicesCount}
- Fully Paid: ${paidInvoicesCount}
- Outstanding / Unpaid: ${unpaidInvoicesCount}

Generated via Vasthusilpy Technical System (Keralassery, Palakkad)
`;

    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`);
    setIsEmailModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Controls */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl print:hidden">
        <div>
          <h2 className="text-lg font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>{t("sales_transactions_report", "Sales & Transactions Report")}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Automated financial analytics, billing trends, and export summary
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            <span>{t("share_email", "Share via Email")}</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>{t("export_pdf", "Export to PDF")}</span>
          </button>
        </div>
      </div>

      {/* Report Canvas Content (Clean Printable Layout) */}
      <div className="space-y-6 print:text-black">
        {/* Print Brand Header (Shown during PDF Export / Printing) */}
        <div className="hidden print:block text-center border-b border-slate-300 pb-4 mb-6">
          <h1 className="text-xl font-black uppercase">VASTHUSILPY TECHNICAL SYSTEM</h1>
          <p className="text-sm text-slate-600 font-mono">
            KERALASSERY, PALAKKAD • KPBR 2019/2026 • SURVEY & VASTU
          </p>
          <h2 className="text-base font-bold uppercase mt-2">SALES & TRANSACTIONS REPORT</h2>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>{t("total_revenue", "Total Revenue Billed")}</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              ₹{totalBilled.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Across {totalInvoicesCount} invoices</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>{t("total_collected", "Total Paid / Collected")}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ₹{totalCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Recorded transactions</div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>{t("balance_outstanding", "Outstanding Balance")}</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">Pending collections</div>
          </div>
        </div>

        {/* Invoice Status Distribution & Top Selling Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Counts */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase font-mono flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Invoices Status Breakdown</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-slate-300">{t("total_invoices", "Total Invoices Created")}</span>
                <span className="font-bold text-white text-sm">{totalInvoicesCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-emerald-400">{t("paid_invoices", "Fully Paid Invoices")}</span>
                <span className="font-bold text-emerald-400 text-sm">{paidInvoicesCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
                <span className="text-amber-400">{t("unpaid_invoices", "Unpaid / Pending Invoices")}</span>
                <span className="font-bold text-amber-400 text-sm">{unpaidInvoicesCount}</span>
              </div>
            </div>
          </div>

          {/* Top Selling Services Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase font-mono flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>{t("top_services", "Top Selling Services")}</span>
            </h3>

            <div className="space-y-2 font-mono text-xs max-h-56 overflow-y-auto pr-1">
              {topSellingServices.length === 0 ? (
                <div className="text-slate-500 text-center py-6">No sales data recorded yet.</div>
              ) : (
                topSellingServices.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-900/40 rounded-xl border border-slate-800/80"
                  >
                    <div className="truncate flex-1 pr-2">
                      <span className="text-slate-200 font-bold block truncate">{svc.name}</span>
                      <span className="text-[10px] text-slate-500">Qty Billed: {svc.count}</span>
                    </div>
                    <span className="font-bold text-emerald-400 shrink-0">
                      ₹{svc.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Transactions List Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-white uppercase font-mono">
            Transaction Invoices Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="p-3">Bill #</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Grand Total</th>
                  <th className="p-3 text-right">Paid Amount</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-bold text-cyan-400">#{inv.invoiceNumber}</td>
                    <td className="p-3 font-bold text-slate-200">{inv.applicantName}</td>
                    <td className="p-3 text-slate-400">{inv.invoiceDate}</td>
                    <td className="p-3 text-right font-bold text-slate-200">
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-400">
                      ₹{inv.totalPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right font-bold text-amber-400">
                      ₹{inv.balanceDue.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.paymentStatus === "PAID"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Share via Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                <span>Share Report via Email</span>
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleShareEmail} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. client@gmail.com or admin@vasthusilpy.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Mail</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
