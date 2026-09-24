import { ImportantSite, SiteFolder } from "../types";
import { INITIAL_IMPORTANT_SITES, INITIAL_SITE_FOLDERS } from "../data/importantSitesData";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, getDocs } from "firebase/firestore";
import { safeSetDoc, sanitizeForFirestore } from "./storageManager";
import { broadcastMessage } from "./broadcastSync";
import { cloudSyncBatch, cloudDeleteRecord } from "./cloudRealtimeSync";

export const SITES_STORAGE_KEYS = {
  IMPORTANT_SITES: "vasthusilpy_important_sites_v1",
  DELETED_SITE_IDS: "vasthusilpy_deleted_site_ids_v1",
  SITES_INITIALIZED: "vasthusilpy_important_sites_initialized_v1",
  SITE_FOLDERS: "vasthusilpy_site_folders_v1",
  FOLDERS_INITIALIZED: "vasthusilpy_site_folders_initialized_v1",
  MASTER_PIN: "vasthusilpy_sites_master_pin_v1",
  VAULT_LOCKED: "vasthusilpy_sites_vault_locked_v1"
};

export const DEMO_SITE_IDS = [
  "site_ksmart_lsgd",
  "site_erekha_survey",
  "site_edistrict_kerala",
  "site_revenue_ilims",
  "site_pearl_registration",
  "site_gst_portal",
  "site_incometax_portal",
  "site_cpwd_rates",
  "site_autocad_web",
  "site_sbi_banking",
  "site_ksppcb_portal",
  "site_fire_noc_kerala"
];

// ==========================================
// 1. FOLDER MANAGEMENT
// ==========================================

export function loadSiteFolders(): SiteFolder[] {
  try {
    const raw = localStorage.getItem(SITES_STORAGE_KEYS.SITE_FOLDERS);
    const initialized = localStorage.getItem(SITES_STORAGE_KEYS.FOLDERS_INITIALIZED);

    if (raw) {
      const parsed: SiteFolder[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure VEO exists in folder list if not already there
        if (!parsed.some((f) => f.name.toLowerCase() === "veo")) {
          parsed.unshift({
            id: "folder_veo",
            name: "VEO",
            color: "emerald",
            icon: "Folder",
            description: "Village Extension Office (VEO) Services & Forms",
            createdAt: new Date().toISOString()
          });
          localStorage.setItem(SITES_STORAGE_KEYS.SITE_FOLDERS, JSON.stringify(parsed));
        }
        return parsed;
      }
    }

    if (!initialized) {
      localStorage.setItem(SITES_STORAGE_KEYS.SITE_FOLDERS, JSON.stringify(INITIAL_SITE_FOLDERS));
      localStorage.setItem(SITES_STORAGE_KEYS.FOLDERS_INITIALIZED, "true");
      return INITIAL_SITE_FOLDERS;
    }
  } catch (e) {
    console.error("Failed to load site folders from storage", e);
  }
  return INITIAL_SITE_FOLDERS;
}

export function saveSiteFolders(folders: SiteFolder[], syncToCloud = true): void {
  try {
    const cleanFolders = (folders || []).filter((f) => f && f.name);
    localStorage.setItem(SITES_STORAGE_KEYS.SITE_FOLDERS, JSON.stringify(cleanFolders));
    localStorage.setItem(SITES_STORAGE_KEYS.FOLDERS_INITIALIZED, "true");

    broadcastMessage({
      type: "SYNC_SITE_FOLDERS",
      data: cleanFolders
    });

    window.dispatchEvent(new Event("vasthusilpy_site_folders_updated"));

    if (syncToCloud && db) {
      cleanFolders.forEach((folder) => {
        if (folder && folder.id) {
          safeSetDoc(doc(db, "site_folders", folder.id), folder, { merge: true }).catch((err) => {
            console.warn("Firestore folder save error:", err);
          });
        }
      });
    }

    if (syncToCloud) {
      cloudSyncBatch("site_folders", cleanFolders).catch(() => {});
    }
  } catch (e) {
    console.error("Failed to save site folders", e);
  }
}

export function createSiteFolder(name: string, color = "emerald", description = ""): SiteFolder {
  const current = loadSiteFolders();
  const trimmed = name.trim();
  const existing = current.find((f) => f.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const newFolder: SiteFolder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: trimmed,
    color,
    description: description.trim(),
    createdAt: new Date().toISOString()
  };

  const updated = [...current, newFolder];
  saveSiteFolders(updated);
  return newFolder;
}

