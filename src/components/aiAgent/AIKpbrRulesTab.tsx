import React, { useState, useRef, useEffect } from "react";
import {
  Building2,
  Search,
  Sparkles,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
  Bot,
  User,
  Scale,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Paperclip,
  Image as ImageIcon,
  X,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  Sliders,
  Send,
  BookOpen
} from "lucide-react";
import { useAIVoiceEngine, LanguagePref } from "./useAIVoiceEngine";
import { VoiceControlBar } from "./VoiceControlBar";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  image?: string;
  ruleContext?: string;
  sources?: string[];
}

export const AIKpbrRulesTab: React.FC = () => {
  // Voice engine hook
  const {
    isListening,
    transcript,
    isSpeaking,
    isPaused,
    activeMessageId,
    currentSpokenText,
    rate,
    autoSpeak,
    language,
    speechRecognitionSupported,
    speechSynthesisSupported,
    setLanguage,
    setAutoSpeak,
    startListening,
    stopListening,
    speak,
    pause,
    resume,
    stop,
    changeRate
  } = useAIVoiceEngine("malayalam");

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_kpbr_welcome",
      role: "model",
      text: `നമസ്കാരം! ഞാൻ **വാസ്തുശിൽപി കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ AI ഉപദേശകൻ** (Chief Kerala Building Rules & KPBR/KMBR AI Auditor).

**പരിശോധിക്കുന്ന പ്രധാന നിയമങ്ങൾ & പ്രമാണങ്ങൾ:**
1. **KPBR 2019** (Kerala Panchayat Building Rules, 2019)
2. **KMBR 2019** (Kerala Municipality Building Rules, 2019)
3. **2026 ആഗസ്റ്റ് 2 ഗസറ്റ് ഭേദഗതി** (S.R.O. No. 682/2026 - 2m Front Yard, 50cm Side Yard, 2.4m AC Ceiling Height)
4. **അനധികൃത നിർമ്മാണ ക്രമവൽക്കരണ ചട്ടങ്ങൾ 2024** (Regularisation Rules)
5. **തീരദേശ നിയന്ത്രണ മേഖല 2019** (CRZ Notification - NDZ 50m / 200m)
6. **കേരള നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമം 2008** (Form 5 & Form 6 RDO ഇളവുകൾ)
7. **National Building Code of India (NBC 2016)**

നിങ്ങളുടെ സംശയങ്ങൾ താഴെ **ടൈപ്പ് ചെയ്തോ**, **മൈക്ക് ബട്ടൺ വഴി സംസാരിച്ചോ** ചോദിക്കാം. മറുപടികൾ **മലയാളത്തിലോ ഇംഗ്ലീഷിലോ** ലഭ്യമാകും!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sources: [
        "KPBR 2019 (ചട്ടങ്ങൾ 1-105 & പട്ടികകൾ)",
        "S.R.O. No. 682/2026 (Gazette 02-08-2026)",
        "KMBR 2019 (മുനിസിപ്പാലിറ്റി ചട്ടങ്ങൾ)",
        "CRZ Notification 2019",
        "Paddy Land & Wetland Act 2008"
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);
  const [showParamDrawer, setShowParamDrawer] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Building parameter helper state
  const [occupancy, setOccupancy] = useState<string>("A1");
  const [plotAreaSqM, setPlotAreaSqM] = useState<number>(200);
  const [builtUpAreaSqM, setBuiltUpAreaSqM] = useState<number>(150);
  const [roadWidthM, setRoadWidthM] = useState<number>(4.5);
  const [numberOfFloors, setNumberOfFloors] = useState<number>(2);

  const [selectedImage, setSelectedImage] = useState<{
    data: string;
    mimeType: string;
    preview: string;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Sync speech recognition transcript
  useEffect(() => {
    if (transcript) {
      setInputQuery(transcript);
    }
  }, [transcript]);

  // Send message
  const handleSendMessage = async (overridePrompt?: string, attachParams = false) => {
    const textToSend = overridePrompt || inputQuery;
    if (!textToSend.trim() && !selectedImage) return;

    const paramSummary = attachParams
      ? `[Building Params: Occupancy ${occupancy}, Plot: ${plotAreaSqM} sq.m, Built-up: ${builtUpAreaSqM} sq.m, Road: ${roadWidthM}m, Floors: ${numberOfFloors}]`
      : undefined;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: selectedImage?.preview,
      ruleContext: paramSummary
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    const imgPayload = selectedImage
      ? { data: selectedImage.data, mimeType: selectedImage.mimeType }
      : undefined;
    setSelectedImage(null);

    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text
      }));

      const res = await fetch("/api/building-rules/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: historyPayload,
          image: imgPayload,
          ruleContext: paramSummary,
          languagePreference: language,
          occupancyGroup: occupancy,
          plotArea: plotAreaSqM,
          builtUpArea: builtUpAreaSqM,
          roadWidth: roadWidthM
        })
      });

      const data = await res.json();
      if (res.ok && (data.text || data.reply)) {
        const replyText = data.text || data.reply;
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: "model",
          text: replyText,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: [
            "KPBR 2019 ചട്ടം 26 & പട്ടിക 4",
            "S.R.O. No. 682/2026 (Gazette 02-08-2026)",
            "KMBR 2019 & NBC 2016"
          ]
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (autoSpeak) {
          speak(replyText, aiMsg.id);
        }
      } else {
        throw new Error(data.error || "നിയമ പരിശോധന റിപ്പോർട്ട് ലഭ്യമായില്ല.");
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: "model",
        text: `⚠️ **അറിയിപ്പ്**: ${err.message || "സെർവറിൽ ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((liveTranscript) => {
        setInputQuery(liveTranscript);
      });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setSelectedImage({
        data: base64Data,
        mimeType: file.type,
        preview: result
      });
    };
    reader.readAsDataURL(file);
  };

  const KPBR_SOURCES = [
    {
      title: "KPBR 2019 (Kerala Panchayat Building Rules)",
      clause: "ചട്ടം 26 & പട്ടിക 4 (Setbacks, FAR, Coverage)",
      desc: "പഞ്ചായത്ത് പരിധിയിലെ എല്ലാത്തരം റെസിഡൻഷ്യൽ, കൊമേഴ്സ്യൽ, ഇൻഡസ്ട്രിയൽ കെട്ടിടങ്ങളുടെയും മിനിമം സെറ്റ്ബാക്കുകൾ, പരമാവധി വിസ്തീർണ്ണം, റോഡ് വീതി നിബന്ധനകൾ."
    },
    {
      title: "2026 ആഗസ്റ്റ് 2 ഗസറ്റ് ഭേദഗതി (S.R.O. No. 682/2026)",
      clause: "Rule 26(4), Proviso to 26(4), Rule 33",
      desc: "വിജ്ഞാപനം ചെയ്യാത്ത 6 മീറ്ററിൽ താഴെയുള്ള വഴികളിൽ ഒറ്റക്കുടുംബ വസതികൾക്ക് മുൻവശ സെറ്റ്ബാക്ക് 2 മീറ്ററായി കുറച്ചു. ജനലുകളോ വാതിലുകളോ ഇല്ലാത്ത ഏതെങ്കിലും ഒരു വശത്ത് 50 സെ.മീ സെറ്റ്ബാക്ക് ഇളവ്. AC മുറികളുടെ ഉയരം 2.4 മീറ്റർ."
    },
    {
      title: "തീരദേശ നിയന്ത്രണ വിജ്ഞാപനം (CRZ Notification 2019)",
      clause: "CRZ-I, CRZ-II, CRZ-III A & B, CRZ-IV",
      desc: "CRZ-III A (ഉയർന്ന ജനസാന്ദ്രതയുള്ള പഞ്ചായത്തുകൾ): വേലിയേറ്റ രേഖയിൽ നിന്ന് നോ-ഡെവലപ്‌മെന്റ് സോൺ (NDZ) 50 മീറ്റർ. CRZ-III B: 200 മീറ്റർ. ദ്വീപുകൾ: 20 മീറ്റർ."
    },
    {
      title: "കേരള നെൽവയൽ തണ്ണീർത്തട സംരക്ഷണ നിയമം 2008",
      clause: "Section 5(4), Form 5, Form 6, RDO ഇളവുകൾ",
      desc: "ഡാറ്റാ ബാങ്കിൽ ഉൾപ്പെട്ട ഭൂമി ഒഴിവാക്കൽ (Form 5), നിലം നികത്തൽ / തരംമാറ്റ ഉത്തരവുകൾ (Form 6). 25 സെന്റ് വരെയുള്ള പാർപ്പിട ആവശ്യങ്ങൾക്ക് ഫീസ് ഇളവ്."
    }
  ];

  const QUICK_QUESTIONS = [
    {
      label: "2026 ഗസറ്റ് ഭേദഗതി ഇളവുകൾ",
      query: "2026 ആഗസ്റ്റ് 2 ലെ പുതിയ ഗസറ്റ് വിജ്ഞാപന പ്രകാരം (S.R.O. No. 682/2026) റെസിഡൻഷ്യൽ വീടുകൾക്ക് ലഭിച്ചിട്ടുള്ള സെറ്റ്ബാക്ക് ഇളവുകളും 50 സെ.മീ സൈഡ് യാർഡ് നിയമവും വിശദീകരിക്കുക."
    },
    {
      label: "Group A1 വീടുകളുടെ സെറ്റ്ബാക്കുകൾ",
      query: "KPBR 2019 ചട്ടം 26 പ്രകാരം സാധാരണ റസിഡൻഷ്യൽ വീടിന് (Group A1) മുൻവശം, പിൻവശം, ഇരുവശങ്ങൾ എന്നിവയിൽ ആവശ്യമായ മിനിമം സെറ്റ്ബാക്ക് എത്രയാണ്?"
    },
    {
      label: "അനധികൃത നിർമ്മാണം ക്രമവൽക്കരണം",
      query: "കേരളത്തിലെ അനധികൃത കെട്ടിട നിർമ്മാണങ്ങൾ ക്രമവൽക്കരിക്കുന്നതിനുള്ള (Regularisation Rules 2024) വ്യവസ്ഥകളും പിഴയും അപേക്ഷാ രീതിയും എന്തെല്ലാമാണ്?"
    },
    {
      label: "തരംമാറ്റവും Form 5 & 6 നിയമങ്ങളും",
      query: "കേരള നെൽവയൽ തണ്ണീർത്തട നിയമം 2008 പ്രകാരം ഡാറ്റാ ബാങ്കിലെ തെറ്റ് തിരുത്താനും (Form 5) ഭൂമി തരംമാറ്റാനുമുള്ള (Form 6) നടപടിക്രമങ്ങളും 25 സെന്റ് ഇളവും വിശദീകരിക്കുക."
    }
  ];

  return (
    <div id="ai-kpbr-rules-agent-master" className="space-y-4">
      {/* Top Banner & Controller */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-800/60 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans">
                കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ AI ഏജന്റ് (KPBR/KMBR AI Agent)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-[11px] font-mono font-bold">
                KPBR 2019 / GAZETTE 2026
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              സെറ്റ്ബാക്കുകൾ, FAR, കവറേജ്, 2026 ഭേദഗതികൾ, CRZ, നെൽവയൽ ആക്ട് എന്നിവ ടൈപ്പ് ചെയ്തോ വോയ്‌സിലൂടെയോ ചോദിക്കാം.
            </p>
          </div>
        </div>

        {/* Language & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Language Selector */}
          <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-2xl p-1 shadow-inner text-xs font-sans">
            <button
              type="button"
              id="kpbr-lang-ml-btn"
              onClick={() => setLanguage("malayalam")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                language === "malayalam"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇲🇱 മലയാളം
            </button>
            <button
              type="button"
              id="kpbr-lang-en-btn"
              onClick={() => setLanguage("english")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                language === "english"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              id="kpbr-lang-both-btn"
              onClick={() => setLanguage("both")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                language === "both"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🌐 Both (ദ്വിഭാഷ)
            </button>
          </div>

          {/* Sources Accordion Toggle */}
          <button
            type="button"
            onClick={() => setShowSourcesDrawer((prev) => !prev)}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showSourcesDrawer
                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ചട്ടങ്ങൾ (Rules Knowledge)</span>
            {showSourcesDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Parameters Quick Audit Toggle */}
          <button
            type="button"
            onClick={() => setShowParamDrawer((prev) => !prev)}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showParamDrawer
                ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>പ്ലോട്ട് & കെട്ടിട വിവരങ്ങൾ ({occupancy})</span>
          </button>
        </div>
      </div>

      {/* Sources Drawer */}
      {showSourcesDrawer && (
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-emerald-900/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-sans">
              <ShieldCheck className="w-4 h-4" />
              <span>AI പരിഗണിക്കുന്ന ഔദ്യോഗിക നിയമങ്ങളും വിജ്ഞാപനങ്ങളും (Official Acts & Rules)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              തദ്ദേശ സ്വയംഭരണ വകുപ്പ് (LSGD) അംഗീകൃത ചട്ടങ്ങൾ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {KPBR_SOURCES.map((source, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-sans">{source.title}</h4>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                    {source.clause}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{source.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Parameter Set Drawer */}
      {showParamDrawer && (
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-emerald-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white font-sans flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>പ്ലോട്ട്, വിസ്തീർണ്ണം & റോഡ് വീതി ക്രമീകരണം (Building Parameter Setup)</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                const prompt = `ദയവായി താഴെ പറയുന്ന കെട്ടിട വിവരങ്ങൾ KPBR 2019 ചട്ടങ്ങളും 2026 ആഗസ്റ്റ് 2 ഗസറ്റ് ഭേദഗതിയും (S.R.O. 682/2026) പ്രകാരം പരിശോധിച്ച് റിപ്പോർട്ട് നൽകുക:
- Occupancy: Group ${occupancy}
- പ്ലോട്ട് വിസ്തീർണ്ണം: ${plotAreaSqM} ച.മീ (${(plotAreaSqM * 10.764).toFixed(0)} ച.അടി)
- ആകെ നിർമ്മിത വിസ്തീർണ്ണം: ${builtUpAreaSqM} ച.മീ (${(builtUpAreaSqM * 10.764).toFixed(0)} ച.അടി)
- റോഡ് വീതി: ${roadWidthM} മീറ്റർ
- നിലകളുടെ എണ്ണം: ${numberOfFloors}
ആവശ്യമായ ഫ്രണ്ട്, റിയർ, സൈഡ് സെറ്റ്ബാക്കുകൾ, കവറേജ്, പാർക്കിംഗ് നിയമങ്ങൾ വിശദമാക്കുക.`;
                handleSendMessage(prompt, true);
                setShowParamDrawer(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ഈ പ്ലാൻ AI ഓഡിറ്റ് ചെയ്യുക (Audit With AI)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Occupancy */}
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-sans">Occupancy Group:</label>
              <select
                value={occupancy}
                onChange={(e) => setOccupancy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-sans focus:outline-none focus:border-emerald-500"
              >
                <option value="A1">Group A1: Residential (വീടുകൾ / അപ്പാർട്ട്മെന്റ്)</option>
                <option value="A2">Group A2: Lodging / Hostel / Resort</option>
                <option value="B">Group B: Educational (സ്കൂൾ / കോളേജ്)</option>
                <option value="C">Group C: Medical / Hospital</option>
                <option value="D">Group D: Assembly (കല്യാണമണ്ഡപം / ഓഡിറ്റോറിയം)</option>
                <option value="E">Group E: Office / Business</option>
                <option value="F">Group F: Commercial / Shops (കടകൾ / മാളുകൾ)</option>
                <option value="G1">Group G1: Industrial (വ്യവസായം)</option>
                <option value="H">Group H: Storage / Warehouse</option>
              </select>
            </div>

            {/* Plot Area */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-slate-300">പ്ലോട്ട് (Plot Sq.M):</span>
                <span className="text-emerald-400 font-mono font-bold">{plotAreaSqM} m²</span>
              </div>
              <input
                type="number"
                value={plotAreaSqM}
                onChange={(e) => setPlotAreaSqM(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                ~{(plotAreaSqM * 10.764).toFixed(0)} Sq.Ft ({(plotAreaSqM / 40.468).toFixed(1)} Cents)
              </span>
            </div>

            {/* Built-up Area */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-slate-300">നിർമ്മിത വിസ്തീർണ്ണം:</span>
                <span className="text-emerald-400 font-mono font-bold">{builtUpAreaSqM} m²</span>
              </div>
              <input
                type="number"
                value={builtUpAreaSqM}
                onChange={(e) => setBuiltUpAreaSqM(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                ~{(builtUpAreaSqM * 10.764).toFixed(0)} Sq.Ft
              </span>
            </div>

            {/* Road Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-slate-300">റോഡ് വീതി (Road):</span>
                <span className="text-emerald-400 font-mono font-bold">{roadWidthM} m</span>
              </div>
              <input
                type="number"
                step="0.5"
                value={roadWidthM}
                onChange={(e) => setRoadWidthM(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">
                {roadWidthM < 6 ? "വിജ്ഞാപനം ചെയ്യാത്ത വഴി (< 6m) -> 2m സെറ്റ്ബാക്ക്" : ">= 6m വീതിയുള്ള വഴി"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Voice Control Bar */}
      <VoiceControlBar
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        currentSpokenText={currentSpokenText}
        rate={rate}
        autoSpeak={autoSpeak}
        language={language}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onReplay={() => {
          if (currentSpokenText) {
            speak(currentSpokenText);
          }
        }}
        onChangeRate={changeRate}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        themeColor="emerald"
      />

      {/* Main Chat Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col min-h-[480px] max-h-[700px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg) => {
            const isModel = msg.role === "model";
            const isPlayingThis = isSpeaking && activeMessageId === msg.id;
            const isPausedThis = isPaused && activeMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isModel ? "items-start" : "items-start flex-row-reverse"}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                    isModel
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-bold border border-emerald-400/50"
                      : "bg-slate-800 text-emerald-400 border border-slate-700"
                  }`}
                >
                  {isModel ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-lg space-y-2.5 ${
                    isModel
                      ? "bg-slate-950/90 border border-slate-800 text-slate-100"
                      : "bg-gradient-to-r from-emerald-900/80 to-teal-950/80 border border-emerald-700/50 text-white"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-sans">
                        {isModel ? "കെട്ടിട ചട്ടങ്ങൾ AI (KPBR Legal Auditor)" : "നിങ്ങൾ (You)"}
                      </span>
                      {msg.ruleContext && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-[10px]">
                          {msg.ruleContext}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                  </div>

                  {/* Uploaded Image Preview */}
                  {msg.image && (
                    <div className="rounded-2xl overflow-hidden border border-slate-700 max-w-sm">
                      <img
                        src={msg.image}
                        alt="Uploaded site plan or blueprint"
                        className="w-full h-auto object-cover max-h-60"
                      />
                    </div>
                  )}

                  {/* Body Text */}
                  <div className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap text-slate-200">
                    {msg.text}
                  </div>

                  {/* Sources tag */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <span className="text-emerald-400 font-bold">ആധാരമാക്കിയ ചട്ടങ്ങൾ:</span>
                      {msg.sources.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Controls: Speak, Pause, Stop, Copy */}
                  {isModel && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Voice read aloud controls */}
                        {isPlayingThis && !isPausedThis ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={pause}
                              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Pause reading aloud"
                            >
                              <Pause className="w-3 h-3 fill-current" />
                              <span>Pause</span>
                            </button>
                            <button
                              type="button"
                              onClick={stop}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Stop reading aloud"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          </div>
                        ) : isPlayingThis && isPausedThis ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={resume}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Resume reading aloud"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Resume</span>
                            </button>
                            <button
                              type="button"
                              onClick={stop}
                              className="px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Stop reading aloud"
                            >
                              <Square className="w-3 h-3 fill-current" />
                              <span>Stop</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => speak(msg.text, msg.id)}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Read this answer aloud in selected language"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>വായിക്കുക (Listen)</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">പകർത്തി (Copied)</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs font-mono animate-pulse pl-2">
              <div className="w-8 h-8 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Building2 className="w-4 h-4 animate-spin" />
              </div>
              <span>KPBR 2019 ചട്ടങ്ങളും 2026 ഗസറ്റ് ഭേദഗതികളും പരിശോധിച്ച് മറുപടി തയ്യാറാക്കുന്നു...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggested Questions Pill Bar */}
        <div className="pt-3 pb-2 overflow-x-auto flex items-center gap-2 border-t border-slate-800/80 scrollbar-none">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0">
            വേഗത്തിൽ ചോദിക്കാം:
          </span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q.query)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-600/60 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 text-xs font-sans whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-sm"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-emerald-800/60 mb-2">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage.preview}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded-xl border border-slate-700"
              />
              <div>
                <div className="text-xs font-bold text-white font-sans">
                  സൈറ്റ് പ്ലാൻ / ഡ്രോയിംഗ് അറ്റാച്ച് ചെയ്തു
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  കെട്ടിട ചട്ട പരിശോധനയ്ക്കായി AI-ക്ക് സമർപ്പിക്കാൻ തയ്യാറാണ്
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="relative pt-2">
          <div
            className={`flex items-center gap-2 bg-slate-950 border rounded-2xl p-2 transition-all shadow-xl ${
              isListening
                ? "border-rose-500 shadow-rose-950/50 ring-2 ring-rose-500/30"
                : "border-slate-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20"
            }`}
          >
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-emerald-300 hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              title="Upload Site Plan / Blueprint"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />

            {/* Input Field */}
            <input
              type="text"
              id="kpbr-agent-text-input"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                isListening
                  ? "സംസാരിക്കൂ... നിങ്ങളുടെ ശബ്ദം രേഖപ്പെടുത്തുന്നു (Listening...)"
                  : language === "english"
                  ? "Ask anything about KPBR 2019, 2026 Gazette setbacks, FAR, CRZ, Paddy Land Act..."
                  : "സെറ്റ്ബാക്കുകൾ, 2026 ഗസറ്റ് ഇളവുകൾ, FAR, കവറേജ്, CRZ, നെൽവയൽ ചട്ടങ്ങൾ ചോദിക്കുക..."
              }
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-sans px-1"
            />

            {/* Microphone Button */}
            <button
              type="button"
              id="kpbr-agent-mic-btn"
              onClick={handleVoiceToggle}
              className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40"
                  : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
              title={isListening ? "Stop listening" : "Ask by speaking (Voice input in Malayalam/English)"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              id="kpbr-agent-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputQuery.trim() && !selectedImage)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <span>ചോദിക്കുക</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Listening Notice */}
          {isListening && (
            <div className="absolute -top-7 left-4 flex items-center gap-2 text-[11px] font-mono text-rose-400 animate-pulse bg-slate-950/90 px-3 py-0.5 rounded-full border border-rose-500/40">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>
                മൈക്രോഫോൺ ഓൺ ആണ് (ഭാഷ: {language === "english" ? "English" : "മലയാളം"}). സംസാരിക്കൂ...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
