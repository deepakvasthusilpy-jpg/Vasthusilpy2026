import React from "react";
import { CADMetadataIndexItem } from "../../../types/dataStorageTypes";
import { formatBytes } from "../../../utils/dataStorageManager";
import { Trash2, AlertTriangle, X, FileCode, FileText } from "lucide-react";

interface FileDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Single file mode
  file?: CADMetadataIndexItem | null;
  // Bulk delete mode
  bulkFiles?: CADMetadataIndexItem[];
  selectedCount?: number;
  isBulk?: boolean;
  onConfirmDelete: () => void;
}

export const FileDeleteModal: React.FC<FileDeleteModalProps> = ({
  isOpen,
  onClose,
  file,
  bulkFiles = [],
  selectedCount,
  isBulk: propIsBulk,
  onConfirmDelete
}) => {
  if (!isOpen) return null;

  const filesList = Array.isArray(bulkFiles) ? bulkFiles : [];
  const isBulk = Boolean(propIsBulk || (filesList.length > 0 && !file) || (typeof selectedCount === "number" && selectedCount > 0 && !file));
  const totalCount = isBulk ? (selectedCount || filesList.length || 1) : 1;
  const totalSize = isBulk
    ? filesList.reduce((sum, f) => sum + (f?.fileSize || 0), 0)
    : file?.fileSize || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-rose-500/50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden font-mono text-slate-200 animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-rose-950/40 border-b border-rose-900/60 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isBulk ? `Delete ${totalCount} Drawings?` : "Delete Drawing File?"}
              </h3>
              <p className="text-xs text-rose-300/80">Permanent Vault Deletion</p>
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

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {!isBulk && file && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/60 flex items-center justify-center shrink-0">
                  {file.fileType === "PDF" ? <FileText className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">{file.name || "Unnamed Drawing"}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Folder: <span className="text-cyan-400">{file.folderPath || "/DEEPAK"}</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Category / Size:</span>
                <span className="text-cyan-300 font-bold">
                  {file.category || "PLAN"} • {formatBytes(file.fileSize || 0)}
                </span>
              </div>
            </div>
          )}

          {isBulk && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">Total Selected Files:</span>
                <span className="text-cyan-300 font-bold">{totalCount} files</span>
              </div>
              {totalSize > 0 && (
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold">Total Storage Size:</span>
                  <span className="text-amber-300 font-bold">{formatBytes(totalSize)}</span>
                </div>
              )}
              {filesList.length > 0 && (
                <div className="max-h-28 overflow-y-auto divide-y divide-slate-800/60 pt-2 text-[11px] text-slate-400 scrollbar-thin">
                  {filesList.map((bf) => (
                    <div key={bf.id} className="py-1 flex items-center justify-between truncate">
                      <span className="truncate text-slate-200">{bf.name || "Drawing"}</span>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">{formatBytes(bf.fileSize || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>
              This action cannot be undone. The drawing records, vector data, and all attached files will be permanently erased.
            </span>
          </div>
        </div>

        {/* Footer */}
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
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-950 cursor-pointer transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isBulk ? `Delete ${totalCount} Files` : "Permanently Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
