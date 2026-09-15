import React, { useState } from "react";
import { CrmProject } from "../../../types";
import { X, QrCode, Copy, Check, Share2, Send, Mail, ExternalLink, Download, Sparkles } from "lucide-react";

interface ShareProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CrmProject | null;
}

export const ShareProjectModal: React.FC<ShareProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project) return null;

  // Generate shareable link
  const shareableUrl = `${window.location.origin}?project=${project.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareableUrl)}&color=06b6d4&bcolor=090d16`;

  const shareText = `Vasthusilpy Engineering - Project #${project.id}\nTitle: ${project.title}\nClient: ${project.clientName}\nStatus: ${project.status}\nLink: ${shareableUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
  };

  const handleEmailShare = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Vasthusilpy Project: ${project.title}`)}&body=${encodeURIComponent(shareText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-0">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-sans uppercase">
                SHARE PROJECT #{project.id}
              </h3>
              <p className="text-xs text-cyan-300 font-mono">
                QR Code & Shareable Web Link
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 text-xs font-sans">
          
          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-indigo-900/60 space-y-3 shadow-inner">
            <div className="p-3 bg-slate-900 rounded-2xl border border-cyan-500/30 shadow-xl relative group">
              <img
                src={qrCodeUrl}
                alt={`QR Code for Project ${project.id}`}
                className="w-48 h-48 rounded-lg object-contain"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="font-mono font-bold text-slate-200 text-xs flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>SCAN WITH MOBILE CAMERA</span>
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Scan QR Code to immediately view project status & attachments on phone.
              </p>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-mono font-bold text-[11px] uppercase">
              PROJECT SHAREABLE LINK
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-slate-950 border border-indigo-900/60 rounded-xl px-3 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2.5 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "COPIED!" : "COPY"}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 p-3 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Share</span>
            </button>

            <button
              type="button"
              onClick={handleEmailShare}
              className="flex items-center justify-center gap-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 p-3 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Email Link</span>
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-indigo-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Vasthusilpy Engineering Portal</span>
          <button
            type="button"
            onClick={onClose}
            className="text-cyan-400 hover:underline cursor-pointer font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
