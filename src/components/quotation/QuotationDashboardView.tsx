import React, { useMemo } from "react";
import { Quotation, QuotationService, Contractor, TermsClause } from "../../types";
import { formatINR, getComputedStatus } from "../../utils/quotationStorageManager";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Layers,
  Calendar,
  Building,
  Printer,
  Edit3
} from "lucide-react";

interface QuotationDashboardViewProps {
  quotations: Quotation[];
  services: QuotationService[];
  contractors: Contractor[];
  termsClauses: TermsClause[];
  onCreateNew: () => void;
  onViewAll: () => void;
  onEditQuotation: (quotation: Quotation) => void;
  onPreviewQuotation: (quotation: Quotation) => void;
  onManageRates: () => void;
}

export const QuotationDashboardView: React.FC<QuotationDashboardViewProps> = ({
  quotations,
  services,
  contractors,
  termsClauses,
  onCreateNew,
  onViewAll,
  onEditQuotation,
  onPreviewQuotation,
  onManageRates
}) => {
  // Compute Stats
  const stats = useMemo(() => {
    let totalCount = quotations.length;
    let pendingCount = 0;
    let pendingValue = 0;
    let approvedMonthValue = 0;
    let expiringIn7DaysCount = 0;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    quotations.forEach((q) => {
      const status = getComputedStatus(q);
      const qDate = new Date(q.date_issued);

      if (status === "pending" || status === "draft") {
        pendingCount++;
        pendingValue += q.total || 0;
      }

      if (
        status === "approved" &&
        qDate.getMonth() === currentMonth &&
        qDate.getFullYear() === currentYear
      ) {
        approvedMonthValue += q.total || 0;
      }

      if (status === "expiring_soon") {
        expiringIn7DaysCount++;
        pendingCount++;
        pendingValue += q.total || 0;
      }
    });

    return {
      totalCount,
      pendingCount,
      pendingValue,
      approvedMonthValue,
      expiringIn7DaysCount
    };
  }, [quotations]);

  // Last 6 months bar chart data
  const monthlyChartData = useMemo(() => {
    const months: { label: string; year: number; month: number; totalValue: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short" });
      months.push({
        label,
        year: d.getFullYear(),
        month: d.getMonth(),
        totalValue: 0
      });
    }

    quotations.forEach((q) => {
      if (!q.date_issued) return;
      const qDate = new Date(q.date_issued);
      const target = months.find(
        (m) => m.year === qDate.getFullYear() && m.month === qDate.getMonth()
      );
      if (target) {
        target.totalValue += q.total || 0;
      }
    });

    const maxValue = Math.max(...months.map((m) => m.totalValue), 100000);
    return { months, maxValue };
  }, [quotations]);

  // Most quoted services
  const mostQuotedServices = useMemo(() => {
    const counts: Record<string, { name: string; count: number; value: number }> = {};

    quotations.forEach((q) => {
      q.line_items.forEach((item) => {
        const key = item.description || "General Work";
        if (!counts[key]) {
          counts[key] = { name: key, count: 0, value: 0 };
        }
        counts[key].count += 1;
        counts[key].value += item.amount || 0;
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [quotations]);

  // Recent 6 quotations
  const recentQuotations = useMemo(() => {
    return [...quotations]
      .sort(
        (a, b) =>
          new Date(b.created_at || b.date_issued).getTime() -
          new Date(a.created_at || a.date_issued).getTime()
      )
      .slice(0, 6);
  }, [quotations]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#181308] border border-amber-500/20 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5" /> Vasthusilpy Keralassery • Quotation Module
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-black tracking-wide text-white">
              Construction Quotation Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Create, manage, and print official client quotations with live material vs. labour breakdowns, dynamic rate lists, and verified contract clauses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn_create_quotation_hero"
              onClick={onCreateNew}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Quotation
            </button>

            <button
              onClick={onManageRates}
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center gap-2 transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              Service & Rates
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotations */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Total Quotations
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-white">
            {stats.totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total estimates & prepared sheets</p>
        </div>

        {/* Pending Approval */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-amber-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              Pending Approval
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-amber-400">
            {stats.pendingCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total Value: <span className="text-slate-200 font-semibold font-mono">{formatINR(stats.pendingValue)}</span>
          </p>
        </div>

        {/* Approved This Month */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Approved This Month
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-emerald-400">
            {formatINR(stats.approvedMonthValue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed client commitments</p>
        </div>

        {/* Expiring in 7 Days */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm hover:border-orange-500/30 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400">
              Expiring in 7 Days
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-black text-orange-400">
            {stats.expiringIn7DaysCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Follow up for rate lock confirmation</p>
        </div>
      </div>

      {/* Grid: 6 Months Chart + Most Quoted Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quoted Value by Month (Bar Chart) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Quotation Pipeline (Last 6 Months)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total quotation value issued to clients in ₹ (INR)
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">
              INR (₹)
            </span>
          </div>

          {/* Simple Custom SVG / CSS Bar Chart */}
          <div className="h-56 flex items-end justify-between gap-4 pt-4 px-2">
            {monthlyChartData.months.map((m, idx) => {
              const heightPercent =
                monthlyChartData.maxValue > 0
                  ? Math.max(Math.round((m.totalValue / monthlyChartData.maxValue) * 100), 8)
                  : 8;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-300 transition opacity-0 group-hover:opacity-100 whitespace-nowrap">
                    {formatINR(m.totalValue)}
                  </span>
                  <div
                    className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-slate-800 to-amber-500/80 group-hover:from-amber-600 group-hover:to-amber-400 transition-all duration-300 shadow-md shadow-amber-500/5 relative"
                    style={{ height: `${heightPercent}%` }}
                  >
                    {m.totalValue > 0 && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-amber-300 rounded-t-lg"></div>
                    )}
                  </div>
                  <span className="text-xs font-mono text-slate-400 group-hover:text-white transition">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Quoted Services */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Most Quoted Services
              </h3>
              <span className="text-xs text-slate-400">Top 5</span>
            </div>

            <div className="space-y-3">
              {mostQuotedServices.length > 0 ? (
                mostQuotedServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-200 truncate">{srv.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Quoted {srv.count} times
                      </p>
                    </div>
                    <span className="font-mono font-bold text-amber-400 shrink-0">
                      {formatINR(srv.value)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No line items quoted yet.
                </div>
              )}
            </div>
          </div>

          <button
            onClick={onManageRates}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>View Full Service & Rate Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Quotations Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              Recent Quotations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest client quotation sheets and estimation drafts
            </p>
          </div>

          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Browse All {quotations.length} Quotations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-3">Quotation No</th>
                <th className="py-3 px-3">Client</th>
                <th className="py-3 px-3">Date Issued</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-right">Grand Total (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentQuotations.map((q) => {
                const status = getComputedStatus(q);

                return (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {q.quotation_no}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-200">{q.client_name}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{q.site_address}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {q.date_issued}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {q.expiry_date}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                      {formatINR(q.total)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === "approved"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : status === "pending"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            : status === "expiring_soon"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                            : status === "expired"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPreviewQuotation(q)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="View & Print A4 Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditQuotation(q)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                          title="Edit Quotation"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
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
    </div>
  );
};
