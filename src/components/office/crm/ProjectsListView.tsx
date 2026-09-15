import React, { useState } from "react";
import { CrmProject, StaffName, ProjectStatus, Invoice, SubTask } from "../../../types";
import {
  FolderKanban,
  Search,
  Filter,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpDown,
  AlertTriangle,
  ChevronRight,
  Eye,
  Building2,
  Phone,
  MapPin,
  Check,
  Edit3,
  Trash2,
  RotateCcw,
  LayoutGrid,
  List,
  IndianRupee,
  CheckCircle,
  TrendingUp,
  Layers,
  Sparkles,
  Share2,
  QrCode,
  CreditCard,
  Receipt,
  ExternalLink,
  Database,
  FileText,
  Copy,
  X,
  ListTodo
} from "lucide-react";
import { OnlineApplicationsTab } from "./OnlineApplicationsTab";

interface ProjectsListViewProps {
  projects: CrmProject[];
  invoices?: Invoice[];
  onSelectProject: (project: CrmProject) => void;
  onUpdateProject: (updated: CrmProject) => void;
  onEditProject?: (project: CrmProject) => void;
  onDeleteProject?: (id: string) => void;
  onShareProject?: (project: CrmProject) => void;
  onReloadProjects?: () => void;
  onOpenNewProjectModal: () => void;
  onRecordPaymentForInvoice?: (invoice: Invoice) => void;
  onCreateInvoiceForProject?: (project: CrmProject) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
  onOpenBackupRestore?: () => void;
}

