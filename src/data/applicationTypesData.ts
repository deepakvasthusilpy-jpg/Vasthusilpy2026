export interface ApplicationTypeItem {
  id: string;
  name: string;
  fee: number; // e.g., 70
  userId: string; // e.g., "USER ID"
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export const INITIAL_APPLICATION_TYPES: ApplicationTypeItem[] = [
  {
    id: "type_possession_cert",
    name: "POSSESSION CERTIFICATE",
    fee: 70,
    userId: "USER ID",
    notes: "",
    createdAt: new Date().toISOString()
  }
];

export const APP_TYPES_STORAGE_KEY = "vasthusilpy_app_types_clean_v3";

export function loadApplicationTypes(): ApplicationTypeItem[] {
  try {
    const raw = localStorage.getItem(APP_TYPES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(APP_TYPES_STORAGE_KEY, JSON.stringify(INITIAL_APPLICATION_TYPES));
      return INITIAL_APPLICATION_TYPES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure records follow clean format without department/url
      const cleaned: ApplicationTypeItem[] = parsed.map((item) => ({
        id: item.id || `type_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.name || "UNNAMED APPLICATION",
        fee: typeof item.fee === "number" ? item.fee : Number(item.fee) || 70,
        userId: item.userId || "USER ID",
        notes: item.notes || "",
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt
      }));
      return cleaned;
    }
    return INITIAL_APPLICATION_TYPES;
  } catch (e) {
    console.warn("Failed loading application types", e);
    return INITIAL_APPLICATION_TYPES;
  }
}

export function saveApplicationTypes(items: ApplicationTypeItem[]): void {
  try {
    localStorage.setItem(APP_TYPES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("vasthusilpy_application_types_changed", { detail: items }));
  } catch (e) {
    console.warn("Failed saving application types", e);
  }
}

export function addApplicationType(item: Omit<ApplicationTypeItem, "id" | "createdAt">): ApplicationTypeItem[] {
  const current = loadApplicationTypes();
  const newItem: ApplicationTypeItem = {
    ...item,
    name: item.name.trim().toUpperCase(),
    fee: Number(item.fee) || 0,
    userId: item.userId?.trim() || "USER ID",
    id: `type_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...current];
  saveApplicationTypes(updated);
  return updated;
}

export function updateApplicationType(id: string, updates: Partial<ApplicationTypeItem>): ApplicationTypeItem[] {
  const current = loadApplicationTypes();
  const updated = current.map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          name: updates.name ? updates.name.trim().toUpperCase() : item.name,
          fee: updates.fee !== undefined ? Number(updates.fee) : item.fee,
          userId: updates.userId !== undefined ? updates.userId.trim() : item.userId,
          updatedAt: new Date().toISOString()
        }
      : item
  );
  saveApplicationTypes(updated);
  return updated;
}

export function deleteApplicationType(id: string): ApplicationTypeItem[] {
  const current = loadApplicationTypes();
  const updated = current.filter((item) => item.id !== id);
  saveApplicationTypes(updated);
  return updated;
}
