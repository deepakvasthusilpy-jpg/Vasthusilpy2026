import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, inMemoryPersistence, setPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, setLogLevel } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

let app: any;
let authInstance: any;
let storageInstance: any;
let dbInstance: any;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  setPersistence(authInstance, inMemoryPersistence).catch(() => {});
} catch (e) {
  console.warn("Firebase Auth initialization notice:", e);
}

try {
  storageInstance = app ? getStorage(app) : null;
} catch (e) {
  console.warn("Firebase Storage offline fallback notice:", e);
}

try {
  // Suppress transient backend connection / offline retry logs
  setLogLevel("silent");
} catch {
  // Ignore if setLogLevel is not supported in current environment
}

try {
  const firestoreDatabaseId = (firebaseConfig as any)?.firestoreDatabaseId;
  const firestoreSettings = {
    // Enable long polling to prevent WebSocket connection failures in sandbox/iframe environments
    experimentalForceLongPolling: true,
  };

  if (app) {
    try {
      dbInstance = firestoreDatabaseId
        ? initializeFirestore(app, firestoreSettings, firestoreDatabaseId)
        : initializeFirestore(app, firestoreSettings);
    } catch {
      // Fallback if initializeFirestore was already called previously
      dbInstance = firestoreDatabaseId
        ? getFirestore(app, firestoreDatabaseId)
        : getFirestore(app);
    }
  } else {
    dbInstance = null;
  }
} catch (e) {
  console.warn("Firebase Firestore offline fallback notice:", e);
}

export const auth = authInstance || null;
export const storage = storageInstance || null;
export const db = dbInstance || null;

export const FIREBASE_PROJECT_ID = (firebaseConfig as any)?.projectId || "vasthusilpy-web";

export const PRIMARY_ADMIN_EMAILS = [
  "deepak.vasthusilpy@gmail.com",
  "dibindeepak1@gmail.com"
];

export const AUTHORIZED_SIGNING_EMAILS = [
  "deepak.vasthusilpy@gmail.com",
  "dibindeepak1@gmail.com"
];

export const PRIMARY_ALLOWED_PHONES = [
  "9567627277",
  "7012383137",
  "9747995961",
  "9496354421",
  "9447470421"
];

/**
 * Uploads a formatted Payment Receipt PDF Blob to Cloud Storage if available,
 * or gracefully returns offline success fallback.
 */
export async function uploadReceiptPdfToStorage(
  pdfBlob: Blob,
  invoiceNumber: string,
  receiptNo: string,
  extraMetadata?: Record<string, string>
): Promise<{ success: boolean; downloadUrl?: string; storagePath: string; error?: string }> {
  const cleanInvoiceNo = (invoiceNumber || "INV").replace(/[^a-zA-Z0-9-_]/g, "_");
  const cleanReceiptNo = (receiptNo || `REC_${Date.now()}`).replace(/[^a-zA-Z0-9-_]/g, "_");
  const storagePath = `receipts/${cleanInvoiceNo}/${cleanReceiptNo}.pdf`;

  if (!storage) {
    return {
      success: true,
      storagePath,
      downloadUrl: URL.createObjectURL(pdfBlob)
    };
  }

  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: "application/pdf",
      customMetadata: {
        invoiceNumber: cleanInvoiceNo,
        receiptNo: cleanReceiptNo,
        uploadedAt: new Date().toISOString(),
        issuer: "Vasthusilpy Consultants",
        ...(extraMetadata || {})
      }
    };

    const snapshot = await uploadBytes(storageRef, pdfBlob, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      downloadUrl,
      storagePath
    };
  } catch (err: any) {
    // Offline local URL fallback
    return {
      success: true,
      storagePath,
      downloadUrl: URL.createObjectURL(pdfBlob)
    };
  }
}

export function isPrimaryAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return PRIMARY_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.trim().toLowerCase());
}

export function canUseDigitalSignatures(email?: string | null): boolean {
  if (!email) return false;
  return AUTHORIZED_SIGNING_EMAILS.map(e => e.toLowerCase()).includes(email.trim().toLowerCase());
}

export function isPrimaryAllowedPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return PRIMARY_ALLOWED_PHONES.includes(last10);
}

export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

export function emailToDocId(email?: string | null): string {
  if (!email || typeof email !== "string") return "anonymous_user";
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, "_");
}

export default app;

