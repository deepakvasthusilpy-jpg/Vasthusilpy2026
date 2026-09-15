import React, { useState, useEffect } from "react";
import {
  X,
  IndianRupee,
  QrCode,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  Layers,
  Copy,
  Check,
  History,
  AlertCircle
} from "lucide-react";
import {
  OnlineApplicantRecord,
  ApplicationDetailItem,
  ApplicationPaymentRecord
} from "../../../types";
import {
  recordApplicationPayment,
  generateApplicationItemUpiUrl,
  DEFAULT_RECEIVER_UPI,
  DEFAULT_BENEFICIARY_NAME
} from "../../../utils/onlineApplicationsManager";

interface ApplicationPaymentModalProps {
  applicant: OnlineApplicantRecord | null;
  application: ApplicationDetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedApplicant: OnlineApplicantRecord) => void;
}

export const ApplicationPaymentModal: React.FC<ApplicationPaymentModalProps> = ({
  applicant,
  application,
  isOpen,
  onClose,
  onSaved
}) => {
  if (!isOpen || !applicant || !application) return null;

  const appBill = application.billAmount || 0;
  const appPaid = application.paidAmount || 0;
  const balance = Math.max(0, appBill - appPaid);

  const [amount, setAmount] = useState<number>(balance > 0 ? balance : 1000);
  const [paymentMode, setPaymentMode] = useState<string>("UPI_QR");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [refNo, setRefNo] = useState<string>(`UPI/APP-${Date.now().toString().slice(-6)}`);
  const [note, setNote] = useState<string>(`Fee for ${application.portal}`);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const bal = Math.max(0, (application.billAmount || 0) - (application.paidAmount || 0));
    setAmount(bal > 0 ? bal : (application.billAmount || 1000));
    setRefNo(`UPI/APP-${Date.now().toString().slice(-6)}`);
    setNote(`Fee for ${application.portal}`);
    setError("");
  }, [application, isOpen]);

  const qrUrl = generateApplicationItemUpiUrl(applicant, application, amount);
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    qrUrl
  )}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(DEFAULT_RECEIVER_UPI);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Please enter a payment amount greater than ₹0.");
      return;
    }
    setError("");

    const updatedList = recordApplicationPayment(
      applicant.id,
      application.id,
      amount,
      paymentMode,
      refNo.trim(),
      note.trim()
    );

    const updatedObj = updatedList.find((a) => a.id === applicant.id);
    if (updatedObj) {
      onSaved(updatedObj);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Record Payment for Application
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {application.portal} — {applicant.applicantName}
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

        {error && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-200 px-3.5 py-2 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Application details strip */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-sm text-cyan-200 uppercase tracking-wide">{application.portal}</span>
            <span className="text-white font-mono font-black text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 tracking-wider">
              No: {application.applicationNumber}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Fee / Bill</span>
              <span className="font-bold text-white">₹{appBill.toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Already Paid</span>
              <span className="font-bold text-emerald-400">₹{appPaid.toLocaleString("en-IN")}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-bold block">Balance Due</span>
              <span className={`font-bold ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                ₹{balance.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* UPI QR Payment Block */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 font-bold">
            <QrCode className="w-4 h-4" />
            <span>SCAN QR TO PAY VIA UPI</span>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-inner inline-block">
            <img
              src={qrImgSrc}
              alt="UPI QR Code"
              className="w-36 h-36 object-contain"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 font-mono text-xs text-white">
              <span>UPI ID:</span>
              <strong className="text-cyan-300">{DEFAULT_RECEIVER_UPI}</strong>
              <button
                type="button"
                onClick={copyUpi}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedUpi ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Beneficiary: {DEFAULT_BENEFICIARY_NAME} (All UPI Apps: GPay, PhonePe, Paytm)
            </p>
          </div>
        </div>

        {/* Payment Entry Form */}
        <form onSubmit={handleRecord} className="space-y-3 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400 font-bold">Payment Amount (₹):</label>
                {balance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(balance)}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Full Due (₹{balance})
                  </button>
                )}
              </div>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Payment Mode:</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="UPI_QR">UPI QR Code (9567627277@SLC)</option>
                <option value="GPAY">Google Pay / PhonePe / Paytm</option>
                <option value="CASH">Cash Payment</option>
                <option value="BANK_TRANSFER">Bank IMPS / NEFT</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">Payment Date:</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-bold">UTR / Reference No:</label>
              <input
                type="text"
                value={refNo}
                onChange={(e) => setRefNo(e.target.value)}
                placeholder="e.g. UPI/2026/8912"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-bold">Notes / Description:</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Remarks about payment"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Past Payments for this application */}
          {application.payments && application.payments.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
                Past Payments Recorded ({application.payments.length})
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {application.payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]"
                  >
                    <span className="text-slate-400">{p.date}</span>
                    <span className="text-slate-300">{p.mode}</span>
                    <span className="font-bold text-emerald-400">₹{p.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RECORD ₹{amount.toLocaleString("en-IN")} PAYMENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
