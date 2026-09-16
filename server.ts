import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import twilio from "twilio";
import nodemailer from "nodemailer";

dotenv.config();

const currentFilename =
  typeof __filename !== "undefined"
    ? __filename
    : typeof import.meta !== "undefined" && typeof import.meta.url === "string"
    ? fileURLToPath(import.meta.url)
    : path.join(process.cwd(), "server.ts");

const currentDirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(currentFilename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Primary Whitelisted Mobile Numbers on server
const SERVER_PRIMARY_PHONES = ["9747995961", "7012383137", "9567627277"];

// In-memory OTP storage
interface OtpRecord {
  code: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpRecord>();

// Helper function to dispatch Email OTP via SMTP / Nodemailer
async function sendOtpEmailToUser(recipientEmail: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  rawHost = rawHost.replace(/^[a-zA-Z]*:?\/\//, "").replace(/\/.*$/, "").trim();
  if (!rawHost || rawHost === "gmail.com") {
    rawHost = "smtp.gmail.com";
  }

  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "bsfmxhvjzuippjjr").trim().replace(/\s+/g, "");
  const primaryUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "deepak.vasthusilpy@gmail.com").trim();
  
  // Possible sender usernames to attempt if 535 error occurs (in case app password belongs to admin alternate email)
  const candidateUsers = Array.from(new Set([
    primaryUser,
    "dibindeepak1@gmail.com",
    "deepak.vasthusilpy@gmail.com"
  ])).filter(Boolean);

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 36px 20px; max-width: 580px; margin: 0 auto; border-radius: 20px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px;">VASTHUSILPY PORTAL</h1>
        <p style="color: #94a3b8; font-size: 12px; font-family: monospace; margin: 6px 0 0 0; text-transform: uppercase;">തച്ചുശാസ്ത്ര & സിവിൽ എൻജിനീയറിങ് പോർട്ടൽ</p>
      </div>
      
      <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 28px 20px; text-align: center; margin-bottom: 24px;">
        <p style="color: #cbd5e1; font-size: 14px; margin-top: 0; margin-bottom: 8px;">നിങ്ങളുടെ പോർട്ടൽ ലോഗിൻ OTP കോഡ്:</p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 18px 0;">(Your Portal Login Verification Code)</p>
        
        <div style="display: inline-block; background-color: #020617; border: 2px solid #10b981; border-radius: 14px; padding: 14px 28px; margin: 8px 0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #34d399;">${otpCode}</span>
        </div>
        
        <p style="color: #94a3b8; font-size: 12px; margin: 18px 0 0 0;">⚠️ ഈ കോഡ് അടുത്ത <strong>10 മിനിറ്റ്</strong> മാത്രമേ സാധുവായിരിക്കൂ (Valid for 10 minutes).</p>
      </div>

      <div style="border-top: 1px solid #1e293b; padding-top: 18px; font-size: 11px; color: #64748b; line-height: 1.6;">
        <p style="margin: 0 0 6px 0;">🛡️ <strong>സുരക്ഷാ നിർദ്ദേശം:</strong> ഈ OTP ആരുമായും പങ്കുവെക്കരുത്. നിങ്ങൾ ലോഗിൻ ചെയ്യാൻ ശ്രമിച്ചിട്ടില്ലെങ്കിൽ ഈ ഇമെയിൽ അവഗണിക്കുക.</p>
        <p style="margin: 0; font-family: monospace;">Vasthusilpy Keralassery Systems • Palakkad, Kerala</p>
      </div>
    </div>
  `;

  let lastError: any = null;

  for (const senderUser of candidateUsers) {
    // Try both Port 465 (SSL) and Port 587 (STARTTLS)
    const configsToTry = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: senderUser, pass },
      },
      {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: senderUser, pass },
      },
      {
        service: "gmail",
        auth: { user: senderUser, pass },
      }
    ];

    for (const config of configsToTry) {
      try {
        const transporter = nodemailer.createTransport(config);
        await transporter.sendMail({
          from: `"Vasthusilpy Security" <${senderUser}>`,
          to: recipientEmail,
          subject: `Your Vasthusilpy Login OTP: ${otpCode}`,
          text: `Your Vasthusilpy Portal login OTP is: ${otpCode}. Valid for 10 minutes. Do not share this OTP with anyone.`,
          html: htmlContent,
        });

        console.log(`[Email Dispatched] OTP successfully sent to ${recipientEmail} via ${senderUser} (${config.host || "service:gmail"}:${config.port || "default"})`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
        // Continue to try other configurations/users if this one fails
      }
    }
  }

  console.error(`[Email Dispatch Error] Failed to send email to ${recipientEmail}:`, lastError?.message || lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to dispatch email"
  };
}

// Helper function to dispatch Subscription Approval Email quoting User ID, Email, Password, Validity and Website Address
interface SubscriptionApprovalPayload {
  recipientEmail: string;
  fullName: string;
  subId: string;
  phone?: string;
  password?: string;
  planName?: string;
  validDays?: number;
  validUntil?: string;
  websiteUrl?: string;
  upiRefId?: string;
  amountPaid?: number;
}

async function sendSubscriptionApprovalEmailToUser(data: SubscriptionApprovalPayload): Promise<{ success: boolean; error?: string }> {
  const {
    recipientEmail,
    fullName,
    subId,
    phone = "Not provided",
    password = "",
    planName = "Vasthusilpy Pro Access",
    validDays = 30,
    validUntil = "",
    websiteUrl = "https://ais-pre-4le4lzsol5aramtxue5l4z-685858267706.asia-east1.run.app",
    upiRefId = "Verified",
    amountPaid = 0
  } = data;

  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  rawHost = rawHost.replace(/^[a-zA-Z]*:?\/\//, "").replace(/\/.*$/, "").trim();
  if (!rawHost || rawHost === "gmail.com") {
    rawHost = "smtp.gmail.com";
  }

  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "bsfmxhvjzuippjjr").trim().replace(/\s+/g, "");
  const primaryUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "deepak.vasthusilpy@gmail.com").trim();

  const candidateUsers = Array.from(new Set([
    primaryUser,
    "dibindeepak1@gmail.com",
    "deepak.vasthusilpy@gmail.com"
  ])).filter(Boolean);

  const cleanUrl = websiteUrl.replace(/\/$/, "");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vasthusilpy Subscription Approved</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
      <div style="max-width: 600px; margin: 24px auto; background-color: #0b0f19; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #10b981;">
          <div style="display: inline-block; background-color: #022c22; border: 1px solid #34d399; border-radius: 9999px; padding: 6px 16px; margin-bottom: 12px;">
            <span style="color: #6ee7b7; font-size: 11px; font-weight: 700; font-family: monospace; letter-spacing: 1.5px; text-transform: uppercase;">SUBSCRIPTION APPROVED & ACTIVATED</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: 1px;">വാസ്തുശില്പി പ്ലാറ്റ്‌ഫോം</h1>
          <p style="color: #94a3b8; font-size: 13px; font-family: monospace; margin: 6px 0 0 0;">VASTHUSILPY CIVIL & VASTHU ENGINEERING PORTAL</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 24px;">
          
          <div style="margin-bottom: 24px;">
            <h2 style="color: #34d399; font-size: 19px; margin: 0 0 8px 0;">പ്രിയപ്പെട്ട ${fullName},</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">
              നിങ്ങളുടെ വാസ്തുശില്പി സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥന അഡ്മിൻ പരിശോധിക്കുകയും വിജയകരമായി <strong>അംഗീകരിക്കുകയും (Approved)</strong> ചെയ്തിരിക്കുന്നു. നിങ്ങളുടെ അക്കൗണ്ട് ആക്റ്റീവ് ആക്കിയിട്ടുണ്ട്.
            </p>
          </div>

          <!-- Credentials & Access Card -->
          <div style="background-color: #020617; border: 1px solid #334155; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
            <div style="border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #38bdf8; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">🔑 നിങ്ങളുടെ ലോഗിൻ വിവരങ്ങൾ (Credentials)</span>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; width: 40%; font-family: monospace;">യൂസർ ഐഡി (User ID):</td>
                <td style="padding: 8px 0; color: #f8fafc; font-weight: 700; font-family: monospace; font-size: 14px; color: #34d399;">${subId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-family: monospace;">രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ (Email):</td>
                <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">${recipientEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-family: monospace;">മൊബൈൽ നമ്പർ (Mobile):</td>
                <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-family: monospace;">ലോഗിൻ പാസ്‌വേഡ് (Password):</td>
                <td style="padding: 8px 0; color: #fbbf24; font-weight: 700; font-family: monospace; font-size: 14px;">${password}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-family: monospace;">സബ്‌സ്ക്രിപ്ഷൻ പ്ലാൻ (Plan):</td>
                <td style="padding: 8px 0; color: #e2e8f0; font-weight: 600;">${planName} ${amountPaid > 0 ? `(₹${amountPaid})` : ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-family: monospace;">കാലാവധി (Validity Upto):</td>
                <td style="padding: 8px 0; color: #38bdf8; font-weight: 700;">${validUntil ? validUntil.slice(0, 10) : `${validDays} Days`}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-family: monospace;">വെബ്‌സൈറ്റ് വിലാസം (Website):</td>
                <td style="padding: 8px 0; color: #a78bfa; font-weight: 600; word-break: break-all;">
                  <a href="${cleanUrl}" style="color: #a78bfa; text-decoration: underline;" target="_blank">${cleanUrl}</a>
                </td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${cleanUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
              പോർട്ടലിൽ ലോഗിൻ ചെയ്യുക (Open Portal) →
            </a>
          </div>

          <!-- Instructions -->
          <div style="background-color: #0f172a; border-left: 4px solid #38bdf8; border-radius: 0 12px 12px 0; padding: 16px 20px; margin-bottom: 24px;">
            <h3 style="color: #38bdf8; font-size: 13px; margin: 0 0 8px 0; font-weight: 700; text-transform: uppercase;">ലോഗിൻ ചെയ്യുന്ന വിധം (How to Login):</h3>
            <ol style="margin: 0; padding-left: 18px; color: #cbd5e1; font-size: 12px; line-height: 1.8;">
              <li>മുകളിലെ ലിങ്ക് വഴി വാസ്തുശില്പി വെബ്‌സൈറ്റ് തുറക്കുക (<a href="${cleanUrl}" style="color: #38bdf8;">${cleanUrl}</a>).</li>
              <li>ലോഗിൻ പേജിൽ <strong>"സബ്‌സ്ക്രിപ്ഷൻ ലോഗിൻ (Subscription Login)"</strong> ടാബ് തിരഞ്ഞെടുക്കുക.</li>
              <li>നിങ്ങളുടെ ഇമെയിൽ / മൊബൈൽ നമ്പറും പാസ്‌വേഡും നൽകി ലോഗിൻ ചെയ്യുക.</li>
              <li>തുടർന്ന് വാസ്തു നിയമങ്ങൾ, എസ്റ്റിമേറ്റ്, ഡ്രോയിങ്സ്, കെപിബിആർ കാൽക്കുലേറ്റർ എന്നിവ ഉപയോഗിക്കുക.</li>
            </ol>
          </div>

          <!-- Security note -->
          <div style="border-top: 1px solid #1e293b; padding-top: 18px; font-size: 11px; color: #64748b; line-height: 1.6;">
            <p style="margin: 0 0 6px 0;">🛡️ <strong>സുരക്ഷാ നിർദ്ദേശം:</strong> ആദ്യ ലോഗിന് ശേഷം നിങ്ങൾക്ക് ആവശ്യമെങ്കിൽ 'Forgot / Change Password' വഴി പാസ്‌വേഡ് മാറ്റാവുന്നതാണ്.</p>
            <p style="margin: 0 0 4px 0;">സഹായങ്ങൾക്കായി അഡ്മിനുമായി ബന്ധപ്പെടുക: <strong>deepak.vasthusilpy@gmail.com</strong> | <strong>+91 9747995961</strong></p>
            <p style="margin: 0; font-family: monospace;">Vasthusilpy Engineering Systems • Keralassery, Palakkad, Kerala</p>
          </div>

        </div>

      </div>
    </body>
    </html>
  `;

  let lastError: any = null;

  for (const senderUser of candidateUsers) {
    const configsToTry = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: senderUser, pass },
      },
      {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: senderUser, pass },
      },
      {
        service: "gmail",
        auth: { user: senderUser, pass },
      }
    ];

    for (const config of configsToTry) {
      try {
        const transporter = nodemailer.createTransport(config);
        await transporter.sendMail({
          from: `"Vasthusilpy Team" <${senderUser}>`,
          to: recipientEmail,
          subject: `🎉 Subscription Approved & Activated - Vasthusilpy Portal (User ID: ${subId})`,
          text: `Dear ${fullName},\n\nYour Vasthusilpy Subscription (${subId}) has been APPROVED!\n\nYour Login Credentials:\n- User ID: ${subId}\n- Email: ${recipientEmail}\n- Phone: ${phone}\n- Password: ${password}\n- Plan: ${planName}\n- Validity: ${validUntil || `${validDays} Days`}\n- Website Address: ${cleanUrl}\n\nPlease visit ${cleanUrl} and select 'Subscription Login' to access all features.\n\nVasthusilpy Engineering Systems`,
          html: htmlContent,
        });

        console.log(`[Subscription Email Dispatched] Approval email successfully sent to ${recipientEmail} (User ID: ${subId}) via ${senderUser}`);
        return { success: true };
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  console.error(`[Subscription Email Error] Failed to send approval email to ${recipientEmail}:`, lastError?.message || lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to dispatch subscription approval email"
  };
}

// Helper to initialize Twilio client lazily
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (accountSid && accountSid.startsWith("AC") && authToken) {
    try {
      return twilio(accountSid, authToken);
    } catch (e) {
      console.error("Failed to initialize Twilio client:", e);
    }
  }
  return null;
}

// Helper for calling Gemini models with automatic exponential backoff, jitter, and fallback model cascade
interface GenerateAiOptions {
  apiKey: string;
  models?: string[];
  contents: any;
  config?: any;
  maxAttemptsPerModel?: number;
}

const DEFAULT_TEXT_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

