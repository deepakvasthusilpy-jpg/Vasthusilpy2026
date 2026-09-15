import React, { useState, useEffect, useRef } from "react";
import {
  BuildingPlanProject,
  PlanSheet,
  PlanAttachment,
  PlanSymbolItem,
  NorthSignConfig
} from "../../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "../../data/vasthusilpyLogo";
import { buildPlanVerificationUrl, generatePlanQrCodeDataUrl } from "../../utils/qrCodeGenerator";
import { PlanSymbolSvg } from "./symbols/PlanSymbolSvg";
import {
  Compass,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Phone,
  MessageSquare,
  QrCode,
  Layers,
  Check,
  Maximize2,
  Trash2,
  Lock,
  Unlock,
  Sliders,
  Sparkles,
  ArrowRightLeft,
  ArrowUpDown,
  ExternalLink,
  Plus,
  Minus
} from "lucide-react";

interface PlanSheetCanvasProps {
  project: BuildingPlanProject;
  sheet: PlanSheet;
  sheetIndex: number;
  totalSheets: number;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
  onUpdateSheet?: (updated: PlanSheet) => void;
  onUpdateProject?: (updated: BuildingPlanProject) => void;
  selectedAttachmentId?: string | null;
  onSelectAttachment?: (id: string | null) => void;
  selectedSymbolId?: string | null;
  onSelectSymbol?: (id: string | null) => void;
  selectedTarget?: { type: "symbol" | "attachment" | "north" | "title_block"; id?: string } | null;
  onSelectTarget?: (target: { type: "symbol" | "attachment" | "north" | "title_block"; id?: string } | null) => void;
  onOpenQrModal?: () => void;
  onDownloadPdf?: () => void;
}

type DraggingTarget =
  | { type: "attachment"; id: string }
  | { type: "symbol"; id: string }
  | { type: "north" }
  | null;

