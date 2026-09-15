import React, { useState } from "react";
import {
  ConstructionAgreement,
  ConstructionProject,
  ConstructionSettings,
  ClientDetails,
  BuildingLocation,
  FloorAreaEntry,
  ConstructionProjectType,
  ConstructionRoofingType,
  ConstructionFlooringType,
  PaymentScheduleItem,
  ConstructionExtraWorkItem
} from "../../types";
import {
  ConstructionStorageManager,
  formatIndianCurrency,
  convertAmountToWords,
  convertAmountToMalayalamWords,
  DEFAULT_WORK_SPECIFICATIONS,
  DEFAULT_GENERAL_CLAUSES
} from "../../utils/constructionStorageManager";
import {
  Building2,
  MapPin,
  Layers,
  Calculator,
  Receipt,
  FileCheck2,
  Plus,
  Trash2,
  ShieldCheck,
  Compass,
  Home,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Wrench
} from "lucide-react";

interface NewConstructionFormTabProps {
  settings: ConstructionSettings;
  onAgreementCreated: (agreement: ConstructionAgreement) => void;
  onProjectCreated: (project: ConstructionProject) => void;
}

export const NewConstructionFormTab: React.FC<NewConstructionFormTabProps> = ({
  settings,
  onAgreementCreated,
  onProjectCreated
}) => {
  // Step 1: Client Details
  const [client, setClient] = useState<ClientDetails>({
    clientName: "",
    houseName: "",
    address: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    email: "",
    panOrIdNumber: "",
    siteAddress: "",
    localBody: "Keralassery Grama Panchayat",
    village: "Keralassery",
    taluk: "Palakkad",
    district: "Palakkad",
    pinCode: "678641"
  });

  // Step 2: Location
  const [location, setLocation] = useState<BuildingLocation>({
    fullAddress: "",
    googleMapsUrl: "",
    latitude: "10.8256",
    longitude: "76.5189",
    siteRemarks: ""
  });

  // Step 3: Types
  const [projectType, setProjectType] = useState<ConstructionProjectType>("New Construction");
  const [roofingType, setRoofingType] = useState<ConstructionRoofingType>("Contemporary");
  const [flooringType, setFlooringType] = useState<ConstructionFlooringType>("Granite");

  // Step 4: Floor-wise Areas
  const [floors, setFloors] = useState<FloorAreaEntry[]>([
    {
      id: "fl_1",
      floorName: "Ground Floor",
      existingAreaSqFt: 0,
      proposedAreaSqFt: 1200,
      areaSqFt: 1200,
      remarks: "Proposed Area"
    },
    {
      id: "fl_2",
      floorName: "First Floor",
      existingAreaSqFt: 0,
      proposedAreaSqFt: 1000,
      areaSqFt: 1000,
      remarks: "Proposed Area"
    }
  ]);

  // Step 5: Extra Works (Multiple Items Support)
  const [extraWorks, setExtraWorks] = useState<ConstructionExtraWorkItem[]>([]);

  // Step 6: Costing
  const [calculationMode, setCalculationMode] = useState<"SIMPLE" | "DETAILED">("SIMPLE");
  const [baseRatePerSqFt, setBaseRatePerSqFt] = useState<number>(settings.defaultRates.baseRatePerSqFt || 2300);
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [completionPeriodMonths, setCompletionPeriodMonths] = useState<number>(settings.agreementTemplate.defaultCompletionMonths || 10);

  // Computed Totals
  const totalBuiltUpArea = floors.reduce((sum, f) => sum + (f.areaSqFt || 0), 0);
  const estimatedConstructionCost = totalBuiltUpArea * baseRatePerSqFt;
  const extraWorksTotal = extraWorks.reduce((sum, ew) => sum + (ew.totalAmount || 0), 0);
  const taxableAmount = estimatedConstructionCost + extraWorksTotal - discount;
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const finalContractAmount = taxableAmount + taxAmount;
  const effectiveRatePerSqFt = totalBuiltUpArea > 0 ? Math.round(finalContractAmount / totalBuiltUpArea) : baseRatePerSqFt;

  // Step 7: Payment Schedule (Initialized based on stages)
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([
    { id: "ps_1", stageName: "കരാർ അഡ്വാൻസ് (Agreement Advance)", stageNameMl: "കരാർ ഒപ്പിടുമ്പോൾ", percentage: 10, amount: Math.round((finalContractAmount * 10) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 10) / 100), remarks: "കരാർ ഒപ്പിടുമ്പോൾ" },
    { id: "ps_2", stageName: "ഫൗണ്ടേഷൻ പൂർത്തീകരണം (Foundation)", stageNameMl: "ഫൗണ്ടേഷൻ പൂർത്തിയാകുമ്പോൾ", percentage: 10, amount: Math.round((finalContractAmount * 10) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 10) / 100), remarks: "ഫൗണ്ടേഷൻ ഗ്രൗണ്ട് ലെവൽ പൂർത്തിയാകുമ്പോൾ" },
    { id: "ps_3", stageName: "ബേസ്മെന്റ് & പ്ലിന്ത് ബെൽറ്റ് (Plinth Belt)", stageNameMl: "ബേസ്മെന്റ് പ്ലിന്ത് ബെൽറ്റ്", percentage: 10, amount: Math.round((finalContractAmount * 10) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 10) / 100), remarks: "ബേസ്മെന്റ് പ്ലിന്ത് കോൺക്രീറ്റ്" },
    { id: "ps_4", stageName: "ലിന്റൽ & സൺഷെയ്ഡ് (Lintel & Sunshade)", stageNameMl: "ലിന്റൽ കാസ്റ്റിംഗ്", percentage: 10, amount: Math.round((finalContractAmount * 10) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 10) / 100), remarks: "ലിന്റൽ കാസ്റ്റിംഗ് പൂർത്തിയാകുമ്പോൾ" },
    { id: "ps_5", stageName: "ഗ്രൗണ്ട് ഫ്ലോർ റൂഫ് സ്ലാബ് (Ground Floor Slab)", stageNameMl: "ഗ്രൗണ്ട് ഫ്ലോർ കോൺക്രീറ്റ്", percentage: 15, amount: Math.round((finalContractAmount * 15) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 15) / 100), remarks: "മെയിൻ റൂഫ് സ്ലാബ് കോൺക്രീറ്റ്" },
    { id: "ps_6", stageName: "ഫസ്റ്റ് ഫ്ലോർ സ്ലാബ് (First Floor Slab)", stageNameMl: "ഫസ്റ്റ് ഫ്ലോർ കോൺക്രീറ്റ്", percentage: 15, amount: Math.round((finalContractAmount * 15) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 15) / 100), remarks: "ടോപ്പ് റൂഫ് സ്ലാബ് കോൺക്രീറ്റ്" },
    { id: "ps_7", stageName: "പ്ലാസ്റ്ററിംഗ് & പൈപ്പിംഗ് (Plastering)", stageNameMl: "പ്ലാസ്റ്ററിംഗ് & വയറിംഗ്", percentage: 15, amount: Math.round((finalContractAmount * 15) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 15) / 100), remarks: "ഇന്റീരിയർ & എക്സ്റ്റീരിയർ പ്ലാസ്റ്ററിംഗ്" },
    { id: "ps_8", stageName: "ഫ്ലോറിംഗ് & വാതിലുകൾ (Flooring & Doors)", stageNameMl: "ടൈൽസ് & വാതിലുകൾ", percentage: 10, amount: Math.round((finalContractAmount * 10) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 10) / 100), remarks: "ടൈൽ പതിക്കലും വാതിലുകളും" },
    { id: "ps_9", stageName: "പെയിന്റിംഗ്, ഇലക്ട്രിക്കൽ & സാനിറ്ററി (Finishing)", stageNameMl: "ഫിനിഷിംഗ് ജോലികൾ", percentage: 3, amount: Math.round((finalContractAmount * 3) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 3) / 100), remarks: "ഫൈനൽ പെയിന്റും ഫിറ്റിംഗ്സും" },
    { id: "ps_10", stageName: "താക്കോൽ കൈമാറ്റം (Handover Settlement)", stageNameMl: "താക്കോൽ കൈമാറ്റം", percentage: 2, amount: Math.round((finalContractAmount * 2) / 100), status: "PENDING", paidAmount: 0, balance: Math.round((finalContractAmount * 2) / 100), remarks: "ഫൈനൽ ക്ലീനിംഗും താക്കോൽ കൈമാറ്റവും" }
  ]);

  // Form Validation & Generation State
  const [formError, setFormError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to add floor
  const handleAddFloor = () => {
    const newFloor: FloorAreaEntry = {
      id: `fl_${Date.now()}`,
      floorName: `Floor ${floors.length + 1}`,
      existingAreaSqFt: 0,
      proposedAreaSqFt: 500,
      areaSqFt: 500,
      remarks: ""
    };
    setFloors([...floors, newFloor]);
  };

  const handleRemoveFloor = (index: number) => {
    if (floors.length <= 1) return;
    setFloors(floors.filter((_, i) => i !== index));
  };

  const handleFloorChange = (index: number, field: keyof FloorAreaEntry, val: any) => {
    const updated = [...floors];
    updated[index] = { ...updated[index], [field]: val };
    setFloors(updated);
  };

  // Extra works handlers
  const handleAddExtraWork = (preset?: { name: string; nameMl: string; rate: number; unit: string; qty: number }) => {
    const newItem: ConstructionExtraWorkItem = {
      id: `ew_${Date.now()}`,
      name: preset?.name || "Additional Work",
      nameMl: preset?.nameMl || "അധിക നിർമ്മാണ ജോലി",
      floorOrArea: "Ground Floor",
      category: "CIVIL",
      quantity: preset?.qty || 1,
      unit: preset?.unit || "LS",
      unitRate: preset?.rate || 10000,
      totalAmount: (preset?.qty || 1) * (preset?.rate || 10000),
      isIncluded: true,
      status: "APPROVED",
      paymentStatus: "PENDING",
      remarks: ""
    };
    setExtraWorks(prev => [...prev, newItem]);
  };

  const handleUpdateExtraWork = (idx: number, patch: Partial<ConstructionExtraWorkItem>) => {
    const updated = [...extraWorks];
    const cur = updated[idx];
    const item = { ...cur, ...patch };

    if (patch.quantity !== undefined || patch.unitRate !== undefined) {
      const q = patch.quantity !== undefined ? patch.quantity : cur.quantity;
      const r = patch.unitRate !== undefined ? patch.unitRate : cur.unitRate;
      item.totalAmount = Math.round(q * r);
    }
    updated[idx] = item;
    setExtraWorks(updated);
  };

  const handleRemoveExtraWork = (idx: number) => {
    setExtraWorks(extraWorks.filter((_, i) => i !== idx));
  };

  // Recalculate payment stages when finalContractAmount changes
  const updateScheduleAmounts = (newTotal: number) => {
    setPaymentSchedule(prev => prev.map(p => ({
      ...p,
      amount: Math.round((newTotal * p.percentage) / 100),
      balance: Math.round((newTotal * p.percentage) / 100) - p.paidAmount
    })));
  };

  const handleGenerateAgreement = async () => {
    // Basic Validation
    if (!client.clientName.trim()) {
      setFormError("ദയവായി ക്ലയന്റിന്റെ പേര് (Client Name) രേഖപ്പെടുത്തുക.");
      return;
    }
    if (!client.mobileNumber.trim()) {
      setFormError("ദയവായി സാധുതയുള്ള മൊബൈൽ നമ്പർ രേഖപ്പെടുത്തുക.");
      return;
    }
    if (totalBuiltUpArea <= 0) {
      setFormError("ആകെ വിസ്തീർണ്ണം (Total Built-up Area) 0-ൽ കൂടുതലായിരിക്കണം.");
      return;
    }

    const totalPct = paymentSchedule.reduce((sum, p) => sum + p.percentage, 0);
    if (totalPct !== 100) {
      setFormError(`പെയ്‌മെന്റ് ഷെഡ്യൂളിന്റെ ആകെ ശതമാനം കൃത്യം 100% ആകണം (നിലവിൽ ${totalPct}%).`);
      return;
    }

    setFormError("");
    setIsGenerating(true);

    try {
      const agreementNo = ConstructionStorageManager.generateNextAgreementNo();
      const projId = `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const token = ConstructionStorageManager.generateVerificationToken();
      const now = new Date().toISOString();
      const todayStr = now.slice(0, 10);

      // Target Completion Date
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + completionPeriodMonths);
      const targetDateStr = targetDate.toISOString().slice(0, 10);

      // Attach standard engineering checklist to each stage
      const scheduleWithChecklists: PaymentScheduleItem[] = paymentSchedule.map((stg, i) => {
        const defaultChecklist = ConstructionStorageManager.getDefaultStageChecklist(stg.stageName);
        return {
          ...stg,
          checklist: defaultChecklist.map((c, ci) => ({
            id: `chk_${stg.id || i}_${ci}`,
            title: c.title,
            titleMl: c.titleMl,
            isCompleted: false
          })),
          progressPercent: 0,
          totalTasksCount: defaultChecklist.length,
          completedTasksCount: 0
        };
      });

      const newAgreement: ConstructionAgreement = {
        id: agreementNo,
        agreementNo,
        projectId: projId,
        title: `Construction Agreement - ${client.clientName}`,
        client,
        contractor: settings.contractor,
        location: {
          fullAddress: location.fullAddress || client.siteAddress || `${client.localBody}, ${client.district}`,
          googleMapsUrl: location.googleMapsUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          siteRemarks: location.siteRemarks
        },
        projectType,
        roofingType,
        flooringType,
        floors,
        totalBuiltUpArea,
        calculationMode,
        baseRatePerSqFt,
        estimatedConstructionCost,
        additionalCosts: extraWorksTotal,
        extraWorks,
        discount,
        taxPercent,
        taxAmount,
        finalContractAmount,
        effectiveRatePerSqFt,
        amountInWords: convertAmountToWords(finalContractAmount),
        amountInWordsMl: convertAmountToMalayalamWords(finalContractAmount),
        paymentSchedule: scheduleWithChecklists,
        specifications: DEFAULT_WORK_SPECIFICATIONS,
        clauses: settings.agreementTemplate.clauses || DEFAULT_GENERAL_CLAUSES,
        agreementDate: todayStr,
        completionPeriodMonths,
        completionTargetDate: targetDateStr,
        place: settings.agreementTemplate.place || "Keralassery",
        verificationToken: token,
        status: "GENERATED",
        version: 1,
        createdAt: now,
        updatedAt: now
      };

      const savedAgreement = await ConstructionStorageManager.saveAgreement(newAgreement);

      // Also create Project entity
      const newProject: ConstructionProject = {
        id: projId,
        projectNo: projId,
        title: `${client.clientName} - ${roofingType} ${projectType}`,
        client,
        location: newAgreement.location,
        projectType,
        roofingType,
        flooringType,
        floors,
        totalBuiltUpArea,
        baseRatePerSqFt,
        finalContractAmount,
        effectiveRatePerSqFt,
        currentStage: "Agreement / Advance",
        status: "IN_PROGRESS",
        agreementId: savedAgreement.id,
        paymentSchedule: scheduleWithChecklists,
        extraWorks,
        totalReceived: 0,
        balanceAmount: finalContractAmount,
        progressPercentage: 0,
        startDate: todayStr,
        targetCompletionDate: targetDateStr,
        createdAt: now,
        updatedAt: now
      };

      const savedProject = ConstructionStorageManager.saveProject(newProject);

      onAgreementCreated(savedAgreement);
      onProjectCreated(savedProject);
    } catch (e) {
      console.error(e);
      setFormError("Error generating agreement. Please check inputs.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight font-sans">
              പുതിയ നിർമ്മാണം & കരാർ തയ്യാറാക്കൽ
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              NEW CONSTRUCTION REGISTRATION & AGREEMENT GENERATION WIZARD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAgreement}
            disabled={isGenerating}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "തയ്യാറാക്കുന്നു..." : "കരാർ ജനറേറ്റ് ചെയ്യുക (GENERATE AGREEMENT)"}</span>
          </button>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-rose-300 text-xs font-mono font-bold flex items-center gap-2">
          <span>⚠️ {formError}</span>
        </div>
      )}

      {/* Grid: 2 Columns on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client & Location & Specifications */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Client Details */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-emerald-400">
              <Home className="w-4 h-4" />
              <span>1. ക്ലയന്റ് വിവരങ്ങൾ (Client Details)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  ക്ലയന്റിന്റെ പേര് (Client Name) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sri. Haridasan K / Smt. Lakshmi"
                  value={client.clientName}
                  onChange={e => setClient({ ...client, clientName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  വീട്ടുപേര് (House Name)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nandanam / Aiswarya"
                  value={client.houseName}
                  onChange={e => setClient({ ...client, houseName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  നിലവിലെ മേൽവിലാസം (Present Address)
                </label>
                <input
                  type="text"
                  placeholder="Street / House address"
                  value={client.address}
                  onChange={e => setClient({ ...client, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  മൊബൈൽ നമ്പർ (Mobile Number) *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9847123456"
                  value={client.mobileNumber}
                  onChange={e => setClient({ ...client, mobileNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  ഇമെയിൽ (Email Address)
                </label>
                <input
                  type="email"
                  placeholder="client@email.com"
                  value={client.email || ""}
                  onChange={e => setClient({ ...client, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  പഞ്ചായത്ത് / മുനിസിപ്പാലിറ്റി (Local Body)
                </label>
                <input
                  type="text"
                  value={client.localBody}
                  onChange={e => setClient({ ...client, localBody: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  ജില്ല (District) & PIN
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={client.district}
                    onChange={e => setClient({ ...client, district: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                  <input
                    type="text"
                    value={client.pinCode}
                    onChange={e => setClient({ ...client, pinCode: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Building Location */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-cyan-400">
              <MapPin className="w-4 h-4" />
              <span>2. കെട്ടിടത്തിന്റെ ലൊക്കേഷൻ (Proposed Building Location)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  സൈറ്റ് മേൽവിലാസം (Full Site Address):
                </label>
                <input
                  type="text"
                  placeholder="Plot No., Survey No., Landmark, Locality"
                  value={location.fullAddress}
                  onChange={e => setLocation({ ...location, fullAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    Google Maps ലിങ്ക് (Location URL):
                  </label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/?q=..."
                    value={location.googleMapsUrl || ""}
                    onChange={e => setLocation({ ...location, googleMapsUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    സൈറ്റ് സവിശേഷതകൾ (Site Remarks):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5-meter road frontage, hard soil"
                    value={location.siteRemarks || ""}
                    onChange={e => setLocation({ ...location, siteRemarks: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Construction & Roofing & Flooring Type */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-amber-400">
              <Compass className="w-4 h-4" />
              <span>3. നിർമ്മാണ രീതിയും രൂപകൽപ്പനയും (Construction & Roofing Type)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5">പ്രോജക്ട് തരം (Project Type):</label>
                <div className="space-y-1.5">
                  {(["New Construction", "Addition", "Extension", "Renovation", "Other"] as const).map(t => (
                    <label key={t} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-600 transition">
                      <input
                        type="radio"
                        name="projectType"
                        checked={projectType === t}
                        onChange={() => setProjectType(t)}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="font-mono text-slate-200">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5">മേൽക്കൂര ശൈലി (Roofing Type):</label>
                <div className="space-y-1.5">
                  {(["Contemporary", "Flat Roof", "Sloped Roof", "Other"] as const).map(r => (
                    <label key={r} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-600 transition">
                      <input
                        type="radio"
                        name="roofingType"
                        checked={roofingType === r}
                        onChange={() => setRoofingType(r)}
                        className="text-cyan-500 focus:ring-cyan-500"
                      />
                      <span className="font-mono text-slate-200">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1.5">ഫ്ലോറിംഗ് തരം (Flooring Type):</label>
                <div className="space-y-1.5">
                  {(["Tile", "Granite", "Kavi", "Advanced / Premium", "Other"] as const).map(f => (
                    <label key={f} className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-600 transition">
                      <input
                        type="radio"
                        name="flooringType"
                        checked={flooringType === f}
                        onChange={() => setFlooringType(f)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-mono text-slate-200">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Floor-wise Area Entry, Extra Works & Cost Engine */}
        <div className="lg:col-span-5 space-y-6">
          {/* 4. Floor-Wise Area Entry */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-400">
                <Layers className="w-4 h-4" />
                <span>4. നിലകൾ തിരിച്ചുള്ള വിസ്തീർണ്ണം (Floor Areas)</span>
              </div>
              <button
                type="button"
                onClick={handleAddFloor}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ഫ്ലോർ</span>
              </button>
            </div>

            <div className="space-y-3">
              {floors.map((floor, idx) => (
                <div key={floor.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <input
                      type="text"
                      value={floor.floorName}
                      onChange={e => handleFloorChange(idx, "floorName", e.target.value)}
                      className="font-bold text-white bg-transparent focus:border-indigo-400 focus:outline-none w-1/2 font-mono"
                    />
                    {floors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFloor(idx)}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Existing Area (Sq.Ft)</label>
                      <input
                        type="number"
                        value={floor.existingAreaSqFt}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const total = val + floor.proposedAreaSqFt;
                          handleFloorChange(idx, "existingAreaSqFt", val);
                          handleFloorChange(idx, "areaSqFt", total);
                          updateScheduleAmounts((totalBuiltUpArea - floor.areaSqFt + total) * baseRatePerSqFt + extraWorksTotal);
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-right text-slate-300 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-mono uppercase">Proposed Area (Sq.Ft)</label>
                      <input
                        type="number"
                        value={floor.proposedAreaSqFt}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          const total = floor.existingAreaSqFt + val;
                          handleFloorChange(idx, "proposedAreaSqFt", val);
                          handleFloorChange(idx, "areaSqFt", total);
                          updateScheduleAmounts((totalBuiltUpArea - floor.areaSqFt + total) * baseRatePerSqFt + extraWorksTotal);
                        }}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-right text-emerald-400 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Total Floor Area:</span>
                    <span className="text-sm font-black text-white font-mono">{floor.areaSqFt.toLocaleString()} Sq.Ft</span>
                  </div>
                </div>
              ))}

              {/* Total Built-up Area Banner */}
              <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl flex justify-between items-center font-mono">
                <div>
                  <div className="text-xs text-slate-300 font-bold">ആകെ നിർമ്മിത വിസ്തീർണ്ണം</div>
                  <div className="text-[10px] text-indigo-300">TOTAL BUILT-UP AREA</div>
                </div>
                <div className="text-lg font-black text-indigo-400">
                  {totalBuiltUpArea.toLocaleString()} <span className="text-xs font-normal">Sq.Ft</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Multiple Additional Works (Add-on Items) */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <Wrench className="w-4 h-4" />
                <span>5. അധിക ജോലികൾ (Additional Works - {extraWorks.length})</span>
              </div>
              <button
                type="button"
                onClick={() => handleAddExtraWork()}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ അധിക ജോലി</span>
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { name: "Compound Wall & Gate", nameMl: "ചുറ്റുമതിൽ & ഗേറ്റ്", rate: 850, unit: "R.Ft", qty: 120 },
                { name: "Well & Concrete Rings", nameMl: "കിണർ & റിംഗ്", rate: 60000, unit: "LS", qty: 1 },
                { name: "Interlock Paving Yard", nameMl: "മുറ്റത്ത് ഇന്റർലോക്ക്", rate: 75, unit: "Sq.Ft", qty: 450 },
                { name: "Modular Kitchen", nameMl: "മോഡുലാർ കിച്ചൻ", rate: 125000, unit: "LS", qty: 1 }
              ].map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddExtraWork(p)}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-lg text-[10px] whitespace-nowrap cursor-pointer transition"
                >
                  + {p.nameMl}
                </button>
              ))}
            </div>

            {/* Extra Works List */}
            {extraWorks.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {extraWorks.map((work, idx) => (
                  <div key={work.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={work.nameMl || work.name}
                        onChange={e => handleUpdateExtraWork(idx, { nameMl: e.target.value, name: e.target.value })}
                        className="font-bold text-white bg-transparent border-b border-slate-700 pb-0.5 focus:border-amber-400 focus:outline-none w-1/2"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">{formatIndianCurrency(work.totalAmount)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraWork(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                      <div>
                        <span>Qty: </span>
                        <input
                          type="number"
                          value={work.quantity}
                          onChange={e => handleUpdateExtraWork(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-12 p-0.5 bg-slate-900 border border-slate-700 rounded text-center text-white"
                        />
                      </div>
                      <div>
                        <span>Unit: </span>
                        <input
                          type="text"
                          value={work.unit}
                          onChange={e => handleUpdateExtraWork(idx, { unit: e.target.value })}
                          className="w-10 p-0.5 bg-slate-900 border border-slate-700 rounded text-center text-white"
                        />
                      </div>
                      <div>
                        <span>Rate: ₹</span>
                        <input
                          type="number"
                          value={work.unitRate}
                          onChange={e => handleUpdateExtraWork(idx, { unitRate: parseFloat(e.target.value) || 0 })}
                          className="w-16 p-0.5 bg-slate-900 border border-slate-700 rounded text-right text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Construction Cost Engine */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold text-emerald-400">
              <Calculator className="w-4 h-4" />
              <span>6. നിർമ്മാണ ചെലവ് കാൽക്കുലേറ്റർ (Cost Calculator)</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  സ്ക്വയർ ഫീറ്റ് അടിസ്ഥാന നിരക്ക് (Base Rate / Sq.Ft):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={baseRatePerSqFt}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setBaseRatePerSqFt(val);
                      updateScheduleAmounts(totalBuiltUpArea * val + extraWorksTotal - discount);
                    }}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold text-sm"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-mono">₹ / Sq.Ft</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    അധിക ജോലികൾ (Extra Works):
                  </label>
                  <div className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold">
                    {formatIndianCurrency(extraWorksTotal)}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    ഇളവ് (Discount):
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-rose-400 font-mono"
                  />
                </div>
              </div>

              {/* Grand Final Box */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                  <span>പ്രാഥമിക കെട്ടിട ചെലവ്:</span>
                  <span>{formatIndianCurrency(estimatedConstructionCost)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-white border-t border-slate-800 pt-2">
                  <span>ആകെ കരാർ തുക (Final Contract):</span>
                  <span className="text-emerald-400 font-mono text-base font-black">
                    {formatIndianCurrency(finalContractAmount)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-serif">
                  {convertAmountToWords(finalContractAmount)}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
                  <span>Effective Rate: {formatIndianCurrency(effectiveRatePerSqFt, false)}/Sq.Ft</span>
                  <span>Completion: {completionPeriodMonths} Months</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