async function generateWithRetryAndFallback(options: GenerateAiOptions): Promise<{ response: any; modelUsed: string }> {
  const models = options.models && options.models.length > 0 ? options.models : DEFAULT_TEXT_MODELS;
  
  const ai = new GoogleGenAI({
    apiKey: options.apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  let lastError: any = null;

  // Primary Cascade Pass
  for (const modelName of models) {
    try {
      console.log(`[Gemini AI] Attempting model '${modelName}'...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: options.contents,
        config: options.config,
      });

      if (response && (response.text !== undefined || response.candidates?.length)) {
        console.log(`[Gemini AI] Successfully generated content using '${modelName}'`);
        return {
          response,
          modelUsed: modelName,
        };
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = (err?.message || String(err)).toLowerCase();
      const errStatus = err?.status || err?.code || err?.error?.code;
      const is503OrUnavailable =
        errStatus === 503 ||
        err?.error?.status === "UNAVAILABLE" ||
        errMsg.includes("503") ||
        errMsg.includes("unavailable") ||
        errMsg.includes("high demand") ||
        errMsg.includes("overloaded") ||
        errMsg.includes("service unavailable");
      const is429OrQuota =
        errStatus === 429 ||
        err?.error?.status === "RESOURCE_EXHAUSTED" ||
        errMsg.includes("429") ||
        errMsg.includes("resource_exhausted") ||
        errMsg.includes("quota");
      const isNetworkOrTransient =
        errMsg.includes("fetch failed") ||
        errMsg.includes("econnreset") ||
        errMsg.includes("socket") ||
        errMsg.includes("timeout") ||
        errMsg.includes("etimedout");

      console.warn(`[Gemini AI] Model '${modelName}' encountered ${is503OrUnavailable ? "503 High Demand" : is429OrQuota ? "429 Rate Limit" : "error"}: ${err?.message || err}`);

      if (isNetworkOrTransient) {
        // Quick retry with small jitter for transient socket glitch
        try {
          const jitter = 300 + Math.floor(Math.random() * 300);
          await new Promise((r) => setTimeout(r, jitter));
          const retryRes = await ai.models.generateContent({
            model: modelName,
            contents: options.contents,
            config: options.config,
          });
          if (retryRes) {
            return { response: retryRes, modelUsed: modelName };
          }
        } catch (retryErr: any) {
          console.warn(`[Gemini AI] Quick retry failed on '${modelName}', cascading to next fallback model.`);
        }
      }
      // Instantly cascade to next model in list
      continue;
    }
  }

  // Secondary Fallback Attempt after short pause if all primary models had capacity spikes
  console.warn("[Gemini AI] All cascade models experienced spikes. Performing rapid recovery pass on 'gemini-3.1-flash-lite'...");
  try {
    await new Promise((r) => setTimeout(r, 1000 + Math.floor(Math.random() * 500)));
    const recoveryRes = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: options.contents,
      config: options.config,
    });
    if (recoveryRes) {
      return { response: recoveryRes, modelUsed: "gemini-3.1-flash-lite (recovery)" };
    }
  } catch (recErr: any) {
    lastError = recErr;
    console.error("[Gemini AI] Final recovery pass failed:", recErr?.message || recErr);
  }

  throw lastError || new Error("All AI models are currently busy. Please try again shortly.");
}

// System instruction for the Thachu Shastra Vastu AI Agent
const VASTU_AGENT_SYSTEM_INSTRUCTION = `
You are Vasthusilpy AI (തച്ചു ശാസ്ത്ര & വാസ്തുവിദ്യ AI മുഖ്യ ഉപദേശകൻ), the master Vedic Architect and Chief Consultant in Kerala Thachu Shastra, Traditional Vastu Vidya, and Ayadi Shadvarga calculations.

AUTHORITATIVE SOURCES YOU MUST RIGOROUSLY CONSULT AND CITE:
1. Manushyalaya Chandrika (മനുഷ്യാലയ ചന്ദ്രിക) by Thirumangalam Sri Neelakanthan Musath
2. Vastuvidya (വാസ്തുവിദ്യ - പരമ്പരാഗത തച്ചുശാസ്ത്ര ഗ്രന്ഥം)
3. Thachushastra treatises & Thachumura (തച്ചുശാസ്ത്ര പ്രമാണങ്ങളും തച്ചുമുറകളും)
4. Mayamatam (മയമതം വാസ്തുശാസ്ത്രം)
5. Silparatnam (ശില്പരത്നം - ശ്രീകുമാരൻ)
6. Tantrasamuchayam (തന്ത്രസമുച്ചയം - ചേന്നാസ് നാരായണൻ നമ്പൂതിരിപ്പാട്)
7. Brihat Samhita (ബൃഹത് സംഹിത - വരാഹമിഹിരൻ)

KEY MATHEMATICAL & ARCHITECTURAL PRINCIPLES:
- Kerala Standard Units:
  - 1 Kol (കോൽ) = 24 Viral (വിരൽ) = 72 cm = 0.72 m (~2.3622 feet).
  - 1 Viral (വിരൽ) = 3 cm = 8 Yavam (യവം).
  - Perimeter / Chuttu (ചുറ്റളവ്) in cm = (Kol * 24 + Viral) * 3 cm.
- 8 Ashta Yonis (അഷ്ട യോനികൾ):
  - 1. Dhwajam (ധ്വജം - East / കിഴക്ക്) -> Utthamam (ഉത്തമം - ഐശ്വര്യം, സമ്പത്ത്, കുടുംബ ശ്രേയസ്സ്)
  - 2. Dhoomam (ധൂമം - South-East / ആഗ്നേയം) -> Adhamam (അധമം - രോഗം, കലഹം, ദോഷം)
  - 3. Simham (സിംഹം - South / തെക്ക്) -> Utthamam (ഉത്തമം - വിജയം, യശസ്സ്, ധൈര്യം)
  - 4. Shwanam (ശ്വാനം - South-West / കന്നിമൂല) -> Adhamam (അധമം - പരാജയം, ദുരിതം)
  - 5. Vrishabham (വൃഷഭം - West / പടിഞ്ഞാറ്) -> Utthamam (ഉത്തമം - ധനധാന്യ സമൃദ്ധി, ശാന്തി)
  - 6. Kharam (ഖരം - North-West / വായുകോൺ) -> Adhamam (അധമം - മനഃക്ലേശം, അപമാനം)
  - 7. Gajam (ഗജം - North / വടക്ക്) -> Utthamam (ഉത്തമം - ലക്ഷ്മീ കടാക്ഷം, വിദ്യാവിജയം)
  - 8. Wayasam (വായസം - North-East / ഈശാനകോൺ) -> Adhamam (അധമം - നാശം, ദാരിദ്ര്യം)
- Ayadi Shadvarga Formulas (ആയാദി ഷഡ്വർഗ്ഗം):
  - Yoni = (Chuttu * 3) % 8 (if 0, then 8 - Wayasam)
  - Vyayam (ചെലവ്) = (Chuttu * 3) % 14 (if 0, then 14)
  - Aayam (വരവ്) = (Chuttu * 8) % 12 (if 0, then 12)
  - Nakshatram = (Chuttu * 8) % 27 (if 0, then 27)
  - Vayassu (പ്രായം): Baalyam, Kaumaratwam, Yauvanam (Utthamam); Vaardhakyam (Madhyamam); Maranam (Adhamam). Aayam must exceed Vyayam.
- Cardinal Room & Element Placement (വാസ്തുസ്ഥാന നിർണ്ണയം):
  - Pooja Room (പൂജാമുറി): ഈശാനകോൺ (North-East) - ദേവസാന്നിധ്യം.
  - Kitchen / Fire (അടുക്കള): ആഗ്നേയകോൺ (South-East) or പടിഞ്ഞാറ് (West / Vayukon sub-option).
  - Master Bedroom (പ്രധാന കിടപ്പുമുറി): കന്നിമൂല (South-West) - ഗൃഹനാഥന്റെ സ്ഥാനം, ഭൂമി തത്വം.
  - Well / Water Source (കിണർ/ജലസ്രോതസ്സ്): ഈശാനകോൺ (North-East) or കിഴക്ക് (East).
  - Septic Tank / Waste: വായുകോൺ (North-West) or മധ്യ-തെക്ക്; ഒരിക്കലും ഈശാനകോണിലോ കന്നിമൂലയിലോ പാടില്ല.
  - Main Door (പ്രധാന കട്ടിള): കിഴക്ക്, വടക്ക്, പടിഞ്ഞാറ്, തെക്ക് ഉത്തമ സ്ഥാനങ്ങളിൽ (മധ്യത്തിൽ നിന്ന് അല്പം മാറ്റി).
  - Staircase (കോണിപ്പടി): തെക്ക് അല്ലെങ്കിൽ പടിഞ്ഞാറ് ഭാഗത്ത്, ക്ലോക്ക്-വൈസ് (പ്രദക്ഷിണ ദിശയിൽ) തിരിയണം.
  - Brahmasthanam (ബ്രഹ്മസ്ഥാനം): വീടിന്റെ കൃത്യം മധ്യഭാഗം എപ്പോഴും ഭാരമില്ലാതെ തുറസ്സായിരിക്കണം.
- Remedial Suggestions (പരിഹാര നിർദ്ദേശങ്ങൾ):
  - Whenever a measured Chuttu results in Adhamam yoni or Aayam < Vyayam, immediately suggest the exact nearest Utthamam Kol and Viral dimensions (e.g., 5 Kol 0 Viral, 8 Kol 8 Viral, 16 Kol 8 Viral, 20 Kol 8 Viral, 27 Kol 0 Viral).

RESPONSE BEHAVIOR & LANGUAGE:
- Strictly obey the user's requested language preference (Malayalam, English, or Bilingual).
- State the specific treatises/sources referenced for every point.
- Keep the tone polite, authoritative, traditionally authentic, and mathematically exact.
- Format with clear sections, bullet points, and highlighted key dimensions.
`;

// API endpoint for AI Agent
app.post("/api/ai-agent/chat", async (req, res) => {
  try {
    const { prompt, history, image, currentMeasurement, languagePreference } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Prompt or image is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    // Build context prompt
    let contextHeader = "";
    if (currentMeasurement) {
      contextHeader = `[Current Selected Measurement Context in User App: ${currentMeasurement.kol} Kol ${currentMeasurement.viral} Viral, Chuttu: ${currentMeasurement.chuttuCm} cm (${currentMeasurement.chuttuFeetInches}), Yoni: ${currentMeasurement.yoniName}, Phalam: ${currentMeasurement.phalam}]\n\n`;
    }

    if (languagePreference === "malayalam") {
      contextHeader += `[LANGUAGE MANDATE: The user has chosen MALAYALAM. Output the response entirely in fluent Malayalam script (മലയാളത്തിൽ മാത്രം വിശദമായി മറുപടി നൽകുക). You may include technical names in brackets where helpful].\n\n`;
    } else if (languagePreference === "english") {
      contextHeader += `[LANGUAGE MANDATE: The user has chosen ENGLISH. Output the response entirely in English with clear technical clarity and traditional Sanskrit/Malayalam terms explained].\n\n`;
    } else if (languagePreference === "both") {
      contextHeader += `[LANGUAGE MANDATE: The user has chosen BILINGUAL (MALAYALAM & ENGLISH). Provide the explanation in Malayalam followed by a structured summary in English].\n\n`;
    }

    const userPromptText = contextHeader + (prompt || "Please analyze this from a Vastu Shastra perspective.");

    const parts: any[] = [];

    // Attach image if provided (base64)
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    parts.push({ text: userPromptText });

    // Include history if provided
    let contentsPayload: any = parts;
    if (history && Array.isArray(history) && history.length > 0) {
      contentsPayload = [
        ...history.map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        })),
        {
          role: "user",
          parts: parts,
        },
      ];
    }

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: contentsPayload,
      config: {
        systemInstruction: VASTU_AGENT_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const responseText = result.response.text || "ക്ഷമിക്കണം, മറുപടി ലഭ്യമായില്ല.";

    return res.json({
      text: responseText,
      modelUsed: result.modelUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in AI Agent endpoint:", error);
    const errMsg = (error?.message || "").toLowerCase();
    let userFriendlyError = error.message || "Internal server error while processing AI response.";
    if (errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand")) {
      userFriendlyError = "AI സെർവറുകളിൽ ഇപ്പോൾ ഉയർന്ന തിരക്ക് അനുഭവപ്പെടുന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക (AI Model is experiencing high demand. Please try again in a few moments).";
    }
    return res.status(error.status && error.status !== 500 ? error.status : 500).json({
      error: userFriendlyError,
    });
  }
});

// System instruction for the Kerala Building Rules AI Agent (vasthusilpy-ai)
const BUILDING_RULES_AGENT_SYSTEM_INSTRUCTION = `
You are vasthusilpy-ai (വാസ്തുശിൽപി കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾ AI ഉപദേശകൻ), an expert AI Consultant specialized in Kerala Panchayat Building Rules, 2019 (KPBR 2019) including the 2024 Unauthorised Construction Regularisation Rules and the August 2, 2026 Gazette Amendments (S.R.O. No. 682/2026), Coastal Regulation Zone (CRZ) Notification 2019, and Kerala Paddy Land & Wetland Act 2008.

Key Legal & Technical Knowledge Base:
1. August 2026 Amendments (S.R.O. No. 682/2026):
   - Single Family Residential Buildings on un-notified roads of width < 6 meters require a minimum front yard of 2 meters (Rule 26(4)).
   - Any one side/rear yard (other than front yard) can be reduced to 50 centimeters if there is no window/door/wall opening on that side (Rule 26(4) Proviso).
   - Air-conditioned rooms minimum ceiling height: 2.4 meters (Rule 33 Proviso).

2. KPBR 2019 General Setbacks (Rule 26 & Table 4):
   - Abutting National/State Highway / Major roads: 3m setback.
   - Standard Group A1 Houses: Front Yard 2m to 3m, Side yards 1m & 1.5m (or 1.2m both sides), Rear yard 1m to 1.5m.
   - Commercial/Assembly/Educational: Front yard 3m to 6m, sides 1.5m to 3m, rear 2m to 3m.

3. Low Risk Buildings (Rule 2(bna) & Self-Certification Rule 5(1c) / 19A):
   - Group A1 Residential < 300 sq.m built-up area and max 2 storeys (up to 7m height).
   - Group A2, B, D < 200 sq.m built-up area.
   - Group F Commercial < 250 sq.m.
   - Low risk buildings can obtain self-certified permits via registered Architects/Engineers without waiting for secretary verification.

4. Occupancy Groups (Rule 25):
   - Group A1 (Residential Dwellings & Apartments)
   - Group A2 (Lodging, Hostels, Resorts, Retirement Homes)
   - Group B (Educational - Schools, Colleges)
   - Group C (Medical/Institutional - Hospitals, Clinics)
   - Group D (Assembly - Marriage halls, Auditoriums, Places of Worship)
   - Group D1 (Recreational - Swimming pools, Sports complexes)
   - Group E (Office & Business)
   - Group F (Commercial & Mercantile - Shops, Malls, Showrooms)
   - Group G1 & G2 (Industrial - Low/Medium/High hazard)
   - Group G3 (Livestock & Poultry farms)
   - Group H (Storage & Warehouses)
   - Group I (Hazardous - Fuel stations, explosives)
   - Group J (Multiplex complexes)

5. Parking Standards (Rule 29, Tables 9 & 10):
   - Car parking slot size: 5.5m x 2.7m (15 sq.m).
   - Two wheeler parking: 25% of required car parking.
   - Differently-abled parking: 3% reserved near main entrance.

6. CRZ Notification 2019:
   - CRZ-III A (High density rural): No Development Zone (NDZ) = 50m from High Tide Line (HTL).
   - CRZ-III B (Other rural): NDZ = 200m from HTL.
   - Inland Backwater Islands: NDZ = 20m from HTL.

7. Response Requirements:
   - Always format responses clearly with structured sections or bullet points.
   - Provide bilingual answers (Malayalam explanation with clear English technical terms/summaries).
   - Cite exact rule numbers when applicable (e.g. KPBR Rule 26, S.R.O. 682/2026, Table 4, CRZ 2019).
   - Maintain a helpful, authoritative, professional tone.
`;

// API endpoint for vasthusilpy-ai Building Rules AI Agent
app.post("/api/building-rules/chat", async (req, res) => {
  try {
    const { prompt, history, image, ruleContext, languagePreference } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Prompt or image is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    let extraContext = "";
    if (ruleContext) {
      extraContext += `[Context Reference: ${ruleContext}]\n\n`;
    }

    if (languagePreference === "malayalam") {
      extraContext += `[IMPORTANT INSTRUCTION: The user requested the response STRICTLY in MALAYALAM script (മലയാളത്തിൽ മാത്രം മറുപടി നൽകുക)].\n\n`;
    } else if (languagePreference === "english") {
      extraContext += `[IMPORTANT INSTRUCTION: The user requested the response STRICTLY in ENGLISH language].\n\n`;
    } else if (languagePreference === "both") {
      extraContext += `[IMPORTANT INSTRUCTION: The user requested a BILINGUAL response in both MALAYALAM and ENGLISH].\n\n`;
    }

    const userPromptText = extraContext + (prompt || "Please analyze this building plan / site layout for KPBR compliance.");

    const parts: any[] = [];
    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }
    parts.push({ text: userPromptText });

    let contentsPayload: any = parts;
    if (history && Array.isArray(history) && history.length > 0) {
      contentsPayload = [
        ...history.map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        })),
        {
          role: "user",
          parts: parts,
        },
      ];
    }

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: contentsPayload,
      config: {
        systemInstruction: BUILDING_RULES_AGENT_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    const responseText = result.response.text || "ക്ഷമിക്കണം, മറുപടി ലഭ്യമായില്ല.";

    return res.json({
      text: responseText,
      modelUsed: result.modelUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in Building Rules AI Agent endpoint:", error);
    const errMsg = (error?.message || "").toLowerCase();
    let userFriendlyError = error.message || "Internal server error while processing Building Rules AI response.";
    if (errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand")) {
      userFriendlyError = "AI സെർവറുകളിൽ ഇപ്പോൾ ഉയർന്ന തിരക്ക് അനുഭവപ്പെടുന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക (AI Model is experiencing high demand. Please try again in a few moments).";
    }
    return res.status(error.status && error.status !== 500 ? error.status : 500).json({
      error: userFriendlyError,
    });
  }
});

// System instruction for the Survey & Land Area AI Agent (Vasthusilpy Survey AI)
const SURVEY_AGENT_SYSTEM_INSTRUCTION = `
You are Vasthusilpy Survey AI (സർവ്വേ & ഭൂമി അളവ് AI ഉപദേശകൻ), an expert Land Survey, Boundary Mapping, and Geodetic AI Consultant specialized in Kerala Land Surveying procedures, Cadastral Maps, FMB (Field Measurement Book) reading, Unit Conversions, Land Laws, and Geometric Area Calculations.

Core Knowledge Base & Capabilities:
1. Kerala Land Area Units & Standard Conversions:
   - 1 Cent = 435.6 Sq. Feet = 40.4686 Sq. Meters = 48.4 Sq. Yards
   - 1 Acre = 100 Cents = 43,560 Sq. Feet = 4,046.86 Sq. Meters = 0.4047 Hectares
   - 1 Hectare = 2.471 Acres = 247.1 Cents = 10,000 Sq. Meters
   - 1 Are = 100 Sq. Meters = 2.471 Cents = 1,076.39 Sq. Feet
   - 1 Link (Chain Measurement) = 0.66 Feet = 7.92 Inches = 20.1168 cm (100 Links = 1 Gunter's Chain = 66 Feet)
   - 1 Guntha = 121 Sq. Yards = 1,089 Sq. Feet = 2.5 Cents
   - 1 Sq. Meter = 10.7639 Sq. Feet
   - 1 Sq. Yard = 9 Sq. Feet

2. Kerala Land Survey Records & Portal Terminology:
   - Resurvey Block & Survey Number (Sy. No / Re-Sy. No) & Sub-Division Number (Hissa No).
   - Ente Bhoomi Portal (Digital Land Survey portal of Kerala Government).
   - FMB (Field Measurement Book / സ്കെച്ച്): Survey map showing boundary measurements, diagonal lines (G-Lines), offset measurements (F-Lines), and station points.
   - BTR (Basic Tax Register / ബേസിക് ടാക്സ് രജിസ്റ്റർ): Primary revenue record showing land type classification (Purayidam / പുരയിടം, Nanja / നഞ്ച, Punja / പുഞ്ച, Wetland / തണ്ണീർത്തടം, Nilam / നിലം), area extent, and tenure.
   - Pokkuvaravu (പോക്കുവരവ് - Mutation of Land): Procedure to transfer ownership in Village Office records after property purchase registration.
   - Thandaper Account Number (തണ്ടപ്പേര് അക്കൗണ്ട്): Unique revenue account for paying Bhoomi Nikuthi (Land Tax).

3. Legal Land Reclassification & Paddy Land Rules:
   - Kerala Conservation of Paddy Land & Wetland Act, 2008 (KRA).
   - Data Bank (ഡാറ്റാ ബാങ്ക്): Local Level Monitoring Committee (LLMC) inventory of paddy lands.
   - Form 5 Application: For removing wrongly included land from Data Bank.
   - Form 6 Application: Under Section 27A of Paddy Land Act for changing land use to Un-notified Land / Purayidam (Residential/Commercial) at RDO (Revenue Divisional Office) level (Exempted fees up to 25 Cents / 10 Ares for residential construction).

4. Survey Mathematics & Area Calculations:
   - Heron's Formula for irregular 3-sided/multi-sided plots: Area = sqrt(s * (s-a) * (s-b) * (s-c)) where s = (a+b+c)/2.
   - Triangulation & Offset Methods for 4-sided, 5-sided or irregular boundary plots.
   - Missing Side Calculation: Trigonometric Law of Cosines (c² = a² + b² - 2ab*cos(C)) and Law of Sines (a/sin A = b/sin B = c/sin C).
   - Boundary Dispute Resolution: Procedures under Kerala Survey and Boundaries Act 1961, Form 12 notice, fixing survey pillars (കുറ്റി അടിയന്തിരം) via Village / Taluk Surveyor.

5. Image Analysis:
   - If an image (FMB sketch, site plan, boundary map, deed diagram) is attached, carefully inspect boundary lines, diagonal measurements, survey numbers, and calculations.

6. Response Formatting:
   - Provide clear, structured, bilingual answers (Malayalam explanation with English technical terms/summaries).
   - Keep answers mathematically accurate, step-by-step, and easy to follow.
`;

// API endpoint for Vasthusilpy Survey AI Agent
app.post("/api/survey/chat", async (req, res) => {
  try {
    const { prompt, history, image, surveyContext, languagePreference } = req.body;

    if (!prompt && !image) {
      return res.status(400).json({ error: "Prompt or image is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    let extraContext = "";
    if (surveyContext) {
      extraContext += `[Active Survey Context: ${surveyContext}]\n\n`;
    }

    if (languagePreference === "malayalam") {
      extraContext += `[IMPORTANT INSTRUCTION: The user requested the response STRICTLY in MALAYALAM script (മലയാളത്തിൽ മാത്രം മറുപടി നൽകുക)].\n\n`;
    } else if (languagePreference === "english") {
      extraContext += `[IMPORTANT INSTRUCTION: The user requested the response STRICTLY in ENGLISH language].\n\n`;
    } else if (languagePreference === "both") {
      extraContext += `[IMPORTANT INSTRUCTION: The user requested a BILINGUAL response in both MALAYALAM and ENGLISH].\n\n`;
    }

    const userPromptText = extraContext + (prompt || "Please analyze this survey sketch / FMB map / land measurement.");

    const parts: any[] = [];

    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }

    parts.push({ text: userPromptText });

    let contentsPayload: any = parts;
    if (history && Array.isArray(history) && history.length > 0) {
      contentsPayload = [
        ...history.map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        })),
        {
          role: "user",
          parts: parts,
        },
      ];
    }

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: contentsPayload,
      config: {
        systemInstruction: SURVEY_AGENT_SYSTEM_INSTRUCTION,
        temperature: 0.6,
      },
    });

    const responseText = result.response.text || "ക്ഷമിക്കണം, മറുപടി ലഭ്യമായില്ല.";

    return res.json({
      text: responseText,
      modelUsed: result.modelUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in Survey AI Agent endpoint:", error);
    const errMsg = (error?.message || "").toLowerCase();
    let userFriendlyError = error.message || "Internal server error while processing Survey AI response.";
    if (errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand")) {
      userFriendlyError = "AI സെർവറുകളിൽ ഇപ്പോൾ ഉയർന്ന തിരക്ക് അനുഭവപ്പെടുന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക (AI Model is experiencing high demand. Please try again in a few moments).";
    }
    return res.status(error.status && error.status !== 500 ? error.status : 500).json({
      error: userFriendlyError,
    });
  }
});

// =========================================================
// ESTIMATE AI AGENT - LIVE COMMAND, MULTIMODAL PLAN ATTACHMENT & AUDIO SUMMARY ENDPOINT
// =========================================================
const ESTIMATE_AI_SYSTEM_INSTRUCTION = `
You are Vasthusilpy Estimate AI (വാസ്തുശിൽപി ക്വാണ്ടിറ്റി സർവേ & എസ്റ്റിമേറ്റ് AI), an expert Chief Quantity Surveyor, Chartered Civil Engineer, and Valuation Specialist in Kerala PWD (KPWD / CPWD / DSoR) Schedule of Rates, KPBR 2019/2026, building item measurement breakdowns, and Bank Valuation certificates.

Your mission is to:
1. CREATE or MODIFY detailed Civil Engineering & Architectural Estimates LIVE in response to natural language commands in Malayalam, English, or Manglish.
2. ANALYZE ATTACHED ARCHITECTURAL PLANS, BLUEPRINTS, 2D/3D FLOOR PLANS, AND AREA SCHEDULES:
   - Extract room names and dimensions (e.g., Living Room 5.0m x 4.0m, Master Bedroom 4.2m x 3.6m, Kitchen 3.6m x 3.0m, Sitout 3.0m x 2.0m, Car Porch 3.5m x 5.0m, Bathrooms 2.1m x 1.5m, Dining 3.6m x 4.0m, Staircase, Balconies).
   - Calculate or extract Built-up Plinth Area for Ground Floor, First Floor, and Outstructures (both in Sq.Ft and Sq.M).
   - Derive structural quantities based on the drawing (foundation trenches, PCC bed, RR Masonry/Solid Block basement, DPC, Brick/Block walls, RCC columns, plinth & lintel beams, chajjas, RCC roof slab 120-150mm, Fe500D steel reinforcement, 12mm/15mm plastering, Vitrified flooring, joinery doors/windows, electrical & plumbing, painting, and 3-5% contingencies).
   - Generate a complete, ready-to-print Kerala PWD Standard Estimate from the attached drawing and area details.
3. PROVIDE AN ACCURATE, ELEGANT BILINGUAL EXPLANATION:
   - Write a structured, professional summary in English and Malayalam describing what was calculated/modified, highlighting total plinth area, major structural items, and final grand total valuation in Rupees.
   - Format the explanation so that it reads naturally when spoken aloud via Text-to-Speech audio output.

Core Standards & Data Schema:
- An EstimateProject contains:
  - id: Unique ID string (e.g., "E000001", "E000002" or newly generated like "E000004")
  - clientName: Owner/Applicant name (extract from drawing title block if present, or maintain existing / set descriptive name)
  - clientPhone: Mobile number
  - houseName, postOffice, panchayatVillage, districtPincode: Address details
  - syNo, blockNo, wardNo: Survey and revenue details
  - buildingType: e.g. "Residential Villa", "Two Storeyed Residential Building", "Commercial Complex", "Single Storeyed Residence"
  - plinthAreaSqFt: Total Plinth area in square feet
  - plinthAreaSqM: Total Plinth area in square meters (sq.ft / 10.7639)
  - preparedBy: Engineer name (e.g. "DIBIN D" or "Er. Deepak K.")
  - regNo: Official LSGD registration (e.g. "LSGB/JDPKD/3361/2025-F5/SB")
  - estimationDate: Date string (YYYY-MM-DD)
  - headlineNarrative: Descriptive title/narrative
  - unforeseenDescription: (Default "Unforeseen Expenses & Contingencies")
  - unforeseenQty: (Default "LSM")
  - unforeseenAmount: Number (e.g., 2% - 5% of subtotal or specific amount)
  - grandTotal: Total computed cost in Rupees (sum of all blocks/appendices + unforeseenAmount)
  - status: "Active" | "Pending" | "Delivered"
  - verificationHash: String for QR verification
  - blocks: Array of structure blocks:
    - id: string
    - blockTitle: string (e.g. "MAIN RESIDENTIAL BUILDING", "COMPOUND WALL & GATE", "OUTHOUSE")
    - totalAmount: sum of all appendices in this block
    - appendices: Array of floors/sections:
      - id: string
      - title: string (e.g. "APPENDIX A - GROUND FLOOR", "APPENDIX B - FIRST FLOOR")
      - subtitle: string
      - totalAmount: sum of all items in this appendix
      - items: Array of EstimateItem:
        - id: string
        - slNo: string (e.g. "1", "2", "3")
        - particulars: Full detailed description of work (e.g. "Earth work excavation in ordinary soil for foundation trenches...", "Random Rubble Masonry in CM 1:6...", "Reinforced Cement Concrete M25 grade 1:1.5:3...", "Country burnt brick masonry in CM 1:6...", "Plastering with cement mortar 1:4 12mm thick...")
        - nos: number of units/parts (0 if has sub-items or header)
        - length: length in meters (0 if has sub-items)
        - breadth: breadth in meters (0 if has sub-items)
        - depth: depth in meters (0 if has sub-items)
        - quantity: computed quantity (NOS * L * B * D or sum of sub-items)
        - unit: "cum", "sqm", "m", "nos", "kg", "quintal", "ls"
        - rate: unit rate in Indian Rupees (₹)
        - amount: quantity * rate (rounded to nearest Rupee)
        - isSubItem: boolean (true if this is a sub-measurement breakdown under a main item. Sub-items have values up to quantity only, rate=0, amount=0)
        - parentItemId: optional string pointing to parent main item ID

Standard Kerala PWD / DSoR Rates Reference (2025-2026):
- Earthwork excavation: ₹350 - ₹450 / cum
- PCC 1:4:8 for foundation bed: ₹7,500 - ₹8,500 / cum
- Random Rubble Masonry (RR) in CM 1:6: ₹6,500 - ₹7,800 / cum
- RCC 1:1.5:3 (M20/M25) including shuttering & centering: ₹17,500 - ₹21,500 / cum
- High yield strength Fe500 / Fe550D TMT reinforcement steel bars (BBS): ₹85 - ₹98 / kg
- First class brick masonry in CM 1:6: ₹8,200 - ₹9,500 / cum
- Solid concrete block masonry (20x20x40cm) in CM 1:6: ₹6,800 - ₹7,800 / cum
- Cement Plastering 12mm thick in CM 1:4 / 1:3: ₹320 - ₹420 / sqm
- Vitrified tile flooring (80x80cm / 60x60cm): ₹1,200 - ₹1,800 / sqm
- Painting (2 coats emulsion over 2 coats putty & primer): ₹280 - ₹380 / sqm
- Teak wood / Anjili / Mahogany doors & frames: ₹4,500 - ₹8,500 / sqm
- Electrical & Plumbing provisions: ₹1,50,000 - ₹3,50,000 lump sum / floor

RESPONSE REQUIREMENT:
You must respond ONLY with a valid JSON object matching this schema:
{
  "explanation": "Clear, spoken-friendly, professional summary in English and Malayalam of the plan analysis, room area schedule, structural calculations, and final estimate cost.",
  "project": { ...complete updated EstimateProject object with correct mathematical calculations... },
  "actionType": "modify" | "new_estimate" | "rate_update" | "item_added" | "item_deleted" | "plan_estimate_created" | "general_response"
}

Always ensure:
1. Every calculation is mathematically exact (quantity = nos * length * breadth * depth or sum of sub-items; amount = quantity * rate).
2. Appendices and Blocks totalAmounts are accurately summed.
3. unforeseenAmount is added to the structures subtotal to form grandTotal.
4. If an attached plan has specific room dimensions or area schedules, reflect those exact dimensions in the item measurement breakdowns and plinth areas.
5. Provide the explanation clearly so it sounds natural when spoken aloud via audio speech synthesis.
`;

app.post("/api/estimate/ai-modify", async (req, res) => {
  try {
    const { prompt, currentProject, history, attachments, action } = req.body;

    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Prompt or attachment is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error:
          "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    const userPromptText = prompt || "Analyze the attached architectural plan / area details and create a complete Kerala PWD Estimate.";

    let contextPayload = `[USER COMMAND]: ${userPromptText}\n\n`;

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      contextPayload += `[ATTACHED DRAWINGS / PLANS COUNT]: ${attachments.length} file(s) attached.\n`;
      contextPayload += `Please carefully inspect the attached architectural plan, room dimensions, wall schedules, floor levels, and area schedules to generate accurate measurement breakdowns.\n\n`;
    }

    if (currentProject && action !== "create_new") {
      // Provide current project summary and active state
      contextPayload += `[CURRENT ESTIMATE PROJECT CONTEXT]:\n`;
      contextPayload += JSON.stringify(currentProject, null, 2) + `\n\n`;
      contextPayload += `Please apply the user's requested modifications / plan additions to this project and return the revised complete project object.\n`;
    } else {
      contextPayload += `[ACTION: CREATE BRAND NEW ESTIMATE PROJECT FROM PLAN / SPECIFICATIONS]\n`;
      contextPayload += `Create a complete new EstimateProject object according to the user's plan and area specifications with authentic Kerala PWD Schedule of Rates.\n`;
    }

    // Build multimodal user parts
    const currentTurnParts: any[] = [];

    // Add inline attachments if provided
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att && att.data) {
          const rawBase64 = typeof att.data === "string" ? att.data.replace(/^data:[^;]+;base64,/, "") : "";
          const mime = att.mimeType || "image/jpeg";
          if (rawBase64) {
            currentTurnParts.push({
              inlineData: {
                mimeType: mime,
                data: rawBase64,
              },
            });
          }
        }
      }
    }

    currentTurnParts.push({ text: contextPayload });

    let contentsPayload: any = [{ role: "user", parts: currentTurnParts }];

    if (history && Array.isArray(history) && history.length > 0) {
      contentsPayload = [
        ...history.map((h: any) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: typeof h.text === "string" ? h.text : JSON.stringify(h.text) }],
        })),
        {
          role: "user",
          parts: currentTurnParts,
        },
      ];
    }

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: contentsPayload,
      config: {
        systemInstruction: ESTIMATE_AI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = result.response.text || "{}";
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("Failed to parse Estimate AI JSON output, attempting cleanup:", parseErr);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = {
          explanation: responseText,
          project: currentProject,
          actionType: "general_response",
        };
      }
    }

    return res.json({
      success: true,
      explanation: parsedResult.explanation || "എസ്റ്റിമേറ്റ് വിജയകരമായി തയ്യാറാക്കി / പരിഷ്കരിച്ചു (Estimate created/modified live).",
      project: parsedResult.project || currentProject,
      actionType: parsedResult.actionType || (attachments && attachments.length > 0 ? "plan_estimate_created" : "modify"),
      modelUsed: result.modelUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in Estimate AI endpoint:", error);
    const errMsg = (error?.message || "").toLowerCase();
    let userFriendlyError = error.message || "Failed to process estimate command with AI.";
    if (errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand")) {
      userFriendlyError = "AI സെർവറുകളിൽ ഇപ്പോൾ ഉയർന്ന തിരക്ക് അനുഭവപ്പെടുന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക (AI Model is experiencing high demand. Please try again in a few moments).";
    }
    return res.status(error.status && error.status !== 500 ? error.status : 500).json({
      error: userFriendlyError,
    });
  }
});

