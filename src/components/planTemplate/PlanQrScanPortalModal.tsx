import React, { useState } from "react";
import { BuildingPlanProject, PlanSheet } from "../../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "../../data/vasthusilpyLogo";
import { getCloudDownloadUrl } from "../../utils/cloudPlanSync";
import { Phone, MessageSquare, Download, CheckCircle, ShieldCheck, ExternalLink, X, FileText, Share2, Copy, Check, Cloud, CloudDownload } from "lucide-react";

interface PlanQrScanPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: BuildingPlanProject;
  sheet: PlanSheet;
  onDownloadPdf?: () => void;
}

export const PlanQrScanPortalModal: React.FC<PlanQrScanPortalModalProps> = ({
  isOpen,
  onClose,
  project,
  sheet,
  onDownloadPdf
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadInitiated, setDownloadInitiated] = useState(false);

  if (!isOpen) return null;

  const engineerPhone = project.engineerCallNumber || ENGINEER_CONTACT_DETAILS.phoneCall;
  const engineerWhatsapp = (project.engineerWhatsappNumber || ENGINEER_CONTACT_DETAILS.whatsappNumber).replace(/[^0-9]/g, "");
  const officeName = project.officeName || ENGINEER_CONTACT_DETAILS.officeName;

  const directCloudDownloadUrl = getCloudDownloadUrl(project.id, sheet.id);

  const whatsappMessage = encodeURIComponent(
    `Hello ${officeName},\nI am inquiring about architectural plan: ${sheet.drawingName} (${sheet.drawingNumber || "DWG"}). Client: ${project.clientName}. Please share further construction details.`
  );

  const whatsappUrl = `https://wa.me/${engineerWhatsapp}?text=${whatsappMessage}`;
  const callUrl = `tel:${engineerPhone}`;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(engineerPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyCloudLink = () => {
    const publicUrl = `${window.location.origin}/?tab=public_plan_portal&projId=${encodeURIComponent(project.id)}&sheetId=${encodeURIComponent(sheet.id)}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownload = () => {
    setDownloadInitiated(true);
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      window.open(directCloudDownloadUrl, "_blank");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header with Vasthusilpy Red Branding */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-white p-0.5 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={project.logoUrl || VASTHUSILPY_LOGO_DATA_URL}
                alt="Vasthusilpy Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wide uppercase mb-1">
                <ShieldCheck className="w-3 h-3 text-white" />
                Verified Digital Plan
              </div>
              <h2 className="text-lg font-black tracking-tight leading-tight uppercase">
                {officeName}
              </h2>
              <p className="text-xs text-red-100 font-medium">
                {project.licenseeName || "Deepak .C"} • {project.licenseNumber || "Supervisor-A (Civil)"}
              </p>
            </div>
          </div>
        </div>

        {/* Cloud Saved Notice Pill */}
        <div className="bg-emerald-50 px-5 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-1.5 font-semibold">
            <Cloud className="w-4 h-4 text-emerald-600" />
            <span>Saved to Cloud Drive (Zero Login)</span>
          </div>
          <button
            onClick={handleCopyCloudLink}
            className="text-[11px] font-mono font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy QR Link</span>
              </>
            )}
          </button>
        </div>

        {/* Plan Details Card */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                  DRAWING NUMBER
                </span>
                <span className="text-base font-black font-mono text-slate-900">
                  {sheet.drawingNumber || "DWG-2026/01"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                  REVISION / DATE
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {sheet.revision || "R0"} • {sheet.date || project.defaultDate}
                </span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 uppercase leading-snug mb-2">
              {sheet.drawingName || "Architectural Floor Plan"}
            </h3>

            <div className="space-y-1 text-xs border-t border-slate-200 pt-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Client:</span>
                <span className="font-bold text-slate-900">{project.clientName || "Client"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="text-right font-medium max-w-[200px] truncate">{project.projectLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Drawing Scale:</span>
                <span className="font-mono font-bold text-slate-900">{sheet.scale || project.defaultScale}</span>
              </div>
            </div>
          </div>

          {/* 1. PDF DOWNLOAD BUTTON */}
          <div className="space-y-2">
            <button
              onClick={handleDownload}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer"
            >
              <Download className="w-5 h-5 text-emerald-400" />
              <span>Download Cloud Saved PDF (No Login)</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              {downloadInitiated ? (
                <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> PDF download started on your device
                </span>
              ) : (
                "Public cloud file with complete 3-column Area Statement & Vasthu measurements"
              )}
            </p>
          </div>

          {/* 2. AUTOMATIC ENGINEER CONTACT PANEL */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-600" />
                Contact Consulting Engineer
              </h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Direct Contact
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Call Option */}
              <a
                href={callUrl}
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-300 transition-colors group text-center"
              >
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-1 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Call Engineer</span>
                <span className="text-[11px] font-mono text-slate-600 font-semibold">{engineerPhone}</span>
              </a>

              {/* WhatsApp Option */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-colors group text-center"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">WhatsApp Chat</span>
                <span className="text-[11px] font-mono text-slate-600 font-semibold">+91 88482 41463</span>
              </a>
            </div>

            {/* Copy phone number option */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Engineer: <strong>{project.licenseeName || "Deepak .C"}</strong></span>
              <button
                onClick={handleCopyPhone}
                className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                {copiedPhone ? (
                  <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy Number
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
          K-SMART / KPBR 2019 / KMBR 2019 Standard Architectural Drawing • Vasthusilpy Cloud Drive
        </div>

      </div>
    </div>
  );
};
