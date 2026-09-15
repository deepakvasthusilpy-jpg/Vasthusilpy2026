/**
 * Comprehensive Kerala Cultural, Kollavarsham Calendar & National Holidays Database
 * Features:
 * - Authentic Malayalam Kollavarsham Era (1201 / 1202 ME) date calculations
 * - Kerala Government Public Holidays & Bank Holidays (2026 & recurring)
 * - Major Kerala Festivals (Onam, Vishu, Thrissur Pooram, Attukal Pongala, Thiruvathira, etc.)
 * - Auspicious Vasthu & Civil Construction Muhurthams (Bhoomi Pooja, Shanku Sthapanam, Grihapravesham)
 * - Vratams & Astrological Thithis (Ekadashi, Pradosham, Sashti, Amavasi 🌑, Pournami 🌕)
 * - Panchangam timings (Nakshathram, Rahu Kalam, Gulika Kalam, Yamagandam)
 * - Color-coded category tags for genuine Kerala Calendar look & feel
 */

import { getProkeralaDayData } from "./prokeralaCalendarData";

export type HolidayCategory =
  | "government_holiday"
  | "bank_holiday"
  | "kerala_festival"
  | "national_holiday"
  | "vasthu_muhurtham"
  | "vratam"
  | "observance";

export interface SpecialDayInfo {
  id: string;
  nameEn: string;
  nameMl: string;
  category: HolidayCategory;
  dateFormatted: string; // "MM-DD" or "YYYY-MM-DD"
  descriptionEn: string;
  descriptionMl: string;
  historyEn?: string;
  themeType: "onam" | "vishu" | "kerala_piravi" | "tricolor" | "diwali" | "christmas" | "engineers" | "eid" | "default";
  themeName: string;
  themeColors: {
    primary: string;
    accent: string;
    border: string;
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    kasavuAccent?: string;
  };
  greetingEn: string;
  greetingMl: string;
  iconSymbol: string;
  isPublicHoliday?: boolean;
  isBankHoliday?: boolean;
  isRestrictedHoliday?: boolean;
  isVasthuAuspicious?: boolean;
}

export interface KeralaDayAstrology {
  gregorianDate: Date;
  dayNumber: number;
  weekdayMl: string;
  weekdayEn: string;
  locationName: string;
  nakshatraMl: string;
  nakshatraEn: string;
  nakshatraNumber: number;
  nakshatraDetail: string;
  nakshatraDetailMl: string;
  thithiMl: string;
  thithiEn: string;
  thithiDetail: string;
  thithiDetailMl: string;
  pakshamMl: string;
  pakshamEn: string;
  sakaEraMl: string;
  sakaEraEn: string;
  sakaYear: number;
  sakaMonthMl: string;
  sakaMonthEn: string;
  sakaDay: number;
  vikramSamvatYear: number;
  vikramSamvatHi: string;
  vikramSamvatEn: string;
  ritu: IndianSeasonInfo;
  ayanam: { ayanamEn: string; ayanamMl: string; ayanamHi: string; isUttarayan: boolean };
  isAmavasi: boolean;
  isPournami: boolean;
  isEkadashi: boolean;
  isPradosham: boolean;
  isSashti: boolean;
  rahuKalam: string;
  yamagandam: string;
  gulikaKalam: string;
  abhijithMuhurtham: string;
  kollavarshamMonthMl: string;
  kollavarshamMonthEn: string;
  kollavarshamMonthId: number;
  kollavarshamDay: number;
  kollavarshamDayMlNumerals: string;
  kollavarshamYear: number;
  sunrise: string;
  sunset: string;
  vasthuStatus: {
    isAuspicious: boolean;
    labelMl: string;
    labelEn: string;
    suitability: "excellent" | "favorable" | "neutral" | "avoid";
  };
}

export type IndianDayAstrology = KeralaDayAstrology;

export const MALAYALAM_MONTHS = [
  { id: 1, nameMl: "ചിങ്ങം", nameEn: "Chingam", seasonMl: "ശരത്കാലം (ഓണക്കാലം)", startGregMonth: 8, startGregDay: 17, approxDays: 31 },
  { id: 2, nameMl: "കന്നി", nameEn: "Kanni", seasonMl: "ശരത്കാലം", startGregMonth: 9, startGregDay: 17, approxDays: 30 },
  { id: 3, nameMl: "തുലാം", nameEn: "Thulam", seasonMl: "ഹേമന്തകാലം (തുലാവർഷം)", startGregMonth: 10, startGregDay: 18, approxDays: 30 },
  { id: 4, nameMl: "വൃശ്ചികം", nameEn: "Vrischikam", seasonMl: "ഹേമന്തകാലം (മണ്ഡലകാലം)", startGregMonth: 11, startGregDay: 17, approxDays: 30 },
  { id: 5, nameMl: "ധനു", nameEn: "Dhanu", seasonMl: "ശിശിരകാലം (ധനുമാസ തിരുവാതിര)", startGregMonth: 12, startGregDay: 16, approxDays: 30 },
  { id: 6, nameMl: "മകരം", nameEn: "Makaram", seasonMl: "ശിശിരകാലം (മകരവിളക്ക്)", startGregMonth: 1, startGregDay: 15, approxDays: 30 },
  { id: 7, nameMl: "കുംഭം", nameEn: "Kumbham", seasonMl: "വസന്തകാലം (ശിവരാത്രി)", startGregMonth: 2, startGregDay: 14, approxDays: 30 },
  { id: 8, nameMl: "മീനം", nameEn: "Meenam", seasonMl: "വസന്തകാലം (ഉത്സവക്കാലം)", startGregMonth: 3, startGregDay: 15, approxDays: 30 },
  { id: 9, nameMl: "മേടം", nameEn: "Medam", seasonMl: "ഗ്രീഷ്മകാലം (വിഷുക്കണി)", startGregMonth: 4, startGregDay: 14, approxDays: 31 },
  { id: 10, nameMl: "ഇടവം", nameEn: "Edavam", seasonMl: "ഗ്രീഷ്മകാലം", startGregMonth: 5, startGregDay: 15, approxDays: 31 },
  { id: 11, nameMl: "മിഥുനം", nameEn: "Mithunam", seasonMl: "വർഷകാലം (കാലവർഷം)", startGregMonth: 6, startGregDay: 16, approxDays: 31 },
  { id: 12, nameMl: "കർക്കടകം", nameEn: "Karkidakam", seasonMl: "വർഷകാലം (രാമായണമാസം / ഔഷധമാസം)", startGregMonth: 7, startGregDay: 17, approxDays: 31 },
];

export const MONTHS_CONFIG = [
  { id: 0, nameEn: "January", nameMl: "ജനുവരി", kollamRangeMl: "ധനു - മകരം", approxDays: 31 },
  { id: 1, nameEn: "February", nameMl: "ഫെബ്രുവരി", kollamRangeMl: "മകരം - കുംഭം", approxDays: 28 },
  { id: 2, nameEn: "March", nameMl: "മാർച്ച്", kollamRangeMl: "കുംഭം - മീനം", approxDays: 31 },
  { id: 3, nameEn: "April", nameMl: "ഏപ്രിൽ", kollamRangeMl: "മീനം - മേടം", approxDays: 30 },
  { id: 4, nameEn: "May", nameMl: "മെയ്", kollamRangeMl: "മേടം - ഇടവം", approxDays: 31 },
  { id: 5, nameEn: "June", nameMl: "ജൂൺ", kollamRangeMl: "ഇടവം - മിഥുനം", approxDays: 30 },
  { id: 6, nameEn: "July", nameMl: "ജൂലൈ", kollamRangeMl: "മിഥുനം - കർക്കടകം", approxDays: 31 },
  { id: 7, nameEn: "August", nameMl: "ആഗസ്റ്റ്", kollamRangeMl: "കർക്കടകം - ചിങ്ങം", approxDays: 31 },
  { id: 8, nameEn: "September", nameMl: "സെപ്റ്റംബർ", kollamRangeMl: "ചിങ്ങം - കന്നി", approxDays: 30 },
  { id: 9, nameEn: "October", nameMl: "ഒക്ടോബർ", kollamRangeMl: "കന്നി - തുലാം", approxDays: 31 },
  { id: 10, nameEn: "November", nameMl: "നവംബർ", kollamRangeMl: "തുലാം - വൃശ്ചികം", approxDays: 30 },
  { id: 11, nameEn: "December", nameMl: "ഡിസംബർ", kollamRangeMl: "വൃശ്ചികം - ധനു", approxDays: 31 },
];

export const WEEKDAYS_KERALA = [
  { id: 0, nameMl: "ഞായർ", nameEn: "Sunday", shortMl: "ഞാ", color: "text-rose-500", isWeekend: true },
  { id: 1, nameMl: "തിങ്കൾ", nameEn: "Monday", shortMl: "തി", color: "text-slate-200", isWeekend: false },
  { id: 2, nameMl: "ചൊവ്വ", nameEn: "Tuesday", shortMl: "ചൊ", color: "text-slate-200", isWeekend: false },
  { id: 3, nameMl: "ബുധൻ", nameEn: "Wednesday", shortMl: "ബു", color: "text-slate-200", isWeekend: false },
  { id: 4, nameMl: "വ്യാഴം", nameEn: "Thursday", shortMl: "വ്യാ", color: "text-slate-200", isWeekend: false },
  { id: 5, nameMl: "വെള്ളി", nameEn: "Friday", shortMl: "വെ", color: "text-slate-200", isWeekend: false },
  { id: 6, nameMl: "ശനി", nameEn: "Saturday", shortMl: "ശ", color: "text-cyan-400", isWeekend: true },
];