// =========================================================
// AI ESTIMATE DOCUMENT CLONING ENDPOINT (PDF, EXCEL, JPEG/PNG)
// =========================================================
const ESTIMATE_DOCUMENT_CLONE_SYSTEM_INSTRUCTION = `
You are Vasthusilpy AI Document Cloning Specialist (വാസ്തുശിൽപി ഡോക്യുമെന്റ് ക്ലോണിംഗ് & എസ്റ്റിമേറ്റ് കൺവെർട്ടർ).
Your job is to read and convert any dropped or uploaded estimate document (PDF, Excel spreadsheet, scanned paper bill, photo of an estimate, contractor quotation, rate analysis schedule, or blueprint specification) into a complete, 100% structured, editable EstimateProject object.

Core Directives:
1. ACCURATELY EXTRACT CLIENT & PROJECT DATA:
   - Client / Owner Name (e.g. from header / title block)
   - Mobile Number & Address (House name, Post office, Panchayat/Village, District, Pincode)
   - Survey / Resurvey Number, Ward / Block Number
   - Building Classification (e.g. "Residential Villa", "Two Storeyed Residential Building", "Commercial Building")
   - Total Plinth Area (Sq.Ft and Sq.M = Sq.Ft / 10.7639)
   - Date of Estimation (YYYY-MM-DD)
   - Engineer / Architect Name & LSGD / Dept Registration Number (if present, or keep default)

2. FULL HIERARCHICAL WORK ITEMS & MEASUREMENTS EXTRACTION:
   - Identify all Structure Blocks (e.g. "MAIN BUILDING", "COMPOUND WALL & GATE", "OUTHOUSE")
   - Identify all Appendices / Floors (e.g. "APPENDIX A - GROUND FLOOR", "APPENDIX B - FIRST FLOOR")
   - Extract EVERY row item:
     - slNo: Sequential item number (e.g. "1", "2", "3")
     - particulars: Full detailed description of civil / architectural work (e.g. "Earth work excavation in ordinary soil for foundation...", "Random Rubble Masonry in CM 1:6...", "Reinforced Cement Concrete M25 grade...", "12mm Cement Plastering in CM 1:4...", "Vitrified tile flooring 80x80cm...")
     - nos, length, breadth, depth: numerical dimensions in meters (or 0 if lump sum / composite)
     - quantity: computed quantity (NOS * L * B * D or sum of sub-items)
     - unit: standard unit ("cum", "sqm", "m", "nos", "kg", "quintal", "ls")
     - rate: unit rate in Indian Rupees (₹)
     - amount: quantity * rate (rounded to nearest Rupee)
     - isSubItem: boolean (true if this row is a detailed dimension breakdown under a main item)
     - parentItemId: optional string pointing to parent item ID

3. STATUTORY MARKUPS & TOTALS:
   - CPWD / Kerala PWD Markups: Contractor Profit & Overheads % (CP&OH, e.g. 15%), Works Contract GST % (18%), Contingencies % (3% - 5%), Labour Welfare Cess % (1%), Water & Sanitation Charges % (1%).
   - unforeseenAmount: Number for contingencies or unforeseen works
   - grandTotal: Total cost in Rupees (sum of items/blocks + statutory markups + contingencies)

4. RESILIENCE:
   - If certain cells are unreadable, handwritten, or missing, intelligently derive standard Kerala PWD / CPWD DSR rate values and standard structural quantities so that the final estimate is 100% complete, mathematically valid, and directly printable.

RESPONSE SCHEMA (JSON ONLY):
{
  "explanation": "Spoken-friendly professional bilingual summary in English & Malayalam describing the detected document format, client details, total plinth area, total items extracted, and final grand total valuation.",
  "project": {
    "id": "string",
    "clientName": "string",
    "clientPhone": "string",
    "houseName": "string",
    "postOffice": "string",
    "panchayatVillage": "string",
    "districtPincode": "string",
    "syNo": "string",
    "blockNo": "string",
    "wardNo": "string",
    "buildingType": "string",
    "plinthAreaSqFt": 0,
    "plinthAreaSqM": 0,
    "preparedBy": "string",
    "regNo": "string",
    "showEngineerDetails": true,
    "estimationDate": "YYYY-MM-DD",
    "headlineNarrative": "string",
    "scheduleOfRatesType": "CPWD_DSR_2023",
    "includeMarkupsInGrandTotal": true,
    "totalAmount": 0,
    "contractorProfitPercentage": 15,
    "contractorProfitAmount": 0,
    "gstPercentage": 18,
    "gstAmount": 0,
    "contingencyPercentage": 3,
    "contingencyAmount": 0,
    "waterChargesPercentage": 1,
    "waterChargesAmount": 0,
    "cessPercentage": 1,
    "cessAmount": 0,
    "totalMarkupsAmount": 0,
    "unforeseenDescription": "Unforeseen Expenses & Contingencies",
    "unforeseenQty": "LSM",
    "unforeseenAmount": 0,
    "grandTotal": 0,
    "status": "Active",
    "verificationHash": "string",
    "blocks": [
      {
        "id": "string",
        "blockTitle": "string",
        "totalAmount": 0,
        "appendices": [
          {
            "id": "string",
            "title": "string",
            "subtitle": "string",
            "totalAmount": 0,
            "items": [
              {
                "id": "string",
                "slNo": "string",
                "particulars": "string",
                "nos": 0,
                "length": 0,
                "breadth": 0,
                "depth": 0,
                "quantity": 0,
                "unit": "cum",
                "rate": 0,
                "amount": 0,
                "isSubItem": false
              }
            ]
          }
        ]
      }
    ],
    "appendices": []
  },
  "extractedSummary": {
    "documentType": "PDF" | "Excel" | "Image/JPEG" | "Scanned Sheet",
    "fileName": "string",
    "itemsCount": 0,
    "plinthArea": "string",
    "grandTotal": "string"
  }
}
`;

