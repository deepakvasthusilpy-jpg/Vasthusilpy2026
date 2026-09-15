import React, { useState } from "react";
import {
  ExternalLink,
  Search,
  FileCheck,
  Building2,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Globe,
  ArrowUpRight,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  FileText
} from "lucide-react";

interface KsmartFileTrackingTabProps {
  initialFileNumber?: string;
  onTrackInRegister?: (fileNo: string) => void;
}

export const KsmartFileTrackingTab: React.FC<KsmartFileTrackingTabProps> = ({
  initialFileNumber = "",
  onTrackInRegister
}) => {
  const KSMART_URL = "https://ksmart.lsgkerala.gov.in/ui/file-management/public/file-tracking";
  const [copied, setCopied] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [quickSearchNo, setQuickSearchNo] = useState<string>(initialFileNumber);
  const [copiedSearchNo, setCopiedSearchNo] = useState<boolean>(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(KSMART_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(KSMART_URL, "_blank", "noopener,noreferrer");
  };

  const handleRefreshIframe = () => {
    setIframeLoaded(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleCopyQuickNumber = () => {
    if (!quickSearchNo) return;
    navigator.clipboard.writeText(quickSearchNo);
    setCopiedSearchNo(true);
    setTimeout(() => setCopiedSearchNo(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-xl bg-blueprint-grid text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
            <Globe className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                LSGD KERALA OFFICIAL PORTAL
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                LIVE FILE TRACKING & VERIFICATION
              </span>
            </div>
            <h2 className="text-2xl font-black font-sans text-white tracking-tight flex items-center gap-2">
              <span>KSMART ഫയൽ ട്രാക്കിംഗ് (KSMART File Tracking)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              തദ്ദേശ സ്വയംഭരണ സ്ഥാപനങ്ങളിലെ (Panchayat / Municipality / Corporation) ബിൽഡിംഗ് പെർമിറ്റ്, ഒക്യുപ്പൻസി, ലൊക്കേഷൻ അനുമതി ഫയലുകളുടെ തത്സമയ സ്റ്റാറ്റസ് പരിശോധിക്കുക.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>OPEN DIRECT PORTAL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-mono text-xs font-semibold transition cursor-pointer"
            title="Copy portal link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "COPIED" : "COPY LINK"}</span>
          </button>

          <button
            onClick={handleRefreshIframe}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Embedded Portal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Helper & Clipboard Helper */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-400 shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div className="flex-1 sm:w-80">
            <label className="block text-[10px] font-mono text-slate-400 mb-0.5">
              QUICK COPY FILE / PERMIT NUMBER:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quickSearchNo}
                onChange={(e) => setQuickSearchNo(e.target.value)}
                placeholder="e.g. KL-PKD-KRLS-2026-0042 / A5-1234/26"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleCopyQuickNumber}
                disabled={!quickSearchNo}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {copiedSearchNo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSearchNo ? "COPIED" : "COPY"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Tip: Copy number & paste directly in KSMART portal search box below</span>
        </div>
      </div>

      {/* Embedded Portal Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-h-[660px] flex flex-col">
        {/* Portal Address Bar Header */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">HTTPS://</span>
            <span className="text-emerald-300 font-bold truncate">
              ksmart.lsgkerala.gov.in/ui/file-management/public/file-tracking
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={KSMART_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition"
            >
              <span>Direct Link</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Iframe Viewport */}
        <div className="relative flex-1 bg-slate-950">
          {!iframeLoaded && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-200">LOADING KSMART FILE TRACKING PORTAL...</h3>
                <p className="text-xs text-slate-400 mt-1">Connecting to Kerala Local Self Government Department (LSGD) Server...</p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="mt-2 text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Click here to open portal in new tab if embed is blocked by network</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={KSMART_URL}
            title="KSMART File Tracking Portal"
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-[680px] border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          />
        </div>
      </div>

      {/* Guidance & Direct Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 1 Card */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">കെ-സ്മാർട്ട് ഫയൽ ട്രാക്ക് ചെയ്യുന്നത് എങ്ങനെ?</h3>
              <p className="text-xs text-slate-400 font-mono">How to Track KSMART File</p>
            </div>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-sans">
            <li>
              <strong>തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം തിരഞ്ഞെടുക്കുക:</strong> ജില്ല, കോർപ്പറേഷൻ / മുൻസിപ്പാലിറ്റി / ഗ്രാമപഞ്ചായത്ത് ഓഫീസ് സെലക്ട് ചെയ്യുക.
            </li>
            <li>
              <strong>ഫയൽ / പെർമിറ്റ് നമ്പർ നൽകുക:</strong> Building Permit Application Number, Acknowledgement No അല്ലെങ്കിൽ File Number ടൈപ്പ് ചെയ്യുക.
            </li>
            <li>
              <strong>തത്സമയ സ്റ്റാറ്റസ് അറിയുക:</strong> അസിസ്റ്റന്റ് എഞ്ചിനീയർ (AE) പരിശോധന, ടൗൺ പ്ലാനർ അപ്രൂവൽ, അനുമതി ഉത്തരവ് വിവരം ലഭ്യമാകും.
            </li>
          </ul>
        </div>

        {/* Step 2 Card */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-950 border border-teal-800 rounded-xl text-teal-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">പ്രധാന KSMART സേവനങ്ങൾ (KSMART Services)</h3>
              <p className="text-xs text-slate-400 font-mono">Building Permit & LSGD Approvals</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Building Permit (സെൽഫ് & റെഗുലർ)</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Occupancy Certificate</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Completion Certificate</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Ownership Transfer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
