import React from "react";
import { SurveyTabType } from "../../types";
import { MissingSideCalculator } from "./MissingSideCalculator";
import { LandAreaCalculator } from "./LandAreaCalculator";
import { SurveyConvertersTab } from "./SurveyConvertersTab";
import { AISurveyFmbTab } from "../aiAgent/AISurveyFmbTab";
import { Calculator, MapPin, ArrowRightLeft, Bot } from "lucide-react";

interface SurveyTabProps {
  activeSubTab: SurveyTabType;
  setActiveSubTab: (tab: SurveyTabType) => void;
}

export const SurveyTab: React.FC<SurveyTabProps> = ({
  activeSubTab,
  setActiveSubTab
}) => {
  return (
    <div className="space-y-6">
      {/* Secondary Top Sub-Nav for Survey */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center gap-2 max-w-5xl">
        <button
          onClick={() => setActiveSubTab("missing_side")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-mono font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeSubTab === "missing_side"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400"
              : "text-slate-400 hover:text-white hover:bg-slate-950"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Missing Side Calc</span>
        </button>

        <button
          onClick={() => setActiveSubTab("land_area")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-mono font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeSubTab === "land_area"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400"
              : "text-slate-400 hover:text-white hover:bg-slate-950"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Land Area Calc</span>
        </button>

        <button
          onClick={() => setActiveSubTab("unit_converters")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-mono font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeSubTab === "unit_converters"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20 ring-1 ring-cyan-300"
              : "text-slate-400 hover:text-white hover:bg-slate-950"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-cyan-300" />
          <span>Unit Converters</span>
        </button>

        <button
          onClick={() => setActiveSubTab("survey_ai_agent")}
          className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-mono font-bold text-xs md:text-sm transition-all cursor-pointer ${
            activeSubTab === "survey_ai_agent"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/30 ring-1 ring-cyan-300"
              : "text-slate-400 hover:text-white hover:bg-slate-950"
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-300" />
          <span>Survey AI Agent</span>
        </button>
      </div>

      {/* Render selected Survey Component */}
      {activeSubTab === "missing_side" ? (
        <MissingSideCalculator />
      ) : activeSubTab === "land_area" ? (
        <LandAreaCalculator />
      ) : activeSubTab === "unit_converters" ? (
        <SurveyConvertersTab />
      ) : (
        <AISurveyFmbTab />
      )}
    </div>
  );
};
