import * as pdfjsLib from "pdfjs-dist";
import { PlanAttachment, PlanSheet } from "../types/buildingPlanTemplate";

// Configure PDF.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
} catch {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ConvertedPageResult {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
  title: string;
}

/**
 * Convert an uploaded image file (PNG, JPG, SVG, WEBP) to clean base64 data URL.
 */
export async function convertImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Failed to read image file"));
      }
    };
    reader.onerror = () => reject(new Error("Error reading image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert an uploaded PDF file into an array of high-resolution PNG image Data URLs (one per page).
 */
export async function convertPdfFileToPages(file: File): Promise<ConvertedPageResult[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      useSystemFonts: true
    });

    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const pages: ConvertedPageResult[] = [];

    const baseName = file.name.replace(/\.[^/.]+$/, "");

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      // High resolution viewport (scale 2.0 ensures crisp architectural linework)
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d", { alpha: false });

      if (!ctx) continue;

      // Fill white background for blueprints
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      };

      await (page.render(renderContext as any) as any).promise;
      const dataUrl = canvas.toDataURL("image/png");

      pages.push({
        pageNumber: pageNum,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
        title: totalPages > 1 ? `${baseName} - Page ${pageNum}` : baseName
      });
    }

    return pages;
  } catch (err) {
    console.error("PDF conversion error:", err);
    throw new Error(`Failed to convert PDF: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Creates a new PlanAttachment from an image or converted PDF page, positioned cleanly on the sheet.
 */
export function createPlanAttachment(
  title: string,
  imageUrl: string,
  fileName: string,
  existingCount: number,
  customPosition?: { x?: number; y?: number; width?: number; scale?: string }
): PlanAttachment {
  const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Default positions: if first attachment, center with nice margin; otherwise cascade
  const defaultX = existingCount === 0 ? 5 : Math.min(50, 8 + (existingCount % 4) * 12);
  const defaultY = existingCount === 0 ? 6 : Math.min(50, 8 + (existingCount % 4) * 10);
  const defaultWidth = existingCount === 0 ? 88 : 45;

  return {
    id,
    title: title.toUpperCase(),
    imageUrl,
    fileName,
    x: customPosition?.x ?? defaultX,
    y: customPosition?.y ?? defaultY,
    width: customPosition?.width ?? defaultWidth,
    scale: customPosition?.scale ?? "1 : 100",
    zoom: 100,
    rotation: 0,
    locked: false,
    zIndex: existingCount + 1
  };
}
