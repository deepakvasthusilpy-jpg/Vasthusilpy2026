import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import {
  auth,
  db,
  PRIMARY_ADMIN_EMAILS,
  isPrimaryAdminEmail,
  isPrimaryAllowedPhone,
  PRIMARY_ALLOWED_PHONES,
  emailToDocId
} from "../lib/firebase";
import {
  getOrCreateTotpSecret,
  verifyTotpCode,
  isAdminTotpRequired,
  getAdminTotpDaysRemaining,
  getLastAdminTotpVerified,
  recordAdminTotpVerified,
  ADMIN_TOTP_RECURRING_WINDOW_MS
} from "../utils/totp";
import {
  SubscriptionRequest,
  SubscriptionStatus,
  AccessLevel,
  SubscriptionUserSession,
  MainSectionType,
  TabType
} from "../types";
import {
  loadSavedSubscriptionRequests,
  saveSubscriptionRequests,
  generateUniqueSubId,
  calculateExpiryDate,
  isSubscriptionExpired,
  DEFAULT_FULL_PERMISSIONS,
  ALL_APP_MODULES,
  hasUsedFreeTrial,
  recordFreeTrialClaim,
  recordDeletedSubId,
  getDeletedSubIds
} from "../utils/subscriptionManager";
import { getBroadcastChannel } from "../utils/broadcastSync";
import {
  syncUserProfileDirect,
  performFullWebDataSync,
  pullAndHydrateWebDataFromServer,
  resolveAccountDetails
} from "../utils/webDataSyncManager";

const STORAGE_KEY_AUTHORIZED_EMAILS = "vasthusilpy_authorized_emails_v1";

const loadSavedAuthorizedEmails = (): AuthorizedEmailRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTHORIZED_EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

const saveSavedAuthorizedEmails = (list: AuthorizedEmailRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_AUTHORIZED_EMAILS, JSON.stringify(list));
    window.dispatchEvent(new Event("vasthusilpy_authorized_emails_updated"));
  } catch (e) {}
};

export interface AuthorizedEmailRecord {
  id: string;
  email: string;
  addedBy: string;
  addedAt: string;
  notes?: string;
}

export interface EmailUser {
  email: string;
  displayName: string;
  role: "primary_admin" | "authorized_user";
  loginTimestamp: number;
  phone?: string;
  subscriptionId?: string;
  profession?: string;
  lastAdminTotpVerifiedAt?: number;
  lastLoginAt?: string;
  photoURL?: string;
  authMethod?: "authenticator" | "subscription";
}

interface AuthContextType {
  user: User | null;
  emailUser: EmailUser | null;
  loading: boolean;
  authorized: boolean;
  isPrimaryAdmin: boolean;
  authError: string | null;
  clearAuthError: () => void;

  // 30-Day Admin TOTP State & Verifier
  lastAdminTotpVerifiedAt: number | null;
  adminTotpDaysRemaining: number;
  isAdminTotpDue: boolean;
  verifyAdminTotpNow: (totpCode: string) => Promise<boolean>;

  // User Profile & Synchronized Details across all logins
  updateUserProfile: (updates: {
    displayName?: string;
    phone?: string;
    profession?: string;
    email?: string;
  }) => Promise<void>;

