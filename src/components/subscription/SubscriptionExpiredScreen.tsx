import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { VasthusilpyLogo } from "../common/VasthusilpyLogo";
import {
  UPI_ID,
  UPI_PAYEE_NAME,
  UPI_PRICING_PLANS,
  DEFAULT_SUBSCRIPTION_FEE_INR,
  isValidUpiAmount,
  getUpiPaymentUrl,
  getUpiQrCodeUrl
} from "../../utils/subscriptionManager";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Sparkles,
  QrCode,
  Copy,
  Check,
  CreditCard,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  FolderLock,
  Layers,
  FileSpreadsheet,
  Calculator,
  Compass,
  Building2,
  LogOut,
  Phone,
  Mail,
  User
} from "lucide-react";

interface SubscriptionExpiredScreenProps {
  userEmail: string;
  userPhone?: string;
  userName?: string;
  subscriptionId?: string;
  isTrial?: boolean;
  onRenewSuccess?: () => void;
  onSignOut?: () => void;
}

export const SubscriptionExpiredScreen: React.FC<SubscriptionExpiredScreenProps> = ({
  userEmail,
  userPhone,
  userName,
  subscriptionId,
  isTrial = true,
  onRenewSuccess,
  onSignOut
}) => {
  const { submitSubscriptionRequest, signOutUser, subscriptionRequests } = useAuth();

  // Filter out the free trial plan for renewals
  const paidPlans = UPI_PRICING_PLANS.filter((p) => !p.isFree && p.amount > 0);

  const [selectedAmount, setSelectedAmount] = useState<number>(DEFAULT_SUBSCRIPTION_FEE_INR);
  const [customAmountInput, setCustomAmountInput] = useState<string>("");
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [upiRefId, setUpiRefId] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const effectiveAmount = isCustomAmount
    ? parseInt(customAmountInput, 10) || 0
    : selectedAmount;

  const activePlan = paidPlans.find((p) => p.amount === effectiveAmount);
  const planTitle = activePlan
    ? activePlan.label
    : `Vasthusilpy ₹${effectiveAmount} Pro Pass`;

  const upiDeepLink = getUpiPaymentUrl(
    effectiveAmount,
    `Vasthusilpy Renewal - ${userPhone || userEmail}`
  );
  const upiQrCode = getUpiQrCodeUrl(
    effectiveAmount,
    `Vasthusilpy Renewal - ${userPhone || userEmail}`
  );

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isValidUpiAmount(effectiveAmount) || effectiveAmount <= 0) {
      setErrorMsg("ദയവായി ₹200 ന്റെ ഗുണിതങ്ങൾ (₹200, ₹400, ₹600, ₹1,200, ₹2,400) ആയ ഒരു പ്ലാൻ തിരഞ്ഞെടുക്കുക.");
      return;
    }

    if (!upiRefId.trim() || upiRefId.trim().length < 6) {
      setErrorMsg("ദയവായി പേയ്‌മെന്റ് ചെയ്തതിന്റെ 12-അക്ക UPI Reference ID / UTR Number നൽകുക.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await submitSubscriptionRequest({
        fullName: userName || userEmail.split("@")[0],
        email: userEmail,
        phone: userPhone || "9847123456",
        upiRefId: upiRefId.trim(),
        amountPaid: effectiveAmount,
        planName: planTitle,
        notes: `Subscription Renewal (${isTrial ? "Post-Trial" : "Expired Plan"} Renewal) - Req ID: ${subscriptionId || "N/A"}`
      });

      setSuccessMsg(
        `സബ്‌സ്ക്രിപ്ഷൻ പുതുക്കൽ അഭ്യർത്ഥന വിജയകരമായി സമർപ്പിച്ചു (Request ID: ${res.id}). അഡ്മിൻ പരിശോധിച്ചു ഉടൻ അംഗീകരിക്കുന്നതാണ്.`
      );

      if (onRenewSuccess) {
        setTimeout(() => {
          onRenewSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "സബ്‌സ്ക്രിപ്ഷൻ പുതുക്കുന്നതിൽ പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOutClick = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      signOutUser();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <VasthusilpyLogo size="md" />
          <div>
            <h1 className="text-lg font-black text-amber-400 tracking-wide font-mono">
              VASTHUSILPY
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              ENGINEERING & VASTHU SUITE
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOutClick}
          className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>ലോഗൗട്ട് (Sign Out)</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 flex flex-col gap-6">
        {/* Banner: Trial/Subscription Expired */}
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isTrial ? "സൗജന്യ ട്രയൽ കാലാവധി കഴിഞ്ഞു (FREE TRIAL EXPIRED)" : "സബ്‌സ്ക്രിപ്ഷൻ കാലാവധി കഴിഞ്ഞു (SUBSCRIPTION EXPIRED)"}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  തുടർന്നും തടസ്സമില്ലാതെ ഉപയോഗിക്കാൻ സബ്‌സ്ക്രിപ്ഷൻ തിരഞ്ഞെടുക്കുക
                </h2>
                <p className="text-sm sm:text-base text-slate-300 mt-1">
                  നിങ്ങളുടെ അക്കൗണ്ട് (<span className="text-amber-300 font-mono font-semibold">{userEmail}</span>{userPhone ? ` / ${userPhone}` : ""}) സുരക്ഷിതമാണ്.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 100% Zero Data Loss Reassurance Box */}
        <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 text-emerald-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold text-emerald-300 flex items-center gap-2">
                  <span>നിങ്ങളുടെ മുൻപത്തെ ഒരു പ്രോജക്റ്റുകളും നഷ്ടപ്പെടില്ല!</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                  100% DATA PRESERVED & SAFE
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                നിങ്ങൾ മുൻപ് സേവ് ചെയ്തിട്ടുള്ള <strong>എല്ലാ വാസ്തു ശാസ്ത്ര ഗണിതങ്ങൾ, എസ്റ്റിമേറ്റ് ഷീറ്റുകൾ, BOQ വിവരങ്ങൾ, സിവിൽ മേസൺറി കണക്കുകൾ, സർവ്വേ ലാൻഡ് ഏരിയകൾ, ഇൻവോയ്‌സുകൾ, ക്ലയന്റ് വിവരങ്ങൾ</strong> എന്നിവ പൂർണ്ണമായും സുരക്ഷിതമായി സൂക്ഷിച്ചിട്ടുണ്ട്. സബ്‌സ്ക്രിപ്ഷൻ ആക്റ്റീവ് ആകുന്നതോടെ നിങ്ങളുടെ എല്ലാ മുൻകാല പ്രോജക്ടുകളും പഴയതുപോലെ ലഭ്യമാകും.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-900/80 border border-emerald-900/60 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-300">
                  <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>വാസ്തു കണക്കുകൾ സുരക്ഷിതം</span>
                </div>
                <div className="bg-slate-900/80 border border-emerald-900/60 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>എസ്റ്റിമേറ്റുകൾ & BOQ സുരക്ഷിതം</span>
                </div>
                <div className="bg-slate-900/80 border border-emerald-900/60 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-300">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>KPBR & സർവ്വേ ഡാറ്റ സുരക്ഷിതം</span>
                </div>
                <div className="bg-slate-900/80 border border-emerald-900/60 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-300">
                  <FolderLock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>ക്ലയന്റ് & ഇൻവോയ്സ് വിവരങ്ങൾ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plan Chooser & UPI Payment Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Plan Selector */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>1. സബ്‌സ്ക്രിപ്ഷൻ പ്ലാൻ തിരഞ്ഞെടുക്കുക (Choose Subscription)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                സൗജന്യ ട്രയൽ ഒരു തവണ മാത്രമേ ലഭ്യമാകൂ. ₹200 ന്റെ ഗുണിതങ്ങളിലുള്ള പ്ലാനുകൾ തിരഞ്ഞെടുക്കാം:
              </p>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {paidPlans.map((plan) => {
                const isSelected = !isCustomAmount && selectedAmount === plan.amount;
                return (
                  <button
                    key={plan.amount}
                    type="button"
                    onClick={() => {
                      setIsCustomAmount(false);
                      setSelectedAmount(plan.amount);
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 text-white"
                        : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-mono font-black uppercase">
                        POPULAR
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{plan.labelMl}</span>
                      <span className="text-base font-black font-mono text-amber-400">
                        ₹{plan.amount}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? "text-amber-400" : "text-slate-600"}`} />
                      <span>{plan.durationLabel}</span>
                    </div>
                  </button>
                );
              })}

              {/* Custom Multiples of 200 */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomAmount(true);
                  if (!customAmountInput) setCustomAmountInput("600");
                }}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isCustomAmount
                    ? "bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30 text-white"
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">കസ്റ്റം തുക (Custom Amount)</span>
                  <span className="text-xs font-mono text-amber-400">Multiples of ₹200</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  നിങ്ങൾക്കിഷ്ടമുള്ള തുക (₹800, ₹1000, ₹1200...)
                </div>
              </button>
            </div>

            {/* Custom Amount Input field if active */}
            {isCustomAmount && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <label className="text-xs font-mono text-slate-300">
                  കസ്റ്റം തുക നൽകുക (₹200 ന്റെ ഗുണിതങ്ങൾ):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-amber-400 font-mono font-bold">₹</span>
                  <input
                    type="number"
                    step="200"
                    min="200"
                    placeholder="e.g. 800"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                {effectiveAmount > 0 && effectiveAmount % 200 !== 0 && (
                  <p className="text-[11px] text-red-400 font-mono">
                    തുക ₹200 ന്റെ ഗുണിതമായിരിക്കണം (200, 400, 600, 800, 1000...).
                  </p>
                )}
              </div>
            )}

            {/* Renewal Submission Form */}
            <form onSubmit={handleRenewalSubmit} className="space-y-4 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-bold font-mono text-slate-300 mb-1">
                  2. UPI Transaction Reference / UTR Number (12 അക്ക നമ്പർ):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 421890123456"
                  value={upiRefId}
                  onChange={(e) => setUpiRefId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  GPay / PhonePe / Paytm / BHIM ആപ്പിലെ 12 അക്ക UTR / UPI Reference ID ഇവിടെ നൽകുക.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>സമർപ്പിക്കുന്നു...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>സബ്‌സ്ക്രിപ്ഷൻ പുതുക്കി തുടരുക (Renew & Continue)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live QR Code & Payment Info */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="text-center">
              <span className="text-xs font-mono text-amber-400 font-bold">
                ഔദ്യോഗിക UPI പേയ്‌മെന്റ് (Official Payment)
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {UPI_PAYEE_NAME}
              </h4>
            </div>

            {/* QR Box */}
            <div className="bg-white p-4 rounded-2xl mx-auto w-56 h-56 flex flex-col items-center justify-center shadow-inner relative border-4 border-amber-400/80">
              <img
                src={upiQrCode}
                alt="Vasthusilpy UPI QR"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="text-center space-y-1">
              <div className="text-2xl font-black font-mono text-amber-400">
                ₹{effectiveAmount}
              </div>
              <p className="text-xs text-slate-400">
                തിരഞ്ഞെടുത്ത പ്ലാൻ: <span className="text-white font-semibold">{planTitle}</span>
              </p>
            </div>

            {/* Copy UPI Button */}
            <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono">
              <div className="truncate text-slate-300">
                <span className="text-slate-500">UPI ID: </span>
                <span className="font-bold text-amber-300">{UPI_ID}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Deep Link Button for mobile */}
            {upiDeepLink && (
              <a
                href={upiDeepLink}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                <span>UPI ആപ്പ് വഴി അടയ്ക്കുക (GPay / PhonePe)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>സഹായത്തിന് വിളിക്കുക:</span>
              </div>
              <p className="font-mono text-amber-300 font-bold">
                WhatsApp / Call: +91 7012383137 / 9447890123
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center text-xs text-slate-500 font-mono pt-6 border-t border-slate-900 mt-6">
        VASTHUSILPY ENGINEERING & VASTHU SHASTRA SUITE • KERALASSERY, PALAKKAD
      </footer>
    </div>
  );
};
