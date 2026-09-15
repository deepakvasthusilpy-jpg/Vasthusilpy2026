import React, { useState, useRef, useEffect } from "react";
import { BuildingPlanProject, PlanSheet } from "../../types/buildingPlanTemplate";
import { INITIAL_BUILDING_PLAN_PROJECT } from "../../data/sampleBuildingPlans";
import { PlanSheetCanvas } from "./PlanSheetCanvas";
import { TitleBlockEditor } from "./TitleBlockEditor";
import { AutosaveIndicator } from "./AutosaveIndicator";
import { PlanSheetViewModal } from "./PlanSheetViewModal";
import { PlanQrScanPortalModal } from "./PlanQrScanPortalModal";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  exportSheetToPdf,
  exportSheetToPng,
  exportSheetToJpeg,
  exportAllSheetsToPdf,
  printSheetDocument,
  generateDirectProjectVectorPdf,
  downloadBlob,
  shareProjectViaWhatsApp,
  shareProjectViaEmail
} from "../../utils/planExportUtils";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Copy,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileDown,
  Layers,
  Sparkles,
  Sliders,
  Check,
  Loader2,
  Eye,
  FileCheck2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Info,
  LayoutGrid,
  QrCode,
  Compass,
  Phone,
  MessageSquare,
  Printer,
  Mail,
  Share2,
  Image as ImageIcon
} from "lucide-react";

const STORAGE_KEY = "VAS_BUILDING_PLAN_PROJECT";

interface BuildingPlanTemplateTabProps {
  project?: BuildingPlanProject;
  onUpdateProject?: (updated: BuildingPlanProject) => void;
  onBackToDashboard?: () => void;
  onViewProject?: (project: BuildingPlanProject) => void;
}

