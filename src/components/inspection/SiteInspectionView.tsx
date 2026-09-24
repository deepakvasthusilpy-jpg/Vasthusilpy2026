import React, { useState } from "react";
import { MobileInspectionForm } from "./MobileInspectionForm";
import { InspectionDashboard } from "./InspectionDashboard";
import { DynamicQuestionBuilder } from "./DynamicQuestionBuilder";
import { InspectionIntegrationGuide } from "./InspectionIntegrationGuide";
import { loadSiteInspections } from "../../utils/siteInspectionManager";
import {
  MapPin,
  Smartphone,
  LayoutDashboard,
  Layers,
  Server,
  FileText,
  Share2,
  Sparkles,
  Download
} from "lucide-react";

type InspectionTab = "mobile_form" | "admin_dashboard" | "question_builder" | "backend_guide";

export const SiteInspectionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InspectionTab>("mobile_form");
  const inspections = loadSiteInspections();

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <MapPin className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
                <span>Site Inspection Module</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono uppercase font-bold">
                  Mobile Field App
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                Mobile-optimized field data entry with GPS tagging, media uploads, dynamic checklists & automated triggers
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-mono">Submitted:</span>
              <strong className="text-emerald-400 font-bold font-mono text-sm">{inspections.length}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("mobile_form")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "mobile_form"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Field Inspection Form</span>
          </button>

          <button
            onClick={() => setActiveTab("admin_dashboard")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "admin_dashboard"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Admin Inspections Dashboard</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === "admin_dashboard" ? "bg-slate-950/30 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"
              }`}
            >
              {inspections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("question_builder")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "question_builder"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Dynamic Question Builder</span>
          </button>

          <button
            onClick={() => setActiveTab("backend_guide")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition cursor-pointer ${
              activeTab === "backend_guide"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Backend Architecture & APIs</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT */}
      {activeTab === "mobile_form" && (
        <MobileInspectionForm
          onOpenDashboard={() => setActiveTab("admin_dashboard")}
        />
      )}

      {activeTab === "admin_dashboard" && (
        <InspectionDashboard
          onNewInspectionClick={() => setActiveTab("mobile_form")}
        />
      )}

      {activeTab === "question_builder" && <DynamicQuestionBuilder />}

      {activeTab === "backend_guide" && <InspectionIntegrationGuide />}
    </div>
  );
};
