import React, { useState, useEffect } from "react";
import { RateItem } from "../../../types";
import {
  loadRateItems,
  addOrUpdateRateItem,
  safeDeleteRateItem
} from "../../../utils/storageManager";
import { useLanguage } from "../../../context/LanguageContext";
import {
  Plus,
  Edit3,
  Trash2,
  Tag,
  Search,
  Check,
  X,
  Box,
  AlertTriangle
} from "lucide-react";

export const ProductsServicesView: React.FC = () => {
  const { t } = useLanguage();

  const [rateItems, setRateItems] = useState<RateItem[]>(() => loadRateItems());
  const [itemToDelete, setItemToDelete] = useState<RateItem | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setRateItems(loadRateItems());
    };
    window.addEventListener("vasthusilpy_rate_items_updated", handleSync);
    window.addEventListener("vasthusilpy_storage_update", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("vasthusilpy_rate_items_updated", handleSync);
      window.removeEventListener("vasthusilpy_storage_update", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RateItem | null>(null);

  const [formData, setFormData] = useState<Omit<RateItem, "id">>({
    name: "",
    category: "SERVICE",
    unit: "Sq.Ft",
    rate: 0,
    description: ""
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "SERVICE",
      unit: "Sq.Ft",
      rate: 0,
      description: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RateItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      unit: item.unit,
      rate: item.rate,
      description: item.description || ""
    });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const remaining = safeDeleteRateItem(itemToDelete.id);
    setRateItems(remaining);
    setItemToDelete(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      addOrUpdateRateItem({
        id: editingItem.id,
        ...formData
      });
    } else {
      addOrUpdateRateItem({
        ...formData
      });
    }

    setRateItems(loadRateItems());
    setIsModalOpen(false);
  };

  const filteredItems = rateItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <span>{t("product_service_catalog", "Products & Services Catalog")}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage rate items, service fees, drawing rates, and survey charges
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t("add_product_service", "Add Product / Service")}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products or services..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="ALL">All Categories</option>
          <option value="SERVICE">Service</option>
          <option value="DRAWING">Drawing</option>
          <option value="SURVEY">Survey</option>
          <option value="VALUATION">Valuation</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Table List */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-4">{t("product_name", "Item / Service Name")}</th>
                <th className="p-4">{t("category", "Category")}</th>
                <th className="p-4">{t("unit", "Unit")}</th>
                <th className="p-4 text-right">{t("rate_inr", "Rate (₹)")}</th>
                <th className="p-4 text-center">{t("actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                    No products or services found. Click &quot;Add Product / Service&quot; above to create one.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-slate-200">
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 font-sans font-normal mt-0.5">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-900 text-cyan-400 border border-slate-800 rounded-xl text-[10px] font-bold">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{item.unit}</td>
                    <td className="p-4 text-right font-bold text-emerald-400 text-sm">
                      ₹{item.rate.toLocaleString("en-IN")}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-xl border border-slate-800 cursor-pointer transition-colors"
                          title={t("edit", "Edit")}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-red-400 rounded-xl border border-slate-800 cursor-pointer transition-colors"
                          title={t("delete", "Delete")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                <span>
                  {editingItem
                    ? t("edit", "Edit") + " " + editingItem.name
                    : t("add_product_service", "Add Product / Service")}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-400 mb-1">{t("product_name", "Item / Service Name")} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Plan Setting Fee (3D)"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">{t("category", "Category")}</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as any })
                    }
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="SERVICE">SERVICE</option>
                    <option value="DRAWING">DRAWING</option>
                    <option value="SURVEY">SURVEY</option>
                    <option value="VALUATION">VALUATION</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">{t("unit", "Unit")}</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. Sq.Ft, Fixed"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t("rate_inr", "Rate (₹)")} *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 font-bold focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details regarding rate coverage..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer font-bold"
                >
                  {t("cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t("save", "Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider">
                Delete Product / Service?
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Are you sure you want to permanently delete <strong className="text-emerald-400">{itemToDelete.name}</strong> from your rate catalog?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
