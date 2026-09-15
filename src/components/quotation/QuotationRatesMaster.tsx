import React, { useState, useMemo } from "react";
import { QuotationService } from "../../types";
import { formatINR } from "../../utils/quotationStorageManager";
import {
  Layers,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Info
} from "lucide-react";

interface QuotationRatesMasterProps {
  services: QuotationService[];
  onSaveService: (service: QuotationService) => void;
  onDeleteService: (serviceId: string) => void;
}

export const QuotationRatesMaster: React.FC<QuotationRatesMasterProps> = ({
  services,
  onSaveService,
  onDeleteService
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal for Add/Edit
  const [editingService, setEditingService] = useState<QuotationService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form fields inside modal
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("General Works");
  const [formUnit, setFormUnit] = useState("sq.ft");
  const [formMaterialRate, setFormMaterialRate] = useState<number>(0);
  const [formLabourRate, setFormLabourRate] = useState<number>(0);
  const [formCombinedRate, setFormCombinedRate] = useState<number>(0);
  const [autoCalculateCombined, setAutoCalculateCombined] = useState(true);

  // Deletion confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [services]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormName("");
    setFormCategory("Superstructure");
    setFormUnit("sq.ft");
    setFormMaterialRate(100);
    setFormLabourRate(50);
    setFormCombinedRate(150);
    setAutoCalculateCombined(true);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (srv: QuotationService) => {
    setEditingService(srv);
    setFormName(srv.name);
    setFormCategory(srv.category || "General Works");
    setFormUnit(srv.unit);
    setFormMaterialRate(srv.material_rate);
    setFormLabourRate(srv.labour_rate);
    setFormCombinedRate(srv.combined_rate);
    setAutoCalculateCombined(srv.combined_rate === srv.material_rate + srv.labour_rate);
    setIsModalOpen(true);
  };

  const handleMaterialChange = (val: number) => {
    setFormMaterialRate(val);
    if (autoCalculateCombined) {
      setFormCombinedRate(val + formLabourRate);
    }
  };

  const handleLabourChange = (val: number) => {
    setFormLabourRate(val);
    if (autoCalculateCombined) {
      setFormCombinedRate(formMaterialRate + val);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const todayStr = new Date().toISOString().split("T")[0];
    const srvObj: QuotationService = {
      id: editingService ? editingService.id : `srv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formName.trim(),
      category: formCategory.trim(),
      unit: formUnit.trim(),
      material_rate: Number(formMaterialRate) || 0,
      labour_rate: Number(formLabourRate) || 0,
      combined_rate: Number(formCombinedRate) || (Number(formMaterialRate) || 0) + (Number(formLabourRate) || 0),
      last_updated: todayStr
    };

    onSaveService(srvObj);
    setIsModalOpen(false);
  };

  // Filter services
  const filtered = useMemo(() => {
    return services.filter((s) => {
      const matchSearch =
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.unit.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = categoryFilter === "all" || s.category === categoryFilter;

      return matchSearch && matchCat;
    });
  }, [services, searchTerm, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <div>
          <h2 className="text-xl font-serif font-black tracking-wide text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Service & Rate Master Library
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard Kerala construction unit rates with separate material and labour components
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Service Rate
        </button>
      </div>

      {/* Notice Banner */}
      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="text-slate-200 font-semibold">Snapshot rate rule:</span> Rates modified here will apply to newly prepared quotations. Existing quotations already issued will preserve their locked snapshot rates.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search service by name, specifications, or unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-56 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="all">All Categories ({services.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
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
                <th className="py-3 px-4 min-w-[260px]">Service Name & Work Description</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-3 text-right">Material Rate</th>
                <th className="py-3 px-3 text-right">Labour Rate</th>
                <th className="py-3 px-4 text-right">Combined Rate (₹)</th>
                <th className="py-3 px-3 text-center">Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((srv) => (
                <tr key={srv.id} className="hover:bg-slate-800/30 transition group">
                  <td className="py-3 px-4 font-semibold text-white">
                    {srv.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {srv.category || "General"}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-mono uppercase text-slate-400">
                    {srv.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {formatINR(srv.material_rate)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    {formatINR(srv.labour_rate)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                    {formatINR(srv.combined_rate)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                    {srv.last_updated}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(srv)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Edit Rate"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                      <button
                        onClick={() => setDeletingId(srv.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                        title="Delete Service"
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

      {/* MODAL: Add / Edit Service */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                {editingService ? "Edit Service Rate" : "Add New Service Item"}
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
                  Service Name & Specification <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={'e.g. Solid Concrete Block Masonry 6" (CM 1:6)'}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Superstructure, Roofing..."
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Unit of Measurement</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="sq.ft">sq.ft (Square Feet)</option>
                    <option value="cum">cum (Cubic Metre)</option>
                    <option value="point">point (Electrical/Plumbing)</option>
                    <option value="running ft">running ft (Running Feet)</option>
                    <option value="lump sum">lump sum (LS)</option>
                    <option value="nos">nos (Each)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="sq.m">sq.m (Square Metre)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Material Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formMaterialRate}
                    onChange={(e) => handleMaterialChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-right font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Labour Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formLabourRate}
                    onChange={(e) => handleLabourChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-right font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Combined (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formCombinedRate}
                    onChange={(e) => {
                      setAutoCalculateCombined(false);
                      setFormCombinedRate(parseFloat(e.target.value) || 0);
                    }}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-right font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCalculateCombined}
                    onChange={(e) => {
                      setAutoCalculateCombined(e.target.checked);
                      if (e.target.checked) {
                        setFormCombinedRate(formMaterialRate + formLabourRate);
                      }
                    }}
                    className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-0 bg-slate-950 border-slate-700"
                  />
                  <span>Auto-sum combined rate = Material + Labour</span>
                </label>
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
                Save Rate Item
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-sm font-serif font-bold text-white">Delete Rate Item?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to remove this service from the rate catalog?
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
                  onDeleteService(deletingId);
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
