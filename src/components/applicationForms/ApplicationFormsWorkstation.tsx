import React, { useState, useEffect } from "react";
import {
  ApplicationFormTemplate,
  FormEntryRecord,
  ApplicationFormsTabType
} from "../../types";
import {
  loadApplicationForms,
  saveApplicationForms,
  upsertApplicationForm,
  deleteApplicationForm,
  clearAllApplicationForms,
  loadFormEntries,
  saveFormEntries,
  upsertFormEntry,
  deleteFormEntry
} from "../../utils/applicationFormsManager";
import { FormEntriesDashboardView } from "./FormEntriesDashboardView";
import { FormFillupView } from "./FormFillupView";
import { FormPdfBuilderView } from "./FormPdfBuilderView";
import { MailApplicationModal } from "./MailApplicationModal";
import { A4PrintableDocument } from "./A4PrintableDocument";
import { downloadFilledPdf, printFilledPdf } from "../../utils/pdfFormOverlayEngine";
import {
  FileText,
  Table,
  Edit3,
  FilePlus,
  Plus,
  Sparkles,
  Printer,
  Download,
  Mail,
  CheckCircle2,
  X
} from "lucide-react";

interface ApplicationFormsWorkstationProps {
  initialTab?: ApplicationFormsTabType;
}

export const ApplicationFormsWorkstation: React.FC<ApplicationFormsWorkstationProps> = ({
  initialTab = "application_forms_dashboard"
}) => {
  const [forms, setForms] = useState<ApplicationFormTemplate[]>(() => loadApplicationForms());
  const [entries, setEntries] = useState<FormEntryRecord[]>(() => loadFormEntries());
  const [selectedFormId, setSelectedFormId] = useState<string>(() => {
    const loaded = loadApplicationForms();
    return loaded[0]?.id || "";
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "fill" | "builder">("dashboard");
  const [editingEntry, setEditingEntry] = useState<FormEntryRecord | null>(null);
  const [formToEdit, setFormToEdit] = useState<ApplicationFormTemplate | null>(null);

  // Quick Print / Preview Modal State
  const [previewEntry, setPreviewEntry] = useState<FormEntryRecord | null>(null);
  const [mailEntryModalData, setMailEntryModalData] = useState<{
    isOpen: boolean;
    entry: FormEntryRecord | null;
  }>({ isOpen: false, entry: null });

  // Sync with storage events
  useEffect(() => {
    const handleFormsSync = () => {
      setForms(loadApplicationForms());
    };
    const handleEntriesSync = () => {
      setEntries(loadFormEntries());
    };

    window.addEventListener("vasthusilpy_forms_updated", handleFormsSync);
    window.addEventListener("vasthusilpy_form_entries_updated", handleEntriesSync);

    return () => {
      window.removeEventListener("vasthusilpy_forms_updated", handleFormsSync);
      window.removeEventListener("vasthusilpy_form_entries_updated", handleEntriesSync);
    };
  }, []);

  const activeForm = forms.find((f) => f.id === selectedFormId) || forms[0];

  // Actions
  const handleFillNewEntry = (formId: string) => {
    setSelectedFormId(formId);
    setEditingEntry(null);
    setActiveTab("fill");
  };

  const handleEditEntry = (entry: FormEntryRecord) => {
    setSelectedFormId(entry.formId);
    setEditingEntry(entry);
    setActiveTab("fill");
  };

  const handleDeleteEntry = (entryId: string) => {
    const updated = deleteFormEntry(entryId);
    setEntries(updated);
  };

  const handleSaveEntry = (entry: FormEntryRecord) => {
    const updated = upsertFormEntry(entry);
    setEntries(updated);
    setEditingEntry(entry);
  };

  const handleCreateNewForm = () => {
    setFormToEdit(null);
    setActiveTab("builder");
  };

  const handleEditForm = (form: ApplicationFormTemplate) => {
    setFormToEdit(form);
    setSelectedFormId(form.id);
    setActiveTab("builder");
  };

  const handleSaveFormTemplate = (template: ApplicationFormTemplate) => {
    const updated = upsertApplicationForm(template);
    setForms(updated);
    setSelectedFormId(template.id);
    setFormToEdit(null);
    setActiveTab("dashboard");
  };

  const handleDeleteForm = (formId: string) => {
    const updated = deleteApplicationForm(formId);
    setForms(updated);
    if (selectedFormId === formId) {
      setSelectedFormId(updated[0]?.id || "");
    }
  };

  const handleClearAllForms = () => {
    clearAllApplicationForms();
    setForms([]);
    setSelectedFormId("");
  };

  const handleViewPrintEntry = (entry: FormEntryRecord) => {
    setPreviewEntry(entry);
  };

  const handleDownloadPdfForEntry = async (entry: FormEntryRecord) => {
    const parentForm = forms.find((f) => f.id === entry.formId) || activeForm;
    if (parentForm) {
      await downloadFilledPdf(parentForm, entry);
    }
  };

  const handleMailEntry = (entry: FormEntryRecord) => {
    setMailEntryModalData({ isOpen: true, entry });
  };

  return (
    <div className="min-h-screen bg-[#101318] text-slate-100 p-4 lg:p-6 space-y-6">
      {/* Top Banner & Main Section Tabs */}
      <div className="bg-gradient-to-r from-[#171b24] via-[#1f2430] to-[#171b24] border border-[#2d3446] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A66B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30 text-[10px] font-extrabold uppercase tracking-wider">
                APPLICATION FORM WORKSTATION
              </span>
              <span className="text-xs text-slate-400 font-sans">
                PDF Upload • Dynamic Fields • Malayalam & English • Vector A4 Print
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white tracking-tight">
              അപേക്ഷാ ഫോറം <span className="text-[#C9A66B] font-light italic">(Application Forms)</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed font-sans">
              PDF ഡോക്യുമെന്റുകൾ അപ്‌ലോഡ് ചെയ്തു ഫീൽഡുകൾ നിർമ്മിക്കുകയോ നിലവിലുള്ള സർക്കാർ/തദ്ദേശ ഫോമുകൾ പൂരിപ്പിച്ചു A4 ഷീറ്റിൽ പ്രിന്റ് ചെയ്യുകയോ PDF ഡൗൺലോഡ് ചെയ്തു ഇമെയിൽ അയക്കുകയോ ചെയ്യാം.
            </p>
          </div>

          {/* Workstation View Tabs */}
          <div className="flex items-center bg-[#13161f] border border-[#2b3242] rounded-2xl p-1.5 shadow-lg">
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setEditingEntry(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#C9A66B] text-slate-950 shadow-md shadow-[#C9A66B]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Table className="w-4 h-4" />
              <span>ഡാഷ്‌ബോർഡ് (Dashboard)</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === "dashboard" ? "bg-black/20 text-slate-950" : "bg-slate-900/60 text-slate-400"}`}>
                {entries.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("fill");
                setEditingEntry(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "fill"
                  ? "bg-[#C9A66B] text-slate-950 shadow-md shadow-[#C9A66B]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>അപേക്ഷ പൂരിപ്പിക്കുക (Fill Form)</span>
            </button>

            <button
              onClick={() => {
                setFormToEdit(null);
                setActiveTab("builder");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "builder"
                  ? "bg-[#C9A66B] text-slate-950 shadow-md shadow-[#C9A66B]/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FilePlus className="w-4 h-4" />
              <span>PDF ബിൽഡർ (Form Builder)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Switcher */}
      {activeTab === "dashboard" && (
        <FormEntriesDashboardView
          forms={forms}
          selectedFormId={selectedFormId}
          onSelectFormId={setSelectedFormId}
          entries={entries}
          onFillNewEntry={handleFillNewEntry}
          onEditEntry={handleEditEntry}
          onDeleteEntry={handleDeleteEntry}
          onViewPrintEntry={handleViewPrintEntry}
          onDownloadPdf={handleDownloadPdfForEntry}
          onMailEntry={handleMailEntry}
          onCreateNewForm={handleCreateNewForm}
          onEditForm={handleEditForm}
          onDeleteForm={handleDeleteForm}
          onClearAllForms={handleClearAllForms}
        />
      )}

      {activeTab === "fill" && (
        activeForm ? (
          <FormFillupView
            form={activeForm}
            existingEntry={editingEntry}
            onBackToDashboard={() => setActiveTab("dashboard")}
            onSaveEntry={handleSaveEntry}
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
            <h3 className="text-lg font-bold text-white mb-2">
              അപേക്ഷ പൂരിപ്പിക്കുന്നതിന് ആദ്യം ഒരു അപേക്ഷാ ഫോം ഉണ്ടാക്കുക
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              നിലവിൽ ഫോമുകൾ ലഭ്യമല്ല. &quot;PDF ഫോം ബിൽഡർ&quot; വഴി പുതിയ അപേക്ഷാ ഫോം ഉണ്ടാക്കാവുന്നതാണ്.
            </p>
            <button
              onClick={() => {
                setFormToEdit(null);
                setActiveTab("builder");
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              പുതിയ ഫോം നിർമ്മിക്കുക (Go to Builder)
            </button>
          </div>
        )
      )}

      {activeTab === "builder" && (
        <FormPdfBuilderView
          initialForm={formToEdit}
          onSaveForm={handleSaveFormTemplate}
          onCancel={() => {
            setFormToEdit(null);
            setActiveTab("dashboard");
          }}
        />
      )}

      {/* Standalone View / Print Preview Modal */}
      {previewEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  A4 പ്രിന്റ് പ്രിവ്യൂ (A4 Sheet Preview)
                </h3>
                <p className="text-xs text-slate-400">
                  {previewEntry.applicantName} • Ref: {previewEntry.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const targetForm = forms.find((f) => f.id === previewEntry.formId) || activeForm;
                    if (targetForm) {
                      printFilledPdf(targetForm, previewEntry);
                    } else {
                      window.print();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-[#C9A66B] hover:bg-[#B89355] text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> പ്രിന്റ് (Print A4)
                </button>
                <button
                  onClick={() => handleDownloadPdfForEntry(previewEntry)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" /> PDF ഡൗൺലോഡ്
                </button>
                <button
                  onClick={() => {
                    handleMailEntry(previewEntry);
                    setPreviewEntry(null);
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Mail className="w-3.5 h-3.5" /> ഇമെയിൽ
                </button>
                <button
                  onClick={() => setPreviewEntry(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Sheet Document */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
              {(() => {
                const targetForm = forms.find((f) => f.id === previewEntry.formId) || activeForm;
                return (
                  <div className="transform scale-95 sm:scale-100 transition-transform">
                    <A4PrintableDocument form={targetForm} entry={previewEntry} />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Mail Modal */}
      {mailEntryModalData.isOpen && mailEntryModalData.entry && (
        <MailApplicationModal
          isOpen={mailEntryModalData.isOpen}
          onClose={() => setMailEntryModalData({ isOpen: false, entry: null })}
          form={
            forms.find((f) => f.id === mailEntryModalData.entry?.formId) || activeForm
          }
          entry={mailEntryModalData.entry}
          onSuccess={(mailedEmail) => {
            if (mailEntryModalData.entry) {
              const updatedMailed = Array.from(
                new Set([...(mailEntryModalData.entry.mailedTo || []), mailedEmail])
              );
              const updated = {
                ...mailEntryModalData.entry,
                status: "MAILED" as const,
                mailedTo: updatedMailed
              };
              handleSaveEntry(updated);
            }
          }}
        />
      )}
    </div>
  );
};
