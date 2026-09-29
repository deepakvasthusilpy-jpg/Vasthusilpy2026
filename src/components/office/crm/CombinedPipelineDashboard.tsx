import React, { useState, useMemo, useEffect } from "react";
import {
  CrmProject,
  Invoice,
  OnlineApplicantRecord,
  ProjectStatus,
  OnlineApplicationStatus
} from "../../../types";
import {
  loadOnlineApplicants,
  saveOnlineApplicants,
  deleteOnlineApplicant
} from "../../../utils/onlineApplicationsManager";
import {
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  FileText,
  FolderKanban,
  CheckCircle2,
  Send,
  AlertCircle,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Layers,
  Columns,
  LayoutGrid,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
  X
} from "lucide-react";

export type PipelineStage = "PROCESSING" | "SUBMITTED" | "COMPLETED";

export interface UnifiedPipelineItem {
  id: string;
  source: "CRM_PROJECT" | "ONLINE_APPLICATION";
  fileNumber: string; // Receipt No or Application No
  fileName: string; // Work Title / Project Title / Remarks
  clientName: string;
  mobileNumber: string;
  place: string;
  workType: string;
  createdAt: string;
  daysInPipeline: number;
  stage: PipelineStage;
  rawStatus: ProjectStatus | OnlineApplicationStatus;
  amount?: number;
  paidAmount?: number;
  balanceDue?: number;
  rawCrmProject?: CrmProject;
  rawOnlineApplicant?: OnlineApplicantRecord;
}

interface CombinedPipelineDashboardProps {
  projects: CrmProject[];
  invoices: Invoice[];
  onSelectProject: (project: CrmProject) => void;
  onEditProject: (project: CrmProject) => void;
  onUpdateProject: (updatedProject: CrmProject) => void;
  onDeleteProject: (projectId: string) => void;
  onShareProject?: (project: CrmProject) => void;
  onOpenNewProjectModal: () => void;
  onSelectOnlineApplicant?: (applicant: OnlineApplicantRecord) => void;
  onEditOnlineApplicant?: (applicant: OnlineApplicantRecord) => void;
  onOpenNewApplicantModal?: () => void;
}

/**
 * Calculates total elapsed days from creation timestamp to current time
 */
