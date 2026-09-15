import React from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Radio,
  Sliders
} from "lucide-react";
import { LanguagePref } from "./useAIVoiceEngine";

interface VoiceControlBarProps {
  isSpeaking: boolean;
  isPaused: boolean;
  currentSpokenText: string;
  rate: number;
  autoSpeak: boolean;
  language: LanguagePref;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReplay?: () => void;
  onChangeRate: (rate: number) => void;
  onToggleAutoSpeak: () => void;
  className?: string;
  themeColor?: "cyan" | "emerald" | "amber" | "blue";
}

export const VoiceControlBar: React.FC<VoiceControlBarProps> = ({
  isSpeaking,
  isPaused,
  currentSpokenText,
  rate,
  autoSpeak,
  language,
  onPause,
  onResume,
  onStop,
  onReplay,
  onChangeRate,
  onToggleAutoSpeak,
  className = "",
  themeColor = "cyan"
}) => {
  const activeStyles = {
    cyan: {
      border: "border-cyan-500/40",
      bg: "bg-gradient-to-r from-slate-900 via-cyan-950/70 to-slate-900",
      pill: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      btnPrimary: "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20",
      btnSecondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
      wave: "bg-cyan-400"
    },
    emerald: {
      border: "border-emerald-500/40",
      bg: "bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900",
      pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      btnPrimary: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20",
      btnSecondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
      wave: "bg-emerald-400"
    },
    amber: {
      border: "border-amber-500/40",
      bg: "bg-gradient-to-r from-slate-900 via-amber-950/70 to-slate-900",
      pill: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      btnPrimary: "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20",
      btnSecondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
      wave: "bg-amber-400"
    },
    blue: {
      border: "border-blue-500/40",
      bg: "bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900",
      pill: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      btnPrimary: "bg-blue-500 hover:bg-blue-400 text-slate-950 shadow-blue-500/20",
      btnSecondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
      wave: "bg-blue-400"
    }
  }[themeColor];

  if (!isSpeaking && !isPaused && !currentSpokenText) {
    return (
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 backdrop-blur-md ${className}`}
      >
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-sans text-[11px]">
            വോയ്‌സ് ഔട്ട്പുട്ട്:{" "}
            <span className="text-slate-300 font-bold">
              {language === "malayalam"
                ? "മലയാളം"
                : language === "english"
                ? "English"
                : "ദ്വിഭാഷ (Malayalam & English)"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleAutoSpeak}
            className="flex items-center gap-1.5 text-[11px] font-mono hover:text-white transition-colors cursor-pointer"
            title="Toggle auto speech for new messages"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoSpeak ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-slate-600"
              }`}
            />
            <span>ഓട്ടോ-വോയ്‌സ്: {autoSpeak ? "ഓൺ (ON)" : "ഓഫ് (OFF)"}</span>
          </button>

          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span>വേഗത:</span>
            {[0.8, 1.0, 1.2].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRate(r)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  rate === r
                    ? "bg-slate-700 text-white font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="ai-voice-control-bar"
      className={`p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${activeStyles.bg} ${activeStyles.border} ${className}`}
    >
      {/* Left: Status & Audio Waveform */}
      <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-slate-950/80 border border-slate-700 shrink-0">
          {isSpeaking && !isPaused ? (
            <div className="flex items-center gap-0.5 h-4">
              <span
                className={`w-1 rounded-full animate-bounce ${activeStyles.wave}`}
                style={{ height: "14px", animationDuration: "0.6s" }}
              />
              <span
                className={`w-1 rounded-full animate-bounce ${activeStyles.wave}`}
                style={{ height: "18px", animationDuration: "0.4s", animationDelay: "0.15s" }}
              />
              <span
                className={`w-1 rounded-full animate-bounce ${activeStyles.wave}`}
                style={{ height: "10px", animationDuration: "0.7s", animationDelay: "0.3s" }}
              />
              <span
                className={`w-1 rounded-full animate-bounce ${activeStyles.wave}`}
                style={{ height: "16px", animationDuration: "0.5s", animationDelay: "0.1s" }}
              />
            </div>
          ) : (
            <Pause className="w-4 h-4 text-amber-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${activeStyles.pill}`}
            >
              {isSpeaking && !isPaused ? "സ്പീക്കിംഗ് (Speaking)" : "പോസ് ചെയ്തു (Paused)"}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {language === "malayalam"
                ? "മലയാളം വോയ്‌സ്"
                : language === "english"
                ? "English Voice"
                : "Bilingual"}
            </span>
          </div>
          {currentSpokenText && (
            <p className="text-xs text-slate-200 truncate font-sans mt-0.5 max-w-[280px] sm:max-w-md">
              "{currentSpokenText}"
            </p>
          )}
        </div>
      </div>

      {/* Right: Controls (Pause, Resume, Stop, Replay, Speed) */}
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        {/* Pause / Resume Button */}
        {isSpeaking && !isPaused ? (
          <button
            type="button"
            id="voice-ctrl-pause-btn"
            onClick={onPause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            title="Pause Voice Output"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause (പോസ്)</span>
          </button>
        ) : (
          <button
            type="button"
            id="voice-ctrl-resume-btn"
            onClick={onResume}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs shadow-md transition-all cursor-pointer ${activeStyles.btnPrimary}`}
            title="Resume Voice Output"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume (തുടരുക)</span>
          </button>
        )}

        {/* Stop Button */}
        <button
          type="button"
          id="voice-ctrl-stop-btn"
          onClick={onStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer border border-rose-500/40"
          title="Stop Voice Output"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop (നിർത്തുക)</span>
        </button>

        {/* Replay */}
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className={`p-1.5 rounded-xl border text-slate-300 hover:text-white transition-all cursor-pointer ${activeStyles.btnSecondary}`}
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
          {[0.8, 1.0, 1.2].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChangeRate(r)}
              className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                rate === r
                  ? "bg-slate-700 text-white font-bold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
