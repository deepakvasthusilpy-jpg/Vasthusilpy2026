import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import "regenerator-runtime/runtime";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import nodemailer from "nodemailer";
import { db, createPool } from "../db/index.ts";
import { applicationTemplates, applicationEntries } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { ApplicationFormTemplate, FormEntryRecord, FormFieldDefinition } from "../types.ts";

// Fallback JSON persistence path
const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "application_storage.json");

interface LocalStorageData {
  templates: ApplicationFormTemplate[];
  entries: FormEntryRecord[];
}

// Initial default templates in case database is empty
const DEFAULT_TEMPLATES: ApplicationFormTemplate[] = [
  {
    id: "tmpl_building_permit",
    name: "Building Permit Application (KPBR / KMBR Form 1)",
    nameMl: "കെട്ടിട നിർമ്മാണ അപേക്ഷ - അപ്പൻഡിക്സ് A1 (ഫോം 1)",
    code: "KPBR-A1",
    category: "Building Permit",
    description: "തദ്ദേശ സ്വയംഭരണ സ്ഥാപനങ്ങളിൽ കെട്ടിട നിർമ്മാണ പെർമിറ്റിനായുള്ള ഔദ്യോഗിക അപേക്ഷാ ഫോറം.",
    pdfUrl: "",
    pdfFileUrl: "",
    pdfFileName: "KPBR_Permit_Application_Form1.pdf",
    pdfPageCount: 1,
    fieldSchema: {
      version: 1,
      fields: []
    },
    fields: [
      {
        id: "fld_1",
        label: "Applicant Name",
        labelMl: "അപേക്ഷകന്റെ പേര്",
        labelEn: "Applicant Full Name",
        key: "applicant_name",
        type: "text",
        placeholder: "ശ്രീ / ശ്രീമതി...",
        required: true,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 20,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_2",
        label: "Contact Mobile",
        labelMl: "മൊബൈൽ നമ്പർ",
        labelEn: "Mobile Phone",
        key: "phone",
        type: "number",
        placeholder: "10 അക്ക മൊബൈൽ നമ്പർ",
        required: true,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 20,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_3",
        label: "Local Body / LSGD",
        labelMl: "ഗ്രാമപഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി",
        labelEn: "Panchayat / Municipality",
        key: "local_body",
        type: "text",
        placeholder: "ഉദാ: കേരളശ്ശേരി ഗ്രാമപഞ്ചായത്ത്",
        required: true,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 30,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_4",
        label: "Ward & Door No",
        labelMl: "വാർഡ് / വാതിൽ നമ്പർ",
        labelEn: "Ward & Door No",
        key: "ward_door_no",
        type: "text",
        placeholder: "വാർഡ് നമ്പർ, വാതിൽ നമ്പർ",
        required: false,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 30,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_5",
        label: "Survey & Sub-division No",
        labelMl: "സർവേ & സബ് ഡിവിഷൻ നമ്പർ",
        labelEn: "Survey / Sub-Division Number",
        key: "survey_no",
        type: "text",
        placeholder: "സർവേ നമ്പർ...",
        required: true,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 40,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_6",
        label: "Total Built-up Area (Sq.m)",
        labelMl: "ആകെ വിസ്തീർണ്ണം (ചതുരശ്ര മീറ്റർ)",
        labelEn: "Total Built-up Area in Sq.M",
        key: "builtup_area",
        type: "number",
        placeholder: "ഉദാ: 145.50",
        required: false,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 40,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_7",
        label: "Occupancy Type",
        labelMl: "കെട്ടിട വിഭാഗം (Occupancy)",
        labelEn: "Occupancy Type (Residential/Commercial)",
        key: "occupancy",
        type: "select",
        options: ["Residential (പാർപ്പിടം - ഗ്രൂപ്പ് A1)", "Commercial (വാണിജ്യം - ഗ്രൂപ്പ് F)", "Industrial (വ്യവസായം - ഗ്രൂപ്പ് G)", "Educational (വിദ്യാഭ്യാസം - ഗ്രൂപ്പ് B)"],
        defaultValue: "Residential (പാർപ്പിടം - ഗ്രൂപ്പ് A1)",
        required: true,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 50,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_8",
        label: "Application Date",
        labelMl: "അപേക്ഷാ തീയതി",
        labelEn: "Date of Submission",
        key: "submission_date",
        type: "date",
        required: true,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 50,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "fld_9",
        label: "Applicant Signature & Place",
        labelMl: "അപേക്ഷകന്റെ ഒപ്പും സ്ഥലവും",
        labelEn: "Applicant Signature & Declaration",
        key: "declaration_sign",
        type: "signature",
        required: true,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 75,
        widthPercent: 35,
        fontSizePt: 10,
        alignment: "center"
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: "tmpl_vasthu_consultation",
    name: "Vasthu Consultation & Site Audit Form",
    nameMl: "വാസ്തു കൺസൾട്ടേഷൻ & പ്ലോട്ട് പരിശോധനാ ഫോം",
    code: "VASTHU-02",
    category: "Vasthu Consultation",
    description: "ഗൃഹനിർമ്മാണത്തിന് മുന്നോടിയായുള്ള ഭൂമി പരിശോധനയ്ക്കും വാസ്തു കൺസൾട്ടേഷനുമുള്ള അപേക്ഷാ ഫോറം.",
    pdfUrl: "",
    pdfFileUrl: "",
    pdfFileName: "Vasthu_Consultation_Form.pdf",
    pdfPageCount: 1,
    fieldSchema: {
      version: 1,
      fields: []
    },
    fields: [
      {
        id: "vfld_1",
        label: "Client / Family Head Name",
        labelMl: "ഗൃഹനാഥന്റെ പേര്",
        labelEn: "Client Full Name",
        key: "applicant_name",
        type: "text",
        placeholder: "പേര് നൽകുക...",
        required: true,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 20,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "vfld_2",
        label: "Birth Star / Janma Nakshatram",
        labelMl: "ജന്മ നക്ഷത്രം",
        labelEn: "Birth Star / Janma Nakshatra",
        key: "janma_nakshatram",
        type: "text",
        placeholder: "ഉദാ: രോഹിണി, അശ്വതി...",
        required: false,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 20,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "vfld_3",
        label: "Plot Facing Direction",
        labelMl: "പ്ലോട്ടിന്റെ ദർശനം (Facing)",
        labelEn: "Plot Facing Direction",
        key: "facing_direction",
        type: "select",
        options: ["കിഴക്ക് (East)", "പടിഞ്ഞാറ് (West)", "വടക്ക് (North)", "തെക്ക് (South)", "വടക്കുകിഴക്ക് - ഈശാനകോൺ (North-East)", "തെക്കുകിഴക്ക് - അഗ്നികോൺ (South-East)"],
        defaultValue: "കിഴക്ക് (East)",
        required: true,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 30,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "vfld_4",
        label: "Road Access & Width",
        labelMl: "വഴി സൗകര്യവും വീതിയും",
        labelEn: "Road Width (in Meters / Feet)",
        key: "road_width",
        type: "text",
        placeholder: "ഉദാ: 3 മീറ്റർ പഞ്ചായത്ത് റോഡ്",
        required: false,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 30,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "vfld_5",
        label: "Proposed Perimeter / Kolviral",
        labelMl: "നിർദ്ദിഷ്ട ചുറ്റ് / കോൽവിരൽ കണക്ക്",
        labelEn: "Proposed Perimeter (Hastham / Kol)",
        key: "proposed_perimeter",
        type: "text",
        placeholder: "ഉദാ: 47 കോൽ 16 വിരൽ (ധനയോനി)",
        required: false,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 40,
        widthPercent: 40,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "vfld_6",
        label: "Well / Water Source Location",
        labelMl: "കിണർ / ജലസ്രോതസ്സിന്റെ സ്ഥാനം",
        labelEn: "Well Location",
        key: "water_source",
        type: "text",
        placeholder: "ഉദാ: ഈശാന കോൺ (North-East)",
        required: false,
        pageNumber: 1,
        xPercent: 55,
        yPercent: 40,
        widthPercent: 35,
        fontSizePt: 11,
        alignment: "left"
      },
      {
        id: "vfld_7",
        label: "Special Requirements / Notes",
        labelMl: "പ്രത്യേക നിർദ്ദേശങ്ങൾ / ആവശ്യങ്ങൾ",
        labelEn: "Special Notes",
        key: "notes",
        type: "textarea",
        placeholder: "വാസ്തു സംബന്ധമായ പ്രത്യേക ആവശ്യങ്ങൾ രേഖപ്പെടുത്തുക...",
        required: false,
        pageNumber: 1,
        xPercent: 12,
        yPercent: 52,
        widthPercent: 78,
        fontSizePt: 11,
        alignment: "left"
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true
  }
];

function loadLocalData(): LocalStorageData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        templates: Array.isArray(parsed.templates) && parsed.templates.length > 0 ? parsed.templates : DEFAULT_TEMPLATES,
        entries: Array.isArray(parsed.entries) ? parsed.entries : []
      };
    }
  } catch (err) {
    console.error("[ApplicationForms] Failed to load local storage data:", err);
  }
  return { templates: DEFAULT_TEMPLATES, entries: [] };
}

