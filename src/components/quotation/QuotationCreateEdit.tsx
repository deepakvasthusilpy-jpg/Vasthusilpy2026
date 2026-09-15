import React, { useState, useEffect, useMemo } from "react";
import { Quotation, QuotationLineItem, QuotationService, Contractor, TermsClause, QuotationStatus, CompanyDetails } from "../../types";
import { formatINR, generateNextQuotationNo, loadSavedCompanyDetails, saveCompanyDetailsToStorage } from "../../utils/quotationStorageManager";
import { numberToWordsIndian } from "../../utils/numberToWords";
import { triggerPrint } from "../../utils/printHelper";
import { QuotationInteractiveSheet } from "./QuotationInteractiveSheet";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  ChevronDown,
  ChevronUp,
  Users,
  CheckSquare,
  Square,
  ShieldCheck,
  FileText,
  Calculator,
  Percent,
  AlertCircle,
  X,
  Layers,
  ArrowLeft,
  Eye,
  Columns,
  Maximize2,
  Minimize2,
  HardHat,
  Building2,
  Check,
  Sparkles
} from "lucide-react";

interface QuotationCreateEditProps {
  initialQuotation?: Quotation | null;
  services: QuotationService[];
  contractors: Contractor[];
  termsClauses: TermsClause[];
  allQuotations: Quotation[];
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
  onPreview: (quotation: Quotation) => void;
  onAddNewContractor: (contractor: Omit<Contractor, "id" | "created_at">) => Contractor;
}

