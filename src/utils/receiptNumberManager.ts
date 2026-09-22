import { CrmProject } from "../types";

const RECEIPT_PREFIX = "VS";
const STORAGE_KEY_COUNTER = "vasthusilpy_receipt_counter";
const STORAGE_KEY_PROJECTS = "vasthusilpy_crm_projects";

/**
 * Formats a sequence number with the 'VS' prefix and at least 6 digits with leading zeros.
 * e.g. 1 -> VS000001, 25 -> VS000025, 999999 -> VS999999, 1000000 -> VS1000000
 */
export function formatReceiptNumber(num: number): string {
  const safeNum = Math.max(1, Math.floor(num));
  const numStr = String(safeNum);
  const padded = numStr.length < 6 ? numStr.padStart(6, "0") : numStr;
  return `${RECEIPT_PREFIX}${padded}`;
}

/**
 * Parses numeric part from a receipt number string like "VS000001" or "vs000042".
 * Returns null if invalid or does not match prefix.
 */
export function parseReceiptNumber(receiptNo?: string): number | null {
  if (!receiptNo || typeof receiptNo !== "string") return null;
  const match = receiptNo.trim().toUpperCase().match(/^VS(\d+)$/);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? null : val;
  }
  return null;
}

/**
 * Gets all stored CRM projects from localStorage.
 */
export function getStoredCrmProjects(): CrmProject[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Failed to read projects from localStorage", err);
    return [];
  }
}

/**
 * Finds the highest assigned receipt number across stored projects and the counter.
 */
export function getHighestReceiptNumber(allProjects?: CrmProject[]): number {
  let highest = 0;

  // 1. Check persistent counter
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const storedVal = localStorage.getItem(STORAGE_KEY_COUNTER);
      if (storedVal) {
        const parsed = parseInt(storedVal, 10);
        if (!isNaN(parsed) && parsed > highest) {
          highest = parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read receipt counter from localStorage", e);
    }
  }

  // 2. Check provided or stored projects
  const projects = allProjects || getStoredCrmProjects();
  for (const proj of projects) {
    const num = parseReceiptNumber(proj.receiptNumber);
    if (num !== null && num > highest) {
      highest = num;
    }
  }

  return highest;
}

/**
 * Generates the next sequential receipt number without attaching it yet.
 */
export function previewNextReceiptNumber(allProjects?: CrmProject[]): string {
  const highest = getHighestReceiptNumber(allProjects);
  return formatReceiptNumber(highest + 1);
}

/**
 * Retrieves the existing receipt number for a project, or assigns the next sequential
 * number (starting at VS000001 and incrementing by 1), persisting it to storage.
 */
export function getOrAssignReceiptNumber(
  project: CrmProject,
  allProjects?: CrmProject[],
  onSave?: (updatedProject: CrmProject) => void
): string {
  // If project already has a valid VS receipt number, return it directly
  if (project.receiptNumber) {
    const parsed = parseReceiptNumber(project.receiptNumber);
    if (parsed !== null) {
      return formatReceiptNumber(parsed);
    }
  }

  // Calculate next sequential number
  const highest = getHighestReceiptNumber(allProjects);
  const nextNum = highest + 1;
  const newReceiptNo = formatReceiptNumber(nextNum);

  // Persist the new counter
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY_COUNTER, String(nextNum));
    } catch (e) {
      console.warn("Could not update receipt counter in localStorage", e);
    }
  }

  // Assign to project
  project.receiptNumber = newReceiptNo;
  if (!project.workReceiptGeneratedAt) {
    project.workReceiptGeneratedAt = new Date().toISOString();
  }

  // Update in localStorage
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = getStoredCrmProjects();
      let found = false;
      const updatedList = stored.map((p) => {
        if (p.id === project.id) {
          found = true;
          return { ...p, receiptNumber: newReceiptNo, workReceiptGeneratedAt: project.workReceiptGeneratedAt };
        }
        return p;
      });
      if (!found && project.id) {
        updatedList.push({ ...project, receiptNumber: newReceiptNo });
      }
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(updatedList));
    } catch (e) {
      console.warn("Could not persist updated project receipt number", e);
    }
  }

  if (onSave) {
    onSave({ ...project, receiptNumber: newReceiptNo });
  }

  return newReceiptNo;
}
