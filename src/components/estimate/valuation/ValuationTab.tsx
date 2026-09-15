import React, { useState, useEffect } from "react";
import { ValuationCertificate } from "../../../types";
import {
  loadSavedValuations,
  saveValuations,
  syncValuationToCloud,
  deleteValuationFromCloud,
  createNewBlankValuation,
  generateUniqueValuationNumber,
  calculateValuationDetails
} from "../../../data/valuationData";
import { ValuationDashboard } from "./ValuationDashboard";
import { ValuationCertificateBuilder } from "./ValuationCertificateBuilder";
import { ValuationCertificatePrintView } from "./ValuationCertificatePrintView";
import { triggerPrint } from "../../../utils/printHelper";
import {
  FileCheck2,
  LayoutDashboard,
  Edit,
  Eye,
  Printer,
  Download,
  Plus,
  ArrowLeft,
  Share2,
  Check,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Maximize2
} from "lucide-react";

export const ValuationTab: React.FC = () => {
  const [certificates, setCertificates] = useState<ValuationCertificate[]>([]);
  const [activeCertId, setActiveCertId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"dashboard" | "builder" | "preview">("dashboard");
  const [fontScale, setFontScale] = useState<"normal" | "compact" | "large">("normal");
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    const loaded = loadSavedValuations();
    setCertificates(loaded);
    if (loaded.length > 0) {
      setActiveCertId(loaded[0].id);
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const activeCert =
    certificates.find((c) => c.id === activeCertId) ||
    certificates[0] ||
    createNewBlankValuation(0);

  const handleUpdateCertificate = (updated: ValuationCertificate) => {
    setCertificates((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      saveValuations(next);
      return next;
    });
  };

  const handleSaveCertificate = async (cert: ValuationCertificate) => {
    handleUpdateCertificate(cert);
    showToast(`Valuation certificate ${cert.certificateNo || cert.id} saved & synced online!`);
    await syncValuationToCloud(cert);
  };

  const handleCreateNew = () => {
    const newCert = createNewBlankValuation(certificates.length);
    newCert.id = generateUniqueValuationNumber(certificates);
    const updatedList = [newCert, ...certificates];
    setCertificates(updatedList);
    saveValuations(updatedList);
    setActiveCertId(newCert.id);
    setViewMode("builder");
    showToast("New Valuation Certificate initialized!");
  };

  const handleDuplicate = (cert: ValuationCertificate) => {
    const newId = generateUniqueValuationNumber(certificates);
    const currentYear = new Date().getFullYear();
    const cloned = calculateValuationDetails({
      ...JSON.parse(JSON.stringify(cert)),
      id: newId,
      certificateNo: `VC-${currentYear}/${String(Math.floor(Math.random() * 9000) + 1000)}`,
      ownerName: `${cert.ownerName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "DRAFT"
    });
    const nextList = [cloned, ...certificates];
    setCertificates(nextList);
    saveValuations(nextList);
    setActiveCertId(newId);
    setViewMode("builder");
    showToast(`Duplicated certificate as ${cloned.certificateNo}`);
  };

  const handleDelete = async (id: string) => {
    const nextList = certificates.filter((c) => c.id !== id);
    setCertificates(nextList);
    saveValuations(nextList);
    if (activeCertId === id && nextList.length > 0) {
      setActiveCertId(nextList[0].id);
    }
    await deleteValuationFromCloud(id);
    showToast("Certificate deleted successfully");
  };

  const handleSelectFromDashboard = (
    cert: ValuationCertificate,
    mode: "builder" | "preview" = "builder"
  ) => {
    setActiveCertId(cert.id);
    setViewMode(mode);
  };

  const handlePrint = (targetCert?: ValuationCertificate) => {
    const certToPrint = targetCert || activeCert;
    if (targetCert && targetCert.id !== activeCertId) {
      setActiveCertId(targetCert.id);
    }
    const filename = `Valuation_Certificate_${certToPrint.certificateNo || certToPrint.id || "Kerala"}`;
    triggerPrint(filename, "valuation-cert-printable");
  };

  const handleDownloadPdf = (targetCert?: ValuationCertificate) => {
    handlePrint(targetCert);
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-mono text-xs animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Navigation Strip */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "dashboard"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
            <span className="text-[10px] bg-slate-950 px-1.5 py-0.2 rounded text-slate-300">
              {certificates.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode("builder")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "builder"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Certificate Builder</span>
          </button>

          <button
            onClick={() => setViewMode("preview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "preview"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Official Print View</span>
          </button>
        </div>

        {/* Right: Quick actions for active certificate */}
        <div className="flex items-center gap-2">
          {viewMode !== "dashboard" && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl text-xs font-mono">
              <span className="text-slate-500 text-[10px]">Font Scale:</span>
              <button
                onClick={() => setFontScale("compact")}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  fontScale === "compact" ? "bg-cyan-600 text-white" : "text-slate-400"
                }`}
              >
                Compact
              </button>
              <button
                onClick={() => setFontScale("normal")}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  fontScale === "normal" ? "bg-cyan-600 text-white" : "text-slate-400"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setFontScale("large")}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  fontScale === "large" ? "bg-cyan-600 text-white" : "text-slate-400"
                }`}
              >
                Large
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Print A4</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Cert</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DEDICATED VALUATION CERTIFICATES DASHBOARD
         ========================================================================= */}
      {viewMode === "dashboard" && (
        <ValuationDashboard
          certificates={certificates}
          onSelectCertificate={handleSelectFromDashboard}
          onCreateNew={handleCreateNew}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onQuickPrint={(cert) => {
            handlePrint(cert);
          }}
        />
      )}

      {/* =========================================================================
          VIEW 2: CERTIFICATE BUILDER & LIVE PREVIEW (TWO COLUMN LAYOUT)
         ========================================================================= */}
      {viewMode === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Builder */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            <ValuationCertificateBuilder
              certificate={activeCert}
              onChange={handleUpdateCertificate}
              onSave={handleSaveCertificate}
              onPrint={() => handlePrint()}
              onDownloadPdf={() => handleDownloadPdf()}
              onCloseBuilder={() => setViewMode("dashboard")}
            />
          </div>

          {/* Right Column: Live A4 Legal Preview */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Live Statutory Preview • Kerala Sub Registrar Appendix
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Print View Wrapper */}
            <div className="bg-slate-950/60 p-4 sm:p-6 rounded-2xl border border-slate-800 overflow-x-auto shadow-inner">
              <ValuationCertificatePrintView
                certificate={activeCert}
                fontScale={fontScale}
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: FULLSCREEN / OFFICIAL PRINT VIEW
         ========================================================================= */}
      {viewMode === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <button
              type="button"
              onClick={() => setViewMode("builder")}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border border-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Builder</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePrint()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Certificate</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 sm:p-8 rounded-2xl border border-slate-800 overflow-x-auto shadow-2xl flex justify-center">
            <ValuationCertificatePrintView
              certificate={activeCert}
              fontScale={fontScale}
            />
          </div>
        </div>
      )}

      {/* Persistent Hidden Printable View for Direct Browser Printing and Popups */}
      {viewMode === "dashboard" && (
        <div className="hidden print:block font-serif bg-white text-black">
          <ValuationCertificatePrintView
            certificate={activeCert}
            fontScale={fontScale}
          />
        </div>
      )}
    </div>
  );
};
