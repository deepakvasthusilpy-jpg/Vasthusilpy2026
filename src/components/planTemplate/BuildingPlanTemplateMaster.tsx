import React, { useState, useEffect, useRef } from "react";
import { BuildingPlanProject, TabType, PlanSheet, AreaTableRow } from "../../types";
import {
  loadBuildingPlanProjects,
  saveBuildingPlanProjects,
  getActiveProjectId,
  setActiveProjectId,
  createBlankBuildingPlanProject,
  duplicateBuildingPlanProject
} from "../../data/buildingPlanStore";
import { PlanProjectsDashboard } from "./PlanProjectsDashboard";
import { PlanSheetViewModal } from "./PlanSheetViewModal";
import { PlanQrScanPortalModal } from "./PlanQrScanPortalModal";
import { PlanSheetCanvas } from "./PlanSheetCanvas";
import { MultiPlanArrangerTool } from "./tools/MultiPlanArrangerTool";
import { PlanQrPdfVerifierTool } from "./tools/PlanQrPdfVerifierTool";
import { TitleBlockMarginsTool } from "./tools/TitleBlockMarginsTool";
import { NorthCompassRotationTool } from "./tools/NorthCompassRotationTool";
import { DoorsFurnitureTool } from "./tools/DoorsFurnitureTool";
import { TitleBlockEditor } from "./TitleBlockEditor";
import { ObjectModifierDock, SelectedTargetInfo } from "./ObjectModifierDock";
import { PlanPrintPreviewModal } from "./PlanPrintPreviewModal";
import {
  exportSheetToPdf,
  exportSheetToJpeg,
  exportSheetToPng,
  exportAllSheetsToPdf,
  printSheetDocument,
  printAllSheetsDocument,
  generateDirectProjectVectorPdf,
  downloadBlob,
  captureSheetToCanvas
} from "../../utils/planExportUtils";
import {
  autoSavePlanToCloud,
  getCloudDownloadUrl
} from "../../utils/cloudPlanSync";
import {
  LayoutGrid,
  Edit3,
  Plus,
  Check,
  Layers,
  QrCode,
  Stamp,
  Compass,
  Download,
  Eye,
  Armchair,
  Cloud,
  Printer,
  FileDown,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Trash2,
  Sliders,
  ExternalLink,
  Info,
  Smartphone,
  Share2
} from "lucide-react";

export type StudioSubtab =
  | "dashboard"
  | "editor"
  | "multi_arranger"
  | "doors_furniture"
  | "qr_verifier"
  | "title_block"
  | "north_compass";

interface BuildingPlanTemplateMasterProps {
  activeTab?: string;
  setActiveTab?: (tab: TabType) => void;
}

