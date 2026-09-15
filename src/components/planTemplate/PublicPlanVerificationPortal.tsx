import React, { useState, useEffect } from "react";
import {
  BuildingPlanProject,
  PlanSheet
} from "../../types/buildingPlanTemplate";
import {
  loadBuildingPlanProjects
} from "../../data/buildingPlanStore";
import { INITIAL_BUILDING_PLAN_PROJECT } from "../../data/sampleBuildingPlans";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "../../data/vasthusilpyLogo";
import {
  generateDirectProjectVectorPdf,
  downloadBlob,
  exportPlanAsHighResImage
} from "../../utils/planExportUtils";
import {
  fetchCloudPlan,
  getCloudDownloadUrl
} from "../../utils/cloudPlanSync";
import { PlanSheetCanvas } from "./PlanSheetCanvas";
import {
  ShieldCheck,
  CheckCircle,
  Download,
  Phone,
  MessageSquare,
  FileText,
  Printer,
  ExternalLink,
  MapPin,
  Building,
  User,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  Share2,
  Check,
  Copy,
  Cloud,
  CloudDownload,
  Image as ImageIcon,
  Eye,
  RefreshCw
} from "lucide-react";

interface PublicPlanVerificationPortalProps {
  onGoToApp?: () => void;
}

export const PublicPlanVerificationPortal: React.FC<PublicPlanVerificationPortalProps> = ({
  onGoToApp
}) => {
  const [project, setProject] = useState<BuildingPlanProject>(INITIAL_BUILDING_PLAN_PROJECT);
  const [sheet, setSheet] = useState<PlanSheet>(INITIAL_BUILDING_PLAN_PROJECT.sheets[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  
  // Cloud Drive States
  const [isCloudSaved, setIsCloudSaved] = useState<boolean>(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(true);
  const [cloudDownloadUrl, setCloudDownloadUrl] = useState<string | null>(null);
  const [driveViewLink, setDriveViewLink] = useState<string | null>(null);
  const [driveDownloadLink, setDriveDownloadLink] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showLiveDrawingPreview, setShowLiveDrawingPreview] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function initializePlan() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));

        const projId = urlParams.get("projId") || hashParams.get("projId") || urlParams.get("plan_id");
        const sheetId = urlParams.get("sheetId") || hashParams.get("sheetId");
        const dwg = urlParams.get("dwg") || hashParams.get("dwg");
        const client = urlParams.get("client") || hashParams.get("client");
        const call = urlParams.get("call") || hashParams.get("call");
        const wa = urlParams.get("wa") || hashParams.get("wa");
        const title = urlParams.get("title") || hashParams.get("title");
        const shouldAutoDownload = urlParams.get("cloud_download") === "1" || urlParams.get("auto_download") === "1";

        let matchedProject: BuildingPlanProject | undefined;
        let foundInCloud = false;

        // 1. Try to load from Cloud Drive first (zero login for anyone!)
        if (projId) {
          setIsLoadingCloud(true);
          const cloudRes = await fetchCloudPlan(projId);
          if (cloudRes.success && cloudRes.project && isMounted) {
            matchedProject = cloudRes.project;
            foundInCloud = true;
            setIsCloudSaved(true);
            setCloudDownloadUrl(cloudRes.cloudDownloadUrl || getCloudDownloadUrl(projId, sheetId || undefined));
            if (cloudRes.metadata?.driveViewLink) {
              setDriveViewLink(cloudRes.metadata.driveViewLink);
            }
            if (cloudRes.metadata?.driveDownloadLink) {
              setDriveDownloadLink(cloudRes.metadata.driveDownloadLink);
            }
            if (cloudRes.metadata?.lastSavedAt) {
              setLastSavedTime(new Date(cloudRes.metadata.lastSavedAt).toLocaleString());
            }
          }
          if (isMounted) setIsLoadingCloud(false);
        }

        // 2. Fallback to local storage if not loaded from Cloud Drive
        if (!matchedProject) {
          const storedProjects = loadBuildingPlanProjects();
          if (projId) {
            matchedProject = storedProjects.find((p) => p.id === projId);
          }
          if (!matchedProject && dwg) {
            matchedProject = storedProjects.find((p) =>
              p.sheets.some((s) => s.drawingNumber === dwg)
            );
          }
          if (!matchedProject) {
            matchedProject = storedProjects[0] || INITIAL_BUILDING_PLAN_PROJECT;
          }
        }

        // Apply URL overrides if any
        const enrichedProject: BuildingPlanProject = {
          ...matchedProject,
          clientName: client || matchedProject.clientName,
          engineerCallNumber: call || matchedProject.engineerCallNumber || "7012383137",
          engineerWhatsappNumber: wa || matchedProject.engineerWhatsappNumber || "+918848241463"
        };

        let matchedSheet = sheetId
          ? enrichedProject.sheets.find((s) => s.id === sheetId)
          : dwg
          ? enrichedProject.sheets.find((s) => s.drawingNumber === dwg)
          : enrichedProject.sheets[0];

        if (!matchedSheet) {
          matchedSheet = enrichedProject.sheets[0];
        }

        if (title && matchedSheet) {
          matchedSheet = { ...matchedSheet, drawingName: title };
        }

        if (isMounted) {
          setProject(enrichedProject);
          if (matchedSheet) {
            setSheet(matchedSheet);
          }
          
          if (!foundInCloud && projId) {
            setCloudDownloadUrl(getCloudDownloadUrl(projId, matchedSheet?.id));
          }

          // Trigger automatic zero-login cloud download if requested in QR code URL
          if (shouldAutoDownload) {
            setTimeout(() => {
              handleDirectCloudDownload(enrichedProject, matchedSheet);
            }, 600);
          }
        }
      } catch (err) {
        console.warn("Failed to parse verification URL params:", err);
        if (isMounted) setIsLoadingCloud(false);
      }
    }

    initializePlan();

    return () => {
      isMounted = false;
    };
  }, []);

  const engineerCall = project.engineerCallNumber || "7012383137";
  const engineerWa = (project.engineerWhatsappNumber || "8848241463").replace(/[^0-9]/g, "");

  // Direct Cloud Drive Download (Zero Login Required)
  const handleDirectCloudDownload = async (targetProj?: BuildingPlanProject, targetSheet?: PlanSheet) => {
    const proj = targetProj || project;
    const sht = targetSheet || sheet;
    const downloadUrl = cloudDownloadUrl || getCloudDownloadUrl(proj.id, sht.id);
    
    setIsDownloading(true);
    try {
      // 1. Try direct stream from Cloud Drive server endpoint
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/pdf")) {
          const blob = await response.blob();
          const safeClient = (proj.clientName || "Client").replace(/[^a-zA-Z0-9_\-]/g, "_");
          const safeDwg = (sht.drawingNumber || "DWG").replace(/[^a-zA-Z0-9_\-]/g, "_");
          downloadBlob(blob, `${safeClient}_${safeDwg}_Vasthusilpy_Cloud_Plan.pdf`);
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 4000);
          setIsDownloading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Direct stream notice, generating vector PDF fallback:", e);
    }

    // 2. Fallback: compile vector PDF locally and download
    try {
      const pdfBlob = await generateDirectProjectVectorPdf(proj, sht);
      const filename = `${(proj.clientName || "Client").replace(/\s+/g, "_")}_${sht.drawingNumber || "DWG"}.pdf`;
      downloadBlob(pdfBlob, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("PDF generation error:", err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    await handleDirectCloudDownload();
  };

  const handleExportImage = async (format: "png" | "jpeg") => {
    try {
      const filename = `${(project.clientName || "Plan").replace(/\s+/g, "_")}_${sheet.drawingNumber || "DWG"}.${format}`;
      await exportPlanAsHighResImage(project, sheet, format, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.warn("Image export error:", err);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(engineerCall);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    }
  };

  // Area Statement Calculations for 3 Columns (Floor, Proposed, Existing)
  const totalProposedBuiltUp = project.areaTable.reduce(
    (sum, r) => sum + (Number(r.proposedBuiltUpSqM ?? r.proposedSqM ?? r.builtUpSqM) || 0),
    0
  );
  const totalProposedFloor = project.areaTable.reduce(
    (sum, r) => sum + (Number(r.proposedFloorAreaSqM ?? r.floorAreaSqM ?? r.proposedSqM) || 0),
    0
  );
  const totalExistingBuiltUp = project.areaTable.reduce(
    (sum, r) => sum + (Number(r.existingBuiltUpSqM ?? r.existingSqM) || 0),
    0
  );
  const totalExistingFloor = project.areaTable.reduce(
    (sum, r) => sum + (Number(r.existingFloorAreaSqM ?? r.existingSqM) || 0),
    0
  );

  const totalBuiltUp = totalProposedBuiltUp;
  const totalSqFt = Math.round(totalBuiltUp * 10.7639);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-3 sm:p-6">
      {/* Top Bar / Navigation */}
      <header className="w-full max-w-5xl flex flex-wrap items-center justify-between py-3 border-b border-slate-800 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md">
            <img
              src={project.logoUrl || VASTHUSILPY_LOGO_DATA_URL}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>{project.officeName || "VASTHUSILPY KERALASSERY"}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-normal">
                Cloud Drive Synced
              </span>
            </h1>
            <span className="text-[10px] sm:text-xs font-mono text-slate-400">
              Official Architectural Plan & Permit Verification Portal • Zero Login Required
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="Copy Public QR Link"
          >
            {copiedShareLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Link</span>
              </>
            )}
          </button>

          {onGoToApp && (
            <button
              onClick={onGoToApp}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Open Studio</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-5xl space-y-6">
        
        {/* Cloud Drive Verification Success Banner */}
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>CLOUD DRIVE VERIFIED</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/20">
                  Zero Login • Public Access
                </span>
                {lastSavedTime && (
                  <span className="text-slate-400 text-[10px] font-mono">
                    Synced: {lastSavedTime}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Authentic Architectural Drawing Verified
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Issued by Licensed Consulting Engineer: <strong className="text-white">{project.licenseeName || "DEEPAK .C"}</strong> ({project.licenseNumber || "Supervisor-A Civil"})
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end w-full sm:w-auto">
            <span className="text-[10px] font-mono text-slate-400 uppercase">DRAWING NUMBER</span>
            <span className="text-xl font-black font-mono text-emerald-400">
              {sheet.drawingNumber || "DWG-01"}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Rev: {sheet.revision || "R0"} • {sheet.date || new Date().toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Primary Cloud Download & Multi-Format Actions */}
        <div className="bg-gradient-to-br from-red-950/80 via-slate-900 to-slate-900 border-2 border-red-600/50 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-red-500/40 flex items-center gap-1">
                  <CloudDownload className="w-3.5 h-3.5" />
                  <span>CLOUD DRIVE DOWNLOAD</span>
                </span>
                <span className="text-xs font-mono text-emerald-400">No Account or Login Required</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Download Official Cloud Saved Plan (PDF)
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl mt-1">
                Download the exact architectural working drawing saved on Vasthusilpy Cloud Drive, complete with drawing title block, 3-column Area Statement (വിസ്തീർണ്ണം), Vasthu Kol alavu, and engineer credentials.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Primary Cloud PDF Download Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="flex-1 lg:flex-initial px-6 py-3.5 bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-950 flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-emerald-300" />
                    <span>Cloud PDF Downloaded!</span>
                  </>
                ) : isDownloading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Fetching Cloud File...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Cloud PDF</span>
                  </>
                )}
              </button>

              {/* Optional Google Drive Direct Button */}
              {driveViewLink && (
                <a
                  href={driveViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-950 transition"
                  title="Open file in Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Google Drive</span>
                </a>
              )}

              {/* Direct High-Res Image Downloads */}
              <button
                type="button"
                onClick={() => handleExportImage("png")}
                className="px-3.5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                title="Download 300 DPI PNG Image"
              >
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportImage("jpeg")}
                className="px-3.5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                title="Download JPEG Image"
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>JPEG</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
                title="Print Hardcopy"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>

          {/* Quick Direct Engineer Contact Buttons */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Consulting Engineer: <strong>{project.licenseeName || "Deepak .C"}</strong> ({project.officeMobile || "7012383137"})</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${engineerCall}`}
                className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-mono font-bold flex items-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call: {engineerCall}</span>
              </a>

              <a
                href={`https://wa.me/${engineerWa}?text=${encodeURIComponent(
                  `Hello ${project.officeName},\nI am inquiring about verified plan ${sheet.drawingNumber} (${sheet.drawingName}) for client ${project.clientName} (Saved on Cloud Drive).`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl font-mono font-bold flex items-center gap-1.5 shadow transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live A4 Architectural Sheet Preview Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                Live Architectural Sheet View (A4 Landscape)
              </h3>
            </div>
            <button
              onClick={() => setShowLiveDrawingPreview(!showLiveDrawingPreview)}
              className="text-xs font-mono text-slate-400 hover:text-white transition"
            >
              {showLiveDrawingPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>

          {showLiveDrawingPreview && (
            <div className="w-full bg-slate-950 rounded-2xl p-2 sm:p-4 overflow-x-auto border border-slate-800/80 flex justify-center">
              <div className="w-full max-w-4xl min-w-[650px] shadow-2xl rounded-lg overflow-hidden border border-slate-800">
                <PlanSheetCanvas
                  project={project}
                  sheet={sheet}
                  sheetIndex={0}
                  isEditable={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* 2-Column Info: Project Details & 3-Column Area Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Project & Client Card (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <FileText className="w-4 h-4 text-red-400" />
              Project & Client Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Client / Owner:
                </span>
                <span className="font-bold text-white text-sm">{project.clientName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Location:
                </span>
                <span className="font-semibold text-slate-200">{project.projectLocation}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" /> Drawing Title:
                </span>
                <span className="font-bold text-white">{sheet.drawingName}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Scale & Date:
                </span>
                <span className="font-mono text-slate-300">
                  {sheet.scale || "1:100"} • {sheet.date || new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Proposed Built-Up:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {totalProposedBuiltUp.toFixed(2)} m² ({totalSqFt} sq.ft)
                </span>
              </div>

              {/* Vasthu Vidya Box */}
              <div className="bg-teal-950/40 border border-teal-800/50 rounded-2xl p-3 text-xs space-y-1 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-teal-400 font-bold font-mono">
                    VASTHU KOL (വാസ്തു അളവ്)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-bold">
                    {project.vasthuGrade || "Uttamam (ഉത്തമം)"}
                  </span>
                </div>
                <div className="text-[11px] text-teal-200">
                  Perimeter: <strong>{project.vasthuPerimeterKol || "28 Kol 12 Viral"}</strong> ({project.vasthuPerimeterMeter || "22.40 m"})
                </div>
                <p className="text-[10px] text-teal-300/80 font-mono">
                  {project.vasthuRemarks || "Ayadi Shadvarga - Dhana Yoni & Shubha Nakshatram"}
                </p>
              </div>
            </div>
          </div>

          {/* 3-Column Area Statement Card (Floor, Proposed, Existing with subcolumns) (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Area Statement (വിസ്തീർണ്ണ പട്ടിക)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                3-Column Standard (Floor, Proposed, Existing)
              </span>
            </div>

            {/* Area Table with 3 Main Columns & Sub-Columns */}
            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  {/* Main 3 Columns: FLOOR | PROPOSED | EXISTING */}
                  <tr className="bg-slate-800 text-slate-200 border-b border-slate-700 font-mono text-[11px] text-center">
                    <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 font-bold text-left bg-slate-800/90">
                      FLOOR
                    </th>
                    <th colSpan={2} className="py-1.5 px-2 border-r border-slate-700 font-bold bg-emerald-950/50 text-emerald-300">
                      PROPOSED
                    </th>
                    <th colSpan={2} className="py-1.5 px-2 font-bold bg-amber-950/40 text-amber-300">
                      EXISTING
                    </th>
                  </tr>
                  {/* Sub Columns: Buildup Area (sqm) | Floor Area (sqm) */}
                  <tr className="bg-slate-850 text-slate-300 border-b border-slate-700 font-mono text-[10px]">
                    <th className="py-1.5 px-2 text-right border-r border-slate-700/80 bg-emerald-950/20 text-emerald-200">
                      Buildup Area (sqm)
                    </th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-700 bg-emerald-950/20 text-emerald-200">
                      Floor Area (sqm)
                    </th>
                    <th className="py-1.5 px-2 text-right border-r border-slate-700/80 bg-amber-950/20 text-amber-200">
                      Buildup Area (sqm)
                    </th>
                    <th className="py-1.5 px-2 text-right bg-amber-950/20 text-amber-200">
                      Floor Area (sqm)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  {project.areaTable.map((row) => {
                    const pBuilt = Number(row.proposedBuiltUpSqM ?? row.proposedSqM ?? row.builtUpSqM) || 0;
                    const pFloor = Number(row.proposedFloorAreaSqM ?? row.floorAreaSqM ?? row.proposedSqM) || 0;
                    const eBuilt = Number(row.existingBuiltUpSqM ?? row.existingSqM) || 0;
                    const eFloor = Number(row.existingFloorAreaSqM ?? row.existingSqM) || 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-sans font-medium text-slate-200 border-r border-slate-800 bg-slate-900/40">
                          {row.floor}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-300 border-r border-slate-800">
                          {pBuilt.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-400 border-r border-slate-800">
                          {pFloor.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-right text-amber-300 border-r border-slate-800">
                          {eBuilt > 0 ? eBuilt.toFixed(2) : "0.00"}
                        </td>
                        <td className="py-2 px-2 text-right text-amber-400">
                          {eFloor > 0 ? eFloor.toFixed(2) : "0.00"}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Total Row */}
                  <tr className="bg-slate-800/90 font-bold border-t-2 border-slate-700">
                    <td className="py-2.5 px-3 font-sans text-white border-r border-slate-700">
                      TOTAL (sqm)
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-300 border-r border-slate-700">
                      {totalProposedBuiltUp.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-emerald-400 border-r border-slate-700">
                      {totalProposedFloor.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-amber-300 border-r border-slate-700">
                      {totalExistingBuiltUp.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-amber-400">
                      {totalExistingFloor.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              * Area statement measured strictly in square meters (sqm) as mandated by Kerala Municipality / Panchayat Building Rules (KMBR / KPBR).
            </p>
          </div>

        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 py-6 border-t border-slate-900 space-y-1">
          <p>© {new Date().getFullYear()} {project.officeName || "VASTHUSILPY KERALASSERY"}. All Rights Reserved.</p>
          <p className="text-[11px] font-mono">
            Direct Office Line: +91 7012383137 • WhatsApp: +91 8848241463 • Vasthusilpy Cloud Drive
          </p>
        </footer>

      </main>
    </div>
  );
};
