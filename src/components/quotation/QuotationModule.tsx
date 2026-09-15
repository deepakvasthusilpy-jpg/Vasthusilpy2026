import React, { useState, useEffect } from "react";
import {
  TabType,
  QuotationTabType,
  Quotation,
  QuotationService,
  Contractor,
  TermsClause
} from "../../types";
import {
  loadQuotations,
  saveQuotations,
  loadQuotationServices,
  saveQuotationServices,
  loadContractors,
  saveContractors,
  loadTermsClauses,
  saveTermsClauses,
  generateNextQuotationNo
} from "../../utils/quotationStorageManager";
import { QuotationDashboardView } from "./QuotationDashboardView";
import { QuotationCreateEdit } from "./QuotationCreateEdit";
import { QuotationListView } from "./QuotationListView";
import { QuotationRatesMaster } from "./QuotationRatesMaster";
import { QuotationContractorsMaster } from "./QuotationContractorsMaster";
import { QuotationTermsMaster } from "./QuotationTermsMaster";
import { QuotationPrintDocument } from "./QuotationPrintDocument";
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Layers,
  Users,
  ShieldCheck
} from "lucide-react";

interface QuotationModuleProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const QuotationModule: React.FC<QuotationModuleProps> = ({
  activeTab,
  setActiveTab
}) => {
  // Persistent data state
  const [quotations, setQuotations] = useState<Quotation[]>(() => loadQuotations());
  const [services, setServices] = useState<QuotationService[]>(() => loadQuotationServices());
  const [contractors, setContractors] = useState<Contractor[]>(() => loadContractors());
  const [termsClauses, setTermsClauses] = useState<TermsClause[]>(() => loadTermsClauses());

  // Editing state
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Preview & Print modal state
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);

  // Save changes to storage
  const handleSaveQuotations = (newList: Quotation[]) => {
    setQuotations(newList);
    saveQuotations(newList);
  };

  const handleSaveServices = (newList: QuotationService[]) => {
    setServices(newList);
    saveQuotationServices(newList);
  };

  const handleSaveContractors = (newList: Contractor[]) => {
    setContractors(newList);
    saveContractors(newList);
  };

  const handleSaveTerms = (newList: TermsClause[]) => {
    setTermsClauses(newList);
    saveTermsClauses(newList);
  };

  // Actions for Quotations
  const handleSaveQuotationRecord = (quotation: Quotation) => {
    const existingIndex = quotations.findIndex((q) => q.id === quotation.id);
    let updated: Quotation[];
    if (existingIndex >= 0) {
      updated = [...quotations];
      updated[existingIndex] = quotation;
    } else {
      updated = [quotation, ...quotations];
    }
    handleSaveQuotations(updated);
    setEditingQuotation(null);
    setActiveTab("quotation_all" as TabType);
  };

  const handleDeleteQuotation = (id: string) => {
    const updated = quotations.filter((q) => q.id !== id);
    handleSaveQuotations(updated);
  };

  const handleDuplicateQuotation = (source: Quotation) => {
    const nextNo = generateNextQuotationNo(quotations);
    const duplicated: Quotation = {
      ...source,
      id: `qtn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quotation_no: nextNo,
      status: "draft",
      date_issued: new Date().toISOString().split("T")[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [duplicated, ...quotations];
    handleSaveQuotations(updated);
    setEditingQuotation(duplicated);
    setActiveTab("quotation_create" as TabType);
  };

  // Actions for Services
  const handleSaveSingleService = (srv: QuotationService) => {
    const existingIndex = services.findIndex((s) => s.id === srv.id);
    let updated: QuotationService[];
    if (existingIndex >= 0) {
      updated = [...services];
      updated[existingIndex] = srv;
    } else {
      updated = [srv, ...services];
    }
    handleSaveServices(updated);
  };

  const handleDeleteSingleService = (id: string) => {
    const updated = services.filter((s) => s.id !== id);
    handleSaveServices(updated);
  };

  // Actions for Contractors
  const handleSaveSingleContractor = (cntr: Contractor) => {
    const existingIndex = contractors.findIndex((c) => c.id === cntr.id);
    let updated: Contractor[];
    if (existingIndex >= 0) {
      updated = [...contractors];
      updated[existingIndex] = cntr;
    } else {
      updated = [cntr, ...contractors];
    }
    handleSaveContractors(updated);
  };

  const handleAddNewContractorInline = (
    cData: Omit<Contractor, "id" | "created_at">
  ): Contractor => {
    const newC: Contractor = {
      ...cData,
      id: `cntr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString().split("T")[0]
    };
    handleSaveContractors([newC, ...contractors]);
    return newC;
  };

  const handleDeleteSingleContractor = (id: string) => {
    const updated = contractors.filter((c) => c.id !== id);
    handleSaveContractors(updated);
  };

  // Actions for Terms
  const handleSaveSingleTermsClause = (clause: TermsClause) => {
    const existingIndex = termsClauses.findIndex((t) => t.id === clause.id);
    let updated: TermsClause[];
    if (existingIndex >= 0) {
      updated = [...termsClauses];
      updated[existingIndex] = clause;
    } else {
      updated = [...termsClauses, clause];
    }
    handleSaveTerms(updated);
  };

  const handleDeleteSingleTermsClause = (id: string) => {
    const updated = termsClauses.filter((t) => t.id !== id);
    handleSaveTerms(updated);
  };

  const handleToggleTermsDefault = (id: string) => {
    const updated = termsClauses.map((t) =>
      t.id === id ? { ...t, is_default: !t.is_default } : t
    );
    handleSaveTerms(updated);
  };

  // Sub-tabs list matching the spec
  const subTabs = [
    {
      id: "quotation_dashboard" as QuotationTabType,
      label: "ഡാഷ്‌ബോർഡ്",
      sub: "Dashboard",
      icon: LayoutDashboard
    },
    {
      id: "quotation_create" as QuotationTabType,
      label: "ക്വട്ടേഷൻ നിർമ്മിക്കുക",
      sub: "Create Quotation",
      icon: PlusCircle
    },
    {
      id: "quotation_all" as QuotationTabType,
      label: "എല്ലാ ക്വട്ടേഷനുകളും",
      sub: "All Quotations",
      icon: FileText
    },
    {
      id: "quotation_rates" as QuotationTabType,
      label: "സർവീസ് & റേറ്റ് ലിസ്റ്റ്",
      sub: "Service & Rate List",
      icon: Layers
    },
    {
      id: "quotation_contractors" as QuotationTabType,
      label: "കോൺട്രാക്ടർമാർ",
      sub: "Contractors",
      icon: Users
    },
    {
      id: "quotation_terms" as QuotationTabType,
      label: "നിബന്ധനകളും വ്യവസ്ഥകളും",
      sub: "Terms & Conditions",
      icon: ShieldCheck
    }
  ];

  // Resolve current view
  const currentTab = (activeTab as QuotationTabType) || "quotation_dashboard";

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Secondary Navigation Tabs (Complementary to Left Sidebar) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center gap-1 shadow-sm">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === "quotation_create" && currentTab !== "quotation_create") {
                  setEditingQuotation(null);
                }
                setActiveTab(tab.id as TabType);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Screen 1: Dashboard */}
      {currentTab === "quotation_dashboard" && (
        <QuotationDashboardView
          quotations={quotations}
          services={services}
          contractors={contractors}
          termsClauses={termsClauses}
          onCreateNew={() => {
            setEditingQuotation(null);
            setActiveTab("quotation_create" as TabType);
          }}
          onViewAll={() => setActiveTab("quotation_all" as TabType)}
          onEditQuotation={(q) => {
            setEditingQuotation(q);
            setActiveTab("quotation_create" as TabType);
          }}
          onPreviewQuotation={(q) => setPreviewQuotation(q)}
          onManageRates={() => setActiveTab("quotation_rates" as TabType)}
        />
      )}

      {/* Screen 2: Create / Edit Quotation */}
      {currentTab === "quotation_create" && (
        <QuotationCreateEdit
          initialQuotation={editingQuotation}
          services={services}
          contractors={contractors}
          termsClauses={termsClauses}
          allQuotations={quotations}
          onSave={handleSaveQuotationRecord}
          onCancel={() => {
            setEditingQuotation(null);
            setActiveTab("quotation_all" as TabType);
          }}
          onPreview={(q) => setPreviewQuotation(q)}
          onAddNewContractor={handleAddNewContractorInline}
        />
      )}

      {/* Screen 3: All Quotations */}
      {currentTab === "quotation_all" && (
        <QuotationListView
          quotations={quotations}
          onCreateNew={() => {
            setEditingQuotation(null);
            setActiveTab("quotation_create" as TabType);
          }}
          onEdit={(q) => {
            setEditingQuotation(q);
            setActiveTab("quotation_create" as TabType);
          }}
          onPreview={(q) => setPreviewQuotation(q)}
          onDelete={handleDeleteQuotation}
          onDuplicate={handleDuplicateQuotation}
        />
      )}

      {/* Screen 4: Service & Rate List */}
      {currentTab === "quotation_rates" && (
        <QuotationRatesMaster
          services={services}
          onSaveService={handleSaveSingleService}
          onDeleteService={handleDeleteSingleService}
        />
      )}

      {/* Screen 5: Contractors */}
      {currentTab === "quotation_contractors" && (
        <QuotationContractorsMaster
          contractors={contractors}
          quotations={quotations}
          onSaveContractor={handleSaveSingleContractor}
          onDeleteContractor={handleDeleteSingleContractor}
        />
      )}

      {/* Screen 6: Terms & Conditions */}
      {currentTab === "quotation_terms" && (
        <QuotationTermsMaster
          termsClauses={termsClauses}
          onSaveClause={handleSaveSingleTermsClause}
          onDeleteClause={handleDeleteSingleTermsClause}
          onReorderClauses={handleSaveTerms}
          onToggleDefault={handleToggleTermsDefault}
        />
      )}

      {/* PRINT / A4 PREVIEW MODAL */}
      {previewQuotation && (
        <QuotationPrintDocument
          quotation={previewQuotation}
          services={services}
          contractors={contractors}
          termsClauses={termsClauses}
          onClose={() => setPreviewQuotation(null)}
          onEdit={(q) => {
            setPreviewQuotation(null);
            setEditingQuotation(q);
            setActiveTab("quotation_create" as TabType);
          }}
          onSave={(updated) => {
            handleSaveQuotationRecord(updated);
            setPreviewQuotation(updated);
          }}
        />
      )}
    </div>
  );
};
