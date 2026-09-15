import React, { useState, useRef, useMemo } from "react";
import {
  SurveyCadProject,
  SurveyEntity,
  SurveyPoint,
  SurveyCadTool,
  ViewportState,
  SymbolType,
  SurveyLengthUnit,
  SurveyAreaUnit
} from "./cad/types";
import { SurveyCadCanvas } from "./cad/SurveyCadCanvas";
import { SurveyTraverseModal } from "./cad/SurveyTraverseModal";
import { SurveyCoordinateInputModal } from "./cad/SurveyCoordinateInputModal";
import { SurveyPlanPrintModal } from "./cad/SurveyPlanPrintModal";
import { SurveyDrawingPreviewModal } from "./cad/SurveyDrawingPreviewModal";
import { SurveyStationManagerModal } from "./cad/SurveyStationManagerModal";
import {
  calculatePolygonAreaSqM,
  computeDelaunayTriangulation,
  offsetPolyline,
  generateContoursFromSpotLevels,
  SQM_TO_CENTS,
  SQM_TO_SQFT,
  SQM_TO_ARES,
  SQM_TO_ACRES,
  distance2D,
  calculateBearing,
  degToDms
} from "./cad/utils/surveyGeometry";
import {
  downloadDxfFile,
  downloadJsonProject
} from "./cad/utils/surveyDxfExport";
import {
  createBlankSurveyProject,
  createKeralaFmbTemplate
} from "./cad/utils/surveyTemplates";
import {
  MousePointer,
  Minus,
  Maximize2,
  Square,
  Copy,
  Triangle,
  Circle as CircleIcon,
  Eraser,
  FilePlus2,
  RotateCcw,
  Eye,
  MapPin,
  Compass,
  FileDown,
  Upload,
  Printer,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  Sliders,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle2,
  FolderOpen,
  FileSpreadsheet,
  Ruler
} from "lucide-react";

