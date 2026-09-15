import React, { useState, useEffect } from "react";
import { CrmProject, Invoice, PaymentRecord, OfficeDashboardTabType } from "../../../types";
import { INITIAL_CRM_PROJECTS, INITIAL_INVOICES } from "../../../data/crmData";
import { db } from "../../../lib/firebase";
import { collection, onSnapshot, setDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { broadcastMessage, getBroadcastChannel } from "../../../utils/broadcastSync";
import {
  getDeletedProjectIds,
  addDeletedProjectId,
  getDeletedInvoiceIds,
  addDeletedInvoiceId,
  loadCrmProjects,
  saveCrmProjects,
  loadInvoices,
  saveInvoices,
  isDemoOrPurgedInvoice,
  safeSetDoc,
  safeDeleteInvoice,
  fetchServerCrmProjects,
  saveCrmProjectToServer,
  deleteCrmProjectFromServer,
  syncCrmProjectsWithServer,
  fetchServerInvoices,
  saveInvoiceToServer,
  deleteInvoiceFromServer,
  syncInvoicesWithServer
} from "../../../utils/storageManager";
import { ProjectsListView } from "./ProjectsListView";
import { ProjectDetailModal } from "./ProjectDetailModal";
import { NewProjectModal } from "./NewProjectModal";
import { EditProjectModal } from "./EditProjectModal";
import { ShareProjectModal } from "./ShareProjectModal";
import { ProjectActivityHistoryView } from "./ProjectActivityHistoryView";
import { InvoicesListView } from "../invoices/InvoicesListView";
import { InvoiceDetailModal } from "../invoices/InvoiceDetailModal";
import { NewEditInvoiceModal } from "../invoices/NewEditInvoiceModal";
import { RecordPaymentModal } from "../invoices/RecordPaymentModal";
import { ProductsServicesView } from "./ProductsServicesView";
import { CustomersView } from "./CustomersView";
import { ReportsView } from "./ReportsView";
import { ClientViewTab } from "../clientView/ClientViewTab";
import { OfflineBackupRestoreModal } from "./OfflineBackupRestoreModal";
import { TasksManagementView } from "./TasksManagementView";
import { OnlineApplicationsTab } from "./OnlineApplicationsTab";
import { EstimateProject } from "../../../data/estimateData";
import { useLanguage } from "../../../context/LanguageContext";
import { triggerAppNotification } from "../../../context/NotificationContext";
import { FolderKanban, Receipt, AlertTriangle, Plus, CreditCard, ShieldAlert, History, Box, Users, BarChart3, Eye, Database, ListTodo, FileText, Layers } from "lucide-react";


interface VasthusilpyCrmTabProps {
  activeTab?: OfficeDashboardTabType;
  setActiveTab?: (tab: OfficeDashboardTabType) => void;
  estimateProjects?: EstimateProject[];
}

export const VasthusilpyCrmTab: React.FC<VasthusilpyCrmTabProps> = ({
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab,
  estimateProjects
}) => {
  const { t } = useLanguage();

  // Internal tab state if external prop is not provided
  const [internalTab, setInternalTab] = useState<OfficeDashboardTabType>("office_crm_projects");
  const currentTab = externalActiveTab || internalTab;

  const handleTabSwitch = (tab: OfficeDashboardTabType) => {
    if (externalSetActiveTab) {
      externalSetActiveTab(tab);
    } else {
      setInternalTab(tab);
    }
  };

  // CRM Projects State initialized from localStorage with deleted IDs filtered
  const [projects, setProjects] = useState<CrmProject[]>(() => {
    return loadCrmProjects();
  });

  // Invoices State initialized from localStorage with deleted IDs filtered
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    return loadInvoices();
  });

  // Real-Time Storage & Cloud Listener: Sync Projects across all logins & devices
  useEffect(() => {
    let isMounted = true;
    let unsubProjects = () => {};
    let unsubInvoices = () => {};

    // 1. Fetch authoritative projects and invoices from server backend
    fetchServerCrmProjects().then((serverProjects) => {
      if (!isMounted) return;
      if (serverProjects && serverProjects.length > 0) {
        setProjects(serverProjects);
        saveCrmProjects(serverProjects, false);
      } else {
        const localProjects = loadCrmProjects();
        if (localProjects && localProjects.length > 0) {
          syncCrmProjectsWithServer(localProjects);
        }
      }
    });

    fetchServerInvoices().then((serverInvoices) => {
      if (!isMounted) return;
      if (serverInvoices && serverInvoices.length > 0) {
        setInvoices(serverInvoices);
        saveInvoices(serverInvoices, false);
      } else {
        const localInvoices = loadInvoices();
        if (localInvoices && localInvoices.length > 0) {
          syncInvoicesWithServer(localInvoices);
        }
      }
    });

    // 2. Cloud Firestore Real-Time listener (if reachable)
    if (db) {
      try {
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

              setProjects((prev) => {
                if (JSON.stringify(prev) === JSON.stringify(remoteProjects)) return prev;
                return remoteProjects;
              });
              try {
                saveCrmProjects(remoteProjects, false);
              } catch (e) {
                console.error(e);
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
      } catch (e) {
        // Offline safe fallback
      }
    }

    return () => {
      isMounted = false;
      unsubProjects();
      unsubInvoices();
    };
  }, []);

  // Save updated projects to localStorage, sync to server backend, and Firestore
  const updateProjectsState = (newProjects: CrmProject[], changedProject?: CrmProject | CrmProject[]) => {
    setProjects(newProjects);
    try {
      localStorage.setItem("vasthusilpy_crm_projects", JSON.stringify(newProjects));
    } catch (e) {
      console.error("Failed to save projects to localStorage", e);
    }
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));

    broadcastMessage({ type: "SYNC_PROJECTS", data: newProjects });

    // Durable sync to server backend
    if (changedProject) {
      const targets = Array.isArray(changedProject) ? changedProject : [changedProject];
      targets.forEach((proj) => {
        saveCrmProjectToServer(proj).catch((err) =>
          console.warn("Server save project error:", err)
        );
        safeSetDoc(doc(db, "projects", proj.id), proj, { merge: true }).catch((err) =>
          console.warn("Firestore setDoc project error:", err)
        );
      });
    } else {
      syncCrmProjectsWithServer(newProjects).catch(() => {});
    }
  };

  // Save updated invoices to localStorage, sync to server backend, and Firestore
  const updateInvoicesState = (newInvoices: Invoice[], changedInvoice?: Invoice | Invoice[]) => {
    setInvoices(newInvoices);
    try {
      localStorage.setItem("vasthusilpy_invoices", JSON.stringify(newInvoices));
    } catch (e) {
      console.error("Failed to save invoices to localStorage", e);
    }
    window.dispatchEvent(new Event("vasthusilpy_storage_update"));

    broadcastMessage({ type: "SYNC_INVOICES", data: newInvoices });

    // Durable sync to server backend
    if (changedInvoice) {
      const targets = Array.isArray(changedInvoice) ? changedInvoice : [changedInvoice];
      targets.forEach((inv) => {
        saveInvoiceToServer(inv).catch((err) =>
          console.warn("Server save invoice error:", err)
        );
        safeSetDoc(doc(db, "invoices", inv.id), inv, { merge: true }).catch((err) =>
          console.warn("Firestore setDoc invoice error:", err)
        );
      });
    } else {
      syncInvoicesWithServer(newInvoices).catch(() => {});
    }
  };

  // Listen to external conversions (e.g. from Estimate tab or cross-tab BroadcastChannel)
  useEffect(() => {
    const handleStorageUpdate = () => {
      const deletedIds = getDeletedProjectIds();
      try {
        const savedProjects = localStorage.getItem("vasthusilpy_crm_projects");
        if (savedProjects) {
          const parsed = JSON.parse(savedProjects);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((p: CrmProject) => !deletedIds.includes(p.id));
            setProjects((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(filtered)) return prev;
              return filtered;
            });
          }
        }
        const savedInvoices = localStorage.getItem("vasthusilpy_invoices");
        if (savedInvoices) {
          const parsed = JSON.parse(savedInvoices);
          if (Array.isArray(parsed)) {
            setInvoices((prev) => {
              if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
              return parsed;
            });
          }
        }
      } catch (err) {
        console.error("Storage sync error in CRM tab", err);
      }
    };

    window.addEventListener("vasthusilpy_storage_update", handleStorageUpdate);

    const bc = getBroadcastChannel();
    let onMessageCleanup: (() => void) | null = null;
    if (bc) {
      const handleBroadcast = (e: MessageEvent) => {
        if (e.data?.type === "SYNC_PROJECTS" && Array.isArray(e.data.data)) {
          const incoming: CrmProject[] = e.data.data;
          setProjects((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(incoming)) return prev;
            return incoming;
          });
        } else if (e.data?.type === "SYNC_INVOICES" && Array.isArray(e.data.data)) {
          const incomingInv: Invoice[] = e.data.data;
          setInvoices((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(incomingInv)) return prev;
            return incomingInv;
          });
        } else {
          handleStorageUpdate();
        }
      };

      bc.addEventListener("message", handleBroadcast);
      onMessageCleanup = () => {
        bc.removeEventListener("message", handleBroadcast);
      };
    }

    return () => {
      window.removeEventListener("vasthusilpy_storage_update", handleStorageUpdate);
      if (onMessageCleanup) onMessageCleanup();
    };
  }, []);

  // Modals State
  const [isBackupRestoreModalOpen, setIsBackupRestoreModalOpen] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<CrmProject | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<CrmProject | null>(null);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState<boolean>(false);
  const [sharingProject, setSharingProject] = useState<CrmProject | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<CrmProject | null>(null);

  // Invoice Modals State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDetailModalOpen, setIsInvoiceDetailModalOpen] = useState<boolean>(false);
  const [isNewEditInvoiceModalOpen, setIsNewEditInvoiceModalOpen] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [defaultInvoiceProjectId, setDefaultInvoiceProjectId] = useState<string>("");
  const [recordingPaymentInvoice, setRecordingPaymentInvoice] = useState<Invoice | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState<boolean>(false);

  // Requirement #2: Completion Constraint Modal State
  const [completionBlockedProject, setCompletionBlockedProject] = useState<CrmProject | null>(null);
  const [completionBlockedReason, setCompletionBlockedReason] = useState<"NO_INVOICE" | "UNPAID_INVOICE" | null>(null);

  // Project Completion Validator
  const validateAndHandleStatusChange = (project: CrmProject, targetStatus: string): boolean => {
    if (targetStatus !== "COMPLETED") return true;

    // Find linked invoice
    const linkedInvoice = invoices.find(
      (inv) => inv.projectId === project.id || (project.invoiceId && inv.id === project.invoiceId)
    );

    if (!linkedInvoice && !project.invoiceId) {
      setCompletionBlockedProject(project);
      setCompletionBlockedReason("NO_INVOICE");
      return false;
    }

    return true;
  };

  // Project Handlers
  const handleUpdateProject = (updated: CrmProject): boolean => {
    const original = projects.find((p) => p.id === updated.id);

    // If status changed to COMPLETED, validate that invoice/bill is created
    if (updated.status === "COMPLETED") {
      if (original && original.status !== "COMPLETED") {
        const allowed = validateAndHandleStatusChange(updated, "COMPLETED");
        if (!allowed) return false;
      }
    }

    const updatedProjects = projects.map((p) => (p.id === updated.id ? updated : p));
    updateProjectsState(updatedProjects, updated);

    if (selectedProject?.id === updated.id) {
      setSelectedProject(updated);
    }

    if (original && original.status !== updated.status) {
      triggerAppNotification(
        "PROJECT_STATUS",
        "Project Status Updated",
        `Project #${updated.id} (${updated.title}) status changed from ${original.status} to ${updated.status}`,
        { projectId: updated.id }
      );
    }

    return true;
  };

  const onRequestDeleteProject = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (target) {
      setProjectToDelete(target);
    }
  };

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    const idToDelete = projectToDelete.id;

    addDeletedProjectId(idToDelete);

    const remaining = projects.filter((p) => p.id !== idToDelete);
    updateProjectsState(remaining);
    deleteCrmProjectFromServer(idToDelete).catch(() => {});
    deleteDoc(doc(db, "projects", idToDelete)).catch((err) =>
      console.warn("Firestore deleteDoc error:", err)
    );

    if (selectedProject?.id === idToDelete) {
      setSelectedProject(null);
      setIsDetailModalOpen(false);
    }
    if (editingProject?.id === idToDelete) {
      setEditingProject(null);
      setIsEditProjectModalOpen(false);
    }
    setProjectToDelete(null);
  };

  const handleReloadProjects = async () => {
    try {
      const serverProjects = await fetchServerCrmProjects();
      if (serverProjects && serverProjects.length > 0) {
        updateProjectsState(serverProjects);
        return;
      }
      const deletedIds = getDeletedProjectIds();
      const snap = await getDocs(collection(db, "projects"));
      if (!snap.empty) {
        const remoteProjects: CrmProject[] = [];
        snap.forEach((d) => {
          const data = d.data() as CrmProject;
          if (data && data.id && !deletedIds.includes(data.id)) {
            remoteProjects.push(data);
          }
        });
        updateProjectsState(remoteProjects);
        return;
      }
    } catch (e) {
      console.warn("Failed to query projects on reload", e);
    }
  };

  const handleCreateProject = (newProj: CrmProject, initialInvoice?: Invoice) => {
    const updatedProjects = [newProj, ...projects];
    updateProjectsState(updatedProjects, newProj);
    if (initialInvoice) {
      handleSaveInvoice(initialInvoice);
    }
  };

  // Invoice Handlers
  const handleSaveInvoice = (savedInvoice: Invoice) => {
    let updatedInvoices: Invoice[];
    const exists = invoices.some((inv) => inv.id === savedInvoice.id);
    if (exists) {
      updatedInvoices = invoices.map((inv) => (inv.id === savedInvoice.id ? savedInvoice : inv));
    } else {
      updatedInvoices = [savedInvoice, ...invoices];
    }
    updateInvoicesState(updatedInvoices, savedInvoice);

    // If invoice is linked to a project, link back to project invoiceId
    if (savedInvoice.projectId) {
      let modifiedProject: CrmProject | undefined;
      const updatedProjects = projects.map((proj) => {
        if (proj.id === savedInvoice.projectId) {
          modifiedProject = {
            ...proj,
            invoiceId: savedInvoice.id,
            activities: [
              {
                id: `act_${Date.now()}`,
                actor: "SYSTEM",
                action: `Created/Updated Invoice #${savedInvoice.invoiceNumber}`,
                timestamp: new Date().toLocaleString()
              },
              ...proj.activities
            ]
          };
          return modifiedProject;
        }
        return proj;
      });
      if (modifiedProject) {
        updateProjectsState(updatedProjects, modifiedProject);
      }
    }

    if (selectedInvoice?.id === savedInvoice.id) {
      setSelectedInvoice(savedInvoice);
    }
  };

  const handleDeleteInvoice = (idToDelete: string) => {
    const { remainingInvoices, remainingProjects } = safeDeleteInvoice(idToDelete);
    updateInvoicesState(remainingInvoices);
    updateProjectsState(remainingProjects);
    deleteInvoiceFromServer(idToDelete).catch(() => {});
    if (selectedInvoice?.id === idToDelete) {
      setSelectedInvoice(null);
      setIsInvoiceDetailModalOpen(false);
    }
    triggerAppNotification(
      "INVOICE_GENERATED",
      "Invoice Deleted",
      `Invoice was deleted successfully.`,
      { invoiceId: idToDelete }
    );
  };

  const handleRecordPayment = (
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

  // Helper to trigger invoice creation for a specific project
  const handleOpenCreateInvoiceForProject = (projId: string) => {
    setDefaultInvoiceProjectId(projId);
    setEditingInvoice(null);
    setIsNewEditInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Subtab Navigation Switcher Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleTabSwitch("office_crm_projects")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              currentTab === "office_crm_projects" || currentTab === "office_crm"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>{t("tab_projects", "Projects Pipeline")}</span>
            <span className="ml-1 bg-slate-900/60 text-slate-200 px-2 py-0.5 rounded-full text-[10px]">
              {projects.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch("office_online_applications")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              currentTab === "office_online_applications" || (currentTab as string) === "online_applications_directory"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t("tab_online_applications", "Online Applications & Login Directory")}</span>
            <span className="ml-1 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
              PORTAL
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch("office_application_types")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              currentTab === "office_application_types" || (currentTab as string) === "online_applications_types"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Applications Type</span>
          </button>

          <button
            onClick={() => handleTabSwitch("office_tasks")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              currentTab === "office_tasks"
                ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>{t("tab_tasks", "Tasks & Sub-tasks")}</span>
          </button>

          <button
            onClick={() => handleTabSwitch("office_activities")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer ${
              currentTab === "office_activities"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t("tab_activity", "Activity History")}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* OFFLINE BACKUP & RESTORE BUTTON */}
          <button
            type="button"
            onClick={() => setIsBackupRestoreModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-cyan-800/80 hover:border-cyan-400 text-cyan-300 rounded-2xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-cyan-950/40"
            title="Backup or Restore CRM projects, invoices, and estimate data offline"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Offline Backup & Restore</span>
            <span className="sm:hidden">Backup</span>
          </button>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* RENDER CONTENT BASED ON TAB */}
      {currentTab === "office_online_applications" || (currentTab as string) === "online_applications_directory" ? (
        <OnlineApplicationsTab initialSubTab="directory" />
      ) : currentTab === "office_application_types" || (currentTab as string) === "online_applications_types" ? (
        <OnlineApplicationsTab initialSubTab="types" />
      ) : currentTab === "office_tasks" ? (
        <TasksManagementView />
      ) : currentTab === "office_activities" ? (
        <ProjectActivityHistoryView
          projects={projects}
          onSelectProject={(proj) => {
            setSelectedProject(proj);
            setIsDetailModalOpen(true);
          }}
        />
      ) : (
        <ProjectsListView
          projects={projects}
          invoices={invoices}
          onSelectProject={(proj) => {
            setSelectedProject(proj);
            setIsDetailModalOpen(true);
          }}
          onUpdateProject={handleUpdateProject}
          onEditProject={(proj) => {
            setEditingProject(proj);
            setIsEditProjectModalOpen(true);
          }}
          onDeleteProject={onRequestDeleteProject}
          onShareProject={(proj) => {
            setSharingProject(proj);
            setIsShareModalOpen(true);
          }}
          onReloadProjects={handleReloadProjects}
          onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
          onRecordPaymentForInvoice={(inv) => {
            setRecordingPaymentInvoice(inv);
            setIsRecordPaymentModalOpen(true);
          }}
          onCreateInvoiceForProject={(proj) => {
            handleOpenCreateInvoiceForProject(proj.id);
          }}
          onSelectInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsInvoiceDetailModalOpen(true);
          }}
          onEditInvoice={(inv) => {
            setEditingInvoice(inv);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onDeleteInvoice={handleDeleteInvoice}
          onOpenBackupRestore={() => setIsBackupRestoreModalOpen(true)}
        />
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          project={selectedProject}
          invoices={invoices}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={onRequestDeleteProject}
          onShareProject={(proj) => {
            setSharingProject(proj);
            setIsShareModalOpen(true);
          }}
          onEditProject={(proj) => {
            setIsDetailModalOpen(false);
            setEditingProject(proj);
            setIsEditProjectModalOpen(true);
          }}
          onRecordPaymentForInvoice={(inv) => {
            setRecordingPaymentInvoice(inv);
            setIsRecordPaymentModalOpen(true);
          }}
          onCreateInvoiceForProject={(proj) => {
            handleOpenCreateInvoiceForProject(proj.id);
          }}
          onSelectInvoice={(inv) => {
            setSelectedInvoice(inv);
            setIsInvoiceDetailModalOpen(true);
          }}
          onEditInvoice={(inv) => {
            setEditingInvoice(inv);
            setIsNewEditInvoiceModalOpen(true);
          }}
          onDeleteInvoice={handleDeleteInvoice}
        />
      )}

      {/* Share Project Modal */}
      {sharingProject && (
        <ShareProjectModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          project={sharingProject}
        />
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
        invoices={invoices}
      />

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditProjectModalOpen}
        onClose={() => setIsEditProjectModalOpen(false)}
        project={editingProject}
        onUpdateProject={handleUpdateProject}
        onDeleteProject={onRequestDeleteProject}
      />

      {/* New / Edit Invoice Modal */}
      <NewEditInvoiceModal
        isOpen={isNewEditInvoiceModalOpen}
        onClose={() => {
          setIsNewEditInvoiceModalOpen(false);
          setEditingInvoice(null);
        }}
        invoiceToEdit={editingInvoice}
        projects={projects}
        defaultProjectId={defaultInvoiceProjectId}
        onSaveInvoice={(savedInv, options) => {
          handleSaveInvoice(savedInv);
          if (!options?.keepOpen) {
            setIsNewEditInvoiceModalOpen(false);
            setEditingInvoice(null);
            setSelectedInvoice(savedInv);
            setIsInvoiceDetailModalOpen(true);
            triggerAppNotification(
              "INVOICE_GENERATED",
              "Invoice Saved",
              `Invoice #${savedInv.invoiceNumber} saved! PDF preview loaded with payment recording, WhatsApp sharing, and print options.`,
              { invoiceId: savedInv.id }
            );
          }
        }}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={isInvoiceDetailModalOpen}
        onClose={() => setIsInvoiceDetailModalOpen(false)}
        invoice={selectedInvoice}
        onOpenRecordPayment={(inv, paymentToEdit) => {
          setRecordingPaymentInvoice(inv);
          setEditingPayment(paymentToEdit || null);
          setIsRecordPaymentModalOpen(true);
        }}
        onDeletePayment={handleDeletePayment}
        onDuplicateInvoice={handleDuplicateInvoice}
        onMarkAsSent={handleMarkAsSent}
        onEditInvoice={(inv) => {
          setEditingInvoice(inv);
          setIsNewEditInvoiceModalOpen(true);
        }}
        onDeleteInvoice={handleDeleteInvoice}
      />

      {/* Record Payment Modal */}
      {recordingPaymentInvoice && (
        <RecordPaymentModal
          isOpen={isRecordPaymentModalOpen}
          onClose={() => {
            setIsRecordPaymentModalOpen(false);
            setEditingPayment(null);
          }}
          invoice={recordingPaymentInvoice}
          paymentToEdit={editingPayment}
          onRecordPayment={handleRecordPayment}
        />
      )}

      {/* Requirement #2 Constraint Enforcement Warning Modal */}
      {completionBlockedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-800/80 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider">
                Project Completion Blocked
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Project <strong className="text-white">"{completionBlockedProject.title}"</strong> cannot be marked as <span className="text-emerald-400 font-bold font-mono">COMPLETED</span> yet.
              </p>

              {completionBlockedReason === "NO_INVOICE" ? (
                <div className="bg-amber-950/50 border border-amber-800/80 rounded-2xl p-3 text-xs text-amber-300 font-sans">
                  An official invoice must be created for this project and payment recorded before marking it completed.
                </div>
              ) : (
                <div className="bg-amber-950/50 border border-amber-800/80 rounded-2xl p-3 text-xs text-amber-300 font-sans">
                  The linked invoice has an outstanding unpaid balance. Full payment must be recorded before marking the project completed.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 font-mono text-xs">
              <button
                onClick={() => {
                  setCompletionBlockedProject(null);
                  setCompletionBlockedReason(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer font-bold transition-colors"
              >
                Cancel
              </button>

              {completionBlockedReason === "NO_INVOICE" ? (
                <button
                  onClick={() => {
                    const projId = completionBlockedProject.id;
                    setCompletionBlockedProject(null);
                    setCompletionBlockedReason(null);
                    handleOpenCreateInvoiceForProject(projId);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Invoice Now</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const linkedInv = invoices.find(
                      (i) => i.projectId === completionBlockedProject.id || i.id === completionBlockedProject.invoiceId
                    );
                    setCompletionBlockedProject(null);
                    setCompletionBlockedReason(null);
                    if (linkedInv) {
                      setRecordingPaymentInvoice(linkedInv);
                      setIsRecordPaymentModalOpen(true);
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-800/80 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-white font-sans uppercase tracking-wider">
                Delete CRM Project?
              </h3>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">"{projectToDelete.title}"</strong> (<span className="font-mono text-cyan-400">#{projectToDelete.id}</span>)?
              </p>
              <p className="text-[11px] text-red-400 font-mono font-semibold">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black shadow-lg shadow-red-600/30 cursor-pointer transition-colors"
              >
                Yes, Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Offline Backup & Restore Modal */}
      <OfflineBackupRestoreModal
        isOpen={isBackupRestoreModalOpen}
        onClose={() => setIsBackupRestoreModalOpen(false)}
        onRestoreSuccess={() => {
          setProjects(loadCrmProjects());
          setInvoices(loadInvoices());
        }}
      />
    </div>
  );
};
