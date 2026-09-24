import React, { useState } from "react";
import { MainSectionType, TabType, VasthuTabType, BuildingRulesTabType, SurveyTabType } from "../types";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { Logo } from "./Logo";
import { ThemeSelectorModal } from "./theme/ThemeSelectorModal";
import {
  Compass,
  Building2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ArrowRightLeft,
  Bot,
  Table,
  FileText,
  FileCode,
  BookOpen,
  Search,
  Layers,
  Ruler,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  HardHat,
  Package,
  Box,
  Truck,
  Globe,
  FileSpreadsheet,
  Award,
  FolderKanban,
  Star,
  Briefcase,
  Receipt,
  History,
  Sun,
  Moon,
  ListPlus,
  Eye,
  FileCheck2,
  Home,
  Sparkles,
  Users,
  BarChart3,
  ListTodo,
  PenTool,
  Grid,
  Palette,
  Columns,
  Crown,
  Trees,
  LayoutGrid,
  LayoutTemplate,
  Plus,
  HardDrive,
  Stamp,
  MessageSquare,
  Wallet,
  Zap,
  HeartPulse,
  PiggyBank,
  Landmark,
  Calendar,
  Clock,
  FileEdit,
  FilePlus,
  Edit3,
  FileCheck,
  QrCode,
  Settings,
  FolderTree,
  Smartphone,
  Server
} from "lucide-react";

interface SidebarProps {
  activeSection: MainSectionType;
  setActiveSection: (section: MainSectionType) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalRows: number;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
  activeTab,
  setActiveTab,
  totalRows,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { theme, currentThemeMeta, cycleNextTheme } = useTheme();
  const { isPrimaryAdmin, isSubscriberLogin } = useAuth();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<MainSectionType>(activeSection);
  const [hoveredDockItem, setHoveredDockItem] = useState<string | null>(null);

  // Sync expandedSection with activeSection when activeSection changes
  React.useEffect(() => {
    setExpandedSection(activeSection);
  }, [activeSection]);

