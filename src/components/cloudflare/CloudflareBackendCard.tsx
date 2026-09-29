import React, { useState, useEffect } from "react";
import {
  Globe,
  Zap,
  Server,
  Database,
  HardDrive,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  Check,
  Download,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Code2,
  Save
} from "lucide-react";
import {
  CloudflareConfig,
  getStoredCloudflareConfig,
  saveStoredCloudflareConfig,
  pingCloudflareBackend,
  syncAppDataToCloudflareKV,
  generateWranglerToml,
  generateWorkerScript
} from "../../utils/cloudflareManager";

export const CloudflareBackendCard: React.FC = () => {
  const [config, setConfig] = useState<CloudflareConfig>(() => getStoredCloudflareConfig());
  const [status, setStatus] = useState<"idle" | "testing" | "online" | "error">("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "config" | "wrangler" | "worker">("status");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    handlePing();
  }, []);

  const handlePing = async () => {
    setStatus("testing");
    setStatusMessage("Pinging Cloudflare Worker Edge...");
    const res = await pingCloudflareBackend(config.workerUrl);
    if (res.success) {
      setStatus("online");
      setLatency(res.latencyMs);
      setStatusMessage(`Connected to Edge (${res.latencyMs}ms latency). Service active.`);
    } else {
      setStatus("error");
      setLatency(res.latencyMs);
      setStatusMessage(res.error || "Could not reach Cloudflare Worker.");
    }
  };

  const handleSaveConfig = () => {
    setIsSaving(true);
    saveStoredCloudflareConfig(config);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Cloudflare Backend configuration saved!");
      handlePing();
    }, 400);
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    const sampleData = {
      appName: "Vasthusilpy Engineering Systems",
      updatedAt: new Date().toISOString(),
      authorizedUsersCount: 1,
      version: "2026.9.1"
    };
    const res = await syncAppDataToCloudflareKV("app_master_status", sampleData);
    setIsSyncing(false);
    if (res.success) {
      showToast("App data successfully synced to Cloudflare KV Edge!");
    } else {
      showToast("Failed to sync data: " + res.message);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const wranglerToml = generateWranglerToml(config);
  const workerCode = generateWorkerScript();

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 shadow-2xl text-white backdrop-blur-xl space-y-6 relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Toast Banner */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Cloudflare Backend Support</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                Edge Workers & KV
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Vasthusilpy Portal Edge Backend, KV Caching & D1 Relational Storage
            </p>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePing}
            disabled={status === "testing"}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === "testing" ? "animate-spin" : ""}`} />
            <span>Test Edge Ping</span>
          </button>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
              status === "online"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : status === "error"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                status === "online"
                  ? "bg-emerald-400 animate-pulse"
                  : status === "error"
                  ? "bg-rose-500"
                  : "bg-amber-400 animate-spin"
              }`}
            />
            <span>
              {status === "online"
                ? `ACTIVE (${latency ? `${latency}ms` : "OK"})`
                : status === "error"
                ? "DISCONNECTED"
                : "CHECKING..."}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("status")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "status"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Edge Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "config"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Worker Settings</span>
        </button>

        <button
          onClick={() => setActiveTab("wrangler")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "wrangler"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>wrangler.toml</span>
        </button>

        <button
          onClick={() => setActiveTab("worker")}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "worker"
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Worker Script</span>
        </button>
      </div>

      {/* Tab 1: Edge Overview & Live Status */}
      {activeTab === "status" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Worker URL</span>
              </div>
              <p className="text-xs font-mono font-semibold text-amber-200 truncate" title={config.workerUrl}>
                {config.workerUrl || "https://vasthusilpy-backend.workers.dev"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-orange-400" />
                <span>KV Namespace</span>
              </div>
              <p className="text-xs font-mono font-semibold text-slate-200">
                {config.kvNamespaceId ? config.kvNamespaceId : "VASTHUSILPY_KV (Active)"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edge Speed</span>
              </div>
              <p className="text-xs font-mono font-semibold text-emerald-300">
                {latency ? `${latency} ms response` : "Sub-50ms Global CDN"}
              </p>
            </div>
          </div>

          {/* Status Alert Box */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
              status === "online"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
                : "bg-slate-800/80 border-amber-500/30 text-amber-200"
            }`}
          >
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-white">
                {status === "online" ? "Cloudflare Edge Backend Connected" : "Cloudflare Backend Ready for Deployment"}
              </p>
              <p className="text-slate-300 text-xs">
                {statusMessage ||
                  "Your application is supported by Cloudflare Workers for edge proxying, KV caching, and sub-millisecond response times."}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSyncData}
              disabled={isSyncing}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing to Cloudflare...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-slate-950" />
                  <span>Sync Master Data to Cloudflare KV</span>
                </>
              )}
            </button>

            <button
              onClick={() => copyToClipboard(wranglerToml, "wrangler_config")}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold border border-white/10 flex items-center gap-2 cursor-pointer transition-all"
            >
              {copiedField === "wrangler_config" ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Config Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Copy wrangler.toml</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Worker Settings */}
      {activeTab === "config" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloudflare Worker Endpoint URL</span>
              </label>
              <input
                type="text"
                value={config.workerUrl}
                onChange={(e) => setConfig({ ...config, workerUrl: e.target.value })}
                placeholder="https://vasthusilpy-backend.workers.dev"
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span>Account ID (Optional)</span>
              </label>
              <input
                type="text"
                value={config.accountId}
                onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                placeholder="e.g. 1a2b3c4d5e6f7g8h"
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>KV Namespace ID</span>
              </label>
              <input
                type="text"
                value={config.kvNamespaceId}
                onChange={(e) => setConfig({ ...config, kvNamespaceId: e.target.value })}
                placeholder="e.g. a1b2c3d4e5f6_vasthusilpy_kv"
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-teal-400" />
                <span>R2 Bucket Name</span>
              </label>
              <input
                type="text"
                value={config.r2BucketName}
                onChange={(e) => setConfig({ ...config, r2BucketName: e.target.value })}
                placeholder="vasthusilpy-storage"
                className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: wrangler.toml Preview */}
      {activeTab === "wrangler" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Root file: wrangler.toml</span>
            <button
              onClick={() => copyToClipboard(wranglerToml, "wrangler")}
              className="hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedField === "wrangler" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === "wrangler" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-white/15 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed">
            {wranglerToml}
          </pre>
        </div>
      )}

      {/* Tab 4: Cloudflare Worker Code */}
      {activeTab === "worker" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Worker script: cloudflare-worker.js</span>
            <button
              onClick={() => copyToClipboard(workerCode, "worker_code")}
              className="hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              {copiedField === "worker_code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === "worker_code" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-950 border border-white/15 text-amber-300/90 font-mono text-xs overflow-x-auto max-h-60 leading-relaxed">
            {workerCode}
          </pre>
        </div>
      )}
    </div>
  );
};
