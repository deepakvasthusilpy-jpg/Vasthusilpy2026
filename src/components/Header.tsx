import React, { useState, useRef, useEffect } from "react";
import { MainSectionType, TabType } from "../types";
import { useAuth } from "../context/AuthContext";
import { useTheme, Theme, THEME_OPTIONS } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../context/NotificationContext";
import { ManageUsersModal } from "./auth/ManageUsersModal";
import { UserProfileModal } from "./auth/UserProfileModal";
import { ThemeSelectorModal } from "./theme/ThemeSelectorModal";
import { Logo } from "./Logo";
import { isOnamThemeActive } from "../utils/onamTheme";
import { OnamFestiveBadge } from "./common/OnamFestiveElements";
import {
  Menu,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
  Columns,
  Crown,
  Sparkles,
  Trees,
  Cpu,
  Globe,
  Bell,
  CheckCircle2,
  Trash2,
  FileText,
  Activity,
  X,
  Palette,
  ChevronDown,
  Sparkle,
  Smartphone,
  Monitor,
  Cloud,
  RefreshCw,
  Database
} from "lucide-react";
import { OfflineBackupRestoreModal } from "./office/crm/OfflineBackupRestoreModal";
import { useViewMode } from "../context/ViewModeContext";
import {
  performFullWebDataSync,
  getLastWebDataSyncTime,
  formatSyncTimestamp,
  pullAndHydrateWebDataFromServer
} from "../utils/webDataSyncManager";
import { pullFullCloudDatabaseState } from "../utils/cloudRealtimeSync";

interface HeaderProps {
  activeSection?: MainSectionType;
  setActiveSection?: (section: MainSectionType) => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
  totalRows?: number;
  onOpenMobileSidebar?: () => void;
}

