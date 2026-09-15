import React, { useState } from "react";
import {
  CrmProject,
  StaffName,
  ProjectStatus,
  SubTask,
  ProjectComment,
  Invoice
} from "../../../types";
import { ensureTaskRegistered } from "../../../data/registeredTasksData";
import {
  X,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Paperclip,
  MessageSquare,
  History,
  Plus,
  Trash2,
  Building2,
  Phone,
  MapPin,
  ChevronRight,
  Send,
  Lock,
  ShieldCheck,
  Check,
  Share2,
  QrCode,
  FileUp,
  Clipboard,
  Link2,
  ExternalLink,
  Eye,
  Edit3,
  CreditCard,
  Receipt
} from "lucide-react";

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: CrmProject;
  invoices?: Invoice[];
  onUpdateProject: (updated: CrmProject) => void;
  onDeleteProject: (id: string) => void;
  onShareProject?: (project: CrmProject) => void;
  onEditProject?: (project: CrmProject) => void;
  onRecordPaymentForInvoice?: (invoice: Invoice) => void;
  onCreateInvoiceForProject?: (project: CrmProject) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
  onDeleteInvoice?: (invoiceId: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
  invoices = [],
  onUpdateProject,
  onDeleteProject,
  onShareProject,
  onEditProject,
  onRecordPaymentForInvoice,
  onCreateInvoiceForProject,
  onSelectInvoice,
  onEditInvoice,
  onDeleteInvoice
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "subtasks" | "attachments" | "comments" | "activity"
  >("overview");

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<StaffName>(
    project.assignee || "DEEPAK"
  );
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedCommentAuthor, setSelectedCommentAuthor] = useState<StaffName>("DIBIN");
  
  // Attachments State
  const [attachmentMethod, setAttachmentMethod] = useState<"browse" | "paste" | "link">("browse");
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentType, setNewAttachmentType] = useState("PDF");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [pastedStatus, setPastedStatus] = useState<string | null>(null);
  const [previewAttachmentUrl, setPreviewAttachmentUrl] = useState<{ url: string; name: string } | null>(null);

  if (!isOpen) return null;

  const staffList: StaffName[] = ["DEEPAK", "VISHNU", "DIBIN"];
  const statusList: ProjectStatus[] = [
    "PENDING",
    "LAND SURVEY",
    "PROGRESS",
    "READY TO SUBMIT",
    "COMPLETED"
  ];

  // Handle Assignee Swap
  const handleAssigneeChange = (newStaff: StaffName) => {
    if (newStaff === project.assignee) return;
    const activityMsg = `Changed assignee from ${project.assignee} to ${newStaff}`;
    const updated: CrmProject = {
      ...project,
      assignee: newStaff,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: newStaff,
          action: activityMsg,
          timestamp: new Date().toLocaleString()
        },
        ...project.activities
      ]
    };
    onUpdateProject(updated);
  };

  // Handle Status Change
  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (newStatus === project.status) return;

    const activityMsg = `Changed status from ${project.status} to ${newStatus}`;
    const updated: CrmProject = {
      ...project,
      status: newStatus,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: project.assignee,
          action: activityMsg,
          timestamp: new Date().toLocaleString()
        },
        ...project.activities
      ]
    };
    onUpdateProject(updated);
  };

  // Handle Subtask Toggle
  const handleToggleSubtask = (stId: string) => {
    const updatedTasks = project.subTasks.map((st) =>
      st.id === stId ? { ...st, completed: !st.completed } : st
    );
    onUpdateProject({ ...project, subTasks: updatedTasks });
  };

  // Add Subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const cleanTitle = newSubtaskTitle.trim();
    const newTask: SubTask = {
      id: `st_${Date.now()}`,
      title: cleanTitle,
      completed: false,
      assignee: newSubtaskAssignee || project.assignee || "DEEPAK"
    };
    onUpdateProject({ ...project, subTasks: [...project.subTasks, newTask] });
    
    // Auto-save to Master Tasks Tab
    try {
      const taskClean = cleanTitle.replace(/^[↳•\-\*]\s*/, "");
      ensureTaskRegistered(taskClean);
    } catch (err) {
      console.warn("Failed to auto register subtask:", err);
    }

    setNewSubtaskTitle("");
  };

  // Change Subtask Assignee
  const handleSubtaskAssigneeChange = (stId: string, assignee: StaffName) => {
    const updatedTasks = project.subTasks.map((st) =>
      st.id === stId ? { ...st, assignee } : st
    );
    onUpdateProject({
      ...project,
      subTasks: updatedTasks,
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: assignee,
          action: `Reassigned subtask to ${assignee}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...project.activities
      ]
    });
  };

  // Delete Subtask
  const handleDeleteSubtask = (stId: string) => {
    const updatedTasks = project.subTasks.filter((st) => st.id !== stId);
    onUpdateProject({ ...project, subTasks: updatedTasks });
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newComment: ProjectComment = {
      id: `c_${Date.now()}`,
      author: selectedCommentAuthor,
      text: newCommentText.trim(),
      timestamp: new Date().toLocaleString()
    };
    const updated: CrmProject = {
      ...project,
      comments: [newComment, ...project.comments],
      activities: [
        {
          id: `act_${Date.now()}`,
          actor: selectedCommentAuthor,
          action: `Added comment: "${newCommentText.trim().substring(0, 30)}..."`,
          timestamp: new Date().toLocaleString()
        },
        ...project.activities
      ]
    };
    onUpdateProject(updated);
    setNewCommentText("");
  };

  // Browse File Upload Handler
  const handleBrowseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const fileExt = file.name.split(".").pop()?.toUpperCase() || "FILE";
          const newAtt = {
            id: `att_${Date.now()}`,
            name: file.name,
            type: fileExt,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            uploadedAt: new Date().toISOString().split("T")[0],
            url: uploadEvent.target.result as string
          };
          onUpdateProject({
            ...project,
            attachments: [newAtt, ...project.attachments]
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Paste Event on Paste Zone
  const handlePasteAttachment = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    setPastedStatus(null);

    // 1. Check for files (pasted image / screenshot)
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const newAtt = {
            id: `att_${Date.now()}`,
            name: `Pasted_Attachment_${Date.now().toString().slice(-4)}.${file.type.split("/")[1] || "png"}`,
            type: file.type.startsWith("image/") ? "Image" : "File",
            size: `${(file.size / 1024).toFixed(1)} KB`,
            uploadedAt: new Date().toISOString().split("T")[0],
            url: uploadEvent.target.result as string
          };
          onUpdateProject({
            ...project,
            attachments: [newAtt, ...project.attachments]
          });
          setPastedStatus("Successfully pasted & attached file from clipboard!");
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. Check for pasted text / URL
    const text = e.clipboardData.getData("text");
    if (text) {
      if (text.startsWith("http://") || text.startsWith("https://")) {
        const newAtt = {
          id: `att_${Date.now()}`,
          name: newAttachmentName.trim() || `Pasted Link (${new URL(text).hostname})`,
          type: text.includes("drive.google.com") ? "G-Drive Link" : "Web Link",
          size: "Link",
          uploadedAt: new Date().toISOString().split("T")[0],
          url: text.trim()
        };
        onUpdateProject({
          ...project,
          attachments: [newAtt, ...project.attachments]
        });
        setPastedStatus("Successfully attached link from clipboard!");
      } else {
        setPastedStatus("Pasted text saved as attachment note.");
        const newAtt = {
          id: `att_${Date.now()}`,
          name: text.substring(0, 30) + "...",
          type: "Note",
          size: "Text",
          uploadedAt: new Date().toISOString().split("T")[0]
        };
        onUpdateProject({
          ...project,
          attachments: [newAtt, ...project.attachments]
        });
      }
    }
  };

  // Add Link Attachment Handler
  const handleAddLinkAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttachmentUrl.trim()) return;
    const newAtt = {
      id: `att_${Date.now()}`,
      name: newAttachmentName.trim() || "Google Drive / Web Document Link",
      type: newAttachmentUrl.includes("drive.google.com") ? "G-Drive" : "Web Link",
      size: "Link",
      uploadedAt: new Date().toISOString().split("T")[0],
      url: newAttachmentUrl.trim()
    };
    onUpdateProject({
      ...project,
      attachments: [newAtt, ...project.attachments]
    });
    setNewAttachmentName("");
    setNewAttachmentUrl("");
  };

  // Delete Attachment Handler
  const handleDeleteAttachment = (attId: string) => {
    const updatedAttachments = project.attachments.filter((a) => a.id !== attId);
    onUpdateProject({
      ...project,
      attachments: updatedAttachments
    });
  };

  // Calculate Subtask Progress
  const totalSubtasks = project.subTasks.length;
  const completedSubtasks = project.subTasks.filter((st) => st.completed).length;
  const subtaskPercent =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded uppercase">
                CRM PROJECT #{project.id}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Created {project.createdAt}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white font-sans">
              {project.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onShareProject && (
              <button
                type="button"
                onClick={() => onShareProject(project)}
                className="px-3.5 py-2 bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                title="Share via QR Code & Link"
              >
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>SHARE (QR & LINK)</span>
              </button>
            )}

            {onEditProject && (
              <button
                type="button"
                onClick={() => onEditProject(project)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Edit Project"
              >
                <Edit3 className="w-4 h-4" />
                <span>EDIT</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Attributes Bar: Assignee Swap, Status, Due Date, Invoice Status */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-4 px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 shrink-0 text-xs font-mono">
          {/* Assignee Swapping Button */}
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block uppercase flex items-center justify-between">
              <span>ASSIGNED STAFF</span>
              <span className="text-cyan-400 font-normal">Click to Swap</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {staffList.map((st) => (
                <button
                  key={st}
                  onClick={() => handleAssigneeChange(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    project.assignee === st
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              PROJECT STATUS
            </span>
            <select
              value={project.status}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-white font-bold text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {statusList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Picker */}
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">
              DUE DATE
            </span>
            <input
              type="date"
              value={project.dueDate}
              onChange={(e) =>
                onUpdateProject({ ...project, dueDate: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 text-emerald-400 font-bold text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Modal Tab Buttons */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Description & Details</span>
          </button>

          <button
            onClick={() => setActiveTab("subtasks")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "subtasks"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sub Tasks ({completedSubtasks}/{totalSubtasks})</span>
          </button>

          <button
            onClick={() => setActiveTab("attachments")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "attachments"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({project.attachments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "comments"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Comments ({project.comments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "activity"
                ? "bg-emerald-500 text-slate-950"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>All Activity ({project.activities.length})</span>
          </button>
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW & DESCRIPTION */}
          {activeTab === "overview" && (
            <div className="space-y-6 text-xs font-sans">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>CLIENT / CUSTOMER DETAILS</span>
                  </div>
                  <div className="text-sm font-bold text-white font-sans">
                    {project.clientName}
                  </div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{project.clientPhone}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SITE LOCATION / SURVEY NO</span>
                  </div>
                  <div className="text-sm font-bold text-white font-sans">
                    {project.location}
                  </div>
                  {project.estimatedAmount && (
                    <div className="text-emerald-400 font-bold">
                      Contract Value: ₹{project.estimatedAmount.toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>

              {/* Project Description Editor */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase block">
                  Project Description & Specifications
                </label>
                <textarea
                  value={project.description}
                  onChange={(e) =>
                    onUpdateProject({ ...project, description: e.target.value })
                  }
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 font-sans text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
                  placeholder="Enter detailed project scope, Vasthu requirements, and engineer notes..."
                />
              </div>

              {/* PROJECT INVOICE & PAYMENT RECORD CARD */}
              {(() => {
                const linkedInvoice = (invoices || []).find(
                  (inv) => inv.projectId === project.id || (project.invoiceId && inv.id === project.invoiceId)
                );

                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                            Project Invoice & Payment Record
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Direct invoice billing and customer payment logs
                          </p>
                        </div>
                      </div>

                      {linkedInvoice && (
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase ${
                            linkedInvoice.paymentStatus === "PAID"
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : linkedInvoice.paymentStatus === "PARTIALLY PAID"
                              ? "bg-amber-950 text-amber-400 border-amber-800"
                              : "bg-red-950 text-red-400 border-red-800"
                          }`}
                        >
                          {linkedInvoice.paymentStatus || "UNPAID"}
                        </span>
                      )}
                    </div>

                    {linkedInvoice ? (
                      <div className="space-y-3 font-mono">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block font-bold">Invoice No</span>
                            <span className="text-xs font-bold text-cyan-400">#{linkedInvoice.invoiceNumber}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block font-bold">Grand Total</span>
                            <span className="text-xs font-bold text-white">₹{linkedInvoice.grandTotal.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block font-bold">Total Paid</span>
                            <span className="text-xs font-bold text-emerald-400">₹{(linkedInvoice.totalPaid || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase block font-bold">Balance Due</span>
                            <span className="text-xs font-bold text-amber-300">₹{(linkedInvoice.balanceDue ?? linkedInvoice.grandTotal).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="text-[11px] font-mono text-slate-400">
                            Invoice Date: <strong className="text-slate-200">{linkedInvoice.invoiceDate}</strong>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectInvoice) {
                                  onSelectInvoice(linkedInvoice);
                                }
                              }}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold font-mono text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <Eye className="w-4 h-4" />
                              <span>VIEW INVOICE</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (onRecordPaymentForInvoice) {
                                  onRecordPaymentForInvoice(linkedInvoice);
                                }
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-mono text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>RECORD / PAY INVOICE</span>
                            </button>

                            {onEditInvoice && (
                              <button
                                type="button"
                                onClick={() => onEditInvoice(linkedInvoice)}
                                className="px-3 py-2 bg-slate-800 hover:bg-amber-950 text-amber-300 font-bold font-mono text-xs rounded-xl border border-slate-700 hover:border-amber-500/60 flex items-center gap-1.5 cursor-pointer transition-all"
                                title="Edit Invoice Details"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                <span>EDIT INVOICE</span>
                              </button>
                            )}

                            {onDeleteInvoice && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete Invoice #${linkedInvoice.invoiceNumber}?`)) {
                                    onDeleteInvoice(linkedInvoice.id);
                                  }
                                }}
                                className="px-3 py-2 bg-slate-800 hover:bg-rose-950 text-rose-400 font-bold font-mono text-xs rounded-xl border border-slate-700 hover:border-rose-700 flex items-center gap-1.5 cursor-pointer transition-all"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>DELETE INVOICE</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-200 font-sans">
                            No Linked Invoice Created
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Create an invoice for this project to record payments via Cash, Bank, or UPI QR.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (onCreateInvoiceForProject) {
                              onCreateInvoiceForProject(project);
                            }
                          }}
                          className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black font-mono text-xs rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Invoice</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Subtask Progress Summary */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">SUBTASK COMPLETION</span>
                  <span className="font-bold text-emerald-400">
                    {completedSubtasks} / {totalSubtasks} ({subtaskPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subtaskPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUB TASKS */}
          {activeTab === "subtasks" && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase">
                    SUB TASKS PROGRESS
                  </span>
                  <span className="font-bold text-emerald-400">
                    {completedSubtasks} of {totalSubtasks} Tasks Done ({subtaskPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${subtaskPercent}%` }}
                  />
                </div>
              </div>

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  type="text"
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Add a new subtask (e.g., Conduct site soil test)..."
                  className="flex-1 min-w-[200px] bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                />

                {/* Subtask Assignee Selector */}
                <select
                  value={newSubtaskAssignee}
                  onChange={(e) => setNewSubtaskAssignee(e.target.value as StaffName)}
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500 text-cyan-300 font-mono font-bold text-xs rounded-xl px-3 py-2.5 cursor-pointer focus:outline-none shrink-0"
                  title="Select Assignee for this Subtask"
                >
                  <option value="DEEPAK" className="bg-slate-900 text-white">👤 Assignee: DEEPAK</option>
                  <option value="VISHNU" className="bg-slate-900 text-white">👤 Assignee: VISHNU</option>
                  <option value="DIBIN" className="bg-slate-900 text-white">👤 Assignee: DIBIN</option>
                </select>

                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>ADD TASK</span>
                </button>
              </form>

              {/* Subtasks List */}
              <div className="space-y-2">
                {project.subTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic text-center py-6">
                    No subtasks added yet. Use the field above to add tasks.
                  </p>
                ) : (
                  project.subTasks.map((st) => (
                    <div
                      key={st.id}
                      className={`border rounded-xl p-3 flex items-center justify-between gap-3 text-xs transition-all ${
                        st.completed
                          ? "bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.18)]"
                          : "bg-slate-950 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div
                        onClick={() => handleToggleSubtask(st.id)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 select-none"
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
                              : "bg-slate-900 border-slate-700 text-transparent hover:border-emerald-400 hover:text-emerald-400/50"
                          }`}
                          title={st.completed ? "Mark incomplete" : "Click tick mark to complete (green)"}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <span
                          className={`font-sans transition-colors break-words ${
                            st.completed
                              ? "text-emerald-400 font-bold line-through decoration-emerald-500/60"
                              : "text-slate-200"
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

                      {/* Subtask Assignee and Delete Actions */}
                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/70 px-2 py-1 rounded-lg">
                          <span className="text-[10px] text-slate-400 font-mono">Assignee:</span>
                          <select
                            value={st.assignee || project.assignee || "DEEPAK"}
                            onChange={(e) => handleSubtaskAssigneeChange(st.id, e.target.value as StaffName)}
                            className="bg-transparent text-cyan-300 font-mono font-bold text-[11px] focus:outline-none cursor-pointer"
                            title="Change Subtask Assignee"
                          >
                            <option value="DEEPAK" className="bg-slate-900 text-white">DEEPAK</option>
                            <option value="VISHNU" className="bg-slate-900 text-white">VISHNU</option>
                            <option value="DIBIN" className="bg-slate-900 text-white">DIBIN</option>
                          </select>
                        </div>

                        <button
                          onClick={() => handleDeleteSubtask(st.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Delete Subtask"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="space-y-6">
              {/* Attachment Method Selectors */}
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setAttachmentMethod("browse")}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    attachmentMethod === "browse"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span>1. BROWSE FILE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttachmentMethod("paste")}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    attachmentMethod === "paste"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>2. PASTE FROM CLIPBOARD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAttachmentMethod("link")}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    attachmentMethod === "link"
                      ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>3. ADD DRIVE / WEB LINK</span>
                </button>
              </div>

              {/* METHOD 1: BROWSE FILE */}
              {attachmentMethod === "browse" && (
                <div className="bg-slate-950 p-5 rounded-2xl border border-dashed border-indigo-900/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                    <FileUp className="w-4 h-4" />
                    <span>BROWSE & UPLOAD LOCAL COMPUTER FILES (PDF, PNG, JPG, CAD, DOCX)</span>
                  </div>
                  <input
                    type="file"
                    onChange={handleBrowseFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-950 file:text-indigo-300 hover:file:bg-indigo-900 cursor-pointer font-mono"
                  />
                  <p className="text-[11px] text-slate-500 font-mono">
                    Select any file from your device. It will be converted & attached directly to Project #{project.id}.
                  </p>
                </div>
              )}

              {/* METHOD 2: PASTE BOX */}
              {attachmentMethod === "paste" && (
                <div
                  onPaste={handlePasteAttachment}
                  tabIndex={0}
                  className="bg-slate-950 p-6 rounded-2xl border border-dashed border-cyan-500/50 hover:border-cyan-400 transition-colors space-y-3 text-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <Clipboard className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
                  <div className="space-y-1">
                    <p className="font-mono font-bold text-white text-xs uppercase">
                      CLICK HERE & PRESS <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-300">CTRL + V</kbd> (OR <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-cyan-300">CMD + V</kbd>) TO PASTE
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Paste screenshots, image clips, copied document text, or Google Drive URL directly from your clipboard!
                    </p>
                  </div>
                  {pastedStatus && (
                    <div className="p-2 bg-emerald-950/90 border border-emerald-800 text-emerald-300 text-xs font-mono rounded-xl">
                      {pastedStatus}
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 3: ADD LINK */}
              {attachmentMethod === "link" && (
                <form onSubmit={handleAddLinkAttachment} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <Link2 className="w-4 h-4" />
                    <span>ADD GOOGLE DRIVE OR WEB URL LINK</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Attachment Title (e.g. KPBR 2019 Site Drawing)"
                      value={newAttachmentName}
                      onChange={(e) => setNewAttachmentName(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <input
                      type="url"
                      required
                      placeholder="https://drive.google.com/file/d/..."
                      value={newAttachmentUrl}
                      onChange={(e) => setNewAttachmentUrl(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs px-5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ATTACH LINK</span>
                  </button>
                </form>
              )}

              {/* Attachments List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-bold uppercase">
                  <span>ATTACHED PROJECT DOCUMENTS ({project.attachments.length})</span>
                </div>

                {project.attachments.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic text-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800">
                    No attachments uploaded yet. Use Browse, Paste, or Add Link above.
                  </p>
                ) : (
                  project.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Paperclip className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-white font-sans truncate">
                            {att.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Type: {att.type} • {att.size || "1 MB"} • Uploaded {att.uploadedAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {att.url && (
                          <button
                            onClick={() => {
                              if (att.url?.startsWith("data:image/") || att.url?.startsWith("http")) {
                                setPreviewAttachmentUrl({ url: att.url, name: att.name });
                              } else {
                                window.open(att.url, "_blank");
                              }
                            }}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                          title="Delete Attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ATTACHMENT PREVIEW MODAL LIGHTBOX */}
              {previewAttachmentUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                  <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-cyan-300 truncate">
                        {previewAttachmentUrl.name}
                      </span>
                      <button
                        onClick={() => setPreviewAttachmentUrl(null)}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950">
                      {previewAttachmentUrl.url.startsWith("data:image/") ? (
                        <img src={previewAttachmentUrl.url} alt={previewAttachmentUrl.name} className="max-w-full max-h-[60vh] object-contain rounded-xl" />
                      ) : (
                        <iframe src={previewAttachmentUrl.url} className="w-full h-[60vh] border-0" title={previewAttachmentUrl.name} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMMENTS */}
          {activeTab === "comments" && (
            <div className="space-y-6">
              {/* New Comment Input */}
              <form onSubmit={handleAddComment} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    POST PROJECT COMMENT / INSTRUCTION
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Post As:
                    </span>
                    <select
                      value={selectedCommentAuthor}
                      onChange={(e) =>
                        setSelectedCommentAuthor(e.target.value as StaffName)
                      }
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-cyan-400 font-mono font-bold"
                    >
                      {staffList.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    rows={2}
                    placeholder="Type engineering note, site feedback, or instructions..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs px-4 rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0 self-end py-3"
                  >
                    <Send className="w-4 h-4" />
                    <span>POST</span>
                  </button>
                </div>
              </form>

              {/* Comments Stream */}
              <div className="space-y-3">
                {project.comments.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic text-center py-6">
                    No comments yet. Post the first project comment above.
                  </p>
                ) : (
                  project.comments.map((cm) => (
                    <div
                      key={cm.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1 text-xs font-sans"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 uppercase">
                          {cm.author}
                        </span>
                        <span className="text-slate-500">{cm.timestamp}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed pt-1">
                        {cm.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ALL ACTIVITY LOG */}
          {activeTab === "activity" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="text-xs font-bold text-emerald-400 uppercase">
                AUDIT TRAIL & SYSTEM ACTIVITY
              </div>

              <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                {project.activities.map((act) => (
                  <div key={act.id} className="relative py-1 space-y-0.5">
                    <div className="absolute -left-[21px] top-2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{act.actor}</span>
                      <span className="text-[10px] text-slate-500">
                        • {act.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs">
                      {act.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteProject(project.id);
            }}
            className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>DELETE PROJECT</span>
          </button>

          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-black text-xs px-6 py-2 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