export const SurveyCadTab: React.FC = () => {
  // Project State
  const [project, setProject] = useState<SurveyCadProject>(() => createKeralaFmbTemplate());

  // Active Interactive Tool
  const [currentTool, setCurrentTool] = useState<SurveyCadTool>("SELECT");
  const [activeLayer, setActiveLayer] = useState<string>("SURVEY_BOUNDARY");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [activeSymbol, setActiveSymbol] = useState<SymbolType>("BOUNDARY_STONE");
  const [offsetDistInput, setOffsetDistInput] = useState<number>(1.5); // Default 1.5m offset
  const [circleRadiusInput, setCircleRadiusInput] = useState<string>(""); // Optional exact radius

  // Snapping & Grid
  const [snapEnabled, setSnapEnabled] = useState<boolean>(true);
  const [gridSnapEnabled, setGridSnapEnabled] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(5.0); // 5 meter grid spacing

  // Viewport State
  const [viewport, setViewport] = useState<ViewportState>({
    panX: 15,
    panY: 15,
    zoom: 12
  });

  // Cursor Status Readout
  const [cursorCoords, setCursorCoords] = useState<{
    x: number;
    y: number;
    bearing?: number;
    dist?: number;
  }>({ x: 0, y: 0 });

  // Modals
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [isTraverseModalOpen, setIsTraverseModalOpen] = useState(false);
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Hidden file input for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed Entities
  const polygonParcels = useMemo(
    () => project.entities.filter((e) => e.type === "POLYGON_PARCEL"),
    [project.entities]
  );
  const triangleEntities = useMemo(
    () => project.entities.filter((e) => e.type === "TRIANGLE"),
    [project.entities]
  );
  const circleEntities = useMemo(
    () => project.entities.filter((e) => e.type === "CIRCLE"),
    [project.entities]
  );
  const lineEntities = useMemo(
    () => project.entities.filter((e) => e.type === "LINE"),
    [project.entities]
  );
  const rectEntities = useMemo(
    () => project.entities.filter((e) => e.type === "RECTANGLE"),
    [project.entities]
  );

  // Computed total area
  const totalAreaSqM = useMemo(() => {
    const pSqM = polygonParcels.reduce((acc, p: any) => acc + (p.areaSqM || 0), 0);
    if (pSqM > 0) return pSqM;
    const tSqM = triangleEntities.reduce((acc, t: any) => acc + (t.areaSqM || 0), 0);
    const cSqM = circleEntities.reduce((acc, c: any) => acc + (c.areaSqM || 0), 0);
    const rSqM = rectEntities.reduce((acc, r: any) => acc + (r.areaSqM || 0), 0);
    return tSqM + cSqM + rSqM;
  }, [polygonParcels, triangleEntities, circleEntities, rectEntities]);

  const totalCents = totalAreaSqM * SQM_TO_CENTS;
  const totalAres = totalAreaSqM * SQM_TO_ARES;
  const totalAcres = totalAreaSqM * SQM_TO_ACRES;
  const totalSqFt = totalAreaSqM * SQM_TO_SQFT;

  // Length Formatter Helper for UI
  const formatLength = (distInMeters: number): string => {
    if (project.unit === "cm") {
      return `${(distInMeters * 100).toFixed(1)} cm`;
    }
    return `${distInMeters.toFixed(2)} m`;
  };

  // Handler: Unit Toggle (Meter vs Centimeter)
  const handleUnitToggle = (unit: "m" | "cm") => {
    setProject((prev) => ({
      ...prev,
      unit,
      updatedAt: new Date().toISOString()
    }));
  };

  // Handler: New Drawing
  const handleNewDrawing = () => {
    if (
      project.entities.length > 0 &&
      !window.confirm("Start a new blank drawing? Any unsaved changes in current drawing will be reset.")
    ) {
      return;
    }
    setProject(createBlankSurveyProject());
    setSelectedEntityId(null);
    setCurrentTool("SELECT");
    setViewport({ panX: 0, panY: 0, zoom: 15 });
  };

  // Handler: Clear Drawing
  const handleClearDrawing = () => {
    if (!window.confirm("Are you sure you want to clear all entities and station points from this drawing?")) {
      return;
    }
    setProject((prev) => ({
      ...prev,
      entities: [],
      points: [],
      traverse: [],
      updatedAt: new Date().toISOString()
    }));
    setSelectedEntityId(null);
  };

  // Handler: Delete Entity by ID
  const handleDeleteEntity = (id: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      entities: prev.entities.filter((e) => e.id !== id)
    }));
    if (selectedEntityId === id) setSelectedEntityId(null);
  };

  // Handler: Delete Point by ID
  const handleDeletePoint = (id: string) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      points: prev.points.filter((p) => p.id !== id)
    }));
  };

  // Handler: Add Entity
  const handleAddEntity = (ent: SurveyEntity) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      entities: [...prev.entities, ent]
    }));
  };

  // Handler: Add Survey Point
  const handleAddPoint = (pt: SurveyPoint) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      points: [...prev.points, pt]
    }));
  };

  // Handler: Update Survey Point
  const handleUpdatePoint = (pt: SurveyPoint) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      points: prev.points.map((p) => (p.id === pt.id ? pt : p))
    }));
  };

  // Handler: Update Entity
  const handleUpdateEntity = (updated: SurveyEntity) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      entities: prev.entities.map((e) => (e.id === updated.id ? updated : e))
    }));
  };

  // Handler: Batch Import Points
  const handleBatchImportPoints = (pts: SurveyPoint[]) => {
    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      points: [...prev.points, ...pts]
    }));
  };

  // Handler: Auto-Triangulate with Delaunay Algorithm
  const handleAutoTriangulate = () => {
    let ptsToTriangulate = project.points.map((p) => ({ x: p.x, y: p.y }));

    if (ptsToTriangulate.length < 3) {
      const parcel = project.entities.find((e) => e.type === "POLYGON_PARCEL");
      if (parcel && parcel.type === "POLYGON_PARCEL") {
        ptsToTriangulate = parcel.points;
      }
    }

    if (ptsToTriangulate.length < 3) {
      alert("Need at least 3 points or a polygon parcel to calculate triangulation.");
      return;
    }

    const triangles = computeDelaunayTriangulation(ptsToTriangulate);

    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      entities: [
        ...prev.entities.filter((e) => e.type !== "TRIANGLE"),
        ...triangles
      ]
    }));
  };

  // Handler: Parallel True Offset
  const handleTrueOffset = () => {
    const parcel = project.entities.find(
      (e) => e.id === selectedEntityId || e.type === "POLYGON_PARCEL"
    );
    if (!parcel || (parcel.type !== "POLYGON_PARCEL" && parcel.type !== "POLYLINE")) {
      alert("Please select a polygon or polyline to offset.");
      return;
    }

    const dist = parseFloat(prompt(`Enter Offset Distance in ${project.unit} (positive = outward, negative = inward):`, offsetDistInput.toString()) || "0");
    if (dist === 0 || isNaN(dist)) return;

    const distM = project.unit === "cm" ? dist / 100 : dist;
    const offsetPoints = offsetPolyline(parcel.points, distM);

    handleAddEntity({
      id: `offset_poly_${Date.now()}`,
      type: "POLYLINE",
      points: offsetPoints,
      closed: parcel.type === "POLYGON_PARCEL",
      layer: "SURVEY_BOUNDARY",
      color: "#f59e0b",
      lineWidth: 1.8,
      lineDash: [4, 4]
    });
  };

  // Handler: Generate Topographic Contours
  const handleGenerateContours = () => {
    const spotPoints = project.points.filter((p) => typeof p.z === "number");
    if (spotPoints.length < 3) {
      alert("Need at least 3 survey points with Elevation (Z) to interpolate contour lines.");
      return;
    }

    const interval = project.contourInterval || 1.0;
    const contourLines = generateContoursFromSpotLevels(spotPoints, interval);

    const contourEntities: SurveyEntity[] = contourLines.map((c, idx) => ({
      id: `contour_${idx}_${Date.now()}`,
      type: "CONTOUR",
      elevation: c.elevation,
      points: c.points,
      isMajor: c.isMajor,
      layer: "SURVEY_CONTOURS",
      color: c.isMajor ? "#ea580c" : "#fb923c",
      lineWidth: c.isMajor ? 2.0 : 1.2
    }));

    setProject((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      entities: [
        ...prev.entities.filter((e) => e.type !== "CONTOUR"),
        ...contourEntities
      ]
    }));
  };

  // Handler: Zoom Extents
  const handleZoomExtents = () => {
    const allPts: { x: number; y: number }[] = [...project.points];
    project.entities.forEach((e) => {
      if (e.type === "LINE") {
        allPts.push(e.start, e.end);
      } else if (e.type === "POLYLINE" || e.type === "POLYGON_PARCEL") {
        allPts.push(...e.points);
      } else if (e.type === "TRIANGLE") {
        allPts.push(e.p1, e.p2, e.p3);
      } else if (e.type === "CIRCLE") {
        allPts.push(
          { x: e.center.x - e.radius, y: e.center.y },
          { x: e.center.x + e.radius, y: e.center.y },
          { x: e.center.x, y: e.center.y - e.radius },
          { x: e.center.x, y: e.center.y + e.radius }
        );
      }
    });

    if (allPts.length === 0) {
      setViewport({ panX: 0, panY: 0, zoom: 15 });
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    allPts.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const spanX = Math.max(maxX - minX, 10);
    const spanY = Math.max(maxY - minY, 10);

    const fitZoom = Math.min(600 / spanX, 400 / spanY, 40);

    setViewport({
      panX: midX,
      panY: midY,
      zoom: Math.max(fitZoom, 5)
    });
  };

  // Handler: JSON File Upload Import
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (imported && imported.entities) {
          setProject(imported);
          setTimeout(() => handleZoomExtents(), 100);
        }
      } catch (err: any) {
        alert(`Invalid SurveyCAD project file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Parsed circle radius numeric value
  const parsedCircleRadius = circleRadiusInput ? parseFloat(circleRadiusInput) : undefined;

  return (
    <div className="w-full flex flex-col h-[calc(100vh-140px)] min-h-[720px] bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonUpload}
        className="hidden"
      />

      {/* 1. TOP MAIN RIBBON: Project Management, Unit Toggles & Core CAD Actions */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left Section: Drawing State Management (New, Clear, Erase, Preview) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Title Input */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <Compass className="w-4 h-4 text-cyan-400" />
            <input
              type="text"
              value={project.title}
              onChange={(e) => setProject({ ...project, title: e.target.value })}
              className="bg-transparent text-xs font-bold text-white focus:outline-none w-36 truncate"
              title="Project Name"
            />
          </div>

          {/* New Drawing */}
          <button
            onClick={handleNewDrawing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold transition cursor-pointer"
            title="Create a New Blank Drawing"
          >
            <FilePlus2 className="w-3.5 h-3.5 text-blue-400" />
            <span>New</span>
          </button>

          {/* Clear Drawing */}
          <button
            onClick={handleClearDrawing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold transition cursor-pointer"
            title="Clear all entities and station points"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Clear</span>
          </button>

          {/* Erase Drawing Tool */}
          <button
            onClick={() => setCurrentTool(currentTool === "ERASE" ? "SELECT" : "ERASE")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold border transition cursor-pointer ${
              currentTool === "ERASE"
                ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30"
                : "bg-slate-800 hover:bg-red-950/40 text-red-300 border-slate-700 hover:border-red-500/40"
            }`}
            title="Interactive Eraser Tool: Click any line, shape, or station point to erase"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>{currentTool === "ERASE" ? "Erasing..." : "Erase"}</span>
          </button>

          {/* Preview Drawing Option */}
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl font-bold transition cursor-pointer shadow-sm"
            title="Preview Plotted Drawing & Area Statement"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Preview</span>
          </button>

          {/* Unit Toggle Buttons (m & cm) */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 ml-1">
            <button
              onClick={() => handleUnitToggle("m")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                project.unit === "m"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Set Measurement Unit to Meters"
            >
              Meter (m)
            </button>
            <button
              onClick={() => handleUnitToggle("cm")}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                project.unit === "cm"
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Set Measurement Unit to Centimeters"
            >
              cm
            </button>
          </div>
        </div>

        {/* Center: CAD Geometry & Drawing Tools */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-0.5">
          {/* Select Tool */}
          <button
            onClick={() => setCurrentTool("SELECT")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "SELECT"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Select & Drag Vertices [V]"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Line Tool */}
          <button
            onClick={() => setCurrentTool("LINE")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "LINE"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Survey Line [L]"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Polyline / Parcel Tool */}
          <button
            onClick={() => setCurrentTool("POLYLINE")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "POLYLINE"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Polyline / Boundary Polygon [PL]"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Triangle Tool for Plot */}
          <button
            onClick={() => setCurrentTool("TRIANGLE")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "TRIANGLE"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
            }`}
            title="Draw Triangle Plot (Click 3 points for Heron's Area in Cents)"
          >
            <Triangle className="w-4 h-4" />
          </button>

          {/* Circle Tool with Measurement */}
          <button
            onClick={() => setCurrentTool("CIRCLE")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "CIRCLE"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-purple-400 hover:bg-slate-800"
            }`}
            title="Draw Circle with Required Radius Measurement [C]"
          >
            <CircleIcon className="w-4 h-4" />
          </button>

          {/* Rectangle Tool */}
          <button
            onClick={() => setCurrentTool("RECTANGLE")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "RECTANGLE"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Building Footprint / Rectangle [REC]"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* True Offset */}
          <button
            onClick={handleTrueOffset}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="True Parallel Offset / Boundary Setback [O]"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Auto-Triangulate */}
          <button
            onClick={handleAutoTriangulate}
            className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
            title="Delaunay Triangulation & Heron's Area Table"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Spot Level */}
          <button
            onClick={() => setCurrentTool("SPOT_LEVEL")}
            className={`p-2 rounded-lg transition cursor-pointer ${
              currentTool === "SPOT_LEVEL"
                ? "bg-cyan-500 text-slate-950 shadow-md font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Spot Level Elevation Point [Z]"
          >
            <MapPin className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Symbol Selector */}
          <select
            value={activeSymbol}
            onChange={(e) => {
              setActiveSymbol(e.target.value as SymbolType);
              setCurrentTool("SYMBOL");
            }}
            className="bg-slate-900 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 text-[11px] font-mono cursor-pointer"
          >
            <option value="BOUNDARY_STONE">Stone (Pillar)</option>
            <option value="WELL">Open Well</option>
            <option value="BENCH_MARK">Benchmark (TBM)</option>
            <option value="TREE">Tree</option>
          </select>
        </div>

        {/* Right Section: Station Points Hub, Area Table, Export */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Station Points Manager Button */}
          <button
            onClick={() => setIsStationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-bold transition cursor-pointer shadow-sm"
            title="Add, Edit, Delete Station Points & View Station Measurements Table"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Stations ({project.points.length})</span>
          </button>

          {/* Traverse Tool */}
          <button
            onClick={() => setIsTraverseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl font-bold transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Traverse</span>
          </button>

          {/* Print Sheet Studio */}
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 rounded-xl font-black shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Plan</span>
          </button>

          <div className="h-5 w-px bg-slate-800 mx-1" />

          {/* DXF Export */}
          <button
            onClick={() => downloadDxfFile(project)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Export AutoCAD DXF R12"
          >
            <FileDown className="w-4 h-4" />
          </button>

          {/* Save JSON Project */}
          <button
            onClick={() => downloadJsonProject(project)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Save JSON SurveyCAD Project"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SECONDARY MEASUREMENT SUB-TOOLBAR (Circle Radius & Precision Input) */}
      {currentTool === "CIRCLE" && (
        <div className="bg-purple-950/80 border-b border-purple-800/60 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-purple-300 font-bold flex items-center gap-1.5">
              <CircleIcon className="w-4 h-4 text-purple-400" />
              Circle Drawing Tool:
            </span>
            <span className="text-slate-300">Enter exact radius or click & drag on canvas:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                value={circleRadiusInput}
                onChange={(e) => setCircleRadiusInput(e.target.value)}
                placeholder={`Radius in ${project.unit} (e.g. 5.0)`}
                className="bg-slate-950 border border-purple-500/60 rounded-lg px-2.5 py-1 text-white font-bold w-40 focus:outline-none focus:border-purple-400"
              />
              <span className="text-purple-300 font-bold">{project.unit}</span>
            </div>
          </div>
          <span className="text-slate-400 text-[11px]">
            Tip: Click any point on canvas as center to place circle with specified radius.
          </span>
        </div>
      )}

      {/* 3. MAIN WORKSPACE (Interactive Canvas + Live Right Area Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Floating Viewport & Snap Controls */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 font-mono text-xs select-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 shadow-xl">
            <button
              onClick={() => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.25, 500) }))}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom * 0.8, 2) }))}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomExtents}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-cyan-400 transition cursor-pointer"
              title="Fit to Screen / Zoom Extents"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2 flex flex-col gap-1.5 shadow-xl text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={snapEnabled}
                onChange={(e) => setSnapEnabled(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span>OSNAP (Nodes)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={gridSnapEnabled}
                onChange={(e) => setGridSnapEnabled(e.target.checked)}
                className="rounded accent-cyan-500"
              />
              <span>Grid Snap ({gridSize}m)</span>
            </label>
          </div>
        </div>

        {/* CAD Canvas Engine */}
        <div className="flex-1 h-full relative">
          <SurveyCadCanvas
            project={project}
            currentTool={currentTool}
            activeLayer={activeLayer}
            selectedEntityId={selectedEntityId}
            onSelectEntity={setSelectedEntityId}
            onAddEntity={handleAddEntity}
            onAddPoint={handleAddPoint}
            onUpdateEntity={handleUpdateEntity}
            onDeleteEntity={handleDeleteEntity}
            onDeletePoint={handleDeletePoint}
            viewport={viewport}
            onUpdateViewport={setViewport}
            onCursorChange={setCursorCoords}
            snapEnabled={snapEnabled}
            gridSnapEnabled={gridSnapEnabled}
            gridSize={gridSize}
            activeSymbol={activeSymbol}
            offsetDistInput={offsetDistInput}
            circleRadiusInput={parsedCircleRadius}
          />
        </div>

        {/* Right Collapsible Inspector Panel (AUTOMATIC LIVE AREA TABLE) */}
        {showRightPanel && (
          <div className="w-84 border-l border-slate-800 bg-slate-900/95 backdrop-blur-md flex flex-col overflow-y-auto font-mono text-xs divide-y divide-slate-800 select-none">
            {/* Panel Header */}
            <div className="p-3 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Automatic Area Table & Stations
                </span>
              </div>
              <button
                onClick={() => setShowRightPanel(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Automatic Live Area Summary */}
            <div className="p-4 space-y-3 bg-slate-950/40">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Automatic Plot Area Extent
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 rounded font-bold">
                  Unit: {project.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-900 border border-cyan-500/30 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">KERALA CENTS</span>
                  <span className="text-base font-black text-cyan-400">
                    {totalCents.toFixed(3)} Cents
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">SQ. METERS</span>
                  <span className="text-sm font-bold text-white">
                    {totalAreaSqM.toFixed(2)} m²
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">ARES</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {totalAres.toFixed(3)} Ares
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl">
                  <span className="text-[10px] text-slate-400 block">SQ. FEET</span>
                  <span className="text-sm font-bold text-slate-300">
                    {totalSqFt.toFixed(1)} ft²
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Automatic Entity Breakdown Schedule */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Plot Components Area Table ({project.entities.length})
                </span>
                <button
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold cursor-pointer"
                >
                  Full Table
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {polygonParcels.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] space-y-1"
                  >
                    <div className="flex justify-between items-center text-cyan-400 font-bold">
                      <span>{p.name || "Polygon Parcel"}</span>
                      <span>{p.areaCents?.toFixed(2)} Cents</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{p.points.length} Vertices</span>
                      <span>{p.areaSqM} m²</span>
                    </div>
                  </div>
                ))}

                {triangleEntities.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] space-y-1"
                  >
                    <div className="flex justify-between items-center text-emerald-400 font-bold">
                      <span>Triangle {t.triangleId || "T"}</span>
                      <span>{t.areaCents?.toFixed(2)} Cents</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Sides: {t.sideA}m, {t.sideB}m, {t.sideC}m</span>
                      <span>{t.areaSqM} m²</span>
                    </div>
                  </div>
                ))}

                {circleEntities.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-[11px] space-y-1"
                  >
                    <div className="flex justify-between items-center text-purple-400 font-bold">
                      <span>Circle / Well (R: {c.radius}m)</span>
                      <span>{c.areaCents?.toFixed(2)} Cents</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Circumference: {c.circumferenceM}m</span>
                      <span>{c.areaSqM} m²</span>
                    </div>
                  </div>
                ))}

                {project.entities.length === 0 && (
                  <div className="p-4 text-center text-slate-500 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px]">
                    Draw triangles, polygons, circles, or rectangles on the canvas to automatically generate the area table.
                  </div>
                )}
              </div>
            </div>

            {/* 3. Station Points Management Section */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">
                  Station Points ({project.points.length})
                </span>
                <button
                  onClick={() => setIsStationModalOpen(true)}
                  className="text-blue-400 hover:text-blue-300 text-[10px] font-bold cursor-pointer"
                >
                  Manage Hub &rarr;
                </button>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {project.points.map((pt) => (
                  <div
                    key={pt.id}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-white block">{pt.name}</span>
                      <span className="text-[10px] text-slate-400">
                        X: {formatLength(pt.x)} | Y: {formatLength(pt.y)} {pt.z !== undefined ? `| Z: ${pt.z}m` : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePoint(pt.id)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                      title="Delete Station"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {project.points.length === 0 && (
                  <div className="p-3 text-center text-slate-500 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px]">
                    No station points yet. Click "Stations" to add.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Right Panel Button (when hidden) */}
        {!showRightPanel && (
          <button
            onClick={() => setShowRightPanel(true)}
            className="absolute top-4 right-4 z-20 p-2 bg-slate-900 border border-slate-800 text-cyan-400 rounded-xl shadow-xl hover:bg-slate-800 cursor-pointer"
            title="Open Calculations & Inspector"
          >
            <Sliders className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 4. BOTTOM STATUS BAR (Real-time Coordinate, Unit & Measurement Readout) */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-4">
        {/* Real-time Cursor Readout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">EASTING (X):</span>
            <span className="text-cyan-400 font-bold">{formatLength(cursorCoords.x)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">NORTHING (Y):</span>
            <span className="text-cyan-400 font-bold">{formatLength(cursorCoords.y)}</span>
          </div>
          {cursorCoords.bearing !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">BEARING:</span>
              <span className="text-amber-400 font-bold">{cursorCoords.bearing.toFixed(1)}°</span>
            </div>
          )}
          {cursorCoords.dist !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">SEGMENT LENGTH:</span>
              <span className="text-emerald-400 font-bold">{formatLength(cursorCoords.dist)}</span>
            </div>
          )}
        </div>

        {/* Unit & Help Readout */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-cyan-400 font-bold px-2 py-0.5 bg-cyan-950/60 border border-cyan-500/30 rounded">
            Active Unit: {project.unit.toUpperCase()}
          </span>
          <span className="text-slate-500">
            [T] Triangle | [C] Circle | [L] Line | [PL] Polyline | [REC] Rect | [E] Erase
          </span>
          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400 font-bold">
            ZOOM: {Math.round(viewport.zoom * 10) / 10}x
          </span>
        </div>
      </div>

      {/* Modals */}
      <SurveyDrawingPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        project={project}
      />

      <SurveyStationManagerModal
        isOpen={isStationModalOpen}
        onClose={() => setIsStationModalOpen(false)}
        project={project}
        onAddPoint={handleAddPoint}
        onUpdatePoint={handleUpdatePoint}
        onDeletePoint={handleDeletePoint}
        onBatchImportPoints={handleBatchImportPoints}
        onAddEntity={handleAddEntity}
      />

      <SurveyTraverseModal
        isOpen={isTraverseModalOpen}
        onClose={() => setIsTraverseModalOpen(false)}
        project={project}
        onApplyTraverseToCanvas={(calc) => {
          if (!calc || calc.stations.length === 0) return;
          const traversePoints: { x: number; y: number }[] = [
            { x: calc.startEasting, y: calc.startNorthing }
          ];
          calc.stations.forEach((st: any) => {
            traversePoints.push({ x: st.easting, y: st.northing });
          });
          const areaSqM = calc.areaSqM || calculatePolygonAreaSqM(traversePoints);
          handleAddEntity({
            id: `traverse_poly_${Date.now()}`,
            type: "POLYGON_PARCEL",
            name: `Traverse Loop (P: ${calc.totalPerimeter}m)`,
            points: traversePoints,
            areaSqM,
            areaCents: areaSqM * SQM_TO_CENTS,
            areaAres: areaSqM * SQM_TO_ARES,
            areaSqFt: areaSqM * SQM_TO_SQFT,
            areaAcres: areaSqM * SQM_TO_ACRES,
            layer: "SURVEY_TRAVERSE",
            color: "#ef4444",
            lineWidth: 2.5
          });
          handleZoomExtents();
        }}
      />

      <SurveyCoordinateInputModal
        isOpen={isCoordModalOpen}
        onClose={() => setIsCoordModalOpen(false)}
        existingPoints={project.points}
        onAddPoint={handleAddPoint}
        onBatchImportPoints={handleBatchImportPoints}
      />

      <SurveyPlanPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        project={project}
        onUpdateTitleBlock={(tb) => setProject((p) => ({ ...p, titleBlock: tb }))}
      />
    </div>
  );
};
