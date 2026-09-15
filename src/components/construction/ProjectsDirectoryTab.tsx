import React, { useState } from "react";
import { ConstructionProject, ConstructionAgreement, ConstructionSettings } from "../../types";
import { formatIndianCurrency, ConstructionStorageManager } from "../../utils/constructionStorageManager";
import { shareProjectOnWhatsApp } from "../../utils/constructionShareManager";
import { EditProjectModal } from "./EditProjectModal";
import { StageChecklistModal } from "./StageChecklistModal";
import {
  Building2,
  Search,
  Filter,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Plus,
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Share2,
  CheckSquare,
  Wrench,
  AlertCircle
} from "lucide-react";

interface ProjectsDirectoryTabProps {
  projects: ConstructionProject[];
  agreements: ConstructionAgreement[];
  settings: ConstructionSettings;
  onProjectUpdated: (project: ConstructionProject) => void;
  onNavigateToNew: () => void;
  onViewAgreement: (agreement: ConstructionAgreement) => void;
  onNavigateToStages?: (projectId: string) => void;
}

export const ProjectsDirectoryTab: React.FC<ProjectsDirectoryTabProps> = ({
  projects,
  agreements,
  settings,
  onProjectUpdated,
  onNavigateToNew,
  onViewAgreement,
  onNavigateToStages
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedProjectForPayment, setSelectedProjectForPayment] = useState<ConstructionProject | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<ConstructionProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<ConstructionProject | null>(null);
  const [checklistProjectStage, setChecklistProjectStage] = useState<{ project: ConstructionProject; stageIndex: number } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>("");

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.localBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.client.mobileNumber && p.client.mobileNumber.includes(searchTerm));

    if (selectedStatus === "ALL") return matchesSearch && !p.isArchived;
    if (selectedStatus === "ARCHIVED") return matchesSearch && (p.isArchived || p.status === "ARCHIVED");
    return matchesSearch && p.status === selectedStatus && !p.isArchived;
  });

  const handleLogPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForPayment || paymentAmount <= 0) return;

    const newReceived = (selectedProjectForPayment.totalReceived || 0) + paymentAmount;
    const newBalance = Math.max(0, selectedProjectForPayment.finalContractAmount - newReceived);

    const updated: ConstructionProject = {
      ...selectedProjectForPayment,
      totalReceived: newReceived,
      balanceAmount: newBalance,
      updatedAt: new Date().toISOString()
    };

    const saved = ConstructionStorageManager.saveProject(updated);
    onProjectUpdated(saved);
    setSelectedProjectForPayment(null);
    setPaymentAmount(0);
    setPaymentNotes("");
  };

  const handleToggleArchive = (project: ConstructionProject) => {
    const nextArchivedState = !project.isArchived;
    ConstructionStorageManager.archiveProject(project.id, nextArchivedState);
    const updated: ConstructionProject = {
      ...project,
      isArchived: nextArchivedState,
      status: nextArchivedState ? "ARCHIVED" : (project.status === "ARCHIVED" ? "IN_PROGRESS" : project.status),
      updatedAt: new Date().toISOString()
    };
    onProjectUpdated(updated);
  };

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      ConstructionStorageManager.deleteProject(projectToDelete.id);
      onProjectUpdated({ ...projectToDelete, id: "deleted" });
      setProjectToDelete(null);
    }
  };

  const handleStageChange = (project: ConstructionProject, newStage: string) => {
    const updated: ConstructionProject = {
      ...project,
      currentStage: newStage,
      updatedAt: new Date().toISOString()
    };
    const saved = ConstructionStorageManager.saveProject(updated);
    onProjectUpdated(saved);
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
              PROJECTS & CLIENTS REGISTER
            </span>
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans mt-1">
            പ്രോജക്ടുകൾ & ക്ലയന്റ് ഡയറക്ടറി
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            MANAGE, MODIFY, DELETE & ARCHIVE CONSTRUCTION PROJECTS, FLOOR STAGES & WORK PROGRESS
          </p>
        </div>

        <button
          onClick={onNavigateToNew}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ പുതിയ പ്രോജക്ട് (New Project)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Client Name, Phone, Project No, Local Body..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "IN_PROGRESS", "PLANNING", "COMPLETED", "ON_HOLD", "ARCHIVED"].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedStatus === status
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {status === "ARCHIVED" && <Archive className="w-3.5 h-3.5 text-amber-400" />}
              <span>{status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => {
            const agreement = agreements.find(a => a.id === project.agreementId || a.projectId === project.id);
            const receivedPct = project.finalContractAmount > 0 ? Math.round(((project.totalReceived || 0) / project.finalContractAmount) * 100) : 0;
            const extraWorksCount = (project.extraWorks || agreement?.extraWorks || []).length;
            const floorsCount = (project.floors || []).length;
            const progressPct = project.progressPercentage || (agreement ? ConstructionStorageManager.calculateProjectOverallProgress(agreement.paymentSchedule) : 0);

            return (
              <div
                key={project.id}
                className={`bg-slate-900 border rounded-3xl p-5 hover:border-slate-700 transition space-y-4 shadow-lg flex flex-col justify-between ${
                  project.isArchived ? "border-amber-500/40 bg-slate-900/60 opacity-80" : "border-slate-800"
                }`}
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base font-sans">{project.client.clientName}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700 font-bold">
                          {project.projectNo}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span>{project.client.localBody}, {project.client.district}</span>
                        {project.client.mobileNumber && (
                          <span className="text-slate-500">| 📞 {project.client.mobileNumber}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${
                        project.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : project.status === "ARCHIVED" || project.isArchived
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}>
                        {project.isArchived ? "ARCHIVED" : project.status}
                      </span>
                    </div>
                  </div>

                  {/* Specs Pill Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 text-center font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500">വിസ്തീർണ്ണം / ഫ്ലോറുകൾ</div>
                      <div className="text-xs font-bold text-white">
                        {project.totalBuiltUpArea.toLocaleString()} Sq.Ft ({floorsCount} Fl)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">ശൈലി</div>
                      <div className="text-xs font-bold text-indigo-400">{project.roofingType}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500">നിരക്ക് / Sq.Ft</div>
                      <div className="text-xs font-bold text-emerald-400">{formatIndianCurrency(project.baseRatePerSqFt, false)}</div>
                    </div>
                  </div>

                  {/* Floor-wise details preview */}
                  {project.floors && project.floors.length > 0 && (
                    <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800/80 space-y-1.5 font-mono text-xs">
                      <div className="text-[10px] text-slate-400 font-bold flex justify-between items-center">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-400" />
                          <span>നിലകൾ തിരിച്ചുള്ള വിവരണം (Floors):</span>
                        </span>
                        {extraWorksCount > 0 && (
                          <span className="text-amber-400 text-[10px] flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            <span>{extraWorksCount} അധിക ജോലികൾ</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {project.floors.map((f, i) => (
                          <span key={f.id || i} className="px-2 py-0.5 bg-slate-900 border border-slate-700/60 rounded-lg text-[10px] text-slate-300">
                            {f.floorName}: <strong className="text-white">{f.areaSqFt} Sq.Ft</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Done Progress Checklist Bar */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ജോലിയുടെ പുരോഗതി (Work Done):</span>
                      </span>
                      <span className="font-bold text-emerald-400">{progressPct}% Completed</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Financial Health */}
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">കരാർ തുക:</span>
                      <span className="font-bold text-white text-sm">{formatIndianCurrency(project.finalContractAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">ലഭിച്ചത്: <strong className="text-cyan-400">{formatIndianCurrency(project.totalReceived || 0)}</strong> ({receivedPct}%)</span>
                      <span className="text-slate-400">ബാക്കി: <strong className="text-amber-400">{formatIndianCurrency(project.balanceAmount || project.finalContractAmount)}</strong></span>
                    </div>
                  </div>

                  {/* Current Stage Selector */}
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">നിലവിലെ ഘട്ടം:</span>
                    <select
                      value={project.currentStage}
                      onChange={e => handleStageChange(project, e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                    >
                      {settings.stages.map(st => (
                        <option key={st.id} value={st.name}>
                          {st.name} ({st.defaultPercentage}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Action Buttons: Modify, Delete, Archive, Payment, WhatsApp, Agreement */}
                <div className="pt-3 border-t border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    {/* Modify Button */}
                    <button
                      onClick={() => setProjectToEdit(project)}
                      className="flex-1 py-2 px-2.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                      title="Modify / Edit Project Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>തിരുത്തുക (Edit)</span>
                    </button>

                    {/* Log Payment Button */}
                    <button
                      onClick={() => setSelectedProjectForPayment(project)}
                      className="flex-1 py-2 px-2.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>പെയ്‌മെന്റ്</span>
                    </button>

                    {/* Archive / Unarchive Button */}
                    <button
                      onClick={() => handleToggleArchive(project)}
                      className={`p-2 rounded-xl border transition cursor-pointer ${
                        project.isArchived
                          ? "bg-amber-950 text-amber-300 border-amber-500/50 hover:bg-amber-900"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-amber-300"
                      }`}
                      title={project.isArchived ? "Unarchive / Restore Project" : "Archive Project"}
                    >
                      {project.isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setProjectToDelete(project)}
                      className="p-2 bg-slate-800 text-rose-400 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 rounded-xl transition cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => shareProjectOnWhatsApp(project)}
                      className="flex-1 py-1.5 px-3 bg-slate-950 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer transition text-[11px]"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>വാട്സ്ആപ്പ് റിപ്പോർട്ട്</span>
                    </button>

                    {agreement && (
                      <button
                        onClick={() => onViewAgreement(agreement)}
                        className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition text-[11px]"
                      >
                        <FileText className="w-3 h-3" />
                        <span>കരാർ കാണുക</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 p-12 text-center text-slate-500 font-mono text-xs bg-slate-900 border border-slate-800 rounded-3xl">
            പ്രോജക്ടുകൾ ഒന്നും കണ്ടെത്തിയില്ല.
          </div>
        )}
      </div>

      {/* EDIT / MODIFY PROJECT MODAL */}
      {projectToEdit && (
        <EditProjectModal
          project={projectToEdit}
          settings={settings}
          onSave={updated => {
            onProjectUpdated(updated);
            setProjectToEdit(null);
          }}
          onClose={() => setProjectToEdit(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base">പ്രോജക്ട് ഇല്ലാതാക്കണോ? (Delete Project)</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {projectToDelete.projectNo} - {projectToDelete.client.clientName}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              ഈ പ്രോജക്ട് ശാശ്വതമായി ഇല്ലാതാക്കണോ അതോ ആർക്കൈവ് ചെയ്യണോ?
            </p>

            <div className="flex flex-col gap-2 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-950"
              >
                <Trash2 className="w-4 h-4" />
                <span>ഡിലീറ്റ് ചെയ്യുക (Permanently Delete)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleArchive(projectToDelete);
                  setProjectToDelete(null);
                }}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Archive className="w-4 h-4" />
                <span>ആർക്കൈവ് ചെയ്യുക (Archive Instead)</span>
              </button>

              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="w-full py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
              >
                ക്യാൻസൽ (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {selectedProjectForPayment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">പെയ്‌മെന്റ് രേഖപ്പെടുത്തുക (Log Payment)</h3>
              </div>
              <button
                onClick={() => setSelectedProjectForPayment(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs font-mono space-y-1">
              <div>ക്ലയന്റ്: <strong className="text-white">{selectedProjectForPayment.client.clientName}</strong></div>
              <div>കരാർ തുക: <strong className="text-emerald-400">{formatIndianCurrency(selectedProjectForPayment.finalContractAmount)}</strong></div>
              <div>ഇതുവരെ ലഭിച്ചത്: <strong className="text-cyan-400">{formatIndianCurrency(selectedProjectForPayment.totalReceived || 0)}</strong></div>
            </div>

            <form onSubmit={handleLogPayment} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">ലഭിച്ച തുക (Amount Received in ₹) *</label>
                <input
                  type="number"
                  required
                  value={paymentAmount || ""}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 100000"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-base font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">കുറിപ്പുകൾ / റഫറൻസ് (UPI / Cheque / Bank Ref)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. UPI Ref #239842, Stage 2 advance"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  രേഖപ്പെടുത്തുക (Save Payment)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProjectForPayment(null)}
                  className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition cursor-pointer"
                >
                  ക്യാൻസൽ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