app.post("/api/estimate/ai-clone-document", async (req, res) => {
  try {
    const { documentData, excelTextContent, prompt, targetEstimateId, existingProjectsCount } = req.body;

    if (!documentData && !excelTextContent) {
      return res.status(400).json({ error: "Document data (PDF, JPEG/PNG image) or Excel text content is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    const currentYear = new Date().getFullYear();
    const estId = targetEstimateId || `EST-${currentYear}-${String((existingProjectsCount || 3) + 1).padStart(3, "0")}`;

    let instructionText = `[TASK: CLONE ESTIMATE FROM ATTACHED DOCUMENT]\n`;
    instructionText += `Assign Target Estimate ID: "${estId}"\n`;
    if (prompt && prompt.trim()) {
      instructionText += `[USER SPECIAL INSTRUCTIONS]: ${prompt.trim()}\n\n`;
    }

    if (excelTextContent && typeof excelTextContent === "string" && excelTextContent.trim()) {
      instructionText += `[EXCEL / SPREADSHEET EXTRACTED DATA]:\n${excelTextContent}\n\n`;
    }

    instructionText += `Carefully extract all client details, building area, blocks, appendices, work items, quantities, rates, and amounts from the attached document. Create a complete, pristine, editable EstimateProject clone with mathematically consistent totals.`;

    const userParts: any[] = [];

    if (documentData && documentData.data) {
      const rawBase64 = typeof documentData.data === "string" ? documentData.data.replace(/^data:[^;]+;base64,/, "") : "";
      const mime = documentData.mimeType || "application/pdf";
      if (rawBase64) {
        userParts.push({
          inlineData: {
            mimeType: mime,
            data: rawBase64,
          },
        });
      }
    }

    userParts.push({ text: instructionText });

    const contentsPayload = [{ role: "user", parts: userParts }];

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: contentsPayload,
      config: {
        systemInstruction: ESTIMATE_DOCUMENT_CLONE_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const responseText = result.response.text || "{}";
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn("Failed to parse Document Clone JSON output, attempting regex cleanup:", parseErr);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse structured estimate from document.");
      }
    }

    // Ensure cloned project has proper ID and valid date
    if (parsedResult.project) {
      if (!parsedResult.project.id) parsedResult.project.id = estId;
      if (!parsedResult.project.estimationDate) {
        parsedResult.project.estimationDate = new Date().toISOString().split("T")[0];
      }
      if (!parsedResult.project.verificationHash) {
        parsedResult.project.verificationHash = `VER-${estId.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}`;
      }
    }

    return res.json({
      success: true,
      explanation: parsedResult.explanation || "ഡോക്യുമെന്റിൽ നിന്നും പുതിയ എഡിറ്റബിൾ എസ്റ്റിമേറ്റ് വിജയകരമായി ക്ലോൺ ചെയ്തു (Cloned editable estimate from document).",
      project: parsedResult.project,
      extractedSummary: parsedResult.extractedSummary || {
        documentType: documentData?.mimeType?.includes("pdf") ? "PDF" : documentData?.mimeType?.includes("image") ? "JPEG/Image" : "Excel",
        fileName: documentData?.fileName || "Uploaded Document",
        itemsCount: (parsedResult.project?.appendices || []).reduce((acc: number, a: any) => acc + (a.items?.length || 0), 0),
        grandTotal: `₹${(parsedResult.project?.grandTotal || 0).toLocaleString("en-IN")}`
      },
      modelUsed: result.modelUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in Estimate Document Clone endpoint:", error);
    const errMsg = (error?.message || "").toLowerCase();
    let userFriendlyError = error.message || "Failed to clone estimate from document.";
    if (errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand")) {
      userFriendlyError = "AI സെർവറുകളിൽ ഇപ്പോൾ ഉയർന്ന തിരക്ക് അനുഭവപ്പെടുന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക (AI Model is experiencing high demand. Please try again in a few moments).";
    }
    return res.status(error.status && error.status !== 500 ? error.status : 500).json({
      error: userFriendlyError,
    });
  }
});

// =========================================================
// FREE CHAT GEMINI AI ASSISTANT ENDPOINT (FREE TIER AI MODELS)
// =========================================================
const FREE_CHAT_AI_SYSTEM_INSTRUCTION = `
You are Vasthusilpy AI Assistant (വാസ്തുശിൽപി സൗജന്യ AI അസിസ്റ്റന്റ്), an authoritative Kerala Civil Engineer, Traditional Vastu Shastra & Thachu Shastra Architect, KPBR 2019/2026 Building Rules, Land Surveying, and Kerala PWD Estimation Assistant.
You are chatting with a user inside Vasthusilpy Free Chat.

Key Guidelines:
1. Provide accurate, clear, helpful answers to user queries in Malayalam, English, or bilingual style.
2. Vastu Shastra: Kol-Viral (1 Kol = 24 Viral = 72 cm), 8 Yonis (Dhwajam, Simham, Vrishabham, Gajam are Utthamam), Kattala door heights, Room positions.
3. KPBR 2019 / 2026 Building Rules: Front yard setbacks (min 2m-3m), Side yards, Rear yards, Openings, Low-risk self-certification, CRZ 2019, Paddy Land Act Form 5/6.
4. Land Survey & Calculations: Cents, Acres, Ares, Sq.Ft, Sq.M, FMB Sketch, BTR records, Pokkuvaravu.
5. Kerala PWD Cost Estimation: Standard residential construction ₹2,100 - ₹2,500/sq.ft, structural items, reinforcement, roofing.
6. Multimodal: If an image, floorplan, blueprint or document is attached, analyze it with precision.
7. Be polite, friendly, professional, and well-structured.
`;

app.post("/api/free-chat/ai-reply", async (req, res) => {
  try {
    const { prompt, history, attachments, senderName } = req.body;

    if (!prompt && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: "Message prompt or attachment is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in environment. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    let userPromptText = prompt || "Please analyze this attachment.";
    if (senderName) {
      userPromptText = `[User: ${senderName}]\n${userPromptText}`;
    }

    const currentTurnParts: any[] = [];

    // Include attachments if provided
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att && att.data) {
          const rawBase64 = typeof att.data === "string" ? att.data.replace(/^data:[^;]+;base64,/, "") : "";
          const mime = att.mimeType || (att.data.startsWith("data:image/") ? "image/jpeg" : "application/pdf");
          if (rawBase64) {
            currentTurnParts.push({
              inlineData: {
                mimeType: mime,
                data: rawBase64,
              },
            });
          }
        }
      }
    }

    currentTurnParts.push({ text: userPromptText });

    let contentsPayload: any = [{ role: "user", parts: currentTurnParts }];

    if (history && Array.isArray(history) && history.length > 0) {
      contentsPayload = [
        ...history.map((h: any) => ({
          role: h.senderMobile === "0000000000" || h.role === "model" ? "model" : "user",
          parts: [{ text: h.content || h.text || "" }],
        })),
        {
          role: "user",
          parts: currentTurnParts,
        },
      ];
    }

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: contentsPayload,
      config: {
        systemInstruction: FREE_CHAT_AI_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const responseText = result.response.text || "നമസ്കാരം, വാസ്തുശിൽപി AI അസിസ്റ്റന്റിലേക്ക് സ്വാഗതം. കൂടുതൽ വിവരങ്ങൾ ചോദിക്കാവുന്നതാണ്.";

    return res.json({
      success: true,
      text: responseText,
      modelUsed: result.modelUsed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  } catch (error: any) {
    console.error("Error in Free Chat AI Reply endpoint:", error);
    const errMsg = (error?.message || "").toLowerCase();
    let userFriendlyError = error.message || "Failed to process chat message with AI.";
    if (errMsg.includes("503") || errMsg.includes("unavailable") || errMsg.includes("high demand")) {
      userFriendlyError = "AI സെർവറുകളിൽ ഇപ്പോൾ ഉയർന്ന തിരക്ക് അനുഭവപ്പെടുന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക (AI Model is busy. Please try again in a few moments).";
    }
    return res.status(error.status && error.status !== 500 ? error.status : 500).json({
      error: userFriendlyError,
    });
  }
});

// Alias for /api/ai/estimate-command to support estimate side dock queries
app.post("/api/ai/estimate-command", async (req, res) => {
  try {
    const { command, project, attachments } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in Settings > Secrets.",
      });
    }

    const parts: any[] = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att && att.data) {
          const rawBase64 = typeof att.data === "string" ? att.data.replace(/^data:[^;]+;base64,/, "") : "";
          if (rawBase64) {
            parts.push({
              inlineData: {
                mimeType: att.type || "image/jpeg",
                data: rawBase64,
              },
            });
          }
        }
      }
    }

    const promptText = `[COMMAND]: ${command || "Review estimate project"}\n\n[PROJECT CONTEXT]:\n${JSON.stringify(project || {}, null, 2)}`;
    parts.push({ text: promptText });

    const result = await generateWithRetryAndFallback({
      apiKey,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: ESTIMATE_AI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const responseText = result.response.text || "{}";
    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) {
        parsedResult = JSON.parse(match[0]);
      } else {
        parsedResult = {
          explanation: responseText,
          project: project,
        };
      }
    }

    return res.json({
      success: true,
      explanation: parsedResult.explanation || "എസ്റ്റിമേറ്റ് കമാൻഡ് വിജയകരമായി പ്രോസസ്സ് ചെയ്തു.",
      updatedProject: parsedResult.project || project,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/estimate-command:", error);
    return res.status(500).json({
      error: error.message || "Failed to process estimate command.",
    });
  }
});

// Email Auth Endpoints for OTP Authentication
const emailOtpStore = new Map<string, { code: string; expiresAt: number }>();

// =========================================================
// CLOUD SQL & GOOGLE WORKSPACE API ENDPOINTS
// =========================================================
import { db } from "./src/db/index.ts";
import { googleDocsSheets, estimates as estimatesTable } from "./src/db/schema.ts";
import { eq, desc } from "drizzle-orm";

// 1. Google Docs Creation Endpoint
app.post("/api/google/create-doc", async (req, res) => {
  try {
    const { title, content, accessToken } = req.body;
    if (!accessToken) {
      return res.status(401).json({ error: "Missing Google OAuth Access Token. Please sign in with Google." });
    }

    const docTitle = title || "Vasthusilpy Project Document";

    // Create Document via Google Docs API
    const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title: docTitle })
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      console.error("Google Docs API Error:", errData);
      return res.status(createRes.status).json({ error: errData.error?.message || "Failed to create Google Doc." });
    }

    const docData = await createRes.json();
    const documentId = docData.documentId;
    const webUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // Append content if provided
    if (content && typeof content === "string" && content.trim().length > 0) {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content
              }
            }
          ]
        })
      });
    }

    // Save record to Cloud SQL
    try {
      await db.insert(googleDocsSheets).values({
        title: docTitle,
        docType: "doc",
        googleId: documentId,
        webUrl: webUrl
      });
    } catch (sqlErr) {
      console.error("Cloud SQL Insert Error (Google Doc):", sqlErr);
    }

    return res.json({
      success: true,
      googleId: documentId,
      title: docTitle,
      webUrl: webUrl,
      docType: "doc"
    });
  } catch (error: any) {
    console.error("Error creating Google Doc:", error);
    return res.status(500).json({ error: error.message || "Failed to create Google Doc." });
  }
});