const THEME_HEADER_ICONS: Record<Theme, React.FC<{ className?: string }>> = {
  dark: Moon,
  baroque: Crown,
  anthropomorphic: Trees,
  ai_platform: Cpu
};

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar
}) => {
  const { user, emailUser, signOutUser, isPrimaryAdmin } = useAuth();
  const { theme, setTheme, currentThemeMeta, cycleNextTheme, isSystemTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { viewMode, toggleViewMode, isMobileView } = useViewMode();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const safeNotifications = notifications || [];

  const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
  const [backupInitialTab, setBackupInitialTab] = useState<"backup" | "snapshots" | "restore" | "health">("backup");
  const [isWebSyncing, setIsWebSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [lastSyncStr, setLastSyncStr] = useState<string>(() => formatSyncTimestamp(getLastWebDataSyncTime()));
  const notifRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const activeEmail = user?.email || emailUser?.email || "";
  const activePhone = emailUser?.phone || (activeEmail.includes("deepak") ? "9747995961" : "");
  const activeDisplayName = user?.displayName || emailUser?.displayName || (activeEmail ? activeEmail.split("@")[0] : "Authorized User");

  const handleHeaderWebSync = async () => {
    if (isWebSyncing) return;
    setIsWebSyncing(true);
    setSyncFeedback("Syncing...");
    try {
      if (activeEmail || activePhone) {
        await pullAndHydrateWebDataFromServer(activeEmail || activePhone);
      }
      await Promise.allSettled([
        performFullWebDataSync(),
        pullFullCloudDatabaseState()
      ]);
      setLastSyncStr(formatSyncTimestamp(new Date().toISOString()));
      setSyncFeedback("Synced Online!");
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (e) {
      console.warn("Header web sync notice:", e);
      setSyncFeedback("Sync Ready");
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsWebSyncing(false);
    }
  };

  // Periodic Auto Sync: syncs online initially, every 60s, and when window gains focus
  useEffect(() => {
    const initialSyncTimer = setTimeout(() => {
      handleHeaderWebSync();
    }, 1500);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        handleHeaderWebSync();
      }
    }, 60000);

    const onFocus = () => {
      if (navigator.onLine) {
        handleHeaderWebSync();
      }
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [activeEmail, activePhone]);

  // Listen for sync events to update sync display
  useEffect(() => {
    const handleSyncEvent = (e: any) => {
      setLastSyncStr(formatSyncTimestamp(e?.detail?.syncedAt || getLastWebDataSyncTime()));
    };
    window.addEventListener("vasthusilpy_web_data_synced", handleSyncEvent);
    const handleOpenBackupModal = (e: any) => {
      if (e?.detail?.tab) {
        setBackupInitialTab(e.detail.tab);
      }
      setIsBackupRestoreOpen(true);
    };
    window.addEventListener("vasthusilpy_open_backup_modal", handleOpenBackupModal);

    return () => {
      window.removeEventListener("vasthusilpy_web_data_synced", handleSyncEvent);
      window.removeEventListener("vasthusilpy_open_backup_modal", handleOpenBackupModal);
    };
  }, []);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CurrentThemeIcon = THEME_HEADER_ICONS[theme] || Sparkle;

  return (
    <>
      <header className="bg-[#0e021a]/80 backdrop-blur-2xl border-b border-white/15 sticky top-0 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.35)] print:hidden">
        {/* Top Twilight Glass Header */}
        <div className="px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              {onOpenMobileSidebar && (
                <button
                  onClick={onOpenMobileSidebar}
                  className={`${isMobileView ? "flex" : "md:hidden"} p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white transition cursor-pointer`}
                  title="Open Sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <Logo size={42} />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-purple-200 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-400/40 uppercase shadow-sm">
                    {t("system_title", "VASTHUSILPY TECHNICAL SYSTEM")}
                  </span>
                  <span className="text-[10px] font-mono text-purple-200/60 hidden sm:inline">
                    {t("subtitle", "KPBR 2019/2026 • SURVEY & VASTU")}
                  </span>
                </div>
                <h1 className="text-base md:text-lg font-black tracking-tight text-white font-sans uppercase flex items-center gap-2">
                  <span className="bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">{t("header_heading", "VASTHUSILPY - KERALASSERY")}</span>
                  {isOnamThemeActive() && (
                    <OnamFestiveBadge compact={true} />
                  )}
                </h1>
              </div>
            </div>

            {/* Desktop Navigation Control & User Profile Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* VIEW MODE SWITCHER BUTTON (DESKTOP <-> MOBILE) */}
              <div
                className="flex items-center bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/35 rounded-full p-0.5 transition-all shadow-sm backdrop-blur-md"
                title={
                  isMobileView
                    ? (language === "ml" ? "ഡെസ്ക്ടോപ്പ് വ്യൂവിലേക്ക് മാറ്റുക (Desktop View)" : "Switch to Desktop View (Full Screen)")
                    : (language === "ml" ? "മൊബൈൽ വ്യൂവിലേക്ക് മാറ്റുക (Mobile View)" : "Switch to Mobile View (Phone View)")
                }
              >
                <button
                  onClick={toggleViewMode}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    isMobileView
                      ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm"
                  }`}
                >
                  {isMobileView ? (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-pink-100" />
                      <span className="uppercase text-[11px] font-black tracking-wider">
                        {language === "ml" ? "മൊബൈൽ" : "Mobile"}
                      </span>
                    </>
                  ) : (
                    <>
                      <Monitor className="w-3.5 h-3.5 text-cyan-200" />
                      <span className="uppercase text-[11px] font-black tracking-wider">
                        {language === "ml" ? "ഡെസ്ക്ടോപ്പ്" : "Desktop"}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={toggleViewMode}
                  className="px-1.5 py-1 text-purple-200/70 hover:text-white transition-colors cursor-pointer text-[10px] font-mono font-bold"
                  aria-label="Toggle between Mobile View and Desktop View"
                >
                  {isMobileView ? (
                    <Monitor className="w-3.5 h-3.5 text-purple-200 hover:text-cyan-300 transition-colors" />
                  ) : (
                    <Smartphone className="w-3.5 h-3.5 text-purple-200 hover:text-pink-300 transition-colors" />
                  )}
                </button>
              </div>

              {/* LANGUAGE SWITCHER BUTTON (MALAYALAM / ENGLISH) */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-full text-xs font-mono font-bold text-white transition-all shadow-sm cursor-pointer backdrop-blur-md"
                title={`Switch Language to ${language === "en" ? "Malayalam (മലയാളം)" : "English"}`}
              >
                <Globe className="w-3.5 h-3.5 text-purple-300" />
                <span className="uppercase text-[11px] font-black tracking-wider text-purple-100">
                  {language === "en" ? "EN | മലയാളം" : "മലയാളം | EN"}
                </span>
              </button>

              {/* LOCAL NOTIFICATION BADGE BUTTON & DROPDOWN */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="relative p-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 rounded-full text-white transition-all shadow-sm cursor-pointer group backdrop-blur-md"
                  title="Alerts & Status Notifications"
                >
                  <Bell className="w-4 h-4 text-purple-200 group-hover:text-amber-300 transition-colors" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-mono text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-md border border-purple-950">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-card border border-white/20 rounded-3xl shadow-2xl z-50 overflow-hidden font-sans backdrop-blur-2xl">
                    <div className="bg-white/10 px-4 py-3 border-b border-white/15 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-300" />
                        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                          {t("notifications", "NOTIFICATIONS")}
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-500/30 text-rose-200 border border-rose-400/50 rounded-full text-[10px] font-mono font-bold">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAllAsReadHandler}
                            className="text-[10px] font-mono text-purple-300 hover:underline cursor-pointer"
                            title="Mark all as read"
                          >
                            {t("mark_all_read", "Mark read")}
                          </button>
                        )}
                        <button
                          onClick={() => setIsNotifOpen(false)}
                          className="text-purple-200/70 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
                      {safeNotifications.length === 0 ? (
                        <div className="p-6 text-center text-purple-200/50 font-mono text-xs">
                          {t("no_notifications", "No new notifications")}
                        </div>
                      ) : (
                        safeNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                              notif.read ? "bg-transparent opacity-75" : "bg-white/5 hover:bg-white/10"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {notif.type === "PROJECT_STATUS" ? (
                                <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300">
                                  <Activity className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="p-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-xs font-bold text-white truncate font-mono">
                                  {notif.title}
                                </span>
                                <span className="text-[10px] font-mono text-purple-200/60 shrink-0">
                                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-purple-100/70 leading-snug line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 shrink-0 animate-pulse" />
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {safeNotifications.length > 0 && (
                      <div className="p-2 bg-white/5 border-t border-white/10 flex justify-between items-center px-4 text-[11px] font-mono">
                        <button
                          onClick={markAllAsRead}
                          className="text-purple-300 hover:text-white cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t("mark_all_read", "Mark all read")}</span>
                        </button>
                        <button
                          onClick={clearAll}
                          className="text-purple-200/60 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t("clear_all", "Clear all")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ARCHITECTURAL THEME SELECTOR & STUDIO */}
              <div className="relative" ref={themeMenuRef}>
                <div className="flex items-center bg-white/10 border border-white/20 rounded-full shadow-sm overflow-hidden backdrop-blur-md">
                  <button
                    onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-white/15 transition-colors cursor-pointer group"
                    title={`Current Theme: ${currentThemeMeta.name} - Click to choose from 6 themes`}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0"
                      style={{ color: currentThemeMeta.primaryColor }}
                    >
                      <CurrentThemeIcon className="w-3.5 h-3.5 transform group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="hidden sm:inline uppercase text-[11px] font-black tracking-wider text-purple-100 truncate max-w-[110px]">
                      {currentThemeMeta.name.split(" ")[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-purple-300 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    onClick={cycleNextTheme}
                    className="px-2.5 py-1.5 border-l border-white/20 text-purple-200 hover:text-white hover:bg-white/15 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                    title="Cycle to next architectural theme"
                  >
                    NEXT
                  </button>
                </div>

                {/* Theme Fast Selection Dropdown */}
                {isThemeMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 glass-card border border-white/20 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl">
                    <div className="px-3.5 py-2.5 bg-white/10 border-b border-white/15 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-mono">
                        <Palette className="w-3.5 h-3.5 text-purple-300" />
                        <span>Select Theme</span>
                      </div>
                      <span className="text-[9px] font-mono bg-purple-500/20 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-bold">
                        6 STYLES
                      </span>
                    </div>

                    <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
                      {THEME_OPTIONS.map((opt) => {
                        const isSelected = theme === opt.id;
                        const OptIcon = THEME_HEADER_ICONS[opt.id] || Sparkle;

                        return (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setTheme(opt.id);
                              setIsThemeMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-2xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white/20 border border-white/40 text-white font-bold shadow-sm"
                                : "text-purple-100 hover:text-white hover:bg-white/10 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                                style={{
                                  backgroundColor: opt.cardPreview,
                                  border: `1px solid ${opt.borderPreview}`,
                                  color: opt.primaryColor
                                }}
                              >
                                <OptIcon className="w-3.5 h-3.5" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs leading-tight font-semibold truncate text-white">
                                  {opt.name}
                                </div>
                                <div className="text-[9.5px] text-purple-200/60 font-mono truncate">
                                  {opt.nameMl}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: opt.primaryColor }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: opt.bgPreview, border: `1px solid ${opt.borderPreview}` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 bg-white/5 border-t border-white/10">
                      <button
                        onClick={() => {
                          setIsThemeMenuOpen(false);
                          setIsThemeModalOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white border border-white/20 transition-colors cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>Open Theme Studio (Full Gallery)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* AUTO SYNC BUTTON ON TOP OF WEBPAGE */}
              <button
                id="btn-top-auto-sync"
                type="button"
                onClick={handleHeaderWebSync}
                disabled={isWebSyncing}
                title={`Auto Sync Online (${lastSyncStr || "Pending"}). Click to sync all data, calculations, projects & account details.`}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 backdrop-blur-md ${
                  isWebSyncing
                    ? "bg-cyan-500/30 border-cyan-400 text-white animate-pulse"
                    : "bg-cyan-950/70 hover:bg-cyan-900/80 border-cyan-500/50 hover:border-cyan-400 text-cyan-200 hover:text-white"
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 shrink-0 ${isWebSyncing ? "animate-spin" : ""}`} />
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_rgba(52,211,153,0.9)] shrink-0" />
                  <span className="uppercase text-[11px] font-black tracking-wider hidden sm:inline">
                    {syncFeedback || (isWebSyncing ? "SYNCING..." : "AUTO SYNC")}
                  </span>
                  <span className="uppercase text-[10px] font-black tracking-wider sm:hidden">
                    {syncFeedback === "Synced Online!" ? "SYNCED" : isWebSyncing ? "..." : "SYNC"}
                  </span>
                </span>
              </button>

              {/* BACKUP & RESTORE BUTTON ON TOP OF WEBPAGE */}
              <button
                id="btn-top-backup-restore"
                type="button"
                onClick={() => {
                  setBackupInitialTab("backup");
                  setIsBackupRestoreOpen(true);
                }}
                title="Vasthusilpy Backup & Restore Center - Data Storage Vault, Construction, Quotation, Estimator, CRM, Invoice Payments & Personal Bills"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-purple-500/50 hover:border-purple-400 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 hover:text-white text-xs font-mono font-bold transition-all shadow-sm cursor-pointer backdrop-blur-md"
              >
                <Database className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                <span className="uppercase text-[11px] font-black tracking-wider hidden sm:inline">
                  BACKUP
                </span>
                <span className="uppercase text-[10px] font-black tracking-wider sm:hidden">
                  BKUP
                </span>
              </button>

              {isPrimaryAdmin && (
                <button
                  onClick={() => setIsManageUsersOpen(true)}
                  className="hidden sm:flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 px-3.5 py-1.5 rounded-full font-mono text-xs font-bold transition-all shadow-sm cursor-pointer backdrop-blur-md"
                  title="Manage Authorized Email Whitelist"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>{t("manage_users", "MANAGE USERS")}</span>
                </button>
              )}

              {(user || emailUser) && (
                <div className="flex items-center gap-2 bg-white/10 border border-white/20 p-1 pl-3 rounded-full backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                    title="Click to view & edit Profile (Email, Mobile, Admin TOTP) synced online"
                  >
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-xs font-mono font-bold text-white max-w-[160px] truncate group-hover:text-pink-200 transition-colors">
                        {activeDisplayName}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                        {isPrimaryAdmin ? t("primary_admin", "PRIMARY ADMIN") : t("authorized", "AUTHORIZED")}
                        {activePhone && (
                          <span className="text-cyan-200/90 font-mono text-[9px] bg-cyan-950/70 border border-cyan-800/60 px-1.5 py-0.2 rounded ml-1">
                            📱 {activePhone.replace(/\D/g, "").slice(-10)}
                          </span>
                        )}
                      </span>
                    </div>

                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full border border-white/30 object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-white font-bold font-mono text-xs group-hover:scale-105 transition-transform">
                        {activeEmail ? activeEmail[0].toUpperCase() : "U"}
                      </div>
                    )}
                  </button>

                  <button
                    onClick={signOutUser}
                    className="p-1.5 text-purple-200/80 hover:text-rose-300 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <ManageUsersModal
        isOpen={isManageUsersOpen}
        onClose={() => setIsManageUsersOpen(false)}
      />

      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <OfflineBackupRestoreModal
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        initialTab={backupInitialTab}
      />
    </>
  );

  function markAllAllAsReadHandler() {
    markAllAsRead();
  }
};



