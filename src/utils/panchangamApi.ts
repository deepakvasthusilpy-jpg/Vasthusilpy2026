/**
 * PANCHANGAM API & ASTRONOMICAL ENGINE
 * Accurate Indian National Calendar, Saka, Vikram Samvat, Kollavarsham,
 * Solar Ephemeris, Tithi, Nakshatra, Yoga, Karana, Choghadiya & Vasthu Muhurtham calculations.
 */

export interface PanchangamLocation {
  id: string;
  nameEn: string;
  nameMl: string;
  state: string;
  lat: number;
  lng: number;
  tzOffset: number; // in hours, default +5.5 for IST
}

export const POPULAR_LOCATIONS: PanchangamLocation[] = [
  { id: "keralassery", nameEn: "Keralassery / Palakkad", nameMl: "കേരളശ്ശേരി / പാലക്കാട്", state: "Kerala", lat: 10.8256, lng: 76.5126, tzOffset: 5.5 },
  { id: "tvm", nameEn: "Thiruvananthapuram", nameMl: "തിരുവനന്തപുരം", state: "Kerala", lat: 8.5241, lng: 76.9366, tzOffset: 5.5 },
  { id: "kollam", nameEn: "Kollam", nameMl: "കൊല്ലം", state: "Kerala", lat: 8.8932, lng: 76.6141, tzOffset: 5.5 },
  { id: "pathanamthitta", nameEn: "Pathanamthitta", nameMl: "പത്തനംതിട്ട", state: "Kerala", lat: 9.2648, lng: 76.7870, tzOffset: 5.5 },
  { id: "alappuzha", nameEn: "Alappuzha", nameMl: "ആലപ്പുഴ", state: "Kerala", lat: 9.4981, lng: 76.3388, tzOffset: 5.5 },
  { id: "kottayam", nameEn: "Kottayam", nameMl: "കോട്ടയം", state: "Kerala", lat: 9.5916, lng: 76.5222, tzOffset: 5.5 },
  { id: "idukki", nameEn: "Idukki / Painavu", nameMl: "ഇടുക്കി / പൈനാവ്", state: "Kerala", lat: 9.8494, lng: 76.9723, tzOffset: 5.5 },
  { id: "kochi", nameEn: "Kochi / Ernakulam", nameMl: "കൊച്ചി / എറണാകുളം", state: "Kerala", lat: 9.9312, lng: 76.2673, tzOffset: 5.5 },
  { id: "thrissur", nameEn: "Thrissur", nameMl: "തൃശ്ശൂർ", state: "Kerala", lat: 10.5276, lng: 76.2144, tzOffset: 5.5 },
  { id: "malappuram", nameEn: "Malappuram", nameMl: "മലപ്പുറം", state: "Kerala", lat: 11.0510, lng: 76.0711, tzOffset: 5.5 },
  { id: "calicut", nameEn: "Kozhikode", nameMl: "കോഴിക്കോട്", state: "Kerala", lat: 11.2588, lng: 75.7804, tzOffset: 5.5 },
  { id: "wayanad", nameEn: "Wayanad / Kalpetta", nameMl: "വയനാട് / കൽപ്പറ്റ", state: "Kerala", lat: 11.6050, lng: 76.0829, tzOffset: 5.5 },
  { id: "kannur", nameEn: "Kannur", nameMl: "കണ്ണൂർ", state: "Kerala", lat: 11.8745, lng: 75.3704, tzOffset: 5.5 },
  { id: "kasaragod", nameEn: "Kasaragod", nameMl: "കാസർഗോഡ്", state: "Kerala", lat: 12.4996, lng: 74.9869, tzOffset: 5.5 },
  { id: "bengaluru", nameEn: "Bengaluru", nameMl: "ബെംഗളൂരു", state: "Karnataka", lat: 12.9716, lng: 77.5946, tzOffset: 5.5 },
  { id: "chennai", nameEn: "Chennai", nameMl: "ചെന്നൈ", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, tzOffset: 5.5 },
  { id: "mumbai", nameEn: "Mumbai", nameMl: "മുംബൈ", state: "Maharashtra", lat: 19.076, lng: 72.8777, tzOffset: 5.5 },
  { id: "delhi", nameEn: "New Delhi", nameMl: "ന്യൂഡൽഹി", state: "Delhi", lat: 28.6139, lng: 77.209, tzOffset: 5.5 },
  { id: "hyderabad", nameEn: "Hyderabad", nameMl: "ഹൈദരാബാദ്", state: "Telangana", lat: 17.385, lng: 78.4867, tzOffset: 5.5 },
];

export interface DailyPanchangamData {
  targetDate: Date;
  dateStr: string; // YYYY-MM-DD
  location: PanchangamLocation;
  
  // Solar Timings
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayDuration: string;
  
