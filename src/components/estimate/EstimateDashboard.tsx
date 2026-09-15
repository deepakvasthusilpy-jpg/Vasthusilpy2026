import React, { useState } from "react";
import { EstimateProject, INITIAL_ESTIMATES_LIST } from "../../data/estimateData";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  QrCode,
  Eye,
  Edit,
  Copy,
  Trash2,
  Paperclip,
  ShieldCheck,
  FileText,
  Printer,
  Award,
  FileCheck2,
  FolderKanban,
  Receipt,
  Sparkles,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { VerificationQRModal } from "./modals/VerificationQRModal";
import { AttachmentsModal } from "./modals/AttachmentsModal";
import { AiEstimateCloneModal } from "./modals/AiEstimateCloneModal";
import { triggerPrint } from "../../utils/printHelper";

interface EstimateDashboardProps {
  projects: EstimateProject[];
  onSelectProject: (proj: EstimateProject) => void;
  onCreateNewProject: () => void;
  onGoToSeals: () => void;
  onGoToValuation?: () => void;
  onOpenStageCertificates?: (proj: EstimateProject) => void;
  onDeleteProject?: (id: string) => void;
  onDuplicateProject?: (proj: EstimateProject) => void;
  onConvertToProject?: (proj: EstimateProject) => void;
  onConvertToInvoice?: (proj: EstimateProject) => void;
  onSaveClonedProject?: (clonedProject: EstimateProject, openInEditor?: boolean) => void;
}

