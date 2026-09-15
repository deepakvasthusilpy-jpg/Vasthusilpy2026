import React, { useState, useEffect } from "react";
import { ConstructionAgreement } from "../../types";
import {
  ConstructionStorageManager,
  formatIndianCurrency,
  convertAmountToMalayalamWords
} from "../../utils/constructionStorageManager";
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
  FileCheck2,
  Printer,
  Share2,
  Copy,
  Check,
  Clock,
  Home,
  HardHat,
  ArrowRight,
  ExternalLink,
  Award,
  Sparkles,
  Phone,
  Landmark,
  BadgeCheck,
  RefreshCw,
  FileText
} from "lucide-react";
import { shareAgreementOnWhatsApp } from "../../utils/constructionShareManager";

interface PublicAgreementVerificationPortalProps {
  token: string;
  onGoToLogin?: () => void;
}

export const PublicAgreementVerificationPortal: React.FC<PublicAgreementVerificationPortalProps> = ({
  token,
  onGoToLogin
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(token || "");
  const [agreement, setAgreement] = useState<ConstructionAgreement | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "specifications" | "clauses">("overview");

  useEffect(() => {
    if (token) {
      handleVerification(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleVerification = async (tokenOrId: string) => {
    const clean = tokenOrId.trim();
    if (!clean) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const found = await ConstructionStorageManager.getAgreementByIdAsync(clean);
      setAgreement(found);
    } catch (err) {
      console.warn("Verification lookup error", err);
      setAgreement(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleVerification(searchQuery.trim());
      // Update URL query without page reload
      const newUrl = `${window.location.origin}/?verify_agreement=${encodeURIComponent(searchQuery.trim())}`;
      window.history.replaceState({}, "", newUrl);
    }
  };

  const handleCopyVerificationUrl = () => {
    if (!agreement) return;
    const url = ConstructionStorageManager.getPublicVerificationUrl(agreement);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Government / Architectural Verification Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-lg shadow-emerald-950">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400">
                <HardHat className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-black text-white text-sm sm:text-base uppercase tracking-tight">
                  വാസ്തുശിൽപി
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                  PUBLIC VERIFICATION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                VASTHUSILPY ARCHITECTURAL & ENGINEERING CONTRACT AUTHENTICATION PORTAL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const homeUrl = window.location.origin;
                window.location.href = homeUrl;
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">ഹോം പേജ് (Home)</span>
            </button>
            {onGoToLogin && (
              <button
                onClick={onGoToLogin}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition cursor-pointer shadow-lg shadow-emerald-950"
              >
                ഓഫീസ് ലോഗിൻ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Verification Search Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ഓൺലൈൻ ആധികാരികതാ പരിശോധന (DIGITAL AUTHENTICITY)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
                കെട്ടിട നിർമ്മാണ കരാർ വെരിഫിക്കേഷൻ
              </h1>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                കരാറിലെ ക്യുആർ കോഡ് സ്കാൻ ചെയ്തോ, കരാർ നമ്പറോ (CW-2026-XXXXX) അല്ലെങ്കിൽ വെരിഫിക്കേഷൻ ടോക്കണോ നൽകി സാധുത പരിശോധിക്കുക.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Agreement No (e.g. CW-2026-00001) or Token (e.g. VST-CW-...)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-950"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">പരിശോധിക്കുക</span>
              </button>
            </form>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm font-mono text-slate-300">
              ഡിജിറ്റൽ ആധികാരികത പരിശോധിച്ചുകൊണ്ടിരിക്കുന്നു... (Verifying Digital Signature)...
            </p>
          </div>
        )}

        {/* Verification Result */}
        {!loading && hasSearched && (
          <div>
            {agreement ? (
              <div className="space-y-6">
                {/* Official Authenticity Banner */}
                <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400/60 flex items-center justify-center text-emerald-300 shadow-xl shrink-0">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-emerald-400 font-black text-base sm:text-lg uppercase tracking-tight">
                            സാധുതയുള്ള കെട്ടിട നിർമ്മാണ കരാർ
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-mono text-[10px] font-bold border border-emerald-400/50">
                            VERIFIED AUTHENTIC
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                            {agreement.status}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200">
                          ഈ കരാർ വാസ്തുശിൽപി എൻജിനീയറിംഗ് സ്റ്റുഡിയോയുടെ ഒഫീഷ്യൽ രേഖയായി രജിസ്റ്റർ ചെയ്യപ്പെട്ടിട്ടുള്ളതും പൂർണ്ണമായും സാധുതയുള്ളതുമാണ്.
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-400 flex-wrap">
                          <span>കരാർ നമ്പർ: <strong className="text-white">{agreement.agreementNo}</strong></span>
                          <span>•</span>
                          <span>തീയതി: <strong className="text-white">{agreement.agreementDate}</strong></span>
                          <span>•</span>
                          <span>ടോക്കൺ: <strong className="text-emerald-400">{agreement.verificationToken}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        onClick={handleCopyVerificationUrl}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
                        title="Copy Public Verification Link"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                        <span>{copied ? "കോപ്പി ചെയ്തു" : "ലിങ്ക് കോപ്പി"}</span>
                      </button>

                      <button
                        onClick={() => shareAgreementOnWhatsApp(agreement)}
                        className="px-3 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <button
                        onClick={handlePrintSummary}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
                        title="Print Verification Certificate"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <span className="hidden sm:inline">പ്രിന്റ്</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto bg-slate-900 border border-slate-800 p-1.5 rounded-2xl no-scrollbar">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeTab === "overview"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>പ്രധാന വിവരങ്ങൾ (Overview)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("milestones")}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeTab === "milestones"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>പേയ്‌മെന്റ് ഘട്ടങ്ങൾ ({agreement.paymentSchedule.length} Stages)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("specifications")}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeTab === "specifications"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <FileCheck2 className="w-4 h-4" />
                    <span>സ്പെസിഫിക്കേഷൻ (Specifications)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("clauses")}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeTab === "clauses"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>കരാർ വ്യവസ്ഥകൾ (Terms & Clauses)</span>
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Left: First & Second Party Details */}
                    <div className="space-y-4">
                      {/* First Party (Client / Owner) */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                          <User className="w-4 h-4 text-amber-400" />
                          <span>ഒന്നാം കക്ഷി / ഉടമസ്ഥൻ (First Party / Client)</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="text-base font-bold text-white">{agreement.client.clientName}</div>
                          <div className="text-slate-300 font-mono">വീട്ടുപേര്: {agreement.client.houseName}</div>
                          <div className="text-slate-400">
                            {agreement.client.localBody}, {agreement.client.district}, PIN: {agreement.client.pincode}
                          </div>
                          {agreement.client.mobileNumber && (
                            <div className="text-slate-400 pt-1 flex items-center gap-1.5 font-mono">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>ഫോൺ: {agreement.client.mobileNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Second Party (Contractor / Vasthusilpy) */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                          <span>രണ്ടാം കക്ഷി / കോൺട്രാക്ടർ (Second Party / Contractor)</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="text-base font-bold text-white">{agreement.contractor.proprietorName}</div>
                          <div className="text-cyan-300 font-bold">{agreement.contractor.companyName}</div>
                          <div className="text-slate-400">{agreement.contractor.address}</div>
                          <div className="text-slate-400 font-mono text-[11px] pt-1">
                            ഫോൺ: {agreement.contractor.phone} | ഇമെയിൽ: {agreement.contractor.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Project Parameters & Location */}
                    <div className="space-y-4">
                      {/* Financials & Area Card */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                          <Landmark className="w-4 h-4 text-emerald-400" />
                          <span>സാമ്പത്തികവും വിസ്തീർണ്ണവും (Financials & Area)</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-mono text-slate-400">ആകെ വിസ്തീർണ്ണം (PLINTH AREA)</span>
                            <div className="text-base font-black text-white font-mono">
                              {agreement.totalBuiltUpArea.toLocaleString()} <span className="text-xs font-normal text-slate-400">Sq.Ft</span>
                            </div>
                          </div>

                          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-0.5">
                            <span className="text-[10px] font-mono text-slate-400">നിരക്ക് (RATE / SQ.FT)</span>
                            <div className="text-base font-black text-emerald-400 font-mono">
                              {formatIndianCurrency(agreement.effectiveRatePerSqFt || agreement.baseRatePerSqFt, false)}
                            </div>
                          </div>
                        </div>

                        <div className="bg-emerald-950/40 p-4 rounded-2xl border border-emerald-500/40 space-y-1">
                          <div className="text-[11px] font-mono text-emerald-300 font-bold uppercase">
                            ആകെ കരാർ തുക (FINAL CONTRACT AMOUNT)
                          </div>
                          <div className="text-2xl font-black text-white font-mono">
                            {formatIndianCurrency(agreement.finalContractAmount)}
                          </div>
                          <div className="text-xs text-emerald-200">
                            {convertAmountToMalayalamWords(agreement.finalContractAmount)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                          <span>പൂർത്തീകരണ കാലാവധി: <strong className="text-white">{agreement.completionPeriodMonths} മാസങ്ങൾ</strong></span>
                          <span>റൂഫിംഗ്: <strong className="text-white">{agreement.roofingType}</strong></span>
                        </div>
                      </div>

                      {/* Site Address */}
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                          <MapPin className="w-4 h-4 text-rose-400" />
                          <span>സൈറ്റ് ലൊക്കേഷൻ (Building Site Location)</span>
                        </div>
                        <div className="text-xs text-slate-200 leading-relaxed">
                          {agreement.location.fullAddress || agreement.client.siteAddress || `${agreement.client.houseName}, ${agreement.client.localBody}, ${agreement.client.district}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Payment Stages */}
                {activeTab === "milestones" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white font-sans uppercase">
                          നിർമ്മാണ ഘട്ടങ്ങളും പെയ്‌മെന്റ് ഷെഡ്യൂളും (Payment Schedule)
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          ആകെ {agreement.paymentSchedule.length} ഘട്ടങ്ങളിലായി തുക വിഭജിച്ചിരിക്കുന്നു.
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs text-slate-400">ആകെ തുക: </span>
                        <span className="text-sm font-bold text-emerald-400">{formatIndianCurrency(agreement.finalContractAmount)}</span>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/80">
                      {agreement.paymentSchedule.map((stage, idx) => (
                        <div key={stage.id || idx} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-slate-300 shrink-0">
                              {stage.stageOrder || idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-white font-sans text-xs sm:text-sm">
                                {stage.stageNameMl || stage.stageName}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {stage.stageName} • {stage.percentage}%
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono shrink-0">
                            <div className="font-bold text-white text-xs sm:text-sm">
                              {formatIndianCurrency(stage.amount)}
                            </div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[9.5px] font-bold ${
                                stage.status === "PAID"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : stage.status === "PARTIAL"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                  : "bg-slate-800 text-slate-400 border border-slate-700"
                              }`}
                            >
                              {stage.status === "PAID" ? "അടച്ചു (PAID)" : stage.status === "PARTIAL" ? "ഭാഗികം" : "ബാക്കി (PENDING)"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 3: Detailed Specifications */}
                {activeTab === "specifications" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white font-sans uppercase">
                        നിർമ്മാണ സ്പെസിഫിക്കേഷനുകൾ (Detailed Work Specifications)
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        മെറ്റീരിയൽ ബ്രാൻഡുകളും ഘടനാപരമായ വിശദാംശങ്ങളും
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">1. ഫൗണ്ടേഷൻ & ബേസ്‌മെന്റ്:</span>
                        <p className="text-slate-300">{agreement.specifications.foundation || "റൂബിൾ കൊത്തുപണി, ബെൽറ്റ് കോൺക്രീറ്റ്."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">2. സൂപ്പർ സ്ട്രക്ചർ (ഭിത്തികൾ):</span>
                        <p className="text-slate-300">{agreement.specifications.superstructure || "ഫസ്റ്റ് ക്ലാസ് റെഡ് ബ്രിക്സ് / സോളിഡ് ബ്ലോക്കുകൾ."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">3. മേൽക്കൂര (Roofing & Concrete):</span>
                        <p className="text-slate-300">{agreement.specifications.roofing || "ആർ.സി.സി സ്ലാബ് കോൺക്രീറ്റ് (M20 ഗ്രേഡ്)."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">4. പ്ലാസ്റ്ററിംഗ് (Plastering):</span>
                        <p className="text-slate-300">{agreement.specifications.plastering || "സിമന്റ് ചാന്തുപയോഗിച്ച് മിനുസമാർന്ന പ്ലാസ്റ്ററിംഗ്."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">5. ഫ്ലോറിംഗ് (Flooring):</span>
                        <p className="text-slate-300">{agreement.specifications.flooring || "പ്രീമിയം വിട്രിഫൈഡ് ടൈലുകൾ (₹60/sqft അടിസ്ഥാന നിരക്ക്)."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">6. വാതിലുകളും ജനലുകളും:</span>
                        <p className="text-slate-300">{agreement.specifications.woodwork || "തേക്കിൻ തടി മുൻവാതിൽ, മറ്റു വാതിലുകൾ ഗുണനിലവാരമുള്ള തടി."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">7. ഇലക്ട്രിക്കൽ & പ്ലംബിംഗ്:</span>
                        <p className="text-slate-300">{agreement.specifications.electrical || "Finolex / RR Kabel വയറിംഗ്, Cera / Jaquar ഫിറ്റിംഗ്സ്."}</p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-1">
                        <span className="font-bold text-amber-400">8. പെയിന്റിംഗ് (Painting):</span>
                        <p className="text-slate-300">{agreement.specifications.painting || "Asian Paints പ്രീമിയം എമൽഷൻ & വാട്ടർപ്രൂഫ് കോട്ടിംഗ്."}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: Terms & Clauses */}
                {activeTab === "clauses" && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                    <div className="border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white font-sans uppercase">
                        പൊതുവായ കരാർ വ്യവസ്ഥകൾ (General Terms & Conditions)
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        രജിസ്റ്റർ ചെയ്ത ഔദ്യോഗിക നിയമപരമായ വ്യവസ്ഥകൾ
                      </p>
                    </div>

                    <div className="space-y-2.5 text-xs text-slate-200">
                      {agreement.clauses.filter(c => c.isEnabled).map((clause) => (
                        <div key={clause.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                          <div className="font-bold text-amber-400 font-sans">
                            {clause.clauseNo}. {clause.titleMl || clause.title}:
                          </div>
                          <div className="text-slate-300 leading-relaxed">
                            {clause.contentMl || clause.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digital Seal & QR Box Footer */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    {agreement.qrCodeDataUrl ? (
                      <img
                        src={agreement.qrCodeDataUrl}
                        alt="Digital Authentication QR"
                        className="w-20 h-20 bg-white p-1 rounded-2xl border-2 border-emerald-500/40 shadow-lg shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                        <QrCode className="w-8 h-8" />
                      </div>
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase tracking-wide">
                        <BadgeCheck className="w-4 h-4" />
                        <span>ഡിജിറ്റൽ ആധികാരികതാ മുദ്ര (DIGITAL SIGNATURE & SEAL)</span>
                      </div>
                      <div className="text-slate-300 font-mono">
                        ടോക്കൺ: <strong className="text-white">{agreement.verificationToken}</strong> • പതിപ്പ്: v{agreement.version}
                      </div>
                      <p className="text-slate-500 text-[11px]">
                        ഈ കരാർ വാസ്തുശിൽപി സെക്യൂരിറ്റി ആർക്കിടെക്ചർ വഴി സുരക്ഷിതമായി സൂക്ഷിച്ചിരിക്കുന്നു.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={handlePrintSummary}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>പ്രിന്റ് സർട്ടിഫിക്കറ്റ്</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Not Found / Invalid Banner */
              <div className="bg-rose-950/50 border-2 border-rose-500/50 rounded-3xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-md">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto text-rose-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-rose-300 uppercase tracking-tight font-sans">
                    കരാർ കണ്ടെത്താനായില്ല അല്ലെങ്കിൽ അസാധുവാണ്
                  </h2>
                  <p className="text-xs font-mono text-slate-300 max-w-md mx-auto">
                    AGREEMENT NOT FOUND OR INVALID TOKEN: "{searchQuery}"
                  </p>
                </div>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  നൽകിയ ടോക്കണോ കരാർ നമ്പറോ സിസ്റ്റത്തിൽ ലഭ്യമല്ല. ദയവായി കരാർ രേഖയിലെ QR കോഡ് വീണ്ടും സ്കാൻ ചെയ്യുകയോ വാസ്തുശിൽപി ഓഫീസുമായി ബന്ധപ്പെടുകയോ ചെയ്യുക.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                  >
                    മറ്റൊരു ടോക്കൺ നൽകുക
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <p>© {new Date().getFullYear()} VASTHUSILPY ARCHITECTURAL CONSULTANTS & ENGINEERS. ALL RIGHTS RESERVED.</p>
        <p className="text-[11px] text-slate-600 mt-1">
          KERALA BUILDING RULES COMPLIANT (KMBR / KPBR) • DIGITAL CONSTRUCTION CONTRACTS
        </p>
      </footer>
    </div>
  );
};
