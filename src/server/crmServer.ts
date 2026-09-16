import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { CrmProject, Invoice } from "../types.ts";

const DATA_DIR = path.join(process.cwd(), "data");
const WEB_DATA_DIR = path.join(DATA_DIR, "web_data");
const PROJECTS_FILE = path.join(DATA_DIR, "crm_projects.json");
const WEB_PROJECTS_FILE = path.join(WEB_DATA_DIR, "crm_projects.json");
const INVOICES_FILE = path.join(DATA_DIR, "crm_invoices.json");
const WEB_INVOICES_FILE = path.join(WEB_DATA_DIR, "crm_invoices.json");
const CAD_FILES_FILE = path.join(WEB_DATA_DIR, "cad_files.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create data directory:", e);
    }
  }
  if (!fs.existsSync(WEB_DATA_DIR)) {
    try {
      fs.mkdirSync(WEB_DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("Failed to create web_data directory:", e);
    }
  }
}

// Read projects from JSON file (checks both locations and merges)
function readProjectsFromFile(): CrmProject[] {
  ensureDataDir();
  const map = new Map<string, CrmProject>();

  // 1. Read primary data/crm_projects.json
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsed.forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
      }
    }
  } catch (e) {
    console.error("Error reading crm_projects.json:", e);
  }

  // 2. Read web_data/crm_projects.json
  try {
    if (fs.existsSync(WEB_PROJECTS_FILE)) {
      const content = fs.readFileSync(WEB_PROJECTS_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsed.forEach((p) => {
          if (p && p.id && !map.has(p.id)) {
            map.set(p.id, p);
          }
        });
      }
    }
  } catch (e) {
    console.error("Error reading web_data/crm_projects.json:", e);
  }

  return Array.from(map.values());
}

