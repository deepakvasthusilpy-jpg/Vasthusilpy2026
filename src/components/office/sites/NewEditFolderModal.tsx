import React, { useState, useEffect } from "react";
import { SiteFolder } from "../../../types";
import { X, Folder, FolderPlus, Palette, Check } from "lucide-react";

interface NewEditFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (folder: { id?: string; name: string; color: string; description?: string }) => void;
  folderToEdit?: SiteFolder | null;
}

const COLOR_OPTIONS = [
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", border: "border-emerald-400", ring: "ring-emerald-400" },
  { id: "cyan", label: "Cyan", bg: "bg-cyan-500", border: "border-cyan-400", ring: "ring-cyan-400" },
  { id: "blue", label: "Blue", bg: "bg-blue-500", border: "border-blue-400", ring: "ring-blue-400" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", border: "border-indigo-400", ring: "ring-indigo-400" },
  { id: "purple", label: "Purple", bg: "bg-purple-500", border: "border-purple-400", ring: "ring-purple-400" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-400", ring: "ring-amber-400" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", border: "border-rose-400", ring: "ring-rose-400" },
  { id: "teal", label: "Teal", bg: "bg-teal-500", border: "border-teal-400", ring: "ring-teal-400" }
];

export const NewEditFolderModal: React.FC<NewEditFolderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  folderToEdit
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("emerald");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (folderToEdit) {
      setName(folderToEdit.name || "");
      setColor(folderToEdit.color || "emerald");
      setDescription(folderToEdit.description || "");
    } else {
      setName("");
      setColor("emerald");
      setDescription("");
    }
    setError("");
  }, [folderToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a folder name (e.g. VEO, Taxes, Survey)");
      return;
    }
    onSave({
      id: folderToEdit?.id,
      name: name.trim(),
      color,
      description: description.trim()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {folderToEdit ? <Folder className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {folderToEdit ? "Edit Folder" : "Create New Folder"}
              </h3>
              <p className="text-xs text-slate-400">
                {folderToEdit ? "Rename or change folder theme" : "Organize your important links into folders"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Folder Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. VEO, LSGD, Banking, Revenue..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of sites in this folder"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              Folder Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = color === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-slate-800 border-emerald-400 ring-1 ring-emerald-400 text-white font-bold"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${c.bg} flex items-center justify-center shrink-0`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-slate-950 stroke-[3]" />}
                    </span>
                    <span className="text-xs truncate">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{folderToEdit ? "Save Changes" : "Create Folder"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
