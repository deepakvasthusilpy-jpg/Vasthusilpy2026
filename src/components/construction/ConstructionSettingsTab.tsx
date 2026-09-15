import React, { useState } from "react";
import { ConstructionSettings, ContractorDetails, ConstructionStageMaster } from "../../types";
import {
  ConstructionStorageManager,
  DEFAULT_WORK_SPECIFICATIONS,
  DEFAULT_GENERAL_CLAUSES
} from "../../utils/constructionStorageManager";
import { AgreementClausesEditor } from "./AgreementClausesEditor";
import { AgreementSpecificationsEditor } from "./AgreementSpecificationsEditor";
import {
  Settings,
  Building,
  Printer,
  Sliders,
  FileText,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Layers
} from "lucide-react";

interface ConstructionSettingsTabProps {
  settings: ConstructionSettings;
  onSettingsUpdated: (updated: ConstructionSettings) => void;
}

export const ConstructionSettingsTab: React.FC<ConstructionSettingsTabProps> = ({
  settings: initialSettings,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<ConstructionSettings>({
    ...initialSettings,
    agreementTemplate: {
      ...initialSettings.agreementTemplate,
      clauses: initialSettings.agreementTemplate?.clauses || DEFAULT_GENERAL_CLAUSES,
      defaultSpecifications: initialSettings.agreementTemplate?.defaultSpecifications || DEFAULT_WORK_SPECIFICATIONS
    }
  });
  const [activeSubTab, setActiveSubTab] = useState<"contractor" | "clauses" | "specs" | "stages" | "rates" | "print">("contractor");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    const saved = ConstructionStorageManager.saveSettings(settings);
    onSettingsUpdated(saved);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddStage = () => {
    const newStage: ConstructionStageMaster = {
      id: `st_${Date.now()}`,
      order: settings.stages.length + 1,
      name: "New Construction Stage",
      nameMl: "പുതിയ ഘട്ടം",
      percentage: 5,
      calculationMode: "percentage",
      labourIncluded: true,
      displayInAgreement: true,
      isActive: true,
      description: "Stage description"
    };
    setSettings({
      ...settings,
      stages: [...settings.stages, newStage]
    });
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold border border-slate-700">
              MODULE SETTINGS
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
            നിർമ്മാണ ക്രമീകരണങ്ങൾ (Construction Settings)
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            CONFIGURE CONTRACTOR PROFILE, DEFAULT CLAUSES & SPECS MASTER, 25+ STAGES & PRINT MARGINS
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>ക്രമീകരണങ്ങൾ സേവ് ചെയ്യുക (Save Settings)</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-mono font-bold text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>ക്രമീകരണങ്ങൾ വിജയകരമായി സേവ് ചെയ്തു!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-2 rounded-2xl border border-slate-800 overflow-x-auto">
        {[
          { id: "contractor", label: "സ്ഥാപനം & കോൺട്രാക്ടർ (Contractor)", icon: Building },
          { id: "clauses", label: "കരാർ വ്യവസ്ഥകൾ (Default Clauses)", icon: FileText },
          { id: "specs", label: "സ്പെസിഫിക്കേഷൻ മാസ്റ്റർ (Default Specs)", icon: Layers },
          { id: "stages", label: "25 നിർമ്മാണ ഘട്ടങ്ങൾ (Stages Master)", icon: Sliders },
          { id: "rates", label: "ഡിഫോൾട്ട് നിരക്കുകൾ (Default Rates)", icon: Sparkles },
          { id: "print", label: "ഇ-സ്റ്റാമ്പ് പ്രിന്റ് മാർജിനുകൾ (Print Setup)", icon: Printer }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === t.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      {activeSubTab === "contractor" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 border-b border-slate-800 pb-2">
            സ്ഥാപനത്തിന്റെയും എൻജിനീയറുടെയും വിവരങ്ങൾ (Company & Contractor Profile)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">സ്ഥാപനത്തിന്റെ പേര് (Company Name):</label>
              <input
                type="text"
                value={settings.contractor.companyName}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, companyName: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">പ്രൊപ്രൈറ്റർ / എൻജിനീയർ (Proprietor Name):</label>
              <input
                type="text"
                value={settings.contractor.proprietorName}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, proprietorName: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">പദവി (Designation):</label>
              <input
                type="text"
                value={settings.contractor.designation}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, designation: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">LSGD ലൈസൻസ് നമ്പർ (License No):</label>
              <input
                type="text"
                value={settings.contractor.licenseNumber || ""}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, licenseNumber: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-1">ഓഫീസ് മേൽവിലാസം (Address):</label>
              <input
                type="text"
                value={settings.contractor.address}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, address: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">ഫോൺ (Phone):</label>
              <input
                type="text"
                value={settings.contractor.phone}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, phone: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">ഇമെയിൽ (Email):</label>
              <input
                type="email"
                value={settings.contractor.email}
                onChange={e => setSettings({
                  ...settings,
                  contractor: { ...settings.contractor, email: e.target.value }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* CLAUSES MASTER */}
      {activeSubTab === "clauses" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>ഡിഫോൾട്ട് കരാർ വ്യവസ്ഥകൾ (Default Legal Clauses Master)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              പുതിയ നിർമ്മാണ കരാറുകൾ ഉണ്ടാക്കുമ്പോൾ സ്വയം വരുന്ന ഡിഫോൾട്ട് വ്യവസ്ഥകൾ ഇവിടെ ക്രമീകരിക്കാം.
            </p>
          </div>

          <AgreementClausesEditor
            clauses={settings.agreementTemplate?.clauses || DEFAULT_GENERAL_CLAUSES}
            onChange={updatedClauses => setSettings({
              ...settings,
              agreementTemplate: {
                ...settings.agreementTemplate,
                clauses: updatedClauses
              }
            })}
          />
        </div>
      )}

      {/* SPECS MASTER */}
      {activeSubTab === "specs" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>ഡിഫോൾട്ട് വർക്ക് സ്പെസിഫിക്കേഷൻ മാസ്റ്റർ (Default Technical Specifications Master)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              എല്ലാ പുതിയ കരാറുകൾക്കും ഡിഫോൾട്ടായി ഉപയോഗിക്കുന്ന സബ്-സ്ട്രക്ച്ചർ, സൂപ്പർ-സ്ട്രക്ച്ചർ, സാനിറ്ററി, ഇലക്ട്രിക്കൽ, ഫ്ലോറിംഗ്, പെയിന്റിംഗ്, വാതിലുകൾ/ജനലുകൾ വിവരങ്ങൾ.
            </p>
          </div>

          <AgreementSpecificationsEditor
            specifications={settings.agreementTemplate?.defaultSpecifications || DEFAULT_WORK_SPECIFICATIONS}
            onChange={updatedSpecs => setSettings({
              ...settings,
              agreementTemplate: {
                ...settings.agreementTemplate,
                defaultSpecifications: updatedSpecs
              }
            })}
          />
        </div>
      )}

      {activeSubTab === "stages" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-amber-400">
              25 നിർമ്മാണ ഘട്ടങ്ങളുടെ മാസ്റ്റർ ലിസ്റ്റ് (Construction Stages Master)
            </h3>
            <button
              onClick={handleAddStage}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ പുതിയ ഘട്ടം ചേർക്കുക</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {settings.stages.map((st, idx) => (
              <div key={st.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 items-center text-xs font-mono">
                <div className="sm:col-span-1 text-slate-500 font-bold text-center">#{idx + 1}</div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={st.name}
                    onChange={e => {
                      const copy = [...settings.stages];
                      copy[idx].name = e.target.value;
                      setSettings({ ...settings, stages: copy });
                    }}
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={st.nameMl || ""}
                    onChange={e => {
                      const copy = [...settings.stages];
                      copy[idx].nameMl = e.target.value;
                      setSettings({ ...settings, stages: copy });
                    }}
                    placeholder="മലയാളം പേര്"
                    className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-sans"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={st.percentage}
                      onChange={e => {
                        const copy = [...settings.stages];
                        copy[idx].percentage = parseFloat(e.target.value) || 0;
                        setSettings({ ...settings, stages: copy });
                      }}
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right text-amber-400 font-bold"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] text-slate-500">%</span>
                  </div>
                </div>
                <div className="sm:col-span-1 text-center">
                  <input
                    type="checkbox"
                    checked={st.isActive}
                    onChange={e => {
                      const copy = [...settings.stages];
                      copy[idx].isActive = e.target.checked;
                      setSettings({ ...settings, stages: copy });
                    }}
                    className="rounded border-slate-700 text-emerald-500"
                  />
                </div>
                <div className="sm:col-span-1 text-center">
                  <button
                    onClick={() => {
                      const filtered = settings.stages.filter((_, i) => i !== idx);
                      setSettings({ ...settings, stages: filtered });
                    }}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "rates" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 border-b border-slate-800 pb-2">
            ഡിഫോൾട്ട് സ്പെസിഫിക്കേഷൻ നിരക്കുകൾ (Default Material Rates)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">അടിസ്ഥാന നിരക്ക് (Base Rate / Sq.Ft):</label>
              <input
                type="number"
                value={settings.defaultRates.baseRatePerSqFt}
                onChange={e => setSettings({
                  ...settings,
                  defaultRates: { ...settings.defaultRates, baseRatePerSqFt: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">ഫ്ലോർ ടൈൽ നിരക്ക് (Tile Rate / Sq.Ft):</label>
              <input
                type="number"
                value={settings.defaultRates.tileRateLimitPerSqFt}
                onChange={e => setSettings({
                  ...settings,
                  defaultRates: { ...settings.defaultRates, tileRateLimitPerSqFt: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">ഗ്രാനൈറ്റ് നിരക്ക് (Granite / Sq.Ft):</label>
              <input
                type="number"
                value={settings.defaultRates.graniteRateLimitPerSqFt}
                onChange={e => setSettings({
                  ...settings,
                  defaultRates: { ...settings.defaultRates, graniteRateLimitPerSqFt: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "print" && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-2">
            കേരള ഇ-സ്റ്റാമ്പ് പേപ്പർ പ്രിന്റ് മാർജിൻ ക്രമീകരണങ്ങൾ (Kerala E-Stamp Print Layout)
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Kerala Government e-Stamp certificates require a 210mm (8.3 in) top clearance on the first page so the agreement prints cleanly below the legal stamp certificate.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
            <div>
              <label className="text-slate-400 block mb-1">First Page Top (mm):</label>
              <input
                type="number"
                value={settings.printSettings?.eStampTopMarginMm ?? 210}
                onChange={e => setSettings({
                  ...settings,
                  printSettings: { ...settings.printSettings, eStampTopMarginMm: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Left Margin (mm):</label>
              <input
                type="number"
                value={settings.printSettings?.leftMarginMm ?? 35}
                onChange={e => setSettings({
                  ...settings,
                  printSettings: { ...settings.printSettings, leftMarginMm: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Right Margin (mm):</label>
              <input
                type="number"
                value={settings.printSettings?.rightMarginMm ?? 15}
                onChange={e => setSettings({
                  ...settings,
                  printSettings: { ...settings.printSettings, rightMarginMm: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Bottom Margin (mm):</label>
              <input
                type="number"
                value={settings.printSettings?.bottomMarginMm ?? 25}
                onChange={e => setSettings({
                  ...settings,
                  printSettings: { ...settings.printSettings, bottomMarginMm: parseFloat(e.target.value) || 0 }
                })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