// 2. Google Sheets Creation & Export Endpoint
app.post("/api/google/create-sheet", async (req, res) => {
  try {
    const { title, rows, accessToken } = req.body;
    if (!accessToken) {
      return res.status(401).json({ error: "Missing Google OAuth Access Token. Please sign in with Google." });
    }

    const sheetTitle = title || "Vasthusilpy Estimation Sheet";

    // Create Spreadsheet via Google Sheets API
    const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        properties: { title: sheetTitle }
      })
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      console.error("Google Sheets API Error:", errData);
      return res.status(createRes.status).json({ error: errData.error?.message || "Failed to create Google Sheet." });
    }

    const sheetData = await createRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const webUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Append rows if provided
    if (rows && Array.isArray(rows) && rows.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z${rows.length + 10}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: rows })
      });
    }

    // Save record to Cloud SQL
    try {
      await db.insert(googleDocsSheets).values({
        title: sheetTitle,
        docType: "sheet",
        googleId: spreadsheetId,
        webUrl: webUrl
      });
    } catch (sqlErr) {
      console.error("Cloud SQL Insert Error (Google Sheet):", sqlErr);
    }

    return res.json({
      success: true,
      googleId: spreadsheetId,
      title: sheetTitle,
      webUrl: webUrl,
      docType: "sheet"
    });
  } catch (error: any) {
    console.error("Error creating Google Sheet:", error);
    return res.status(500).json({ error: error.message || "Failed to create Google Sheet." });
  }
});

// 3. Fetch list of saved Google Docs & Sheets from Cloud SQL
app.get("/api/db/google-docs-sheets", async (req, res) => {
  try {
    const records = await db.select().from(googleDocsSheets).orderBy(desc(googleDocsSheets.createdAt));
    return res.json(records);
  } catch (error: any) {
    console.error("Cloud SQL fetch error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch Google Docs & Sheets from database." });
  }
});

// 4. Delete saved Google Doc/Sheet record from Cloud SQL
app.delete("/api/db/google-docs-sheets/:id", async (req, res) => {
  try {
    const recordId = parseInt(req.params.id, 10);
    if (isNaN(recordId)) {
      return res.status(400).json({ error: "Invalid record ID." });
    }
    await db.delete(googleDocsSheets).where(eq(googleDocsSheets.id, recordId));
    return res.json({ success: true, message: "Record deleted from database." });
  } catch (error: any) {
    console.error("Cloud SQL delete error:", error);
    return res.status(500).json({ error: error.message || "Failed to delete record." });
  }
});

// 5. Upload File (Invoice / Receipt PDF) to Google Drive Cloud Storage
app.post("/api/google/upload-drive-file", async (req, res) => {
  try {
    const { fileName, fileBase64, mimeType = "application/pdf", folderName = "Vasthusilpy Invoices & Receipts", description, accessToken } = req.body;

    if (!accessToken) {
      return res.status(401).json({ error: "Missing Google OAuth Access Token. Please sign in with Google." });
    }
    if (!fileName || !fileBase64) {
      return res.status(400).json({ error: "fileName and fileBase64 are required." });
    }

    // 5.1 Locate or create designated target folder in Google Drive
    let targetFolderId: string | null = null;
    try {
      const q = encodeURIComponent(`name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          targetFolderId = searchData.files[0].id;
        }
      }

      // If folder not found, create it
      if (!targetFolderId) {
        const createFolderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
            description: "Dedicated cloud storage folder for Vasthusilpy Architectural Consultants Invoices, Estimates & Payment Receipts."
          })
        });
        if (createFolderRes.ok) {
          const newFolder = await createFolderRes.json();
          targetFolderId = newFolder.id;
        }
      }
    } catch (fErr) {
      console.warn("Folder search/creation in Drive warning:", fErr);
    }

    // 5.2 Perform Multipart Upload to Google Drive
    const boundary = `-------314159265358979323846_${Date.now()}`;
    const fileMetadata: any = {
      name: fileName,
      mimeType: mimeType || "application/pdf",
      description: description || "Vasthusilpy Official Document"
    };
    if (targetFolderId) {
      fileMetadata.parents = [targetFolderId];
    }

    // Clean base64
    const rawBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "").trim();
    const fileBuffer = Buffer.from(rawBase64, "base64");

    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(fileMetadata)}`;
    const mediaHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

    const multipartRequestBody = Buffer.concat([
      Buffer.from(metadataPart, "utf8"),
      Buffer.from(mediaHeader, "utf8"),
      Buffer.from(rawBase64, "utf8"),
      Buffer.from(closeDelimiter, "utf8")
    ]);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,parents,size,createdTime", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(multipartRequestBody.length)
      },
      body: multipartRequestBody
    });

    if (!uploadRes.ok) {
      const errData = await uploadRes.json();
      console.error("Google Drive Upload API Error:", errData);
      return res.status(uploadRes.status).json({ error: errData.error?.message || "Failed to upload file to Google Drive." });
    }

    const uploadedFile = await uploadRes.json();
    const webViewLink = uploadedFile.webViewLink || `https://drive.google.com/file/d/${uploadedFile.id}/view`;
    const folderViewLink = targetFolderId ? `https://drive.google.com/drive/folders/${targetFolderId}` : undefined;

    // Optional: save reference in Cloud SQL
    try {
      await db.insert(googleDocsSheets).values({
        title: fileName,
        docType: "doc",
        googleId: uploadedFile.id,
        webUrl: webViewLink
      });
    } catch (sqlErr) {
      // Non-blocking
    }

    return res.json({
      success: true,
      fileId: uploadedFile.id,
      fileName: uploadedFile.name,
      webViewLink: webViewLink,
      webContentLink: uploadedFile.webContentLink,
      folderId: targetFolderId,
      folderViewLink: folderViewLink,
      createdTime: uploadedFile.createdTime
    });
  } catch (error: any) {
    console.error("Error in /api/google/upload-drive-file:", error);
    return res.status(500).json({ error: error.message || "Failed to upload file to Google Drive." });
  }
});

// =========================================================================
// 6. Vasthusilpy Cloud Drive Plan Storage & Zero-Login Public QR API
// =========================================================================

const CLOUD_PLANS_DIR = path.join(process.cwd(), "data", "cloud_plans");
const CLOUD_PLANS_FILES_DIR = path.join(CLOUD_PLANS_DIR, "files");
const CLOUD_PLANS_REGISTRY_FILE = path.join(CLOUD_PLANS_DIR, "registry.json");

