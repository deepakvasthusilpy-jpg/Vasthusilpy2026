import React, { useState, useEffect } from "react";
import { ConstructionAgreement } from "../../types";
import { ConstructionStorageManager, formatIndianCurrency } from "../../utils/constructionStorageManager";
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  Search,
  Building2,
  User,
  Calendar,
  MapPin,
  Layers,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Download,
  Printer,
  Sparkles,
  Phone,
  Clock,
  HardHat,
  Lock,
  Unlock,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  Eye
} from "lucide-react";
import { shareAgreementOnWhatsApp } from "../../utils/constructionShareManager";
import QRCode from "qrcode";

interface AgreementVerificationModalProps {
  initialToken?: string;
  onClose?: () => void;
  isEmbedded?: boolean;
  onReset?: () => void;
}

export const AgreementVerificationModal: React.FC<AgreementVerificationModalProps> = ({
  initialToken = "",
  onClose,
  isEmbedded = false,
  onReset
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [agreement, setAgreement] = useState<ConstructionAgreement | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeQrDataUrl, setActiveQrDataUrl] = useState<string>("");
  const [recentAgreements, setRecentAgreements] = useState<ConstructionAgreement[]>([]);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Load existing agreements list for quick reference & zero-login testing
  useEffect(() => {
    const list = ConstructionStorageManager.getAllAgreements();
    setRecentAgreements(list);
  }, []);

  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      verifyToken(initialToken);
    }
  }, [initialToken]);

  // Generate QR code whenever agreement is loaded
  useEffect(() => {
    let isMounted = true;
    if (agreement) {
      const publicUrl = ConstructionStorageManager.getPublicVerificationUrl(agreement);
      QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" }
      })
        .then((url) => {
          if (isMounted) setActiveQrDataUrl(url);
        })
        .catch(() => {
          if (isMounted && agreement.qrCodeDataUrl) {
            setActiveQrDataUrl(agreement.qrCodeDataUrl);
          }
        });
    } else {
      setActiveQrDataUrl("");
    }
    return () => {
      isMounted = false;
    };
  }, [agreement]);

  const verifyToken = async (tokenToTest: string) => {
    const trimmed = tokenToTest.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setHasSearched(true);
    setResetMessage(null);

    try {
      // 1. Check local & asynchronous Firestore cloud storage
      const found = await ConstructionStorageManager.getAgreementByIdAsync(trimmed);
      setAgreement(found || null);
    } catch (err) {
      console.warn("Verification lookup failed", err);
      // Fallback to local synchronous check
      const local = ConstructionStorageManager.getAgreementById(trimmed);
      setAgreement(local || null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(tokenInput);
  };

  const handleResetTab = () => {
    setTokenInput("");
    setAgreement(null);
    setHasSearched(false);
    setIsLoading(false);
    setActiveQrDataUrl("");
    setCopiedLink(false);
    setCopiedToken(false);
    setResetMessage("Verification workspace reset. Ready for new QR code verification.");
    setTimeout(() => setResetMessage(null), 3500);
    onReset?.();
  };

  const handleOpenPublicZeroLoginUrl = () => {
    if (!agreement) return;
    const publicUrl = ConstructionStorageManager.getPublicVerificationUrl(agreement);
    window.open(publicUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyPublicUrl = () => {
    if (!agreement) return;
    const publicUrl = ConstructionStorageManager.getPublicVerificationUrl(agreement);
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyToken = () => {
    if (!agreement) return;
    navigator.clipboard.writeText(agreement.verificationToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!agreement) return;
    shareAgreementOnWhatsApp(agreement);
  };

  const handleDownloadQr = () => {
    if (!activeQrDataUrl || !agreement) return;
    const link = document.createElement("a");
    link.href = activeQrDataUrl;
    link.download = `QR_VERIFY_${agreement.agreementNo}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const contentMarkup = (
    <div className={`w-full text-white space-y-6 ${isEmbedded ? "" : "max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl relative"}`}>
      {/* Top Header with Reset Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 shadow-lg shadow-emerald-950/60 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight font-sans">
                ക്യുആർ കോഡ് ആധികാരികതാ പരിശോധന
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                <Unlock className="w-3 h-3 text-emerald-400" />
                <span>ZERO-LOGIN ACCESS</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              PUBLIC QR VERIFICATION PORTAL — SCAN & VERIFY ANY DOCUMENT WITHOUT LOGIN
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetTab}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2 shadow-sm"
            title="Reset verification search & clear inputs (പുനഃസജ്ജമാക്കുക)"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>റീസെറ്റ് (Reset Tab)</span>
          </button>

          {!isEmbedded && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Close modal"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Zero-Login Guarantee Callout Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-bold font-sans text-emerald-300 flex items-center gap-1.5">
              <span>ലോഗിൻ ഇല്ലാതെ ആധികാരികതാ പരിശോധന (Zero-Login Public Verification)</span>
            </div>
            <p className="text-[11.5px] text-slate-300">
              ഈ ക്യുആർ കോഡ് സ്കാൻ ചെയ്തോ ലിങ്ക് തുറന്നോ ക്ലയന്റുകൾക്കും ബാങ്കുകൾക്കും എൻജിനീയർമാർക്കും <strong className="text-white font-semibold">ലോഗിൻ ഇല്ലാതെ തന്നെ</strong> ആധികാരിക കരാർ പരിശോധിക്കാം.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 whitespace-nowrap">
            NO PASSWORD REQUIRED
          </span>
        </div>
      </div>

      {/* Reset Feedback Notification */}
      {resetMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="space-y-2">
        <label className="block text-xs font-mono font-bold text-slate-300">
          കരാർ നമ്പർ അല്ലെങ്കിൽ ക്യുആർ ടോക്കൺ നൽകുക (ENTER AGREEMENT NO / QR TOKEN):
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. CW-2026-00001, VST-CW-..., or paste full verification link"
              className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isLoading || !tokenInput.trim()}
              className="flex-1 sm:flex-initial px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>പരിശോധിക്കുക (Verify)</span>
            </button>

            <button
              type="button"
              onClick={handleResetTab}
              className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
              title="Clear input and reset"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ക്ലിയർ</span>
            </button>
          </div>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-2xl text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <div className="text-xs font-mono text-slate-300">
            ഡിജിറ്റൽ സിഗ്നേച്ചറും ക്ലൗഡ് സ്റ്റോറേജും പരിശോധിക്കുന്നു (Verifying Document Signature)...
          </div>
        </div>
      )}

      {/* Verification Results */}
      {!isLoading && hasSearched && (
        <div>
          {agreement && agreement.status !== "ARCHIVED" && agreement.status !== "CANCELLED" ? (
            <div className="space-y-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
              {/* Authenticity Status Header */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-emerald-400 font-bold text-sm sm:text-base font-sans">
                        സാധുതയുള്ള നിർമ്മാണ കരാർ (OFFICIALLY VERIFIED AGREEMENT)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/50">
                        {agreement.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-xs mt-0.5 font-sans">
                      This construction contract is verified authentic and officially registered with Vasthusilpy Architectural Consultants.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                    DIGITALLY SIGNED
                  </span>
                </div>
              </div>

              {/* PRIMARY ZERO-LOGIN ACTIONS BAR */}
              <div className="p-4 bg-slate-800/80 border border-emerald-500/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span>പബ്ലിക് ആക്സസ് ആക്ഷനുകൾ (Zero-Login Public Access Actions):</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    DIRECT CLIENT VIEW
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Action 1: Open Public Zero-Login Portal */}
                  <button
                    type="button"
                    onClick={handleOpenPublicZeroLoginUrl}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-950"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-200" />
                    <span>ലോഗിൻ ഇല്ലാതെ തുറക്കുക</span>
                  </button>

                  {/* Action 2: Copy Public Zero-Login Link */}
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="w-full py-2.5 px-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold border border-slate-600/80 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">ലിങ്ക് കോപ്പി ചെയ്തു!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-cyan-400" />
                        <span>പബ്ലിക് ലിങ്ക് കോപ്പി ചെയ്യുക</span>
                      </>
                    )}
                  </button>

                  {/* Action 3: Share via WhatsApp */}
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-2.5 px-3 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold border border-emerald-500/60 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-emerald-300" />
                    <span>WhatsApp ഷെയർ</span>
                  </button>

                  {/* Action 4: Download QR Code Image */}
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="w-full py-2.5 px-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold border border-slate-600/80 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    <span>QR കോഡ് ഡൗൺലോഡ്</span>
                  </button>
                </div>
              </div>

              {/* Verified Details Grid & QR Code Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Columns (2/3): Document Metadata */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70">
                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>കരാർ നമ്പർ (Agreement No):</span>
                    </div>
                    <div className="font-mono font-bold text-white text-sm">{agreement.agreementNo}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>കരാർ തീയതി (Date of Agreement):</span>
                    </div>
                    <div className="font-mono font-bold text-white">{agreement.agreementDate}</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      <span>ഉടമസ്ഥൻ (First Party / Client):</span>
                    </div>
                    <div className="font-bold text-white">{agreement.client.clientName}</div>
                    <div className="text-slate-400 text-[11px]">{agreement.client.houseName}</div>
                    {agreement.client.phone && (
                      <div className="text-slate-400 text-[11px] font-mono">{agreement.client.phone}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <HardHat className="w-3.5 h-3.5 text-indigo-400" />
                      <span>കോൺട്രാക്ടർ (Second Party):</span>
                    </div>
                    <div className="font-bold text-white">{agreement.contractor.proprietorName}</div>
                    <div className="text-slate-400 text-[11px]">{agreement.contractor.companyName}</div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>സൈറ്റ് ലൊക്കേഷൻ (Site Address):</span>
                    </div>
                    <div className="text-slate-200">
                      {agreement.location.fullAddress || agreement.client.siteAddress || "Site address specified in contract"}
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-700/60">
                    <div className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-teal-400" />
                      <span>വിസ്തീർണ്ണവും കരാർ തുകയും (BUILT-UP AREA & VALUE):</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {agreement.totalBuiltUpArea.toLocaleString()} Sq.Ft | @ ₹{agreement.effectiveRatePerSqFt}/Sq.Ft | {formatIndianCurrency(agreement.finalContractAmount)}
                    </div>
                  </div>
                </div>

                {/* Right Column (1/3): High-Resolution QR Card */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/70 flex flex-col items-center justify-between text-center gap-3">
                  <div className="text-[11px] font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    <span>സ്കാൻ വെരിഫിക്കേഷൻ</span>
                  </div>

                  {activeQrDataUrl ? (
                    <div className="bg-white p-2.5 rounded-2xl shadow-lg border-2 border-emerald-400/40">
                      <img
                        src={activeQrDataUrl}
                        alt="Agreement Verification QR Code"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-slate-900 rounded-2xl border border-slate-700 flex items-center justify-center text-slate-500">
                      <QrCode className="w-12 h-12" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-300 font-sans">
                      സ്മാർട്ട്ഫോൺ ക്യാമറ ഉപയോഗിച്ച് സ്കാൻ ചെയ്യുക. ലോഗിൻ ഇല്ലാതെ ഉടൻ തുറക്കാം.
                    </p>
                    <div className="text-[9.5px] font-mono text-slate-400 truncate max-w-[200px]">
                      Token: {agreement.verificationToken}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="text-[10px] font-mono px-2.5 py-1 bg-slate-700/60 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1"
                  >
                    {copiedToken ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Token Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span>Copy Token</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 bg-rose-950/60 border-2 border-rose-500/50 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
              <h3 className="text-rose-300 font-bold text-base font-sans">
                കരാർ കണ്ടെത്താനായില്ല / അസാധുവാണ് (AGREEMENT NOT FOUND / INVALID)
              </h3>
              <p className="text-slate-300 text-xs max-w-lg mx-auto">
                നൽകിയ നമ്പറിലോ ടോക്കണിലോ ഉള്ള കരാർ നിലവിൽ ലഭ്യമല്ല. കരാർ നമ്പർ ശരിയാണോ എന്ന് പരിശോധിക്കുക, അല്ലെങ്കിൽ താഴെ നൽകിയിട്ടുള്ള രജിസ്റ്റർ ചെയ്ത കരാറുകളിൽ നിന്ന് തിരഞ്ഞെടുക്കുക.
              </p>
              <button
                type="button"
                onClick={handleResetTab}
                className="mt-2 px-4 py-2 bg-rose-900/80 hover:bg-rose-800 text-white rounded-xl text-xs font-mono font-bold transition inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>പുതിയ പരിശോധന (Reset Search)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Directory of Registered Documents for Public Zero-Login Access */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold font-sans text-white uppercase tracking-tight">
              രജിസ്റ്റർ ചെയ്ത കരാറുകൾ (REGISTERED DOCUMENTS FOR ZERO-LOGIN QR ACCESS)
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px]">
              {recentAgreements.length} Documents
            </span>
          </div>

          <span className="text-[11px] font-mono text-emerald-400">
            ALL DOCUMENTS ACCESSIBLE WITHOUT LOGIN
          </span>
        </div>

        {recentAgreements.length > 0 ? (
          <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
            {recentAgreements.map((agr) => {
              const publicUrl = ConstructionStorageManager.getPublicVerificationUrl(agr);
              return (
                <div
                  key={agr.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 px-2 rounded-xl transition"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        {agr.agreementNo}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] border border-emerald-500/40">
                        {agr.status}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {agr.agreementDate}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-sans truncate">
                      <strong className="text-white">{agr.client.clientName}</strong> • {agr.client.houseName} • {formatIndianCurrency(agr.finalContractAmount)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      Token: {agr.verificationToken}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setTokenInput(agr.agreementNo);
                        verifyToken(agr.agreementNo);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 border border-slate-700"
                      title="Load into verification hub"
                    >
                      <Eye className="w-3 h-3 text-emerald-400" />
                      <span>പരിശോധിക്കുക</span>
                    </button>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-mono font-bold transition flex items-center gap-1 border border-emerald-500/50 shadow-sm"
                      title="Open in zero-login public verification portal"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>സീറോ-ലോഗിൻ വ്യൂ</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs font-mono text-slate-400">
            No agreements generated yet. Create a new agreement in "E-Stamp Agreements" or "New Construction" to enable QR verification.
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return contentMarkup;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
      {contentMarkup}
    </div>
  );
};

