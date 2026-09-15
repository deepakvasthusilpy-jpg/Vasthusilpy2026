import React, { useState } from "react";
import {
  FileSpreadsheet,
  Calculator,
  Sparkles,
  Layers,
  Coins,
  CheckCircle2,
  Bot,
  Building,
  ArrowRight,
  TrendingDown,
  FileCheck2
} from "lucide-react";

export const AIEstimateBoqTab: React.FC = () => {
  const [totalAreaSqFt, setTotalAreaSqFt] = useState<number>(1200);
  const [constructionType, setConstructionType] = useState<string>("residential_standard");
  const [targetBudgetLakhs, setTargetBudgetLakhs] = useState<number>(28);
  const [estimateQuery, setEstimateQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [estimateReport, setEstimateReport] = useState<string | null>(null);

  // Quick Kerala Materials Estimator Formula
  const cementBagsApprox = Math.round(totalAreaSqFt * 0.42); // ~420 bags for 1000 sqft
  const steelTonsApprox = ((totalAreaSqFt * 3.2) / 1000).toFixed(2); // ~3.2 kg per sqft
  const sandCFTApprox = Math.round(totalAreaSqFt * 1.8);
  const graniteAggregateCFTApprox = Math.round(totalAreaSqFt * 1.35);

  const handleGenerateBoq = async () => {
    setIsGenerating(true);

    try {
      const prompt = `[KERALA PWD DSR RATE ESTIMATE & BOQ AI ANALYSIS]
Total Built-up Area: ${totalAreaSqFt} Sq.Ft (${(totalAreaSqFt / 10.764).toFixed(1)} Sq.M)
Construction Grade: ${constructionType}
Client Target Budget: ₹${targetBudgetLakhs} Lakhs
Specific Request / Line Items: ${estimateQuery || "Full BOQ line item breakdown and cost optimization tips."}

Please generate an exhaustive Quantity Surveying & Cost Estimation Report in Malayalam and English based on current 2026 Kerala construction market & PWD DSR rates:
1. Stage-wise Cost Breakdown:
   - Substructure & Foundation (Earthwork, RR Masonry, PCC, DPC)
   - Superstructure (RCC Columns, Beams, Roof Slab, Brick/Block Masonry)
   - Finishing (Plastering, Putty, Painting, Flooring Tile/Granite)
   - Electrical, Plumbing, Sanitary, Doors & Windows
2. Material Quantities Estimation (Cement Bags, Fe550 Steel TMT, M-Sand, Aggregates, Laterite/Concrete Blocks).
3. Cost Engineering & Optimization Suggestions (where to save 10-15% without compromising structural integrity).`;

      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      setEstimateReport(data.text || "എസ്റ്റിമേറ്റ് റിപ്പോർട്ട് തയ്യാറാക്കി.");
    } catch {
      setEstimateReport(
        `കേരളത്തിൽ ${totalAreaSqFt} Sq.Ft വീട് നിർമ്മാണത്തിന് ഏകദേശം ₹${(totalAreaSqFt * 2300) / 100000} ലക്ഷം രൂപ മുതൽ ₹${(totalAreaSqFt * 2800) / 100000} ലക്ഷം രൂപ വരെ ചിലവ് പ്രതീക്ഷിക്കാം (Average ₹2,300 - ₹2,800 per Sq.Ft). സിമന്റ്: ~${cementBagsApprox} ചാക്ക്, കമ്പി: ~${steelTonsApprox} ടൺ.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div id="ai-estimate-boq-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 border border-amber-800/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans">
                റേറ്റ് എസ്റ്റിമേറ്റർ & BOQ AI (Estimate & BOQ AI)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 text-xs font-mono font-bold">
                PWD DSR 2026
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              മെറ്റീരിയൽ അളവുകൾ, ലേബർ നിരക്കുകൾ, സ്റ്റേജ് ബില്ലിംഗ്, ചിലവ് കുറയ്ക്കൽ വിശകലനം.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateBoq}
          disabled={isGenerating}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isGenerating ? "കണക്കുകൂട്ടുന്നു..." : "BOQ എസ്റ്റിമേറ്റ് തയ്യാറാക്കുക"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>നിർമ്മാണ വിവരങ്ങൾ (Construction Specs)</span>
            </h3>

            {/* Total Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                ആകെ വിസ്തീർണ്ണം (Total Area): <span className="text-amber-400 font-mono font-bold text-sm">{totalAreaSqFt} Sq.Ft</span>
              </label>
              <input
                type="number"
                step="50"
                min="200"
                max="10000"
                value={totalAreaSqFt}
                onChange={(e) => setTotalAreaSqFt(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Specification Grade */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                നിർമ്മാണ ഗ്രേഡ് (Specification Standard)
              </label>
              <select
                value={constructionType}
                onChange={(e) => setConstructionType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans"
              >
                <option value="residential_economy">Economy Grade (₹1,900 - ₹2,200/Sq.Ft)</option>
                <option value="residential_standard">Standard Premium Grade (₹2,300 - ₹2,700/Sq.Ft)</option>
                <option value="residential_luxury">Luxury Villa Grade (₹2,800 - ₹3,600/Sq.Ft)</option>
                <option value="commercial_shell">Commercial Complex / Shell (₹1,800 - ₹2,400/Sq.Ft)</option>
              </select>
            </div>

            {/* Target Budget */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                ഉദ്ദേശിക്കുന്ന ബജറ്റ് (Target Budget): <span className="text-amber-400 font-mono font-bold text-sm">₹{targetBudgetLakhs} ലക്ഷം</span>
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="500"
                value={targetBudgetLakhs}
                onChange={(e) => setTargetBudgetLakhs(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick Material Takeoff Cards */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>മെറ്റീരിയൽ ഏകദേശ അളവ് (Thumb Rule Takeoff):</span>
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">സിമന്റ് (Cement):</span>
                  <p className="font-mono font-bold text-amber-400 text-xs">~{cementBagsApprox} ചാക്ക് (Bags)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">കമ്പി (Fe550 Steel):</span>
                  <p className="font-mono font-bold text-amber-400 text-xs">~{steelTonsApprox} ടൺ (Tons)</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">എം-സാൻഡ് (M-Sand):</span>
                  <p className="font-mono font-bold text-slate-200 text-xs">~{sandCFTApprox} CFT</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">മെറ്റൽ (20mm Aggregate):</span>
                  <p className="font-mono font-bold text-slate-200 text-xs">~{graniteAggregateCFTApprox} CFT</p>
                </div>
              </div>
            </div>

            {/* Specific Request */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                പ്രത്യേക എസ്റ്റിമേറ്റ് ആവശ്യങ്ങൾ (Custom BOQ Inquiry)
              </label>
              <textarea
                rows={2}
                value={estimateQuery}
                onChange={(e) => setEstimateQuery(e.target.value)}
                placeholder="ഉദാഹരണത്തിന്: ഫ്ലോറിംഗിൽ ഗ്രാനൈറ്റ് vs വിട്രിഫൈഡ് ടൈൽ ചിലവ് വ്യത്യാസം എത്ര? ഫൗണ്ടേഷൻ RR vs പില്ലർ ചിലവ് താരതമ്യം."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-sans resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right: AI Estimate Stream (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl min-h-[500px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      വാസ്തുശിൽപി AI BOQ & റേറ്റ് റിപ്പോർട്ട്
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Kerala PWD Schedule of Rates (DSR) & Cost Engineering
                    </p>
                  </div>
                </div>

                {estimateReport && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ESTIMATED
                  </span>
                )}
              </div>

              {estimateReport ? (
                <div className="space-y-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                  {estimateReport}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <FileSpreadsheet className="w-12 h-12 text-slate-700 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 font-sans">
                      എസ്റ്റിമേറ്റ് വിശകലനം ആരംഭിച്ചിട്ടില്ല
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      ഇടതുവശത്ത് സ്ക്വയർ ഫീറ്റ് വിവരങ്ങൾ നൽകി 'BOQ എസ്റ്റിമേറ്റ് തയ്യാറാക്കുക' ക്ലിക്ക് ചെയ്യുക.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {estimateReport && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>അധികാര രേഖ: Kerala PWD DSR Schedule</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(estimateReport);
                    alert("എസ്റ്റിമേറ്റ് റിപ്പോർട്ട് കോപ്പി ചെയ്തു!");
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
