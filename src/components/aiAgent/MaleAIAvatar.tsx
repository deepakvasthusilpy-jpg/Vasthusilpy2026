import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Award,
  ShieldCheck,
  Compass,
  Cpu,
  RefreshCw,
  Radio,
  Eye,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Sliders,
  Play,
  Square,
  Upload,
  Settings2,
  X,
  MessageSquare
} from "lucide-react";

interface MaleAIAvatarProps {
  status: "idle" | "thinking" | "speaking" | "listening";
  currentSpeechText?: string;
  isAudioMuted?: boolean;
  onToggleMute?: () => void;
  isListening?: boolean;
  onToggleListen?: () => void;
  personaName?: string;
  personaTitle?: string;
  activeDiscipline?: string;
  onSpeakSample?: (text: string) => void;
}

// Default attached photo of Chief AI Engineer (Mohanlal portrait in black shirt with collar)
const DEFAULT_AVATAR_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80"; // Fallback URL placeholder if needed

// Presets for quick selection
const AVATAR_PRESETS = [
  {
    id: "attached_portrait",
    name: "ചീഫ് AI ഒഫീഷ്യൽ (Black Shirt Portrait)",
    desc: "ഔദ്യോഗിക ബ്ലാക്ക് ഷർട്ട് ലുക്ക്",
    url: "attached_default"
  },
  {
    id: "studio_formal",
    name: "എക്സിക്യൂട്ടീവ് ആർക്കിടെക്റ്റ് (Formal)",
    desc: "സ്റ്റുഡിയോ എക്സിക്യൂട്ടീവ് സ്റ്റൈൽ",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "heritage_vastu",
    name: "തച്ചുശാസ്ത്ര ആചാര്യൻ (Traditional)",
    desc: "പരമ്പരാഗത വാസ്തു വിദഗ്ദ്ധൻ",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80"
  }
];

