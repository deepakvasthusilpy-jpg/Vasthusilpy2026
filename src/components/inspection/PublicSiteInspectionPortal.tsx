import React, { useState, useEffect } from "react";
import { MobileInspectionForm } from "./MobileInspectionForm";
import { SiteInspection } from "../../types/siteInspection";
import QRCode from "qrcode";
import {
  MapPin,
  Smartphone,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  X,
  Sparkles,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  Layers
} from "lucide-react";
import { triggerAppNotification } from "../../context/NotificationContext";

interface PublicSiteInspectionPortalProps {
  onGoToApp?: () => void;
}

export const PublicSiteInspectionPortal: React.FC<PublicSiteInspectionPortalProps> = ({
  onGoToApp
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/?portal=site_inspection`
    : "https://vasthusilpy.com/?portal=site_inspection";

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [publicUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      triggerAppNotification("Public inspection link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      triggerAppNotification("Failed to copy link.", "error");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🏛️ *Vasthusilpy Official Site Inspection Portal*\n\n` +
      `Fill on-site inspection checklist, live GPS coordinates (5-10m precision), and upload photos/videos directly without login:\n\n` +
      `👉 ${publicUrl}\n\n` +
      `Vasthusilpy Architectural & Engineering Consultants`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30">
      {/* 1. TOP BRANDING NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <MapPin className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-white tracking-wide">
                  VASTHUSILPY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30 hidden sm:inline">
                  PUBLIC FIELD ACCESS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono line-clamp-1">
                Site Inspection & Verification Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition cursor-pointer"
              title="Show Mobile QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "Copied!" : "Copy Link"}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {onGoToApp && (
              <button
                onClick={onGoToApp}
                className="ml-1 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <span>Staff Login</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. PUBLIC NOTICE BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border-b border-emerald-500/20 px-4 py-2.5 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-300 font-semibold">
              Zero-Login Public Access:
            </span>
            <span className="text-slate-300">
              Field staff, surveyors & clients can capture and submit inspections directly.
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>📍 5–10m Live GPS</span>
            <span>📸 Photos & Videos</span>
            <span>📄 Auto A4 PDF</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN FORM CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 my-2">
        <MobileInspectionForm />
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-400 space-y-2">
        <p className="font-bold text-slate-300">
          Vasthusilpy Architectural & Engineering Consultants
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          Official Site Inspection & Verification System • WhatsApp: +91 8848241463 • Email: deepak.vasthusilpy@gmail.com
        </p>
      </footer>

      {/* QR Code Modal for Easy Phone Scanning */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Scan to Open On Phone</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan with any smartphone camera to start site inspection on mobile with GPS & camera.
              </p>
            </div>

            {qrCodeDataUrl ? (
              <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
                <img
                  src={qrCodeDataUrl}
                  alt="Site Inspection QR Code"
                  className="w-56 h-56 mx-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="w-56 h-56 mx-auto bg-slate-800 animate-pulse rounded-2xl" />
            )}

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 truncate">
              {publicUrl}
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Public Link"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
