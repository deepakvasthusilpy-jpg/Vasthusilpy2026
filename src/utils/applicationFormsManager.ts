import { ApplicationFormTemplate, FormEntryRecord } from "../types";

const FORMS_STORAGE_KEY = "vasthusilpy_application_form_templates_v1";
const ENTRIES_STORAGE_KEY = "vasthusilpy_application_form_entries_v1";

// In-memory cache for attached PDFs
const pdfDataCache = new Map<string, string>();

// IndexedDB configuration for large PDF storage
const IDB_NAME = "vasthusilpy_docs_db";
const IDB_VERSION = 1;
const IDB_STORE = "form_pdfs";

function openPdfDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "formId" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function savePdfToIndexedDb(formId: string, pdfUrl: string, fileName?: string): Promise<void> {
  pdfDataCache.set(formId, pdfUrl);
  try {
    const db = await openPdfDatabase();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.put({
      formId,
      pdfUrl,
      fileName: fileName || "document.pdf",
      updatedAt: new Date().toISOString()
    });
  } catch (e) {
    console.warn("Could not write PDF to IndexedDB:", e);
  }
}

async function deletePdfFromIndexedDb(formId: string): Promise<void> {
  pdfDataCache.delete(formId);
  try {
    const db = await openPdfDatabase();
    if (!db) return;
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.delete(formId);
  } catch (e) {
    console.warn("Could not delete PDF from IndexedDB:", e);
  }
}

// Background hydration of PDFs from IndexedDB
if (typeof window !== "undefined" && window.indexedDB) {
  openPdfDatabase().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result as Array<{ formId: string; pdfUrl: string }>;
        if (Array.isArray(records)) {
          let updated = false;
          records.forEach((rec) => {
            if (rec.formId && rec.pdfUrl) {
              if (!pdfDataCache.has(rec.formId)) {
                pdfDataCache.set(rec.formId, rec.pdfUrl);
                updated = true;
              }
            }
          });
          if (updated) {
            window.dispatchEvent(new Event("vasthusilpy_forms_updated"));
          }
        }
      };
    } catch (e) {
      console.warn("Could not hydrate PDFs from IndexedDB:", e);
    }
  });
}

// Default is now empty per user request to remove existing pre-configured forms
export const DEFAULT_APPLICATION_FORMS: ApplicationFormTemplate[] = [];

export const INITIAL_DEMO_ENTRIES: FormEntryRecord[] = [];

export function loadApplicationForms(): ApplicationFormTemplate[] {
  try {
    const raw = localStorage.getItem(FORMS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Purge legacy default demo forms
      const filtered = parsed.filter(
        (f) =>
          f &&
          f.id !== "form_kpbr_permit" &&
          f.id !== "form_revenue_pokkuvaravu" &&
          f.id !== "form_ownership_cert"
      );
      if (filtered.length !== parsed.length) {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(filtered));
      }

      // Hydrate with in-memory or IndexedDB cached pdfUrls if missing
      return filtered.map((f) => {
        if (!f.pdfUrl && pdfDataCache.has(f.id)) {
          return { ...f, pdfUrl: pdfDataCache.get(f.id) };
        }
        if (f.pdfUrl && !pdfDataCache.has(f.id)) {
          pdfDataCache.set(f.id, f.pdfUrl);
        }
        return f;
      });
    }
    return [];
  } catch (err) {
    console.error("Error loading application form templates:", err);
    return [];
  }
}

export function saveApplicationForms(forms: ApplicationFormTemplate[]): void {
  // Sync in-memory cache and IndexedDB for each form's PDF
  forms.forEach((f) => {
    if (f.pdfUrl) {
      savePdfToIndexedDb(f.id, f.pdfUrl, f.pdfFileName);
    }
  });

  try {
    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
  } catch (err) {
    console.warn("Storage quota reached for full templates, saving stripped PDF references to localStorage:", err);
    try {
      // Strip large base64 pdfUrl from localStorage to avoid QuotaExceededError,
      // the full PDF is safely preserved in IndexedDB & memory!
      const lightweightForms = forms.map((f) => ({
        ...f,
        pdfUrl: f.pdfUrl && f.pdfUrl.length > 5000 ? undefined : f.pdfUrl
      }));
      localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(lightweightForms));
    } catch (innerErr) {
      console.error("Failed to save even lightweight forms to localStorage:", innerErr);
    }
  }
  window.dispatchEvent(new Event("vasthusilpy_forms_updated"));
}