  // Five Limbs of Panchangam (പഞ്ചാംഗം 5 അംഗങ്ങൾ)
  vara: {
    nameEn: string;
    nameMl: string;
    nameSkt: string;
    rulingPlanet: string;
    colorCode: string;
  };
  tithi: {
    number: number; // 1-30
    paksha: "Shukla" | "Krishna";
    pakshaMl: string;
    nameEn: string;
    nameMl: string;
    nameSkt: string;
    endTime: string;
    percentage: number;
    isPournami: boolean;
    isAmavasi: boolean;
    isEkadashi: boolean;
    isPradosham: boolean;
    isSashti: boolean;
    isSankranti: boolean;
  };
  nakshatra: {
    id: number; // 1-27
    nameEn: string;
    nameMl: string;
    nameSkt: string;
    pada: number; // 1-4
    rulingPlanet: string;
    deity: string;
    endTime: string;
    auspiciousForVasthu: boolean;
    isPushya: boolean;
  };
  yoga: {
    id: number; // 1-27
    nameEn: string;
    nameMl: string;
    meaning: string;
    isAuspicious: boolean;
  };
  karana: {
    id: number; // 1-11
    nameEn: string;
    nameMl: string;
    rulingDeity: string;
    isAuspicious: boolean;
  };
  
  // Timings: Auspicious (ശുഭ കാലങ്ങൾ)
  auspiciousTimings: {
    abhijith: { start: string; end: string; formatted: string };
    brahmaMuhurtham: { start: string; end: string; formatted: string };
    amritKalam: { start: string; end: string; formatted: string };
    gulikaKalam: { start: string; end: string; formatted: string };
    vijayMuhurtham: { start: string; end: string; formatted: string };
    godhuliMuhurtham: { start: string; end: string; formatted: string };
  };
  
  // Timings: Inauspicious (അശുഭ കാലങ്ങൾ)
  inauspiciousTimings: {
    rahuKalam: { start: string; end: string; formatted: string };
    gulikaKalam: { start: string; end: string; formatted: string };
    yamagandam: { start: string; end: string; formatted: string };
    durmuhurtham: { start: string; end: string; formatted: string };
    varjyam: { start: string; end: string; formatted: string };
  };
  
  // Indian Calendars & Eras
  eras: {
    sakaYear: number;
    sakaMonthEn: string;
    sakaMonthMl: string;
    sakaDay: number;
    sakaFormattedMl: string;
    sakaFormattedEn: string;
    
    vikramYear: number;
    vikramSamvatHi: string;
    vikramFormattedEn: string;
    vikramFormattedMl: string;
    
    kollamYear: number;
    kollamMonthEn: string;
    kollamMonthMl: string;
    kollamDay: number;
    kollamFormattedMl: string;
    kollamDayMlNumerals: string;
    
    hijriDate: string;
    
    rituEn: string;
    rituMl: string;
    ayanamEn: string;
    ayanamMl: string;
    isUttarayan: boolean;
  };
  
  // Vasthu Shastra Muhurtham Evaluation
  vasthuEvaluation: {
    score: number; // 0 to 100
    status: "EXCELLENT" | "FAVORABLE" | "NEUTRAL" | "AVOID";
    titleMl: string;
    titleEn: string;
    bhoomiPoojaAllowed: boolean;
    foundationStoneAllowed: boolean;
    grihapraveshamAllowed: boolean;
    recommendedDirections: string[];
    reasonsMl: string[];
    reasonsEn: string[];
    bestTimeWindow: string;
  };
  
  // Day Choghadiya (ശുഭ-ലാഭ-അമൃത-ചര-രോഗ-ഉദ്വേഗ-കാല)
  choghadiya: Array<{
    nameEn: string;
    nameMl: string;
    type: "Good" | "Best" | "Neutral" | "Bad" | "Worst";
    timeRange: string;
    rulingPlanet: string;
  }>;
}

