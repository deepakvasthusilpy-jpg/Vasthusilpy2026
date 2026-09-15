import React, { useState, useEffect } from "react";
import {
  Link2,
  Plus,
  Search,
  Clock,
  Shield,
  Eye,
  Copy,
  Check,
  QrCode,
  MessageCircle,
  ExternalLink,
  RefreshCw,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Building2,
  Users,
  Award,
  ListChecks,
  Printer,
  ShieldCheck,
  MapPin,
  DollarSign,
  Layers,
  HardHat,
  ChevronRight,
  Receipt,
  CreditCard,
  Wallet,
  IndianRupee,
  Phone,
  Mail,
  AlertCircle,
  Lock
} from "lucide-react";
import { ClientShareLink, Invoice, PaymentRecord } from "../../../types";
import {
  EstimateProject,
  loadSavedEstimates,
  INITIAL_ESTIMATES_LIST,
  normalizeProjectBlocks,
  stripEr,
  numberToIndianWords,
  generateDefaultStageCertificate,
  generateDefaultCompletionCertificate,
  isProject100PercentStageCompleted
} from "../../../data/estimateData";
import {
  loadSavedClientShares,
  saveClientShares,
  revokeClientShareLink,
  extendClientShareLink,
  deleteClientShareLink,
  getTimeRemainingFormatted,
  buildClientShareUrl
} from "../../../data/clientShareData";
import { INITIAL_INVOICES } from "../../../data/crmData";
import {
  loadInvoices,
  saveInvoices,
  getDeletedInvoiceIds,
  getDeletedProjectIds,
  isDemoOrPurgedInvoice
} from "../../../utils/storageManager";
import { NewClientLinkModal } from "./NewClientLinkModal";
import { ClientLinkQrModal } from "./ClientLinkQrModal";
import { ClientInvoiceQrModal } from "./ClientInvoiceQrModal";
import { InvoiceDetailModal } from "../invoices/InvoiceDetailModal";
import { RecordPaymentModal } from "../invoices/RecordPaymentModal";
import { InvoiceQrCode } from "../invoices/InvoiceQrCode";
import { ClientPaymentHistoryView } from "./ClientPaymentHistoryView";
import { useLanguage } from "../../../context/LanguageContext";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

interface ClientViewTabProps {
  estimateProjects?: EstimateProject[];
  defaultPrimarySubTab?: "ESTIMATE" | "INVOICE";
}

