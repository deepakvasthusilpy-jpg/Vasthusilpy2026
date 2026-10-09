import React, { useState } from "react";
import { MainSectionType, TabType } from "../../types";
import { SubscriptionRequestsTab } from "./SubscriptionRequestsTab";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { TechStartupHoloRing } from "../theme/TechStartupHoloRing";
import { CorporateExecutiveShowcase } from "../theme/CorporateExecutiveShowcase";
import { PRIMARY_ADMIN_EMAILS } from "../../lib/firebase";
import { isOnamThemeActive, getOnamRemainingStatus } from "../../utils/onamTheme";
import { getActiveWebsiteTheme, ActiveThemeConfig } from "../../utils/festivalTheme";
import { SpecialDayInfo } from "../../utils/keralaCalendarData";
import { DynamicFestivalBanner } from "../common/DynamicFestivalBanner";
import {
  OnamToranBanner,
  OnamGreetingHero,
  PookkalamGraphic,
  NilavilakkuGraphic,
  OnamFestiveBadge
} from "../common/OnamFestiveElements";
import {
  Compass,
  Building2,
  MapPin,
  HardHat,
  FolderKanban,
  FileSpreadsheet,
  Ruler,
  Calculator,
  Bot,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Layers,
  FileText,
  ChevronRight,
  Landmark,
  Flame,
  Globe,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  HelpCircle,
  Briefcase,
  QrCode,
  Smartphone,
  KeyRound,
  Lock,
  Receipt,
  Users,
  LayoutGrid,
  Search,
  ArrowRight,
  HardDrive,
  FileCheck2,
  Calendar as CalendarIcon,
  Image as ImageIcon
} from "lucide-react";


