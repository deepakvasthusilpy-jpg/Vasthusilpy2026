import React, { useState } from "react";
import { PanchayathBillRecord, PanchayathFeeType } from "../../types";
import {
  loadPanchayathBills,
  savePanchayathBills,
  generatePanchayathWhatsAppMessage,
  shareViaWhatsApp
} from "../../utils/personalBillsStorage";
import {
  Landmark,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Printer,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  FileCheck,
  ShieldCheck,
  Receipt,
  MessageSquare
} from "lucide-react";

export const PanchayathBillsTab: React.FC = () => {
  const [bills, setBills] = useState<PanchayathBillRecord[]>(() => loadPanchayathBills());
  const [searchTerm, setSearchTerm] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState<string>("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<PanchayathBillRecord | null>(null);
  const [billToDelete, setBillToDelete] = useState<PanchayathBillRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<PanchayathBillRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<PanchayathBillRecord>>({
    panchayathName: "Keralassery Grama Panchayath (കേരളശ്ശേരി)",
    feeType: "TRADE_LICENCE_DNO",
    customFeeName: "D&O Trade Licence Renewal",
    assessmentOrLicenceNo: "LIC-KLSY-2026-01",
    financialYear: "2026-2027",
    wardNo: "08",
    doorOrPremiseNo: "KP-VIII/412A",
    feeAmount: 1200,
    serviceCess: 60,
    libraryCess: 0,
    penalty: 0,
    totalPayable: 1260,
    dueDate: "2026-03-31",
    paidAmount: 0,
    paidDate: "",
    status: "UNPAID",
    notes: ""
  });

  // Pay Modal State
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payChallanInput, setPayChallanInput] = useState<string>("");

  const handleUpdateBills = (newBills: PanchayathBillRecord[]) => {
    setBills(newBills);
    savePanchayathBills(newBills);
  };

  const getFeeTypeMalayalam = (ft: PanchayathFeeType) => {
    switch (ft) {
      case "TRADE_LICENCE_DNO":
        return "വ്യാപാര ലൈസൻസ് (D&O Trade Licence)";
      case "BUILDING_PROPERTY_TAX":
        return "കെട്ടിട നികുതി (Property Tax)";
      case "PROFESSIONAL_TAX":
        return "തൊഴിൽ നികുതി (Professional Tax)";
      case "SIGNAGE_FEE":
        return "പരസ്യ ബോർഡ് ഫീസ് (Signage Fee)";
      case "WASTE_MANAGEMENT":
        return "മാലിന്യ സംസ്കരണ ഫീസ് (Waste Management)";
      default:
        return "മറ്റ് പഞ്ചായത്ത് ഫീസ്";
    }
  };

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = Number(formData.feeAmount) || 0;
    const sCess = Number(formData.serviceCess) || 0;
    const lCess = Number(formData.libraryCess) || 0;
    const penalty = Number(formData.penalty) || 0;
    const total = fee + sCess + lCess + penalty;
    const paid = Number(formData.paidAmount) || 0;

    let status: "PAID" | "UNPAID" | "OVERDUE" = "UNPAID";
    if (paid >= total && total > 0) {
      status = "PAID";
    } else {
      const dueTime = new Date(formData.dueDate || "").getTime();
      if (dueTime && dueTime < Date.now() && paid < total) {
        status = "OVERDUE";
      }
    }

    const billToSave: PanchayathBillRecord = {
      id: editingBill ? editingBill.id : `PAN-${Date.now().toString().slice(-6)}`,
      panchayathName: formData.panchayathName || "Keralassery Grama Panchayath",
      feeType: formData.feeType || "TRADE_LICENCE_DNO",
      customFeeName: formData.customFeeName || getFeeTypeMalayalam(formData.feeType || "TRADE_LICENCE_DNO"),
      assessmentOrLicenceNo: formData.assessmentOrLicenceNo || "LIC-NO",
      financialYear: formData.financialYear || "2026-2027",
      wardNo: formData.wardNo || "08",
      doorOrPremiseNo: formData.doorOrPremiseNo || "412A",
      feeAmount: fee,
      serviceCess: sCess,
      libraryCess: lCess,
      penalty: penalty,
      totalPayable: total,
      dueDate: formData.dueDate || new Date().toISOString().split("T")[0],
      paidAmount: paid,
      paidDate: formData.paidDate || (paid >= total ? new Date().toISOString().split("T")[0] : ""),
      challanOrReceiptNo: formData.challanOrReceiptNo || "",
      status: status,
      ksmartRefNo: formData.ksmartRefNo || "",
      notes: formData.notes || ""
    };

    if (editingBill) {
      handleUpdateBills(bills.map((b) => (b.id === editingBill.id ? billToSave : b)));
    } else {
      handleUpdateBills([billToSave, ...bills]);
    }

    setIsAddModalOpen(false);
    setEditingBill(null);
  };

  const handleConfirmDelete = () => {
    if (!billToDelete) return;
    handleUpdateBills(bills.filter((b) => b.id !== billToDelete.id));
    setBillToDelete(null);
  };

  const handleConfirmPayment = () => {
    if (!payingBill) return;
    const paid = Number(payAmountInput) || payingBill.totalPayable;
    const updated = bills.map((b) => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          paidAmount: paid,
          paidDate: payDateInput,
          status: "PAID" as const,
          challanOrReceiptNo: payChallanInput || b.challanOrReceiptNo
        };
      }
      return b;
    });

    handleUpdateBills(updated);
    setIsPayModalOpen(false);
    setPayingBill(null);
  };

  // Filtered
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.panchayathName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customFeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.assessmentOrLicenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.financialYear.includes(searchTerm);

    const matchesType = feeTypeFilter === "ALL" || b.feeType === feeTypeFilter;

    return matchesSearch && matchesType;
  });

  // KPIs
  const totalPayable = bills.reduce((s, b) => s + b.totalPayable, 0);
  const totalPaid = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalDue = bills.filter((b) => b.status !== "PAID").reduce((s, b) => s + (b.totalPayable - b.paidAmount), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-teal-950/40 border border-amber-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-inner">
            <Landmark className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
                GRAMA PANCHAYATH & LOCAL BODY TAXES
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                K-SMART PORTAL INTEGRATED
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              പഞ്ചായത്ത് ഫീസുകൾ, ലൈസൻസുകൾ & നികുതികൾ
            </h2>
            <p className="text-xs md:text-sm text-purple-200/80 mt-0.5">
              D&O വ്യാപാര ലൈസൻസ്, കെട്ടിട നികുതി, തൊഴിൽ നികുതി & K-SMART ചലാൻ റെക്കോർഡുകൾ.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://smart.kerala.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-teal-300" />
            <span>K-SMART Portal (സ്മാർട്ട് കേരള)</span>
          </a>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>പ്രിന്റ് / PDF</span>
          </button>

          <button
            onClick={() => {
              setEditingBill(null);
              setFormData({
                panchayathName: "Keralassery Grama Panchayath (കേരളശ്ശേരി)",
                feeType: "TRADE_LICENCE_DNO",
                customFeeName: "D&O Trade Licence Renewal",
                assessmentOrLicenceNo: "LIC-KLSY-2026-01",
                financialYear: "2026-2027",
                wardNo: "08",
                doorOrPremiseNo: "KP-VIII/412A",
                feeAmount: 1200,
                serviceCess: 60,
                libraryCess: 0,
                penalty: 0,
                totalPayable: 1260,
                dueDate: "2026-03-31",
                paidAmount: 0,
                paidDate: "",
                status: "UNPAID",
                notes: ""
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ഫീസ് ചേർക്കുക (Add Fee/Tax)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e072b] to-[#2c0b3d] border border-amber-500/30 shadow-lg">
          <div className="text-xs text-amber-300 font-bold mb-1">ആകെ പഞ്ചായത്ത് ഫീസ് (TOTAL PAYABLE)</div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{totalPayable.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-200/70 mt-1 font-mono">{bills.length} നികുതി / ഫീസ് ഇനങ്ങൾ</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a2318] to-[#123827] border border-emerald-500/30 shadow-lg">
          <div className="text-xs text-emerald-300 font-bold mb-1">അടച്ചു തീർത്തത് (TOTAL PAID)</div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-200/70 mt-1">K-SMART / ചലാൻ വഴി നൽകിയത്</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2f0d1a] to-[#451025] border border-rose-500/30 shadow-lg">
          <div className="text-xs text-rose-300 font-bold mb-1">കുടിശ്ശിക നൽകാനുള്ളത് (DUE)</div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            ₹{totalDue.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-rose-200/70 mt-1">
            {totalDue === 0 ? "കുടിശ്ശികയില്ല ✓" : "അടയ്ക്കാനുള്ള പഞ്ചായത്ത് നികുതികൾ"}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
          <input
            type="text"
            placeholder="ലൈസൻസ് നമ്പർ / പഞ്ചായത്ത് തിരയുക..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/20 text-xs text-white placeholder:text-purple-200/50 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-purple-300" />
          <span className="text-xs text-purple-200 font-bold">ഇനം:</span>
          {(["ALL", "TRADE_LICENCE_DNO", "BUILDING_PROPERTY_TAX", "PROFESSIONAL_TAX"] as const).map((ft) => (
            <button
              key={ft}
              onClick={() => setFeeTypeFilter(ft)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                feeTypeFilter === ft
                  ? "bg-amber-400 text-black font-black"
                  : "bg-white/10 text-purple-200 hover:bg-white/20"
              }`}
            >
              {ft === "ALL"
                ? "എല്ലാം"
                : ft === "TRADE_LICENCE_DNO"
                ? "D&O ലൈസൻസ്"
                : ft === "BUILDING_PROPERTY_TAX"
                ? "കെട്ടിട നികുതി"
                : "തൊഴിൽ നികുതി"}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBills.map((bill) => {
          const isPaid = bill.status === "PAID";
          const isOverdue = bill.status === "OVERDUE";

          return (
            <div
              key={bill.id}
              className={`p-5 rounded-3xl border transition-all duration-300 backdrop-blur-xl shadow-xl space-y-4 ${
                isPaid
                  ? "bg-gradient-to-br from-[#0b1f18] to-[#122e23] border-emerald-500/40"
                  : isOverdue
                  ? "bg-gradient-to-br from-[#2b0c18] to-[#3d1222] border-rose-500/50"
                  : "bg-gradient-to-br from-[#1d1203] to-[#2b1b05] border-amber-500/40"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl ${isPaid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-white">{bill.customFeeName}</div>
                    <div className="text-xs text-purple-200/80">
                      {bill.panchayathName} • Ward: <b className="text-amber-300">{bill.wardNo}</b>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                      isPaid
                        ? "bg-emerald-400 text-slate-950"
                        : isOverdue
                        ? "bg-rose-500 text-white"
                        : "bg-amber-400 text-slate-950 animate-pulse"
                    }`}
                  >
                    {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {bill.status}
                  </span>
                  <div className="text-[10px] text-purple-200/60 mt-1 font-mono">FY: {bill.financialYear}</div>
                </div>
              </div>

              {/* Details Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60">ലൈസൻസ് / അസസ്സ്മെന്റ്</div>
                  <div className="text-xs font-bold text-cyan-300 truncate">{bill.assessmentOrLicenceNo}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60">ആകെ തുക</div>
                  <div className="text-sm font-black text-amber-300">₹{bill.totalPayable}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60">അവസാന തീയതി</div>
                  <div className="text-xs font-bold text-slate-200">{bill.dueDate}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-purple-200/60">ഡോർ നമ്പർ</div>
                  <div className="text-xs font-bold text-slate-300">{bill.doorOrPremiseNo}</div>
                </div>
              </div>

              {/* Footer / Challan info */}
              <div className="flex items-center justify-between text-[11px] border-t border-white/10 pt-2 font-mono text-purple-200/70">
                {bill.challanOrReceiptNo ? (
                  <span className="text-emerald-300 flex items-center gap-1 font-bold">
                    <Receipt className="w-3.5 h-3.5" />
                    Challan: {bill.challanOrReceiptNo} (Paid on {bill.paidDate})
                  </span>
                ) : (
                  <span>Fee: ₹{bill.feeAmount} + Cess: ₹{bill.serviceCess + bill.libraryCess}</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const text = generatePanchayathWhatsAppMessage(bill);
                      shareViaWhatsApp({ text });
                    }}
                    className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition cursor-pointer"
                    title="വാട്സാപ്പ് വഴി അയക്കുക (Share to WhatsApp)"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingBill(bill);
                      setFormData(bill);
                      setIsAddModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-yellow-300" />
                  </button>
                  <button
                    onClick={() => setBillToDelete(bill)}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!isPaid && (
                    <button
                      onClick={() => {
                        setPayingBill(bill);
                        setPayAmountInput(bill.totalPayable - bill.paidAmount);
                        setPayDateInput(new Date().toISOString().split("T")[0]);
                        setIsPayModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-md cursor-pointer"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>ചലാൻ അടച്ചതായി രേഖപ്പെടുത്തുക</span>
                    </button>
                  )}
                  {isPaid && (
                    <span className="text-xs font-mono text-emerald-300 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" />
                      അടച്ചു കഴിഞ്ഞു ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: ADD / EDIT PANCHAYATH BILL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingBill ? "പഞ്ചായത്ത് ഫീസ് വിവരങ്ങൾ തിരുത്തുക" : "പുതിയ പഞ്ചായത്ത് ഫീസ് / നികുതി"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ഫീസ് തരം (Fee Type) *
                  </label>
                  <select
                    value={formData.feeType}
                    onChange={(e) => {
                      const ft = e.target.value as PanchayathFeeType;
                      setFormData({
                        ...formData,
                        feeType: ft,
                        customFeeName: getFeeTypeMalayalam(ft)
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950 border border-white/20 text-white text-xs"
                  >
                    <option value="TRADE_LICENCE_DNO">D&O Trade Licence (വ്യാപാര ലൈസൻസ്)</option>
                    <option value="BUILDING_PROPERTY_TAX">Building Property Tax (കെട്ടിട നികുതി)</option>
                    <option value="PROFESSIONAL_TAX">Professional Tax (തൊഴിൽ നികുതി)</option>
                    <option value="SIGNAGE_FEE">Signage & Board Fee (പരസ്യ ബോർഡ് ഫീസ്)</option>
                    <option value="WASTE_MANAGEMENT">Waste Management Fee (മാലിന്യ സംസ്കരണ ഫീസ്)</option>
                    <option value="OTHER_PANCHAYATH_FEE">മറ്റ് ഫീസുകൾ (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ഫീസ് വിവരണം / പേര് *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customFeeName || ""}
                    onChange={(e) => setFormData({ ...formData, customFeeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    പഞ്ചായത്ത് പേര് *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.panchayathName || ""}
                    onChange={(e) => setFormData({ ...formData, panchayathName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    സാമ്പത്തിക വർഷം (FY) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-2027"
                    value={formData.financialYear || ""}
                    onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ലൈസൻസ് / അസസ്സ്മെന്റ് നമ്പർ
                  </label>
                  <input
                    type="text"
                    value={formData.assessmentOrLicenceNo || ""}
                    onChange={(e) => setFormData({ ...formData, assessmentOrLicenceNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    വാർഡ് നമ്പർ
                  </label>
                  <input
                    type="text"
                    value={formData.wardNo || ""}
                    onChange={(e) => setFormData({ ...formData, wardNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ഡോർ / കെട്ടിട നമ്പർ
                  </label>
                  <input
                    type="text"
                    value={formData.doorOrPremiseNo || ""}
                    onChange={(e) => setFormData({ ...formData, doorOrPremiseNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    ഫീസ് തുക (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.feeAmount ?? 1200}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const total = val + (formData.serviceCess || 0) + (formData.libraryCess || 0) + (formData.penalty || 0);
                      setFormData({ ...formData, feeAmount: val, totalPayable: total });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 text-amber-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    സർവീസ് സെസ്സ് (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.serviceCess ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const total = (formData.feeAmount || 0) + val + (formData.libraryCess || 0) + (formData.penalty || 0);
                      setFormData({ ...formData, serviceCess: val, totalPayable: total });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ലൈബ്രറി സെസ്സ് (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.libraryCess ?? 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const total = (formData.feeAmount || 0) + (formData.serviceCess || 0) + val + (formData.penalty || 0);
                      setFormData({ ...formData, libraryCess: val, totalPayable: total });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-200">ആകെ നൽകേണ്ടത് (Net Payable ₹):</span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  ₹{(formData.feeAmount || 0) + (formData.serviceCess || 0) + (formData.libraryCess || 0) + (formData.penalty || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rose-300 mb-1">
                    അവസാന തീയതി (Due Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate || ""}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-rose-400/40 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    K-SMART റഫറൻസ് നമ്പർ
                  </label>
                  <input
                    type="text"
                    value={formData.ksmartRefNo || ""}
                    onChange={(e) => setFormData({ ...formData, ksmartRefNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg"
                >
                  {editingBill ? "സേവ് ചെയ്യുക" : "ഫീസ് ചേർക്കുക"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAY CHALLAN */}
      {isPayModalOpen && payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#170626] border border-emerald-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">ചലാൻ അടവ് രേഖപ്പെടുത്തുക</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  അടച്ച തുക (₹)
                </label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono font-black text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  അടച്ച തീയതി
                </label>
                <input
                  type="date"
                  value={payDateInput}
                  onChange={(e) => setPayDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  ചലാൻ / K-SMART രസീത് നമ്പർ *
                </label>
                <input
                  type="text"
                  placeholder="e.g. KSMART-DNO-2026-7819"
                  value={payChallanInput}
                  onChange={(e) => setPayChallanInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition"
                >
                  സ്ഥിരീകരിക്കുക ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">പഞ്ചായത്ത് ഫീസ് / ലൈസൻസ് റെക്കോർഡ് നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Panchayath Fee / Licence</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 font-mono">
              <div><span className="text-slate-400">ഇനം:</span> <strong className="text-white font-sans">{billToDelete.customFeeName}</strong></div>
              <div><span className="text-slate-400">നമ്പർ / ലൈസൻസ്:</span> <span className="text-amber-300 font-bold">{billToDelete.assessmentOrLicenceNo}</span></div>
              <div><span className="text-slate-400">തുക:</span> <span className="text-emerald-300 font-bold">₹{billToDelete.totalPayable}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ പഞ്ചായത്ത് ഫീസ് / ലൈസൻസ് റെക്കോർഡ് ശാശ്വതമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBillToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ഡിലീറ്റ് ചെയ്യുക (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
