import React, { useState } from "react";
import { HealthInsurancePolicy } from "../../types";
import {
  loadHealthInsurancePolicies,
  saveHealthInsurancePolicies,
  generateHealthInsuranceWhatsAppMessage,
  shareViaWhatsApp
} from "../../utils/personalBillsStorage";
import {
  HeartPulse,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Phone,
  FileText,
  Printer,
  Sparkles,
  Award,
  HelpCircle,
  MessageSquare
} from "lucide-react";

export const HealthInsuranceTab: React.FC = () => {
  const [policies, setPolicies] = useState<HealthInsurancePolicy[]>(() =>
    loadHealthInsurancePolicies()
  );

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<HealthInsurancePolicy | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<HealthInsurancePolicy | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingPolicy, setRenewingPolicy] = useState<HealthInsurancePolicy | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<HealthInsurancePolicy>>({
    policyName: "Star Health Comprehensive Family Optima",
    policyNumber: "P/161114/01/2026/004821",
    insurerName: "Star Health and Allied Insurance Co.",
    policyHolderName: "Deepak (Vasthusilpy)",
    insuredMembers: [
      { name: "Deepak", relation: "Self", age: 38 },
      { name: "Preetha Deepak", relation: "Spouse", age: 34 }
    ],
    sumInsured: 1000000,
    cumulativeBonus: 250000,
    premiumAmount: 22400,
    gstAmount: 4032,
    totalPremium: 26432,
    paymentFrequency: "YEARLY",
    policyStartDate: "2025-10-15",
    policyEndDate: "2026-10-14",
    nextRenewalDueDate: "2026-10-14",
    status: "ACTIVE",
    tpaDetails: "In-house TPA (Star Health Direct)",
    cashlessHelpline: "1800-425-2255 / 1800-102-4477",
    agentContact: "Suresh Palakkad - 9846123987",
    notes: ""
  });

  // Renew Form State
  const [renewAmount, setRenewAmount] = useState<number>(0);
  const [renewDate, setRenewDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newEndDate, setNewEndDate] = useState<string>("");

  const handleUpdatePolicies = (newPolicies: HealthInsurancePolicy[]) => {
    setPolicies(newPolicies);
    saveHealthInsurancePolicies(newPolicies);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const premium = Number(formData.premiumAmount) || 0;
    const gst = Number(formData.gstAmount) || Math.round(premium * 0.18);
    const total = premium + gst;

    const policyToSave: HealthInsurancePolicy = {
      id: editingPolicy ? editingPolicy.id : `HI-${Date.now().toString().slice(-6)}`,
      policyName: formData.policyName || "Health Insurance Plan",
      policyNumber: formData.policyNumber || "POLICY-NUM",
      insurerName: formData.insurerName || "Insurance Provider",
      policyHolderName: formData.policyHolderName || "Policy Holder",
      insuredMembers: formData.insuredMembers || [],
      sumInsured: Number(formData.sumInsured) || 500000,
      cumulativeBonus: Number(formData.cumulativeBonus) || 0,
      premiumAmount: premium,
      gstAmount: gst,
      totalPremium: total,
      paymentFrequency: formData.paymentFrequency || "YEARLY",
      policyStartDate: formData.policyStartDate || new Date().toISOString().split("T")[0],
      policyEndDate: formData.policyEndDate || new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
      nextRenewalDueDate: formData.nextRenewalDueDate || formData.policyEndDate || "",
      lastPaidDate: formData.lastPaidDate || new Date().toISOString().split("T")[0],
      status: formData.status || "ACTIVE",
      tpaDetails: formData.tpaDetails || "",
      cashlessHelpline: formData.cashlessHelpline || "",
      agentContact: formData.agentContact || "",
      notes: formData.notes || ""
    };

    if (editingPolicy) {
      handleUpdatePolicies(policies.map((p) => (p.id === editingPolicy.id ? policyToSave : p)));
    } else {
      handleUpdatePolicies([policyToSave, ...policies]);
    }

    setIsAddModalOpen(false);
    setEditingPolicy(null);
  };

  const handleConfirmDelete = () => {
    if (!policyToDelete) return;
    handleUpdatePolicies(policies.filter((p) => p.id !== policyToDelete.id));
    setPolicyToDelete(null);
  };

  const handleConfirmRenewal = () => {
    if (!renewingPolicy) return;
    const nextStart = renewingPolicy.policyEndDate;
    const nextEnd =
      newEndDate ||
      new Date(new Date(nextStart).getTime() + 365 * 86400000).toISOString().split("T")[0];

    const updated = policies.map((p) => {
      if (p.id === renewingPolicy.id) {
        return {
          ...p,
          policyStartDate: nextStart,
          policyEndDate: nextEnd,
          nextRenewalDueDate: nextEnd,
          lastPaidDate: renewDate,
          totalPremium: renewAmount || p.totalPremium,
          status: "ACTIVE" as const
        };
      }
      return p;
    });

    handleUpdatePolicies(updated);
    setIsRenewModalOpen(false);
    setRenewingPolicy(null);
  };

  // Add/Remove Insured Member in form
  const handleAddMember = () => {
    const current = formData.insuredMembers || [];
    setFormData({
      ...formData,
      insuredMembers: [...current, { name: "", relation: "Child", age: 10 }]
    });
  };

  const handleRemoveMember = (idx: number) => {
    const current = formData.insuredMembers || [];
    setFormData({
      ...formData,
      insuredMembers: current.filter((_, i) => i !== idx)
    });
  };

  const handleMemberChange = (idx: number, field: string, val: string | number) => {
    const current = [...(formData.insuredMembers || [])];
    current[idx] = { ...current[idx], [field]: val };
    setFormData({ ...formData, insuredMembers: current });
  };

  // KPIs
  const totalSumInsured = policies.reduce((s, p) => s + p.sumInsured, 0);
  const totalAnnualPremium = policies.reduce((s, p) => s + p.totalPremium, 0);
  const totalInsuredMembers = policies.reduce((s, p) => s + (p.insuredMembers?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/40 to-emerald-950/40 border border-rose-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 shadow-inner">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 uppercase">
                HEALTH & MEDICLAIM
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                FAMILY FLOATER & OPD
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              ആരോഗ്യ ഇൻഷുറൻസ് പോളിസികൾ & റിന്യൂവൽ
            </h2>
            <p className="text-xs md:text-sm text-purple-200/80 mt-0.5">
              കുടുംബാംഗങ്ങളുടെ മെഡിക്ലെയിം കവറേജ്, പ്രീമിയം അടവ് തീയതികൾ, ക്യാഷ്‌ലെസ്സ് ആശുപത്രി ഹെൽപ്പ്‌ലൈൻ.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>പ്രിന്റ് / PDF</span>
          </button>

          <button
            onClick={() => {
              setEditingPolicy(null);
              setFormData({
                policyName: "Star Health Comprehensive Family Optima",
                policyNumber: "P/161114/01/2026/004821",
                insurerName: "Star Health and Allied Insurance Co.",
                policyHolderName: "Deepak (Vasthusilpy)",
                insuredMembers: [
                  { name: "Deepak", relation: "Self", age: 38 },
                  { name: "Preetha Deepak", relation: "Spouse", age: 34 }
                ],
                sumInsured: 1000000,
                cumulativeBonus: 250000,
                premiumAmount: 22400,
                gstAmount: 4032,
                totalPremium: 26432,
                paymentFrequency: "YEARLY",
                policyStartDate: "2025-10-15",
                policyEndDate: "2026-10-14",
                nextRenewalDueDate: "2026-10-14",
                status: "ACTIVE",
                tpaDetails: "In-house TPA (Star Health Direct)",
                cashlessHelpline: "1800-425-2255",
                agentContact: "Suresh - 9846123987",
                notes: ""
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>പുതിയ പോളിസി ചേർക്കുക (Add Policy)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2b0818] to-[#3d0f25] border border-rose-500/30 shadow-lg">
          <div className="text-xs text-rose-300 font-bold mb-1">ആകെ ഇൻഷുറൻസ് കവറേജ്</div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{(totalSumInsured / 100000).toFixed(1)} <span className="text-sm font-normal">ലക്ഷം</span>
          </div>
          <div className="text-[11px] text-rose-200/70 mt-1 font-mono">Sum Insured + Bonus</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e072b] to-[#2c0b3d] border border-amber-500/30 shadow-lg">
          <div className="text-xs text-amber-300 font-bold mb-1">വാർഷിക പ്രീമിയം (ANNUAL)</div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            ₹{totalAnnualPremium.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-200/70 mt-1">ജിഎസ്ടി (18%) ഉൾപ്പെടെ</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a2318] to-[#123827] border border-emerald-500/30 shadow-lg">
          <div className="text-xs text-emerald-300 font-bold mb-1">പോളിസി പദവി (STATUS)</div>
          <div className="text-2xl font-black text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-6 h-6" />
            <span>ACTIVE</span>
          </div>
          <div className="text-[11px] text-emerald-200/70 mt-1">കവറേജ് നിലവിലുണ്ട് ✓</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1f38] to-[#142e50] border border-cyan-500/30 shadow-lg">
          <div className="text-xs text-cyan-300 font-bold mb-1">കവർ ചെയ്ത അംഗങ്ങൾ</div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {totalInsuredMembers} <span className="text-sm font-normal">പേർ</span>
          </div>
          <div className="text-[11px] text-cyan-200/70 mt-1">കുടുംബാംഗങ്ങളുടെ മെഡിക്കൽ കവർ</div>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((policy) => {
          return (
            <div
              key={policy.id}
              className="p-6 rounded-3xl bg-gradient-to-br from-[#180626] to-[#280a3d] border border-purple-500/40 backdrop-blur-xl shadow-2xl space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/30">
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{policy.policyName}</h3>
                    <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-2">
                      <span>{policy.insurerName}</span>
                      <span>•</span>
                      <span className="text-purple-200 font-normal">Policy No: {policy.policyNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-400 text-slate-950 flex items-center gap-1 shadow-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {policy.status}
                  </span>

                  <button
                    onClick={() => {
                      const text = generateHealthInsuranceWhatsAppMessage(policy);
                      shareViaWhatsApp({ text });
                    }}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white transition cursor-pointer"
                    title="വാട്സാപ്പ് വഴി അയക്കുക (Share to WhatsApp)"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setRenewingPolicy(policy);
                      setRenewAmount(policy.totalPremium);
                      setRenewDate(new Date().toISOString().split("T")[0]);
                      setIsRenewModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:from-amber-400 hover:to-yellow-400 transition cursor-pointer shadow-md"
                  >
                    റിന്യൂ ചെയ്യുക (Renew)
                  </button>

                  <button
                    onClick={() => {
                      setEditingPolicy(policy);
                      setFormData(policy);
                      setIsAddModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
                    title="Edit Policy"
                  >
                    <Edit2 className="w-4 h-4 text-yellow-300" />
                  </button>

                  <button
                    onClick={() => setPolicyToDelete(policy)}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                    title="Delete Policy"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details Metric Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60 font-sans">ഇൻഷുറൻസ് തുക (Sum Insured)</div>
                  <div className="text-base font-black text-emerald-300 mt-0.5">
                    ₹{policy.sumInsured.toLocaleString("en-IN")}
                  </div>
                  {policy.cumulativeBonus ? (
                    <div className="text-[10px] text-emerald-400/80 mt-0.5 font-sans">
                      + ₹{policy.cumulativeBonus.toLocaleString("en-IN")} Bonus
                    </div>
                  ) : null}
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60 font-sans">വാർഷിക പ്രീമിയം (Premium)</div>
                  <div className="text-base font-black text-amber-300 mt-0.5">
                    ₹{policy.totalPremium.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-purple-200/60 mt-0.5 font-sans">
                    Base ₹{policy.premiumAmount} + GST
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60 font-sans">പോളിസി കാലാവധി (Validity)</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {policy.policyStartDate} to
                  </div>
                  <div className="text-xs font-black text-cyan-300">{policy.policyEndDate}</div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60 font-sans">അടുത്ത റിന്യൂവൽ തീയതി</div>
                  <div className="text-sm font-black text-rose-300 mt-0.5">
                    {policy.nextRenewalDueDate}
                  </div>
                  <div className="text-[10px] text-purple-200/60 mt-0.5 font-sans">
                    Frequency: {policy.paymentFrequency}
                  </div>
                </div>
              </div>

              {/* Insured Family Members Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-200">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400" />
                    ഇൻഷൂർ ചെയ്യപ്പെട്ട അംഗങ്ങൾ (Insured Members - {policy.insuredMembers.length})
                  </span>
                  <span className="text-[11px] text-purple-300/70 font-mono">
                    പോളിസി ഹോൾഡർ: {policy.policyHolderName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {policy.insuredMembers.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-400/20 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{m.name}</div>
                        <div className="text-[10px] text-purple-200/70">
                          Relation: {m.relation}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[11px] font-bold">
                        {m.age} Yrs
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cashless Hospitalization Helpline & Agent Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-purple-200/80 border-t border-white/10 pt-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-emerald-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    ക്യാഷ്‌ലെസ്സ് ഹെൽപ്പ്‌ലൈൻ: {policy.cashlessHelpline || "1800-425-2255"}
                  </div>
                  <div className="text-[11px] text-purple-200/60">
                    TPA / ക്ലെയിം സപ്പോർട്ട്: {policy.tpaDetails}
                  </div>
                </div>

                {policy.agentContact && (
                  <div className="text-right">
                    <span className="text-slate-300 font-bold">ഇൻഷുറൻസ് ഏജന്റ്: </span>
                    <span className="text-amber-300 font-mono">{policy.agentContact}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT POLICY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingPolicy ? "പോളിസി വിവരങ്ങൾ തിരുത്തുക" : "പുതിയ ഹെൽത്ത് ഇൻഷുറൻസ് പോളിസി"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    പോളിസി പേര് (Plan Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.policyName || ""}
                    onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ഇൻഷുറൻസ് കമ്പനി (Insurer) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.insurerName || ""}
                    onChange={(e) => setFormData({ ...formData, insurerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    പോളിസി നമ്പർ (Policy Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.policyNumber || ""}
                    onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    പോളിസി ഹോൾഡർ പേര് *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.policyHolderName || ""}
                    onChange={(e) => setFormData({ ...formData, policyHolderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    കവറേജ് തുക (Sum Insured ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10000"
                    value={formData.sumInsured ?? 1000000}
                    onChange={(e) => setFormData({ ...formData, sumInsured: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    പ്രീമിയം തുക (Base ₹)
                  </label>
                  <input
                    type="number"
                    value={formData.premiumAmount ?? 22000}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const gst = Math.round(val * 0.18);
                      setFormData({ ...formData, premiumAmount: val, gstAmount: gst, totalPremium: val + gst });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    ആകെ പ്രീമിയം (Incl. GST ₹)
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xs">
                    ₹{formData.totalPremium ?? 0}
                  </div>
                </div>
              </div>

              {/* Insured Members Input */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300">
                    കുടുംബാംഗങ്ങൾ (Insured Members)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>അംഗത്തെ ചേർക്കുക</span>
                  </button>
                </div>

                {formData.insuredMembers?.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="പേര്"
                      value={m.name}
                      onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="ബന്ധം (Relation)"
                      value={m.relation}
                      onChange={(e) => handleMemberChange(idx, "relation", e.target.value)}
                      className="w-28 px-3 py-1.5 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                    />
                    <input
                      type="number"
                      placeholder="പ്രായം"
                      value={m.age}
                      onChange={(e) => handleMemberChange(idx, "age", Number(e.target.value))}
                      className="w-20 px-3 py-1.5 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    തുടങ്ങുന്ന തീയതി
                  </label>
                  <input
                    type="date"
                    value={formData.policyStartDate || ""}
                    onChange={(e) => setFormData({ ...formData, policyStartDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-300 mb-1">
                    കാലാവധി / റിന്യൂവൽ തീയതി *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.policyEndDate || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        policyEndDate: e.target.value,
                        nextRenewalDueDate: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-rose-400/40 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ക്യാഷ്‌ലെസ്സ് ഹെൽപ്പ്‌ലൈൻ
                  </label>
                  <input
                    type="text"
                    value={formData.cashlessHelpline || ""}
                    onChange={(e) => setFormData({ ...formData, cashlessHelpline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ഏജന്റ് കോൺടാക്റ്റ്
                  </label>
                  <input
                    type="text"
                    value={formData.agentContact || ""}
                    onChange={(e) => setFormData({ ...formData, agentContact: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg"
                >
                  {editingPolicy ? "സേവ് ചെയ്യുക" : "പോളിസി ചേർക്കുക"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENEW POLICY */}
      {isRenewModalOpen && renewingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">പോളിസി റിന്യൂവൽ സ്ഥിരീകരിക്കുക</h3>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-400/20 text-xs space-y-1">
                <div className="font-black text-white">{renewingPolicy.policyName}</div>
                <div className="text-purple-200/70 font-mono">{renewingPolicy.policyNumber}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  അടച്ച റിന്യൂവൽ പ്രീമിയം (₹)
                </label>
                <input
                  type="number"
                  value={renewAmount}
                  onChange={(e) => setRenewAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 text-amber-300 font-mono font-black text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  അടച്ച തീയതി
                </label>
                <input
                  type="date"
                  value={renewDate}
                  onChange={(e) => setRenewDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  പുതിയ കാലാവധി തീരുന്ന തീയതി (Next Expiry)
                </label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleConfirmRenewal}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition"
                >
                  റിന്യൂവൽ രേഖപ്പെടുത്തുക ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {policyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">ഹെൽത്ത് ഇൻഷുറൻസ് പോളിസി നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Health Insurance Policy</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 font-mono">
              <div><span className="text-slate-400">പോളിസി:</span> <strong className="text-white font-sans">{policyToDelete.policyName}</strong></div>
              <div><span className="text-slate-400">നമ്പർ:</span> <span className="text-amber-300 font-bold">{policyToDelete.policyNumber}</span></div>
              <div><span className="text-slate-400">പ്രീമിയം:</span> <span className="text-emerald-300 font-bold">₹{policyToDelete.totalPremium}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ ഇൻഷുറൻസ് പോളിസി റെക്കോർഡ് ലിസ്റ്റിൽ നിന്നും പൂർണ്ണമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPolicyToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ഡിലീറ്റ് ചെയ്യുക (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