export const PlanSheetCanvas: React.FC<PlanSheetCanvasProps> = ({
  project,
  sheet,
  sheetIndex,
  totalSheets,
  canvasRef,
  isExporting = false,
  onUpdateSheet,
  onUpdateProject,
  selectedAttachmentId,
  onSelectAttachment,
  selectedSymbolId,
  onSelectSymbol,
  selectedTarget,
  onSelectTarget,
  onOpenQrModal,
  onDownloadPdf
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [draggingTarget, setDraggingTarget] = useState<DraggingTarget>(null);
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const [isDraggingTitleResize, setIsDraggingTitleResize] = useState<boolean>(false);
  const titleResizeStartRef = useRef<{
    mouseX: number;
    startWidthMm: number;
    totalPxWidth: number;
  } | null>(null);

  const drawingAreaRef = useRef<HTMLDivElement | null>(null);

  const isRightStrip = project.titleBlockPosition === "right";

  // Global Mouse Listener for fluid Title Block width dragging
  useEffect(() => {
    if (!isDraggingTitleResize) return;
    const onMove = (e: MouseEvent) => {
      if (!titleResizeStartRef.current || !onUpdateProject) return;
      // Dragging left increases title block width; dragging right decreases it
      const deltaPx = titleResizeStartRef.current.mouseX - e.clientX;
      const deltaMm = (deltaPx / titleResizeStartRef.current.totalPxWidth) * 272;
      const newWidth = Math.max(48, Math.min(125, Math.round(titleResizeStartRef.current.startWidthMm + deltaMm)));
      if (newWidth !== (project.stripWidthMm || 70)) {
        onUpdateProject({ ...project, stripWidthMm: newWidth });
      }
    };
    const onUp = () => {
      setIsDraggingTitleResize(false);
      titleResizeStartRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingTitleResize, onUpdateProject, project]);

  // North Sign Config
  const northConfig: NorthSignConfig = sheet.northSign || {
    x: 88,
    y: 5,
    scale: 1,
    rotation: typeof sheet.northRotation === "number" ? sheet.northRotation : project.defaultNorthRotation || 0,
    style: "standard"
  };

  const northAngle = typeof sheet.northRotation === "number" ? sheet.northRotation : (northConfig.rotation || 0);

  // Engineer Contact Information
  const engineerPhone = project.engineerCallNumber || ENGINEER_CONTACT_DETAILS.phoneCall;
  const engineerWhatsapp = (project.engineerWhatsappNumber || ENGINEER_CONTACT_DETAILS.whatsappNumber).replace(/[^0-9]/g, "");
  const officeName = project.officeName || ENGINEER_CONTACT_DETAILS.officeName;
  const logoUrl = project.logoUrl || VASTHUSILPY_LOGO_DATA_URL;

  // Standard Sheet Margins
  const margins = sheet.marginConfig || project.marginConfig || {
    leftMm: 15,
    rightMm: 10,
    topMm: 10,
    bottomMm: 10,
    presetName: "standard_kerala"
  };

  // Convert mm to % of A4 Landscape (297mm width x 210mm height)
  const marginLeftPct = (margins.leftMm / 297) * 100;
  const marginRightPct = (margins.rightMm / 297) * 100;
  const marginTopPct = (margins.topMm / 210) * 100;
  const marginBottomPct = (margins.bottomMm / 210) * 100;

  // Compute Area Table Totals (Proposed & Existing with Built-up & Floor Area)
  const totalProposedBuiltUpSqM = project.areaTable.reduce(
    (acc, r) => acc + (r.proposedBuiltUpSqM ?? r.builtUpSqM ?? r.proposedSqM ?? 0),
    0
  );
  const totalProposedFloorSqM = project.areaTable.reduce(
    (acc, r) => acc + (r.proposedFloorAreaSqM ?? r.floorAreaSqM ?? 0),
    0
  );
  const totalExistingBuiltUpSqM = project.areaTable.reduce(
    (acc, r) => acc + (r.existingBuiltUpSqM ?? r.existingSqM ?? 0),
    0
  );
  const totalExistingFloorSqM = project.areaTable.reduce(
    (acc, r) => acc + (r.existingFloorAreaSqM ?? 0),
    0
  );
  const totalBuiltUpSqM = totalProposedBuiltUpSqM + totalExistingBuiltUpSqM;
  const totalBuiltUpSqFt = totalBuiltUpSqM * 10.7639;
  const totalFloorAreaSqM = totalProposedFloorSqM + totalExistingFloorSqM;

  const pageNum = sheetIndex + 1;

  // Verification URL for QR code & Direct Scan
  const verificationUrl = buildPlanVerificationUrl({
    projectId: project.id,
    sheetId: sheet.id,
    drawingNumber: sheet.drawingNumber || `DWG-${pageNum}`,
    drawingName: sheet.drawingName || "Architectural Floor Plan",
    clientName: project.clientName || "Client",
    engineerCall: engineerPhone,
    engineerWhatsapp: engineerWhatsapp
  });

  // Generate dynamic QR code for this specific sheet
  useEffect(() => {
    let isMounted = true;
    generatePlanQrCodeDataUrl(verificationUrl).then((dataUrl) => {
      if (isMounted) setQrCodeDataUrl(dataUrl);
    });

    return () => {
      isMounted = false;
    };
  }, [project.id, sheet.id, sheet.drawingNumber, sheet.drawingName, project.clientName, engineerPhone, engineerWhatsapp, pageNum, verificationUrl]);

  // Click handler for QR code: Open direct PDF verification portal in a NEW WINDOW with zero login required!
  const handleQrCodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      window.open(verificationUrl, "_blank", "noopener,noreferrer");
    } catch {
      // fallback
    }
    if (onOpenQrModal) {
      onOpenQrModal();
    }
  };

  // Handle North Arrow Rotation toggle (+45° on click)
  const handleRotateNorth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateSheet) return;
    const nextAngle = (northAngle + 45) % 360;
    onUpdateSheet({
      ...sheet,
      northRotation: nextAngle,
      northSign: {
        ...northConfig,
        rotation: nextAngle
      }
    });
  };

  // Get active attachments list
  const attachments: PlanAttachment[] = sheet.attachments && sheet.attachments.length > 0
    ? sheet.attachments
    : sheet.planImageUrl
    ? [
        {
          id: `att-legacy-${sheet.id}`,
          title: sheet.floorName || sheet.drawingName || "Ground Floor Plan",
          imageUrl: sheet.planImageUrl,
          fileName: sheet.planFileName || "plan.svg",
          x: 4,
          y: 6,
          width: 92,
          scale: sheet.scale || "1 : 100",
          zoom: sheet.zoom || 100,
          rotation: sheet.rotation || 0,
          zIndex: 1
        }
      ]
    : [];

  const symbols: PlanSymbolItem[] = sheet.symbols || [];

  // Dragging Attachment MouseDown
  const handleAttachmentMouseDown = (e: React.MouseEvent, att: PlanAttachment) => {
    if (isExporting || att.locked) return;
    e.stopPropagation();
    if (onSelectAttachment) onSelectAttachment(att.id);
    if (onSelectSymbol) onSelectSymbol(null);
    if (onSelectTarget) onSelectTarget({ type: "attachment", id: att.id });

    setDraggingTarget({ type: "attachment", id: att.id });
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: att.x,
      startY: att.y
    });
  };

  // Dragging Symbol MouseDown
  const handleSymbolMouseDown = (e: React.MouseEvent, sym: PlanSymbolItem) => {
    if (isExporting) return;
    e.stopPropagation();
    if (onSelectSymbol) onSelectSymbol(sym.id);
    if (onSelectAttachment) onSelectAttachment(null);
    if (onSelectTarget) onSelectTarget({ type: "symbol", id: sym.id });

    setDraggingTarget({ type: "symbol", id: sym.id });
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: sym.x,
      startY: sym.y
    });
  };

  // Dragging North Sign MouseDown
  const handleNorthMouseDown = (e: React.MouseEvent) => {
    if (isExporting || northConfig.locked) return;
    e.stopPropagation();
    if (onSelectAttachment) onSelectAttachment(null);
    if (onSelectSymbol) onSelectSymbol(null);
    if (onSelectTarget) onSelectTarget({ type: "north" });

    setDraggingTarget({ type: "north" });
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: northConfig.x,
      startY: northConfig.y
    });
  };

  // Mouse Move Drag Listener
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingTarget || !dragStart || !drawingAreaRef.current || !onUpdateSheet) return;
    const rect = drawingAreaRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(95, Math.round((dragStart.startX + deltaX) * 10) / 10));
    const newY = Math.max(0, Math.min(95, Math.round((dragStart.startY + deltaY) * 10) / 10));

    if (draggingTarget.type === "attachment") {
      const updatedAttachments = attachments.map((a) =>
        a.id === draggingTarget.id ? { ...a, x: newX, y: newY } : a
      );
      onUpdateSheet({ ...sheet, attachments: updatedAttachments });
    } else if (draggingTarget.type === "symbol") {
      const updatedSymbols = symbols.map((s) =>
        s.id === draggingTarget.id ? { ...s, x: newX, y: newY } : s
      );
      onUpdateSheet({ ...sheet, symbols: updatedSymbols });
    } else if (draggingTarget.type === "north") {
      onUpdateSheet({
        ...sheet,
        northSign: {
          ...northConfig,
          x: newX,
          y: newY
        }
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingTarget(null);
    setDragStart(null);
  };

  // Quick Symbol Modifiers
  const handleRotateSymbol = (symId: string, delta: number) => {
    if (!onUpdateSheet) return;
    const updated = symbols.map((s) => {
      if (s.id === symId) {
        return { ...s, rotation: ((s.rotation || 0) + delta + 360) % 360 };
      }
      return s;
    });
    onUpdateSheet({ ...sheet, symbols: updated });
  };

  const handleFlipSymbolH = (symId: string) => {
    if (!onUpdateSheet) return;
    const updated = symbols.map((s) => {
      if (s.id === symId) {
        return { ...s, flipH: !s.flipH };
      }
      return s;
    });
    onUpdateSheet({ ...sheet, symbols: updated });
  };

  const handleFlipSymbolV = (symId: string) => {
    if (!onUpdateSheet) return;
    const updated = symbols.map((s) => {
      if (s.id === symId) {
        return { ...s, flipV: !s.flipV };
      }
      return s;
    });
    onUpdateSheet({ ...sheet, symbols: updated });
  };

  const handleScaleSymbol = (symId: string, factor: number) => {
    if (!onUpdateSheet) return;
    const updated = symbols.map((s) => {
      if (s.id === symId) {
        const curScale = s.scale || 1.0;
        const next = Math.max(0.4, Math.min(3.0, Math.round((curScale + factor) * 10) / 10));
        return { ...s, scale: next };
      }
      return s;
    });
    onUpdateSheet({ ...sheet, symbols: updated });
  };

  const handleDeleteSymbol = (symId: string) => {
    if (!onUpdateSheet) return;
    const updated = symbols.filter((s) => s.id !== symId);
    onUpdateSheet({ ...sheet, symbols: updated });
    if (onSelectSymbol) onSelectSymbol(null);
  };

  // Render North Sign Graphic SVG
  const renderNorthGraphic = (style: string = "standard") => {
    switch (style) {
      case "vasthu_ashtadik":
        return (
          <svg viewBox="0 0 50 50" className="w-full h-full">
            <circle cx="25" cy="25" r="22" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
            <polygon points="25,5 30,25 25,22 20,25" fill="#dc2626" />
            <polygon points="25,45 30,25 25,28 20,25" fill="#94a3b8" />
            <polygon points="45,25 25,30 28,25 25,20" fill="#cbd5e1" />
            <polygon points="5,25 25,30 22,25 25,20" fill="#cbd5e1" />
            <circle cx="25" cy="25" r="3" fill="#0f172a" />
            <text x="25" y="4" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#dc2626">N</text>
          </svg>
        );
      case "minimal":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <line x1="20" y1="36" x2="20" y2="8" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
            <polygon points="20,4 25,14 15,14" fill="#dc2626" />
            <text x="20" y="3" textAnchor="middle" fontSize="6.5" fontWeight="black" fill="#dc2626">N</text>
          </svg>
        );
      case "circle_compass":
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#94a3b8" strokeWidth="0.8" strokeDasharray="1,2" />
            <polygon points="20,6 23,20 20,18" fill="#dc2626" />
            <polygon points="20,6 17,20 20,18" fill="#0f172a" />
            <polygon points="20,34 23,20 20,22" fill="#94a3b8" />
            <polygon points="20,34 17,20 20,22" fill="#cbd5e1" />
            <circle cx="20" cy="20" r="2" fill="#0f172a" />
            <text x="20" y="5" textAnchor="middle" fontSize="6.5" fontWeight="black" fill="#dc2626">N</text>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <circle cx="20" cy="20" r="17" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="2" fill="#0f172a" />
            <polygon points="20,5 24,20 20,18" fill="#dc2626" />
            <polygon points="20,5 16,20 20,18" fill="#0f172a" />
            <polygon points="20,35 24,20 20,22" fill="#94a3b8" />
            <polygon points="20,35 16,20 20,22" fill="#cbd5e1" />
            <text x="20" y="4" textAnchor="middle" fontSize="6.5" fontWeight="black" fill="#dc2626">N</text>
          </svg>
        );
    }
  };

  // Shared Architectural Drawing Area
  const renderDrawingCanvas = () => (
    <div
      ref={drawingAreaRef}
      className="relative flex-1 w-full h-full bg-white overflow-hidden"
      onClick={() => {
        if (onSelectAttachment) onSelectAttachment(null);
        if (onSelectSymbol) onSelectSymbol(null);
      }}
    >
      {/* 1. Architectural Plan Attachments */}
      {attachments.length > 0 ? (
        attachments.map((att) => {
          const isSelected = selectedAttachmentId === att.id;
          const attWidth = att.width || 90;
          const zoomPercent = att.zoom || 100;
          const rotationDeg = att.rotation || 0;

          return (
            <div
              key={att.id}
              onMouseDown={(e) => handleAttachmentMouseDown(e, att)}
              className={`absolute transition-shadow duration-150 select-none ${
                isSelected && !isExporting
                  ? "ring-2 ring-blue-600 ring-offset-2 z-30 cursor-move"
                  : att.locked
                  ? "cursor-default"
                  : "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-slate-400"
              }`}
              style={{
                left: `${att.x}%`,
                top: `${att.y}%`,
                width: `${attWidth}%`,
                zIndex: att.zIndex || 1,
                transform: `scale(${zoomPercent / 100}) rotate(${rotationDeg}deg)`,
                transformOrigin: "center center"
              }}
            >
              <div className="relative group/att bg-white">
                <img
                  src={att.imageUrl}
                  alt={att.title}
                  draggable={false}
                  className="w-full h-auto object-contain block pointer-events-none"
                />
              </div>

              {/* Caption */}
              <div className="mt-0.5 px-1.5 py-0.5 bg-white/95 border border-slate-700/60 rounded-xs shadow-2xs flex items-center justify-between text-[7.5px] leading-tight">
                <span className="font-bold font-mono text-slate-900 truncate uppercase">
                  {att.title}
                </span>
                <span className="font-mono text-slate-600 font-semibold ml-1">
                  SCALE {att.scale}
                </span>
              </div>
            </div>
          );
        })
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Layers className="w-8 h-8" />
          </div>
          <p className="font-bold text-slate-700 text-sm mb-1">No Architectural Plans on this Sheet</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Use the "Multi-Plan Arranger" or upload buttons to add Floor Plans, Elevations, Sections, or Site Plans.
          </p>
        </div>
      )}

      {/* 2. 2D Doors & Furniture Symbols */}
      {symbols.map((sym) => {
        const isSelected = selectedSymbolId === sym.id;
        const symScale = sym.scale || 1.0;
        const symWidth = (sym.width || 12) * symScale;
        const symHeight = (sym.height || 12) * symScale;
        const symRotation = sym.rotation || 0;

        return (
          <div
            key={sym.id}
            onMouseDown={(e) => handleSymbolMouseDown(e, sym)}
            className={`absolute select-none group/sym transition-shadow ${
              isSelected && !isExporting
                ? "ring-2 ring-emerald-500 ring-offset-2 z-40 cursor-move"
                : "cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-emerald-400 z-20"
            }`}
            style={{
              left: `${sym.x}%`,
              top: `${sym.y}%`,
              width: `${symWidth}%`,
              height: `${symHeight}%`,
              transform: `rotate(${symRotation}deg)`,
              transformOrigin: "center center"
            }}
          >
            {/* SVG Symbol graphic */}
            <div className="w-full h-full">
              <PlanSymbolSvg symbol={sym} className="w-full h-full" />
            </div>

            {/* Label if set */}
            {sym.label && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white/95 px-1 py-0.2 rounded border border-slate-400 text-[6px] font-mono font-bold text-slate-900 pointer-events-none whitespace-nowrap shadow-2xs">
                {sym.label}
              </div>
            )}

            {/* Floating Interaction Toolbar for Selected Symbol */}
            {isSelected && !isExporting && (
              <div
                className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950 text-white rounded-lg shadow-xl px-1.5 py-1 flex items-center gap-1 text-[7px] z-50 whitespace-nowrap"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => handleRotateSymbol(sym.id, 45)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
                  title="Rotate +45°"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFlipSymbolH(sym.id)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
                  title="Flip Swing Direction (Horizontal)"
                >
                  <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFlipSymbolV(sym.id)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
                  title="Flip Swing Inward/Outward (Vertical)"
                >
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleSymbol(sym.id, 0.1)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
                  title="Increase Size"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScaleSymbol(sym.id, -0.1)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-200 hover:text-white"
                  title="Decrease Size"
                >
                  <Minus className="w-3 h-3 text-amber-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSymbol(sym.id)}
                  className="p-1 hover:bg-red-900/60 rounded text-red-400 hover:text-red-300"
                  title="Delete Symbol"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 3. ROTATABLE, RESIZABLE, DRAGGABLE ARCHITECTURAL NORTH SIGN */}
      <div
        onMouseDown={handleNorthMouseDown}
        onClick={handleRotateNorth}
        className={`absolute bg-white/95 backdrop-blur-xs p-1 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center select-none z-30 transition-shadow ${
          !isExporting ? "cursor-move hover:border-red-400 hover:bg-red-50/50 hover:shadow-md" : ""
        }`}
        style={{
          left: `${northConfig.x}%`,
          top: `${northConfig.y}%`,
          transform: `scale(${northConfig.scale || 1.0}) rotate(${northAngle}deg)`,
          transformOrigin: "center center",
          width: "36px",
          height: "36px"
        }}
        title="North Sign: Drag to reposition, click to rotate +45°"
      >
        <div className="w-full h-full flex items-center justify-center">
          {renderNorthGraphic(northConfig.style)}
        </div>
        <div
          className="text-[6px] font-mono font-bold tracking-wider text-slate-700 pointer-events-none mt-0.5"
          style={{ transform: `rotate(-${northAngle}deg)` }}
        >
          {northAngle}°
        </div>
      </div>

      {/* 4. Bottom-Left: Sheet Title & Graphic Bar Scale */}
      <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs border border-slate-900/80 px-2.5 py-1.5 rounded shadow-xs flex items-center gap-3 z-20 pointer-events-none">
        <div>
          <div className="text-[9.5px] font-black uppercase tracking-wider text-slate-900 leading-tight">
            {sheet.drawingName || "ARCHITECTURAL FLOOR PLAN"}
          </div>
          <div className="text-[7.5px] font-mono text-slate-600 flex items-center gap-2">
            <span>
              SCALE: <strong className="text-slate-900">{sheet.scale || project.defaultScale || "1 : 100"}</strong>
            </span>
            <span>•</span>
            <span>
              REV: <strong className="text-blue-700">{sheet.revision || "R0"}</strong>
            </span>
          </div>
        </div>

        {/* Graphic Bar Scale */}
        <div className="border-l border-slate-300 pl-2.5 flex flex-col items-center">
          <div className="flex text-[5.5px] font-mono text-slate-600 w-20 justify-between leading-none mb-0.5">
            <span>0m</span>
            <span>1m</span>
            <span>2m</span>
            <span>5m</span>
          </div>
          <div className="w-20 h-1.5 border border-slate-900 flex">
            <div className="w-1/4 bg-slate-900 h-full"></div>
            <div className="w-1/4 bg-white h-full"></div>
            <div className="w-1/4 bg-slate-900 h-full"></div>
            <div className="w-1/4 bg-white h-full"></div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-full flex justify-center items-center overflow-auto p-2 sm:p-4 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 
        A4 Landscape Sheet: 297mm x 210mm Aspect Ratio (1.414 : 1)
      */}
      <div
        ref={canvasRef}
        id={`plan-sheet-canvas-${sheet.id}`}
        className="relative bg-white text-slate-900 shadow-2xl select-none print:shadow-none print:m-0 transition-all"
        style={{
          width: "100%",
          maxWidth: isExporting ? "1122px" : "100%",
          aspectRatio: "297 / 210",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Inter', Roboto, sans-serif"
        }}
      >
        {/* Outer Paper Trim Boundary & Registration Corner Marks */}
        <div className="absolute inset-0 border border-slate-300 pointer-events-none" />
        <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-slate-500 pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-slate-500 pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-slate-500 pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-slate-500 pointer-events-none" />

        {/* Standard Sheet Margin Outline */}
        <div
          className="absolute border-[2.2px] border-slate-950 shadow-[0_0_0_1px_rgba(15,23,42,0.6)] flex flex-col justify-between overflow-hidden bg-white"
          style={{
            top: `${marginTopPct}%`,
            left: `${marginLeftPct}%`,
            right: `${marginRightPct}%`,
            bottom: `${marginBottomPct}%`
          }}
        >
          {/* Main Layout Engine: Switch between Right Strip and Bottom Strip */}
          {isRightStrip ? (
            /* ============================================================ */
            /* 1. RIGHT STRIP MODE (Vertical Title Block Resizable by Drag) */
            /* ============================================================ */
            <div className="w-full h-full flex">
              {/* Left: Drawing Area */}
              {renderDrawingCanvas()}

              {/* Draggable Title Block Resizer Bar */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingTitleResize(true);
                  const canvasBox = canvasRef?.current?.getBoundingClientRect();
                  titleResizeStartRef.current = {
                    mouseX: e.clientX,
                    startWidthMm: project.stripWidthMm || 70,
                    totalPxWidth: canvasBox ? canvasBox.width : 1000
                  };
                }}
                className="relative w-2 hover:w-2.5 bg-slate-950 hover:bg-cyan-500 cursor-col-resize group select-none transition-all flex items-center justify-center z-30 flex-shrink-0"
                title={`Drag left/right to adjust Title Block width (Current: ${project.stripWidthMm || 70}mm)`}
              >
                <div className="w-0.5 h-10 rounded-full bg-slate-400 group-hover:bg-white transition-colors" />
                <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-cyan-300 border border-cyan-500/40 text-[7px] font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none z-50">
                  {project.stripWidthMm || 70}mm (Drag)
                </div>
              </div>

              {/* Right: Vertical Resizable Title Block Strip */}
              <div
                className={`h-full bg-white flex flex-col justify-between overflow-hidden cursor-pointer ${
                  selectedTarget?.type === "title_block" ? "ring-2 ring-cyan-500 ring-inset" : ""
                }`}
                style={{
                  width: `${Math.max(16, Math.min(48, ((project.stripWidthMm || 70) / Math.max(150, 297 - margins.leftMm - margins.rightMm)) * 100))}%`,
                  minWidth: "150px"
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectTarget) onSelectTarget({ type: "title_block" });
                }}
              >
                {/* 1. Official Vasthusilpy Branding & Address */}
                <div className="p-2 border-b-[1.5px] border-slate-900 bg-white">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-7 h-7 rounded-full bg-red-600 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[10px] font-black uppercase text-slate-950 tracking-tight leading-none">
                        {officeName}
                      </h3>
                      <span className="text-[6.5px] font-mono font-bold tracking-wider text-red-600 uppercase block mt-0.5">
                        VASTHU & CIVIL ARCHITECTURE
                      </span>
                    </div>
                  </div>

                  <div className="text-[6.8px] text-slate-600 space-y-0.2 leading-snug w-full">
                    <p className="line-clamp-1">{project.officeAddress || "Keralassery, Palakkad - 678641, Kerala"}</p>
                    <p className="font-mono text-slate-700">
                      <span>Ph: <strong>{engineerPhone}</strong></span>
                      <span> | WA: <strong>+91 88482 41463</strong></span>
                    </p>
                  </div>
                </div>

                {/* 2. Licensed Professional Block with Direct Contact Triggers */}
                <div className="px-2 py-1.5 border-b-[1.5px] border-slate-900 bg-white">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[6.5px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      LICENSED CONSULTING ENGINEER
                    </span>
                    <span className="text-[6px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      LSGD REGISTERED
                    </span>
                  </div>

                  <div className="font-black text-[9.5px] text-slate-900 uppercase">
                    {project.licenseeName || "DEEPAK .C"}
                  </div>
                  <div className="text-[7.5px] font-semibold text-slate-700">
                    {project.licenseNumber || "SUPERVISOR-A (Civil) & Vasthu Silpy"}
                  </div>
                  <div className="text-[6.8px] font-mono text-slate-600 truncate">
                    {project.registrationNumber || "Reg: E-2050/08/14087/KKD/318/2018/CA"}
                  </div>

                  {/* Engineer Direct Contact Action Strip */}
                  <div className="mt-1 pt-1 border-t border-slate-200 flex items-center justify-between text-[7px]">
                    <a
                      href={`tel:${engineerPhone}`}
                      className="inline-flex items-center gap-1 font-bold text-red-700 hover:text-red-900"
                      title="Call Engineer Deepak"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>{engineerPhone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${engineerWhatsapp || "918848241463"}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 font-mono"
                      title="WhatsApp: 8848241463"
                    >
                      <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                      <span>WA: 8848241463</span>
                    </a>
                  </div>
                </div>

                {/* 3. Project Info Block */}
                <div className="px-2 py-1.5 border-b-[1.5px] border-slate-900 bg-slate-50/40 space-y-0.6 text-[7.5px]">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase text-[6.5px]">CLIENT:</span>
                    <strong className="text-slate-900 text-right uppercase text-[8px] font-black max-w-[130px] truncate">
                      {project.clientName || "CLIENT NAME"}
                    </strong>
                  </div>

                  <div className="flex justify-between items-start border-b border-slate-200 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase text-[6.5px]">LOCATION:</span>
                    <span className="text-slate-800 text-right text-[6.8px] max-w-[130px] line-clamp-1">
                      {project.projectLocation || "PROJECT LOCATION"}
                    </span>
                  </div>

                  <div className="flex justify-between items-start border-b border-slate-200 pb-0.5">
                    <span className="text-slate-500 font-bold uppercase text-[6.5px]">DRAWING:</span>
                    <span className="text-slate-900 font-bold text-right uppercase text-[7.2px] max-w-[130px] truncate">
                      {sheet.drawingName || "BUILDING PLAN"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-0.5 text-[6.8px]">
                    <div>
                      <span className="text-slate-400 text-[6px] block">SCALE:</span>
                      <strong className="text-slate-900">{sheet.scale || project.defaultScale || "1:100"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[6px] block">DATE:</span>
                      <span className="font-mono text-slate-800">{sheet.date || project.defaultDate}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Area Statement Grid */}
                <div className="p-1 border-b-[1.5px] border-slate-900 bg-white">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[6.5px] font-mono font-bold uppercase tracking-wider text-slate-900">
                      AREA STATEMENT (വിസ്തീർണ്ണം)
                    </span>
                    <span className="text-[5px] font-mono text-slate-500 font-bold">SQ.M</span>
                  </div>

                  <table className="w-full text-[5.2px] border-collapse border border-slate-900 text-center leading-tight">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900">
                        <th rowSpan={2} className="border-r border-slate-900 py-0.5 px-0.5 text-left w-[24%]">Floor</th>
                        <th colSpan={2} className="border-r border-slate-900 py-0.5 px-0.5 bg-blue-50/70 text-blue-950 font-bold">
                          PROPOSED (sqm)
                        </th>
                        <th colSpan={2} className="py-0.5 px-0.5 bg-emerald-50/70 text-emerald-950 font-bold">
                          EXISTING (sqm)
                        </th>
                      </tr>
                      <tr className="bg-slate-50 text-[4.4px] font-semibold text-slate-700 border-b border-slate-900">
                        <th className="border-r border-slate-900 py-0.2 px-0.5">Built-up</th>
                        <th className="border-r border-slate-900 py-0.2 px-0.5">Floor</th>
                        <th className="border-r border-slate-900 py-0.2 px-0.5">Built-up</th>
                        <th className="py-0.2 px-0.5">Floor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.areaTable.map((row) => {
                        const pBuilt = (row.proposedBuiltUpSqM ?? row.builtUpSqM ?? row.proposedSqM ?? 0);
                        const pFloor = (row.proposedFloorAreaSqM ?? row.floorAreaSqM ?? 0);
                        const eBuilt = (row.existingBuiltUpSqM ?? row.existingSqM ?? 0);
                        const eFloor = (row.existingFloorAreaSqM ?? 0);
                        return (
                          <tr key={row.id} className="border-b border-slate-200">
                            <td className="border-r border-slate-900 py-0.3 px-0.5 text-left font-medium text-slate-800 truncate max-w-[40px]">
                              {row.floor}
                            </td>
                            <td className="border-r border-slate-900 py-0.3 px-0.5 font-mono font-bold text-slate-900">
                              {pBuilt > 0 ? pBuilt.toFixed(1) : "-"}
                            </td>
                            <td className="border-r border-slate-900 py-0.3 px-0.5 font-mono text-slate-700">
                              {pFloor > 0 ? pFloor.toFixed(1) : "-"}
                            </td>
                            <td className="border-r border-slate-900 py-0.3 px-0.5 font-mono text-slate-700">
                              {eBuilt > 0 ? eBuilt.toFixed(1) : "-"}
                            </td>
                            <td className="py-0.3 px-0.5 font-mono text-slate-700">
                              {eFloor > 0 ? eFloor.toFixed(1) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-black text-slate-950 border-t border-slate-900">
                        <td className="border-r border-slate-900 py-0.4 px-0.5 text-left uppercase">TOTAL</td>
                        <td className="border-r border-slate-900 py-0.4 px-0.5 font-mono text-blue-900">
                          {totalProposedBuiltUpSqM.toFixed(1)}
                        </td>
                        <td className="border-r border-slate-900 py-0.4 px-0.5 font-mono text-slate-800">
                          {totalProposedFloorSqM.toFixed(1)}
                        </td>
                        <td className="border-r border-slate-900 py-0.4 px-0.5 font-mono text-emerald-900">
                          {totalExistingBuiltUpSqM.toFixed(1)}
                        </td>
                        <td className="py-0.4 px-0.5 font-mono text-slate-800">
                          {totalExistingFloorSqM.toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="text-[5.5px] font-mono text-slate-600 mt-0.5 text-right">
                    Total Built-up: <strong className="text-slate-900">{totalBuiltUpSqM.toFixed(2)} Sq.M</strong> ({totalBuiltUpSqFt.toFixed(0)} Sq.Ft)
                  </div>
                </div>

                {/* 5. Vasthu Kol Alavu & Ayadi Block */}
                <div className="px-2 py-1 border-b-[1.5px] border-slate-900 bg-amber-50/30 text-[6.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase">
                      VASTHU KOL (വാസ്തു അളവ്)
                    </span>
                    <span className="font-mono text-[5.8px] text-emerald-800 font-bold bg-emerald-100 px-1 rounded">
                      {project.vasthuGrade || "Uttamam"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[6px] font-mono text-slate-700 mt-0.5">
                    <span>Perimeter: <strong>{project.vasthuPerimeterKol || "28 Kol 12 Viral"}</strong></span>
                    <span>({project.vasthuPerimeterMeter || "20.65m"})</span>
                  </div>
                </div>

                {/* 6. DYNAMIC QR CODE BOX FOR DIRECT SCANNING & PDF DOWNLOAD IN NEW WINDOW */}
                <div
                  onClick={handleQrCodeClick}
                  className="px-2 py-1.5 border-b-[1.5px] border-slate-900 bg-slate-50 hover:bg-red-50/50 cursor-pointer transition-colors group flex items-center justify-between"
                  title="Scan with phone camera or click to open verified PDF portal in new window (no login required)"
                >
                  <div className="flex items-center gap-1.5">
                    {qrCodeDataUrl ? (
                      <div className="w-10 h-10 border border-slate-300 bg-white p-0.5 rounded shadow-2xs group-hover:border-red-400">
                        <img src={qrCodeDataUrl} alt="Plan QR Code" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 border border-slate-300 bg-white flex items-center justify-center text-slate-400">
                        <QrCode className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[6.5px] font-black uppercase text-slate-900 block leading-tight group-hover:text-red-700">
                        SCAN FOR PLAN PDF
                      </span>
                      <span className="text-[5.5px] text-slate-500 block leading-none mt-0.5">
                        Direct download • No login required
                      </span>
                      <div className="flex items-center gap-1 text-[5.5px] font-mono mt-0.5">
                        <span className="text-red-600 font-bold">Ph: {engineerPhone}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-700 font-bold">WA: 8848241463</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[5.8px] font-bold text-slate-600 group-hover:text-red-700 bg-white px-1 py-0.5 rounded border border-slate-200 shadow-2xs inline-flex items-center gap-0.5">
                      <span>OPEN</span>
                      <ExternalLink className="w-2 h-2" />
                    </span>
                  </div>
                </div>

                {/* 7. Footer: Drawing Number & Sheet Counter */}
                <div className="p-2 bg-slate-100 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[5.5px] font-mono uppercase tracking-widest text-slate-500 block">
                      DRAWING NO.
                    </span>
                    <span className="text-xs sm:text-sm font-black font-mono text-slate-950 tracking-tight leading-none">
                      {sheet.drawingNumber || `DWG-${String(pageNum).padStart(2, "0")}`}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[5.5px] font-mono uppercase tracking-widest text-slate-500 block">
                      SHEET STATUS
                    </span>
                    <span className="text-[8.5px] font-black font-mono text-slate-900 uppercase">
                      SHEET <strong className="text-blue-700">{pageNum}</strong> OF <strong className="text-slate-950">{totalSheets}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 2. BOTTOM STRIP MODE (Full Detail Parity with Right Strip)   */
            /* ============================================================ */
            <div className="w-full h-full flex flex-col justify-between divide-y-[2px] divide-slate-950">
              {/* TOP: Full Architectural Drawing Canvas */}
              <div className="relative flex-1 w-full overflow-hidden bg-white">
                {renderDrawingCanvas()}
              </div>

              {/* BOTTOM: Complete 4-Zone Architectural Title Block Banner */}
              <div
                className="w-full bg-white flex divide-x-[1.5px] divide-slate-900 text-slate-900 overflow-hidden"
                style={{ height: "23%", minHeight: "105px" }}
              >
                {/* Zone 1 (25%): Office Branding & Licensed Consulting Engineer */}
                <div className="w-[26%] p-1.5 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-6 h-6 rounded-full bg-red-600 p-0.5 flex-shrink-0 flex items-center justify-center shadow-xs overflow-hidden">
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-[8.5px] uppercase tracking-tight text-slate-950 truncate leading-tight">
                          {officeName}
                        </div>
                        <div className="text-[5.8px] font-mono font-bold text-red-600 uppercase tracking-wider">
                          VASTHU & CIVIL ARCHITECTURE
                        </div>
                      </div>
                    </div>

                    <div className="text-[6px] text-slate-600 line-clamp-1">
                      {project.officeAddress || "Keralassery, Palakkad - 678641"}
                    </div>
                  </div>

                  {/* Licensed Engineer Block */}
                  <div className="pt-1 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[8px] uppercase text-slate-900">
                        {project.licenseeName || "DEEPAK .C"}
                      </span>
                      <span className="text-[5px] font-bold text-emerald-700 bg-emerald-50 px-0.5 py-0.1 rounded border border-emerald-200">
                        LSGD REG
                      </span>
                    </div>
                    <div className="text-[6.5px] text-slate-700 font-medium leading-none mt-0.5">
                      {project.licenseNumber || "Supervisor-A (Civil) & Vasthu Silpy"}
                    </div>
                    <div className="text-[5.8px] font-mono text-slate-500 truncate mt-0.2">
                      {project.registrationNumber || "Reg: E-2050/08/14087/KKD/318/2018/CA"}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[6.2px] font-mono">
                      <a
                        href={`tel:${engineerPhone}`}
                        className="text-red-700 font-bold inline-flex items-center gap-0.5 hover:underline"
                      >
                        <Phone className="w-2 h-2" />
                        <span>{engineerPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/${engineerWhatsapp || "918848241463"}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-bold inline-flex items-center gap-0.5 hover:underline"
                        title="WhatsApp: 8848241463"
                      >
                        <MessageSquare className="w-2 h-2 text-emerald-600" />
                        <span>WA: 8848241463</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Zone 2 (24%): Client, Location & Drawing Metadata */}
                <div className="w-[24%] p-1.5 flex flex-col justify-between bg-slate-50/40 text-[7px]">
                  <div className="space-y-0.8">
                    <div className="border-b border-slate-200 pb-0.5">
                      <span className="text-slate-400 text-[5.8px] uppercase font-bold block">CLIENT / OWNER:</span>
                      <span className="font-black text-[8px] text-slate-950 uppercase truncate block">
                        {project.clientName || "CLIENT NAME"}
                      </span>
                    </div>

                    <div className="border-b border-slate-200 pb-0.5">
                      <span className="text-slate-400 text-[5.8px] uppercase font-bold block">PROJECT LOCATION:</span>
                      <span className="text-[6.8px] text-slate-800 line-clamp-1 block">
                        {project.projectLocation || "PROJECT LOCATION"}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[5.8px] uppercase font-bold block">DRAWING TITLE:</span>
                      <span className="font-bold text-[7.5px] text-slate-900 uppercase truncate block">
                        {sheet.drawingName || "BUILDING PLAN"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-0.5 border-t border-slate-200 grid grid-cols-2 gap-1 text-[6.2px] font-mono">
                    <div>
                      <span className="text-slate-400 text-[5.2px] block">SCALE:</span>
                      <strong className="text-slate-900">{sheet.scale || project.defaultScale || "1:100"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[5.2px] block">DATE:</span>
                      <span className="text-slate-800">{sheet.date || project.defaultDate}</span>
                    </div>
                  </div>
                </div>

                {/* Zone 3 (32%): Area Statement (വിസ്തീർണ്ണം) */}
                <div className="w-[32%] p-1 flex flex-col justify-between bg-white border-r border-slate-900">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[6.5px] font-mono font-bold uppercase tracking-wider text-slate-900">
                      AREA STATEMENT (വിസ്തീർണ്ണം)
                    </span>
                    <span className="text-[5px] font-mono text-slate-500 font-bold">SQ.M</span>
                  </div>

                  <table className="w-full text-[5.2px] border-collapse border border-slate-900 text-center leading-tight">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900 border-b border-slate-900">
                        <th rowSpan={2} className="border-r border-slate-900 py-0.2 px-0.5 text-left w-[22%]">Floor</th>
                        <th colSpan={2} className="border-r border-slate-900 py-0.2 px-0.5 bg-blue-50/70 text-blue-950 font-bold">
                          PROPOSED (sqm)
                        </th>
                        <th colSpan={2} className="py-0.2 px-0.5 bg-emerald-50/70 text-emerald-950 font-bold">
                          EXISTING (sqm)
                        </th>
                      </tr>
                      <tr className="bg-slate-50 text-[4.3px] font-semibold text-slate-700 border-b border-slate-900">
                        <th className="border-r border-slate-900 py-0.2 px-0.5">Built-up</th>
                        <th className="border-r border-slate-900 py-0.2 px-0.5">Floor</th>
                        <th className="border-r border-slate-900 py-0.2 px-0.5">Built-up</th>
                        <th className="py-0.2 px-0.5">Floor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.areaTable.map((row) => {
                        const pBuilt = (row.proposedBuiltUpSqM ?? row.builtUpSqM ?? row.proposedSqM ?? 0);
                        const pFloor = (row.proposedFloorAreaSqM ?? row.floorAreaSqM ?? 0);
                        const eBuilt = (row.existingBuiltUpSqM ?? row.existingSqM ?? 0);
                        const eFloor = (row.existingFloorAreaSqM ?? 0);
                        return (
                          <tr key={row.id} className="border-b border-slate-200">
                            <td className="border-r border-slate-900 py-0.2 px-0.5 text-left font-medium text-slate-800 truncate max-w-[38px]">
                              {row.floor}
                            </td>
                            <td className="border-r border-slate-900 py-0.2 px-0.5 font-mono font-bold text-slate-900">
                              {pBuilt > 0 ? pBuilt.toFixed(1) : "-"}
                            </td>
                            <td className="border-r border-slate-900 py-0.2 px-0.5 font-mono text-slate-700">
                              {pFloor > 0 ? pFloor.toFixed(1) : "-"}
                            </td>
                            <td className="border-r border-slate-900 py-0.2 px-0.5 font-mono text-slate-700">
                              {eBuilt > 0 ? eBuilt.toFixed(1) : "-"}
                            </td>
                            <td className="py-0.2 px-0.5 font-mono text-slate-700">
                              {eFloor > 0 ? eFloor.toFixed(1) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-100 font-black text-slate-950 border-t border-slate-900">
                        <td className="border-r border-slate-900 py-0.2 px-0.5 text-left uppercase">TOTAL</td>
                        <td className="border-r border-slate-900 py-0.2 px-0.5 font-mono text-blue-900">
                          {totalProposedBuiltUpSqM.toFixed(1)}
                        </td>
                        <td className="border-r border-slate-900 py-0.2 px-0.5 font-mono text-slate-800">
                          {totalProposedFloorSqM.toFixed(1)}
                        </td>
                        <td className="border-r border-slate-900 py-0.2 px-0.5 font-mono text-emerald-900">
                          {totalExistingBuiltUpSqM.toFixed(1)}
                        </td>
                        <td className="py-0.2 px-0.5 font-mono text-slate-800">
                          {totalExistingFloorSqM.toFixed(1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-[5.2px] font-mono text-slate-600 mt-0.5 text-right leading-none">
                    Built-up: <strong className="text-slate-900">{totalBuiltUpSqM.toFixed(2)} Sq.M</strong> ({totalBuiltUpSqFt.toFixed(0)} Sq.Ft)
                  </div>
                </div>

                {/* Zone 4 (20%): Vasthu Kol + Dynamic QR Code + Sheet / DWG No */}
                <div className="w-[20%] p-1.5 flex flex-col justify-between bg-slate-50">
                  {/* Vasthu Kol summary */}
                  <div className="bg-amber-50/50 border border-amber-200/80 rounded px-1 py-0.5 text-[5.8px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 uppercase">വാസ്തു അളവ്: </span>
                      <span className="font-mono">{project.vasthuPerimeterKol || "28 Kol"}</span>
                    </div>
                    <span className="font-bold text-emerald-800 bg-emerald-100 px-0.5 rounded text-[5.2px]">
                      {project.vasthuGrade || "Uttamam"}
                    </span>
                  </div>

                  {/* QR Code trigger */}
                  <div
                    onClick={handleQrCodeClick}
                    className="flex items-center gap-1 cursor-pointer hover:bg-red-50 p-0.5 rounded transition group"
                    title="Click or Scan to open verified PDF in new window (no login required)"
                  >
                    {qrCodeDataUrl ? (
                      <div className="w-8 h-8 border border-slate-300 bg-white p-0.5 rounded flex-shrink-0 group-hover:border-red-400">
                        <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 border border-slate-300 bg-white flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[5.8px] font-black uppercase text-slate-900 block group-hover:text-red-700 leading-tight">
                        SCAN / CLICK FOR PDF
                      </span>
                      <span className="text-[4.8px] text-slate-500 block leading-none">
                        New window • Zero login
                      </span>
                    </div>
                  </div>

                  {/* Drawing Number & Sheet */}
                  <div className="pt-0.5 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[5px] font-mono text-slate-500 uppercase block leading-none">DWG NO.</span>
                      <span className="text-[9px] font-black font-mono text-slate-950 leading-tight">
                        {sheet.drawingNumber || `DWG-${String(pageNum).padStart(2, "0")}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[5px] font-mono text-slate-500 uppercase block leading-none">SHEET</span>
                      <span className="text-[7.5px] font-black font-mono text-blue-700 leading-tight">
                        {pageNum} OF {totalSheets}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
