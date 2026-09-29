import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

let isSigningIn = false;
let pendingSignInPromise: Promise<{ user: User; accessToken: string } | null> | null = null;
let cachedAccessToken: string | null = typeof window !== "undefined" ? localStorage.getItem("vasthusilpy_google_token") : null;

export const clearCachedGoogleToken = () => {
  cachedAccessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("vasthusilpy_google_token");
  }
};

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (forceConsent: boolean = true): Promise<{ user: User; accessToken: string } | null> => {
  if (!auth) {
    throw new Error('Firebase Auth is not available in current environment.');
  }

  // If a popup request is already in progress, reuse the existing promise to prevent auth/cancelled-popup-request
  if (pendingSignInPromise) {
    return pendingSignInPromise;
  }

  pendingSignInPromise = (async () => {
    try {
      isSigningIn = true;
      const authProvider = new GoogleAuthProvider();
      authProvider.addScope('https://www.googleapis.com/auth/gmail.send');
      authProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
      authProvider.addScope('https://www.googleapis.com/auth/documents');
      authProvider.addScope('https://www.googleapis.com/auth/documents.readonly');
      authProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
      authProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

      if (forceConsent) {
        authProvider.setCustomParameters({
          prompt: 'select_account consent',
          access_type: 'offline'
        });
      }

      const result = await signInWithPopup(auth, authProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to obtain Google OAuth Access Token.');
      }

      cachedAccessToken = credential.accessToken;
      if (typeof window !== "undefined") {
        localStorage.setItem("vasthusilpy_google_token", credential.accessToken);
      }
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      const errorCode = error?.code || "";
      const errorMsg = error?.message || "";
      const errorStr = String(error?.toString ? error.toString() : error || "");

      // Handle expected user cancellations, popup closures, or concurrent requests gracefully without throwing/logging errors
      if (
        errorCode === "auth/cancelled-popup-request" ||
        errorCode === "auth/popup-closed-by-user" ||
        errorCode === "auth/popup-blocked" ||
        errorMsg.includes("cancelled-popup-request") ||
        errorMsg.includes("popup-closed-by-user") ||
        errorMsg.includes("popup-blocked") ||
        errorStr.includes("cancelled-popup-request") ||
        errorStr.includes("popup-closed-by-user") ||
        errorStr.includes("popup-blocked")
      ) {
        console.info("[Google Workspace] Sign-in popup was closed, cancelled, or superseded by another request.");
        return null;
      }

      console.error('Google Workspace Sign-In Error:', error);
      throw error;
    } finally {
      isSigningIn = false;
      pendingSignInPromise = null;
    }
  })();

  return pendingSignInPromise;
};

export const getCachedToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("vasthusilpy_google_token");
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  }
  return null;
};

export const ensureGoogleAccessToken = async (forceConsent: boolean = false): Promise<string> => {
  if (!forceConsent) {
    const token = getCachedToken();
    if (token) return token;
  }

  // Sign in with Google to get fresh token with all scopes
  const res = await googleSignIn(true);
  if (!res?.accessToken) {
    throw new Error('Google authorization was cancelled or closed. Please click Connect to authorize.');
  }
  return res.accessToken;
};

export interface GoogleDocRecord {
  id: number;
  title: string;
  docType: 'doc' | 'sheet';
  googleId: string;
  webUrl: string;
  createdAt: string;
}

export async function createGoogleDocApi(title: string, content: string, token: string) {
  const res = await fetch('/api/google/create-doc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, accessToken: token })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create Google Doc.');
  }

  return await res.json();
}

export async function createGoogleSheetApi(title: string, rows: (string | number)[][], token: string) {
  const res = await fetch('/api/google/create-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, rows, accessToken: token })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create Google Sheet.');
  }

  return await res.json();
}

export async function fetchSavedGoogleDocsSheetsApi(): Promise<GoogleDocRecord[]> {
  const res = await fetch('/api/db/google-docs-sheets');
  if (!res.ok) return [];
  return await res.json();
}

export async function deleteGoogleDocSheetApi(id: number) {
  const res = await fetch(`/api/db/google-docs-sheets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete Google Doc/Sheet record.');
  return await res.json();
}
