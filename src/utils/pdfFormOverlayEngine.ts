import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { ApplicationFormTemplate, FormEntryRecord, FormFieldDefinition } from "../types";

let cachedFontBytes: ArrayBuffer | null = null;

export async function getMalayalamFontBytes(): Promise<ArrayBuffer | null> {
  if (cachedFontBytes) return cachedFontBytes;
  try {
    const response = await fetch("/fonts/Manjari-Regular.ttf");
    if (response.ok) {
      cachedFontBytes = await response.arrayBuffer();
      return cachedFontBytes;
    }
  } catch (err) {
    console.warn("Could not load Manjari font from /fonts/Manjari-Regular.ttf, trying NotoSans:", err);
  }

  try {
    const response = await fetch("/fonts/NotoSansMalayalam.ttf");
    if (response.ok) {
      cachedFontBytes = await response.arrayBuffer();
      return cachedFontBytes;
    }
  } catch (err) {
    console.warn("Could not load Noto Sans Malayalam font:", err);
  }
  return null;
}

export interface GeneratePdfOptions {
  template: ApplicationFormTemplate;
  entry?: FormEntryRecord;
  fieldValues?: Record<string, any>;
}

/**
 * Generate a filled PDF with exact percentage-based field coordinates
 * and full Malayalam Unicode font support.
 */
