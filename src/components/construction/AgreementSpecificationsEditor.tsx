import React, { useState } from "react";
import {
  DetailedWorkSpecifications,
  SanitaryItemSpec,
  ElectricalPointSpec,
  FlooringAreaSpec,
  DoorWindowItemSpec,
  CustomSpecItem
} from "../../types";
import { formatIndianCurrency } from "../../utils/constructionStorageManager";
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Droplets,
  Zap,
  Grid,
  Paintbrush,
  DoorClosed,
  Hammer,
  Shield,
  Search,
  Check,
  X,
  FileText
} from "lucide-react";

interface AgreementSpecificationsEditorProps {
  specifications: DetailedWorkSpecifications;
  onChange: (updatedSpecs: DetailedWorkSpecifications) => void;
  readOnly?: boolean;
}

interface CustomItemModalState {
  section: "substructure" | "superstructure" | "customSpecs";
  index: number; // -1 for new item
  id: string;
  title: string;
  titleMl: string;
  category?: string;
  specification: string;
  remarks?: string;
  rateOrCost?: number;
  isIncluded?: boolean;
}

export const AgreementSpecificationsEditor: React.FC<AgreementSpecificationsEditorProps> = ({
  specifications: specs,
  onChange,
  readOnly = false
}) => {
  const [activeCategory, setActiveCategory] = useState<
    | "substructure"
    | "superstructure"
    | "sanitary"
    | "electrical"
    | "flooring"
    | "painting"
    | "doorsWindows"
    | "customSpecs"
  >("substructure");

  const [searchTerm, setSearchTerm] = useState("");
  const [customItemModal, setCustomItemModal] = useState<CustomItemModalState | null>(null);

  // Substructure & Superstructure Handlers
  const handleUpdateSubstructure = (field: keyof typeof specs.substructure, val: any) => {
    onChange({
      ...specs,
      substructure: {
        ...specs.substructure,
        [field]: val
      }
    });
  };

  const handleUpdateSuperstructure = (field: keyof typeof specs.superstructure, val: any) => {
    onChange({
      ...specs,
      superstructure: {
        ...specs.superstructure,
        [field]: val
      }
    });
  };

  // Save modal edit / new custom item
  const handleSaveModalCustomItem = () => {
    if (!customItemModal) return;
    const { section, index, id, title, titleMl, category, specification, remarks, rateOrCost, isIncluded } = customItemModal;

    if (section === "substructure") {
      const list = [...(specs.substructure.customItems || [])];
      const updatedItem = {
        id: id || `sub_c_${Date.now()}`,
        title: title.trim() || "Substructure Custom Item",
        titleMl: titleMl.trim() || title.trim(),
        specification: specification.trim() || "Standard specification details.",
        remarks: remarks?.trim() || ""
      };
      if (index >= 0 && index < list.length) {
        list[index] = updatedItem;
      } else {
        list.push(updatedItem);
      }
      handleUpdateSubstructure("customItems" as any, list);
    } else if (section === "superstructure") {
      const list = [...(specs.superstructure.customItems || [])];
      const updatedItem = {
        id: id || `sup_c_${Date.now()}`,
        title: title.trim() || "Superstructure Custom Item",
        titleMl: titleMl.trim() || title.trim(),
        specification: specification.trim() || "Standard specification details.",
        remarks: remarks?.trim() || ""
      };
      if (index >= 0 && index < list.length) {
        list[index] = updatedItem;
      } else {
        list.push(updatedItem);
      }
      handleUpdateSuperstructure("customItems" as any, list);
    } else if (section === "customSpecs") {
      const list = [...(specs.customSpecs || [])];
      const updatedItem: CustomSpecItem = {
        id: id || `cs_${Date.now()}`,
        category: category?.trim() || "Special Features",
        title: title.trim() || "Custom Specification Item",
        titleMl: titleMl.trim() || title.trim(),
        specification: specification.trim() || "Detailed technical specification.",
        brand: "",
        isIncluded: isIncluded !== undefined ? isIncluded : true,
        rateOrCost: rateOrCost || 0,
        remarks: remarks?.trim() || ""
      };
      if (index >= 0 && index < list.length) {
        list[index] = updatedItem;
      } else {
        list.push(updatedItem);
      }
      onChange({ ...specs, customSpecs: list });
    }

    setCustomItemModal(null);
  };

  // Delete from modal
  const handleDeleteModalCustomItem = () => {
    if (!customItemModal || customItemModal.index < 0) {
      setCustomItemModal(null);
      return;
    }
    const { section, index } = customItemModal;
    if (section === "substructure") {
      const list = (specs.substructure.customItems || []).filter((_, i) => i !== index);
      handleUpdateSubstructure("customItems" as any, list);
    } else if (section === "superstructure") {
      const list = (specs.superstructure.customItems || []).filter((_, i) => i !== index);
      handleUpdateSuperstructure("customItems" as any, list);
    } else if (section === "customSpecs") {
      const list = (specs.customSpecs || []).filter((_, i) => i !== index);
      onChange({ ...specs, customSpecs: list });
    }
    setCustomItemModal(null);
  };

  // ==========================================
  // SANITARY ITEMS (ADD, EDIT, DELETE)
  // ==========================================
  const handleAddSanitaryItem = (preset?: Partial<SanitaryItemSpec>) => {
    const newItem: SanitaryItemSpec = {
      id: `san_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      name: preset?.name || "New Sanitary Fitting",
      nameMl: preset?.nameMl || "പുതിയ സാനിറ്ററി ഫിറ്റിംഗ്",
      quantity: preset?.quantity || 1,
      unit: preset?.unit || "Nos",
      maxAllowedRate: preset?.maxAllowedRate || 3500,
      isIncluded: preset?.isIncluded !== undefined ? preset.isIncluded : true,
      specification: preset?.specification || "ISI standard approved brand (Jaquar / Cera / Hindware).",
      remarks: preset?.remarks || ""
    };
    onChange({
      ...specs,
      sanitary: [...specs.sanitary, newItem]
    });
  };

  const handleUpdateSanitaryItem = (index: number, fields: Partial<SanitaryItemSpec>) => {
    const copy = [...specs.sanitary];
    copy[index] = { ...copy[index], ...fields };
    onChange({ ...specs, sanitary: copy });
  };

  const handleDeleteSanitaryItem = (index: number) => {
    if (readOnly) return;
    const filtered = specs.sanitary.filter((_, i) => i !== index);
    onChange({ ...specs, sanitary: filtered });
  };

  // ==========================================
  // ELECTRICAL POINTS (ADD, EDIT, DELETE)
  // ==========================================
  const handleAddElectricalPoint = (preset?: Partial<ElectricalPointSpec>) => {
    const newPoint: ElectricalPointSpec = {
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      name: preset?.name || "New Electrical Point",
      nameMl: preset?.nameMl || "പുതിയ ഇലക്ട്രിക്കൽ പോയിന്റ്",
      pointCount: preset?.pointCount || 1,
      unitRate: preset?.unitRate || 850,
      isIncluded: preset?.isIncluded !== undefined ? preset.isIncluded : true,
      specification: preset?.specification || "Concealed copper wiring with modular switch & plate.",
      brand: preset?.brand || "Legrand / GM / Schneider",
      remarks: preset?.remarks || ""
    };
    onChange({
      ...specs,
      electrical: {
        ...specs.electrical,
        points: [...specs.electrical.points, newPoint]
      }
    });
  };

  const handleUpdateElectricalPoint = (index: number, fields: Partial<ElectricalPointSpec>) => {
    const copy = [...specs.electrical.points];
    copy[index] = { ...copy[index], ...fields };
    onChange({
      ...specs,
      electrical: { ...specs.electrical, points: copy }
    });
  };

  const handleDeleteElectricalPoint = (index: number) => {
    if (readOnly) return;
    const filtered = specs.electrical.points.filter((_, i) => i !== index);
    onChange({
      ...specs,
      electrical: { ...specs.electrical, points: filtered }
    });
  };

  // ==========================================
  // FLOORING AREAS (ADD, EDIT, DELETE)
  // ==========================================
  const handleAddFlooringArea = (preset?: Partial<FlooringAreaSpec>) => {
    const areaSq = preset?.areaSqFt || 100;
    const rateSq = preset?.ratePerSqFt || 75;
    const newArea: FlooringAreaSpec = {
      id: `fl_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      areaName: preset?.areaName || "New Flooring Area",
      material: preset?.material || "GVT Vitrified Tiles (4x2 ft)",
      brand: preset?.brand || "Kajaria / Somany / Simpolo",
      ratePerSqFt: rateSq,
      areaSqFt: areaSq,
      totalCost: areaSq * rateSq,
      isIncluded: preset?.isIncluded !== undefined ? preset.isIncluded : true,
      remarks: preset?.remarks || ""
    };
    onChange({
      ...specs,
      flooring: [...specs.flooring, newArea]
    });
  };

  const handleUpdateFlooringArea = (index: number, fields: Partial<FlooringAreaSpec>) => {
    const copy = [...specs.flooring];
    const updated = { ...copy[index], ...fields };
    if (fields.areaSqFt !== undefined || fields.ratePerSqFt !== undefined) {
      updated.totalCost = (updated.areaSqFt || 0) * (updated.ratePerSqFt || 0);
    }
    copy[index] = updated;
    onChange({ ...specs, flooring: copy });
  };

  const handleDeleteFlooringArea = (index: number) => {
    if (readOnly) return;
    const filtered = specs.flooring.filter((_, i) => i !== index);
    onChange({ ...specs, flooring: filtered });
  };

  // ==========================================
  // DOORS & WINDOWS (ADD, EDIT, DELETE)
  // ==========================================
  const handleAddDoorWindowItem = (preset?: Partial<DoorWindowItemSpec>) => {
    const newItem: DoorWindowItemSpec = {
      id: `dw_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      name: preset?.name || "New Door / Window Item",
      nameMl: preset?.nameMl || "വാതിൽ / ജനൽ ഇനം",
      quantity: preset?.quantity || 1,
      unit: preset?.unit || "Sets",
      unitRate: preset?.unitRate || 6500,
      maxRate: preset?.maxRate || 7500,
      isIncluded: preset?.isIncluded !== undefined ? preset.isIncluded : true,
      specification: preset?.specification || "Treated hardwood frame with approved shutters & hardware.",
      remarks: preset?.remarks || ""
    };
    onChange({
      ...specs,
      doorsWindows: [...specs.doorsWindows, newItem]
    });
  };

  const handleUpdateDoorWindowItem = (index: number, fields: Partial<DoorWindowItemSpec>) => {
    const copy = [...specs.doorsWindows];
    copy[index] = { ...copy[index], ...fields };
    onChange({ ...specs, doorsWindows: copy });
  };

  const handleDeleteDoorWindowItem = (index: number) => {
    if (readOnly) return;
    const filtered = specs.doorsWindows.filter((_, i) => i !== index);
    onChange({ ...specs, doorsWindows: filtered });
  };

  // ==========================================
  // CUSTOM WORK SPECIFICATIONS (ADD, EDIT, DELETE)
  // ==========================================
  const handleAddCustomSpec = (preset?: Partial<CustomSpecItem>) => {
    const newItem: CustomSpecItem = {
      id: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 4)}`,
      category: preset?.category || "Special Features",
      title: preset?.title || "Custom Specification Item",
      titleMl: preset?.titleMl || "പ്രത്യേക വർക്ക് സ്പെസിഫിക്കേഷൻ",
      specification: preset?.specification || "Detailed technical specification for special construction item.",
      brand: preset?.brand || "",
      isIncluded: preset?.isIncluded !== undefined ? preset.isIncluded : true,
      rateOrCost: preset?.rateOrCost || 0,
      remarks: preset?.remarks || ""
    };
    onChange({
      ...specs,
      customSpecs: [...(specs.customSpecs || []), newItem]
    });
  };

  const handleUpdateCustomSpec = (index: number, fields: Partial<CustomSpecItem>) => {
    const copy = [...(specs.customSpecs || [])];
    copy[index] = { ...copy[index], ...fields };
    onChange({ ...specs, customSpecs: copy });
  };

  const handleDeleteCustomSpec = (index: number) => {
    if (readOnly) return;
    const filtered = (specs.customSpecs || []).filter((_, i) => i !== index);
    onChange({ ...specs, customSpecs: filtered });
  };

  // Categories Navigation config
  const navTabs = [
    { id: "substructure", label: "A. ഫൗണ്ടേഷൻ & അടിത്തറ (Substructure)", count: null, icon: Layers },
    { id: "superstructure", label: "B. ഭിത്തി & കോൺക്രീറ്റ് (Superstructure)", count: null, icon: Hammer },
    { id: "sanitary", label: "C. പ്ലംബിംഗ് & സാനിറ്ററി (Sanitary)", count: specs.sanitary.length, icon: Droplets },
    { id: "electrical", label: "D. ഇലക്ട്രിക്കൽ & വയറിംഗ് (Electrical)", count: specs.electrical.points.length, icon: Zap },
    { id: "flooring", label: "E. ടൈൽ & ഗ്രാനൈറ്റ് (Flooring)", count: specs.flooring.length, icon: Grid },
    { id: "painting", label: "F. പെയിന്റിംഗ് & ഫിനിഷിംഗ് (Painting)", count: null, icon: Paintbrush },
    { id: "doorsWindows", label: "G. വാതിലുകൾ & ജനലുകൾ (Doors & Windows)", count: specs.doorsWindows.length, icon: DoorClosed },
    { id: "customSpecs", label: "H. മറ്റ് സ്പെസിഫിക്കേഷൻ (Custom)", count: (specs.customSpecs || []).length, icon: Sparkles }
  ];

  return (
    <div className="space-y-4 text-white">
      {/* Category Tabs Bar */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800 overflow-x-auto shadow-inner">
        {navTabs.map(t => {
          const Icon = t.icon;
          const isActive = activeCategory === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveCategory(t.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.count !== null && (
                <span className={`px-1.5 py-0.2 text-[10px] rounded-md ${
                  isActive ? "bg-indigo-800 text-white" : "bg-slate-900 text-slate-400"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 1. SUBSTRUCTURE (A) */}
      {/* ==================================================================== */}
      {activeCategory === "substructure" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>A. സബ് സ്ട്രക്ച്ചർ & ഫൗണ്ടേഷൻ സ്പെസിഫിക്കേഷനുകൾ (Substructure & Foundation)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                അടിത്തറ, കരിങ്കൽ കെട്ട്, ബെൽറ്റ്, സിമന്റ്, കമ്പി, മണൽ എന്നിവയുടെ വിശദാംശങ്ങൾ
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => {
                  const custom = specs.substructure.customItems || [];
                  const newItem = {
                    id: `sub_c_${Date.now()}`,
                    title: "New Substructure Item",
                    titleMl: "പുതിയ ഫൗണ്ടേഷൻ ഇനം",
                    specification: "Standard specification details..."
                  };
                  handleUpdateSubstructure("customItems" as any, [...custom, newItem]);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow-md shadow-amber-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ അടിത്തറ ഇനം ചേർക്കുക (Add Custom Item)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">ഫൗണ്ടേഷൻ രീതി (Foundation Type):</label>
              <textarea
                rows={2}
                value={specs.substructure.foundation}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("foundation", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">റബ്ബിൾ മേസൺറി (Foundation Rubble Masonry):</label>
              <textarea
                rows={2}
                value={specs.substructure.foundationMasonry}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("foundationMasonry", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">ബേസ്മെന്റ് മേസൺറി (Basement Masonry):</label>
              <textarea
                rows={2}
                value={specs.substructure.basementMasonry}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("basementMasonry", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">പ്ലിന്ത് ബെൽറ്റ് & കോൺക്രീറ്റ് (RCC Plinth Belt):</label>
              <textarea
                rows={2}
                value={specs.substructure.rccBelt}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("rccBelt", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">സിമന്റ് ബ്രാൻഡ് & ഗ്രേഡ് (Cement Spec):</label>
              <input
                type="text"
                value={specs.substructure.cementSpec}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("cementSpec", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">കമ്പി ഗ്രേഡ് & ബ്രാൻഡ് (Steel / TMT Bar Spec):</label>
              <input
                type="text"
                value={specs.substructure.steelSpec}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("steelSpec", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">മണൽ & പാറപ്പൊടി (M-Sand / P-Sand Spec):</label>
              <input
                type="text"
                value={specs.substructure.sandSpec}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("sandSpec", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">മണ്ണെടുപ്പും നിരപ്പാക്കലും (Earth Work & Filling):</label>
              <input
                type="text"
                value={specs.substructure.earthExcavation}
                readOnly={readOnly}
                onChange={e => handleUpdateSubstructure("earthExcavation", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Custom Substructure Items */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>അധിക ഫൗണ്ടേഷൻ & അടിത്തറ ഇനങ്ങൾ (Custom Substructure Specifications):</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  പൈലിംഗ്, ഷീറ്റ് പൈലിംഗ്, വാട്ടർപ്രൂഫിംഗ്, കൺഫ്ലോർ ട്രീറ്റ്‌മെന്റ് തുടങ്ങിയ അധിക ഇനങ്ങൾ
                </p>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomItemModal({
                      section: "substructure",
                      index: -1,
                      id: `sub_c_${Date.now()}`,
                      title: "Custom Substructure Item",
                      titleMl: "പുതിയ ഫൗണ്ടേഷൻ ഇനം",
                      specification: "",
                      remarks: ""
                    });
                  }}
                  className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ ഇനം ചേർക്കുക (Add Custom Item)</span>
                </button>
              )}
            </div>

            {(specs.substructure.customItems || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(specs.substructure.customItems || []).map((ci, idx) => (
                  <div key={ci.id || idx} className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition flex flex-col justify-between gap-2 shadow-sm">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                          <h5 className="font-bold text-white text-xs">
                            {ci.titleMl || ci.title}
                          </h5>
                          {ci.title && ci.titleMl && ci.title !== ci.titleMl && (
                            <span className="text-[10px] text-slate-400 font-mono">({ci.title})</span>
                          )}
                        </div>
                        {!readOnly && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomItemModal({
                                  section: "substructure",
                                  index: idx,
                                  id: ci.id || `sub_c_${idx}`,
                                  title: ci.title || "",
                                  titleMl: ci.titleMl || ci.title || "",
                                  specification: ci.specification || "",
                                  remarks: ci.remarks || ""
                                });
                              }}
                              className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-950/50 rounded-lg transition"
                              title="Edit Heading & Description"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = (specs.substructure.customItems || []).filter((_, i) => i !== idx);
                                handleUpdateSubstructure("customItems" as any, copy);
                              }}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono mt-1.5 line-clamp-3 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                        {ci.specification || "വിശദമായ സാങ്കേതിക വിവരണം നൽകിയിട്ടില്ല."}
                      </p>
                      {ci.remarks && (
                        <p className="text-[10px] text-amber-300/80 font-mono mt-1">
                          കുറിപ്പ്: {ci.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
                അധിക ഫൗണ്ടേഷൻ ഇനങ്ങൾ ചേർത്തിട്ടില്ല. ആവശ്യമെങ്കിൽ &quot;+ ഇനം ചേർക്കുക&quot; ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. SUPERSTRUCTURE (B) */}
      {/* ==================================================================== */}
      {activeCategory === "superstructure" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                <Hammer className="w-4 h-4" />
                <span>B. സൂപ്പർ സ്ട്രക്ച്ചർ & കോൺക്രീറ്റ് (Superstructure & RCC Works)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                ഭിത്തികൾ, സ്ലാബ്, ബീമുകൾ, പ്ലാസ്റ്ററിംഗ്, കോൺക്രീറ്റ് അനുപാതങ്ങൾ
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  setCustomItemModal({
                    section: "superstructure",
                    index: -1,
                    id: `sup_c_${Date.now()}`,
                    title: "Custom Superstructure Item",
                    titleMl: "പുതിയ സൂപ്പർ സ്ട്രക്ച്ചർ ഇനം",
                    specification: "",
                    remarks: ""
                  });
                }}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow-md shadow-cyan-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ഇനം ചേർക്കുക (Add Custom Item)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-300 block mb-1 font-bold">ഭിത്തി നിർമ്മാണം (Masonry / Block Spec):</label>
              <textarea
                rows={2}
                value={specs.superstructure.masonry}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("masonry", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">റൂഫ് സ്ലാബ് & ബീമുകൾ (Main Roof Slab & Beams):</label>
              <textarea
                rows={2}
                value={specs.superstructure.mainRoofSlab}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("mainRoofSlab", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">ലിന്റൽ & സൺഷെയ്ഡ് (Lintel & Sunshades):</label>
              <textarea
                rows={2}
                value={specs.superstructure.lintel}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("lintel", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-bold">പ്ലാസ്റ്ററിംഗ് (Internal & External Plastering):</label>
              <textarea
                rows={2}
                value={specs.superstructure.plastering}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("plastering", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">ടോയ്‌ലറ്റ് സൺകൻ സ്ലാബ് & വാട്ടർപ്രൂഫിംഗ്:</label>
              <input
                type="text"
                value={specs.superstructure.toiletSlab}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("toiletSlab", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">കിച്ചൻ സ്ലാബ് & കൗണ്ടർ ടോപ്പ്:</label>
              <input
                type="text"
                value={specs.superstructure.kitchenSlab}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("kitchenSlab", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">സ്റ്റെയർകേസ് നിർമ്മാണം (RCC Staircase):</label>
              <input
                type="text"
                value={specs.superstructure.staircase}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("staircase", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1">ഫ്ലോർ ബെഡ് കോൺക്രീറ്റ് (PCC Floor Bed):</label>
              <input
                type="text"
                value={specs.superstructure.floorConcrete}
                readOnly={readOnly}
                onChange={e => handleUpdateSuperstructure("floorConcrete", e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Custom Superstructure Items */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>അധിക സൂപ്പർ സ്ട്രക്ച്ചർ ഇനങ്ങൾ (Custom Superstructure Specifications):</span>
                </h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  ബാൽക്കണി ഹാൻഡ്‌റെയിൽ, പാരപ്പറ്റ് വാൾ ഡിസൈൻ, പോർച്ച് പില്ലറുകൾ, ട്രസ്സ് വർക്ക് തുടങ്ങിയ ഇനങ്ങൾ
                </p>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomItemModal({
                      section: "superstructure",
                      index: -1,
                      id: `sup_c_${Date.now()}`,
                      title: "Custom Superstructure Item",
                      titleMl: "പുതിയ സൂപ്പർ സ്ട്രക്ച്ചർ ഇനം",
                      specification: "",
                      remarks: ""
                    });
                  }}
                  className="px-2.5 py-1 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition shadow"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ ഇനം ചേർക്കുക (Add Custom Item)</span>
                </button>
              )}
            </div>

            {(specs.superstructure.customItems || []).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(specs.superstructure.customItems || []).map((ci, idx) => (
                  <div key={ci.id || idx} className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition flex flex-col justify-between gap-2 shadow-sm">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                          <h5 className="font-bold text-white text-xs">
                            {ci.titleMl || ci.title}
                          </h5>
                          {ci.title && ci.titleMl && ci.title !== ci.titleMl && (
                            <span className="text-[10px] text-slate-400 font-mono">({ci.title})</span>
                          )}
                        </div>
                        {!readOnly && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomItemModal({
                                  section: "superstructure",
                                  index: idx,
                                  id: ci.id || `sup_c_${idx}`,
                                  title: ci.title || "",
                                  titleMl: ci.titleMl || ci.title || "",
                                  specification: ci.specification || "",
                                  remarks: ci.remarks || ""
                                });
                              }}
                              className="p-1 text-sky-400 hover:text-sky-300 hover:bg-sky-950/50 rounded-lg transition"
                              title="Edit Heading & Description"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = (specs.superstructure.customItems || []).filter((_, i) => i !== idx);
                                handleUpdateSuperstructure("customItems" as any, copy);
                              }}
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono mt-1.5 line-clamp-3 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                        {ci.specification || "വിശദമായ സാങ്കേതിക വിവരണം നൽകിയിട്ടില്ല."}
                      </p>
                      {ci.remarks && (
                        <p className="text-[10px] text-cyan-300/80 font-mono mt-1">
                          കുറിപ്പ്: {ci.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center bg-slate-900/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
                അധിക സൂപ്പർ സ്ട്രക്ച്ചർ ഇനങ്ങൾ ചേർത്തിട്ടില്ല. ആവശ്യമെങ്കിൽ &quot;+ ഇനം ചേർക്കുക&quot; ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. SANITARY & PLUMBING (C) */}
      {/* ==================================================================== */}
      {activeCategory === "sanitary" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-sm text-sky-400 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                <span>C. പ്ലംബിംഗ് & സാനിറ്ററി ഫിറ്റിംഗ്സ് (Plumbing & Sanitary Specifications)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                ക്ലോസറ്റുകൾ, വാഷ് ബേസിനുകൾ, സിങ്കുകൾ, ടാപ്പുകൾ, ടാങ്ക് എന്നിവയുടെ ബഡ്ജറ്റ് പരിധി
              </p>
            </div>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddSanitaryItem()}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-950 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ സാനിറ്ററി ഇനം ചേർക്കുക (Add Item)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Presets for Sanitary */}
          {!readOnly && (
            <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-400 shrink-0">പെട്ടെന്ന് ചേർക്കാൻ (Presets):</span>
              {[
                { name: "Overhead Water Tank 1000L", nameMl: "ഓവർഹെഡ് വാട്ടർ ടാങ്ക് (1000L)", qty: 1, unit: "Nos", rate: 8500 },
                { name: "Solar Water Heater Line", nameMl: "സോളാർ വാട്ടർ ഹീറ്റർ പൈപ്പ് ലൈൻ", qty: 1, unit: "Set", rate: 12000 },
                { name: "Pressure Pump & Automatic Controller", nameMl: "പ്രഷർ പമ്പ് & കൺട്രോളർ", qty: 1, unit: "Set", rate: 16000 },
                { name: "RO Water Purifier Provision", nameMl: "RO പ്യൂരിഫയർ പ്രൊവിഷൻ", qty: 1, unit: "Point", rate: 1500 },
                { name: "Rain Water Harvesting Filter", nameMl: "മഴവെള്ള സംഭരണി ഫിൽട്ടർ", qty: 1, unit: "Set", rate: 9500 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddSanitaryItem({
                    name: p.name,
                    nameMl: p.nameMl,
                    quantity: p.qty,
                    unit: p.unit,
                    maxAllowedRate: p.rate,
                    isIncluded: true,
                    specification: "ISI standard approved quality fitting."
                  })}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-sky-300 border border-slate-800 hover:border-sky-500/40 rounded-lg whitespace-nowrap cursor-pointer transition"
                >
                  + {p.nameMl}
                </button>
              ))}
            </div>
          )}

          {/* Sanitary Items List */}
          <div className="space-y-2">
            {specs.sanitary.map((item, idx) => (
              <div
                key={item.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 items-center text-xs font-mono"
              >
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-500 block">ഇനം / പേര് (Name):</label>
                  <input
                    type="text"
                    value={item.nameMl || item.name}
                    readOnly={readOnly}
                    onChange={e => handleUpdateSanitaryItem(idx, { nameMl: e.target.value, name: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] text-slate-500 block">എണ്ണം (Qty):</label>
                  <input
                    type="number"
                    value={item.quantity}
                    readOnly={readOnly}
                    onChange={e => handleUpdateSanitaryItem(idx, { quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] text-slate-500 block">യൂണിറ്റ്:</label>
                  <select
                    value={item.unit}
                    disabled={readOnly}
                    onChange={e => handleUpdateSanitaryItem(idx, { unit: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Set">Set</option>
                    <option value="Sets">Sets</option>
                    <option value="LS">LS</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 block">പരമാവധി നിരക്ക് (₹ Limit):</label>
                  <input
                    type="number"
                    value={item.maxAllowedRate}
                    readOnly={readOnly}
                    onChange={e => handleUpdateSanitaryItem(idx, { maxAllowedRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] text-slate-500 block">ബ്രാൻഡ് & സ്പെസിഫിക്കേഷൻ:</label>
                  <input
                    type="text"
                    value={item.specification}
                    readOnly={readOnly}
                    onChange={e => handleUpdateSanitaryItem(idx, { specification: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
                  />
                </div>

                <div className="sm:col-span-1 text-center flex items-center justify-center gap-1 pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={item.isIncluded}
                    disabled={readOnly}
                    onChange={e => handleUpdateSanitaryItem(idx, { isIncluded: e.target.checked })}
                    className="rounded border-slate-700 text-sky-500 mr-1"
                    title="Included in Base Contract"
                  />
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteSanitaryItem(idx)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. ELECTRICAL SPECIFICATIONS (D) */}
      {/* ==================================================================== */}
      {activeCategory === "electrical" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>D. ഇലക്ട്രിക്കൽ വയറിംഗും പോയിന്റുകളും (Electrical Specifications)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                വയറുകൾ, സ്വിച്ചുകൾ, ഡിസ്ട്രിബ്യൂഷൻ ബോർഡ് & പോയിന്റുകളുടെ എണ്ണം
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleAddElectricalPoint()}
                className="px-3.5 py-1.5 bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-md shadow-yellow-950 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ഇലക്ട്രിക്കൽ പോയിന്റ് ചേർക്കുക (Add Point)</span>
              </button>
            )}
          </div>

          {/* Master Electrical Brand Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">കേബിൾ ബ്രാൻഡ് (Cable Brand):</label>
              <input
                type="text"
                value={specs.electrical.cableBrand}
                readOnly={readOnly}
                onChange={e => onChange({
                  ...specs,
                  electrical: { ...specs.electrical, cableBrand: e.target.value }
                })}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">സ്വിച്ച് മോഡൽ (Modular Switches):</label>
              <input
                type="text"
                value={specs.electrical.switchBrand}
                readOnly={readOnly}
                onChange={e => onChange({
                  ...specs,
                  electrical: { ...specs.electrical, switchBrand: e.target.value }
                })}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">ഡിസ്ട്രിബ്യൂഷൻ ബോർഡ് (DB & RCCB):</label>
              <input
                type="text"
                value={specs.electrical.dbBreakers}
                readOnly={readOnly}
                onChange={e => onChange({
                  ...specs,
                  electrical: { ...specs.electrical, dbBreakers: e.target.value }
                })}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Points List */}
          <div className="space-y-2">
            {specs.electrical.points.map((pt, idx) => (
              <div
                key={pt.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 items-center text-xs font-mono"
              >
                <div className="sm:col-span-4">
                  <label className="text-[10px] text-slate-500 block">പോയിന്റ് പേര് (Point Description):</label>
                  <input
                    type="text"
                    value={pt.nameMl || pt.name}
                    readOnly={readOnly}
                    onChange={e => handleUpdateElectricalPoint(idx, { nameMl: e.target.value, name: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 block">പോയിന്റ് എണ്ണം (Count):</label>
                  <input
                    type="number"
                    value={pt.pointCount}
                    readOnly={readOnly}
                    onChange={e => handleUpdateElectricalPoint(idx, { pointCount: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-yellow-400 font-bold text-center"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 block">യൂണിറ്റ് നിരക്ക് (₹/Point):</label>
                  <input
                    type="number"
                    value={pt.unitRate || 0}
                    readOnly={readOnly}
                    onChange={e => handleUpdateElectricalPoint(idx, { unitRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-500 block">സ്പെസിഫിക്കേഷൻ:</label>
                  <input
                    type="text"
                    value={pt.specification}
                    readOnly={readOnly}
                    onChange={e => handleUpdateElectricalPoint(idx, { specification: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
                  />
                </div>

                <div className="sm:col-span-1 text-center flex items-center justify-center gap-1 pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={pt.isIncluded}
                    disabled={readOnly}
                    onChange={e => handleUpdateElectricalPoint(idx, { isIncluded: e.target.checked })}
                    className="rounded border-slate-700 text-yellow-500 mr-1"
                    title="Included in Base Contract"
                  />
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteElectricalPoint(idx)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. FLOORING & CLADDING (E) */}
      {/* ==================================================================== */}
      {activeCategory === "flooring" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <Grid className="w-4 h-4" />
                <span>E. ടൈൽ & ഗ്രാനൈറ്റ് ഫ്ലോറിംഗ് സ്പെസിഫിക്കേഷനുകൾ (Flooring & Tile Specs)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                സിറ്റൗട്ട്, ഹാൾ, ബെഡ്‌റൂം, കിച്ചൻ, ബാത്ത്റൂം വാൾ ടൈലുകളുടെ നിരക്ക് പരിധി
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleAddFlooringArea()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ഫ്ലോറിംഗ് ഏരിയ ചേർക്കുക (Add Flooring Area)</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {specs.flooring.map((fl, idx) => (
              <div
                key={fl.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 items-center text-xs font-mono"
              >
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-500 block">ഏരിയ പേര് (Area Name):</label>
                  <input
                    type="text"
                    value={fl.areaName}
                    readOnly={readOnly}
                    onChange={e => handleUpdateFlooringArea(idx, { areaName: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-500 block">മെറ്റീരിയൽ & ബ്രാൻഡ്:</label>
                  <input
                    type="text"
                    value={fl.material}
                    readOnly={readOnly}
                    onChange={e => handleUpdateFlooringArea(idx, { material: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 block">നിരക്ക് പരിധി (₹/Sq.Ft):</label>
                  <input
                    type="number"
                    value={fl.ratePerSqFt}
                    readOnly={readOnly}
                    onChange={e => handleUpdateFlooringArea(idx, { ratePerSqFt: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 block">വിസ്തീർണ്ണം (Sq.Ft):</label>
                  <input
                    type="number"
                    value={fl.areaSqFt}
                    readOnly={readOnly}
                    onChange={e => handleUpdateFlooringArea(idx, { areaSqFt: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center font-bold"
                  />
                </div>

                <div className="sm:col-span-1 text-center">
                  <label className="text-[10px] text-slate-500 block">ആകെ തുക:</label>
                  <div className="p-2 text-emerald-400 font-bold text-[11px] truncate">
                    {formatIndianCurrency(fl.totalCost, false)}
                  </div>
                </div>

                <div className="sm:col-span-1 text-center flex items-center justify-center gap-1 pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={fl.isIncluded}
                    disabled={readOnly}
                    onChange={e => handleUpdateFlooringArea(idx, { isIncluded: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-500 mr-1"
                    title="Included in Base Contract"
                  />
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteFlooringArea(idx)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Area"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. PAINTING & POLISHING (F) */}
      {/* ==================================================================== */}
      {activeCategory === "painting" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-pink-400 flex items-center gap-2">
              <Paintbrush className="w-4 h-4" />
              <span>F. പെയിന്റിംഗ് & വുഡ് പോളിഷിംഗ് സ്പെസിഫിക്കേഷനുകൾ (Painting & Polishing)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              ഇന്റീരിയർ, എക്സ്റ്റീരിയർ, സീലിംഗ്, തടി പോളിഷ്, ഗ്രിൽ പെയിന്റ്
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Interior Paint */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-xs text-pink-400 border-b border-slate-800 pb-1">
                1. ഇന്റീരിയർ പെയിന്റ് (Interior Wall Paint)
              </div>
              <div>
                <label className="text-slate-400 block mb-1">പെയിന്റ് ബ്രാൻഡ് / ക്വാളിറ്റി:</label>
                <input
                  type="text"
                  value={specs.painting.interior.brand}
                  readOnly={readOnly}
                  onChange={e => onChange({
                    ...specs,
                    painting: {
                      ...specs.painting,
                      interior: { ...specs.painting.interior, brand: e.target.value }
                    }
                  })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">കോട്ടിംഗ് എണ്ണം (Coats):</label>
                  <input
                    type="number"
                    value={specs.painting.interior.coats}
                    readOnly={readOnly}
                    onChange={e => onChange({
                      ...specs,
                      painting: {
                        ...specs.painting,
                        interior: { ...specs.painting.interior, coats: parseInt(e.target.value, 10) || 2 }
                      }
                    })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">സ്ക്വയർ ഫീറ്റ് നിരക്ക് (₹):</label>
                  <input
                    type="number"
                    value={specs.painting.interior.rate || 0}
                    readOnly={readOnly}
                    onChange={e => onChange({
                      ...specs,
                      painting: {
                        ...specs.painting,
                        interior: { ...specs.painting.interior, rate: parseFloat(e.target.value) || 0 }
                      }
                    })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Exterior Paint */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-xs text-sky-400 border-b border-slate-800 pb-1">
                2. എക്സ്റ്റീരിയർ പെയിന്റ് (Exterior Weather-proof)
              </div>
              <div>
                <label className="text-slate-400 block mb-1">പെയിന്റ് ബ്രാൻഡ് / ക്വാളിറ്റി:</label>
                <input
                  type="text"
                  value={specs.painting.exterior.brand}
                  readOnly={readOnly}
                  onChange={e => onChange({
                    ...specs,
                    painting: {
                      ...specs.painting,
                      exterior: { ...specs.painting.exterior, brand: e.target.value }
                    }
                  })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">കോട്ടിംഗ് എണ്ണം (Coats):</label>
                  <input
                    type="number"
                    value={specs.painting.exterior.coats}
                    readOnly={readOnly}
                    onChange={e => onChange({
                      ...specs,
                      painting: {
                        ...specs.painting,
                        exterior: { ...specs.painting.exterior, coats: parseInt(e.target.value, 10) || 2 }
                      }
                    })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">സ്ക്വയർ ഫീറ്റ് നിരക്ക് (₹):</label>
                  <input
                    type="number"
                    value={specs.painting.exterior.rate || 0}
                    readOnly={readOnly}
                    onChange={e => onChange({
                      ...specs,
                      painting: {
                        ...specs.painting,
                        exterior: { ...specs.painting.exterior, rate: parseFloat(e.target.value) || 0 }
                      }
                    })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Wood Polish */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-xs text-amber-400 border-b border-slate-800 pb-1">
                3. തടി പോളിഷിംഗ് (Wood Polishing)
              </div>
              <div>
                <label className="text-slate-400 block mb-1">പോളിഷ് രീതി (Melamine / PU Polish):</label>
                <input
                  type="text"
                  value={specs.painting.woodPolishing.type}
                  readOnly={readOnly}
                  onChange={e => onChange({
                    ...specs,
                    painting: {
                      ...specs.painting,
                      woodPolishing: { ...specs.painting.woodPolishing, type: e.target.value }
                    }
                  })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                />
              </div>
            </div>

            {/* MS Grills */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="font-bold text-xs text-slate-300 border-b border-slate-800 pb-1">
                4. ഗ്രിൽ പെയിന്റിംഗ് (MS Safety Grills)
              </div>
              <div>
                <label className="text-slate-400 block mb-1">എനാമൽ പെയിന്റ് / പ്രൈമർ സ്പെസിഫിക്കേഷൻ:</label>
                <input
                  type="text"
                  value={specs.painting.grills.paintType}
                  readOnly={readOnly}
                  onChange={e => onChange({
                    ...specs,
                    painting: {
                      ...specs.painting,
                      grills: { ...specs.painting.grills, paintType: e.target.value }
                    }
                  })}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. DOORS, WINDOWS & HARDWARE (G) */}
      {/* ==================================================================== */}
      {activeCategory === "doorsWindows" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <DoorClosed className="w-4 h-4" />
                <span>G. വാതിലുകൾ, ജനലുകൾ & ഹാർഡ്‌വെയർ (Doors, Windows & Hardware)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                തേക്ക് തടി വാതിൽ, റൂം വാതിലുകൾ, FRP ബാത്ത്റൂം വാതിലുകൾ, ഗ്രില്ലുകൾ, ലോക്കുകൾ
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => handleAddDoorWindowItem()}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ വാതിൽ/ജനൽ ഇനം ചേർക്കുക (Add Item)</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {specs.doorsWindows.map((dw, idx) => (
              <div
                key={dw.id || idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800 items-center text-xs font-mono"
              >
                <div className="sm:col-span-3">
                  <label className="text-[10px] text-slate-500 block">ഇനം / പേര് (Name):</label>
                  <input
                    type="text"
                    value={dw.nameMl || dw.name}
                    readOnly={readOnly}
                    onChange={e => handleUpdateDoorWindowItem(idx, { nameMl: e.target.value, name: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] text-slate-500 block">എണ്ണം (Qty):</label>
                  <input
                    type="number"
                    value={dw.quantity}
                    readOnly={readOnly}
                    onChange={e => handleUpdateDoorWindowItem(idx, { quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-center"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-[10px] text-slate-500 block">യൂണിറ്റ്:</label>
                  <select
                    value={dw.unit}
                    disabled={readOnly}
                    onChange={e => handleUpdateDoorWindowItem(idx, { unit: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Sets">Sets</option>
                    <option value="Nos">Nos</option>
                    <option value="Set">Set</option>
                    <option value="Lumpsum">Lumpsum</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-500 block">യൂണിറ്റ് നിരക്ക് (₹ Limit):</label>
                  <input
                    type="number"
                    value={dw.unitRate}
                    readOnly={readOnly}
                    onChange={e => handleUpdateDoorWindowItem(idx, { unitRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-bold"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-[10px] text-slate-500 block">സ്പെസിഫിക്കേഷൻ വിവരണം:</label>
                  <input
                    type="text"
                    value={dw.specification}
                    readOnly={readOnly}
                    onChange={e => handleUpdateDoorWindowItem(idx, { specification: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
                  />
                </div>

                <div className="sm:col-span-1 text-center flex items-center justify-center gap-1 pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={dw.isIncluded}
                    disabled={readOnly}
                    onChange={e => handleUpdateDoorWindowItem(idx, { isIncluded: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 mr-1"
                    title="Included in Base Contract"
                  />
                  {!readOnly && (
                    <button
                      onClick={() => handleDeleteDoorWindowItem(idx)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. CUSTOM SPECIFICATIONS (H) */}
      {/* ==================================================================== */}
      {activeCategory === "customSpecs" && (
        <div className="space-y-4 bg-slate-950 p-5 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
            <div>
              <h3 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>H. മറ്റ് പ്രത്യേക വർക്ക് സ്പെസിഫിക്കേഷനുകൾ (Custom / Special Specifications)</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                സോളാർ, സിസിടിവി, ഗാർഡൻ ലാൻഡ്‌സ്കേപ്പിംഗ്, വാട്ടർപ്രൂഫിംഗ്, ഓട്ടോമേഷൻ തുടങ്ങിയ പ്രത്യേക ഇനങ്ങൾ
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  setCustomItemModal({
                    section: "customSpecs",
                    index: -1,
                    id: `cs_${Date.now()}`,
                    title: "Custom Specification Item",
                    titleMl: "പ്രത്യേക വർക്ക് സ്പെസിഫിക്കേഷൻ",
                    category: "Special Features",
                    specification: "",
                    remarks: "",
                    rateOrCost: 0,
                    isIncluded: true
                  });
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-950 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ പ്രത്യേക സ്പെസിഫിക്കേഷൻ ചേർക്കുക (Add Custom Spec)</span>
              </button>
            )}
          </div>

          {/* Quick Presets for Custom Specs */}
          {!readOnly && (
            <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
              <span className="text-slate-400 shrink-0">പ്രത്യേക ഇനങ്ങൾ (Presets):</span>
              {[
                { cat: "Solar", title: "3kW On-Grid Solar Power Setup", titleMl: "3kW സോളാർ പവർ പ്ലാന്റ്", cost: 165000 },
                { cat: "Security", title: "8-Channel HD CCTV Surveillance Setup", titleMl: "8-ചാനൽ CCTV സെക്യൂരിറ്റി സിസ്റ്റം", cost: 38000 },
                { cat: "Landscaping", title: "Garden Landscaping & Buffalo Grass Lawn", titleMl: "ഗാർഡൻ ലാൻഡ്‌സ്കേപ്പിംഗ് & പുൽത്തകിടി", cost: 45000 },
                { cat: "Roofing", title: "GI Truss Work with Kerala Clay Tile Look Sheet", titleMl: "റൂഫ് ട്രസ്സ് വർക്ക് & ഷീറ്റ്", cost: 120000 },
                { cat: "Automation", title: "Automatic Gate Motor & Remote System", titleMl: "ഓട്ടോമാറ്റിക് ഗേറ്റ് മോട്ടോർ", cost: 42000 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddCustomSpec({
                    category: p.cat,
                    title: p.title,
                    titleMl: p.titleMl,
                    rateOrCost: p.cost,
                    isIncluded: true,
                    specification: "Complete material supply, technical installation and warranty commissioning."
                  })}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-purple-300 border border-slate-800 hover:border-purple-500/40 rounded-lg whitespace-nowrap cursor-pointer transition"
                >
                  + {p.titleMl}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {(specs.customSpecs || []).map((cs, idx) => (
              <div
                key={cs.id || idx}
                className="bg-slate-900/95 p-3.5 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-sm"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800/60 rounded-md text-[10px] font-bold">
                      {cs.category || "General"}
                    </span>
                    <h5 className="font-bold text-white text-sm">
                      {cs.titleMl || cs.title}
                    </h5>
                    {cs.title && cs.titleMl && cs.title !== cs.titleMl && (
                      <span className="text-slate-400 text-xs">({cs.title})</span>
                    )}
                    {cs.isIncluded ? (
                      <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-md text-[10px]">
                        ഉൾപ്പെടുത്തിയിട്ടുണ്ട് (Included)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-950/80 text-rose-400 border border-rose-800/60 rounded-md text-[10px]">
                        അധിക ചിലവ് (Extra)
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                    {cs.specification || "സാങ്കേതിക വിവരണം ചേർത്തിട്ടില്ല."}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                    {cs.rateOrCost ? (
                      <span className="text-emerald-400 font-bold">
                        നിരക്ക് / തുക: {formatIndianCurrency(cs.rateOrCost)}
                      </span>
                    ) : null}
                    {cs.remarks && (
                      <span>കുറിപ്പ്: {cs.remarks}</span>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex sm:flex-col items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomItemModal({
                          section: "customSpecs",
                          index: idx,
                          id: cs.id || `cs_${idx}`,
                          title: cs.title || "",
                          titleMl: cs.titleMl || cs.title || "",
                          category: cs.category || "Special Features",
                          specification: cs.specification || "",
                          remarks: cs.remarks || "",
                          rateOrCost: cs.rateOrCost || 0,
                          isIncluded: cs.isIncluded !== undefined ? cs.isIncluded : true
                        });
                      }}
                      className="px-2.5 py-1.5 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60 rounded-xl flex items-center gap-1 transition"
                      title="Edit Custom Item Heading & Description"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>തിരുത്തുക (Edit)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomSpec(idx)}
                      className="px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl flex items-center gap-1 transition"
                      title="Delete Custom Specification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ഒഴിവാക്കുക (Delete)</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(!specs.customSpecs || specs.customSpecs.length === 0) && (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
                പ്രത്യേക സ്പെസിഫിക്കേഷനുകൾ ഒന്നും ചേർത്തിട്ടില്ല. മുകളിലെ ബട്ടൺ വഴി ചേർക്കാം.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT / ADD CUSTOM SPECIFICATION ITEM */}
      {/* ==================================================================== */}
      {customItemModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {customItemModal.index >= 0 ? "സ്പെസിഫിക്കേഷൻ ഇനം തിരുത്തുക (Edit Custom Item)" : "പുതിയ സ്പെസിഫിക്കേഷൻ ഇനം ചേർക്കുക (Add Custom Item)"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {customItemModal.section === "substructure" && "വിഭാഗം: അടിത്തറയും ഫൗണ്ടേഷനും (Substructure)"}
                    {customItemModal.section === "superstructure" && "വിഭാഗം: ഭിത്തികളും കോൺക്രീറ്റും (Superstructure)"}
                    {customItemModal.section === "customSpecs" && "വിഭാഗം: മറ്റ് പ്രത്യേക വർക്കുകൾ (Custom Specifications)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomItemModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-5 space-y-3.5 text-xs font-mono max-h-[75vh] overflow-y-auto">
              {/* Malayalam Title / Heading */}
              <div>
                <label className="text-slate-300 block mb-1 font-bold">
                  തലക്കെട്ട് / ഇനം പേര് (മലയാളത്തിൽ) <span className="text-amber-400">*</span>:
                </label>
                <input
                  type="text"
                  value={customItemModal.titleMl}
                  onChange={e => setCustomItemModal({ ...customItemModal, titleMl: e.target.value })}
                  placeholder="ഉദാഹരണത്തിന്: കട്ടർ പൈലിംഗ് & സോയിൽ ടെസ്റ്റിംഗ്"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
                  autoFocus
                />
              </div>

              {/* English Title / Heading */}
              <div>
                <label className="text-slate-300 block mb-1 font-bold">
                  Heading / Item Title (English):
                </label>
                <input
                  type="text"
                  value={customItemModal.title}
                  onChange={e => setCustomItemModal({ ...customItemModal, title: e.target.value })}
                  placeholder="e.g. Pile Foundation & Soil Investigation"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* Category (if customSpecs) */}
              {customItemModal.section === "customSpecs" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-bold">വിഭാഗം (Category):</label>
                    <input
                      type="text"
                      value={customItemModal.category || ""}
                      onChange={e => setCustomItemModal({ ...customItemModal, category: e.target.value })}
                      placeholder="Solar, CCTV, Landscaping, Roofing..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-purple-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-bold">നിരക്ക് / ബഡ്ജറ്റ് തുക (₹ Cost):</label>
                    <input
                      type="number"
                      value={customItemModal.rateOrCost || 0}
                      onChange={e => setCustomItemModal({ ...customItemModal, rateOrCost: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Description / Specification */}
              <div>
                <label className="text-slate-300 block mb-1 font-bold">
                  വിശദമായ സാങ്കേതിക വിവരണം (Detailed Specification / Description) <span className="text-amber-400">*</span>:
                </label>
                <textarea
                  rows={4}
                  value={customItemModal.specification}
                  onChange={e => setCustomItemModal({ ...customItemModal, specification: e.target.value })}
                  placeholder="മെറ്റീരിയൽ ബ്രാൻഡ്, കനം, അനുപാതം, ഗുണനിലവാരം, നിർമ്മാണ രീതി എന്നിവ പൂർണ്ണമായി രേഖപ്പെടുത്തുക..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 leading-relaxed"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="text-slate-300 block mb-1">പ്രത്യേക കുറിപ്പുകൾ / നിബന്ധനകൾ (Remarks / Notes):</label>
                <input
                  type="text"
                  value={customItemModal.remarks || ""}
                  onChange={e => setCustomItemModal({ ...customItemModal, remarks: e.target.value })}
                  placeholder="ഉദാ: ക്ലയന്റ് അനുമതിക്ക് വിധേയമായി..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-300"
                />
              </div>

              {/* Contract Inclusion Toggle (for custom specs) */}
              {customItemModal.section === "customSpecs" && (
                <label className="flex items-center gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customItemModal.isIncluded}
                    onChange={e => setCustomItemModal({ ...customItemModal, isIncluded: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700"
                  />
                  <div>
                    <span className="text-white font-bold text-xs block">കരാർ തുകയിൽ ഉൾപ്പെടുത്തിയിരിക്കുന്നു (Included in Base Contract)</span>
                    <span className="text-[10px] text-slate-400">ഓഫാക്കിയാൽ ഇത് അധിക തുകയായി കണക്കാക്കും (Extra Item)</span>
                  </div>
                </label>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center gap-2">
              <div>
                {customItemModal.index >= 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteModalCustomItem}
                    className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl font-bold flex items-center gap-1.5 transition text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ഡിലീറ്റ് ചെയ്യുക (Delete)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomItemModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs font-bold"
                >
                  റദ്ദാക്കുക (Cancel)
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalCustomItem}
                  disabled={!customItemModal.title.trim() && !customItemModal.titleMl.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition text-xs shadow-lg shadow-emerald-950"
                >
                  <Check className="w-4 h-4" />
                  <span>സൂക്ഷിക്കുക (Save Specification)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
