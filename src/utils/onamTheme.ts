/**
 * Onam Festival Theme Utility for Vasthusilpy Portal
 * Automatically active until August 30, 2026 23:59:59 IST.
 * After August 30, 2026, it gracefully reverts back to normal.
 */

// Target Expiration Date: 30-08-2026 23:59:59
export const ONAM_EXPIRATION_DATE = new Date(2026, 7, 30, 23, 59, 59); // Note: Month 7 is August in JavaScript (0-indexed)

export const ONAM_EXPIRATION_STR = "30-08-2026";

/**
 * Checks if the current local time is within the Onam festival period (up to 30-08-2026).
 */
export const isOnamThemeActive = (overrideDate?: Date): boolean => {
  const now = overrideDate || new Date();
  return now.getTime() <= ONAM_EXPIRATION_DATE.getTime();
};

/**
 * Returns human-readable time remaining for the Onam celebration in Malayalam & English.
 */
export const getOnamRemainingStatus = () => {
  const now = new Date();
  const diffMs = ONAM_EXPIRATION_DATE.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      isActive: false,
      daysLeft: 0,
      hoursLeft: 0,
      labelMl: "ഓണം തീം കാലാവധി കഴിഞ്ഞു",
      labelEn: "Onam Theme Concluded"
    };
  }

  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    isActive: true,
    daysLeft,
    hoursLeft,
    labelMl: `30-08-2026 വരെ സജീവം (${daysLeft} ദിവസങ്ങൾ ബാക്കി)`,
    labelEn: `Active until 30-08-2026 (${daysLeft}d ${hoursLeft}h left)`
  };
};

/**
 * Festive color schemes and styling presets for Onam
 */
export const ONAM_STYLES = {
  kasavuBorder: "border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  goldGradient: "from-amber-400 via-yellow-300 to-amber-500",
  festiveCardBg: "bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-emerald-950/30",
  accentGold: "text-amber-300",
  tagBg: "bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-emerald-500/20 border border-amber-400/40 text-amber-200"
};
