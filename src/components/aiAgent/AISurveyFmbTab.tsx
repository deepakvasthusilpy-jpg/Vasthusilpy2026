import React, { useState } from "react";
import {
  MapPin,
  Sparkles,
  Calculator,
  Compass,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
  Bot,
  Ruler,
  HelpCircle
} from "lucide-react";

export const AISurveyFmbTab: React.FC = () => {
  const [fmbQuery, setFmbQuery] = useState("");
  const [centValue, setCentValue] = useState<number>(5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [surveyReport, setSurveyReport] = useState<string | null>(null);

  // Conversion calculations
  const sqMeters = (centValue * 40.4686).toFixed(2);
  const sqFeet = (centValue * 435.6).toFixed(1);
  const ares = (centValue * 0.404686).toFixed(3);
  const acres = (centValue / 100).toFixed(3);

  const handleSurveyAudit = async (customQ?: string) => {
    setIsAnalyzing(true);
    const qToSend = customQ || fmbQuery || "Explain how to interpret FMB tie lines, offsets, and G-line measurements.";

    try {
      const prompt = `[LAND SURVEY & FMB FIELD MEASUREMENT BOOK AI AUDIT]
Land Area Reference: ${centValue} Cent (${sqMeters} Sq.M / ${sqFeet} Sq.Ft / ${ares} Are / ${acres} Acre).
User Inquiry: ${qToSend}

Please provide an expert Kerala Land Survey consultation in Malayalam and English covering:
1. Exact mathematical breakdown of Cent / Are / Acre / Sq.Ft conversions.
2. Interpretation of FMB G-Line, Ladder (ലാഡർ), Offsets, Tie Lines (ടൈ ലൈൻ), and Sub-division stone demarcation.
3. Steps for resolving field boundary overlaps or Village Office / Taluk survey re-measurement procedures.`;

      const res = await fetch("/api/survey/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      setSurveyReport(data.text || data.reply || "സർവ്വേ പരിശോധന റിപ്പോർട്ട് തയ്യാറാക്കി.");
    } catch {
      setSurveyReport(
        `കേരള സർവ്വേ മാനുവൽ പ്രകാരം 1 സെന്റ് = 435.6 ചതുരശ്ര അടി (40.47 ചതുരശ്ര മീറ്റർ). FMB സ്കെച്ചിൽ ബേസ് ലൈൻ (G-Line) അടിസ്ഥാനമാക്കിയാണ് ഓഫ്സെറ്റ് അളവുകൾ രേഖപ്പെടുത്തുന്നത്.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="ai-survey-fmb-tab" className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-800/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-950">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans">
                ഭൂമി സർവ്വേ & FMB സ്കെച്ച് AI (Land Survey & FMB AI)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-700 text-blue-300 text-xs font-mono font-bold">
                GEO-04 SURVEY
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              FMB ലാഡർ ഡാറ്റ, ടൈ ലൈനുകൾ, ഓഫ്സെറ്റുകൾ, യൂണിറ്റ് കൺവെർഷൻ, അതിർത്തി തർക്ക മാർഗ്ഗനിർദ്ദേശങ്ങൾ.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSurveyAudit()}
          disabled={isAnalyzing}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-mono font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAnalyzing ? "വിശകലനം ചെയ്യുന്നു..." : "സർവ്വേ AI അനാലിസിസ്"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Land Converter (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              <span>ലാൻഡ് യൂണിറ്റ് കൺവെർട്ടർ (Instant Converter)</span>
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                സെന്റ് അളവ് നൽകുക (Cent Area): <span className="text-blue-400 font-mono font-bold text-sm">{centValue} Cent</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={centValue}
                onChange={(e) => setCentValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Instant Conversion Cards */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px]">ചതുരശ്ര അടി (Sq.Ft)</span>
                <p className="font-mono font-bold text-white text-sm mt-0.5">{sqFeet} Sq.Ft</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px]">ചതുരശ്ര മീറ്റർ (Sq.M)</span>
                <p className="font-mono font-bold text-white text-sm mt-0.5">{sqMeters} Sq.M</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px]">ആർ (Ares)</span>
                <p className="font-mono font-bold text-blue-400 text-sm mt-0.5">{ares} Are</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 font-mono text-[10px]">ഏക്കർ (Acres)</span>
                <p className="font-mono font-bold text-blue-400 text-sm mt-0.5">{acres} Acre</p>
              </div>
            </div>

            {/* Survey Question */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 font-sans">
                സർവ്വേ & FMB സംശയങ്ങൾ (Survey Question)
              </label>
              <textarea
                rows={3}
                value={fmbQuery}
                onChange={(e) => setFmbQuery(e.target.value)}
                placeholder="ഉദാഹരണത്തിന്: FMB യിൽ ലാഡർ റീഡിംഗ് എങ്ങനെ വായിക്കണം? അതിർത്തിക്കല്ല് കാണാനില്ലെങ്കിൽ വില്ലേജ് ഓഫീസിൽ അപേക്ഷിക്കേണ്ട ഫോം ഏതാണ്?"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans resize-none"
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
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      വാസ്തുശിൽപി AI സർവ്വേ & FMB റിപ്പോർട്ട്
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Kerala Revenue & Taluk Survey Manual Engine
                    </p>
                  </div>
                </div>

                {surveyReport && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    SURVEY ANALYZED
                  </span>
                )}
              </div>

              {surveyReport ? (
                <div className="space-y-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                  {surveyReport}
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <MapPin className="w-12 h-12 text-slate-700 animate-pulse" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300 font-sans">
                      സർവ്വേ പരിശോധന ആരംഭിച്ചിട്ടില്ല
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      ഇടതുവശത്ത് ലാൻഡ് അളവ് നൽകി 'സർവ്വേ AI അനാലിസിസ്' ക്ലിക്ക് ചെയ്യുക.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {surveyReport && (
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>അധികാര രേഖ: Kerala Land Survey Manual</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(surveyReport);
                    alert("സർവ്വേ റിപ്പോർട്ട് കോപ്പി ചെയ്തു!");
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
