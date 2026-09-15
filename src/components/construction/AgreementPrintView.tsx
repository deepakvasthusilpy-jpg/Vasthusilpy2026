import React, { useState } from "react";
import { ConstructionAgreement, ConstructionSettings } from "../../types";
import { formatIndianCurrency } from "../../utils/constructionStorageManager";
import { exportAgreementPdf } from "../../utils/constructionPdfExporter";
import { shareAgreementOnWhatsApp } from "../../utils/constructionShareManager";
import { triggerPrint } from "../../utils/printHelper";
import { useAuth } from "../../context/AuthContext";
import { canUseDigitalSignatures, AUTHORIZED_SIGNING_EMAILS } from "../../lib/firebase";
import {
  ShieldCheck,
  Printer,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
  Building,
  CheckCircle2,
  X,
  Sparkles,
  Check,
  Edit3,
  Lock,
  Stamp,
  UserCheck
} from "lucide-react";

interface AgreementPrintViewProps {
  agreement: ConstructionAgreement;
  settings: ConstructionSettings;
  printMode: "e_stamp" | "plain_a4";
  onClose?: () => void;
  onEdit?: () => void;
}

export const AgreementPrintView: React.FC<AgreementPrintViewProps> = ({
  agreement,
  settings,
  printMode: initialPrintMode,
  onClose,
  onEdit
}) => {
  const { user, emailUser } = useAuth();
  const activeEmail = user?.email || emailUser?.email || "";
  const isAuthorizedSigner = canUseDigitalSignatures(activeEmail);

  const [printMode, setPrintMode] = useState<"e_stamp" | "plain_a4">(initialPrintMode);
  const [activePage, setActivePage] = useState<number | "ALL">("ALL");
  const [showWatermarkGuide, setShowWatermarkGuide] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfStatusText, setPdfStatusText] = useState("");
  const [enableDigitalSignature, setEnableDigitalSignature] = useState<boolean>(
    () => isAuthorizedSigner && (agreement.status === "SIGNED" || agreement.status === "APPROVED" || agreement.status === "ACTIVE")
  );

  const isEStamp = printMode === "e_stamp";
  const totalPages = 4;

  const handlePrint = () => {
    // Check if popup print helper can be invoked for zero-bleed high precision print, or fallback to window.print
    try {
      const title = `${agreement.agreementNo}_${isEStamp ? "EStamp" : "Plain_A4"}_Agreement`;
      triggerPrint(title, "agreement-printable-root");
    } catch {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    setPdfStatusText("PDF തയ്യാറാക്കുന്നു...");
    try {
      await exportAgreementPdf(
        agreement,
        printMode,
        "agreement-printable-root",
        (status) => setPdfStatusText(status)
      );
    } catch (err) {
      console.error(err);
      window.print();
    } finally {
      setIsExportingPdf(false);
      setPdfStatusText("");
    }
  };

  const handleWhatsAppShare = () => {
    shareAgreementOnWhatsApp(agreement);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/95 backdrop-blur-md p-2 sm:p-4 md:p-6 flex flex-col items-center print:static print:bg-white print:p-0 print:m-0 print:overflow-visible print:z-auto print:block print:w-full">
      {/* ==================================================================== */}
      {/* TOP CONTROL BAR (Hidden in browser print mode) */}
      {/* ==================================================================== */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl p-4 mb-4 flex flex-col gap-3 shadow-2xl print:hidden sticky top-2 z-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Mode */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm border ${
              isEStamp
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
            }`}>
              {isEStamp ? "മുദ്ര" : "A4"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">
                  {isEStamp
                    ? "കേരള ഇ-സ്റ്റാമ്പ് കരാർ പ്രിന്റ് ലേഔട്ട്"
                    : "പ്ലെയിൻ A4 കരാർ പ്രിന്റ് ലേഔട്ട്"}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                  {agreement.agreementNo}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono">
                {isEStamp
                  ? "പേജ് 1: മുകൾഭാഗം 16cm ഇ-സ്റ്റാമ്പിനും താഴെഭാഗം 5cm മാർജിനുമായി ഒഴിച്ചിട്ട് മധ്യത്തിൽ ടൈപ്പ് ചെയ്തിരിക്കുന്നു (പ്രിന്റിലും PDF-ലും വാട്ടർമാർക്ക് വരില്ല)"
                  : "സാധാരണ A4 പേപ്പർ പ്രിന്റിംഗിനായുള്ള പൂർണ്ണ ലേഔട്ട്"}
              </p>
            </div>
          </div>

          {/* Action Buttons: Edit, PDF, WhatsApp, Print, Close */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stamp Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPrintMode("e_stamp")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  isEStamp
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="പേജ് 1 മുകളിൽ 16cm ഇ-സ്റ്റാമ്പ് സർട്ടിഫിക്കറ്റിനായി ഒഴിച്ചിടുക"
              >
                ഇ-സ്റ്റാമ്പ് (16cm Top)
              </button>
              <button
                onClick={() => setPrintMode("plain_a4")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  !isEStamp
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="സാധാരണ A4 മുഴുവൻ പേപ്പർ പ്രിന്റ്"
              >
                പ്ലെയിൻ A4
              </button>
            </div>

            {/* Watermark Guide Toggle (Only in E-Stamp mode) */}
            {isEStamp && (
              <button
                onClick={() => setShowWatermarkGuide(!showWatermarkGuide)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition border cursor-pointer ${
                  showWatermarkGuide
                    ? "bg-amber-950/60 text-amber-300 border-amber-600/60"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                }`}
                title="സ്ക്രീൻ പ്രിവ്യൂവിൽ 16cm ബോക്സ് കാണിക്കുക / ഒഴിവാക്കുക"
              >
                {showWatermarkGuide ? "വാട്ടർമാർക്ക് ഗൈഡ്: ON" : "വാട്ടർമാർക്ക് ഗൈഡ്: OFF"}
              </button>
            )}

            {/* Digital Signature & Seal Toggle (Restricted to Authorized Admins) */}
            <button
              onClick={() => {
                if (isAuthorizedSigner) {
                  setEnableDigitalSignature(!enableDigitalSignature);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 transition ${
                isAuthorizedSigner
                  ? enableDigitalSignature
                    ? "bg-emerald-700 hover:bg-emerald-600 text-white shadow-md shadow-emerald-950 ring-1 ring-emerald-400 cursor-pointer"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                  : "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-75"
              }`}
              title={
                isAuthorizedSigner
                  ? enableDigitalSignature
                    ? "ഡിജിറ്റൽ ഒപ്പും സീലും ഉൾപ്പെടുത്തിയിരിക്കുന്നു (ക്ലിക്ക് ചെയ്ത് ഒഴിവാക്കാം)"
                    : "ഡിജിറ്റൽ ഒപ്പും ഔദ്യോഗിക സീലും ഉൾപ്പെടുത്തുക"
                  : "ഡിജിറ്റൽ ഒപ്പും സീലും deepak.vasthusilpy@gmail.com & dibindeepak1@gmail.com ലോഗിനുകൾക്ക് മാത്രം"
              }
            >
              {isAuthorizedSigner ? (
                enableDigitalSignature ? (
                  <>
                    <Stamp className="w-3.5 h-3.5 text-emerald-300" />
                    <span>ഡിജിറ്റൽ ഒപ്പ്: ഉൾപ്പെടുത്തി</span>
                  </>
                ) : (
                  <>
                    <Stamp className="w-3.5 h-3.5 text-slate-400" />
                    <span>ഡിജിറ്റൽ ഒപ്പ് ഉൾപ്പെടുത്തുക</span>
                  </>
                )
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">ഡിജിറ്റൽ ഒപ്പ് (അഡ്മിൻ മാത്രം)</span>
                </>
              )}
            </button>

            {/* Edit Specs & Clauses Button */}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                title="സ്പെസിഫിക്കേഷനുകളും വ്യവസ്ഥകളും എഡിറ്റ് ചെയ്യുക"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>എഡിറ്റ് / തിരുത്തലുകൾ</span>
              </button>
            )}

            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-950 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPdf ? (pdfStatusText || "PDF...") : "PDF ഡൗൺലോഡ്"}</span>
            </button>

            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>വാട്സ്ആപ്പ്</span>
            </button>

            {/* Browser Print */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold font-mono rounded-xl flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>പ്രിന്റ് ചെയ്യുക</span>
            </button>

            {/* Close */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded-xl border border-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Page Switcher & Pagination Navigator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <button
              onClick={() => setActivePage("ALL")}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === "ALL"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              എല്ലാ പേജുകളും (All 4 Pages)
            </button>
            <button
              onClick={() => setActivePage(1)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === 1
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              പേജ് 1: ആമുഖവും കക്ഷികളും
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === 2
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              പേജ് 2: വിസ്തീർണ്ണവും പെയ്‌മെന്റും
            </button>
            <button
              onClick={() => setActivePage(3)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === 3
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              പേജ് 3: സാമഗ്രികളും സ്പെസിഫിക്കേഷനും
            </button>
            <button
              onClick={() => setActivePage(4)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activePage === 4
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              പേജ് 4: കരാർ നിബന്ധനകളും ഒപ്പും
            </button>
          </div>

          {/* Next / Previous Navigator */}
          {activePage !== "ALL" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivePage(prev => (prev === 1 ? totalPages : (prev as number) - 1))}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>മുമ്പത്തെ പേജ്</span>
              </button>
              <span className="text-slate-400 font-mono text-xs px-2">
                പേജ് <strong>{activePage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => setActivePage(prev => (prev === totalPages ? 1 : (prev as number) + 1))}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition"
              >
                <span>അടുത്ത പേജ്</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* PRINTABLE DOCUMENT ROOT - STRICT A4 DIMENSIONS (210mm x 297mm) */}
      {/* ==================================================================== */}
      <div
        id="agreement-printable-root"
        className="w-full max-w-4xl flex flex-col items-center gap-8 pb-16 print:w-full print:max-w-none print:gap-0 print:pb-0"
      >
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 0mm !important;
            }
            html, body {
              width: 210mm !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden,
            .estamp-watermark,
            [data-html2canvas-ignore="true"],
            [data-print-hide="true"],
            .no-print {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
            }
            .a4-printable-page {
              width: 210mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding-left: 20mm !important;
              padding-right: 15mm !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              overflow: hidden !important;
              position: relative !important;
            }
            .a4-page-estamp-1 {
              padding-top: 160mm !important;
              padding-bottom: 50mm !important;
            }
            .a4-regular-page {
              padding-top: 16mm !important;
              padding-bottom: 16mm !important;
            }
          }
          `
        }} />

        {/* ==================================================================== */}
        {/* PAGE 1: E-STAMP (16cm Top Clearance, 5cm Bottom Margin, Typed in between) */}
        {/* ==================================================================== */}
        {(activePage === "ALL" || activePage === 1) && (
          <div
            className={`a4-printable-page w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm relative flex flex-col justify-between box-border overflow-hidden ${
              isEStamp ? "a4-page-estamp-1 pt-[160mm] pb-[50mm] px-[20mm]" : "a4-regular-page p-[18mm]"
            } print:w-[210mm] print:h-[297mm] font-sans`}
            style={{ boxSizing: "border-box" }}
          >
            {/* Top Right Page Number ONLY (Required: Show Page Number Only On Top Right Corner) */}
            <div className="absolute top-3 right-4 print:top-4 print:right-4 text-right text-[10px] font-mono font-bold text-slate-700 tracking-wider">
              പേജ് 1 / 4
            </div>

            {/* E-Stamp Placeholder watermark in preview mode (Hidden in print and PDF) */}
            {isEStamp && showWatermarkGuide && (
              <>
                {/* 16cm Top Stamp Area Indicator */}
                <div
                  data-html2canvas-ignore="true"
                  data-print-hide="true"
                  className="estamp-watermark absolute top-0 left-0 right-0 h-[160mm] border-b-2 border-dashed border-amber-400/80 bg-amber-50/40 p-4 flex flex-col justify-center items-center text-center print:hidden z-10 pointer-events-none"
                >
                  <div className="max-w-md bg-white/90 border border-amber-300 rounded-2xl p-4 shadow-lg text-amber-900 space-y-1">
                    <div className="font-bold text-xs uppercase tracking-wider text-amber-800">
                      കേരള സർക്കാർ ഇ-സ്റ്റാമ്പ് സർട്ടിഫിക്കറ്റ് പതിക്കേണ്ട സ്ഥലം
                    </div>
                    <div className="text-[11px] font-mono text-amber-700">
                      FIRST PAGE TOP 16 CM (160 MM) IS RESERVED FOR KERALA E-STAMP CERTIFICATE
                    </div>
                    <div className="text-[10px] text-slate-600">
                      ഇ-സ്റ്റാമ്പ് പേപ്പറിൽ മുകളിൽ 16 സെ.മീറ്ററും താഴെ 5 സെ.മീറ്ററും ഒഴിവാക്കി മധ്യത്തിലാണ് കരാർ വരുന്നത്. (പ്രിന്റിൽ ഈ ബോക്സ് വരില്ല)
                    </div>
                  </div>
                </div>

                {/* 5cm Bottom Margin Area Indicator */}
                <div
                  data-html2canvas-ignore="true"
                  data-print-hide="true"
                  className="estamp-watermark absolute bottom-0 left-0 right-0 h-[50mm] border-t-2 border-dashed border-slate-300 bg-slate-50/30 flex items-center justify-center text-center print:hidden pointer-events-none"
                >
                  <span className="text-[10px] font-mono text-slate-400">
                    BOTTOM 5 CM (50 MM) MARGIN AREA (PRINT EXCLUDED)
                  </span>
                </div>
              </>
            )}

            {/* Typed Content in between 16cm Top and 5cm Bottom */}
            <div className="flex-1 flex flex-col justify-start">
              {/* Header for Plain A4 Mode */}
              {!isEStamp && (
                <div className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
                  <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-600">
                    GOVERNMENT OF KERALA APPROVED STANDARD CONTRACT FORMAT
                  </div>
                  <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight font-serif mt-0.5">
                    കെട്ടിട നിർമ്മാണ കരാർ ഉടമ്പടി പത്രം
                  </h1>
                  <h2 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest font-mono">
                    BUILDING CONSTRUCTION WORK AGREEMENT
                  </h2>
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-700 mt-1.5 pt-1 border-t border-slate-300">
                    <span>കരാർ നമ്പർ: <strong>{agreement.agreementNo}</strong></span>
                    <span>തീയതി: <strong>{agreement.agreementDate}</strong></span>
                    <span>സ്ഥലം: <strong>{agreement.place || settings.agreementTemplate.place || "പാലക്കാട്"}</strong></span>
                  </div>
                </div>
              )}

              {/* Minimal header for E-Stamp mode */}
              {isEStamp && (
                <div className="text-center mb-2 border-b border-slate-800 pb-1">
                  <h1 className="text-sm font-black uppercase tracking-tight text-slate-950 font-serif">
                    കെട്ടിട നിർമ്മാണ കരാർ ഉടമ്പടി പത്രം (WORK AGREEMENT)
                  </h1>
                  <div className="flex justify-between text-[10px] font-mono text-slate-700 mt-0.5">
                    <span>കരാർ നമ്പർ: <strong>{agreement.agreementNo}</strong></span>
                    <span>തീയതി: <strong>{agreement.agreementDate}</strong></span>
                    <span>സ്ഥലം: <strong>{agreement.place || "കേരളശ്ശേരി"}</strong></span>
                  </div>
                </div>
              )}

              {/* Parties Preamble in legal Malayalam */}
              <div className="space-y-2 text-justify leading-snug text-[11px] text-slate-900">
                <p className="indent-4 text-[10.5px]">
                  <strong>{agreement.agreementDate}</strong>-ാം തീയതി <strong>{agreement.place || "കേരളശ്ശേരി"}</strong> വെച്ച് താഴെ പേരും മേൽവിലാസവും വിവരിക്കുന്ന ഒന്നാം കക്ഷിയും രണ്ടാം കക്ഷിയും ചേർന്ന് പൂർണ്ണ മനസ്സോടെ ഒപ്പുവെച്ച കെട്ടിട നിർമ്മാണ കരാർ ഉടമ്പടി:
                </p>

                {/* First Party (Client) */}
                <div className="bg-slate-50 border border-slate-300 p-2 rounded text-[10.5px] space-y-0.5">
                  <div className="font-bold text-slate-950 border-b border-slate-200 pb-0.5 flex justify-between">
                    <span>ഒന്നാം കക്ഷി (കെട്ടിട ഉടമസ്ഥൻ / CLIENT / FIRST PARTY):</span>
                    <span className="font-mono text-[10px]">{agreement.client.mobileNumber}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{agreement.client.clientName}</div>
                  <div>മേൽവിലാസം: {agreement.client.houseName ? `${agreement.client.houseName}, ` : ""}{agreement.client.address}, {agreement.client.localBody}, {agreement.client.taluk}, {agreement.client.district} - {agreement.client.pinCode}</div>
                  {agreement.client.panOrIdNumber && <div className="text-[10px] text-slate-600">ID / ആധാർ / PAN: {agreement.client.panOrIdNumber}</div>}
                </div>

                {/* Second Party (Contractor) */}
                <div className="bg-slate-50 border border-slate-300 p-2 rounded text-[10.5px] space-y-0.5">
                  <div className="font-bold text-slate-950 border-b border-slate-200 pb-0.5 flex justify-between">
                    <span>രണ്ടാം കക്ഷി (നിർമ്മാണ കോൺട്രാക്ടർ / BUILDER / SECOND PARTY):</span>
                    <span className="font-mono text-[10px]">{agreement.contractor.phone}</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{agreement.contractor.companyName}</div>
                  <div>പ്രൊപ്രൈറ്റർ / എൻജിനീയർ: <strong>{agreement.contractor.proprietorName}</strong>, {agreement.contractor.address}</div>
                </div>

                {/* Subject Matter */}
                <p className="indent-4 text-[10.5px]">
                  ഒന്നാം കക്ഷിയുടെ ഉടമസ്ഥതയിലുള്ളതും <strong>{agreement.location.fullAddress || agreement.client.siteAddress}</strong> സ്ഥിതി ചെയ്യുന്നതുമായ സ്ഥലത്ത്, നിശ്ചയിച്ചിട്ടുള്ള പ്ലാൻ പ്രകാരം <strong>{agreement.projectType}</strong> രീതിയിലുള്ള <strong>{agreement.roofingType}</strong> കെട്ടിടം നിർമ്മിക്കുന്നതിന് ഇരുകക്ഷികളും പരസ്പരം സമ്മതിച്ച് താഴെ പറയുന്ന നിബന്ധനകൾക്കും നിരക്കുകൾക്കും വിധേയമായി ഈ കരാറിൽ ഏർപ്പെടുന്നു.
                </p>
              </div>
            </div>

            {/* Page 1 Footer: DUAL SIGNATURE LINES ON ALL PAGES */}
            <div className="border-t border-slate-400 pt-1.5 flex justify-between items-center text-[10px] font-mono text-slate-800">
              <div>
                <span>ഒന്നാം കക്ഷി (Client / Owner): </span>
                <span className="font-serif">...........................................</span>
              </div>
              <div>
                <span>രണ്ടാം കക്ഷി (Contractor / Builder): </span>
                <span className="font-serif">...........................................</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PAGE 2: FLOOR AREAS, FINANCIALS & PAYMENT SCHEDULE */}
        {/* ==================================================================== */}
        {(activePage === "ALL" || activePage === 2) && (
          <div
            className="a4-printable-page a4-regular-page w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-[18mm] relative flex flex-col justify-between box-border overflow-hidden print:w-[210mm] print:h-[297mm] font-sans"
            style={{ boxSizing: "border-box" }}
          >
            {/* Top Right Page Number ONLY */}
            <div className="absolute top-3 right-4 print:top-4 print:right-4 text-right text-[10px] font-mono font-bold text-slate-700 tracking-wider">
              പേജ് 2 / 4
            </div>

            <div>
              {/* Header */}
              <div className="border-b border-slate-400 pb-1.5 mb-3 flex justify-between items-center text-xs font-mono text-slate-600">
                <span className="font-bold">{agreement.agreementNo} - കെട്ടിട നിർമ്മാണ കരാർ</span>
                <span className="text-[11px] text-slate-500">{agreement.agreementDate}</span>
              </div>

              {/* 1. Floor Areas & Cost Details */}
              <h3 className="text-xs font-bold text-slate-950 font-serif mb-2 border-l-4 border-slate-900 pl-2">
                1. കെട്ടിട വിസ്തീർണ്ണവും സാമ്പത്തിക നിബന്ധനകളും (Floor Areas & Cost Breakdown)
              </h3>

              {/* Floor Areas Table */}
              <table className="w-full border-collapse border border-slate-300 text-[11px] mb-2.5">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                    <th className="border border-slate-300 p-1.5 text-left">നില (Floor Name)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">നിലവിലുള്ളത് (Existing)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-20">നിർദ്ദിഷ്ടം (Proposed)</th>
                    <th className="border border-slate-300 p-1.5 text-right w-24">ആകെ (Total)</th>
                  </tr>
                </thead>
                <tbody>
                  {agreement.floors.map((floor, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-1 font-semibold">{floor.floorName}</td>
                      <td className="border border-slate-300 p-1 text-right font-mono">{(floor.existingAreaSqFt || 0).toLocaleString()}</td>
                      <td className="border border-slate-300 p-1 text-right font-mono">{(floor.proposedAreaSqFt || 0).toLocaleString()}</td>
                      <td className="border border-slate-300 p-1 text-right font-mono font-bold">{floor.areaSqFt.toLocaleString()} Sq.Ft</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-950">
                    <td className="border border-slate-300 p-1">ആകെ വിസ്തീർണ്ണം (Total Built-up Area)</td>
                    <td className="border border-slate-300 p-1 text-right font-mono">
                      {agreement.floors.reduce((s, f) => s + (f.existingAreaSqFt || 0), 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-1 text-right font-mono">
                      {agreement.floors.reduce((s, f) => s + (f.proposedAreaSqFt || 0), 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-300 p-1 text-right font-mono text-xs">{agreement.totalBuiltUpArea.toLocaleString()} Sq.Ft</td>
                  </tr>
                  <tr className="bg-slate-50 text-[9px] font-mono">
                    <td colSpan={4} className="border border-slate-300 p-1">
                      നിലകളുടെ എണ്ണം (Number of Floors): {agreement.floors.length} | റൂഫിംഗ്: {agreement.roofingType} | ഫ്ലോറിംഗ്: {agreement.flooringType}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Breakdown Card */}
              <div className="bg-slate-50 border border-slate-300 rounded p-2.5 mb-3 space-y-1 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                  <span className="text-slate-700">ചതുരശ്രയടി നിർമ്മാണ നിരക്ക് (Rate / Sq.Ft):</span>
                  <span className="font-mono font-bold text-slate-950">{formatIndianCurrency(agreement.baseRatePerSqFt, false)} / Sq.Ft</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-slate-200">
                  <span className="text-slate-700">പ്രാഥമിക നിർമ്മാണ അടങ്കൽ തുക (Estimated Cost):</span>
                  <span className="font-mono font-bold text-slate-900">{formatIndianCurrency(agreement.estimatedConstructionCost)}</span>
                </div>
                {agreement.additionalCosts > 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200 text-slate-700">
                    <span>അധിക ജോലികൾ / പ്രത്യേക ഇനങ്ങൾ (Additional Works):</span>
                    <span className="font-mono">+{formatIndianCurrency(agreement.additionalCosts)}</span>
                  </div>
                )}
                {agreement.discount > 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-200 text-emerald-800">
                    <span>പ്രത്യേക ഇളവ് (Discount / Concession):</span>
                    <span className="font-mono">-{formatIndianCurrency(agreement.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-0.5 text-xs font-bold text-slate-950">
                  <span>ആകെ കരാർ തുക (Final Total Contract Amount):</span>
                  <span className="font-mono text-sm text-slate-950">{formatIndianCurrency(agreement.finalContractAmount)}</span>
                </div>
                <div className="text-[10.5px] text-slate-800 pt-0.5">
                  <strong>തുക അക്ഷരത്തിൽ:</strong> {agreement.amountInWordsMl ? `${agreement.amountInWordsMl} രൂപ മാത്രം` : agreement.amountInWords}
                </div>
              </div>

              {/* Extra Works Table if any */}
              {agreement.extraWorks && agreement.extraWorks.length > 0 && (
                <div className="mb-2.5">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wide mb-1">
                    അധിക നിർമ്മാണ ജോലികളുടെ പട്ടിക (Extra Works Schedule)
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800">
                        <th className="border border-slate-300 p-1 text-left">ഇനം / ജോലി</th>
                        <th className="border border-slate-300 p-1 text-center w-16">അളവ്</th>
                        <th className="border border-slate-300 p-1 text-right w-20">നിരക്ക്</th>
                        <th className="border border-slate-300 p-1 text-right w-24">ആകെ തുക</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agreement.extraWorks.map((ew, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                          <td className="border border-slate-300 p-1 font-medium">{ew.nameMl || ew.name}</td>
                          <td className="border border-slate-300 p-1 text-center font-mono">{ew.quantity} {ew.unit}</td>
                          <td className="border border-slate-300 p-1 text-right font-mono">{formatIndianCurrency(ew.unitRate, false)}</td>
                          <td className="border border-slate-300 p-1 text-right font-mono font-bold">{formatIndianCurrency(ew.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. Payment Stages Schedule */}
              <h3 className="text-xs font-bold text-slate-950 font-serif mb-1.5 border-l-4 border-slate-900 pl-2">
                2. ഘട്ടം തിരിച്ചുള്ള പെയ്‌മെന്റ് ഷെഡ്യൂൾ (Stage-Wise Payment Schedule)
              </h3>

              <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <th className="border border-slate-300 p-1 text-center w-8">No</th>
                    <th className="border border-slate-300 p-1 text-left">നിർമ്മാണ ഘട്ടം (Stage)</th>
                    <th className="border border-slate-300 p-1 text-center w-10">%</th>
                    <th className="border border-slate-300 p-1 text-right w-24">തുക (Amount)</th>
                    <th className="border border-slate-300 p-1 text-left">പെയ്‌മെന്റ് നിബന്ധന (Trigger)</th>
                  </tr>
                </thead>
                <tbody>
                  {agreement.paymentSchedule.map((ps, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-0.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 p-0.5 font-semibold">{ps.stageNameMl || ps.stageName}</td>
                      <td className="border border-slate-300 p-0.5 text-center font-mono">{ps.percentage}%</td>
                      <td className="border border-slate-300 p-0.5 text-right font-mono font-bold">{formatIndianCurrency(ps.amount)}</td>
                      <td className="border border-slate-300 p-0.5 text-slate-700 text-[10px]">{ps.remarks || "ഘട്ടം പൂർത്തിയാകുമ്പോൾ"}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-950">
                    <td colSpan={2} className="border border-slate-300 p-1 text-right">ആകെ പെയ്‌മെന്റ് തുക</td>
                    <td className="border border-slate-300 p-1 text-center font-mono">
                      {agreement.paymentSchedule.reduce((sum, s) => sum + s.percentage, 0)}%
                    </td>
                    <td className="border border-slate-300 p-1 text-right font-mono text-xs">
                      {formatIndianCurrency(agreement.paymentSchedule.reduce((sum, s) => sum + s.amount, 0))}
                    </td>
                    <td className="border border-slate-300 p-1"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Page 2 Footer: DUAL SIGNATURE LINES ON ALL PAGES */}
            <div className="border-t border-slate-400 pt-1.5 flex justify-between items-center text-[10px] font-mono text-slate-800">
              <div>
                <span>ഒന്നാം കക്ഷി (Client / Owner): </span>
                <span className="font-serif">...........................................</span>
              </div>
              <div>
                <span>രണ്ടാം കക്ഷി (Contractor / Builder): </span>
                <span className="font-serif">...........................................</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PAGE 3: DETAILED SPECIFICATIONS (MATERIALS & QUALITY) */}
        {/* ==================================================================== */}
        {(activePage === "ALL" || activePage === 3) && (
          <div
            className="a4-printable-page a4-regular-page w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-[18mm] relative flex flex-col justify-between box-border overflow-hidden print:w-[210mm] print:h-[297mm] font-sans"
            style={{ boxSizing: "border-box" }}
          >
            {/* Top Right Page Number ONLY */}
            <div className="absolute top-3 right-4 print:top-4 print:right-4 text-right text-[10px] font-mono font-bold text-slate-700 tracking-wider">
              പേജ് 3 / 4
            </div>

            <div>
              {/* Header */}
              <div className="border-b border-slate-400 pb-1.5 mb-2.5 flex justify-between items-center text-xs font-mono text-slate-600">
                <span className="font-bold">{agreement.agreementNo} - കെട്ടിട നിർമ്മാണ കരാർ</span>
                <span className="text-[11px] text-slate-500">{agreement.agreementDate}</span>
              </div>

              <h3 className="text-xs font-bold text-slate-950 font-serif mb-2 border-l-4 border-slate-900 pl-2">
                3. നിർമ്മാണ സാമഗ്രികളും സാങ്കേതിക സ്പെസിഫിക്കേഷനുകളും (Work Specifications & Quality Standards)
              </h3>

              <div className="space-y-2 text-[10.5px] leading-snug">
                {/* A. Substructure */}
                <div className="border border-slate-300 p-2 rounded bg-slate-50">
                  <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[11px]">
                    A. അടിത്തറയും ബേസ്മെന്റും (Substructure & Foundation)
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                    <li><strong>ഫൗണ്ടേഷൻ രീതി:</strong> {agreement.specifications.substructure.foundation}</li>
                    <li><strong>മേസൺറി & ബേസ്മെന്റ്:</strong> {agreement.specifications.substructure.foundationMasonry}, {agreement.specifications.substructure.basementMasonry}</li>
                    <li><strong>പ്ലിന്ത് ബെൽറ്റ് & കോൺക്രീറ്റ്:</strong> {agreement.specifications.substructure.rccBelt}</li>
                    <li><strong>സിമന്റ് & സ്റ്റീൽ സ്പെസിഫിക്കേഷൻ:</strong> {agreement.specifications.substructure.cementSpec} സിമന്റും {agreement.specifications.substructure.steelSpec} കമ്പികളും. മണൽ: {agreement.specifications.substructure.sandSpec}.</li>
                    {agreement.specifications.substructure.customItems?.map((ci, idx) => (
                      <li key={idx}><strong>{ci.titleMl || ci.title}:</strong> {ci.specification}</li>
                    ))}
                  </ul>
                </div>

                {/* B. Superstructure */}
                <div className="border border-slate-300 p-2 rounded bg-slate-50">
                  <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[11px]">
                    B. ഭിത്തികളും കോൺക്രീറ്റും (Superstructure & RCC Works)
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-800">
                    <li><strong>ഭിത്തി നിർമ്മാണം:</strong> {agreement.specifications.superstructure.masonry}</li>
                    <li><strong>മേൽക്കൂര സ്ലാബ് & ബീമുകൾ:</strong> {agreement.specifications.superstructure.mainRoofSlab} ({agreement.specifications.superstructure.concreteMaterials})</li>
                    <li><strong>ലിന്റൽ, ബെൽറ്റ് & സൺഷെയ്ഡ്:</strong> {agreement.specifications.superstructure.lintel}, {agreement.specifications.superstructure.sunshade}</li>
                    <li><strong>പ്ലാസ്റ്ററിംഗ്:</strong> {agreement.specifications.superstructure.plastering} (ഉള്ളിലും പുറത്തും സുഗമമായ ഫിനിഷിംഗ്).</li>
                    {agreement.specifications.superstructure.customItems?.map((ci, idx) => (
                      <li key={idx}><strong>{ci.titleMl || ci.title}:</strong> {ci.specification}</li>
                    ))}
                  </ul>
                </div>

                {/* C. Sanitary & Plumbing */}
                <div className="border border-slate-300 p-2 rounded bg-slate-50">
                  <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[11px]">
                    C. പ്ലംബിംഗ് & സാനിറ്ററി ഫിറ്റിംഗ്സ് (Plumbing & Sanitary)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-slate-800">
                    {agreement.specifications.sanitary.map((san, idx) => (
                      <div key={idx} className="border-b border-slate-200 pb-0.5">
                        <strong>{san.nameMl || san.name}:</strong> {san.quantity} {san.unit} ({san.isIncluded ? `₹${san.maxAllowedRate} വരെ` : "ഉൾപ്പെടുത്തിയിട്ടില്ല"})
                      </div>
                    ))}
                  </div>
                </div>

                {/* D. Electrical Works */}
                <div className="border border-slate-300 p-2 rounded bg-slate-50">
                  <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[11px]">
                    D. ഇലക്ട്രിക്കൽ വയറിംഗും സ്വിച്ചുകളും (Electrical Works)
                  </div>
                  <p className="text-slate-800">
                    {agreement.specifications.electrical.wiring} കേബിൾ ബ്രാൻഡ്: <strong>{agreement.specifications.electrical.cableBrand}</strong>, സ്വിച്ചുകൾ: <strong>{agreement.specifications.electrical.switchBrand}</strong>. ഡിസ്ട്രിബ്യൂഷൻ ബോർഡ്: {agreement.specifications.electrical.dbBreakers}.
                  </p>
                  <div className="flex flex-wrap gap-1 text-[9.5px] text-slate-700 mt-1 font-mono">
                    {agreement.specifications.electrical.points.map((pt, idx) => (
                      <span key={idx} className="bg-slate-200 px-1 py-0.2 rounded">
                        {pt.nameMl || pt.name}: {pt.pointCount} Nos
                      </span>
                    ))}
                  </div>
                </div>

                {/* E. Flooring & Painting */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-slate-300 p-2 rounded bg-slate-50">
                    <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[10.5px]">
                      E. ഫ്ലോറിംഗ് (Flooring)
                    </div>
                    <ul className="list-disc pl-3 text-slate-800 space-y-0.5 text-[10px]">
                      {agreement.specifications.flooring.map((fl, idx) => (
                        <li key={idx}><strong>{fl.areaName}:</strong> {fl.material} (₹{fl.ratePerSqFt}/Sq.Ft)</li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-300 p-2 rounded bg-slate-50">
                    <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[10.5px]">
                      F. വാതിലുകൾ & പെയിന്റിംഗ് (Doors & Paint)
                    </div>
                    <ul className="list-disc pl-3 text-slate-800 space-y-0.5 text-[10px]">
                      <li><strong>പ്രധാന വാതിൽ:</strong> {agreement.specifications.doorsWindows[0]?.specification || "തേക്ക് തടി"}</li>
                      <li><strong>ഇന്റീരിയർ:</strong> {agreement.specifications.painting.interior.brand} (2 കോട്ട് പുട്ടി + പ്രൈമർ)</li>
                      <li><strong>എക്സ്റ്റീരിയർ:</strong> {agreement.specifications.painting.exterior.brand} (വെതർ പ്രൂഫ്)</li>
                    </ul>
                  </div>
                </div>

                {/* G. Custom Additional Specifications (if any) */}
                {agreement.specifications.customSpecs && agreement.specifications.customSpecs.length > 0 && (
                  <div className="border border-slate-300 p-2 rounded bg-slate-50">
                    <div className="font-bold text-slate-950 uppercase border-b border-slate-200 pb-0.5 mb-0.5 text-[10.5px]">
                      G. പ്രത്യേക സ്പെസിഫിക്കേഷനുകൾ (Custom Specifications)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-slate-800 text-[10px]">
                      {agreement.specifications.customSpecs.map((cs, idx) => (
                        <div key={idx} className="border-b border-slate-200 pb-0.5">
                          <strong>{cs.nameMl || cs.titleMl || cs.name || cs.title}:</strong> {cs.value || cs.specification}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Page 3 Footer: DUAL SIGNATURE LINES ON ALL PAGES */}
            <div className="border-t border-slate-400 pt-1.5 flex justify-between items-center text-[10px] font-mono text-slate-800">
              <div>
                <span>ഒന്നാം കക്ഷി (Client / Owner): </span>
                <span className="font-serif">...........................................</span>
              </div>
              <div>
                <span>രണ്ടാം കക്ഷി (Contractor / Builder): </span>
                <span className="font-serif">...........................................</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* PAGE 4: GENERAL CONDITIONS, QR CODE & SIGNATURES */}
        {/* ==================================================================== */}
        {(activePage === "ALL" || activePage === 4) && (
          <div
            className="a4-printable-page a4-regular-page w-[210mm] min-h-[297mm] max-h-[297mm] h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm p-[18mm] relative flex flex-col justify-between box-border overflow-hidden print:w-[210mm] print:h-[297mm] font-sans"
            style={{ boxSizing: "border-box" }}
          >
            {/* Top Right Page Number ONLY */}
            <div className="absolute top-3 right-4 print:top-4 print:right-4 text-right text-[10px] font-mono font-bold text-slate-700 tracking-wider">
              പേജ് 4 / 4
            </div>

            <div>
              {/* Header */}
              <div className="border-b border-slate-400 pb-1.5 mb-2.5 flex justify-between items-center text-xs font-mono text-slate-600">
                <span className="font-bold">{agreement.agreementNo} - കെട്ടിട നിർമ്മാണ കരാർ</span>
                <span className="text-[11px] text-slate-500">{agreement.agreementDate}</span>
              </div>

              <h3 className="text-xs font-bold text-slate-950 font-serif mb-1.5 border-l-4 border-slate-900 pl-2">
                4. പൊതുവായ കരാർ വ്യവസ്ഥകൾ (General Terms & Conditions)
              </h3>

              {/* Complete Legal Clauses in Malayalam */}
              <div className="space-y-1 text-[10px] text-slate-900 text-justify leading-snug mb-3">
                {agreement.clauses.filter(c => c.isEnabled).map((clause) => (
                  <div key={clause.id} className="pb-0.5">
                    <span className="font-bold text-slate-950">{clause.clauseNo}. {clause.titleMl || clause.title}:</span>{" "}
                    <span>{clause.contentMl || clause.content}</span>
                  </div>
                ))}
              </div>

              {/* Digital QR Authentication Box */}
              <div className="border-2 border-slate-800 rounded-xl p-2 bg-slate-50 flex items-center justify-between mb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px] uppercase tracking-wide">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>ഡിജിറ്റൽ വെരിഫിക്കേഷൻ സർട്ടിഫിക്കറ്റ് (DIGITAL AUTHENTICATION)</span>
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-800">
                    കരാർ ഐഡി: <strong>{agreement.agreementNo}</strong> | ടോക്കൺ: <strong>{agreement.verificationToken}</strong>
                  </div>
                  <div className="text-[9.5px] text-slate-600">
                    ഈ കരാർ രേഖയുടെ ആധികാരികത പരിശോധിക്കുന്നതിനായി വലതുവശത്തെ QR കോഡ് സ്കാൻ ചെയ്യുക.
                  </div>
                </div>
                {agreement.qrCodeDataUrl ? (
                  <img
                    src={agreement.qrCodeDataUrl}
                    alt="Verification QR Code"
                    className="w-14 h-14 border border-slate-300 rounded bg-white p-0.5"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-14 h-14 border border-slate-300 rounded bg-slate-200 flex items-center justify-center text-[9px] text-slate-500 font-mono text-center">
                    QR VERIFIED
                  </div>
                )}
              </div>

              {/* Formal Signature Blocks */}
              <div className="border-t-2 border-slate-900 pt-2">
                <div className="text-center font-bold text-[10px] uppercase tracking-widest text-slate-700 mb-2">
                  സാക്ഷികളുടെ സാന്നിധ്യത്തിൽ ഒപ്പുവെച്ച കക്ഷികൾ (SIGNATURE OF PARTIES & WITNESSES)
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  {/* First Party Box */}
                  <div className="border border-slate-300 p-2 rounded bg-white space-y-1">
                    <div className="font-bold text-[10px] text-slate-950 border-b border-slate-200 pb-0.5">
                      ഒന്നാം കക്ഷി / ഉടമസ്ഥൻ (CLIENT)
                    </div>
                    <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 text-slate-400 text-[10px] font-serif">
                      (ഒപ്പ് / Signature)
                    </div>
                    <div className="text-[10px] space-y-0.5">
                      <div>പേര്: <strong>{agreement.client.clientName}</strong></div>
                      <div>തീയതി: {agreement.agreementDate}</div>
                      <div>സ്ഥലം: {agreement.place || "കേരളശ്ശേരി"}</div>
                    </div>
                  </div>

                  {/* Second Party Box */}
                  <div className="border border-slate-300 p-2 rounded bg-white space-y-1 relative">
                    <div className="font-bold text-[10px] text-slate-950 border-b border-slate-200 pb-0.5 flex justify-between items-center">
                      <span>രണ്ടാം കക്ഷി / കോൺട്രാക്ടർ (BUILDER)</span>
                      {enableDigitalSignature && isAuthorizedSigner && (
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded border border-emerald-300">
                          ✓ DIGITALLY SIGNED
                        </span>
                      )}
                    </div>

                    {enableDigitalSignature && isAuthorizedSigner ? (
                      <div className="min-h-[50px] border border-emerald-700/60 bg-emerald-50/50 rounded p-1.5 flex flex-col justify-between text-[9px] font-mono text-emerald-950">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 uppercase">
                            {agreement.contractor.proprietorName || "Er. Deepak"}
                          </span>
                          <span className="text-[7.5px] text-emerald-700 font-bold">
                            DIGITAL SEAL
                          </span>
                        </div>
                        <div className="text-[8px] text-slate-700 italic font-serif my-0.5">
                          {agreement.contractor.companyName} • Reg: LSGD/2018/KL
                        </div>
                        <div className="text-[7.5px] text-emerald-800 flex justify-between items-center border-t border-emerald-200 pt-0.5">
                          <span>Auth: {activeEmail}</span>
                          <span>{agreement.agreementDate}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-10 border-b border-dashed border-slate-400 flex items-end justify-center pb-0.5 text-slate-400 text-[10px] font-serif">
                        (സീലും ഒപ്പും / Seal & Signature)
                      </div>
                    )}

                    <div className="text-[10px] space-y-0.5">
                      <div>പേര്: <strong>{agreement.contractor.proprietorName}</strong></div>
                      <div>സ്ഥാപനം: <strong>{agreement.contractor.companyName}</strong></div>
                      <div>തീയതി: {agreement.agreementDate}</div>
                    </div>
                  </div>
                </div>

                {/* Witnesses */}
                <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-slate-200 pt-1.5">
                  <div>
                    <div className="font-bold text-slate-900 mb-0.5">സാക്ഷി 1 (WITNESS 1):</div>
                    <div className="text-slate-700">പേര്: {agreement.witness1?.name || "..........................................................."}</div>
                    <div className="text-slate-700">മേൽവിലാസം: {agreement.witness1?.address || "..........................................................."}</div>
                    <div className="mt-1.5 pt-0.5 border-t border-dotted border-slate-400 text-slate-400">ഒപ്പ് (Signature)</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 mb-0.5">സാക്ഷി 2 (WITNESS 2):</div>
                    <div className="text-slate-700">പേര്: {agreement.witness2?.name || "..........................................................."}</div>
                    <div className="text-slate-700">മേൽവിലാസം: {agreement.witness2?.address || "..........................................................."}</div>
                    <div className="mt-1.5 pt-0.5 border-t border-dotted border-slate-400 text-slate-400">ഒപ്പ് (Signature)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 4 Footer: DUAL SIGNATURE LINES ON ALL PAGES */}
            <div className="border-t border-slate-400 pt-1.5 flex justify-between items-center text-[10px] font-mono text-slate-800">
              <div>
                <span>ഒന്നാം കക്ഷി (Client / Owner): </span>
                <span className="font-serif">...........................................</span>
              </div>
              <div>
                <span>രണ്ടാം കക്ഷി (Contractor / Builder): </span>
                <span className="font-serif">...........................................</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

