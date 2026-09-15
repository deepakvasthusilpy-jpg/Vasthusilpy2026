import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserCheck, UserPlus, Trash2, X, ShieldCheck, Mail, CheckCircle2, AlertCircle, Info, Calendar } from "lucide-react";

interface ManageUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageUsersModal: React.FC<ManageUsersModalProps> = ({ isOpen, onClose }) => {
  const {
    authorizedEmails,
    addAuthorizedEmail,
    removeAuthorizedEmail
  } = useAuth();

  // Email form states
  const [newEmail, setNewEmail] = useState("");
  const [emailNotes, setEmailNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newEmail || !newEmail.includes("@")) {
      setErrorMsg("ദയവായി ഒരു ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addAuthorizedEmail(newEmail, emailNotes);
      setSuccessMsg(`'${newEmail.toLowerCase().trim()}' ഇമെയിലിന് വിജയകരമായി പ്രവേശനാനുമതി നൽകി.`);
      setNewEmail("");
      setEmailNotes("");
    } catch (err: any) {
      setErrorMsg(err.message || "ഇമെയിൽ ചേർക്കുന്നതിൽ പിശക് സംഭവിച്ചു.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    if (!window.confirm(`'${emailToRemove}' ഈ ഇമെയിലിന്റെ പ്രവേശനാനുമതി ഒഴിവാക്കണമെന്ന് ഉറപ്പാണോ?`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await removeAuthorizedEmail(emailToRemove);
      setSuccessMsg(`'${emailToRemove}' പ്രവേശനാനുമതി ലിസ്റ്റിൽ നിന്ന് നീക്കം ചെയ്തു.`);
    } catch (err: any) {
      setErrorMsg(err.message || "ഇമെയിൽ നീക്കം ചെയ്യുന്നതിൽ പിശക് സംഭവിച്ചു.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span>അംഗീകൃത ഉപയോക്താക്കളെ മാനേജ് ചെയ്യുക</span>
                <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 font-mono px-2 py-0.5 rounded font-bold uppercase">ADMIN PANEL</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                MANAGE AUTHORIZED EMAIL WHITELIST
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* EMAILS MANAGEMENT */}
          <div className="space-y-6">
            {/* Form to Add New Authorized Email */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" />
                <span>പുതിയ ഇമെയിൽ അനുമതി നൽകുക (Authorize New Email)</span>
              </h4>

              <form onSubmit={handleAddEmail} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      Notes / Name (ഓപ്ഷണൽ)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Site Engineer / Client"
                      value={emailNotes}
                      onChange={(e) => setEmailNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>AUTHORIZE EMAIL</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Primary Admins Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Primary Administrators (സ്ഥിരമായ അഡ്മിനുകൾ)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs text-emerald-400 font-bold">
                      deepak.vasthusilpy@gmail.com
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      System Founder & Administrator
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                    PERMANENT
                  </span>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs text-emerald-400 font-bold">
                      dibindeepak1@gmail.com
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      System Founder & Administrator
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                    PERMANENT
                  </span>
                </div>
              </div>
            </div>

            {/* Authorized Email List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>അനുമതി നൽകപ്പെട്ട മറ്റ് ഇമെയിലുകൾ ({authorizedEmails.length})</span>
                </h4>
              </div>

              {authorizedEmails.length === 0 ? (
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 font-mono text-xs space-y-1">
                  <Info className="w-5 h-5 mx-auto text-slate-600 mb-1" />
                  <div>നിലവിൽ മറ്റ് ഉപഭോക്താക്കൾക്ക് ഇമെയിൽ അനുമതി നൽകിയിട്ടില്ല.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {authorizedEmails.map((record) => (
                    <div
                      key={record.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-200 truncate">
                            {record.email}
                          </span>
                          {record.notes && (
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                              {record.notes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                          <span>Added by: {record.addedBy}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-600" />
                            {new Date(record.addedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveEmail(record.email)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/50 p-2 rounded-lg border border-transparent hover:border-red-900 transition-colors cursor-pointer shrink-0"
                        title="Revoke Authorization"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>FIRESTORE BACKED ACCESS CONTROL</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
