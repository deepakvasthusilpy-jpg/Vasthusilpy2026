import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Clock,
  Sparkles,
  CalendarDays,
  Flame,
  Award
} from "lucide-react";
import {
  MONTHS_CONFIG,
  getAstrologyForDate,
  getSpecialDayForDate,
  getEventsForMonth,
  isSecondOrFourthSaturday
} from "../../utils/keralaCalendarData";

interface ProkeralaKeralaCalendarProps {
  initialYear: number;
  initialMonthIndex: number;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

export const ProkeralaKeralaCalendar: React.FC<ProkeralaKeralaCalendarProps> = ({
  initialYear,
  initialMonthIndex,
  selectedDate,
  onSelectDate
}) => {
  const [year, setYear] = useState<number>(initialYear);
  const [monthIndex, setMonthIndex] = useState<number>(initialMonthIndex);

  const currentMonthConfig = MONTHS_CONFIG[monthIndex];

  const daysInMonth = useMemo(() => {
    return new Date(year, monthIndex + 1, 0).getDate();
  }, [year, monthIndex]);

  const firstDayWeekday = useMemo(() => {
    return new Date(year, monthIndex, 1).getDay();
  }, [year, monthIndex]);

  const handlePrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((y) => y - 1);
    } else {
      setMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((y) => y + 1);
    } else {
      setMonthIndex((m) => m + 1);
    }
  };

  const selectedAstro = useMemo(() => {
    return getAstrologyForDate(selectedDate);
  }, [selectedDate]);

  const selectedSpecial = useMemo(() => {
    return getSpecialDayForDate(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between shadow-xl text-white">
        <button
          onClick={handlePrevMonth}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition cursor-pointer"
          title="മുൻ മാസം"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-black font-serif text-white tracking-wide flex items-center justify-center gap-2">
            <span className="text-amber-400">{currentMonthConfig.nameMl}</span>
            <span>{year}</span>
            <span className="text-xs font-mono font-normal text-slate-400">({currentMonthConfig.nameEn})</span>
          </h3>
          <p className="text-xs font-mono text-amber-300/80 mt-0.5">
            {currentMonthConfig.kollamRangeMl} • ശാകം 1948
          </p>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition cursor-pointer"
          title="അടുത്ത മാസം"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 p-4 rounded-3xl space-y-3">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs">
            <div className="p-2 rounded-xl bg-rose-950/40 text-rose-400">ഞായർ (SUN)</div>
            <div className="p-2 rounded-xl bg-slate-800/60 text-slate-300">തിങ്കൾ (MON)</div>
            <div className="p-2 rounded-xl bg-slate-800/60 text-slate-300">ചൊവ്വ (TUE)</div>
            <div className="p-2 rounded-xl bg-slate-800/60 text-slate-300">ബുധൻ (WED)</div>
            <div className="p-2 rounded-xl bg-slate-800/60 text-slate-300">വ്യാഴം (THU)</div>
            <div className="p-2 rounded-xl bg-slate-800/60 text-slate-300">വെള്ളി (FRI)</div>
            <div className="p-2 rounded-xl bg-purple-950/40 text-purple-300">ശനി (SAT)</div>
          </div>

          {/* Month cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[86px] rounded-2xl bg-slate-950/20 border border-slate-900/40"
              />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const cellDate = new Date(year, monthIndex, dayNum);
              const dayOfWeek = cellDate.getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;
              const isBankSat = isSecondOrFourthSaturday(cellDate);

              const astro = getAstrologyForDate(cellDate);
              const special = getSpecialDayForDate(cellDate);
              const isHoliday = isSunday || (isSaturday && isBankSat) || (special?.isPublicHoliday ?? false);

              const isSelected =
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === monthIndex &&
                selectedDate.getDate() === dayNum;

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => onSelectDate(cellDate)}
                  className={`min-h-[86px] p-2 rounded-2xl text-left transition relative flex flex-col justify-between border cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 border-amber-400 ring-2 ring-amber-400/50 shadow-xl"
                      : isHoliday
                      ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-500/50"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`text-lg font-black font-sans leading-none ${
                        isHoliday ? "text-rose-400" : isSaturday ? "text-purple-300" : "text-white"
                      }`}
                    >
                      {dayNum}
                    </span>
                    <span className="text-[11px] font-bold text-amber-300 font-sans">
                      {astro.kollavarshamDay}
                    </span>
                  </div>

                  <div className="text-[10px] space-y-0.5 leading-tight">
                    <p className="text-cyan-300 font-bold truncate">{astro.nakshatraMl}</p>
                    <p className="text-slate-400 truncate">{astro.thithiMl}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Panchangam Details */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 text-white">
          <div>
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
              <span>{selectedAstro.dayOfWeekMl} ({selectedAstro.dayOfWeekEn})</span>
              <span>IST UTC+5:30</span>
            </div>
            <h4 className="text-xl font-bold font-serif text-white mt-1">
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
              })}
            </h4>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-amber-300">
              <span>കൊല്ലവർഷം:</span>
              <span>{selectedAstro.kollavarshamYear} {selectedAstro.kollavarshamMonthMl} {selectedAstro.kollavarshamDay}</span>
            </div>
            <div className="flex justify-between text-teal-300">
              <span>ശാകവർഷം:</span>
              <span>{selectedAstro.sakaEraEn}</span>
            </div>
            <div className="flex justify-between text-purple-300">
              <span>വിക്രം സംവത്:</span>
              <span>{selectedAstro.vikramSamvatEn}</span>
            </div>
          </div>

          {selectedSpecial && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
              <span className="font-bold text-amber-300">{selectedSpecial.nameMl}</span>
              <p className="text-slate-300 mt-1">{selectedSpecial.descriptionMl}</p>
            </div>
          )}

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">നക്ഷത്രം (Nakshatra):</span>
              <span className="font-bold text-cyan-300">{selectedAstro.nakshatraMl} ({selectedAstro.nakshatraEn})</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">തിഥി (Tithi):</span>
              <span className="font-bold text-amber-300">{selectedAstro.thithiMl}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">സൂര്യോദയം (Sunrise):</span>
              <span className="font-mono text-white">{selectedAstro.sunrise}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">സൂര്യാസ്തമയം (Sunset):</span>
              <span className="font-mono text-white">{selectedAstro.sunset}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-rose-400">രാഹുകാലം (Rahu):</span>
              <span className="font-mono text-rose-300">{selectedAstro.rahuKalam}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-emerald-400">ഗുളികകാലം (Gulika):</span>
              <span className="font-mono text-emerald-300">{selectedAstro.gulikaKalam}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
