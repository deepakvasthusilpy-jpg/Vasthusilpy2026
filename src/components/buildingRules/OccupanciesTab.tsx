import React, { useState } from "react";
import { OCCUPANCY_GROUPS, OccupancyGroup } from "../../data/buildingRulesData";
import { Layers, Search, ShieldCheck, Car, Maximize2, Bot, Send, Sparkles, RefreshCw, ChevronDown, ChevronUp, Globe } from "lucide-react";

interface OccupanciesTabProps {
  onAskAIWithContext?: (question: string) => void;
}

export const OccupanciesTab: React.FC<OccupanciesTabProps> = ({ onAskAIWithContext }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAI, setExpandedAI] = useState<string | null>(null);
  const [aiQueries, setAiQueries] = useState<Record<string, string>>({});
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({});

  const filteredOccupancies = OCCUPANCY_GROUPS.filter((group) => {
    const matchesSearch =
      searchTerm.trim() === "" ||
      group.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.nameMl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.descriptionMl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.examples.some((ex) => ex.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const handleToggleAI = (groupId: string) => {
    if (expandedAI === groupId) {
      setExpandedAI(null);
    } else {
      setExpandedAI(groupId);
    }
  };

  const handleAskOccupancyAI = async (group: OccupancyGroup) => {
    const query = aiQueries[group.id] || `കേരള കെട്ടിട നിർമ്മാണ ചട്ട പ്രകാരം ${group.code} (${group.nameMl}) കെട്ടിടത്തിന്റെ പ്രധാന അനുമതി പ്രക്രിയകളും നിയമങ്ങളും ചുരുക്കത്തിൽ വിശദീകരിക്കുക.`;
    
    setLoadingAI((prev) => ({ ...prev, [group.id]: true }));

    try {
      const res = await fetch("/api/building-rules/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          ruleContext: `Occupancy Group: ${group.code} - ${group.nameMl} (${group.nameEn}). Min Road Width: ${group.minRoadWidthMeters}m, Max FSI: ${group.maxFSI}, Coverage: ${group.maxCoverage}. Parking Rule: ${group.parkingRuleMl}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI query failed");

      setAiResponses((prev) => ({ ...prev, [group.id]: data.text }));
    } catch (err: any) {
      setAiResponses((prev) => ({
        ...prev,
        [group.id]: `ക്ഷമിക്കണം, സാങ്കേതിക തടസ്സം നേരിട്ടു: ${err.message || "പരാജയപ്പെട്ടു"}`
      }));
    } finally {
      setLoadingAI((prev) => ({ ...prev, [group.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl bg-blueprint-grid">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
                KPBR RULE 25 • OCCUPANCY CLASSIFICATION
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                14 വർഗ്ഗീകരണങ്ങൾ (Group A1 to J)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-400" />
              <span>കെട്ടിട ഉപയോഗ ഗണങ്ങൾ (Occupancy Classifications)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ പ്രകാരമുള്ള എല്ലാ ഉപയോഗ വിഭാഗങ്ങളും, AI വിശകലനവും
            </p>
          </div>

          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ഉപയോഗ ഗണം തിരയുക (Search Group A1, Residential, Shop...)"
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition font-sans"
            />
          </div>
        </div>
      </div>

      {/* Grid of Occupancy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredOccupancies.map((group) => {
          const isAIExpanded = expandedAI === group.id;
          const isAILoading = loadingAI[group.id] || false;
          const aiResponseText = aiResponses[group.id];

          return (
            <div
              key={group.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl transition-all space-y-4 relative overflow-hidden border-slate-800 hover:border-slate-700`}
            >
              {/* Top Header Badge */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl border ${group.badgeColor}`}>
                    {group.code}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    റൂൾ 25 പ്രകാരം
                  </span>
                </div>
                <div className="text-right font-mono text-[11px] text-cyan-400 font-bold">
                  കുറഞ്ഞ റോഡ് വീതി: {group.minRoadWidthMeters} m
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white font-sans tracking-tight">
                  {group.nameMl}
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  {group.nameEn}
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                  {group.descriptionMl}
                </p>
              </div>

              {/* Technical Parameters Matrix */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">പരമാവധി FSI</span>
                  <span className="text-sm font-mono font-black text-cyan-300">{group.maxFSI}</span>
                </div>
                <div className="space-y-0.5 border-x border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">കവേറേജ്</span>
                  <span className="text-sm font-mono font-black text-emerald-300">{group.maxCoverage}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">റോഡ് വീതി</span>
                  <span className="text-sm font-mono font-black text-amber-300">{group.minRoadWidthMeters}m</span>
                </div>
              </div>

              {/* Setback Summary */}
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>സെറ്റ്ബാക്കുകൾ (Required Setbacks):</span>
                </div>
                <p className="text-xs text-slate-200 font-sans">
                  {group.setbackSummaryMl}
                </p>
              </div>

              {/* Parking Rule */}
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400 uppercase">
                  <Car className="w-3.5 h-3.5" />
                  <span>പാർക്കിംഗ് മാനദണ്ഡം (Parking Norms):</span>
                </div>
                <p className="text-xs text-slate-200 font-sans">
                  {group.parkingRuleMl}
                </p>
              </div>

              {/* Low Risk Category Note if applicable */}
              {group.isLowRiskThresholdMl && (
                <div className="bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl text-xs text-emerald-300 font-sans flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Low Risk Category:</strong> {group.isLowRiskThresholdMl}</span>
                </div>
              )}

              {/* Examples */}
              <div className="pt-1">
                <span className="text-[11px] font-mono text-slate-400 font-bold block mb-1.5 uppercase">
                  ഉദാഹരണങ്ങൾ (Examples):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.examples.map((ex, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-0.5 rounded-lg font-sans"
                    >
                      • {ex}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Integration Section Under Each Occupancy */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleToggleAI(group.id)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-950 hover:bg-slate-900 text-cyan-400 border border-slate-800 hover:border-cyan-500/50 px-4 py-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>{group.code} AI വിശകലനവും ചോദ്യങ്ങളും (Ask AI)</span>
                    <span className="bg-cyan-950 text-cyan-300 text-[9px] px-1.5 py-0.2 rounded border border-cyan-800">
                      vasthusilpy-ai
                    </span>
                  </div>
                  {isAIExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAIExpanded && (
                  <div className="mt-3 p-4 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 border-b border-slate-800 pb-2">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{group.code} അനുബന്ധ AI ചോദ്യങ്ങൾ</span>
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiQueries[group.id] || ""}
                        onChange={(e) =>
                          setAiQueries((prev) => ({ ...prev, [group.id]: e.target.value }))
                        }
                        placeholder={`${group.code} നായുള്ള ചോദ്യം ചോദിക്കുക (ഉദാ: ഫയർ NOC നിർബന്ധമാണോ?)...`}
                        className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-sans"
                      />
                      <button
                        onClick={() => handleAskOccupancyAI(group)}
                        disabled={isAILoading}
                        className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        {isAILoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>ചോദിക്കുക</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Show preset quick questions */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          setAiQueries((prev) => ({
                            ...prev,
                            [group.id]: `${group.code} കെട്ടിടങ്ങൾക്ക് ആവശ്യമായ ഫയർ ആന്റ് സാനിറ്റേഷൻ നിബന്ധനകൾ എന്തൊക്കെയാണ്?`
                          }));
                        }}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 cursor-pointer"
                      >
                        🔥 Fire & Sanitation Rules
                      </button>
                      <button
                        onClick={() => {
                          setAiQueries((prev) => ({
                            ...prev,
                            [group.id]: `${group.code} കെട്ടിടത്തിന് റോഡ് വീതി അനുസരിച്ച് എത്ര നിലകൾ പണിയാം?`
                          }));
                        }}
                        className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-800 cursor-pointer"
                      >
                        🏢 Road Width vs Floors
                      </button>
                    </div>

                    {/* AI Output Box */}
                    {aiResponseText && (
                      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-xs text-slate-200 space-y-2 whitespace-pre-wrap font-sans">
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 uppercase">
                          <Bot className="w-3 h-3" />
                          <span>vasthusilpy-ai മറുപടി:</span>
                        </div>
                        <div>{aiResponseText}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