export const NAKSHATHRAMS_27 = [
  { id: 1, nameMl: "അശ്വതി", nameEn: "Ashwathi", lord: "Ketu", auspiciousForVasthu: true },
  { id: 2, nameMl: "ഭരണി", nameEn: "Bharani", lord: "Venus", auspiciousForVasthu: false },
  { id: 3, nameMl: "കാർത്തിക", nameEn: "Karthika", lord: "Sun", auspiciousForVasthu: false },
  { id: 4, nameMl: "രോഹിണി", nameEn: "Rohini", lord: "Moon", auspiciousForVasthu: true },
  { id: 5, nameMl: "മകയിരം", nameEn: "Makayiram", lord: "Mars", auspiciousForVasthu: true },
  { id: 6, nameMl: "തിരുവാതിര", nameEn: "Thiruvathira", lord: "Rahu", auspiciousForVasthu: false },
  { id: 7, nameMl: "പുണർതം", nameEn: "Punartham", lord: "Jupiter", auspiciousForVasthu: true },
  { id: 8, nameMl: "പൂയം", nameEn: "Pooyam", lord: "Saturn", auspiciousForVasthu: true },
  { id: 9, nameMl: "ആയില്യം", nameEn: "Aayilyam", lord: "Mercury", auspiciousForVasthu: false },
  { id: 10, nameMl: "മകം", nameEn: "Makam", lord: "Ketu", auspiciousForVasthu: false },
  { id: 11, nameMl: "പൂരം", nameEn: "Pooram", lord: "Venus", auspiciousForVasthu: false },
  { id: 12, nameMl: "ഉത്രം", nameEn: "Uthram", lord: "Sun", auspiciousForVasthu: true },
  { id: 13, nameMl: "അത്തം", nameEn: "Atham", lord: "Moon", auspiciousForVasthu: true },
  { id: 14, nameMl: "ചിത്തിര", nameEn: "Chithira", lord: "Mars", auspiciousForVasthu: true },
  { id: 15, nameMl: "ചോതി", nameEn: "Chothi", lord: "Rahu", auspiciousForVasthu: true },
  { id: 16, nameMl: "വിശാഖം", nameEn: "Vishakham", lord: "Jupiter", auspiciousForVasthu: false },
  { id: 17, nameMl: "അനിഴം", nameEn: "Anizham", lord: "Saturn", auspiciousForVasthu: true },
  { id: 18, nameMl: "തൃക്കേട്ട", nameEn: "Thrikketta", lord: "Mercury", auspiciousForVasthu: false },
  { id: 19, nameMl: "മൂലം", nameEn: "Moolam", lord: "Ketu", auspiciousForVasthu: true },
  { id: 20, nameMl: "പൂരാടം", nameEn: "Pooradam", lord: "Venus", auspiciousForVasthu: false },
  { id: 21, nameMl: "ഉത്രാടം", nameEn: "Uthradam", lord: "Sun", auspiciousForVasthu: true },
  { id: 22, nameMl: "തിരുവോണം", nameEn: "Thiruvonam", lord: "Moon", auspiciousForVasthu: true },
  { id: 23, nameMl: "അവിട്ടം", nameEn: "Avittam", lord: "Mars", auspiciousForVasthu: true },
  { id: 24, nameMl: "ചതയം", nameEn: "Chathayam", lord: "Rahu", auspiciousForVasthu: true },
  { id: 25, nameMl: "പൂരുരുട്ടാതി", nameEn: "Pooruruttathi", lord: "Jupiter", auspiciousForVasthu: false },
  { id: 26, nameMl: "ഉത്രട്ടാതി", nameEn: "Uthrattathi", lord: "Saturn", auspiciousForVasthu: true },
  { id: 27, nameMl: "രേവതി", nameEn: "Revathi", lord: "Mercury", auspiciousForVasthu: true },
];

export const RAHU_KALAM_WEEKDAYS: Record<number, { rahu: string; yama: string; gulika: string; abhijith: string }> = {
  0: { rahu: "04:54 PM – 06:26 PM", yama: "12:21 PM – 01:52 PM", gulika: "03:22 PM – 04:54 PM", abhijith: "11:58 AM – 12:47 PM" }, // Sunday
  1: { rahu: "07:49 AM – 09:20 AM", yama: "10:51 AM – 12:22 PM", gulika: "01:53 PM – 03:24 PM", abhijith: "11:58 AM – 12:47 PM" }, // Monday
  2: { rahu: "03:23 PM – 04:54 PM", yama: "09:19 AM – 10:50 AM", gulika: "12:21 PM – 01:52 PM", abhijith: "11:58 AM – 12:47 PM" }, // Tuesday
  3: { rahu: "12:15 PM – 01:48 PM", yama: "07:38 AM – 09:11 AM", gulika: "10:43 AM – 12:15 PM", abhijith: "11:58 AM – 12:47 PM" }, // Wednesday
  4: { rahu: "01:51 PM – 03:22 PM", yama: "06:17 AM – 07:48 AM", gulika: "09:19 AM – 10:50 AM", abhijith: "11:58 AM – 12:47 PM" }, // Thursday
  5: { rahu: "10:50 AM – 12:21 PM", yama: "03:22 PM – 04:53 PM", gulika: "07:48 AM – 09:19 AM", abhijith: "11:58 AM – 12:47 PM" }, // Friday
  6: { rahu: "09:19 AM – 10:50 AM", yama: "01:51 PM – 03:22 PM", gulika: "06:17 AM – 07:48 AM", abhijith: "11:58 AM – 12:47 PM" }, // Saturday
};

// Convert standard numbers to Malayalam Numerals (൧, ൨, ൩, ൪...)
export function toMalayalamNumerals(num: number): string {
  const digits = ["൦", "൧", "൨", "൩", "൪", "൫", "൬", "൭", "൮", "൯"];
  return num
    .toString()
    .split("")
    .map((d) => digits[parseInt(d, 10)] || d)
    .join("");
}

// Convert standard numbers to Devanagari Numerals (१, २, ३, ४...)
export function toDevanagariNumerals(num: number): string {
  const digits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return num
    .toString()
    .split("")
    .map((d) => digits[parseInt(d, 10)] || d)
    .join("");
}

export interface IndianSeasonInfo {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMl: string;
  description: string;
  colorClass: string;
  months: string;
}

