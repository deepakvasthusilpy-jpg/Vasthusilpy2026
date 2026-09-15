import React, { useState } from "react";
import { ConstructionAgreement, ConstructionSettings, ConstructionExtraWorkItem } from "../../types";
import {
  ConstructionStorageManager,
  formatIndianCurrency,
  convertAmountToWords,
  convertAmountToMalayalamWords
} from "../../utils/constructionStorageManager";
import { AgreementPrintView } from "./AgreementPrintView";
import { AgreementSpecificationsEditor } from "./AgreementSpecificationsEditor";
import { AgreementClausesEditor } from "./AgreementClausesEditor";
import { shareAgreementOnWhatsApp } from "../../utils/constructionShareManager";
import { useAuth } from "../../context/AuthContext";
import { canUseDigitalSignatures, AUTHORIZED_SIGNING_EMAILS } from "../../lib/firebase";
import {
  Save,
  Printer,
  FileCheck,
  Building,
  MapPin,
  Calendar,
  Plus,
  Trash2,
  Receipt,
  FileText,
  Copy,
  Layers,
  Sparkles,
  Download,
  Share2,
  Wrench,
  X,
  CheckCircle2,
  Lock,
  Stamp,
  UserCheck,
  AlertTriangle
} from "lucide-react";

interface AgreementEditorModalProps {
  agreement: ConstructionAgreement;
  settings: ConstructionSettings;
  onSave: (updated: ConstructionAgreement) => void;
  onClose: () => void;
}

