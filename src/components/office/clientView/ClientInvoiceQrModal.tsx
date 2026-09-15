import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  X,
  Download,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Receipt,
  Sparkles,
  CreditCard
} from "lucide-react";
import { Invoice } from "../../../types";

interface ClientInvoiceQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const ClientInvoiceQrModal: React.FC<ClientInvoiceQrModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const shareUrl = invoice
    ? `${window.location.origin}/?invoice_share=${invoice.id || invoice.invoiceNumber}`
    : "";

  useEffect(() => {
    if (invoice && shareUrl) {
      QRCode.toDataURL(shareUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#020617",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating invoice QR code:", err));
    }
  }, [invoice, shareUrl]);

  if (!isOpen || !invoice) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `CLIENT-INVOICE-QR-${invoice.invoiceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*VASTHUSILPY - OFFICIAL INVOICE & PAYMENT VIEW*\n` +
      `Dear ${invoice.applicantName},\n\n` +
      `Your invoice #${invoice.invoiceNumber} for *${invoice.projectTitle || "Consultancy Services"}* is available for your review and download:\n\n` +
      `💰 *Invoice Total:* ₹${invoice.grandTotal.toLocaleString("en-IN")}\n` +
      (invoice.balanceDue > 0
        ? `⚠️ *Balance Due:* ₹${invoice.balanceDue.toLocaleString("en-IN")}\n`
        : `✅ *Status:* FULLY PAID\n`) +
      `🔗 ${shareUrl}\n\n` +
      `✨ *Direct Access (No Login Required):* Click the link above on your phone or computer to review the invoice, download the official PDF receipt, or scan the UPI QR code to complete payment instantly.\n\n` +
      `Vasthusilpy Architectural & Engineering Consultants - Keralassery\n📞 +91 70123 83137`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-sans">
                Client Invoice & Payment QR Code
              </h3>
              <p className="text-[11px] font-mono text-emerald-400">
                INVOICE #{invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Status & Project Info */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">Billed Client:</span>
              <span className="font-bold text-white">{invoice.applicantName}</span>
            </div>

            {invoice.projectTitle && (
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-400">Project:</span>
                <span className="font-mono text-cyan-300 truncate max-w-[220px]">
                  {invoice.projectTitle}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 font-mono">
              <span className="text-slate-400">Total Amount:</span>
              <span className="font-bold text-slate-200">
                ₹{invoice.grandTotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 font-mono">
              <span className="text-slate-400">Payment Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  invoice.paymentStatus === "PAID"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : invoice.paymentStatus === "PARTIALLY PAID"
                    ? "bg-amber-950 text-amber-300 border-amber-800"
                    : "bg-rose-950 text-rose-300 border-rose-800"
                }`}
              >
                ● {invoice.paymentStatus}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-mono text-emerald-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Zero-Login Direct Client View</span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Invoice QR Code for ${invoice.invoiceNumber}`}
                className="w-52 h-52 object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs font-mono">
                Generating QR Code...
              </div>
            )}
            <p className="text-[10px] font-mono text-slate-700 font-bold mt-2 text-center">
              SCAN TO VIEW INVOICE, RECEIPTS & PAY VIA UPI
            </p>
          </div>

          {/* URL Display */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-mono">
            <span className="truncate text-slate-300 text-[11px]">{shareUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Share</span>
            </button>

            <button
              onClick={handleDownloadQr}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download QR</span>
            </button>
          </div>

          {/* Direct Public Portal Preview */}
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Live Client View In New Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};
