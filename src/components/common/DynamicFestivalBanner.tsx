import React from "react";
import { ActiveThemeConfig } from "../../utils/festivalTheme";
import { PookkalamGraphic, NilavilakkuGraphic } from "./OnamFestiveElements";
import {
  Sparkles,
  Calendar,
  Heart,
  Gift,
  ArrowRight,
  MessageCircle,
  Flag,
  Compass,
  Palette,
  CheckCircle2,
  X
} from "lucide-react";

interface DynamicFestivalBannerProps {
  themeConfig: ActiveThemeConfig;
  onResetDefaultTheme?: () => void;
  isCustomPreview?: boolean;
}

export const DynamicFestivalBanner: React.FC<DynamicFestivalBannerProps> = ({
  themeConfig,
  onResetDefaultTheme,
  isCustomPreview = false
}) => {
  if (!themeConfig.isSpecialDay && !isCustomPreview) return null;

  const { specialDay, themeType, greetingMl, greetingEn, bgHeroGradient, containerBorder, iconSymbol } = themeConfig;

  return (
    <div
      id="dynamic-festival-hero"
      className={`relative rounded-3xl overflow-hidden border ${containerBorder} bg-gradient-to-r ${bgHeroGradient} shadow-2xl p-5 sm:p-6 mb-6 text-white`}
    >
      {/* Kasavu / Colored Accent Strip at Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 via-amber-300 to-emerald-500" />

      {/* Hanging Decorative Toran for Festive Days */}
      {themeType === "onam" && (
        <div className="w-full overflow-hidden select-none pointer-events-none -mt-3 mb-2 opacity-90">
          <div className="flex justify-between items-start max-w-6xl mx-auto px-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-2.5 h-3.5 bg-emerald-600 rounded-b-full border-t border-amber-400" />
                <div className="w-0.5 h-1.5 bg-amber-500/50" />
                <div
                  className={`w-3.5 h-3.5 rounded-full shadow border border-amber-300/40 flex items-center justify-center ${
                    i % 2 === 0
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
                      : "bg-gradient-to-br from-yellow-300 to-amber-400"
                  }`}
                >
                  <div className="w-1 h-1 rounded-full bg-red-600/80" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left Side: Graphic Symbol & Greetings */}
        <div className="flex items-center gap-4 text-left">
          <div className="relative shrink-0">
            {themeType === "onam" ? (
              <PookkalamGraphic size={64} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-center text-4xl shadow-inner">
                {iconSymbol || "✨"}
              </div>
            )}
            {specialDay && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full font-mono shadow">
                {specialDay.dateFormatted || "2026"}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{specialDay ? specialDay.themeName : "Festive Special Theme"}</span>
              </span>

              {isCustomPreview && (
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded-full">
                  Interactive Theme Preview
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
              {greetingMl} <span className="text-amber-300">({greetingEn})</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-2xl leading-relaxed">
              {specialDay
                ? specialDay.descriptionMl
                : "നിങ്ങളുടെ വീട് നിർമ്മാണത്തിനും വാസ്തു പ്ലാനിംഗിനും വാസ്തുശില്പിയുടെ പ്രത്യേക കൺസൾട്ടേഷൻ സേവനങ്ങളും ആനുകൂല്യങ്ങളും!"}
            </p>
          </div>
        </div>

        {/* Right Side: Consultation Action & Optional Theme Reset */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          {isCustomPreview && onResetDefaultTheme && (
            <button
              type="button"
              onClick={onResetDefaultTheme}
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Reset to today's automatic theme"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Theme</span>
            </button>
          )}

          <a
            href="https://wa.me/919747995961?text=Hello%20Vasthusilpy,%20I%20would%20like%20to%20know%20about%20Building%20Plan%20%26%20Vasthu%20Consultation."
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>Consultation (WhatsApp)</span>
          </a>
        </div>
      </div>
    </div>
  );
};
