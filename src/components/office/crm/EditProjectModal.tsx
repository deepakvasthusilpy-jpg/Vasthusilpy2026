import React, { useState, useEffect } from "react";
import { CrmProject, StaffName, ProjectStatus } from "../../../types";
import { X, Edit3, Building2, User, Phone, MapPin, Calendar, Trash2 } from "lucide-react";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CrmProject | null;
  onUpdateProject: (updated: CrmProject) => boolean | void;
  onDeleteProject?: (id: string) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onDeleteProject
}) => {
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [location, setLocation] = useState("");
  const [assignee, setAssignee] = useState<StaffName>("DIBIN");
  const [status, setStatus] = useState<ProjectStatus>("PENDING");
  const [dueDate, setDueDate] = useState("2026-08-30");
  const [description, setDescription] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState<number>(20000);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title || "");
      setClientName(project.clientName || "");
      setClientPhone(project.clientPhone || "");
      setLocation(project.location || "");
      setAssignee(project.assignee || "DIBIN");
      setStatus(project.status || "PENDING");
      setDueDate(project.dueDate || "");
      setDescription(project.description || "");
      setEstimatedAmount(project.estimatedAmount || 0);
      setEditError(null);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!title.trim() || !clientName.trim()) {
      setEditError("Please fill in Project Title and Client Name.");
      return;
    }

    const updated: CrmProject = {
      ...project,
      title: title.trim(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || "9747995961",
      location: location.trim() || "Keralassery, Palakkad",
      assignee,
      status,
      dueDate,
      description: description.trim(),
      estimatedAmount: Number(estimatedAmount) || 0,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: assignee,
          action: "Updated project details via Edit Project Form",
          timestamp: new Date().toLocaleString()
        },
        ...project.activities
      ]
    };

    const result = onUpdateProject(updated);
    if (result !== false) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white font-sans uppercase">
              EDIT CRM PROJECT #{project.id}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 rounded-xl border border-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs font-sans">
          {editError && (
            <div className="bg-rose-950/80 border border-rose-500/80 text-rose-200 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-between">
              <span>{editError}</span>
              <button
                type="button"
                onClick={() => setEditError(null)}
                className="text-rose-400 hover:text-white ml-2 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}
          <div>
            <label className="text-slate-400 font-mono text-[11px] block mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 font-mono text-[11px] block mb-1">
                Client / Customer Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-mono text-[11px] block mb-1">
                Client Mobile Phone
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-mono text-[11px] block mb-1">
              Site Location / Re-Survey No
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Assignee Staff *
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value as StaffName)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-cyan-400 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="DEEPAK">DEEPAK</option>
                <option value="VISHNU">VISHNU</option>
                <option value="DIBIN">DIBIN</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="PENDING">PENDING</option>
                <option value="LAND SURVEY">LAND SURVEY</option>
                <option value="PROGRESS">PROGRESS</option>
                <option value="READY TO SUBMIT">READY TO SUBMIT</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-mono text-[11px] block mb-1">
              Project Overview / Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-between gap-3 font-mono">
            {onDeleteProject && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
                className="px-3.5 py-2 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete</span>
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
