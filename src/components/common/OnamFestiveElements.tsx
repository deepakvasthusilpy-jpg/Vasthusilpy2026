import React from "react";
import { isOnamThemeActive, getOnamRemainingStatus, ONAM_EXPIRATION_STR } from "../../utils/onamTheme";
import { Sparkles, Calendar, Heart, Gift, ArrowRight, MessageCircle } from "lucide-react";

/**
 * Traditional Kerala Athapookkalam SVG Graphic
 */
export const PookkalamGraphic: React.FC<{ size?: number; className?: string }> = ({
  size = 64,
  className = ""
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`animate-spin-slow ${className}`}
      style={{ animationDuration: "35s" }}
    >
      <defs>
        <radialGradient id="pookkalamCenterGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <linearGradient id="petalRed" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="petalGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="petalGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id="petalOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>

      {/* Outer Leaf Ring (Green) */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#166534" strokeWidth="2" strokeDasharray="3 3" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
        <path
          key={`outer-${angle}`}
          d="M 50 2 C 55 12 55 18 50 24 C 45 18 45 12 50 2"
          fill="url(#petalGreen)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}

      {/* Second Ring: Marigold Orange Petals */}
      <circle cx="50" cy="50" r="38" fill="#78350F" opacity="0.4" />
      {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((angle) => (
        <path
          key={`mid-${angle}`}
          d="M 50 12 C 57 22 57 28 50 34 C 43 28 43 22 50 12"
          fill="url(#petalOrange)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}

      {/* Third Ring: Crimson / Chemparathi Red Petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <path
          key={`inner-${angle}`}
          d="M 50 20 C 56 28 56 34 50 40 C 44 34 44 28 50 20"
          fill="url(#petalRed)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}

      {/* Fourth Ring: Bright Yellow Mukkutti / Thumba Petals */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle) => (
        <path
          key={`gold-${angle}`}
          d="M 50 26 C 54 32 54 36 50 40 C 46 36 46 32 50 26"
          fill="url(#petalGold)"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}

      {/* Center Lamp (Nilavilakku Glow Center) */}
      <circle cx="50" cy="50" r="11" fill="url(#pookkalamCenterGlow)" />
      <circle cx="50" cy="50" r="8" fill="#F59E0B" />
      <circle cx="50" cy="50" r="4" fill="#FEF08A" className="animate-pulse" />
    </svg>
  );
};

/**
 * Traditional Kerala Nilavilakku (Auspicious Brass Lamp) SVG
 */
export const NilavilakkuGraphic: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = ""
}) => {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 40 60" className={`shrink-0 ${className}`}>
      <defs>
        <radialGradient id="lampFlameGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="35%" stopColor="#FDE68A" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>
      </defs>

      {/* Glowing Flame */}
      <circle cx="20" cy="11" r="10" fill="url(#lampFlameGlow)" opacity="0.8" className="animate-pulse" />
      <path
        d="M 20 4 C 17 8 16 11 18 14 C 19 15.5 21 15.5 22 14 C 24 11 23 8 20 4 Z"
        fill="#FEF08A"
        className="animate-pulse"
      />
      <path
        d="M 20 7 C 18.5 9.5 18 11.5 19 13.5 C 19.5 14.5 20.5 14.5 21 13.5 C 22 11.5 21.5 9.5 20 7 Z"
        fill="#F59E0B"
      />

      {/* Top Wick Bowl */}
      <ellipse cx="20" cy="16" rx="9" ry="3" fill="url(#brassGradient)" />
      <ellipse cx="20" cy="15.5" rx="7.5" ry="2" fill="#78350F" />

      {/* Pillar Stem */}
      <path d="M 18 18 L 18 42 L 17 44 L 23 44 L 22 42 L 22 18 Z" fill="url(#brassGradient)" />

      {/* Middle Decorative Ring */}
      <ellipse cx="20" cy="30" rx="5" ry="1.8" fill="url(#brassGradient)" />

      {/* Base Bowl & Pedestal */}
      <ellipse cx="20" cy="45" rx="11" ry="3.5" fill="url(#brassGradient)" />
      <path d="M 15 47 L 13 54 L 27 54 L 25 47 Z" fill="url(#brassGradient)" />
      <ellipse cx="20" cy="54" rx="14" ry="4" fill="url(#brassGradient)" />
    </svg>
  );
};

