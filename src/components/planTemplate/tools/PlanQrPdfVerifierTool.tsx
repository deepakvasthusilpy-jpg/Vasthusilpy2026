import React, { useState, useEffect } from "react";
import { BuildingPlanProject, PlanSheet } from "../../../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "../../../data/vasthusilpyLogo";
import { buildPlanVerificationUrl, generatePlanQrCodeDataUrl } from "../../../utils/qrCodeGenerator";
import {
  QrCode,
  Download,
  Phone,
  MessageSquare,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Eye,
  FileText,
  Printer
} from "lucide-react";

interface PlanQrPdfVerifierToolProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onDownloadPdf: () => void;
  onOpenPortalModal: () => void;
}

export const PlanQrPdfVerifierTool: React.FC<PlanQrPdfVerifierToolProps> = ({
  project,
  activeSheet,
  onDownloadPdf,
  onOpenPortalModal
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCall, setCopiedCall] = useState(false);

  const engineerPhone = project.engineerCallNumber || ENGINEER_CONTACT_DETAILS.phoneCall;
  const engineerWhatsappRaw = (project.engineerWhatsappNumber || ENGINEER_CONTACT_DETAILS.whatsappNumber).replace(/[^0-9]/g, "");
  const officeName = project.officeName || ENGINEER_CONTACT_DETAILS.officeName;

  const verificationUrl = buildPlanVerificationUrl({
    projectId: project.id,
    sheetId: activeSheet.id,
    drawingNumber: activeSheet.drawingNumber || "DWG-2026/01",
    drawingName: activeSheet.drawingName || "Architectural Floor Plan",
    clientName: project.clientName || "Client",
    engineerCall: engineerPhone,
    engineerWhatsapp: engineerWhatsappRaw
  });

  useEffect(() => {
    let isMounted = true;
    generatePlanQrCodeDataUrl(verificationUrl).then((url) => {
      if (isMounted) setQrCodeDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [verificationUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCall = () => {
    navigator.clipboard.writeText(engineerPhone);
    setCopiedCall(true);
    setTimeout(() => setCopiedCall(false), 2000);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello ${officeName},\nI scanned the QR code on plan: ${activeSheet.drawingName} (${activeSheet.drawingNumber || "DWG"}). Client: ${project.clientName}. Please provide architectural guidance.`
  );
  const whatsappUrl = `https://wa.me/${engineerWhatsappRaw}?text=${whatsappMessage}`;
  const callUrl = `tel:${engineerPhone}`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-500 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">QR Code & PDF Download Hub</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Every printed sheet includes this high-resolution QR code. When scanned by clients, panchayat officials, or contractors, the PDF is downloaded to their device and engineer contact options (Call {engineerPhone} / WhatsApp +91 88482 41463) automatically appear.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadPdf}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors shadow-md"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Plan PDF</span>
          </button>
          <button
            onClick={onOpenPortalModal}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-red-600/20 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>Simulate Mobile Scan</span>
          </button>
        </div>
      </div>

      {/* Main Grid: QR Code Spec & Mobile Experience Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: Live QR Code & Sheet Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Sheet QR Code
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {activeSheet.drawingNumber || "DWG-2026/01"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="w-40 h-40 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center flex-shrink-0 border-2 border-red-500/40">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Sheet QR Code" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <QrCode className="w-12 h-12" />
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs w-full">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">DRAWING TITLE</span>
                <span className="font-bold text-white text-sm">{activeSheet.drawingName || "Floor Plan"}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">CLIENT</span>
                <span className="text-slate-300 font-semibold">{project.clientName}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">CONSULTING ENGINEER</span>
                <span className="text-slate-300">{project.licenseeName} (Supervisor-A Civil)</span>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1 border border-slate-700"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink ? "Copied Link" : "Copy Scan URL"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Scan instructions */}
          <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200/90 leading-relaxed">
            <strong>How scanning works:</strong> Point any smartphone camera at the QR code on the printed sheet or blueprint. It immediately loads the verified Vasthusilpy digital plan with instantaneous PDF downloading and one-tap engineer contact triggers.
          </div>
        </div>

        {/* Right Card: Automatic Engineer Contact Action Center */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-red-500" />
              Automatic Engineer Contact Options
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Verified Numbers
            </span>
          </div>

          <div className="space-y-3">
            {/* Direct Call Button */}
            <a
              href={callUrl}
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-500/30 hover:border-red-500/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Call Consulting Engineer</div>
                  <div className="text-xs font-mono text-red-400 font-semibold">{engineerPhone}</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-red-400 group-hover:text-red-300 flex items-center gap-1">
                <span>Direct Dial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>

            {/* Direct WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/70 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">WhatsApp to Mobile</div>
                  <div className="text-xs font-mono text-emerald-400 font-semibold">+91 88482 41463</div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
                <span>Start Chat</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>

            {/* Engineer Profile Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Firm Name:</span>
                <span className="text-slate-200 font-bold uppercase">{officeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Engineer / Vasthu Silpy:</span>
                <span className="text-slate-200 font-bold">{project.licenseeName || "Deepak .C"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registration:</span>
                <span className="text-slate-300 font-mono">{project.registrationNumber}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
