import React, { useState } from "react";
import { SurveyCadProject, SurveyEntity, SurveyPoint } from "./types";
import { triggerPrint } from "../../../utils/printHelper";
import {
  X,
  Printer,
  FileDown,
  Compass,
  MapPin,
  CheckCircle2,
  Maximize2,
  FileSpreadsheet,
  Layers,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Square,
  Eye,
  Sliders,
  Check
} from "lucide-react";
import {
  SQM_TO_CENTS,
  SQM_TO_SQFT,
  SQM_TO_ARES,
  SQM_TO_ACRES,
  distance2D,
  calculateBearing,
  degToDms
} from "./utils/surveyGeometry";

interface SurveyPlanPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SurveyCadProject;
  onUpdateTitleBlock: (tb: SurveyCadProject["titleBlock"]) => void;
}

export const SurveyPlanPrintModal: React.FC<SurveyPlanPrintModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateTitleBlock
}) => {
  const [titleBlock, setTitleBlock] = useState(project.titleBlock);
  const [activePaper, setActivePaper] = useState<"A4" | "A3" | "A2">(project.titleBlock.sheetSize || "A4");
  const [orientation, setOrientation] = useState<"LANDSCAPE" | "PORTRAIT">(project.titleBlock.orientation || "LANDSCAPE");
  const [drawingScale, setDrawingScale] = useState<string>(project.titleBlock.drawingScale || "1:200");

  // Display toggles
  const [showAreaTableOnSheet, setShowAreaTableOnSheet] = useState(true);
  const [showStationTableOnSheet, setShowStationTableOnSheet] = useState(false);
  const [showDimensionsOnPlan, setShowDimensionsOnPlan] = useState(true);
  const [showGridOnPlan, setShowGridOnPlan] = useState(true);

  if (!isOpen) return null;

  // Extract all entity types
  const parcelEntities = project.entities.filter((e) => e.type === "POLYGON_PARCEL");
  const triangleEntities = project.entities.filter((e) => e.type === "TRIANGLE");
  const circleEntities = project.entities.filter((e) => e.type === "CIRCLE");
  const lineEntities = project.entities.filter((e) => e.type === "LINE");
  const polylineEntities = project.entities.filter((e) => e.type === "POLYLINE");
  const rectEntities = project.entities.filter((e) => e.type === "RECTANGLE");
  const contourEntities = project.entities.filter((e) => e.type === "CONTOUR");
  const spotLevelEntities = project.entities.filter((e) => e.type === "SPOT_LEVEL");

  // Calculate gross area
  const parcelSqM = parcelEntities.reduce((acc, p: any) => acc + (p.areaSqM || 0), 0);
  const triangleSqM = triangleEntities.reduce((acc, t: any) => acc + (t.areaSqM || 0), 0);
  const circleSqM = circleEntities.reduce((acc, c: any) => acc + (c.areaSqM || 0), 0);
  const rectSqM = rectEntities.reduce((acc, r: any) => acc + (r.areaSqM || 0), 0);

  const totalAreaSqM = parcelSqM > 0 ? parcelSqM : (triangleSqM + circleSqM + rectSqM);
  const totalCents = totalAreaSqM * SQM_TO_CENTS;
  const totalAres = totalAreaSqM * SQM_TO_ARES;
  const totalAcres = totalAreaSqM * SQM_TO_ACRES;
  const totalSqFt = totalAreaSqM * SQM_TO_SQFT;

  // Compute Bounding Box for SVG Projection
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  project.points.forEach((p) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  project.entities.forEach((ent) => {
    if (ent.type === "LINE") {
      minX = Math.min(minX, ent.start.x, ent.end.x);
      maxX = Math.max(maxX, ent.start.x, ent.end.x);
      minY = Math.min(minY, ent.start.y, ent.end.y);
      maxY = Math.max(maxY, ent.start.y, ent.end.y);
    } else if (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL") {
      ent.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    } else if (ent.type === "TRIANGLE") {
      [ent.p1, ent.p2, ent.p3].forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    } else if (ent.type === "CIRCLE") {
      minX = Math.min(minX, ent.center.x - ent.radius);
      maxX = Math.max(maxX, ent.center.x + ent.radius);
      minY = Math.min(minY, ent.center.y - ent.radius);
      maxY = Math.max(maxY, ent.center.y + ent.radius);
    } else if (ent.type === "RECTANGLE") {
      minX = Math.min(minX, ent.corner1.x, ent.corner2.x);
      maxX = Math.max(maxX, ent.corner1.x, ent.corner2.x);
      minY = Math.min(minY, ent.corner1.y, ent.corner2.y);
      maxY = Math.max(maxY, ent.corner1.y, ent.corner2.y);
    } else if (ent.type === "CONTOUR") {
      ent.points.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
    } else if (ent.type === "SPOT_LEVEL") {
      minX = Math.min(minX, ent.position.x);
      maxX = Math.max(maxX, ent.position.x);
      minY = Math.min(minY, ent.position.y);
      maxY = Math.max(maxY, ent.position.y);
    }
  });

  const hasContent = minX !== Infinity;
  if (!hasContent) {
    minX = 0;
    maxX = 50;
    minY = 0;
    maxY = 40;
  }

  const spanX = Math.max(maxX - minX, 10);
  const spanY = Math.max(maxY - minY, 10);
  const padding = Math.max(Math.max(spanX, spanY) * 0.18, 4);

  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxW = spanX + padding * 2;
  const viewBoxH = spanY + padding * 2;

  // Convert Cartesian Northing (Y) to SVG Y (so North is Up and text is right-side up)
  const toSvgY = (y: number) => {
    return minY + maxY - y;
  };

  // Helper for midpoint of 2 points
  const midPoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  });

  const handlePrint = () => {
    onUpdateTitleBlock({ ...titleBlock, sheetSize: activePaper, orientation, drawingScale });
    triggerPrint(`${titleBlock.projectTitle || project.title}_SurveyPlan`, "surveycad-print-sheet");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Survey Plan Print Studio & Area Statement
              </h2>
              <p className="text-xs text-slate-400">
                Print ready official CAD sheet layout with vector drawing, title block, and automatic area schedule
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Settings on Left, Live Sheet on Right */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Controls Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4 font-mono text-xs">
            {/* Sheet Page Setup */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <span className="font-bold text-slate-300 block text-xs uppercase tracking-wider">
                1. Page & Scale Setup
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(["A4", "A3", "A2"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setActivePaper(size)}
                    className={`py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                      activePaper === size
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {size} Sheet
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setOrientation("LANDSCAPE")}
                  className={`py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                    orientation === "LANDSCAPE"
                      ? "bg-blue-600 text-white border-blue-500 font-black"
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("PORTRAIT")}
                  className={`py-1.5 rounded-lg font-bold border transition cursor-pointer ${
                    orientation === "PORTRAIT"
                      ? "bg-blue-600 text-white border-blue-500 font-black"
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                  }`}
                >
                  Portrait
                </button>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Drawing Scale</label>
                <select
                  value={drawingScale}
                  onChange={(e) => setDrawingScale(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                >
                  <option value="1:100">1:100 (1cm = 1m)</option>
                  <option value="1:200">1:200 (1cm = 2m)</option>
                  <option value="1:500">1:500 (1cm = 5m)</option>
                  <option value="1:1000">1:1000 (1cm = 10m)</option>
                  <option value="1:2500">1:2500 (Village Re-Survey Scale)</option>
                  <option value="FIT TO SHEET">Fit to Sheet</option>
                </select>
              </div>
            </div>

            {/* Layout & Display Options */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-[11px]">
              <span className="font-bold text-slate-300 block text-xs uppercase tracking-wider">
                2. Sheet Components
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showAreaTableOnSheet}
                  onChange={(e) => setShowAreaTableOnSheet(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>Include Area Statement Table</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showStationTableOnSheet}
                  onChange={(e) => setShowStationTableOnSheet(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>Include Station Coordinates Table</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showDimensionsOnPlan}
                  onChange={(e) => setShowDimensionsOnPlan(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>Show Edge Dimensions on Plan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={showGridOnPlan}
                  onChange={(e) => setShowGridOnPlan(e.target.checked)}
                  className="rounded accent-cyan-500"
                />
                <span>Show Background Grid</span>
              </label>
            </div>

            {/* Kerala Survey Title Block Form */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 max-h-[300px] overflow-y-auto">
              <span className="font-bold text-slate-300 block text-xs uppercase tracking-wider">
                3. Title Block Information
              </span>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Project Title</label>
                <input
                  type="text"
                  value={titleBlock.projectTitle}
                  onChange={(e) => setTitleBlock({ ...titleBlock, projectTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Owner Name</label>
                  <input
                    type="text"
                    value={titleBlock.ownerName}
                    onChange={(e) => setTitleBlock({ ...titleBlock, ownerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Surveyor Name</label>
                  <input
                    type="text"
                    value={titleBlock.surveyorName}
                    onChange={(e) => setTitleBlock({ ...titleBlock, surveyorName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Re-Sy No.</label>
                  <input
                    type="text"
                    value={titleBlock.reSurveyNo}
                    onChange={(e) => setTitleBlock({ ...titleBlock, reSurveyNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Old Sy No.</label>
                  <input
                    type="text"
                    value={titleBlock.oldSurveyNo || ""}
                    onChange={(e) => setTitleBlock({ ...titleBlock, oldSurveyNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Block No.</label>
                  <input
                    type="text"
                    value={titleBlock.blockNo}
                    onChange={(e) => setTitleBlock({ ...titleBlock, blockNo: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Village</label>
                  <input
                    type="text"
                    value={titleBlock.village}
                    onChange={(e) => setTitleBlock({ ...titleBlock, village: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Taluk</label>
                  <input
                    type="text"
                    value={titleBlock.taluk}
                    onChange={(e) => setTitleBlock({ ...titleBlock, taluk: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">District</label>
                  <input
                    type="text"
                    value={titleBlock.district}
                    onChange={(e) => setTitleBlock({ ...titleBlock, district: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Sheet Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-1.5 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                Live Print Sheet Output ({activePaper} - {orientation})
              </span>
              <span className="text-cyan-400 font-bold">Scale: {drawingScale}</span>
            </div>

            {/* Official Kerala Survey Print Sheet Container (Direct Target for Print/PDF Export) */}
            <div
              id="surveycad-print-sheet"
              className="w-full bg-white text-slate-950 rounded-lg p-5 shadow-2xl border-4 border-slate-900 flex flex-col justify-between font-sans select-none overflow-hidden"
              style={{
                minHeight: orientation === "LANDSCAPE" ? "580px" : "750px"
              }}
            >
              {/* 1. Sheet Header with Official Border */}
              <div className="border-2 border-slate-900 p-2.5 mb-2.5 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h1 className="text-sm font-black uppercase tracking-wider text-slate-950 font-mono">
                    {titleBlock.projectTitle || "SURVEY SKETCH & FIELD MEASUREMENT BOOK (FMB)"}
                  </h1>
                  <p className="text-[10.5px] text-slate-700 font-medium font-mono">
                    Village: <span className="font-bold text-slate-950">{titleBlock.village || "N/A"}</span> | Taluk: <span className="font-bold text-slate-950">{titleBlock.taluk || "N/A"}</span> | District: <span className="font-bold text-slate-950">{titleBlock.district || "N/A"}</span>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="inline-block px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                    SCALE {drawingScale}
                  </span>
                  <p className="text-[9.5px] text-slate-600 mt-0.5">
                    Date: {titleBlock.surveyDate || new Date().toISOString().split("T")[0]}
                  </p>
                </div>
              </div>

              {/* 2. Main Central Vector Survey Plan Drawing Area (SVG CAD Drawing) */}
              <div className="flex-1 border-2 border-slate-900 rounded p-1 relative flex items-center justify-center min-h-[300px] bg-white overflow-hidden">
                <svg
                  viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
                  className="w-full h-full max-h-[440px]"
                  style={{ overflow: "visible" }}
                >
                  {/* Background Grid */}
                  {showGridOnPlan && (
                    <g opacity="0.35">
                      <defs>
                        <pattern id="printCadGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.3" />
                        </pattern>
                      </defs>
                      <rect
                        x={viewBoxX}
                        y={viewBoxY}
                        width={viewBoxW}
                        height={viewBoxH}
                        fill="url(#printCadGrid)"
                      />
                    </g>
                  )}

                  {/* Polygon Parcels */}
                  {parcelEntities.map((ent: any) => (
                    <g key={ent.id}>
                      <polygon
                        points={ent.points.map((p: any) => `${p.x},${toSvgY(p.y)}`).join(" ")}
                        fill="rgba(56, 189, 248, 0.08)"
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      />
                      {/* Vertex Nodes */}
                      {ent.points.map((p: any, idx: number) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={toSvgY(p.y)} r="0.7" fill="#0f172a" stroke="#ffffff" strokeWidth="0.2" />
                          <text
                            x={p.x + 0.8}
                            y={toSvgY(p.y) - 0.8}
                            fontSize="2.2"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#0f172a"
                          >
                            P{idx + 1}
                          </text>
                        </g>
                      ))}
                      {/* Segment Dimensions */}
                      {showDimensionsOnPlan &&
                        ent.points.map((p: any, idx: number) => {
                          const next = ent.points[(idx + 1) % ent.points.length];
                          const mid = midPoint(p, next);
                          const len = distance2D(p, next);
                          return (
                            <text
                              key={`dim_${idx}`}
                              x={mid.x}
                              y={toSvgY(mid.y) - 0.6}
                              fontSize="1.9"
                              fontFamily="monospace"
                              fontWeight="bold"
                              fill="#0369a1"
                              textAnchor="middle"
                            >
                              {len.toFixed(2)}m
                            </text>
                          );
                        })}
                      {/* Parcel Center Label */}
                      <text
                        x={ent.points.reduce((a: number, b: any) => a + b.x, 0) / ent.points.length}
                        y={toSvgY(ent.points.reduce((a: number, b: any) => a + b.y, 0) / ent.points.length)}
                        fontSize="2.6"
                        fontFamily="sans-serif"
                        fontWeight="black"
                        fill="#0369a1"
                        textAnchor="middle"
                      >
                        {ent.name || "PARCEL"} ({ent.areaCents ? `${ent.areaCents.toFixed(2)} Cents` : ""})
                      </text>
                    </g>
                  ))}

                  {/* Triangles (Heron's Sub-plots) */}
                  {triangleEntities.map((ent: any) => {
                    const cx = (ent.p1.x + ent.p2.x + ent.p3.x) / 3;
                    const cy = (ent.p1.y + ent.p2.y + ent.p3.y) / 3;
                    const mid1 = midPoint(ent.p1, ent.p2);
                    const mid2 = midPoint(ent.p2, ent.p3);
                    const mid3 = midPoint(ent.p3, ent.p1);
                    return (
                      <g key={ent.id}>
                        <polygon
                          points={`${ent.p1.x},${toSvgY(ent.p1.y)} ${ent.p2.x},${toSvgY(ent.p2.y)} ${ent.p3.x},${toSvgY(ent.p3.y)}`}
                          fill="rgba(16, 185, 129, 0.1)"
                          stroke="#047857"
                          strokeWidth="1.2"
                          strokeDasharray="3 1.5"
                        />
                        {/* Triangle Center Tag */}
                        <text
                          x={cx}
                          y={toSvgY(cy)}
                          fontSize="2.2"
                          fontFamily="monospace"
                          fontWeight="bold"
                          fill="#065f46"
                          textAnchor="middle"
                        >
                          Δ {ent.triangleId || "T"} ({ent.areaCents?.toFixed(2)} Cents)
                        </text>
                        {/* Triangle Side Dimensions */}
                        {showDimensionsOnPlan && (
                          <>
                            <text x={mid1.x} y={toSvgY(mid1.y) - 0.5} fontSize="1.8" fontFamily="monospace" fill="#047857" textAnchor="middle">
                              {ent.sideA?.toFixed(2) || ""}m
                            </text>
                            <text x={mid2.x} y={toSvgY(mid2.y) - 0.5} fontSize="1.8" fontFamily="monospace" fill="#047857" textAnchor="middle">
                              {ent.sideB?.toFixed(2) || ""}m
                            </text>
                            <text x={mid3.x} y={toSvgY(mid3.y) - 0.5} fontSize="1.8" fontFamily="monospace" fill="#047857" textAnchor="middle">
                              {ent.sideC?.toFixed(2) || ""}m
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Circles (Wells / Tanks) */}
                  {circleEntities.map((ent: any) => (
                    <g key={ent.id}>
                      <circle
                        cx={ent.center.x}
                        cy={toSvgY(ent.center.y)}
                        r={ent.radius}
                        fill="rgba(147, 51, 234, 0.08)"
                        stroke="#7e22ce"
                        strokeWidth="1.2"
                      />
                      {/* Center Cross & Label */}
                      <line
                        x1={ent.center.x - 1}
                        y1={toSvgY(ent.center.y)}
                        x2={ent.center.x + 1}
                        y2={toSvgY(ent.center.y)}
                        stroke="#7e22ce"
                        strokeWidth="0.4"
                      />
                      <line
                        x1={ent.center.x}
                        y1={toSvgY(ent.center.y) - 1}
                        x2={ent.center.x}
                        y2={toSvgY(ent.center.y) + 1}
                        stroke="#7e22ce"
                        strokeWidth="0.4"
                      />
                      <text
                        x={ent.center.x}
                        y={toSvgY(ent.center.y) + ent.radius + 2.2}
                        fontSize="2.0"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#6b21a8"
                        textAnchor="middle"
                      >
                        Well (R: {ent.radius}m)
                      </text>
                    </g>
                  ))}

                  {/* Rectangles (Building Footprints) */}
                  {rectEntities.map((ent: any) => {
                    const rx = Math.min(ent.corner1.x, ent.corner2.x);
                    const ry = Math.max(ent.corner1.y, ent.corner2.y);
                    const rw = Math.abs(ent.corner2.x - ent.corner1.x);
                    const rh = Math.abs(ent.corner2.y - ent.corner1.y);
                    return (
                      <g key={ent.id}>
                        <rect
                          x={rx}
                          y={toSvgY(ry)}
                          width={rw}
                          height={rh}
                          fill="rgba(245, 158, 11, 0.1)"
                          stroke="#b45309"
                          strokeWidth="1.3"
                        />
                        <text
                          x={rx + rw / 2}
                          y={toSvgY(ry - rh / 2)}
                          fontSize="2.0"
                          fontFamily="sans-serif"
                          fontWeight="bold"
                          fill="#92400e"
                          textAnchor="middle"
                        >
                          Building ({rw.toFixed(1)}m × {rh.toFixed(1)}m)
                        </text>
                      </g>
                    );
                  })}

                  {/* Polylines & Offset Lines */}
                  {polylineEntities.map((ent: any) => (
                    <g key={ent.id}>
                      <polyline
                        points={ent.points.map((p: any) => `${p.x},${toSvgY(p.y)}`).join(" ")}
                        fill="none"
                        stroke={ent.color || "#475569"}
                        strokeWidth={ent.lineWidth || 1.2}
                        strokeDasharray={ent.lineDash ? ent.lineDash.join(" ") : undefined}
                      />
                    </g>
                  ))}

                  {/* Survey Lines */}
                  {lineEntities.map((ent: any) => {
                    const mid = midPoint(ent.start, ent.end);
                    const len = distance2D(ent.start, ent.end);
                    return (
                      <g key={ent.id}>
                        <line
                          x1={ent.start.x}
                          y1={toSvgY(ent.start.y)}
                          x2={ent.end.x}
                          y2={toSvgY(ent.end.y)}
                          stroke="#0f172a"
                          strokeWidth="1.4"
                        />
                        {showDimensionsOnPlan && (
                          <text
                            x={mid.x}
                            y={toSvgY(mid.y) - 0.7}
                            fontSize="1.9"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#0f172a"
                            textAnchor="middle"
                          >
                            {len.toFixed(2)}m
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Topographic Contours */}
                  {contourEntities.map((ent: any) => (
                    <g key={ent.id}>
                      <polyline
                        points={ent.points.map((p: any) => `${p.x},${toSvgY(p.y)}`).join(" ")}
                        fill="none"
                        stroke={ent.isMajor ? "#ea580c" : "#fb923c"}
                        strokeWidth={ent.isMajor ? 1.4 : 0.8}
                      />
                      {ent.points.length > 0 && (
                        <text
                          x={ent.points[0].x}
                          y={toSvgY(ent.points[0].y)}
                          fontSize="1.6"
                          fill="#c2410c"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {ent.elevation}m
                        </text>
                      )}
                    </g>
                  ))}

                  {/* Station Points / Boundary Stones */}
                  {project.points.map((pt) => (
                    <g key={pt.id}>
                      <rect
                        x={pt.x - 0.7}
                        y={toSvgY(pt.y) - 0.7}
                        width="1.4"
                        height="1.4"
                        fill="#dc2626"
                        stroke="#ffffff"
                        strokeWidth="0.3"
                      />
                      <text
                        x={pt.x + 1.2}
                        y={toSvgY(pt.y) + 0.5}
                        fontSize="2.2"
                        fontFamily="monospace"
                        fontWeight="black"
                        fill="#b91c1c"
                      >
                        {pt.name} {pt.z !== undefined ? `(${pt.z}m)` : ""}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* Top Right North Compass Indicator */}
                <div className="absolute top-2.5 right-2.5 bg-white/95 border-2 border-slate-900 p-1.5 rounded shadow flex flex-col items-center select-none font-mono">
                  <div className="w-5 h-8 flex flex-col items-center justify-between">
                    <span className="text-[10px] font-black text-red-600 leading-none">▲</span>
                    <div className="w-0.5 h-3 bg-slate-900" />
                    <span className="text-[9px] font-black text-slate-900 leading-none">N</span>
                  </div>
                  <span className="text-[7.5px] font-bold text-slate-700 mt-0.5 tracking-tighter">TRUE NORTH</span>
                </div>

                {/* Bottom Left Graphical Scale Bar */}
                <div className="absolute bottom-2.5 left-2.5 bg-white/95 border border-slate-900 p-1.5 rounded shadow text-[9px] font-mono select-none">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-900">GRAPHICAL SCALE ({drawingScale})</span>
                  </div>
                  <div className="w-24 h-1.5 bg-slate-900 mt-1 flex">
                    <div className="w-1/2 h-full bg-slate-900" />
                    <div className="w-1/2 h-full bg-white border border-slate-900" />
                  </div>
                  <div className="flex justify-between text-[7.5px] text-slate-600 mt-0.5">
                    <span>0m</span>
                    <span>10m</span>
                    <span>20m</span>
                  </div>
                </div>
              </div>

              {/* 3. Automatic Area Schedule / Sub-Division Statement Table */}
              {showAreaTableOnSheet && (
                <div className="mt-2 border-2 border-slate-900 rounded overflow-hidden">
                  <div className="bg-slate-900 text-white px-2.5 py-1 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wide">
                    <span className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3 h-3 text-cyan-400" />
                      Area Statement & Sub-Division Schedule
                    </span>
                    <span className="text-cyan-300">
                      Total Extent: {totalCents.toFixed(3)} Cents ({totalAreaSqM.toFixed(2)} m²)
                    </span>
                  </div>

                  <table className="w-full text-left text-[9.5px] font-mono border-collapse">
                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-1 border-r border-slate-300">Plot / Feature</th>
                        <th className="p-1 border-r border-slate-300">Geometry</th>
                        <th className="p-1 border-r border-slate-300">Dimensions</th>
                        <th className="p-1 text-right border-r border-slate-300">Sq. Meters (m²)</th>
                        <th className="p-1 text-right border-r border-slate-300">Kerala Cents</th>
                        <th className="p-1 text-right">Ares</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-900">
                      {parcelEntities.map((p: any, idx: number) => (
                        <tr key={p.id} className="bg-white">
                          <td className="p-1 border-r border-slate-200 font-bold">{p.name || `Parcel #${idx + 1}`}</td>
                          <td className="p-1 border-r border-slate-200">Polygon ({p.points.length} V)</td>
                          <td className="p-1 border-r border-slate-200">Closed Boundary</td>
                          <td className="p-1 text-right border-r border-slate-200 font-bold">{p.areaSqM?.toFixed(2)}</td>
                          <td className="p-1 text-right border-r border-slate-200 font-black text-blue-900">{p.areaCents?.toFixed(3)}</td>
                          <td className="p-1 text-right">{p.areaAres?.toFixed(3)}</td>
                        </tr>
                      ))}

                      {triangleEntities.map((t: any) => (
                        <tr key={t.id} className="bg-emerald-50/40">
                          <td className="p-1 border-r border-slate-200 font-bold">Triangle {t.triangleId || "T"}</td>
                          <td className="p-1 border-r border-slate-200">Heron's Formula</td>
                          <td className="p-1 border-r border-slate-200">a={t.sideA}m, b={t.sideB}m, c={t.sideC}m</td>
                          <td className="p-1 text-right border-r border-slate-200 font-bold">{t.areaSqM?.toFixed(2)}</td>
                          <td className="p-1 text-right border-r border-slate-200 font-black text-emerald-900">{t.areaCents?.toFixed(3)}</td>
                          <td className="p-1 text-right">{(t.areaSqM * SQM_TO_ARES).toFixed(3)}</td>
                        </tr>
                      ))}

                      {circleEntities.map((c: any) => (
                        <tr key={c.id} className="bg-purple-50/40">
                          <td className="p-1 border-r border-slate-200 font-bold">Well / Circular Tank</td>
                          <td className="p-1 border-r border-slate-200">Circle (π r²)</td>
                          <td className="p-1 border-r border-slate-200">Radius: {c.radius}m</td>
                          <td className="p-1 text-right border-r border-slate-200 font-bold">{c.areaSqM?.toFixed(2)}</td>
                          <td className="p-1 text-right border-r border-slate-200 font-black text-purple-900">{c.areaCents?.toFixed(3)}</td>
                          <td className="p-1 text-right">{(c.areaSqM * SQM_TO_ARES).toFixed(3)}</td>
                        </tr>
                      ))}

                      {rectEntities.map((r: any) => (
                        <tr key={r.id} className="bg-amber-50/40">
                          <td className="p-1 border-r border-slate-200 font-bold">Building Plinth</td>
                          <td className="p-1 border-r border-slate-200">Rectangle</td>
                          <td className="p-1 border-r border-slate-200">
                            {Math.abs(r.corner2.x - r.corner1.x).toFixed(1)}m × {Math.abs(r.corner2.y - r.corner1.y).toFixed(1)}m
                          </td>
                          <td className="p-1 text-right border-r border-slate-200 font-bold">{r.areaSqM?.toFixed(2)}</td>
                          <td className="p-1 text-right border-r border-slate-200 font-black text-amber-900">{(r.areaSqM * SQM_TO_CENTS).toFixed(3)}</td>
                          <td className="p-1 text-right">{(r.areaSqM * SQM_TO_ARES).toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-200 font-bold border-t border-slate-300">
                      <tr>
                        <td colSpan={3} className="p-1 text-right uppercase border-r border-slate-300 text-slate-800">
                          Total Gross Extent:
                        </td>
                        <td className="p-1 text-right border-r border-slate-300 text-slate-950 font-black">
                          {totalAreaSqM.toFixed(2)} m²
                        </td>
                        <td className="p-1 text-right border-r border-slate-300 text-blue-900 font-black">
                          {totalCents.toFixed(3)} Cents
                        </td>
                        <td className="p-1 text-right text-slate-950 font-black">
                          {totalAres.toFixed(3)} Ares
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* 4. Station Coordinates Schedule (Optional toggle) */}
              {showStationTableOnSheet && project.points.length > 0 && (
                <div className="mt-2 border-2 border-slate-900 rounded overflow-hidden">
                  <div className="bg-slate-800 text-white px-2 py-0.5 text-[9px] font-mono font-bold uppercase">
                    Boundary Station Coordinates Table
                  </div>
                  <table className="w-full text-left text-[9px] font-mono border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-1 border-r border-slate-300">Station</th>
                        <th className="p-1 border-r border-slate-300">Easting (X)</th>
                        <th className="p-1 border-r border-slate-300">Northing (Y)</th>
                        <th className="p-1 border-r border-slate-300">Elevation (Z)</th>
                        <th className="p-1">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {project.points.map((pt) => (
                        <tr key={pt.id}>
                          <td className="p-1 border-r border-slate-200 font-bold">{pt.name}</td>
                          <td className="p-1 border-r border-slate-200">{pt.x.toFixed(3)} m</td>
                          <td className="p-1 border-r border-slate-200">{pt.y.toFixed(3)} m</td>
                          <td className="p-1 border-r border-slate-200">{pt.z !== undefined ? `${pt.z.toFixed(2)} m` : "-"}</td>
                          <td className="p-1">{pt.code || "Boundary Node"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. Official Kerala Survey Title Block & Signatures */}
              <div className="mt-2 border-2 border-slate-900 grid grid-cols-3 text-[10px] font-mono divide-x-2 divide-slate-900 bg-white">
                <div className="p-2 space-y-0.5">
                  <span className="text-[8.5px] text-slate-500 font-bold block uppercase">APPLICANT / OWNER:</span>
                  <p className="font-bold text-slate-900">{titleBlock.ownerName || "Private Landowner"}</p>
                  <p className="text-[9px] text-slate-600">Re-Sy: {titleBlock.reSurveyNo || "142/2A"} | Blk: {titleBlock.blockNo || "1"}</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <span className="text-[8.5px] text-slate-500 font-bold block uppercase">SURVEYED & PREPARED BY:</span>
                  <p className="font-bold text-slate-900">{titleBlock.surveyorName || "Licensed Surveyor"}</p>
                  <p className="text-[9px] text-slate-600">Lic. Reg: {titleBlock.licenseNo || "KER-LS-2024"}</p>
                </div>
                <div className="p-2 flex flex-col justify-between">
                  <span className="text-[8.5px] text-slate-500 font-bold block uppercase">SIGNATURE & SEAL:</span>
                  <div className="h-4 border-b border-dashed border-slate-400 mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print to Scale / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
