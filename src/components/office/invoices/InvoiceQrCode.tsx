import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Copy, Check, ShieldCheck } from "lucide-react";

interface InvoiceQrCodeProps {
  upiId?: string;
  payeeName?: string;
  name?: string;
  amount?: number;
  invoiceNumber?: string;
  note?: string;
  size?: number;
  className?: string;
  compact?: boolean;
  blackAndWhite?: boolean;
  minimal?: boolean;
}

export const InvoiceQrCode: React.FC<InvoiceQrCodeProps> = ({
  upiId = "7012383137@okbizaxis",
  payeeName,
  name,
  amount,
  invoiceNumber,
  note,
  size = 140,
  className = "",
  compact = false,
  blackAndWhite = false,
  minimal = false
}) => {
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>("");
  const resolvedPayee = payeeName || name || "DEEPAK C";
  const resolvedNote = note || (invoiceNumber ? `Vasthusilpy Invoice ${invoiceNumber}` : "Vasthusilpy Payment");

  // Construct standard UPI deep-link URL
  const params = new URLSearchParams();
  params.append("pa", upiId);
  params.append("pn", resolvedPayee);
  if (amount && amount > 0) {
    params.append("am", amount.toFixed(2));
  }
  params.append("cu", "INR");
  params.append("tn", resolvedNote);

  const upiUrl = `upi://pay?${params.toString()}`;

  // Reliable QR code generator via free public QR server as instant fallback
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&margin=6&data=${encodeURIComponent(upiUrl)}`;

  // Generate crisp local data URL via client-side qrcode library
  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(upiUrl, {
      width: Math.max(size * 2, 240),
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.warn("Local QR generation fallback to web server:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiUrl, size]);

  const activeQrSrc = dataUrl || qrImageUrl;

  const handleCopyUpi = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (minimal) {
    return (
      <div className={`flex flex-col items-center justify-center text-center shrink-0 ${className}`}>
        <div className="bg-white p-1 rounded border-2 border-black inline-block shadow-sm">
          <img
            src={activeQrSrc}
            alt={`UPI Payment QR for ${resolvedPayee}`}
            width={size}
            height={size}
            className="block object-contain"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="text-[9px] font-mono font-black uppercase text-black tracking-wider mt-1 whitespace-nowrap">
          SCAN TO PAY
        </div>
        {amount !== undefined && amount > 0 && (
          <div className="text-[10px] font-mono font-black text-black tracking-tight whitespace-nowrap">
            ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        )}
        <div className="text-[8px] font-mono font-bold text-neutral-800 tracking-tight whitespace-nowrap">
          {upiId}
        </div>
      </div>
    );
  }

  if (blackAndWhite) {
    if (compact) {
      return (
        <div className={`bg-white border-2 border-black rounded-xl p-3 flex items-center gap-3 text-black ${className}`}>
          <div className="bg-white p-1 rounded-lg shrink-0 border-2 border-black">
            <img
              src={activeQrSrc}
              alt={`UPI Payment QR for ${upiId}`}
              width={size}
              height={size}
              className="object-contain block"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex-1 min-w-0 font-mono text-left">
            <div className="text-[11px] font-black uppercase tracking-wider text-black">
              SCAN TO PAY VIA UPI
            </div>
            {amount && amount > 0 && (
              <div className="text-sm font-black text-black truncate mt-0.5">
                Amount: ₹{amount.toLocaleString("en-IN")}
              </div>
            )}
            <div className="text-[11px] font-bold text-black truncate font-mono mt-0.5">
              UPI ID: {upiId}
            </div>
            <div className="text-[10px] text-black font-sans mt-0.5">
              Payee: {resolvedPayee}
            </div>
            <button
              type="button"
              onClick={handleCopyUpi}
              className="mt-1.5 px-2.5 py-1 bg-white text-black border-2 border-black hover:bg-neutral-100 rounded text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer print:hidden"
            >
              {copied ? <Check className="w-3 h-3 text-black" /> : <Copy className="w-3 h-3 text-black" />}
              <span>{copied ? "COPIED" : "COPY UPI ID"}</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-white border-2 border-black rounded-xl p-4 flex flex-col items-center text-center space-y-3 text-black ${className}`}>
        <div className="text-xs font-mono font-black border-2 border-black px-3 py-1 rounded-md uppercase">
          OFFICIAL UPI QR PAYMENT
        </div>

        <div className="bg-white p-2 rounded-xl border-2 border-black inline-block">
          <img
            src={activeQrSrc}
            alt={`UPI Payment QR for ${upiId}`}
            width={size}
            height={size}
            className="object-contain block mx-auto"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>

        {amount && amount > 0 && (
          <div className="text-center">
            <div className="text-[11px] font-mono font-bold uppercase text-black">Payable Amount</div>
            <div className="text-xl font-black font-mono text-black">
              ₹{amount.toLocaleString("en-IN")}
            </div>
          </div>
        )}

        <div className="w-full bg-white border-2 border-black rounded-lg p-2.5 flex items-center justify-between gap-2 font-mono text-xs text-black">
          <div className="text-left overflow-hidden">
            <div className="text-[10px] font-bold uppercase text-black">UPI ID</div>
            <div className="text-black font-black truncate text-xs">{upiId}</div>
          </div>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="px-2.5 py-1 bg-white text-black border-2 border-black hover:bg-neutral-100 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-black shrink-0 print:hidden"
            title="Copy UPI ID"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-black" /> : <Copy className="w-3.5 h-3.5 text-black" />}
            <span>{copied ? "COPIED" : "COPY"}</span>
          </button>
        </div>

        <div className="text-[10px] font-bold text-black uppercase tracking-wider">
          GPay • PhonePe • Paytm • BHIM • All UPI Apps
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shadow-lg ${className}`}>
        <div className="bg-white p-1.5 rounded-xl shrink-0 shadow-sm border border-slate-700">
          <img
            src={activeQrSrc}
            alt={`UPI Payment QR for ${upiId}`}
            width={size}
            height={size}
            className="rounded-md object-contain block"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0 font-mono text-left">
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Official UPI QR</span>
          </div>
          {amount && amount > 0 && (
            <div className="text-sm font-black text-cyan-400 truncate">
              ₹{amount.toLocaleString("en-IN")}
            </div>
          )}
          <div className="text-[10px] text-slate-300 truncate font-mono mt-0.5">
            {upiId}
          </div>
          <button
            type="button"
            onClick={handleCopyUpi}
            className="mt-1.5 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "COPIED" : "COPY UPI"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 shadow-xl ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>OFFICIAL UPI QR PAYMENT</span>
      </div>

      <div className="bg-white p-2.5 rounded-2xl shadow-inner border-2 border-slate-200 relative group inline-block">
        <img
          src={activeQrSrc}
          alt={`UPI Payment QR for ${upiId}`}
          width={size}
          height={size}
          className="rounded-lg object-contain block mx-auto"
          loading="eager"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono leading-tight pointer-events-none">
          Scan using GPay, PhonePe, Paytm, or any UPI App
        </div>
      </div>

      {amount && amount > 0 && (
        <div className="text-center">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Payable Amount</div>
          <div className="text-lg font-black font-mono text-cyan-400">
            ₹{amount.toLocaleString("en-IN")}
          </div>
        </div>
      )}

      <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2 font-mono text-xs">
        <div className="text-left overflow-hidden">
          <div className="text-[10px] text-slate-400 font-sans">UPI ID</div>
          <div className="text-slate-200 font-bold truncate text-[11px]">{upiId}</div>
        </div>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold shrink-0"
          title="Copy UPI ID"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "COPIED" : "COPY"}</span>
        </button>
      </div>

      <div className="text-[10px] text-slate-400 font-sans leading-tight">
        GPay • PhonePe • Paytm • BHIM • Any Bank App
      </div>
    </div>
  );
};
