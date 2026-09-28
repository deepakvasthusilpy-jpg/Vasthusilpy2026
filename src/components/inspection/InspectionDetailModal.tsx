import React, { useState } from "react";
import { SiteInspection } from "../../types/siteInspection";
import {
  downloadInspectionPdf,
  downloadInspectionArchive,
  sendWhatsAppNotification
} from "../../utils/siteInspectionManager";
import { InspectionEmailModal } from "./InspectionEmailModal";
import { InspectionTelegramModal } from "./InspectionTelegramModal";
import { InspectionMediaViewer } from "./InspectionMediaViewer";
import { triggerAppNotification } from "../../context/NotificationContext";
import {
  X,
  FileText,
  Download,
  Share2,
  MapPin,
  Camera,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ExternalLink,
  ShieldCheck,
  Mail,
  Send,
  Archive,
  Maximize2,
  Trash2,
  Video
} from "lucide-react";

interface InspectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: SiteInspection | null;
  onDelete?: (id: string) => void;
}

export const InspectionDetailModal: React.FC<InspectionDetailModalProps> = ({
  isOpen,
  onClose,
  inspection,
  onDelete
}) => {
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const [isDownloadingArchive, setIsDownloadingArchive] = useState(false);

  if (!isOpen || !inspection) return null;

  const handleDownloadAll = async () => {
    try {
      setIsDownloadingArchive(true);
      triggerAppNotification("Packaging PDF, Photos, Videos & metadata into ZIP...", "info");
      await downloadInspectionArchive(inspection);
      triggerAppNotification("Inspection package downloaded successfully!", "success");
    } catch (err: any) {
      triggerAppNotification(err?.message || "Failed to download archive package.", "error");
    } finally {
      setIsDownloadingArchive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-6 shadow-2xl my-8 relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Site Inspection Report
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  {inspection.inspectionNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {inspection.templateName || "General Site Inspection"} •{" "}
                {new Date(inspection.dateTime).toLocaleString()}
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

        {/* Quick Action Bar (Download Full Package, PDF, Telegram, Email, WhatsApp) */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingArchive}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition cursor-pointer disabled:opacity-50"
              title="Download Complete Package (PDF + Photos + Videos + Docs)"
            >
              <Archive className="w-4 h-4" />
              <span>{isDownloadingArchive ? "Packaging ZIP..." : "Download Full Package (ZIP)"}</span>
            </button>

            <button
              onClick={() => downloadInspectionPdf(inspection)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/25 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download A4 PDF</span>
            </button>

            <button
              onClick={() => setIsTelegramModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-sky-500/25 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </button>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-600/25 transition cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Email Report</span>
            </button>

            <button
              onClick={() => sendWhatsAppNotification(inspection)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-700/25 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            Status: <strong className="text-emerald-400 uppercase">{inspection.status}</strong>
          </span>
        </div>

        {/* Client & Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-slate-400 font-bold flex items-center gap-1.5 uppercase font-mono text-[10px]">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              Owner & Contact
            </span>
            <p className="text-sm font-bold text-white">{inspection.ownerName}</p>
            <p className="text-slate-300 font-mono">📱 {inspection.mobileNumber}</p>
            {inspection.inspectorName && (
              <p className="text-[11px] text-slate-400 mt-1">
                Inspected by: <span className="text-slate-200">{inspection.inspectorName}</span>
              </p>
            )}
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-slate-400 font-bold flex items-center gap-1.5 uppercase font-mono text-[10px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Place & Administration
            </span>
            <p className="text-sm font-bold text-white">{inspection.place}</p>
            <p className="text-slate-300">
              {inspection.panchayathMunicipality || "Local Authority"}
            </p>
            {inspection.surveyNumber && (
              <p className="text-[11px] text-slate-400 font-mono">
                Survey No: <span className="text-cyan-300">{inspection.surveyNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* GPS Coordinates Box */}
        {inspection.gps && (
          <div className="p-3.5 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                <MapPin className="w-4 h-4 text-cyan-400" />
                GPS Coordinates: {inspection.gps.latitude.toFixed(6)}, {inspection.gps.longitude.toFixed(6)}
              </span>
              <a
                href={inspection.gps.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1"
              >
                <span>View Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>
                Accuracy: <strong className={inspection.gps.accuracy && inspection.gps.accuracy <= 10 ? "text-emerald-400" : "text-amber-400"}>±{inspection.gps.accuracy || 0}m</strong>
              </span>
              {inspection.gps.accuracy && inspection.gps.accuracy <= 10 && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  🎯 5–10m Precision Lock
                </span>
              )}
              <span>• Captured {new Date(inspection.gps.fetchedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Checklist Answers */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Checklist Responses ({inspection.answers.length})
          </h4>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl divide-y divide-slate-850 overflow-hidden text-xs">
            {inspection.answers.map((ans, idx) => (
              <div key={idx} className="p-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5 max-w-[70%]">
                  <p className="text-slate-200 font-medium">
                    <span className="text-slate-500 mr-1.5">{idx + 1}.</span>
                    {ans.questionText}
                  </p>
                  {ans.notes && (
                    <p className="text-[11px] text-slate-400 italic">"{ans.notes}"</p>
                  )}
                </div>

                <div>
                  {ans.answer === true || ans.answer === "YES" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>YES</span>
                    </span>
                  ) : ans.answer === false || ans.answer === "NO" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>NO</span>
                    </span>
                  ) : ans.answer === "N/A" ? (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1">
                      <MinusCircle className="w-3 h-3" />
                      <span>N/A</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200 border border-slate-700 text-[11px] font-mono font-bold">
                      {String(ans.answer || "—")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Remarks */}
        {inspection.overallRemarks && (
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-xs font-bold text-slate-300 font-mono">Summary Remarks:</span>
            <p className="text-xs text-slate-300 italic whitespace-pre-line">
              "{inspection.overallRemarks}"
            </p>
          </div>
        )}

        {/* Attached Photos / Videos with Click-to-View Fit-to-screen */}
        {inspection.media && inspection.media.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                Attached Media & Documents ({inspection.media.length})
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any file to view full screen (fit-to-view)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inspection.media.map((m, mIdx) => (
                <div
                  key={m.id || mIdx}
                  onClick={() => setActiveMediaIndex(mIdx)}
                  className="group bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition shadow-md hover:shadow-xl relative"
                  title="Click to view fit-to-screen"
                >
                  <div className="w-full h-28 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    {m.type === "photo" ? (
                      <img
                        src={m.url}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-purple-400 gap-1 bg-slate-950">
                        <Video className="w-8 h-8" />
                        <span className="text-[9px] font-mono font-bold text-slate-400">VIDEO</span>
                      </div>
                    )}

                    {/* Hover Overlay with Fit-to-view Zoom Icon */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition backdrop-blur-[2px]">
                      <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-lg">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950/90 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold text-slate-200 truncate font-mono">{m.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase font-mono">{m.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`Are you sure you want to permanently delete inspection ${inspection.inspectionNumber} for ${inspection.ownerName}?`)) {
                  onDelete(inspection.id);
                  onClose();
                }
              }}
              className="px-3.5 py-2 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Inspection</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition ml-auto cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Email Dispatch Modal */}
        <InspectionEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          inspection={inspection}
        />

        {/* Telegram Dispatch Modal */}
        <InspectionTelegramModal
          isOpen={isTelegramModalOpen}
          onClose={() => setIsTelegramModalOpen(false)}
          inspection={inspection}
        />

        {/* Fullscreen Fit-to-View Media Lightbox */}
        <InspectionMediaViewer
          isOpen={activeMediaIndex !== null}
          onClose={() => setActiveMediaIndex(null)}
          mediaList={inspection.media || []}
          initialIndex={activeMediaIndex ?? 0}
          inspection={inspection}
        />
      </div>
    </div>
  );
};
