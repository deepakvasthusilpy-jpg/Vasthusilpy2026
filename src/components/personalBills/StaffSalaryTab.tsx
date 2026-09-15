import React, { useState, useEffect, useMemo } from "react";
import { StaffSalaryRecord } from "../../types";
import {
  loadStaffSalaryRecords,
  saveStaffSalaryRecords,
  generateUpiQrUrl,
  generateUpiUri
} from "../../utils/personalBillsStorage";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  Share2,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  DollarSign,
  Phone,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles,
  Receipt,
  X,
  Send,
  MessageCircle,
  FileSpreadsheet
} from "lucide-react";

const MONTHS_LIST = [
  { id: "January", labelMl: "ജനുവരി", labelEn: "January" },
  { id: "February", labelMl: "ഫെബ്രുവരി", labelEn: "February" },
  { id: "March", labelMl: "മാർച്ച്", labelEn: "March" },
  { id: "April", labelMl: "ഏപ്രിൽ", labelEn: "April" },
  { id: "May", labelMl: "മേയ്", labelEn: "May" },
  { id: "June", labelMl: "ജൂൺ", labelEn: "June" },
  { id: "July", labelMl: "ജൂലൈ", labelEn: "July" },
  { id: "August", labelMl: "ആഗസ്റ്റ്", labelEn: "August" },
  { id: "September", labelMl: "സെപ്റ്റംബർ", labelEn: "September" },
  { id: "October", labelMl: "ഒക്ടോബർ", labelEn: "October" },
  { id: "November", labelMl: "നവംബർ", labelEn: "November" },
  { id: "December", labelMl: "ഡിസംബർ", labelEn: "December" },
];

const STAFF_ROLE_PRESETS = [
  "Site Engineer",
  "Draughtsman / CAD Designer",
  "Vasthu Consultant",
  "Site Supervisor",
  "Accountant & Office Admin",
  "Survey Assistant",
  "Site Worker / Mason",
  "Electrician / Plumber",
  "Driver / Logistics",
  "Other"
];

