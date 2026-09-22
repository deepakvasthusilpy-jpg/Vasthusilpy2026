import React, { useState, useEffect, useRef } from "react";
import { Invoice, InvoiceItem, CrmProject, RateItem, Customer } from "../../../types";
import { loadRateItems, addOrUpdateRateItem, loadCustomers, addOrUpdateCustomer } from "../../../utils/storageManager";
import { CustomerModal } from "./CustomerModal";
import { triggerAppNotification } from "../../../context/NotificationContext";
import { triggerPrint } from "../../../utils/printHelper";
import { sendInvoiceViaWhatsApp, sendInvoiceViaEmail } from "../../../utils/invoiceShareHelper";
import {
  X,
  Plus,
  Trash2,
  Receipt,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Edit2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  Printer,
  MessageSquare,
  Search,
  BookOpen,
  Users,
  CreditCard,
  QrCode,
  Check,
  Sidebar as SidebarIcon,
  HelpCircle,
  FileText
} from "lucide-react";
import { InvoiceQrCode } from "./InvoiceQrCode";

interface NewEditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
  projects: CrmProject[];
  defaultProjectId?: string;
  onSaveInvoice: (invoice: Invoice, options?: { keepOpen?: boolean }) => void;
}

export const NewEditInvoiceModal: React.FC<NewEditInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
  projects,
  defaultProjectId,
  onSaveInvoice
}) => {
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string>(
    invoiceToEdit?.id || `inv_${Date.now()}`
  );
  const isEditing = !!invoiceToEdit || !!currentInvoiceId;
  const draftKey = `vasthusilpy_invoice_draft_${invoiceToEdit?.id || "new"}`;

  // Rate items & customers
  const [catalogItems, setCatalogItems] = useState<RateItem[]>(() => loadRateItems());
  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => loadCustomers());
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Customer Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Sidebar / Drawers
  const [activeSidebarTab, setActiveSidebarTab] = useState<"SUMMARY" | "CATALOG" | "CUSTOMERS">("SUMMARY");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Accordion open states
  const [isBusinessInfoOpen, setIsBusinessInfoOpen] = useState(false);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string>("");

  // Business info state
  const [businessName, setBusinessName] = useState("VASTHUSILPY");
  const [businessAddress, setBusinessAddress] = useState(
    "NEAR PANCHAYATH OFFICE KERALASSERY\nKERALASSERY\nPALAKKAD, Kerala 678641\nIndia"
  );
  const [businessPhone, setBusinessPhone] = useState("9747995961");
  const [businessMobile, setBusinessMobile] = useState("7012383137");

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    invoiceToEdit?.projectId || defaultProjectId || ""
  );

  const [applicantName, setApplicantName] = useState<string>(
    invoiceToEdit?.applicantName || ""
  );
  const [applicantMobile, setApplicantMobile] = useState<string>(
    invoiceToEdit?.applicantMobile || ""
  );
  const [applicantEmail, setApplicantEmail] = useState<string>(
    invoiceToEdit?.applicantEmail || ""
  );
  const [applicantAddress, setApplicantAddress] = useState<string>(
    invoiceToEdit?.applicantAddress || ""
  );
  const [applicantContactPerson, setApplicantContactPerson] = useState<string>(
    invoiceToEdit?.applicantContactPerson || ""
  );

  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    invoiceToEdit?.invoiceNumber || `${Math.floor(220 + Math.random() * 80)}`
  );
  const [poNumber, setPoNumber] = useState<string>(
    invoiceToEdit?.poNumber || ""
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    invoiceToEdit?.invoiceDate || new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    invoiceToEdit?.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>(
    invoiceToEdit?.items && invoiceToEdit.items.length > 0
      ? invoiceToEdit.items
      : [
          {
            id: `item_${Date.now()}`,
            description: "KSMART - REGULARISATION COMPLETION OCCUPANCY + FORM 2",
            unit: "1",
            quantity: 1,
            rate: 5000,
            amount: 5000
          }
        ]
  );

  const [discount, setDiscount] = useState<number>(invoiceToEdit?.discount || 0);
  const [advancePayment, setAdvancePayment] = useState<number>(invoiceToEdit?.advancePayment || 0);
  const [advancePaymentDate, setAdvancePaymentDate] = useState<string>(
    invoiceToEdit?.advancePaymentDate || new Date().toISOString().split("T")[0]
  );
  const [advancePaymentMode, setAdvancePaymentMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE">(
    invoiceToEdit?.advancePaymentMode || "UPI"
  );
  const [advancePaymentRef, setAdvancePaymentRef] = useState<string>(invoiceToEdit?.advancePaymentRef || "");

  const [notes, setNotes] = useState<string>(
    invoiceToEdit?.notes ||
      `NAME : DEEPAK C\nACCOUNT NO : 1062 5047 526\nIFSC CODE : SBIN0007624\nBANK : SBI , KERALASSERY\nUPI PAYMENT :\n9567627277@naviaxis\n7012383137@naviaxis`
  );
  const [footerText, setFooterText] = useState<string>(
    invoiceToEdit?.terms || "Thank you for choosing Vasthusilpy. All plans comply with KPBR norms."
  );

  // UI state
  const [error, setError] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("saved");

  // Sync state whenever modal opens or invoiceToEdit changes
  useEffect(() => {
    if (isOpen) {
      setCatalogItems(loadRateItems());
      setAllCustomers(loadCustomers());
      setSaveSuccessMessage("");
      if (invoiceToEdit) {
        setCurrentInvoiceId(invoiceToEdit.id);
        setSelectedProjectId(invoiceToEdit.projectId || "");
        setApplicantName(invoiceToEdit.applicantName || "");
        setApplicantMobile(invoiceToEdit.applicantMobile || "");
        setApplicantEmail(invoiceToEdit.applicantEmail || "");
        setApplicantAddress(invoiceToEdit.applicantAddress || "");
        setApplicantContactPerson(invoiceToEdit.applicantContactPerson || "");
        setInvoiceNumber(invoiceToEdit.invoiceNumber || "");
        setPoNumber(invoiceToEdit.poNumber || "");
        setInvoiceDate(invoiceToEdit.invoiceDate || new Date().toISOString().split("T")[0]);
        setDueDate(invoiceToEdit.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
        setItems(
          invoiceToEdit.items && invoiceToEdit.items.length > 0
            ? invoiceToEdit.items
            : [
                {
                  id: `item_${Date.now()}`,
                  description: "KSMART - REGULARISATION COMPLETION OCCUPANCY + FORM 2",
                  unit: "1",
                  quantity: 1,
                  rate: 5000,
                  amount: 5000
                }
              ]
        );
        setDiscount(invoiceToEdit.discount ?? 0);
        if (invoiceToEdit.discount && invoiceToEdit.discount > 0) setShowDiscount(true);
        setAdvancePayment(invoiceToEdit.advancePayment ?? 0);
        setAdvancePaymentDate(invoiceToEdit.advancePaymentDate || new Date().toISOString().split("T")[0]);
        setAdvancePaymentMode(invoiceToEdit.advancePaymentMode || "UPI");
        setAdvancePaymentRef(invoiceToEdit.advancePaymentRef || "");
        setNotes(
          invoiceToEdit.notes ||
            `NAME : DEEPAK C\nACCOUNT NO : 1062 5047 526\nIFSC CODE : SBIN0007624\nBANK : SBI , KERALASSERY\nUPI PAYMENT :\n9567627277@naviaxis\n7012383137@naviaxis`
        );
        setFooterText(
          invoiceToEdit.terms || "Thank you for choosing Vasthusilpy. All plans comply with KPBR norms."
        );
      } else {
        setCurrentInvoiceId(`inv_${Date.now()}`);
        if (defaultProjectId) {
          setSelectedProjectId(defaultProjectId);
          const matchedProj = projects.find((p) => p.id === defaultProjectId);
          if (matchedProj) {
            setApplicantName(matchedProj.clientName);
            setApplicantMobile(matchedProj.clientPhone);
            if (matchedProj.clientEmail) setApplicantEmail(matchedProj.clientEmail);
            setApplicantAddress(matchedProj.location);
            if (matchedProj.advancePayment && matchedProj.advancePayment > 0) {
              setAdvancePayment(matchedProj.advancePayment);
              if (matchedProj.advancePaymentDate) setAdvancePaymentDate(matchedProj.advancePaymentDate);
              if (matchedProj.advancePaymentMode) setAdvancePaymentMode(matchedProj.advancePaymentMode);
              if (matchedProj.advancePaymentRef) setAdvancePaymentRef(matchedProj.advancePaymentRef);
            }
          }
        }
      }
    }
  }, [isOpen, invoiceToEdit, defaultProjectId, projects]);

  // Handle Project selection auto-fill
  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    if (!projId) return;
    const matched = projects.find((p) => p.id === projId);
    if (matched) {
      if (!applicantName || applicantName.trim() === "") setApplicantName(matched.clientName);
      if (!applicantMobile || applicantMobile.trim() === "") setApplicantMobile(matched.clientPhone);
      if (matched.clientEmail && (!applicantEmail || applicantEmail.trim() === "")) setApplicantEmail(matched.clientEmail);
      if (!applicantAddress || applicantAddress.trim() === "") setApplicantAddress(matched.location);
      if (matched.advancePayment && matched.advancePayment > 0 && advancePayment === 0) {
        setAdvancePayment(matched.advancePayment);
        if (matched.advancePaymentDate) setAdvancePaymentDate(matched.advancePaymentDate);
        if (matched.advancePaymentMode) setAdvancePaymentMode(matched.advancePaymentMode);
        if (matched.advancePaymentRef) setAdvancePaymentRef(matched.advancePaymentRef);
      }
    }
  };

  // Add line item
  const handleAddItem = (itemPreset?: Partial<InvoiceItem>) => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        description: itemPreset?.description || "",
        unit: itemPreset?.unit || "1",
        quantity: itemPreset?.quantity ?? 1,
        rate: itemPreset?.rate ?? 0,
        amount: (itemPreset?.quantity ?? 1) * (itemPreset?.rate ?? 0)
      }
    ]);
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `item_${Date.now()}`,
          description: "",
          unit: "1",
          quantity: 1,
          rate: 0,
          amount: 0
        }
      ]);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Update item field
  const handleUpdateItem = (
    id: string,
    field: keyof InvoiceItem,
    value: any,
    autoStoreCatalog = false
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          const q = field === "quantity" ? Number(value) : item.quantity;
          const r = field === "rate" ? Number(value) : item.rate;
          updated.amount = (isNaN(q) ? 0 : q) * (isNaN(r) ? 0 : r);
        }

        if (autoStoreCatalog && updated.description && updated.description.trim().length > 2) {
          try {
            addOrUpdateRateItem({
              name: updated.description.trim(),
              category: "SERVICE",
              unit: updated.unit || "1",
              rate: Number(updated.rate) || 0
            });
            setCatalogItems(loadRateItems());
          } catch (e) {}
        }

        return updated;
      })
    );
  };

  // Quick insert from catalog sidebar
  const handleInsertCatalogItem = (catItem: RateItem) => {
    // Check if there is an empty row to replace
    const emptyIndex = items.findIndex((i) => !i.description.trim() && i.rate === 0);
    if (emptyIndex >= 0) {
      setItems((prev) =>
        prev.map((item, idx) => {
          if (idx !== emptyIndex) return item;
          return {
            ...item,
            rateItemId: catItem.id,
            description: catItem.name,
            unit: catItem.unit || "1",
            quantity: 1,
            rate: catItem.rate || 0,
            amount: catItem.rate || 0
          };
        })
      );
    } else {
      handleAddItem({
        rateItemId: catItem.id,
        description: catItem.name,
        unit: catItem.unit || "1",
        quantity: 1,
        rate: catItem.rate || 0
      });
    }

    setSaveSuccessMessage(`Added "${catItem.name}" to line items.`);
    setTimeout(() => setSaveSuccessMessage(""), 3000);
  };

  // Select customer from sidebar / modal
  const handleSelectCustomer = (customer: Customer) => {
    setApplicantName(customer.name);
    setApplicantMobile(customer.phone);
    if (customer.email) setApplicantEmail(customer.email);
    if (customer.contactPerson) setApplicantContactPerson(customer.contactPerson);
    const fullAddr = [customer.addressLine, customer.houseName, customer.villagePanchayat, customer.district]
      .filter(Boolean)
      .join(", ");
    if (fullAddr) setApplicantAddress(fullAddr);
    addOrUpdateCustomer(customer);
    setAllCustomers(loadCustomers());
    setSaveSuccessMessage(`Selected customer ${customer.name}.`);
    setTimeout(() => setSaveSuccessMessage(""), 3000);
  };

  // Calculations
  const subTotal = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const grandTotal = Math.max(0, subTotal - (discount || 0));

  // Compute days difference between invoiceDate and dueDate
  const getDueDaysText = () => {
    try {
      const d1 = new Date(invoiceDate);
      const d2 = new Date(dueDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "On receipt";
      if (diffDays > 0) return `Within ${diffDays} days`;
      return "Past due";
    } catch (e) {
      return "Within 15 days";
    }
  };

  // Save handler with options
  const handleSave = (options?: {
    keepOpen?: boolean;
    andPrint?: boolean;
    andWhatsApp?: boolean;
    andEmail?: boolean;
  }) => {
    setError("");

    if (!applicantName.trim()) {
      setError("Please add or select a customer name before saving.");
      return;
    }

    if (!invoiceNumber.trim()) {
      setError("Please enter a valid invoice number.");
      return;
    }

    const validItems = items.filter((i) => i.description.trim() !== "");
    if (validItems.length === 0) {
      setError("Please add at least one item or service description.");
      return;
    }

    // Auto-store all items into the Products & Services Catalog
    validItems.forEach((item) => {
      if (item.description.trim()) {
        addOrUpdateRateItem({
          name: item.description.trim(),
          category: "SERVICE",
          unit: item.unit || "1",
          rate: Number(item.rate) || 0
        });
      }
    });

    // Auto-store customer into Customer Directory
    if (applicantName.trim() && applicantMobile.trim()) {
      addOrUpdateCustomer({
        name: applicantName.trim(),
        phone: applicantMobile.trim(),
        email: applicantEmail.trim() || undefined,
        contactPerson: applicantContactPerson.trim() || undefined,
        addressLine: applicantAddress.trim() || undefined
      });
    }

    const currentPayments = invoiceToEdit?.payments || [];
    const directPaymentsTotal = currentPayments.reduce((acc, p) => acc + p.amount, 0);
    const numAdvance = Number(advancePayment) || 0;
    const totalPaid = directPaymentsTotal + (currentPayments.length === 0 ? numAdvance : 0);
    const balanceDue = Math.max(0, grandTotal - totalPaid);

    let paymentStatus: "UNPAID" | "PARTIALLY PAID" | "PAID" = "UNPAID";
    if (totalPaid >= grandTotal && grandTotal > 0) {
      paymentStatus = "PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIALLY PAID";
    }

    const assignedId = currentInvoiceId || invoiceToEdit?.id || `inv_${Date.now()}`;
    setCurrentInvoiceId(assignedId);

    const savedInvoice: Invoice = {
      id: assignedId,
      invoiceNumber: invoiceNumber.trim(),
      poNumber: poNumber.trim() || undefined,
      projectId: selectedProjectId || undefined,
      projectTitle: selectedProjectId
        ? projects.find((p) => p.id === selectedProjectId)?.title
        : undefined,
      applicantName: applicantName.trim(),
      applicantMobile: applicantMobile.trim(),
      applicantEmail: applicantEmail.trim() || undefined,
      applicantAddress: applicantAddress.trim() || undefined,
      applicantContactPerson: applicantContactPerson.trim() || undefined,
      invoiceDate,
      dueDate,
      items: validItems,
      subTotal,
      currency: "INR",
      taxRate: 0,
      taxAmount: 0,
      discount: Number(discount) || 0,
      grandTotal,
      advancePayment: numAdvance > 0 ? numAdvance : undefined,
      advancePaymentDate: numAdvance > 0 ? advancePaymentDate : undefined,
      advancePaymentMode: numAdvance > 0 ? advancePaymentMode : undefined,
      advancePaymentRef: numAdvance > 0 && advancePaymentRef.trim() ? advancePaymentRef.trim() : undefined,
      payments: currentPayments,
      totalPaid,
      balanceDue,
      paymentStatus,
      upiId: "7012383137@okbizaxis",
      notes: notes.trim() || undefined,
      terms: footerText.trim() || undefined,
      createdAt: invoiceToEdit?.createdAt || new Date().toISOString().split("T")[0]
    };

    onSaveInvoice(savedInvoice, { keepOpen: options?.keepOpen });

    if (options?.andWhatsApp) {
      sendInvoiceViaWhatsApp(savedInvoice);
    } else if (options?.andEmail) {
      sendInvoiceViaEmail(savedInvoice);
    } else if (options?.andPrint) {
      setTimeout(() => {
        triggerPrint(`Invoice_${savedInvoice.invoiceNumber}_A4`, "printable-invoice-document", { isInvoice: true, pageMargin: "15mm" });
      }, 300);
    }

    if (options?.keepOpen) {
      setSaveSuccessMessage(`✓ Invoice #${savedInvoice.invoiceNumber} saved! You can continue editing or adding more items.`);
      setTimeout(() => setSaveSuccessMessage(""), 5000);
    } else {
      onClose();
    }
  };

  // Filtered rate items & customers for sidebar
  const filteredCatalogItems = catalogItems.filter((c) =>
    !catalogSearch || c.name.toLowerCase().includes(catalogSearch.toLowerCase())
  );
  const filteredCustomers = allCustomers.filter((c) =>
    !customerSearch ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="invoice-modal-container bg-white text-slate-900 rounded-3xl max-w-7xl w-full p-4 md:p-6 shadow-2xl my-4 space-y-4 border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-slate-900 font-sans">
                  {invoiceToEdit ? `Edit Invoice #${invoiceNumber}` : "Create New Invoice"}
                </h1>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  ● Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans">
                KPBR Compliant Tax Invoice with automated UPI QR Code & Instant Client Sharing
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Sidebar Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                isSidebarOpen
                  ? "bg-slate-100 border-slate-300 text-slate-800"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
              title="Toggle Fast Tools Sidebar"
            >
              <SidebarIcon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Tools Sidebar</span>
            </button>

            {/* Save & Continue Button */}
            <button
              type="button"
              onClick={() => handleSave({ keepOpen: true })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Save invoice and keep form open to continue editing"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Continue</span>
            </button>

            {/* Save & Close Button */}
            <button
              type="button"
              onClick={() => handleSave({ keepOpen: false })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Close</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications & Error alerts */}
        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage("")}
              className="text-emerald-700 hover:text-emerald-900 font-mono text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold shrink-0">
            ⚠️ {error}
          </div>
        )}

        {/* MAIN BODY: Two-column layout (Interactive Sidebar Left, Form Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 pr-1">
          {/* LEFT INTERACTIVE SIDEBAR / DOCK (4 cols) */}
          {isSidebarOpen && (
            <div className="lg:col-span-4 space-y-4 order-1">
              {/* Sidebar Tabs */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveSidebarTab("SUMMARY")}
                  className={`flex-1 py-2 px-1 rounded-xl text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    activeSidebarTab === "SUMMARY"
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>Summary</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSidebarTab("CATALOG")}
                  className={`flex-1 py-2 px-1 rounded-xl text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    activeSidebarTab === "CATALOG"
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Services</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSidebarTab("CUSTOMERS")}
                  className={`flex-1 py-2 px-1 rounded-xl text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    activeSidebarTab === "CUSTOMERS"
                      ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Clients</span>
                </button>
              </div>

              {/* TAB 1: SUMMARY & QUICK ACTIONS */}
              {activeSidebarTab === "SUMMARY" && (
                <div className="space-y-4">
                  {/* Calculation Card */}
                  <div className="border border-slate-800 rounded-3xl p-4 md:p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Invoice Total</span>
                      </span>
                      <span className="text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 px-2.5 py-0.5 rounded-full font-bold">
                        {getDueDaysText()}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Subtotal:</span>
                        <span className="text-white font-bold">₹{subTotal.toLocaleString("en-IN")}</span>
                      </div>

                      {/* Discount row */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Discount:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400 font-bold">-₹</span>
                          <input
                            type="number"
                            min="0"
                            value={discount}
                            onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                            className="w-24 bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Advance Payment row */}
                      <div className="flex items-center justify-between text-emerald-300">
                        <span>Advance Paid:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={advancePayment}
                            onChange={(e) => setAdvancePayment(Number(e.target.value) || 0)}
                            className="w-24 bg-slate-800/90 border border-emerald-700/80 rounded-lg px-2 py-1 text-xs text-right font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-800 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Grand Total:</span>
                        <span className="text-2xl font-black text-cyan-400">
                          ₹{grandTotal.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline text-amber-300 pt-0.5">
                        <span className="text-xs font-bold uppercase tracking-wide">Balance Due:</span>
                        <span className="text-base font-black font-mono">
                          ₹{Math.max(0, grandTotal - (Number(advancePayment) || 0)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OFFICIAL UPI QR CODE CARD (Cleanly formatted & non-overlapping) */}
                  <div className="border border-slate-800 rounded-3xl p-4 bg-slate-900 text-white space-y-3 shadow-xl">
                    <InvoiceQrCode
                      amount={grandTotal}
                      invoiceNumber={invoiceNumber}
                      upiId="7012383137@okbizaxis"
                      size={130}
                    />
                  </div>

                  {/* FAST ACTIONS PANEL (Systematic without overlap) */}
                  <div className="border border-slate-200 rounded-3xl p-4 bg-white space-y-3 shadow-sm font-sans">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Quick Save & Export</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">1-Click Actions</span>
                    </div>

                    <div className="space-y-2">
                      {/* Save & Continue */}
                      <button
                        type="button"
                        onClick={() => handleSave({ keepOpen: true })}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Save className="w-4 h-4 shrink-0" />
                        <span className="truncate">Save & Continue Editing</span>
                      </button>

                      {/* Save & WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleSave({ keepOpen: false, andWhatsApp: true })}
                        className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">Save & Send WhatsApp</span>
                      </button>

                      {/* Save & Email */}
                      <button
                        type="button"
                        onClick={() => handleSave({ keepOpen: false, andEmail: true })}
                        className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">Save & Send Email</span>
                      </button>

                      {/* Save & Print */}
                      <button
                        type="button"
                        onClick={() => handleSave({ keepOpen: false, andPrint: true })}
                        className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="truncate">Save & Print Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICES & RATE ITEMS DRAWER */}
              {activeSidebarTab === "CATALOG" && (
                <div className="border border-slate-200 rounded-3xl p-4 bg-white space-y-3 shadow-sm max-h-[480px] flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Quick Insert Services</span>
                    <span className="text-[10px] text-slate-400 font-mono">1-Click Add</span>
                  </div>

                  {/* Search Services */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search rate items..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Items List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {filteredCatalogItems.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => handleInsertCatalogItem(cat)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-blue-700 truncate text-[11px]">
                            {cat.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            ₹{cat.rate.toLocaleString("en-IN")} / {cat.unit || "unit"}
                          </div>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOMERS DIRECTORY DRAWER */}
              {activeSidebarTab === "CUSTOMERS" && (
                <div className="border border-slate-200 rounded-3xl p-4 bg-white space-y-3 shadow-sm max-h-[480px] flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Saved Client Directory</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:underline font-bold"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Search Clients */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search client by name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Clients List */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {filteredCustomers.map((cust) => (
                      <div
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-blue-700 truncate text-[11px]">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            📱 {cust.phone} {cust.addressLine ? `• ${cust.addressLine}` : ""}
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-white border border-slate-200 group-hover:bg-blue-600 group-hover:text-white text-slate-600 rounded-lg text-[10px] font-bold font-mono">
                          Pick
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RIGHT MAIN FORM AREA (8 cols when sidebar open, 12 cols when closed) */}
          <div className={`${isSidebarOpen ? "lg:col-span-8" : "lg:col-span-12"} space-y-5 order-2`}>
            {/* Top Row: Business Details Accordion & Project Linker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Linked CRM Project */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Link to CRM Project (Optional)
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- No Project Linked (Independent Invoice) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.clientName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice # & Auto Generator */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Invoice Number
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 font-mono">#</span>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="220"
                      className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceNumber(`${Math.floor(220 + Math.random() * 80)}`)}
                  className="mt-4 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-mono font-bold rounded-lg cursor-pointer"
                  title="Generate Random Number"
                >
                  Auto #
                </button>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="border border-slate-300 rounded-2xl p-4 bg-white space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    Bill To Customer
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    (Auto-populates to Client Directory)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSidebarTab("CUSTOMERS");
                      setIsSidebarOpen(true);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Select Saved Client</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                  >
                    + New Client
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Deepak C / Rahul"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="text"
                    value={applicantMobile}
                    onChange={(e) => setApplicantMobile(e.target.value)}
                    placeholder="e.g. 9747995961"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="client@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Site / Billing Address
                </label>
                <input
                  type="text"
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  placeholder="e.g. Near Panchayath Office, Keralassery, Palakkad"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Dates & P.O. Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border border-slate-200 rounded-2xl p-4 bg-white text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  P.O. / S.O. Number (Optional)
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2025-01"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Advance Payment / Deposit Received Details */}
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider font-sans">
                    Advance Payment / Deposit Received
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {Number(advancePayment) > 0 ? `₹${Number(advancePayment).toLocaleString("en-IN")} Received` : "No Advance"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Advance Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={advancePayment}
                      onChange={(e) => setAdvancePayment(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-white border border-emerald-300 rounded-xl pl-6 pr-2 py-2 text-xs font-mono font-bold text-emerald-950 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Advance Date
                  </label>
                  <input
                    type="date"
                    value={advancePaymentDate}
                    onChange={(e) => setAdvancePaymentDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={advancePaymentMode}
                    onChange={(e) => setAdvancePaymentMode(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque / DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Transaction Ref / Note
                  </label>
                  <input
                    type="text"
                    value={advancePaymentRef}
                    onChange={(e) => setAdvancePaymentRef(e.target.value)}
                    placeholder="e.g. UPI Ref #423589"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {Number(advancePayment) > 0 && (
                <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <span className="text-slate-600">
                    Grand Total: <strong className="text-slate-900">₹{grandTotal.toLocaleString("en-IN")}</strong>
                  </span>
                  <span className="text-emerald-700 font-bold">
                    Advance Deducted: ₹{Number(advancePayment).toLocaleString("en-IN")}
                  </span>
                  <span className="text-amber-800 font-black">
                    Balance Due: ₹{Math.max(0, grandTotal - Number(advancePayment)).toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items Table with Quick Catalog Picker */}
            <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white shadow-sm space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 font-sans">
                    Items & Architectural Services
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {items.length} {items.length === 1 ? "Item" : "Items"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSidebarTab("CATALOG");
                      setIsSidebarOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Browse Service Catalog</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items List Rows */}
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl grid grid-cols-12 gap-2.5 items-center transition-colors text-xs"
                  >
                    {/* Index */}
                    <div className="col-span-1 text-center font-mono font-bold text-slate-400 text-xs">
                      {index + 1}.
                    </div>

                    {/* Description with catalog suggestions */}
                    <div className="col-span-11 sm:col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                        onBlur={() => handleUpdateItem(item.id, "description", item.description, true)}
                        placeholder="Description of service / item (e.g. KSMART Plan Approval)"
                        className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-3 sm:col-span-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-mono text-center font-bold text-slate-900 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, "unit", e.target.value)}
                          placeholder="unit"
                          className="w-12 bg-white border border-slate-300 rounded-xl px-1 py-2 text-[10px] font-mono text-center text-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Rate (₹) */}
                    <div className="col-span-4 sm:col-span-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.rate}
                          onChange={(e) => handleUpdateItem(item.id, "rate", e.target.value)}
                          onBlur={() => handleUpdateItem(item.id, "rate", item.rate, true)}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-6 pr-2 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Amount & Delete */}
                    <div className="col-span-5 sm:col-span-2 flex items-center justify-between gap-1">
                      <div className="font-mono font-black text-slate-900 text-xs pl-1">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes & Bank Details Accordion */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Payment Bank Details & Notes
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Printed on Invoice</span>
              </div>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
              />

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Terms & Conditions / Disclaimer
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Modal Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Ctrl+S to Save & Continue • Auto-saves drafts safely
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSave({ keepOpen: true })}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Continue</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave({ keepOpen: false })}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Close</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSaveCustomer={handleSelectCustomer}
        />
      )}
    </div>
  );
};
