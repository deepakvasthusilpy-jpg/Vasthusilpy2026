import React, { useState, useEffect } from "react";
import { MobileInspectionForm } from "./MobileInspectionForm";
import { InspectionDashboard } from "./InspectionDashboard";
import { DynamicQuestionBuilder } from "./DynamicQuestionBuilder";
import { InspectionIntegrationGuide } from "./InspectionIntegrationGuide";
import { loadSiteInspections } from "../../utils/siteInspectionManager";
import { triggerAppNotification } from "../../context/NotificationContext";
import QRCode from "qrcode";
import {
  MapPin,
  Smartphone,
  LayoutDashboard,
  Layers,
  Server,
  FileText,
  Share2,
  Sparkles,
  Download,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  X,
  Globe,
  Lock,
  Unlock
} from "lucide-react";

type InspectionTab = "mobile_form" | "admin_dashboard" | "question_builder" | "backend_guide";

export const SiteInspectionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectionTab>("mobile_form");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const inspections = loadSiteInspections();

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
      triggerAppNotification("Public Site Inspection link copied to clipboard!", "success");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      triggerAppNotification("Failed to copy link.", "error");
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🏛️ *Vasthusilpy Official Site Inspection Portal*\n\n` +
      `Access the on-site inspection form, live GPS tagging (5-10m precision), and upload photos/videos directly without login:\n\n` +
      `👉 ${publicUrl}\n\n` +
      `Vasthusilpy Architectural & Engineering Consultants`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5 pb-20">
      {/* 0. PUBLIC ZERO-LOGIN SHAREABLE LINK BANNER (FEATURED AT TOP) */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Unlock className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Public Direct Access Link (No Login Required)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                    ZERO LOGIN
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300">
                  Share this link with on-site staff, surveyors, or clients. They can fill checklist, capture GPS, and submit media without needing an account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Show QR Code for phone"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">QR Code</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                title="Share via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Share</span>
              </button>
            </div>
          </div>

          {/* URL Bar & Actions */}
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1 px-1">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs font-mono text-emerald-400 truncate select-all">
                {publicUrl}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Public Link"}</span>
              </button>

              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <span>Open Portal</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TOP HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <MapPin className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                <span>Site Inspection Module</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono uppercase font-bold">
                  Mobile Field App
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Mobile-optimized field data entry with GPS tagging, media uploads, dynamic checklists & automated triggers
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Submitted:</span>
              <strong className="text-emerald-400 font-bold font-mono text-sm">{inspections.length}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("mobile_form")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "mobile_form"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Field Inspection Form</span>
          </button>

          <button
            onClick={() => setActiveTab("admin_dashboard")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "admin_dashboard"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Inspections Dashboard</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "admin_dashboard" ? "bg-slate-950/30 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
              }`}
            >
              {inspections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("question_builder")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "question_builder"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dynamic Question Builder</span>
          </button>

          <button
            onClick={() => setActiveTab("backend_guide")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "backend_guide"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Backend Architecture & APIs</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT */}
      {activeTab === "mobile_form" && (
        <MobileInspectionForm
          onOpenDashboard={() => setActiveTab("admin_dashboard")}
        />
      )}

      {activeTab === "admin_dashboard" && (
        <InspectionDashboard
          onNewInspectionClick={() => setActiveTab("mobile_form")}
        />
      )}

      {activeTab === "question_builder" && <DynamicQuestionBuilder />}

      {activeTab === "backend_guide" && <InspectionIntegrationGuide />}

      {/* QR Code Modal for Easy Phone Scanning */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Scan to Open On Phone</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan with any smartphone camera to open the public site inspection form (no login required).
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

            <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-emerald-400 truncate select-all">
              {publicUrl}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
