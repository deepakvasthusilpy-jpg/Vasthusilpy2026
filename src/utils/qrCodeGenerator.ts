import QRCode from "qrcode";

export interface PlanQrData {
  projectId: string;
  sheetId: string;
  drawingNumber: string;
  drawingName: string;
  clientName: string;
  engineerCall: string;
  engineerWhatsapp: string;
}

/**
 * Builds the verification & download URL that a mobile device will navigate to
 * when scanning the QR code on the printed architectural sheet.
 * Zero login or account required for anyone scanning!
 */
export function buildPlanVerificationUrl(data: PlanQrData, options?: { directDownload?: boolean }): string {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://vasthusilpy.com";

  if (options?.directDownload) {
    return `${origin}/api/cloud-plans/download/${encodeURIComponent(data.projectId)}?sheetId=${encodeURIComponent(data.sheetId)}`;
  }

  const params = new URLSearchParams({
    verify_plan: "1",
    projId: data.projectId,
    sheetId: data.sheetId,
    dwg: data.drawingNumber,
    client: data.clientName,
    title: data.drawingName || "Architectural Floor Plan",
    call: data.engineerCall,
    wa: data.engineerWhatsapp,
    cloud: "1",
    cloud_download: "1"
  });

  return `${origin}?${params.toString()}#verify-plan`;
}

/**
 * Returns the direct cloud drive download link (bypasses UI, directly downloads PDF file)
 */
export function buildDirectCloudDownloadUrl(projectId: string, sheetId?: string): string {
  const origin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://vasthusilpy.com";
  
  const query = sheetId ? `?sheetId=${encodeURIComponent(sheetId)}` : "";
  return `${origin}/api/cloud-plans/download/${encodeURIComponent(projectId)}${query}`;
}

/**
 * Generates a high-contrast QR code as a Data URL for embedding on title blocks and sheets.
 */
export async function generatePlanQrCodeDataUrl(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 256,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "M"
    });
  } catch (err) {
    console.warn("Failed to generate QR code data URL:", err);
    // Fallback QR SVG data URL
    return "";
  }
}