export const EstimateDashboard: React.FC<EstimateDashboardProps> = ({
  projects,
  onSelectProject,
  onCreateNewProject,
  onGoToSeals,
  onGoToValuation,
  onOpenStageCertificates,
  onDeleteProject,
  onDuplicateProject,
  onConvertToProject,
  onConvertToInvoice,
  onSaveClonedProject
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Pending" | "Delivered">("All");

  const [qrModalProject, setQrModalProject] = useState<EstimateProject | null>(null);
  const [attachModalProject, setAttachModalProject] = useState<EstimateProject | null>(null);
  const [deleteModalProject, setDeleteModalProject] = useState<EstimateProject | null>(null);
  const [isAiCloneModalOpen, setIsAiCloneModalOpen] = useState(false);
  const [initialDroppedFile, setInitialDroppedFile] = useState<File | null>(null);
  const [isDragOverDashboard, setIsDragOverDashboard] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleDashboardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDashboard(true);
  };

  const handleDashboardDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDashboard(false);
  };

  const handleDashboardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverDashboard(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setInitialDroppedFile(e.dataTransfer.files[0]);
      setIsAiCloneModalOpen(true);
    }
  };

  const handleCloneSuccess = (cloned: EstimateProject, openInEditor: boolean = true) => {
    if (onSaveClonedProject) {
      onSaveClonedProject(cloned, openInEditor);
    } else if (openInEditor) {
      onSelectProject(cloned);
    }
    showNotification(`Cloned estimate "${cloned.id} - ${cloned.clientName}" successfully!`);
  };

  const handleDuplicate = (p: EstimateProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onDuplicateProject) {
      onDuplicateProject(p);
      showNotification(`Duplicated "${p.id} - ${p.clientName}" successfully with a new Estimate Number!`);
    }
  };

  const confirmDelete = () => {
    if (deleteModalProject && onDeleteProject) {
      const id = deleteModalProject.id;
      const name = deleteModalProject.clientName;
      onDeleteProject(id);
      setDeleteModalProject(null);
      showNotification(`Deleted estimate ${id} (${name}) successfully.`);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (p.id && p.id.toLowerCase().includes(term)) ||
      (p.clientName && p.clientName.toLowerCase().includes(term)) ||
      (p.panchayatVillage && p.panchayatVillage.toLowerCase().includes(term)) ||
      (p.syNo && p.syNo.toLowerCase().includes(term)) ||
      (p.buildingType && p.buildingType.toLowerCase().includes(term)) ||
      (p.clientPhone && p.clientPhone.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (filterStatus === "All") return true;
    if (filterStatus === "Active") return p.status === "Active" || !p.status;
    if (filterStatus === "Pending") return p.status === "Pending";
    if (filterStatus === "Delivered") return p.status === "Delivered";
    return true;
  });

  const totalEstimateAmount = projects.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
  const activeCount = projects.filter((p) => p.status === "Active" || !p.status).length;
  const pendingCount = projects.filter((p) => p.status === "Pending").length;
  const deliveredCount = projects.filter((p) => p.status === "Delivered").length;
  const avgCost = projects.length > 0 ? totalEstimateAmount / projects.length : 0;

  return (
    <div
      onDragOver={handleDashboardDragOver}
      onDragLeave={handleDashboardDragLeave}
      onDrop={handleDashboardDrop}
      className="space-y-6 relative"
    >
      {/* Drag & Drop Visual Backdrop Overlay */}
      {isDragOverDashboard && (
        <div className="fixed inset-0 z-50 bg-emerald-950/80 backdrop-blur-md border-4 border-dashed border-emerald-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-emerald-500/50 p-8 rounded-3xl text-center space-y-3 shadow-2xl scale-105 transition-transform">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 animate-bounce">
              <Sparkles className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white font-sans">
              Drop your Estimate Document (PDF, Excel, JPEG) here!
            </h3>
            <p className="text-xs font-mono text-emerald-300">
              Vasthusilpy AI will automatically parse the file and open an editable clone modal.
            </p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 font-mono text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Dashboard Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" />
                <span>VASTHUSILPY QUANTITY SURVEY & ESTIMATE DASHBOARD</span>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-sans uppercase">
              Estimates Directory & Overview
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Manage project quantity estimates, client records, stage payments, and engineer certifications in one place.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Autosave & Cloud Sync Active</span>
            </div>

            {/* Prominent AI Document Clone Button */}
            <button
              onClick={() => {
                setInitialDroppedFile(null);
                setIsAiCloneModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/40 hover:scale-[1.02] cursor-pointer"
              title="Drop or upload a PDF, Excel, or JPEG to generate an editable clone"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>✨ AI Clone from PDF/Excel/JPEG</span>
            </button>

            <button
              onClick={onGoToSeals}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Engineer & Seals</span>
            </button>

            {onGoToValuation && (
              <button
                onClick={onGoToValuation}
                className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>Valuation (Sec 28B/28C)</span>
              </button>
            )}

            <button
              onClick={onCreateNewProject}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Blank Estimate</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Quick Drop Zone Banner */}
      <div
        onClick={() => {
          setInitialDroppedFile(null);
          setIsAiCloneModalOpen(true);
        }}
        className="bg-slate-900/80 hover:bg-slate-900 border-2 border-dashed border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl p-4 md:p-5 transition-all cursor-pointer group shadow-lg flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase">
                INSTANT DOCUMENT CLONER
              </span>
              <span className="text-[11px] font-mono text-amber-300 font-bold hidden sm:inline">
                • PDF • Excel (.xlsx / .csv) • JPEG / PNG Photos
              </span>
            </div>
            <h4 className="text-sm font-bold text-white font-sans mt-0.5">
              Drop any existing Estimate Bill, Quotation, or Spreadsheet here
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              Gemini AI will read all client details, plinth areas, and work items to generate a 100% editable clone modal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-4 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow">
            <Sparkles className="w-4 h-4" />
            <span>Drop File or Click to Clone →</span>
          </span>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">TOTAL ESTIMATES</div>
            <div className="text-2xl font-black text-white font-mono">{projects.length}</div>
            <div className="text-[10px] text-emerald-400 font-mono">Active projects database</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">TOTAL ESTIMATE AMOUNT</div>
            <div className="text-2xl font-black text-white font-mono">
              ₹{(totalEstimateAmount / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[10px] text-slate-400 font-mono">₹{totalEstimateAmount.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">DELIVERED PROJECTS</div>
            <div className="text-2xl font-black text-white font-mono">{deliveredCount}</div>
            <div className="text-[10px] text-slate-400 font-mono">{projects.length - deliveredCount} in progress / pending</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">AVERAGE PROJECT COST</div>
            <div className="text-2xl font-black text-white font-mono">
              ₹{(avgCost / 100000).toFixed(2)} Lakhs
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Per building estimate</div>
          </div>
        </div>
      </div>

      {/* Directory Table Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Top Controls Bar */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/60">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-sans">
              Building Estimate Directory
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              View, edit details, duplicate or delete building estimates
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setFilterStatus("All")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "All" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>All</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === "All" ? "bg-slate-950 text-emerald-400 font-bold" : "bg-slate-900 text-slate-400"}`}>
                  {projects.length}
                </span>
              </button>
              <button
                onClick={() => setFilterStatus("Active")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "Active" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Active</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === "Active" ? "bg-slate-950 text-emerald-400 font-bold" : "bg-slate-900 text-slate-400"}`}>
                  {activeCount}
                </span>
              </button>
              <button
                onClick={() => setFilterStatus("Pending")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "Pending" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Pending</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === "Pending" ? "bg-slate-950 text-emerald-400 font-bold" : "bg-slate-900 text-slate-400"}`}>
                  {pendingCount}
                </span>
              </button>
              <button
                onClick={() => setFilterStatus("Delivered")}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === "Delivered" ? "bg-emerald-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                <span>Delivered</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterStatus === "Delivered" ? "bg-slate-950 text-emerald-400 font-bold" : "bg-slate-900 text-slate-400"}`}>
                  {deliveredCount}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search Estimate No, Client, Sy No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">EST. NO.</th>
                <th className="py-3.5 px-4">CLIENT & ADDRESS</th>
                <th className="py-3.5 px-4">PROJECT & LOCATION</th>
                <th className="py-3.5 px-4">PLINTH AREA</th>
                <th className="py-3.5 px-4">GRAND TOTAL</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-300 font-bold font-sans text-sm">
                          {searchTerm || filterStatus !== "All"
                            ? "No estimates match the current filters"
                            : "No estimate records found"}
                        </div>
                        <p className="text-slate-500 text-xs font-mono">
                          {searchTerm || filterStatus !== "All"
                            ? "Try adjusting your search terms or filter status"
                            : "Create your first building quantity estimate to get started"}
                        </p>
                      </div>
                      {(searchTerm || filterStatus !== "All") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilterStatus("All");
                          }}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
                        >
                          Clear Filters & Show All
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-bold text-emerald-400 whitespace-nowrap">
                      <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        {p.id}
                      </span>
                    </td>

                    <td className="py-4 px-4 min-w-[180px]">
                      <div className="font-bold text-slate-100 font-sans">{p.clientName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.houseName}, {p.panchayatVillage}</div>
                      <div className="text-[10px] text-slate-500">📞 {p.clientPhone}</div>
                    </td>

                    <td className="py-4 px-4 min-w-[220px]">
                      <div className="font-semibold text-slate-200 line-clamp-1 font-sans">{p.buildingType}</div>
                      <div className="text-[10px] text-slate-400">
                        Sy No: <span className="text-amber-400 font-bold">{p.syNo}</span> | Ward: {p.wardNo}
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-200">{p.plinthAreaSqFt} Sq.Ft</div>
                      <div className="text-[10px] text-slate-400">{p.plinthAreaSqM} Sq.M</div>
                    </td>

                    <td className="py-4 px-4 font-bold text-emerald-400 text-sm whitespace-nowrap">
                      ₹{(p.grandTotal || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 w-max ${
                          p.status === "Delivered"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : p.status === "Pending"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-cyan-950 text-cyan-300 border-cyan-800"
                        }`}
                      >
                        {p.status === "Delivered" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span>{p.status || "Active"}</span>
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectProject(p)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 rounded-lg border border-slate-800 hover:border-cyan-800 transition-colors cursor-pointer"
                          title="View / Edit Estimate Sheet"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            onSelectProject(p);
                            setTimeout(() => {
                              triggerPrint(`Vasthusilpy_Estimate_${p.id}_${(p.clientName || "").replace(/\s+/g, "_")}`, "estimate-sheet-container");
                            }, 300);
                          }}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 rounded-lg border border-slate-800 hover:border-emerald-800 transition-colors cursor-pointer"
                          title="Print Estimate Sheet (A4 PDF)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setQrModalProject(p)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                          title="Document Verification QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setAttachModalProject(p)}
                          className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                          title="Attachments & Documents"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>

                        {onOpenStageCertificates && (
                          <button
                            onClick={() => onOpenStageCertificates(p)}
                            className="px-2 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded-lg border border-amber-800 transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px] font-bold shadow-sm"
                            title="Generate Stage & Completion Certificates"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>Certificates</span>
                          </button>
                        )}

                        {onConvertToProject && (
                          <button
                            onClick={() => onConvertToProject(p)}
                            className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-800 transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px] font-bold shadow-sm"
                            title="Convert this Estimate into a CRM Project record"
                          >
                            <FolderKanban className="w-3.5 h-3.5 text-emerald-400" />
                            <span>To Project</span>
                          </button>
                        )}

                        {onConvertToInvoice && (
                          <button
                            onClick={() => onConvertToInvoice(p)}
                            className="px-2 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded-lg border border-cyan-800 transition-colors cursor-pointer flex items-center gap-1 font-mono text-[11px] font-bold shadow-sm"
                            title="Convert this Estimate into an Office Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                            <span>To Invoice</span>
                          </button>
                        )}

                        {onDuplicateProject && (
                          <button
                            onClick={(e) => handleDuplicate(p, e)}
                            className="p-1.5 bg-slate-950 hover:bg-slate-800 text-amber-400 rounded-lg border border-slate-800 hover:border-amber-700/80 transition-colors cursor-pointer"
                            title="Duplicate this Estimate with a New Estimate Number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}

                        {onDeleteProject && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModalProject(p);
                            }}
                            className="p-1.5 bg-slate-950 hover:bg-red-950/80 text-red-400 rounded-lg border border-slate-800 hover:border-red-800/80 transition-colors cursor-pointer"
                            title="Delete Estimate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {qrModalProject && (
        <VerificationQRModal
          isOpen={true}
          onClose={() => setQrModalProject(null)}
          project={qrModalProject}
        />
      )}

      {attachModalProject && (
        <AttachmentsModal
          isOpen={true}
          onClose={() => setAttachModalProject(null)}
          project={attachModalProject}
        />
      )}

      {/* AI Document Clone Modal */}
      {isAiCloneModalOpen && (
        <AiEstimateCloneModal
          isOpen={true}
          onClose={() => {
            setIsAiCloneModalOpen(false);
            setInitialDroppedFile(null);
          }}
          existingProjects={projects}
          onCloneSuccess={handleCloneSuccess}
          initialDroppedFile={initialDroppedFile}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalProject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans">Delete Estimate?</h3>
                <p className="text-xs text-slate-400 font-mono">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Estimate No:</span>
                <span className="font-bold text-emerald-400">{deleteModalProject.id}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Client:</span>
                <span className="font-semibold text-white">{deleteModalProject.clientName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Location:</span>
                <span className="text-slate-400">{deleteModalProject.panchayatVillage}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-1.5">
                <span className="text-slate-500">Total Estimate:</span>
                <span className="font-bold text-emerald-400">₹{deleteModalProject.grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalProject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
