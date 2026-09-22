import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Download,
  Upload,
  Database,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  X,
  FileSpreadsheet,
  Receipt,
  FolderKanban,
  Users,
  Box,
  Check,
  Sparkles,
  ArrowRight,
  Info,
  Calendar,
  Clock,
  Trash2,
  History,
  Layers,
  HardHat,
  Wallet,
  Zap,
  Lock,
  RotateCcw
} from "lucide-react";
import {
  generateFullBackupPackage,
  downloadOfflineBackup,
  validateBackupFile,
  restoreBackupPackage,
  BackupValidationResult
} from "../../../utils/backupRestoreManager";
import {
  getDailySnapshots,
  createDailySnapshot,
  downloadDailySnapshotJson,
  restoreFromDailySnapshot,
  deleteDailySnapshot,
  detectPotentialDataLoss,
  DailySnapshotRecord
} from "../../../utils/dailySnapshotManager";

interface OfflineBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
  initialTab?: "backup" | "snapshots" | "restore" | "health";
}

export const OfflineBackupRestoreModal: React.FC<OfflineBackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
  initialTab = "backup"
}) => {
  const [activeTab, setActiveTab] = useState<"backup" | "snapshots" | "restore" | "health">(initialTab);

  // Backup State
  const [backupDownloaded, setBackupDownloaded] = useState<string | null>(null);

  // Snapshots State
  const [snapshots, setSnapshots] = useState<DailySnapshotRecord[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotActionMessage, setSnapshotActionMessage] = useState<string | null>(null);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<"REPLACE" | "MERGE">("REPLACE");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreCompletedMessage, setRestoreCompletedMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load daily snapshots and listen for updates
  const refreshSnapshots = () => {
    setSnapshots(getDailySnapshots());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSnapshots();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleSnapshotsUpdated = () => refreshSnapshots();
    window.addEventListener("vasthusilpy_snapshots_updated", handleSnapshotsUpdated);
    return () => {
      window.removeEventListener("vasthusilpy_snapshots_updated", handleSnapshotsUpdated);
    };
  }, []);

  // Compute live current local storage stats across all 7 tabs
  const liveStats = useMemo(() => {
    const pkg = generateFullBackupPackage();
    return {
      vaultFiles: pkg.dataStorageVault?.files?.length || 0,
      vaultFolders: pkg.dataStorageVault?.folders?.length || 0,
      constructionProjects: pkg.constructionWork?.projects?.length || 0,
      constructionAgreements: pkg.constructionWork?.agreements?.length || 0,
      quotations: pkg.quotation?.quotations?.length || 0,
      quotationServices: pkg.quotation?.services?.length || 0,
      estimates: (pkg.estimator?.estimates?.length ?? pkg.estimates?.length) || 0,
      rateItems: (pkg.estimator?.rateItems?.length ?? pkg.rateItems?.length) || 0,
      crmProjects: (pkg.crm?.projects?.length ?? pkg.crmProjects?.length) || 0,
      customers: (pkg.crm?.customers?.length ?? pkg.customers?.length) || 0,
      registeredTasks: (pkg.crm?.registeredTasks?.length ?? pkg.registeredTasks?.length) || 0,
      invoices: (pkg.invoicePayments?.invoices?.length ?? pkg.invoices?.length) || 0,
      personalBills:
        (pkg.personalBills?.poovMalaRows?.length || 0) +
        (pkg.personalBills?.ksebBills?.length || 0) +
        (pkg.personalBills?.vendorBills?.length || 0) +
        (pkg.personalBills?.staffSalary?.length || 0)
    };
  }, [isOpen, restoreCompletedMessage, snapshotActionMessage]);

  const totalLiveRecords = useMemo(() => {
    return (
      liveStats.vaultFiles +
      liveStats.vaultFolders +
      liveStats.constructionProjects +
      liveStats.constructionAgreements +
      liveStats.quotations +
      liveStats.estimates +
      liveStats.crmProjects +
      liveStats.customers +
      liveStats.invoices +
      liveStats.personalBills
    );
  }, [liveStats]);

  // Data loss audit check
  const dataLossAudit = useMemo(() => {
    if (!isOpen) return { hasPotentialDataLoss: false, emptyTabs: [] };
    return detectPotentialDataLoss();
  }, [isOpen, liveStats]);

  if (!isOpen) return null;

  // Handle Download Backup
  const handleDownload = () => {
    try {
      const res = downloadOfflineBackup();
      setBackupDownloaded(`Full Backup saved to device: ${res.filename} (${res.sizeKb} KB)`);
    } catch (err: any) {
      alert("Error generating backup: " + err.message);
    }
  };

  // Handle Create Daily Snapshot Now
  const handleTakeSnapshotNow = () => {
    setSnapshotLoading(true);
    try {
      const snap = createDailySnapshot(true);
      setSnapshotActionMessage(`Fresh daily snapshot created for ${snap.formattedDate} at ${snap.formattedTime}!`);
      refreshSnapshots();
    } catch (err: any) {
      alert("Error creating snapshot: " + err.message);
    } finally {
      setSnapshotLoading(false);
    }
  };

  // Handle Restore From Daily Snapshot
  const handleRestoreDailySnapshot = async (snap: DailySnapshotRecord) => {
    const confirmMsg =
      `Are you sure you want to restore the snapshot from ${snap.formattedDate} (${snap.formattedTime})?\n\n` +
      `Mode: ${restoreMode}\n` +
      `Records in Snapshot: ${snap.stats.totalRecords} total items across Vault, Construction, Quotation, Estimates, CRM, Invoices & Personal Bills.`;

    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    setRestoreError(null);
    try {
      const result = await restoreFromDailySnapshot(snap, restoreMode);
      if (result.success) {
        setRestoreCompletedMessage(`Successfully restored from Daily Snapshot [${snap.formattedDate}]: ${result.message}`);
        if (onRestoreSuccess) onRestoreSuccess();
      } else {
        setRestoreError(result.message);
      }
    } catch (err: any) {
      setRestoreError("Restore error: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle File Select for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestoreError(null);
    setRestoreCompletedMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRestoreFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const validated = validateBackupFile(text);
          setValidationResult(validated);
          if (!validated.isValid) {
            setRestoreError(validated.error || "Invalid backup file.");
          }
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle Restore Execution
  const handleExecuteRestore = async () => {
    if (!validationResult?.package) return;
    setIsRestoring(true);
    setRestoreError(null);

    try {
      const result = await restoreBackupPackage(validationResult.package, restoreMode);
      if (result.success) {
        setRestoreCompletedMessage(result.message);
        if (onRestoreSuccess) {
          onRestoreSuccess();
        }
      } else {
        setRestoreError(result.message);
      }
    } catch (err: any) {
      setRestoreError("Restore error: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleResetRestore = () => {
    setRestoreFile(null);
    setValidationResult(null);
    setRestoreCompletedMessage(null);
    setRestoreError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Vasthusilpy Backup & Data Protection Center
                </h3>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  ALL 7 MODULES
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Daily local storage snapshots, complete offline downloads & instant recovery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Potential Data Loss Alert Banner (Auto-detect) */}
        {dataLossAudit.hasPotentialDataLoss && dataLossAudit.recommendedSnapshot && (
          <div className="bg-amber-950/70 border-b border-amber-500/40 px-6 py-3 flex items-center justify-between gap-3 text-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                <strong>Data Protection Alert:</strong> {dataLossAudit.message}
              </span>
            </div>
            <button
              onClick={() => handleRestoreDailySnapshot(dataLossAudit.recommendedSnapshot!)}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono rounded-lg transition shrink-0 flex items-center gap-1.5 shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore from {dataLossAudit.lastAvailableSnapshotDate}
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 px-6 pt-3 flex gap-2 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("backup")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition border-t border-x ${
              activeTab === "backup"
                ? "bg-slate-900 border-slate-700 text-cyan-400 border-b-transparent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Complete Backup</span>
          </button>

          <button
            onClick={() => setActiveTab("snapshots")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition border-t border-x ${
              activeTab === "snapshots"
                ? "bg-slate-900 border-slate-700 text-cyan-400 border-b-transparent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Daily Snapshots</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded-full border border-cyan-500/30">
              {snapshots.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("restore")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition border-t border-x ${
              activeTab === "restore"
                ? "bg-slate-900 border-slate-700 text-cyan-400 border-b-transparent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore From File</span>
          </button>

          <button
            onClick={() => setActiveTab("health")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs font-bold transition border-t border-x ${
              activeTab === "health"
                ? "bg-slate-900 border-slate-700 text-cyan-400 border-b-transparent"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Health ({totalLiveRecords})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: COMPLETE BACKUP */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-cyan-400" />
                      Full System Offline Backup
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Exports an encrypted JSON file containing every file, folder, drawing, quotation, estimate, construction agreement, invoice, CRM record, and personal bill in your workspace.
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-900/30 transition shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD BACKUP JSON</span>
                  </button>
                </div>

                {backupDownloaded && (
                  <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{backupDownloaded}</span>
                  </div>
                )}
              </div>

              {/* Breakdown Across All 7 Tabs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                    Live Data In Workspace (All 7 Tabs Protected)
                  </h5>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    {totalLiveRecords} Total Items
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* 1. Data Storage Vault */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-sky-400 mb-1">
                      <FolderKanban className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Storage Vault</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.vaultFiles} <span className="text-xs text-slate-400 font-normal">files</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {liveStats.vaultFolders} folders organized
                    </div>
                  </div>

                  {/* 2. Construction Work */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <HardHat className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Construction</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.constructionProjects} <span className="text-xs text-slate-400 font-normal">works</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {liveStats.constructionAgreements} legal agreements
                    </div>
                  </div>

                  {/* 3. Quotation */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-violet-400 mb-1">
                      <Receipt className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Quotations</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.quotations} <span className="text-xs text-slate-400 font-normal">quotes</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {liveStats.quotationServices} catalog services
                    </div>
                  </div>

                  {/* 4. Estimator */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <FileSpreadsheet className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Estimator</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.estimates} <span className="text-xs text-slate-400 font-normal">estimates</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {liveStats.rateItems} master rate items
                    </div>
                  </div>

                  {/* 5. CRM */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-[11px] font-bold">CRM & Clients</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.crmProjects} <span className="text-xs text-slate-400 font-normal">projects</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {liveStats.customers} clients registered
                    </div>
                  </div>

                  {/* 6. Invoice Payments */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <Receipt className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Invoice Payments</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.invoices} <span className="text-xs text-slate-400 font-normal">invoices</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Payments & 20% slips
                    </div>
                  </div>

                  {/* 7. Personal Bills & Payments */}
                  <div className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-xl col-span-2">
                    <div className="flex items-center gap-2 text-purple-400 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-[11px] font-bold">Personal Bills & Payments</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white">
                      {liveStats.personalBills} <span className="text-xs text-slate-400 font-normal">bill records</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Poov Mala flower bills, KSEB electricity, Health Insurance, RD & Staff
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DAILY AUTO-SNAPSHOTS (LOCAL STORAGE) */}
          {activeTab === "snapshots" && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    Local Storage Daily Backups
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Snapshots are automatically saved into your browser's Local Storage every day. You can restore from today or any past day with a single click.
                  </p>
                </div>
                <button
                  onClick={handleTakeSnapshotNow}
                  disabled={snapshotLoading}
                  className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${snapshotLoading ? "animate-spin" : ""}`} />
                  <span>Take Snapshot For Today</span>
                </button>
              </div>

              {snapshotActionMessage && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{snapshotActionMessage}</span>
                </div>
              )}

              {/* Restore Mode Selector for Snapshots */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-300 font-mono">
                  When restoring a daily snapshot:
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRestoreMode("REPLACE")}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      restoreMode === "REPLACE"
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Clean Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode("MERGE")}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      restoreMode === "MERGE"
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Merge (Keep Existing)
                  </button>
                </div>
              </div>

              {/* Snapshots List */}
              {snapshots.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-300">No Daily Snapshots Yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Take Snapshot For Today" above to create your first automated daily snapshot.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {snapshots.map((snap, idx) => (
                    <div
                      key={snap.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-bold text-white font-mono">
                            {snap.formattedDate}
                          </span>
                          {idx === 0 && (
                            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                              LATEST SNAPSHOT
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-mono">
                            at {snap.formattedTime}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ({snap.sizeKb} KB)
                          </span>
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1 font-mono">
                          <span>📁 Vault: {snap.stats.vaultFiles}</span>
                          <span>🏗️ Construction: {snap.stats.constructionProjects}</span>
                          <span>📄 Quotes: {snap.stats.quotations}</span>
                          <span>📊 Estimates: {snap.stats.estimates}</span>
                          <span>👥 CRM: {snap.stats.crmProjects}</span>
                          <span>🧾 Invoices: {snap.stats.invoices}</span>
                          <span>💳 Bills: {snap.stats.personalBills}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleRestoreDailySnapshot(snap)}
                          disabled={isRestoring}
                          className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>1-Click Restore</span>
                        </button>

                        <button
                          onClick={() => downloadDailySnapshotJson(snap)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs transition cursor-pointer"
                          title="Download this day's snapshot as JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete snapshot for ${snap.formattedDate}?`)) {
                              deleteDailySnapshot(snap.id);
                              refreshSnapshots();
                            }
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl text-xs transition cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESTORE FROM FILE */}
          {activeTab === "restore" && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Restore From JSON Backup File
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a previously exported Vasthusilpy ERP backup file to restore your entire database across all 7 tabs.
                </p>

                {/* File Picker */}
                <div className="mt-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="backup-file-upload"
                  />
                  <label
                    htmlFor="backup-file-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 bg-slate-900/50 hover:bg-slate-900 transition cursor-pointer text-center"
                  >
                    <FileJson className="w-10 h-10 text-cyan-400 mb-2" />
                    <span className="text-sm font-bold text-white">
                      {restoreFile ? restoreFile.name : "Click to select or drag backup JSON file"}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 font-mono">
                      {restoreFile
                        ? `${Math.round(restoreFile.size / 1024)} KB`
                        : "Supports all versions of Vasthusilpy Offline Backups"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Pre-Restore Inspection Summary */}
              {validationResult?.package && (
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm font-bold text-white">
                        Backup File Verified & Ready
                      </span>
                    </div>
                    <span className="text-xs font-mono text-cyan-400">
                      Exported: {validationResult.summary?.exportedAtFormatted}
                    </span>
                  </div>

                  {/* Summary of Items to be Restored */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Vault Files</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.vaultFilesCount ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Construction</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.constructionProjectsCount ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Quotations</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.quotationsCount ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Estimates</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.estimatesCount ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">CRM Projects</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.crmProjectsCount ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Invoices</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.invoicesCount ?? 0}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 col-span-2">
                      <span className="text-slate-400 block text-[10px]">Personal Bills</span>
                      <span className="text-white font-bold text-sm">
                        {validationResult.summary?.personalBillsCount ?? 0}
                      </span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-white block">
                      Choose Restore Mode:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          restoreMode === "REPLACE"
                            ? "bg-cyan-950/30 border-cyan-500/60 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="REPLACE"
                          checked={restoreMode === "REPLACE"}
                          onChange={() => setRestoreMode("REPLACE")}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-bold text-xs block">Clean Replace</span>
                          <span className="text-[11px] text-slate-400">
                            Replaces current records with this backup snapshot.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          restoreMode === "MERGE"
                            ? "bg-cyan-950/30 border-cyan-500/60 text-white"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="restoreMode"
                          value="MERGE"
                          checked={restoreMode === "MERGE"}
                          onChange={() => setRestoreMode("MERGE")}
                          className="mt-1"
                        />
                        <div>
                          <span className="font-bold text-xs block">Merge (Safest)</span>
                          <span className="text-[11px] text-slate-400">
                            Combines backup items with current records without deleting anything.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleResetRestore}
                      className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Clear File
                    </button>

                    <button
                      onClick={handleExecuteRestore}
                      disabled={isRestoring}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Restoring Data...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>EXECUTE RESTORE ({restoreMode})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {restoreError && (
                <div className="p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{restoreError}</span>
                </div>
              )}

              {/* Success Message */}
              {restoreCompletedMessage && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{restoreCompletedMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DATA HEALTH & LOSS PROTECTION */}
          {activeTab === "health" && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Anti-Data-Loss Shield Status: Active
                      </h4>
                      <p className="text-xs text-slate-400">
                        Local storage daily snapshots are actively monitoring data integrity across all 7 tabs.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
                    ALL TABS PROTECTED
                  </span>
                </div>
              </div>

              {/* Status Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">
                    Module / Tab Name
                  </span>
                  <span className="text-xs font-mono font-bold uppercase text-slate-400">
                    Live Record Count
                  </span>
                </div>

                <div className="divide-y divide-slate-800/60 text-xs font-mono">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-sky-400" />
                      1. Data Storage Vault
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.vaultFiles} files ({liveStats.vaultFolders} folders)
                    </span>
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-amber-400" />
                      2. Construction Work
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.constructionProjects} projects ({liveStats.constructionAgreements} agreements)
                    </span>
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-violet-400" />
                      3. Quotation
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.quotations} quotes ({liveStats.quotationServices} services)
                    </span>
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      4. Estimator
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.estimates} estimates ({liveStats.rateItems} rates)
                    </span>
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      5. CRM & Clients
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.crmProjects} projects ({liveStats.customers} clients)
                    </span>
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-rose-400" />
                      6. Invoice Payments
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.invoices} invoices & receipts
                    </span>
                  </div>

                  <div className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-purple-400" />
                      7. Personal Bills & Payments
                    </span>
                    <span className="font-bold text-white">
                      {liveStats.personalBills} entries (Poov Mala, KSEB, Health, RD, Staff)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Vasthusilpy Multi-Layer Local Storage & Cloud Protection</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