/**
 * Traditional Hanging Festive Toran Garland (ചെണ്ടുമല്ലി പൂന്തോരണം)
 */
export const OnamToranBanner: React.FC = () => {
  if (!isOnamThemeActive()) return null;

  return (
    <div className="w-full overflow-hidden select-none pointer-events-none -mt-1 mb-2 relative">
      <div className="flex justify-between items-start max-w-7xl mx-auto px-4 opacity-90">
        {[...Array(14)].map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Green Mango Leaf */}
            <div className="w-3 h-4 bg-emerald-600 rounded-b-full border-t border-amber-400 shadow-sm" />
            {/* Hanging Thread */}
            <div className="w-0.5 h-2 bg-amber-500/50" />
            {/* Marigold Bloom (Orange & Yellow Alternate) */}
            <div
              className={`w-4 h-4 rounded-full shadow-md border border-amber-300/40 flex items-center justify-center ${
                i % 2 === 0
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
                  : "bg-gradient-to-br from-yellow-300 to-amber-400"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Top Onam Celebration Banner (Hero Banner)
 */
export const OnamGreetingHero: React.FC<{ onExploreOffers?: () => void }> = ({ onExploreOffers }) => {
  if (!isOnamThemeActive()) return null;

  const { daysLeft, labelMl } = getOnamRemainingStatus();

  return (
    <div className="relative rounded-3xl overflow-hidden border border-amber-500/50 bg-gradient-to-r from-amber-950/90 via-slate-950 to-emerald-950/90 shadow-2xl p-5 sm:p-6 mb-6">
      {/* Kasavu Golden Accent Strip at Top */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-500" />

      {/* Background Decorative Floral Ambient Pattern */}
      <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
        <PookkalamGraphic size={200} />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left Side: Pookkalam & Greetings */}
        <div className="flex items-center gap-4 text-left">
          <div className="relative shrink-0">
            <PookkalamGraphic size={64} className="drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full font-mono shadow">
              2026
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>പൊന്നോണം സ്പെഷ്യൽ ആഘോഷം</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                {labelMl}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
              🌸 ഹൃദ്യമായ ഓണാശംസകൾ! <span className="text-amber-300">Happy Onam 2026</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-2xl leading-relaxed">
              ഐശ്വര്യത്തിന്റെയും സമൃദ്ധിയുടെയും പൊന്നോണക്കാലത്ത് നിങ്ങളുടെ വീട് നിർമ്മാണത്തിനും വാസ്തു പ്ലാനിംഗിനും വാസ്തുശില്പിയുടെ പ്രത്യേക കൺസൾട്ടേഷൻ സേവനങ്ങളും ആനുകൂല്യങ്ങളും!
            </p>
          </div>
        </div>

        {/* Right Side: Special Call to Action / Direct Consultation */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://wa.me/919747995961?text=Hello%20Vasthusilpy,%20I%20would%20like%20to%20know%20about%20the%20Onam%20Special%20Building%20Plan%20%26%20Vasthu%20Consultation."
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-2 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-200" />
            <span>ഓണം ഓഫർ ബുക്കിംഗ് (WhatsApp)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * Onam Festive Badge on Login Page & Header
 */
export const OnamFestiveBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (!isOnamThemeActive()) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-emerald-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold shadow-sm">
        <span className="text-amber-400 text-xs">🌸</span>
        <span>ഓണം തീം (30-08-2026 വരെ)</span>
      </span>
    );
  }

  return (
    <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-emerald-950/70 border border-amber-500/40 text-xs font-mono text-amber-200 flex items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2.5">
        <NilavilakkuGraphic size={20} />
        <div>
          <div className="font-bold text-amber-300 flex items-center gap-1">
            <span>പൊന്നോണാശംസകൾ • Happy Onam 2026</span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-[11px] text-slate-400">
            ഓണം സ്പെഷ്യൽ ഓഫറുകൾ 30-08-2026 വരെ ലഭ്യമാണ്.
          </div>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold">
          FESTIVE PASS
        </span>
      </div>
    </div>
  );
};
