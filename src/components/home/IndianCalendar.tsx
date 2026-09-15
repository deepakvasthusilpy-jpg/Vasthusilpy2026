import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  MapPin,
  Sparkles,
  Share2,
  Copy,
  Printer,
  Compass,
  Star,
  CheckCircle2,
  Info,
  CalendarDays,
  Flame,
  Award,
  BookOpen,
  Eye,
  Building2,
  Check,
  Search,
  Filter,
  Layers,
  Flag,
} from "lucide-react";
import {
  MONTHS_CONFIG,
  WEEKDAYS_KERALA,
  MALAYALAM_MONTHS,
  SPECIAL_DAYS_DATABASE,
  SpecialDayInfo,
  KeralaDayAstrology,
  getAstrologyForDate,
  getSpecialDayForDate,
  getEventsForMonth,
  isSecondOrFourthSaturday,
  toMalayalamNumerals,
  toDevanagariNumerals,
  getSakaDate,
  getVikramSamvatDate,
  getIndianSeason,
  getIndianAyanam,
  INDIAN_RITUS,
} from "../../utils/keralaCalendarData";
import { ProkeralaKeralaCalendar } from "./ProkeralaKeralaCalendar";

interface IndianCalendarProps {
  onSelectSpecialTheme?: (specialDay: SpecialDayInfo) => void;
  selectedThemeId?: string | null;
}

type CalendarViewMode = "prokerala" | "vibrant_grid" | "national_sheet" | "saka_vikram" | "kollavarsham" | "all_festivals" | "vasthu_muhurtham";