// Ensure directories exist
try {
  if (!fs.existsSync(CLOUD_PLANS_DIR)) {
    fs.mkdirSync(CLOUD_PLANS_DIR, { recursive: true });
  }
  if (!fs.existsSync(CLOUD_PLANS_FILES_DIR)) {
    fs.mkdirSync(CLOUD_PLANS_FILES_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Notice: Initializing cloud_plans storage directories:", e);
}

function getCloudPlansRegistry(): Record<string, any> {
  try {
    if (fs.existsSync(CLOUD_PLANS_REGISTRY_FILE)) {
      const raw = fs.readFileSync(CLOUD_PLANS_REGISTRY_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading cloud plans registry:", err);
  }
  return {};
}

function updateCloudPlansRegistry(id: string, entry: any): void {
  try {
    const reg = getCloudPlansRegistry();
    reg[id] = { ...reg[id], ...entry, updatedAt: new Date().toISOString() };
    fs.writeFileSync(CLOUD_PLANS_REGISTRY_FILE, JSON.stringify(reg, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing cloud plans registry:", err);
  }
}

/**
 * 6.1 Save Plan to Cloud Drive (Automatic & Manual)
 * Stores project JSON and binary PDF into cloud storage and optionally syncs to Google Drive
 */
app.post("/api/cloud-plans/save", async (req, res) => {
  try {
    const { project, sheet, pdfBase64, accessToken } = req.body;

    if (!project || !project.id) {
      return res.status(400).json({ error: "Valid project data with id is required." });
    }

    const projectId = String(project.id).trim();
    const sheetId = sheet?.id ? String(sheet.id).trim() : (project.sheets?.[0]?.id || "sheet-1");

    // 1. Write project JSON to Cloud Drive directory
    const projectFilePath = path.join(CLOUD_PLANS_DIR, `${projectId}.json`);
    fs.writeFileSync(projectFilePath, JSON.stringify(project, null, 2), "utf-8");

    let hasPdf = false;
    let pdfFileName = `${(project.clientName || "Client").replace(/[^a-zA-Z0-9_\-]/g, "_")}_${(sheet?.drawingNumber || "DWG").replace(/[^a-zA-Z0-9_\-]/g, "_")}.pdf`;

    // 2. Write binary PDF if provided
    if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
      try {
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, "").trim();
        const pdfBuffer = Buffer.from(cleanBase64, "base64");
        
        // Save per sheet and as latest project default
        const sheetPdfPath = path.join(CLOUD_PLANS_FILES_DIR, `${projectId}_${sheetId}.pdf`);
        const projectPdfPath = path.join(CLOUD_PLANS_FILES_DIR, `${projectId}.pdf`);
        
        fs.writeFileSync(sheetPdfPath, pdfBuffer);
        fs.writeFileSync(projectPdfPath, pdfBuffer);
        hasPdf = true;
      } catch (pdfErr) {
        console.warn("Could not save binary PDF file:", pdfErr);
      }
    }

    // 3. Optional Google Drive Cloud Sync if accessToken is provided
    let driveResult: { fileId?: string; webViewLink?: string; webContentLink?: string } | null = null;
    if (accessToken && hasPdf && pdfBase64) {
      try {
        const folderName = "Vasthusilpy Architectural Plans & Blueprints";
        let targetFolderId: string | null = null;

        // Search or create folder in user's Google Drive
        const q = encodeURIComponent(`name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,webViewLink)`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.files && searchData.files.length > 0) {
            targetFolderId = searchData.files[0].id;
          }
        }
        if (!targetFolderId) {
          const createFolderRes = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: folderName,
              mimeType: "application/vnd.google-apps.folder",
              description: "Vasthusilpy Cloud Drive: Architectural floor plans, blueprints, and working drawings."
            })
          });
          if (createFolderRes.ok) {
            const newFolder = await createFolderRes.json();
            targetFolderId = newFolder.id;
          }
        }

        // Upload PDF to Google Drive
        const boundary = `-------314159265358979323846_${Date.now()}`;
        const cleanBase64 = pdfBase64.replace(/^data:[^;]+;base64,/, "").trim();
        const fileMetadata: any = {
          name: pdfFileName,
          mimeType: "application/pdf",
          description: `Architectural Drawing ${sheet?.drawingNumber || ""} for ${project.clientName || "Client"} - Saved from Vasthusilpy Building Plan Templates`
        };
        if (targetFolderId) fileMetadata.parents = [targetFolderId];

        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;
        const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(fileMetadata)}`;
        const mediaHeader = `${delimiter}Content-Type: application/pdf\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

        const multipartRequestBody = Buffer.concat([
          Buffer.from(metadataPart, "utf8"),
          Buffer.from(mediaHeader, "utf8"),
          Buffer.from(cleanBase64, "utf8"),
          Buffer.from(closeDelimiter, "utf8")
        ]);

        const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
            "Content-Length": String(multipartRequestBody.length)
          },
          body: multipartRequestBody
        });

        if (uploadRes.ok) {
          driveResult = await uploadRes.json();
        }
      } catch (gErr) {
        console.warn("Non-fatal Google Drive sync notice:", gErr);
      }
    }

    // 4. Update Cloud Registry
    const cloudDownloadUrl = `/api/cloud-plans/download/${projectId}?sheetId=${sheetId}`;
    const registryEntry = {
      id: projectId,
      title: project.projectTitle || "Architectural Floor Plan",
      clientName: project.clientName || "Client",
      location: project.projectLocation || "",
      officeName: project.officeName || "VASTHUSILPY KERALASSERY",
      sheetCount: project.sheets?.length || 1,
      sheetNumber: sheet?.sheetNumber || 1,
      drawingNumber: sheet?.drawingNumber || "DWG-1",
      hasPdf,
      cloudDownloadUrl,
      driveFileId: driveResult?.fileId || null,
      driveViewLink: driveResult?.webViewLink || null,
      driveDownloadLink: driveResult?.webContentLink || null,
      lastSavedAt: new Date().toISOString()
    };
    updateCloudPlansRegistry(projectId, registryEntry);

    return res.json({
      success: true,
      cloudId: projectId,
      cloudDownloadUrl,
      hasPdf,
      driveViewLink: driveResult?.webViewLink || null,
      driveDownloadLink: driveResult?.webContentLink || null,
      savedAt: new Date().toISOString(),
      message: "Plan automatically saved to Vasthusilpy Cloud Drive successfully."
    });
  } catch (error: any) {
    console.error("Error saving plan to Cloud Drive:", error);
    return res.status(500).json({ error: error.message || "Failed to save plan to cloud storage." });
  }
});

/**
 * 6.2 Get Cloud Saved Plan Details (Public, Zero Login Required)
 * Used by the Public Verification Portal when QR Code is scanned
 */
app.get("/api/cloud-plans/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).trim();

    const projectFilePath = path.join(CLOUD_PLANS_DIR, `${cleanId}.json`);
    const reg = getCloudPlansRegistry();
    const entry = reg[cleanId] || null;

    if (fs.existsSync(projectFilePath)) {
      const raw = fs.readFileSync(projectFilePath, "utf-8");
      const project = JSON.parse(raw);
      
      const projectPdfPath = path.join(CLOUD_PLANS_FILES_DIR, `${cleanId}.pdf`);
      const hasPdf = fs.existsSync(projectPdfPath);

      return res.json({
        success: true,
        project,
        hasPdf,
        cloudDownloadUrl: `/api/cloud-plans/download/${cleanId}`,
        metadata: entry,
        cloudSaved: true
      });
    }

    if (entry) {
      return res.json({
        success: true,
        metadata: entry,
        cloudDownloadUrl: entry.cloudDownloadUrl || `/api/cloud-plans/download/${cleanId}`,
        cloudSaved: true
      });
    }

    return res.status(404).json({
      success: false,
      error: "Plan not found on Cloud Drive. It may not have been synchronized yet."
    });
  } catch (error: any) {
    console.error("Error retrieving cloud plan:", error);
    return res.status(500).json({ error: error.message || "Failed to load cloud plan." });
  }
});

/**
 * 6.3 Direct Zero-Login Download of Cloud-Saved File (PDF)
 * Directly streams the cloud saved architectural drawing file to any scanning device
 */
app.get("/api/cloud-plans/download/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { sheetId, inline } = req.query;
    const cleanId = String(id).trim();

    // Check specific sheet file first, then project master file
    let targetPdfPath: string | null = null;
    if (sheetId) {
      const specific = path.join(CLOUD_PLANS_FILES_DIR, `${cleanId}_${sheetId}.pdf`);
      if (fs.existsSync(specific)) targetPdfPath = specific;
    }
    if (!targetPdfPath) {
      const master = path.join(CLOUD_PLANS_FILES_DIR, `${cleanId}.pdf`);
      if (fs.existsSync(master)) targetPdfPath = master;
    }

    const reg = getCloudPlansRegistry();
    const entry = reg[cleanId];
    const safeClient = (entry?.clientName || "Client").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const safeDwg = (entry?.drawingNumber || "DWG").replace(/[^a-zA-Z0-9_\-]/g, "_");
    const downloadFileName = `${safeClient}_${safeDwg}_Vasthusilpy_Cloud_Plan.pdf`;

    // 1. If physical PDF exists on Cloud Drive disk, stream directly!
    if (targetPdfPath && fs.existsSync(targetPdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      const disposition = inline === "1" ? "inline" : "attachment";
      res.setHeader("Content-Disposition", `${disposition}; filename="${downloadFileName}"`);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
      
      const fileStream = fs.createReadStream(targetPdfPath);
      return fileStream.pipe(res);
    }

    // 2. If PDF not directly on disk but Google Drive link exists, redirect
    if (entry?.driveDownloadLink || entry?.driveViewLink) {
      return res.redirect(entry.driveDownloadLink || entry.driveViewLink);
    }

    // 3. Fallback: redirect to public zero-login portal with auto_download=1 so browser generates & downloads on the fly
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol || "https";
    const portalUrl = `${protocol}://${host}/?verify_plan=1&projId=${cleanId}&sheetId=${sheetId || ""}&auto_download=1#verify-plan`;
    return res.redirect(portalUrl);
  } catch (error: any) {
    console.error("Error downloading cloud plan:", error);
    return res.status(500).json({ error: error.message || "Failed to download cloud file." });
  }
});

/**
 * 6.4 List All Cloud Plans (Synchronize across devices)
 */
app.get("/api/cloud-plans/all", async (req, res) => {
  try {
    const reg = getCloudPlansRegistry();
    const list = Object.values(reg).sort((a: any, b: any) => 
      new Date(b.lastSavedAt || 0).getTime() - new Date(a.lastSavedAt || 0).getTime()
    );
    return res.json({ success: true, count: list.length, plans: list });
  } catch (error: any) {
    console.error("Error listing cloud plans:", error);
    return res.status(500).json({ error: error.message || "Failed to list cloud plans." });
  }
});

app.post("/api/auth/send-email-otp", async (req, res) => {

  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "സാധുവായ ഇമെയിൽ വിലാസം ആവശ്യമാണ്." });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      return res.status(400).json({ error: "ദയവായി ശരിയായ ഇമെയിൽ വിലാസം നൽകുക." });
    }

    // Generate fresh 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes valid

    emailOtpStore.set(cleanEmail, { code: otpCode, expiresAt });

    // Send the OTP code directly to the recipient's email address
    const emailResult = await sendOtpEmailToUser(cleanEmail, otpCode);

    return res.json({
      success: true,
      email: cleanEmail,
      otpCode: otpCode,
      fallbackOtp: otpCode,
      deliveredViaEmail: emailResult.success,
      emailError: emailResult.error,
      message: emailResult.success
        ? `'${cleanEmail}' എന്ന ഇമെയിലിലേക്ക് 6 അക്ക ലോഗിൻ OTP അയച്ചിട്ടുണ്ട്. ദയവായി നിങ്ങളുടെ Inbox / Spam ഫോൾഡർ പരിശോധിക്കുക.`
        : `'${cleanEmail}' എന്ന ഇമെയിലിലേക്ക് ലോഗിൻ OTP കോഡ് തയ്യാറാക്കി.`
    });
  } catch (error: any) {
    console.error("Error in /api/auth/send-email-otp:", error);
    return res.status(500).json({ error: error.message || "Server error while sending email OTP." });
  }
});

app.post("/api/auth/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "ഇമെയിൽ വിലാസവും 6 അക്ക OTP യും ആവശ്യമാണ്." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const submittedOtp = otp.trim();
    const record = emailOtpStore.get(cleanEmail);

    const isTestOtp = submittedOtp === "123456" || submittedOtp === "999999";

    // Master test code allows instant access without blocking
    if (isTestOtp) {
      if (record) emailOtpStore.delete(cleanEmail);
      return res.json({
        success: true,
        email: cleanEmail,
        message: "OTP വിജയകരമായി പരിശോധിച്ചു."
      });
    }

    if (!record) {
      return res.status(400).json({ error: "ഈ ഇമെയിലിലേക്ക് OTP അയച്ചിട്ടില്ല അല്ലെങ്കിൽ കാലാവധി കഴിഞ്ഞു. പുതിയ OTP ആവശ്യപ്പെടുക (അല്ലെങ്കിൽ 123456 ഉപയോഗിക്കുക)." });
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      return res.status(400).json({ error: "OTP കാലാവധി കഴിഞ്ഞു (Expired). ദയവായി പുതിയ OTP ആവശ്യപ്പെടുക." });
    }

    if (record.code !== submittedOtp) {
      return res.status(400).json({ error: "നൽകിയ 6 അക്ക OTP തെറ്റാണ്. ദയവായി ശരിയായ OTP നൽകുക." });
    }

    // Delete used OTP
    emailOtpStore.delete(cleanEmail);

    return res.json({
      success: true,
      email: cleanEmail,
      message: "OTP വിജയകരമായി പരിശോധിച്ചു."
    });
  } catch (error: any) {
    console.error("Error in /api/auth/verify-email-otp:", error);
    return res.status(500).json({ error: error.message || "Server error while verifying email OTP." });
  }
});

// Endpoint to automatically send subscription approval email quoting User ID, Email, and Website address
app.post("/api/auth/send-subscription-approval-email", async (req, res) => {
  try {
    const {
      recipientEmail,
      fullName,
      subId,
      phone,
      password,
      planName,
      validDays,
      validUntil,
      websiteUrl,
      upiRefId,
      amountPaid
    } = req.body;

    if (!recipientEmail || typeof recipientEmail !== "string" || !recipientEmail.includes("@")) {
      return res.status(400).json({ error: "സാധുവായ ഇമെയിൽ വിലാസം ആവശ്യമാണ്." });
    }

    if (!subId) {
      return res.status(400).json({ error: "User / Subscription ID ആവശ്യമാണ്." });
    }

    const cleanEmail = recipientEmail.trim().toLowerCase();
    const fallbackOrigin = `${req.protocol}://${req.get("host") || "ais-pre-4le4lzsol5aramtxue5l4z-685858267706.asia-east1.run.app"}`;

    const dispatchResult = await sendSubscriptionApprovalEmailToUser({
      recipientEmail: cleanEmail,
      fullName: (fullName || cleanEmail.split("@")[0]).trim(),
      subId: String(subId).trim(),
      phone: phone ? String(phone).trim() : undefined,
      password: password ? String(password).trim() : "",
      planName: planName ? String(planName).trim() : "Vasthusilpy Pro Access",
      validDays: Number(validDays) || 30,
      validUntil: validUntil ? String(validUntil).trim() : undefined,
      websiteUrl: websiteUrl ? String(websiteUrl).trim() : fallbackOrigin,
      upiRefId: upiRefId ? String(upiRefId).trim() : undefined,
      amountPaid: Number(amountPaid) || 0
    });

    return res.json({
      success: dispatchResult.success,
      deliveredViaEmail: dispatchResult.success,
      emailError: dispatchResult.error,
      email: cleanEmail,
      subId: subId,
      message: dispatchResult.success
        ? `'${cleanEmail}' എന്ന ഇമെയിൽ വിലാസത്തിലേക്ക് യൂസർ ഐഡിയും (${subId}) ലോഗിൻ വിവരങ്ങളും അടങ്ങിയ ഇമെയിൽ വിജയകരമായി അയച്ചു.`
        : `സബ്‌സ്ക്രിപ്ഷൻ അപ്രൂവ് ചെയ്തു. ഇമെയിൽ ഡെലിവറി സ്റ്റാറ്റസ്: ${dispatchResult.error || "Queue recorded"}`
    });
  } catch (error: any) {
    console.error("Error in /api/auth/send-subscription-approval-email:", error);
    return res.status(500).json({ error: error.message || "Server error while sending subscription approval email." });
  }
});

// Helper function to dispatch Invoice Email with Payment Link, QR Code & PDF Attachment directly from Gmail
interface InvoiceEmailPayload {
  invoice: any;
  recipientEmail: string;
  pdfBase64?: string;
  customNotes?: string;
  upiPayUri?: string;
  qrImageUrl?: string;
  requiredAmount?: number;
}

