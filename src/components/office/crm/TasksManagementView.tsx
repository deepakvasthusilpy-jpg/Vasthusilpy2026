import React, { useState, useEffect } from "react";
import {
  RegisteredTask,
  TASK_CATEGORIES,
  TaskCategoryType,
  loadRegisteredTasks,
  saveRegisteredTasks,
  addCustomRegisteredTask,
  updateRegisteredTask,
  deleteRegisteredTask
} from "../../../data/registeredTasksData";
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  Clock,
  Tag,
  Filter,
  CheckSquare,
  Sparkles,
  X,
  FileText,
  AlertCircle
} from "lucide-react";
import { triggerAppNotification } from "../../../context/NotificationContext";

interface TasksManagementViewProps {
  onSelectTaskToUse?: (task: RegisteredTask) => void;
}

export const TasksManagementView: React.FC<TasksManagementViewProps> = ({
  onSelectTaskToUse
}) => {
  const [tasks, setTasks] = useState<RegisteredTask[]>(() => loadRegisteredTasks());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Modal State
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RegisteredTask | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<RegisteredTask["category"]>("DESIGN");
  const [formEstimatedDays, setFormEstimatedDays] = useState<number>(3);
  const [formDescription, setFormDescription] = useState("");
  const [formSubtasks, setFormSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  // Inline Subtask Add State (key: taskId -> string)
  const [inlineSubtaskInputs, setInlineSubtaskInputs] = useState<Record<string, string>>({});

  // Sync with window events
  useEffect(() => {
    const handleUpdate = () => {
      setTasks(loadRegisteredTasks());
    };
    window.addEventListener("vasthusilpy_registered_tasks_updated", handleUpdate);
    return () => {
      window.removeEventListener("vasthusilpy_registered_tasks_updated", handleUpdate);
    };
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormCategory("DESIGN");
    setFormEstimatedDays(3);
    setFormDescription("");
    setFormSubtasks([""]);
    setNewSubtaskInput("");
    setIsCreateEditModalOpen(true);
  };

  const openEditModal = (task: RegisteredTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setFormEstimatedDays(task.estimatedDays || 3);
    setFormDescription(task.description || "");
    setFormSubtasks(task.subtasks && task.subtasks.length > 0 ? [...task.subtasks] : [""]);
    setNewSubtaskInput("");
    setIsCreateEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please enter a Task Title");
      return;
    }

    const matchedCat = TASK_CATEGORIES.find((c) => c.id === formCategory);
    const catLabel = matchedCat?.label || "General Project Tasks";

    const cleanSubtasks = [
      ...formSubtasks.map((s) => s.trim()).filter(Boolean),
      ...(newSubtaskInput.trim() ? [newSubtaskInput.trim()] : [])
    ];

    if (editingTask) {
      const updated: RegisteredTask = {
        ...editingTask,
        title: formTitle.trim(),
        category: formCategory,
        categoryLabel: catLabel,
        estimatedDays: Number(formEstimatedDays) || 1,
        description: formDescription.trim(),
        subtasks: cleanSubtasks
      };
      updateRegisteredTask(updated);
      setTasks(loadRegisteredTasks());
      triggerAppNotification("SYSTEM", "Master Task Updated", `Updated task: ${updated.title}`);
    } else {
      const newTask = addCustomRegisteredTask({
        title: formTitle.trim(),
        category: formCategory,
        categoryLabel: catLabel,
        estimatedDays: Number(formEstimatedDays) || 1,
        description: formDescription.trim(),
        subtasks: cleanSubtasks
      });
      setTasks(loadRegisteredTasks());
      triggerAppNotification("SYSTEM", "Master Task Created", `Added "${newTask.title}" to library`);
    }

    setIsCreateEditModalOpen(false);
  };

  const handleDeleteTask = (id: string, title: string) => {
    deleteRegisteredTask(id);
    setTasks(loadRegisteredTasks());
    triggerAppNotification("SYSTEM", "Task Deleted", `Removed task "${title}"`);
  };

  // Inline Subtask Add Handler
  const handleAddInlineSubtask = (taskId: string) => {
    const text = (inlineSubtaskInputs[taskId] || "").trim();
    if (!text) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = [...(task.subtasks || []), text];
    const updated: RegisteredTask = {
      ...task,
      subtasks: updatedSubtasks
    };
    updateRegisteredTask(updated);
    setTasks(loadRegisteredTasks());

    setInlineSubtaskInputs((prev) => ({ ...prev, [taskId]: "" }));
    triggerAppNotification("SYSTEM", "Subtask Added", `Added subtask to ${task.title}`);
  };

  // Delete Inline Subtask Handler
  const handleDeleteInlineSubtask = (taskId: string, indexToRemove: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.filter((_, idx) => idx !== indexToRemove);
    const updated: RegisteredTask = {
      ...task,
      subtasks: updatedSubtasks
    };
    updateRegisteredTask(updated);
    setTasks(loadRegisteredTasks());
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory =
      selectedCategory === "ALL" || task.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchTitle = task.title.toLowerCase().includes(q);
    const matchCategory = task.categoryLabel?.toLowerCase().includes(q);
    const matchDesc = task.description?.toLowerCase().includes(q);
    const matchSubtask = task.subtasks?.some((st) => st.toLowerCase().includes(q));

    return matchesCategory && (matchTitle || matchCategory || matchDesc || matchSubtask);
  });

  const totalSubtasksCount = tasks.reduce(
    (acc, t) => acc + (t.subtasks ? t.subtasks.length : 0),
    0
  );

  // Category Color Map
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "SURVEY":
        return {
          badge: "bg-amber-950/80 text-amber-300 border-amber-800",
          accent: "text-amber-400"
        };
      case "DESIGN":
        return {
          badge: "bg-purple-950/80 text-purple-300 border-purple-800",
          accent: "text-purple-400"
        };
      case "STRUCTURAL":
        return {
          badge: "bg-blue-950/80 text-blue-300 border-blue-800",
          accent: "text-blue-400"
        };
      case "ESTIMATION":
        return {
          badge: "bg-emerald-950/80 text-emerald-300 border-emerald-800",
          accent: "text-emerald-400"
        };
      case "PERMIT":
        return {
          badge: "bg-rose-950/80 text-rose-300 border-rose-800",
          accent: "text-rose-400"
        };
      case "SUPERVISION":
        return {
          badge: "bg-teal-950/80 text-teal-300 border-teal-800",
          accent: "text-teal-400"
        };
      case "VALUATION":
        return {
          badge: "bg-indigo-950/80 text-indigo-300 border-indigo-800",
          accent: "text-indigo-400"
        };
      case "COMPLETION":
        return {
          badge: "bg-cyan-950/80 text-cyan-300 border-cyan-800",
          accent: "text-cyan-400"
        };
      default:
        return {
          badge: "bg-slate-800 text-slate-300 border-slate-700",
          accent: "text-slate-400"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wide">
                MASTER TASK REPOSITORY
              </span>
              <span className="text-slate-500 text-xs font-mono">• Global Sync</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white font-sans flex items-center gap-2.5">
              <ListTodo className="w-6 h-6 text-emerald-400" />
              <span>Tasks & Sub-Tasks Library</span>
            </h1>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Manage master tasks, standard KPBR architectural phases, survey milestones, and subtask checklists.
              All tasks configured here can be seamlessly selected when creating or managing CRM projects. Any new task added inside CRM is automatically saved here!
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs font-mono shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-98 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ ADD MASTER TASK</span>
          </button>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Total Master Tasks</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{tasks.length}</div>
            </div>
            <Layers className="w-6 h-6 text-emerald-500/30" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Total Sub-tasks</div>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5">{totalSubtasksCount}</div>
            </div>
            <CheckSquare className="w-6 h-6 text-cyan-500/30" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">Categories</div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{TASK_CATEGORIES.length}</div>
            </div>
            <Tag className="w-6 h-6 text-amber-500/30" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">CRM Auto-Register</div>
              <div className="text-sm font-bold text-white font-mono mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>ENABLED</span>
              </div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-emerald-500/30" />
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search master tasks or sub-tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-white text-slate-950 shadow-md font-black"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Tasks ({tasks.length})
          </button>

          {TASK_CATEGORIES.map((cat) => {
            const count = tasks.filter((t) => t.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-slate-950 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks List Grid */}
      {filteredTasks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <ListTodo className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white font-sans">No tasks found</h3>
            <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
              {searchQuery
                ? `No master tasks match your search query "${searchQuery}".`
                : "No master tasks available in this category."}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Master Task</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTasks.map((task) => {
            const color = getCategoryColor(task.category);
            const subtasks = task.subtasks || [];
            const inlineInput = inlineSubtaskInputs[task.id] || "";

            return (
              <div
                key={task.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 space-y-4 shadow-md flex flex-col justify-between transition-all group"
              >
                <div className="space-y-3">
                  {/* Card Header: Category Badge + Days + Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${color.badge}`}
                    >
                      {task.categoryLabel || task.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {task.estimatedDays && (
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{task.estimatedDays} days</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 cursor-pointer transition-colors"
                        title="Edit Master Task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 cursor-pointer transition-colors"
                        title="Delete Master Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans group-hover:text-emerald-300 transition-colors">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 font-sans mt-1 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Sub-tasks Checklist */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="font-bold uppercase text-[10px] text-slate-500">
                        Sub-Tasks ({subtasks.length}):
                      </span>
                    </div>

                    {subtasks.length === 0 ? (
                      <div className="text-[11px] text-slate-500 font-mono italic py-1">
                        No sub-tasks defined. Add one below.
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-44 overflow-y-auto pr-1 no-scrollbar">
                        {subtasks.map((st, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 text-xs group/st hover:border-slate-700"
                          >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <span className="text-[10px] font-mono text-emerald-500 font-bold shrink-0 mt-0.5">
                                {idx + 1}.
                              </span>
                              <span className="text-slate-300 text-[11px] font-sans break-words leading-tight">
                                {st}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteInlineSubtask(task.id, idx)}
                              className="text-slate-600 hover:text-rose-400 opacity-0 group-hover/st:opacity-100 transition-opacity p-0.5"
                              title="Delete subtask"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline Add Subtask Input */}
                <div className="pt-3 border-t border-slate-800 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="+ Add a subtask to this task..."
                    value={inlineInput}
                    onChange={(e) =>
                      setInlineSubtaskInputs((prev) => ({
                        ...prev,
                        [task.id]: e.target.value
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInlineSubtask(task.id);
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInlineSubtask(task.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MASTER TASK MODAL */}
      {isCreateEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold text-white font-sans uppercase">
                  {editingTask ? "EDIT MASTER TASK" : "CREATE NEW MASTER TASK"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs font-sans">
              <div>
                <label className="text-slate-300 font-mono text-[11px] block mb-1 font-bold">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 2D Architectural Floor Plan Drawing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-mono text-[11px] block mb-1 font-bold">
                    Category Phase *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as RegisteredTask["category"])}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-cyan-300 font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                  >
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-mono text-[11px] block mb-1 font-bold">
                    Estimated Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formEstimatedDays}
                    onChange={(e) => setFormEstimatedDays(Number(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono text-[11px] block mb-1 font-bold">
                  Description / Execution Notes
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Brief summary of requirements, standards, or KPBR regulations..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Sub-tasks Section */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-mono text-[11px] font-bold uppercase">
                    Sub-tasks / Action Steps:
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormSubtasks([...formSubtasks, ""])}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold font-mono cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {formSubtasks.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500 w-5 text-right font-bold">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        value={st}
                        onChange={(e) => {
                          const updated = [...formSubtasks];
                          updated[idx] = e.target.value;
                          setFormSubtasks(updated);
                        }}
                        placeholder={`Subtask step ${idx + 1}...`}
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formSubtasks.filter((_, i) => i !== idx);
                          setFormSubtasks(updated);
                        }}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs font-mono shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingTask ? "Update Master Task" : "Save Master Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
