import React, { useState, useEffect } from "react";
import {
  PoovMalaBillRow,
  PoovMalaVendorConfig
} from "../../types";
import {
  loadPoovMalaRows,
  savePoovMalaRows,
  loadPoovMalaConfig,
  savePoovMalaConfig,
  calculatePoovMalaPeriodDays,
  generateUpiQrUrl,
  generateUpiUri,
  shareViaWhatsApp,
  generatePoovMalaWhatsAppMessage,
  generatePoovMalaSummaryWhatsAppMessage,
  formatDateToDMY,
  parseDateFlexible
} from "../../utils/personalBillsStorage";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  QrCode,
  Printer,
  FileSpreadsheet,
  IndianRupee,
  Calendar,
  Sparkles,
  Info,
  Phone,
  Copy,
  Check,
  Send,
  Eye,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Share2,
  RotateCcw,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Download,
  Smartphone,
  ExternalLink,
  CreditCard,
  ScanLine
} from "lucide-react";

interface PoovMalaBillTabProps {
  onNotify?: (msg: string) => void;
}

export const PoovMalaBillTab: React.FC<PoovMalaBillTabProps> = () => {
  const [rows, setRows] = useState<PoovMalaBillRow[]>(() => loadPoovMalaRows());
  const [vendorConfig, setVendorConfig] = useState<PoovMalaVendorConfig>(() => loadPoovMalaConfig());
  
  // Modals & UI States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PoovMalaBillRow | null>(null);
  const [rowToDelete, setRowToDelete] = useState<PoovMalaBillRow | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingRow, setPayingRow] = useState<PoovMalaBillRow | null>(null);
  const [isVendorEditOpen, setIsVendorEditOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrAmount, setQrAmount] = useState<number>(0);
  const [qrNote, setQrNote] = useState<string>("Poov Mala Bill Payment");
  const [activeQrRow, setActiveQrRow] = useState<PoovMalaBillRow | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form State for Adding / Editing Row
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [formDaysExcludeSundays, setFormDaysExcludeSundays] = useState<number>(0);
  const [formSundaysCount, setFormSundaysCount] = useState<number>(0);
  const [formTotalCalendarDays, setFormTotalCalendarDays] = useState<number>(0);
  const [formOtherLeave, setFormOtherLeave] = useState<number>(0);
  const [formLeaveDetails, setFormLeaveDetails] = useState<string>("");
  const [formRatePerDay, setFormRatePerDay] = useState<number>(vendorConfig.defaultDailyRate || 20);
  const [formExtraGarlands, setFormExtraGarlands] = useState<number>(0);
  const [formExtraRate, setFormExtraRate] = useState<number>(vendorConfig.defaultDailyRate || 20);
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(0);
  const [formPaidDate, setFormPaidDate] = useState<string>("");
  const [formRemarks, setFormRemarks] = useState<string>("");
  const [formPaymentMode, setFormPaymentMode] = useState<string>("GPay (UPI)");
  const [formTxnRef, setFormTxnRef] = useState<string>("");
  const [autoSundayDates, setAutoSundayDates] = useState<string[]>([]);

  // Quick Pay State
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payModeInput, setPayModeInput] = useState<string>("GPay (UPI)");
  const [payRefInput, setPayRefInput] = useState<string>("");

  // Recalculate Totals
  const totalBill = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPaid = rows.reduce((sum, r) => sum + (Number(r.paidAmount) || 0), 0);
  const totalDue = Math.max(0, totalBill - totalPaid);
  const totalWorkingDays = rows.reduce((sum, r) => {
    const wd = (Number(r.daysExcludeSundays) || 0) - (Number(r.otherLeave) || 0);
    return sum + Math.max(0, wd);
  }, 0);
  const totalLeavesExcluded = rows.reduce((sum, r) => sum + (Number(r.otherLeave) || 0), 0);
  const activeUpiId = vendorConfig.upiId || "9446669832-2@ybl";

  const handleUpdateRows = (newRows: PoovMalaBillRow[]) => {
    setRows(newRows);
    savePoovMalaRows(newRows);
  };

  const handleSaveVendorConfig = (cfg: PoovMalaVendorConfig) => {
    setVendorConfig(cfg);
    savePoovMalaConfig(cfg);
    setIsVendorEditOpen(false);
  };

  // Synchronize form calculation whenever Start Date or End Date changes
  const handleDateRangeChange = (startStr: string, endStr: string, otherLeaveVal = formOtherLeave, rateVal = formRatePerDay, extraGarlandsVal = formExtraGarlands) => {
    setFormStartDate(startStr);
    setFormEndDate(endStr);

    if (startStr && endStr) {
      const analysis = calculatePoovMalaPeriodDays(startStr, endStr);
      if (analysis.isValid) {
        setFormTotalCalendarDays(analysis.totalDays);
        setFormSundaysCount(analysis.sundays);
        setFormDaysExcludeSundays(analysis.workingDays);
        setAutoSundayDates(analysis.sundayDates);

        const netWorkingDays = Math.max(0, analysis.workingDays - Number(otherLeaveVal));
        const calculatedAmount = (netWorkingDays * Number(rateVal)) + (Number(extraGarlandsVal) * Number(formExtraRate || rateVal));
        setFormAmount(calculatedAmount);
      }
    }
  };

  const handleOtherLeaveChange = (leaveVal: number) => {
    setFormOtherLeave(leaveVal);
    const netWorkingDays = Math.max(0, formDaysExcludeSundays - Number(leaveVal));
    const calculatedAmount = (netWorkingDays * Number(formRatePerDay)) + (Number(formExtraGarlands) * Number(formExtraRate || formRatePerDay));
    setFormAmount(calculatedAmount);
  };

  const handleRateChange = (rateVal: number) => {
    setFormRatePerDay(rateVal);
    const netWorkingDays = Math.max(0, formDaysExcludeSundays - Number(formOtherLeave));
    const calculatedAmount = (netWorkingDays * Number(rateVal)) + (Number(formExtraGarlands) * Number(formExtraRate || rateVal));
    setFormAmount(calculatedAmount);
  };

  // Open Add Modal with Clean Defaults or from specific row
  const handleOpenAddModal = (rowToEdit?: PoovMalaBillRow) => {
    if (rowToEdit) {
      setEditingRow(rowToEdit);
      setFormStartDate(rowToEdit.dateFrom);
      setFormEndDate(rowToEdit.dateTo);
      setFormTotalCalendarDays(rowToEdit.totalCalendarDays || 0);
      setFormSundaysCount(rowToEdit.sundaysCount || 0);
      setFormDaysExcludeSundays(rowToEdit.daysExcludeSundays);
      setFormOtherLeave(rowToEdit.otherLeave);
      setFormLeaveDetails(rowToEdit.leaveDetails || rowToEdit.remarks || "");
      setFormRatePerDay(rowToEdit.ratePerDay);
      setFormExtraGarlands(rowToEdit.extraGarlands || 0);
      setFormExtraRate(rowToEdit.extraGarlandsRate || rowToEdit.ratePerDay);
      setFormAmount(rowToEdit.amount);
      setFormPaidAmount(rowToEdit.paidAmount);
      setFormPaidDate(rowToEdit.paidDate || "");
      setFormRemarks(rowToEdit.remarks || "");
      setFormPaymentMode(rowToEdit.paymentMode || "GPay (UPI)");
      setFormTxnRef(rowToEdit.transactionRef || "");

      const analysis = calculatePoovMalaPeriodDays(rowToEdit.dateFrom, rowToEdit.dateTo);
      if (analysis.isValid) {
        setAutoSundayDates(analysis.sundayDates);
      }
    } else {
      setEditingRow(null);
      setFormStartDate("");
      setFormEndDate("");
      setFormTotalCalendarDays(0);
      setFormSundaysCount(0);
      setFormDaysExcludeSundays(0);
      setFormOtherLeave(0);
      setFormLeaveDetails("");
      setFormRatePerDay(vendorConfig.defaultDailyRate || 20);
      setFormExtraGarlands(0);
      setFormExtraRate(vendorConfig.defaultDailyRate || 20);
      setFormAmount(0);
      setFormPaidAmount(0);
      setFormPaidDate("");
      setFormRemarks("");
      setFormPaymentMode("GPay (UPI)");
      setFormTxnRef("");
      setAutoSundayDates([]);
    }
    setIsAddModalOpen(true);
  };

  const handleSaveRow = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = Number(formRatePerDay) || 20;
    const daysExclSun = Number(formDaysExcludeSundays) || 0;
    const otherLeave = Number(formOtherLeave) || 0;
    const extraGarlands = Number(formExtraGarlands) || 0;
    const extraRate = Number(formExtraRate) || rate;
    const netWorkingDays = Math.max(0, daysExclSun - otherLeave);
    const finalAmount = (netWorkingDays * rate) + (extraGarlands * extraRate);
    const paid = Number(formPaidAmount) || 0;
    
    let status: "PAYMENT COMPLETED" | "PENDING" | "PARTIAL" = "PENDING";
    if (paid >= finalAmount && finalAmount > 0) {
      status = "PAYMENT COMPLETED";
    } else if (paid > 0 && paid < finalAmount) {
      status = "PARTIAL";
    }

    const startParsed = parseDateFlexible(formStartDate);
    const endParsed = parseDateFlexible(formEndDate);
    const formattedFrom = startParsed ? formatDateToDMY(startParsed) : formStartDate;
    const formattedTo = endParsed ? formatDateToDMY(endParsed) : formEndDate;

    const rowToSave: PoovMalaBillRow = {
      id: editingRow ? editingRow.id : `PM-${Date.now().toString().slice(-6)}`,
      dateFrom: formattedFrom || "01-01-2026",
      dateTo: formattedTo || "31-01-2026",
      totalCalendarDays: formTotalCalendarDays || (daysExclSun + formSundaysCount),
      sundaysCount: formSundaysCount,
      daysExcludeSundays: daysExclSun,
      otherLeave: otherLeave,
      leaveDetails: formLeaveDetails.trim() || (otherLeave > 0 ? `${otherLeave} Day(s) Leave` : ""),
      netWorkingDays: netWorkingDays,
      ratePerDay: rate,
      extraGarlands: extraGarlands,
      extraGarlandsRate: extraRate,
      amount: finalAmount,
      paidAmount: paid,
      paidDate: formPaidDate || (paid > 0 ? new Date().toLocaleDateString("en-GB") : ""),
      remarks: formRemarks.trim() || formLeaveDetails.trim() || "",
      status: status,
      paymentMode: formPaymentMode || "GPay (UPI)",
      transactionRef: formTxnRef || ""
    };

    if (editingRow) {
      handleUpdateRows(rows.map((r) => (r.id === editingRow.id ? rowToSave : r)));
    } else {
      handleUpdateRows([...rows, rowToSave]);
    }

    setIsAddModalOpen(false);
    setEditingRow(null);
  };

  const handleConfirmDeleteRow = () => {
    if (!rowToDelete) return;
    handleUpdateRows(rows.filter((r) => r.id !== rowToDelete.id));
    setRowToDelete(null);
  };

  const handleConfirmClearAll = () => {
    handleUpdateRows([]);
    setIsClearAllModalOpen(false);
  };

  // WhatsApp Share Single Row
  const handleShareRowViaWhatsApp = (row: PoovMalaBillRow) => {
    const text = generatePoovMalaWhatsAppMessage(row, vendorConfig);
    shareViaWhatsApp({ phone: vendorConfig.gpayNumber, text });
  };

  // WhatsApp Share Entire Summary
  const handleShareFullSummaryViaWhatsApp = () => {
    if (rows.length === 0) {
      alert("പട്ടികയിൽ എൻട്രികൾ ഒന്നുമില്ല. ദയവായി ആദ്യം ഒരു ബിൽ കാലാവധി ചേർക്കുക.");
      return;
    }
    const text = generatePoovMalaSummaryWhatsAppMessage(rows, vendorConfig);
    shareViaWhatsApp({ phone: vendorConfig.gpayNumber, text });
  };

  const handleOpenPayModal = (row: PoovMalaBillRow) => {
    setPayingRow(row);
    const due = Math.max(0, row.amount - row.paidAmount);
    setPayAmountInput(due > 0 ? due : row.amount);
    setPayDateInput(new Date().toISOString().split("T")[0]);
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!payingRow) return;
    const addedPaid = Number(payAmountInput) || 0;
    const newPaidTotal = (payingRow.paidAmount || 0) + addedPaid;
    const status = newPaidTotal >= payingRow.amount ? "PAYMENT COMPLETED" : newPaidTotal > 0 ? "PARTIAL" : "PENDING";
    
    const formattedDate = new Date(payDateInput).toLocaleDateString("en-GB");

    const updated = rows.map((r) => {
      if (r.id === payingRow.id) {
        return {
          ...r,
          paidAmount: newPaidTotal,
          paidDate: formattedDate,
          status: status,
          paymentMode: payModeInput,
          transactionRef: payRefInput || r.transactionRef
        };
      }
      return r;
    });

    handleUpdateRows(updated);
    setIsPayModalOpen(false);
    setPayingRow(null);
  };

  const handleOpenQrModal = (row?: PoovMalaBillRow, defaultAmt?: number) => {
    if (row) {
      setActiveQrRow(row);
      const due = Math.max(0, row.amount - row.paidAmount);
      setQrAmount(due > 0 ? due : row.amount);
      setQrNote(`Poov Mala Bill (${row.dateFrom} - ${row.dateTo})`);
    } else {
      setActiveQrRow(null);
      setQrAmount(defaultAmt !== undefined ? defaultAmt : totalDue);
      setQrNote("Poov Mala Ledger Payment");
    }
    setIsQrModalOpen(true);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div id="poov-mala-dashboard-container" className="space-y-6">
      {/* Top Banner & Action Header - Executive Dark Blue */}
      <div id="poov-mala-header-card" className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#071739] via-[#0d2757] to-[#091b40] border border-blue-500/40 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600/30 border border-blue-400/50 text-blue-200 shadow-inner shrink-0">
            <Sparkles className="w-7 h-7 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 uppercase">
                PROFESSIONAL CALENDAR LEDGER
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                RATE: ₹{vendorConfig.defaultDailyRate}/DAY
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/30 text-cyan-200 border border-cyan-400/40">
                UPI ID: {activeUpiId}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1.5 flex items-center gap-2 flex-wrap">
              <span>പൂവ് മാല ബിൽ & പേയ്‌മെന്റുകൾ</span>
              <span className="text-sm font-semibold text-cyan-200/90 font-mono">({vendorConfig.vendorName})</span>
            </h2>
            <p className="text-xs md:text-sm text-blue-100/80 mt-0.5">
              നിശ്ചിത തീയതികളിൽ നിന്നുള്ള ഞായറാഴ്ചകളും മറ്റ് അവധികളും ഒഴിവാക്കി കൃത്യമായ ബിൽ കണക്കാക്കലും UPI / QR കോഡ് പേയ്‌മെന്റും.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scan & Pay QR Code */}
          <button
            id="poov-mala-scan-pay-btn"
            onClick={() => handleOpenQrModal(undefined, totalDue > 0 ? totalDue : 0)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg hover:shadow-cyan-500/30 cursor-pointer"
            title="Scan QR Code to Pay via UPI"
          >
            <ScanLine className="w-4 h-4 text-white" />
            <span>സ്കാൻ & പേ UPI (QR Code)</span>
          </button>

          {/* WhatsApp Full Summary Share */}
          <button
            id="poov-mala-share-summary-btn"
            onClick={handleShareFullSummaryViaWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer"
            title="Send Full Statement to WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-emerald-300" />
            <span>വാട്സാപ്പ് സ്റ്റേറ്റ്‌മെന്റ്</span>
          </button>

          {/* Print */}
          <button
            id="poov-mala-print-btn"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition shadow-sm cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-cyan-300" />
            <span>പ്രിന്റ്</span>
          </button>

          {/* Add Period */}
          <button
            id="poov-mala-add-period-btn"
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black text-xs transition shadow-lg hover:shadow-blue-500/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>പുതിയ ബിൽ കാലാവധി (Add Period)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Dark Blue Theme */}
      <div id="poov-mala-kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Bill */}
        <div id="kpi-total-bill" className="p-4 rounded-2xl bg-[#091b3b] border border-blue-600/40 shadow-xl">
          <div className="flex items-center justify-between text-xs text-blue-200 font-bold mb-1">
            <span>ആകെ ബിൽ തുക (TOTAL BILL)</span>
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            ₹{totalBill.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-blue-200/80 mt-1 font-mono">
            {rows.length} കാലയളവുകൾ • {totalWorkingDays} പ്രവർത്തി ദിനങ്ങൾ
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div id="kpi-total-paid" className="p-4 rounded-2xl bg-[#072522] border border-emerald-500/40 shadow-xl">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-bold mb-1">
            <span>നൽകിയ തുക (PAID AMOUNT)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono tracking-tight">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-200/80 mt-1 font-mono">
            {totalPaid > 0 ? "UPI / GPay വഴി നൽകിയത്" : "പേയ്‌മെന്റുകൾ രേഖപ്പെടുത്തിയിട്ടില്ല"}
          </div>
        </div>

        {/* Card 3: Due Balance */}
        <div id="kpi-total-due" className="p-4 rounded-2xl bg-[#280c1d] border border-rose-500/40 shadow-xl">
          <div className="flex items-center justify-between text-xs text-rose-300 font-bold mb-1">
            <span>ബാക്കി നൽകാനുള്ളത് (BALANCE DUE)</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300 font-mono tracking-tight">
            ₹{totalDue.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-rose-200/80 mt-1">
            {totalDue === 0 ? "കുടിശ്ശികയില്ല (Fully Settled) ✓" : "നൽകേണ്ട ബാക്കി തുക"}
          </div>
        </div>

        {/* Card 4: Vendor & UPI Info */}
        <div id="kpi-vendor-info" className="p-4 rounded-2xl bg-[#081a38] border border-cyan-500/40 shadow-xl">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-bold mb-1">
            <span>വെണ്ടർ & UPI വിവരങ്ങൾ</span>
            <button
              onClick={() => setIsVendorEditOpen(true)}
              className="text-[10px] text-cyan-300 hover:text-white underline cursor-pointer"
            >
              തിരുത്തുക
            </button>
          </div>
          <div className="text-sm font-black text-white truncate">
            {vendorConfig.vendorName}
          </div>
          <div className="mt-1 pt-1 border-t border-cyan-500/20 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-cyan-100">UPI: {activeUpiId}</span>
              <button
                onClick={() => copyToClipboard(activeUpiId, "upi")}
                className="p-1 text-xs text-cyan-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedText === "upi" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-blue-200/80 font-mono">
              <span>GPay: {vendorConfig.gpayNumber}</span>
              <button
                onClick={() => handleOpenQrModal(undefined, totalDue)}
                className="text-cyan-300 hover:text-white font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <QrCode className="w-3 h-3" />
                <span>QR കാട്ടുക</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SPREADSHEET TABLE: DARK BLUE COLOR & WHITE THEME LETTERS */}
      <div id="poov-mala-table-wrapper" className="rounded-3xl border-2 border-blue-600/70 bg-[#061224] shadow-2xl overflow-hidden">
        {/* Table Title Bar - Dark Blue Theme */}
        <div className="bg-gradient-to-r from-[#0a1f44] via-[#0e2c60] to-[#0a1f44] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-white font-black border-b-2 border-blue-500/80">
          <div className="flex items-center gap-2.5 text-sm md:text-base tracking-wider uppercase">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <span className="text-white">പൂവ് മാല പ്രതിദിന ബിൽ കാൽക്കുലേഷൻ ലെഡ്ജർ (RATE: ₹{vendorConfig.defaultDailyRate}/MALA)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-blue-950 text-cyan-300 border border-blue-500/40 px-3 py-1 rounded-full">
              {rows.length} കാലയളവുകൾ
            </span>
            <button
              onClick={() => handleOpenQrModal(undefined, totalDue)}
              className="text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1 shadow-md"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR സ്കാൻ</span>
            </button>
            {rows.length > 0 && (
              <button
                onClick={() => setIsClearAllModalOpen(true)}
                className="text-[11px] bg-rose-600/80 hover:bg-rose-600 text-white font-bold px-2.5 py-1 rounded-full transition cursor-pointer"
                title="Clear all rows"
              >
                ക്ലിയർ
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs md:text-sm">
            <thead>
              {/* Row 1 Header: Dark Blue Background & White Letters */}
              <tr className="bg-[#0c234a] text-white font-black uppercase text-center border-b-2 border-blue-500 divide-x divide-blue-700/70 text-[11px] md:text-xs">
                <th colSpan={2} className="py-3 px-3 border-b border-blue-600 text-white tracking-wider">
                  തീയതി (DATE RANGE)
                </th>
                <th rowSpan={2} className="py-3 px-3 w-28 text-white tracking-wider">
                  ഞായർ ഒഴികെ<br />(EXCL. SUN)
                </th>
                <th rowSpan={2} className="py-3 px-3 w-24 text-white tracking-wider">
                  മറ്റ് അവധി<br />(LEAVES)
                </th>
                <th rowSpan={2} className="py-3 px-3 w-32 bg-[#122e5e] text-white font-black tracking-wider">
                  പ്രവർത്തന ദിനങ്ങൾ<br />X ₹{vendorConfig.defaultDailyRate} (AMOUNT)
                </th>
                <th rowSpan={2} className="py-3 px-3 w-28 text-white tracking-wider">
                  നൽകിയ തുക<br />(PAID)
                </th>
                <th rowSpan={2} className="py-3 px-3 w-28 text-white tracking-wider">
                  നൽകിയ തീയതി<br />(PAID DATE)
                </th>
                <th rowSpan={2} className="py-3 px-4 text-left text-white tracking-wider">
                  അവധി വിശദാംശങ്ങൾ & കുറിപ്പ് (LEAVE DETAILS / REMARKS)
                </th>
                <th rowSpan={2} className="py-3 px-3 w-36 text-white tracking-wider">
                  സ്റ്റാറ്റസ് (STATUS)
                </th>
                <th rowSpan={2} className="py-3 px-2 w-36 text-white tracking-wider print:hidden">
                  ACTIONS (നടപടികൾ)
                </th>
              </tr>
              {/* Row 2 Sub-Headers: Dark Blue */}
              <tr className="bg-[#0e2854] text-white font-black uppercase text-center border-b-2 border-blue-500 divide-x divide-blue-700/70 text-[11px]">
                <th className="py-1.5 px-3 w-28 text-cyan-200">FROM (തുടക്കം)</th>
                <th className="py-1.5 px-3 w-28 text-cyan-200">TO (അവസാനം)</th>
              </tr>
            </thead>

            {/* Table Body: Dark Blue Theme with White Letters */}
            <tbody className="divide-y divide-blue-900/60 text-white font-mono bg-[#071329]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 px-4 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 rounded-full bg-blue-900/40 border border-blue-500/40 text-cyan-300">
                        <CalendarRange className="w-8 h-8" />
                      </div>
                      <div className="text-base font-bold text-white">ബിൽ എൻട്രികൾ ഒന്നും ചേർത്തിട്ടില്ല</div>
                      <p className="text-xs text-blue-200/80 max-w-md">
                        മുകളിലെ <b>"പുതിയ ബിൽ കാലാവധി (Add Period)"</b> ബട്ടൺ ക്ലിക്ക് ചെയ്ത് തീയതി നൽകുക. ഞായറാഴ്ചകളും മറ്റ് അവധികളും സിസ്റ്റം സ്വയം കണക്കുകൂട്ടി ബിൽ തുക തയ്യാറാക്കും.
                      </p>
                      <button
                        onClick={() => handleOpenAddModal()}
                        className="mt-2 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs hover:from-blue-400 hover:to-indigo-500 transition cursor-pointer shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ആദ്യത്തെ ബിൽ കാലാവധി ചേർക്കുക</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const isPaidCompleted = row.status === "PAYMENT COMPLETED";
                  const isPartial = row.status === "PARTIAL";
                  const netDays = (row.daysExcludeSundays || 0) - (row.otherLeave || 0);
                  const rowDue = Math.max(0, row.amount - row.paidAmount);
                  const isEven = index % 2 === 0;

                  return (
                    <tr
                      key={row.id}
                      id={`poov-mala-row-${row.id}`}
                      className={`${
                        isEven ? "bg-[#081730]" : "bg-[#0b1e3d]"
                      } hover:bg-blue-900/40 transition divide-x divide-blue-900/50 text-center group`}
                    >
                      {/* FROM DATE - White & Bright Blue */}
                      <td className="py-3.5 px-3 font-bold text-white whitespace-nowrap">
                        {row.dateFrom}
                      </td>

                      {/* TO DATE - White & Bright Blue */}
                      <td className="py-3.5 px-3 font-bold text-white whitespace-nowrap">
                        {row.dateTo}
                      </td>

                      {/* DAYS EXCLUDE SUNDAYS */}
                      <td className="py-3.5 px-3 text-white font-bold bg-blue-950/40">
                        <span className="text-sm font-black text-white">{row.daysExcludeSundays}</span>
                        {row.sundaysCount ? (
                          <span className="block text-[10px] text-blue-200 font-normal">
                            ({row.sundaysCount} ഞായർ ഒഴികെ)
                          </span>
                        ) : null}
                      </td>

                      {/* OTHER LEAVE */}
                      <td className="py-3.5 px-3 font-bold text-white">
                        {row.otherLeave > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 font-black">
                            {row.otherLeave} Day{row.otherLeave > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* AMOUNT - High Contrast White & Gold on Dark Blue */}
                      <td className="py-3.5 px-3 font-black text-cyan-200 bg-blue-950/60 text-base whitespace-nowrap">
                        ₹{row.amount.toLocaleString("en-IN")}
                        <span className="block text-[10px] text-blue-200/70 font-normal">
                          ({netDays} working days × ₹{row.ratePerDay})
                        </span>
                      </td>

                      {/* PAID AMOUNT */}
                      <td className="py-3.5 px-3 font-black text-emerald-300 whitespace-nowrap">
                        {row.paidAmount > 0 ? `₹${row.paidAmount.toLocaleString("en-IN")}` : <span className="text-slate-400">-</span>}
                        {rowDue > 0 && row.paidAmount > 0 && (
                          <span className="block text-[10px] text-rose-300 font-normal">
                            (Due: ₹{rowDue})
                          </span>
                        )}
                      </td>

                      {/* PAID DATE */}
                      <td className="py-3.5 px-3 text-white text-xs whitespace-nowrap">
                        {row.paidDate || <span className="text-slate-400">-</span>}
                      </td>

                      {/* LEAVE DETAILS & REMARKS - Clean White Text */}
                      <td className="py-3.5 px-4 text-left font-sans text-xs text-white">
                        {row.leaveDetails || row.remarks ? (
                          <div className="space-y-0.5">
                            {row.leaveDetails && (
                              <div className="font-bold text-cyan-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                                <span>{row.leaveDetails}</span>
                              </div>
                            )}
                            {row.remarks && row.remarks !== row.leaveDetails && (
                              <div className="text-[11px] text-blue-100 italic">{row.remarks}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">അവധികൾ രേഖപ്പെടുത്തിയിട്ടില്ല</span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="py-3.5 px-3">
                        <div className="flex justify-center">
                          {isPaidCompleted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-md">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              PAID ✓
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/30 text-amber-200 border border-amber-400/50">
                              <Clock className="w-3 h-3" />
                              PARTIAL (₹{rowDue})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-200 border border-rose-400/50">
                              PENDING (₹{row.amount})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-2 print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          {/* QR Code Scan & Pay for this specific row */}
                          <button
                            id={`btn-qr-${row.id}`}
                            onClick={() => handleOpenQrModal(row)}
                            className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 hover:text-white transition cursor-pointer"
                            title="QR കോഡ് വഴി സ്കാൻ ചെയ്തു പണമടയ്ക്കുക (Scan QR to Pay)"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>

                          {/* WhatsApp Share Button */}
                          <button
                            id={`btn-whatsapp-${row.id}`}
                            onClick={() => handleShareRowViaWhatsApp(row)}
                            className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white transition cursor-pointer"
                            title="വാട്സാപ്പ് വഴി അയക്കുക (Send WhatsApp)"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment */}
                          {!isPaidCompleted && (
                            <button
                              id={`btn-pay-${row.id}`}
                              onClick={() => handleOpenPayModal(row)}
                              className="p-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 hover:text-white transition cursor-pointer"
                              title="പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക / Record Payment"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Button */}
                          <button
                            id={`btn-edit-${row.id}`}
                            onClick={() => handleOpenAddModal(row)}
                            className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 hover:text-white transition cursor-pointer"
                            title="എഡിറ്റ് ചെയ്യുക (Edit Row)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            id={`btn-delete-${row.id}`}
                            onClick={() => setRowToDelete(row)}
                            className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white transition cursor-pointer"
                            title="ഡിലീറ്റ് ചെയ്യുക (Delete Row)"
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

            {/* SPREADSHEET SUMMARY FOOTER - Dark Blue with High-Contrast White Letters */}
            {rows.length > 0 && (
              <tfoot>
                {/* BILL ROW */}
                <tr className="bg-[#0d2757] text-white font-black divide-x-2 divide-blue-700 border-t-2 border-blue-500">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs md:text-sm font-black text-white">
                    ആകെ ബിൽ തുക (TOTAL BILL)
                  </td>
                  <td className="py-3 px-3 text-center text-base font-black font-mono text-cyan-300">
                    ₹{totalBill.toLocaleString("en-IN")}
                  </td>
                  <td colSpan={5} className="py-3 px-3 bg-[#0a1e42] font-mono text-xs font-bold text-white">
                    {totalWorkingDays} ആകെ പ്രവർത്തന ദിനങ്ങൾ (Sundays & {totalLeavesExcluded} അവധികൾ കഴിച്ചു)
                  </td>
                </tr>

                {/* PAID ROW */}
                <tr className="bg-[#0d2757] text-white font-black divide-x-2 divide-blue-700">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs md:text-sm font-black text-emerald-300">
                    ആകെ നൽകിയത് (TOTAL PAID)
                  </td>
                  <td className="py-3 px-3 text-center text-base font-black font-mono text-emerald-300">
                    ₹{totalPaid.toLocaleString("en-IN")}
                  </td>
                  <td colSpan={5} className="py-3 px-3 bg-[#0a1e42] font-mono text-xs font-bold text-emerald-200">
                    GPay / UPI (ID: {activeUpiId}) വഴി നൽകിയത്
                  </td>
                </tr>

                {/* DUE ROW */}
                <tr className="bg-[#0d2757] text-white font-black divide-x-2 divide-blue-700 border-b-2 border-blue-500">
                  <td colSpan={4} className="py-3 px-4 text-right uppercase text-xs md:text-sm font-black text-rose-300">
                    ബാക്കി കുടിശ്ശിക (TOTAL DUE)
                  </td>
                  <td className="py-3 px-3 text-center text-base font-black font-mono text-rose-300">
                    ₹{totalDue.toLocaleString("en-IN")}
                  </td>
                  <td colSpan={5} className="py-3 px-3 bg-[#0a1e42] font-mono text-xs font-black text-rose-200">
                    {totalDue > 0 ? `അടയ്ക്കാനുള്ള ബാക്കി തുക: ₹${totalDue.toLocaleString("en-IN")}` : "പൂർണ്ണമായും സെറ്റിൽ ചെയ്തു (Fully Settled)"}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* BOTTOM VENDOR & UPI SCAN PAYMENT SIGNATURE BAR */}
        <div className="p-6 bg-gradient-to-r from-[#071738] via-[#0b214d] to-[#071738] border-t-2 border-blue-500/70 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1.5">
            <div className="text-base font-black text-white font-mono tracking-wider uppercase flex items-center justify-center md:justify-start gap-2">
              <span>{vendorConfig.vendorName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-cyan-300 border border-blue-400/40">
                OFFICIAL VENDOR
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-blue-100 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black">UPI ID</span>
              <span className="text-sm font-black text-white">{activeUpiId}</span>
              <button
                onClick={() => copyToClipboard(activeUpiId, "upi-bar")}
                className="p-1 rounded bg-blue-500/20 hover:bg-blue-500/40 text-cyan-300 transition cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedText === "upi-bar" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-blue-300">|</span>
              <span className="text-blue-200">GPay: {vendorConfig.gpayNumber}</span>
            </div>
            {vendorConfig.address && (
              <div className="text-[11px] text-blue-200/70">{vendorConfig.address}</div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap print:hidden">
            <button
              onClick={() => handleOpenQrModal(undefined, totalDue)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs transition shadow-lg hover:shadow-cyan-500/30 cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-white" />
              <span>QR കോഡ് സ്കാൻ ചെയ്തു പണമടയ്ക്കുക</span>
            </button>

            <button
              onClick={handleShareFullSummaryViaWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400 text-emerald-200 font-bold text-xs transition cursor-pointer shadow-lg"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>വാട്സാപ്പ് സ്റ്റേറ്റ്‌മെന്റ്</span>
            </button>

            <button
              onClick={() => setIsVendorEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>വെണ്ടർ വിവരങ്ങൾ മാറ്റുക</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: QR CODE SCAN & PAY VIA UPI - Full Featured for 9446669832-2@ybl */}
      {isQrModalOpen && (
        <div id="modal-gpay-qr" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-[#081734] border-2 border-cyan-500/50 p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
              <div className="flex items-center gap-2 text-left">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>UPI QR കോഡ് സ്കാൻ & പേ</span>
                  </h3>
                  <p className="text-[11px] text-cyan-200/80">
                    Google Pay, PhonePe, Paytm, BHIM വഴി നേരിട്ട് പണമടയ്ക്കാം
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR Code Canvas with Scanning Grid Guides */}
            <div className="relative p-5 bg-white rounded-3xl inline-block shadow-2xl mx-auto border-4 border-cyan-400">
              {/* Corner Viewfinder Indicators */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-600"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-600"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-600"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-600"></div>

              <img
                src={generateUpiQrUrl(activeUpiId, vendorConfig.vendorName, qrAmount, qrNote)}
                alt={`UPI QR Code for ${activeUpiId}`}
                className="w-56 h-56 object-contain block mx-auto"
              />

              <div className="mt-2 text-[10px] font-mono font-black text-slate-800 tracking-wider">
                SCAN WITH ANY UPI APP
              </div>
            </div>

            {/* Payee Details & Live Amount Input */}
            <div className="space-y-2 text-center">
              <div className="text-base font-black text-white font-mono">{vendorConfig.vendorName}</div>
              
              {/* UPI ID Badge with 1-Click Copy */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950 border border-cyan-400/40 shadow-inner">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-black text-cyan-200">{activeUpiId}</span>
                <button
                  onClick={() => copyToClipboard(activeUpiId, "qr-modal-upi")}
                  className="p-1 rounded text-cyan-300 hover:text-white transition cursor-pointer"
                  title="Copy UPI ID"
                >
                  {copiedText === "qr-modal-upi" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Amount Customizer */}
              <div className="p-3 rounded-2xl bg-[#0c224b] border border-blue-500/30 text-left space-y-1.5">
                <label className="block text-[11px] font-bold text-cyan-200">
                  നൽകേണ്ട തുക (Amount to Pay ₹)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-cyan-300 font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={qrAmount}
                      onChange={(e) => setQrAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-black/40 border border-cyan-400/40 text-white font-mono font-black text-base focus:border-cyan-300 focus:outline-none"
                    />
                  </div>
                  {totalDue > 0 && (
                    <button
                      type="button"
                      onClick={() => setQrAmount(totalDue)}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold transition border border-rose-400/30 cursor-pointer whitespace-nowrap"
                    >
                      Due: ₹{totalDue}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Direct UPI Deep Link */}
            <div className="space-y-2 pt-1">
              <a
                href={generateUpiUri(activeUpiId, vendorConfig.vendorName, qrAmount, qrNote)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI ആപ്പിൽ നേരിട്ട് തുറക്കുക (Open in GPay / PhonePe)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Record Payment shortcut */}
              {activeQrRow && (
                <button
                  onClick={() => {
                    setIsQrModalOpen(false);
                    handleOpenPayModal(activeQrRow);
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-cyan-200 font-bold text-xs transition cursor-pointer"
                >
                  പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക (Mark as Paid in Ledger)
                </button>
              )}

              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                അടയ്ക്കുക (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PERIOD ROW */}
      {isAddModalOpen && (
        <div id="modal-add-poov-mala-row" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-[#081734] border-2 border-blue-500/50 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingRow ? "ബിൽ കാലാവധി തിരുത്തുക (Edit Period)" : "പുതിയ ബിൽ കാലാവധി ചേർക്കുക (Add Period)"}
                  </h3>
                  <p className="text-xs text-blue-200/80">
                    തീയതി നൽകിയാൽ ഞായറാഴ്ചകളും പ്രവർത്തന ദിനങ്ങളും സിസ്റ്റം സ്വയം കണക്കാക്കും
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="space-y-4">
              {/* Date From & Date To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    തുടങ്ങുന്ന തീയതി (FROM DATE) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate.includes("-") && formStartDate.split("-")[0].length === 4 ? formStartDate : ""}
                    onChange={(e) => handleDateRangeChange(e.target.value, formEndDate)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="or type DD-MM-YYYY (e.g. 01-01-2026)"
                    value={formStartDate}
                    onChange={(e) => handleDateRangeChange(e.target.value, formEndDate)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none placeholder:text-blue-300/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    അവസാനിക്കുന്ന തീയതി (TO DATE) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate.includes("-") && formEndDate.split("-")[0].length === 4 ? formEndDate : ""}
                    onChange={(e) => handleDateRangeChange(formStartDate, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="or type DD-MM-YYYY (e.g. 31-03-2026)"
                    value={formEndDate}
                    onChange={(e) => handleDateRangeChange(formStartDate, e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none placeholder:text-blue-300/40"
                  />
                </div>
              </div>

              {/* Automatic Calculation Preview Banner */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-blue-500/30 text-xs font-mono space-y-1.5">
                <div className="flex items-center justify-between text-cyan-300 font-bold border-b border-blue-500/20 pb-1">
                  <span>📅 ഓട്ടോമാറ്റിക് കലണ്ടർ കണക്കുകൂട്ടൽ:</span>
                  <span>ആകെ ദിവസങ്ങൾ: {formTotalCalendarDays || (formDaysExcludeSundays + formSundaysCount)} Days</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-xl bg-white/5">
                    <div className="text-[10px] text-blue-200/70">ഞായറാഴ്ചകൾ</div>
                    <div className="text-sm font-black text-rose-300">{formSundaysCount} Days</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white/5">
                    <div className="text-[10px] text-blue-200/70">ഞായർ ഒഴികെ</div>
                    <div className="text-sm font-black text-cyan-300">{formDaysExcludeSundays} Days</div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/40">
                    <div className="text-[10px] text-cyan-200">നെറ്റ് പ്രവർത്തി ദിനം</div>
                    <div className="text-sm font-black text-white">
                      {Math.max(0, formDaysExcludeSundays - formOtherLeave)} Days
                    </div>
                  </div>
                </div>
                {autoSundayDates.length > 0 && (
                  <div className="text-[10px] text-blue-200/70 pt-1">
                    ഒഴിവാക്കിയ ഞായറാഴ്ചകൾ: {autoSundayDates.slice(0, 5).join(", ")}
                    {autoSundayDates.length > 5 ? ` (+${autoSundayDates.length - 5} more)` : ""}
                  </div>
                )}
              </div>

              {/* Days Exclude Sundays & Other Leave */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    ഞായറാഴ്ചകൾ ഒഴികെയുള്ള ദിവസങ്ങൾ (Days Exclude Sundays) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formDaysExcludeSundays}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormDaysExcludeSundays(val);
                      const net = Math.max(0, val - formOtherLeave);
                      setFormAmount((net * formRatePerDay) + (formExtraGarlands * formExtraRate));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    മറ്റ് അവധികൾ (Other Leave Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formOtherLeave}
                    onChange={(e) => handleOtherLeaveChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-cyan-400/40 text-cyan-200 font-mono text-xs font-black focus:border-cyan-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Leave Details / Reason input */}
              <div>
                <label className="block text-xs font-bold text-cyan-200 mb-1">
                  അവധി വിശദാംശങ്ങൾ (Leave Details / Specific Dates & Reason)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 DAY TRADE HARTHAL LEAVE, 9-4-26 ELECTION LEAVE, POOJA HOLIDAY"
                  value={formLeaveDetails}
                  onChange={(e) => setFormLeaveDetails(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white text-xs focus:border-cyan-300 focus:outline-none"
                />
              </div>

              {/* Rate Per Day & Calculated Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    പ്രതിദിന നിരക്ക് (Rate per Mala ₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formRatePerDay}
                    onChange={(e) => handleRateChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-200 mb-1">
                    ആകെ കണക്കാക്കിയ തുക (Calculated Amount ₹)
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-blue-600/30 border border-blue-400/50 text-cyan-200 font-mono font-black text-sm">
                    ₹{formAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Paid Amount & Paid Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-300 mb-1">
                    നൽകിയ തുക (Paid Amount ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formPaidAmount}
                    onChange={(e) => setFormPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    നൽകിയ തീയതി (Paid Date)
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY or DD-MM-YYYY"
                    value={formPaidDate}
                    onChange={(e) => setFormPaidDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Mode & Txn Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    പേയ്‌മെന്റ് രീതി (Payment Mode)
                  </label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#091b3b] border border-blue-400/40 text-white text-xs focus:border-cyan-300 focus:outline-none"
                  >
                    <option value={`UPI (${activeUpiId})`}>UPI ({activeUpiId})</option>
                    <option value="GPay (9446669832)">GPay (9446669832)</option>
                    <option value="PhonePe (UPI)">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Direct Cash">Direct Cash (പണം)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    UPI / UTR Reference No. (ഓപ്ഷണൽ)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/608933214590"
                    value={formTxnRef}
                    onChange={(e) => setFormTxnRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white text-xs font-mono focus:border-cyan-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  മറ്റ് കുറിപ്പുകൾ (General Remarks)
                </label>
                <input
                  type="text"
                  placeholder="Additional notes..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white text-xs focus:border-cyan-300 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-500/20">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs transition shadow-lg hover:shadow-blue-500/30 cursor-pointer"
                >
                  {editingRow ? "മാറ്റങ്ങൾ സേവ് ചെയ്യുക ✓" : "പട്ടികയിൽ ചേർക്കുക ✓"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK PAYMENT RECORD */}
      {isPayModalOpen && payingRow && (
        <div id="modal-pay-poov-mala" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#081734] border-2 border-emerald-500/50 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">പേയ്‌മെന്റ് രേഖപ്പെടുത്തുക</h3>
                  <p className="text-xs text-emerald-200/80 font-mono">
                    {payingRow.dateFrom} to {payingRow.dateTo} (Bill: ₹{payingRow.amount})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1">
                  നൽകുന്ന തുക (Amount ₹) *
                </label>
                <input
                  type="number"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-emerald-400/40 text-emerald-300 font-mono font-black text-lg focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    പേയ്‌മെന്റ് രീതി (Mode)
                  </label>
                  <select
                    value={payModeInput}
                    onChange={(e) => setPayModeInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#091b3b] border border-blue-400/40 text-white text-xs focus:border-emerald-400 focus:outline-none"
                  >
                    <option value={`UPI (${activeUpiId})`}>UPI ({activeUpiId})</option>
                    <option value="GPay (9446669832)">GPay (9446669832)</option>
                    <option value="PhonePe (UPI)">PhonePe</option>
                    <option value="Paytm">Paytm</option>
                    <option value="Direct Cash">Direct Cash (പണം)</option>
                    <option value="Bank Transfer">Bank NEFT/IMPS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-1">
                    തീയതി (Date)
                  </label>
                  <input
                    type="date"
                    value={payDateInput}
                    onChange={(e) => setPayDateInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  UPI / Transaction Reference No. (ഓപ്ഷണൽ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/608933214590"
                  value={payRefInput}
                  onChange={(e) => setPayRefInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white text-xs font-mono focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between">
                <span>UPI Payee: <b>{vendorConfig.vendorName}</b></span>
                <span className="font-mono font-bold text-white">{activeUpiId}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-500/20">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
                >
                  പേയ്‌മെന്റ് സ്ഥിരീകരിക്കുക ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT VENDOR CONFIG */}
      {isVendorEditOpen && (
        <div id="modal-edit-vendor" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#081734] border-2 border-blue-500/50 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
              <h3 className="text-base font-black text-white">വെണ്ടർ ക്രമീകരണങ്ങൾ തിരുത്തുക</h3>
              <button
                onClick={() => setIsVendorEditOpen(false)}
                className="p-1.5 rounded-xl text-slate-300 hover:text-white bg-white/10 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  വെണ്ടറുടെ പേര് (Vendor Name)
                </label>
                <input
                  type="text"
                  value={vendorConfig.vendorName}
                  onChange={(e) => setVendorConfig({ ...vendorConfig, vendorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white text-xs focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-200 mb-1">
                  UPI ID (e.g. 9446669832-2@ybl) *
                </label>
                <input
                  type="text"
                  value={vendorConfig.upiId || ""}
                  onChange={(e) => setVendorConfig({ ...vendorConfig, upiId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-cyan-400/50 text-cyan-200 font-mono text-xs font-bold focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  GPay / മൊബൈൽ നമ്പർ (Mobile / GPay)
                </label>
                <input
                  type="text"
                  value={vendorConfig.gpayNumber}
                  onChange={(e) => setVendorConfig({ ...vendorConfig, gpayNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  സ്ഥിര പ്രതിദിന നിരക്ക് (Default Daily Rate ₹)
                </label>
                <input
                  type="number"
                  value={vendorConfig.defaultDailyRate}
                  onChange={(e) => setVendorConfig({ ...vendorConfig, defaultDailyRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white font-mono text-xs focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  വിലാസം / ലൊക്കേഷൻ (Address)
                </label>
                <input
                  type="text"
                  value={vendorConfig.address || ""}
                  onChange={(e) => setVendorConfig({ ...vendorConfig, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-blue-400/40 text-white text-xs focus:border-cyan-300 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-blue-500/20">
                <button
                  type="button"
                  onClick={() => setIsVendorEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVendorConfig(vendorConfig)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-xs hover:from-blue-400 hover:to-indigo-500 transition shadow-lg cursor-pointer"
                >
                  സേവ് ചെയ്യുക ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* IN-APP DELETE MODAL FOR SINGLE ROW */}
      {rowToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#081734] border-2 border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-blue-500/20 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">പൂവ് മാല റെക്കോർഡ് നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Poov Mala Bill Entry</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-blue-500/30 text-xs space-y-1.5 font-mono">
              <div><span className="text-slate-400">കാലയളവ്:</span> <strong className="text-cyan-300 font-bold">{rowToDelete.dateFrom} - {rowToDelete.dateTo}</strong></div>
              <div><span className="text-slate-400">പ്രവർത്തന ദിനങ്ങൾ:</span> <span className="text-white font-bold">{rowToDelete.netWorkingDays} Days</span></div>
              <div><span className="text-slate-400">ബിൽ തുക:</span> <span className="text-amber-300 font-bold">₹{rowToDelete.amount}</span></div>
              {rowToDelete.paidAmount > 0 && (
                <div><span className="text-slate-400">നൽകിയത്:</span> <span className="text-emerald-300 font-bold">₹{rowToDelete.paidAmount}</span></div>
              )}
            </div>

            <p className="text-xs text-slate-300">
              ഈ കാലയളവിലെ പൂവ് മാല ബിൽ റെക്കോർഡ് പട്ടികയിൽ നിന്നും നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-blue-500/20">
              <button
                type="button"
                onClick={() => setRowToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRow}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                ഡിലീറ്റ് ചെയ്യുക (Yes, Delete)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP MODAL FOR CLEAR ALL ROWS */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#081734] border-2 border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-blue-500/20 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">പട്ടിക പൂർണ്ണമായി ക്ലിയർ ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Clear All Poov Mala Entries</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              പൂവ് മാല ലെഡ്ജറിലെ എല്ലാ ({rows.length}) ബിൽ കാലയളവുകളും പൂർണ്ണമായി നീക്കം ചെയ്യപ്പെടും. ഈ പ്രവർത്തനം മുൻപിലേക്ക് മാറ്റാൻ കഴിയില്ല. തുടരണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-blue-500/20">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                എല്ലാം ക്ലിയർ ചെയ്യുക (Clear All)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
