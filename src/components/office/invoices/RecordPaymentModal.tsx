import React, { useState, useEffect } from "react";
import { Invoice, PaymentRecord } from "../../../types";
import { InvoiceQrCode } from "./InvoiceQrCode";
import { X, CreditCard, QrCode, CheckCircle2, History, IndianRupee, HelpCircle } from "lucide-react";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  paymentToEdit?: PaymentRecord | null;
  onRecordPayment: (invoiceId: string, payment: Omit<PaymentRecord, "id" | "createdAt"> & { id?: string }) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  paymentToEdit,
  onRecordPayment
}) => {
  const isEditMode = !!paymentToEdit;

  // Form states matching Screenshot 4
  const [paymentDate, setPaymentDate] = useState<string>(
    paymentToEdit?.date || new Date().toISOString().split("T")[0]
  );
  const [amount, setAmount] = useState<number>(
    paymentToEdit
      ? paymentToEdit.amount
      : invoice
      ? invoice.balanceDue > 0
        ? invoice.balanceDue
        : invoice.grandTotal
      : 0
  );
  const [paymentMode, setPaymentMode] = useState<string>(
    paymentToEdit?.paymentMode || "Bank payment"
  );
  const [account, setAccount] = useState<string>(
    paymentToEdit?.account || "UPI (INR)"
  );
  const [memo, setMemo] = useState<string>(
    paymentToEdit?.memo || paymentToEdit?.notes || "DEEPAK"
  );
  const [referenceNo, setReferenceNo] = useState<string>(
    paymentToEdit?.referenceNo || ""
  );
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (invoice && isOpen) {
      if (paymentToEdit) {
        setPaymentDate(paymentToEdit.date);
        setAmount(paymentToEdit.amount);
        setPaymentMode(paymentToEdit.paymentMode || "Bank payment");
        setAccount(paymentToEdit.account || "UPI (INR)");
        setMemo(paymentToEdit.memo || paymentToEdit.notes || "DEEPAK");
        setReferenceNo(paymentToEdit.referenceNo || "");
      } else {
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setAmount(invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal);
        setPaymentMode("Bank payment");
        setAccount("UPI (INR)");
        setMemo("DEEPAK");
        setReferenceNo("");
      }
      setShowQrCode(false);
      setError("");
    }
  }, [invoice, paymentToEdit, isOpen]);

  if (!isOpen || !invoice) return null;

  // Calculate balance comparison for status caption in green or amber
  const currentPaidExcludingThis = (invoice.payments || [])
    .filter((p) => !paymentToEdit || p.id !== paymentToEdit.id)
    .reduce((acc, p) => acc + p.amount, 0);

  const anticipatedTotalPaid = currentPaidExcludingThis + (Number(amount) || 0);
  const willBeFullyPaid = anticipatedTotalPaid >= invoice.grandTotal && invoice.grandTotal > 0;
  const remainingAfter = Math.max(0, invoice.grandTotal - anticipatedTotalPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    onRecordPayment(invoice.id, {
      id: paymentToEdit?.id,
      amount: Number(amount),
      date: paymentDate,
      method: paymentMode.includes("UPI") ? "UPI_QR" : "BANK_PAYMENT",
      paymentMode: paymentMode,
      account: account,
      memo: memo.trim() || undefined,
      referenceNo: referenceNo.trim() || undefined,
      notes: memo.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="invoice-modal-container bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header matching Reference Screenshot 4 */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900 font-sans">
            {isEditMode ? "Edit payment for this invoice" : "Record payment for this invoice"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* Invoice Summary Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 font-medium">Invoice #</span>
            <strong className="text-slate-900 font-mono ml-1">{invoice.invoiceNumber}</strong>
            <span className="text-slate-400 mx-2">•</span>
            <span className="text-slate-700">{invoice.applicantName}</span>
          </div>
          <div className="font-mono text-slate-700">
            Total: <strong>₹{invoice.grandTotal.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        {/* Form fields matching Reference Screenshot 4 */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm font-sans">
          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono font-bold text-sm">₹</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg pl-7 pr-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none"
                required
              />
            </div>
            {/* Status helper text in green or blue */}
            <div className="mt-1.5 text-xs">
              {willBeFullyPaid ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Invoice will be fully paid
                </span>
              ) : remainingAfter > 0 ? (
                <span className="text-amber-600 font-medium font-mono">
                  Remaining balance after payment: ₹{remainingAfter.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              ) : null}
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Method
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
            >
              <option value="Bank payment">Bank payment</option>
              <option value="UPI / GPay">UPI / GPay</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Online Transfer">Online Transfer</option>
            </select>
          </div>

          {/* Account matching Screenshot 4 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account
            </label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none"
            >
              <option value="UPI (INR)">UPI (INR)</option>
              <option value="Bank Account (SBI Keralassery)">Bank Account (SBI Keralassery - 10625047526)</option>
              <option value="Cash in Hand">Cash in Hand</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Any account into which you deposit and withdraw funds from.
            </p>
          </div>

          {/* Memo (on receipt) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Memo (on receipt)
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. DEEPAK"
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none uppercase font-mono"
            />
          </div>

          {/* Reference / UTR (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. UPI Ref / Bank UTR"
              className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none font-mono"
            />
          </div>

          {/* Optional Scan QR trigger */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{showQrCode ? "Hide Instant UPI QR Code" : "Show Instant Vasthusilpy UPI QR Code"}</span>
            </button>

            {showQrCode && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                <InvoiceQrCode
                  upiId="7012383137@okbizaxis"
                  name="VASTHUSILPY"
                  amount={amount || invoice.balanceDue}
                  note={`Invoice ${invoice.invoiceNumber}`}
                />
                <div className="text-[11px] text-slate-600 font-mono">
                  Scan with GPay / PhonePe / Paytm to transfer ₹{amount}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons matching Reference Screenshot 4 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-full text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full text-xs shadow-md shadow-blue-500/20 transition-colors cursor-pointer"
            >
              {isEditMode ? "Update Payment" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
