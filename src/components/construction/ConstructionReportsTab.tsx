import React, { useState } from "react";
import { ConstructionProject, ConstructionAgreement, ConstructionSettings } from "../../types";
import { formatIndianCurrency } from "../../utils/constructionStorageManager";
import { exportReportToPdf } from "../../utils/constructionPdfExporter";
import { shareFinancialReportOnWhatsApp } from "../../utils/constructionShareManager";
import {
  TrendingUp,
  DollarSign,
  Building2,
  Printer,
  PieChart,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  Calendar,
  Download,
  Share2
} from "lucide-react";

interface ConstructionReportsTabProps {
  projects: ConstructionProject[];
  agreements: ConstructionAgreement[];
  settings: ConstructionSettings;
}

export const ConstructionReportsTab: React.FC<ConstructionReportsTabProps> = ({
  projects,
  agreements,
  settings
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [statusText, setStatusText] = useState("");

  const totalContract = projects.reduce((s, p) => s + (p.finalContractAmount || 0), 0);
  const totalReceived = projects.reduce((s, p) => s + (p.totalReceived || 0), 0);
  const totalBalance = projects.reduce((s, p) => s + (p.balanceAmount || 0), 0);
  const totalArea = projects.reduce((s, p) => s + (p.totalBuiltUpArea || 0), 0);

  const handlePrintReport = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setStatusText("PDF തയ്യാറാക്കുന്നു...");
    try {
      await exportReportToPdf("reports-printable-root", (msg) => setStatusText(msg));
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
      setStatusText("");
    }
  };

  const handleWhatsAppShare = () => {
    shareFinancialReportOnWhatsApp(projects, settings);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
              EXECUTIVE AUDIT & FINANCIAL LEDGER
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
            നിർമ്മാണ ധനകാര്യ റിപ്പോർട്ട് (Financial & Project Reports)
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            COMPREHENSIVE LEDGER, CASH-FLOW SUMMARIES, PDF EXPORT & WHATSAPP SHARING
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-indigo-950 transition cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? (statusText || "PDF...") : "PDF ഡൗൺലോഡ്"}</span>
          </button>

          {/* Share on WhatsApp */}
          <button
            onClick={handleWhatsAppShare}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>വാട്സ്ആപ്പ് ഷെയർ</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrintReport}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold rounded-2xl border border-slate-700 transition cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>പ്രിന്റ്</span>
          </button>
        </div>
      </div>

      {/* Printable Report Sheet */}
      <div
        id="reports-printable-root"
        className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 print:bg-white print:text-black print:p-0 print:border-none"
      >
        {/* Printable Header */}
        <div className="border-b border-slate-800 pb-4 text-center">
          <h1 className="text-lg font-black uppercase text-white font-serif print:text-black">
            {settings.contractor.companyName} - നിർമ്മാണ പദ്ധതികളുടെ ധനകാര്യ റിപ്പോർട്ട്
          </h1>
          <p className="text-xs text-slate-400 font-mono print:text-slate-600">
            {settings.contractor.address} • Ph: {settings.contractor.phone}
          </p>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            റിപ്പോർട്ട് തീയതി: {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
          </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
            <div className="text-[10px] text-slate-400 font-mono uppercase">ആകെ കരാർ മൂല്യം</div>
            <div className="text-lg font-black text-emerald-400 font-mono print:text-emerald-800">{formatIndianCurrency(totalContract)}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
            <div className="text-[10px] text-slate-400 font-mono uppercase">ലഭിച്ച തുക</div>
            <div className="text-lg font-black text-cyan-400 font-mono print:text-cyan-800">{formatIndianCurrency(totalReceived)}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
            <div className="text-[10px] text-slate-400 font-mono uppercase">ബാക്കി ലഭിക്കാനുള്ളത്</div>
            <div className="text-lg font-black text-amber-400 font-mono print:text-amber-800">{formatIndianCurrency(totalBalance)}</div>
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 print:bg-slate-50 print:border-slate-300">
            <div className="text-[10px] text-slate-400 font-mono uppercase">ആകെ വിസ്തീർണ്ണം</div>
            <div className="text-lg font-black text-indigo-400 font-mono print:text-indigo-800">{totalArea.toLocaleString()} Sq.Ft</div>
          </div>
        </div>

        {/* Project Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-black">
                <th className="p-2.5">No</th>
                <th className="p-2.5">ക്ലയന്റ് & പ്രോജക്ട്</th>
                <th className="p-2.5">പഞ്ചായത്ത് / ലൊക്കേഷൻ</th>
                <th className="p-2.5 text-right">വിസ്തീർണ്ണം</th>
                <th className="p-2.5 text-right">കരാർ തുക</th>
                <th className="p-2.5 text-right">ലഭിച്ച തുക</th>
                <th className="p-2.5 text-right">ബാക്കി തുക</th>
                <th className="p-2.5 text-center">ഘട്ടം</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-300">
              {projects.map((p, idx) => (
                <tr key={p.id} className="hover:bg-slate-950/40">
                  <td className="p-2.5 text-slate-500">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-white print:text-black">
                    <div>{p.client.clientName}</div>
                    <div className="text-[10px] text-slate-400">{p.projectNo}</div>
                  </td>
                  <td className="p-2.5 text-slate-300 print:text-slate-700">{p.client.localBody}</td>
                  <td className="p-2.5 text-right font-bold text-slate-200 print:text-black">{p.totalBuiltUpArea.toLocaleString()} Sq.Ft</td>
                  <td className="p-2.5 text-right font-bold text-emerald-400 print:text-emerald-900">{formatIndianCurrency(p.finalContractAmount)}</td>
                  <td className="p-2.5 text-right text-cyan-400 font-bold print:text-cyan-900">{formatIndianCurrency(p.totalReceived || 0)}</td>
                  <td className="p-2.5 text-right text-amber-400 font-bold print:text-amber-900">{formatIndianCurrency(p.balanceAmount || p.finalContractAmount)}</td>
                  <td className="p-2.5 text-center text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 print:bg-slate-200 print:text-black font-bold">
                      {p.currentStage}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
