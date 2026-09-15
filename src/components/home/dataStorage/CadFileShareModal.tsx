import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { CADDrawingRecord } from "../../../types/dataStorageTypes";
import { saveCADDrawingRecord, formatBytes } from "../../../utils/dataStorageManager";
import {
  X,
  Share2,
  Copy,
  Check,
  Lock,
  Download,
  Eye,
  MessageCircle,
  Mail,
  QrCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Compass,
  Home,
  Layers,
  Phone,
  User,
  CheckCircle2,
  Printer
} from "lucide-react";

interface CadFileShareModalProps {
  file: CADDrawingRecord;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (file: CADDrawingRecord) => void;
}

export const CadFileShareModal: React.FC<CadFileShareModalProps> = ({
  file,
  isOpen,
  onClose,
  onUpdated
}) => {
  const [isShared, setIsShared] = useState(file.shareSettings?.isShared ?? true);
  const [allowDownload, setAllowDownload] = useState(file.shareSettings?.allowDownload ?? true);
  const [allowEdit, setAllowEdit] = useState(file.shareSettings?.allowEdit ?? false);
  const [pin, setPin] = useState(file.shareSettings?.pin || "");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showQr, setShowQr] = useState(true);

  const shareToken =
    file.shareSettings?.shareToken ||
    `vst-${file.id.toLowerCase()}-${Math.random().toString(36).substr(2, 6)}`;

  const shareUrl = `${window.location.origin}${window.location.pathname}?cad_share=${encodeURIComponent(
    shareToken
  )}`;

  // Generate offline QR Code data URL
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(
      shareUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: "#38bdf8", // Cyan-400
          light: "#090d16" // Slate-950
        }
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [isOpen, shareUrl]);

  // Ensure drawing has active share settings saved
  useEffect(() => {
    if (isOpen && (!file.shareSettings || !file.shareSettings.shareToken)) {
      const updated: CADDrawingRecord = {
        ...file,
        shareSettings: {
          isShared: true,
          shareToken,
          allowDownload: true,
          allowEdit: false,
          pin: pin.trim() || undefined
        },
        updatedAt: new Date().toISOString()
      };
      saveCADDrawingRecord(updated, true);
      onUpdated(updated);
    }
  }, [isOpen, file, shareToken, pin, onUpdated]);

  if (!isOpen) return null;

  const handleToggleShare = (enabled: boolean) => {
    setIsShared(enabled);
    const updated: CADDrawingRecord = {
      ...file,
      shareSettings: {
        isShared: enabled,
        shareToken,
        allowDownload,
        allowEdit,
        pin: pin.trim() || undefined
      },
      updatedAt: new Date().toISOString()
    };
    saveCADDrawingRecord(updated, true);
    onUpdated(updated);
  };

  const handleSaveSettings = () => {
    const updated: CADDrawingRecord = {
      ...file,
      shareSettings: {
        isShared,
        shareToken,
        allowDownload,
        allowEdit,
        pin: pin.trim() || undefined
      },
      updatedAt: new Date().toISOString()
    };
    saveCADDrawingRecord(updated, true);
    onUpdated(updated);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const details = [
      `📐 *VASTHUSILPY ARCHITECTS & ENGINEERS*`,
      `📁 *File:* ${file.name}`,
      `🏷️ *Project:* ${file.projectName}`,
      file.ownerName ? `👤 *Owner:* ${file.ownerName}` : null,
      file.facing ? `🧭 *Facing:* ${file.facing}` : null,
      file.bedrooms ? `🛏️ *Bedrooms:* ${file.bedrooms}` : null,
      file.floors ? `🏢 *Floors:* ${file.floors}` : null,
      file.vasthuChuttu ? `✨ *Vasthu Chuttu:* ${file.vasthuChuttu}` : null,
      file.builtUpArea ? `📏 *Plinth Area:* ${file.builtUpArea}` : null,
      pin ? `🔒 *Security PIN:* ${pin}` : null,
      ``,
      `🔗 *View / Download Architectural Drawings Online:*`,
      shareUrl,
      ``,
      `_Vasthusilpy Architects & Engineers, Keralassery, Palakkad_`
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/?text=${encodeURIComponent(details)}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${file.projectName} - Architectural Drawing Package`,
          text: `Architectural CAD floor plan and blueprint drawings for ${file.projectName}.`,
          url: shareUrl
        });
      } catch (e) {
        // Fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}_QR_Code.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden text-slate-100 font-mono max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Share Drawing & Blueprint Package
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {file.projectName} • {file.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Public Share Status Toggle */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Public Link & QR Access</span>
                {isShared ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Anyone with the link or QR code can view the drawing drawings and download PDFs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleShare(!isShared)}
              className={`w-13 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                isShared ? "bg-cyan-600" : "bg-slate-800"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isShared ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {isShared && (
            <>
              {/* 2. Share Link & Action Buttons */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Direct Drawing Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-950 transition cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="p-3 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>System / AirDrop Share</span>
                </button>
              </div>

              {/* 3. High Resolution QR Code Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Instant Scan & Verify QR Code</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Image</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
                  <div className="p-3 rounded-2xl bg-[#090d16] border border-cyan-800/80 shadow-xl inline-block">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code"
                        className="w-40 h-40 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center text-xs text-slate-500">
                        Generating QR...
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-center sm:text-left text-xs text-slate-400 max-w-xs">
                    <p className="font-bold text-slate-200">Print on Site or Send to Client</p>
                    <p className="text-[11px] leading-relaxed">
                      Clients & site supervisors can scan with any phone camera to instantly view full plans, PDF sheets, and dimensions.
                    </p>
                    <div className="pt-1">
                      <a
                        href={shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Test Public Share Link</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Security PIN Settings */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Optional Security PIN Protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. 1234 (Leave blank for no PIN)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    Save PIN
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500">
            Vasthusilpy Engineering System • Keralassery, Palakkad
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-950 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
