import React from "react";
import { SiteFolder } from "../../../types";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folder: SiteFolder | null;
  siteCount?: number;
}

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  folder,
  siteCount = 0
}) => {
  if (!isOpen || !folder) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <Trash2 className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">Delete Folder?</h3>
            <p className="text-sm text-slate-300 mt-1 font-medium">
              Are you sure you want to delete <span className="text-rose-400 font-bold">"{folder.name}"</span>?
            </p>
            {siteCount > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This folder contains <strong>{siteCount}</strong> saved website link(s). Deleting the folder will not delete the websites; they will be moved to <strong>General</strong>.
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