export function renameSiteFolder(id: string, newName: string, color?: string): void {
  const current = loadSiteFolders();
  const folder = current.find((f) => f.id === id);
  if (!folder) return;

  const oldName = folder.name;
  const updatedFolders = current.map((f) =>
    f.id === id ? { ...f, name: newName.trim(), color: color || f.color, updatedAt: new Date().toISOString() } : f
  );
  saveSiteFolders(updatedFolders);

  // Update all sites associated with this folder name
  const sites = loadImportantSites();
  let hasChangedSites = false;
  const updatedSites = sites.map((s) => {
    if (s.folder?.toLowerCase() === oldName.toLowerCase() || s.customCategory?.toLowerCase() === oldName.toLowerCase()) {
      hasChangedSites = true;
      return { ...s, folder: newName.trim(), customCategory: newName.trim(), updatedAt: new Date().toISOString() };
    }
    return s;
  });

  if (hasChangedSites) {
    saveImportantSites(updatedSites);
  }
}

export function deleteSiteFolder(id: string): void {
  const current = loadSiteFolders();
  const folderToDelete = current.find((f) => f.id === id);
  if (!folderToDelete) return;

  const remaining = current.filter((f) => f.id !== id);
  saveSiteFolders(remaining, false);

  if (db) {
    deleteDoc(doc(db, "site_folders", id)).catch((err) => {
      console.warn("Firestore deleteDoc error on folder:", err);
    });
  }
  cloudDeleteRecord("site_folders", id).catch(() => {});

  // Update sites belonging to this folder to empty or "General"
  const sites = loadImportantSites();
  let hasChanged = false;
  const updatedSites = sites.map((s) => {
    if (s.folder?.toLowerCase() === folderToDelete.name.toLowerCase()) {
      hasChanged = true;
      return { ...s, folder: "General", customCategory: "General", updatedAt: new Date().toISOString() };
    }
    return s;
  });

  if (hasChanged) {
    saveImportantSites(updatedSites);
  }
}

// ==========================================
// 2. SITES MANAGEMENT
// ==========================================

export function getDeletedSiteIds(): string[] {
  try {
    const raw = localStorage.getItem(SITES_STORAGE_KEYS.DELETED_SITE_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read deleted site IDs", e);
  }
  return [];
}

export function addDeletedSiteId(id: string): void {
  try {
    const current = getDeletedSiteIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(SITES_STORAGE_KEYS.DELETED_SITE_IDS, JSON.stringify(updated));
    }
  } catch (e) {
    console.error("Failed to save deleted site ID", e);
  }
}