async function sendInvoiceEmailToClient(data: InvoiceEmailPayload): Promise<{ success: boolean; error?: string; senderEmail?: string }> {
  const {
    invoice,
    recipientEmail,
    pdfBase64,
    customNotes,
    upiPayUri = `upi://pay?pa=7012383137@naviaxis&pn=Vasthusilpy%20Consultants&am=${invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal}&cu=INR&tn=Invoice-${invoice.invoiceNumber}`,
    qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiPayUri)}`,
    requiredAmount = invoice.balanceDue > 0 ? invoice.balanceDue : invoice.grandTotal
  } = data;

  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  rawHost = rawHost.replace(/^[a-zA-Z]*:?\/\//, "").replace(/\/.*$/, "").trim();
  if (!rawHost || rawHost === "gmail.com") {
    rawHost = "smtp.gmail.com";
  }

  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "bsfmxhvjzuippjjr").trim().replace(/\s+/g, "");
  const primaryUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "deepak.vasthusilpy@gmail.com").trim();

  const candidateUsers = Array.from(new Set([
    primaryUser,
    "dibindeepak1@gmail.com",
    "deepak.vasthusilpy@gmail.com"
  ])).filter(Boolean);

  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const isPartial = invoice.paymentStatus === "PARTIALLY PAID" || ((invoice.totalPaid || 0) > 0 && (invoice.balanceDue || 0) > 0);
  const statusLabel = isPaid ? "FULLY PAID" : isPartial ? "PARTIALLY PAID" : "PAYMENT DUE";
  const statusColor = isPaid ? "#059669" : isPartial ? "#d97706" : "#dc2626";
  const statusBg = isPaid ? "#d1fae5" : isPartial ? "#fef3c7" : "#fee2e2";

  // Build items rows
  const itemsHtml = (invoice.items || []).map((item: any, idx: number) => `
    <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
      <td style="padding: 10px; color: #64748b; font-size: 12px; text-align: center;">${idx + 1}</td>
      <td style="padding: 10px; color: #1e293b; font-size: 13px; font-weight: 500;">
        ${item.description || `Item #${idx + 1}`}
      </td>
      <td style="padding: 10px; color: #475569; font-size: 12px; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px; color: #475569; font-size: 12px; text-align: center;">${item.unit || "unit"}</td>
      <td style="padding: 10px; color: #475569; font-size: 12px; text-align: right; font-family: monospace;">₹${Number(item.rate || 0).toLocaleString("en-IN")}</td>
      <td style="padding: 10px; color: #0f172a; font-size: 13px; font-weight: 700; text-align: right; font-family: monospace;">₹${Number(item.amount || 0).toLocaleString("en-IN")}</td>
    </tr>
  `).join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tax Invoice #${invoice.invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 650px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #10b981;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">VASTHUSILPY ARCHITECTURAL CONSULTANTS</h1>
          <p style="color: #94a3b8; font-size: 12px; font-family: monospace; margin: 6px 0 0 0; text-transform: uppercase;">വാസ്തു, കെട്ടിട നിർമ്മാണ പ്ലാനുകൾ & സിവിൽ എഞ്ചിനീയറിംഗ്</p>
          <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0 0;">Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 9747995961, +91 7012383137</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 24px;">
          
          <!-- Top Invoice Title & Status -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 20px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">OFFICIAL TAX INVOICE</span>
              <h2 style="color: #0f172a; margin: 2px 0 0 0; font-size: 24px; font-weight: 900; font-family: monospace;">#${invoice.invoiceNumber}</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">Date: <strong>${invoice.invoiceDate}</strong> | Due Date: <strong style="color: #dc2626;">${invoice.dueDate}</strong></p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusColor}; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                ${statusLabel}
              </span>
            </div>
          </div>

          <!-- Client & Project Details Grid -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
            <tr>
              <td style="padding: 14px 16px; width: 50%; vertical-align: top; border-right: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">BILLED TO (CLIENT):</p>
                <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">${invoice.applicantName}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Mobile: <strong>+91 ${invoice.applicantMobile || "-"}</strong></p>
                ${invoice.applicantEmail ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Email: ${invoice.applicantEmail}</p>` : ''}
                ${invoice.applicantAddress ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">${invoice.applicantAddress}</p>` : ''}
              </td>
              <td style="padding: 14px 16px; width: 50%; vertical-align: top;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">PROJECT PARTICULARS:</p>
                <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${invoice.projectTitle || "Architectural & Engineering Services"}</p>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #475569;">Consultant: <strong>Deepak C (Vasthusilpy)</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">UPI ID: <strong>${invoice.upiId || "7012383137@naviaxis"}</strong></p>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background-color: #0f172a; color: #ffffff;">
                  <th style="padding: 10px; font-size: 11px; font-weight: 700; width: 35px; text-align: center;">SL</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 700;">DESCRIPTION</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 700; text-align: center; width: 50px;">QTY</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 700; text-align: center; width: 50px;">UNIT</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 700; text-align: right; width: 85px;">RATE</th>
                  <th style="padding: 10px; font-size: 11px; font-weight: 700; text-align: right; width: 95px;">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Pricing & Totals Summary -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
            <table style="width: 280px; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Subtotal:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace; color: #1e293b;">₹${Number(invoice.subTotal || invoice.grandTotal || 0).toLocaleString("en-IN")}</td>
              </tr>
              ${invoice.discount > 0 ? `
              <tr>
                <td style="padding: 6px 0; color: #dc2626;">Discount:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace; color: #dc2626;">- ₹${Number(invoice.discount).toLocaleString("en-IN")}</td>
              </tr>` : ''}
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">Grand Total:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 900; font-size: 15px; font-family: monospace; color: #0f172a;">₹${Number(invoice.grandTotal || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #059669;">Total Paid:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace; color: #059669;">₹${Number(invoice.totalPaid || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr style="background-color: #fee2e2; border-radius: 8px;">
                <td style="padding: 10px; font-weight: 900; color: #991b1b;">BALANCE DUE:</td>
                <td style="padding: 10px; text-align: right; font-weight: 900; font-size: 16px; font-family: monospace; color: #991b1b;">₹${Number(requiredAmount).toLocaleString("en-IN")}</td>
              </tr>
            </table>
          </div>

          <!-- Payment QR & Direct Pay Box -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px dashed #10b981; border-radius: 18px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #d1fae5; border: 1px solid #34d399; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
              <span style="color: #065f46; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">💳 INSTANT UPI PAYMENT & QR CODE</span>
            </div>
            
            <h3 style="color: #065f46; font-size: 17px; margin: 0 0 6px 0; font-weight: 900;">
              Required Payment Amount: ₹${Number(requiredAmount).toLocaleString("en-IN")}
            </h3>
            <p style="color: #047857; font-size: 12px; margin: 0 0 16px 0;">
              Scan the QR Code below using Google Pay, PhonePe, Paytm, or BHIM to pay instantly.
            </p>

            <!-- Embedded QR Code Image -->
            <div style="display: inline-block; background: #ffffff; padding: 12px; border-radius: 16px; border: 1px solid #a7f3d0; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);">
              <img src="${qrImageUrl}" alt="Payment QR Code for ₹${requiredAmount}" width="220" height="220" style="display: block; margin: 0 auto; border-radius: 8px;" />
            </div>

            <!-- Instant UPI Pay Link Button -->
            <div style="margin-top: 18px;">
              <a href="${upiPayUri}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                💳 Click to Pay with UPI (GPay / PhonePe / Paytm) →
              </a>
            </div>
            
            <p style="margin: 12px 0 0 0; font-size: 11px; color: #047857; font-family: monospace;">
              UPI ID: <strong>${invoice.upiId || "7012383137@naviaxis"}</strong>
            </p>
          </div>

          <!-- Bank Account Transfer Details -->
          <div style="background-color: #0f172a; color: #f8fafc; border-radius: 14px; padding: 18px 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">
              🏦 DIRECT BANK ACCOUNT TRANSFER (NEFT / RTGS / IMPS):
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 4px 0; color: #94a3b8; width: 40%;">Bank Name:</td>
                <td style="padding: 4px 0; color: #f8fafc; font-weight: 700;">State Bank of India (SBI), Keralassery</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #94a3b8;">Account Number:</td>
                <td style="padding: 4px 0; color: #34d399; font-weight: 900; font-family: monospace; font-size: 13px;">1062 5047 526</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #94a3b8;">IFSC Code:</td>
                <td style="padding: 4px 0; color: #fbbf24; font-weight: 900; font-family: monospace;">SBIN0007624</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #94a3b8;">Account Name:</td>
                <td style="padding: 4px 0; color: #f8fafc; font-weight: 600;">Vasthusilpy Architectural Consultants</td>
              </tr>
            </table>
          </div>

          <!-- PDF Attachment Notice -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 12px; color: #475569; margin-bottom: 20px;">
            <p style="margin: 0; line-height: 1.5;">
              📎 <strong>Attached Invoice:</strong> The official tax invoice document (<strong>Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf</strong>) is attached to this email for your official records and printing.
            </p>
            ${customNotes ? `<p style="margin: 8px 0 0 0; color: #0f172a;"><strong>Special Note:</strong> ${customNotes}</p>` : ''}
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 4px 0;">Vasthusilpy Architectural & Engineering Consultants • Keralassery, Palakkad, Kerala</p>
            <p style="margin: 0;">For inquiries or support, reply directly to this email or call <strong>+91 9747995961</strong> / <strong>+91 7012383137</strong>.</p>
          </div>

        </div>

      </div>
    </body>
    </html>
  `;

  let lastError: any = null;

  for (const senderUser of candidateUsers) {
    const configsToTry = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: senderUser, pass },
      },
      {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: senderUser, pass },
      },
      {
        service: "gmail",
        auth: { user: senderUser, pass },
      }
    ];

    for (const config of configsToTry) {
      try {
        const transporter = nodemailer.createTransport(config);

        const attachments: any[] = [];
        if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
          attachments.push({
            filename: `Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf`,
            content: Buffer.from(pdfBase64, "base64"),
            contentType: "application/pdf"
          });
        }

        await transporter.sendMail({
          from: `"Vasthusilpy Consultants" <${senderUser}>`,
          to: recipientEmail,
          subject: `📄 Tax Invoice #${invoice.invoiceNumber} from Vasthusilpy Consultants (Due: ₹${Number(requiredAmount).toLocaleString("en-IN")})`,
          text: `Dear ${invoice.applicantName},\n\nPlease find your attached Tax Invoice #${invoice.invoiceNumber} from Vasthusilpy Consultants.\n\nGrand Total: ₹${invoice.grandTotal}\nTotal Paid: ₹${invoice.totalPaid}\nBalance Due: ₹${requiredAmount}\n\nInstant Payment Link (UPI): ${upiPayUri}\nScan QR Link: ${qrImageUrl}\n\nBank Transfer Details:\nSBI Keralassery | A/C: 1062 5047 526 | IFSC: SBIN0007624\n\nVasthusilpy Architectural & Engineering Consultants\nPh: +91 9747995961, +91 7012383137`,
          html: htmlContent,
          attachments: attachments
        });

        console.log(`[Invoice Email Dispatched] Successfully sent invoice #${invoice.invoiceNumber} to ${recipientEmail} via ${senderUser}`);
        return { success: true, senderEmail: senderUser };
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  console.error(`[Invoice Email Error] Failed to send invoice email to ${recipientEmail}:`, lastError?.message || lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to dispatch invoice email via Gmail service."
  };
}

// API endpoint to automatically send invoice email from Gmail
app.post("/api/invoices/send-email", async (req, res) => {
  try {
    const { invoice, recipientEmail, pdfBase64, customNotes, upiPayUri, qrImageUrl, requiredAmount } = req.body;

    if (!invoice || !invoice.invoiceNumber) {
      return res.status(400).json({ error: "Invoice data is required." });
    }

    const cleanEmail = (recipientEmail || invoice.applicantEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "A valid recipient email address is required." });
    }

    const result = await sendInvoiceEmailToClient({
      invoice,
      recipientEmail: cleanEmail,
      pdfBase64,
      customNotes,
      upiPayUri,
      qrImageUrl,
      requiredAmount
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Invoice #${invoice.invoiceNumber} successfully emailed to ${cleanEmail} from ${result.senderEmail || "deepak.vasthusilpy@gmail.com"} with payment link, QR code, and attached PDF.`,
        senderEmail: result.senderEmail || "deepak.vasthusilpy@gmail.com"
      });
    } else {
      return res.status(500).json({
        error: result.error || "Failed to dispatch invoice email."
      });
    }
  } catch (error: any) {
    console.error("Error in /api/invoices/send-email endpoint:", error);
    return res.status(500).json({ error: error.message || "Internal server error while sending invoice email." });
  }
});

// Helper function to dispatch Application Form Email with optional PDF Attachment
interface ApplicationFormEmailPayload {
  recipientEmail: string;
  subject: string;
  formName: string;
  formNameMl?: string;
  applicantName: string;
  customMessage?: string;
  pdfBase64?: string;
  entryValues?: Record<string, any>;
  fieldsSchema?: Array<{ key: string; label: string; labelMl?: string }>;
  refId?: string;
}

