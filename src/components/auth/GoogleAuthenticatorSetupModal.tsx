import React, { useState, useEffect } from "react";
import {
  X,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Key,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Lock
} from "lucide-react";
import {
  getOrCreateTotpSecret,
  formatSecretFormatted,
  generateTotpQrCode,
  computeTotpCode,
  getTotpRemainingSeconds
} from "../../utils/totp";

interface GoogleAuthenticatorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess?: () => void;
}

export const GoogleAuthenticatorSetupModal: React.FC<GoogleAuthenticatorSetupModalProps> = ({
  isOpen,
  onClose,
  email,
  onSuccess
}) => {
  const [secret, setSecret] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [currentTotp, setCurrentTotp] = useState<string>("");
  const [remainingSecs, setRemainingSecs] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);

  const cleanEmail = email.trim().toLowerCase() || "deepak.vasthusilpy@gmail.com";

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const userSecret = getOrCreateTotpSecret(cleanEmail);
    setSecret(userSecret);

    generateTotpQrCode(cleanEmail, userSecret, "Vasthusilpy")
      .then((url) => {
        setQrCodeUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to generate TOTP QR:", err);
        setLoading(false);
      });

    // Update live TOTP code preview
    const updateCode = async () => {
      try {
        const code = await computeTotpCode(userSecret);
        setCurrentTotp(code);
        setRemainingSecs(getTotpRemainingSeconds());
      } catch (e) {
        // ignore
      }
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);

    return () => clearInterval(interval);
  }, [isOpen, cleanEmail]);

  if (!isOpen) return null;

  const handleCopySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    a.download = `Vasthusilpy-Authenticator-${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0b0a1a] border border-indigo-800/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <QrCode className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-white text-base leading-tight flex items-center gap-2">
                <span>Google Authenticator Setup</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-500/40">
                  TOTP 2FA
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[280px]">
                {cleanEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Instructions Step Flow */}
          <div className="space-y-3 bg-slate-950/70 border border-indigo-950 p-4 rounded-2xl">
            <h4 className="font-mono font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>എങ്ങനെ കണക്ട് ചെയ്യാം (Quick Setup Steps):</span>
            </h4>
            <ol className="space-y-2 text-slate-300 pl-4 list-decimal marker:text-indigo-400 marker:font-bold">
              <li>
                നിങ്ങളുടെ മൊബൈൽ ഫോണിൽ <strong>Google Authenticator</strong> ആപ്പ് (അല്ലെങ്കിൽ Authy / Microsoft Authenticator) തുറക്കുക.
              </li>
              <li>
                ആപ്പിൽ <strong>+ (Add)</strong> ബട്ടൺ ടാപ്പ് ചെയ്ത് <strong>Scan a QR code</strong> തിരഞ്ഞെടുക്കുക.
              </li>
              <li>
                താഴെ കാണുന്ന QR കോഡ് സ്കാൻ ചെയ്യുക.
              </li>
              <li>
                ആപ്പിൽ കാണിക്കുന്ന 6 അക്ക കോഡ് ലോഗിൻ പേജിൽ നൽകുക.
              </li>
            </ol>
          </div>

          {/* QR Code Display Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/90 border border-indigo-900/50 rounded-2xl space-y-3">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
              {loading ? (
                <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-700">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
                  <span className="text-[11px] font-mono">Generating QR...</span>
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="Google Authenticator QR Code"
                  className="w-52 h-52 rounded-lg object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-[11px]">
                  QR Code Unavailable
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Download QR Image</span>
              </button>
            </div>
          </div>

          {/* Manual Setup Key Box */}
          <div className="bg-slate-950/80 border border-indigo-950 p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-mono text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Manual Setup Key (സ്കാൻ ചെയ്യാൻ സാധിക്കുന്നില്ലെങ്കിൽ):</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 font-mono font-bold tracking-widest text-xs select-all break-all">
                {formatSecretFormatted(secret)}
              </div>
              <button
                type="button"
                onClick={handleCopySecret}
                className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                  copied
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border-indigo-500/40"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Key</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Type: Time-based (TOTP) • Account: {cleanEmail} • Issuer: Vasthusilpy
            </p>
          </div>

          {/* Live Simulator Preview */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Live Test Code (നിലവിലെ കോഡ്):</span>
              </span>
              <div className="font-mono font-black text-white text-lg tracking-widest">
                {currentTotp ? `${currentTotp.slice(0, 3)} ${currentTotp.slice(3)}` : "------"}
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <div className="text-[10px] font-mono text-slate-400">
                Refreshes in: <strong className="text-emerald-400">{remainingSecs}s</strong>
              </div>
              <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(remainingSecs / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-indigo-950 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono">
            Standard RFC 6238 TOTP
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs cursor-pointer transition-colors"
          >
            Done (തുടരുക)
          </button>
        </div>

      </div>
    </div>
  );
};
