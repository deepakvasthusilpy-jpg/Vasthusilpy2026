import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  CheckCircle2,
  Download,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  FileSpreadsheet,
  Award,
  Layers
} from "lucide-react";
import { EstimateProject } from "../../../data/estimateData";

interface VerificationQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EstimateProject;
}

export const VerificationQRModal: React.FC<VerificationQRModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [selectedTargetTab, setSelectedTargetTab] = useState<"estimate" | "stage" | "completion">("estimate");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const tabQueryParam = selectedTargetTab === "estimate" ? "" : `&tab=${selectedTargetTab}`;
  const verificationUrl = `${window.location.origin}/?verify=${project.id}&hash=${encodeURIComponent(
    project.verificationHash
  )}${tabQueryParam}`;

  useEffect(() => {
    if (project) {
      QRCode.toDataURL(verificationUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [project, verificationUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `VERIFICATION-QR-${project.id}-${selectedTargetTab}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-sans">
                Client Verification QR Code
              </h3>
              <p className="text-[11px] font-mono text-emerald-400">
                ESTIMATE ID: {project.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Document Selector */}
        <div className="bg-slate-950/90 px-5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-1.5 text-xs font-mono">
          <button
            onClick={() => setSelectedTargetTab("estimate")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold transition-all cursor-pointer ${
              selectedTargetTab === "estimate"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Detailed Estimate
          </button>
          <button
            onClick={() => setSelectedTargetTab("stage")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold transition-all cursor-pointer ${
              selectedTargetTab === "stage"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Stage Certificate
          </button>
          <button
            onClick={() => setSelectedTargetTab("completion")}
            className={`flex-1 py-1.5 px-2 rounded-lg text-center font-bold transition-all cursor-pointer ${
              selectedTargetTab === "completion"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            Completion
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Green Notice Banner */}
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800/70 text-emerald-200 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-300 font-sans">Zero-Login Client Verification</div>
              <p className="text-[11px] text-emerald-200/80 leading-relaxed font-sans">
                Scanning this QR code directs strictly to this client&apos;s verified records ({project.clientName}). All other platform tabs remain hidden and protected.
              </p>
            </div>
          </div>

          {/* QR Code Frame */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for Estimate ${project.id}`}
                className="w-48 h-48 object-contain bg-white p-2.5 rounded-xl shadow-lg border border-slate-200"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 text-xs font-mono animate-pulse">
                Generating QR Code...
              </div>
            )}

            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              VERIFICATION TOKEN: <span className="text-emerald-400 font-mono">{project.verificationHash}</span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">CLIENT / OWNER</div>
              <div className="font-bold text-slate-200 truncate">{project.clientName}</div>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">VALUATION AMOUNT</div>
              <div className="font-bold text-emerald-400">
                ₹{project.grandTotal.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Shareable Verification Link */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-400 block font-semibold uppercase">
              SHAREABLE QR LINK
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={verificationUrl}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] font-mono text-slate-300 truncate focus:outline-none selection:bg-emerald-500 selection:text-slate-950"
              />
              <button
                onClick={handleCopyLink}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleDownloadQr}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>

            <button
              onClick={() => {
                window.open(verificationUrl, "_blank");
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Preview Portal</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-2.5 text-center text-[10px] font-mono text-slate-500">
          Vasthusilpy Engineering Valuation &amp; Document Authenticator
        </div>
      </div>
    </div>
  );
};