export function upsertApplicationForm(form: ApplicationFormTemplate): ApplicationFormTemplate[] {
  if (form.pdfUrl || form.pdfFileUrl) {
    savePdfToIndexedDb(form.id, form.pdfUrl || form.pdfFileUrl || "", form.pdfFileName);
  }
  const current = loadApplicationForms();
  const index = current.findIndex((f) => f.id === form.id);
  let updated: ApplicationFormTemplate[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...form, updatedAt: new Date().toISOString() };
  } else {
    updated = [form, ...current];
  }
  saveApplicationForms(updated);

  // Background sync with PostgreSQL backend
  fetch(`/api/application-templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form)
  }).catch((err) => console.warn("Background template sync error:", err));

  return updated;
}

export function deleteApplicationForm(formId: string): ApplicationFormTemplate[] {
  deletePdfFromIndexedDb(formId);
  const current = loadApplicationForms();
  const updated = current.filter((f) => f.id !== formId);
  saveApplicationForms(updated);
  // Also clean up any entries for this form
  const currentEntries = loadFormEntries();
  const updatedEntries = currentEntries.filter((e) => e.formId !== formId && e.templateId !== formId);
  saveFormEntries(updatedEntries);

  // Background sync delete with backend
  fetch(`/api/application-templates/${formId}`, { method: "DELETE" }).catch(() => {});

  return updated;
}

export function clearAllApplicationForms(): void {
  const current = loadApplicationForms();
  current.forEach((f) => deletePdfFromIndexedDb(f.id));
  saveApplicationForms([]);
  saveFormEntries([]);
}

export function loadFormEntries(formId?: string): FormEntryRecord[] {
  try {
    const raw = localStorage.getItem(ENTRIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (formId) {
        return parsed.filter((e) => e.formId === formId || e.templateId === formId);
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error("Error loading form entries:", err);
    return [];
  }
}

export function saveFormEntries(entries: FormEntryRecord[]): void {
  try {
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event("vasthusilpy_form_entries_updated"));
  } catch (err) {
    console.error("Error saving form entries:", err);
  }
}

export function upsertFormEntry(entry: FormEntryRecord): FormEntryRecord[] {
  const current = loadFormEntries();
  const index = current.findIndex((e) => e.id === entry.id);
  let updated: FormEntryRecord[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...entry, updatedAt: new Date().toISOString() };
  } else {
    updated = [entry, ...current];
  }
  saveFormEntries(updated);

  // Background sync with backend
  fetch(`/api/application-entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry)
  }).catch((err) => console.warn("Background entry sync error:", err));

  return updated;
}

export function deleteFormEntry(entryId: string): FormEntryRecord[] {
  const current = loadFormEntries();
  const updated = current.filter((e) => e.id !== entryId);
  saveFormEntries(updated);

  // Background sync delete
  fetch(`/api/application-entries/${entryId}`, { method: "DELETE" }).catch(() => {});

  return updated;
}

// Initial hydration from backend on startup
export async function syncFromBackend(): Promise<{ templates: ApplicationFormTemplate[]; entries: FormEntryRecord[] }> {
  try {
    const [tmplRes, entriesRes] = await Promise.all([
      fetch("/api/application-templates").catch(() => null),
      fetch("/api/application-entries").catch(() => null)
    ]);

    let templates: ApplicationFormTemplate[] = [];
    let entries: FormEntryRecord[] = [];

    if (tmplRes && tmplRes.ok) {
      const tmplData = await tmplRes.json();
      if (Array.isArray(tmplData) && tmplData.length > 0) {
        templates = tmplData;
        saveApplicationForms(templates);
      }
    }

    if (entriesRes && entriesRes.ok) {
      const entData = await entriesRes.json();
      if (Array.isArray(entData)) {
        entries = entData;
        saveFormEntries(entries);
      }
    }

    return { templates, entries };
  } catch (err) {
    console.warn("Backend sync failed, using local storage:", err);
    return { templates: loadApplicationForms(), entries: loadFormEntries() };
  }
}
