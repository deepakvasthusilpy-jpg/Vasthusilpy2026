import React, { useState } from "react";
import { Quotation, QuotationLineItem, Contractor, TermsClause } from "../../types";
import { formatINR } from "../../utils/quotationStorageManager";
import { numberToWordsIndian } from "../../utils/numberToWords";
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  HardHat,
  Trash2,
  Plus,
  ShieldCheck,
  Edit2,
  Check,
  Percent,
  Calculator
} from "lucide-react";

interface QuotationInteractiveSheetProps {
  quotation: Quotation;
  contractors?: Contractor[];
  termsClauses?: TermsClause[];
  isEditable?: boolean;
  onChange?: (updated: Quotation) => void;
  onAddNewContractor?: () => void;
}

export const QuotationInteractiveSheet: React.FC<QuotationInteractiveSheetProps> = ({
  quotation,
  termsClauses = [],
  isEditable = true,
  onChange
}) => {
  // Local helper to update a field in quotation
  const updateField = <K extends keyof Quotation>(field: K, value: Quotation[K]) => {
    if (!onChange) return;
    const updated = { ...quotation, [field]: value };
    recalcAndNotify(updated);
  };

  // Recalculate totals whenever items, discounts or taxes change
  const recalcAndNotify = (curr: Quotation) => {
    let sub = 0;
    let matSub = 0;
    let labSub = 0;

    curr.line_items.forEach((item) => {
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
    if (curr.discount_type === "percentage") {
      disc = (sub * (Number(curr.discount_value) || 0)) / 100;
    } else {
      disc = Number(curr.discount_value) || 0;
    }
    disc = Math.min(disc, sub);
    const afterDiscount = Math.max(sub - disc, 0);

    let tax = 0;
    if (curr.enable_tax) {
      tax = (afterDiscount * (Number(curr.tax_rate) || 0)) / 100;
    }

    const total = Math.round(afterDiscount + tax);

    const fullUpdated: Quotation = {
      ...curr,
      subtotal: Math.round(sub),
      material_subtotal: Math.round(matSub),
      labour_subtotal: Math.round(labSub),
      discount_amount: Math.round(disc),
      tax_amount: Math.round(tax),
      total
    };

    if (onChange) {
      onChange(fullUpdated);
    }
  };

  // Update a line item directly
  const updateLineItem = (index: number, field: keyof QuotationLineItem, value: any) => {
    if (!onChange) return;
    const updatedItems = [...quotation.line_items];
    const target = { ...updatedItems[index], [field]: value };

    // Auto-update rate if Mat/Lab toggled and rates present
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

    const qty = Number(target.quantity) || 0;
    const r = Number(target.rate) || 0;
    target.amount = Math.round(qty * r);

    updatedItems[index] = target;
    const updatedQuotation = { ...quotation, line_items: updatedItems };
    recalcAndNotify(updatedQuotation);
  };

  // Add a new row to table
  const addRow = () => {
    if (!onChange) return;
    const newItem: QuotationLineItem = {
      id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      description: "New work item / specification",
      unit: "sq.ft",
      quantity: 1,
      rate: 100,
      include_material: true,
      include_labour: true,
      amount: 100
    };
    const updatedQuotation = {
      ...quotation,
      line_items: [...quotation.line_items, newItem]
    };
    recalcAndNotify(updatedQuotation);
  };

  // Remove row
  const removeRow = (index: number) => {
    if (!onChange) return;
    if (quotation.line_items.length <= 1) return;
    const updatedItems = quotation.line_items.filter((_, i) => i !== index);
    const updatedQuotation = { ...quotation, line_items: updatedItems };
    recalcAndNotify(updatedQuotation);
  };

  // Selected terms
  const selectedTerms = termsClauses
    .filter((t) => quotation.terms_clause_ids?.includes(t.id))
    .sort((a, b) => a.order - b.order);

  const hasCompany = !!(quotation.include_company_details && quotation.company_name);

  return (
    <div
      id="printable-quotation-sheet"
      className="w-full max-w-4xl mx-auto bg-white text-slate-900 shadow-2xl rounded-2xl p-6 sm:p-10 md:p-12 relative border border-slate-200 print:border-none print:shadow-none print:m-0 print:p-6 print:rounded-none print:w-full print:max-w-none transition-all"
      style={{ minHeight: "297mm" }}
    >
      {/* 1. ARCHITECTURAL LETTERHEAD HEADER */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Company Details (Optional) or Clean Document Header */}
          <div className="flex-1">
            {hasCompany ? (
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-500 flex items-center justify-center font-serif text-2xl font-black border border-amber-600/50 shrink-0">
                    {quotation.company_name?.charAt(0) || "C"}
                  </div>
                  <div className="flex-1">
                    {isEditable ? (
                      <input
                        type="text"
                        value={quotation.company_name || ""}
                        onChange={(e) => updateField("company_name", e.target.value)}
                        placeholder="Company / Firm Name"
                        className="text-2xl md:text-3xl font-serif font-black tracking-wider text-slate-950 uppercase w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                        title="Click to edit company name"
                      />
                    ) : (
                      <h1 className="text-2xl md:text-3xl font-serif font-black tracking-wider text-slate-950 uppercase">
                        {quotation.company_name}
                      </h1>
                    )}

                    {isEditable ? (
                      <input
                        type="text"
                        value={quotation.company_tagline || ""}
                        onChange={(e) => updateField("company_tagline", e.target.value)}
                        placeholder="Company Tagline / Specialty"
                        className="text-xs font-serif tracking-widest text-amber-700 uppercase font-bold w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1"
                        title="Click to edit tagline"
                      />
                    ) : (
                      quotation.company_tagline && (
                        <p className="text-xs font-serif tracking-widest text-amber-700 uppercase font-bold">
                          {quotation.company_tagline}
                        </p>
                      )
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {(quotation.company_address || isEditable) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                      {isEditable ? (
                        <input
                          type="text"
                          value={quotation.company_address || ""}
                          onChange={(e) => updateField("company_address", e.target.value)}
                          placeholder="Company Address"
                          className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-[11px]"
                          title="Click to edit address"
                        />
                      ) : (
                        <span>{quotation.company_address}</span>
                      )}
                    </span>
                  )}

                  {(quotation.company_phone || isEditable) && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-amber-600 shrink-0" />
                      {isEditable ? (
                        <input
                          type="text"
                          value={quotation.company_phone || ""}
                          onChange={(e) => updateField("company_phone", e.target.value)}
                          placeholder="Phone / Mobile"
                          className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-[11px]"
                          title="Click to edit phone"
                        />
                      ) : (
                        <span>{quotation.company_phone}</span>
                      )}
                    </span>
                  )}

                  {(quotation.company_email || isEditable) && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-amber-600 shrink-0" />
                      {isEditable ? (
                        <input
                          type="text"
                          value={quotation.company_email || ""}
                          onChange={(e) => updateField("company_email", e.target.value)}
                          placeholder="Email"
                          className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-[11px]"
                          title="Click to edit email"
                        />
                      ) : (
                        <span>{quotation.company_email}</span>
                      )}
                    </span>
                  )}

                  {quotation.company_gstin && (
                    <span className="font-mono text-[10px] text-slate-500">
                      GSTIN: {quotation.company_gstin}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Clean Modern Neutral Header without hardcoded Vasthusilpy details */
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-mono font-bold text-lg border border-slate-700">
                    <Building2 className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    {isEditable ? (
                      <input
                        type="text"
                        value={quotation.document_title || "CONSTRUCTION QUOTATION & ESTIMATE"}
                        onChange={(e) => updateField("document_title", e.target.value)}
                        placeholder="Document Title"
                        className="text-xl md:text-2xl font-serif font-black tracking-wider text-slate-950 uppercase bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1"
                        title="Click to edit document title"
                      />
                    ) : (
                      <h1 className="text-xl md:text-2xl font-serif font-black tracking-wider text-slate-950 uppercase">
                        {quotation.document_title || "CONSTRUCTION QUOTATION & ESTIMATE"}
                      </h1>
                    )}
                    {isEditable ? (
                      <input
                        type="text"
                        value={
                          quotation.document_subtitle ||
                          "Itemized Bill of Quantities & Detailed Scope Specifications"
                        }
                        onChange={(e) => updateField("document_subtitle", e.target.value)}
                        placeholder="Document Subtitle"
                        className="text-xs text-slate-500 block w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1"
                        title="Click to edit subtitle"
                      />
                    ) : (
                      <p className="text-xs text-slate-500 font-sans mt-0.5">
                        {quotation.document_subtitle ||
                          "Itemized Bill of Quantities & Detailed Scope Specifications"}
                      </p>
                    )}
                  </div>
                </div>

                {isEditable && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => updateField("include_company_details", true)}
                      className="text-[10px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Company / Firm Details Header (Optional)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Quotation Metadata */}
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 shrink-0">
            <div className="inline-block bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-right mb-1.5 shadow-sm">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">
                Sheet No
              </span>
              {isEditable ? (
                <input
                  type="text"
                  value={quotation.quotation_no}
                  onChange={(e) => updateField("quotation_no", e.target.value)}
                  className="text-sm font-mono font-black text-slate-900 tracking-wider bg-transparent text-right border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 w-28"
                  title="Click to edit quotation number"
                />
              ) : (
                <span className="text-sm font-mono font-black text-slate-900 tracking-wider">
                  {quotation.quotation_no}
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-600 flex items-center justify-start sm:justify-end gap-1">
              <span className="font-semibold text-slate-800">Date:</span>
              {isEditable ? (
                <input
                  type="date"
                  value={quotation.date_issued}
                  onChange={(e) => updateField("date_issued", e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none text-[11px] font-mono px-1"
                  title="Click to edit date"
                />
              ) : (
                <span className="font-mono">{quotation.date_issued}</span>
              )}
            </p>

            <p className="text-[11px] text-slate-600 flex items-center justify-start sm:justify-end gap-1">
              <span className="font-semibold text-slate-800">Valid Until:</span>
              {isEditable ? (
                <input
                  type="date"
                  value={quotation.expiry_date}
                  onChange={(e) => updateField("expiry_date", e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none text-[11px] font-mono px-1"
                  title="Click to edit validity"
                />
              ) : (
                <span className="font-mono">{quotation.expiry_date}</span>
              )}
            </p>

            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  quotation.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : quotation.status === "draft"
                    ? "bg-slate-100 text-slate-700 border border-slate-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {quotation.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CLIENT DETAILS & CONTRACTOR DETAILS (SIDE BY SIDE / NEAR EACH OTHER) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 mb-6 text-xs bg-slate-50/50">
        {/* Column 1: Client & Project Details */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-600" /> Client Details
            </span>
            {isEditable && (
              <span className="text-[9px] text-amber-600 font-mono italic">Click text to edit</span>
            )}
          </div>

          <div className="pt-0.5">
            {isEditable ? (
              <input
                type="text"
                value={quotation.client_name}
                onChange={(e) => updateField("client_name", e.target.value)}
                placeholder="Client Name *"
                className="text-sm font-serif font-black text-slate-950 w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                title="Click to edit client name"
              />
            ) : (
              <p className="text-sm font-serif font-black text-slate-950">{quotation.client_name}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            {isEditable ? (
              <input
                type="text"
                value={quotation.client_phone}
                onChange={(e) => updateField("client_phone", e.target.value)}
                placeholder="Client Phone Number"
                className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full text-xs"
                title="Click to edit client phone"
              />
            ) : (
              <span>{quotation.client_phone || "—"}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            {isEditable ? (
              <input
                type="email"
                value={quotation.client_email || ""}
                onChange={(e) => updateField("client_email", e.target.value)}
                placeholder="Client Email (Optional)"
                className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full text-xs"
                title="Click to edit client email"
              />
            ) : (
              <span>{quotation.client_email || "—"}</span>
            )}
          </div>

          <div className="pt-1 border-t border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Site / Project Location
            </span>
            {isEditable ? (
              <textarea
                rows={2}
                value={quotation.site_address}
                onChange={(e) => updateField("site_address", e.target.value)}
                placeholder="Site Address / Location"
                className="w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-xs text-slate-800 leading-snug resize-none"
                title="Click to edit site address"
              />
            ) : (
              <p className="font-medium text-slate-800 leading-relaxed">{quotation.site_address}</p>
            )}

            <div className="flex items-center gap-2 mt-1 text-slate-600">
              <span className="font-semibold text-slate-700">Plot / Built-up Area:</span>
              {isEditable ? (
                <input
                  type="text"
                  value={quotation.plot_area_sqft || ""}
                  onChange={(e) => updateField("plot_area_sqft", e.target.value)}
                  placeholder="e.g. 2400 sq.ft"
                  className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 text-xs w-32 font-mono"
                  title="Click to edit plot area"
                />
              ) : (
                <span className="font-mono">{quotation.plot_area_sqft || "—"}</span>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Contractor Details (PROVISION NEAR CLIENT DETAILS) */}
        <div className="space-y-1.5 md:border-l md:border-slate-200 md:pl-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
              <HardHat className="w-3 h-3 text-amber-700" /> Contractor / Builder Details
            </span>
            {isEditable && (
              <span className="text-[9px] text-amber-600 font-mono">Near Client Details</span>
            )}
          </div>

          <div className="pt-0.5">
            {isEditable ? (
              <input
                type="text"
                value={quotation.contractor_name || ""}
                onChange={(e) => updateField("contractor_name", e.target.value)}
                placeholder="Contractor / Builder Name"
                className="text-sm font-serif font-black text-slate-950 w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5"
                title="Click to edit contractor name"
              />
            ) : (
              <p className="text-sm font-serif font-black text-slate-950">
                {quotation.contractor_name || "Contractor Details Not Specified"}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            {isEditable ? (
              <input
                type="text"
                value={quotation.contractor_company || ""}
                onChange={(e) => updateField("contractor_company", e.target.value)}
                placeholder="Contractor Agency / Firm"
                className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full text-xs"
                title="Click to edit contractor firm"
              />
            ) : (
              <span>{quotation.contractor_company || "Civil Works Specialist"}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <HardHat className="w-3 h-3 text-slate-400 shrink-0" />
            {isEditable ? (
              <input
                type="text"
                value={quotation.contractor_trade || ""}
                onChange={(e) => updateField("contractor_trade", e.target.value)}
                placeholder="Trade / Role (e.g. Civil Contractor)"
                className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full text-xs"
                title="Click to edit contractor trade"
              />
            ) : (
              <span>{quotation.contractor_trade || "General Construction"}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            {isEditable ? (
              <input
                type="text"
                value={quotation.contractor_phone || ""}
                onChange={(e) => updateField("contractor_phone", e.target.value)}
                placeholder="Contractor Phone / Mobile"
                className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full text-xs"
                title="Click to edit contractor phone"
              />
            ) : (
              <span>{quotation.contractor_phone || "—"}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            {isEditable ? (
              <input
                type="email"
                value={quotation.contractor_email || ""}
                onChange={(e) => updateField("contractor_email", e.target.value)}
                placeholder="Contractor Email (Optional)"
                className="bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 w-full text-xs"
                title="Click to edit contractor email"
              />
            ) : (
              <span>{quotation.contractor_email || "—"}</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. WORK ITEMS & QUANTITIES TABLE (LIVE CLICK-TO-EDIT ON ANY CELL) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-600" />
            Itemized Schedule of Quantities & Rates
          </h3>
          {isEditable && (
            <span className="text-[10px] text-amber-700 font-mono font-medium">
              Click any description, quantity, or rate to edit directly
            </span>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-300 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-serif">
                <th className="p-2.5 text-center border-r border-slate-300 w-10 font-bold">#</th>
                <th className="p-2.5 border-r border-slate-300 font-bold min-w-[200px]">
                  Work Description & Scope
                </th>
                <th className="p-2.5 text-center border-r border-slate-300 w-16 font-bold">Unit</th>
                <th className="p-2.5 text-right border-r border-slate-300 w-20 font-bold">Qty</th>
                <th className="p-2.5 text-right border-r border-slate-300 w-24 font-bold">Rate (₹)</th>
                <th className="p-2.5 text-right w-28 font-bold">Amount (₹)</th>
                {isEditable && <th className="p-2.5 w-10 text-center print:hidden"></th>}
              </tr>
            </thead>
            <tbody>
              {quotation.line_items.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="border-b border-slate-200 hover:bg-amber-50/20 transition group"
                >
                  <td className="p-2.5 text-center border-r border-slate-300 font-mono text-slate-500">
                    {idx + 1}
                  </td>

                  {/* Description cell */}
                  <td className="p-2 border-r border-slate-300 text-slate-900 font-medium">
                    {isEditable ? (
                      <div>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                          placeholder="Work description..."
                          className="w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-xs text-slate-900 font-medium"
                        />
                        <div className="flex items-center gap-2 mt-0.5 print:hidden">
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.include_material}
                              onChange={(e) => updateLineItem(idx, "include_material", e.target.checked)}
                              className="w-3 h-3 text-amber-600 rounded"
                            />
                            <span>Mat</span>
                          </label>
                          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.include_labour}
                              onChange={(e) => updateLineItem(idx, "include_labour", e.target.checked)}
                              className="w-3 h-3 text-amber-600 rounded"
                            />
                            <span>Lab</span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>{item.description}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          {item.include_material && (
                            <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded border border-blue-200">
                              Mat
                            </span>
                          )}
                          {item.include_labour && (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200">
                              Lab
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Unit cell */}
                  <td className="p-2 text-center border-r border-slate-300 font-mono text-slate-700 uppercase">
                    {isEditable ? (
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateLineItem(idx, "unit", e.target.value)}
                        className="w-full text-center bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-xs font-mono uppercase"
                      />
                    ) : (
                      item.unit
                    )}
                  </td>

                  {/* Quantity cell */}
                  <td className="p-2 text-right border-r border-slate-300 font-mono text-slate-900 font-semibold">
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(idx, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-xs font-mono font-semibold"
                      />
                    ) : (
                      item.quantity
                    )}
                  </td>

                  {/* Rate cell */}
                  <td className="p-2 text-right border-r border-slate-300 font-mono text-slate-800">
                    {isEditable ? (
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) =>
                          updateLineItem(idx, "rate", parseFloat(e.target.value) || 0)
                        }
                        className="w-full text-right bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1 py-0.5 text-xs font-mono"
                      />
                    ) : (
                      formatINR(item.rate)
                    )}
                  </td>

                  {/* Amount cell */}
                  <td className="p-2 text-right font-mono font-bold text-slate-950">
                    {formatINR((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                  </td>

                  {/* Row delete action */}
                  {isEditable && (
                    <td className="p-2 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        disabled={quotation.line_items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition disabled:opacity-30 cursor-pointer"
                        title="Delete this row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button (In-document) */}
        {isEditable && (
          <div className="mt-2 flex justify-start print:hidden">
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Item Row Directly</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. TOTALS, DISCOUNT, TAX, AND WORDS IN INR */}
      <div className="border border-slate-300 rounded-xl p-4 mb-6 bg-slate-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: In Words */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Amount in Words (Indian Rupees)
            </span>
            <p className="text-xs font-serif font-black text-slate-900 italic leading-snug">
              {numberToWordsIndian(quotation.total)}
            </p>

            {/* Subtotals breakdown */}
            {(quotation.material_subtotal > 0 || quotation.labour_subtotal > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-6 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Material Subtotal</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatINR(quotation.material_subtotal)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase">Labour Subtotal</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatINR(quotation.labour_subtotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Calculations breakdown */}
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Gross Subtotal:</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(quotation.subtotal)}</span>
            </div>

            {/* Discount row */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200 text-rose-700">
              <span className="flex items-center gap-1">
                <span>Discount:</span>
                {isEditable && (
                  <select
                    value={quotation.discount_type}
                    onChange={(e) => updateField("discount_type", e.target.value as any)}
                    className="bg-transparent border border-slate-300 rounded text-[10px] px-1 py-0.5 print:hidden"
                  >
                    <option value="amount">₹ (Fixed)</option>
                    <option value="percentage">% (Pct)</option>
                  </select>
                )}
              </span>

              <div className="flex items-center gap-1">
                {isEditable ? (
                  <input
                    type="number"
                    min="0"
                    value={quotation.discount_value || 0}
                    onChange={(e) =>
                      updateField("discount_value", parseFloat(e.target.value) || 0)
                    }
                    className="w-20 text-right bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none font-mono text-rose-700 text-xs px-1"
                    title="Click to edit discount"
                  />
                ) : (
                  <span className="font-mono font-bold">
                    -{formatINR(quotation.discount_amount || 0)}
                  </span>
                )}
                {isEditable && (
                  <span className="font-mono font-bold">
                    (-{formatINR(quotation.discount_amount || 0)})
                  </span>
                )}
              </div>
            </div>

            {/* GST Tax Row */}
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                {isEditable ? (
                  <label className="flex items-center gap-1 cursor-pointer print:hidden">
                    <input
                      type="checkbox"
                      checked={quotation.enable_tax}
                      onChange={(e) => updateField("enable_tax", e.target.checked)}
                      className="w-3 h-3 text-amber-600 rounded"
                    />
                    <span>GST</span>
                  </label>
                ) : (
                  <span>Applicable GST:</span>
                )}
                {quotation.enable_tax && isEditable && (
                  <select
                    value={quotation.tax_rate}
                    onChange={(e) => updateField("tax_rate", parseFloat(e.target.value) || 0)}
                    className="bg-transparent border border-slate-300 rounded text-[10px] px-1 py-0.5 font-mono print:hidden"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                )}
                {quotation.enable_tax && !isEditable && (
                  <span>({quotation.tax_rate}%)</span>
                )}
              </span>

              <span className="font-mono font-bold text-slate-900">
                {quotation.enable_tax ? formatINR(quotation.tax_amount) : "₹0"}
              </span>
            </div>

            {/* Net Total */}
            <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm md:text-base font-black text-slate-950">
              <span className="font-serif">Net Quotation Total:</span>
              <span className="font-mono text-amber-700 text-base md:text-lg">
                {formatINR(quotation.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. NOTES & CLARIFICATIONS (CLICK TO EDIT) */}
      <div className="mb-6 p-3.5 bg-amber-50/40 border border-amber-200/80 rounded-xl text-xs text-slate-800">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold uppercase tracking-wider text-amber-900 block text-[10px]">
            Notes & Scope Specifications
          </span>
          {isEditable && (
            <span className="text-[9px] text-amber-700 font-mono italic">Click to edit notes</span>
          )}
        </div>
        {isEditable ? (
          <textarea
            rows={2}
            value={quotation.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Enter scope clarifications, execution notes, inclusions, and exclusions..."
            className="w-full bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none text-xs text-slate-800 leading-relaxed resize-none p-1"
          />
        ) : (
          <p className="whitespace-pre-line leading-relaxed">{quotation.notes}</p>
        )}
      </div>

      {/* 6. GENERAL TERMS & CONDITIONS */}
      {selectedTerms.length > 0 && (
        <div className="mb-8 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 mb-2">
            General Terms & Conditions of Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[10px] text-slate-600 leading-relaxed">
            {selectedTerms.map((t, idx) => (
              <div key={t.id} className="flex items-start gap-1.5">
                <span className="font-mono font-bold text-slate-900 shrink-0">{idx + 1}.</span>
                <div>
                  <span className="font-semibold text-slate-800">{t.title}: </span>
                  <span>{t.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. SIGNATURES & SIGNATORY BLOCK */}
      <div className="pt-6 border-t-2 border-slate-900 mt-6">
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="h-14 flex items-end justify-center mb-1">
              <div className="w-32 border-b border-dashed border-slate-400"></div>
            </div>
            <p className="font-serif font-bold text-slate-900 text-sm">Client Signature & Acceptance</p>
            <p className="text-[10px] text-slate-500">
              I accept the rates, specifications, and terms of work
            </p>
          </div>

          <div>
            <div className="h-14 flex items-end justify-center mb-1">
              {isEditable ? (
                <input
                  type="text"
                  value={
                    quotation.signatory_name ||
                    quotation.contractor_name ||
                    quotation.company_name ||
                    "Authorized Signatory"
                  }
                  onChange={(e) => updateField("signatory_name", e.target.value)}
                  className="text-center font-serif text-xs text-amber-800 font-bold bg-transparent border-b border-transparent hover:border-amber-400 focus:border-amber-500 focus:outline-none px-1"
                  title="Click to edit signatory name"
                />
              ) : (
                <div className="text-center font-serif text-xs text-amber-800 font-bold">
                  {quotation.signatory_name ||
                    quotation.contractor_name ||
                    quotation.company_name ||
                    "Authorized Signatory"}
                </div>
              )}
            </div>
            <p className="font-serif font-bold text-slate-900 text-sm">Authorized Signatory</p>
            <p className="text-[10px] text-slate-500">
              {quotation.company_name || quotation.contractor_company || "Contractor / Architect"}
            </p>
          </div>
        </div>
      </div>

      {/* 8. FOOTER NOTE */}
      <div className="mt-8 text-center text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-3">
        Page 1 of 1 • Official Architectural & Construction Quotation Sheet
        {quotation.company_name ? ` • ${quotation.company_name}` : ""}
      </div>
    </div>
  );
};
