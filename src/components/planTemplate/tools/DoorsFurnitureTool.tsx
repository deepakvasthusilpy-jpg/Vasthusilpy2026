import React, { useState } from "react";
import {
  BuildingPlanProject,
  PlanSheet,
  PlanSymbolItem,
  PlanSymbolCategory,
  DoorSwingDirection
} from "../../../types/buildingPlanTemplate";
import { SYMBOL_CATALOG, SymbolCatalogItem } from "../symbols/symbolCatalog";
import { PlanSymbolSvg } from "../symbols/PlanSymbolSvg";
import {
  DoorOpen,
  Armchair,
  Utensils,
  Bath,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Trash2,
  Copy,
  Sliders,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Check,
  Move
} from "lucide-react";

interface DoorsFurnitureToolProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onUpdateSheet: (updatedSheet: PlanSheet) => void;
  selectedSymbolId: string | null;
  onSelectSymbol: (symbolId: string | null) => void;
}

export const DoorsFurnitureTool: React.FC<DoorsFurnitureToolProps> = ({
  project,
  activeSheet,
  onUpdateSheet,
  selectedSymbolId,
  onSelectSymbol
}) => {
  const [activeCategory, setActiveCategory] = useState<"all" | PlanSymbolCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [doorPresetSwing, setDoorPresetSwing] = useState<DoorSwingDirection>("left_in");
  const [doorPresetFlipH, setDoorPresetFlipH] = useState<boolean>(false);
  const [doorPresetFlipV, setDoorPresetFlipV] = useState<boolean>(false);
  const [customDoorLabel, setCustomDoorLabel] = useState<string>("D1");

  const currentSymbols = activeSheet.symbols || [];
  const selectedSymbol = currentSymbols.find((s) => s.id === selectedSymbolId) || null;

  // Filter catalog
  const filteredCatalog = SYMBOL_CATALOG.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameMl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add symbol to active sheet
  const handleAddSymbol = (catalogItem: SymbolCatalogItem) => {
    const isDoor = catalogItem.category === "door";
    
    // Auto increment door label if door
    let symbolLabel = catalogItem.defaultLabel || "";
    if (isDoor) {
      const doorCount = currentSymbols.filter((s) => s.category === "door").length;
      symbolLabel = customDoorLabel || `D${doorCount + 1}`;
    }

    const newSymbol: PlanSymbolItem = {
      id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: catalogItem.type,
      name: catalogItem.name,
      category: catalogItem.category,
      x: 35 + (currentSymbols.length % 5) * 5, // Stagger placement near center
      y: 35 + (currentSymbols.length % 5) * 5,
      width: catalogItem.defaultWidth,
      height: catalogItem.defaultHeight,
      rotation: 0,
      flipH: isDoor ? doorPresetFlipH : false,
      flipV: isDoor ? doorPresetFlipV : false,
      doorSwing: isDoor ? doorPresetSwing : undefined,
      doorOpenAngle: 90,
      scale: 1,
      label: symbolLabel,
      color: "#0f172a",
      fillColor: "#ffffff",
      zIndex: 20 + currentSymbols.length
    };

    const updated = [...currentSymbols, newSymbol];
    onUpdateSheet({ ...activeSheet, symbols: updated });
    onSelectSymbol(newSymbol.id);
  };

  // Update specific placed symbol
  const handleUpdatePlacedSymbol = (id: string, patch: Partial<PlanSymbolItem>) => {
    const updated = currentSymbols.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onUpdateSheet({ ...activeSheet, symbols: updated });
  };

  // Delete placed symbol
  const handleDeletePlacedSymbol = (id: string) => {
    const updated = currentSymbols.filter((s) => s.id !== id);
    onUpdateSheet({ ...activeSheet, symbols: updated });
    if (selectedSymbolId === id) {
      onSelectSymbol(null);
    }
  };

  // Duplicate placed symbol
  const handleDuplicatePlacedSymbol = (symbol: PlanSymbolItem) => {
    const dup: PlanSymbolItem = {
      ...symbol,
      id: `sym-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      x: Math.min(symbol.x + 4, 85),
      y: Math.min(symbol.y + 4, 85),
      label: symbol.label ? `${symbol.label}` : ""
    };
    const updated = [...currentSymbols, dup];
    onUpdateSheet({ ...activeSheet, symbols: updated });
    onSelectSymbol(dup.id);
  };

  // Clear all symbols from sheet
  const handleClearAll = () => {
    if (window.confirm("Remove all doors and furniture symbols from this sheet?")) {
      onUpdateSheet({ ...activeSheet, symbols: [] });
      onSelectSymbol(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Doors & 2D Furniture Placement</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Place architectural 2D doors with customizable swing direction, left/right hinges, and opening angles. Add standard furniture symbols (beds, sofas, dining tables, kitchen sinks, granite slabs, commodes) directly on the active plan sheet. Drag to move, resize, rotate, edit, or delete anytime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">ACTIVE SHEET</span>
            <span className="text-xs font-bold text-white">{activeSheet.drawingName || "Floor Plan"}</span>
          </div>
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-mono font-bold">
            {currentSymbols.length} Placed
          </span>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Symbol Catalog & Door Direction Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeCategory === "all" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All ({SYMBOL_CATALOG.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory("door")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeCategory === "door" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>Doors</span>
            </button>
            <button
              onClick={() => setActiveCategory("furniture")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeCategory === "furniture" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Armchair className="w-3.5 h-3.5" />
              <span>Furniture</span>
            </button>
            <button
              onClick={() => setActiveCategory("kitchen")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeCategory === "kitchen" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Kitchen</span>
            </button>
            <button
              onClick={() => setActiveCategory("sanitary")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                activeCategory === "sanitary" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Bath className="w-3.5 h-3.5" />
              <span>Sanitary</span>
            </button>
          </div>

          {/* Door Swing Direction Quick Setup Box (When Door category is active or for general doors) */}
          {(activeCategory === "all" || activeCategory === "door") && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                  <DoorOpen className="w-3.5 h-3.5" />
                  Door Swing Direction Presets
                </span>
                <span className="text-[10px] font-mono text-slate-400">Applies when placing doors</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDoorPresetFlipH(false);
                    setDoorPresetFlipV(false);
                    setDoorPresetSwing("left_in");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition text-xs ${
                    !doorPresetFlipH && !doorPresetFlipV
                      ? "bg-amber-500/20 border-amber-500/60 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold">Left Hinge</div>
                  <div className="text-[10px] text-slate-400">Inward Swing</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDoorPresetFlipH(true);
                    setDoorPresetFlipV(false);
                    setDoorPresetSwing("right_in");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition text-xs ${
                    doorPresetFlipH && !doorPresetFlipV
                      ? "bg-amber-500/20 border-amber-500/60 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold">Right Hinge</div>
                  <div className="text-[10px] text-slate-400">Inward Swing</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDoorPresetFlipH(false);
                    setDoorPresetFlipV(true);
                    setDoorPresetSwing("left_out");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition text-xs ${
                    !doorPresetFlipH && doorPresetFlipV
                      ? "bg-amber-500/20 border-amber-500/60 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold">Left Hinge</div>
                  <div className="text-[10px] text-slate-400">Outward Swing</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDoorPresetFlipH(true);
                    setDoorPresetFlipV(true);
                    setDoorPresetSwing("right_out");
                  }}
                  className={`p-2.5 rounded-xl border text-left transition text-xs ${
                    doorPresetFlipH && doorPresetFlipV
                      ? "bg-amber-500/20 border-amber-500/60 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold">Right Hinge</div>
                  <div className="text-[10px] text-slate-400">Outward Swing</div>
                </button>
              </div>

              {/* Quick Label Config */}
              <div className="flex items-center gap-3 pt-1 text-xs">
                <span className="text-slate-400">Door Tag / Mark:</span>
                <input
                  type="text"
                  value={customDoorLabel}
                  onChange={(e) => setCustomDoorLabel(e.target.value)}
                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold text-center text-xs focus:border-amber-500 focus:outline-none"
                  placeholder="D1"
                />
                <span className="text-[11px] text-slate-500">
                  (e.g., D1, D2, MD for Main Door)
                </span>
              </div>
            </div>
          )}

          {/* Symbol Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredCatalog.map((item) => {
              // Create a dummy symbol item for vector preview
              const previewSymbol: PlanSymbolItem = {
                id: `preview-${item.type}`,
                type: item.type,
                name: item.name,
                category: item.category,
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                rotation: 0,
                flipH: item.category === "door" ? doorPresetFlipH : false,
                flipV: item.category === "door" ? doorPresetFlipV : false,
                scale: 1,
                label: item.defaultLabel
              };

              return (
                <div
                  key={item.type + item.name}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-2xl p-3.5 flex flex-col justify-between transition-all group shadow-md hover:shadow-xl hover:bg-slate-850"
                >
                  <div>
                    {/* SVG Vector Preview Box */}
                    <div className="w-full h-24 bg-white rounded-xl p-2 flex items-center justify-center mb-2.5 shadow-inner border border-slate-200 overflow-hidden relative">
                      <div className="w-20 h-20 flex items-center justify-center">
                        <PlanSymbolSvg symbol={previewSymbol} />
                      </div>
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {item.realDimensions}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono line-clamp-1 mt-0.5">
                      {item.nameMl}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      {item.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddSymbol(item)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Place</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Placed Symbols Management & Selected Symbol Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Selected Symbol Inspector Panel */}
          {selectedSymbol ? (
            <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sliders className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{selectedSymbol.name}</h3>
                    <span className="text-[10px] font-mono text-amber-400 uppercase">
                      Selected Item (Sheet DWG-{activeSheet.sheetNumber})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicatePlacedSymbol(selectedSymbol)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                    title="Duplicate Item"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePlacedSymbol(selectedSymbol.id)}
                    className="p-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-400 rounded-lg transition"
                    title="Delete Item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Large Visual Preview */}
              <div className="w-full h-28 bg-white rounded-xl p-2 flex items-center justify-center border border-slate-300 shadow-inner">
                <div className="w-24 h-24">
                  <PlanSymbolSvg symbol={selectedSymbol} />
                </div>
              </div>

              {/* Controls: Direction Change, Rotation, and Swing Flip */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-mono block mb-1.5 font-semibold">
                    DIRECTION & ORIENTATION CHANGE:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Rotate 90° Clockwise */}
                    <button
                      onClick={() =>
                        handleUpdatePlacedSymbol(selectedSymbol.id, {
                          rotation: ((selectedSymbol.rotation || 0) + 90) % 360
                        })
                      }
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 flex flex-col items-center gap-1 font-mono text-[11px]"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>+90°</span>
                    </button>

                    {/* Rotate 90° Counter-Clockwise */}
                    <button
                      onClick={() =>
                        handleUpdatePlacedSymbol(selectedSymbol.id, {
                          rotation: ((selectedSymbol.rotation || 0) - 90 + 360) % 360
                        })
                      }
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 flex flex-col items-center gap-1 font-mono text-[11px]"
                      title="Rotate -90°"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>-90°</span>
                    </button>

                    {/* Flip Horizontal (Reverses swing or left-right mirror) */}
                    <button
                      onClick={() =>
                        handleUpdatePlacedSymbol(selectedSymbol.id, {
                          flipH: !selectedSymbol.flipH
                        })
                      }
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-mono text-[11px] ${
                        selectedSymbol.flipH
                          ? "bg-amber-500/20 border-amber-500 text-white"
                          : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                      }`}
                      title="Flip Horizontal (Door Hinge Left/Right)"
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Flip H</span>
                    </button>

                    {/* Flip Vertical (Door swing In/Out) */}
                    <button
                      onClick={() =>
                        handleUpdatePlacedSymbol(selectedSymbol.id, {
                          flipV: !selectedSymbol.flipV
                        })
                      }
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-mono text-[11px] ${
                        selectedSymbol.flipV
                          ? "bg-amber-500/20 border-amber-500 text-white"
                          : "bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800"
                      }`}
                      title="Flip Vertical (Door Swing In/Out)"
                    >
                      <FlipVertical className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Flip V</span>
                    </button>
                  </div>
                </div>

                {/* Door Specific Opening Direction Dropdown */}
                {selectedSymbol.category === "door" && (
                  <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 font-bold block">
                      DOOR SWING OPENING DIRECTION:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() =>
                          handleUpdatePlacedSymbol(selectedSymbol.id, {
                            flipH: false,
                            flipV: false,
                            doorSwing: "left_in"
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[11px] border font-mono text-left ${
                          !selectedSymbol.flipH && !selectedSymbol.flipV
                            ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        Left Hinge (Inward)
                      </button>

                      <button
                        onClick={() =>
                          handleUpdatePlacedSymbol(selectedSymbol.id, {
                            flipH: true,
                            flipV: false,
                            doorSwing: "right_in"
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[11px] border font-mono text-left ${
                          selectedSymbol.flipH && !selectedSymbol.flipV
                            ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        Right Hinge (Inward)
                      </button>

                      <button
                        onClick={() =>
                          handleUpdatePlacedSymbol(selectedSymbol.id, {
                            flipH: false,
                            flipV: true,
                            doorSwing: "left_out"
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[11px] border font-mono text-left ${
                          !selectedSymbol.flipH && selectedSymbol.flipV
                            ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        Left Hinge (Outward)
                      </button>

                      <button
                        onClick={() =>
                          handleUpdatePlacedSymbol(selectedSymbol.id, {
                            flipH: true,
                            flipV: true,
                            doorSwing: "right_out"
                          })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[11px] border font-mono text-left ${
                          selectedSymbol.flipH && selectedSymbol.flipV
                            ? "bg-amber-500 text-slate-950 font-bold border-amber-500"
                            : "bg-slate-900 text-slate-400 border-slate-800"
                        }`}
                      >
                        Right Hinge (Outward)
                      </button>
                    </div>
                  </div>
                )}

                {/* Scale / Resize Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1 font-mono text-slate-400">
                    <span>SIZE SCALE:</span>
                    <span className="text-white font-bold">{Math.round((selectedSymbol.scale || 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={selectedSymbol.scale || 1}
                    onChange={(e) =>
                      handleUpdatePlacedSymbol(selectedSymbol.id, {
                        scale: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Position Coordinates (X% & Y%) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 font-mono block text-[10px]">CANVAS X (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(selectedSymbol.x)}
                      onChange={(e) =>
                        handleUpdatePlacedSymbol(selectedSymbol.id, {
                          x: Math.max(0, Math.min(95, parseFloat(e.target.value) || 0))
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono block text-[10px]">CANVAS Y (%):</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(selectedSymbol.y)}
                      onChange={(e) =>
                        handleUpdatePlacedSymbol(selectedSymbol.id, {
                          y: Math.max(0, Math.min(95, parseFloat(e.target.value) || 0))
                        })
                      }
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Label Edit */}
                <div>
                  <span className="text-slate-400 font-mono block text-[10px] mb-1">ARCHITECTURAL MARK / LABEL:</span>
                  <input
                    type="text"
                    value={selectedSymbol.label || ""}
                    onChange={(e) =>
                      handleUpdatePlacedSymbol(selectedSymbol.id, {
                        label: e.target.value
                      })
                    }
                    placeholder="e.g. D1, MD, Bed, Counter"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Move className="w-3 h-3 text-slate-400" />
                    Can also drag directly on floor plan
                  </span>
                  <button
                    onClick={() => onSelectSymbol(null)}
                    className="text-slate-400 hover:text-white text-xs font-mono underline"
                  >
                    Deselect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white">No Item Selected</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Click on any door or furniture symbol placed on the drawing to inspect, rotate, flip direction, resize, or delete.
              </p>
            </div>
          )}

          {/* Placed Items List on this Sheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Placed Symbols ({currentSymbols.length})
              </h3>
              {currentSymbols.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] font-mono text-red-400 hover:text-red-300 transition cursor-pointer"
                >
                  Clear Sheet
                </button>
              )}
            </div>

            {currentSymbols.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No doors or furniture placed on this sheet yet. Click "Place" on any symbol from the catalog.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {currentSymbols.map((item, idx) => {
                  const isSelected = item.id === selectedSymbolId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectSymbol(item.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-500 text-white"
                          : "bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1">
                            <span>{item.name}</span>
                            {item.label && (
                              <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1 rounded">
                                {item.label}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                            <span>Rot: {item.rotation}°</span>
                            <span>Scale: {Math.round((item.scale || 1) * 100)}%</span>
                            {item.flipH && <span>[Flip H]</span>}
                            {item.flipV && <span>[Flip V]</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            handleUpdatePlacedSymbol(item.id, {
                              rotation: ((item.rotation || 0) + 90) % 360
                            })
                          }
                          className="p-1 text-slate-400 hover:text-amber-400 transition"
                          title="Rotate 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlacedSymbol(item.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
