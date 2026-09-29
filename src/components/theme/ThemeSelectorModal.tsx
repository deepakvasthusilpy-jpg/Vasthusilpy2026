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
  Building2,
  Zap,
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

const THEME_ICONS: Record<string, React.FC<{ className?: string }>> = {
  tech_startup: Zap
};

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose
}) => {
  const { theme, themesList } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide text-white uppercase">
                  Active Theme: Futuristic Tech
                </h2>
                <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cutting-edge cyber aesthetic for all drafting, estimates, site inspections & CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="p-6">
          {themesList.map((t: ThemeOption) => {
            const isSelected = theme === t.id;
            const Icon = THEME_ICONS[t.id] || Zap;

            return (
              <div
                key={t.id}
                className="relative rounded-xl p-5 border border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg"
                style={{
                  backgroundColor: t.bgPreview,
                  color: t.textPreview
                }}
              >
                {/* Selection Ribbon */}
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-cyan-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[11px] font-black font-mono shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>ACTIVE DEFAULT</span>
                </div>

                <div>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shadow-inner"
                      style={{
                        backgroundColor: t.cardPreview,
                        borderColor: t.borderPreview,
                        borderWidth: 1,
                        color: t.primaryColor
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight flex items-center gap-1.5" style={{ color: t.textPreview }}>
                        {t.name}
                      </h3>
                      <div className="text-xs opacity-75 font-mono">
                        {t.nameMl}
                      </div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <div
                    className="text-xs font-semibold mb-2"
                    style={{ color: t.primaryColor }}
                  >
                    {t.tagline}
                  </div>

                  {/* Description */}
                  <p className="text-xs opacity-85 leading-relaxed mb-4">
                    {t.description}
                  </p>
                </div>

                {/* Color Palette Palette Swatches & Miniature Preview */}
                <div className="pt-3 border-t" style={{ borderColor: t.borderPreview }}>
                  <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mb-2">
                    <span>PALETTE MATRIX</span>
                    <span className="uppercase">{t.colorScheme} Base</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 h-7 rounded-md overflow-hidden p-0.5" style={{ backgroundColor: t.cardPreview, borderColor: t.borderPreview, borderWidth: 1 }}>
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.bgPreview }} title="Background Canvas" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.cardPreview }} title="Card Panel" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.borderPreview }} title="Border Color" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.primaryColor }} title="Primary Accent" />
                    <div className="h-full rounded-sm" style={{ backgroundColor: t.accentColor }} title="Highlight Accent" />
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
            <span>Futuristic Tech Theme is applied universally across all views.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-black transition-all shadow-md cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
