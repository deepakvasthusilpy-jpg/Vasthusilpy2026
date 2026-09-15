import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Copy,
  Check,
  Download,
  Share2,
  CreditCard,
  Building2,
  CheckCircle2,
  ExternalLink,
  Phone,
  AlertCircle
} from "lucide-react";
import { OnlineApplicantRecord } from "../../../types";
import {
  DEFAULT_RECEIVER_UPI,
  DEFAULT_BENEFICIARY_NAME,
  generateApplicantUpiUrl,
  recordApplicantPayment
} from "../../../utils/onlineApplicationsManager";

interface ApplicantPaymentQrModalProps {
  applicant: OnlineApplicantRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (updated: OnlineApplicantRecord) => void;
}

export const ApplicantPaymentQrModal: React.FC<ApplicantPaymentQrModalProps> = ({
  applicant,
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  if (!isOpen || !applicant) return null;

  const defaultBalance = Math.max(0, applicant.billAmount - applicant.paidAmount);
  const [payAmount, setPayAmount] = useState<number>(defaultBalance > 0 ? defaultBalance : applicant.billAmount);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>("");

  const upiUrl = generateApplicantUpiUrl(applicant, payAmount, DEFAULT_RECEIVER_UPI, DEFAULT_BENEFICIARY_NAME);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#022c22", // Emerald-950
        light: "#ffffff"
      },
      errorCorrectionLevel: "H"
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("Failed generating UPI QR code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiUrl]);

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(DEFAULT_RECEIVER_UPI);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyPaymentLink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `UPI_QR_${applicant.applicantName.replace(/\s+/g, "_")}_Vasthusilpy.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    const balanceDue = Math.max(0, applicant.billAmount - applicant.paidAmount);
    const appList = (applicant.applications || [])
      .map((a) => `• ${a.portal}: ${a.applicationNumber}`)
      .join("\n");

    const message = `Namaste ${applicant.applicantName},\n\n` +
      `Here is the Online Application fee payment request from *Vasthusilpy Architectural & Engineering Consultants*:\n\n` +
      `📌 *Applicant:* ${applicant.applicantName}\n` +
      (appList ? `📑 *Applications:*\n${appList}\n\n` : "") +
      `💵 *Total Bill:* ₹${applicant.billAmount.toLocaleString("en-IN")}\n` +
      `✅ *Paid Amount:* ₹${applicant.paidAmount.toLocaleString("en-IN")}\n` +
      `🔴 *Payable Balance:* ₹${(payAmount || balanceDue).toLocaleString("en-IN")}\n\n` +
      `📲 *Pay directly via UPI to:*\n` +
      `*UPI ID:* ${DEFAULT_RECEIVER_UPI}\n` +
      `*Name:* ${DEFAULT_BENEFICIARY_NAME}\n\n` +
      `UPI Link: ${upiUrl}\n\n` +
      `Thank you!\nEr. Deepak K, Vasthusilpy Consultants\nContact: +91 7012383137`;

    const cleanPhone = applicant.mobileNo.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleRecordPayment = () => {
    if (payAmount <= 0) return;
    setIsRecording(true);
    try {
      const updatedList = recordApplicantPayment(applicant.id, payAmount, "UPI_QR");
      const updatedApplicant = updatedList.find((a) => a.id === applicant.id) || {
        ...applicant,
        paidAmount: applicant.paidAmount + payAmount
      };

      setSuccessMsg(`Payment of ₹${payAmount.toLocaleString("en-IN")} recorded successfully!`);
      if (onPaymentSuccess) {
        onPaymentSuccess(updatedApplicant);
      }
      setTimeout(() => {
        setIsRecording(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error("Failed to record payment:", e);
      setIsRecording(false);
    }
  };

  const balance = Math.max(0, applicant.billAmount - applicant.paidAmount);
  const isPaidInFull = applicant.billAmount > 0 && applicant.paidAmount >= applicant.billAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white relative animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  UPI Payment QR Code
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  9567627277@SLC
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Scan to pay for {applicant.applicantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert if payment just recorded */}
        {successMsg && (
          <div className="bg-emerald-950/70 border border-emerald-500/50 rounded-2xl p-3 text-xs font-mono text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Applicant Info Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Applicant:</span>
            <span className="font-bold text-white text-sm">{applicant.applicantName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Mobile No:</span>
            <span className="text-cyan-300 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {applicant.mobileNo}
            </span>
          </div>

          {/* Applications list summary */}
          {applicant.applications && applicant.applications.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">
                Online Applications ({applicant.applications.length}):
              </span>
              <div className="space-y-1">
                {applicant.applications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs"
                  >
                    <span className="text-cyan-300 font-black text-xs sm:text-sm uppercase tracking-wide">{app.portal}</span>
                    <span className="text-white font-mono font-black text-xs sm:text-sm tracking-wider">{app.applicationNumber}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Total Bill</span>
              <span className="text-xs font-bold text-white">
                ₹{applicant.billAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Paid Amount</span>
              <span className="text-xs font-bold text-emerald-400">
                ₹{applicant.paidAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Balance Due</span>
              <span className={`text-xs font-bold ${balance > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                ₹{balance.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Card Display */}
        <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center space-y-3 shadow-inner">
          <div className="flex items-center gap-2 text-slate-900 text-xs font-bold font-mono uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>VASTHUSILPY OFFICIAL UPI QR</span>
          </div>

          {qrDataUrl ? (
            <div className="p-2 bg-white rounded-2xl border-2 border-emerald-600/30 shadow-md">
              <img
                src={qrDataUrl}
                alt="UPI Payment QR Code"
                className="w-56 h-56 object-contain rounded-xl"
              />
            </div>
          ) : (
            <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-2xl animate-pulse text-slate-400 text-xs font-mono">
              Generating QR Code...
            </div>
          )}

          {/* UPI Address badge */}
          <div className="w-full bg-slate-100 rounded-2xl p-3 flex items-center justify-between text-slate-900 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">UPI VPA:</span>
              <span className="text-sm font-black text-emerald-800">{DEFAULT_RECEIVER_UPI}</span>
            </div>
            <button
              onClick={handleCopyUpiId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Copy UPI ID"
            >
              {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedUpi ? "COPIED" : "COPY"}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-sans text-center">
            <span>Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI App</span>
          </div>
        </div>

        {/* Payable Amount Input / Customizer */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono">
          <div>
            <label className="text-slate-400 block text-[11px] font-bold uppercase mb-1">
              Payable Amount (₹):
            </label>
            <span className="text-[10px] text-slate-500">
              {balance > 0 ? `Balance due is ₹${balance}` : "Full bill paid or custom fee"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min="0"
              value={payAmount}
              onChange={(e) => setPayAmount(Math.max(0, Number(e.target.value)))}
              className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-right focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">
          <a
            href={upiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-3 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            <span>PAY VIA UPI APP</span>
          </a>

          <button
            onClick={handleShareWhatsApp}
            className="bg-green-600 hover:bg-green-500 text-white p-3 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>SHARE ON WHATSAPP</span>
          </button>

          <button
            onClick={handleDownloadQR}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD QR PNG</span>
          </button>

          <button
            onClick={handleCopyPaymentLink}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-2xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? "LINK COPIED!" : "COPY UPI LINK"}</span>
          </button>
        </div>

        {/* Quick Record Payment Action Button */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleRecordPayment}
            disabled={isRecording || payAmount <= 0}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-900/30 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>RECORD ₹{payAmount.toLocaleString("en-IN")} RECEIVED VIA UPI (MARK PAID)</span>
          </button>
          <p className="text-[10px] text-slate-500 font-mono text-center mt-2">
            Payment goes directly to official UPI ID: <strong className="text-slate-400">9567627277@SLC</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