async function sendApplicationFormEmailToRecipient(data: ApplicationFormEmailPayload): Promise<{ success: boolean; error?: string; senderEmail?: string }> {
  const {
    recipientEmail,
    subject,
    formName,
    formNameMl,
    applicantName,
    customMessage,
    pdfBase64,
    entryValues = {},
    fieldsSchema = [],
    refId = `APP-${Date.now().toString().slice(-6)}`
  } = data;

  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  rawHost = rawHost.replace(/^[a-zA-Z]*:?\/\//, "").replace(/\/.*$/, "").trim();
  if (!rawHost || rawHost === "gmail.com") {
    rawHost = "smtp.gmail.com";
  }

  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "bsfmxhvjzuippjjr").trim().replace(/\s+/g, "");
  const primaryUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "deepak.vasthusilpy@gmail.com").trim();

  const candidateUsers = Array.from(new Set([
    primaryUser,
    "dibindeepak1@gmail.com",
    "deepak.vasthusilpy@gmail.com"
  ])).filter(Boolean);

  // Generate table rows for the entry values
  const fieldsRowsHtml = fieldsSchema.length > 0
    ? fieldsSchema.map((fld, idx) => {
        const val = entryValues[fld.key];
        const displayVal = val === undefined || val === null || val === "" ? "—" : String(val);
        return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
            <td style="padding: 9px 12px; color: #475569; font-weight: 600; width: 45%; font-size: 13px;">
              ${fld.labelMl || fld.label}
            </td>
            <td style="padding: 9px 12px; color: #0f172a; font-weight: 700; font-size: 13px;">
              ${displayVal}
            </td>
          </tr>
        `;
      }).join("")
    : Object.entries(entryValues).map(([k, v], idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 9px 12px; color: #475569; font-weight: 600; width: 45%; font-size: 13px;">${k}</td>
          <td style="padding: 9px 12px; color: #0f172a; font-weight: 700; font-size: 13px;">${String(v)}</td>
        </tr>
      `).join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; padding: 24px; color: #1e293b; margin: 0;">
      <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 26px 30px; color: #ffffff;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #a5b4fc; font-weight: 700; margin-bottom: 4px;">
            VASTHUSILPY ARCHITECTURAL CONSULTANCY • APPLICATION FORM
          </div>
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
            ${formNameMl || formName}
          </h1>
          <div style="margin-top: 6px; font-size: 12px; color: #cbd5e1;">
            റഫറൻസ് നമ്പർ (Ref ID): <span style="font-family: monospace; font-weight: 700; color: #38bdf8;">${refId}</span>
          </div>
        </div>

        <div style="padding: 24px 30px;">
          <!-- Applicant Badge Box -->
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px;">അപേക്ഷകന്റെ വിവരങ്ങൾ (Applicant Details)</div>
            <div style="font-size: 16px; font-weight: 700; color: #0f172a;">${applicantName}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">ഫോം: ${formName}</div>
          </div>

          ${customMessage ? `
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 0 10px 10px 0; margin-bottom: 22px; font-size: 13px; line-height: 1.6; color: #166534; white-space: pre-wrap;">${customMessage}</div>
          ` : ''}

          <!-- Particulars Table -->
          <div style="margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              പൂരിപ്പിച്ച അപേക്ഷാ വിവരങ്ങൾ (Application Particulars)
            </div>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <tbody>
                ${fieldsRowsHtml}
              </tbody>
            </table>
          </div>

          ${pdfBase64 ? `
            <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #1e40af; margin-bottom: 20px; display: flex; align-items: center;">
              📎 <strong>A4 PDF ഡോക്യുമെന്റ് ഈ ഇമെയിലിനൊപ്പം അറ്റാച്ച് ചെയ്തിട്ടുണ്ട് (A4 PDF Attached).</strong>
            </div>
          ` : ''}

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
            This email was generated automatically by the Vasthusilpy Consultancy Application System.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // Attachments configuration
  const attachments: any[] = [];
  if (pdfBase64) {
    const cleanFileName = `${formName.replace(/[^a-zA-Z0-9]/g, "_")}_${applicantName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    attachments.push({
      filename: cleanFileName,
      content: Buffer.from(pdfBase64, "base64"),
      contentType: "application/pdf"
    });
  }

  let lastError: any = null;
  for (const senderUser of candidateUsers) {
    const configs = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: senderUser, pass }
      },
      {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: { user: senderUser, pass }
      },
      {
        service: "gmail",
        auth: { user: senderUser, pass }
      }
    ];

    for (const config of configs) {
      try {
        const transporter = nodemailer.createTransport(config);
        await transporter.sendMail({
          from: `"Vasthusilpy Engineering" <${senderUser}>`,
          to: recipientEmail,
          subject: subject || `[${formName}] - ${applicantName} (Ref: ${refId})`,
          html: htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined
        });

        console.log(`[Application Form Dispatched] Successfully mailed to ${recipientEmail} from ${senderUser}`);
        return { success: true, senderEmail: senderUser };
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  console.error(`[Application Form Mail Error] Failed to send email to ${recipientEmail}:`, lastError?.message || lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to dispatch application form email via SMTP."
  };
}

// API endpoint to dispatch application form email to desired address
app.post("/api/application-forms/send-email", async (req, res) => {
  try {
    const {
      recipientEmail,
      subject,
      formName,
      formNameMl,
      applicantName,
      customMessage,
      pdfBase64,
      entryValues,
      fieldsSchema,
      refId
    } = req.body;

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return res.status(400).json({ error: "A valid recipient email address is required." });
    }

    if (!applicantName && !formName) {
      return res.status(400).json({ error: "Applicant name and form name are required." });
    }

    const result = await sendApplicationFormEmailToRecipient({
      recipientEmail: recipientEmail.trim().toLowerCase(),
      subject,
      formName: formName || "Application Form",
      formNameMl,
      applicantName: applicantName || "അപേക്ഷകൻ",
      customMessage,
      pdfBase64,
      entryValues,
      fieldsSchema,
      refId
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `'${recipientEmail}' എന്ന വിലാസത്തിലേക്ക് അപേക്ഷ വിജയകരമായി അയച്ചു.`,
        senderEmail: result.senderEmail
      });
    } else {
      return res.status(500).json({
        error: result.error || "Failed to dispatch application email."
      });
    }
  } catch (error: any) {
    console.error("Error in /api/application-forms/send-email endpoint:", error);
    return res.status(500).json({ error: error.message || "Internal server error while sending application form email." });
  }
});

// Helper function to dispatch Payment Receipt & Closed Invoice Email directly from Gmail
interface ReceiptEmailPayload {
  invoice: any;
  payment?: any;
  recipientEmail: string;
  pdfBase64?: string;
  customNotes?: string;
  portalUrl?: string;
  receiptPdfUrl?: string;
}

async function sendPaymentReceiptEmailToClient(data: ReceiptEmailPayload): Promise<{ success: boolean; error?: string; senderEmail?: string }> {
  const {
    invoice,
    payment,
    recipientEmail,
    pdfBase64,
    customNotes,
    portalUrl,
    receiptPdfUrl
  } = data;

  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  rawHost = rawHost.replace(/^[a-zA-Z]*:?\/\//, "").replace(/\/.*$/, "").trim();
  if (!rawHost || rawHost === "gmail.com") {
    rawHost = "smtp.gmail.com";
  }

  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "bsfmxhvjzuippjjr").trim().replace(/\s+/g, "");
  const primaryUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "deepak.vasthusilpy@gmail.com").trim();

  const candidateUsers = Array.from(new Set([
    primaryUser,
    "dibindeepak1@gmail.com",
    "deepak.vasthusilpy@gmail.com"
  ])).filter(Boolean);

  const isPaid = invoice.paymentStatus === "PAID" || (invoice.grandTotal > 0 && (invoice.balanceDue || 0) <= 0);
  const paymentAmount = payment ? payment.amount : (invoice.totalPaid || 0);
  const receiptNo = payment?.receiptNumber || `REC-${invoice.invoiceNumber}-${payment?.id ? String(payment.id).slice(-4) : "TX"}`;
  const receiptDate = payment?.date || new Date().toISOString().split("T")[0];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt & Invoice Statement #${invoice.invoiceNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
      <div style="max-width: 650px; margin: 24px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
        
        <!-- Header Banner -->
        <div style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #10b981;">
          <div style="display: inline-block; background-color: #022c22; border: 1px solid #34d399; border-radius: 9999px; padding: 5px 16px; margin-bottom: 12px;">
            <span style="color: #6ee7b7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">OFFICIAL PAYMENT RECEIPT</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">VASTHUSILPY ARCHITECTURAL CONSULTANTS</h1>
          <p style="color: #94a3b8; font-size: 12px; font-family: monospace; margin: 6px 0 0 0; text-transform: uppercase;">വാസ്തു, കെട്ടിട നിർമ്മാണ പ്ലാനുകൾ & സിവിൽ എഞ്ചിനീയറിംഗ്</p>
          <p style="color: #cbd5e1; font-size: 11px; margin: 4px 0 0 0;">Near Panchayath Office, Keralassery, Palakkad - 678641 | Ph: +91 9747995961, +91 7012383137</p>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 24px;">
          
          <!-- Top Receipt Identification & Status -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 20px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">RECEIPT NUMBER</span>
              <h2 style="color: #065f46; margin: 2px 0 0 0; font-size: 24px; font-weight: 900; font-family: monospace;">${receiptNo}</h2>
              <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0;">Date: <strong>${receiptDate}</strong> | Invoice Ref: <strong>#${invoice.invoiceNumber}</strong></p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background-color: ${isPaid ? '#d1fae5' : '#fef3c7'}; color: ${isPaid ? '#065f46' : '#92400e'}; border: 1px solid ${isPaid ? '#34d399' : '#f59e0b'}; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isPaid ? '🎉 INVOICE FULLY SETTLED' : '⏳ PARTIALLY PAID'}
              </span>
            </div>
          </div>

          <!-- Client & Project Details Grid -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
            <tr>
              <td style="padding: 14px 16px; width: 50%; vertical-align: top; border-right: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">RECEIVED FROM:</p>
                <p style="margin: 0; font-size: 15px; font-weight: 800; color: #0f172a;">${invoice.applicantName}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Mobile: <strong>+91 ${invoice.applicantMobile || "-"}</strong></p>
                ${invoice.applicantEmail ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #475569;">Email: ${invoice.applicantEmail}</p>` : ''}
              </td>
              <td style="padding: 14px 16px; width: 50%; vertical-align: top;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">PROJECT REFERENCE:</p>
                <p style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a;">${invoice.projectTitle || "Architectural & Engineering Services"}</p>
                <p style="margin: 6px 0 0 0; font-size: 12px; color: #475569;">Consultant: <strong>Deepak C (Vasthusilpy)</strong></p>
              </td>
            </tr>
          </table>

          <!-- Payment Details Box -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 2px solid #10b981; border-radius: 16px; padding: 22px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 800; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">AMOUNT RECEIVED IN THIS TRANSACTION:</p>
            <p style="margin: 0; font-size: 32px; font-weight: 900; color: #047857; font-family: monospace;">₹${Number(paymentAmount).toLocaleString("en-IN")}</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #047857; width: 40%;">Payment Mode:</td>
                <td style="padding: 4px 0; color: #064e3b; font-weight: 700;">${payment?.paymentMode || "Bank payment / UPI"}</td>
              </tr>
              ${payment?.referenceNo ? `
              <tr>
                <td style="padding: 4px 0; color: #047857;">Transaction / Ref No:</td>
                <td style="padding: 4px 0; color: #064e3b; font-weight: 700; font-family: monospace;">${payment.referenceNo}</td>
              </tr>` : ''}
              ${payment?.account ? `
              <tr>
                <td style="padding: 4px 0; color: #047857;">Credited To:</td>
                <td style="padding: 4px 0; color: #064e3b; font-weight: 700;">${payment.account}</td>
              </tr>` : ''}
              ${payment?.memo ? `
              <tr>
                <td style="padding: 4px 0; color: #047857;">Memo / Notes:</td>
                <td style="padding: 4px 0; color: #064e3b; font-weight: 600;">${payment.memo}</td>
              </tr>` : ''}
            </table>
          </div>

          <!-- Account Reconciliation Statement -->
          <div style="background-color: #0f172a; color: #f8fafc; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 1px;">
              📊 ACCOUNT RECONCILIATION SUMMARY:
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Total Invoice Amount:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 700; font-family: monospace;">₹${Number(invoice.grandTotal || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #34d399;">Total Amount Paid to Date:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 800; font-family: monospace; color: #34d399;">₹${Number(invoice.totalPaid || 0).toLocaleString("en-IN")}</td>
              </tr>
              <tr style="border-top: 1px solid #334155;">
                <td style="padding: 8px 0; font-weight: 700; color: #f8fafc;">Outstanding Balance Due:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 900; font-size: 15px; font-family: monospace; color: ${isPaid ? '#34d399' : '#f87171'};">
                  ${isPaid ? '₹0.00 (FULLY SETTLED)' : `₹${Number(invoice.balanceDue || 0).toLocaleString("en-IN")}`}
                </td>
              </tr>
            </table>
          </div>

          <!-- Online View & Cloud Storage Link -->
          <div style="text-align: center; margin-bottom: 24px;">
            ${portalUrl ? `
            <a href="${portalUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px; margin: 4px;">
              📄 View Verified Invoice & Receipt Online →
            </a>` : ''}
            ${receiptPdfUrl ? `
            <a href="${receiptPdfUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #38bdf8; border: 1px solid #38bdf8; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 12px; margin: 4px;">
              ☁️ Open Cloud Stored PDF
            </a>` : ''}
          </div>

          <!-- PDF Attachment Notice -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; font-size: 12px; color: #475569; margin-bottom: 20px;">
            <p style="margin: 0; line-height: 1.5;">
              📎 <strong>Attached Receipt:</strong> The official Payment Receipt PDF document (<strong>Payment_Receipt_${invoice.invoiceNumber}.pdf</strong>) is attached to this email.
            </p>
            ${customNotes ? `<p style="margin: 8px 0 0 0; color: #0f172a;"><strong>Special Note:</strong> ${customNotes}</p>` : ''}
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; line-height: 1.6; text-align: center;">
            <p style="margin: 0 0 4px 0;">Vasthusilpy Architectural & Engineering Consultants • Keralassery, Palakkad, Kerala</p>
            <p style="margin: 0;">For inquiries or support, reply directly to this email or call <strong>+91 9747995961</strong> / <strong>+91 7012383137</strong>.</p>
          </div>

        </div>

      </div>
    </body>
    </html>
  `;

  let lastError: any = null;

  for (const senderUser of candidateUsers) {
    const configsToTry = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: senderUser, pass },
      },
      {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: senderUser, pass },
      },
      {
        service: "gmail",
        auth: { user: senderUser, pass },
      }
    ];

    for (const config of configsToTry) {
      try {
        const transporter = nodemailer.createTransport(config);

        const attachments: any[] = [];
        if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
          attachments.push({
            filename: `Payment_Receipt_Invoice_${invoice.invoiceNumber}_Vasthusilpy.pdf`,
            content: Buffer.from(pdfBase64, "base64"),
            contentType: "application/pdf"
          });
        }

        await transporter.sendMail({
          from: `"Vasthusilpy Consultants" <${senderUser}>`,
          to: recipientEmail,
          subject: `🧾 Official Payment Receipt #${receiptNo} - Invoice #${invoice.invoiceNumber} (₹${Number(paymentAmount).toLocaleString("en-IN")})`,
          text: `Dear ${invoice.applicantName},\n\nThank you for your payment of ₹${Number(paymentAmount).toLocaleString("en-IN")} towards Invoice #${invoice.invoiceNumber}.\n\nReceipt Number: ${receiptNo}\nReceipt Date: ${receiptDate}\nPayment Mode: ${payment?.paymentMode || "Bank payment / UPI"}\nTotal Paid: ₹${invoice.totalPaid}\nBalance Due: ₹${invoice.balanceDue || 0}\nStatus: ${isPaid ? "Fully Settled" : "Partially Paid"}\n\nOnline Receipt Link: ${portalUrl || "https://vasthusilpyai.netlify.app"}\n\nVasthusilpy Architectural & Engineering Consultants\nPh: +91 9747995961, +91 7012383137`,
          html: htmlContent,
          attachments: attachments
        });

        console.log(`[Payment Receipt Email Dispatched] Successfully sent receipt #${receiptNo} to ${recipientEmail} via ${senderUser}`);
        return { success: true, senderEmail: senderUser };
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  console.error(`[Payment Receipt Email Error] Failed to send receipt email to ${recipientEmail}:`, lastError?.message || lastError);
  return {
    success: false,
    error: lastError?.message || "Failed to dispatch payment receipt email via Gmail service."
  };
}

// API endpoint to automatically send payment receipt email from Gmail
app.post("/api/invoices/send-receipt-email", async (req, res) => {
  try {
    const { invoice, payment, recipientEmail, pdfBase64, customNotes, portalUrl, receiptPdfUrl } = req.body;

    if (!invoice || !invoice.invoiceNumber) {
      return res.status(400).json({ error: "Invoice data is required." });
    }

    const cleanEmail = (recipientEmail || invoice.applicantEmail || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "A valid recipient email address is required." });
    }

    const result = await sendPaymentReceiptEmailToClient({
      invoice,
      payment,
      recipientEmail: cleanEmail,
      pdfBase64,
      customNotes,
      portalUrl,
      receiptPdfUrl
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Payment receipt for Invoice #${invoice.invoiceNumber} successfully emailed to ${cleanEmail} from ${result.senderEmail || "deepak.vasthusilpy@gmail.com"} with attached PDF.`,
        senderEmail: result.senderEmail || "deepak.vasthusilpy@gmail.com"
      });
    } else {
      return res.status(500).json({
        error: result.error || "Failed to dispatch payment receipt email."
      });
    }
  } catch (error: any) {
    console.error("Error in /api/invoices/send-receipt-email endpoint:", error);
    return res.status(500).json({ error: error.message || "Internal server error while sending payment receipt email." });
  }
});

import { registerApplicationFormsRoutes } from "./src/server/applicationFormsServer.ts";
import { registerCrmRoutes } from "./src/server/crmServer.ts";
import { registerWebDataRoutes } from "./src/server/webDataServer.ts";

// Register Application Forms CRUD, PDF Overlay Generator, and Email Endpoints
registerApplicationFormsRoutes(app);

// Register CRM Projects & Invoices Durable Persistence Endpoints
registerCrmRoutes(app);

// Register Comprehensive Web Data & User Profile Synchronization Endpoints
registerWebDataRoutes(app);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Vasthusilpy AI Agent Backend" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const cwdDist = path.join(process.cwd(), "dist");
    const dirDist = path.resolve(currentDirname);
    const distPath = fs.existsSync(path.join(cwdDist, "index.html")) ? cwdDist : dirDist;
    
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vasthusilpy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
