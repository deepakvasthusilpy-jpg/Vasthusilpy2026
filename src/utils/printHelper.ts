/**
 * Print & PDF Export Utility for Vasthusilpy Digital Portal
 * Handles window focus, clean PDF default filename, iframe/popup compatibility, and A4 styling.
 */

export interface PrintOptions {
  pageMargin?: string;
  paperSize?: string;
  isInvoice?: boolean;
}

export const triggerPrint = (
  documentTitle?: string,
  containerId?: string,
  options?: PrintOptions
) => {
  const originalTitle = document.title;
  const title = documentTitle || originalTitle || "Vasthusilpy_Report";
  if (documentTitle) {
    document.title = documentTitle;
  }

  const isInvoiceDoc = options?.isInvoice || containerId === "printable-invoice-document";
  const paperMargin = options?.pageMargin || (isInvoiceDoc ? "15mm" : containerId === "agreement-printable-root" ? "0mm" : "15mm");
  const paperSize = options?.paperSize || "A4 portrait";

  // 1. Attempt opening a clean top-level popup print window (bypasses iframe sandboxing)
  try {
    const printWin = window.open("", "_blank", "width=1000,height=950,scrollbars=yes,resizable=yes");
    if (printWin) {
      let contentHtml = "";
      if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
          // Clone container and strip any watermark guide overlays or print-hidden elements
          const cloned = container.cloneNode(true) as HTMLElement;
          const toRemove = cloned.querySelectorAll(
            ".estamp-watermark, [data-html2canvas-ignore='true'], [data-print-hide='true'], .print\\:hidden, .no-print"
          );
          toRemove.forEach((el) => el.remove());
          contentHtml = cloned.innerHTML;
        }
      }
      if (!contentHtml) {
        contentHtml = document.body.innerHTML;
      }

      const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
        .map((el) => el.outerHTML)
        .join("\n");

      printWin.document.open();
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            ${styles}
            <style>
              /* Print-specific style overrides for A4 Paper with default margins */
              @page {
                size: ${paperSize};
                margin: ${paperMargin};
              }
              body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: Arial, Helvetica, sans-serif !important;
                margin: 0 !important;
                padding: 0 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              /* Force B&W for everything */
              * {
                background-color: #ffffff !important;
                color: #000000 !important;
                border-color: #000000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              #printable-invoice-document {
                width: 100% !important;
                max-width: 180mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              /* Strict A4 Agreement Pages */
              .a4-printable-page {
                width: 210mm !important;
                min-height: 297mm !important;
                max-height: 297mm !important;
                height: 297mm !important;
                margin: 0 auto !important;
                padding-left: 20mm !important;
                padding-right: 15mm !important;
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-sizing: border-box !important;
                background: #ffffff !important;
                overflow: hidden !important;
                position: relative !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
              }
              .a4-page-estamp-1 {
                padding-top: 160mm !important;
                padding-bottom: 50mm !important;
                padding-left: 20mm !important;
                padding-right: 15mm !important;
              }
              .a4-regular-page {
                padding-top: 16mm !important;
                padding-bottom: 16mm !important;
                padding-left: 18mm !important;
                padding-right: 18mm !important;
              }
              /* Strip heavy background colors, gradients, and shadows for clean printing */
              #print-content, #print-content * {
                box-shadow: none !important;
                text-shadow: none !important;
              }
              .estamp-watermark, [data-html2canvas-ignore="true"], [data-print-hide="true"], .print\\:hidden, .no-print {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
              }
              .hidden.print\\:block, .print\\:block {
                display: block !important;
              }
              .hidden.print\\:table, .print\\:table {
                display: table !important;
              }
              .hidden.print\\:flex, .print\\:flex {
                display: flex !important;
              }
              .hidden.print\\:grid, .print\\:grid {
                display: grid !important;
              }
              .particulars-print-text {
                white-space: pre-wrap !important;
                word-break: break-word !important;
                font-size: 8.5pt !important;
                line-height: 1.25 !important;
                color: #000000 !important;
                display: block !important;
              }
              .estimate-table-print, .valuation-table-print {
                width: 100% !important;
                border-collapse: collapse !important;
                table-layout: fixed !important;
                margin-top: 4px !important;
                margin-bottom: 6px !important;
                background-color: #ffffff !important;
              }
              .estimate-table-print th, .estimate-table-print td, .valuation-table-print th, .valuation-table-print td {
                border: 1px solid #000000 !important;
                padding: 4px 6px !important;
                font-size: 8.5pt !important;
                color: #000000 !important;
                vertical-align: top !important;
                background-color: #ffffff !important;
              }
              .estimate-table-print th, .valuation-table-print th {
                background-color: #ffffff !important;
                color: #000000 !important;
                font-weight: bold !important;
                text-transform: uppercase !important;
              }
              .col-slno { width: 5%; text-align: center; }
              .col-particulars { width: 34%; text-align: left; }
              .col-nos { width: 5%; text-align: center; }
              .col-l { width: 7%; text-align: right; }
              .col-b { width: 7%; text-align: right; }
              .col-d { width: 7%; text-align: right; }
              .col-qty { width: 9%; text-align: right; font-weight: bold; }
              .col-unit { width: 6%; text-align: center; }
              .col-rate { width: 9%; text-align: right; }
              .col-amount { width: 11%; text-align: right; font-weight: bold; }
              .no-break-inside { page-break-inside: avoid !important; }

              /* Inputs & Borders styling in print */
              input, select, textarea {
                border: none !important;
                background: transparent !important;
                color: #000000 !important;
                font-weight: bold !important;
              }

              @media print {
                .top-action-banner { display: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="top-action-banner no-print" style="position: sticky; top: 0; z-index: 9999; background: #0f172a; color: white; padding: 12px 20px; margin-bottom: 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3); font-family: system-ui, -apple-system, sans-serif;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🖨️</span>
                <div>
                  <strong style="font-size: 14px; display: block; color: #10b981;">Vasthusilpy A4 Print Ready Document</strong>
                  <span style="font-size: 11px; color: #94a3b8;">${title}</span>
                </div>
              </div>
              <div style="display: flex; gap: 10px;">
                <button onclick="window.print()" style="background: #10b981; color: #0f172a; font-weight: 800; padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: monospace;">
                  PRINT / SAVE AS PDF
                </button>
                <button onclick="window.close()" style="background: #334155; color: white; padding: 8px 14px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-family: monospace;">
                  CLOSE
                </button>
              </div>
            </div>

            <div id="print-content">
              ${contentHtml}
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 400);
              };
            </script>
          </body>
        </html>
      `);
      printWin.document.close();

      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
      return;
    }
  } catch (popupErr) {
    console.warn("Popup print window failed, trying direct window.print:", popupErr);
  }

  // 2. Direct fallback for non-popup environments
  window.focus();
  setTimeout(() => {
    try {
      window.print();
    } catch (err) {
      console.error("Direct print failed:", err);
      alert("To print this document, please press Ctrl+P or Cmd+P on your keyboard.");
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }
  }, 200);
};