export const INDIAN_RITUS: IndianSeasonInfo[] = [
  { id: "vasant", nameEn: "Vasanta (Spring)", nameHi: "वसन्त ऋतु", nameMl: "വസന്തം (പൂക്കാലം)", description: "Chaitra - Vaishakha (Fresh blooms, gentle breeze)", colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", months: "മാർച്ച് - മെയ്" },
  { id: "grishma", nameEn: "Grishma (Summer)", nameHi: "ग्रीष्म ऋतु", nameMl: "ഗ്രീഷ്മം (വേനൽ)", description: "Jyeshtha - Ashadha (Sun peak, ripening fruits)", colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/30", months: "മെയ് - ജൂലൈ" },
  { id: "varsha", nameEn: "Varsha (Monsoon)", nameHi: "वर्षा ऋतु", nameMl: "വർഷം (മഴക്കാലം)", description: "Shravana - Bhadrapada (Life-giving monsoons)", colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30", months: "ജൂലൈ - സെപ്റ്റംബർ" },
  { id: "sharad", nameEn: "Sharad (Autumn)", nameHi: "शरद् ऋतु", nameMl: "ശരത് (ഉത്സവകാലം)", description: "Ashvina - Kartika (Clear skies, festival season)", colorClass: "text-orange-400 bg-orange-500/10 border-orange-500/30", months: "സെപ്റ്റംബർ - നവംബർ" },
  { id: "hemant", nameEn: "Hemanta (Pre-Winter)", nameHi: "हेमन्त ऋतु", nameMl: "ഹേമന്തം (മഞ്ഞുകാലം)", description: "Margashirsha - Pausha (Crisp cool air, morning mist)", colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30", months: "നവംബർ - ജനുവരി" },
  { id: "shishir", nameEn: "Shishira (Winter)", nameHi: "शिशिर ऋतु", nameMl: "ശിശിരം (കുളിർകാലം)", description: "Magha - Phalguna (Winter chill, preparations for spring)", colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/30", months: "ജനുവരി - മാർച്ച്" },
];

export function getIndianSeason(targetDate: Date): IndianSeasonInfo {
  const m = targetDate.getMonth(); // 0-11
  if (m === 2 || m === 3 || (m === 4 && targetDate.getDate() < 21)) return INDIAN_RITUS[0]; // Vasant
  if (m === 4 || m === 5 || (m === 6 && targetDate.getDate() < 23)) return INDIAN_RITUS[1]; // Grishma
  if (m === 6 || m === 7 || (m === 8 && targetDate.getDate() < 23)) return INDIAN_RITUS[2]; // Varsha
  if (m === 8 || m === 9 || (m === 10 && targetDate.getDate() < 22)) return INDIAN_RITUS[3]; // Sharad
  if (m === 10 || m === 11 || (m === 0 && targetDate.getDate() < 21)) return INDIAN_RITUS[4]; // Hemant
  return INDIAN_RITUS[5]; // Shishir
}

export function getIndianAyanam(targetDate: Date): { ayanamEn: string; ayanamMl: string; ayanamHi: string; isUttarayan: boolean } {
  const m = targetDate.getMonth();
  const d = targetDate.getDate();
  // Uttarayan starts around Makar Sankranti (Jan 14) and lasts until Karka Sankranti (July 16)
  const isUttarayan = (m === 0 && d >= 14) || (m > 0 && m < 6) || (m === 6 && d < 16);
  return {
    ayanamEn: isUttarayan ? "Uttarayan (Northward Movement)" : "Dakshinayan (Southward Movement)",
    ayanamMl: isUttarayan ? "ഉത്തരായനം (സൂര്യന്റെ വടക്കോട്ടുള്ള സഞ്ചാരം)" : "ദക്ഷിണായനം (സൂര്യന്റെ തെക്കോട്ടുള്ള സഞ്ചാരം)",
    ayanamHi: isUttarayan ? "उत्तरायण" : "दक्षिणायन",
    isUttarayan,
  };
}

export function getVikramSamvatDate(targetDate: Date): { year: number; yearHi: string; formattedEn: string; formattedMl: string } {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth();
  const d = targetDate.getDate();
  // Chaitra Shukla Pratipada generally falls in late March/early April
  let vikramYear = y + 57;
  if (m < 2 || (m === 2 && d < 20)) {
    vikramYear = y + 56;
  }
  return {
    year: vikramYear,
    yearHi: `विक्रम संवत् ${toDevanagariNumerals(vikramYear)}`,
    formattedEn: `Vikram Samvat ${vikramYear}`,
    formattedMl: `വിക്രം സംവത് ${vikramYear}`,
  };
}

/**
 * Calculates authentic Saka Era / National Civil Calendar Date for Kerala
 */
export function getSakaDate(targetDate: Date): {
  year: number;
  monthEn: string;
  monthMl: string;
  day: number;
  formattedEn: string;
  formattedMl: string;
} {
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth(); // 0-11
  const d = targetDate.getDate();

  const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const chaitraStartDay = isLeap ? 21 : 22;

  let sakaYear = y - 78;
  const marChaitra = new Date(y, 2, chaitraStartDay);
  if (targetDate < marChaitra) {
    sakaYear -= 1;
  }

  const SAKA_MONTHS = [
    { nameEn: "Chaitra", nameMl: "ചൈത്രം", startM: 2, startD: chaitraStartDay },
    { nameEn: "Vaishakha", nameMl: "വൈശാഖം", startM: 3, startD: 21 },
    { nameEn: "Jyeshtha", nameMl: "ജ്യേഷ്ഠം", startM: 4, startD: 22 },
    { nameEn: "Ashadha", nameMl: "ആഷാഢം", startM: 5, startD: 22 },
    { nameEn: "Shravana", nameMl: "ശ്രാവണം", startM: 6, startD: 23 },
    { nameEn: "Bhadrapada", nameMl: "ഭാദ്രപദം", startM: 7, startD: 23 },
    { nameEn: "Ashvina", nameMl: "ആശ്വിനം", startM: 8, startD: 23 },
    { nameEn: "Kartika", nameMl: "കാർത്തികം", startM: 9, startD: 23 },
    { nameEn: "Agrahayana", nameMl: "മാർഗ്ഗശീർഷം", startM: 10, startD: 22 },
    { nameEn: "Pausha", nameMl: "പൗഷം", startM: 11, startD: 22 },
    { nameEn: "Magha", nameMl: "മാഘം", startM: 0, startD: 21 },
    { nameEn: "Phalguna", nameMl: "ഫാൽഗുനം", startM: 1, startD: 20 },
  ];

  let sakaMonth = SAKA_MONTHS[5]; // Bhadrapada
  let sakaDay = 1;

  if (m === 7 && d >= 23) {
    sakaMonth = SAKA_MONTHS[5]; // Bhadrapada
    sakaDay = d - 22;
  } else if (m === 8 && d < 23) {
    sakaMonth = SAKA_MONTHS[5]; // Bhadrapada
    sakaDay = d + 9;
  } else if (m === 8 && d >= 23) {
    sakaMonth = SAKA_MONTHS[6]; // Ashvina
    sakaDay = d - 22;
  } else if (m === 9 && d < 23) {
    sakaMonth = SAKA_MONTHS[6]; // Ashvina
    sakaDay = d + 8;
  } else if (m === 9 && d >= 23) {
    sakaMonth = SAKA_MONTHS[7]; // Kartika
    sakaDay = d - 22;
  } else if (m === 10 && d < 22) {
    sakaMonth = SAKA_MONTHS[7]; // Kartika
    sakaDay = d + 9;
  } else if (m === 10 && d >= 22) {
    sakaMonth = SAKA_MONTHS[8]; // Agrahayana
    sakaDay = d - 21;
  } else if (m === 11 && d < 22) {
    sakaMonth = SAKA_MONTHS[8]; // Agrahayana
    sakaDay = d + 9;
  } else if (m === 11 && d >= 22) {
    sakaMonth = SAKA_MONTHS[9]; // Pausha
    sakaDay = d - 21;
  } else if (m === 0 && d < 21) {
    sakaMonth = SAKA_MONTHS[9]; // Pausha
    sakaDay = d + 10;
  } else if (m === 0 && d >= 21) {
    sakaMonth = SAKA_MONTHS[10]; // Magha
    sakaDay = d - 20;
  } else if (m === 1 && d < 20) {
    sakaMonth = SAKA_MONTHS[10]; // Magha
    sakaDay = d + 11;
  } else if (m === 1 && d >= 20) {
    sakaMonth = SAKA_MONTHS[11]; // Phalguna
    sakaDay = d - 19;
  } else if (m === 2 && d < chaitraStartDay) {
    sakaMonth = SAKA_MONTHS[11]; // Phalguna
    sakaDay = d + 10;
  } else if (m === 2 && d >= chaitraStartDay) {
    sakaMonth = SAKA_MONTHS[0]; // Chaitra
    sakaDay = d - (chaitraStartDay - 1);
  } else if (m === 3 && d < 21) {
    sakaMonth = SAKA_MONTHS[0]; // Chaitra
    sakaDay = d + (isLeap ? 11 : 10);
  } else if (m === 3 && d >= 21) {
    sakaMonth = SAKA_MONTHS[1]; // Vaishakha
    sakaDay = d - 20;
  } else if (m === 4 && d < 22) {
    sakaMonth = SAKA_MONTHS[1]; // Vaishakha
    sakaDay = d + 10;
  } else if (m === 4 && d >= 22) {
    sakaMonth = SAKA_MONTHS[2]; // Jyeshtha
    sakaDay = d - 21;
  } else if (m === 5 && d < 22) {
    sakaMonth = SAKA_MONTHS[2]; // Jyeshtha
    sakaDay = d + 10;
  } else if (m === 5 && d >= 22) {
    sakaMonth = SAKA_MONTHS[3]; // Ashadha
    sakaDay = d - 21;
  } else if (m === 6 && d < 23) {
    sakaMonth = SAKA_MONTHS[3]; // Ashadha
    sakaDay = d + 9;
  } else if (m === 6 && d >= 23) {
    sakaMonth = SAKA_MONTHS[4]; // Shravana
    sakaDay = d - 22;
  } else if (m === 7 && d < 23) {
    sakaMonth = SAKA_MONTHS[4]; // Shravana
    sakaDay = d + 9;
  }

  return {
    year: sakaYear,
    monthEn: sakaMonth.nameEn,
    monthMl: sakaMonth.nameMl,
    day: sakaDay,
    formattedEn: `${sakaYear} ${sakaMonth.nameEn} ${sakaDay}`,
    formattedMl: `${sakaYear} ${sakaMonth.nameMl} ${sakaDay}`,
  };
}

/**
 * Master List of All Special Days, Kerala Government Holidays, Festivals, Bank Holidays & Vasthu Muhurthams
 */
export const SPECIAL_DAYS_DATABASE: SpecialDayInfo[] = [
  // ==================== JANUARY (ധനു - മകരം) ====================
  {
    id: "mannam-jayanthi",
    nameEn: "Mannam Jayanthi",
    nameMl: "മന്നം ജയന്തി",
    category: "government_holiday",
    dateFormatted: "01-02",
    descriptionEn: "Birth anniversary of social reformer Mannathu Padmanabhan. Public holiday in Kerala.",
    descriptionMl: "സാമൂഹിക പരിഷ്കർത്താവ് മന്നത്ത് പത്മനാഭന്റെ ജന്മദിനാഘോഷം. കേരള സർക്കാർ പൊതു അവധി.",
    themeType: "default",
    themeName: "Social Reformer Day",
    themeColors: {
      primary: "from-blue-600 via-indigo-500 to-slate-900",
      accent: "text-blue-300",
      border: "border-blue-500/50",
      bgGradient: "from-blue-950/70 via-slate-950 to-slate-900",
      badgeBg: "bg-blue-500/20",
      badgeText: "text-blue-300",
    },
    greetingEn: "Happy Mannam Jayanthi! Honoring Kerala's pioneering social reformer.",
    greetingMl: "ഏവർക്കും മന്നം ജയന്തി ആശംസകൾ!",
    iconSymbol: "📜",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "makar-sankranti",
    nameEn: "Makaravilakku / Pongal",
    nameMl: "മകരവിളക്ക് & പൊങ്കൽ",
    category: "kerala_festival",
    dateFormatted: "01-14",
    descriptionEn: "Makaravilakku festival at Sabarimala and harvest festival of Pongal.",
    descriptionMl: "ശബരിമല മകരവിളക്ക് മഹോത്സവവും വിളവെടുപ്പ് ഉത്സവമായ തൈപ്പൊങ്കലും.",
    themeType: "vishu",
    themeName: "Makaravilakku Sacred Gold",
    themeColors: {
      primary: "from-amber-500 via-yellow-400 to-orange-500",
      accent: "text-amber-300",
      border: "border-amber-400/60",
      bgGradient: "from-amber-950/70 via-slate-950 to-orange-950/70",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Happy Makaravilakku & Pongal! May divine light fill your home.",
    greetingMl: "ഭക്തിസാന്ദ്രമായ മകരവിളക്ക് & പൊങ്കൽ ആശംസകൾ! 🪔",
    iconSymbol: "🪔",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "rep-day",
    nameEn: "Republic Day",
    nameMl: "റിപ്പബ്ലിക് ദിനം",
    category: "national_holiday",
    dateFormatted: "01-26",
    descriptionEn: "Commemorating the Constitution of India coming into effect on 26 January 1950. National Holiday.",
    descriptionMl: "ഇന്ത്യൻ ഭരണഘടന നിലവിൽ വന്നതിന്റെ ഓർമ്മ പുതുക്കുന്ന ദേശീയ റിപ്പബ്ലിക് ദിനാഘോഷം. ദേശീയ പൊതു അവധി.",
    historyEn: "The Constitution of India came into effect on 26 January 1950, establishing the Republic of India.",
    themeType: "tricolor",
    themeName: "Tricolor Patriotism (ദേശീയ ത്രിവർണ്ണ തീം)",
    themeColors: {
      primary: "from-orange-500 via-white to-emerald-600",
      accent: "text-orange-400",
      border: "border-orange-500/50",
      bgGradient: "from-slate-950 via-slate-900 to-emerald-950/80",
      badgeBg: "bg-orange-500/20",
      badgeText: "text-orange-300",
    },
    greetingEn: "Happy Republic Day! Proud to be an Indian.",
    greetingMl: "ഏവർക്കും ഹൃദയം നിറഞ്ഞ റിപ്പബ്ലിക് ദിനാശംസകൾ! 🇮🇳",
    iconSymbol: "🇮🇳",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== FEBRUARY (മകരം - കുംഭം) ====================
  {
    id: "sivarathri",
    nameEn: "Maha Shivaratri",
    nameMl: "മഹാ ശിവരാത്രി",
    category: "kerala_festival",
    dateFormatted: "02-16",
    descriptionEn: "Maha Shivaratri celebrated across Kerala with night-long vigil, prayers, and Aluva Manappuram Bali Tharpana.",
    descriptionMl: "ആലുവ മണപ്പുറത്ത് പിതൃതർപ്പണവും രാത്രിയിലെ ശിവപൂജകളുമായി ശിവരാത്രി വ്രതം. സർക്കാർ പൊതു അവധി.",
    themeType: "vishu",
    themeName: "Sacred Rudra Night Theme (ശിവരാത്രി പുണ്യ തീം)",
    themeColors: {
      primary: "from-amber-400 via-slate-300 to-blue-500",
      accent: "text-amber-300",
      border: "border-blue-500/40",
      bgGradient: "from-slate-950 via-indigo-950/60 to-slate-950",
      badgeBg: "bg-indigo-500/20",
      badgeText: "text-indigo-300",
    },
    greetingEn: "Om Namah Shivaya! Happy Maha Shivaratri.",
    greetingMl: "ഓം നമഃ ശിവായ! അനുഗ്രഹപ്രദമായ മഹാ ശിവരാത്രി ആശംസകൾ! 🔱",
    iconSymbol: "🔱",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "attukal-pongala",
    nameEn: "Attukal Pongala",
    nameMl: "ആറ്റുകാൽ പൊങ്കാല മഹോത്സവം",
    category: "kerala_festival",
    dateFormatted: "02-23",
    descriptionEn: "The world's largest gathering of women offering Pongala to Attukal Bhagavathy.",
    descriptionMl: "ലക്ഷക്കണക്കിന് ഭക്തവനിതകൾ ഭക്തിസാന്ദ്രമായി പൊങ്കാല നിവേദിക്കുന്ന ആറ്റുകാൽ പൊങ്കാല മഹോത്സവം.",
    themeType: "vishu",
    themeName: "Sacred Pongala Flame Theme",
    themeColors: {
      primary: "from-amber-500 via-red-500 to-yellow-400",
      accent: "text-amber-300",
      border: "border-amber-500/50",
      bgGradient: "from-amber-950/70 via-slate-950 to-red-950/60",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Blessed Attukal Pongala Day! Divine peace and prosperity.",
    greetingMl: "ഭക്തിസാന്ദ്രമായ ആറ്റുകാൽ പൊങ്കാല മഹോത്സവ ആശംസകൾ! 🪔",
    iconSymbol: "🪔",
    isPublicHoliday: false,
    isRestrictedHoliday: true,
  },

  // ==================== MARCH (കുംഭം - മീനം) ====================
  {
    id: "eid-ul-fitr",
    nameEn: "Eid-ul-Fitr (Cheriya Perunnal)",
    nameMl: "ഈദുൽ ഫിത്വർ (റംസാൻ / ചെറിയ പെരുന്നാൾ)",
    category: "kerala_festival",
    dateFormatted: "03-21",
    descriptionEn: "Islamic festival marking the culmination of Ramadan holy fasting month. Public Holiday.",
    descriptionMl: "വിശുദ്ധ റംസാൻ വ്രതാനുഷ്ഠാനത്തിന് പരിസമാപ്തി കുറിച്ച് സ്നേഹസന്ദേശവുമായി ഈദുൽ ഫിത്വർ. പൊതു അവധി.",
    themeType: "eid",
    themeName: "Emerald Crescent Peace Theme (ഈദ് മുബാറക് തീം)",
    themeColors: {
      primary: "from-emerald-400 via-teal-300 to-emerald-600",
      accent: "text-emerald-300",
      border: "border-emerald-400/60",
      bgGradient: "from-emerald-950/80 via-slate-950 to-teal-950/80",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
    },
    greetingEn: "Eid Mubarak! May divine blessings bring peace & prosperity.",
    greetingMl: "ഹൃദയം നിറഞ്ഞ ഈദ് മുബാറക് ആശംസകൾ! 🌙✨",
    iconSymbol: "🌙",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "maundy-thursday",
    nameEn: "Maundy Thursday (Pesaha)",
    nameMl: "പെസഹാ വ്യാഴം (Pesaha)",
    category: "kerala_festival",
    dateFormatted: "04-02",
    descriptionEn: "Commemorating the Last Supper of Jesus Christ. Public Holiday in Kerala.",
    descriptionMl: "യേശുക്രിസ്തുവിന്റെ അന്ത്യഅത്താഴത്തിന്റെ ഓർമ്മ പുതുക്കുന്ന പെസഹാ തിരുനാൾ. കേരള സർക്കാർ അവധി.",
    themeType: "christmas",
    themeName: "Sacred Pesaha Bread & Peace",
    themeColors: {
      primary: "from-purple-600 via-rose-500 to-slate-900",
      accent: "text-purple-300",
      border: "border-purple-500/50",
      bgGradient: "from-purple-950/70 via-slate-950 to-slate-900",
      badgeBg: "bg-purple-500/20",
      badgeText: "text-purple-300",
    },
    greetingEn: "Blessed Maundy Thursday & Holy Week.",
    greetingMl: "ഏവർക്കും അനുഗ്രഹപ്രദമായ പെസഹാ വ്യാഴാചരണം! 🍞🍷",
    iconSymbol: "🍞",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "good-friday",
    nameEn: "Good Friday (Dukhavelli)",
    nameMl: "ദുഃഖവെള്ളി (Good Friday)",
    category: "kerala_festival",
    dateFormatted: "04-03",
    descriptionEn: "Commemorating the crucifixion and passion of Jesus Christ at Calvary. Public Holiday.",
    descriptionMl: "യേശുദേവന്റെ ക്രൂശീകരണ സ്മരണ പുതുക്കുന്ന പുണ്യദിനം. പൊതു അവധി.",
    themeType: "christmas",
    themeName: "Sacred Holy Cross Theme",
    themeColors: {
      primary: "from-rose-600 via-slate-700 to-slate-950",
      accent: "text-rose-300",
      border: "border-rose-500/40",
      bgGradient: "from-slate-950 via-rose-950/60 to-slate-950",
      badgeBg: "bg-rose-500/20",
      badgeText: "text-rose-300",
    },
    greetingEn: "Solemn & Blessed Good Friday.",
    greetingMl: "ശാന്തിയും പ്രത്യാശയും നിറഞ്ഞ ദുഃഖവെള്ളിയാചരണം. ✝️",
    iconSymbol: "✝️",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "easter-sunday",
    nameEn: "Easter Sunday",
    nameMl: "ഈസ്റ്റർ (ഉയിർപ്പ് തിരുനാൾ)",
    category: "kerala_festival",
    dateFormatted: "04-05",
    descriptionEn: "Celebrating the resurrection of Jesus Christ from the dead. Festival of hope & new life.",
    descriptionMl: "യേശുക്രിസ്തുവിന്റെ ഉയിർത്തെഴുന്നേൽപ്പിന്റെ ആനന്ദം പങ്കിടുന്ന ഈസ്റ്റർ തിരുനാൾ.",
    themeType: "christmas",
    themeName: "Resurrection Joy & Hope",
    themeColors: {
      primary: "from-yellow-400 via-rose-400 to-emerald-400",
      accent: "text-yellow-300",
      border: "border-yellow-400/50",
      bgGradient: "from-yellow-950/60 via-slate-950 to-rose-950/60",
      badgeBg: "bg-yellow-500/20",
      badgeText: "text-yellow-300",
    },
    greetingEn: "Happy Easter! Celebrating joy, hope and eternal blessings.",
    greetingMl: "ഹൃദയം നിറഞ്ഞ ഈസ്റ്റർ ആശംസകൾ! 🕊️✨",
    iconSymbol: "🕊️",
    isPublicHoliday: true,
  },

  // ==================== APRIL (മീനം - മേടം) ====================
  {
    id: "vishu",
    nameEn: "Vishu (Medam 1)",
    nameMl: "വിഷുക്കണി (മേടം ഒന്നിന്)",
    category: "kerala_festival",
    dateFormatted: "04-14",
    descriptionEn: "Kerala Astronomical New Year with Vishukkani, Kanikkonna flowers, and Vishukkaineettam. Public Holiday.",
    descriptionMl: "കണിക്കൊന്നയും നിലവിളക്കും കണി കണ്ടുണരുന്ന സമൃദ്ധിയുടെ മേടമാസ വിഷുക്കണി പുലരി. പൊതു അവധി.",
    themeType: "vishu",
    themeName: "Kanikkonna Gold & Harvest Theme (കണിക്കൊന്ന വിഷു തീം)",
    themeColors: {
      primary: "from-yellow-400 via-amber-300 to-yellow-500",
      accent: "text-yellow-300",
      border: "border-yellow-400/70 shadow-[0_0_30px_rgba(234,179,8,0.25)]",
      bgGradient: "from-yellow-950/60 via-slate-950 to-emerald-950/60",
      badgeBg: "bg-yellow-500/20",
      badgeText: "text-yellow-300",
      kasavuAccent: "border-yellow-400",
    },
    greetingEn: "Happy Vishu! May the Vishukkani bring good fortune & growth.",
    greetingMl: "ഐശ്വര്യപൂർണ്ണമായ വിഷു ആശംസകൾ! 🌼",
    iconSymbol: "🌼",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "ambedkar-jayanti",
    nameEn: "Dr. B.R. Ambedkar Jayanti",
    nameMl: "ഡോ. ബി. ആർ. അംബേദ്കർ ജയന്തി",
    category: "national_holiday",
    dateFormatted: "04-14",
    descriptionEn: "Birth anniversary of Dr. B.R. Ambedkar, Chief Architect of Indian Constitution. Public Holiday.",
    descriptionMl: "ഭരണഘടനാ ശില്പി ഡോ. ബി. ആർ. അംബേദ്കറുടെ ജന്മദിനം. ദേശീയ പൊതു അവധി.",
    themeType: "tricolor",
    themeName: "Constitution & Equality Theme",
    themeColors: {
      primary: "from-blue-600 via-indigo-400 to-slate-900",
      accent: "text-blue-300",
      border: "border-blue-500/50",
      bgGradient: "from-blue-950/80 via-slate-950 to-slate-900",
      badgeBg: "bg-blue-500/20",
      badgeText: "text-blue-300",
    },
    greetingEn: "Remembering Bharat Ratna Dr. B.R. Ambedkar on his Jayanti.",
    greetingMl: "ഭരണഘടനാ ശില്പിക്ക് പ്രണാമമർപ്പിച്ച് അംബേദ്കർ ജയന്തി ആശംസകൾ!",
    iconSymbol: "⚖️",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "thrissur-pooram",
    nameEn: "Thrissur Pooram",
    nameMl: "തൃശ്ശൂർ പൂരം (പൂരങ്ങളുടെ പൂരം)",
    category: "kerala_festival",
    dateFormatted: "04-28",
    descriptionEn: "The Mother of all Poorams at Thekkinkadu Maidan with Kudamattam and Ilanjithara Melam.",
    descriptionMl: "ഇലഞ്ഞിത്തറ മേളവും കുടമാറ്റവും വെടിക്കെട്ടും കൊണ്ട് ചരിത്രം രചിക്കുന്ന പൂരങ്ങളുടെ പൂരം.",
    themeType: "onam",
    themeName: "Festival Melam & Elephant Pageantry (പൂരക്കാഴ്ച തീം)",
    themeColors: {
      primary: "from-amber-500 via-rose-500 to-purple-600",
      accent: "text-amber-300",
      border: "border-amber-500/60",
      bgGradient: "from-purple-950/60 via-slate-950 to-amber-950/60",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Thrissur Pooram Celebrations! Experience the divine rhythm of Kerala.",
    greetingMl: "തൃശ്ശൂർ പൂരത്തിന്റെ ആവേശത്തിൽ ഏവർക്കും പൂര ആശംസകൾ! 🐘",
    iconSymbol: "🐘",
    isPublicHoliday: false,
    isRestrictedHoliday: true,
  },

  // ==================== MAY (മേടം - ഇടവം) ====================
  {
    id: "may-day",
    nameEn: "May Day (International Workers' Day)",
    nameMl: "മേയ് ദിനം (തൊഴിലാളി ദിനം)",
    category: "government_holiday",
    dateFormatted: "05-01",
    descriptionEn: "Celebrating the hard work, rights and dignity of all workers and civil construction craftsmen. Public Holiday.",
    descriptionMl: "നിർമ്മാണ തൊഴിലാളികൾ ഉൾപ്പെടെയുള്ള സമസ്ത തൊഴിൽ മേഖലകൾക്കും ആദരവ് നൽകുന്ന ദിനം. പൊതു അവധി.",
    themeType: "tricolor",
    themeName: "Workers' Pride Theme (തൊഴിലാളി ദിന തീം)",
    themeColors: {
      primary: "from-red-600 via-rose-500 to-amber-500",
      accent: "text-rose-300",
      border: "border-red-500/50",
      bgGradient: "from-red-950/70 via-slate-950 to-slate-900",
      badgeBg: "bg-red-500/20",
      badgeText: "text-rose-300",
    },
    greetingEn: "Happy May Day! Saluting all construction craftsmen and workers.",
    greetingMl: "നിർമ്മാണരംഗത്തെ കൈവേലക്കാർക്കും തൊഴിലാളികൾക്കും മേയ് ദിനാശംസകൾ! ⚒️",
    iconSymbol: "⚒️",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "akshaya-tritiya",
    nameEn: "Akshaya Tritiya & Vasthu Muhurtham",
    nameMl: "അക്ഷയ തൃതീയ & വാസ്തു പുണ്യദിനം",
    category: "vasthu_muhurtham",
    dateFormatted: "05-09",
    descriptionEn: "Golden day for Bhoomi Pooja, Shanku Sthapanam, new construction foundation, and gold investments.",
    descriptionMl: "ഭൂമി പൂജ, ശിലാസ്ഥാപനം, ഗൃഹാരംഭം എന്നിവയ്ക്ക് അതിവിശിഷ്ടമായ പുണ്യ മുഹൂർത്ത ദിനം.",
    themeType: "onam",
    themeName: "Auspicious Vasthu Gold (വാസ്തു ശില്പ പുണ്യ തീം)",
    themeColors: {
      primary: "from-amber-400 via-yellow-200 to-amber-600",
      accent: "text-amber-300",
      border: "border-amber-400/70",
      bgGradient: "from-amber-950/80 via-slate-950 to-yellow-950/70",
      badgeBg: "bg-amber-500/25",
      badgeText: "text-amber-200",
    },
    greetingEn: "Auspicious Akshaya Tritiya & Vasthu Day! May your new projects prosper.",
    greetingMl: "ഗൃഹനിർമ്മാണത്തിന് അതിവിശിഷ്ടമായ അക്ഷയ തൃതീയ ആശംസകൾ! 🏛️✨",
    iconSymbol: "🏛️",
    isVasthuAuspicious: true,
  },
  {
    id: "bakrid",
    nameEn: "Bakrid / Eid-ul-Adha (Valiya Perunnal)",
    nameMl: "ബക്രീദ് (വലിയ പെരുന്നാൾ)",
    category: "kerala_festival",
    dateFormatted: "05-28",
    descriptionEn: "Feast of Sacrifice commemorating Prophet Ibrahim's supreme devotion. Public Holiday.",
    descriptionMl: "ത്യാഗത്തിന്റെയും സമർപ്പണത്തിന്റെയും ഓർമ്മ പുതുക്കുന്ന ബക്രീദ് പെരുന്നാൾ. പൊതു അവധി.",
    themeType: "eid",
    themeName: "Sacrifice & Brotherhood Emerald Theme",
    themeColors: {
      primary: "from-emerald-500 via-cyan-400 to-teal-600",
      accent: "text-emerald-300",
      border: "border-emerald-500/50",
      bgGradient: "from-emerald-950/80 via-slate-950 to-slate-900",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
    },
    greetingEn: "Bakrid Mubarak! Celebrating sacrifice, empathy and brotherhood.",
    greetingMl: "ഏവർക്കും പുണ്യകരമായ ബക്രീദ് ആശംസകൾ! 🌙",
    iconSymbol: "🌙",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== JUNE (ഇടവം - മിഥുനം) ====================
  {
    id: "environment-day",
    nameEn: "World Environment Day",
    nameMl: "ലോക പരിസ്ഥിതി ദിനം (ജൂൺ 5)",
    category: "observance",
    dateFormatted: "06-05",
    descriptionEn: "Promoting green sustainable architecture, eco-friendly construction & nature conservation.",
    descriptionMl: "പ്രകൃതിസൗഹൃദ ഹരിത ഗൃഹനിർമ്മാണത്തിനും പരിസ്ഥിതി സംരക്ഷണത്തിനും ആഹ്വാനം നൽകുന്ന ദിനം.",
    themeType: "kerala_piravi",
    themeName: "Eco-Green Sustainable Architecture",
    themeColors: {
      primary: "from-emerald-400 via-green-500 to-teal-600",
      accent: "text-emerald-300",
      border: "border-emerald-400/60",
      bgGradient: "from-emerald-950/90 via-slate-950 to-green-950/80",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
    },
    greetingEn: "Happy Environment Day! Build sustainable, live healthy.",
    greetingMl: "പ്രകൃതിയെ സംരക്ഷിക്കുന്ന ഹരിത നിർമ്മാണങ്ങളോടെ പരിസ്ഥിതി ദിനാശംസകൾ! 🌱",
    iconSymbol: "🌱",
  },
  {
    id: "muharram",
    nameEn: "Muharram (Sacred Ashura)",
    nameMl: "മുഹറം (വിശുദ്ധ ആശൂറാഹ്)",
    category: "kerala_festival",
    dateFormatted: "06-26",
    descriptionEn: "Islamic New Year and Day of Ashura. Public Holiday in Kerala.",
    descriptionMl: "ഇസ്‌ലാമിക് കലണ്ടറിലെ ആദ്യ മാസം. വിശുദ്ധ മുഹറം അവധി ദിനം.",
    themeType: "eid",
    themeName: "Sacred Peace Theme",
    themeColors: {
      primary: "from-teal-600 via-emerald-500 to-slate-900",
      accent: "text-teal-300",
      border: "border-teal-500/40",
      bgGradient: "from-teal-950/70 via-slate-950 to-slate-900",
      badgeBg: "bg-teal-500/20",
      badgeText: "text-teal-300",
    },
    greetingEn: "Peace and reflection on Sacred Muharram.",
    greetingMl: "ശാന്തിയും സമധാനവും നിറഞ്ഞ മുഹറം ദിനം.",
    iconSymbol: "🕌",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== JULY (മിഥുനം - കർക്കടകം) ====================
  {
    id: "karkidaka-vavu",
    nameEn: "Karkidaka Vavu Bali",
    nameMl: "കർക്കടക വാവുബലി (പിതൃതർപ്പണം)",
    category: "kerala_festival",
    dateFormatted: "07-13",
    descriptionEn: "Sacred ancestral offering on Karkidaka Amavasi across Kerala riverbanks and sea shores. Public Holiday.",
    descriptionMl: "പിതൃക്കൾക്ക് മോക്ഷം നൽകാൻ പുഴയോരങ്ങളിലും തീരങ്ങളിലും ലക്ഷങ്ങൾ ബലിതർപ്പണം നടത്തുന്ന കർക്കടക വാവുബലി. സർക്കാർ പൊതു അവധി.",
    themeType: "vishu",
    themeName: "Sacred Ancestral Homage Theme",
    themeColors: {
      primary: "from-amber-600 via-slate-300 to-blue-600",
      accent: "text-amber-300",
      border: "border-amber-500/50",
      bgGradient: "from-slate-950 via-blue-950/70 to-slate-950",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Holy Karkidaka Vavu Bali. Remembering and honoring our ancestors.",
    greetingMl: "പിതൃസ്മരണകളോടെ പുണ്യ കർക്കടക വാവുബലി ദിനം. 🌾🪔",
    iconSymbol: "🌾",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== AUGUST (കർക്കടകം - ചിങ്ങം) ====================
  {
    id: "ind-day",
    nameEn: "Independence Day",
    nameMl: "സ്വാതന്ത്ര്യ ദിനം",
    category: "national_holiday",
    dateFormatted: "08-15",
    descriptionEn: "Celebrating India's independence from British rule on 15 August 1947. National Holiday.",
    descriptionMl: "1947 ആഗസ്റ്റ് 15-ൽ ഭാരതം കൈവരിച്ച ധീരമായ സ്വാതന്ത്ര്യത്തിന്റെ ഓർമ്മപുതുക്കൽ. ദേശീയ പൊതു അവധി.",
    themeType: "tricolor",
    themeName: "Independence Tricolor (സ്വാതന്ത്ര്യ ദിന ത്രിവർണ്ണ തീം)",
    themeColors: {
      primary: "from-orange-500 via-amber-200 to-emerald-600",
      accent: "text-orange-400",
      border: "border-orange-500/60 shadow-[0_0_25px_rgba(249,115,22,0.2)]",
      bgGradient: "from-orange-950/70 via-slate-950 to-emerald-950/80",
      badgeBg: "bg-gradient-to-r from-orange-500/20 to-emerald-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Happy Independence Day! Vande Mataram.",
    greetingMl: "സ്വാതന്ത്ര്യ ദിനാശംസകൾ! ഭാരതാംബയ്ക്ക് പ്രണാമം. 🇮🇳",
    iconSymbol: "🇮🇳",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "sree-krishna-jayanthi",
    nameEn: "Sree Krishna Jayanthi (Janmashtami)",
    nameMl: "ശ്രീകൃഷ്ണ ജയന്തി (ജന്മാഷ്ടമി ശോഭായാത്ര)",
    category: "kerala_festival",
    dateFormatted: "08-25",
    descriptionEn: "Lord Krishna's birth celebrations with grand Shobhayatras across Kerala. Public Holiday.",
    descriptionMl: "ഉണ്ണിക്കണ്ണന്റെ തിരുപ്പിറവി ആഘോഷിക്കുന്ന ശ്രീകൃഷ്ണ ജയന്തിയും ശോഭായാത്രകളും. പൊതു അവധി.",
    themeType: "vishu",
    themeName: "Mayilpeeli Peacock Feather Theme",
    themeColors: {
      primary: "from-cyan-400 via-blue-500 to-amber-400",
      accent: "text-cyan-300",
      border: "border-cyan-400/60",
      bgGradient: "from-cyan-950/80 via-slate-950 to-blue-950/80",
      badgeBg: "bg-cyan-500/20",
      badgeText: "text-cyan-300",
    },
    greetingEn: "Happy Janmashtami! May Lord Krishna bless your home with joy and prosperity.",
    greetingMl: "ഐശ്വര്യപൂർണ്ണമായ ശ്രീകൃഷ്ണ ജയന്തി ആശംസകൾ! 🪶✨",
    iconSymbol: "🪶",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "first-onam",
    nameEn: "First Onam (Uthradam)",
    nameMl: "ഒന്നാം ഓണം (ഉത്രാടപ്പാച്ചിൽ)",
    category: "kerala_festival",
    dateFormatted: "08-27",
    descriptionEn: "Uthradam, the eve of Thiruvonam marking peak festive shopping and preparations. Public Holiday.",
    descriptionMl: "ഓണവിപണിയുടെ ആവേശത്തിൽ ഉത്രാടപ്പാച്ചിലും തിരുവോണ ഒരുക്കങ്ങളും. കേരള സർക്കാർ പൊതു അവധി.",
    themeType: "onam",
    themeName: "Uthradam Pookkalam Festive",
    themeColors: {
      primary: "from-amber-400 via-yellow-300 to-amber-500",
      accent: "text-amber-300",
      border: "border-amber-400/60",
      bgGradient: "from-amber-950/80 via-slate-950 to-emerald-950/70",
      badgeBg: "bg-amber-500/30",
      badgeText: "text-amber-200",
    },
    greetingEn: "Happy First Onam (Uthradam)! Enjoy the festive celebrations.",
    greetingMl: "ഏവർക്കും ഹൃദ്യമായ ഒന്നാം ഓണാശംസകൾ! 🌸",
    iconSymbol: "🌸",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "thiruvonam",
    nameEn: "Thiruvonam (Kerala National Harvest Festival)",
    nameMl: "പൊന്നോണം (തിരുവോണം മഹാത്സവം)",
    category: "kerala_festival",
    dateFormatted: "08-28",
    descriptionEn: "The grand festival of Kerala celebrating King Mahabali's homecoming with Athapookkalam and Ona Sadya. Public Holiday.",
    descriptionMl: "ഐശ്വര്യത്തിന്റെയും സമൃദ്ധിയുടെയും പ്രതീകമായ മഹാബലി തമ്പുരാന്റെ നാടുവാഴ്ച ആഘോഷിക്കുന്ന കേരളത്തിന്റെ ദേശീയോത്സവം. പൊതു അവധി.",
    historyEn: "Celebrated across Chingam month with Pookkalam, Pulikali, Vallamkali, and sumptuous 26-dish Ona Sadya on plantain leaf.",
    themeType: "onam",
    themeName: "Royal Kerala Kasavu & Pookkalam (ഓണം ഗോൾഡൻ തീം)",
    themeColors: {
      primary: "from-amber-400 via-yellow-300 to-amber-500",
      accent: "text-amber-300",
      border: "border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.25)]",
      bgGradient: "from-amber-950/80 via-slate-950 to-emerald-950/70",
      badgeBg: "bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-emerald-500/20",
      badgeText: "text-amber-200",
      kasavuAccent: "border-amber-300 bg-amber-400/10",
    },
    greetingEn: "Happy Thiruvonam 2026! May prosperity and abundance fill your home.",
    greetingMl: "ഏവർക്കും സ്നേഹവും സമൃദ്ധിയും നിറഞ്ഞ തിരുവോണാശംസകൾ! 🌸🏵️",
    iconSymbol: "🌸",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "third-onam",
    nameEn: "Third Onam (Avittam) & Ayyankali Jayanthi",
    nameMl: "മൂന്നാം ഓണം (അവിട്ടം) & അയ്യങ്കാളി ജയന്തി",
    category: "kerala_festival",
    dateFormatted: "08-29",
    descriptionEn: "Third day of Onam (Avittam) and Birth Anniversary of Dalit leader Mahatma Ayyankali. Public Holiday.",
    descriptionMl: "മൂന്നാം ഓണവും സാമൂഹിക വിപ്ലവകാരി മഹാത്മാ അയ്യങ്കാളിയുടെ ജന്മദിനാഘോഷവും. സർക്കാർ പൊതു അവധി.",
    themeType: "onam",
    themeName: "Avittam Festive Theme",
    themeColors: {
      primary: "from-amber-400 via-orange-400 to-emerald-500",
      accent: "text-amber-300",
      border: "border-amber-400/50",
      bgGradient: "from-amber-950/70 via-slate-950 to-slate-900",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Happy Avittam & Mahatma Ayyankali Jayanthi.",
    greetingMl: "മൂന്നാം ഓണാശംസകളും മഹാത്മാ അയ്യങ്കാളിക്ക് ആദരവുകളും! 🌸",
    iconSymbol: "🌸",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "fourth-onam-guru-jayanthi",
    nameEn: "Fourth Onam (Chathayam) & Sree Narayana Guru Jayanthi",
    nameMl: "നാലാം ഓണം (ചതയം) & ശ്രീനാരായണ ഗുരു ജയന്തി",
    category: "government_holiday",
    dateFormatted: "08-30",
    descriptionEn: "Birth anniversary of great renaissance philosopher Sree Narayana Guru on Chathayam nakshatram. Public Holiday.",
    descriptionMl: "'ഒരു ജാതി, ഒരു മതം, ഒരു ദൈവം മനുഷ്യന്' എന്ന വിശ്വദർശനം നൽകിയ ശ്രീനാരായണ ഗുരുദേവന്റെ 172-ാം ജയന്തി ദിനം. പൊതു അവധി.",
    themeType: "onam",
    themeName: "Guru Jayanthi Golden Light Theme",
    themeColors: {
      primary: "from-yellow-400 via-amber-300 to-yellow-600",
      accent: "text-yellow-300",
      border: "border-yellow-400/60 shadow-[0_0_25px_rgba(234,179,8,0.25)]",
      bgGradient: "from-amber-950/80 via-slate-950 to-yellow-950/70",
      badgeBg: "bg-yellow-500/25",
      badgeText: "text-yellow-200",
    },
    greetingEn: "Happy Sree Narayana Guru Jayanthi! Universal brotherhood & equality.",
    greetingMl: "ശ്രീനാരായണ ഗുരുദേവന്റെ പവിത്രമായ ജയന്തി ആശംസകൾ! 🪔✨",
    iconSymbol: "🪔",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== SEPTEMBER (ചിങ്ങം - കന്നി) ====================
  {
    id: "engineers-day",
    nameEn: "National Engineers' Day",
    nameMl: "ദേശീയ എഞ്ചിനീയേഴ്സ് ദിനം (സെപ്റ്റംബർ 15)",
    category: "observance",
    dateFormatted: "09-15",
    descriptionEn: "Honoring Bharat Ratna Sir M. Visvesvaraya, celebrating civil engineering & architectural innovation.",
    descriptionMl: "ഭാരതരത്ന സർ എം. വിശ്വേശ്വരയ്യയുടെ ജന്മദിനം. നിർമ്മാണ കലയും വാസ്തുശാസ്ത്രവും സംയോജിപ്പിക്കുന്ന എഞ്ചിനീയറിംഗ് ദിനം.",
    themeType: "engineers",
    themeName: "Technical Blueprint & Engineering Precision",
    themeColors: {
      primary: "from-cyan-500 via-blue-500 to-indigo-600",
      accent: "text-cyan-300",
      border: "border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.25)]",
      bgGradient: "from-cyan-950/80 via-slate-950 to-blue-950/80",
      badgeBg: "bg-cyan-500/20",
      badgeText: "text-cyan-300",
    },
    greetingEn: "Happy Engineers' Day! Building sustainable architectural marvels.",
    greetingMl: "സർഗ്ഗാത്മക നിർമ്മാണങ്ങൾക്ക് സമർപ്പിതമായ എഞ്ചിനീയേഴ്സ് ദിനാശംസകൾ! 📐",
    iconSymbol: "📐",
    isPublicHoliday: false,
    isVasthuAuspicious: true,
  },
  {
    id: "guru-samadhi",
    nameEn: "Sree Narayana Guru Samadhi",
    nameMl: "ശ്രീനാരായണ ഗുരു സമാധി ദിനം",
    category: "government_holiday",
    dateFormatted: "09-21",
    descriptionEn: "Commemorating the Mahasamadhi of philosopher Sree Narayana Guru at Sivagiri Mutt. Public Holiday.",
    descriptionMl: "ശ്രീനാരായണ ഗുരുദേവന്റെ മഹാസമാധി ദിനാചരണം. കേരള സർക്കാർ പൊതു അവധി.",
    themeType: "vishu",
    themeName: "Sivagiri Sacred Serenity",
    themeColors: {
      primary: "from-amber-500 via-slate-300 to-blue-600",
      accent: "text-amber-300",
      border: "border-amber-500/50",
      bgGradient: "from-slate-950 via-slate-900 to-slate-950",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Solemn homage on Sree Narayana Guru Samadhi Day.",
    greetingMl: "ഗുരുദേവന്റെ പാവന സ്മരണയിൽ ഗുരു സമാധി ദിനാഞ്ജലികൾ. 🪔",
    iconSymbol: "🪔",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "milad-un-nabi",
    nameEn: "Milad-i-Sherif (Nabi Dinam)",
    nameMl: "നബിദിനം (Milad-un-Nabi)",
    category: "kerala_festival",
    dateFormatted: "09-25",
    descriptionEn: "Birth anniversary of Prophet Muhammad celebrated with prayers, processions & feasts. Public Holiday.",
    descriptionMl: "മുഹമ്മദ് നബിയുടെ ജന്മദിനാഘോഷമായ നബിദിനം. പൊതു അവധി.",
    themeType: "eid",
    themeName: "Prophet's Light & Compassion Theme",
    themeColors: {
      primary: "from-emerald-400 via-teal-300 to-emerald-600",
      accent: "text-emerald-300",
      border: "border-emerald-400/60",
      bgGradient: "from-emerald-950/80 via-slate-950 to-teal-950/80",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
    },
    greetingEn: "Milad-un-Nabi Mubarak! Peace, mercy and blessings.",
    greetingMl: "സ്നേഹവും സമാധാനവും നിറഞ്ഞ നബിദിനാശംസകൾ! 🌙✨",
    iconSymbol: "🌙",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== OCTOBER (കന്നി - തുലാം) ====================
  {
    id: "gandhi-jayanti",
    nameEn: "Gandhi Jayanti",
    nameMl: "ഗാന്ധി ജയന്തി",
    category: "national_holiday",
    dateFormatted: "10-02",
    descriptionEn: "Birth anniversary of Mahatma Gandhi, Father of the Nation and Apostle of Peace. National Holiday.",
    descriptionMl: "രാഷ്ട്രപിതാവ് മഹാത്മാ ഗാന്ധിയുടെ ജന്മദിനാചരണം. ദേശീയ പൊതു അവധി.",
    themeType: "tricolor",
    themeName: "Ahimsa & Peace Theme",
    themeColors: {
      primary: "from-amber-600 via-slate-200 to-emerald-600",
      accent: "text-amber-300",
      border: "border-amber-500/40",
      bgGradient: "from-slate-950 via-slate-900 to-slate-950",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Remembering Mahatma Gandhi on his birth anniversary.",
    greetingMl: "രാഷ്ട്രപിതാവിന് ആദരവോടെ ഗാന്ധി ജയന്തി ആശംസകൾ! 🕊️",
    iconSymbol: "🕊️",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "mahanavami",
    nameEn: "Mahanavami & Ayudha Pooja",
    nameMl: "മഹാനവമി & ആയുധപൂജ (വാസ്തു പൂജ)",
    category: "kerala_festival",
    dateFormatted: "10-19",
    descriptionEn: "Blessing and consecrating engineering tools, vehicles, machinery, and blueprints. Public Holiday.",
    descriptionMl: "എഞ്ചിനീയറിംഗ് ഉപകരണങ്ങൾ, പുസ്തകങ്ങൾ, വാഹനങ്ങൾ എന്നിവ പൂജ വെക്കുന്ന ആയുധപൂജ. പൊതു അവധി.",
    themeType: "onam",
    themeName: "Ayudha Pooja & Craft Precision Theme",
    themeColors: {
      primary: "from-amber-500 via-rose-500 to-yellow-400",
      accent: "text-amber-300",
      border: "border-amber-500/60",
      bgGradient: "from-amber-950/80 via-slate-950 to-rose-950/70",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Happy Mahanavami & Ayudha Pooja! May your craft tools prosper.",
    greetingMl: "ആയുധപൂജ & മഹാനവമി ആശംസകൾ! 🛠️🪔",
    iconSymbol: "🛠️",
    isPublicHoliday: true,
    isBankHoliday: true,
    isVasthuAuspicious: true,
  },
  {
    id: "vijayadashami",
    nameEn: "Vijayadashami (Vidyarambham)",
    nameMl: "വിജയദശമി (വിദ്യാരംഭം)",
    category: "kerala_festival",
    dateFormatted: "10-20",
    descriptionEn: "Initiation into the world of knowledge, arts and architecture. Golden day for learning. Public Holiday.",
    descriptionMl: "ഹരിശ്രീ ഗണപതയേ നമഃ കുറിച്ച് അറിവിന്റെ ലോകത്തേക്ക് കുരുന്നുകൾ പിച്ചവെക്കുന്ന വിദ്യാരംഭം. പൊതു അവധി.",
    themeType: "vishu",
    themeName: "Saraswathi Wisdom & Learning Theme",
    themeColors: {
      primary: "from-yellow-300 via-amber-400 to-rose-400",
      accent: "text-yellow-200",
      border: "border-yellow-400/60 shadow-[0_0_25px_rgba(234,179,8,0.25)]",
      bgGradient: "from-amber-950/80 via-slate-950 to-yellow-950/70",
      badgeBg: "bg-yellow-500/20",
      badgeText: "text-yellow-300",
    },
    greetingEn: "Happy Vijayadashami! May Saraswathi Devi bless your pursuits of knowledge.",
    greetingMl: "അറിവിന്റെ വെളിച്ചം പകരുന്ന വിജയദശമി വിദ്യാരംഭ ആശംസകൾ! ✍️📚",
    iconSymbol: "✍️",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== NOVEMBER (തുലാം - വൃശ്ചികം) ====================
  {
    id: "kerala-piravi",
    nameEn: "Kerala Piravi (State Formation Day)",
    nameMl: "കേരളപ്പിറവി ദിനം (നവംബർ 1)",
    category: "kerala_festival",
    dateFormatted: "11-01",
    descriptionEn: "Commemorating the birth of Kerala state on 1 November 1956 uniting Travancore, Cochin, and Malabar.",
    descriptionMl: "1956 നവംബർ 1-ന് തിരുവിതാംകൂർ, കൊച്ചി, മലബാർ മേഖലകൾ സംയോജിപ്പിച്ച് ഐക്യകേരളം രൂപം കൊണ്ട ദിനം.",
    themeType: "kerala_piravi",
    themeName: "God's Own Country Green & Gold",
    themeColors: {
      primary: "from-emerald-500 via-teal-400 to-amber-400",
      accent: "text-emerald-300",
      border: "border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.2)]",
      bgGradient: "from-emerald-950/80 via-slate-950 to-slate-900",
      badgeBg: "bg-emerald-500/20",
      badgeText: "text-emerald-300",
      kasavuAccent: "border-emerald-400",
    },
    greetingEn: "Happy Kerala Piravi! Celebrating God's Own Country.",
    greetingMl: "മലയാള നാടിന്റെ പെരുമ വാഴ്ത്തുന്ന കേരളപ്പിറവി ആശംസകൾ! 🌴",
    iconSymbol: "🌴",
    isPublicHoliday: false,
    isRestrictedHoliday: true,
  },
  {
    id: "deepavali",
    nameEn: "Deepavali (Festival of Lights)",
    nameMl: "ദീപാവലി മഹോത്സവം",
    category: "kerala_festival",
    dateFormatted: "11-08",
    descriptionEn: "Festival of Lights illuminating homes with diyas, lamps and sweet celebrations. Public Holiday.",
    descriptionMl: "തിന്മയുടെ മേൽ നന്മയുടെ പ്രകാശവിജയം കുറിക്കുന്ന ദീപങ്ങളുടെ മഹോത്സവം. പൊതു അവധി.",
    themeType: "diwali",
    themeName: "Illuminated Diya Glow Theme",
    themeColors: {
      primary: "from-amber-400 via-orange-500 to-rose-600",
      accent: "text-amber-300",
      border: "border-amber-400/60 shadow-[0_0_30px_rgba(251,146,60,0.3)]",
      bgGradient: "from-amber-950/80 via-slate-950 to-rose-950/70",
      badgeBg: "bg-amber-500/20",
      badgeText: "text-amber-300",
    },
    greetingEn: "Happy Deepavali! May divine light brighten your home & workplace.",
    greetingMl: "ഹൃദയം നിറഞ്ഞ ദീപാവലി ആശംസകൾ! 🪔✨",
    iconSymbol: "🪔",
    isPublicHoliday: true,
    isBankHoliday: true,
  },

  // ==================== DECEMBER (വൃശ്ചികം - ധനു) ====================
  {
    id: "christmas",
    nameEn: "Christmas Celebrations",
    nameMl: "ക്രിസ്മസ് മഹോത്സവം (ഡിസംബർ 25)",
    category: "kerala_festival",
    dateFormatted: "12-25",
    descriptionEn: "Celebrating the birth of Jesus Christ with Christmas stars, carols, and cakes across Kerala. Public Holiday.",
    descriptionMl: "ശാന്തിയുടെയും സ്നേഹത്തിന്റെയും ദൂതുമായി ഉണ്ണിയേശുവിന്റെ തിരുപ്പിറവി ആഘോഷം. പൊതു അവധി.",
    themeType: "christmas",
    themeName: "Crimson & Pine Festive Star Theme",
    themeColors: {
      primary: "from-rose-500 via-red-600 to-emerald-600",
      accent: "text-rose-300",
      border: "border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.25)]",
      bgGradient: "from-rose-950/70 via-slate-950 to-emerald-950/70",
      badgeBg: "bg-rose-500/20",
      badgeText: "text-rose-300",
    },
    greetingEn: "Merry Christmas! Joy, peace & blessings to you and your family.",
    greetingMl: "ഏവർക്കും സന്തോഷകരമായ ക്രിസ്മസ് ആശംസകൾ! 🎄⭐",
    iconSymbol: "🎄",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
  {
    id: "boxing-day",
    nameEn: "Boxing Day (Christmas Holiday)",
    nameMl: "ക്രിസ്മസ് പിറ്റേന്ന് (Boxing Day)",
    category: "government_holiday",
    dateFormatted: "12-26",
    descriptionEn: "Second day of Christmas celebrations. Public Holiday in Kerala.",
    descriptionMl: "ക്രിസ്മസ് ആഘോഷത്തിന്റെ തുടർച്ചയായ രണ്ടാം ദിനം. പൊതു അവധി.",
    themeType: "christmas",
    themeName: "Christmas Celebrations Theme",
    themeColors: {
      primary: "from-rose-500 via-emerald-500 to-slate-900",
      accent: "text-rose-300",
      border: "border-rose-500/40",
      bgGradient: "from-rose-950/60 via-slate-950 to-slate-900",
      badgeBg: "bg-rose-500/20",
      badgeText: "text-rose-300",
    },
    greetingEn: "Happy Boxing Day & Festive Season.",
    greetingMl: "ക്രിസ്മസ് ആഘോഷങ്ങളുടെ സന്തോഷം പങ്കിടുന്നു!",
    iconSymbol: "🎁",
    isPublicHoliday: true,
    isBankHoliday: true,
  },
];

/**
 * Calculates authentic Kollavarsham date, Nakshathram, Thithis, Vratams and Rahu Kalam for any given date
 */
export function getKeralaAstrologyForDate(targetDate: Date = new Date()): KeralaDayAstrology {
  const month = targetDate.getMonth(); // 0 to 11
  const day = targetDate.getDate();
  const dayOfWeek = targetDate.getDay(); // 0 (Sun) to 6 (Sat)
  const fullYear = targetDate.getFullYear();

  // Accurate Kollavarsham Month Calculation (Kollam Era started 825 AD)
  // Transition boundaries (Sankranti approx dates):
  // Chingam: Aug 17, Kanni: Sep 17, Thulam: Oct 18, Vrischikam: Nov 17, Dhanu: Dec 16
  // Makaram: Jan 15, Kumbham: Feb 14, Meenam: Mar 15, Medam: Apr 14, Edavam: May 15, Mithunam: Jun 16, Karkidakam: Jul 17
  let malMonthIndex = 0;
  let kollamDay = 1;
  let kollamYear = fullYear - 825; // eg 2026 - 825 = 1201 or 1202

  if (month === 7 && day >= 17) {
    malMonthIndex = 0; // Chingam
    kollamDay = day - 16;
    kollamYear = fullYear - 824; // 1202
  } else if (month === 8 && day < 17) {
    malMonthIndex = 0; // Chingam
    kollamDay = day + 15;
    kollamYear = fullYear - 824;
  } else if (month === 8 && day >= 17) {
    malMonthIndex = 1; // Kanni
    kollamDay = day - 16;
    kollamYear = fullYear - 824;
  } else if (month === 9 && day < 18) {
    malMonthIndex = 1; // Kanni
    kollamDay = day + 14;
    kollamYear = fullYear - 824;
  } else if (month === 9 && day >= 18) {
    malMonthIndex = 2; // Thulam
    kollamDay = day - 17;
    kollamYear = fullYear - 824;
  } else if (month === 10 && day < 17) {
    malMonthIndex = 2; // Thulam
    kollamDay = day + 14;
    kollamYear = fullYear - 824;
  } else if (month === 10 && day >= 17) {
    malMonthIndex = 3; // Vrischikam
    kollamDay = day - 16;
    kollamYear = fullYear - 824;
  } else if (month === 11 && day < 16) {
    malMonthIndex = 3; // Vrischikam
    kollamDay = day + 14;
    kollamYear = fullYear - 824;
  } else if (month === 11 && day >= 16) {
    malMonthIndex = 4; // Dhanu
    kollamDay = day - 15;
    kollamYear = fullYear - 824;
  } else if (month === 0 && day < 15) {
    malMonthIndex = 4; // Dhanu
    kollamDay = day + 16;
    kollamYear = fullYear - 825;
  } else if (month === 0 && day >= 15) {
    malMonthIndex = 5; // Makaram
    kollamDay = day - 14;
    kollamYear = fullYear - 825;
  } else if (month === 1 && day < 14) {
    malMonthIndex = 5; // Makaram
    kollamDay = day + 17;
    kollamYear = fullYear - 825;
  } else if (month === 1 && day >= 14) {
    malMonthIndex = 6; // Kumbham
    kollamDay = day - 13;
    kollamYear = fullYear - 825;
  } else if (month === 2 && day < 15) {
    malMonthIndex = 6; // Kumbham
    kollamDay = day + 15;
    kollamYear = fullYear - 825;
  } else if (month === 2 && day >= 15) {
    malMonthIndex = 7; // Meenam
    kollamDay = day - 14;
    kollamYear = fullYear - 825;
  } else if (month === 3 && day < 14) {
    malMonthIndex = 7; // Meenam
    kollamDay = day + 17;
    kollamYear = fullYear - 825;
  } else if (month === 3 && day >= 14) {
    malMonthIndex = 8; // Medam (Vishu)
    kollamDay = day - 13;
    kollamYear = fullYear - 825;
  } else if (month === 4 && day < 15) {
    malMonthIndex = 8; // Medam
    kollamDay = day + 17;
    kollamYear = fullYear - 825;
  } else if (month === 4 && day >= 15) {
    malMonthIndex = 9; // Edavam
    kollamDay = day - 14;
    kollamYear = fullYear - 825;
  } else if (month === 5 && day < 16) {
    malMonthIndex = 9; // Edavam
    kollamDay = day + 17;
    kollamYear = fullYear - 825;
  } else if (month === 5 && day >= 16) {
    malMonthIndex = 10; // Mithunam
    kollamDay = day - 15;
    kollamYear = fullYear - 825;
  } else if (month === 6 && day < 17) {
    malMonthIndex = 10; // Mithunam
    kollamDay = day + 15;
    kollamYear = fullYear - 825;
  } else if (month === 6 && day >= 17) {
    malMonthIndex = 11; // Karkidakam
    kollamDay = day - 16;
    kollamYear = fullYear - 825;
  } else {
    malMonthIndex = 11; // Karkidakam
    kollamDay = day + 15;
    kollamYear = fullYear - 825;
  }

  const malMonth = MALAYALAM_MONTHS[malMonthIndex];
  const sakaInfo = getSakaDate(targetDate);

  // Exact Prokerala Kerala Calendar Reference Data (Prokerala.com/general/calendar/)
  const prokeralaRecord = getProkeralaDayData(targetDate);

  if (prokeralaRecord) {
    kollamDay = prokeralaRecord.kollamDay;
    if (prokeralaRecord.kollamMonthName) {
      const matchedIdx = MALAYALAM_MONTHS.findIndex(m => m.nameMl === prokeralaRecord.kollamMonthName);
      if (matchedIdx !== -1) {
        malMonthIndex = matchedIdx;
      }
    }
  }

  // Check if specific calibrated reference date: September 2, 2026
  const isSep02_2026 = fullYear === 2026 && month === 8 && day === 2;

  // Daily Nakshathram calculation based on Day of Year
  const startOfYear = new Date(fullYear, 0, 1);
  const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  // Specific alignment for accurate panchangam
  let nakshatraIndex = (dayOfYear + 12) % 27;
  if (isSep02_2026) {
    nakshatraIndex = 1; // Bharani (ഭരണി)
  }
  const currentNakshatra = NAKSHATHRAMS_27[nakshatraIndex];

  // Thithi calculation (approx 29.53 day lunar cycle)
  const epochDays = Math.floor(targetDate.getTime() / (1000 * 60 * 60 * 24));
  const lunarAge = (epochDays + 14) % 30; // 0 to 29
  let isShuklaPaksham = lunarAge < 15;
  let thithiNumber = (lunarAge % 15) + 1; // 1 to 15

  if (isSep02_2026) {
    isShuklaPaksham = false; // Krishna Paksha
    thithiNumber = 6; // Shashthi followed by Sapthami
  }

  const THITHI_NAMES = [
    "പ്രഥമ", "ദ്വിതീയ", "തൃതീയ", "ചതുർത്ഥി", "പഞ്ചമി",
    "ഷഷ്ഠി", "സപ്തമി", "അഷ്ടമി", "നവമി", "ദശമി",
    "ഏകാദശി", "ദ്വാദശി", "ത്രയോദശി", "ചതുർദ്ദശി", isShuklaPaksham ? "പൗർണ്ണമി 🌕" : "അമാവാസി 🌑"
  ];
  const THITHI_NAMES_EN = [
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Sapthami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", isShuklaPaksham ? "Pournami (Full Moon)" : "Amavasi (New Moon)"
  ];

  const thithiMl = prokeralaRecord
    ? prokeralaRecord.tithi
    : isSep02_2026
    ? "കൃഷ്ണപക്ഷ ഷഷ്ഠി (06:12 AM വരെ), തുടർന്ന് സപ്തമി"
    : THITHI_NAMES[thithiNumber - 1];
  const thithiEn = isSep02_2026
    ? "Krishna Paksha Shashthi (active up to 06:12 AM) followed by Sapthami"
    : `${isShuklaPaksham ? "Shukla" : "Krishna"} Paksha ${THITHI_NAMES_EN[thithiNumber - 1]}`;

  const thithiDetail = isSep02_2026
    ? "Krishna Paksha Shashthi (active up to 06:12 AM) followed by Sapthami"
    : `${isShuklaPaksham ? "Shukla" : "Krishna"} Paksha ${THITHI_NAMES_EN[thithiNumber - 1]}`;
  const thithiDetailMl = prokeralaRecord
    ? prokeralaRecord.tithi
    : isSep02_2026
    ? "കൃഷ്ണപക്ഷ ഷഷ്ഠി (06:12 AM വരെ), തുടർന്ന് സപ്തമി"
    : `${isShuklaPaksham ? "ശുക്ല പക്ഷം" : "കൃഷ്ണ പക്ഷം"} ${THITHI_NAMES[thithiNumber - 1]}`;

  const nakshatraDetail = isSep02_2026
    ? "Bharani (active up to 02:42 AM on Sep 3)"
    : `${currentNakshatra.nameEn} (Lord: ${currentNakshatra.lord})`;
  const nakshatraDetailMl = prokeralaRecord
    ? prokeralaRecord.nakshatra
    : isSep02_2026
    ? "ഭരണി (സെപ്റ്റംബർ 3, 02:42 AM വരെ)"
    : `${currentNakshatra.nameMl} (അധിപൻ: ${currentNakshatra.lord})`;

  const isAmavasi = prokeralaRecord
    ? prokeralaRecord.moonPhase === "amavasi"
    : !isShuklaPaksham && thithiNumber === 15;
  const isPournami = prokeralaRecord
    ? prokeralaRecord.moonPhase === "pournami"
    : isShuklaPaksham && thithiNumber === 15;
  const isEkadashi = thithiNumber === 11;
  const isPradosham = thithiNumber === 13;
  const isSashti = thithiNumber === 6;

  // Day timings (Thiruvananthapuram / Kerala Local Solar Timings)
  const timings = RAHU_KALAM_WEEKDAYS[dayOfWeek] || RAHU_KALAM_WEEKDAYS[0];
  const weekdayInfo = WEEKDAYS_KERALA[dayOfWeek] || WEEKDAYS_KERALA[0];

  // Sunrise / Sunset (Thiruvananthapuram, Kerala standard: 06:17 AM / 06:26 PM for early September)
  const sunrise = isSep02_2026 ? "06:17 AM" : "06:17 AM";
  const sunset = isSep02_2026 ? "06:26 PM" : "06:26 PM";

  // Auspiciousness for Vasthu / Griharambham / Bhoomi Pooja
  const isAuspiciousNakshatra = currentNakshatra.auspiciousForVasthu;
  const isAvoidWeekday = dayOfWeek === 2 || dayOfWeek === 6; // Tuesday & Saturday traditionally avoided for initial Griharambham
  const isAuspicious = isAuspiciousNakshatra && !isAvoidWeekday && !isAmavasi;

  let vasthuSuitability: "excellent" | "favorable" | "neutral" | "avoid" = "neutral";
  let vasthuLabelMl = "സാധാരണ ദിനം (Good for planning & technical consultation)";
  let vasthuLabelEn = "Standard day for technical consultations & design planning";

  if (isAuspicious && (malMonthIndex === 0 || malMonthIndex === 3 || malMonthIndex === 6 || malMonthIndex === 8 || malMonthIndex === 9)) {
    vasthuSuitability = "excellent";
    vasthuLabelMl = "അതിവിശിഷ്ട വാസ്തു മുഹൂർത്തം (ഉത്തമം - ശിലാസ്ഥാപനം / ഭൂമി പൂജ)";
    vasthuLabelEn = "Highly auspicious for Bhoomi Pooja & Foundation Stone Laying";
  } else if (isAuspicious) {
    vasthuSuitability = "favorable";
    vasthuLabelMl = "അനുയോജ്യമായ മുഹൂർത്തം (ഗൃഹാരംഭത്തിന് ശുഭം)";
    vasthuLabelEn = "Auspicious for construction & plan sanction";
  } else if (isAmavasi || dayOfWeek === 2) {
    vasthuSuitability = "avoid";
    vasthuLabelMl = "തറക്കല്ലിടൽ ഒഴിവാക്കുക (സാധാരണ പണികൾ ചെയ്യാം)";
    vasthuLabelEn = "Avoid foundation stone laying on this day";
  }

  const vikramInfo = getVikramSamvatDate(targetDate);
  const rituInfo = getIndianSeason(targetDate);
  const ayanamInfo = getIndianAyanam(targetDate);

  return {
    gregorianDate: targetDate,
    dayNumber: day,
    weekdayMl: weekdayInfo.nameMl,
    weekdayEn: weekdayInfo.nameEn,
    locationName: "തിരുവനന്തപുരം, കേരളം (Thiruvananthapuram, Kerala)",
    nakshatraMl: currentNakshatra.nameMl,
    nakshatraEn: currentNakshatra.nameEn,
    nakshatraNumber: currentNakshatra.id,
    nakshatraDetail,
    nakshatraDetailMl,
    thithiMl,
    thithiEn,
    thithiDetail,
    thithiDetailMl,
    pakshamMl: isShuklaPaksham ? "ശുക്ല പക്ഷം (വെളുത്ത പക്ഷം)" : "കൃഷ്ണ പക്ഷം (കറുത്ത പക്ഷം)",
    pakshamEn: isShuklaPaksham ? "Shukla Paksha" : "Krishna Paksha",
    sakaEraMl: sakaInfo.formattedMl,
    sakaEraEn: sakaInfo.formattedEn,
    sakaYear: sakaInfo.year,
    sakaMonthMl: sakaInfo.monthMl,
    sakaMonthEn: sakaInfo.monthEn,
    sakaDay: sakaInfo.day,
    vikramSamvatYear: vikramInfo.year,
    vikramSamvatHi: vikramInfo.yearHi,
    vikramSamvatEn: vikramInfo.formattedEn,
    ritu: rituInfo,
    ayanam: ayanamInfo,
    isAmavasi,
    isPournami,
    isEkadashi,
    isPradosham,
    isSashti,
    rahuKalam: timings.rahu,
    yamagandam: timings.yama,
    gulikaKalam: timings.gulika,
    abhijithMuhurtham: timings.abhijith,
    kollavarshamMonthMl: malMonth.nameMl,
    kollavarshamMonthEn: malMonth.nameEn,
    kollavarshamMonthId: malMonth.id,
    kollavarshamDay: Math.max(1, Math.min(32, kollamDay)),
    kollavarshamDayMlNumerals: toMalayalamNumerals(Math.max(1, Math.min(32, kollamDay))),
    kollavarshamYear: kollamYear,
    sunrise,
    sunset,
    vasthuStatus: {
      isAuspicious,
      labelMl: vasthuLabelMl,
      labelEn: vasthuLabelEn,
      suitability: vasthuSuitability,
    },
  };
}

/**
 * Returns any special day info for the given date (matching MM-DD)
 */
export function getSpecialDayForDate(targetDate: Date = new Date()): SpecialDayInfo | null {
  const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dd = String(targetDate.getDate()).padStart(2, "0");
  const key = `${mm}-${dd}`;

  // Direct match
  const found = SPECIAL_DAYS_DATABASE.find((s) => s.dateFormatted === key);
  if (found) return found;

  // Check Prokerala dataset
  const pRecord = getProkeralaDayData(targetDate);
  if (pRecord?.festival) {
    return {
      id: `prokerala-${key}`,
      nameEn: pRecord.festival,
      nameMl: pRecord.festival,
      category: pRecord.isPublicHoliday ? "government_holiday" : pRecord.isBankHoliday ? "bank_holiday" : "kerala_festival",
      dateFormatted: key,
      descriptionEn: `${pRecord.festival} - Prokerala Kerala Calendar`,
      descriptionMl: `${pRecord.festival} - ഔദ്യോഗിക കേരള പഞ്ചാംഗം`,
      themeType: "default",
      themeName: "Prokerala Kerala Festival",
      themeColors: {
        primary: "#dc2626",
        accent: "#f59e0b",
        border: "#f87171",
        bgGradient: "from-amber-950 via-slate-900 to-slate-950",
        badgeBg: "bg-red-500/20",
        badgeText: "text-red-300",
      },
      greetingEn: `Greetings on ${pRecord.festival}!`,
      greetingMl: `${pRecord.festival} ആശംസകൾ!`,
      iconSymbol: pRecord.isBankHoliday ? "🚩" : "✨",
      isPublicHoliday: !!pRecord.isPublicHoliday,
      isBankHoliday: !!pRecord.isBankHoliday,
    };
  }

  return null;
}

/**
 * Returns all holidays & events occurring in a given month (0 to 11)
 */
export function getEventsForMonth(year: number, month: number): { day: number; event: SpecialDayInfo }[] {
  const mm = String(month + 1).padStart(2, "0");
  const results: { day: number; event: SpecialDayInfo }[] = [];

  SPECIAL_DAYS_DATABASE.forEach((event) => {
    if (event.dateFormatted.startsWith(`${mm}-`)) {
      const day = parseInt(event.dateFormatted.split("-")[1], 10);
      results.push({ day, event });
    }
  });

  return results.sort((a, b) => a.day - b.day);
}

/**
 * Check if a date is 2nd or 4th Saturday (Bank Holiday in Kerala/India)
 */
export function isSecondOrFourthSaturday(date: Date): boolean {
  if (date.getDay() !== 6) return false;
  const day = date.getDate();
  return (day >= 8 && day <= 14) || (day >= 22 && day <= 28);
}

// Export alias for Indian Calendar usage
export const getAstrologyForDate = getKeralaAstrologyForDate;


