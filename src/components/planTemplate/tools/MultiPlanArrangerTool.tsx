import React, { useState } from "react";
import { BuildingPlanProject, PlanSheet, PlanAttachment } from "../../../types/buildingPlanTemplate";
import { SAMPLE_GROUND_FLOOR_SVG, SAMPLE_FIRST_FLOOR_SVG } from "../../../data/sampleBuildingPlans";
import {
  Layers,
  Plus,
  Trash2,
  Move,
  ZoomIn,
  RotateCw,
  LayoutGrid,
  Columns,
  Rows,
  Maximize2,
  Lock,
  Unlock,
  Upload,
  Check,
  Sparkles,
  Eye
} from "lucide-react";

interface MultiPlanArrangerToolProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onUpdateSheet: (updatedSheet: PlanSheet) => void;
  selectedAttachmentId: string | null;
  onSelectAttachment: (id: string | null) => void;
}

export const MultiPlanArrangerTool: React.FC<MultiPlanArrangerToolProps> = ({
  project,
  activeSheet,
  onUpdateSheet,
  selectedAttachmentId,
  onSelectAttachment
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newScale, setNewScale] = useState("1 : 100");

  const attachments: PlanAttachment[] = activeSheet.attachments && activeSheet.attachments.length > 0
    ? activeSheet.attachments
    : activeSheet.planImageUrl
    ? [
        {
          id: `att-${activeSheet.id}-primary`,
          title: activeSheet.floorName || activeSheet.drawingName || "Ground Floor Plan",
          imageUrl: activeSheet.planImageUrl,
          fileName: activeSheet.planFileName || "plan.svg",
          x: 4,
          y: 6,
          width: 92,
          scale: activeSheet.scale || "1 : 100",
          zoom: 100,
          rotation: 0,
          zIndex: 1
        }
      ]
    : [];

  const selectedAtt = attachments.find((a) => a.id === selectedAttachmentId) || attachments[0];

  // Update a specific attachment
  const handleUpdateAttachment = (id: string, updates: Partial<PlanAttachment>) => {
    const next = attachments.map((a) => (a.id === id ? { ...a, ...updates } : a));
    onUpdateSheet({
      ...activeSheet,
      attachments: next
    });
  };

  // Add a sample or uploaded plan attachment
  const handleAddPlan = (sampleType: "ground" | "first" | "custom") => {
    const id = `att-${Date.now()}`;
    const isFirst = sampleType === "first";
    const newAtt: PlanAttachment = {
      id,
      title: isFirst ? "First Floor Plan" : sampleType === "ground" ? "Ground Floor Plan" : newTitle || "Proposed Floor Plan",
      imageUrl: isFirst ? SAMPLE_FIRST_FLOOR_SVG : SAMPLE_GROUND_FLOOR_SVG,
      fileName: isFirst ? "first_floor_plan.svg" : "ground_floor_plan.svg",
      x: attachments.length === 0 ? 5 : 50,
      y: 10,
      width: attachments.length === 0 ? 90 : 44,
      scale: newScale || "1 : 100",
      zoom: 100,
      rotation: 0,
      zIndex: attachments.length + 1
    };

    const next = [...attachments, newAtt];
    onUpdateSheet({
      ...activeSheet,
      attachments: next
    });
    onSelectAttachment(id);
    setNewTitle("");
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const id = `att-upload-${Date.now()}`;
      const newAtt: PlanAttachment = {
        id,
        title: file.name.replace(/\.[^/.]+$/, "").toUpperCase(),
        imageUrl: result,
        fileName: file.name,
        x: 10,
        y: 10,
        width: 45,
        scale: "1 : 100",
        zoom: 100,
        rotation: 0,
        zIndex: attachments.length + 1
      };

      const next = [...attachments, newAtt];
      onUpdateSheet({
        ...activeSheet,
        attachments: next
      });
      onSelectAttachment(id);
    };
    reader.readAsDataURL(file);
  };

  // Remove attachment
  const handleDeleteAttachment = (id: string) => {
    const next = attachments.filter((a) => a.id !== id);
    onUpdateSheet({
      ...activeSheet,
      attachments: next
    });
    if (selectedAttachmentId === id) {
      onSelectAttachment(next[0]?.id || null);
    }
  };

  // Quick Smooth Layout Presets
  const applyLayoutPreset = (preset: "single" | "side_by_side" | "stacked" | "quad") => {
    if (attachments.length === 0) return;

    let updated: PlanAttachment[] = [];
    if (preset === "single") {
      updated = attachments.map((a, i) =>
        i === 0
          ? { ...a, x: 4, y: 5, width: 92, zoom: 100 }
          : { ...a, x: 10, y: 10, width: 30, zoom: 80 }
      );
    } else if (preset === "side_by_side") {
      updated = attachments.map((a, i) => {
        if (i === 0) return { ...a, x: 2, y: 8, width: 46, zoom: 95 };
        if (i === 1) return { ...a, x: 50, y: 8, width: 46, zoom: 95 };
        return { ...a, x: 25, y: 50, width: 30 };
      });
    } else if (preset === "stacked") {
      updated = attachments.map((a, i) => {
        if (i === 0) return { ...a, x: 8, y: 2, width: 84, zoom: 85 };
        if (i === 1) return { ...a, x: 8, y: 50, width: 84, zoom: 85 };
        return { ...a, x: 10, y: 30, width: 30 };
      });
    } else if (preset === "quad") {
      updated = attachments.map((a, i) => {
        if (i === 0) return { ...a, x: 2, y: 2, width: 46, zoom: 85 };
        if (i === 1) return { ...a, x: 50, y: 2, width: 46, zoom: 85 };
        if (i === 2) return { ...a, x: 2, y: 50, width: 46, zoom: 85 };
        if (i === 3) return { ...a, x: 50, y: 50, width: 46, zoom: 85 };
        return a;
      });
    }

    onUpdateSheet({
      ...activeSheet,
      attachments: updated
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Multi-Plan Sheet Arranger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Arrange multiple plan attachments on the same A4 sheet (e.g. Ground Floor, First Floor, Section, Key Plan). Scale, move, and position them smoothly.
          </p>
        </div>

        {/* Quick Add Plan Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md hover:shadow-blue-500/20 transition-all">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Plan File</span>
            <input type="file" accept="image/*,.svg" onChange={handleFileUpload} className="hidden" />
          </label>
          <button
            onClick={() => handleAddPlan("first")}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>+ First Floor SVG</span>
          </button>
        </div>
      </div>

      {/* Quick Layout Presets */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold block mb-2.5">
          Smooth Multi-Plan Arrangement Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => applyLayoutPreset("single")}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all hover:border-blue-500 group"
          >
            <div className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-200">Single Main Plan</div>
            <div className="text-[10px] text-slate-400">Full 92% width focus</div>
          </button>

          <button
            onClick={() => applyLayoutPreset("side_by_side")}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all hover:border-blue-500 group"
          >
            <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Columns className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-200">Side-by-Side (2 Plans)</div>
            <div className="text-[10px] text-slate-400">Ground + First floor</div>
          </button>

          <button
            onClick={() => applyLayoutPreset("stacked")}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all hover:border-blue-500 group"
          >
            <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Rows className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-200">Top & Bottom Stack</div>
            <div className="text-[10px] text-slate-400">Sections & elevations</div>
          </button>

          <button
            onClick={() => applyLayoutPreset("quad")}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-left transition-all hover:border-blue-500 group"
          >
            <div className="w-6 h-6 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs font-bold text-slate-200">2x2 Quad Grid</div>
            <div className="text-[10px] text-slate-400">4 Architectural drawings</div>
          </button>
        </div>
      </div>

      {/* Active Attachments List & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1 Column: Attachments List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Plans on This Sheet ({attachments.length})
            </h3>
            <span className="text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800">
              Drag on Canvas
            </span>
          </div>

          <div className="space-y-2">
            {attachments.map((att, idx) => {
              const isSelected = selectedAtt?.id === att.id;
              return (
                <div
                  key={att.id}
                  onClick={() => onSelectAttachment(att.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? "bg-blue-600/15 border-blue-500/80 text-white shadow-sm"
                      : "bg-slate-800/60 hover:bg-slate-800 border-slate-700/70 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <img src={att.imageUrl} alt={att.title} className="w-full h-full object-contain" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{att.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Scale {att.scale} • {att.width}% w
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateAttachment(att.id, { locked: !att.locked });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-200"
                      title={att.locked ? "Locked" : "Unlocked"}
                    >
                      {att.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttachment(att.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {attachments.length === 0 && (
            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No plans attached yet.</p>
              <button
                onClick={() => handleAddPlan("ground")}
                className="mt-2 text-xs font-bold text-blue-400 hover:underline"
              >
                + Add Ground Floor Plan
              </button>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Fine-tune Controls for Selected Plan */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          {selectedAtt ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Fine-tune:</span>
                    <span className="text-blue-400">{selectedAtt.title}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Adjust scaling, coordinates, rotation, and drawing captions.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                    X: {selectedAtt.x}% • Y: {selectedAtt.y}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title & Scale */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Plan Caption Label</label>
                  <input
                    type="text"
                    value={selectedAtt.title}
                    onChange={(e) => handleUpdateAttachment(selectedAtt.id, { title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none"
                    placeholder="e.g. Ground Floor Plan"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Architectural Scale</label>
                  <select
                    value={selectedAtt.scale}
                    onChange={(e) => handleUpdateAttachment(selectedAtt.id, { scale: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 outline-none font-mono"
                  >
                    <option value="1 : 100">1 : 100 (Standard Floor Plan)</option>
                    <option value="1 : 50">1 : 50 (Detailed Section)</option>
                    <option value="1 : 200">1 : 200 (Site / Layout Plan)</option>
                    <option value="1 : 400">1 : 400 (Key / Village Plan)</option>
                    <option value="1 : 20">1 : 20 (Joinery Details)</option>
                  </select>
                </div>

                {/* Width & Zoom Sliders */}
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Width on Sheet</span>
                    <span className="font-mono text-blue-400">{selectedAtt.width}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="96"
                    value={selectedAtt.width}
                    onChange={(e) => handleUpdateAttachment(selectedAtt.id, { width: Number(e.target.value) })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                  <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                    <span>Zoom Magnification</span>
                    <span className="font-mono text-emerald-400">{selectedAtt.zoom || 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    value={selectedAtt.zoom || 100}
                    onChange={(e) => handleUpdateAttachment(selectedAtt.id, { zoom: Number(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Coordinates & Move Presets */}
                <div className="sm:col-span-2 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-300">Quick Alignment:</span>
                    <button
                      onClick={() => handleUpdateAttachment(selectedAtt.id, { x: 4, y: 5 })}
                      className="px-2 py-1 rounded bg-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-600"
                    >
                      Top-Left
                    </button>
                    <button
                      onClick={() => handleUpdateAttachment(selectedAtt.id, { x: 50, y: 5 })}
                      className="px-2 py-1 rounded bg-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-600"
                    >
                      Top-Right
                    </button>
                    <button
                      onClick={() => handleUpdateAttachment(selectedAtt.id, { x: 4, y: 50 })}
                      className="px-2 py-1 rounded bg-slate-700 text-xs font-mono text-slate-200 hover:bg-slate-600"
                    >
                      Bottom-Left
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateAttachment(selectedAtt.id, {
                          rotation: ((selectedAtt.rotation || 0) + 90) % 360
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3 h-3 text-blue-400" />
                      <span>Rotate +90° ({selectedAtt.rotation || 0}°)</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Move className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
              <p className="text-sm font-semibold">Select a plan from the list to adjust its properties</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
