import React, { useState, useMemo, useEffect } from "react";
import {
  BUILDING_RULES_LIST,
  OCCUPANCY_GROUPS,
  BuildingRuleItem,
  OccupancyGroup,
  searchBuildingRulesEngine,
  RuleSearchParams,
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
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Building,
  Hash,
  SlidersHorizontal,
  Info,
  Maximize2,
  Minimize2,
  ExternalLink
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
  // Search Inputs State (Draft / Active)
  const [ruleNumberInput, setRuleNumberInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [selectedOccupancy, setSelectedOccupancy] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Committed Search State (Applied on "Search" button click or Enter)
  const [appliedSearch, setAppliedSearch] = useState<RuleSearchParams>({
    ruleNumber: "",
    keywords: "",
    occupancyType: "ALL",
    category: "ALL"
  });

  // UI States
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({
    "S.R.O. 682/2026 (2026 Gazette Amendment)": true
  });
  const [copiedRule, setCopiedRule] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  // Quick Preset Chips for Rule Numbers
  const quickRuleNumbers = [
    { label: "2026 ഭേദഗതി (Gazette)", val: "2026" },
    { label: "റൂൾ 26 (Setbacks)", val: "26" },
    { label: "റൂൾ 27 (FSI & Coverage)", val: "27" },
    { label: "റൂൾ 28 (Road Width)", val: "28" },
    { label: "റൂൾ 29 (Parking)", val: "29" },
    { label: "റൂൾ 33 (AC Height)", val: "33" },
    { label: "റൂൾ 35 (Stairs)", val: "35" },
    { label: "റൂൾ 40 (Lifts)", val: "40" },
    { label: "റൂൾ 42 (Ramp & Access)", val: "42" },
    { label: "റൂൾ 50 (Small Plots)", val: "50" },
    { label: "റൂൾ 75 (Wells & Septic)", val: "75" },
    { label: "റൂൾ 76 (Rainwater)", val: "76" },
    { label: "റൂൾ 8 (Exemptions)", val: "8" },
    { label: "റൂൾ 89 (Regularisation)", val: "89" }
  ];

  // Quick Keywords Presets
  const quickKeywords = [
    { label: "സെറ്റ്ബാക്ക് (Setback)", val: "setback" },
    { label: "പാർക്കിംഗ് (Parking)", val: "parking" },
    { label: "തറ വിസ്തീർണ്ണം (FSI/FAR)", val: "fsi" },
    { label: "തുറസ്സില്ലാത്ത മതിൽ (Blank Wall 50cm)", val: "blank wall" },
    { label: "മുറിയുടെ ഉയരം (Ceiling Height)", val: "height" },
    { label: "കുറഞ്ഞ റോഡ് വീതി (Road Width)", val: "road width" },
    { label: "കിണറും സെപ്റ്റിക് ടാങ്കും (7.5m)", val: "septic" },
    { label: "മഴവെള്ള സംഭരണി (Rainwater Tank)", val: "rainwater" },
    { label: "ലോ റിസ്ക് കെട്ടിടങ്ങൾ (Low Risk)", val: "low risk" },
    { label: "സ്റ്റെയർകേസ് & എക്സിറ്റ് (Stairs/Exit)", val: "staircase" },
    { label: "ഭിന്നശേഷി സൗഹൃദം (Disabled Ramp)", val: "ramp" },
    { label: "ഫയർ എൻ.ഒ.സി (Fire Safety)", val: "fire" }
  ];

  // Categories list
  const categories = [
    { id: "ALL", labelMl: "എല്ലാ വിഭാഗങ്ങളും", labelEn: "All Categories" },
    { id: "2026 Amendments", labelMl: "2026 ഗസറ്റ് ഭേദഗതികൾ", labelEn: "2026 Amendments" },
    { id: "Setbacks & Height", labelMl: "സെറ്റ്ബാക്കുകളും ഉയരവും", labelEn: "Setbacks & Height" },
    { id: "Permits", labelMl: "പെർമിറ്റും പ്ലാനുകളും", labelEn: "Permits & Plans" },
    { id: "Parking", labelMl: "പാർക്കിംഗ് മാനദണ്ഡങ്ങൾ", labelEn: "Parking Norms" },
    { id: "Sanitation & Fire", labelMl: "ശുചിത്വവും ഫയർ സുരക്ഷയും", labelEn: "Sanitation & Fire" },
    { id: "Safety & Services", labelMl: "ലിഫ്റ്റുകൾ, കിണർ & സൗരോർജ്ജം", labelEn: "Safety & Services" },
    { id: "Low Risk", labelMl: "ലോ റിസ്ക് & ചെറിയ പ്ലോട്ടുകൾ", labelEn: "Low Risk & Small Plots" },
    { id: "Regularisation", labelMl: "അനധികൃത ക്രമവൽക്കരണം", labelEn: "Regularisation" },
    { id: "Appeals & Penalties", labelMl: "അപ്പീലുകളും പിഴകളും", labelEn: "Appeals & Penalties" },
    { id: "General", labelMl: "പൊതു നിർവ്വചനങ്ങൾ & ലൈസൻസുകൾ", labelEn: "General & Licensing" }
  ];

  // Execute Search action
  const handleExecuteSearch = () => {
    setAppliedSearch({
      ruleNumber: ruleNumberInput,
      keywords: keywordsInput,
      occupancyType: selectedOccupancy,
      category: selectedCategory
    });
    setHasSearched(true);
  };

  // Reset Search action
  const handleResetSearch = () => {
    setRuleNumberInput("");
    setKeywordsInput("");
    setSelectedOccupancy("ALL");
    setSelectedCategory("ALL");
    setAppliedSearch({
      ruleNumber: "",
      keywords: "",
      occupancyType: "ALL",
      category: "ALL"
    });
  };

  // Keydown listener for Enter key inside inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleExecuteSearch();
    }
  };

  // Run Search Engine filter on applied parameters
  const searchResults: BuildingRuleItem[] = useMemo(() => {
    return searchBuildingRulesEngine(appliedSearch);
  }, [appliedSearch]);

  // Selected Occupancy details
  const activeOccupancyInfo: OccupancyGroup | undefined = useMemo(() => {
    if (appliedSearch.occupancyType === "ALL") return undefined;
    return OCCUPANCY_GROUPS.find((g) => g.id === appliedSearch.occupancyType);
  }, [appliedSearch.occupancyType]);

  // Check if draft search inputs differ from applied search
  const isSearchStale =
    ruleNumberInput !== appliedSearch.ruleNumber ||
    keywordsInput !== appliedSearch.keywords ||
    selectedOccupancy !== appliedSearch.occupancyType ||
    selectedCategory !== appliedSearch.category;

  // Toggle single rule expansion
  const toggleRuleExpand = (ruleNum: string) => {
    setExpandedRules((prev) => ({
      ...prev,
      [ruleNum]: !prev[ruleNum]
    }));
  };

  // Expand All / Collapse All
  const handleToggleExpandAll = (expand: boolean) => {
    const nextState: Record<string, boolean> = {};
    searchResults.forEach((r) => {
      nextState[r.ruleNumber] = expand;
    });
    setExpandedRules(nextState);
  };

  // Copy Single Rule Text
  const handleCopyRule = (rule: BuildingRuleItem) => {
    const textToCopy = `[${rule.ruleNumber}] ${rule.titleMl} (${rule.titleEn})
വിഭാഗം: ${rule.category} ${rule.chapter ? `| ${rule.chapter}` : ""}

[സംഗ്രഹം / Summary]:
${rule.summaryMl}

[English Summary]:
${rule.summaryEn}

[പ്രധാന വ്യവസ്ഥകൾ / Key Points]:
${rule.keyPointsMl.map((pt, i) => `${i + 1}. ${pt}`).join("\n")}

[English Provisions]:
${rule.keyPointsEn.map((pt, i) => `${i + 1}. ${pt}`).join("\n")}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedRule(rule.ruleNumber);
    setTimeout(() => setCopiedRule(null), 2500);
  };

  // Copy All Search Results
  const handleCopyAllResults = () => {
    if (searchResults.length === 0) return;
    const allText = searchResults
      .map(
        (r, idx) =>
          `----------------------------------------\n${idx + 1}. [${r.ruleNumber}] ${r.titleMl} (${r.titleEn})\n${r.summaryMl}\n${r.keyPointsMl.join("; ")}`
      )
      .join("\n\n");

    navigator.clipboard.writeText(
      `KPBR 2019 / 2026 RULE SEARCH RESULTS (${searchResults.length} Rules Found):\n\n${allText}`
    );
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Helper to highlight matching text
  const highlightText = (text: string, highlight?: string) => {
    if (!highlight || !highlight.trim()) return text;
    const tokens = highlight.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return text;

    try {
      const regex = new RegExp(
        `(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
        "gi"
      );
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
    } catch {
      return text;
    }
  };

  // Aggregate highlights for both keywords and rule number
  const highlightQuery = (text: string) => {
    const combinedTokens = [
      appliedSearch.ruleNumber || "",
      appliedSearch.keywords || ""
    ]
      .filter(Boolean)
      .join(" ");
    return highlightText(text, combinedTokens);
  };

  return (
    <div id="rule-search-engine-root" className="space-y-6">
      {/* Search Tool Console Card */}
      <div
        id="search-console-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl bg-blueprint-grid relative overflow-hidden"
      >
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Engine Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800 uppercase">
                KPBR 2019 • KMBR 2019 • 2026 GAZETTE AMENDMENT SEARCH ENGINE
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                സമ്പൂർണ്ണ ചട്ട തിരച്ചിൽ ഉപകരണം
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <span>കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ തിരയുക (Rule Search Engine)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 font-medium max-w-3xl">
              ചട്ട നമ്പർ (Rule Number), പ്രധാന വാക്കുകൾ (Keywords), കെട്ടിട ഉപയോഗ ഗണം (Occupancy Type) എന്നിവ നൽകി &quot;Search&quot; ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
              <div className="text-[10px] font-mono text-slate-400">കണ്ടെത്തിയ ചട്ടങ്ങൾ</div>
              <div className="text-lg font-mono font-bold text-cyan-400">
                {searchResults.length} <span className="text-xs text-slate-500 font-normal">/ {BUILDING_RULES_LIST.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core Search Filters Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5 relative z-10">
          {/* 1. Rule Number Search Input */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
              <Hash className="w-3.5 h-3.5 text-cyan-400" />
              <span>1. ചട്ട നമ്പർ (Rule Number)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="search-rule-number-input"
                value={ruleNumberInput}
                onChange={(e) => setRuleNumberInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ഉദാ: 26, 27, 29, 33, 75, 2026..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition font-sans shadow-inner"
              />
              {ruleNumberInput && (
                <button
                  type="button"
                  onClick={() => setRuleNumberInput("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Clear Rule Number"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Text / Key Words Search Input */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. വിഷയം / വാക്കുകൾ (Text / Key Words)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="search-keywords-input"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ഉദാ: setback, parking, coverage, FSI, septic tank, height, blank wall, lift..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl pl-3.5 pr-8 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition font-sans shadow-inner"
              />
              {keywordsInput && (
                <button
                  type="button"
                  onClick={() => setKeywordsInput("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
                  title="Clear Keywords"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Occupancy Type Options Dropdown */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. ഉപയോഗ ഗണം (Occupancy Type)</span>
            </label>
            <div className="relative">
              <select
                id="search-occupancy-select"
                value={selectedOccupancy}
                onChange={(e) => setSelectedOccupancy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2.5 text-xs text-slate-100 outline-none transition font-sans appearance-none cursor-pointer shadow-inner pr-9"
              >
                <option value="ALL">എല്ലാ ഉപയോഗ ഗണങ്ങളും (All Occupancies)</option>
                {OCCUPANCY_GROUPS.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.code}: {occ.nameEn} ({occ.nameMl.split("(")[0].trim()})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Secondary Category Filter Row & Action Buttons */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-800/80 relative z-10">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>വിഭാഗം (Category):</span>
            </span>
            <select
              id="search-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none font-mono cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id === "ALL" ? "എല്ലാ വിഷയങ്ങളും (All Categories)" : `${c.labelEn} (${c.labelMl})`}
                </option>
              ))}
            </select>
          </div>

          {/* Prominent Search & Reset Buttons */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              type="button"
              id="search-rules-reset-btn"
              onClick={handleResetSearch}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>റീസെറ്റ് (Clear)</span>
            </button>

            <button
              type="button"
              id="search-rules-submit-btn"
              onClick={handleExecuteSearch}
              className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-lg ${
                isSearchStale
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:from-cyan-400 hover:to-emerald-400 shadow-cyan-950/50 animate-pulse font-black"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/30"
              }`}
            >
              <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>ചട്ടങ്ങൾ തിരയുക (Search Rules)</span>
              {isSearchStale && (
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Rule Number Pills */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin relative z-10">
          <span className="text-[11px] font-mono font-bold text-cyan-400 shrink-0 uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>പ്രധാന ചട്ടങ്ങൾ:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickRuleNumbers.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setRuleNumberInput(item.val);
                  setAppliedSearch((prev) => ({
                    ...prev,
                    ruleNumber: item.val
                  }));
                  setHasSearched(true);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-mono transition border cursor-pointer shrink-0 ${
                  ruleNumberInput === item.val
                    ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400"
                    : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Keywords Pills */}
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin relative z-10">
          <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 uppercase flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            <span>ദ്രുത വാക്കുകൾ:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickKeywords.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setKeywordsInput(item.val);
                  setAppliedSearch((prev) => ({
                    ...prev,
                    keywords: item.val
                  }));
                  setHasSearched(true);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-sans transition border cursor-pointer shrink-0 ${
                  keywordsInput === item.val
                    ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400"
                    : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-emerald-500/50 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Occupancy Spec Sheet Card (when Occupancy is chosen) */}
      {activeOccupancyInfo && (
        <div
          id="active-occupancy-spec-sheet"
          className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-5 shadow-xl space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${activeOccupancyInfo.badgeColor}`}>
                {activeOccupancyInfo.code}
              </span>
              <h3 className="text-base font-bold text-white font-sans">
                {activeOccupancyInfo.nameMl} — {activeOccupancyInfo.nameEn}
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              തിരഞ്ഞെടുത്ത ഉപയോഗ ഗണം (Selected Occupancy)
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans">
            {activeOccupancyInfo.descriptionMl} ({activeOccupancyInfo.descriptionEn})
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] font-mono text-slate-400">കുറഞ്ഞ റോഡ് വീതി</div>
              <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">
                {activeOccupancyInfo.minRoadWidthMeters} മീറ്റർ
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] font-mono text-slate-400">പരമാവധി FSI (FAR)</div>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                {activeOccupancyInfo.maxFSI}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] font-mono text-slate-400">പരമാവധി കവേറേജ്</div>
              <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">
                {activeOccupancyInfo.maxCoverage}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-center">
              <div className="text-[10px] font-mono text-slate-400">ലോ റിസ്ക് പരിധി</div>
              <div className="text-xs font-sans text-slate-200 mt-0.5 font-medium line-clamp-1">
                {activeOccupancyInfo.isLowRiskThresholdMl || "ബാധകമല്ല"}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono font-bold shrink-0">സെറ്റ്ബാക്ക് മാനദണ്ഡം:</span>
              <span className="text-slate-200">{activeOccupancyInfo.setbackSummaryMl}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono font-bold shrink-0">പാർക്കിംഗ് ചട്ടം:</span>
              <span className="text-slate-200">{activeOccupancyInfo.parkingRuleMl}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Header & Active Filter Tags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 px-4 py-3 rounded-xl text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-cyan-400" />
            <span>തിരച്ചിൽ ഫലങ്ങൾ ({searchResults.length} ചട്ടങ്ങൾ):</span>
          </span>

          {appliedSearch.ruleNumber && (
            <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>റൂൾ: {appliedSearch.ruleNumber}</span>
              <button
                onClick={() => {
                  setRuleNumberInput("");
                  setAppliedSearch((prev) => ({ ...prev, ruleNumber: "" }));
                }}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {appliedSearch.keywords && (
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>വാക്ക്: {appliedSearch.keywords}</span>
              <button
                onClick={() => {
                  setKeywordsInput("");
                  setAppliedSearch((prev) => ({ ...prev, keywords: "" }));
                }}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {appliedSearch.occupancyType !== "ALL" && (
            <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>ഗ്രൂപ്പ്: {appliedSearch.occupancyType}</span>
              <button
                onClick={() => {
                  setSelectedOccupancy("ALL");
                  setAppliedSearch((prev) => ({ ...prev, occupancyType: "ALL" }));
                }}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {appliedSearch.category !== "ALL" && (
            <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>വിഭാഗം: {appliedSearch.category}</span>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setAppliedSearch((prev) => ({ ...prev, category: "ALL" }));
                }}
                className="hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Global Expand/Collapse & Copy Results Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleToggleExpandAll(true)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition cursor-pointer flex items-center gap-1"
            title="Expand All Rules"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>എല്ലാം തുറക്കുക</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleExpandAll(false)}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition cursor-pointer flex items-center gap-1"
            title="Collapse All Rules"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>ചുരുക്കുക</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAllResults}
            disabled={searchResults.length === 0}
            className="bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
            title="Copy All Matching Rules"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">കോപ്പി ചെയ്തു!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>ലിസ്റ്റ് കോപ്പി</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rules Result Cards List */}
      {searchResults.length === 0 ? (
        <div
          id="search-zero-results"
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-lg"
        >
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-slate-200 font-sans">
            തിരഞ്ഞെടുത്ത മാനദണ്ഡങ്ങൾക്ക് അനുയോജ്യമായ ചട്ടങ്ങൾ കണ്ടെത്തിയില്ല
          </h3>
          <p className="text-xs text-slate-400 font-sans max-w-lg mx-auto leading-relaxed">
            നൽകിയ ചട്ട നമ്പർ ({appliedSearch.ruleNumber || "-"}), കീവേഡ് (&quot;{appliedSearch.keywords || "-"}&quot;) അല്ലെങ്കിൽ ഉപയോഗ ഗണം ({appliedSearch.occupancyType}) എന്നിവ പരിശോധിക്കുക.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetSearch}
              className="px-5 py-2.5 bg-cyan-500 text-slate-950 text-xs font-bold font-mono rounded-xl hover:bg-cyan-400 transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>എല്ലാ ചട്ടങ്ങളും കാണുക (Show All Rules)</span>
            </button>
          </div>
        </div>
      ) : (
        <div id="search-rules-list" className="space-y-4">
          {searchResults.map((rule) => {
            const isExpanded = !!expandedRules[rule.ruleNumber];

            return (
              <div
                key={rule.ruleNumber}
                id={`rule-card-${rule.ruleNumber.replace(/[^a-zA-Z0-9]/g, "-")}`}
                className={`bg-slate-900/90 border rounded-2xl transition-all overflow-hidden ${
                  isExpanded
                    ? "border-cyan-500/60 shadow-xl shadow-cyan-950/40 bg-slate-900"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Rule Card Header */}
                <div
                  onClick={() => toggleRuleExpand(rule.ruleNumber)}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-300 px-2.5 py-0.5 rounded-lg border border-cyan-800/80">
                        {highlightQuery(rule.ruleNumber)}
                      </span>

                      <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {rule.category}
                      </span>

                      {rule.chapter && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                          {rule.chapter}
                        </span>
                      )}

                      {rule.tables && rule.tables.length > 0 && (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/80">
                          {rule.tables.join(", ")}
                        </span>
                      )}

                      {rule.applicableOccupancies && (
                        <span className="text-[10px] font-mono text-slate-400">
                          ബാധകം: {rule.applicableOccupancies.join(", ")}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white font-sans tracking-tight">
                      {highlightQuery(rule.titleMl)}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {highlightQuery(rule.titleEn)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyRule(rule);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition cursor-pointer"
                      title="ചട്ടത്തിന്റെ വിവരങ്ങൾ കോപ്പി ചെയ്യുക (Copy Rule)"
                    >
                      {copiedRule === rule.ruleNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {onAskAIAboutRule && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskAIAboutRule(
                            `Explain ${rule.ruleNumber}: ${rule.titleMl} / ${rule.titleEn}`
                          );
                        }}
                        className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AI വിവരണം</span>
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

                {/* Expanded Rule Details Body */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 bg-slate-950/60 space-y-4">
                    {/* Summaries 2-Column Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Malayalam Summary Box */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          <span>ചട്ടത്തിന്റെ സംഗ്രഹം (Malayalam Summary)</span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-sans">
                          {highlightQuery(rule.summaryMl)}
                        </p>
                      </div>

                      {/* English Summary Box */}
                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                          <span>English Legal Summary</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                          {highlightQuery(rule.summaryEn)}
                        </p>
                      </div>
                    </div>

                    {/* Numbered Key Clauses & Sub-rules */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                        <span>പ്രധാന നിബന്ധനകളും അളവുകളും (Key Statutory Clauses):</span>
                      </h4>
                      <ul className="space-y-2.5">
                        {rule.keyPointsMl.map((point, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-xs text-slate-200 font-sans"
                          >
                            <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="space-y-1">
                              <div className="leading-relaxed">
                                {highlightQuery(point)}
                              </div>
                              {rule.keyPointsEn && rule.keyPointsEn[idx] && (
                                <div className="text-[11px] text-slate-400 font-mono leading-relaxed">
                                  {highlightQuery(rule.keyPointsEn[idx])}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer Actions inside Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <span>ചട്ട പരാമർശം: KPBR 2019 / KMBR 2019 / SRO 682/2026</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {onNavigateToCalculator && (
                          <button
                            type="button"
                            onClick={onNavigateToCalculator}
                            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-950 px-3 py-1.5 rounded-lg border border-emerald-800 cursor-pointer font-bold transition"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>കാൽക്കുലേറ്ററിൽ കണക്കാക്കുക</span>
                          </button>
                        )}
                        {onNavigateToPdfViewer && (
                          <button
                            type="button"
                            onClick={onNavigateToPdfViewer}
                            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-950 px-3 py-1.5 rounded-lg border border-cyan-800 cursor-pointer font-bold transition"
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