  const handleSectionClick = (section: MainSectionType, defaultTab: TabType) => {
    setActiveSection(section);
    setExpandedSection(section);
    setActiveTab(defaultTab);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const handleTabClick = (section: MainSectionType, tab: TabType) => {
    setActiveSection(section);
    setActiveTab(tab);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const handleQuickAgreement = () => {
    setActiveSection("construction_works");
    setActiveTab("construction_agreements");
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const SECTIONS = [
    {
      id: "home" as MainSectionType,
      title: "Home & Business",
      subtitle: "OVERVIEW & DASHBOARD",
      shortLabel: "Home",
      icon: Home,
      defaultTab: "home_overview" as TabType,
      color: "from-cyan-500 to-blue-600",
      activeBorder: "border-cyan-400",
      activeText: "text-cyan-300",
      subTabs: [
        { id: "home_overview" as TabType, label: "Home & Profile", sub: "BUSINESS OVERVIEW & PROFILE", icon: Sparkles },
        ...(isPrimaryAdmin && !isSubscriberLogin ? [{ id: "subscription_requests" as TabType, label: "Subscription Requests", sub: "ACCESS PERMISSIONS", icon: ShieldCheck, badge: "NEW" }] : [])
      ]
    },
    {
      id: "data_storage_vault" as MainSectionType,
      title: "Data Storage Vault",
      subtitle: "PLANS, 3D, ESTIMATES & CAD",
      shortLabel: "Vault",
      icon: HardDrive,
      defaultTab: "vault_dashboard" as TabType,
      color: "from-cyan-500 via-blue-600 to-indigo-600",
      activeBorder: "border-cyan-400",
      activeText: "text-cyan-300",
      badge: "VAULT",
      subTabs: [
        { id: "vault_dashboard" as TabType, label: "Vault Dashboard", sub: "ANALYTICS & METRICS", icon: LayoutGrid, badge: "LIVE" },
        { id: "vault_plan" as TabType, label: "1. PLAN", sub: "ARCHITECTURAL & 2D CAD", icon: Compass, badge: "PLAN" },
        { id: "vault_3d" as TabType, label: "2. 3D", sub: "3D ELEVATION & VISUALS", icon: Layers, badge: "3D" },
        { id: "vault_estimate" as TabType, label: "3. ESTIMATE", sub: "BOQ & ESTIMATES", icon: FileSpreadsheet, badge: "EST" },
        { id: "vault_survey" as TabType, label: "4. SURVEY", sub: "LAND SURVEY & FMB", icon: MapPin, badge: "SURVEY" },
        { id: "vault_documents" as TabType, label: "5. DOCUMENTS", sub: "PERMITS & OFFICE DOCS", icon: FileText, badge: "DOCS" },
        { id: "vault_settings" as TabType, label: "Settings & Folders", sub: "FOLDERS, SYNC & BACKUP", icon: Settings, badge: "CONFIG" }
      ]
    },
    {
      id: "construction_works" as MainSectionType,
      title: "Construction Works",
      subtitle: "PROJECTS & E-STAMP",
      shortLabel: "Construction",
      icon: HardHat,
      defaultTab: "construction_dashboard" as TabType,
      color: "from-amber-500 to-emerald-500",
      activeBorder: "border-amber-400",
      activeText: "text-amber-300",
      badge: "E-STAMP",
      subTabs: [
        { id: "construction_dashboard" as TabType, label: "Construction Dashboard", sub: "OVERVIEW & ACTIVE SITES", icon: LayoutGrid, badge: "OVERVIEW" },
        { id: "construction_agreements" as TabType, label: "E-Stamp Agreements", sub: "E-STAMP & A4 PRINT", icon: FileCheck2, badge: "PRINT" },
        { id: "new_construction" as TabType, label: "New Project & Agreement", sub: "PROJECT WIZARD", icon: Plus, badge: "WIZARD" },
        { id: "construction_projects" as TabType, label: "Projects & Clients", sub: "CLIENT DIRECTORY", icon: FolderKanban },
        { id: "construction_cost_calculator" as TabType, label: "Base Rate & Cost Calculator", sub: "SQFT RATE ESTIMATE", icon: Calculator, badge: "RATE" },
        { id: "construction_payment_stages" as TabType, label: "Payment Stages", sub: "DISBURSEMENT SCHEDULE", icon: Receipt },
        { id: "construction_reports" as TabType, label: "Financial Reports", sub: "PROFIT & EXPENSES", icon: FileSpreadsheet },
        { id: "construction_settings" as TabType, label: "Construction Settings", sub: "STAGES & MARGINS", icon: Sparkles },
        { id: "construction_search" as TabType, label: "QR Verification", sub: "AGREEMENT VALIDATION", icon: ShieldCheck, badge: "QR" }
      ]
    },
    {
      id: "quotation" as MainSectionType,
      title: "Quotatios",
      subtitle: "RATES & CONTRACTORS",
      shortLabel: "Quotatios",
      icon: FileText,
      defaultTab: "quotation_dashboard" as TabType,
      color: "from-amber-500 to-yellow-600",
      activeBorder: "border-amber-400",
      activeText: "text-amber-300",
      badge: "QTN",
      subTabs: [
        { id: "quotation_dashboard" as TabType, label: "Quotation Dashboard", sub: "METRICS & RECENT", icon: LayoutGrid },
        { id: "quotation_create" as TabType, label: "Create Quotation", sub: "NEW CLIENT QUOTE", icon: Plus, badge: "NEW" },
        { id: "quotation_all" as TabType, label: "All Quotations", sub: "SEARCH & DIRECTORY", icon: FileText },
        { id: "quotation_rates" as TabType, label: "Service & Rate List", sub: "MATERIAL & LABOUR", icon: Calculator, badge: "RATES" },
        { id: "quotation_contractors" as TabType, label: "Contractors Directory", sub: "TRADE SUB-CONTRACTORS", icon: Users },
        { id: "quotation_terms" as TabType, label: "Terms & Conditions", sub: "CLAUSES & POLICIES", icon: ShieldCheck }
      ]
    },
    {
      id: "estimate" as MainSectionType,
      title: "Estimater",
      subtitle: "VALUATION & SURVEY",
      shortLabel: "Estimater",
      icon: FileSpreadsheet,
      defaultTab: "estimate_dashboard" as TabType,
      color: "from-emerald-500 to-amber-500",
      activeBorder: "border-emerald-500",
      activeText: "text-emerald-400",
      badge: "BOQ",
      subTabs: [
        { id: "estimate_dashboard" as TabType, label: "Estimate Dashboard", sub: "ESTIMATES DIRECTORY", icon: FileSpreadsheet },
        { id: "estimate_sheet" as TabType, label: "Detailed Rate Estimate (BOQ)", sub: "QUANTITY SURVEY SHEET", icon: Calculator, badge: "BOQ" },
        { id: "stage_completion_certificate" as TabType, label: "Stage & Completion Certificate", sub: "CERTIFICATES", icon: Award, badge: "CERT" },
        { id: "items_of_work" as TabType, label: "Items of Work Library", sub: "WORK ITEM MASTER", icon: ListPlus, badge: "LIBRARY" },
        { id: "engineer_seals" as TabType, label: "Engineer Seals & Signatures", sub: "OFFICIAL CERTIFICATION", icon: ShieldCheck }
      ]
    },
    {
      id: "office_dashboard" as MainSectionType,
      title: "CRM",
      subtitle: "PROJECT PIPELINE & CRM",
      shortLabel: "CRM",
      icon: FolderKanban,
      defaultTab: "office_crm_projects" as TabType,
      color: "from-emerald-500 to-teal-600",
      activeBorder: "border-emerald-500",
      activeText: "text-emerald-400",
      subTabs: [
        { id: "office_crm_projects" as TabType, label: "Projects Pipeline", sub: "CRM PIPELINE", icon: Briefcase, badge: "CRM" },
        { id: "office_online_applications" as TabType, label: "Online Applications", sub: "PORTAL & LOGINS", icon: FileText, badge: "PORTAL" },
        { id: "office_application_types" as TabType, label: "Applications Type", sub: "TYPES & DEPARTMENTS", icon: Layers, badge: "TYPES" },
        { id: "office_tasks" as TabType, label: "Tasks & Sub-Tasks", sub: "TASK MANAGEMENT", icon: ListTodo, badge: "TASKS" },
        { id: "office_activities" as TabType, label: "Activity History", sub: "AUDIT TRAIL", icon: History }
      ]
    },
    {
      id: "site_inspection" as MainSectionType,
      title: "Site Inspection",
      subtitle: "MOBILE FIELD DATA & GPS",
      shortLabel: "Inspection",
      icon: MapPin,
      defaultTab: "site_inspection_form" as TabType,
      color: "from-emerald-500 via-teal-500 to-cyan-500",
      activeBorder: "border-emerald-400",
      activeText: "text-emerald-300",
      badge: "MOBILE",
      subTabs: [
        { id: "site_inspection_form" as TabType, label: "Field Inspection Form", sub: "MOBILE TOUCH & GPS", icon: Smartphone, badge: "FIELD" },
        { id: "site_inspection_dashboard" as TabType, label: "Admin Inspections", sub: "REVIEWS & PDF EXPORT", icon: LayoutGrid, badge: "ADMIN" },
        { id: "site_inspection_builder" as TabType, label: "Dynamic Questions", sub: "CHECKLIST TEMPLATES", icon: Layers },
        { id: "site_inspection_guide" as TabType, label: "Backend Architecture", sub: "WHATSAPP & NODEMAILER", icon: Server }
      ]
    },
    {
      id: "important_sites" as MainSectionType,
      title: "Important Sites",
      subtitle: "PORTALS, LINKS & FOLDERS",
      shortLabel: "Sites",
      icon: Globe,
      defaultTab: "important_sites" as TabType,
      color: "from-emerald-400 via-teal-500 to-cyan-500",
      activeBorder: "border-emerald-400",
      activeText: "text-emerald-300",
      badge: "LINKS",
      subTabs: [
        { id: "important_sites" as TabType, label: "All Important Sites", sub: "VAULT & FOLDERS", icon: Globe, badge: "ALL" },
        { id: "sites_folders" as TabType, label: "VEO & Folders", sub: "FOLDER DIRECTORY", icon: FolderKanban, badge: "VEO" }
      ]
    },
    {
      id: "invoices_payments" as MainSectionType,
      title: "Invoices & Payments",
      subtitle: "BILLING, CLIENT & PERSONAL",
      shortLabel: "Billing",
      icon: Receipt,
      defaultTab: "invoices_list" as TabType,
      color: "from-teal-400 to-emerald-500",
      activeBorder: "border-teal-400",
      activeText: "text-teal-300",
      badge: "PAY",
      subTabs: [
        { id: "invoices_list" as TabType, label: "Invoices & Billing", sub: "CLIENT INVOICES", icon: Receipt },
        { id: "products_services" as TabType, label: "Products & Services", sub: "RATES CATALOG", icon: Box, badge: "RATES" },
        { id: "customers" as TabType, label: "Customers & Clients", sub: "CLIENT DIRECTORY", icon: Users },
        { id: "reports_analysis" as TabType, label: "Reports & Analytics", sub: "REVENUE INSIGHTS", icon: BarChart3 },
        { id: "personal_bills" as TabType, label: "Personal Bills & Payments", sub: "UTILITIES, RD & POOV MALA", icon: Wallet, badge: "BILLS" }
      ]
    },
    {
      id: "vasthu" as MainSectionType,
      title: "Vasthu Shastra",
      subtitle: "VEDIC DIMENSIONS & RULES",
      shortLabel: "Vasthu",
      icon: Compass,
      defaultTab: "calculator" as TabType,
      color: "from-cyan-500 to-blue-600",
      activeBorder: "border-cyan-500",
      activeText: "text-cyan-400",
      subTabs: [
        { id: "calculator" as TabType, label: "Vasthu Calculator", sub: "AYADI SHADVARGA", icon: Calculator },
        { id: "agent" as TabType, label: "AI Vasthu Agent", sub: "VASTU AUDIT & CONSULTANT", icon: Bot, badge: "AI" },
        { id: "side_finder" as TabType, label: "Optimal Side Finder", sub: "DIMENSION OPTIMIZER", icon: ArrowRightLeft },
        { id: "perimeter_vasthu" as TabType, label: "2-Side Perimeter Vastu", sub: "WALL PERIMETER", icon: Ruler },
        { id: "table" as TabType, label: "Full Dimensions Table", sub: `8 YONIS & ${totalRows} ROWS`, icon: Table },
        { id: "room_dimensions" as TabType, label: "Room Inner Measurements", sub: "VASTHU ROOM ALIGNMENT", icon: Compass, badge: "NEW" },
        { id: "attachment" as TabType, label: "Vedic Manuscript", sub: "17 PAGES REFERENCE", icon: FileText },
        { id: "guide" as TabType, label: "Thachu Shastra Guide", sub: "PRINCIPLES & RULES", icon: BookOpen }
      ]
    },
    {
      id: "building_rules" as MainSectionType,
      title: "Building Rules",
      subtitle: "KPBR & KMBR COMPLIANCE",
      shortLabel: "Rules",
      icon: Building2,
      defaultTab: "rules_search" as TabType,
      color: "from-emerald-400 to-cyan-500",
      activeBorder: "border-emerald-500",
      activeText: "text-emerald-400",
      subTabs: [
        { id: "rules_ai_chat" as TabType, label: "AI Building Rules Agent", sub: "KPBR 2019/2026 AUDITOR", icon: Bot, badge: "AI" },
        { id: "rules_search" as TabType, label: "Rules Search", sub: "KPBR CLAUSES SEARCH", icon: Search },
        { id: "rules_occupancies" as TabType, label: "Occupancies (A1-J)", sub: "BUILDING CLASSIFICATIONS", icon: Layers },
        { id: "rules_calculator" as TabType, label: "Building Rules Master Calculator", sub: "UNIFIED RULES & REPORT", icon: Calculator, badge: "MASTER" }
      ]
    },
    {
      id: "survey" as MainSectionType,
      title: "Digital Land Survey",
      subtitle: "FMB & AREA CALCULATOR",
      shortLabel: "Survey",
      icon: MapPin,
      defaultTab: "missing_side" as TabType,
      color: "from-blue-500 to-indigo-600",
      activeBorder: "border-blue-500",
      activeText: "text-blue-400",
      subTabs: [
        { id: "missing_side" as TabType, label: "Missing Side Calc", sub: "GEO-04 POLYGON", icon: Ruler },
        { id: "land_area" as TabType, label: "Land Area Calc", sub: "HERON'S FORMULA", icon: MapPin },
        { id: "unit_converters" as TabType, label: "Unit Converter", sub: "CENT, ACRE & SQFT", icon: ArrowRightLeft, badge: "CONVERT" }
      ]
    },
    {
      id: "civil" as MainSectionType,
      title: "Civil Engineering",
      subtitle: "IS 456 & BAR BENDING (BBS)",
      shortLabel: "Civil",
      icon: HardHat,
      defaultTab: "brick_masonry" as TabType,
      color: "from-amber-500 to-rose-600",
      activeBorder: "border-amber-500",
      activeText: "text-amber-400",
      subTabs: [
        { id: "brick_masonry" as TabType, label: "Brick Masonry Calc", sub: "IS 1077 STANDARD", icon: Package },
        { id: "concrete_block" as TabType, label: "Concrete Block Calc", sub: "SOLID & HOLLOW CMU", icon: Box },
        { id: "cement_concrete" as TabType, label: "Cement Concrete Calc", sub: "IS 456 PCC & RCC", icon: Truck },
        { id: "material_quantity_bbs" as TabType, label: "Material Quantity & BBS", sub: "IS 2502 BAR BENDING", icon: Layers, badge: "BBS" }
      ]
    }
  ];

  // Collapsed Dock View
  const collapsedDockView = (
    <div className="h-full flex flex-col justify-between items-center py-3 select-none bg-[#0e021a]/85 backdrop-blur-2xl border-r border-white/15">
      {/* Top Dock Brand & Expand Trigger */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 rounded-2xl hover:bg-white/10 transition-transform hover:scale-105 cursor-pointer"
          title="Expand Dock"
        >
          <Logo size={36} />
        </button>

        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-purple-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition cursor-pointer shadow-sm group"
          title="Expand Dock"
        >
          <PanelLeftOpen className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Center Dock Icons with floating Tooltip Popovers */}
      <div className="flex-1 w-full overflow-y-auto py-3 px-2 flex flex-col items-center gap-2 scrollbar-none">
        {SECTIONS.map((sec) => {
          const isSecActive = activeSection === sec.id;
          const SecIcon = sec.icon;

          return (
            <div
              key={sec.id}
              className="relative flex items-center justify-center w-full"
              onMouseEnter={() => setHoveredDockItem(sec.id)}
              onMouseLeave={() => setHoveredDockItem(null)}
            >
              <button
                onClick={() => handleSectionClick(sec.id, sec.defaultTab)}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  isSecActive
                    ? `bg-gradient-to-br ${sec.color} text-slate-950 font-bold shadow-lg shadow-purple-950/50 scale-105 ring-2 ring-white/60`
                    : "bg-white/5 hover:bg-white/15 text-purple-200 hover:text-white border border-white/15 hover:border-white/30 hover:scale-105 backdrop-blur-md"
                }`}
              >
                <SecIcon className={`w-5 h-5 ${isSecActive ? "text-slate-950 stroke-[2.2]" : "text-purple-100"}`} />

                {/* Section Badge dot */}
                {sec.badge && !isSecActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-pink-400 ring-2 ring-[#0e021a]" />
                )}
              </button>

              {/* Hover Tooltip Card (positioned to the right of the dock) */}
              {hoveredDockItem === sec.id && (
                <div className="absolute left-14 z-50 w-56 glass-card border border-white/20 text-slate-100 rounded-3xl p-3.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-left-2 duration-150 pointer-events-none">
                  <div className="flex items-center justify-between border-b border-white/15 pb-1.5 mb-1.5">
                    <span className="font-bold text-xs text-white">{sec.title}</span>
                    {sec.badge && (
                      <span className="text-[8.5px] font-mono font-bold bg-pink-500/20 text-pink-200 px-2 py-0.5 rounded-full border border-pink-400/40">
                        {sec.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] font-mono text-purple-300 uppercase tracking-wider mb-2">
                    {sec.subtitle}
                  </div>
                  <div className="text-[9.5px] text-purple-200/70 font-sans">
                    {sec.subTabs.length} Tools & Sub-sections
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Quick Actions Dock */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/15 w-full px-2">
        {/* Quick E-Stamp Print Launcher */}
        <button
          onClick={handleQuickAgreement}
          className="w-11 h-11 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 flex items-center justify-center transition hover:scale-105 cursor-pointer shadow-sm backdrop-blur-md"
          title="Quick E-Stamp & Plain A4 Agreements"
        >
          <Stamp className="w-5 h-5" />
        </button>

        {/* Theme Studio Button */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-purple-300 flex items-center justify-center transition hover:scale-105 cursor-pointer shadow-sm relative backdrop-blur-md"
          title="Architectural Theme Studio (6 Themes)"
        >
          <Palette className="w-4 h-4" />
          <span
            className="absolute bottom-1 right-1 w-2 h-2 rounded-full ring-1 ring-[#0e021a]"
            style={{ backgroundColor: currentThemeMeta.primaryColor }}
          />
        </button>
      </div>
    </div>
  );

  // Full Expanded Dock View
  const expandedDockView = (
    <div className="h-full flex flex-col justify-between select-none bg-[#0e021a]/85 backdrop-blur-2xl border-r border-white/15 text-white">
      {/* Sidebar Header & Brand Logo */}
      <div className="p-3.5 border-b border-white/15 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <Logo size={38} />

          <div className="truncate">
            <span className="text-[9px] font-mono font-bold text-purple-200 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-400/40 uppercase block w-max mb-0.5">
              VASTHUSILPY
            </span>
            <h2 className="text-sm font-black text-white font-sans uppercase tracking-tight truncate">
              ENGINEERING STUDIO
            </h2>
          </div>
        </div>

        {/* Collapse Toggle Button (Desktop) */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="hidden md:flex items-center justify-center p-1.5 text-purple-200/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition cursor-pointer"
          title="Collapse Dock to slim icon rail"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>

        {/* Mobile Close Button */}
        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 text-purple-200 hover:text-white bg-white/10 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Sections Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-2 scrollbar-none">
        {SECTIONS.map((sec) => {
          const isSecActive = activeSection === sec.id;
          const SecIcon = sec.icon;

          return (
            <div key={sec.id} className="space-y-1">
              {/* Section Header Button */}
              <button
                onClick={() => handleSectionClick(sec.id, sec.defaultTab)}
                className={`w-full flex items-center gap-2.5 p-2 rounded-2xl transition-all cursor-pointer ${
                  isSecActive
                    ? `bg-white/15 border border-white/30 text-white shadow-lg backdrop-blur-xl`
                    : "text-purple-200/80 hover:text-white hover:bg-white/10 border border-transparent"
                }`}
                title={sec.title}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isSecActive
                      ? `bg-gradient-to-r ${sec.color} text-slate-950 font-bold shadow`
                      : "bg-white/5 text-purple-200 border border-white/15"
                  }`}
                >
                  <SecIcon className="w-4 h-4" />
                </div>

                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-bold font-sans text-white truncate flex items-center justify-between">
                    <span>{sec.title}</span>
                    {sec.badge && (
                      <span className="text-[8px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/40">
                        {sec.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] font-mono text-purple-200/60 tracking-wider truncate">
                    {sec.subtitle}
                  </div>
                </div>
              </button>

              {/* Sub-tabs List (visible if Section is Active) */}
              {isSecActive && (
                <div className="pl-3.5 pr-1 py-1 space-y-1 border-l-2 border-white/20 ml-4 my-1">
                  {sec.subTabs.map((sub) => {
                    const isTabActive =
                      activeTab === sub.id ||
                      (sec.id === "construction_works" && (
                        (sub.id === "construction_dashboard" && (activeTab === "dashboard" || activeTab === "construction_dashboard")) ||
                        (sub.id === "new_construction" && (activeTab === "new_construction" || activeTab === "construction_new")) ||
                        (sub.id === "construction_projects" && (activeTab === "projects" || activeTab === "construction_projects")) ||
                        (sub.id === "construction_agreements" && (activeTab === "agreements" || activeTab === "construction_agreements")) ||
                        (sub.id === "construction_cost_calculator" && (activeTab === "cost_calculator" || activeTab === "construction_cost_calculator" || activeTab === "construction_calculator")) ||
                        (sub.id === "construction_payment_stages" && (activeTab === "payment_stages" || activeTab === "construction_payment_stages" || activeTab === "construction_payments")) ||
                        (sub.id === "construction_reports" && (activeTab === "reports" || activeTab === "construction_reports")) ||
                        (sub.id === "construction_settings" && (activeTab === "settings" || activeTab === "construction_settings")) ||
                        (sub.id === "construction_search" && (activeTab === "search" || activeTab === "construction_search" || activeTab === "construction_verify"))
                      ));
                    const SubIcon = sub.icon;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleTabClick(sec.id, sub.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                          isTabActive
                            ? "bg-white/20 text-white font-bold border border-white/35 shadow-sm backdrop-blur-md"
                            : "text-purple-200/70 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isTabActive ? "text-pink-300" : "text-purple-300/60"}`} />
                          <span className="truncate">{sub.label}</span>
                        </div>

                        {sub.badge && (
                          <span className="text-[8.5px] font-mono bg-white/10 text-purple-200 px-2 py-0.5 rounded-full border border-white/20 shrink-0">
                            {sub.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info Badge & Theme Studio Trigger */}
      <div className="p-3 m-2.5 glass-card border border-white/15 rounded-3xl text-[10px] font-mono text-purple-200/70 space-y-2 backdrop-blur-xl">
        <div className="flex items-center justify-between text-white font-bold">
          <span>VASTHUSILPY DOCK</span>
          <span className="text-purple-300">v2.5</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex-1 flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-full text-white transition-colors cursor-pointer text-left truncate"
            title="Open Architectural Theme Studio (6 Themes)"
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: currentThemeMeta.primaryColor }}
            />
            <span className="font-bold uppercase text-[9.5px] truncate">
              {currentThemeMeta.name.split(" ")[0]}
            </span>
          </button>

          <button
            onClick={cycleNextTheme}
            className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-purple-200 font-bold text-[9px] hover:text-white transition-colors cursor-pointer shrink-0"
            title="Cycle to next theme"
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Theme Studio Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* Desktop Persistent Collapsible Side Dock */}
      <aside
        className={`hidden md:block print:hidden sticky top-0 h-screen bg-[#0e021a]/85 backdrop-blur-2xl border-r border-white/15 transition-all duration-300 z-30 shrink-0 ${
          isCollapsed ? "w-[72px]" : "w-72"
        }`}
      >
        {isCollapsed ? collapsedDockView : expandedDockView}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="print:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-72 bg-[#0e021a]/95 border-r border-white/20 h-full z-10 print:hidden backdrop-blur-2xl animate-in slide-in-from-left duration-200">
            {expandedDockView}
          </aside>
        </div>
      )}
    </>
  );
};
