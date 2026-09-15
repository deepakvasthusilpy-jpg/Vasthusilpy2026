import React, { useState, useEffect } from "react";
import {
  ConstructionTabType,
  ConstructionProject,
  ConstructionAgreement,
  ConstructionSettings
} from "../../types";
import { ConstructionStorageManager } from "../../utils/constructionStorageManager";
import { ConstructionOverviewTab } from "./ConstructionOverviewTab";
import { NewConstructionFormTab } from "./NewConstructionFormTab";
import { ProjectsDirectoryTab } from "./ProjectsDirectoryTab";
import { AgreementsDirectoryTab } from "./AgreementsDirectoryTab";
import { ConstructionCostCalculatorTab } from "./ConstructionCostCalculatorTab";
import { PaymentStagesTrackerTab } from "./PaymentStagesTrackerTab";
import { ConstructionSettingsTab } from "./ConstructionSettingsTab";
import { ConstructionReportsTab } from "./ConstructionReportsTab";
import { AgreementEditorModal } from "./AgreementEditorModal";
import { AgreementPrintView } from "./AgreementPrintView";
import { AgreementVerificationModal } from "./AgreementVerificationModal";
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  FileCheck2,
  Calculator,
  Receipt,
  Settings as SettingsIcon,
  FileBarChart,
  QrCode,
  ShieldCheck,
  Building2,
  HardHat,
  PanelLeftClose,
  PanelLeftOpen,
  Stamp,
  Plus,
  Sparkles,
  ChevronRight,
  FileText
} from "lucide-react";

interface ConstructionDashboardProps {
  initialTab?: ConstructionTabType;
  onTabChange?: (tab: ConstructionTabType) => void;
}

const normalizeConstructionTab = (tab?: string): ConstructionTabType => {
  if (!tab) return "dashboard";
  if (tab === "new_construction" || tab === "construction_new") return "new_construction";
  if (tab === "projects" || tab === "construction_projects") return "projects";
  if (tab === "agreements" || tab === "construction_agreements") return "agreements";
  if (tab === "cost_calculator" || tab === "construction_cost_calculator" || tab === "construction_calculator") return "cost_calculator";
  if (tab === "payment_stages" || tab === "construction_payment_stages" || tab === "construction_payments") return "payment_stages";
  if (tab === "reports" || tab === "construction_reports") return "reports";
  if (tab === "settings" || tab === "construction_settings") return "settings";
  if (tab === "search" || tab === "construction_search" || tab === "construction_verify") return "search";
  return "dashboard";
};

