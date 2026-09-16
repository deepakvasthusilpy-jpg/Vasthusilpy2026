import React, { useState, useEffect } from "react";
import { CrmProject } from "../../../types";
import { saveCrmProjectToServer } from "../../../utils/storageManager";
import {
  X,
  QrCode,
  Copy,
  Check,
  Share2,
  Send,
  Mail,
  ExternalLink,
  Download,
  Sparkles,
  ShieldCheck,
  Paperclip,
  FileText,
  Eye
} from "lucide-react";

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

  // When modal opens, sync this project to backend server so external QR scans immediately find it
  useEffect(() => {
    if (isOpen && project) {
      saveCrmProjectToServer(project).catch(() => {});
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  // Generate shareable link
  const shareableUrl = `${window.location.origin}?project=${encodeURIComponent(project.id)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareableUrl)}&color=06b6d4&bcolor=090d16`;

  const attCount = project.attachments?.length || 0;
  const hasDesc = !!(project.description && project.description.trim());

  const shareText = `Vasthusilpy Engineering - Project Documents & Specifications\nProject: ${project.title} (#${project.id})\nClient: ${project.clientName}\nLocation: ${project.location}\nStatus: ${project.status}\n\nView Project Specifications & Attachments Without Login:\n${shareableUrl}`;

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

  const handleOpenClientView = () => {
    window.open(shareableUrl, "_blank");
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
                Scan QR Code with any phone camera to immediately view project specifications & download attachments.
              </p>
            </div>

            {/* Zero-Login Guarantee & Data Scope Badge */}
            <div className="w-full bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px]">
                <p className="font-bold text-emerald-300 font-mono">
                  100% Zero Login Required for Client
                </p>
                <p className="text-slate-300 leading-snug">
                  Client can instantly view all entered specifications, project details, location, and download all shareable drawings & documents.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[10px]">
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-cyan-300 border border-slate-800">
                    <FileText className="w-3 h-3 inline mr-1" />
                    {hasDesc ? "Specifications Included" : "Standard Project Specs"}
                  </span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300 border border-slate-800">
                    <Paperclip className="w-3 h-3 inline mr-1" />
                    {attCount} Shareable {attCount === 1 ? "Attachment" : "Attachments"}
                  </span>
                </div>
              </div>
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

          {/* Action Buttons: Preview & Social */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleOpenClientView}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 p-3 rounded-xl font-mono font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Eye className="w-4 h-4" />
              <span>PREVIEW CLIENT VIEW (NO LOGIN REQUIRED)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
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
