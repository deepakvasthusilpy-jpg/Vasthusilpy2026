/**
 * Safe fetch helper to parse JSON responses safely.
 * Prevents "Unexpected token 'T', 'The page c...' is not valid JSON" errors
 * when a server endpoint returns an HTML page (404/500) or non-JSON text.
 */
export async function safeJsonResponse<T = any>(response: Response): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const status = response.status;
  const ok = response.ok;
  
  let text = "";
  try {
    text = await response.text();
  } catch (err) {
    return { ok: false, status, data: null, text: "" };
  }

  if (!text || !text.trim()) {
    return { ok, status, data: null, text: "" };
  }

  try {
    const data = JSON.parse(text) as T;
    return { ok, status, data, text };
  } catch (parseErr) {
    // If text starts with HTML tags or error messages (e.g. "The page cannot be found")
    const cleanMessage = text.length > 200 ? text.substring(0, 200) + "..." : text;
    console.warn(`[SafeFetch] Response from ${response.url} was not valid JSON (${status}):`, cleanMessage);
    return { ok: false, status, data: null, text };
  }
}

export async function fetchJsonSafely<T = any>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  try {
    const res = await fetch(url, options);
    const parsed = await safeJsonResponse<T>(res);
    
    if (parsed.ok && parsed.data) {
      return { success: true, data: parsed.data, status: parsed.status };
    } else if (parsed.data && (parsed.data as any).error) {
      return { success: false, error: (parsed.data as any).error, status: parsed.status };
    } else {
      const fallbackMsg = res.status === 404 ? "Requested server endpoint not found (404)." : `Server error (${res.status}).`;
      return { success: false, error: fallbackMsg, status: parsed.status };
    }
  } catch (netErr: any) {
    return { success: false, error: netErr?.message || "Network connection failed." };
  }
}
