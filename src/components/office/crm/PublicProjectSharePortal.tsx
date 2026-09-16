import React, { useState, useEffect } from "react";
import { CrmProject, ProjectAttachment, SubTask } from "../../../types";
import { loadCrmProjects } from "../../../utils/storageManager";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import {
  FileText,
  MapPin,
  User,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Share2,
  Send,
  Printer,
  ExternalLink,
  Eye,
  Paperclip,
  ShieldCheck,
  Building2,
  Sparkles,
  Copy,
  Check,
  X,
  ChevronRight,
  Image as ImageIcon,
  FileCode,
  QrCode,
  Compass,
  Layers,
  ArrowLeft,
  MessageCircle,
  HardDrive
} from "lucide-react";

interface PublicProjectSharePortalProps {
  projectId: string;
  onGoToApp?: () => void;
}

export const PublicProjectSharePortal: React.FC<PublicProjectSharePortalProps> = ({
  projectId,
  onGoToApp
}) => {
  const [project, setProject] = useState<CrmProject | null>(() => {
    // 1. Initial lookup from localStorage
    try {
      const local = loadCrmProjects();
      const cleanId = (projectId || "").trim().toLowerCase();
      const match = local.find(
        (p) =>
          p.id.toLowerCase() === cleanId ||
          p.id.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanId.replace(/[^a-z0-9]/g, "") ||
          (p.clientPhone && p.clientPhone.replace(/\D/g, "") === cleanId.replace(/\D/g, ""))
      );
      if (match) return match;
    } catch (e) {
      console.warn("Local storage read error", e);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(!project);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"details" | "documents" | "subtasks">("details");
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ProjectAttachment | null>(null);
  const [docFilter, setDocFilter] = useState<"ALL" | "IMAGE" | "PDF" | "LINK">("ALL");
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch from server / Firestore to guarantee fresh data & documents
  useEffect(() => {
    let isMounted = true;

    const fetchProjectData = async () => {
      const cleanId = (projectId || "").trim();
      if (!cleanId) {
        setLoading(false);
        setFetchError("Invalid or missing project identifier.");
        return;
      }

      // Step 1: Query backend server API (/api/crm/projects/:id)
      try {
        const res = await fetch(`/api/crm/projects/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.project && isMounted) {
            setProject(data.project);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Server single project fetch skipped:", err);
      }

      // Step 2: Query all server projects (/api/crm/projects)
      try {
        const resAll = await fetch("/api/crm/projects");
        if (resAll.ok) {
          const dataAll = await resAll.json();
          if (dataAll && Array.isArray(dataAll.projects)) {
            const lowerId = cleanId.toLowerCase();
            const found = dataAll.projects.find(
              (p: CrmProject) =>
                p.id.toLowerCase() === lowerId ||
                p.id.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerId.replace(/[^a-z0-9]/g, "") ||
                (p.clientPhone && p.clientPhone.replace(/\D/g, "") === lowerId.replace(/\D/g, ""))
            );
            if (found && isMounted) {
              setProject(found);
              setLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Server all projects query skipped:", err);
      }

      // Step 3: Query Firestore if configured
      if (db) {
        try {
          const docRef = doc(db, "crm_projects", cleanId);
          const snap = await getDoc(docRef);
          if (snap.exists() && isMounted) {
            setProject(snap.data() as CrmProject);
            setLoading(false);
            return;
          }

          // Search collection
          const colSnap = await getDocs(collection(db, "crm_projects"));
          let foundDoc: CrmProject | null = null;
          const lower = cleanId.toLowerCase();
          colSnap.forEach((d) => {
            const data = d.data() as CrmProject;
            if (
              data.id?.toLowerCase() === lower ||
              data.id?.toLowerCase().replace(/[^a-z0-9]/g, "") === lower.replace(/[^a-z0-9]/g, "")
            ) {
              foundDoc = data;
            }
          });
          if (foundDoc && isMounted) {
            setProject(foundDoc);
            setLoading(false);
            return;
          }
        } catch (dbErr) {
          console.warn("Firestore lookup skipped:", dbErr);
        }
      }

      if (isMounted) {
        setLoading(false);
        if (!project) {
          setFetchError(`Project #${cleanId} could not be located in records.`);
        }
      }
    };

    fetchProjectData();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (!project) return;
    const text = `*Vasthusilpy Engineering - Project Documents & Details*\n\n*Project:* ${project.title} (#${project.id})\n*Client:* ${project.clientName}\n*Location:* ${project.location}\n*Status:* ${project.status}\n\n*View Project Specifications & Download Attachments Without Login:*\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDownloadAttachment = (att: ProjectAttachment) => {
    if (!att.url) return;
    try {
      const link = document.createElement("a");
      link.href = att.url;
      link.download = att.name || `Vasthusilpy_Document_${att.id}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(att.url, "_blank");
    }
  };

  // Filter attachments
  const attachments = project?.attachments || [];
  const filteredAttachments = attachments.filter((att) => {
    if (docFilter === "ALL") return true;
    const type = (att.type || "").toLowerCase();
    const name = (att.name || "").toLowerCase();
    const url = (att.url || "").toLowerCase();

    if (docFilter === "IMAGE") {
      return (
        type.includes("image") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".webp") ||
        url.startsWith("data:image")
      );
    }
    if (docFilter === "PDF") {
      return type.includes("pdf") || name.endsWith(".pdf") || url.includes(".pdf");
    }
    if (docFilter === "LINK") {
      return type === "link" || url.startsWith("http");
    }
    return true;
  });

  const subtasks = project?.subTasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const progressPercent =
    subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Verification Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/30 px-4 py-3 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/50">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase">
                  VASTHUSILPY
                </span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded-md font-mono font-bold">
                  PROJECT PIPELINE RECORD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Public Client Document Portal (Zero Login)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
              title="Print or Save PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md shadow-emerald-950/30"
              title="Share via WhatsApp"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                copiedLink
                  ? "bg-emerald-500 text-slate-950 border-emerald-400"
                  : "bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border-cyan-500/40"
              }`}
              title="Copy shareable link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "COPIED" : "COPY LINK"}</span>
            </button>

            {onGoToApp && (
              <button
                type="button"
                onClick={onGoToApp}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl font-mono cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Office Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl">
            <div className="inline-block p-4 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 animate-spin">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white font-mono uppercase">
                Loading Vasthusilpy Project Pipeline Record...
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Fetching project specifications, milestones, and shareable attachments for #{projectId}
              </p>
            </div>
          </div>
        ) : fetchError || !project ? (
          <div className="bg-slate-900/90 border border-rose-900/60 rounded-3xl p-10 text-center space-y-4 shadow-2xl">
            <div className="inline-block p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-base font-bold text-white font-mono uppercase">
                Project Record Not Found
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {fetchError || "The requested project identifier could not be verified in the public repository."}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => (window.location.href = window.location.origin)}
                  className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all"
                >
                  Return to Vasthusilpy Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* HERO BANNER: Project Title & Key Metrics */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden space-y-5">
              <div className="absolute top-0 right-0 translate-x-6 -translate-y-6 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Badges row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold">
                    #{project.id}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      project.status === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                        : project.status === "IN_PROGRESS"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                        : project.status === "ON_HOLD"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {project.status === "COMPLETED" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span>{project.status.replace("_", " ")}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Created: {project.createdAt || "Active"}</span>
                  </div>
                  {project.dueDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Target: {project.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Client Headline */}
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  {project.title}
                </h1>
                <p className="text-xs sm:text-sm text-cyan-300 font-mono flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Vasthusilpy Engineering Architectural & Building Consultancy</span>
                </p>
              </div>

              {/* Key Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {/* 1. Client Card */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Client Name</span>
                  </div>
                  <p className="font-bold text-sm text-white truncate">{project.clientName}</p>
                  {project.clientPhone && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${project.clientPhone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{project.clientPhone}</span>
                      </a>
                      <a
                        href={`https://wa.me/91${project.clientPhone.replace(/\D/g, "").slice(-10)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* 2. Location Card */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Project Location</span>
                  </div>
                  <p className="font-bold text-sm text-slate-200 line-clamp-1">{project.location}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      project.location + " Kerala"
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline pt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Open in Google Maps</span>
                  </a>
                </div>

                {/* 3. Assignee / Lead Engineer */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Engineer In Charge</span>
                  </div>
                  <p className="font-bold text-sm text-amber-300 uppercase">
                    {project.assignee || "DEEPAK C (ENGINEER)"}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">Vasthusilpy Engineering Desk</p>
                </div>

                {/* 4. Estimated Amount & Financial Status */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Project Estimate</span>
                  </div>
                  <p className="font-extrabold text-sm text-emerald-400 font-mono">
                    ₹{Number(project.estimatedAmount || 0).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {project.invoiceId ? `Invoice: #${project.invoiceId}` : "Standard Contract Terms"}
                  </p>
                </div>
              </div>
            </div>

            {/* NAVIGATION TABS */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "details"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Description & Specifications</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                  activeTab === "documents"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>Documents & Attachments ({attachments.length})</span>
                {attachments.length > 0 && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      activeTab === "documents" ? "bg-slate-950" : "bg-emerald-400"
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("subtasks")}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === "subtasks"
                    ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Scope of Work & Progress ({completedSubtasks}/{subtasks.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: PROJECT DESCRIPTION & SPECIFICATIONS */}
            {activeTab === "details" && (
              <div className="space-y-6">
                {/* Highlight Box: Description & Specifications */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <FileText className="w-5 h-5" />
                      <h2 className="text-base font-bold font-mono uppercase tracking-wide">
                        Project Description & Specifications
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      Official Engineering Scope
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line break-words shadow-inner">
                    {project.description && project.description.trim() ? (
                      project.description
                    ) : (
                      <p className="text-slate-400 italic text-sm">
                        Vasthusilpy Engineering Architectural & Building Project. Architectural drawings, structural plans, estimate calculations, survey coordinates, and sanction documents are administered under this project reference.
                      </p>
                    )}
                  </div>
                </div>

                {/* Scope of Work Progress Overview */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <h3 className="text-sm font-bold font-mono uppercase tracking-wide">
                        Workflow & Milestone Execution
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {progressPercent}% Completed
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Subtask Preview List */}
                  {subtasks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {subtasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 ${
                            task.completed
                              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                              : "bg-slate-950 border-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 font-bold ${
                                task.completed
                                  ? "bg-emerald-500 text-slate-950"
                                  : "border border-slate-600 text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span className="truncate font-sans font-medium">{task.title}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold shrink-0 text-slate-400">
                            {task.completed ? "Done" : "Pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: DOCUMENTS & ATTACHMENTS */}
            {activeTab === "documents" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Paperclip className="w-5 h-5" />
                    <div>
                      <h2 className="text-base font-bold font-mono uppercase tracking-wide">
                        Attached Shareable Documents & Drawings
                      </h2>
                      <p className="text-xs text-slate-400 font-mono">
                        Direct download & preview of architectural drawings, reports, site photos & PDFs
                      </p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px]">
                    {(["ALL", "IMAGE", "PDF", "LINK"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDocFilter(mode)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          docFilter === mode
                            ? "bg-cyan-500 text-slate-950"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredAttachments.length === 0 ? (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                    <div className="inline-block p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                      <Paperclip className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-200 font-mono">
                        No Attached Documents Matching Filter
                      </p>
                      <p className="text-xs text-slate-500 font-mono max-w-sm mx-auto">
                        {attachments.length === 0
                          ? "The engineering team has not uploaded public attachments for this project yet. Please check back shortly or request documents from your project engineer."
                          : "Try selecting 'ALL' in the document filter above."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAttachments.map((att) => {
                      const isImage =
                        att.type?.toLowerCase().includes("image") ||
                        att.name?.toLowerCase().endsWith(".jpg") ||
                        att.name?.toLowerCase().endsWith(".jpeg") ||
                        att.name?.toLowerCase().endsWith(".png") ||
                        att.name?.toLowerCase().endsWith(".webp") ||
                        att.url?.startsWith("data:image");

                      const isPdf =
                        att.type?.toLowerCase().includes("pdf") ||
                        att.name?.toLowerCase().endsWith(".pdf") ||
                        att.url?.includes(".pdf");

                      const isLink = att.type === "link" || att.url?.startsWith("http");

                      return (
                        <div
                          key={att.id}
                          className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 transition-all space-y-3 flex flex-col justify-between group shadow-md"
                        >
                          <div className="space-y-3">
                            {/* Image Thumbnail Preview */}
                            {isImage && att.url && (
                              <div
                                onClick={() => setSelectedPreviewDoc(att)}
                                className="w-full h-44 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative cursor-pointer group-hover:border-cyan-500/40 transition-colors"
                              >
                                <img
                                  src={att.url}
                                  alt={att.name}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <span className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-lg">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview Full View</span>
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Header info */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`p-2.5 rounded-xl shrink-0 border ${
                                  isImage
                                    ? "bg-purple-950 text-purple-300 border-purple-500/40"
                                    : isPdf
                                    ? "bg-rose-950 text-rose-300 border-rose-500/40"
                                    : "bg-cyan-950 text-cyan-300 border-cyan-500/40"
                                }`}
                              >
                                {isImage ? (
                                  <ImageIcon className="w-5 h-5" />
                                ) : isPdf ? (
                                  <FileText className="w-5 h-5" />
                                ) : isLink ? (
                                  <ExternalLink className="w-5 h-5" />
                                ) : (
                                  <Paperclip className="w-5 h-5" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4
                                  className="font-bold text-sm text-white truncate font-mono"
                                  title={att.name}
                                >
                                  {att.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                                  <span className="uppercase text-cyan-400 font-bold">
                                    {att.type || "Document"}
                                  </span>
                                  {att.size && <span>• {att.size}</span>}
                                  {att.uploadedAt && <span>• {att.uploadedAt}</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Document Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                            {att.url && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isImage) {
                                    setSelectedPreviewDoc(att);
                                  } else {
                                    window.open(att.url, "_blank");
                                  }
                                }}
                                className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                            )}

                            {att.url ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(att)}
                                className="py-2 px-3 bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic py-2 col-span-2 text-center">
                                File stored in local offline vault
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SCOPE OF WORK & DETAILED SUBTASKS */}
            {activeTab === "subtasks" && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <h2 className="text-base font-bold font-mono uppercase tracking-wide">
                      Project Tasks, Drawings & Sanction Milestones
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Total: {subtasks.length} Milestones
                  </span>
                </div>

                {subtasks.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic text-center py-8 bg-slate-950 rounded-2xl border border-slate-800">
                    No individual subtasks or milestones defined yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {subtasks.map((task, idx) => (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono ${
                          task.completed
                            ? "bg-slate-950/90 border-emerald-500/40 text-slate-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              task.completed
                                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30"
                                : "border border-slate-700 bg-slate-900 text-slate-400"
                            }`}
                          >
                            {task.completed ? "✓" : idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-white font-sans">{task.title}</p>
                            {task.assignee && (
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Assigned to: {task.assignee}
                              </p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            task.completed
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {task.completed ? "COMPLETED" : "IN PROGRESS"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OFFICIAL VERIFICATION FOOTER */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Vasthusilpy Engineering & Architecture, Palakkad</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <a href="tel:9747995961" className="text-cyan-300 hover:underline">
                    +91 9747995961
                  </a>
                  <span>/</span>
                  <a href="tel:9567627277" className="text-cyan-300 hover:underline">
                    +91 9567627277
                  </a>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 max-w-xl mx-auto font-sans leading-relaxed">
                This verified project document record is hosted directly for client accessibility. No login or account authentication is required to inspect drawings, specifications, and project updates.
              </p>
            </div>
          </>
        )}
      </main>

      {/* FULL-SCREEN IMAGE PREVIEW LIGHTBOX */}
      {selectedPreviewDoc && selectedPreviewDoc.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold truncate">
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{selectedPreviewDoc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(selectedPreviewDoc)}
                  className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/90">
              <img
                src={selectedPreviewDoc.url}
                alt={selectedPreviewDoc.name}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
