import React, { useState, useEffect } from "react";
import {
  PersonalVendor,
  PersonalVendorBill,
  PersonalVendorBillItem,
  PersonalVendorCategory
} from "../../types";
import {
  loadPersonalVendors,
  savePersonalVendors,
  loadPersonalVendorBills,
  savePersonalVendorBills,
  calculatePoovMalaPeriodDays,
  generateUpiQrUrl,
  generateUpiUri,
  generateVendorBillWhatsAppMessage,
  shareViaWhatsApp
} from "../../utils/personalBillsStorage";
import {
  Receipt,
  Sparkles,
  Calendar,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  QrCode,
  Share2,
  CreditCard,
  User,
  Building,
  Phone,
  IndianRupee,
  FileText,
  Clock,
  X,
  Smartphone,
  Check
} from "lucide-react";

interface CreateCustomBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated?: (newBill: PersonalVendorBill) => void;
  initialPreset?: "POOV_MALA" | "MILK" | "NEWSPAPER" | "WATER" | "ELECTRICAL" | "GENERAL";
}

type BillModelType = "DAILY_PERIODIC" | "MONTHLY_FIXED" | "ITEMIZED";

const PRESETS = [
  {
    id: "POOV_MALA",
    title: "പൂവ് മാല (Flower Garland)",
    icon: Sparkles,
    model: "DAILY_PERIODIC" as BillModelType,
    category: "FLOWERS" as PersonalVendorCategory,
    vendorName: "Ranjith Poov Mala",
    particulars: "Daily Pooja Flower Garlands (പൂവ് മാല സപ്ലൈ)",
    dailyRate: 20,
    excludeSundays: true
  },
  {
    id: "MILK",
    title: "പാൽ വിതരണം (Daily Milk)",
    icon: Receipt,
    model: "DAILY_PERIODIC" as BillModelType,
    category: "GENERAL" as PersonalVendorCategory,
    vendorName: "Milma Milk Supply",
    particulars: "Daily Morning Milk Supply (പാൽ സപ്ലൈ)",
    dailyRate: 56,
    excludeSundays: false
  },
  {
    id: "NEWSPAPER",
    title: "പത്ര വരിസംഖ്യ (Newspaper)",
    icon: FileText,
    model: "MONTHLY_FIXED" as BillModelType,
    category: "GENERAL" as PersonalVendorCategory,
    vendorName: "Newspaper Agency",
    particulars: "Monthly Newspaper Subscription (പത്ര മാസ വരിസംഖ്യ)",
    monthlyAmount: 320
  },
  {
    id: "WATER",
    title: "കുടിവെള്ള കാൻ (Water Cans)",
    icon: Receipt,
    model: "ITEMIZED" as BillModelType,
    category: "OFFICE" as PersonalVendorCategory,
    vendorName: "Aqua Pure Water Supply",
    particulars: "Drinking Water 20L Cans Supply (കുടിവെള്ള കാൻ)",
    items: [{ id: "1", description: "20L Drinking Water Can", quantity: 10, unit: "Cans", rate: 60, amount: 600 }]
  },
  {
    id: "ELECTRICAL",
    title: "ഇലക്ട്രിക്കൽ / പ്ലംബിംഗ്",
    icon: Building,
    model: "ITEMIZED" as BillModelType,
    category: "ELECTRICAL" as PersonalVendorCategory,
    vendorName: "City Electricals & Hardware",
    particulars: "Office Repairs & Maintenance Material (റിപ്പയറിംഗ്)",
    items: [{ id: "1", description: "LED Tube Light 20W", quantity: 2, unit: "Nos", rate: 250, amount: 500 }]
  }
];

