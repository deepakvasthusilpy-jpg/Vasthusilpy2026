import React, { useState, useEffect } from "react";
import { Smartphone, Monitor, RotateCcw, Sparkles } from "lucide-react";
import { useViewMode, PHONE_PRESETS, PhonePreset } from "../../context/ViewModeContext";
import { useLanguage } from "../../context/LanguageContext";

export const MobileViewToolbar: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    toggleViewMode,
    phonePreset,
    setPhonePreset,
    isSimulatedMobileOnDesktop,
    isForcedDesktopOnMobile
  } = useViewMode();
  const { language } = useLanguage();

  if (!isSimulatedMobileOnDesktop && !isForcedDesktopOnMobile) {
    return null;
  }

  // Banner when user is on a mobile device and forced Desktop mode
  if (isForcedDesktopOnMobile) {
    return (
      <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/40 px-4 py-2 flex items-center justify-between text-xs font-mono text-cyan-200 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-bold text-white uppercase tracking-wider">
            {language === "ml" ? "ഡെസ്ക്ടോപ്പ് മോഡ് സജീവം" : "Desktop View Active"}
          </span>
          <span className="text-[11px] text-cyan-200/60 hidden sm:inline">
            (Full width 1200px • Scroll horizontally)
          </span>
        </div>

        <button
          onClick={() => setViewMode("mobile")}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>{language === "ml" ? "മൊബൈൽ വ്യൂവിലേക്ക് മടങ്ങുക" : "Switch to Mobile View"}</span>
        </button>
      </div>
    );
  }

  // Top control bar when in Simulated Mobile Mode on Desktop
  return (
    <div className="sticky top-0 z-50 bg-slate-950/95 border-b border-pink-500/30 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-pink-200 shadow-2xl backdrop-blur-xl">
      {/* Left indicator */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500/20 border border-pink-400/40 text-pink-300">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-white uppercase tracking-wider text-xs">
              {language === "ml" ? "മൊബൈൽ സിമുലേഷൻ വ്യൂ" : "Mobile View Simulator"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-pink-500/20 text-pink-300 border border-pink-400/30">
              Active
            </span>
          </div>
          <p className="text-[10px] text-pink-200/60 hidden md:block">
            Previewing responsive mobile layout, drawer navigation, and touch-friendly controls
          </p>
        </div>
      </div>

      {/* Center preset selectors */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-white/10">
        <span className="text-[10px] uppercase font-bold text-purple-200/60 px-2 hidden lg:inline">
          Device:
        </span>
        {PHONE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setPhonePreset(preset.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              phonePreset === preset.id
                ? "bg-pink-600 text-white shadow-xs"
                : "text-purple-200/70 hover:text-white hover:bg-white/10"
            }`}
            title={`${preset.name} (${preset.description})`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Right Action: Switch back to Desktop View */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("desktop")}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer"
          title="Return to full-screen Desktop View"
        >
          <Monitor className="w-4 h-4" />
          <span>{language === "ml" ? "ഡെസ്ക്ടോപ്പ് വ്യൂ" : "Desktop View"}</span>
        </button>
      </div>
    </div>
  );
};

export const SmartphoneNotch: React.FC<{ presetWidth: number | string }> = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-[#0a0214] text-white px-6 pt-3 pb-2 flex items-center justify-between select-none shrink-0 border-b border-white/10 text-xs font-mono">
      {/* Left Time */}
      <span className="font-bold text-[11px] tracking-tight">{time || "9:41"}</span>

      {/* Center Dynamic Island / Notch */}
      <div className="flex items-center gap-2 bg-black px-3 py-1 rounded-full border border-white/15 shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/80 relative">
          <div className="absolute inset-0.5 rounded-full bg-blue-950/90" />
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
      </div>

      {/* Right Icons: 5G, Wi-Fi, Battery */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
        <span className="font-bold">5G</span>
        <div className="w-5 h-2.5 border border-white/60 rounded-xs p-0.5 flex items-center">
          <div className="h-full bg-emerald-400 rounded-xs w-3/4" />
        </div>
      </div>
    </div>
  );
};
