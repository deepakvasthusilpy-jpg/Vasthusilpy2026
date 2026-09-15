import React, { useState } from "react";
import { MainSectionType, TabType, ThachuRow, SurveyTabType } from "./types";
import { THACHU_DATA } from "./data/thachuShastraData";
import { useAuth } from "./context/AuthContext";
import { useViewMode } from "./context/ViewModeContext";
import { LoginPage } from "./components/auth/LoginPage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MobileViewToolbar, SmartphoneNotch } from "./components/common/MobileViewToolbar";
import { CalculatorTab } from "./components/CalculatorTab";
import { SideFinderTab } from "./components/SideFinderTab";
import { TwoSidePerimeterVasthuTab } from "./components/vasthu/TwoSidePerimeterVasthuTab";
import { AIVastuAuditTab } from "./components/aiAgent/AIVastuAuditTab";
import { FullTableTab } from "./components/FullTableTab";
import { AttachmentTab } from "./components/AttachmentTab";
import { GuideTab } from "./components/GuideTab";
import { RowDetailModal } from "./components/RowDetailModal";

// Building Rules Components
import { AIKpbrRulesTab } from "./components/aiAgent/AIKpbrRulesTab";
import { RuleSearchTab } from "./components/buildingRules/RuleSearchTab";
import { OccupanciesTab } from "./components/buildingRules/OccupanciesTab";
import { BuildingSetbackCalcTab } from "./components/buildingRules/BuildingSetbackCalcTab";
import { CalculatorsTab } from "./components/buildingRules/CalculatorsTab";
import { KsmartTab } from "./components/buildingRules/KsmartTab";
import { KsmartDashboard } from "./components/ksmart/KsmartDashboard";

// Survey Components
import { MissingSideCalculator } from "./components/survey/MissingSideCalculator";
import { LandAreaCalculator } from "./components/survey/LandAreaCalculator";
import { SurveyConvertersTab } from "./components/survey/SurveyConvertersTab";
import { AISurveyFmbTab } from "./components/aiAgent/AISurveyFmbTab";

// Civil Engineering Components
import { BrickMasonryCalculator } from "./components/civil/BrickMasonryCalculator";
import { ConcreteBlockCalculator } from "./components/civil/ConcreteBlockCalculator";
import { CementConcreteCalculator } from "./components/civil/CementConcreteCalculator";
import { StructuralQuantityBbsCalculator } from "./components/civil/StructuralQuantityBbsCalculator";

