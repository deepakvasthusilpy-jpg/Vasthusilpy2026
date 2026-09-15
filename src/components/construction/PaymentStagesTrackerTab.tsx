import React, { useState } from "react";
import {
  ConstructionProject,
  ConstructionAgreement,
  ConstructionSettings,
  PaymentScheduleItem,
  FloorAreaEntry,
  ConstructionExtraWorkItem
} from "../../types";
import {
  formatIndianCurrency,
  ConstructionStorageManager
} from "../../utils/constructionStorageManager";
import { StageChecklistModal } from "./StageChecklistModal";
import {
  Receipt,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckSquare,
  Wrench,
  Calculator,
  Share2,
  Calendar
} from "lucide-react";

interface PaymentStagesTrackerTabProps {
  projects: ConstructionProject[];
  agreements: ConstructionAgreement[];
  settings: ConstructionSettings;
  onProjectUpdated: (project: ConstructionProject) => void;
  onAgreementUpdated: (agreement: ConstructionAgreement) => void;
}

export const PaymentStagesTrackerTab: React.FC<PaymentStagesTrackerTabProps> = ({
  projects,
  agreements,
  settings,
  onProjectUpdated,
  onAgreementUpdated
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>("ALL");
  const [activeViewMode, setActiveViewMode] = useState<"STAGES" | "FLOORS" | "EXTRA_WORKS">("STAGES");
  const [checklistStageIndex, setChecklistStageIndex] = useState<number | null>(null);

  // New extra work form state
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const [newExtraWork, setNewExtraWork] = useState<Partial<ConstructionExtraWorkItem>>({
    name: "Additional Work",
    nameMl: "അധിക ജോലി",
    floorOrArea: "Ground Floor",
    category: "CIVIL",
    quantity: 1,
    unit: "LS",
    unitRate: 15000,
    totalAmount: 15000
  });

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const activeAgreement = agreements.find(
    a => a.projectId === activeProject?.id || a.id === activeProject?.agreementId
  );

  const floors: FloorAreaEntry[] = activeProject?.floors || activeAgreement?.floors || [
    { id: "fl_1", floorName: "Ground Floor", areaSqFt: activeProject?.totalBuiltUpArea || 1200 }
  ];

  const paymentSchedule: PaymentScheduleItem[] =
    activeAgreement?.paymentSchedule || activeProject?.paymentSchedule || [];

  const extraWorks: ConstructionExtraWorkItem[] =
    activeProject?.extraWorks || activeAgreement?.extraWorks || [];

  // Filter schedule based on floor selection if applicable
  const filteredSchedule = paymentSchedule.filter(stg => {
    if (selectedFloorFilter === "ALL") return true;
    if (!stg.floorName) {
      // Check if stage name mentions ground, first, etc.
      const name = (stg.stageName + " " + (stg.remarks || "")).toLowerCase();
      if (selectedFloorFilter.toLowerCase().includes("ground") && name.includes("ground")) return true;
      if (selectedFloorFilter.toLowerCase().includes("first") && (name.includes("first") || name.includes("1st"))) return true;
      if (selectedFloorFilter.toLowerCase().includes("second") && (name.includes("second") || name.includes("2nd"))) return true;
      return true; // show by default
    }
    return stg.floorName === selectedFloorFilter;
  });

  // Calculate Overall Progress % based on stage checklists
  const overallWorkProgress = ConstructionStorageManager.calculateProjectOverallProgress(paymentSchedule);
  const totalReceived = activeProject?.totalReceived || paymentSchedule.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const totalContract = activeProject?.finalContractAmount || activeAgreement?.finalContractAmount || 1;
  const financialProgressPct = Math.round((totalReceived / totalContract) * 100);

  // Floor-wise calculated cost matrix
  const floorCostMatrix = floors.map(floor => {
    const floorArea = Number(floor.areaSqFt) || 0;
    const floorRate = Number(floor.ratePerSqFt) || activeProject?.baseRatePerSqFt || 2300;
    const floorEstimatedCost = floorArea * floorRate;
    const floorRatio = activeProject?.totalBuiltUpArea ? floorArea / activeProject.totalBuiltUpArea : 1 / floors.length;
    const floorAllocatedReceived = Math.round(totalReceived * floorRatio);
    const floorBalance = Math.max(0, floorEstimatedCost - floorAllocatedReceived);

    return {
      floor,
      area: floorArea,
      rate: floorRate,
      estimatedCost: floorEstimatedCost,
      allocatedPaid: floorAllocatedReceived,
      balance: floorBalance,
      completionPct: overallWorkProgress // linked to project stage progress
    };
  });

  const handleStagePaymentStatus = (idx: number, status: "PAID" | "PENDING" | "DUE") => {
    if (!activeAgreement && !activeProject) return;

    const updatedSchedule = [...paymentSchedule];
    const item = updatedSchedule[idx];
    const isPaid = status === "PAID";

    updatedSchedule[idx] = {
      ...item,
      status,
      paidAmount: isPaid ? item.amount : 0,
      balance: isPaid ? 0 : item.amount,
      paidDate: isPaid ? new Date().toISOString().slice(0, 10) : undefined,
      isCompleted: isPaid ? true : item.isCompleted,
      progressPercent: isPaid ? 100 : item.progressPercent
    };

    const newTotalReceived = updatedSchedule.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const newBalance = Math.max(0, totalContract - newTotalReceived);
    const newProgress = ConstructionStorageManager.calculateProjectOverallProgress(updatedSchedule);

    if (activeAgreement) {
      const updatedAgr: ConstructionAgreement = {
        ...activeAgreement,
        paymentSchedule: updatedSchedule,
        updatedAt: new Date().toISOString()
      };
      const savedAgr = ConstructionStorageManager.saveAgreement(updatedAgr);
      onAgreementUpdated(savedAgr);
    }

    if (activeProject) {
      const updatedPrj: ConstructionProject = {
        ...activeProject,
        paymentSchedule: updatedSchedule,
        totalReceived: newTotalReceived,
        balanceAmount: newBalance,
        progressPercentage: newProgress,
        updatedAt: new Date().toISOString()
      };
      const savedPrj = ConstructionStorageManager.saveProject(updatedPrj);
      onProjectUpdated(savedPrj);
    }
  };

  const handleSaveChecklist = (updatedSchedule: PaymentScheduleItem[], overallProg: number) => {
    if (activeAgreement) {
      const updatedAgr: ConstructionAgreement = {
        ...activeAgreement,
        paymentSchedule: updatedSchedule,
        updatedAt: new Date().toISOString()
      };
      const savedAgr = ConstructionStorageManager.saveAgreement(updatedAgr);
      onAgreementUpdated(savedAgr);
    }

    if (activeProject) {
      const updatedPrj: ConstructionProject = {
        ...activeProject,
        paymentSchedule: updatedSchedule,
        progressPercentage: overallProg,
        updatedAt: new Date().toISOString()
      };
      const savedPrj = ConstructionStorageManager.saveProject(updatedPrj);
      onProjectUpdated(savedPrj);
    }
  };

  // Add Additional Work Handler
  const handleAddExtraWork = () => {
    if (!newExtraWork.name || !activeProject) return;

    const item: ConstructionExtraWorkItem = {
      id: `ew_${Date.now()}`,
      name: newExtraWork.name || "Additional Work",
      nameMl: newExtraWork.nameMl || "അധിക ജോലി",
      floorOrArea: newExtraWork.floorOrArea || "Ground Floor",
      category: newExtraWork.category || "CIVIL",
      quantity: Number(newExtraWork.quantity) || 1,
      unit: newExtraWork.unit || "LS",
      unitRate: Number(newExtraWork.unitRate) || 10000,
      totalAmount: (Number(newExtraWork.quantity) || 1) * (Number(newExtraWork.unitRate) || 10000),
      isIncluded: true,
      status: "APPROVED",
      paymentStatus: "PENDING",
      remarks: newExtraWork.remarks || "",
      addedDate: new Date().toISOString().slice(0, 10)
    };

    const updatedExtraList = [...extraWorks, item];
    const totalExtraCost = updatedExtraList.reduce((sum, it) => sum + (Number(it.totalAmount) || 0), 0);
    const baseCost = (activeProject.totalBuiltUpArea || 0) * (activeProject.baseRatePerSqFt || 2300);
    const newFinalContract = baseCost + totalExtraCost;

    const updatedPrj: ConstructionProject = {
      ...activeProject,
      extraWorks: updatedExtraList,
      finalContractAmount: newFinalContract,
      balanceAmount: Math.max(0, newFinalContract - (activeProject.totalReceived || 0)),
      updatedAt: new Date().toISOString()
    };

    const savedPrj = ConstructionStorageManager.saveProject(updatedPrj);
    onProjectUpdated(savedPrj);

    if (activeAgreement) {
      const updatedAgr: ConstructionAgreement = {
        ...activeAgreement,
        extraWorks: updatedExtraList,
        additionalCosts: totalExtraCost,
        finalContractAmount: newFinalContract,
        updatedAt: new Date().toISOString()
      };
      const savedAgr = ConstructionStorageManager.saveAgreement(updatedAgr);
      onAgreementUpdated(savedAgr);
    }

    setShowAddExtraModal(false);
    setNewExtraWork({
      name: "Additional Work",
      nameMl: "അധിക ജോലി",
      floorOrArea: "Ground Floor",
      category: "CIVIL",
      quantity: 1,
      unit: "LS",
      unitRate: 15000,
      totalAmount: 15000
    });
  };

  const handleToggleExtraStatus = (idx: number) => {
    if (!activeProject) return;
    const updated = [...extraWorks];
    const cur = updated[idx];
    const nextStatus = cur.paymentStatus === "PAID" ? "PENDING" : "PAID";
    updated[idx] = { ...cur, paymentStatus: nextStatus };

    const updatedPrj: ConstructionProject = {
      ...activeProject,
      extraWorks: updated,
      updatedAt: new Date().toISOString()
    };
    onProjectUpdated(ConstructionStorageManager.saveProject(updatedPrj));
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-500/30">
              STAGE-WISE & FLOOR-WISE PAYMENT ENGINE
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
            പെയ്‌മെന്റ് സ്റ്റേജുകൾ & ഫ്ലോർ കണക്കുകൾ
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            TRACK STAGE PAYMENTS, FLOOR BREAKDOWNS, WORK CHECKLISTS & VARIATION ORDERS
          </p>
        </div>

        {/* Project Selector */}
        {projects.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-mono">പ്രോജക്ട് തിരഞ്ഞെടുക്കുക:</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:border-cyan-500 focus:outline-none"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projectNo} - {p.client.clientName} ({p.roofingType})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {activeProject ? (
        <div className="space-y-6">
          {/* Top Progress & Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 1. Total Contract */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 font-mono">
              <div className="text-[11px] text-slate-400">Total Contract Amount</div>
              <div className="text-xl font-black text-white">
                {formatIndianCurrency(activeProject.finalContractAmount)}
              </div>
              <div className="text-[10px] text-slate-500">
                {activeProject.totalBuiltUpArea} Sq.Ft @ {formatIndianCurrency(activeProject.baseRatePerSqFt, false)}/Sq.Ft
              </div>
            </div>

            {/* 2. Received & Financial % */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 font-mono">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>Received Amount</span>
                <span className="text-cyan-400 font-bold">{financialProgressPct}% Paid</span>
              </div>
              <div className="text-xl font-black text-cyan-400">
                {formatIndianCurrency(totalReceived)}
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${financialProgressPct}%` }} />
              </div>
            </div>

            {/* 3. Balance */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 font-mono">
              <div className="text-[11px] text-slate-400">Balance Amount</div>
              <div className="text-xl font-black text-amber-400">
                {formatIndianCurrency(activeProject.balanceAmount || activeProject.finalContractAmount - totalReceived)}
              </div>
              <div className="text-[10px] text-slate-500">
                Current: <strong className="text-slate-300">{activeProject.currentStage}</strong>
              </div>
            </div>

            {/* 4. Physical Work Done Checklist % */}
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-4 space-y-2 font-mono shadow-lg shadow-emerald-950/20">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Work Completion:</span>
                </span>
                <span className="text-emerald-400 font-black text-sm">{overallWorkProgress}%</span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>{paymentSchedule.filter(s => s.status === "PAID" || s.isCompleted).length} / {paymentSchedule.length} Stages</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${overallWorkProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sub Navigation Views: Stages Breakdown, Floor-wise Cost Matrix, Additional Works */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl font-mono text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveViewMode("STAGES")}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeViewMode === "STAGES"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>1. Stage Payment Schedule & Checklist</span>
              </button>

              <button
                onClick={() => setActiveViewMode("FLOORS")}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeViewMode === "FLOORS"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>2. Floor-Wise Cost Breakdown</span>
              </button>

              <button
                onClick={() => setActiveViewMode("EXTRA_WORKS")}
                className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeViewMode === "EXTRA_WORKS"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                    : "bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>3. Additional Works ({extraWorks.length})</span>
              </button>
            </div>

            {/* Quick floor filter if in stages view */}
            {activeViewMode === "STAGES" && floors.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Floor Filter:</span>
                <select
                  value={selectedFloorFilter}
                  onChange={e => setSelectedFloorFilter(e.target.value)}
                  className="px-3 py-1 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-indigo-300 font-bold focus:outline-none"
                >
                  <option value="ALL">All Stages</option>
                  {floors.map(f => (
                    <option key={f.id} value={f.floorName}>
                      {f.floorName} ({f.areaSqFt} Sq.Ft)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* VIEW 1: STAGE PAYMENT BREAKDOWN & CHECKLIST SYSTEM */}
          {activeViewMode === "STAGES" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-400" />
                  <span>Stage-Wise Payment Breakdown & Checklist</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Check stage-wise checklist items to verify engineering completion.
                </div>
              </div>

              {filteredSchedule.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">#</th>
                        <th className="p-3">Stage Name</th>
                        <th className="p-3 text-center">Percent</th>
                        <th className="p-3 text-right">Stage Amount</th>
                        <th className="p-3 text-center">Work Progress</th>
                        <th className="p-3 text-right">Received</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredSchedule.map((stage, idx) => {
                        const originalIndex = paymentSchedule.findIndex(s => s.id === stage.id || s.stageName === stage.stageName);
                        const targetIdx = originalIndex >= 0 ? originalIndex : idx;
                        const checklistCount = stage.checklist?.length || 0;
                        const completedChecklist = stage.checklist?.filter(c => c.isCompleted).length || (stage.status === "PAID" ? checklistCount || 1 : 0);
                        const stagePctDone = stage.progressPercent !== undefined
                          ? stage.progressPercent
                          : (stage.status === "PAID" ? 100 : checklistCount > 0 ? Math.round((completedChecklist / checklistCount) * 100) : 0);

                        return (
                          <tr key={stage.id || idx} className="hover:bg-slate-950/50 transition">
                            <td className="p-3 text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-white">
                              <div className="flex items-center gap-2">
                                <span>{stage.stageName}</span>
                                {stage.floorName && (
                                  <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded text-[9px] border border-indigo-500/30">
                                    {stage.floorName}
                                  </span>
                                )}
                              </div>
                              {stage.stageNameMl && (
                                <div className="text-[10px] text-slate-400 font-sans">{stage.stageNameMl}</div>
                              )}
                              {stage.remarks && (
                                <div className="text-[10px] text-slate-500">{stage.remarks}</div>
                              )}
                            </td>
                            <td className="p-3 text-center text-amber-400 font-bold">{stage.percentage}%</td>
                            <td className="p-3 text-right font-bold text-white">{formatIndianCurrency(stage.amount)}</td>

                            {/* Checklist & % Work Done Column */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setChecklistStageIndex(targetIdx)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto ${
                                  stagePctDone === 100
                                    ? "bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900"
                                    : stagePctDone > 0
                                    ? "bg-indigo-950 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900"
                                    : "bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-500"
                                }`}
                                title="Open Engineering Checklist"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>{stagePctDone}% Done</span>
                                {checklistCount > 0 && (
                                  <span className="text-[9px] text-slate-400">({completedChecklist}/{checklistCount})</span>
                                )}
                              </button>
                            </td>

                            <td className="p-3 text-right text-emerald-400 font-bold">
                              {stage.paidAmount ? formatIndianCurrency(stage.paidAmount) : "₹0"}
                            </td>

                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                stage.status === "PAID"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : stage.status === "DUE"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}>
                                {stage.status}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {stage.status !== "PAID" ? (
                                  <button
                                    onClick={() => handleStagePaymentStatus(targetIdx, "PAID")}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition shadow-sm shadow-emerald-950"
                                  >
                                    Mark Paid
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStagePaymentStatus(targetIdx, "PENDING")}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] cursor-pointer transition"
                                  >
                                    Revert
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  No contract schedule available for this project.
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: FLOOR-WISE PAYMENT & COST BREAKDOWN */}
          {activeViewMode === "FLOORS" && (
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Floor-Wise Construction Cost & Payment Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Floor-wise built-up area and construction cost breakdown.
                    </p>
                  </div>
                </div>

                {/* Floor Cards Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {floorCostMatrix.map((item, idx) => (
                    <div
                      key={item.floor.id || idx}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 font-mono"
                    >
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-400" />
                          <span>{item.floor.floorName}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[10px] text-slate-300">
                          {item.area} Sq.Ft
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Rate / Sq.Ft:</span>
                          <span className="text-white font-bold">{formatIndianCurrency(item.rate, false)} / Sq.Ft</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Floor Cost:</span>
                          <span className="text-emerald-400 font-black text-sm">{formatIndianCurrency(item.estimatedCost)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-900 pt-1 text-[11px]">
                          <span className="text-slate-400">Allocated Received:</span>
                          <span className="text-cyan-400 font-bold">{formatIndianCurrency(item.allocatedPaid)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Balance Amount:</span>
                          <span className="text-amber-400 font-bold">{formatIndianCurrency(item.balance)}</span>
                        </div>
                      </div>

                      {item.floor.remarks && (
                        <div className="p-2 bg-slate-900 rounded-xl text-[10px] text-slate-400">
                          {item.floor.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total Floor Summary Footer */}
                <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-wrap justify-between items-center font-mono text-xs gap-3">
                  <div>
                    <span className="text-slate-400">Total Built-up Area: </span>
                    <strong className="text-white">{activeProject.totalBuiltUpArea} Sq.Ft</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Estimated Building Cost: </span>
                    <strong className="text-emerald-400 font-black">
                      {formatIndianCurrency(floorCostMatrix.reduce((s, it) => s + it.estimatedCost, 0))}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Additional Works: </span>
                    <strong className="text-amber-400">
                      {formatIndianCurrency(extraWorks.reduce((s, it) => s + (it.totalAmount || 0), 0))}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: MULTIPLE ADDITIONAL WORKS / VARIATION ORDERS */}
          {activeViewMode === "EXTRA_WORKS" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-3 gap-2">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Additional Works & Variations</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Schedule of extra construction works, variations, and payments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddExtraModal(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-950"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Variation Work</span>
                </button>
              </div>

              {extraWorks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <th className="p-3">#</th>
                        <th className="p-3">Work Description</th>
                        <th className="p-3">Floor / Location</th>
                        <th className="p-3 text-center">Category</th>
                        <th className="p-3 text-right">Qty & Unit</th>
                        <th className="p-3 text-right">Rate</th>
                        <th className="p-3 text-right">Total Amount</th>
                        <th className="p-3 text-center">Payment Status</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {extraWorks.map((work, idx) => (
                        <tr key={work.id || idx} className="hover:bg-slate-950/50 transition">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-semibold text-white">
                            <div>{work.nameMl || work.name}</div>
                            {work.nameMl && work.nameMl !== work.name && (
                              <div className="text-[10px] text-slate-400 font-mono">{work.name}</div>
                            )}
                          </td>
                          <td className="p-3 text-slate-300">{work.floorOrArea || "Ground Floor"}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">
                              {work.category || "CIVIL"}
                            </span>
                          </td>
                          <td className="p-3 text-right text-slate-300">{work.quantity} {work.unit}</td>
                          <td className="p-3 text-right text-slate-300">{formatIndianCurrency(work.unitRate)}</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">{formatIndianCurrency(work.totalAmount)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              work.paymentStatus === "PAID"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}>
                              {work.paymentStatus || "PENDING"}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleExtraStatus(idx)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              {work.paymentStatus === "PAID" ? "Mark Pending" : "Mark Paid"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-2xl border border-slate-800">
                  No additional variation works recorded for this project.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 font-mono text-xs bg-slate-900 border border-slate-800 rounded-3xl">
          No projects available. Please create a new project.
        </div>
      )}

      {/* CHECKLIST MODAL */}
      {checklistStageIndex !== null && (
        <StageChecklistModal
          project={activeProject}
          agreement={activeAgreement}
          stageIndex={checklistStageIndex}
          onSave={handleSaveChecklist}
          onClose={() => setChecklistStageIndex(null)}
        />
      )}

      {/* ADD EXTRA WORK MODAL */}
      {showAddExtraModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 text-white font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Add Variation Work</h3>
              </div>
              <button
                onClick={() => setShowAddExtraModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Work Description:</label>
                <input
                  type="text"
                  value={newExtraWork.name || ""}
                  onChange={e => setNewExtraWork({ ...newExtraWork, name: e.target.value })}
                  placeholder="e.g. Well digging, ring installation and casing"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-sans text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Floor / Location:</label>
                  <input
                    type="text"
                    value={newExtraWork.floorOrArea || ""}
                    onChange={e => setNewExtraWork({ ...newExtraWork, floorOrArea: e.target.value })}
                    placeholder="e.g. Ground Floor, Yard, Terrace"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category:</label>
                  <select
                    value={newExtraWork.category || "CIVIL"}
                    onChange={e => setNewExtraWork({ ...newExtraWork, category: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="CIVIL">CIVIL</option>
                    <option value="INTERIOR">INTERIOR</option>
                    <option value="EXTERIOR">EXTERIOR</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="PLUMBING">PLUMBING</option>
                    <option value="LANDSCAPING">LANDSCAPING</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity (Qty):</label>
                  <input
                    type="number"
                    value={newExtraWork.quantity || 1}
                    onChange={e => setNewExtraWork({ ...newExtraWork, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-right text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit:</label>
                  <input
                    type="text"
                    value={newExtraWork.unit || "LS"}
                    onChange={e => setNewExtraWork({ ...newExtraWork, unit: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Rate (₹):</label>
                  <input
                    type="number"
                    value={newExtraWork.unitRate || 0}
                    onChange={e => setNewExtraWork({ ...newExtraWork, unitRate: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-right text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Variation Cost:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {formatIndianCurrency((Number(newExtraWork.quantity) || 1) * (Number(newExtraWork.unitRate) || 0))}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddExtraWork}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition cursor-pointer"
              >
                Add Variation Work
              </button>
              <button
                type="button"
                onClick={() => setShowAddExtraModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
