import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";

const WEB_DATA_DIR = path.join(process.cwd(), "data", "web_data");

// Helper to ensure data directory exists and seed canonical master identities
function ensureWebDataDir() {
  if (!fs.existsSync(WEB_DATA_DIR)) {
    try {
      fs.mkdirSync(WEB_DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("[WebDataServer] Failed to create web_data directory:", e);
    }
  }

  // Seed canonical Deepak primary admin user profile if not exists
  try {
    const profileFile = path.join(WEB_DATA_DIR, "user_profiles.json");
    let profiles: any[] = [];
    if (fs.existsSync(profileFile)) {
      profiles = JSON.parse(fs.readFileSync(profileFile, "utf-8"));
    }
    const deepakIdx = profiles.findIndex(
      (p) =>
        (p.email && p.email.toLowerCase().includes("deepak.vasthusilpy")) ||
        (p.phone && (p.phone.includes("9747995961") || p.phone.includes("9567627277")))
    );
    const deepakCanonical = {
      email: "deepak.vasthusilpy@gmail.com",
      phone: "9747995961",
      linkedPhones: ["9747995961", "9567627277", "7012383137", "9496354421", "9447470421"],
      displayName: "DEEPAK C",
      profession: "Vasthu Consultant & Civil Engineer",
      role: "primary_admin",
      updatedAt: new Date().toISOString()
    };
    if (deepakIdx >= 0) {
      profiles[deepakIdx] = { ...profiles[deepakIdx], ...deepakCanonical };
    } else {
      profiles.push(deepakCanonical);
    }
    fs.writeFileSync(profileFile, JSON.stringify(profiles, null, 2), "utf-8");

    // Seed canonical Deepak subscription request if not exists
    const subFile = path.join(WEB_DATA_DIR, "subscription_requests.json");
    let subs: any[] = [];
    if (fs.existsSync(subFile)) {
      subs = JSON.parse(fs.readFileSync(subFile, "utf-8"));
    }
    const subIdx = subs.findIndex(
      (s) =>
        (s.email && s.email.toLowerCase().includes("deepak.vasthusilpy")) ||
        (s.phone && (s.phone.includes("9747995961") || s.phone.includes("9567627277"))) ||
        s.id === "SUB-ADMIN-DEEPAK"
    );
    const deepakSubCanonical = {
      id: "SUB-ADMIN-DEEPAK",
      fullName: "DEEPAK C",
      email: "deepak.vasthusilpy@gmail.com",
      phone: "9747995961",
      password: "9747995961",
      planName: "Primary Admin Full Access Pass",
      amountPaid: 2400,
      validityType: "unlimited",
      validUntil: "2099-12-31",
      validDays: 36500,
      status: "approved",
      notes: "Primary Admin Account with Unified Multi-Login Sync (9747995961 / deepak.vasthusilpy@gmail.com)",
      createdAt: "2026-01-01T00:00:00.000Z",
      approvedAt: "2026-01-01T00:00:00.000Z"
    };
    if (subIdx >= 0) {
      subs[subIdx] = { ...subs[subIdx], ...deepakSubCanonical };
    } else {
      subs.push(deepakSubCanonical);
    }
    fs.writeFileSync(subFile, JSON.stringify(subs, null, 2), "utf-8");
  } catch (e) {
    console.error("[WebDataServer] Seed error:", e);
  }
}

// Generic file reader helper
function readJsonFile<T>(filename: string, defaultValue: T): T {
  ensureWebDataDir();
  const filePath = path.join(WEB_DATA_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content) as T;
    }
  } catch (err) {
    console.error(`[WebDataServer] Error reading ${filename}:`, err);
  }
  return defaultValue;
}

// Generic file writer helper
function writeJsonFile<T>(filename: string, data: T): boolean {
  ensureWebDataDir();
  const filePath = path.join(WEB_DATA_DIR, filename);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`[WebDataServer] Error writing ${filename}:`, err);
    return false;
  }
}

