import React, { useState, useRef, useEffect } from "react";
import {
  CADDrawingRecord,
  CADDrawingData,
  CADEntity,
  CADLayer,
  CADAttachment
} from "../../../types/dataStorageTypes";
import {
  triggerDxfDownload,
  saveCADDrawingRecord,
  formatBytes,
  downloadAttachment
} from "../../../utils/dataStorageManager";
import { generateCadBlueprintPdf } from "../../../utils/cadPdfExportHelper";
import { PdfCanvasViewer } from "./PdfCanvasViewer";
import {
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Save,
  Download,
  FileCode,
  Image as ImageIcon,
  Compass,
  Grid,
  Magnet,
  MousePointer,
  Minus,
  Square,
  Circle,
  Type,
  Ruler,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Check,
  Sparkles,
  Info,
  Move,
  Settings2,
  Printer,
  FileText,
  Home,
  User,
  Phone
} from "lucide-react";

interface CadViewerEditorModalProps {
  file: CADDrawingRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedFile: CADDrawingRecord) => void;
}

type ActiveCADTool =
  | "select"
  | "pan"
  | "line"
  | "rect"
  | "circle"
  | "wall"
  | "dimension"
  | "text"
  | "vastu_grid"
  | "measure_dist";

export const CadViewerEditorModal: React.FC<CadViewerEditorModalProps> = ({
  file,
  isOpen,
  onClose,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active view tab (CAD 2D Canvas / Attached PDF / Attached Image)
  const [activeTab, setActiveTab] = useState<"cad" | "pdf" | "image">("cad");

  // Initialize Drawing State
  const [drawingData, setDrawingData] = useState<CADDrawingData>(() => {
    if (file.drawingData && file.drawingData.entities && file.drawingData.entities.length > 0) {
      return JSON.parse(JSON.stringify(file.drawingData));
    }
    return {
      version: "1.0",
      units: "meters",
      scale: 1,
      layers: [
        { id: "layer-walls", name: "01_WALLS", color: "#10b981", visible: true, locked: false },
        { id: "layer-doors", name: "02_DOORS_WINDOWS", color: "#06b6d4", visible: true, locked: false },
        { id: "layer-dims", name: "03_DIMENSIONS", color: "#f59e0b", visible: true, locked: false },
        { id: "layer-vastu", name: "04_VASTU_MANDALA", color: "#ec4899", visible: true, locked: false },
        { id: "layer-text", name: "05_ANNOTATIONS", color: "#e2e8f0", visible: true, locked: false }
      ],
      entities: [
        { id: "w-1", type: "rect", layer: "layer-walls", x: 2, y: 2, width: 14, height: 11, strokeWidth: 3, color: "#10b981" },
        { id: "w-2", type: "line", layer: "layer-walls", x1: 2, y1: 7, x2: 8, y2: 7, strokeWidth: 2, color: "#10b981" },
        { id: "w-3", type: "line", layer: "layer-walls", x1: 8, y1: 2, x2: 8, y2: 13, strokeWidth: 2, color: "#10b981" },
        { id: "v-1", type: "vastu_grid", layer: "layer-vastu", x: 2, y: 2, width: 14, height: 11, color: "#ec4899" },
        { id: "t-1", type: "text", layer: "layer-text", x: 3.5, y: 4.5, text: "LIVING / POOJA (ISHANYA)", fontSize: 14, color: "#38bdf8" },
        { id: "t-2", type: "text", layer: "layer-text", x: 9.5, y: 4.5, text: "KITCHEN (AGNI MOOLA)", fontSize: 14, color: "#f97316" },
        { id: "d-1", type: "dimension", layer: "layer-dims", x1: 2, y1: 1.2, x2: 16, y2: 1.2, dimValue: "14.00 m", color: "#f59e0b" }
      ]
    };
  });

  const [activeTool, setActiveTool] = useState<ActiveCADTool>("select");
  const [activeLayerId, setActiveLayerId] = useState<string>("layer-walls");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showVastuOverlay, setShowVastuOverlay] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize] = useState<number>(1); // 1 meter grid
  const [textInputVal, setTextInputVal] = useState("ROOM / LABEL");
  const [showSpecs, setShowSpecs] = useState(true);

  // Transform / Camera State
  const [zoom, setZoom] = useState<number>(35); // Pixels per meter
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 80, y: 80 });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Creation State
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentMouseWorld, setCurrentMouseWorld] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [history, setHistory] = useState<CADDrawingData[]>([]);
  const [redoStack, setRedoStack] = useState<CADDrawingData[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [measuredDistance, setMeasuredDistance] = useState<string | null>(null);

  // Attachments
  const pdfAttachment = file.attachments?.find(
    (a) => a.isPdf || a.name.toLowerCase().endsWith(".pdf")
  );
  const imageAttachment = file.attachments?.find(
    (a) => a.isImage || /\.(png|jpe?g|webp|svg)$/i.test(a.name)
  );

  // World to Screen & Screen to World coordinate transformations
  const worldToScreen = (wx: number, wy: number) => {
    return {
      sx: wx * zoom + panOffset.x,
      sy: wy * zoom + panOffset.y
    };
  };

  const screenToWorld = (sx: number, sy: number) => {
    let wx = (sx - panOffset.x) / zoom;
    let wy = (sy - panOffset.y) / zoom;

    if (snapToGrid) {
      wx = Math.round(wx / gridSize) * gridSize;
      wy = Math.round(wy / gridSize) * gridSize;
    }
    return { wx, wy };
  };

  // Canvas Rendering Loop
  useEffect(() => {
    if (!isOpen || activeTab !== "cad") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    // 1. Dark Blueprint Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    // 2. Blueprint Grid
    if (showGrid) {
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 0.5;

      const startX = panOffset.x % (gridSize * zoom);
      const startY = panOffset.y % (gridSize * zoom);

      ctx.beginPath();
      for (let x = startX; x < width; x += gridSize * zoom) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = startY; y < height; y += gridSize * zoom) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Major grid lines every 5 units
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      const majorStart5X = panOffset.x % (5 * gridSize * zoom);
      const majorStart5Y = panOffset.y % (5 * gridSize * zoom);

      ctx.beginPath();
      for (let x = majorStart5X; x < width; x += 5 * gridSize * zoom) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = majorStart5Y; y < height; y += 5 * gridSize * zoom) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // 3. Origin Axes (X: Red, Y: Green)
    const origin = worldToScreen(0, 0);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(origin.sx, origin.sy);
    ctx.lineTo(origin.sx + 40, origin.sy);
    ctx.stroke();

    ctx.strokeStyle = "#22c55e";
    ctx.beginPath();
    ctx.moveTo(origin.sx, origin.sy);
    ctx.lineTo(origin.sx, origin.sy + 40);
    ctx.stroke();

    // 4. Render All CAD Entities
    const layerMap = new Map<string, CADLayer>();
    drawingData.layers.forEach((l) => layerMap.set(l.id, l));

    drawingData.entities.forEach((entity) => {
      const layer = layerMap.get(entity.layer);
      if (layer && !layer.visible) return; // Hidden layer

      const color = entity.color || layer?.color || "#38bdf8";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = entity.strokeWidth || 2;

      // Lines
      if (
        entity.type === "line" &&
        entity.x1 !== undefined &&
        entity.y1 !== undefined &&
        entity.x2 !== undefined &&
        entity.y2 !== undefined
      ) {
        const p1 = worldToScreen(entity.x1, entity.y1);
        const p2 = worldToScreen(entity.x2, entity.y2);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();
      }

      // Rectangles / Walls
      else if (
        (entity.type === "rect" || entity.type === "wall") &&
        entity.x !== undefined &&
        entity.y !== undefined &&
        entity.width !== undefined &&
        entity.height !== undefined
      ) {
        const p = worldToScreen(entity.x, entity.y);
        const w = entity.width * zoom;
        const h = entity.height * zoom;
        ctx.beginPath();
        ctx.strokeRect(p.sx, p.sy, w, h);
      }

      // Circles
      else if (
        entity.type === "circle" &&
        entity.x !== undefined &&
        entity.y !== undefined &&
        entity.radius !== undefined
      ) {
        const p = worldToScreen(entity.x, entity.y);
        const r = entity.radius * zoom;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Vastu 9-Pada Mandala Grid
      else if (
        entity.type === "vastu_grid" &&
        showVastuOverlay &&
        entity.x !== undefined &&
        entity.y !== undefined &&
        entity.width !== undefined &&
        entity.height !== undefined
      ) {
        const p = worldToScreen(entity.x, entity.y);
        const w = entity.width * zoom;
        const h = entity.height * zoom;
        const colW = w / 3;
        const rowH = h / 3;

        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        // 3x3 Grid
        ctx.strokeRect(p.sx, p.sy, w, h);
        ctx.strokeRect(p.sx + colW, p.sy, colW, h);
        ctx.strokeRect(p.sx, p.sy + rowH, w, rowH);

        // Highlight Brahmasthanam (Center)
        ctx.fillStyle = "rgba(236, 72, 153, 0.15)";
        ctx.fillRect(p.sx + colW, p.sy + rowH, colW, rowH);

        // Vastu Pada Direction Labels
        ctx.setLineDash([]);
        ctx.fillStyle = "#f472b6";
        ctx.font = "bold 10px monospace";
        ctx.fillText("വായു (NW)", p.sx + 6, p.sy + 14);
        ctx.fillText("വടക്ക് (N)", p.sx + colW + 6, p.sy + 14);
        ctx.fillText("ഈശാന (NE)", p.sx + colW * 2 + 6, p.sy + 14);

        ctx.fillText("പടിഞ്ഞാറ് (W)", p.sx + 6, p.sy + rowH + 14);
        ctx.fillText("ബ്രഹ്മസ്ഥാനം", p.sx + colW + 6, p.sy + rowH + 14);
        ctx.fillText("കിഴക്ക് (E)", p.sx + colW * 2 + 6, p.sy + rowH + 14);

        ctx.fillText("നിര്യതി (SW)", p.sx + 6, p.sy + rowH * 2 + 14);
        ctx.fillText("തെക്ക് (S)", p.sx + colW + 6, p.sy + rowH * 2 + 14);
        ctx.fillText("അഗ്നി (SE)", p.sx + colW * 2 + 6, p.sy + rowH * 2 + 14);
      }

      // Dimensions
      else if (
        entity.type === "dimension" &&
        entity.x1 !== undefined &&
        entity.y1 !== undefined &&
        entity.x2 !== undefined &&
        entity.y2 !== undefined
      ) {
        const p1 = worldToScreen(entity.x1, entity.y1);
        const p2 = worldToScreen(entity.x2, entity.y2);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();

        // Dimension arrows
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(p1.sx, p1.sy, 3, 0, Math.PI * 2);
        ctx.arc(p2.sx, p2.sy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Text
        const midX = (p1.sx + p2.sx) / 2;
        const midY = (p1.sy + p2.sy) / 2 - 6;
        ctx.font = "bold 11px monospace";
        ctx.fillText(entity.dimValue || "DIM", midX, midY);
      }

      // Text Annotations
      else if (
        entity.type === "text" &&
        entity.x !== undefined &&
        entity.y !== undefined &&
        entity.text
      ) {
        const p = worldToScreen(entity.x, entity.y);
        ctx.font = `bold ${entity.fontSize || 13}px monospace`;
        ctx.fillStyle = color;
        const lines = entity.text.split("\n");
        lines.forEach((l, idx) => {
          ctx.fillText(l, p.sx, p.sy + idx * ((entity.fontSize || 13) + 4));
        });
      }
    });

    // 5. Active Interactive Drawing Preview
    if (isDrawing && drawStart) {
      const p1 = worldToScreen(drawStart.x, drawStart.y);
      const p2 = worldToScreen(currentMouseWorld.x, currentMouseWorld.y);

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      if (activeTool === "line" || activeTool === "measure_dist" || activeTool === "dimension") {
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();

        const dx = currentMouseWorld.x - drawStart.x;
        const dy = currentMouseWorld.y - drawStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 12px monospace";
        ctx.fillText(`${dist} m`, (p1.sx + p2.sx) / 2, (p1.sy + p2.sy) / 2 - 8);
      } else if (activeTool === "rect" || activeTool === "wall" || activeTool === "vastu_grid") {
        const w = (currentMouseWorld.x - drawStart.x) * zoom;
        const h = (currentMouseWorld.y - drawStart.y) * zoom;
        ctx.strokeRect(p1.sx, p1.sy, w, h);
      } else if (activeTool === "circle") {
        const dx = currentMouseWorld.x - drawStart.x;
        const dy = currentMouseWorld.y - drawStart.y;
        const r = Math.sqrt(dx * dx + dy * dy) * zoom;
        ctx.beginPath();
        ctx.arc(p1.sx, p1.sy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.setLineDash([]);
    }
  }, [
    isOpen,
    activeTab,
    drawingData,
    zoom,
    panOffset,
    showGrid,
    showVastuOverlay,
    isDrawing,
    drawStart,
    currentMouseWorld,
    activeTool
  ]);

  if (!isOpen) return null;

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (activeTool === "pan" || e.button === 1 || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: sx - panOffset.x, y: sy - panOffset.y });
      return;
    }

    const { wx, wy } = screenToWorld(sx, sy);

    if (activeTool === "text") {
      // Add text entity directly
      pushHistory();
      const newEntity: CADEntity = {
        id: `t-${Date.now()}`,
        type: "text",
        layer: activeLayerId,
        x: wx,
        y: wy,
        text: textInputVal,
        fontSize: 14,
        color: "#e2e8f0"
      };
      setDrawingData((prev) => ({
        ...prev,
        entities: [...prev.entities, newEntity]
      }));
      return;
    }

    setIsDrawing(true);
    setDrawStart({ x: wx, y: wy });
    setCurrentMouseWorld({ x: wx, y: wy });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isPanning) {
      setPanOffset({
        x: sx - panStart.x,
        y: sy - panStart.y
      });
      return;
    }

    const { wx, wy } = screenToWorld(sx, sy);
    setCursorPos({ x: wx, y: wy });
    setCurrentMouseWorld({ x: wx, y: wy });

    if (isDrawing && drawStart && activeTool === "measure_dist") {
      const dx = wx - drawStart.x;
      const dy = wy - drawStart.y;
      const distM = Math.sqrt(dx * dx + dy * dy);
      const distFt = distM * 3.28084;
      setMeasuredDistance(`${distM.toFixed(2)} m (${distFt.toFixed(2)} ft)`);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && drawStart) {
      setIsDrawing(false);
      const end = currentMouseWorld;

      if (Math.abs(end.x - drawStart.x) < 0.05 && Math.abs(end.y - drawStart.y) < 0.05) {
        setDrawStart(null);
        return;
      }

      pushHistory();

      let newEntity: CADEntity | null = null;

      if (activeTool === "line") {
        newEntity = {
          id: `line-${Date.now()}`,
          type: "line",
          layer: activeLayerId,
          x1: drawStart.x,
          y1: drawStart.y,
          x2: end.x,
          y2: end.y,
          strokeWidth: 2
        };
      } else if (activeTool === "rect" || activeTool === "wall") {
        const x = Math.min(drawStart.x, end.x);
        const y = Math.min(drawStart.y, end.y);
        const width = Math.abs(end.x - drawStart.x);
        const height = Math.abs(end.y - drawStart.y);
        newEntity = {
          id: `rect-${Date.now()}`,
          type: "rect",
          layer: activeLayerId,
          x,
          y,
          width,
          height,
          strokeWidth: activeTool === "wall" ? 3 : 2
        };
      } else if (activeTool === "circle") {
        const dx = end.x - drawStart.x;
        const dy = end.y - drawStart.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        newEntity = {
          id: `circ-${Date.now()}`,
          type: "circle",
          layer: activeLayerId,
          x: drawStart.x,
          y: drawStart.y,
          radius,
          strokeWidth: 2
        };
      } else if (activeTool === "vastu_grid") {
        const x = Math.min(drawStart.x, end.x);
        const y = Math.min(drawStart.y, end.y);
        const width = Math.abs(end.x - drawStart.x);
        const height = Math.abs(end.y - drawStart.y);
        newEntity = {
          id: `v-${Date.now()}`,
          type: "vastu_grid",
          layer: "layer-vastu",
          x,
          y,
          width,
          height
        };
      } else if (activeTool === "dimension") {
        const dx = end.x - drawStart.x;
        const dy = end.y - drawStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);
        newEntity = {
          id: `dim-${Date.now()}`,
          type: "dimension",
          layer: "layer-dims",
          x1: drawStart.x,
          y1: drawStart.y,
          x2: end.x,
          y2: end.y,
          dimValue: `${dist} m`
        };
      }

      if (newEntity) {
        setDrawingData((prev) => ({
          ...prev,
          entities: [...prev.entities, newEntity!]
        }));
      }

      setDrawStart(null);
    }
  };

  const pushHistory = () => {
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(drawingData))]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, JSON.parse(JSON.stringify(drawingData))]);
    setDrawingData(prev);
    setHistory((h) => h.slice(0, h.length - 1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, JSON.parse(JSON.stringify(drawingData))]);
    setDrawingData(next);
    setRedoStack((r) => r.slice(0, r.length - 1));
  };

  const handleSave = () => {
    const updatedFile: CADDrawingRecord = {
      ...file,
      drawingData,
      updatedAt: new Date().toISOString()
    };
    saveCADDrawingRecord(updatedFile, true);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onSave) onSave(updatedFile);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md ${
        isFullscreen ? "p-0" : "p-2 sm:p-4"
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full transition-all duration-200 ${
          isFullscreen ? "h-full rounded-none border-none" : "max-w-7xl h-[92vh]"
        }`}
      >
        {/* Top Header & Tab Navigation */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400 shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                  {file.fileType}
                </span>
                <h3 className="text-sm font-bold text-white truncate font-mono">{file.name}</h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {file.projectName} • {file.folderPath} • Plinth: {file.builtUpArea || "N/A"}
              </p>
            </div>
          </div>

          {/* Viewer Mode Tabs (CAD Canvas / Attached PDF / Attached Image) */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab("cad")}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "cad"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>2D CAD Canvas</span>
            </button>

            {pdfAttachment && (
              <button
                onClick={() => setActiveTab("pdf")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "pdf"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF Document</span>
              </button>
            )}

            {imageAttachment && (
              <button
                onClick={() => setActiveTab("image")}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "image"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image / 3D</span>
              </button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "cad" && (
              <>
                <button
                  onClick={handleSave}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    saveSuccess
                      ? "bg-emerald-600 text-white"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-950"
                  }`}
                >
                  {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{saveSuccess ? "Saved!" : "Save Plan"}</span>
                </button>

                <button
                  onClick={() => triggerDxfDownload(drawingData, `${file.name.replace(/\.[^/.]+$/, "")}.dxf`)}
                  title="Export to AutoCAD DXF File"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">DXF Export</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowSpecs(!showSpecs)}
              title={showSpecs ? "Hide Specs" : "Show Specs"}
              className={`p-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showSpecs
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline">Specs</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: 2D CAD Canvas Viewer & Tools */}
        {activeTab === "cad" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar Controls */}
            <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Drawing Tools */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
                <button
                  onClick={() => setActiveTool("select")}
                  title="Select / Pointer"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "select" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <MousePointer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool("pan")}
                  title="Pan Canvas (Space/Middle Click)"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "pan" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Move className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <button
                  onClick={() => setActiveTool("line")}
                  title="Draw Wall Line"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "line" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool("rect")}
                  title="Draw Room / Rectangle"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "rect" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool("circle")}
                  title="Draw Column / Circle"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "circle" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Circle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool("dimension")}
                  title="Add Dimension Line"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "dimension" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Ruler className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool("vastu_grid")}
                  title="Draw Vastu 9-Pada Mandala Grid"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "vastu_grid" ? "bg-pink-600 text-white" : "text-pink-400 hover:text-white"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTool("text")}
                  title="Add Room Text Label"
                  className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTool === "text" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Type className="w-4 h-4" />
                </button>
              </div>

              {/* Text Input if Text Tool Active */}
              {activeTool === "text" && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={textInputVal}
                    onChange={(e) => setTextInputVal(e.target.value)}
                    placeholder="Room Label..."
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Click on canvas to place</span>
                </div>
              )}

              {/* Zoom & Canvas Settings */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(10, z - 5))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400 min-w-[35px] text-center">
                  {zoom}px/m
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(100, z + 5))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setZoom(35);
                    setPanOffset({ x: 80, y: 80 });
                  }}
                  title="Reset View"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1" />

                <button
                  onClick={() => setShowGrid(!showGrid)}
                  title={showGrid ? "Hide Grid" : "Show Grid"}
                  className={`p-1.5 rounded-lg border text-xs font-mono cursor-pointer ${
                    showGrid ? "bg-slate-800 text-cyan-300 border-cyan-500/40" : "text-slate-500 border-slate-800"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowVastuOverlay(!showVastuOverlay)}
                  title={showVastuOverlay ? "Hide Vasthu Mandala" : "Show Vasthu Mandala"}
                  className={`p-1.5 rounded-lg border text-xs font-mono cursor-pointer ${
                    showVastuOverlay ? "bg-pink-950 text-pink-300 border-pink-500/40" : "text-slate-500 border-slate-800"
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowLayersPanel(!showLayersPanel)}
                  title="CAD Layers"
                  className={`p-1.5 rounded-lg border text-xs font-mono cursor-pointer ${
                    showLayersPanel ? "bg-cyan-950 text-cyan-300 border-cyan-500/40" : "text-slate-400 border-slate-800"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1" />

                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  title="Redo (Ctrl+Y)"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Stage & Sidebars */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Canvas Viewport */}
              <div className="flex-1 h-full w-full relative bg-[#090d16] overflow-hidden cursor-crosshair">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="w-full h-full block"
                />

                {/* Status Overlay Footer */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-3 pointer-events-none">
                  <span>
                    X: <strong className="text-white">{cursorPos.x.toFixed(2)}m</strong>
                  </span>
                  <span>
                    Y: <strong className="text-white">{cursorPos.y.toFixed(2)}m</strong>
                  </span>
                  {measuredDistance && (
                    <span className="text-cyan-400 font-bold">Dist: {measuredDistance}</span>
                  )}
                  <span className="text-slate-500">Entities: {drawingData.entities.length}</span>
                </div>
              </div>

              {/* Layers Sidebar (if toggled) */}
              {showLayersPanel && (
                <div className="w-64 border-l border-slate-800 bg-slate-950 p-3 overflow-y-auto shrink-0 flex flex-col gap-3 text-xs font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      CAD Layers
                    </span>
                    <button
                      onClick={() => setShowLayersPanel(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {drawingData.layers.map((layer) => (
                      <div
                        key={layer.id}
                        onClick={() => setActiveLayerId(layer.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                          activeLayerId === layer.id
                            ? "bg-slate-800 border-cyan-500/50 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: layer.color }}
                          />
                          <span className="truncate">{layer.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawingData((prev) => ({
                              ...prev,
                              layers: prev.layers.map((l) =>
                                l.id === layer.id ? { ...l, visible: !l.visible } : l
                              )
                            }));
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specs Sidebar */}
              {showSpecs && (
                <div className="w-72 border-l border-slate-800 bg-slate-900/95 p-3.5 overflow-y-auto shrink-0 flex flex-col gap-3 text-xs font-mono">
                  <div className="border-b border-slate-800 pb-2.5">
                    <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-bold mb-1">
                      Architectural Specs
                    </div>
                    <div className="text-sm font-bold text-white truncate">{file.projectName}</div>
                    <div className="text-slate-400 text-[11px] truncate">{file.title}</div>
                  </div>

                  {file.ownerName && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-1">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Owner / Client</span>
                      </div>
                      <div className="text-xs font-bold text-white">{file.ownerName}</div>
                      {file.mobileNo && (
                        <div className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{file.mobileNo}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {file.facing && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Facing</div>
                        <div className="text-xs font-bold text-amber-300">{file.facing}</div>
                      </div>
                    )}
                    {file.bedrooms && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Bedrooms</div>
                        <div className="text-xs font-bold text-cyan-300">{file.bedrooms}</div>
                      </div>
                    )}
                    {file.floors && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Floors</div>
                        <div className="text-xs font-bold text-purple-300">{file.floors}</div>
                      </div>
                    )}
                    {file.builtUpArea && (
                      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="text-[10px] text-slate-400 mb-0.5">Plinth Area</div>
                        <div className="text-xs font-bold text-emerald-300 truncate">{file.builtUpArea}</div>
                      </div>
                    )}
                  </div>

                  {file.vasthuChuttu && (
                    <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
                      <div className="text-[10px] font-bold text-amber-400 mb-1">
                        വാസ്തു ചുറ്റ് (Vasthu Chuttu)
                      </div>
                      <div className="text-xs font-bold">{file.vasthuChuttu}</div>
                    </div>
                  )}

                  {file.description && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                      {file.description}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Attached PDF Viewer */}
        {activeTab === "pdf" && (
          <div className="flex-1 flex overflow-hidden bg-slate-950">
            <PdfCanvasViewer
              pdfSource={pdfAttachment?.dataUrl || pdfAttachment?.downloadUrl || generateCadBlueprintPdf(file).dataUrl}
              fileName={pdfAttachment?.name || `${file.name.replace(/\.[^/.]+$/, "")}_Blueprint.pdf`}
              onDownload={() => {
                if (pdfAttachment) {
                  downloadAttachment(pdfAttachment, pdfAttachment.name);
                } else {
                  const { dataUrl } = generateCadBlueprintPdf(file);
                  const a = document.createElement("a");
                  a.href = dataUrl;
                  a.download = `${file.name.replace(/\.[^/.]+$/, "")}_Blueprint.pdf`;
                  a.click();
                }
              }}
              className="flex-1"
            />
          </div>
        )}

        {/* Tab 3: Attached Image Viewer */}
        {activeTab === "image" && imageAttachment && (
          <div className="flex-1 flex items-center justify-center overflow-auto bg-slate-950 p-4">
            <div className="max-w-4xl max-h-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black flex flex-col items-center">
              <img
                src={imageAttachment.dataUrl || imageAttachment.downloadUrl}
                alt={imageAttachment.name}
                className="max-h-[70vh] object-contain rounded-lg"
              />
              <div className="p-3 w-full bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">{imageAttachment.name}</span>
                <button
                  onClick={() => downloadAttachment(imageAttachment, imageAttachment.name)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
