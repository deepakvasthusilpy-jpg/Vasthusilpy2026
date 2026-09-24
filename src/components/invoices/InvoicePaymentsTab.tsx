import React, { useState, useEffect } from "react";
import { Invoice, InvoicesTabType, CrmProject, PaymentRecord } from "../../types";
import { db } from "../../lib/firebase";
import { collection, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";
import {
  getDeletedInvoiceIds,
  addDeletedInvoiceId,
  getDeletedProjectIds,
  loadInvoices,
  saveInvoices,
  loadCrmProjects,
  isDemoOrPurgedInvoice,
  safeSetDoc,
  safeDeleteInvoice
} from "../../utils/storageManager";
import { InvoicesListView } from "../office/invoices/InvoicesListView";
import { InvoiceDetailModal } from "../office/invoices/InvoiceDetailModal";
import { NewEditInvoiceModal } from "../office/invoices/NewEditInvoiceModal";
import { RecordPaymentModal } from "../office/invoices/RecordPaymentModal";
import { PaymentReceiptDispatchModal } from "../office/invoices/PaymentReceiptDispatchModal";
import { ProductsServicesView } from "../office/crm/ProductsServicesView";
import { CustomersView } from "../office/crm/CustomersView";
import { ReportsView } from "../office/crm/ReportsView";
import { OfflineBackupRestoreModal } from "../office/crm/OfflineBackupRestoreModal";
import { PersonalBillsDashboard } from "../personalBills/PersonalBillsDashboard";
import { EstimateProject } from "../../data/estimateData";
import { useLanguage } from "../../context/LanguageContext";
import { triggerAppNotification } from "../../context/NotificationContext";
import { uploadInvoicePdfToGoogleDrive } from "../../utils/googleDriveStorage";
import {
  Receipt,
  Box,
  Users,
  BarChart3,
  Eye,
  Plus,
  Database,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  PiggyBank,
  Sparkles
} from "lucide-react";

interface InvoicePaymentsTabProps {
  activeTab?: InvoicesTabType;
  setActiveTab?: (tab: InvoicesTabType) => void;
  estimateProjects?: EstimateProject[];
}

export const InvoicePaymentsTab: React.FC<InvoicePaymentsTabProps> = ({
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  estimateProjects
}) => {
  const { t } = useLanguage();

  const [internalTab, setInternalTab] = useState<InvoicesTabType>("invoices_list");
  const currentTab = externalActiveTab || internalTab;

  const handleTabSwitch = (tab: InvoicesTabType) => {
    if (externalSetActiveTab) {
      externalSetActiveTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // Invoices State initialized from localStorage with deleted IDs filtered
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadInvoices();
  });

  // Projects State for customer linking and project metadata
  const [projects, setProjects] = useState<CrmProject[]>(() => {
    return loadCrmProjects();
  });

  // Real-time synchronization & Storage Listener for Invoices & Projects
  useEffect(() => {
    let isMounted = true;
    let unsubInvoices = () => {};
    let unsubProjects = () => {};

    if (db) {
      try {
        unsubInvoices = onSnapshot(
          collection(db, "invoices"),
          (snapshot) => {
            if (!isMounted) return;
            const deletedInvoiceIds = getDeletedInvoiceIds();
            const deletedProjectIds = getDeletedProjectIds();
            if (!snapshot.empty) {
              const remoteInvoices: Invoice[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as Invoice;
                if (data && data.id && !deletedInvoiceIds.includes(data.id) && !isDemoOrPurgedInvoice(data)) {
                  if (data.projectId && deletedProjectIds.includes(data.projectId)) {
                    remoteInvoices.push({ ...data, projectId: undefined });
                  } else {
                    remoteInvoices.push(data);
                  }
                }
              });

              setInvoices((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(remoteInvoices)) return prev;
                return remoteInvoices;
              });
              try {
                saveInvoices(remoteInvoices, false);
              } catch (e) {
                console.error(e);
              }
            }
          },
          () => {
            // Offline fallback
          }
        );

        unsubProjects = onSnapshot(
          collection(db, "projects"),
          (snapshot) => {
            if (!isMounted) return;
            const deletedIds = getDeletedProjectIds();
            if (!snapshot.empty) {
              const remoteProjects: CrmProject[] = [];
              snapshot.forEach((d) => {
                const data = d.data() as CrmProject;
                if (data && data.id && !deletedIds.includes(data.id)) {
                  remoteProjects.push(data);
                }
              });
              setProjects(remoteProjects);
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

    const handleStorageUpdate = () => {
      setInvoices(loadInvoices());
      setProjects(loadCrmProjects());
    };
    window.addEventListener("vasthusilpy_storage_update", handleStorageUpdate);
    window.addEventListener("vasthusilpy_invoices_updated", handleStorageUpdate);

    return () => {
      isMounted = false;
      unsubInvoices();
      unsubProjects();
      window.removeEventListener("vasthusilpy_storage_update", handleStorageUpdate);
      window.removeEventListener("vasthusilpy_invoices_updated", handleStorageUpdate);
    };
  }, []);

  // Modal States
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isNewEditInvoiceModalOpen, setIsNewEditInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [defaultInvoiceProjectId, setDefaultInvoiceProjectId] = useState<string>("");

  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [recordingPaymentInvoice, setRecordingPaymentInvoice] = useState<Invoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  const [receiptDispatchState, setReceiptDispatchState] = useState<{
    isOpen: boolean;
    invoice: Invoice | null;
    paymentRecord?: any;
  } | null>(null);

  const [isBackupRestoreModalOpen, setIsBackupRestoreModalOpen] = useState(false);

  // Helper to save & sync invoices to Firestore & localStorage
  const updateInvoicesState = (newInvoices: Invoice[], modifiedInvoice?: Invoice) => {
    setInvoices(newInvoices);
    saveInvoices(newInvoices);

    if (modifiedInvoice) {
      safeSetDoc(doc(db, "invoices", modifiedInvoice.id), modifiedInvoice, { merge: true }).catch((err) =>
        console.warn("Firestore setDoc invoice error:", err)
      );
    }
  };

  const handleSaveInvoice = (invoiceToSave: Invoice, options?: { keepOpen?: boolean }) => {
    let updatedInvoices: Invoice[];
    const exists = invoices.some((i) => i.id === invoiceToSave.id);

    if (exists) {
      updatedInvoices = invoices.map((i) => (i.id === invoiceToSave.id ? invoiceToSave : i));
    } else {
      updatedInvoices = [invoiceToSave, ...invoices];
    }

    updateInvoicesState(updatedInvoices, invoiceToSave);

    // Automatically backup / upload invoice PDF to Google Drive cloud storage in background
    uploadInvoicePdfToGoogleDrive(invoiceToSave)
      .then((driveRes) => {
        if (driveRes.success && driveRes.webViewLink) {
          const syncedInvoice: Invoice = {
            ...invoiceToSave,
            googleDriveFileId: driveRes.fileId,
            googleDriveUrl: driveRes.webViewLink,
            googleDriveFolderId: driveRes.folderId,
            googleDriveSyncedAt: new Date().toISOString()
          };
          setInvoices((prev) => prev.map((inv) => (inv.id === syncedInvoice.id ? syncedInvoice : inv)));
          saveInvoices(invoices.map((inv) => (inv.id === syncedInvoice.id ? syncedInvoice : inv)));
          safeSetDoc(doc(db, "invoices", syncedInvoice.id), syncedInvoice, { merge: true }).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("Background Google Drive auto-sync notice:", err);
      });

    if (options?.keepOpen) {
      setEditingInvoice(invoiceToSave);
    } else {
      setIsNewEditInvoiceModalOpen(false);
      setEditingInvoice(null);
      setDefaultInvoiceProjectId("");
      setIsInvoiceDetailModalOpen(false);
      setSelectedInvoice(null);
      handleTabSwitch("invoices_list");
    }

    triggerAppNotification(
      "INVOICE_GENERATED",
      exists ? "Invoice Updated" : "Invoice Created",
      `Invoice #${invoiceToSave.invoiceNumber} for ${invoiceToSave.applicantName} saved successfully.${invoiceToSave.googleDriveUrl ? " Synced to Google Drive." : ""}`,
      { invoiceId: invoiceToSave.id }
    );
  };

  const handleDeleteInvoice = (id: string) => {
    const { remainingInvoices, remainingProjects } = safeDeleteInvoice(id);
    setInvoices(remainingInvoices);
    setProjects(remainingProjects);

    if (selectedInvoice?.id === id) {
      setSelectedInvoice(null);
      setIsInvoiceDetailModalOpen(false);
    }
  };

  const handleSavePayment = (
    invoiceId: string,
    paymentData: Omit<PaymentRecord, "id" | "createdAt"> & { id?: string }
  ) => {
    let modifiedInvoice: Invoice | undefined;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id !== invoiceId) return inv;

      let updatedPayments: PaymentRecord[];
      if (paymentData.id) {
        // Edit existing payment record
        updatedPayments = (inv.payments || []).map((p) =>
          p.id === paymentData.id
            ? {
                ...p,
                ...paymentData,
                id: p.id,
                createdAt: p.createdAt || new Date().toISOString()
              }
            : p
        );
      } else {
        // Add new payment record
        const newPaymentRecord: PaymentRecord = {
          ...paymentData,
          id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString()
        };
        updatedPayments = [newPaymentRecord, ...(inv.payments || [])];
      }

      const updatedTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
      const updatedBalanceDue = Math.max(0, inv.grandTotal - updatedTotalPaid);

      let paymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID" = "UNPAID";
      if (updatedTotalPaid >= inv.grandTotal && inv.grandTotal > 0) {
        paymentStatus = "PAID";
      } else if (updatedTotalPaid > 0) {
        paymentStatus = "PARTIALLY PAID";
      }

      const updatedInvoice: Invoice = {
        ...inv,
        payments: updatedPayments,
        totalPaid: updatedTotalPaid,
        balanceDue: updatedBalanceDue,
        paymentStatus
      };

      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(updatedInvoice);
      }

      modifiedInvoice = updatedInvoice;
      return updatedInvoice;
    });

    updateInvoicesState(updatedInvoices, modifiedInvoice);

    if (modifiedInvoice) {
      triggerAppNotification(
        "INVOICE_GENERATED",
        paymentData.id ? "Payment Updated" : "Payment Recorded",
        `₹${paymentData.amount.toLocaleString("en-IN")} ${paymentData.id ? "updated" : "received"} for Invoice #${modifiedInvoice.invoiceNumber}`,
        { invoiceId: modifiedInvoice.id }
      );

      // Automatically pop open receipt modal only when recording a brand new payment
      if (!paymentData.id) {
        setReceiptDispatchState({
          isOpen: true,
          invoice: modifiedInvoice,
          paymentRecord: paymentData
        });
      }
    }
  };

  const handleDeletePayment = (invoiceId: string, paymentId: string) => {
    let modifiedInvoice: Invoice | undefined;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id !== invoiceId) return inv;

      const updatedPayments = (inv.payments || []).filter((p) => p.id !== paymentId);
      const updatedTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
      const updatedBalanceDue = Math.max(0, inv.grandTotal - updatedTotalPaid);

      let paymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID" = "UNPAID";
      if (updatedTotalPaid >= inv.grandTotal && inv.grandTotal > 0) {
        paymentStatus = "PAID";
      } else if (updatedTotalPaid > 0) {
        paymentStatus = "PARTIALLY PAID";
      }

      const updatedInvoice: Invoice = {
        ...inv,
        payments: updatedPayments,
        totalPaid: updatedTotalPaid,
        balanceDue: updatedBalanceDue,
        paymentStatus
      };

      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(updatedInvoice);
      }

      modifiedInvoice = updatedInvoice;
      return updatedInvoice;
    });

    updateInvoicesState(updatedInvoices, modifiedInvoice);

    if (modifiedInvoice) {
      triggerAppNotification(
        "INVOICE_GENERATED",
        "Payment Deleted",
        `Payment record removed. Balance due for Invoice #${modifiedInvoice.invoiceNumber} is now ₹${modifiedInvoice.balanceDue.toLocaleString("en-IN")}.`,
        { invoiceId: modifiedInvoice.id }
      );
    }
  };

  const handleDuplicateInvoice = (invoiceToDup: Invoice) => {
    const duplicated: Invoice = {
      ...invoiceToDup,
      id: `inv_${Date.now()}`,
      invoiceNumber: `${Math.floor(220 + Math.random() * 80)}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      payments: [],
      totalPaid: 0,
      balanceDue: invoiceToDup.grandTotal,
      paymentStatus: "UNPAID",
      createdAt: new Date().toISOString().split("T")[0]
    };
    handleSaveInvoice(duplicated);
    setSelectedInvoice(duplicated);
    triggerAppNotification(
      "INVOICE_GENERATED",
      "Invoice Duplicated",
      `Invoice #${duplicated.invoiceNumber} created as a copy of #${invoiceToDup.invoiceNumber}`,
      { invoiceId: duplicated.id }
    );
  };

  const handleMarkAsSent = (invoiceId: string) => {
    const today = new Date().toISOString().split("T")[0];
    let modified: Invoice | undefined;
    const updated = invoices.map((inv) => {
      if (inv.id === invoiceId) {
        modified = {
          ...inv,
          lastSentDate: today
        };
        return modified;
      }
      return inv;
    });
    if (modified) {
      updateInvoicesState(updated, modified);
      if (selectedInvoice?.id === invoiceId) {
        setSelectedInvoice(modified);
      }
      triggerAppNotification(
        "INVOICE_GENERATED",
        "Invoice Marked as Sent",
        `Invoice #${modified.invoiceNumber} marked as sent to ${modified.applicantName}`,
        { invoiceId: modified.id }
      );
    }
  };

  // Normalization for active sub-tab matching
  const isTabActive = (tabKey: "invoices_list" | "products_services" | "customers" | "reports_analysis" | "client_view" | "personal_bills") => {
    if (tabKey === "invoices_list") {
      return currentTab === "invoices_list" || currentTab === "office_invoices";
    }
    if (tabKey === "products_services") {
      return currentTab === "products_services" || currentTab === "office_products";
    }
    if (tabKey === "customers") {
      return currentTab === "customers" || currentTab === "office_customers";
    }
    if (tabKey === "reports_analysis") {
      return currentTab === "reports_analysis" || currentTab === "office_reports";
    }
    if (tabKey === "client_view") {
      return currentTab === "client_view" || currentTab === "office_client_view";
    }
    if (tabKey === "personal_bills") {
      return (
        currentTab === "personal_bills" ||
        currentTab === "staff_salary" ||
        currentTab === "poov_mala" ||
        currentTab === "poov_mala_bill" ||
        currentTab === "kseb_bills" ||
        currentTab === "kseb_bill" ||
        currentTab === "health_insurance" ||
        currentTab === "rd_accounts" ||
        currentTab === "rd_deposit" ||
        currentTab === "panchayath_bills" ||
        currentTab === "licence_panchayath" ||
        currentTab === "panchayath_fees" ||
        currentTab === "all_vendors" ||
        currentTab === "all_vendors_bills" ||
        currentTab === "personal_vendors"
      );
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab 1: Invoices & Payments */}
          <button
            onClick={() => handleTabSwitch("invoices_list")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              isTabActive("invoices_list")
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{t("tab_invoices", "Invoices & Receipts")}</span>
            <span className="ml-1 bg-slate-900/60 text-slate-200 px-2 py-0.5 rounded-full text-[10px]">
              {invoices.length}
            </span>
          </button>

          {/* Sub-tab 2: @products and services@ */}
          <button
            onClick={() => handleTabSwitch("products_services")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              isTabActive("products_services")
                ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{t("tab_products", "@Products & Services@")}</span>
          </button>

          {/* Sub-tab 3: customers */}
          <button
            onClick={() => handleTabSwitch("customers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              isTabActive("customers")
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t("tab_customers", "Customers")}</span>
          </button>

          {/* Sub-tab 4: reports and analysis */}
          <button
            onClick={() => handleTabSwitch("reports_analysis")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              isTabActive("reports_analysis")
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-slate-950 shadow-lg shadow-indigo-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t("tab_reports", "Reports & Analysis")}</span>
          </button>

          {/* Sub-tab 5: Personal Bills & Expenses */}
          <button
            onClick={() => handleTabSwitch("personal_bills")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              isTabActive("personal_bills")
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Wallet className="w-4 h-4 text-purple-300" />
            <span>{t("tab_personal_bills", "Personal Bills & Payments")}</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* OFFLINE BACKUP & RESTORE BUTTON */}
          <button
            type="button"
            onClick={() => setIsBackupRestoreModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md"
            title="Backup or Restore data offline"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Backup & Restore</span>
          </button>

          {/* Quick Create Invoice Action */}
          {isTabActive("invoices_list") && (
            <button
              onClick={() => {
                setDefaultInvoiceProjectId("");
                setEditingInvoice(null);
                setIsNewEditInvoiceModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB CONTENTS */}
      {isTabActive("invoices_list") ? (
        <InvoicesListView
          invoices={invoices}
          onSelectInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsInvoiceDetailModalOpen(true);
          }}
          onOpenNewInvoiceModal={() => {
            setDefaultInvoiceProjectId("");
            setEditingInvoice(null);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onOpenRecordPaymentModal={(inv, paymentToEdit) => {
            setRecordingPaymentInvoice(inv);
            setEditingPayment(paymentToEdit || null);
            setIsRecordPaymentModalOpen(true);
          }}
          onEditInvoice={(inv) => {
            setEditingInvoice(inv);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onDeleteInvoice={handleDeleteInvoice}
        />
      ) : isTabActive("products_services") ? (
        <ProductsServicesView />
      ) : isTabActive("customers") ? (
        <CustomersView projects={projects} invoices={invoices} />
      ) : isTabActive("reports_analysis") ? (
        <ReportsView invoices={invoices} projects={projects} />
      ) : isTabActive("personal_bills") ? (
        <PersonalBillsDashboard
          initialSubTab={
            currentTab === "kseb_bills" || currentTab === "kseb_bill"
              ? "kseb_bills"
              : currentTab === "health_insurance"
              ? "health_insurance"
              : currentTab === "rd_accounts" || currentTab === "rd_deposit"
              ? "rd_accounts"
              : currentTab === "panchayath_bills" || currentTab === "licence_panchayath" || currentTab === "panchayath_fees"
              ? "licence_panchayath"
              : currentTab === "all_vendors" || currentTab === "all_vendors_bills" || currentTab === "personal_vendors"
              ? "all_vendors"
              : "poov_mala"
          }
        />
      ) : (
        <InvoicesListView
          invoices={invoices}
          onSelectInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsInvoiceDetailModalOpen(true);
          }}
          onOpenNewInvoiceModal={() => {
            setDefaultInvoiceProjectId("");
            setEditingInvoice(null);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onOpenRecordPaymentModal={(inv, paymentToEdit) => {
            setRecordingPaymentInvoice(inv);
            setEditingPayment(paymentToEdit || null);
            setIsRecordPaymentModalOpen(true);
          }}
          onEditInvoice={(inv) => {
            setEditingInvoice(inv);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onDeleteInvoice={handleDeleteInvoice}
        />
      )}

      {/* Invoice Detail Modal (with Print, Share, UPI QR, Payments Breakdown) */}
      {selectedInvoice && (
        <InvoiceDetailModal
          isOpen={isInvoiceDetailModalOpen}
          onClose={() => setIsInvoiceDetailModalOpen(false)}
          invoice={selectedInvoice}
          onOpenRecordPayment={(inv, paymentToEdit) => {
            setRecordingPaymentInvoice(inv || selectedInvoice);
            setEditingPayment(paymentToEdit || null);
            setIsRecordPaymentModalOpen(true);
          }}
          onEditInvoice={() => {
            setEditingInvoice(selectedInvoice);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onDuplicateInvoice={() => handleDuplicateInvoice(selectedInvoice)}
          onMarkAsSent={() => handleMarkAsSent(selectedInvoice.id)}
          onDeleteInvoice={() => handleDeleteInvoice(selectedInvoice.id)}
          onDeletePayment={(invoiceId, paymentId) => handleDeletePayment(invoiceId, paymentId)}
          onUpdateInvoice={(updatedInv) => {
            setSelectedInvoice(updatedInv);
            setInvoices((prev) => prev.map((inv) => (inv.id === updatedInv.id ? updatedInv : inv)));
            saveInvoices(invoices.map((inv) => (inv.id === updatedInv.id ? updatedInv : inv)));
            safeSetDoc(doc(db, "invoices", updatedInv.id), updatedInv, { merge: true }).catch(() => {});
          }}
        />
      )}

      {/* New / Edit Invoice Modal */}
      <NewEditInvoiceModal
        isOpen={isNewEditInvoiceModalOpen}
        onClose={() => {
          setIsNewEditInvoiceModalOpen(false);
          setEditingInvoice(null);
          setDefaultInvoiceProjectId("");
        }}
        onSaveInvoice={handleSaveInvoice}
        invoiceToEdit={editingInvoice}
        projects={projects}
        defaultProjectId={defaultInvoiceProjectId}
      />

      {/* Record Payment Modal */}
      {recordingPaymentInvoice && (
        <RecordPaymentModal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => {
            setIsRecordPaymentModalOpen(false);
            setRecordingPaymentInvoice(null);
            setEditingPayment(null);
          }}
          invoice={recordingPaymentInvoice}
          paymentToEdit={editingPayment}
          onRecordPayment={(invoiceId, payment) => handleSavePayment(invoiceId, payment)}
        />
      )}

      {/* Payment Receipt & Closed Invoice Dispatch Modal */}
      {receiptDispatchState?.isOpen && receiptDispatchState.invoice && (
        <PaymentReceiptDispatchModal
          isOpen={receiptDispatchState.isOpen}
          onClose={() => setReceiptDispatchState(null)}
          invoice={receiptDispatchState.invoice}
          paymentRecord={receiptDispatchState.paymentRecord}
          onUpdateInvoice={(updatedInv) => {
            handleSaveInvoice(updatedInv);
          }}
          onViewInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsInvoiceDetailModalOpen(true);
            setReceiptDispatchState(null);
          }}
        />
      )}

      {/* Offline Backup & Restore Modal */}
      <OfflineBackupRestoreModal
        isOpen={isBackupRestoreModalOpen}
        onClose={() => setIsBackupRestoreModalOpen(false)}
        projects={projects}
        invoices={invoices}
        onImportSuccess={() => {
          setInvoices(loadInvoices());
          setProjects(loadCrmProjects());
          setIsBackupRestoreModalOpen(false);
        }}
      />
    </div>
  );
};
