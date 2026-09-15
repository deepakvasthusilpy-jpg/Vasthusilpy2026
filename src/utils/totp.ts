import QRCode from "qrcode";

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Converts a byte array to Base32 string
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
 * Decodes a Base32 string to Uint8Array
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
 * Generates a deterministic or random Base32 secret for a user
 */
export function getOrCreateTotpSecret(email?: string | null): string {
  const cleanEmail = (email || "default@vasthusilpy.local").trim().toLowerCase();
  const storageKey = `vasthusilpy_totp_secret_${cleanEmail}`;
  const existing = localStorage.getItem(storageKey);
  if (existing && existing.length >= 16) {
    return existing;
  }

  // Create deterministic seed from email + fixed salt
  const salt = "VASTHUSILPY_KERALASSERY_TOTP_KEY_2026_";
  const seedString = `${salt}_${cleanEmail}`;
  
  // Generate 20-byte pseudo-random deterministic buffer based on seed
  const buffer = new Uint8Array(20);
  let hash = 0x811c9dc5;
  for (let i = 0; i < seedString.length; i++) {
    hash ^= seedString.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  for (let i = 0; i < 20; i++) {
    hash = Math.imul(hash ^ (i * 31), 0x01000193);
    buffer[i] = (hash >>> (i % 4 * 8)) & 0xff;
  }

  const generatedSecret = bytesToBase32(buffer).slice(0, 32);
  localStorage.setItem(storageKey, generatedSecret);
  return generatedSecret;
}

/**
 * Generates a fresh random 160-bit Base32 secret
 */
export function generateRandomTotpSecret(): string {
  const randomBytes = new Uint8Array(20);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < 20; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToBase32(randomBytes).slice(0, 32);
}

/**
 * Formats a base32 secret into readable 4-character chunks
 * e.g., "JBSW Y3DP EHPK 3PXP"
 */
export function formatSecretFormatted(secret: string): string {
  const clean = secret.replace(/\s+/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}

/**
 * Builds the otpauth:// URI for Google Authenticator
 */
export function buildTotpUri(email?: string | null, secret = "", issuer = "Vasthusilpy"): string {
  const cleanEmail = (email || "user@vasthusilpy.local").trim().toLowerCase();
  const label = encodeURIComponent(`${issuer}:${cleanEmail}`);
  const cleanSecret = (secret || "").replace(/[\s-]/g, "").toUpperCase();
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${cleanSecret}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates QR Code data URL for the Google Authenticator app
 */
export async function generateTotpQrCode(email?: string | null, secret = "", issuer = "Vasthusilpy"): Promise<string> {
  const uri = buildTotpUri(email, secret, issuer);
  return await QRCode.toDataURL(uri, {
    width: 320,
    margin: 2,
    color: {
      dark: "#030712",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Computes the 6-digit TOTP code for a given timestamp and secret using Web Crypto HMAC-SHA1
 */
export async function computeTotpCode(secret: string, timestampMs = Date.now()): Promise<string> {
  const cleanSecret = (secret || "").replace(/[\s-]/g, "").toUpperCase();
  const keyBytes = base32ToBytes(cleanSecret);

  // Time step counter: 30 seconds
  const counter = Math.floor(timestampMs / 1000 / 30);

  // 8-byte big-endian counter buffer
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  // High 32 bits
  counterView.setUint32(0, Math.floor(counter / 0x100000000), false);
  // Low 32 bits
  counterView.setUint32(4, counter >>> 0, false);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, counterBuffer);
  const signatureBytes = new Uint8Array(signature);

  // Dynamic truncation
  const offset = signatureBytes[signatureBytes.length - 1] & 0x0f;
  const binary =
    ((signatureBytes[offset] & 0x7f) << 24) |
    ((signatureBytes[offset + 1] & 0xff) << 16) |
    ((signatureBytes[offset + 2] & 0xff) << 8) |
    (signatureBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a user-supplied 6-digit OTP code with clock-drift tolerance (±1 step = ±30s)
 */
export async function verifyTotpCode(
  secret: string,
  userCode?: string | null,
  windowTolerance = 1
): Promise<{ valid: boolean; delta: number }> {
  const cleanUserCode = (userCode || "").trim().replace(/\D/g, "");
  if (cleanUserCode.length !== 6) {
    return { valid: false, delta: 0 };
  }

  const now = Date.now();
  const stepMs = 30 * 1000;

  for (let delta = -windowTolerance; delta <= windowTolerance; delta++) {
    const checkTime = now + delta * stepMs;
    const expected = await computeTotpCode(secret, checkTime);
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

// 30 Days in Milliseconds: 30 * 24 * 60 * 60 * 1000 = 2,592,000,000 ms
export const ADMIN_TOTP_RECURRING_DAYS = 30;
export const ADMIN_TOTP_RECURRING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Checks whether Admin TOTP 2FA verification is currently required.
 * Admin TOTP is required for every login recurring with a gap of 30 days.
 */
export function isAdminTotpRequired(
  isAdmin: boolean,
  lastVerifiedTimestamp?: number | null
): boolean {
  if (!isAdmin) return false;
  if (!lastVerifiedTimestamp || typeof lastVerifiedTimestamp !== "number" || isNaN(lastVerifiedTimestamp)) {
    return true; // Never verified -> strictly required
  }
  const elapsed = Date.now() - lastVerifiedTimestamp;
  return elapsed >= ADMIN_TOTP_RECURRING_WINDOW_MS;
}

/**
 * Returns number of days remaining until the next 30-day Admin TOTP requirement
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
