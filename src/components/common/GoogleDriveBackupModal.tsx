import React, { useState, useEffect, useMemo } from "react";
import {
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  ExternalLink,
  ShieldCheck,
  FolderOpen,
  FileJson,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  MapPin,
  FolderKanban,
  Receipt,
  FileSpreadsheet,
  Users,
  HardHat,
  Wallet,
  X,
  Lock,
  ArrowRight,
  Info
} from "lucide-react";
import {
  backupAllWebsiteDataToGoogleDrive,
  fetchGoogleDriveBackupsList,
  restoreBackupFromGoogleDrive,
  ensureGoogleDriveRootFolder,
  getLastGoogleDriveBackupTime,
  getLastGoogleDriveBackupInfo,
  formatBackupDate,
  GoogleDriveBackupResult,
  GoogleDriveBackupItem
} from "../../utils/googleDriveBackupManager";
import { generateFullBackupPackage } from "../../utils/backupRestoreManager";
import { getCachedToken, googleSignIn } from "../../lib/googleWorkspace";
import { useAuth } from "../../context/AuthContext";

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
  initialTab?: "backup" | "history" | "settings";
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
  initialTab = "backup"
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"backup" | "history" | "settings">(initialTab);

  // Backup Flow State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgressMsg, setBackupProgressMsg] = useState("");
  const [backupProgressPct, setBackupProgressPct] = useState(0);
  const [backupResult, setBackupResult] = useState<GoogleDriveBackupResult | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  // History / Cloud Snapshots State
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupItem[]>([]);
  const [rootFolderLink, setRootFolderLink] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Restore Flow State
  const [selectedSnapshotForRestore, setSelectedSnapshotForRestore] = useState<GoogleDriveBackupItem | null>(null);
  const [restoreMode, setRestoreMode] = useState<"REPLACE" | "MERGE">("REPLACE");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressMsg, setRestoreProgressMsg] = useState("");
  const [restoreSuccessMsg, setRestoreSuccessMsg] = useState<string | null>(null);
  const [restoreErrorMsg, setRestoreErrorMsg] = useState<string | null>(null);

  // Folder verification state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [folderStatusMsg, setFolderStatusMsg] = useState<string | null>(null);

  // Auth State
  const [hasToken, setHasToken] = useState<boolean>(() => !!getCachedToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Compute live dataset stats
  const liveStats = useMemo(() => {
    const pkg = generateFullBackupPackage(user?.email || "deepak.vasthusilpy@gmail.com");
    return {
      siteInspections: pkg.siteInspections?.length || 0,
      crmProjects: pkg.crm?.projects?.length || pkg.crmProjects?.length || 0,
      customers: pkg.crm?.customers?.length || pkg.customers?.length || 0,
      invoices: pkg.invoicePayments?.invoices?.length || pkg.invoices?.length || 0,
      estimates: pkg.estimator?.estimates?.length || pkg.estimates?.length || 0,
      quotations: pkg.quotation?.quotations?.length || 0,
      constructionProjects: pkg.constructionWork?.projects?.length || 0,
      personalBills:
        (pkg.personalBills?.poovMalaRows?.length || 0) +
        (pkg.personalBills?.ksebBills?.length || 0) +
        (pkg.personalBills?.vendorBills?.length || 0) +
        (pkg.personalBills?.staffSalary?.length || 0),
      onlineApps: pkg.onlineApplications?.length || 0,
      importantSites: pkg.importantSites?.length || 0,
      vaultFiles: pkg.dataStorageVault?.files?.length || 0,
      registeredTasks: pkg.crm?.registeredTasks?.length || pkg.registeredTasks?.length || 0
    };
  }, [isOpen]);

  const lastBackupTime = getLastGoogleDriveBackupTime();
  const lastBackupInfo = getLastGoogleDriveBackupInfo();

  useEffect(() => {
    if (isOpen) {
      const token = getCachedToken();
      setHasToken(!!token);
      setActiveTab(initialTab);
      setRestoreSuccessMsg(null);
      setRestoreErrorMsg(null);
      setBackupError(null);
      setFolderStatusMsg(null);
      if (token) {
        handleCreateOrVerifyFolder(false);
      }
      if (initialTab === "history" || activeTab === "history") {
        loadHistory(false);
      }
    }
  }, [isOpen, initialTab]);

  const [unauthorizedState, setUnauthorizedState] = useState(false);

  const handleCreateOrVerifyFolder = async (interactive: boolean = true) => {
    setIsCreatingFolder(true);
    setFolderStatusMsg(null);
    try {
      const res = await ensureGoogleDriveRootFolder(interactive);
      if (res.success) {
        if (res.webViewLink) {
          setRootFolderLink(res.webViewLink);
        }
        setFolderStatusMsg(res.message || "Vasthusilpy Cloud Backups folder is ready in your Google Drive.");
        setHasToken(true);
        setUnauthorizedState(false);
      } else {
        if (res.unauthorized) {
          setUnauthorizedState(true);
          setHasToken(false);
        }
        if (interactive) {
          setBackupError(res.error || "Failed to verify or create Google Drive folder.");
        }
      }
    } catch (err: any) {
      if (interactive) {
        setBackupError(err.message || "Failed to verify Google Drive folder.");
      }
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const loadHistory = async (interactive = false) => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    setUnauthorizedState(false);
    try {
      const res = await fetchGoogleDriveBackupsList(undefined, interactive);
      if (res.success) {
        setDriveBackups(res.backups);
        setRootFolderLink(res.rootFolderLink || null);
        setHasToken(true);
        setUnauthorizedState(false);
      } else {
        if (res.unauthorized) {
          setUnauthorizedState(true);
          setHasToken(false);
        }
        setHistoryError(res.error || "Failed to load backups from Google Drive.");
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("invalid authentication") || msg.toLowerCase().includes("unauthorized")) {
        setUnauthorizedState(true);
        setHasToken(false);
      }
      setHistoryError(err.message || "Error connecting to Google Drive.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsAuthenticating(true);
    setBackupError(null);
    setHistoryError(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setHasToken(true);
        setUnauthorizedState(false);
        await handleCreateOrVerifyFolder(false);
        if (activeTab === "history") {
          await loadHistory(false);
        }
      }
    } catch (err: any) {
      setBackupError(err.message || "Failed to sign in with Google.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStartFullBackup = async () => {
    setIsBackingUp(true);
    setBackupError(null);
    setBackupResult(null);
    setBackupProgressMsg("Starting Google Drive backup...");
    setBackupProgressPct(5);

    try {
      const result = await backupAllWebsiteDataToGoogleDrive(
        user?.email || "deepak.vasthusilpy@gmail.com",
        (status, pct) => {
          setBackupProgressMsg(status);
          setBackupProgressPct(pct);
        }
      );

      if (result.success) {
        setBackupResult(result);
        setHasToken(true);
      } else {
        setBackupError(result.error || "Backup failed.");
      }
    } catch (err: any) {
      setBackupError(err.message || "An unexpected error occurred during backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedSnapshotForRestore || !selectedSnapshotForRestore.masterFileId) {
      setRestoreErrorMsg("Selected backup has no master backup file.");
      return;
    }

    setIsRestoring(true);
    setRestoreProgressMsg("Initiating Google Drive restore...");
    setRestoreErrorMsg(null);
    setRestoreSuccessMsg(null);

    try {
      const res = await restoreBackupFromGoogleDrive(
        selectedSnapshotForRestore.masterFileId,
        restoreMode,
        (msg) => setRestoreProgressMsg(msg)
      );

      if (res.success) {
        setRestoreSuccessMsg(res.message);
        setSelectedSnapshotForRestore(null);
        if (onRestoreSuccess) onRestoreSuccess();
      } else {
        setRestoreErrorMsg(res.message);
      }
    } catch (err: any) {
      setRestoreErrorMsg(err.message || "Failed to restore backup from Google Drive.");
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Google Drive Cloud Backup & Restore
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Full Website Sync
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatic & manual cloud backup repository for all Vasthusilpy ERP datasets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Status Bar */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-xs gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("backup")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "backup"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              Backup Now
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                loadHistory();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Drive Snapshots & Restore
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "settings"
                  ? "bg-slate-700 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Cloud Settings
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Last Cloud Backup:{" "}
              <strong className="text-slate-200">{formatBackupDate(lastBackupTime)}</strong>
            </span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: BACKUP TO GOOGLE DRIVE */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              {/* Target Google Drive Folder Status & Direct Link */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <FolderOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-300">Target Google Drive Folder:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/40">
                        My Drive &gt; Vasthusilpy Cloud Backups
                      </span>
                      {rootFolderLink && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Ready on Drive
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {folderStatusMsg ||
                        (rootFolderLink
                          ? "Dedicated backup directory is verified and active on your Google Drive."
                          : "Click 'Create / Verify Folder' to ensure the backup folder is ready in your Google Drive.")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleCreateOrVerifyFolder(true)}
                    disabled={isCreatingFolder}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCreatingFolder ? "animate-spin text-emerald-400" : ""}`} />
                    {isCreatingFolder ? "Connecting Folder..." : rootFolderLink ? "Verify Folder" : "Create Folder on Drive"}
                  </button>
                  {rootFolderLink && (
                    <a
                      href={rootFolderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Folder in Drive
                    </a>
                  )}
                </div>
              </div>

              {/* Top Banner Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/20 shadow-inner">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-base font-bold text-white">
                        One-Click Complete Google Drive Cloud Backup
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Creates a dedicated timestamped backup bundle inside{" "}
                      <span className="text-emerald-400 font-mono font-semibold">"Vasthusilpy Cloud Backups"</span> on
                      your Google Drive, saving full master JSON, module datasets, and human-readable audit reports.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-stretch md:self-auto">
                    <button
                      onClick={handleStartFullBackup}
                      disabled={isBackingUp}
                      className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isBackingUp ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Backing Up Data...
                        </>
                      ) : (
                        <>
                          <Cloud className="w-4 h-4" />
                          Backup All Website Data Now
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Status */}
                {isBackingUp && (
                  <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-emerald-300 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        {backupProgressMsg}
                      </span>
                      <span className="text-emerald-400 font-mono">{backupProgressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                        style={{ width: `${backupProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {backupError && (
                  <div className="mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-300">Backup Error</p>
                      <p>{backupError}</p>
                      {!hasToken && (
                        <button
                          onClick={handleConnectGoogle}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
                        >
                          Sign in with Google to Authenticate
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {backupResult && backupResult.success && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        Website Data Successfully Backed Up to Google Drive!
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-mono text-[11px] font-bold border border-emerald-500/30">
                        {backupResult.backupId}
                      </span>
                    </div>
                    <p className="text-slate-300">
                      Saved {backupResult.totalFilesUploaded || 12} files inside folder:{" "}
                      <strong className="text-white font-mono">{backupResult.snapshotFolderName}</strong>
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {backupResult.snapshotFolderLink && (
                        <a
                          href={backupResult.snapshotFolderLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-all"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Open Snapshot on Google Drive →
                        </a>
                      )}
                      {backupResult.masterFileLink && (
                        <a
                          href={backupResult.masterFileLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-all"
                        >
                          <FileJson className="w-3.5 h-3.5 text-emerald-400" />
                          View Master JSON
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Scope Breakdown Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Complete Dataset Scope Included in Cloud Backup
                  </h4>
                  <span className="text-[11px] text-slate-500">Live Active Records</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-emerald-400">
                        {liveStats.siteInspections}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">Site Inspections</p>
                    <p className="text-[10px] text-slate-400">Field survey, GPS & media</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-blue-400">
                        {liveStats.crmProjects}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">CRM Projects</p>
                    <p className="text-[10px] text-slate-400">Stages, milestones & tasks</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-purple-400">
                        {liveStats.invoices}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">Invoices & Receipts</p>
                    <p className="text-[10px] text-slate-400">Tax bills & payment logs</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-amber-400">
                        {liveStats.estimates}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">Estimates & BOQ</p>
                    <p className="text-[10px] text-slate-400">Measurements & rates</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-teal-400">
                        {liveStats.customers}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">Client Directory</p>
                    <p className="text-[10px] text-slate-400">Contacts & locations</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                        <HardHat className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-indigo-400">
                        {liveStats.constructionProjects}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">Construction Works</p>
                    <p className="text-[10px] text-slate-400">Agreements & audit logs</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-rose-400">
                        {liveStats.personalBills}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">Personal & Office Bills</p>
                    <p className="text-[10px] text-slate-400">KSEB, RD, Insurance, Salary</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span className="text-base font-black font-mono text-cyan-400">
                        {liveStats.vaultFiles}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white">CAD Vault Files</p>
                    <p className="text-[10px] text-slate-400">Drawings index & metadata</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE SNAPSHOTS & RESTORE */}
          {activeTab === "history" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-indigo-400" />
                    Google Drive Backup Snapshots Repository
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live backups retrieved directly from your Google Drive cloud storage
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadHistory}
                    disabled={isLoadingHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? "animate-spin" : ""}`} />
                    Refresh Drive
                  </button>
                  {rootFolderLink && (
                    <a
                      href={rootFolderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Cloud Drive Folder
                    </a>
                  )}
                </div>
              </div>

              {/* Restore Result Notifications */}
              {restoreSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-emerald-300">System Restored Successfully!</p>
                    <p>{restoreSuccessMsg}</p>
                  </div>
                </div>
              )}

              {restoreErrorMsg && (
                <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-300">Restore Failed</p>
                    <p>{restoreErrorMsg}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoadingHistory ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">Scanning Google Drive for backup packages...</p>
                </div>
              ) : unauthorizedState || !hasToken ? (
                <div className="p-8 text-center space-y-4 bg-slate-950/60 rounded-2xl border border-slate-800 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Google Drive Sign-In Required</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Connect your Google Drive account to view and restore cloud backups.
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isAuthenticating}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isAuthenticating ? "Signing in..." : "Sign in with Google"}</span>
                  </button>
                </div>
              ) : historyError ? (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p>{historyError}</p>
                    <button
                      onClick={handleConnectGoogle}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold"
                    >
                      Reconnect Google Drive
                    </button>
                  </div>
                </div>
              ) : driveBackups.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <Cloud className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No Google Drive backups found yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click the "Backup Now" tab and create your first cloud backup snapshot.
                  </p>
                  <button
                    onClick={() => setActiveTab("backup")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Create Cloud Backup Now
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {driveBackups.map((item) => (
                    <div
                      key={item.folderId}
                      className={`p-4 rounded-xl border transition-all ${
                        selectedSnapshotForRestore?.folderId === item.folderId
                          ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">{item.folderName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {item.totalFiles} Cloud Files
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {formatBackupDate(item.createdTime)}
                            </span>
                            {item.masterFileSize && (
                              <span className="text-slate-500">
                                Size: {Math.round(Number(item.masterFileSize) / 1024)} KB
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <a
                            href={item.folderLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all text-xs flex items-center gap-1"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Drive
                          </a>

                          <button
                            onClick={() => setSelectedSnapshotForRestore(item)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              selectedSnapshotForRestore?.folderId === item.folderId
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                                : "bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30"
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Select for Restore
                          </button>
                        </div>
                      </div>

                      {/* Restore Confirmation Drawer if Selected */}
                      {selectedSnapshotForRestore?.folderId === item.folderId && (
                        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 bg-slate-900/60 p-3.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                              Restore Options for {item.folderName}:
                            </span>
                            <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Please select restore mode
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label
                              onClick={() => setRestoreMode("REPLACE")}
                              className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                                restoreMode === "REPLACE"
                                  ? "bg-rose-950/30 border-rose-500/80 text-rose-200"
                                  : "bg-slate-950/40 border-slate-800 text-slate-400"
                              }`}
                            >
                              <input
                                type="radio"
                                name="restoreMode"
                                checked={restoreMode === "REPLACE"}
                                onChange={() => setRestoreMode("REPLACE")}
                                className="mt-0.5 text-rose-600"
                              />
                              <div className="text-xs">
                                <p className="font-bold text-slate-200">Clean Replace (Overwrite)</p>
                                <p className="text-[11px] text-slate-400">
                                  Replaces current database state with this exact snapshot point.
                                </p>
                              </div>
                            </label>

                            <label
                              onClick={() => setRestoreMode("MERGE")}
                              className={`p-3 rounded-lg border cursor-pointer flex items-start gap-2.5 transition-all ${
                                restoreMode === "MERGE"
                                  ? "bg-emerald-950/30 border-emerald-500/80 text-emerald-200"
                                  : "bg-slate-950/40 border-slate-800 text-slate-400"
                              }`}
                            >
                              <input
                                type="radio"
                                name="restoreMode"
                                checked={restoreMode === "MERGE"}
                                onChange={() => setRestoreMode("MERGE")}
                                className="mt-0.5 text-emerald-600"
                              />
                              <div className="text-xs">
                                <p className="font-bold text-slate-200">Safe Merge</p>
                                <p className="text-[11px] text-slate-400">
                                  Combines snapshot data with existing records without deletion.
                                </p>
                              </div>
                            </label>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              onClick={() => setSelectedSnapshotForRestore(null)}
                              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleExecuteRestore}
                              disabled={isRestoring}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                              {isRestoring ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  {restoreProgressMsg || "Restoring..."}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Confirm & Restore Snapshot Now
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS & CLOUD CONFIGURATION */}
          {activeTab === "settings" && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Google Workspace & Cloud Drive Authorization
                </h3>
                <p className="text-xs text-slate-400">
                  Cloud backup communicates directly with your personal Google Drive account through encrypted OAuth tokens.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-white">Google Account</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {user?.email || "deepak.vasthusilpy@gmail.com"}
                    </p>
                  </div>
                  <button
                    onClick={handleConnectGoogle}
                    disabled={isAuthenticating}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-all cursor-pointer"
                  >
                    {isAuthenticating ? "Connecting..." : hasToken ? "Re-authorize Google Drive" : "Connect Google Drive"}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white">Target Google Drive Folder</p>
                        {rootFolderLink && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Verified on Drive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-400 font-mono font-semibold mt-0.5">
                        My Drive &gt; Vasthusilpy Cloud Backups
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        All master JSON backups, site inspections, CRM records, and audit summaries are preserved in this folder.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleCreateOrVerifyFolder(true)}
                        disabled={isCreatingFolder}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCreatingFolder ? "animate-spin text-emerald-400" : ""}`} />
                        {isCreatingFolder ? "Verifying..." : "Create / Verify in Drive"}
                      </button>
                      {rootFolderLink && (
                        <a
                          href={rootFolderLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Folder
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Backup Format & Security Standards
                </h4>
                <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                  <li>
                    <strong>Full Integrity JSON:</strong> Master backup file adheres to standard ISO schemas and contains complete relational graphs of all 10 modules.
                  </li>
                  <li>
                    <strong>Modular Extraction:</strong> Site inspections, invoices, estimates, and CRM leads are also saved in separate JSON files for independent inspection.
                  </li>
                  <li>
                    <strong>Zero-Data-Loss Tombstones:</strong> Deleted records are protected via deletion registries to prevent accidental ghost reappearance during multi-device sync.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vasthusilpy Cloud Drive Engine</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
