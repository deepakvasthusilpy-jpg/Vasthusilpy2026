import React, { useState } from "react";
import {
  PaymentScheduleItem,
  StageChecklistItem,
  ConstructionProject,
  ConstructionAgreement
} from "../../types";
import {
  ConstructionStorageManager,
  formatIndianCurrency
} from "../../utils/constructionStorageManager";
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";

interface StageChecklistModalProps {
  project?: ConstructionProject;
  agreement?: ConstructionAgreement;
  stageIndex: number;
  onSave: (updatedSchedule: PaymentScheduleItem[], updatedOverallProgress: number) => void;
  onClose: () => void;
}

export const StageChecklistModal: React.FC<StageChecklistModalProps> = ({
  project,
  agreement,
  stageIndex,
  onSave,
  onClose
}) => {
  const schedule = agreement?.paymentSchedule || project?.paymentSchedule || [];
  const currentStage = schedule[stageIndex] || {
    id: `stg_${stageIndex}`,
    stageName: "Construction Stage",
    percentage: 10,
    amount: 100000,
    status: "PENDING",
    paidAmount: 0,
    balance: 100000
  };

  // Initialize checklist
  const [checklist, setChecklist] = useState<StageChecklistItem[]>(() => {
    if (currentStage.checklist && currentStage.checklist.length > 0) {
      return currentStage.checklist;
    }
    // Generate default checklist based on stage name
    const defaults = ConstructionStorageManager.getDefaultStageChecklist(currentStage.stageName);
    return defaults.map((d, i) => ({
      id: d.id || `chk_${Date.now()}_${i}`,
      title: d.title,
      titleMl: d.titleMl,
      isCompleted: currentStage.status === "PAID" || !!currentStage.isCompleted
    }));
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTitleMl, setNewTaskTitleMl] = useState("");

  const completedCount = checklist.filter(c => c.isCompleted).length;
  const totalCount = checklist.length;
  const stageProgressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleTask = (idx: number) => {
    const updated = [...checklist];
    const item = updated[idx];
    const willBeCompleted = !item.isCompleted;
    updated[idx] = {
      ...item,
      isCompleted: willBeCompleted,
      completedAt: willBeCompleted ? new Date().toISOString() : undefined
    };
    setChecklist(updated);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() && !newTaskTitleMl.trim()) return;
    const newItem: StageChecklistItem = {
      id: `chk_${Date.now()}`,
      title: newTaskTitle.trim() || newTaskTitleMl.trim(),
      titleMl: newTaskTitleMl.trim() || newTaskTitle.trim(),
      isCompleted: false
    };
    setChecklist([...checklist, newItem]);
    setNewTaskTitle("");
    setNewTaskTitleMl("");
  };

  const handleRemoveTask = (idx: number) => {
    setChecklist(checklist.filter((_, i) => i !== idx));
  };

  const handleMarkAll = (complete: boolean) => {
    const updated = checklist.map(c => ({
      ...c,
      isCompleted: complete,
      completedAt: complete ? new Date().toISOString() : undefined
    }));
    setChecklist(updated);
  };

  const handleSaveAndClose = () => {
    const updatedSchedule = [...schedule];
    const newStagePct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isStageFullyDone = newStagePct === 100;

    updatedSchedule[stageIndex] = {
      ...currentStage,
      checklist,
      progressPercent: newStagePct,
      isCompleted: isStageFullyDone,
      completedDate: isStageFullyDone ? new Date().toISOString().slice(0, 10) : undefined,
      completedTasksCount: completedCount,
      totalTasksCount: totalCount,
      status: isStageFullyDone && currentStage.status === "PENDING" ? "DUE" : currentStage.status
    };

    const overallProgress = ConstructionStorageManager.calculateProjectOverallProgress(updatedSchedule);
    onSave(updatedSchedule, overallProgress);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-2xl">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                  STAGE #{stageIndex + 1}
                </span>
                {currentStage.floorName && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
                    {currentStage.floorName}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-base mt-0.5">{currentStage.stageName}</h3>
              {currentStage.stageNameMl && (
                <p className="text-xs text-slate-400 font-sans">{currentStage.stageNameMl}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress % Bar */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 space-y-2 font-mono">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-bold">ഘട്ടത്തിന്റെ പുരോഗതി (Stage Work Done):</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">{completedCount} of {totalCount} Tasks Done</span>
              <span className="text-emerald-400 font-black text-sm">{stageProgressPct}%</span>
            </div>
          </div>

          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${stageProgressPct}%` }}
            />
          </div>

          <div className="flex justify-between items-center pt-1 text-[11px]">
            <span className="text-slate-400">
              തുക: <strong>{formatIndianCurrency(currentStage.amount)}</strong> ({currentStage.percentage}%)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll(true)}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
              >
                ✓ എല്ലാം പൂർത്തിയായി (Check All)
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={() => handleMarkAll(false)}
                className="text-[10px] text-slate-400 hover:underline cursor-pointer"
              >
                റീസെറ്റ് (Reset)
              </button>
            </div>
          </div>
        </div>

        {/* Tasks Checklist Items */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1 font-mono text-xs">
          <div className="text-[11px] text-slate-400 font-bold mb-2">
            എഞ്ചിനീയറിംഗ് പരിശോധനാ പട്ടിക (Engineering Checklist):
          </div>

          {checklist.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => handleToggleTask(idx)}
              className={`p-3 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                item.isCompleted
                  ? "bg-emerald-950/30 border-emerald-500/40 text-slate-100"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="mt-0.5 text-slate-400 transition"
                >
                  {item.isCompleted ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                </button>
                <div>
                  <div className={`font-semibold ${item.isCompleted ? "line-through text-slate-400" : "text-white"}`}>
                    {item.title}
                  </div>
                  {item.titleMl && item.titleMl !== item.title && (
                    <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                      {item.titleMl}
                    </div>
                  )}
                  {item.completedAt && (
                    <div className="text-[9px] text-emerald-400/80 mt-1">
                      Done: {new Date(item.completedAt).toLocaleDateString("en-IN")}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTask(idx);
                }}
                className="text-slate-600 hover:text-rose-400 p-1 transition"
                title="Remove task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add Custom Task Form */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2 mt-4">
            <div className="text-[11px] text-indigo-300 font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>പുതിയ ടാസ്ക് ചേർക്കുക (Add Custom Task):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Task description in English..."
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono"
              />
              <input
                type="text"
                value={newTaskTitleMl}
                onChange={e => setNewTaskTitleMl(e.target.value)}
                placeholder="വിവരണം മലയാളത്തിൽ..."
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-sans"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTask}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ചെക്ക്‌ലിസ്റ്റിൽ ചേർക്കുക (Add to Checklist)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center gap-3">
          <div className="text-xs text-slate-400 font-mono">
            {stageProgressPct === 100 ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                ഘട്ടം 100% പൂർത്തിയായി! (Stage Completed)
              </span>
            ) : (
              <span>Progress: {stageProgressPct}% ({completedCount}/{totalCount})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl transition cursor-pointer"
            >
              ക്യാൻസൽ
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>സേവ് ചെയ്യുക (Save Progress)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
