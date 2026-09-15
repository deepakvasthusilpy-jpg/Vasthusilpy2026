import React, { useState } from "react";
import { Quotation, QuotationService, Contractor, TermsClause } from "../../types";
import { getComputedStatus } from "../../utils/quotationStorageManager";
import { triggerPrint } from "../../utils/printHelper";
import { QuotationInteractiveSheet } from "./QuotationInteractiveSheet";
import { Printer, X, FileText, Check, Edit3, Save } from "lucide-react";

interface QuotationPrintDocumentProps {
  quotation: Quotation;
  services: QuotationService[];
  contractors: Contractor[];
  termsClauses: TermsClause[];
  onClose: () => void;
  onEdit?: (quotation: Quotation) => void;
  onSave?: (quotation: Quotation) => void;
}

export const QuotationPrintDocument: React.FC<QuotationPrintDocumentProps> = ({
  quotation: initialQuotation,
  contractors,
  termsClauses,
  onClose,
  onEdit,
  onSave
}) => {
  const [currentQuotation, setCurrentQuotation] = useState<Quotation>(initialQuotation);
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const computedStatus = getComputedStatus(currentQuotation);

  const handleDocumentChange = (updated: Quotation) => {
    setCurrentQuotation(updated);
    setHasChanges(true);
    setSavedSuccess(false);
  };

  const handleSaveDocument = () => {
    if (onSave) {
      onSave(currentQuotation);
      setHasChanges(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handlePrint = () => {
    const docTitle = currentQuotation.document_title || "Quotation";
    const clientSanitized = (currentQuotation.client_name || "Client").replace(/\s+/g, "_");
    triggerPrint(
      `${docTitle}_${currentQuotation.quotation_no}_${clientSanitized}`,
      "printable-quotation-sheet",
      { pageMargin: "10mm", paperSize: "A4 portrait" }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col items-center p-3 sm:p-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl p-4 mb-4 flex flex-wrap items-center justify-between gap-3 text-white shadow-2xl print:hidden sticky top-2 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                {currentQuotation.quotation_no}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  computedStatus === "approved"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : computedStatus === "pending"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : computedStatus === "expiring_soon"
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                    : computedStatus === "expired"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    : "bg-slate-700 text-slate-300"
                }`}
              >
                {computedStatus.replace("_", " ")}
              </span>

              {isEditMode && (
                <span className="text-[10px] text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  Click any text to edit directly
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {currentQuotation.client_name || "Untitled Client"} • {currentQuotation.site_address || "No site specified"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle inline editing on document */}
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
              isEditMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle whether you can click text on the document to edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? "Editing Active" : "Click to Edit: Off"}</span>
          </button>

          {/* Save button if changed */}
          {hasChanges && onSave && (
            <button
              type="button"
              onClick={handleSaveDocument}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}

          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}

          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(currentQuotation);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 transition cursor-pointer"
            >
              Open Form Editor
            </button>
          )}

          <button
            id="btn_print_quotation_modal"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF (A4)
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable / Interactive Sheet */}
      <div className="w-full flex justify-center pb-12">
        <QuotationInteractiveSheet
          quotation={currentQuotation}
          contractors={contractors}
          termsClauses={termsClauses}
          isEditable={isEditMode}
          onChange={handleDocumentChange}
        />
      </div>
    </div>
  );
};
