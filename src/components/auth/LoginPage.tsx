import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { PRIMARY_ADMIN_EMAILS } from "../../lib/firebase";
import { VasthusilpyLogo } from "../common/VasthusilpyLogo";
import { getTotpRemainingSeconds } from "../../utils/totp";
import {
  UPI_ID,
  UPI_PAYEE_NAME,
  UPI_PRICING_PLANS,
  DEFAULT_SUBSCRIPTION_FEE_INR,
  isValidUpiAmount,
  getUpiPaymentUrl,
  getUpiQrCodeUrl,
  hasUsedFreeTrial
} from "../../utils/subscriptionManager";
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Smartphone,
  KeyRound,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Phone,
  Mail,
  User,
  Hash,
  Key,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  LogOut
} from "lucide-react";

export const LoginPage: React.FC = () => {
  const {
    loginWithGoogleAuthenticator,
    loginWithSubscription,
    signOutUser,
    submitSubscriptionRequest,
    changeSubscriptionPassword,
    subscriptionRequests,
    loading,
    authError,
    clearAuthError,
    adminTotpDaysRemaining,
    isAdminTotpDue
  } = useAuth();

  // Active Login Mode: "subscription" | "authenticator"
  const [loginMode, setLoginMode] = useState<"subscription" | "authenticator">("subscription");

  // Subscription Sub-Mode: "login" | "register"
  const [subMode, setSubMode] = useState<"login" | "register">("login");

  // Remember Me state
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem("vasthusilpy_remember_me") === "true";
  });

  // Authenticator state
  const [selectedEmail, setSelectedEmail] = useState<string>("deepak.vasthusilpy@gmail.com");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [isCustomEmail, setIsCustomEmail] = useState<boolean>(false);
  const [totpDigits, setTotpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyingTotp, setVerifyingTotp] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  // Subscription Login Form State (Supports Email or Mobile Number)
  const [subLoginId, setSubLoginId] = useState<string>(() => {
    return localStorage.getItem("vasthusilpy_saved_login_id") || "";
  });
  const [subLoginPassword, setSubLoginPassword] = useState<string>("");
  const [showSubLoginPassword, setShowSubLoginPassword] = useState<boolean>(false);
  const [loggingInSub, setLoggingInSub] = useState<boolean>(false);

  // Subscription Registration / Request Form State
  const [regFullName, setRegFullName] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPhone, setRegPhone] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regUpiRef, setRegUpiRef] = useState<string>("");
  const [regAmount, setRegAmount] = useState<number>(DEFAULT_SUBSCRIPTION_FEE_INR);
  const [customAmountInput, setCustomAmountInput] = useState<string>("");
  const [isCustomAmount, setIsCustomAmount] = useState<boolean>(false);
  const [regNotes, setRegNotes] = useState<string>("");
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [submittingReg, setSubmittingReg] = useState<boolean>(false);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // Free Trial One-Time Check
  const freeTrialAlreadyUsed = hasUsedFreeTrial(regEmail, regPhone, subscriptionRequests);

  // Auto-switch away from Free Trial if already used
  useEffect(() => {
    if (freeTrialAlreadyUsed && regAmount === 0) {
      setRegAmount(DEFAULT_SUBSCRIPTION_FEE_INR);
      if (regUpiRef === "FREE-TRIAL") {
        setRegUpiRef("");
      }
    }
  }, [freeTrialAlreadyUsed, regAmount, regUpiRef]);

  // Registration Submission Success Card State
  const [registeredSummary, setRegisteredSummary] = useState<{
    id: string;
    email: string;
    phone: string;
    amount: number;
    planName: string;
  } | null>(null);

  // Password Change Modal State
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState<boolean>(false);
  const [pwdChangeId, setPwdChangeId] = useState<string>("");
  const [pwdChangeVerification, setPwdChangeVerification] = useState<string>("");
  const [pwdChangeNew, setPwdChangeNew] = useState<string>("");
  const [pwdChangeConfirm, setPwdChangeConfirm] = useState<string>("");
  const [showNewPwd, setShowNewPwd] = useState<boolean>(false);
  const [submittingPwdChange, setSubmittingPwdChange] = useState<boolean>(false);

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

  // Input refs for 6 OTP boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update 30s countdown indicator
  useEffect(() => {
    const updateCountdown = () => {
      setRemainingSecs(getTotpRemainingSeconds());
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Effective Email for TOTP
  const effectiveEmail = isCustomEmail ? customEmail.trim().toLowerCase() : selectedEmail;

  // Selected payment amount
  const effectiveAmount = isCustomAmount
    ? parseInt(customAmountInput, 10) || 0
    : regAmount;

  // Dynamic UPI URL & QR
  const upiPaymentDeepLink = getUpiPaymentUrl(
    effectiveAmount,
    `Vasthusilpy Pass - ${regPhone || regEmail || "Subscription"}`
  );
  const upiQrCodeUrl = getUpiQrCodeUrl(
    effectiveAmount,
    `Vasthusilpy Pass - ${regPhone || regEmail || "Subscription"}`
  );

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

    if (!effectiveEmail || !effectiveEmail.includes("@")) {
      setLocalError("ദയവായി ശരിയായ ഇമെയിൽ നൽകുക.");
      return;
    }

    setVerifyingTotp(true);
    setLocalError(null);
    clearAuthError();

    try {
      await loginWithGoogleAuthenticator(effectiveEmail, finalCode);
    } catch (err: any) {
      setLocalError(err.message || "Google Authenticator verification failed.");
      setTotpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifyingTotp(false);
    }
  };

  // Handle Subscription Login (Email OR Mobile Number)
  const handleSubscriptionLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = subLoginId.trim();
    const cleanPass = subLoginPassword.trim();

    if (!cleanId || !cleanPass) {
      setLocalError("Please enter your Email or Mobile Number and Password.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("vasthusilpy_remember_me", "true");
      localStorage.setItem("vasthusilpy_saved_login_id", cleanId);
    } else {
      localStorage.removeItem("vasthusilpy_remember_me");
      localStorage.removeItem("vasthusilpy_saved_login_id");
    }

    setLoggingInSub(true);
    setLocalError(null);
    clearAuthError();

    try {
      await loginWithSubscription(cleanId, cleanPass);
    } catch (err: any) {
      if (err?.code === "ADMIN_TOTP_REQUIRED" || err?.message?.includes("ADMIN_TOTP_REQUIRED")) {
        setLoginMode("authenticator");
        if (err.adminEmail) {
          setSelectedEmail(err.adminEmail);
          setIsCustomEmail(false);
        }
        setLocalError(
          "അഡ്മിൻ സുരക്ഷാ പരിശോധന: 30 ദിവസത്തെ സുരക്ഷാ ഇടവേള കഴിഞ്ഞതിനാൽ Google Authenticator TOTP കോഡ് നൽകി ലോഗിൻ ചെയ്യുക (30-day recurring Admin TOTP required)."
        );
        return;
      }
      setLocalError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoggingInSub(false);
    }
  };

  // Handle Subscription Request Submission
  const handleSubscriptionRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    const amt = effectiveAmount;

    if (!isValidUpiAmount(amt)) {
      setLocalError("UPI payment amount must be ₹0 or multiples of ₹200.");
      return;
    }

    if (!regEmail.trim() || !regPhone.trim() || !regPassword.trim()) {
      setLocalError("Please fill in email, phone number, and password.");
      return;
    }

    if (amt > 0 && (!regUpiRef.trim() || regUpiRef.trim().length < 6)) {
      setLocalError(`Please enter 12-digit UPI Reference / UTR Number for ₹${amt}.`);
      return;
    }

    if (regPassword.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setSubmittingReg(true);

    try {
      const planItem = UPI_PRICING_PLANS.find((p) => p.amount === amt);
      const planName =
        planItem?.label || (amt === 0 ? "Vasthusilpy Free Trial" : `Vasthusilpy ₹${amt} Pro Pass`);

      const res = await submitSubscriptionRequest({
        fullName: regFullName.trim() || regEmail.split("@")[0],
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        upiRefId: amt === 0 ? "FREE-TRIAL" : regUpiRef.trim(),
        amountPaid: amt,
        planName: planName,
        notes: regNotes.trim()
      });

      setRegisteredSummary({
        id: res.id,
        email: regEmail.trim(),
        phone: regPhone.trim(),
        amount: amt,
        planName: planName
      });

      setSubLoginId(regEmail.trim());
      setSubLoginPassword(regPassword);

      setLocalSuccess(
        `Registration request submitted (ID: ${res.id}). You can now log in using your Email or Mobile.`
      );
    } catch (err: any) {
      setLocalError(err.message || "Failed to submit subscription request.");
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Password Change / Reset Submission
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!pwdChangeId.trim()) {
      setLocalError("Please enter your registered Email or Mobile Number.");
      return;
    }
    if (!pwdChangeVerification.trim()) {
      setLocalError("Please enter your UPI Reference ID or Request ID.");
      return;
    }
    if (pwdChangeNew.length < 6) {
      setLocalError("New password must be at least 6 characters.");
      return;
    }
    if (pwdChangeNew !== pwdChangeConfirm) {
      setLocalError("Passwords do not match.");
      return;
    }

    setSubmittingPwdChange(true);

    try {
      const res = await changeSubscriptionPassword(
        pwdChangeId.trim(),
        pwdChangeVerification.trim(),
        pwdChangeNew.trim()
      );

      setLocalSuccess(res.message || "Password updated successfully!");
      setSubLoginId(pwdChangeId.trim());
      setSubLoginPassword(pwdChangeNew.trim());
      setShowPasswordChangeModal(false);
      setPwdChangeId("");
      setPwdChangeVerification("");
      setPwdChangeNew("");
      setPwdChangeConfirm("");
    } catch (err: any) {
      setLocalError(err.message || "Could not reset password. Please check your verification info.");
    } finally {
      setSubmittingPwdChange(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden bg-gradient-to-b from-[#0e021a] via-[#240638] to-[#590d45] select-none font-sans">
      
      {/* Top Right Logout Button */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={async () => {
            await signOutUser();
            setLocalSuccess("Session cleared successfully.");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-mono backdrop-blur-md shadow-lg transition-all cursor-pointer"
          title="Sign out / Clear Session"
        >
          <LogOut className="w-3.5 h-3.5 text-pink-300" />
          <span>Logout / Reset</span>
        </button>
      </div>

      {/* 1. SCENIC TWILIGHT ARTWORK BACKGROUND (Matches Mockup Image) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft Ambient Aurora Gradients */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-purple-600/25 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] bg-pink-600/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-0 inset-x-0 h-[450px] bg-gradient-to-t from-[#360830] via-[#520e45]/80 to-transparent" />

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

        {/* Layered Twilight Mountains / Silhouettes (Matching Image) */}
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
          {/* Front Ridge & Pine Trees Layer */}
          <path
            d="M 0 490 Q 220 390 450 490 Q 720 540 960 480 Q 1200 420 1440 500 L 1440 600 L 0 600 Z"
            fill="url(#mountainFront)"
          />
          {/* Water / Lake Horizon Reflection */}
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

      {/* 2. TOP MINIMAL BRAND & CLOCK SECTION */}
      <header className="relative z-10 w-full max-w-4xl flex flex-col items-center justify-center pt-2 sm:pt-4 space-y-3">
        {/* Brand Chip */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-mono shadow-lg">
          <VasthusilpyLogo size={18} />
          <span className="font-bold tracking-wider">VASTHUSILPY</span>
          <span className="text-pink-300">•</span>
          <span className="text-white/70 text-[11px]">PORTAL</span>
        </div>

        {/* MODERATELY BIG DIGITAL CLOCK (Clean, glowing, modern) */}
        <div className="flex flex-col items-center justify-center text-center group cursor-pointer" onClick={() => setIs24Hour(!is24Hour)} title="Click to toggle 12h/24h format">
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

      {/* 3. MAIN FROSTED GLASS LOGIN CARD (Matching Attached Reference) */}
      <main className="relative z-20 w-full max-w-[440px] my-auto py-4">
        <div className="relative rounded-[32px] p-7 sm:p-9 bg-white/[0.08] backdrop-blur-2xl border border-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.45)] text-white overflow-hidden before:absolute before:inset-0 before:rounded-[32px] before:bg-gradient-to-b before:from-white/15 before:via-transparent before:to-transparent before:pointer-events-none">
          
          {/* Subtle Top Mode Toggle (Subscriber Login vs Admin Login) */}
          <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => {
                setLoginMode("subscription");
                setSubMode("login");
                setLocalError(null);
                setLocalSuccess(null);
              }}
              className={`text-xs font-mono font-semibold transition-all cursor-pointer pb-0.5 ${
                loginMode === "subscription"
                  ? "text-white border-b-2 border-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Subscriber Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("authenticator");
                setLocalError(null);
                setLocalSuccess(null);
              }}
              className={`text-xs font-mono font-semibold transition-all cursor-pointer pb-0.5 flex items-center gap-1 ${
                loginMode === "authenticator"
                  ? "text-white border-b-2 border-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <KeyRound className="w-3 h-3" />
              <span>Admin Login (9747995961)</span>
            </button>
          </div>

          {/* Heading - Exact matching "login" in lowercase display style */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white lowercase drop-shadow-md">
              {loginMode === "authenticator"
                ? "authenticator"
                : subMode === "register"
                ? "register"
                : "login"}
            </h1>
          </div>

          {/* Error Notice */}
          {(authError || localError) && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-100 text-xs flex items-start gap-2 backdrop-blur-md shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <div>{authError || localError}</div>
                {((authError || localError)?.includes("കണ്ടെത്തിയില്ല") ||
                  (authError || localError)?.includes("not found")) && (
                  <div className="mt-2 pt-2 border-t border-rose-500/30 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubMode("register");
                        setRegAmount(0);
                        setRegEmail(subLoginId.includes("@") ? subLoginId : "");
                        setRegPhone(!subLoginId.includes("@") ? subLoginId : "");
                        setLocalError(null);
                        clearAuthError();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-medium text-[10.5px] cursor-pointer transition-colors shadow"
                    >
                      സൗജന്യ 7-ദിവസ ട്രയൽ ആരംഭിക്കുക
                    </button>
                    <span className="text-[10.5px] text-pink-200">
                      പാസ്‌വേഡ് നൽകി ലോഗിൻ ചെയ്യാം.
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearAuthError();
                }}
                className="text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Notice */}
          {localSuccess && (
            <div className="mb-5 p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-100 text-xs flex items-start gap-2 backdrop-blur-md shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
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

          {/* ============================================================ */}
          {/* 1. SUBSCRIPTION / USER LOGIN (Primary View matching mockup) */}
          {/* ============================================================ */}
          {loginMode === "subscription" && subMode === "login" && (
            <form onSubmit={handleSubscriptionLogin} className="space-y-5">
              
              {/* Email / Mobile Field (Clean Glass Underline Style) */}
              <div className="space-y-1">
                <div className="relative border-b border-white/40 focus-within:border-white transition-colors pb-1">
                  <input
                    type="text"
                    required
                    value={subLoginId}
                    onChange={(e) => setSubLoginId(e.target.value)}
                    placeholder="Email or Mobile"
                    className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none pr-8 py-1.5"
                  />
                  <Mail className="w-4 h-4 text-white/70 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="relative border-b border-white/40 focus-within:border-white transition-colors pb-1">
                  <input
                    type={showSubLoginPassword ? "text" : "password"}
                    required
                    value={subLoginPassword}
                    onChange={(e) => setSubLoginPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-transparent text-sm text-white placeholder-white/50 focus:outline-none pr-10 py-1.5"
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/70">
                    <button
                      type="button"
                      onClick={() => setShowSubLoginPassword(!showSubLoginPassword)}
                      className="hover:text-white cursor-pointer"
                    >
                      {showSubLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row (Matching image layout) */}
              <div className="flex items-center justify-between text-xs text-white/80 pt-1 font-sans">
                <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/40 bg-white/10 text-pink-500 focus:ring-0 cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setPwdChangeId(subLoginId.trim());
                    setShowPasswordChangeModal(true);
                  }}
                  className="hover:text-white hover:underline cursor-pointer"
                >
                  Forgot Password
                </button>
              </div>

              {/* Main Rounded Pill Login Button (Matching Image) */}
              <button
                type="submit"
                disabled={loggingInSub || loading}
                className="w-full mt-4 py-3 rounded-full bg-white hover:bg-white/90 active:scale-[0.99] text-slate-950 font-bold text-sm lowercase tracking-wider shadow-lg shadow-black/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loggingInSub ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>logging in...</span>
                  </>
                ) : (
                  <span>login</span>
                )}
              </button>

              {/* Unified Login & Data Sync Helper Notice */}
              <div className="pt-2 text-center flex flex-col items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-mono text-purple-100/90">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Unified Login: Mobile (9747995961) or Email
                </span>
              </div>

              {/* Bottom Register Switch (Matching image) */}
              <div className="text-center pt-2 text-xs text-white/80">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setSubMode("register");
                    setLocalError(null);
                    setLocalSuccess(null);
                  }}
                  className="text-white font-bold hover:underline cursor-pointer ml-1"
                >
                  Register
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* 2. REGISTRATION & SUBSCRIPTION ACTIVATION VIEW               */}
          {/* ============================================================ */}
          {loginMode === "subscription" && subMode === "register" && (
            <form onSubmit={handleSubscriptionRequestSubmit} className="space-y-4">
              
              <div className="space-y-3">
                {/* Full Name */}
                <div className="relative border-b border-white/40 focus-within:border-white pb-1">
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none pr-8 py-1"
                  />
                  <User className="w-4 h-4 text-white/70 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Email */}
                <div className="relative border-b border-white/40 focus-within:border-white pb-1">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="Email ID *"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none pr-8 py-1"
                  />
                  <Mail className="w-4 h-4 text-white/70 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Phone */}
                <div className="relative border-b border-white/40 focus-within:border-white pb-1">
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Mobile Number *"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none pr-8 py-1"
                  />
                  <Phone className="w-4 h-4 text-white/70 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Password */}
                <div className="relative border-b border-white/40 focus-within:border-white pb-1">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Set Password (min 6 chars) *"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-white/50 focus:outline-none pr-10 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Plan Selection Tiers (Glass Pills) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[11px] text-white/80 font-mono">
                  <span>Select Plan:</span>
                  <span className="font-bold text-pink-300">₹{effectiveAmount}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {UPI_PRICING_PLANS.map((plan) => {
                    const isTrialPlan = plan.amount === 0 || plan.isFree;
                    const isTrialDisabled = isTrialPlan && freeTrialAlreadyUsed;
                    const isSelected = !isCustomAmount && regAmount === plan.amount;
                    return (
                      <button
                        key={plan.amount}
                        type="button"
                        disabled={isTrialDisabled}
                        onClick={() => {
                          if (isTrialDisabled) return;
                          setIsCustomAmount(false);
                          setRegAmount(plan.amount);
                          if (plan.amount === 0) {
                            setRegUpiRef("FREE-TRIAL");
                          } else if (regUpiRef === "FREE-TRIAL") {
                            setRegUpiRef("");
                          }
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isTrialDisabled
                            ? "bg-black/20 border-white/10 text-white/30 cursor-not-allowed"
                            : isSelected
                            ? "bg-white/25 border-white text-white font-bold shadow-md"
                            : "bg-white/5 border-white/15 text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="text-xs font-mono font-bold">
                          {plan.amount === 0 ? "₹0 Free" : `₹${plan.amount}`}
                        </div>
                        <div className="text-[9px] text-white/60 truncate font-mono">
                          {isTrialDisabled ? "Used" : plan.durationLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI QR & Ref ID if amount > 0 */}
              {effectiveAmount > 0 ? (
                <div className="p-3 rounded-2xl bg-black/30 border border-white/15 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-pink-300 font-bold">UPI Payment: {UPI_ID}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white text-[10px] font-mono cursor-pointer"
                    >
                      {copiedUpi ? "Copied" : "Copy UPI"}
                    </button>
                  </div>

                  <a
                    href={upiPaymentDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-mono font-bold text-white transition-all"
                  >
                    Pay ₹{effectiveAmount} via GPay / PhonePe
                  </a>

                  <div className="relative border-b border-white/40 focus-within:border-white pb-1 pt-1">
                    <input
                      type="text"
                      required
                      value={regUpiRef}
                      onChange={(e) => setRegUpiRef(e.target.value)}
                      placeholder="12-digit UPI Ref ID / UTR Number *"
                      className="w-full bg-transparent text-xs font-mono text-white placeholder-white/50 focus:outline-none pr-8 py-1"
                    />
                    <Hash className="w-3.5 h-3.5 text-white/70 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200">
                  ₹0 Free Trial — No payment required. Submit to activate.
                </div>
              )}

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={submittingReg || loading}
                className="w-full py-3 rounded-full bg-white hover:bg-white/90 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingReg ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>submitting...</span>
                  </>
                ) : (
                  <span>register & submit</span>
                )}
              </button>

              <div className="text-center pt-1 text-xs text-white/80">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => setSubMode("login")}
                  className="text-white font-bold hover:underline cursor-pointer ml-1"
                >
                  login
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* 3. GOOGLE AUTHENTICATOR (TOTP) LOGIN VIEW                    */}
          {/* ============================================================ */}
          {loginMode === "authenticator" && (
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
                    const isSelected = !isCustomEmail && selectedEmail === email;
                    return (
                      <button
                        key={email}
                        type="button"
                        onClick={() => {
                          setIsCustomEmail(false);
                          setSelectedEmail(email);
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

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("subscription");
                    setSubMode("login");
                  }}
                  className="text-xs text-white/80 hover:text-white font-mono underline cursor-pointer"
                >
                  ← Back to Email / Password Login
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 4. PASSWORD RESET MODAL (Glassy Overlay) */}
      {showPasswordChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-purple-950/80 border border-white/25 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Key className="w-4 h-4 text-pink-300" />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordChangeModal(false)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-white/80">Email or Mobile Number:</label>
                <input
                  type="text"
                  required
                  value={pwdChangeId}
                  onChange={(e) => setPwdChangeId(e.target.value)}
                  placeholder="engineer@gmail.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/80">UPI Ref ID or Request ID:</label>
                <input
                  type="text"
                  required
                  value={pwdChangeVerification}
                  onChange={(e) => setPwdChangeVerification(e.target.value)}
                  placeholder="12-digit UPI Ref or Req ID"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/80">New Password (min 6 chars):</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? "text" : "password"}
                    required
                    value={pwdChangeNew}
                    onChange={(e) => setPwdChangeNew(e.target.value)}
                    placeholder="New password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 pr-8 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/80">Confirm New Password:</label>
                <input
                  type={showNewPwd ? "text" : "password"}
                  required
                  value={pwdChangeConfirm}
                  onChange={(e) => setPwdChangeConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPwdChange}
                  className="px-5 py-2 rounded-full bg-white text-slate-900 font-bold hover:bg-white/90 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submittingPwdChange ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MINIMAL BOTTOM FOOTER */}
      <footer className="relative z-10 text-center text-[11px] font-mono text-white/50 pb-2">
        Vasthusilpy Engineering Systems © 2026 • Secure Glass Portal
      </footer>
    </div>
  );
};

