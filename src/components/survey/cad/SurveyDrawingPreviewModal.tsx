import React, { useState } from "react";
import { SurveyCadProject, Point2D } from "./types";
import {
  X,
  Printer,
  FileDown,
  Compass,
  MapPin,
  Maximize2,
  FileSpreadsheet,
  Layers,
  Circle as CircleIcon,
  Triangle as TriangleIcon,
  Square,
  CheckCircle2
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
import { downloadDxfFile, downloadJsonProject } from "./utils/surveyDxfExport";
import { triggerPrint } from "../../../utils/printHelper";

interface SurveyDrawingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SurveyCadProject;
}

export const SurveyDrawingPreviewModal: React.FC<SurveyDrawingPreviewModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [activeTab, setActiveTab] = useState<"PLAN" | "AREA_TABLE">("PLAN");

  if (!isOpen) return null;

  // Extract all parcels, triangles, circles, and lines
  const parcelEntities = project.entities.filter((e) => e.type === "POLYGON_PARCEL");
  const triangleEntities = project.entities.filter((e) => e.type === "TRIANGLE");
  const circleEntities = project.entities.filter((e) => e.type === "CIRCLE");
  const lineEntities = project.entities.filter((e) => e.type === "LINE");
  const polylineEntities = project.entities.filter((e) => e.type === "POLYLINE");
  const rectEntities = project.entities.filter((e) => e.type === "RECTANGLE");
  const contourEntities = project.entities.filter((e) => e.type === "CONTOUR");

  // Calculate gross areas
  const parcelSqM = parcelEntities.reduce((acc, p: any) => acc + (p.areaSqM || 0), 0);
  const triangleSqM = triangleEntities.reduce((acc, t: any) => acc + (t.areaSqM || 0), 0);
  const circleSqM = circleEntities.reduce((acc, c: any) => acc + (c.areaSqM || 0), 0);
  const rectSqM = rectEntities.reduce((acc, r: any) => acc + (r.areaSqM || 0), 0);

  // If triangles were already mirrored as parcels, prefer parcelSqM or sum unique entities
  const grossAreaSqM = parcelSqM > 0 ? parcelSqM : (triangleSqM + circleSqM + rectSqM);
  const grossCents = grossAreaSqM * SQM_TO_CENTS;
  const grossAres = grossAreaSqM * SQM_TO_ARES;
  const grossAcres = grossAreaSqM * SQM_TO_ACRES;
  const grossSqFt = grossAreaSqM * SQM_TO_SQFT;

  // Compute bounding box for SVG projection
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
    }
  });

  if (minX === Infinity) {
    minX = 0;
    maxX = 50;
    minY = 0;
    maxY = 40;
  }

  const spanX = Math.max(maxX - minX, 10);
  const spanY = Math.max(maxY - minY, 10);
  const padding = Math.max(Math.max(spanX, spanY) * 0.16, 4);

  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxW = spanX + padding * 2;
  const viewBoxH = spanY + padding * 2;

  // Convert Cartesian Northing (Y) to SVG Y so North is Up and text is right-side up
  const toSvgY = (y: number) => {
    return minY + maxY - y;
  };

  const midPoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  });

  const handlePrint = () => {
    triggerPrint(`${project.title}_SurveyDrawing`, "surveycad-preview-plan");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Survey Plan Drawing Preview & Area Statement
              </h2>
              <p className="text-xs text-slate-400">
                {project.title} &bull; Re-Survey No: {project.titleBlock.reSurveyNo || "N/A"} &bull; Scale: {project.titleBlock.drawingScale || "1:200"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg mr-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("PLAN")}
                className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                  activeTab === "PLAN"
                    ? "bg-cyan-500 text-slate-950 shadow font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Drawing Plan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("AREA_TABLE")}
                className={`px-3 py-1.5 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "AREA_TABLE"
                    ? "bg-cyan-500 text-slate-950 shadow font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Area Table ({project.entities.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "PLAN" ? (
            <div
              id="surveycad-preview-plan"
              className="bg-white text-slate-950 p-6 rounded-xl border-2 border-slate-900 shadow-xl space-y-4"
            >
              {/* Sheet Title Bar */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 font-mono">
                    {project.titleBlock.projectTitle || project.title || "SURVEY PLOT PLAN"}
                  </h1>
                  <p className="text-xs text-slate-700 font-mono">
                    Owner: {project.titleBlock.ownerName || "Private"} &bull; Village: {project.titleBlock.village || "Kerala"} &bull; Taluk: {project.titleBlock.taluk || "Ernakulam"}
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <p className="font-bold text-slate-900">Re-Survey No: {project.titleBlock.reSurveyNo || "142/2A"}</p>
                  <p className="text-slate-600">Scale: {project.titleBlock.drawingScale || "1:200"}</p>
                </div>
              </div>

              {/* High-Resolution SVG Canvas Area */}
              <div className="relative w-full h-[440px] bg-white border-2 border-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <svg
                  viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`}
                  className="w-full h-full"
                  style={{ overflow: "visible" }}
                >
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="previewGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.4" />
                    </pattern>
                  </defs>
                  <rect
                    x={viewBoxX}
                    y={viewBoxY}
                    width={viewBoxW}
                    height={viewBoxH}
                    fill="url(#previewGrid)"
                  />

                  {/* Parcels */}
                  {parcelEntities.map((ent: any) => (
                    <g key={ent.id}>
                      <polygon
                        points={ent.points.map((p: any) => `${p.x},${toSvgY(p.y)}`).join(" ")}
                        fill="rgba(56, 189, 248, 0.12)"
                        stroke="#0284c7"
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
                      {ent.points.map((p: any, idx: number) => {
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
                    </g>
                  ))}

                  {/* Triangles */}
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
                          fill="rgba(6, 182, 212, 0.12)"
                          stroke="#0891b2"
                          strokeWidth="1.3"
                          strokeDasharray="3 1.5"
                        />
                        <text
                          x={cx}
                          y={toSvgY(cy)}
                          fontSize="2.2"
                          fontFamily="monospace"
                          fontWeight="bold"
                          fill="#0891b2"
                          textAnchor="middle"
                        >
                          Δ {ent.triangleId || "T"} ({ent.areaCents?.toFixed(2)} Cents)
                        </text>
                        <text x={mid1.x} y={toSvgY(mid1.y) - 0.5} fontSize="1.8" fontFamily="monospace" fill="#047857" textAnchor="middle">
                          {ent.sideA?.toFixed(2) || ""}m
                        </text>
                        <text x={mid2.x} y={toSvgY(mid2.y) - 0.5} fontSize="1.8" fontFamily="monospace" fill="#047857" textAnchor="middle">
                          {ent.sideB?.toFixed(2) || ""}m
                        </text>
                        <text x={mid3.x} y={toSvgY(mid3.y) - 0.5} fontSize="1.8" fontFamily="monospace" fill="#047857" textAnchor="middle">
                          {ent.sideC?.toFixed(2) || ""}m
                        </text>
                      </g>
                    );
                  })}

                  {/* Circles */}
                  {circleEntities.map((ent: any) => (
                    <g key={ent.id}>
                      <circle
                        cx={ent.center.x}
                        cy={toSvgY(ent.center.y)}
                        r={ent.radius}
                        fill="rgba(168, 85, 247, 0.1)"
                        stroke="#9333ea"
                        strokeWidth="1.3"
                      />
                      <text
                        x={ent.center.x}
                        y={toSvgY(ent.center.y) + ent.radius + 2.2}
                        fontSize="2.0"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#7e22ce"
                        textAnchor="middle"
                      >
                        Well (R: {ent.radius}m)
                      </text>
                    </g>
                  ))}

                  {/* Rectangles */}
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

                  {/* Lines */}
                  {lineEntities.map((ent: any) => (
                    <line
                      key={ent.id}
                      x1={ent.start.x}
                      y1={toSvgY(ent.start.y)}
                      x2={ent.end.x}
                      y2={toSvgY(ent.end.y)}
                      stroke="#0f172a"
                      strokeWidth="1.3"
                    />
                  ))}

                  {/* Polylines */}
                  {polylineEntities.map((ent: any) => (
                    <polyline
                      key={ent.id}
                      points={ent.points.map((p: any) => `${p.x},${toSvgY(p.y)}`).join(" ")}
                      fill="none"
                      stroke={ent.color || "#475569"}
                      strokeWidth={ent.lineWidth || 1.3}
                      strokeDasharray={ent.lineDash ? ent.lineDash.join(" ") : undefined}
                    />
                  ))}

                  {/* Survey Points */}
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
                        {pt.name}
                      </text>
                    </g>
                  ))}
                </svg>

                {/* SVG North Indicator (Top Right) */}
                <div className="absolute top-3 right-3 bg-white/95 border-2 border-slate-900 p-2 rounded shadow font-mono text-[10px] text-center flex flex-col items-center">
                  <Compass className="w-6 h-6 text-red-600 animate-pulse" />
                  <span className="font-bold text-slate-900 text-[8px] mt-0.5">TRUE NORTH</span>
                </div>

                {/* Live Area Badge Overlay */}
                <div className="absolute bottom-3 left-3 bg-white/95 border-2 border-slate-900 p-2.5 rounded shadow font-mono text-xs">
                  <p className="font-bold text-slate-900">
                    Gross Plot Area: <span className="text-blue-700 font-black">{grossCents.toFixed(3)} Cents</span>
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {grossAreaSqM.toFixed(2)} m² &bull; {grossSqFt.toFixed(1)} sq.ft &bull; {grossAres.toFixed(3)} Ares
                  </p>
                </div>
              </div>

              {/* Sheet Footer Title Block Table */}
              <div className="border-2 border-slate-900 grid grid-cols-4 text-[11px] font-mono divide-x-2 border-collapse divide-slate-900">
                <div className="p-2 space-y-0.5">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Surveyor</span>
                  <p className="font-bold text-slate-900">{project.titleBlock.surveyorName || "Licensed Surveyor"}</p>
                  <p className="text-slate-600 text-[10px]">Lic: {project.titleBlock.licenseNo || "KER-LS-2024"}</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Location</span>
                  <p className="font-bold text-slate-900">{project.titleBlock.village || "Village"}, {project.titleBlock.district || "Ernakulam"}</p>
                  <p className="text-slate-600 text-[10px]">Block: {project.titleBlock.blockNo || "1"} | Ward: {project.titleBlock.wardNo || "4"}</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Total Extent</span>
                  <p className="font-black text-blue-700 text-sm">{grossCents.toFixed(3)} CENTS</p>
                  <p className="text-slate-600 text-[10px]">({grossAreaSqM.toFixed(2)} m²)</p>
                </div>
                <div className="p-2 space-y-0.5">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Date & Scale</span>
                  <p className="font-bold text-slate-900">{project.titleBlock.surveyDate || new Date().toISOString().split("T")[0]}</p>
                  <p className="text-slate-600 text-[10px]">{project.titleBlock.drawingScale || "1:200"}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Automatic Area Breakdown Table Tab */
            <div className="space-y-6 font-mono text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">Kerala Cents</span>
                  <p className="text-xl font-black text-white mt-1">{grossCents.toFixed(3)}</p>
                  <span className="text-[10px] text-slate-500">1 Cent = 40.4686 m²</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30">
                  <span className="text-[10px] text-blue-400 uppercase font-bold block">Square Meters</span>
                  <p className="text-xl font-black text-white mt-1">{grossAreaSqM.toFixed(2)}</p>
                  <span className="text-[10px] text-slate-500">Standard SI Unit</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Ares</span>
                  <p className="text-xl font-black text-white mt-1">{grossAres.toFixed(3)}</p>
                  <span className="text-[10px] text-slate-500">1 Are = 100 m²</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">Square Feet</span>
                  <p className="text-xl font-black text-white mt-1">{grossSqFt.toFixed(1)}</p>
                  <span className="text-[10px] text-slate-500">1 m² = 10.7639 sq.ft</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30">
                  <span className="text-[10px] text-purple-400 uppercase font-bold block">Acres</span>
                  <p className="text-xl font-black text-white mt-1">{grossAcres.toFixed(4)}</p>
                  <span className="text-[10px] text-slate-500">100 Cents = 1 Acre</span>
                </div>
              </div>

              {/* Automatic Entities Area Schedule */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                    Automated Area Schedule Table (All Entities)
                  </span>
                  <span className="text-[11px] text-slate-400">Auto-calculated from geometry</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 text-slate-400">
                      <tr>
                        <th className="p-2.5">Entity / Plot Component</th>
                        <th className="p-2.5">Geometry Type</th>
                        <th className="p-2.5">Dimensions / Key Parameters</th>
                        <th className="p-2.5">Area (m²)</th>
                        <th className="p-2.5">Area (Kerala Cents)</th>
                        <th className="p-2.5">Area (Sq.Ft)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {parcelEntities.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <Square className="w-3.5 h-3.5 text-cyan-400" />
                            {p.name || "Polygon Parcel"}
                          </td>
                          <td className="p-2.5 text-cyan-400">Polygon ({p.points.length} vertices)</td>
                          <td className="p-2.5 text-slate-400">
                            Perimeter: {p.points.reduce((acc: number, pt: any, i: number) => acc + distance2D(pt, p.points[(i + 1) % p.points.length]), 0).toFixed(2)} m
                          </td>
                          <td className="p-2.5 font-bold text-white">{p.areaSqM?.toFixed(2)}</td>
                          <td className="p-2.5 font-black text-cyan-400">{p.areaCents?.toFixed(3)}</td>
                          <td className="p-2.5 text-slate-400">{p.areaSqFt?.toFixed(1)}</td>
                        </tr>
                      ))}

                      {triangleEntities.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <TriangleIcon className="w-3.5 h-3.5 text-emerald-400" />
                            Triangle {t.triangleId || "Plot"}
                          </td>
                          <td className="p-2.5 text-emerald-400">Triangle (Heron formula)</td>
                          <td className="p-2.5 text-slate-400">
                            a={t.sideA}m, b={t.sideB}m, c={t.sideC}m
                          </td>
                          <td className="p-2.5 font-bold text-white">{t.areaSqM?.toFixed(2)}</td>
                          <td className="p-2.5 font-black text-emerald-400">{t.areaCents?.toFixed(3)}</td>
                          <td className="p-2.5 text-slate-400">{(t.areaSqM * SQM_TO_SQFT).toFixed(1)}</td>
                        </tr>
                      ))}

                      {circleEntities.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <CircleIcon className="w-3.5 h-3.5 text-purple-400" />
                            Circular Feature / Well
                          </td>
                          <td className="p-2.5 text-purple-400">Circle (π r²)</td>
                          <td className="p-2.5 text-slate-400">
                            Radius: {c.radius}m | Circumference: {c.circumferenceM}m
                          </td>
                          <td className="p-2.5 font-bold text-white">{c.areaSqM?.toFixed(2)}</td>
                          <td className="p-2.5 font-black text-purple-400">{c.areaCents?.toFixed(3)}</td>
                          <td className="p-2.5 text-slate-400">{(c.areaSqM * SQM_TO_SQFT).toFixed(1)}</td>
                        </tr>
                      ))}

                      {rectEntities.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <Square className="w-3.5 h-3.5 text-amber-400" />
                            Rectangle Block
                          </td>
                          <td className="p-2.5 text-amber-400">Rectangle</td>
                          <td className="p-2.5 text-slate-400">
                            W={Math.abs(r.corner2.x - r.corner1.x).toFixed(2)}m × H={Math.abs(r.corner2.y - r.corner1.y).toFixed(2)}m
                          </td>
                          <td className="p-2.5 font-bold text-white">{r.areaSqM?.toFixed(2)}</td>
                          <td className="p-2.5 font-black text-amber-400">{(r.areaSqM * SQM_TO_CENTS).toFixed(3)}</td>
                          <td className="p-2.5 text-slate-400">{(r.areaSqM * SQM_TO_SQFT).toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-900/90 font-bold border-t-2 border-slate-700">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right uppercase tracking-wider text-slate-300">
                          Total Gross Extent:
                        </td>
                        <td className="p-2.5 text-white font-black">{grossAreaSqM.toFixed(2)} m²</td>
                        <td className="p-2.5 text-cyan-400 font-black">{grossCents.toFixed(3)} Cents</td>
                        <td className="p-2.5 text-slate-300">{grossSqFt.toFixed(1)} sq.ft</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between font-mono text-xs">
          <div className="text-slate-400">
            Total Entities: {project.entities.length} &bull; Station Points: {project.points.length}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadDxfFile(project)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4" />
              <span>Export DXF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
