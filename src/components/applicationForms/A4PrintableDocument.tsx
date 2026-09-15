import React from "react";
import { ApplicationFormTemplate, FormEntryRecord } from "../../types";
import { Building2, CheckCircle, ShieldCheck, FileText, QrCode } from "lucide-react";

interface A4PrintableDocumentProps {
  form: ApplicationFormTemplate;
  entry: FormEntryRecord;
  documentRef?: React.RefObject<HTMLDivElement | null>;
}

export const A4PrintableDocument: React.FC<A4PrintableDocumentProps> = ({
  form,
  entry,
  documentRef
}) => {
  const currentDate = entry.submittedAt
    ? new Date(entry.submittedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    : new Date().toLocaleDateString("en-IN");

  return (
    <div
      ref={documentRef}
      id={`printable-a4-${entry.id}`}
      className="a4-sheet-container bg-white text-slate-900 mx-auto shadow-2xl relative"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm 18mm",
        fontFamily: "'Segoe UI', Roboto, 'Noto Sans Malayalam', sans-serif",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
        color: "#0f172a"
      }}
    >
      {/* Top Header Bar & Seals */}
      <div className="border-b-2 border-slate-800 pb-4 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full border-2 border-emerald-700 bg-emerald-50 flex items-center justify-center p-2 text-emerald-800 font-bold">
              <Building2 className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold">
                GOVERNMENT OF KERALA / തദ്ദേശ സ്വയംഭരണ വകുപ്പ്
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {form.nameMl || form.name}
              </h1>
              <div className="text-xs text-slate-700 font-medium">
                {form.name} • {form.code || "OFFICIAL APPLICATION FORM"}
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="border border-slate-300 rounded px-2.5 py-1 bg-slate-50 text-[11px] font-mono text-slate-800 font-bold mb-1">
              REF: {entry.id}
            </div>
            <div className="text-[10px] text-slate-500">
              DATE: <span className="font-semibold text-slate-800">{currentDate}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium mt-1">
              <CheckCircle className="w-3 h-3" /> VERIFIED APPLICATION
            </div>
          </div>
        </div>

        {form.description && (
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 leading-relaxed italic">
            {form.description}
          </div>
        )}
      </div>

      {/* Applicant Meta Highlight Box */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-slate-100/80 border border-slate-300 rounded-md mb-5 text-xs">
        <div>
          <span className="text-[10px] uppercase text-slate-700 font-semibold block">അപേക്ഷകന്റെ പേര് (Applicant):</span>
          <span className="font-bold text-slate-900 text-sm">{entry.applicantName || "—"}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-700 font-semibold block">മൊബൈൽ / ഫോൺ (Phone):</span>
          <span className="font-bold text-slate-900">{entry.phone || "—"}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-700 font-semibold block">വില്ലേജ് / വാർഡ് / സർവ്വേ (Location):</span>
          <span className="font-bold text-slate-900">
            {entry.villageOrPanchayat || entry.surveyNo ? `${entry.villageOrPanchayat || ""} ${entry.surveyNo ? `(Sy. ${entry.surveyNo})` : ""}` : "—"}
          </span>
        </div>
      </div>

      {/* Fields Data Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between border-b border-slate-400 pb-1.5 mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-700" />
            അപേക്ഷാ വിവരങ്ങൾ (APPLICATION PARTICULARS)
          </h2>
          <span className="text-[10px] text-slate-500">
            Total Fields: {form.fields.length}
          </span>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-200 text-slate-800 border-b border-slate-300">
              <th className="py-2 px-2.5 text-center font-bold w-12 border-r border-slate-300">ക്രമം</th>
              <th className="py-2 px-3 text-left font-bold w-5/12 border-r border-slate-300">
                വിവരണം (Field Name / Description)
              </th>
              <th className="py-2 px-3 text-left font-bold">
                രേഖപ്പെടുത്തിയ വിവരം (Filled Entry / Particulars)
              </th>
            </tr>
          </thead>
          <tbody>
            {form.fields.map((field, index) => {
              const val = entry.values?.[field.key];
              const displayVal =
                val === undefined || val === null || val === ""
                  ? "—"
                  : typeof val === "boolean"
                  ? val
                    ? "ഉണ്ട് (Yes)"
                    : "ഇല്ല (No)"
                  : String(val);

              return (
                <tr
                  key={field.id || index}
                  className={`border-b border-slate-200 ${index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}`}
                >
                  <td className="py-2 px-2.5 text-center font-mono text-slate-600 border-r border-slate-300 font-semibold">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3 text-slate-800 font-medium border-r border-slate-300 align-top">
                    <div className="font-semibold text-slate-900">{field.labelMl || field.label}</div>
                    {field.labelEn && field.labelEn !== field.labelMl && (
                      <div className="text-[10px] text-slate-600 font-normal">{field.labelEn}</div>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-bold align-top leading-relaxed whitespace-pre-wrap">
                    {displayVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Declaration & Undertaking */}
      <div className="border border-slate-300 rounded-md p-3.5 bg-slate-50/80 mb-8 text-[11px] leading-relaxed">
        <div className="font-bold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          സാക്ഷ്യപത്രം (DECLARATION & UNDERTAKING)
        </div>
        <p className="text-slate-700 text-justify">
          മുകളിൽ പ്രസ്താവിച്ചിരിക്കുന്ന എല്ലാ വിവരങ്ങളും എൻ്റെ പൂർണ്ണ അറിവിലും വിശ്വാസത്തിലും സത്യവും കൃത്യവുമാണെന്ന് ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു. ഈ അപേക്ഷയോടൊപ്പം സമർപ്പിച്ചിട്ടുള്ള പ്ലാനുകളും അനുബന്ധ രേഖകളും നിർദ്ദിഷ്ട നിയമ ചട്ടങ്ങൾക്ക് അനുസൃതമായി തയ്യാറാക്കിയതാണ്.
        </p>
        <p className="text-slate-600 text-[10px] mt-1 text-justify">
          (I hereby solemnly affirm that the statements made and information furnished above are true and complete. All documents, drawings, and plans submitted herewith comply with the applicable Kerala Building and Revenue rules.)
        </p>
      </div>

      {/* Signatures & Seal Section */}
      <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-300 text-xs">
        <div>
          <div className="text-slate-600 text-[11px]">സ്ഥലം (Place): <span className="font-semibold text-slate-800">തൃശൂർ / കേരളം</span></div>
          <div className="text-slate-600 text-[11px] mt-1">തീയതി (Date): <span className="font-semibold text-slate-800">{currentDate}</span></div>
          <div className="mt-8 pt-1 border-t border-dashed border-slate-400 text-[10px] text-slate-500 text-center">
            ഓഫീസ് അക്‌നോളഡ്ജ്‌മെന്റ്
          </div>
        </div>

        <div className="text-center flex flex-col items-center justify-end">
          <div className="w-24 h-16 border border-dashed border-slate-400 rounded flex flex-col items-center justify-center p-1 text-[9px] text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">എഞ്ചിനീയർ സീൽ</span>
            <span>ENGINEER SEAL</span>
          </div>
          <div className="pt-1 border-t border-dashed border-slate-400 w-full text-[10px] font-semibold text-slate-800">
            ലൈസൻസി എഞ്ചിനീയറുടെ ഒപ്പ്
          </div>
        </div>

        <div className="text-right flex flex-col items-end justify-end">
          <div className="h-16 flex items-end justify-end pb-1 font-serif italic text-slate-800 text-sm">
            {entry.applicantName}
          </div>
          <div className="pt-1 border-t border-dashed border-slate-400 w-full text-[10px] font-semibold text-slate-800 text-center">
            അപേക്ഷകന്റെ ഒപ്പ് / Applicant Signature
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="absolute bottom-4 left-18 right-18 text-center text-[9px] text-slate-400 border-t border-slate-200 pt-2">
        Generated & Processed by Vasthusilpy Engineering Architectural Consultancy System • Document ID: {entry.id}
      </div>
    </div>
  );
};
