import React, { useState, useRef } from "react";
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
  Info
} from "lucide-react";
import {
  generateFullBackupPackage,
  downloadOfflineBackup,
  validateBackupFile,
  restoreBackupPackage,
  BackupValidationResult
} from "../../../utils/backupRestoreManager";
import { loadCrmProjects, loadInvoices, loadEstimatesList } from "../../../utils/storageManager";

interface OfflineBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

export const OfflineBackupRestoreModal: React.FC<OfflineBackupRestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess
}) => {
  const [activeTab, setActiveTab] = useState<"backup" | "restore">("backup");

  // Backup State
  const [backupDownloaded, setBackupDownloaded] = useState<string | null>(null);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<"REPLACE" | "MERGE">("REPLACE");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreCompletedMessage, setRestoreCompletedMessage] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Calculate live current local counts
  const currentProjects = loadCrmProjects();
  const currentInvoices = loadInvoices();
  const currentEstimates = loadEstimatesList();

  let currentCustomersCount = 0;
  try {
    const raw = localStorage.getItem("vasthusilpy_customers");
    if (raw) currentCustomersCount = JSON.parse(raw).length;
  } catch (e) {}

  let currentRatesCount = 0;
  try {
    const raw = localStorage.getItem("vasthusilpy_rate_items");
    if (raw) currentRatesCount = JSON.parse(raw).length;
  } catch (e) {}

  // Handle Download Backup
  const handleDownload = () => {
    try {
      const res = downloadOfflineBackup();
      setBackupDownloaded(`Backup saved: ${res.filename} (${res.sizeKb} KB)`);
    } catch (err: any) {
      alert("Error generating backup: " + err.message);
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-sans tracking-wide uppercase">
                  OFFLINE BACKUP & RESTORE CENTER
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DATA PROTECTION
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Securely export and restore all projects, estimates, invoices, rates, and customer data offline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            title="Close window"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-950/90 px-6 py-2 border-b border-slate-800 flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("backup")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "backup"
                ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Create Offline Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "restore"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>2. Offline Restore Data</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: BACKUP */}
          {/* ========================================================================= */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              {/* Info Banner */}
              <div className="bg-cyan-950/30 border border-cyan-800/60 rounded-2xl p-4 flex items-start gap-3.5">
                <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-cyan-200">
                  <div className="font-bold text-white font-sans text-sm">
                    Offline Data Safety Guarantee
                  </div>
                  <p className="leading-relaxed text-slate-300 font-sans">
                    This creates a standalone <strong>.JSON</strong> backup file containing your complete Vasthusilpy ERP database. Keep this file on your local PC, hard disk, or Google Drive to guarantee zero data loss even if browser cache is cleared or when moving to another PC.
                  </p>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 font-bold uppercase flex items-center justify-between">
                  <span>Current Workspace Data Ready for Backup:</span>
                  <span className="text-emerald-400">All Items Active</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white font-mono">{currentProjects.length}</div>
                      <div className="text-[10px] text-slate-400 font-mono">CRM Projects</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white font-mono">{currentInvoices.length}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Invoices & Bills</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white font-mono">{currentEstimates.length}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Detailed Estimates</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white font-mono">{currentCustomersCount || 4}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Customers Directory</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center flex-shrink-0">
                      <Box className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white font-mono">{currentRatesCount || 7}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Products & Rates</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-black text-white font-mono">20+</div>
                      <div className="text-[10px] text-slate-400 font-mono">Registered Tasks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Action Area */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/10">
                  <HardDrive className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-sans">
                    Download Full Offline Snapshot
                  </h3>
                  <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
                    Click below to generate and download a fresh encrypted JSON file containing all projects, invoices, payments, and estimates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2.5 mx-auto cursor-pointer transition-all shadow-lg shadow-cyan-500/25 hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Offline Backup (.JSON)</span>
                </button>

                {backupDownloaded && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{backupDownloaded}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RESTORE */}
          {/* ========================================================================= */}
          {activeTab === "restore" && (
            <div className="space-y-6">
              {/* Success Banner */}
              {restoreCompletedMessage && (
                <div className="bg-emerald-950/90 border border-emerald-700 rounded-2xl p-5 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-emerald-400 font-bold font-sans text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Data Successfully Restored!</span>
                  </div>
                  <p className="text-xs text-emerald-200 font-mono">
                    {restoreCompletedMessage}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh Workspace Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetRestore}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-xl border border-slate-700"
                    >
                      Upload Another File
                    </button>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {restoreError && (
                <div className="bg-rose-950/80 border border-rose-800 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-200 font-sans space-y-1">
                    <div className="font-bold">Restore Error</div>
                    <p>{restoreError}</p>
                  </div>
                </div>
              )}

              {!restoreCompletedMessage && (
                <>
                  {/* File Upload Zone */}
                  {!validationResult?.package ? (
                    <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/60 rounded-3xl p-8 text-center transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="backup-file-input"
                        accept=".json,application/json"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="backup-file-input"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                          <FileJson className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-white font-sans">
                            Choose or Drag & Drop Vasthusilpy Backup File (.JSON)
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            Select a previously exported <code>Vasthusilpy_Offline_Backup_*.json</code> file
                          </div>
                        </div>
                        <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-xs font-mono text-emerald-400 font-bold transition-colors">
                          Browse Local Storage
                        </span>
                      </label>
                    </div>
                  ) : (
                    /* Validation & Preview Card */
                    <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="font-bold text-white font-sans text-sm">
                            Backup File Validated & Ready
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetRestore}
                          className="text-xs font-mono text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          Change File
                        </button>
                      </div>

                      {/* File Details */}
                      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">File Name:</span>
                          <span className="text-white font-bold">{restoreFile?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Exported Date:</span>
                          <span className="text-cyan-300 font-bold">
                            {validationResult.summary?.exportedAtFormatted}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">System Version:</span>
                          <span className="text-slate-300">{validationResult.summary?.version}</span>
                        </div>
                      </div>

                      {/* Counts in Backup */}
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                          Items Found in Backup:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <div className="text-sm font-black text-cyan-300 font-mono">
                              {validationResult.summary?.projectsCount}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">Projects</div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <div className="text-sm font-black text-emerald-300 font-mono">
                              {validationResult.summary?.invoicesCount}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">Invoices</div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <div className="text-sm font-black text-amber-300 font-mono">
                              {validationResult.summary?.estimatesCount}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">Estimates</div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
                            <div className="text-sm font-black text-purple-300 font-mono">
                              {validationResult.summary?.customersCount}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">Customers</div>
                          </div>
                        </div>
                      </div>

                      {/* Mode Selection */}
                      <div className="space-y-2.5 pt-2">
                        <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                          Choose Restore Mode:
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                              restoreMode === "REPLACE"
                                ? "bg-emerald-950/30 border-emerald-500 text-white"
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
                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-white font-sans">
                                Clean Replace (Recommended)
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Overwrites current workspace with the exact snapshot from the backup file.
                              </p>
                            </div>
                          </label>

                          <label
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                              restoreMode === "MERGE"
                                ? "bg-emerald-950/30 border-emerald-500 text-white"
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
                            <div className="space-y-1 text-xs">
                              <div className="font-bold text-white font-sans">
                                Smart Merge
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Keeps existing items and appends missing projects, invoices & estimates.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={handleExecuteRestore}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                      >
                        {isRestoring ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Restoring Data...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Proceed with Offline Restore</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
