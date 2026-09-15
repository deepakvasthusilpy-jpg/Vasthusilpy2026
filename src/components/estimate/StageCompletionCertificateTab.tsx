import React, { useState, useEffect, useMemo } from "react";
import {
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  MapPin,
  FileText,
  DollarSign,
  Info,
  ShieldCheck,
  Layers,
  ChevronRight,
  ArrowRight,
  ListChecks,
  Filter,
  Save,
  QrCode,
  ExternalLink,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Hash,
  Lock,
  AlertTriangle,
  CheckCheck,
  ArrowLeft
} from "lucide-react";
import {
  EstimateProject,
  EstimateItem,
  EstimateAppendix,
  normalizeProjectBlocks,
  numberToIndianWords,
  calculateStageValuationFromItemIds,
  generateDefaultStageCertificate,
  generateDefaultCompletionCertificate,
  INITIAL_PRESETS_ENGINEERS,
  saveEstimates,
  isProject100PercentStageCompleted
} from "../../data/estimateData";
import { StageCertificateData, CompletionCertificateData } from "../../types";
import { VerificationQRModal } from "./modals/VerificationQRModal";
import { triggerPrint } from "../../utils/printHelper";
import { useAuth } from "../../context/AuthContext";
import { canUseDigitalSignatures, AUTHORIZED_SIGNING_EMAILS } from "../../lib/firebase";
import QRCode from "qrcode";

interface StageCompletionCertificateTabProps {
  estimateProjects: EstimateProject[];
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  onUpdateProject?: (updated: EstimateProject) => void;
  onOpenClientView?: () => void;
}

const STAGE_PRESETS = [
  "Foundation & Basement Plinth Level Stage",
  "Ground Floor Brickwork & Lintel Casting Stage",
  "Ground Floor Roof Slab Cast Stage",
  "First Floor Brick Masonry & Lintel Level Stage",
  "First Floor Roof Slab Cast Stage",
  "Plastering & Electrical / Plumbing Rough-in Stage",
  "Flooring, Joinery & Internal Painting Stage",
  "100% Building Construction Completed"
];

