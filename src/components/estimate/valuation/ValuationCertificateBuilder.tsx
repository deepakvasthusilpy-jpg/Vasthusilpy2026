import React, { useState, useEffect } from "react";
import { ValuationCertificate } from "../../../types";
import {
  calculateValuationDetails,
  CPWD_RATE_PRESETS,
  KERALA_DISTRICT_COST_INDICES,
  SQM_TO_SQFT,
  INITIAL_SAMPLE_VALUATIONS
} from "../../../data/valuationData";
import { INITIAL_PRESETS_ENGINEERS } from "../../../data/estimateData";
import { useAuth } from "../../../context/AuthContext";
import { canUseDigitalSignatures } from "../../../lib/firebase";
import {
  Calculator,
  User,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Save,
  RotateCcw,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
  ExternalLink,
  Percent,
  Sliders,
  Home,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  UserCheck
} from "lucide-react";

interface ValuationCertificateBuilderProps {
  certificate: ValuationCertificate;
  onChange: (cert: ValuationCertificate) => void;
  onSave: (cert: ValuationCertificate) => void;
  onPrint: () => void;
  onDownloadPdf: () => void;
  onCloseBuilder?: () => void;
}

export const ValuationCertificateBuilder: React.FC<ValuationCertificateBuilderProps> = ({
  certificate,
  onChange,
  onSave,
  onPrint,
  onDownloadPdf,
  onCloseBuilder
}) => {
  const { user, emailUser } = useAuth();
  const activeEmail = user?.email || emailUser?.email || "";
  const isAuthorizedSigner = canUseDigitalSignatures(activeEmail);

  const [formData, setFormData] = useState<ValuationCertificate>(certificate);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFontSettings, setShowFontSettings] = useState(false);
  const [sqmInput, setSqmInput] = useState<string>(String(certificate.areaSqM || 100));
  const [sqftInput, setSqftInput] = useState<string>(String(certificate.areaSqFt || 1076.39));

  // Sync formData when prop changes
  useEffect(() => {
    setFormData(certificate);
    setSqmInput(String(certificate.areaSqM || ""));
    setSqftInput(String(certificate.areaSqFt || ""));
  }, [certificate.id]);

  const updateField = <K extends keyof ValuationCertificate>(
    field: K,
    val: ValuationCertificate[K]
  ) => {
    const next = calculateValuationDetails({
      ...formData,
      [field]: val
    });
    setFormData(next);
    onChange(next);
  };

  const handleSqmChange = (valStr: string) => {
    setSqmInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      const calculatedSqft = Math.round(num * SQM_TO_SQFT * 100) / 100;
      setSqftInput(String(calculatedSqft));
      const next = calculateValuationDetails({
        ...formData,
        areaSqM: num,
        areaSqFt: calculatedSqft
      });
      setFormData(next);
      onChange(next);
    }
  };

  const handleSqftChange = (valStr: string) => {
    setSqftInput(valStr);
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      const calculatedSqm = Math.round((num / SQM_TO_SQFT) * 100) / 100;
      setSqmInput(String(calculatedSqm));
      const next = calculateValuationDetails({
        ...formData,
        areaSqFt: num,
        areaSqM: calculatedSqm
      });
      setFormData(next);
      onChange(next);
    }
  };

  const handleClearValuerDetails = () => {
    const next = calculateValuationDetails({
      ...formData,
      valuerName: "",
      valuerAddress: "",
      designation: "Licensed Building Valuer / Registered Engineer",
      regNo: "",
      subRegistryOffice: "",
      engineerSealId: "blank_engineer",
      engineerPhone: "",
      engineerEmail: ""
    });
    setFormData(next);
    onChange(next);
  };

  const handleSelectEngineerPreset = (presetId: string) => {
    if (presetId === "blank_engineer" || presetId === "clear") {
      handleClearValuerDetails();
      return;
    }
    const eng = INITIAL_PRESETS_ENGINEERS.find((e) => e.id === presetId);
    if (eng) {
      const next = calculateValuationDetails({
        ...formData,
        valuerName: eng.fullName,
        valuerAddress: eng.houseAddress && eng.districtPincode ? `${eng.houseAddress}, ${eng.districtPincode}` : eng.houseAddress || "",
        designation: eng.designation || "Licensed Building Supervisor / Valuer",
        regNo: eng.regNo,
        engineerSealId: eng.id,
        engineerPhone: eng.phones,
        engineerEmail: eng.email
      });
      setFormData(next);
      onChange(next);
    }
  };

  const handleSelectCpwdPreset = (presetId: string) => {
    const preset = CPWD_RATE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const next = calculateValuationDetails({
        ...formData,
        cpwdRatePerSqM: preset.ratePerSqM
      });
      setFormData(next);
      onChange(next);
    }
  };

  const handleSelectCostIndexPreset = (districtName: string) => {
    const preset = KERALA_DISTRICT_COST_INDICES.find((c) => c.district === districtName);
    if (preset) {
      const next = calculateValuationDetails({
        ...formData,
        costIndex: preset.index,
        costIndexName: preset.locationName,
        subRegistryOffice: formData.subRegistryOffice || preset.district
      });
      setFormData(next);
      onChange(next);
    }
  };

  const handleYearOfConstructionChange = (yrVal: number) => {
    const currentYear = new Date().getFullYear();
    const age = Math.max(0, currentYear - yrVal);
    const next = calculateValuationDetails({
      ...formData,
      yearOfConstruction: yrVal,
      ageOfBuilding: age
    });
    setFormData(next);
    onChange(next);
  };

  const handleCopySummary = () => {
    const summary = `VALUATION CERTIFICATE SUMMARY
---------------------------------------------
Sub Registry: ${formData.subRegistryOffice}
Section: Under Section ${formData.sectionType} of Kerala Stamp Act, 1959
Owner: ${formData.ownerName}
Property: ${formData.propertyAddress || formData.ownerAddress}
Door No: ${formData.doorNo}

CALCULATION DETAILS:
- Plinth Area: ${formData.areaSqFt} sq.ft (${formData.areaSqM} m²)
- CPWD Rate: ₹ ${formData.cpwdRatePerSqM}/m²
- Base Rate: ₹ ${formData.ratePerSqFtBase}/sq.ft
- Cost Index: ${formData.costIndex} (${formData.costIndexName})
- Rate/sq.ft after Cost Index: ₹ ${formData.effectiveRatePerSqFt}/sq.ft
- Gross Structure Value: ₹ ${formData.grossStructureValue.toLocaleString('en-IN')}

DEPRECIATION & NET VALUE:
- Year of Construction: ${formData.yearOfConstruction} (Age: ${formData.ageOfBuilding} Years)
- Total Depreciation (${formData.totalDepreciationPct}%): -₹ ${formData.depreciationAmount.toLocaleString('en-IN')}
- Net Structure Value: ₹ ${formData.netStructureValue.toLocaleString('en-IN')}
${formData.totalLandValue ? `- Land / UDS Value: ₹ ${formData.totalLandValue.toLocaleString('en-IN')}\n` : ''}- TOTAL CERTIFIED VALUE: ₹ ${formData.grandTotalValuation.toLocaleString('en-IN')}
(${formData.grandTotalWords})

Valuer: ${formData.valuerName} (Reg: ${formData.regNo})
Date: ${formData.certificateDate}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveCertificate = () => {
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `*Valuation Certificate under Sec 28B/28C Kerala Stamp Act*\n` +
      `*Owner:* ${formData.ownerName || "Client"}\n` +
      `*Property:* ${formData.propertyAddress || formData.doorNo}\n` +
      `*Area:* ${formData.areaSqFt} sq.ft (${formData.areaSqM} m²)\n` +
      `*Effective Rate:* ₹${formData.effectiveRatePerSqFt}/sq.ft\n` +
      `*Total Valuation:* ₹${formData.grandTotalValuation.toLocaleString('en-IN')}\n` +
      `*Valuer:* ${formData.valuerName} (${formData.regNo})`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const handleLoadAttachmentSample = () => {
    const sample =
      INITIAL_SAMPLE_VALUATIONS.find((s) => s.id === "VAL-2026-003") ||
      INITIAL_SAMPLE_VALUATIONS[0];
    if (sample) {
      setFormData(sample);
      onChange(sample);
    }
  };

  const handleInsertStandardChecklist = () => {
    const standardChecklist =
      "RCC roof building\nDifference in main door\nDifference in windows\nDifference in electrical work\nDifference in plumbing work\nDifference in floor";
    updateField("buildingDescription", standardChecklist);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Top Builder Title Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-4 rounded-xl text-white shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-black font-sans tracking-wide">
            Certificate Builder
          </h2>
          <p className="text-xs text-blue-100 font-mono mt-0.5">
            Fill details below • Live preview updates automatically
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadAttachmentSample}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-mono px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow font-bold"
            title="Load the exact sample from attachment (Pradeep ck / Ussainar)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Attachment Sample</span>
          </button>
          <button
            onClick={() => setShowFontSettings(!showFontSettings)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-mono px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Style Settings</span>
          </button>
        </div>
      </div>

      {/* Optional Font & Style Settings Dropdown */}
      {showFontSettings && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 animate-fadeIn">
          <div className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
            <span>🎨 Font & Style Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Statutory Section Type
              </label>
              <select
                value={formData.sectionType}
                onChange={(e) => updateField("sectionType", e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="28B">Section 28B (Apartments / Flats)</option>
                <option value="28C">Section 28C (Buildings / Land with Buildings)</option>
                <option value="General">General Property Fair Valuation</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Certificate Ref Number
              </label>
              <input
                type="text"
                value={formData.certificateNo}
                onChange={(e) => updateField("certificateNo", e.target.value)}
                placeholder="e.g. VC-2026/001"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          1. VALUER INFORMATION
         ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            <User className="w-4 h-4 text-cyan-400" />
            <span>VALUER INFORMATION</span>
            {isAuthorizedSigner ? (
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded flex items-center gap-1 normal-case">
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span>Authorized Signer ({activeEmail})</span>
              </span>
            ) : (
              <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-700/80 px-2 py-0.5 rounded flex items-center gap-1 normal-case">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Manual Signature Mode</span>
              </span>
            )}
          </div>

          {/* Quick Preset Buttons for Engineer Profiles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleClearValuerDetails}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                !formData.valuerName
                  ? "bg-cyan-600 text-white shadow"
                  : "bg-slate-950 text-slate-300 hover:text-white border border-slate-800"
              }`}
              title="Clear all engineer details to blank template"
            >
              ➕ Blank / Manual Valuer
            </button>
            {INITIAL_PRESETS_ENGINEERS.filter(e => e.id !== "blank_engineer").map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => handleSelectEngineerPreset(eng.id)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  formData.engineerSealId === eng.id && formData.valuerName === eng.fullName
                    ? "bg-slate-700 text-cyan-300 border border-cyan-500"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
                title={`Load ${eng.fullName} profile`}
              >
                {eng.fullName}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Valuer Name</label>
            <input
              type="text"
              value={formData.valuerName}
              onChange={(e) => updateField("valuerName", e.target.value)}
              placeholder="Enter valuer name (leave blank for manual entry on print)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Valuer Address</label>
            <input
              type="text"
              value={formData.valuerAddress}
              onChange={(e) => updateField("valuerAddress", e.target.value)}
              placeholder="Enter valuer address (leave blank for manual entry)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Designation</label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => updateField("designation", e.target.value)}
                placeholder="e.g., B.Tech Civil Engineer / Registered Valuer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Registration Number</label>
              <input
                type="text"
                value={formData.regNo}
                onChange={(e) => updateField("regNo", e.target.value)}
                placeholder="e.g., LSGB/JDPKD/3361/2025-F5/SB"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Sub Registry Office</label>
              <input
                type="text"
                value={formData.subRegistryOffice}
                onChange={(e) => updateField("subRegistryOffice", e.target.value)}
                placeholder="e.g., Alappuzha / Parli"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Date of Inspection</label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => updateField("inspectionDate", e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. PROPERTY OWNER DETAILS
         ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Home className="w-4 h-4 text-emerald-400" />
          <span>PROPERTY OWNER DETAILS</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Owner Name</label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => updateField("ownerName", e.target.value)}
              placeholder="Enter property owner name"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Owner Address</label>
            <textarea
              rows={2}
              value={formData.ownerAddress}
              onChange={(e) => updateField("ownerAddress", e.target.value)}
              placeholder="Enter complete owner address"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Apartment / Building Name & Location
            </label>
            <input
              type="text"
              value={formData.propertyAddress}
              onChange={(e) => updateField("propertyAddress", e.target.value)}
              placeholder="e.g., Flat 4B, Palm Breeze Apartments, Boat Jetty Road, Alappuzha"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Door No</label>
              <input
                type="text"
                value={formData.doorNo}
                onChange={(e) => updateField("doorNo", e.target.value)}
                placeholder="e.g., 14/412-B"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Year of Construction</label>
              <input
                type="number"
                value={formData.yearOfConstruction}
                onChange={(e) => handleYearOfConstructionChange(parseInt(e.target.value, 10) || 2000)}
                placeholder="2000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-mono text-slate-300 block mb-1">Age of Building (Years)</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-400 font-mono font-bold flex items-center justify-between">
                <span>{formData.ageOfBuilding}</span>
                <span className="text-[10px] text-slate-500 font-sans">Years</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. VALUATION CALCULATION
         ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>VALUATION CALCULATION</span>
        </div>

        {/* Dual Area Converter (m² <-> ft²) */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 block">
            Area in Square Meters (m²)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={sqmInput}
                onChange={(e) => handleSqmChange(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                m²
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={sqftInput}
                onChange={(e) => handleSqftChange(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                sq.ft
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-xl text-xs font-mono text-blue-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>✏️ Area in ft²:</span>
              <strong className="text-white">{formData.areaSqFt} sq.ft</strong>
            </span>
            <span className="text-[11px] text-blue-400">
              ({formData.areaSqM} m² × 10.7639)
            </span>
          </div>
        </div>

        {/* CPWD Rate & Preset Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-300">CPWD Rate (₹/m²)</label>
            <span className="text-[10px] font-mono text-slate-500">Base Plinth Rate</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              value={formData.cpwdRatePerSqM}
              onChange={(e) => updateField("cpwdRatePerSqM", parseFloat(e.target.value) || 0)}
              placeholder="24500"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
            />

            <select
              onChange={(e) => handleSelectCpwdPreset(e.target.value)}
              defaultValue="residential_rcc_plinth"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {CPWD_RATE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.ratePerSqM})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cost Index & District Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono text-slate-300">Cost Index</label>
            <span className="text-[10px] font-mono text-slate-500">Kerala District Standards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              step="0.01"
              value={formData.costIndex}
              onChange={(e) => updateField("costIndex", parseFloat(e.target.value) || 1.0)}
              placeholder="1.33"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-mono font-bold"
            />

            <select
              onChange={(e) => handleSelectCostIndexPreset(e.target.value)}
              value={
                KERALA_DISTRICT_COST_INDICES.find((c) => c.locationName === formData.costIndexName)
                  ?.district || "Alappuzha"
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              {KERALA_DISTRICT_COST_INDICES.map((c) => (
                <option key={c.district} value={c.district}>
                  {c.districtMl} - {c.locationName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate Per Ft² Calculation Callout */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="text-xs font-mono text-slate-300">Rate per ft² (Before Depreciation)</div>

          <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-lg text-xs font-mono text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>💰 Computed:</span>
              <strong className="text-white">₹{formData.ratePerSqFtComputed}/ft²</strong>
            </span>
            <span className="text-[10px] text-amber-400">
              (₹{formData.cpwdRatePerSqM} ÷ 10.7639 × {formData.costIndex})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Computed (₹/ft²)</label>
              <input
                type="text"
                readOnly
                value={formData.ratePerSqFtComputed}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Adjusted (₹/ft²)</label>
              <input
                type="number"
                step="0.01"
                value={formData.ratePerSqFtAdjusted || ""}
                onChange={(e) => updateField("ratePerSqFtAdjusted", parseFloat(e.target.value) || undefined)}
                placeholder="Optional"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>
          <div className="text-[10.5px] font-sans text-slate-500 italic">
            💡 Leave adjusted empty to use computed. Enter custom value for structural issues or premium specifications.
          </div>
        </div>

        {/* Depreciation Method Note */}
        <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1">
          <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            <span>Depreciation Method</span>
          </div>
          <div className="text-[11.5px] font-sans text-amber-200/90 leading-relaxed">
            📉 Calculator default: <strong>1.5% per year straight-line</strong>, capped at <strong>75%</strong> — calculated on total structure cost.
          </div>
          <div className="text-[11px] font-mono text-slate-400 pt-1 flex justify-between">
            <span>Age: {formData.ageOfBuilding} Yrs</span>
            <span>Total Depr: {formData.totalDepreciationPct}% (-₹{formData.depreciationAmount.toLocaleString('en-IN')})</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. ADDITIONAL DETAILS & REMARKS
         ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
          <FileCheck2 className="w-4 h-4 text-indigo-400" />
          <span>ADDITIONAL DETAILS</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-mono text-slate-300">
              Building Description & Checklist Bullets
            </label>
            <button
              type="button"
              onClick={handleInsertStandardChecklist}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer bg-slate-950 px-2 py-0.5 rounded border border-slate-800 hover:border-cyan-500 transition-all"
              title="Insert standard checklist lines (RCC roof, Difference in doors/windows/etc.)"
            >
              ✨ Insert Standard Checklist
            </button>
          </div>
          <textarea
            rows={3}
            value={formData.buildingDescription}
            onChange={(e) => updateField("buildingDescription", e.target.value)}
            placeholder="Enter checklist lines (one per line). These will appear with ➢ bullet arrows on the certificate."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans resize-none leading-relaxed"
          />
          <div className="text-[10px] font-sans text-slate-500 mt-0.5">
            Each line will be printed as an official ➢ bullet item under the Note section.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Place</label>
            <input
              type="text"
              value={formData.place}
              onChange={(e) => updateField("place", e.target.value)}
              placeholder="e.g., Alappuzha"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">Certificate Date</label>
            <input
              type="date"
              value={formData.certificateDate}
              onChange={(e) => updateField("certificateDate", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          ACTION BUTTONS BAR (MATCHING USER SCREENSHOT EXACTLY)
         ========================================================================= */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800">
        <button
          onClick={handleCopySummary}
          className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-850 text-blue-300 hover:text-white border border-blue-800/60 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:border-blue-500"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Calculation Summary Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-blue-400" />
              <span>📋 Copy Calculation Summary</span>
            </>
          )}
        </button>

        <button
          onClick={onDownloadPdf}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-mono text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-950/60"
        >
          <Download className="w-4 h-4" />
          <span>📥 Download PDF Certificate</span>
        </button>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={onPrint}
            className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Direct Print Certificate"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Print</span>
          </button>

          <button
            onClick={handleSaveCertificate}
            className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
            title="Save to Valuation Dashboard"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 px-3 bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Share via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Share</span>
          </button>
        </div>

        <div className="text-center text-[10.5px] font-sans text-slate-500 pt-1">
          💡 <em>Tip: In print dialog, disable headers/footers for clean A4 legal output.</em>
        </div>
      </div>
    </div>
  );
};
