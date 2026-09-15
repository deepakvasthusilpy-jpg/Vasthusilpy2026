import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { performFullWebDataSync, getLastWebDataSyncTime, formatSyncTimestamp } from "../../utils/webDataSyncManager";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Cloud,
  CheckCircle2,
  X,
  KeyRound,
  RefreshCw,
  AlertCircle,
  Database,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    user,
    emailUser,
    isPrimaryAdmin,
    lastAdminTotpVerifiedAt,
    adminTotpDaysRemaining,
    isAdminTotpDue,
    verifyAdminTotpNow,
    updateUserProfile
  } = useAuth();

  const [emailInput, setEmailInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [totpInput, setTotpInput] = useState("");

  const [saving, setSaving] = useState(false);
  const [syncingWebData, setSyncingWebData] = useState(false);
  const [verifyingTotp, setVerifyingTotp] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lastSyncDisplay, setLastSyncDisplay] = useState<string | null>(null);

  // Sync state with current user
  useEffect(() => {
    if (isOpen) {
      const activeEmail = emailUser?.email || user?.email || "deepak.vasthusilpy@gmail.com";
      setEmailInput(activeEmail);
      setDisplayName(emailUser?.displayName || user?.displayName || (activeEmail ? activeEmail.split("@")[0] : ""));
      setPhoneNumber(emailUser?.phone || (activeEmail.includes("deepak") ? "9567627277" : ""));
      setProfession(emailUser?.profession || "Vasthu Consultant & Civil Engineer");
      setTotpInput("");
      setStatusMessage(null);
      setLastSyncDisplay(formatSyncTimestamp(getLastWebDataSyncTime()));
    }
  }, [isOpen, emailUser, user]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setStatusMessage({
        type: "error",
        text: "സാധുവായ ഒരു ഇമെയിൽ വിലാസം നൽകുക (Please provide a valid email address)."
      });
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    if (cleanPhone && digitsOnly.length < 10) {
      setStatusMessage({
        type: "error",
        text: "സാധുവായ 10-അക്ക മൊബൈൽ നമ്പർ നൽകുക (Please provide a valid 10-digit mobile number)."
      });
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      await updateUserProfile({
        email: cleanEmail,
        displayName: displayName.trim() || cleanEmail.split("@")[0],
        phone: cleanPhone,
        profession: profession.trim()
      });

      // Run web data sync in parallel to lock persistence
      const syncResult = await performFullWebDataSync();
      setLastSyncDisplay(formatSyncTimestamp(syncResult.syncedAt));

      setStatusMessage({
        type: "success",
        text: `ഇമെയിൽ (${cleanEmail}), മൊബൈൽ നമ്പർ (${cleanPhone || "None"}), പ്രൊഫൈൽ വിവരങ്ങൾ എന്നിവ സെർവറിലും ക്ലൗഡിലും വിജയകരമായി സമന്വയിപ്പിച്ചു (Synced with Cloud & Server).`
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update profile. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManualFullWebSync = async () => {
    setSyncingWebData(true);
    setStatusMessage(null);
    try {
      const res = await performFullWebDataSync();
      setLastSyncDisplay(formatSyncTimestamp(res.syncedAt));
      setStatusMessage({
        type: "success",
        text: `വെബ് ഡാറ്റാ സമന്വയം പൂർത്തിയായി (Web Data Sync Succeeded). പ്രോജക്റ്റുകൾ: ${res.counts.projects}, ഇൻവോയ്സുകൾ: ${res.counts.invoices}, ഫയലുകൾ: ${res.counts.cadFiles}, യൂസർ പ്രൊഫൈലുകൾ: ${res.counts.userProfiles || 1}.`
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Web Data Sync Failed: ${err?.message || "Unknown error"}`
      });
    } finally {
      setSyncingWebData(false);
    }
  };

  const handleVerifyTotp = async () => {
    const cleanTotp = totpInput.trim().replace(/\D/g, "");
    if (cleanTotp.length !== 6) {
      setStatusMessage({
        type: "error",
        text: "സാധുവായ 6-അക്ക TOTP കോഡ് നൽകുക (Please enter 6-digit TOTP code)."
      });
      return;
    }

    setVerifyingTotp(true);
    setStatusMessage(null);

    try {
      const ok = await verifyAdminTotpNow(cleanTotp);
      if (ok) {
        setTotpInput("");
        setStatusMessage({
          type: "success",
          text: "അഡ്മിൻ TOTP വിജയകരമായി വെരിഫൈ ചെയ്തു! അടുത്ത 30 ദിവസത്തേക്ക് സുരക്ഷിതമായി ലോഗിൻ നിലനിർത്തും (Admin TOTP verified for 30 days)."
        });
      } else {
        setStatusMessage({
          type: "error",
          text: "തെറ്റായ TOTP കോഡ്. Authenticator ആപ്പ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക (Invalid TOTP code)."
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to verify TOTP code."
      });
    } finally {
      setVerifyingTotp(false);
    }
  };

  const lastVerifiedFormatted = lastAdminTotpVerifiedAt
    ? new Date(lastAdminTotpVerifiedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Never";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-gradient-to-b from-[#1c0528] to-[#2c093d] border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-white space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 border border-purple-400/40 flex items-center justify-center text-white shadow-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Profile & Web Data Sync</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono flex items-center gap-1">
                  <Cloud className="w-3 h-3 animate-pulse" />
                  <span>Cloud Active</span>
                </span>
              </h2>
              <p className="text-xs text-purple-200/70 font-mono">
                Email ID, Mobile Number & Web Data Synced Across All Devices
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 backdrop-blur-md transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-200 shadow-emerald-900/30 shadow-lg"
                : "bg-rose-950/70 border-rose-500/40 text-rose-200 shadow-rose-900/30 shadow-lg"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed font-mono">{statusMessage.text}</div>
          </div>
        )}

        {/* Sync Status Banner */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-white/60 text-[11px] block">Web Data Sync Status:</span>
              <span className="text-emerald-300 font-bold">{lastSyncDisplay || "Ready to sync"}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleManualFullWebSync}
            disabled={syncingWebData || saving}
            className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-400/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingWebData ? "animate-spin text-cyan-300" : ""}`} />
            <span>{syncingWebData ? "Syncing..." : "Sync Web Data Now"}</span>
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          
          {/* Email (Editable Synced Identifier) */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-purple-200/90 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Mail className="w-3.5 h-3.5 text-pink-400" />
                <span>Email Address (ലോഗിൻ ഇമെയിൽ ID)</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Auto-Synced Online
              </span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 font-mono focus:outline-none focus:border-pink-400 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                Active ID
              </span>
            </div>
            <p className="text-[10px] text-white/50 font-mono">
              Updates your authoritative login identity across Firestore, Server & Client Sessions.
            </p>
          </div>

          {/* Mobile Number (Editable Synced Identifier) */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-purple-200/90 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Phone className="w-3.5 h-3.5 text-pink-400" />
                <span>Mobile Number (മൊബൈൽ നമ്പർ ലോഗിൻ)</span>
              </span>
              <span className="text-[10px] text-cyan-300 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 10-Digit OTP / Password
              </span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 9567627277 or +91 9567627277"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 font-mono focus:outline-none focus:border-pink-400 transition"
              />
              {phoneNumber && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400/40 text-pink-300">
                  {phoneNumber.replace(/\D/g, "").slice(-10)}
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50 font-mono">
              Enables 10-digit mobile login and links subscription and CRM accounts.
            </p>
          </div>

          {/* Full Name / Display Name */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-purple-200/90 flex items-center gap-1.5 font-bold">
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span>Full Name / Display Name</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Deepak C"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 font-mono focus:outline-none focus:border-pink-400 transition"
            />
          </div>

          {/* Profession */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-purple-200/90 flex items-center gap-1.5 font-bold">
              <Briefcase className="w-3.5 h-3.5 text-pink-400" />
              <span>Profession / Designation</span>
            </label>
            <input
              type="text"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g. Vasthu Architect & Consulting Engineer"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 font-mono focus:outline-none focus:border-pink-400 transition"
            />
          </div>

          {/* Save Profile Button */}
          <button
            type="submit"
            disabled={saving || syncingWebData}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:from-pink-600 hover:to-indigo-700 text-white font-bold text-xs font-mono tracking-wider shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Syncing Email & Mobile Number Across Devices...</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                <span>Save & Sync Profile Online (എല്ലായിടത്തും സമന്വയിപ്പിക്കുക)</span>
              </>
            )}
          </button>
        </form>

        {/* 30-Day Recurring Admin TOTP Security Section */}
        {isPrimaryAdmin && (
          <div className="pt-4 border-t border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>30-Day Recurring Admin TOTP</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isAdminTotpDue
                    ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                }`}
              >
                {isAdminTotpDue
                  ? "Re-verification Due"
                  : `${adminTotpDaysRemaining} Days Remaining`}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/15 space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] text-purple-200/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-pink-300" />
                  <span>Last Verified:</span>
                </span>
                <span className="text-white">{lastVerifiedFormatted}</span>
              </div>

              <div className="text-[11px] text-purple-200/60 leading-relaxed">
                30 ദിവസത്തെ സുരക്ഷാ ഇടവേളയിൽ അഡ്മിൻ TOTP പരിശോധന ആവർത്തിക്കുന്നു (30-day recurring Admin TOTP required for every login).
              </div>

              {/* In-place verify input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={totpInput}
                    onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit TOTP"
                    className="w-full bg-white/10 border border-white/25 rounded-xl px-3 py-1.5 text-xs font-mono text-center tracking-widest text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-white/50 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyTotp}
                  disabled={verifyingTotp || totpInput.length !== 6}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {verifyingTotp ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Verify Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