export const ClientViewTab: React.FC<ClientViewTabProps> = ({
  estimateProjects: propEstimateProjects,
  defaultPrimarySubTab = "INVOICE"
}) => {
  const { t } = useLanguage();

  // Top-level Sub Tab State (ESTIMATE vs INVOICE)
  const [primarySubTab, setPrimarySubTab] = useState<"ESTIMATE" | "INVOICE">(defaultPrimarySubTab);

  useEffect(() => {
    if (defaultPrimarySubTab) {
      setPrimarySubTab(defaultPrimarySubTab);
    }
  }, [defaultPrimarySubTab]);

  // ==========================================
  // ESTIMATE SUB-TAB STATE
  // ==========================================
  const [estimateProjects, setEstimateProjects] = useState<EstimateProject[]>(() => {
    if (propEstimateProjects && propEstimateProjects.length > 0) return propEstimateProjects;
    const loaded = loadSavedEstimates();
    return loaded && loaded.length > 0 ? loaded : INITIAL_ESTIMATES_LIST;
  });

  const [shareLinks, setShareLinks] = useState<ClientShareLink[]>(() => {
    return loadSavedClientShares();
  });

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "EXPIRED" | "REVOKED">("ALL");
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [qrModalLink, setQrModalLink] = useState<ClientShareLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estimate Verification Hub State
  const [selectedVerifyProjectId, setSelectedVerifyProjectId] = useState<string>(
    estimateProjects[0]?.id || "E000003"
  );
  const [verifySubTab, setVerifySubTab] = useState<"estimate" | "stage" | "completion">("stage");
  const [verifyCopied, setVerifyCopied] = useState<boolean>(false);

  // ==========================================
  // INVOICE SUB-TAB STATE
  // ==========================================
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadInvoices();
  });

  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState<string>("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<
    "ALL" | "UNPAID" | "PARTIALLY PAID" | "PAID"
  >("ALL");
  const [qrModalInvoice, setQrModalInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<Invoice | null>(null);
  const [recordingPaymentInvoice, setRecordingPaymentInvoice] = useState<Invoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [invoiceSubSection, setInvoiceSubSection] = useState<
    "DIRECTORY" | "PAYMENT_HISTORY" | "VERIFICATION"
  >("PAYMENT_HISTORY");
  const [selectedVerifyInvoiceId, setSelectedVerifyInvoiceId] = useState<string>(
    invoices[0]?.id || ""
  );
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Sync state when storage changes or Firebase updates
  useEffect(() => {
    const handleStorageChange = () => {
      setShareLinks(loadSavedClientShares());
      setEstimateProjects(loadSavedEstimates());
      setInvoices(loadInvoices());
    };

    window.addEventListener("vasthusilpy_client_shares_updated", handleStorageChange);
    window.addEventListener("vasthusilpy_storage_update", handleStorageChange);
    window.addEventListener("vasthusilpy_invoices_updated", handleStorageChange);

    // Real-time sync for client shares & invoices
    let isMounted = true;
    let unsubShares = () => {};
    let unsubInvoices = () => {};

    if (db) {
      try {
        unsubShares = onSnapshot(
          collection(db, "client_shares"),
          (snapshot) => {
            if (!isMounted) return;
            if (!snapshot.empty) {
              const remote: ClientShareLink[] = [];
              snapshot.forEach((d) => {
                const item = d.data() as ClientShareLink;
                if (item && item.id) {
                  remote.push(item);
                }
              });
              if (remote.length > 0) {
                setShareLinks(remote);
                saveClientShares(remote);
              }
            }
          },
          () => {
            // Offline fallback
          }
        );

        unsubInvoices = onSnapshot(
          collection(db, "invoices"),
          (snapshot) => {
            if (!isMounted) return;
            const deletedInvoiceIds = getDeletedInvoiceIds();
            const deletedProjectIds = getDeletedProjectIds();
            if (!snapshot.empty) {
              const remoteInvoices: Invoice[] = [];
              snapshot.forEach((d) => {
                const item = d.data() as Invoice;
                if (item && item.id && !deletedInvoiceIds.includes(item.id) && !isDemoOrPurgedInvoice(item)) {
                  if (item.projectId && deletedProjectIds.includes(item.projectId)) {
                    remoteInvoices.push({ ...item, projectId: undefined });
                  } else {
                    remoteInvoices.push(item);
                  }
                }
              });
              setInvoices(remoteInvoices);
              saveInvoices(remoteInvoices, false);
            }
          },
          () => {
            // Offline fallback
          }
        );
      } catch (e) {
        // Safe offline fallback
      }
    }

    return () => {
      isMounted = false;
      window.removeEventListener("vasthusilpy_client_shares_updated", handleStorageChange);
      window.removeEventListener("vasthusilpy_storage_update", handleStorageChange);
      window.removeEventListener("vasthusilpy_invoices_updated", handleStorageChange);
      unsubShares();
      unsubInvoices();
    };
  }, []);

  // Estimate Handlers
  const handleCopyLink = (link: ClientShareLink) => {
    const url = buildClientShareUrl(link.token);
    navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (link: ClientShareLink) => {
    const url = buildClientShareUrl(link.token);
    const text = encodeURIComponent(
      `*വാസ്തുശില്പി - പ്രോജക്ട് പ്രോഗ്രസ് & സർട്ടിഫിക്കറ്റ് വ്യൂ*\n` +
      `പ്രിയ ${link.clientName},\n\n` +
      `നിങ്ങളുടെ *${link.estimateProjectName}* പ്രോജക്റ്റിന്റെ ലൈവ് വർക്ക് പ്രോഗ്രസ് & സ്റ്റേജ് സർട്ടിഫിക്കറ്റ് താഴെ കാണുന്ന ലിങ്കിൽ പരിശോധിക്കാവുന്നതാണ്:\n\n` +
      `🔗 ${url}\n\n` +
      `✨ *ലോഗിൻ ആവശ്യമില്ല:* ഈ ലിങ്കിൽ ക്ലിക്ക് ചെയ്താൽ മൊബൈലിലോ കമ്പ്യൂട്ടറിലോ നേരിട്ട് കാണാം.\n` +
      `⏳ ഈ ലിങ്ക് ${new Date(link.expiresAt).toLocaleDateString("en-IN")} വരെ സാധുവാണ്.\n\n` +
      `Vasthusilpy Technical System - Keralassery\n📞 +91 70123 83137`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleRevoke = async (id: string) => {
    if (window.confirm("ഈ ക്ലൈൻ്റ് ലിങ്ക് റദ്ദാക്കണമെന്ന് (Revoke) ഉറപ്പാണോ? ഇതിനു ശേഷം ക്ലൈൻ്റിന് പ്രോജക്റ്റ് കാണാൻ സാധിക്കില്ല.")) {
      const updated = await revokeClientShareLink(id);
      setShareLinks(updated);
    }
  };

  const handleExtend = async (id: string, hours: number) => {
    const updated = await extendClientShareLink(id, hours);
    setShareLinks(updated);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("ഈ ക്ലൈൻ്റ് ലിങ്ക് പൂർണ്ണമായി ഡിലീറ്റ് ചെയ്യണമെന്ന് ഉറപ്പാണോ?")) {
      const updated = await deleteClientShareLink(id);
      setShareLinks(updated);
    }
  };

  // Estimate Target Project for verification
  const rawTargetProject =
    estimateProjects.find((p) => p.id === selectedVerifyProjectId) ||
    estimateProjects[0] ||
    INITIAL_ESTIMATES_LIST[0];
  const activeVerifyProject = normalizeProjectBlocks(rawTargetProject);
  const activeStageCert = activeVerifyProject?.stageCertificate || (activeVerifyProject ? generateDefaultStageCertificate(activeVerifyProject) : null);
  const activeCompCert = activeVerifyProject?.completionCertificate || (activeVerifyProject ? generateDefaultCompletionCertificate(activeVerifyProject) : null);
  const verificationUrl = activeVerifyProject
    ? `${window.location.origin}/?verify=${activeVerifyProject.id}&hash=${activeVerifyProject.verificationHash || "verified"}`
    : "";

  const handleCopyVerifyUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setVerifyCopied(true);
    setTimeout(() => setVerifyCopied(false), 2000);
  };

  const handleShareVerifyWhatsApp = () => {
    const text = encodeURIComponent(
      `*വാസ്തുശില്പി - ഒഫീഷ്യൽ സർട്ടിഫിക്കറ്റ് & എസ്റ്റിമേറ്റ് വെരിഫിക്കേഷൻ*\n` +
      `പ്രോജക്ട്: *${activeVerifyProject.clientName}* (${activeVerifyProject.buildingType})\n` +
      `ലൊക്കേഷൻ: ${activeVerifyProject.houseName}, ${activeVerifyProject.panchayatVillage}\n\n` +
      `സ്റ്റേജ് സർട്ടിഫിക്കറ്റും എസ്റ്റിമേറ്റും പരിശോധിക്കാൻ താഴെ കാണുന്ന ഒഫീഷ്യൽ വെരിഫിക്കേഷൻ ലിങ്ക് സന്ദർശിക്കുക:\n` +
      `🔗 ${verificationUrl}\n\n` +
      `Vasthusilpy Official Document Authenticator`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Filter estimate links
  const filteredLinks = shareLinks.filter((link) => {
    const matchesSearch =
      link.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.estimateProjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.estimateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.token.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const timeInfo = getTimeRemainingFormatted(link.expiresAt, link.status);
    if (statusFilter === "ACTIVE") return link.status === "ACTIVE" && !timeInfo.isExpired;
    if (statusFilter === "EXPIRED") return timeInfo.isExpired && link.status !== "REVOKED";
    if (statusFilter === "REVOKED") return link.status === "REVOKED";

    return true;
  });

  // Calculate Estimate KPIs
  const totalLinks = shareLinks.length;
  const activeLinks = shareLinks.filter((l) => {
    const info = getTimeRemainingFormatted(l.expiresAt, l.status);
    return l.status === "ACTIVE" && !info.isExpired;
  }).length;
  const totalViews = shareLinks.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

  // ==========================================
  // INVOICE HANDLERS & FILTERS
  // ==========================================
  const handleCopyInvoiceLink = (inv: Invoice) => {
    const shareUrl = `${window.location.origin}/?invoice_share=${inv.id || inv.invoiceNumber}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedInvoiceId(inv.id);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  const handleShareInvoiceWhatsApp = (inv: Invoice) => {
    const shareUrl = `${window.location.origin}/?invoice_share=${inv.id || inv.invoiceNumber}`;
    const text = encodeURIComponent(
      `*വാസ്തുശില്പി - ഒഫീഷ്യൽ ഇൻവോയ്സ് & പേയ്‌മെന്റ് വ്യൂ*\n` +
      `പ്രിയ ${inv.applicantName},\n\n` +
      `നിങ്ങളുടെ *${inv.projectTitle || "പ്രോജക്റ്റ്"}* സംബന്ധിച്ച ഇൻവോയ്സ് #${inv.invoiceNumber} വിവരങ്ങൾ താഴെ കാണുന്ന ലിങ്കിൽ പരിശോധിക്കാവുന്നതാണ്:\n\n` +
      `💰 *തുക:* ₹${inv.grandTotal.toLocaleString("en-IN")}\n` +
      (inv.balanceDue > 0
        ? `⚠️ *അടയ്ക്കാനുള്ള ബാക്കി തുക:* ₹${inv.balanceDue.toLocaleString("en-IN")}\n`
        : `✅ *സ്റ്റാറ്റസ്:* പൂർണ്ണമായി അടച്ചു (PAID)\n`) +
      `🔗 ${shareUrl}\n\n` +
      `✨ *ലോഗിൻ ആവശ്യമില്ല:* ഈ ലിങ്കിൽ ക്ലിക്ക് ചെയ്താൽ മൊബൈലിലോ കമ്പ്യൂട്ടറിലോ നേരിട്ട് ഇൻവോയ്സും രസീതും കാണാം. UPI QR വഴി ഉടൻ പേയ്മെന്റ് ചെയ്യാനും സാധിക്കും.\n\n` +
      `Vasthusilpy Architectural & Engineering - Keralassery\n📞 +91 70123 83137`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleRecordPayment = (
    invoiceId: string,
    payment: Omit<PaymentRecord, "id" | "createdAt"> & { id?: string }
  ) => {
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        let updatedPayments: PaymentRecord[];
        if (payment.id) {
          // Edit existing payment record
          updatedPayments = (inv.payments || []).map((p) =>
            p.id === payment.id
              ? {
                  ...p,
                  ...payment,
                  id: p.id,
                  createdAt: p.createdAt || new Date().toISOString()
                }
              : p
          );
        } else {
          // Add new payment record
          const newPayment: PaymentRecord = {
            ...payment,
            id: `pay_${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          updatedPayments = [newPayment, ...(inv.payments || [])];
        }

        const newTotalPaid = updatedPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const newBalanceDue = Math.max(0, inv.grandTotal - newTotalPaid);
        const newStatus: "PAID" | "PARTIALLY PAID" | "UNPAID" =
          newBalanceDue === 0 ? "PAID" : newTotalPaid > 0 ? "PARTIALLY PAID" : "UNPAID";

        const updatedInv: Invoice = {
          ...inv,
          payments: updatedPayments,
          totalPaid: newTotalPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newStatus
        };

        if (selectedInvoiceModal?.id === invoiceId) {
          setSelectedInvoiceModal(updatedInv);
        }

        return updatedInv;
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    localStorage.setItem("vasthusilpy_invoices", JSON.stringify(updatedInvoices));
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
  };

  const handleUpdateInvoiceStatus = (
    invoiceId: string,
    newStatus: "UNPAID" | "PARTIALLY PAID" | "PAID",
    notes?: string
  ) => {
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        let updatedTotalPaid = inv.totalPaid;
        let updatedBalanceDue = inv.balanceDue;

        if (newStatus === "PAID") {
          updatedTotalPaid = inv.grandTotal;
          updatedBalanceDue = 0;
        } else if (newStatus === "UNPAID" && (!inv.payments || inv.payments.length === 0)) {
          updatedTotalPaid = 0;
          updatedBalanceDue = inv.grandTotal;
        }

        return {
          ...inv,
          paymentStatus: newStatus,
          totalPaid: updatedTotalPaid,
          balanceDue: updatedBalanceDue,
          notes: notes
            ? inv.notes
              ? `${inv.notes} | ${notes}`
              : notes
            : inv.notes
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    localStorage.setItem("vasthusilpy_invoices", JSON.stringify(updatedInvoices));
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
  };

  const handleDeletePayment = (invoiceId: string, paymentId: string) => {
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        const filteredPayments = (inv.payments || []).filter((p) => p.id !== paymentId);
        const newTotalPaid = filteredPayments.reduce((acc, curr) => acc + curr.amount, 0);
        const newBalanceDue = Math.max(0, inv.grandTotal - newTotalPaid);
        const newStatus: "PAID" | "PARTIALLY PAID" | "UNPAID" =
          newBalanceDue === 0 ? "PAID" : newTotalPaid > 0 ? "PARTIALLY PAID" : "UNPAID";

        const updatedInv: Invoice = {
          ...inv,
          payments: filteredPayments,
          totalPaid: newTotalPaid,
          balanceDue: newBalanceDue,
          paymentStatus: newStatus
        };

        if (selectedInvoiceModal?.id === invoiceId) {
          setSelectedInvoiceModal(updatedInv);
        }

        return updatedInv;
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    localStorage.setItem("vasthusilpy_invoices", JSON.stringify(updatedInvoices));
    window.dispatchEvent(new Event("vasthusilpy_invoices_updated"));
  };

  // Filter Invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.applicantName.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(invoiceSearchTerm.toLowerCase()) ||
      (inv.projectTitle && inv.projectTitle.toLowerCase().includes(invoiceSearchTerm.toLowerCase())) ||
      inv.applicantMobile.includes(invoiceSearchTerm);

    if (!matchesSearch) return false;

    if (invoiceStatusFilter === "ALL") return true;
    return inv.paymentStatus === invoiceStatusFilter;
  });

  // Calculate Invoice KPIs
  const totalInvoicedAmount = invoices.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const totalCollectedAmount = invoices.reduce((acc, curr) => acc + curr.totalPaid, 0);
  const totalPendingBalance = invoices.reduce((acc, curr) => acc + curr.balanceDue, 0);
  const unpaidInvoicesCount = invoices.filter((i) => i.paymentStatus !== "PAID").length;

  // Active Selected Invoice for Verification
  const activeVerifyInvoice =
    invoices.find((i) => i.id === selectedVerifyInvoiceId) || invoices[0];
  const invoiceVerificationUrl = activeVerifyInvoice
    ? `${window.location.origin}/?invoice_share=${activeVerifyInvoice.id || activeVerifyInvoice.invoiceNumber}`
    : "";

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* PRIMARY SUB-TAB NAVIGATION (ESTIMATE vs INVOICE) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-3xl shadow-lg">
        <button
          onClick={() => setPrimarySubTab("ESTIMATE")}
          className={`px-6 py-3.5 rounded-2xl text-xs font-mono font-black flex items-center gap-3 transition-all cursor-pointer ${
            primarySubTab === "ESTIMATE"
              ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.01]"
              : "bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-sm">ESTIMATE (എസ്റ്റിമേറ്റ് & പ്രോഗ്രസ്)</span>
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
              primarySubTab === "ESTIMATE"
                ? "bg-slate-950 text-cyan-300 border border-cyan-700"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {activeLinks} Active Links
          </span>
        </button>

        <button
          onClick={() => setPrimarySubTab("INVOICE")}
          className={`px-6 py-3.5 rounded-2xl text-xs font-mono font-black flex items-center gap-3 transition-all cursor-pointer ${
            primarySubTab === "INVOICE"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.01]"
              : "bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span className="text-sm">INVOICE (ഇൻവോയ്സ് & പേയ്‌മെന്റുകൾ)</span>
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold ${
              primarySubTab === "INVOICE"
                ? "bg-slate-950 text-emerald-300 border border-emerald-700"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {invoices.length} Invoices
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. ESTIMATE SUB-TAB CONTENT */}
      {/* ========================================================================= */}
      {primarySubTab === "ESTIMATE" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Banner & Action */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800">
                    CLIENT VIEW PORTAL & CERTIFICATE VERIFICATION
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight">
                  ക്ലൈൻ്റ് പ്രോഗ്രസ് & സർട്ടിഫിക്കറ്റ് വെരിഫിക്കേഷൻ (Estimates View)
                </h2>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                  എസ്റ്റിമേറ്റ്, സ്റ്റേജ് സർട്ടിഫിക്കറ്റ്, കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് എന്നിവ ക്ലൈന്റുകൾക്ക് ലോഗിൻ ആവശ്യമില്ലാതെ സുരക്ഷിതമായി പരിശോധിക്കുന്നതിനുള്ള വെരിഫിക്കേഷൻ സംവിധാനവും ഷെയറബിൾ QR ലിങ്കുകളും.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Generate Estimate Client Link</span>
                </button>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Active Live Links</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-emerald-400">{activeLinks}</span>
                  <span className="text-[10px] text-emerald-400/80 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    LIVE
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Total Estimates Available</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-cyan-400">{estimateProjects.length}</span>
                  <span className="text-[10px] text-slate-400">ESTIMATES</span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Client Views / Clicks</span>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-amber-400">{totalViews}</span>
                  <Eye className="w-4 h-4 text-amber-400" />
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Document Authenticity</span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400">SHA-256 Verified</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ESTIMATE SECTION 1: VERIFICATION OF ESTIMATE, STAGE & COMPLETION CERT */}
          {/* ========================================================================= */}
          <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    ESTIMATE VERIFICATION HUB (ക്ലൈൻ്റ് വെരിഫിക്കേഷൻ സെന്റർ)
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white font-sans">
                  എസ്റ്റിമേറ്റ്, സ്റ്റേജ് സർട്ടിഫിക്കറ്റ് & കംപ്ലീഷൻ സർട്ടിഫിക്കറ്റ് വെരിഫിക്കേഷൻ
                </h3>
                <p className="text-xs text-slate-400">
                  ക്ലൈന്റുകൾക്ക് ഷെയർ ചെയ്യുന്നതിനായി ഏത് എസ്റ്റിമേറ്റിന്റെയും ഒഫീഷ്യൽ സർട്ടിഫിക്കറ്റുകളും അളവ് പട്ടികകളും ഇവിടെ നേരിട്ട് പരിശോധിക്കാം.
                </p>
              </div>

              {/* Project Selector Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-slate-950 border border-slate-700 rounded-2xl p-1.5 flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 pl-2">Select Estimate:</span>
                  <select
                    value={selectedVerifyProjectId}
                    onChange={(e) => setSelectedVerifyProjectId(e.target.value)}
                    className="bg-slate-900 text-cyan-300 font-mono font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {estimateProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {p.clientName} ({p.panchayatVillage})
                      </option>
                    ))}
                  </select>
                </div>

                <a
                  href={`/?verify=${activeVerifyProject.id}&hash=${activeVerifyProject.verificationHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-mono font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Open full standalone verification portal"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Public URL</span>
                </a>
              </div>
            </div>

            {/* 3-Way Subtabs for Verification */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setVerifySubTab("stage")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  verifySubTab === "stage"
                    ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <Award className="w-4 h-4" />
                <span>1. Stage Certificate Verification</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
                  {activeStageCert.progressPercentage}%
                </span>
              </button>

              {/* Completion Certificate Tab */}
              {(() => {
                const isCompUnlocked = isProject100PercentStageCompleted(activeVerifyProject);
                return (
                  <button
                    onClick={() => setVerifySubTab("completion")}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      verifySubTab === "completion"
                        ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                        : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    {isCompUnlocked ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-400" />}
                    <span>2. Completion Certificate</span>
                    {isCompUnlocked ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                        100% Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full font-mono">
                        🔒 100% Stage Works Required
                      </span>
                    )}
                  </button>
                );
              })()}

              <button
                onClick={() => setVerifySubTab("estimate")}
                className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  verifySubTab === "estimate"
                    ? "bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                    : "bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>3. Estimate BOQ (Detailed Quantity Verification)</span>
                <span className="text-[10px] text-slate-400">
                  ₹{activeVerifyProject.grandTotal.toLocaleString("en-IN")}
                </span>
              </button>
            </div>

            {/* Verification Preview Body */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
              {/* Quick Action Toolbar for Selected Certificate */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">Project Ref:</span>
                  <strong className="text-xs font-mono text-cyan-300 font-bold">
                    #{activeVerifyProject.id}
                  </strong>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-sans text-white font-bold">
                    {activeVerifyProject.clientName}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-emerald-400">
                    Hash: {activeVerifyProject.verificationHash}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyVerifyUrl}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {verifyCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{verifyCopied ? "Link Copied" : "Copy Verification URL"}</span>
                  </button>

                  <button
                    onClick={handleShareVerifyWhatsApp}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Share via WhatsApp</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Print A4</span>
                  </button>
                </div>
              </div>

              {/* Stage Certificate View */}
              {verifySubTab === "stage" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="border-b-2 border-slate-800 pb-5 text-center space-y-1">
                    <div className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                      OFFICIAL TECHNICAL STAGE VALUATION CERTIFICATE
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white font-serif tracking-tight">
                      VASTHUSILPY ARCHITECTURAL & CIVIL VALUERS
                    </h2>
                    <p className="text-xs text-slate-400">
                      Keralassery, Palakkad District • Reg No: CA/2020/12345
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500">Applicant:</span>
                      <div className="font-bold text-white font-sans text-sm">{activeVerifyProject.clientName}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Building Type:</span>
                      <div className="font-bold text-cyan-300">{activeVerifyProject.buildingType}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Stage Progress:</span>
                      <div className="font-bold text-emerald-400 text-sm">
                        {activeStageCert.progressPercentage}% Completed
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-400 font-bold uppercase">Valuation Summary:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center font-mono">
                        <span className="text-xs text-slate-400">Total Sanctioned Estimate:</span>
                        <span className="font-bold text-white text-sm">₹{activeVerifyProject.grandTotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center font-mono">
                        <span className="text-xs text-slate-400">Stage Certified Valuation:</span>
                        <span className="font-bold text-emerald-400 text-sm">₹{activeStageCert.stageExpenditure.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion Certificate View */}
              {verifySubTab === "completion" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                  {!isProject100PercentStageCompleted(activeVerifyProject) ? (
                    <div className="bg-slate-950 border border-amber-500/50 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-600/60 text-amber-400 flex items-center justify-center mx-auto">
                        <Lock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white font-sans">
                          Completion Certificate Locked
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          According to Kerala Municipality/Panchayat Building Rules (KPBR 2019 / KMBR), the completion certificate can only be issued or viewed when 100% of stage works are completed.
                        </p>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                        Current Work Progress: <strong className="text-amber-400">{activeStageCert.progressPercentage}%</strong>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border-b-2 border-slate-800 pb-5 text-center space-y-1">
                        <div className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                          BUILDING COMPLETION CERTIFICATE
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white font-serif tracking-tight">
                          CERTIFICATE OF STRUCTURAL COMPLETION
                        </h2>
                        <p className="text-xs text-slate-400">
                          As per Rule 22 of Kerala Panchayat Building Rules (KPBR 2019)
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-2xl text-xs text-emerald-300 font-sans leading-relaxed">
                        This is to certify that the construction work for the residential building of Sri/Smt <strong>{activeVerifyProject.clientName}</strong> situated at {activeVerifyProject.houseName}, {activeVerifyProject.panchayatVillage} has been fully completed in accordance with sanctioned KPBR plans.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Estimate BOQ View */}
              {verifySubTab === "estimate" && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white font-mono">Detailed Items of Work (BOQ)</h4>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      Total: ₹{activeVerifyProject.grandTotal.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeVerifyProject.appendices?.map((app, idx) => (
                      <div key={app.id || idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
                        <div className="flex justify-between items-center text-white font-bold mb-2">
                          <span>{app.title}</span>
                          <span className="text-emerald-400">₹{app.totalAmount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Contains {app.items?.length || 0} itemized structural measurements & analysis.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ESTIMATE SECTION 2: ACTIVE ESTIMATE CLIENT LINKS & SEARCH */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <span>Shareable Client Progress Links (Active Estimate Links)</span>
                  <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                    {filteredLinks.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Time-limited access links shared directly with clients via SMS / WhatsApp.
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by client or project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
            </div>

            {/* Links List */}
            {filteredLinks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <Link2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">No Client Links Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the button above to generate a new client progress link.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer"
                >
                  + Generate First Estimate Link
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLinks.map((link) => {
                  const timeInfo = getTimeRemainingFormatted(link.expiresAt, link.status);
                  const isCopied = copiedId === link.id;

                  return (
                    <div
                      key={link.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 transition-all shadow-lg relative group"
                    >
                      {/* Top Row: Client & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-sans">
                              {link.clientName}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${timeInfo.badgeColor}`}>
                              {timeInfo.label}
                            </span>
                          </div>
                          <p className="text-xs text-cyan-300 font-mono truncate max-w-[280px]">
                            {link.estimateProjectName}
                          </p>
                        </div>

                        {/* QR Code Trigger Button */}
                        <button
                          onClick={() => setQrModalLink(link)}
                          className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-cyan-400 hover:text-white transition-colors cursor-pointer"
                          title="View Sharable QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info Chips */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
                        <div>
                          <span className="text-slate-500 block">TOKEN</span>
                          <span className="text-slate-300 font-bold">{link.token}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">VIEWS</span>
                          <span className="text-amber-400 font-bold">{link.viewsCount || 0} times</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">EXPIRES</span>
                          <span className="text-slate-300 truncate block">
                            {new Date(link.expiresAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">SECURITY</span>
                          <span className="text-emerald-400 font-bold">Zero-Login</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copy link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                            <span className="text-[11px]">{isCopied ? "Copied" : "Copy"}</span>
                          </button>

                          <button
                            onClick={() => handleShareWhatsApp(link)}
                            className="p-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Share on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px]">WhatsApp</span>
                          </button>

                          <a
                            href={buildClientShareUrl(link.token)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Live Preview"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[11px]">Preview</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-1">
                          {link.status === "ACTIVE" && !timeInfo.isExpired && (
                            <button
                              onClick={() => handleRevoke(link.id)}
                              className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                              title="Revoke access"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Delete link record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. INVOICE SUB-TAB CONTENT */}
      {/* ========================================================================= */}
      {primarySubTab === "INVOICE" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Banner & Invoice KPIs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    CLIENT INVOICES & ZERO-LOGIN PAYMENTS PORTAL
                  </span>
                </div>

                <h2 className="text-xl md:text-2xl font-black text-white font-sans tracking-tight">
                  Client Invoice & Payment Verification (Invoices View)
                </h2>
                <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                  Invoices, bills, and payment receipts can be shared with clients via link or QR code without requiring login. Accept instant payments via UPI QR.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="px-4 py-2.5 bg-emerald-950 border border-emerald-800/80 rounded-2xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    100% Zero Login Access
                  </span>
                </div>
              </div>
            </div>

            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Total Invoiced Amount</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-bold text-white font-mono">
                    ₹{totalInvoicedAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {invoices.length} INVS
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Total Collected (Paid)</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
                    ₹{totalCollectedAmount.toLocaleString("en-IN")}
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Outstanding Balance Due</span>
                <div className="flex items-center justify-between">
                  <span className={`text-lg sm:text-xl font-bold font-mono ${totalPendingBalance > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    ₹{totalPendingBalance.toLocaleString("en-IN")}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    unpaidInvoicesCount > 0
                      ? "bg-rose-950 text-rose-300 border-rose-800"
                      : "bg-emerald-950 text-emerald-300 border-emerald-800"
                  }`}>
                    {unpaidInvoicesCount} Pending
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-slate-500 block">Direct UPI QR Gateway</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 truncate">7012383137@okbizaxis</span>
                  <QrCode className="w-4 h-4 text-cyan-400 shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INVOICE SUB-SECTIONS NAVIGATION BAR */}
          {/* ========================================================================= */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setInvoiceSubSection("PAYMENT_HISTORY")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                invoiceSubSection === "PAYMENT_HISTORY"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>1. Payment History & Partial Payments</span>
              <span className="text-[10px] bg-slate-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {invoices.reduce((acc, c) => acc + (c.payments?.length || 0), 0)} Logged
              </span>
            </button>

            <button
              onClick={() => setInvoiceSubSection("DIRECTORY")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                invoiceSubSection === "DIRECTORY"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>2. Shareable Invoices List</span>
              <span className="text-[10px] bg-slate-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                {invoices.length} Invoices
              </span>
            </button>

            <button
              onClick={() => setInvoiceSubSection("VERIFICATION")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                invoiceSubSection === "VERIFICATION"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>3. Invoice Verification & Preview Hub</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SUB-SECTION 1: PAYMENT HISTORY & PARTIAL PAYMENTS VIEW */}
          {/* ========================================================================= */}
          {invoiceSubSection === "PAYMENT_HISTORY" && (
            <ClientPaymentHistoryView
              invoices={invoices}
              onRecordPayment={handleRecordPayment}
              onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              onDeletePayment={handleDeletePayment}
            />
          )}

          {/* ========================================================================= */}
          {/* SUB-SECTION 2 & 3: DIRECTORY & VERIFICATION HUBS */}
          {/* ========================================================================= */}
          {invoiceSubSection === "VERIFICATION" && activeVerifyInvoice && (
            <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      INVOICE VERIFICATION & CLIENT VIEW HUB
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white font-sans">
                    Invoice, Billing & Payment Receipt Verification
                  </h3>
                  <p className="text-xs text-slate-400">
                    Any invoice can be directly shared with clients without requiring a login, and payment can be made by scanning the UPI QR code.
                  </p>
                </div>

                {/* Invoice Selector Dropdown */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-slate-950 border border-slate-700 rounded-2xl p-1.5 flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 pl-2">Select Invoice:</span>
                    <select
                      value={selectedVerifyInvoiceId}
                      onChange={(e) => setSelectedVerifyInvoiceId(e.target.value)}
                      className="bg-slate-900 text-emerald-300 font-mono font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          #{inv.invoiceNumber} - {inv.applicantName} (₹{inv.grandTotal.toLocaleString("en-IN")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <a
                    href={invoiceVerificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-mono font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Open full zero-login client invoice portal"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Client View</span>
                  </a>
                </div>
              </div>

              {/* Action Toolbar for Selected Invoice */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">Invoice:</span>
                  <strong className="text-xs font-mono text-emerald-400 font-bold">
                    #{activeVerifyInvoice.invoiceNumber}
                  </strong>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-sans text-white font-bold">
                    {activeVerifyInvoice.applicantName}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      activeVerifyInvoice.paymentStatus === "PAID"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : activeVerifyInvoice.paymentStatus === "PARTIALLY PAID"
                        ? "bg-amber-950 text-amber-300 border-amber-800"
                        : "bg-rose-950 text-rose-300 border-rose-800"
                    }`}
                  >
                    ● {activeVerifyInvoice.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyInvoiceLink(activeVerifyInvoice)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedInvoiceId === activeVerifyInvoice.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>
                      {copiedInvoiceId === activeVerifyInvoice.id ? "Link Copied" : "Copy Shareable Link"}
                    </span>
                  </button>

                  <button
                    onClick={() => setQrModalInvoice(activeVerifyInvoice)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Sharable QR Code</span>
                  </button>

                  <button
                    onClick={() => handleShareInvoiceWhatsApp(activeVerifyInvoice)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Share</span>
                  </button>

                  <button
                    onClick={() => setRecordingPaymentInvoice(activeVerifyInvoice)}
                    className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>

              {/* Invoice Preview Card Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono bg-slate-900 p-5 rounded-2xl border border-slate-800">
                  <div>
                    <span className="text-slate-500">Client / Billed To:</span>
                    <div className="font-bold text-white font-sans text-sm mt-0.5">
                      {activeVerifyInvoice.applicantName}
                    </div>
                    <div className="text-slate-400 text-[11px]">Mob: {activeVerifyInvoice.applicantMobile}</div>
                  </div>

                  <div>
                    <span className="text-slate-500">Project / Description:</span>
                    <div className="font-bold text-cyan-300 font-sans text-xs mt-0.5 truncate">
                      {activeVerifyInvoice.projectTitle || "Architecture & Technical Consultation"}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Due Date: {activeVerifyInvoice.dueDate}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500">Payment Breakdown:</span>
                    <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                      ₹{activeVerifyInvoice.totalPaid.toLocaleString("en-IN")} Paid / ₹{activeVerifyInvoice.grandTotal.toLocaleString("en-IN")}
                    </div>
                    <div className="text-rose-400 text-[11px] font-bold">
                      Balance Due: ₹{activeVerifyInvoice.balanceDue.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-300 uppercase text-[11px] border-b border-slate-800">
                        <th className="p-3">Sl</th>
                        <th className="p-3">Service / Product Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-center">Unit</th>
                        <th className="p-3 text-right">Rate (₹)</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {activeVerifyInvoice.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-900/60">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-sans text-white font-medium">{item.description}</td>
                          <td className="p-3 text-center text-cyan-300 font-bold">{item.quantity}</td>
                          <td className="p-3 text-center text-slate-400">{item.unit}</td>
                          <td className="p-3 text-right">₹{item.rate.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-right font-bold text-emerald-400">
                            ₹{item.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Instant UPI QR & Payment Status Strip */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>OFFICIAL UPI QR PAYMENT LINKED</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Clients can open this invoice link and pay instantly via GPay, PhonePe, or Paytm.
                    </p>
                    <div className="text-xs font-mono text-cyan-300">
                      UPI ID: {activeVerifyInvoice.upiId || "7012383137@okbizaxis"}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQrModalInvoice(activeVerifyInvoice)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>View Sharable QR Code</span>
                    </button>

                    <button
                      onClick={() => setSelectedInvoiceModal(activeVerifyInvoice)}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-mono font-black flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Full Invoice Document</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* INVOICE SECTION 2: INVOICES DIRECTORY & ZERO-LOGIN SHARING */}
          {/* ========================================================================= */}
          {invoiceSubSection === "DIRECTORY" && (
            <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <span>Shareable Invoices List (Invoices & Payments Directory)</span>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    {filteredInvoices.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Copy the client link or QR code of any invoice to share with anyone (no login required).
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search invoice or client..."
                    value={invoiceSearchTerm}
                    onChange={(e) => setInvoiceSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-56"
                  />
                </div>

                <select
                  value={invoiceStatusFilter}
                  onChange={(e) => setInvoiceStatusFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Payments</option>
                  <option value="UNPAID">Unpaid Only</option>
                  <option value="PARTIALLY PAID">Partially Paid</option>
                  <option value="PAID">Paid in Full</option>
                </select>
              </div>
            </div>

            {/* Invoices Grid Cards */}
            {filteredInvoices.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                  <Receipt className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-300">No Invoices Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No invoices match the selected filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInvoices.map((inv) => {
                  const isCopied = copiedInvoiceId === inv.id;

                  return (
                    <div
                      key={inv.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 transition-all shadow-lg relative group"
                    >
                      {/* Top Row: Client & Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-sans">
                              {inv.applicantName}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                inv.paymentStatus === "PAID"
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                  : inv.paymentStatus === "PARTIALLY PAID"
                                  ? "bg-amber-950 text-amber-300 border-amber-800"
                                  : "bg-rose-950 text-rose-300 border-rose-800"
                              }`}
                            >
                              ● {inv.paymentStatus}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-300 font-mono">
                            #{inv.invoiceNumber} • {inv.projectTitle || "Architecture Plan & Survey"}
                          </p>
                        </div>

                        {/* QR Code Modal Trigger Button */}
                        <button
                          onClick={() => setQrModalInvoice(inv)}
                          className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-emerald-400 hover:text-white transition-colors cursor-pointer"
                          title="Generate Sharable QR Code for this Invoice"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info Chips */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/70 p-3 rounded-2xl border border-slate-800/60">
                        <div>
                          <span className="text-slate-500 block">TOTAL AMOUNT</span>
                          <span className="text-white font-bold">
                            ₹{inv.grandTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">BALANCE DUE</span>
                          <span className={inv.balanceDue > 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                            ₹{inv.balanceDue.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">INVOICE DATE</span>
                          <span className="text-slate-300">{inv.invoiceDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">ACCESS</span>
                          <span className="text-emerald-400 font-bold">Zero-Login</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleCopyInvoiceLink(inv)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copy zero-login client link"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                            <span className="text-[11px]">{isCopied ? "Copied" : "Copy Link"}</span>
                          </button>

                          <button
                            onClick={() => handleShareInvoiceWhatsApp(inv)}
                            className="p-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Share invoice on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="text-[11px]">WhatsApp</span>
                          </button>

                          <a
                            href={`/?invoice_share=${inv.id || inv.invoiceNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Open zero-login client portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-[11px]">Client View</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRecordingPaymentInvoice(inv)}
                            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer"
                            title="Record offline/online payment"
                          >
                            Pay
                          </button>

                          <button
                            onClick={() => setSelectedInvoiceModal(inv)}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="View full invoice details modal"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {/* 1. New Estimate Link Modal */}
      <NewClientLinkModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        estimateProjects={estimateProjects}
        onCreated={(newLink) => {
          setShareLinks([newLink, ...shareLinks]);
          setQrModalLink(newLink);
        }}
      />

      {/* 2. Estimate Sharable QR Code Modal */}
      <ClientLinkQrModal
        isOpen={Boolean(qrModalLink)}
        onClose={() => setQrModalLink(null)}
        shareLink={qrModalLink}
      />

      {/* 3. Invoice Sharable QR Code Modal */}
      <ClientInvoiceQrModal
        isOpen={Boolean(qrModalInvoice)}
        onClose={() => setQrModalInvoice(null)}
        invoice={qrModalInvoice}
      />

      {/* 4. Invoice Detail Modal */}
      {selectedInvoiceModal && (
        <InvoiceDetailModal
          isOpen={Boolean(selectedInvoiceModal)}
          onClose={() => setSelectedInvoiceModal(null)}
          invoice={selectedInvoiceModal}
          onOpenRecordPayment={(inv, paymentToEdit) => {
            setRecordingPaymentInvoice(inv || selectedInvoiceModal);
            setEditingPayment(paymentToEdit || null);
          }}
          onDeletePayment={handleDeletePayment}
          onUpdateInvoice={(upd) => setSelectedInvoiceModal(upd)}
          onOpenPaymentModal={(inv) => {
            setRecordingPaymentInvoice(inv);
            setEditingPayment(null);
          }}
        />
      )}

      {/* 5. Record Payment Modal */}
      {recordingPaymentInvoice && (
        <RecordPaymentModal
          isOpen={Boolean(recordingPaymentInvoice)}
          onClose={() => {
            setRecordingPaymentInvoice(null);
            setEditingPayment(null);
          }}
          invoice={recordingPaymentInvoice}
          paymentToEdit={editingPayment}
          onRecordPayment={handleRecordPayment}
        />
      )}
    </div>
  );
};
