import React, { useState } from "react";
import { CADFolder } from "../../../types/dataStorageTypes";
import { getStoredCADFolders, getCADMetadataIndex } from "../../../utils/dataStorageManager";
import { Folder, Trash2, AlertTriangle, X, ShieldAlert, ArrowRight } from "lucide-react";

interface FolderDeleteModalProps {
  folder: CADFolder;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (folderId: string, deleteContents: boolean) => void;
}

export const FolderDeleteModal: React.FC<FolderDeleteModalProps> = ({
  folder,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [deleteContents, setDeleteContents] = useState<boolean>(false);

  if (!isOpen || !folder) return null;

  const allFolders = getStoredCADFolders() || [];
  const allFiles = getCADMetadataIndex() || [];

  // Find subfolders and contained files
  const childFolders = (allFolders || []).filter((f) => f && f.parentId === folder.id);
  const containedFiles = (allFiles || []).filter((f) => f && f.folderId === folder.id);
  const totalItemsCount = containedFiles.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-rose-500/50 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden font-mono text-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-rose-950/40 border-b border-rose-900/60 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Vault Folder</h3>
              <p className="text-xs text-rose-300/80">Folder Management & Safety Protocol</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Target Folder Details */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  backgroundColor: `${folder.color || "#38bdf8"}20`,
                  borderColor: `${folder.color || "#38bdf8"}50`,
                  color: folder.color || "#38bdf8"
                }}
              >
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate flex items-center gap-2">
                  <span>{folder.name}</span>
                  {folder.isSystemDefault && (
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px]">
                      DEFAULT ROOT
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 truncate">
                  Path: <span className="text-cyan-400">{folder.path}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Contained Drawings & Records:</span>
              <span className="font-bold text-cyan-300">
                {totalItemsCount} {totalItemsCount === 1 ? "file" : "files"}
              </span>
            </div>

            {childFolders.length > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Contained Subfolders:</span>
                <span className="font-bold text-amber-300">
                  {childFolders.length} {childFolders.length === 1 ? "subfolder" : "subfolders"}
                </span>
              </div>
            )}
          </div>

          {/* Deletion Strategy Selection */}
          {totalItemsCount > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                How should contained files be handled?
              </label>

              <div className="space-y-2.5">
                {/* Option 1: Keep files (Move to Root) */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    !deleteContents
                      ? "bg-cyan-950/40 border-cyan-500/60 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={!deleteContents}
                    onChange={() => setDeleteContents(false)}
                    className="mt-1 text-cyan-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-cyan-300">
                      Safe Mode: Move files to Root Directory
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Preserves all {totalItemsCount} CAD drawings and documents by moving them to the vault's root directory. Only this folder is removed.
                    </p>
                  </div>
                </label>

                {/* Option 2: Delete files recursively */}
                <label
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    deleteContents
                      ? "bg-rose-950/40 border-rose-500/60 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteContents}
                    onChange={() => setDeleteContents(true)}
                    className="mt-1 text-rose-500 bg-slate-800 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Purge Mode: Delete Folder AND all contained files</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Permanently destroys this folder along with all {totalItemsCount} files and attachments inside it.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {totalItemsCount === 0 && (
            <p className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 leading-relaxed">
              This folder is currently empty. Deleting it will permanently remove it from the vault directory.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmDelete(folder.id, deleteContents)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {deleteContents ? `Delete Folder & ${totalItemsCount} Files` : "Delete Folder"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
