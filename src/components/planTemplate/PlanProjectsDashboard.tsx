import React, { useState } from "react";
import { BuildingPlanProject } from "../../types/buildingPlanTemplate";
import {
  generateDirectProjectVectorPdf,
  downloadBlob,
  shareProjectViaWhatsApp,
  shareProjectViaEmail,
  formatProjectWhatsAppMessage
} from "../../utils/planExportUtils";
import {
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Copy,
  FileDown,
  Layers,
  Building2,
  Sparkles,
  MapPin,
  User,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Grid,
  List,
  Compass,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Mail,
  MessageSquare,
  Share2,
  Check,
  Loader2,
  ExternalLink,
  Send,
  X
} from "lucide-react";

interface PlanProjectsDashboardProps {
  projects: BuildingPlanProject[];
  onSelectProjectForEdit: (project: BuildingPlanProject) => void;
  onSelectProjectForView: (project: BuildingPlanProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: BuildingPlanProject) => void;
  onCreateNewProject: () => void;
  onQuickExportPdf?: (project: BuildingPlanProject) => void;
}

export const PlanProjectsDashboard: React.FC<PlanProjectsDashboardProps> = ({
  projects,
  onSelectProjectForEdit,
  onSelectProjectForView,
  onDeleteProject,
  onDuplicateProject,
  onCreateNewProject,
  onQuickExportPdf
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [projectToDelete, setProjectToDelete] = useState<BuildingPlanProject | null>(null);
  const [shareModalProject, setShareModalProject] = useState<BuildingPlanProject | null>(null);
  const [exportingProjectId, setExportingProjectId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Instant PDF Download directly from dashboard
  const handleDownloadPdf = async (project: BuildingPlanProject) => {
    setExportingProjectId(project.id);
    showToast(`Generating A4 Landscape PDF for "${project.projectTitle}"...`);

    try {
      if (onQuickExportPdf) {
        onQuickExportPdf(project);
      } else {
        const blob = await generateDirectProjectVectorPdf(project);
        const filename = `${(project.clientName || "Building_Plan").replace(/[^a-zA-Z0-9_-]/g, "_")}_Architectural_Drawings.pdf`;
        downloadBlob(blob, filename);
      }
      showToast(`A4 PDF for "${project.clientName}" downloaded successfully!`);
    } catch (err) {
      console.error("Dashboard PDF export error:", err);
      showToast("PDF generation started. Please check downloads.");
    } finally {
      setTimeout(() => setExportingProjectId(null), 800);
    }
  };

  // Instant WhatsApp Send
  const handleSendWhatsApp = (project: BuildingPlanProject) => {
    shareProjectViaWhatsApp(project);
    showToast(`Opening WhatsApp with drawing specs for ${project.clientName}...`);
  };

  // Instant Email Send
  const handleSendMail = (project: BuildingPlanProject) => {
    shareProjectViaEmail(project);
    showToast(`Opening Mail client for ${project.clientName}...`);
  };

  // Copy Formatted Share Message
  const handleCopyText = (project: BuildingPlanProject) => {
    const text = formatProjectWhatsAppMessage(project);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showToast("Project specifications copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filter projects by search term
  const filteredProjects = projects.filter((p) => {
    const term = searchQuery.toLowerCase();
    return (
      p.projectTitle.toLowerCase().includes(term) ||
      p.clientName.toLowerCase().includes(term) ||
      p.projectLocation.toLowerCase().includes(term) ||
      p.licenseeName.toLowerCase().includes(term) ||
      p.registrationNumber.toLowerCase().includes(term) ||
      p.sheets.some((s) => s.drawingNumber.toLowerCase().includes(term) || s.drawingName.toLowerCase().includes(term))
    );
  });

  // Calculate high-level stats
  const totalProjects = projects.length;
  const totalSheets = projects.reduce((sum, p) => sum + (p.sheets?.length || 0), 0);
  const totalBuiltUpSqM = projects.reduce((sum, p) => {
    const projArea = p.areaTable.reduce((subSum, r) => subSum + (Number(r.builtUpSqM) || 0), 0);
    return sum + projArea;
  }, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>A4 BLUEPRINT & TITLE BLOCK STUDIO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Building Plan Templates & Projects
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Professional A4 landscape CAD blueprint generator with 70mm title blocks, Kerala Vasthu Kol calculations, LSGD area statements, and unified single PDF export.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCreateNewProject}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-cyan-950/60 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Plan Project</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-xs font-mono">TOTAL PROJECTS</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {totalProjects}
            </div>
            <div className="text-[11px] text-cyan-400 mt-0.5">Active Templates</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-xs font-mono">TOTAL A4 SHEETS</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {totalSheets}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">Compiled Drawings</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-xs font-mono">TOTAL BUILT-UP AREA</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {totalBuiltUpSqM.toFixed(1)} <span className="text-xs font-sans text-slate-400">m²</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-0.5">
              {(totalBuiltUpSqM * 10.7639).toFixed(0)} sq.ft
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-slate-400 text-xs font-mono">STANDARD FORMAT</div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              A4 Landscape
            </div>
            <div className="text-[11px] text-purple-400 mt-0.5">70mm Title Strip</div>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, location, drawing number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* View Layout Toggle & Count */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredProjects.length} of {projects.length} projects
          </span>

          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid"
                  ? "bg-cyan-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "table"
                  ? "bg-cyan-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Projects Grid or Table */}
      {filteredProjects.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Plan Projects Found</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No projects matching "${searchQuery}". Try a different search term.`
              : "You haven't created any building plan projects yet. Start by creating one."}
          </p>
          <button
            onClick={onCreateNewProject}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const totalProjArea = proj.areaTable.reduce(
              (acc, r) => acc + (Number(r.builtUpSqM) || 0),
              0
            );
            const sheetCount = proj.sheets?.length || 0;
            const primarySheet = proj.sheets?.[0];

            return (
              <div
                key={proj.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Blueprint Card Header Preview */}
                <div
                  onClick={() => onSelectProjectForView(proj)}
                  className="relative h-44 bg-slate-950 border-b border-slate-800 p-3 cursor-pointer overflow-hidden group-hover:bg-slate-950/80 transition"
                >
                  {/* Mini Blueprint Visual */}
                  <div className="w-full h-full border border-slate-700 bg-white rounded-lg relative overflow-hidden flex flex-row shadow-inner">
                    {/* Drawing Area preview */}
                    <div className="flex-1 h-full bg-slate-50 relative flex items-center justify-center p-2">
                      {primarySheet?.planImageUrl ? (
                        <img
                          src={primarySheet.planImageUrl}
                          alt="Plan Preview"
                          className="max-h-full max-w-full object-contain opacity-80"
                        />
                      ) : (
                        <div className="text-center">
                          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                          <span className="text-[9px] font-mono text-slate-500 uppercase">
                            No Drawing Uploaded
                          </span>
                        </div>
                      )}
                      {/* Architectural North Indicator */}
                      <div className="absolute top-1.5 left-1.5 bg-white/90 p-1 rounded border border-slate-300 shadow-xs">
                        <Compass className="w-3.5 h-3.5 text-cyan-600" />
                      </div>
                    </div>

                    {/* Mini Right Title Block Strip representation */}
                    <div className="w-20 sm:w-24 h-full border-l border-slate-800 bg-slate-100 p-1 flex flex-col justify-between text-[7px] font-sans leading-tight">
                      <div className="border-b border-slate-300 pb-0.5 font-bold text-slate-800 truncate">
                        {proj.officeName || "VASTHUSILPY"}
                      </div>
                      <div className="py-0.5 truncate text-slate-600 font-mono">
                        {proj.licenseeName}
                      </div>
                      <div className="border-t border-slate-300 pt-0.5 text-slate-700 font-bold truncate">
                        {primarySheet?.drawingNumber || "DWG-01"}
                      </div>
                      <div className="text-[6.5px] bg-slate-800 text-white px-1 py-0.2 rounded font-mono text-center">
                        {sheetCount} {sheetCount === 1 ? "SHEET" : "SHEETS"}
                      </div>
                    </div>
                  </div>

                  {/* Hover Overlay with Quick "View" badge */}
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Click to View Blueprint</span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Project Title & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        onClick={() => onSelectProjectForView(proj)}
                        className="text-base font-bold text-white hover:text-cyan-300 cursor-pointer transition line-clamp-1"
                        title={proj.projectTitle}
                      >
                        {proj.projectTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] font-bold shrink-0">
                        {proj.defaultRevision || "R0"}
                      </span>
                    </div>

                    {/* Client & Location */}
                    <div className="space-y-1 mt-2 text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300 truncate">
                        <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{proj.clientName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{proj.projectLocation}</span>
                      </div>
                    </div>

                    {/* Technical details tags */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[9.5px]">BUILT-UP AREA</span>
                        <span className="text-slate-200 font-bold">
                          {totalProjArea.toFixed(1)} m²
                        </span>
                      </div>

                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[9.5px]">VASTHU GRADE</span>
                        <span className="text-emerald-400 font-bold">
                          {proj.vasthuGrade} ({proj.vasthuPerimeterKol.split(" ")[0]} Kol)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transmit & Export Suite: Download PDF, WhatsApp, Mail */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
                    {/* Download PDF button */}
                    <button
                      onClick={() => handleDownloadPdf(proj)}
                      disabled={exportingProjectId === proj.id}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      title="Download A4 Architectural PDF"
                    >
                      {exportingProjectId === proj.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      ) : (
                        <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span>PDF</span>
                    </button>

                    {/* Send via WhatsApp button */}
                    <button
                      onClick={() => handleSendWhatsApp(proj)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-800/60 text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      title="Send Plan Details via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Send via Mail button */}
                    <button
                      onClick={() => handleSendMail(proj)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 hover:text-blue-200 border border-blue-800/60 text-[11px] font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      title="Send Plan Details via Email"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      <span>Mail</span>
                    </button>

                    {/* Quick Transmit Modal Button */}
                    <button
                      onClick={() => setShareModalProject(proj)}
                      className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                      title="Full Transmit & Share Hub"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-300" />
                    </button>
                  </div>

                  {/* Card Action Buttons Bar: View, Edit, Duplicate, Delete */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1.5">
                    {/* View Action */}
                    <button
                      onClick={() => onSelectProjectForView(proj)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      title="View A4 Sheets"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View</span>
                    </button>

                    {/* Edit Action */}
                    <button
                      onClick={() => onSelectProjectForEdit(proj)}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-cyan-950"
                      title="Open Editor & Title Block Studio"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Duplicate Action */}
                    <button
                      onClick={() => onDuplicateProject(proj)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition cursor-pointer"
                      title="Duplicate Project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Action */}
                    <button
                      onClick={() => setProjectToDelete(proj)}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                <tr>
                  <th className="py-3.5 px-4">Project & Client</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Licensee</th>
                  <th className="py-3.5 px-4 text-center">Sheets</th>
                  <th className="py-3.5 px-4">Built-up</th>
                  <th className="py-3.5 px-4">Vasthu</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredProjects.map((proj) => {
                  const totalProjArea = proj.areaTable.reduce(
                    (acc, r) => acc + (Number(r.builtUpSqM) || 0),
                    0
                  );

                  return (
                    <tr
                      key={proj.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white group-hover:text-cyan-300">
                          {proj.projectTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {proj.clientName}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {proj.projectLocation}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-200">{proj.licenseeName}</div>
                        <div className="text-[10px] text-slate-500">
                          {proj.registrationNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                          {proj.sheets.length}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">
                          {totalProjArea.toFixed(1)} m²
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {(totalProjArea * 10.7639).toFixed(0)} sq.ft
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">
                          {proj.vasthuGrade}
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {proj.vasthuPerimeterKol}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Download PDF button */}
                          <button
                            onClick={() => handleDownloadPdf(proj)}
                            disabled={exportingProjectId === proj.id}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Download A4 PDF"
                          >
                            {exportingProjectId === proj.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
                            )}
                          </button>

                          {/* Send via WhatsApp */}
                          <button
                            onClick={() => handleSendWhatsApp(proj)}
                            className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 transition cursor-pointer"
                            title="Send via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Send via Mail */}
                          <button
                            onClick={() => handleSendMail(proj)}
                            className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 border border-blue-800/60 transition cursor-pointer"
                            title="Send via Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Share Modal */}
                          <button
                            onClick={() => setShareModalProject(proj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Share Options"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          <div className="h-4 w-px bg-slate-800 mx-0.5" />

                          <button
                            onClick={() => onSelectProjectForView(proj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectProjectForEdit(proj)}
                            className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateProject(proj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProjectToDelete(proj)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Plan Project?</h3>
                <p className="text-xs text-slate-400 font-mono">
                  This will permanently remove this project and its sheets.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              <p className="font-bold text-white">{projectToDelete.projectTitle}</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Client: {projectToDelete.clientName} ({projectToDelete.sheets.length} sheets)
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-950"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Share & Transmit Hub Modal */}
      {shareModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3 text-cyan-400">
                <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Transmit Architectural Plan</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Download PDF, share via WhatsApp, or email directly to clients & contractors
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareModalProject(null)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Project Summary Box */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{shareModalProject.projectTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px]">
                  {shareModalProject.sheets.length} Sheets
                </span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center gap-2">
                <span>Client: {shareModalProject.clientName}</span>
                <span>•</span>
                <span>Location: {shareModalProject.projectLocation}</span>
              </div>
              <div className="text-slate-400 text-[11px] flex items-center gap-2 pt-1 border-t border-slate-800/80">
                <span className="text-emerald-400 font-bold">Vasthu: {shareModalProject.vasthuGrade}</span>
                <span>•</span>
                <span>Engineer: {shareModalProject.licenseeName}</span>
              </div>
            </div>

            {/* 3 Transmit Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Download PDF */}
              <button
                onClick={() => {
                  handleDownloadPdf(shareModalProject);
                  setShareModalProject(null);
                }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 text-left transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">PDF</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs mb-0.5">Download PDF</h4>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    Standard A4 landscape architectural permit sheets
                  </p>
                </div>
              </button>

              {/* Option 2: Send WhatsApp */}
              <button
                onClick={() => {
                  handleSendWhatsApp(shareModalProject);
                }}
                className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-left transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">WhatsApp</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs mb-0.5">Sent via WhatsApp</h4>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    Send specs, built-up area & Vasthu details
                  </p>
                </div>
              </button>

              {/* Option 3: Send via Mail */}
              <button
                onClick={() => {
                  handleSendMail(shareModalProject);
                }}
                className="p-3.5 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 text-left transition cursor-pointer flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-blue-400">Email</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs mb-0.5">Sent via Mail</h4>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    Open email with pre-formatted architectural brief
                  </p>
                </div>
              </button>
            </div>

            {/* Quick Copy Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Message Preview</span>
                <button
                  onClick={() => handleCopyText(shareModalProject)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                {formatProjectWhatsAppMessage(shareModalProject)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShareModalProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-mono text-xs px-4 py-3 rounded-2xl shadow-2xl border border-cyan-500/50 flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