export const BuildingPlanTemplateTab: React.FC<BuildingPlanTemplateTabProps> = ({
  project: propProject,
  onUpdateProject,
  onBackToDashboard,
  onViewProject
}) => {
  // Load from prop, localStorage, or default sample
  const [project, setProject] = useState<BuildingPlanProject>(() => {
    if (propProject) return propProject;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load saved plan project:", e);
    }
    return INITIAL_BUILDING_PLAN_PROJECT;
  });

  // Sync if parent passes a different project
  useEffect(() => {
    if (propProject && propProject.id !== project.id) {
      setProject(propProject);
      setActiveSheetIndex(0);
    }
  }, [propProject]);

  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);

  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string>(() => {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  const isInitialMount = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleReplaceInputRef = useRef<HTMLInputElement>(null);
  const currentCanvasRef = useRef<HTMLDivElement>(null);
  const exportHiddenContainerRef = useRef<HTMLDivElement>(null);

  // Debounced Autosave to localStorage and parent callback
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setAutosaveStatus("saving");
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        if (onUpdateProject) {
          onUpdateProject(project);
        }
        const formatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSavedAt(formatted);
        setAutosaveStatus("saved");
      } catch (e) {
        console.warn("Autosave failed:", e);
        setAutosaveStatus("unsaved");
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [project, onUpdateProject]);

  const handleManualSave = () => {
    setAutosaveStatus("saving");
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
        if (onUpdateProject) {
          onUpdateProject(project);
        }
        const formatted = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSavedAt(formatted);
        setAutosaveStatus("saved");
        triggerToast("Project file autosaved successfully!");
      } catch (e) {
        setAutosaveStatus("unsaved");
      }
    }, 200);
  };

  // Ensure activeSheetIndex is valid
  const currentSheetIndex = Math.min(
    Math.max(0, activeSheetIndex),
    Math.max(0, project.sheets.length - 1)
  );
  const activeSheet = project.sheets[currentSheetIndex] || project.sheets[0];

  // Update active sheet
  const handleUpdateActiveSheet = (updatedSheet: PlanSheet) => {
    const updatedSheets = [...project.sheets];
    updatedSheets[currentSheetIndex] = updatedSheet;
    setProject({
      ...project,
      sheets: updatedSheets,
      updatedAt: new Date().toISOString().split("T")[0]
    });
  };

  // Apply Common project details to all sheets
  const handleApplyToAllSheets = () => {
    const updatedSheets = project.sheets.map((s, idx) => ({
      ...s,
      scale: s.scale || project.defaultScale,
      date: project.defaultDate,
      revision: project.defaultRevision
    }));
    setProject({ ...project, sheets: updatedSheets });
    triggerToast("Common client, engineer, and date details applied to all sheets!");
  };

  const triggerToast = (msg: string) => {
    setShowSuccessToast(msg);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  // Upload Multiple Plans & Automatically arrange them onto sheets!
  const handleMultiplePlanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    let loadedCount = 0;
    const newSheets: PlanSheet[] = [];

    const standardNames = [
      "GROUND FLOOR PLAN",
      "FIRST FLOOR PLAN",
      "SECOND FLOOR PLAN",
      "ROOF & TERRACE PLAN",
      "SITE & LOCATION PLAN",
      "CROSS SECTION A-A",
      "FRONT & SIDE ELEVATION"
    ];

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        const resultUrl = reader.result as string;
        const currentTotal = project.sheets.length + newSheets.length + 1;
        const cleanName = file.name
          .replace(/\.[^/.]+$/, "")
          .replace(/[-_]/g, " ")
          .toUpperCase();

        const assignedName =
          standardNames[project.sheets.length + idx] || cleanName || `PLAN SHEET ${currentTotal}`;

        newSheets.push({
          id: `sheet-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          sheetNumber: currentTotal,
          drawingNumber: `DWG-2026/${String(currentTotal).padStart(2, "0")}`,
          drawingName: assignedName,
          floorName: assignedName.replace("PLAN", "").trim() || `Floor ${currentTotal}`,
          scale: project.defaultScale || "1 : 100",
          date: project.defaultDate || new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
          revision: project.defaultRevision || "R0",
          planImageUrl: resultUrl,
          planFileName: file.name,
          zoom: 100,
          panX: 0,
          panY: 0,
          rotation: 0,
          fitMode: "contain"
        });

        loadedCount++;
        if (loadedCount === fileList.length) {
          // All files loaded
          setProject((prev) => ({
            ...prev,
            sheets: [...prev.sheets, ...newSheets]
          }));
          setActiveSheetIndex(project.sheets.length);
          triggerToast(`Successfully arranged ${fileList.length} plans onto template sheets!`);
        }
      };

      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Replace active sheet's image
  const handleReplaceActivePlan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSheet) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateActiveSheet({
        ...activeSheet,
        planImageUrl: reader.result as string,
        planFileName: file.name,
        zoom: 100,
        panX: 0,
        panY: 0,
        rotation: 0
      });
      triggerToast("Plan image replaced successfully!");
    };
    reader.readAsDataURL(file);

    if (singleReplaceInputRef.current) singleReplaceInputRef.current.value = "";
  };

  // Add a blank new sheet
  const handleAddBlankSheet = () => {
    const nextNum = project.sheets.length + 1;
    const newSheet: PlanSheet = {
      id: `sheet-${Date.now()}`,
      sheetNumber: nextNum,
      drawingNumber: `DWG-2026/${String(nextNum).padStart(2, "0")}`,
      drawingName: `PROPOSED PLAN - SHEET ${nextNum}`,
      floorName: `Floor ${nextNum}`,
      scale: project.defaultScale || "1 : 100",
      date: project.defaultDate || new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
      revision: project.defaultRevision || "R0",
      zoom: 100,
      panX: 0,
      panY: 0,
      rotation: 0,
      fitMode: "contain"
    };

    setProject({
      ...project,
      sheets: [...project.sheets, newSheet]
    });
    setActiveSheetIndex(project.sheets.length);
    triggerToast(`Added Sheet ${nextNum}`);
  };

  // Duplicate active sheet
  const handleDuplicateSheet = () => {
    if (!activeSheet) return;
    const nextNum = project.sheets.length + 1;
    const duplicated: PlanSheet = {
      ...activeSheet,
      id: `sheet-${Date.now()}`,
      sheetNumber: nextNum,
      drawingNumber: `DWG-2026/${String(nextNum).padStart(2, "0")}`,
      drawingName: `${activeSheet.drawingName} (COPY)`
    };

    setProject({
      ...project,
      sheets: [...project.sheets, duplicated]
    });
    setActiveSheetIndex(project.sheets.length);
    triggerToast("Sheet duplicated successfully!");
  };

  // Delete active sheet
  const handleDeleteSheet = (indexToDelete: number) => {
    if (project.sheets.length <= 1) {
      alert("At least one sheet must remain in the project.");
      return;
    }

    const updated = project.sheets
      .filter((_, idx) => idx !== indexToDelete)
      .map((s, idx) => ({ ...s, sheetNumber: idx + 1 }));

    setProject({ ...project, sheets: updated });
    setActiveSheetIndex(Math.max(0, indexToDelete - 1));
    triggerToast("Sheet deleted");
  };

  // Reset to Kerala sample project
  const handleResetSampleProject = () => {
    if (window.confirm("Load sample project with 2 architectural plans, area table, and Deepak C. details?")) {
      setProject(INITIAL_BUILDING_PLAN_PROJECT);
      setActiveSheetIndex(0);
      triggerToast("Loaded Kerala Architectural Plan Sample!");
    }
  };

  // Single PDF Download for ALL Plans
  const handleDownloadAllPlansPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportProgress("Preparing A4 Landscape architectural sheets...");

    try {
      await exportAllSheetsToPdf(
        project,
        async (sheetIndex) => {
          if (sheetIndex !== activeSheetIndex) {
            setActiveSheetIndex(sheetIndex);
            await new Promise((r) => setTimeout(r, 350));
          }
          const elementId = `plan-sheet-canvas-${project.sheets[sheetIndex].id}`;
          return document.getElementById(elementId) || currentCanvasRef.current;
        },
        (status) => setExportProgress(status)
      );
      triggerToast("Complete set of architectural sheets downloaded in PDF!");
    } catch (err) {
      console.error("Multi-sheet html2canvas export error, falling back to direct vector PDF:", err);
      try {
        const blob = await generateDirectProjectVectorPdf(project);
        const fileName = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_Architectural_Drawings.pdf`;
        downloadBlob(blob, fileName);
        triggerToast("Architectural drawings PDF downloaded successfully!");
      } catch (fallbackErr) {
        console.error("Fallback vector PDF failed:", fallbackErr);
        window.print();
      }
    } finally {
      setIsExportingPdf(false);
      setExportProgress("");
    }
  };

  // Download Current Sheet as PNG
  const handleDownloadSheetPng = async () => {
    if (!currentCanvasRef.current) return;
    try {
      triggerToast("Exporting high-resolution PNG...");
      await exportSheetToPng(currentCanvasRef.current, project, activeSheet);
      triggerToast("PNG image exported successfully!");
    } catch (e) {
      console.error("Export PNG error:", e);
      triggerToast("PNG export failed. Please check browser permissions.");
    }
  };

  // Download Current Sheet as JPEG
  const handleDownloadSheetJpeg = async () => {
    if (!currentCanvasRef.current) return;
    try {
      triggerToast("Exporting high-resolution JPEG...");
      await exportSheetToJpeg(currentCanvasRef.current, project, activeSheet);
      triggerToast("JPEG image exported successfully!");
    } catch (e) {
      console.error("Export JPEG error:", e);
      triggerToast("JPEG export failed. Please check browser permissions.");
    }
  };

  // Download Single Active Sheet as A4 PDF
  const handleExportSingleSheetPdf = async () => {
    if (!currentCanvasRef.current) return;
    try {
      triggerToast("Generating single A4 Landscape PDF for this plan...");
      await exportSheetToPdf(currentCanvasRef.current, project, activeSheet);
      triggerToast("A4 Plan PDF downloaded successfully!");
    } catch (err) {
      console.error("Single sheet export error, falling back to direct vector PDF:", err);
      try {
        const blob = await generateDirectProjectVectorPdf(project, activeSheet);
        const fileName = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_${activeSheet.drawingNumber || "Plan"}.pdf`;
        downloadBlob(blob, fileName);
        triggerToast("A4 Plan PDF downloaded successfully!");
      } catch (fallbackErr) {
        console.error("Vector PDF fallback error:", fallbackErr);
        window.print();
      }
    }
  };

  // Print Document Option
  const handlePrintDocument = () => {
    if (currentCanvasRef.current) {
      printSheetDocument(currentCanvasRef.current, project, activeSheet);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-mono text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400">
          <Check className="w-4 h-4" />
          <span>{showSuccessToast}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMultiplePlanUpload}
        multiple
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={singleReplaceInputRef}
        onChange={handleReplaceActivePlan}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* TOP HEADER & ACTION BANNER */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
              {project.projectTitle || "Building Plan Template"}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40">
              A4 LANDSCAPE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
              70mm TITLE BLOCK
            </span>
            {/* AUTOSAVE ICON ON FILE */}
            <AutosaveIndicator
              status={autosaveStatus}
              lastSavedAt={lastSavedAt}
              onManualSave={handleManualSave}
            />
          </div>
          <p className="text-xs text-slate-400 max-w-2xl font-mono">
            Client: <span className="text-slate-200 font-bold">{project.clientName}</span> • Location: {project.projectLocation}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Back to Dashboard Button */}
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Return to Projects Dashboard"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dashboard</span>
            </button>
          )}

          {/* View Blueprint Presentation Modal */}
          <button
            onClick={() => {
              if (onViewProject) {
                onViewProject(project);
              } else {
                setIsViewModalOpen(true);
              }
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
            title="Open High-Definition A4 Presentation View"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>View Mode</span>
          </button>

          {/* Upload Multiple Plans */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            title="Upload multiple plan files (PNG, JPG, SVG) to auto-arrange them across sheets"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Plans</span>
          </button>

          {/* Single Combined PDF Download */}
          <button
            onClick={handleDownloadAllPlansPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Download all sheets compiled into a single professional PDF"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{exportProgress || "Generating PDF..."}</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span>Download Single PDF ({project.sheets.length} Sheets)</span>
              </>
            )}
          </button>

          {/* Toggle Title Block Settings */}
          <button
            onClick={() => setShowEditor(!showEditor)}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showEditor
                ? "bg-slate-800 text-cyan-300 border-cyan-500/40"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showEditor ? "Hide Title Block" : "Title Block Details"}</span>
          </button>

          {/* Reset / Sample */}
          <button
            onClick={handleResetSampleProject}
            className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer"
            title="Reload Kerala Sample Architectural Plans"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SHEET MANAGER / THUMBNAIL SELECTOR BAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sheets:</span>
          </span>

          {project.sheets.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setActiveSheetIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                activeSheetIndex === idx
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>{s.drawingNumber || `DWG-${idx + 1}`}</span>
              <span className="text-[10px] opacity-80 max-w-[120px] truncate">
                {s.floorName || s.drawingName}
              </span>
              <span className="text-[9px] px-1 rounded bg-black/30">
                {idx + 1}/{project.sheets.length}
              </span>
            </div>
          ))}

          {/* Add Blank Sheet */}
          <button
            onClick={handleAddBlankSheet}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-400 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
            title="Add blank plan sheet"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sheet</span>
          </button>
        </div>

        {/* Current Sheet Quick Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => singleReplaceInputRef.current?.click()}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            title="Change plan drawing image for this sheet"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Replace Plan</span>
          </button>

          <button
            onClick={handleDuplicateSheet}
            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer"
            title="Duplicate Current Sheet"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDeleteSheet(activeSheetIndex)}
            disabled={project.sheets.length <= 1}
            className="p-1.5 bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 rounded-xl transition-all cursor-pointer disabled:opacity-30"
            title="Delete Current Sheet"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Export PDF for current sheet */}
          <button
            onClick={handleExportSingleSheetPdf}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 hover:text-white border border-slate-800 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            title="Download this sheet as single A4 PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>PDF</span>
          </button>

          {/* Export PNG */}
          <button
            onClick={handleDownloadSheetPng}
            className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            title="Download this sheet as PNG image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>PNG</span>
          </button>

          {/* Export JPEG */}
          <button
            onClick={handleDownloadSheetJpeg}
            className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            title="Download this sheet as JPEG image"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>JPEG</span>
          </button>

          {/* Print Document */}
          <button
            onClick={handlePrintDocument}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
            title="Print document or save via system printer dialog"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={() => shareProjectViaWhatsApp(project)}
            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl transition-all cursor-pointer"
            title="Send Plan via WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Email Share */}
          <button
            onClick={() => shareProjectViaEmail(project)}
            className="p-1.5 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 rounded-xl transition-all cursor-pointer"
            title="Send Plan via Email"
          >
            <Mail className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ACTIVE PLAN CANVAS TOOLBAR (ZOOM / PAN / ROTATE / FIT) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 flex items-center gap-1">
            <span className="font-bold text-white">{activeSheet.drawingName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400">{activeSheet.scale}</span>
          </span>
        </div>

        {/* Zoom & Transform Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Out */}
          <button
            onClick={() =>
              handleUpdateActiveSheet({
                ...activeSheet,
                zoom: Math.max(30, (activeSheet.zoom || 100) - 10)
              })
            }
            className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-slate-300 w-12 text-center">{activeSheet.zoom || 100}%</span>

          {/* Zoom In */}
          <button
            onClick={() =>
              handleUpdateActiveSheet({
                ...activeSheet,
                zoom: Math.min(300, (activeSheet.zoom || 100) + 10)
              })
            }
            className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Rotate 90 deg */}
          <button
            onClick={() =>
              handleUpdateActiveSheet({
                ...activeSheet,
                rotation: ((activeSheet.rotation || 0) + 90) % 360
              })
            }
            className="p-1 text-slate-400 hover:text-cyan-400 bg-slate-900 border border-slate-800 rounded cursor-pointer ml-1"
            title="Rotate Plan 90 Degrees"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Reset View */}
          <button
            onClick={() =>
              handleUpdateActiveSheet({
                ...activeSheet,
                zoom: 100,
                panX: 0,
                panY: 0,
                rotation: 0
              })
            }
            className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded cursor-pointer ml-1"
          >
            Reset
          </button>

          {/* Fit Mode */}
          <select
            value={activeSheet.fitMode || "contain"}
            onChange={(e) =>
              handleUpdateActiveSheet({
                ...activeSheet,
                fitMode: e.target.value as any
              })
            }
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none ml-1"
          >
            <option value="contain">Fit: Contain</option>
            <option value="fill">Fit: Fill</option>
            <option value="cover">Fit: Cover</option>
          </select>
          {/* North Sign Quick Rotate */}
          <button
            onClick={() =>
              handleUpdateActiveSheet({
                ...activeSheet,
                northRotation: (((activeSheet.northRotation || 0) + 45) % 360)
              })
            }
            className="px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 bg-red-950/40 border border-red-800/60 rounded cursor-pointer ml-1 flex items-center gap-1"
            title="Rotate North Sign by 45°"
          >
            <Compass className="w-3 h-3 text-red-400" />
            <span>North: {activeSheet.northRotation || 0}°</span>
          </button>

          {/* Quick QR & Engineer Contact Modal */}
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="px-2 py-0.5 text-[10px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded cursor-pointer ml-1 flex items-center gap-1"
            title="Scan Plan QR Code & Contact Engineer"
          >
            <QrCode className="w-3 h-3 text-emerald-400" />
            <span>QR & Engineer</span>
          </button>
        </div>
      </div>

      {/* PLAN CANVAS PREVIEW */}
      <PlanSheetCanvas
        project={project}
        sheet={activeSheet}
        sheetIndex={currentSheetIndex}
        totalSheets={project.sheets.length}
        canvasRef={currentCanvasRef}
        onUpdateSheet={handleUpdateActiveSheet}
        selectedAttachmentId={selectedAttachmentId}
        onSelectAttachment={setSelectedAttachmentId}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onDownloadPdf={handleExportSingleSheetPdf}
      />

      {/* TITLE BLOCK DETAILS & EDITOR (COLLAPSIBLE) */}
      {showEditor && (
        <TitleBlockEditor
          project={project}
          activeSheet={activeSheet}
          onUpdateProject={(up) => setProject(up)}
          onUpdateActiveSheet={handleUpdateActiveSheet}
          onApplyToAllSheets={handleApplyToAllSheets}
        />
      )}

      {/* HELPFUL SPECIFICATION NOTICE */}
      <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-2 text-cyan-400 font-bold font-mono">
          <Info className="w-4 h-4" />
          <span>A4 Landscape Architectural Blueprint Standard</span>
        </div>
        <p className="leading-relaxed">
          The layout is formatted on an authentic 297mm × 210mm A4 canvas with a 70mm right-side title block strip, ensuring optimal space for the Area Table grid, Vasthu Kol Alavu, and Revisions without cramping the drawing. All sheets are compiled into a unified, high-definition single PDF ready for submission to K-SMART, LSGD, or clients.
        </p>
      </div>

      {/* Interactive A4 Presentation View Modal */}
      {isViewModalOpen && (
        <PlanSheetViewModal
          project={project}
          initialSheetIndex={currentSheetIndex}
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}

      {/* Mobile QR Verification & Engineer Contact Modal */}
      {isQrModalOpen && (
        <PlanQrScanPortalModal
          project={project}
          sheet={activeSheet}
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          onDownloadPdf={handleExportSingleSheetPdf}
        />
      )}
    </div>
  );
};
