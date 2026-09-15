import { useState, useEffect, useRef, useCallback } from "react";

export type LanguagePref = "malayalam" | "english" | "both";

export interface VoiceEngineState {
  isListening: boolean;
  transcript: string;
  isSpeaking: boolean;
  isPaused: boolean;
  activeMessageId: string | null;
  currentSpokenText: string;
  rate: number;
  autoSpeak: boolean;
  speechRecognitionSupported: boolean;
  speechSynthesisSupported: boolean;
}

export function useAIVoiceEngine(initialLanguage: LanguagePref = "malayalam") {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [currentSpokenText, setCurrentSpokenText] = useState("");
  const [rate, setRate] = useState<number>(1.0);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [language, setLanguage] = useState<LanguagePref>(initialLanguage);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveTimerRef = useRef<any>(null);

  const speechRecognitionSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const speechSynthesisSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (speechSynthesisSupported) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
      }
    };
  }, [speechSynthesisSupported]);

  // Start Speech-to-Text
  const startListening = useCallback(
    (onResultCallback?: (text: string) => void) => {
      if (!speechRecognitionSupported) {
        alert("നിങ്ങളുടെ ബ്രൗസറിൽ മൈക്രോഫോൺ സ്പീച്ച് റെക്കഗ്നിഷൻ ലഭ്യമല്ല. ദയവായി Google Chrome അല്ലെങ്കിൽ Microsoft Edge ഉപയോഗിക്കുക.");
        return;
      }

      // If speech synthesis is active, stop it so mic doesn't catch AI voice
      if (speechSynthesisSupported && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
      }

      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = true;

        // Choose language based on user preference
        if (language === "english") {
          recognition.lang = "en-IN";
        } else {
          // Default to Malayalam (ml-IN) which also recognizes common English terms
          recognition.lang = "ml-IN";
        }

        recognition.onstart = () => {
          setIsListening(true);
          setTranscript("");
        };

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          if (onResultCallback) {
            onResultCallback(current);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("[VoiceEngine] Recognition error:", err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("[VoiceEngine] Start listening failed:", err);
        setIsListening(false);
      }
    },
    [speechRecognitionSupported, language, speechSynthesisSupported]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  // Text cleaning for speech synthesis
  const cleanMarkdownForSpeech = (text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/[*_#~]/g, "") // markdown markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
      .replace(/https?:\/\/\S+/g, "") // raw urls
      .replace(/[|\\/]/g, " ") // table separators
      .replace(/\s+/g, " ")
      .trim();
  };

  // Speak Text with Text-to-Speech
  const speak = useCallback(
    (text: string, messageId?: string) => {
      if (!speechSynthesisSupported) return;

      window.speechSynthesis.cancel();
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current);
      }

      const cleanText = cleanMarkdownForSpeech(text);
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Select voice
      const voices = window.speechSynthesis.getVoices();
      const malayalamVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("ml") ||
          v.name.toLowerCase().includes("malayalam")
      );
      const indianEnglishVoice = voices.find(
        (v) =>
          v.lang.toLowerCase().includes("en-in") ||
          v.name.toLowerCase().includes("india")
      );
      const standardEnglishVoice = voices.find((v) =>
        v.lang.toLowerCase().startsWith("en")
      );

      if (language === "malayalam" && malayalamVoice) {
        utterance.voice = malayalamVoice;
      } else if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
      } else if (malayalamVoice) {
        utterance.voice = malayalamVoice;
      } else if (standardEnglishVoice) {
        utterance.voice = standardEnglishVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveMessageId(messageId || null);
        setCurrentSpokenText(cleanText.slice(0, 160));
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
        setCurrentSpokenText("");
        if (keepAliveTimerRef.current) {
          clearInterval(keepAliveTimerRef.current);
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          console.warn("[VoiceEngine] TTS error:", e);
        }
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
        setCurrentSpokenText("");
        if (keepAliveTimerRef.current) {
          clearInterval(keepAliveTimerRef.current);
        }
      };

      // Chrome long-utterance keepalive workaround:
      // In Chromium, SpeechSynthesis pauses after ~14 seconds unless paused and resumed
      keepAliveTimerRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      window.speechSynthesis.speak(utterance);
    },
    [speechSynthesisSupported, language, rate]
  );

  // Pause speech
  const pause = useCallback(() => {
    if (!speechSynthesisSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [speechSynthesisSupported]);

  // Resume speech
  const resume = useCallback(() => {
    if (!speechSynthesisSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
    } else if (currentSpokenText) {
      // Re-trigger speak if needed
      speak(currentSpokenText, activeMessageId || undefined);
    }
  }, [speechSynthesisSupported, currentSpokenText, activeMessageId, speak]);

  // Stop speech
  const stop = useCallback(() => {
    if (!speechSynthesisSupported) return;
    window.speechSynthesis.cancel();
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveMessageId(null);
    setCurrentSpokenText("");
  }, [speechSynthesisSupported]);

  // Change speed rate
  const changeRate = useCallback((newRate: number) => {
    setRate(newRate);
  }, []);

  return {
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
  };
}
