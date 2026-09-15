import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  IndianRupee,
  X,
  AlertTriangle,
  FileText,
  Check
} from "lucide-react";
import {
  ApplicationTypeItem,
  loadApplicationTypes,
  addApplicationType,
  updateApplicationType,
  deleteApplicationType
} from "../../../data/applicationTypesData";

export const ApplicationTypesView: React.FC = () => {
  const [types, setTypes] = useState<ApplicationTypeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ApplicationTypeItem | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>("");
  const [formFee, setFormFee] = useState<string>("70");
  const [formUserId, setFormUserId] = useState<string>("USER ID");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // In-app Delete Confirmation Modal state
  const [deletingItem, setDeletingItem] = useState<ApplicationTypeItem | null>(null);

  // Load types and subscribe to custom events
  useEffect(() => {
    setTypes(loadApplicationTypes());

    const handleDataChange = () => {
      setTypes(loadApplicationTypes());
    };

    window.addEventListener("vasthusilpy_application_types_changed", handleDataChange);
    return () => {
      window.removeEventListener("vasthusilpy_application_types_changed", handleDataChange);
    };
  }, []);

  // Filter types based on search
  const filteredTypes = types.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.userId.toLowerCase().includes(q) ||
      String(item.fee).includes(q) ||
      (item.notes || "").toLowerCase().includes(q)
    );
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormName("");
    setFormFee("70");
    setFormUserId("USER ID");
    setFormNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ApplicationTypeItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormFee(String(item.fee ?? 70));
    setFormUserId(item.userId || "USER ID");
    setFormNotes(item.notes || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError("Please enter an application name.");
      return;
    }

    const numFee = Number(formFee) || 0;
    const cleanUserId = formUserId.trim() || "USER ID";

    if (editingItem) {
      updateApplicationType(editingItem.id, {
        name: cleanName.toUpperCase(),
        fee: numFee,
        userId: cleanUserId,
        notes: formNotes.trim()
      });
    } else {
      addApplicationType({
        name: cleanName.toUpperCase(),
        fee: numFee,
        userId: cleanUserId,
        notes: formNotes.trim()
      });
    }

    setTypes(loadApplicationTypes());
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingItem) {
      deleteApplicationType(deletingItem.id);
      setTypes(loadApplicationTypes());
      setDeletingItem(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-teal-400">
              ONLINE APPLICATION CONFIGURATION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Applications Type
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Add and manage standard application types with designated rate (Rs) and login User ID.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-mono font-black text-xs flex items-center gap-1.5 shadow-md shadow-teal-950/40 cursor-pointer transition transform hover:scale-[1.02] shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ ADD APPLICATION TYPE</span>
        </button>
      </div>

      {/* Metrics Row (Simple, No Departments, No Portal Links) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Configured Types</p>
            <p className="text-xl font-black text-white mt-0.5">{types.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Standard Rate Format</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">Rs / Application</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase text-slate-400">Default Auth Field</p>
            <p className="text-xl font-black text-cyan-400 mt-0.5">USER ID</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by application name, fee (Rs), or User ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 pr-2">
          {filteredTypes.length} Application {filteredTypes.length === 1 ? "Type" : "Types"}
        </div>
      </div>

      {/* Applications List in Clear, Viewable Format */}
      {filteredTypes.length === 0 ? (
        <div className="text-center py-14 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-300 font-mono">No Application Types Found</h3>
          <p className="text-xs text-slate-500 font-mono mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No types matched "${searchQuery}".`
              : "Click '+ ADD APPLICATION TYPE' to configure an application (e.g. POSSESSION CERTIFICATE | 70 Rs | USER ID)."}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-3 px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-mono font-bold transition cursor-pointer"
          >
            + Add First Application
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTypes.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-4 transition flex flex-col justify-between shadow-sm hover:shadow-md group"
            >
              <div className="space-y-3">
                {/* Header with Title & Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black text-white font-mono tracking-tight leading-snug group-hover:text-teal-300 transition uppercase">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-slate-400 hover:text-teal-300 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg cursor-pointer transition"
                      title="Edit Application Type"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 rounded-lg cursor-pointer transition"
                      title="Delete Application Type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Clean Key Metrics: Fee (Rs) & User ID */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Fee in Rs */}
                  <div className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-xs">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-mono font-black text-emerald-300">
                      {item.fee} Rs
                    </span>
                  </div>

                  {/* User ID Field */}
                  <div className="flex items-center gap-1.5 bg-cyan-950/70 border border-cyan-500/40 px-3 py-1.5 rounded-xl shadow-xs">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wide">
                      {item.userId || "USER ID"}
                    </span>
                  </div>
                </div>

                {/* Optional Notes */}
                {item.notes && (
                  <p className="text-xs text-slate-400 font-mono line-clamp-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    {item.notes}
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Application Type</span>
                <span>Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Application Type Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-black text-white font-mono uppercase">
                  {editingItem ? "Edit Application Type" : "Add Application Type"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Application Name */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. POSSESSION CERTIFICATE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Fee (Rs) */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-1">
                  Rate / Fee (Rs) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formFee}
                    onChange={(e) => setFormFee(e.target.value)}
                    placeholder="70"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3 pr-12 py-2 text-xs text-emerald-300 font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                    Rs
                  </span>
                </div>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-1">
                  Login Credential / User ID Field *
                </label>
                <input
                  type="text"
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  placeholder="e.g. USER ID"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 uppercase font-mono font-bold placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase text-slate-300 mb-1">
                  Notes / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional notes or instructions..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-mono font-black text-xs shadow-md cursor-pointer transition"
                >
                  {editingItem ? "Save Changes" : "Create Application Type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal (Iframe safe) */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Delete Application Type?
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Confirm removing this type from directory.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
              Are you sure you want to delete <strong className="text-white">"{deletingItem.name}"</strong> ({deletingItem.fee} Rs)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition shadow-md shadow-rose-950/50 cursor-pointer"
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
