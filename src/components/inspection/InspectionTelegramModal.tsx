import React, { useState } from "react";
import { SiteInspection } from "../../types/siteInspection";
import {
  formatTelegramInspectionMessage,
  openTelegramChat,
  downloadInspectionArchive,
  DEFAULT_TELEGRAM_NUMBER,
  DEFAULT_TELEGRAM_PHONE_CLEAN
} from "../../utils/siteInspectionManager";
import { triggerAppNotification } from "../../context/NotificationContext";
import {
  X,
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
  Archive,
  Share2,
  FileArchive,
  PhoneCall,
  Loader2
} from "lucide-react";

interface InspectionTelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: SiteInspection | null;
}

export const InspectionTelegramModal: React.FC<InspectionTelegramModalProps> = ({
  isOpen,
  onClose,
  inspection
}) => {
  const [phone, setPhone] = useState<string>("9747995961");
  const [copied, setCopied] = useState(false);
  const [isPackaging, setIsPackaging] = useState(false);
  const [packagingProgress, setPackagingProgress] = useState<number>(0);
  const [packagingStatus, setPackagingStatus] = useState<string>("");

  if (!isOpen || !inspection) return null;

  const telegramText = formatTelegramInspectionMessage(inspection);
  const photos = inspection.media?.filter((m) => m.type === "photo") || [];
  const videos = inspection.media?.filter((m) => m.type === "video") || [];

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(telegramText);
      setCopied(true);
      triggerAppNotification("Telegram summary copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      triggerAppNotification("Failed to copy text.", "error");
    }
  };

  const handleDownloadArchive = async () => {
    try {
      setIsPackaging(true);
      setPackagingProgress(5);
      setPackagingStatus("Initializing Archive Engine...");

      await downloadInspectionArchive(inspection, (percent, step) => {
        setPackagingProgress(percent);
        setPackagingStatus(step);
      });

      triggerAppNotification("Archive bundle (.zip / .rar) downloaded successfully!", "success");
    } catch (err: any) {
      triggerAppNotification("Archive creation failed: " + err.message, "error");
    } finally {
      setIsPackaging(false);
    }
  };

  const handleDownloadAndOpenTelegram = async () => {
    try {
      setIsPackaging(true);
      setPackagingProgress(5);
      setPackagingStatus("Preparing complete inspection archive package...");

      await downloadInspectionArchive(inspection, (percent, step) => {
        setPackagingProgress(percent);
        setPackagingStatus(step);
      });

      triggerAppNotification("Archive downloaded! Opening Telegram to +91 9747995961...", "success");

      setTimeout(() => {
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        openTelegramChat(inspection, cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone);
      }, 700);
    } catch (err: any) {
      triggerAppNotification("Error packaging files: " + err.message, "error");
    } finally {
      setIsPackaging(false);
    }
  };

  const handleDirectTelegramChat = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    openTelegramChat(inspection, cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-sky-500/30 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-6 relative">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 font-bold">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Telegram Archive Dispatch
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold border border-sky-500/30">
                  {inspection.inspectionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Package PDF Report, Photos, Videos & GPS as RAR/ZIP bundle to <strong>+91 9747995961</strong>
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

        {/* Recipient Telegram Number */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <label className="block text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-sky-400" />
            Recipient Telegram Number:
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 flex-1">
              <span className="text-xs text-slate-400 font-mono font-bold mr-2">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9747995961"
                className="w-full bg-transparent text-xs text-sky-400 font-mono font-bold focus:outline-none"
              />
            </div>
            {phone !== "9747995961" && (
              <button
                type="button"
                onClick={() => setPhone("9747995961")}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold"
              >
                Reset Default
              </button>
            )}
          </div>
        </div>

        {/* Bundle Contents Preview */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <FileArchive className="w-4 h-4 text-amber-400" />
              All-in-One RAR / ZIP Archive Includes:
            </span>
            <span className="text-[10px] text-sky-400 font-mono font-bold">
              Complete On-Site Package
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <FileText className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
              <p className="font-bold text-slate-200 text-[11px]">Official A4 PDF</p>
              <p className="text-[10px] text-slate-400">Complete Report</p>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Camera className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <p className="font-bold text-slate-200 text-[11px]">{photos.length} Photos</p>
              <p className="text-[10px] text-slate-400">High-Res JPG</p>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <Video className="w-4 h-4 mx-auto mb-1 text-purple-400" />
              <p className="font-bold text-slate-200 text-[11px]">{videos.length} Videos</p>
              <p className="text-[10px] text-slate-400">On-site captures</p>
            </div>

            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center">
              <MapPin className="w-4 h-4 mx-auto mb-1 text-rose-400" />
              <p className="font-bold text-slate-200 text-[11px]">GPS & JSON</p>
              <p className="text-[10px] text-slate-400">±{inspection.gps?.accuracy || 0}m precision</p>
            </div>
          </div>
        </div>

        {/* Compression / Packaging Progress Bar (when creating zip) */}
        {isPackaging && (
          <div className="p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-sky-300 font-bold flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {packagingStatus || "Packaging All Files..."}
              </span>
              <span className="text-sky-400 font-bold">{packagingProgress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${packagingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">
            Choose Telegram Action:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Download Archive & Open Telegram */}
            <button
              type="button"
              onClick={handleDownloadAndOpenTelegram}
              disabled={isPackaging}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>{isPackaging ? "Packaging..." : "Download Archive & Open Telegram"}</span>
            </button>

            {/* 2. Download Archive Bundle (.ZIP / .RAR) */}
            <button
              type="button"
              onClick={handleDownloadArchive}
              disabled={isPackaging}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>{isPackaging ? "Compressing..." : "Download Archive (.ZIP / .RAR)"}</span>
            </button>

            {/* 3. Direct Telegram Chat Link */}
            <button
              type="button"
              onClick={handleDirectTelegramChat}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-sky-400" />
              <span>Open Chat with +91 9747995961</span>
            </button>

            {/* 4. Copy Telegram Text */}
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? "Telegram Text Copied!" : "Copy Telegram Text Summary"}</span>
            </button>
          </div>
        </div>

        {/* Telegram Message Preview */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Telegram Message Payload:</span>
            <span className="text-sky-400 font-bold">To: +91 9747995961</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl max-h-36 overflow-y-auto text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed select-all">
            {telegramText}
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
