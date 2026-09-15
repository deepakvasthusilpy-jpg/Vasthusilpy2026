import React, { useState, useMemo } from "react";
import {
  ApplicationFormTemplate,
  FormEntryRecord
} from "../../types";
import {
  Search,
  Plus,
  FileText,
  Printer,
  Download,
  Mail,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Layers,
  ChevronRight,
  Filter,
  ArrowUpDown
} from "lucide-react";
import * as XLSX from "xlsx";

interface FormEntriesDashboardViewProps {
  forms: ApplicationFormTemplate[];
  selectedFormId: string;
  onSelectFormId: (id: string) => void;
  entries: FormEntryRecord[];
  onFillNewEntry: (formId: string) => void;
  onEditEntry: (entry: FormEntryRecord) => void;
  onDeleteEntry: (entryId: string) => void;
  onViewPrintEntry: (entry: FormEntryRecord) => void;
  onDownloadPdf: (entry: FormEntryRecord) => void;
  onMailEntry: (entry: FormEntryRecord) => void;
  onCreateNewForm: () => void;
  onEditForm?: (form: ApplicationFormTemplate) => void;
  onDeleteForm?: (formId: string) => void;
  onClearAllForms?: () => void;
}

export const FormEntriesDashboardView: React.FC<FormEntriesDashboardViewProps> = ({
  forms,
  selectedFormId,
  onSelectFormId,
  entries,
  onFillNewEntry,
  onEditEntry,
  onDeleteEntry,
  onViewPrintEntry,
  onDownloadPdf,
  onMailEntry,
  onCreateNewForm,
  onEditForm,
  onDeleteForm,
  onClearAllForms
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const currentForm = useMemo(() => {
    return forms.find((f) => f.id === selectedFormId) || forms[0];
  }, [forms, selectedFormId]);

  // Entries filtered by current active form
  const formEntries = useMemo(() => {
    if (!currentForm) return [];
    return entries.filter((e) => e.formId === currentForm.id);
  }, [entries, currentForm]);

  // Search & Status filter
  const filteredEntries = useMemo(() => {
    return formEntries.filter((entry) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (entry.applicantName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.phone || "").includes(searchTerm) ||
        (entry.surveyNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.villageOrPanchayat || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(entry.values || {}).some((v) =>
          String(v).toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "ALL" || entry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [formEntries, searchTerm, statusFilter]);

  // Stats calculation for current form
  const stats = useMemo(() => {
    const total = formEntries.length;
    const completed = formEntries.filter((e) => e.status === "COMPLETED").length;
    const submitted = formEntries.filter((e) => e.status === "SUBMITTED").length;
    const mailed = formEntries.filter((e) => (e.mailedTo && e.mailedTo.length > 0) || e.status === "MAILED").length;
    return { total, completed, submitted, mailed };
  }, [formEntries]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (!currentForm || formEntries.length === 0) return;

    const dataRows = formEntries.map((e, index) => {
      const row: Record<string, any> = {
        "ക്രമ നമ്പർ": index + 1,
        "റഫറൻസ് ഐഡി (Ref ID)": e.id,
        "അപേക്ഷകൻ (Applicant Name)": e.applicantName,
        "മൊബൈൽ (Phone)": e.phone || "",
        "ഇമെയിൽ (Email)": e.email || "",
        "വില്ലേജ് / തദ്ദേശ സ്ഥാപനം": e.villageOrPanchayat || "",
        "സർവ്വേ നമ്പർ": e.surveyNo || "",
        "സ്റ്റാറ്റസ് (Status)": e.status,
        "സമർപ്പിച്ച തീയതി": new Date(e.submittedAt).toLocaleDateString("en-IN")
      };

      // Add dynamic fields
      currentForm.fields.forEach((f) => {
        row[f.labelMl || f.label] = e.values?.[f.key] || "";
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Application_Entries");
    XLSX.writeFile(workbook, `${currentForm.id}_Entries_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Application Form Selector Tabs - SEPARATE DASHBOARD FOR EACH FORM */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> അപേക്ഷാ ഫോം ഡാഷ്‌ബോർഡുകൾ (FORM DASHBOARDS)
            </span>
            <h2 className="text-lg font-extrabold text-white">
              ഓരോ അപേക്ഷയ്ക്കും പ്രത്യേക ഡാഷ്‌ബോർഡ് (Separate Dashboard for Each Form)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onClearAllForms && forms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("എല്ലാ അപേക്ഷാ ഫോമുകളും നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ? (Delete all application forms?)")) {
                    onClearAllForms();
                  }
                }}
                className="px-3 py-2 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-xl transition flex items-center gap-1.5 shadow"
                title="എല്ലാ അപേക്ഷാ ഫോമുകളും ഡിലീറ്റ് ചെയ്യുക"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>എല്ലാം നീക്കം ചെയ്യുക (Clear All)</span>
              </button>
            )}

            <button
              onClick={onCreateNewForm}
              className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ പുതിയ ഫോം ചേർക്കുക (Add Form)</span>
            </button>
            {currentForm && onEditForm && (
              <button
                type="button"
                onClick={() => onEditForm(currentForm)}
                className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-white rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                title="ഫോം എഡിറ്റ് ചെയ്യുക & PDF മാറ്റുക"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ഫോം & PDF എഡിറ്റ് (Edit)</span>
              </button>
            )}
            {currentForm && (
              <button
                onClick={() => onFillNewEntry(currentForm.id)}
                className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>അപേക്ഷ പൂരിപ്പിക്കുക (Fill Entry)</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Selection Pills */}
        {forms.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-xl bg-slate-950/40 border border-slate-800/80">
            <p className="text-xs text-slate-400">
              നിലവിൽ ഫോമുകൾ ലഭ്യമല്ല. സ്വന്തമായി അപേക്ഷാ ഫോം നിർമ്മിക്കാൻ "+ പുതിയ ഫോം ചേർക്കുക" ക്ലിക്ക് ചെയ്യുക.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {forms.map((form) => {
              const count = entries.filter((e) => e.formId === form.id).length;
              const isSelected = form.id === currentForm?.id;
              return (
                <div
                  key={form.id}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border shrink-0 ${
                    isSelected
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectFormId(form.id)}
                    className="flex items-center gap-2 text-left cursor-pointer"
                  >
                    <FileText className={`w-4 h-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate max-w-xs">{form.nameMl || form.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected
                          ? "bg-indigo-900/80 text-indigo-200 border border-indigo-400/40"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>

                  <div className="flex items-center gap-0.5 ml-1">
                    {onEditForm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditForm(form);
                        }}
                        title="ഫോം & PDF എഡിറ്റ് ചെയ്യുക (Edit Form & PDF)"
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {onDeleteForm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `"${form.nameMl || form.name}" എന്ന അപേക്ഷാ ഫോം നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ? (Delete this form template?)`
                            )
                          ) {
                            onDeleteForm(form.id);
                          }
                        }}
                        title="ഫോം നീക്കം ചെയ്യുക (Delete Form)"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* When no forms exist, show prominent empty card */}
      {forms.length === 0 && (
        <div className="bg-slate-900/80 border border-dashed border-slate-700/80 rounded-2xl p-12 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            നിലവിൽ അപേക്ഷാ ഫോമുകൾ ഒന്നുമില്ല (No Application Forms)
          </h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6">
            പഴയ സാമ്പിൾ ഫോമുകൾ നീക്കം ചെയ്തു. നിങ്ങൾക്ക് ആവശ്യമുള്ള ഔദ്യോഗിക അപേക്ഷാ ഫോമുകൾ (PDF അപ്‌ലോഡ് ചെയ്തോ പുതിയ ഫീൽഡുകൾ ചേർത്തോ) ഇവിടെ നിർമ്മിക്കാവുന്നതാണ്.
          </p>
          <button
            type="button"
            onClick={onCreateNewForm}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ പുതിയ അപേക്ഷാ ഫോം നിർമ്മിക്കുക (Create / Upload Form)</span>
          </button>
        </div>
      )}

      {/* Current Active Form Header Banner & Meta */}
      {currentForm && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700">
                  {currentForm.code || "APPLICATION FORM"}
                </span>
                <span className="text-xs text-slate-400">
                  വിഭാഗം: <strong className="text-slate-300">{currentForm.category}</strong>
                </span>
                <span className="text-xs text-slate-400">
                  • ഫീൽഡുകൾ: <strong className="text-indigo-300">{currentForm.fields.length}</strong>
                </span>

                {/* PDF Status Badge */}
                {currentForm.pdfUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open();
                      if (win && currentForm.pdfUrl) {
                        win.document.write(
                          `<iframe src="${currentForm.pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                        );
                      }
                    }}
                    className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-[11px] font-medium flex items-center gap-1.5 hover:bg-emerald-900/90 transition cursor-pointer"
                    title="അറ്റാച്ച് ചെയ്ത PDF പുതിയ വിൻഡോയിൽ കാണുക"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PDF അറ്റാച്ച് ചെയ്തിട്ടുണ്ട് ({currentForm.pdfFileName || "View PDF"})</span>
                  </button>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    PDF അറ്റാച്ച് ചെയ്തിട്ടില്ല
                  </span>
                )}
              </div>

              <h2 className="text-base font-black text-white mt-1">
                {currentForm.nameMl || currentForm.name}
              </h2>
              {currentForm.description && (
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                  {currentForm.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onEditForm && (
              <button
                type="button"
                onClick={() => onEditForm(currentForm)}
                className="px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:text-white rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                title="ഫോം എഡിറ്റ് ചെയ്യുക, പുതിയ ഫീൽഡുകൾ ചേർക്കുക അല്ലെങ്കിൽ PDF മാറ്റുക"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>ഫോം & PDF എഡിറ്റ് ചെയ്യുക</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onFillNewEntry(currentForm.id)}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>അപേക്ഷ പൂരിപ്പിക്കുക</span>
            </button>
          </div>
        </div>
      )}

      {/* Current Active Form Meta & KPI Stats */}
      {currentForm && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">ആകെ അപേക്ഷകൾ (Total)</span>
              <div className="text-2xl font-black text-white mt-0.5">{stats.total}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">പൂർത്തിയായവ (Completed)</span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">{stats.completed}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">സമർപ്പിച്ചവ (Submitted)</span>
              <div className="text-2xl font-black text-blue-400 mt-0.5">{stats.submitted}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">ഇമെയിൽ അയച്ചവ (Mailed)</span>
              <div className="text-2xl font-black text-teal-400 mt-0.5">{stats.mailed}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Send className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      {currentForm && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="അപേക്ഷകന്റെ പേര്, ഫോൺ, സർവ്വേ നമ്പർ തിരയുക..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-xl p-1 text-xs">
              <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                <Filter className="w-3 h-3" /> സ്റ്റാറ്റസ്:
              </span>
              {(["ALL", "COMPLETED", "SUBMITTED", "DRAFT"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    statusFilter === st
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {st === "ALL" ? "എല്ലാം" : st}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportExcel}
              disabled={filteredEntries.length === 0}
              className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition flex items-center gap-1.5 disabled:opacity-40"
              title="Excel ഫയലായി എക്സ്പോർട്ട് ചെയ്യുക"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Excel Export</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabular Form of Entries */}
      {currentForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 border-b border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center font-bold">ക്രമം</th>
                <th className="py-3 px-4 font-bold">അപേക്ഷകൻ (Applicant Name)</th>
                <th className="py-3 px-4 font-bold">ഫോൺ & ഇമെയിൽ (Contact)</th>
                <th className="py-3 px-4 font-bold">വില്ലേജ് / സർവ്വേ (Location)</th>
                <th className="py-3 px-4 font-bold">തീയതി (Date)</th>
                <th className="py-3 px-4 font-bold text-center">സ്റ്റാറ്റസ് (Status)</th>
                <th className="py-3 px-4 font-bold text-right">നടപടികൾ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">
                      ഈ ഫോമിൽ ഇതുവരെ അപേക്ഷാ വിവരങ്ങൾ ചേർത്തിട്ടില്ല
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      മുകളിലുള്ള "+ അപേക്ഷ പൂരിപ്പിക്കുക" ബട്ടൺ ക്ലിക്ക് ചെയ്ത് പുതിയ അപേക്ഷ ചേർക്കാവുന്നതാണ്.
                    </p>
                    {currentForm && (
                      <button
                        onClick={() => onFillNewEntry(currentForm.id)}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30"
                      >
                        <Plus className="w-4 h-4" /> ആദ്യത്തെ അപേക്ഷ പൂരിപ്പിക്കുക
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="text-sm text-white font-bold">{entry.applicantName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {entry.id}
                        </span>
                        {entry.mailedTo && entry.mailedTo.length > 0 && (
                          <span className="text-teal-400 flex items-center gap-1">
                            <Send className="w-2.5 h-2.5" /> Mailed ({entry.mailedTo.length})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">{entry.phone || "—"}</div>
                      {entry.email && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {entry.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{entry.villageOrPanchayat || "—"}</div>
                      {entry.surveyNo && (
                        <div className="text-[10px] text-slate-400">
                          Sy: <span className="text-indigo-300 font-mono">{entry.surveyNo}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">
                      {new Date(entry.submittedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          entry.status === "COMPLETED"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-700"
                            : entry.status === "SUBMITTED"
                            ? "bg-blue-950/80 text-blue-300 border-blue-700"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View & Print A4 */}
                        <button
                          onClick={() => onViewPrintEntry(entry)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="A4 പ്രിന്റ് & പ്രിവ്യൂ (Print in A4 Sheet)"
                        >
                          <Printer className="w-4 h-4 text-cyan-400" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => onDownloadPdf(entry)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="PDF ഡൗൺലോഡ് ചെയ്യുക (Download PDF)"
                        >
                          <Download className="w-4 h-4 text-emerald-400" />
                        </button>

                        {/* Mail to Desired ID */}
                        <button
                          onClick={() => onMailEntry(entry)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="ഇമെയിൽ അയക്കുക (Mail to Desired Email)"
                        >
                          <Mail className="w-4 h-4 text-indigo-400" />
                        </button>

                        {/* Edit Entry */}
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
                          title="എഡിറ്റ് ചെയ്യുക (Edit)"
                        >
                          <Edit2 className="w-4 h-4 text-amber-400" />
                        </button>

                        {/* Delete Entry */}
                        {deleteConfirmId === entry.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-700 rounded-lg p-1">
                            <span className="text-[10px] text-rose-300 px-1">കളയണോ?</span>
                            <button
                              onClick={() => {
                                onDeleteEntry(entry.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold"
                            >
                              അതെ
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px]"
                            >
                              വേണ്ട
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(entry.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                            title="ഡിലീറ്റ് ചെയ്യുക (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
