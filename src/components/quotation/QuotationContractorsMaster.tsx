import React, { useState, useMemo } from "react";
import { Contractor, Quotation } from "../../types";
import {
  Users,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Phone,
  Building,
  Mail,
  Filter,
  Shield,
  X,
  FileText
} from "lucide-react";

interface QuotationContractorsMasterProps {
  contractors: Contractor[];
  quotations: Quotation[];
  onSaveContractor: (contractor: Contractor) => void;
  onDeleteContractor: (contractorId: string) => void;
}

export const QuotationContractorsMaster: React.FC<QuotationContractorsMasterProps> = ({
  contractors,
  quotations,
  onSaveContractor,
  onDeleteContractor
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tradeFilter, setTradeFilter] = useState("all");

  // Modal State
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formTrade, setFormTrade] = useState("Masonry / Structure");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Deletion confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute how many quotes each contractor is assigned to
  const contractorUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    quotations.forEach((q) => {
      q.contractor_ids?.forEach((cId) => {
        map[cId] = (map[cId] || 0) + 1;
      });
    });
    return map;
  }, [quotations]);

  // Unique trades list
  const trades = useMemo(() => {
    const set = new Set<string>();
    contractors.forEach((c) => {
      if (c.trade) set.add(c.trade);
    });
    return Array.from(set).sort();
  }, [contractors]);

  const handleOpenCreate = () => {
    setEditingContractor(null);
    setFormName("");
    setFormCompany("");
    setFormTrade("Masonry / Structure");
    setFormPhone("");
    setFormEmail("");
    setFormNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Contractor) => {
    setEditingContractor(c);
    setFormName(c.name);
    setFormCompany(c.company_name || "");
    setFormTrade(c.trade);
    setFormPhone(c.phone);
    setFormEmail(c.email || "");
    setFormNotes(c.notes || "");
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const obj: Contractor = {
      id: editingContractor ? editingContractor.id : `cntr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formName.trim(),
      company_name: formCompany.trim() || undefined,
      trade: formTrade.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      notes: formNotes.trim() || undefined,
      created_at: editingContractor?.created_at || todayStr
    };

    onSaveContractor(obj);
    setIsModalOpen(false);
  };

  const filtered = useMemo(() => {
    return contractors.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        c.name.toLowerCase().includes(q) ||
        (c.company_name && c.company_name.toLowerCase().includes(q)) ||
        c.trade.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q);

      const matchTrade = tradeFilter === "all" || c.trade === tradeFilter;

      return matchSearch && matchTrade;
    });
  }, [contractors, searchTerm, tradeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <div>
          <h2 className="text-xl font-serif font-black tracking-wide text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Contractors & Execution Specialists
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Master contact list of site subcontractors, tradesmen, and technicians across Kerala
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Add Contractor / Tradesman
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by contractor name, firm, trade, or mobile number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={tradeFilter}
            onChange={(e) => setTradeFilter(e.target.value)}
            className="w-full md:w-56 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Trades ({contractors.length})</option>
            {trades.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Contractor Name</th>
                <th className="py-3 px-4">Company / Firm</th>
                <th className="py-3 px-3">Trade / Specialty</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Notes & Capabilities</th>
                <th className="py-3 px-3 text-center">Assigned Quotes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition group">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {c.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {c.company_name || "—"}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                      {c.trade}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {c.phone}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-[240px] truncate">
                    {c.notes || "—"}
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {contractorUsageMap[c.id] || 0}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Edit Contractor"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                      <button
                        onClick={() => setDeletingId(c.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Delete Contractor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit Contractor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                {editingContractor ? "Edit Contractor" : "Add New Contractor"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Contractor / Specialist Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh K."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Trade / Specialty</label>
                  <select
                    value={formTrade}
                    onChange={(e) => setFormTrade(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing & Sanitary">Plumbing & Sanitary</option>
                    <option value="Masonry / Structure">Masonry / Structure</option>
                    <option value="Carpentry / Joinery">Carpentry / Joinery</option>
                    <option value="Flooring & Tile">Flooring & Tile</option>
                    <option value="Painting & Polish">Painting & Polish</option>
                    <option value="Fabrication / Metal">Fabrication / Metal</option>
                    <option value="Landscaping">Landscaping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Electricals"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone / WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 94471 23456"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="contractor@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Specialties & Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Specializes in 3-phase DB wiring, smart switches..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Save Contractor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-sm font-serif font-bold text-white">Delete Contractor Record?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to remove this contractor from the directory? Existing quotations where they are assigned will preserve their history.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteContractor(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
