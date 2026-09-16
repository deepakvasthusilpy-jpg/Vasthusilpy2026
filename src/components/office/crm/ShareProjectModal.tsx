import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
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
  ShieldCheck,
  Paperclip,
  FileText,
  Eye,
  CheckCircle2,
  Phone,
  MapPin
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
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [syncStatus, setSyncStatus] = useState<"syncing" | "synced" | "error">("syncing");

  // Generate shareable link
  const shareableUrl = project
    ? `${window.location.origin}?project=${encodeURIComponent(project.id)}`
    : "";

  // Generate local crisp black-on-white QR code
  useEffect(() => {
    if (!isOpen || !project || !shareableUrl) return;

    QRCode.toDataURL(shareableUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed to generate QR code:", err);
      });

    // Sync project to backend server so external phone camera scans find it immediately
    setSyncStatus("syncing");
    saveCrmProjectToServer(project)
      .then(() => {
        setSyncStatus("synced");
      })
      .catch(() => {
        setSyncStatus("error");
      });
  }, [isOpen, project, shareableUrl]);

  if (!isOpen || !project) return null;

  const attCount = project.attachments?.length || 0;
  const hasDesc = !!(project.description && project.description.trim());

  const shareText = `*Vasthusilpy Engineering Consultants - Project Documents & Specifications*\n\n*Project:* ${project.title} (#${project.id})\n*Client:* ${project.clientName}\n*Phone:* ${project.clientPhone || "Vasthusilpy Office"}\n*Location:* ${project.location}\n*Status:* ${project.status}\n\n*View Specifications & Download All Attachments (Zero Login Required):*\n${shareableUrl}`;

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
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Vasthusilpy Project Documents: ${project.title}`)}&body=${encodeURIComponent(shareText)}`;
    window.location.href = mailtoUrl;
  };

  const handleOpenClientView = () => {
    window.open(shareableUrl, "_blank");
  };

  const handleDownloadQrPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `Vasthusilpy_QR_${project.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-indigo-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white font-sans uppercase">
                  SHARE PROJECT #{project.id}
                </h3>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  ZERO LOGIN
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-mono">
                {project.title} &bull; {project.clientName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content (Scrollable) */}
        <div className="p-5 sm:p-6 space-y-5 text-xs font-sans overflow-y-auto">
          
          {/* High-Contrast Black-on-White QR Code Container */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-950 rounded-2xl border border-indigo-900/60 space-y-3 shadow-inner">
            
            {/* White Card for 100% Reliable Camera Scanner Recognition */}
            <div className="p-4 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col items-center justify-center relative">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for Project ${project.id}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <QrCode className="w-10 h-10 animate-spin text-slate-400" />
                  <span className="font-mono text-[11px]">Generating QR...</span>
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="font-mono font-bold text-slate-100 text-xs flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>POINT SMARTPHONE CAMERA TO SCAN</span>
              </p>
              <p className="text-[11px] text-slate-400 max-w-sm">
                Compatible with iOS Camera, Google Lens, Samsung Camera, and all QR apps. Instantly loads project specifications and attached files with zero login required.
              </p>
            </div>

            {/* Quick Actions under QR */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                disabled={!qrDataUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-mono text-[11px] font-bold cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save QR Image (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenClientView}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl font-mono text-[11px] font-bold cursor-pointer transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Test in New Tab</span>
              </button>
            </div>

            {/* Zero-Login Guarantee & Data Scope Badge */}
            <div className="w-full bg-slate-900/90 border border-emerald-500/40 rounded-xl p-3 flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] w-full">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-emerald-300 font-mono">
                    100% Zero-Login Public Document Portal
                  </p>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {syncStatus === "synced" ? "Synced to Cloud" : "Cloud Active"}
                  </span>
                </div>
                <p className="text-slate-300 leading-snug">
                  Clients scanning this code receive direct access to full project specifications, site locations, engineering milestones, and direct download links for all drawings & attachments.
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1 font-mono text-[10px]">
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-cyan-300 border border-slate-800 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {hasDesc ? "Full Specifications Included" : "Standard Project Specs"}
                  </span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-emerald-300 border border-slate-800 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    {attCount} {attCount === 1 ? "Attachment" : "Attachments"} Ready
                  </span>
                  {project.location && (
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-slate-300 border border-slate-800 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {project.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-mono font-bold text-[11px] uppercase">
              PROJECT SHAREABLE LINK
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 bg-slate-950 border border-indigo-900/60 rounded-xl px-3 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none select-all"
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
              <span>PREVIEW PUBLIC CLIENT VIEW (ZERO LOGIN)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 p-3 rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/40"
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
        <div className="p-4 bg-slate-950 border-t border-indigo-900/60 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
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
