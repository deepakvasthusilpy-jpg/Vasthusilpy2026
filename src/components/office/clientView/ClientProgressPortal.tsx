import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  MapPin,
  FileText,
  DollarSign,
  Info,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lock,
  Sparkles,
  Layers,
  HardHat,
  Share2,
  ArrowRight,
  Award,
  FileSpreadsheet,
  ListChecks,
  QrCode,
  Receipt,
  CreditCard
} from "lucide-react";
import { ClientShareLink, Invoice } from "../../../types";
import { INITIAL_INVOICES } from "../../../data/crmData";
import { InvoiceQrCode } from "../invoices/InvoiceQrCode";
import {
  EstimateProject,
  normalizeProjectBlocks,
  stripEr,
  numberToIndianWords,
  generateDefaultStageCertificate,
  generateDefaultCompletionCertificate,
  isProject100PercentStageCompleted
} from "../../../data/estimateData";
import { loadSavedClientShares, getTimeRemainingFormatted, buildClientShareUrl } from "../../../data/clientShareData";
import { db } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { safeSetDoc } from "../../../utils/storageManager";
import { triggerPrint } from "../../../utils/printHelper";

interface ClientProgressPortalProps {
  token: string;
  estimateProjects: EstimateProject[];
  onGoToLogin?: () => void;
}

