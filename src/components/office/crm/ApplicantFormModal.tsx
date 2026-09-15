import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Phone,
  IndianRupee,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import {
  OnlineApplicantRecord,
  ApplicationDetailItem,
  OnlineApplicationStatus
} from "../../../types";
import {
  upsertOnlineApplicant,
  addStoredPortal
} from "../../../utils/onlineApplicationsManager";
import { ApplicationPortalSelector } from "./ApplicationPortalSelector";
import { loadApplicationTypes } from "../../../data/applicationTypesData";

interface ApplicantFormModalProps {
  applicant: OnlineApplicantRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (saved: OnlineApplicantRecord) => void;
}

const STATUS_OPTIONS: { value: OnlineApplicationStatus; label: string; color: string }[] = [
  { value: "SUBMITTED", label: "Submitted", color: "bg-blue-950 text-blue-300" },
  { value: "APPROVED", label: "Approved", color: "bg-emerald-950 text-emerald-300" },
  { value: "DELIVERED", label: "Delivered", color: "bg-purple-950 text-purple-300" }
];

export const ApplicantFormModal: React.FC<ApplicantFormModalProps> = ({
  applicant,
  isOpen,
  onClose,
  onSaved
}) => {
  if (!isOpen) return null;

  const [applicantName, setApplicantName] = useState<string>("");
  const [mobileNo, setMobileNo] = useState<string>("");
  const [status, setStatus] = useState<OnlineApplicationStatus>("SUBMITTED");
  const [notes, setNotes] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Application entries state
  const [applications, setApplications] = useState<ApplicationDetailItem[]>([]);

  useEffect(() => {
    const appTypes = loadApplicationTypes();
    const primaryType = appTypes[0] || { name: "POSSESSION CERTIFICATE", fee: 70, userId: "USER ID" };
    const createDefaultApp = (): ApplicationDetailItem => ({
      id: `app_entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      portal: primaryType.name,
      applicationNumber: "",
      loginId: primaryType.userId || "USER ID",
      portalUrl: "",
      submissionDate: new Date().toISOString().split("T")[0],
      billAmount: primaryType.fee || 70,
      paidAmount: 0,
      paymentStatus: "PENDING",
      remarks: ""
    });

    if (applicant) {
      setApplicantName(applicant.applicantName || "");
      setMobileNo(applicant.mobileNo || "");
      setStatus(applicant.status || "SUBMITTED");
      setNotes(applicant.notes || "");
      setApplications(
        applicant.applications && applicant.applications.length > 0
          ? applicant.applications
          : [createDefaultApp()]
      );
    } else {
      setApplicantName("");
      setMobileNo("");
      setStatus("SUBMITTED");
      setNotes("");
      setApplications([createDefaultApp()]);
    }
    setErrorMessage("");
  }, [applicant, isOpen]);

  // Compute total bill and paid from applications
  const totalAppsBill = applications.reduce((sum, a) => sum + (a.billAmount || 0), 0);
  const totalAppsPaid = applications.reduce((sum, a) => sum + (a.paidAmount || 0), 0);
  const balance = Math.max(0, totalAppsBill - totalAppsPaid);
  const isPaid = totalAppsBill > 0 && totalAppsPaid >= totalAppsBill;

  const handleAddApplicationRow = () => {
    const appTypes = loadApplicationTypes();
    const primaryType = appTypes[0] || { name: "POSSESSION CERTIFICATE", fee: 70, userId: "USER ID" };
    const newRow: ApplicationDetailItem = {
      id: `app_entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      portal: primaryType.name,
      applicationNumber: "",
      loginId: primaryType.userId || "USER ID",
      portalUrl: "",
      submissionDate: new Date().toISOString().split("T")[0],
      billAmount: primaryType.fee || 70,
      paidAmount: 0,
      paymentStatus: "PENDING",
      remarks: ""
    };
    setApplications((prev) => [...prev, newRow]);
  };

  const handleRemoveAppItem = (id: string) => {
    if (applications.length <= 1) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateAppField = (id: string, field: keyof ApplicationDetailItem, value: any) => {
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, [field]: value };
        if (field === "billAmount" || field === "paidAmount") {
          const b = Math.max(0, Number(field === "billAmount" ? value : a.billAmount) || 0);
          const p = Math.max(0, Number(field === "paidAmount" ? value : a.paidAmount) || 0);
          updated.paymentStatus = b > 0 && p >= b ? "PAID" : p > 0 ? "PARTIAL" : "PENDING";
        }
        return updated;
      })
    );
  };

  const handlePortalChange = (appId: string, portalName: string, portalUrl?: string) => {
    const appTypes = loadApplicationTypes();
    const matched = appTypes.find(
      (t) => t.name.toLowerCase() === portalName.toLowerCase().trim()
    );

    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const newBill = matched && typeof matched.fee === "number" ? matched.fee : a.billAmount;
        const newLogin = matched && matched.userId ? matched.userId : a.loginId;
        const p = a.paidAmount || 0;
        return {
          ...a,
          portal: portalName,
          portalUrl: portalUrl !== undefined ? portalUrl : a.portalUrl,
          billAmount: newBill,
          loginId: newLogin || a.loginId,
          paymentStatus: newBill > 0 && p >= newBill ? "PAID" : p > 0 ? "PARTIAL" : "PENDING"
        };
      })
    );
    // Store portal name in persistent search library
    if (portalName.trim()) {
      addStoredPortal(portalName.trim(), portalUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !mobileNo.trim()) {
      setErrorMessage("Please enter Applicant Name and Mobile Number.");
      return;
    }

    // Filter applications that have a portal name
    const validApps = applications
      .filter((a) => a.portal.trim() !== "")
      .map((app) => {
        // Save any custom typed portal names to persistent library
        addStoredPortal(app.portal.trim(), app.portalUrl);

        const bill = Math.max(0, Number(app.billAmount) || 0);
        const paid = Math.max(0, Number(app.paidAmount) || 0);
        return {
          ...app,
          portal: app.portal.trim(),
          applicationNumber: app.applicationNumber.trim(),
          loginId: app.loginId.trim(),
          billAmount: bill,
          paidAmount: paid,
          isApproved: !!app.isApproved,
          paymentStatus: bill > 0 && paid >= bill ? ("PAID" as const) : paid > 0 ? ("PARTIAL" as const) : ("PENDING" as const)
        };
      });

    const calcBill = validApps.reduce((sum, a) => sum + (a.billAmount || 0), 0);
    const calcPaid = validApps.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

    const record: OnlineApplicantRecord = {
      id: applicant ? applicant.id : `online_app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      applicantName: applicantName.trim(),
      mobileNo: mobileNo.trim(),
      applications: validApps,
      status: status,
      isCompleted: applicant ? (applicant.isCompleted ?? (applicant.status === "COMPLETED")) : false,
      billAmount: calcBill,
      paidAmount: calcPaid,
      paymentMode: applicant?.paymentMode || "UPI_QR",
      notes: notes.trim() || undefined,
      createdAt: applicant?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    upsertOnlineApplicant(record);
    onSaved(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-white relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {applicant ? "Edit Online Applicant & Applications" : "New Online Applicant Record"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Vasthusilpy Project Pipeline & Window — Online Applications & Login Directory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Top Info Grid (Removed Property / Site Address) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
                Applicant Name <span className="text-rose-400">*</span>:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Full name of applicant"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
                Mobile Number <span className="text-rose-400">*</span>:
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1 font-bold">
                Application Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OnlineApplicationStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Internal Remarks / Notes */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              Internal Remarks / Notes:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Village Office survey completed, Overseer site verification pending"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* SECTION: APPLICATIONS IN VIEWABLE, SEARCHABLE & MANUALLY TYPABLE FORMAT */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase text-white">
                  Applications & Logins ({applications.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  — Type manually or select from stored library
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddApplicationRow}
                className="text-xs font-mono font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Add Another Application</span>
              </button>
            </div>

            {/* List of current application items */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {applications.map((app, idx) => {
                const appBill = app.billAmount || 0;
                const appPaid = app.paidAmount || 0;
                const isAppSettled = appBill > 0 && appPaid >= appBill;

                return (
                  <div
                    key={app.id}
                    className={`border rounded-2xl p-3.5 space-y-2.5 text-xs font-mono transition-all ${
                      isAppSettled
                        ? "bg-emerald-950/20 border-emerald-800/60 shadow-sm shadow-emerald-950/30"
                        : "bg-slate-950/90 border-slate-800 shadow-sm"
                    }`}
                  >
                    {/* Top Row: Index, Manual / Stored Portal Selector & Delete Button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Application Name:
                          </span>
                        </div>

                        {/* Viewable & Manually Typable Stored Application Selector */}
                        <ApplicationPortalSelector
                          value={app.portal}
                          onChange={(portalName, portalUrl) =>
                            handlePortalChange(app.id, portalName, portalUrl)
                          }
                          placeholder="Type application name manually (e.g. POSSESSION CERTIFICATE)..."
                        />
                      </div>

                      {applications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAppItem(app.id)}
                          className="text-rose-400 hover:text-rose-200 p-1.5 hover:bg-rose-950/60 rounded-xl transition-colors cursor-pointer shrink-0 mt-1"
                          title="Remove this application entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Inputs: App No, Login ID, Bill (₹), Paid (₹) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div>
                        <span className="text-xs text-slate-300 uppercase font-bold block mb-1">
                          Application Number:
                        </span>
                        <input
                          type="text"
                          value={app.applicationNumber}
                          onChange={(e) =>
                            handleUpdateAppField(app.id, "applicationNumber", e.target.value)
                          }
                          placeholder="e.g. APP-2026/089"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold tracking-wide focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Login ID / User:
                        </span>
                        <input
                          type="text"
                          value={app.loginId}
                          onChange={(e) => handleUpdateAppField(app.id, "loginId", e.target.value)}
                          placeholder="User ID / Mobile"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Fee / Bill (₹):
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={app.billAmount ?? 0}
                          onChange={(e) =>
                            handleUpdateAppField(app.id, "billAmount", Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white font-bold focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">
                            Paid (₹):
                          </span>
                          {(app.billAmount || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateAppField(app.id, "paidAmount", app.billAmount)
                              }
                              className="text-[9px] text-emerald-400 hover:underline cursor-pointer"
                            >
                              Full Due
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={app.paidAmount ?? 0}
                          onChange={(e) =>
                            handleUpdateAppField(app.id, "paidAmount", Number(e.target.value))
                          }
                          placeholder="0"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Approval Checkbox */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none group">
                        <input
                          type="checkbox"
                          checked={!!app.isApproved}
                          onChange={(e) =>
                            handleUpdateAppField(app.id, "isApproved", e.target.checked)
                          }
                          className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 cursor-pointer"
                        />
                        <span className={`text-xs font-bold transition-colors ${
                          app.isApproved ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"
                        }`}>
                          {app.isApproved ? "✓ Application Approved (അംഗീകരിച്ചു)" : "Mark as Approved (അംഗീകരിക്കുക)"}
                        </span>
                      </label>
                      {app.isApproved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                          APPROVED
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Billing & Payment Total Summary Strip */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Bill:</span>
                <span className="font-bold text-sm text-white">₹{totalAppsBill.toLocaleString("en-IN")}</span>
              </div>
              <span className="text-slate-700">|</span>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Total Paid:</span>
                <span className="font-bold text-sm text-emerald-400">
                  ₹{totalAppsPaid.toLocaleString("en-IN")}
                </span>
              </div>
              <span className="text-slate-700">|</span>
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Balance Due:</span>
                <span className={`font-bold text-sm ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  ₹{balance.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {isPaid && (
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Row will display in GREEN (Settled)
              </span>
            )}
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs font-mono flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{applicant ? "SAVE APPLICANT & APPLICATIONS" : "CREATE APPLICANT RECORD"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
