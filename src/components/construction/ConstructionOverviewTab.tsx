import React, { useState, useMemo } from "react";
import { ConstructionAgreement, ConstructionProject, ConstructionSettings } from "../../types";
import { formatIndianCurrency } from "../../utils/constructionStorageManager";
import { shareProjectOnWhatsApp } from "../../utils/constructionShareManager";
import {
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Printer,
  ChevronRight,
  Eye,
  Edit,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Share2,
  Phone,
  MapPin,
  CheckSquare,
  Calculator,
  Compass,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  QrCode
} from "lucide-react";

interface ConstructionOverviewTabProps {
  projects: ConstructionProject[];
  agreements: ConstructionAgreement[];
  settings: ConstructionSettings;
  onNavigateToNew: () => void;
  onNavigateToAgreements: () => void;
  onNavigateToProjects: () => void;
  onNavigateToCalculator: () => void;
  onNavigateToStages?: (projectId?: string) => void;
  onViewAgreement: (agreement: ConstructionAgreement) => void;
  onEditAgreement: (agreement: ConstructionAgreement) => void;
  onPrintAgreement: (agreement: ConstructionAgreement, mode: "e_stamp" | "plain_a4") => void;
}

export const ConstructionOverviewTab: React.FC<ConstructionOverviewTabProps> = ({
  projects,
  agreements,
  settings,
  onNavigateToNew,
  onNavigateToAgreements,
  onNavigateToProjects,
  onNavigateToCalculator,
  onNavigateToStages,
  onViewAgreement,
  onEditAgreement,
  onPrintAgreement
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "PLANNING" | "COMPLETED">("ALL");

  // Key KPI Metrics Computations
  const totalProjectsCount = projects.length;
  const inProgressProjects = projects.filter(p => p.status === "IN_PROGRESS");
  const planningProjects = projects.filter(p => p.status === "PLANNING");
  const completedProjects = projects.filter(p => p.status === "COMPLETED");
  const totalAgreementsCount = agreements.length;

  const totalContractValue = projects.reduce((sum, p) => sum + (p.finalContractAmount || 0), 0);
  const totalReceivedAmount = projects.reduce((sum, p) => sum + (p.totalReceived || 0), 0);
  const totalPendingBalance = Math.max(0, totalContractValue - totalReceivedAmount);
  const totalSqFtConstructed = projects.reduce((sum, p) => sum + (p.totalBuiltUpArea || 0), 0);
  const avgRatePerSqFt = totalSqFtConstructed > 0 ? Math.round(totalContractValue / totalSqFtConstructed) : 2300;
  const collectionPercentage = totalContractValue > 0 ? Math.round((totalReceivedAmount / totalContractValue) * 100) : 0;

  // Projects with pending dues
  const projectsWithDues = useMemo(() => {
    return projects.filter(p => (p.balanceAmount || 0) > 0 && p.status !== "COMPLETED");
  }, [projects]);

  // Filtered projects for Active Tracker
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch =
        p.client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.projectNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client.localBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.client.mobileNumber && p.client.mobileNumber.includes(searchTerm));

      if (statusFilter === "ALL") return matchesSearch && !p.isArchived;
      return matchesSearch && p.status === statusFilter && !p.isArchived;
    });
  }, [projects, searchTerm, statusFilter]);

  return (
    <div className="space-y-6 text-white animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER WITH ORGANIZED ACTION CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/90 p-5 sm:p-6 rounded-3xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">VASTHUSILPY CIVIL ERP</span>
              <span aria-hidden="true">·</span>
              <span>നിർമ്മാണ മാനേജ്‌മെന്റ്</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500">Live Workspace</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
              കെട്ടിട നിർമ്മാണ മാനേജ്‌മെന്റ് ഡാഷ്‌ബോർഡ്
            </h2>
            <p className="text-xs text-slate-300 font-mono max-w-2xl leading-relaxed">
              Plan, execute, and monitor residential & commercial construction works, client agreements, milestone stages, and financial accounts.
            </p>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={onNavigateToNew}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ പുതിയ നിർമ്മാണം (New Project)</span>
            </button>

            <button
              onClick={onNavigateToCalculator}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>ചെലവ് കാൽക്കുലേറ്റർ</span>
            </button>

            {onNavigateToStages && (
              <button
                onClick={() => onNavigateToStages()}
                className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>സ്റ്റേജ് പെയ്‌മെന്റ്സ്</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI METRICS ROW (Financials, Projects, Revenue, Built-up Area) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Projects */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                ആകെ പ്രോജക്ടുകൾ (Projects)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {totalProjectsCount}
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-emerald-400 font-semibold">{inProgressProjects.length} നിർമ്മാണത്തിൽ</span>
                <span aria-hidden="true">·</span>
                <span className="text-indigo-300">{planningProjects.length} പ്ലാനിംഗ്</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-400">{completedProjects.length} കൈമാറി</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 2: Total Contract Value */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                കരാർ മൂല്യം (Portfolio Value)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {formatIndianCurrency(totalContractValue)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-0.5">
                <span>ശരാശരി: <strong>{formatIndianCurrency(avgRatePerSqFt, false)}</strong>/Sq.Ft</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 3: Amount Collected vs Balance Due */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 w-full mr-2">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                ലഭിച്ച തുക & ബാക്കി (Collections)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
                {formatIndianCurrency(totalReceivedAmount)}
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-amber-400 font-semibold">ബാക്കി: {formatIndianCurrency(totalPendingBalance)}</span>
                  <span className="text-cyan-300 font-bold">{collectionPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, collectionPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Metric 4: Total Built-up Area & Agreements */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition shadow-lg">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                നിർമ്മാണ വിസ്തീർണ്ണം (Total Area)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {totalSqFtConstructed.toLocaleString()} <span className="text-sm font-sans font-normal text-slate-400">Sq.Ft</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-0.5">
                <span className="text-emerald-400 font-semibold">{totalAgreementsCount} ഒപ്പിട്ട കരാറുകൾ</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">E-Stamp Enabled</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE GRID: PROJECTS TRACKER (8 COLS) + SIDE PANELS (4 COLS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Active Construction Projects Master Table & Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">സജീവ നിർമ്മാണ പ്രോജക്ടുകൾ (Active Projects)</h3>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Real-time status, stage milestones, financial progress & direct agreement actions
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "ALL" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All ({projects.length})
                </button>
                <button
                  onClick={() => setStatusFilter("IN_PROGRESS")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "IN_PROGRESS" ? "bg-emerald-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Active ({inProgressProjects.length})
                </button>
                <button
                  onClick={() => setStatusFilter("PLANNING")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "PLANNING" ? "bg-indigo-600 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Planning ({planningProjects.length})
                </button>
                <button
                  onClick={() => setStatusFilter("COMPLETED")}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    statusFilter === "COMPLETED" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Done ({completedProjects.length})
                </button>
              </div>
            </div>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by client name, house, location, project number or mobile..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/90 rounded-2xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Projects Cards List */}
            <div className="space-y-3.5 pt-1">
              {filteredProjects.length > 0 ? (
                filteredProjects.map(project => {
                  const matchingAgreement = agreements.find(
                    a => a.projectId === project.id || a.id === project.agreementId
                  );
                  const progressPct = project.progressPercentage || (project.status === "COMPLETED" ? 100 : 35);
                  const balanceDue = Math.max(0, (project.finalContractAmount || 0) - (project.totalReceived || 0));

                  return (
                    <div
                      key={project.id}
                      className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800/90 hover:border-slate-700/90 transition-all space-y-3.5 shadow-md"
                    >
                      {/* Top Row: Client & Project Meta */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm sm:text-base">
                              {project.client.clientName}
                            </span>
                            {project.client.houseName && (
                              <span className="text-slate-400 text-xs font-mono">
                                ({project.client.houseName})
                              </span>
                            )}
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {project.projectNo}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              project.status === "COMPLETED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : project.status === "IN_PROGRESS"
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}>
                              {project.status === "IN_PROGRESS" ? "നിർമ്മാണത്തിൽ (In Progress)" : project.status}
                            </span>
                          </div>

                          {/* Location, Contact & Scope */}
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono flex-wrap">
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {project.client.localBody || "Keralassery"}, {project.client.district || "Palakkad"}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{project.totalBuiltUpArea.toLocaleString()} Sq.Ft</span>
                            <span aria-hidden="true">·</span>
                            <span>{project.projectType || "Residential Villa"}</span>
                            {project.client.mobileNumber && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="flex items-center gap-1 text-slate-300">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  {project.client.mobileNumber}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Financial Snapshot */}
                        <div className="text-left sm:text-right shrink-0">
                          <div className="text-emerald-400 font-mono font-black text-base sm:text-lg">
                            {formatIndianCurrency(project.finalContractAmount)}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center sm:justify-end gap-1.5">
                            <span className="text-cyan-300">ലഭിച്ചത്: {formatIndianCurrency(project.totalReceived || 0)}</span>
                            {balanceDue > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-amber-400 font-semibold">ബാക്കി: {formatIndianCurrency(balanceDue)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Progress Bar with Stage Name */}
                      <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-slate-300 font-semibold">
                              നിലവിലെ ഘട്ടം (Current Stage):{" "}
                              <span className="text-amber-300 font-bold">{project.currentStage || "Foundation & Basement"}</span>
                            </span>
                          </div>
                          <span className="text-indigo-400 font-bold">{progressPct}% Complete</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Quick Action Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/70 text-xs font-mono">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {matchingAgreement && (
                            <button
                              onClick={() => onViewAgreement(matchingAgreement)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg border border-indigo-500/30 flex items-center gap-1 transition cursor-pointer"
                              title="View & Edit Legal Agreement"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>കരാർ കാണുക (Agreement)</span>
                            </button>
                          )}

                          {matchingAgreement && (
                            <button
                              onClick={() => onPrintAgreement(matchingAgreement, "e_stamp")}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg border border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
                              title="Print E-Stamp Format Agreement"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-400" />
                              <span>ഇ-സ്റ്റാമ്പ് പ്രിന്റ്</span>
                            </button>
                          )}

                          {onNavigateToStages && (
                            <button
                              onClick={() => onNavigateToStages(project.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-emerald-500/30 flex items-center gap-1 transition cursor-pointer"
                              title="View Payment Stages & Milestones"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                              <span>സ്റ്റേജ് പെയ്‌മെന്റ്സ്</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => shareProjectOnWhatsApp(project, matchingAgreement?.client?.mobileNumber)}
                            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded-lg transition cursor-pointer"
                            title="Share Project Summary via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">നിർമ്മാണ പ്രോജക്ടുകൾ ലഭ്യമല്ല</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    '+ പുതിയ നിർമ്മാണം' ക്ലിക്ക് ചെയ്ത് ആദ്യ പ്രോജക്ടും കരാറും ആരംഭിക്കുക.
                  </p>
                  <button
                    onClick={onNavigateToNew}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded-xl transition cursor-pointer"
                  >
                    + പുതിയ പ്രോജക്ട് ആരംഭിക്കുക
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Footer Link */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                കാണിക്കുന്നത് {filteredProjects.length} / {projects.length} പ്രോജക്ടുകൾ
              </span>
              <button
                onClick={onNavigateToProjects}
                className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>എല്ലാ പ്രോജക്ടുകളുടെയും ഡയറക്ടറി കാണുക</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Workflow Guide: How Vasthusilpy Construction Suite Works */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                നിർമ്മാണ പ്രവർത്തന പൈപ്പ്‌ലൈൻ (Construction Management Workflow)
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono font-bold text-indigo-400">01. ESTIMATION</span>
                <p className="font-bold text-white">ചെലവ് കണക്കാക്കൽ</p>
                <p className="text-[11px] text-slate-400">Floor-wise area calculation & BOQ rates</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono font-bold text-emerald-400">02. AGREEMENT</span>
                <p className="font-bold text-white">കരാർ & ഇ-സ്റ്റാമ്പ്</p>
                <p className="text-[11px] text-slate-400">A4 or 200₹ E-Stamp legal agreement with clauses</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400">03. MILESTONES</span>
                <p className="font-bold text-white">സ്റ്റേജ് പെയ്‌മെന്റ്സ്</p>
                <p className="text-[11px] text-slate-400">Foundation to roof slab stage-wise payments</p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono font-bold text-cyan-400">04. HANDOVER</span>
                <p className="font-bold text-white">കൈമാറ്റവും റിപ്പോർട്ടും</p>
                <p className="text-[11px] text-slate-400">Quality checklist audit & tax invoices</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pending Dues, Recent Agreements & QR Portal */}
        <div className="lg:col-span-4 space-y-5">
          {/* Box 1: Milestone Payment Dues Quick List */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">പെയ്‌മെന്റ് ബാക്കികൾ (Pending Dues)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {projectsWithDues.length} പ്രോജക്ടുകൾ
              </span>
            </div>

            <div className="space-y-2.5">
              {projectsWithDues.length > 0 ? (
                projectsWithDues.slice(0, 4).map(p => {
                  const balance = Math.max(0, (p.finalContractAmount || 0) - (p.totalReceived || 0));
                  return (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 truncate">
                          <p className="font-bold text-xs text-white truncate">{p.client.clientName}</p>
                          <p className="text-[10px] font-mono text-slate-400 truncate">{p.projectNo} • {p.client.localBody}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-amber-400 font-mono font-bold text-xs">{formatIndianCurrency(balance)}</p>
                          <p className="text-[9px] font-mono text-slate-500">തുക ബാക്കി</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] font-mono">
                        <span className="text-slate-400">ഘട്ടം: {p.currentStage || "Structure"}</span>
                        {onNavigateToStages && (
                          <button
                            onClick={() => onNavigateToStages(p.id)}
                            className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                          >
                            പെയ്‌മെന്റ് നൽകുക →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-500 font-mono text-xs">
                  നിലവിൽ പെയ്‌മെന്റ് കുടിശ്ശികകളില്ല.
                </div>
              )}
            </div>

            {onNavigateToStages && (
              <button
                onClick={() => onNavigateToStages()}
                className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>എല്ലാ സ്റ്റേജ് പെയ്‌മെന്റുകളും കാണുക</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Box 2: Recent Agreements & Instant E-Stamp Print */}
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">കരാറുകൾ (Agreements Vault)</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {agreements.length} Total
              </span>
            </div>

            <div className="space-y-2.5">
              {agreements.length > 0 ? (
                agreements.slice(0, 4).map(agr => (
                  <div key={agr.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 truncate">
                        <p className="font-bold text-xs text-white truncate">{agr.client.clientName}</p>
                        <p className="text-[10px] font-mono text-slate-400 truncate">{agr.agreementNo} · {agr.client.localBody}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                        agr.status === "SIGNED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {agr.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{formatIndianCurrency(agr.finalContractAmount)}</span>
                      <span>{agr.totalBuiltUpArea.toLocaleString()} Sq.Ft</span>
                    </div>

                    {/* Print Quick Bar */}
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/70">
                      <button
                        onClick={() => onPrintAgreement(agr, "e_stamp")}
                        className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <Printer className="w-3 h-3 text-amber-400" />
                        <span>ഇ-സ്റ്റാമ്പ്</span>
                      </button>
                      <button
                        onClick={() => onPrintAgreement(agr, "plain_a4")}
                        className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                      >
                        <Printer className="w-3 h-3 text-cyan-400" />
                        <span>A4 പ്രിന്റ്</span>
                      </button>
                      <button
                        onClick={() => onEditAgreement(agr)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
                        title="Edit Agreement Clauses & Specifications"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-500 font-mono text-xs">
                  കരാറുകൾ ലഭ്യമല്ല. "+ പുതിയ നിർമ്മാണം" ക്ലിക്ക് ചെയ്യുക.
                </div>
              )}
            </div>

            <button
              onClick={onNavigateToAgreements}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>എല്ലാ കരാറുകളും കാണുക (Agreements Vault)</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Box 3: QR Public Verification Portal Promo */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-mono font-bold text-white">സീറോ-ലോഗിൻ ക്യുആർ വെരിഫിക്കേഷൻ</h4>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Every printed agreement includes a verifiable tamper-proof QR code. Clients and authorities can verify authenticity instantly on any smartphone without login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
