import React, { useState } from "react";
import {
  Code,
  Copy,
  Check,
  Server,
  Mail,
  Share2,
  FileCode,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal
} from "lucide-react";
import { triggerAppNotification } from "../../context/NotificationContext";

export const InspectionIntegrationGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopyCode = (sectionKey: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(sectionKey);
    triggerAppNotification("Code copied to clipboard!", "success");
    setTimeout(() => {
      setCopiedSection((prev) => (prev === sectionKey ? null : prev));
    }, 2500);
  };

  const expressBackendCode = `// server/routes/siteInspection.ts
import express from 'express';
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import twilio from 'twilio';

const router = express.Router();

// 1. Nodemailer SMTP Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL || 'deepak.vasthusilpy@gmail.com',
    pass: process.env.SMTP_APP_PASSWORD // Generate 16-character Google App Password
  }
});

// 2. Twilio WhatsApp Client (Optional for direct API trigger)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// POST /api/inspection/submit
router.post('/submit', async (req, res) => {
  try {
    const inspection = req.body;

    // 1. Generate A4 PDF Buffer using jsPDF on server
    const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    pdfDoc.setFontSize(16);
    pdfDoc.text('VASTHUSILPY SITE INSPECTION REPORT', 14, 20);
    pdfDoc.setFontSize(10);
    pdfDoc.text(\`Ref: \${inspection.inspectionNumber}\`, 14, 28);
    pdfDoc.text(\`Client: \${inspection.ownerName} (\${inspection.mobileNumber})\`, 14, 34);
    pdfDoc.text(\`Location: \${inspection.place}\`, 14, 40);
    if (inspection.gps) {
      pdfDoc.text(\`GPS: \${inspection.gps.latitude}, \${inspection.gps.longitude}\`, 14, 46);
      pdfDoc.text(\`Maps: \${inspection.gps.mapUrl}\`, 14, 52);
    }
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    // 2. Send Automated Email with PDF Attachment to deepak.vasthusilpy@gmail.com
    await transporter.sendMail({
      from: '"Vasthusilpy Site App" <no-reply@vasthusilpy.com>',
      to: 'deepak.vasthusilpy@gmail.com',
      subject: \`🏛️ Site Inspection Report: \${inspection.ownerName} - \${inspection.place} (\${inspection.inspectionNumber})\`,
      html: \`
        <h2>Vasthusilpy Official Site Inspection Report</h2>
        <p><strong>Ref Number:</strong> \${inspection.inspectionNumber}</p>
        <p><strong>Client:</strong> \${inspection.ownerName} (\${inspection.mobileNumber})</p>
        <p><strong>Place:</strong> \${inspection.place}</p>
        <p><strong>GPS Location:</strong> <a href="\${inspection.gps?.mapUrl}">View on Google Maps</a></p>
        <p>Please find the attached official A4 inspection PDF report.</p>
      \`,
      attachments: [
        {
          filename: \`Vasthusilpy_Inspection_\${inspection.inspectionNumber}.pdf\`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    // 3. Optional: WhatsApp API Dispatch via Twilio / WhatsApp Cloud API
    if (twilioClient) {
      await twilioClient.messages.create({
        from: 'whatsapp:+14155238886', // Twilio WhatsApp Sandbox / Business Number
        to: 'whatsapp:+918848241463',   // Deepak Sir's WhatsApp
        body: \`🏛️ *VASTHUSILPY INSPECTION REPORT*\\n📌 Ref: \${inspection.inspectionNumber}\\n👤 Client: \${inspection.ownerName}\\n📍 Place: \${inspection.place}\\n🗺️ GPS: \${inspection.gps?.mapUrl}\\nStatus: SUBMITTED\`
      });
    }

    return res.status(200).json({ success: true, message: 'Inspection saved and automated triggers fired.' });
  } catch (err) {
    console.error('Inspection webhook error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;`;

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-2">
        <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Site Inspection Backend Architecture & API Guide</span>
        </h2>
        <p className="text-xs text-slate-400 font-mono">
          Complete blueprint for automated email delivery, PDF document compilation & WhatsApp Cloud API
        </p>
      </div>

      {/* Architecture Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">1. Mobile Client (Field Staff)</h3>
          <p className="text-slate-400">
            Field engineer opens the responsive mobile form, captures device GPS with ±5m accuracy, snaps camera photos/videos, fills dynamic questions, and hits submit.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">2. Automated PDF & Email</h3>
          <p className="text-slate-400">
            Generates standardized A4-formatted PDF report with Vasthusilpy header, client info, GPS coordinates, and inspection parameters, emailing directly to <strong className="text-emerald-400">deepak.vasthusilpy@gmail.com</strong>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Share2 className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">3. WhatsApp Notification</h3>
          <p className="text-slate-400">
            1-Click WhatsApp deep-link and automated background webhook dispatching formatted markdown summary to <strong className="text-emerald-400">+918848241463</strong>.
          </p>
        </div>
      </div>

      {/* Step-by-Step Instructions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl text-xs">
        <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Setup Instructions & Environment Variables
        </h3>

        <div className="space-y-3">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-emerald-400 font-bold font-mono">Step 1: Gmail SMTP Setup (App Password)</span>
            <p className="text-slate-300">
              To allow Nodemailer to send emails from your Google account to <code>deepak.vasthusilpy@gmail.com</code>:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
              <li>Go to your Google Account &gt; Security &gt; 2-Step Verification.</li>
              <li>Scroll to bottom &gt; Select "App Passwords".</li>
              <li>Name it "Vasthusilpy Site Inspection App" &gt; Generate 16-character password.</li>
              <li>Add to <code>.env</code>: <code>SMTP_APP_PASSWORD=your_16_char_password</code></li>
            </ol>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <span className="text-emerald-400 font-bold font-mono">Step 2: WhatsApp Integration Options</span>
            <p className="text-slate-300">
              The application provides dual-mode WhatsApp sharing:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 font-mono text-[11px]">
              <li><strong>Instant Client-Side Deep Link (Zero API key needed):</strong> Field staff taps <em>"Send WhatsApp"</em>, and it opens WhatsApp directly with the pre-formatted inspection message addressed to <code>+918848241463</code>.</li>
              <li><strong>Server-Side Cloud API / Twilio (Automated):</strong> Use the backend endpoint below to dispatch automated background notifications without user interaction.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Node.js / Express Route Code Snippet */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono">
              Server-Side Express Webhook (Node.js + Nodemailer + jsPDF)
            </h3>
          </div>

          <button
            onClick={() => handleCopyCode("express", expressBackendCode)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedSection === "express" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Backend Code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[11px] text-cyan-300 font-mono overflow-x-auto max-h-96 scrollbar-thin">
          {expressBackendCode}
        </pre>
      </div>
    </div>
  );
};
