import React, { useState } from "react";
import { BuildingPlanProject, PlanSheet, AreaTableRow, RevisionTableRow, VasthuKolGrade } from "../../types/buildingPlanTemplate";
import { INITIAL_PRESETS_ENGINEERS } from "../../data/estimateData";
import {
  Building2,
  UserCheck,
  MapPin,
  Table,
  Compass,
  History,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Upload,
  CheckCircle2,
  Sliders
} from "lucide-react";

interface TitleBlockEditorProps {
  project: BuildingPlanProject;
  activeSheet: PlanSheet;
  onUpdateProject: (updatedProject: BuildingPlanProject) => void;
  onUpdateActiveSheet: (updatedSheet: PlanSheet) => void;
  onApplyToAllSheets: () => void;
}

export const TitleBlockEditor: React.FC<TitleBlockEditorProps> = ({
  project,
  activeSheet,
  onUpdateProject,
  onUpdateActiveSheet,
  onApplyToAllSheets
}) => {
  const [activeTab, setActiveTab] = useState<"project" | "engineer" | "branding" | "area" | "vasthu" | "revisions">("project");

  // Handle engineer preset select
  const handleSelectEngineerPreset = (presetKey: string) => {
    const engineer = INITIAL_PRESETS_ENGINEERS.find((e) => e.id === presetKey);
    if (!engineer) return;

    onUpdateProject({
      ...project,
      licenseeName: engineer.fullName,
      licenseNumber: engineer.designation,
      registrationNumber: engineer.regNo || "",
      departmentAuthority: engineer.department || "Dept. of Urban Affairs, Govt. of Kerala"
    });
  };

  // Add Row to Area Table
  const handleAddAreaRow = () => {
    const newRow: AreaTableRow = {
      id: `row-${Date.now()}`,
      floor: "Additional Floor",
      proposedBuiltUpSqM: 0,
      proposedFloorAreaSqM: 0,
      existingBuiltUpSqM: 0,
      existingFloorAreaSqM: 0,
      proposedSqM: 0,
      proposedSqFt: 0,
      existingSqM: 0,
      existingSqFt: 0,
      builtUpSqM: 0,
      builtUpSqFt: 0,
      floorAreaSqM: 0,
      floorAreaSqFt: 0
    };
    onUpdateProject({
      ...project,
      areaTable: [...project.areaTable, newRow]
    });
  };

  // Update Area Table Row
  const handleUpdateAreaRow = (id: string, field: keyof AreaTableRow, value: any) => {
    const updated = project.areaTable.map((row) => {
      if (row.id !== id) return row;
      const updatedRow = { ...row, [field]: value };
      const numVal = Number(value) || 0;

      if (field === "proposedBuiltUpSqM") {
        updatedRow.proposedBuiltUpSqM = numVal;
        updatedRow.builtUpSqM = numVal;
        updatedRow.proposedSqM = numVal;
        updatedRow.builtUpSqFt = Number((numVal * 10.7639).toFixed(2));
        updatedRow.proposedSqFt = updatedRow.builtUpSqFt;
      } else if (field === "proposedFloorAreaSqM") {
        updatedRow.proposedFloorAreaSqM = numVal;
        updatedRow.floorAreaSqM = numVal;
        updatedRow.floorAreaSqFt = Number((numVal * 10.7639).toFixed(2));
      } else if (field === "existingBuiltUpSqM") {
        updatedRow.existingBuiltUpSqM = numVal;
        updatedRow.existingSqM = numVal;
        updatedRow.existingSqFt = Number((numVal * 10.7639).toFixed(2));
      } else if (field === "existingFloorAreaSqM") {
        updatedRow.existingFloorAreaSqM = numVal;
      }

      return updatedRow;
    });

    onUpdateProject({ ...project, areaTable: updated });
  };

  // Remove Area Row
  const handleRemoveAreaRow = (id: string) => {
    onUpdateProject({
      ...project,
      areaTable: project.areaTable.filter((r) => r.id !== id)
    });
  };

  // Add Revision
  const handleAddRevision = () => {
    const nextRevNo = `R${project.revisionTable.length}`;
    const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
    const newRev: RevisionTableRow = {
      id: `rev-${Date.now()}`,
      rev: nextRevNo,
      date: today,
      description: "Plan Revision",
      preparedBy: "CD",
      checkedBy: "DC"
    };
    onUpdateProject({
      ...project,
      revisionTable: [...project.revisionTable, newRev]
    });
  };

  // Remove Revision
  const handleRemoveRevision = (id: string) => {
    onUpdateProject({
      ...project,
      revisionTable: project.revisionTable.filter((r) => r.id !== id)
    });
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateProject({
        ...project,
        logoUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Banner & Position Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Title Block Details & Configuration</span>
          </h3>
          <p className="text-xs text-slate-400">
            Customize variables (Right-Side 70mm Strip or Bottom Strip)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout Strip Selector */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => onUpdateProject({ ...project, titleBlockPosition: "right" })}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                project.titleBlockPosition === "right"
                  ? "bg-cyan-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Right Strip (70mm)
            </button>
            <button
              onClick={() => onUpdateProject({ ...project, titleBlockPosition: "bottom" })}
              className={`px-3 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                project.titleBlockPosition === "bottom"
                  ? "bg-cyan-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bottom Strip
            </button>
          </div>

          <button
            onClick={onApplyToAllSheets}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Copy common client, engineer, and office details to every sheet in this project"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Apply to All Sheets</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab("project")}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === "project" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Project & Drawing</span>
        </button>

        <button
          onClick={() => setActiveTab("engineer")}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === "engineer" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Licensed Professional</span>
        </button>

        <button
          onClick={() => setActiveTab("branding")}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === "branding" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Office Branding</span>
        </button>

        <button
          onClick={() => setActiveTab("area")}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === "area" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Area Table ({project.areaTable.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("vasthu")}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === "vasthu" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Vasthu Kol Alavu</span>
        </button>

        <button
          onClick={() => setActiveTab("revisions")}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === "revisions" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Revisions ({project.revisionTable.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. Project & Drawing Info */}
      {activeTab === "project" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Client Name <span className="text-cyan-400">{"{{CLIENT_NAME}}"}</span>
              </label>
              <input
                type="text"
                value={project.clientName}
                onChange={(e) => onUpdateProject({ ...project, clientName: e.target.value })}
                placeholder="e.g. Sri. Ussainar & Smt. Khadeeja"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Project Location <span className="text-cyan-400">{"{{PROJECT_LOCATION}}"}</span>
              </label>
              <input
                type="text"
                value={project.projectLocation}
                onChange={(e) => onUpdateProject({ ...project, projectLocation: e.target.value })}
                placeholder="e.g. Kongad Grama Panchayat, Palakkad"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-3">
            <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Current Active Sheet: Sheet {activeSheet.sheetNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Drawing Name <span className="text-cyan-400">{"{{DRAWING_NAME}}"}</span>
                </label>
                <input
                  type="text"
                  value={activeSheet.drawingName}
                  onChange={(e) => onUpdateActiveSheet({ ...activeSheet, drawingName: e.target.value })}
                  placeholder="e.g. PROPOSED GROUND FLOOR PLAN"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Floor Name <span className="text-cyan-400">{"{{FLOOR_NAME}}"}</span>
                </label>
                <input
                  type="text"
                  value={activeSheet.floorName}
                  onChange={(e) => onUpdateActiveSheet({ ...activeSheet, floorName: e.target.value })}
                  placeholder="e.g. Ground Floor Plan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Drawing Number <span className="text-cyan-400">{"{{DRAWING_NUMBER}}"}</span>
                </label>
                <input
                  type="text"
                  value={activeSheet.drawingNumber}
                  onChange={(e) => onUpdateActiveSheet({ ...activeSheet, drawingNumber: e.target.value })}
                  placeholder="e.g. DWG-2026/01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Scale <span className="text-cyan-400">{"{{SCALE}}"}</span>
                </label>
                <input
                  type="text"
                  value={activeSheet.scale}
                  onChange={(e) => onUpdateActiveSheet({ ...activeSheet, scale: e.target.value })}
                  placeholder="e.g. 1 : 100"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Date <span className="text-cyan-400">{"{{DATE}}"}</span>
                </label>
                <input
                  type="text"
                  value={activeSheet.date}
                  onChange={(e) => onUpdateActiveSheet({ ...activeSheet, date: e.target.value })}
                  placeholder="e.g. 07-09-2026"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">
                  Revision <span className="text-cyan-400">{"{{REVISION}}"}</span>
                </label>
                <input
                  type="text"
                  value={activeSheet.revision}
                  onChange={(e) => onUpdateActiveSheet({ ...activeSheet, revision: e.target.value })}
                  placeholder="e.g. R0 or R1"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Licensed Professional Block */}
      {activeTab === "engineer" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Quick Engineer Presets:</span>
            <div className="flex gap-2">
              {INITIAL_PRESETS_ENGINEERS.map((eng) => (
                <button
                  key={eng.id}
                  onClick={() => handleSelectEngineerPreset(eng.id)}
                  className="text-[11px] font-mono px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500 rounded-lg transition-all cursor-pointer"
                >
                  {eng.fullName.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Licensee Name <span className="text-cyan-400">{"{{LICENSEY_NAME}}"}</span>
              </label>
              <input
                type="text"
                value={project.licenseeName}
                onChange={(e) => onUpdateProject({ ...project, licenseeName: e.target.value })}
                placeholder="e.g. DEEPAK .C"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                License / Designation <span className="text-cyan-400">{"{{LICENSE_NUMBER}}"}</span>
              </label>
              <input
                type="text"
                value={project.licenseNumber}
                onChange={(e) => onUpdateProject({ ...project, licenseNumber: e.target.value })}
                placeholder="e.g. SUPERVISOR-A (Civil) or Building Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Registration Number <span className="text-cyan-400">{"{{REGISTRATION_NUMBER}}"}</span>
              </label>
              <input
                type="text"
                value={project.registrationNumber}
                onChange={(e) => onUpdateProject({ ...project, registrationNumber: e.target.value })}
                placeholder="e.g. E-2050/08/14087/KKD/318/2018/CA"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Department / Authority
              </label>
              <input
                type="text"
                value={project.departmentAuthority}
                onChange={(e) => onUpdateProject({ ...project, departmentAuthority: e.target.value })}
                placeholder="e.g. Dept. of Urban Affairs, Govt. of Kerala"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">
                  Engineer Phone Call (7012383137)
                </label>
                <input
                  type="text"
                  value={project.engineerCallNumber || "7012383137"}
                  onChange={(e) => onUpdateProject({ ...project, engineerCallNumber: e.target.value })}
                  placeholder="7012383137"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">
                  Engineer WhatsApp (8848241463)
                </label>
                <input
                  type="text"
                  value={project.engineerWhatsappNumber || "+918848241463"}
                  onChange={(e) => onUpdateProject({ ...project, engineerWhatsappNumber: e.target.value })}
                  placeholder="+918848241463"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-emerald-400 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Office Branding */}
      {activeTab === "branding" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Office / Firm Name <span className="text-cyan-400">{"{{OFFICE_NAME}}"}</span>
              </label>
              <input
                type="text"
                value={project.officeName}
                onChange={(e) => onUpdateProject({ ...project, officeName: e.target.value })}
                placeholder="e.g. VASTHU SHASTRA & ARCHITECTURAL CONSULTANCY"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold font-sans uppercase"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-mono text-slate-300 block mb-1">Office Address</label>
              <input
                type="text"
                value={project.officeAddress}
                onChange={(e) => onUpdateProject({ ...project, officeAddress: e.target.value })}
                placeholder="e.g. Main Road, Kongad, Palakkad - 678631, Kerala"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Office Mobile</label>
              <input
                type="text"
                value={project.officeMobile}
                onChange={(e) => onUpdateProject({ ...project, officeMobile: e.target.value })}
                placeholder="e.g. +91 94477 12345"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Office WhatsApp (8848241463)</label>
              <input
                type="text"
                value={project.engineerWhatsappNumber || "+918848241463"}
                onChange={(e) => onUpdateProject({ ...project, engineerWhatsappNumber: e.target.value })}
                placeholder="+918848241463"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono text-emerald-400 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Email</label>
              <input
                type="email"
                value={project.officeEmail}
                onChange={(e) => onUpdateProject({ ...project, officeEmail: e.target.value })}
                placeholder="e.g. deepak.vasthusilpy@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Website (optional)</label>
              <input
                type="text"
                value={project.officeWebsite}
                onChange={(e) => onUpdateProject({ ...project, officeWebsite: e.target.value })}
                placeholder="e.g. www.vasthusilpy.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Upload Logo Image</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl text-xs text-slate-300 cursor-pointer transition-all">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Logo File</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {project.logoUrl && (
                  <img src={project.logoUrl} alt="Logo" className="w-8 h-8 rounded border border-slate-700 object-contain bg-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Area Table Grid */}
      {activeTab === "area" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Floor wise area breakdown. Values are auto-summed for the total row.
            </p>
            <button
              onClick={handleAddAreaRow}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Floor Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-950 text-[10px] font-mono uppercase border-b border-slate-800">
                <tr className="border-b border-slate-800/80">
                  <th rowSpan={2} className="p-2 border-r border-slate-800 text-slate-300">
                    Floor
                  </th>
                  <th colSpan={2} className="p-2 border-r border-slate-800 text-center bg-blue-950/30 text-blue-300 font-bold">
                    Proposed (sqm)
                  </th>
                  <th colSpan={2} className="p-2 border-r border-slate-800 text-center bg-emerald-950/30 text-emerald-300 font-bold">
                    Existing (sqm)
                  </th>
                  <th rowSpan={2} className="p-2 text-right text-slate-400">
                    Action
                  </th>
                </tr>
                <tr className="bg-slate-900/80 text-slate-400 text-[9px]">
                  <th className="p-1.5 border-r border-slate-800 text-center font-medium">Built-up Area (sqm)</th>
                  <th className="p-1.5 border-r border-slate-800 text-center font-medium">Floor Area (sqm)</th>
                  <th className="p-1.5 border-r border-slate-800 text-center font-medium">Built-up Area (sqm)</th>
                  <th className="p-1.5 border-r border-slate-800 text-center font-medium">Floor Area (sqm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {project.areaTable.map((row) => {
                  const pBuiltUp = row.proposedBuiltUpSqM ?? row.builtUpSqM ?? row.proposedSqM ?? 0;
                  const pFloorArea = row.proposedFloorAreaSqM ?? row.floorAreaSqM ?? 0;
                  const eBuiltUp = row.existingBuiltUpSqM ?? row.existingSqM ?? 0;
                  const eFloorArea = row.existingFloorAreaSqM ?? 0;

                  return (
                    <tr key={row.id} className="hover:bg-slate-900/40">
                      <td className="p-1.5 border-r border-slate-800/60">
                        <input
                          type="text"
                          value={row.floor}
                          onChange={(e) => handleUpdateAreaRow(row.id, "floor", e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white w-32 font-medium"
                          placeholder="e.g. Ground Floor"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800/60 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={pBuiltUp}
                          onChange={(e) => handleUpdateAreaRow(row.id, "proposedBuiltUpSqM", parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white w-24 font-mono font-bold text-center"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800/60 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={pFloorArea}
                          onChange={(e) => handleUpdateAreaRow(row.id, "proposedFloorAreaSqM", parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white w-24 font-mono text-center"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800/60 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={eBuiltUp}
                          onChange={(e) => handleUpdateAreaRow(row.id, "existingBuiltUpSqM", parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white w-24 font-mono text-center"
                        />
                      </td>
                      <td className="p-1.5 border-r border-slate-800/60 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={eFloorArea}
                          onChange={(e) => handleUpdateAreaRow(row.id, "existingFloorAreaSqM", parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white w-24 font-mono text-center"
                        />
                      </td>
                      <td className="p-1.5 text-right">
                        <button
                          onClick={() => handleRemoveAreaRow(row.id)}
                          className="p-1 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                          title="Delete Row"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary Footer */}
              <tfoot className="bg-slate-950 font-mono text-xs border-t-2 border-slate-700">
                <tr className="font-bold text-white">
                  <td className="p-2 border-r border-slate-800">TOTAL</td>
                  <td className="p-2 border-r border-slate-800 text-center text-cyan-400">
                    {project.areaTable.reduce((acc, r) => acc + (r.proposedBuiltUpSqM ?? r.builtUpSqM ?? r.proposedSqM ?? 0), 0).toFixed(2)} sqm
                  </td>
                  <td className="p-2 border-r border-slate-800 text-center text-slate-300">
                    {project.areaTable.reduce((acc, r) => acc + (r.proposedFloorAreaSqM ?? r.floorAreaSqM ?? 0), 0).toFixed(2)} sqm
                  </td>
                  <td className="p-2 border-r border-slate-800 text-center text-amber-400">
                    {project.areaTable.reduce((acc, r) => acc + (r.existingBuiltUpSqM ?? r.existingSqM ?? 0), 0).toFixed(2)} sqm
                  </td>
                  <td className="p-2 border-r border-slate-800 text-center text-slate-300">
                    {project.areaTable.reduce((acc, r) => acc + (r.existingFloorAreaSqM ?? 0), 0).toFixed(2)} sqm
                  </td>
                  <td className="p-2 text-right text-slate-500 text-[10px]">
                    Sum
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Vasthu Kol Alavu */}
      {activeTab === "vasthu" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-2">
              Vasthu Kol Alavu Classification (വാസ്തു അളവ് തരം)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["Uttamam", "Madhyamam", "Adhamam"] as VasthuKolGrade[]).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => onUpdateProject({ ...project, vasthuGrade: grade })}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    project.vasthuGrade === grade
                      ? "bg-emerald-950/60 border-emerald-500 text-white shadow-lg"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="font-bold text-sm">
                    {grade === "Uttamam" ? "ഉത്തമം (Uttamam)" : grade === "Madhyamam" ? "മധ്യമം (Madhyamam)" : "അധമം (Adhamam)"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {grade === "Uttamam" ? "Highly Auspicious" : grade === "Madhyamam" ? "Average / Neutral" : "Needs Remedy"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Perimeter in Kol & Viral
              </label>
              <input
                type="text"
                value={project.vasthuPerimeterKol}
                onChange={(e) => onUpdateProject({ ...project, vasthuPerimeterKol: e.target.value })}
                placeholder="e.g. 28 Kol 12 Viral"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Perimeter in Meters
              </label>
              <input
                type="text"
                value={project.vasthuPerimeterMeter}
                onChange={(e) => onUpdateProject({ ...project, vasthuPerimeterMeter: e.target.value })}
                placeholder="e.g. 20.65 m"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-mono text-slate-300 block mb-1">
                Vasthu Ayadi Shadvarga Remarks
              </label>
              <input
                type="text"
                value={project.vasthuRemarks}
                onChange={(e) => onUpdateProject({ ...project, vasthuRemarks: e.target.value })}
                placeholder="e.g. Dhana Yoni (1), Aswathy Nakshatram, Shuba Phalam"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Revision Table Grid */}
      {activeTab === "revisions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Revision history log printed inside the right-hand title block strip.
            </p>
            <button
              onClick={handleAddRevision}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Revision</span>
            </button>
          </div>

          <div className="space-y-2">
            {project.revisionTable.map((rev) => (
              <div key={rev.id} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="text"
                  value={rev.rev}
                  onChange={(e) => {
                    const updated = project.revisionTable.map((r) =>
                      r.id === rev.id ? { ...r, rev: e.target.value } : r
                    );
                    onUpdateProject({ ...project, revisionTable: updated });
                  }}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono font-bold"
                  placeholder="Rev"
                />
                <input
                  type="text"
                  value={rev.date}
                  onChange={(e) => {
                    const updated = project.revisionTable.map((r) =>
                      r.id === rev.id ? { ...r, date: e.target.value } : r
                    );
                    onUpdateProject({ ...project, revisionTable: updated });
                  }}
                  className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  placeholder="Date"
                />
                <input
                  type="text"
                  value={rev.description}
                  onChange={(e) => {
                    const updated = project.revisionTable.map((r) =>
                      r.id === rev.id ? { ...r, description: e.target.value } : r
                    );
                    onUpdateProject({ ...project, revisionTable: updated });
                  }}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  placeholder="Description"
                />
                <input
                  type="text"
                  value={rev.preparedBy}
                  onChange={(e) => {
                    const updated = project.revisionTable.map((r) =>
                      r.id === rev.id ? { ...r, preparedBy: e.target.value } : r
                    );
                    onUpdateProject({ ...project, revisionTable: updated });
                  }}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  placeholder="Prep"
                />
                <input
                  type="text"
                  value={rev.checkedBy}
                  onChange={(e) => {
                    const updated = project.revisionTable.map((r) =>
                      r.id === rev.id ? { ...r, checkedBy: e.target.value } : r
                    );
                    onUpdateProject({ ...project, revisionTable: updated });
                  }}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  placeholder="Chk"
                />
                <button
                  onClick={() => handleRemoveRevision(rev.id)}
                  className="p-1 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
