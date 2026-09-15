import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  SurveyCadProject,
  SurveyEntity,
  SurveyPoint,
  SurveyCadTool,
  ViewportState,
  Point2D,
  SnapPoint,
  SymbolType,
  SurveyTriangleEntity,
  SurveyCircleEntity,
  SurveyParcelEntity
} from "./types";
import {
  distance2D,
  calculateBearing,
  degToDms,
  SQM_TO_CENTS,
  SQM_TO_SQFT,
  SQM_TO_ARES,
  SQM_TO_ACRES,
  calculatePolygonAreaSqM,
  heronTriangleArea
} from "./utils/surveyGeometry";

interface SurveyCadCanvasProps {
  project: SurveyCadProject;
  currentTool: SurveyCadTool;
  activeLayer: string;
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onAddEntity: (entity: SurveyEntity) => void;
  onAddPoint: (point: SurveyPoint) => void;
  onUpdateEntity: (entity: SurveyEntity) => void;
  onDeleteEntity: (id: string) => void;
  onDeletePoint: (id: string) => void;
  viewport: ViewportState;
  onUpdateViewport: (vp: ViewportState) => void;
  onCursorChange: (coords: { x: number; y: number; bearing?: number; dist?: number }) => void;
  snapEnabled: boolean;
  gridSnapEnabled: boolean;
  gridSize: number; // in meters (e.g. 1.0, 5.0, 10.0)
  activeSymbol: SymbolType;
  offsetDistInput: number;
  circleRadiusInput?: number; // Exact radius in current unit
}

