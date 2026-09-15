import React, { useState } from "react";
import {
  Bot,
  Sparkles,
  Compass,
  Building2,
  MapPin,
  FileSpreadsheet,
  HardHat,
  FileCode,
  Layers,
  Award,
  ShieldCheck,
  Radio,
  Cpu
} from "lucide-react";
import { UnifiedAIChatTab } from "./UnifiedAIChatTab";
import { AIVastuAuditTab } from "./AIVastuAuditTab";
import { AIKpbrRulesTab } from "./AIKpbrRulesTab";
import { AISurveyFmbTab } from "./AISurveyFmbTab";
import { AIEstimateBoqTab } from "./AIEstimateBoqTab";
import { AIStructuralCivilTab } from "./AIStructuralCivilTab";
import { AIPlanVisionScannerTab } from "./AIPlanVisionScannerTab";

interface UnifiedAIAgentDashboardProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const UnifiedAIAgentDashboard: React.FC<UnifiedAIAgentDashboardProps> = ({
  initialTab = "ai_agent_chat",
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const handleTabSwitch = (tabKey: string) => {
    setActiveTab(tabKey);
    if (onTabChange) {
      onTabChange(tabKey);
    }
  };

  const SUB_TABS = [
    {
      id: "ai_agent_chat",
      label: "ചീഫ് AI ലൈവ് കൺസൾട്ടന്റ്",
      subLabel: "Live Male AI Architect",
      icon: Bot,
      color: "from-cyan-500 to-blue-600"
    },
    {
      id: "ai_vastu",
      label: "തച്ചു ശാസ്ത്ര & വാസ്തു",
      subLabel: "Vedic Architecture & Kol",
      icon: Compass,
      color: "from-amber-500 to-orange-600"
    },
    {
      id: "ai_kpbr",
      label: "KPBR 2019/26 ചട്ടങ്ങൾ",
      subLabel: "Building Rules & Gazette",
      icon: Building2,
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: "ai_survey",
      label: "സർവ്വേ & FMB സ്കെച്ച്",
      subLabel: "Land Survey & Tie Lines",
      icon: MapPin,
      color: "from-blue-500 to-indigo-600"
    },
    {
      id: "ai_estimate",
      label: "റേറ്റ് എസ്റ്റിമേറ്റർ & BOQ",
      subLabel: "Kerala PWD DSR Rates",
      icon: FileSpreadsheet,
      color: "from-amber-500 to-yellow-600"
    },
    {
      id: "ai_structural",
      label: "സിവിൽ & സ്ട്രക്ചറൽ",
      subLabel: "IS 456 & Mix Proportions",
      icon: HardHat,
      color: "from-rose-500 to-red-600"
    },
    {
      id: "ai_visual_scanner",
      label: "ബ്ലൂപ്രിന്റ് വിഷൻ സ്കാനർ",
      subLabel: "Multimodal Plan OCR",
      icon: FileCode,
      color: "from-indigo-500 to-purple-600"
    }
  ];

  return (
    <div id="unified-ai-agent-dashboard" className="space-y-6">
      {/* Top Main Navigation Tabs Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-2.5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`ai-agent-nav-tab-${tab.id}`}
                type="button"
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-sans transition-all shrink-0 cursor-pointer text-left ${
                  isActive
                    ? "bg-gradient-to-r from-slate-800 to-slate-900 border border-cyan-500/50 text-white shadow-lg shadow-cyan-950/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30"
                      : "bg-slate-950 border border-slate-800 text-slate-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold font-sans text-xs leading-none">{tab.label}</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1 leading-none">
                    {tab.subLabel}
                  </div>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1 shadow-[0_0_8px_#22d3ee]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Sub-Tab */}
      <div className="min-h-[600px]">
        {activeTab === "ai_agent_chat" && (
          <UnifiedAIChatTab onSwitchDisciplineTab={(tabId) => handleTabSwitch(tabId)} />
        )}
        {activeTab === "ai_vastu" && <AIVastuAuditTab />}
        {activeTab === "ai_kpbr" && <AIKpbrRulesTab />}
        {activeTab === "ai_survey" && <AISurveyFmbTab />}
        {activeTab === "ai_estimate" && <AIEstimateBoqTab />}
        {activeTab === "ai_structural" && <AIStructuralCivilTab />}
        {activeTab === "ai_visual_scanner" && <AIPlanVisionScannerTab />}
      </div>
    </div>
  );
};
