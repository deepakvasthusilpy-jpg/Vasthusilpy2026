import React, { useState, useEffect, useMemo, useRef } from "react";
import { CADDrawingRecord, CADAttachment, CADDrawingData } from "../../../types/dataStorageTypes";
import { formatBytes, downloadAttachment, triggerDxfDownload } from "../../../utils/dataStorageManager";
import { generateCadBlueprintPdf } from "../../../utils/cadPdfExportHelper";
import { PdfCanvasViewer } from "./PdfCanvasViewer";
import {
  X,
  FileText,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ExternalLink,
  Compass,
  Home,
  Layers,
  Phone,
  User,
  MapPin,
  Sparkles,
  Info,
  Image as ImageIcon,
  FileCode,
  Share2,
  CheckCircle2,
  Grid,
  Ruler,
  Eye,
  FileBox
} from "lucide-react";

interface PdfViewerModalProps {
  file: CADDrawingRecord;
  attachment?: CADAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenShare?: (file: CADDrawingRecord) => void;
}

type PreviewFileType = "pdf" | "image" | "cad" | "text" | "dwg";

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  file,
  attachment,
  isOpen,
  onClose,
  onOpenShare
}) => {
  // All available preview tabs (attachments + cad vector + generated blueprint)
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>("default");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  // Image viewer zoom & rotation
  const [imgZoom, setImgZoom] = useState<number>(100);
  const [imgRotation, setImgRotation] = useState<number>(0);

  // CAD 2D Canvas reference
  const cadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cadZoom, setCadZoom] = useState<number>(35);
  const [cadPan, setCadPan] = useState<{ x: number; y: number }>({ x: 80, y: 80 });
  const [showVastuGrid, setShowVastuGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  // Generated Blueprint PDF state
  const [generatedPdfDataUrl, setGeneratedPdfDataUrl] = useState<string | null>(null);

  // Build complete list of previewable items
  const previewItems = useMemo(() => {
    const items: {
      id: string;
      name: string;
      type: PreviewFileType;
      attachment?: CADAttachment;
      size?: number;
      isGenerated?: boolean;
    }[] = [];

    // 1. Attached Files
    if (file.attachments && file.attachments.length > 0) {
      file.attachments.forEach((att) => {
        let type: PreviewFileType = "text";
        if (att.isPdf || att.name.toLowerCase().endsWith(".pdf")) {
          type = "pdf";
        } else if (att.isImage || /\.(png|jpe?g|webp|svg|bmp|gif)$/i.test(att.name)) {
          type = "image";
        } else if (att.isDwgOrDxf || /\.(dwg|dxf)$/i.test(att.name)) {
          type = "dwg";
        }
        items.push({
          id: att.id,
          name: att.name,
          type,
          attachment: att,
          size: att.size
        });
      });
    }

    // 2. Interactive CAD 2D Plan (if entities exist or default)
    if (file.drawingData?.entities && file.drawingData.entities.length > 0) {
      items.push({
        id: "cad-vector-view",
        name: "2D Architectural CAD Plan",
        type: "cad",
        size: 250000
      });
    }

    // 3. Generated Official Blueprint PDF Sheet
    items.push({
      id: "generated-blueprint-pdf",
      name: "Official Blueprint Sheet.pdf",
      type: "pdf",
      size: 450000,
      isGenerated: true
    });

    return items;
  }, [file]);

  // Initial selection
  useEffect(() => {
    if (!isOpen) return;

    if (attachment) {
      setSelectedAttachmentId(attachment.id);
    } else if (previewItems.length > 0) {
      // Find first PDF or first item
      const firstPdf = previewItems.find((p) => p.type === "pdf");
      setSelectedAttachmentId(firstPdf ? firstPdf.id : previewItems[0].id);
    }
  }, [isOpen, attachment, previewItems]);

  // Generate blueprint PDF when needed
  useEffect(() => {
    if (isOpen) {
      try {
        const { dataUrl } = generateCadBlueprintPdf(file);
        setGeneratedPdfDataUrl(dataUrl);
      } catch (e) {
        console.warn("Failed to pre-generate blueprint PDF:", e);
      }
    }
  }, [isOpen, file]);

  if (!isOpen) return null;

  const activeItem = previewItems.find((p) => p.id === selectedAttachmentId) || previewItems[0];

  // Derive source for PDF
  const currentPdfSource = useMemo(() => {
    if (!activeItem) return null;
    if (activeItem.isGenerated) {
      return generatedPdfDataUrl;
    }
    if (activeItem.attachment) {
      return activeItem.attachment.dataUrl || activeItem.attachment.downloadUrl || null;
    }
    return generatedPdfDataUrl;
  }, [activeItem, generatedPdfDataUrl]);

  // Handle Download
  const handleDownloadActive = () => {
    if (!activeItem) return;

    if (activeItem.attachment) {
      downloadAttachment(activeItem.attachment, activeItem.name);
    } else if (activeItem.type === "cad" && file.drawingData) {
      triggerDxfDownload(file.drawingData, `${file.name.replace(/\.[^/.]+$/, "")}.dxf`);
    } else if (activeItem.isGenerated && generatedPdfDataUrl) {
      const a = document.createElement("a");
      a.href = generatedPdfDataUrl;
      a.download = `${file.name.replace(/\.[^/.]+$/, "")}_Blueprint_Sheet.pdf`;
      a.click();
    }
  };

  // Render CAD Vector Canvas
  useEffect(() => {
    if (activeItem?.type !== "cad" && activeItem?.type !== "dwg") return;
    const canvas = cadCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    // Dark Blueprint Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // Blueprint Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    const gridSize = 1 * cadZoom;
    for (let x = cadPan.x % gridSize; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = cadPan.y % gridSize; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const drawingData = file.drawingData || {
      version: "1.0",
      units: "meters",
      scale: 1,
      entities: [
        { id: "w-1", type: "rect", layer: "01_WALLS", x: 2, y: 2, width: 14, height: 11, color: "#10b981" },
        { id: "w-2", type: "line", layer: "01_WALLS", x1: 2, y1: 7, x2: 8, y2: 7, color: "#10b981" },
        { id: "w-3", type: "line", layer: "01_WALLS", x1: 8, y1: 2, x2: 8, y2: 13, color: "#10b981" },
        { id: "v-1", type: "vastu_grid", layer: "04_VASTU", x: 2, y: 2, width: 14, height: 11, color: "#ec4899" },
        { id: "t-1", type: "text", layer: "05_TEXT", x: 3.5, y: 4.5, text: "LIVING / POOJA (ISHANYA)", fontSize: 13, color: "#38bdf8" },
        { id: "t-2", type: "text", layer: "05_TEXT", x: 9.5, y: 4.5, text: "KITCHEN (AGNI MOOLA)", fontSize: 13, color: "#f97316" },
        { id: "d-1", type: "dimension", layer: "03_DIMS", x1: 2, y1: 1.2, x2: 16, y2: 1.2, dimValue: "14.00 m", color: "#f59e0b" }
      ]
    };

    // Render CAD Entities
    drawingData.entities?.forEach((e) => {
      if (e.type === "rect" && e.x !== undefined && e.y !== undefined && e.width !== undefined && e.height !== undefined) {
        ctx.strokeStyle = e.color || "#10b981";
        ctx.lineWidth = e.strokeWidth || 3;
        ctx.strokeRect(e.x * cadZoom + cadPan.x, e.y * cadZoom + cadPan.y, e.width * cadZoom, e.height * cadZoom);
      } else if (e.type === "line" && e.x1 !== undefined && e.y1 !== undefined && e.x2 !== undefined && e.y2 !== undefined) {
        ctx.strokeStyle = e.color || "#10b981";
        ctx.lineWidth = e.strokeWidth || 2;
        ctx.beginPath();
        ctx.moveTo(e.x1 * cadZoom + cadPan.x, e.y1 * cadZoom + cadPan.y);
        ctx.lineTo(e.x2 * cadZoom + cadPan.x, e.y2 * cadZoom + cadPan.y);
        ctx.stroke();
      } else if (e.type === "vastu_grid" && showVastuGrid && e.x !== undefined && e.y !== undefined && e.width !== undefined && e.height !== undefined) {
        const vx = e.x * cadZoom + cadPan.x;
        const vy = e.y * cadZoom + cadPan.y;
        const vw = e.width * cadZoom;
        const vh = e.height * cadZoom;
        ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(vx, vy, vw, vh);
        ctx.beginPath();
        ctx.moveTo(vx + vw / 3, vy);
        ctx.lineTo(vx + vw / 3, vy + vh);
        ctx.moveTo(vx + (2 * vw) / 3, vy);
        ctx.lineTo(vx + (2 * vw) / 3, vy + vh);
        ctx.moveTo(vx, vy + vh / 3);
        ctx.lineTo(vx + vw, vy + vh / 3);
        ctx.moveTo(vx, vy + (2 * vh) / 3);
        ctx.lineTo(vx + vw, vy + (2 * vh) / 3);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (e.type === "text" && e.x !== undefined && e.y !== undefined && e.text) {
        ctx.fillStyle = e.color || "#38bdf8";
        ctx.font = `bold ${e.fontSize || 13}px monospace`;
        ctx.fillText(e.text, e.x * cadZoom + cadPan.x, e.y * cadZoom + cadPan.y);
      } else if (e.type === "dimension" && showDimensions && e.x1 !== undefined && e.y1 !== undefined && e.x2 !== undefined && e.y2 !== undefined) {
        ctx.strokeStyle = e.color || "#f59e0b";
        ctx.lineWidth = 1.5;
        const x1 = e.x1 * cadZoom + cadPan.x;
        const y1 = e.y1 * cadZoom + cadPan.y;
        const x2 = e.x2 * cadZoom + cadPan.x;
        const y2 = e.y2 * cadZoom + cadPan.y;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (e.dimValue) {
          ctx.fillStyle = "#f59e0b";
          ctx.font = "bold 11px monospace";
          ctx.fillText(e.dimValue, (x1 + x2) / 2 - 20, (y1 + y2) / 2 - 4);
        }
      }
    });
  }, [activeItem, file, cadZoom, cadPan, showVastuGrid, showDimensions]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md transition-all ${
        isFullscreen ? "p-0" : "p-2 sm:p-4 md:p-6"
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full transition-all duration-200 ${
          isFullscreen ? "h-full rounded-none border-none" : "max-w-7xl h-[92vh]"
        }`}
      >
        {/* 1. Header Toolbar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          {/* File & Project Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center shrink-0">
              {activeItem?.type === "pdf" ? (
                <FileText className="w-5 h-5 text-rose-400" />
              ) : activeItem?.type === "image" ? (
                <ImageIcon className="w-5 h-5 text-emerald-400" />
              ) : (
                <FileCode className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0 uppercase">
                  {activeItem?.type.toUpperCase()} VIEWER
                </span>
                <h3 className="text-sm font-bold text-white truncate font-mono">
                  {activeItem?.name || file.name}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {file.projectName} • {file.folderPath} • {activeItem?.size ? formatBytes(activeItem.size) : "Architectural Record"}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              title={showMetadata ? "Hide Project Specs" : "Show Project Specs"}
              className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showMetadata
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">Specs</span>
            </button>

            {onOpenShare && (
              <button
                type="button"
                onClick={() => onOpenShare(file)}
                title="Share Drawing & QR Link"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs font-mono font-bold hidden md:inline">Share</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadActive}
              title="Download Current File"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Universal Attachment Switcher Tab Strip */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold mr-1 shrink-0 flex items-center gap-1">
            <FileBox className="w-3.5 h-3.5 text-cyan-400" />
            Files ({previewItems.length}):
          </span>

          {previewItems.map((item) => {
            const isSelected = item.id === selectedAttachmentId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedAttachmentId(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950 border border-cyan-400/30"
                    : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {item.type === "pdf" ? (
                  <FileText className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-rose-400"}`} />
                ) : item.type === "image" ? (
                  <ImageIcon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-emerald-400"}`} />
                ) : (
                  <FileCode className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-cyan-400"}`} />
                )}
                <span className="max-w-[160px] truncate">{item.name}</span>
                {item.size ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? "bg-cyan-950/80 text-cyan-200" : "bg-slate-800 text-slate-400"
                  }`}>
                    {formatBytes(item.size)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* 3. Main Viewer Canvas Body & Architectural Specs Sidebar */}
        <div className="flex-1 flex overflow-hidden bg-slate-950 relative">
          {/* Main Display Area */}
          <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-950">
            {/* VIEW A: PDF Document Viewer */}
            {activeItem?.type === "pdf" && (
              <PdfCanvasViewer
                pdfSource={currentPdfSource}
                fileName={activeItem.name}
                onDownload={handleDownloadActive}
                className="flex-1"
              />
            )}

            {/* VIEW B: High-Res Image Viewer */}
            {activeItem?.type === "image" && activeItem.attachment && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Image Toolbar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImgZoom((z) => Math.max(30, z - 20))}
                      title="Zoom Out"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-cyan-300 min-w-[50px] text-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {imgZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setImgZoom((z) => Math.min(300, z + 20))}
                      title="Zoom In"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImgZoom(100)}
                      className="px-2 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                    >
                      Reset 100%
                    </button>
                    <button
                      type="button"
                      onClick={() => setImgRotation((r) => (r + 90) % 360)}
                      title="Rotate 90°"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs font-mono text-slate-400 truncate">
                    {activeItem.name} ({formatBytes(activeItem.size || 0)})
                  </div>
                </div>

                {/* Image Stage */}
                <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950">
                  <div
                    className="transition-transform duration-150 origin-center rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex items-center justify-center"
                    style={{
                      transform: `scale(${imgZoom / 100}) rotate(${imgRotation}deg)`
                    }}
                  >
                    <img
                      src={activeItem.attachment.dataUrl || activeItem.attachment.downloadUrl}
                      alt={activeItem.name}
                      className="max-h-[75vh] max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW C: 2D Interactive Vector CAD Plan & DWG/DXF */}
            {(activeItem?.type === "cad" || activeItem?.type === "dwg") && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* CAD Controls Bar */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCadZoom((z) => Math.max(15, z - 5))}
                      title="Zoom Out CAD"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono text-cyan-300 min-w-[50px] text-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {Math.round(cadZoom)} px/m
                    </span>
                    <button
                      type="button"
                      onClick={() => setCadZoom((z) => Math.min(100, z + 5))}
                      title="Zoom In CAD"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCadZoom(35);
                        setCadPan({ x: 80, y: 80 });
                      }}
                      className="px-2 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 cursor-pointer"
                    >
                      Fit Center
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVastuGrid(!showVastuGrid)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                        showVastuGrid
                          ? "bg-pink-950 text-pink-300 border-pink-700"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                      Vastu Mandala
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDimensions(!showDimensions)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
                        showDimensions
                          ? "bg-amber-950 text-amber-300 border-amber-700"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5 inline mr-1" />
                      Dimensions
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (file.drawingData) {
                          triggerDxfDownload(file.drawingData, `${file.name.replace(/\.[^/.]+$/, "")}.dxf`);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export DXF</span>
                    </button>
                  </div>
                </div>

                {/* CAD Canvas */}
                <div className="flex-1 bg-slate-950 overflow-hidden relative">
                  <canvas ref={cadCanvasRef} className="w-full h-full block" />
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-cyan-300 backdrop-blur pointer-events-none">
                    📐 2D CAD Blueprint Engine • Scale 1:100 (Meters)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Collapsible Project Architectural Specs Sidebar */}
          {showMetadata && (
            <div className="w-80 sm:w-88 border-l border-slate-800 bg-slate-900/95 p-4 overflow-y-auto shrink-0 flex flex-col gap-4 text-xs font-mono z-10">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-1 flex items-center justify-between">
                  <span>Project Specs & Archive</span>
                  <span className="text-slate-500 font-mono">{file.projectCode || "VST-CAD"}</span>
                </div>
                <div className="text-sm font-bold text-white truncate">{file.projectName}</div>
                <div className="text-slate-400 text-[11px] truncate">{file.title}</div>
              </div>

              {/* Architectural Highlights */}
              <div className="space-y-2.5">
                {file.ownerName && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Owner / Client</span>
                    </div>
                    <div className="text-xs font-bold text-white">{file.ownerName}</div>
                    {file.mobileNo && (
                      <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        <a
                          href={`tel:${file.mobileNo}`}
                          className="hover:underline text-emerald-300"
                        >
                          {file.mobileNo}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {file.facing && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                        <Compass className="w-3 h-3 text-amber-400" />
                        <span>Facing</span>
                      </div>
                      <div className="text-xs font-bold text-amber-300">{file.facing}</div>
                    </div>
                  )}

                  {file.bedrooms && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                        <Home className="w-3 h-3 text-cyan-400" />
                        <span>Bedrooms</span>
                      </div>
                      <div className="text-xs font-bold text-cyan-300">{file.bedrooms}</div>
                    </div>
                  )}

                  {file.floors && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span>Floors</span>
                      </div>
                      <div className="text-xs font-bold text-purple-300">{file.floors}</div>
                    </div>
                  )}

                  {file.builtUpArea && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 mb-1">Plinth Area</div>
                      <div className="text-xs font-bold text-emerald-300 truncate">
                        {file.builtUpArea}
                      </div>
                    </div>
                  )}
                </div>

                {file.vasthuChuttu && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                    <div className="text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>വാസ്തു ചുറ്റ് (Vasthu Chuttu)</span>
                    </div>
                    <div className="text-xs font-bold">{file.vasthuChuttu}</div>
                  </div>
                )}

                {file.folderPath && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                    <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Vault Path</span>
                    <span className="text-cyan-300 font-bold">{file.folderPath}</span>
                  </div>
                )}

                {file.keywords && file.keywords.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 mb-1.5 font-bold">Keywords / Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {file.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 border border-slate-700"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* All Attachments in this record */}
              {file.attachments && file.attachments.length > 0 && (
                <div className="mt-auto pt-3 border-t border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-2">
                    Drawing Attachments ({file.attachments.length})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {file.attachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={() => setSelectedAttachmentId(att.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-[11px] cursor-pointer transition ${
                          selectedAttachmentId === att.id
                            ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-300"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="truncate max-w-[170px]">{att.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadAttachment(att, att.name);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