// Write projects to both JSON files
function writeProjectsToFile(projects: CrmProject[]): boolean {
  ensureDataDir();
  let success = true;
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing crm_projects.json:", e);
    success = false;
  }
  try {
    fs.writeFileSync(WEB_PROJECTS_FILE, JSON.stringify(projects, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing web_data/crm_projects.json:", e);
  }
  return success;
}

// Read CAD files from JSON
function readCadFilesFromFile(): any[] {
  ensureDataDir();
  try {
    if (fs.existsSync(CAD_FILES_FILE)) {
      const content = fs.readFileSync(CAD_FILES_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error reading cad_files.json:", e);
  }
  return [];
}

// Write CAD files to JSON
function writeCadFilesToFile(files: any[]): boolean {
  ensureDataDir();
  try {
    fs.writeFileSync(CAD_FILES_FILE, JSON.stringify(files, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Error writing cad_files.json:", e);
    return false;
  }
}

// Read invoices from JSON file
function readInvoicesFromFile(): Invoice[] {
  ensureDataDir();
  const map = new Map<string, Invoice>();
  try {
    if (fs.existsSync(INVOICES_FILE)) {
      const content = fs.readFileSync(INVOICES_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsed.forEach((inv) => {
          if (inv && inv.id) map.set(inv.id, inv);
        });
      }
    }
  } catch (e) {
    console.error("Error reading crm_invoices.json:", e);
  }
  try {
    if (fs.existsSync(WEB_INVOICES_FILE)) {
      const content = fs.readFileSync(WEB_INVOICES_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsed.forEach((inv) => {
          if (inv && inv.id && !map.has(inv.id)) {
            map.set(inv.id, inv);
          }
        });
      }
    }
  } catch (e) {
    console.error("Error reading web_data/crm_invoices.json:", e);
  }
  return Array.from(map.values());
}

// Write invoices to JSON file
function writeInvoicesToFile(invoices: Invoice[]): boolean {
  ensureDataDir();
  try {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
    fs.writeFileSync(WEB_INVOICES_FILE, JSON.stringify(invoices, null, 2), "utf-8");
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

  // GET single project by ID (public access for QR code & shareable link)
  app.get("/api/crm/projects/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rawId = (id || "").trim();
      const cleanId = rawId.toLowerCase();
      const normId = cleanId.replace(/[^a-z0-9]/g, "");

      const projects = readProjectsFromFile();

      // 1. Direct Project Matches
      let found = projects.find(
        (p) =>
          p.id.toLowerCase() === cleanId ||
          p.id.toLowerCase().replace(/[^a-z0-9]/g, "") === normId ||
          (p.title && p.title.toLowerCase().includes(cleanId)) ||
          (p.clientPhone && p.clientPhone.replace(/\D/g, "") === normId)
      );

      if (found) {
        return res.json({ success: true, project: found });
      }

      // 2. Check CAD Drawings & Blueprints (Cross-portal fallback so scanning CAD QR in project portal also works)
      const cadFiles = readCadFilesFromFile();
      const cadMatch = cadFiles.find((c) => {
        const cId = (c.id || "").toLowerCase();
        const sToken = (c.shareSettings?.shareToken || "").toLowerCase();
        const cTitle = (c.title || c.name || "").toLowerCase();
        const cPhone = (c.mobileNo || c.clientPhone || "").replace(/\D/g, "");
        return (
          cId === cleanId ||
          sToken === cleanId ||
          cId.replace(/[^a-z0-9]/g, "") === normId ||
          sToken.replace(/[^a-z0-9]/g, "") === normId ||
          (cTitle && cTitle.includes(cleanId)) ||
          (cPhone && cPhone === normId)
        );
      });

      if (cadMatch) {
        // Synthesize a complete CrmProject representation from CAD drawing
        const syntheticProject: CrmProject = {
          id: cadMatch.id,
          title: cadMatch.title || cadMatch.name || "Architectural Drawing Record",
          clientName: cadMatch.clientName || cadMatch.ownerName || "Valued Client",
          clientPhone: cadMatch.mobileNo || cadMatch.clientPhone || "",
          location: cadMatch.location || "Kerala",
          assignee: "DEEPAK",
          status: "COMPLETED",
          dueDate: (cadMatch.createdAt || new Date().toISOString()).split("T")[0],
          description:
            cadMatch.description ||
            `Architectural Blueprint & Sanction Documentation. Drawing: ${cadMatch.name || cadMatch.title}. Category: ${cadMatch.category || "ARCHITECTURAL"}. Complying with KPBR statutory engineering standards.`,
          subTasks: [
            {
              id: "sub_1",
              title: "Drafting Architectural CAD & Plan",
              completed: true,
              assignee: "DEEPAK"
            },
            {
              id: "sub_2",
              title: "Structural & Plot Boundary Compliance Verification",
              completed: true,
              assignee: "DEEPAK"
            }
          ],
          attachments: (cadMatch.attachments || []).map((att: any, idx: number) => ({
            id: att.id || `cad_att_${idx}`,
            name: att.name || `Vasthusilpy_Document_${idx + 1}`,
            type: att.type || (att.isPdf ? "application/pdf" : "application/octet-stream"),
            size:
              typeof att.size === "number"
                ? `${(att.size / (1024 * 1024)).toFixed(2)} MB`
                : att.size || "1.2 MB",
            uploadedAt: att.uploadedAt || cadMatch.createdAt || new Date().toISOString(),
            url: att.dataUrl || att.downloadUrl || `/api/cad/file/${encodeURIComponent(cadMatch.id)}`
          })),
          activities: [
            {
              id: "act_cad_1",
              action: "CAD Blueprint Archived in Vault",
              timestamp: cadMatch.createdAt || "2026-09-12 10:00 AM",
              actor: "Deepak C"
            }
          ],
          comments: [],
          createdAt: cadMatch.createdAt || new Date().toISOString()
        };

        return res.json({ success: true, project: syntheticProject, isFromCadVault: true });
      }

      return res.status(404).json({
        success: false,
        error: `Project record '${id}' could not be located in the Vasthusilpy engineering database.`,
        id
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------
  // CAD FILES & SHARING API (Zero-Login Public Access)
  // ---------------------------------------------------------

  // GET CAD drawing by share token
  app.get("/api/cad/share/:token", (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const cleanToken = decodeURIComponent(token || "").trim().toLowerCase();
      const normToken = cleanToken.replace(/[^a-z0-9]/g, "");

      const cadFiles = readCadFilesFromFile();
      const match = cadFiles.find((c) => {
        const sToken = (c.shareSettings?.shareToken || "").toLowerCase();
        const cId = (c.id || "").toLowerCase();
        return (
          sToken === cleanToken ||
          cId === cleanToken ||
          sToken.replace(/[^a-z0-9]/g, "") === normToken ||
          cId.replace(/[^a-z0-9]/g, "") === normToken
        );
      });

      if (match) {
        return res.json({ success: true, file: match });
      }

      // Check CRM projects fallback
      const projects = readProjectsFromFile();
      const projMatch = projects.find(
        (p) =>
          p.id.toLowerCase() === cleanToken ||
          p.id.toLowerCase().replace(/[^a-z0-9]/g, "") === normToken
      );

      if (projMatch) {
        return res.json({
          success: true,
          file: {
            id: projMatch.id,
            name: projMatch.title,
            title: projMatch.title,
            clientName: projMatch.clientName,
            mobileNo: projMatch.clientPhone,
            location: projMatch.location,
            description: projMatch.description,
            shareSettings: {
              isShared: true,
              isPublic: true,
              shareToken: projMatch.id,
              allowDownload: true
            },
            attachments: (projMatch.attachments || []).map((att) => ({
              id: att.id,
              name: att.name,
              type: att.type,
              size: att.size,
              dataUrl: att.url,
              downloadUrl: att.url,
              isPdf: att.type?.includes("pdf") || att.name?.endsWith(".pdf")
            })),
            createdAt: projMatch.dueDate || new Date().toISOString()
          },
          isFromCrmProject: true
        });
      }

      return res.status(404).json({
        success: false,
        error: `CAD drawing with share token '${token}' was not found.`,
        token
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET CAD drawing by ID
  app.get("/api/cad/file/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const cleanId = decodeURIComponent(id || "").trim().toLowerCase();
      const normId = cleanId.replace(/[^a-z0-9]/g, "");

      const cadFiles = readCadFilesFromFile();
      const match = cadFiles.find((c) => {
        const cId = (c.id || "").toLowerCase();
        const sToken = (c.shareSettings?.shareToken || "").toLowerCase();
        return (
          cId === cleanId ||
          cId.replace(/[^a-z0-9]/g, "") === normId ||
          sToken === cleanId ||
          sToken.replace(/[^a-z0-9]/g, "") === normId
        );
      });

      if (match) {
        return res.json({ success: true, file: match });
      }

      return res.status(404).json({ success: false, error: "CAD file not found", id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET all CAD files
  app.get("/api/cad/files", (req: Request, res: Response) => {
    try {
      const cadFiles = readCadFilesFromFile();
      return res.json({ success: true, files: cadFiles, count: cadFiles.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST save or update a CAD file
  app.post("/api/cad/save", (req: Request, res: Response) => {
    try {
      const file = req.body.file || req.body;
      if (!file || !file.id) {
        return res.status(400).json({ success: false, error: "CAD file record with id is required" });
      }

      const existing = readCadFilesFromFile();
      const idx = existing.findIndex((c) => c.id === file.id);
      let updated: any[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = { ...existing[idx], ...file, updatedAt: new Date().toISOString() };
      } else {
        updated = [{ ...file, createdAt: file.createdAt || new Date().toISOString() }, ...existing];
      }

      writeCadFilesToFile(updated);
      return res.json({ success: true, file, count: updated.length });
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
