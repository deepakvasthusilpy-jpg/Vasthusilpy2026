import React, { useState } from "react";
import {
  X,
  Layers,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  IndianRupee,
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  DollarSign,
  AlertCircle
} from "lucide-react";
import {
  OnlineApplicantRecord,
  ApplicationDetailItem,
  ApplicationPaymentRecord
} from "../../../types";
import {
  addApplicationToApplicant,
  updateApplicationInApplicant,
  deleteApplicationFromApplicant,
  recordApplicationPayment,
  generateApplicationItemUpiUrl,
  DEFAULT_RECEIVER_UPI,
  addStoredPortal
} from "../../../utils/onlineApplicationsManager";
import { ApplicationPortalSelector } from "./ApplicationPortalSelector";
import { loadApplicationTypes } from "../../../data/applicationTypesData";

interface ManageApplicationsModalProps {
  applicant: OnlineApplicantRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: OnlineApplicantRecord) => void;
}

export const ManageApplicationsModal: React.FC<ManageApplicationsModalProps> = ({
  applicant,
  isOpen,
  onClose,
  onUpdated
}) => {
  if (!isOpen || !applicant) return null;

  const appTypes = loadApplicationTypes();
  const primaryType = appTypes[0] || { name: "POSSESSION CERTIFICATE", fee: 70, userId: "USER ID" };

  const [currentApplicant, setCurrentApplicant] = useState<OnlineApplicantRecord>(applicant);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);

  // Form states for add / edit
  const [portal, setPortal] = useState<string>(primaryType.name);
  const [customPortal, setCustomPortal] = useState<string>("");
  const [appNumber, setAppNumber] = useState<string>("");
  const [loginId, setLoginId] = useState<string>(primaryType.userId || "USER ID");
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [submissionDate, setSubmissionDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [billAmount, setBillAmount] = useState<number>(primaryType.fee || 70);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // In-modal payment entry state for a specific application
  const [activePaymentAppId, setActivePaymentAppId] = useState<string | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payMode, setPayMode] = useState<string>("UPI_QR");
  const [payRef, setPayRef] = useState<string>("");
  const [payNote, setPayNote] = useState<string>("");

  // Deletion confirm state (eliminates window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handlePortalSelect = (selected: string) => {
    setPortal(selected);
    const typesList = loadApplicationTypes();
    const matched = typesList.find((t) => t.name.toLowerCase() === selected.toLowerCase().trim());
    if (matched) {
      if (typeof matched.fee === "number") setBillAmount(matched.fee);
      if (matched.userId) setLoginId(matched.userId);
    }
  };

  const resetForm = () => {
    const typesList = loadApplicationTypes();
    const primary = typesList[0] || { name: "POSSESSION CERTIFICATE", fee: 70, userId: "USER ID" };
    setEditingAppId(null);
    setPortal(primary.name);
    setCustomPortal("");
    setAppNumber("");
    setLoginId(primary.userId || "USER ID");
    setPortalUrl("");
    setSubmissionDate(new Date().toISOString().split("T")[0]);
    setBillAmount(primary.fee || 70);
    setPaidAmount(0);
    setRemarks("");
    setErrorMessage("");
  };

  const startEdit = (app: ApplicationDetailItem) => {
    setEditingAppId(app.id);
    setPortal(app.portal);
    setCustomPortal("");
    setAppNumber(app.applicationNumber);
    setLoginId(app.loginId);
    setPortalUrl(app.portalUrl || "");
    setSubmissionDate(app.submissionDate || new Date().toISOString().split("T")[0]);
    setBillAmount(app.billAmount || 0);
    setPaidAmount(app.paidAmount || 0);
    setRemarks(app.remarks || "");
    setErrorMessage("");
  };

  const handleSaveApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPortal = portal.trim();
    if (!finalPortal) {
      setErrorMessage("Please enter or select an Application Name.");
      return;
    }

    if (!appNumber.trim() && !loginId.trim()) {
      setErrorMessage("Please enter at least the Application Number or Login ID.");
      return;
    }
    setErrorMessage("");

    // Store portal name in persistent library
    addStoredPortal(finalPortal, portalUrl);

    const bAmt = Math.max(0, Number(billAmount) || 0);
    const pAmt = Math.max(0, Number(paidAmount) || 0);
    const status: "PENDING" | "PARTIAL" | "PAID" =
      bAmt > 0 && pAmt >= bAmt ? "PAID" : pAmt > 0 ? "PARTIAL" : "PENDING";

    if (editingAppId) {
      // Find existing to preserve payments
      const existingApp = (currentApplicant.applications || []).find((a) => a.id === editingAppId);

      const updatedItem: ApplicationDetailItem = {
        id: editingAppId,
        portal: finalPortal,
        applicationNumber: appNumber.trim(),
        loginId: loginId.trim(),
        portalUrl: portalUrl.trim(),
        submissionDate,
        billAmount: bAmt,
        paidAmount: pAmt,
        paymentStatus: status,
        isApproved: existingApp?.isApproved ?? false,
        payments: existingApp?.payments || [],
        remarks: remarks.trim()
      };

      const updatedList = updateApplicationInApplicant(currentApplicant.id, updatedItem);
      const updatedObj = updatedList.find((a) => a.id === currentApplicant.id);
      if (updatedObj) {
        setCurrentApplicant(updatedObj);
        onUpdated(updatedObj);
      }
    } else {
      // Adding new application
      const newItem: Omit<ApplicationDetailItem, "id"> = {
        portal: finalPortal,
        applicationNumber: appNumber.trim(),
        loginId: loginId.trim(),
        portalUrl: portalUrl.trim(),
        submissionDate,
        billAmount: bAmt,
        paidAmount: pAmt,
        paymentStatus: status,
        payments:
          pAmt > 0
            ? [
                {
                  id: `pay_${Date.now()}`,
                  date: submissionDate,
                  amount: pAmt,
                  mode: "UPI_QR",
                  note: "Initial payment"
                }
              ]
            : [],
        remarks: remarks.trim()
      };

      const updatedList = addApplicationToApplicant(currentApplicant.id, newItem);
      const updatedObj = updatedList.find((a) => a.id === currentApplicant.id);
      if (updatedObj) {
        setCurrentApplicant(updatedObj);
        onUpdated(updatedObj);
      }
    }

    resetForm();
  };

  const handleDelete = (appId: string) => {
    const updatedList = deleteApplicationFromApplicant(currentApplicant.id, appId);
    const updatedObj = updatedList.find((a) => a.id === currentApplicant.id);
    if (updatedObj) {
      setCurrentApplicant(updatedObj);
      onUpdated(updatedObj);
    }
    setConfirmDeleteId(null);
    if (editingAppId === appId) {
      resetForm();
    }
  };

  // Open Payment Form for an Application
  const openPaymentModal = (app: ApplicationDetailItem) => {
    setActivePaymentAppId(app.id);
    const due = Math.max(0, (app.billAmount || 0) - (app.paidAmount || 0));
    setPayAmountInput(due > 0 ? due : (app.billAmount || 1000));
    setPayMode("UPI_QR");
    setPayRef(`UPI/APP-${Date.now().toString().slice(-6)}`);
    setPayNote(`Application fee for ${app.portal}`);
  };

  const handleRecordPayment = (app: ApplicationDetailItem) => {
    if (payAmountInput <= 0) {
      alert("Please enter a valid payment amount greater than 0.");
      return;
    }

    const updatedList = recordApplicationPayment(
      currentApplicant.id,
      app.id,
      payAmountInput,
      payMode,
      payRef,
      payNote
    );

    const updatedObj = updatedList.find((a) => a.id === currentApplicant.id);
    if (updatedObj) {
      setCurrentApplicant(updatedObj);
      onUpdated(updatedObj);
    }
    setActivePaymentAppId(null);
  };

  const apps = currentApplicant.applications || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-white relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Manage Applications & Payment Entries
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Applicant: <span className="text-cyan-300 font-bold">{currentApplicant.applicantName}</span> ({currentApplicant.mobileNo})
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
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-3.5 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Existing Applications List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase font-bold">
              Current Applications Linked ({apps.length})
            </span>
            {editingAppId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-cyan-400 hover:underline cursor-pointer font-bold"
              >
                + Switch to Add New Application
              </button>
            )}
          </div>

          {apps.length === 0 ? (
            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs font-mono">
              No applications registered yet. Fill out the form below to add one.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {apps.map((app) => {
                const isSelectedForEdit = editingAppId === app.id;
                const appBill = app.billAmount || 0;
                const appPaid = app.paidAmount || 0;
                const balance = Math.max(0, appBill - appPaid);
                const isAppFullyPaid = appBill > 0 && appPaid >= appBill;
                const isDeleting = confirmDeleteId === app.id;
                const isPaymentOpen = activePaymentAppId === app.id;

                const qrUrl = generateApplicationItemUpiUrl(currentApplicant, app);
                const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  qrUrl
                )}`;

                return (
                  <div
                    key={app.id}
                    className={`border rounded-2xl p-3.5 space-y-2.5 transition-all ${
                      isSelectedForEdit
                        ? "bg-slate-900 border-cyan-500/60 ring-2 ring-cyan-500/20"
                        : isAppFullyPaid
                        ? "bg-emerald-950/20 border-emerald-800/60"
                        : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* App Header: Portal badge, date, status, and action buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-black font-mono px-3 py-1 rounded-lg bg-cyan-950 text-cyan-200 border border-cyan-700 uppercase tracking-wide">
                          {app.portal}
                        </span>
                        {app.submissionDate && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {app.submissionDate}
                          </span>
                        )}
                        {isAppFullyPaid ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-300 border border-emerald-700 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            PAID IN FULL
                          </span>
                        ) : balance > 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                            DUE: ₹{balance.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                      </div>

                      {/* Actions: Edit, Pay, Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPaymentModal(app)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Record payment or pay via UPI QR"
                        >
                          <IndianRupee className="w-3 h-3" />
                          <span>+ Payment</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEdit(app)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs cursor-pointer"
                          title="Edit this Application"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Inline Delete without window.confirm */}
                        {isDeleting ? (
                          <div className="flex items-center gap-1 bg-rose-950 border border-rose-700 px-2 py-0.5 rounded-lg">
                            <span className="text-[10px] text-rose-300 font-bold">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(app.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(app.id)}
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/80 text-rose-400 hover:text-rose-200 transition-colors text-xs cursor-pointer"
                            title="Delete this Application"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* App Number & Login ID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-0.5">
                      <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-slate-400 uppercase block font-bold tracking-wider">Application Number</span>
                          <span className="font-black text-sm sm:text-base text-white truncate block tracking-wider">{app.applicationNumber}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(app.applicationNumber, `app_${app.id}`)}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
                          title="Copy App Number"
                        >
                          {copiedId === `app_${app.id}` ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="bg-slate-900/90 rounded-xl p-2 border border-slate-800 flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <span className="text-[9px] text-slate-500 uppercase block font-bold">Login ID</span>
                          <span className="font-bold text-emerald-400 truncate block">{app.loginId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(app.loginId, `login_${app.id}`)}
                          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
                          title="Copy Login ID"
                        >
                          {copiedId === `login_${app.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Billing & Paid Amount Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-4">
                        <span>
                          <strong className="text-slate-400">Bill: </strong>
                          <span className="text-white font-bold">₹{appBill.toLocaleString("en-IN")}</span>
                        </span>
                        <span className="text-slate-700">|</span>
                        <span>
                          <strong className="text-slate-400">Paid: </strong>
                          <span className="text-emerald-400 font-bold">₹{appPaid.toLocaleString("en-IN")}</span>
                        </span>
                        <span className="text-slate-700">|</span>
                        <span>
                          <strong className="text-slate-400">Due: </strong>
                          <span className={`font-bold ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                            ₹{balance.toLocaleString("en-IN")}
                          </span>
                        </span>
                      </div>

                      {app.payments && app.payments.length > 0 && (
                        <span className="text-[10px] text-slate-400">
                          {app.payments.length} payment record{app.payments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Inline Quick Payment Entry Drawer */}
                    {isPaymentOpen && (
                      <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                          <span className="flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5" />
                            Record Payment for {app.portal}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActivePaymentAppId(null)}
                            className="text-slate-400 hover:text-white text-xs"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Amount (₹):</label>
                            <input
                              type="number"
                              min="1"
                              value={payAmountInput}
                              onChange={(e) => setPayAmountInput(Number(e.target.value))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-emerald-400 font-bold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Payment Mode:</label>
                            <select
                              value={payMode}
                              onChange={(e) => setPayMode(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none"
                            >
                              <option value="UPI_QR">UPI QR (9567627277@SLC)</option>
                              <option value="GPAY">Google Pay / PhonePe</option>
                              <option value="CASH">Cash</option>
                              <option value="BANK_TRANSFER">Bank NEFT/IMPS</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-400 mb-0.5">Ref / UTR / Note:</label>
                            <input
                              type="text"
                              value={payRef}
                              onChange={(e) => setPayRef(e.target.value)}
                              placeholder="UTR or receipt no"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* UPI QR preview for this application */}
                        <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <img
                              src={qrImgSrc}
                              alt="UPI QR Code"
                              className="w-12 h-12 rounded bg-white p-0.5"
                            />
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold">UPI VPA:</span>
                              <span className="text-cyan-300 font-bold">{DEFAULT_RECEIVER_UPI}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRecordPayment(app)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm & Record ₹{payAmountInput}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {app.remarks && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/40 px-2.5 py-1 rounded border border-slate-800/60 font-sans">
                        {app.remarks}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Form */}
        <form onSubmit={handleSaveApplication} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-2">
            <span>{editingAppId ? "✏️ Edit Application Entry" : "➕ Add More Application for this Applicant"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {/* Application Name (Manual Typing & Viewable Stored Library) */}
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-bold">
                Application Name <span className="text-rose-400">*</span>:
              </label>
              <ApplicationPortalSelector
                value={portal}
                onChange={(portalName, defaultUrl) => {
                  setPortal(portalName);
                  const typesList = loadApplicationTypes();
                  const matched = typesList.find((t) => t.name.toLowerCase() === portalName.toLowerCase().trim());
                  if (matched) {
                    if (typeof matched.fee === "number") setBillAmount(matched.fee);
                    if (matched.userId && (!loginId || loginId === "USER ID")) setLoginId(matched.userId);
                  }
                  addStoredPortal(portalName.trim(), defaultUrl);
                }}
                placeholder="Type application name (e.g. POSSESSION CERTIFICATE)..."
              />
            </div>

            {/* Application Number */}
            <div>
              <label className="block text-slate-300 mb-1 font-bold text-xs sm:text-sm">
                Application Number <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={appNumber}
                onChange={(e) => setAppNumber(e.target.value)}
                placeholder="e.g. APP-2026-1092"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white focus:outline-none focus:border-cyan-500 font-bold font-mono tracking-wide"
              />
            </div>

            {/* Login ID */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">
                User ID / Login Credential <span className="text-rose-400">*</span>:
              </label>
              <input
                type="text"
                required
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. USER ID"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>

            {/* Application Bill Amount */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold">Fee / Rate (₹):</label>
              <input
                type="number"
                min="0"
                value={billAmount}
                onChange={(e) => setBillAmount(Number(e.target.value))}
                placeholder="70"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Paid Amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400 font-bold">Paid Amount (₹):</label>
                {billAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaidAmount(billAmount)}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer font-bold"
                  >
                    Mark Fully Paid
                  </button>
                )}
              </div>
              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submission Date */}
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-bold">Submission / Entry Date:</label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-bold">Remarks / Notes (Optional):</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Scrutiny fee paid, awaiting LSGD engineer site visit"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            {editingAppId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{editingAppId ? "Save Application Update" : "Add Application"}</span>
            </button>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
