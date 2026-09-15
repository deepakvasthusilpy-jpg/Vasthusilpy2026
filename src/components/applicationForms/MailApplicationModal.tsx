import React, { useState } from "react";
import { Mail, X, Send, CheckCircle2, AlertCircle, Paperclip, ExternalLink, Loader2 } from "lucide-react";
import { ApplicationFormTemplate, FormEntryRecord } from "../../types";

interface MailApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: ApplicationFormTemplate;
  entry: FormEntryRecord;
  onSuccess?: (mailedEmail: string) => void;
  getPdfBase64?: () => Promise<string | null>;
}

export const MailApplicationModal: React.FC<MailApplicationModalProps> = ({
  isOpen,
  onClose,
  form,
  entry,
  onSuccess,
  getPdfBase64
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>(
    entry.email || entry.values?.email || "deepak.vasthusilpy@gmail.com"
  );
  const [subject, setSubject] = useState<string>(
    `[${form.name}] - ${entry.applicantName || "അപേക്ഷ"} (Ref: ${entry.id})`
  );
  const [message, setMessage] = useState<string>(
    `പ്രിയപ്പെട്ട സാർ / മാഡം,\n\n${form.nameMl || form.name} സംബന്ധിച്ച പൂരിപ്പിച്ച അപേക്ഷാ വിവരങ്ങൾ ഇതോടൊപ്പം അയക്കുന്നു.\nഅപേക്ഷകൻ: ${entry.applicantName}\nഫോൺ: ${entry.phone || "—"}\nവില്ലേജ് / വാർഡ്: ${entry.villageOrPanchayat || "—"}\n\nദയവായി പരിശോധിച്ചു തുടർനടപടികൾ സ്വീകരിക്കുമല്ലോ.\n\nവിശ്വസ്തതയോടെ,\nവാസ്തുശില്പി കൺസൾട്ടൻസി\n(Vasthusilpy Engineering)`
  );
  const [attachPdf, setAttachPdf] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !recipientEmail.includes("@")) {
      setSendResult({ success: false, message: "സാധുവായ ഒരു ഇമെയിൽ വിലാസം നൽകുക (Please provide a valid email)." });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    let pdfBase64: string | null = null;
    if (attachPdf && getPdfBase64) {
      try {
        pdfBase64 = await getPdfBase64();
      } catch (err) {
        console.warn("Could not generate PDF base64:", err);
      }
    }

    try {
      const response = await fetch("/api/application-forms/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          subject: subject.trim(),
          formName: form.name,
          formNameMl: form.nameMl,
          applicantName: entry.applicantName,
          customMessage: message,
          pdfBase64: pdfBase64 || undefined,
          entryValues: entry.values,
          fieldsSchema: form.fields,
          refId: entry.id
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSendResult({
          success: true,
          message: data.message || `'${recipientEmail}' എന്ന വിലാസത്തിലേക്ക് അപേക്ഷ വിജയകരമായി അയച്ചു.`
        });
        if (onSuccess) {
          onSuccess(recipientEmail.trim());
        }
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        throw new Error(data.error || "Failed to dispatch email via server.");
      }
    } catch (err: any) {
      console.error("Error sending application email:", err);
      setSendResult({
        success: false,
        message: err.message || "സെർവർ വഴി ഇമെയിൽ അയക്കാൻ കഴിഞ്ഞില്ല. മെയിൽ ക്ലയന്റ് ഉപയോഗിച്ച് അയക്കാവുന്നതാണ്."
      });
    } finally {
      setIsSending(false);
    }
  };

  const openInDefaultMailClient = () => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(
      `${message}\n\n--- അപേക്ഷാ സംഗ്രഹം ---\nഫോം: ${form.name}\nറഫറൻസ്: ${entry.id}\nഅപേക്ഷകൻ: ${entry.applicantName}\nമൊബൈൽ: ${entry.phone || "—"}`
    );
    window.location.href = `mailto:${recipientEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-indigo-950 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ഇമെയിൽ അയക്കുക (Mail Application)</h2>
              <p className="text-xs text-slate-400 font-mono">
                {entry.applicantName} • {form.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {sendResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                sendResult.success
                  ? "bg-emerald-950/60 border-emerald-600 text-emerald-200"
                  : "bg-rose-950/60 border-rose-600 text-rose-200"
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span>{sendResult.message}</span>
                {!sendResult.success && (
                  <button
                    type="button"
                    onClick={openInDefaultMailClient}
                    className="block mt-2 text-indigo-300 hover:text-indigo-200 underline font-semibold flex items-center gap-1"
                  >
                    മെയിൽ ആപ്പ് / ജിമെയിൽ വഴി നേരിട്ട് അയക്കുക (Open in Email Client) <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              സ്വീകർത്താവിന്റെ ഇമെയിൽ വിലാസം (Recipient Email Address) *
            </label>
            <input
              type="email"
              required
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@gmail.com, office@panchayat.in"
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            {entry.email && (
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                <span>സൂചന:</span>
                <button
                  type="button"
                  onClick={() => setRecipientEmail(entry.email || "")}
                  className="text-indigo-400 hover:underline"
                >
                  അപേക്ഷകന്റെ ഇമെയിൽ ഉപയോഗിക്കുക ({entry.email})
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              വിഷയം (Subject Line)
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              സന്ദേശം / കുറിപ്പ് (Email Body Message)
            </label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-none"
            />
          </div>

          <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Paperclip className="w-4 h-4 text-indigo-400" />
              <span>A4 PDF രേഖ അറ്റാച്ച് ചെയ്യുക (Attach Filled A4 PDF)</span>
            </div>
            <input
              type="checkbox"
              checked={attachPdf}
              onChange={(e) => setAttachPdf(e.target.checked)}
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={openInDefaultMailClient}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition py-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>External Mail Client</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>അയക്കുന്നു...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>ഇമെയിൽ അയക്കുക (Send Mail)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
