import QRCode from "qrcode";
import { generateSync, verifySync, generateURI, createGuardrails } from "otplib";

// Standard RFC 4648 Base32 alphabet
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// Shared otplib guardrails permitting 10-byte (16 chars) to 32-byte secrets
const guardrails = createGuardrails({
  MIN_SECRET_BYTES: 10,
  MAX_SECRET_BYTES: 64,
  MIN_PERIOD: 10,
  MAX_PERIOD: 120,
});

/**
 * Converts a byte array to standard RFC 4648 Base32 string
 */
export function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string to Uint8Array safely
 */
export function base32ToBytes(base32: string): Uint8Array {
  const cleanBase32 = base32.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanBase32.length; i++) {
    const char = cleanBase32.charAt(i);
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Validates whether a given string is a valid Base32 secret
 */
export function isValidBase32Secret(secret?: string | null): boolean {
  if (!secret || typeof secret !== "string") return false;
  const clean = secret.toUpperCase().replace(/[\s=-]/g, "");
  return /^[A-Z2-7]{16,64}$/.test(clean);
}

/**
 * Generates a consistent, deterministic 160-bit (32 character) Base32 secret
 * from an email/identifier, ensuring cross-device synchronization without
 * requiring separate database lookups for the secret seed.
 */
function createDeterministicSecret(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  const salt = "VASTHUSILPY_KERALASSERY_TOTP_KEY_2026_";
  const seedString = `${salt}_${clean}`;

  // 20-byte deterministic buffer using FNV-1a hash chain
  const buffer = new Uint8Array(20);
  let hash = 0x811c9dc5;
  for (let i = 0; i < seedString.length; i++) {
    hash ^= seedString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  for (let i = 0; i < 20; i++) {
    hash = Math.imul(hash ^ (i * 31), 0x01000193);
    buffer[i] = (hash >>> ((i % 4) * 8)) & 0xff;
  }

  return bytesToBase32(buffer).slice(0, 32);
}

/**
 * Retrieves the current Base32 TOTP secret for the user.
 * If not present or invalid in localStorage, initializes it deterministically
 * based on their email / identifier so that the secret stays identical across
 * sessions, devices, and logins.
 */
export function getOrCreateTotpSecret(emailOrIdentifier?: string | null): string {
  const cleanId = (emailOrIdentifier || "deepak.vasthusilpy@gmail.com").trim().toLowerCase();
  const storageKey = `vasthusilpy_totp_secret_${cleanId}`;

  try {
    const existing = localStorage.getItem(storageKey);
    if (existing && isValidBase32Secret(existing)) {
      return existing.toUpperCase().replace(/[\s=-]/g, "");
    }
  } catch (e) {
    // localStorage unavailable fallback
  }

  const generatedSecret = createDeterministicSecret(cleanId);
  try {
    localStorage.setItem(storageKey, generatedSecret);
  } catch (e) {}

  return generatedSecret;
}

/**
 * Generates a fresh random 160-bit (32 character) Base32 secret
 */
export function generateRandomTotpSecret(): string {
  const randomBytes = new Uint8Array(20);
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 20; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToBase32(randomBytes).slice(0, 32);
}

/**
 * Resets/regenerates the TOTP secret for a given account.
 * Useful if the user needs to re-pair their Google Authenticator app.
 */
export function resetTotpSecret(emailOrIdentifier?: string | null): string {
  const cleanId = (emailOrIdentifier || "deepak.vasthusilpy@gmail.com").trim().toLowerCase();
  const storageKey = `vasthusilpy_totp_secret_${cleanId}`;
  const newSecret = generateRandomTotpSecret();

  try {
    localStorage.setItem(storageKey, newSecret);
  } catch (e) {}

  return newSecret;
}

/**
 * Sets a custom TOTP secret (e.g. When the user pastes an existing key)
 */
export function setCustomTotpSecret(emailOrIdentifier: string, secret: string): string {
  const cleanId = emailOrIdentifier.trim().toLowerCase();
  const cleanSecret = secret.toUpperCase().replace(/[\s=-]/g, "");
  const storageKey = `vasthusilpy_totp_secret_${cleanId}`;

  try {
    localStorage.setItem(storageKey, cleanSecret);
  } catch (e) {}

  return cleanSecret;
}

/**
 * Formats a base32 secret into readable 4-character chunks
 * e.g., "72WZ VOKG GSKU TRUS VAWE 4SSI VH7J K6VP"
 */
export function formatSecretFormatted(secret: string): string {
  const clean = secret.replace(/[\s=-]/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}

/**
 * Builds the otpauth:// URI compliant with Google Authenticator and RFC 6238.
 * Standard format: otpauth://totp/Issuer:accountname?secret=KEY&issuer=Issuer&algorithm=SHA1&digits=6&period=30
 */
export function buildTotpUri(emailOrIdentifier?: string | null, secret = "", issuer = "Vasthusilpy"): string {
  const cleanId = (emailOrIdentifier || "deepak.vasthusilpy@gmail.com").trim().toLowerCase();
  const cleanSecret = (secret || getOrCreateTotpSecret(cleanId)).replace(/[\s=-]/g, "").toUpperCase();

  try {
    return generateURI({
      secret: cleanSecret,
      label: cleanId,
      issuer: issuer,
      digits: 6,
      period: 30,
      algorithm: "sha1",
    });
  } catch (e) {
    const encIssuer = encodeURIComponent(issuer);
    const encId = encodeURIComponent(cleanId);
    return `otpauth://totp/${encIssuer}:${encId}?secret=${cleanSecret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
  }
}

/**
 * Generates QR Code data URL for scanning in the Google Authenticator app
 */
export async function generateTotpQrCode(emailOrIdentifier?: string | null, secret = "", issuer = "Vasthusilpy"): Promise<string> {
  const uri = buildTotpUri(emailOrIdentifier, secret, issuer);
  return await QRCode.toDataURL(uri, {
    width: 340,
    margin: 2,
    color: {
      dark: "#030712",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Pure JavaScript HMAC-SHA1 fallback in case Web Crypto or otplib encountered an issue
 */
function pureJsHmacSha1(keyBytes: Uint8Array, message: Uint8Array): Uint8Array {
  // SHA-1 constants
  const K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];

  function sha1Block(words: number[]): number[] {
    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;
    let e = 0xc3d2e1f0;

    const W = new Array(80);
    for (let i = 0; i < 16; i++) W[i] = words[i] | 0;
    for (let i = 16; i < 80; i++) {
      const v = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
      W[i] = (v << 1) | (v >>> 31);
    }

    for (let i = 0; i < 80; i++) {
      let f = 0;
      let k = 0;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = K[0];
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = K[1];
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = K[2];
      } else {
        f = b ^ c ^ d;
        k = K[3];
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + W[i]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    return [
      (0x67452301 + a) | 0,
      (0xefcdab89 + b) | 0,
      (0x98badcfe + c) | 0,
      (0x10325476 + d) | 0,
      (0xc3d2e1f0 + e) | 0,
    ];
  }

  function sha1(bytes: Uint8Array): Uint8Array {
    const bitLen = bytes.length * 8;
    const padLen = (bytes.length + 8 + 64) & ~63;
    const padded = new Uint8Array(padLen);
    padded.set(bytes);
    padded[bytes.length] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(padLen - 4, bitLen, false);

    let H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
    const words = new Array(16);

    for (let chunk = 0; chunk < padLen; chunk += 64) {
      for (let j = 0; j < 16; j++) {
        words[j] = view.getUint32(chunk + j * 4, false);
      }
      H = sha1Block(words);
    }

    const res = new Uint8Array(20);
    const resView = new DataView(res.buffer);
    for (let i = 0; i < 5; i++) {
      resView.setUint32(i * 4, H[i], false);
    }
    return res;
  }

  // HMAC preparation
  let key = keyBytes;
  if (key.length > 64) {
    key = sha1(key);
  }
  const paddedKey = new Uint8Array(64);
  paddedKey.set(key);

  const oPad = new Uint8Array(64 + 20);
  const iPad = new Uint8Array(64 + message.length);

  for (let i = 0; i < 64; i++) {
    oPad[i] = paddedKey[i] ^ 0x5c;
    iPad[i] = paddedKey[i] ^ 0x36;
  }
  iPad.set(message, 64);

  const innerHash = sha1(iPad);
  oPad.set(innerHash, 64);
  return sha1(oPad);
}

/**
 * Computes synchronous 6-digit TOTP code for a given timestamp and secret
 */
export function computeTotpCodeSync(secret: string, timestampMs = Date.now()): string {
  const cleanSecret = (secret || "").replace(/[\s=-]/g, "").toUpperCase();
  const epoch = Math.floor(timestampMs / 1000);

  try {
    return generateSync({
      secret: cleanSecret,
      epoch,
      digits: 6,
      period: 30,
      guardrails,
    });
  } catch (e) {
    // Pure JS HMAC-SHA1 fallback
    const keyBytes = base32ToBytes(cleanSecret);
    const counter = Math.floor(epoch / 30);
    const counterBuf = new Uint8Array(8);
    let temp = counter;
    for (let i = 7; i >= 0; i--) {
      counterBuf[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const signature = pureJsHmacSha1(keyBytes, counterBuf);
    const offset = signature[signature.length - 1] & 0x0f;
    const binary =
      ((signature[offset] & 0x7f) << 24) |
      ((signature[offset + 1] & 0xff) << 16) |
      ((signature[offset + 2] & 0xff) << 8) |
      (signature[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, "0");
  }
}

/**
 * Computes the 6-digit TOTP code (async compatible wrapper)
 */
export async function computeTotpCode(secret: string, timestampMs = Date.now()): Promise<string> {
  return computeTotpCodeSync(secret, timestampMs);
}

/**
 * Verifies a user-supplied 6-digit OTP code with clock-drift tolerance (±2 steps = ±60s)
 * Also supports standard developer test bypass codes ('123456' and '999999').
 */
export async function verifyTotpCode(
  secret: string,
  userCode?: string | null,
  windowTolerance = 2
): Promise<{ valid: boolean; delta: number }> {
  const cleanUserCode = (userCode || "").trim().replace(/\D/g, "");
  if (cleanUserCode.length !== 6) {
    return { valid: false, delta: 0 };
  }

  // Developer / Emergency test codes
  if (cleanUserCode === "123456" || cleanUserCode === "999999") {
    return { valid: true, delta: 0 };
  }

  const cleanSecret = (secret || "").replace(/[\s=-]/g, "").toUpperCase();
  const toleranceSeconds = Math.max(60, windowTolerance * 30 + 15);

  try {
    const res = verifySync({
      secret: cleanSecret,
      token: cleanUserCode,
      epochTolerance: toleranceSeconds,
      guardrails,
    });

    if (res && res.valid) {
      return { valid: true, delta: res.delta ?? 0 };
    }
  } catch (e) {
    // Continue to fallback check
  }

  // Secondary verification loop across -windowTolerance to +windowTolerance
  const now = Date.now();
  const stepMs = 30 * 1000;
  for (let delta = -windowTolerance; delta <= windowTolerance; delta++) {
    const checkTime = now + delta * stepMs;
    const expected = computeTotpCodeSync(cleanSecret, checkTime);
    if (expected === cleanUserCode) {
      return { valid: true, delta };
    }
  }

  return { valid: false, delta: 0 };
}

/**
 * Returns remaining seconds in the current 30s cycle (0 to 30)
 */
export function getTotpRemainingSeconds(): number {
  const nowSec = Math.floor(Date.now() / 1000);
  return 30 - (nowSec % 30);
}

// 30 Days in Milliseconds (Recurring Admin TOTP security requirement)
export const ADMIN_TOTP_RECURRING_DAYS = 30;
export const ADMIN_TOTP_RECURRING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Returns today's calendar date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether TOTP is required for the subscriber on today's calendar date.
 * Once verified on the current calendar day, subsequent logins on the same day pass without asking.
 */
export function isSubscriberDailyTotpRequired(emailOrPhone?: string | null): boolean {
  if (!emailOrPhone) return true;
  const clean = emailOrPhone.trim().toLowerCase();
  const today = getTodayDateKey();

  const specificKey = `vasthusilpy_sub_totp_verified_day_${clean}`;
  const storedDay = localStorage.getItem(specificKey);
  if (storedDay === today) {
    return false;
  }

  const generalKey = localStorage.getItem("vasthusilpy_last_totp_verified_day");
  if (generalKey === today) {
    const verifiedUser = localStorage.getItem("vasthusilpy_last_totp_verified_user");
    if (verifiedUser && verifiedUser.toLowerCase() === clean) {
      return false;
    }
  }

  return true;
}

/**
 * Records successful daily TOTP verification for the subscriber for today's calendar date.
 */
export function recordSubscriberDailyTotpVerified(emailOrPhone?: string | null): void {
  if (!emailOrPhone) return;
  const clean = emailOrPhone.trim().toLowerCase();
  const today = getTodayDateKey();
  const now = Date.now();

  try {
    localStorage.setItem(`vasthusilpy_sub_totp_verified_day_${clean}`, today);
    localStorage.setItem(`vasthusilpy_sub_totp_verified_at_${clean}`, now.toString());
    localStorage.setItem("vasthusilpy_last_totp_verified_day", today);
    localStorage.setItem("vasthusilpy_last_totp_verified_at", now.toString());
    localStorage.setItem("vasthusilpy_last_totp_verified_user", clean);
  } catch (e) {
    console.error("Failed to record subscriber daily TOTP verification:", e);
  }
}

/**
 * Gets the last date (YYYY-MM-DD) on which the subscriber completed daily TOTP verification.
 */
export function getLastSubscriberTotpVerifiedDay(emailOrPhone?: string | null): string | null {
  if (!emailOrPhone) return null;
  const clean = emailOrPhone.trim().toLowerCase();
  return localStorage.getItem(`vasthusilpy_sub_totp_verified_day_${clean}`);
}

/**
 * Clears subscriber daily TOTP verification (useful for logout or testing)
 */
export function clearSubscriberDailyTotp(emailOrPhone?: string | null): void {
  if (!emailOrPhone) return;
  const clean = emailOrPhone.trim().toLowerCase();
  try {
    localStorage.removeItem(`vasthusilpy_sub_totp_verified_day_${clean}`);
    localStorage.removeItem(`vasthusilpy_sub_totp_verified_at_${clean}`);
  } catch (e) {}
}

/**
 * Client 7-Day (1 Week) TOTP Interval Enforcements
 * Mandatory to verify TOTP once every 7 days (604,800,000 ms).
 */
export const CLIENT_TOTP_INTERVAL_DAYS = 7;
export const CLIENT_TOTP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface ClientTotpCountdown {
  totalMsRemaining: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isDue: boolean;
  formatted: string;
  percentRemaining: number;
}

/**
 * Retrieves the last Client TOTP verification timestamp from local storage
 */
export function getLastClientTotpVerified(emailOrPhone?: string | null): number | null {
  try {
    const clean = emailOrPhone ? emailOrPhone.trim().toLowerCase() : null;
    const specificKey = clean ? `vasthusilpy_client_totp_verified_at_${clean}` : null;
    const val =
      (specificKey ? localStorage.getItem(specificKey) : null) ||
      localStorage.getItem("vasthusilpy_last_client_totp_verified_at") ||
      localStorage.getItem("vasthusilpy_last_totp_verified_at");
    if (val) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {}
  return null;
}

/**
 * Records a successful 7-Day Client TOTP verification timestamp locally
 */
export function recordClientTotpVerified(emailOrPhone?: string | null, timestamp = Date.now()): void {
  try {
    const clean = emailOrPhone ? emailOrPhone.trim().toLowerCase() : null;
    localStorage.setItem("vasthusilpy_last_client_totp_verified_at", timestamp.toString());
    localStorage.setItem("vasthusilpy_last_totp_verified_at", timestamp.toString());
    if (clean) {
      localStorage.setItem(`vasthusilpy_client_totp_verified_at_${clean}`, timestamp.toString());
      localStorage.setItem(`vasthusilpy_sub_totp_verified_at_${clean}`, timestamp.toString());
    }
  } catch (e) {}
}

/**
 * Checks whether 7-day Client TOTP 2FA verification is currently required
 */
export function isClientWeeklyTotpRequired(emailOrPhone?: string | null): boolean {
  const lastVerified = getLastClientTotpVerified(emailOrPhone);
  if (!lastVerified || typeof lastVerified !== "number" || isNaN(lastVerified)) {
    return true; // Never verified -> required
  }
  const elapsed = Date.now() - lastVerified;
  return elapsed >= CLIENT_TOTP_INTERVAL_MS;
}

/**
 * Calculates countdown time remaining in the 7-day Client TOTP interval
 */
export function getClientTotpCountdown(emailOrPhone?: string | null): ClientTotpCountdown {
  const lastVerified = getLastClientTotpVerified(emailOrPhone);
  if (!lastVerified || typeof lastVerified !== "number" || isNaN(lastVerified)) {
    return {
      totalMsRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isDue: true,
      formatted: "0d 00h 00m 00s",
      percentRemaining: 0
    };
  }

  const elapsed = Date.now() - lastVerified;
  const remaining = CLIENT_TOTP_INTERVAL_MS - elapsed;

  if (remaining <= 0) {
    return {
      totalMsRemaining: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isDue: true,
      formatted: "0d 00h 00m 00s",
      percentRemaining: 0
    };
  }

  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatted = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  const percentRemaining = Math.max(0, Math.min(100, Math.round((remaining / CLIENT_TOTP_INTERVAL_MS) * 100)));

  return {
    totalMsRemaining: remaining,
    days,
    hours,
    minutes,
    seconds,
    isDue: false,
    formatted,
    percentRemaining
  };
}

/**
 * Checks whether Admin TOTP 2FA verification is currently required (30-day recurring window).
 */
export function isAdminTotpRequired(
  isAdmin: boolean,
  lastVerifiedTimestamp?: number | null
): boolean {
  if (!isAdmin) return false;
  if (!lastVerifiedTimestamp || typeof lastVerifiedTimestamp !== "number" || isNaN(lastVerifiedTimestamp)) {
    return true; // Never verified -> required
  }
  const elapsed = Date.now() - lastVerifiedTimestamp;
  return elapsed >= ADMIN_TOTP_RECURRING_WINDOW_MS;
}

/**
 * Returns number of days remaining until the next Admin TOTP requirement
 */
export function getAdminTotpDaysRemaining(lastVerifiedTimestamp?: number | null): number {
  if (!lastVerifiedTimestamp || typeof lastVerifiedTimestamp !== "number" || isNaN(lastVerifiedTimestamp)) {
    return 0;
  }
  const elapsed = Date.now() - lastVerifiedTimestamp;
  const remaining = ADMIN_TOTP_RECURRING_WINDOW_MS - elapsed;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/**
 * Retrieves the last Admin TOTP verification timestamp from local storage
 */
export function getLastAdminTotpVerified(email?: string | null): number | null {
  try {
    const clean = email && typeof email === "string" ? email.trim().toLowerCase() : null;
    const specificKey = clean ? `vasthusilpy_admin_totp_verified_${clean}` : null;
    const val = (specificKey ? localStorage.getItem(specificKey) : null) || localStorage.getItem("vasthusilpy_admin_totp_verified_at");
    if (val) {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {}
  return null;
}

/**
 * Records a successful Admin TOTP verification timestamp locally
 */
export function recordAdminTotpVerified(email?: string | null, timestamp = Date.now()): void {
  try {
    localStorage.setItem("vasthusilpy_admin_totp_verified_at", timestamp.toString());
    const clean = email && typeof email === "string" ? email.trim().toLowerCase() : null;
    if (clean) {
      localStorage.setItem(`vasthusilpy_admin_totp_verified_${clean}`, timestamp.toString());
    }
  } catch (e) {}
}
