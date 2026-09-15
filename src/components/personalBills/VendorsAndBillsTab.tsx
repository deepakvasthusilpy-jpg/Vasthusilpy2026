import React, { useState } from "react";
import { PersonalVendor, PersonalVendorBill, PersonalVendorCategory } from "../../types";
import {
  loadPersonalVendors,
  savePersonalVendors,
  loadPersonalVendorBills,
  savePersonalVendorBills,
  generateUpiQrUrl,
  generateUpiUri,
  generateVendorBillWhatsAppMessage,
  generateVendorContactWhatsAppMessage,
  shareViaWhatsApp
} from "../../utils/personalBillsStorage";
import {
  Users,
  Receipt,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  QrCode,
  Printer,
  Phone,
  MapPin,
  IndianRupee,
  Search,
  Filter,
  FileSpreadsheet,
  Send,
  Building,
  CreditCard,
  Copy,
  Check,
  FileText,
  MessageSquare
} from "lucide-react";
import { CreateCustomBillModal } from "./CreateCustomBillModal";

export const VendorsAndBillsTab: React.FC = () => {
  const [vendors, setVendors] = useState<PersonalVendor[]>(() => loadPersonalVendors());
  const [bills, setBills] = useState<PersonalVendorBill[]>(() => loadPersonalVendorBills());

  // View state: 'BILLS' or 'VENDORS'
  const [activeSubView, setActiveSubView] = useState<"BILLS" | "VENDORS">("BILLS");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<PersonalVendor | null>(null);
  const [vendorToDelete, setVendorToDelete] = useState<PersonalVendor | null>(null);
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [isCreateCustomBillModalOpen, setIsCreateCustomBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<PersonalVendorBill | null>(null);
  const [billToDelete, setBillToDelete] = useState<PersonalVendorBill | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<PersonalVendorBill | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrData, setActiveQrData] = useState<{ upi: string; name: string; amount: number; note: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Vendor Form
  const [vendorForm, setVendorForm] = useState<Partial<PersonalVendor>>({
    vendorName: "",
    businessOrShopName: "",
    category: "GENERAL",
    mobileNumber: "",
    alternateMobile: "",
    address: "",
    upiId: "",
    gpayNumber: "",
    notes: ""
  });

  // Bill Form
  const [billForm, setBillForm] = useState<Partial<PersonalVendorBill>>({
    vendorId: "",
    vendorName: "",
    billNumber: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    serviceOrParticulars: "",
    billAmount: 0,
    paidAmount: 0,
    paidDate: "",
    status: "PENDING",
    paymentMode: "GPay (UPI)",
    notes: ""
  });

  // Quick Pay Form
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payModeInput, setPayModeInput] = useState<string>("GPay (UPI)");
  const [payRefInput, setPayRefInput] = useState<string>("");

  const handleUpdateVendors = (newVendors: PersonalVendor[]) => {
    setVendors(newVendors);
    savePersonalVendors(newVendors);
  };

  const handleUpdateBills = (newBills: PersonalVendorBill[]) => {
    setBills(newBills);
    savePersonalVendorBills(newBills);
  };

  // Vendor CRUD
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    const vendorToSave: PersonalVendor = {
      id: editingVendor ? editingVendor.id : `VEND-${Date.now().toString().slice(-6)}`,
      vendorName: vendorForm.vendorName || "New Vendor",
      businessOrShopName: vendorForm.businessOrShopName || "",
      category: vendorForm.category || "GENERAL",
      mobileNumber: vendorForm.mobileNumber || "",
      alternateMobile: vendorForm.alternateMobile || "",
      address: vendorForm.address || "",
      upiId: vendorForm.upiId || "",
      gpayNumber: vendorForm.gpayNumber || vendorForm.mobileNumber || "",
      notes: vendorForm.notes || "",
      createdAt: editingVendor ? editingVendor.createdAt : new Date().toISOString().split("T")[0]
    };

    if (editingVendor) {
      handleUpdateVendors(vendors.map((v) => (v.id === editingVendor.id ? vendorToSave : v)));
    } else {
      handleUpdateVendors([...vendors, vendorToSave]);
    }

    setIsAddVendorModalOpen(false);
    setEditingVendor(null);
  };

  const handleConfirmDeleteVendor = () => {
    if (!vendorToDelete) return;
    handleUpdateVendors(vendors.filter((v) => v.id !== vendorToDelete.id));
    setVendorToDelete(null);
  };

  // Bill CRUD
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVendor = vendors.find((v) => v.id === billForm.vendorId) || vendors[0];
    const total = Number(billForm.billAmount) || 0;
    const paid = Number(billForm.paidAmount) || 0;

    let status: "PAID" | "PENDING" | "PARTIAL" | "OVERDUE" = "PENDING";
    if (paid >= total && total > 0) {
      status = "PAID";
    } else if (paid > 0 && paid < total) {
      status = "PARTIAL";
    } else {
      const dueTime = new Date(billForm.dueDate || "").getTime();
      if (dueTime && dueTime < Date.now() && paid < total) {
        status = "OVERDUE";
      }
    }

    const billToSave: PersonalVendorBill = {
      id: editingBill ? editingBill.id : `VB-${Date.now().toString().slice(-6)}`,
      vendorId: targetVendor?.id || "VEND-001",
      vendorName: targetVendor?.vendorName || billForm.vendorName || "Vendor",
      billNumber: billForm.billNumber || `INV-${Date.now().toString().slice(-5)}`,
      billDate: billForm.billDate || new Date().toISOString().split("T")[0],
      dueDate: billForm.dueDate || new Date().toISOString().split("T")[0],
      serviceOrParticulars: billForm.serviceOrParticulars || "Services rendered",
      billAmount: total,
      paidAmount: paid,
      paidDate: billForm.paidDate || (paid >= total ? new Date().toISOString().split("T")[0] : ""),
      status: status,
      paymentMode: billForm.paymentMode || "GPay (UPI)",
      transactionReference: billForm.transactionReference || "",
      notes: billForm.notes || "",
      createdAt: editingBill ? editingBill.createdAt : new Date().toISOString().split("T")[0]
    };

    if (editingBill) {
      handleUpdateBills(bills.map((b) => (b.id === editingBill.id ? billToSave : b)));
    } else {
      handleUpdateBills([billToSave, ...bills]);
    }

    setIsAddBillModalOpen(false);
    setEditingBill(null);
  };

  const handleConfirmDeleteBill = () => {
    if (!billToDelete) return;
    handleUpdateBills(bills.filter((b) => b.id !== billToDelete.id));
    setBillToDelete(null);
  };

  const handleConfirmPayment = () => {
    if (!payingBill) return;
    const addedPaid = Number(payAmountInput) || 0;
    const newPaidTotal = (payingBill.paidAmount || 0) + addedPaid;
    const status =
      newPaidTotal >= payingBill.billAmount
        ? "PAID"
        : newPaidTotal > 0
        ? "PARTIAL"
        : "PENDING";

    const updated = bills.map((b) => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          paidAmount: newPaidTotal,
          paidDate: payDateInput,
          status: status as any,
          paymentMode: payModeInput,
          transactionReference: payRefInput || b.transactionReference
        };
      }
      return b;
    });

    handleUpdateBills(updated);
    setIsPayModalOpen(false);
    setPayingBill(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPIs
  const totalBillsAmount = bills.reduce((s, b) => s + b.billAmount, 0);
  const totalPaidAmount = bills.reduce((s, b) => s + b.paidAmount, 0);
  const totalDueAmount = bills.filter((b) => b.status !== "PAID").reduce((s, b) => s + (b.billAmount - b.paidAmount), 0);

  // Filtered Bills
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.serviceOrParticulars.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.businessOrShopName && v.businessOrShopName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.mobileNumber.includes(searchTerm) ||
      (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || v.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-indigo-950/40 border border-amber-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-inner">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
                PERSONAL VENDORS & BILLS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                GPAY & UPI INTEGRATED
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              വ്യക്തിഗത വെണ്ടർമാരും ബില്ലുകളും (Vendors & Payments)
            </h2>
            <p className="text-xs md:text-sm text-purple-200/80 mt-0.5">
              പൂവ് മാല, ഇലക്ട്രിക്കൽ, പ്രിന്റിംഗ്, പ്ലംബിംഗ് തുടങ്ങി എല്ലാ വെണ്ടർമാരുടെയും ബില്ലുകൾ, കുറിപ്പുകൾ, വിലാസം & ബാക്കി തുകകൾ.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sub-view switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-white/10 border border-white/15">
            <button
              onClick={() => setActiveSubView("BILLS")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === "BILLS"
                  ? "bg-amber-400 text-slate-950 font-black shadow-md"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>ബില്ലുകൾ ({bills.length})</span>
            </button>
            <button
              onClick={() => setActiveSubView("VENDORS")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === "VENDORS"
                  ? "bg-amber-400 text-slate-950 font-black shadow-md"
                  : "text-purple-200 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>വെണ്ടർമാർ ({vendors.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingVendor(null);
              setVendorForm({
                vendorName: "",
                businessOrShopName: "",
                category: "GENERAL",
                mobileNumber: "",
                alternateMobile: "",
                address: "",
                upiId: "",
                gpayNumber: "",
                notes: ""
              });
              setIsAddVendorModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-300" />
            <span>പുതിയ വെണ്ടർ (Add Vendor)</span>
          </button>

          <button
            onClick={() => {
              setIsCreateCustomBillModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>പുതിയ ബിൽ സൃഷ്ടിക്കുക (Create Bill)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1e072b] to-[#2c0b3d] border border-amber-500/30 shadow-lg">
          <div className="text-xs text-amber-300 font-bold mb-1">ആകെ വെണ്ടർ ബില്ലുകൾ (TOTAL BILLS)</div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{totalBillsAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-200/70 mt-1 font-mono">{bills.length} ബില്ലുകൾ രേഖപ്പെടുത്തി</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0a2318] to-[#123827] border border-emerald-500/30 shadow-lg">
          <div className="text-xs text-emerald-300 font-bold mb-1">നൽകിയ തുക (TOTAL PAID)</div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            ₹{totalPaidAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-200/70 mt-1">GPay & ബാങ്ക് ട്രാൻസ്ഫർ വഴി</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2f0d1a] to-[#451025] border border-rose-500/30 shadow-lg">
          <div className="text-xs text-rose-300 font-bold mb-1">ബാക്കി നൽകാനുള്ളത് (BALANCE DUE)</div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            ₹{totalDueAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-rose-200/70 mt-1">
            {totalDueAmount === 0 ? "കുടിശ്ശികയില്ല ✓" : "നൽകി തീർക്കാനുള്ള കുടിശ്ശിക"}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" />
          <input
            type="text"
            placeholder={activeSubView === "BILLS" ? "വെണ്ടർ / ബിൽ നമ്പർ / സർവീസ് തിരയുക..." : "വെണ്ടറുടെ പേര് / മൊബൈൽ / വിലാസം..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/20 text-xs text-white placeholder:text-purple-200/50 focus:border-amber-400 focus:outline-none"
          />
        </div>

        {activeSubView === "BILLS" ? (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-purple-300" />
            <span className="text-xs text-purple-200 font-bold">സ്റ്റാറ്റസ്:</span>
            {(["ALL", "PENDING", "PARTIAL", "PAID"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-amber-400 text-black font-black"
                    : "bg-white/10 text-purple-200 hover:bg-white/20"
                }`}
              >
                {st === "ALL" ? "എല്ലാം" : st === "PENDING" ? "നൽകാനുള്ളവ" : st === "PARTIAL" ? "ഭാഗികം" : "നൽകിയവ"}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-4 h-4 text-purple-300" />
            <span className="text-xs text-purple-200 font-bold">വിഭാഗം:</span>
            {(["ALL", "FLOWERS", "ELECTRICAL", "PRINTING", "PLUMBING", "LABOUR", "GENERAL"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? "bg-amber-400 text-black font-black"
                    : "bg-white/10 text-purple-200 hover:bg-white/20"
                }`}
              >
                {cat === "ALL" ? "എല്ലാം" : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: BILLS LIST */}
      {activeSubView === "BILLS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBills.map((bill) => {
            const isPaid = bill.status === "PAID";
            const isPartial = bill.status === "PARTIAL";
            const dueAmt = Math.max(0, bill.billAmount - bill.paidAmount);
            const vendorObj = vendors.find((v) => v.id === bill.vendorId);

            return (
              <div
                key={bill.id}
                className={`p-5 rounded-3xl border transition-all duration-300 backdrop-blur-xl shadow-xl space-y-4 ${
                  isPaid
                    ? "bg-gradient-to-br from-[#0b1f18] to-[#122e23] border-emerald-500/40"
                    : isPartial
                    ? "bg-gradient-to-br from-[#1d1203] to-[#2b1b05] border-amber-500/40"
                    : "bg-gradient-to-br from-[#200829] to-[#2f0d3a] border-purple-500/40"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <div className="text-base font-black text-white">{bill.vendorName}</div>
                    <div className="text-xs font-mono font-bold text-amber-300">
                      Bill No: {bill.billNumber} • {bill.billDate}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase ${
                        isPaid
                          ? "bg-emerald-400 text-slate-950"
                          : isPartial
                          ? "bg-amber-400 text-slate-950"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {bill.status}
                    </span>
                    <div className="text-[10px] text-purple-200/60 mt-1 font-mono">Due: {bill.dueDate}</div>
                  </div>
                </div>

                {/* Service particulars */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                  <div className="text-[10px] text-purple-200/60 uppercase font-bold">സർവീസ് / വിവരണം (Service)</div>
                  <div className="font-semibold text-white mt-0.5">{bill.serviceOrParticulars}</div>
                  {bill.notes && (
                    <div className="text-[11px] text-purple-200/70 mt-1 italic">Note: {bill.notes}</div>
                  )}
                </div>

                {/* Amount Matrix */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-purple-200/60">ബിൽ തുക</div>
                    <div className="text-sm font-black text-white">₹{bill.billAmount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-purple-200/60">നൽകിയ തുക</div>
                    <div className="text-sm font-black text-emerald-300">₹{bill.paidAmount}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-purple-200/60">ബാക്കി (Due)</div>
                    <div className="text-sm font-black text-rose-300">₹{dueAmt}</div>
                  </div>
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const text = generateVendorBillWhatsAppMessage(bill, vendorObj);
                        shareViaWhatsApp({ phone: vendorObj?.gpayNumber || vendorObj?.mobileNumber, text });
                      }}
                      className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition cursor-pointer"
                      title="വാട്സാപ്പ് വഴി അയക്കുക (Share Bill via WhatsApp)"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingBill(bill);
                        setBillForm(bill);
                        setIsAddBillModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition cursor-pointer"
                      title="Edit Bill"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-yellow-300" />
                    </button>
                    <button
                      onClick={() => setBillToDelete(bill)}
                      className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold transition cursor-pointer"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {vendorObj && (
                      <button
                        onClick={() => {
                          setActiveQrData({
                            upi: vendorObj.gpayNumber || vendorObj.upiId || "9446669832",
                            name: vendorObj.vendorName,
                            amount: dueAmt > 0 ? dueAmt : bill.billAmount,
                            note: `${bill.vendorName} ${bill.billNumber}`
                          });
                          setIsQrModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30 transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-purple-300" />
                        <span>UPI QR</span>
                      </button>
                    )}

                    {!isPaid && (
                      <button
                        onClick={() => {
                          setPayingBill(bill);
                          setPayAmountInput(dueAmt);
                          setPayDateInput(new Date().toISOString().split("T")[0]);
                          setIsPayModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-md cursor-pointer"
                      >
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>പേയ്‌മെന്റ് നൽകുക</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: VENDORS DIRECTORY */}
      {activeSubView === "VENDORS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVendors.map((vendor) => {
            const vendorBills = bills.filter((b) => b.vendorId === vendor.id);
            const vendorTotal = vendorBills.reduce((s, b) => s + b.billAmount, 0);
            const vendorPaid = vendorBills.reduce((s, b) => s + b.paidAmount, 0);
            const vendorDue = Math.max(0, vendorTotal - vendorPaid);

            return (
              <div
                key={vendor.id}
                className="p-5 rounded-3xl bg-gradient-to-br from-[#180726] to-[#250b38] border border-purple-500/40 backdrop-blur-xl shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top line */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
                        {vendor.category}
                      </span>
                      <h3 className="text-base font-black text-white mt-1">{vendor.vendorName}</h3>
                      {vendor.businessOrShopName && (
                        <div className="text-xs text-purple-200/80 font-medium">{vendor.businessOrShopName}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const text = generateVendorContactWhatsAppMessage(vendor);
                          shareViaWhatsApp({ phone: vendor.gpayNumber || vendor.mobileNumber, text });
                        }}
                        className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white transition cursor-pointer"
                        title="വാട്സാപ്പ് വഴി പങ്കിടുക (Share Contact to WhatsApp)"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingVendor(vendor);
                          setVendorForm(vendor);
                          setIsAddVendorModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
                        title="Edit Vendor"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-yellow-300" />
                      </button>
                      <button
                        onClick={() => setVendorToDelete(vendor)}
                        className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                        title="Delete Vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-purple-200/90 font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{vendor.mobileNumber}</span>
                      </span>
                      <button
                        onClick={() => handleCopy(vendor.mobileNumber, `mob-${vendor.id}`)}
                        className="text-cyan-300 hover:text-white cursor-pointer"
                        title="Copy"
                      >
                        {copiedId === `mob-${vendor.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {vendor.gpayNumber && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300">
                        <span className="font-bold">GPAY: {vendor.gpayNumber}</span>
                        <button
                          onClick={() => handleCopy(vendor.gpayNumber, `gpay-${vendor.id}`)}
                          className="hover:text-white cursor-pointer"
                          title="Copy GPay"
                        >
                          {copiedId === `gpay-${vendor.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {vendor.address && (
                      <div className="flex items-start gap-1.5 text-[11px] text-purple-200/70 font-sans pt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{vendor.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Ledger Summary */}
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-purple-200/60 font-sans">ആകെ ബില്ലുകൾ</div>
                      <div className="text-sm font-black text-white">₹{vendorTotal}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-purple-200/60 font-sans">ബാക്കി (Due)</div>
                      <div className="text-sm font-black text-rose-300">₹{vendorDue}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveQrData({
                        upi: vendor.gpayNumber || vendor.upiId || vendor.mobileNumber,
                        name: vendor.vendorName,
                        amount: vendorDue,
                        note: `Payment to ${vendor.vendorName}`
                      });
                      setIsQrModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>QR കോഡ്</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingBill(null);
                      setBillForm({
                        vendorId: vendor.id,
                        vendorName: vendor.vendorName,
                        billNumber: `INV-${Date.now().toString().slice(-4)}`,
                        billDate: new Date().toISOString().split("T")[0],
                        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                        serviceOrParticulars: "",
                        billAmount: 0,
                        paidAmount: 0,
                        status: "PENDING",
                        paymentMode: "GPay (UPI)",
                        notes: ""
                      });
                      setIsAddBillModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ബിൽ ഉണ്ടാക്കുക</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT VENDOR */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingVendor ? "വെണ്ടർ വിവരങ്ങൾ തിരുത്തുക" : "പുതിയ വെണ്ടറെ ചേർക്കുക (Add Vendor)"}
              </h3>
              <button
                onClick={() => setIsAddVendorModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    വെണ്ടറുടെ പേര് (Vendor Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.vendorName || ""}
                    onChange={(e) => setVendorForm({ ...vendorForm, vendorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    സ്ഥാപനം / കടയുടെ പേര് (Shop Name)
                  </label>
                  <input
                    type="text"
                    value={vendorForm.businessOrShopName || ""}
                    onChange={(e) => setVendorForm({ ...vendorForm, businessOrShopName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    വിഭാഗം (Category) *
                  </label>
                  <select
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value as PersonalVendorCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950 border border-white/20 text-white text-xs"
                  >
                    <option value="FLOWERS">Flowers & Poov Mala (പൂവ് മാല)</option>
                    <option value="ELECTRICAL">Electrical & Lights (ഇലക്ട്രിക്കൽ)</option>
                    <option value="PLUMBING">Plumbing & Sanitary (പ്ലംബിംഗ്)</option>
                    <option value="PRINTING">Printing & Stationery (പ്രിന്റിംഗ്)</option>
                    <option value="PAINTING">Painting & Hardware (പെയിന്റിംഗ്)</option>
                    <option value="LABOUR">Site Labour & Contractor (തൊഴിലാളികൾ)</option>
                    <option value="GENERAL">General Services (മറ്റുള്ളവ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    മൊബൈൽ നമ്പർ *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorForm.mobileNumber || ""}
                    onChange={(e) =>
                      setVendorForm({
                        ...vendorForm,
                        mobileNumber: e.target.value,
                        gpayNumber: vendorForm.gpayNumber || e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    GPay / PhonePe നമ്പർ
                  </label>
                  <input
                    type="text"
                    value={vendorForm.gpayNumber || ""}
                    onChange={(e) => setVendorForm({ ...vendorForm, gpayNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    UPI ID (ഓപ്ഷണൽ)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. name@okaxis"
                    value={vendorForm.upiId || ""}
                    onChange={(e) => setVendorForm({ ...vendorForm, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  വിലാസം / സ്ഥലം (Address / Location)
                </label>
                <input
                  type="text"
                  value={vendorForm.address || ""}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  കുറിപ്പുകൾ (Notes)
                </label>
                <textarea
                  rows={2}
                  value={vendorForm.notes || ""}
                  onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddVendorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg"
                >
                  {editingVendor ? "സേവ് ചെയ്യുക" : "വെണ്ടറെ ചേർക്കുക"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT BILL */}
      {isAddBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingBill ? "ബിൽ തിരുത്തുക" : "പുതിയ വെണ്ടർ ബിൽ സൃഷ്ടിക്കുക"}
              </h3>
              <button
                onClick={() => setIsAddBillModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    വെണ്ടറെ തിരഞ്ഞെടുക്കുക *
                  </label>
                  <select
                    value={billForm.vendorId}
                    onChange={(e) => {
                      const v = vendors.find((x) => x.id === e.target.value);
                      setBillForm({
                        ...billForm,
                        vendorId: e.target.value,
                        vendorName: v ? v.vendorName : billForm.vendorName
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950 border border-white/20 text-white text-xs"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorName} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ബിൽ നമ്പർ (Bill No) *
                  </label>
                  <input
                    type="text"
                    required
                    value={billForm.billNumber || ""}
                    onChange={(e) => setBillForm({ ...billForm, billNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  സർവീസ് / സാധനങ്ങൾ (Service / Items Particulars) *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Daily Pooja Flower Garlands / LED Light Wires / CAD Blueprint printing"
                  value={billForm.serviceOrParticulars || ""}
                  onChange={(e) => setBillForm({ ...billForm, serviceOrParticulars: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    ബിൽ തുക (Bill Amount ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={billForm.billAmount ?? 0}
                    onChange={(e) => setBillForm({ ...billForm, billAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 text-amber-300 font-mono font-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    നൽകിയ തുക (Paid Amount ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={billForm.paidAmount ?? 0}
                    onChange={(e) => setBillForm({ ...billForm, paidAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ബിൽ തീയതി
                  </label>
                  <input
                    type="date"
                    value={billForm.billDate || ""}
                    onChange={(e) => setBillForm({ ...billForm, billDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-300 mb-1">
                    അവസാന തീയതി (Due Date)
                  </label>
                  <input
                    type="date"
                    value={billForm.dueDate || ""}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-rose-400/40 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  കുറിപ്പുകൾ (Notes)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 76 working days @ ₹20/day"
                  value={billForm.notes || ""}
                  onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddBillModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg"
                >
                  {editingBill ? "സേവ് ചെയ്യുക" : "ബിൽ സൃഷ്ടിക്കുക"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK PAY RECORD */}
      {isPayModalOpen && payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#170626] border border-emerald-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">പേയ്‌മെന്റ് നൽകുക / രേഖപ്പെടുത്തുക</h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-400/20 text-xs">
                <div className="font-bold text-white">{payingBill.vendorName}</div>
                <div className="text-purple-200/70">{payingBill.billNumber} • {payingBill.serviceOrParticulars}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">
                  നൽകുന്ന തുക (₹) *
                </label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono font-black text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    രീതി (Mode)
                  </label>
                  <select
                    value={payModeInput}
                    onChange={(e) => setPayModeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-purple-950 border border-white/20 text-white text-xs"
                  >
                    <option value="GPay (UPI)">GPay (UPI)</option>
                    <option value="PhonePe">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Cash (പണം)">Cash (പണം)</option>
                    <option value="Bank NEFT">Bank NEFT/IMPS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    തീയതി
                  </label>
                  <input
                    type="date"
                    value={payDateInput}
                    onChange={(e) => setPayDateInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  UPI / Txn Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/608933214590"
                  value={payRefInput}
                  onChange={(e) => setPayRefInput(e.target.value)}
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

      {/* MODAL: UPI QR CODE */}
      {isQrModalOpen && activeQrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#140624] border border-emerald-500/40 p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span>UPI QR കോഡ്</span>
              </h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img
                src={generateUpiQrUrl(activeQrData.upi, activeQrData.name, activeQrData.amount, activeQrData.note)}
                alt="UPI QR Code"
                className="w-52 h-52 object-contain"
              />
            </div>

            <div className="space-y-1">
              <div className="text-base font-black text-white font-mono">{activeQrData.name}</div>
              <div className="text-xs font-mono text-emerald-300 font-bold">UPI/GPay: {activeQrData.upi}</div>
              <div className="text-sm font-black text-amber-300 font-mono mt-1">
                തുക: ₹{activeQrData.amount}
              </div>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
            >
              അടയ്ക്കുക (Close)
            </button>
          </div>
        </div>
      )}
      {/* IN-APP DELETE MODAL FOR VENDOR BILL */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">വെണ്ടർ ബിൽ നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Vendor Bill</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 font-mono">
              <div><span className="text-slate-400">വെണ്ടർ:</span> <strong className="text-white font-sans">{billToDelete.vendorName}</strong></div>
              <div><span className="text-slate-400">ബിൽ നമ്പർ:</span> <span className="text-amber-300 font-bold">{billToDelete.billNumber}</span></div>
              <div><span className="text-slate-400">ബിൽ തുക:</span> <span className="text-emerald-300 font-bold">₹{billToDelete.billAmount}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ വെണ്ടർ ബിൽ റെക്കോർഡ് ലിസ്റ്റിൽ നിന്നും പൂർണ്ണമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
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
                onClick={handleConfirmDeleteBill}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ഡിലീറ്റ് ചെയ്യുക (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP DELETE MODAL FOR VENDOR */}
      {vendorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">വെണ്ടറെ നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Vendor Directory Entry</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 font-mono">
              <div><span className="text-slate-400">പേര്:</span> <strong className="text-white font-sans">{vendorToDelete.vendorName}</strong></div>
              <div><span className="text-slate-400">വിഭാഗം:</span> <span className="text-amber-300 font-bold">{vendorToDelete.category}</span></div>
              <div><span className="text-slate-400">മൊബൈൽ:</span> <span className="text-emerald-300 font-bold">{vendorToDelete.mobileNumber}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ വെണ്ടറെ കോൺടാക്റ്റ് ഡയറക്ടറിയിൽ നിന്നും നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVendorToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVendor}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ഡിലീറ്റ് ചെയ്യുക (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CUSTOM BILL MODAL */}
      <CreateCustomBillModal
        isOpen={isCreateCustomBillModalOpen}
        onClose={() => setIsCreateCustomBillModalOpen(false)}
        onBillCreated={() => {
          setBills(loadPersonalVendorBills());
          setVendors(loadPersonalVendors());
        }}
      />
    </div>
  );
};
