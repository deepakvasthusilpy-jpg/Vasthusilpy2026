import React, { useState, useRef } from "react";
import { BuildingPlanProject, PlanSheet } from "../../types/buildingPlanTemplate";
import { PlanSheetCanvas } from "./PlanSheetCanvas";
import {
  printSheetDocument,
  printAllSheetsDocument,
  exportSheetToPdf,
  generateDirectProjectVectorPdf,
  downloadBlob
} from "../../utils/planExportUtils";
import {
  Printer,
  X,
  FileCheck2,
  Sliders,
  Maximize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Stamp,
  Layers,
  Info,
  Check,
  Eye,
  Loader2,
  FileText
} from "lucide-react";

interface PlanPrintPreviewModalProps {
  project: BuildingPlanProject;
  initialSheetIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onPrintSuccess?: () => void;
}

export const PlanPrintPreviewModal: React.FC<PlanPrintPreviewModalProps> = ({
  project,
  initialSheetIndex = 0,
  isOpen,
  onClose,
  onPrintSuccess
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(initialSheetIndex);
  const [printScope, setPrintScope] = useState<"current" | "all">("current");
  const [colorMode, setColorMode] = useState<"color" | "monochrome">("color");
  const [showMarginGuide, setShowMarginGuide] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const previewCanvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentSheetIndex = Math.min(
    Math.max(0, activeSheetIndex),
    Math.max(0, project.sheets.length - 1)
  );
  const activeSheet: PlanSheet = project.sheets[currentSheetIndex] || project.sheets[0];

  const totalSheets = project.sheets.length;
  const margins = activeSheet.marginConfig || project.marginConfig || {
    leftMm: 15,
    rightMm: 10,
    topMm: 10,
    bottomMm: 10,
    presetName: "standard_kerala"
  };

  const handleTriggerPrint = async () => {
    setIsPrinting(true);
    try {
      if (printScope === "all") {
        await printAllSheetsDocument(
          project,
          async () => previewCanvasRef.current,
          () => {}
        );
      } else {
        if (previewCanvasRef.current) {
          await printSheetDocument(previewCanvasRef.current, project, activeSheet);
        }
      }
      if (onPrintSuccess) onPrintSuccess();
    } catch (err) {
      console.error("Print error in preview modal:", err);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      if (previewCanvasRef.current) {
        await exportSheetToPdf(previewCanvasRef.current, project, activeSheet);
      } else {
        const blob = await generateDirectProjectVectorPdf(project, activeSheet);
        const cleanTitle = (project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_");
        downloadBlob(blob, `${cleanTitle}_${activeSheet.drawingNumber || "Plan"}.pdf`);
      }
    } catch (err) {
      console.warn("Fallback to direct vector PDF:", err);
      const blob = await generateDirectProjectVectorPdf(project, activeSheet);
      const cleanTitle = (project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_");
      downloadBlob(blob, `${cleanTitle}_${activeSheet.drawingNumber || "Plan"}.pdf`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* ========================================================= */}
        {/* TOP BAR: MODAL HEADER & ACTIONS                           */}
        {/* ========================================================= */}
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-950">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm tracking-tight">Print-Friendly Preview</h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-mono text-[10px] font-bold">
                  A4 LANDSCAPE (297 × 210 mm)
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Inspect drawing scale, title block, margins, and annotations before sending to printer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold border border-slate-700 transition cursor-pointer"
              title="Save a PDF copy before printing"
            >
              {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-cyan-400" />}
              <span>Download PDF</span>
            </button>

            {/* CONFIRM & PROCEED TO PRINT BUTTON */}
            <button
              onClick={handleTriggerPrint}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold transition shadow-lg shadow-emerald-950 cursor-pointer disabled:opacity-60"
            >
              {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span>{isPrinting ? "Opening Printer..." : "Proceed to Print"}</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              title="Close print preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SETTINGS & METADATA SUB-BAR                                */}
        {/* ========================================================= */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300 flex-shrink-0">
          {/* Left: Sheet Switcher Controls */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold uppercase text-[10px]">SHEET:</span>
            <button
              onClick={() => setActiveSheetIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSheetIndex === 0}
              className="p-1 bg-slate-900 border border-slate-800 rounded text-slate-300 disabled:opacity-30 hover:text-white cursor-pointer"
              title="Previous Sheet"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1">
              {project.sheets.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSheetIndex(idx)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                    currentSheetIndex === idx
                      ? "bg-red-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  {s.drawingNumber || `DWG-${idx + 1}`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSheetIndex((prev) => Math.min(totalSheets - 1, prev + 1))}
              disabled={currentSheetIndex === totalSheets - 1}
              className="p-1 bg-slate-900 border border-slate-800 rounded text-slate-300 disabled:opacity-30 hover:text-white cursor-pointer"
              title="Next Sheet"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <span className="text-slate-500 text-[11px]">
              ({currentSheetIndex + 1} of {totalSheets})
            </span>
          </div>

          {/* Center: Print Scope & Color Mode */}
          <div className="flex items-center gap-3">
            {/* Scope */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setPrintScope("current")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  printScope === "current"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Current Sheet Only
              </button>
              <button
                onClick={() => setPrintScope("all")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  printScope === "all"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All {totalSheets} Sheets (Set)
              </button>
            </div>

            {/* Color mode */}
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setColorMode("color")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  colorMode === "color"
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Architectural Color
              </button>
              <button
                onClick={() => setColorMode("monochrome")}
                className={`px-2 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                  colorMode === "monochrome"
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                CAD Black & White
              </button>
            </div>
          </div>

          {/* Right: Zoom & Margin Overlay Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMarginGuide(!showMarginGuide)}
              className={`px-2 py-1 rounded border text-[10px] flex items-center gap-1 transition cursor-pointer ${
                showMarginGuide
                  ? "bg-amber-950/60 border-amber-600 text-amber-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title="Toggle binding margin guides"
            >
              <span>Margins ({margins.leftMm}mm)</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] w-8 text-center text-slate-400">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(140, z + 10))}
                className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-800 text-[9px]"
              >
                Fit
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER VIEWPORT: TRUE PRINT PREVIEW CANVAS                */}
        {/* ========================================================= */}
        <div className="flex-1 bg-slate-950 overflow-auto p-4 sm:p-6 flex items-center justify-center relative">
          <div
            className={`transition-all duration-200 origin-center ${
              colorMode === "monochrome" ? "grayscale contrast-125" : ""
            }`}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              maxWidth: "1080px",
              width: "100%"
            }}
          >
            {/* Sheet Container with realistic Paper Shadow & 297mm x 210mm Aspect */}
            <div className="bg-white rounded-xs shadow-2xl p-1 relative border border-slate-300">
              {/* Margin Guide Lines (Visual Guide for binding margin) */}
              {showMarginGuide && (
                <div
                  className="absolute pointer-events-none z-40 border border-dashed border-amber-500/50"
                  style={{
                    top: `${(margins.topMm / 210) * 100}%`,
                    left: `${(margins.leftMm / 297) * 100}%`,
                    right: `${(margins.rightMm / 297) * 100}%`,
                    bottom: `${(margins.bottomMm / 210) * 100}%`
                  }}
                >
                  <span className="absolute top-1 left-1.5 bg-amber-500 text-slate-950 text-[7px] font-mono font-bold px-1 rounded shadow-xs">
                    Printable Boundary (Binding: {margins.leftMm}mm)
                  </span>
                </div>
              )}

              {/* Real Print PlanSheetCanvas */}
              <PlanSheetCanvas
                project={project}
                sheet={activeSheet}
                sheetIndex={currentSheetIndex}
                totalSheets={totalSheets}
                canvasRef={previewCanvasRef}
                isExporting={true}
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FOOTER: PRINT COMPLIANCE SUMMARY BAR                      */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 flex-shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Stamp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Title Block: <strong>{project.stripWidthMm || 70}mm</strong> (Kerala LSGD Compliant)</span>
            </span>
            <span>•</span>
            <span>Client: <strong className="text-white">{project.clientName || "Client"}</strong></span>
            <span>•</span>
            <span>Scale: <strong className="text-white">{activeSheet.scale || "1 : 100"}</strong></span>
            <span>•</span>
            <span>Engineer: <strong className="text-emerald-400">{project.licenseeName || "DEEPAK S."}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">
              Pressing "Proceed to Print" uses high-fidelity isolated document formatting.
            </span>
            <button
              onClick={handleTriggerPrint}
              disabled={isPrinting}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-60"
            >
              <Printer className="w-3 h-3" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