export function registerWebDataRoutes(app: Express) {
  // -------------------------------------------------------------
  // MASTER WEB DATA BIDIRECTIONAL SYNC
  // -------------------------------------------------------------
  app.post("/api/web-data/sync", (req: Request, res: Response) => {
    try {
      const {
        projects = [],
        invoices = [],
        estimates = [],
        customers = [],
        rateItems = [],
        cadFolders = [],
        cadFiles = [],
        userProfiles = [],
        subscriptionRequests = [],
        applicationEntries = [],
        currentUserProfile = null
      } = req.body;

      const syncedAt = new Date().toISOString();

      // 1. Projects Merge
      const existingProjects = readJsonFile<any[]>("crm_projects.json", []);
      const projectMap = new Map<string, any>();
      existingProjects.forEach((p) => p?.id && projectMap.set(p.id, p));
      (Array.isArray(projects) ? projects : []).forEach((p) => {
        if (p?.id) {
          const prev = projectMap.get(p.id);
          projectMap.set(p.id, prev ? { ...prev, ...p } : p);
        }
      });
      const mergedProjects = Array.from(projectMap.values());
      writeJsonFile("crm_projects.json", mergedProjects);

      // Also keep crm_projects.json in parent data/ directory in sync with CRM tab
      try {
        const crmFile = path.join(process.cwd(), "data", "crm_projects.json");
        fs.writeFileSync(crmFile, JSON.stringify(mergedProjects, null, 2), "utf-8");
      } catch (e) {}

      // 2. Invoices Merge
      const existingInvoices = readJsonFile<any[]>("crm_invoices.json", []);
      const invoiceMap = new Map<string, any>();
      existingInvoices.forEach((i) => i?.id && invoiceMap.set(i.id, i));
      (Array.isArray(invoices) ? invoices : []).forEach((i) => {
        if (i?.id) {
          const prev = invoiceMap.get(i.id);
          invoiceMap.set(i.id, prev ? { ...prev, ...i } : i);
        }
      });
      const mergedInvoices = Array.from(invoiceMap.values());
      writeJsonFile("crm_invoices.json", mergedInvoices);

      try {
        const crmInvFile = path.join(process.cwd(), "data", "crm_invoices.json");
        fs.writeFileSync(crmInvFile, JSON.stringify(mergedInvoices, null, 2), "utf-8");
      } catch (e) {}

      // 3. Estimates Merge
      const existingEstimates = readJsonFile<any[]>("estimates.json", []);
      const estimateMap = new Map<string, any>();
      existingEstimates.forEach((e) => e?.id && estimateMap.set(e.id, e));
      (Array.isArray(estimates) ? estimates : []).forEach((e) => {
        if (e?.id) {
          const prev = estimateMap.get(e.id);
          estimateMap.set(e.id, prev ? { ...prev, ...e } : e);
        }
      });
      const mergedEstimates = Array.from(estimateMap.values());
      writeJsonFile("estimates.json", mergedEstimates);

      // 4. Customers Merge
      const existingCustomers = readJsonFile<any[]>("customers.json", []);
      const customerMap = new Map<string, any>();
      existingCustomers.forEach((c) => c?.id && customerMap.set(c.id, c));
      (Array.isArray(customers) ? customers : []).forEach((c) => {
        if (c?.id) {
          const prev = customerMap.get(c.id);
          customerMap.set(c.id, prev ? { ...prev, ...c } : c);
        }
      });
      const mergedCustomers = Array.from(customerMap.values());
      writeJsonFile("customers.json", mergedCustomers);

      // 5. Rate Items Merge
      const existingRates = readJsonFile<any[]>("rate_items.json", []);
      const rateMap = new Map<string, any>();
      existingRates.forEach((r) => r?.id && rateMap.set(r.id, r));
      (Array.isArray(rateItems) ? rateItems : []).forEach((r) => {
        if (r?.id) {
          const prev = rateMap.get(r.id);
          rateMap.set(r.id, prev ? { ...prev, ...r } : r);
        }
      });
      const mergedRates = Array.from(rateMap.values());
      writeJsonFile("rate_items.json", mergedRates);

      // 6. CAD Folders Merge
      const existingFolders = readJsonFile<any[]>("cad_folders.json", []);
      const folderMap = new Map<string, any>();
      existingFolders.forEach((f) => f?.id && folderMap.set(f.id, f));
      (Array.isArray(cadFolders) ? cadFolders : []).forEach((f) => {
        if (f?.id) {
          const prev = folderMap.get(f.id);
          folderMap.set(f.id, prev ? { ...prev, ...f } : f);
        }
      });
      const mergedFolders = Array.from(folderMap.values());
      writeJsonFile("cad_folders.json", mergedFolders);

      // 7. CAD Vault Files Merge (Index & Metadata)
      const existingCadFiles = readJsonFile<any[]>("cad_files.json", []);
      const cadFileMap = new Map<string, any>();
      existingCadFiles.forEach((file) => file?.id && cadFileMap.set(file.id, file));
      (Array.isArray(cadFiles) ? cadFiles : []).forEach((file) => {
        if (file?.id) {
          const prev = cadFileMap.get(file.id);
          cadFileMap.set(file.id, prev ? { ...prev, ...file } : file);
        }
      });
      const mergedCadFiles = Array.from(cadFileMap.values());
      writeJsonFile("cad_files.json", mergedCadFiles);

      // 8. User Profiles & Email/Mobile Sync
      const existingProfiles = readJsonFile<any[]>("user_profiles.json", []);
      const profileMap = new Map<string, any>();
      existingProfiles.forEach((p) => {
        const key = (p?.email || "").toLowerCase().trim() || p?.phone || p?.id;
        if (key) profileMap.set(key, p);
      });

      (Array.isArray(userProfiles) ? userProfiles : []).forEach((p) => {
        const key = (p?.email || "").toLowerCase().trim() || p?.phone || p?.id;
        if (key) {
          const prev = profileMap.get(key);
          profileMap.set(key, prev ? { ...prev, ...p, updatedAt: syncedAt } : { ...p, updatedAt: syncedAt });
        }
      });

      if (currentUserProfile && (currentUserProfile.email || currentUserProfile.phone)) {
        const key = (currentUserProfile.email || "").toLowerCase().trim() || currentUserProfile.phone;
        const prev = profileMap.get(key);
        profileMap.set(key, prev ? { ...prev, ...currentUserProfile, updatedAt: syncedAt } : { ...currentUserProfile, updatedAt: syncedAt });
      }

      const mergedProfiles = Array.from(profileMap.values());
      writeJsonFile("user_profiles.json", mergedProfiles);

      // 9. Subscription Requests Merge
      const existingSubs = readJsonFile<any[]>("subscription_requests.json", []);
      const subMap = new Map<string, any>();
      existingSubs.forEach((s) => s?.id && subMap.set(s.id, s));
      (Array.isArray(subscriptionRequests) ? subscriptionRequests : []).forEach((s) => {
        if (s?.id) {
          const prev = subMap.get(s.id);
          subMap.set(s.id, prev ? { ...prev, ...s } : s);
        }
      });
      const mergedSubs = Array.from(subMap.values());
      writeJsonFile("subscription_requests.json", mergedSubs);

      // 10. Application Entries Merge
      const existingEntries = readJsonFile<any[]>("application_entries.json", []);
      const entryMap = new Map<string, any>();
      existingEntries.forEach((e) => e?.id && entryMap.set(e.id, e));
      (Array.isArray(applicationEntries) ? applicationEntries : []).forEach((e) => {
        if (e?.id) {
          const prev = entryMap.get(e.id);
          entryMap.set(e.id, prev ? { ...prev, ...e } : e);
        }
      });
      const mergedEntries = Array.from(entryMap.values());
      writeJsonFile("application_entries.json", mergedEntries);

      // Record Sync Metadata
      writeJsonFile("last_sync_meta.json", {
        syncedAt,
        stats: {
          projects: mergedProjects.length,
          invoices: mergedInvoices.length,
          estimates: mergedEstimates.length,
          customers: mergedCustomers.length,
          rateItems: mergedRates.length,
          cadFolders: mergedFolders.length,
          cadFiles: mergedCadFiles.length,
          userProfiles: mergedProfiles.length,
          subscriptionRequests: mergedSubs.length,
          applicationEntries: mergedEntries.length
        }
      });

      return res.json({
        success: true,
        message: "Web data successfully synchronized with server persistence store",
        syncedAt,
        merged: {
          projects: mergedProjects,
          invoices: mergedInvoices,
          estimates: mergedEstimates,
          customers: mergedCustomers,
          rateItems: mergedRates,
          cadFolders: mergedFolders,
          cadFiles: mergedCadFiles,
          userProfiles: mergedProfiles,
          subscriptionRequests: mergedSubs,
          applicationEntries: mergedEntries
        }
      });
    } catch (err: any) {
      console.error("[WebDataServer] Sync error:", err);
      return res.status(500).json({ success: false, error: err.message || "Failed to sync web data" });
    }
  });

  // -------------------------------------------------------------
  // PULL AUTHORITATIVE DATA FROM SERVER
  // -------------------------------------------------------------
  app.get("/api/web-data/pull", (req: Request, res: Response) => {
    try {
      const projects = readJsonFile<any[]>("crm_projects.json", []);
      const invoices = readJsonFile<any[]>("crm_invoices.json", []);
      const estimates = readJsonFile<any[]>("estimates.json", []);
      const customers = readJsonFile<any[]>("customers.json", []);
      const rateItems = readJsonFile<any[]>("rate_items.json", []);
      const cadFolders = readJsonFile<any[]>("cad_folders.json", []);
      const cadFiles = readJsonFile<any[]>("cad_files.json", []);
      const userProfiles = readJsonFile<any[]>("user_profiles.json", []);
      const subscriptionRequests = readJsonFile<any[]>("subscription_requests.json", []);
      const applicationEntries = readJsonFile<any[]>("application_entries.json", []);
      const meta = readJsonFile<any>("last_sync_meta.json", { syncedAt: new Date().toISOString() });

      return res.json({
        success: true,
        syncedAt: meta.syncedAt,
        data: {
          projects,
          invoices,
          estimates,
          customers,
          rateItems,
          cadFolders,
          cadFiles,
          userProfiles,
          subscriptionRequests,
          applicationEntries
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // DEDICATED USER PROFILE (EMAIL & MOBILE) SYNC ENDPOINT
  // -------------------------------------------------------------
  app.post("/api/web-data/sync-profile", (req: Request, res: Response) => {
    try {
      const { email, phone, displayName, profession, role, lastAdminTotpVerifiedAt } = req.body;
      if (!email && !phone) {
        return res.status(400).json({ success: false, error: "Email or phone is required" });
      }

      const cleanEmail = (email || "").toLowerCase().trim();
      const cleanPhone = (phone || "").replace(/\D/g, "");
      const now = new Date().toISOString();

      const profiles = readJsonFile<any[]>("user_profiles.json", []);
      const existingIdx = profiles.findIndex((p) => {
        const pEmail = (p.email || "").toLowerCase().trim();
        const pPhone = (p.phone || "").replace(/\D/g, "");
        return (cleanEmail && pEmail === cleanEmail) || (cleanPhone && pPhone === cleanPhone);
      });

      const updatedProfile = {
        email: cleanEmail || profiles[existingIdx]?.email || "",
        phone: phone || profiles[existingIdx]?.phone || "",
        displayName: displayName || profiles[existingIdx]?.displayName || cleanEmail.split("@")[0] || "User",
        profession: profession || profiles[existingIdx]?.profession || "Vasthu Architect / Engineer",
        role: role || profiles[existingIdx]?.role || "authorized_user",
        lastAdminTotpVerifiedAt: lastAdminTotpVerifiedAt || profiles[existingIdx]?.lastAdminTotpVerifiedAt,
        updatedAt: now
      };

      if (existingIdx >= 0) {
        profiles[existingIdx] = { ...profiles[existingIdx], ...updatedProfile };
      } else {
        profiles.push(updatedProfile);
      }

      writeJsonFile("user_profiles.json", profiles);

      // Also update any matching subscription request
      const subs = readJsonFile<any[]>("subscription_requests.json", []);
      let subsUpdated = false;
      subs.forEach((s) => {
        const sEmail = (s.email || "").toLowerCase().trim();
        const sPhone = (s.phone || "").replace(/\D/g, "");
        if ((cleanEmail && sEmail === cleanEmail) || (cleanPhone && sPhone === cleanPhone)) {
          if (cleanEmail) s.email = cleanEmail;
          if (phone) s.phone = phone;
          if (displayName) s.fullName = displayName;
          subsUpdated = true;
        }
      });
      if (subsUpdated) {
        writeJsonFile("subscription_requests.json", subs);
      }

      return res.json({
        success: true,
        profile: updatedProfile,
        message: "User profile (Email & Mobile) synced successfully"
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // GET USER PROFILE BY IDENTIFIER (EMAIL OR PHONE)
  // -------------------------------------------------------------
  app.get("/api/web-data/profile/:identifier", (req: Request, res: Response) => {
    try {
      const identifier = (req.params.identifier || "").toLowerCase().trim();
      const cleanDigits = identifier.replace(/\D/g, "");

      // Check for primary admin phone or email
      const primaryEmails = ["deepak.vasthusilpy@gmail.com", "dibindeepak1@gmail.com"];
      const primaryPhones = ["9747995961", "9567627277", "7012383137", "9496354421", "9447470421"];

      const isPrimaryEmail = primaryEmails.includes(identifier);
      const isPrimaryPhone = primaryPhones.some(
        (p) => cleanDigits && (cleanDigits === p || cleanDigits.endsWith(p.slice(-10)) || p.endsWith(cleanDigits.slice(-10)))
      );

      if (isPrimaryEmail || isPrimaryPhone || identifier === "admin") {
        return res.json({
          success: true,
          profile: {
            email: "deepak.vasthusilpy@gmail.com",
            phone: cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "9747995961",
            linkedPhones: primaryPhones,
            displayName: "DEEPAK C",
            profession: "Vasthu Consultant & Civil Engineer",
            role: "primary_admin",
            updatedAt: new Date().toISOString()
          }
        });
      }

      const profiles = readJsonFile<any[]>("user_profiles.json", []);
      const found = profiles.find((p) => {
        const pEmail = (p.email || "").toLowerCase().trim();
        const pPhone = (p.phone || "").replace(/\D/g, "");
        const linked = Array.isArray(p.linkedPhones) ? p.linkedPhones : [];
        const matchLinked = cleanDigits && linked.some((lp: string) => lp.replace(/\D/g, "").endsWith(cleanDigits.slice(-10)));
        return (
          pEmail === identifier ||
          (cleanDigits && pPhone === cleanDigits) ||
          (cleanDigits.length >= 10 && pPhone.endsWith(cleanDigits.slice(-10))) ||
          matchLinked
        );
      });

      if (!found) {
        // Also fallback to check subscription_requests.json
        const subs = readJsonFile<any[]>("subscription_requests.json", []);
        const foundSub = subs.find((s) => {
          const sEmail = (s.email || "").toLowerCase().trim();
          const sPhone = (s.phone || "").replace(/\D/g, "");
          return sEmail === identifier || (cleanDigits.length >= 10 && sPhone.endsWith(cleanDigits.slice(-10)));
        });

        if (foundSub) {
          return res.json({
            success: true,
            profile: {
              email: foundSub.email,
              phone: foundSub.phone,
              displayName: foundSub.fullName || foundSub.email.split("@")[0],
              profession: "Vasthu Architect / Engineer",
              role: "authorized_user",
              subscriptionId: foundSub.id
            }
          });
        }

        return res.status(404).json({ success: false, error: "Profile not found" });
      }

      return res.json({ success: true, profile: found });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // GET ALL SUBSCRIPTIONS AUTHORITATIVE LIST
  // -------------------------------------------------------------
  app.get("/api/web-data/subscriptions", (req: Request, res: Response) => {
    try {
      const subs = readJsonFile<any[]>("subscription_requests.json", []);
      return res.json({ success: true, subscriptions: subs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // RESOLVE ACCOUNT BY EMAIL OR MOBILE (Ensures identical data on all logins)
  // -------------------------------------------------------------
  app.post("/api/web-data/resolve-account", (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier) {
        return res.status(400).json({ success: false, error: "Identifier is required" });
      }

      const cleanInput = (identifier || "").toLowerCase().trim();
      const cleanDigits = cleanInput.replace(/\D/g, "");
      const cleanPass = (password || "").trim();

      const primaryEmails = ["deepak.vasthusilpy@gmail.com", "dibindeepak1@gmail.com"];
      const primaryPhones = ["9747995961", "9567627277", "7012383137", "9496354421", "9447470421"];

      const isPrimaryEmail = primaryEmails.includes(cleanInput);
      const isPrimaryPhone = primaryPhones.some(
        (p) => cleanDigits && (cleanDigits === p || cleanDigits.endsWith(p.slice(-10)) || p.endsWith(cleanDigits.slice(-10)))
      );
      const isPrimary =
        isPrimaryEmail ||
        isPrimaryPhone ||
        cleanInput === "admin" ||
        cleanInput === "deepak" ||
        cleanInput.includes("deepak.vasthusilpy") ||
        cleanInput.includes("dibindeepak");

      // 1. Read subscription_requests.json to find any actual subscriptions for this user
      const subs = readJsonFile<any[]>("subscription_requests.json", []);
      const matchingSubs = subs.filter((s) => {
        const sEmail = (s.email || "").toLowerCase().trim();
        const sPhone = (s.phone || "").replace(/\D/g, "");
        const sId = (s.id || "").toLowerCase().trim();
        return (
          sEmail === cleanInput ||
          (cleanDigits.length >= 10 && (sPhone === cleanDigits || sPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(sPhone.slice(-10)))) ||
          sId === cleanInput
        );
      });

      // If user entered a password, find the subscription matching that password first
      let matchedSub = matchingSubs.find(
        (s) => cleanPass && s.password && (s.password.trim() === cleanPass || s.password.trim().toLowerCase() === cleanPass.toLowerCase())
      );
      // Fallback to most recently updated / approved subscription
      if (!matchedSub && matchingSubs.length > 0) {
        matchedSub = matchingSubs.find((s) => s.status === "approved") || matchingSubs[matchingSubs.length - 1];
      }

      // Check user_profiles.json
      const profiles = readJsonFile<any[]>("user_profiles.json", []);
      const matchedProfile = profiles.find((p) => {
        const pEmail = (p.email || "").toLowerCase().trim();
        const pPhone = (p.phone || "").replace(/\D/g, "");
        return (
          pEmail === cleanInput ||
          (cleanDigits.length >= 10 && (pPhone === cleanDigits || pPhone.endsWith(cleanDigits.slice(-10))))
        );
      });

      // Handle Primary Admin Account
      if (isPrimary) {
        const activePhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : (matchedSub?.phone || "9747995961");
        // For primary admin, both the user's password (e.g. 5161), the phone number, or matchedSub password are valid
        const validPasswords = [
          matchedSub?.password,
          "5161",
          activePhone,
          "9747995961",
          "9567627277",
          "7012383137"
        ].filter(Boolean);

        // If cleanPass provided and is valid, return that so client password check matches
        const assignedPassword = cleanPass && validPasswords.some((vp) => vp === cleanPass || vp?.toLowerCase() === cleanPass.toLowerCase())
          ? cleanPass
          : (matchedSub?.password || "5161");

        return res.json({
          success: true,
          account: {
            email: matchedSub?.email || "deepak.vasthusilpy@gmail.com",
            phone: activePhone,
            displayName: matchedSub?.fullName || "DEEPAK C",
            profession: "Vasthu Consultant & Civil Engineer",
            role: "primary_admin",
            isAdmin: true,
            subscriptionId: matchedSub?.id || "SUB-ADMIN-DEEPAK",
            status: matchedSub?.status || "approved",
            validUntil: matchedSub?.validUntil || "2099-12-31",
            validDays: matchedSub?.validDays || 36500,
            password: assignedPassword,
            tabPermissions: matchedSub?.tabPermissions,
            linkedIdentities: [
              "deepak.vasthusilpy@gmail.com",
              "dibindeepak1@gmail.com",
              "9747995961",
              "9567627277",
              "7012383137",
              "9496354421",
              "9447470421"
            ]
          }
        });
      }

      if (matchedSub || matchedProfile) {
        const email = matchedSub?.email || matchedProfile?.email || "";
        const phone = matchedSub?.phone || matchedProfile?.phone || "";
        const displayName = matchedSub?.fullName || matchedProfile?.displayName || email.split("@")[0] || "User";

        return res.json({
          success: true,
          account: {
            email,
            phone,
            displayName,
            profession: matchedProfile?.profession || "Vasthu Architect / Engineer",
            role: matchedProfile?.role || "authorized_user",
            isAdmin: false,
            subscriptionId: matchedSub?.id || "",
            status: matchedSub?.status || "approved",
            validUntil: matchedSub?.validUntil || "2099-12-31",
            validDays: matchedSub?.validDays || 365,
            password: matchedSub?.password || "",
            tabPermissions: matchedSub?.tabPermissions,
            linkedIdentities: [email, phone].filter(Boolean)
          }
        });
      }

      return res.status(404).json({ success: false, error: "No account found matching this email or mobile number" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // VERIFY SUBSCRIPTION LOGIN DIRECTLY ON SERVER
  // -------------------------------------------------------------
  app.post("/api/web-data/verify-subscription-login", (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier) {
        return res.status(400).json({ success: false, error: "ദയവായി ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ നൽകുക." });
      }
      if (!password) {
        return res.status(400).json({ success: false, error: "ദയവായി പാസ്‌വേഡ് നൽകുക." });
      }

      const cleanInput = (identifier || "").toLowerCase().trim();
      const cleanDigits = cleanInput.replace(/\D/g, "");
      const cleanPass = (password || "").trim();

      const primaryEmails = ["deepak.vasthusilpy@gmail.com", "dibindeepak1@gmail.com"];
      const primaryPhones = ["9747995961", "9567627277", "7012383137", "9496354421", "9447470421"];

      const isPrimaryEmail = primaryEmails.includes(cleanInput);
      const isPrimaryPhone = primaryPhones.some(
        (p) => cleanDigits && (cleanDigits === p || cleanDigits.endsWith(p.slice(-10)) || p.endsWith(cleanDigits.slice(-10)))
      );
      const isPrimary =
        isPrimaryEmail ||
        isPrimaryPhone ||
        cleanInput === "admin" ||
        cleanInput === "deepak" ||
        cleanInput.includes("deepak.vasthusilpy") ||
        cleanInput.includes("dibindeepak");

      const subs = readJsonFile<any[]>("subscription_requests.json", []);
      const matchingSubs = subs.filter((s) => {
        const sEmail = (s.email || "").toLowerCase().trim();
        const sPhone = (s.phone || "").replace(/\D/g, "");
        const sId = (s.id || "").toLowerCase().trim();
        return (
          sEmail === cleanInput ||
          (cleanDigits.length >= 10 && (sPhone === cleanDigits || sPhone.endsWith(cleanDigits.slice(-10)) || cleanDigits.endsWith(sPhone.slice(-10)))) ||
          sId === cleanInput
        );
      });

      // Primary Admin Verification
      if (isPrimary) {
        const activePhone = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : "9747995961";
        const allowedAdminPasswords = [
          "5161",
          activePhone,
          "9747995961",
          "9567627277",
          "7012383137",
          "admin",
          ...matchingSubs.map((s) => s.password).filter(Boolean)
        ];

        const isPassValid = allowedAdminPasswords.some(
          (p) => p === cleanPass || p?.toLowerCase() === cleanPass.toLowerCase()
        );

        if (!isPassValid) {
          return res.status(401).json({
            success: false,
            error: "നൽകിയ പാസ്‌വേഡ് തെറ്റാണ്. (Incorrect Password). പാസ്‌വേഡ് മാറ്റാൻ 'Forgot / Change Password' ഉപയോഗിക്കുക."
          });
        }

        const approvedSub = matchingSubs.find((s) => s.status === "approved") || matchingSubs[0];
        const subRecord = approvedSub || {
          id: "SUB-ADMIN-DEEPAK",
          fullName: "DEEPAK C",
          email: "deepak.vasthusilpy@gmail.com",
          phone: activePhone,
          password: cleanPass,
          planName: "Primary Admin Full Access Pass",
          amountPaid: 2400,
          validityType: "days",
          validUntil: "2099-12-31",
          validDays: 36500,
          status: "approved"
        };

        return res.json({
          success: true,
          isPrimaryAdmin: true,
          subscription: {
            ...subRecord,
            password: cleanPass,
            status: "approved"
          },
          account: {
            email: subRecord.email || "deepak.vasthusilpy@gmail.com",
            phone: activePhone,
            displayName: subRecord.fullName || "DEEPAK C",
            role: "primary_admin",
            isAdmin: true,
            subscriptionId: subRecord.id,
            status: "approved",
            validUntil: subRecord.validUntil || "2099-12-31",
            password: cleanPass
          }
        });
      }

      // Standard Subscriber Verification
      if (matchingSubs.length === 0) {
        return res.status(404).json({
          success: false,
          error: "ഈ ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പറിൽ സബ്‌സ്ക്രിപ്ഷൻ വിവരങ്ങൾ കണ്ടെത്തിയില്ല. ദയവായി രജിസ്റ്റർ ചെയ്യുക. (Subscription details not found. Please register)."
        });
      }

      const passMatchedSub = matchingSubs.find(
        (s) => s.password && (s.password.trim() === cleanPass || s.password.trim().toLowerCase() === cleanPass.toLowerCase())
      );

      if (!passMatchedSub) {
        return res.status(401).json({
          success: false,
          error: "നൽകിയ പാസ്‌വേഡ് തെറ്റാണ്. (Incorrect Password). പാസ്‌വേഡ് മാറ്റാൻ 'Forgot / Change Password' ഉപയോഗിക്കുക."
        });
      }

      return res.json({
        success: true,
        isPrimaryAdmin: false,
        subscription: passMatchedSub,
        account: {
          email: passMatchedSub.email,
          phone: passMatchedSub.phone,
          displayName: passMatchedSub.fullName,
          role: "authorized_user",
          isAdmin: false,
          subscriptionId: passMatchedSub.id,
          status: passMatchedSub.status,
          validUntil: passMatchedSub.validUntil,
          validDays: passMatchedSub.validDays,
          password: passMatchedSub.password,
          tabPermissions: passMatchedSub.tabPermissions
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // CHANGE / RESET SUBSCRIPTION PASSWORD (Server-wide persistence)
  // -------------------------------------------------------------
  app.post("/api/web-data/change-subscription-password", (req: Request, res: Response) => {
    try {
      const { identifier, verificationCodeOrUpi, newPassword } = req.body;
      if (!identifier || !newPassword) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      const cleanId = (identifier || "").toLowerCase().trim();
      const cleanDigits = cleanId.replace(/\D/g, "");
      const cleanVerification = (verificationCodeOrUpi || "").toLowerCase().trim();
      const cleanNewPass = (newPassword || "").trim();

      if (cleanNewPass.length < 6) {
        return res.status(400).json({ success: false, error: "പുതിയ പാസ്‌വേഡിൽ കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം." });
      }

      const subs = readJsonFile<any[]>("subscription_requests.json", []);
      let updatedCount = 0;

      subs.forEach((s) => {
        const sEmail = (s.email || "").toLowerCase().trim();
        const sPhone = (s.phone || "").replace(/\D/g, "");
        const sId = (s.id || "").toLowerCase().trim();
        const matchesUser =
          sEmail === cleanId ||
          (cleanDigits.length >= 10 && (sPhone === cleanDigits || sPhone.endsWith(cleanDigits.slice(-10)))) ||
          sId === cleanId;

        if (matchesUser) {
          s.password = cleanNewPass;
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        writeJsonFile("subscription_requests.json", subs);
        return res.json({ success: true, message: "പാസ്‌വേഡ് വിജയകരമായി മാറ്റിയിരിക്കുന്നു (Password updated successfully)." });
      }

      // If not in subs but is admin
      const primaryEmails = ["deepak.vasthusilpy@gmail.com", "dibindeepak1@gmail.com"];
      const primaryPhones = ["9747995961", "9567627277", "7012383137"];
      if (primaryEmails.includes(cleanId) || primaryPhones.includes(cleanDigits)) {
        subs.push({
          id: `SUB-ADMIN-${Date.now()}`,
          fullName: "DEEPAK C",
          email: "deepak.vasthusilpy@gmail.com",
          phone: cleanDigits || "9747995961",
          password: cleanNewPass,
          planName: "Admin Authorization",
          amountPaid: 2400,
          validityType: "days",
          validUntil: "2099-12-31",
          validDays: 36500,
          status: "approved",
          approvedAt: new Date().toISOString()
        });
        writeJsonFile("subscription_requests.json", subs);
        return res.json({ success: true, message: "അഡ്മിൻ പാസ്‌വേഡ് വിജയകരമായി മാറ്റിയിരിക്കുന്നു." });
      }

      return res.status(404).json({ success: false, error: "അക്കൗണ്ട് കണ്ടെത്താനായില്ല." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // STATUS & STATS
  // -------------------------------------------------------------
  app.get("/api/web-data/status", (req: Request, res: Response) => {
    try {
      const meta = readJsonFile<any>("last_sync_meta.json", {
        syncedAt: null,
        stats: {}
      });
      return res.json({
        success: true,
        serverTime: new Date().toISOString(),
        lastSync: meta.syncedAt,
        stats: meta.stats
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}
