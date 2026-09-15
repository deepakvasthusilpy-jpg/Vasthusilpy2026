import React, { useState } from "react";
import { CADFolder } from "../../../types/dataStorageTypes";
import {
  getStoredCADFolders,
  createCADFolder,
  updateCADFolder,
  deleteCADFolder
} from "../../../utils/dataStorageManager";
import {
  X,
  FolderPlus,
  Folder,
  FolderTree,
  Edit2,
  Trash2,
  Check,
  Palette,
  Layers,
  ChevronRight
} from "lucide-react";

interface FolderManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoldersUpdated: () => void;
  selectedParentId?: string | null;
  editingFolder?: CADFolder | null;
}

const FOLDER_COLORS = [
  { label: "Cyan", value: "#38bdf8" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Purple", value: "#a855f7" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Indigo", value: "#6366f1" }
];

export const FolderManageModal: React.FC<FolderManageModalProps> = ({
  isOpen,
  onClose,
  onFoldersUpdated,
  selectedParentId = null,
  editingFolder = null
}) => {
  const folders = getStoredCADFolders();

  const [name, setName] = useState(editingFolder ? editingFolder.name : "");
  const [parentId, setParentId] = useState<string | null>(
    editingFolder ? editingFolder.parentId || null : selectedParentId || null
  );
  const [color, setColor] = useState(editingFolder ? editingFolder.color || "#38bdf8" : "#38bdf8");
  const [description, setDescription] = useState(editingFolder ? editingFolder.description || "" : "");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a folder name.");
      return;
    }

    if (editingFolder) {
      // Update existing folder
      let parentPath = "";
      if (parentId) {
        const parent = folders.find((f) => f.id === parentId);
        if (parent) parentPath = parent.path;
      }
      const newPath = `${parentPath}/${name.trim()}`.replace(/\/+/g, "/");

      updateCADFolder({
        ...editingFolder,
        name: name.trim(),
        parentId: parentId || null,
        path: newPath,
        color,
        description: description.trim()
      });
    } else {
      // Create new folder / subfolder
      createCADFolder(name.trim(), parentId, description.trim(), color);
    }

    onFoldersUpdated();
    onClose();
  };

  const handleDelete = () => {
    if (!editingFolder) return;
    if (editingFolder.isSystemDefault) {
      if (!confirm(`"${editingFolder.name}" is a default root folder. Are you sure you want to delete it? Files will be relocated to another folder.`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete folder "${editingFolder.name}" and any subfolders inside it?`)) {
        return;
      }
    }

    deleteCADFolder(editingFolder.id);
    onFoldersUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{ backgroundColor: `${color}15`, borderColor: `${color}40`, color }}
            >
              {editingFolder ? <Folder className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {editingFolder ? "Edit Folder Details" : parentId ? "Create Nested Subfolder" : "Create New Top-Level Folder"}
              </h3>
              <p className="text-xs text-slate-400">
                {editingFolder ? `Modifying "${editingFolder.name}"` : parentId ? "Add a subfolder inside the selected parent directory" : "Organize CAD drawings and architectural vaults"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Folder Name */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Folder Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. VISHNU, DEEPAK, DIBIN, 2026 Residential, Permit Sets..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono"
            />
          </div>

          {/* Parent Folder / Nesting */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Parent Folder (Nesting Level)
            </label>
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">📂 Top-Level Root Folder (No Parent)</option>
              {folders
                .filter((f) => !editingFolder || f.id !== editingFolder.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.path} ({f.name})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Select a parent folder to nest this folder inside it (e.g. inside VISHNU, DEEPAK, or DIBIN).
            </p>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Folder Theme Color
            </label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                    color === c.value
                      ? "border-white bg-slate-800 text-white shadow-sm"
                      : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Client villa plans, structural drawings, LSGD submission sets..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            {editingFolder ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Folder</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{editingFolder ? "Save Changes" : "Create Folder"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