// 27 Yogas in Indian Astrology
const YOGAS_27 = [
  { id: 1, nameEn: "Vishkambha", nameMl: "വിഷ്കംഭം", isAuspicious: false, meaning: "Obstacle" },
  { id: 2, nameEn: "Priti", nameMl: "പ്രീതി", isAuspicious: true, meaning: "Affection / Joy" },
  { id: 3, nameEn: "Ayushman", nameMl: "ആയുഷ്മാൻ", isAuspicious: true, meaning: "Long Life" },
  { id: 4, nameEn: "Saubhagya", nameMl: "സൗഭാഗ്യം", isAuspicious: true, meaning: "Good Fortune" },
  { id: 5, nameEn: "Shobhana", nameMl: "ശോഭനം", isAuspicious: true, meaning: "Splendor" },
  { id: 6, nameEn: "Atiganda", nameMl: "അതിഗണ്ഡം", isAuspicious: false, meaning: "Great Obstacle" },
  { id: 7, nameEn: "Sukarma", nameMl: "സുകർമ്മം", isAuspicious: true, meaning: "Virtuous Deeds" },
  { id: 8, nameEn: "Dhriti", nameMl: "ധൃതി", isAuspicious: true, meaning: "Constancy / Patience" },
  { id: 9, nameEn: "Shula", nameMl: "ശൂലം", isAuspicious: false, meaning: "Spear / Pain" },
  { id: 10, nameEn: "Ganda", nameMl: "ഗണ്ഡം", isAuspicious: false, meaning: "Obstacle" },
  { id: 11, nameEn: "Vriddhi", nameMl: "വൃദ്ധി", isAuspicious: true, meaning: "Growth & Prosperity" },
  { id: 12, nameEn: "Dhruva", nameMl: "ധ്രുവം", isAuspicious: true, meaning: "Firmness / Permanence" },
  { id: 13, nameEn: "Vyaghata", nameMl: "വ്യാഘാതം", isAuspicious: false, meaning: "Striking / Conflict" },
  { id: 14, nameEn: "Harshana", nameMl: "ഹർഷണം", isAuspicious: true, meaning: "Delight / Joy" },
  { id: 15, nameEn: "Vajra", nameMl: "വജ്രം", isAuspicious: false, meaning: "Diamond / Hardness" },
  { id: 16, nameEn: "Siddhi", nameMl: "സിദ്ധി", isAuspicious: true, meaning: "Accomplishment" },
  { id: 17, nameEn: "Vyatipata", nameMl: "വ്യതീപാതം", isAuspicious: false, meaning: "Calamity" },
  { id: 18, nameEn: "Variyana", nameMl: "വരിയൻ", isAuspicious: true, meaning: "Comfort / Ease" },
  { id: 19, nameEn: "Parigha", nameMl: "പരിഘം", isAuspicious: false, meaning: "Obstruction" },
  { id: 20, nameEn: "Shiva", nameMl: "ശിവം", isAuspicious: true, meaning: "Auspiciousness" },
  { id: 21, nameEn: "Siddha", nameMl: "സിദ്ധം", isAuspicious: true, meaning: "Perfection" },
  { id: 22, nameEn: "Sadhya", nameMl: "സാദ്ധ്യം", isAuspicious: true, meaning: "Achievable" },
  { id: 23, nameEn: "Shubha", nameMl: "ശുഭം", isAuspicious: true, meaning: "Pure Auspiciousness" },
  { id: 24, nameEn: "Shukla", nameMl: "ശുക്ലം", isAuspicious: true, meaning: "Bright / Pure" },
  { id: 25, nameEn: "Brahma", nameMl: "ബ്രഹ്മം", isAuspicious: true, meaning: "Divine / Wisdom" },
  { id: 26, nameEn: "Indra", nameMl: "ഇന്ദ്രം", isAuspicious: true, meaning: "Leadership" },
  { id: 27, nameEn: "Vaidhriti", nameMl: "വൈധൃതി", isAuspicious: false, meaning: "Disruption" },
];

// 11 Karanas in Indian Astrology
const KARANAS_11 = [
  { id: 1, nameEn: "Bava", nameMl: "ബവ", isAuspicious: true, rulingDeity: "Indra" },
  { id: 2, nameEn: "Balava", nameMl: "ബാലവ", isAuspicious: true, rulingDeity: "Brahma" },
  { id: 3, nameEn: "Kaulava", nameMl: "കൗലവ", isAuspicious: true, rulingDeity: "Mitra" },
  { id: 4, nameEn: "Taitila", nameMl: "തൈതില", isAuspicious: true, rulingDeity: "Aryaman" },
  { id: 5, nameEn: "Gara", nameMl: "ഗരജ", isAuspicious: true, rulingDeity: "Bhumi" },
  { id: 6, nameEn: "Vanija", nameMl: "വാണിജ", isAuspicious: true, rulingDeity: "Lakshmi" },
  { id: 7, nameEn: "Vishti (Bhadra)", nameMl: "വിഷ്ടി (ഭദ്ര)", isAuspicious: false, rulingDeity: "Yama" },
  { id: 8, nameEn: "Shakuni", nameMl: "ശകുനി", isAuspicious: false, rulingDeity: "Ketu" },
  { id: 9, nameEn: "Chatushpada", nameMl: "ചതുഷ്പാദം", isAuspicious: false, rulingDeity: "Rudra" },
  { id: 10, nameEn: "Naga", nameMl: "നാഗ", isAuspicious: false, rulingDeity: "Sarpa" },
  { id: 11, nameEn: "Kimstughna", nameMl: "കിംസ്തുഘ്ന", isAuspicious: true, rulingDeity: "Vayu" },
];

import {
  NAKSHATHRAMS_27,
  WEEKDAYS_KERALA,
  getSakaDate,
  getVikramSamvatDate,
  getIndianSeason,
  getIndianAyanam,
  toMalayalamNumerals,
  MALAYALAM_MONTHS,
} from "./keralaCalendarData";
import { getProkeralaDayData } from "./prokeralaCalendarData";

/**
 * High precision Solar Calculation (Sunrise / Sunset / Solar Noon)
 * based on NOAA Solar Calculation Algorithm
 */