export const QuotationCreateEdit: React.FC<QuotationCreateEditProps> = ({
  initialQuotation,
  services,
  contractors,
  termsClauses,
  allQuotations,
  onSave,
  onCancel,
  onPreview,
  onAddNewContractor
}) => {
  const isEditing = !!initialQuotation;

  // View Mode: "split" (Side-by-side form + live preview), "form" (Form only), "sheet" (Full WYSIWYG Document)
  const [viewMode, setViewMode] = useState<"split" | "form" | "sheet">("split");
  const [zoomLevel, setZoomLevel] = useState<number>(85); // zoom for split view sheet

  // Auto-calculated defaults
  const todayStr = new Date().toISOString().split("T")[0];
  const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Saved company preferences
  const savedCompany = loadSavedCompanyDetails();
  const [saveCompanySuccess, setSaveCompanySuccess] = useState(false);

  // Document Titles
  const [documentTitle, setDocumentTitle] = useState(
    initialQuotation?.document_title || "CONSTRUCTION QUOTATION & ESTIMATE"
  );
  const [documentSubtitle, setDocumentSubtitle] = useState(
    initialQuotation?.document_subtitle || "Itemized Bill of Quantities & Scope Specifications"
  );

  // Optional Company Details
  const [includeCompanyDetails, setIncludeCompanyDetails] = useState<boolean>(
    initialQuotation?.include_company_details ?? (!!savedCompany)
  );
  const [showCompanySection, setShowCompanySection] = useState<boolean>(
    initialQuotation?.include_company_details ?? (!!savedCompany)
  );
  const [companyName, setCompanyName] = useState(
    initialQuotation?.company_name || savedCompany?.name || ""
  );
  const [companyTagline, setCompanyTagline] = useState(
    initialQuotation?.company_tagline || savedCompany?.tagline || ""
  );
  const [companyAddress, setCompanyAddress] = useState(
    initialQuotation?.company_address || savedCompany?.address || ""
  );
  const [companyPhone, setCompanyPhone] = useState(
    initialQuotation?.company_phone || savedCompany?.phone || ""
  );
  const [companyEmail, setCompanyEmail] = useState(
    initialQuotation?.company_email || savedCompany?.email || ""
  );
  const [companyGstin, setCompanyGstin] = useState(
    initialQuotation?.company_gstin || savedCompany?.gstin || ""
  );

  // Client Details
  const [quotationNo, setQuotationNo] = useState(
    initialQuotation?.quotation_no || generateNextQuotationNo(allQuotations)
  );
  const [status, setStatus] = useState<QuotationStatus>(initialQuotation?.status || "pending");
  const [clientName, setClientName] = useState(initialQuotation?.client_name || "");
  const [clientPhone, setClientPhone] = useState(initialQuotation?.client_phone || "");
  const [clientEmail, setClientEmail] = useState(initialQuotation?.client_email || "");
  const [siteAddress, setSiteAddress] = useState(initialQuotation?.site_address || "");
  const [plotArea, setPlotArea] = useState<string | number>(initialQuotation?.plot_area_sqft || "");
  const [dateIssued, setDateIssued] = useState(initialQuotation?.date_issued || todayStr);
  const [expiryDate, setExpiryDate] = useState(initialQuotation?.expiry_date || defaultExpiry);

  // Contractor Details (PROVISION NEAR CLIENT DETAILS)
  const [contractorName, setContractorName] = useState(
    initialQuotation?.contractor_name || ""
  );
  const [contractorPhone, setContractorPhone] = useState(
    initialQuotation?.contractor_phone || ""
  );
  const [contractorTrade, setContractorTrade] = useState(
    initialQuotation?.contractor_trade || "General Civil Contractor"
  );
  const [contractorCompany, setContractorCompany] = useState(
    initialQuotation?.contractor_company || ""
  );
  const [contractorEmail, setContractorEmail] = useState(
    initialQuotation?.contractor_email || ""
  );

  // Signatory
  const [signatoryName, setSignatoryName] = useState(
    initialQuotation?.signatory_name || ""
  );

  // Line items state
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>(() => {
    if (initialQuotation?.line_items && initialQuotation.line_items.length > 0) {
      return initialQuotation.line_items;
    }
    return [
      {
        id: `li_${Date.now()}_1`,
        description: "Rubble Soling & Basement RR Masonry in CM 1:6",
        unit: "cum",
        quantity: 35,
        rate: 5200,
        include_material: true,
        include_labour: true,
        material_rate: 3400,
        labour_rate: 1800,
        amount: 182000
      },
      {
        id: `li_${Date.now()}_2`,
        description: "Solid Concrete Block Masonry 6\" in CM 1:6",
        unit: "sq.ft",
        quantity: 1200,
        rate: 150,
        include_material: true,
        include_labour: true,
        material_rate: 98,
        labour_rate: 52,
        amount: 180000
      }
    ];
  });

  // Discount and Tax
  const [discountType, setDiscountType] = useState<"amount" | "percentage">(
    initialQuotation?.discount_type || "amount"
  );
  const [discountValue, setDiscountValue] = useState<number>(initialQuotation?.discount_value || 0);
  const [enableTax, setEnableTax] = useState<boolean>(initialQuotation?.enable_tax || false);
  const [taxRate, setTaxRate] = useState<number>(initialQuotation?.tax_rate || 18);

  // Notes
  const [notes, setNotes] = useState(
    initialQuotation?.notes ||
      "All rates quoted are inclusive of standard scaffolding, site supervision, and curing as per IS specification. Quality testing certificate for steel and cement will be provided upon request."
  );

  // Terms and conditions clause ids
  const [selectedTermsIds, setSelectedTermsIds] = useState<string[]>(() => {
    if (initialQuotation?.terms_clause_ids) {
      return initialQuotation.terms_clause_ids;
    }
    return termsClauses.filter((t) => t.is_default).map((t) => t.id);
  });

  // Assigned contractors
  const [assignedContractorIds, setAssignedContractorIds] = useState<string[]>(
    initialQuotation?.contractor_ids || []
  );
  const [showContractorsOnPrint, setShowContractorsOnPrint] = useState<boolean>(
    initialQuotation?.show_contractors_on_print || false
  );

  // Modal / Dropdown states
  const [showServicePicker, setShowServicePicker] = useState<boolean>(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showNewContractorModal, setShowNewContractorModal] = useState(false);
  const [newContractorName, setNewContractorName] = useState("");
  const [newContractorTrade, setNewContractorTrade] = useState("Masonry / Structure");
  const [newContractorPhone, setNewContractorPhone] = useState("");
  const [newContractorCompany, setNewContractorCompany] = useState("");

  // Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // LIVE TOTALS CALCULATION
  const { subtotal, materialSubtotal, labourSubtotal, discountAmount, taxAmount, grandTotal } =
    useMemo(() => {
      let sub = 0;
      let matSub = 0;
      let labSub = 0;

      lineItems.forEach((item) => {
        const itemAmt = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
        sub += itemAmt;

        if (item.include_material && item.material_rate) {
          matSub += (Number(item.quantity) || 0) * Number(item.material_rate);
        }
        if (item.include_labour && item.labour_rate) {
          labSub += (Number(item.quantity) || 0) * Number(item.labour_rate);
        }
      });

      let disc = 0;
      if (discountType === "percentage") {
        disc = (sub * (Number(discountValue) || 0)) / 100;
      } else {
        disc = Number(discountValue) || 0;
      }
      disc = Math.min(disc, sub);

      const afterDiscount = Math.max(sub - disc, 0);

      let tax = 0;
      if (enableTax) {
        tax = (afterDiscount * (Number(taxRate) || 0)) / 100;
      }

      const total = Math.round(afterDiscount + tax);

      return {
        subtotal: Math.round(sub),
        materialSubtotal: Math.round(matSub),
        labourSubtotal: Math.round(labSub),
        discountAmount: Math.round(disc),
        taxAmount: Math.round(tax),
        grandTotal: total
      };
    }, [lineItems, discountType, discountValue, enableTax, taxRate]);

  // LIVE QUOTATION OBJECT FOR THE LIVE PREVIEW
  const liveQuotation: Quotation = useMemo(() => {
    return {
      id: initialQuotation?.id || `qtn_${Date.now()}`,
      quotation_no: quotationNo.trim(),
      status,
      document_title: documentTitle,
      document_subtitle: documentSubtitle,
      include_company_details: includeCompanyDetails,
      company_name: companyName.trim(),
      company_tagline: companyTagline.trim(),
      company_address: companyAddress.trim(),
      company_phone: companyPhone.trim(),
      company_email: companyEmail.trim(),
      company_gstin: companyGstin.trim(),
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      client_email: clientEmail.trim() || undefined,
      site_address: siteAddress.trim(),
      plot_area_sqft: plotArea || undefined,
      contractor_name: contractorName.trim(),
      contractor_phone: contractorPhone.trim(),
      contractor_trade: contractorTrade.trim(),
      contractor_company: contractorCompany.trim(),
      contractor_email: contractorEmail.trim(),
      signatory_name: signatoryName.trim(),
      date_issued: dateIssued,
      expiry_date: expiryDate,
      line_items: lineItems,
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      discount_amount: discountAmount,
      enable_tax: enableTax,
      tax_rate: enableTax ? Number(taxRate) || 0 : 0,
      tax_amount: taxAmount,
      subtotal,
      material_subtotal: materialSubtotal,
      labour_subtotal: labourSubtotal,
      total: grandTotal,
      notes: notes.trim(),
      terms_clause_ids: selectedTermsIds,
      contractor_ids: assignedContractorIds,
      show_contractors_on_print: showContractorsOnPrint,
      created_at: initialQuotation?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }, [
    initialQuotation,
    quotationNo,
    status,
    documentTitle,
    documentSubtitle,
    includeCompanyDetails,
    companyName,
    companyTagline,
    companyAddress,
    companyPhone,
    companyEmail,
    companyGstin,
    clientName,
    clientPhone,
    clientEmail,
    siteAddress,
    plotArea,
    contractorName,
    contractorPhone,
    contractorTrade,
    contractorCompany,
    contractorEmail,
    signatoryName,
    dateIssued,
    expiryDate,
    lineItems,
    discountType,
    discountValue,
    discountAmount,
    enableTax,
    taxRate,
    taxAmount,
    subtotal,
    materialSubtotal,
    labourSubtotal,
    grandTotal,
    notes,
    selectedTermsIds,
    assignedContractorIds,
    showContractorsOnPrint
  ]);

  // LIVE INLINE SYNC: When user clicks and edits ANY text on the quotation sheet directly
  const handleLiveQuotationChange = (updated: Quotation) => {
    if (updated.document_title !== undefined) setDocumentTitle(updated.document_title);
    if (updated.document_subtitle !== undefined) setDocumentSubtitle(updated.document_subtitle);
    if (updated.include_company_details !== undefined) setIncludeCompanyDetails(updated.include_company_details);
    if (updated.company_name !== undefined) setCompanyName(updated.company_name);
    if (updated.company_tagline !== undefined) setCompanyTagline(updated.company_tagline);
    if (updated.company_address !== undefined) setCompanyAddress(updated.company_address);
    if (updated.company_phone !== undefined) setCompanyPhone(updated.company_phone);
    if (updated.company_email !== undefined) setCompanyEmail(updated.company_email);
    if (updated.company_gstin !== undefined) setCompanyGstin(updated.company_gstin);

    if (updated.quotation_no !== undefined) setQuotationNo(updated.quotation_no);
    if (updated.date_issued !== undefined) setDateIssued(updated.date_issued);
    if (updated.expiry_date !== undefined) setExpiryDate(updated.expiry_date);

    if (updated.client_name !== undefined) setClientName(updated.client_name);
    if (updated.client_phone !== undefined) setClientPhone(updated.client_phone);
    if (updated.client_email !== undefined) setClientEmail(updated.client_email);
    if (updated.site_address !== undefined) setSiteAddress(updated.site_address);
    if (updated.plot_area_sqft !== undefined) setPlotArea(updated.plot_area_sqft);

    if (updated.contractor_name !== undefined) setContractorName(updated.contractor_name);
    if (updated.contractor_phone !== undefined) setContractorPhone(updated.contractor_phone);
    if (updated.contractor_trade !== undefined) setContractorTrade(updated.contractor_trade);
    if (updated.contractor_company !== undefined) setContractorCompany(updated.contractor_company);
    if (updated.contractor_email !== undefined) setContractorEmail(updated.contractor_email);

    if (updated.signatory_name !== undefined) setSignatoryName(updated.signatory_name);
    if (updated.line_items !== undefined) setLineItems(updated.line_items);
    if (updated.discount_type !== undefined) setDiscountType(updated.discount_type);
    if (updated.discount_value !== undefined) setDiscountValue(updated.discount_value);
    if (updated.enable_tax !== undefined) setEnableTax(updated.enable_tax);
    if (updated.tax_rate !== undefined) setTaxRate(updated.tax_rate);
    if (updated.notes !== undefined) setNotes(updated.notes);
  };

  // Save Company settings as default
  const handleSaveCompanyAsDefault = () => {
    if (!companyName.trim()) return;
    saveCompanyDetailsToStorage({
      name: companyName.trim(),
      tagline: companyTagline.trim(),
      address: companyAddress.trim(),
      phone: companyPhone.trim(),
      email: companyEmail.trim(),
      gstin: companyGstin.trim()
    });
    setSaveCompanySuccess(true);
    setTimeout(() => setSaveCompanySuccess(false), 2500);
  };

  // Handle line item modifications in form
  const handleLineItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };

      if (field === "include_material" || field === "include_labour") {
        const hasMat = field === "include_material" ? Boolean(value) : target.include_material;
        const hasLab = field === "include_labour" ? Boolean(value) : target.include_labour;
        const mRate = target.material_rate || 0;
        const lRate = target.labour_rate || 0;

        if (hasMat && hasLab && (mRate || lRate)) {
          target.rate = mRate + lRate;
        } else if (hasMat && mRate) {
          target.rate = mRate;
        } else if (hasLab && lRate) {
          target.rate = lRate;
        }
      }

      target.amount = Math.round((Number(target.quantity) || 0) * (Number(target.rate) || 0));
      updated[index] = target;
      return updated;
    });
  };

  const addCustomLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li_${Date.now()}_${prev.length + 1}`,
        description: "",
        unit: "sq.ft",
        quantity: 1,
        rate: 0,
        include_material: true,
        include_labour: true,
        material_rate: 0,
        labour_rate: 0,
        amount: 0
      }
    ]);
  };

  const addServiceFromMaster = (srv: QuotationService) => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li_${Date.now()}_${srv.id}`,
        service_id: srv.id,
        description: srv.name,
        unit: srv.unit,
        quantity: 100,
        rate: srv.combined_rate,
        include_material: true,
        include_labour: true,
        material_rate: srv.material_rate,
        labour_rate: srv.labour_rate,
        amount: srv.combined_rate * 100
      }
    ]);
    setShowServicePicker(false);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAction = (targetStatus: QuotationStatus) => {
    if (!clientName.trim()) {
      setErrorMessage("Please provide the Client Name.");
      return;
    }
    if (!quotationNo.trim()) {
      setErrorMessage("Please enter a valid Quotation Number.");
      return;
    }
    if (lineItems.length === 0) {
      setErrorMessage("Please add at least one line item to the quotation.");
      return;
    }

    setErrorMessage(null);
    const obj: Quotation = {
      ...liveQuotation,
      status: targetStatus
    };
    onSave(obj);
  };

  const handleDirectPrint = () => {
    const docTitle = liveQuotation.document_title || "Quotation";
    const clientSanitized = (liveQuotation.client_name || "Client").replace(/\s+/g, "_");
    triggerPrint(
      `${docTitle}_${liveQuotation.quotation_no}_${clientSanitized}`,
      "printable-quotation-sheet",
      { pageMargin: "10mm", paperSize: "A4 portrait" }
    );
  };

  // Filter services for modal
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    const q = serviceSearch.toLowerCase();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        s.unit.toLowerCase().includes(q)
    );
  }, [services, serviceSearch]);

  return (
    <div className="space-y-6 w-full mx-auto">
      {/* 1. TOP HEADER & VIEW MODE SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Back to List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-serif font-black tracking-wide text-white">
                {isEditing ? `Edit Quotation: ${quotationNo}` : "Create Quotation"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase">
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live interactive preview • Type in form or click on document text to edit
            </p>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "split"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Split View: Form and Live Preview side-by-side"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Split Live View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("sheet")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "sheet"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Interactive Document Sheet: Full-width WYSIWYG click-to-edit"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Interactive Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === "form"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Form View only"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Form Only</span>
            </button>
          </div>

          <button
            id="btn_print_live"
            onClick={handleDirectPrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Print or Save as PDF (A4)"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Print / PDF</span>
          </button>

          <button
            id="btn_save_draft"
            onClick={() => handleSaveAction("draft")}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition cursor-pointer"
          >
            Draft
          </button>

          <button
            id="btn_save_pending"
            onClick={() => handleSaveAction("pending")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Quotation</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. WORKSPACE CONTAINER (SPLIT OR SINGLE VIEW) */}
      <div
        className={`grid gap-6 items-start ${
          viewMode === "split" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"
        }`}
      >
        {/* === FORM PANEL (Hidden if viewMode === "sheet") === */}
        {viewMode !== "sheet" && (
          <div className="space-y-6">
            {/* CARD 1: OPTIONAL COMPANY DETAILS PROVISION */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                      Company / Firm Details
                      <span className="text-[10px] font-sans font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Optional
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Add your architectural firm or contractor business letterhead to this quotation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeCompanyDetails}
                      onChange={(e) => {
                        setIncludeCompanyDetails(e.target.checked);
                        if (e.target.checked) setShowCompanySection(true);
                      }}
                      className="w-4 h-4 text-amber-600 rounded bg-slate-950 border-slate-700"
                    />
                    <span className="font-semibold text-amber-300">Include on Letterhead</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowCompanySection(!showCompanySection)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {showCompanySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible company inputs */}
              {showCompanySection && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Company / Firm Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Skyline Architecture & Builders"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Design & Turnkey Construction Consultancy"
                        value={companyTagline}
                        onChange={(e) => setCompanyTagline(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Company Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. MG Road, Palakkad, Kerala - 678001"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Company Phone
                      </label>
                      <input
                        type="text"
                        placeholder="+91 98470 00000"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Company Email
                      </label>
                      <input
                        type="email"
                        placeholder="info@skylinebuilders.in"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        GSTIN / Tax ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="32AAAAA0000A1Z5"
                        value={companyGstin}
                        onChange={(e) => setCompanyGstin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="flex items-end justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSaveCompanyAsDefault}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                        title="Save these details as default for future quotations"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as Default Company</span>
                      </button>

                      {saveCompanySuccess && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Saved!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 2: CLIENT DETAILS & CONTRACTOR DETAILS (PROVISION NEAR CLIENT DETAILS) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-6 shadow-xl">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <h3 className="text-sm font-serif font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" /> Client & Contractor Specifications
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Contractor details placed near client details
                </span>
              </div>

              {/* Two Column Grid: Left = Client Details, Right = Contractor Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column A: Client & Site Details */}
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> Client & Site Information
                    </span>
                    <span className="text-[10px] text-rose-400">* Required</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Client Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Harikrishnan Nambiar"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Client Phone / Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98471 23456"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Client Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="client@gmail.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Site / Construction Address
                    </label>
                    <input
                      type="text"
                      placeholder="Plot 14, Haritha Valley, Palakkad"
                      value={siteAddress}
                      onChange={(e) => setSiteAddress(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Plot / Built-up Area (Sq.Ft)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2450 sq.ft"
                      value={plotArea}
                      onChange={(e) => setPlotArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Column B: Contractor Details (PROVISION NEAR CLIENT DETAILS) */}
                <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-amber-400" /> Contractor Details (Near Client)
                    </span>

                    {/* Quick selector from master list */}
                    {contractors.length > 0 && (
                      <select
                        onChange={(e) => {
                          const selected = contractors.find((c) => c.id === e.target.value);
                          if (selected) {
                            setContractorName(selected.name);
                            setContractorPhone(selected.phone);
                            setContractorTrade(selected.trade);
                            if (selected.company_name) setContractorCompany(selected.company_name);
                            if (selected.email) setContractorEmail(selected.email);
                            if (!assignedContractorIds.includes(selected.id)) {
                              setAssignedContractorIds((prev) => [...prev, selected.id]);
                            }
                          }
                        }}
                        className="bg-slate-900 border border-slate-700 text-amber-400 text-[10px] rounded-lg px-2 py-1 cursor-pointer"
                      >
                        <option value="">⚡ Autofill from Master...</option>
                        {contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.trade})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Contractor / Builder Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Santhosh Kumar / Lead Builder"
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Contractor Agency / Firm
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SK Civil Builders & Contractors"
                      value={contractorCompany}
                      onChange={(e) => setContractorCompany(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Trade / Specialty
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Civil Contractor / Masonry / Electrical"
                      value={contractorTrade}
                      onChange={(e) => setContractorTrade(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Contractor Phone / Mobile
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98472 34567"
                      value={contractorPhone}
                      onChange={(e) => setContractorPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Contractor Email (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="contractor@build.in"
                      value={contractorEmail}
                      onChange={(e) => setContractorEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quotation Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Quotation No.
                  </label>
                  <input
                    type="text"
                    value={quotationNo}
                    onChange={(e) => setQuotationNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Date Issued
                  </label>
                  <input
                    type="date"
                    value={dateIssued}
                    onChange={(e) => setDateIssued(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as QuotationStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer uppercase font-semibold"
                  >
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CARD 3: SERVICE LINE ITEMS TABLE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    Itemized Schedule of Quantities
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Toggle Mat/Lab checkboxes or select from master rate catalog
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowServicePicker(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Pick From Rate List
                  </button>

                  <button
                    type="button"
                    onClick={addCustomLineItem}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Row
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[220px]">Work Description & Specifications</th>
                      <th className="py-2.5 px-2 w-20">Unit</th>
                      <th className="py-2.5 px-2 w-20 text-right">Qty</th>
                      <th className="py-2.5 px-2 w-14 text-center">Mat</th>
                      <th className="py-2.5 px-2 w-14 text-center">Lab</th>
                      <th className="py-2.5 px-2 w-24 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {lineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/20 transition">
                        <td className="py-2 px-3 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Work description..."
                            value={item.description}
                            onChange={(e) => handleLineItemChange(idx, "description", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => handleLineItemChange(idx, "unit", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              handleLineItemChange(idx, "quantity", parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-right text-white focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.include_material}
                            onChange={(e) =>
                              handleLineItemChange(idx, "include_material", e.target.checked)
                            }
                            className="w-3.5 h-3.5 text-amber-600 rounded bg-slate-900 border-slate-700"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.include_labour}
                            onChange={(e) =>
                              handleLineItemChange(idx, "include_labour", e.target.checked)
                            }
                            className="w-3.5 h-3.5 text-amber-600 rounded bg-slate-900 border-slate-700"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={item.rate}
                            onChange={(e) =>
                              handleLineItemChange(idx, "rate", parseFloat(e.target.value) || 0)
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-right text-white focus:outline-none focus:border-amber-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">
                          {formatINR(item.amount)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            disabled={lineItems.length <= 1}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-30 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CARD 4: FINANCIAL TOTALS, DISCOUNT & TAX */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes & Scope clarifications */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Notes & Scope Specifications
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter scope clarifications, execution notes, inclusions, and exclusions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                  <div className="text-[10px] text-slate-500">
                    Amount in Words:{" "}
                    <span className="text-slate-300 font-medium italic">
                      {numberToWordsIndian(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Subtotals & Discounts */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                    <span>Gross Subtotal:</span>
                    <span className="font-mono font-bold text-white">{formatINR(subtotal)}</span>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800 text-rose-400">
                    <div className="flex items-center gap-2">
                      <span>Discount:</span>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-white"
                      >
                        <option value="amount">₹ Fixed</option>
                        <option value="percentage">% Pct</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-right font-mono text-rose-400"
                      />
                      <span className="font-mono font-bold">(-{formatINR(discountAmount)})</span>
                    </div>
                  </div>

                  {/* GST */}
                  <div className="flex items-center justify-between py-1 border-b border-slate-800 text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableTax}
                        onChange={(e) => setEnableTax(e.target.checked)}
                        className="w-3.5 h-3.5 text-amber-600 rounded bg-slate-950 border-slate-800"
                      />
                      <span>Apply GST Tax</span>
                      {enableTax && (
                        <select
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                          className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-amber-400 font-mono ml-1"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      )}
                    </label>

                    <span className="font-mono font-bold text-white">
                      {enableTax ? formatINR(taxAmount) : "₹0"}
                    </span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex justify-between py-2 border-t-2 border-slate-800 text-sm font-black text-white">
                    <span className="font-serif">Net Quotation Total:</span>
                    <span className="font-mono text-amber-400 text-base">
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 5: TERMS & CONDITIONS CHECKLIST */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  Select Standard Terms & Clauses
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedTermsIds.length} clauses included
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {termsClauses.map((t) => {
                  const isChecked = selectedTermsIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border transition cursor-pointer ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTermsIds((prev) => [...prev, t.id]);
                          } else {
                            setSelectedTermsIds((prev) => prev.filter((id) => id !== t.id));
                          }
                        }}
                        className="mt-0.5 w-3.5 h-3.5 text-amber-600 rounded bg-slate-900 border-slate-700"
                      />
                      <div className="leading-tight">
                        <span className="font-semibold block">{t.title}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-1">{t.text}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* === LIVE PREVIEW PANEL (Visible in "split" or "sheet" modes) === */}
        {viewMode !== "form" && (
          <div
            className={`space-y-4 ${
              viewMode === "split"
                ? "xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
                : "w-full max-w-4xl mx-auto"
            }`}
          >
            {/* Split view helper bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-amber-400">Live Preview</span>
                <span className="text-slate-400 hidden sm:inline">• Updates live while typing</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 hidden sm:inline">Zoom:</span>
                <select
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(parseInt(e.target.value, 10))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white font-mono cursor-pointer"
                >
                  <option value="100">100%</option>
                  <option value="90">90%</option>
                  <option value="85">85%</option>
                  <option value="75">75%</option>
                  <option value="65">65%</option>
                </select>

                <button
                  type="button"
                  onClick={handleDirectPrint}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  title="Print this sheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Render interactive sheet */}
            <div
              className="transition-transform origin-top flex justify-center"
              style={{
                transform: viewMode === "split" ? `scale(${zoomLevel / 100})` : "none",
                transformOrigin: "top center",
                marginBottom: viewMode === "split" ? `-${(100 - zoomLevel) * 9}px` : 0
              }}
            >
              <QuotationInteractiveSheet
                quotation={liveQuotation}
                contractors={contractors}
                termsClauses={termsClauses}
                isEditable={true}
                onChange={handleLiveQuotationChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Master Services Rate List Picker */}
      {showServicePicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-white">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Select Standard Construction Rate
                </h3>
                <p className="text-xs text-slate-400">
                  Pick any pre-configured Kerala schedule of rates to insert into the quotation
                </p>
              </div>
              <button
                onClick={() => setShowServicePicker(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <input
                type="text"
                placeholder="Search services by keyword, category, or unit (e.g. Masonry, Plaster, Tile)..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-800/60">
              {filteredServices.map((srv) => (
                <div
                  key={srv.id}
                  className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-slate-800/30 p-2 rounded-xl transition"
                >
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                      {srv.category} • {srv.unit}
                    </span>
                    <p className="text-xs font-semibold text-slate-100">{srv.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Mat: {formatINR(srv.material_rate)} | Lab: {formatINR(srv.labour_rate)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-amber-400 block mb-1">
                      {formatINR(srv.combined_rate)} / {srv.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => addServiceFromMaster(srv)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
