import React from "react";
import {
  Palette,
  Moon,
  Sun,
  Columns,
  Crown,
  Sparkles,
  Trees,
  Cpu,
  Check,
  X,
  RotateCcw,
  Sparkle
} from "lucide-react";
import { useTheme, Theme, ThemeOption } from "../../context/ThemeContext";

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_ICONS: Record<Theme, React.FC<{ className?: string }>> = {
  dark: Moon,
  light: Sun,
  neoclassical: Columns,
  baroque: Crown,
  ethereal: Sparkles,
  anthropomorphic: Trees,
  ai_platform: Cpu
};

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { theme, setTheme, themesList, cycleNextTheme, isSystemTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = React.useState<"all" | "dark" | "light" | "artistic">("all");

  if (!isOpen) return null;

  const filteredThemes = themesList.filter((t) => {
    if (selectedCategory === "all") return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 via-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide text-white uppercase">
                  Architectural Theme Studio
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                  {themesList.length} THEMES AVAILABLE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose an architectural aesthetic tailored for drafting, estimates & structural design
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleNextTheme}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Cycle to next theme"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Theme</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Category Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/30 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px] mr-1">FILTER:</span>
            {(
              [
                { id: "all", label: "All Themes (6)" },
                { id: "dark", label: "Dark View" },
                { id: "light", label: "Light View" },
                { id: "artistic", label: "Artistic & Architectural" }
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span>ACTIVE:</span>
            <span className="text-amber-400 font-bold uppercase">{theme}</span>
            {isSystemTheme && (
              <span className="text-[10px] text-slate-500">(Auto System Match)</span>
            )}
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map((t: ThemeOption) => {
            const isSelected = theme === t.id;
            const Icon = THEME_ICONS[t.id] || Sparkle;

            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? "border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg scale-[1.01]"
                    : "border-slate-800 hover:border-slate-600 hover:bg-slate-800/40"
                }`}
                style={{
                  backgroundColor: t.bgPreview,
                  color: t.textPreview
                }}
              >
                {/* Selection Ribbon */}
                {isSelected && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black font-mono shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE</span>
                  </div>
                )}

                <div>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner"
                      style={{
                        backgroundColor: t.cardPreview,
                        borderColor: t.borderPreview,
                        borderWidth: 1,
                        color: t.primaryColor
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5" style={{ color: t.textPreview }}>
                        {t.name}
                      </h3>
                      <div className="text-[10px] opacity-70 font-mono">
                        {t.nameMl}
                      </div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <div
                    className="text-[11px] font-semibold mb-2"
                    style={{ color: t.primaryColor }}
                  >
                    {t.tagline}
                  </div>

                  {/* Description */}
                  <p className="text-xs opacity-80 leading-relaxed mb-3">
                    {t.description}
                  </p>
                </div>

                {/* Color Palette Palette Swatches & Miniature Preview */}
                <div className="pt-2 border-t" style={{ borderColor: t.borderPreview }}>
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-2">
                    <span>PALETTE MATRIX</span>
                    <span className="uppercase">{t.colorScheme} Base</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 h-6 rounded-md overflow-hidden p-0.5" style={{ backgroundColor: t.cardPreview, borderColor: t.borderPreview, borderWidth: 1 }}>
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.bgPreview }} title="Background Canvas" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.cardPreview }} title="Card Panel" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.borderPreview }} title="Border Color" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.primaryColor }} title="Primary Accent" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.accentColor }} title="Highlight Accent" />
                  </div>

                  {/* Live Mini Preview Box */}
                  <div
                    className="mt-2.5 p-2 rounded-lg text-[10px] font-mono flex items-center justify-between"
                    style={{
                      backgroundColor: t.cardPreview,
                      borderColor: t.borderPreview,
                      borderWidth: 1,
                      color: t.textPreview
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accentColor }} />
                      <span>RCC Column M25</span>
                    </div>
                    <span className="font-bold" style={{ color: t.primaryColor }}>
                      ₹ 14,850.00
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Theme applies instantly across all tools, estimate sheets, PDF viewers & CAD modules.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-black transition-all shadow-md cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
