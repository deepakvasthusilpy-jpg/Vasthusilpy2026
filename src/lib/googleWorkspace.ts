import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Reuse existing Firebase App if initialized
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/gmail.compose');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/documents.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== "undefined" ? localStorage.getItem("vasthusilpy_google_token") : null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
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

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
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
    console.error('Google Workspace Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
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

export const ensureGoogleAccessToken = async (): Promise<string> => {
  const token = getCachedToken();
  if (token) return token;

  // Sign in with Google to get fresh token with Gmail scopes
  const res = await googleSignIn();
  if (!res?.accessToken) {
    throw new Error('Google authorization required to send emails directly from Gmail.');
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