interface HomePageProps {
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
  onNavigate: (section: MainSectionType, tab: TabType) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ activeTab = "home_overview", setActiveTab, onNavigate }) => {
  const { subscriptionRequests = [], isPrimaryAdmin, isSubscriberLogin } = useAuth();
  const { theme } = useTheme();
  const pendingRequestsCount = (subscriptionRequests || []).filter((r) => r.status === "pending").length;

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryService, setInquiryService] = useState("Vastu & Architectural Planning");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquirySuccess, setInquirySuccess] = useState(false);

  // Dynamic Festival & Special Day Theme State
  const [customThemePreview, setCustomThemePreview] = useState<SpecialDayInfo | null>(null);

  // Compute active theme based on custom preview or today's live date
  const activeThemeConfig: ActiveThemeConfig = customThemePreview
    ? {
        specialDay: customThemePreview,
        themeType: customThemePreview.themeType,
        themeName: customThemePreview.themeName,
        isSpecialDay: true,
        bgHeroGradient: customThemePreview.themeColors.bgGradient,
        containerBorder: customThemePreview.themeColors.border,
        accentText: customThemePreview.themeColors.accent,
        badgeBg: customThemePreview.themeColors.badgeBg,
        badgeText: customThemePreview.themeColors.badgeText,
        greetingEn: customThemePreview.greetingEn,
        greetingMl: customThemePreview.greetingMl,
        iconSymbol: customThemePreview.iconSymbol,
        kasavuBorder: customThemePreview.themeColors.kasavuAccent || "border-amber-400/50",
        decorType: customThemePreview.themeType === "onam" ? "pookkalam_toran" : "standard",
      }
    : getActiveWebsiteTheme();

  const handleOpenInNewWindow = (section: MainSectionType, tab: TabType) => {
    const url = `${window.location.origin}${window.location.pathname}?section=${encodeURIComponent(section)}&tab=${encodeURIComponent(tab)}`;
    window.open(url, "_blank");
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("7012383137@okbizaxis");
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) return;

    const whatsappText = encodeURIComponent(
      `*New Consultation Inquiry via Vasthusilpy Portal*\n` +
      `👤 *Name:* ${inquiryName}\n` +
      `📞 *Phone:* ${inquiryPhone}\n` +
      `📐 *Service:* ${inquiryService}\n` +
      `📝 *Message:* ${inquiryMessage || "I would like to schedule a consultation with Er.Deepak.C"}`
    );

    window.open(`https://wa.me/919747995961?text=${whatsappText}`, "_blank");
    setInquirySuccess(true);
    setTimeout(() => {
      setInquiryName("");
      setInquiryPhone("");
      setInquiryMessage("");
      setInquirySuccess(false);
    }, 4000);
  };

  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden pb-16">
      {/* Background Subtle Twilight Gradient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Onam Festive Hanging Garland (Active upto 30-08-2026) */}
      {isOnamThemeActive() && <OnamToranBanner />}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">

        {/* HOME SUB-TABS NAVIGATION BAR */}
        <div className="glass-card border border-white/15 p-2 rounded-3xl flex items-center gap-2 overflow-x-auto shadow-2xl backdrop-blur-2xl">
          <button
            onClick={() => setActiveTab && setActiveTab("home_overview")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "home_overview"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/50 border border-white/30"
                : "text-purple-200/80 hover:text-white hover:bg-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>ഹോം & പ്രൊഫൈൽ (Overview)</span>
            {isOnamThemeActive() && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 text-[10px] font-mono font-bold">
                🌸 ഓണം
              </span>
            )}
          </button>

          {isPrimaryAdmin && !isSubscriberLogin && (
            <button
              onClick={() => setActiveTab && setActiveTab("subscription_requests")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "subscription_requests"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/50 border border-white/30"
                  : "text-purple-200/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-300" />
              <span>സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥനകൾ (Subscription Requests)</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black animate-pulse">
                  {pendingRequestsCount} NEW
                </span>
              )}
            </button>
          )}
        </div>

        {activeTab === "subscription_requests" && isPrimaryAdmin && !isSubscriberLogin ? (
          <SubscriptionRequestsTab />
        ) : (
          <>
            {/* Dynamic Festival & Special Day Greeting Banner (Auto-adjusts for Onam, Vishu, Republic Day, etc.) */}
            <DynamicFestivalBanner
              themeConfig={activeThemeConfig}
              onResetDefaultTheme={() => setCustomThemePreview(null)}
              isCustomPreview={!!customThemePreview}
            />

            {/* Futuristic Tech Theme Interactive Holographic Visual Core */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <TechStartupHoloRing />
            </div>

            {/* =========================================================================
                1. VASTHUSILPY BUSINESS PROFILE & HERO
               ========================================================================= */}
            <section className={`relative rounded-3xl border shadow-2xl backdrop-blur-xl p-6 sm:p-10 transition-all ${
              activeThemeConfig.isSpecialDay
                ? `${activeThemeConfig.containerBorder} bg-gradient-to-br ${activeThemeConfig.bgHeroGradient}`
                : "border-slate-800 bg-slate-900/90"
            }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col: Main Business Info */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/90 border border-cyan-800 px-3 py-1 rounded-full">
                  BUILDING CONSULTATION & ENGINEERING
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/90 border border-emerald-800 px-3 py-1 rounded-full">
                  LSGD KSMART REGISTERED
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/90 border border-amber-800 px-3 py-1 rounded-full">
                  ESTD. KERALASSERY
                </span>
                {activeThemeConfig.isSpecialDay && (
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${activeThemeConfig.badgeText} ${activeThemeConfig.badgeBg} border px-3 py-1 rounded-full flex items-center gap-1`}>
                    <span>{activeThemeConfig.iconSymbol}</span>
                    <span>{activeThemeConfig.themeName.toUpperCase()}</span>
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans uppercase">
                  VASTHUSILPY
                </h1>
                <div className="text-lg sm:text-xl font-bold text-slate-300 font-sans mt-1">
                  Architects, Engineers & Interior Designers
                </div>
                <div className="text-sm font-semibold text-cyan-400 font-sans mt-0.5">
                  വാസ്തുശില്പി - കേരളശ്ശേരി | Er.Deepak.C (Lead Consultant)
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-3xl">
                Vasthusilpy is Kerala’s premier technical engineering and traditional Thachu Shastra consultation firm. We blend centuries-old Vedic architectural principles (Aayam, Vyayam, Yoni calculations) with modern structural engineering, 3D elevation modeling, Kerala Building Rules (KPBR 2019/2024), LSGD KSMART online clearances, and detailed bank valuation estimating.
              </p>

              {/* Direct Contact Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="tel:+919747995961"
                  className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+91 9747995961</span>
                </a>

                <a
                  href="mailto:deepak.vasthusilpy@gmail.com"
                  className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-200 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>deepak.vasthusilpy@gmail.com</span>
                </a>

                <button
                  onClick={handleCopyUpi}
                  className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono text-amber-300 transition-colors cursor-pointer"
                  title="Click to copy official UPI ID"
                >
                  {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{copiedUpi ? "UPI Copied!" : "UPI: 7012383137@okbizaxis"}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Keralassery, Palakkad, Kerala - 678641</span>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Stats & Highlights */}
            <div className="lg:col-span-4 bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Firm Metrics & Achievements</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl text-center">
                  <div className="text-2xl font-black text-emerald-400 font-mono">15+</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">Years Experience</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl text-center">
                  <div className="text-2xl font-black text-cyan-400 font-mono">50000+</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">Plans Crafted</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl text-center">
                  <div className="text-2xl font-black text-indigo-400 font-mono">100%</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">Kerala Vasthu Complience</div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl text-center">
                  <div className="text-2xl font-black text-amber-400 font-mono">1000+</div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">Bank Estimate</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Officially licensed for building permit drawings, structural certifications, and stage progress estimates across all Kerala local bodies.</span>
              </div>
            </div>

          </div>
        </section>

        {/* =========================================================================
            5. CONSULTATION INQUIRY & CONTACT SECTION
           ========================================================================= */}
        <section
          id="consultation-section"
          className={`rounded-3xl border shadow-2xl backdrop-blur-xl p-6 sm:p-8 transition-all ${
            isOnamThemeActive()
              ? "border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900/95 to-slate-900 shadow-[0_0_40px_rgba(245,158,11,0.06)]"
              : "border-slate-800 bg-slate-900/90"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Office Details & Hours */}
            <div className="lg:col-span-5 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded-md uppercase">
                    DIRECT CONSULTATION
                  </span>
                  {isOnamThemeActive() && (
                    <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-2 py-0.5 rounded-md">
                      🌸 ഓണം ഓഫർ 2026
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white font-sans mt-2">
                  Visit or Contact Our Office
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  Schedule an in-person or online consultation with Er.Deepak.C for Vastu planning, building permits, or valuation reports.
                </p>
              </div>

              <div className="space-y-3 font-mono text-xs text-slate-300">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-white">Office Address:</span>
                  </div>
                  <div className="pl-6 text-slate-300">
                    Vasthusilpy Building Consultations<br />
                    Keralassery, Palakkad District,<br />
                    Kerala, India - PIN 678641
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">Office Working Hours:</span>
                  </div>
                  <div className="pl-6 text-slate-300">
                    Mon - Sat: 9:00 AM - 6:30 PM<br />
                    Sunday: By Prior Appointment
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-400 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Phone & WhatsApp:</span>
                  </div>
                  <div className="pl-6 text-slate-300">
                    +91 9747995961 / +91 7012383137
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick WhatsApp Consultation Form */}
            <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Send a Quick Consultation Inquiry</span>
                </h4>
                <p className="text-xs text-slate-400 font-sans">
                  Direct message to Er.Deepak.C on WhatsApp with your project requirements
                </p>
              </div>

              {inquirySuccess ? (
                <div className="p-6 bg-emerald-950/60 border border-emerald-800 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="font-bold text-white text-sm">Opening WhatsApp Chat!</div>
                  <p className="text-xs text-emerald-200">
                    Your inquiry details have been formatted and transferred to WhatsApp.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-400">Mobile / WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9847000000"
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 flex items-center justify-between">
                      <span>Required Service</span>
                      {isOnamThemeActive() && (
                        <span className="text-[10px] text-amber-400 font-bold">🌸 ഓണം ഓഫർ ഉൾപ്പെടെ</span>
                      )}
                    </label>
                    <select
                      value={inquiryService}
                      onChange={(e) => setInquiryService(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {isOnamThemeActive() && (
                        <option value="🌸 Onam Festive Special Vasthu & Construction Consultation">
                          🌸 Onam Festive Special Vasthu & Construction Consultation (2026)
                        </option>
                      )}
                      <option value="Thachu Shastra & Vasthu Plan">Thachu Shastra & Vasthu Plan</option>
                      <option value="Architectural 2D/3D Design">Architectural 2D/3D Design</option>
                      <option value="KPBR / KSMART Building Permit">KPBR / KSMART Building Permit</option>
                      <option value="Stage Certificate & Estimate">Stage Certificate & Estimate</option>
                      <option value="Land Survey & Heron Area Calc">Land Survey & Heron Area Calc</option>
                      <option value="Turnkey Building Construction">Turnkey Building Construction</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400">Project Location & Details (Optional)</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. 2400 sq.ft 2-story residential house in Palakkad, need Vastu check and permit drawings."
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Connect with Er.Deepak.C on WhatsApp</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </section>
      </>
    )}

    {/* Footer info */}
        <footer className="text-center text-xs font-mono text-slate-500 pt-4 border-t border-slate-800/60">
          <div>VASTHUSILPY TECHNICAL ENGINEERING SYSTEM • KERALASSERY, PALAKKAD • 2026</div>
          <div className="text-[11px] text-slate-600 mt-1">
            Compliant with KPBR 2019/2024, Traditional Thachu Shastra Shlokas, IS 456, IS 1077 & IS 2502 Standards.
          </div>
        </footer>

      </div>
    </div>
  );
};
