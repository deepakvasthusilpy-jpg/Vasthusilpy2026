import { Express, Request, Response } from "express";
import fetch from "node-fetch";

const GOOGLE_DRIVE_FOLDER_NAME = "Vasthusilpy Cloud Backups";
const INDEX_FILE_NAME = "VASTHUSILPY_BACKUP_INDEX.json";

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
}

// Helper: Ensure a folder exists in Google Drive, create if not
async function getOrCreateDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; webViewLink: string; createdNew: boolean }> {
  let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&spaces=drive&fields=files(id,name,webViewLink,parents)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const searchData: any = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const found = searchData.files[0];
      return {
        id: found.id,
        webViewLink:
          found.webViewLink || `https://drive.google.com/drive/folders/${found.id}`,
        createdNew: false
      };
    }
  } else {
    const errData: any = await searchRes.json().catch(() => ({}));
    const errMsg = errData?.error?.message || "Failed to search Google Drive.";
    const err = new Error(errMsg);
    (err as any).status = searchRes.status;
    throw err;
  }

  // Create folder explicitly in My Drive (root) or parent folder
  const createBody: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    description: "Dedicated cloud backup repository for Vasthusilpy Engineering & Architecture ERP."
  };
  if (parentFolderId) {
    createBody.parents = [parentFolderId];
  } else {
    createBody.parents = ["root"];
  }

  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,parents",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createBody)
    }
  );

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    const errMsg = (err as any)?.error?.message || "Failed to create Google Drive folder.";
    const errorObj = new Error(errMsg);
    (errorObj as any).status = createRes.status;
    throw errorObj;
  }

  const newFolder: any = await createRes.json();
  return {
    id: newFolder.id,
    webViewLink:
      newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
    createdNew: true
  };
}

