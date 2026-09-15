import React, { useState } from "react";
import { RdAccount, RdMonthlyDeposit } from "../../types";
import {
  loadRdAccounts,
  saveRdAccounts,
  generateRdAccountWhatsAppMessage,
  shareViaWhatsApp
} from "../../utils/personalBillsStorage";
import {
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  IndianRupee,
  Building,
  TrendingUp,
  Printer,
  ChevronRight,
  ShieldCheck,
  Check,
  MessageSquare
} from "lucide-react";

export const RdAccountTab: React.FC = () => {
  const [accounts, setAccounts] = useState<RdAccount[]>(() => loadRdAccounts());
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ""
  );

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<RdAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<RdAccount | null>(null);
  const [isPayMonthModalOpen, setIsPayMonthModalOpen] = useState(false);
  const [payingDepositIndex, setPayingDepositIndex] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<RdAccount>>({
    accountNumber: "020084596312",
    institutionType: "POST_OFFICE",
    bankOrPostOfficeName: "Keralassery Sub Post Office (678641)",
    accountHolderName: "Deepak Vasthusilpy",
    monthlyInstallment: 5000,
    dueDayOfMonth: 15,
    tenureMonths: 60,
    interestRate: 6.7,
    startDate: "2024-04-01",
    maturityDate: "2029-03-31",
    expectedMaturityAmount: 356830,
    notes: "Post Office 5-Year RD"
  });

  // Monthly Pay Modal State
  const [payAmountInput, setPayAmountInput] = useState<number>(5000);
  const [payDateInput, setPayDateInput] = useState<string>(new Date().toISOString().split("T")[0]);
  const [payFineInput, setPayFineInput] = useState<number>(0);
  const [payTxnInput, setPayTxnInput] = useState<string>("");

  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleUpdateAccounts = (newAccs: RdAccount[]) => {
    setAccounts(newAccs);
    saveRdAccounts(newAccs);
  };

  // Generate deposit list for new account
  const generateDepositsForTenure = (months: number, monthlyAmt: number, startDateStr: string) => {
    const deposits: RdMonthlyDeposit[] = [];
    const [startYear, startMonth] = startDateStr.split("-").map(Number);

    for (let i = 0; i < months; i++) {
      const monthNumber = i + 1;
      const curMonthIndex = ((startMonth || 1) - 1 + i) % 12;
      const curYear = (startYear || 2026) + Math.floor(((startMonth || 1) - 1 + i) / 12);
      const myStr = `${curYear}-${String(curMonthIndex + 1).padStart(2, "0")}`;

      deposits.push({
        monthIndex: monthNumber,
        monthYear: myStr,
        dueAmount: monthlyAmt,
        paidAmount: 0,
        fineAmount: 0,
        status: "PENDING"
      });
    }
    return deposits;
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const monthly = Number(formData.monthlyInstallment) || 5000;
    const tenure = Number(formData.tenureMonths) || 60;
    const start = formData.startDate || new Date().toISOString().split("T")[0];

    const accountToSave: RdAccount = {
      id: editingAccount ? editingAccount.id : `RD-${Date.now().toString().slice(-6)}`,
      accountNumber: formData.accountNumber || "RD-ACC",
      institutionType: formData.institutionType || "POST_OFFICE",
      bankOrPostOfficeName: formData.bankOrPostOfficeName || "Post Office",
      accountHolderName: formData.accountHolderName || "Deepak",
      monthlyInstallment: monthly,
      dueDayOfMonth: Number(formData.dueDayOfMonth) || 15,
      tenureMonths: tenure,
      interestRate: Number(formData.interestRate) || 6.7,
      startDate: start,
      maturityDate: formData.maturityDate || "",
      expectedMaturityAmount: Number(formData.expectedMaturityAmount) || (monthly * tenure * 1.18),
      deposits: editingAccount ? editingAccount.deposits : generateDepositsForTenure(tenure, monthly, start),
      notes: formData.notes || ""
    };

    if (editingAccount) {
      handleUpdateAccounts(accounts.map((a) => (a.id === editingAccount.id ? accountToSave : a)));
    } else {
      handleUpdateAccounts([accountToSave, ...accounts]);
      setSelectedAccountId(accountToSave.id);
    }

    setIsAddModalOpen(false);
    setEditingAccount(null);
  };

  const handleConfirmDelete = () => {
    if (!accountToDelete) return;
    const remaining = accounts.filter((a) => a.id !== accountToDelete.id);
    handleUpdateAccounts(remaining);
    if (remaining.length > 0) {
      setSelectedAccountId(remaining[0].id);
    }
    setAccountToDelete(null);
  };

  const handleOpenPayMonth = (depIdx: number) => {
    if (!activeAccount) return;
    const dep = activeAccount.deposits[depIdx];
    setPayingDepositIndex(depIdx);
    setPayAmountInput(dep.dueAmount);
    setPayFineInput(dep.fineAmount || 0);
    setPayDateInput(dep.paidDate || new Date().toISOString().split("T")[0]);
    setPayTxnInput(dep.transactionRef || "");
    setIsPayMonthModalOpen(true);
  };

  const handleConfirmMonthPayment = () => {
    if (!activeAccount || payingDepositIndex === null) return;
    const updatedDeposits = [...activeAccount.deposits];
    const target = updatedDeposits[payingDepositIndex];

    updatedDeposits[payingDepositIndex] = {
      ...target,
      paidAmount: Number(payAmountInput) || target.dueAmount,
      paidDate: payDateInput,
      fineAmount: Number(payFineInput) || 0,
      status: "PAID",
      transactionRef: payTxnInput || `TXN-${Date.now().toString().slice(-6)}`
    };

    const updatedAccount = { ...activeAccount, deposits: updatedDeposits };
    handleUpdateAccounts(accounts.map((a) => (a.id === activeAccount.id ? updatedAccount : a)));
    setIsPayMonthModalOpen(false);
    setPayingDepositIndex(null);
  };

  const handleToggleQuickPay = (depIdx: number) => {
    if (!activeAccount) return;
    const updatedDeposits = [...activeAccount.deposits];
    const target = updatedDeposits[depIdx];

    if (target.status === "PAID") {
      updatedDeposits[depIdx] = {
        ...target,
        paidAmount: 0,
        paidDate: undefined,
        status: "PENDING",
        transactionRef: undefined
      };
    } else {
      updatedDeposits[depIdx] = {
        ...target,
        paidAmount: target.dueAmount,
        paidDate: new Date().toISOString().split("T")[0],
        status: "PAID",
        transactionRef: `QUICK-PAY-${Date.now().toString().slice(-4)}`
      };
    }

    const updatedAccount = { ...activeAccount, deposits: updatedDeposits };
    handleUpdateAccounts(accounts.map((a) => (a.id === activeAccount.id ? updatedAccount : a)));
  };

  // Metrics for active account
  const totalMonths = activeAccount?.tenureMonths || 60;
  const paidMonths = activeAccount?.deposits.filter((d) => d.status === "PAID").length || 0;
  const totalDeposited = activeAccount?.deposits.reduce((s, d) => s + (d.paidAmount || 0), 0) || 0;
  const progressPercent = Math.round((paidMonths / totalMonths) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-amber-950/40 to-emerald-950/40 border border-amber-500/30 backdrop-blur-xl shadow-xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-inner">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase">
                RECURRING DEPOSIT (RD)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                POST OFFICE / BANK SAVINGS
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              ആവർത്തന നിക്ഷേപം (RD Accounts & Passbook)
            </h2>
            <p className="text-xs md:text-sm text-purple-200/80 mt-0.5">
              പോസ്റ്റ് ഓഫീസ് & ബാങ്ക് RD പ്രതിമാസ തവണകൾ, ഡ്യൂ തീയതികൾ, മെച്യൂരിറ്റി കണക്കുകൂട്ടലുകൾ.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer print:hidden"
          >
            <Printer className="w-4 h-4 text-purple-300" />
            <span>പാസ്ബുക്ക് പ്രിന്റ്</span>
          </button>

          <button
            onClick={() => {
              setEditingAccount(null);
              setFormData({
                accountNumber: "",
                institutionType: "POST_OFFICE",
                bankOrPostOfficeName: "Post Office",
                accountHolderName: "Deepak Vasthusilpy",
                monthlyInstallment: 5000,
                dueDayOfMonth: 15,
                tenureMonths: 60,
                interestRate: 6.7,
                startDate: new Date().toISOString().split("T")[0],
                expectedMaturityAmount: 356830,
                notes: ""
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-lg hover:shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>പുതിയ RD ചേർക്കുക (Add RD)</span>
          </button>
        </div>
      </div>

      {/* Account Selector Tabs (If multiple RDs) */}
      {accounts.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                selectedAccountId === acc.id
                  ? "bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 border border-white/10 text-purple-200 hover:bg-white/10"
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{acc.bankOrPostOfficeName}</span>
              <span className="font-mono text-[10px]">({acc.accountNumber})</span>
            </button>
          ))}
        </div>
      )}

      {activeAccount && (
        <>
          {/* Active Account Overview Card & KPIs */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a072b] via-[#240a3d] to-[#120520] border border-amber-500/40 shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {activeAccount.institutionType === "POST_OFFICE" ? "INDIA POST RD" : "BANK RD"}
                  </span>
                  <span className="text-xs text-purple-200 font-mono">
                    Account: <b>{activeAccount.accountNumber}</b>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{activeAccount.bankOrPostOfficeName}</h3>
                <div className="text-xs text-purple-200/70">
                  ഹോൾഡർ: <span className="text-white font-bold">{activeAccount.accountHolderName}</span> • പലിശ നിരക്ക്:{" "}
                  <span className="text-amber-300 font-bold">{activeAccount.interestRate}% P.A.</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const text = generateRdAccountWhatsAppMessage(activeAccount);
                    shareViaWhatsApp({ text });
                  }}
                  className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 hover:text-white transition cursor-pointer"
                  title="വാട്സാപ്പ് വഴി അയക്കുക (Share RD to WhatsApp)"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingAccount(activeAccount);
                    setFormData(activeAccount);
                    setIsAddModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
                  title="Edit RD Details"
                >
                  <Edit2 className="w-4 h-4 text-yellow-300" />
                </button>
                <button
                  onClick={() => setAccountToDelete(activeAccount)}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition cursor-pointer"
                  title="Delete RD"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-purple-200/60 font-sans">പ്രതിമാസ അടവ് (Installment)</div>
                <div className="text-xl font-black text-amber-300 mt-0.5">
                  ₹{activeAccount.monthlyInstallment.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-purple-200/60 mt-0.5 font-sans">
                  ഓരോ മാസവും {activeAccount.dueDayOfMonth}-ാം തീയതിക്ക് മുൻപ്
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-purple-200/60 font-sans">ഇതുവരെ നിക്ഷേപിച്ചത് (Total Paid)</div>
                <div className="text-xl font-black text-emerald-300 mt-0.5">
                  ₹{totalDeposited.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5 font-sans">
                  {paidMonths} of {totalMonths} മാസങ്ങൾ പൂർത്തിയായി ({progressPercent}%)
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-purple-200/60 font-sans">പ്രതീക്ഷിക്കുന്ന മെച്യൂരിറ്റി തുക</div>
                <div className="text-xl font-black text-cyan-300 mt-0.5">
                  ₹{activeAccount.expectedMaturityAmount.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-purple-200/60 mt-0.5 font-sans">
                  Maturity: {activeAccount.maturityDate || "5 Years"}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-purple-200/60 font-sans">ബാക്കി തവണകൾ (Remaining)</div>
                <div className="text-xl font-black text-rose-300 mt-0.5">
                  {totalMonths - paidMonths} <span className="text-xs font-normal font-sans">മാസങ്ങൾ</span>
                </div>
                <div className="text-[10px] text-purple-200/60 mt-0.5 font-sans">
                  ബാക്കി അടയ്ക്കാനുള്ളത്: ₹{((totalMonths - paidMonths) * activeAccount.monthlyInstallment).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-purple-200">
                <span>RD കാലയളവ് പുരോഗതി (Progress)</span>
                <span className="font-mono font-bold text-amber-300">{progressPercent}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 shadow-lg"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* MONTHLY PASSBOOK MATRIX (60 Months Interactive Grid) */}
          <div className="p-6 rounded-3xl bg-[#140522] border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>പ്രതിമാസ തവണ റെക്കോർഡ് (Monthly Installment Matrix)</span>
                </h4>
                <p className="text-xs text-purple-200/70">
                  തവണ അടച്ചതിനു ശേഷം ടിക്ക് ചെയ്യുക അല്ലെങ്കിൽ വിവരങ്ങൾ രേഖപ്പെടുത്താൻ ക്ലിക്ക് ചെയ്യുക.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-emerald-300">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span>അടച്ചവ ({paidMonths})</span>
                </div>
                <div className="flex items-center gap-1 text-rose-300">
                  <div className="w-3 h-3 rounded bg-white/10 border border-white/20"></div>
                  <span>ബാക്കിയുള്ളവ ({totalMonths - paidMonths})</span>
                </div>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2 font-mono text-xs">
              {activeAccount.deposits.map((dep, idx) => {
                const isPaid = dep.status === "PAID";

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative group ${
                      isPaid
                        ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                        : "bg-white/5 border-white/10 text-slate-300 hover:border-amber-400/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-300">M{dep.monthIndex}</span>
                      <button
                        onClick={() => handleToggleQuickPay(idx)}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isPaid ? "bg-emerald-500 text-slate-950" : "bg-white/10 text-slate-400 hover:text-white"
                        }`}
                        title={isPaid ? "Mark Unpaid" : "Quick Mark Paid"}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="my-1.5">
                      <div className="text-[11px] font-bold text-white truncate">{dep.monthYear}</div>
                      <div className="text-[10px] text-purple-200/70">₹{dep.dueAmount}</div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] border-t border-white/10 pt-1">
                      {isPaid ? (
                        <span className="text-emerald-400 font-bold truncate">✓ {dep.paidDate || "Paid"}</span>
                      ) : (
                        <span className="text-rose-400 font-bold">Pending</span>
                      )}
                      <button
                        onClick={() => handleOpenPayMonth(idx)}
                        className="text-purple-300 hover:text-white cursor-pointer"
                        title="Edit Details"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* MODAL: ADD / EDIT RD ACCOUNT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingAccount ? "RD അക്കൗണ്ട് തിരുത്തുക" : "പുതിയ RD അക്കൗണ്ട് ചേർക്കുക"}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    സ്ഥാപനം (Institution) *
                  </label>
                  <select
                    value={formData.institutionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        institutionType: e.target.value as "POST_OFFICE" | "BANK" | "COOPERATIVE_SOCIETY"
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-purple-950 border border-white/20 text-white text-xs"
                  >
                    <option value="POST_OFFICE">India Post Office (പോസ്റ്റ് ഓഫീസ്)</option>
                    <option value="BANK">Commercial Bank (SBI, Canara, etc.)</option>
                    <option value="COOPERATIVE_SOCIETY">Co-operative Bank (സഹകരണ ബാങ്ക്)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    ബാങ്ക് / പോസ്റ്റ് ഓഫീസ് പേര് *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankOrPostOfficeName || ""}
                    onChange={(e) => setFormData({ ...formData, bankOrPostOfficeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    RD അക്കൗണ്ട് നമ്പർ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber || ""}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    അക്കൗണ്ട് ഉടമയുടെ പേര് *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountHolderName || ""}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    പ്രതിമാസ തവണ (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={formData.monthlyInstallment ?? 5000}
                    onChange={(e) => setFormData({ ...formData, monthlyInstallment: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 text-amber-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    കാലാവധി (മാസങ്ങൾ) *
                  </label>
                  <input
                    type="number"
                    required
                    min="6"
                    max="120"
                    value={formData.tenureMonths ?? 60}
                    onChange={(e) => setFormData({ ...formData, tenureMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    പലിശ നിരക്ക് (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.interestRate ?? 6.7}
                    onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1">
                    തുടങ്ങിയ തീയതി (Start Date)
                  </label>
                  <input
                    type="date"
                    value={formData.startDate || ""}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1">
                    പ്രതീക്ഷിക്കുന്ന മെച്യൂരിറ്റി തുക (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.expectedMaturityAmount ?? 356830}
                    onChange={(e) => setFormData({ ...formData, expectedMaturityAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-cyan-400/40 text-cyan-300 font-mono text-xs"
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
                  {editingAccount ? "സേവ് ചെയ്യുക" : "RD ചേർക്കുക"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAY MONTH INSTALLMENT */}
      {isPayMonthModalOpen && payingDepositIndex !== null && activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#170626] border border-amber-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">
                മാസത്തവണ രേഖപ്പെടുത്തുക (Month {activeAccount.deposits[payingDepositIndex].monthIndex})
              </h3>
              <button
                onClick={() => setIsPayMonthModalOpen(false)}
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
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-amber-400/40 text-amber-300 font-mono font-black text-base"
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
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  പിഴ തുക / ഫൈൻ (Fine if any ₹)
                </label>
                <input
                  type="number"
                  value={payFineInput}
                  onChange={(e) => setPayFineInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  Receipt / IPPB / Bank Ref No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. IPPB-KL-098234"
                  value={payTxnInput}
                  onChange={(e) => setPayTxnInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-white font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setIsPayMonthModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-bold"
                >
                  റദ്ദാക്കുക
                </button>
                <button
                  onClick={handleConfirmMonthPayment}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition"
                >
                  തവണ അടവ് രേഖപ്പെടുത്തുക ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/50 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-3 text-rose-400 border-b border-white/10 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-300">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">RD അക്കൗണ്ട് നീക്കം ചെയ്യണോ?</h3>
                <p className="text-xs text-rose-200/70">Delete Recurring Deposit Account</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1 font-mono">
              <div><span className="text-slate-400">സ്ഥാപനം:</span> <strong className="text-white font-sans">{accountToDelete.bankOrPostOfficeName}</strong></div>
              <div><span className="text-slate-400">അക്കൗണ്ട് നമ്പർ:</span> <span className="text-amber-300 font-bold">{accountToDelete.accountNumber}</span></div>
              <div><span className="text-slate-400">പ്രതിമാസ അടവ്:</span> <span className="text-emerald-300 font-bold">₹{accountToDelete.monthlyInstallment}</span></div>
            </div>

            <p className="text-xs text-slate-300">
              ഈ RD അക്കൗണ്ടും അതിലെ എല്ലാ പാസ്ബുക്ക് രേഖകളും പൂർണ്ണമായി നീക്കം ചെയ്യണമെന്ന് ഉറപ്പാണോ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
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
