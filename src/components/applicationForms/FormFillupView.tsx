import React, { useState, useRef } from "react";
import {
  ApplicationFormTemplate,
  FormEntryRecord
} from "../../types";
import {
  ArrowLeft,
  Save,
  Printer,
  Download,
  Mail,
  RotateCcw,
  CheckCircle2,
  Eye,
  Edit3,
  Globe,
  FileText,
  ExternalLink,
  Layers
} from "lucide-react";
import { A4PrintableDocument } from "./A4PrintableDocument";
import { MailApplicationModal } from "./MailApplicationModal";
import {
  downloadFilledPdf,
  printFilledPdf,
  generateFilledPdfDocument
} from "../../utils/pdfFormOverlayEngine";

interface FormFillupViewProps {
  form: ApplicationFormTemplate;
  existingEntry?: FormEntryRecord | null;
  onBackToDashboard: () => void;
  onSaveEntry: (entry: FormEntryRecord) => void;
}

export const FormFillupView: React.FC<FormFillupViewProps> = ({
  form,
  existingEntry,
  onBackToDashboard,
  onSaveEntry
}) => {
  // Field values state
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    if (existingEntry?.values) {
      return { ...existingEntry.values };
    }
    const initial: Record<string, any> = {};
    form.fields.forEach((f) => {
      initial[f.key] = f.defaultValue || "";
    });
    return initial;
  });

  const [applicantName, setApplicantName] = useState<string>(
    existingEntry?.applicantName || formValues["applicant_name"] || formValues["owner_name"] || ""
  );
  const [phone, setPhone] = useState<string>(
    existingEntry?.phone || formValues["phone"] || ""
  );
  const [email, setEmail] = useState<string>(
    existingEntry?.email || formValues["email"] || ""
  );
  const [status, setStatus] = useState<FormEntryRecord["status"]>(
    existingEntry?.status || "COMPLETED"
  );

  const [activeViewMode, setActiveViewMode] = useState<"form" | "preview" | "attached_pdf" | "split">("split");
  const [splitRightTab, setSplitRightTab] = useState<"overlay" | "preview" | "attached_pdf">(
    form.pdfUrl ? "overlay" : "preview"
  );
  const [activeOverlayFieldKey, setActiveOverlayFieldKey] = useState<string | null>(null);
  const [overlayPageNumber, setOverlayPageNumber] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const printDocumentRef = useRef<HTMLDivElement | null>(null);

  // Sync applicant name & phone if typed in form fields
  const handleFieldValueChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    if (key === "applicant_name" || key === "owner_name") {
      setApplicantName(value);
    }
    if (key === "phone") {
      setPhone(value);
    }
    if (key === "email") {
      setEmail(value);
    }
  };

  // Construct entry representation
  const currentEntryRecord: FormEntryRecord = {
    id: existingEntry?.id || `APP-${Date.now().toString().slice(-6)}`,
    formId: form.id,
    formName: form.name,
    applicantName: applicantName || formValues["applicant_name"] || formValues["owner_name"] || "അപേക്ഷകൻ",
    phone: phone || formValues["phone"] || "",
    email: email || formValues["email"] || "",
    villageOrPanchayat: formValues["village"] || formValues["lsgd_name"] || formValues["local_body"] || "",
    surveyNo: formValues["survey_no"] || formValues["survey_subdivision"] || formValues["ward_door_no"] || "",
    status: status,
    submittedAt: existingEntry?.submittedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    values: formValues,
    mailedTo: existingEntry?.mailedTo || []
  };

  // Save entry
  const handleSave = () => {
    setIsSaving(true);
    onSaveEntry(currentEntryRecord);
    setTimeout(() => {
      setIsSaving(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    }, 400);
  };

  // Direct Print in A4 Sheet
  const handlePrintA4 = async () => {
    try {
      await printFilledPdf(form, currentEntryRecord);
    } catch {
      window.print();
    }
  };

  // Generate Base64 PDF using pdf-lib with Malayalam font embedding
  const getPdfBase64 = async (): Promise<string | null> => {
    try {
      const bytes = await generateFilledPdfDocument({ template: form, entry: currentEntryRecord });
      let binary = "";
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (err) {
      console.error("Error generating PDF base64:", err);
      return null;
    }
  };

  // Download Generated PDF
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await downloadFilledPdf(form, currentEntryRecord);
    } catch (err) {
      console.error("Error downloading PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Reset form
  const handleResetForm = () => {
    const initial: Record<string, any> = {};
    form.fields.forEach((f) => {
      initial[f.key] = f.defaultValue || "";
    });
    setFormValues(initial);
  };

  const isImageAttachment = form.pdfUrl?.startsWith("data:image/");

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="bg-[#13161f] border border-[#272e3d] rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToDashboard}
              className="p-2 text-slate-300 hover:text-white bg-[#1a1f2b] hover:bg-[#232938] border border-[#2e374a] rounded-xl transition cursor-pointer"
              title="തിരികെ ഡാഷ്‌ബോർഡിലേക്ക് (Back to Dashboard)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30">
                  {form.code || "APPLICATION FORM"}
                </span>
                <span className="text-xs text-slate-400">
                  ID: <span className="font-mono text-slate-200">{currentEntryRecord.id}</span>
                </span>
                {form.pdfUrl && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> PDF അറ്റാച്ച് ചെയ്തിട്ടുണ്ട്
                  </span>
                )}
              </div>
              <h1 className="text-xl font-serif font-bold text-white mt-0.5">
                {form.nameMl || form.name}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#181c26] border border-[#2a3243] rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveViewMode("form")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeViewMode === "form"
                    ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ഫോം (Form)</span>
              </button>

              <button
                onClick={() => setActiveViewMode("split")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition hidden lg:flex items-center gap-1.5 cursor-pointer ${
                  activeViewMode === "split"
                    ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>

              <button
                onClick={() => setActiveViewMode("preview")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeViewMode === "preview"
                    ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>A4 പ്രിവ്യൂ</span>
              </button>

              {form.pdfUrl && (
                <button
                  onClick={() => setActiveViewMode("attached_pdf")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeViewMode === "attached_pdf"
                      ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                      : "text-slate-300 hover:text-white"
                  }`}
                  title="അറ്റാച്ച് ചെയ്ത യഥാർത്ഥ PDF കാണുക"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>അറ്റാച്ച്ഡ് PDF</span>
                </button>
              )}
            </div>

            {/* Print in A4 Sheet */}
            <button
              onClick={handlePrintA4}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#1b202c] hover:bg-[#252c3c] border border-[#2e374a] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="A4 പേപ്പറിൽ പ്രിന്റ് ചെയ്യുക (Print A4)"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>പ്രിന്റ് (Print A4)</span>
            </button>

            {/* Download as PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#1b202c] hover:bg-[#252c3c] border border-[#2e374a] rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              title="പൂരിപ്പിച്ച അപേക്ഷ PDF ആയി ഡൗൺലോഡ് ചെയ്യുക"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{isGeneratingPdf ? "ഡൗൺലോഡ് ചെയ്യുന്നു..." : "PDF ഡൗൺലോഡ്"}</span>
            </button>

            {/* Mail to Desired ID */}
            <button
              onClick={() => setIsMailModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[#1b202c] hover:bg-[#252c3c] border border-[#2e374a] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="ഇമെയിൽ അയക്കുക (Mail Application)"
            >
              <Mail className="w-4 h-4 text-[#C9A66B]" />
              <span>ഇമെയിൽ (Mail)</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-[#C9A66B] hover:bg-[#B89355] rounded-xl shadow-lg shadow-[#C9A66B]/25 transition flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "സൂക്ഷിക്കുന്നു..." : "സേവ് ചെയ്യുക (Save)"}</span>
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>അപേക്ഷാ വിവരങ്ങൾ വിജയകരമായി ഡാഷ്‌ബോർഡിൽ സേവ് ചെയ്തു (Application details saved to dashboard)!</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-6 ${activeViewMode === "split" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Left Side: Form Input Fields (Manual / Form Fill) */}
        {(activeViewMode === "form" || activeViewMode === "split") && (
          <div className={`${activeViewMode === "split" ? "lg:col-span-6 xl:col-span-5" : "w-full max-w-4xl mx-auto"} space-y-4`}>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    അപേക്ഷാ വിവരങ്ങൾ രേഖപ്പെടുത്തുക (Fill Form)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    മലയാളം, ഇംഗ്ലീഷ്, നമ്പറുകൾ ടൈപ്പ് ചെയ്യാവുന്നതാണ് (Supports Malayalam, English & Numbers)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition text-xs flex items-center gap-1 cursor-pointer"
                  title="ഫോം റീസെറ്റ് ചെയ്യുക"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>റീസെറ്റ്</span>
                </button>
              </div>

              {/* Input Fields Grid */}
              <div className="space-y-4">
                {form.fields.map((field) => {
                  const val = formValues[field.key] ?? "";
                  return (
                    <div key={field.id} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-200">
                        <span>{field.labelMl || field.label}</span>
                        {field.labelEn && field.labelEn !== field.labelMl && (
                          <span className="text-[11px] text-slate-400 font-normal ml-1">
                            ({field.labelEn})
                          </span>
                        )}
                        {field.required && <span className="text-rose-400 ml-1">*</span>}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                          placeholder={field.placeholder || "വിവരങ്ങൾ ടൈപ്പ് ചെയ്യുക..."}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                        />
                      ) : field.type === "select" && field.options && field.options.length > 0 ? (
                        <select
                          value={val}
                          onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                        >
                          <option value="">-- തിരഞ്ഞെടുക്കുക (Select) --</option>
                          {field.options.map((opt, i) => (
                            <option key={i} value={opt} className="bg-slate-900 text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "checkbox" ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`fld_chk_${field.id}`}
                            checked={!!val}
                            onChange={(e) => handleFieldValueChange(field.key, e.target.checked)}
                            className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                          />
                          <label htmlFor={`fld_chk_${field.id}`} className="text-xs text-slate-300 cursor-pointer select-none">
                            {val ? "ഉണ്ട് (Yes)" : "ഇല്ല (No)"}
                          </label>
                        </div>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                          value={val}
                          onChange={(e) => handleFieldValueChange(field.key, e.target.value)}
                          placeholder={field.placeholder || "ടൈപ്പ് ചെയ്യുക..."}
                          className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Selector */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  അപേക്ഷാ സ്റ്റാറ്റസ് (Application Status):
                </span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SUBMITTED">SUBMITTED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="PRINTED">PRINTED</option>
                  <option value="MAILED">MAILED</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Right Side: Split View (Toggles between A4 Printable Sheet and Attached PDF) */}
        {activeViewMode === "split" && (
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-center space-y-3">
            <div className="w-full flex items-center justify-between text-xs text-slate-300 px-2 bg-[#13161f] border border-[#272e3d] p-2.5 rounded-xl">
              <div className="flex items-center gap-1 bg-[#181c26] p-1 rounded-lg border border-[#2b3345]">
                {form.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => setSplitRightTab("overlay")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      splitRightTab === "overlay"
                        ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="PDF-ൽ നേരിട്ട് ക്ലിക്ക് ചെയ്തു പൂരിപ്പിക്കുക"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>PDF ഓവർലേ ഫിൽ (Interactive)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSplitRightTab("preview")}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                    splitRightTab === "preview"
                      ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>A4 പ്രിന്റ് ഷീറ്റ്</span>
                </button>

                {form.pdfUrl && (
                  <button
                    type="button"
                    onClick={() => setSplitRightTab("attached_pdf")}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                      splitRightTab === "attached_pdf"
                        ? "bg-[#C9A66B] text-slate-950 font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>ഒറിജിനൽ PDF</span>
                  </button>
                )}
              </div>

              {splitRightTab === "overlay" && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    ഡോക്യുമെന്റിൽ ക്ലിക്ക് ചെയ്തു ടൈപ്പ് ചെയ്യുക
                  </span>
                  {(() => {
                    const maxP = Math.max(form.pageCount || 1, ...form.fields.map((f) => f.pageNumber || 1));
                    if (maxP <= 1) return null;
                    return (
                      <div className="flex items-center gap-1 bg-[#1a1f2b] px-2 py-1 rounded-lg border border-[#2b3345]">
                        <span className="text-[10px] text-slate-400">പേജ്:</span>
                        {Array.from({ length: maxP }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setOverlayPageNumber(p)}
                            className={`px-2 py-0.5 text-xs rounded font-bold transition ${
                              overlayPageNumber === p
                                ? "bg-[#C9A66B] text-slate-950"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {splitRightTab === "attached_pdf" && form.pdfUrl && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const win = window.open();
                      if (win) {
                        win.document.write(
                          `<iframe src="${form.pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                        );
                      }
                    }}
                    className="text-xs text-[#C9A66B] hover:text-[#d8b87f] flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>പുതിയ വിൻഡോയിൽ</span>
                  </button>
                </div>
              )}
            </div>

            {/* Split Right Content */}
            {splitRightTab === "overlay" ? (
              <div className="w-full overflow-x-auto p-4 bg-[#0d0f14] border border-[#232936] rounded-2xl flex justify-center shadow-inner">
                <div className="relative w-full max-w-[650px] bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-300" style={{ minHeight: "850px" }}>
                  {/* Background Document / Image */}
                  {form.pdfUrl && isImageAttachment ? (
                    <img
                      src={form.pdfUrl}
                      alt="Application Page"
                      className="w-full h-auto object-contain block"
                    />
                  ) : form.pdfUrl ? (
                    <div className="absolute inset-0 opacity-15 pointer-events-none">
                      <iframe
                        src={`${form.pdfUrl}#toolbar=0&navpanes=0`}
                        title="PDF Background"
                        className="w-full h-full border-0 pointer-events-none"
                      />
                    </div>
                  ) : null}

                  {/* Header watermark/header if purely overlay */}
                  <div className="p-6 border-b border-slate-200 bg-slate-50/80">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] tracking-widest uppercase font-bold text-amber-800">
                        {form.department || "ഗവൺമെന്റ് / തദ്ദേശ സ്വയംഭരണ വകുപ്പ്"}
                      </span>
                      <h3 className="text-lg font-serif font-bold text-slate-900 leading-tight">
                        {form.nameMl || form.name}
                      </h3>
                      <p className="text-[11px] text-slate-600">
                        പേജ് {overlayPageNumber} • ഫീൽഡുകളിൽ നേരിട്ട് ക്ലിക്ക് ചെയ്തു പൂരിപ്പിക്കാം
                      </p>
                    </div>
                  </div>

                  {/* Interactive Overlaid Form Fields */}
                  <div className="relative w-full" style={{ minHeight: "720px" }}>
                    {form.fields
                      .filter((f) => (f.pageNumber || 1) === overlayPageNumber)
                      .map((f) => {
                        const isFocused = activeOverlayFieldKey === f.key;
                        const val = formValues[f.key] ?? "";
                        const left = f.xPercent ?? 10;
                        const top = f.yPercent ?? 10;
                        const width = Math.max(f.widthPercent ?? 40, 18);
                        const fontPt = f.fontSizePt || 10;
                        const align = f.alignment || "left";

                        return (
                          <div
                            key={f.key}
                            style={{
                              left: `${left}%`,
                              top: `${top}%`,
                              width: `${width}%`,
                              position: "absolute"
                            }}
                            className={`group rounded transition-all duration-150 p-1 cursor-text ${
                              isFocused
                                ? "ring-2 ring-[#C9A66B] bg-[#12151d] text-white z-30 shadow-2xl border border-[#C9A66B]"
                                : "hover:ring-1 hover:ring-[#C9A66B]/80 bg-amber-50/90 text-slate-900 border border-[#C9A66B]/40 hover:bg-amber-100/95 z-20 shadow-sm"
                            }`}
                            onClick={() => setActiveOverlayFieldKey(f.key)}
                          >
                            <div className="flex items-center justify-between text-[9px] font-bold mb-0.5 leading-none">
                              <span className={`truncate ${isFocused ? "text-[#C9A66B]" : "text-amber-900"}`}>
                                {f.labelMl || f.label}
                                {f.required && " *"}
                              </span>
                              {f.fontSizePt && (
                                <span className="text-[8px] opacity-60 font-mono">
                                  {f.fontSizePt}pt
                                </span>
                              )}
                            </div>

                            {f.type === "textarea" ? (
                              <textarea
                                rows={2}
                                value={val}
                                onChange={(e) => handleFieldValueChange(f.key, e.target.value)}
                                placeholder={f.placeholder || f.labelMl || f.label}
                                style={{
                                  fontSize: `${fontPt}pt`,
                                  textAlign: align
                                }}
                                className={`w-full font-medium bg-transparent outline-none resize-none leading-snug ${
                                  isFocused ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-500"
                                }`}
                              />
                            ) : (
                              <input
                                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                                value={val}
                                onChange={(e) => handleFieldValueChange(f.key, e.target.value)}
                                placeholder={f.placeholder || f.labelMl || f.label}
                                style={{
                                  fontSize: `${fontPt}pt`,
                                  textAlign: align
                                }}
                                className={`w-full font-medium bg-transparent outline-none leading-none ${
                                  isFocused ? "text-white placeholder-slate-500" : "text-slate-900 placeholder-slate-500"
                                }`}
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : splitRightTab === "preview" ? (
              <div className="w-full overflow-x-auto p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex justify-center shadow-inner">
                <div className="transform origin-top scale-[0.85] sm:scale-90 md:scale-95 lg:scale-100 transition-transform">
                  <A4PrintableDocument
                    form={form}
                    entry={currentEntryRecord}
                    documentRef={printDocumentRef}
                  />
                </div>
              </div>
            ) : form.pdfUrl ? (
              <div className="w-full h-[680px] rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-2xl">
                {isImageAttachment ? (
                  <img
                    src={form.pdfUrl}
                    alt="Attached Document"
                    className="w-full h-full object-contain bg-slate-900"
                  />
                ) : (
                  <iframe
                    src={`${form.pdfUrl}#toolbar=1`}
                    title="Attached Original PDF"
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Dedicated Single View: Preview Mode */}
        {activeViewMode === "preview" && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-4xl mb-3 flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="font-semibold flex items-center gap-1.5 text-slate-300">
                <Printer className="w-4 h-4 text-cyan-400" />
                A4 പ്രിന്റ് ഷീറ്റ് പ്രിവ്യൂ (A4 Sheet 210mm × 297mm)
              </span>
              <span className="text-[11px] text-slate-400">
                Ready for high-quality official printing & PDF generation
              </span>
            </div>

            <div className="w-full overflow-x-auto p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex justify-center shadow-inner">
              <div className="transform origin-top scale-[0.85] sm:scale-90 md:scale-95 lg:scale-100 transition-transform">
                <A4PrintableDocument
                  form={form}
                  entry={currentEntryRecord}
                  documentRef={printDocumentRef}
                />
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Single View: Attached PDF Mode */}
        {activeViewMode === "attached_pdf" && form.pdfUrl && (
          <div className="w-full max-w-5xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">{form.pdfFileName || "അറ്റാച്ച് ചെയ്ത ഒറിജിനൽ അപേക്ഷാ രേഖ"}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open();
                    if (win) {
                      win.document.write(
                        `<iframe src="${form.pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                      );
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>പുതിയ വിൻഡോയിൽ കാണുക</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (form.pdfUrl) {
                      const a = document.createElement("a");
                      a.href = form.pdfUrl;
                      a.download = form.pdfFileName || "attached_document.pdf";
                      a.click();
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ഒറിജിനൽ PDF ഡൗൺലോഡ്</span>
                </button>
              </div>
            </div>

            <div className="w-full h-[750px] rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-2xl">
              {isImageAttachment ? (
                <img
                  src={form.pdfUrl}
                  alt="Attached Document"
                  className="w-full h-full object-contain bg-slate-900"
                />
              ) : (
                <iframe
                  src={`${form.pdfUrl}#toolbar=1`}
                  title="Attached Original PDF"
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mail Application Modal */}
      {isMailModalOpen && (
        <MailApplicationModal
          isOpen={isMailModalOpen}
          onClose={() => setIsMailModalOpen(false)}
          form={form}
          entry={currentEntryRecord}
          getPdfBase64={getPdfBase64}
          onSuccess={(mailedEmail) => {
            const updatedMailed = Array.from(new Set([...(currentEntryRecord.mailedTo || []), mailedEmail]));
            const updatedEntry: FormEntryRecord = {
              ...currentEntryRecord,
              status: "MAILED",
              mailedTo: updatedMailed
            };
            onSaveEntry(updatedEntry);
          }}
        />
      )}
    </div>
  );
};
