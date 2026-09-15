import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
  RefreshCw,
  Layers,
  Search,
  Grid
} from "lucide-react";

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
} catch (e) {
  // Fallback to CDN if import.meta.url fails in certain environments
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PdfCanvasViewerProps {
  pdfSource: string | Uint8Array | ArrayBuffer | null;
  fileName?: string;
  onDownload?: () => void;
  onPrint?: () => void;
  className?: string;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfSource,
  fileName = "Architectural_Plan.pdf",
  onDownload,
  onPrint,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<{ page: number; img: string }[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [renderTaskRunning, setRenderTaskRunning] = useState<boolean>(false);

  // Convert base64 / dataUrl to Blob URL for native fallback & download
  useEffect(() => {
    if (!pdfSource) {
      setBlobUrl(null);
      return;
    }

    if (typeof pdfSource === "string") {
      if (pdfSource.startsWith("data:")) {
        try {
          const parts = pdfSource.split(",");
          const mime = parts[0].match(/:(.*?);/)?.[1] || "application/pdf";
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ia], { type: mime });
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
          return () => URL.revokeObjectURL(url);
        } catch (err) {
          console.warn("Failed to convert dataURL to Blob:", err);
          setBlobUrl(pdfSource);
        }
      } else {
        setBlobUrl(pdfSource);
      }
    } else if (pdfSource instanceof Uint8Array || pdfSource instanceof ArrayBuffer) {
      const blob = new Blob([pdfSource], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfSource]);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    if (!pdfSource) {
      setPdfDoc(null);
      setLoading(false);
      setError("No PDF document data available.");
      return;
    }

    setLoading(true);
    setError(null);
    setThumbnails([]);

    async function loadDocument() {
      try {
        let loadingTask: pdfjsLib.PDFDocumentLoadingTask;

        if (typeof pdfSource === "string") {
          if (pdfSource.startsWith("data:application/pdf;base64,")) {
            const base64Data = pdfSource.replace(/^data:application\/pdf;base64,/, "");
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } else if (pdfSource.startsWith("data:")) {
            const parts = pdfSource.split(",");
            const binaryStr = atob(parts[1]);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({ data: bytes });
          } else {
            loadingTask = pdfjsLib.getDocument({ url: pdfSource });
          }
        } else if (pdfSource instanceof Uint8Array) {
          loadingTask = pdfjsLib.getDocument({ data: pdfSource });
        } else {
          loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfSource) });
        }

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);

        // Generate Thumbnails in background if multi-page
        if (doc.numPages > 1) {
          generateThumbnails(doc);
        }
      } catch (err: any) {
        console.error("PDF.js loading error:", err);
        if (!isCancelled) {
          setError(err?.message || "Failed to load and parse PDF document.");
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [pdfSource]);

  // Generate page thumbnail previews
  const generateThumbnails = async (doc: pdfjsLib.PDFDocumentProxy) => {
    try {
      const thumbs: { page: number; img: string }[] = [];
      const maxPages = Math.min(doc.numPages, 10);
      for (let p = 1; p <= maxPages; p++) {
        const page = await doc.getPage(p);
        const viewport = page.getViewport({ scale: 0.25 });
        const thumbCanvas = document.createElement("canvas");
        thumbCanvas.width = viewport.width;
        thumbCanvas.height = viewport.height;
        const ctx = thumbCanvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport, canvas: thumbCanvas } as any).promise;
          thumbs.push({ page: p, img: thumbCanvas.toDataURL("image/jpeg", 0.7) });
        }
      }
      setThumbnails(thumbs);
    } catch (e) {
      console.warn("Thumbnail generation non-fatal error:", e);
    }
  };

  // Render Current Page onto Main Canvas
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      setRenderTaskRunning(true);
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Adjust scale to container or custom zoom
      const containerWidth = containerRef.current?.clientWidth || 800;
      const unscaledViewport = page.getViewport({ scale: 1, rotation });
      
      // Calculate responsive base scale if scale is default
      let effectiveScale = scale;
      if (scale === 1.2 && containerWidth > 0) {
        const fitScale = (containerWidth - 60) / unscaledViewport.width;
        if (fitScale > 0.5 && fitScale < 2.5) {
          effectiveScale = fitScale;
        }
      }

      const viewport = page.getViewport({ scale: effectiveScale, rotation });

      // High DPI crisp canvas rendering
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      ctx.save();
      ctx.scale(outputScale, outputScale);

      // White paper background for blueprint clarity
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas
      };

      await page.render(renderContext as any).promise;
      ctx.restore();
      setRenderTaskRunning(false);
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("PDF page render error:", err);
      }
      setRenderTaskRunning(false);
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // Page Controls
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage((p) => p + 1);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(3.0, Number((s + 0.2).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.4, Number((s - 0.2).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleFitWidth = () => {
    if (!pdfDoc || !containerRef.current) return;
    pdfDoc.getPage(currentPage).then((page) => {
      const unscaledViewport = page.getViewport({ scale: 1, rotation });
      const containerWidth = containerRef.current?.clientWidth || 800;
      const fitScale = (containerWidth - 60) / unscaledViewport.width;
      setScale(Number(Math.max(0.4, Math.min(2.5, fitScale)).toFixed(2)));
    });
  };

  const handlePrintDocument = () => {
    if (onPrint) {
      onPrint();
    } else if (blobUrl) {
      const printWindow = window.open(blobUrl, "_blank");
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    } else {
      window.print();
    }
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank");
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-slate-950 text-white select-none ${className}`}>
      {/* 1. PDF Viewer Top Control Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 z-10 shadow-md">
        {/* Left: Multi-Page Navigator & Thumbnails Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {numPages > 1 && (
            <button
              type="button"
              onClick={() => setShowThumbnails(!showThumbnails)}
              title={showThumbnails ? "Hide Thumbnails" : "Show Page Thumbnails"}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                showThumbnails
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pages</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            title="Previous Page"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-slate-200 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono font-bold">
            <span className="text-cyan-400">{currentPage}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">{numPages || 1}</span>
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            title="Next Page"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-slate-200 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Zoom & Rotation Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs font-mono text-cyan-300 font-bold min-w-[50px] text-center bg-slate-950 px-2 py-1 rounded border border-slate-800">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            title="Fit to Width"
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 cursor-pointer hidden md:inline-block"
          >
            Fit Width
          </button>

          <button
            type="button"
            onClick={handleRotate}
            title="Rotate 90°"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions (Open Tab, Print, Download) */}
        <div className="flex items-center gap-1.5">
          {blobUrl && (
            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Open PDF in New Browser Tab"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintDocument}
            title="Print PDF Document"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer hidden sm:flex"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              title="Download PDF"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Viewer Canvas Body with Optional Thumbnails Sidebar */}
      <div className="flex-1 flex overflow-hidden relative bg-slate-950">
        {/* Left Thumbnails Strip */}
        {showThumbnails && thumbnails.length > 0 && (
          <div className="w-28 sm:w-36 bg-slate-900 border-r border-slate-800 p-2.5 overflow-y-auto shrink-0 space-y-3 z-10">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
              Pages ({numPages})
            </div>
            {thumbnails.map((t) => (
              <button
                key={t.page}
                type="button"
                onClick={() => setCurrentPage(t.page)}
                className={`w-full p-1.5 rounded-xl border transition-all text-left block cursor-pointer ${
                  currentPage === t.page
                    ? "bg-cyan-500/20 border-cyan-500 shadow-md shadow-cyan-950"
                    : "bg-slate-950 border-slate-800 hover:border-slate-700"
                }`}
              >
                <img
                  src={t.img}
                  alt={`Page ${t.page}`}
                  className="w-full h-auto rounded bg-white object-contain shadow"
                />
                <div className="text-[10px] font-mono text-center mt-1 text-slate-400">
                  Page {t.page}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Center Main Canvas Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-6 bg-slate-950 relative"
          style={{ minHeight: "350px" }}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono text-cyan-300">
                Rendering Architectural PDF Blueprint...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono">PDF Preview Notice</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {error}
              </p>

              {blobUrl && (
                <div className="pt-2 flex flex-col gap-2">
                  <object
                    data={blobUrl}
                    type="application/pdf"
                    className="w-full h-64 rounded-lg border border-slate-700 bg-white"
                  >
                    <p className="text-xs text-slate-400 p-2">Native PDF Plugin fallback</p>
                  </object>
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleOpenInNewTab}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open In Browser Tab</span>
                    </button>
                    {onDownload && (
                      <button
                        type="button"
                        onClick={onDownload}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Canvas Rendering Area */}
          <div
            className={`transition-all duration-150 flex items-center justify-center ${
              loading || error ? "hidden" : "block"
            }`}
          >
            <div className="rounded-lg shadow-2xl overflow-hidden border border-slate-800 bg-white inline-block">
              <canvas ref={canvasRef} className="block cursor-grab active:cursor-grabbing" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