// Estimate & Quantity Survey Components
import { EstimateDashboard } from "./components/estimate/EstimateDashboard";
import { EstimateSheetTab } from "./components/estimate/EstimateSheetTab";
import { StageCompletionCertificateTab } from "./components/estimate/StageCompletionCertificateTab";
import { ItemsOfWorkTab } from "./components/estimate/ItemsOfWorkTab";
import { EngineerSealsTab } from "./components/estimate/EngineerSealsTab";
import { ValuationTab } from "./components/estimate/valuation/ValuationTab";
import { AIEstimateBoqTab } from "./components/aiAgent/AIEstimateBoqTab";
import { ReadOnlyEstimateVerificationPortal } from "./components/estimate/ReadOnlyEstimateVerificationPortal";
import { PublicAgreementVerificationPortal } from "./components/construction/PublicAgreementVerificationPortal";
import { ClientProgressPortal } from "./components/office/clientView/ClientProgressPortal";
import { ClientInvoicePortal } from "./components/office/clientView/ClientInvoicePortal";
import { PublicCadSharePortal } from "./components/home/dataStorage/PublicCadSharePortal";
import { PublicPlanVerificationPortal } from "./components/planTemplate/PublicPlanVerificationPortal";
import { HomePage } from "./components/home/HomePage";
import { SmoothTransition } from "./components/common/SmoothTransition";
import {
  INITIAL_ESTIMATES_LIST,
  EstimateProject,
  loadSavedEstimates,
  saveEstimates,
  generateUniqueEstimateNumber,
  deepCloneEstimateProject,
  createNewBlankEstimateProject
} from "./data/estimateData";
import { safeDeleteEstimate, getDeletedEstimateIds, safeSetDoc, shouldPurgeClient, shouldRenameClient, addDeletedEstimateId } from "./utils/storageManager";
import { convertEstimateToCrmProject, convertEstimateToInvoice } from "./utils/estimateConverter";
import { initializeAutoSyncService } from "./utils/webDataSyncManager";
import { db } from "./lib/firebase";
import { collection, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";

// Office Dashboard Components
import { QuotationModule } from "./components/quotation/QuotationModule";
import { OfficeDashboard } from "./components/office/OfficeDashboard";
import { OnlineApplicationsTab } from "./components/office/crm/OnlineApplicationsTab";
import { InvoicePaymentsTab } from "./components/invoices/InvoicePaymentsTab";
import { OfficeDashboardTabType, InvoicesTabType, ConstructionTabType } from "./types";

// Construction Works Master Component
import { ConstructionDashboard } from "./components/construction/ConstructionDashboard";

// Personal Bills and Payments Master Component
import { PersonalBillsDashboard } from "./components/personalBills/PersonalBillsDashboard";
import { PersonalBillsTabType } from "./types";

import {
  Compass,
  ShieldCheck,
  Building2,
  MapPin,
  HardHat,
  Wallet,
  Bot,
  Calculator,
  Ruler,
  Table,
  FileText,
  BookOpen,
  ArrowRightLeft,
  Search,
  Layers,
  Cpu
} from "lucide-react";

export default function App() {
  const {
    user,
    emailUser,
    loading,
    authorized,
    isPrimaryAdmin,
    isExpiredSubscription,
    subscriptionRequests,
    signOutUser
  } = useAuth();
  const {
    viewMode,
    isMobileView,
    isSimulatedMobileOnDesktop,
    phonePreset,
    isForcedDesktopOnMobile
  } = useViewMode();
  const isAuthenticated = (!!user || !!emailUser) && authorized;

  const getInitialRoute = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, "?"));
      const sec = (urlParams.get("section") || hashParams.get("section")) as MainSectionType;
      const tab = (urlParams.get("tab") || hashParams.get("tab")) as TabType;
      if (sec && sec !== ("panchangam" as MainSectionType) && sec !== ("application_forms" as MainSectionType)) {
        if (sec === ("online_applications" as MainSectionType)) {
          return {
            section: "office_dashboard" as MainSectionType,
            tab: "office_online_applications" as TabType
          };
        }
        const safeTab = tab === ("online_applications_forms" as TabType) || (typeof tab === "string" && tab.startsWith("application_forms_"))
          ? undefined
          : tab;
        return {
          section: sec,
          tab:
            safeTab ||
            (sec === "ai_agent"
              ? ("ai_agent_chat" as TabType)
              : sec === "vasthu"
              ? ("calculator" as TabType)
              : sec === "office_dashboard"
              ? ("office_crm_projects" as TabType)
              : sec === "invoices_payments"
              ? ("invoices_list" as TabType)
              : sec === "estimate"
              ? ("estimate_dashboard" as TabType)
              : sec === "building_rules"
              ? ("rules_ai_chat" as TabType)
              : sec === "ksmart"
              ? ("rules_ksmart" as TabType)
              : sec === "survey"
              ? ("missing_side" as TabType)
              : sec === "civil"
              ? ("material_quantity_bbs" as TabType)
              : sec === "construction_works"
              ? ("construction_dashboard" as TabType)
              : sec === "quotation"
              ? ("quotation_dashboard" as TabType)
              : sec === "online_applications"
              ? ("online_applications_directory" as TabType)
              : sec === "personal_bills"
              ? ("poov_mala_bill" as TabType)
              : ("home_overview" as TabType))
        };
      }
    } catch {
      // Fallback
    }
    return { section: "home" as MainSectionType, tab: "home_overview" as TabType };
  };

  const initialRoute = getInitialRoute();
  const [activeSection, setActiveSection] = useState<MainSectionType>(initialRoute.section);
  const [activeTab, setActiveTab] = useState<TabType>(initialRoute.tab);
  const [selectedRowModal, setSelectedRowModal] = useState<ThachuRow | null>(null);

  // Estimate Section State with persistence and Firestore sync
  const [estimateProjects, setEstimateProjects] = useState<EstimateProject[]>(() => {
    const loaded = loadSavedEstimates();
    return loaded && loaded.length > 0 ? loaded : [];
  });
  const [selectedEstimateProject, setSelectedEstimateProject] = useState<EstimateProject>(() => {
    const loaded = loadSavedEstimates();
    return loaded && loaded.length > 0 ? loaded[0] : createNewBlankEstimateProject();
  });

  // Real-time Firestore Sync for Estimates & Storage Listener
  React.useEffect(() => {
    let isMounted = true;
    let unsubEstimates = () => {};

    if (db) {
      try {
        unsubEstimates = onSnapshot(
          collection(db, "estimates"),
          (snapshot) => {
            if (!isMounted) return;
            if (!snapshot.empty) {
              const deletedIds = getDeletedEstimateIds();
              const remote: EstimateProject[] = [];
              snapshot.forEach((d) => {
                let data = d.data() as EstimateProject;
                if (data && data.id && !deletedIds.includes(data.id)) {
                  if (shouldPurgeClient(data.clientName)) {
                    addDeletedEstimateId(data.id);
                    if (db) deleteDoc(doc(db, "estimates", data.id)).catch(() => {});
                    return;
                  }
                  if (shouldRenameClient(data.clientName)) {
                    data = {
                      ...data,
                      clientName: "Client 1",
                      headlineNarrative: (data.headlineNarrative || "")
                        .replace(/1\.\s*DASAN\s*2\.\s*PREETHA(\s*\(Copy\))?/gi, "Client 1")
                        .replace(/DASAN(\s*(&|and)?\s*PREETHA)?/gi, "Client 1")
                    };
                    safeSetDoc(doc(db, "estimates", data.id), { clientName: "Client 1" }, { merge: true }).catch(() => {});
                  }
                  remote.push(data);
                }
              });
              if (remote.length > 0) {
                setEstimateProjects((prev) => {
                  const prevMap = new Map<string, EstimateProject>(prev.map((p) => [p.id, p]));
                  remote.forEach((r) => prevMap.set(r.id, r));
                  const merged = Array.from(prevMap.values()).filter((p) => !deletedIds.includes(p.id));
                  saveEstimates(merged);
                  return merged;
                });
              }
            }
          },
          () => {
            // Offline fallback mode
          }
        );
      } catch (e) {
        // Safe offline fallback
      }
    }

    // Initialize Online Auto Sync Background Service
    const cleanupAutoSync = initializeAutoSyncService();

    const handleStorageUpdate = () => {
      const reloaded = loadSavedEstimates();
      setEstimateProjects(reloaded);
    };
    window.addEventListener("vasthusilpy_storage_update", handleStorageUpdate);

    return () => {
      isMounted = false;
      unsubEstimates();
      cleanupAutoSync();
      window.removeEventListener("vasthusilpy_storage_update", handleStorageUpdate);
    };
  }, []);

  const handleUpdateEstimateProject = (updated: EstimateProject) => {
    setEstimateProjects((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      saveEstimates(next);
      return next;
    });
    setSelectedEstimateProject(updated);

    // Sync to Firestore if available
    if (db) {
      safeSetDoc(doc(db, "estimates", updated.id), updated, { merge: true }).catch(() => {});
    }
  };

  const handleCreateNewEstimate = () => {
    const newId = generateUniqueEstimateNumber(estimateProjects);
    const newProject = createNewBlankEstimateProject(newId, "New Client", 1500);
    setEstimateProjects((prev) => {
      const next = [newProject, ...prev];
      saveEstimates(next);
      return next;
    });
    setSelectedEstimateProject(newProject);
    if (db) {
      safeSetDoc(doc(db, "estimates", newProject.id), newProject, { merge: true }).catch(() => {});
    }
    setActiveSection("estimate");
    setActiveTab("estimate_sheet");
  };

  const handleDeleteEstimateProject = (id: string) => {
    safeDeleteEstimate(id);
    setEstimateProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      saveEstimates(filtered);
      if (selectedEstimateProject.id === id && filtered.length > 0) {
        setSelectedEstimateProject(filtered[0]);
      }
      return filtered;
    });
    if (db) {
      deleteDoc(doc(db, "estimates", id)).catch(() => {});
    }
  };

  const handleDuplicateEstimateProject = (sourceProj: EstimateProject) => {
    const newId = generateUniqueEstimateNumber(estimateProjects, sourceProj.id);
    const duplicated = deepCloneEstimateProject(sourceProj, newId);
    setEstimateProjects((prev) => {
      const next = [duplicated, ...prev.filter((p) => p.id !== duplicated.id)];
      saveEstimates(next);
      return next;
    });
    setSelectedEstimateProject(duplicated);
    if (db) {
      safeSetDoc(doc(db, "estimates", duplicated.id), duplicated, { merge: true }).catch(() => {});
    }
  };


  const handleConvertToProject = (proj: EstimateProject) => {
    convertEstimateToCrmProject(proj);
    setActiveSection("office_dashboard");
    setActiveTab("office_crm_projects");
  };

  const handleConvertToInvoice = (proj: EstimateProject) => {
    convertEstimateToInvoice(proj);
    setActiveSection("invoices_payments");
    setActiveTab("invoices_list");
  };

  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleSelectRow = (row: ThachuRow) => {
    setSelectedRowModal(row);
  };

  const handleAskAIAboutRule = (ruleText: string) => {
    setActiveSection("building_rules");
    setActiveTab("rules_ai_chat");
  };

  // Public Verification, Client Progress & Invoice Link Handling (100% Zero Login, No Authentication Required)
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
  
  const clientViewToken =
    urlParams.get("client_view") ||
    urlParams.get("client_share") ||
    urlParams.get("token") ||
    urlParams.get("portal") ||
    urlParams.get("client") ||
    urlParams.get("cview") ||
    hashParams.get("client_view") ||
    hashParams.get("token") ||
    hashParams.get("portal");

  const invoiceShareId =
    urlParams.get("invoice_share") ||
    urlParams.get("invoice_view") ||
    urlParams.get("invoiceId") ||
    urlParams.get("inv") ||
    urlParams.get("receipt") ||
    hashParams.get("invoice_share") ||
    hashParams.get("invoiceId") ||
    hashParams.get("inv");

  const verifyId =
    urlParams.get("verify") ||
    urlParams.get("estimateId") ||
    urlParams.get("id") ||
    hashParams.get("verify") ||
    hashParams.get("estimateId");
  const verifyHash = urlParams.get("hash") || hashParams.get("hash") || undefined;
  const verifyTabRaw = (urlParams.get("tab") || hashParams.get("tab") || "").toLowerCase();
  const verifyTab =
    verifyTabRaw === "stage" || verifyTabRaw === "completion" || verifyTabRaw === "engineer" || verifyTabRaw === "estimate"
      ? (verifyTabRaw as "estimate" | "stage" | "completion" | "engineer")
      : undefined;

  const verifyAgreementToken =
    urlParams.get("verify_agreement") ||
    urlParams.get("agreement_token") ||
    urlParams.get("agreement_verify") ||
    urlParams.get("agreement") ||
    hashParams.get("verify_agreement") ||
    hashParams.get("agreement_token") ||
    hashParams.get("agreement");

  // Public Zero-Login Building Plan QR Verification & PDF Download Portal
  const isPlanVerify =
    urlParams.get("verify_plan") ||
    urlParams.get("plan_verify") ||
    urlParams.get("plan_id") ||
    (urlParams.get("verify") === "1" && (urlParams.get("projId") || urlParams.get("dwg"))) ||
    (urlParams.get("verify") === "plan") ||
    hashParams.get("verify_plan") ||
    hashParams.get("plan_verify") ||
    (typeof window !== "undefined" && window.location.hash.includes("verify-plan"));

  if (isPlanVerify) {
    return (
      <PublicPlanVerificationPortal
        onGoToApp={() => {
          window.location.href = window.location.origin;
        }}
      />
    );
  }

  const cadShareToken =
    urlParams.get("cad_share") ||
    urlParams.get("cad_id") ||
    urlParams.get("share_cad") ||
    urlParams.get("drawing_share") ||
    urlParams.get("cad_token") ||
    urlParams.get("share_file") ||
    hashParams.get("cad_share") ||
    hashParams.get("cad_id") ||
    hashParams.get("share_cad");

  // 0. Public CAD Drawing & Blueprint Share Portal (Zero Login, QR & Direct Link Verification)
  if (cadShareToken) {
    return (
      <PublicCadSharePortal
        token={cadShareToken}
        onGoToApp={() => {
          window.location.href = window.location.origin;
        }}
      />
    );
  }

  // 1. Public Construction Agreement Verification Portal (Zero Login, QR Verification)
  if (verifyAgreementToken) {
    return (
      <PublicAgreementVerificationPortal
        token={verifyAgreementToken}
        onGoToLogin={() => {
          window.location.href = window.location.origin;
        }}
      />
    );
  }

  // 2. Client View Invoice & Payment Portal (Zero Login, Direct Client Access)
  if (invoiceShareId) {
    return (
      <ClientInvoicePortal
        invoiceId={invoiceShareId}
        invoiceNumber={invoiceShareId}
      />
    );
  }

  // 3. Client View Progress Portal (Zero Login, Time-Limited, Read-Only Client Access)
  if (clientViewToken) {
    return (
      <ClientProgressPortal
        token={clientViewToken}
        estimateProjects={estimateProjects}
      />
    );
  }

  // 4. Estimate & Stage Certificate Verification Portal (Zero Login Public Authenticity Verification)
  if (verifyId) {
    return (
      <ReadOnlyEstimateVerificationPortal
        verifyId={verifyId}
        verifyHash={verifyHash}
        initialTab={verifyTab}
        estimateProjects={estimateProjects}
      />
    );
  }

  // Auth Guard: Show Login Page if not signed in or not authorized
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Expired Subscription Guard (Shows full-screen renewal & reassurance of zero data loss)
  // SubscriptionExpiredScreen removed as subscription system is decommissioned.

  return (
    <div
      id="app-root-wrapper"
      className={`relative min-h-screen bg-gradient-to-b from-[#0e021a] via-[#1f0530] to-[#420a34] text-slate-100 font-sans antialiased selection:bg-purple-500 selection:text-white ${
        isSimulatedMobileOnDesktop
          ? "flex flex-col bg-slate-950 overflow-x-auto"
          : isForcedDesktopOnMobile
          ? "flex flex-col min-w-[1200px] overflow-x-auto"
          : "flex flex-col overflow-x-clip"
      }`}
    >
      {/* Ambient Twilight Glow & Stars Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/3 w-[800px] h-[450px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-20 w-[600px] h-[400px] bg-pink-600/10 rounded-full blur-[130px]" />
        <div className="absolute -bottom-20 left-10 w-[700px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-blueprint-grid opacity-30" />
      </div>

      {/* Top Mobile View Toolbar (for Simulator / Forced Desktop) */}
      <MobileViewToolbar />

      <div
        className={`relative z-10 flex flex-1 w-full ${
          isSimulatedMobileOnDesktop
            ? "justify-center items-start px-2 sm:px-6 py-6"
            : isForcedDesktopOnMobile
            ? "min-w-[1200px]"
            : ""
        }`}
      >
        {/* Left Collapsible Sidebar */}
        <Sidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalRows={THACHU_DATA.length}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
        />

        {/* Main Container / Smartphone Shell */}
        <div
          className={`relative z-10 flex flex-col transition-all duration-300 ${
            isSimulatedMobileOnDesktop
              ? `w-full ${
                  phonePreset === "390"
                    ? "max-w-[390px]"
                    : phonePreset === "414"
                    ? "max-w-[414px]"
                    : phonePreset === "430"
                    ? "max-w-[430px]"
                    : "max-w-md"
                } rounded-[48px] border-[10px] border-slate-900 shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_0_2px_rgba(255,255,255,0.15)] bg-gradient-to-b from-[#0e021a] via-[#1f0530] to-[#420a34] overflow-hidden my-2 ring-1 ring-slate-700/60 min-h-[860px]`
              : "flex-1 min-w-0 min-h-screen"
          }`}
        >
          {/* Top Smartphone Dynamic Island Notch in simulator */}
          {isSimulatedMobileOnDesktop && <SmartphoneNotch presetWidth={phonePreset} />}

          {/* Header with Dual Section Navigation */}
          <Header
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            totalRows={THACHU_DATA.length}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          />

        {/* Main Content Area */}
        <main
          className={`flex-1 w-full mx-auto px-4 py-6 md:py-8 space-y-6 transition-all duration-300 ${
            activeTab === "estimate_sheet" ||
            activeSection === "invoices_payments" ||
            activeSection === "office_dashboard" ||
            (activeSection as string) === "online_applications"
              ? "max-w-[1920px] 2xl:px-8"
              : "max-w-7xl"
          }`}
        >
            <div key={activeSection + "_" + activeTab} className="space-y-6 animate-fade-in-up">
              {/* HOME SECTION */}
              {activeSection === "home" && (
            <HomePage
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onNavigate={(section, tab) => {
                setActiveSection(section);
                setActiveTab(tab);
              }}
            />
          )}

          {/* VASTHU SECTION */}
          {activeSection === "vasthu" && (
            <div className="space-y-6">
              {/* Vasthu Sub-navigation Bar */}
              <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("calculator")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "calculator"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-cyan-300" />
                    <span>Vasthu Calculator</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("agent")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "agent"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-950 border border-cyan-400/40"
                        : "text-cyan-400 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/20"
                    }`}
                  >
                    <Bot className="w-4 h-4 text-cyan-300 animate-pulse" />
                    <span>AI Vasthu Agent</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/30 text-cyan-200 font-mono text-[10px] font-bold border border-cyan-400/50">
                      AI
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("side_finder")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "side_finder"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4 text-cyan-300" />
                    <span>Optimal Side Finder</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("perimeter_vasthu")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "perimeter_vasthu"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Ruler className="w-4 h-4 text-cyan-300" />
                    <span>2-Side Perimeter Vastu</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("table")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "table"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Table className="w-4 h-4 text-cyan-300" />
                    <span>Full Dimensions Table</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("room_dimensions")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "room_dimensions"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Compass className="w-4 h-4 text-cyan-300" />
                    <span>മുറികളുടെ അളവുകൾ (Room Measurements)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("attachment")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "attachment"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <FileText className="w-4 h-4 text-cyan-300" />
                    <span>Vedic Manuscript</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("guide")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "guide"
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <BookOpen className="w-4 h-4 text-cyan-300" />
                    <span>Thachu Shastra Guide</span>
                  </button>
                </div>
              </div>

              {activeTab === "calculator" && (
                <CalculatorTab
                  onSelectRowInTable={handleSelectRow}
                  onOpenAIAgent={() => setActiveTab("agent")}
                />
              )}

              {activeTab === "side_finder" && <SideFinderTab />}

              {activeTab === "perimeter_vasthu" && <TwoSidePerimeterVasthuTab />}

              {activeTab === "agent" && (
                <AIVastuAuditTab />
              )}

              {activeTab === "table" && (
                <FullTableTab initialSubTab="catalog" onSelectRow={handleSelectRow} />
              )}

              {activeTab === "room_dimensions" && (
                <FullTableTab initialSubTab="rooms" onSelectRow={handleSelectRow} />
              )}

              {activeTab === "attachment" && (
                <AttachmentTab onSelectRow={handleSelectRow} />
              )}

              {activeTab === "guide" && <GuideTab />}
            </div>
          )}

          {/* BUILDING RULES SECTION */}
          {activeSection === "building_rules" && (
            <div className="space-y-6">
              {/* Building Rules Sub-navigation Bar */}
              <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("rules_ai_chat")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "rules_ai_chat"
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950 border border-emerald-400/40"
                        : "text-emerald-400 hover:text-white hover:bg-emerald-950/40 border border-emerald-500/20"
                    }`}
                  >
                    <Bot className="w-4 h-4 text-emerald-300 animate-pulse" />
                    <span>AI Building Rules Agent</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-mono text-[10px] font-bold border border-emerald-400/50">
                      AI
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("rules_search")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "rules_search"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Search className="w-4 h-4 text-emerald-300" />
                    <span>Rules Search</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("rules_occupancies")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "rules_occupancies"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-300" />
                    <span>Occupancies (A1-J)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("rules_calculator")}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "rules_calculator" || activeTab === "rules_calculators"
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-emerald-300" />
                    <span>ഏകീകൃത കാൽക്കുലേറ്റർ (Master Calculator)</span>
                  </button>
                </div>
              </div>

              {activeTab === "rules_ai_chat" && <AIKpbrRulesTab />}

              {activeTab === "rules_search" && (
                <RuleSearchTab onAskAIAboutRule={handleAskAIAboutRule} />
              )}

              {activeTab === "rules_occupancies" && <OccupanciesTab />}

              {(activeTab === "rules_calculator" || activeTab === "rules_calculators") && <CalculatorsTab />}
            </div>
          )}

          {/* KSMART LSGD PORTAL & FILE TRACKING SECTION */}
          {activeSection === "ksmart" && (
            <KsmartDashboard
              activeTab={activeTab}
              setActiveTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* SURVEY SECTION */}
          {activeSection === "survey" && (
            <>
              {activeTab === "missing_side" && <MissingSideCalculator />}

              {activeTab === "land_area" && <LandAreaCalculator />}

              {activeTab === "unit_converters" && <SurveyConvertersTab />}

              {activeTab === "survey_ai_agent" && <AISurveyFmbTab />}
            </>
          )}

          {/* CIVIL ENGINEERING SECTION */}
          {activeSection === "civil" && (
            <>
              {activeTab === "brick_masonry" && <BrickMasonryCalculator />}

              {activeTab === "concrete_block" && <ConcreteBlockCalculator />}

              {activeTab === "cement_concrete" && <CementConcreteCalculator />}

              {activeTab === "material_quantity_bbs" && <StructuralQuantityBbsCalculator />}
            </>
          )}

          {/* ESTIMATE & QUANTITY SURVEY SECTION */}
          {activeSection === "estimate" && (
            <>
              {activeTab === "estimate_dashboard" && (
                <EstimateDashboard
                  projects={estimateProjects}
                  onSelectProject={(proj) => {
                    setSelectedEstimateProject(proj);
                    setActiveTab("estimate_sheet");
                  }}
                  onCreateNewProject={handleCreateNewEstimate}
                  onGoToSeals={() => setActiveTab("engineer_seals")}
                  onGoToValuation={() => setActiveTab("valuation")}
                  onOpenStageCertificates={(proj) => {
                    setSelectedEstimateProject(proj);
                    setActiveTab("stage_completion_certificate");
                  }}
                  onDeleteProject={handleDeleteEstimateProject}
                  onDuplicateProject={handleDuplicateEstimateProject}
                  onConvertToProject={handleConvertToProject}
                  onConvertToInvoice={handleConvertToInvoice}
                  onSaveClonedProject={(clonedProj, openInEditor = true) => {
                    setEstimateProjects((prev) => {
                      const next = [clonedProj, ...prev.filter((p) => p.id !== clonedProj.id)];
                      saveEstimates(next);
                      return next;
                    });
                    if (openInEditor) {
                      setSelectedEstimateProject(clonedProj);
                      setActiveTab("estimate_sheet");
                    }
                  }}
                />
              )}

              {activeTab === "estimate_sheet" && (
                <EstimateSheetTab
                  project={selectedEstimateProject}
                  allProjects={estimateProjects}
                  onSelectProject={(proj) => setSelectedEstimateProject(proj)}
                  onDuplicateProject={handleDuplicateEstimateProject}
                  onGoToDashboard={() => setActiveTab("estimate_dashboard")}
                  onDeleteProject={handleDeleteEstimateProject}
                  onUpdateProject={handleUpdateEstimateProject}
                  onOpenAIAgent={() => {
                    setActiveSection("ai_agent");
                    setActiveTab("ai_estimate");
                  }}
                  onOpenStageCertificates={() => {
                    setActiveTab("stage_completion_certificate");
                  }}
                  onConvertToProject={handleConvertToProject}
                  onConvertToInvoice={handleConvertToInvoice}
                  onOpenItemsOfWorkMaster={() => setActiveTab("items_of_work")}
                />
              )}

              {activeTab === "valuation" && <ValuationTab />}

              {activeTab === "stage_completion_certificate" && (
                <StageCompletionCertificateTab
                  estimateProjects={estimateProjects}
                  activeProjectId={selectedEstimateProject.id}
                  onSelectProject={(id) => {
                    const found = estimateProjects.find((p) => p.id === id);
                    if (found) setSelectedEstimateProject(found);
                  }}
                  onUpdateProject={handleUpdateEstimateProject}
                  onOpenClientView={() => {
                    setActiveSection("invoices_payments");
                    setActiveTab("client_view");
                  }}
                />
              )}

              {activeTab === "items_of_work" && <ItemsOfWorkTab />}

              {activeTab === "engineer_seals" && <EngineerSealsTab />}

              {activeTab === "estimate_ai_agent" && <AIEstimateBoqTab />}
            </>
          )}

          {/* OFFICE DASHBOARD (CRM) SECTION */}
          {(activeSection === "office_dashboard" || (activeSection as string) === "online_applications") && (
            <OfficeDashboard
              activeTab={
                (activeSection as string) === "online_applications"
                  ? ("office_online_applications" as OfficeDashboardTabType)
                  : (activeTab as OfficeDashboardTabType)
              }
              setActiveTab={(tab) => {
                setActiveSection("office_dashboard");
                setActiveTab(tab);
              }}
              estimateProjects={estimateProjects}
            />
          )}

          {/* INVOICES & PAYMENTS WORKSTATION */}
          {activeSection === "invoices_payments" && (
            <InvoicePaymentsTab
              activeTab={activeTab as InvoicesTabType}
              setActiveTab={(tab) => setActiveTab(tab)}
              estimateProjects={estimateProjects}
            />
          )}

          {/* PERSONAL BILLS AND PAYMENTS SECTION */}
          {activeSection === "construction_works" && (
            <ConstructionDashboard
              initialTab={activeTab as ConstructionTabType}
              onTabChange={(newTab) => {
                const subIdMap: Record<string, TabType> = {
                  dashboard: "construction_dashboard" as TabType,
                  new_construction: "new_construction" as TabType,
                  projects: "construction_projects" as TabType,
                  agreements: "construction_agreements" as TabType,
                  cost_calculator: "construction_cost_calculator" as TabType,
                  payment_stages: "construction_payment_stages" as TabType,
                  reports: "construction_reports" as TabType,
                  settings: "construction_settings" as TabType,
                  search: "construction_search" as TabType
                };
                setActiveTab(subIdMap[newTab] || (newTab as TabType));
              }}
            />
          )}

          {/* QUOTATIONS SECTION */}
          {activeSection === "quotation" && (
            <QuotationModule activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {/* PERSONAL BILLS AND PAYMENTS SECTION */}
          {activeSection === "personal_bills" && (
            <PersonalBillsDashboard
              initialSubTab={
                activeTab === "staff_salary"
                  ? "staff_salary"
                  : activeTab === "poov_mala_bill" || activeTab === "poov_mala"
                  ? "poov_mala"
                  : activeTab === "kseb_bills" || activeTab === "kseb_bill"
                  ? "kseb_bills"
                  : activeTab === "health_insurance"
                  ? "health_insurance"
                  : activeTab === "rd_accounts" || activeTab === "rd_deposit"
                  ? "rd_accounts"
                  : activeTab === "panchayath_bills" || activeTab === "licence_panchayath" || activeTab === "panchayath_fees"
                  ? "licence_panchayath"
                  : activeTab === "personal_vendors" || activeTab === "all_vendors" || activeTab === "all_vendors_bills"
                  ? "all_vendors"
                  : "staff_salary"
              }
            />
          )}
            </div>
        </main>

        {/* Twilight Glass Technical Footer */}
        <footer className="glass-card border-t border-white/10 py-6 mt-12 text-xs text-purple-200/70 font-mono print:hidden rounded-t-3xl backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-sans font-bold text-slate-200">
              <Compass className="w-4 h-4 text-purple-400" />
              <span>VASTHUSILPY - KERALASSERY (വാസ്തു, കെട്ടിട ചട്ടങ്ങൾ, സർവ്വേ & സിവിൽ)</span>
            </div>

            <div className="flex items-center gap-3 text-purple-200/70 text-xs flex-wrap">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KPBR 2019 / 2026 GAZETTE COMPLIANT</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-cyan-300">
                <MapPin className="w-3.5 h-3.5" />
                <span>GEO-04 SURVEY</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-amber-300">
                <HardHat className="w-3.5 h-3.5" />
                <span>IS 1077 CIVIL MASONRY</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Simulated iPhone Bottom Home Indicator Bar */}
        {isSimulatedMobileOnDesktop && (
          <div className="w-full py-2.5 bg-slate-950/70 flex items-center justify-center shrink-0 border-t border-white/5">
            <div className="w-32 h-1 rounded-full bg-white/40" />
          </div>
        )}
      </div>
    </div>

      {/* Row Details Modal for Vasthu Shastra Table */}
      <RowDetailModal
        row={selectedRowModal}
        onClose={() => setSelectedRowModal(null)}
      />
    </div>
  );
}

