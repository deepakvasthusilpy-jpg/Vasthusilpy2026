import React, { useState, useMemo } from "react";
import { TermsClause } from "../../types";
import {
  ShieldCheck,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle,
  X,
  ArrowUp,
  ArrowDown,
  Info
} from "lucide-react";

interface QuotationTermsMasterProps {
  termsClauses: TermsClause[];
  onSaveClause: (clause: TermsClause) => void;
  onDeleteClause: (clauseId: string) => void;
  onReorderClauses: (clauses: TermsClause[]) => void;
  onToggleDefault: (clauseId: string) => void;
}

export const QuotationTermsMaster: React.FC<QuotationTermsMasterProps> = ({
  termsClauses,
  onSaveClause,
  onDeleteClause,
  onReorderClauses,
  onToggleDefault
}) => {
  const [editingClause, setEditingClause] = useState<TermsClause | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formText, setFormText] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(true);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sortedClauses = useMemo(() => {
    return [...termsClauses].sort((a, b) => a.order - b.order);
  }, [termsClauses]);

  const handleOpenCreate = () => {
    setEditingClause(null);
    setFormTitle("");
    setFormText("");
    setFormIsDefault(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: TermsClause) => {
    setEditingClause(c);
    setFormTitle(c.title || "");
    setFormText(c.text);
    setFormIsDefault(c.is_default);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const nextOrder = editingClause ? editingClause.order : sortedClauses.length + 1;
    const obj: TermsClause = {
      id: editingClause ? editingClause.id : `term_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      order: nextOrder,
      title: formTitle.trim() || "General Condition",
      text: formText.trim(),
      is_default: formIsDefault
    };

    onSaveClause(obj);
    setIsModalOpen(false);
  };

  const moveOrder = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedClauses.length) return;

    const copy = [...sortedClauses];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Reassign order
    const updated = copy.map((c, i) => ({ ...c, order: i + 1 }));
    onReorderClauses(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
        <div>
          <h2 className="text-xl font-serif font-black tracking-wide text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Terms & Conditions Library
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard construction clauses, warranty milestones, and Kerala site handover terms
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Add New Clause
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="text-slate-200 font-semibold">Default Template Behavior:</span> Clauses marked with the gold checkmark are pre-ticked on all new quotation forms. You can reorder clauses using the arrows to adjust how they print on the letterhead.
        </p>
      </div>

      {/* Clause Cards List */}
      <div className="space-y-3">
        {sortedClauses.map((clause, idx) => (
          <div
            key={clause.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition group"
          >
            <div className="flex items-start gap-3.5 flex-1">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-amber-400 shrink-0">
                {clause.order}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-serif font-bold text-white">
                    {clause.title || "Condition"}
                  </h4>
                  {clause.is_default && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                      Default Template
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {clause.text}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {/* Order buttons */}
              <div className="flex rounded-lg bg-slate-800 border border-slate-700 p-0.5">
                <button
                  type="button"
                  onClick={() => moveOrder(idx, "up")}
                  disabled={idx === 0}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveOrder(idx, "down")}
                  disabled={idx === sortedClauses.length - 1}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Toggle Default */}
              <button
                type="button"
                onClick={() => onToggleDefault(clause.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  clause.is_default
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
                title="Toggle default pre-selection on new quotes"
              >
                {clause.is_default ? "Default: YES" : "Default: NO"}
              </button>

              {/* Edit */}
              <button
                type="button"
                onClick={() => handleOpenEdit(clause)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Edit Clause"
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => setDeletingId(clause.id)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Delete Clause"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add / Edit Clause */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                {editingClause ? "Edit Terms Clause" : "Add New Terms Clause"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Clause Heading / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Defects Liability Period"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Clause Legal & Operational Text <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed clause wording..."
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer bg-slate-950 border-slate-700"
                  />
                  <span>Pre-select by default on new quotations</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Save Clause
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirm */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-white space-y-4">
            <h3 className="text-sm font-serif font-bold text-white">Delete Clause?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to remove this clause from the master library?
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteClause(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
