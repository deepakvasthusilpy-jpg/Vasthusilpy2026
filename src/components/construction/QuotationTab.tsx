import React, { useState } from "react";
import { ConstructionProject, ConstructionSettings } from "../../types";
import { FileText, Plus, List } from "lucide-react";

interface QuotationTabProps {
  projects: ConstructionProject[];
  settings: ConstructionSettings;
}

type QuotationSubTab = "list" | "create";

export const QuotationTab: React.FC<QuotationTabProps> = ({ projects, settings }) => {
  const [activeSubTab, setActiveSubTab] = useState<QuotationSubTab>("list");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          ക്വട്ടേഷൻ (Quotation)
        </h2>
        
        <div className="flex bg-slate-800 rounded-2xl p-1">
          <button
            onClick={() => setActiveSubTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeSubTab === "list" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <List className="w-4 h-4" />
            Quotations List
          </button>
          <button
            onClick={() => setActiveSubTab("create")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeSubTab === "create" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-6">
        {activeSubTab === "list" && (
          <p className="text-slate-400">Quotations list view.</p>
        )}
        {activeSubTab === "create" && (
          <p className="text-slate-400">Quotation creation form.</p>
        )}
      </div>
    </div>
  );
};
