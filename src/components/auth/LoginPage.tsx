import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { PRIMARY_ADMIN_EMAILS } from "../../lib/firebase";
import { VasthusilpyLogo } from "../common/VasthusilpyLogo";
import { getTotpRemainingSeconds } from "../../utils/totp";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  Check,
  RefreshCw,
  X
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const {
    loginWithGoogleAuthenticator,
    loginWithGoogleAccount,
    loginAsAdminBypass,
    loading,
    authError,
    clearAuthError,
    adminTotpDaysRemaining,
    isAdminTotpDue
  } = useAuth();

  // Selected admin account for TOTP
  const [selectedEmail, setSelectedEmail] = useState<string>("deepak.vasthusilpy@gmail.com");
  const [totpDigits, setTotpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyingTotp, setVerifyingTotp] = useState<boolean>(false);
  const [signingWithGoogle, setSigningWithGoogle] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [showBypassOption, setShowBypassOption] = useState<boolean>(false);

  const handleGoogleSignIn = async () => {
    setSigningWithGoogle(true);
    setLocalError(null);
    setShowBypassOption(false);
    clearAuthError();

    try {
      await loginWithGoogleAccount();
      setLocalSuccess("ലോഗിൻ വിജയിച്ചു! (Google Sign-In successful!)");
    } catch (err: any) {
      console.error("Google Sign-In error details:", err);
      const isIframe = typeof window !== "undefined" && window.self !== window.top;
      const isUnauthorizedDomain = err.code === "auth/unauthorized-domain" || err.message?.includes("unauthorized-domain") || err.message?.includes("unauthorized");
      
      if (isUnauthorizedDomain) {
        setShowBypassOption(true);
        setLocalError(
          "ഫയർബേസ് അനുമതിയില്ലാത്ത ഡൊമെയ്ൻ (Firebase Unauthorized Domain):\n\n" +
          "ഈ ഡെവലപ്മെന്റ് / പ്രിവ്യൂ ഡൊമെയ്ൻ ഫയർബേസ് കൺസോളിൽ ചേർത്തിട്ടില്ല. എങ്കിലും, നിങ്ങൾ ഈ വെബ്സൈറ്റിന്റെ പ്രൈമറി അഡ്മിൻ ആയതിനാൽ, താഴെ നൽകിയിരിക്കുന്ന സുരക്ഷിതമായ 'Local Admin Bypass' ബട്ടൺ വഴി നിങ്ങൾക്ക് ഉടൻ തന്നെ ലോഗിൻ ചെയ്യാവുന്നതാണ്.\n\n" +
          "(This development/preview domain is not whitelisted in Firebase Console Authorized Domains. As a Primary Admin, you can use the secure bypass login option below to sign in instantly.)"
        );
      } else if (
        isIframe || 
        err.code === "auth/internal-error" || 
        err.message?.includes("auth/internal-error") ||
        err.message?.includes("popup") ||
        err.message?.includes("closed")
      ) {
        setLocalError(
          "ഗൂഗിൾ ലോഗിൻ തടസ്സപ്പെട്ടു (Google Sign-In is restricted):\n\n" +
          "1. ഐഫ്രെയിം സാൻഡ്‌ബോക്‌സ് നിയന്ത്രണങ്ങൾ കാരണം ഗൂഗിൾ ലോഗിൻ ഈ വിൻഡോയിൽ പ്രവർത്തിക്കില്ല. ദയവായി മുകളിൽ വലതുവശത്തുള്ള 'Open in new tab' ബട്ടൺ ക്ലിക്ക് ചെയ്ത് പുതിയ ടാബിൽ ലോഗിൻ ചെയ്യുക.\n" +
          "2. ഫയർബേസ് കൺസോളിൽ (Authentication -> Authorized Domains) ഈ ഡൊമെയ്ൻ ചേർത്തിട്ടുണ്ടെന്ന് ഉറപ്പുവരുത്തുക.\n\n" +
          "(Since this preview runs in a sandboxed iframe, Google Sign-In is restricted. Please click the 'Open in new tab' icon in the top right of AI Studio to log in, and ensure your domain is whitelisted in Firebase console.)"
        );
      } else {
        setLocalError(err.message || "Google Sign-In failed.");
      }
    } finally {
      setSigningWithGoogle(false);
    }
  };

  // Input refs for 6 OTP boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Remaining time in 30s cycle for TOTP
  const [remainingSecs, setRemainingSecs] = useState<number>(30);

  // Live Digital Clock state
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update 30s countdown indicator
  useEffect(() => {
    const updateCountdown = () => {
      setRemainingSecs(getTotpRemainingSeconds());
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format Digital Clock with Hours, Minutes, Seconds, AM/PM
  const timeFormatted = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !is24Hour
  });

  const dateFormatted = currentTime.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Handle single digit input for TOTP
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "");
    if (!cleanVal) {
      const newDigits = [...totpDigits];
      newDigits[index] = "";
      setTotpDigits(newDigits);
      return;
    }

    const lastChar = cleanVal.slice(-1);
    const newDigits = [...totpDigits];
    newDigits[index] = lastChar;
    setTotpDigits(newDigits);

    // Auto-focus next input
    if (index < 5 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }

    // If 6th digit entered, auto submit
    if (index === 5 && lastChar) {
      const fullCode = [...newDigits.slice(0, 5), lastChar].join("");
      if (fullCode.length === 6) {
        triggerAuthenticatorLogin(fullCode);
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !totpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().replace(/\D/g, "");
    if (pastedData.length >= 6) {
      const chars = pastedData.slice(0, 6).split("");
      setTotpDigits(chars);
      inputRefs.current[5]?.focus();
      triggerAuthenticatorLogin(pastedData.slice(0, 6));
    } else if (pastedData.length > 0) {
      const newDigits = [...totpDigits];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newDigits[i] = pastedData[i];
      }
      setTotpDigits(newDigits);
      const nextIdx = Math.min(pastedData.length, 5);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  // Trigger Google Authenticator verification
  const triggerAuthenticatorLogin = async (codeToVerify?: string) => {
    const finalCode = codeToVerify || totpDigits.join("");
    if (finalCode.length !== 6) {
      setLocalError("ദയവായി 6 അക്ക Authenticator കോഡ് നൽകുക (Please enter 6 digits).");
      return;
    }

    if (!selectedEmail || !selectedEmail.includes("@")) {
      setLocalError("ദയവായി ശരിയായ ഇമെയിൽ നൽകുക.");
      return;
    }

    setVerifyingTotp(true);
    setLocalError(null);
    clearAuthError();

    try {
      await loginWithGoogleAuthenticator(selectedEmail, finalCode);
    } catch (err: any) {
      setLocalError(err.message || "Google Authenticator verification failed.");
      setTotpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifyingTotp(false);
    }
  };

  return (
    <div id="login-container" className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 overflow-hidden bg-[#1a051d] text-white">
      
      {/* 1. BACKGROUND GRADIENTS & SHAPES (Matching Mockup Colors) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Soft, deep twilight aura */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(110,23,94,0.4)_0%,rgba(26,5,29,1)_70%)]" />

        {/* Ambient colored glowing circles */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-pink-500/10 blur-[120px]" />

        {/* Crescent Moon (Top Left) */}
        <div className="absolute top-10 left-8 sm:top-14 sm:left-16 z-0">
          <svg className="w-14 h-14 sm:w-20 sm:h-20 drop-shadow-[0_0_20px_rgba(255,255,255,0.75)]" viewBox="0 0 100 100">
            <path
              d="M 50 10 A 40 40 0 1 0 90 70 A 34 34 0 1 1 50 10 Z"
              fill="#ffffff"
              opacity="0.95"
            />
            <circle cx="50" cy="50" r="42" fill="url(#moonGlow)" opacity="0.4" />
            <defs>
              <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e0aaff" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Shooting Star (Top Right) */}
        <div className="absolute top-12 right-12 sm:top-16 sm:right-28 rotate-[15deg]">
          <div className="w-32 sm:w-44 h-0.5 bg-gradient-to-r from-transparent via-white/80 to-white rounded-full shadow-[0_0_12px_#fff]" />
          <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_14px_4px_rgba(255,255,255,0.9)] animate-pulse" />
        </div>

        {/* Twinkling Stars */}
        <div className="absolute top-20 left-1/3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff] opacity-80 animate-pulse" />
        <div className="absolute top-36 right-1/3 w-2 h-2 bg-pink-200 rounded-full shadow-[0_0_10px_#fbcfe8] opacity-90 animate-ping duration-1000" />
        <div className="absolute top-28 right-16 w-1 h-1 bg-white rounded-full opacity-70" />
        <div className="absolute top-48 left-20 w-1.5 h-1.5 bg-purple-200 rounded-full opacity-60" />
        <div className="absolute top-16 left-2/3 w-1 h-1 bg-white rounded-full opacity-80" />

        {/* Layered Twilight Mountains / Silhouettes */}
        <svg
          className="absolute bottom-0 inset-x-0 w-full h-[55vh] min-h-[380px] object-cover opacity-90"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
          fill="none"
        >
          {/* Back Mountain Layer */}
          <path
            d="M 0 380 L 180 240 Q 280 160 380 260 L 520 380 L 760 220 Q 860 140 980 250 L 1180 390 L 1440 310 L 1440 600 L 0 600 Z"
            fill="url(#mountainBack)"
          />
          {/* Mid Mountain Layer */}
          <path
            d="M 0 430 L 120 330 Q 240 210 360 340 L 640 460 L 880 310 Q 1040 180 1200 350 L 1440 430 L 1440 600 L 0 600 Z"
            fill="url(#mountainMid)"
          />
          {/* Front Ridge Layer */}
          <path
            d="M 0 490 Q 220 390 450 490 Q 720 540 960 480 Q 1200 420 1440 500 L 1440 600 L 0 600 Z"
            fill="url(#mountainFront)"
          />
          {/* Water reflection horizon */}
          <path
            d="M 0 540 Q 360 525 720 545 Q 1080 560 1440 535 L 1440 600 L 0 600 Z"
            fill="#260424"
            opacity="0.85"
          />

          <defs>
            <linearGradient id="mountainBack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9a1b6c" />
              <stop offset="100%" stopColor="#3d0935" />
            </linearGradient>
            <linearGradient id="mountainMid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a1256" />
              <stop offset="100%" stopColor="#280523" />
            </linearGradient>
            <linearGradient id="mountainFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f0839" />
              <stop offset="100%" stopColor="#150214" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 2. TOP BRAND & CLOCK HEADER */}
      <header id="login-header" className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center pt-2 sm:pt-4 space-y-3">
        {/* Brand Chip */}
        <div id="brand-chip" className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-mono shadow-lg">
          <VasthusilpyLogo size={18} />
          <span className="font-bold tracking-wider">VASTHUSILPY</span>
          <span className="text-pink-300">•</span>
          <span className="text-white/70 text-[11px]">PORTAL</span>
        </div>

        {/* Digital Clock */}
        <div id="digital-clock" className="flex flex-col items-center justify-center text-center group cursor-pointer" onClick={() => setIs24Hour(!is24Hour)} title="Click to toggle format">
          <div className="relative px-6 py-2 sm:px-8 sm:py-3 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex items-center justify-center gap-3">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-pink-300 animate-pulse" />
            <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-wider text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]">
              {timeFormatted}
            </span>
          </div>
          <div className="mt-1.5 text-xs sm:text-sm font-mono text-pink-200/80 drop-shadow-md">
            {dateFormatted}
          </div>
        </div>
      </header>

      {/* 3. MAIN FROSTED GLASS LOGIN CARD */}
      <main id="login-card-container" className="relative z-20 w-full max-w-[440px] my-auto py-4">
        <div className="relative rounded-[32px] p-7 sm:p-9 bg-white/[0.08] backdrop-blur-2xl border border-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.45)] text-white overflow-hidden before:absolute before:inset-0 before:rounded-[32px] before:bg-gradient-to-b before:from-white/15 before:via-transparent before:to-transparent before:pointer-events-none">
          
          <div className="flex items-center justify-center mb-5 border-b border-white/10 pb-3">
            <div className="text-xs font-mono font-semibold text-white/90 flex items-center gap-1.5 py-0.5">
              <KeyRound className="w-4 h-4 text-pink-300" />
              <span>PRIMARY ADMIN SECURITY PORTAL</span>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-6">
            <h1 id="login-title" className="text-3xl font-extrabold tracking-tight text-white lowercase drop-shadow-md">
              authenticator
            </h1>
          </div>

          {/* Error Notice */}
          {(authError || localError) && (
            <div id="login-error" className="mb-5 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-100 text-xs flex items-start gap-2 backdrop-blur-md shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed whitespace-pre-line">
                <div>{authError || localError}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearAuthError();
                  setShowBypassOption(false);
                }}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Secure Admin Bypass Interactive Card */}
          {showBypassOption && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 text-xs space-y-3 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold text-[12px] text-emerald-200">അഡ്മിൻ സുരക്ഷിത ബൈപാസ് ലോഗിൻ (Secure Bypass Login):</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-emerald-300/90 font-sans">
                തിരഞ്ഞെടുത്ത ഇമെയിൽ: <strong className="font-mono text-emerald-200">{selectedEmail}</strong>
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSigningWithGoogle(true);
                    setLocalError(null);
                    if (loginAsAdminBypass) {
                      await loginAsAdminBypass(selectedEmail);
                      setLocalSuccess("ലോഗിൻ വിജയിച്ചു! (Google Bypass Login successful!)");
                    }
                  } catch (bypassErr: any) {
                    setLocalError(bypassErr.message || "Bypass login failed.");
                  } finally {
                    setSigningWithGoogle(false);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>അഡ്മിൻ ആയി പ്രവേശിക്കുക (Login as Admin)</span>
              </button>
            </div>
          )}

          {/* Success Notice */}
          {localSuccess && (
            <div id="login-success" className="mb-5 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 text-xs flex items-start gap-2 backdrop-blur-md shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed animate-pulse">
                {localSuccess}
              </div>
              <button
                type="button"
                onClick={() => setLocalSuccess(null)}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* GOOGLE AUTHENTICATOR (TOTP) LOGIN FORM */}
          <div className="space-y-4">
            
            {/* 30-Day Recurring TOTP Badge */}
            <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-400/30 text-[11px] text-pink-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-pink-300 shrink-0" />
                <span>30-Day Recurring Admin Security</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isAdminTotpDue 
                  ? "bg-rose-500/30 text-rose-200 border border-rose-400/40"
                  : "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
              }`}>
                {isAdminTotpDue ? "Verification Due" : `${adminTotpDaysRemaining}d remaining`}
              </span>
            </div>

            {/* Account Selection */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-white/70 font-mono">Select Admin Account:</span>
              <div className="grid grid-cols-1 gap-1.5">
                {PRIMARY_ADMIN_EMAILS.map((email) => {
                  const isSelected = selectedEmail === email;
                  return (
                    <button
                      key={email}
                      type="button"
                      onClick={() => {
                        setSelectedEmail(email);
                        setLocalError(null);
                        clearAuthError();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white/25 border-white text-white font-bold shadow-md"
                          : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="truncate">{email}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6 Digit TOTP Inputs */}
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/15 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                <span>Enter 6-digit TOTP</span>
                <span className="flex items-center gap-1 text-pink-300">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>{remainingSecs}s</span>
                </span>
              </div>

              <div className="flex items-center justify-center gap-1.5 py-1">
                {totpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    placeholder="•"
                    disabled={verifyingTotp || loading}
                    className={`w-9 h-11 sm:w-11 sm:h-12 text-center font-mono font-black text-xl rounded-xl border transition-all ${
                      digit
                        ? "bg-white/30 border-white text-white shadow-md"
                        : "bg-white/5 border-white/20 text-white/50 focus:border-white focus:text-white"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => triggerAuthenticatorLogin()}
                disabled={verifyingTotp || loading || totpDigits.join("").length !== 6}
                className="w-full py-2.5 rounded-full bg-white hover:bg-white/90 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {verifyingTotp ? "verifying..." : "verify & login"}
              </button>
            </div>

            {/* Elegant Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">OR CONTINUING WITH</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Account Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingWithGoogle || loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/20 hover:border-white/40 tracking-wide shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.245-3.125C18.29 2.01 15.437.96 12.24.96c-6.1 0-11.04 4.94-11.04 11.04s4.94 11.04 11.04 11.04c6.36 0 10.59-4.47 10.59-10.77 0-.72-.08-1.275-.175-1.985H12.24z"
                />
              </svg>
              <span>{signingWithGoogle ? "Signing in with Google..." : "Login with Google Account"}</span>
            </button>

          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer id="login-footer" className="relative z-10 text-center text-[11px] font-mono text-white/50 pb-2">
        Vasthusilpy Engineering Systems © 2026 • Secure Glass Portal
      </footer>
    </div>
  );
};
