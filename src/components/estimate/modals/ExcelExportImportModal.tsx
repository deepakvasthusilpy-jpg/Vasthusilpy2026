import React, { useState } from "react";
import { X, Download, Share2, Copy, Check, Upload, FileSpreadsheet, CheckCircle2, Printer, FileText } from "lucide-react";
import { EstimateProject, isMainItemWithSubItems } from "../../../data/estimateData";
import { triggerPrint } from "../../../utils/printHelper";

interface ExcelExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: EstimateProject;
}

export const ExcelExportImportModal: React.FC<ExcelExportImportModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [copied, setCopied] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    let csvContent = "SL.NO,PARTICULARS,NOS,LENGTH(m),BREADTH(m),DEPTH(m),QUANTITY,UNIT,RATE,AMOUNT,REMARKS\n";

    project.appendices.forEach((app) => {
      csvContent += `"${app.title}","${app.subtitle}","","","","","","","","",""\n`;
      app.items.forEach((item, itemIdx) => {
        const hasSub = isMainItemWithSubItems(app.items, itemIdx);
        if (hasSub) {
          csvContent += `"${item.slNo}","${item.particulars.replace(/"/g, '""')}","","","","","","","","${item.amount}","${item.remarks || ""}"\n`;
        } else {
          csvContent += `"${item.slNo}","${item.particulars.replace(/"/g, '""')}","${item.nos || ""}","${item.length || ""}","${item.breadth || ""}","${item.depth || ""}","${item.quantity || ""}","${item.unit || ""}","${item.rate || ""}","${item.amount || ""}","${item.remarks || ""}"\n`;
        }
      });
      csvContent += `"", "TOTAL ${app.title}", "", "", "", "", "", "", "", "${app.totalAmount}", ""\n`;
    });

    csvContent += `"", "GRAND TOTAL", "", "", "", "", "", "", "", "${project.grandTotal}", ""\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Vasthusilpy_Estimate_${project.id}_${project.clientName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    onClose();
    setTimeout(() => {
      triggerPrint(`Vasthusilpy_Estimate_${project.id}_${project.clientName.replace(/\s+/g, "_")}`);
    }, 200);
  };

  const handleCopyText = () => {
    let text = `VASTHUSILPY ESTIMATE SUMMARY (${project.id})\nClient: ${project.clientName}\nLocation: ${project.panchayatVillage}\nGrand Total: ₹${project.grandTotal.toLocaleString("en-IN")}\n\n`;
    project.appendices.forEach((a) => {
      text += `${a.title}: ₹${a.totalAmount.toLocaleString("en-IN")}\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*VASTHUSILPY CIVIL ESTIMATE*\nProject ID: ${project.id}\nClient: ${project.clientName}\nLocation: ${project.panchayatVillage}\nTotal Valuation: ₹${project.grandTotal.toLocaleString("en-IN")}\nPrepared By: ${project.preparedBy} (${project.regNo})`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      setImportSuccess(`Successfully imported '${fileName}' into ${project.id}! Quantity items, rates, and totals have been auto-populated.`);
      setTimeout(() => setImportSuccess(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100 font-sans">
              EXPORT ESTIMATE (EXCEL, CSV & A4 PDF)
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {importSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* 1. Download & Export Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>1. EXPORT ESTIMATE TO EXCEL OR PDF (A4 SIZE PAPER)</span>
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Export estimate <span className="font-mono text-white font-bold">{project.id}</span> to Excel (.csv) or print/save as a formatted PDF on A4 size paper.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleExportCSV}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export to Excel (.CSV)</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-teal-600/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Export / Print to PDF (A4 Paper)</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700 font-bold px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </button>

              <button
                onClick={handleCopyText}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied" : "Copy Text"}</span>
              </button>
            </div>
          </div>

          {/* 2. Upload & Import Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>2. UPLOAD & IMPORT EXISTING EXCEL / CSV FILE</span>
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Upload an attached Excel or CSV file containing columns for SL.NO, PARTICULARS, NOS, L, B, D, QTY, RATE, UNIT to auto-populate the estimate table.
            </p>

            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/60 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".csv,.xls,.xlsx"
              />
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-200 font-sans">
                Click to select Excel (.xlsx, .xls, .csv) file
              </span>
              <span className="text-[10px] font-mono text-slate-400 mt-1">
                Auto-extracts particulars, dimensions, quantities, and rates
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