export async function generateFilledPdfDocument({
  template,
  entry,
  fieldValues
}: GeneratePdfOptions): Promise<Uint8Array> {
  const activeValues = fieldValues || entry?.values || entry?.fieldValues || {};
  const fields: FormFieldDefinition[] = template.fields || template.fieldSchema?.fields || [];
  const sourcePdfData = template.pdfFileUrl || template.pdfUrl;

  let pdfDoc: PDFDocument;

  if (sourcePdfData && typeof sourcePdfData === "string" && sourcePdfData.startsWith("data:application/pdf;base64,")) {
    const base64Clean = sourcePdfData.replace(/^data:application\/pdf;base64,/, "");
    const binaryStr = atob(base64Clean);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  } else if (sourcePdfData && typeof sourcePdfData === "string" && sourcePdfData.startsWith("http")) {
    try {
      const resp = await fetch(sourcePdfData);
      const arrBuf = await resp.arrayBuffer();
      pdfDoc = await PDFDocument.load(arrBuf, { ignoreEncryption: true });
    } catch {
      pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]); // Standard ISO A4
    }
  } else {
    // Generate fresh ISO A4 page (210mm × 297mm)
    pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([595.28, 841.89]);
  }

  // Register fontkit
  try {
    pdfDoc.registerFontkit(fontkit);
  } catch (fkErr) {
    console.warn("Fontkit registration:", fkErr);
  }

  // Embed Malayalam Unicode TTF
  let customFont: any = null;
  try {
    const fontBytes = await getMalayalamFontBytes();
    if (fontBytes) {
      customFont = await pdfDoc.embedFont(fontBytes);
    } else {
      customFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    }
  } catch (fontErr) {
    console.warn("Fallback to standard font:", fontErr);
    customFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  }

  const pages = pdfDoc.getPages();

  // If blank document, draw clean official header
  if (!sourcePdfData && pages.length > 0) {
    const p1 = pages[0];
    const { width, height } = p1.getSize();

    // Top gold/dark banner
    p1.drawRectangle({
      x: 36,
      y: height - 100,
      width: width - 72,
      height: 64,
      color: rgb(0.97, 0.95, 0.90)
    });

    p1.drawRectangle({
      x: 36,
      y: height - 102,
      width: width - 72,
      height: 3,
      color: rgb(0.79, 0.65, 0.42) // Gold accent #C9A66B
    });

    p1.drawText(template.nameMl || template.name, {
      x: 50,
      y: height - 68,
      size: 15,
      font: customFont,
      color: rgb(0.1, 0.1, 0.12)
    });

    if (template.name && template.name !== template.nameMl) {
      p1.drawText(template.name, {
        x: 50,
        y: height - 88,
        size: 9,
        font: customFont,
        color: rgb(0.4, 0.4, 0.45)
      });
    }
  }

  // Overlay fields
  for (const field of fields) {
    const pageIdx = Math.max(0, (field.pageNumber || 1) - 1);
    while (pages.length <= pageIdx) {
      pdfDoc.addPage([595.28, 841.89]);
    }
    const page = pdfDoc.getPage(pageIdx);
    const { width, height } = page.getSize();

    const rawVal = activeValues[field.key] ?? field.defaultValue ?? "";
    let textVal = "";

    if (field.type === "checkbox") {
      textVal = rawVal ? "☑" : "☐";
    } else if (rawVal !== null && rawVal !== undefined) {
      textVal = String(rawVal).trim();
    }

    if (!textVal && field.type !== "signature") continue;

    const fontSize = field.fontSizePt || 11;
    const xPos = (field.xPercent / 100) * width;
    // PDF coordinates have (0,0) at bottom-left, inverted Y
    const yPos = height - ((field.yPercent / 100) * height) - fontSize;
    const fieldWidth = (field.widthPercent / 100) * width;

    if (field.type === "signature") {
      const sigText = textVal || activeValues["applicant_name"] || "Signed";
      page.drawText(`[ ഒപ്പ് / Signature ]: ${sigText}`, {
        x: xPos,
        y: yPos,
        size: 9,
        font: customFont,
        color: rgb(0.2, 0.2, 0.25)
      });
    } else if (field.type === "textarea") {
      const lines = textVal.split("\n");
      let currentY = yPos;
      for (const line of lines) {
        page.drawText(line, {
          x: xPos,
          y: currentY,
          size: fontSize,
          font: customFont,
          color: rgb(0.08, 0.08, 0.1),
          maxWidth: fieldWidth > 10 ? fieldWidth : undefined
        });
        currentY -= fontSize * 1.35;
      }
    } else {
      let finalX = xPos;
      if (field.alignment === "center" && customFont.widthOfTextAtSize) {
        try {
          const textWidth = customFont.widthOfTextAtSize(textVal, fontSize);
          finalX = Math.max(xPos, xPos + (fieldWidth - textWidth) / 2);
        } catch {}
      } else if (field.alignment === "right" && customFont.widthOfTextAtSize) {
        try {
          const textWidth = customFont.widthOfTextAtSize(textVal, fontSize);
          finalX = Math.max(xPos, xPos + (fieldWidth - textWidth));
        } catch {}
      }

      page.drawText(textVal, {
        x: finalX,
        y: yPos,
        size: fontSize,
        font: customFont,
        color: rgb(0.08, 0.08, 0.1),
        maxWidth: fieldWidth > 10 ? fieldWidth : undefined
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Trigger browser download of the filled PDF
 */
export async function downloadFilledPdf(
  template: ApplicationFormTemplate,
  entry: FormEntryRecord
): Promise<void> {
  try {
    // Attempt fast client-side generation
    const pdfBytes = await generateFilledPdfDocument({ template, entry });
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${template.name.replace(/[^a-zA-Z0-9\u0D00-\u0D7F]/g, "_")}_${entry.applicantName.replace(/[^a-zA-Z0-9\u0D00-\u0D7F]/g, "_")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch (err) {
    console.warn("Client PDF generation fallback to server endpoint:", err);
    // Fallback to server endpoint
    const resp = await fetch("/api/application-forms/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: template.id,
        template,
        entry
      })
    });
    const data = await resp.json();
    if (data.pdfBase64) {
      const link = document.createElement("a");
      link.href = data.pdfBase64;
      link.download = data.fileName || "Application_Form_Filled.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      throw new Error(data.error || "Failed to download PDF.");
    }
  }
}

/**
 * Trigger print dialog with the filled PDF
 */
export async function printFilledPdf(
  template: ApplicationFormTemplate,
  entry: FormEntryRecord
): Promise<void> {
  try {
    const pdfBytes = await generateFilledPdfDocument({ template, entry });
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 60000);
    };
  } catch (err) {
    console.error("Print generation error:", err);
    window.print();
  }
}
