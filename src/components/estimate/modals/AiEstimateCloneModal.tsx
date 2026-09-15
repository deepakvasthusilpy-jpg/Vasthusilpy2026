import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Edit3,
  Trash2,
  Plus,
  Building2,
  User,
  Calculator,
  Printer,
  Download,
  Save,
  Check,
  Percent,
  Layers,
  FileCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  EstimateProject,
  EstimateItem,
  EstimateAppendix,
  EstimateBlock,
  normalizeProjectBlocks,
  numberToIndianWords,
  generateUniqueEstimateNumber
} from "../../../data/estimateData";
import { triggerPrint } from "../../../utils/printHelper";

interface AiEstimateCloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingProjects: EstimateProject[];
  onCloneSuccess: (clonedProject: EstimateProject, openInEditor?: boolean) => void;
  initialDroppedFile?: File | null;
}

export const AiEstimateCloneModal: React.FC<AiEstimateCloneModalProps> = ({
  isOpen,
  onClose,
  existingProjects,
  onCloneSuccess,
  initialDroppedFile
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [targetEstId, setTargetEstId] = useState("");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [clonedProject, setClonedProject] = useState<EstimateProject | null>(null);
  const [activeReviewTab, setActiveReviewTab] = useState<"items" | "general" | "markups">("items");
  const [activeAppendixIdx, setActiveAppendixIdx] = useState<number>(0);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const nextId = generateUniqueEstimateNumber(existingProjects);
      setTargetEstId(nextId);
      setErrorMessage(null);
      setSaveSuccessMsg(null);

      if (initialDroppedFile) {
        handleFileSelection(initialDroppedFile);
      }
    } else {
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setClonedProject(null);
      setIsProcessing(false);
      setErrorMessage(null);
    }
  }, [isOpen, initialDroppedFile]);

  // Handle Clipboard Paste (e.g. screenshot of an estimate)
  useEffect(() => {
    if (!isOpen || clonedProject) return;

    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (
          file.type.startsWith("image/") ||
          file.type === "application/pdf" ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls") ||
          file.name.endsWith(".csv")
        ) {
          e.preventDefault();
          handleFileSelection(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, clonedProject]);

  if (!isOpen) return null;

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const extractExcelContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          let fullText = "";

          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            fullText += `--- SHEET: ${sheetName} ---\n${csv}\n\n`;
          });

          resolve(fullText);
        } catch (err) {
          console.warn("Error reading excel with xlsx library:", err);
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsArrayBuffer(file);
    });
  };

  const handleStartCloning = async () => {
    if (!selectedFile) {
      setErrorMessage("Please drop or select a PDF, Excel (.xlsx/.xls/.csv), or JPEG/PNG file.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep("Reading document and extracting data payload...");

    try {
      let documentPayload: { data: string; mimeType: string; fileName: string } | null = null;
      let excelText = "";

      const fileNameLower = selectedFile.name.toLowerCase();
      const isExcel =
        fileNameLower.endsWith(".xlsx") ||
        fileNameLower.endsWith(".xls") ||
        fileNameLower.endsWith(".csv") ||
        selectedFile.type.includes("spreadsheet") ||
        selectedFile.type.includes("excel") ||
        selectedFile.type.includes("csv");

      if (isExcel) {
        setProcessingStep("Parsing Excel spreadsheet tables & schedules of rates...");
        excelText = await extractExcelContent(selectedFile);
      }

      // Convert file to base64 for multimodal vision / PDF parsing
      const base64Data = await readFileAsBase64(selectedFile);
      let mimeType = selectedFile.type || "application/pdf";
      if (fileNameLower.endsWith(".pdf")) mimeType = "application/pdf";
      if (fileNameLower.endsWith(".jpg") || fileNameLower.endsWith(".jpeg")) mimeType = "image/jpeg";
      if (fileNameLower.endsWith(".png")) mimeType = "image/png";
      if (fileNameLower.endsWith(".webp")) mimeType = "image/webp";

      documentPayload = {
        data: base64Data,
        mimeType: mimeType,
        fileName: selectedFile.name
      };

      setProcessingStep("Gemini AI analyzing document structure, OCR text, and building items...");

      const response = await fetch("/api/estimate/ai-clone-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentData: documentPayload,
          excelTextContent: excelText,
          prompt: customPrompt,
          targetEstimateId: targetEstId.trim() || generateUniqueEstimateNumber(existingProjects),
          existingProjectsCount: existingProjects.length
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.project) {
        throw new Error(result.error || "Failed to generate estimate project from document.");
      }

      const normalized = normalizeProjectBlocks(result.project);
      setClonedProject(normalized);
      setAiExplanation(result.explanation || "Document successfully parsed and converted into an editable estimate.");
      setIsProcessing(false);
    } catch (err: any) {
      console.error("Cloning failed:", err);
      setErrorMessage(err.message || "Failed to process document. Please check file format or try again.");
      setIsProcessing(false);
    }
  };

  // Recalculate totals in cloned project when edited live in modal
  const handleItemFieldChange = (
    appIdx: number,
    itemIdx: number,
    field: keyof EstimateItem,
    value: any
  ) => {
    if (!clonedProject) return;

    const updated = JSON.parse(JSON.stringify(clonedProject)) as EstimateProject;
    const appendix = updated.appendices[appIdx];
    if (!appendix || !appendix.items[itemIdx]) return;

    const item = appendix.items[itemIdx];
    (item as any)[field] = value;

    // Recalculate quantity if dimensions changed
    if (["nos", "length", "breadth", "depth"].includes(field)) {
      const n = Number(item.nos) || 0;
      const l = Number(item.length) || 0;
      const b = Number(item.breadth) || 0;
      const d = Number(item.depth) || 0;
      if (n > 0 && l > 0 && b > 0 && d > 0) {
        item.quantity = Number((n * l * b * d).toFixed(3));
      } else if (n > 0 && l > 0 && b > 0) {
        item.quantity = Number((n * l * b).toFixed(3));
      } else if (n > 0 && l > 0) {
        item.quantity = Number((n * l).toFixed(3));
      }
    }

    // Recalculate amount if quantity or rate changed
    if (["nos", "length", "breadth", "depth", "quantity", "rate"].includes(field)) {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      item.amount = Math.round(qty * rate);
    }

    // Re-sum appendix
    appendix.totalAmount = appendix.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    // Re-sum project direct total
    const baseCivilTotal = updated.appendices.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0);
    updated.totalAmount = baseCivilTotal;

    // Recalculate markups
    const cpPct = updated.contractorProfitPercentage || 15;
    const gstPct = updated.gstPercentage || 18;
    const contPct = updated.contingencyPercentage || 3;
    const cessPct = updated.cessPercentage || 1;
    const waterPct = updated.waterChargesPercentage || 1;

    const cpAmt = Math.round((baseCivilTotal * cpPct) / 100);
    const gstAmt = Math.round(((baseCivilTotal + cpAmt) * gstPct) / 100);
    const contAmt = Math.round((baseCivilTotal * contPct) / 100);
    const cessAmt = Math.round((baseCivilTotal * cessPct) / 100);
    const waterAmt = Math.round((baseCivilTotal * waterPct) / 100);
    const unforeseen = Number(updated.unforeseenAmount) || 0;

    updated.contractorProfitAmount = cpAmt;
    updated.gstAmount = gstAmt;
    updated.contingencyAmount = contAmt;
    updated.cessAmount = cessAmt;
    updated.waterChargesAmount = waterAmt;

    if (updated.includeMarkupsInGrandTotal !== false) {
      updated.grandTotal = baseCivilTotal + cpAmt + gstAmt + contAmt + cessAmt + waterAmt + unforeseen;
    } else {
      updated.grandTotal = baseCivilTotal + unforeseen;
    }

    setClonedProject(normalizeProjectBlocks(updated));
  };

  const handleAddItemRow = (appIdx: number) => {
    if (!clonedProject) return;
    const updated = JSON.parse(JSON.stringify(clonedProject)) as EstimateProject;
    const appendix = updated.appendices[appIdx];
    if (!appendix) return;

    const newSlNo = String(appendix.items.length + 1);
    const newItem: EstimateItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      slNo: newSlNo,
      particulars: "Civil engineering work specification",
      nos: 1,
      length: 1,
      breadth: 1,
      depth: 1,
      quantity: 1,
      unit: "cum",
      rate: 1000,
      amount: 1000
    };
    appendix.items.push(newItem);
    appendix.totalAmount = appendix.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const baseCivilTotal = updated.appendices.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0);
    updated.totalAmount = baseCivilTotal;
    updated.grandTotal = baseCivilTotal + (updated.unforeseenAmount || 0);

    setClonedProject(normalizeProjectBlocks(updated));
  };

  const handleDeleteItemRow = (appIdx: number, itemIdx: number) => {
    if (!clonedProject) return;
    const updated = JSON.parse(JSON.stringify(clonedProject)) as EstimateProject;
    const appendix = updated.appendices[appIdx];
    if (!appendix) return;

    appendix.items.splice(itemIdx, 1);
    appendix.totalAmount = appendix.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const baseCivilTotal = updated.appendices.reduce((sum, a) => sum + (Number(a.totalAmount) || 0), 0);
    updated.totalAmount = baseCivilTotal;
    updated.grandTotal = baseCivilTotal + (updated.unforeseenAmount || 0);

    setClonedProject(normalizeProjectBlocks(updated));
  };

  const handleGeneralFieldChange = (field: keyof EstimateProject, value: any) => {
    if (!clonedProject) return;
    const updated = { ...clonedProject, [field]: value };
    if (field === "plinthAreaSqFt") {
      const sqft = Number(value) || 0;
      updated.plinthAreaSqM = Number((sqft / 10.7639).toFixed(2));
    }
    setClonedProject(normalizeProjectBlocks(updated));
  };

  const handleExportCSV = () => {
    if (!clonedProject) return;
    let csv = "SL.NO,PARTICULARS,NOS,LENGTH(m),BREADTH(m),DEPTH(m),QUANTITY,UNIT,RATE,AMOUNT,REMARKS\n";
    clonedProject.appendices.forEach((app) => {
      csv += `"${app.title}","${app.subtitle || ""}","","","","","","","","",""\n`;
      app.items.forEach((it) => {
        csv += `"${it.slNo}","${(it.particulars || "").replace(/"/g, '""')}","${it.nos || ""}","${it.length || ""}","${it.breadth || ""}","${it.depth || ""}","${it.quantity || ""}","${it.unit || ""}","${it.rate || ""}","${it.amount || ""}","${it.remarks || ""}"\n`;
      });
      csv += `"", "TOTAL ${app.title}", "", "", "", "", "", "", "", "${app.totalAmount}", ""\n`;
    });
    csv += `"", "GRAND TOTAL", "", "", "", "", "", "", "", "${clonedProject.grandTotal}", ""\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Cloned_Estimate_${clonedProject.id}_${(clonedProject.clientName || "Client").replace(/\s+/g, "_")}.csv`;
    link.click();
  };

  const handleSaveToDirectory = () => {
    if (!clonedProject) return;
    onCloneSuccess(clonedProject, false);
    setSaveSuccessMsg(`Estimate "${clonedProject.id} - ${clonedProject.clientName}" saved to directory!`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleOpenInEditor = () => {
    if (!clonedProject) return;
    onCloneSuccess(clonedProject, true);
    onClose();
  };

  const getFileIcon = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".pdf")) return <FileText className="w-8 h-8 text-rose-400" />;
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv"))
      return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    return <ImageIcon className="w-8 h-8 text-blue-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase">
                  AI ESTIMATE CLONE ENGINE
                </span>
                {clonedProject && (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700 uppercase flex items-center gap-1">
                    <Edit3 className="w-2.5 h-2.5" /> EDITABLE CLONE ACTIVE
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm md:text-base text-white font-sans mt-0.5">
                {clonedProject
                  ? `Cloned Estimate: ${clonedProject.id} - ${clonedProject.clientName}`
                  : "Drop PDF, Excel or JPEG to Create Clone Editable Estimate Modal"}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {clonedProject && (
              <button
                onClick={() => {
                  setClonedProject(null);
                  setSelectedFile(null);
                  setFilePreviewUrl(null);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Drop Another File</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Extraction Glitch:</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Toast */}
          {saveSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* STAGE 1: Upload & Dropzone Screen (When no clone generated yet) */}
          {!clonedProject && !isProcessing && (
            <div className="space-y-6">
              {/* Dropzone Card */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-950/30 scale-[1.01]"
                    : selectedFile
                    ? "border-emerald-600/70 bg-slate-950/60"
                    : "border-slate-700 hover:border-emerald-500/50 bg-slate-950/40 hover:bg-slate-950/80"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp,image/*,application/pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelection(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="max-w-md mx-auto space-y-4">
                  {selectedFile ? (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg relative overflow-hidden">
                        {filePreviewUrl ? (
                          <img
                            src={filePreviewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getFileIcon(selectedFile)
                        )}
                        <span className="absolute bottom-1 right-1 bg-emerald-500 text-slate-950 text-[9px] font-bold px-1 rounded">
                          READY
                        </span>
                      </div>

                      <div>
                        <p className="font-bold text-sm text-white font-mono break-all">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document"}
                        </p>
                      </div>

                      <span className="text-[11px] text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full font-mono font-medium">
                        ✓ Click or drag to replace with another file
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-white font-sans">
                          Drag & drop your Estimate Document here
                        </p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">
                          Supports <strong className="text-rose-400">PDF (.pdf)</strong>,{" "}
                          <strong className="text-emerald-400">Excel (.xlsx, .xls, .csv)</strong>, or{" "}
                          <strong className="text-blue-400">JPEG/PNG images</strong>
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-2 pt-2">
                        <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                          📁 Browse Files
                        </span>
                        <span className="text-xs text-slate-500 font-mono">or Press Ctrl+V / ⌘+V to paste screenshot</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings and Prompt Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Target Estimate ID</span>
                  </label>
                  <input
                    type="text"
                    value={targetEstId}
                    onChange={(e) => setTargetEstId(e.target.value)}
                    placeholder="e.g. EST-2026-004"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    Auto-generated unique estimate number
                  </p>
                </div>

                <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Instructions / Rate Preferences (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., 'Apply CPWD 2024 DSR rates and 18% GST', 'Extract for client Mr. Rajesh'"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 font-mono">
                    You can specify rate schedules, markup adjustments, or custom instructions.
                  </p>
                </div>
              </div>

              {/* Supported Features Checklist */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>What the AI Document Cloning Engine will extract & build:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Client Name, Mobile & Address</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Plinth Area (Sq.Ft & Sq.M)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Appendices / Floor Schedules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Items of Work (L, B, D, Qty)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>CPWD / KPWD Unit Rates & Math</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>100% Live Editable Clone Modal</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedFile}
                  onClick={handleStartCloning}
                  className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                    selectedFile
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 hover:scale-[1.02]"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI Document Cloning →</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: Processing Animation Screen */}
          {isProcessing && (
            <div className="py-16 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-teal-500/20 border-b-teal-400 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-base font-bold text-white font-sans">
                  Cloning Estimate Document with Gemini AI...
                </h4>
                <p className="text-xs font-mono text-emerald-400 animate-pulse">
                  {processingStep}
                </p>
                <p className="text-[11px] font-mono text-slate-400">
                  Reading tables, parsing dimensions (NOS × L × B × D), matching CPWD Schedule of Rates, and constructing editable hierarchy.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 3: Result Editable Modal & Review Screen */}
          {clonedProject && !isProcessing && (
            <div className="space-y-5">
              {/* Top Highlights Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-800">
                        {clonedProject.id}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {clonedProject.buildingType || "Residential Building"}
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        • {clonedProject.plinthAreaSqFt} Sq.Ft ({clonedProject.plinthAreaSqM} Sq.M)
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white font-sans">
                      {clonedProject.clientName}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono line-clamp-1">
                      {aiExplanation || "Clone ready for review and editing."}
                    </p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                      Total Cloned Valuation
                    </span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      ₹{clonedProject.grandTotal.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[200px]">
                      {numberToIndianWords(clonedProject.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveReviewTab("items")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeReviewTab === "items"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Work Items & Quantities ({clonedProject.appendices.reduce((acc, a) => acc + a.items.length, 0)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReviewTab("general")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeReviewTab === "general"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Client & Project Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveReviewTab("markups")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    activeReviewTab === "markups"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/50"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>Statutory Markups & CPWD Rates</span>
                </button>
              </div>

              {/* TAB 1: WORK ITEMS & QUANTITIES TABLE */}
              {activeReviewTab === "items" && (
                <div className="space-y-4">
                  {/* Appendix selector */}
                  {clonedProject.appendices.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {clonedProject.appendices.map((app, idx) => (
                        <button
                          key={app.id || idx}
                          type="button"
                          onClick={() => setActiveAppendixIdx(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                            activeAppendixIdx === idx
                              ? "bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold"
                              : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {app.title} (₹{app.totalAmount.toLocaleString("en-IN")})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active Appendix Table */}
                  {clonedProject.appendices[activeAppendixIdx] && (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs font-mono text-emerald-400 uppercase">
                            {clonedProject.appendices[activeAppendixIdx].title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono ml-2">
                            {clonedProject.appendices[activeAppendixIdx].subtitle}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddItemRow(activeAppendixIdx)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto max-h-[380px]">
                        <table className="w-full text-left text-xs font-mono border-collapse">
                          <thead className="bg-slate-900/90 text-slate-300 text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                            <tr>
                              <th className="py-2 px-2.5 w-12 text-center">Sl</th>
                              <th className="py-2 px-2.5 min-w-[220px]">Particulars of Work</th>
                              <th className="py-2 px-2 w-14 text-center">Nos</th>
                              <th className="py-2 px-2 w-14 text-center">L (m)</th>
                              <th className="py-2 px-2 w-14 text-center">B (m)</th>
                              <th className="py-2 px-2 w-14 text-center">D (m)</th>
                              <th className="py-2 px-2 w-16 text-right">Qty</th>
                              <th className="py-2 px-2 w-14 text-center">Unit</th>
                              <th className="py-2 px-2 w-20 text-right">Rate (₹)</th>
                              <th className="py-2 px-2.5 w-24 text-right">Amount (₹)</th>
                              <th className="py-2 px-1.5 w-8 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {clonedProject.appendices[activeAppendixIdx].items.map((it, itemIdx) => (
                              <tr
                                key={it.id || itemIdx}
                                className="hover:bg-slate-900/60 transition-colors group"
                              >
                                <td className="py-1.5 px-2 text-center">
                                  <input
                                    type="text"
                                    value={it.slNo}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "slNo", e.target.value)
                                    }
                                    className="w-8 bg-transparent text-center text-slate-400 focus:text-white focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <input
                                    type="text"
                                    value={it.particulars}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "particulars", e.target.value)
                                    }
                                    className="w-full bg-transparent text-slate-200 focus:text-white focus:bg-slate-800 rounded px-1 outline-none truncate focus:whitespace-normal"
                                  />
                                </td>
                                <td className="py-1.5 px-1.5 text-center">
                                  <input
                                    type="number"
                                    step="any"
                                    value={it.nos ?? ""}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "nos", Number(e.target.value))
                                    }
                                    className="w-12 bg-transparent text-center text-slate-300 focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-1.5 text-center">
                                  <input
                                    type="number"
                                    step="any"
                                    value={it.length ?? ""}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "length", Number(e.target.value))
                                    }
                                    className="w-12 bg-transparent text-center text-slate-300 focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-1.5 text-center">
                                  <input
                                    type="number"
                                    step="any"
                                    value={it.breadth ?? ""}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "breadth", Number(e.target.value))
                                    }
                                    className="w-12 bg-transparent text-center text-slate-300 focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-1.5 text-center">
                                  <input
                                    type="number"
                                    step="any"
                                    value={it.depth ?? ""}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "depth", Number(e.target.value))
                                    }
                                    className="w-12 bg-transparent text-center text-slate-300 focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-2 text-right">
                                  <input
                                    type="number"
                                    step="any"
                                    value={it.quantity ?? ""}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "quantity", Number(e.target.value))
                                    }
                                    className="w-14 bg-transparent text-right font-bold text-emerald-400 focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <input
                                    type="text"
                                    value={it.unit}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "unit", e.target.value)
                                    }
                                    className="w-10 bg-transparent text-center text-slate-400 focus:bg-slate-800 rounded outline-none uppercase"
                                  />
                                </td>
                                <td className="py-1.5 px-1.5 text-right">
                                  <input
                                    type="number"
                                    step="any"
                                    value={it.rate ?? ""}
                                    onChange={(e) =>
                                      handleItemFieldChange(activeAppendixIdx, itemIdx, "rate", Number(e.target.value))
                                    }
                                    className="w-16 bg-transparent text-right text-slate-300 focus:bg-slate-800 rounded outline-none"
                                  />
                                </td>
                                <td className="py-1.5 px-2.5 text-right font-bold text-white">
                                  ₹{(it.amount || 0).toLocaleString("en-IN")}
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItemRow(activeAppendixIdx, itemIdx)}
                                    className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Subtotal row */}
                      <div className="bg-slate-900 px-4 py-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-400 font-bold uppercase">
                          Appendix Total ({clonedProject.appendices[activeAppendixIdx].items.length} items):
                        </span>
                        <span className="text-sm font-black text-emerald-400">
                          ₹{clonedProject.appendices[activeAppendixIdx].totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CLIENT & PROJECT DETAILS */}
              {activeReviewTab === "general" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Client / Applicant Name</label>
                    <input
                      type="text"
                      value={clonedProject.clientName}
                      onChange={(e) => handleGeneralFieldChange("clientName", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Client Contact Phone</label>
                    <input
                      type="text"
                      value={clonedProject.clientPhone || ""}
                      onChange={(e) => handleGeneralFieldChange("clientPhone", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">House / Building Name</label>
                    <input
                      type="text"
                      value={clonedProject.houseName || ""}
                      onChange={(e) => handleGeneralFieldChange("houseName", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Panchayat / Village</label>
                    <input
                      type="text"
                      value={clonedProject.panchayatVillage || ""}
                      onChange={(e) => handleGeneralFieldChange("panchayatVillage", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Survey / Resurvey No</label>
                    <input
                      type="text"
                      value={clonedProject.syNo || ""}
                      onChange={(e) => handleGeneralFieldChange("syNo", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Building Classification</label>
                    <input
                      type="text"
                      value={clonedProject.buildingType || ""}
                      onChange={(e) => handleGeneralFieldChange("buildingType", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Plinth Area (Sq.Ft)</label>
                    <input
                      type="number"
                      value={clonedProject.plinthAreaSqFt || 0}
                      onChange={(e) => handleGeneralFieldChange("plinthAreaSqFt", Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Plinth Area (Sq.M)</label>
                    <input
                      type="number"
                      value={clonedProject.plinthAreaSqM || 0}
                      readOnly
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Estimation Date</label>
                    <input
                      type="date"
                      value={clonedProject.estimationDate || ""}
                      onChange={(e) => handleGeneralFieldChange("estimationDate", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">Prepared By (Engineer)</label>
                    <input
                      type="text"
                      value={clonedProject.preparedBy || "DIBIN D"}
                      onChange={(e) => handleGeneralFieldChange("preparedBy", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-bold">LSGD / Reg No</label>
                    <input
                      type="text"
                      value={clonedProject.regNo || "LSGB/JDPKD/3361/2025-F5/SB"}
                      onChange={(e) => handleGeneralFieldChange("regNo", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: STATUTORY MARKUPS & CPWD RATES */}
              {activeReviewTab === "markups" && (
                <div className="space-y-4 bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-400 font-bold block">Base Civil Structures Total:</span>
                      <span className="text-base font-black text-white">
                        ₹{(clonedProject.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-400 font-bold block">Contractor's Profit (15%):</span>
                      <span className="text-base font-bold text-amber-400">
                        ₹{(clonedProject.contractorProfitAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-400 font-bold block">Works Contract GST (18%):</span>
                      <span className="text-base font-bold text-blue-400">
                        ₹{(clonedProject.gstAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-400 font-bold block">Contingencies (3%):</span>
                      <span className="text-base font-bold text-purple-400">
                        ₹{(clonedProject.contingencyAmount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-slate-400 font-bold block">Labour Cess & Water (2%):</span>
                      <span className="text-base font-bold text-teal-400">
                        ₹{((clonedProject.cessAmount || 0) + (clonedProject.waterChargesAmount || 0)).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-3.5 bg-emerald-950/60 border border-emerald-700/80 rounded-xl space-y-1">
                      <span className="text-emerald-300 font-bold block uppercase">Grand Total (Net Bill):</span>
                      <span className="text-lg font-black text-emerald-400">
                        ₹{clonedProject.grandTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Export Excel (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerPrint(`Cloned_Estimate_${clonedProject.id}`);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>Print PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveToDirectory}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save to Directory</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInEditor}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/50 hover:scale-[1.02]"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Open in Full Editor →</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
