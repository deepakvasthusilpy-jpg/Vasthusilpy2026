import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CLOUD_STORE_DIR = path.join(DATA_DIR, "cloud_store");

function ensureCloudStoreDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {}
  }
  if (!fs.existsSync(CLOUD_STORE_DIR)) {
    try {
      fs.mkdirSync(CLOUD_STORE_DIR, { recursive: true });
    } catch (e) {}
  }
}

// Permanent Demo Tombstones to never resurrect
const HARD_CODED_DEMO_TOMBSTONES = [
  "EST-2026-003",
  "VAL-2026-003",
  "qtn_2026_001",
  "qtn_2026_002",
  "app_demo_001",
  "app_demo_002",
  "app_demo_003"
];

function getFilePath(collectionName: string): string {
  ensureCloudStoreDir();
  const safeName = collectionName.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(CLOUD_STORE_DIR, `${safeName}.json`);
}

function readCollection<T = any>(collectionName: string): T[] {
  ensureCloudStoreDir();
  const filePath = getFilePath(collectionName);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    } else {
      // Fallback: Check data/web_data or data/
      const webDataPath = path.join(process.cwd(), "data", "web_data", `${collectionName}.json`);
      if (fs.existsSync(webDataPath)) {
        const content = fs.readFileSync(webDataPath, "utf-8");
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.error(`[CloudStore] Error reading ${collectionName}:`, e);
  }
  return [];
}

function writeCollection<T = any>(collectionName: string, data: T[]): boolean {
  ensureCloudStoreDir();
  const filePath = getFilePath(collectionName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error(`[CloudStore] Error writing ${collectionName}:`, e);
    return false;
  }
}

// In-memory active SSE clients
const sseClients = new Set<Response>();

