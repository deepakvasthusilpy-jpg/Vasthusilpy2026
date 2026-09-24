import React, { useState } from "react";
import { InspectionTemplate, InspectionQuestion, InspectionQuestionType } from "../../types/siteInspection";
import {
  loadInspectionTemplates,
  saveInspectionTemplates,
  DEFAULT_TEMPLATES
} from "../../utils/siteInspectionManager";
import { triggerAppNotification } from "../../context/NotificationContext";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  HelpCircle,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  ToggleLeft,
  AlignLeft,
  ListFilter
} from "lucide-react";

export const DynamicQuestionBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<InspectionTemplate[]>(() => loadInspectionTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "tpl_standard_site");

  // New Question Form
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionTextMl, setQuestionTextMl] = useState("");
  const [questionType, setQuestionType] = useState<InspectionQuestionType>("yes_no");
  const [questionCategory, setQuestionCategory] = useState<InspectionQuestion["category"]>("site_conditions");
  const [isRequired, setIsRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState("");
  const [helpText, setHelpText] = useState("");

  // New Template Form
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateNameMl, setNewTemplateNameMl] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");

  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const newQ: InspectionQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      question: questionText.trim(),
      questionMl: questionTextMl.trim() || undefined,
      type: questionType,
      category: questionCategory,
      required: isRequired,
      options: questionType === "select" && optionsStr.trim() ? optionsStr.split(",").map((s) => s.trim()) : undefined,
      helpText: helpText.trim() || undefined
    };

    const updated = templates.map((tpl) => {
      if (tpl.id === activeTemplate.id) {
        return {
          ...tpl,
          questions: [...tpl.questions, newQ]
        };
      }
      return tpl;
    });

    setTemplates(updated);
    saveInspectionTemplates(updated);

    // Reset
    setQuestionText("");
    setQuestionTextMl("");
    setHelpText("");
    setOptionsStr("");
    setIsAddingQuestion(false);
    triggerAppNotification(`Question added to template "${activeTemplate.name}"`, "success");
  };

  const handleDeleteQuestion = (qId: string) => {
    const updated = templates.map((tpl) => {
      if (tpl.id === activeTemplate.id) {
        return {
          ...tpl,
          questions: tpl.questions.filter((q) => q.id !== qId)
        };
      }
      return tpl;
    });

    setTemplates(updated);
    saveInspectionTemplates(updated);
    triggerAppNotification("Question removed", "info");
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const newTpl: InspectionTemplate = {
      id: `tpl_${Date.now()}`,
      name: newTemplateName.trim(),
      nameMl: newTemplateNameMl.trim() || undefined,
      description: newTemplateDesc.trim() || "Custom checklist template",
      questions: [
        {
          id: `q_init_${Date.now()}`,
          question: "General site suitability verified?",
          type: "yes_no",
          category: "site_conditions",
          required: true
        }
      ]
    };

    const updated = [...templates, newTpl];
    setTemplates(updated);
    saveInspectionTemplates(updated);
    setSelectedTemplateId(newTpl.id);
    setIsCreatingTemplate(false);
    setNewTemplateName("");
    setNewTemplateNameMl("");
    setNewTemplateDesc("");
    triggerAppNotification(`Template "${newTpl.name}" created!`, "success");
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset all inspection templates to factory default checklists?")) {
      setTemplates(DEFAULT_TEMPLATES);
      saveInspectionTemplates(DEFAULT_TEMPLATES);
      setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
      triggerAppNotification("Reset to default inspection checklists", "success");
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Dynamic Question & Template Builder</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Configure dynamic Yes/No questions, descriptive fields & custom checklist categories
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingTemplate(true)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ New Template</span>
          </button>

          <button
            onClick={handleResetToDefaults}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            title="Reset to factory templates"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Template Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelectedTemplateId(tpl.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition cursor-pointer ${
              selectedTemplateId === tpl.id
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <span>{tpl.name}</span>
            <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/30 font-mono">
              {tpl.questions.length} Qs
            </span>
          </button>
        ))}
      </div>

      {/* Template Detail & Question List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{activeTemplate.name}</span>
              {activeTemplate.nameMl && (
                <span className="text-xs text-emerald-400 font-mono">({activeTemplate.nameMl})</span>
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{activeTemplate.description}</p>
          </div>

          <button
            onClick={() => setIsAddingQuestion(true)}
            className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Add Question Inline Form */}
        {isAddingQuestion && (
          <form
            onSubmit={handleAddQuestion}
            className="p-4 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-3 animate-fadeIn"
          >
            <h4 className="text-xs font-bold text-emerald-400 uppercase font-mono">
              New Inspection Question
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Question (English) *
                </label>
                <input
                  type="text"
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Is boundary clearance adequate?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Question (Malayalam / Optional)
                </label>
                <input
                  type="text"
                  value={questionTextMl}
                  onChange={(e) => setQuestionTextMl(e.target.value)}
                  placeholder="e.g. അതിർത്തിയിൽ നിന്നുമുള്ള അകലം കൃത്യമാണോ?"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Input Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as InspectionQuestionType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="yes_no_na">Yes / No / N/A (3-Way)</option>
                  <option value="yes_no">Yes / No (2-Way)</option>
                  <option value="descriptive">Descriptive Text Area</option>
                  <option value="select">Dropdown Options</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">Category</label>
                <select
                  value={questionCategory}
                  onChange={(e) => setQuestionCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="site_conditions">Site Conditions & Terrain</option>
                  <option value="boundaries_access">Boundaries & Road Access</option>
                  <option value="statutory_compliance">Statutory / KPBR Compliance</option>
                  <option value="construction_stage">Construction Stage Progress</option>
                  <option value="utilities_services">Utilities & Services</option>
                  <option value="custom">General / Custom</option>
                </select>
              </div>

              <div className="space-y-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>Mandatory Field</span>
                </label>
              </div>
            </div>

            {questionType === "select" && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300">
                  Dropdown Options (comma separated)
                </label>
                <input
                  type="text"
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Help Text / Inspection Note (Optional)
              </label>
              <input
                type="text"
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                placeholder="e.g. Check for minimum 3 meter front clearance"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingQuestion(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Save Question
              </button>
            </div>
          </form>
        )}

        {/* Existing Questions List */}
        <div className="space-y-2.5">
          {activeTemplate.questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-3.5 bg-slate-950 border border-slate-850 rounded-2xl flex items-start justify-between gap-3 group hover:border-slate-750 transition"
            >
              <div className="space-y-1 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                  <p className="text-xs font-bold text-white">{q.question}</p>
                  {q.required && <span className="text-[10px] text-rose-400 font-bold">*Required</span>}
                </div>

                {q.questionMl && (
                  <p className="text-[11px] text-slate-400 font-mono">{q.questionMl}</p>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 uppercase">
                    {q.type.replace("_", " ")}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span>{q.category.replace("_", " ")}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteQuestion(q.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 bg-slate-900 rounded-lg opacity-80 group-hover:opacity-100 transition cursor-pointer"
                title="Delete Question"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