export const ProjectsListView: React.FC<ProjectsListViewProps> = ({
  projects,
  invoices = [],
  onSelectProject,
  onUpdateProject,
  onEditProject,
  onDeleteProject,
  onShareProject,
  onReloadProjects,
  onOpenNewProjectModal,
  onRecordPaymentForInvoice,
  onCreateInvoiceForProject,
  onSelectInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onOpenBackupRestore
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"pipeline" | "online_applications">("pipeline");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addingTaskForProjectId, setAddingTaskForProjectId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState<string>("");
  const [quickTaskAssignee, setQuickTaskAssignee] = useState<StaffName>("DEEPAK");

  const staffList: StaffName[] = ["DEEPAK", "VISHNU", "DIBIN"];
  const statuses: ProjectStatus[] = [
    "PENDING",
    "LAND SURVEY",
    "PROGRESS",
    "READY TO SUBMIT",
    "COMPLETED"
  ];

  // Copy Project ID with visual confirmation
  const handleCopyProjectId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).catch(() => {
          fallbackClipboardCopy(id);
        });
      } else {
        fallbackClipboardCopy(id);
      }
    } catch {
      fallbackClipboardCopy(id);
    }
    setCopiedId(id);
    setToastMessage(`Project ID #${id} copied to clipboard`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const fallbackClipboardCopy = (text: string) => {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    } catch (err) {
      console.warn("Fallback copy failed", err);
    }
  };

  // Toggle Subtask Directly from table/card row and make task green colour
  const handleToggleSubtask = (
    e: React.MouseEvent,
    project: CrmProject,
    subtaskId: string
  ) => {
    e.stopPropagation();
    const updatedSubTasks = (project.subTasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    const toggled = (project.subTasks || []).find((st) => st.id === subtaskId);
    const isNowDone = !toggled?.completed;

    const completedCount = updatedSubTasks.filter((st) => st.completed).length;
    const allDone = updatedSubTasks.length > 0 && completedCount === updatedSubTasks.length;
    const targetStatus = allDone && project.status !== "COMPLETED" ? "READY TO SUBMIT" : project.status;

    const updated: CrmProject = {
      ...project,
      status: targetStatus,
      subTasks: updatedSubTasks,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: project.assignee,
          action: `${isNowDone ? "Completed (Green)" : "Reopened"} task: "${toggled?.title || "Task"}"`,
          timestamp: new Date().toLocaleString()
        },
        ...(project.activities || [])
      ]
    };

    onUpdateProject(updated);
    setToastMessage(
      isNowDone
        ? `Task "${toggled?.title || ""}" completed (Marked Green)`
        : `Task "${toggled?.title || ""}" marked incomplete`
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Inline Quick Add Subtask
  const handleQuickAddSubtask = (e: React.FormEvent, project: CrmProject) => {
    e.preventDefault();
    e.stopPropagation();
    if (!quickTaskTitle.trim()) return;

    const assignedTo = quickTaskAssignee || project.assignee || "DEEPAK";
    const newSubTask: SubTask = {
      id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: quickTaskTitle.trim(),
      completed: false,
      assignee: assignedTo
    };

    const updated: CrmProject = {
      ...project,
      subTasks: [...(project.subTasks || []), newSubTask],
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: assignedTo,
          action: `Added task: "${newSubTask.title}" assigned to ${assignedTo}`,
          timestamp: new Date().toLocaleString()
        },
        ...(project.activities || [])
      ]
    };

    onUpdateProject(updated);
    setQuickTaskTitle("");
    setAddingTaskForProjectId(null);
    setToastMessage(`Task "${newSubTask.title}" assigned to ${assignedTo}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Change Subtask Assignee
  const handleSubtaskAssigneeChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    project: CrmProject,
    subtaskId: string,
    newAssignee: StaffName
  ) => {
    e.stopPropagation();
    const updatedSubTasks = (project.subTasks || []).map((st) =>
      st.id === subtaskId ? { ...st, assignee: newAssignee } : st
    );
    const targetTask = (project.subTasks || []).find((st) => st.id === subtaskId);
    const updated: CrmProject = {
      ...project,
      subTasks: updatedSubTasks,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: newAssignee,
          action: `Reassigned task "${targetTask?.title || "Task"}" to ${newAssignee}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...(project.activities || [])
      ]
    };
    onUpdateProject(updated);
    setToastMessage(`Task reassigned to ${newAssignee}`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Reload window handler
  const handleReload = () => {
    setIsReloading(true);
    setStatusFilter("ALL");
    setAssigneeFilter("ALL");
    setSearchTerm("");
    if (onReloadProjects) {
      onReloadProjects();
    }
    setToastMessage("Project window reloaded & filters reset.");
    setTimeout(() => {
      setIsReloading(false);
    }, 600);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Quick Assignee Swap directly on list row
  const handleSwapAssignee = (
    e: React.MouseEvent,
    project: CrmProject,
    newStaff: StaffName
  ) => {
    e.stopPropagation();
    if (newStaff === project.assignee) return;
    const updated: CrmProject = {
      ...project,
      assignee: newStaff,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: newStaff,
          action: `Swapped assignee to ${newStaff}`,
          timestamp: new Date().toLocaleString()
        },
        ...project.activities
      ]
    };
    onUpdateProject(updated);
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === "ALL" || p.assignee === assigneeFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientPhone.includes(searchTerm) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesAssignee && matchesSearch;
  });

  // Calculate Status Counts & Financial Totals
  const getStatusCount = (st: string) => {
    if (st === "ALL") return projects.length;
    return projects.filter((p) => p.status === st).length;
  };

  const totalValuation = projects.reduce(
    (sum, p) => sum + (p.estimatedAmount || 0),
    0
  );
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length;
  const activeCount = projects.filter(
    (p) => p.status === "PROGRESS" || p.status === "LAND SURVEY"
  ).length;

  const getStatusBadgeStyle = (st: ProjectStatus) => {
    switch (st) {
      case "PENDING":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "LAND SURVEY":
        return "bg-blue-950 text-blue-300 border-blue-800";
      case "PROGRESS":
        return "bg-amber-950 text-amber-300 border-amber-800";
      case "READY TO SUBMIT":
        return "bg-cyan-950 text-cyan-300 border-cyan-800";
      case "COMPLETED":
        return "bg-emerald-950 text-emerald-300 border-emerald-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-950 hover:text-white font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* EXECUTIVE TOP KPI BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              TOTAL REGISTERED
            </span>
            <FolderKanban className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-sans">
              {projects.length}
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              Projects Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Vasthusilpy Engineering CRM
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              IN PROGRESS / SURVEY
            </span>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-sans">
              {activeCount}
            </span>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              Ongoing Works
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Active Site Operations
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              COMPLETED PERMITS
            </span>
            <CheckCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-sans">
              {completedCount}
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {projects.length > 0
                ? Math.round((completedCount / projects.length) * 100)
                : 0}
              % Completion
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Delivered to Clients
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              CONTRACT PIPELINE
            </span>
            <IndianRupee className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-300 font-sans">
              ₹{totalValuation.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Total Project Value
          </p>
        </div>
      </div>

      {/* TOP HEADER & ACTION CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
              PROFESSIONAL CRM ENGINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {filteredProjects.length} Displayed
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-sans">
            Vasthusilpy Project Pipeline & Window
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Real-time project tracking, staff assignments, customer contacts, and task management.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* OFFLINE BACKUP & RESTORE BUTTON */}
          {onOpenBackupRestore && (
            <button
              type="button"
              onClick={onOpenBackupRestore}
              className="bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 hover:border-cyan-500 px-4 py-3 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-cyan-950/40"
              title="Backup or restore all CRM projects, invoices, and estimates offline"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>OFFLINE BACKUP & RESTORE</span>
            </button>
          )}

          {/* RELOAD PROJECT WINDOW BUTTON */}
          <button
            onClick={handleReload}
            className={`bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 px-4 py-3 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isReloading ? "opacity-75" : ""
            }`}
            title="Reload and Refresh Project Window Data"
          >
            <RotateCcw
              className={`w-4 h-4 text-cyan-400 ${
                isReloading ? "animate-spin text-emerald-400" : ""
              }`}
            />
            <span>RELOAD WINDOW</span>
          </button>

          {/* VIEW MODE TOGGLE */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Grid Cards Layout"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Executive Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* NEW PROJECT BUTTON */}
          <button
            onClick={onOpenNewProjectModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NEW CRM PROJECT</span>
          </button>
        </div>
      </div>

      {/* SUB TABS UNDER VASTHUSILPY PROJECT PIPELINE & WINDOW */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-1.5 flex flex-wrap items-center gap-2 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveSubTab("pipeline")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === "pipeline"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>PROJECT PIPELINE WINDOW</span>
          <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-full font-black">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("online_applications")}
          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === "online_applications"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>ONLINE APPLICATIONS</span>
          <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
            UPI QR 9567627277@SLC
          </span>
        </button>
      </div>

      {activeSubTab === "online_applications" ? (
        <OnlineApplicationsTab />
      ) : (
        <>
          {/* PIPELINE STATUS FILTER TABS */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 flex flex-wrap items-center gap-2 shadow-lg">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <span>ALL PROJECTS</span>
          <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-full font-black">
            {getStatusCount("ALL")}
          </span>
        </button>

        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              statusFilter === st
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <span>{st}</span>
            <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded-full font-black">
              {getStatusCount(st)}
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH BAR & STAFF SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, client name, mobile phone, survey location..."
            className="w-full bg-transparent text-white focus:outline-none placeholder:text-slate-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-slate-500 hover:text-white text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Staff Filter */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[11px]">Staff Assignee:</span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-400 font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">ALL STAFF (DEEPAK, VISHNU, DIBIN)</option>
            {staffList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN CONTENT DISPLAY VIEW */}
      {filteredProjects.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300 font-sans">
            No Projects Matching Criteria
          </h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            No projects matched your active filters. Click "RELOAD WINDOW" or create a new CRM project above.
          </p>
          <button
            onClick={handleReload}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer"
          >
            Reset Filters & Reload Window
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const totalSt = proj.subTasks.length;
            const doneSt = proj.subTasks.filter((st) => st.completed).length;
            const percent = totalSt > 0 ? Math.round((doneSt / totalSt) * 100) : 0;

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-3xl p-5 transition-all duration-200 cursor-pointer shadow-xl flex flex-col justify-between space-y-4 hover:shadow-2xl relative group"
              >
                {/* Card Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      #{proj.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase ${getStatusBadgeStyle(
                        proj.status
                      )}`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-sans line-clamp-1 group-hover:text-emerald-300 transition-colors">
                      {proj.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300 pt-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-semibold text-white">{proj.clientName}</span>
                    </div>
                  </div>

                  {/* Client Contact & Location */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-cyan-400" />
                        <span>Phone:</span>
                      </span>
                      <span className="font-bold text-cyan-300">{proj.clientPhone}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        <span>Location:</span>
                      </span>
                      <span className="font-bold text-slate-300 line-clamp-1">{proj.location}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>Due Date:</span>
                      </span>
                      <span className="font-bold text-emerald-400">{proj.dueDate}</span>
                    </div>
                  </div>

                  {/* Invoice & Payment Button Bar */}
                  {(() => {
                    const linkedInvoice = (invoices || []).find(
                      (inv) => inv.projectId === proj.id || (proj.invoiceId && inv.id === proj.invoiceId)
                    );

                    return (
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[10px] uppercase flex items-center gap-1">
                            <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                            <span>INVOICE & PAYMENT:</span>
                          </span>
                          {linkedInvoice ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectInvoice) onSelectInvoice(linkedInvoice);
                              }}
                              className="text-cyan-300 hover:text-cyan-200 hover:underline font-bold font-mono text-[11px] cursor-pointer flex items-center gap-1"
                              title="Click to view full invoice"
                            >
                              <span>#{linkedInvoice.invoiceNumber}</span>
                              <ExternalLink className="w-3 h-3 text-cyan-400" />
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">No Invoice</span>
                          )}
                        </div>

                        {linkedInvoice ? (
                          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span
                                className={`font-bold block ${
                                  linkedInvoice.paymentStatus === "PAID"
                                    ? "text-emerald-400"
                                    : linkedInvoice.paymentStatus === "PARTIALLY PAID"
                                    ? "text-amber-400"
                                    : "text-rose-400"
                                }`}
                              >
                                {linkedInvoice.paymentStatus || "UNPAID"}
                              </span>
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400">Paid Amount: </span>
                                <span className="text-xs font-bold text-emerald-400">
                                  ₹{(linkedInvoice.totalPaid || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span>Total: ₹{linkedInvoice.grandTotal.toLocaleString("en-IN")}</span>
                              <span>Due: ₹{linkedInvoice.balanceDue.toLocaleString("en-IN")}</span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onRecordPaymentForInvoice) {
                                    onRecordPaymentForInvoice(linkedInvoice);
                                  }
                                }}
                                className={`flex-1 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                                  linkedInvoice.paymentStatus === "PAID"
                                    ? "bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-800"
                                    : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20"
                                }`}
                                title="Record payment for linked invoice"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>
                                  {linkedInvoice.paymentStatus === "PAID" ? "Payment Log (Paid)" : "Pay Invoice"}
                                </span>
                              </button>
                            </div>

                            {/* Under Invoice: Edit and Delete Buttons */}
                            <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                              {onEditInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onEditInvoice(linkedInvoice)}
                                  className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Edit Invoice"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-400" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {onDeleteInvoice && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete Invoice #${linkedInvoice.invoiceNumber}?`)) {
                                      onDeleteInvoice(linkedInvoice.id);
                                    }
                                  }}
                                  className="flex-1 py-1 px-2 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-700 hover:border-rose-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-500">Unbilled Project</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCreateInvoiceForProject) {
                                  onCreateInvoiceForProject(proj);
                                }
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl font-mono text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Create an invoice for this project"
                            >
                              <Plus className="w-3 h-3 text-cyan-400" />
                              <span>Create Invoice</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Staff Switcher & Invoice Bar */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-bold text-[10px] uppercase">Assignee:</span>
                    <div
                      className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {staffList.map((st) => (
                        <button
                          key={st}
                          onClick={(e) => handleSwapAssignee(e, proj, st)}
                          className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                            proj.assignee === st
                              ? "bg-cyan-500 text-slate-950 shadow-sm font-black"
                              : "text-slate-400 hover:text-white hover:bg-slate-900"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tasks & Subtasks Progress & Interactive List */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 font-mono" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase flex items-center gap-1">
                        <ListTodo className="w-3 h-3 text-emerald-400" />
                        <span>Tasks & Subtasks:</span>
                      </span>
                      <span
                        className={`font-black ${
                          doneSt === totalSt && totalSt > 0 ? "text-emerald-400" : "text-cyan-300"
                        }`}
                      >
                        {doneSt}/{totalSt} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Subtask list with green tick marks and assignee selectors */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5 pt-1">
                      {(proj.subTasks || []).map((st) => (
                        <div
                          key={st.id}
                          className={`flex items-center justify-between gap-1.5 p-1.5 rounded-xl border transition-all ${
                            st.completed
                              ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                              : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => handleToggleSubtask(e, proj, st.id)}
                              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                st.completed
                                  ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/50"
                                  : "bg-slate-950 border-slate-700 text-transparent hover:border-emerald-400"
                              }`}
                              title={st.completed ? "Mark incomplete" : "Click tick mark to complete (green)"}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </button>
                            <span
                              onClick={(e) => handleToggleSubtask(e, proj, st.id)}
                              className={`text-xs font-sans break-words cursor-pointer flex-1 select-none transition-colors ${
                                st.completed
                                  ? "text-emerald-400 font-bold line-through decoration-emerald-500/60"
                                  : "text-slate-200 font-medium hover:text-white"
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>

                          {/* Inline Subtask Assignee */}
                          <select
                            value={st.assignee || proj.assignee || "DEEPAK"}
                            onChange={(e) => handleSubtaskAssigneeChange(e, proj, st.id, e.target.value as StaffName)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-950 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[9.5px] font-mono font-bold rounded px-1.5 py-0.5 cursor-pointer shrink-0"
                            title={`Assignee for this task: ${st.assignee || proj.assignee || "DEEPAK"}`}
                          >
                            <option value="DEEPAK">DEEPAK</option>
                            <option value="VISHNU">VISHNU</option>
                            <option value="DIBIN">DIBIN</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Actions Row */}
                  <div className="flex items-center justify-between gap-2 pt-1 font-mono">
                    {/* View Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(proj);
                      }}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>VIEW</span>
                    </button>

                    {/* Quick Share, Edit & Delete Actions */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {/* Copy ID Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCopyProjectId(e, proj.id)}
                        className="px-2 py-1.5 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Copy Project ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>#{proj.id}</span>
                      </button>

                      {onShareProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShareProject(proj);
                          }}
                          className="px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Share Project via QR Code & Link"
                        >
                          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                          <span>QR</span>
                        </button>
                      )}

                      {onEditProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProject(proj);
                          }}
                          className="p-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Edit Project Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {onDeleteProject && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteProject(proj.id);
                          }}
                          className="p-2 bg-slate-950 hover:bg-red-950 text-red-400 border border-slate-800 hover:border-red-800 rounded-xl transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE / EXECUTIVE PIPELINE VIEW - 4 COLUMNS: MERGED ASSIGNEES & TASKS, INVOICE WITH PAID AMOUNT & ACTIONS, AND VERTICALLY STACKED ACTIONS & PROJECT ID */
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-300 uppercase text-[10px] border-b border-slate-800 tracking-wider">
              <tr>
                {/* 1ST COLUMN: CLIENT NAME, CONTACT NO, LOCATION */}
                <th className="py-4 px-5 min-w-[240px]">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <User className="w-3.5 h-3.5" />
                    <span>1. Client, Contact & Location</span>
                  </div>
                </th>

                {/* 2ND COLUMN: MERGED ASSIGNEES, TASKS & SUBTASKS */}
                <th className="py-4 px-5 min-w-[360px]">
                  <div className="flex items-center justify-between gap-2 text-cyan-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                      <span>2. Assignees, Tasks & Subtasks</span>
                    </div>
                    <span className="text-[9px] font-normal text-emerald-300/80 uppercase">
                      (Assignee for all tasks)
                    </span>
                  </div>
                </th>

                {/* 3RD COLUMN: INVOICE PAYMENT */}
                <th className="py-4 px-5 min-w-[240px]">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>3. Invoice Payment</span>
                  </div>
                </th>

                {/* 4TH COLUMN: ACTIONS & PROJECT ID (STACKED ONE UNDER ANOTHER) */}
                <th className="py-4 px-5 min-w-[170px] text-right">
                  <div className="flex items-center justify-end gap-1.5 text-cyan-400 font-bold">
                    <Layers className="w-3.5 h-3.5" />
                    <span>4. Actions & Project ID</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {filteredProjects.map((proj) => {
                const totalSt = (proj.subTasks || []).length;
                const doneSt = (proj.subTasks || []).filter((st) => st.completed).length;
                const percent = totalSt > 0 ? Math.round((doneSt / totalSt) * 100) : 0;

                const linkedInvoice = (invoices || []).find(
                  (inv) => inv.projectId === proj.id || (proj.invoiceId && inv.id === proj.invoiceId)
                );

                return (
                  <tr
                    key={proj.id}
                    onClick={() => onSelectProject(proj)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* 1ST COLUMN: CLIENT NAME, CONTACT NO, LOCATION */}
                    <td className="py-4 px-5 align-top">
                      <div className="space-y-2 font-sans">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-sm">
                            {proj.clientName ? proj.clientName.charAt(0).toUpperCase() : "C"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm tracking-wide leading-tight group-hover:text-cyan-300 transition-colors">
                              {proj.clientName}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 italic font-mono pt-0.5">
                              {proj.title}
                            </div>
                          </div>
                        </div>

                        {/* Contact No */}
                        <div>
                          <a
                            href={`tel:${proj.clientPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300 hover:text-cyan-100 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-cyan-500/50 transition-colors shadow-sm"
                            title="Call client"
                          >
                            <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{proj.clientPhone}</span>
                          </a>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-sans">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="line-clamp-1 font-medium">{proj.location}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2ND COLUMN: MERGED ASSIGNEES, TASKS & SUBTASKS */}
                    <td className="py-4 px-5 align-top">
                      <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* Project Lead Assignee & Quick Switcher */}
                        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 uppercase font-bold">Project Lead:</span>
                            <span className="px-2 py-0.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono font-black text-[11px] flex items-center gap-1 shadow-sm">
                              <User className="w-3 h-3 text-cyan-400" />
                              <span>{proj.assignee}</span>
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadgeStyle(
                                proj.status
                              )}`}
                            >
                              {proj.status}
                            </span>
                          </div>

                          {/* Quick Staff Switcher for Project */}
                          <div
                            className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800"
                            title="Quickly switch lead assignee"
                          >
                            {staffList.map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={(e) => handleSwapAssignee(e, proj, st)}
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                                  proj.assignee === st
                                    ? "bg-cyan-500 text-slate-950 font-black"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Progress Header & Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400 font-semibold flex items-center gap-1">
                              <ListTodo className="w-3 h-3 text-emerald-400" />
                              <span>Tasks & Subtasks:</span>
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                Due: <strong className="text-slate-200">{proj.dueDate}</strong>
                              </span>
                              <span
                                className={`font-black ${
                                  doneSt === totalSt && totalSt > 0
                                    ? "text-emerald-400"
                                    : "text-cyan-300"
                                }`}
                              >
                                {doneSt}/{totalSt} ({percent}%)
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Tasks & Subtasks List with Individual Assignees & Green Checkmarks */}
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {(proj.subTasks || []).length === 0 ? (
                            <div className="text-[11px] text-slate-500 italic py-1 flex items-center gap-1 font-sans">
                              <span>No tasks added yet.</span>
                            </div>
                          ) : (
                            proj.subTasks.map((st) => (
                              <div
                                key={st.id}
                                className={`flex items-center justify-between gap-2 p-1.5 rounded-xl border transition-all ${
                                  st.completed
                                    ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                                    : "bg-slate-950/80 border-slate-800/90 text-slate-300 hover:border-slate-700"
                                }`}
                              >
                                {/* TICK MARK BUTTON - CLICK TURNS TASK GREEN */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleSubtask(e, proj, st.id)}
                                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                      st.completed
                                        ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/50 font-black"
                                        : "bg-slate-900 border-slate-700 text-transparent hover:border-emerald-400 hover:text-emerald-400/50"
                                    }`}
                                    title={
                                      st.completed
                                        ? "Task Completed! (Click to reopen)"
                                        : "Click tick mark to mark complete (turns task green)"
                                    }
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>

                                  {/* TASK TITLE */}
                                  <span
                                    onClick={(e) => handleToggleSubtask(e, proj, st.id)}
                                    className={`text-xs font-sans break-words cursor-pointer flex-1 select-none transition-colors ${
                                      st.completed
                                        ? "text-emerald-400 font-bold line-through decoration-emerald-500/60"
                                        : "text-slate-200 font-medium hover:text-white"
                                    }`}
                                  >
                                    {st.title}
                                  </span>

                                  {st.completed && (
                                    <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-600/60 shrink-0">
                                      DONE
                                    </span>
                                  )}
                                </div>

                                {/* ASSIGNEE FOR EVERY SUBTASK */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <select
                                    value={st.assignee || proj.assignee || "DEEPAK"}
                                    onChange={(e) =>
                                      handleSubtaskAssigneeChange(e, proj, st.id, e.target.value as StaffName)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[10px] font-mono font-bold rounded-lg px-2 py-0.5 cursor-pointer shrink-0 transition-colors"
                                    title={`Assignee for this task: ${st.assignee || proj.assignee || "DEEPAK"}`}
                                  >
                                    <option value="DEEPAK" className="bg-slate-900 text-white">DEEPAK</option>
                                    <option value="VISHNU" className="bg-slate-900 text-white">VISHNU</option>
                                    <option value="DIBIN" className="bg-slate-900 text-white">DIBIN</option>
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Inline Quick Add Task with Assignee Selection */}
                        {addingTaskForProjectId === proj.id ? (
                          <form
                            onSubmit={(e) => handleQuickAddSubtask(e, proj)}
                            className="flex items-center gap-1.5 pt-1"
                          >
                            <input
                              type="text"
                              value={quickTaskTitle}
                              onChange={(e) => setQuickTaskTitle(e.target.value)}
                              placeholder="Enter task name..."
                              autoFocus
                              className="bg-slate-950 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none flex-1 font-sans"
                            />
                            <select
                              value={quickTaskAssignee}
                              onChange={(e) => setQuickTaskAssignee(e.target.value as StaffName)}
                              className="bg-slate-950 border border-slate-700 text-cyan-300 text-[10px] font-mono font-bold rounded-xl px-2 py-1 cursor-pointer"
                              title="Select Assignee for this new task"
                            >
                              <option value="DEEPAK">DEEPAK</option>
                              <option value="VISHNU">VISHNU</option>
                              <option value="DIBIN">DIBIN</option>
                            </select>
                            <button
                              type="submit"
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold rounded-xl text-xs cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingTaskForProjectId(null);
                                setQuickTaskTitle("");
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingTaskForProjectId(proj.id);
                              setQuickTaskTitle("");
                              setQuickTaskAssignee(proj.assignee || "DEEPAK");
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 hover:text-emerald-300 pt-0.5 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3 h-3 text-emerald-400" />
                            <span>+ Add Task / Subtask with Assignee</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 3RD COLUMN: INVOICE PAYMENT WITH PAID AMOUNT & EDIT/DELETE BUTTONS */}
                    <td className="py-4 px-5 align-top">
                      <div className="space-y-2 font-mono" onClick={(e) => e.stopPropagation()}>
                        {linkedInvoice ? (
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                            {/* Invoice Link & Status */}
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onSelectInvoice && onSelectInvoice(linkedInvoice)}
                                className="text-cyan-300 hover:text-cyan-200 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                                title="Open Invoice"
                              >
                                <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                                <span>#{linkedInvoice.invoiceNumber}</span>
                                <ExternalLink className="w-3 h-3 text-cyan-400" />
                              </button>

                              <span
                                className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${
                                  linkedInvoice.paymentStatus === "PAID"
                                    ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                                    : linkedInvoice.paymentStatus === "PARTIALLY PAID"
                                    ? "bg-amber-950 text-amber-300 border-amber-700"
                                    : "bg-rose-950 text-rose-300 border-rose-700"
                                }`}
                              >
                                {linkedInvoice.paymentStatus || "UNPAID"}
                              </span>
                            </div>

                            {/* Financial breakdown: Total, Paid Amount, Balance */}
                            <div className="text-[11px] space-y-1 border-t border-slate-800/80 pt-1.5">
                              <div className="text-slate-400 flex items-center justify-between">
                                <span>Total:</span>
                                <span className="font-bold text-white">
                                  ₹{linkedInvoice.grandTotal.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-emerald-400 font-bold">Paid Amount:</span>
                                <span className="font-black text-emerald-400">
                                  ₹{(linkedInvoice.totalPaid || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Balance:</span>
                                <span
                                  className={`font-black ${
                                    linkedInvoice.balanceDue > 0 ? "text-rose-400" : "text-emerald-400"
                                  }`}
                                >
                                  ₹{linkedInvoice.balanceDue.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            {/* Action Button: Pay Invoice */}
                            <button
                              type="button"
                              onClick={() =>
                                onRecordPaymentForInvoice && onRecordPaymentForInvoice(linkedInvoice)
                              }
                              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                                linkedInvoice.paymentStatus === "PAID"
                                  ? "bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                                  : "bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400 font-black shadow-md shadow-emerald-500/20"
                              }`}
                              title={`Record payment for Invoice #${linkedInvoice.invoiceNumber}`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>
                                {linkedInvoice.paymentStatus === "PAID"
                                  ? "Payment Log (Paid)"
                                  : `Pay Invoice (₹${linkedInvoice.balanceDue.toLocaleString("en-IN")})`}
                              </span>
                            </button>

                            {/* Under Invoice: Edit and Delete Buttons */}
                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                              {onEditInvoice && (
                                <button
                                  type="button"
                                  onClick={() => onEditInvoice(linkedInvoice)}
                                  className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/50 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Edit Invoice"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-400" />
                                  <span>EDIT</span>
                                </button>
                              )}
                              {onDeleteInvoice && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete Invoice #${linkedInvoice.invoiceNumber}?`)) {
                                      onDeleteInvoice(linkedInvoice.id);
                                    }
                                  }}
                                  className="flex-1 py-1 px-2 bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-700 hover:border-rose-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  title="Delete Invoice"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>DELETE</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                            <div className="text-slate-400 text-[11px] flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span>No invoice linked</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onCreateInvoiceForProject && onCreateInvoiceForProject(proj)}
                              className="w-full px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                              title="Create Invoice for Project"
                            >
                              <Plus className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Create Invoice</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 4TH COLUMN: ACTIONS AND PROJECT ID - EACH ITEM COMES ONE UNDER ANOTHER */}
                    <td className="py-4 px-5 align-top text-right">
                      <div className="flex flex-col gap-1.5 w-36 ml-auto font-mono" onClick={(e) => e.stopPropagation()}>
                        {/* 1. PROJECT ID BADGE WITH COPY BUTTON */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyProjectId(e, proj.id)}
                          className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/60 px-2.5 py-1.5 rounded-xl text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                          title="Click to copy Project ID"
                        >
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>#{proj.id}</span>
                          {copiedId === proj.id && (
                            <span className="text-[9px] text-emerald-400 font-black ml-1">Copied!</span>
                          )}
                        </button>

                        {/* 2. VIEW BUTTON */}
                        <button
                          type="button"
                          onClick={() => onSelectProject(proj)}
                          className="w-full py-1.5 px-3 bg-slate-950 hover:bg-emerald-950 text-emerald-400 border border-slate-800 hover:border-emerald-600/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="View Project Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>VIEW</span>
                        </button>

                        {/* 3. QR CODE BUTTON */}
                        {onShareProject && (
                          <button
                            type="button"
                            onClick={() => onShareProject(proj)}
                            className="w-full py-1.5 px-3 bg-slate-950 hover:bg-cyan-950 text-cyan-300 border border-slate-800 hover:border-cyan-600/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Share Project via QR Code & Link"
                          >
                            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>QR CODE</span>
                          </button>
                        )}

                        {/* 4. EDIT BUTTON */}
                        {onEditProject && (
                          <button
                            type="button"
                            onClick={() => onEditProject(proj)}
                            className="w-full py-1.5 px-3 bg-slate-950 hover:bg-amber-950 text-amber-300 border border-slate-800 hover:border-amber-600/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Edit Project Details"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>EDIT</span>
                          </button>
                        )}

                        {/* 5. DELETE BUTTON */}
                        {onDeleteProject && (
                          <button
                            type="button"
                            onClick={() => onDeleteProject(proj.id)}
                            className="w-full py-1.5 px-3 bg-slate-950 hover:bg-rose-950 text-rose-400 border border-slate-800 hover:border-rose-600/70 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>DELETE</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </>
      )}
    </div>
  );
};
