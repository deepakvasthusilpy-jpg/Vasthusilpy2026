import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ConstructionAgreement } from "../types";

/**
 * Capture an HTML DOM element and save as a high-quality PDF with A4 pages
 */
export const downloadElementAsPdf = async (
  element: HTMLElement,
  filename: string,
  onProgress?: (progressText: string) => void
): Promise<boolean> => {
  try {
    onProgress?.("PDF തയ്യാറാക്കുന്നു... (Preparing PDF canvas)");

    // Find all individual A4 printable pages within the container
    const pages = element.querySelectorAll<HTMLElement>(".a4-printable-page");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        onProgress?.(`പേജ് ${i + 1} / ${pages.length} പ്രോസസ്സ് ചെയ്യുന്നു...`);

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1000,
          ignoreElements: (el) => {
            return (
              el.classList.contains("print:hidden") ||
              el.classList.contains("no-print") ||
              el.classList.contains("estamp-watermark") ||
              el.getAttribute("data-html2canvas-ignore") === "true" ||
              el.getAttribute("data-print-hide") === "true"
            );
          },
          onclone: (clonedDoc) => {
            // Guarantee all preview watermark overlays and dashed indicator boxes are stripped from cloned canvas
            const watermarks = clonedDoc.querySelectorAll(
              ".estamp-watermark, [data-html2canvas-ignore='true'], [data-print-hide='true'], .print\\:hidden"
            );
            watermarks.forEach((wm) => {
              (wm as HTMLElement).style.display = "none";
              wm.remove();
            });
          }
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) {
          pdf.addPage("a4", "portrait");
        }
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }
    } else {
      // Single continuous element capture
      onProgress?.("പേജ് റെൻഡർ ചെയ്യുന്നു...");
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1000,
        ignoreElements: (el) => {
          return (
            el.classList.contains("print:hidden") ||
            el.classList.contains("no-print") ||
            el.classList.contains("estamp-watermark") ||
            el.getAttribute("data-html2canvas-ignore") === "true" ||
            el.getAttribute("data-print-hide") === "true"
          );
        },
        onclone: (clonedDoc) => {
          const watermarks = clonedDoc.querySelectorAll(
            ".estamp-watermark, [data-html2canvas-ignore='true'], [data-print-hide='true'], .print\\:hidden"
          );
          watermarks.forEach((wm) => {
            (wm as HTMLElement).style.display = "none";
            wm.remove();
          });
        }
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage("a4", "portrait");
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
    }

    onProgress?.("ഡൗൺലോഡ് ചെയ്യുന്നു... (Downloading PDF)");
    pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);
    onProgress?.("ബ്രൗസർ പ്രിന്റ് തുറക്കുന്നു...");
    window.print();
    return false;
  }
};

/**
 * Quick PDF Generator for Agreement
 */
export const exportAgreementPdf = async (
  agreement: ConstructionAgreement,
  printMode: "e_stamp" | "plain_a4",
  containerElementId: string = "agreement-printable-root",
  onProgress?: (text: string) => void
) => {
  const el = document.getElementById(containerElementId);
  const modeLabel = printMode === "e_stamp" ? "EStamp_Agreement" : "Plain_A4_Agreement";
  const sanitizedClient = (agreement.client?.clientName || "Client").replace(/[^a-zA-Z0-9_\u0D00-\u0D7F]/g, "_");
  const sanitizedNo = (agreement.agreementNo || "AGR").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${sanitizedNo}_${sanitizedClient}_${modeLabel}.pdf`;

  if (el) {
    return await downloadElementAsPdf(el, filename, onProgress);
  } else {
    window.print();
    return true;
  }
};

/**
 * Export Financial Report to PDF
 */
export const exportReportToPdf = async (
  containerElementId: string = "reports-printable-root",
  onProgress?: (text: string) => void
) => {
  const el = document.getElementById(containerElementId);
  const filename = `Construction_Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`;

  if (el) {
    return await downloadElementAsPdf(el, filename, onProgress);
  } else {
    window.print();
    return true;
  }
};