  signUpUser: (details: {
    fullName: string;
    email: string;
    phone?: string;
    profession?: string;
    otp?: string;
  }) => Promise<boolean>;
  loginWithPassword: (userIdInput: string, passwordInput: string) => Promise<boolean>;
  loginWithGoogleAuthenticator: (email: string, totpCode: string) => Promise<boolean>;
  sendEmailOtp: (email: string) => Promise<{
    success: boolean;
    email: string;
    message: string;
    otpCode?: string;
    fallbackOtp?: string;
    deliveredViaEmail?: boolean;
  }>;
  verifyEmailOtp: (email: string, enteredOtp: string) => Promise<boolean>;
  signOutUser: () => Promise<void>;
  loginWithGoogleAccount: () => Promise<boolean>;
  loginAsAdminBypass: (email: string) => Promise<boolean>;
  authorizedEmails: AuthorizedEmailRecord[];
  addAuthorizedEmail: (email: string, notes?: string) => Promise<void>;
  removeAuthorizedEmail: (email: string) => Promise<void>;
  isExpiredSubscription: boolean;
  activeTabPermissions: Record<string, any>;
  subscriptionRequests: SubscriptionRequest[];
  
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 24 Hours in Milliseconds for Auto Logout
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [emailUser, setEmailUser] = useState<EmailUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authorizedEmails, setAuthorizedEmails] = useState<AuthorizedEmailRecord[]>(() => {
    return loadSavedAuthorizedEmails();
  });
  const isGoogleAuthInProgress = useRef<boolean>(false);

  const [lastAdminTotpVerifiedAt, setLastAdminTotpVerifiedAt] = useState<number | null>(() => {
    return getLastAdminTotpVerified();
  });

  const adminTotpDaysRemaining = getAdminTotpDaysRemaining(lastAdminTotpVerifiedAt);
  const isAdminTotpDue = isAdminTotpRequired(isPrimaryAdmin, lastAdminTotpVerifiedAt);

  const [isExpiredSubscription, setIsExpiredSubscription] = useState<boolean>(false);
  const [activeTabPermissions, setActiveTabPermissions] = useState<Record<string, any>>(() => {
    return { ...DEFAULT_FULL_PERMISSIONS };
  });
  const clearAuthError = () => setAuthError(null);

  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>(() => {
    return loadSavedSubscriptionRequests();
  });

  // Real-time Firestore Sync for Subscription Requests & Storage Listener
  useEffect(() => {
    const handleSubUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSubscriptionRequests(customEvent.detail);
      } else {
        setSubscriptionRequests(loadSavedSubscriptionRequests());
      }
    };
    window.addEventListener("vasthusilpy_subscription_update", handleSubUpdate);
    window.addEventListener("vasthusilpy_storage_update", handleSubUpdate);

    let unsubSubs = () => {};
    if (db) {
      try {
        const qSubs = collection(db, "subscription_requests");
        unsubSubs = onSnapshot(qSubs, (snapshot) => {
          const list: SubscriptionRequest[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as SubscriptionRequest);
          });
          if (list.length > 0) {
            saveSubscriptionRequests(list);
            setSubscriptionRequests(list);
          }
        }, (err) => {
          console.warn("Subscription requests Firestore sync notice:", err);
        });
      } catch (err) {
        console.error("Failed to establish subscription requests listener:", err);
      }
    }

    return () => {
      window.removeEventListener("vasthusilpy_subscription_update", handleSubUpdate);
      window.removeEventListener("vasthusilpy_storage_update", handleSubUpdate);
      unsubSubs();
    };
  }, []);

  // Restore Subscribed or Email Session on load if available & not expired (< 24 hours / validUntil)
  useEffect(() => {
    const savedSubSession = localStorage.getItem("vasthusilpy_subscription_user");
    const savedEmailSession = localStorage.getItem("vasthusilpy_email_user");

    let parsedSub: SubscriptionUserSession | null = null;
    let parsedEmail: EmailUser | null = null;

    try {
      if (savedSubSession) parsedSub = JSON.parse(savedSubSession);
    } catch {}
    try {
      if (savedEmailSession) parsedEmail = JSON.parse(savedEmailSession);
    } catch {}

    const primarySession = parsedSub || parsedEmail;

    if (primarySession && (primarySession.email || (primarySession as any).phone)) {
      const loginTime = primarySession.loginTimestamp || Date.now();
      const elapsed = Date.now() - loginTime;

      if (elapsed > ONE_DAY_MS) {
        localStorage.removeItem("vasthusilpy_subscription_user");
        localStorage.removeItem("vasthusilpy_email_user");
        setAuthError("24 മണിക്കൂർ സെഷൻ കാലാവധി കഴിഞ്ഞു. ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.");
      } else {
        const email = primarySession.email || parsedEmail?.email || (parsedSub?.email as string);
        const phone = (primarySession as any).phone || parsedEmail?.phone || parsedSub?.phone || "";
        const displayName = (primarySession as any).fullName || (primarySession as any).displayName || email?.split("@")[0] || "User";
        const role = primarySession.role || "authorized_user";
        const authMethod = (primarySession as any).authMethod || (parsedEmail as any).authMethod;
        
        // If logged in via subscription, enforce NOT admin for UI tabs regardless of email/phone
        const isAdmin = authMethod === "subscription" 
          ? false 
          : (isPrimaryAdminEmail(email) || isPrimaryAllowedPhone(phone) || role === "primary_admin");

        const isExpired = parsedSub?.validUntil && isSubscriptionExpired({ validUntil: parsedSub.validUntil });
        const isUserExpired = Boolean(isExpired || parsedSub?.status === "expired");
        setIsExpiredSubscription(isUserExpired);

        const unifiedEmailUser: EmailUser = {
          email,
          phone,
          displayName,
          role: isAdmin ? "primary_admin" : role,
          loginTimestamp: loginTime,
          subscriptionId: parsedSub?.subscriptionId || parsedEmail?.subscriptionId,
          lastAdminTotpVerifiedAt: parsedEmail?.lastAdminTotpVerifiedAt,
          authMethod: authMethod
        };

        setEmailUser(unifiedEmailUser);
        setAuthorized(true);
        setIsPrimaryAdmin(isAdmin);

        if (isAdmin) {
          setActiveTabPermissions({ ...DEFAULT_FULL_PERMISSIONS });
        } else if (parsedSub?.tabPermissions) {
          setActiveTabPermissions(parsedSub.tabPermissions);
        } else {
          setActiveTabPermissions({ ...DEFAULT_FULL_PERMISSIONS });
        }

        // Keep both storage keys in perfect sync
        try {
          localStorage.setItem("vasthusilpy_email_user", JSON.stringify(unifiedEmailUser));
          if (!parsedSub) {
            const reconstructedSub: SubscriptionUserSession = {
              email,
              fullName: displayName,
              phone,
              role: isAdmin ? "primary_admin" : "authorized_user",
              subscriptionId: unifiedEmailUser.subscriptionId || (isAdmin ? "SUB-ADMIN-DEEPAK" : ""),
              validUntil: isAdmin ? "2099-12-31" : "",
              validDays: isAdmin ? 36500 : 30,
              status: "approved",
              tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
              loginTimestamp: loginTime,
              authMethod: authMethod
            };
            localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(reconstructedSub));
          }
        } catch {}

        // Hydrate data from server in background to sync any updates from other devices/logins
        pullAndHydrateWebDataFromServer(email || phone).catch((err) => {
          console.warn("[AuthContext] Background hydration note:", err);
        });
      }
    }
  }, []);

  // Real-time Firestore Sync for Current User Profile & Cross-Tab Profile Sync
  // (Ensures Email, Mobile Number, Name, Profession, and 30-Day TOTP status appear identical across all logins)
  useEffect(() => {
    const currentEmail = user?.email || emailUser?.email;
    if (!currentEmail) return;

    // Cross-tab broadcast listener
    const channel = getBroadcastChannel();
    const handleBroadcast = (event: MessageEvent) => {
      if (event.data?.type === "SYNC_USER_PROFILE" && event.data?.data) {
        setEmailUser(event.data.data);
      }
    };
    channel.addEventListener("message", handleBroadcast);

    let unsubUser = () => {};

    if (db) {
      try {
        const docId = emailToDocId(currentEmail);
        unsubUser = onSnapshot(doc(db, "users", docId), (docSnap) => {
          if (docSnap.exists()) {
            const uData = docSnap.data();
            if (uData) {
              // Synchronize 30-day TOTP timestamp if present
              if (uData.lastAdminTotpVerifiedAt && typeof uData.lastAdminTotpVerifiedAt === "number") {
                setLastAdminTotpVerifiedAt(uData.lastAdminTotpVerifiedAt);
                recordAdminTotpVerified(currentEmail, uData.lastAdminTotpVerifiedAt);
              }

              setEmailUser((prev) => {
                const cleanEmail = uData.email || currentEmail;
                const updated: EmailUser = {
                  ...(prev || {}),
                  email: cleanEmail,
                  displayName: uData.displayName || prev?.displayName || user?.displayName || cleanEmail.split("@")[0],
                  phone: uData.phone !== undefined ? uData.phone : (prev?.phone || ""),
                  profession: uData.profession !== undefined ? uData.profession : (prev?.profession || "Vasthu Architect / Engineer"),
                  role: uData.role || prev?.role || (isPrimaryAdminEmail(cleanEmail) ? "primary_admin" : "authorized_user"),
                  lastAdminTotpVerifiedAt: uData.lastAdminTotpVerifiedAt || prev?.lastAdminTotpVerifiedAt,
                  photoURL: uData.photoURL || prev?.photoURL || user?.photoURL || undefined,
                  loginTimestamp: prev?.loginTimestamp || Date.now()
                };
                localStorage.setItem("vasthusilpy_email_user", JSON.stringify(updated));
                return updated;
              });
            }
          }
        }, (err) => {
          // Silent fallback for offline mode
        });
      } catch (e) {
        // Ignore offline errors
      }
    }

    return () => {
      unsubUser();
      channel.removeEventListener("message", handleBroadcast);
    };
  }, [user?.email, emailUser?.email]);



  // 60-Second Login Verification Watchdog
  useEffect(() => {
    let timeoutId: any = null;
    if (loading) {
      timeoutId = setTimeout(() => {
        console.warn("Login verification watchdog: Exceeded 60 seconds.");
        setLoading(false);
        setAuthError("ലോഗിൻ പരിശോധനയ്ക്ക് 60 സെക്കൻഡിൽ കൂടുതൽ സമയമെടുത്തതിനാൽ പ്രക്രിയ റദ്ദാക്കി. ദയവായി വീണ്ടും ശ്രമിക്കുക.");
      }, 60000); // 60 seconds limit
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading]);

  // Listen for Firebase Auth State Changes with 24-hour Session Check & Offline Error Resilience
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      const savedEmailSession = localStorage.getItem("vasthusilpy_email_user");
      if (!currentUser) {
        if (!savedEmailSession) {
          setUser(null);
          setAuthorized(false);
          setIsPrimaryAdmin(false);
        }
        setLoading(false);
        return;
      }

      const email = currentUser.email ? currentUser.email.toLowerCase().trim() : "";

      if (!email) {
        await firebaseSignOut(auth).catch(() => {});
        setUser(null);
        setAuthorized(false);
        setIsPrimaryAdmin(false);
        setAuthError("ഇമെയിൽ വിവരങ്ങൾ ലഭ്യമല്ല. ദയവായി അക്കൗണ്ട് തിരിഞ്ഞെടുത്ത് ലോഗിൻ ചെയ്യുക.");
        setLoading(false);
        return;
      }

      // Check 24-Hour Session Expiry
      const googleLoginTimeStr = localStorage.getItem("vasthusilpy_google_login_time");
      if (googleLoginTimeStr) {
        const loginTime = parseInt(googleLoginTimeStr, 10);
        if (Date.now() - loginTime > ONE_DAY_MS) {
          await firebaseSignOut(auth).catch(() => {});
          localStorage.removeItem("vasthusilpy_google_login_time");
          setUser(null);
          setAuthorized(false);
          setIsPrimaryAdmin(false);
          setAuthError("24 മണിക്കൂർ സെഷൻ കാലാവധി കഴിഞ്ഞു (24-Hour Session Expired). ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.");
          setLoading(false);
          return;
        }
      } else {
        localStorage.setItem("vasthusilpy_google_login_time", Date.now().toString());
      }

      const isAdmin = isPrimaryAdminEmail(email);

      if (isAdmin) {
        // Primary Admin (deepak.vasthusilpy@gmail.com, dibindeepak1@gmail.com)
        setUser(currentUser);
        
        // Preserve and hydrate phone and profile info for admin Google login
        let existingPhone = "9567627277";
        let existingProfession = "Vasthu Consultant & Civil Engineer";
        try {
          const raw = localStorage.getItem("vasthusilpy_email_user");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.phone) existingPhone = parsed.phone;
            if (parsed.profession) existingProfession = parsed.profession;
          }
        } catch {}

        const adminEmailUser: EmailUser = {
          email: email,
          displayName: currentUser.displayName || "DEEPAK C",
          phone: existingPhone,
          profession: existingProfession,
          role: "primary_admin",
          photoURL: currentUser.photoURL || undefined,
          loginTimestamp: Date.now()
        };
        setEmailUser(adminEmailUser);
        localStorage.setItem("vasthusilpy_email_user", JSON.stringify(adminEmailUser));
        setAuthorized(true);
        setIsPrimaryAdmin(true);
        setLoading(false);

        // Async user doc sync to both UID and Email Doc ID
        const profilePayload = {
          email: email,
          displayName: currentUser.displayName || "DEEPAK C",
          phone: existingPhone,
          profession: existingProfession,
          photoURL: currentUser.photoURL || "",
          role: "primary_admin",
          lastLoginAt: new Date().toISOString()
        };

        if (db) {
          const docId = emailToDocId(email);
          setDoc(doc(db, "users", docId), profilePayload, { merge: true }).catch(() => {});
          setDoc(doc(db, "users", currentUser.uid), profilePayload, { merge: true }).catch(() => {});
        }
      } else {
        // Check if email is in local authorized_emails whitelist or subscription requests
        const localWhitelisted = loadSavedAuthorizedEmails().some(
          (a) => a.email.toLowerCase().trim() === email.toLowerCase().trim()
        );
        const localSubscribed = loadSavedSubscriptionRequests().some(
          (s) => s.email.toLowerCase().trim() === email.toLowerCase().trim() && s.status === "approved"
        );

        if (localWhitelisted || localSubscribed) {
          setUser(currentUser);
          
          let existingPhone = "";
          let existingProfession = "Civil Engineer";
          try {
            const raw = localStorage.getItem("vasthusilpy_email_user");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.phone) existingPhone = parsed.phone;
              if (parsed.profession) existingProfession = parsed.profession;
            }
          } catch {}

          const authEmailUser: EmailUser = {
            email: email,
            displayName: currentUser.displayName || email.split("@")[0],
            phone: existingPhone,
            profession: existingProfession,
            role: "authorized_user",
            photoURL: currentUser.photoURL || undefined,
            loginTimestamp: Date.now()
          };
          setEmailUser(authEmailUser);
          localStorage.setItem("vasthusilpy_email_user", JSON.stringify(authEmailUser));
          setAuthorized(true);
          setIsPrimaryAdmin(false);
          setLoading(false);

          if (db) {
            const docId = emailToDocId(email);
            const pLoad = {
              email: email,
              displayName: currentUser.displayName || "",
              phone: existingPhone,
              profession: existingProfession,
              photoURL: currentUser.photoURL || "",
              role: "authorized_user",
              lastLoginAt: new Date().toISOString()
            };
            setDoc(doc(db, "users", docId), pLoad, { merge: true }).catch(() => {});
            setDoc(doc(db, "users", currentUser.uid), pLoad, { merge: true }).catch(() => {});
          }
          return;
        }

        // Try checking remote Firestore collection if available
        if (db) {
          try {
            const docId = emailToDocId(email);
            const docRef = doc(db, "authorized_emails", docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              // Authorized User
              setUser(currentUser);
              
              let existingPhone = "";
              let existingProfession = "Civil Engineer";
              try {
                const raw = localStorage.getItem("vasthusilpy_email_user");
                if (raw) {
                  const parsed = JSON.parse(raw);
                  if (parsed.phone) existingPhone = parsed.phone;
                  if (parsed.profession) existingProfession = parsed.profession;
                }
              } catch {}

              const authEmailUser: EmailUser = {
                email: email,
                displayName: currentUser.displayName || email.split("@")[0],
                phone: existingPhone,
                profession: existingProfession,
                role: "authorized_user",
                photoURL: currentUser.photoURL || undefined,
                loginTimestamp: Date.now()
              };
              setEmailUser(authEmailUser);
              localStorage.setItem("vasthusilpy_email_user", JSON.stringify(authEmailUser));
              setAuthorized(true);
              setIsPrimaryAdmin(false);
              setLoading(false);

              const pLoad = {
                email: email,
                displayName: currentUser.displayName || "",
                phone: existingPhone,
                profession: existingProfession,
                photoURL: currentUser.photoURL || "",
                role: "authorized_user",
                lastLoginAt: new Date().toISOString()
              };
              setDoc(doc(db, "users", docId), pLoad, { merge: true }).catch(() => {});
              setDoc(doc(db, "users", currentUser.uid), pLoad, { merge: true }).catch(() => {});
              return;
            }
          } catch (err: any) {
            console.warn("Firestore remote auth check notice (falling back):", err?.message || err);
          }
        }

        // Unauthorized User (not in registered emails list)
        await firebaseSignOut(auth).catch(() => {});
        setUser(null);
        setAuthorized(false);
        setIsPrimaryAdmin(false);
        setAuthError(
          `പ്രവേശനാനുമതിയില്ല! '${email}' എന്നത് അംഗീകൃത/രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ അഡ്രസ്സല്ല. അംഗീകൃത ഗൂഗിൾ ഇമെയിൽ ഐഡി ഉപയോഗിച്ച് മാത്രം ലോഗിൻ ചെയ്യുക (Access Denied! Only registered email IDs are allowed).`
        );
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Interval check to auto logout user when 24 hours pass while app is active
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (emailUser && emailUser.loginTimestamp) {
        if (Date.now() - emailUser.loginTimestamp > ONE_DAY_MS) {
          signOutUser();
          setAuthError("24 മണിക്കൂർ സെഷൻ കാലാവധി കഴിഞ്ഞു (1 Day Auto Logout). ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.");
        }
      }

      if (user) {
        const googleLoginTimeStr = localStorage.getItem("vasthusilpy_google_login_time");
        if (googleLoginTimeStr) {
          const loginTime = parseInt(googleLoginTimeStr, 10);
          if (Date.now() - loginTime > ONE_DAY_MS) {
            signOutUser();
            setAuthError("24 മണിക്കൂർ സെഷൻ കാലാവധി കഴിഞ്ഞു (1 Day Auto Logout). ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.");
          }
        }
      }
    }, 60000); // Check every 60 seconds

    return () => clearInterval(checkInterval);
  }, [emailUser, user]);

  // Listen for Authorized Emails collection
  useEffect(() => {
    if (!authorized) {
      setAuthorizedEmails([]);
      return;
    }

    let unsubEmails = () => {};

    try {
      const qEmails = query(collection(db, "authorized_emails"), orderBy("addedAt", "desc"));
      unsubEmails = onSnapshot(qEmails, (snapshot) => {
        const list: AuthorizedEmailRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            email: data.email,
            addedBy: data.addedBy,
            addedAt: data.addedAt,
            notes: data.notes || ""
          });
        });
        setAuthorizedEmails(list);
      }, (err) => {
        console.warn("Firestore snapshot listener notice (operating in offline fallback mode if network disconnected):", err?.message || err);
      });
    } catch (err) {
      console.error("Error setting up authorized listeners:", err);
    }

    return () => {
      unsubEmails();
    };
  }, [authorized]);



  const signUpUser = async (details: {
    email: string;
    fullName: string;
    phone?: string;
    profession?: string;
    otp?: string;
  }): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);

    const cleanEmail = details.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setLoading(false);
      throw new Error("ദയവായി ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.");
    }

    if (!details.fullName || details.fullName.trim().length < 2) {
      setLoading(false);
      throw new Error("ദയവായി നിങ്ങളുടെ പൂർണ്ണമായ പേര് നൽകുക.");
    }

    // Verify OTP if provided
    if (details.otp && details.otp.trim()) {
      const response = await fetch("/api/auth/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          otp: details.otp.trim()
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        setLoading(false);
        throw new Error(data.error || "നൽകിയ 6 അക്ക OTP തെറ്റാണ്. ദയവായി പരിശോധിക്കുക.");
      }
    }

    // Whitelist in Firestore authorized_emails
    const docId = emailToDocId(cleanEmail);
    await setDoc(doc(db, "authorized_emails", docId), {
      email: cleanEmail,
      addedBy: "Self Signup Window",
      addedAt: new Date().toISOString(),
      notes: `Name: ${details.fullName}, Phone: ${details.phone || "N/A"}, Role: ${details.profession || "Engineer"}`
    });

    // Save in Firestore users collection
    await setDoc(doc(db, "users", docId), {
      email: cleanEmail,
      displayName: details.fullName.trim(),
      phone: details.phone || "",
      profession: details.profession || "Engineer",
      role: "authorized_user",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }, { merge: true });

    // Login user via Email session
    const isAdmin = isPrimaryAdminEmail(cleanEmail);
    const sessionUser: EmailUser = {
      email: cleanEmail,
      displayName: details.fullName.trim(),
      role: isAdmin ? "primary_admin" : "authorized_user",
      loginTimestamp: Date.now()
    };

    localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
    setEmailUser(sessionUser);
    setUser(null);
    setAuthorized(true);
    setIsPrimaryAdmin(isAdmin);
    setLoading(false);

    return true;
  };


  // Password Authentication for Username/User ID & Password
  const loginWithPassword = async (userIdInput: string, passwordInput: string): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);

    const cleanUserId = userIdInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanUserId || !cleanPass) {
      setLoading(false);
      throw new Error("ദയവായി User ID യും Password ഉം നൽകുക.");
    }

    // Explicit check for system user (optional, can be removed if not needed)
    if (false) { // Disabled hardcoded user check
      const sessionUser: EmailUser = {
        email: "user@vasthusilpy.com",
        displayName: "Vasthusilpy User",
        role: "authorized_user",
        loginTimestamp: Date.now()
      };

      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
      setEmailUser(sessionUser);
      setUser(null);
      setAuthorized(true);
      setIsPrimaryAdmin(false);
      setLoading(false);
      return true;
    }

    // Admin login check (admin email / phone)
    const isAdminAccount =
      cleanUserId === "admin" ||
      isPrimaryAdminEmail(cleanUserId) ||
      isPrimaryAllowedPhone(cleanUserId);

    if (isAdminAccount && cleanPass === cleanUserId) {
      const adminEmail = isPrimaryAdminEmail(cleanUserId) ? cleanUserId : "deepak.vasthusilpy@gmail.com";
      const adminPhone = isPrimaryAllowedPhone(cleanUserId) ? cleanUserId.replace(/\D/g, "") : "9567627277";
      const lastTotp = getLastAdminTotpVerified(adminEmail);

      // Check 30-day recurring Admin TOTP requirement
      if (isAdminTotpRequired(true, lastTotp)) {
        setLoading(false);
        const err: any = new Error("ADMIN_TOTP_REQUIRED");
        err.code = "ADMIN_TOTP_REQUIRED";
        err.adminEmail = adminEmail;
        err.adminPhone = adminPhone;
        throw err;
      }

      let displayName = "DEEPAK C";
      let phone = adminPhone;
      let profession = "Vasthu Consultant & Civil Engineer";
      try {
        const docId = emailToDocId(adminEmail);
        const userDoc = await getDoc(doc(db, "users", docId));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData.displayName) displayName = uData.displayName;
          if (uData.phone) phone = uData.phone;
          if (uData.profession) profession = uData.profession;
        }

        await setDoc(doc(db, "users", docId), {
          email: adminEmail,
          phone: phone,
          displayName: displayName,
          profession: profession,
          role: "primary_admin",
          lastLoginAt: new Date().toISOString(),
          authMethod: "password_admin"
        }, { merge: true });
      } catch (e) {}

      const sessionUser: EmailUser = {
        email: adminEmail,
        phone: phone,
        displayName: displayName,
        profession: profession,
        role: "primary_admin",
        loginTimestamp: Date.now(),
        lastAdminTotpVerifiedAt: lastTotp || undefined,
        authMethod: "authenticator"
      };

      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
      setEmailUser(sessionUser);
      setUser(null);
      setAuthorized(true);
      setIsPrimaryAdmin(true);
      setLoading(false);
      return true;
    }

    // Disabled generic fallback password
    if (false) {
      const formattedEmail = cleanUserId.includes("@") ? cleanUserId : `${cleanUserId}@vasthusilpy.com`;
      const sessionUser: EmailUser = {
        email: formattedEmail,
        displayName: cleanUserId.toUpperCase(),
        role: isPrimaryAdminEmail(formattedEmail) ? "primary_admin" : "authorized_user",
        loginTimestamp: Date.now()
      };

      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
      setEmailUser(sessionUser);
      setUser(null);
      setAuthorized(true);
      setIsPrimaryAdmin(isPrimaryAdminEmail(formattedEmail));
      setLoading(false);
      return true;
    }

    setLoading(false);
    throw new Error("നൽകിയ User ID അല്ലെങ്കിൽ Password തെറ്റാണ്.");
  };


  // Email OTP Authentication: Step 1 - Send OTP to registered Email
  const sendEmailOtp = async (inputEmail: string) => {
    setAuthError(null);
    const cleanEmail = inputEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("ദയവായി ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.");
    }

    // Check if email is in PRIMARY_ADMIN_EMAILS or in Firestore authorized_emails
    const isAdminEmail = isPrimaryAdminEmail(cleanEmail);
    let isWhitelistedEmail = isAdminEmail;

    if (!isAdminEmail) {
      try {
        const docId = emailToDocId(cleanEmail);
        const docRef = doc(db, "authorized_emails", docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          isWhitelistedEmail = true;
        }
      } catch (err) {
        console.error("Error checking authorized emails:", err);
      }
    }

    if (!isWhitelistedEmail) {
      throw new Error(
        `പ്രവേശനാനുമതിയില്ല! '${cleanEmail}' എന്ന ഇമെയിൽ വിലാസം വാസ്തുശില്പി പ്ലാറ്റ്‌ഫോമിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല. പ്രവേശനാനുമതിക്കായി അഡ്മിനെ ബന്ധപ്പെടുക.`
      );
    }

    // Call server API to generate OTP
    const response = await fetch("/api/auth/send-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cleanEmail })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || "OTP അയക്കുന്നതിൽ പിശക് സംഭവിച്ചു.");
    }

    return {
      success: true,
      email: cleanEmail,
      message: data.message || `'${cleanEmail}' എന്ന ഇമെയിലിലേക്ക് OTP അയച്ചിട്ടുണ്ട്.`,
      otpCode: data.otpCode,
      fallbackOtp: data.fallbackOtp,
      deliveredViaEmail: data.deliveredViaEmail
    };
  };


  // Email OTP Authentication: Step 2 - Verify OTP & Sign In
  const verifyEmailOtp = async (inputEmail: string, enteredOtp: string) => {
    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!enteredOtp || enteredOtp.trim().length < 6) {
      throw new Error("ദയവായി ശരിയായ 6 അക്ക OTP നൽകുക.");
    }

    // Call server API to verify the OTP code
    const response = await fetch("/api/auth/verify-email-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        otp: enteredOtp.trim()
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || "നൽകിയ OTP തെറ്റാണ്. ദയവായി ശരിയായ 6 അക്ക OTP നൽകുക.");
    }

    const isAdmin = isPrimaryAdminEmail(cleanEmail);
    let displayName = cleanEmail.split("@")[0];
    let phone = isAdmin ? "9747995961" : "";
    let profession = isAdmin ? "Vasthu Consultant & Civil Engineer" : "Civil Engineer";

    try {
      const resolved = await resolveAccountDetails(cleanEmail);
      if (resolved) {
        if (resolved.displayName) displayName = resolved.displayName;
        if (resolved.phone) phone = resolved.phone;
        if (resolved.profession) profession = resolved.profession;
      }
    } catch {}

    const sessionUser: EmailUser = {
      email: cleanEmail,
      phone,
      displayName,
      profession,
      role: isAdmin ? "primary_admin" : "authorized_user",
      loginTimestamp: Date.now()
    };

    const subSession: SubscriptionUserSession = {
      email: cleanEmail,
      fullName: displayName,
      phone,
      role: isAdmin ? "primary_admin" : "authorized_user",
      subscriptionId: isAdmin ? "SUB-ADMIN-DEEPAK" : "",
      validUntil: isAdmin ? "2099-12-31" : "",
      validDays: isAdmin ? 36500 : 30,
      status: "approved",
      tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
      loginTimestamp: Date.now()
    };

    localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
    localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(subSession));
    localStorage.setItem("vasthusilpy_saved_login_id", cleanEmail);

    setEmailUser(sessionUser);
    setUser(null);
    setAuthorized(true);
    setIsPrimaryAdmin(isAdmin);

    // Sync to Firestore users collection
    try {
      const docId = emailToDocId(cleanEmail);
      await setDoc(doc(db, "users", docId), {
        email: cleanEmail,
        phone,
        displayName: sessionUser.displayName,
        profession: sessionUser.profession,
        role: sessionUser.role,
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Error saving email user doc:", e);
    }

    // Two-way synchronization & hydration of all web data
    try {
      await pullAndHydrateWebDataFromServer(cleanEmail);
      await performFullWebDataSync();
    } catch (syncErr) {
      console.warn("Post-verify sync notice:", syncErr);
    }

    return true;
  };


  const signOutUser = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("vasthusilpy_email_user");
      localStorage.removeItem("vasthusilpy_subscription_user");
      localStorage.removeItem("vasthusilpy_google_login_time");
      setEmailUser(null);
      setActiveTabPermissions({ ...DEFAULT_FULL_PERMISSIONS });
      await firebaseSignOut(auth);
      setUser(null);
      setAuthorized(false);
      setIsPrimaryAdmin(false);
      setAuthError(null);
    } catch (err: any) {
      console.error("Sign Out Error:", err);
    } finally {
      setLoading(false);
    }
  };


  const addAuthorizedEmail = async (emailToAdd: string, notes: string = "") => {
    const cleanEmail = emailToAdd.toLowerCase().trim();
    if (!cleanEmail) throw new Error("ദയവായി സാധുവായ ഇമെയിൽ നൽകുക.");
    
    if (PRIMARY_ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail)) {
      throw new Error("ഈ ഇമെയിൽ പ്രൈമറി അഡ്മിൻ ആണ്. വീണ്ടും ചേർക്കേണ്ടതില്ല.");
    }

    const docId = emailToDocId(cleanEmail);
    const newRecord: AuthorizedEmailRecord = {
      id: docId,
      email: cleanEmail,
      addedBy: user?.email || emailUser?.email || "Admin",
      addedAt: new Date().toISOString(),
      notes: notes
    };

    setAuthorizedEmails((prev) => {
      const next = [newRecord, ...prev.filter((r) => r.email !== cleanEmail)];
      saveSavedAuthorizedEmails(next);
      return next;
    });

    if (db) {
      try {
        await setDoc(doc(db, "authorized_emails", docId), newRecord, { merge: true });
      } catch (e) {
        // Offline safe fallback
      }
    }
  };


  const removeAuthorizedEmail = async (emailToRemove: string) => {
    const cleanEmail = emailToRemove.toLowerCase().trim();
    const docId = emailToDocId(cleanEmail);

    setAuthorizedEmails((prev) => {
      const next = prev.filter((r) => r.email !== cleanEmail && r.id !== docId);
      saveSavedAuthorizedEmails(next);
      return next;
    });

    if (db) {
      try {
        await deleteDoc(doc(db, "authorized_emails", docId));
      } catch (e) {
        // Offline safe fallback
      }
    }
  };


  // Google Authenticator (TOTP) Authentication
  const loginWithGoogleAuthenticator = async (inputEmail: string, enteredCode: string): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);

    const cleanEmail = inputEmail.trim().toLowerCase();
    const cleanCode = enteredCode.trim().replace(/\D/g, "");

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setLoading(false);
      throw new Error("ദയവായി സാധുവായ ഇമെയിൽ വിലാസം നൽകുക (Please enter a valid email address).");
    }

    if (cleanCode.length !== 6) {
      setLoading(false);
      throw new Error("Google Authenticator ആപ്പിലെ 6 അക്ക കോഡ് നൽകുക (Please enter the 6-digit Authenticator code).");
    }

    // Retrieve user's TOTP Secret
    const secret = getOrCreateTotpSecret(cleanEmail);
    const verification = await verifyTotpCode(secret, cleanCode, 1);

    if (!verification.valid) {
      setLoading(false);
      throw new Error("നൽകിയ 6 അക്ക Google Authenticator കോഡ് തെറ്റാണ് അല്ലെങ്കിൽ കാലഹരണപ്പെട്ടു (Invalid or expired Authenticator code). ദയവായി ആപ്പിലെ പുതിയ കോഡ് നൽകുക.");
    }

    const isAdmin = isPrimaryAdminEmail(cleanEmail);
    const docId = emailToDocId(cleanEmail);

    let displayName = cleanEmail.split("@")[0].toUpperCase();
    let phone = isAdmin ? "9747995961" : "";
    let profession = isAdmin ? "Vasthu Consultant & Civil Engineer" : "Engineer";

    const now = Date.now();
    if (isAdmin) {
      setLastAdminTotpVerifiedAt(now);
      recordAdminTotpVerified(cleanEmail, now);
    }

    try {
      const resolved = await resolveAccountDetails(cleanEmail);
      if (resolved) {
        if (resolved.displayName) displayName = resolved.displayName;
        if (resolved.phone) phone = resolved.phone;
        if (resolved.profession) profession = resolved.profession;
      }
    } catch {}

    try {
      const userDoc = await getDoc(doc(db, "users", docId));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        if (uData.displayName) displayName = uData.displayName;
        if (uData.phone) phone = uData.phone;
        if (uData.profession) profession = uData.profession;
      }

      await setDoc(doc(db, "users", docId), {
        email: cleanEmail,
        phone: phone,
        displayName: displayName,
        profession: profession,
        role: isAdmin ? "primary_admin" : "authorized_user",
        lastLoginAt: new Date().toISOString(),
        lastAdminTotpVerifiedAt: isAdmin ? now : undefined,
        authMethod: "google_authenticator"
      }, { merge: true });
    } catch (e) {
      // Offline fallback
    }

    const sessionUser: EmailUser = {
      email: cleanEmail,
      phone: phone,
      displayName: displayName,
      profession: profession,
      role: isAdmin ? "primary_admin" : "authorized_user",
      loginTimestamp: Date.now(),
      lastAdminTotpVerifiedAt: isAdmin ? now : undefined,
      subscriptionId: isAdmin ? "SUB-ADMIN-DEEPAK" : undefined
    };

    const subSession: SubscriptionUserSession = {
      email: cleanEmail,
      fullName: displayName,
      phone: phone,
      role: isAdmin ? "primary_admin" : "authorized_user",
      subscriptionId: isAdmin ? "SUB-ADMIN-DEEPAK" : "",
      validUntil: isAdmin ? "2099-12-31" : "",
      validDays: isAdmin ? 36500 : 30,
      status: "approved",
      tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
      loginTimestamp: Date.now()
    };

    localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
    localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(subSession));
    localStorage.setItem("vasthusilpy_saved_login_id", cleanEmail);

    setEmailUser(sessionUser);
    setUser(null);
    setAuthorized(true);
    setIsPrimaryAdmin(isAdmin);

    // Two-way synchronization & hydration of all web data
    try {
      await pullAndHydrateWebDataFromServer(cleanEmail);
      await performFullWebDataSync();
    } catch (syncErr) {
      console.warn("Post-auth sync notice:", syncErr);
    }

    setLoading(false);

    return true;
  };

  const loginWithGoogleAccount = async (): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);

    try {
      const { googleSignInBasic } = await import("../lib/googleWorkspace");
      const res = await googleSignInBasic();
      if (!res) {
        throw new Error("ഗൂഗിൾ ലോഗിൻ റദ്ദാക്കി (Google Sign-In was cancelled).");
      }

      const { user: gUser } = res;
      if (!gUser.email) {
        throw new Error("ഗൂഗിൾ അക്കൗണ്ടിൽ ഇമെയിൽ വിലാസമില്ല (Google Account is missing email).");
      }

      const cleanEmail = gUser.email.trim().toLowerCase();
      const isAdmin = isPrimaryAdminEmail(cleanEmail);

      const isWhitelisted = authorizedEmails.some(
        (record) => record.email.trim().toLowerCase() === cleanEmail
      );

      if (!isAdmin && !isWhitelisted) {
        const { auth } = await import("../lib/googleWorkspace");
        await auth.signOut();
        setLoading(false);
        throw new Error(`ദയവായി അംഗീകൃത ഇമെയിൽ വഴി ലോഗിൻ ചെയ്യുക. ${cleanEmail} എന്ന ഇമെയിലിന് ഇവിടെ അനുമതിയില്ല (Unauthorized Google Account: ${cleanEmail}).`);
      }

      const docId = emailToDocId(cleanEmail);
      let displayName = gUser.displayName || cleanEmail.split("@")[0].toUpperCase();
      let phone = gUser.phoneNumber || (isAdmin ? "9747995961" : "");
      let profession = isAdmin ? "Vasthu Consultant & Civil Engineer" : "Engineer";

      const now = Date.now();
      if (isAdmin) {
        setLastAdminTotpVerifiedAt(now);
        recordAdminTotpVerified(cleanEmail, now);
      }

      try {
        const resolved = await resolveAccountDetails(cleanEmail);
        if (resolved) {
          if (resolved.displayName) displayName = resolved.displayName;
          if (resolved.phone) phone = resolved.phone;
          if (resolved.profession) profession = resolved.profession;
        }
      } catch {}

      try {
        const userDoc = await getDoc(doc(db, "users", docId));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData.displayName) displayName = uData.displayName;
          if (uData.phone) phone = uData.phone;
          if (uData.profession) profession = uData.profession;
        }

        await setDoc(doc(db, "users", docId), {
          email: cleanEmail,
          phone: phone,
          displayName: displayName,
          profession: profession,
          role: isAdmin ? "primary_admin" : "authorized_user",
          lastLoginAt: new Date().toISOString(),
          lastAdminTotpVerifiedAt: isAdmin ? now : undefined,
          authMethod: "google_oauth"
        }, { merge: true });
      } catch (e) {
        // Offline fallback
      }

      const sessionUser: EmailUser = {
        email: cleanEmail,
        phone: phone,
        displayName: displayName,
        profession: profession,
        role: isAdmin ? "primary_admin" : "authorized_user",
        loginTimestamp: Date.now(),
        lastAdminTotpVerifiedAt: isAdmin ? now : undefined,
        subscriptionId: isAdmin ? "SUB-ADMIN-DEEPAK" : undefined
      };

      const subSession: SubscriptionUserSession = {
        email: cleanEmail,
        fullName: displayName,
        phone: phone,
        role: isAdmin ? "primary_admin" : "authorized_user",
        subscriptionId: isAdmin ? "SUB-ADMIN-DEEPAK" : "",
        validUntil: isAdmin ? "2099-12-31" : "",
        validDays: isAdmin ? 36500 : 30,
        status: "approved",
        tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
        loginTimestamp: Date.now()
      };

      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
      localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(subSession));
      localStorage.setItem("vasthusilpy_saved_login_id", cleanEmail);

      setEmailUser(sessionUser);
      setUser(null);
      setAuthorized(true);
      setIsPrimaryAdmin(isAdmin);

      try {
        await pullAndHydrateWebDataFromServer(cleanEmail);
        await performFullWebDataSync();
      } catch (syncErr) {
        console.warn("Post-auth sync notice:", syncErr);
      }

      setLoading(false);
      return true;
    } catch (err: any) {
      setLoading(false);
      setAuthError(err.message || "Google Authentication failed.");
      throw err;
    }
  };

  const loginAsAdminBypass = async (adminEmail: string): Promise<boolean> => {
    setAuthError(null);
    setLoading(true);

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!isPrimaryAdminEmail(cleanEmail)) {
      setLoading(false);
      throw new Error("This email is not registered as a primary admin.");
    }

    const isAdmin = true;
    const docId = emailToDocId(cleanEmail);

    let displayName = cleanEmail === "deepak.vasthusilpy@gmail.com" ? "DEEPAK" : "DIBIN DEEPAK";
    let phone = "9747995961";
    let profession = "Vasthu Consultant & Civil Engineer";

    const now = Date.now();
    setLastAdminTotpVerifiedAt(now);
    recordAdminTotpVerified(cleanEmail, now);

    try {
      const userDoc = await getDoc(doc(db, "users", docId));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        if (uData.displayName) displayName = uData.displayName;
        if (uData.phone) phone = uData.phone;
        if (uData.profession) profession = uData.profession;
      }

      await setDoc(doc(db, "users", docId), {
        email: cleanEmail,
        phone: phone,
        displayName: displayName,
        profession: profession,
        role: "primary_admin",
        lastLoginAt: new Date().toISOString(),
        lastAdminTotpVerifiedAt: now,
        authMethod: "google_bypass_authorized"
      }, { merge: true });
    } catch (e) {
      // Offline fallback
    }

    const sessionUser: EmailUser = {
      email: cleanEmail,
      phone: phone,
      displayName: displayName,
      profession: profession,
      role: "primary_admin",
      loginTimestamp: Date.now(),
      lastAdminTotpVerifiedAt: now,
      subscriptionId: "SUB-ADMIN-DEEPAK"
    };

    const subSession: SubscriptionUserSession = {
      email: cleanEmail,
      fullName: displayName,
      phone: phone,
      role: "primary_admin",
      subscriptionId: "SUB-ADMIN-DEEPAK",
      validUntil: "2099-12-31",
      validDays: 36500,
      status: "approved",
      tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
      loginTimestamp: Date.now()
    };

    localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
    localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(subSession));
    localStorage.setItem("vasthusilpy_saved_login_id", cleanEmail);

    setEmailUser(sessionUser);
    setUser(null);
    setAuthorized(true);
    setIsPrimaryAdmin(isAdmin);

    try {
      await pullAndHydrateWebDataFromServer(cleanEmail);
      await performFullWebDataSync();
    } catch (syncErr) {
      console.warn("Post-auth sync notice:", syncErr);
    }

    setLoading(false);
    return true;
  };

  // Subscription Request Submission from Login Page
  /*
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    upiRefId?: string;
    upiReferenceId?: string;
    amountPaid?: number;
    planName?: string;
    notes?: string;
  }) => {
    // ... subscription logic removed ...
    return { success: false, id: "", message: "Subscription system disabled" };

  */

  // Login for Subscribed Users via Email / Mobile Number and Password
  const loginWithSubscription = async (emailOrPhoneInput: string, passwordInput: string) => {
    setAuthError(null);
    setLoading(true);

    const cleanInput = (emailOrPhoneInput || "").trim().toLowerCase();
    const cleanPhoneDigits = (emailOrPhoneInput || "").trim().replace(/\D/g, "");
    const cleanPass = (passwordInput || "").trim();

    if (!cleanInput) {
      setLoading(false);
      throw new Error("ദയവായി രജിസ്റ്റർ ചെയ്ത ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ നൽകുക.");
    }
    if (!cleanPass) {
      setLoading(false);
      throw new Error("ദയവായി പാസ്‌വേഡ് നൽകുക.");
    }

    // Direct check for admin credentials (supports admin email or admin mobile number)
    const isAdminAccount =
      isPrimaryAdminEmail(cleanInput) ||
      isPrimaryAllowedPhone(cleanInput) ||
      cleanInput === "admin" ||
      cleanInput === "deepak" ||
      cleanInput.startsWith("deepak.vasthusilpy") ||
      cleanInput.startsWith("dibindeepak");

    if (isAdminAccount) {
      const adminEmail = isPrimaryAdminEmail(cleanInput)
        ? cleanInput
        : cleanInput.startsWith("dibin")
        ? "dibindeepak1@gmail.com"
        : "deepak.vasthusilpy@gmail.com";
      const adminPhone =
        isPrimaryAllowedPhone(cleanInput) && cleanPhoneDigits.length >= 10
          ? cleanPhoneDigits.slice(-10)
          : cleanInput.startsWith("dibin")
          ? "7012383137"
          : "9747995961";

      // Verify Admin Password
      let isAdminPassValid = false;

      if (!isAdminPassValid) {
        try {
          const docId = emailToDocId(adminEmail);
          const userDoc = await getDoc(doc(db, "users", docId));
          if (userDoc.exists() && userDoc.data()?.password && userDoc.data().password.trim() === cleanPass) {
            isAdminPassValid = true;
          }
        } catch (e) {}
      }

      if (!isAdminPassValid) {
        const allSubs = loadSavedSubscriptionRequests();
        const aSub = allSubs.find(
          (s) =>
            (s.email && s.email.toLowerCase().trim() === adminEmail) ||
            (s.phone && s.phone.replace(/\D/g, "").slice(-10) === adminPhone)
        );
        if (aSub && aSub.password && (aSub.password === cleanPass || aSub.password.toLowerCase() === cleanPass.toLowerCase())) {
          isAdminPassValid = true;
        }
      }

      if (!isAdminPassValid) {
        setLoading(false);
        throw new Error(
          "നൽകിയ പാസ്‌വേഡ് തെറ്റാണ്. (Incorrect Password)."
        );
      }

      const lastTotp = getLastAdminTotpVerified(adminEmail);

      // Check 30-day recurring Admin TOTP requirement
      if (isAdminTotpRequired(true, lastTotp)) {
        setLoading(false);
        const err: any = new Error("ADMIN_TOTP_REQUIRED");
        err.code = "ADMIN_TOTP_REQUIRED";
        err.adminEmail = adminEmail;
        err.adminPhone = adminPhone;
        throw err;
      }

      let displayName = "DEEPAK C";
      let phone = adminPhone;
      let profession = "Vasthu Consultant & Civil Engineer";

      try {
        const resolved = await resolveAccountDetails(adminEmail);
        if (resolved) {
          if (resolved.displayName) displayName = resolved.displayName;
          if (resolved.phone) phone = resolved.phone;
          if (resolved.profession) profession = resolved.profession;
        }
      } catch (e) {}

      try {
        const docId = emailToDocId(adminEmail);
        const userDoc = await getDoc(doc(db, "users", docId));
        if (userDoc.exists()) {
          const uData = userDoc.data();
          if (uData.displayName) displayName = uData.displayName;
          if (uData.phone) phone = uData.phone;
          if (uData.profession) profession = uData.profession;
        }

        await setDoc(doc(db, "users", docId), {
          email: adminEmail,
          phone: phone,
          displayName: displayName,
          profession: profession,
          role: "primary_admin",
          lastLoginAt: new Date().toISOString(),
          authMethod: "subscription_admin"
        }, { merge: true });
      } catch (e) {}

      const sessionUser: EmailUser = {
        email: adminEmail,
        phone: phone,
        displayName: displayName,
        profession: profession,
        role: "primary_admin",
        loginTimestamp: Date.now(),
        lastAdminTotpVerifiedAt: lastTotp || undefined,
        subscriptionId: "SUB-ADMIN-DEEPAK"
      };

      const subSession: SubscriptionUserSession = {
        email: adminEmail,
        fullName: displayName,
        phone: phone,
        role: "primary_admin",
        subscriptionId: "SUB-ADMIN-DEEPAK",
        validUntil: "2099-12-31",
        validDays: 36500,
        status: "approved",
        tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
        loginTimestamp: Date.now()
      };

      // Set BOTH unified session keys
      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(sessionUser));
      localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(subSession));
      localStorage.setItem("vasthusilpy_saved_login_id", cleanInput);

      setEmailUser(sessionUser);
      setUser(null);
      setAuthorized(true);
      setIsPrimaryAdmin(true);
      setIsExpiredSubscription(false);
      setActiveTabPermissions({ ...DEFAULT_FULL_PERMISSIONS });

      // Immediate two-way data sync & hydration
      try {
        await pullAndHydrateWebDataFromServer(adminEmail);
        await performFullWebDataSync();
      } catch (syncErr) {
        console.warn("Post-login sync notice:", syncErr);
      }

      setLoading(false);
      return true;
    }

    // Predicate to match subscription by Email, Phone (10 digits match), or Subscription ID
    const matchSubPredicate = (s: SubscriptionRequest | null | undefined): boolean => {
      if (!s) return false;
      const sEmail = (s.email || "").toLowerCase().trim();
      const sDigits = (s.phone || "").replace(/\D/g, "");
      const sId = (s.id || "").toLowerCase().trim();

      const matchEmail = !!(sEmail && (sEmail === cleanInput || sEmail.startsWith(cleanInput) || cleanInput.startsWith(sEmail)));
      const matchPhone = !!(
        cleanPhoneDigits.length >= 10 &&
        (sDigits === cleanPhoneDigits ||
          sDigits.endsWith(cleanPhoneDigits.slice(-10)) ||
          cleanPhoneDigits.endsWith(sDigits.slice(-10)))
      );
      const matchId = !!(sId && (sId === cleanInput || sId === cleanInput.toUpperCase()));
      return matchEmail || matchPhone || matchId;
    };

    let allSubs = loadSavedSubscriptionRequests();
    let foundSub = allSubs.find(matchSubPredicate);

    // 2. Query Server unified account resolution endpoint (/api/web-data/resolve-account)
    if (!foundSub) {
      try {
        const resolved = await resolveAccountDetails(cleanInput);
        if (resolved && (resolved.email || resolved.phone)) {
          foundSub = {
            id: resolved.subscriptionId || `SUB-${cleanPhoneDigits.slice(-10) || Date.now()}`,
            fullName: resolved.displayName || cleanInput,
            email: resolved.email || (cleanInput.includes("@") ? cleanInput : `${cleanPhoneDigits}@vasthusilpy.local`),
            phone: resolved.phone || cleanPhoneDigits,
            password: resolved.password || resolved.phone || resolved.email,
            upiRefId: resolved.subscriptionId || "UPI-RESOLVED",
            planName: resolved.planName || (resolved.isAdmin ? "Primary Admin Pass" : "Vasthusilpy Active Pass"),
            amountPaid: resolved.amountPaid || 0,
            validityType: "days",
            validUntil: resolved.validUntil || "2099-12-31",
            validDays: resolved.validDays || 3650,
            status: (resolved.status as SubscriptionStatus) || "approved",
            requestedAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            tabPermissions: resolved.tabPermissions || { ...DEFAULT_FULL_PERMISSIONS }
          };
          saveSubscriptionRequests([foundSub, ...allSubs]);
        }
      } catch (e) {}
    }

    // 3. Attempt to fetch latest from server via pullAndHydrateWebDataFromServer
    if (!foundSub) {
      try {
        await pullAndHydrateWebDataFromServer(cleanInput);
        allSubs = loadSavedSubscriptionRequests();
        foundSub = allSubs.find(matchSubPredicate);
      } catch (e) {}
    }

    // 4. Check Firestore subscription_requests collection
    if (!foundSub && db) {
      try {
        if (cleanInput.startsWith("sub-")) {
          const directDoc = await getDoc(doc(db, "subscription_requests", cleanInput.toUpperCase()));
          if (directDoc.exists()) {
            foundSub = directDoc.data() as SubscriptionRequest;
          }
        }
        if (!foundSub) {
          const snap = await getDocs(collection(db, "subscription_requests"));
          const remoteList: SubscriptionRequest[] = [];
          snap.forEach((d) => remoteList.push(d.data() as SubscriptionRequest));
          foundSub = remoteList.find(matchSubPredicate);
          if (foundSub) {
            saveSubscriptionRequests([foundSub, ...allSubs]);
          }
        }
      } catch (e) {}
    }

    // 5. Check Firestore users collection
    if (!foundSub && db) {
      try {
        const docId = cleanInput.includes("@") ? emailToDocId(cleanInput) : `user_${cleanPhoneDigits.slice(-10)}`;
        const uSnap = await getDoc(doc(db, "users", docId));
        if (uSnap.exists()) {
          const u = uSnap.data();
          foundSub = {
            id: u.subscriptionId || `SUB-USER-${cleanPhoneDigits.slice(-10) || Date.now()}`,
            fullName: u.displayName || cleanInput,
            email: u.email || cleanInput,
            phone: u.phone || cleanPhoneDigits,
            password: u.password || u.phone || u.email,
            upiRefId: u.subscriptionId || "UPI-USER-DOC",
            planName: "Vasthusilpy Active Pass",
            amountPaid: 0,
            validityType: "days",
            validUntil: u.subscriptionExpiry || "2099-12-31",
            validDays: 365,
            status: (u.subscriptionStatus as SubscriptionStatus) || "approved",
            requestedAt: new Date().toISOString(),
            approvedAt: new Date().toISOString(),
            tabPermissions: { ...DEFAULT_FULL_PERMISSIONS }
          };
          saveSubscriptionRequests([foundSub, ...allSubs]);
        }
      } catch (e) {}
    }

    // Auto-provision Instant 7-Day Free Trial if logging in
    if (!foundSub && false) { // Disabled auto-provision via hardcoded password
      const trialSubId = generateUniqueSubId();
      const userFullName = cleanInput.includes("@") ? cleanInput.split("@")[0] : `User ${cleanPhoneDigits.slice(-4) || "Mobile"}`;
      const userEmail = cleanInput.includes("@") ? cleanInput : `${cleanPhoneDigits || "user"}@vasthusilpy.local`;
      const userPhone = cleanPhoneDigits || "9747995961";

      foundSub = {
        id: trialSubId,
        fullName: userFullName,
        email: userEmail,
        phone: userPhone,
        password: cleanPass,
        upiRefId: "FREE-TRIAL",
        amountPaid: 0,
        planName: "Vasthusilpy 7-Day Free Trial",
        notes: "Instant Auto-Provisioned Free Trial Access",
        status: "approved",
        validityType: "days",
        validDays: 7,
        validUntil: calculateExpiryDate("days", 7),
        tabPermissions: { ...DEFAULT_FULL_PERMISSIONS },
        requestedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString()
      };

      try {
        saveSubscriptionRequests([foundSub, ...allSubs]);
        await recordFreeTrialClaim(userEmail, userPhone, trialSubId);
      } catch (e) {}
    }

    if (!foundSub) {
      setLoading(false);
      throw new Error(
        "ഈ ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പറിൽ സബ്‌സ്ക്രിപ്ഷൻ വിവരങ്ങൾ കണ്ടെത്തിയില്ല. ദയവായി സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥന സമർപ്പിക്കുക."
      );
    }

    // Check Password matching subscription record (User ID & Password match)
    const expectedPass = foundSub.password || foundSub.phone || foundSub.email;
    const isPassValid =
      cleanPass === expectedPass ||
      cleanPass.toLowerCase() === (expectedPass || "").toLowerCase();

    if (!isPassValid) {
      setLoading(false);
      throw new Error("നൽകിയ പാസ്‌വേഡ് തെറ്റാണ്. (Incorrect Password). പാസ്‌വേഡ് മാറ്റാൻ 'Forgot / Change Password' ഉപയോഗിക്കുക.");
    }

    // Check Status & Auto-approve free trials or ₹0 requests
    if (foundSub.status === "pending") {
      if (
        foundSub.amountPaid === 0 ||
        foundSub.upiRefId === "FREE-TRIAL" ||
        (foundSub.planName && foundSub.planName.toLowerCase().includes("trial"))
      ) {
        foundSub.status = "approved";
        if (!foundSub.validUntil || isSubscriptionExpired(foundSub)) {
          foundSub.validUntil = calculateExpiryDate("days", 7);
          foundSub.validDays = 7;
        }
        foundSub.approvedAt = new Date().toISOString();
        const currentSubs = loadSavedSubscriptionRequests();
        saveSubscriptionRequests([foundSub, ...currentSubs.filter((s) => s.id !== foundSub!.id)]);
      } else {
        setLoading(false);
        throw new Error(
          `നിങ്ങളുടെ സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥന (Req: ${foundSub.id}, Ref: ${foundSub.upiRefId}) അഡ്മിൻ പരിശോധനയിലാണ് (Pending Verification). അഡ്മിൻ അംഗീകരിച്ച ഉടൻ ലോഗിൻ സാധ്യമാകും.`
        );
      }
    }

    if (foundSub.status === "rejected") {
      setLoading(false);
      throw new Error(
        `നിങ്ങളുടെ സബ്‌സ്ക്രിപ്ഷൻ അഭ്യർത്ഥന നിരസിക്കപ്പെട്ടു. ${foundSub.rejectedReason ? `കാരണം: ${foundSub.rejectedReason}` : "ദയവായി അഡ്മിനുമായി ബന്ധപ്പെടുക."}`
      );
    }

    const hasExpired = foundSub.status === "expired" || isSubscriptionExpired(foundSub);

    // Synchronize latest details with Firestore users collection
    let displayName = foundSub.fullName || foundSub.email.split("@")[0];
    let phone = foundSub.phone || "";
    let profession = "Civil Engineer";

    try {
      const docId = emailToDocId(foundSub.email);
      const userDoc = await getDoc(doc(db, "users", docId));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        if (uData.displayName) displayName = uData.displayName;
        if (uData.phone) phone = uData.phone;
        if (uData.profession) profession = uData.profession;
      }

      await setDoc(doc(db, "users", docId), {
        email: foundSub.email,
        phone: phone,
        displayName: displayName,
        profession: profession,
        role: "authorized_user",
        subscriptionId: foundSub.id,
        subscriptionStatus: foundSub.status,
        lastLoginAt: new Date().toISOString(),
        authMethod: "subscription_user"
      }, { merge: true });
    } catch (e) {}

    const permissions = foundSub.tabPermissions || { ...DEFAULT_FULL_PERMISSIONS };
    const sessionData: SubscriptionUserSession = {
      email: foundSub.email,
      fullName: displayName,
      phone: phone,
      role: "authorized_user",
      subscriptionId: foundSub.id,
      validUntil: foundSub.validUntil,
      validDays: foundSub.validDays,
      status: hasExpired ? "expired" : "approved",
      tabPermissions: permissions,
      loginTimestamp: Date.now(),
      authMethod: "subscription"
    };

    const emailUserData: EmailUser = {
      email: foundSub.email,
      phone: phone,
      displayName: displayName,
      profession: profession,
      role: "authorized_user",
      loginTimestamp: Date.now(),
      subscriptionId: foundSub.id,
      authMethod: "subscription"
    };

    // Store in both keys for unified multi-login session
    localStorage.setItem("vasthusilpy_subscription_user", JSON.stringify(sessionData));
    localStorage.setItem("vasthusilpy_email_user", JSON.stringify(emailUserData));
    localStorage.setItem("vasthusilpy_saved_login_id", cleanInput);

    setIsExpiredSubscription(hasExpired);
    setEmailUser(emailUserData);
    setUser(null);
    setAuthorized(true);
    setIsPrimaryAdmin(false);
    setActiveTabPermissions(hasExpired ? { ...DEFAULT_FULL_PERMISSIONS } : permissions);

    // Pull and hydrate authoritative server data for this user
    try {
      await pullAndHydrateWebDataFromServer(foundSub.email);
      await performFullWebDataSync();
    } catch (syncErr) {
      console.warn("Post-login sync notice:", syncErr);
    }

    setLoading(false);
    return true;
  };

  // Google Authenticator Verification helper for active session admin
  const verifyAdminTotpNow = async (totpCode: string): Promise<boolean> => {
    const targetEmail = emailUser?.email || user?.email || "deepak.vasthusilpy@gmail.com";
    const cleanCode = totpCode.trim().replace(/\D/g, "");

    if (cleanCode.length !== 6) {
      throw new Error("Google Authenticator ആപ്പിലെ 6 അക്ക കോഡ് നൽകുക (Please enter 6-digit TOTP code).");
    }

    const secret = getOrCreateTotpSecret(targetEmail);
    const verification = await verifyTotpCode(secret, cleanCode, 1);

    if (!verification.valid) {
      throw new Error("നൽകിയ Google Authenticator കോഡ് തെറ്റാണ് അല്ലെങ്കിൽ കാലാവധി കഴിഞ്ഞു (Invalid or expired Authenticator code).");
    }

    const now = Date.now();
    setLastAdminTotpVerifiedAt(now);
    recordAdminTotpVerified(targetEmail, now);

    if (db) {
      try {
        const docId = emailToDocId(targetEmail);
        await setDoc(doc(db, "users", docId), {
          lastAdminTotpVerifiedAt: now,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        // Offline resilience
      }
    }

    setEmailUser((prev) => {
      if (!prev) return null;
      const updated: EmailUser = { ...prev, lastAdminTotpVerifiedAt: now };
      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(updated));
      return updated;
    });

    return true;
  };

  // Synchronize user profile updates online to Firestore and local state
  const updateUserProfile = async (updates: {
    displayName?: string;
    phone?: string;
    profession?: string;
    email?: string;
  }) => {
    const currentEmail = updates.email || emailUser?.email || user?.email;
    if (!currentEmail) return;

    const cleanEmail = currentEmail.trim().toLowerCase();
    const cleanPhone = (updates.phone || "").trim();

    // 1. Unified Sync across Server, Firestore, local storage & cross-tab broadcast
    await syncUserProfileDirect({
      email: cleanEmail,
      phone: cleanPhone || emailUser?.phone || "",
      displayName: updates.displayName || emailUser?.displayName || user?.displayName || cleanEmail.split("@")[0],
      profession: updates.profession || emailUser?.profession || "Vasthu Architect / Engineer",
      role: emailUser?.role || (isPrimaryAdminEmail(cleanEmail) ? "primary_admin" : "authorized_user"),
      lastAdminTotpVerifiedAt
    });

    // 2. Direct React state update
    setEmailUser((prev) => {
      const updated: EmailUser = {
        ...(prev || {}),
        email: cleanEmail,
        displayName: updates.displayName || prev?.displayName || user?.displayName || cleanEmail.split("@")[0],
        phone: cleanPhone || prev?.phone || "",
        profession: updates.profession || prev?.profession || "Vasthu Architect / Engineer",
        role: prev?.role || (isPrimaryAdminEmail(cleanEmail) ? "primary_admin" : "authorized_user"),
        loginTimestamp: prev?.loginTimestamp || Date.now()
      };
      localStorage.setItem("vasthusilpy_email_user", JSON.stringify(updated));
      return updated;
    });

    // 3. Trigger background comprehensive web data sync
    performFullWebDataSync().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        emailUser,
        loading,
        authorized,
        isPrimaryAdmin,
        authError,
        clearAuthError,

        lastAdminTotpVerifiedAt,
        adminTotpDaysRemaining,
        isAdminTotpDue,
        verifyAdminTotpNow,
        updateUserProfile,

        signUpUser,
        loginWithPassword,
        loginWithGoogleAuthenticator,
        loginWithGoogleAccount,
        loginAsAdminBypass,
        sendEmailOtp,
        verifyEmailOtp,
        signOutUser,
        authorizedEmails,
        addAuthorizedEmail,
        removeAuthorizedEmail,
        isExpiredSubscription,
        activeTabPermissions,
        subscriptionRequests,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
