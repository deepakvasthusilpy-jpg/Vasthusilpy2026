/**
 * Audio Speech Synthesis & Voice Playback Helper for Vasthusilpy Estimate AI
 * Provides natural text-to-speech audio output for Malayalam and English estimate summaries.
 */

export interface SpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onPause?: () => void;
  onResume?: () => void;
  rate?: number;
  pitch?: number;
  lang?: string;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/**
 * Clean text for natural speech (strips markdown formatting, symbols, and formatting noise)
 */
export function cleanTextForSpeech(raw: string): string {
  if (!raw) return "";

  let cleaned = raw
    // Remove markdown headers and bold/italic markers
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Replace markdown bullets
    .replace(/^[\s]*[-*+]\s+/gm, ". ")
    // Clean currency symbols for phonetic reading
    .replace(/₹\s*([0-9,]+(\.[0-9]+)?)/g, "Rupees $1")
    .replace(/INR\s*/gi, "Rupees ")
    // Convert m² / sq.ft / cum to words
    .replace(/sq\.?ft\.?/gi, "square feet")
    .replace(/sq\.?m\.?/gi, "square meters")
    .replace(/cum/gi, "cubic meters")
    .replace(/nos/gi, "numbers")
    .replace(/PCC/gi, "P C C")
    .replace(/RCC/gi, "R C C")
    .replace(/DPC/gi, "D P C")
    .replace(/KPBR/gi, "K P B R")
    // Remove emojis and special decorative characters
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}]/gu, "")
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, "")
    // Remove JSON or code brackets
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove multiple newlines and spaces
    .replace(/[\r\n]+/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned;
}

/**
 * Find the best matching voice for Malayalam or Indian English
 */
function getBestVoice(lang?: string): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Try Malayalam voice if requested or available
  if (lang === "ml" || lang === "ml-IN") {
    const mlVoice = voices.find((v) => v.lang.startsWith("ml") || v.name.toLowerCase().includes("malayalam"));
    if (mlVoice) return mlVoice;
  }

  // 2. Try Indian English voice
  const inEnglishVoice = voices.find(
    (v) =>
      v.lang === "en-IN" ||
      v.name.toLowerCase().includes("india") ||
      v.name.toLowerCase().includes("neerja") ||
      v.name.toLowerCase().includes("prabhat")
  );
  if (inEnglishVoice) return inEnglishVoice;

  // 3. Try natural / Google / Edge / Apple neural voices
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Siri"))
  );
  if (naturalVoice) return naturalVoice;

  // 4. Default to first English voice or any available voice
  return voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

/**
 * Speak the provided text using SpeechSynthesis
 */
export function speakText(text: string, options?: SpeechOptions): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    if (options?.onError) {
      options.onError(new Error("Speech synthesis is not supported in this environment."));
    }
    return null;
  }

  stopSpeech();

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) {
    if (options?.onEnd) options.onEnd();
    return null;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleaned);
    activeUtterance = utterance;

    const voice = getBestVoice(options?.lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = options?.rate ?? 0.95; // slightly relaxed for technical clarity
    utterance.pitch = options?.pitch ?? 1.0;

    utterance.onstart = () => {
      if (options?.onStart) options.onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (options?.onEnd) options.onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      if (options?.onError) options.onError(e);
    };

    utterance.onpause = () => {
      if (options?.onPause) options.onPause();
    };

    utterance.onresume = () => {
      if (options?.onResume) options.onResume();
    };

    // Ensure voices are loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const delayedVoice = getBestVoice(options?.lang);
        if (delayedVoice) utterance.voice = delayedVoice;
        window.speechSynthesis.speak(utterance);
      };
    } else {
      window.speechSynthesis.speak(utterance);
    }

    return utterance;
  } catch (err) {
    console.warn("Speech synthesis error:", err);
    if (options?.onError) options.onError(err);
    return null;
  }
}

export function stopSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch {}
  }
}

export function pauseSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.pause();
    } catch {}
  }
}

export function resumeSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.resume();
    } catch {}
  }
}

export function isSpeaking(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
}

export function isPaused(): boolean {
  return isSpeechSynthesisSupported() && window.speechSynthesis.paused;
}
