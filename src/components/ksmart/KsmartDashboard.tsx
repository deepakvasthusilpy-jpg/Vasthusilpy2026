import React from "react";
import { KsmartTabType, TabType } from "../../types";
import { KsmartFileTrackingTab } from "./KsmartFileTrackingTab";
import { KsmartPlanScrutinyTab } from "./KsmartPlanScrutinyTab";
import { KsmartQuickCertificatesTab } from "./KsmartQuickCertificatesTab";
import { KsmartPropertyTaxTab } from "./KsmartPropertyTaxTab";
import { Search, FileCode, Award, Receipt, ExternalLink } from "lucide-react";

interface KsmartDashboardProps {
  activeTab?: KsmartTabType | TabType;
  setActiveTab?: (tab: TabType) => void;
}

export const KsmartDashboard: React.FC<KsmartDashboardProps> = ({
  activeTab = "rules_ksmart",
  setActiveTab
}) => {
  // Normalize tab
  const currentTab: KsmartTabType =
    activeTab === "ksmart_plan_scrutiny"
      ? "ksmart_plan_scrutiny"
      : activeTab === "ksmart_quick_certificates"
      ? "ksmart_quick_certificates"
      : activeTab === "ksmart_property_tax"
      ? "ksmart_property_tax"
      : "rules_ksmart";

  const handleTabChange = (tabId: KsmartTabType) => {
    if (setActiveTab) {
      setActiveTab(tabId as TabType);
    }
  };

  return (
    <div className="space-y-6">
      {/* KSMART SUB-NAVIGATION BAR */}
      <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto shadow-lg">
        <div className="flex items-center gap-2">
          {/* 1. File Tracking */}
          <button
            onClick={() => handleTabChange("rules_ksmart")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === "rules_ksmart"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Search className="w-4 h-4 text-emerald-300" />
            <span>ഫയൽ ട്രാക്കിംഗ് (Tracking)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
              TRACK
            </span>
          </button>

          {/* 2. CAD Plan Scrutiny */}
          <button
            onClick={() => handleTabChange("ksmart_plan_scrutiny")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === "ksmart_plan_scrutiny"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-300" />
            <span>പ്ലാൻ സ്ക്രൂട്ടീനി (Auto-DCR)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/40">
              SCRUTINY
            </span>
          </button>

          {/* 3. Quick Certificates */}
          <button
            onClick={() => handleTabChange("ksmart_quick_certificates")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === "ksmart_quick_certificates"
                ? "bg-teal-600 text-white shadow-md shadow-teal-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Award className="w-4 h-4 text-teal-300" />
            <span>സർട്ടിഫിക്കറ്റുകൾ (Certificates)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold border border-teal-500/40">
              CERTS
            </span>
          </button>

          {/* 4. Property Tax */}
          <button
            onClick={() => handleTabChange("ksmart_property_tax")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              currentTab === "ksmart_property_tax"
                ? "bg-amber-600 text-slate-950 shadow-md shadow-amber-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-950 font-bold" />
            <span>കെട്ടിട നികുതി (Property Tax)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/40">
              TAX
            </span>
          </button>
        </div>

        <a
          href="https://ksmart.lsgkerala.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition font-mono text-xs whitespace-nowrap"
        >
          <span>LSGD KSMART</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* RENDER ACTIVE TAB */}
      {currentTab === "ksmart_plan_scrutiny" ? (
        <KsmartPlanScrutinyTab />
      ) : currentTab === "ksmart_quick_certificates" ? (
        <KsmartQuickCertificatesTab />
      ) : currentTab === "ksmart_property_tax" ? (
        <KsmartPropertyTaxTab />
      ) : (
        <KsmartFileTrackingTab />
      )}
    </div>
  );
};