function saveLocalData(data: LocalStorageData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[ApplicationForms] Failed to save local storage data:", err);
  }
}

// Helper to send email with nodemailer using existing configuration
async function sendApplicationFormEmail({
  recipientEmail,
  recipientName,
  templateName,
  applicantName,
  pdfBase64,
  customNotes
}: {
  recipientEmail: string;
  recipientName?: string;
  templateName: string;
  applicantName: string;
  pdfBase64?: string;
  customNotes?: string;
}): Promise<{ success: boolean; senderEmail?: string; error?: string }> {
  let rawHost = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  rawHost = rawHost.replace(/^[a-zA-Z]*:?\/\//, "").replace(/\/.*$/, "").trim();
  if (!rawHost || rawHost === "gmail.com") {
    rawHost = "smtp.gmail.com";
  }

  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "bsfmxhvjzuippjjr").trim().replace(/\s+/g, "");
  const primaryUser = (process.env.SMTP_USER || process.env.GMAIL_USER || "deepak.vasthusilpy@gmail.com").trim();

  const candidateUsers = Array.from(new Set([
    primaryUser,
    "dibindeepak1@gmail.com",
    "deepak.vasthusilpy@gmail.com"
  ])).filter(Boolean);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'DM Sans', -apple-system, sans-serif; background-color: #0f0f11; color: #f4f4f5; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background-color: #18181c; border: 1px solid #2e2e38; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #1c1813 0%, #0f0f11 100%); border-bottom: 2px solid #C9A66B; padding: 32px 24px; text-align: center; }
        .badge { display: inline-block; padding: 6px 14px; background-color: rgba(201, 166, 107, 0.15); border: 1px solid #C9A66B; border-radius: 9999px; color: #C9A66B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
        .title { margin: 12px 0 4px; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; color: #ffffff; letter-spacing: 0.5px; }
        .subtitle { margin: 0; font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 28px 24px; font-size: 14px; line-height: 1.6; color: #d4d4d8; }
        .details-box { background-color: #121214; border: 1px solid #27272a; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .details-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1f1f23; font-size: 13px; }
        .details-row:last-child { border-bottom: none; }
        .details-label { color: #a1a1aa; font-weight: 500; }
        .details-val { color: #f4f4f5; font-weight: 600; }
        .footer { padding: 20px 24px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Official Application Form</span>
          <h1 class="title">${templateName}</h1>
          <p class="subtitle">വാസ്തുശില്പി ആർക്കിടെക്ചറൽ & സിവിൽ എൻജിനീയറിങ് പോർട്ടൽ</p>
        </div>
        <div class="content">
          <p>പ്രിയപ്പെട്ട ${recipientName || applicantName || "ഉപഭോക്താവേ"},</p>
          <p>വാസ്തുശില്പി പോർട്ടൽ വഴി സമർപ്പിച്ച പൂരിപ്പിച്ച ഔദ്യോഗിക അപേക്ഷാ ഫോം താഴെ അറ്റാച്ച് ചെയ്തിരിക്കുന്നു. (Please find attached the official application form copy).</p>
          
          <div class="details-box">
            <div class="details-row">
              <span class="details-label">അപേക്ഷാ ഫോം (Form):</span>
              <span class="details-val">${templateName}</span>
            </div>
            <div class="details-row">
              <span class="details-label">അപേക്ഷകൻ (Applicant):</span>
              <span class="details-val">${applicantName}</span>
            </div>
            <div class="details-row">
              <span class="details-label">തീയതി (Date):</span>
              <span class="details-val">${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</span>
            </div>
          </div>

          ${customNotes ? `<div style="background-color: #1f1c16; border-left: 3px solid #C9A66B; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 13px; color: #e4d8b8;"><strong>പ്രത്യേക കുറിപ്പ് (Notes):</strong><br/>${customNotes}</div>` : ""}

          <p style="font-size: 12px; color: #a1a1aa;">A4 ഷീറ്റിൽ കൃത്യമായ അലൈൻമെന്റോടുകൂടി പ്രിന്റ് എടുക്കാവുന്ന ഹൈ-ക്വാളിറ്റി PDF രൂപത്തിലാണ് ഈ രേഖ നൽകിയിരിക്കുന്നത്.</p>
        </div>
        <div class="footer">
          <p style="margin: 0 0 4px 0;">Vasthusilpy Architectural & Engineering Consultants</p>
          <p style="margin: 0;">Keralassery, Palakkad, Kerala • Ph: +91 9747995961, +91 7012383137</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let lastError: any = null;

  for (const senderUser of candidateUsers) {
    const configsToTry = [
      {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: senderUser, pass }
      },
      {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: senderUser, pass }
      },
      {
        service: "gmail",
        auth: { user: senderUser, pass }
      }
    ];

    for (const config of configsToTry) {
      try {
        const transporter = nodemailer.createTransport(config);
        const attachments: any[] = [];
        if (pdfBase64 && typeof pdfBase64 === "string" && pdfBase64.length > 50) {
          const cleanBase64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
          const fileName = `${templateName.replace(/[^a-zA-Z0-9\u0D00-\u0D7F]/g, "_")}_${applicantName.replace(/[^a-zA-Z0-9\u0D00-\u0D7F]/g, "_")}.pdf`;
          attachments.push({
            filename: fileName,
            content: Buffer.from(cleanBase64, "base64"),
            contentType: "application/pdf"
          });
        }

        await transporter.sendMail({
          from: `"Vasthusilpy Engineering" <${senderUser}>`,
          to: recipientEmail,
          subject: `📄 ${templateName} - ${applicantName} | Vasthusilpy Application Copy`,
          text: `Dear ${recipientName || applicantName},\n\nPlease find attached the official application document for ${templateName} submitted for ${applicantName}.\n\nVasthusilpy Architectural & Engineering Consultants\nPhone: +91 9747995961, +91 7012383137\nEmail: ${senderUser}`,
          html: htmlContent,
          attachments
        });

        console.log(`[Application Form Email Dispatched] Sent to ${recipientEmail} via ${senderUser}`);
        return { success: true, senderEmail: senderUser };
      } catch (err: any) {
        lastError = err;
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || "Failed to dispatch email via Gmail/SMTP."
  };
}

export function registerApplicationFormsRoutes(app: Express) {
  // Ensure table definitions are ready in PostgreSQL if connection succeeds
  (async () => {
    try {
      if (!process.env.SQL_HOST) {
        console.log("[ApplicationForms] Local unified storage active.");
        return;
      }
      try {
        const pool = createPool();
        await pool.query(`
          CREATE TABLE IF NOT EXISTS application_templates (
            id text PRIMARY KEY,
            name text NOT NULL,
            pdf_file_url text,
            field_schema text NOT NULL,
            created_at timestamp DEFAULT now(),
            updated_at timestamp DEFAULT now()
          );
          CREATE TABLE IF NOT EXISTS application_entries (
            id text PRIMARY KEY,
            template_id text NOT NULL,
            field_values text NOT NULL,
            status text DEFAULT 'Draft',
            created_at timestamp DEFAULT now(),
            updated_at timestamp DEFAULT now(),
            last_emailed_to text,
            last_emailed_at timestamp
          );
        `);
      } catch (poolErr) {
        // Table creation attempt silently caught if permissions or connection is restricted
      }

      // Check if db is accessible
      const existingTemplates = await db.select().from(applicationTemplates).limit(1);
      if (existingTemplates.length === 0) {
        // Seed default templates if database table is completely empty
        for (const tmpl of DEFAULT_TEMPLATES) {
          await db.insert(applicationTemplates).values({
            id: tmpl.id,
            name: tmpl.name,
            pdfFileUrl: tmpl.pdfFileUrl || tmpl.pdfUrl || "",
            fieldSchema: JSON.stringify(tmpl.fieldSchema || { version: 1, fields: tmpl.fields }),
            createdAt: new Date(tmpl.createdAt),
            updatedAt: new Date(tmpl.updatedAt)
          });
        }
        console.log("[ApplicationForms] Seeded default application templates into PostgreSQL.");
      }
      console.log("[ApplicationForms] Cloud SQL check completed successfully.");
    } catch (e: any) {
      // If table doesn't exist yet or connection fails, local JSON fallback handles everything seamlessly
      console.log("[ApplicationForms] Unified storage initialized (local storage fallback ready).");
    }
  })();

  // 1. GET /api/application-templates - List all templates
  app.get("/api/application-templates", async (req: Request, res: Response) => {
    try {
      const local = loadLocalData();

      // Try reading from Cloud SQL
      try {
        const dbRecords = await db.select().from(applicationTemplates).orderBy(desc(applicationTemplates.createdAt));
        if (dbRecords && dbRecords.length > 0) {
          const mapped: ApplicationFormTemplate[] = dbRecords.map((r) => {
            let schema: any = {};
            try {
              schema = JSON.parse(r.fieldSchema);
            } catch {
              schema = { version: 1, fields: [] };
            }
            const fields: FormFieldDefinition[] = schema.fields || [];
            return {
              id: r.id,
              name: r.name,
              pdfFileUrl: r.pdfFileUrl || undefined,
              pdfUrl: r.pdfFileUrl || undefined,
              fieldSchema: schema,
              fields: fields,
              category: "Building & Engineering Forms",
              createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
              updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString()
            };
          });

          // Merge with any local templates not yet in DB
          const dbIds = new Set(mapped.map((m) => m.id));
          local.templates.forEach((lt) => {
            if (!dbIds.has(lt.id)) {
              mapped.push(lt);
            }
          });
          return res.json(mapped);
        }
      } catch (sqlErr) {
        // Fallback to local storage
      }

      return res.json(local.templates);
    } catch (error: any) {
      console.error("Error fetching application templates:", error);
      return res.status(500).json({ error: error.message || "Failed to fetch application templates." });
    }
  });

  // 2. GET /api/application-templates/:id - Get single template
  app.get("/api/application-templates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const local = loadLocalData();
      const localFound = local.templates.find((t) => t.id === id);

      try {
        const dbFound = await db.select().from(applicationTemplates).where(eq(applicationTemplates.id, id)).limit(1);
        if (dbFound && dbFound.length > 0) {
          const r = dbFound[0];
          let schema: any = {};
          try {
            schema = JSON.parse(r.fieldSchema);
          } catch {
            schema = { version: 1, fields: [] };
          }
          return res.json({
            id: r.id,
            name: r.name,
            pdfFileUrl: r.pdfFileUrl || undefined,
            pdfUrl: r.pdfFileUrl || undefined,
            fieldSchema: schema,
            fields: schema.fields || [],
            category: localFound?.category || "Building & Engineering Forms",
            createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString()
          });
        }
      } catch (sqlErr) {
        // Continue to local fallback
      }

      if (localFound) {
        return res.json(localFound);
      }
      return res.status(404).json({ error: "Application template not found." });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to get template." });
    }
  });

  // 3. POST /api/application-templates - Create template
  app.post("/api/application-templates", async (req: Request, res: Response) => {
    try {
      const { id, name, nameMl, code, category, description, pdfFileUrl, pdfUrl, pdfFileName, pdfPageCount, fields, fieldSchema } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Template name is required." });
      }

      const templateId = id || `tmpl_${Date.now()}`;
      const activeFields: FormFieldDefinition[] = Array.isArray(fields) ? fields : (fieldSchema?.fields || []);
      const activeSchema = fieldSchema || { version: 1, fields: activeFields };
      const sourcePdf = pdfFileUrl || pdfUrl || "";

      const newTemplate: ApplicationFormTemplate = {
        id: templateId,
        name: name.trim(),
        nameMl: nameMl || name.trim(),
        code: code || "FORM",
        category: category || "Application Form",
        description: description || "",
        pdfFileUrl: sourcePdf,
        pdfUrl: sourcePdf,
        pdfFileName: pdfFileName || "document.pdf",
        pdfPageCount: pdfPageCount || 1,
        fieldSchema: activeSchema,
        fields: activeFields,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to local JSON store
      const local = loadLocalData();
      const existingIdx = local.templates.findIndex((t) => t.id === templateId);
      if (existingIdx >= 0) {
        local.templates[existingIdx] = newTemplate;
      } else {
        local.templates.unshift(newTemplate);
      }
      saveLocalData(local);

      // Save to Cloud SQL if available
      try {
        await db.insert(applicationTemplates).values({
          id: templateId,
          name: newTemplate.name,
          pdfFileUrl: sourcePdf,
          fieldSchema: JSON.stringify(activeSchema),
          createdAt: new Date(newTemplate.createdAt),
          updatedAt: new Date(newTemplate.updatedAt)
        });
      } catch (sqlErr) {
        console.error("Cloud SQL insert error (will continue with local storage):", sqlErr);
      }

      return res.status(201).json(newTemplate);
    } catch (error: any) {
      console.error("Error creating template:", error);
      return res.status(500).json({ error: error.message || "Failed to create application template." });
    }
  });

  // 4. PUT /api/application-templates/:id - Update template
  app.put("/api/application-templates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, nameMl, code, category, description, pdfFileUrl, pdfUrl, pdfFileName, pdfPageCount, fields, fieldSchema } = req.body;

      const local = loadLocalData();
      const idx = local.templates.findIndex((t) => t.id === id);

      const activeFields: FormFieldDefinition[] = Array.isArray(fields) ? fields : (fieldSchema?.fields || (idx >= 0 ? local.templates[idx].fields : []));
      const currentVersion = (local.templates[idx]?.fieldSchema?.version || 1) + 1;
      const activeSchema = fieldSchema || { version: currentVersion, fields: activeFields };
      const sourcePdf = pdfFileUrl !== undefined ? pdfFileUrl : (pdfUrl !== undefined ? pdfUrl : local.templates[idx]?.pdfFileUrl);

      const updatedTemplate: ApplicationFormTemplate = {
        ...(local.templates[idx] || {}),
        id,
        name: name ? name.trim() : (local.templates[idx]?.name || "Application Form"),
        nameMl: nameMl || local.templates[idx]?.nameMl,
        code: code || local.templates[idx]?.code || "FORM",
        category: category || local.templates[idx]?.category || "Application Form",
        description: description !== undefined ? description : local.templates[idx]?.description,
        pdfFileUrl: sourcePdf,
        pdfUrl: sourcePdf,
        pdfFileName: pdfFileName || local.templates[idx]?.pdfFileName,
        pdfPageCount: pdfPageCount || local.templates[idx]?.pdfPageCount || 1,
        fieldSchema: activeSchema,
        fields: activeFields,
        createdAt: local.templates[idx]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (idx >= 0) {
        local.templates[idx] = updatedTemplate;
      } else {
        local.templates.unshift(updatedTemplate);
      }
      saveLocalData(local);

      // Update in Cloud SQL if available
      try {
        await db.insert(applicationTemplates).values({
          id,
          name: updatedTemplate.name,
          pdfFileUrl: sourcePdf || "",
          fieldSchema: JSON.stringify(activeSchema),
          createdAt: new Date(updatedTemplate.createdAt),
          updatedAt: new Date(updatedTemplate.updatedAt)
        }).onConflictDoUpdate({
          target: applicationTemplates.id,
          set: {
            name: updatedTemplate.name,
            pdfFileUrl: sourcePdf || "",
            fieldSchema: JSON.stringify(activeSchema),
            updatedAt: new Date(updatedTemplate.updatedAt)
          }
        });
      } catch (sqlErr) {
        console.error("Cloud SQL update error (local updated):", sqlErr);
      }

      return res.json(updatedTemplate);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to update template." });
    }
  });

  // 5. DELETE /api/application-templates/:id - Delete template
  app.delete("/api/application-templates/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const local = loadLocalData();
      local.templates = local.templates.filter((t) => t.id !== id);
      local.entries = local.entries.filter((e) => e.formId !== id && e.templateId !== id);
      saveLocalData(local);

      try {
        await db.delete(applicationEntries).where(eq(applicationEntries.templateId, id));
        await db.delete(applicationTemplates).where(eq(applicationTemplates.id, id));
      } catch (sqlErr) {
        // local deleted
      }

      return res.json({ success: true, message: "Template and submissions deleted successfully." });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to delete template." });
    }
  });

  // 6. GET /api/application-entries - List submissions (optionally filtered by templateId)
  app.get("/api/application-entries", async (req: Request, res: Response) => {
    try {
      const { templateId } = req.query;
      const local = loadLocalData();

      try {
        let query = db.select().from(applicationEntries).orderBy(desc(applicationEntries.createdAt));
        const records = await query;
        if (records && records.length > 0) {
          const mapped: FormEntryRecord[] = records.map((r) => {
            let values: any = {};
            try {
              values = JSON.parse(r.fieldValues);
            } catch {
              values = {};
            }
            const matchingTemplate = local.templates.find((t) => t.id === r.templateId);
            return {
              id: r.id,
              templateId: r.templateId,
              formId: r.templateId,
              formName: matchingTemplate?.name || "Application Form",
              templateName: matchingTemplate?.name || "Application Form",
              applicantName: values["applicant_name"] || values["owner_name"] || "Applicant",
              phone: values["phone"] || "",
              email: values["email"] || "",
              villageOrPanchayat: values["village"] || values["local_body"] || "",
              surveyNo: values["survey_no"] || "",
              status: (r.status as any) || "Draft",
              submittedAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
              createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
              updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
              fieldValues: values,
              values: values,
              lastEmailedTo: r.lastEmailedTo || undefined,
              lastEmailedAt: r.lastEmailedAt ? r.lastEmailedAt.toISOString() : undefined,
              mailedTo: r.lastEmailedTo ? [r.lastEmailedTo] : []
            };
          });

          const filtered = templateId
            ? mapped.filter((m) => m.templateId === templateId || m.formId === templateId)
            : mapped;
          return res.json(filtered);
        }
      } catch (sqlErr) {
        // local storage fallback
      }

      const filtered = templateId
        ? local.entries.filter((e) => e.formId === templateId || e.templateId === templateId)
        : local.entries;
      return res.json(filtered);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch entries." });
    }
  });

  // 7. POST /api/application-entries - Create entry
  app.post("/api/application-entries", async (req: Request, res: Response) => {
    try {
      const {
        id,
        templateId,
        formId,
        formName,
        applicantName,
        phone,
        email,
        villageOrPanchayat,
        surveyNo,
        status,
        values,
        fieldValues,
        notes
      } = req.body;

      const effectiveTemplateId = templateId || formId;
      if (!effectiveTemplateId) {
        return res.status(400).json({ error: "templateId is required." });
      }

      const entryId = id || `ENTRY-${Date.now().toString().slice(-6)}`;
      const activeValues = values || fieldValues || {};
      const activeStatus = status || "Draft";

      const local = loadLocalData();
      const tmpl = local.templates.find((t) => t.id === effectiveTemplateId);

      const newEntry: FormEntryRecord = {
        id: entryId,
        templateId: effectiveTemplateId,
        formId: effectiveTemplateId,
        formName: formName || tmpl?.name || "Application Form",
        templateName: formName || tmpl?.name || "Application Form",
        applicantName: applicantName || activeValues["applicant_name"] || activeValues["owner_name"] || "Applicant",
        phone: phone || activeValues["phone"] || "",
        email: email || activeValues["email"] || "",
        villageOrPanchayat: villageOrPanchayat || activeValues["village"] || activeValues["local_body"] || "",
        surveyNo: surveyNo || activeValues["survey_no"] || "",
        status: activeStatus,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fieldValues: activeValues,
        values: activeValues,
        notes: notes || ""
      };

      const existingIdx = local.entries.findIndex((e) => e.id === entryId);
      if (existingIdx >= 0) {
        local.entries[existingIdx] = newEntry;
      } else {
        local.entries.unshift(newEntry);
      }
      saveLocalData(local);

      // Sync to Cloud SQL
      try {
        await db.insert(applicationEntries).values({
          id: entryId,
          templateId: effectiveTemplateId,
          fieldValues: JSON.stringify(activeValues),
          status: activeStatus,
          createdAt: new Date(newEntry.submittedAt),
          updatedAt: new Date(newEntry.updatedAt)
        });
      } catch (sqlErr) {
        console.error("Cloud SQL entry insert error (local saved):", sqlErr);
      }

      return res.status(201).json(newEntry);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to save entry." });
    }
  });

  // 8. PUT /api/application-entries/:id - Update entry
  app.put("/api/application-entries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        applicantName,
        phone,
        email,
        status,
        values,
        fieldValues,
        notes,
        lastEmailedTo,
        lastEmailedAt
      } = req.body;

      const local = loadLocalData();
      const idx = local.entries.findIndex((e) => e.id === id);
      const existing = idx >= 0 ? local.entries[idx] : null;

      const activeValues = values || fieldValues || existing?.values || {};
      const updatedEntry: FormEntryRecord = {
        ...(existing || {
          id,
          formId: "tmpl_default",
          formName: "Application Form",
          submittedAt: new Date().toISOString()
        }),
        applicantName: applicantName || activeValues["applicant_name"] || existing?.applicantName || "Applicant",
        phone: phone || activeValues["phone"] || existing?.phone || "",
        email: email || activeValues["email"] || existing?.email || "",
        status: status || existing?.status || "Completed",
        updatedAt: new Date().toISOString(),
        fieldValues: activeValues,
        values: activeValues,
        notes: notes !== undefined ? notes : existing?.notes,
        lastEmailedTo: lastEmailedTo || existing?.lastEmailedTo,
        lastEmailedAt: lastEmailedAt || existing?.lastEmailedAt,
        mailedTo: lastEmailedTo ? Array.from(new Set([...(existing?.mailedTo || []), lastEmailedTo])) : existing?.mailedTo
      };

      if (idx >= 0) {
        local.entries[idx] = updatedEntry;
      } else {
        local.entries.unshift(updatedEntry);
      }
      saveLocalData(local);

      // Cloud SQL update
      try {
        await db.insert(applicationEntries).values({
          id,
          templateId: updatedEntry.templateId || updatedEntry.formId,
          fieldValues: JSON.stringify(activeValues),
          status: updatedEntry.status,
          createdAt: new Date(updatedEntry.submittedAt),
          updatedAt: new Date(updatedEntry.updatedAt),
          lastEmailedTo: updatedEntry.lastEmailedTo || null,
          lastEmailedAt: updatedEntry.lastEmailedAt ? new Date(updatedEntry.lastEmailedAt) : null
        }).onConflictDoUpdate({
          target: applicationEntries.id,
          set: {
            fieldValues: JSON.stringify(activeValues),
            status: updatedEntry.status,
            updatedAt: new Date(updatedEntry.updatedAt),
            lastEmailedTo: updatedEntry.lastEmailedTo || null,
            lastEmailedAt: updatedEntry.lastEmailedAt ? new Date(updatedEntry.lastEmailedAt) : null
          }
        });
      } catch (sqlErr) {
        // local updated
      }

      return res.json(updatedEntry);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to update entry." });
    }
  });

  // 9. DELETE /api/application-entries/:id - Delete entry
  app.delete("/api/application-entries/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const local = loadLocalData();
      local.entries = local.entries.filter((e) => e.id !== id);
      saveLocalData(local);

      try {
        await db.delete(applicationEntries).where(eq(applicationEntries.id, id));
      } catch (sqlErr) {
        // local deleted
      }

      return res.json({ success: true, message: "Entry deleted successfully." });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to delete entry." });
    }
  });

  // 10. POST /api/application-forms/generate-pdf - Overlay fields onto source PDF with Malayalam Font Embedding
  app.post("/api/application-forms/generate-pdf", async (req: Request, res: Response) => {
    try {
      const { templateId, template: rawTemplate, entry, fieldValues } = req.body;

      let template: ApplicationFormTemplate | null = rawTemplate || null;
      if (!template && templateId) {
        const local = loadLocalData();
        template = local.templates.find((t) => t.id === templateId) || null;
      }

      if (!template) {
        return res.status(400).json({ error: "Template data or templateId is required." });
      }

      const activeValues = fieldValues || entry?.values || entry?.fieldValues || {};
      const fields: FormFieldDefinition[] = template.fields || template.fieldSchema?.fields || [];

      // Create or load base PDF Document
      let pdfDoc: PDFDocument;
      const sourcePdfData = template.pdfFileUrl || template.pdfUrl;

      if (sourcePdfData && typeof sourcePdfData === "string" && sourcePdfData.startsWith("data:application/pdf;base64,")) {
        const pdfBase64 = sourcePdfData.replace(/^data:application\/pdf;base64,/, "");
        pdfDoc = await PDFDocument.load(Buffer.from(pdfBase64, "base64"), { ignoreEncryption: true });
      } else if (sourcePdfData && sourcePdfData.startsWith("http")) {
        try {
          const resp = await fetch(sourcePdfData);
          const arrayBuffer = await resp.arrayBuffer();
          pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        } catch {
          pdfDoc = await PDFDocument.create();
          pdfDoc.addPage([595.28, 841.89]); // A4
        }
      } else {
        // Create standard A4 page (210mm × 297mm = 595.28 × 841.89 pt)
        pdfDoc = await PDFDocument.create();
        pdfDoc.addPage([595.28, 841.89]);
      }

      // Register fontkit for complex script and Unicode Malayalam support
      pdfDoc.registerFontkit(fontkit);

      // Load Malayalam Unicode Font (Manjari or Noto Sans Malayalam)
      const manjariPath = path.join(process.cwd(), "public", "fonts", "Manjari-Regular.ttf");
      const notoPath = path.join(process.cwd(), "public", "fonts", "NotoSansMalayalam.ttf");

      let customFont: any = null;
      try {
        if (fs.existsSync(manjariPath)) {
          const fontBytes = fs.readFileSync(manjariPath);
          customFont = await pdfDoc.embedFont(fontBytes);
        } else if (fs.existsSync(notoPath)) {
          const fontBytes = fs.readFileSync(notoPath);
          customFont = await pdfDoc.embedFont(fontBytes);
        } else {
          customFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
        }
      } catch (fontErr) {
        console.error("Font embedding fallback to standard font:", fontErr);
        customFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
      }

      const pages = pdfDoc.getPages();

      // If document was created from scratch, draw elegant header
      if (!sourcePdfData && pages.length > 0) {
        const p1 = pages[0];
        const { width, height } = p1.getSize();
        
        // Header background accent
        p1.drawRectangle({
          x: 40,
          y: height - 100,
          width: width - 80,
          height: 60,
          color: rgb(0.97, 0.95, 0.9)
        });

        p1.drawText(template.nameMl || template.name, {
          x: 55,
          y: height - 70,
          size: 15,
          font: customFont,
          color: rgb(0.12, 0.12, 0.15)
        });

        if (template.name && template.name !== template.nameMl) {
          p1.drawText(template.name, {
            x: 55,
            y: height - 90,
            size: 10,
            font: customFont,
            color: rgb(0.35, 0.35, 0.4)
          });
        }
      }

      // Overlay all fields at their respective percentage-based coordinates
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
        // In PDF coordinates, (0,0) is bottom-left, screen is top-left
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
          // Multiline text wrap
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
          // Single line text
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

      const generatedPdfBytes = await pdfDoc.save();
      const base64Data = Buffer.from(generatedPdfBytes).toString("base64");

      return res.json({
        success: true,
        pdfBase64: `data:application/pdf;base64,${base64Data}`,
        byteLength: generatedPdfBytes.length,
        fileName: `${template.name.replace(/[^a-zA-Z0-9\u0D00-\u0D7F]/g, "_")}_Filled.pdf`
      });
    } catch (error: any) {
      console.error("Error generating filled PDF:", error);
      return res.status(500).json({ error: error.message || "Failed to generate filled PDF." });
    }
  });

  // 11. POST /api/application-forms/send-email - Dispatch application via Gmail / Google Workspace integration
  app.post("/api/application-forms/send-email", async (req: Request, res: Response) => {
    try {
      const {
        templateId,
        entryId,
        templateName,
        applicantName,
        recipientEmail,
        recipientName,
        customNotes,
        pdfBase64
      } = req.body;

      if (!recipientEmail || !recipientEmail.includes("@")) {
        return res.status(400).json({ error: "A valid recipient email address is required." });
      }

      const cleanEmail = recipientEmail.trim().toLowerCase();

      const result = await sendApplicationFormEmail({
        recipientEmail: cleanEmail,
        recipientName,
        templateName: templateName || "Application Form",
        applicantName: applicantName || "Applicant",
        pdfBase64,
        customNotes
      });

      if (!result.success) {
        return res.status(500).json({ error: result.error || "Failed to dispatch email." });
      }

      // If entryId was provided, update entry's status to 'Emailed'
      if (entryId) {
        const local = loadLocalData();
        const idx = local.entries.findIndex((e) => e.id === entryId);
        if (idx >= 0) {
          local.entries[idx].status = "Emailed";
          local.entries[idx].lastEmailedTo = cleanEmail;
          local.entries[idx].lastEmailedAt = new Date().toISOString();
          local.entries[idx].mailedTo = Array.from(new Set([...(local.entries[idx].mailedTo || []), cleanEmail]));
          saveLocalData(local);

          try {
            await db.update(applicationEntries)
              .set({
                status: "Emailed",
                lastEmailedTo: cleanEmail,
                lastEmailedAt: new Date(),
                updatedAt: new Date()
              })
              .where(eq(applicationEntries.id, entryId));
          } catch (sqlErr) {}
        }
      }

      return res.json({
        success: true,
        message: `Application form successfully emailed to ${cleanEmail} from ${result.senderEmail || "deepak.vasthusilpy@gmail.com"} with attached PDF copy.`,
        senderEmail: result.senderEmail || "deepak.vasthusilpy@gmail.com"
      });
    } catch (error: any) {
      console.error("Error sending application form email:", error);
      return res.status(500).json({ error: error.message || "Failed to send email." });
    }
  });
}
