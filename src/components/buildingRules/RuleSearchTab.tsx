import React, { useState, useMemo } from "react";
import {
  BUILDING_RULES_LIST,
  BuildingRuleItem,
  searchBuildingRules,
  extractNumbers
} from "../../data/buildingRulesData";
import {
  Search,
  Filter,
  BookOpen,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Layers,
  FileText,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface RuleSearchTabProps {
  onAskAIAboutRule?: (ruleText: string) => void;
  onNavigateToCalculator?: () => void;
  onNavigateToPdfViewer?: () => void;
}

export const RuleSearchTab: React.FC<RuleSearchTabProps> = ({
  onAskAIAboutRule,
  onNavigateToCalculator,
  onNavigateToPdfViewer
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedRule, setExpandedRule] = useState<string | null>(
    "S.R.O. 682/2026 (2026 Gazette Amendment)"
  );
  const [copiedRule, setCopiedRule] = useState<string | null>(null);

  const categories = [
    "ALL",
    "2026 Amendments",
    "Setbacks & Height",
    "Permits",
    "Parking",
    "Sanitation & Fire",
    "Low Risk",
    "Safety & Services",
    "Regularisation",
    "Appeals & Penalties",
    "General"
  ];

  // Quick search keywords presets
  const popularKeywords = [
    { label: "2026 ഭേദഗതി (Gazette)", query: "2026" },
    { label: "Rule 26 (Setbacks)", query: "26" },
    { label: "Table 4 (മുറ്റങ്ങളുടെ അളവ്)", query: "table 4" },
    { label: "Rule 27 (FSI & Coverage)", query: "27" },
    { label: "Rule 29 (Parking Norms)", query: "29" },
    { label: "Table 9 (പാർക്കിംഗ് നിരക്കുകൾ)", query: "table 9" },
    { label: "Rule 33 (AC Height 2.4m)", query: "33" },
    { label: "Rule 75 (Well & Septic 7.5m)", query: "75" },
    { label: "Rule 76 (Rainwater Tank)", query: "76" },
    { label: "Low Risk (300 Sq.m)", query: "low risk" },
    { label: "Rule 8 (Permit Exemptions)", query: "8" },
    { label: "Rule 40 (Lift & Elevators)", query: "40" },
    { label: "Rule 42 (Differently Abled Ramp)", query: "42" },
    { label: "Blank Wall 50cm (തുറസ്സില്ലാത്ത മതിൽ)", query: "blank wall" }
  ];

  // Perform search using enhanced search engine
  const filteredRules = useMemo(() => {
    return searchBuildingRules(searchTerm, selectedCategory);
  }, [searchTerm, selectedCategory]);

  const handleCopyRule = (rule: BuildingRuleItem) => {
    const textToCopy = `${rule.ruleNumber} - ${rule.titleMl} (${rule.titleEn})\n\n[സംഗ്രഹം / Summary]:\n${rule.summaryMl}\n\n[English Summary]:\n${rule.summaryEn}\n\n[പ്രധാന കാര്യങ്ങൾ / Key Points]:\n${rule.keyPointsMl.map((pt, i) => `${i + 1}. ${pt}`).join("\n")}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedRule(rule.ruleNumber);
    setTimeout(() => setCopiedRule(null), 2500);
  };

  // Helper to highlight matching text
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const tokens = highlight.trim().split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-bold"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl bg-blueprint-grid relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
                KPBR RULE SEARCH ENGINE & GAZETTE INDEX
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {filteredRules.length} വിധികൾ കണ്ടെത്തി
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span>കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ തിരച്ചിൽ (Rule Search)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ 2019, 2024 & 2026 ഗസറ്റ് ഭേദഗതികൾ ചട്ട നമ്പർ, കീവേഡ്, വിഷയം എന്നിവ വഴി തിരയുക
            </p>
          </div>

          {/* Search Bar Input */}
          <div className="w-full md:w-96 relative">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ചട്ടം നമ്പർ (e.g. 26, 75, 29), കീവേഡ് (e.g. setback, AC height, parking)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition font-sans shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Popular Quick Keyword Suggestions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin relative z-10">
          <span className="text-[11px] font-mono font-bold text-cyan-400 shrink-0 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>ദ്രുത തിരച്ചിൽ:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {popularKeywords.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setSearchTerm(item.query);
                  setSelectedCategory("ALL");
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-mono transition border cursor-pointer shrink-0 ${
                  searchTerm === item.query
                    ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                    : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-800/80 relative z-10">
          <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 mr-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>വിഭാഗങ്ങൾ:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl font-mono transition border cursor-pointer ${
                selectedCategory === cat
                  ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md"
                  : "bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              {cat === "ALL" ? "എല്ലാം (All Rules)" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Result Cards */}
      {filteredRules.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-slate-200 font-sans">
            &apos;{searchTerm}&apos; എന്ന വാക്ക് അനുയോജ്യമായ ചട്ടങ്ങളിൽ കണ്ടെത്തിയില്ല
          </h3>
          <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
            ചട്ട നമ്പർ (ഉദാ: 26, 75, 33), കീവേഡ് (ഉദാ: setback, front yard, parking, fsi, septic) എന്നിവ നൽകുക.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            {selectedCategory !== "ALL" && (
              <button
                onClick={() => setSelectedCategory("ALL")}
                className="px-4 py-2 bg-cyan-500 text-slate-950 text-xs font-bold font-mono rounded-xl hover:bg-cyan-400 cursor-pointer"
              >
                എല്ലാ വിഭാഗങ്ങളിലും തിരയുക (Search All Categories)
              </button>
            )}
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-slate-800 text-slate-200 text-xs font-bold font-mono rounded-xl hover:bg-slate-700 cursor-pointer"
            >
              തിരച്ചിൽ പുനഃസജ്ജമാക്കുക (Clear Search)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRules.map((rule) => {
            const isExpanded = expandedRule === rule.ruleNumber;
            return (
              <div
                key={rule.ruleNumber}
                className={`bg-slate-900/90 border rounded-2xl transition-all overflow-hidden ${
                  isExpanded
                    ? "border-cyan-500/60 shadow-xl shadow-cyan-950/40 bg-slate-900"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Rule Card Header */}
                <div
                  onClick={() =>
                    setExpandedRule(isExpanded ? null : rule.ruleNumber)
                  }
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-lg border border-cyan-800/80">
                        {highlightText(rule.ruleNumber, searchTerm)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {rule.category}
                      </span>
                      {rule.chapter && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                          {rule.chapter}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white font-sans tracking-tight">
                      {highlightText(rule.titleMl, searchTerm)}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {highlightText(rule.titleEn, searchTerm)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyRule(rule);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                      title="നിയമം കോപ്പി ചെയ്യുക (Copy Rule)"
                    >
                      {copiedRule === rule.ruleNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onAskAIAboutRule && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskAIAboutRule(
                            `Explain ${rule.ruleNumber}: ${rule.titleMl} / ${rule.titleEn}`
                          );
                        }}
                        className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI വിശദീകരണം</span>
                      </button>
                    )}

                    <span className="text-xs font-mono text-cyan-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
                      {isExpanded ? (
                        <>
                          <span>ചുരുക്കുക</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>വിശദാംശങ്ങൾ</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Malayalam Summary Box */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>ചട്ടത്തിന്റെ സംഗ്രഹം (Malayalam Summary)</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {highlightText(rule.summaryMl, searchTerm)}
                        </p>
                      </div>

                      {/* English Summary Box */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                          <span>English Summary</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                          {highlightText(rule.summaryEn, searchTerm)}
                        </p>
                      </div>
                    </div>

                    {/* Key Rules Bullet Points */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        <span>പ്രധാന നിബന്ധനകളും അളവുകളും (Key Provisions):</span>
                      </h4>
                      <ul className="space-y-2">
                        {rule.keyPointsMl.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-200 font-sans"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                            <span>{highlightText(point, searchTerm)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Quick action bar inside card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <span>ചട്ട പരാമർശം: KPBR 2019 / SRO 682/2026</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {onNavigateToCalculator && (
                          <button
                            onClick={onNavigateToCalculator}
                            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800 cursor-pointer font-bold"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>കാൽക്കുലേറ്ററിൽ കണക്കാക്കുക</span>
                          </button>
                        )}
                        {onNavigateToPdfViewer && (
                          <button
                            onClick={onNavigateToPdfViewer}
                            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-950 px-3 py-1.5 rounded-lg border border-cyan-800 cursor-pointer font-bold"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>ഗസറ്റ് PDF-ൽ കാണുക</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