export const IndianCalendar: React.FC<IndianCalendarProps> = ({
  onSelectSpecialTheme,
  selectedThemeId,
}) => {
  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(8); // 8 = September 2026
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 8, 2)); // Default: Sep 2, 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>("prokerala");
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [festivalSearch, setFestivalSearch] = useState<string>("");
  const [festivalCategoryFilter, setFestivalCategoryFilter] = useState<string>("all");
  const [sakaMonthSelect, setSakaMonthSelect] = useState<number>(5); // 5 = Bhadrapada

  // Current Month Info
  const currentMonthConfig = MONTHS_CONFIG[currentMonthIndex];

  // Helper: jump to today (Sep 2, 2026 calibrated reference)
  const handleJumpToToday = () => {
    const today = new Date(2026, 8, 2);
    setCurrentYear(2026);
    setCurrentMonthIndex(8);
    setSelectedDate(today);
  };

  // Compute Days for the Month Grid
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  }, [currentYear, currentMonthIndex]);

  const firstDayWeekday = useMemo(() => {
    return new Date(currentYear, currentMonthIndex, 1).getDay(); // 0 = Sunday
  }, [currentYear, currentMonthIndex]);

  // Selected Date Astrology
  const selectedAstrology = useMemo(() => {
    return getAstrologyForDate(selectedDate);
  }, [selectedDate]);

  const selectedSpecialDay = useMemo(() => {
    return getSpecialDayForDate(selectedDate);
  }, [selectedDate]);

  // Month Events
  const monthEvents = useMemo(() => {
    return getEventsForMonth(currentYear, currentMonthIndex);
  }, [currentYear, currentMonthIndex]);

  // Next / Prev Month Navigation
  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Helper to share or copy date panchangam
  const handleShareDayDetails = () => {
    const text =
      `🇮🇳 *ഭാരതീയ പഞ്ചാംഗം & കലണ്ടർ 2026 (${selectedAstrology.locationName || "Thiruvananthapuram, Kerala"})*\n\n` +
      `📅 *Gregorian Date:* ${selectedDate.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n` +
      `🇮🇳 *Saka Era / Indian Civil:* ${selectedAstrology.sakaEraEn} (${selectedAstrology.sakaEraMl})\n` +
      `👑 *Vikram Samvat:* ${selectedAstrology.vikramSamvatEn} (${selectedAstrology.vikramSamvatHi})\n` +
      `🌴 *Malayalam Era (Kollavarsham):* ${selectedAstrology.kollavarshamYear} ${selectedAstrology.kollavarshamMonthEn} ${selectedAstrology.kollavarshamDay} (${selectedAstrology.kollavarshamMonthMl} ${selectedAstrology.kollavarshamDay})\n` +
      `🌸 *Ritu & Ayanam:* ${selectedAstrology.ritu.nameEn} (${selectedAstrology.ritu.nameMl}) • ${selectedAstrology.ayanam.ayanamEn}\n` +
      `⭐ *Nakshatra:* ${selectedAstrology.nakshatraDetail || selectedAstrology.nakshatraEn}\n` +
      `🌙 *Tithi & Paksha:* ${selectedAstrology.thithiDetail || selectedAstrology.thithiEn}\n` +
      `🌅 *Sunrise / Sunset:* Sunrise at ${selectedAstrology.sunrise}, Sunset at ${selectedAstrology.sunset}\n\n` +
      `⏱️ *Inauspicious Timings (അശുഭ കാലങ്ങൾ):*\n` +
      `  • Rahu Kalam: ${selectedAstrology.rahuKalam}\n` +
      `  • Gulika Kalam: ${selectedAstrology.gulikaKalam}\n` +
      `  • Yamaganda: ${selectedAstrology.yamagandam}\n\n` +
      `🏛️ *Vasthu Muhurtham:* ${selectedAstrology.vasthuStatus.labelMl}\n` +
      (selectedSpecialDay ? `🚩 *Special Festival:* ${selectedSpecialDay.nameMl} (${selectedSpecialDay.nameEn})\n` : "") +
      `\n✨ *Vasthusilpy Engineering Studio:* Er. Deepak K. (9747995961)`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMessage("പഞ്ചാംഗ വിവരങ്ങൾ പകർത്തി! WhatsApp-ൽ പങ്കിടാം.");
      setTimeout(() => setCopiedMessage(null), 3500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered festivals list for All-India Festivals Tab
  const filteredFestivals = useMemo(() => {
    return SPECIAL_DAYS_DATABASE.filter((item) => {
      const matchesSearch =
        festivalSearch === "" ||
        item.nameEn.toLowerCase().includes(festivalSearch.toLowerCase()) ||
        item.nameMl.includes(festivalSearch) ||
        item.descriptionEn.toLowerCase().includes(festivalSearch.toLowerCase());

      const matchesCat =
        festivalCategoryFilter === "all" ||
        (festivalCategoryFilter === "national" && item.category === "national_holiday") ||
        (festivalCategoryFilter === "public_holidays" && (item.isPublicHoliday || item.category === "government_holiday")) ||
        (festivalCategoryFilter === "kerala" && item.category === "kerala_festival") ||
        (festivalCategoryFilter === "vasthu" && item.category === "vasthu_muhurtham");

      return matchesSearch && matchesCat;
    });
  }, [festivalSearch, festivalCategoryFilter]);

  // Current month active Ritu and Ayanam
  const currentMonthDate = new Date(currentYear, currentMonthIndex, 15);
  const currentRitu = getIndianSeason(currentMonthDate);
  const currentAyanam = getIndianAyanam(currentMonthDate);
  const currentSaka = getSakaDate(currentMonthDate);
  const currentVikram = getVikramSamvatDate(currentMonthDate);

  return (
    <div className="space-y-6" id="indian-calendar-root">
      {/* =========================================================================
          1. SPECTACULAR INDIAN TRICOLOR HEADER & MULTI-CALENDAR SYNC BAR
         ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
        {/* Vibrant Indian Tricolor Gradient Top Ribbon */}
        <div className="h-3 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 relative">
          <div className="absolute inset-0 bg-[radial-gradient(#000080_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />
        </div>

        <div className="p-4 sm:p-6 lg:p-7 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Title & Indian Era Branding */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border border-orange-500/40 text-orange-300 rounded-full text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Flag className="w-3.5 h-3.5 text-orange-400" />
                  <span>ഭാരതീയ കലണ്ടർ 2026</span>
                </span>
                <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-xs font-mono font-bold">
                  NATIONAL INDIAN CIVIL CALENDAR
                </span>
                <span className="px-3 py-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 rounded-full text-xs font-mono font-bold">
                  തിരുവനന്തപുരം സമയം (IST)
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-sans flex flex-wrap items-center gap-3">
                <span className="bg-gradient-to-r from-orange-400 via-amber-200 to-emerald-400 bg-clip-text text-transparent">
                  ഭാരതീയ പഞ്ചാംഗ കലണ്ടർ
                </span>
                <span className="text-slate-400 font-light text-xl sm:text-2xl">
                  • INDIAN CALENDAR
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-3xl leading-relaxed">
                ശാകവർഷം (Saka Era), വിക്രം സംവത് (Vikram Samvat), കൊല്ലവർഷം (Kolla Varsham), ഹിജ്റ വർഷം, 
                ഗ്രിഗോറിയൻ തീയതികൾ, രാഹുകാലം, നിത്യ നക്ഷത്ര-തിഥികൾ, ഭാരതീയ ഉത്സവങ്ങൾ & വാസ്തു മുഹൂർത്തങ്ങൾ.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleJumpToToday}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 shadow-lg shadow-orange-950/40 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                title="ഇന്നത്തെ ദിവസത്തിലേക്ക് പോകുക"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ഇന്ന് (TODAY)</span>
              </button>

              <button
                onClick={handleShareDayDetails}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="WhatsApp / കോപ്പി"
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>പഞ്ചാംഗം കോപ്പി</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="പ്രിന്റ് / PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>പ്രിന്റ്</span>
              </button>
            </div>
          </div>

          {/* Live Multi-Era Synchronizer Badges in Vivid Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
            {/* 1. Saka Era */}
            <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs">
              <div className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
                <span>🇮🇳 ശാകവർഷം (Saka)</span>
              </div>
              <div className="text-sm font-black text-amber-200 mt-0.5 font-sans">
                {currentSaka.year} {currentSaka.monthEn}
              </div>
              <div className="text-[10px] text-amber-400/80 font-mono">
                {currentSaka.year} {currentSaka.monthMl}
              </div>
            </div>

            {/* 2. Vikram Samvat */}
            <div className="p-2.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs">
              <div className="text-[10px] font-mono text-purple-400 font-bold uppercase flex items-center gap-1">
                <span>👑 വിക്രം സംവത് (Vikram)</span>
              </div>
              <div className="text-sm font-black text-purple-200 mt-0.5 font-sans">
                {currentVikram.year} (VS)
              </div>
              <div className="text-[10px] text-purple-400/80 font-mono">
                {currentVikram.yearHi}
              </div>
            </div>

            {/* 3. Kolla Varsham */}
            <div className="p-2.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-xs">
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                <span>🌴 കൊല്ലവർഷം (Kollam)</span>
              </div>
              <div className="text-sm font-black text-emerald-200 mt-0.5 font-sans">
                1202 ചിങ്ങം - കന്നി
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                1201–1202 ME
              </div>
            </div>

            {/* 4. Indian Season & Ayanam */}
            <div className="p-2.5 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-xs">
              <div className="text-[10px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1">
                <span>🌸 ഋതു & അയനം (Ritu)</span>
              </div>
              <div className="text-xs font-black text-rose-200 mt-0.5 font-sans truncate">
                {currentRitu.nameMl}
              </div>
              <div className="text-[10px] text-rose-400/80 font-mono truncate">
                {currentAyanam.ayanamHi} • {currentAyanam.isUttarayan ? "Uttarayan" : "Dakshinayan"}
              </div>
            </div>

            {/* 5. Islamic Hijri Era */}
            <div className="p-2.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                <span>🌙 ഹിജ്റ വർഷം (Hijri)</span>
              </div>
              <div className="text-sm font-black text-cyan-200 mt-0.5 font-sans">
                1447–1448 AH
              </div>
              <div className="text-[10px] text-cyan-400/80 font-mono">
                റബീഉൽ അവ്വൽ 1448
              </div>
            </div>
          </div>
        </div>

        {/* Copy Notification Toast */}
        {copiedMessage && (
          <div className="bg-emerald-500 text-slate-950 text-xs font-mono font-bold px-4 py-2 flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>{copiedMessage}</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          2. VIBRANT MULTI-COLOR VIEW TABS BAR
         ========================================================================= */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <button
          onClick={() => setViewMode("prokerala")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "prokerala"
              ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-md font-black ring-1 ring-amber-300"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>⭐ പ്രൊകേരള കലണ്ടർ (Prokerala Official)</span>
        </button>

        <button
          onClick={() => setViewMode("vibrant_grid")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "vibrant_grid"
              ? "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>🌈 വർണ്ണ പഞ്ചാംഗ ഗ്രിഡ് (Vibrant Grid)</span>
        </button>

        <button
          onClick={() => setViewMode("national_sheet")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "national_sheet"
              ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>🏛️ ഭാരതീയ ദേശീയ ഷീറ്റ് (National Sheet)</span>
        </button>

        <button
          onClick={() => setViewMode("saka_vikram")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "saka_vikram"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>🇮🇳 ശക & വിക്രം വർഷം (Saka & Vikram)</span>
        </button>

        <button
          onClick={() => setViewMode("kollavarsham")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "kollavarsham"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Star className="w-4 h-4" />
          <span>🌴 കൊല്ലവർഷം (Kolla Varsham)</span>
        </button>

        <button
          onClick={() => setViewMode("all_festivals")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "all_festivals"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>🎉 ഭാരതീയ ഉത്സവങ്ങൾ (All-India Festivals)</span>
        </button>

        <button
          onClick={() => setViewMode("vasthu_muhurtham")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            viewMode === "vasthu_muhurtham"
              ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 shadow-md font-black"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>🧭 വാസ്തു മുഹൂർത്തം (Vastu Muhurtham)</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW MODE 0: PROKERALA OFFICIAL KERALA CALENDAR (പ്രൊകേരള കലണ്ടർ)
         ========================================================================= */}
      {viewMode === "prokerala" && (
        <ProkeralaKeralaCalendar
          initialYear={currentYear}
          initialMonthIndex={currentMonthIndex}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setCurrentYear(d.getFullYear());
            setCurrentMonthIndex(d.getMonth());
          }}
        />
      )}

      {/* =========================================================================
          VIEW MODE 1: VIBRANT MULTI-COLOR GRID (🌈 വർണ്ണ പഞ്ചാംഗ ഗ്രിഡ്)
         ========================================================================= */}
      {viewMode === "vibrant_grid" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Interactive Grid (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Month Switcher & Title Bar */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between gap-4 shadow-xl">
              <button
                onClick={handlePrevMonth}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all cursor-pointer"
                title="മുൻ മാസം"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  {currentMonthConfig.nameMl} • {currentYear}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white font-sans">
                  {currentMonthConfig.nameEn} {currentYear}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center justify-center gap-2">
                  <span className="text-emerald-400 font-semibold">{currentMonthConfig.kollamRangeMl}</span>
                  <span>•</span>
                  <span className="text-amber-300 font-semibold">{currentSaka.monthEn} {currentSaka.year}</span>
                </div>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all cursor-pointer"
                title="അടുത്ത മാസം"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* COLORFUL WEEKDAYS HEADER BAR */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
              {/* Sunday */}
              <div className="p-2 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300">
                <div className="text-xs sm:text-sm font-black font-sans">ഞായർ</div>
                <div className="text-[10px] font-mono uppercase font-bold text-rose-400">SUN / രവി</div>
              </div>

              {/* Monday */}
              <div className="p-2 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300">
                <div className="text-xs sm:text-sm font-black font-sans">തിങ്കൾ</div>
                <div className="text-[10px] font-mono uppercase font-bold text-cyan-400">MON / സോമ</div>
              </div>

              {/* Tuesday */}
              <div className="p-2 rounded-2xl bg-orange-950/40 border border-orange-500/40 text-orange-300">
                <div className="text-xs sm:text-sm font-black font-sans">ചൊവ്വ</div>
                <div className="text-[10px] font-mono uppercase font-bold text-orange-400">TUE / മംഗള</div>
              </div>

              {/* Wednesday */}
              <div className="p-2 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                <div className="text-xs sm:text-sm font-black font-sans">ബുധൻ</div>
                <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">WED / ബുധ</div>
              </div>

              {/* Thursday */}
              <div className="p-2 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300">
                <div className="text-xs sm:text-sm font-black font-sans">വ്യാഴം</div>
                <div className="text-[10px] font-mono uppercase font-bold text-amber-400">THU / ഗുരു</div>
              </div>

              {/* Friday */}
              <div className="p-2 rounded-2xl bg-pink-950/40 border border-pink-500/40 text-pink-300">
                <div className="text-xs sm:text-sm font-black font-sans">വെള്ളി</div>
                <div className="text-[10px] font-mono uppercase font-bold text-pink-400">FRI / ശുക്ര</div>
              </div>

              {/* Saturday */}
              <div className="p-2 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-300">
                <div className="text-xs sm:text-sm font-black font-sans">ശനി</div>
                <div className="text-[10px] font-mono uppercase font-bold text-purple-400">SAT / ശനി</div>
              </div>
            </div>

            {/* COLORFUL CALENDAR MONTH CELLS */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Empty leading offset cells */}
              {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[92px] sm:min-h-[110px] rounded-2xl bg-slate-950/30 border border-slate-900 opacity-20"
                />
              ))}

              {/* Actual Calendar Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(currentYear, currentMonthIndex, dayNum);
                const dayOfWeek = cellDate.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;
                const isBankSat = isSecondOrFourthSaturday(cellDate);

                const astro = getAstrologyForDate(cellDate);
                const specialDay = getSpecialDayForDate(cellDate);
                const isHoliday = isSunday || specialDay?.isPublicHoliday;

                const isSelected =
                  selectedDate.getFullYear() === currentYear &&
                  selectedDate.getMonth() === currentMonthIndex &&
                  selectedDate.getDate() === dayNum;

                const isToday =
                  2026 === currentYear &&
                  8 === currentMonthIndex &&
                  2 === dayNum;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`min-h-[92px] sm:min-h-[112px] p-2 sm:p-2.5 rounded-2xl text-left transition-all relative flex flex-col justify-between border cursor-pointer group ${
                      isSelected
                        ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/50 shadow-xl shadow-amber-950/30"
                        : isToday
                        ? "bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/60 shadow-lg"
                        : isHoliday
                        ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-500/50"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80"
                    }`}
                  >
                    {/* Top Row: Big Gregorian Date + Malayalam/Saka Date */}
                    <div className="flex items-start justify-between gap-1">
                      {/* Big Gregorian Date in Colorful Letters */}
                      <span
                        className={`text-lg sm:text-2xl font-black font-sans leading-none ${
                          isHoliday
                            ? "text-rose-400"
                            : isSaturday
                            ? "text-purple-300"
                            : isToday
                            ? "text-amber-300"
                            : "text-white group-hover:text-amber-200"
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Malayalam & Saka Date in Colorful Numerals */}
                      <div className="text-right leading-tight">
                        <span className="text-xs font-black text-amber-300 font-sans block">
                          {astro.kollavarshamDay}
                        </span>
                        <span className="text-[9px] font-mono text-teal-300/90 block">
                          {astro.sakaDay}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Nakshatra & Thithi in Colorful Typography */}
                    <div className="my-1 space-y-0.5">
                      <div className="text-[9px] sm:text-[10px] font-bold text-yellow-300 font-sans truncate flex items-center gap-0.5">
                        <span className="text-amber-400 text-[8px]">⭐</span>
                        <span>{astro.nakshatraMl}</span>
                      </div>
                      <div className="text-[8px] sm:text-[9px] font-medium text-sky-300 font-sans truncate">
                        {astro.thithiMl.split(" ")[0]}
                      </div>
                    </div>

                    {/* Bottom: Festival/Holiday Badges or Vasthu Indicator */}
                    <div className="pt-0.5 truncate">
                      {specialDay ? (
                        <div
                          className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded truncate font-sans ${
                            specialDay.isPublicHoliday
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                          title={`${specialDay.nameMl} (${specialDay.nameEn})`}
                        >
                          {specialDay.iconSymbol} {specialDay.nameMl}
                        </div>
                      ) : isBankSat ? (
                        <div className="text-[8px] font-mono text-purple-300 bg-purple-500/10 px-1 rounded truncate">
                          ബാങ്ക് അവധി (Sat)
                        </div>
                      ) : astro.vasthuStatus.suitability === "excellent" ? (
                        <div className="text-[8px] font-mono text-emerald-400 flex items-center gap-0.5 truncate">
                          <span className="text-emerald-400">✨</span> വാസ്തു ശുഭം
                        </div>
                      ) : isToday ? (
                        <div className="text-[8px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1 rounded text-center">
                          ഇന്ന് (TODAY)
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Color Legend & Quick Indicators */}
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-300">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span>പൊതു അവധി / ഞായർ (Holidays)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span>കൊല്ലവർഷ തീയതി (Malayalam)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
                  <span>ശകവർഷ തീയതി (Saka)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                  <span>വാസ്തു ശുഭ മുഹൂർത്തം</span>
                </div>
              </div>

              <div className="text-slate-400 text-[10px]">
                * 2, 4 ശനിയാഴ്ചകൾ ബാങ്ക് അവധിയാണ്
              </div>
            </div>
          </div>

          {/* Right Column: Complete Panchangam Inspector (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-5 shadow-xl sticky top-4">
              {/* Header with Selected Date */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedAstrology.locationName || "തിരുവനന്തപുരം, കേരളം"}</span>
                  </span>
                  <span className="text-emerald-400">IST (UTC+5:30)</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white font-sans">
                  {selectedDate.toLocaleDateString("en-IN", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>

                {/* Multilingual Eras in Colorful Letters */}
                <div className="mt-2 space-y-1 text-xs font-mono">
                  <div className="text-amber-300 font-bold flex items-center justify-between">
                    <span>🌴 കൊല്ലവർഷം (Kollam):</span>
                    <span>{selectedAstrology.kollavarshamYear} {selectedAstrology.kollavarshamMonthMl} {selectedAstrology.kollavarshamDay}</span>
                  </div>
                  <div className="text-teal-300 font-bold flex items-center justify-between">
                    <span>🇮🇳 ശാകവർഷം (Saka):</span>
                    <span>{selectedAstrology.sakaEraEn}</span>
                  </div>
                  <div className="text-purple-300 font-bold flex items-center justify-between">
                    <span>👑 വിക്രം സംവത് (Vikram):</span>
                    <span>{selectedAstrology.vikramSamvatEn}</span>
                  </div>
                </div>
              </div>

              {/* Active Festival / Special Day Banner */}
              {selectedSpecialDay && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-rose-950/60 border border-amber-500/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <span>{selectedSpecialDay.iconSymbol}</span>
                      <span>{selectedSpecialDay.nameMl}</span>
                    </span>
                    {selectedSpecialDay.isPublicHoliday && (
                      <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono font-bold text-[10px]">
                        പൊതു അവധി
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {selectedSpecialDay.descriptionMl}
                  </p>
                  {onSelectSpecialTheme && (
                    <button
                      onClick={() => onSelectSpecialTheme(selectedSpecialDay)}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      ഈ ആഘോഷ തീം സൈറ്റിൽ കാണുക ✨
                    </button>
                  )}
                </div>
              )}

              {/* Daily Panchangam Details in Colorful Grid */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>നിത്യ പഞ്ചാംഗ വിവരങ്ങൾ</span>
                  <span className="text-amber-400">PANCHARATNAM</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Nakshatra */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400" />
                      <span>നക്ഷത്രം (Star)</span>
                    </span>
                    <span className="text-xs font-black text-amber-300 font-sans block mt-1 leading-snug">
                      {selectedAstrology.nakshatraDetailMl || selectedAstrology.nakshatraMl}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {selectedAstrology.nakshatraDetail || selectedAstrology.nakshatraEn}
                    </span>
                  </div>

                  {/* Thithi */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Moon className="w-3 h-3 text-cyan-400" />
                      <span>തിഥി & പക്ഷം (Tithi)</span>
                    </span>
                    <span className="text-xs font-black text-cyan-300 font-sans block mt-1 leading-snug">
                      {selectedAstrology.thithiDetailMl || selectedAstrology.thithiMl}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      {selectedAstrology.pakshamEn || selectedAstrology.pakshamMl}
                    </span>
                  </div>

                  {/* Rahu Kalam */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>രാഹുകാലം (Rahu)</span>
                    </span>
                    <span className="text-xs font-bold text-slate-200 font-mono block mt-1">
                      {selectedAstrology.rahuKalam}
                    </span>
                  </div>

                  {/* Gulika Kalam */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      <span>ഗുളികകാലം (Gulika)</span>
                    </span>
                    <span className="text-xs font-bold text-slate-200 font-mono block mt-1">
                      {selectedAstrology.gulikaKalam}
                    </span>
                  </div>

                  {/* Yamaganda */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono text-orange-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>യമഗണ്ഡം (Yama)</span>
                    </span>
                    <span className="text-xs font-bold text-slate-200 font-mono block mt-1">
                      {selectedAstrology.yamagandam}
                    </span>
                  </div>

                  {/* Sunrise & Sunset */}
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                    <span className="text-[10px] font-mono text-yellow-400 flex items-center gap-1">
                      <Sun className="w-3 h-3" />
                      <span>സൂര്യോദയം / അസ്തമയം</span>
                    </span>
                    <div className="text-[11px] font-mono text-slate-200 mt-1 space-y-0.5">
                      <div>🌅 {selectedAstrology.sunrise}</div>
                      <div>🌇 {selectedAstrology.sunset}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vasthu Suitability Status Card */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Compass className="w-4 h-4" />
                    <span>വാസ്തു മുഹൂർത്ത വിലയിരുത്തൽ</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      selectedAstrology.vasthuStatus.suitability === "excellent"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : selectedAstrology.vasthuStatus.suitability === "favorable"
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {selectedAstrology.vasthuStatus.suitability.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {selectedAstrology.vasthuStatus.labelMl}
                </p>
                <div className="text-[10px] text-slate-500 font-sans">
                  {selectedAstrology.vasthuStatus.labelEn}
                </div>
              </div>

              {/* Share & WhatsApp Action */}
              <button
                onClick={handleShareDayDetails}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>ഈ പഞ്ചാംഗം WhatsApp-ൽ അയക്കുക</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: OFFICIAL INDIAN NATIONAL WALL SHEET (🏛️ ഭാരതീയ ദേശീയ ഷീറ്റ്)
         ========================================================================= */}
      {viewMode === "national_sheet" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-red-950/80 via-slate-950 to-slate-950 border-2 border-red-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white">
            {/* Authentic Indian Wall Calendar Red Header */}
            <div className="border-b-2 border-red-800 pb-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">🏛️</span>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black font-sans uppercase tracking-tight text-amber-300">
                    ഭാരതീയ ദേശീയ പഞ്ചാംഗ കലണ്ടർ 2026
                  </h1>
                  <h2 className="text-xs sm:text-sm font-mono tracking-widest text-slate-300 uppercase">
                    GOVERNMENT OF INDIA & KERALA OFFICIAL CIVIL CALENDAR • 2026
                  </h2>
                </div>
                <span className="text-3xl">🇮🇳</span>
              </div>

              {/* Multi-Era Subheaders in Colorful Boxes */}
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono font-bold pt-2">
                <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg">
                  ശാകവർഷം: {currentSaka.year} ({currentSaka.monthMl})
                </span>
                <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-lg">
                  വിക്രം സംവത്: {currentVikram.year}
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg">
                  കൊല്ലവർഷം: 1201–1202 ({currentMonthConfig.kollamRangeMl})
                </span>
                <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-lg">
                  ഹിജ്റ: 1447–1448
                </span>
              </div>

              {/* Monthly Quote / Anti-Drug Motto */}
              <div className="p-2.5 bg-red-900/40 border border-red-700/60 rounded-xl text-xs font-sans text-amber-200">
                ⭐ &quot;സത്യമേവ ജയതേ - ലഹരിക്കെതിരെ ജാഗ്രത പുലർത്തുക • സുരക്ഷിത കേരളം, സന്തുഷ്ട ഭാരതം&quot;
              </div>
            </div>

            {/* Wall Sheet Month Title */}
            <div className="flex items-center justify-between bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <button
                onClick={handlePrevMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h3 className="text-2xl sm:text-3xl font-black text-amber-300 font-sans">
                  {currentMonthConfig.nameMl} ({currentMonthConfig.nameEn.toUpperCase()}) {currentYear}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {currentMonthConfig.kollamRangeMl} • {currentSaka.monthEn} {currentSaka.year}
                </p>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Wall Sheet Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Header Days */}
              {WEEKDAYS_KERALA.map((day) => (
                <div
                  key={day.id}
                  className={`p-2 text-center rounded-xl font-bold font-sans ${
                    day.id === 0
                      ? "bg-red-600 text-white"
                      : day.id === 6
                      ? "bg-purple-900 text-purple-200"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  <div className="text-sm font-black">{day.nameMl}</div>
                  <div className="text-[10px] font-mono">{day.nameEn.slice(0, 3)}</div>
                </div>
              ))}

              {/* Blank leading days */}
              {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                <div
                  key={`wall-blank-${idx}`}
                  className="min-h-[85px] bg-slate-950/40 rounded-xl border border-slate-900"
                />
              ))}

              {/* Month dates in Wall Calendar styling */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDate = new Date(currentYear, currentMonthIndex, dayNum);
                const dayOfWeek = cellDate.getDay();
                const isSunday = dayOfWeek === 0;
                const astro = getAstrologyForDate(cellDate);
                const specialDay = getSpecialDayForDate(cellDate);
                const isHoliday = isSunday || specialDay?.isPublicHoliday;

                return (
                  <div
                    key={`wall-day-${dayNum}`}
                    onClick={() => setSelectedDate(cellDate)}
                    className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                      isHoliday
                        ? "bg-red-950/30 border-red-800/60 text-red-400"
                        : "bg-slate-900/90 border-slate-800 text-white"
                    } hover:border-amber-400`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-xl sm:text-2xl font-black font-sans leading-none ${isHoliday ? "text-red-400 font-black" : "text-white"}`}>
                        {dayNum}
                      </span>
                      <span className="text-xs font-bold text-amber-300 font-sans">
                        {astro.kollavarshamDay}
                      </span>
                    </div>

                    <div className="text-[9px] font-mono text-yellow-300 truncate">
                      {astro.nakshatraMl}
                    </div>

                    {specialDay && (
                      <div className="text-[8px] font-bold text-amber-300 bg-red-950/60 p-0.5 rounded truncate">
                        {specialDay.nameMl}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Weekday Rahu Kalam & Gulika Legend Table */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                ⏱️ രാഹുകാലം & ഗുളികകാലം ചാർട്ട് (തിരുവനന്തപുരം സമയം)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-rose-400 font-bold">ഞായർ</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 4:54 - 6:26 PM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 3:22 - 4:54 PM</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-cyan-400 font-bold">തിങ്കൾ</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 7:49 - 9:20 AM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 1:53 - 3:24 PM</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-orange-400 font-bold">ചൊവ്വ</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 3:23 - 4:54 PM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 12:21 - 1:52 PM</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-emerald-400 font-bold">ബുധൻ</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 12:15 - 1:48 PM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 10:43 - 12:15 PM</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-amber-400 font-bold">വ്യാഴം</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 1:51 - 3:22 PM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 9:19 - 10:50 AM</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-pink-400 font-bold">വെള്ളി</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 10:50 - 12:21 PM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 7:48 - 9:19 AM</div>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-purple-400 font-bold">ശനി</div>
                  <div className="text-[10px] text-slate-300">രാഹു: 9:19 - 10:50 AM</div>
                  <div className="text-[10px] text-emerald-400">ഗുളിക: 6:17 - 7:48 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 3: SAKA & VIKRAM SAMVAT EXPLORER (🇮🇳 ശക & വിക്രം വർഷം)
         ========================================================================= */}
      {viewMode === "saka_vikram" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-orange-400" />
                  <span>ഭാരതീയ രാഷ്ട്രീയ പഞ്ചാംഗം (RASHTRIYA PANCHANG)</span>
                </div>
                <h3 className="text-2xl font-black text-white font-sans mt-0.5">
                  ശാകവർഷം & വിക്രം സംവത് മാസങ്ങൾ (Indian National Months)
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  1957-ൽ ഭാരത സർക്കാർ ഔദ്യോഗികമായി അംഗീകരിച്ച ദേശീയ സിവിൽ കലണ്ടർ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold">
                  Saka: {currentSaka.year}
                </span>
                <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-mono font-bold">
                  Vikram: {currentVikram.year}
                </span>
              </div>
            </div>

            {/* 6 Indian Seasons (ഷഡ് ഋതുക്കൾ) */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ഭാരതത്തിലെ 6 ഋതുക്കൾ (SIX INDIAN SEASONS)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INDIAN_RITUS.map((ritu) => (
                  <div
                    key={ritu.id}
                    className={`p-4 rounded-2xl border ${ritu.colorClass} space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black font-sans">{ritu.nameMl}</span>
                      <span className="text-xs font-mono font-bold">{ritu.nameHi}</span>
                    </div>
                    <div className="text-xs font-bold text-white">{ritu.nameEn}</div>
                    <p className="text-[11px] text-slate-300 font-sans">{ritu.description}</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1">
                      കാലയളവ്: {ritu.months}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 12 Saka Months Table */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                📅 12 ശാകവർഷ മാസങ്ങൾ (12 SAKA NATIONAL MONTHS)
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                {[
                  { num: 1, nameEn: "Chaitra", nameHi: "चैत्र", nameMl: "ചൈത്രം", days: "30/31", gregorian: "Mar 22 – Apr 20", ritu: "വസന്തം" },
                  { num: 2, nameEn: "Vaishakha", nameHi: "वैशाख", nameMl: "വൈശാഖം", days: "31", gregorian: "Apr 21 – May 21", ritu: "വസന്തം" },
                  { num: 3, nameEn: "Jyeshtha", nameHi: "ज्येष्ठ", nameMl: "ജ്യേഷ്ഠം", days: "31", gregorian: "May 22 – Jun 21", ritu: "ഗ്രീഷ്മം" },
                  { num: 4, nameEn: "Ashadha", nameHi: "आषाढ़", nameMl: "ആഷാഢം", days: "31", gregorian: "Jun 22 – Jul 22", ritu: "ഗ്രീഷ്മം" },
                  { num: 5, nameEn: "Shravana", nameHi: "श्रावण", nameMl: "ശ്രാവണം", days: "31", gregorian: "Jul 23 – Aug 22", ritu: "വർഷം" },
                  { num: 6, nameEn: "Bhadrapada", nameHi: "भाद्रपद", nameMl: "ഭാദ്രപദം", days: "31", gregorian: "Aug 23 – Sep 22", ritu: "വർഷം" },
                  { num: 7, nameEn: "Ashvina", nameHi: "आश्विन", nameMl: "ആശ്വിനം", days: "30", gregorian: "Sep 23 – Oct 22", ritu: "ശരത്" },
                  { num: 8, nameEn: "Kartika", nameHi: "कार्तिक", nameMl: "കാർത്തികം", days: "30", gregorian: "Oct 23 – Nov 21", ritu: "ശരത്" },
                  { num: 9, nameEn: "Agrahayana", nameHi: "अग्रहायण", nameMl: "മാർഗ്ഗശീർഷം", days: "30", gregorian: "Nov 22 – Dec 21", ritu: "ഹേമന്തം" },
                  { num: 10, nameEn: "Pausha", nameHi: "पौष", nameMl: "പൗഷം", days: "30", gregorian: "Dec 22 – Jan 20", ritu: "ഹേമന്തം" },
                  { num: 11, nameEn: "Magha", nameHi: "माघ", nameMl: "മാഘം", days: "30", gregorian: "Jan 21 – Feb 19", ritu: "ശിശിരം" },
                  { num: 12, nameEn: "Phalguna", nameHi: "फाल्गुन", nameMl: "ഫാൽഗുനം", days: "30", gregorian: "Feb 20 – Mar 21", ritu: "ശിശിരം" },
                ].map((sMonth) => (
                  <div
                    key={sMonth.num}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1 hover:border-amber-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between text-amber-400 font-mono text-[10px]">
                      <span>മാസം {sMonth.num}</span>
                      <span className="text-slate-400">{sMonth.days} days</span>
                    </div>
                    <div className="text-sm font-black text-white font-sans">
                      {sMonth.nameMl} ({sMonth.nameHi})
                    </div>
                    <div className="text-xs text-slate-300 font-mono">{sMonth.nameEn}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{sMonth.gregorian}</div>
                    <div className="text-[10px] text-rose-300 font-mono">ഋതു: {sMonth.ritu}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 4: KOLLA VARSHAM 1201–1202 (🌴 കൊല്ലവർഷം)
         ========================================================================= */}
      {viewMode === "kollavarsham" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                കേരള സംസ്കാരം & തച്ചുശാസ്ത്രം
              </div>
              <h3 className="text-2xl font-black text-white font-sans mt-0.5">
                കൊല്ലവർഷം 1201–1202 കലണ്ടർ (12 MALAYALAM MONTHS)
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-1">
                എഡി 825-ൽ ആരംഭിച്ച സൗര പഞ്ചാംഗ സമ്പ്രദായം. ചിങ്ങം മുതൽ കർക്കടകം വരെയുള്ള 12 മാസങ്ങൾ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MALAYALAM_MONTHS.map((m) => (
                <div
                  key={m.id}
                  className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      മാസം {m.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ~{m.approxDays} Days
                    </span>
                  </div>

                  <div className="text-lg font-black text-white font-sans">
                    {m.nameMl} ({m.nameEn})
                  </div>

                  <div className="text-xs text-amber-300 font-sans">
                    {m.seasonMl}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    ഗ്രിഗോറിയൻ ആരംഭം: {m.startGregMonth}/{m.startGregDay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 5: ALL-INDIA FESTIVALS & HOLIDAYS (🎉 ഭാരതീയ ഉത്സവങ്ങൾ)
         ========================================================================= */}
      {viewMode === "all_festivals" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  2026 FESTIVALS DIRECTORY
                </div>
                <h3 className="text-2xl font-black text-white font-sans mt-0.5">
                  ഭാരതീയ വിശേഷ ദിവസങ്ങൾ & പൊതു അവധികൾ
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  ദേശീയ അവധികൾ, ഹൈന്ദവ, ഇസ്ലാമിക, ക്രൈസ്തവ, സിഖ് ഉത്സവങ്ങൾ & കേരള സർക്കാർ അവധികൾ.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={festivalSearch}
                    onChange={(e) => setFestivalSearch(e.target.value)}
                    placeholder="ഉത്സവം തിരയുക..."
                    className="pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={festivalCategoryFilter}
                  onChange={(e) => setFestivalCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                >
                  <option value="all">എല്ലാ ഉത്സവങ്ങളും (All)</option>
                  <option value="national">ദേശീയ അവധികൾ (National)</option>
                  <option value="public_holidays">സർക്കാർ അവധികൾ (Govt)</option>
                  <option value="kerala">കേരള ഉത്സവങ്ങൾ (Kerala)</option>
                  <option value="vasthu">വാസ്തു മുഹൂർത്തങ്ങൾ (Vastu)</option>
                </select>
              </div>
            </div>

            {/* Festivals Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredFestivals.map((fest) => (
                <div
                  key={fest.id}
                  className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-lg">{fest.iconSymbol}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {fest.dateFormatted} (2026)
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white font-sans">
                      {fest.nameMl}
                    </h4>
                    <div className="text-xs font-bold text-amber-300 font-sans">
                      {fest.nameEn}
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                      {fest.descriptionMl}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-900">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                        fest.isPublicHoliday
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {fest.isPublicHoliday ? "പൊതു അവധി (Holiday)" : "വിശേഷ ദിനം (Special)"}
                    </span>

                    {onSelectSpecialTheme && (
                      <button
                        onClick={() => onSelectSpecialTheme(fest)}
                        className="text-[10px] font-mono font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                      >
                        തീം സജ്ജമാക്കുക →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 6: VASTHU & AUSPICIOUS MUHURTHAMS (🧭 വാസ്തു മുഹൂർത്തം)
         ========================================================================= */}
      {viewMode === "vasthu_muhurtham" && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-5">
            <div className="border-b border-slate-800 pb-4">
              <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                <span>തച്ചുശാസ്ത്ര നിയമങ്ങൾ & ശുഭ മുഹൂർത്തങ്ങൾ</span>
              </div>
              <h3 className="text-2xl font-black text-white font-sans mt-0.5">
                വാസ്തു പുരുഷ പൂജ & ഗൃഹാരംഭ മുഹൂർത്തങ്ങൾ 2026
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-1">
                ഭൂമി പൂജ, കട്ടിളവെപ്പ്, കിണർ കുഴിക്കൽ, ഗൃഹപ്രവേശം എന്നിവയ്ക്കുള്ള ശുഭ ദിനങ്ങൾ.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-black text-amber-300 font-sans flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>ഗൃഹാരംഭത്തിന് ഉത്തമമായ നക്ഷത്രങ്ങൾ (Auspicious Stars)</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  രോഹിണി, മകയിരം, പുണർതം, പൂയം, ഉത്രം, അത്തം, ചിത്തിര, ചോതി, അനിഴം, മൂലം, ഉത്രാടം, തിരുവോണം, അവിട്ടം, ചതയം, ഉത്രട്ടാതി, രേവതി.
                </p>
                <div className="text-[11px] text-rose-300 font-sans bg-rose-950/30 p-2.5 rounded-xl border border-rose-900/40">
                  ⚠️ ചൊവ്വ, ശനി ദിവസങ്ങളിലും അമാവാസി, കറുത്ത പക്ഷ ഷഷ്ഠി നാളുകളിലും തറക്കല്ലിടൽ ഒഴിവാക്കുക.
                </div>
              </div>

              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-black text-emerald-300 font-sans flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>വാസ്തു എൻജിനീയറിംഗ് കൺസൾട്ടേഷൻ</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  കോൽവിരൽ കണക്കുകൾ, പദവിന്യാസം, ആയാദി ഷഡ്വർഗ്ഗ കണക്കുകൾ, കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ (KPBR 2019) എന്നിവ പാലിച്ച് ഡിസൈൻ തയ്യാറാക്കാൻ ബന്ധപ്പെടുക.
                </p>
                <div className="text-xs font-mono font-bold text-amber-300 bg-amber-950/30 p-2.5 rounded-xl border border-amber-900/40">
                  📞 Er. Deepak K. (9747995961) • Vasthusilpy Engineering Studio
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