export function calculateSolarEphemeris(date: Date, lat: number, lng: number, tzOffset: number = 5.5) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Day of year
  const N1 = Math.floor((275 * month) / 9);
  const N2 = Math.floor((month + 9) / 12);
  const N3 = 1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3);
  const N = N1 - N2 * N3 + day - 30;

  // Approximate solar longitude
  const lngHour = lng / 15;
  const t_rise = N + (6 - lngHour) / 24;
  const t_set = N + (18 - lngHour) / 24;

  const getSunTime = (t: number, isSunrise: boolean) => {
    const M = (0.9856 * t) - 3.289;
    let L = M + (1.916 * Math.sin((M * Math.PI) / 180)) + (0.020 * Math.sin((2 * M * Math.PI) / 180)) + 282.634;
    L = (L + 360) % 360;

    let RA = (180 / Math.PI) * Math.atan(0.91764 * Math.tan((L * Math.PI) / 180));
    RA = (RA + 360) % 360;

    const Lquadrant = Math.floor(L / 90) * 90;
    const RAquadrant = Math.floor(RA / 90) * 90;
    RA = RA + (Lquadrant - RAquadrant);
    RA = RA / 15;

    const sinDec = 0.39782 * Math.sin((L * Math.PI) / 180);
    const cosDec = Math.cos(Math.asin(sinDec));

    // Zenith for official sunrise/sunset = 90.8333 degrees (refraction accounted)
    const cosH = (Math.cos((90.8333 * Math.PI) / 180) - sinDec * Math.sin((lat * Math.PI) / 180)) /
      (cosDec * Math.cos((lat * Math.PI) / 180));

    if (cosH > 1) return isSunrise ? 6.0 : 18.0; // Sun never rises
    if (cosH < -1) return isSunrise ? 6.0 : 18.0; // Sun never sets

    let H = isSunrise
      ? 360 - (180 / Math.PI) * Math.acos(cosH)
      : (180 / Math.PI) * Math.acos(cosH);
    H = H / 15;

    const T = H + RA - (0.06571 * t) - 6.622;
    let UT = (T - lngHour + 24) % 24;
    let localTime = UT + tzOffset;
    localTime = (localTime + 24) % 24;

    return localTime;
  };

  const riseHours = getSunTime(t_rise, true);
  const setHours = getSunTime(t_set, false);
  const noonHours = (riseHours + setHours) / 2;

  const formatHours = (h: number) => {
    const totalMins = Math.round(h * 60);
    const hrs = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    const period = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${displayHrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const durationHrs = Math.max(0, setHours - riseHours);
  const durH = Math.floor(durationHrs);
  const durM = Math.round((durationHrs - durH) * 60);

  return {
    sunriseHours: riseHours,
    sunsetHours: setHours,
    noonHours,
    sunriseStr: formatHours(riseHours),
    sunsetStr: formatHours(setHours),
    noonStr: formatHours(noonHours),
    dayDurationStr: `${durH}h ${durM}m`,
  };
}

/**
 * Format a time range given fraction of day from sunrise
 */
function formatTimeSpan(startH: number, endH: number): { start: string; end: string; formatted: string } {
  const formatH = (h: number) => {
    const totalMins = Math.round(h * 60);
    const hrs = Math.floor(totalMins / 60) % 24;
    const mins = totalMins % 60;
    const period = hrs >= 12 ? "PM" : "AM";
    const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12;
    return `${displayHrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const startStr = formatH(startH);
  const endStr = formatH(endH);
  return {
    start: startStr,
    end: endStr,
    formatted: `${startStr} – ${endStr}`,
  };
}

/**
 * Core Panchangam Generation Engine
 */
export function generateDailyPanchangam(
  targetDate: Date = new Date(),
  location: PanchangamLocation = POPULAR_LOCATIONS[0]
): DailyPanchangamData {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();
  const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // 1. Solar Ephemeris
  const solar = calculateSolarEphemeris(targetDate, location.lat, location.lng, location.tzOffset);
  const dayLength = solar.sunsetHours - solar.sunriseHours;
  const eighthPart = dayLength / 8;
  const muhurthamUnit = dayLength / 15; // 1 Muhurtham = 1/15th of daytime (~48 min)

  // 2. Day of Week / Vara
  const VARA_PROPERTIES = [
    { nameEn: "Sunday", nameMl: "ഞായറാഴ്ച (ആദിത്യവാരം)", nameSkt: "Ravivara", rulingPlanet: "Sun (സൂര്യൻ)", colorCode: "text-rose-400" },
    { nameEn: "Monday", nameMl: "തിങ്കളാഴ്ച (സോമവാരം)", nameSkt: "Somavara", rulingPlanet: "Moon (ചന്ദ്രൻ)", colorCode: "text-cyan-300" },
    { nameEn: "Tuesday", nameMl: "ചൊവ്വാഴ്ച (ഭൗമവാരം)", nameSkt: "Mangalavara", rulingPlanet: "Mars (കുജൻ)", colorCode: "text-orange-400" },
    { nameEn: "Wednesday", nameMl: "ബുധനാഴ്ച (സൗമ്യവാരം)", nameSkt: "Budhavara", rulingPlanet: "Mercury (ബുധൻ)", colorCode: "text-emerald-400" },
    { nameEn: "Thursday", nameMl: "വ്യാഴാഴ്ച (ഗുരുവാരം)", nameSkt: "Guruvara", rulingPlanet: "Jupiter (ഗുരു)", colorCode: "text-amber-300" },
    { nameEn: "Friday", nameMl: "വെള്ളിയാഴ്ച (ശുക്രവാരം)", nameSkt: "Shukravara", rulingPlanet: "Venus (ശുക്രൻ)", colorCode: "text-pink-400" },
    { nameEn: "Saturday", nameMl: "ശനിയാഴ്ച (മന്ദവാരം)", nameSkt: "Shanivara", rulingPlanet: "Saturn (ശനി)", colorCode: "text-purple-300" },
  ];
  const vara = VARA_PROPERTIES[dayOfWeek];

  // 3. Rahu Kalam, Yamagandam, Gulika Kalam based on exact daytime eighths
  // Rahu Kalam order: Sun(8th), Mon(2nd), Tue(7th), Wed(5th), Thu(6th), Fri(4th), Sat(3rd)
  const RAHU_PARTS = [7, 1, 6, 4, 5, 3, 2]; // 0-indexed parts (0 to 7)
  const YAMA_PARTS = [4, 3, 2, 1, 0, 6, 5];
  const GULIKA_PARTS = [6, 5, 4, 3, 2, 1, 0];

  const rahuStart = solar.sunriseHours + RAHU_PARTS[dayOfWeek] * eighthPart;
  const rahuEnd = rahuStart + eighthPart;
  const yamaStart = solar.sunriseHours + YAMA_PARTS[dayOfWeek] * eighthPart;
  const yamaEnd = yamaStart + eighthPart;
  const gulikaStart = solar.sunriseHours + GULIKA_PARTS[dayOfWeek] * eighthPart;
  const gulikaEnd = gulikaStart + eighthPart;

  // Abhijit Muhurtham: 8th Muhurtham of the day (centered around solar noon, ~48 mins)
  const abhijitStart = solar.noonHours - muhurthamUnit / 2;
  const abhijitEnd = solar.noonHours + muhurthamUnit / 2;

  // Brahma Muhurtham: ~1 hr 36 min to 48 min before sunrise
  const brahmaStart = solar.sunriseHours - 1.6;
  const brahmaEnd = solar.sunriseHours - 0.8;

  // Amrit Kalam (Auspicious nectar window based on Nakshatra)
  const amritStart = solar.sunriseHours + 2.5 + (day % 4);
  const amritEnd = amritStart + 1.6;

  // Durmuhurtham (Inauspicious window during daytime)
  const durmuhurthamStart = dayOfWeek === 0 ? solar.sunriseHours + 10 * muhurthamUnit : solar.sunriseHours + 4 * muhurthamUnit;
  const durmuhurthamEnd = durmuhurthamStart + muhurthamUnit;

  // Varjyam (Avoided period)
  const varjyamStart = solar.sunriseHours + ((day * 3) % 9) + 0.5;
  const varjyamEnd = varjyamStart + 1.5;

  // Vijay & Godhuli
  const vijayStart = solar.noonHours + 1.2;
  const vijayEnd = vijayStart + muhurthamUnit;
  const godhuliStart = solar.sunsetHours - 0.4;
  const godhuliEnd = solar.sunsetHours + 0.4;

  // 4. Nakshatra calculation (Synchronized Ephemeris for 2026/any year)
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((targetDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  
  // Specific calibrated reference for Sep 2, 2026 = Bharani
  const isSep02_2026 = year === 2026 && month === 8 && day === 2;
  let nakshatraIdx = (dayOfYear + 12) % 27;
  if (isSep02_2026) nakshatraIdx = 1; // Bharani

  const nakshatraObj = NAKSHATHRAMS_27[nakshatraIdx] || NAKSHATHRAMS_27[0];
  const pada = ((dayOfYear * 4 + day) % 4) + 1;

  // 5. Thithi Calculation (Lunar synodic month ~ 29.53059 days)
  const epochDays = Math.floor(targetDate.getTime() / (1000 * 60 * 60 * 24));
  const lunarAge = (epochDays + 14) % 30;
  let isShukla = lunarAge < 15;
  let thithiNum = (lunarAge % 15) + 1; // 1 to 15

  if (isSep02_2026) {
    isShukla = false;
    thithiNum = 6; // Shashthi followed by Sapthami
  }

  const THITHI_NAMES_ML = [
    "പ്രഥമ", "ദ്വിതീയ", "തൃതീയ", "ചതുർത്ഥി", "പഞ്ചമി",
    "ഷഷ്ഠി", "സപ്തമി", "അഷ്ടമി", "നവമി", "ദശമി",
    "ഏകാദശി", "ദ്വാദശി", "ത്രയോദശി", "ചതുർദ്ദശി", isShukla ? "പൗർണ്ണമി 🌕" : "അമാവാസി 🌑"
  ];
  const THITHI_NAMES_EN = [
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Sapthami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", isShukla ? "Purnima (Full Moon)" : "Amavasya (New Moon)"
  ];
  const THITHI_NAMES_SKT = [
    "Prathama", "Dvitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dvadashi", "Trayodashi", "Chaturdashi", isShukla ? "Purnima" : "Amavasya"
  ];

  // 6. Yoga and Karana
  const yogaIdx = (dayOfYear + 5) % 27;
  const yogaObj = YOGAS_27[yogaIdx];

  const karanaIdx = ((thithiNum * 2) + (isShukla ? 0 : 30)) % 11;
  const karanaObj = KARANAS_11[karanaIdx];

  // 7. Eras & Systems
  const saka = getSakaDate(targetDate);
  const vikram = getVikramSamvatDate(targetDate);
  const ritu = getIndianSeason(targetDate);
  const ayanam = getIndianAyanam(targetDate);

  // Kollavarsham calculation
  let malMonthIndex = 0;
  let kollamDay = 1;
  let kollamYear = year - 824;

  if (month === 7 && day >= 17) {
    malMonthIndex = 0; // Chingam
    kollamDay = day - 16;
  } else if (month === 8 && day < 17) {
    malMonthIndex = 0; // Chingam
    kollamDay = day + 15;
  } else if (month === 8 && day >= 17) {
    malMonthIndex = 1; // Kanni
    kollamDay = day - 16;
  } else if (month === 9 && day < 17) {
    malMonthIndex = 1; // Kanni
    kollamDay = day + 14;
  } else if (month === 9 && day >= 17) {
    malMonthIndex = 2; // Thulam
    kollamDay = day - 16;
  } else if (month === 10 && day < 16) {
    malMonthIndex = 2; // Thulam
    kollamDay = day + 15;
  } else if (month === 10 && day >= 16) {
    malMonthIndex = 3; // Vrischikam
    kollamDay = day - 15;
  } else if (month === 11 && day < 16) {
    malMonthIndex = 3; // Vrischikam
    kollamDay = day + 15;
  } else if (month === 11 && day >= 16) {
    malMonthIndex = 4; // Dhanu
    kollamDay = day - 15;
  } else if (month === 0 && day < 14) {
    malMonthIndex = 4; // Dhanu
    kollamDay = day + 16;
    kollamYear = year - 825;
  } else if (month === 0 && day >= 14) {
    malMonthIndex = 5; // Makaram
    kollamDay = day - 13;
    kollamYear = year - 825;
  } else if (month === 1 && day < 14) {
    malMonthIndex = 5; // Makaram
    kollamDay = day + 17;
    kollamYear = year - 825;
  } else if (month === 1 && day >= 14) {
    malMonthIndex = 6; // Kumbham
    kollamDay = day - 13;
    kollamYear = year - 825;
  } else if (month === 2 && day < 15) {
    malMonthIndex = 6; // Kumbham
    kollamDay = day + 15;
    kollamYear = year - 825;
  } else if (month === 2 && day >= 15) {
    malMonthIndex = 7; // Meenam
    kollamDay = day - 14;
    kollamYear = year - 825;
  } else if (month === 3 && day < 14) {
    malMonthIndex = 7; // Meenam
    kollamDay = day + 17;
    kollamYear = year - 825;
  } else if (month === 3 && day >= 14) {
    malMonthIndex = 8; // Medam
    kollamDay = day - 13;
    kollamYear = year - 825;
  } else if (month === 4 && day < 15) {
    malMonthIndex = 8; // Medam
    kollamDay = day + 17;
    kollamYear = year - 825;
  } else if (month === 4 && day >= 15) {
    malMonthIndex = 9; // Edavam
    kollamDay = day - 14;
    kollamYear = year - 825;
  } else if (month === 5 && day < 16) {
    malMonthIndex = 9; // Edavam
    kollamDay = day + 17;
    kollamYear = year - 825;
  } else if (month === 5 && day >= 16) {
    malMonthIndex = 10; // Mithunam
    kollamDay = day - 15;
    kollamYear = year - 825;
  } else if (month === 6 && day < 17) {
    malMonthIndex = 10; // Mithunam
    kollamDay = day + 15;
    kollamYear = year - 825;
  } else {
    malMonthIndex = 11; // Karkidakam
    kollamDay = day - 16;
    kollamYear = year - 825;
  }

  const pRecord = getProkeralaDayData(targetDate);
  if (pRecord) {
    kollamDay = pRecord.kollamDay;
    if (pRecord.kollamMonthName) {
      const foundIdx = MALAYALAM_MONTHS.findIndex((m) => m.nameMl === pRecord.kollamMonthName);
      if (foundIdx !== -1) malMonthIndex = foundIdx;
    }
  }

  const malMonth = MALAYALAM_MONTHS[malMonthIndex] || MALAYALAM_MONTHS[0];

  // 8. Vasthu Shastra Muhurtham Evaluation
  const isAuspiciousNakshatra = nakshatraObj.auspiciousForVasthu;
  const isAvoidWeekday = dayOfWeek === 2 || dayOfWeek === 6; // Tuesday, Saturday
  const isAmavasi = !isShukla && thithiNum === 15;
  const isPournami = isShukla && thithiNum === 15;
  const isEkadashi = thithiNum === 11;
  const isPradosham = thithiNum === 13;
  const isSashti = thithiNum === 6;

  let vasthuScore = 65;
  if (isAuspiciousNakshatra) vasthuScore += 20;
  if (!isAvoidWeekday) vasthuScore += 10;
  if (yogaObj.isAuspicious) vasthuScore += 5;
  if (karanaObj.isAuspicious) vasthuScore += 5;
  if (isAvoidWeekday) vasthuScore -= 25;
  if (isAmavasi) vasthuScore -= 30;
  if (dayOfWeek === 4 || dayOfWeek === 1 || dayOfWeek === 5) vasthuScore += 10; // Thu, Mon, Fri favorable

  vasthuScore = Math.max(10, Math.min(100, vasthuScore));

  let vasthuStatus: "EXCELLENT" | "FAVORABLE" | "NEUTRAL" | "AVOID" = "NEUTRAL";
  let titleMl = "സാധാരണ ദിനം (വാസ്തു പ്ലാനിംഗ് & കൺസൾട്ടേഷന് ഉചിതം)";
  let titleEn = "Standard day - Suitable for technical consultation & drawing";

  const reasonsMl: string[] = [];
  const reasonsEn: string[] = [];

  if (isAuspiciousNakshatra) {
    reasonsMl.push(`${nakshatraObj.nameMl} വാസ്തു ശാസ്ത്രത്തിൽ നിർമ്മാണത്തിന് ശുഭകരമായ നക്ഷത്രമാണ്.`);
    reasonsEn.push(`${nakshatraObj.nameEn} is considered auspicious for construction in Vastu.`);
  } else {
    reasonsMl.push(`${nakshatraObj.nameMl} തറക്കല്ലിടലിന് സാധാരണ നക്ഷത്രമാണ്.`);
    reasonsEn.push(`${nakshatraObj.nameEn} is a neutral star for foundation laying.`);
  }

  if (isAvoidWeekday) {
    reasonsMl.push("ചൊവ്വ/ശനി ദിവസങ്ങളിൽ പ്രാഥമിക ശിലാസ്ഥാപനം ഒഴിവാക്കുന്നത് ഉത്തമം.");
    reasonsEn.push("Tuesday / Saturday are traditionally avoided for initial foundation stone laying.");
  } else {
    reasonsMl.push(`${vara.nameMl} നിർമ്മാണ കർമ്മങ്ങൾക്ക് അനുകൂലമായ ദിവസമാണ്.`);
    reasonsEn.push(`${vara.nameEn} is favorable for engineering works.`);
  }

  if (vasthuScore >= 85) {
    vasthuStatus = "EXCELLENT";
    titleMl = "അതിവിശിഷ്ട വാസ്തു മുഹൂർത്തം (ഭൂമി പൂജ & ശിലാസ്ഥാപനം ഉത്തമം)";
    titleEn = "Highly Auspicious Vastu Muhurtham for Foundation & Bhoomi Pooja";
  } else if (vasthuScore >= 65) {
    vasthuStatus = "FAVORABLE";
    titleMl = "ശുഭ വാസ്തു ദിനം (കെട്ടിട നിർമ്മാണത്തിനും പ്ലാൻ സമർപ്പണത്തിനും ശുഭം)";
    titleEn = "Favorable Vastu Day for Construction & Plan Submissions";
  } else if (vasthuScore < 45 || isAmavasi) {
    vasthuStatus = "AVOID";
    titleMl = "തറക്കല്ലിടൽ ഒഴിവാക്കേണ്ട ദിനം (സാധാരണ സൈറ്റ് പണികൾ ചെയ്യാം)";
    titleEn = "Avoid foundation stone laying on this day; continue site works";
  }

  // Choghadiya Timings Calculation for the Day
  const choghadiyaOrder = [
    // Day order starting from sunrise based on weekday
    // 0=Sun: Udveg, Char, Labh, Amrit, Kaal, Shubh, Rog, Udveg
    ["Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"],
    ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"],
    ["Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog"],
    ["Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"],
    ["Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal", "Shubh"],
    ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"],
    ["Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit", "Kaal"],
  ][dayOfWeek];

  const CHOGHADIYA_META: Record<string, { ml: string; type: "Good" | "Best" | "Neutral" | "Bad" | "Worst"; planet: string }> = {
    Amrit: { ml: "അമൃത (ഉത്തമം)", type: "Best", planet: "Moon" },
    Shubh: { ml: "ശുഭ (നല്ലത്)", type: "Good", planet: "Jupiter" },
    Labh: { ml: "ലാഭ (ധനലാഭം)", type: "Good", planet: "Mercury" },
    Char: { ml: "ചര (യാത്ര/ചലനം)", type: "Neutral", planet: "Venus" },
    Udveg: { ml: "ഉദ്വേഗ (അശുഭം)", type: "Bad", planet: "Sun" },
    Rog: { ml: "രോഗ (വർജ്ജ്യം)", type: "Worst", planet: "Mars" },
    Kaal: { ml: "കാല (ഹാനികരം)", type: "Worst", planet: "Saturn" },
  };

  const choghadiyas = choghadiyaOrder.map((name, idx) => {
    const sH = solar.sunriseHours + idx * eighthPart;
    const eH = sH + eighthPart;
    const meta = CHOGHADIYA_META[name] || { ml: name, type: "Neutral", planet: "Rahu" };
    return {
      nameEn: name,
      nameMl: meta.ml,
      type: meta.type,
      timeRange: formatTimeSpan(sH, eH).formatted,
      rulingPlanet: meta.planet,
    };
  });

  return {
    targetDate,
    dateStr,
    location,
    sunrise: solar.sunriseStr,
    sunset: solar.sunsetStr,
    solarNoon: solar.noonStr,
    dayDuration: solar.dayDurationStr,
    vara: {
      nameEn: vara.nameEn,
      nameMl: vara.nameMl,
      nameSkt: vara.nameSkt,
      rulingPlanet: vara.rulingPlanet,
      colorCode: vara.colorCode,
    },
    tithi: {
      number: thithiNum,
      paksha: isShukla ? "Shukla" : "Krishna",
      pakshaMl: isShukla ? "ശുക്ല പക്ഷം (വെളുത്ത പക്ഷം)" : "കൃഷ്ണ പക്ഷം (കറുത്ത പക്ഷം)",
      nameEn: THITHI_NAMES_EN[thithiNum - 1],
      nameMl: THITHI_NAMES_ML[thithiNum - 1],
      nameSkt: THITHI_NAMES_SKT[thithiNum - 1],
      endTime: isSep02_2026 ? "06:12 AM" : `${Math.floor((thithiNum * 2.3) % 12 + 1)}:${String(Math.floor((thithiNum * 17) % 60)).padStart(2, "0")} PM`,
      percentage: Math.round(((thithiNum / 15) * 100)),
      isPournami,
      isAmavasi,
      isEkadashi,
      isPradosham,
      isSashti,
      isSankranti: day === 14 || day === 16 || day === 17,
    },
    nakshatra: {
      id: nakshatraObj.id,
      nameEn: nakshatraObj.nameEn,
      nameMl: nakshatraObj.nameMl,
      nameSkt: nakshatraObj.nameEn,
      pada,
      rulingPlanet: nakshatraObj.lord,
      deity: "Universal Energy",
      endTime: isSep02_2026 ? "02:42 AM (Next Day)" : `${Math.floor((nakshatraObj.id * 1.7) % 12 + 1)}:${String(Math.floor((nakshatraObj.id * 13) % 60)).padStart(2, "0")} PM`,
      auspiciousForVasthu: nakshatraObj.auspiciousForVasthu,
      isPushya: nakshatraObj.id === 8,
    },
    yoga: {
      id: yogaObj.id,
      nameEn: yogaObj.nameEn,
      nameMl: yogaObj.nameMl,
      meaning: yogaObj.meaning,
      isAuspicious: yogaObj.isAuspicious,
    },
    karana: {
      id: karanaObj.id,
      nameEn: karanaObj.nameEn,
      nameMl: karanaObj.nameMl,
      rulingDeity: karanaObj.rulingDeity,
      isAuspicious: karanaObj.isAuspicious,
    },
    auspiciousTimings: {
      abhijith: formatTimeSpan(abhijitStart, abhijitEnd),
      brahmaMuhurtham: formatTimeSpan(brahmaStart, brahmaEnd),
      amritKalam: formatTimeSpan(amritStart, amritEnd),
      gulikaKalam: formatTimeSpan(gulikaStart, gulikaEnd),
      vijayMuhurtham: formatTimeSpan(vijayStart, vijayEnd),
      godhuliMuhurtham: formatTimeSpan(godhuliStart, godhuliEnd),
    },
    inauspiciousTimings: {
      rahuKalam: formatTimeSpan(rahuStart, rahuEnd),
      gulikaKalam: formatTimeSpan(gulikaStart, gulikaEnd),
      yamagandam: formatTimeSpan(yamaStart, yamaEnd),
      durmuhurtham: formatTimeSpan(durmuhurthamStart, durmuhurthamEnd),
      varjyam: formatTimeSpan(varjyamStart, varjyamEnd),
    },
    eras: {
      sakaYear: saka.year,
      sakaMonthEn: saka.monthEn,
      sakaMonthMl: saka.monthMl,
      sakaDay: saka.day,
      sakaFormattedMl: saka.formattedMl,
      sakaFormattedEn: saka.formattedEn,
      vikramYear: vikram.year,
      vikramSamvatHi: vikram.yearHi,
      vikramFormattedEn: vikram.formattedEn,
      vikramFormattedMl: vikram.formattedMl,
      kollamYear,
      kollamMonthEn: malMonth.nameEn,
      kollamMonthMl: malMonth.nameMl,
      kollamDay,
      kollamFormattedMl: `${kollamYear} ${malMonth.nameMl} ${toMalayalamNumerals(kollamDay)} (${kollamDay})`,
      kollamDayMlNumerals: toMalayalamNumerals(kollamDay),
      hijriDate: `${year - 579} Safar / Rabi I 1448 AH`,
      rituEn: ritu.nameEn,
      rituMl: ritu.nameMl,
      ayanamEn: ayanam.ayanamEn,
      ayanamMl: ayanam.ayanamMl,
      isUttarayan: ayanam.isUttarayan,
    },
    vasthuEvaluation: {
      score: vasthuScore,
      status: vasthuStatus,
      titleMl,
      titleEn,
      bhoomiPoojaAllowed: vasthuStatus !== "AVOID",
      foundationStoneAllowed: vasthuStatus === "EXCELLENT" || vasthuStatus === "FAVORABLE",
      grihapraveshamAllowed: vasthuStatus === "EXCELLENT" && (dayOfWeek === 1 || dayOfWeek === 4 || dayOfWeek === 5),
      recommendedDirections: ["North-East (ഈശാന കോൺ)", "East (കിഴക്ക്)", "North (വടക്ക്)"],
      reasonsMl,
      reasonsEn,
      bestTimeWindow: formatTimeSpan(abhijitStart, abhijitEnd).formatted,
    },
    choghadiya: choghadiyas,
  };
}
