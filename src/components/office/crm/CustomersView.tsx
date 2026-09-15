import React, { useState, useEffect } from "react";
import { Customer, CrmProject, Invoice } from "../../../types";
import {
  loadCustomers,
  addOrUpdateCustomer,
  safeDeleteCustomer
} from "../../../utils/storageManager";
import { useLanguage } from "../../../context/LanguageContext";
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Check,
  X,
  Building,
  AlertTriangle
} from "lucide-react";

interface CustomersViewProps {
  projects: CrmProject[];
  invoices: Invoice[];
}

export const CustomersView: React.FC<CustomersViewProps> = ({ projects, invoices }) => {
  const { t } = useLanguage();

  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers());
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setCustomers(loadCustomers());
    };
    window.addEventListener("vasthusilpy_customers_updated", handleSync);
    window.addEventListener("vasthusilpy_storage_update", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("vasthusilpy_customers_updated", handleSync);
      window.removeEventListener("vasthusilpy_storage_update", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const [formData, setFormData] = useState<Omit<Customer, "id">>({
    name: "",
    phone: "",
    email: "",
    houseName: "",
    villagePanchayat: "",
    district: "Palakkad",
    gstNo: ""
  });

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      houseName: "",
      villagePanchayat: "",
      district: "Palakkad",
      gstNo: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || "",
      houseName: cust.houseName || "",
      villagePanchayat: cust.villagePanchayat || "",
      district: cust.district || "Palakkad",
      gstNo: cust.gstNo || ""
    });
    setIsModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    const remaining = safeDeleteCustomer(customerToDelete.id);
    setCustomers(remaining);
    setCustomerToDelete(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    if (editingCustomer) {
      addOrUpdateCustomer({
        id: editingCustomer.id,
        ...formData
      });
    } else {
      addOrUpdateCustomer({
        ...formData
      });
    }

    setCustomers(loadCustomers());
    setIsModalOpen(false);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.villagePanchayat && c.villagePanchayat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header & Action Button */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <h2 className="text-lg font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>{t("customer_directory", "Customer Directory")}</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Manage client profiles, contacts, Panchayat locations, and GST details
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t("add_customer", "Add New Customer")}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, mobile number or Panchayat..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Customers Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center text-slate-500 font-mono text-xs">
            No customers found. Click &quot;Add New Customer&quot; above to create one.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            // Find linked projects & invoices
            const custProjects = (projects || []).filter(
              (p) => p && p.clientName && p.clientName.toLowerCase().includes(cust.name.toLowerCase())
            );
            const custInvoices = (invoices || []).filter(
              (i) => i && i.applicantName && i.applicantName.toLowerCase().includes(cust.name.toLowerCase())
            );
            const totalBilled = custInvoices.reduce((sum, inv) => sum + (inv?.grandTotal || 0), 0);

            return (
              <div
                key={cust.id}
                className="bg-slate-950 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-white font-sans">{cust.name}</h3>
                      {cust.houseName && (
                        <p className="text-xs text-slate-400 font-mono">{cust.houseName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1.5 text-cyan-400 hover:bg-slate-900 rounded-lg border border-slate-800 cursor-pointer"
                        title={t("edit", "Edit")}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setCustomerToDelete(cust)}
                        className="p-1.5 text-red-400 hover:bg-slate-900 rounded-lg border border-slate-800 cursor-pointer"
                        title={t("delete", "Delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{cust.phone}</span>
                    </div>

                    {cust.email && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}

                    {cust.villagePanchayat && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          {cust.villagePanchayat}, {cust.district}
                        </span>
                      </div>
                    )}

                    {cust.gstNo && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Building className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>GST: {cust.gstNo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics footer */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">{t("total_projects", "Projects")}</span>
                    <span className="text-sm font-bold text-slate-200">{custProjects.length}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">{t("total_billed", "Total Billed")}</span>
                    <span className="text-sm font-bold text-emerald-400">₹{totalBilled.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>
                  {editingCustomer
                    ? t("edit", "Edit") + " " + editingCustomer.name
                    : t("add_customer", "Add New Customer")}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">{t("customer_name", "Customer Name")} *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t("phone", "Phone Number")} *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 98471 23456"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t("email", "Email Address")}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. client@gmail.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">House Name</label>
                  <input
                    type="text"
                    value={formData.houseName}
                    onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                    placeholder="e.g. Suryagiri"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Panchayat / Village</label>
                  <input
                    type="text"
                    value={formData.villagePanchayat}
                    onChange={(e) => setFormData({ ...formData, villagePanchayat: e.target.value })}
                    placeholder="e.g. Keralassery"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">{t("gst_number", "GST No (Optional)")}</label>
                <input
                  type="text"
                  value={formData.gstNo}
                  onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                  placeholder="e.g. 32ABCDE1234F1ZH"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-amber-500"
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{t("save", "Save")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-app Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider">
                Delete Customer?
              </h3>
              <p className="text-xs text-slate-300 font-sans">
                Are you sure you want to permanently delete <strong className="text-amber-400">{customerToDelete.name}</strong> from your customer directory?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
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