export const SurveyCadCanvas: React.FC<SurveyCadCanvasProps> = ({
  project,
  currentTool,
  activeLayer,
  selectedEntityId,
  onSelectEntity,
  onAddEntity,
  onAddPoint,
  onUpdateEntity,
  onDeleteEntity,
  onDeletePoint,
  viewport,
  onUpdateViewport,
  onCursorChange,
  snapEnabled,
  gridSnapEnabled,
  gridSize,
  activeSymbol,
  offsetDistInput,
  circleRadiusInput
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point2D>({ x: 0, y: 0 });
  const [mouseWorld, setMouseWorld] = useState<Point2D>({ x: 0, y: 0 });
  const [activeSnap, setActiveSnap] = useState<SnapPoint | null>(null);

  // Eraser hover state
  const [hoveredEraseTarget, setHoveredEraseTarget] = useState<{
    type: "POINT" | "ENTITY";
    id: string;
    label?: string;
  } | null>(null);

  // Temporary Drawing State
  const [drawPoints, setDrawPoints] = useState<Point2D[]>([]);
  const [draggingVertex, setDraggingVertex] = useState<{
    entityId: string;
    pointIndex: number;
  } | null>(null);

  // Helper for unit formatted length
  const formatLength = useCallback(
    (distInMeters: number): string => {
      if (project.unit === "cm") {
        return `${(distInMeters * 100).toFixed(1)} cm`;
      }
      return `${distInMeters.toFixed(2)} m`;
    },
    [project.unit]
  );

  // Coordinate Conversion: World (Meters) <-> Screen (Pixels)
  const worldToScreen = useCallback(
    (pt: Point2D, width: number, height: number): Point2D => {
      const cx = width / 2;
      const cy = height / 2;
      return {
        x: cx + (pt.x - viewport.panX) * viewport.zoom,
        y: cy - (pt.y - viewport.panY) * viewport.zoom // Standard CAD Cartesian: +Y is North (up)
      };
    },
    [viewport]
  );

  const screenToWorld = useCallback(
    (screenPt: Point2D, width: number, height: number): Point2D => {
      const cx = width / 2;
      const cy = height / 2;
      return {
        x: viewport.panX + (screenPt.x - cx) / viewport.zoom,
        y: viewport.panY - (screenPt.y - cy) / viewport.zoom
      };
    },
    [viewport]
  );

  // Snap detection
  const findSnapPoint = useCallback(
    (worldPt: Point2D): SnapPoint | null => {
      if (!snapEnabled) return null;
      const snapThresholdWorld = 14 / viewport.zoom; // 14 pixels in world units

      // 1. Check Survey Points
      for (const pt of project.points) {
        if (distance2D(worldPt, pt) < snapThresholdWorld) {
          return { x: pt.x, y: pt.y, type: "POINT_NODE", label: pt.name };
        }
      }

      // 2. Check Entities Endpoints and Midpoints
      for (const ent of project.entities) {
        if (ent.visible === false) continue;

        if (ent.type === "LINE") {
          if (distance2D(worldPt, ent.start) < snapThresholdWorld) {
            return { x: ent.start.x, y: ent.start.y, type: "ENDPOINT" };
          }
          if (distance2D(worldPt, ent.end) < snapThresholdWorld) {
            return { x: ent.end.x, y: ent.end.y, type: "ENDPOINT" };
          }
          const mid: Point2D = { x: (ent.start.x + ent.end.x) / 2, y: (ent.start.y + ent.end.y) / 2 };
          if (distance2D(worldPt, mid) < snapThresholdWorld) {
            return { x: mid.x, y: mid.y, type: "MIDPOINT" };
          }
        } else if (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL") {
          for (let i = 0; i < ent.points.length; i++) {
            const p = ent.points[i];
            if (distance2D(worldPt, p) < snapThresholdWorld) {
              return { x: p.x, y: p.y, type: "ENDPOINT", label: `V${i + 1}` };
            }
            if (i < ent.points.length - 1 || (ent as any).closed || ent.type === "POLYGON_PARCEL") {
              const nextP = ent.points[(i + 1) % ent.points.length];
              const mid: Point2D = { x: (p.x + nextP.x) / 2, y: (p.y + nextP.y) / 2 };
              if (distance2D(worldPt, mid) < snapThresholdWorld) {
                return { x: mid.x, y: mid.y, type: "MIDPOINT" };
              }
            }
          }
        } else if (ent.type === "TRIANGLE") {
          const pts = [ent.p1, ent.p2, ent.p3];
          for (let i = 0; i < 3; i++) {
            if (distance2D(worldPt, pts[i]) < snapThresholdWorld) {
              return { x: pts[i].x, y: pts[i].y, type: "ENDPOINT", label: `T-P${i + 1}` };
            }
          }
        } else if (ent.type === "CIRCLE") {
          if (distance2D(worldPt, ent.center) < snapThresholdWorld) {
            return { x: ent.center.x, y: ent.center.y, type: "CENTER", label: "Center" };
          }
        }
      }

      // 3. Grid Snap
      if (gridSnapEnabled && gridSize > 0) {
        const gx = Math.round(worldPt.x / gridSize) * gridSize;
        const gy = Math.round(worldPt.y / gridSize) * gridSize;
        if (distance2D(worldPt, { x: gx, y: gy }) < snapThresholdWorld) {
          return { x: gx, y: gy, type: "GRID" };
        }
      }

      return null;
    },
    [snapEnabled, gridSnapEnabled, gridSize, viewport.zoom, project.points, project.entities]
  );

  // Find entity or point under cursor (for ERASE or selection)
  const findItemUnderCursor = useCallback(
    (worldPt: Point2D): { type: "POINT" | "ENTITY"; id: string; label?: string } | null => {
      const threshold = 18 / viewport.zoom;

      // 1. Points first
      for (const pt of project.points) {
        if (distance2D(worldPt, pt) < threshold) {
          return { type: "POINT", id: pt.id, label: `Point ${pt.name}` };
        }
      }

      // 2. Entities
      for (let i = project.entities.length - 1; i >= 0; i--) {
        const ent = project.entities[i];
        if (ent.visible === false) continue;

        if (ent.type === "LINE") {
          const p1 = ent.start;
          const p2 = ent.end;
          const lineLen = distance2D(p1, p2);
          if (lineLen > 0) {
            const d1 = distance2D(worldPt, p1);
            const d2 = distance2D(worldPt, p2);
            if (d1 + d2 <= lineLen + threshold) {
              return { type: "ENTITY", id: ent.id, label: `Line (${lineLen.toFixed(1)}m)` };
            }
          }
        } else if (ent.type === "CIRCLE") {
          const distToCenter = distance2D(worldPt, ent.center);
          if (Math.abs(distToCenter - ent.radius) < threshold || distToCenter < ent.radius) {
            return { type: "ENTITY", id: ent.id, label: `Circle (R: ${ent.radius}m)` };
          }
        } else if (ent.type === "TRIANGLE") {
          const p1 = ent.p1,
            p2 = ent.p2,
            p3 = ent.p3;
          if (
            distance2D(worldPt, p1) < threshold ||
            distance2D(worldPt, p2) < threshold ||
            distance2D(worldPt, p3) < threshold
          ) {
            return { type: "ENTITY", id: ent.id, label: `Triangle ${ent.triangleId || ""}` };
          }
          // Check inside triangle (barycentric)
          const denom = (p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y);
          if (denom !== 0) {
            const a = ((p2.y - p3.y) * (worldPt.x - p3.x) + (p3.x - p2.x) * (worldPt.y - p3.y)) / denom;
            const b = ((p3.y - p1.y) * (worldPt.x - p3.x) + (p1.x - p3.x) * (worldPt.y - p3.y)) / denom;
            const c = 1 - a - b;
            if (a >= 0 && b >= 0 && c >= 0) {
              return { type: "ENTITY", id: ent.id, label: `Triangle ${ent.triangleId || ""}` };
            }
          }
        } else if (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL") {
          for (let j = 0; j < ent.points.length; j++) {
            const pA = ent.points[j];
            const pB = ent.points[(j + 1) % ent.points.length];
            const segLen = distance2D(pA, pB);
            const dA = distance2D(worldPt, pA);
            const dB = distance2D(worldPt, pB);
            if (dA < threshold) {
              return { type: "ENTITY", id: ent.id, label: (ent as any).name || "Polygon" };
            }
            if (dA + dB <= segLen + threshold) {
              return { type: "ENTITY", id: ent.id, label: (ent as any).name || "Polygon" };
            }
          }
        } else if (ent.type === "RECTANGLE") {
          const minX = Math.min(ent.corner1.x, ent.corner2.x);
          const maxX = Math.max(ent.corner1.x, ent.corner2.x);
          const minY = Math.min(ent.corner1.y, ent.corner2.y);
          const maxY = Math.max(ent.corner1.y, ent.corner2.y);
          if (
            worldPt.x >= minX - threshold &&
            worldPt.x <= maxX + threshold &&
            worldPt.y >= minY - threshold &&
            worldPt.y <= maxY + threshold
          ) {
            return { type: "ENTITY", id: ent.id, label: "Rectangle" };
          }
        } else if (ent.type === "SYMBOL") {
          if (distance2D(worldPt, ent.position) < threshold * 1.5) {
            return { type: "ENTITY", id: ent.id, label: `Symbol: ${ent.symbolType}` };
          }
        }
      }

      return null;
    },
    [project.points, project.entities, viewport.zoom]
  );

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high-DPI retina display
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Background Grid (Survey CAD Blueprint)
    ctx.fillStyle = "#090d16"; // Deep slate blueprint background
    ctx.fillRect(0, 0, width, height);

    // Draw Dynamic Coordinate Grid
    const gridSpacingM = gridSize || (viewport.zoom > 30 ? 1 : viewport.zoom > 10 ? 5 : 20);
    const startWorldX = Math.floor((viewport.panX - width / (2 * viewport.zoom)) / gridSpacingM) * gridSpacingM;
    const endWorldX = Math.ceil((viewport.panX + width / (2 * viewport.zoom)) / gridSpacingM) * gridSpacingM;
    const startWorldY = Math.floor((viewport.panY - height / (2 * viewport.zoom)) / gridSpacingM) * gridSpacingM;
    const endWorldY = Math.ceil((viewport.panY + height / (2 * viewport.zoom)) / gridSpacingM) * gridSpacingM;

    // Major grid lines
    ctx.strokeStyle = "rgba(30, 41, 59, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startWorldX; x <= endWorldX; x += gridSpacingM) {
      const p = worldToScreen({ x, y: 0 }, width, height);
      ctx.moveTo(p.x, 0);
      ctx.lineTo(p.x, height);
    }
    for (let y = startWorldY; y <= endWorldY; y += gridSpacingM) {
      const p = worldToScreen({ x: 0, y }, width, height);
      ctx.moveTo(0, p.y);
      ctx.lineTo(width, p.y);
    }
    ctx.stroke();

    // Axis Lines (X=0 and Y=0 in bright cyan/amber)
    const originScreen = worldToScreen({ x: 0, y: 0 }, width, height);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Y Axis (North)
    ctx.moveTo(originScreen.x, 0);
    ctx.lineTo(originScreen.x, height);
    // X Axis (East)
    ctx.moveTo(0, originScreen.y);
    ctx.lineTo(width, originScreen.y);
    ctx.stroke();

    // 2. Render Project Entities
    project.entities.forEach((ent) => {
      if (ent.visible === false) return;
      const isSelected = ent.id === selectedEntityId;
      const isEraseHover = hoveredEraseTarget?.id === ent.id;

      ctx.save();
      ctx.strokeStyle = isEraseHover
        ? "#ef4444"
        : isSelected
        ? "#38bdf8"
        : ent.color || "#94a3b8";
      ctx.lineWidth = isEraseHover || isSelected ? (ent.lineWidth || 2) + 2 : ent.lineWidth || 2;
      if (ent.lineDash && !isEraseHover) ctx.setLineDash(ent.lineDash);

      if (ent.type === "LINE") {
        const p1 = worldToScreen(ent.start, width, height);
        const p2 = worldToScreen(ent.end, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Length & Bearing Label
        const len = distance2D(ent.start, ent.end);
        const bearing = calculateBearing(ent.start, ent.end);
        const midScreen = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        ctx.fillStyle = isEraseHover ? "#ef4444" : "#38bdf8";
        ctx.font = "10px monospace";
        ctx.fillText(
          `${formatLength(len)} (${bearing.toFixed(1)}°)`,
          midScreen.x + 6,
          midScreen.y - 6
        );
      } else if (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL") {
        if (ent.points.length >= 2) {
          ctx.beginPath();
          const first = worldToScreen(ent.points[0], width, height);
          ctx.moveTo(first.x, first.y);
          for (let i = 1; i < ent.points.length; i++) {
            const p = worldToScreen(ent.points[i], width, height);
            ctx.lineTo(p.x, p.y);
          }
          if (ent.type === "POLYGON_PARCEL" || (ent as any).closed) {
            ctx.closePath();
            if (ent.fillColor && !isEraseHover) {
              ctx.fillStyle = ent.fillColor;
              ctx.fill();
            } else if (isEraseHover) {
              ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
              ctx.fill();
            }
          }
          ctx.stroke();

          // Segment dimensions
          for (let i = 0; i < ent.points.length; i++) {
            const isLast = i === ent.points.length - 1;
            if (isLast && !(ent.type === "POLYGON_PARCEL" || (ent as any).closed)) continue;
            const pA = ent.points[i];
            const pB = ent.points[(i + 1) % ent.points.length];
            const sA = worldToScreen(pA, width, height);
            const sB = worldToScreen(pB, width, height);
            const len = distance2D(pA, pB);
            const mid = { x: (sA.x + sB.x) / 2, y: (sA.y + sB.y) / 2 };

            ctx.fillStyle = isSelected ? "#38bdf8" : isEraseHover ? "#ef4444" : "#94a3b8";
            ctx.font = "10px monospace";
            ctx.fillText(formatLength(len), mid.x + 4, mid.y - 4);
          }

          // Parcel Center Label
          if (ent.type === "POLYGON_PARCEL") {
            const centerWorld = {
              x: ent.points.reduce((acc, p) => acc + p.x, 0) / ent.points.length,
              y: ent.points.reduce((acc, p) => acc + p.y, 0) / ent.points.length
            };
            const centerScreen = worldToScreen(centerWorld, width, height);
            ctx.fillStyle = isEraseHover ? "#ef4444" : "#ffffff";
            ctx.font = "bold 12px monospace";
            ctx.textAlign = "center";
            ctx.fillText(ent.name || "PARCEL", centerScreen.x, centerScreen.y - 10);
            ctx.fillStyle = isEraseHover ? "#ef4444" : "#38bdf8";
            ctx.font = "bold 11px monospace";
            ctx.fillText(
              `${ent.areaCents?.toFixed(2)} Cents (${ent.areaSqM?.toFixed(1)} m²)`,
              centerScreen.x,
              centerScreen.y + 6
            );
            ctx.textAlign = "start";
          }
        }
      } else if (ent.type === "TRIANGLE") {
        const p1 = worldToScreen(ent.p1, width, height);
        const p2 = worldToScreen(ent.p2, width, height);
        const p3 = worldToScreen(ent.p3, width, height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fillStyle = isEraseHover ? "rgba(239, 68, 68, 0.2)" : "rgba(6, 182, 212, 0.08)";
        ctx.fill();
        ctx.stroke();

        // Show side measurements
        const mid12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const mid23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
        const mid31 = { x: (p3.x + p1.x) / 2, y: (p3.y + p1.y) / 2 };

        ctx.fillStyle = "#94a3b8";
        ctx.font = "9px monospace";
        ctx.fillText(formatLength(ent.sideA), mid12.x + 2, mid12.y - 2);
        ctx.fillText(formatLength(ent.sideB), mid23.x + 2, mid23.y - 2);
        ctx.fillText(formatLength(ent.sideC), mid31.x + 2, mid31.y - 2);

        // Triangle Centroid Label
        const cx = (p1.x + p2.x + p3.x) / 3;
        const cy = (p1.y + p2.y + p3.y) / 3;
        ctx.fillStyle = isEraseHover ? "#ef4444" : "#06b6d4";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${ent.triangleId || "T"} : ${ent.areaCents?.toFixed(2)} Cents`, cx, cy - 4);
        ctx.font = "9px monospace";
        ctx.fillText(`(${ent.areaSqM?.toFixed(1)} m²)`, cx, cy + 9);
        ctx.textAlign = "start";
      } else if (ent.type === "CIRCLE") {
        const centerScreen = worldToScreen(ent.center, width, height);
        const radiusPx = ent.radius * viewport.zoom;
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = isEraseHover ? "rgba(239, 68, 68, 0.2)" : "rgba(168, 85, 247, 0.08)";
        ctx.fill();
        ctx.stroke();

        // Center crosshair mark
        ctx.beginPath();
        ctx.moveTo(centerScreen.x - 5, centerScreen.y);
        ctx.lineTo(centerScreen.x + 5, centerScreen.y);
        ctx.moveTo(centerScreen.x, centerScreen.y - 5);
        ctx.lineTo(centerScreen.x, centerScreen.y + 5);
        ctx.stroke();

        // Radius dimension line
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y);
        ctx.lineTo(centerScreen.x + radiusPx, centerScreen.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Radius label & Area
        ctx.fillStyle = isEraseHover ? "#ef4444" : "#c084fc";
        ctx.font = "bold 10px monospace";
        ctx.fillText(`R: ${formatLength(ent.radius)}`, centerScreen.x + radiusPx / 2 - 12, centerScreen.y - 4);
        if (ent.areaCents) {
          ctx.fillText(`${ent.areaCents.toFixed(2)} Cents (${ent.areaSqM?.toFixed(1)} m²)`, centerScreen.x - 24, centerScreen.y + 14);
        }
      } else if (ent.type === "RECTANGLE") {
        const p1 = worldToScreen(ent.corner1, width, height);
        const p2 = worldToScreen(ent.corner2, width, height);
        const rx = Math.min(p1.x, p2.x);
        const ry = Math.min(p1.y, p2.y);
        const rw = Math.abs(p2.x - p1.x);
        const rh = Math.abs(p2.y - p1.y);
        ctx.fillStyle = isEraseHover ? "rgba(239, 68, 68, 0.2)" : "rgba(245, 158, 11, 0.08)";
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      } else if (ent.type === "CONTOUR") {
        if (ent.points.length >= 2) {
          ctx.beginPath();
          const p1 = worldToScreen(ent.points[0], width, height);
          const p2 = worldToScreen(ent.points[1], width, height);
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      } else if (ent.type === "TEXT") {
        const p = worldToScreen(ent.position, width, height);
        ctx.fillStyle = ent.color || "#ffffff";
        ctx.font = `bold ${Math.max(10, (ent.fontSize || 1) * viewport.zoom)}px monospace`;
        ctx.fillText(ent.text, p.x, p.y);
      } else if (ent.type === "SYMBOL") {
        const p = worldToScreen(ent.position, width, height);
        renderSymbolOnCanvas(ctx, ent.symbolType, p.x, p.y, (ent.scale || 1) * 12, ent.label);
      }

      // Draw Selected Entity Vertex Handles
      if (isSelected && (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL")) {
        ent.points.forEach((pt) => {
          const sp = worldToScreen(pt, width, height);
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(sp.x - 5, sp.y - 5, 10, 10);
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(sp.x - 5, sp.y - 5, 10, 10);
        });
      }

      ctx.restore();
    });

    // 3. Render Survey Points
    project.points.forEach((pt) => {
      const sp = worldToScreen(pt, width, height);
      const isEraseHover = hoveredEraseTarget?.id === pt.id;

      ctx.save();
      // Point marker
      ctx.fillStyle = isEraseHover ? "#ef4444" : pt.isControlPoint ? "#ef4444" : "#fbbf24";
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, isEraseHover ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Point Name & Elevation
      ctx.fillStyle = isEraseHover ? "#ef4444" : "#e2e8f0";
      ctx.font = "bold 10px monospace";
      ctx.fillText(pt.name, sp.x + 8, sp.y - 4);
      if (typeof pt.z === "number") {
        ctx.fillStyle = isEraseHover ? "#ef4444" : "#38bdf8";
        ctx.font = "9px monospace";
        ctx.fillText(`Z: ${pt.z.toFixed(2)}m`, sp.x + 8, sp.y + 8);
      }
      ctx.restore();
    });

    // 4. Render Active In-Progress Drawing
    if (drawPoints.length > 0) {
      ctx.save();
      const curTarget = activeSnap || mouseWorld;
      const curScreen = worldToScreen(curTarget, width, height);

      if (currentTool === "CIRCLE") {
        const centerWorld = drawPoints[0];
        const centerScreen = worldToScreen(centerWorld, width, height);
        const radiusM = circleRadiusInput && circleRadiusInput > 0
          ? (project.unit === "cm" ? circleRadiusInput / 100 : circleRadiusInput)
          : distance2D(centerWorld, curTarget);
        const radiusPx = radiusM * viewport.zoom;

        ctx.strokeStyle = "#c084fc";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radiusPx, 0, Math.PI * 2);
        ctx.stroke();

        // Line to cursor
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y);
        ctx.lineTo(curScreen.x, curScreen.y);
        ctx.stroke();

        // Readout
        ctx.fillStyle = "#c084fc";
        ctx.font = "bold 11px monospace";
        const areaSqM = Math.PI * radiusM * radiusM;
        ctx.fillText(
          `R: ${formatLength(radiusM)} | Area: ${(areaSqM * SQM_TO_CENTS).toFixed(2)} Cents`,
          curScreen.x + 14,
          curScreen.y - 14
        );
      } else if (currentTool === "TRIANGLE") {
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        const p1Screen = worldToScreen(drawPoints[0], width, height);
        ctx.moveTo(p1Screen.x, p1Screen.y);

        if (drawPoints.length === 1) {
          ctx.lineTo(curScreen.x, curScreen.y);
          ctx.stroke();

          const segLen = distance2D(drawPoints[0], curTarget);
          ctx.fillStyle = "#06b6d4";
          ctx.font = "bold 11px monospace";
          ctx.fillText(`Side A: ${formatLength(segLen)} (Click 2nd vertex)`, curScreen.x + 14, curScreen.y - 14);
        } else if (drawPoints.length === 2) {
          const p2Screen = worldToScreen(drawPoints[1], width, height);
          ctx.lineTo(p2Screen.x, p2Screen.y);
          ctx.lineTo(curScreen.x, curScreen.y);
          ctx.closePath();
          ctx.stroke();

          const sideA = distance2D(drawPoints[0], drawPoints[1]);
          const sideB = distance2D(drawPoints[1], curTarget);
          const sideC = distance2D(curTarget, drawPoints[0]);
          const areaSqM = heronTriangleArea(sideA, sideB, sideC);

          ctx.fillStyle = "#06b6d4";
          ctx.font = "bold 11px monospace";
          ctx.fillText(
            `Click 3rd vertex to close: Area ${(areaSqM * SQM_TO_CENTS).toFixed(2)} Cents`,
            curScreen.x + 14,
            curScreen.y - 14
          );
        }
      } else {
        // Standard Polyline / Line rubber band
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        const first = worldToScreen(drawPoints[0], width, height);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < drawPoints.length; i++) {
          const p = worldToScreen(drawPoints[i], width, height);
          ctx.lineTo(p.x, p.y);
        }

        ctx.lineTo(curScreen.x, curScreen.y);
        ctx.stroke();

        // Rubber band measurement readout
        const lastPt = drawPoints[drawPoints.length - 1];
        const segLen = distance2D(lastPt, curTarget);
        const segBearing = calculateBearing(lastPt, curTarget);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 11px monospace";
        ctx.fillText(
          `L: ${formatLength(segLen)} | Brg: ${segBearing.toFixed(1)}° (${degToDms(segBearing).formatted})`,
          curScreen.x + 14,
          curScreen.y - 14
        );
      }

      ctx.restore();
    }

    // 5. Render Snap Marker
    if (activeSnap) {
      const sp = worldToScreen(activeSnap, width, height);
      ctx.save();
      ctx.strokeStyle = "#00ffff";
      ctx.lineWidth = 2;
      if (activeSnap.type === "ENDPOINT") {
        ctx.strokeRect(sp.x - 6, sp.y - 6, 12, 12);
      } else if (activeSnap.type === "MIDPOINT") {
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y - 7);
        ctx.lineTo(sp.x - 7, sp.y + 5);
        ctx.lineTo(sp.x + 7, sp.y + 5);
        ctx.closePath();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (activeSnap.label) {
        ctx.fillStyle = "#00ffff";
        ctx.font = "bold 10px monospace";
        ctx.fillText(activeSnap.label, sp.x + 10, sp.y - 6);
      }
      ctx.restore();
    }

    // 6. Erase Tool Target HUD readout
    if (currentTool === "ERASE" && hoveredEraseTarget) {
      const sp = worldToScreen(mouseWorld, width, height);
      ctx.save();
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`[CLICK TO ERASE: ${hoveredEraseTarget.label || hoveredEraseTarget.id}]`, sp.x + 12, sp.y - 12);
      ctx.restore();
    }

    // 7. Survey CAD North Compass Indicator (Top Right)
    renderNorthCompass(ctx, width - 45, 45, project.titleBlock.northAngle || 0);

    ctx.restore();
  }, [
    project,
    currentTool,
    selectedEntityId,
    hoveredEraseTarget,
    viewport,
    drawPoints,
    mouseWorld,
    activeSnap,
    gridSize,
    gridSnapEnabled,
    circleRadiusInput,
    worldToScreen,
    formatLength
  ]);

  // Helper: Draw Survey Symbols on Canvas
  const renderSymbolOnCanvas = (
    ctx: CanvasRenderingContext2D,
    type: SymbolType,
    x: number,
    y: number,
    size: number,
    label?: string
  ) => {
    ctx.save();
    ctx.translate(x, y);

    if (type === "BOUNDARY_STONE") {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.beginPath();
      ctx.moveTo(-size / 2, -size / 2);
      ctx.lineTo(size / 2, size / 2);
      ctx.moveTo(size / 2, -size / 2);
      ctx.lineTo(-size / 2, size / 2);
      ctx.stroke();
    } else if (type === "WELL") {
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(14, 165, 233, 0.2)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === "BENCH_MARK") {
      ctx.strokeStyle = "#eab308";
      ctx.fillStyle = "#eab308";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.7, size * 0.7);
      ctx.lineTo(size * 0.7, size * 0.7);
      ctx.closePath();
      ctx.stroke();
      ctx.fillText("BM", -size * 0.5, -size * 1.2);
    } else if (type === "TREE") {
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (label) {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 9px monospace";
      ctx.fillText(label, size * 0.8, 4);
    }

    ctx.restore();
  };

  // Helper: Top Right North Compass Rose
  const renderNorthCompass = (ctx: CanvasRenderingContext2D, x: number, y: number, angleDeg: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angleDeg * Math.PI) / 180);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", 0, -26);

    ctx.restore();
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPt: Point2D = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPt = screenToWorld(screenPt, canvas.clientWidth, canvas.clientHeight);
    const snap = findSnapPoint(worldPt);
    const targetPt = snap || worldPt;

    // Pan via Middle click or Pan tool
    if (e.button === 1 || currentTool === "PAN" || e.spaceKey) {
      setIsPanning(true);
      setPanStart(screenPt);
      return;
    }

    if (e.button !== 0) return; // Left click only for actions

    // 0. ERASE TOOL
    if (currentTool === "ERASE") {
      const hit = findItemUnderCursor(targetPt);
      if (hit) {
        if (hit.type === "POINT") {
          onDeletePoint(hit.id);
        } else {
          onDeleteEntity(hit.id);
        }
        setHoveredEraseTarget(null);
      }
      return;
    }

    // 1. LINE TOOL
    if (currentTool === "LINE") {
      if (drawPoints.length === 0) {
        setDrawPoints([targetPt]);
      } else {
        const start = drawPoints[0];
        const end = targetPt;
        if (distance2D(start, end) > 0.01) {
          onAddEntity({
            id: `line_${Date.now()}`,
            type: "LINE",
            start,
            end,
            layer: activeLayer,
            color: "#38bdf8",
            lineWidth: 2
          });
        }
        setDrawPoints([]);
      }
    }
    // 2. POLYLINE & PARCEL TOOL
    else if (currentTool === "POLYLINE" || currentTool === "PARCEL_SUBDIVIDE") {
      setDrawPoints((prev) => [...prev, targetPt]);
    }
    // 3. TRIANGLE DRAWING TOOL (3-Point Triangle Plot)
    else if (currentTool === "TRIANGLE") {
      if (drawPoints.length < 2) {
        setDrawPoints((prev) => [...prev, targetPt]);
      } else if (drawPoints.length === 2) {
        const p1 = drawPoints[0];
        const p2 = drawPoints[1];
        const p3 = targetPt;

        const sideA = distance2D(p1, p2);
        const sideB = distance2D(p2, p3);
        const sideC = distance2D(p3, p1);
        const areaSqM = heronTriangleArea(sideA, sideB, sideC);
        const areaCents = areaSqM * SQM_TO_CENTS;

        const triangleCount = project.entities.filter((e) => e.type === "TRIANGLE").length + 1;
        const triangleId = `T${triangleCount}`;

        // Add Triangle Entity
        const triangleEntity: SurveyTriangleEntity = {
          id: `triangle_${Date.now()}`,
          type: "TRIANGLE",
          p1,
          p2,
          p3,
          sideA: Number(sideA.toFixed(3)),
          sideB: Number(sideB.toFixed(3)),
          sideC: Number(sideC.toFixed(3)),
          areaSqM: Number(areaSqM.toFixed(3)),
          areaCents: Number(areaCents.toFixed(3)),
          triangleId,
          layer: "SURVEY_TRIANGULATION",
          color: "#06b6d4",
          lineWidth: 2
        };
        onAddEntity(triangleEntity);

        // Also add as Polygon Parcel for automated area schedule
        const parcelEntity: SurveyParcelEntity = {
          id: `parcel_tri_${Date.now()}`,
          type: "POLYGON_PARCEL",
          name: `Triangle Plot ${triangleId}`,
          points: [p1, p2, p3],
          areaSqM: Number(areaSqM.toFixed(3)),
          areaCents: Number(areaCents.toFixed(3)),
          areaAres: Number((areaSqM * SQM_TO_ARES).toFixed(3)),
          areaSqFt: Number((areaSqM * SQM_TO_SQFT).toFixed(2)),
          areaAcres: Number((areaSqM * SQM_TO_ACRES).toFixed(4)),
          color: "#06b6d4",
          fillColor: "rgba(6, 182, 212, 0.08)",
          layer: "SURVEY_BOUNDARY",
          lineWidth: 2
        };
        onAddEntity(parcelEntity);

        setDrawPoints([]);
      }
    }
    // 4. CIRCLE TOOL
    else if (currentTool === "CIRCLE") {
      if (drawPoints.length === 0) {
        // If exact radius input provided in toolbar, immediately create circle
        if (circleRadiusInput && circleRadiusInput > 0) {
          const radiusM = project.unit === "cm" ? circleRadiusInput / 100 : circleRadiusInput;
          const areaSqM = Math.PI * radiusM * radiusM;
          const areaCents = areaSqM * SQM_TO_CENTS;
          const circleEntity: SurveyCircleEntity = {
            id: `circle_${Date.now()}`,
            type: "CIRCLE",
            center: targetPt,
            radius: Number(radiusM.toFixed(3)),
            radiusUnit: project.unit,
            areaSqM: Number(areaSqM.toFixed(3)),
            areaCents: Number(areaCents.toFixed(3)),
            circumferenceM: Number((2 * Math.PI * radiusM).toFixed(3)),
            layer: "SURVEY_BOUNDARY",
            color: "#c084fc",
            lineWidth: 2
          };
          onAddEntity(circleEntity);
          setDrawPoints([]);
        } else {
          setDrawPoints([targetPt]);
        }
      } else {
        const center = drawPoints[0];
        const radiusM = distance2D(center, targetPt);
        if (radiusM > 0.01) {
          const areaSqM = Math.PI * radiusM * radiusM;
          const areaCents = areaSqM * SQM_TO_CENTS;
          const circleEntity: SurveyCircleEntity = {
            id: `circle_${Date.now()}`,
            type: "CIRCLE",
            center,
            radius: Number(radiusM.toFixed(3)),
            radiusUnit: project.unit,
            areaSqM: Number(areaSqM.toFixed(3)),
            areaCents: Number(areaCents.toFixed(3)),
            circumferenceM: Number((2 * Math.PI * radiusM).toFixed(3)),
            layer: "SURVEY_BOUNDARY",
            color: "#c084fc",
            lineWidth: 2
          };
          onAddEntity(circleEntity);
        }
        setDrawPoints([]);
      }
    }
    // 5. RECTANGLE TOOL
    else if (currentTool === "RECTANGLE") {
      if (drawPoints.length === 0) {
        setDrawPoints([targetPt]);
      } else {
        const c1 = drawPoints[0];
        const c2 = targetPt;
        const w = Math.abs(c2.x - c1.x);
        const h = Math.abs(c2.y - c1.y);
        onAddEntity({
          id: `rect_${Date.now()}`,
          type: "RECTANGLE",
          corner1: c1,
          corner2: c2,
          areaSqM: Number((w * h).toFixed(2)),
          layer: activeLayer,
          color: "#f59e0b",
          lineWidth: 2
        });
        setDrawPoints([]);
      }
    }
    // 6. SPOT LEVEL TOOL
    else if (currentTool === "SPOT_LEVEL") {
      const zStr = prompt("Enter Spot Elevation (Z in meters MSL):", "12.50");
      if (zStr !== null) {
        const z = parseFloat(zStr) || 0;
        const pName = `ST-${project.points.length + 1}`;
        onAddPoint({
          id: `pt_${Date.now()}`,
          name: pName,
          x: Number(targetPt.x.toFixed(3)),
          y: Number(targetPt.y.toFixed(3)),
          z: Number(z.toFixed(3)),
          code: "SPOT_LEVEL",
          layer: "SURVEY_POINTS"
        });
      }
    }
    // 7. SYMBOL TOOL
    else if (currentTool === "SYMBOL") {
      onAddEntity({
        id: `sym_${Date.now()}`,
        type: "SYMBOL",
        symbolType: activeSymbol,
        position: targetPt,
        scale: 1.5,
        rotation: 0,
        layer: "SURVEY_SYMBOLS"
      });
    }
    // 8. SELECT TOOL
    else if (currentTool === "SELECT") {
      // Find clicked vertex or entity
      let foundId: string | null = null;
      for (const ent of project.entities) {
        if (ent.type === "POLYGON_PARCEL" || ent.type === "POLYLINE") {
          for (let i = 0; i < ent.points.length; i++) {
            if (distance2D(targetPt, ent.points[i]) < 18 / viewport.zoom) {
              setDraggingVertex({ entityId: ent.id, pointIndex: i });
              onSelectEntity(ent.id);
              return;
            }
          }
        }
      }

      const item = findItemUnderCursor(targetPt);
      if (item && item.type === "ENTITY") {
        foundId = item.id;
      }
      onSelectEntity(foundId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPt: Point2D = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (isPanning) {
      const dx = (screenPt.x - panStart.x) / viewport.zoom;
      const dy = (screenPt.y - panStart.y) / viewport.zoom;
      onUpdateViewport({
        ...viewport,
        panX: viewport.panX - dx,
        panY: viewport.panY + dy
      });
      setPanStart(screenPt);
      return;
    }

    const worldPt = screenToWorld(screenPt, canvas.clientWidth, canvas.clientHeight);
    setMouseWorld(worldPt);

    const snap = findSnapPoint(worldPt);
    setActiveSnap(snap);

    const activePt = snap || worldPt;

    // Erase mode hover detection
    if (currentTool === "ERASE") {
      const item = findItemUnderCursor(activePt);
      setHoveredEraseTarget(item);
    } else if (hoveredEraseTarget) {
      setHoveredEraseTarget(null);
    }

    // Handle vertex drag
    if (draggingVertex) {
      const ent = project.entities.find((e) => e.id === draggingVertex.entityId);
      if (ent && (ent.type === "POLYLINE" || ent.type === "POLYGON_PARCEL")) {
        const newPts = [...ent.points];
        newPts[draggingVertex.pointIndex] = activePt;
        const newArea = calculatePolygonAreaSqM(newPts);
        onUpdateEntity({
          ...ent,
          points: newPts,
          areaSqM: Number(newArea.toFixed(2)),
          areaCents: Number((newArea * SQM_TO_CENTS).toFixed(3))
        });
      }
    }

    // Report Cursor coordinates
    let bearing: number | undefined;
    let dist: number | undefined;
    if (drawPoints.length > 0) {
      const last = drawPoints[drawPoints.length - 1];
      dist = distance2D(last, activePt);
      bearing = calculateBearing(last, activePt);
    }

    onCursorChange({
      x: Number(activePt.x.toFixed(3)),
      y: Number(activePt.y.toFixed(3)),
      bearing,
      dist
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingVertex(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenPt: Point2D = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 2), 500);

    const worldBefore = screenToWorld(screenPt, canvas.clientWidth, canvas.clientHeight);
    const newPanX = worldBefore.x - (screenPt.x - canvas.clientWidth / 2) / newZoom;
    const newPanY = worldBefore.y + (screenPt.y - canvas.clientHeight / 2) / newZoom;

    onUpdateViewport({
      panX: newPanX,
      panY: newPanY,
      zoom: newZoom
    });
  };

  const handleDoubleClick = () => {
    if ((currentTool === "POLYLINE" || currentTool === "PARCEL_SUBDIVIDE") && drawPoints.length >= 3) {
      const areaSqM = calculatePolygonAreaSqM(drawPoints);
      onAddEntity({
        id: `parcel_${Date.now()}`,
        type: "POLYGON_PARCEL",
        name: `Parcel ${project.entities.filter((e) => e.type === "POLYGON_PARCEL").length + 1}`,
        points: [...drawPoints],
        areaSqM: Number(areaSqM.toFixed(2)),
        areaCents: Number((areaSqM * SQM_TO_CENTS).toFixed(3)),
        areaAres: Number((areaSqM / 100).toFixed(3)),
        areaSqFt: Number((areaSqM * 10.7639).toFixed(2)),
        areaAcres: Number((areaSqM / 4046.86).toFixed(4)),
        color: "#38bdf8",
        fillColor: "rgba(56, 189, 248, 0.08)",
        layer: activeLayer,
        lineWidth: 2.5
      });
      setDrawPoints([]);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[580px] bg-slate-950 overflow-hidden select-none ${
        currentTool === "ERASE" ? "cursor-not-allowed" : "cursor-crosshair"
      }`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full block"
      />

      {/* Floating In-Canvas HUD for in-progress drawing */}
      {drawPoints.length > 0 && (
        <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-2 text-xs font-mono shadow-xl flex items-center gap-3">
          <span className="text-cyan-400 font-bold">
            {currentTool === "TRIANGLE"
              ? `Triangle: Vertex ${drawPoints.length + 1} of 3 (Click on canvas)`
              : currentTool === "CIRCLE"
              ? "Circle: Click center & drag radius or click 2nd point"
              : `Vertices: ${drawPoints.length} | Double-Click to Finish Polygon`}
          </span>
          <button
            onClick={() => setDrawPoints([])}
            className="px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 rounded border border-red-500/40 text-[11px] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Erase Tool Floating Status Pill */}
      {currentTool === "ERASE" && (
        <div className="absolute top-3 right-20 bg-red-950/90 backdrop-blur-md border border-red-500/50 rounded-xl px-3 py-1.5 text-xs font-mono text-red-300 shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span className="font-bold">Erase Tool Active: Click any line, point, or shape to delete</span>
        </div>
      )}
    </div>
  );
};