export const ConstructionDashboard: React.FC<ConstructionDashboardProps> = ({
  initialTab = "dashboard",
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<ConstructionTabType>(() => normalizeConstructionTab(initialTab));
  const [isSideDockCollapsed, setIsSideDockCollapsed] = useState<boolean>(false);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [agreements, setAgreements] = useState<ConstructionAgreement[]>([]);
  const [settings, setSettings] = useState<ConstructionSettings>(ConstructionStorageManager.getSettings());

  // Modals & Overlay states
  const [editingAgreement, setEditingAgreement] = useState<ConstructionAgreement | null>(null);
  const [printingAgreement, setPrintingAgreement] = useState<{
    agreement: ConstructionAgreement;
    mode: "e_stamp" | "plain_a4";
  } | null>(null);
  const [verifyingToken, setVerifyingToken] = useState<string | null>(null);

  // Sync with initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeConstructionTab(initialTab));
    }
  }, [initialTab]);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    ConstructionStorageManager.purgeAllDemoData();
    setProjects(ConstructionStorageManager.getAllProjects());
    setAgreements(ConstructionStorageManager.getAllAgreements());
    setSettings(ConstructionStorageManager.getSettings());
  };

  const handleTabSelect = (tab: ConstructionTabType) => {
    if (tab === "search") {
      setVerifyingToken(null);
    }
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Nav Items with counts & labels
  const navTabs: Array<{
    id: ConstructionTabType;
    label: string;
    labelMl: string;
    sub: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    count?: number;
  }> = [
    { id: "dashboard", label: "Dashboard", labelMl: "ഡാഷ്‌ബോർഡ്", sub: "OVERVIEW", icon: LayoutDashboard },
    { id: "new_construction", label: "New Construction", labelMl: "പുതിയ നിർമ്മാണം & കരാർ", sub: "NEW PROJECT", icon: PlusCircle, badge: "NEW" },
    { id: "projects", label: "Projects / Clients", labelMl: "പ്രോജക്ടുകൾ / ക്ലയന്റ്സ്", sub: "PROJECTS", icon: FolderKanban, count: projects.length },
    { id: "agreements", label: "Agreements", labelMl: "കരാറുകൾ (Agreements)", sub: "E-STAMP & A4", icon: FileCheck2, count: agreements.length, badge: "E-STAMP" },
    { id: "cost_calculator", label: "Cost Calculator", labelMl: "ചെലവ് കാൽക്കുലേറ്റർ", sub: "ESTIMATION", icon: Calculator },
    { id: "payment_stages", label: "Payment Stages", labelMl: "പെയ്‌മെന്റ് സ്റ്റേജുകൾ", sub: "MILESTONES", icon: Receipt },
    { id: "reports", label: "Reports", labelMl: "ധനകാര്യ റിപ്പോർട്ടുകൾ", sub: "FINANCIALS", icon: FileBarChart },
    { id: "settings", label: "Settings", labelMl: "നിർമ്മാണ ക്രമീകരണങ്ങൾ", sub: "STAGES & MARGINS", icon: SettingsIcon },
    { id: "search", label: "QR Verification", labelMl: "ക്യുആർ വെരിഫിക്കേഷൻ", sub: "ZERO-LOGIN ACCESS", icon: QrCode, badge: "ZERO-LOGIN" }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 lg:p-6 space-y-5">
      {/* Header Bar */}
      <div className="bg-slate-900/85 backdrop-blur-md border border-slate-800/90 rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-950 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400">
              <HardHat className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-black text-white uppercase tracking-tight font-sans">
                നിർമ്മാണ പ്രവർത്തനങ്ങൾ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                CONSTRUCTION & E-STAMP DOCK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              VASTHUSILPY BUILDING PROJECTS, ESTIMATION & WORK AGREEMENTS
            </p>
          </div>
        </div>

        {/* Top Action Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabSelect("new_construction")}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold rounded-2xl transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            title="Create New Project & Agreement"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">പുതിയ നിർമ്മാണം</span>
          </button>

          <button
            onClick={() => setVerifyingToken("")}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 text-xs font-mono font-bold rounded-2xl transition cursor-pointer flex items-center gap-1.5"
            title="QR Verification & Token Check"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">QR വെരിഫിക്കേഷൻ</span>
          </button>
        </div>
      </div>

      {/* Main Workspace with Collapsible Left Side Dock & Content Area */}
      <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-5">
        {/* ==================================================================== */}
        {/* NEW COLLAPSIBLE SIDE DOCK (Left side navigation) */}
        {/* ==================================================================== */}
        <aside
          className={`shrink-0 transition-all duration-300 ease-in-out md:sticky md:top-24 z-20 w-full ${
            isSideDockCollapsed ? "md:w-[68px]" : "md:w-64"
          }`}
        >
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            {/* Dock Header & Collapse Toggle */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 px-1">
              {!isSideDockCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10.5px] font-mono font-bold text-slate-300 uppercase tracking-wider truncate">
                    നിർമ്മാണ വിഭാഗങ്ങൾ
                  </span>
                </div>
              ) : (
                <div className="w-full flex justify-center py-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              )}

              <button
                onClick={() => setIsSideDockCollapsed(!isSideDockCollapsed)}
                className="hidden md:flex items-center justify-center p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition cursor-pointer"
                title={isSideDockCollapsed ? "Expand Side Dock (വികസിപ്പിക്കുക)" : "Collapse Side Dock (ചെറുതാക്കുക)"}
              >
                {isSideDockCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Sub-Tabs Navigation List */}
            <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-none py-0.5">
              {navTabs.map((tab) => {
                const isTabActive = activeTab === tab.id;
                const isSearchTab = tab.id === "search";
                const TabIcon = tab.icon;

                const baseStyles = isSideDockCollapsed
                  ? "justify-center p-2.5"
                  : "justify-between p-2.5 text-left";

                const tabColorStyles = isSearchTab
                  ? isTabActive
                    ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold shadow-xl shadow-emerald-950 border-2 border-emerald-300 ring-2 ring-emerald-400/40"
                    : "bg-slate-900/90 text-emerald-300 hover:text-white hover:bg-emerald-950/60 border border-emerald-500/50 shadow-sm shadow-emerald-950/40"
                  : isTabActive
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent";

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabSelect(tab.id)}
                    className={`w-full flex items-center transition-all cursor-pointer rounded-2xl ${baseStyles} ${tabColorStyles}`}
                    title={`${tab.labelMl} (${tab.label})`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform relative ${
                          isSearchTab
                            ? isTabActive
                              ? "bg-slate-950/60 text-emerald-300 border border-emerald-400/50"
                              : "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40"
                            : isTabActive
                              ? "bg-slate-950/40 text-white"
                              : "bg-slate-800/70 text-slate-400"
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                        {isSearchTab && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse absolute -top-0.5 -right-0.5 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                        )}
                      </div>

                      {!isSideDockCollapsed && (
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold font-sans text-white truncate flex items-center gap-1.5">
                            <span>{tab.labelMl}</span>
                            {isSearchTab && (
                              <span className="text-[9px] font-mono text-emerald-400 font-normal">
                                (സീറോ ലോഗിൻ)
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[9px] font-mono tracking-wider truncate ${
                              isTabActive ? "text-emerald-100" : isSearchTab ? "text-emerald-400" : "text-slate-500"
                            }`}
                          >
                            {tab.sub}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badge or Live Count */}
                    {!isSideDockCollapsed && (
                      <div className="shrink-0 flex items-center gap-1">
                        {tab.count !== undefined && tab.count > 0 && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                              isTabActive
                                ? "bg-white text-slate-950"
                                : "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                        {tab.badge && (
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isSearchTab
                                ? isTabActive
                                  ? "bg-emerald-300 text-slate-950 shadow-sm"
                                  : "bg-emerald-500/25 text-emerald-300 border border-emerald-400/60"
                                : isTabActive
                                  ? "bg-amber-400 text-slate-950"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Side Dock Quick Utilities Footer */}
            {!isSideDockCollapsed ? (
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 px-1">
                <button
                  onClick={() => handleTabSelect("agreements")}
                  className="w-full py-2 px-2.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-mono font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Stamp className="w-3.5 h-3.5 text-amber-400" />
                    <span>ഇ-സ്റ്റാമ്പ് പ്രിന്റ്</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col items-center gap-1.5">
                <button
                  onClick={() => handleTabSelect("agreements")}
                  className="w-9 h-9 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 flex items-center justify-center transition cursor-pointer"
                  title="Quick Agreements & E-Stamp Print"
                >
                  <Stamp className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* MAIN WORKSPACE CONTENT PANE */}
        {/* ==================================================================== */}
        <main className="flex-1 min-w-0 w-full transition-all duration-200">
          {activeTab === "dashboard" && (
            <ConstructionOverviewTab
              projects={projects}
              agreements={agreements}
              settings={settings}
              onNavigateToNew={() => handleTabSelect("new_construction")}
              onNavigateToAgreements={() => handleTabSelect("agreements")}
              onNavigateToProjects={() => handleTabSelect("projects")}
              onNavigateToCalculator={() => handleTabSelect("cost_calculator")}
              onViewAgreement={agr => setEditingAgreement(agr)}
              onEditAgreement={agr => setEditingAgreement(agr)}
              onPrintAgreement={(agr, mode) => setPrintingAgreement({ agreement: agr, mode })}
            />
          )}

          {activeTab === "new_construction" && (
            <NewConstructionFormTab
              settings={settings}
              onAgreementCreated={agr => {
                refreshData();
                setEditingAgreement(agr);
              }}
              onProjectCreated={proj => {
                refreshData();
              }}
            />
          )}

          {activeTab === "projects" && (
            <ProjectsDirectoryTab
              projects={projects}
              agreements={agreements}
              settings={settings}
              onProjectUpdated={proj => refreshData()}
              onNavigateToNew={() => handleTabSelect("new_construction")}
              onViewAgreement={agr => setEditingAgreement(agr)}
            />
          )}

          {activeTab === "agreements" && (
            <AgreementsDirectoryTab
              agreements={agreements}
              settings={settings}
              onAgreementUpdated={agr => refreshData()}
              onAgreementDeleted={id => {
                ConstructionStorageManager.deleteAgreement(id);
                refreshData();
              }}
              onNavigateToNew={() => handleTabSelect("new_construction")}
              onEditAgreement={agr => setEditingAgreement(agr)}
              onPrintAgreement={(agr, mode) => setPrintingAgreement({ agreement: agr, mode })}
              onVerifyQr={token => setVerifyingToken(token)}
            />
          )}

          {activeTab === "cost_calculator" && (
            <ConstructionCostCalculatorTab
              settings={settings}
              onProceedToProject={calcData => {
                handleTabSelect("new_construction");
              }}
            />
          )}

          {activeTab === "payment_stages" && (
            <PaymentStagesTrackerTab
              projects={projects}
              agreements={agreements}
              settings={settings}
              onProjectUpdated={proj => refreshData()}
              onAgreementUpdated={agr => refreshData()}
            />
          )}

          {activeTab === "reports" && (
            <ConstructionReportsTab
              projects={projects}
              agreements={agreements}
              settings={settings}
            />
          )}

          {activeTab === "settings" && (
            <ConstructionSettingsTab
              settings={settings}
              onSettingsUpdated={updated => {
                setSettings(updated);
                refreshData();
              }}
            />
          )}

          {activeTab === "search" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md">
              <AgreementVerificationModal
                isEmbedded={true}
                initialToken={verifyingToken || ""}
                onReset={() => {
                  setVerifyingToken(null);
                }}
                onClose={() => handleTabSelect("dashboard")}
              />
            </div>
          )}
        </main>
      </div>

      {/* Agreement Editor Modal */}
      {editingAgreement && (
        <AgreementEditorModal
          agreement={editingAgreement}
          settings={settings}
          onSave={updated => {
            refreshData();
            setEditingAgreement(updated);
          }}
          onClose={() => setEditingAgreement(null)}
        />
      )}

      {/* Print View Modal */}
      {printingAgreement && (
        <AgreementPrintView
          agreement={printingAgreement.agreement}
          settings={settings}
          printMode={printingAgreement.mode}
          onClose={() => setPrintingAgreement(null)}
        />
      )}

      {/* QR & Token Verification Modal */}
      {verifyingToken !== null && (
        <AgreementVerificationModal
          initialToken={verifyingToken}
          onClose={() => setVerifyingToken(null)}
        />
      )}
    </div>
  );
};
