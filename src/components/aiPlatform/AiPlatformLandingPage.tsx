import React, { useState } from "react";
import {
  Cpu,
  Terminal,
  ShieldCheck,
  Compass,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  Code2,
  Workflow,
  Copy,
  Check,
  ChevronRight,
  Play,
  RotateCcw,
  Boxes,
  FileCode2,
  Eye,
  Lock,
  Palette
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface AiPlatformLandingPageProps {
  onNavigateToTool?: (section: string, tab?: string) => void;
  onExploreDocs?: () => void;
}

export const AiPlatformLandingPage: React.FC<AiPlatformLandingPageProps> = ({
  onNavigateToTool,
  onExploreDocs
}) => {
  const { theme, setTheme } = useTheme();
  const [activeDocsModal, setActiveDocsModal] = useState(false);
  const [activeStartedModal, setActiveStartedModal] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  
  // Interactive Prompt Terminal State
  const [terminalInput, setTerminalInput] = useState(
    "Verify Rule 27 FSI & Coverage for 650 sq.m commercial block on 8m road in Category-1"
  );
  const [terminalOutput, setTerminalOutput] = useState<{
    status: string;
    fsi: string;
    coverage: string;
    setbacks: string;
    sanitation: string;
    ruleCode: string;
    timestamp: string;
  } | null>({
    status: "COMPLIANT WITH CONDITIONS",
    fsi: "Permitted: 2.50 | Proposed: 1.85 (Headroom: +0.65 FSI Available)",
    coverage: "Permitted Max: 60% | Proposed: 48.2% (PASS)",
    setbacks: "Front: 4.50m (Req: 4.50m) | Rear: 2.00m | Sides: 1.50m / 1.50m",
    sanitation: "Male WC: 4 | Female WC: 5 | Urinals: 4 | Washbasins: 6 (Table 15A applied)",
    ruleCode: "KPBR 2019 Rule 27, 29 & 34 (S.R.O. 682/2026 Gazetted)",
    timestamp: "2026-09-11 09:40:12 UTC - 14ms response"
  });
  const [isProcessingQuery, setIsProcessingQuery] = useState(false);

  const sampleQueries = [
    "Verify Rule 27 FSI & Coverage for 650 sq.m commercial block on 8m road in Category-1",
    "Calculate Ayadi Shadvarga perimeter harmony for 42 Kol 16 Viral residential footprint",
    "Extract BBS bar bending schedule for 400x400mm RC column with 8T20 main bars",
    "KPBR Rule 76 Rainwater harvesting tank sizing for 420 sq.m covered ground plinth"
  ];

  const handleRunTerminalQuery = (queryText: string) => {
    setTerminalInput(queryText);
    setIsProcessingQuery(true);
    setTerminalOutput(null);

    setTimeout(() => {
      if (queryText.includes("Ayadi") || queryText.includes("Kol")) {
        setTerminalOutput({
          status: "OPTIMAL VASTHU HARMONY (ഉത്തമം)",
          fsi: "Ayadi Yoni: Dhwaja Yoni (1 - East Facing Prime Meridian)",
          coverage: "Aayam: 7 Kol 14 Viral | Vyayam: 2 Kol 08 Viral (Gain > Loss)",
          setbacks: "Nakshatram: Rohini (Nazhika: 18) | Vayassu: Balya (Infant Energy)",
          sanitation: "Padavinyasam: Brahma Sutra clearance confirmed | Zero Marma obstruction",
          ruleCode: "Manushyalaya Chandrika Ch. 4 Sloka 12-18 & Thachu Shastra Matrix",
          timestamp: "2026-09-11 09:40:14 UTC - 9ms response"
        });
      } else if (queryText.includes("BBS") || queryText.includes("column")) {
        setTerminalOutput({
          status: "STRUCTURAL BOQ CALCULATED",
          fsi: "Main Reinforcement: 8 Nos 20mm Dia Fe550D TMT = 197.3 kg total",
          coverage: "Lateral Ties: 8mm @ 150mm c/c (2-legged) = 48.6 kg",
          setbacks: "Development Length Ld: 48d = 960mm into pile cap / foundation footing",
          sanitation: "Concrete Grade: M25 (1:1:2) = 1.92 m³ | Formwork Area: 19.2 m²",
          ruleCode: "IS 456:2000 Cl. 26.5.3.1 & SP:34 (SNT Reinforcement Detailing)",
          timestamp: "2026-09-11 09:40:15 UTC - 18ms response"
        });
      } else if (queryText.includes("Rainwater") || queryText.includes("76")) {
        setTerminalOutput({
          status: "MANDATORY STATUTORY REQUIREMENT CONFIRMED",
          fsi: "Applicability: BUA > 300 sq.m threshold triggered",
          coverage: "Storage Rate: 50 Litres / sq.m of covered ground plinth area",
          setbacks: "Required Capacity: 21,000 Litres (21.00 m³ net liquid volume)",
          sanitation: "Suggested Geometry: L: 4.0m × W: 2.5m × D: 2.1m (+ 0.3m freeboard)",
          ruleCode: "KPBR 2019 Rule 76(2) Rainwater Harvesting & Ground Recharge Mandate",
          timestamp: "2026-09-11 09:40:16 UTC - 11ms response"
        });
      } else {
        setTerminalOutput({
          status: "COMPLIANT WITH CONDITIONS",
          fsi: "Permitted: 2.50 | Proposed: 1.85 (Headroom: +0.65 FSI Available)",
          coverage: "Permitted Max: 60% | Proposed: 48.2% (PASS)",
          setbacks: "Front: 4.50m (Req: 4.50m) | Rear: 2.00m | Sides: 1.50m / 1.50m",
          sanitation: "Male WC: 4 | Female WC: 5 | Urinals: 4 | Washbasins: 6 (Table 15A applied)",
          ruleCode: "KPBR 2019 Rule 27, 29 & 34 (S.R.O. 682/2026 Gazetted)",
          timestamp: "2026-09-11 09:40:17 UTC - 14ms response"
        });
      }
      setIsProcessingQuery(false);
    }, 450);
  };

  const handleCopyCode = () => {
    const curl = `curl -X POST https://api.vasthusilpy.ai/v1/scrutiny \\
  -H "Authorization: Bearer vk_live_8900f4e" \\
  -H "Content-Type: application/json" \\
  -d '{"occupancy": "F", "plotArea": 650, "proposedBua": 1202, "roadWidth": 8.0}'`;
    navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div
      id="ai-platform-landing-page"
      className="min-h-screen bg-[#121212] text-slate-100 font-sans relative selection:bg-[#00E5FF] selection:text-black"
    >
      {/* Background High-Tech Matrix Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Deep Charcoal Blueprint Lines */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 229, 255, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 229, 255, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px"
          }}
        />

        {/* Ambient Electric Cyan Radial Nodes */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#00E5FF]/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] -left-32 w-[600px] h-[400px] bg-[#00B0FF]/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-0 w-[700px] h-[450px] bg-[#00E5FF]/8 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16">
        {/* ========================================================================= */}
        {/* TOP STATUS & CONTROLS BAR */}
        {/* ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#00E5FF]/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#181818] border border-[#00E5FF]/50 flex items-center justify-center text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.4)]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-white uppercase font-mono">
                  AURA INTELLIGENCE
                </span>
                <span className="text-[10px] font-mono font-bold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 px-2 py-0.5 rounded">
                  v4.2 DEEP COGNITIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Domain-Specialized Foundation Engine for Spatial & Civil Engineering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Operational Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#00E5FF]/25 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF] animate-ping" />
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] -ml-4" />
              <span>Inference Engine: <b>Operational (11ms)</b></span>
            </div>

            {/* Quick Theme Activator */}
            <button
              onClick={() => setTheme("ai_platform")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                theme === "ai_platform"
                  ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.3)]"
                  : "bg-[#1e1e1e] hover:bg-[#252525] text-slate-300 border border-slate-700 hover:border-[#00E5FF]/50"
              }`}
              title="Apply this Deep Charcoal & Glowing Cyan theme globally across the portal"
            >
              <Palette className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{theme === "ai_platform" ? "Active Theme: #121212 & #00E5FF" : "Activate Theme Globally"}</span>
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* HERO SECTION */}
        {/* ========================================================================= */}
        <section className="text-center pt-8 pb-10 space-y-8 max-w-4xl mx-auto">
          {/* Subtle Technology Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#181818] border border-[#00E5FF]/40 text-xs font-mono text-[#00E5FF] shadow-[0_0_16px_rgba(0,229,255,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Kerala Building Rules & Structural Intelligence</span>
          </div>

          {/* Bold, Value-Focused Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Architecting Next-Gen Intelligence for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#38bdf8] to-[#00B0FF] drop-shadow-[0_0_24px_rgba(0,229,255,0.4)]">
              Autonomous Precision & Scale
            </span>
          </h1>

          {/* Clear Subheadline Explaining AI Capabilities */}
          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed max-w-3xl mx-auto">
            Harness domain-specialized multi-modal foundation models for automated Kerala building rule scrutiny,
            cognitive spatial Vastu geometry, real-time structural quantity forecasting, and autonomous architectural compliance.
          </p>

          {/* Primary & Secondary Hero Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Primary 'Get Started Free' Glowing Button */}
            <button
              id="hero-get-started-free-btn"
              onClick={() => setActiveStartedModal(true)}
              className="ai-btn-glow px-8 py-4 rounded-xl font-bold text-base tracking-wide flex items-center gap-3 cursor-pointer select-none group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>

            {/* Secondary 'Explore Docs' Outline Button */}
            <button
              id="hero-explore-docs-btn"
              onClick={() => {
                setActiveDocsModal(true);
                if (onExploreDocs) onExploreDocs();
              }}
              className="ai-btn-outline px-8 py-4 rounded-xl font-semibold text-base tracking-wide flex items-center gap-2.5 cursor-pointer select-none"
            >
              <BookOpen className="w-5 h-5" />
              <span>Explore Docs</span>
            </button>
          </div>

          {/* Key Spec Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              KPBR 2019 & 2026 Gazette Ready
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              Ayadi Shadvarga Precision
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              Zero Token Configuration
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF]" />
              Sub-20ms Inference Latency
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SUBTLE GRID-ALIGNED FEATURE SECTION: THREE CORE AI CAPABILITIES */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Three Core AI Capabilities
            </h2>
            <p className="text-sm text-slate-400">
              Purpose-engineered neural engines calibrated against Kerala statutory bylaws and structural standards.
            </p>
          </div>

          {/* 3-Column Subtle Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Capability 1: Autonomous Statutory Scrutiny */}
            <div
              id="capability-statutory-scrutiny"
              className="bg-[#181818] border border-[#00E5FF]/25 hover:border-[#00E5FF]/60 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,229,255,0.18)] group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Minimalist Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#121212] border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.25)] group-hover:shadow-[0_0_22px_rgba(0,229,255,0.45)] transition-all">
                  <ShieldCheck className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#00E5FF] font-semibold tracking-wider uppercase">
                    CAPABILITY 01
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Autonomous Statutory Scrutiny
                  </h3>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Sub-millisecond verification of KPBR 2019 and 2026 Gazette amendments. Instant mathematical audits for
                  multi-occupancy weighted FSI, plot coverage, street width setback expansions, and mandatory rainwater harvesting capacity.
                </p>
              </div>

              <div className="pt-6 border-t border-[#262626] mt-6 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Rule 27 / 29 / 34</span>
                <button
                  onClick={() => onNavigateToTool ? onNavigateToTool("building_rules") : null}
                  className="text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Launch Scrutiny</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Capability 2: Neural Spatial & Vastu Intelligence */}
            <div
              id="capability-spatial-vastu"
              className="bg-[#181818] border border-[#00E5FF]/25 hover:border-[#00E5FF]/60 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,229,255,0.18)] group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Minimalist Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#121212] border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.25)] group-hover:shadow-[0_0_22px_rgba(0,229,255,0.45)] transition-all">
                  <Compass className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#00E5FF] font-semibold tracking-wider uppercase">
                    CAPABILITY 02
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Neural Spatial & Vastu Intelligence
                  </h3>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Algorithmic dimensional harmony engine grounded in Manushyalaya Chandrika. Automatically iterates perimeter
                  coordinates (Kol & Viral) to optimize Ayadi Shadvarga scores, celestial quadrant orientations, and Brahma Sutra clearance.
                </p>
              </div>

              <div className="pt-6 border-t border-[#262626] mt-6 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Ayadi Matrices</span>
                <button
                  onClick={() => onNavigateToTool ? onNavigateToTool("vasthu") : null}
                  className="text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Explore Vastu</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Capability 3: Predictive Quantity & Structural BOQ */}
            <div
              id="capability-quantity-boq"
              className="bg-[#181818] border border-[#00E5FF]/25 hover:border-[#00E5FF]/60 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,229,255,0.18)] group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Minimalist Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#121212] border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.25)] group-hover:shadow-[0_0_22px_rgba(0,229,255,0.45)] transition-all">
                  <Layers className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#00E5FF] font-semibold tracking-wider uppercase">
                    CAPABILITY 03
                  </span>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Predictive Quantity & Structural BOQ
                  </h3>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Autonomous Bar Bending Schedule (BBS) generation, reinforcement cutting length optimization (IS 2502 / SP:34),
                  concrete grade mix estimations, and dynamic CPWD / DSR valuation sheets generated in seconds.
                </p>
              </div>

              <div className="pt-6 border-t border-[#262626] mt-6 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">IS 456 & CPWD</span>
                <button
                  onClick={() => onNavigateToTool ? onNavigateToTool("civil") : null}
                  className="text-[#00E5FF] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span>Launch BOQ</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE HIGH-TECH TERMINAL PLAYGROUND */}
        {/* ========================================================================= */}
        <section className="bg-[#161616] border border-[#00E5FF]/30 rounded-2xl p-6 sm:p-8 shadow-[0_0_35px_rgba(0,229,255,0.12)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-[#00E5FF]/80" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00E5FF]" />
                Interactive Reasoning Terminal: v4.2 Live Console
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-slate-700 text-[#00E5FF]">
                Model: aura-flash-civil
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-[#1f1f1f] hover:bg-[#282828] border border-slate-700 cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-[#00E5FF]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
              </button>
            </div>
          </div>

          {/* Sample Query Quick Pills */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <span>TRY SAMPLE REASONING PROMPTS:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunTerminalQuery(q)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all text-left truncate max-w-full cursor-pointer ${
                    terminalInput === q
                      ? "bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.25)]"
                      : "bg-[#1a1a1a] border-slate-800 text-slate-300 hover:border-[#00E5FF]/40 hover:text-white"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input Line */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3.5 top-3 text-[#00E5FF] font-mono text-sm font-bold">
                &gt;
              </span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRunTerminalQuery(terminalInput);
                }}
                placeholder="Enter statutory parameters, Vastu perimeter, or BBS specifications..."
                className="w-full bg-[#121212] border border-[#00E5FF]/30 focus:border-[#00E5FF] text-white font-mono text-sm pl-8 pr-4 py-2.5 rounded-xl outline-none shadow-[0_0_14px_rgba(0,229,255,0.2)] focus:shadow-[0_0_20px_rgba(0,229,255,0.4)]"
              />
            </div>
            <button
              onClick={() => handleRunTerminalQuery(terminalInput)}
              disabled={isProcessingQuery}
              className="ai-btn-glow px-6 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessingQuery ? (
                <RotateCcw className="w-4 h-4 animate-spin text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black" />
              )}
              <span>{isProcessingQuery ? "Analyzing..." : "Execute"}</span>
            </button>
          </div>

          {/* Terminal Output Console */}
          <div className="bg-[#0e0e0e] border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2.5 min-h-[140px]">
            {isProcessingQuery ? (
              <div className="flex items-center gap-2 text-[#00E5FF] py-6 justify-center">
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Running tensor analysis across Kerala Building Rules & Structural matrices...</span>
              </div>
            ) : terminalOutput ? (
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800/80">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {terminalOutput.status}
                  </span>
                  <span className="text-slate-500">{terminalOutput.timestamp}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-300">
                  <div>
                    <span className="text-slate-500">Metric 1: </span>
                    <span className="text-white font-semibold">{terminalOutput.fsi}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Metric 2: </span>
                    <span className="text-white font-semibold">{terminalOutput.coverage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Boundary/Setback: </span>
                    <span className="text-slate-200">{terminalOutput.setbacks}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Sanitation/Fitments: </span>
                    <span className="text-slate-200">{terminalOutput.sanitation}</span>
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-[#00E5FF] flex items-center gap-2 border-t border-slate-800/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Statutory Reference: {terminalOutput.ruleCode}</span>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOOTER CALL-TO-ACTION BANNER */}
        {/* ========================================================================= */}
        <section className="bg-gradient-to-r from-[#181818] via-[#1c1c1c] to-[#181818] border border-[#00E5FF]/40 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-[0_0_40px_rgba(0,229,255,0.15)]">
          <div className="max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to accelerate your engineering workflow?
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Join leading civil engineers, licensed building supervisors, and Vedic architects across Kerala deploying AURA intelligence daily.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => setActiveStartedModal(true)}
              className="ai-btn-glow px-8 py-3.5 rounded-xl font-bold text-sm tracking-wider cursor-pointer"
            >
              Get Started Free Now
            </button>
            <button
              onClick={() => setActiveDocsModal(true)}
              className="ai-btn-outline px-7 py-3.5 rounded-xl font-semibold text-sm tracking-wider cursor-pointer"
            >
              Read Full Documentation
            </button>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GET STARTED FREE */}
      {/* ========================================================================= */}
      {activeStartedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#181818] border border-[#00E5FF]/60 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,229,255,0.25)] space-y-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#121212] border border-[#00E5FF] text-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Get Started Free</h3>
                  <p className="text-xs text-slate-400 font-mono">Immediate Zero-Config Access</p>
                </div>
              </div>
              <button
                onClick={() => setActiveStartedModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p>Choose your starting engineering intelligence workflow:</p>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveStartedModal(false);
                    if (onNavigateToTool) onNavigateToTool("building_rules");
                  }}
                  className="w-full text-left p-3.5 rounded-xl bg-[#121212] hover:bg-[#1d1d1d] border border-slate-800 hover:border-[#00E5FF]/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
                    <div>
                      <div className="font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                        KPBR 2019/2026 Statutory Rules Calculator
                      </div>
                      <div className="text-xs text-slate-400">
                        Instant FSI, plot coverage, parking, and sanitation reports
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    setActiveStartedModal(false);
                    if (onNavigateToTool) onNavigateToTool("vasthu");
                  }}
                  className="w-full text-left p-3.5 rounded-xl bg-[#121212] hover:bg-[#1d1d1d] border border-slate-800 hover:border-[#00E5FF]/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-[#00E5FF]" />
                    <div>
                      <div className="font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                        Thachu Shastra & Ayadi Vastu Engine
                      </div>
                      <div className="text-xs text-slate-400">
                        Perimeter Shadvarga optimization, Kol & Viral coordinate solver
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all" />
                </button>

                <button
                  onClick={() => {
                    setActiveStartedModal(false);
                    if (onNavigateToTool) onNavigateToTool("ai_agent");
                  }}
                  className="w-full text-left p-3.5 rounded-xl bg-[#121212] hover:bg-[#1d1d1d] border border-slate-800 hover:border-[#00E5FF]/60 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-[#00E5FF]" />
                    <div>
                      <div className="font-bold text-white group-hover:text-[#00E5FF] transition-colors">
                        Live Chief AI Civil Consultant
                      </div>
                      <div className="text-xs text-slate-400">
                        Multi-modal voice & prompt architectural assistant
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveStartedModal(false)}
                className="px-5 py-2 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-xs font-mono text-slate-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPLORE DOCS */}
      {/* ========================================================================= */}
      {activeDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#181818] border border-[#00E5FF]/60 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.25)] flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-[#00E5FF]" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Platform Technical Documentation & Formulas
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    AURA Core Specifications & Mathematical Architecture
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDocsModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 font-sans">
              {/* Section 1: KPBR Rule Equations */}
              <div className="space-y-2.5">
                <h4 className="text-base font-bold text-[#00E5FF] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  1. Statutory Scrutiny Engine (KPBR 2019 / S.R.O. 682/2026)
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  The engine models Kerala statutory rules as deterministic constraint graphs:
                </p>
                <div className="bg-[#121212] p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                  <div>• <b>Standard FSI:</b> FSI = Total Floor Area on All Floors / Plot Area (Rule 27 Table 6)</div>
                  <div>• <b>Weighted Multi-Occupancy FSI:</b> FSI_w = (f₁·A₁ + f₂·A₂ + ... + fₙ·Aₙ) / A_total</div>
                  <div>• <b>Height Limitation:</b> Max Height ≤ 1.5 × (Road Width + Front Yard Setback)</div>
                  <div>• <b>Rainwater Harvesting (Rule 76):</b> V_min = 50 L/m² × Plinth Ground Area (when BUA &gt; 300 m²)</div>
                  <div>• <b>Solar Rooftop Plant (Rule 77):</b> 1 kWp per 100 m² (when BUA &gt; 500 m²)</div>
                </div>
              </div>

              {/* Section 2: Ayadi Shadvarga Matrices */}
              <div className="space-y-2.5">
                <h4 className="text-base font-bold text-[#00E5FF] flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  2. Ayadi Shadvarga Vedic Computational Architecture
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Based on Manushyalaya Chandrika Ch. 4, perimeter perimeter (P) in Kol & Viral is mapped to the six celestial matrices:
                </p>
                <div className="bg-[#121212] p-3.5 rounded-xl border border-slate-800 font-mono text-xs space-y-1.5 text-slate-300">
                  <div>• <b>Yoni (Directional Energy):</b> Y = (P × 3) mod 8 (Odd values 1, 3, 5, 7 preferred; Yoni 1 Dhwaja = East)</div>
                  <div>• <b>Aayam (Income/Gain):</b> Aayam = (P × 8) mod 12</div>
                  <div>• <b>Vyayam (Expenditure/Loss):</b> Vyayam = (P × 9) mod 10 (Criterion: Aayam &gt; Vyayam)</div>
                  <div>• <b>Nakshatram (Birth Star):</b> Star = (P × 8) mod 27</div>
                  <div>• <b>Vayassu (Longevity Age):</b> Age = (P × 27) mod 100</div>
                </div>
              </div>

              {/* Section 3: REST API Example */}
              <div className="space-y-2.5">
                <h4 className="text-base font-bold text-[#00E5FF] flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  3. Headless REST API Integration
                </h4>
                <div className="bg-[#121212] p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-200">
                  <pre>{`POST /v1/scrutiny/evaluate HTTP/1.1
Host: api.vasthusilpy.ai
Authorization: Bearer vk_live_8900f4e
Content-Type: application/json

{
  "occupancy": "F",
  "category": "Category-1",
  "plotAreaSqM": 650.0,
  "proposedBuaSqM": 1202.5,
  "roadWidthM": 8.0,
  "frontYardM": 4.5
}`}</pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#262626] bg-[#141414] flex justify-end">
              <button
                onClick={() => setActiveDocsModal(false)}
                className="ai-btn-glow px-6 py-2 rounded-lg font-mono text-xs font-bold cursor-pointer"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
