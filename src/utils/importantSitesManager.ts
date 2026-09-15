import { ImportantSite } from "../types";
import { INITIAL_IMPORTANT_SITES } from "../data/importantSitesData";
import { db } from "../lib/firebase";
import { collection, onSnapshot, doc, deleteDoc, getDocs } from "firebase/firestore";
import { safeSetDoc, sanitizeForFirestore } from "./storageManager";
import { broadcastMessage } from "./broadcastSync";

export const SITES_STORAGE_KEYS = {
  IMPORTANT_SITES: "vasthusilpy_important_sites_v1",
  DELETED_SITE_IDS: "vasthusilpy_deleted_site_ids_v1",
  SITES_INITIALIZED: "vasthusilpy_important_sites_initialized_v1",
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

/**
 * Get list of deleted site IDs
 */
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

/**
 * Add a deleted site ID to prevent reviving from Firestore
 */
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

/**
 * Load saved important sites from localStorage, falling back to initial data
 */
export function loadImportantSites(): ImportantSite[] {
  try {
    const deletedIds = getDeletedSiteIds();
    const raw = localStorage.getItem(SITES_STORAGE_KEYS.IMPORTANT_SITES);
    const initialized = localStorage.getItem(SITES_STORAGE_KEYS.SITES_INITIALIZED);

    if (raw) {
      const parsed: ImportantSite[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleanList = parsed.filter(
          (site) => site && site.id && !deletedIds.includes(site.id) && !DEMO_SITE_IDS.includes(site.id)
        );
        // If cleanList has fewer items due to demo sites being stripped, update storage
        if (cleanList.length !== parsed.length) {
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

/**
 * Save important sites to localStorage and broadcast sync event
 */
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

    if (syncToCloud && db) {
      cleanSites.forEach((site) => {
        if (site && site.id) {
          safeSetDoc(doc(db, "important_sites", site.id), site, { merge: true }).catch((err) => {
            console.warn("Firestore site save error:", err);
          });
        }
      });
    }
  } catch (e) {
    console.error("Failed to save important sites", e);
  }
}

/**
 * Delete an important site both locally and in Firestore
 */
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

  return remaining;
}

/**
 * Master PIN Management for Credentials Vault
 */
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

/**
 * Auto-Login Helpers:
 * 1. Format clean executable Javascript Bookmarklet
 * 2. Generate UserScript / Tampermonkey auto-fill code
 */
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

/**
 * Generate a randomized strong password
 */
export function generateStrongPassword(length = 14, includeSymbols = true): string {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "@#$&*%!+-";

  let chars = lowercase + uppercase + numbers;
  if (includeSymbols) chars += symbols;

  let password = "";
  // Ensure at least one of each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  if (includeSymbols) {
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  for (let i = password.length; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

/**
 * Export Vault as a JSON download file
 */
export function exportSitesVaultJson(sites: ImportantSite[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sites, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `vasthusilpy_sites_vault_${new Date().toISOString().split("T")[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