export function calculateDaysInPipeline(dateStr?: string): number {
  if (!dateStr) return 0;
  try {
    const createdTime = new Date(dateStr).getTime();
    if (isNaN(createdTime)) return 0;
    const diffMs = Math.max(0, Date.now() - createdTime);
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

/**
 * Maps CRM Project status to standard 3-stage pipeline
 */
export function mapCrmProjectToStage(status: ProjectStatus): PipelineStage {
  switch (status) {
    case "COMPLETED":
      return "COMPLETED";
    case "READY TO SUBMIT":
      return "SUBMITTED";
    case "PENDING":
    case "LAND SURVEY":
    case "PROGRESS":
    default:
      return "PROCESSING";
  }
}

/**
 * Maps Online Application status to standard 3-stage pipeline
 */
export function mapOnlineAppToStage(
  status: OnlineApplicationStatus,
  isCompleted?: boolean
): PipelineStage {
  if (isCompleted || status === "COMPLETED" || status === "APPROVED" || status === "DELIVERED") {
    return "COMPLETED";
  }
  if (status === "SUBMITTED") {
    return "SUBMITTED";
  }
  return "PROCESSING";
}

export const CombinedPipelineDashboard: React.FC<CombinedPipelineDashboardProps> = ({
  projects,
  invoices,
  onSelectProject,
  onEditProject,
  onUpdateProject,
  onDeleteProject,
  onShareProject,
  onOpenNewProjectModal,
  onSelectOnlineApplicant,
  onEditOnlineApplicant,
  onOpenNewApplicantModal
}) => {
  // Live Online Applicants State with active storage & broadcast subscriptions
  const [onlineApplicants, setOnlineApplicants] = useState<OnlineApplicantRecord[]>(() => {
    return loadOnlineApplicants();
  });

  // Re-sync online applicants on window storage / reactive events
  useEffect(() => {
    const handleSync = () => {
      setOnlineApplicants(loadOnlineApplicants());
    };
    window.addEventListener("vasthusilpy_online_applications_updated", handleSync);
    window.addEventListener("vasthusilpy_storage_update", handleSync);
    return () => {
      window.removeEventListener("vasthusilpy_online_applications_updated", handleSync);
      window.removeEventListener("vasthusilpy_storage_update", handleSync);
    };
  }, []);

  // Filter & Search Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<"ALL" | PipelineStage>("ALL");
  const [trackFilter, setTrackFilter] = useState<"ALL" | "CRM_PROJECT" | "ONLINE_APPLICATION">("ALL");
  const [daysFilter, setDaysFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH" | "OVERDUE">("ALL");
  const [viewMode, setViewMode] = useState<"SPLIT" | "KANBAN" | "PROJECTS_ONLY" | "ONLINE_ONLY">("SPLIT");
  const [sortBy, setSortBy] = useState<"DAYS_DESC" | "DAYS_ASC" | "NAME_ASC" | "DATE_DESC">("DAYS_DESC");

  // Transform CRM Projects into unified format
  const crmItems: UnifiedPipelineItem[] = useMemo(() => {
    return projects.map((p) => {
      const days = calculateDaysInPipeline(p.createdAt);
      const stage = mapCrmProjectToStage(p.status);
      const linkedInvoice = invoices.find((inv) => inv.projectId === p.id || inv.id === p.invoiceId);
      const amount = linkedInvoice ? linkedInvoice.grandTotal : p.estimatedAmount || 0;
      const paid = linkedInvoice ? linkedInvoice.totalPaid : p.advancePayment || 0;
      const balance = Math.max(0, amount - paid);

      return {
        id: p.id,
        source: "CRM_PROJECT",
        fileNumber: p.receiptNumber || p.id.replace("crm_proj_", "VS-"),
        fileName: p.title || "Architectural Project",
        clientName: p.clientName || "Client",
        mobileNumber: p.clientPhone || "",
        place: p.location || "Palakkad",
        workType: p.description || p.title || "Civil & Architectural Plan",
        createdAt: p.createdAt || new Date().toISOString(),
        daysInPipeline: days,
        stage,
        rawStatus: p.status,
        amount,
        paidAmount: paid,
        balanceDue: balance,
        rawCrmProject: p
      };
    });
  }, [projects, invoices]);

  // Transform Online Applicants into unified format
  const onlineItems: UnifiedPipelineItem[] = useMemo(() => {
    return onlineApplicants.map((applicant) => {
      const days = calculateDaysInPipeline(applicant.createdAt);
      const stage = mapOnlineAppToStage(applicant.status, applicant.isCompleted);
      const firstApp = applicant.applications?.[0];
      const portalNames = (applicant.applications || []).map((a) => a.portal).filter(Boolean).join(", ");
      const appNumber = firstApp?.applicationNumber || applicant.id.replace("app_", "APP-");
      const workType = portalNames || "Government Portal Application";

      return {
        id: applicant.id,
        source: "ONLINE_APPLICATION",
        fileNumber: appNumber,
        fileName: applicant.notes || firstApp?.remarks || `${applicant.applicantName} - ${portalNames || "Application"}`,
        clientName: applicant.applicantName || "Applicant",
        mobileNumber: applicant.mobileNo || "",
        place: applicant.address || "Kerala",
        workType,
        createdAt: applicant.createdAt || new Date().toISOString(),
        daysInPipeline: days,
        stage,
        rawStatus: applicant.status,
        amount: applicant.billAmount || 0,
        paidAmount: applicant.paidAmount || 0,
        balanceDue: Math.max(0, (applicant.billAmount || 0) - (applicant.paidAmount || 0)),
        rawOnlineApplicant: applicant
      };
    });
  }, [onlineApplicants]);

  // All Items Combined
  const allItems: UnifiedPipelineItem[] = useMemo(() => {
    return [...crmItems, ...onlineItems];
  }, [crmItems, onlineItems]);

  // Comprehensive Multi-Field Filter Function
  const filterItem = (item: UnifiedPipelineItem): boolean => {
    // 1. Search Query Filter (Matches File Name, Client Name, Mobile, Place, Work Type, File No)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const matchFileNo = item.fileNumber.toLowerCase().includes(query);
      const matchFileName = item.fileName.toLowerCase().includes(query);
      const matchClient = item.clientName.toLowerCase().includes(query);
      const matchMobile = item.mobileNumber.toLowerCase().includes(query);
      const matchPlace = item.place.toLowerCase().includes(query);
      const matchWork = item.workType.toLowerCase().includes(query);

      if (!matchFileNo && !matchFileName && !matchClient && !matchMobile && !matchPlace && !matchWork) {
        return false;
      }
    }

    // 2. Stage Filter
    if (stageFilter !== "ALL" && item.stage !== stageFilter) {
      return false;
    }

    // 3. Track Filter
    if (trackFilter !== "ALL" && item.source !== trackFilter) {
      return false;
    }

    // 4. Days Added Filter
    if (daysFilter === "TODAY" && item.daysInPipeline > 0) return false;
    if (daysFilter === "WEEK" && item.daysInPipeline > 7) return false;
    if (daysFilter === "MONTH" && item.daysInPipeline > 30) return false;
    if (daysFilter === "OVERDUE" && item.daysInPipeline < 30) return false;

    return true;
  };

  // Sort Function
  const sortComparator = (a: UnifiedPipelineItem, b: UnifiedPipelineItem) => {
    if (sortBy === "DAYS_DESC") return b.daysInPipeline - a.daysInPipeline;
    if (sortBy === "DAYS_ASC") return a.daysInPipeline - b.daysInPipeline;
    if (sortBy === "NAME_ASC") return a.clientName.localeCompare(b.clientName);
    if (sortBy === "DATE_DESC") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  };

  const filteredCrmItems = useMemo(() => {
    return crmItems.filter(filterItem).sort(sortComparator);
  }, [crmItems, searchQuery, stageFilter, trackFilter, daysFilter, sortBy]);

  const filteredOnlineItems = useMemo(() => {
    return onlineItems.filter(filterItem).sort(sortComparator);
  }, [onlineItems, searchQuery, stageFilter, trackFilter, daysFilter, sortBy]);

  const filteredAllItems = useMemo(() => {
    return allItems.filter(filterItem).sort(sortComparator);
  }, [allItems, searchQuery, stageFilter, trackFilter, daysFilter, sortBy]);

  // Metric Computations
  const metrics = useMemo(() => {
    const totalFiles = allItems.length;
    const totalProcessing = allItems.filter((i) => i.stage === "PROCESSING").length;
    const totalSubmitted = allItems.filter((i) => i.stage === "SUBMITTED").length;
    const totalCompleted = allItems.filter((i) => i.stage === "COMPLETED").length;

    const crmTotal = crmItems.length;
    const crmProcessing = crmItems.filter((i) => i.stage === "PROCESSING").length;
    const crmSubmitted = crmItems.filter((i) => i.stage === "SUBMITTED").length;
    const crmCompleted = crmItems.filter((i) => i.stage === "COMPLETED").length;

    const onlineTotal = onlineItems.length;
    const onlineProcessing = onlineItems.filter((i) => i.stage === "PROCESSING").length;
    const onlineSubmitted = onlineItems.filter((i) => i.stage === "SUBMITTED").length;
    const onlineCompleted = onlineItems.filter((i) => i.stage === "COMPLETED").length;

    const overdueCount = allItems.filter((i) => i.daysInPipeline >= 30 && i.stage !== "COMPLETED").length;
    const avgDays = totalFiles > 0 ? Math.round(allItems.reduce((acc, i) => acc + i.daysInPipeline, 0) / totalFiles) : 0;

    return {
      totalFiles,
      totalProcessing,
      totalSubmitted,
      totalCompleted,
      crmTotal,
      crmProcessing,
      crmSubmitted,
      crmCompleted,
      onlineTotal,
      onlineProcessing,
      onlineSubmitted,
      onlineCompleted,
      overdueCount,
      avgDays
    };
  }, [allItems, crmItems, onlineItems]);

  // Stage Transition Handler for CRM Projects
  const handleQuickAdvanceCrmStage = (proj: CrmProject, newStage: PipelineStage) => {
    let nextStatus: ProjectStatus = proj.status;
    if (newStage === "PROCESSING") nextStatus = "PROGRESS";
    if (newStage === "SUBMITTED") nextStatus = "READY TO SUBMIT";
    if (newStage === "COMPLETED") nextStatus = "COMPLETED";

    const updated = {
      ...proj,
      status: nextStatus
    };
    onUpdateProject(updated);
  };

  // Stage Transition Handler for Online Applicants
  const handleQuickAdvanceOnlineStage = (applicant: OnlineApplicantRecord, newStage: PipelineStage) => {
    let nextStatus: OnlineApplicationStatus = applicant.status;
    let isCompleted = applicant.isCompleted;

    if (newStage === "PROCESSING") {
      nextStatus = "IN_PROGRESS";
      isCompleted = false;
    } else if (newStage === "SUBMITTED") {
      nextStatus = "SUBMITTED";
      isCompleted = false;
    } else if (newStage === "COMPLETED") {
      nextStatus = "COMPLETED";
      isCompleted = true;
    }

    const currentList = loadOnlineApplicants();
    const updated = currentList.map((a) =>
      a.id === applicant.id ? { ...a, status: nextStatus, isCompleted, updatedAt: new Date().toISOString() } : a
    );
    saveOnlineApplicants(updated);
    setOnlineApplicants(updated);
  };

  // Quick WhatsApp Message Generator
  const handleSendWhatsApp = (item: UnifiedPipelineItem) => {
    const phoneClean = item.mobileNumber.replace(/[^0-9]/g, "");
    if (!phoneClean) {
      alert("No valid contact phone number available for this client.");
      return;
    }
    const formattedPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    const stageLabel =
      item.stage === "PROCESSING"
        ? "Under Active Processing & Drawing"
        : item.stage === "SUBMITTED"
        ? "Submitted for Authority / Portal Approval"
        : "Completed & Ready for Handover";

    const message = `*VASTHUSILPY KERALASSERY - WORK STATUS UPDATE*\n\nDear *${item.clientName}*,\n\nYour file *${item.fileNumber}* (${item.fileName}) is currently: *${stageLabel}*.\n\n📍 *Place/Location:* ${item.place}\n⏱️ *Pipeline Duration:* ${item.daysInPipeline} days\n📌 *Work Details:* ${item.workType}\n\nFor any inquiries or drawing adjustments, please contact Er.Deepak.C (+91 7012383137 / +91 8848241463).\n\nThank you,\n*Vasthusilpy Engineering & Architectural Services*`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Clear all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStageFilter("ALL");
    setTrackFilter("ALL");
    setDaysFilter("ALL");
    setSortBy("DAYS_DESC");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" || stageFilter !== "ALL" || trackFilter !== "ALL" || daysFilter !== "ALL";

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER WITH DUAL-TRACK BANNER & VIEW SWITCHER */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold uppercase tracking-wider">
              <FolderKanban className="w-4 h-4 text-cyan-400" />
              <span>Vasthusilpy CRM Workstation</span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400">Integrated Dual Pipeline Monitor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Project Pipeline & Online Applications Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
              Unified multi-track operations hub monitor. Real-time stage tracking across{" "}
              <strong className="text-cyan-300 font-semibold">File Processing</strong>,{" "}
              <strong className="text-blue-300 font-semibold">Submitted</strong>, and{" "}
              <strong className="text-emerald-300 font-semibold">Completed</strong> workflows with live days-elapsed analytics.
            </p>
          </div>

          {/* Quick Action Buttons & View Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewProjectModal}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl text-xs font-mono font-bold shadow-lg shadow-cyan-950/60 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>+ New CRM Project</span>
            </button>

            {onOpenNewApplicantModal && (
              <button
                onClick={onOpenNewApplicantModal}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-2xl text-xs font-mono font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>+ Online Application</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-2xl transition cursor-pointer"
              title="Print Current Pipeline Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Unified Metrics Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">TOTAL ACTIVE FILES</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{metrics.totalFiles}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {metrics.crmTotal} CRM · {metrics.onlineTotal} Online
            </div>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-amber-400 uppercase font-semibold">1. FILE PROCESSING</div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1">{metrics.totalProcessing}</div>
            <div className="text-[10px] text-amber-500/80 mt-0.5">
              {metrics.crmProcessing} CRM · {metrics.onlineProcessing} Online
            </div>
          </div>

          <div className="bg-blue-950/20 border border-blue-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-blue-400 uppercase font-semibold">2. SUBMITTED TO PORTAL</div>
            <div className="text-2xl font-black text-blue-300 font-mono mt-1">{metrics.totalSubmitted}</div>
            <div className="text-[10px] text-blue-400/80 mt-0.5">
              {metrics.crmSubmitted} CRM · {metrics.onlineSubmitted} Online
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-emerald-400 uppercase font-semibold">3. COMPLETED FILES</div>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-1">{metrics.totalCompleted}</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">
              {metrics.crmCompleted} CRM · {metrics.onlineCompleted} Online
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-purple-400 uppercase font-semibold">AVG DURATION</div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-1">{metrics.avgDays} <span className="text-xs text-slate-400">days</span></div>
            <div className="text-[10px] text-purple-400/70 mt-0.5">Live turn-around time</div>
          </div>

          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-mono text-rose-400 uppercase font-semibold">&gt; 30 DAYS ACTIVE</div>
            <div className="text-2xl font-black text-rose-300 font-mono mt-1">{metrics.overdueCount}</div>
            <div className="text-[10px] text-rose-400/70 mt-0.5">Needs immediate review</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ADVANCED MULTI-FIELD SEARCH, FILTERS & VIEW MODE CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Top Row: Search Input + Mode Switcher */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Real-Time Multi-Field Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by File Name, Client Name, Phone, Place (Panchayat), Work type, File/Receipt No..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl text-xs font-mono text-white placeholder-slate-500 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher (Split Dual Columns vs Kanban 3-Stage vs Single Track) */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setViewMode("SPLIT")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === "SPLIT"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split Dual Panes</span>
            </button>

            <button
              onClick={() => setViewMode("KANBAN")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === "KANBAN"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>3-Stage Kanban</span>
            </button>

            <button
              onClick={() => setViewMode("PROJECTS_ONLY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === "PROJECTS_ONLY"
                  ? "bg-slate-800 text-cyan-400 shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>CRM Projects Only</span>
            </button>

            <button
              onClick={() => setViewMode("ONLINE_ONLY")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                viewMode === "ONLINE_ONLY"
                  ? "bg-slate-800 text-emerald-400 shadow-inner"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Online Apps Only</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Stage Filter Buttons + Track Filter + Days Filter + Sort Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Stage Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-500 uppercase font-bold mr-1">STAGE:</span>
            <button
              onClick={() => setStageFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
                stageFilter === "ALL"
                  ? "bg-slate-800 text-white border border-slate-700"
                  : "text-slate-400 hover:text-white hover:bg-slate-950"
              }`}
            >
              All Stages ({filteredAllItems.length})
            </button>

            <button
              onClick={() => setStageFilter("PROCESSING")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "PROCESSING"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                  : "text-slate-400 hover:text-amber-300 hover:bg-slate-950"
              }`}
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>1. File Processing ({metrics.totalProcessing})</span>
            </button>

            <button
              onClick={() => setStageFilter("SUBMITTED")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "SUBMITTED"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                  : "text-slate-400 hover:text-blue-300 hover:bg-slate-950"
              }`}
            >
              <Send className="w-3 h-3 text-blue-400" />
              <span>2. Submitted ({metrics.totalSubmitted})</span>
            </button>

            <button
              onClick={() => setStageFilter("COMPLETED")}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                stageFilter === "COMPLETED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                  : "text-slate-400 hover:text-emerald-300 hover:bg-slate-950"
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>3. Completed ({metrics.totalCompleted})</span>
            </button>
          </div>

          {/* Days Filter + Sort Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Days Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Age Periods</option>
                <option value="TODAY" className="bg-slate-900">Added Today (&lt; 24h)</option>
                <option value="WEEK" className="bg-slate-900">Added Last 7 Days</option>
                <option value="MONTH" className="bg-slate-900">Added Last 30 Days</option>
                <option value="OVERDUE" className="bg-slate-900">&gt; 30 Days Active</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 text-xs font-mono">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-300 text-xs font-mono focus:outline-none cursor-pointer"
              >
                <option value="DAYS_DESC" className="bg-slate-900">Days Added: Longest first</option>
                <option value="DAYS_ASC" className="bg-slate-900">Days Added: Shortest first</option>
                <option value="DATE_DESC" className="bg-slate-900">Date Added: Newest first</option>
                <option value="NAME_ASC" className="bg-slate-900">Client Name: A-Z</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1"
                title="Reset all active search and filters"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN DASHBOARD CONTENT (SPLIT DUAL PANES / KANBAN / SINGLE TRACK) */}
      {/* ========================================================================= */}
      {viewMode === "SPLIT" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT PANE: VASTHUSILPY PROJECTS PIPELINE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Vasthusilpy Projects Pipeline</h3>
                  <p className="text-[11px] text-slate-400">Architectural, Survey, Estimation & Civil Works</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs font-bold text-cyan-400">{filteredCrmItems.length} Files</span>
              </div>
            </div>

            {/* List of CRM Project Cards */}
            {filteredCrmItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80">
                <FolderKanban className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400">No CRM projects match the active filters.</p>
                <button
                  onClick={onOpenNewProjectModal}
                  className="mt-3 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                >
                  + Add Project
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {filteredCrmItems.map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => item.rawCrmProject && onSelectProject(item.rawCrmProject)}
                    onEdit={() => item.rawCrmProject && onEditProject(item.rawCrmProject)}
                    onAdvanceStage={(stg) => item.rawCrmProject && handleQuickAdvanceCrmStage(item.rawCrmProject, stg)}
                    onWhatsApp={() => handleSendWhatsApp(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT PANE: ONLINE APPLICATIONS & PERMIT DIRECTORY */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Online Applications Directory</h3>
                  <p className="text-[11px] text-slate-400">K-SMART, KSEB, Revenue, e-District & Government Portals</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs font-bold text-emerald-400">{filteredOnlineItems.length} Applications</span>
              </div>
            </div>

            {/* List of Online Application Cards */}
            {filteredOnlineItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-mono text-slate-400">No online applications match the active filters.</p>
                {onOpenNewApplicantModal && (
                  <button
                    onClick={onOpenNewApplicantModal}
                    className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                  >
                    + Add Application
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {filteredOnlineItems.map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() =>
                      item.rawOnlineApplicant &&
                      (onSelectOnlineApplicant
                        ? onSelectOnlineApplicant(item.rawOnlineApplicant)
                        : onEditOnlineApplicant?.(item.rawOnlineApplicant))
                    }
                    onEdit={() =>
                      item.rawOnlineApplicant && onEditOnlineApplicant?.(item.rawOnlineApplicant)
                    }
                    onAdvanceStage={(stg) =>
                      item.rawOnlineApplicant && handleQuickAdvanceOnlineStage(item.rawOnlineApplicant, stg)
                    }
                    onWhatsApp={() => handleSendWhatsApp(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: KANBAN 3-STAGE COLUMNS (PROCESSING ➔ SUBMITTED ➔ COMPLETED) */}
      {viewMode === "KANBAN" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* COLUMN 1: FILE PROCESSING */}
          <div className="bg-slate-900/90 border border-amber-900/40 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-black font-mono">
                  1
                </div>
                <h3 className="font-bold text-white text-sm">File Processing</h3>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800/40">
                {filteredAllItems.filter((i) => i.stage === "PROCESSING").length}
              </span>
            </div>

            <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
              {filteredAllItems
                .filter((i) => i.stage === "PROCESSING")
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) onSelectProject(item.rawCrmProject);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) onEditOnlineApplicant?.(item.rawOnlineApplicant);
                    }}
                    onEdit={() => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) onEditProject(item.rawCrmProject);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) onEditOnlineApplicant?.(item.rawOnlineApplicant);
                    }}
                    onAdvanceStage={(stg) => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) handleQuickAdvanceCrmStage(item.rawCrmProject, stg);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) handleQuickAdvanceOnlineStage(item.rawOnlineApplicant, stg);
                    }}
                    onWhatsApp={() => handleSendWhatsApp(item)}
                  />
                ))}
              {filteredAllItems.filter((i) => i.stage === "PROCESSING").length === 0 && (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">No files currently in processing.</div>
              )}
            </div>
          </div>

          {/* COLUMN 2: SUBMITTED */}
          <div className="bg-slate-900/90 border border-blue-900/40 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black font-mono">
                  2
                </div>
                <h3 className="font-bold text-white text-sm">Submitted to Portal</h3>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-800/40">
                {filteredAllItems.filter((i) => i.stage === "SUBMITTED").length}
              </span>
            </div>

            <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
              {filteredAllItems
                .filter((i) => i.stage === "SUBMITTED")
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) onSelectProject(item.rawCrmProject);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) onEditOnlineApplicant?.(item.rawOnlineApplicant);
                    }}
                    onEdit={() => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) onEditProject(item.rawCrmProject);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) onEditOnlineApplicant?.(item.rawOnlineApplicant);
                    }}
                    onAdvanceStage={(stg) => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) handleQuickAdvanceCrmStage(item.rawCrmProject, stg);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) handleQuickAdvanceOnlineStage(item.rawOnlineApplicant, stg);
                    }}
                    onWhatsApp={() => handleSendWhatsApp(item)}
                  />
                ))}
              {filteredAllItems.filter((i) => i.stage === "SUBMITTED").length === 0 && (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">No files currently submitted.</div>
              )}
            </div>
          </div>

          {/* COLUMN 3: COMPLETED */}
          <div className="bg-slate-900/90 border border-emerald-900/40 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/30">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black font-mono">
                  3
                </div>
                <h3 className="font-bold text-white text-sm">Completed & Approved</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                {filteredAllItems.filter((i) => i.stage === "COMPLETED").length}
              </span>
            </div>

            <div className="space-y-3 max-h-[780px] overflow-y-auto pr-1">
              {filteredAllItems
                .filter((i) => i.stage === "COMPLETED")
                .map((item) => (
                  <PipelineCard
                    key={item.id}
                    item={item}
                    onSelect={() => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) onSelectProject(item.rawCrmProject);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) onEditOnlineApplicant?.(item.rawOnlineApplicant);
                    }}
                    onEdit={() => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) onEditProject(item.rawCrmProject);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) onEditOnlineApplicant?.(item.rawOnlineApplicant);
                    }}
                    onAdvanceStage={(stg) => {
                      if (item.source === "CRM_PROJECT" && item.rawCrmProject) handleQuickAdvanceCrmStage(item.rawCrmProject, stg);
                      if (item.source === "ONLINE_APPLICATION" && item.rawOnlineApplicant) handleQuickAdvanceOnlineStage(item.rawOnlineApplicant, stg);
                    }}
                    onWhatsApp={() => handleSendWhatsApp(item)}
                  />
                ))}
              {filteredAllItems.filter((i) => i.stage === "COMPLETED").length === 0 && (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">No completed files.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: PROJECTS ONLY */}
      {viewMode === "PROJECTS_ONLY" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">All Vasthusilpy CRM Projects ({filteredCrmItems.length})</h3>
            <button
              onClick={onOpenNewProjectModal}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
            >
              + New Project
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCrmItems.map((item) => (
              <PipelineCard
                key={item.id}
                item={item}
                onSelect={() => item.rawCrmProject && onSelectProject(item.rawCrmProject)}
                onEdit={() => item.rawCrmProject && onEditProject(item.rawCrmProject)}
                onAdvanceStage={(stg) => item.rawCrmProject && handleQuickAdvanceCrmStage(item.rawCrmProject, stg)}
                onWhatsApp={() => handleSendWhatsApp(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 4: ONLINE ONLY */}
      {viewMode === "ONLINE_ONLY" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base">All Online Applications ({filteredOnlineItems.length})</h3>
            {onOpenNewApplicantModal && (
              <button
                onClick={onOpenNewApplicantModal}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold transition cursor-pointer"
              >
                + New Application
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOnlineItems.map((item) => (
              <PipelineCard
                key={item.id}
                item={item}
                onSelect={() =>
                  item.rawOnlineApplicant &&
                  (onSelectOnlineApplicant
                    ? onSelectOnlineApplicant(item.rawOnlineApplicant)
                    : onEditOnlineApplicant?.(item.rawOnlineApplicant))
                }
                onEdit={() =>
                  item.rawOnlineApplicant && onEditOnlineApplicant?.(item.rawOnlineApplicant)
                }
                onAdvanceStage={(stg) =>
                  item.rawOnlineApplicant && handleQuickAdvanceOnlineStage(item.rawOnlineApplicant, stg)
                }
                onWhatsApp={() => handleSendWhatsApp(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// SUB-COMPONENT: UNIFIED PIPELINE CARD (ZERO-PILL AESTHETIC WITH STAGE STEPPER)
// =============================================================================

interface PipelineCardProps {
  item: UnifiedPipelineItem;
  onSelect: () => void;
  onEdit: () => void;
  onAdvanceStage: (stage: PipelineStage) => void;
  onWhatsApp: () => void;
}

const PipelineCard: React.FC<PipelineCardProps> = ({
  item,
  onSelect,
  onEdit,
  onAdvanceStage,
  onWhatsApp
}) => {
  // Days urgency coloring
  const days = item.daysInPipeline;
  const isFresh = days <= 7;
  const isModerate = days > 7 && days < 30;
  const isOverdue = days >= 30;

  const dateFormatted = useMemo(() => {
    try {
      const d = new Date(item.createdAt);
      if (isNaN(d.getTime())) return item.createdAt;
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return item.createdAt;
    }
  }, [item.createdAt]);

  return (
    <div className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-150 shadow-md hover:shadow-lg group flex flex-col justify-between space-y-3">
      {/* 1. TOP ROW: ENTITY TYPE, FILE NO & AGE BADGE */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {item.source === "CRM_PROJECT" ? (
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span>CRM PROJECT</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>ONLINE APP</span>
              </span>
            )}
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 font-bold">{item.fileNumber}</span>
          </div>

          <h4
            onClick={onSelect}
            className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors cursor-pointer mt-1 line-clamp-1"
          >
            {item.fileName}
          </h4>
        </div>

        {/* PROMINENT DAYS ELAPSED COUNTER */}
        <div
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border shrink-0 ${
            item.stage === "COMPLETED"
              ? "bg-slate-900 text-slate-400 border-slate-800"
              : isFresh
              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
              : isModerate
              ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
              : "bg-rose-950/80 text-rose-200 border-rose-700 animate-pulse"
          }`}
          title={`File added on ${dateFormatted} (${days} days in pipeline)`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            {days === 0 ? "Today" : `${days}d`}
          </span>
        </div>
      </div>

      {/* 2. MIDDLE DETAILS: CLIENT, PHONE, PLACE & WORK TYPE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400 font-sans pt-1">
        <div className="flex items-center gap-1.5 truncate">
          <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-200 font-semibold truncate">{item.clientName}</span>
        </div>

        {item.mobileNumber ? (
          <a
            href={`tel:${item.mobileNumber}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors font-mono truncate"
          >
            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{item.mobileNumber}</span>
          </a>
        ) : (
          <span className="text-slate-600 text-[11px] font-mono">No phone</span>
        )}

        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{item.place}</span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-slate-300 truncate font-mono text-[11px]">{item.workType}</span>
        </div>
      </div>

      {/* 3. 3-STAGE INTERACTIVE PROGRESSION STEPPER */}
      <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
          <span>Workflow Stage:</span>
          <span className="font-bold text-slate-300">
            {item.stage === "PROCESSING"
              ? "1. Processing"
              : item.stage === "SUBMITTED"
              ? "2. Submitted"
              : "3. Completed"}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {/* Step 1: Processing */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage("PROCESSING");
            }}
            className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
              item.stage === "PROCESSING"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "bg-slate-950 text-slate-500 hover:text-amber-300 hover:bg-slate-800"
            }`}
          >
            Processing
          </button>

          {/* Step 2: Submitted */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage("SUBMITTED");
            }}
            className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
              item.stage === "SUBMITTED"
                ? "bg-blue-500 text-slate-950 shadow-md font-black"
                : "bg-slate-950 text-slate-500 hover:text-blue-300 hover:bg-slate-800"
            }`}
          >
            Submitted
          </button>

          {/* Step 3: Completed */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdvanceStage("COMPLETED");
            }}
            className={`py-1 rounded-lg text-[10px] font-mono font-bold transition-all text-center cursor-pointer ${
              item.stage === "COMPLETED"
                ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                : "bg-slate-950 text-slate-500 hover:text-emerald-300 hover:bg-slate-800"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* 4. BOTTOM ACTIONS ROW: DATES, WHATSAPP & MODAL SHORTCUTS */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono">
        <span className="text-slate-500">
          Added {dateFormatted}
        </span>

        <div className="flex items-center gap-1.5">
          {item.mobileNumber && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWhatsApp();
              }}
              className="p-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 rounded-lg transition cursor-pointer"
              title="Send Live Status via WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg transition cursor-pointer"
            title="Edit File / Project Details"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 rounded-lg transition cursor-pointer flex items-center gap-1 font-bold"
            title="Open Details Modal"
          >
            <Eye className="w-3 h-3" />
            <span>Open</span>
          </button>
        </div>
      </div>
    </div>
  );
};