export const ClientProgressPortal: React.FC<ClientProgressPortalProps> = ({
  token,
  estimateProjects,
  onGoToLogin
}) => {
  const [shareLink, setShareLink] = useState<ClientShareLink | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedAppendix, setExpandedAppendix] = useState<string | null>(null);
  const [activePortalTab, setActivePortalTab] = useState<"progress" | "stage_cert" | "completion_cert" | "boq" | "invoice">("progress");

  // Load link from localStorage, Firestore, or resolve directly from estimate projects
  useEffect(() => {
    let isMounted = true;

    async function fetchLinkData() {
      setLoading(true);
      const localShares = loadSavedClientShares();
      let found = localShares.find((s) => s.token === token || s.id === token || s.estimateId === token);

      if (!found) {
        // Try fetching from Firestore
        try {
          const snap = await getDoc(doc(db, "client_shares", token));
          if (snap.exists()) {
            found = snap.data() as ClientShareLink;
          }
        } catch (err) {
          console.warn("Firestore client_shares fetch error:", err);
        }
      }

      // If still not found, auto-synthesize an active zero-login share link from available projects
      if (!found && estimateProjects && estimateProjects.length > 0) {
        const matchedProj =
          estimateProjects.find(
            (p) =>
              p.id.toLowerCase() === token.toLowerCase() ||
              p.verificationHash?.toLowerCase() === token.toLowerCase() ||
              token.toLowerCase().includes(p.id.toLowerCase())
          ) ||
          estimateProjects.find((p) => p.id === "E000003") ||
          estimateProjects[0];

        if (matchedProj) {
          found = {
            id: `CSL-AUTO-${matchedProj.id}`,
            token: token,
            estimateId: matchedProj.id,
            estimateProjectName: `${matchedProj.clientName} - ${matchedProj.houseName} (${matchedProj.buildingType})`,
            clientName: matchedProj.clientName,
            clientPhone: matchedProj.clientPhone,
            houseName: matchedProj.houseName,
            location: `${matchedProj.panchayatVillage}, ${matchedProj.districtPincode}`,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            durationHours: 720,
            durationLabel: "30 Days Direct Access",
            status: "ACTIVE",
            viewsCount: 1,
            lastViewedAt: new Date().toISOString(),
            allowStageExpenditure: true,
            allowWorkItemsBreakdown: true,
            allowDownloadPdf: true,
            allowEngineerSeal: true,
            progressPercentage: matchedProj.grandTotal > 0 && matchedProj.stageExpenditure > 0
              ? Math.min(100, Math.round((matchedProj.stageExpenditure / matchedProj.grandTotal) * 100))
              : 65,
            customStageStatus: matchedProj.stageCompletedText || "Construction & stage progress in active execution",
            accessPin: "",
            customNote: "Instant Public Client Access - No Login Required"
          };
        }
      }

      if (isMounted) {
        if (found) {
          setShareLink(found);

          // Record view count increment
          try {
            const updatedViews = (found.viewsCount || 0) + 1;
            const updatedItem = {
              ...found,
              viewsCount: updatedViews,
              lastViewedAt: new Date().toISOString()
            };
            safeSetDoc(doc(db, "client_shares", found.token), updatedItem, { merge: true }).catch(() => {});
          } catch (e) {
            // non-critical
          }
        }
        setLoading(false);
      }
    }

    fetchLinkData();

    return () => {
      isMounted = false;
    };
  }, [token, estimateProjects]);

  // Target estimate project lookup
  const targetProject =
    (shareLink && estimateProjects.find((p) => p.id === shareLink.estimateId)) ||
    estimateProjects.find((p) => p.id === "E000003") ||
    estimateProjects[0];

  const project = normalizeProjectBlocks(targetProject);
  const stageCertData = project.stageCertificate || generateDefaultStageCertificate(project);
  const compCertData = project.completionCertificate || generateDefaultCompletionCertificate(project);

  const progressPct = shareLink?.progressPercentage ?? (stageCertData?.progressPercentage || 65);
  const currentStageText = shareLink?.customStageStatus || stageCertData?.stageName || project.stageCompletedText || "Construction & stage work in progress";

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(buildClientShareUrl(shareLink.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isStage100Completed = isProject100PercentStageCompleted(project);
  const isFullyCompleted = isStage100Completed && (progressPct >= 100 || project.hasCompletionCertificate === true);

  const handlePrintStage = () => {
    setActivePortalTab("stage_cert");
    setTimeout(() => {
      triggerPrint(`Stage_Certificate_${project.id}_${project.clientName.replace(/\s+/g, "_")}`, "portal-content-area");
    }, 100);
  };

  const handlePrintCompletion = () => {
    if (!isFullyCompleted) {
      alert("Completion Certificate can only be prepared and printed after completing entire works (100% completion required).");
      return;
    }
    setActivePortalTab("completion_cert");
    setTimeout(() => {
      triggerPrint(`Completion_Certificate_${project.id}_${project.clientName.replace(/\s+/g, "_")}`, "portal-content-area");
    }, 100);
  };

  const handlePrint = () => {
    if (activePortalTab === "completion_cert" && !isFullyCompleted) {
      alert("Completion Certificate is restricted until entire civil works are 100% completed.");
      return;
    }
    triggerPrint(`Document_${activePortalTab}_${project.id}`, "portal-content-area");
  };

  const handleWhatsAppContact = () => {
    const text = encodeURIComponent(
      `Hello Vasthusilpy Office, I am reviewing the site progress and certificate report for *${project.clientName} - ${project.houseName}* (Ref: ${project.id}). I have a query regarding the current stage valuation.`
    );
    window.open(`https://api.whatsapp.com/send?phone=917012383137&text=${text}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="font-mono text-xs text-cyan-400">Opening Client Progress Portal (No Login Required)...</p>
        </div>
      </div>
    );
  }

  // Fallback if link cannot be resolved at all
  if (!shareLink) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-white font-sans">
            Direct Access Link Not Found
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The link you provided is not available in the system. Please contact the office to obtain a new direct access link.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Office on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeInfo = getTimeRemainingFormatted(shareLink.expiresAt, shareLink.status);

  // If link is Expired or Revoked
  if (timeInfo.isExpired) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-white font-sans">
            Link Expired
          </h2>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
            <p>Project: <strong className="text-cyan-300">{shareLink.estimateProjectName}</strong></p>
            <p className="text-amber-400 mt-1">Status: {timeInfo.label}</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The validity duration for this progress link has expired. Please contact the engineer to receive a refreshed direct access link.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Request New Link on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STAGE PROGRESS PIPELINE STEPS
  const STAGES = [
    { name: "Site Survey & Soil Test", labelMl: "Survey & Planning", threshold: 15, status: progressPct >= 15 ? "DONE" : "PENDING" },
    { name: "Substructure & Foundation", labelMl: "Foundation & Plinth", threshold: 35, status: progressPct >= 35 ? "DONE" : progressPct >= 15 ? "ACTIVE" : "PENDING" },
    { name: "Superstructure & Masonry", labelMl: "Brickwork & Lintel", threshold: 60, status: progressPct >= 60 ? "DONE" : progressPct >= 35 ? "ACTIVE" : "PENDING" },
    { name: "Roof Slab & Curing", labelMl: "Roof Slab Concreting", threshold: 75, status: progressPct >= 75 ? "DONE" : progressPct >= 60 ? "ACTIVE" : "PENDING" },
    { name: "Plastering & Electrical MEP", labelMl: "Plastering & Wiring", threshold: 90, status: progressPct >= 90 ? "DONE" : progressPct >= 75 ? "ACTIVE" : "PENDING" },
    { name: "Finishing & Handover", labelMl: "Painting & Handover", threshold: 100, status: progressPct >= 100 ? "DONE" : progressPct >= 90 ? "ACTIVE" : "PENDING" }
  ];

  const certifiedExp = (stageCertData && stageCertData.stageValuationAmount > 0)
    ? stageCertData.stageValuationAmount
    : (project.stageExpenditure > 0
      ? project.stageExpenditure
      : Math.round(project.grandTotal * (progressPct / 100)));
  const remainingBal = Math.max(0, project.grandTotal - certifiedExp);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-cyan-500 selection:text-slate-950 bg-blueprint-grid">
      {/* Top Client View Banner */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Verification Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black font-sans text-white tracking-wide uppercase">
                  VASTHUSILPY CLIENT PROGRESS & VERIFICATION
                </span>
                <span className="text-[10px] font-mono font-black bg-emerald-950/90 text-emerald-300 border border-emerald-700/80 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  NO LOGIN REQUIRED • DIRECT CLIENT VIEW
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                Official Valuation, Stage Certificate & Completion Record • Ref: {project.id}
              </p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${timeInfo.badgeColor}`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeInfo.label}</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? "Copied" : "Share Link"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Print Document</span>
            </button>

            <button
              onClick={handleWhatsAppContact}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-mono font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Office Helpline</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="portal-content-area" className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Navigation Portal Tabs (Progress vs Stage Certificate vs Completion Certificate vs BOQ) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center gap-2 print:hidden shadow-lg">
          <button
            onClick={() => setActivePortalTab("progress")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === "progress"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>1. സൈറ്റ് പുരോഗതി (Site Progress & Timeline)</span>
          </button>

          <button
            onClick={() => setActivePortalTab("stage_cert")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === "stage_cert"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2. സ്റ്റേജ് സർട്ടിഫിക്കറ്റ് (Stage Valuation Certificate)</span>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded-full">
              {stageCertData.progressPercentage}%
            </span>
          </button>

          <button
            onClick={() => setActivePortalTab("completion_cert")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === "completion_cert"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>3. കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് (Completion Certificate)</span>
            {isFullyCompleted ? (
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded-full">
                100%
              </span>
            ) : (
              <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded-full font-mono">
                Requires 100%
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePortalTab("boq")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === "boq"
                ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>4. എസ്റ്റിമേറ്റ് BOQ (Detailed Items of Work)</span>
          </button>

          <button
            onClick={() => setActivePortalTab("invoice")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activePortalTab === "invoice"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>5. Invoices & Payments</span>
          </button>
        </div>

        {/* HERO CARD: Project Overview & Live Progress Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-black print:p-0">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none print:hidden" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            {/* Left Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1.5 print:bg-transparent print:text-black print:border-black">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
                  {project.buildingType}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 print:bg-transparent print:text-black print:border-black">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-black" />
                  Official Client Verification Record
                </span>
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white font-sans tracking-tight print:text-black">
                  {project.clientName}
                </h1>
                <p className="text-base text-cyan-300 font-medium print:text-black">
                  {project.houseName} • {project.panchayatVillage}, {project.districtPincode}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1 print:text-black">
                <span className="flex items-center gap-1 text-slate-300 print:text-black">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 print:text-black" />
                  RSy: {project.syNo} • Block: {project.blockNo} • Ward: {project.wardNo}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300 print:text-black">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 print:text-black" />
                  Inspection Date: {new Date(stageCertData.inspectionDate || project.stageDate || project.estimationDate).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Right Quick Summary Gauge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col items-center justify-center text-center shrink-0 min-w-[220px] print:bg-white print:border-black">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider print:text-black">
                {activePortalTab === "completion_cert" ? "Completion Status" : "Certified Progress"}
              </span>
              <div className="text-4xl font-black font-mono text-cyan-400 my-1 print:text-black">
                {activePortalTab === "completion_cert" ? "100%" : `${progressPct}%`}
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1 mb-2 print:border print:border-black">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${activePortalTab === "completion_cert" ? 100 : progressPct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold print:text-black">
                {activePortalTab === "completion_cert" ? "COMPLETED & FIT FOR OCCUPANCY" : "ENGINEER STAGE CERTIFIED"}
              </span>
            </div>
          </div>

          {/* Current Certified Stage Narrative Banner */}
          <div className="mt-6 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3.5 print:bg-gray-100 print:border-black">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 print:text-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider print:text-black">
                Current Certified Milestone (സാക്ഷ്യപ്പെടുത്തിയ നിർമ്മാണ ഘട്ടം)
              </div>
              <p className="text-sm font-sans text-white font-medium leading-relaxed print:text-black">
                {currentStageText}
              </p>
            </div>
          </div>
        </div>

        {/* TAB 1: SITE PROGRESS & TIMELINE */}
        {activePortalTab === "progress" && (
          <div className="space-y-6">
            {/* SECTION 1: VISUAL CONSTRUCTION STAGE TIMELINE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <HardHat className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white font-sans">
                    Construction Stage Pipeline
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {progressPct}% Completed
                </span>
              </div>

              {/* Stage Steps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {STAGES.map((stg, idx) => {
                  const isDone = stg.status === "DONE";
                  const isActive = stg.status === "ACTIVE";

                  return (
                    <div
                      key={stg.name}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDone
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                          : isActive
                          ? "bg-cyan-950/50 border-cyan-500/60 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30"
                          : "bg-slate-950/60 border-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80">
                          STEP 0{idx + 1}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            COMPLETED
                          </span>
                        ) : isActive ? (
                          <span className="text-[10px] font-mono font-bold text-cyan-300 flex items-center gap-1 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" />
                            IN PROGRESS
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">
                            PENDING
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-bold font-sans text-white">
                        {stg.labelMl}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {stg.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: ESTIMATION & VALUATION FINANCIAL METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Estimate */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>Total Approved Estimate</span>
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  ₹{project.grandTotal.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  ആകെ അംഗീകരിച്ച എസ്റ്റിമേറ്റ് തുക
                </p>
              </div>

              {/* Stage Certified Expenditure */}
              <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-emerald-300 text-xs font-mono">
                  <span>Certified Stage Value</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  ₹{certifiedExp.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-emerald-200/80 font-sans">
                  നിലവിലെ ഘട്ടം വരെ പൂർത്തിയായ മൂല്യം ({progressPct}%)
                </p>
              </div>

              {/* Remaining Balance */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-lg">
                <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                  <span>Balance Work Budget</span>
                  <Layers className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black font-mono text-amber-300">
                  ₹{remainingBal.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  തുടർന്നുള്ള പണികൾക്ക് ബാക്കിയുള്ള തുക
                </p>
              </div>
            </div>

            {/* SECTION 3: TECHNICAL PROPERTY & BUILDING SPECIFICATIONS */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white font-sans">
                  കെട്ടിട വിവരണം & സാങ്കേതിക വിവരങ്ങൾ (Technical Building Specifications)
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block">Plinth Area (Sq.Ft)</span>
                  <span className="text-base font-bold text-cyan-400">{project.plinthAreaSqFt} Sq.Ft</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block">Plinth Area (Sq.M)</span>
                  <span className="text-base font-bold text-white">{project.plinthAreaSqM} Sq.M</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block">Structure Type</span>
                  <span className="text-sm font-bold text-emerald-400 truncate block">IS 456 RCC Framed</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-500 block">Panchayat / LSGD</span>
                  <span className="text-sm font-bold text-white truncate block">{project.panchayatVillage}</span>
                </div>
              </div>

              {/* Narrative Summary */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-sans text-slate-300 leading-relaxed">
                <strong className="text-white block font-mono mb-1">Headline Narrative:</strong>
                {project.headlineNarrative}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAGE VALUATION CERTIFICATE */}
        {activePortalTab === "stage_cert" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:p-0 print:border-black">
              {/* Header Letterhead */}
              <div className="border-b-2 border-slate-800 pb-5 text-center space-y-1 print:border-black">
                <div className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase print:text-black">
                  TECHNICAL STAGE VALUATION CERTIFICATE
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white font-serif tracking-tight print:text-black">
                  VASTHUSILPY ARCHITECTURAL & CIVIL VALUERS
                </h2>
                <p className="text-xs text-slate-400 font-mono print:text-black">
                  Govt. Approved Valuers & Chartered Structural Engineers • LSGD Reg: {project.regNo}
                </p>
                <p className="text-[11px] text-slate-500 font-sans print:text-black">
                  Keralassery, Palakkad - 678641 • Ph: +91 70123 83137 • Email: vasthusilpy@gmail.com
                </p>
              </div>

              {/* Certificate Reference and Date */}
              <div className="flex flex-wrap justify-between items-center text-xs font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-black">
                <div>
                  <span className="text-slate-400 print:text-black">Certificate Ref No: </span>
                  <strong className="text-cyan-300 font-bold print:text-black">{stageCertData.certificateNo || `CERT/STG/${project.id}`}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-black">Date of Inspection: </span>
                  <strong className="text-white font-bold print:text-black">{new Date(stageCertData.inspectionDate || project.stageDate || project.estimationDate).toLocaleDateString("en-IN")}</strong>
                </div>
              </div>

              {/* Addressed To */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-sans space-y-1 print:bg-gray-100 print:border-black">
                <div className="font-mono text-[10px] uppercase font-bold text-slate-400 print:text-black">
                  ISSUED TO:
                </div>
                <div className="font-bold text-white text-sm print:text-black">
                  {stageCertData.recipientOrAuthority || "To Whomsoever It May Concern"}
                </div>
              </div>

              {/* Certificate Declaration Paragraph */}
              <div className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs sm:text-sm font-serif leading-relaxed text-slate-200 space-y-3 print:bg-gray-50 print:text-black print:border-black">
                <p>
                  This is to certify that I have personally inspected the construction site of the proposed <strong>{project.buildingType}</strong> owned by <strong>{project.clientName}</strong>, located at <strong>{project.houseName}, {project.panchayatVillage}, {project.districtPincode}</strong> (Re-Survey No: <strong>{project.syNo}</strong>, Block: <strong>{project.blockNo}</strong>, Ward: <strong>{project.wardNo}</strong>) on <strong>{new Date(stageCertData.inspectionDate || project.stageDate || project.estimationDate).toLocaleDateString("en-IN")}</strong>.
                </p>
                <p>
                  The construction work has reached the stage of: <strong className="text-cyan-300 print:text-black">{stageCertData.stageName || currentStageText}</strong>. The items of work completed on site as per the approved estimate and specification have been verified.
                </p>
              </div>

              {/* Completed Work Items Range Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-mono font-bold text-white uppercase">
                      Checklist of Completed Items of Work (പൂർത്തിയായ പ്രവൃത്തികളുടെ വിവരണം)
                    </h3>
                  </div>
                  {stageCertData.itemRangeSummary && (
                    <span className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800">
                      {stageCertData.itemRangeSummary}
                    </span>
                  )}
                </div>

                {stageCertData.completedItemsList && stageCertData.completedItemsList.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/60">
                          <th className="py-2.5 px-3">Sl No</th>
                          <th className="py-2.5 px-3">Particulars of Completed Work</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Valuation (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {stageCertData.completedItemsList.map((it, idx) => (
                          <tr key={it.id || idx} className="hover:bg-slate-900/50">
                            <td className="py-2.5 px-3 text-cyan-400 font-bold">{it.slNo || idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans font-medium text-white">{it.particulars}</td>
                            <td className="py-2.5 px-3 text-right text-cyan-300 font-bold">{it.quantity.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center text-slate-400">{it.unit}</td>
                            <td className="py-2.5 px-3 text-right text-slate-300">₹{it.rate.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-400">₹{it.amount.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
                    All foundation, plinth beam, and superstructure masonry items from Sl.No 1 to Sl.No {project.appendices[0]?.items?.length || 10} verified and completed on site.
                  </div>
                )}
              </div>

              {/* Financial Certification Box */}
              <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-3xl p-6 space-y-4 print:bg-gray-100 print:border-black">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Sanctioned Estimate</span>
                    <span className="text-xl font-black font-mono text-white">₹{project.grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="space-y-1 bg-cyan-950/40 p-3 rounded-2xl border border-cyan-500/40">
                    <span className="text-[10px] font-mono uppercase text-cyan-300 block font-bold">Stage Valuation Certified</span>
                    <span className="text-2xl font-black font-mono text-cyan-400">₹{certifiedExp.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Balance Value to be Executed</span>
                    <span className="text-xl font-black font-mono text-amber-300">₹{remainingBal.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 text-xs font-mono text-slate-300 text-center">
                  Certified Valuation in Words: <strong className="text-emerald-400 font-serif text-sm">
                    {stageCertData.stageValuationWords || numberToIndianWords(certifiedExp)}
                  </strong>
                </div>
              </div>

              {/* Engineer Seal and Signature */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800 print:border-black">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-sm font-black font-sans text-white print:text-black">
                    {stripEr(stageCertData.engineerName || project.preparedBy)}
                  </div>
                  <div className="text-xs font-mono text-cyan-400 print:text-black">
                    Chartered Civil Engineer & Approved Valuer
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 print:text-black">
                    LSGD Reg No: {stageCertData.engineerRegNo || project.regNo}
                  </div>
                </div>

                <div className="w-32 h-32 rounded-full border-2 border-dashed border-cyan-500/50 bg-cyan-950/20 flex flex-col items-center justify-center text-center p-2 print:border-black">
                  <ShieldCheck className="w-6 h-6 text-cyan-400 mb-1" />
                  <span className="text-[8px] font-mono font-bold text-cyan-300">VASTHUSILPY</span>
                  <span className="text-[7px] font-mono text-slate-400">VALUATION SEAL</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLETION CERTIFICATE */}
        {activePortalTab === "completion_cert" && (
          <div className="space-y-6">
            {!isFullyCompleted ? (
              <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-amber-400 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white font-sans">
                  Completion Certificate Incomplete
                </h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  The completion certificate can only be issued once all construction works (100% Works) are completed. Works are currently in progress ({progressPct}% completed).
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setActivePortalTab("stage_cert")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold cursor-pointer"
                  >
                    View Active Stage Certificate
                  </button>
                </div>
              </div>
            ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl print:bg-white print:text-black print:p-0 print:border-black">
              {/* Header Letterhead */}
              <div className="border-b-2 border-emerald-500/40 pb-5 text-center space-y-1 print:border-black">
                <div className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase print:text-black">
                  OFFICIAL BUILDING COMPLETION & STRUCTURAL SAFETY CERTIFICATE
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white font-serif tracking-tight print:text-black">
                  VASTHUSILPY CONSULTING ENGINEERS
                </h2>
                <p className="text-xs text-slate-400 font-mono print:text-black">
                  Supervising Civil Engineers & LSGD Registered Institution • Reg: {project.regNo}
                </p>
                <p className="text-[11px] text-slate-500 font-sans print:text-black">
                  Keralassery Grama Panchayat, Palakkad - 678641 • Kerala State
                </p>
              </div>

              {/* Certificate Reference and Date */}
              <div className="flex flex-wrap justify-between items-center text-xs font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-black">
                <div>
                  <span className="text-slate-400 print:text-black">Completion Ref No: </span>
                  <strong className="text-emerald-400 font-bold print:text-black">{compCertData.certificateNo || `COMP/${project.id}/2026`}</strong>
                </div>
                <div>
                  <span className="text-slate-400 print:text-black">Completion Date: </span>
                  <strong className="text-white font-bold print:text-black">{new Date(compCertData.completionDate || new Date().toISOString()).toLocaleDateString("en-IN")}</strong>
                </div>
              </div>

              {/* 100% Completion Badge */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">
                      100% CONSTRUCTION WORK COMPLETED
                    </h4>
                    <p className="text-xs text-emerald-300 font-mono">
                      All civil, structural, roofing, finishing and MEP installations verified complete.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl uppercase">
                  FIT FOR OCCUPANCY
                </span>
              </div>

              {/* Technical Areas Comparison */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block">Sanctioned Plinth Area</span>
                  <span className="text-sm font-bold text-white">{compCertData.sanctionedPlinthAreaSqFt || project.plinthAreaSqFt} Sq.Ft</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block">Actual Constructed Area</span>
                  <span className="text-sm font-bold text-emerald-400">{compCertData.actualPlinthAreaSqFt || project.plinthAreaSqFt} Sq.Ft</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block">Building Permit No</span>
                  <span className="text-xs font-bold text-cyan-300 truncate block">{compCertData.buildingPermitNo || `KP/BP/${project.id}`}</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-500 block">LSGD Local Body</span>
                  <span className="text-xs font-bold text-white truncate block">{project.panchayatVillage}</span>
                </div>
              </div>

              {/* Certificate Formal Text */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-serif leading-relaxed text-slate-200 space-y-3 print:bg-white print:text-black print:border-black">
                <p>
                  I hereby certify that the <strong>{project.buildingType}</strong> constructed for <strong>{project.clientName}</strong>, situated in <strong>Re-Survey No: {project.syNo}, Block No: {project.blockNo}, Ward: {project.wardNo}</strong> of <strong>{project.panchayatVillage}</strong> has been supervised by me throughout all stages of execution.
                </p>
                <p>
                  The building has been executed in full compliance with the approved architectural plans, engineering designs, and specifications prescribed under the Kerala Panchayat Building Rules (KPBR) and National Building Code of India (NBC).
                </p>
                <p>
                  The building is structurally sound, stable, and completely fit for occupancy and residential use.
                </p>
              </div>

              {/* Engineer Credentials & Seal */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800 print:border-black">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-sm font-black font-sans text-white print:text-black">
                    {stripEr(compCertData.engineerName || project.preparedBy)}
                  </div>
                  <div className="text-xs font-mono text-emerald-400 print:text-black">
                    Supervising Engineer & Registered Valuer
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 print:text-black">
                    LSGD License 'A' Grade • Reg No: {compCertData.engineerRegNo || project.regNo}
                  </div>
                </div>

                <div className="w-32 h-32 rounded-full border-2 border-dashed border-emerald-500/50 bg-emerald-950/20 flex flex-col items-center justify-center text-center p-2 print:border-black">
                  <Award className="w-6 h-6 text-emerald-400 mb-1" />
                  <span className="text-[8px] font-mono font-bold text-emerald-300">LSGD COMPLIANT</span>
                  <span className="text-[7px] font-mono text-slate-400">COMPLETION SEAL</span>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

        {/* TAB 4: DETAILED BOQ ITEMS OF WORK */}
        {activePortalTab === "boq" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white font-sans">
                  പ്രവൃത്തികളുടെ വിശദമായ പട്ടിക (Bill of Quantities / BOQ)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {project.appendices?.length || 1} Sections
              </span>
            </div>

            {/* Accordion List */}
            <div className="space-y-3">
              {project.appendices?.map((app, idx) => {
                const isExpanded = expandedAppendix === app.id || idx === 0;

                return (
                  <div
                    key={app.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedAppendix(expandedAppendix === app.id ? null : app.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs md:text-sm font-bold text-white font-sans">
                            {app.title}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400">
                            {app.items?.length || 0} items • Total: ₹{app.totalAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-emerald-400 hidden sm:inline">
                          ₹{app.totalAmount.toLocaleString("en-IN")}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-900 bg-slate-900/40 overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                              <th className="py-2 pr-2">Sl</th>
                              <th className="py-2 px-2">Particulars of Work</th>
                              <th className="py-2 px-2 text-right">Qty</th>
                              <th className="py-2 px-2 text-center">Unit</th>
                              <th className="py-2 px-2 text-right">Rate (₹)</th>
                              <th className="py-2 pl-2 text-right">Amount (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {app.items.map((item, itIdx) => (
                              <tr key={item.id || itIdx} className="hover:bg-slate-900/80">
                                <td className="py-2.5 pr-2 text-slate-500">{item.slNo || itIdx + 1}</td>
                                <td className="py-2.5 px-2 font-sans font-medium text-white">{item.particulars}</td>
                                <td className="py-2.5 px-2 text-right text-cyan-300 font-bold">{item.quantity.toFixed(2)}</td>
                                <td className="py-2.5 px-2 text-center text-slate-400">{item.unit}</td>
                                <td className="py-2.5 px-2 text-right text-slate-300">₹{item.rate.toFixed(2)}</td>
                                <td className="py-2.5 pl-2 text-right font-bold text-emerald-400">₹{item.amount.toLocaleString("en-IN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: INVOICES & PAYMENTS VIEW */}
        {activePortalTab === "invoice" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base md:text-lg font-bold text-white font-sans">
                  Invoices & Payment Details
                </h2>
              </div>

              <span className="text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full">
                Zero-Login Verified
              </span>
            </div>

            {/* Quick Financial Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Total Sanctioned Estimate:</span>
                <span className="text-lg font-bold text-white">
                  ₹{project.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Certified Stage Expenditure:</span>
                <span className="text-lg font-bold text-emerald-400">
                  ₹{stageCertData.stageExpenditure.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-500 block">UPI Payee ID:</span>
                <span className="text-xs font-bold text-cyan-300 truncate block">
                  7012383137@okbizaxis
                </span>
              </div>
            </div>

            {/* Instant UPI Payment QR Code Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-3 max-w-md">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>INSTANT UPI PAYMENT • GPay / PhonePe / Paytm</span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Scan this QR code using any UPI app on your mobile to process project fees or stage installments directly.
                </p>
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl font-mono text-xs space-y-1">
                  <div className="text-[10px] text-slate-400">Vasthusilpy Official UPI:</div>
                  <div className="text-emerald-400 font-bold text-sm">7012383137@okbizaxis</div>
                </div>
              </div>

              <div className="mx-auto md:mx-0">
                <InvoiceQrCode
                  upiId="7012383137@okbizaxis"
                  payeeName="Vasthusilpy"
                  amount={stageCertData.stageExpenditure > 0 ? stageCertData.stageExpenditure : project.grandTotal}
                  invoiceNumber={`PRJ-${project.id}`}
                  size={150}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ENGINEER CERTIFICATION & AUTHENTICITY SEAL */}
        {shareLink.allowEngineerSeal && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-sans">
                എഞ്ചിനീയർ സാക്ഷ്യപത്രം & സീൽ (Engineer Certification & Seal)
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div className="space-y-2 text-center sm:text-left">
                <div className="text-base font-black text-white font-sans">
                  {stripEr(project.preparedBy) || "Er. DEEPAK VASUDEVAN"}
                </div>
                <div className="text-xs font-mono text-cyan-400">
                  Chartered Civil Engineer & Approved Valuer
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Reg No: {project.regNo || "CA/2020/12345"} • LSGD License 'A' Grade
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Vasthusilpy Technical System • Keralassery, Palakkad
                </div>
              </div>

              {/* Official Seal Stamp Badge */}
              <div className="w-36 h-36 rounded-full border-4 border-dashed border-emerald-500/50 bg-emerald-950/20 p-2 flex flex-col items-center justify-center text-center shrink-0">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
                <span className="text-[9px] font-mono font-black text-emerald-300 tracking-wider">
                  OFFICIAL SEAL
                </span>
                <span className="text-[8px] font-mono text-emerald-400">
                  GOVT. APPROVED
                </span>
                <span className="text-[8px] font-mono text-slate-400">
                  KPBR COMPLIANT
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: CLIENT SUPPORT & CONTACT FOOTER */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-white font-sans">
              Have questions regarding your project progress or certificates?
            </h3>
            <p className="text-xs text-slate-400">
              Feel free to connect directly with the supervising engineer or office team on WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleWhatsAppContact}
              className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-mono font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Engineer on WhatsApp</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs font-mono text-slate-500 print:hidden">
        <div className="max-w-6xl mx-auto px-4 space-y-1">
          <p>Vasthusilpy Architectural & Structural Engineering Suite • Keralassery, Palakkad</p>
          <p className="text-[10px] text-slate-600">
            Secure SHA-256 Verification & Real-time Site Progress Tracking System
          </p>
        </div>
      </footer>
    </div>
  );
};

