import React, { useState, useEffect } from "react";
import { CrmProject, ProjectAttachment, SubTask } from "../../../types";
import { loadCrmProjects } from "../../../utils/storageManager";
import { db } from "../../../lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { VASTHUSILPY_LOGO_SVG } from "../../../data/vasthusilpyLogo";
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
  HardDrive,
  CreditCard,
  Mail,
  Contact,
  Award,
  Search,
  CheckCircle
} from "lucide-react";

interface PublicProjectSharePortalProps {
  projectId: string;
  onGoToApp?: () => void;
}

export const PublicProjectSharePortal: React.FC<PublicProjectSharePortalProps> = ({
  projectId: initialProjectId,
  onGoToApp
}) => {
  const [searchId, setSearchId] = useState<string>(initialProjectId || "");
  const [currentQueryId, setCurrentQueryId] = useState<string>(initialProjectId || "");

  const [project, setProject] = useState<CrmProject | null>(() => {
    // 1. Initial lookup from localStorage
    try {
      const local = loadCrmProjects();
      const cleanId = (initialProjectId || "").trim().toLowerCase();
      if (!cleanId) return null;
      const match = local.find(
        (p) =>
          p.id?.toLowerCase() === cleanId ||
          p.id?.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanId.replace(/[^a-z0-9]/g, "") ||
          (p.receiptNumber && p.receiptNumber.toLowerCase() === cleanId) ||
          (p.clientPhone && p.clientPhone.replace(/\D/g, "") === cleanId.replace(/\D/g, ""))
      );
      if (match) return match;
    } catch (e) {
      console.warn("Local storage read error", e);
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(Boolean(initialProjectId) && !project);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"status" | "details" | "documents" | "subtasks">("status");
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ProjectAttachment | null>(null);
  const [docFilter, setDocFilter] = useState<"ALL" | "IMAGE" | "PDF" | "LINK">("ALL");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allKnownProjects, setAllKnownProjects] = useState<CrmProject[]>([]);

  // Fetch from server / Firestore to guarantee fresh data & documents
  useEffect(() => {
    let isMounted = true;

    const fetchProjectData = async () => {
      const cleanId = (currentQueryId || "").trim();
      if (!cleanId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);

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
            if (isMounted) setAllKnownProjects(dataAll.projects);
            const lowerId = cleanId.toLowerCase();
            const found = dataAll.projects.find(
              (p: CrmProject) =>
                p.id?.toLowerCase() === lowerId ||
                p.id?.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerId.replace(/[^a-z0-9]/g, "") ||
                (p.receiptNumber && p.receiptNumber.toLowerCase() === lowerId) ||
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
              data.id?.toLowerCase().replace(/[^a-z0-9]/g, "") === lower.replace(/[^a-z0-9]/g, "") ||
              (data.receiptNumber && data.receiptNumber.toLowerCase() === lower) ||
              (data.clientPhone && data.clientPhone.replace(/\D/g, "") === lower.replace(/\D/g, ""))
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

      // Step 4: Check local storage
      try {
        const local = loadCrmProjects();
        if (isMounted && allKnownProjects.length === 0) setAllKnownProjects(local);
        const lowerId = cleanId.toLowerCase();
        const found = local.find(
          (p) =>
            p.id?.toLowerCase() === lowerId ||
            p.id?.toLowerCase().replace(/[^a-z0-9]/g, "") === lowerId.replace(/[^a-z0-9]/g, "") ||
            (p.receiptNumber && p.receiptNumber.toLowerCase() === lowerId) ||
            (p.clientPhone && p.clientPhone.replace(/\D/g, "") === lowerId.replace(/\D/g, ""))
        );
        if (found && isMounted) {
          setProject(found);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Local storage lookup fallback error", e);
      }

      if (isMounted) {
        setLoading(false);
        setFetchError(`Project record #${cleanId} not found in records.`);
      }
    };

    fetchProjectData();

    return () => {
      isMounted = false;
    };
  }, [currentQueryId]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (project) {
      const text = `*Vasthusilpy Engineering - Live Project Status*\n\n*Project:* ${project.title} (#${project.id})\n*Client:* ${project.clientName}\n*Location:* ${project.location}\n*Status:* ${project.status}\n*Assigned Engineer:* ${project.assignee || "Er. Deepak C"}\n\n*View Live Status & Deliverables:*\n${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } else {
      const text = `*Vasthusilpy Architectural & Engineering Consultants*\n*Lead Consultant:* Er. Deepak C\n*Phone:* +91 7012383137, +91 9747995961\n*Location:* Near Panchayath Office, Keralassery, Palakkad - 678641\n*Services:* Architectural Plans, 3D Elevation, KPBR & K-SMART Municipal Approvals, Valuation, Estimates\n\n*Digital Visiting Card & CRM Portal:*\n${shareUrl}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Download digital vCard (.vcf) for instant 1-tap contact saving to phone contacts
  const handleDownloadVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:C;Deepak;;Er.;
FN:Er. Deepak C (Vasthusilpy)
ORG:Vasthusilpy Architectural & Engineering Consultants
TITLE:Lead Civil Engineer & Vasthu Consultant
TEL;TYPE=CELL,VOICE,PREF:+917012383137
TEL;TYPE=CELL,VOICE:+919747995961
TEL;TYPE=WORK,VOICE:+919567627277
EMAIL;TYPE=PREF,INTERNET:deepak.vasthusilpy@gmail.com
URL:https://vasthusilpyai.netlify.app
ADR;TYPE=WORK:;;Near Panchayath Office;Keralassery;Kerala;678641;India
NOTE:Architectural Plans, 3D Elevation, KPBR & K-SMART Municipal Sanction Approvals, Vasthu Consultation, Valuation & Estimates
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Er_Deepak_Vasthusilpy.vcf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
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

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchId.trim();
    if (clean) {
      setCurrentQueryId(clean);
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

  // Financial calculations
  const totalCost = Number(project?.estimatedAmount || 0);
  const advanceReceived = Number(project?.advancePayment || 0);
  const balanceRemaining = Math.max(0, totalCost - advanceReceived);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Brand & Action Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 shrink-0"
              dangerouslySetInnerHTML={{ __html: VASTHUSILPY_LOGO_SVG }}
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase">
                  VASTHUSILPY
                </span>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
                  DIGITAL CARD & CRM STATUS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Public Client Portal • Zero Password Needed</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadVCard}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-lg shadow-red-900/40"
              title="Save Er. Deepak to Phone Contacts"
            >
              <Contact className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{copiedCard ? "SAVED TO CONTACTS" : "SAVE CONTACT"}</span>
              <span className="sm:hidden">SAVE</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
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
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title="Copy shareable link"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "COPIED" : "COPY LINK"}</span>
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ========================================================================= */}
        {/* 1. DIGITAL VISITING CARD (VASTHUSILPY & ER. DEEPAK C) */}
        {/* ========================================================================= */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Top row: Logo + Visiting Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl bg-white/5 p-1 border border-slate-700 shadow-md flex items-center justify-center"
                  dangerouslySetInnerHTML={{ __html: VASTHUSILPY_LOGO_SVG }}
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                    VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS
                  </h1>
                  <p className="text-xs sm:text-sm font-bold text-red-400 flex items-center gap-1.5 mt-0.5">
                    <span>Er. Deepak C</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300 font-normal">Lead Civil Engineer & Vasthu Expert</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Near Panchayath Office, Keralassery, Palakkad, Kerala - 678641
                  </p>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 bg-slate-950/80 px-3 py-2 rounded-2xl border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">OFFICIAL REGISTERED CONSULTANT</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Licensed & Certified</span>
                </span>
              </div>
            </div>

            {/* Quick One-Tap Contact Action Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <a
                href="tel:7012383137"
                className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all flex flex-col items-center justify-center gap-1 text-center group"
              >
                <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/40 group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-xs font-black font-mono mt-1">Call Primary</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">+91 7012383137</span>
              </a>

              <a
                href="tel:9747995961"
                className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all flex flex-col items-center justify-center gap-1 text-center group"
              >
                <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/40 group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-xs font-black font-mono mt-1">Call Office</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">+91 9747995961</span>
              </a>

              <a
                href="https://wa.me/917012383137?text=Hello%20Er.%20Deepak,%20I%20scanned%20your%20Vasthusilpy%20receipt/visiting%20card%20and%20would%20like%20an%20update."
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all flex flex-col items-center justify-center gap-1 text-center group"
              >
                <div className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-xs font-black font-mono mt-1">WhatsApp Chat</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Chat with Er. Deepak</span>
              </a>

              <a
                href="mailto:deepak.vasthusilpy@gmail.com"
                className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-white transition-all flex flex-col items-center justify-center gap-1 text-center group"
              >
                <div className="p-2 rounded-xl bg-rose-950 text-rose-400 border border-rose-500/40 group-hover:scale-110 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-black font-mono mt-1">Official Email</span>
                <span className="text-[10px] text-rose-300 font-mono truncate max-w-[110px]">deepak.vasthusilpy</span>
              </a>
            </div>

            {/* Services Showcase Strip */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 sm:p-4 text-xs font-mono">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                🏛️ CONSULTANCY SERVICES & SPECIALIZATIONS:
              </span>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                  📐 2D Floor Plans & Vasthu Vidya
                </span>
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                  🏡 3D Elevation Modeling
                </span>
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                  🏛️ KPBR & K-SMART Municipal Approvals
                </span>
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                  📊 Structural Valuation & Estimation
                </span>
                <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-slate-200">
                  🏗️ Construction Site Supervision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. REAL-TIME CRM PROJECT STATUS SECTION */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          {/* Section Heading & Quick Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-500" />
              <h2 className="text-base sm:text-lg font-black text-white font-mono uppercase tracking-tight">
                Real-time Work & Project CRM Status
              </h2>
            </div>

            {/* Quick Project / Receipt / Phone Search Bar */}
            <form onSubmit={handleManualSearch} className="flex items-center gap-1.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Receipt # / Phone / Project ID..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shrink-0"
              >
                Track
              </button>
            </form>
          </div>

          {loading ? (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
              <div className="inline-block p-3 rounded-full bg-red-950 text-red-400 animate-spin">
                <Compass className="w-7 h-7" />
              </div>
              <p className="text-xs font-mono text-slate-300">
                Fetching live project status, milestone records & attachments...
              </p>
            </div>
          ) : !project ? (
            /* No project loaded or project not found */
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="inline-block p-3 rounded-2xl bg-amber-950 text-amber-400 border border-amber-500/40">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  {fetchError || "Enter Project or Receipt Number to Track Live Status"}
                </h3>
                <p className="text-xs text-slate-400">
                  Please enter your receipt number (e.g. VS000001), client phone number, or project ID in the search box above to view your real-time project pipeline and download blueprints.
                </p>
              </div>

              {/* Quick direct buttons if any known projects exist */}
              {allKnownProjects.length > 0 && (
                <div className="pt-2 text-left max-w-md mx-auto">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1">
                    Recently Active Projects:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {allKnownProjects.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSearchId(p.id);
                          setCurrentQueryId(p.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-red-500 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
                      >
                        {p.clientName} ({p.receiptNumber || p.id.slice(0, 8)})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Project Details & Status Card */
            <div className="space-y-6">
              {/* Project Overview Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
                {/* Header row with badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-500/40 rounded-lg text-xs font-mono font-bold">
                      {project.receiptNumber ? `RECEIPT #${project.receiptNumber}` : `PROJ #${project.id}`}
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
                      <span>Registered: {project.createdAt || "Active"}</span>
                    </div>
                    {project.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-red-400" />
                        <span>Target: {project.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Title & Client Particulars */}
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {project.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                    {project.description || "Vasthu architectural floor planning, 3D elevation modeling, structural design, and K-SMART municipal sanction submission."}
                  </p>
                </div>

                {/* 4-Box Metric Highlights (Client, Location, Financial Statement, Lead) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {/* 1. Client Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Client Details</span>
                    </div>
                    <p className="font-bold text-sm text-white truncate">{project.clientName || "Valued Client"}</p>
                    {project.clientPhone && (
                      <p className="text-xs font-mono text-emerald-400 font-semibold">{project.clientPhone}</p>
                    )}
                  </div>

                  {/* 2. Location */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Site / Location</span>
                    </div>
                    <p className="font-bold text-sm text-slate-200 line-clamp-1">{project.location || "Palakkad, Kerala"}</p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        (project.location || "Palakkad") + " Kerala"
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Google Maps</span>
                    </a>
                  </div>

                  {/* 3. Financial Statement */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>Payment Statement</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Total:</span>
                      <strong className="text-xs font-mono text-white">₹{totalCost.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex items-baseline justify-between text-emerald-400 text-xs">
                      <span>Adv. Paid:</span>
                      <strong className="font-mono">₹{advanceReceived.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="flex items-baseline justify-between text-xs pt-0.5 border-t border-slate-800">
                      <span className="text-slate-400">Balance:</span>
                      <strong className={`font-mono ${balanceRemaining > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {balanceRemaining <= 0 ? "PAID" : `₹${balanceRemaining.toLocaleString("en-IN")}`}
                      </strong>
                    </div>
                  </div>

                  {/* 4. Engineer In Charge */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-400 uppercase">
                      <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                      <span>Assigned Engineer</span>
                    </div>
                    <p className="font-bold text-sm text-red-300 uppercase">
                      {project.assignee || "DEEPAK C (ENGINEER)"}
                    </p>
                    <a
                      href={`https://wa.me/917012383137?text=Hello%20Er.%20Deepak,%20inquiring%20about%20Project%20${encodeURIComponent(project.title)}%20(Receipt%20#${project.receiptNumber || project.id})`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:underline pt-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Ask update on WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Realtime Workflow & Milestones Progress Bar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="text-sm font-bold uppercase tracking-wide">
                      Work Progress & Milestone Execution
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {progressPercent}% Complete ({completedSubtasks}/{subtasks.length || 1} tasks)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Subtasks List */}
                {subtasks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {subtasks.map((task, idx) => (
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
                                : "border border-slate-600 text-slate-500"
                            }`}
                          >
                            {task.completed ? "✓" : idx + 1}
                          </span>
                          <span className="truncate font-sans font-medium">{task.title}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold shrink-0 text-slate-400">
                          {task.completed ? "Done" : "In Progress"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      1. Architectural Drafting & Vasthu Verification
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      2. 3D Elevation Modeling
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                      3. KPBR / K-SMART Municipal Sanction Submission
                    </span>
                  </div>
                )}
              </div>

              {/* Attached Drawings, Documents & Blueprints Vault */}
              {attachments.length > 0 && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-cyan-400 font-mono">
                      <Paperclip className="w-5 h-5" />
                      <h4 className="text-sm font-bold uppercase tracking-wide">
                        Downloadable Drawings & Documents ({attachments.length})
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {attachments.map((att) => {
                      const isImage =
                        att.type?.toLowerCase().includes("image") ||
                        att.name?.toLowerCase().endsWith(".jpg") ||
                        att.name?.toLowerCase().endsWith(".png") ||
                        att.url?.startsWith("data:image");

                      return (
                        <div
                          key={att.id}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                              {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-white truncate font-mono">{att.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{att.type || "Document"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isImage && att.url && (
                              <button
                                type="button"
                                onClick={() => setSelectedPreviewDoc(att)}
                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold cursor-pointer"
                              >
                                View
                              </button>
                            )}
                            {att.url && (
                              <button
                                type="button"
                                onClick={() => handleDownloadAttachment(att)}
                                className="px-2.5 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                <span>Get</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Official Verification Footer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Vasthusilpy Architectural & Engineering Consultants</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ph: +91 7012383137 / +91 9747995961</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xl mx-auto font-sans leading-relaxed">
            Near Panchayath Office, Keralassery, Palakkad - 678641 • Digital visiting card & zero-login live project tracking system for clients.
          </p>
        </div>
      </main>

      {/* FULL-SCREEN IMAGE PREVIEW LIGHTBOX */}
      {selectedPreviewDoc && selectedPreviewDoc.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold truncate">
                <ImageIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{selectedPreviewDoc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachment(selectedPreviewDoc)}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
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