export const CreateCustomBillModal: React.FC<CreateCustomBillModalProps> = ({
  isOpen,
  onClose,
  onBillCreated,
  initialPreset
}) => {
  const [vendors, setVendors] = useState<PersonalVendor[]>(() => loadPersonalVendors());
  const [billModel, setBillModel] = useState<BillModelType>("DAILY_PERIODIC");

  // Vendor selection or new vendor creation
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [isCreatingNewVendor, setIsCreatingNewVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorShop, setNewVendorShop] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState<PersonalVendorCategory>("GENERAL");
  const [newVendorMobile, setNewVendorMobile] = useState("");
  const [newVendorGPay, setNewVendorGPay] = useState("");
  const [newVendorUpi, setNewVendorUpi] = useState("");

  // Bill Fields
  const [billNumber, setBillNumber] = useState<string>(() => `BILL-${Date.now().toString().slice(-6)}`);
  const [billDate, setBillDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [particulars, setParticulars] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Daily Periodic Model State (like Poov Mala)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [excludeSundays, setExcludeSundays] = useState(true);
  const [leaveDays, setLeaveDays] = useState(0);
  const [dailyRate, setDailyRate] = useState(20);
  const [extraCount, setExtraCount] = useState(0);
  const [extraRate, setExtraRate] = useState(20);

  // Computed for Daily Periodic
  const [dailyAnalysis, setDailyAnalysis] = useState(() => calculatePoovMalaPeriodDays(startDate, endDate));

  // Monthly Fixed State
  const [monthlyAmount, setMonthlyAmount] = useState(300);

  // Itemized State
  const [items, setItems] = useState<PersonalVendorBillItem[]>([
    { id: "1", description: "Item / Service 1", quantity: 1, unit: "Nos", rate: 500, amount: 500 }
  ]);

  // Overall Payment State
  const [status, setStatus] = useState<"PENDING" | "PAID" | "PARTIAL">("PENDING");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("GPay (UPI)");
  const [txnRef, setTxnRef] = useState("");

  // Success / Created View
  const [createdBill, setCreatedBill] = useState<PersonalVendorBill | null>(null);
  const [createdVendor, setCreatedVendor] = useState<PersonalVendor | null>(null);

  // Load vendors on mount/open
  useEffect(() => {
    if (isOpen) {
      const vList = loadPersonalVendors();
      setVendors(vList);
      if (vList.length > 0 && !selectedVendorId) {
        setSelectedVendorId(vList[0].id);
      }
      setBillNumber(`BILL-${Date.now().toString().slice(-6)}`);
      setCreatedBill(null);
      setCreatedVendor(null);
    }
  }, [isOpen]);

  // Apply preset if specified
  const applyPreset = (presetId: string) => {
    const p = PRESETS.find((x) => x.id === presetId);
    if (!p) return;

    setBillModel(p.model);
    setParticulars(p.particulars);

    if (p.model === "DAILY_PERIODIC") {
      setDailyRate(p.dailyRate || 20);
      setExcludeSundays(p.excludeSundays ?? true);
    } else if (p.model === "MONTHLY_FIXED") {
      setMonthlyAmount(p.monthlyAmount || 300);
    } else if (p.model === "ITEMIZED" && p.items) {
      setItems(p.items);
    }

    // Try matching existing vendor
    const matched = vendors.find((v) => v.vendorName.toLowerCase().includes(p.vendorName.toLowerCase().split(" ")[0]));
    if (matched) {
      setSelectedVendorId(matched.id);
      setIsCreatingNewVendor(false);
    } else {
      setIsCreatingNewVendor(true);
      setNewVendorName(p.vendorName);
      setNewVendorCategory(p.category);
    }
  };

  useEffect(() => {
    if (initialPreset) {
      applyPreset(initialPreset);
    }
  }, [initialPreset]);

  // Recalculate daily days
  useEffect(() => {
    if (billModel === "DAILY_PERIODIC") {
      const res = calculatePoovMalaPeriodDays(startDate, endDate);
      setDailyAnalysis(res);
    }
  }, [startDate, endDate, billModel]);

  // Calculate Total Bill Amount based on model
  const calculateTotalAmount = (): number => {
    if (billModel === "DAILY_PERIODIC") {
      const effectiveDays = Math.max(
        0,
        dailyAnalysis.totalDays - (excludeSundays ? dailyAnalysis.sundays : 0) - leaveDays
      );
      const regularAmt = effectiveDays * dailyRate;
      const extraAmt = extraCount * extraRate;
      return regularAmt + extraAmt;
    }
    if (billModel === "MONTHLY_FIXED") {
      return monthlyAmount;
    }
    if (billModel === "ITEMIZED") {
      return items.reduce((s, it) => s + (it.amount || 0), 0);
    }
    return 0;
  };

  const computedTotal = calculateTotalAmount();

  // Item management for itemized
  const handleItemChange = (id: string, field: keyof PersonalVendorBillItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === "quantity" || field === "rate") {
          updated.amount = Number(updated.quantity || 0) * Number(updated.rate || 0);
        }
        return updated;
      })
    );
  };

  const handleAddItem = () => {
    const newItem: PersonalVendorBillItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unit: "Nos",
      rate: 100,
      amount: 100
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((x) => x.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let targetVendor: PersonalVendor | undefined;

    if (isCreatingNewVendor) {
      if (!newVendorName.trim()) {
        alert("ദയവായി വെണ്ടറുടെ പേര് രേഖപ്പെടുത്തുക (Vendor name is required)");
        return;
      }
      const newV: PersonalVendor = {
        id: `VEND-${Date.now().toString().slice(-6)}`,
        vendorName: newVendorName.trim(),
        businessOrShopName: newVendorShop.trim() || newVendorName.trim(),
        category: newVendorCategory,
        mobileNumber: newVendorMobile.trim(),
        gpayNumber: newVendorGPay.trim() || newVendorMobile.trim(),
        upiId: newVendorUpi.trim(),
        address: "",
        createdAt: new Date().toISOString()
      };
      const updatedVendors = [newV, ...vendors];
      savePersonalVendors(updatedVendors);
      setVendors(updatedVendors);
      targetVendor = newV;
    } else {
      targetVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
    }

    if (!targetVendor) {
      alert("വെണ്ടറെ തിരഞ്ഞെടുക്കുക (Please select a vendor)");
      return;
    }

    // Compose description if empty
    let finalParticulars = particulars.trim();
    if (!finalParticulars) {
      if (billModel === "DAILY_PERIODIC") {
        const netDays = Math.max(0, dailyAnalysis.totalDays - (excludeSundays ? dailyAnalysis.sundays : 0) - leaveDays);
        finalParticulars = `${targetVendor.vendorName} (${startDate} to ${endDate}, ${netDays} days @ ₹${dailyRate}/day)`;
      } else if (billModel === "MONTHLY_FIXED") {
        finalParticulars = `${targetVendor.vendorName} - Monthly Bill (${billDate})`;
      } else {
        finalParticulars = `${targetVendor.vendorName} - ${items.map((i) => i.description).filter(Boolean).join(", ")}`;
      }
    }

    const calculatedBillAmount = computedTotal;
    const finalPaid = Math.min(paidAmount, calculatedBillAmount);
    const finalStatus = finalPaid >= calculatedBillAmount ? "PAID" : finalPaid > 0 ? "PARTIAL" : status;

    const newBill: PersonalVendorBill = {
      id: `PBILL-${Date.now().toString().slice(-6)}`,
      vendorId: targetVendor.id,
      vendorName: targetVendor.vendorName,
      billNumber: billNumber.trim() || `BILL-${Date.now().toString().slice(-4)}`,
      billDate,
      dueDate,
      serviceOrParticulars: finalParticulars,
      billAmount: calculatedBillAmount,
      paidAmount: finalPaid,
      paidDate: finalPaid > 0 ? billDate : undefined,
      status: finalStatus as any,
      paymentMode: finalPaid > 0 ? paymentMode : undefined,
      transactionReference: txnRef.trim() || undefined,
      items: billModel === "ITEMIZED" ? items : undefined,
      notes: notes.trim() ? `${notes.trim()}${billModel === "DAILY_PERIODIC" ? ` [Days: ${dailyAnalysis.totalDays}, Leave: ${leaveDays}, Sundays excluded: ${excludeSundays ? dailyAnalysis.sundays : 0}]` : ""}` : undefined,
      createdAt: new Date().toISOString()
    };

    const existingBills = loadPersonalVendorBills();
    const updatedBills = [newBill, ...existingBills];
    savePersonalVendorBills(updatedBills);

    setCreatedBill(newBill);
    setCreatedVendor(targetVendor);

    if (onBillCreated) {
      onBillCreated(newBill);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-[#140424] border border-purple-500/40 p-5 sm:p-6 shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col justify-between">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/30 to-purple-500/30 border border-amber-400/40 text-amber-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>പുതിയ പേഴ്സണൽ ബിൽ സൃഷ്ടിക്കുക</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  CREATE BILL
                </span>
              </h3>
              <p className="text-xs text-purple-200/70">
                പൂവ് മാല, പാൽ, പത്രം, വെള്ളം, റിപ്പയർ തുടങ്ങിയ എല്ലാ സർവീസ് ബില്ലുകളും ഇവിടെ തയ്യാറാക്കാം
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* IF BILL JUST CREATED: SHOW SUCCESS CARD */}
        {createdBill && createdVendor ? (
          <div className="space-y-4 py-3 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
              <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 mb-1">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white">ബിൽ വിജയകരമായി സൃഷ്ടിച്ചു!</h4>
              <p className="text-xs text-emerald-200/80">
                ബിൽ #{createdBill.billNumber} ({createdBill.vendorName}) പേഴ്സണൽ ബിൽ ലെഡ്ജറിൽ രേഖപ്പെടുത്തി.
              </p>
              <div className="text-2xl font-black text-amber-300 font-mono">
                ₹{createdBill.billAmount.toLocaleString("en-IN")}
              </div>
            </div>

            {/* INSTANT GPAY QR & WHATSAPP BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Share */}
              <button
                onClick={() => {
                  const msg = generateVendorBillWhatsAppMessage(createdBill, createdVendor);
                  shareViaWhatsApp({
                    text: msg,
                    phone: createdVendor.mobileNumber || createdVendor.gpayNumber
                  });
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp ബിൽ അയക്കുക</span>
              </button>

              {/* Instant GPay Link */}
              <a
                href={generateUpiUri(
                  createdVendor.upiId || `${createdVendor.gpayNumber || "9495000000"}@okaxis`,
                  createdVendor.vendorName,
                  Math.max(0, createdBill.billAmount - createdBill.paidAmount),
                  `${createdBill.vendorName} ${createdBill.billNumber}`
                )}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>GPay വഴി പണം നൽകുക</span>
              </a>
            </div>

            {/* QR Code Preview */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2">
              <p className="text-[11px] font-bold text-purple-200">GPay UPI QR കോഡ് (സ്കാൻ ചെയ്യുക)</p>
              <img
                src={generateUpiQrUrl(
                  createdVendor.upiId || `${createdVendor.gpayNumber || "9495000000"}@okaxis`,
                  createdVendor.vendorName,
                  Math.max(0, createdBill.billAmount - createdBill.paidAmount),
                  `${createdBill.vendorName} ${createdBill.billNumber}`
                )}
                alt="UPI QR Code"
                className="w-40 h-40 rounded-xl bg-white p-2 shadow-xl"
              />
              <p className="text-[10px] text-slate-400 font-mono">
                Payee: {createdVendor.vendorName} | Due: ₹{Math.max(0, createdBill.billAmount - createdBill.paidAmount)}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
              >
                പൂർത്തിയായി (Done)
              </button>
            </div>
          </div>
        ) : (
          /* BILL CREATION FORM */
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1">
            {/* QUICK PRESETS */}
            <div>
              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>വേഗത്തിൽ തിരഞ്ഞെടുക്കാം (Quick Presets)</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {PRESETS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-400/40 text-purple-200 hover:text-white transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Icon className="w-3 h-3 text-amber-300" />
                      <span>{p.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BILL MODEL SELECTION */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                ബിൽ മോഡൽ / കണക്കുകൂട്ടൽ രീതി (Calculation Mode) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBillModel("DAILY_PERIODIC")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    billModel === "DAILY_PERIODIC"
                      ? "bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-md"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>ദിവസ സപ്ലൈ</span>
                  </div>
                  <div className="text-[10px] text-purple-200/70 mt-0.5 leading-tight">
                    പൂവ് മാല, പാൽ (തീയതി ക്രമം, ലീവ് & ഞായർ ഒഴിവാക്കൽ)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillModel("MONTHLY_FIXED")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    billModel === "MONTHLY_FIXED"
                      ? "bg-purple-500/20 border-purple-400/60 text-purple-200 shadow-md"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>മാസ വാടക/ഫീസ്</span>
                  </div>
                  <div className="text-[10px] text-purple-200/70 mt-0.5 leading-tight">
                    പത്രം, കേബിൾ, ഇന്റർനെറ്റ് (നിശ്ചിത മാസ തുക)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBillModel("ITEMIZED")}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    billModel === "ITEMIZED"
                      ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-md"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-black text-xs">
                    <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                    <span>സാധനങ്ങളുടെ ലിസ്റ്റ്</span>
                  </div>
                  <div className="text-[10px] text-purple-200/70 mt-0.5 leading-tight">
                    പ്ലംബിംഗ്, ഇലക്ട്രിക്കൽ, പ്രിന്റിംഗ്, സാധനങ്ങൾ
                  </div>
                </button>
              </div>
            </div>

            {/* VENDOR SELECTION / NEW VENDOR */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>വെണ്ടർ വിവരങ്ങൾ (Vendor & Payee) *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewVendor(!isCreatingNewVendor)}
                  className="text-[11px] text-purple-300 hover:text-amber-300 underline font-bold cursor-pointer"
                >
                  {isCreatingNewVendor ? "ലിസ്റ്റിൽ നിന്നും തിരഞ്ഞെടുക്കുക" : "+ പുതിയ വെണ്ടറെ ചേർക്കുക"}
                </button>
              </div>

              {isCreatingNewVendor ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      വെണ്ടർ പേര് *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ranjith Poov Mala / Milma Dairy"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-400/40 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      സ്ഥാപനം / ഷോപ്പ് (Business Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Poov Mala Flowers / Fresh Dairy"
                      value={newVendorShop}
                      onChange={(e) => setNewVendorShop(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      മൊബൈൽ / GPay നമ്പർ
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9847000000"
                      value={newVendorMobile}
                      onChange={(e) => {
                        setNewVendorMobile(e.target.value);
                        if (!newVendorGPay) setNewVendorGPay(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
                      UPI ID (GPay QR കോഡിനായി)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ranjith@okaxis"
                      value={newVendorUpi}
                      onChange={(e) => setNewVendorUpi(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-purple-950 border border-purple-400/40 text-white text-xs cursor-pointer"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vendorName} ({v.category} - {v.mobileNumber || "No Phone"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-purple-200/80 flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      GPay: {vendors.find((v) => v.id === selectedVendorId)?.gpayNumber || vendors.find((v) => v.id === selectedVendorId)?.mobileNumber || "Not configured"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* DYNAMIC CALCULATION SECTION ACCORDING TO MODEL */}
            {billModel === "DAILY_PERIODIC" && (
              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>ദിവസ സപ്ലൈ കണക്കുകൂട്ടൽ (Daily Rate Calculation Engine)</span>
                  </span>
                  <span className="text-[10px] text-amber-200/80 font-mono">
                    {dailyAnalysis.totalDays} Total Calendar Days
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">തുടക്ക തീയതി (From)</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">അവസാന തീയതി (To)</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-300 mb-0.5">ഒരു ദിവസ നിരക്ക് (₹/Day) *</label>
                    <input
                      type="number"
                      min="1"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-amber-400/50 text-amber-300 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">ലീവ് / ഒഴിവ് ദിനങ്ങൾ</label>
                    <input
                      type="number"
                      min="0"
                      value={leaveDays}
                      onChange={(e) => setLeaveDays(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Exclude Sundays Toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/10 text-xs">
                  <label className="flex items-center gap-2 text-purple-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excludeSundays}
                      onChange={(e) => setExcludeSundays(e.target.checked)}
                      className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span>ഞായറാഴ്ചകൾ ഒഴിവാക്കുക (Exclude Sundays: {dailyAnalysis.sundays} days)</span>
                  </label>
                  <span className="text-[11px] font-mono text-emerald-300 font-bold">
                    ആകെ വിതരണ ദിനങ്ങൾ: {Math.max(0, dailyAnalysis.totalDays - (excludeSundays ? dailyAnalysis.sundays : 0) - leaveDays)} Days
                  </span>
                </div>

                {/* Extra supply */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">അധിക സാധനങ്ങൾ / മാല (Extra Count)</label>
                    <input
                      type="number"
                      min="0"
                      value={extraCount}
                      onChange={(e) => setExtraCount(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 mb-0.5">അധിക സാധന നിരക്ക് (Extra Rate ₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={extraRate}
                      onChange={(e) => setExtraRate(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {billModel === "MONTHLY_FIXED" && (
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2.5">
                <label className="block text-xs font-bold text-purple-300">
                  മാസ നിശ്ചിത ബിൽ തുക (Monthly Amount ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-purple-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-purple-950/80 border border-purple-400/50 text-amber-300 font-mono text-lg font-black"
                  />
                </div>
                <p className="text-[10px] text-purple-200/70">
                  പത്രം, കേബിൾ ടിവി, ഇന്റർനെറ്റ് തുടങ്ങിയ മാസ അടിസ്ഥാനത്തിലുള്ള കൃത്യമായ ബിൽ തുക.
                </p>
              </div>
            )}

            {billModel === "ITEMIZED" && (
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300">
                    സാധനങ്ങളുടെ / ജോലികളുടെ വിവരങ്ങൾ (Itemized Line Items) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>വരി ചേർക്കുക</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={it.id} className="grid grid-cols-12 gap-1.5 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="വിവരണം (Description)"
                          value={it.description}
                          onChange={(e) => handleItemChange(it.id, "description", e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-purple-950/80 border border-white/20 text-white text-[11px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(it.id, "quantity", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-purple-950/80 border border-white/20 text-white text-[11px] font-mono text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          placeholder="Rate ₹"
                          value={it.rate}
                          onChange={(e) => handleItemChange(it.id, "rate", Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-purple-950/80 border border-white/20 text-white text-[11px] font-mono text-center"
                        />
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-amber-300 text-xs">
                        ₹{(it.amount || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          disabled={items.length <= 1}
                          className="text-rose-400 hover:text-rose-300 disabled:opacity-30 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BILL NUMBER, DATE & DUE DATE */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-0.5">ബിൽ നമ്പർ (Bill No) *</label>
                <input
                  type="text"
                  required
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white font-mono text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-0.5">ബിൽ തീയതി *</label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-white/20 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-rose-300 mb-0.5">അവസാന തീയതി (Due Date)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-purple-950/80 border border-rose-400/40 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* TOTAL AMOUNT & PAYMENT STATUS */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 to-purple-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-amber-200/80 font-bold uppercase">ആകെ ബിൽ തുക (Calculated Bill Amount)</div>
                <div className="text-2xl font-black text-amber-300 font-mono">
                  ₹{computedTotal.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-0.5">നൽകിയ തുക (Paid ₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={computedTotal}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-28 px-2.5 py-1.5 rounded-xl bg-purple-950 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-0.5">പേയ്‌മെന്റ് മോഡ്</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-950 border border-white/20 text-white text-xs"
                  >
                    <option value="GPay (UPI)">GPay (UPI)</option>
                    <option value="Cash">Cash (പണം)</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 text-xs font-bold transition cursor-pointer"
              >
                റദ്ദാക്കുക (Cancel)
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-purple-500/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ബിൽ സേവ് ചെയ്യുക & ക്രിയേറ്റ് ചെയ്യുക</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