export function loadImportantSites(): ImportantSite[] {
  try {
    const deletedIds = getDeletedSiteIds();
    const raw = localStorage.getItem(SITES_STORAGE_KEYS.IMPORTANT_SITES);
    const initialized = localStorage.getItem(SITES_STORAGE_KEYS.SITES_INITIALIZED);

    if (raw) {
      const parsed: ImportantSite[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        let cleanList = parsed.filter(
          (site) => site && site.id && !deletedIds.includes(site.id) && !DEMO_SITE_IDS.includes(site.id)
        );

        // Check if VEO example site exists; if not, add it seamlessly
        const hasVeoSite = cleanList.some((s) => s.url.includes("rckeaFvH5ous") || (s.name === "VEO Form" && s.folder === "VEO"));
        if (!hasVeoSite && !deletedIds.includes("site_veo_form_fillout")) {
          const veoSite: ImportantSite = {
            id: "site_veo_form_fillout",
            name: "VEO Form",
            category: "OTHER",
            customCategory: "VEO",
            folder: "VEO",
            url: "https://forms.fillout.com/t/rckeaFvH5ous",
            username: "",
            password: "",
            securityPin: "",
            notes: "Official VEO Fillout Submission Form",
            isFavorite: true,
            color: "emerald",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          cleanList.unshift(veoSite);
          localStorage.setItem(SITES_STORAGE_KEYS.IMPORTANT_SITES, JSON.stringify(cleanList));
        }

        return cleanList;
      }
    }

    if (!initialized) {
      const filteredDefaults = INITIAL_IMPORTANT_SITES.filter(
        (s) => !deletedIds.includes(s.id) && !DEMO_SITE_IDS.includes(s.id)
      );
      localStorage.setItem(SITES_STORAGE_KEYS.IMPORTANT_SITES, JSON.stringify(filteredDefaults));
      localStorage.setItem(SITES_STORAGE_KEYS.SITES_INITIALIZED, "true");
      return filteredDefaults;
    }
  } catch (e) {
    console.error("Failed to load important sites from storage", e);
  }
  return [];
}

export function saveImportantSites(sites: ImportantSite[], syncToCloud = true): void {
  try {
    const deletedIds = getDeletedSiteIds();
    const cleanSites = (sites || []).filter((s) => s && s.id && !deletedIds.includes(s.id));
    localStorage.setItem(SITES_STORAGE_KEYS.IMPORTANT_SITES, JSON.stringify(cleanSites));
    localStorage.setItem(SITES_STORAGE_KEYS.SITES_INITIALIZED, "true");

    broadcastMessage({
      type: "SYNC_SITES",
      data: cleanSites
    });

    window.dispatchEvent(new Event("vasthusilpy_important_sites_updated"));

    if (syncToCloud && db) {
      cleanSites.forEach((site) => {
        if (site && site.id) {
          safeSetDoc(doc(db, "important_sites", site.id), site, { merge: true }).catch((err) => {
            console.warn("Firestore site save error:", err);
          });
        }
      });
    }

    if (syncToCloud) {
      cloudSyncBatch("important_sites", cleanSites).catch(() => {});
    }
  } catch (e) {
    console.error("Failed to save important sites", e);
  }
}

export function deleteImportantSite(idToDelete: string): ImportantSite[] {
  addDeletedSiteId(idToDelete);
  const current = loadImportantSites();
  const remaining = current.filter((s) => s.id !== idToDelete);
  saveImportantSites(remaining, false);

  if (db) {
    deleteDoc(doc(db, "important_sites", idToDelete)).catch((err) => {
      console.warn("Firestore deleteDoc error on site:", err);
    });
  }
  cloudDeleteRecord("important_sites", idToDelete).catch(() => {});

  return remaining;
}

// ==========================================
// 3. MASTER PIN & SECURITY
// ==========================================

export function getMasterPin(): string {
  try {
    return localStorage.getItem(SITES_STORAGE_KEYS.MASTER_PIN) || "1234";
  } catch {
    return "1234";
  }
}

export function setMasterPin(newPin: string): void {
  try {
    localStorage.setItem(SITES_STORAGE_KEYS.MASTER_PIN, newPin);
  } catch (e) {
    console.error("Failed to save master PIN", e);
  }
}

export function isVaultLocked(): boolean {
  try {
    const raw = localStorage.getItem(SITES_STORAGE_KEYS.VAULT_LOCKED);
    return raw === "true";
  } catch {
    return false;
  }
}

export function setVaultLockedState(locked: boolean): void {
  try {
    localStorage.setItem(SITES_STORAGE_KEYS.VAULT_LOCKED, locked ? "true" : "false");
  } catch (e) {
    console.error("Failed to save vault lock state", e);
  }
}

export function generateAutoLoginBookmarklet(username: string, password?: string): string {
  const cleanUser = encodeURIComponent(username || "");
  const cleanPass = encodeURIComponent(password || "");

  const code = `(function(){
    var u=decodeURIComponent("${cleanUser}");
    var p=decodeURIComponent("${cleanPass}");
    var userSelectors=['input[type="email"]','input[type="text"][name*="user" i]','input[type="text"][id*="user" i]','input[type="text"][name*="email" i]','input[type="text"][name*="login" i]','input[type="text"][id*="login" i]','input[autocomplete="username"]','input[type="text"]','input[type="tel"]'];
    var passSelectors=['input[type="password"]','input[name*="pass" i]','input[id*="pass" i]','input[autocomplete="current-password"]'];
    
    function fill(el,val){
      if(!el||!val)return;
      el.focus();
      el.value=val;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
    
    var userField=null;
    for(var i=0;i<userSelectors.length;i++){
      var found=document.querySelector(userSelectors[i]);
      if(found&&found.type!=='hidden'&&found.type!=='password'){userField=found;break;}
    }
    var passField=document.querySelector('input[type="password"]')||document.querySelector(passSelectors.join(','));
    
    if(userField&&u)fill(userField,u);
    if(passField&&p)fill(passField,p);
    
    var toast=document.createElement('div');
    toast.style.position='fixed';toast.style.top='20px';toast.style.right='20px';toast.style.zIndex='9999999';
    toast.style.background='#022c22';toast.style.color='#6ee7b7';toast.style.border='2px solid #059669';
    toast.style.padding='14px 20px';toast.style.borderRadius='14px';toast.style.fontFamily='system-ui,sans-serif';
    toast.style.boxShadow='0 20px 25px -5px rgba(0,0,0,0.5)';toast.style.fontSize='13px';toast.style.fontWeight='bold';
    toast.innerHTML='🔑 <strong>VASTHUSILPY AUTO-FILL</strong><br/>Credentials populated successfully!';
    document.body.appendChild(toast);
    setTimeout(function(){toast.remove();},3500);
  })();`;

  return `javascript:${encodeURI(code.replace(/\s+/g, " ").trim())}`;
}

export function generateStrongPassword(length = 14, includeSymbols = true): string {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "@#$&*%!+-";

  let chars = lowercase + uppercase + numbers;
  if (includeSymbols) chars += symbols;

  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

export function exportSitesVaultJson(sites: ImportantSite[], folders?: SiteFolder[]): void {
  const payload = {
    version: "2.0",
    exportDate: new Date().toISOString(),
    folders: folders || loadSiteFolders(),
    sites: sites
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `vasthusilpy_important_sites_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
