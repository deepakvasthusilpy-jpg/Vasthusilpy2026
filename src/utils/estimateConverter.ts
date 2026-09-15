import { EstimateProject } from "../data/estimateData";
import { CrmProject, Invoice } from "../types";
import { triggerAppNotification } from "../context/NotificationContext";
import { broadcastMessage } from "./broadcastSync";
import { db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { loadCrmProjects, saveCrmProjects, loadInvoices, saveInvoices, safeSetDoc } from "./storageManager";

/**
 * Converts a Building Estimate into a CRM Project record.
 */
export function convertEstimateToCrmProject(estimate: EstimateProject): CrmProject {
  const newProjectId = `crm_proj_${Date.now()}`;
  
  const locationParts = [
    estimate.houseName,
    estimate.panchayatVillage,
    estimate.districtPincode ? `Dist: ${estimate.districtPincode}` : "",
    estimate.syNo ? `RSy No: ${estimate.syNo}` : ""
  ].filter(Boolean);

  const location = locationParts.length > 0 ? locationParts.join(", ") : "Keralassery, Palakkad";
  const title = `${estimate.clientName || "Client"} - ${estimate.buildingType || "Building Project"} (Est #${estimate.id})`;

  const newProject: CrmProject = {
    id: newProjectId,
    title,
    clientName: estimate.clientName || "Client Name",
    clientPhone: estimate.clientPhone || "+91 ",
    location,
    assignee: "DIBIN",
    status: "PROGRESS",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: `Converted from Building Estimate #${estimate.id}. Plinth Area: ${estimate.plinthAreaSqFt} Sq.Ft (${estimate.plinthAreaSqM} Sq.M). Total Estimated Cost: ₹${estimate.grandTotal.toLocaleString("en-IN")}. Prepared by ${estimate.preparedBy || "Vasthusilpy Designs"}.`,
    estimatedAmount: estimate.grandTotal,
    subTasks: [
      { id: `st_1_${Date.now()}`, title: "Verify Estimate & Land Survey Measurement", completed: true },
      { id: `st_2_${Date.now()}`, title: "Prepare KSMART LSGD Permit Drawings", completed: false },
      { id: `st_3_${Date.now()}`, title: "Structural Engineering & Vastu Check", completed: false },
      { id: `st_4_${Date.now()}`, title: "Stage Work & Progress Certificates", completed: false }
    ],
    attachments: [
      {
        id: `att_est_${Date.now()}`,
        name: `Estimate_Report_${estimate.id}.pdf`,
        type: "PDF",
        size: "1.2 MB",
        uploadedAt: new Date().toISOString().split("T")[0]
      }
    ],
    comments: [
      {
        id: `c_est_${Date.now()}`,
        author: "ADMIN",
        text: `Project automatically created from Estimate #${estimate.id} with total estimate of ₹${estimate.grandTotal.toLocaleString("en-IN")}.`,
        timestamp: new Date().toLocaleString()
      }
    ],
    activities: [
      {
        id: `act_est_${Date.now()}`,
        actor: "ADMIN",
        action: `Converted Estimate #${estimate.id} to CRM Project Record`,
        timestamp: new Date().toLocaleString()
      }
    ],
    createdAt: new Date().toISOString().split("T")[0]
  };

  try {
    const list = loadCrmProjects();
    const updatedList = [newProject, ...list.filter((p) => p.id !== newProjectId)];
    saveCrmProjects(updatedList, true);
    safeSetDoc(doc(db, "projects", newProject.id), newProject, { merge: true }).catch((err) =>
      console.warn("Firestore setDoc converted project error:", err)
    );
  } catch (err) {
    console.error("Error saving converted project:", err);
  }

  triggerAppNotification(
    "PROJECT_STATUS",
    "Estimate Converted to CRM Project",
    `Created Project for ${estimate.clientName} (Total Estimate: ₹${estimate.grandTotal.toLocaleString("en-IN")})`,
    { projectId: newProjectId }
  );

  return newProject;
}

/**
 * Converts a Building Estimate into an Office Invoice record.
 */
export function convertEstimateToInvoice(estimate: EstimateProject, linkedProjectId?: string): Invoice {
  const invNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 899 + 100))}`;
  const invId = `inv_${Date.now()}`;

  const clientAddr = [
    estimate.houseName,
    estimate.panchayatVillage,
    estimate.districtPincode
  ].filter(Boolean).join(", ");

  const today = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const items = [
    {
      id: `inv_item_est_${Date.now()}_1`,
      description: `Building Construction Quantity Survey & Rate Estimate - ${estimate.buildingType || "Residential"} (${estimate.plinthAreaSqFt} Sq.Ft)`,
      unit: "Sq.Ft",
      quantity: estimate.plinthAreaSqFt || 1,
      rate: Math.round(
        estimate.plinthAreaSqFt > 0 ? estimate.grandTotal / estimate.plinthAreaSqFt : estimate.grandTotal
      ),
      amount: estimate.grandTotal
    }
  ];

  const newInvoice: Invoice = {
    id: invId,
    invoiceNumber: invNumber,
    projectId: linkedProjectId || `crm_proj_${estimate.id}`,
    projectTitle: `${estimate.buildingType || "Building"} - ${estimate.clientName}`,
    applicantName: estimate.clientName || "Client Name",
    applicantMobile: estimate.clientPhone || "+91 ",
    applicantEmail: `${(estimate.clientName || "client").toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
    applicantAddress: clientAddr || "Keralassery, Palakkad",
    invoiceDate: today,
    dueDate,
    items,
    subTotal: estimate.grandTotal,
    taxRate: 0,
    taxAmount: 0,
    discount: 0,
    grandTotal: estimate.grandTotal,
    payments: [],
    totalPaid: 0,
    balanceDue: estimate.grandTotal,
    paymentStatus: "UNPAID",
    upiId: "7012383137@okbizaxis",
    notes: `Invoice generated directly from Building Estimate #${estimate.id} (${estimate.plinthAreaSqFt} Sq.Ft).`,
    terms: "Thank you for choosing Vasthusilpy Designs. All plans & estimates are certified under KPBR guidelines.",
    createdAt: today
  };

  try {
    const list = loadInvoices();
    const updatedList = [newInvoice, ...list.filter((i) => i.id !== invId)];
    saveInvoices(updatedList, true);
    safeSetDoc(doc(db, "invoices", newInvoice.id), newInvoice, { merge: true }).catch((err) =>
      console.warn("Firestore setDoc converted invoice error:", err)
    );
  } catch (err) {
    console.error("Error saving converted invoice:", err);
  }

  triggerAppNotification(
    "INVOICE_GENERATED",
    "Invoice Generated from Estimate",
    `Bill #${invNumber} generated for ${estimate.clientName} (₹${estimate.grandTotal.toLocaleString("en-IN")})`,
    { invoiceId: invId }
  );

  return newInvoice;
}
