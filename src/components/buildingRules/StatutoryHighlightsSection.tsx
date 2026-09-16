import React from "react";
import { STATUTORY_HIGHLIGHTS } from "../../data/occupancyComparisonData";
import {
  ShieldAlert,
  Truck,
  Bike,
  Accessibility,
  Minimize2,
  CheckCircle2,
  Sparkles,
  Info
} from "lucide-react";

export const StatutoryHighlightsSection: React.FC = () => {
  const getIcon = (ruleNo: string) => {
    switch (ruleNo) {
      case "Rule 26(6)":
        return <ShieldAlert className="w-5 h-5 text-cyan-400" />;
      case "Table 10A":
        return <Truck className="w-5 h-5 text-amber-400" />;
      case "Rule 29(1)":
        return <Bike className="w-5 h-5 text-emerald-400" />;
      case "Rule 42":
        return <Accessibility className="w-5 h-5 text-purple-400" />;
      case "Rule 50":
        return <Minimize2 className="w-5 h-5 text-sky-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase">
              KPBR 2019 AMENDED (SRO 1241/2025)
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Key Highlights & Statutory Exceptions
            </span>
          </div>
          <h3 className="text-xl font-bold text-white font-sans flex items-center gap-2">
            <span>പ്രധാന ചട്ടങ്ങളും പ്രത്യേക ഇളവുകളും (Aspect Highlights & Exceptions)</span>
          </h3>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Rules 26(6), Table 10A, 29(1), 42 & 50
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STATUTORY_HIGHLIGHTS.map((item, idx) => {
          return (
            <div
              key={item.ruleNo}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg flex flex-col justify-between space-y-3 transition-all relative overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {getIcon(item.ruleNo)}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                        {item.ruleNo}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {item.badge}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    #0{idx + 1}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white font-sans">
                    {item.title}
                  </h4>
                  <p className="text-[11px] font-sans text-slate-400">
                    {item.titleMl}
                  </p>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {item.summary}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Statutory Clauses & Specifics:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-300 font-sans">
                  {item.details.map((d, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-mono text-xs leading-none mt-0.5">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
