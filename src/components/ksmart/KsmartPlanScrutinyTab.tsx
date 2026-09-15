import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  FileCode,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Globe,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Upload,
  FolderOpen,
  Download,
  Info,
  CheckCircle2,
  FileText,
  Building2,
  Compass,
  Ruler
} from "lucide-react";
import { CADDrawingRecord } from "../../types/dataStorageTypes";
import { getStoredCADFiles, formatBytes } from "../../utils/dataStorageManager";

export const KsmartPlanScrutinyTab: React.FC = () => {
  const KSMART_SCRUTINY_URL = "https://ksmart.lsgkerala.gov.in/ui/building-permit/scrutinize-your-building-plan";
  
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  // Available CAD Vault Files
  const [vaultFiles, setVaultFiles] = useState<CADDrawingRecord[]>([]);
  const [selectedVaultFileId, setSelectedVaultFileId] = useState<string>("");
  const [uploadedCustomFile, setUploadedCustomFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [copiedFilename, setCopiedFilename] = useState<boolean>(false);

  // Pre-Scrutiny Checklist State
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    plotClosed: true,
    buildingPlinth: true,
    roadCenterline: true,
    setbackDim: true,
    floorHeight: true,
    aciColors: true,
    stairHeadroom: true,
    noOverlap: true
  });

  useEffect(() => {
    try {
      const files = getStoredCADFiles();
      setVaultFiles(files);
      if (files.length > 0) {
        setSelectedVaultFileId(files[0].id);
      }
    } catch (err) {
      console.warn("Could not load CAD Vault files for scrutiny:", err);
    }
  }, []);

  const selectedFile = vaultFiles.find((f) => f.id === selectedVaultFileId);

  const activeDrawingName = uploadedCustomFile
    ? uploadedCustomFile.name
    : selectedFile
    ? selectedFile.name
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(KSMART_SCRUTINY_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(KSMART_SCRUTINY_URL, "_blank", "noopener,noreferrer");
  };

  const handleRefreshIframe = () => {
    setIframeLoaded(false);
    setIframeKey((prev) => prev + 1);
  };

  const handleCopyFileName = () => {
    if (!activeDrawingName) return;
    navigator.clipboard.writeText(activeDrawingName);
    setCopiedFilename(true);
    setTimeout(() => setCopiedFilename(false), 2000);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedCustomFile({
        name: file.name,
        size: file.size,
        type: file.name.split(".").pop()?.toUpperCase() || "CAD"
      });
      setSelectedVaultFileId("");
    }
  };

  const toggleChecklistItem = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalChecklist = Object.keys(checklist).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900/95 p-6 rounded-2xl border border-indigo-800/60 shadow-xl bg-blueprint-grid text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl text-slate-950 shadow-lg shadow-indigo-500/20 shrink-0">
            <FileCode className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded border border-indigo-800">
                K-SMART AUTO-DCR SCRUTINY SUITE
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                BUILDING PLAN VERIFICATION
              </span>
            </div>
            <h2 className="text-2xl font-black font-sans text-white tracking-tight flex items-center gap-2">
              <span>K-SMART CAD പ്ലാൻ സ്ക്രൂട്ടീനി (CAD Plan Scrutiny)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              തദ്ദേശ സ്വയംഭരണ വകുപ്പിന്റെ (LSGD Kerala) ഔദ്യോഗിക K-SMART Auto-DCR പോർട്ടൽ വഴി CAD ഡ്രോയിംഗുകൾ സ്ക്രൂട്ടീനി ചെയ്ത് KPBR/KMBR നിയമ അനുസൃതത പരിശോധിക്കുക.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>OPEN SCRUTINY SUITE</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-mono text-xs font-semibold transition cursor-pointer"
            title="Copy scrutiny portal link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? "COPIED" : "COPY LINK"}</span>
          </button>

          <button
            onClick={handleRefreshIframe}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Embedded Portal"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CAD Plan Selection & Quick Scrutiny Pre-Flight Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Select CAD File from Vault or Upload */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span>സ്ക്രൂട്ടീനിക്കുള്ള CAD പ്ലാൻ തിരഞ്ഞെടുക്കുക (Attached CAD File)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              AutoCAD .DWG / .DXF
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Pick from CAD Vault */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-400">
                1. SELECT FROM OFFICE CAD VAULT:
              </label>
              <select
                value={selectedVaultFileId}
                onChange={(e) => {
                  setSelectedVaultFileId(e.target.value);
                  setUploadedCustomFile(null);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {vaultFiles.length === 0 ? (
                  <option value="">No files in CAD Vault (Add in Data Storage)</option>
                ) : (
                  vaultFiles.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.name} ({file.fileType || "CAD"})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Direct File Picker */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-400">
                2. OR SELECT LOCAL CAD DRAWING:
              </label>
              <label className="flex items-center justify-center gap-2 w-full bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">
                  {uploadedCustomFile ? uploadedCustomFile.name : "Browse .dwg / .dxf file..."}
                </span>
                <input
                  type="file"
                  accept=".dwg,.dxf,.pdf"
                  onChange={handleCustomFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Active File Summary Card */}
          {activeDrawingName ? (
            <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-950 border border-indigo-800/80 rounded-lg text-indigo-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold truncate flex items-center gap-2">
                    <span>{activeDrawingName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700">
                      {uploadedCustomFile
                        ? uploadedCustomFile.type
                        : selectedFile?.fileType || "DWG"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>
                      Size:{" "}
                      {uploadedCustomFile
                        ? formatBytes(uploadedCustomFile.size)
                        : selectedFile
                        ? formatBytes(selectedFile.fileSize)
                        : "N/A"}
                    </span>
                    {selectedFile?.projectCode && <span>Project: {selectedFile.projectCode}</span>}
                    {selectedFile?.location && <span>Location: {selectedFile.location}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopyFileName}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy drawing filename"
                >
                  {copiedFilename ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedFilename ? "COPIED" : "COPY NAME"}</span>
                </button>
                <button
                  onClick={handleOpenExternal}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Scrutinize on KSMART</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Select a CAD drawing above to verify its Auto-DCR layers and submit for scrutiny.</span>
            </div>
          )}
        </div>

        {/* Right: Quick Auto-DCR Compliance Checklist */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Auto-DCR പ്രീ-ചെക്ക്‌ലിസ്റ്റ് (Pre-Check)</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {checkedCount}/{totalChecklist} PASSED
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-mono text-slate-300">
            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checklist.plotClosed}
                onChange={() => toggleChecklistItem("plotClosed")}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="truncate">0_Plot (Closed LWPOLYLINE)</span>
            </label>

            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checklist.buildingPlinth}
                onChange={() => toggleChecklistItem("buildingPlinth")}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="truncate">0_Bldg_Plinth & Floor Polygons</span>
            </label>

            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checklist.roadCenterline}
                onChange={() => toggleChecklistItem("roadCenterline")}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="truncate">0_Road_Centerline & Width</span>
            </label>

            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checklist.setbackDim}
                onChange={() => toggleChecklistItem("setbackDim")}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="truncate">0_Setback (Front, Rear, Sides)</span>
            </label>

            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition">
              <input
                type="checkbox"
                checked={checklist.noOverlap}
                onChange={() => toggleChecklistItem("noOverlap")}
                className="rounded border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="truncate">No Self-Intersecting Polylines</span>
            </label>
          </div>
        </div>
      </div>

      {/* Embedded Portal Container */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden min-h-[680px] flex flex-col">
        {/* Portal Address Bar Header */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">HTTPS://</span>
            <span className="text-indigo-300 font-bold truncate">
              ksmart.lsgkerala.gov.in/ui/building-permit/scrutinize-your-building-plan
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleCopyLink}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copy Link</span>
            </button>
            <a
              href={KSMART_SCRUTINY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-indigo-400 transition"
            >
              <span>Direct Link</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Iframe Viewport */}
        <div className="relative flex-1 bg-slate-950">
          {!iframeLoaded && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4 z-10">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-200">
                  LOADING KSMART BUILDING PLAN SCRUTINY SUITE...
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connecting to Kerala LSGD Auto-DCR Scrutiny Engine...
                </p>
              </div>
              <button
                onClick={handleOpenExternal}
                className="mt-2 text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Click here to open Scrutinize Portal in new tab if embed is restricted</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={KSMART_SCRUTINY_URL}
            title="KSMART Building Plan Scrutiny Suite"
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-[700px] border-0"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
          />
        </div>
      </div>

      {/* Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scrutiny Procedure Card */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-950 border border-indigo-800 rounded-xl text-indigo-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Auto-DCR പ്ലാൻ സ്ക്രൂട്ടീനി ചെയ്യുന്ന വിധം</h3>
              <p className="text-xs text-slate-400 font-mono">How to Scrutinize Building Plan in K-SMART</p>
            </div>
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-sans">
            <li>
              <strong>CAD ഡ്രോയിംഗ് അപ്‌ലോഡ് ചെയ്യുക:</strong> K-SMART മാനദണ്ഡങ്ങൾ പാലിച്ചുള്ള 2D AutoCAD (.dwg/.dxf) ഫയൽ പോർട്ടലിലേക്ക് അപ്‌ലോഡ് ചെയ്യുക.
            </li>
            <li>
              <strong>ഓട്ടോമാറ്റിക് വെരിഫിക്കേഷൻ:</strong> KPBR/KMBR ചട്ടങ്ങൾ അനുസരിച്ചുള്ള സെറ്റ്‌ബാക്ക് (Setback), കവറേജ് (Coverage), FSI, പാർക്കിംഗ്, റൂം അളവുകൾ സിസ്റ്റം സ്വയം പരിശോധിക്കും.
            </li>
            <li>
              <strong>സ്ക്രൂട്ടീനി റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യുക:</strong> ലഭിക്കുന്ന Scrutiny Report പ്രകാരം എന്തെങ്കിലും തെറ്റുകൾ ഉണ്ടെങ്കിൽ തിരുത്തി വീണ്ടും പരിശോധിക്കാം.
            </li>
          </ul>
        </div>

        {/* Essential Auto-DCR Requirements Card */}
        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">പ്രധാന CAD ഡ്രോയിംഗ് നിബന്ധനകൾ</h3>
              <p className="text-xs text-slate-400 font-mono">Essential Auto-DCR Drawing Mandates</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Plot boundary strictly closed</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Standard ACI color codes</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>No zero-length polyline segments</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>True North arrow in degree</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
