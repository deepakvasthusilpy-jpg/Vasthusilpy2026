import React from "react";
import { BuildingPlanProject, PlanSheet, SheetMarginConfig } from "../../../types/buildingPlanTemplate";
import { VASTHUSILPY_LOGO_DATA_URL, ENGINEER_CONTACT_DETAILS } from "../../../data/vasthusilpyLogo";
import {
  Stamp,
  Check,
  Phone,
  MessageSquare,
  ShieldCheck,
  Maximize2,
  Sliders,
  FileCheck2,
  Building2,
  Copy
} from "lucide-react";

interface TitleBlockMarginsToolProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onUpdateProject: (updatedProject: BuildingPlanProject) => void;
  onUpdateSheet: (updatedSheet: PlanSheet) => void;
}

export const TitleBlockMarginsTool: React.FC<TitleBlockMarginsToolProps> = ({
  project,
  activeSheet,
  onUpdateProject,
  onUpdateSheet
}) => {
  const margins: SheetMarginConfig = activeSheet.marginConfig || project.marginConfig || {
    leftMm: 15,
    rightMm: 10,
    topMm: 10,
    bottomMm: 10,
    presetName: "standard_kerala"
  };

  const handleUpdateMargins = (updates: Partial<SheetMarginConfig>) => {
    const updated = { ...margins, ...updates };
    onUpdateSheet({
      ...activeSheet,
      marginConfig: updated
    });
    onUpdateProject({
      ...project,
      marginConfig: updated
    });
  };

  const handlePreset = (preset: "standard_kerala" | "nbc_sp46" | "compact") => {
    if (preset === "standard_kerala") {
      handleUpdateMargins({ leftMm: 15, rightMm: 10, topMm: 10, bottomMm: 10, presetName: "standard_kerala" });
    } else if (preset === "nbc_sp46") {
      handleUpdateMargins({ leftMm: 20, rightMm: 10, topMm: 10, bottomMm: 10, presetName: "nbc_sp46" });
    } else {
      handleUpdateMargins({ leftMm: 10, rightMm: 5, topMm: 5, bottomMm: 5, presetName: "compact_10mm" });
    }
  };

  const handleAttachOfficialLogo = () => {
    onUpdateProject({
      ...project,
      logoUrl: VASTHUSILPY_LOGO_DATA_URL,
      officeName: ENGINEER_CONTACT_DETAILS.officeName,
      officeMobile: ENGINEER_CONTACT_DETAILS.phoneCall,
      officeWhatsapp: ENGINEER_CONTACT_DETAILS.whatsappNumber,
      engineerCallNumber: ENGINEER_CONTACT_DETAILS.phoneCall,
      engineerWhatsappNumber: ENGINEER_CONTACT_DETAILS.whatsappNumber
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Stamp className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Standard Sheet Margins & Title Block</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Configure standard architectural print margins (15mm binding margin on left, 10mm right/top/bottom), verify business logo attachment across all sheets, and customize engineer contact numbers.
          </p>
        </div>

        <button
          onClick={handleAttachOfficialLogo}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:shadow-red-600/20 transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Attach Official Logo & Contacts to All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Standard Print Margin Configurator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              A4 Sheet Margin Setup (mm)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Standard: 15mm Left / 10mm Trim
            </span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePreset("standard_kerala")}
              className={`p-3 rounded-xl border text-left transition-all ${
                margins.leftMm === 15
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <div className="text-xs font-bold">Kerala LSGD</div>
              <div className="text-[10px] text-slate-400">Left 15mm • 10mm sides</div>
            </button>

            <button
              onClick={() => handlePreset("nbc_sp46")}
              className={`p-3 rounded-xl border text-left transition-all ${
                margins.leftMm === 20
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <div className="text-xs font-bold">NBC / SP 46</div>
              <div className="text-[10px] text-slate-400">Left 20mm (Binding)</div>
            </button>

            <button
              onClick={() => handlePreset("compact")}
              className={`p-3 rounded-xl border text-left transition-all ${
                margins.leftMm === 10
                  ? "bg-blue-600/20 border-blue-500 text-white"
                  : "bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <div className="text-xs font-bold">Compact Trim</div>
              <div className="text-[10px] text-slate-400">Left 10mm • 5mm sides</div>
            </button>
          </div>

          {/* Margin Sliders */}
          <div className="space-y-3.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Left Margin (Filing & Binding edge)</span>
                <span className="font-mono text-blue-400 font-black">{margins.leftMm} mm</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={margins.leftMm}
                onChange={(e) => handleUpdateMargins({ leftMm: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                <span>Right Margin</span>
                <span className="font-mono text-slate-300">{margins.rightMm} mm</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                value={margins.rightMm}
                onChange={(e) => handleUpdateMargins({ rightMm: Number(e.target.value) })}
                className="w-full accent-slate-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Top Margin</span>
                  <span className="font-mono text-slate-300">{margins.topMm} mm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={margins.topMm}
                  onChange={(e) => handleUpdateMargins({ topMm: Number(e.target.value) })}
                  className="w-full accent-slate-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                  <span>Bottom Margin</span>
                  <span className="font-mono text-slate-300">{margins.bottomMm} mm</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={margins.bottomMm}
                  onChange={(e) => handleUpdateMargins({ bottomMm: Number(e.target.value) })}
                  className="w-full accent-slate-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Business Logo & Engineer Contact Numbers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Attached Business Logo & Contacts
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Active On All Sheets
            </span>
          </div>

          {/* Official Logo Display */}
          <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="w-16 h-16 rounded-full bg-red-600 p-0.5 shadow-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={project.logoUrl || VASTHUSILPY_LOGO_DATA_URL}
                alt="Vasthusilpy Official Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-bold text-white uppercase">{project.officeName || "VASTHUSILPY KERALASSERY"}</div>
              <div className="text-[11px] text-red-400 font-semibold">Attached to 70mm title block strip</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Renders at 300dpi on every exported PDF and printed blueprint sheet.
              </p>
            </div>
          </div>

          {/* Contact Details Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Direct Engineer Phone Call Number (7012383137)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={project.engineerCallNumber || "7012383137"}
                  onChange={(e) => onUpdateProject({ ...project, engineerCallNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-blue-500 outline-none"
                  placeholder="7012383137"
                />
                <a
                  href={`tel:${project.engineerCallNumber || "7012383137"}`}
                  className="p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow"
                  title="Test Call"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Engineer WhatsApp Number (+91 88482 41463)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={project.engineerWhatsappNumber || "+918848241463"}
                  onChange={(e) => onUpdateProject({ ...project, engineerWhatsappNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-blue-500 outline-none"
                  placeholder="+918848241463"
                />
                <a
                  href={`https://wa.me/${(project.engineerWhatsappNumber || "+918848241463").replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow"
                  title="Test WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
