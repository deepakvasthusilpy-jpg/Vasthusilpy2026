import React, { useState, useMemo } from "react";
import { Quotation, QuotationStatus } from "../../types";
import { formatINR, getComputedStatus } from "../../utils/quotationStorageManager";
import {
  Search,
  Filter,
  Printer,
  Edit3,
  Trash2,
  Copy,
  PlusCircle,
  Calendar,
  AlertCircle,
  FileText,
  AlertTriangle,
  X,
  ArrowUpDown
} from "lucide-react";

interface QuotationListViewProps {
  quotations: Quotation[];
  onCreateNew: () => void;
  onEdit: (quotation: Quotation) => void;
  onPreview: (quotation: Quotation) => void;
  onDelete: (quotationId: string) => void;
  onDuplicate: (quotation: Quotation) => void;
}

export const QuotationListView: React.FC<QuotationListViewProps> = ({
  quotations,
  onCreateNew,
  onEdit,
  onPreview,
  onDelete,
  onDuplicate
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "amount_desc" | "expiry">("date_desc");

  // Deletion modal state
  const [deletingQuotation, setDeletingQuotation] = useState<Quotation | null>(null);

  // Filtered and sorted quotations
  const filteredQuotations = useMemo(() => {
    let list = [...quotations];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (item) =>
          item.quotation_no.toLowerCase().includes(q) ||
          item.client_name.toLowerCase().includes(q) ||
          (item.client_phone && item.client_phone.toLowerCase().includes(q)) ||
          (item.site_address && item.site_address.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter((item) => {
        const computed = getComputedStatus(item);
        if (statusFilter === "expiring_soon") return computed === "expiring_soon";
        if (statusFilter === "expired") return computed === "expired";
        return computed === statusFilter || item.status === statusFilter;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "date_desc") {
        return new Date(b.date_issued).getTime() - new Date(a.date_issued).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.date_issued).getTime() - new Date(b.date_issued).getTime();
      }
      if (sortBy === "amount_desc") {
        return (b.total || 0) - (a.total || 0);
      }
      if (sortBy === "expiry") {
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
      }
      return 0;
    });

    return list;
  }, [quotations, searchTerm, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <div>
          <h2 className="text-xl font-serif font-black tracking-wide text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            All Quotations Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {quotations.length} records • Real-time status tracking & A4 architectural printing
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Quotation
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quotation no, client name, phone, or site address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved & Confirmed</option>
            <option value="expiring_soon">Expiring Soon (≤ 7 days)</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full md:w-44 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="date_desc">Newest Date First</option>
            <option value="date_asc">Oldest Date First</option>
            <option value="amount_desc">Highest Amount First</option>
            <option value="expiry">Expiry Date</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Quotation No</th>
                <th className="py-3 px-4">Client & Contact</th>
                <th className="py-3 px-4">Site Location</th>
                <th className="py-3 px-3">Date Issued</th>
                <th className="py-3 px-3">Valid Until</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((q) => {
                  const status = getComputedStatus(q);

                  return (
                    <tr key={q.id} className="hover:bg-slate-800/30 transition group">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {q.quotation_no}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{q.client_name}</p>
                        {q.client_phone && (
                          <p className="text-[11px] text-slate-400 font-mono">{q.client_phone}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">
                        {q.site_address || "—"}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                        {q.date_issued}
                      </td>
                      <td className="py-3.5 px-3 font-mono whitespace-nowrap">
                        <span
                          className={
                            status === "expiring_soon"
                              ? "text-orange-400 font-bold"
                              : status === "expired"
                              ? "text-rose-400"
                              : "text-slate-400"
                          }
                        >
                          {q.expiry_date}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-100">
                        {formatINR(q.total)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPreview(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                            title="View & Print A4 Sheet"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => onEdit(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                            title="Edit Quotation"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicate(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer"
                            title="Duplicate Quotation"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingQuotation(q)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete Quotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No quotations found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HARD DELETE CONFIRMATION MODAL */}
      {deletingQuotation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white">
                  Delete Quotation?
                </h3>
                <p className="text-xs text-rose-400 font-mono">
                  {deletingQuotation.quotation_no} • {deletingQuotation.client_name}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this quotation sheet? This action cannot be undone and will remove all associated line items and estimates.
            </p>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingQuotation(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (deletingQuotation) {
                    onDelete(deletingQuotation.id);
                    setDeletingQuotation(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                Confirm Hard Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
