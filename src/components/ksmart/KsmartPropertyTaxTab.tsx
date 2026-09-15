import React, { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  Building2,
  Search,
  CreditCard,
  FileCheck2,
  Coins,
  History,
  Home,
  Info
} from "lucide-react";

export const KsmartPropertyTaxTab: React.FC = () => {
  const KSMART_PROPERTY_TAX_URL = "https://ksmart.lsgkerala.gov.in/ui/web-portal/property-tax";
  
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(KSMART_PROPERTY_TAX_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(KSMART_PROPERTY_TAX_URL, "_blank", "noopener,noreferrer");
  };

  const handleRefreshIframe = () => {
    setIframeLoaded(false);
    setIframeKey((prev) => prev + 1);
  };

  const taxFeatures = [
    {
      title: "കെട്ടിട നികുതി അടയ്ക്കൽ (Pay Property Tax)",
      desc: "തദ്ദേശ സ്ഥാപനം (Panchayat / Municipality / Corporation), വാർഡ് നമ്പർ, ഡോർ നമ്പർ നൽകി നികുതി ഓൺലൈനായി അടയ്ക്കാം.",
      icon: CreditCard,
      badge: "ONLINE PAYMENT",
      color: "border-amber-800/80 bg-amber-950/40 text-amber-300"
    },
    {
      title: "അസസ്‌മെന്റ് & ഉടമസ്ഥാവകാശം (Ownership Search)",
      desc: "കെട്ടിടത്തിന്റെ അസസ്‌മെന്റ് നമ്പർ, ഉടമസ്ഥന്റെ പേര്, വാർഷിക മൂല്യം എന്നിവ വേഗത്തിൽ തിരയാം.",
      icon: Building2,
      badge: "ASSESSMENT",
      color: "border-cyan-800/80 bg-cyan-950/40 text-cyan-300"
    },
    {
      title: "ഇ-രസീത് ഡൗൺലോഡ് (E-Receipt Download)",
      desc: "നേരത്തെ അടച്ച പ്രോപ്പർട്ടി ടാക്സ് രസീതുകൾ തീയതിയും ട്രാൻസാക്ഷൻ ഐഡിയും ഉപയോഗിച്ച് ഡൗൺലോഡ് ചെയ്യാം.",
      icon: Receipt,
      badge: "RECEIPT",
      color: "border-emerald-800/80 bg-emerald-950/40 text-emerald-300"
    },
    {
      title: "ഡിമാൻഡ് & കുടിശ്ശിക പരിശോധന (Tax Arrears)",
      desc: "നിലവിലെ അർദ്ധവാർഷിക/വാർഷിക നികുതി ഡിമാൻഡും മുൻകാല കുടിശ്ശികകളും തത്സമയം പരിശോധിക്കാം.",
      icon: Coins,
      badge: "ARREARS CHECK",
      color: "border-indigo-800/80 bg-indigo-950/40 text-indigo-300"
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900/95 p-6 rounded-2xl border border-amber-800/60 shadow-xl bg-blueprint-grid text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
            <Receipt className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 bg-amber-950 px-2.5 py-0.5 rounded border border-amber-800">
                LSGD SANCHAYA & K-SMART
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                PROPERTY TAX & E-PAYMENT
              </span>
            </div>
            <h2 className="text-2xl font-black font-sans text-white tracking-tight flex items-center gap-2">
              <span>കെട്ടിട നികുതി & ഉടമസ്ഥാവകാശം (Property Tax)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              തദ്ദേശ സ്വയംഭരണ സ്ഥാപനങ്ങളിലെ പ്രോപ്പർട്ടി ടാക്സ്, അസസ്‌മെന്റ് വിവരങ്ങൾ, ഉടമസ്ഥാവകാശം എന്നിവ പരിശോധിക്കുകയും നികുതി ഓൺലൈനായി അടയ്ക്കുകയും ചെയ്യാം.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>OPEN PROPERTY TAX PORTAL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-mono text-xs font-semibold transition cursor-pointer"
            title="Copy portal URL"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? "COPIED" : "COPY LINK"}</span>
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

      {/* Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {taxFeatures.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${feat.color} transition-all hover:scale-[1.01] space-y-2 flex flex-col justify-between`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {feat.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">{feat.title}</h4>
                <p className="text-[11px] text-slate-300/90 leading-relaxed font-sans">{feat.desc}</p>
              </div>

              <button
                onClick={handleOpenExternal}
                className="w-full mt-2 py-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[11px] font-mono font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <span>നികുതി പോർട്ടൽ തുറക്കുക</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Embedded Portal Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-h-[680px] flex flex-col">
        {/* Address Bar */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">HTTPS://</span>
            <span className="text-amber-300 font-bold truncate">
              ksmart.lsgkerala.gov.in/ui/web-portal/property-tax
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyLink}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copy Link</span>
            </button>
            <a
              href={KSMART_PROPERTY_TAX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition"
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
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-200">
                  LOADING KSMART PROPERTY TAX PORTAL...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connecting to Kerala LSGD Property Tax & Assessment Services...
                </p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="mt-2 text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Click here to open Property Tax Portal in new tab if embed is restricted</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={KSMART_PROPERTY_TAX_URL}
            title="KSMART Property Tax Portal"
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-[700px] border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          />
        </div>
      </div>
    </div>
  );
};