export const MaleAIAvatar: React.FC<MaleAIAvatarProps> = ({
  status = "idle",
  currentSpeechText = "",
  isAudioMuted = false,
  onToggleMute,
  isListening = false,
  onToggleListen,
  personaName = "വാസ്തുശിൽപി ചീഫ് AI (VASTHUSILPY AI)",
  personaTitle = "ചീഫ് AI ആർക്കിടെക്റ്റ് & കൺസൾട്ടന്റ്",
  activeDiscipline = "തച്ചു ശാസ്ത്രം & KPBR 2019/2026",
  onSpeakSample
}) => {
  const [waveHeights, setWaveHeights] = useState<number[]>([4, 8, 12, 16, 12, 8, 4, 10, 6]);
  const [avatarImage, setAvatarImage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("vasthusilpy_chief_avatar_photo");
      return saved || "attached_default";
    } catch {
      return "attached_default";
    }
  });

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [speechPitch, setSpeechPitch] = useState<number>(0.95);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available Malayalam/Indian voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const mlVoice = voices.find((v) => v.lang.includes("ml") || v.lang.includes("Malayalam") || v.name.toLowerCase().includes("malayalam"));
        const inVoice = voices.find((v) => v.lang.includes("en-IN") || v.name.includes("India"));
        if (mlVoice) {
          setSelectedVoiceName(mlVoice.name);
        } else if (inVoice) {
          setSelectedVoiceName(inVoice.name);
        } else if (voices.length > 0) {
          setSelectedVoiceName(voices[0].name);
        }
      };

      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Speaking animation waveform simulation
  useEffect(() => {
    if (status === "speaking" || isSpeakingLocal) {
      const interval = setInterval(() => {
        setWaveHeights(
          Array.from({ length: 11 }, () => Math.floor(Math.random() * 26) + 4)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setWaveHeights([4, 6, 8, 12, 8, 6, 4, 8, 5]);
    }
  }, [status, isSpeakingLocal]);

  // Handle custom photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("ദയവായി ഒരു ചിത്രം (Image file) തിരഞ്ഞെടുക്കുക.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatarImage(base64);
      try {
        localStorage.setItem("vasthusilpy_chief_avatar_photo", base64);
      } catch (err) {
        console.warn("Could not save to localStorage", err);
      }
      setIsPhotoModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  // Select Preset Photo
  const handleSelectPreset = (url: string) => {
    setAvatarImage(url);
    try {
      if (url === "attached_default") {
        localStorage.removeItem("vasthusilpy_chief_avatar_photo");
      } else {
        localStorage.setItem("vasthusilpy_chief_avatar_photo", url);
      }
    } catch (e) {
      console.warn(e);
    }
    setIsPhotoModalOpen(false);
  };

  // Play Malayalam greeting sample
  const handlePlayMalayalamGreeting = (textToSpeak?: string) => {
    const sampleText =
      textToSpeak ||
      "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ചീഫ് AI എഞ്ചിനീയർ ആണ്. വാസ്തു ശാസ്ത്രം, KPBR 2019/2026 കെട്ടിട ചട്ടങ്ങൾ, FMB സർവ്വേ, റേറ്റ് എസ്റ്റിമേറ്റ് എന്നിവയിൽ നിങ്ങൾക്ക് ആവശ്യമായ എല്ലാ ഉപദേശങ്ങളും എന്നോട് ചോദിക്കാം.";

    if (onSpeakSample) {
      onSpeakSample(sampleText);
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("സ്പീച്ച് സിന്തസിസ് ലഭ്യമല്ല.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    const voice = availableVoices.find((v) => v.name === selectedVoiceName);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeakingLocal(true);
    utterance.onend = () => setIsSpeakingLocal(false);
    utterance.onerror = () => setIsSpeakingLocal(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingLocal(false);
    }
  };

  const isActuallySpeaking = status === "speaking" || isSpeakingLocal;

  const getStatusBadge = () => {
    if (isActuallySpeaking) {
      return {
        text: "മലയാളത്തിൽ സംസാരിക്കുന്നു (Speaking Malayalam...)",
        color: "bg-purple-500/20 text-purple-200 border-purple-400/50 shadow-purple-900/50",
        dot: "bg-pink-400 animate-bounce"
      };
    }
    switch (status) {
      case "listening":
        return {
          text: "ശ്രദ്ധയോടെ കേൾക്കുന്നു (Listening...)",
          color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          dot: "bg-emerald-400 animate-ping"
        };
      case "thinking":
        return {
          text: "നിയമങ്ങൾ വിശകലനം ചെയ്യുന്നു (Analyzing...)",
          color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          dot: "bg-amber-400 animate-pulse"
        };
      default:
        return {
          text: "തയ്യാറാണ് (Chief AI Online & Ready)",
          color: "bg-white/10 text-purple-200 border-white/20",
          dot: "bg-emerald-400"
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div
      id="male-ai-avatar-container"
      className="relative flex flex-col items-center glass-card border border-white/20 rounded-3xl p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.45)] overflow-hidden group backdrop-blur-2xl"
    >
      {/* Ambient Neural Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className={`absolute -top-16 -left-16 w-64 h-64 rounded-full blur-3xl transition-all duration-700 ${
            isActuallySpeaking
              ? "bg-purple-600/35 opacity-100 scale-110"
              : status === "listening"
              ? "bg-emerald-500/30 opacity-100 scale-105"
              : status === "thinking"
              ? "bg-amber-500/30 opacity-100"
              : "bg-indigo-600/20 opacity-80"
          }`}
        />
        <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-pink-600/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-blueprint-grid opacity-20" />
      </div>

      {/* Top Header Row with Status & Quick Controls */}
      <div className="w-full flex items-center justify-between z-10 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-200">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
              <span>ചീഫ് AI എൻജിനീയർ</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-pink-500/30 border border-amber-400/50 text-amber-200 font-mono font-bold">
                CHIEF PRO
              </span>
            </div>
            <p className="text-[9.5px] text-purple-200/70 font-mono">{activeDiscipline}</p>
          </div>
        </div>

        {/* Audio, Voice Settings & Mic Quick Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Voice Settings Modal Button */}
          <button
            type="button"
            onClick={() => setIsVoiceSettingsOpen(true)}
            title="മലയാളം വോയ്‌സ് ക്രമീകരണങ്ങൾ (Voice Settings)"
            className="p-2 rounded-xl text-xs bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Change Photo Button */}
          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            title="ഫോട്ടോ മാറ്റുക (Change Profile Photo)"
            className="p-2 rounded-xl text-xs bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {onToggleMute && (
            <button
              id="avatar-mute-btn"
              type="button"
              onClick={onToggleMute}
              title={isAudioMuted ? "ശബ്ദം ഓണാക്കുക (Unmute Voice)" : "ശബ്ദം ഓഫ് ചെയ്യുക (Mute Voice)"}
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer border backdrop-blur-md ${
                isAudioMuted
                  ? "bg-white/5 text-purple-200/50 border-white/10 hover:text-white"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-white/30 shadow-lg shadow-purple-950/50"
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          )}

          {onToggleListen && (
            <button
              id="avatar-mic-btn"
              type="button"
              onClick={onToggleListen}
              title={isListening ? "മൈക്ക് നിർത്തുക (Stop Mic)" : "സംസാരിക്കാൻ മൈക്ക് ഓൺ ചെയ്യുക (Speak to AI)"}
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer border backdrop-blur-md ${
                isListening
                  ? "bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/30 animate-pulse font-bold"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-purple-200/70" />}
            </button>
          )}
        </div>
      </div>

      {/* Realistic Chief AI Profile Photo Centerpiece with Speech Animation */}
      <div className="relative z-10 my-2 flex flex-col items-center">
        {/* Holographic Glowing Orbit Ring */}
        <div
          className={`absolute -inset-3 rounded-full border border-dashed transition-all duration-700 pointer-events-none ${
            isActuallySpeaking
              ? "border-pink-400/80 animate-spin"
              : status === "listening"
              ? "border-emerald-400/80 animate-pulse"
              : status === "thinking"
              ? "border-amber-400/70 animate-spin"
              : "border-white/20"
          }`}
          style={{ animationDuration: isActuallySpeaking ? "8s" : "20s" }}
        />

        {/* Outer Pulsing Glow Aura */}
        <div
          className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 transition-all duration-500 relative ${
            isActuallySpeaking
              ? "bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 shadow-[0_0_45px_rgba(236,72,153,0.55)] scale-105"
              : status === "listening"
              ? "bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_40px_rgba(52,211,153,0.5)] scale-105"
              : status === "thinking"
              ? "bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 shadow-[0_0_35px_rgba(251,191,36,0.45)]"
              : "bg-gradient-to-tr from-purple-800/60 via-pink-700/50 to-indigo-900/60 shadow-2xl border border-white/20"
          }`}
        >
          {/* Avatar Photo Frame Container */}
          <div className="w-full h-full rounded-full bg-[#0e021a] overflow-hidden relative border-2 border-white/40 flex items-center justify-center shadow-inner">
            {/* Render Default Attached Portrait (Mohanlal portrait in black shirt with collar) OR Custom Uploaded Photo */}
            {avatarImage === "attached_default" ? (
              <div className="w-full h-full relative overflow-hidden bg-gradient-to-b from-[#1a0826] to-[#0a0212]">
                {/* Embedded High-Craft Portrait of Mohanlal (Black Shirt with Collar, Styled Hair & Mustache) */}
                <svg
                  viewBox="0 0 200 200"
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    isActuallySpeaking ? "scale-105" : "hover:scale-105"
                  }`}
                >
                  <defs>
                    <linearGradient id="bgSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4a7c9f" />
                      <stop offset="40%" stopColor="#5d8fae" />
                      <stop offset="100%" stopColor="#87adc6" />
                    </linearGradient>
                    <linearGradient id="skinGradLal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#e8b18d" />
                      <stop offset="40%" stopColor="#d99970" />
                      <stop offset="100%" stopColor="#b67147" />
                    </linearGradient>
                    <linearGradient id="hairGradLal" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2c1a12" />
                      <stop offset="50%" stopColor="#180e0a" />
                      <stop offset="100%" stopColor="#090504" />
                    </linearGradient>
                    <linearGradient id="blackShirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e1e24" />
                      <stop offset="50%" stopColor="#121216" />
                      <stop offset="100%" stopColor="#08080a" />
                    </linearGradient>
                    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
                    </filter>
                  </defs>

                  {/* Soft Blue Studio Backdrop matching attached photo */}
                  <rect width="200" height="200" fill="url(#bgSkyGrad)" />
                  <circle cx="100" cy="70" r="80" fill="#7faecc" opacity="0.35" />

                  {/* Black Shirt Body & Shoulders */}
                  <path
                    d="M 10,200 L 10,162 C 10,135 40,122 72,118 L 100,135 L 128,118 C 160,122 190,135 190,162 L 190,200 Z"
                    fill="url(#blackShirtGrad)"
                  />
                  {/* Shirt Fold Texture & Collar Shadow */}
                  <path d="M 100,135 L 100,200" stroke="#000" strokeWidth="2.5" opacity="0.6" />
                  <circle cx="100" cy="155" r="2.5" fill="#333" />
                  <circle cx="100" cy="175" r="2.5" fill="#333" />

                  {/* Black Shirt Crisp Collar Wings */}
                  <polygon points="72,118 95,142 82,148 58,126" fill="#18181c" stroke="#2a2a32" strokeWidth="1" />
                  <polygon points="128,118 105,142 118,148 142,126" fill="#18181c" stroke="#2a2a32" strokeWidth="1" />
                  <polygon points="85,120 100,138 115,120" fill="#0c0c0e" />

                  {/* Neck with Warm Shadow */}
                  <rect x="84" y="94" width="32" height="30" rx="6" fill="url(#skinGradLal)" />
                  <path d="M 84,102 C 90,112 110,112 116,102 L 116,94 L 84,94 Z" fill="#9e572f" opacity="0.45" />

                  {/* Mohanlal's Iconic Head Shape & Gentle Jawline */}
                  <path
                    d="M 60,65 C 60,36 76,28 100,28 C 124,28 140,36 140,65 C 140,94 128,112 100,112 C 72,112 60,94 60,65 Z"
                    fill="url(#skinGradLal)"
                  />

                  {/* Ears */}
                  <ellipse cx="58" cy="70" rx="6" ry="12" fill="url(#skinGradLal)" />
                  <ellipse cx="142" cy="70" rx="6" ry="12" fill="url(#skinGradLal)" />

                  {/* Signature Styled Thick Dark Hair & Side Parting */}
                  <path
                    d="M 58,60 C 58,30 74,16 100,16 C 126,16 142,28 142,60 C 142,46 135,26 120,22 C 105,18 84,20 72,32 C 65,38 60,48 58,60 Z"
                    fill="url(#hairGradLal)"
                  />
                  <path d="M 58,45 C 62,32 82,20 110,20 C 132,20 142,28 142,42 C 134,30 118,25 98,26 C 78,27 66,35 58,45 Z" fill="#3a2216" opacity="0.6" />

                  {/* Gentle Expressive Eyebrows */}
                  <path d="M 72,56 Q 84,52 92,57" stroke="#180e0a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  <path d="M 108,57 Q 116,52 128,56" stroke="#180e0a" strokeWidth="3.5" strokeLinecap="round" fill="none" />

                  {/* Warm, Iconic Eyes */}
                  {/* Left Eye */}
                  <ellipse cx="82" cy="65" rx="6.5" ry="4.5" fill="#ffffff" />
                  <circle cx="82" cy="65" r="3.2" fill="#2d1a10" />
                  <circle cx="83" cy="64" r="1" fill="#ffffff" />
                  {/* Right Eye */}
                  <ellipse cx="118" cy="65" rx="6.5" ry="4.5" fill="#ffffff" />
                  <circle cx="118" cy="65" r="3.2" fill="#2d1a10" />
                  <circle cx="119" cy="64" r="1" fill="#ffffff" />

                  {/* Character Lines / Gentle Smile Under Eyes */}
                  <path d="M 76,71 Q 82,74 88,71" stroke="#a35f37" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path d="M 112,71 Q 118,74 124,71" stroke="#a35f37" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />

                  {/* Nose with Distinct Character */}
                  <path d="M 100,60 L 96,78 L 104,78" stroke="#94532d" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                  <circle cx="95" cy="78" r="1.5" fill="#80411d" opacity="0.6" />
                  <circle cx="105" cy="78" r="1.5" fill="#80411d" opacity="0.6" />

                  {/* Mohanlal's Iconic Groomed Thick Mustache */}
                  <path
                    d="M 78,84 C 88,80 96,87 100,87 C 104,87 112,80 122,84 C 118,91 108,93 100,92 C 92,93 82,91 78,84 Z"
                    fill="#150d09"
                    filter="url(#softShadow)"
                  />
                  <path d="M 80,85 C 88,82 96,88 100,88 C 104,88 112,82 120,85" stroke="#2d1c14" strokeWidth="1.2" fill="none" />

                  {/* Animated Speaking Lips / Warm Smile */}
                  {isActuallySpeaking ? (
                    <ellipse cx="100" cy="94" rx="6.5" ry="4" fill="#3b0808" stroke="#7a1f1f" strokeWidth="1.2" />
                  ) : (
                    <path d="M 92,93 Q 100,97 108,93" stroke="#8a3030" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  )}

                  {/* Neatly Groomed Beard Shadow */}
                  <path
                    d="M 84,98 C 90,108 110,108 116,98 C 114,110 86,110 84,98 Z"
                    fill="#150d09"
                    opacity="0.7"
                  />
                </svg>
              </div>
            ) : (
              <img
                src={avatarImage}
                alt="Chief AI Engineer Portrait"
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isActuallySpeaking ? "scale-105" : "group-hover:scale-105"
                }`}
                referrerPolicy="no-referrer"
              />
            )}

            {/* Speaking Live Equalizer Waveform Overlay at base */}
            {isActuallySpeaking && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-0.5 px-2 bg-purple-950/90 backdrop-blur-md py-1 border-t border-pink-500/40 z-20">
                {waveHeights.map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-gradient-to-t from-pink-500 to-amber-300 rounded-full transition-all duration-100 shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                    style={{ height: `${Math.min(h, 24)}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Identity Plate under avatar */}
        <div className="mt-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <h3 className="text-sm font-black text-white font-sans tracking-wide">
              {personaName}
            </h3>
            <CheckCircle2 className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <p className="text-[11px] text-purple-200/90 font-mono mt-0.5 font-semibold">
            {personaTitle}
          </p>
        </div>
      </div>

      {/* Dynamic Status Capsule Pill */}
      <div
        className={`mt-2 flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono border backdrop-blur-md transition-all duration-300 ${badge.color}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
        <span className="font-semibold text-[11px]">{badge.text}</span>
      </div>

      {/* Live Speaking Teaser Caption with stop control */}
      {isActuallySpeaking && (currentSpeechText || isSpeakingLocal) && (
        <div className="mt-3 w-full glass-card border border-pink-500/40 rounded-2xl p-3 text-xs text-white font-sans shadow-2xl max-h-24 overflow-y-auto backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-[10px] text-pink-300 font-mono font-bold mb-1">
            <div className="flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-pink-400" />
              <span>ലൈവ് മലയാളം വോയ്‌സ് വിശദീകരണം:</span>
            </div>
            <button
              onClick={handleStopSpeech}
              className="px-2 py-0.5 bg-rose-500/30 hover:bg-rose-500 text-rose-200 hover:text-white rounded-full text-[9px] font-mono font-bold transition cursor-pointer border border-rose-400/40"
              title="നിർത്തുക (Stop Voice)"
            >
              STOP
            </button>
          </div>
          <p className="text-purple-100 leading-relaxed font-medium">
            "{currentSpeechText || "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ചീഫ് AI എഞ്ചിനീയർ ആണ്..."}"
          </p>
        </div>
      )}

      {/* Malayalam Quick Audio Actions Bar */}
      <div className="w-full mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => handlePlayMalayalamGreeting()}
          className="flex-1 py-2 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-purple-950/50 cursor-pointer border border-white/20 active:scale-95"
          title="ചീഫ് AI മലയാളം വോയ്‌സ് സാമ്പിൾ കേൾക്കുക"
        >
          {isActuallySpeaking ? (
            <>
              <Square className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>ശബ്ദം കേൾക്കുന്നു...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>മലയാളം വോയ്‌സ് കേൾക്കുക</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsVoiceSettingsOpen(true)}
          className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-purple-200 hover:text-white transition cursor-pointer"
          title="വോയ്‌സ് സെറ്റിംഗ്സ്"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Consultation Topics in Malayalam */}
      <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
        <button
          type="button"
          onClick={() => handlePlayMalayalamGreeting("വാസ്തു ശാസ്ത്ര പ്രകാരം കന്നിമൂലയിൽ മാസ്റ്റർ ബെഡ്‌റൂമും, വടക്കുകിഴക്ക് ഈശാനകോണിൽ പൂജാമുറിയും, തെക്കുകിഴക്ക് അഗ്നികോണിൽ അടുക്കളയും പണിയുന്നത് ഉത്തമമാണ്.")}
          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-purple-200 hover:text-white transition text-left flex items-center gap-1.5 cursor-pointer truncate"
        >
          <Compass className="w-3 h-3 text-amber-300 shrink-0" />
          <span className="truncate">വാസ്തു തത്വങ്ങൾ</span>
        </button>

        <button
          type="button"
          onClick={() => handlePlayMalayalamGreeting("കേരള പഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടം 2019 അനുസരിച്ച് 300 ചതുരശ്ര മീറ്റർ വരെയുള്ള വീടുകൾക്ക് റോഡിൽ നിന്ന് 3 മീറ്റർ ഫ്രണ്ട് സെറ്റ്ബാക്ക് ആവശ്യമാണ്.")}
          className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-purple-200 hover:text-white transition text-left flex items-center gap-1.5 cursor-pointer truncate"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-300 shrink-0" />
          <span className="truncate">KPBR ചട്ടങ്ങൾ</span>
        </button>
      </div>

      {/* Domain Expertise Badges */}
      <div className="w-full grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-white/15 text-[10px] font-mono text-purple-200/80 text-center">
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-amber-300 font-bold">തച്ചു ശാസ്ത്രം</div>
          <div className="text-[8px] text-purple-200/60">MANUSHYALAYA</div>
        </div>
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-emerald-300 font-bold">KPBR 2019/26</div>
          <div className="text-[8px] text-purple-200/60">BUILDING RULES</div>
        </div>
        <div className="p-1.5 rounded-xl bg-white/5 border border-white/10">
          <div className="text-pink-300 font-bold">BOQ & സർവ്വേ</div>
          <div className="text-[8px] text-purple-200/60">PWD DSR & FMB</div>
        </div>
      </div>

      {/* -------------------- PHOTO SELECTION & UPLOAD MODAL -------------------- */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card border border-white/25 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-sm">ചീഫ് AI പ്രൊഫൈൽ ഫോട്ടോ</h3>
              </div>
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-purple-200/80 leading-relaxed">
              ചീഫ് AI എൻജിനീയറുടെ പ്രൊഫൈൽ ഫോട്ടോ മാറ്റുകയോ സ്വന്തം ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുകയോ ചെയ്യാം:
            </p>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono font-bold text-purple-200 uppercase tracking-wider block">
                സ്റ്റൈൽ പ്രീസെറ്റുകൾ (Presets)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p.url)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition cursor-pointer text-left ${
                      avatarImage === p.url
                        ? "bg-purple-600/30 border-pink-400 text-white font-bold"
                        : "bg-white/5 hover:bg-white/10 border-white/15 text-purple-200"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{p.name}</div>
                      <div className="text-[10px] text-purple-200/70 font-mono">{p.desc}</div>
                    </div>
                    {avatarImage === p.url && (
                      <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Photo Upload */}
            <div className="pt-2 border-t border-white/15">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-mono font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-pink-300" />
                <span>ഡിവൈസിൽ നിന്ന് പുതിയ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPhotoModalOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-mono font-bold cursor-pointer"
              >
                പൂർത്തിയായി (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- VOICE SETTINGS MODAL -------------------- */}
      {isVoiceSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-card border border-white/25 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-2xl text-white">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">മലയാളം വോയ്‌സ് ക്രമീകരണങ്ങൾ</h3>
              </div>
              <button
                onClick={() => setIsVoiceSettingsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-purple-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voice Engine Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-200 font-bold">
                വോയ്‌സ് എഞ്ചിൻ (Voice Selection)
              </label>
              <select
                value={selectedVoiceName}
                onChange={(e) => setSelectedVoiceName(e.target.value)}
                className="w-full bg-[#150522] border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-pink-400"
              >
                {availableVoices.length === 0 ? (
                  <option value="">Default Malayalam / Indian Voice</option>
                ) : (
                  availableVoices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Pitch slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-purple-200">
                <span>ശബ്ദ ഗാംഭീര്യം (Pitch / Male Tone)</span>
                <span>{speechPitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.4"
                step="0.05"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Speed slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-purple-200">
                <span>സംസാര വേഗത (Speech Speed)</span>
                <span>{speechRate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Test Voice Button */}
            <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-3">
              <button
                onClick={() => handlePlayMalayalamGreeting()}
                className="flex-1 py-2 px-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>ടെസ്റ്റ് ചെയ്യുക (Test Voice)</span>
              </button>

              <button
                onClick={() => setIsVoiceSettingsOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-mono font-bold cursor-pointer"
              >
                സേവ് (Save)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

