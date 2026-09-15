import React, { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  Award,
  FileCheck,
  Heart,
  Baby,
  Users,
  Building,
  Sparkles,
  Info
} from "lucide-react";

export const KsmartQuickCertificatesTab: React.FC = () => {
  const KSMART_CERTIFICATES_URL = "https://ksmart.lsgkerala.gov.in/ui/web-portal/quick-certificates";
  
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(KSMART_CERTIFICATES_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(KSMART_CERTIFICATES_URL, "_blank", "noopener,noreferrer");
  };

  const handleRefreshIframe = () => {
    setIframeLoaded(false);
    setIframeKey((prev) => prev + 1);
  };

  const certificateServices = [
    {
      title: "ജനന സർട്ടിഫിക്കറ്റ് (Birth Certificate)",
      desc: "ജനന തീയതി, കുട്ടിയുടെ പേര്, മാതാപിതാക്കളുടെ വിവരങ്ങൾ നൽകി ഓൺലൈനായി ഡൗൺലോഡ് ചെയ്യാം.",
      icon: Baby,
      badge: "INSTANT DOWNLOAD",
      color: "border-cyan-800/80 bg-cyan-950/40 text-cyan-300"
    },
    {
      title: "മരണ സർട്ടിഫിക്കറ്റ് (Death Certificate)",
      desc: "മരണ രജിസ്ട്രേഷൻ നമ്പർ അല്ലെങ്കിൽ തീയതി പ്രകാരം വേരിഫൈഡ് സർട്ടിഫിക്കറ്റ് ലഭ്യമാക്കുക.",
      icon: Users,
      badge: "VERIFIED",
      color: "border-slate-700 bg-slate-900/60 text-slate-300"
    },
    {
      title: "വിവാഹ സർട്ടിഫിക്കറ്റ് (Marriage Certificate)",
      desc: "വിവാഹ രജിസ്ട്രേഷൻ വിശദാംശങ്ങൾ പരിശോധിച്ച് ഡിജിറ്റൽ സർട്ടിഫിക്കറ്റ് ഡൗൺലോഡ് ചെയ്യാം.",
      icon: Heart,
      badge: "DIGITAL CERT",
      color: "border-rose-800/80 bg-rose-950/40 text-rose-300"
    },
    {
      title: "വ്യാപാര ലൈസൻസ് & പെർമിറ്റുകൾ (Trade/D&O)",
      desc: "തദ്ദേശ സ്ഥാപനങ്ങളിലെ വ്യാപാര സ്ഥാപനങ്ങളുടെ ലൈസൻസുകൾ വേഗത്തിൽ പരിശോധിക്കാം.",
      icon: Building,
      badge: "COMMERCIAL",
      color: "border-amber-800/80 bg-amber-950/40 text-amber-300"
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900/95 p-6 rounded-2xl border border-teal-800/60 shadow-xl bg-blueprint-grid text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl text-slate-950 shadow-lg shadow-teal-500/20 shrink-0">
            <Award className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-300 bg-teal-950 px-2.5 py-0.5 rounded border border-teal-800">
                K-SMART E-SERVICES
              </span>
              <span className="text-[10px] font-mono text-emerald-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                QUICK CERTIFICATES
              </span>
            </div>
            <h2 className="text-2xl font-black font-sans text-white tracking-tight flex items-center gap-2">
              <span>ക്വിക്ക് സർട്ടിഫിക്കറ്റുകൾ (Quick Certificates)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              തദ്ദേശ സ്വയംഭരണ വകുപ്പിന്റെ K-SMART പോർട്ടൽ വഴി ജനന, മരണ, വിവാഹ സർട്ടിഫിക്കറ്റുകൾ തത്സമയം പരിശോധിക്കുകയും ഡൗൺലോഡ് ചെയ്യുകയും ചെയ്യാം.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>OPEN CERTIFICATES PORTAL</span>
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

      {/* Quick Service Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {certificateServices.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${srv.color} transition-all hover:scale-[1.01] space-y-2 flex flex-col justify-between`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                    {srv.badge}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-tight">{srv.title}</h4>
                <p className="text-[11px] text-slate-300/90 leading-relaxed font-sans">{srv.desc}</p>
              </div>

              <button
                onClick={handleOpenExternal}
                className="w-full mt-2 py-1.5 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-[11px] font-mono font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <span>ഡൗൺലോഡ് പോർട്ടൽ</span>
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
            <span className="w-3 h-3 rounded-full bg-teal-500/20 border border-teal-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">HTTPS://</span>
            <span className="text-teal-300 font-bold truncate">
              ksmart.lsgkerala.gov.in/ui/web-portal/quick-certificates
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
              href={KSMART_CERTIFICATES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-teal-400 transition"
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
              <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-200">
                  LOADING KSMART QUICK CERTIFICATES PORTAL...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connecting to Kerala LSGD Quick Certificate Services...
                </p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="mt-2 text-xs font-mono text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Click here to open Certificates Portal in new tab if embed is restricted</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={KSMART_CERTIFICATES_URL}
            title="KSMART Quick Certificates Portal"
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-[700px] border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          />
        </div>
      </div>
    </div>
  );
};
