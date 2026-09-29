import React, { useState, useEffect } from "react";
import { safeJsonResponse } from "../../../utils/safeFetch";
import { CrmProject, ProjectAttachment, SubTask, Invoice, PaymentRecord, InvoiceItem } from "../../../types";
import { loadCrmProjects, loadInvoices } from "../../../utils/storageManager";
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
  HardDrive,
  CreditCard,
  Mail,
  Contact,
  Award,
  Search,
  CheckCircle,
  Receipt,
  ListTodo,
  StickyNote,
  Headphones,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Tag,
  Briefcase,
  AlertTriangle
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

  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(initialProjectId) && !project);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"overview" | "billing" | "tasks" | "notes" | "documents">("overview");
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ProjectAttachment | null>(null);
  const [docFilter, setDocFilter] = useState<"ALL" | "IMAGE" | "PDF" | "LINK">("ALL");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allKnownProjects, setAllKnownProjects] = useState<CrmProject[]>([]);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  // Fetch project data and linked invoices
  useEffect(() => {
    let isMounted = true;

    const fetchProjectAndInvoices = async () => {
      const cleanId = (currentQueryId || "").trim();
      if (!cleanId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);

      let foundProj: CrmProject | null = null;

      // Step 1: Query backend server API (/api/crm/projects/:id)
      try {
        const res = await fetch(`/api/crm/projects/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const parsed = await safeJsonResponse(res);
          const data = parsed.data || {};
          if (data && data.success && data.project && isMounted) {
            foundProj = data.project;
          }
        }
      } catch (err) {
        console.warn("Server single project fetch skipped:", err);
      }

      // Step 2: Query all server projects (/api/crm/projects)
      if (!foundProj) {
        try {
          const resAll = await fetch("/api/crm/projects");
          if (resAll.ok) {
            const parsedAll = await safeJsonResponse(resAll);
            const dataAll = parsedAll.data || {};
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
                foundProj = found;
              }
            }
          }
        } catch (err) {
          console.warn("Server all projects query skipped:", err);
        }
      }

      // Step 3: Query Firestore if configured
      if (!foundProj && db) {
        try {
          const docRef = doc(db, "crm_projects", cleanId);
          const snap = await getDoc(docRef);
          if (snap.exists() && isMounted) {
            foundProj = snap.data() as CrmProject;
          } else {
            const colSnap = await getDocs(collection(db, "crm_projects"));
            const lower = cleanId.toLowerCase();
            colSnap.forEach((d) => {
              const data = d.data() as CrmProject;
              if (
                data.id?.toLowerCase() === lower ||
                data.id?.toLowerCase().replace(/[^a-z0-9]/g, "") === lower.replace(/[^a-z0-9]/g, "") ||
                (data.receiptNumber && data.receiptNumber.toLowerCase() === lower) ||
                (data.clientPhone && data.clientPhone.replace(/\D/g, "") === lower.replace(/\D/g, ""))
              ) {
                foundProj = data;
              }
            });
          }
        } catch (dbErr) {
          console.warn("Firestore lookup skipped:", dbErr);
        }
      }

      // Step 4: Check local storage
      if (!foundProj) {
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
            foundProj = found;
          }
        } catch (e) {
          console.warn("Local storage lookup fallback error", e);
        }
      }

      if (foundProj && isMounted) {
        setProject(foundProj);
        setLoading(false);

        // Fetch all linked invoices
        try {
          let allInvoices: Invoice[] = [];
          try {
            const resInv = await fetch("/api/invoices");
            if (resInv.ok) {
              const parsedInv = await safeJsonResponse(resInv);
              if (parsedInv.data?.invoices) {
                allInvoices = parsedInv.data.invoices;
              }
            }
          } catch {}

          if (allInvoices.length === 0) {
            allInvoices = loadInvoices();
          }

          const matchedInvoices = allInvoices.filter(
            (inv) =>
              inv.projectId === foundProj?.id ||
              (foundProj?.clientPhone && inv.applicantMobile && inv.applicantMobile.replace(/\D/g, "") === foundProj.clientPhone.replace(/\D/g, "")) ||
              (foundProj?.clientName && inv.applicantName && inv.applicantName.trim().toLowerCase() === foundProj.clientName.trim().toLowerCase())
          );

          setLinkedInvoices(matchedInvoices);
        } catch (invErr) {
          console.warn("Error loading invoices for project:", invErr);
        }

        return;
      }

      if (isMounted) {
        setLoading(false);
        setFetchError(`Project record #${cleanId} not found in records.`);
      }
    };

    fetchProjectAndInvoices();

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
      const text = `*Vasthusilpy Engineering - Live Project Tracking*\n\n*Project:* ${project.title} (#${project.id})\n*Client:* ${project.clientName}\n*Location:* ${project.location}\n*Status:* ${project.status}\n*Assigned Engineer:* ${project.assignee || "Er. Deepak C"}\n*Advance Paid:* ₹${Number(project.advancePayment || 0).toLocaleString("en-IN")}\n\n*Track Live Status, Bills & Drawings:*\n${shareUrl}`;
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
  const advanceMode = project?.advancePaymentMode || "UPI";
  const advanceDate = project?.advancePaymentDate || project?.createdAt || "N/A";
  const advanceRef = project?.advancePaymentRef || "";

  // Invoiced totals
  const totalInvoicedGrand = linkedInvoices.reduce((sum, inv) => sum + (Number(inv.grandTotal) || 0), 0);
  const totalInvoicesPaid = linkedInvoices.reduce((sum, inv) => sum + (Number(inv.totalPaid) || 0), 0);
  const totalInvoicesDue = linkedInvoices.reduce((sum, inv) => sum + (Number(inv.balanceDue) || 0), 0);

  // Overall combined financial standing
  const effectiveTotal = Math.max(totalCost, totalInvoicedGrand);
  const effectivePaid = Math.max(advanceReceived, totalInvoicesPaid);
  const balanceRemaining = Math.max(0, effectiveTotal - effectivePaid);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Brand & Action Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase font-mono">
                  VASTHUSILPY
                </span>
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
                  LIVE CRM & CLIENT PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Zero-Login Secure Live Tracking • Official Work Status</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold transition shadow-sm cursor-pointer"
              title="Share live status on WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold transition shadow-sm cursor-pointer"
              title="Copy live tracking URL"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? "Copied" : "Copy Link"}</span>
            </button>

            {onGoToApp && (
              <button
                type="button"
                onClick={onGoToApp}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/40 rounded-xl text-xs font-mono font-bold transition shadow-sm cursor-pointer"
              >
                <span>App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Search Bar / Direct Tracking Number Input */}
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Project ID / Receipt # / Mobile Number..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 font-mono transition shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-mono font-bold rounded-xl shadow-md shadow-red-950 transition cursor-pointer shrink-0"
          >
            Track Project
          </button>
        </form>

        {/* 1. DIGITAL VISITING CARD & OFFICE CONTACT HOTLINES */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Top row: Visiting Card Header (Without Logo) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight font-mono">
                  VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS
                </h1>
                <p className="text-xs sm:text-sm text-red-400 font-semibold mt-0.5 font-mono">
                  Er. Deepak C (Lead Civil Engineer & Vasthu Consultant)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Architectural 2D/3D Plans • KPBR & K-SMART Municipal Sanction • Valuation & Estimations
                </p>
              </div>

              {/* Action: Save Contact Card */}
              <button
                type="button"
                onClick={handleDownloadVCard}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs font-mono font-bold shadow-lg shadow-red-950/40 transition active:scale-98 cursor-pointer shrink-0"
              >
                {copiedCard ? <Check className="w-4 h-4 text-white" /> : <Contact className="w-4 h-4" />}
                <span>{copiedCard ? "Contact Saved!" : "Save Office Contact (vCard)"}</span>
              </button>
            </div>

            {/* Office Contact Numbers Grid (Direct Call & WhatsApp) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <a
                href="tel:+917012383137"
                className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-3 transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Er. Deepak C (Call)</div>
                  <div className="text-xs text-white font-bold truncate">+91 7012383137</div>
                </div>
              </a>

              <a
                href="https://wa.me/917012383137?text=Hello%20Er.%20Deepak%20(Vasthusilpy),%20I%20am%20checking%20the%20live%20project%20tracking%20portal."
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-700/50 rounded-2xl flex items-center gap-3 transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Er. Deepak (WhatsApp)</div>
                  <div className="text-xs text-emerald-400 font-bold truncate">+91 7012383137 / 9747995961</div>
                </div>
              </a>

              <a
                href="tel:+919567627277"
                className="p-3 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-3 transition group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Office Desk / Support</div>
                  <div className="text-xs text-white font-bold truncate">+91 9567627277</div>
                </div>
              </a>
            </div>

            {/* Office Location and Email Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>Near Panchayath Office, Keralassery, Palakkad - 678641</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a href="mailto:deepak.vasthusilpy@gmail.com" className="text-cyan-300 hover:underline">
                  deepak.vasthusilpy@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-mono text-slate-400">Loading project details, bills and drawings...</p>
          </div>
        )}

        {fetchError && !loading && !project && (
          <div className="bg-slate-900/60 border border-rose-500/30 rounded-3xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white font-mono">No Matching Project Found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">{fetchError}</p>
            <p className="text-xs text-slate-500 font-mono">
              Please enter your phone number, Project ID, or Receipt Number in the search box above.
            </p>
          </div>
        )}

        {/* PROJECT DETAILS & LIVE TRACKING SECTIONS */}
        {project && !loading && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Project Badge Header */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-red-950 text-red-300 border border-red-500/40 rounded-lg text-xs font-mono font-bold">
                    {project.receiptNumber ? `RECEIPT #${project.receiptNumber}` : `PROJ #${project.id}`}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      (project.status as string) === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                        : (project.status as string) === "IN_PROGRESS" || (project.status as string) === "PROGRESS"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                        : (project.status as string) === "ON_HOLD"
                        ? "bg-amber-950 text-amber-300 border border-amber-500/40"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {(project.status as string) === "COMPLETED" ? (
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
                    <span>Started: {project.createdAt || "Active"}</span>
                  </div>
                  {project.dueDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-400" />
                      <span>Target: {project.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                  {project.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                  {project.description || "Architectural drafting, elevation design, structural validation & municipal building permit."}
                </p>
              </div>

              {/* 4 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 font-mono">
                {/* 1. Client Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Client Details</span>
                  </div>
                  <p className="font-bold text-sm text-white truncate">{project.clientName || "Valued Client"}</p>
                  {project.clientPhone && (
                    <p className="text-xs text-emerald-400 font-semibold">{project.clientPhone}</p>
                  )}
                </div>

                {/* 2. Site Location */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Site Location</span>
                  </div>
                  <p className="font-bold text-sm text-slate-200 truncate">{project.location || "Palakkad, Kerala"}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      (project.location || "Palakkad") + " Kerala"
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View Map</span>
                  </a>
                </div>

                {/* 3. Advance Payment Quick Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Advance Payment</span>
                  </div>
                  <p className="font-bold text-sm text-amber-300">
                    ₹{advanceReceived.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Mode: <strong className="text-slate-200">{advanceMode}</strong>
                  </p>
                </div>

                {/* 4. Engineer In Charge */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                    <span>Assigned Engineer</span>
                  </div>
                  <p className="font-bold text-sm text-red-300 truncate uppercase">
                    {project.assignee || "Er. Deepak C"}
                  </p>
                  <a
                    href={`https://wa.me/917012383137?text=Hello%20Er.%20Deepak,%20inquiring%20about%20Project%20${encodeURIComponent(project.title)}%20(Receipt%20#${project.receiptNumber || project.id})`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Message WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 font-mono text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "overview"
                    ? "bg-red-600 text-white shadow-md shadow-red-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Overview & Status</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("billing")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "billing"
                    ? "bg-red-600 text-white shadow-md shadow-red-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Bills & Invoices ({linkedInvoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tasks")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "tasks"
                    ? "bg-red-600 text-white shadow-md shadow-red-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Tasks & Sub-tasks ({subtasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "notes"
                    ? "bg-red-600 text-white shadow-md shadow-red-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <StickyNote className="w-4 h-4" />
                <span>CRM Notes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("documents")}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                  activeTab === "documents"
                    ? "bg-red-600 text-white shadow-md shadow-red-950"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>Drawings & Files ({attachments.length})</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW & STATUS */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* ADVANCE PAYMENT SHOWCASE CARD */}
                <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">Advance Payment Confirmation</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      VERIFIED RECEIPT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-1">
                    <div>
                      <div className="text-slate-400 text-[11px]">Advance Amount Received:</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5">
                        ₹{advanceReceived.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Payment Mode:</div>
                      <div className="text-sm font-bold text-white mt-0.5">{advanceMode}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Received Date:</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">{advanceDate}</div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[11px]">Transaction / Ref #:</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5 truncate">
                        {advanceRef || "Direct Confirmation"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WORK PROGRESS & MILESTONES */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">
                        Work Progress & Milestone Execution
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {progressPercent}% Complete ({completedSubtasks}/{subtasks.length || 1} tasks)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Subtasks summary */}
                  {subtasks.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {subtasks.slice(0, 6).map((task, idx) => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 ${
                            task.completed
                              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                              : "bg-slate-950 border-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {task.completed ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate font-sans font-medium">{task.title}</span>
                          </div>
                          <span className={`text-[10px] uppercase font-bold shrink-0 ${task.completed ? "text-emerald-400" : "text-slate-400"}`}>
                            {task.completed ? "Done" : "In Progress"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* FINANCIAL & BILLING SUMMARY TEASER */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Receipt className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">Financial Statement Summary</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("billing")}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Full Invoices</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-[11px] text-slate-400 uppercase">Estimated / Invoiced Amount</div>
                      <div className="text-lg font-bold text-white mt-1">₹{effectiveTotal.toLocaleString("en-IN")}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-[11px] text-emerald-400 uppercase">Total Paid / Advance</div>
                      <div className="text-lg font-bold text-emerald-400 mt-1">₹{effectivePaid.toLocaleString("en-IN")}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <div className="text-[11px] text-rose-400 uppercase">Balance Due</div>
                      <div className={`text-lg font-bold mt-1 ${balanceRemaining > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {balanceRemaining <= 0 ? "PAID IN FULL" : `₹${balanceRemaining.toLocaleString("en-IN")}`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BILLS & INVOICE DETAILS */}
            {activeTab === "billing" && (
              <div className="space-y-5 font-mono">
                {/* Invoiced Overview */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-white">
                      <Receipt className="w-5 h-5 text-red-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">
                        Actual Invoices & Bill Records ({linkedInvoices.length})
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Auto-synced with Office Invoicing System
                    </span>
                  </div>

                  {linkedInvoices.length > 0 ? (
                    <div className="space-y-4">
                      {linkedInvoices.map((inv) => {
                        const isExpanded = expandedInvoiceId === inv.id;
                        const isPaid = inv.paymentStatus === "PAID" || (inv.balanceDue <= 0 && inv.grandTotal > 0);

                        return (
                          <div
                            key={inv.id}
                            className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden transition"
                          >
                            {/* Invoice Header Item */}
                            <div
                              onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/60 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-red-400">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">
                                      INVOICE #{inv.invoiceNumber}
                                    </span>
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        isPaid
                                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                          : inv.paymentStatus === "PARTIALLY PAID"
                                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      }`}
                                    >
                                      {inv.paymentStatus || (isPaid ? "PAID" : "UNPAID")}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    Date: {inv.invoiceDate} • Due: {inv.dueDate}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4">
                                <div className="text-right">
                                  <div className="text-xs text-slate-400">Grand Total:</div>
                                  <div className="text-sm font-bold text-white">
                                    ₹{Number(inv.grandTotal).toLocaleString("en-IN")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-emerald-400">Paid:</div>
                                  <div className="text-sm font-bold text-emerald-400">
                                    ₹{Number(inv.totalPaid || 0).toLocaleString("en-IN")}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-rose-400">Due:</div>
                                  <div className="text-sm font-bold text-rose-400">
                                    ₹{Number(inv.balanceDue || 0).toLocaleString("en-IN")}
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Expanded Invoice Line Items & Payment History */}
                            {isExpanded && (
                              <div className="p-4 bg-slate-900/40 border-t border-slate-800 space-y-4 text-xs">
                                {/* Line Items Table */}
                                <div>
                                  <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                                    Billed Items of Work:
                                  </h4>
                                  <div className="border border-slate-800 rounded-xl overflow-x-auto">
                                    <table className="w-full text-left">
                                      <thead className="bg-slate-950 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                                        <tr>
                                          <th className="p-2.5">Item Description</th>
                                          <th className="p-2.5 text-center">Unit</th>
                                          <th className="p-2.5 text-right">Qty</th>
                                          <th className="p-2.5 text-right">Rate (₹)</th>
                                          <th className="p-2.5 text-right">Amount (₹)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800/60">
                                        {inv.items.map((item, i) => (
                                          <tr key={item.id || i} className="hover:bg-slate-950/40">
                                            <td className="p-2.5 font-sans font-medium text-slate-200">
                                              {item.description}
                                            </td>
                                            <td className="p-2.5 text-center text-slate-400">{item.unit}</td>
                                            <td className="p-2.5 text-right text-slate-300">{item.quantity}</td>
                                            <td className="p-2.5 text-right text-slate-300">
                                              ₹{Number(item.rate).toLocaleString("en-IN")}
                                            </td>
                                            <td className="p-2.5 text-right font-bold text-white">
                                              ₹{Number(item.amount).toLocaleString("en-IN")}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {/* Payment Records History */}
                                {inv.payments && inv.payments.length > 0 && (
                                  <div>
                                    <h4 className="text-[11px] font-bold text-emerald-400 uppercase mb-2">
                                      Recorded Payment Transactions:
                                    </h4>
                                    <div className="space-y-1.5">
                                      {inv.payments.map((p, pIdx) => (
                                        <div
                                          key={p.id || pIdx}
                                          className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                                        >
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                            <span className="text-slate-300">
                                              {p.date} • {p.paymentMode || "UPI"}
                                            </span>
                                            {p.referenceNo && (
                                              <span className="text-[10px] text-slate-500">Ref: {p.referenceNo}</span>
                                            )}
                                          </div>
                                          <span className="font-bold text-emerald-400">
                                            +₹{Number(p.amount).toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                      <Receipt className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">No generated formal invoices attached yet.</p>
                      <p className="text-[11px] text-slate-500">
                        Project estimation is active at ₹{totalCost.toLocaleString("en-IN")} with advance received of ₹{advanceReceived.toLocaleString("en-IN")}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: TASKS & SUB-TASKS */}
            {activeTab === "tasks" && (
              <div className="space-y-5 font-mono">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-white">
                      <ListTodo className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">
                        Project Execution Tasks & Sub-Tasks ({subtasks.length})
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {completedSubtasks} of {subtasks.length} Completed
                    </span>
                  </div>

                  {subtasks.length > 0 ? (
                    <div className="space-y-2.5">
                      {subtasks.map((task, idx) => (
                        <div
                          key={task.id}
                          className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            task.completed
                              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-100"
                              : "bg-slate-950 border-slate-800 text-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <Clock className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <p className={`font-sans font-bold text-sm ${task.completed ? "line-through text-slate-400" : "text-white"}`}>
                                {task.title}
                              </p>
                              {(task as any).description && (
                                <p className="font-sans text-xs text-slate-400 mt-0.5 leading-relaxed">
                                  {(task as any).description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1.5 font-mono">
                                {((task as any).assignedTo || (task as any).assignee) && <span>Assignee: {(task as any).assignedTo || (task as any).assignee}</span>}
                                {(task as any).dueDate && <span>Target: {(task as any).dueDate}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 sm:text-right">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                                task.completed
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-slate-800 text-slate-300 border border-slate-700"
                              }`}
                            >
                              {task.completed ? "COMPLETED" : "IN PROGRESS"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                      <ListTodo className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">All standard stages are monitored by Er. Deepak C.</p>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs">
                          1. Architectural Drafting & Vasthu Analysis
                        </span>
                        <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs">
                          2. 3D Elevation Modeling
                        </span>
                        <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-xs">
                          3. KPBR / K-SMART Municipal Permit Submission
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: CRM NOTES & ENGINEERING SPECIFICATIONS */}
            {activeTab === "notes" && (
              <div className="space-y-5 font-mono">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-amber-400">
                      <StickyNote className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">
                        CRM Notes & Engineering Instructions
                      </h3>
                    </div>
                  </div>

                  {(project as any).notes || (project as any).description ? (
                    <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <div className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-cyan-400" />
                        <span>Recorded Client & Office Notes:</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 font-sans whitespace-pre-wrap leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                        {(project as any).notes || (project as any).description}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                      <StickyNote className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400">No additional specific custom notes recorded.</p>
                      <p className="text-[11px] text-slate-500">
                        Standard Vasthusilpy engineering quality guidelines and KPBR compliance rules apply.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: DRAWINGS & DOCUMENTS */}
            {activeTab === "documents" && (
              <div className="space-y-5">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 font-mono">
                    <div className="flex items-center gap-2 text-cyan-400">
                      <Paperclip className="w-5 h-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wide">
                        Downloadable Drawings & Blueprint Files ({attachments.length})
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      {(["ALL", "IMAGE", "PDF"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDocFilter(mode)}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                            docFilter === mode
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredAttachments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredAttachments.map((att) => {
                        const isImage =
                          att.type?.toLowerCase().includes("image") ||
                          att.name?.toLowerCase().endsWith(".jpg") ||
                          att.name?.toLowerCase().endsWith(".png") ||
                          att.url?.startsWith("data:image");

                        return (
                          <div
                            key={att.id}
                            className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                                {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-white truncate font-mono">{att.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {att.type || "Document"} {att.uploadedAt ? `• ${att.uploadedAt}` : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isImage && att.url && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPreviewDoc(att)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold cursor-pointer transition"
                                >
                                  Preview
                                </button>
                              )}
                              {att.url && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(att)}
                                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                      <Paperclip className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-400 font-mono">No drawings uploaded under this filter yet.</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Once blueprints or 3D elevations are attached by our engineers, they will appear here instantly.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Official Verification Footer */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-3 font-mono">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Vasthusilpy Architectural & Engineering Consultants</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>Direct Hotline: +91 7012383137 / 9747995961</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 max-w-xl mx-auto font-sans leading-relaxed">
            Near Panchayath Office, Keralassery, Palakkad - 678641 • Authentic live project progress, actual invoices, advance receipts & drawings for clients.
          </p>
        </div>
      </main>

      {/* FULL-SCREEN IMAGE PREVIEW LIGHTBOX */}
      {selectedPreviewDoc && selectedPreviewDoc.url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
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
