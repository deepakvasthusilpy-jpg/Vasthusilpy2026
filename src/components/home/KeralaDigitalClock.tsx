import React, { useState, useEffect } from "react";
import { getKeralaAstrologyForDate, getSpecialDayForDate, SpecialDayInfo } from "../../utils/keralaCalendarData";
import {
  Clock,
  Sun,
  Moon,
  Calendar,
  Sparkles,
  ShieldCheck,
  Compass,
  AlertCircle,
  Flame,
  Info,
  MapPin
} from "lucide-react";

interface KeralaDigitalClockProps {
  className?: string;
  onSelectSpecialDay?: (specialDay: SpecialDayInfo) => void;
}

export const KeralaDigitalClock: React.FC<KeralaDigitalClockProps> = ({
  className = "",
  onSelectSpecialDay
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  useEffect(() => {
    // Tick every 1 second synchronized to real time
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute Indian Standard Time (IST - Asia/Kolkata) string and parts
  const istFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: !is24Hour,
  });

  const istParts = istFormatter.formatToParts(now);
  const hour = istParts.find((p) => p.type === "hour")?.value || "12";
  const minute = istParts.find((p) => p.type === "minute")?.value || "00";
  const second = istParts.find((p) => p.type === "second")?.value || "00";
  const dayPeriod = istParts.find((p) => p.type === "dayPeriod")?.value || "";

  // Date in IST
  const dateFormattedEn = now.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const astrology = getKeralaAstrologyForDate(now);
  const specialDay = getSpecialDayForDate(now);

  const secondsNum = parseInt(second, 10) || 0;
  const secondsPercent = ((secondsNum + 1) / 60) * 100;

  return (
    <div
      id="kerala-digital-clock"
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-2xl p-5 md:p-6 text-white ${className}`}
    >
      {/* Decorative Top Accent Kasavu Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-500" />

      {/* Header bar: Title & Timezone */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight font-sans">
                കേരള സമയം • Kerala IST Digital Clock
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                LIVE IST (UTC+5:30)
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <span>{astrology.locationName || "Thiruvananthapuram, Kerala"} • IST (UTC+5:30)</span>
            </div>
          </div>
        </div>

        {/* 12h / 24h Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIs24Hour(!is24Hour)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
            title="Toggle 12h / 24h Clock"
          >
            {is24Hour ? "Switch to 12h" : "Switch to 24h"}
          </button>
        </div>
      </div>

      {/* Main Clock Face & Kollavarsham Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-5">
        {/* Left Side: Big Digital Clock & Progress Bar (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-baseline gap-3">
            {/* Clock Digits Display */}
            <div className="bg-slate-950/90 border border-slate-800 px-5 py-3.5 rounded-2xl flex items-center shadow-inner">
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-wider text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {hour}
              </span>
              <span className="text-4xl sm:text-6xl font-black font-mono text-amber-400/80 mx-1.5 animate-pulse">
                :
              </span>
              <span className="text-4xl sm:text-6xl font-black font-mono tracking-wider text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                {minute}
              </span>
              <span className="text-4xl sm:text-6xl font-black font-mono text-amber-400/80 mx-1.5 animate-pulse">
                :
              </span>
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-wider text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                {second}
              </span>

              {!is24Hour && dayPeriod && (
                <span className="ml-3 text-xs sm:text-sm font-black font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                  {dayPeriod}
                </span>
              )}
            </div>
          </div>

          {/* Real-time ticking seconds progression bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>സെക്കൻഡ് പ്രോഗ്രസ് (Seconds)</span>
              <span className="text-emerald-400 font-bold">{second}s / 60s</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${secondsPercent}%` }}
              />
            </div>
          </div>

          {/* Gregorian Date & Saka Era */}
          <div className="space-y-1">
            <div className="text-sm font-sans text-slate-200 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold">{dateFormattedEn}</span>
            </div>
            {astrology.sakaEraEn && (
              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <span className="text-amber-400 font-semibold">ശകവർഷം (Saka Era):</span>
                <span>{astrology.sakaEraEn} ({astrology.sakaEraMl})</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Kerala Kollavarsham & Daily Astrology Quick Hub (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>കൊല്ലവർഷം ({astrology.kollavarshamYear} ME)</span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
              {astrology.kollavarshamMonthMl} {astrology.kollavarshamDay} ({astrology.kollavarshamMonthEn} {astrology.kollavarshamDay})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Nakshathram */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 font-mono">നക്ഷത്രം (Nakshatra)</div>
              <div className="text-xs font-black text-amber-300 font-sans mt-0.5 leading-snug">
                {astrology.nakshatraDetailMl || `${astrology.nakshatraMl} (${astrology.nakshatraEn})`}
              </div>
            </div>

            {/* Thithi */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-slate-400 font-mono">തിഥി (Tithi)</div>
              <div className="text-xs font-black text-cyan-300 font-sans mt-0.5 leading-snug">
                {astrology.thithiDetailMl || astrology.thithiMl}
              </div>
            </div>

            {/* Rahu Kalam */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-rose-400 font-mono">രാഹുകാലം (Rahu Kalam)</div>
              <div className="text-[11px] font-bold text-slate-200 font-mono mt-0.5">
                {astrology.rahuKalam}
              </div>
            </div>

            {/* Gulika Kalam */}
            <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
              <div className="text-[10px] text-emerald-400 font-mono">ഗുളികകാലം (Gulika Kalam)</div>
              <div className="text-[11px] font-bold text-slate-200 font-mono mt-0.5">
                {astrology.gulikaKalam}
              </div>
            </div>
          </div>

          {/* Sunrise / Sunset estimate */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>സൂര്യോദയം: {astrology.sunrise}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>സൂര്യാസ്തമയം: {astrology.sunset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Special Day Banner Strip if active today */}
      {specialDay && (
        <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-emerald-500/20 border border-amber-400/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{specialDay.iconSymbol}</span>
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <span>{specialDay.nameMl} • {specialDay.nameEn}</span>
                <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded font-black uppercase">
                  TODAY'S SPECIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                {specialDay.descriptionMl}
              </p>
            </div>
          </div>

          {onSelectSpecialDay && (
            <button
              type="button"
              onClick={() => onSelectSpecialDay(specialDay)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow"
            >
              View Special Matters & Theme →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
