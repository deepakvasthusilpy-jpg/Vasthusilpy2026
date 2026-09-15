import React, { useState, useMemo, useEffect } from "react";
import {
  CrmProject,
  StaffName,
  ProjectStatus,
  SubTask,
  ProjectAttachment,
  ProjectComment,
  ProjectActivity,
  Invoice,
  Customer
} from "../../../types";
import {
  RegisteredTask,
  TASK_CATEGORIES,
  loadRegisteredTasks,
  ensureTaskRegistered
} from "../../../data/registeredTasksData";
import { loadCustomers } from "../../../utils/storageManager";
import {
  X,
  Plus,
  Trash2,
  Paperclip,
  MessageSquare,
  FileText,
  Calendar,
  User,
  Phone,
  MapPin,
  Building2,
  Sparkles,
  CheckCircle2,
  Clock,
  History,
  Check,
  Search,
  Upload,
  Link as LinkIcon,
  Tag,
  ListTodo,
  AlertCircle
} from "lucide-react";
import { triggerAppNotification } from "../../../context/NotificationContext";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: CrmProject, initialInvoice?: Invoice) => void;
  invoices?: Invoice[];
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject
}) => {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<
    "details" | "subtasks" | "attachments" | "comments" | "activity"
  >("details");
  const [viewMode, setViewMode] = useState<"tabs" | "expanded">("tabs");

  // Core Project Details - CLIENT NAME MOST PRIORITY, PROJECT TITLE NEXT
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [assignee, setAssignee] = useState<StaffName>("DIBIN");
  const [status, setStatus] = useState<ProjectStatus>("PENDING");
  const [dueDate, setDueDate] = useState("2026-08-30");
  const [description, setDescription] = useState("");

  // Customer Autocomplete / Selection
  const [savedCustomers, setSavedCustomers] = useState<Customer[]>(() => loadCustomers());
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync saved customers
  useEffect(() => {
    setSavedCustomers(loadCustomers());
  }, [isOpen]);

  // Filtered customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!clientName.trim()) return [];
    const q = clientName.toLowerCase();
    return savedCustomers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    );
  }, [clientName, savedCustomers]);

  // Master Registered Tasks & Subtasks
  const [registeredTasksList, setRegisteredTasksList] = useState<RegisteredTask[]>(() => {
    return loadRegisteredTasks();
  });
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [selectedTaskCategory, setSelectedTaskCategory] = useState<string>("ALL");

  // Subtasks list starts empty (NO DUMMY TASKS / SUBTASKS)
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  // Custom task input (automatically registered to master library)
  const [newCustomTaskTitle, setNewCustomTaskTitle] = useState("");
  const [newCustomSubtasksInput, setNewCustomSubtasksInput] = useState("");
  const [customTaskCategory, setCustomTaskCategory] = useState<RegisteredTask["category"]>("DESIGN");

  // Attachments State
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [attachmentMethod, setAttachmentMethod] = useState<"browse" | "paste" | "link">("browse");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentType, setNewAttachmentType] = useState("PDF");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [pastedStatus, setPastedStatus] = useState<string | null>(null);

  // Comments State
  const [comments, setComments] = useState<ProjectComment[]>([
    {
      id: `c_1_${Date.now()}`,
      author: "DIBIN",
      text: "Project created and initiated in Vasthusilpy CRM.",
      timestamp: new Date().toLocaleString()
    }
  ]);
  const [newCommentText, setNewCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState<StaffName | "CLIENT" | "ADMIN">("DIBIN");

  if (!isOpen) return null;

  // Registered Tasks filtering
  const filteredRegisteredTasks = registeredTasksList.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(taskSearchQuery.toLowerCase())) ||
      (task.subtasks && task.subtasks.some((st) => st.toLowerCase().includes(taskSearchQuery.toLowerCase())));

    const matchesCategory =
      selectedTaskCategory === "ALL" || task.category === selectedTaskCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddRegisteredTask = (task: RegisteredTask, includeSubtasks = true) => {
    const newItems: SubTask[] = [];

    // Add main task if not already in project
    const mainExists = subTasks.some((st) => st.title.toLowerCase() === task.title.toLowerCase());
    if (!mainExists) {
      newItems.push({
        id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: task.title,
        completed: false
      });
    }

    // Add subtasks if requested
    if (includeSubtasks && task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach((stTitle) => {
        const subExists = subTasks.some((st) => st.title.toLowerCase() === stTitle.toLowerCase());
        if (!subExists) {
          newItems.push({
            id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            title: `↳ ${stTitle}`,
            completed: false
          });
        }
      });
    }

    if (newItems.length > 0) {
      setSubTasks((prev) => [...prev, ...newItems]);
    }
  };

  const handleAddSingleSubtaskFromMaster = (subtaskTitle: string) => {
    const subExists = subTasks.some((st) => st.title.toLowerCase() === subtaskTitle.toLowerCase());
    if (!subExists) {
      setSubTasks((prev) => [
        ...prev,
        {
          id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          title: `↳ ${subtaskTitle}`,
          completed: false
        }
      ]);
    }
  };

  // Add Custom Task Handler - AUTOMATICALLY SAVED TO TASKS TAB
  const handleAddCustomTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCustomTaskTitle.trim()) return;

    const mainTitle = newCustomTaskTitle.trim();
    const newItems: SubTask[] = [
      {
        id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        title: mainTitle,
        completed: false
      }
    ];

    let subtasksArray: string[] = [];
    if (newCustomSubtasksInput.trim()) {
      subtasksArray = newCustomSubtasksInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      subtasksArray.forEach((subTitle) => {
        newItems.push({
          id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          title: `↳ ${subTitle}`,
          completed: false
        });
      });
    }

    setSubTasks((prev) => [...prev, ...newItems]);

    // AUTOMATICALLY save to Master Tasks Registry (Tasks Tab)
    try {
      const savedMasterTask = ensureTaskRegistered(
        mainTitle,
        subtasksArray,
        customTaskCategory
      );
      setRegisteredTasksList(loadRegisteredTasks());
      triggerAppNotification(
        "SYSTEM",
        "Master Task Saved",
        `"${mainTitle}" automatically saved under Tasks tab`
      );
    } catch (err) {
      console.warn("Failed to auto-save master task:", err);
    }

    setNewCustomTaskTitle("");
    setNewCustomSubtasksInput("");
  };

  const handleToggleSubtask = (id: string) => {
    setSubTasks((prev) =>
      prev.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubTasks((prev) => prev.filter((st) => st.id !== id));
  };

  // Attachment Handlers
  const handleBrowseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
      const ext = file.name.split(".").pop()?.toUpperCase() || "FILE";

      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result as string;
        const newAtt: ProjectAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: newAttachmentName.trim() || file.name,
          type: ext,
          size: sizeStr,
          uploadedAt: new Date().toISOString().split("T")[0],
          url: fileData
        };
        setAttachments((prev) => [newAtt, ...prev]);
        setNewAttachmentName("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLinkAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentUrl.trim()) return;

    const newAtt: ProjectAttachment = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: newAttachmentName.trim() || "Web / Google Drive Document",
      type: newAttachmentUrl.includes("drive.google.com") ? "G-Drive" : "Web Link",
      size: "Link",
      uploadedAt: new Date().toISOString().split("T")[0],
      url: newAttachmentUrl.trim()
    };
    setAttachments((prev) => [newAtt, ...prev]);
    setNewAttachmentName("");
    setNewAttachmentUrl("");
  };

  const handlePasteClipboardAttachment = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        setPastedStatus("Clipboard was empty.");
        return;
      }

      if (text.startsWith("http://") || text.startsWith("https://")) {
        const newAtt: ProjectAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: newAttachmentName.trim() || `Pasted Link (${new URL(text).hostname})`,
          type: text.includes("drive.google.com") ? "G-Drive Link" : "Web Link",
          size: "Link",
          uploadedAt: new Date().toISOString().split("T")[0],
          url: text.trim()
        };
        setAttachments((prev) => [newAtt, ...prev]);
        setPastedStatus("Successfully attached link from clipboard!");
      } else {
        const newAtt: ProjectAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: text.substring(0, 30) + "...",
          type: "Note",
          size: "Text Note",
          uploadedAt: new Date().toISOString().split("T")[0]
        };
        setAttachments((prev) => [newAtt, ...prev]);
        setPastedStatus("Pasted text saved as attachment note.");
      }
      setTimeout(() => setPastedStatus(null), 4000);
    } catch (e) {
      setPastedStatus("Unable to access clipboard. Please paste manually into Link URL field.");
      setTimeout(() => setPastedStatus(null), 4000);
    }
  };

  const handleDeleteAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Comments Handlers
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: ProjectComment = {
      id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      author: commentAuthor,
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleString()
    };
    setComments((prev) => [newComment, ...prev]);
    setNewCommentText("");
  };

  const handleDeleteComment = (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  // Select customer suggestion
  const handleSelectCustomer = (customer: Customer) => {
    setClientName(customer.name);
    if (customer.phone) setClientPhone(customer.phone);
    if (customer.addressLine || customer.villagePanchayat || customer.district) {
      const parts = [customer.houseName, customer.addressLine, customer.villagePanchayat, customer.district].filter(Boolean);
      setLocation(parts.join(", "));
    }
    // Auto suggest project title if currently blank
    if (!title.trim()) {
      setTitle(`${customer.name} Residence Plan & Permit`);
    }
    setShowCustomerDropdown(false);
  };

  // Main Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientName.trim()) {
      setActiveTab("details");
      setFormError("Please enter the Client / Customer Name (Highest Priority).");
      triggerAppNotification(
        "SYSTEM",
        "Required Field",
        "Please enter the Client / Customer Name."
      );
      return;
    }

    if (!title.trim()) {
      setActiveTab("details");
      setFormError("Please enter a Project Title.");
      triggerAppNotification(
        "SYSTEM",
        "Required Field",
        "Please enter a Project Title."
      );
      return;
    }

    const projectId = `crm_proj_${Date.now()}`;

    // Construct Activities Log
    const activities: ProjectActivity[] = [
      {
        id: `act_create_${Date.now()}`,
        actor: assignee,
        action: `Created new project entry: ${title.trim()} for ${clientName.trim()}`,
        timestamp: new Date().toLocaleString()
      }
    ];

    if (subTasks.length > 0) {
      activities.push({
        id: `act_st_${Date.now()}`,
        actor: assignee,
        action: `Assigned ${subTasks.length} deliverables/tasks`,
        timestamp: new Date().toLocaleString()
      });
    }

    if (attachments.length > 0) {
      activities.push({
        id: `act_att_${Date.now()}`,
        actor: assignee,
        action: `Attached ${attachments.length} files/drawings`,
        timestamp: new Date().toLocaleString()
      });
    }

    // Construct CRM Project (No Invoice Sync)
    const newProj: CrmProject = {
      id: projectId,
      title: title.trim(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || "9747995961",
      location: location.trim() || "Keralassery, Palakkad",
      assignee,
      status,
      dueDate,
      description: description.trim() || "Vasthusilpy Engineering Project",
      subTasks,
      attachments,
      comments,
      activities,
      createdAt: new Date().toISOString().split("T")[0]
    };

    onCreateProject(newProj);

    triggerAppNotification(
      "PROJECT_STATUS",
      "New Project Registered",
      `Project #${newProj.id} (${newProj.title}) created for ${newProj.clientName}`,
      { projectId: newProj.id }
    );

    onClose();
  };

  const completedSubtasksCount = subTasks.filter((s) => s.completed).length;
  const subtasksPercent = subTasks.length > 0 ? Math.round((completedSubtasksCount / subTasks.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-sans tracking-wide uppercase">
                  CREATE NEW CRM PROJECT
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  CLIENT FIRST
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Client profile & project scope with auto-saving master tasks library
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setViewMode("tabs")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "tabs"
                    ? "bg-slate-800 text-cyan-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tabbed View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("expanded")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === "expanded"
                    ? "bg-slate-800 text-cyan-300 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                All Sections View
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
              title="Close window"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        {viewMode === "tabs" && (
          <div className="bg-slate-950/90 px-4 sm:px-6 py-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "details"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>1. Client & Project Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("subtasks")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "subtasks"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2. Tasks & Subtasks ({subTasks.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("attachments")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "attachments"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80"
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>3. Attachments ({attachments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("comments")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "comments"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>4. Comments ({comments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "activity"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800/80"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>5. Activity Preview</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-8">
          {/* Validation Error Banner */}
          {formError && (
            <div className="bg-rose-950/80 border border-rose-500/80 text-rose-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-mono font-bold shadow-lg shadow-rose-950/40">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-white font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: CLIENT NAME (TOP PRIORITY) & PROJECT DETAILS */}
          {/* ========================================================================= */}
          {(viewMode === "expanded" || activeTab === "details") && (
            <div className="space-y-5 bg-slate-950/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                  <User className="w-4 h-4" />
                  <span>1. Client Information (Top Priority) & Project Title</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">* Required fields</span>
              </div>

              <div className="space-y-4 text-xs font-sans">
                {/* PRIORITY 1: CLIENT NAME & PHONE */}
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>Client Details (Highest Priority) *</span>
                    </span>
                    {savedCustomers.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {savedCustomers.length} registered customers in directory
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    <div className="relative">
                      <label className="text-slate-200 font-mono text-[11px] block mb-1.5 font-bold">
                        Client / Customer Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => {
                            setClientName(e.target.value);
                            setShowCustomerDropdown(true);
                            if (!title.trim() && e.target.value.trim()) {
                              setTitle(`${e.target.value.trim()} Residence Plan`);
                            }
                          }}
                          onFocus={() => setShowCustomerDropdown(true)}
                          placeholder="Enter client's full name"
                          className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl pl-9 pr-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-emerald-400 transition-colors shadow-inner"
                        />
                      </div>

                      {/* Customer Autocomplete Dropdown */}
                      {showCustomerDropdown && customerSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-emerald-500/40 rounded-2xl p-2 shadow-2xl z-20 max-h-48 overflow-y-auto space-y-1">
                          <div className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 uppercase font-bold">
                            Select Saved Client:
                          </div>
                          {customerSuggestions.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCustomer(c)}
                              className="w-full text-left px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-800 transition-all flex items-center justify-between text-xs cursor-pointer group"
                            >
                              <div>
                                <div className="font-bold text-white group-hover:text-emerald-300">
                                  {c.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {c.phone} {c.villagePanchayat ? `• ${c.villagePanchayat}` : ""}
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded">
                                Use
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-slate-200 font-mono text-[11px] block mb-1.5 font-bold">
                        Client Mobile Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-emerald-400" />
                        <input
                          type="text"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="e.g. 9747995961"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PRIORITY 2: PROJECT TITLE */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <label className="text-slate-200 font-mono text-[11px] block font-bold">
                    Project Title (Priority 2) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Keralassery Residential Building Plan & Permit"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <div className="text-[10px] text-slate-400 font-mono">
                    Clear descriptive title for drawings, estimation, and official permit records.
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-mono text-[11px] block mb-1.5 font-bold">
                    Site Location / Re-Survey No / Village / Local Body
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Keralassery Panchayath, RSy No: 100/1, Palakkad"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                  <div>
                    <label className="text-slate-300 text-[11px] block mb-1.5 font-bold">
                      Assignee Staff *
                    </label>
                    <select
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value as StaffName)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-cyan-400 font-bold text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="DEEPAK">DEEPAK</option>
                      <option value="VISHNU">VISHNU</option>
                      <option value="DIBIN">DIBIN</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-[11px] block mb-1.5 font-bold">
                      Initial Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-300 font-bold text-xs focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="LAND SURVEY">LAND SURVEY</option>
                      <option value="PROGRESS">PROGRESS</option>
                      <option value="READY TO SUBMIT">READY TO SUBMIT</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 text-[11px] block mb-1.5 font-bold">
                      Target Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-mono text-[11px] block mb-1.5 font-bold">
                    Project Overview / Scope of Work
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide brief details about drawings, survey, estimate, valuation or permit requirements..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: TASKS & SUBTASKS (SELECT FROM MASTER REPOSITORY OR ADD NEW) */}
          {/* ========================================================================= */}
          {(viewMode === "expanded" || activeTab === "subtasks") && (
            <div className="space-y-5 bg-slate-950/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2. Tasks & Subtasks ({completedSubtasksCount}/{subTasks.length})</span>
                </div>
                {subTasks.length > 0 && (
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {subtasksPercent}% Completed
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {subTasks.length > 0 && (
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${subtasksPercent}%` }}
                  />
                </div>
              )}

              {/* Added Project Tasks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="font-bold uppercase text-slate-300">
                    Assigned Project Tasks ({subTasks.length}):
                  </span>
                  {subTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSubTasks([])}
                      className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {subTasks.length === 0 ? (
                  <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center space-y-2">
                    <ListTodo className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400 font-sans">
                      No tasks assigned yet. Select tasks from the master library below or add a custom task.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {subTasks.map((st) => (
                      <div
                        key={st.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          st.completed
                            ? "bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                            : "bg-slate-900/90 border-slate-800 text-white"
                        }`}
                      >
                        <div
                          onClick={() => handleToggleSubtask(st.id)}
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-2 select-none"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSubtask(st.id);
                            }}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                              st.completed
                                ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-sm shadow-emerald-500/50 font-black"
                                : "bg-slate-950 border-slate-700 text-transparent hover:border-emerald-400 hover:text-emerald-400/50"
                            }`}
                            title={st.completed ? "Mark incomplete" : "Click tick mark to complete (green)"}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span
                            className={`text-xs font-sans break-words transition-colors ${
                              st.completed
                                ? "text-emerald-400 font-bold line-through decoration-emerald-500/60"
                                : "text-slate-200 font-medium"
                            }`}
                          >
                            {st.title}
                          </span>
                          {st.completed && (
                            <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-600/60 shrink-0">
                              DONE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={st.assignee || assignee}
                            onChange={(e) => {
                              const newStaff = e.target.value as StaffName;
                              setSubTasks((prev) =>
                                prev.map((item) =>
                                  item.id === st.id ? { ...item, assignee: newStaff } : item
                                )
                              );
                            }}
                            className="bg-slate-950 border border-slate-700 text-cyan-300 text-[10px] font-mono font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:border-cyan-500"
                            title="Arrange assignee for this task"
                          >
                            <option value="DEEPAK">👤 DEEPAK</option>
                            <option value="VISHNU">👤 VISHNU</option>
                            <option value="DIBIN">👤 DIBIN</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDeleteSubtask(st.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
                            title="Remove task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Master Registered Tasks Library Picker */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white font-sans uppercase">
                      Select From Master Tasks Repository ({registeredTasksList.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Click to add to current project
                  </span>
                </div>

                {/* Search & Category Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search master tasks..."
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-sans"
                    />
                  </div>

                  <select
                    value={selectedTaskCategory}
                    onChange={(e) => setSelectedTaskCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-cyan-300 font-mono cursor-pointer"
                  >
                    <option value="ALL">All Categories ({registeredTasksList.length})</option>
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Master Tasks Cards Carousel / Grid */}
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {filteredRegisteredTasks.map((task) => {
                    const isAdded = subTasks.some(
                      (st) => st.title.toLowerCase() === task.title.toLowerCase()
                    );
                    return (
                      <div
                        key={task.id}
                        className="bg-slate-950/80 border border-slate-800/90 hover:border-emerald-500/50 rounded-xl p-2.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                              {task.category}
                            </span>
                            <h4 className="text-xs font-bold text-white truncate">
                              {task.title}
                            </h4>
                          </div>
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {task.subtasks.length} subtasks: {task.subtasks.slice(0, 2).join(", ")}
                              {task.subtasks.length > 2 ? "..." : ""}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddRegisteredTask(task, true)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-mono font-black transition-colors cursor-pointer"
                          >
                            + All ({task.subtasks?.length || 0})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddRegisteredTask(task, false)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Add main task title only"
                          >
                            + Main
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Task - AUTOMATICALLY SAVED UNDER TASKS TAB */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-sans uppercase flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Custom Task (Auto-Saves to Master Tasks Tab)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Syncs Globally</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Task title (e.g. Electrical Layout & Inverter Load Calculation)"
                        value={newCustomTaskTitle}
                        onChange={(e) => setNewCustomTaskTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <select
                        value={customTaskCategory}
                        onChange={(e) => setCustomTaskCategory(e.target.value as RegisteredTask["category"])}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono cursor-pointer"
                      >
                        {TASK_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Optional subtasks (comma-separated, e.g. Conduit marking, DB sizing, Earthing point check)"
                    value={newCustomSubtasksInput}
                    onChange={(e) => setNewCustomSubtasksInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleAddCustomTask}
                      disabled={!newCustomTaskTitle.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add & Auto-Save Task</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 3: ATTACHMENTS & DRAWINGS */}
          {/* ========================================================================= */}
          {(viewMode === "expanded" || activeTab === "attachments") && (
            <div className="space-y-4 bg-slate-950/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                  <Paperclip className="w-4 h-4" />
                  <span>3. Drawings, Documents & Web Links ({attachments.length})</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setAttachmentMethod("browse")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      attachmentMethod === "browse" ? "bg-slate-800 text-cyan-300" : "text-slate-400"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachmentMethod("link")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      attachmentMethod === "link" ? "bg-slate-800 text-cyan-300" : "text-slate-400"
                    }`}
                  >
                    Web / Drive Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttachmentMethod("paste")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      attachmentMethod === "paste" ? "bg-slate-800 text-cyan-300" : "text-slate-400"
                    }`}
                  >
                    Paste Text/Link
                  </button>
                </div>
              </div>

              {/* Upload Interface */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                {attachmentMethod === "browse" && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Optional document label (e.g. Ground Floor Approved Drawing)"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center bg-slate-950/60">
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-xs text-slate-200 font-bold">Choose drawing, PDF or photo</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">Supports PDF, DWG, PNG, JPG</span>
                      <input
                        type="file"
                        onChange={handleBrowseFileUpload}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf,.txt"
                      />
                    </label>
                  </div>
                )}

                {attachmentMethod === "link" && (
                  <form onSubmit={handleAddLinkAttachment} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Document title (e.g. Google Drive CAD Folder)"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={newAttachmentUrl}
                        onChange={(e) => setNewAttachmentUrl(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer"
                      >
                        Attach Link
                      </button>
                    </div>
                  </form>
                )}

                {attachmentMethod === "paste" && (
                  <div className="space-y-2 text-center py-2">
                    <button
                      type="button"
                      onClick={handlePasteClipboardAttachment}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-xl text-xs font-mono inline-flex items-center gap-2 border border-slate-700 cursor-pointer"
                    >
                      <Paperclip className="w-4 h-4" />
                      <span>Paste from Clipboard (URL or Note)</span>
                    </button>
                    {pastedStatus && (
                      <div className="text-xs font-mono text-emerald-400 mt-1">{pastedStatus}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments List */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono text-center py-2">
                    No files attached yet.
                  </div>
                ) : (
                  attachments.map((att) => (
                    <div
                      key={att.id}
                      className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono font-bold bg-slate-950 text-cyan-400 px-2 py-0.5 rounded border border-slate-800">
                          {att.type}
                        </span>
                        <span className="text-white font-medium truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{att.size}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 4: COMMENTS & REMARKS */}
          {/* ========================================================================= */}
          {(viewMode === "expanded" || activeTab === "comments") && (
            <div className="space-y-4 bg-slate-950/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                  <MessageSquare className="w-4 h-4" />
                  <span>4. Internal Comments & Handover Notes ({comments.length})</span>
                </div>
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex gap-2">
                  <select
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value as StaffName)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-cyan-400 font-mono font-bold"
                  >
                    <option value="DIBIN">DIBIN</option>
                    <option value="DEEPAK">DEEPAK</option>
                    <option value="VISHNU">VISHNU</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Type an internal remark, site update, or client request..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer"
                  >
                    Post
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-2">
                {comments.length === 0 ? (
                  <div className="text-xs text-slate-500 font-mono text-center py-2">
                    No comments yet.
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-start justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {comment.author}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 font-sans leading-relaxed">
                          {comment.text}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 5: ACTIVITY TIMELINE PREVIEW */}
          {/* ========================================================================= */}
          {(viewMode === "expanded" || activeTab === "activity") && (
            <div className="space-y-4 bg-slate-950/60 p-5 sm:p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm uppercase">
                  <History className="w-4 h-4" />
                  <span>5. Initial Activity & Audit Log Preview</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-start gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-white font-bold">
                      {assignee} will register project for: {clientName || "Unnamed Client"}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Project: {title || "Untitled Project"} • {new Date().toLocaleString()}
                    </div>
                  </div>
                </div>

                {subTasks.length > 0 && (
                  <div className="flex items-start gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white font-bold">
                        {subTasks.length} Deliverables & Tasks assigned
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {completedSubtasksCount} marked completed, {subTasks.length - completedSubtasksCount} pending
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="text-xs font-mono text-slate-400 hidden sm:block">
            Client: <span className="text-emerald-400 font-bold">{clientName || "Not set"}</span> • {subTasks.length} Tasks • {attachments.length} Files
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-mono font-black uppercase tracking-wider shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
