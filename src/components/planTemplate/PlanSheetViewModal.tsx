import React, { useState, useRef } from "react";
import { BuildingPlanProject } from "../../types/buildingPlanTemplate";
import { PlanSheetCanvas } from "./PlanSheetCanvas";
import { PlanPrintPreviewModal } from "./PlanPrintPreviewModal";
import {
  exportSheetToPdf,
  printSheetDocument,
  generateDirectProjectVectorPdf,
  downloadBlob,
  shareProjectViaWhatsApp,
  shareProjectViaEmail
} from "../../utils/planExportUtils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Edit3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck2,
  Layers,
  Sparkles,
  Loader2,
  Ruler,
  FileDown,
  MessageSquare,
  Mail
} from "lucide-react";

interface PlanSheetViewModalProps {
  project: BuildingPlanProject;
  initialSheetIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onEditProject?: (project: BuildingPlanProject) => void;
}

export const PlanSheetViewModal: React.FC<PlanSheetViewModalProps> = ({
  project,
  initialSheetIndex = 0,
  isOpen,
  onClose,
  onEditProject
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(initialSheetIndex);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentSheetIndex = Math.min(
    Math.max(0, activeSheetIndex),
    Math.max(0, project.sheets.length - 1)
  );
  const activeSheet = project.sheets[currentSheetIndex] || project.sheets[0];

  const handlePrevSheet = () => {
    setActiveSheetIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextSheet = () => {
    setActiveSheetIndex((prev) => Math.min(project.sheets.length - 1, prev + 1));
  };

  const handleDownloadSinglePdf = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      await exportSheetToPdf(canvasRef.current, project, activeSheet);
    } catch (err) {
      console.error("Failed to export sheet PDF via canvas, using vector fallback:", err);
      try {
        const blob = await generateDirectProjectVectorPdf(project, activeSheet);
        const fileName = `${project.clientName.replace(/\s+/g, "_")}_${activeSheet.drawingNumber}.pdf`;
        downloadBlob(blob, fileName);
      } catch (fallbackErr) {
        console.error("Vector PDF fallback error:", fallbackErr);
        window.print();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setIsPrintPreviewOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
        {/* Project & Client Title */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {project.projectTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/40 shrink-0">
                A4 VIEW MODE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">
              Client: {project.clientName} • Location: {project.projectLocation}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom Controls */}
          <div className="hidden md:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.1))}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300 min-w-[45px] text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(1.8, z + 0.1))}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition text-[10px] font-mono"
              title="Fit to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Single PDF Download */}
          <button
            onClick={handleDownloadSinglePdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Download this sheet as PDF"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Print Sheet */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold font-mono transition border border-slate-700 cursor-pointer"
            title="Print Blueprint"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={() => shareProjectViaWhatsApp(project)}
            className="p-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl transition cursor-pointer"
            title="Share via WhatsApp"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Email Share */}
          <button
            onClick={() => shareProjectViaEmail(project)}
            className="p-2 bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 rounded-xl transition cursor-pointer"
            title="Share via Email"
          >
            <Mail className="w-4 h-4" />
          </button>

          {/* Switch to Edit Mode */}
          {onEditProject && (
            <button
              onClick={() => {
                onEditProject(project);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono transition shadow-lg shadow-cyan-950 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Project</span>
            </button>
          )}

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Presentation Viewport */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950">
        <div
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "center center",
            transition: "transform 0.15s ease-out",
            width: "100%",
            maxWidth: "1080px"
          }}
        >
          <PlanSheetCanvas
            project={project}
            sheet={activeSheet}
            sheetIndex={currentSheetIndex}
            totalSheets={project.sheets.length}
            canvasRef={canvasRef}
          />
        </div>
      </div>

      {/* Bottom Sheet Navigation Bar */}
      <div className="h-14 px-4 sm:px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
        {/* Active Sheet Details */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono font-bold text-cyan-300">
            {activeSheet.drawingNumber}
          </div>
          <div className="hidden sm:block text-xs text-slate-300 truncate max-w-md">
            {activeSheet.drawingName}
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Scale: {activeSheet.scale}
          </span>
        </div>

        {/* Sheet Pager */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevSheet}
            disabled={currentSheetIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 cursor-pointer transition"
            title="Previous Sheet"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {project.sheets.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSheetIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  idx === currentSheetIndex
                    ? "bg-cyan-600 text-white shadow"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            onClick={handleNextSheet}
            disabled={currentSheetIndex === project.sheets.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 cursor-pointer transition"
            title="Next Sheet"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-slate-400 ml-2">
            Sheet {currentSheetIndex + 1} of {project.sheets.length}
          </span>
        </div>
      </div>

      {/* Dedicated Print-Friendly Preview Modal */}
      {isPrintPreviewOpen && (
        <PlanPrintPreviewModal
          project={project}
          initialSheetIndex={currentSheetIndex}
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
        />
      )}
    </div>
  );
};
