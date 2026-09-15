import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Building2,
  QrCode,
  Lock,
  ExternalLink,
  Award,
  Calendar,
  User,
  MapPin,
  FileText,
  DollarSign,
  Info,
  LogOut,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Clock,
  Landmark,
  Percent,
  Layers,
  ArrowRight,
  Sparkles,
  Phone,
  Home,
  RotateCcw
} from "lucide-react";
import {
  EstimateProject,
  normalizeProjectBlocks,
  stripEr,
  numberToIndianWords,
  loadSavedEstimates,
  generateDefaultStageCertificate,
  generateDefaultCompletionCertificate,
  isProject100PercentStageCompleted
} from "../../data/estimateData";
import { VerificationQRModal } from "./modals/VerificationQRModal";
import { db } from "../../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import QRCode from "qrcode";

interface ReadOnlyEstimateVerificationPortalProps {
  verifyId: string;
  verifyHash?: string;
  initialTab?: "estimate" | "stage" | "completion" | "engineer";
  estimateProjects: EstimateProject[];
  onGoToLogin?: () => void;
}

export const ReadOnlyEstimateVerificationPortal: React.FC<ReadOnlyEstimateVerificationPortalProps> = ({
  verifyId,
  verifyHash,
  initialTab,
  estimateProjects,
  onGoToLogin
}) => {
  const [activeTab, setActiveTab] = useState<"estimate" | "stage" | "completion" | "engineer">(
    initialTab || "estimate"
  );
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolvedProject, setResolvedProject] = useState<EstimateProject | null>(null);
  const [verificationError, setVerificationError] = useState<{
    title: string;
    description: string;
    code: "NOT_FOUND" | "HASH_MISMATCH" | "TAMPERED";
  } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Clean and normalize incoming query parameters
  const cleanVerifyId = (verifyId || "").trim();
  const cleanVerifyHash = (verifyHash || "").trim();

  // Reset/sync activeTab whenever QR code URL initialTab or verifyId changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else {
      setActiveTab("estimate");
    }
  }, [initialTab, cleanVerifyId]);

  useEffect(() => {
    let isMounted = true;

    async function verifyAndFetchProject() {
      setLoading(true);
      setVerificationError(null);

      try {
        // 1. First check local in-memory / localStorage list
        let candidate: EstimateProject | undefined = estimateProjects.find(
          (p) =>
            p.id.toLowerCase() === cleanVerifyId.toLowerCase() ||
            p.verificationHash?.toLowerCase() === cleanVerifyId.toLowerCase() ||
            (cleanVerifyHash && p.verificationHash?.toLowerCase() === cleanVerifyHash.toLowerCase())
        );

        // 2. If not found in props, check localStorage
        if (!candidate) {
          const localList = loadSavedEstimates();
          candidate = localList.find(
            (p) =>
              p.id.toLowerCase() === cleanVerifyId.toLowerCase() ||
              p.verificationHash?.toLowerCase() === cleanVerifyId.toLowerCase() ||
              (cleanVerifyHash && p.verificationHash?.toLowerCase() === cleanVerifyHash.toLowerCase())
          );
        }

        // 3. If still not found, fetch from Firestore (for mobile client scanners)
        if (!candidate && cleanVerifyId) {
          try {
            const docRef = doc(db, "estimates", cleanVerifyId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              candidate = docSnap.data() as EstimateProject;
            }
          } catch (e) {
            console.warn("Firestore direct estimate fetch error:", e);
          }
        }

        // 4. If still not found by direct doc ID, check Firestore collection by verificationHash
        if (!candidate && (cleanVerifyHash || cleanVerifyId)) {
          try {
            const querySnap = await getDocs(collection(db, "estimates"));
            querySnap.forEach((d) => {
              const data = d.data() as EstimateProject;
              if (
                data &&
                (data.id?.toLowerCase() === cleanVerifyId.toLowerCase() ||
                  data.verificationHash?.toLowerCase() === cleanVerifyId.toLowerCase() ||
                  (cleanVerifyHash && data.verificationHash?.toLowerCase() === cleanVerifyHash.toLowerCase()))
              ) {
                candidate = data;
              }
            });
          } catch (e) {
            console.warn("Firestore collection lookup error:", e);
          }
        }

        if (!isMounted) return;

        // Security Validation
        if (!candidate) {
          setVerificationError({
            title: "Estimate Valuation Record Not Found",
            description: `The estimate reference (${cleanVerifyId || "Unspecified"}) could not be located in the authorized engineering database. Please ensure you have scanned an authentic, officially issued QR code.`,
            code: "NOT_FOUND"
          });
          setResolvedProject(null);
          setLoading(false);
          return;
        }

        // Check Hash Verification
        // If cleanVerifyHash is provided in the URL, it MUST match candidate.verificationHash
        if (cleanVerifyHash) {
          const candidateHash = (candidate.verificationHash || "").trim().toLowerCase();
          const targetHash = cleanVerifyHash.toLowerCase();

          if (candidateHash !== targetHash) {
            setVerificationError({
              title: "Verification Security Check Failed",
              description: `Cryptographic verification token mismatch. The QR security token in this link does not match the official hash issued for this project (${candidate.id}). For privacy and security, access has been restricted.`,
              code: "HASH_MISMATCH"
            });
            setResolvedProject(null);
            setLoading(false);
            return;
          }
        }

        // Successfully verified!
        setResolvedProject(candidate);
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setVerificationError({
          title: "Verification Service Error",
          description: "An unexpected error occurred while validating the cryptographic certificate. Please try scanning the QR code again.",
          code: "TAMPERED"
        });
        setResolvedProject(null);
        setLoading(false);
      }
    }

    verifyAndFetchProject();

    return () => {
      isMounted = false;
    };
  }, [cleanVerifyId, cleanVerifyHash, estimateProjects]);

  // Generate QR Code for the verified link with specific document tab
  useEffect(() => {
    if (resolvedProject) {
      const targetUrl = `${window.location.origin}/?verify=${resolvedProject.id}&hash=${encodeURIComponent(
        resolvedProject.verificationHash
      )}&tab=${activeTab}`;
      QRCode.toDataURL(targetUrl, {
        width: 240,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" }
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(() => {});
    }
  }, [resolvedProject, activeTab]);

  const handleCopyLink = () => {
    if (!resolvedProject) return;
    const shareableUrl = `${window.location.origin}/?verify=${resolvedProject.id}&hash=${encodeURIComponent(
      resolvedProject.verificationHash
    )}&tab=${activeTab}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 bg-blueprint-grid">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white font-sans tracking-wide">
              AUTHENTICATING ESTIMATE RECORD
            </h2>
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              Verifying cryptographic hash &amp; retrieving authorized client valuation...
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Vasthusilpy Engineering Verification Node
          </div>
        </div>
      </div>
    );
  }

  // 2. Verification Security Failure State
  if (verificationError || !resolvedProject) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 bg-blueprint-grid">
        <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950">
            <XCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              AUTHENTICITY VERIFICATION FAILED
            </div>
            <h2 className="text-lg md:text-xl font-black text-white font-sans">
              {verificationError?.title || "Unauthorized Document Link"}
            </h2>
            <p className="text-xs text-slate-300 font-sans leading-relaxed text-left bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              {verificationError?.description ||
                "This verification link is invalid or does not correspond to an authorized client record."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/60 text-[11px] font-mono text-slate-300 space-y-1.5 text-left">
            <div className="text-red-300 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Strict Client Privacy Protection</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed font-sans">
              To prevent unauthorized third parties from accessing personal client data, estimates can only be viewed with the exact QR code matching that specific project.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                window.location.href = window.location.origin;
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer border border-slate-700"
            >
              Go to Home Page
            </button>
            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-black transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                Engineer Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Successfully Verified Project Data
  const project = normalizeProjectBlocks(resolvedProject);
  const stageCert = project.stageCertificate || generateDefaultStageCertificate(project);
  const compCert = project.completionCertificate || generateDefaultCompletionCertificate(project);

  const hasStageCert =
    project.hasStageCertificate !== false &&
    (project.stageExpenditure > 0 || !!project.stageCompletedText || !!project.stageCertificate);

  const is100PercentStageCompleted = isProject100PercentStageCompleted(project);
  const hasCompletionCert = is100PercentStageCompleted && project.hasCompletionCertificate === true;

  const shareableUrl = `${window.location.origin}/?verify=${project.id}&hash=${encodeURIComponent(
    project.verificationHash
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950 bg-blueprint-grid">
      {/* TOP VERIFIED AUTHENTIC HEADER (Client Isolated, No Navigation to other apps) */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black font-sans text-white tracking-wider">
                  VASTHUSILPY DOCUMENT AUTHENTICATOR
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  AUTHENTIC &amp; VERIFIED
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                Client: <strong className="text-slate-200">{project.clientName}</strong> • Ref:{" "}
                <span className="text-emerald-400 font-bold">{project.id}</span>
              </p>
            </div>
          </div>

          {/* Action Header Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View verification QR code"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy public verification link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-mono font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ml-1"
                title="Engineer Login"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Verification Info Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-emerald-200 shadow-lg print:hidden">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-emerald-300 font-sans tracking-wide">
                CLIENT VERIFICATION PORTAL • ZERO SIGN-IN REQUIRED
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                You are viewing the authenticated civil engineering documentation issued exclusively for{" "}
                <strong className="text-white font-bold">{project.clientName}</strong> ({project.buildingType}). All other application tabs and client records remain securely isolated.
              </p>
            </div>
          </div>
          <div className="font-mono text-[11px] text-emerald-400 font-bold shrink-0 bg-slate-950/90 border border-emerald-800/80 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>LSGD REG: {project.regNo}</span>
          </div>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center gap-2 print:hidden shadow-lg">
          <button
            onClick={() => setActiveTab("estimate")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "estimate"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>1. Detailed Quantity Estimate</span>
          </button>

          <button
            onClick={() => setActiveTab("stage")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "stage"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>2. Stage Progress Certificate</span>
            {hasStageCert ? (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-full uppercase font-bold">
                Prepared
              </span>
            ) : (
              <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded-full uppercase">
                Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("completion")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "completion"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>3. Completion Certificate</span>
            {hasCompletionCert ? (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded-full uppercase font-bold">
                Issued
              </span>
            ) : (
              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded-full uppercase">
                Under Construction
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("engineer")}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "engineer"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            <span>4. Authorised Engineer Credentials</span>
          </button>

          {activeTab !== (initialTab || "estimate") && (
            <button
              onClick={() => setActiveTab(initialTab || "estimate")}
              className="ml-auto px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-600/50 flex items-center gap-1.5 transition-all shadow cursor-pointer"
              title="Reset view to the scanned QR code document"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset to Scanned Document</span>
            </button>
          )}
        </div>

        {/* Master Project Overview Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden print:bg-white print:text-black print:border-black print:p-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 font-bold print:text-black">
                  <Building2 className="w-4 h-4" />
                  <span>VASTHUSILPY CONSULTING ENGINEERS • VALUATION REPORT</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white font-sans print:text-black">
                  {project.buildingType} — {project.clientName}
                </h1>
                <p className="text-xs text-slate-300 leading-relaxed font-sans print:text-black">
                  {project.headlineNarrative || "Detailed architectural valuation and material quantity survey."}
                </p>
              </div>

              {/* Master Particulars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-slate-500 block uppercase print:text-gray-700">CLIENT / OWNER</span>
                  <span className="font-bold text-white truncate block print:text-black">{project.clientName}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-slate-500 block uppercase print:text-gray-700">LOCATION / VILLAGE</span>
                  <span className="font-bold text-slate-200 truncate block print:text-black">{project.panchayatVillage}</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-slate-500 block uppercase print:text-gray-700">SY / BLOCK / WARD</span>
                  <span className="font-bold text-slate-200 truncate block print:text-black">
                    SY: {project.syNo} | B: {project.blockNo} | W: {project.wardNo}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-[10px] text-slate-500 block uppercase print:text-gray-700">TOTAL PLINTH AREA</span>
                  <span className="font-bold text-emerald-400 block print:text-black">
                    {project.plinthAreaSqFt} Sq.Ft ({project.plinthAreaSqM} Sq.M)
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side Valuation Banner */}
            <div className="lg:col-span-4 bg-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-xl print:bg-gray-100 print:border-black">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold print:text-black flex items-center justify-between">
                <span>ESTIMATE VALUATION</span>
                <span className="text-emerald-400 font-black print:text-black">{project.id}</span>
              </div>

              <div className="text-3xl font-black font-mono text-emerald-400 print:text-black tracking-tight">
                ₹{project.grandTotal.toLocaleString("en-IN")}
              </div>

              <div className="text-[11px] font-mono text-slate-300 border-t border-slate-800 pt-2 print:border-gray-400 print:text-black">
                Date of Issue: <strong className="text-white print:text-black">{project.estimationDate}</strong>
              </div>

              <div className="text-[11px] font-mono text-slate-300 print:text-black">
                Authorised Engineer:{" "}
                <strong className="text-white print:text-black">Er. {stripEr(project.preparedBy)}</strong>
              </div>

              <div className="text-[10px] font-mono text-slate-500 print:text-black truncate">
                Hash: {project.verificationHash}
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: DETAILED QUANTITY ESTIMATE */}
        {activeTab === "estimate" && (
          <div className="space-y-6">
            {project.blocks?.map((block) => (
              <div
                key={block.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 print:bg-white print:text-black print:p-0"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 print:border-black">
                  <h3 className="font-mono text-sm font-bold text-emerald-400 uppercase print:text-black flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{block.blockTitle}</span>
                  </h3>
                  <span className="font-mono text-xs font-bold text-emerald-300 print:text-black">
                    Block Total: ₹{block.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                {block.appendices.map((app) => (
                  <div key={app.id} className="space-y-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center print:bg-gray-100 print:border-black">
                      <div>
                        <h4 className="font-bold text-xs font-sans text-slate-200 print:text-black">{app.title}</h4>
                        <p className="text-[11px] font-mono text-slate-400 print:text-gray-700">{app.subtitle}</p>
                      </div>
                      <span className="font-mono text-xs font-black text-emerald-400 print:text-black">
                        Subtotal: ₹{app.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 print:border-black">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] print:bg-gray-200 print:text-black print:border-black">
                          <tr>
                            <th className="py-2.5 px-3">Sl.No</th>
                            <th className="py-2.5 px-3">Particulars of Work</th>
                            <th className="py-2.5 px-3 text-right">Nos</th>
                            <th className="py-2.5 px-3 text-right">Length</th>
                            <th className="py-2.5 px-3 text-right">Breadth</th>
                            <th className="py-2.5 px-3 text-right">Depth</th>
                            <th className="py-2.5 px-3 text-right">Quantity</th>
                            <th className="py-2.5 px-3">Unit</th>
                            <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                            <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300 print:divide-gray-300 print:text-black">
                          {app.items.map((item) => (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-800/30 ${
                                item.isHeader ? "bg-slate-950/80 font-bold text-emerald-300" : ""
                              } ${item.isSubtotal ? "bg-slate-900/90 font-bold text-amber-300" : ""}`}
                            >
                              <td className="py-2 px-3 font-bold text-emerald-400 print:text-black">{item.slNo}</td>
                              <td className="py-2 px-3 text-slate-200 font-sans max-w-xs print:text-black leading-relaxed">
                                {item.particulars}
                                {item.remarks && (
                                  <span className="block text-[10px] font-mono text-slate-500 italic print:text-gray-600">
                                    Note: {item.remarks}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-right">{item.nos || "-"}</td>
                              <td className="py-2 px-3 text-right">{item.length || "-"}</td>
                              <td className="py-2 px-3 text-right">{item.breadth || "-"}</td>
                              <td className="py-2 px-3 text-right">{item.depth || "-"}</td>
                              <td className="py-2 px-3 text-right font-bold text-white print:text-black">
                                {item.quantity || "-"}
                              </td>
                              <td className="py-2 px-3">{item.unit || "-"}</td>
                              <td className="py-2 px-3 text-right">
                                {item.rate ? item.rate.toLocaleString("en-IN") : "-"}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-400 print:text-black">
                                ₹{item.amount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* CPWD Markups & Abstract of Cost if configured */}
            {(project.contractorProfitPercentage || project.gstPercentage || project.contingencyPercentage) ? (
              <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl space-y-4 print:bg-white print:text-black print:border-black print:p-0">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 print:border-black">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-amber-400 print:text-black" />
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest print:text-black">
                      ABSTRACT OF COST &amp; STATUTORY MARKUPS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 print:border-black print:text-black">
                    {project.scheduleOfRatesType || "CPWD DSR 2023"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-black space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase block print:text-black">1. Base Civil Works:</span>
                    <div className="text-white font-bold text-sm print:text-black">
                      ₹{project.totalAmount.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-black space-y-1">
                    <span className="text-amber-400 text-[10px] uppercase block print:text-black">
                      2. CP &amp; Overheads ({project.contractorProfitPercentage ?? 15}%):
                    </span>
                    <div className="text-amber-300 font-bold text-sm print:text-black">
                      + ₹{(project.contractorProfitAmount ?? Math.round((project.totalAmount * (project.contractorProfitPercentage ?? 15)) / 100)).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-black space-y-1">
                    <span className="text-emerald-400 text-[10px] uppercase block print:text-black">
                      3. Works Contract GST ({project.gstPercentage ?? 18}%):
                    </span>
                    <div className="text-emerald-300 font-bold text-sm print:text-black">
                      + ₹{(project.gstAmount ?? Math.round((project.totalAmount * (project.gstPercentage ?? 18)) / 100)).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 print:bg-gray-100 print:border-black space-y-1">
                    <span className="text-cyan-400 text-[10px] uppercase block print:text-black">
                      4. Contingency ({project.contingencyPercentage ?? 3}%):
                    </span>
                    <div className="text-cyan-300 font-bold text-sm print:text-black">
                      + ₹{(project.contingencyAmount ?? Math.round((project.totalAmount * (project.contingencyPercentage ?? 3)) / 100)).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Grand Total Summary Box */}
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 print:bg-gray-100 print:border-black">
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-xs font-mono text-slate-400 uppercase font-bold print:text-black">
                  NET TOTAL ESTIMATED VALUATION (RUPEES IN WORDS)
                </div>
                <div className="text-sm font-sans font-bold text-slate-200 print:text-black">
                  {numberToIndianWords(project.grandTotal)}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-mono text-slate-400 uppercase block print:text-black">TOTAL ESTIMATE</span>
                <span className="text-3xl font-black font-mono text-emerald-400 print:text-black">
                  ₹{project.grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAGE VALUATION CERTIFICATE */}
        {activeTab === "stage" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 print:bg-white print:text-black">
            {hasStageCert ? (
              <>
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-slate-700 pb-4 relative print:border-black">
                  <h2 className="text-xl md:text-2xl font-black font-sans uppercase tracking-tight text-white print:text-black">
                    VASTHUSILPY CONSULTING ENGINEERS
                  </h2>
                  <div className="text-xs font-serif text-slate-300 font-semibold print:text-black">
                    Approved Civil Engineers &amp; Building Supervisors • Govt of Kerala LSGD
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 print:text-gray-600">
                    Deepak House, Keralassery (P.O), Palakkad - 678641 • Ph: 9567627277
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-base md:text-lg font-bold font-sans uppercase tracking-wide text-emerald-400 underline print:text-black">
                    STAGE PROGRESS &amp; VALUATION CERTIFICATE
                  </h3>
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pt-2 border-b border-slate-800 pb-2 print:text-black print:border-black">
                    <span>
                      <strong>Certificate Ref:</strong> {stageCert.certificateNo}
                    </span>
                    <span>
                      <strong>Inspection Date:</strong> {stageCert.inspectionDate || project.stageDate}
                    </span>
                  </div>
                </div>

                {/* Bank / Authority Line if applicable */}
                {(stageCert.bankName || stageCert.loanAccountNo) && (
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 space-y-1 print:bg-gray-100 print:border-black print:text-black">
                    <div className="text-[10px] uppercase text-slate-500 font-bold print:text-black">
                      FINANCIAL INSTITUTION / BANK LOAN PARTICULARS:
                    </div>
                    <div>
                      Bank: <strong>{stageCert.bankName || "Nationalized / Scheduled Commercial Bank"}</strong>{" "}
                      {stageCert.bankBranch ? `(${stageCert.bankBranch} Branch)` : ""}
                    </div>
                    {stageCert.loanAccountNo && (
                      <div>
                        Loan Account No: <strong>{stageCert.loanAccountNo}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 print:bg-gray-100 print:border-black">
                    <div className="text-xs font-mono text-slate-400 uppercase print:text-black font-bold">
                      PROGRESS STAGE COMPLETED ON SITE
                    </div>
                    <p className="text-sm font-sans text-slate-200 leading-relaxed font-semibold print:text-black">
                      {stageCert.completedItemsSummaryText || project.stageCompletedText || "Stage milestone executed as per specifications"}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-500/30 space-y-2 print:bg-gray-100 print:border-black">
                    <div className="text-xs font-mono text-slate-400 uppercase print:text-black font-bold">
                      CERTIFIED VALUE OF WORK EXECUTED
                    </div>
                    <div className="text-3xl font-black font-mono text-emerald-400 print:text-black">
                      ₹{(stageCert.stageExpenditure || project.stageExpenditure).toLocaleString("en-IN")}
                    </div>
                    <p className="text-[11px] font-sans font-bold text-slate-300 print:text-black">
                      ({numberToIndianWords(stageCert.stageExpenditure || project.stageExpenditure)})
                    </p>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 print:bg-transparent print:border-black">
                  <div className="flex justify-between text-xs font-mono text-slate-400 print:text-black">
                    <span>Physical Construction Progress:</span>
                    <strong className="text-emerald-400 print:text-black">
                      {stageCert.progressPercentage ||
                        Math.min(
                          100,
                          Math.round(
                            ((stageCert.stageExpenditure || project.stageExpenditure) /
                              Math.max(1, project.grandTotal)) *
                              100
                          )
                        )}
                      %
                    </strong>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden print:border print:border-black print:bg-gray-200">
                    <div
                      className="bg-emerald-500 h-full rounded-full print:bg-black"
                      style={{
                        width: `${
                          stageCert.progressPercentage ||
                          Math.min(
                            100,
                            Math.round(
                              ((stageCert.stageExpenditure || project.stageExpenditure) /
                                Math.max(1, project.grandTotal)) *
                                100
                            )
                          )
                        }%`
                      }}
                    />
                  </div>
                </div>

                {/* Certification Statement */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed space-y-2 print:bg-transparent print:border-black print:text-black">
                  <div className="font-bold text-white font-mono print:text-black">ENGINEER CERTIFICATION DECLARATION:</div>
                  <p>
                    I hereby certify that I have personally inspected the building construction site at{" "}
                    <strong>{project.panchayatVillage}</strong> (RSy No: <strong>{project.syNo}</strong>, Block:{" "}
                    <strong>{project.blockNo}</strong>, Ward: <strong>{project.wardNo}</strong>) belonging to{" "}
                    <strong>{project.clientName}</strong>. The progress described above has been physically verified on site, executed using quality construction materials, and complies with approved architectural drawings and Kerala Panchayat/Municipal Building Rules.
                  </p>
                </div>

                {/* Engineer Signature Block */}
                <div className="pt-6 flex items-end justify-between border-t border-slate-800 text-xs font-mono print:border-black print:text-black">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase print:text-black">Verification QR:</div>
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="Stage QR" className="w-16 h-16 object-contain bg-white p-1 rounded border border-slate-700 print:border-black" />
                    ) : (
                      <div className="w-16 h-16 border border-slate-700 flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-slate-500" />
                      </div>
                    )}
                    <div className="text-[8px] text-slate-500 print:text-black">Hash: {project.verificationHash}</div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase print:text-black">Authorised Civil Engineer:</div>
                    <div className="h-6" />
                    <div className="font-bold text-sm font-sans text-white print:text-black">
                      Er. {stageCert.engineerName || stripEr(project.preparedBy)}
                    </div>
                    <div className="text-[11px] text-emerald-400 print:text-black">
                      LSGD Reg No: {stageCert.engineerRegNo || project.regNo}
                    </div>
                    <div className="text-[9px] text-slate-500 print:text-black">
                      Vasthusilpy Consulting Engineers
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-sans uppercase">
                    Stage Progress Certificate Pending
                  </h3>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed">
                    A mid-construction stage valuation certificate has not been prepared yet for Estimate #{project.id}. When the supervising engineer executes and certifies the next milestone, it will appear here automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BUILDING COMPLETION CERTIFICATE */}
        {activeTab === "completion" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 print:bg-white print:text-black">
            {hasCompletionCert ? (
              <>
                {/* Official Letterhead */}
                <div className="text-center border-b-2 border-slate-700 pb-4 relative print:border-black">
                  <h2 className="text-xl md:text-2xl font-black font-sans uppercase tracking-tight text-white print:text-black">
                    VASTHUSILPY CONSULTING ENGINEERS
                  </h2>
                  <div className="text-xs font-serif text-slate-300 font-semibold print:text-black">
                    Approved Civil Engineers &amp; Building Supervisors • Govt of Kerala LSGD
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 print:text-gray-600">
                    Deepak House, Keralassery (P.O), Palakkad - 678641 • Ph: 9567627277
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-base md:text-lg font-bold font-sans uppercase tracking-wide text-emerald-400 underline print:text-black">
                    BUILDING COMPLETION &amp; STRUCTURAL STABILITY CERTIFICATE
                  </h3>
                  <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pt-2 border-b border-slate-800 pb-2 print:text-black print:border-black">
                    <span>
                      <strong>Ref No:</strong> {compCert.certificateNo || `CC-${project.id}-COMP`}
                    </span>
                    <span>
                      <strong>Issue Date:</strong> {compCert.issueDate || project.estimationDate}
                    </span>
                  </div>
                </div>

                {/* Addressee */}
                <div className="text-xs font-sans text-slate-300 space-y-0.5 print:text-black">
                  <div>To,</div>
                  <div className="font-bold text-white print:text-black">
                    {compCert.recipientOrAuthority || "The Secretary / Competent Authority / Owner"}
                  </div>
                </div>

                {/* Subject */}
                <div className="text-xs font-sans font-bold bg-slate-950 p-3 rounded-2xl border border-slate-800 text-slate-200 print:bg-gray-100 print:border-black print:text-black">
                  Sub: Building Completion Certification for <span className="text-emerald-400 underline print:text-black">{project.buildingType}</span> belonging to <span className="text-emerald-400 underline print:text-black">{project.clientName}</span> at <span className="underline">{project.panchayatVillage}</span>.
                </div>

                {/* Narrative & Particulars */}
                <div className="text-xs font-sans leading-relaxed text-slate-300 space-y-3 print:text-black">
                  <p>
                    This is to certify that the construction of the <strong>{project.buildingType}</strong> situated in <strong>RSy No: {project.syNo}</strong>, <strong>Block No: {project.blockNo}</strong>, <strong>Ward No: {project.wardNo}</strong> at <strong>{project.panchayatVillage}</strong>, {project.districtPincode}, owned by <strong>{project.clientName}</strong> has been planned and supervised under my direct professional oversight.
                  </p>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-3 print:bg-gray-50 print:border-black">
                    <p className="font-semibold text-white print:text-black">
                      {compCert.certificationStatement ||
                        "I certify that the building is structurally sound, conforms to approved plans and specifications, and is safe and fit for human habitation."}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 print:border-black font-mono text-[11px]">
                      <div>
                        <strong>Sanctioned Plinth Area:</strong> {compCert.sanctionedPlinthAreaSqM || project.plinthAreaSqM} Sq.M ({project.plinthAreaSqFt} Sq.Ft)
                      </div>
                      <div>
                        <strong>Constructed Plinth Area:</strong> {compCert.actualConstructedPlinthAreaSqM || project.plinthAreaSqM} Sq.M
                      </div>
                      <div>
                        <strong>Total Final Valuation:</strong> ₹{(compCert.finalTotalCost || project.grandTotal).toLocaleString("en-IN")}
                      </div>
                      <div>
                        <strong>Handover Date:</strong> {compCert.completionDate || project.estimationDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Engineer Signature Block */}
                <div className="pt-6 flex items-end justify-between border-t border-slate-800 text-xs font-mono print:border-black print:text-black">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase print:text-black">Verification QR:</div>
                    {qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="Comp QR" className="w-16 h-16 object-contain bg-white p-1 rounded border border-slate-700 print:border-black" />
                    ) : (
                      <div className="w-16 h-16 border border-slate-700 flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-slate-500" />
                      </div>
                    )}
                    <div className="text-[8px] text-slate-500 print:text-black">Hash: {project.verificationHash}</div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-[10px] text-slate-500 uppercase print:text-black">Certifying Civil Engineer:</div>
                    <div className="h-6" />
                    <div className="font-bold text-sm font-sans text-white print:text-black">
                      Er. {compCert.engineerName || stripEr(project.preparedBy)}
                    </div>
                    <div className="text-[11px] text-emerald-400 print:text-black">
                      LSGD Reg No: {compCert.engineerRegNo || project.regNo}
                    </div>
                    <div className="text-[9px] text-slate-500 print:text-black">
                      Vasthusilpy Consulting Engineers
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 md:p-12 text-center space-y-5 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-amber-950/70 border border-amber-600/50 text-amber-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-950/50">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full">
                    KPBR Rule 22 Compliance Lock
                  </span>
                  <h3 className="text-lg font-bold text-white font-sans">
                    കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് ലഭ്യമല്ല (Completion Certificate Locked)
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    കേരള പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി ബിൽഡിംഗ് ചട്ടങ്ങൾ (KPBR 2019 / KMBR) പ്രകാരം, അംഗീകൃത പ്ലാൻ അനുസരിച്ചുള്ള മുഴുവൻ പ്രവൃത്തികളും (100% Structural &amp; Architectural Works) പൂർത്തിയായാൽ മാത്രമേ അംഗീകൃത എഞ്ചിനീയർക്ക് കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് ഇഷ്യൂ ചെയ്യാൻ സാധിക്കൂ.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-left font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">CURRENT STAGE PROGRESS</span>
                    <strong className="text-amber-400 text-sm">{stageCert.progressPercentage || Math.round((project.stageExpenditure / (project.grandTotal || 1)) * 100)}% Complete</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">STATUS</span>
                    <strong className="text-cyan-400 text-sm">Under Active Execution</strong>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  All authorized stage valuation certificates can be verified under <span className="text-emerald-400 font-bold">Tab 2: Stage Progress Certificate</span>.
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ENGINEER CREDENTIALS & SEAL */}
        {activeTab === "engineer" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 print:bg-white print:text-black">
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <h3 className="font-mono text-sm font-bold text-emerald-400 uppercase">
                AUTHORISED CIVIL ENGINEER LICENSE &amp; ACCREDITATION
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">ENGINEER IN CHARGE</span>
                  <span className="text-sm font-bold text-white font-sans">Er. {stripEr(project.preparedBy)}</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">OFFICIAL LSGD REGISTRATION NUMBER</span>
                  <span className="text-xs font-bold text-emerald-400">{project.regNo}</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">ACCREDITING AUTHORITY</span>
                  <span className="text-xs text-slate-300 font-sans">
                    Local Self Government Department / Dept of Urban Affairs, Government of Kerala
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">PRACTICE CONSULTANCY</span>
                  <span className="text-xs text-slate-300">Vasthusilpy Engineering Consultants, Keralassery, Palakkad</span>
                </div>
              </div>

              {/* Digital Stamp / Seal Display */}
              <div className="bg-slate-950 border border-emerald-500/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
                <div className="w-28 h-28 rounded-full border-4 border-emerald-500/60 p-2 flex flex-col items-center justify-center text-center shadow-lg shadow-emerald-500/10">
                  <Award className="w-8 h-8 text-emerald-400" />
                  <span className="text-[9px] font-mono font-black text-emerald-300 uppercase mt-1">
                    LSGD REGD
                  </span>
                  <span className="text-[7px] font-mono text-slate-400">GOVT OF KERALA</span>
                </div>
                <div className="font-mono text-sm text-white font-bold">
                  Er. {stripEr(project.preparedBy)}
                </div>
                <div className="font-mono text-xs text-emerald-400 font-bold">
                  Reg No: {project.regNo}
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
                  Verified Digital Engineering Seal
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Verification Footer Notice */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs print:bg-white print:text-black">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-slate-400 text-[10px] uppercase block">DOCUMENT ISSUED BY</span>
            <span className="font-bold text-white font-sans print:text-black">Er. {stripEr(project.preparedBy)}</span>
            <span className="text-[10px] text-slate-500 block print:text-black">LSGD Reg: {project.regNo}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-[11px] text-emerald-400 font-bold">
              VASTHUSILPY CRYPTOGRAPHICALLY AUTHENTICATED
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-800 py-4 text-center font-mono text-xs text-slate-500 print:hidden">
        Vasthusilpy Civil Engineering &amp; Valuation Authenticator • Verified Document Portal
      </footer>

      {/* Verification QR Modal */}
      <VerificationQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        project={project}
      />
    </div>
  );
};
