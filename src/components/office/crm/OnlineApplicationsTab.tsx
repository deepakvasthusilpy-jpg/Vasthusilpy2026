import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Phone,
  Copy,
  Check,
  Edit2,
  Trash2,
  Layers,
  Filter,
  DollarSign,
  Building2,
  Share2,
  IndianRupee,
  AlertTriangle,
  Clock,
  User,
  CheckSquare,
  Square,
  CreditCard,
  X
} from "lucide-react";
import {
  OnlineApplicantRecord,
  ApplicationDetailItem,
  OnlineApplicationStatus
} from "../../../types";
import {
  loadOnlineApplicants,
  deleteOnlineApplicant,
  subscribeToOnlineApplicants,
  isApplicantPaymentCompleted,
  DEFAULT_RECEIVER_UPI,
  upsertOnlineApplicant
} from "../../../utils/onlineApplicationsManager";
import { ApplicantPaymentQrModal } from "./ApplicantPaymentQrModal";
import { ManageApplicationsModal } from "./ManageApplicationsModal";
import { ApplicantFormModal } from "./ApplicantFormModal";
import { ApplicationPaymentModal } from "./ApplicationPaymentModal";
import { ApplicationTypesView } from "./ApplicationTypesView";

const STATUS_CONFIG: {
  [key in OnlineApplicationStatus]: { label: string; badgeClass: string };
} = {
  SUBMITTED: { label: "Submitted", badgeClass: "bg-blue-950 text-blue-300 border-blue-800" },
  APPROVED: { label: "Approved", badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  DELIVERED: { label: "Delivered", badgeClass: "bg-purple-950 text-purple-300 border-purple-800" },
  PENDING: { label: "Submitted", badgeClass: "bg-blue-950 text-blue-300 border-blue-800" },
  IN_PROGRESS: { label: "Submitted", badgeClass: "bg-blue-950 text-blue-300 border-blue-800" },
  VERIFICATION: { label: "Submitted", badgeClass: "bg-blue-950 text-blue-300 border-blue-800" },
  FEE_DUE: { label: "Submitted", badgeClass: "bg-blue-950 text-blue-300 border-blue-800" },
  COMPLETED: { label: "Delivered", badgeClass: "bg-purple-950 text-purple-300 border-purple-800" },
  REJECTED: { label: "Needs Correction", badgeClass: "bg-rose-950 text-rose-300 border-rose-800" }
};

interface OnlineApplicationsTabProps {
  initialSubTab?: "directory" | "types";
  onSubTabChange?: (sub: "directory" | "types") => void;
}

export const OnlineApplicationsTab: React.FC<OnlineApplicationsTabProps> = ({
  initialSubTab = "directory",
  onSubTabChange
}) => {
  const [currentSubTab, setCurrentSubTab] = useState<"directory" | "types">(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setCurrentSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabSwitch = (sub: "directory" | "types") => {
    setCurrentSubTab(sub);
    if (onSubTabChange) {
      onSubTabChange(sub);
    }
  };

  const [applicants, setApplicants] = useState<OnlineApplicantRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PENDING">("ALL");

  // 2 BOARD STATUSES: "PROCESSING" (by default) and "COMPLETED"
  const [boardStatusTab, setBoardStatusTab] = useState<"PROCESSING" | "COMPLETED">("PROCESSING");

  // Modals state
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState<boolean>(false);
  const [editingApplicant, setEditingApplicant] = useState<OnlineApplicantRecord | null>(null);

  const [isManageAppsModalOpen, setIsManageAppsModalOpen] = useState<boolean>(false);
  const [selectedApplicantForApps, setSelectedApplicantForApps] = useState<OnlineApplicantRecord | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [selectedApplicantForQr, setSelectedApplicantForQr] = useState<OnlineApplicantRecord | null>(null);

  // Per-application payment modal state
  const [paymentModalTarget, setPaymentModalTarget] = useState<{
    applicant: OnlineApplicantRecord;
    application: ApplicationDetailItem;
  } | null>(null);

  // In-app Delete Confirmation
  const [applicantToDelete, setApplicantToDelete] = useState<{ id: string; name: string } | null>(null);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    // Initial load
    setApplicants(loadOnlineApplicants());

    // Subscribe to cloud sync updates
    const unsubscribe = subscribeToOnlineApplicants((updated) => {
      setApplicants(updated);
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Safe delete execution
  const executeDeleteApplicant = () => {
    if (!applicantToDelete) return;
    const updated = deleteOnlineApplicant(applicantToDelete.id);
    setApplicants(updated);
    showToast(`Deleted applicant record "${applicantToDelete.name}"`);
    setApplicantToDelete(null);
  };

  // Checkbox toggle: identify whether the individual application is approved or not
  const handleToggleAppApproval = (applicant: OnlineApplicantRecord, appId: string, isApproved: boolean) => {
    const updatedApps = (applicant.applications || []).map((app) =>
      app.id === appId ? { ...app, isApproved } : app
    );

    const updatedRecord: OnlineApplicantRecord = {
      ...applicant,
      applications: updatedApps,
      updatedAt: new Date().toISOString()
    };

    const updatedList = upsertOnlineApplicant(updatedRecord);
    setApplicants(updatedList);
    showToast(
      isApproved
        ? `Application marked as APPROVED (അംഗീകരിച്ചു)`
        : `Approval status reset for application`
    );
  };

  // Helper to determine if applicant was manually moved to completed
  const isApplicantCompleted = (applicant: OnlineApplicantRecord): boolean => {
    return applicant.isCompleted === true || applicant.status === "COMPLETED";
  };

  // Checkbox: Move to Completed / Move to Processing
  const handleMoveToCompleted = (applicant: OnlineApplicantRecord, moveToCompleted: boolean) => {
    const resolvedStatus: OnlineApplicationStatus = moveToCompleted
      ? (applicant.status === "COMPLETED" ? "DELIVERED" : (applicant.status || "DELIVERED"))
      : (applicant.status === "COMPLETED" ? "SUBMITTED" : (applicant.status || "SUBMITTED"));

    const updatedRecord: OnlineApplicantRecord = {
      ...applicant,
      isCompleted: moveToCompleted,
      status: resolvedStatus,
      updatedAt: new Date().toISOString()
    };

    const updatedList = upsertOnlineApplicant(updatedRecord);
    setApplicants(updatedList);
    showToast(
      moveToCompleted
        ? `Moved "${applicant.applicantName}" to COMPLETED`
        : `Moved "${applicant.applicantName}" back to PROCESSING`
    );
  };

  // Direct Status Update handler for Submitted, Approved, Delivered
  const handleUpdateApplicantStatus = (applicant: OnlineApplicantRecord, newStatus: OnlineApplicationStatus) => {
    const updatedRecord: OnlineApplicantRecord = {
      ...applicant,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    const updatedList = upsertOnlineApplicant(updatedRecord);
    setApplicants(updatedList);
    showToast(`Status updated to "${STATUS_CONFIG[newStatus]?.label || newStatus}" for ${applicant.applicantName}`);
  };

  // Split into Processing and Completed applications strictly based on manual "Move to Completed"
  const processingApplicants = applicants.filter((a) => !isApplicantCompleted(a));
  const completedApplicants = applicants.filter((a) => isApplicantCompleted(a));

  // Get current board applicants according to selected tab or specific status filter
  const activeBoardApplicants = boardStatusTab === "PROCESSING"
    ? processingApplicants
    : completedApplicants;

  // Filtered applicants based on search and filters
  const filteredApplicants = activeBoardApplicants.filter((item) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      item.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobileNo.includes(searchTerm) ||
      (item.applications || []).some(
        (app) =>
          app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.loginId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.portal.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const normStatus = item.status === "COMPLETED" ? "DELIVERED" : (item.status || "SUBMITTED");
    const matchesStatus =
      statusFilter === "ALL" ||
      normStatus === statusFilter ||
      (statusFilter === "APPROVED" && (normStatus === "APPROVED" || (item.applications || []).some((app) => app.isApproved))) ||
      (statusFilter === "SUBMITTED" && (normStatus === "SUBMITTED" || item.status === "PENDING" || item.status === "IN_PROGRESS" || item.status === "VERIFICATION" || item.status === "FEE_DUE")) ||
      (statusFilter === "DELIVERED" && (normStatus === "DELIVERED" || item.status === "COMPLETED"));

    const isPaid = isApplicantPaymentCompleted(item);
    const matchesPayment =
      paymentFilter === "ALL" ||
      (paymentFilter === "PAID" && isPaid) ||
      (paymentFilter === "PENDING" && !isPaid);

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Financial and status aggregations
  const totalApplicants = applicants.length;
  const processingCount = processingApplicants.length;
  const completedCount = completedApplicants.length;

  const totalApplications = applicants.reduce((sum, a) => sum + (a.applications?.length || 0), 0);
  const totalBill = applicants.reduce((sum, a) => sum + (a.billAmount || 0), 0);
  const totalPaid = applicants.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
  const totalBalance = Math.max(0, totalBill - totalPaid);

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-emerald-500/60 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-mono font-bold">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={() => handleSubTabSwitch("directory")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer ${
              currentSubTab === "directory"
                ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ONLINE APPLICATIONS DIRECTORY</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabSwitch("types")}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer ${
              currentSubTab === "types"
                ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>APPLICATIONS TYPE</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/60 text-slate-300">
              CONFIG
            </span>
          </button>
        </div>

        {currentSubTab === "directory" && (
          <button
            type="button"
            onClick={() => {
              setEditingApplicant(null);
              setIsApplicantModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ NEW APPLICANT</span>
          </button>
        )}
      </div>

      {currentSubTab === "types" ? (
        <ApplicationTypesView />
      ) : (
        <>
          {/* Top Banner & Header Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  KERALA LSGD / ONLINE PORTAL DIRECTORY
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {filteredApplicants.length} of {activeBoardApplicants.length} In Current Tab
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight flex items-center gap-2">
                <span>Online Applications & Login Directory</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Track status, approve applications, monitor payments, and generate UPI QR payments to{" "}
                <strong className="text-cyan-300">9567627277@SLC</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingApplicant(null);
                  setIsApplicantModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ NEW APPLICANT</span>
              </button>
            </div>
          </div>

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span>Total Records</span>
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-black text-white">{totalApplicants}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span>Applications</span>
                <Layers className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-base font-black text-purple-300">{totalApplications}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span>Total Bill</span>
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-base font-black text-blue-300">₹{totalBill.toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span>Total Paid</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-base font-black text-emerald-300">₹{totalPaid.toLocaleString("en-IN")}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span>Balance Due</span>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className={`text-base font-black ${totalBalance > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                ₹{totalBalance.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold uppercase mb-1">
                <span>Completed</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-base font-black text-emerald-400">
                {completedCount}{" "}
                <span className="text-[10px] text-slate-500 font-normal">
                  ({totalApplicants > 0 ? Math.round((completedCount / totalApplicants) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* 2 BOARD STATUS TABS: PROCESSING (DEFAULT) & COMPLETED */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-col sm:flex-row items-center gap-2 shadow-lg">
            <button
              type="button"
              onClick={() => setBoardStatusTab("PROCESSING")}
              className={`w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                boardStatusTab === "PROCESSING"
                  ? "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40"
                  : "bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <Clock className="w-4 h-4 text-cyan-300" />
              <span className="tracking-wide uppercase">PROCESSING APPLICATIONS</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                  boardStatusTab === "PROCESSING"
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {processingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBoardStatusTab("COMPLETED")}
              className={`w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                boardStatusTab === "COMPLETED"
                  ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/40"
                  : "bg-slate-950/70 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span className="tracking-wide uppercase">COMPLETED APPLICATIONS</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                  boardStatusTab === "COMPLETED"
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {completedCount}
              </span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${boardStatusTab.toLowerCase()} by name, mobile, app no, login...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status sub-filter */}
              <div className="flex items-center gap-2 bg-slate-950/90 hover:bg-slate-950 border border-slate-700/80 hover:border-cyan-500/60 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 rounded-xl px-3 py-1.5 shadow-sm transition-all duration-150 group">
                <Filter className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 transition-colors shrink-0" />
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black text-white text-xs font-mono font-bold focus:outline-none cursor-pointer tracking-wide px-2 py-0.5 rounded-lg border border-zinc-800"
                  style={{ backgroundColor: "#000000", color: "#ffffff" }}
                >
                  <option value="ALL" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>All Status</option>
                  <option value="SUBMITTED" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Submitted</option>
                  <option value="APPROVED" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Approved</option>
                  <option value="DELIVERED" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Delivered</option>
                </select>
                {statusFilter !== "ALL" && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${
                      statusFilter === "SUBMITTED"
                        ? "bg-blue-400"
                        : statusFilter === "APPROVED"
                        ? "bg-emerald-400"
                        : "bg-purple-400"
                    }`}
                    title={`Filter active: ${statusFilter}`}
                  />
                )}
              </div>

              {/* Payment Filter */}
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPaymentFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    paymentFilter === "ALL" ? "bg-cyan-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter("PAID")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    paymentFilter === "PAID" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-emerald-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Paid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter("PENDING")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    paymentFilter === "PENDING" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-amber-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Due</span>
                </button>
              </div>
            </div>
          </div>

          {/* MAIN UNIFORM GRID APPLICATIONS TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono table-fixed">
                {/* TABLE HEADERS - 4 WELL-DEFINED UNIFORM COLUMNS */}
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    {/* COLUMN 1: APPLICATION DETAILS (34%) */}
                    <th className="py-3.5 px-4 w-[34%] min-w-[320px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[10px]">1</span>
                        <span>APPLICATION DETAILS</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5 normal-case">
                        Name, Number, Payment, UserID & Status (Stacked)
                      </span>
                    </th>

                    {/* COLUMN 2: APPLICANT & CONTACT (22%) */}
                    <th className="py-3.5 px-4 w-[22%] min-w-[210px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-[10px]">2</span>
                        <span>APPLICANT & CONTACT</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5 normal-case">
                        Client Name, Mobile, WhatsApp & Remarks
                      </span>
                    </th>

                    {/* COLUMN 3: PAYMENT BREAKDOWN (24%) */}
                    <th className="py-3.5 px-4 w-[24%] min-w-[230px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-bold text-[10px]">3</span>
                        <span>PAYMENT BREAKDOWN</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5 normal-case">
                        Total Bill, Paid Amount, Balance & UPI QR
                      </span>
                    </th>

                    {/* COLUMN 4: STATUS & ACTIONS (20%) */}
                    <th className="py-3.5 px-4 w-[20%] min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-purple-950 text-purple-400 border border-purple-800 flex items-center justify-center font-bold text-[10px]">4</span>
                        <span>STATUS & ACTIONS</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5 normal-case">
                        Status Dropdown, Move to Completed & Actions
                      </span>
                    </th>
                  </tr>
                </thead>

                {/* TABLE BODY */}
                <tbody className="divide-y divide-slate-800/80">
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-14 text-center text-slate-500 font-mono">
                        <FileText className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-cyan-400" />
                        <p className="text-sm font-bold text-slate-300">
                          No {boardStatusTab === "PROCESSING" ? "Processing" : "Completed"} Applications Found
                        </p>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          {searchTerm || statusFilter !== "ALL" || paymentFilter !== "ALL"
                            ? "Try clearing your search keyword or filters above."
                            : boardStatusTab === "PROCESSING"
                            ? "Click '+ NEW APPLICANT' at the top to add a new online application."
                            : "Applications marked with 'Move to Completed' will appear in this tab."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((applicant) => {
                      const isPaid = isApplicantPaymentCompleted(applicant);
                      const balance = Math.max(0, applicant.billAmount - applicant.paidAmount);
                      const apps = applicant.applications || [];
                      const isCompleted = isApplicantCompleted(applicant);

                      return (
                        <tr
                          key={applicant.id}
                          className={`transition-colors border-l-4 ${
                            isCompleted
                              ? "bg-emerald-950/20 hover:bg-emerald-950/30 border-l-emerald-500"
                              : isPaid
                              ? "bg-slate-900/90 hover:bg-slate-850 border-l-cyan-500"
                              : "bg-slate-900/60 hover:bg-slate-850/80 border-l-slate-700"
                          }`}
                        >
                          {/* 1ST COLUMN: APPLICATION NAME, NUMBER, PAYMENT, USERID, STATUS STACKED VERTICALLY */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-3">
                              {apps.length === 0 ? (
                                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 text-slate-500 text-xs flex flex-col items-center justify-center text-center gap-2">
                                  <FileText className="w-6 h-6 text-slate-600" />
                                  <span>No application details added yet.</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedApplicantForApps(applicant);
                                      setIsManageAppsModalOpen(true);
                                    }}
                                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                                  >
                                    + Add Application Details
                                  </button>
                                </div>
                              ) : (
                                apps.map((app, appIdx) => {
                                  const aBill = app.billAmount ?? 0;
                                  const isApproved = !!app.isApproved;

                                  return (
                                    <div
                                      key={app.id || appIdx}
                                      className={`p-3 rounded-xl border transition-all space-y-2.5 shadow-sm ${
                                        isApproved
                                          ? "bg-emerald-950/25 border-emerald-800/80 hover:border-emerald-700"
                                          : "bg-slate-950/85 border-slate-800/90 hover:border-slate-700"
                                      }`}
                                    >
                                      {/* 1. APPLICATION NAME */}
                                      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-700/80 uppercase tracking-wide truncate">
                                            {app.portal || "Application"}
                                          </span>
                                          {apps.length > 1 && (
                                            <span className="text-[10px] font-mono text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0">
                                              #{appIdx + 1}
                                            </span>
                                          )}
                                        </div>
                                        {app.submissionDate && (
                                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                            {app.submissionDate}
                                          </span>
                                        )}
                                      </div>

                                      {/* 2. NUMBER (APPLICATION NUMBER) */}
                                      <div className="flex items-center justify-between gap-2 text-xs bg-slate-900/95 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0">
                                          Number:
                                        </span>
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="font-mono font-bold text-white tracking-wider truncate">
                                            {app.applicationNumber || "—"}
                                          </span>
                                          {app.applicationNumber && (
                                            <button
                                              type="button"
                                              onClick={() => handleCopy(app.applicationNumber, `no_${app.id}`)}
                                              className="text-slate-400 hover:text-cyan-300 p-0.5 transition-colors cursor-pointer shrink-0"
                                              title="Copy Application Number"
                                            >
                                              {copiedKey === `no_${app.id}` ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                              ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* 3. PAYMENT */}
                                      <div className="flex items-center justify-between gap-2 text-xs bg-slate-900/95 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0">
                                          Payment:
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono font-black text-amber-300 text-xs">
                                            ₹{aBill.toLocaleString("en-IN")}
                                          </span>
                                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                            aBill === 0
                                              ? "bg-slate-800 text-slate-400 border-slate-700"
                                              : isPaid
                                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                              : "bg-amber-950 text-amber-300 border-amber-800"
                                          }`}>
                                            {aBill === 0 ? "FREE" : isPaid ? "PAID" : "DUE"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* 4. USER ID */}
                                      <div className="flex items-center justify-between gap-2 text-xs bg-slate-900/95 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider shrink-0">
                                          UserID:
                                        </span>
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span className="font-mono font-bold text-emerald-300 truncate">
                                            {app.loginId || "—"}
                                          </span>
                                          {app.loginId && (
                                            <button
                                              type="button"
                                              onClick={() => handleCopy(app.loginId, `login_${app.id}`)}
                                              className="text-slate-400 hover:text-emerald-300 p-0.5 transition-colors cursor-pointer shrink-0"
                                              title="Copy User ID / Login"
                                            >
                                              {copiedKey === `login_${app.id}` ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                              ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* 5. STATUS */}
                                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                                          <input
                                            type="checkbox"
                                            checked={isApproved}
                                            onChange={(e) => handleToggleAppApproval(applicant, app.id, e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                                          />
                                          <span className={`text-xs font-bold transition-colors ${
                                            isApproved ? "text-emerald-400 font-bold" : "text-slate-400 group-hover:text-slate-300"
                                          }`}>
                                            {isApproved ? "✓ Approved" : "Mark as Approved"}
                                          </span>
                                        </label>

                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                                          isApproved
                                            ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                                            : STATUS_CONFIG[applicant.status]?.badgeClass || "bg-slate-800 text-slate-300 border-slate-700"
                                        }`}>
                                          {isApproved ? "APPROVED" : STATUS_CONFIG[applicant.status]?.label || applicant.status}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>

                          {/* 2ND COLUMN: APPLICANT & CONTACT DETAILS */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 shadow-sm">
                              {/* Applicant Name */}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                                    {applicant.applicantName.charAt(0).toUpperCase()}
                                  </div>
                                  <h4 className="text-sm font-bold text-white truncate">
                                    {applicant.applicantName}
                                  </h4>
                                </div>
                                {applicant.notes && (
                                  <p className="text-[11px] text-slate-400 italic bg-slate-900/80 p-2 rounded-lg border border-slate-800 mt-1.5 line-clamp-2">
                                    "{applicant.notes}"
                                  </p>
                                )}
                              </div>

                              {/* Contact: Phone & WhatsApp */}
                              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300">
                                  <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <a href={`tel:${applicant.mobileNo}`} className="hover:underline tracking-wide">
                                    {applicant.mobileNo}
                                  </a>
                                </div>

                                <a
                                  href={`https://wa.me/${
                                    applicant.mobileNo.replace(/[^0-9]/g, "").length === 10
                                      ? `91${applicant.mobileNo.replace(/[^0-9]/g, "")}`
                                      : applicant.mobileNo.replace(/[^0-9]/g, "")
                                  }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 px-2.5 py-1.5 rounded-lg border border-emerald-800/80 transition-colors w-full"
                                  title="Chat on WhatsApp"
                                >
                                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>WhatsApp Chat</span>
                                </a>
                              </div>

                              {/* Manage applications quick button */}
                              <div className="pt-1 border-t border-slate-800/80">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApplicantForApps(applicant);
                                    setIsManageAppsModalOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer w-full justify-center"
                                >
                                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Manage Applications ({apps.length})</span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 3RD COLUMN: PAYMENT BREAKDOWN */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 shadow-sm">
                              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Payment Breakdown</span>
                                </span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                  isPaid
                                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                    : balance > 0 && applicant.paidAmount > 0
                                    ? "bg-amber-950 text-amber-300 border-amber-800"
                                    : "bg-rose-950 text-rose-300 border-rose-800"
                                }`}>
                                  {isPaid ? "SETTLED" : balance > 0 && applicant.paidAmount > 0 ? "PARTIAL" : "UNPAID"}
                                </span>
                              </div>

                              {/* Financial Metrics Grid */}
                              <div className="space-y-2 text-xs">
                                {/* 1. Total Bill */}
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                    Total Bill:
                                  </span>
                                  <span className="font-mono font-black text-sm text-white">
                                    ₹{applicant.billAmount.toLocaleString("en-IN")}
                                  </span>
                                </div>

                                {/* 2. Paid Amount */}
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                    Paid Amount:
                                  </span>
                                  <span className="font-mono font-black text-sm text-emerald-400">
                                    ₹{applicant.paidAmount.toLocaleString("en-IN")}
                                  </span>
                                </div>

                                {/* 3. Balance */}
                                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                    Balance Due:
                                  </span>
                                  {balance > 0 ? (
                                    <span className="font-mono font-black text-sm text-amber-400">
                                      ₹{balance.toLocaleString("en-IN")}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>₹0 (Nil)</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Visual Payment Progress Bar */}
                              <div className="pt-1">
                                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      isPaid ? "bg-emerald-500" : "bg-amber-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        applicant.billAmount > 0
                                          ? Math.round((applicant.paidAmount / applicant.billAmount) * 100)
                                          : isPaid ? 100 : 0
                                      )}%`
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1">
                                  <span>Progress</span>
                                  <span>
                                    {applicant.billAmount > 0
                                      ? Math.round((applicant.paidAmount / applicant.billAmount) * 100)
                                      : isPaid ? 100 : 0}
                                    %
                                  </span>
                                </div>
                              </div>

                              {/* QR Code Action Button */}
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedApplicantForQr(applicant);
                                    setIsQrModalOpen(true);
                                  }}
                                  className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                                    isPaid
                                      ? "bg-slate-900 hover:bg-slate-850 text-emerald-300 border border-emerald-600/60"
                                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-emerald-500/20"
                                  }`}
                                  title={`Scan to Pay ₹${balance} to 9567627277@SLC`}
                                >
                                  <QrCode className="w-4 h-4 shrink-0" />
                                  <span>
                                    {isPaid ? "View QR Receipt" : `Pay ₹${balance.toLocaleString("en-IN")} QR`}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 4TH COLUMN: STATUS & ACTION BUTTONS */}
                          <td className="py-4 px-4 align-top">
                            <div className="space-y-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 shadow-sm">
                              {/* Direct Status Selector: Submitted, Approved, Delivered (Text White, Background Black) */}
                              <div className="bg-black border border-zinc-800 p-2.5 rounded-xl transition-all shadow-sm">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                    applicant.status === "DELIVERED" || applicant.status === "COMPLETED"
                                      ? "text-purple-300 bg-purple-950/80 border-purple-800"
                                      : applicant.status === "APPROVED"
                                      ? "text-emerald-300 bg-emerald-950/80 border-emerald-800"
                                      : "text-blue-300 bg-blue-950/80 border-blue-800"
                                  }`}>
                                    {applicant.status === "COMPLETED" ? "DELIVERED" : (applicant.status || "SUBMITTED")}
                                  </span>
                                </div>
                                <select
                                  value={applicant.status === "COMPLETED" ? "DELIVERED" : (applicant.status || "SUBMITTED")}
                                  onChange={(e) => handleUpdateApplicantStatus(applicant, e.target.value as OnlineApplicationStatus)}
                                  className="w-full bg-black text-white border border-zinc-700 hover:border-zinc-500 focus:border-white focus:ring-1 focus:ring-white/40 text-xs font-mono font-bold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer tracking-wide"
                                  style={{ backgroundColor: "#000000", color: "#ffffff" }}
                                >
                                  <option value="SUBMITTED" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Submitted</option>
                                  <option value="APPROVED" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Approved</option>
                                  <option value="DELIVERED" className="bg-black text-white font-mono" style={{ backgroundColor: "#000000", color: "#ffffff" }}>Delivered</option>
                                </select>
                              </div>

                              {/* Move to Completed (Checkbox) */}
                              <label
                                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all group ${
                                  isCompleted
                                    ? "bg-emerald-950/40 border-emerald-700/80 text-emerald-200"
                                    : "bg-slate-900/90 border-slate-800 hover:border-emerald-600/70 text-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isCompleted}
                                  onChange={(e) => handleMoveToCompleted(applicant, e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                  <span
                                    className={`text-xs font-bold transition-colors ${
                                      isCompleted
                                        ? "text-emerald-400"
                                        : "text-slate-200 group-hover:text-emerald-300"
                                    }`}
                                  >
                                    {isCompleted ? "✓ Completed" : "Move to Completed"}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {isCompleted ? "In Completed Tab" : "Mark as completed"}
                                  </span>
                                </div>
                              </label>

                              {/* Edit & Delete Action Buttons */}
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                {/* Edit Option */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingApplicant(applicant);
                                    setIsApplicantModalOpen(true);
                                  }}
                                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="Edit Applicant & Applications"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Edit</span>
                                </button>

                                {/* Delete Option */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setApplicantToDelete({ id: applicant.id, name: applicant.applicantName })
                                  }
                                  className="py-2 px-2.5 bg-rose-950/30 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 rounded-xl border border-rose-900/50 hover:border-rose-700 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-slate-950 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3 text-slate-400">
                <span>
                  Showing <strong className="text-white">{filteredApplicants.length}</strong> {boardStatusTab.toLowerCase()} of{" "}
                  <strong className="text-white">{totalApplicants}</strong> total records
                </span>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span className="hidden sm:inline text-emerald-400 flex items-center gap-1 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Receiver UPI: 9567627277@SLC
                </span>
              </div>

              <div className="flex items-center gap-4 font-bold">
                <span className="text-slate-300">
                  Total Due: <span className="text-amber-400">₹{totalBalance.toLocaleString("en-IN")}</span>
                </span>
                <span className="text-slate-300">
                  Total Collected: <span className="text-emerald-400">₹{totalPaid.toLocaleString("en-IN")}</span>
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: CREATE / EDIT APPLICANT FORM MODAL */}
      <ApplicantFormModal
        applicant={editingApplicant}
        isOpen={isApplicantModalOpen}
        onClose={() => {
          setIsApplicantModalOpen(false);
          setEditingApplicant(null);
        }}
        onSaved={(savedRecord) => {
          const current = loadOnlineApplicants();
          setApplicants(current);
          showToast(`Saved applicant record "${savedRecord.applicantName}"`);
        }}
      />

      {/* MODAL 2: MANAGE PER-APPLICANT APPLICATIONS MODAL */}
      <ManageApplicationsModal
        applicant={selectedApplicantForApps}
        isOpen={isManageAppsModalOpen}
        onClose={() => {
          setIsManageAppsModalOpen(false);
          setSelectedApplicantForApps(null);
        }}
        onUpdated={(updatedRecord) => {
          const current = loadOnlineApplicants();
          setApplicants(current);
        }}
      />

      {/* MODAL 3: UPI QR PAYMENT MODAL */}
      <ApplicantPaymentQrModal
        applicant={selectedApplicantForQr}
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setSelectedApplicantForQr(null);
        }}
        onPaymentRecorded={(updatedRecord) => {
          const current = loadOnlineApplicants();
          setApplicants(current);
          showToast(`Payment recorded for "${updatedRecord.applicantName}"`);
        }}
      />

      {/* MODAL 4: PER-APPLICATION PAYMENT MODAL */}
      {paymentModalTarget && (
        <ApplicationPaymentModal
          applicant={paymentModalTarget.applicant}
          application={paymentModalTarget.application}
          isOpen={!!paymentModalTarget}
          onClose={() => setPaymentModalTarget(null)}
          onSaved={(updatedRecord) => {
            const current = loadOnlineApplicants();
            setApplicants(current);
            setPaymentModalTarget(null);
            showToast(`Payment recorded for application`);
          }}
        />
      )}

      {/* MODAL 5: SAFE IN-APP DELETE CONFIRMATION MODAL */}
      {applicantToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-sans">
                Delete Applicant Record?
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Are you sure you want to delete{" "}
                <strong className="text-rose-300">"{applicantToDelete.name}"</strong> and all their linked applications?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApplicantToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteApplicant}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs font-mono cursor-pointer transition-all shadow-lg shadow-rose-600/20"
              >
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
