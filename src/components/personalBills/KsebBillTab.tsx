import React, { useState, useMemo } from "react";
import { KsebBillRecord } from "../../types";
import {
  loadKsebBills,
  saveKsebBills,
  generateUpiQrUrl,
  generateKsebWhatsAppMessage,
  shareViaWhatsApp
} from "../../utils/personalBillsStorage";
import {
  Zap,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  Calendar,
  IndianRupee,
  Search,
  Filter,
  ShieldCheck,
  Building,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Receipt,
  FileSpreadsheet
} from "lucide-react";

export const KsebBillTab: React.FC = () => {
  const [bills, setBills] = useState<KsebBillRecord[]>(() => loadKsebBills());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals & Confirmation States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<KsebBillRecord | null>(null);
  const [billToDelete, setBillToDelete] = useState<KsebBillRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<KsebBillRecord | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrBill, setActiveQrBill] = useState<KsebBillRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<KsebBillRecord>>({
    consumerNo: "1155890024512",
    billMonth: "May - June 2026",
    totalAmount: 1386,
    paidAmount: 0,
    paidDate: "",
    status: "UNPAID",
    notes: "Payment UPI ID: deepak.vasthusilpy@okhdfcbank"
  });

  // Pay Modal State
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payUpiNoteInput, setPayUpiNoteInput] = useState<string>("Payment UPI ID: deepak.vasthusilpy@okhdfcbank");

  const handleUpdateBills = (newBills: KsebBillRecord[]) => {
    setBills(newBills);
    saveKsebBills(newBills);
  };

  // Helper to extract year from bill (from billMonth, paidDate, billDate, or id)
  const getBillYear = (bill: KsebBillRecord): string => {
    // 1. Try matching 4 digits in billMonth (e.g., "March - April 2026" or "2026-05")
    const monthMatch = bill.billMonth?.match(/\b(20\d{2})\b/);
    if (monthMatch) return monthMatch[1];

    // 2. Try from paidDate
    if (bill.paidDate && bill.paidDate.startsWith("20")) {
      return bill.paidDate.slice(0, 4);
    }

    // 3. Try from billDate
    if (bill.billDate && bill.billDate.startsWith("20")) {
      return bill.billDate.slice(0, 4);
    }

    // 4. Try from id (e.g. KSEB-2026-001)
    const idMatch = bill.id?.match(/\b(20\d{2})\b/);
    if (idMatch) return idMatch[1];

    return new Date().getFullYear().toString();
  };

  // List of all unique years in descending order
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    bills.forEach((b) => yearsSet.add(getBillYear(b)));
    // ensure current year and last couple of years exist in list
    yearsSet.add(new Date().getFullYear().toString());
    yearsSet.add((new Date().getFullYear() - 1).toString());
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [bills]);

  // Grouped bills by Year
  const groupedBillsByYear = useMemo(() => {
    const groups: { [year: string]: KsebBillRecord[] } = {};

    bills.forEach((bill) => {
      const year = getBillYear(bill);
      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(bill);
    });

    return groups;
  }, [bills]);

  // Filtered bills by search and status
  const filteredGroupedBills = useMemo(() => {
    const result: { [year: string]: KsebBillRecord[] } = {};

    const targetYears = selectedYear === "ALL" ? availableYears : [selectedYear];

    targetYears.forEach((year) => {
      const yearBills = groupedBillsByYear[year] || [];
      const filtered = yearBills.filter((b) => {
        const matchesSearch =
          b.consumerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.billMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (b.notes && b.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (b.paidDate && b.paidDate.includes(searchTerm));

        const matchesStatus =
          statusFilter === "ALL" ||
          b.status === statusFilter;

        return matchesSearch && matchesStatus;
      });

      if (filtered.length > 0 || selectedYear === year) {
        result[year] = filtered;
      }
    });

    return result;
  }, [groupedBillsByYear, availableYears, selectedYear, searchTerm, statusFilter]);

  // Global KPIs
  const totalBillsAmount = bills.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0);
  const totalPaidAmount = bills.reduce((s, b) => s + (Number(b.paidAmount) || 0), 0);
  const totalPendingAmount = bills.filter((b) => b.status !== "PAID").reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);

  // Add / Edit Save Handler
  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.totalAmount) || 0;
    const paid = Number(formData.paidAmount) || 0;
    const status: "PAID" | "UNPAID" | "OVERDUE" = paid >= amount && amount > 0 ? "PAID" : (formData.status || "UNPAID");

    const billToSave: KsebBillRecord = {
      id: editingBill ? editingBill.id : `KSEB-${Date.now().toString().slice(-6)}`,
      consumerNo: formData.consumerNo?.trim() || "1155890024512",
      billMonth: formData.billMonth?.trim() || "Current Bill",
      totalAmount: amount,
      paidAmount: paid,
      paidDate: formData.paidDate || (status === "PAID" ? new Date().toISOString().split("T")[0] : ""),
      status: status,
      notes: formData.notes?.trim() || "",
      sectionName: formData.sectionName || "Keralassery Section (1155)",
      consumerName: formData.consumerName || (formData.consumerNo?.includes("24512") ? "Vasthusilpy Office" : "Deepak Residence"),
      billDate: formData.billDate || new Date().toISOString().split("T")[0],
      dueDate: formData.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
    };

    if (editingBill) {
      handleUpdateBills(bills.map((b) => (b.id === editingBill.id ? billToSave : b)));
    } else {
      handleUpdateBills([billToSave, ...bills]);
    }

    setIsAddModalOpen(false);
    setEditingBill(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!billToDelete) return;
    handleUpdateBills(bills.filter((b) => b.id !== billToDelete.id));
    setBillToDelete(null);
  };

  // Quick Confirm Payment
  const handleConfirmPayment = () => {
    if (!payingBill) return;
    const paidAmt = Number(payAmountInput) || payingBill.totalAmount;
    const updated = bills.map((b) => {
      if (b.id === payingBill.id) {
        return {
          ...b,
          paidAmount: paidAmt,
          paidDate: payDateInput,
          status: "PAID" as const,
          notes: payUpiNoteInput || b.notes
        };
      }
      return b;
    });

    handleUpdateBills(updated);
    setIsPayModalOpen(false);
    setPayingBill(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-blue-950/50 border border-amber-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-wide">
                KSEB വൈദ്യുതി ബില്ലുകൾ & പേയ്‌മെന്റുകൾ
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                YEAR-WISE LEDGER
              </span>
            </div>
            <p className="text-xs text-amber-200/80">
              Consumer Number, Bill Month, Bill Amount, Paid Date, and Payment UPI ID in Notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingBill(null);
              setFormData({
                consumerNo: "1155890024512",
                billMonth: `May - June ${new Date().getFullYear()}`,
                totalAmount: 1386,
                paidAmount: 0,
                paidDate: "",
                status: "UNPAID",
                notes: "Payment UPI ID: deepak.vasthusilpy@okhdfcbank"
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>പുതിയ ബിൽ ചേർക്കുക (Add Bill)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg">
          <div className="text-xs text-amber-300 font-bold mb-1">ആകെ ബിൽ തുക (TOTAL BILL AMOUNT)</div>
          <div className="text-2xl font-black text-white font-mono">
            ₹{totalBillsAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-amber-200/70 mt-1 font-mono">
            {bills.length} ബില്ലുകൾ റെക്കോർഡ് ചെയ്തു
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg">
          <div className="text-xs text-emerald-300 font-bold mb-1">ആകെ അടച്ച തുക (TOTAL PAID)</div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            ₹{totalPaidAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-200/70 mt-1">
            GPay / UPI / BBPS വഴി അടച്ചവ
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 shadow-lg">
          <div className="text-xs text-rose-300 font-bold mb-1">അടയ്ക്കാനുള്ള കുടിശ്ശിക (PENDING DUE)</div>
          <div className="text-2xl font-black text-rose-300 font-mono">
            ₹{totalPendingAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-rose-200/70 mt-1">
            {totalPendingAmount === 0 ? "കുടിശ്ശികയില്ല ✓" : "അടിയന്തരമായി അടയ്ക്കേണ്ടത്"}
          </div>
        </div>
      </div>

      {/* Year Filter Pills & Search */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-md space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Year Switcher Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" />
              വർഷം (Year):
            </span>
            <button
              onClick={() => setSelectedYear("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                selectedYear === "ALL"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              }`}
            >
              എല്ലാ വർഷങ്ങളും (All Years)
            </button>
            {availableYears.map((yr) => {
              const yrBills = groupedBillsByYear[yr] || [];
              const yrTotal = yrBills.reduce((s, b) => s + b.totalAmount, 0);
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                    selectedYear === yr
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  <span>{yr}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedYear === yr ? "bg-slate-950/20 text-slate-950" : "bg-white/10 text-slate-400"
                  }`}>
                    {yrBills.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Status Filter */}
          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <div className="relative flex-1 lg:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Consumer No. / Month / UPI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/20 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {(["ALL", "PAID", "UNPAID"] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === st
                      ? "bg-amber-400 text-slate-950 font-black"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {st === "ALL" ? "All" : st === "PAID" ? "Paid" : "Unpaid"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* YEAR-WISE BILLS LIST (Showing strictly: Consumer No, Bill Month, Bill Amount, Paid Date, Payment UPI ID in Notes) */}
      <div className="space-y-6">
        {Object.keys(filteredGroupedBills).length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/60 border border-white/10 text-slate-400">
            <Zap className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <div className="text-sm font-bold text-white">ബില്ലുകൾ ഒന്നും കണ്ടെത്തിയില്ല</div>
            <div className="text-xs text-slate-400 mt-1">തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകൾ പ്രകാരം KSEB ബില്ലുകൾ ലഭ്യമല്ല</div>
          </div>
        ) : (
          (Object.entries(filteredGroupedBills) as [string, KsebBillRecord[]][])
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, yearBills]) => {
              const yearTotalAmount = yearBills.reduce((s, b) => s + b.totalAmount, 0);
              const yearPaidAmount = yearBills.reduce((s, b) => s + b.paidAmount, 0);
              const yearPendingAmount = yearBills.filter((b) => b.status !== "PAID").reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0);

              return (
                <div
                  key={year}
                  className="rounded-3xl bg-slate-900/90 border border-amber-500/30 overflow-hidden shadow-2xl transition duration-300"
                >
                  {/* Year Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-950/60 via-slate-800 to-slate-900 border-b border-amber-500/20">
                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm tracking-wider shadow-md">
                        {year}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-2">
                          <span>{year} ലെ KSEB വൈദ്യുതി ബില്ലുകൾ</span>
                          <span className="text-xs font-mono text-amber-300 font-bold">
                            ({yearBills.length} Bills)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          വാർഷിക ബിൽ പട്ടികയും പേയ്‌മെന്റ് വിവരങ്ങളും
                        </div>
                      </div>
                    </div>

                    {/* Year Totals */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-slate-400 mr-1">ആകെ ബിൽ:</span>
                        <span className="font-black text-white">₹{yearTotalAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30">
                        <span className="text-emerald-300 mr-1">നൽകിയത്:</span>
                        <span className="font-black text-emerald-300">₹{yearPaidAmount.toLocaleString("en-IN")}</span>
                      </div>
                      {yearPendingAmount > 0 && (
                        <div className="px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/30">
                          <span className="text-rose-300 mr-1">ബാക്കി:</span>
                          <span className="font-black text-rose-300">₹{yearPendingAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Year Bills Table - Showing EXACTLY the 5 requested columns + Actions */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-black uppercase text-amber-300 tracking-wider">
                          <th className="py-3 px-4">1. കൺസ്യൂമർ നമ്പർ (Consumer No.)</th>
                          <th className="py-3 px-4">2. ബിൽ മാസം (Bill Month)</th>
                          <th className="py-3 px-4">3. ബിൽ തുക (Bill Amount)</th>
                          <th className="py-3 px-4">4. അടച്ച തീയതി (Paid Date)</th>
                          <th className="py-3 px-4">5. Payment UPI ID in Notes</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-xs font-medium">
                        {yearBills.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500">
                              ഈ വർഷത്തിൽ ബില്ലുകൾ ലഭ്യമല്ല
                            </td>
                          </tr>
                        ) : (
                          yearBills.map((bill) => {
                            const isPaid = bill.status === "PAID";
                            return (
                              <tr
                                key={bill.id}
                                className="hover:bg-white/[0.03] transition duration-150"
                              >
                                {/* 1. Consumer Number */}
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="font-black text-white tracking-wider flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>{bill.consumerNo}</span>
                                  </div>
                                  {bill.consumerName && (
                                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                                      {bill.consumerName}
                                    </div>
                                  )}
                                </td>

                                {/* 2. Bill Month */}
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-white">
                                    {bill.billMonth}
                                  </div>
                                  {bill.dueDate && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      Due: {bill.dueDate}
                                    </div>
                                  )}
                                </td>

                                {/* 3. Bill Amount */}
                                <td className="py-3.5 px-4 font-mono">
                                  <div className="text-sm font-black text-amber-300">
                                    ₹{bill.totalAmount.toLocaleString("en-IN")}
                                  </div>
                                  <div className="text-[10px] mt-0.5">
                                    {isPaid ? (
                                      <span className="text-emerald-400 font-bold inline-flex items-center gap-0.5">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> Paid in full
                                      </span>
                                    ) : (
                                      <span className="text-rose-400 font-bold inline-flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" /> Unpaid
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* 4. Paid Date */}
                                <td className="py-3.5 px-4 font-mono">
                                  {bill.paidDate ? (
                                    <div>
                                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold inline-block">
                                        {bill.paidDate}
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold inline-block">
                                        അടച്ചിട്ടില്ല (Unpaid)
                                      </span>
                                    </div>
                                  )}
                                </td>

                                {/* 5. Payment UPI ID in Notes */}
                                <td className="py-3.5 px-4">
                                  <div className="max-w-xs">
                                    {bill.notes ? (
                                      <div className="p-2 rounded-xl bg-slate-950/70 border border-white/10 text-slate-200 font-mono text-[11px] break-words">
                                        {bill.notes}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 italic text-[11px]">
                                        കുറിപ്പുകൾ ചേർത്തിട്ടില്ല
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Mark as Paid / Pay Button */}
                                    {!isPaid && (
                                      <button
                                        onClick={() => {
                                          setPayingBill(bill);
                                          setPayAmountInput(bill.totalAmount - bill.paidAmount);
                                          setPayDateInput(new Date().toISOString().split("T")[0]);
                                          setPayUpiNoteInput(bill.notes || "Payment UPI ID: deepak.vasthusilpy@okhdfcbank");
                                          setIsPayModalOpen(true);
                                        }}
                                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] transition shadow-md cursor-pointer flex items-center gap-1"
                                        title="Mark as Paid"
                                      >
                                        <IndianRupee className="w-3 h-3" />
                                        <span>Pay</span>
                                      </button>
                                    )}

                                    {/* UPI QR Code */}
                                    <button
                                      onClick={() => {
                                        setActiveQrBill(bill);
                                        setIsQrModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/30 transition cursor-pointer"
                                      title="UPI QR Code"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                    </button>

                                    {/* WhatsApp Share */}
                                    <button
                                      onClick={() => {
                                        const text = generateKsebWhatsAppMessage(bill);
                                        shareViaWhatsApp({ text });
                                      }}
                                      className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white transition cursor-pointer"
                                      title="WhatsApp Share"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Edit */}
                                    <button
                                      onClick={() => {
                                        setEditingBill(bill);
                                        setFormData(bill);
                                        setIsAddModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-yellow-300 transition cursor-pointer"
                                      title="Edit Bill"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>

                                    {/* Delete Button (Opens custom confirm modal) */}
                                    <button
                                      onClick={() => setBillToDelete(bill)}
                                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-rose-100 transition cursor-pointer"
                                      title="Delete Bill"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* MODAL: ADD / EDIT KSEB BILL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#111827] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingBill ? "KSEB ബിൽ തിരുത്തുക" : "പുതിയ KSEB ബിൽ ചേർക്കുക"}
                  </h3>
                  <p className="text-xs text-amber-200/70">
                    Consumer Number, Bill Month, Bill Amount, Paid Date & UPI ID Notes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBill} className="space-y-4">
              {/* Consumer Number */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  1. കൺസ്യൂമർ നമ്പർ (Consumer Number) *
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1155890024512"
                    value={formData.consumerNo || ""}
                    onChange={(e) => setFormData({ ...formData, consumerNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                  />
                  {/* Quick Pick Presets */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, consumerNo: "1155890024512", consumerName: "Vasthusilpy Technical Office" })}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-amber-300 font-mono transition"
                    >
                      🏢 Office (1155890024512)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, consumerNo: "1155890038914", consumerName: "Deepak Residence" })}
                      className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] text-amber-300 font-mono transition"
                    >
                      🏠 Residence (1155890038914)
                    </button>
                  </div>
                </div>
              </div>

              {/* Bill Month */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  2. ബിൽ മാസം (Bill Month / Period) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. May - June 2026 or March 2026"
                  value={formData.billMonth || ""}
                  onChange={(e) => setFormData({ ...formData, billMonth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Bill Amount */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  3. ബിൽ തുക (Bill Amount ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 font-bold">₹</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.totalAmount ?? 0}
                    onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/20 text-amber-300 font-mono font-black text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status & Paid Date */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    സ്റ്റാറ്റസ് (Status)
                  </label>
                  <select
                    value={formData.status || "UNPAID"}
                    onChange={(e) => {
                      const st = e.target.value as "PAID" | "UNPAID";
                      setFormData({
                        ...formData,
                        status: st,
                        paidAmount: st === "PAID" ? (formData.totalAmount || 0) : 0,
                        paidDate: st === "PAID" ? (formData.paidDate || new Date().toISOString().split("T")[0]) : ""
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs"
                  >
                    <option value="UNPAID">അടയ്ക്കാനുണ്ട് (UNPAID)</option>
                    <option value="PAID">അടച്ചു (PAID)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    4. അടച്ച തീയതി (Paid Date)
                  </label>
                  <input
                    type="date"
                    value={formData.paidDate || ""}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Payment UPI ID in Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  5. Payment UPI ID in Notes (കുറിപ്പുകൾ & UPI ID)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Payment UPI ID: deepak.vasthusilpy@okhdfcbank"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
                />
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, notes: "Payment UPI ID: deepak.vasthusilpy@okhdfcbank" })}
                    className="text-[10px] text-amber-300/80 hover:text-amber-200 underline"
                  >
                    + deepak.vasthusilpy@okhdfcbank
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, notes: "Payment UPI ID: 9446669832@ybl" })}
                    className="text-[10px] text-amber-300/80 hover:text-amber-200 underline"
                  >
                    + 9446669832@ybl
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/20 cursor-pointer"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg cursor-pointer"
                >
                  {editingBill ? "മാറ്റങ്ങൾ സേവ് ചെയ്യുക" : "ബിൽ ചേർക്കുക ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MARK AS PAID / PAYMENT */}
      {isPayModalOpen && payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#111827] border border-emerald-500/40 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">KSEB പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക</h3>
                  <p className="text-xs text-emerald-200/70">Consumer: {payingBill.consumerNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  അടച്ച തുക (Paid Amount ₹)
                </label>
                <input
                  type="number"
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono font-black text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  അടച്ച തീയതി (Paid Date)
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
                  Payment UPI ID in Notes
                </label>
                <input
                  type="text"
                  value={payUpiNoteInput}
                  onChange={(e) => setPayUpiNoteInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  പേയ്‌മെന്റ് സ്ഥിരീകരിക്കുക ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UPI QR CODE */}
      {isQrModalOpen && activeQrBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#111827] border border-amber-500/40 p-6 shadow-2xl text-center space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white">KSEB ബിൽ UPI QR കോഡ്</h3>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl mx-auto w-fit shadow-lg">
              <img
                src={generateUpiQrUrl(
                  "deepak.vasthusilpy@okhdfcbank",
                  "KSEB Electricity",
                  activeQrBill.totalAmount,
                  `KSEB Bill ${activeQrBill.consumerNo} ${activeQrBill.billMonth}`
                )}
                alt="UPI QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="text-xs space-y-1 font-mono">
              <div className="text-amber-300 font-bold">Consumer: {activeQrBill.consumerNo}</div>
              <div className="text-white font-black text-lg">₹{activeQrBill.totalAmount.toLocaleString("en-IN")}</div>
              <div className="text-[11px] text-slate-400">{activeQrBill.billMonth}</div>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold"
            >
              അടയ്ക്കുക (Close)
            </button>
          </div>
        </div>
      )}

      {/* IN-APP DELETE CONFIRMATION MODAL (No window.confirm!) */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">KSEB ബിൽ നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete KSEB Bill Record</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 font-mono">
              <div><span className="text-slate-400">കൺസ്യൂമർ നമ്പർ:</span> <strong className="text-white">{billToDelete.consumerNo}</strong></div>
              <div><span className="text-slate-400">ബിൽ മാസം:</span> <span className="text-amber-300 font-bold">{billToDelete.billMonth}</span></div>
              <div><span className="text-slate-400">ബിൽ തുക:</span> <span className="text-white font-black">₹{billToDelete.totalAmount}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ KSEB ബിൽ റെക്കോർഡ് ശാശ്വതമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
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
