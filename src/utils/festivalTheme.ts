/**
 * Dynamic Website Festival & Special Day Theme Engine
 * Automatically shifts home page styling, color accents, greetings and festive banners
 * according to Kerala cultural festivals, national holidays, and engineering special days.
 */

import { SPECIAL_DAYS_DATABASE, SpecialDayInfo, getSpecialDayForDate } from "./keralaCalendarData";
import { isOnamThemeActive as checkOnamOriginal, getOnamRemainingStatus } from "./onamTheme";

export interface ActiveThemeConfig {
  specialDay: SpecialDayInfo | null;
  themeType: "onam" | "vishu" | "kerala_piravi" | "tricolor" | "diwali" | "christmas" | "engineers" | "eid" | "default";
  themeName: string;
  isSpecialDay: boolean;
  bgHeroGradient: string;
  containerBorder: string;
  accentText: string;
  badgeBg: string;
  badgeText: string;
  greetingEn: string;
  greetingMl: string;
  iconSymbol: string;
  kasavuBorder: string;
  decorType: "pookkalam_toran" | "tricolor_ribbon" | "kanikkonna_gold" | "stars_snow" | "diyas_lights" | "blueprint_grid" | "crescent_green" | "standard";
}

/**
 * Returns current active theme based on today's Kerala date or an optional preview date.
 */
export function getActiveWebsiteTheme(previewDate?: Date): ActiveThemeConfig {
  const date = previewDate || new Date();
  const specialDay = getSpecialDayForDate(date);

  // If a specific special day matches
  if (specialDay) {
    let decor: ActiveThemeConfig["decorType"] = "standard";
    if (specialDay.themeType === "onam") decor = "pookkalam_toran";
    else if (specialDay.themeType === "tricolor") decor = "tricolor_ribbon";
    else if (specialDay.themeType === "vishu") decor = "kanikkonna_gold";
    else if (specialDay.themeType === "christmas") decor = "stars_snow";
    else if (specialDay.themeType === "diwali") decor = "diyas_lights";
    else if (specialDay.themeType === "engineers") decor = "blueprint_grid";
    else if (specialDay.themeType === "eid") decor = "crescent_green";
    else if (specialDay.themeType === "kerala_piravi") decor = "kanikkonna_gold";

    return {
      specialDay,
      themeType: specialDay.themeType,
      themeName: specialDay.themeName,
      isSpecialDay: true,
      bgHeroGradient: specialDay.themeColors.bgGradient,
      containerBorder: specialDay.themeColors.border,
      accentText: specialDay.themeColors.accent,
      badgeBg: specialDay.themeColors.badgeBg,
      badgeText: specialDay.themeColors.badgeText,
      greetingEn: specialDay.greetingEn,
      greetingMl: specialDay.greetingMl,
      iconSymbol: specialDay.iconSymbol,
      kasavuBorder: specialDay.themeColors.kasavuAccent || "border-amber-400/50",
      decorType: decor,
    };
  }

  // Fallback: Check if within Onam window
  if (checkOnamOriginal(date)) {
    const onamPreset = SPECIAL_DAYS_DATABASE.find((s) => s.id === "onam-season")!;
    return {
      specialDay: onamPreset,
      themeType: "onam",
      themeName: "Onam Festival Season (പൊന്നോണക്കാലം)",
      isSpecialDay: true,
      bgHeroGradient: onamPreset.themeColors.bgGradient,
      containerBorder: onamPreset.themeColors.border,
      accentText: onamPreset.themeColors.accent,
      badgeBg: onamPreset.themeColors.badgeBg,
      badgeText: onamPreset.themeColors.badgeText,
      greetingEn: onamPreset.greetingEn,
      greetingMl: onamPreset.greetingMl,
      iconSymbol: onamPreset.iconSymbol,
      kasavuBorder: "border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
      decorType: "pookkalam_toran",
    };
  }

  // Default Standard Vasthusilpy Theme
  return {
    specialDay: null,
    themeType: "default",
    themeName: "Vasthusilpy Engineering Studio Classic",
    isSpecialDay: false,
    bgHeroGradient: "from-slate-900 via-slate-950 to-slate-900",
    containerBorder: "border-slate-800",
    accentText: "text-cyan-400",
    badgeBg: "bg-cyan-950/80 border-cyan-800",
    badgeText: "text-cyan-300",
    greetingEn: "Welcome to Vasthusilpy Engineering Portal",
    greetingMl: "വാസ്തുശില്പി എഞ്ചിനീയറിംഗ് പോർട്ടലിലേക്ക് സ്വാഗതം",
    iconSymbol: "🏛️",
    kasavuBorder: "border-slate-800",
    decorType: "standard",
  };
}

export { checkOnamOriginal, getOnamRemainingStatus };
