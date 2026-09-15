import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Bot,
  Calculator,
  Printer,
  Compass,
  Building2,
  MapPin,
  HardHat,
  FileSpreadsheet,
  FolderKanban,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  SlidersHorizontal,
  BookmarkCheck
} from "lucide-react";
import { MainSectionType, TabType } from "../../types";
import { ALL_TOOLS_DATA, TOOL_CATEGORIES, AppToolItem } from "../../data/allToolsData";

interface AllToolsDashboardTabProps {
  onNavigate: (section: MainSectionType, tab: TabType) => void;
}

export const AllToolsDashboardTab: React.FC<AllToolsDashboardTabProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCapabilityFilter, setActiveCapabilityFilter] = useState<"all" | "ai" | "calculator" | "printable">("all");

  const handleOpenInNewWindow = (section: MainSectionType, tab: TabType) => {
    const url = `${window.location.origin}${window.location.pathname}?section=${encodeURIComponent(section)}&tab=${encodeURIComponent(tab)}`;
    window.open(url, "_blank");
  };

  // Filtered Tools
  const filteredTools = useMemo(() => {
    return ALL_TOOLS_DATA.filter((tool) => {
      // Category filter
      if (selectedCategory !== "all" && tool.category !== selectedCategory) {
        return false;
      }

      // Capability filter
      if (activeCapabilityFilter === "ai" && !tool.isAi) return false;
      if (activeCapabilityFilter === "calculator" && !tool.isCalculator) return false;
      if (activeCapabilityFilter === "printable" && !tool.isPrintable) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = tool.name.toLowerCase().includes(q);
        const matchesNameMl = tool.nameMl.toLowerCase().includes(q);
        const matchesEnglish = tool.englishName.toLowerCase().includes(q);
        const matchesStandard = tool.standard.toLowerCase().includes(q);
        const matchesCategory = tool.categoryName.toLowerCase().includes(q);
        const matchesDesc = tool.description.toLowerCase().includes(q);
        const matchesDescMl = tool.descriptionMl.toLowerCase().includes(q);
        const matchesBadges = tool.badges.some((b) => b.toLowerCase().includes(q));

        if (
          !matchesName &&
          !matchesNameMl &&
          !matchesEnglish &&
          !matchesStandard &&
          !matchesCategory &&
          !matchesDesc &&
          !matchesDescMl &&
          !matchesBadges
        ) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, activeCapabilityFilter, searchQuery]);

  // Counts
  const totalToolsCount = ALL_TOOLS_DATA.length;
  const aiToolsCount = ALL_TOOLS_DATA.filter((t) => t.isAi).length;
  const calcToolsCount = ALL_TOOLS_DATA.filter((t) => t.isCalculator).length;
  const printToolsCount = ALL_TOOLS_DATA.filter((t) => t.isPrintable).length;

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: totalToolsCount };
    ALL_TOOLS_DATA.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + 1;
    });
    return map;
  }, [totalToolsCount]);

  // Featured Essential Tools
  const FEATURED_TOOL_IDS = [
    "vasthu_calculator",
    "survey_land_area",
    "estimate_sheet_tool",
    "rules_ai_chat",
    "civil_bbs",
    "invoices_billing_list"
  ];
  const featuredTools = ALL_TOOLS_DATA.filter((t) => FEATURED_TOOL_IDS.includes(t.id));

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* =========================================================================
          1. TOP HERO DASHBOARD BANNER
         ========================================================================= */}
      <section className="relative rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900/95 to-cyan-950/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/90 border border-cyan-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>UNIFIED SOFTWARE SUITE</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-3 py-1 rounded-full">
                35 PROFESSIONAL ENGINEERING TOOLS
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/90 border border-amber-800 px-3 py-1 rounded-full">
                KERALA STANDARDS COMPLIANT
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-sans">
                എല്ലാ എഞ്ചിനീയറിംഗ് & വാസ്തു ടൂളുകൾ
              </h1>
              <div className="text-sm sm:text-base font-mono font-bold text-cyan-400 mt-1">
                Unified Architectural, Vasthu, Civil & Estimation Tools Hub
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-3xl">
              തച്ചുശാസ്ത്രം, കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ (KPBR 2024 / KSMART), ഡിജിറ്റൽ ലാൻഡ് സർവ്വേ (Heron's Formula), സിവിൽ എഞ്ചിനീയറിംഗ് (IS 456 & IS 2502 BBS), കേരള PWD റേറ്റ് എസ്റ്റിമേറ്റ്, ഓഫീസ് CRM, GST ഇൻവോയ്സിംഗ് എന്നിവ ഉൾപ്പെടുന്ന സമ്പൂർണ്ണ സോഫ്റ്റ്‌വെയർ സ്യൂട്ട്.
            </p>
          </div>

          {/* Metrics Column */}
          <div className="lg:col-span-4 bg-slate-950/90 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-3">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Suite Capabilities Summary</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-center">
              <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-2xl font-black text-cyan-400">35</div>
                <div className="text-[10px] text-slate-400 uppercase">Total Tools</div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-2xl font-black text-emerald-400">7</div>
                <div className="text-[10px] text-slate-400 uppercase">Disciplines</div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-2xl font-black text-indigo-400">4</div>
                <div className="text-[10px] text-slate-400 uppercase">AI Agents</div>
              </div>

              <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl">
                <div className="text-2xl font-black text-amber-400">100%</div>
                <div className="text-[10px] text-slate-400 uppercase">Kerala Codes</div>
              </div>
            </div>

            <div className="p-2.5 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Direct 1-click execution or dual-window side-by-side mode.</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FEATURED QUICK-LAUNCH SHORTCUTS
         ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-bold text-white font-sans uppercase tracking-wider">
              Essential Tools • പ്രധാന ടൂളുകൾ
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Most Frequently Used</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {featuredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onNavigate(tool.section, tool.tab)}
                className={`p-3.5 rounded-2xl border transition-all text-left group hover:scale-[1.02] cursor-pointer flex flex-col justify-between h-32 ${tool.color} shadow-sm`}
                title={`Launch ${tool.name}`}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-cyan-500/50">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cyan-400" />
                </div>

                <div>
                  <div className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {tool.nameMl}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {tool.standard}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          3. SEARCH, FILTER & CATEGORY NAVIGATION BAR
         ========================================================================= */}
      <section className="space-y-4">
        {/* Search Bar & Capability Chips */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Live Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 35+ tools by name, Malayalam title, IS code (e.g. BBS, KPBR, Heron, Setback, Mortar, BOQ, GST)..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Capability Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto shrink-0 pb-1 md:pb-0">
              <button
                onClick={() => setActiveCapabilityFilter("all")}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeCapabilityFilter === "all"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>All ({totalToolsCount})</span>
              </button>

              <button
                onClick={() => setActiveCapabilityFilter("ai")}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeCapabilityFilter === "ai"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                    : "bg-slate-950 text-indigo-300 hover:text-white border border-slate-800"
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span>AI Agents ({aiToolsCount})</span>
              </button>

              <button
                onClick={() => setActiveCapabilityFilter("calculator")}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeCapabilityFilter === "calculator"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "bg-slate-950 text-emerald-300 hover:text-white border border-slate-800"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                <span>Calculators ({calcToolsCount})</span>
              </button>

              <button
                onClick={() => setActiveCapabilityFilter("printable")}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeCapabilityFilter === "printable"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                    : "bg-slate-950 text-amber-300 hover:text-white border border-slate-800"
                }`}
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Printable ({printToolsCount})</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {TOOL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isSelected
                      ? "bg-slate-100 text-slate-950 shadow-md font-extrabold"
                      : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-600" : "text-slate-400"}`} />
                  <span>{cat.nameMl}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? "bg-slate-900 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-white">{filteredTools.length}</span>
            <span>of {totalToolsCount} Tools</span>
            {selectedCategory !== "all" && (
              <span className="text-cyan-400 font-sans">
                • {TOOL_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </span>
            )}
          </div>

          {(searchQuery || selectedCategory !== "all" || activeCapabilityFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setActiveCapabilityFilter("all");
              }}
              className="text-cyan-400 hover:text-cyan-300 underline text-xs font-sans cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* =========================================================================
            4. GRID OF ALL TOOL CARDS
           ========================================================================= */}
        {filteredTools.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <Search className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white font-sans">No tools found matching your query</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
              Try searching with a different term such as "KPBR", "BBS", "Aayam", "Heron", "Estimate", or select another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setActiveCapabilityFilter("all");
              }}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md"
            >
              Show All 35 Tools
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 group hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-950/20 bg-slate-900/90 shadow-md`}
                >
                  <div className="space-y-3">
                    {/* Header with Icon, Category Tag and Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-950 border border-slate-800 group-hover:border-cyan-500/40 transition-colors shadow-inner`}
                        >
                          <Icon className={`w-5 h-5 ${tool.accentColor}`} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                            {tool.categoryName}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-400 font-semibold truncate block max-w-[180px]">
                            {tool.standard}
                          </span>
                        </div>
                      </div>

                      {tool.isAi && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500 text-indigo-300 font-mono text-[10px] font-bold shrink-0">
                          AI
                        </span>
                      )}
                    </div>

                    {/* Titles */}
                    <div>
                      <h3 className="text-base font-bold text-white font-sans group-hover:text-cyan-300 transition-colors leading-snug">
                        {tool.name}
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5 truncate">
                        {tool.englishName}
                      </div>
                    </div>

                    {/* Descriptions */}
                    <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                      {tool.descriptionMl}
                    </p>

                    {/* Badges / Capabilities */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tool.badges.map((badge, bIdx) => (
                        <span
                          key={bIdx}
                          className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Dual Action Buttons */}
                  <div className="pt-5 mt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onNavigate(tool.section, tool.tab)}
                      className="w-full py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm group-hover:shadow-cyan-950/40"
                      title={`Launch ${tool.name} in current view`}
                    >
                      <span>തുറക്കുക (Open)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenInNewWindow(tool.section, tool.tab)}
                      className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title={`Open ${tool.englishName} in a new window`}
                    >
                      <span>New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