export const BuildingPlanTemplateMaster: React.FC<BuildingPlanTemplateMasterProps> = ({
  activeTab,
  setActiveTab
}) => {
  const [projects, setProjects] = useState<BuildingPlanProject[]>(() =>
    loadBuildingPlanProjects()
  );

  const [activeProjectId, setCurrentActiveProjectId] = useState<string>(() =>
    getActiveProjectId(loadBuildingPlanProjects())
  );

  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [currentSubtab, setCurrentSubtab] = useState<StudioSubtab>("editor");
  const [selectedTarget, setSelectedTarget] = useState<SelectedTargetInfo | null>(null);
  const [isToolsSectionCollapsed, setIsToolsSectionCollapsed] = useState<boolean>(false);
  const [viewingProject, setViewingProject] = useState<BuildingPlanProject | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [printPreviewInitialSheet, setPrintPreviewInitialSheet] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgressText, setExportProgressText] = useState<string | null>(null);

  // For capturing off-screen sheets during multi-page PDF compilation
  const [capturingIndex, setCapturingIndex] = useState<number | null>(null);

  const mainCanvasRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLDivElement>(null);

  // Sync projects to localStorage
  useEffect(() => {
    saveBuildingPlanProjects(projects);
  }, [projects]);

  const activeProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || createBlankBuildingPlanProject();

  const currentSheetIndex = Math.min(
    Math.max(0, activeSheetIndex),
    Math.max(0, activeProject.sheets.length - 1)
  );
  const activeSheet = activeProject.sheets[currentSheetIndex] || activeProject.sheets[0];

  // Auto-sync project to cloud
  useEffect(() => {
    if (activeProject) {
      autoSavePlanToCloud(activeProject);
    }
  }, [activeProject]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Update active project
  const handleUpdateActiveProject = (updated: BuildingPlanProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Update active sheet
  const handleUpdateActiveSheet = (updatedSheet: PlanSheet) => {
    const updatedSheets = activeProject.sheets.map((s, idx) =>
      idx === currentSheetIndex ? updatedSheet : s
    );
    handleUpdateActiveProject({
      ...activeProject,
      sheets: updatedSheets,
      updatedAt: new Date().toISOString()
    });
  };

  // Add a new Sheet
  const handleAddNewSheet = () => {
    const newIdx = activeProject.sheets.length + 1;
    const newSheet: PlanSheet = {
      id: `sheet-${Date.now()}`,
      sheetNumber: newIdx,
      drawingNumber: `DWG-2026/0${newIdx}`,
      drawingName: `Architectural Sheet ${newIdx}`,
      floorName: `Floor Level ${newIdx}`,
      scale: "1 : 100",
      date: new Date().toLocaleDateString("en-IN"),
      revision: "R0",
      fitMode: "contain",
      zoom: 100,
      panX: 0,
      panY: 0,
      rotation: 0,
      northRotation: 0,
      attachments: [],
      symbols: []
    };

    const updated = {
      ...activeProject,
      sheets: [...activeProject.sheets, newSheet]
    };
    handleUpdateActiveProject(updated);
    setActiveSheetIndex(activeProject.sheets.length);
    triggerToast(`Added Sheet ${newIdx} (${newSheet.drawingNumber})`);
  };

  // Duplicate current sheet
  const handleDuplicateSheet = () => {
    if (!activeSheet) return;
    const newSheet: PlanSheet = {
      ...JSON.parse(JSON.stringify(activeSheet)),
      id: `sheet-${Date.now()}`,
      drawingNumber: `${activeSheet.drawingNumber}-COPY`,
      drawingName: `${activeSheet.drawingName} (Copy)`
    };
    const updated = {
      ...activeProject,
      sheets: [...activeProject.sheets, newSheet]
    };
    handleUpdateActiveProject(updated);
    setActiveSheetIndex(activeProject.sheets.length);
    triggerToast(`Duplicated ${activeSheet.drawingNumber}`);
  };

  // Delete current sheet
  const handleDeleteSheet = () => {
    if (activeProject.sheets.length <= 1) {
      triggerToast("Cannot delete the only sheet in the plan.");
      return;
    }
    const updatedSheets = activeProject.sheets.filter((_, idx) => idx !== currentSheetIndex);
    handleUpdateActiveProject({
      ...activeProject,
      sheets: updatedSheets
    });
    setActiveSheetIndex(Math.max(0, currentSheetIndex - 1));
    triggerToast("Sheet deleted.");
  };

  // Manual Cloud Sync
  const handleManualCloudSync = () => {
    setIsSyncingCloud(true);
    setTimeout(() => {
      autoSavePlanToCloud(activeProject);
      setIsSyncingCloud(false);
      triggerToast("Plan backed up to Cloud Drive successfully!");
    }, 600);
  };

  // Single Sheet PDF Download
  const handleDownloadSingleSheetPdf = async () => {
    if (!mainCanvasRef.current) return;
    try {
      await exportSheetToPdf(mainCanvasRef.current, activeProject, activeSheet);
      triggerToast(`PDF for ${activeSheet.drawingNumber || "Plan"} downloaded!`);
    } catch (err) {
      console.warn("HTML2Canvas PDF failed, downloading vector PDF fallback:", err);
      const blob = await generateDirectProjectVectorPdf(activeProject, activeSheet);
      const cleanTitle = (activeProject.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadBlob(blob, `${cleanTitle}_${activeSheet.drawingNumber || "Plan"}.pdf`);
      triggerToast("PDF downloaded via high-definition architectural vector export!");
    }
  };

  // MULTI-PAGE PDF DOWNLOAD (Compiles ALL sheets into one PDF)
  const handleDownloadMultiPagePdf = async () => {
    setIsExportingPdf(true);
    setExportProgressText("Preparing multi-page PDF compilation...");

    try {
      // We pass a resolver that retrieves elements
      await exportAllSheetsToPdf(
        activeProject,
        async (sheetIdx: number) => {
          if (sheetIdx === currentSheetIndex && mainCanvasRef.current) {
            return mainCanvasRef.current;
          }
          // Mount offscreen
          setCapturingIndex(sheetIdx);
          await new Promise((resolve) => setTimeout(resolve, 350));
          return offscreenCanvasRef.current;
        },
        (progressText: string) => {
          setExportProgressText(progressText);
        }
      );

      triggerToast(`All ${activeProject.sheets.length} sheets downloaded in single multi-page PDF!`);
    } catch (err) {
      console.error("Multi-sheet compilation failed, fallback to vector PDF:", err);
      const blob = await generateDirectProjectVectorPdf(activeProject);
      const cleanTitle = (activeProject.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadBlob(blob, `${cleanTitle}_Complete_MultiPage_Blueprint.pdf`);
      triggerToast("Multi-page PDF downloaded via direct vector generator!");
    } finally {
      setCapturingIndex(null);
      setIsExportingPdf(false);
      setExportProgressText(null);
    }
  };

  // Open dedicated Print-Friendly Preview modal
  const handleOpenPrintPreview = (sheetIndex?: number) => {
    setPrintPreviewInitialSheet(sheetIndex !== undefined ? sheetIndex : currentSheetIndex);
    setIsPrintPreviewOpen(true);
  };

  // PRINT CURRENT SHEET (Opens dedicated print-friendly preview before browser print dialog)
  const handlePrintSheet = () => {
    handleOpenPrintPreview(currentSheetIndex);
  };

  // PRINT ALL SHEETS (Opens dedicated print-friendly preview with all sheets)
  const handlePrintAllSheets = () => {
    handleOpenPrintPreview(0);
  };

  // Export PNG / JPEG
  const handleExportImage = async (format: "png" | "jpg") => {
    if (!mainCanvasRef.current) return;
    try {
      if (format === "png") {
        await exportSheetToPng(mainCanvasRef.current, activeProject, activeSheet);
      } else {
        await exportSheetToJpeg(mainCanvasRef.current, activeProject, activeSheet);
      }
      triggerToast(`${format.toUpperCase()} image downloaded!`);
    } catch (err) {
      console.error("Image export error:", err);
    }
  };

  // Create New Project
  const handleCreateNewProject = () => {
    const fresh = createBlankBuildingPlanProject();
    const updatedList = [fresh, ...projects];
    setProjects(updatedList);
    setCurrentActiveProjectId(fresh.id);
    setActiveProjectId(fresh.id);
    setActiveSheetIndex(0);
    setSelectedTarget(null);
    setCurrentSubtab("editor");
    triggerToast("New Building Plan created!");
  };

  // Subtabs list (Moved to Left Side Dock as explicitly demanded by user)
  const SUBTABS = [
    { id: "editor", label: "Blueprint Studio", icon: Edit3, desc: "Project & Sheet details" },
    { id: "multi_arranger", label: "Multi-Plan Arranger", icon: Layers, desc: "Ground/First floor, sections" },
    { id: "doors_furniture", label: "Doors & 2D Furniture", icon: Armchair, desc: "Catalog of 2D symbols", count: activeSheet.symbols?.length },
    { id: "title_block", label: "Title Block & Margins", icon: Stamp, desc: "Licensee, area table, vasthu" },
    { id: "north_compass", label: "North Orientation", icon: Compass, desc: "Orientation & compass angles" },
    { id: "qr_verifier", label: "QR Code & PDF Hub", icon: QrCode, desc: "Public link & cloud drive" },
    { id: "dashboard", label: "Plans Dashboard", icon: LayoutGrid, desc: "Switch or manage projects", count: projects.length }
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-mono text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Exporting Progress Overlay */}
      {isExportingPdf && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl">
            <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-white font-bold text-sm">Compiling Multi-Page PDF</h3>
            <p className="text-xs font-mono text-cyan-300">{exportProgressText || "Processing architectural sheets..."}</p>
            <p className="text-[10px] text-slate-400">All layers, vector symbols, text, and title blocks are being embedded.</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP SECTION: FULL-WIDTH INTERACTIVE BLUEPRINT PAGE (ACTUAL SIZE PREVIEW) */}
      {/* ========================================================================= */}
      <section className="w-full flex flex-col space-y-2.5">
        {/* Top Control Bar: Sheet Tabs, View Controls & Print/Export Shortcuts */}
        <div className="bg-slate-900/95 border border-slate-800 px-3 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-lg">
          {/* Sheet Selector Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold mr-1">
              SHEETS:
            </span>
            {activeProject.sheets.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => {
                  setActiveSheetIndex(idx);
                  setSelectedTarget(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  currentSheetIndex === idx
                    ? "bg-red-600 text-white shadow-md shadow-red-950 ring-1 ring-red-400"
                    : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <span>{s.drawingNumber || `DWG-${idx + 1}`}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">
                  {s.sheetTitle ? `(${s.sheetTitle.slice(0, 16)})` : ""}
                </span>
              </button>
            ))}

            {/* Add Sheet */}
            <button
              onClick={handleAddNewSheet}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs transition cursor-pointer"
              title="Add new sheet to this plan"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Duplicate Sheet */}
            <button
              onClick={handleDuplicateSheet}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs transition cursor-pointer"
              title="Duplicate current sheet"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {/* Delete Sheet */}
            {activeProject.sheets.length > 1 && (
              <button
                onClick={handleDeleteSheet}
                className="p-1.5 bg-slate-950 hover:bg-rose-950 text-rose-400 border border-slate-800 rounded-xl text-xs transition cursor-pointer"
                title="Delete current sheet"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Canvas View & Export Controls */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-1.5 py-0.5">
              <button
                onClick={() =>
                  handleUpdateActiveSheet({
                    ...activeSheet,
                    zoom: Math.max(30, (activeSheet.zoom || 100) - 10)
                  })
                }
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-300 text-[10px] w-9 text-center font-bold">{activeSheet.zoom || 100}%</span>
              <button
                onClick={() =>
                  handleUpdateActiveSheet({
                    ...activeSheet,
                    zoom: Math.min(300, (activeSheet.zoom || 100) + 10)
                  })
                }
                className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  handleUpdateActiveSheet({
                    ...activeSheet,
                    zoom: 100,
                    rotation: 0
                  })
                }
                className="px-1.5 py-0.5 text-[9px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded transition cursor-pointer"
                title="Reset zoom to 100%"
              >
                Fit
              </button>
            </div>

            {/* Presentation View Modal */}
            <button
              onClick={() => setViewingProject(activeProject)}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition"
              title="Full A4 presentation view"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">View</span>
            </button>

            {/* Dedicated Print Preview Modal */}
            <button
              onClick={() => handleOpenPrintPreview(currentSheetIndex)}
              className="px-3 py-1.5 bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-bold transition shadow-sm"
              title="Open print-friendly preview of drawing and title block"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print Preview</span>
            </button>

            {/* Single Sheet PDF Download */}
            <button
              onClick={handleDownloadSingleSheetPdf}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer font-bold transition shadow-md shadow-red-950"
              title="Download current sheet as A4 Landscape PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            {/* QR Modal */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition font-bold"
              title="Scan Plan QR Code & Contact Engineer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR Hub</span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* INTERACTIVE LIVE A4 BLUEPRINT CANVAS (TOP - ACTUAL SIZE & FULL WIDTH) */}
        {/* ----------------------------------------------------------------- */}
        <div className="w-full min-h-[640px] sm:min-h-[740px] lg:min-h-[820px] xl:min-h-[900px] bg-slate-950/80 p-2 sm:p-5 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col justify-center items-center overflow-x-auto relative">
          <PlanSheetCanvas
            project={activeProject}
            sheet={activeSheet}
            sheetIndex={currentSheetIndex}
            totalSheets={activeProject.sheets.length}
            canvasRef={mainCanvasRef}
            onUpdateSheet={handleUpdateActiveSheet}
            onUpdateProject={handleUpdateActiveProject}
            selectedTarget={selectedTarget}
            onSelectTarget={(target) => {
              setSelectedTarget(target);
              if (isToolsSectionCollapsed) setIsToolsSectionCollapsed(false);
            }}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onDownloadPdf={handleDownloadSingleSheetPdf}
          />
        </div>

        {/* Status and Information Sub-Bar */}
        <div className="px-3.5 py-2 bg-slate-900/60 border border-slate-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold">Interactive Canvas Active:</span>
            <span className="text-slate-400">Click any door, symbol, or drawing to edit, move, or resize directly.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 font-bold">WhatsApp: +91 88482 41463</span>
            <span className="text-cyan-400 font-mono">
              Title Block: {activeProject.titleBlockPosition === "bottom" ? "Bottom Strip" : `Right Strip (${activeProject.stripWidthMm || 70}mm)`}
            </span>
            <span className="text-slate-400">Scale: 1:100</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. BOTTOM SECTION: ALL STUDIO TOOLS & SUB TABS IN ACTUAL SIZE & FULL WIDTH */}
      {/* ========================================================================= */}
      <section className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
        {/* Tools Section Header & Project Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                ARCHITECTURAL BLUEPRINT STUDIO
              </span>
              <span className="text-xs font-mono text-slate-400">
                Full-Width Editing & Customization Tools
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span>{activeProject.clientName || "Building Plan Project"}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                • {activeProject.projectTitle || "Residential Building Plan"}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Collapse/Expand Tools toggle */}
            <button
              onClick={() => setIsToolsSectionCollapsed(!isToolsSectionCollapsed)}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isToolsSectionCollapsed ? "Show Editing Tools" : "Minimize Tools"}</span>
            </button>
          </div>
        </div>

        {!isToolsSectionCollapsed && (
          <div className="space-y-4">
            {/* SUBTABS BAR: Displayed in Actual Size and Width across the screen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SUBTABS.map((sub) => {
                const Icon = sub.icon;
                const isActive = currentSubtab === sub.id && !selectedTarget;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setCurrentSubtab(sub.id as StudioSubtab);
                      setSelectedTarget(null);
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md shadow-red-950"
                        : "text-slate-400 hover:text-white bg-slate-950/90 hover:bg-slate-800 border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-cyan-400"}`} />
                      {sub.count !== undefined && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-300"}`}>
                          {sub.count}
                        </span>
                      )}
                    </div>
                    <span className="font-bold truncate w-full text-left">{sub.label}</span>
                    <span className={`text-[10px] font-normal truncate w-full text-left mt-0.5 ${isActive ? "text-rose-100" : "text-slate-500"}`}>
                      {sub.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Object Banner (if an object is selected on canvas) */}
            {selectedTarget && (
              <div className="p-3 bg-blue-950/70 border border-blue-800/70 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-blue-200">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">Active Selection: {selectedTarget.type.toUpperCase()}</span>
                    <p className="text-[11px] text-blue-300">
                      Tweak coordinates, rotation, dimensions, or style below in full actual width.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTarget(null)}
                  className="px-3 py-1.5 bg-blue-900/90 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Return to Tools</span>
                </button>
              </div>
            )}

            {/* ACTIVE TOOL / OBJECT MODIFIER IN ACTUAL FULL WIDTH */}
            <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-inner">
              {selectedTarget ? (
                <ObjectModifierDock
                  project={activeProject}
                  activeSheet={activeSheet}
                  selectedTarget={selectedTarget}
                  onClose={() => setSelectedTarget(null)}
                  onUpdateSheet={handleUpdateActiveSheet}
                  onUpdateProject={handleUpdateActiveProject}
                  onSwitchSubtab={(tab) => {
                    setCurrentSubtab(tab as StudioSubtab);
                    setSelectedTarget(null);
                  }}
                />
              ) : (
                <>
                  {/* 1. BLUEPRINT STUDIO TOOL (Full Width) */}
                  {currentSubtab === "editor" && (
                    <TitleBlockEditor
                      project={activeProject}
                      activeSheet={activeSheet}
                      onUpdateProject={handleUpdateActiveProject}
                      onUpdateActiveSheet={handleUpdateActiveSheet}
                      onApplyToAllSheets={() => {
                        const updatedSheets = activeProject.sheets.map((s) => ({
                          ...s,
                          areaTable: activeSheet.areaTable,
                          marginConfig: activeSheet.marginConfig
                        }));
                        handleUpdateActiveProject({ ...activeProject, sheets: updatedSheets });
                        triggerToast("Applied properties to all sheets!");
                      }}
                    />
                  )}

                  {/* 2. MULTI-PLAN ARRANGER TOOL (Full Width) */}
                  {currentSubtab === "multi_arranger" && (
                    <MultiPlanArrangerTool
                      project={activeProject}
                      activeSheet={activeSheet}
                      onUpdateSheet={handleUpdateActiveSheet}
                      selectedAttachmentId={selectedTarget?.type === "attachment" ? selectedTarget.id || null : null}
                      onSelectAttachment={(id) => {
                        if (id) setSelectedTarget({ type: "attachment", id });
                        else setSelectedTarget(null);
                      }}
                    />
                  )}

                  {/* 3. DOORS & 2D FURNITURE TOOL (Full Width) */}
                  {currentSubtab === "doors_furniture" && (
                    <DoorsFurnitureTool
                      project={activeProject}
                      activeSheet={activeSheet}
                      onUpdateSheet={handleUpdateActiveSheet}
                      selectedSymbolId={selectedTarget?.type === "symbol" ? selectedTarget.id || null : null}
                      onSelectSymbol={(id) => {
                        if (id) setSelectedTarget({ type: "symbol", id });
                        else setSelectedTarget(null);
                      }}
                    />
                  )}

                  {/* 4. TITLE BLOCK & MARGINS TOOL (Full Width) */}
                  {currentSubtab === "title_block" && (
                    <TitleBlockMarginsTool
                      project={activeProject}
                      activeSheet={activeSheet}
                      onUpdateProject={handleUpdateActiveProject}
                      onUpdateSheet={handleUpdateActiveSheet}
                    />
                  )}

                  {/* 5. NORTH COMPASS ROTATION TOOL (Full Width) */}
                  {currentSubtab === "north_compass" && (
                    <NorthCompassRotationTool
                      project={activeProject}
                      activeSheet={activeSheet}
                      onUpdateSheet={handleUpdateActiveSheet}
                      onUpdateProject={handleUpdateActiveProject}
                    />
                  )}

                  {/* 6. QR CODE & PDF HUB (Full Width) */}
                  {currentSubtab === "qr_verifier" && (
                    <PlanQrPdfVerifierTool
                      project={activeProject}
                      activeSheet={activeSheet}
                      onDownloadPdf={handleDownloadSingleSheetPdf}
                      onOpenPortalModal={() => setIsQrModalOpen(true)}
                    />
                  )}

                  {/* 7. PLANS DASHBOARD (Full Width) */}
                  {currentSubtab === "dashboard" && (
                    <PlanProjectsDashboard
                      onSelectProject={(p) => {
                        setCurrentActiveProjectId(p.id);
                        setActiveProjectId(p.id);
                        setActiveSheetIndex(0);
                        setSelectedTarget(null);
                        setCurrentSubtab("editor");
                        triggerToast(`Loaded project "${p.clientName}"`);
                      }}
                      onQuickExportPdf={(p) => {
                        exportAllSheetsToPdf(p, async () => mainCanvasRef.current);
                      }}
                    />
                  )}
                </>
              )}
            </div>

            {/* BOTTOM UTILITY ACTIONS BAR */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2">
                {/* Multi-Page PDF Download */}
                <button
                  onClick={handleDownloadMultiPagePdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold transition shadow-md shadow-cyan-950 cursor-pointer"
                  title="Download all sheets and matter entirely into a single multi-page PDF"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Multi-Page PDF</span>
                </button>

                {/* Print Current Sheet */}
                <button
                  onClick={handlePrintSheet}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer font-bold"
                  title="Print current sheet"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Sheet</span>
                </button>

                {/* Print All */}
                <button
                  onClick={handlePrintAllSheets}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition cursor-pointer font-bold"
                  title="Print all sheets"
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Print All Sheets</span>
                </button>

                {/* Export PNG */}
                <button
                  onClick={() => handleExportImage("png")}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                  title="Download sheet as high-res PNG image"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>PNG</span>
                </button>

                {/* Export JPEG */}
                <button
                  onClick={() => handleExportImage("jpg")}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                  title="Download sheet as JPEG image"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>JPEG</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Cloud Sync Status */}
                <button
                  onClick={handleManualCloudSync}
                  disabled={isSyncingCloud}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl transition cursor-pointer"
                  title="Click to force instant cloud backup"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSyncingCloud ? "animate-spin text-cyan-400" : "text-emerald-400"}`} />
                  <span>{isSyncingCloud ? "Syncing..." : "Cloud Saved"}</span>
                </button>

                {/* Create New Plan */}
                <button
                  onClick={handleCreateNewProject}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 rounded-xl font-bold transition cursor-pointer"
                  title="Create a new blank building plan"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>New Plan</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Hidden Container for offscreen sheet capture during Multi-Page PDF exports */}
      <div style={{ position: "fixed", left: "-9999px", top: 0, width: "1122px", height: "794px", overflow: "hidden" }}>
        {capturingIndex !== null && activeProject.sheets[capturingIndex] && (
          <div ref={offscreenCanvasRef} style={{ width: "1122px", height: "794px" }}>
            <PlanSheetCanvas
              project={activeProject}
              sheet={activeProject.sheets[capturingIndex]}
              sheetIndex={capturingIndex}
              totalSheets={activeProject.sheets.length}
              isExporting={true}
            />
          </div>
        )}
      </div>

      {/* Dedicated Print-Friendly Preview Modal */}
      {isPrintPreviewOpen && activeProject && (
        <PlanPrintPreviewModal
          project={activeProject}
          initialSheetIndex={printPreviewInitialSheet}
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          onPrintSuccess={() => {
            setIsPrintPreviewOpen(false);
            triggerToast("Print job dispatched to printer!");
          }}
        />
      )}

      {/* Interactive A4 Presentation View Modal */}
      {viewingProject && (
        <PlanSheetViewModal
          project={viewingProject}
          isOpen={!!viewingProject}
          onClose={() => setViewingProject(null)}
          onEditProject={(p) => {
            handleUpdateActiveProject(p);
            setViewingProject(null);
          }}
        />
      )}

      {/* Interactive Mobile QR Scan & Contact Modal */}
      {isQrModalOpen && activeProject && activeSheet && (
        <PlanQrScanPortalModal
          project={activeProject}
          sheet={activeSheet}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onDownloadPdf={handleDownloadSingleSheetPdf}
        />
      )}
    </div>
  );
};
