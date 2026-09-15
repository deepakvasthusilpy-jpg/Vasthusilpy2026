import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { CrmProject, Invoice } from "../types.ts";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "crm_projects.json");
const INVOICES_FILE = path.join(DATA_DIR, "crm_invoices.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create data directory:", e);
    }
  }
}

// Read projects from JSON file
function readProjectsFromFile(): CrmProject[] {
  ensureDataDir();
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading crm_projects.json:", e);
  }
  return [];
}

// Write projects to JSON file
function writeProjectsToFile(projects: CrmProject[]): boolean {
  ensureDataDir();
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error writing crm_projects.json:", e);
    return false;
  }
}

// Read invoices from JSON file
function readInvoicesFromFile(): Invoice[] {
  ensureDataDir();
  try {
    if (fs.existsSync(INVOICES_FILE)) {
      const content = fs.readFileSync(INVOICES_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading crm_invoices.json:", e);
  }
  return [];
}

// Write invoices to JSON file
function writeInvoicesToFile(invoices: Invoice[]): boolean {
  ensureDataDir();
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error writing crm_invoices.json:", e);
    return false;
  }
}

export function registerCrmRoutes(app: Express) {
  // ---------------------------------------------------------
  // CRM PROJECTS API
  // ---------------------------------------------------------

  // GET all projects
  app.get("/api/crm/projects", (req: Request, res: Response) => {
    try {
      const projects = readProjectsFromFile();
      return res.json({ success: true, projects });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST create or save a project
  app.post("/api/crm/projects", (req: Request, res: Response) => {
    try {
      const newProj: CrmProject = req.body.project || req.body;
      if (!newProj || !newProj.id) {
        return res.status(400).json({ success: false, error: "Project data with id is required" });
      }

      const existing = readProjectsFromFile();
      const index = existing.findIndex((p) => p.id === newProj.id);
      let updated: CrmProject[];

      if (index >= 0) {
        updated = [...existing];
        updated[index] = { ...existing[index], ...newProj };
      } else {
        updated = [newProj, ...existing];
      }

      writeProjectsToFile(updated);
      return res.json({ success: true, project: newProj, count: updated.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT update a project by ID
  app.put("/api/crm/projects/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: Partial<CrmProject> = req.body;

      const existing = readProjectsFromFile();
      const index = existing.findIndex((p) => p.id === id);

      if (index >= 0) {
        existing[index] = { ...existing[index], ...updateData };
        writeProjectsToFile(existing);
        return res.json({ success: true, project: existing[index] });
      } else {
        // If not exists, insert it
        const newProj = { ...updateData, id } as CrmProject;
        const updated = [newProj, ...existing];
        writeProjectsToFile(updated);
        return res.json({ success: true, project: newProj });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE a project by ID
  app.delete("/api/crm/projects/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = readProjectsFromFile();
      const remaining = existing.filter((p) => p.id !== id);
      writeProjectsToFile(remaining);
      return res.json({ success: true, deletedId: id, remainingCount: remaining.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST sync multiple projects (bidirectional merge)
  app.post("/api/crm/projects/sync", (req: Request, res: Response) => {
    try {
      const clientProjects: CrmProject[] = Array.isArray(req.body.projects) ? req.body.projects : [];
      const serverProjects = readProjectsFromFile();

      // Merge: create a map by ID
      const map = new Map<string, CrmProject>();

      // Put server projects first
      serverProjects.forEach((p) => {
        if (p && p.id) map.set(p.id, p);
      });

      // Overlay client projects
      clientProjects.forEach((p) => {
        if (p && p.id) {
          const prev = map.get(p.id);
          if (!prev) {
            map.set(p.id, p);
          } else {
            // Keep the one with more recent activities or merged subtasks
            map.set(p.id, {
              ...prev,
              ...p,
              subTasks: p.subTasks || prev.subTasks,
              status: p.status || prev.status,
              assignee: p.assignee || prev.assignee
            });
          }
        }
      });

      const merged = Array.from(map.values());
      writeProjectsToFile(merged);

      return res.json({ success: true, projects: merged });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // CRM INVOICES API
  // ---------------------------------------------------------

  // GET all invoices
  app.get("/api/crm/invoices", (req: Request, res: Response) => {
    try {
      const invoices = readInvoicesFromFile();
      return res.json({ success: true, invoices });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST create or save an invoice
  app.post("/api/crm/invoices", (req: Request, res: Response) => {
    try {
      const newInv: Invoice = req.body.invoice || req.body;
      if (!newInv || !newInv.id) {
        return res.status(400).json({ success: false, error: "Invoice data with id is required" });
      }

      const existing = readInvoicesFromFile();
      const index = existing.findIndex((i) => i.id === newInv.id);
      let updated: Invoice[];

      if (index >= 0) {
        updated = [...existing];
        updated[index] = { ...existing[index], ...newInv };
      } else {
        updated = [newInv, ...existing];
      }

      writeInvoicesToFile(updated);
      return res.json({ success: true, invoice: newInv, count: updated.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT update an invoice by ID
  app.put("/api/crm/invoices/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData: Partial<Invoice> = req.body;

      const existing = readInvoicesFromFile();
      const index = existing.findIndex((i) => i.id === id);

      if (index >= 0) {
        existing[index] = { ...existing[index], ...updateData };
        writeInvoicesToFile(existing);
        return res.json({ success: true, invoice: existing[index] });
      } else {
        const newInv = { ...updateData, id } as Invoice;
        const updated = [newInv, ...existing];
        writeInvoicesToFile(updated);
        return res.json({ success: true, invoice: newInv });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE an invoice by ID
  app.delete("/api/crm/invoices/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const existing = readInvoicesFromFile();
      const remaining = existing.filter((i) => i.id !== id);
      writeInvoicesToFile(remaining);
      return res.json({ success: true, deletedId: id, remainingCount: remaining.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST sync multiple invoices
  app.post("/api/crm/invoices/sync", (req: Request, res: Response) => {
    try {
      const clientInvoices: Invoice[] = Array.isArray(req.body.invoices) ? req.body.invoices : [];
      const serverInvoices = readInvoicesFromFile();

      const map = new Map<string, Invoice>();
      serverInvoices.forEach((i) => {
        if (i && i.id) map.set(i.id, i);
      });

      clientInvoices.forEach((i) => {
        if (i && i.id) {
          const prev = map.get(i.id);
          if (!prev) {
            map.set(i.id, i);
          } else {
            map.set(i.id, { ...prev, ...i });
          }
        }
      });

      const merged = Array.from(map.values());
      writeInvoicesToFile(merged);

      return res.json({ success: true, invoices: merged });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}