// Helper: Upload a string or JSON file to a Google Drive folder
async function uploadTextFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string,
  parentFolderId: string,
  description?: string
): Promise<DriveFileItem> {
  const boundary = `-------314159265358979323846_${Date.now()}`;
  const fileMetadata: any = {
    name: fileName,
    mimeType: mimeType || "application/json",
    description: description || "Vasthusilpy Cloud Backup File",
    parents: [parentFolderId]
  };

  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(fileMetadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n`;

  const multipartRequestBody = Buffer.concat([
    Buffer.from(metadataPart, "utf8"),
    Buffer.from(mediaHeader, "utf8"),
    Buffer.from(content, "utf8"),
    Buffer.from(closeDelimiter, "utf8")
  ]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(multipartRequestBody.length)
      },
      body: multipartRequestBody
    }
  );

  if (!uploadRes.ok) {
    const errData: any = await uploadRes.json();
    throw new Error(errData?.error?.message || `Failed to upload ${fileName} to Google Drive`);
  }

  const uploaded: any = await uploadRes.json();
  return {
    id: uploaded.id,
    name: uploaded.name,
    mimeType: uploaded.mimeType,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    webContentLink: uploaded.webContentLink,
    size: uploaded.size,
    createdTime: uploaded.createdTime
  };
}

export function registerGoogleBackupRoutes(app: Express) {
  /**
   * POST /api/google/drive/ensure-root-folder
   * Ensures the master 'Vasthusilpy Cloud Backups' folder exists directly in user's Google Drive (My Drive).
   * If not created, creates it immediately and adds a welcome readme file.
   */
  app.post("/api/google/drive/ensure-root-folder", async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(401).json({
          error: "Google Workspace access token is required. Please sign in with Google."
        });
      }

      const rootFolder = await getOrCreateDriveFolder(accessToken, GOOGLE_DRIVE_FOLDER_NAME);

      // Check if folder has any readme file, if not create an introductory one
      try {
        const checkFilesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          `'${rootFolder.id}' in parents and trashed = false`
        )}&fields=files(id,name)`;
        const checkRes = await fetch(checkFilesUrl, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (checkRes.ok) {
          const filesData: any = await checkRes.json();
          if (!filesData.files || filesData.files.length === 0) {
            const readmeText = `
================================================================================
VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS • GOOGLE DRIVE CLOUD VAULT
================================================================================
Folder: My Drive > ${GOOGLE_DRIVE_FOLDER_NAME}
Created At: ${new Date().toLocaleString("en-IN")}
Status: Verified and Ready for Cloud Backups

This folder is your dedicated cloud backup destination for all website data, including:
- Site Inspection reports, surveys, GPS coordinates and photo attachments
- CRM Projects, Architectural clients, Leads and Milestones
- Tax Invoices, Receipts, Ledgers and Billing records
- Civil Engineering Estimates, BOQs and Rate analysis
- Construction agreements and Site audit logs
- Personal office bills, salary records and online applications

Automatic and manual backup snapshots will appear here in subfolders named 'Backup_YYYY-MM-DD_HH-MM-SS'.
================================================================================
`.trim();
            await uploadTextFileToDrive(
              accessToken,
              "README_VASTHUSILPY_CLOUD_VAULT.txt",
              readmeText,
              "text/plain",
              rootFolder.id,
              "Google Drive Cloud Repository Info for Vasthusilpy ERP"
            );
          }
        }
      } catch (fErr) {
        console.warn("[GoogleDrive] Non-fatal notice creating initial readme in root folder:", fErr);
      }

      return res.json({
        success: true,
        folderId: rootFolder.id,
        folderName: GOOGLE_DRIVE_FOLDER_NAME,
        webViewLink: rootFolder.webViewLink,
        createdNew: rootFolder.createdNew,
        message: rootFolder.createdNew
          ? `Created folder "${GOOGLE_DRIVE_FOLDER_NAME}" in your Google Drive (My Drive).`
          : `Folder "${GOOGLE_DRIVE_FOLDER_NAME}" is active and verified in your Google Drive.`
      });
    } catch (error: any) {
      console.error("[GoogleBackupServer] Error in /api/google/drive/ensure-root-folder:", error);
      const isScopeErr = error.message?.toLowerCase().includes("insufficient") || error.status === 403;
      const status = error.status || (isScopeErr ? 403 : 500);
      return res.status(status).json({
        error: isScopeErr
          ? "Google Drive authorization required with Drive permissions. Please click 'Re-authorize Google Drive'."
          : error.message || "Failed to verify or create Google Drive folder.",
        insufficientScopes: isScopeErr
      });
    }
  });

  /**
   * POST /api/google/drive/backup-all
   * Performs full structured cloud backup of all website data into Google Drive
   */
  app.post("/api/google/drive/backup-all", async (req: Request, res: Response) => {
    try {
      const { accessToken, backupPackage, options } = req.body;

      if (!accessToken) {
        return res.status(401).json({
          error: "Google Workspace access token is required. Please sign in with Google."
        });
      }

      if (!backupPackage || typeof backupPackage !== "object") {
        return res.status(400).json({
          error: "Valid backup package data is required."
        });
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-");
      const timestampSlug = `${dateStr}_${timeStr}`;

      // 1. Get or Create Main Root Folder "Vasthusilpy Cloud Backups"
      const rootFolder = await getOrCreateDriveFolder(accessToken, GOOGLE_DRIVE_FOLDER_NAME);

      // 2. Create Timestamped Backup Snapshot Folder
      const snapshotFolderName = `Backup_${timestampSlug}`;
      const snapshotFolder = await getOrCreateDriveFolder(accessToken, snapshotFolderName, rootFolder.id);

      const uploadedFiles: DriveFileItem[] = [];

      // 3. Upload Master Unified JSON Backup
      const masterJsonName = `Vasthusilpy_Full_Backup_${timestampSlug}.json`;
      const masterJsonContent = JSON.stringify(backupPackage, null, 2);
      const masterFile = await uploadTextFileToDrive(
        accessToken,
        masterJsonName,
        masterJsonContent,
        "application/json",
        snapshotFolder.id,
        `Complete unified full system backup of Vasthusilpy ERP generated on ${backupPackage.metadata?.exportedAtFormatted || now.toLocaleString()}`
      );
      uploadedFiles.push(masterFile);

      // 4. Upload Categorized Sub-JSON Files for Granular Inspections & Independent Data Recovery
      const subModules = [
        {
          name: `01_Site_Inspections_${timestampSlug}.json`,
          data: backupPackage.siteInspections || backupPackage.siteInspectionData || [],
          desc: "Site Inspection records, field questions, GPS coordinates & metadata"
        },
        {
          name: `02_CRM_Projects_and_Clients_${timestampSlug}.json`,
          data: {
            projects: backupPackage.crm?.projects || backupPackage.crmProjects || [],
            customers: backupPackage.crm?.customers || backupPackage.customers || [],
            registeredTasks: backupPackage.crm?.registeredTasks || backupPackage.registeredTasks || []
          },
          desc: "CRM client portfolio, architectural projects, milestones & tasks"
        },
        {
          name: `03_Invoices_and_Receipts_${timestampSlug}.json`,
          data: backupPackage.invoicePayments?.invoices || backupPackage.invoices || [],
          desc: "Tax invoices, payment records, receipts & financial ledgers"
        },
        {
          name: `04_Estimates_and_Rates_${timestampSlug}.json`,
          data: {
            estimates: backupPackage.estimator?.estimates || backupPackage.estimates || [],
            rateItems: backupPackage.estimator?.rateItems || backupPackage.rateItems || [],
            customWorkItems: backupPackage.estimator?.customWorkItems || []
          },
          desc: "Civil engineering estimates, BOQ items, material rates & custom work items"
        },
        {
          name: `05_Quotations_and_Agreements_${timestampSlug}.json`,
          data: backupPackage.quotation || {},
          desc: "Client quotations, services, contractor directory & terms clauses"
        },
        {
          name: `06_Construction_Management_${timestampSlug}.json`,
          data: backupPackage.constructionWork || {},
          desc: "Construction project tracking, agreements, checklists & audit logs"
        },
        {
          name: `07_Personal_Bills_and_Accounts_${timestampSlug}.json`,
          data: backupPackage.personalBills || {},
          desc: "Office personal bills, KSEB electricity records, health insurance, RD & vendor payments"
        },
        {
          name: `08_Online_Applications_${timestampSlug}.json`,
          data: backupPackage.onlineApplications || [],
          desc: "Online LSGD / K-SMART portal application submissions and records"
        },
        {
          name: `09_Important_Sites_and_Land_Records_${timestampSlug}.json`,
          data: backupPackage.importantSites || [],
          desc: "Important government portals, village records & surveyor bookmarks"
        },
        {
          name: `10_Architectural_Vault_Files_${timestampSlug}.json`,
          data: backupPackage.dataStorageVault || {},
          desc: "CAD drawing vault metadata, folders & blueprints index"
        }
      ];

      for (const mod of subModules) {
        try {
          const modContent = JSON.stringify(mod.data, null, 2);
          const modFile = await uploadTextFileToDrive(
            accessToken,
            mod.name,
            modContent,
            "application/json",
            snapshotFolder.id,
            mod.desc
          );
          uploadedFiles.push(modFile);
        } catch (subErr) {
          console.warn(`[GoogleDrive] Sub-module upload warning for ${mod.name}:`, subErr);
        }
      }

      // 5. Generate and Upload Human-Readable README Report
      const meta = backupPackage.metadata || {};
      const summaryText = `
================================================================================
VASTHUSILPY ARCHITECTURAL & ENGINEERING CONSULTANTS • CLOUD BACKUP REPORT
================================================================================
Backup ID: BK-${timestampSlug}
Exported At: ${meta.exportedAtFormatted || now.toLocaleString("en-IN")}
Created By: ${meta.userEmail || "deepak.vasthusilpy@gmail.com"}
Application: ${meta.app || "Vasthusilpy Engineering ERP"} (v${meta.version || "3.0.0"})

--------------------------------------------------------------------------------
BACKED UP DATA METRICS SUMMARY:
--------------------------------------------------------------------------------
- Site Inspections: ${backupPackage.siteInspections?.length || meta.totalSiteInspections || 0} inspection reports
- CRM Active Projects: ${meta.totalCrmProjects || backupPackage.crmProjects?.length || 0} projects
- Client Directory: ${meta.totalCustomers || backupPackage.customers?.length || 0} clients
- Tax Invoices & Receipts: ${meta.totalInvoices || backupPackage.invoices?.length || 0} records
- Quotations & Packages: ${meta.totalQuotations || 0} quotations
- Engineering Estimates: ${meta.totalEstimates || backupPackage.estimates?.length || 0} estimate files
- Rate Library Items: ${meta.totalRateItems || 0} items
- Construction Projects: ${meta.totalConstructionProjects || 0} projects
- Personal & Office Bills: ${meta.totalPersonalBills || 0} entries
- Registered Tasks: ${meta.totalRegisteredTasks || 0} tasks
- CAD Vault Files & Folders: ${meta.totalVaultFiles || 0} files / ${meta.totalVaultFolders || 0} folders
- Online Application Records: ${backupPackage.onlineApplications?.length || 0} submissions
- Important Sites & Portals: ${backupPackage.importantSites?.length || 0} sites

--------------------------------------------------------------------------------
HOW TO RESTORE DATA:
--------------------------------------------------------------------------------
1. Open the Vasthusilpy Web Application.
2. Click on the "Google Drive Backup & Restore" button in the Top Header / Settings.
3. Select this backup snapshot ("${snapshotFolderName}") or download "${masterJsonName}" and click "Restore Backup".
4. Choose "Safe Merge" (combines new data) or "Clean Replace" (exact snapshot restore).

================================================================================
Vasthusilpy Consultants • Keralassery, Palakkad, Kerala
Contact: +91 9747995961 / +91 7012383137 | deepak.vasthusilpy@gmail.com
================================================================================
`;
      const reportFile = await uploadTextFileToDrive(
        accessToken,
        `README_BACKUP_REPORT_${timestampSlug}.txt`,
        summaryText.trim(),
        "text/plain",
        snapshotFolder.id,
        "Human-readable backup statistics, contents breakdown and restore guide."
      );
      uploadedFiles.push(reportFile);

      // 6. Return comprehensive success response
      return res.json({
        success: true,
        backupId: `BK-${timestampSlug}`,
        timestamp: now.toISOString(),
        formattedDate: meta.exportedAtFormatted || now.toLocaleString("en-IN"),
        rootFolderId: rootFolder.id,
        rootFolderLink: rootFolder.webViewLink,
        snapshotFolderId: snapshotFolder.id,
        snapshotFolderName: snapshotFolderName,
        snapshotFolderLink: snapshotFolder.webViewLink,
        masterFileId: masterFile.id,
        masterFileLink: masterFile.webViewLink,
        totalFilesUploaded: uploadedFiles.length,
        files: uploadedFiles,
        itemCounts: {
          siteInspections: backupPackage.siteInspections?.length || meta.totalSiteInspections || 0,
          crmProjects: meta.totalCrmProjects || backupPackage.crmProjects?.length || 0,
          customers: meta.totalCustomers || backupPackage.customers?.length || 0,
          invoices: meta.totalInvoices || backupPackage.invoices?.length || 0,
          estimates: meta.totalEstimates || backupPackage.estimates?.length || 0,
          quotations: meta.totalQuotations || 0,
          personalBills: meta.totalPersonalBills || 0,
          registeredTasks: meta.totalRegisteredTasks || 0,
          onlineApplications: backupPackage.onlineApplications?.length || 0,
          importantSites: backupPackage.importantSites?.length || 0
        },
        message: `All website data successfully backed up to your Google Drive under "${GOOGLE_DRIVE_FOLDER_NAME}/${snapshotFolderName}".`
      });
    } catch (error: any) {
      console.error("[GoogleBackupServer] Error in /api/google/drive/backup-all:", error);
      const isScopeErr = error.message?.toLowerCase().includes("insufficient") || error.status === 403;
      const status = error.status || (isScopeErr ? 403 : 500);
      return res.status(status).json({
        error: isScopeErr
          ? "Google Drive authorization required with Drive permissions. Please click 'Re-authorize Google Drive'."
          : error.message || "Failed to complete Google Drive backup.",
        insufficientScopes: isScopeErr
      });
    }
  });

  /**
   * GET /api/google/drive/list-backups
   * Lists all existing backup snapshots stored in the user's Google Drive
   */
  app.get("/api/google/drive/list-backups", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = (req.query.accessToken as string) || (authHeader ? authHeader.replace(/^Bearer\s+/i, "") : null);

      if (!token) {
        return res.status(401).json({ error: "Access token required." });
      }

      // Find Root Folder
      const rootSearchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name = '${GOOGLE_DRIVE_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      )}&fields=files(id,name,webViewLink)`;
      const rootRes = await fetch(rootSearchUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!rootRes.ok) {
        const err = await rootRes.json();
        return res.status(rootRes.status).json({ error: (err as any)?.error?.message || "Failed to query Google Drive." });
      }

      const rootData: any = await rootRes.json();
      if (!rootData.files || rootData.files.length === 0) {
        return res.json({
          success: true,
          count: 0,
          backups: [],
          rootFolderLink: null,
          message: "No backups found yet in Google Drive. Click 'Backup Now' to create your first cloud backup."
        });
      }

      const rootFolderId = rootData.files[0].id;
      const rootFolderLink = rootData.files[0].webViewLink || `https://drive.google.com/drive/folders/${rootFolderId}`;

      // List child snapshot folders under root folder
      const foldersUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      )}&fields=files(id,name,webViewLink,createdTime,modifiedTime)&orderBy=createdTime desc`;

      const foldersRes = await fetch(foldersUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!foldersRes.ok) {
        return res.json({
          success: true,
          count: 0,
          backups: [],
          rootFolderLink
        });
      }

      const foldersData: any = await foldersRes.json();
      const backupFolders = foldersData.files || [];

      // For each folder, check for the master json file
      const backupSnapshots: any[] = [];

      for (const folder of backupFolders) {
        try {
          const filesUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            `'${folder.id}' in parents and trashed = false`
          )}&fields=files(id,name,mimeType,size,webViewLink,webContentLink,createdTime)`;

          const filesRes = await fetch(filesUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (filesRes.ok) {
            const filesData: any = await filesRes.json();
            const files: any[] = filesData.files || [];
            const masterFile = files.find((f: any) => f.name.includes("Full_Backup") && f.name.endsWith(".json")) || files.find((f: any) => f.name.endsWith(".json"));

            backupSnapshots.push({
              folderId: folder.id,
              folderName: folder.name,
              folderLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
              createdTime: folder.createdTime || folder.modifiedTime,
              totalFiles: files.length,
              masterFileId: masterFile?.id,
              masterFileName: masterFile?.name,
              masterFileSize: masterFile?.size,
              masterFileLink: masterFile?.webViewLink,
              files: files.map((f: any) => ({
                id: f.id,
                name: f.name,
                size: f.size,
                webViewLink: f.webViewLink
              }))
            });
          }
        } catch (fErr) {
          console.warn(`Failed reading folder files for ${folder.name}`, fErr);
        }
      }

      return res.json({
        success: true,
        count: backupSnapshots.length,
        rootFolderId,
        rootFolderLink,
        backups: backupSnapshots
      });
    } catch (error: any) {
      console.error("[GoogleBackupServer] Error in /api/google/drive/list-backups:", error);
      return res.status(500).json({ error: error.message || "Failed to list Google Drive backups." });
    }
  });

  /**
   * POST /api/google/drive/download-backup
   * Downloads and parses a backup JSON file directly from Google Drive
   */
  app.post("/api/google/drive/download-backup", async (req: Request, res: Response) => {
    try {
      const { accessToken, fileId } = req.body;

      if (!accessToken || !fileId) {
        return res.status(400).json({ error: "Access token and fileId are required." });
      }

      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const driveRes = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!driveRes.ok) {
        const err = await driveRes.text();
        return res.status(driveRes.status).json({ error: `Failed to download file from Google Drive: ${err}` });
      }

      const rawJson = await driveRes.text();
      const parsed = JSON.parse(rawJson);

      return res.json({
        success: true,
        package: parsed
      });
    } catch (error: any) {
      console.error("[GoogleBackupServer] Error in /api/google/drive/download-backup:", error);
      return res.status(500).json({ error: error.message || "Failed to parse downloaded backup package." });
    }
  });
}
