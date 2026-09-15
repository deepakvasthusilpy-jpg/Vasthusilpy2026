import React, { useState } from "react";
import {
  ConstructionProject,
  ConstructionSettings,
  FloorAreaEntry,
  ConstructionProjectType,
  ConstructionRoofingType,
  ConstructionFlooringType,
  ConstructionExtraWorkItem
} from "../../types";
import {
  ConstructionStorageManager,
  formatIndianCurrency
} from "../../utils/constructionStorageManager";
import {
  Building2,
  MapPin,
  Layers,
  Calculator,
  Plus,
  Trash2,
  Save,
  X,
  Wrench,
  Calendar,
  CheckCircle2,
  Archive,
  AlertTriangle
} from "lucide-react";

interface EditProjectModalProps {
  project: ConstructionProject;
  settings: ConstructionSettings;
  onSave: (updatedProject: ConstructionProject) => void;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project: initialProject,
  settings,
  onSave,
  onClose
}) => {
  const [project, setProject] = useState<ConstructionProject>({
    ...initialProject,
    floors: initialProject.floors || [
      { id: "fl_1", floorName: "Ground Floor", areaSqFt: 1200, ratePerSqFt: initialProject.baseRatePerSqFt || 2300 }
    ],
    extraWorks: initialProject.extraWorks || []
  });

  const [activeTab, setActiveTab] = useState<"general" | "floors_cost" | "extra_works" | "dates_notes">("general");
  const [isSaving, setIsSaving] = useState(false);

  // Recalculate areas and total
  const handleFloorChange = (idx: number, field: keyof FloorAreaEntry, value: any) => {
    const updatedFloors = [...project.floors];
    updatedFloors[idx] = { ...updatedFloors[idx], [field]: value };

    const totalArea = updatedFloors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
    const extraTotal = (project.extraWorks || []).reduce((sum, ew) => sum + (Number(ew.totalAmount) || 0), 0);
    const rawCost = totalArea * (project.baseRatePerSqFt || 2300);
    const finalAmount = rawCost + extraTotal;
    const effRate = totalArea > 0 ? Math.round(finalAmount / totalArea) : project.baseRatePerSqFt;

    setProject(prev => ({
      ...prev,
      floors: updatedFloors,
      totalBuiltUpArea: totalArea,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0)),
      effectiveRatePerSqFt: effRate
    }));
  };

  const handleAddFloor = () => {
    const newFloor: FloorAreaEntry = {
      id: `fl_${Date.now()}`,
      floorName: `Floor ${project.floors.length + 1}`,
      existingAreaSqFt: 0,
      proposedAreaSqFt: 600,
      areaSqFt: 600,
      ratePerSqFt: project.baseRatePerSqFt || 2300,
      remarks: ""
    };
    const updatedFloors = [...project.floors, newFloor];
    const totalArea = updatedFloors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
    const extraTotal = (project.extraWorks || []).reduce((sum, ew) => sum + (Number(ew.totalAmount) || 0), 0);
    const finalAmount = totalArea * project.baseRatePerSqFt + extraTotal;

    setProject(prev => ({
      ...prev,
      floors: updatedFloors,
      totalBuiltUpArea: totalArea,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0))
    }));
  };

  const handleRemoveFloor = (idx: number) => {
    if (project.floors.length <= 1) return;
    const updatedFloors = project.floors.filter((_, i) => i !== idx);
    const totalArea = updatedFloors.reduce((sum, f) => sum + (Number(f.areaSqFt) || 0), 0);
    const extraTotal = (project.extraWorks || []).reduce((sum, ew) => sum + (Number(ew.totalAmount) || 0), 0);
    const finalAmount = totalArea * project.baseRatePerSqFt + extraTotal;

    setProject(prev => ({
      ...prev,
      floors: updatedFloors,
      totalBuiltUpArea: totalArea,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0))
    }));
  };

  // Base rate changes
  const handleBaseRateChange = (newRate: number) => {
    const totalArea = project.totalBuiltUpArea;
    const extraTotal = (project.extraWorks || []).reduce((sum, ew) => sum + (Number(ew.totalAmount) || 0), 0);
    const finalAmount = totalArea * newRate + extraTotal;

    setProject(prev => ({
      ...prev,
      baseRatePerSqFt: newRate,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0)),
      effectiveRatePerSqFt: totalArea > 0 ? Math.round(finalAmount / totalArea) : newRate
    }));
  };

  // Extra works handling
  const handleAddExtraWork = (preset?: { name: string; nameMl: string; rate: number; unit: string; qty: number }) => {
    const newItem: ConstructionExtraWorkItem = {
      id: `ew_${Date.now()}`,
      name: preset?.name || "Additional Work",
      nameMl: preset?.nameMl || "അധിക ജോലി",
      floorOrArea: "Ground Floor",
      category: "CIVIL",
      quantity: preset?.qty || 1,
      unit: preset?.unit || "LS",
      unitRate: preset?.rate || 10000,
      totalAmount: (preset?.qty || 1) * (preset?.rate || 10000),
      isIncluded: true,
      status: "APPROVED",
      paymentStatus: "PENDING",
      remarks: "",
      addedDate: new Date().toISOString().slice(0, 10)
    };

    const updatedExtra = [...(project.extraWorks || []), newItem];
    const extraTotal = updatedExtra.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
    const finalAmount = project.totalBuiltUpArea * project.baseRatePerSqFt + extraTotal;

    setProject(prev => ({
      ...prev,
      extraWorks: updatedExtra,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0)),
      effectiveRatePerSqFt: prev.totalBuiltUpArea > 0 ? Math.round(finalAmount / prev.totalBuiltUpArea) : prev.baseRatePerSqFt
    }));
  };

  const handleUpdateExtraWork = (idx: number, updates: Partial<ConstructionExtraWorkItem>) => {
    const updatedExtra = [...(project.extraWorks || [])];
    const current = updatedExtra[idx];
    const updated = { ...current, ...updates };

    if (updates.quantity !== undefined || updates.unitRate !== undefined) {
      const q = updates.quantity !== undefined ? updates.quantity : current.quantity;
      const r = updates.unitRate !== undefined ? updates.unitRate : current.unitRate;
      updated.totalAmount = Math.round(q * r);
    }

    updatedExtra[idx] = updated;
    const extraTotal = updatedExtra.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
    const finalAmount = project.totalBuiltUpArea * project.baseRatePerSqFt + extraTotal;

    setProject(prev => ({
      ...prev,
      extraWorks: updatedExtra,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0)),
      effectiveRatePerSqFt: prev.totalBuiltUpArea > 0 ? Math.round(finalAmount / prev.totalBuiltUpArea) : prev.baseRatePerSqFt
    }));
  };

  const handleRemoveExtraWork = (idx: number) => {
    const updatedExtra = (project.extraWorks || []).filter((_, i) => i !== idx);
    const extraTotal = updatedExtra.reduce((s, it) => s + (Number(it.totalAmount) || 0), 0);
    const finalAmount = project.totalBuiltUpArea * project.baseRatePerSqFt + extraTotal;

    setProject(prev => ({
      ...prev,
      extraWorks: updatedExtra,
      finalContractAmount: finalAmount,
      balanceAmount: Math.max(0, finalAmount - (prev.totalReceived || 0)),
      effectiveRatePerSqFt: prev.totalBuiltUpArea > 0 ? Math.round(finalAmount / prev.totalBuiltUpArea) : prev.baseRatePerSqFt
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const updatedProject: ConstructionProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };
    const saved = ConstructionStorageManager.saveProject(updatedProject);
    onSave(saved);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-2xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">പ്രോജക്ട് വിവരങ്ങൾ തിരുത്തുക (Edit Project)</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
                  {project.projectNo}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {project.client.clientName} | {project.client.localBody}, {project.client.district}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "general", label: "1. ക്ലയന്റ് & ശൈലി (Client & Specs)" },
            { id: "floors_cost", label: "2. ഫ്ലോറുകൾ & തുക (Floors & Cost)" },
            { id: "extra_works", label: `3. അധിക ജോലികൾ (${(project.extraWorks || []).length})` },
            { id: "dates_notes", label: "4. സ്റ്റാറ്റസ് & തീയതികൾ (Status & Dates)" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
          {/* TAB 1: CLIENT & SPECS */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-indigo-400 font-bold text-sm border-b border-slate-800 pb-2">
                  ക്ലയന്റ് വിവരങ്ങൾ (Client Details)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ക്ലയന്റിന്റെ പേര് (Name) *</label>
                    <input
                      type="text"
                      value={project.client.clientName}
                      onChange={e => setProject({
                        ...project,
                        client: { ...project.client, clientName: e.target.value }
                      })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-sans font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">മൊബൈൽ നമ്പർ (Mobile) *</label>
                    <input
                      type="tel"
                      value={project.client.mobileNumber}
                      onChange={e => setProject({
                        ...project,
                        client: { ...project.client, mobileNumber: e.target.value }
                      })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">വീട്ടുപേര് (House Name)</label>
                    <input
                      type="text"
                      value={project.client.houseName || ""}
                      onChange={e => setProject({
                        ...project,
                        client: { ...project.client, houseName: e.target.value }
                      })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി</label>
                    <input
                      type="text"
                      value={project.client.localBody}
                      onChange={e => setProject({
                        ...project,
                        client: { ...project.client, localBody: e.target.value }
                      })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ജില്ല (District)</label>
                    <input
                      type="text"
                      value={project.client.district}
                      onChange={e => setProject({
                        ...project,
                        client: { ...project.client, district: e.target.value }
                      })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">സൈറ്റ് ലൊക്കേഷൻ (Site Address)</label>
                    <input
                      type="text"
                      value={project.location?.fullAddress || project.client.siteAddress || ""}
                      onChange={e => setProject({
                        ...project,
                        location: { ...project.location, fullAddress: e.target.value },
                        client: { ...project.client, siteAddress: e.target.value }
                      })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Building Spec Types */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-amber-400 font-bold text-sm border-b border-slate-800 pb-2">
                  നിർമ്മാണ ശൈലികൾ (Construction Specifications)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">പ്രോജക്ട് തരം (Type)</label>
                    <select
                      value={project.projectType}
                      onChange={e => setProject({ ...project, projectType: e.target.value as ConstructionProjectType })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="New Construction">New Construction</option>
                      <option value="Addition">Addition</option>
                      <option value="Extension">Extension</option>
                      <option value="Renovation">Renovation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">മേൽക്കൂര (Roofing)</label>
                    <select
                      value={project.roofingType}
                      onChange={e => setProject({ ...project, roofingType: e.target.value as ConstructionRoofingType })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="Contemporary">Contemporary</option>
                      <option value="Flat Roof">Flat Roof</option>
                      <option value="Sloped Roof">Sloped Roof</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ഫ്ലോറിംഗ് (Flooring)</label>
                    <select
                      value={project.flooringType}
                      onChange={e => setProject({ ...project, flooringType: e.target.value as ConstructionFlooringType })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="Granite">Granite</option>
                      <option value="Tile">Vitrified Tile</option>
                      <option value="Kavi">Red Oxide / Kavi</option>
                      <option value="Advanced / Premium">Premium Italian / Composite</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLOORS & COST BREAKDOWN */}
          {activeTab === "floors_cost" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>നിലകൾ തിരിച്ചുള്ള വിസ്തീർണ്ണം & നിരക്കുകൾ (Floor Areas & Rates)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFloor}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ ഫ്ലോർ ചേർക്കുക</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {project.floors.map((floor, idx) => (
                    <div key={floor.id || idx} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <input
                          type="text"
                          value={floor.floorName}
                          onChange={e => handleFloorChange(idx, "floorName", e.target.value)}
                          className="font-bold text-white bg-transparent focus:border-indigo-400 focus:outline-none w-1/2 font-mono"
                        />
                        {project.floors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFloor(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono uppercase">Existing (Sq.Ft)</label>
                          <input
                            type="number"
                            value={floor.existingAreaSqFt || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const total = val + (floor.proposedAreaSqFt || 0);
                              handleFloorChange(idx, "existingAreaSqFt", val);
                              handleFloorChange(idx, "areaSqFt", total);
                            }}
                            className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-right text-slate-300 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono uppercase">Proposed (Sq.Ft)</label>
                          <input
                            type="number"
                            value={floor.proposedAreaSqFt || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const total = (floor.existingAreaSqFt || 0) + val;
                              handleFloorChange(idx, "proposedAreaSqFt", val);
                              handleFloorChange(idx, "areaSqFt", total);
                            }}
                            className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-right text-emerald-400 font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Total Floor Area:</span>
                        <span className="text-sm font-black text-white font-mono">{floor.areaSqFt.toLocaleString()} Sq.Ft</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Area */}
                <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl flex justify-between items-center font-bold">
                  <span className="text-slate-300">ആകെ വിസ്തീർണ്ണം (Total Area):</span>
                  <span className="text-indigo-400 text-sm">{project.totalBuiltUpArea.toLocaleString()} Sq.Ft</span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-emerald-400 font-bold text-sm border-b border-slate-800 pb-2">
                  സാമ്പത്തിക വിവരങ്ങൾ (Financial Setup)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">അടിസ്ഥാന നിരക്ക് (Base Rate / Sq.Ft):</label>
                    <input
                      type="number"
                      value={project.baseRatePerSqFt}
                      onChange={e => handleBaseRateChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ആകെ കരാർ തുക (Final Contract Amount):</label>
                    <div className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-base text-emerald-400">
                      {formatIndianCurrency(project.finalContractAmount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXTRA WORKS (MULTIPLE ITEMS SUPPORT) */}
          {activeTab === "extra_works" && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-2 gap-2">
                <div>
                  <div className="font-bold text-sm text-amber-400 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>അധിക നിർമ്മാണ ജോലികൾ (Additional Works / Variation Orders)</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    ഏതൊരു പ്രോജക്റ്റിലും ഒന്നിൽ കൂടുതൽ അധിക ജോലികൾ ചേർക്കാം.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddExtraWork()}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ അധിക ജോലി ചേർക്കുക</span>
                </button>
              </div>

              {/* Quick Presets for Multiple Works */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] text-slate-400 shrink-0">ദ്രുത പ്രീസെറ്റുകൾ (Quick Add):</span>
                {[
                  { name: "Compound Wall & Gate", nameMl: "ചുറ്റുമതിൽ & ഗേറ്റ്", rate: 850, unit: "R.Ft", qty: 120 },
                  { name: "Well Digging & Concrete Rings", nameMl: "കിണർ കുഴിക്കൽ & റിംഗ്", rate: 60000, unit: "LS", qty: 1 },
                  { name: "Interlock Paving Yard", nameMl: "മുറ്റത്ത് ഇന്റർലോക്ക് ടൈൽസ്", rate: 75, unit: "Sq.Ft", qty: 500 },
                  { name: "Modular Kitchen & Chimney", nameMl: "മോഡുലാർ കിച്ചൻ കാബിനറ്റ്സ്", rate: 135000, unit: "LS", qty: 1 },
                  { name: "Solar Rooftop (3kW)", nameMl: "സോളാർ റൂഫ്‌ടോപ്പ് പവർ", rate: 175000, unit: "LS", qty: 1 },
                  { name: "Pergola / Car Porch Polycarbonate", nameMl: "പോർച്ച് പെർഗോള ഷീറ്റ്", rate: 45000, unit: "LS", qty: 1 }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddExtraWork(preset)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 rounded-lg text-[11px] whitespace-nowrap cursor-pointer transition"
                  >
                    + {preset.nameMl}
                  </button>
                ))}
              </div>

              {/* Extra Works List */}
              <div className="space-y-3">
                {(project.extraWorks || []).length > 0 ? (
                  project.extraWorks!.map((work, idx) => (
                    <div key={work.id || idx} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-3">
                          <label className="text-[10px] text-slate-500 block">ജോലിയുടെ പേര് (Name):</label>
                          <input
                            type="text"
                            value={work.nameMl || work.name}
                            onChange={e => handleUpdateExtraWork(idx, { nameMl: e.target.value, name: e.target.value })}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-sans font-bold"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">സ്ഥലം/ഫ്ലോർ (Area):</label>
                          <input
                            type="text"
                            value={work.floorOrArea || "Ground Floor"}
                            onChange={e => handleUpdateExtraWork(idx, { floorOrArea: e.target.value })}
                            placeholder="e.g. Yard, Terrace"
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">അളവ് (Qty):</label>
                          <input
                            type="number"
                            value={work.quantity}
                            onChange={e => handleUpdateExtraWork(idx, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-right"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="text-[10px] text-slate-500 block">യൂണിറ്റ്:</label>
                          <input
                            type="text"
                            value={work.unit}
                            onChange={e => handleUpdateExtraWork(idx, { unit: e.target.value })}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-center"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-500 block">യൂണിറ്റ് നിരക്ക് (Rate):</label>
                          <input
                            type="number"
                            value={work.unitRate}
                            onChange={e => handleUpdateExtraWork(idx, { unitRate: parseFloat(e.target.value) || 0 })}
                            className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-right"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <label className="text-[10px] text-slate-500 block">ആകെ:</label>
                          <div className="text-emerald-400 font-bold text-xs mt-2">
                            {formatIndianCurrency(work.totalAmount)}
                          </div>
                        </div>
                        <div className="sm:col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveExtraWork(idx)}
                            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition cursor-pointer mt-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                    അധിക ജോലികൾ ഒന്നും ചേർത്തിട്ടില്ല. ആവശ്യമെങ്കിൽ മുകളിലെ ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STATUS, DATES & NOTES */}
          {activeTab === "dates_notes" && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="text-cyan-400 font-bold text-sm border-b border-slate-800 pb-2">
                  പ്രോജക്ട് നിലയും തീയതികളും (Project Status & Timeline)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">നിലവിലെ സ്റ്റാറ്റസ് (Status):</label>
                    <select
                      value={project.status}
                      onChange={e => {
                        const newStatus = e.target.value as any;
                        setProject({
                          ...project,
                          status: newStatus,
                          isArchived: newStatus === "ARCHIVED" ? true : project.isArchived
                        });
                      }}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                    >
                      <option value="IN_PROGRESS">IN_PROGRESS (പുരോഗമിക്കുന്നു)</option>
                      <option value="PLANNING">PLANNING (പ്ലാനിംഗ് ഘട്ടം)</option>
                      <option value="COMPLETED">COMPLETED (പൂർത്തിയായി)</option>
                      <option value="ON_HOLD">ON_HOLD (നിർത്തിവെച്ചിരിക്കുന്നു)</option>
                      <option value="ARCHIVED">ARCHIVED (ആർക്കൈവ് ചെയ്തു)</option>
                      <option value="CANCELLED">CANCELLED (റദ്ദാക്കി)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">നിലവിലെ ഘട്ടം (Current Stage):</label>
                    <select
                      value={project.currentStage}
                      onChange={e => setProject({ ...project, currentStage: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-indigo-300 font-bold"
                    >
                      {settings.stages.map(st => (
                        <option key={st.id} value={st.name}>
                          {st.name} ({st.defaultPercentage}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ആരംഭിച്ച തീയതി (Start Date):</label>
                    <input
                      type="date"
                      value={project.startDate || ""}
                      onChange={e => setProject({ ...project, startDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">പൂർത്തീകരണ തീയതി (Target Date):</label>
                    <input
                      type="date"
                      value={project.targetCompletionDate || ""}
                      onChange={e => setProject({ ...project, targetCompletionDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-slate-400 block mb-1">പ്രോജക്ട് കുറിപ്പുകൾ (Notes / Remarks):</label>
                  <textarea
                    rows={3}
                    value={project.notes || ""}
                    onChange={e => setProject({ ...project, notes: e.target.value })}
                    placeholder="പ്രത്യേക നിർദ്ദേശങ്ങൾ, പേയ്മെന്റ് രീതികൾ, കരാർ നിബന്ധനകൾ..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 flex justify-between items-center gap-3">
          <div className="text-xs text-slate-400 font-mono">
            ആകെ തുക: <strong className="text-emerald-400 text-sm">{formatIndianCurrency(project.finalContractAmount)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ക്യാൻസൽ (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-950"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "സേവ് ചെയ്യുന്നു..." : "മാറ്റങ്ങൾ സേവ് ചെയ്യുക (Save Changes)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
