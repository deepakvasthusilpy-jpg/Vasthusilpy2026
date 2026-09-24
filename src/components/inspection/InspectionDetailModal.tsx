import React from "react";
import { SiteInspection } from "../../types/siteInspection";
import {
  downloadInspectionPdf,
  sendWhatsAppNotification,
  DEFAULT_INSPECTION_EMAIL
} from "../../utils/siteInspectionManager";
import {
  X,
  Download,
  Share2,
  ExternalLink,
  MapPin,
  Camera,
  Video,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Phone,
  Building,
  FileText,
  Clock,
  ShieldCheck,
  Send
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
  if (!isOpen || !inspection) return null;

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

        {/* Quick Action Bar (PDF & WhatsApp) */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadInspectionPdf(inspection)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/25 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download A4 PDF</span>
            </button>

            <button
              onClick={() => sendWhatsAppNotification(inspection)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp to Deepak Sir (+918848241463)</span>
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
            <p className="text-[11px] text-slate-400 font-mono">
              GPS Accuracy: ±{inspection.gps.accuracy || 0}m • Captured at {new Date(inspection.gps.fetchedAt).toLocaleString()}
            </p>
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
                  {typeof ans.answer === "boolean" ? (
                    ans.answer ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>YES</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>NO</span>
                      </span>
                    )
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

        {/* Attached Photos / Videos */}
        {inspection.media && inspection.media.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              Attached Media ({inspection.media.length})
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {inspection.media.map((m) => (
                <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  {m.type === "photo" ? (
                    <img src={m.url} alt={m.name} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="w-full h-24 bg-slate-900 flex items-center justify-center text-indigo-400">
                      <Video className="w-6 h-6" />
                    </div>
                  )}
                  <p className="p-1.5 text-[10px] text-slate-400 truncate font-mono">{m.name}</p>
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
                if (confirm(`Delete inspection ${inspection.inspectionNumber}?`)) {
                  onDelete(inspection.id);
                  onClose();
                }
              }}
              className="px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Delete Inspection</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition ml-auto cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