export const AgreementEditorModal: React.FC<AgreementEditorModalProps> = ({
  agreement: initialAgreement,
  settings,
  onSave,
  onClose
}) => {
  const { user, emailUser } = useAuth();
  const activeEmail = user?.email || emailUser?.email || "";
  const isAuthorizedSigner = canUseDigitalSignatures(activeEmail);

  const [agreement, setAgreement] = useState<ConstructionAgreement>({
    ...initialAgreement,
    extraWorks: initialAgreement.extraWorks || []
  });
  const [activeEditorTab, setActiveEditorTab] = useState<"parties" | "areas_cost" | "extra_works" | "stages" | "specs" | "clauses" | "signatures">("parties");
  const [printMode, setPrintMode] = useState<"e_stamp" | "plain_a4" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  // Recalculate contract amounts
  const handleRateOrCostChange = (
    field: "baseRatePerSqFt" | "additionalCosts" | "discount" | "taxPercent",
    val: number,
    updatedExtraWorks?: ConstructionExtraWorkItem[]
  ) => {
    setAgreement(prev => {
      const extraList = updatedExtraWorks !== undefined ? updatedExtraWorks : (prev.extraWorks || []);
      const extraTotal = extraList.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

      const baseRate = field === "baseRatePerSqFt" ? val : prev.baseRatePerSqFt;
      const addl = field === "additionalCosts" ? val : extraTotal;
      const disc = field === "discount" ? val : prev.discount;
      const taxPct = field === "taxPercent" ? val : prev.taxPercent;

      const estimated = prev.totalBuiltUpArea * baseRate;
      const taxable = estimated + addl - disc;
      const taxAmt = (taxable * taxPct) / 100;
      const finalAmt = Math.max(0, taxable + taxAmt);
      const effRate = prev.totalBuiltUpArea > 0 ? Math.round(finalAmt / prev.totalBuiltUpArea) : baseRate;

      // Update payment schedule proportional amounts
      const updatedSchedule = prev.paymentSchedule.map(ps => ({
        ...ps,
        amount: Math.round((finalAmt * ps.percentage) / 100),
        balance: Math.round((finalAmt * ps.percentage) / 100) - (ps.paidAmount || 0)
      }));

      return {
        ...prev,
        [field]: val,
        additionalCosts: addl,
        extraWorks: extraList,
        estimatedConstructionCost: estimated,
        taxAmount: taxAmt,
        finalContractAmount: finalAmt,
        effectiveRatePerSqFt: effRate,
        amountInWords: convertAmountToWords(finalAmt),
        amountInWordsMl: convertAmountToMalayalamWords(finalAmt),
        paymentSchedule: updatedSchedule
      };
    });
  };

  const handleAddExtraWork = () => {
    const newItem: ConstructionExtraWorkItem = {
      id: `ew_${Date.now()}`,
      name: "Extra Work Item",
      nameMl: "അധിക നിർമ്മാണ ജോലി",
      quantity: 1,
      unit: "LS",
      unitRate: 10000,
      totalAmount: 10000,
      isIncluded: true,
      remarks: ""
    };
    const updated = [...(agreement.extraWorks || []), newItem];
    const extraTotal = updated.reduce((s, it) => s + it.totalAmount, 0);
    handleRateOrCostChange("additionalCosts", extraTotal, updated);
  };

  const handleUpdateExtraWork = (idx: number, patch: Partial<ConstructionExtraWorkItem>) => {
    const copy = [...(agreement.extraWorks || [])];
    const existing = copy[idx];
    const updatedItem = { ...existing, ...patch };

    if (patch.quantity !== undefined || patch.unitRate !== undefined) {
      const q = patch.quantity !== undefined ? patch.quantity : updatedItem.quantity;
      const r = patch.unitRate !== undefined ? patch.unitRate : updatedItem.unitRate;
      updatedItem.totalAmount = Math.round(q * r);
    }

    copy[idx] = updatedItem;
    const extraTotal = copy.reduce((s, it) => s + it.totalAmount, 0);
    handleRateOrCostChange("additionalCosts", extraTotal, copy);
  };

  const handleDeleteExtraWork = (idx: number) => {
    const filtered = (agreement.extraWorks || []).filter((_, i) => i !== idx);
    const extraTotal = filtered.reduce((s, it) => s + it.totalAmount, 0);
    handleRateOrCostChange("additionalCosts", extraTotal, filtered);
  };

  const handleBalancePercentages = () => {
    const schedule = [...agreement.paymentSchedule];
    if (schedule.length === 0) return;
    const totalCurrentPct = schedule.reduce((sum, s) => sum + s.percentage, 0);
    if (totalCurrentPct === 0) return;

    const balanced = schedule.map(s => {
      const normalizedPct = Math.round((s.percentage / totalCurrentPct) * 100 * 10) / 10;
      return {
        ...s,
        percentage: normalizedPct,
        amount: Math.round((agreement.finalContractAmount * normalizedPct) / 100),
        balance: Math.round((agreement.finalContractAmount * normalizedPct) / 100) - (s.paidAmount || 0)
      };
    });

    setAgreement({
      ...agreement,
      paymentSchedule: balanced
    });
  };

  const handleSave = async (markStatus?: ConstructionAgreement["status"]) => {
    setIsSaving(true);
    try {
      const toSave: ConstructionAgreement = {
        ...agreement,
        status: markStatus || agreement.status,
        updatedAt: new Date().toISOString()
      };
      const saved = await ConstructionStorageManager.saveAgreement(toSave);
      setAgreement(saved);
      onSave(saved);
      setSaveSuccessMessage("കരാർ വിജയകരമായി സേവ് ചെയ്തു! (Agreement Saved)");
      setTimeout(() => setSaveSuccessMessage(""), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 md:p-6 flex flex-col items-center">
      {/* Container */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-sans truncate">
                  {agreement.title || "Construction Agreement Editor"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 font-bold">
                  {agreement.agreementNo}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                  agreement.status === "SIGNED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  {agreement.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {agreement.client.clientName} • {agreement.totalBuiltUpArea.toLocaleString()} Sq.Ft • {formatIndianCurrency(agreement.finalContractAmount)}
              </p>
            </div>
          </div>

          {/* Top Actions: Print, WhatsApp, Save, Close */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPrintMode("e_stamp")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-xs font-mono font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>E-Stamp</span>
            </button>
            <button
              onClick={() => setPrintMode("plain_a4")}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-mono font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={() => shareAgreementOnWhatsApp(agreement)}
              className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-bold rounded-xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer text-sm font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {saveSuccessMessage && (
          <div className="bg-emerald-950 border-b border-emerald-500/40 p-2 text-center text-xs font-mono text-emerald-300 font-bold flex items-center justify-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {/* Navigation Tabs for Editor */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-2 border-b border-slate-800 overflow-x-auto">
          {[
            { id: "parties", label: "1. Parties", icon: Building },
            { id: "areas_cost", label: "2. Areas & Rate", icon: Layers },
            { id: "extra_works", label: `3. Extra Works (${(agreement.extraWorks || []).length})`, icon: Wrench },
            { id: "stages", label: `4. Payment Stages (${agreement.paymentSchedule.length})`, icon: Receipt },
            { id: "specs", label: "5. Specifications", icon: Sparkles },
            { id: "clauses", label: "6. Terms & Clauses", icon: FileText },
            { id: "signatures", label: "7. Signatures & Witnesses", icon: FileCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveEditorTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeEditorTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-white text-xs">
          {/* TAB 1: PARTIES */}
          {activeEditorTab === "parties" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Party (Client) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-emerald-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>First Party Details (Client)</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Client Name:</label>
                    <input
                      type="text"
                      value={agreement.client.clientName}
                      onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, clientName: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">House Name:</label>
                    <input
                      type="text"
                      value={agreement.client.houseName}
                      onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, houseName: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Address:</label>
                    <input
                      type="text"
                      value={agreement.client.address}
                      onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, address: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">Mobile Number:</label>
                      <input
                        type="text"
                        value={agreement.client.mobileNumber}
                        onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, mobileNumber: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">Panchayat / Municipality:</label>
                      <input
                        type="text"
                        value={agreement.client.localBody}
                        onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, localBody: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">Village:</label>
                      <input
                        type="text"
                        value={agreement.client.village}
                        onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, village: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">Taluk:</label>
                      <input
                        type="text"
                        value={agreement.client.taluk}
                        onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, taluk: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">District:</label>
                      <input
                        type="text"
                        value={agreement.client.district}
                        onChange={e => setAgreement({ ...agreement, client: { ...agreement.client, district: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Second Party (Contractor) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-indigo-400 border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Second Party Details (Contractor / Builder)</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Company Name:</label>
                    <input
                      type="text"
                      value={agreement.contractor.companyName}
                      onChange={e => setAgreement({ ...agreement, contractor: { ...agreement.contractor, companyName: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Proprietor / Engineer:</label>
                    <input
                      type="text"
                      value={agreement.contractor.proprietorName}
                      onChange={e => setAgreement({ ...agreement, contractor: { ...agreement.contractor, proprietorName: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Office Address:</label>
                    <input
                      type="text"
                      value={agreement.contractor.address}
                      onChange={e => setAgreement({ ...agreement, contractor: { ...agreement.contractor, address: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">Phone Number:</label>
                      <input
                        type="text"
                        value={agreement.contractor.phone}
                        onChange={e => setAgreement({ ...agreement, contractor: { ...agreement.contractor, phone: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono">Email:</label>
                      <input
                        type="text"
                        value={agreement.contractor.email}
                        onChange={e => setAgreement({ ...agreement, contractor: { ...agreement.contractor, email: e.target.value } })}
                        className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">License Number:</label>
                    <input
                      type="text"
                      value={agreement.contractor.licenseNumber || ""}
                      onChange={e => setAgreement({ ...agreement, contractor: { ...agreement.contractor, licenseNumber: e.target.value } })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Site Details & Dates */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-sm text-cyan-400 border-b border-slate-800 pb-2">
                  Site Location & Timeline
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Agreement Date:</label>
                    <input
                      type="date"
                      value={agreement.agreementDate}
                      onChange={e => setAgreement({ ...agreement, agreementDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Place of Execution:</label>
                    <input
                      type="text"
                      value={agreement.place || ""}
                      onChange={e => setAgreement({ ...agreement, place: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                      placeholder="e.g. Palakkad"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Period (Months):</label>
                    <input
                      type="number"
                      value={agreement.completionPeriodMonths}
                      onChange={e => setAgreement({ ...agreement, completionPeriodMonths: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Completion Target Date:</label>
                    <input
                      type="date"
                      value={agreement.completionTargetDate}
                      onChange={e => setAgreement({ ...agreement, completionTargetDate: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FLOOR AREAS & COST */}
          {activeEditorTab === "areas_cost" && (
            <div className="space-y-6">
              {/* Floor Areas Breakdown */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <div className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Floor-Wise Area Breakdown</span>
                  </div>
                  <button
                    onClick={() => {
                      const newFloor = {
                        id: `fl_${Date.now()}`,
                        floorName: `Floor ${agreement.floors.length + 1}`,
                        areaSqFt: 0
                      };
                      const updatedFloors = [...agreement.floors, newFloor];
                      const sumArea = updatedFloors.reduce((s, f) => s + f.areaSqFt, 0);
                      const finalAmt = sumArea * agreement.baseRatePerSqFt + agreement.additionalCosts - agreement.discount + agreement.taxAmount;
                      setAgreement({
                        ...agreement,
                        floors: updatedFloors,
                        totalBuiltUpArea: sumArea,
                        estimatedConstructionCost: sumArea * agreement.baseRatePerSqFt,
                        finalContractAmount: finalAmt
                      });
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Floor</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {agreement.floors.map((floor, idx) => (
                    <div key={floor.id || idx} className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <input
                          type="text"
                          value={floor.floorName}
                          onChange={e => {
                            const copy = [...agreement.floors];
                            copy[idx].floorName = e.target.value;
                            setAgreement({ ...agreement, floors: copy });
                          }}
                          className="font-bold text-white bg-transparent focus:border-indigo-400 focus:outline-none w-1/2 font-mono"
                          placeholder="Floor Name"
                        />
                        <button
                          onClick={() => {
                            const filtered = agreement.floors.filter((_, i) => i !== idx);
                            const sumArea = filtered.reduce((s, f) => s + f.areaSqFt, 0);
                            const finalAmt = sumArea * agreement.baseRatePerSqFt + agreement.additionalCosts - agreement.discount + (sumArea * agreement.baseRatePerSqFt * agreement.taxPercent / 100);
                            setAgreement({
                              ...agreement,
                              floors: filtered,
                              totalBuiltUpArea: sumArea,
                              estimatedConstructionCost: sumArea * agreement.baseRatePerSqFt,
                              finalContractAmount: finalAmt
                            });
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono uppercase">Existing (Sq.Ft)</label>
                          <input
                            type="number"
                            value={floor.existingAreaSqFt || 0}
                            onChange={e => {
                              const copy = [...agreement.floors];
                              const existingVal = parseFloat(e.target.value) || 0;
                              copy[idx].existingAreaSqFt = existingVal;
                              const total = existingVal + (copy[idx].proposedAreaSqFt || 0);
                              copy[idx].areaSqFt = total;
                              
                              const sumArea = copy.reduce((s, f) => s + f.areaSqFt, 0);
                              const finalAmt = sumArea * agreement.baseRatePerSqFt + agreement.additionalCosts - agreement.discount + (sumArea * agreement.baseRatePerSqFt * agreement.taxPercent / 100);
                              
                              setAgreement({
                                ...agreement,
                                floors: copy,
                                totalBuiltUpArea: sumArea,
                                estimatedConstructionCost: sumArea * agreement.baseRatePerSqFt,
                                finalContractAmount: finalAmt,
                                amountInWords: convertAmountToWords(finalAmt),
                                amountInWordsMl: convertAmountToMalayalamWords(finalAmt)
                              });
                            }}
                            className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-mono uppercase">Proposed (Sq.Ft)</label>
                          <input
                            type="number"
                            value={floor.proposedAreaSqFt || 0}
                            onChange={e => {
                              const copy = [...agreement.floors];
                              const proposedVal = parseFloat(e.target.value) || 0;
                              copy[idx].proposedAreaSqFt = proposedVal;
                              const total = (copy[idx].existingAreaSqFt || 0) + proposedVal;
                              copy[idx].areaSqFt = total;
                              
                              const sumArea = copy.reduce((s, f) => s + f.areaSqFt, 0);
                              const finalAmt = sumArea * agreement.baseRatePerSqFt + agreement.additionalCosts - agreement.discount + (sumArea * agreement.baseRatePerSqFt * agreement.taxPercent / 100);
                              
                              setAgreement({
                                ...agreement,
                                floors: copy,
                                totalBuiltUpArea: sumArea,
                                estimatedConstructionCost: sumArea * agreement.baseRatePerSqFt,
                                finalContractAmount: finalAmt,
                                amountInWords: convertAmountToWords(finalAmt),
                                amountInWordsMl: convertAmountToMalayalamWords(finalAmt)
                              });
                            }}
                            className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
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

                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex justify-between items-center font-mono">
                  <span className="text-slate-300 font-bold">Total Built-up Area:</span>
                  <span className="text-indigo-400 font-bold text-sm">{agreement.totalBuiltUpArea.toLocaleString()} Sq.Ft</span>
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="font-bold text-sm text-emerald-400 border-b border-slate-800 pb-2">
                  Financial Calculation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Rate / Sq.Ft:</label>
                    <input
                      type="number"
                      value={agreement.baseRatePerSqFt}
                      onChange={e => handleRateOrCostChange("baseRatePerSqFt", parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Additional Costs:</label>
                    <input
                      type="number"
                      value={agreement.additionalCosts}
                      onChange={e => handleRateOrCostChange("additionalCosts", parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Discount:</label>
                    <input
                      type="number"
                      value={agreement.discount}
                      onChange={e => handleRateOrCostChange("discount", parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-rose-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Tax %:</label>
                    <input
                      type="number"
                      value={agreement.taxPercent}
                      onChange={e => handleRateOrCostChange("taxPercent", parseFloat(e.target.value) || 0)}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                {/* Grand Total */}
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>Final Contract Amount:</span>
                    <span className="text-emerald-400 font-mono text-base">{formatIndianCurrency(agreement.finalContractAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                    <span>Effective Rate: {formatIndianCurrency(agreement.effectiveRatePerSqFt, false)} / Sq.Ft</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-mono block">Amount in Words:</label>
                    <input
                      type="text"
                      value={agreement.amountInWords || ""}
                      onChange={e => setAgreement({ ...agreement, amountInWords: e.target.value })}
                      className="w-full mt-0.5 p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-sans text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXTRA WORKS (PROVISION TO ADD MORE WORKS) */}
          {activeEditorTab === "extra_works" && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-2 gap-2">
                <div>
                  <div className="font-bold text-sm text-amber-400 flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>Extra Works / Add-on Items</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Add extra works such as compound wall, well digging, interlock, modular kitchen, etc.
                  </p>
                </div>
                <button
                  onClick={handleAddExtraWork}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Extra Work</span>
                </button>
              </div>

              {/* Quick Presets for Extra Works */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] text-slate-400 font-mono shrink-0">Presets:</span>
                {[
                  { name: "Compound Wall", nameMl: "Compound Wall", rate: 850, unit: "R.Ft", qty: 150 },
                  { name: "Well Digging & Rings", nameMl: "Well Digging & Rings", rate: 65000, unit: "LS", qty: 1 },
                  { name: "Interlock Paving", nameMl: "Interlock Paving", rate: 75, unit: "Sq.Ft", qty: 400 },
                  { name: "Modular Kitchen", nameMl: "Modular Kitchen", rate: 120000, unit: "LS", qty: 1 },
                  { name: "Solar Power Provision", nameMl: "Solar Power Provision", rate: 45000, unit: "LS", qty: 1 }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newItem: ConstructionExtraWorkItem = {
                        id: `ew_${Date.now()}_${idx}`,
                        name: preset.name,
                        nameMl: preset.nameMl,
                        quantity: preset.qty,
                        unit: preset.unit,
                        unitRate: preset.rate,
                        totalAmount: preset.qty * preset.rate,
                        isIncluded: true,
                        remarks: ""
                      };
                      const updated = [...(agreement.extraWorks || []), newItem];
                      const extraTotal = updated.reduce((s, it) => s + it.totalAmount, 0);
                      handleRateOrCostChange("additionalCosts", extraTotal, updated);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/40 rounded-lg text-[11px] font-mono whitespace-nowrap cursor-pointer transition"
                  >
                    + {preset.nameMl}
                  </button>
                ))}
              </div>

              {/* Extra Works List */}
              <div className="space-y-2">
                {(agreement.extraWorks || []).map((work, idx) => (
                  <div key={work.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 items-center">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-slate-500 font-mono block">ജോലിയുടെ പേര് (Malayalam):</label>
                      <input
                        type="text"
                        value={work.nameMl || work.name}
                        onChange={e => handleUpdateExtraWork(idx, { nameMl: e.target.value, name: e.target.value })}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-sans text-xs font-bold"
                        placeholder="ഉദാ: ചുറ്റുമതിൽ"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-mono block">അളവ് (Quantity):</label>
                      <input
                        type="number"
                        value={work.quantity}
                        onChange={e => handleUpdateExtraWork(idx, { quantity: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-mono block">യൂണിറ്റ് (Unit):</label>
                      <select
                        value={work.unit}
                        onChange={e => handleUpdateExtraWork(idx, { unit: e.target.value })}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs"
                      >
                        <option value="Sq.Ft">Sq.Ft</option>
                        <option value="R.Ft">R.Ft</option>
                        <option value="Nos">Nos</option>
                        <option value="LS">LS (Lump Sum)</option>
                        <option value="Mtr">Mtr</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-mono block">നിരക്ക് (Unit Rate):</label>
                      <input
                        type="number"
                        value={work.unitRate}
                        onChange={e => handleUpdateExtraWork(idx, { unitRate: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 font-mono block">ആകെ തുക:</label>
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold text-xs">
                        {formatIndianCurrency(work.totalAmount)}
                      </div>
                    </div>
                    <div className="sm:col-span-1 text-center pt-3 sm:pt-0">
                      <button
                        onClick={() => handleDeleteExtraWork(idx)}
                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title="Delete Extra Work"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!agreement.extraWorks || agreement.extraWorks.length === 0) && (
                  <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 font-mono text-xs">
                    അധിക ജോലികൾ ഒന്നും ചേർത്തിട്ടില്ല. മുകളിൽ കാണുന്ന ബട്ടൺ വഴി ചേർക്കാവുന്നതാണ്.
                  </div>
                )}
              </div>

              {/* Extra Works Summary */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex justify-between items-center font-mono">
                <span className="text-slate-400">ആകെ അധിക ചിലവുകൾ (Total Additional Cost):</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatIndianCurrency(agreement.additionalCosts)}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: PAYMENT STAGES (PROVISION TO ADD MORE STAGES) */}
          {activeEditorTab === "stages" && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-2 gap-2">
                <div>
                  <div className="font-bold text-sm text-cyan-400 flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    <span>നിർമ്മാണ ഘട്ടങ്ങൾ & പെയ്‌മെന്റ് ഷെഡ്യൂൾ (Payment Stages)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ആകെ ശതമാനം 100% ആയി ക്രമീകരിക്കുക. പുതിയ ഘട്ടങ്ങൾ ആവശ്യമെങ്കിൽ ചേർക്കാം.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBalancePercentages}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold cursor-pointer"
                  >
                    ശതമാനം 100% ആക്കുക (Auto Balance)
                  </button>
                  <button
                    onClick={() => {
                      const newItem = {
                        id: `ps_${Date.now()}`,
                        stageName: `Stage ${agreement.paymentSchedule.length + 1}`,
                        stageNameMl: `ഘട്ടം ${agreement.paymentSchedule.length + 1}`,
                        percentage: 5,
                        amount: Math.round((agreement.finalContractAmount * 5) / 100),
                        status: "PENDING" as const,
                        paidAmount: 0,
                        balance: Math.round((agreement.finalContractAmount * 5) / 100),
                        remarks: "ഘട്ടം പൂർത്തിയാകുമ്പോൾ"
                      };
                      setAgreement({
                        ...agreement,
                        paymentSchedule: [...agreement.paymentSchedule, newItem]
                      });
                    }}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-950"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ പുതിയ ഘട്ടം ചേർക്കുക (Add Stage)</span>
                  </button>
                </div>
              </div>

              {/* Stages List */}
              <div className="space-y-2">
                {agreement.paymentSchedule.map((stage, idx) => (
                  <div key={stage.id || idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        value={stage.stageNameMl || stage.stageName}
                        onChange={e => {
                          const copy = [...agreement.paymentSchedule];
                          copy[idx].stageNameMl = e.target.value;
                          copy[idx].stageName = e.target.value;
                          setAgreement({ ...agreement, paymentSchedule: copy });
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-sans text-xs font-medium"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          value={stage.percentage}
                          onChange={e => {
                            const copy = [...agreement.paymentSchedule];
                            const pct = parseFloat(e.target.value) || 0;
                            copy[idx].percentage = pct;
                            copy[idx].amount = Math.round((agreement.finalContractAmount * pct) / 100);
                            copy[idx].balance = copy[idx].amount - (copy[idx].paidAmount || 0);
                            setAgreement({ ...agreement, paymentSchedule: copy });
                          }}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-400 font-mono font-bold text-xs"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-500 font-mono">%</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        value={stage.amount}
                        onChange={e => {
                          const copy = [...agreement.paymentSchedule];
                          const amt = parseFloat(e.target.value) || 0;
                          copy[idx].amount = amt;
                          copy[idx].balance = amt - (copy[idx].paidAmount || 0);
                          setAgreement({ ...agreement, paymentSchedule: copy });
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold text-xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={stage.remarks || ""}
                        onChange={e => {
                          const copy = [...agreement.paymentSchedule];
                          copy[idx].remarks = e.target.value;
                          setAgreement({ ...agreement, paymentSchedule: copy });
                        }}
                        placeholder="പെയ്‌മെന്റ് നിബന്ധന / Trigger"
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono text-[11px]"
                      />
                    </div>
                    <div className="sm:col-span-1 text-center">
                      <button
                        onClick={() => {
                          const filtered = agreement.paymentSchedule.filter((_, i) => i !== idx);
                          setAgreement({ ...agreement, paymentSchedule: filtered });
                        }}
                        className="p-2 text-rose-400 hover:text-rose-300 rounded-lg cursor-pointer"
                        title="Delete Stage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Validation Footer */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex justify-between items-center font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">ആകെ ശതമാനം:</span>
                  <span className={`font-bold ${
                    Math.round(agreement.paymentSchedule.reduce((s, p) => s + p.percentage, 0)) === 100
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}>
                    {Math.round(agreement.paymentSchedule.reduce((s, p) => s + p.percentage, 0) * 10) / 10}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">ആകെ ഘട്ട തുക:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatIndianCurrency(agreement.paymentSchedule.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WORK SPECS (ADD, EDIT, DELETE ACROSS 8 CATEGORIES) */}
          {activeEditorTab === "specs" && (
            <AgreementSpecificationsEditor
              specifications={agreement.specifications}
              onChange={updatedSpecs => setAgreement({ ...agreement, specifications: updatedSpecs })}
            />
          )}

          {/* TAB 6: GENERAL CLAUSES (ADD, EDIT, DELETE, RENUMBER, PRESETS) */}
          {activeEditorTab === "clauses" && (
            <AgreementClausesEditor
              clauses={agreement.clauses}
              onChange={updatedClauses => setAgreement({ ...agreement, clauses: updatedClauses })}
            />
          )}

          {/* TAB 7: SIGNATURES */}
          {activeEditorTab === "signatures" && (
            <div className="space-y-6">
              {/* Authorized Digital Signer Banner */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-white font-bold text-sm">
                        Digital Signature & Official Seal
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">
                        Authorised contractor/engineer verification for Vasthusilpy legal work agreements
                      </p>
                    </div>
                  </div>

                  {isAuthorizedSigner ? (
                    <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Logged in: {activeEmail} (Authorized Signer)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Digital Signature Restricted (View Only)</span>
                    </span>
                  )}
                </div>

                {isAuthorizedSigner ? (
                  <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-emerald-200 font-mono">
                      Click the button below to digitally sign and confirm the agreement.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSave("SIGNED")}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-950 cursor-pointer"
                    >
                      <Stamp className="w-4 h-4" />
                      <span>Apply Digital E-Sign</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex items-start gap-2.5 text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs font-mono">
                      To apply official engineer digital signature and seal, log in with <strong className="text-amber-100">deepak.vasthusilpy@gmail.com</strong> or <strong className="text-amber-100">dibindeepak1@gmail.com</strong>.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-emerald-400 border-b border-slate-800 pb-2">
                    Witness 1
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Name:</label>
                    <input
                      type="text"
                      value={agreement.witness1?.name || ""}
                      onChange={e => setAgreement({
                        ...agreement,
                        witness1: { name: e.target.value, address: agreement.witness1?.address || "" }
                      })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Address:</label>
                    <input
                      type="text"
                      value={agreement.witness1?.address || ""}
                      onChange={e => setAgreement({
                        ...agreement,
                        witness1: { name: agreement.witness1?.name || "", address: e.target.value }
                      })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="font-bold text-sm text-cyan-400 border-b border-slate-800 pb-2">
                    Witness 2
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Name:</label>
                    <input
                      type="text"
                      value={agreement.witness2?.name || ""}
                      onChange={e => setAgreement({
                        ...agreement,
                        witness2: { name: e.target.value, address: agreement.witness2?.address || "" }
                      })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono">Address:</label>
                    <input
                      type="text"
                      value={agreement.witness2?.address || ""}
                      onChange={e => setAgreement({
                        ...agreement,
                        witness2: { name: agreement.witness2?.name || "", address: e.target.value }
                      })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status change bar */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-white font-bold text-sm">Change Agreement Status</div>
                  <div className="text-slate-400 text-xs font-mono">
                    Token: {agreement.verificationToken} • Created: {agreement.createdAt.slice(0, 10)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {(["DRAFT", "GENERATED", "APPROVED", "SIGNED", "ACTIVE"] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        if (st === "SIGNED" && !isAuthorizedSigner) {
                          alert(
                            `Digital signing and SIGNED status are restricted to authorized accounts (${AUTHORIZED_SIGNING_EMAILS.join(
                              ", "
                            )}). Currently logged in as: ${activeEmail || "Guest"}`
                          );
                          return;
                        }
                        handleSave(st);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                        agreement.status === st
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Printable View Modal */}
      {printMode && (
        <AgreementPrintView
          agreement={agreement}
          settings={settings}
          printMode={printMode}
          onClose={() => setPrintMode(null)}
        />
      )}
    </div>
  );
};