export function broadcastSSE(eventType: string, payload: any) {
  const data = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function getDeletedRecordsMap(): Set<string> {
  const records = readCollection<{ id: string; collection?: string }>("deleted_records");
  const set = new Set<string>(HARD_CODED_DEMO_TOMBSTONES);
  records.forEach((r) => {
    if (r && r.id) set.add(r.id);
  });
  return set;
}

function saveDeletedRecord(id: string, collection?: string) {
  const current = readCollection<{ id: string; collection?: string; deletedAt?: string }>("deleted_records");
  if (!current.some((r) => r.id === id)) {
    const updated = [
      ...current,
      { id, collection: collection || "unknown", deletedAt: new Date().toISOString() }
    ];
    writeCollection("deleted_records", updated);
  }
}

export function registerRealtimeSyncRoutes(app: Express) {
  ensureCloudStoreDir();

  // -------------------------------------------------------------
  // 1. Server-Sent Events (SSE) Realtime Stream
  // -------------------------------------------------------------
  app.get("/api/sync/events", (req: Request, res: Response) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });

    res.write("event: connected\ndata: {\"status\":\"connected\"}\n\n");
    sseClients.add(res);

    // Keepalive ping every 15s to prevent timeouts
    const pingInterval = setInterval(() => {
      try {
        res.write("event: ping\ndata: {\"time\":" + Date.now() + "}\n\n");
      } catch (e) {
        clearInterval(pingInterval);
        sseClients.delete(res);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(pingInterval);
      sseClients.delete(res);
    });
  });

  // -------------------------------------------------------------
  // 2. Online Applications Cloud Storage & Instant Sync
  // -------------------------------------------------------------
  app.get("/api/online-applications", (req: Request, res: Response) => {
    const deletedIds = getDeletedRecordsMap();
    const records = readCollection("online_applications");
    const filtered = records.filter((r: any) => r && r.id && !deletedIds.has(r.id));
    res.json({ success: true, records: filtered });
  });

  app.post("/api/online-applications", (req: Request, res: Response) => {
    try {
      const body = req.body;
      const incoming: any[] = Array.isArray(body?.records)
        ? body.records
        : body && body.id
        ? [body]
        : [];

      const deletedIds = getDeletedRecordsMap();
      const current = readCollection("online_applications");
      const map = new Map<string, any>();

      current.forEach((r) => {
        if (r && r.id && !deletedIds.has(r.id)) map.set(r.id, r);
      });

      incoming.forEach((r) => {
        if (r && r.id && !deletedIds.has(r.id)) {
          map.set(r.id, {
            ...r,
            updatedAt: r.updatedAt || new Date().toISOString()
          });
        }
      });

      const updated = Array.from(map.values()).sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );

      writeCollection("online_applications", updated);

      // Instantaneously notify all connected browsers & devices
      broadcastSSE("sync_update", {
        collection: "online_applications",
        records: updated
      });

      res.json({ success: true, count: updated.length, records: updated });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/online-applications/:id", (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ error: "Missing ID" });

      saveDeletedRecord(id, "online_applications");

      const current = readCollection("online_applications");
      const remaining = current.filter((r: any) => r.id !== id);
      writeCollection("online_applications", remaining);

      // Instant broadcast deletion event to all clients
      broadcastSSE("record_deleted", {
        collection: "online_applications",
        id
      });
      broadcastSSE("sync_update", {
        collection: "online_applications",
        records: remaining
      });

      res.json({ success: true, deletedId: id });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // -------------------------------------------------------------
  // 3. Deletion Registry & Tombstone Hub
  // -------------------------------------------------------------
  app.get("/api/deletion-registry", (req: Request, res: Response) => {
    const deleted = readCollection("deleted_records");
    const allIds = Array.from(getDeletedRecordsMap());
    res.json({ success: true, deletedIds: allIds, records: deleted });
  });

  app.post("/api/deletion-registry", (req: Request, res: Response) => {
    const { id, collection: col } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing ID" });

    saveDeletedRecord(id, col);

    // Remove from whichever collection if present
    if (col) {
      const records = readCollection(col);
      const filtered = records.filter((r: any) => r && r.id !== id);
      if (filtered.length !== records.length) {
        writeCollection(col, filtered);
        broadcastSSE("sync_update", { collection: col, records: filtered });
      }
    }

    broadcastSSE("record_deleted", { id, collection: col });
    res.json({ success: true, id, collection: col });
  });

  // -------------------------------------------------------------
  // 4. Universal Cloud Storage Push & Pull
  // -------------------------------------------------------------
  app.get("/api/cloud-sync/pull", (req: Request, res: Response) => {
    const deletedIds = getDeletedRecordsMap();
    const collections = [
      "online_applications",
      "crm_projects",
      "crm_invoices",
      "estimates",
      "rate_items",
      "customers",
      "valuations",
      "quotations",
      "cad_folders",
      "cad_files"
    ];

    const result: Record<string, any[]> = {};
    collections.forEach((col) => {
      const records = readCollection(col);
      result[col] = records.filter((r: any) => r && r.id && !deletedIds.has(r.id));
    });

    result["deleted_records"] = Array.from(deletedIds);
    res.json({ success: true, data: result, store: result });
  });

  app.post("/api/cloud-sync/push", (req: Request, res: Response) => {
    try {
      const { collection: col, records, items, item, id, data: singleData, deleted, deletedId } = req.body || {};
      if (!col) return res.status(400).json({ error: "Missing collection" });

      const delId = deletedId || (deleted ? id : null);
      if (delId) {
        saveDeletedRecord(delId, col);
        const current = readCollection(col);
        const filtered = current.filter((r: any) => r && r.id !== delId);
        writeCollection(col, filtered);
        broadcastSSE("record_deleted", { collection: col, id: delId });
        broadcastSSE("sync_update", { collection: col, records: filtered });
        return res.json({ success: true, deletedId: delId });
      }

      const listToSave = Array.isArray(records) ? records : Array.isArray(items) ? items : null;
      if (listToSave) {
        const deletedIds = getDeletedRecordsMap();
        const filtered = listToSave.filter((r: any) => r && r.id && !deletedIds.has(r.id));
        writeCollection(col, filtered);
        broadcastSSE("sync_update", { collection: col, records: filtered, items: filtered });
        return res.json({ success: true, count: filtered.length });
      }

      const singleDoc = singleData || item;
      if (singleDoc && (singleDoc.id || id)) {
        const docToSave = { ...singleDoc, id: singleDoc.id || id };
        const deletedIds = getDeletedRecordsMap();
        if (deletedIds.has(docToSave.id)) {
          return res.json({ success: true, ignored: true });
        }
        const current = readCollection(col);
        const filtered = current.filter((r: any) => r && r.id !== docToSave.id);
        filtered.unshift(docToSave);
        writeCollection(col, filtered);
        broadcastSSE("sync_update", { collection: col, records: filtered, item: docToSave });
        return res.json({ success: true, item: docToSave });
      }

      res.status(400).json({ error: "Invalid payload" });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
}
