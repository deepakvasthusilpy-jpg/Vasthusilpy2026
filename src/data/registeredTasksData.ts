export interface RegisteredTask {
  id: string;
  title: string;
  category: "SURVEY" | "DESIGN" | "STRUCTURAL" | "ESTIMATION" | "PERMIT" | "SUPERVISION" | "VALUATION" | "COMPLETION" | "GENERAL";
  categoryLabel: string;
  estimatedDays?: number;
  subtasks?: string[];
  description?: string;
}

export const DEFAULT_REGISTERED_TASKS: RegisteredTask[] = [];

export const TASK_CATEGORIES = [
  { id: "SURVEY", label: "Land & Vasthu Survey" },
  { id: "DESIGN", label: "Architectural & 3D Design" },
  { id: "STRUCTURAL", label: "Structural Engineering" },
  { id: "ESTIMATION", label: "Estimation & BOQ" },
  { id: "PERMIT", label: "KSMART & LSGD Permit" },
  { id: "SUPERVISION", label: "Site Quality Supervision" },
  { id: "VALUATION", label: "Valuation & Bank Reports" },
  { id: "COMPLETION", label: "Completion & Handover" },
  { id: "GENERAL", label: "General Project Tasks" }
] as const;

export type TaskCategoryType = typeof TASK_CATEGORIES[number]["id"];

const STORAGE_KEY = "vasthusilpy_registered_tasks";

export function loadRegisteredTasks(): RegisteredTask[] {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error("Failed to load registered tasks", e);
  }
  return [];
}

export function saveRegisteredTasks(tasks: RegisteredTask[], dispatchEvent = true): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      if (dispatchEvent) {
        window.dispatchEvent(new Event("vasthusilpy_registered_tasks_updated"));
        window.dispatchEvent(new Event("vasthusilpy_storage_update"));
      }
    }
  } catch (e) {
    console.error("Failed to save registered tasks", e);
  }
}

export function clearAllRegisteredTasks(): void {
  saveRegisteredTasks([]);
}

export function addCustomRegisteredTask(task: Omit<RegisteredTask, "id">): RegisteredTask {
  const tasks = loadRegisteredTasks();
  const newTask: RegisteredTask = {
    ...task,
    id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  };
  const updated = [newTask, ...tasks];
  saveRegisteredTasks(updated);
  return newTask;
}

export function updateRegisteredTask(updatedTask: RegisteredTask): void {
  const tasks = loadRegisteredTasks();
  const index = tasks.findIndex((t) => t.id === updatedTask.id);
  if (index >= 0) {
    tasks[index] = updatedTask;
    saveRegisteredTasks([...tasks]);
  } else {
    saveRegisteredTasks([updatedTask, ...tasks]);
  }
}

export function deleteRegisteredTask(id: string): void {
  const tasks = loadRegisteredTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  saveRegisteredTasks(filtered);
}

/**
 * Automatically ensures a task and its subtasks exist in the Master Tasks database.
 * If task title already exists, appends any new subtasks.
 * If task doesn't exist, creates a new Master RegisteredTask.
 */
export function ensureTaskRegistered(
  taskTitle: string,
  subtaskTitles: string[] = [],
  category: RegisteredTask["category"] = "GENERAL",
  categoryLabel?: string
): RegisteredTask {
  const trimmedTitle = taskTitle.trim();
  if (!trimmedTitle) {
    return {
      id: "temp",
      title: "",
      category: "GENERAL",
      categoryLabel: "General Project Tasks"
    };
  }

  const tasks = loadRegisteredTasks();
  const existing = tasks.find(
    (t) => t.title.trim().toLowerCase() === trimmedTitle.toLowerCase()
  );

  const matchedCat = TASK_CATEGORIES.find((c) => c.id === category);
  const finalCatLabel = categoryLabel || matchedCat?.label || "General Project Tasks";

  if (existing) {
    const existingSubtasks = existing.subtasks || [];
    const newUniqueSubtasks = subtaskTitles
      .map((s) => s.trim())
      .filter((s) => s && !existingSubtasks.some((es) => es.toLowerCase() === s.toLowerCase()));

    if (newUniqueSubtasks.length > 0) {
      const updatedTask: RegisteredTask = {
        ...existing,
        subtasks: [...existingSubtasks, ...newUniqueSubtasks]
      };
      updateRegisteredTask(updatedTask);
      return updatedTask;
    }
    return existing;
  }

  const validSubtasks = subtaskTitles.map((s) => s.trim()).filter(Boolean);
  const newTask: RegisteredTask = {
    id: `rt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: trimmedTitle,
    category: category,
    categoryLabel: finalCatLabel,
    estimatedDays: 3,
    subtasks: validSubtasks,
    description: `Registered task for ${trimmedTitle}`
  };

  const updated = [newTask, ...tasks];
  saveRegisteredTasks(updated);
  return newTask;
}
