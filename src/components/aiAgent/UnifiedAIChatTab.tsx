import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Compass,
  Building2,
  MapPin,
  FileSpreadsheet,
  HardHat,
  FileCode,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Clock,
  Download,
  Share2
} from "lucide-react";
import { MaleAIAvatar } from "./MaleAIAvatar";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  image?: string;
  discipline?: string;
  citations?: string[];
}

export const UnifiedAIChatTab: React.FC<{
  onSwitchDisciplineTab?: (tabId: string) => void;
}> = ({ onSwitchDisciplineTab }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_welcome",
      role: "model",
      text: `നമസ്കാരം! ഞാൻ **വാസ്തുശിൽപി AI** (Senior Chief AI Architect & Consultant).

വാസ്തു ശാസ്ത്രം (തച്ചുശാസ്ത്രം), KPBR 2019/2026 കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ, ലാൻഡ് സർവ്വേ (FMB), കേരള PWD റേറ്റ് എസ്റ്റിമേറ്റുകൾ, സിവിൽ സ്ട്രക്ചറൽ കണക്കുകൂട്ടലുകൾ എന്നിവയിലെല്ലാം ഞാൻ നിങ്ങളെ സഹായിക്കാൻ സദാ സന്നദ്ധനാണ്.

താഴെ നൽകിയിരിക്കുന്ന പ്രോംപ്റ്റുകൾ ഉപയോഗിച്ചോ, നേരിട്ട് എഴുതി ചോദിച്ചോ, അല്ലെങ്കിൽ വോയ്‌സ് മൈക്ക് ഓണാക്കി സംസാരിച്ചോ നിങ്ങളുടെ സംശയങ്ങൾ ചോദിക്കാം. ബ്ലൂപ്രിന്റുകളോ പ്ലാനുകളോ അറ്റാച്ച് ചെയ്തും പരിശോധിക്കാം!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      discipline: "Chief AI Consultant",
      citations: [
        "മനുഷ്യാലയ ചന്ദ്രിക (Manushyalaya Chandrika)",
        "KPBR 2019 / S.R.O. No. 682/2026 Gazette",
        "Kerala PWD DSR Schedule of Rates",
        "IS 456:2000 Plain & Reinforced Concrete"
      ]
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "thinking" | "speaking" | "listening">("idle");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentSpeakingText, setCurrentSpeakingText] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDisciplineFilter, setActiveDisciplineFilter] = useState<string>("all");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "ml-IN"; // Malayalam first, fallback to en-IN

      recog.onstart = () => {
        setIsListening(true);
        setAvatarStatus("listening");
      };

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recog.onerror = () => {
        setIsListening(false);
        setAvatarStatus("idle");
      };

      recog.onend = () => {
        setIsListening(false);
        if (avatarStatus === "listening") {
          setAvatarStatus("idle");
        }
      };

      recognitionRef.current = recog;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("നിങ്ങളുടെ ബ്രൗസറിൽ സ്പീച്ച് റെക്കഗ്നിഷൻ ലഭ്യമല്ല. ദയവായി Google Chrome ഉപയോഗിക്കുക.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setAvatarStatus("idle");
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  // Text-To-Speech Synthesis
  const speakText = (text: string) => {
    if (isAudioMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    // Clean markdown for speech
    const cleanText = text
      .replace(/[*_#`[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 0.95; // Authoritative, warm male voice

    // Try finding Malayalam or Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const malayalamVoice = voices.find((v) => v.lang.includes("ml") || v.lang.includes("Malayalam"));
    const indianVoice = voices.find((v) => v.lang.includes("en-IN") || v.name.includes("India"));

    if (malayalamVoice) {
      utterance.voice = malayalamVoice;
    } else if (indianVoice) {
      utterance.voice = indianVoice;
    }

    utterance.onstart = () => {
      setAvatarStatus("speaking");
      setCurrentSpeakingText(cleanText.slice(0, 140));
    };

    utterance.onend = () => {
      setAvatarStatus("idle");
      setCurrentSpeakingText("");
    };

    utterance.onerror = () => {
      setAvatarStatus("idle");
      setCurrentSpeakingText("");
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleMute = () => {
    if (!isAudioMuted) {
      window.speechSynthesis?.cancel();
      setAvatarStatus("idle");
      setCurrentSpeakingText("");
    }
    setIsAudioMuted((prev) => !prev);
  };

  // Handle Image Upload for Vision AI
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

  // Send Message Handler
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      image: selectedImage?.preview
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    const imagePayload = selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined;
    setSelectedImage(null);

    setIsLoading(true);
    setAvatarStatus("thinking");

    try {
      // Build conversation history payload
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        text: m.text
      }));

      // Enhanced engineering system prompt for the unified agent
      const enhancedPrompt = `[Discipline: ${activeDisciplineFilter.toUpperCase()} | Language: Malayalam with technical English terms]\n\nUser Question: ${textToSend}`;

      const res = await fetch("/api/ai-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: enhancedPrompt,
          history: historyPayload,
          image: imagePayload
        })
      });

      const data = await res.json();

      if (res.ok && data.text) {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          role: "model",
          text: data.text,
          timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          discipline: "VASTHUSILPY AI • Consultant"
        };
        setMessages((prev) => [...prev, aiMessage]);
        speakText(data.text);
      } else {
        throw new Error(data.error || "Failed to fetch response from AI Chief Engineer.");
      }
    } catch (err: any) {
      const errMsg: Message = {
        id: `err_${Date.now()}`,
        role: "model",
        text: `⚠️ **അറിയിപ്പ്**: ${err.message || "സെർവറിൽ ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, errMsg]);
      setAvatarStatus("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const QUICK_PROMPTS = [
    {
      label: "വാസ്തു ശുഭ ചുറ്റളവ് (Vastu Auspicious Kol)",
      prompt: "വീട് നിർമ്മാണത്തിന് ഏറ്റവും ഉത്തമമായ ധ്വജയോനി (കിഴക്ക്), ഗജയോനി (വടക്ക്) ചുറ്റളവുകളും കോൽ-വിരൽ അളവുകളും ഏതൊക്കെയാണ്?",
      icon: Compass,
      tab: "ai_vastu",
      color: "border-cyan-800 text-cyan-400 hover:bg-cyan-950/60"
    },
    {
      label: "KPBR 2026 സെറ്റ്ബാക്ക് നിയമങ്ങൾ (KPBR Setbacks)",
      prompt: "KPBR 2019 / 2026 ഗസറ്റ് വിജ്ഞാപന പ്രകാരം റസിഡൻഷ്യൽ കെട്ടിടത്തിന് മുൻവശം, പിൻവശം, വശങ്ങൾ എന്നിവിടങ്ങളിൽ എത്ര മീറ്റർ സെറ്റ്ബാക്ക് ഒഴിച്ചിടണം?",
      icon: Building2,
      tab: "ai_kpbr",
      color: "border-emerald-800 text-emerald-400 hover:bg-emerald-950/60"
    },
    {
      label: "FMB സർവ്വേ & ലാഡർ പരിശോധന (FMB Ladder)",
      prompt: "റവന്യൂ FMB സർവ്വേ സ്കെച്ചിലെ ലാഡർ റീഡിംഗുകളും ടൈ ലൈനുകളും (Tie lines) ഓഫ്സെറ്റുകളും എങ്ങനെയാണ് കൃത്യമായി വ്യാഖ്യാനിക്കുന്നത്?",
      icon: MapPin,
      tab: "ai_survey",
      color: "border-blue-800 text-blue-400 hover:bg-blue-950/60"
    },
    {
      label: "1000 Sq.Ft എസ്റ്റിമേറ്റ് & മെറ്റീരിയൽ (1000 Sq.Ft BOQ)",
      prompt: "കേരളത്തിൽ 1000 ചതുരശ്ര അടി വീട് പണിയാൻ ആവശ്യമായ സിമന്റ് (ചാക്ക്), കമ്പി (ടൺ), എം-സാൻഡ്, ചെങ്കല്ല് അളവുകളും ഏകദേശ ചിലവും കണക്കാക്കുക.",
      icon: FileSpreadsheet,
      tab: "ai_estimate",
      color: "border-amber-800 text-amber-400 hover:bg-amber-950/60"
    },
    {
      label: "IS 456 കോൺക്രീറ്റ് മിക്സ് (RCC Mix Proportions)",
      prompt: "റൂഫ് സ്ലാബ്, ബീം, കോളം വാർപ്പുകൾക്ക് IS 456 അനുസരിച്ചുള്ള M20 / M25 കോൺക്രീറ്റ് മിക്സ് റേഷ്യോയും വാട്ടർ സിമന്റ് അനുപാതവും എന്താണ്?",
      icon: HardHat,
      tab: "ai_structural",
      color: "border-rose-800 text-rose-400 hover:bg-rose-950/60"
    }
  ];

  return (
    <div id="unified-ai-chat-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Realistic Male AI Avatar Card & Controls (4 cols on lg) */}
      <div className="lg:col-span-4 space-y-4">
        <MaleAIAvatar
          status={avatarStatus}
          currentSpeechText={currentSpeakingText}
          isAudioMuted={isAudioMuted}
          onToggleMute={handleToggleMute}
          isListening={isListening}
          onToggleListen={toggleListening}
          personaName="വാസ്തുശിൽപി AI (VASTHUSILPY AI)"
          personaTitle="ചീഫ് AI ആർക്കിടെക്റ്റ് & കൺസൾട്ടന്റ്"
          activeDiscipline="തച്ചുശാസ്ത്രം • KPBR • സർവ്വേ • BOQ"
        />

        {/* Quick Discipline Switcher Cards */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-200 font-sans flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>വിദഗ്ദ്ധ AI വിഭാഗങ്ങൾ (Specialized Modules)</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {QUICK_PROMPTS.map((qp, idx) => {
              const Icon = qp.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (onSwitchDisciplineTab) {
                      onSwitchDisciplineTab(qp.tab);
                    } else {
                      handleSendMessage(qp.prompt);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border bg-slate-950/80 transition-all flex items-center justify-between text-xs cursor-pointer group ${qp.color}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate font-sans font-medium">{qp.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Unified Conversational Chat Console (8 cols on lg) */}
      <div className="lg:col-span-8 flex flex-col h-[750px] bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Chat Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-cyan-900/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-sans">
                  Live Support
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ONLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Multimodal Kerala Engineering Intelligence • Malayalam & English
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis?.cancel();
                setMessages([messages[0]]);
                setAvatarStatus("idle");
              }}
              title="സംഭാഷണം ക്ലിയർ ചെയ്യുക (Reset Chat)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] font-mono">Reset</span>
            </button>
          </div>
        </div>

        {/* Message Stream Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-950/40 via-slate-900/60 to-slate-950/80">
          {messages.map((m) => {
            const isAi = m.role === "model";
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-4xl ${isAi ? "justify-start" : "justify-end ml-auto"}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-white shrink-0 shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative rounded-2xl p-4 sm:p-5 text-sm leading-relaxed max-w-[85%] sm:max-w-[80%] ${
                    isAi
                      ? "bg-slate-900 border border-slate-800 text-slate-200 shadow-xl"
                      : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg font-sans"
                  }`}
                >
                  {/* Image attachment if user uploaded */}
                  {m.image && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-white/20 max-w-xs">
                      <img src={m.image} alt="User upload" className="w-full h-auto object-cover" />
                    </div>
                  )}

                  {/* Message Text with markdown line breaks */}
                  <div className="space-y-2 whitespace-pre-wrap font-sans">
                    {m.text}
                  </div>

                  {/* Citations / Authorities */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                      {m.citations.map((cite, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-cyan-400 font-mono"
                        >
                          📜 {cite}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Footer Bar */}
                  <div className="mt-2.5 flex items-center justify-between text-[10px] opacity-70 font-mono pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {m.timestamp}
                    </span>

                    <div className="flex items-center gap-2">
                      {isAi && (
                        <button
                          type="button"
                          onClick={() => speakText(m.text)}
                          title="ശബ്ദത്തിൽ കേൾക്കുക (Listen)"
                          className="hover:opacity-100 hover:text-cyan-400 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(m.text, m.id)}
                        title="കോപ്പി ചെയ്യുക (Copy)"
                        className="hover:opacity-100 cursor-pointer"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs font-mono animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0 animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>വാസ്തുശിൽപി AI മറുപടി വിശകലനം ചെയ്യുന്നു (Calculating)...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Selected Image Preview Bar */}
        {selectedImage && (
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage.preview}
                alt="Selected preview"
                className="w-12 h-12 object-cover rounded-lg border border-cyan-500/50"
              />
              <div>
                <p className="text-xs text-white font-medium">ബ്ലൂപ്രിന്റ് / ഫോട്ടോ അറ്റാച്ച് ചെയ്തു</p>
                <p className="text-[10px] text-slate-400 font-mono">Ready for AI Vision Inspection</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="text-xs text-rose-400 hover:text-rose-300 font-mono cursor-pointer"
            >
              Remove ✕
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleImageSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="ബ്ലൂപ്രിന്റ് / പ്ലാൻ ചിത്രം അറ്റാച്ച് ചെയ്യുക (Attach Plan / Image)"
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-800 transition-all cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "വോയ്‌സ് റെക്കോർഡിംഗ് നിർത്തുക" : "വോയ്‌സ് ഉപയോഗിച്ച് സംസാരിക്കുക (Voice Mic)"}
              className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 border ${
                isListening
                  ? "bg-emerald-600 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30 animate-pulse font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-800"
              }`}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              id="ai-agent-chat-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="ചോദ്യങ്ങൾ മലയാളത്തിലോ ഇംഗ്ലീഷിലോ ചോദിക്കുക (Ask Vastu, KPBR, FMB Survey or Estimate)..."
              disabled={isLoading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-inner disabled:opacity-50"
            />

            <button
              id="ai-agent-chat-send-btn"
              type="submit"
              disabled={isLoading || (!inputText.trim() && !selectedImage)}
              className="p-3 sm:px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">ചോദിക്കുക</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
