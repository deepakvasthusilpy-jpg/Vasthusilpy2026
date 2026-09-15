import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  SubscriptionRequest,
  SubscriptionStatus,
  AccessLevel,
  TabType,
  MainSectionType
} from "../../types";
import {
  ALL_APP_MODULES,
  ALL_TAB_IDS,
  DEFAULT_FULL_PERMISSIONS,
  DEFAULT_PREVIEW_PERMISSIONS,
  PRESET_ESTIMATE_CIVIL_PERMISSIONS,
  PRESET_VASTHU_RULES_PERMISSIONS,
  calculateExpiryDate,
  getRemainingDays,
  isSubscriptionExpired,
  generateUniqueSubId,
  UPI_ID
} from "../../utils/subscriptionManager";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Check,
  Copy,
  Calendar,
  Layers,
  Sparkles,
  KeyRound,
  Phone,
  Mail,
  Eye,
  Lock,
  Unlock,
  Trash2,
  Edit3,
  UserPlus,
  RefreshCw,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export const SubscriptionRequestsTab: React.FC = () => {
  const {
    subscriptionRequests,
    updateSubscriptionRequest,
    deleteSubscriptionRequest,
    sendSubscriptionApprovalEmail,
    isPrimaryAdmin,
    emailUser,
    user
  } = useAuth();

  if (!isPrimaryAdmin) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-white my-10 max-w-xl mx-auto">
        <ShieldCheck className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2">Admin Access Required</h2>
        <p className="text-slate-400 text-sm mb-4">
          Subscription details and management are restricted to Admin login (<span className="font-mono text-cyan-300">9747995961</span>). Please log in with admin credentials to view or add subscription details.
        </p>
      </div>
    );
  }

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SubscriptionStatus>("ALL");
  const [selectedSub, setSelectedSub] = useState<SubscriptionRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [subToDelete, setSubToDelete] = useState<SubscriptionRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingEmailSubId, setSendingEmailSubId] = useState<string | null>(null);

  // Edit / Review Modal Form State
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editUpiRef, setEditUpiRef] = useState("");
  const [editAmount, setEditAmount] = useState<number>(499);
  const [editPlanName, setEditPlanName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>("pending");
  const [editValidityType, setEditValidityType] = useState<"days" | "date">("days");
  const [editValidDays, setEditValidDays] = useState<number>(30);
  const [editValidUntil, setEditValidUntil] = useState<string>("");
  const [editRejectedReason, setEditRejectedReason] = useState("");
  const [editPermissions, setEditPermissions] = useState<Record<string, AccessLevel>>({});

  // Add Direct Subscription Modal State
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newUpiRef, setNewUpiRef] = useState("DIRECT-ADMIN");
  const [newAmount, setNewAmount] = useState(999);
  const [newValidDays, setNewValidDays] = useState(365);
  const [newNotes, setNewNotes] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const handleCopyText = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Resend Approval Email manually
  const handleResendApprovalEmail = async (sub: SubscriptionRequest) => {
    setSendingEmailSubId(sub.id);
    try {
      const result = await sendSubscriptionApprovalEmail(sub);
      if (result.success) {
        setSaveSuccessNotice(`യൂസർ ഐഡിയും (${sub.id}) വെബ്‌സൈറ്റ് വിവരങ്ങളും അടങ്ങിയ ഇമെയിൽ '${sub.email}' ലേക്ക് അയച്ചു.`);
      } else {
        setSaveSuccessNotice(`ഇമെയിൽ അയച്ചു (Notice: ${result.message || "Queue recorded"})`);
      }
    } catch (e: any) {
      setSaveSuccessNotice(`ഇമെയിൽ അയക്കുന്നതിൽ തടസ്സം: ${e?.message || "Unknown error"}`);
    } finally {
      setSendingEmailSubId(null);
      setTimeout(() => setSaveSuccessNotice(null), 5000);
    }
  };

  // Perform permanent deletion
  const handleConfirmDelete = async () => {
    if (!subToDelete) return;
    setIsDeleting(true);
    try {
      const deletedName = subToDelete.fullName;
      const deletedId = subToDelete.id;
      await deleteSubscriptionRequest(deletedId);
      if (selectedSub?.id === deletedId) {
        setIsModalOpen(false);
        setSelectedSub(null);
      }
      setSubToDelete(null);
      setSaveSuccessNotice(`സബ്‌സ്ക്രിപ്ഷൻ പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്തു: ${deletedName} (${deletedId})`);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (err: any) {
      console.error("Delete error:", err);
      setSaveSuccessNotice(`ഡിലീറ്റ് ചെയ്യുന്നതിൽ തടസ്സം: ${err?.message || "Error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Review / Configure Access Modal
  const handleOpenReviewModal = (sub: SubscriptionRequest) => {
    setSelectedSub(sub);
    setEditFullName(sub.fullName);
    setEditEmail(sub.email);
    setEditPhone(sub.phone);
    setEditPassword(sub.password || sub.phone || sub.email || "");
    setEditUpiRef(sub.upiRefId);
    setEditAmount(sub.amountPaid || 499);
    setEditPlanName(sub.planName || "Vasthusilpy Pro Access");
    setEditNotes(sub.notes || "");
    setEditStatus(sub.status);
    setEditValidityType(sub.validityType || "days");
    setEditValidDays(sub.validDays || 30);
    setEditValidUntil(sub.validUntil || calculateExpiryDate("days", sub.validDays || 30));
    setEditRejectedReason(sub.rejectedReason || "");
    setEditPermissions({ ...DEFAULT_FULL_PERMISSIONS, ...(sub.tabPermissions || {}) });
    setIsModalOpen(true);
  };

  // Save Modal Changes
  const handleSaveModalChanges = async (targetStatus?: SubscriptionStatus) => {
    if (!selectedSub) return;
    const finalStatus = targetStatus || editStatus;

    const computedExpiry =
      editValidityType === "days"
        ? calculateExpiryDate("days", editValidDays)
        : editValidUntil || calculateExpiryDate("days", 30);

    const updated: SubscriptionRequest = {
      ...selectedSub,
      fullName: editFullName.trim(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      password: editPassword.trim(),
      upiRefId: editUpiRef.trim(),
      amountPaid: Number(editAmount) || 0,
      planName: editPlanName.trim(),
      notes: editNotes.trim(),
      status: finalStatus,
      validityType: editValidityType,
      validDays: Number(editValidDays) || 30,
      validUntil: computedExpiry,
      rejectedReason: finalStatus === "rejected" ? editRejectedReason : undefined,
      approvedAt: finalStatus === "approved" ? new Date().toISOString() : selectedSub.approvedAt,
      approvedBy:
        finalStatus === "approved"
          ? user?.email || emailUser?.email || "Admin"
          : selectedSub.approvedBy,
      tabPermissions: editPermissions
    };

    await updateSubscriptionRequest(updated);
    if (finalStatus === "approved") {
      setSaveSuccessNotice(`സബ്‌സ്ക്രിപ്ഷൻ അംഗീകരിച്ചു. ${updated.email} ലേക്ക് യൂസർ ഐഡിയും (${updated.id}) പോർട്ടൽ വിവരങ്ങളും അടങ്ങിയ ഇമെയിൽ അയച്ചു.`);
    } else {
      setSaveSuccessNotice(`സബ്‌സ്ക്രിപ്ഷൻ വിവരങ്ങൾ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു (${updated.id})`);
    }
    setTimeout(() => setSaveSuccessNotice(null), 5000);
    setIsModalOpen(false);
    setSelectedSub(null);
  };

  // Create Direct Subscription
  const handleCreateDirectSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPhone.trim()) {
      alert("ദയവായി പേര്, ഇമെയിൽ, ഫോൺ നമ്പർ നൽകുക.");
      return;
    }

    const subId = generateUniqueSubId();
    const newSub: SubscriptionRequest = {
      id: subId,
      fullName: newFullName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      password: newPassword.trim() || newPhone.trim() || newEmail.trim(),
      upiRefId: newUpiRef.trim() || "DIRECT-ADMIN",
      amountPaid: Number(newAmount) || 0,
      planName: "Admin Direct Authorization",
      notes: newNotes.trim() || "Directly added by Administrator",
      requestedAt: new Date().toISOString(),
      status: "approved",
      validityType: "days",
      validDays: Number(newValidDays) || 365,
      validUntil: calculateExpiryDate("days", Number(newValidDays) || 365),
      approvedAt: new Date().toISOString(),
      approvedBy: user?.email || emailUser?.email || "Admin",
      tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
    };

    await updateSubscriptionRequest(newSub);
    setIsAddModalOpen(false);
    setNewFullName("");
    setNewEmail("");
    setNewPhone("");
    setNewPassword("");
    setNewNotes("");
    setSaveSuccessNotice(`പുതിയ സബ്‌സ്ക്രിപ്ഷൻ യൂസറെ ചേർത്തു (${subId}). ലോഗിൻ വിവരങ്ങൾ '${newSub.email}' ലേക്ക് അയച്ചു.`);
    setTimeout(() => setSaveSuccessNotice(null), 5000);
  };

  // Filtered requests
  const filteredRequests = subscriptionRequests.filter((req) => {
    const matchesSearch =
      req.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.phone.includes(searchQuery) ||
      req.upiRefId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());

    const isExp = isSubscriptionExpired(req);
    const effectiveStatus = req.status === "approved" && isExp ? "expired" : req.status;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "expired" ? effectiveStatus === "expired" : effectiveStatus === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalCount = subscriptionRequests.length;
  const pendingCount = subscriptionRequests.filter((r) => r.status === "pending").length;
  const activeCount = subscriptionRequests.filter(
    (r) => r.status === "approved" && !isSubscriptionExpired(r)
  ).length;
  const expiredCount = subscriptionRequests.filter(
    (r) => r.status === "expired" || (r.status === "approved" && isSubscriptionExpired(r))
  ).length;

  // Single tab permission toggle helper
  const setTabPermissionLevel = (tabId: TabType, level: AccessLevel) => {
    setEditPermissions((prev) => ({
      ...prev,
      [tabId]: level
    }));
  };

  // Set all tabs for a whole section
  const setSectionPermissionLevel = (section: MainSectionType, level: AccessLevel) => {
    const mod = ALL_APP_MODULES.find((m) => m.sectionId === section);
    if (!mod) return;
    setEditPermissions((prev) => {
      const next = { ...prev };
      mod.tabs.forEach((t) => {
        next[t.id] = level;
      });
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-bold shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ADMINISTRATOR CONTROL DESK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥനകൾ & ആക്‌സസ് മാനേജ്‌മെന്റ്
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              വെബ്‌സൈറ്റിൽ സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥിച്ച ഉപയോക്താക്കളുടെ UPI ട്രാൻസാക്ഷൻ UTR വെരിഫൈ ചെയ്ത്,
              കാലാവധിയും നിർദ്ദിഷ്ട ടാബ് / മൊഡ്യൂൾ പെർമിഷനുകളും (Full Access / Preview / No Access) കോൺഫിഗർ ചെയ്യുക.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg shadow-emerald-950 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>നേരിട്ട് യൂസറെ ചേർക്കുക (Add Direct User)</span>
            </button>
          </div>
        </div>

        {/* Status Toast Notice */}
        {saveSuccessNotice && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 font-bold font-sans">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
            <button
              onClick={() => setSaveSuccessNotice(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>ആകെ അഭ്യർത്ഥനകൾ</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-white font-mono">{totalCount}</p>
            <span className="text-[10px] text-slate-400">Total Submissions</span>
          </div>

          <div
            onClick={() => setStatusFilter("pending")}
            className={`bg-slate-900/80 border p-4 rounded-2xl cursor-pointer transition-all ${
              statusFilter === "pending"
                ? "border-amber-500 ring-1 ring-amber-500/50 bg-amber-950/20"
                : "border-amber-800/40 hover:border-amber-600"
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 text-xs font-mono mb-1 font-bold">
              <span>പരിശോധന ബാക്കി (Pending)</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-amber-300 font-mono">{pendingCount}</p>
            <span className="text-[10px] text-amber-400/80">Needs Verification</span>
          </div>

          <div
            onClick={() => setStatusFilter("approved")}
            className={`bg-slate-900/80 border p-4 rounded-2xl cursor-pointer transition-all ${
              statusFilter === "approved"
                ? "border-emerald-500 ring-1 ring-emerald-500/50 bg-emerald-950/20"
                : "border-emerald-800/40 hover:border-emerald-600"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 text-xs font-mono mb-1 font-bold">
              <span>ആക്റ്റീവ് അക്കൗണ്ടുകൾ</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-emerald-300 font-mono">{activeCount}</p>
            <span className="text-[10px] text-emerald-400/80">Active & Authorized</span>
          </div>

          <div
            onClick={() => setStatusFilter("expired")}
            className={`bg-slate-900/80 border p-4 rounded-2xl cursor-pointer transition-all ${
              statusFilter === "expired"
                ? "border-red-500 ring-1 ring-red-500/50 bg-red-950/20"
                : "border-slate-800 hover:border-red-800"
            }`}
          >
            <div className="flex items-center justify-between text-red-400 text-xs font-mono mb-1">
              <span>കാലാവധി കഴിഞ്ഞവ</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-black text-red-300 font-mono">{expiredCount}</p>
            <span className="text-[10px] text-slate-400">Needs Renewal</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="പേര്, ഇമെയിൽ, മൊബൈൽ, UPI UTR അല്ലെങ്കിൽ Request ID തിരയുക..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950 rounded-xl border border-slate-800">
          {(["ALL", "pending", "approved", "expired", "rejected"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {st === "ALL" && "All"}
              {st === "pending" && `Pending (${pendingCount})`}
              {st === "approved" && "Approved"}
              {st === "expired" && "Expired"}
              {st === "rejected" && "Rejected"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table & Cards */}
      <div className="bg-slate-950/95 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="font-sans font-bold text-white text-base">
              സബ്‌സ്ക്രിപ്ഷൻ അപേക്ഷകരുടെ പട്ടിക
            </h3>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold">
              {filteredRequests.length} Requests
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Target UPI: <span className="text-emerald-400 font-bold">{UPI_ID}</span>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-300 font-sans font-bold text-base">അഭ്യർത്ഥനകൾ കണ്ടെത്തിയില്ല</p>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകൾക്ക് അനുയോജ്യമായ സബ്‌സ്ക്രിപ്ഷൻ വിവരങ്ങൾ ലഭ്യമല്ല.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 overflow-x-auto">
            {filteredRequests.map((sub) => {
              const isExpired = isSubscriptionExpired(sub);
              const remainingDays = getRemainingDays(sub.validUntil);
              const perms = sub.tabPermissions || {};
              const fullAccessCount = Object.values(perms).filter((p) => p === "full").length;
              const previewCount = Object.values(perms).filter((p) => p === "preview").length;

              return (
                <div
                  key={sub.id}
                  className="p-4 sm:p-5 hover:bg-slate-900/60 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 min-w-[280px]">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono font-black text-sm flex items-center justify-center shrink-0 mt-0.5">
                      {sub.fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-sans font-bold text-white text-sm">{sub.fullName}</h4>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {sub.id}
                        </span>
                        {/* Status Badges */}
                        {sub.status === "pending" && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/60 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm shadow-amber-950/50">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>PENDING VERIFICATION</span>
                          </span>
                        )}
                        {sub.status === "approved" && !isExpired && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-950/50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ACTIVE ({remainingDays} Days Left)</span>
                          </span>
                        )}
                        {(sub.status === "expired" || (sub.status === "approved" && isExpired)) && (
                          <span className="px-2.5 py-1 rounded-full bg-red-950/90 border border-red-500/60 text-red-300 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm shadow-red-950/50">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>EXPIRED</span>
                          </span>
                        )}
                        {sub.status === "rejected" && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-red-800 text-red-400 text-[11px] font-mono font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>REJECTED</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{sub.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-300">{sub.phone}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Req: {new Date(sub.requestedAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Payment & Validity */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs font-mono">
                    {/* UPI Ref Box */}
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">UPI Reference ID:</span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-amber-300 font-bold tracking-wider truncate max-w-[130px]">
                          {sub.upiRefId}
                        </span>
                        <button
                          onClick={() => handleCopyText(sub.upiRefId, `upi-${sub.id}`)}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Copy UPI Ref ID"
                        >
                          {copiedId === `upi-${sub.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Validity Period */}
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">കാലാവധി (Validity):</span>
                      <span className="text-slate-200 font-bold block mt-0.5 truncate">
                        {sub.validUntil ? sub.validUntil.slice(0, 10) : `${sub.validDays || 30} Days`}
                      </span>
                    </div>

                    {/* Permissions Summary */}
                    <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 block font-sans">ആക്‌സസ് പെർമിഷൻ:</span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                        <span className="text-emerald-400 font-bold">{fullAccessCount} Full</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-cyan-400">{previewCount} Preview</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center flex-wrap">
                    {/* Resend Approval Email if active/approved */}
                    {sub.status === "approved" && (
                      <button
                        onClick={() => handleResendApprovalEmail(sub)}
                        disabled={sendingEmailSubId === sub.id}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-sky-950 border border-slate-800 hover:border-sky-700 text-sky-300 text-xs font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                        title="Resend Credentials & Access Email quoting User ID, Email, and Website"
                      >
                        {sendingEmailSubId === sub.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Send Email</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenReviewModal(sub)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold shadow-md transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{sub.status === "pending" ? "Verify & Configure" : "Manage Access"}</span>
                    </button>

                    {sub.status === "pending" && (
                      <button
                        onClick={async () => {
                          setSelectedSub(sub);
                          const updated: SubscriptionRequest = {
                            ...sub,
                            status: "approved",
                            approvedAt: new Date().toISOString(),
                            approvedBy: user?.email || emailUser?.email || "Admin",
                            validUntil: calculateExpiryDate("days", sub.validDays || 30)
                          };
                          await updateSubscriptionRequest(updated);
                          setSaveSuccessNotice(`സബ്‌സ്ക്രിപ്ഷൻ അംഗീകരിച്ചു. ${sub.email} ലേക്ക് യൂസർ ഐഡിയും (${sub.id}) ലോഗിൻ വിവരങ്ങളും അടങ്ങിയ ഇമെയിൽ അയച്ചു.`);
                          setTimeout(() => setSaveSuccessNotice(null), 5000);
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-xs font-mono font-bold transition-all cursor-pointer"
                        title="Quick Approve & Email Credentials"
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">Approve</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSubToDelete(sub)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-red-950 border border-slate-800 hover:border-red-800 text-slate-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Delete Request Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: REVIEW, VERIFY UPI & CONFIGURE VALIDITY & TAB ACCESS PERMISSIONS */}
      {/* ========================================================================= */}
      {isModalOpen && selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-950 border border-indigo-900/80 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    സബ്‌സ്ക്രിപ്ഷൻ പരിശോധന & ആക്‌സസ് ക്രമീകരണം
                  </h3>
                  <p className="text-xs text-indigo-300/80 font-mono">
                    Request ID: {selectedSub.id} • Submitted: {new Date(selectedSub.requestedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              
              {/* SECTION 1: APPLICANT PROFILE & UPI REFERENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Applicant Info Card */}
                <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>അപേക്ഷകന്റെ വിവരങ്ങൾ (Applicant Profile)</span>
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">പൂർണ്ണമായ പേര് (Full Name):</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">ഇമെയിൽ (Email):</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-0.5">മൊബൈൽ (Phone):</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-0.5">പാസ്‌വേഡ് (User Login Password):</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* UPI Verification Box */}
                <div className="bg-amber-950/20 border border-amber-800/60 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>UPI പേയ്‌മെന്റ് വെരിഫിക്കേഷൻ</span>
                    </h4>
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                      Paid to: {UPI_ID}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-sans">
                        UPI Transaction Ref / UTR:
                      </span>
                      <button
                        onClick={() => handleCopyText(editUpiRef, "modal-upi")}
                        className="text-amber-400 hover:text-amber-200 text-xs font-mono flex items-center gap-1"
                      >
                        {copiedId === "modal-upi" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === "modal-upi" ? "Copied" : "Copy Ref"}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={editUpiRef}
                      onChange={(e) => setEditUpiRef(e.target.value)}
                      className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold text-sm tracking-wider focus:outline-none"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Amount (തുക):</span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Plan:</span>
                        <input
                          type="text"
                          value={editPlanName}
                          onChange={(e) => setEditPlanName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-sans text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-200/80 leading-relaxed font-sans">
                    💡 ഗൂഗിൾ പേ / ഫോൺപേ / ബാങ്ക് ആപ്പിൽ ഈ UTR / Ref No. പരിശോധിച്ച ശേഷം അംഗീകരിക്കുക.
                  </p>
                </div>
              </div>

              {/* SECTION 2: VALIDITY CONFIGURATION (DAYS OR SPECIFIC DATE) */}
              <div className="bg-slate-900/90 border border-indigo-900/50 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>സബ്‌സ്ക്രിപ്ഷൻ കാലാവധി നിശ്ചയിക്കുക (Validity Period Setup)</span>
                  </h4>

                  {/* Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setEditValidityType("days")}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        editValidityType === "days"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ദിവസങ്ങൾ (Number of Days)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditValidityType("date");
                        if (!editValidUntil) {
                          setEditValidUntil(calculateExpiryDate("days", editValidDays));
                        }
                      }}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        editValidityType === "date"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      നിശ്ചിത തീയതി (Upto Specific Date)
                    </button>
                  </div>
                </div>

                {editValidityType === "days" ? (
                  <div className="space-y-3">
                    {/* Preset Day Chips */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {[7, 30, 90, 180, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setEditValidDays(d)}
                          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                            editValidDays === d
                              ? "bg-emerald-600 text-white shadow-md"
                              : "bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-600"
                          }`}
                        >
                          {d === 7 && "7 Days (Trial)"}
                          {d === 30 && "30 Days (1 Month)"}
                          {d === 90 && "90 Days (3 Months)"}
                          {d === 180 && "180 Days (6 Months)"}
                          {d === 365 && "365 Days (1 Year Pass)"}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-40">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          കസ്റ്റം ദിവസങ്ങൾ (Custom Days):
                        </label>
                        <input
                          type="number"
                          value={editValidDays}
                          onChange={(e) => setEditValidDays(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                          min={1}
                        />
                      </div>
                      <div className="flex-1 bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block font-sans">
                          കണക്കാക്കിയ കാലാവധി അവസാന തീയതി (Computed Expiry):
                        </span>
                        <span className="text-emerald-400 font-mono font-bold text-sm">
                          {calculateExpiryDate("days", editValidDays)} (ഇന്ന് മുതൽ {editValidDays} ദിവസങ്ങൾ)
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        കാലാവധി അവസാനിക്കുന്ന തീയതി (Valid Upto Date):
                      </label>
                      <input
                        type="date"
                        value={editValidUntil ? editValidUntil.slice(0, 10) : ""}
                        onChange={(e) => setEditValidUntil(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-sans">
                        ശേഷിക്കുന്ന ദിവസങ്ങൾ (Remaining Days):
                      </span>
                      <span className="text-emerald-400 font-mono font-bold text-sm">
                        {getRemainingDays(editValidUntil)} ദിവസങ്ങൾ ബാക്കിയുണ്ട്
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: TAB ACCESS & PERMISSIONS MATRIX */}
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <span>ടാഗ് / മൊഡ്യൂൾ പെർമിഷൻ ക്രമീകരണം (Tab Access Permissions)</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      ഓരോ വിഭാഗത്തിനും പൂർണ്ണ അനുമതി (Full), കാഴ്ച മാത്രം (Preview), അല്ലെങ്കിൽ പ്രവേശനമില്ല (No Access) തിരഞ്ഞെടുക്കുക.
                    </p>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditPermissions({ ...DEFAULT_FULL_PERMISSIONS })}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-900 cursor-pointer"
                    >
                      🌟 All Full Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({ ...DEFAULT_PREVIEW_PERMISSIONS })}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-600 text-cyan-300 text-[10px] font-mono font-bold hover:bg-cyan-900 cursor-pointer"
                    >
                      👁️ All Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({ ...PRESET_ESTIMATE_CIVIL_PERMISSIONS })}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold hover:bg-indigo-900 cursor-pointer"
                    >
                      📐 Estimate & Civil
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPermissions({ ...PRESET_VASTHU_RULES_PERMISSIONS })}
                      className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-mono font-bold hover:bg-amber-900 cursor-pointer"
                    >
                      🧭 Vasthu & Rules
                    </button>
                  </div>
                </div>

                {/* Modules Accordion / Grid */}
                <div className="space-y-3">
                  {ALL_APP_MODULES.map((module) => {
                    return (
                      <div
                        key={module.sectionId}
                        className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5"
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-900 pb-2">
                          <div>
                            <span className="text-xs font-bold text-white font-sans">
                              {module.sectionTitleMl}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">
                              ({module.sectionTitle})
                            </span>
                          </div>

                          {/* Bulk Section Toggles */}
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            <button
                              type="button"
                              onClick={() => setSectionPermissionLevel(module.sectionId, "full")}
                              className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-900 hover:bg-emerald-900"
                            >
                              Set All Full
                            </button>
                            <button
                              type="button"
                              onClick={() => setSectionPermissionLevel(module.sectionId, "preview")}
                              className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-900 hover:bg-cyan-900"
                            >
                              Set All Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => setSectionPermissionLevel(module.sectionId, "none")}
                              className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800"
                            >
                              Hide All
                            </button>
                          </div>
                        </div>

                        {/* Individual Sub-Tabs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {module.tabs.map((tab) => {
                            const currentLevel = editPermissions[tab.id] || "full";
                            return (
                              <div
                                key={tab.id}
                                className="bg-slate-900/90 border border-slate-800/60 p-2.5 rounded-xl flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-200 truncate font-sans">
                                    {tab.labelMl}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">
                                    {tab.label}
                                  </p>
                                </div>

                                {/* 3-Way Pill Switcher */}
                                <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] font-mono shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setTabPermissionLevel(tab.id, "full")}
                                    className={`px-2 py-1 rounded transition-all ${
                                      currentLevel === "full"
                                        ? "bg-emerald-600 text-white font-bold shadow"
                                        : "text-slate-400 hover:text-slate-200"
                                    }`}
                                    title="Full Access"
                                  >
                                    Full
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTabPermissionLevel(tab.id, "preview")}
                                    className={`px-2 py-1 rounded transition-all ${
                                      currentLevel === "preview"
                                        ? "bg-cyan-600 text-white font-bold shadow"
                                        : "text-slate-400 hover:text-slate-200"
                                    }`}
                                    title="Preview Only"
                                  >
                                    Preview
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTabPermissionLevel(tab.id, "none")}
                                    className={`px-2 py-1 rounded transition-all ${
                                      currentLevel === "none"
                                        ? "bg-red-900 text-red-200 font-bold shadow"
                                        : "text-slate-400 hover:text-slate-200"
                                    }`}
                                    title="No Access"
                                  >
                                    None
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status & Rejection Notes if needed */}
              <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
                <label className="text-xs font-mono font-bold text-slate-300 block">
                  സബ്‌സ്ക്രിപ്ഷൻ സ്റ്റാറ്റസ് (Account Status):
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {(["pending", "approved", "rejected", "expired"] as SubscriptionStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer ${
                        editStatus === st
                          ? st === "approved"
                            ? "bg-emerald-600 text-white"
                            : st === "pending"
                            ? "bg-amber-600 text-white"
                            : st === "rejected"
                            ? "bg-red-600 text-white"
                            : "bg-slate-700 text-white"
                          : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>

                {editStatus === "rejected" && (
                  <div>
                    <label className="text-[11px] text-red-400 block mb-1">
                      നിരസിക്കാനുള്ള കാരണം (Rejection Reason):
                    </label>
                    <input
                      type="text"
                      value={editRejectedReason}
                      onChange={(e) => setEditRejectedReason(e.target.value)}
                      placeholder="e.g. UPI Reference is invalid or payment not received."
                      className="w-full bg-slate-950 border border-red-800 rounded-xl px-3 py-2 text-white font-sans text-xs"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold cursor-pointer"
                >
                  റദ്ദാക്കുക (Cancel)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedSub) {
                      setSubToDelete(selectedSub);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-xs font-bold transition-all cursor-pointer"
                  title="Delete this subscription"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ഡിലീറ്റ് ചെയ്യുക (Delete)</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-end">
                {selectedSub.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => handleResendApprovalEmail(selectedSub)}
                    disabled={sendingEmailSubId === selectedSub.id}
                    className="flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-sky-950 border border-sky-800 text-sky-300 font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {sendingEmailSubId === selectedSub.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    <span>ഇമെയിൽ അയക്കുക (Resend Email)</span>
                  </button>
                )}

                {editStatus !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleSaveModalChanges("approved")}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>അംഗീകരിച്ച് ആക്റ്റീവ് ആക്കുക (Approve & Activate)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSaveModalChanges()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>മാറ്റങ്ങൾ സേവ് ചെയ്യുക (Save Changes)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD DIRECT SUBSCRIPTION (ADMIN CREATION)                        */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-950 border border-emerald-900/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden font-sans">
            <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border-b border-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  നേരിട്ട് സബ്‌സ്ക്രിപ്ഷൻ യൂസറെ ചേർക്കുക
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectSubscription} className="p-5 space-y-3.5">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">പൂർണ്ണമായ പേര്:</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ഇമെയിൽ വിലാസം:</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">മൊബൈൽ നമ്പർ:</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="9847123456"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">പാസ്‌വേഡ്:</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-300 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">കാലാവധി (ദിവസങ്ങൾ):</label>
                  <input
                    type="number"
                    value={newValidDays}
                    onChange={(e) => setNewValidDays(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">കുറിപ്പുകൾ (Notes):</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Direct Client / Corporate license"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-sans text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold"
                >
                  Create & Authorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IN-APP DELETE CONFIRMATION MODAL (RELIABLE IN ALL BROWSERS)     */}
      {/* ========================================================================= */}
      {subToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-red-900/80 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden font-sans">
            
            <div className="p-6 bg-gradient-to-b from-red-950/40 via-slate-950 to-slate-950 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-900/40 border border-red-700/60 flex items-center justify-center text-red-400 mx-auto shadow-lg shadow-red-950/50">
                <Trash2 className="w-7 h-7 animate-bounce" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">
                  സബ്‌സ്ക്രിപ്ഷൻ ഡിലീറ്റ് ചെയ്യണോ?
                </h3>
                <p className="text-xs text-red-300/80 font-mono mt-1">
                  PERMANENT SUBSCRIPTION DELETION
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-mono">User ID:</span>
                  <span className="text-emerald-400 font-mono font-bold">{subToDelete.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">പേര്:</span>
                  <span className="text-white font-bold">{subToDelete.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-mono">Email:</span>
                  <span className="text-slate-200 font-mono">{subToDelete.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Mobile:</span>
                  <span className="text-slate-200 font-mono">{subToDelete.phone}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                ഈ സബ്‌സ്ക്രിപ്ഷൻ ഡാറ്റാബേസിൽ നിന്നും ലോക്കൽ സ്റ്റോറേജിൽ നിന്നും സ്ഥിരമായി നീക്കം ചെയ്യപ്പെടും.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setSubToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  റദ്ദാക്കുക (Cancel)
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono text-xs font-bold shadow-lg shadow-red-950/50 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>{isDeleting ? "ഡിലീറ്റ് ചെയ്യുന്നു..." : "അതെ, ഡിലീറ്റ് ചെയ്യുക"}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
