import React from "react";
import { X, Globe } from "lucide-react";
import { CloudflareBackendCard } from "./CloudflareBackendCard";

interface CloudflareBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudflareBackendModal: React.FC<CloudflareBackendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-amber-500/30 p-2 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="Close Cloudflare Settings"
        >
          <X className="w-5 h-5" />
        </button>

        <CloudflareBackendCard />
      </div>
    </div>
  );
};
