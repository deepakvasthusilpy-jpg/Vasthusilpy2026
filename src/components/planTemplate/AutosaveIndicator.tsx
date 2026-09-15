import React, { useState } from "react";
import { CheckCircle2, RefreshCw, Cloud, CloudCheck, HardDrive } from "lucide-react";

interface AutosaveIndicatorProps {
  status: "saved" | "saving" | "unsaved";
  lastSavedAt?: string;
  onManualSave?: () => void;
  className?: string;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  onManualSave,
  className = ""
}) => {
  const [justClicked, setJustClicked] = useState(false);

  const handleClick = () => {
    if (onManualSave) {
      setJustClicked(true);
      onManualSave();
      setTimeout(() => setJustClicked(false), 1500);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all select-none cursor-pointer group shadow-sm ${
        status === "saving"
          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
          : status === "unsaved"
          ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
      } ${className}`}
      title={
        status === "saving"
          ? "Autosaving changes..."
          : "Autosaved to local file storage. Click to force save now."
      }
    >
      {/* Dynamic Status Icon */}
      <div className="relative flex items-center justify-center">
        {status === "saving" ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
        ) : justClicked ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
        ) : (
          <div className="relative">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-slate-950 animate-pulse" />
          </div>
        )}
      </div>

      {/* Label and Status */}
      <div className="flex items-center gap-1.5 text-[11px] font-mono leading-tight">
        <span className="font-bold tracking-tight">
          {status === "saving"
            ? "Autosaving..."
            : justClicked
            ? "Saved Now!"
            : "Autosaved"}
        </span>
        <span className="text-[9.5px] opacity-70 hidden sm:inline">
          {lastSavedAt ? `(${lastSavedAt})` : "• Sync Active"}
        </span>
      </div>
    </div>
  );
};
