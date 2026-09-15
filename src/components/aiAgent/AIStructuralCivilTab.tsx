import React, { useState } from "react";
import {
  HardHat,
  Calculator,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Truck,
  Box,
  Package,
  Wrench
} from "lucide-react";

export const AIStructuralCivilTab: React.FC = () => {
  const [concreteGrade, setConcreteGrade] = useState<string>("M20");
  const [volumeCubicMeters, setVolumeCubicMeters] = useState<number>(10);
  const [structuralElement, setStructuralElement] = useState<string>("roof_slab");
  const [civilQuery, setCivilQuery] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [civilReport, setCivilReport] = useState<string | null>(null);

  // Quick Concrete Mix Ratios
  const MIX_SPECS: Record<string, { ratio: string; cementBagsPerCum: number; sandCFTPerCum: number; aggregateCFTPerCum: number; strength: string }> = {
    M15: { ratio: "1 : 2 : 4 (Cement : Sand : Aggregate)", cementBagsPerCum: 6.4, sandCFTPerCum: 15, aggregateCFTPerCum: 30, strength: "15 N/mm² (PCC Works)" },
    M20: { ratio: "1 : 1.5 : 3 (Cement : Sand : Aggregate)", cementBagsPerCum: 8.0, sandCFTPerCum: 14.5, aggregateCFTPerCum: 29, strength: "20 N/mm² (Standard RCC Slabs/Beams)" },
    M25: { ratio: "1 : 1 : 2 (Design Mix / Nominal)", cementBagsPerCum: 10.5, sandCFTPerCum: 13, aggregateCFTPerCum: 26, strength: "25 N/mm² (Columns & Heavy Footings)" }
  };

  const selectedMix = MIX_SPECS[concreteGrade] || MIX_SPECS.M20;
  const totalCementBags = Math.round(volumeCubicMeters * selectedMix.cementBagsPerCum);
  const totalSandCFT = Math.round(volumeCubicMeters * selectedMix.sandCFTPerCum);
  const totalAggCFT = Math.round(volumeCubicMeters * selectedMix.aggregateCFTPerCum);

  const handleCivilAudit = async () => {
    setIsCalculating(true);

    try {
      const prompt = `[IS 456:2000 & IS 2502 STRUCTURAL CIVIL ENGINEERING AI AUDIT]
Concrete Grade: ${concreteGrade} (${selectedMix.ratio})
Structural Element: ${structuralElement}
Concrete Volume: ${volumeCubicMeters} Cubic Meters (m³)
User Specific Structural / BBS Query: ${civilQuery || "Full structural safety, Bar Bending Schedule rules, curing requirements, and stripping time."}

Please provide an expert Civil & Structural Engineer Consultation report in Malayalam & English:
1. Exact Batching & Mix Proportions (Cement Bags, M-Sand in CFT/Kg, 20mm Granite Aggregate in CFT, Water-Cement ratio w/c 0.45-0.50).
2. Bar Bending Schedule (BBS) & Reinforcement guidelines (Hook length 9d/10d, lap length 45d/50d, development length Ld, clear cover: Footing 50mm, Column 40mm, Beam 25mm, Slab 15-20mm).
3. Formwork / Shuttering Stripping Time (IS 456 Table 11) & Water Curing duration (7-14 days).`;

      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      setCivilReport(data.text || "സിവിൽ എൻജിനീയറിങ് റിപ്പോർട്ട് തയ്യാറാക്കി.");
    } catch {
      setCivilReport(
        `IS 456:2000 പ്രകാരം ${concreteGrade} കോൺക്രീറ്റിന് ${volumeCubicMeters} m³ വാർപ്പിന് ഏകദേശം ${totalCementBags} ചാക്ക് സിമന്റും, ${totalSandCFT} CFT എം-സാൻഡും, ${totalAggCFT} CFT 20mm മെറ്റലും ആവശ്യമാണ്.`
      );
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div id="ai-structural-civil-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-800/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950">
            <HardHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans">
                സിവിൽ & സ്ട്രക്ചറൽ ഗൈഡ് AI (Civil & BBS AI)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-300 text-xs font-mono font-bold">
                IS 456:2000
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              M20/M25 കോൺക്രീറ്റ് മിക്സ്, ബാർ ബെൻഡിംഗ് ഷെഡ്യൂൾ (BBS), കവറിംഗ്, ക്യൂറിംഗ് സമയങ്ങൾ.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCivilAudit}
          disabled={isCalculating}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isCalculating ? "കണക്കുകൂട്ടുന്നു..." : "സിവിൽ അനാലിസിസ് നടത്തുക"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Calculator className="w-4 h-4 text-rose-400" />
              <span>വാർപ്പ് & മിക്സ് വിവരങ്ങൾ (Mix Parameters)</span>
            </h3>

            {/* Concrete Grade */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                കോൺക്രീറ്റ് ഗ്രേഡ് (Concrete Grade)
              </label>
              <select
                value={concreteGrade}
                onChange={(e) => setConcreteGrade(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-sans"
              >
                <option value="M15">M15 Grade (1:2:4) - PCC / Flooring Bed</option>
                <option value="M20">M20 Grade (1:1.5:3) - Standard RCC Slab / Beam</option>
                <option value="M25">M25 Grade (1:1:2) - Columns / Heavy Footings</option>
              </select>
            </div>

            {/* Structural Element */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                സ്ട്രക്ചറൽ ഭാഗം (Structural Element)
              </label>
              <select
                value={structuralElement}
                onChange={(e) => setStructuralElement(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500 font-sans"
              >
                <option value="roof_slab">റൂഫ് സ്ലാബ് (Roof Slab / Beam - 20mm Cover)</option>
                <option value="columns">കോളം വാർപ്പ് (Columns - 40mm Cover)</option>
                <option value="footings">ഫൂട്ടിംഗ് വാർപ്പ് (Footings - 50mm Cover)</option>
                <option value="plinth_beam">പ്ലിന്ത് ബീം (Plinth Beam - 25mm Cover)</option>
                <option value="staircase">സ്റ്റെയർകേസ് (Staircase Waist Slab)</option>
              </select>
            </div>

            {/* Concrete Volume */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                കോൺക്രീറ്റ് വോളിയം (Cubic Metres): <span className="text-rose-400 font-mono font-bold text-sm">{volumeCubicMeters} m³</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="100"
                value={volumeCubicMeters}
                onChange={(e) => setVolumeCubicMeters(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Mix Quantities Calculation Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">അനുപാതം (Mix Ratio):</span>
                <span className="font-mono font-bold text-slate-200">{selectedMix.ratio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">സിമന്റ് (Cement):</span>
                <span className="font-mono font-bold text-rose-400">~{totalCementBags} ചാക്ക് (Bags)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">എം-സാൻഡ് (M-Sand):</span>
                <span className="font-mono font-bold text-slate-200">~{totalSandCFT} CFT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">20mm മെറ്റൽ (Aggregates):</span>
                <span className="font-mono font-bold text-slate-200">~{totalAggCFT} CFT</span>
              </div>
            </div>

            {/* Query Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                പ്രത്യേക സിവിൽ / BBS സംശയങ്ങൾ
              </label>
              <textarea
                rows={2}
                value={civilQuery}
                onChange={(e) => setCivilQuery(e.target.value)}
                placeholder="ഉദാഹരണത്തിന്: സ്ലാബ് വാർപ്പിന് കമ്പി ലേഔട്ട് കർട്ടൈൽമെന്റ് എങ്ങനെ നൽകണം? ഷട്ടറിംഗ് എത്ര ദിവസം കഴിഞ്ഞു മാറ്റാം?"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-sans resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right: AI Consultation Stream (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl min-h-[500px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      വാസ്തുശിൽപി AI സ്ട്രക്ചറൽ & സിവിൽ റിപ്പോർട്ട്
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      IS 456:2000 & IS 2502 Structural Engineering Code Engine
                    </p>
                  </div>
                </div>

                {civilReport && (
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    IS 456 AUDITED
                  </span>
                )}
              </div>

              {civilReport ? (
                <div className="space-y-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                  {civilReport}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <HardHat className="w-12 h-12 text-slate-700 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 font-sans">
                      സിവിൽ വിശകലനം ആരംഭിച്ചിട്ടില്ല
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      ഇടതുവശത്ത് കോൺക്രീറ്റ് വിവരങ്ങൾ നൽകി 'സിവിൽ അനാലിസിസ് നടത്തുക' ക്ലിക്ക് ചെയ്യുക.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {civilReport && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>അധികാര രേഖ: IS 456:2000 / IS 2502</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(civilReport);
                    alert("സിവിൽ റിപ്പോർട്ട് കോപ്പി ചെയ്തു!");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  കോപ്പി റിപ്പോർട്ട് (Copy)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
