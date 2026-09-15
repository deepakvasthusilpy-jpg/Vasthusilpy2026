import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { X, CheckCircle2, Download, Copy, Check, QrCode, ExternalLink, MessageCircle, Clock, Shield } from "lucide-react";
import { ClientShareLink } from "../../../types";
import { buildClientShareUrl, getTimeRemainingFormatted } from "../../../data/clientShareData";

interface ClientLinkQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareLink: ClientShareLink | null;
}

export const ClientLinkQrModal: React.FC<ClientLinkQrModalProps> = ({
  isOpen,
  onClose,
  shareLink
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (shareLink) {
      const targetUrl = buildClientShareUrl(shareLink.token);
      QRCode.toDataURL(targetUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#020617",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [shareLink]);

  if (!isOpen || !shareLink) return null;

  const shareUrl = buildClientShareUrl(shareLink.token);
  const timeInfo = getTimeRemainingFormatted(shareLink.expiresAt, shareLink.status);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `CLIENT-PROGRESS-QR-${shareLink.token}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Vasthusilpy - Project Progress & Estimate View*\n` +
      `Dear ${shareLink.clientName},\n\n` +
      `You can view the current live work progress & stage certificate of your project *${shareLink.estimateProjectName}* at the link below:\n\n` +
      `🔗 ${shareUrl}\n\n` +
      (shareLink.accessPin ? `🔐 *Access PIN:* ${shareLink.accessPin}\n\n` : "") +
      `⏳ This link is valid until ${new Date(shareLink.expiresAt).toLocaleDateString("en-IN")}.\n\n` +
      `Vasthusilpy Engineering - Keralassery\n📞 +91 70123 83137`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-sans">
                Client Progress View QR Code
              </h3>
              <p className="text-[11px] font-mono text-cyan-400">
                TOKEN: {shareLink.token}
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
        <div className="p-6 space-y-5">
          {/* Status & Project Info */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">Client:</span>
              <span className="font-bold text-white">{shareLink.clientName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">Project:</span>
              <span className="font-mono text-cyan-300 truncate max-w-[220px]">{shareLink.estimateProjectName}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Validity:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${timeInfo.badgeColor}`}>
                {timeInfo.label}
              </span>
            </div>
            {shareLink.accessPin && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                <span className="font-mono text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  PIN Protection:
                </span>
                <span className="font-mono font-black text-emerald-400 tracking-wider">
                  {shareLink.accessPin}
                </span>
              </div>
            )}
          </div>

          {/* QR Code Container */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Client View QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                Generating QR...
              </div>
            )}
            <p className="text-[10px] font-mono text-slate-600 font-bold mt-2">
              SCAN TO VIEW SITE STATUS (NO LOGIN REQUIRED)
            </p>
          </div>

          {/* URL Display */}
          <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-mono">
            <span className="truncate text-slate-300 text-[11px]">{shareUrl}</span>
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-cyan-400" />}
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
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