export const StageCompletionCertificateTab: React.FC<StageCompletionCertificateTabProps> = ({
  estimateProjects,
  activeProjectId,
  onSelectProject,
  onUpdateProject,
  onOpenClientView
}) => {
  const { user, emailUser } = useAuth();
  const activeEmail = user?.email || emailUser?.email || "";
  const isAuthorizedSigner = canUseDigitalSignatures(activeEmail);

  // Current active project
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId && estimateProjects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    return estimateProjects[0]?.id || "E000003";
  });

  useEffect(() => {
    if (activeProjectId && activeProjectId !== selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  const rawProject =
    estimateProjects.find((p) => p.id === selectedProjectId) || estimateProjects[0];
  const project = useMemo(() => normalizeProjectBlocks(rawProject), [rawProject]);

  // Certificate Mode: Stage vs Completion
  const [certMode, setCertMode] = useState<"stage" | "completion">("stage");
  const [viewMode, setViewMode] = useState<"builder" | "preview">("builder");

  // Stage Certificate state
  const [stageCert, setStageCert] = useState<StageCertificateData>(() => {
    return rawProject.stageCertificate || generateDefaultStageCertificate(rawProject);
  });

  // Completion Certificate state
  const [compCert, setCompCert] = useState<CompletionCertificateData>(() => {
    return rawProject.completionCertificate || generateDefaultCompletionCertificate(rawProject);
  });

  // Range inputs per appendix (Floor) for quick selection
  const [rangeInputs, setRangeInputs] = useState<{ [appId: string]: { fromSl: string; toSl: string } }>({});

  // QR Modal & Copy state
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [stageQrUrl, setStageQrUrl] = useState<string>("");
  const [compQrUrl, setCompQrUrl] = useState<string>("");

  useEffect(() => {
    if (project) {
      const stageUrl = `${window.location.origin}/?verify=${project.id}&hash=${encodeURIComponent(
        project.verificationHash
      )}&tab=stage`;
      QRCode.toDataURL(stageUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" }
      })
        .then((url) => setStageQrUrl(url))
        .catch(() => {});

      const compUrl = `${window.location.origin}/?verify=${project.id}&hash=${encodeURIComponent(
        project.verificationHash
      )}&tab=completion`;
      QRCode.toDataURL(compUrl, {
        width: 200,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" }
      })
        .then((url) => setCompQrUrl(url))
        .catch(() => {});
    }
  }, [project.id, project.verificationHash]);

  // Sync certificate when switching project
  useEffect(() => {
    if (rawProject) {
      setStageCert(rawProject.stageCertificate || generateDefaultStageCertificate(rawProject));
      setCompCert(rawProject.completionCertificate || generateDefaultCompletionCertificate(rawProject));
    }
  }, [selectedProjectId, rawProject.id]);

  // All valid estimate items
  const allItemsList = useMemo(() => {
    const list: { item: EstimateItem; appendixId: string; appendixTitle: string }[] = [];
    project.appendices.forEach((app) => {
      app.items.forEach((it) => {
        if (!it.isHeader && !it.isSubtotal) {
          list.push({ item: it, appendixId: app.id, appendixTitle: app.title });
        }
      });
    });
    return list;
  }, [project]);

  // Executed stages and Sl No ranges summary (only Sl.No range from... to..., no full descriptions)
  const executedStagesSummary = useMemo(() => {
    const selectedSet = new Set(stageCert.selectedItemIds || []);
    const results: Array<{
      appendixTitle: string;
      fromSl: string | number;
      toSl: string | number;
      itemCount: number;
      subtotal: number;
    }> = [];

    project.appendices.forEach((app) => {
      const validItems = app.items.filter((it) => !it.isHeader && !it.isSubtotal);
      const selectedInThisApp = validItems.filter((it) => selectedSet.has(it.id));

      if (selectedInThisApp.length > 0) {
        const appSum = selectedInThisApp.reduce((acc, it) => acc + (it.amount || 0), 0);
        const slNos = selectedInThisApp.map((it) => it.slNo).filter(Boolean);
        const fromSl = slNos[0] || "1";
        const toSl = slNos[slNos.length - 1] || fromSl;
        const appTitleClean = app.title.replace(/^APPENDIX\s+[A-Z]\s*[-:]?\s*/i, "").trim() || app.title;

        results.push({
          appendixTitle: appTitleClean,
          fromSl,
          toSl,
          itemCount: selectedInThisApp.length,
          subtotal: appSum
        });
      }
    });

    return results;
  }, [project, stageCert.selectedItemIds]);

  // Total items and completion status calculation
  const totalItemsCount = allItemsList.length;
  const selectedCount = stageCert.selectedItemIds?.length || 0;
  const isAllWorksCompleted = totalItemsCount > 0 && selectedCount >= totalItemsCount;
  const completionPercentage = totalItemsCount > 0 ? Math.round((selectedCount / totalItemsCount) * 100) : 0;

  // Handle single item checkbox toggle in Stage Certificate
  const handleToggleStageItem = (itemId: string) => {
    const current = new Set<string>(stageCert.selectedItemIds || []);
    if (current.has(itemId)) {
      current.delete(itemId);
    } else {
      current.add(itemId);
    }
    const newSelected: string[] = Array.from(current);
    const calc = calculateStageValuationFromItemIds(
      project,
      newSelected,
      stageCert.includeContingencyProportion
    );

    setStageCert((prev) => ({
      ...prev,
      selectedItemIds: newSelected,
      stageExpenditure: calc.stageValuation,
      progressPercentage: calc.progressPct,
      remainingBalance: calc.balanceRemaining,
      completedItemsSummaryText: calc.autoSummaryText
    }));
  };

  // Apply Range for an Appendix (From Sl.No X to Sl.No Y)
  const handleApplyRange = (app: EstimateAppendix) => {
    const range = rangeInputs[app.id] || { fromSl: "1", toSl: String(app.items.length) };
    const fromNum = parseInt(range.fromSl, 10) || 1;
    const toNum = parseInt(range.toSl, 10) || app.items.length;

    const validItems = app.items.filter((it) => !it.isHeader && !it.isSubtotal);
    const matchedItemIds: string[] = [];

    validItems.forEach((it, idx) => {
      const slParsed = parseInt(it.slNo, 10);
      const effectiveSl = !isNaN(slParsed) ? slParsed : idx + 1;
      if (effectiveSl >= fromNum && effectiveSl <= toNum) {
        matchedItemIds.push(it.id);
      }
    });

    const currentSet = new Set<string>(stageCert.selectedItemIds || []);
    matchedItemIds.forEach((id) => currentSet.add(id));

    const newSelected: string[] = Array.from(currentSet);
    const calc = calculateStageValuationFromItemIds(
      project,
      newSelected,
      stageCert.includeContingencyProportion
    );

    setStageCert((prev) => ({
      ...prev,
      selectedItemIds: newSelected,
      stageExpenditure: calc.stageValuation,
      progressPercentage: calc.progressPct,
      remainingBalance: calc.balanceRemaining,
      completedItemsSummaryText: calc.autoSummaryText
    }));
  };

  // Select all items in an appendix
  const handleSelectAllInAppendix = (app: EstimateAppendix) => {
    const validItems = app.items.filter((it) => !it.isHeader && !it.isSubtotal);
    const currentSet = new Set<string>(stageCert.selectedItemIds || []);
    validItems.forEach((it) => currentSet.add(it.id));

    const newSelected: string[] = Array.from(currentSet);
    const calc = calculateStageValuationFromItemIds(
      project,
      newSelected,
      stageCert.includeContingencyProportion
    );

    setStageCert((prev) => ({
      ...prev,
      selectedItemIds: newSelected,
      stageExpenditure: calc.stageValuation,
      progressPercentage: calc.progressPct,
      remainingBalance: calc.balanceRemaining,
      completedItemsSummaryText: calc.autoSummaryText
    }));
  };

  // Deselect all items in an appendix
  const handleDeselectAllInAppendix = (app: EstimateAppendix) => {
    const appItemIds = new Set(app.items.map((it) => it.id));
    const newSelected = (stageCert.selectedItemIds || []).filter((id) => !appItemIds.has(id));
    const calc = calculateStageValuationFromItemIds(
      project,
      newSelected,
      stageCert.includeContingencyProportion
    );

    setStageCert((prev) => ({
      ...prev,
      selectedItemIds: newSelected,
      stageExpenditure: calc.stageValuation,
      progressPercentage: calc.progressPct,
      remainingBalance: calc.balanceRemaining,
      completedItemsSummaryText: calc.autoSummaryText
    }));
  };

  // Mark 100% of works completed across all appendices
  const handleCompleteAllWorks = () => {
    const allIds = allItemsList.map((x) => x.item.id);
    const calc = calculateStageValuationFromItemIds(
      project,
      allIds,
      stageCert.includeContingencyProportion
    );

    setStageCert((prev) => ({
      ...prev,
      selectedItemIds: allIds,
      stageName: "100% Building Construction Completed",
      stageExpenditure: calc.stageValuation,
      progressPercentage: 100,
      remainingBalance: 0,
      completedItemsSummaryText: "100% All Items of Work (Foundation, Superstructure, Roofing, Finishing & MEP) Fully Completed on Site as per Sanctioned Plan & KPBR Specifications"
    }));

    setCompCert((prev) => ({
      ...prev,
      allWorkItemsCompleted: true,
      selectedItemIds: allIds,
      finalTotalCost: calc.stageValuation || project.grandTotal
    }));

    setWarningMessage(null);
  };

  // Save changes to project state and localStorage
  const handleSaveToProject = () => {
    if (certMode === "completion" && !isAllWorksCompleted) {
      setWarningMessage(
        "നിബന്ധന: സ്റ്റേജ് സർട്ടിഫിക്കറ്റിലെ 100% പ്രവൃത്തികളും പൂർത്തിയാകാതെ കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് സൃഷ്ടിക്കാനോ സേവ് ചെയ്യാനോ സാധിക്കില്ല. (Completion certificate cannot be created until 100% work under stage certificate is completed)."
      );
      return;
    }

    const updated: EstimateProject = {
      ...rawProject,
      stageExpenditure: certMode === "stage" ? stageCert.stageExpenditure : (isAllWorksCompleted ? rawProject.grandTotal : rawProject.stageExpenditure),
      stageCompletedText:
        certMode === "stage"
          ? stageCert.completedItemsSummaryText
          : (isAllWorksCompleted ? "100% Building Construction Completed as per Sanctioned Plan & KPBR/KMBR Rules" : rawProject.stageCompletedText),
      stageDate: certMode === "stage" ? stageCert.issueDate : compCert.issueDate,
      hasStageCertificate: true,
      hasCompletionCertificate: isAllWorksCompleted,
      stageCertificate: stageCert,
      completionCertificate: isAllWorksCompleted ? compCert : rawProject.completionCertificate
    };

    if (onUpdateProject) {
      onUpdateProject(updated);
    }

    const all = estimateProjects.map((p) => (p.id === updated.id ? updated : p));
    saveEstimates(all);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Print Stage Certificate Separately
  const handlePrintStageCert = () => {
    setCertMode("stage");
    triggerPrint(
      `Stage_Progress_Certificate_${project.id}_${project.clientName.replace(/\s+/g, "_")}`,
      "stage-cert-print-container"
    );
  };

  // Print Completion Certificate Separately (Only after completing 100% works)
  const handlePrintCompletionCert = () => {
    if (!isAllWorksCompleted) {
      setWarningMessage(
        "കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് തയ്യാറാക്കുന്നതിനും പ്രിന്റ് ചെയ്യുന്നതിനും 100% പ്രവൃത്തികളും പൂർത്തിയായിരിക്കണം. ദയവായി എല്ലാ വർക്ക് ഐറ്റങ്ങളും പൂർത്തിയാക്കുക."
      );
      setCertMode("completion");
      return;
    }
    setCertMode("completion");
    triggerPrint(
      `Building_Completion_Certificate_${project.id}_${project.clientName.replace(/\s+/g, "_")}`,
      "comp-cert-print-container"
    );
  };

  // Copy shareable public verification link
  const shareableUrl = `${window.location.origin}/?verify=${project.id}&hash=${project.verificationHash}&tab=${certMode}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Selected Engineer preset handler
  const handleSelectEngineerPreset = (presetId: string) => {
    const found = INITIAL_PRESETS_ENGINEERS.find((p) => p.id === presetId);
    if (!found) return;

    if (certMode === "stage") {
      setStageCert((prev) => ({
        ...prev,
        engineerName: found.fullName,
        engineerRegNo: found.regNo,
        engineerDesignation: found.designation,
        engineerDepartment: found.department,
        engineerAddress: `${found.houseAddress}, ${found.districtPincode}`,
        engineerPhone: found.phones
      }));
    } else {
      setCompCert((prev) => ({
        ...prev,
        engineerName: found.fullName,
        engineerRegNo: found.regNo,
        engineerDesignation: found.designation,
        engineerDepartment: found.department,
        engineerAddress: `${found.houseAddress}, ${found.districtPincode}`,
        engineerPhone: found.phones
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Project Selector Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800 uppercase inline-flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>STAGE PROGRESS & COMPLETION CERTIFICATION ENGINE</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
                KERALA PWD / STATUTORY STANDARDS
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-sans uppercase tracking-tight">
              Stage & Completion Certificate Generator
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Generate official Stage Progress Certificates and Building Completion Certificates (strictly on 100% works completion).
            </p>
          </div>

          {/* Project Dropdown & Dedicated Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
              <span className="text-[11px] font-mono text-slate-400 pl-2 font-bold uppercase">
                Estimate:
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedProjectId(id);
                  if (onSelectProject) onSelectProject(id);
                }}
                className="bg-slate-950 text-white text-xs font-mono font-bold rounded-xl px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {estimateProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} - {p.clientName} ({p.panchayatVillage})
                  </option>
                ))}
              </select>
            </div>

            {/* SEPARATE PRINT OPTION 1: PRINT STAGE CERTIFICATE */}
            <button
              onClick={handlePrintStageCert}
              className="bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-500/50 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-700/20 transition-all cursor-pointer"
              title="Print official Stage Progress Certificate"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              <span>Print Stage Cert</span>
            </button>

            {/* SEPARATE PRINT OPTION 2: PRINT COMPLETION CERTIFICATE */}
            <button
              onClick={handlePrintCompletionCert}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                isAllWorksCompleted
                  ? "bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-500/50 shadow-lg shadow-cyan-700/20"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title={
                isAllWorksCompleted
                  ? "Print official 100% Building Completion Certificate"
                  : "Completion Certificate locked: 100% of estimate works must be completed"
              }
            >
              {isAllWorksCompleted ? (
                <Printer className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Print Completion Cert</span>
            </button>

            <button
              onClick={handleSaveToProject}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                saveSuccess
                  ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{saveSuccess ? "Saved to Estimate!" : "Save"}</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>QR Code</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </button>
          </div>
        </div>

        {/* Selected Project Overview Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase block">Client / Owner</span>
            <span className="font-bold text-white truncate block">{project.clientName}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase block">Location / Village</span>
            <span className="font-bold text-slate-300 truncate block">{project.panchayatVillage}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase block">Survey / Block</span>
            <span className="font-bold text-slate-300 truncate block">Sy: {project.syNo} • B: {project.blockNo}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase block">Plinth Area</span>
            <span className="font-bold text-cyan-400 block">{project.plinthAreaSqFt} Sq.Ft ({project.plinthAreaSqM} Sq.M)</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase block">Work Completion Progress</span>
            <span className={`font-bold block ${isAllWorksCompleted ? "text-emerald-400" : "text-amber-400"}`}>
              {completionPercentage}% ({selectedCount}/{totalItemsCount} items)
            </span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase block">Total Sanctioned Estimate</span>
            <span className="font-bold text-emerald-400 truncate block">₹{project.grandTotal.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Warning / Validation Banner */}
      {warningMessage && (
        <div className="p-4 bg-amber-950/60 border border-amber-500/50 rounded-2xl flex items-start justify-between gap-3 text-amber-200 text-xs font-mono">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-white font-sans text-sm">നിബന്ധന (Completion Restriction):</strong>
              <p>{warningMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-amber-400 hover:text-white text-xs px-2 py-1 bg-amber-900/60 rounded border border-amber-700 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Navigation & Toggle Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Certificate Type Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCertMode("stage")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              certMode === "stage"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>1. സ്റ്റേജ് സർട്ടിഫിക്കറ്റ് (Stage Progress Certificate)</span>
            <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded-full font-sans text-emerald-300 border border-emerald-800/40">
              {completionPercentage}%
            </span>
          </button>

          <button
            onClick={() => setCertMode("completion")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              certMode === "completion"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            }`}
          >
            {isAllWorksCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <span>2. കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് (Building Completion Certificate)</span>
            {isAllWorksCompleted ? (
              <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded-full text-emerald-400 font-bold border border-emerald-800">
                100% Unlocked
              </span>
            ) : (
              <span className="text-[10px] bg-amber-950/80 px-2 py-0.5 rounded-full text-amber-300 font-mono border border-amber-800/80">
                Requires 100% Works
              </span>
            )}
          </button>
        </div>

        {/* View Mode: Builder vs Official Print Preview */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("builder")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "builder"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Checklist & Form Editor</span>
          </button>

          <button
            onClick={() => setViewMode("preview")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "preview"
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Official Letterhead Preview</span>
          </button>

          {onOpenClientView && (
            <button
              onClick={onOpenClientView}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-400 hover:bg-cyan-950/50 border border-cyan-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Client View Tab</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE A: STAGE CERTIFICATE BUILDER (INTERACTIVE ITEM CHECKLIST & RANGES) */}
      {/* ========================================================================= */}
      {certMode === "stage" && viewMode === "builder" && (
        <div className="space-y-6 print:hidden">
          {/* Top Stage Summary Banner */}
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 font-bold">
                  <Award className="w-4 h-4" />
                  <span>ACTIVE STAGE CERTIFICATE SUMMARY</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white font-sans">
                  {stageCert.stageName || "Current Stage Progress"}
                </h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {stageCert.completedItemsSummaryText || "Select completed work items below to automatically compile stage progress amount."}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Physical Construction Progress:</span>
                    <strong className="text-emerald-400 font-bold">{stageCert.progressPercentage}%</strong>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, stageCert.progressPercentage))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Certified Figures Column */}
              <div className="lg:col-span-4 bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Certified Stage Amount:
                  </span>
                  <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400">
                    ₹{stageCert.stageExpenditure.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 italic block mt-0.5">
                    ({numberToIndianWords(stageCert.stageExpenditure)})
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Remaining Balance:</span>
                  <span className="text-amber-400 font-bold">₹{stageCert.remainingBalance.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Sanctioned:</span>
                  <span className="text-white font-bold">₹{project.grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & 100% Mark All Completed Button */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 font-bold">Quick Checklist Actions:</span>
              <button
                type="button"
                onClick={handleCompleteAllWorks}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-xl border border-emerald-400/40 flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Works Completed (100% Items)</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Selected items:</span>
              <strong className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {selectedCount} / {totalItemsCount}
              </strong>
            </div>
          </div>

          {/* Appendices / Floors Checklist with Range Selection */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-emerald-400" />
                  <span>Itemized Structural Progress Checklist</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Check individual items or apply Sl.No ranges (e.g. 1 to 10) to mark executed civil works.
                </p>
              </div>
            </div>

            {project.appendices.map((app, appIdx) => {
              const validItems = app.items.filter((it) => !it.isHeader && !it.isSubtotal);
              const appSelectedCount = validItems.filter((it) =>
                stageCert.selectedItemIds?.includes(it.id)
              ).length;
              const range = rangeInputs[app.id] || { fromSl: "1", toSl: String(validItems.length) };

              return (
                <div
                  key={app.id || appIdx}
                  className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
                >
                  {/* Appendix Header & Range Selector Toolbar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white font-sans">{app.title}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {appSelectedCount} / {validItems.length} Done
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{app.subtitle}</p>
                    </div>

                    {/* Range Selection Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono text-slate-400">Sl.No Range:</span>
                      <input
                        type="number"
                        min="1"
                        max={validItems.length}
                        value={range.fromSl}
                        onChange={(e) =>
                          setRangeInputs((prev) => ({
                            ...prev,
                            [app.id]: { ...range, fromSl: e.target.value }
                          }))
                        }
                        className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                        placeholder="From"
                      />
                      <span className="text-xs text-slate-500">to</span>
                      <input
                        type="number"
                        min="1"
                        max={validItems.length}
                        value={range.toSl}
                        onChange={(e) =>
                          setRangeInputs((prev) => ({
                            ...prev,
                            [app.id]: { ...range, toSl: e.target.value }
                          }))
                        }
                        className="w-14 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-emerald-500"
                        placeholder="To"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyRange(app)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono font-bold shadow transition-all cursor-pointer"
                      >
                        Apply Range
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectAllInAppendix(app)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-800 cursor-pointer"
                      >
                        All
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeselectAllInAppendix(app)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-mono border border-slate-800 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Done</th>
                          <th className="py-2.5 px-3 w-14">Sl.No</th>
                          <th className="py-2.5 px-3">Particulars of Work</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-center">Unit</th>
                          <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {validItems.map((item) => {
                          const isSelected = stageCert.selectedItemIds?.includes(item.id);
                          return (
                            <tr
                              key={item.id}
                              onClick={() => handleToggleStageItem(item.id)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-950/30 text-white"
                                  : "hover:bg-slate-900/50 text-slate-400"
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400 inline" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600 inline" />
                                )}
                              </td>
                              <td className="py-2 px-3 font-bold text-slate-300">{item.slNo}</td>
                              <td className="py-2 px-3 text-slate-200 font-sans max-w-md leading-relaxed">
                                {item.particulars}
                              </td>
                              <td className="py-2 px-3 text-right">{item.quantity}</td>
                              <td className="py-2 px-3 text-center">{item.unit}</td>
                              <td className="py-2 px-3 text-right">{item.rate.toLocaleString("en-IN")}</td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-400">
                                ₹{item.amount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form particulars for Stage Certificate */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <span>Certificate & Project Particulars</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Certificate Number</label>
                <input
                  type="text"
                  value={stageCert.certificateNo}
                  onChange={(e) => setStageCert((prev) => ({ ...prev, certificateNo: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Certificate Issue Date</label>
                <input
                  type="date"
                  value={stageCert.issueDate}
                  onChange={(e) => setStageCert((prev) => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 block font-bold">Site Inspection Date</label>
                <input
                  type="date"
                  value={stageCert.inspectionDate}
                  onChange={(e) => setStageCert((prev) => ({ ...prev, inspectionDate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Recipient / Authority details */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 font-bold block">
                Certificate Addressed To / Recipient
              </label>
              <input
                type="text"
                value={stageCert.recipientOrAuthority || "To Whomsoever It May Concern"}
                onChange={(e) => setStageCert((prev) => ({ ...prev, recipientOrAuthority: e.target.value, bankName: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500 text-xs font-mono"
                placeholder="e.g. To Whomsoever It May Concern"
              />
            </div>

            {/* Stage Milestone & Purpose */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 font-bold block">
                Construction Stage Milestone Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STAGE_PRESETS.map((stg) => (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => setStageCert((prev) => ({ ...prev, stageName: stg }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                      stageCert.stageName === stg
                        ? "bg-cyan-500 text-slate-950 font-bold shadow"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {stg}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mt-2">
                <div className="space-y-1">
                  <span className="text-slate-500 block">Certified Stage Name</span>
                  <input
                    type="text"
                    value={stageCert.stageName}
                    onChange={(e) => setStageCert((prev) => ({ ...prev, stageName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block">Purpose of Certificate</span>
                  <input
                    type="text"
                    value={stageCert.purpose}
                    onChange={(e) => setStageCert((prev) => ({ ...prev, purpose: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Engineer Profile Selection */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-400 font-bold block uppercase">
                  Authorised Certifying Engineer
                </label>
                <div className="flex items-center gap-2">
                  {INITIAL_PRESETS_ENGINEERS.map((eng) => (
                    <button
                      key={eng.id}
                      type="button"
                      onClick={() => handleSelectEngineerPreset(eng.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-mono cursor-pointer"
                    >
                      Use {eng.fullName} ({eng.designation})
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-slate-500 block">Engineer Full Name</span>
                  <input
                    type="text"
                    value={stageCert.engineerName}
                    onChange={(e) => setStageCert((prev) => ({ ...prev, engineerName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block">LSGD / Govt Reg No.</span>
                  <input
                    type="text"
                    value={stageCert.engineerRegNo}
                    onChange={(e) => setStageCert((prev) => ({ ...prev, engineerRegNo: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 block">Designation</span>
                  <input
                    type="text"
                    value={stageCert.engineerDesignation}
                    onChange={(e) => setStageCert((prev) => ({ ...prev, engineerDesignation: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <span className="text-slate-500 block">Engineer Remarks & Compliance Statement</span>
                <textarea
                  rows={2}
                  value={stageCert.engineerRemarks}
                  onChange={(e) => setStageCert((prev) => ({ ...prev, engineerRemarks: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE B: BUILDING COMPLETION CERTIFICATE BUILDER (WITH 100% COMPLETION RULE) */}
      {/* ========================================================================= */}
      {certMode === "completion" && viewMode === "builder" && (
        <div className="space-y-6 print:hidden">
          {!isAllWorksCompleted ? (
            /* LOCKED SCREEN: 100% WORKS COMPLETION REQUIRED */
            <div className="bg-slate-950 border border-amber-500/50 rounded-3xl p-8 shadow-2xl space-y-6 max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-3xl bg-amber-950/80 border border-amber-600/60 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/50">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 bg-amber-950 px-3 py-1 rounded-full border border-amber-800 uppercase inline-block">
                  പൂർണ്ണ പ്രവൃത്തി നിബന്ധന (100% Entire Works Required)
                </span>
                <h3 className="text-xl md:text-2xl font-black text-white font-sans">
                  Completion Certificate Locked: Complete Entire Works
                </h3>
                <p className="text-xs md:text-sm text-slate-300 font-sans leading-relaxed max-w-xl mx-auto">
                  As per Kerala Panchayat Building Rules (KPBR 2019 Rule 22) and standard Civil Engineering norms, a <strong>Building Completion Certificate</strong> can only be prepared after completing the entire works physically on site.
                </p>
              </div>

              {/* Progress status overview */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-white">
                  <span>Current Physical Progress:</span>
                  <strong className="text-amber-400 font-bold">{completionPercentage}% Completed</strong>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Executed Items:</span>
                    <strong className="text-white">{selectedCount} / {totalItemsCount} items</strong>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Remaining Work:</span>
                    <strong className="text-amber-400">₹{stageCert.remainingBalance.toLocaleString("en-IN")}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons to unlock */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCompleteAllWorks}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All Works Completed (100%) & Unlock Completion Cert</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCertMode("stage")}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Stage Checklist</span>
                </button>
              </div>
            </div>
          ) : (
            /* UNLOCKED SCREEN: FULL COMPLETION CERTIFICATE BUILDER */
            <>
              {/* Top Completion Milestone Banner */}
              <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>100% BUILDING COMPLETION & OCCUPANCY CERTIFICATION</span>
                  </span>
                  <h3 className="text-xl md:text-2xl font-black text-white font-sans">
                    Building Completion Certificate
                  </h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-2xl">
                    Certifies that the construction of the building has been completely executed on site in full compliance with the sanctioned drawings, KMBR/KPBR structural safety standards, and is fit for immediate occupation.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center shrink-0 min-w-[200px]">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Final Total Cost</span>
                  <div className="text-2xl font-black font-mono text-emerald-400 my-1">
                    ₹{compCert.finalTotalCost.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">100% EXECUTED</span>
                </div>
              </div>

              {/* Form details for Completion */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white font-sans uppercase flex items-center gap-2">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <span>Completion Document Particulars</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block font-bold">Certificate Number</label>
                    <input
                      type="text"
                      value={compCert.certificateNo}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, certificateNo: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block font-bold">Certificate Issue Date</label>
                    <input
                      type="date"
                      value={compCert.issueDate}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, issueDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block font-bold">Completion / Handover Date</label>
                    <input
                      type="date"
                      value={compCert.completionDate}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, completionDate: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block font-bold">Authority Addressed</label>
                    <input
                      type="text"
                      value={compCert.authorityOrBank}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, authorityOrBank: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 block font-bold">Purpose of Certificate</label>
                    <input
                      type="text"
                      value={compCert.purpose}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, purpose: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Plinth Area & Deviations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-1">
                    <span className="text-slate-500 block">Sanctioned Plinth Area (Sq.M)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={compCert.sanctionedPlinthAreaSqM}
                      onChange={(e) =>
                        setCompCert((prev) => ({
                          ...prev,
                          sanctionedPlinthAreaSqM: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block">Actual Constructed Area (Sq.M)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={compCert.actualConstructedPlinthAreaSqM}
                      onChange={(e) =>
                        setCompCert((prev) => ({
                          ...prev,
                          actualConstructedPlinthAreaSqM: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block">Deviations Observed Statement</span>
                    <input
                      type="text"
                      value={compCert.deviationsObserved}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, deviationsObserved: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Certification Statement */}
                <div className="space-y-1 text-xs font-mono">
                  <span className="text-slate-400 block font-bold">Official Kerala LSGD Certification Statement</span>
                  <textarea
                    rows={3}
                    value={compCert.certificationStatement}
                    onChange={(e) => setCompCert((prev) => ({ ...prev, certificationStatement: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 leading-relaxed font-sans text-xs"
                  />
                </div>

                {/* Engineer Credentials Selection for Completion Certificate */}
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-400 font-bold block uppercase">
                      Certifying Engineer Credentials
                    </label>
                    <div className="flex items-center gap-2">
                      {INITIAL_PRESETS_ENGINEERS.map((eng) => (
                        <button
                          key={eng.id}
                          type="button"
                          onClick={() => handleSelectEngineerPreset(eng.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-mono cursor-pointer"
                        >
                          Use {eng.fullName} ({eng.designation})
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-slate-500 block">Engineer Full Name</span>
                      <input
                        type="text"
                        value={compCert.engineerName}
                        onChange={(e) => setCompCert((prev) => ({ ...prev, engineerName: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block">LSGD Reg No.</span>
                      <input
                        type="text"
                        value={compCert.engineerRegNo}
                        onChange={(e) => setCompCert((prev) => ({ ...prev, engineerRegNo: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500 block">Designation</span>
                      <input
                        type="text"
                        value={compCert.engineerDesignation}
                        onChange={(e) => setCompCert((prev) => ({ ...prev, engineerDesignation: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <span className="text-slate-500 block">Engineer Final Remarks</span>
                    <textarea
                      rows={2}
                      value={compCert.engineerRemarks}
                      onChange={(e) => setCompCert((prev) => ({ ...prev, engineerRemarks: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 leading-relaxed font-sans text-xs"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARATE OFFICIAL LETTERHEAD DOCUMENTS FOR PREVIEW & PRINTING */}
      {/* ========================================================================= */}

      {/* 1. STAGE CERTIFICATE LETTERHEAD (Rendered for Preview when certMode === "stage", and in dedicated print container) */}
      <div
        id="stage-cert-print-container"
        className={`${
          (viewMode === "preview" && certMode === "stage")
            ? "block"
            : "hidden"
        } bg-white text-black p-8 md:p-12 rounded-3xl border border-slate-300 shadow-2xl space-y-6 max-w-4xl mx-auto print:block print:p-0 print:border-none print:shadow-none print:rounded-none`}
      >
        {/* Top Print Trigger bar inside preview */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm text-gray-800">Stage Progress Certificate Preview</span>
          </div>
          <button
            onClick={handlePrintStageCert}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Stage Certificate</span>
          </button>
        </div>

        {/* Certificate Letterhead Header */}
        <div className="text-center border-b-2 border-black pb-4 relative">
          <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight uppercase text-black mt-1">
            VASTHUSILPY
          </h1>
          <div className="text-xs font-serif text-gray-800 font-semibold">
            Approved Building Supervisor
          </div>
          <div className="text-[11px] font-mono text-gray-600 mt-0.5">
            Deepak House, Keralassery (P.O), Palakkad - 678641 • Ph: 9567627277, 7012383137
          </div>

          <div className="absolute right-0 top-0 hidden sm:flex flex-col items-center justify-center w-20 h-20 rounded-full border border-gray-400 text-center p-1">
            <ShieldCheck className="w-5 h-5 text-gray-700" />
            <span className="text-[7px] font-mono font-bold text-gray-800 uppercase leading-none mt-0.5">
              LSGD REGD
            </span>
            <span className="text-[6px] font-mono text-gray-500">KERALA</span>
          </div>
        </div>

        {/* Certificate Title Badge */}
        <div className="text-center my-4">
          <h2 className="text-lg md:text-xl font-bold font-sans underline uppercase tracking-wide">
            CONSTRUCTION STAGE PROGRESS CERTIFICATE
          </h2>
          <div className="flex items-center justify-between text-xs font-mono text-gray-700 mt-2">
            <span>
              <strong>Ref No:</strong> {stageCert.certificateNo}
            </span>
            <span>
              <strong>Date:</strong> {stageCert.issueDate}
            </span>
          </div>
        </div>

        {/* Addressee */}
        <div className="text-xs font-sans text-gray-900 space-y-1">
          <div>To,</div>
          <div className="font-bold">{stageCert.recipientOrAuthority || "To Whomsoever It May Concern"}</div>
        </div>

        {/* Subject Line */}
        <div className="text-xs font-sans font-bold bg-gray-100 p-2.5 rounded border border-gray-300">
          Sub: Stage Progress Certificate of construction progress for{" "}
          <span className="underline">{project.buildingType}</span> owned by{" "}
          <span className="underline">{project.clientName}</span> at{" "}
          <span className="underline">{project.panchayatVillage}</span>.
        </div>

        {/* Body Narrative */}
        <div className="text-xs font-sans leading-relaxed text-gray-900 space-y-3">
          <p>
            This is to certify that I have personally inspected the construction site of the proposed{" "}
            <strong>{project.buildingType}</strong> situated in <strong>RSy No: {project.syNo}</strong>,{" "}
            <strong>Block No: {project.blockNo}</strong>, <strong>Ward No: {project.wardNo}</strong> at{" "}
            <strong>{project.panchayatVillage}</strong>, {project.districtPincode}, owned by{" "}
            <strong>{project.clientName}</strong>, {project.houseName}, {project.postOffice}.
          </p>

          <div className="bg-gray-50 border border-gray-300 rounded p-3 space-y-1.5">
            <div className="font-bold uppercase text-[11px] text-gray-700">
              STAGE OF CONSTRUCTION EXECUTED:
            </div>
            <div className="font-semibold text-gray-950">
              {stageCert.stageName}
            </div>
            <div className="text-gray-800 text-[11px]">
              <strong>Scope of Executed Items: </strong>
              {stageCert.completedItemsSummaryText}
            </div>
          </div>

          {/* Table of Completed Stages Summary (Only Sl. No range, no long item descriptions!) */}
          <div className="space-y-1">
            <div className="font-bold text-[11px] uppercase text-gray-800">
              EXPENDITURE BREAKDOWN OF EXECUTED STAGES & ITEM RANGES:
            </div>
            <table className="w-full text-left text-[11px] font-sans border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200 border border-gray-400 text-gray-800">
                  <th className="p-2 border border-gray-400 text-center w-12 font-bold">Sl.No</th>
                  <th className="p-2 border border-gray-400 font-bold">Floor / Construction Section</th>
                  <th className="p-2 border border-gray-400 text-center font-bold">Covered Estimate Items</th>
                  <th className="p-2 border border-gray-400 text-right w-28 font-bold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {executedStagesSummary.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-500 italic border border-gray-400">
                      No items selected for this stage.
                    </td>
                  </tr>
                ) : (
                  executedStagesSummary.map((stage, idx) => (
                    <tr key={idx} className="border border-gray-400">
                      <td className="p-2 border border-gray-400 text-center font-mono font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-gray-400 font-semibold">
                        {stage.appendixTitle}
                      </td>
                      <td className="p-2 border border-gray-400 text-center font-mono">
                        {stage.fromSl === stage.toSl
                          ? `Item Sl. No. ${stage.fromSl}`
                          : `Sl. No. ${stage.fromSl} to ${stage.toSl} (${stage.itemCount} items)`}
                      </td>
                      <td className="p-2 border border-gray-400 text-right font-semibold font-mono">
                        ₹{stage.subtotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                )}
                {stageCert.includeContingencyProportion && (
                  <tr className="border border-gray-400 bg-gray-50">
                    <td className="p-2 border border-gray-400 text-center font-mono font-bold">
                      {executedStagesSummary.length + 1}
                    </td>
                    <td colSpan={2} className="p-2 border border-gray-400 font-semibold italic text-gray-700">
                      Proportionate Unforeseen Contingencies
                    </td>
                    <td className="p-2 border border-gray-400 text-right font-semibold font-mono">
                      ₹{Math.max(0, stageCert.stageExpenditure - executedStagesSummary.reduce((a, b) => a + b.subtotal, 0)).toLocaleString("en-IN")}
                    </td>
                  </tr>
                )}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-600 text-xs">
                  <td colSpan={3} className="p-2 text-right border border-gray-400">
                    Total Value of Completed Civil Work (Certified Stage Progress Amount):
                  </td>
                  <td className="p-2 text-right border border-gray-400 font-mono text-sm">
                    ₹{stageCert.stageExpenditure.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-300 rounded text-xs space-y-1">
            <div>
              <strong>Total Sanctioned Estimate:</strong> ₹{project.grandTotal.toLocaleString("en-IN")}
            </div>
            <div>
              <strong>Certified Stage Progress Amount:</strong>{" "}
              <span className="font-bold">
                ₹{stageCert.stageExpenditure.toLocaleString("en-IN")} ({numberToIndianWords(stageCert.stageExpenditure)})
              </span>
            </div>
            <div>
              <strong>Remaining Balance to Complete:</strong> ₹{stageCert.remainingBalance.toLocaleString("en-IN")}
            </div>
            <div>
              <strong>Physical Work Progress:</strong> {stageCert.progressPercentage}%
            </div>
          </div>

          <p className="text-[11px] italic text-gray-700">
            {stageCert.engineerRemarks}
          </p>
        </div>

        {/* Engineer Signature & Seal Block */}
        <div className="pt-8 flex items-end justify-between border-t border-gray-300 text-xs font-mono">
          <div className="space-y-1">
            <div className="text-[10px] text-gray-500 uppercase">Verification QR Code:</div>
            <div className="w-20 h-20 border border-gray-400 p-1 flex items-center justify-center bg-white">
              {stageQrUrl ? (
                <img src={stageQrUrl} alt="Stage Verification QR" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-14 h-14 text-gray-800" />
              )}
            </div>
            <div className="text-[8px] text-gray-500">Hash: {project.verificationHash}</div>
          </div>

          <div className="text-right space-y-1">
            <div className="text-[10px] text-gray-500 uppercase flex items-center justify-end gap-1">
              {isAuthorizedSigner && (
                <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                  DIGITALLY SIGNED & VERIFIED
                </span>
              )}
              <span>Certifying Civil Engineer:</span>
            </div>
            <div className="h-10 flex items-center justify-end">
              {isAuthorizedSigner ? (
                <span className="text-xs font-serif italic text-emerald-900 font-bold tracking-wider">
                  Er. {stageCert.engineerName} (Digitally Signed)
                </span>
              ) : null}
            </div>
            <div className="font-bold text-sm font-sans">
              Er. {stageCert.engineerName}
            </div>
            <div className="text-[11px] text-gray-700">
              {stageCert.engineerDesignation}
            </div>
            <div className="text-[10px] text-gray-600">
              Reg No: {stageCert.engineerRegNo}
            </div>
            <div className="text-[9px] text-gray-500">
              Vasthusilpy Consultants, Keralassery
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPLETION CERTIFICATE LETTERHEAD (Rendered for Preview when certMode === "completion", and in dedicated print container) */}
      <div
        id="comp-cert-print-container"
        className={`${
          (viewMode === "preview" && certMode === "completion")
            ? "block"
            : "hidden"
        } bg-white text-black p-8 md:p-12 rounded-3xl border border-slate-300 shadow-2xl space-y-6 max-w-4xl mx-auto print:block print:p-0 print:border-none print:shadow-none print:rounded-none`}
      >
        {!isAllWorksCompleted && viewMode === "preview" ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 font-sans">
              Completion Certificate Not Prepared
            </h3>
            <p className="text-xs text-gray-600 font-mono max-w-md mx-auto">
              The Building Completion Certificate requires 100% completion of entire works. Currently only {completionPercentage}% of work items have been executed.
            </p>
            <button
              onClick={handleCompleteAllWorks}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
            >
              Mark All Works Completed (100%)
            </button>
          </div>
        ) : (
          <>
            {/* Top Print Trigger bar inside preview */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-600" />
                <span className="font-bold text-sm text-gray-800">Building Completion Certificate Preview</span>
              </div>
              <button
                onClick={handlePrintCompletionCert}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Completion Certificate</span>
              </button>
            </div>

            {/* Certificate Letterhead Header */}
            <div className="text-center border-b-2 border-black pb-4 relative">
              <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight uppercase text-black mt-1">
                VASTHUSILPY
              </h1>
              <div className="text-xs font-serif text-gray-800 font-semibold">
                Approved Building Supervisor
              </div>
              <div className="text-[11px] font-mono text-gray-600 mt-0.5">
                Deepak House, Keralassery (P.O), Palakkad - 678641 • Ph: 9567627277, 7012383137
              </div>

              <div className="absolute right-0 top-0 hidden sm:flex flex-col items-center justify-center w-20 h-20 rounded-full border border-gray-400 text-center p-1">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <span className="text-[7px] font-mono font-bold text-gray-800 uppercase leading-none mt-0.5">
                  LSGD REGD
                </span>
                <span className="text-[6px] font-mono text-gray-500">KERALA</span>
              </div>
            </div>

            {/* Certificate Title Badge */}
            <div className="text-center my-4">
              <h2 className="text-lg md:text-xl font-bold font-sans underline uppercase tracking-wide">
                BUILDING COMPLETION CERTIFICATE
              </h2>
              <div className="flex items-center justify-between text-xs font-mono text-gray-700 mt-2">
                <span>
                  <strong>Ref No:</strong> {compCert.certificateNo}
                </span>
                <span>
                  <strong>Date:</strong> {compCert.issueDate}
                </span>
              </div>
            </div>

            {/* Addressee */}
            <div className="text-xs font-sans text-gray-900 space-y-1">
              <div>To,</div>
              <div className="font-bold">{compCert.recipientOrAuthority || compCert.authorityOrBank || "The Secretary / Competent Authority"}</div>
            </div>

            {/* Subject Line */}
            <div className="text-xs font-sans font-bold bg-gray-100 p-2.5 rounded border border-gray-300">
              Sub: Building Completion & Structural Safety Certificate for{" "}
              <span className="underline">{project.buildingType}</span> owned by{" "}
              <span className="underline">{project.clientName}</span> at{" "}
              <span className="underline">{project.panchayatVillage}</span>.
            </div>

            {/* Body Narrative */}
            <div className="text-xs font-sans leading-relaxed text-gray-900 space-y-3">
              <p>
                This is to certify that I have personally inspected the completed construction of the{" "}
                <strong>{project.buildingType}</strong> situated in <strong>RSy No: {project.syNo}</strong>,{" "}
                <strong>Block No: {project.blockNo}</strong>, <strong>Ward No: {project.wardNo}</strong> at{" "}
                <strong>{project.panchayatVillage}</strong>, {project.districtPincode}, owned by{" "}
                <strong>{project.clientName}</strong>, {project.houseName}, {project.postOffice}.
              </p>

              <div className="p-4 bg-gray-50 border border-gray-300 rounded text-xs space-y-2">
                <p className="font-semibold text-gray-900">{compCert.certificationStatement}</p>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-300">
                  <div>
                    <strong>Sanctioned Plinth Area:</strong> {compCert.sanctionedPlinthAreaSqM} Sq.M ({project.plinthAreaSqFt} Sq.Ft)
                  </div>
                  <div>
                    <strong>Constructed Plinth Area:</strong> {compCert.actualConstructedPlinthAreaSqM} Sq.M
                  </div>
                  <div>
                    <strong>Total Final Cost:</strong> ₹{compCert.finalTotalCost.toLocaleString("en-IN")}
                  </div>
                  <div>
                    <strong>Handover Date:</strong> {compCert.completionDate}
                  </div>
                  <div className="col-span-2">
                    <strong>Deviations Observed:</strong> {compCert.deviationsObserved}
                  </div>
                </div>
              </div>

              <p className="text-[11px] italic text-gray-700">
                {compCert.engineerRemarks}
              </p>
            </div>

            {/* Engineer Signature & Seal Block */}
            <div className="pt-8 flex items-end justify-between border-t border-gray-300 text-xs font-mono">
              <div className="space-y-1">
                <div className="text-[10px] text-gray-500 uppercase">Verification QR Code:</div>
                <div className="w-20 h-20 border border-gray-400 p-1 flex items-center justify-center bg-white">
                  {compQrUrl ? (
                    <img src={compQrUrl} alt="Completion Verification QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-14 h-14 text-gray-800" />
                  )}
                </div>
                <div className="text-[8px] text-gray-500">Hash: {project.verificationHash}</div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-[10px] text-gray-500 uppercase flex items-center justify-end gap-1">
                  {isAuthorizedSigner && (
                    <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                      DIGITALLY SIGNED & VERIFIED
                    </span>
                  )}
                  <span>Certifying Civil Engineer:</span>
                </div>
                <div className="h-10 flex items-center justify-end">
                  {isAuthorizedSigner ? (
                    <span className="text-xs font-serif italic text-emerald-900 font-bold tracking-wider">
                      Er. {compCert.engineerName} (Digitally Signed)
                    </span>
                  ) : null}
                </div>
                <div className="font-bold text-sm font-sans">
                  Er. {compCert.engineerName}
                </div>
                <div className="text-[11px] text-gray-700">
                  {compCert.engineerDesignation}
                </div>
                <div className="text-[10px] text-gray-600">
                  Reg No: {compCert.engineerRegNo}
                </div>
                <div className="text-[9px] text-gray-500">
                  Vasthusilpy Consultants, Keralassery
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Verification QR Modal */}
      <VerificationQRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        project={project}
      />
    </div>
  );
};