export const StaffSalaryTab: React.FC = () => {
  const [records, setRecords] = useState<StaffSalaryRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<StaffSalaryRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<StaffSalaryRecord | null>(null);
  const [printSlipRecord, setPrintSlipRecord] = useState<StaffSalaryRecord | null>(null);
  const [isPrintStatementOpen, setIsPrintStatementOpen] = useState<boolean>(false);
  const [qrPayRecord, setQrPayRecord] = useState<StaffSalaryRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    staffName: "",
    role: "Site Engineer",
    mobileNumber: "",
    month: "January",
    year: 2026,
    basicSalary: "",
    allowances: "",
    deductions: "",
    paidAmount: "",
    paidDate: new Date().toISOString().slice(0, 10),
    paymentMode: "UPI / GPay",
    transactionId: "",
    notes: ""
  });

  // Load from local storage
  useEffect(() => {
    setRecords(loadStaffSalaryRecords());
  }, []);

  const handleSaveRecords = (updated: StaffSalaryRecord[]) => {
    setRecords(updated);
    saveStaffSalaryRecords(updated);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      staffName: "",
      role: "Site Engineer",
      mobileNumber: "",
      month: MONTHS_LIST[new Date().getMonth()].id,
      year: new Date().getFullYear(),
      basicSalary: "",
      allowances: "",
      deductions: "",
      paidAmount: "",
      paidDate: new Date().toISOString().slice(0, 10),
      paymentMode: "UPI / GPay",
      transactionId: "",
      notes: ""
    });
    setEditingRecord(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (rec: StaffSalaryRecord) => {
    setEditingRecord(rec);
    setFormData({
      staffName: rec.staffName,
      role: rec.role || "Site Engineer",
      mobileNumber: rec.mobileNumber,
      month: rec.month,
      year: rec.year,
      basicSalary: rec.basicSalary.toString(),
      allowances: rec.allowances > 0 ? rec.allowances.toString() : "",
      deductions: rec.deductions > 0 ? rec.deductions.toString() : "",
      paidAmount: rec.paidAmount > 0 ? rec.paidAmount.toString() : "",
      paidDate: rec.paidDate || new Date().toISOString().slice(0, 10),
      paymentMode: rec.paymentMode || "UPI / GPay",
      transactionId: rec.transactionId || "",
      notes: rec.notes || ""
    });
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffName.trim()) return;

    const basic = Number(formData.basicSalary) || 0;
    const allow = Number(formData.allowances) || 0;
    const ded = Number(formData.deductions) || 0;
    const net = Math.max(0, basic + allow - ded);
    const paid = Number(formData.paidAmount) || 0;
    const balance = Math.max(0, net - paid);

    let status: "PAID" | "PARTIAL" | "UNPAID" = "UNPAID";
    if (paid >= net && net > 0) {
      status = "PAID";
    } else if (paid > 0) {
      status = "PARTIAL";
    }

    if (editingRecord) {
      const updated = records.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              staffName: formData.staffName.trim(),
              role: formData.role.trim(),
              mobileNumber: formData.mobileNumber.trim(),
              month: formData.month,
              year: Number(formData.year) || 2026,
              basicSalary: basic,
              allowances: allow,
              deductions: ded,
              netSalary: net,
              paidAmount: paid,
              balanceAmount: balance,
              paymentStatus: status,
              paidDate: formData.paidDate,
              paymentMode: formData.paymentMode,
              transactionId: formData.transactionId.trim(),
              notes: formData.notes.trim(),
              updatedAt: new Date().toISOString()
            }
          : r
      );
      handleSaveRecords(updated);
    } else {
      const newRec: StaffSalaryRecord = {
        id: `SAL-${Date.now().toString().slice(-6)}`,
        staffName: formData.staffName.trim(),
        role: formData.role.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        month: formData.month,
        year: Number(formData.year) || 2026,
        basicSalary: basic,
        allowances: allow,
        deductions: ded,
        netSalary: net,
        paidAmount: paid,
        balanceAmount: balance,
        paymentStatus: status,
        paidDate: formData.paidDate,
        paymentMode: formData.paymentMode,
        transactionId: formData.transactionId.trim(),
        notes: formData.notes.trim(),
        createdAt: new Date().toISOString()
      };
      handleSaveRecords([newRec, ...records]);
    }

    setIsAddModalOpen(false);
    setEditingRecord(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    const updated = records.filter((r) => r.id !== recordToDelete.id);
    handleSaveRecords(updated);
    setRecordToDelete(null);
  };

  // Quick WhatsApp Share
  const handleShareWhatsApp = (rec: StaffSalaryRecord) => {
    const text =
      `📄 *ശമ്പള പേയ്‌മെന്റ് വൗച്ചർ (SALARY VOUCHER)*\n` +
      `🏢 *വാസ്തുശില്പി എൻജിനീയറിങ് & കൺസ്ട്രക്ഷൻ*\n` +
      `----------------------------------------\n` +
      `👤 *സ്റ്റാഫ് പേര്:* ${rec.staffName}\n` +
      `💼 *റോൾ:* ${rec.role || "Staff"}\n` +
      `📞 *മൊബൈൽ:* ${rec.mobileNumber}\n` +
      `📅 *കാലയളവ്:* ${rec.month} ${rec.year}\n` +
      `----------------------------------------\n` +
      `💵 അടിസ്ഥാന ശമ്പളം: ₹${rec.basicSalary.toLocaleString("en-IN")}\n` +
      (rec.allowances > 0 ? `➕ അലവൻസ് / OT / ബോണസ്: ₹${rec.allowances.toLocaleString("en-IN")}\n` : "") +
      (rec.deductions > 0 ? `➖ പിടുത്തം / അഡ്വാൻസ്: ₹${rec.deductions.toLocaleString("en-IN")}\n` : "") +
      `✨ *ആകെ ശമ്പളം (Net Salary): ₹${rec.netSalary.toLocaleString("en-IN")}*\n` +
      `----------------------------------------\n` +
      `✅ *നൽകിയ തുക (Paid):* ₹${rec.paidAmount.toLocaleString("en-IN")}\n` +
      (rec.balanceAmount > 0 ? `⏳ *ബാക്കി (Balance):* ₹${rec.balanceAmount.toLocaleString("en-IN")}\n` : "") +
      `📌 *സ്റ്റാറ്റസ്:* ${rec.paymentStatus === "PAID" ? "പൂർണ്ണമായി നൽകി (PAID)" : rec.paymentStatus === "PARTIAL" ? "ഭാഗികം (PARTIAL)" : "നൽകാനുണ്ട് (UNPAID)"}\n` +
      (rec.paidDate ? `🗓️ *നൽകിയ തീയതി:* ${rec.paidDate}\n` : "") +
      (rec.paymentMode ? `💳 *പെയ്‌മെന്റ് രീതി:* ${rec.paymentMode}\n` : "") +
      (rec.transactionId ? `🔢 *റെഫറൻസ്:* ${rec.transactionId}\n` : "") +
      `----------------------------------------\n` +
      `വാസ്തുശില്പി - കേരളശ്ശേരി | Er. Deepak K. (9747995961)`;

    const cleanPhone = rec.mobileNumber.replace(/\D/g, "");
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(url, "_blank");
  };

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !searchTerm.trim() ||
        r.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.mobileNumber.includes(searchTerm) ||
        (r.role && r.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMonth = selectedMonth === "ALL" || r.month === selectedMonth;
      const matchYear = !selectedYear || r.year === Number(selectedYear);
      const matchStatus = selectedStatus === "ALL" || r.paymentStatus === selectedStatus;

      return matchSearch && matchMonth && matchYear && matchStatus;
    });
  }, [records, searchTerm, selectedMonth, selectedYear, selectedStatus]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalNet = filteredRecords.reduce((sum, r) => sum + r.netSalary, 0);
    const totalPaid = filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalBalance = filteredRecords.reduce((sum, r) => sum + r.balanceAmount, 0);
    const uniqueStaff = new Set(filteredRecords.map((r) => r.staffName.toLowerCase().trim())).size;

    return { totalNet, totalPaid, totalBalance, count: filteredRecords.length, uniqueStaff };
  }, [filteredRecords]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Action Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a0b2e] via-[#120724] to-[#0d031a] border-2 border-purple-500/40 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>സ്റ്റാഫ് ശമ്പള രജിസ്റ്റർ & പേയ്‌മെന്റുകൾ</span>
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-3 py-1 rounded-full">
                STAFF SALARY LEDGER
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-sans tracking-tight">
              സ്റ്റാഫ് ശമ്പളം & മറ്റ് പേയ്‌മെന്റുകൾ
            </h2>
            <p className="text-xs text-purple-200/80 font-sans">
              ഓഫീസ് സ്റ്റാഫ്, സൈറ്റ് എഞ്ചിനീയർമാർ, ഡ്രോയിംഗ് ടീം തുടങ്ങിയവരുടെ ശമ്പളം, അലവൻസ്, അഡ്വാൻസ് പിടുത്തം, സ്ലിപ്പ് പ്രിന്റ് & WhatsApp പങ്കുവെക്കൽ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPrintStatementOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-2 border border-white/20 transition cursor-pointer shadow-sm"
              title="Print / Download Statement"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>സ്റ്റേറ്റ്‌മെന്റ് പ്രിന്റ്</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-sans text-xs font-black flex items-center gap-2 shadow-lg shadow-purple-600/30 transition transform hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ പുതിയ ശമ്പള എൻട്രി</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-500/20">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30">
            <span className="text-[10px] font-mono text-purple-300 block uppercase">ആകെ ശമ്പള ബാധ്യത</span>
            <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
              ₹{metrics.totalNet.toLocaleString("en-IN")}
            </div>
            <span className="text-[9.5px] text-purple-200/60 font-sans">Total Salary Liability</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/40">
            <span className="text-[10px] font-mono text-emerald-300 block uppercase">നൽകിയ തുക (Paid)</span>
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
              ₹{metrics.totalPaid.toLocaleString("en-IN")}
            </div>
            <span className="text-[9.5px] text-emerald-300/70 font-sans">Disbursed Amount</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-amber-500/40">
            <span className="text-[10px] font-mono text-amber-300 block uppercase">ബാക്കി നൽകാനുള്ളത്</span>
            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
              ₹{metrics.totalBalance.toLocaleString("en-IN")}
            </div>
            <span className="text-[9.5px] text-amber-300/70 font-sans">Pending Balance</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-blue-500/30">
            <span className="text-[10px] font-mono text-blue-300 block uppercase">സ്റ്റാഫ് എണ്ണം / സ്ലിപ്പുകൾ</span>
            <div className="text-lg sm:text-xl font-black text-cyan-300 font-mono mt-0.5">
              {metrics.uniqueStaff} <span className="text-xs font-normal text-slate-300">({metrics.count} Slips)</span>
            </div>
            <span className="text-[9.5px] text-blue-300/70 font-sans">Staff Count</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#140526]/90 border border-purple-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        {/* Search Field */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="സ്റ്റാഫ് പേര്, മൊബൈൽ നമ്പർ, റോൾ തിരയുക..."
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
          />
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-purple-300" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-400"
          >
            <option value="ALL">എല്ലാ മാസങ്ങളും (All Months)</option>
            {MONTHS_LIST.map((m) => (
              <option key={m.id} value={m.id}>
                {m.labelMl} ({m.labelEn})
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-400"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
            <option value={2027}>2027</option>
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-black/40 border border-purple-500/30 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-400"
          >
            <option value="ALL">എല്ലാ സ്റ്റാറ്റസും (All Status)</option>
            <option value="PAID">പൂർണ്ണമായി നൽകി (PAID)</option>
            <option value="PARTIAL">ഭാഗികമായി നൽകി (PARTIAL)</option>
            <option value="UNPAID">നൽകാനുണ്ട് (UNPAID)</option>
          </select>
        </div>
      </div>

      {/* Main Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#140526]/60 border border-purple-500/20 text-purple-200/70 space-y-3">
          <Users className="w-12 h-12 text-purple-400/50 mx-auto" />
          <h4 className="text-base font-bold text-white">സ്റ്റാഫ് ശമ്പള റെക്കോർഡുകൾ ഒന്നും ലഭ്യമല്ല</h4>
          <p className="text-xs text-purple-300/60 max-w-md mx-auto">
            തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകൾ പ്രകാരം വിവരങ്ങൾ ലഭ്യമല്ല. മുകളിലുള്ള "+ പുതിയ ശമ്പള എൻട്രി" ബട്ടൺ ക്ലിക്ക് ചെയ്ത് സ്റ്റാഫ് ശമ്പള വിവരങ്ങൾ ചേർക്കാവുന്നതാണ്.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>ആദ്യ ശമ്പള എൻട്രി ചേർക്കുക</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#140526]/90 border border-purple-500/30 shadow-2xl overflow-hidden backdrop-blur-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-950/70 text-purple-200 text-[11px] font-mono uppercase tracking-wider border-b border-purple-500/30">
                  <th className="p-4">സ്റ്റാഫ് പേര് & റോൾ</th>
                  <th className="p-4">മൊബൈൽ നമ്പർ</th>
                  <th className="p-4">കാലയളവ് (Month & Year)</th>
                  <th className="p-4 text-right">അടിസ്ഥാനം (Basic)</th>
                  <th className="p-4 text-right">അലവൻസ് / OT</th>
                  <th className="p-4 text-right">പിടുത്തം</th>
                  <th className="p-4 text-right">ആകെ ശമ്പളം</th>
                  <th className="p-4 text-right">നൽകിയത് & തീയതി</th>
                  <th className="p-4 text-center">സ്റ്റാറ്റസ്</th>
                  <th className="p-4 text-center">നടപടികൾ (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/15 text-xs text-slate-200 font-sans">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-purple-500/10 transition-colors group">
                    {/* Staff Name & Role */}
                    <td className="p-4">
                      <div className="font-black text-white text-sm flex items-center gap-1.5">
                        <span>{rec.staffName}</span>
                      </div>
                      <div className="text-[11px] text-purple-300/80 font-mono mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        <span>{rec.role || "Staff"}</span>
                      </div>
                    </td>

                    {/* Mobile Number */}
                    <td className="p-4 font-mono">
                      <a
                        href={`tel:${rec.mobileNumber}`}
                        className="text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{rec.mobileNumber || "Nil"}</span>
                      </a>
                    </td>

                    {/* Month & Year */}
                    <td className="p-4 font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-purple-900/50 border border-purple-400/30 text-purple-200 text-xs font-bold">
                        {rec.month} {rec.year}
                      </span>
                    </td>

                    {/* Basic Salary */}
                    <td className="p-4 text-right font-mono font-semibold text-slate-300">
                      ₹{rec.basicSalary.toLocaleString("en-IN")}
                    </td>

                    {/* Allowances */}
                    <td className="p-4 text-right font-mono text-emerald-400">
                      {rec.allowances > 0 ? `+₹${rec.allowances.toLocaleString("en-IN")}` : "—"}
                    </td>

                    {/* Deductions */}
                    <td className="p-4 text-right font-mono text-rose-400">
                      {rec.deductions > 0 ? `-₹${rec.deductions.toLocaleString("en-IN")}` : "—"}
                    </td>

                    {/* Net Total Salary */}
                    <td className="p-4 text-right font-mono font-black text-amber-300 text-sm">
                      ₹{rec.netSalary.toLocaleString("en-IN")}
                    </td>

                    {/* Paid Amount & Date */}
                    <td className="p-4 text-right font-mono">
                      <div className="font-bold text-emerald-300">
                        ₹{rec.paidAmount.toLocaleString("en-IN")}
                      </div>
                      {rec.paidDate && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {rec.paidDate} {rec.paymentMode ? `(${rec.paymentMode})` : ""}
                        </div>
                      )}
                      {rec.balanceAmount > 0 && (
                        <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                          ബാക്കി: ₹{rec.balanceAmount.toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-black border ${
                          rec.paymentStatus === "PAID"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : rec.paymentStatus === "PARTIAL"
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        }`}
                      >
                        {rec.paymentStatus === "PAID" && <CheckCircle2 className="w-3 h-3" />}
                        {rec.paymentStatus === "PARTIAL" && <Clock className="w-3 h-3" />}
                        {rec.paymentStatus === "UNPAID" && <AlertCircle className="w-3 h-3" />}
                        <span>{rec.paymentStatus}</span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Print Salary Slip */}
                        <button
                          onClick={() => setPrintSlipRecord(rec)}
                          className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition cursor-pointer"
                          title="ശമ്പള സ്ലിപ്പ് പ്രിന്റ് / PDF (Print Pay Slip)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp Share */}
                        <button
                          onClick={() => handleShareWhatsApp(rec)}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition cursor-pointer"
                          title="WhatsApp വഴി സ്ലിപ്പ് അയക്കുക (Share to Staff)"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>

                        {/* QR Pay Modal */}
                        <button
                          onClick={() => setQrPayRecord(rec)}
                          className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition cursor-pointer"
                          title="UPI / GPay ക്യുആർ വഴി പെയ്‌മെന്റ് (QR Pay)"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(rec)}
                          className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition cursor-pointer"
                          title="എഡിറ്റ് ചെയ്യുക (Edit)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setRecordToDelete(rec)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                          title="ഡിലീറ്റ് ചെയ്യുക (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ADD / EDIT STAFF SALARY ENTRY
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-[#140526] border-2 border-purple-500/40 p-6 sm:p-8 shadow-2xl space-y-5 text-white my-8">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-sans">
                    {editingRecord ? "സ്റ്റാഫ് ശമ്പള വിവരങ്ങൾ തിരുത്തുക" : "പുതിയ സ്റ്റാഫ് ശമ്പള എൻട്രി ചേർക്കുക"}
                  </h3>
                  <p className="text-xs text-purple-200/70 font-sans">
                    {editingRecord ? "Update Staff Salary & Payment Details" : "Add New Staff Salary & Other Payments"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Staff Name */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    സ്റ്റാഫ് പേര് (Staff Name) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                    placeholder="e.g. Vishnu K., Rahul M."
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Staff Role */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    പദവി / റോൾ (Designation)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {STAFF_ROLE_PRESETS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    മൊബൈൽ നമ്പർ (Mobile No) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                    placeholder="10 digit mobile number"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Month & Year */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-purple-200">മാസം (Month)</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                    >
                      {MONTHS_LIST.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.labelMl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-purple-200">വർഷം (Year)</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                    />
                  </div>
                </div>

                {/* Basic Salary */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    അടിസ്ഥാന ശമ്പളം (Basic Salary ₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    placeholder="₹ e.g. 25000"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-amber-300 font-mono font-bold placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Allowances & Other Payments */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    അലവൻസ് / OT / ബോണസ് / മറ്റ് പേയ്‌മെന്റുകൾ (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.allowances}
                    onChange={(e) => setFormData({ ...formData, allowances: e.target.value })}
                    placeholder="₹ e.g. 3000"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-emerald-300 font-mono font-bold placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Deductions */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    പിടുത്തം / അഡ്വാൻസ് കട്ടിങ് (Deductions ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    placeholder="₹ e.g. 1000"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-rose-300 font-mono font-bold placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Paid Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    നൽകിയ തുക (Paid Amount ₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                    placeholder="₹ e.g. 27000"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-cyan-300 font-mono font-bold placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Paid Date */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    പെയ്‌മെന്റ് തീയതി (Paid Date)
                  </label>
                  <input
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                {/* Payment Mode */}
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    പെയ്‌മെന്റ് രീതി (Payment Mode)
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="UPI / GPay">UPI / GPay</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                    <option value="Cash">Cash (നേരിട്ട് പണം)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Transaction ID & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    റെഫറൻസ് നമ്പർ (Transaction ID / UTR / Cheque No)
                  </label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                    placeholder="e.g. UPI-998822 / CHEQUE-102"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-purple-200">
                    കുറിപ്പ് / വിവരണം (Notes / Remarks)
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Onam Bonus, Site allowance included"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-purple-500/30 rounded-xl text-xs text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Live Net Calculation Preview Box */}
              <div className="p-3.5 rounded-2xl bg-black/60 border border-purple-500/30 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400">കണക്കുകൂട്ടിയ ആകെ ശമ്പളം:</span>{" "}
                  <strong className="text-amber-300 text-sm">
                    ₹{(
                      Math.max(0, (Number(formData.basicSalary) || 0) + (Number(formData.allowances) || 0) - (Number(formData.deductions) || 0))
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">ബാക്കി തുക:</span>{" "}
                  <strong className="text-rose-300">
                    ₹{(
                      Math.max(0, Math.max(0, (Number(formData.basicSalary) || 0) + (Number(formData.allowances) || 0) - (Number(formData.deductions) || 0)) - (Number(formData.paidAmount) || 0))
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-500/30">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  റദ്ദാക്കുക (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-sans text-xs font-black shadow-lg shadow-purple-600/30 transition cursor-pointer"
                >
                  {editingRecord ? "വിവരങ്ങൾ പുതുക്കുക (Update Record)" : "എൻട്രി സൂക്ഷിക്കുക (Save Entry)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: IN-APP DELETE CONFIRMATION
         ========================================================================= */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#140526] border-2 border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-purple-500/20 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">ശമ്പള റെക്കോർഡ് നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Staff Salary Entry</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 text-xs space-y-1.5 font-mono">
              <div><span className="text-slate-400">സ്റ്റാഫ്:</span> <strong className="text-white font-sans">{recordToDelete.staffName}</strong></div>
              <div><span className="text-slate-400">റോൾ:</span> <span className="text-purple-300 font-bold">{recordToDelete.role || "Staff"}</span></div>
              <div><span className="text-slate-400">കാലയളവ്:</span> <span className="text-cyan-300 font-bold">{recordToDelete.month} {recordToDelete.year}</span></div>
              <div><span className="text-slate-400">ആകെ ശമ്പളം:</span> <span className="text-amber-300 font-bold">₹{recordToDelete.netSalary.toLocaleString("en-IN")}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ സ്റ്റാഫ് ശമ്പള റെക്കോർഡ് ലിസ്റ്റിൽ നിന്നും പൂർണ്ണമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-500/20">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
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

      {/* =========================================================================
          MODAL 3: PRINTABLE INDIVIDUAL SALARY SLIP (A4 PAYSLIP)
         ========================================================================= */}
      {printSlipRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border-2 border-purple-500/40 p-6 shadow-2xl space-y-4 text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-sans">
                  സ്റ്റാഫ് ശമ്പള സ്ലിപ്പ് (Official Staff Pay Voucher)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>പ്രിന്റ് / PDF (Print A4)</span>
                </button>
                <button
                  onClick={() => setPrintSlipRecord(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Document Wrapper */}
            <div
              id="printable-salary-slip"
              className="p-8 bg-white text-slate-900 rounded-2xl shadow-xl font-sans text-xs space-y-6 border border-slate-300"
            >
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div className="space-y-1">
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    VASTHUSILPY
                  </div>
                  <div className="text-xs font-bold text-slate-700 font-mono uppercase">
                    Architectural, Civil & Vasthu Engineering Consultants
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Keralassery, Palakkad, Kerala - 678641 | Mob: +91 9747995961 / 9446669832
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-xs uppercase block w-max ml-auto">
                    SALARY PAY SLIP
                  </span>
                  <div className="text-[11px] font-mono text-slate-600 mt-1">
                    Voucher No: <strong className="text-slate-900">{printSlipRecord.id}</strong>
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    Date: <strong>{printSlipRecord.paidDate || new Date().toISOString().slice(0, 10)}</strong>
                  </div>
                </div>
              </div>

              {/* Employee & Period Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Employee Name:</span>{" "}
                    <strong className="text-slate-900 text-sm">{printSlipRecord.staffName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Designation / Role:</span>{" "}
                    <strong className="text-slate-800">{printSlipRecord.role || "Staff"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact Number:</span>{" "}
                    <strong className="text-slate-800">{printSlipRecord.mobileNumber}</strong>
                  </div>
                </div>
                <div className="space-y-1 text-right sm:text-left">
                  <div>
                    <span className="text-slate-500">Salary Month & Year:</span>{" "}
                    <strong className="text-slate-900 text-sm font-mono">
                      {printSlipRecord.month} {printSlipRecord.year}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Status:</span>{" "}
                    <strong className="text-emerald-700 uppercase font-mono">{printSlipRecord.paymentStatus}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment Mode:</span>{" "}
                    <strong className="text-slate-800">{printSlipRecord.paymentMode || "UPI / GPay"}</strong>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-200 font-bold border-b border-slate-300 text-slate-800">
                    <tr>
                      <th className="p-3 text-left">Earnings (വരുമാനം)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                      <th className="p-3 text-left border-l border-slate-300">Deductions (പിടുത്തങ്ങൾ)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3">Basic Salary (അടിസ്ഥാന ശമ്പളം)</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        ₹{printSlipRecord.basicSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 border-l border-slate-300">Advance / Leave Deductions</td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        {printSlipRecord.deductions > 0 ? `₹${printSlipRecord.deductions.toLocaleString("en-IN")}` : "₹0"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3">Allowances / OT / Other Payments</td>
                      <td className="p-3 text-right font-mono text-emerald-700">
                        {printSlipRecord.allowances > 0 ? `₹${printSlipRecord.allowances.toLocaleString("en-IN")}` : "₹0"}
                      </td>
                      <td className="p-3 border-l border-slate-300">Other Cuts</td>
                      <td className="p-3 text-right font-mono">₹0</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-3">Gross Earnings</td>
                      <td className="p-3 text-right font-mono">
                        ₹{(printSlipRecord.basicSalary + printSlipRecord.allowances).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 border-l border-slate-300">Total Deductions</td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        ₹{printSlipRecord.deductions.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Net Payout Summary Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white font-mono">
                <div>
                  <div className="text-[11px] text-slate-300 uppercase tracking-wider">NET SALARY PAYABLE (ആകെ ശമ്പളം)</div>
                  <div className="text-xl font-black text-amber-300">
                    ₹{printSlipRecord.netSalary.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-300 uppercase">PAID AMOUNT (നൽകിയത്)</div>
                  <div className="text-base font-bold text-emerald-400">
                    ₹{printSlipRecord.paidAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {printSlipRecord.notes && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-mono">
                  <strong>Notes:</strong> {printSlipRecord.notes}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-300 text-center font-mono text-xs">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto" />
                  <div className="mt-1 font-bold text-slate-800">Employee Signature</div>
                  <div className="text-[10px] text-slate-500">({printSlipRecord.staffName})</div>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 w-48 mx-auto" />
                  <div className="mt-1 font-bold text-slate-800">Authorised Signatory</div>
                  <div className="text-[10px] text-slate-500">VASTHUSILPY ENGINEERING</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: PRINTABLE MONTHLY STATEMENT / ALL-STAFF LEDGER
         ========================================================================= */}
      {isPrintStatementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-slate-900 border-2 border-purple-500/40 p-6 shadow-2xl space-y-4 text-white my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-sans">
                  സ്റ്റാഫ് ശമ്പള സ്റ്റേറ്റ്‌മെന്റ് (Monthly Salary Statement)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>പ്രിന്റ് / PDF (Print Statement)</span>
                </button>
                <button
                  onClick={() => setIsPrintStatementOpen(false)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Statement Document */}
            <div
              id="printable-salary-statement"
              className="p-8 bg-white text-slate-900 rounded-2xl shadow-xl font-sans text-xs space-y-6 border border-slate-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="text-2xl font-black text-slate-900">VASTHUSILPY</div>
                  <div className="text-xs font-bold text-slate-700 font-mono">
                    STAFF SALARY & DISBURSEMENT STATEMENT
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Keralassery, Palakkad, Kerala | Mob: 9747995961 / 9446669832
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    Filter: {selectedMonth} {selectedYear}
                  </div>
                  <div className="text-[11px] font-mono text-slate-600">
                    Generated: {new Date().toLocaleDateString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 font-mono">
                  <tr>
                    <th className="p-2.5 text-left">Sl.</th>
                    <th className="p-2.5 text-left">Staff Name</th>
                    <th className="p-2.5 text-left">Role / Designation</th>
                    <th className="p-2.5 text-left">Mobile No</th>
                    <th className="p-2.5 text-left">Month</th>
                    <th className="p-2.5 text-right">Basic (₹)</th>
                    <th className="p-2.5 text-right">Allowances</th>
                    <th className="p-2.5 text-right">Deductions</th>
                    <th className="p-2.5 text-right">Net Salary</th>
                    <th className="p-2.5 text-right">Paid Amount</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="p-2 font-mono">{idx + 1}</td>
                      <td className="p-2 font-bold text-slate-900">{r.staffName}</td>
                      <td className="p-2 text-slate-700">{r.role || "Staff"}</td>
                      <td className="p-2 font-mono text-slate-700">{r.mobileNumber}</td>
                      <td className="p-2 font-mono">{r.month} {r.year}</td>
                      <td className="p-2 text-right font-mono">₹{r.basicSalary.toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right font-mono text-emerald-700">₹{r.allowances.toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right font-mono text-rose-600">₹{r.deductions.toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">₹{r.netSalary.toLocaleString("en-IN")}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-700">₹{r.paidAmount.toLocaleString("en-IN")}</td>
                      <td className="p-2 text-center font-mono font-bold text-[10px] uppercase">
                        {r.paymentStatus}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-200 font-bold font-mono">
                    <td colSpan={8} className="p-2.5 text-right uppercase">TOTAL (ആകെ തുക):</td>
                    <td className="p-2.5 text-right text-slate-950 font-black">
                      ₹{metrics.totalNet.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2.5 text-right text-emerald-900 font-black">
                      ₹{metrics.totalPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="p-2.5 text-center">
                      Bal: ₹{metrics.totalBalance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="flex justify-between items-center pt-8 border-t border-slate-300 text-xs font-mono">
                <div>Prepared By: ____________________</div>
                <div>Authorised Signature: ____________________</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: UPI / GPAY PAYMENT QR
         ========================================================================= */}
      {qrPayRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl bg-[#140526] border-2 border-amber-500/50 p-6 shadow-2xl space-y-4 text-white text-center">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white font-sans">
                GPay / UPI ശമ്പള പെയ്‌മെന്റ്
              </h3>
              <button
                onClick={() => setQrPayRecord(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <div><strong className="text-white text-sm font-sans">{qrPayRecord.staffName}</strong></div>
              <div className="text-cyan-300 font-bold">{qrPayRecord.mobileNumber}</div>
              <div className="text-amber-300 text-base font-black mt-1">
                ₹{qrPayRecord.netSalary.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-purple-300/70">{qrPayRecord.month} {qrPayRecord.year} Salary</div>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white rounded-2xl w-max mx-auto shadow-inner">
              <img
                src={generateUpiQrUrl(
                  qrPayRecord.mobileNumber,
                  qrPayRecord.staffName,
                  qrPayRecord.netSalary,
                  `Salary ${qrPayRecord.month} ${qrPayRecord.year}`
                )}
                alt="UPI QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <p className="text-[11px] text-purple-200/70">
              GPay / PhonePe / Paytm വഴി സ്കാൻ ചെയ്ത് നേരിട്ട് പെയ്‌മെന്റ് പൂർത്തിയാക്കുക.
            </p>

            <button
              onClick={() => {
                const uri = generateUpiUri(
                  qrPayRecord.mobileNumber,
                  qrPayRecord.staffName,
                  qrPayRecord.netSalary,
                  `Salary ${qrPayRecord.month} ${qrPayRecord.year}`
                );
                window.location.href = uri;
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs transition shadow-lg cursor-pointer"
            >
              GPay ആപ്പിൽ തുറക്കുക (Open in UPI App)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
