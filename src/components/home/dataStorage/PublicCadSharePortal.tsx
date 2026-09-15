import React, { useState, useEffect, useMemo } from "react";
import { CADDrawingRecord, CADAttachment } from "../../../types/dataStorageTypes";
import { getCADDrawingByShareToken, formatBytes, downloadAttachment, triggerDxfDownload } from "../../../utils/dataStorageManager";
import { generateCadBlueprintPdf } from "../../../utils/cadPdfExportHelper";
import { PdfCanvasViewer } from "./PdfCanvasViewer";
import {
  FileText,
  Download,
  Printer,
  Share2,
  Lock,
  Unlock,
  CheckCircle2,
  Compass,
  Home,
  Layers,
  Sparkles,
  User,
  Phone,
  ArrowLeft,
  FileCode,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Building2,
  AlertCircle,
  FileBox
} from "lucide-react";

interface PublicCadSharePortalProps {
  token: string;
  onGoToApp?: () => void;
}

export const PublicCadSharePortal: React.FC<PublicCadSharePortalProps> = ({
  token,
  onGoToApp
}) => {
  const [file, setFile] = useState<CADDrawingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string>("default");

  // Load drawing by token or ID
  useEffect(() => {
    setLoading(true);
    const found = getCADDrawingByShareToken(token);
    if (found) {
      setFile(found);
      // Check PIN
      if (!found.shareSettings?.pin) {
        setIsUnlocked(true);
      }
    }
    setLoading(false);
  }, [token]);

  const handleUnlockPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (file.shareSettings?.pin && pinInput.trim() === file.shareSettings.pin.trim()) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Previewable items
  const previewItems = useMemo(() => {
    if (!file) return [];
    const items: {
      id: string;
      name: string;
      type: "pdf" | "image" | "cad" | "text" | "dwg";
      attachment?: CADAttachment;
      size?: number;
      isGenerated?: boolean;
    }[] = [];

    // 1. Attached Files
    if (file.attachments && file.attachments.length > 0) {
      file.attachments.forEach((att) => {
        let type: "pdf" | "image" | "cad" | "text" | "dwg" = "text";
        if (att.isPdf || att.name.toLowerCase().endsWith(".pdf")) {
          type = "pdf";
        } else if (att.isImage || /\.(png|jpe?g|webp|svg|bmp)$/i.test(att.name)) {
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

    // 2. Interactive CAD 2D Plan
    if (file.drawingData?.entities && file.drawingData.entities.length > 0) {
      items.push({
        id: "cad-vector-view",
        name: "2D Architectural Floor Plan",
        type: "cad",
        size: 250000
      });
    }

    // 3. Official Blueprint Sheet PDF
    items.push({
      id: "generated-blueprint-pdf",
      name: "Official Blueprint Sheet.pdf",
      type: "pdf",
      size: 450000,
      isGenerated: true
    });

    return items;
  }, [file]);

  // Set default selection
  useEffect(() => {
    if (previewItems.length > 0 && selectedFileId === "default") {
      const firstPdf = previewItems.find((p) => p.type === "pdf");
      setSelectedFileId(firstPdf ? firstPdf.id : previewItems[0].id);
    }
  }, [previewItems, selectedFileId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3 font-mono">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mx-auto animate-pulse">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-cyan-300 font-bold">Loading Architectural Drawing Package...</p>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white font-mono">Drawing Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-mono">
            The shared CAD drawing link may have expired or been moved. Please contact Vasthusilpy Architects for the updated access link.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.href = window.location.origin;
            }}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-cyan-950 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Vasthusilpy Home</span>
          </button>
        </div>
      </div>
    );
  }

  // If PIN protected and not yet unlocked
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-blueprint-grid">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
              VASTHUSILPY ARCHITECTS & ENGINEERS
            </div>
            <h2 className="text-lg font-black text-white font-mono tracking-tight">
              Protected Drawing Package
            </h2>
            <p className="text-xs text-slate-400 font-mono truncate">
              {file.projectName} • {file.name}
            </p>
          </div>

          <form onSubmit={handleUnlockPin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5">
                Enter Security PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-3 text-center text-xl font-mono text-cyan-300 tracking-widest outline-none transition"
                autoFocus
              />
              {pinError && (
                <p className="text-[11px] text-rose-400 font-mono mt-1.5 text-center">
                  Incorrect Security PIN. Please re-enter.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950 transition cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock Drawing Package</span>
            </button>
          </form>

          <div className="text-center text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
            Vasthusilpy Engineering Portal • Keralassery, Palakkad
          </div>
        </div>
      </div>
    );
  }

  const activeItem = previewItems.find((p) => p.id === selectedFileId) || previewItems[0];
  const { dataUrl: blueprintPdfDataUrl } = generateCadBlueprintPdf(file);

  const currentPdfSource =
    activeItem?.isGenerated
      ? blueprintPdfDataUrl
      : activeItem?.attachment?.dataUrl || activeItem?.attachment?.downloadUrl || blueprintPdfDataUrl;

  const handleDownloadActive = () => {
    if (!activeItem) return;
    if (activeItem.attachment) {
      downloadAttachment(activeItem.attachment, activeItem.name);
    } else if (activeItem.type === "cad" && file.drawingData) {
      triggerDxfDownload(file.drawingData, `${file.name.replace(/\.[^/.]+$/, "")}.dxf`);
    } else {
      const a = document.createElement("a");
      a.href = blueprintPdfDataUrl;
      a.download = `${file.name.replace(/\.[^/.]+$/, "")}_Blueprint_Sheet.pdf`;
      a.click();
    }
  };

  const handleShareWhatsApp = () => {
    const text = `📐 *VASTHUSILPY ARCHITECTURAL DRAWING*\n` +
      `📁 *Project:* ${file.projectName}\n` +
      `👤 *Owner:* ${file.ownerName || "N/A"}\n` +
      (file.facing ? `🧭 *Facing:* ${file.facing}\n` : "") +
      (file.bedrooms ? `🛏️ *Bedrooms:* ${file.bedrooms}\n` : "") +
      (file.builtUpArea ? `📏 *Plinth Area:* ${file.builtUpArea}\n` : "") +
      `\n🔗 *View Drawings Online:*\n${window.location.href}\n\n` +
      `_Vasthusilpy Architects & Engineers, Keralassery, Palakkad_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Official Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-black shadow-md shadow-cyan-950">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                VASTHUSILPY ARCHITECTS & ENGINEERS
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold hidden md:inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Verified Package
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Keralassery, Palakkad • Chief Consultant: Er. Deepak K.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = window.location.origin;
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            Sign In / Home
          </button>
        </div>
      </header>

      {/* 2. Main Portal Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6 space-y-4 flex flex-col">
        {/* Project Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                  PROJECT ARCHIVE
                </span>
                <span className="text-xs text-slate-400">{file.projectCode || "VST-CAD"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {file.projectName || file.name}
              </h2>
              <p className="text-xs text-slate-400 max-w-xl">
                {file.title || "Architectural floor plan drawings, elevations, and structural layout documents."}
              </p>
            </div>

            {/* Quick Specs Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {file.facing && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Facing: {file.facing}</span>
                </div>
              )}
              {file.bedrooms && (
                <div className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-300 text-xs font-bold flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span>{file.bedrooms}</span>
                </div>
              )}
              {file.builtUpArea && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <span>Plinth: {file.builtUpArea}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Attachment Switcher Pill Strip */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1.5 pl-2">
            <FileBox className="w-4 h-4 text-cyan-400" />
            Drawing Files ({previewItems.length}):
          </span>

          {previewItems.map((item) => {
            const isSelected = item.id === selectedFileId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedFileId(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-950 border border-cyan-400/40"
                    : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
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
                  <span className="text-[10px] text-slate-400">({formatBytes(item.size)})</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* 4. Main Preview Canvas Stage */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl min-h-[550px]">
          {/* Active File Header */}
          <div className="bg-slate-950 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                {activeItem?.type.toUpperCase()}
              </span>
              <h3 className="text-sm font-bold text-white truncate">{activeItem?.name}</h3>
            </div>

            <button
              type="button"
              onClick={handleDownloadActive}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>

          {/* Active File Stage */}
          <div className="flex-1 flex overflow-hidden bg-slate-950">
            {activeItem?.type === "pdf" && (
              <PdfCanvasViewer
                pdfSource={currentPdfSource}
                fileName={activeItem.name}
                onDownload={handleDownloadActive}
                className="flex-1"
              />
            )}

            {activeItem?.type === "image" && activeItem.attachment && (
              <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950">
                <img
                  src={activeItem.attachment.dataUrl || activeItem.attachment.downloadUrl}
                  alt={activeItem.name}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
                />
              </div>
            )}

            {(activeItem?.type === "cad" || activeItem?.type === "dwg") && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <PdfCanvasViewer
                  pdfSource={blueprintPdfDataUrl}
                  fileName={`${file.name}_Blueprint_Sheet.pdf`}
                  onDownload={handleDownloadActive}
                  className="flex-1"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. Architectural Specifications & Vastu Chuttu Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] text-cyan-400 uppercase font-bold">Client / Owner</div>
            <div className="text-sm font-bold text-white">{file.ownerName || "Vasthusilpy Client"}</div>
            {file.mobileNo && (
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>{file.mobileNo}</span>
              </div>
            )}
          </div>

          {file.vasthuChuttu && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1 text-amber-200">
              <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>വാസ്തു ചുറ്റ് (Vasthu Chuttu)</span>
              </div>
              <div className="text-sm font-bold">{file.vasthuChuttu}</div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Consulting Office</div>
            <div className="text-xs font-bold text-slate-200">Vasthusilpy Architects & Engineers</div>
            <div className="text-[11px] text-slate-400">Er. Deepak K. • Keralassery, Palakkad</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 px-6 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Vasthusilpy Architects & Engineers • Architectural CAD Data & Blueprint Vault
      </footer>
    </div>
  );
};
