import React, { useState, useEffect, useCallback } from "react";
import { InspectionMedia, SiteInspection } from "../../types/siteInspection";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  Minimize2,
  Camera,
  Video,
  FileText,
  Calendar,
  Sparkles,
  Info
} from "lucide-react";
import { triggerAppNotification } from "../../context/NotificationContext";

interface InspectionMediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: InspectionMedia[];
  initialIndex?: number;
  inspection?: SiteInspection | null;
}

export const InspectionMediaViewer: React.FC<InspectionMediaViewerProps> = ({
  isOpen,
  onClose,
  mediaList,
  initialIndex = 0,
  inspection
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, mediaList.length - 1)));
      setZoomLevel(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex, mediaList.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
    setZoomLevel(1);
    setRotation(0);
  }, [mediaList.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setRotation(0);
  }, [mediaList.length]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        setZoomLevel((z) => Math.min(z + 0.25, 3));
      } else if (e.key === "-" || e.key === "_") {
        setZoomLevel((z) => Math.max(z - 0.25, 0.5));
      } else if (e.key === "0") {
        setZoomLevel(1);
        setRotation(0);
      } else if (e.key.toLowerCase() === "r") {
        setRotation((r) => (r + 90) % 360);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !mediaList || mediaList.length === 0) return null;

  const currentItem = mediaList[currentIndex];
  if (!currentItem) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownloadFile = () => {
    try {
      const link = document.createElement("a");
      link.href = currentItem.url;
      const ext = currentItem.type === "video" ? "mp4" : "jpg";
      const cleanName = currentItem.name || `${inspection?.inspectionNumber || "inspection"}_${currentItem.type}_${currentIndex + 1}.${ext}`;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerAppNotification(`Downloading ${currentItem.name}...`, "success");
    } catch {
      triggerAppNotification("Failed to download file.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-white select-none animate-fadeIn overflow-hidden">
      {/* 1. TOP CONTROL BAR */}
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            {currentItem.type === "photo" ? <Camera className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-md">
                {currentItem.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                {currentIndex + 1} / {mediaList.length}
              </span>
            </div>
            {inspection && (
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {inspection.inspectionNumber} • {inspection.ownerName} ({inspection.place})
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls (for Photos) */}
          {currentItem.type === "photo" && (
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-1 text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                title="Reset Zoom (0)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Rotate (for Photos) */}
          {currentItem.type === "photo" && (
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded-xl transition cursor-pointer"
              title="Rotate 90° (R)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Download Individual File */}
          <button
            type="button"
            onClick={handleDownloadFile}
            className="p-2 text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-xl transition cursor-pointer"
            title="Download this file"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Close Lightbox */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-rose-900/60 hover:text-rose-200 border border-slate-700 rounded-xl transition cursor-pointer ml-1"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN VIEWER VIEWPORT (FIT-TO-VIEW) */}
      <main className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Navigation Arrows */}
        {mediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:border-emerald-500/50"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md transition-all active:scale-95 cursor-pointer hover:border-emerald-500/50"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Media Container with Fit-To-View constraints */}
        <div className="w-full h-full max-h-[78vh] flex items-center justify-center relative overflow-hidden rounded-2xl">
          {currentItem.type === "photo" ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
              <img
                src={currentItem.url}
                alt={currentItem.name}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
                className="max-h-[74vh] max-w-full w-auto object-contain rounded-xl shadow-2xl drop-shadow-2xl select-none pointer-events-auto"
                draggable={false}
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl max-h-[74vh] flex items-center justify-center p-2">
              <video
                src={currentItem.url}
                controls
                autoPlay
                playsInline
                className="max-h-[72vh] max-w-full rounded-2xl shadow-2xl border border-slate-800 bg-black"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}
        </div>
      </main>

      {/* 3. BOTTOM THUMBNAIL STRIP & CAPTION */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 sm:px-6 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* File Details */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="text-emerald-400 font-bold uppercase">
              {currentItem.type} {currentIndex + 1} of {mediaList.length}
            </span>
            <span>•</span>
            <span className="truncate max-w-[200px] text-slate-300">
              {currentItem.name}
            </span>
            {currentItem.timestamp && (
              <>
                <span>•</span>
                <span>{new Date(currentItem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            )}
          </div>

          {/* Quick Thumbnail Carousel */}
          {mediaList.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              {mediaList.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setZoomLevel(1);
                    setRotation(0);
                  }}
                  className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer relative ${
                    currentIndex === idx
                      ? "border-emerald-400 ring-2 ring-emerald-500/40 scale-105"
                      : "border-slate-700 opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.type === "photo" ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-purple-400">
                      <Video className="w-4 h-4" />
                    </div>
                  )}
                  {item.type === "video" && (
                    <span className="absolute bottom-0.5 right-0.5 p-0.5 bg-black/70 rounded text-[8px] font-mono text-white">
                      ▶
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};
