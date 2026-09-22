import React, { useState, useEffect, useMemo } from "react";
import { CADDrawingRecord, CADAttachment } from "../../../types/dataStorageTypes";
import { formatBytes, downloadAttachment, downloadRecordFile } from "../../../utils/dataStorageManager";
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
  FileBox,
  Trash2,
  FileSpreadsheet,
  FileArchive,
  FileCheck
} from "lucide-react";

interface PdfViewerModalProps {
  file: CADDrawingRecord;
  attachment?: CADAttachment | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenShare?: (file: CADDrawingRecord) => void;
  onDelete?: (fileId: string) => void;
}

type PreviewFileType = "pdf" | "image" | "doc" | "excel" | "cad" | "archive" | "other";

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  file,
  attachment,
  isOpen,
  onClose,
  onOpenShare,
  onDelete
}) => {
  // All available preview tabs (attachments + generated blueprint)
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string>("default");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);

  // Image viewer zoom & rotation
  const [imgZoom, setImgZoom] = useState<number>(100);
  const [imgRotation, setImgRotation] = useState<number>(0);

  // Generated Blueprint PDF state
  const [generatedPdfDataUrl, setGeneratedPdfDataUrl] = useState<string | null>(null);

  // Helper to categorize preview file type
  const detectFileType = (name: string, att?: CADAttachment): PreviewFileType => {
    const lower = name.toLowerCase();
    if (att?.isPdf || lower.endsWith(".pdf")) return "pdf";
    if (att?.isImage || /\.(png|jpe?g|webp|svg|bmp|gif|tiff?)$/i.test(lower)) return "image";
    if (/\.(docx?|odt|rtf|txt|md)$/i.test(lower)) return "doc";
    if (/\.(xlsx?|csv|ods|tsv)$/i.test(lower)) return "excel";
    if (att?.isDwgOrDxf || /\.(dwg|dxf|cad|step|stp|iges|igs)$/i.test(lower)) return "cad";
    if (/\.(zip|rar|7z|tar|gz)$/i.test(lower)) return "archive";
    return "other";
  };

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
        const type = detectFileType(att.name, att);
        items.push({
          id: att.id,
          name: att.name,
          type,
          attachment: att,
          size: att.size
        });
      });
    }

    // 2. If main file is a PDF or Image, or has no attachments, provide primary view
    const mainType = detectFileType(file.name);
    if (items.length === 0) {
      items.push({
        id: "main-file",
        name: file.name,
        type: mainType,
        size: file.fileSize
      });
    }

    // 3. Generated Official Blueprint PDF Sheet (if plan details exist)
    if (file.category === "PLAN" || file.category === "ARCHITECTURAL_PLAN" || file.ownerName || file.facing) {
      items.push({
        id: "generated-blueprint-pdf",
        name: `${file.name.replace(/\.[^/.]+$/, "")}_Blueprint_Sheet.pdf`,
        type: "pdf",
        size: 450000,
        isGenerated: true
      });
    }

    return items;
  }, [file]);

  // Initial selection
  useEffect(() => {
    if (!isOpen) return;

    if (attachment) {
      setSelectedAttachmentId(attachment.id);
    } else if (previewItems.length > 0) {
      // Prioritize PDF, then Image, then first item
      const firstPdf = previewItems.find((p) => p.type === "pdf");
      const firstImg = previewItems.find((p) => p.type === "image");
      setSelectedAttachmentId(firstPdf ? firstPdf.id : firstImg ? firstImg.id : previewItems[0].id);
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

  // Handle Download for currently active item
  const handleDownloadActive = () => {
    if (!activeItem) {
      downloadRecordFile(file);
      return;
    }

    if (activeItem.attachment) {
      downloadAttachment(activeItem.attachment, activeItem.name);
    } else if (activeItem.isGenerated && generatedPdfDataUrl) {
      const a = document.createElement("a");
      a.href = generatedPdfDataUrl;
      a.download = activeItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      downloadRecordFile(file);
    }
  };

  const getFormatIcon = (type: PreviewFileType, isSelected: boolean = false) => {
    switch (type) {
      case "pdf":
        return <FileText className={`w-4 h-4 ${isSelected ? "text-white" : "text-rose-400"}`} />;
      case "image":
        return <ImageIcon className={`w-4 h-4 ${isSelected ? "text-white" : "text-emerald-400"}`} />;
      case "doc":
        return <FileCheck className={`w-4 h-4 ${isSelected ? "text-white" : "text-blue-400"}`} />;
      case "excel":
        return <FileSpreadsheet className={`w-4 h-4 ${isSelected ? "text-white" : "text-emerald-400"}`} />;
      case "cad":
        return <FileCode className={`w-4 h-4 ${isSelected ? "text-white" : "text-purple-400"}`} />;
      case "archive":
        return <FileArchive className={`w-4 h-4 ${isSelected ? "text-white" : "text-amber-400"}`} />;
      default:
        return <FileBox className={`w-4 h-4 ${isSelected ? "text-white" : "text-cyan-400"}`} />;
    }
  };

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
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 border border-slate-800 flex items-center justify-center shrink-0">
              {getFormatIcon(activeItem?.type || "other", false)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0 uppercase">
                  {activeItem?.type.toUpperCase()} PREVIEW
                </span>
                <h3 className="text-sm font-bold text-white truncate font-mono">
                  {activeItem?.name || file.name}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {file.projectName || file.ownerName || "Vasthusilpy Record"} • {file.folderPath} • {activeItem?.size ? formatBytes(activeItem.size) : "Vault File"}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              title={showMetadata ? "Hide File Details" : "Show File Details"}
              className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showMetadata
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">Details</span>
            </button>

            {onOpenShare && (
              <button
                type="button"
                onClick={() => onOpenShare(file)}
                title="Share Document & QR Link"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs font-mono font-bold hidden md:inline">Share</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadActive}
              title="Download File"
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete "${file.name}"?`)) {
                    onDelete(file.id);
                    onClose();
                  }
                }}
                title="Delete File"
                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-800/80 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

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
        {previewItems.length > 1 && (
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold mr-1 shrink-0 flex items-center gap-1">
              <FileBox className="w-3.5 h-3.5 text-cyan-400" />
              Attachments ({previewItems.length}):
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
                  {getFormatIcon(item.type, isSelected)}
                  <span className="max-w-[160px] truncate">{item.name}</span>
                  {item.size ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected ? "bg-cyan-950/80 text-cyan-200" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {formatBytes(item.size)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Main Viewer Canvas Body & Specs Sidebar */}
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
            {activeItem?.type === "image" && (
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
                      src={
                        activeItem.attachment?.dataUrl ||
                        activeItem.attachment?.downloadUrl ||
                        (typeof file.attachments?.[0]?.dataUrl === "string" ? file.attachments[0].dataUrl : "")
                      }
                      alt={activeItem.name}
                      className="max-h-[75vh] max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* VIEW C: Document / CAD / Word / Excel / Archive File Card (Clean preview without 2D CAD canvas) */}
            {activeItem?.type !== "pdf" && activeItem?.type !== "image" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto bg-slate-950">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    {getFormatIcon(activeItem?.type || "other", false)}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono uppercase font-bold mb-3">
                    {activeItem?.type.toUpperCase()} DOCUMENT
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white font-mono break-all mb-2">
                    {activeItem?.name || file.name}
                  </h4>

                  <p className="text-xs text-slate-400 font-mono mb-6">
                    {activeItem?.size ? formatBytes(activeItem.size) : "Ready for download"} • Stored in {file.folderPath}
                  </p>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleDownloadActive}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold font-mono flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download File ({activeItem?.size ? formatBytes(activeItem.size) : "Save"})
                    </button>

                    {onOpenShare && (
                      <button
                        type="button"
                        onClick={() => onOpenShare(file)}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 text-cyan-400" />
                        Share & QR Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Collapsible Project Specs Sidebar */}
          {showMetadata && (
            <div className="w-80 sm:w-88 border-l border-slate-800 bg-slate-900/95 p-4 overflow-y-auto shrink-0 flex flex-col gap-4 text-xs font-mono z-10">
              <div className="border-b border-slate-800 pb-3">
                <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-1 flex items-center justify-between">
                  <span>File Specifications</span>
                  <span className="text-slate-500 font-mono">{file.projectCode || "VAULT"}</span>
                </div>
                <div className="text-sm font-bold text-white truncate">{file.projectName || file.name}</div>
                {file.title && <div className="text-slate-400 text-[11px] truncate">{file.title}</div>}
              </div>

              {/* Highlights */}
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
                        <a href={`tel:${file.mobileNo}`} className="hover:underline text-emerald-300">
                          {file.mobileNo}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {(file.facing || file.bedrooms || file.floors || file.builtUpArea) && (
                  <div className="grid grid-cols-2 gap-2">
                    {file.facing && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                          <Compass className="w-3 h-3 text-amber-400" />
                          <span>Facing</span>
                        </div>
                        <div className="text-xs font-bold text-amber-300 truncate">{file.facing}</div>
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
                        <div className="text-[10px] text-slate-400 mb-1">Area</div>
                        <div className="text-xs font-bold text-emerald-300 truncate">
                          {file.builtUpArea}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {file.vasthuChuttu && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                    <div className="text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>വാസ്തു ചുറ്റ് (Vasthu Chuttu)</span>
                    </div>
                    <div className="text-xs font-bold">{file.vasthuChuttu}</div>
                  </div>
                )}

                {file.location && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                    <span className="text-[10px] text-slate-500 uppercase block mb-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      Location
                    </span>
                    <span className="text-white font-bold">{file.location}</span>
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
                    All Attached Files ({file.attachments.length})
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
