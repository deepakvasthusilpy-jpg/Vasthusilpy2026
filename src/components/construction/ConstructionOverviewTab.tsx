import React, { useState } from "react";
import { ConstructionAgreement, ConstructionProject, ConstructionSettings } from "../../types";
import { formatIndianCurrency } from "../../utils/constructionStorageManager";
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
  ShieldCheck
} from "lucide-react";

interface ConstructionOverviewTabProps {
  projects: ConstructionProject[];
  agreements: ConstructionAgreement[];
  settings: ConstructionSettings;
  onNavigateToNew: () => void;
  onNavigateToAgreements: () => void;
  onNavigateToProjects: () => void;
  onNavigateToCalculator: () => void;
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
  onViewAgreement,
  onEditAgreement,
  onPrintAgreement
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Key KPI Metrics
  const totalProjectsCount = projects.length;
  const activeProjectsCount = projects.filter(p => p.status === "IN_PROGRESS" || p.status === "PLANNING").length;
  const completedProjectsCount = projects.filter(p => p.status === "COMPLETED").length;
  const totalAgreementsCount = agreements.length;

  const totalContractValue = projects.reduce((sum, p) => sum + (p.finalContractAmount || 0), 0);
  const totalReceivedAmount = projects.reduce((sum, p) => sum + (p.totalReceived || 0), 0);
  const totalPendingBalance = projects.reduce((sum, p) => sum + (p.balanceAmount || 0), 0);
  const totalSqFtConstructed = projects.reduce((sum, p) => sum + (p.totalBuiltUpArea || 0), 0);
  const avgRatePerSqFt = totalSqFtConstructed > 0 ? Math.round(totalContractValue / totalSqFtConstructed) : 2300;

  // Filtered projects
  const filteredProjects = projects.filter(p =>
    p.client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.projectNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.client.localBody.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
              VASTHUSILPY CIVIL SUITE
            </span>
            <span className="text-slate-400 text-xs font-mono">Ver 2026.1</span>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight font-sans">
            കെട്ടിട നിർമ്മാണ മാനേജ്‌മെന്റ് ഡാഷ്‌ബോർഡ്
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            BUILDING CONSTRUCTION PROJECTS, FINANCIALS & AGREEMENT PORTAL
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onNavigateToNew}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>+ പുതിയ നിർമ്മാണം (New Project)</span>
          </button>
          <button
            onClick={onNavigateToCalculator}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-mono text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>ചെലവ് കണക്കുകൂട്ടൽ (Cost Calculator)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase">ആകെ പ്രോജക്ടുകൾ (Total Projects)</div>
              <div className="text-2xl font-black text-white font-mono">{totalProjectsCount}</div>
              <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <span>{activeProjectsCount} സജീവമാണ് (Active)</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Contract Value */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase">കരാർ മൂല്യം (Total Contract Value)</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatIndianCurrency(totalContractValue)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                ശരാശരി: {formatIndianCurrency(avgRatePerSqFt, false)}/Sq.Ft
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Received vs Balance */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase">ലഭിച്ച തുക (Amount Received)</div>
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {formatIndianCurrency(totalReceivedAmount)}
              </div>
              <div className="text-[11px] text-amber-400 font-mono">
                ബാക്കി: {formatIndianCurrency(totalPendingBalance)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Total Built-up Area */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-mono font-bold uppercase">ആകെ നിർമ്മാണ വിസ്തീർണ്ണം</div>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {totalSqFtConstructed.toLocaleString()} <span className="text-xs">Sq.Ft</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {totalAgreementsCount} ഒപ്പിട്ട കരാറുകൾ
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Projects & Quick Agreements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Projects List */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">സജീവ നിർമ്മാണ പ്രോജക്ടുകൾ (Active Projects)</h3>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Client or Project..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredProjects.length > 0 ? (
              filteredProjects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{project.client.clientName}</span>
                        <span className="text-slate-400 text-xs font-mono">({project.client.houseName})</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] border border-indigo-500/30">
                          {project.projectType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {project.client.localBody}, {project.client.district} • {project.totalBuiltUpArea.toLocaleString()} Sq.Ft
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-mono font-bold text-sm">
                        {formatIndianCurrency(project.finalContractAmount)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {project.currentStage}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>നിർമ്മാണ പുരോഗതി (Progress)</span>
                      <span className="text-indigo-400 font-bold">{project.progressPercentage || 25}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                        style={{ width: `${project.progressPercentage || 25}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                പ്രോജക്ടുകൾ ലഭ്യമല്ല. ദയവായി '+ പുതിയ നിർമ്മാണം' ക്ലിക്ക് ചെയ്യുക.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={onNavigateToProjects}
              className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>എല്ലാ പ്രോജക്ടുകളും കാണുക (View All Projects)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent Agreements Quick Box */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">കരാറുകൾ (Agreements)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              {agreements.length} Total
            </span>
          </div>

          <div className="space-y-3">
            {agreements.length > 0 ? (
              agreements.slice(0, 4).map(agr => (
                <div key={agr.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs text-white truncate max-w-[170px]">
                        {agr.client.clientName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{agr.agreementNo}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      agr.status === "SIGNED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}>
                      {agr.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>{formatIndianCurrency(agr.finalContractAmount)}</span>
                    <span>{agr.totalBuiltUpArea.toLocaleString()} Sq.Ft</span>
                  </div>

                  {/* Print Buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onPrintAgreement(agr, "e_stamp")}
                      className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>ഇ-സ്റ്റാമ്പ്</span>
                    </button>
                    <button
                      onClick={() => onPrintAgreement(agr, "plain_a4")}
                      className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Printer className="w-3 h-3" />
                      <span>A4 പ്രിന്റ്</span>
                    </button>
                    <button
                      onClick={() => onEditAgreement(agr)}
                      className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded-lg"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                കരാറുകൾ ലഭ്യമല്ല. "+ പുതിയ നിർമ്മാണം" അല്ലെങ്കിൽ കരാറുകൾ ടാബിൽ ക്ലിക്ക് ചെയ്യുക.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={onNavigateToAgreements}
              className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
            >
              <span>എല്ലാ കരാറുകളും കാണുക (View All)</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
