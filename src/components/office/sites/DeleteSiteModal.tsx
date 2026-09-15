import React from "react";
import { ImportantSite } from "../../../types";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  site: ImportantSite | null;
}

export const DeleteSiteModal: React.FC<DeleteSiteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  site
}) => {
  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-black text-white font-sans uppercase tracking-wider">
            Remove Website & Credentials?
          </h3>
          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Are you sure you want to remove <strong className="text-white">"{site.name}"</strong> from your Important Sites vault?
          </p>
          <p className="text-[11px] text-red-400 font-mono">
            Stored username, login URL, and password credentials for this portal will be deleted.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-600/30 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Delete Site</span>
          </button>
        </div>
      </div>
    </div>
  );
};
