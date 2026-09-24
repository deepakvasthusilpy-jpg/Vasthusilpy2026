import React, { useState } from "react";
import { SiteInspection } from "../../types/siteInspection";
import {
  formatInspectionEmail,
  openGmailWebCompose,
  openDefaultMailClient,
  downloadInspectionPdf,
  DEFAULT_INSPECTION_EMAIL
} from "../../utils/siteInspectionManager";
import { triggerAppNotification } from "../../context/NotificationContext";
import {
  X,
  Mail,
  Send,
  Download,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Camera,
  Video,
  MapPin,
  Sparkles,
  Smartphone
} from "lucide-react";

interface InspectionEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: SiteInspection | null;
}

export const InspectionEmailModal: React.FC<InspectionEmailModalProps> = ({
  isOpen,
  onClose,
  inspection
}) => {
  const [recipient, setRecipient] = useState<string>(DEFAULT_INSPECTION_EMAIL);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !inspection) return null;

  const { subject, body } = formatInspectionEmail(inspection);
  const photos = inspection.media?.filter((m) => m.type === "photo") || [];
  const videos = inspection.media?.filter((m) => m.type === "video") || [];

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(`${subject}\n\n${body}`);
      setCopied(true);
      triggerAppNotification("Email report copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      triggerAppNotification("Failed to copy report text.", "error");
    }
  };

  const handleDownloadAndOpenEmail = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadInspectionPdf(inspection);
      triggerAppNotification("PDF downloaded! Opening Gmail compose...", "success");
      setTimeout(() => {
        openGmailWebCompose(inspection, recipient);
      }, 600);
    } catch (err: any) {
      triggerAppNotification("Failed to prepare PDF: " + err.message, "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-6 relative">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 font-bold">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Send Inspection via Email
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                  {inspection.inspectionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispatch complete report, photos, videos summary, and GPS to Deepak Sir
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Field */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            Send To Email Address:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="deepak.vasthusilpy@gmail.com"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
            />
            {recipient !== DEFAULT_INSPECTION_EMAIL && (
              <button
                type="button"
                onClick={() => setRecipient(DEFAULT_INSPECTION_EMAIL)}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold"
              >
                Reset Default
              </button>
            )}
          </div>
        </div>

        {/* Package Attachments & Media Summary Box */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Included in Report Dispatch
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">
              15/15 Checklist Answers Included
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <FileText className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <p className="font-bold text-slate-200 text-[11px]">A4 PDF Report</p>
              <p className="text-[10px] text-slate-400">Ready to attach</p>
            </div>

            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Camera className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <p className="font-bold text-slate-200 text-[11px]">{photos.length} Photos</p>
              <p className="text-[10px] text-slate-400">Embedded in PDF</p>
            </div>

            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Video className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <p className="font-bold text-slate-200 text-[11px]">{videos.length} Videos</p>
              <p className="text-[10px] text-slate-400">Recorded on-site</p>
            </div>

            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <MapPin className="w-4 h-4 mx-auto mb-1 text-rose-400" />
              <p className="font-bold text-slate-200 text-[11px]">GPS Coordinates</p>
              <p className="text-[10px] text-slate-400">±{inspection.gps?.accuracy || 0}m precision</p>
            </div>
          </div>
        </div>

        {/* Primary One-Click Dispatch Actions */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
            Choose Email Delivery Option:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Gmail Web / Mobile App Direct */}
            <button
              type="button"
              onClick={() => openGmailWebCompose(inspection, recipient)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition cursor-pointer active:scale-98"
            >
              <Mail className="w-4 h-4" />
              <span>Open in Gmail (Web & App)</span>
            </button>

            {/* 2. Download A4 PDF & Open Mail */}
            <button
              type="button"
              onClick={handleDownloadAndOpenEmail}
              disabled={isDownloadingPdf}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? "Preparing PDF..." : "Download PDF & Open Mail"}</span>
            </button>

            {/* 3. Default Native Mail App (Outlook / Apple Mail) */}
            <button
              type="button"
              onClick={() => openDefaultMailClient(inspection, recipient)}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Native Mail App (Outlook / Apple)</span>
            </button>

            {/* 4. Copy Full Text */}
            <button
              type="button"
              onClick={handleCopyReport}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? "Report Copied to Clipboard!" : "Copy Full Email Text"}</span>
            </button>
          </div>
        </div>

        {/* Email Preview Accordion */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Email Subject:</span>
            <span className="text-white font-bold truncate max-w-[70%]">{subject}</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
            {body}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
