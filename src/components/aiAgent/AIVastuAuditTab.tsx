import React, { useState, useRef, useEffect } from "react";
import {
  Compass,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Send,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Flame,
  Droplets,
  Wind,
  Sun,
  Bot,
  User,
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
  FileText,
  Sliders,
  Layers,
  HelpCircle
} from "lucide-react";
import { useAIVoiceEngine, LanguagePref } from "./useAIVoiceEngine";
import { VoiceControlBar } from "./VoiceControlBar";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  image?: string;
  measurementContext?: string;
  sources?: string[];
}

export const AIVastuAuditTab: React.FC = () => {
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
      id: "msg_vastu_welcome",
      role: "model",
      text: `നമസ്കാരം! ഞാൻ **വാസ്തുശിൽപി തച്ചുശാസ്ത്ര & വാസ്തുവിദ്യ AI ഉപദേശകൻ** (Chief Vedic Architectural AI Consultant).
      
പരമ്പരാഗത കേരള തച്ചുശാസ്ത്ര പ്രമാണങ്ങളായ **മനുഷ്യാലയ ചന്ദ്രിക, വാസ്തുവിദ്യ, തച്ചുമുറകൾ, മയമതം, ശില്പരത്നം, ആയാദി ഷഡ്വർഗ്ഗ ഗണിതങ്ങൾ** എന്നിവയെല്ലാം ആധാരമാക്കി നിങ്ങളുടെ ഗൃഹനിർമ്മാണ സംശയങ്ങൾക്ക് ആധികാരികമായ മറുപടി നൽകാൻ ഞാൻ സദാ സന്നദ്ധനാണ്.

നിങ്ങൾക്ക് സംശയങ്ങൾ താഴെ **ടൈപ്പ് ചെയ്തോ**, **മൈക്ക് ബട്ടൺ അമർത്തി സംസാരിച്ചോ (Voice)** ചോദിക്കാം. മറുപടികൾ **മലയാളത്തിലോ (Malayalam)** അല്ലെങ്കിൽ **ഇംഗ്ലീഷിലോ (English)** ലഭ്യമാകും. പ്ലാനുകളോ സ്കെച്ചുകളോ അറ്റാച്ച് ചെയ്തും പരിശോധിക്കാം!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      sources: [
        "മനുഷ്യാലയ ചന്ദ്രിക (Manushyalaya Chandrika)",
        "വാസ്തുവിദ്യാ തച്ചുശാസ്ത്രം (Vastu Vidya)",
        "ശില്പരത്നം (Silparatnam)",
        "മയമതം (Mayamatam)",
        "ആയാദി ഷഡ്വർഗ്ഗ പ്രമാണങ്ങൾ (Ayadi Shadvarga)"
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kol, setKol] = useState<number>(20);
  const [viral, setViral] = useState<number>(8);
  const [showSourcesDrawer, setShowSourcesDrawer] = useState(false);
  const [showCalcDrawer, setShowCalcDrawer] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  // Sync transcript from voice engine to input query
  useEffect(() => {
    if (transcript) {
      setInputQuery(transcript);
    }
  }, [transcript]);

  // Vastu calculation helper
  const calculateVastuDetails = (k: number, v: number) => {
    const totalVirals = k * 24 + v;
    const chuttuCm = totalVirals * 3;
    const chuttuFeet = (chuttuCm / 30.48).toFixed(2);
    const chuttuInches = (chuttuCm / 2.54).toFixed(1);

    const yoniIndex = ((chuttuCm * 3) % 8) || 8;
    const YONIS: Record<number, { name: string; nameMl: string; direction: string; result: "Utthamam" | "Adhamam" | "Madhyamam" }> = {
      1: { name: "Dhwajam", nameMl: "ധ്വജം (കിഴക്ക് - East)", direction: "East", result: "Utthamam" },
      2: { name: "Dhoomam", nameMl: "ധൂമം (തെക്ക്-കിഴക്ക് - SE)", direction: "South-East", result: "Adhamam" },
      3: { name: "Simham", nameMl: "സിംഹം (തെക്ക് - South)", direction: "South", result: "Utthamam" },
      4: { name: "Shwanam", nameMl: "ശ്വാനം (തെക്ക്-പടിഞ്ഞാറ് - SW)", direction: "South-West", result: "Adhamam" },
      5: { name: "Vrishabham", nameMl: "വൃഷഭം (പടിഞ്ഞാറ് - West)", direction: "West", result: "Utthamam" },
      6: { name: "Kharam", nameMl: "ഖരം (വടക്ക്-പടിഞ്ഞാറ് - NW)", direction: "North-West", result: "Adhamam" },
      7: { name: "Gajam", nameMl: "ഗജം (വടക്ക് - North)", direction: "North", result: "Utthamam" },
      8: { name: "Wayasam", nameMl: "വായസം (വടക്ക്-കിഴക്ക് - NE)", direction: "North-East", result: "Adhamam" }
    };

    const yoni = YONIS[yoniIndex] || YONIS[1];
    const vyayam = ((chuttuCm * 3) % 14) || 14;
    const aayam = ((chuttuCm * 8) % 12) || 12;
    const nakshatram = ((chuttuCm * 8) % 27) || 27;
    const vayassu = vyayam < aayam ? "ബാല്യം (ഉത്തമം - Auspicious)" : "വാർദ്ധക്യം (മധ്യമം - Moderate)";

    return {
      kol: k,
      viral: v,
      chuttuCm,
      chuttuFeet,
      chuttuInches,
      yoni,
      vyayam,
      aayam,
      nakshatram,
      vayassu,
      isUtthamam: yoni.result === "Utthamam" && aayam >= vyayam
    };
  };

  const currentMath = calculateVastuDetails(kol, viral);

  // Send message
  const handleSendMessage = async (overridePrompt?: string, attachCurrentMath = false) => {
    const textToSend = overridePrompt || inputQuery;
    if (!textToSend.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: selectedImage?.preview,
      measurementContext: attachCurrentMath
        ? `${kol} Kol ${viral} Viral (${currentMath.chuttuCm} cm / ${currentMath.chuttuFeet} ft) - ${currentMath.yoni.nameMl}`
        : undefined
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

      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          history: historyPayload,
          image: imgPayload,
          languagePreference: language,
          currentMeasurement: {
            kol,
            viral,
            chuttuCm: currentMath.chuttuCm,
            chuttuFeetInches: `${currentMath.chuttuFeet} ft`,
            yoniName: currentMath.yoni.name,
            phalam: currentMath.yoni.result
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.text) {
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: "model",
          text: data.text,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: [
            "മനുഷ്യാലയ ചന്ദ്രിക (Manushyalaya Chandrika)",
            "തച്ചുശാസ്ത്ര പ്രമാണങ്ങൾ (Thachu Shastra)",
            "ആയാദി ഷഡ്വർഗ്ഗ കണക്കുകൂട്ടലുകൾ (Ayadi)"
          ]
        };
        setMessages((prev) => [...prev, aiMsg]);

        // Auto speak if enabled
        if (autoSpeak) {
          speak(data.text, aiMsg.id);
        }
      } else {
        throw new Error(data.error || "AI സെർവറിൽ നിന്നും പ്രതികരണം ലഭ്യമായില്ല.");
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

  const VASTU_SOURCES = [
    {
      title: "മനുഷ്യാലയ ചന്ദ്രിക (Manushyalaya Chandrika)",
      author: "തിരുമംഗലത്ത് ശ്രീ നീലകണ്ഠൻ മൂസ്സത്",
      desc: "കേരള തച്ചുശാസ്ത്രത്തിലെ ഏറ്റവും ആധികാരിക ഗ്രന്ഥം. 16 അധ്യായങ്ങളിലായി ഗൃഹനിർമ്മാണത്തിന് ആവശ്യമായ കോൽ, വിരൽ, ചുറ്റളവ്, ആയാദി ഷഡ്വർഗ്ഗം, കട്ടിളകൾ, മേൽക്കൂര നിർമ്മാണം എന്നിവ പ്രതിപാദിക്കുന്നു."
    },
    {
      title: "വാസ്തുവിദ്യ (Vastu Vidya Treatises)",
      author: "പരമ്പരാഗത തച്ചുശാസ്ത്ര ശില്പികൾ",
      desc: "ഭൂമി പരീക്ഷ, ദിശാനിർണ്ണയം (ശങ്കുസ്ഥാപനം), മുറികളുടെ ഉത്തമ സ്ഥാനങ്ങൾ (അടുക്കള, കിടപ്പുമുറി, പൂജ), കട്ടിളവെപ്പ് തുടങ്ങിയ പ്രായോഗിക നിയമങ്ങൾ."
    },
    {
      title: "മയമതം & ശില്പരത്നം (Mayamatam & Silparatnam)",
      author: "മയമുനി & ശ്രീകുമാരൻ",
      desc: "അഷ്ടയോനികൾ (ധ്വജം, ധൂമം, സിംഹം, ശ്വാനം, വൃഷഭം, ഖരം, ഗജം, വായസം), ഗുണദോഷ ഫലങ്ങൾ, വാസ്തുപുരുഷ മണ്ഡലം."
    },
    {
      title: "ആയാദി ഷഡ്വർഗ്ഗം (Ayadi Shadvarga Math)",
      author: "വേദിക് ഗണിതശാസ്ത്ര പ്രമാണങ്ങൾ",
      desc: "ആയം (വരവ്), വ്യയം (ചെലവ്), യോനി, നക്ഷത്രം, വാരം, തിഥി, വയസ്സ് (ബാല്യം/യൗവനം/വാർദ്ധക്യം) എന്നിവയുടെ കൃത്യമായ കണക്കുകൂട്ടൽ രീതികൾ."
    }
  ];

  const QUICK_QUESTIONS = [
    {
      label: "ഉത്തമ യോനികളും ചുറ്റളവുകളും",
      query: "വീട് നിർമ്മാണത്തിന് ഏറ്റവും ഉത്തമമായ ധ്വജയോനി (കിഴക്ക്), ഗജയോനി (വടക്ക്), സിംഹയോനി (തെക്ക്) ചുറ്റളവുകളും അവയുടെ കോൽ-വിരൽ കണക്കുകളും വിശദീകരിക്കുക."
    },
    {
      label: "മുറികളുടെ ശരിയായ സ്ഥാനങ്ങൾ",
      query: "മനുഷ്യാലയ ചന്ദ്രിക പ്രകാരം അടുക്കള (ആഗ്നേയം), പ്രധാന കിടപ്പുമുറി (കന്നിമൂല), പൂജാമുറി (ഈശാനകോൺ), കോണിപ്പടി (തെക്ക്/പടിഞ്ഞാറ്) എന്നിവയുടെ ഉത്തമ സ്ഥാനങ്ങൾ ഏവ?"
    },
    {
      label: "പ്രധാന കട്ടിള (Main Door) നിയമം",
      query: "വീടിന്റെ പ്രധാന കട്ടിള (Front Door) വെക്കേണ്ട സ്ഥാനവും അളവുകളും വാസ്തു പ്രകാരം എങ്ങനെ നിശ്ചയിക്കണം?"
    },
    {
      label: "കിണറും സെപ്റ്റിക് ടാങ്കും",
      query: "കിണറും സെപ്റ്റിക് ടാങ്കും സ്ഥാപിക്കാൻ വാസ്തു ശാസ്ത്രം അനുശാസിക്കുന്ന സ്ഥാനങ്ങൾ ഏതെല്ലാമാണ്?"
    }
  ];

  return (
    <div id="ai-vastu-agent-master" className="space-y-4">
      {/* Top Banner & Control Station */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-800/60 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-950">
            <Compass className="w-7 h-7 animate-spin-slow" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans">
                തച്ചു ശാസ്ത്ര & വാസ്തു AI ഏജന്റ് (Vasthu AI Agent)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-600 text-cyan-300 text-[11px] font-mono font-bold">
                MANUSHYALAYA CHANDRIKA
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1">
              ടൈപ്പ് ചെയ്തോ വോയ്‌സിലൂടെയോ സംശയങ്ങൾ ചോദിക്കാം. മലയാളത്തിലും ഇംഗ്ലീഷിലും ആധികാരിക വിശദീകരണങ്ങൾ.
            </p>
          </div>
        </div>

        {/* Language Selection & Action Toggles */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Language Selector Pill */}
          <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-2xl p-1 shadow-inner text-xs font-sans">
            <button
              type="button"
              id="vastu-lang-ml-btn"
              onClick={() => setLanguage("malayalam")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                language === "malayalam"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇲🇱 മലയാളം
            </button>
            <button
              type="button"
              id="vastu-lang-en-btn"
              onClick={() => setLanguage("english")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                language === "english"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              id="vastu-lang-both-btn"
              onClick={() => setLanguage("both")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                language === "both"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🌐 Both (ദ്വിഭാഷ)
            </button>
          </div>

          {/* Treatises / Sources Button */}
          <button
            type="button"
            onClick={() => setShowSourcesDrawer((prev) => !prev)}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showSourcesDrawer
                ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>പ്രമാണങ്ങൾ (Sources)</span>
            {showSourcesDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Quick Kol Calculator Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowCalcDrawer((prev) => !prev)}
            className={`px-3 py-2 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showCalcDrawer
                ? "bg-cyan-950 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>ചുറ്റളവ് കാൽക്കുലേറ്റർ ({kol}K {viral}V)</span>
          </button>
        </div>
      </div>

      {/* Sources Drawer */}
      {showSourcesDrawer && (
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-cyan-900/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm font-sans">
              <ShieldCheck className="w-4 h-4" />
              <span>തച്ചുശാസ്ത്ര AI ആധാരമാക്കുന്ന ആധികാരിക പ്രമാണങ്ങൾ (Authoritative Vastu Sources)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              7 പ്രധാന വേദഗ്രന്ഥങ്ങൾ & തച്ചുമുറകൾ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {VASTU_SOURCES.map((source, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white font-sans">{source.title}</h4>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-800">
                    {source.author}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{source.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Calculator Slider Drawer */}
      {showCalcDrawer && (
        <div className="p-5 rounded-3xl bg-slate-900/95 border border-cyan-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white font-sans flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>തത്സമയ കോൽ-വിരൽ അളവും ആയാദി ഫലവും (Live Measurement & Yoni Result)</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                const prompt = `ദയവായി ഞാൻ തിരഞ്ഞെടുത്ത അളവായ ${kol} കോൽ ${viral} വിരൽ (ചുറ്റളവ്: ${currentMath.chuttuCm} cm / ${currentMath.chuttuFeet} അടി, യോനി: ${currentMath.yoni.nameMl}, ആയം: ${currentMath.aayam}, വ്യയം: ${currentMath.vyayam}) മനുഷ്യാലയ ചന്ദ്രിക പ്രകാരം പരിശോധിച്ച് ഇതിന്റെ ഗുണദോഷ ഫലങ്ങളും ഉത്തമ മുറികളുടെ വിന്യാസവും വിശദീകരിക്കുക.`;
                handleSendMessage(prompt, true);
                setShowCalcDrawer(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-cyan-950"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ഈ അളവ് AI-യോട് ചോദിക്കുക (Analyze With AI)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kol Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-slate-300">കോൽ (Kol):</span>
                <span className="text-cyan-400 font-mono font-bold text-sm">{kol} കോൽ</span>
              </div>
              <input
                type="range"
                min={1}
                max={50}
                value={kol}
                onChange={(e) => setKol(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 Kol (72 cm)</span>
                <span>25 Kol</span>
                <span>50 Kol</span>
              </div>
            </div>

            {/* Viral Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-sans">
                <span className="text-slate-300">വിരൽ (Viral):</span>
                <span className="text-cyan-400 font-mono font-bold text-sm">{viral} വിരൽ</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                value={viral}
                onChange={(e) => setViral(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0 Viral</span>
                <span>12 Viral</span>
                <span>23 Viral (3 cm each)</span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-[10px] text-slate-500 font-mono">ചുറ്റളവ് (Perimeter)</div>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                {currentMath.chuttuCm} cm ({currentMath.chuttuFeet} ft)
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">യോനി (Yoni)</div>
              <div className="text-xs font-bold text-cyan-400 font-sans mt-0.5">
                {currentMath.yoni.nameMl}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">ആയം / വ്യയം</div>
              <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">
                ആയം: {currentMath.aayam} | വ്യയം: {currentMath.vyayam}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-mono">ഫലം (Phalam)</div>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                  currentMath.isUtthamam
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                }`}
              >
                {currentMath.isUtthamam ? "ഉത്തമം (Auspicious)" : "അധമം / ശ്രദ്ധിക്കുക"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Voice Control Bar */}
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
        themeColor="cyan"
      />

      {/* Main Chat Stream Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl flex flex-col min-h-[480px] max-h-[700px]">
        {/* Messages Scroll Area */}
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
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-bold border border-cyan-400/50"
                      : "bg-slate-800 text-cyan-400 border border-slate-700"
                  }`}
                >
                  {isModel ? <Compass className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                {/* Message Bubble Card */}
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-3xl p-4 sm:p-5 shadow-lg space-y-2.5 ${
                    isModel
                      ? "bg-slate-950/90 border border-slate-800 text-slate-100"
                      : "bg-gradient-to-r from-cyan-900/80 to-blue-950/80 border border-cyan-700/50 text-white"
                  }`}
                >
                  {/* Header info in bubble */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-sans">
                        {isModel ? "വാസ്തുശിൽപി AI (Vedic Architect)" : "നിങ്ങൾ (You)"}
                      </span>
                      {msg.measurementContext && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px]">
                          {msg.measurementContext}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{msg.timestamp}</span>
                  </div>

                  {/* Attached Image if any */}
                  {msg.image && (
                    <div className="rounded-2xl overflow-hidden border border-slate-700 max-w-sm">
                      <img
                        src={msg.image}
                        alt="Uploaded blueprint or plan"
                        className="w-full h-auto object-cover max-h-60"
                      />
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap text-slate-200">
                    {msg.text}
                  </div>

                  {/* Sources tag if provided */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
                      <span className="text-cyan-400 font-bold">പ്രമാണങ്ങൾ:</span>
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
                        {/* Message Speak / Pause / Resume / Stop Controls */}
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
                              className="px-2.5 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
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
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
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
              <div className="w-8 h-8 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Compass className="w-4 h-4 animate-spin" />
              </div>
              <span>വേദഗ്രന്ഥങ്ങളും മനുഷ്യാലയ ചന്ദ്രികയും പരിശോധിച്ച് മറുപടി തയ്യാറാക്കുന്നു...</span>
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
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-600/60 hover:bg-cyan-950/40 text-slate-300 hover:text-cyan-300 text-xs font-sans whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-sm"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Image Attachment Preview Badge */}
        {selectedImage && (
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950 border border-cyan-800/60 mb-2">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage.preview}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded-xl border border-slate-700"
              />
              <div>
                <div className="text-xs font-bold text-white font-sans">
                  പ്ലാൻ / സ്കെച്ച് ചിത്രം അറ്റാച്ച് ചെയ്തു
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  വാസ്തു വിശകലനത്തിനായി AI-ക്ക് അയക്കാൻ തയ്യാറാണ്
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

        {/* Input Bar with Typing, Voice Mic Button, Attachment & Send */}
        <div className="relative pt-2">
          <div
            className={`flex items-center gap-2 bg-slate-950 border rounded-2xl p-2 transition-all shadow-xl ${
              isListening
                ? "border-rose-500 shadow-rose-950/50 ring-2 ring-rose-500/30"
                : "border-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20"
            }`}
          >
            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
              title="Upload Blueprint / Kattala Image"
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

            {/* Text Input Field */}
            <input
              type="text"
              id="vastu-agent-text-input"
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
                  ? "Ask anything about Vasthu Shastra, Kol dimensions, Yoni calculations..."
                  : "വാസ്തു സംശയങ്ങൾ, കോൽ-വിരൽ അളവുകൾ, കട്ടിള, അടുക്കള സ്ഥാനങ്ങൾ ചോദിക്കുക..."
              }
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-sans px-1"
            />

            {/* Voice Input (Microphone) Button */}
            <button
              type="button"
              id="vastu-agent-mic-btn"
              onClick={handleVoiceToggle}
              className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40"
                  : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
              title={isListening ? "Stop listening" : "Ask by speaking (Voice input in Malayalam/English)"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              id="vastu-agent-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputQuery.trim() && !selectedImage)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <span>ചോദിക്കുക</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Listening Indicator Note */}
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
