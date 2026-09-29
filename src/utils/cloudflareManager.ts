import { safeJsonResponse } from "./safeFetch";

export interface CloudflareConfig {
  workerUrl: string;
  accountId: string;
  zoneId: string;
  kvNamespaceId: string;
  d1DatabaseId: string;
  r2BucketName: string;
  apiToken: string;
  enabled: boolean;
  autoSync: boolean;
}

export const DEFAULT_CLOUDFLARE_CONFIG: CloudflareConfig = {
  workerUrl: "https://vasthusilpy-backend.workers.dev",
  accountId: "",
  zoneId: "",
  kvNamespaceId: "",
  d1DatabaseId: "",
  r2BucketName: "vasthusilpy-storage",
  apiToken: "",
  enabled: true,
  autoSync: true
};

const STORAGE_KEY = "vasthusilpy_cloudflare_config_v1";

export function getStoredCloudflareConfig(): CloudflareConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CLOUDFLARE_CONFIG;
    return { ...DEFAULT_CLOUDFLARE_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("[Cloudflare] Failed to parse stored config:", err);
    return DEFAULT_CLOUDFLARE_CONFIG;
  }
}

export function saveStoredCloudflareConfig(config: Partial<CloudflareConfig>): CloudflareConfig {
  const current = getStoredCloudflareConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function pingCloudflareBackend(workerUrl?: string): Promise<{
  success: boolean;
  latencyMs: number;
  data?: any;
  error?: string;
}> {
  const cfg = getStoredCloudflareConfig();
  const url = (workerUrl || cfg.workerUrl || "/api/cloudflare/ping").replace(/\/$/, "");
  
  const startTime = performance.now();
  try {
    // First try proxying through Express server API
    const res = await fetch("/api/cloudflare/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workerUrl: url })
    });
    
    const latencyMs = Math.round(performance.now() - startTime);
    const parsed = await safeJsonResponse(res);
    const result = parsed.data || {};
    
    if (res.ok && parsed.ok && result.success) {
      return {
        success: true,
        latencyMs,
        data: result.data || result
      };
    } else {
      return {
        success: false,
        latencyMs,
        error: result.message || result.error || "Edge server responded with an error."
      };
    }
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs,
      error: err?.message || "Failed to connect to Cloudflare Worker."
    };
  }
}

export async function syncAppDataToCloudflareKV(dataKey: string, payload: any): Promise<{ success: boolean; message: string }> {
  try {
    const cfg = getStoredCloudflareConfig();
    const res = await fetch("/api/cloudflare/kv/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: dataKey,
        value: payload,
        workerUrl: cfg.workerUrl,
        apiToken: cfg.apiToken,
        accountId: cfg.accountId,
        kvNamespaceId: cfg.kvNamespaceId
      })
    });
    
    const parsed = await safeJsonResponse(res);
    const json = parsed.data || {};
    if (res.ok && parsed.ok && json.success) {
      return { success: true, message: json.message || "Data successfully synced to Cloudflare KV Edge." };
    }
    return { success: false, message: json.error || json.message || "Failed to sync to Cloudflare KV." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error syncing to Cloudflare." };
  }
}

export async function fetchAppDataFromCloudflareKV(dataKey: string): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    const cfg = getStoredCloudflareConfig();
    const res = await fetch(`/api/cloudflare/kv/get?key=${encodeURIComponent(dataKey)}&workerUrl=${encodeURIComponent(cfg.workerUrl)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    const parsed = await safeJsonResponse(res);
    const json = parsed.data || {};
    if (res.ok && parsed.ok && json.success) {
      return { success: true, data: json.data, message: "Data loaded from Cloudflare Edge KV." };
    }
    return { success: false, message: json.error || json.message || "Key not found on Cloudflare KV." };
  } catch (err: any) {
    return { success: false, message: err?.message || "Network error reading from Cloudflare." };
  }
}

export function generateWranglerToml(config: CloudflareConfig): string {
  return `# Vasthusilpy Engineering Systems - Cloudflare Worker Config
name = "vasthusilpy-backend"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[vars]
ENVIRONMENT = "production"
APP_NAME = "Vasthusilpy Portal Backend"
ALLOWED_ORIGIN = "*"

# Cloudflare KV Namespace for Caching & Sync
[[kv_namespaces]]
binding = "VASTHUSILPY_KV"
id = "${config.kvNamespaceId || "YOUR_KV_NAMESPACE_ID"}"

# Cloudflare D1 Relational SQL Database
[[d1_databases]]
binding = "VASTHUSILPY_DB"
database_name = "vasthusilpy_db"
database_id = "${config.d1DatabaseId || "YOUR_D1_DATABASE_ID"}"

# Cloudflare R2 Storage Bucket
[[r2_buckets]]
binding = "VASTHUSILPY_R2"
bucket_name = "${config.r2BucketName || "vasthusilpy-storage"}"
`;
}

export function generateWorkerScript(): string {
  return `/**
 * Vasthusilpy Engineering Systems - Cloudflare Worker Backend API
 * Supports KV storage, D1 database caching, CORS headers, and edge performance proxies.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    // Standard CORS headers for Vasthusilpy Applet & Web Clients
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 1. Edge Ping / Health Check
    if (url.pathname === "/api/ping" || url.pathname === "/") {
      return new Response(JSON.stringify({
        status: "online",
        service: "Vasthusilpy Cloudflare Edge Backend",
        timestamp: Date.now(),
        region: request.cf?.colo || "EDGE",
        country: request.cf?.country || "IN",
        ip: request.headers.get("cf-connecting-ip") || "0.0.0.0"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. KV Storage - GET Key
    if (url.pathname === "/api/kv/get" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (!key) {
        return new Response(JSON.stringify({ success: false, error: "Missing 'key' parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      try {
        if (!env.VASTHUSILPY_KV) {
          return new Response(JSON.stringify({
            success: false,
            error: "VASTHUSILPY_KV binding not configured on Worker"
          }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const value = await env.VASTHUSILPY_KV.get(key);
        if (value === null) {
          return new Response(JSON.stringify({ success: false, error: "Key not found in Cloudflare KV" }), {
            status: 444,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          key,
          data: JSON.parse(value)
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 3. KV Storage - SET Key
    if (url.pathname === "/api/kv/set" && request.method === "POST") {
      try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
          return new Response(JSON.stringify({ success: false, error: "Missing key or value" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        if (!env.VASTHUSILPY_KV) {
          return new Response(JSON.stringify({
            success: false,
            error: "VASTHUSILPY_KV binding not configured on Worker"
          }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        await env.VASTHUSILPY_KV.put(key, JSON.stringify(value));
        return new Response(JSON.stringify({
          success: true,
          message: "Data successfully written to Cloudflare Workers KV Edge Storage",
          key,
          timestamp: Date.now()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // 4. Default 404
    return new Response(JSON.stringify({
      error: "Not Found",
      path: url.pathname
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};
`;
}
