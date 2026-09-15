import React from "react";
import { BuildingPlanProject, PlanSheet } from "../../types/buildingPlanTemplate";
import {
  Layers,
  LayoutTemplate,
  Printer,
  Download,
  Image as ImageIcon,
  FileDown,
  Sparkles,
  Check,
  ShieldCheck,
  Building2,
  FileText,
  Compass,
  Maximize2
} from "lucide-react";

interface TemplateStyleSelectorProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onUpdateProject: (updated: BuildingPlanProject) => void;
  onDownloadPdf: () => void;
  onExportJpeg: () => void;
  onExportPng: () => void;
  onPrintDocument: () => void;
}

export interface TemplatePreset {
  id: "kerala_lsgd_standard" | "modern_architectural" | "technical_cad_blueprint" | "executive_presentation" | "ksmart_municipal_permit";
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  themeColor: string;
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "kerala_lsgd_standard",
    title: "Kerala LSGD Standard",
    subtitle: "Panchayat / Municipality Submission",
    badge: "KPBR / KMBR Compliant",
    description: "Authentic Kerala local body permitting format featuring Malayalam Area Table annotations, 70mm right strip, and Vasthu Shastra verification.",
    themeColor: "from-blue-600 to-indigo-700"
  },
  {
    id: "modern_architectural",
    title: "Modern Architectural Studio",
    subtitle: "Minimalist & Contemporary",
    badge: "Clean Monochrome",
    description: "Sleek architectural layout with sharp geometric framing, high-contrast typography, charcoal dividers, and elegant balanced whitespace.",
    themeColor: "from-slate-700 to-zinc-900"
  },
  {
    id: "technical_cad_blueprint",
    title: "CAD Technical Blueprint",
    subtitle: "Engineering & Structural Grid",
    badge: "ISO 5457 Standard",
    description: "Deep blueprint technical drafting aesthetic with corner alignment marks, coordinate reference ticks, and structural stamp compartments.",
    themeColor: "from-cyan-700 to-blue-900"
  },
  {
    id: "executive_presentation",
    title: "Executive Presentation",
    subtitle: "Luxury Client Portfolio",
    badge: "High-End Pitch",
    description: "Refined presentation sheet with bronze/gold insignia accents, serif headings, and high-legibility area badge for client discussions.",
    themeColor: "from-amber-600 to-yellow-800"
  },
  {
    id: "ksmart_municipal_permit",
    title: "K-SMART Municipal Permit",
    subtitle: "Kerala Online Scrutiny Format",
    badge: "Digital Scrutiny Ready",
    description: "Standardized format with K-SMART digital scrutiny box, statutory engineer declaration, setback clearance line, and barcode/QR verification.",
    themeColor: "from-emerald-700 to-teal-900"
  }
];

export const TemplateStyleSelector: React.FC<TemplateStyleSelectorProps> = ({
  project,
  activeSheet,
  onUpdateProject,
  onDownloadPdf,
  onExportJpeg,
  onExportPng,
  onPrintDocument
}) => {
  const currentDesign = project.templateDesign || "kerala_lsgd_standard";
  const currentPosition = project.titleBlockPosition || "right";

  const handleSelectDesign = (designId: TemplatePreset["id"]) => {
    onUpdateProject({
      ...project,
      templateDesign: designId
    });
  };

  const handleSelectPosition = (position: "right" | "bottom") => {
    onUpdateProject({
      ...project,
      titleBlockPosition: position
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Header and Quick Export Action Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Professional Template Designs & Export Center
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between professional architectural layouts, toggle Right vs Bottom strip title blocks, or export/print directly.
          </p>
        </div>

        {/* 4 Core Export & Print Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Document */}
          <button
            onClick={onPrintDocument}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition shadow cursor-pointer hover:border-slate-600"
            title="Print Document on A4 Landscape (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Document</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={onDownloadPdf}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            title="Download crisp 300 DPI A4 Landscape PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          {/* Export to JPEG */}
          <button
            onClick={onExportJpeg}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="Export high-resolution JPEG image"
          >
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JPEG</span>
          </button>

          {/* Export to PNG */}
          <button
            onClick={onExportPng}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="Export lossless PNG image"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Row 2: Title Block Position Switcher (Right Strip vs Bottom Strip) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 block">
            Title Block Strip Position
          </span>
          <span className="text-[11px] text-slate-400">
            {currentPosition === "right"
              ? "Standard 70mm Right Strip: Best for tall drawings, floor plans, and full area grids."
              : "Horizontal Bottom Strip: All details and area statement compact across the base, giving maximum drawing height."}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleSelectPosition("right")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer border ${
              currentPosition === "right"
                ? "bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span className="w-2.5 h-2.5 border-r-2 border-white/80 inline-block" />
            <span>Right Strip (70mm)</span>
            {currentPosition === "right" && <Check className="w-3 h-3" />}
          </button>

          <button
            onClick={() => handleSelectPosition("bottom")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer border ${
              currentPosition === "bottom"
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-950"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span className="w-2.5 h-2.5 border-b-2 border-white/80 inline-block" />
            <span>Bottom Strip (Compact)</span>
            {currentPosition === "bottom" && <Check className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Row 3: Professional Design Template Cards */}
      <div className="space-y-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
          Select Architectural Template Preset
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {TEMPLATE_PRESETS.map((preset) => {
            const isSelected = currentDesign === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectDesign(preset.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-800/90 border-cyan-500 ring-2 ring-cyan-500/30 shadow-lg"
                    : "bg-slate-950/70 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      {preset.badge}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <h4 className="text-xs font-bold text-white">{preset.title}</h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.subtitle}</div>
                  <p className="text-[10.5px] text-slate-400 mt-2 leading-tight">
                    {preset.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? "text-cyan-300 font-bold" : "text-slate-500"}>
                    {isSelected ? "Active Layout" : "Select"}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 opacity-60" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
