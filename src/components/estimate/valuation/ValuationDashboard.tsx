import React, { useState } from "react";
import { ValuationCertificate } from "../../../types";
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  Calendar,
  Building,
  User,
  Printer,
  Download,
  Share2,
  Eye,
  Edit,
  Copy,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  MapPin,
  Sparkles
} from "lucide-react";

interface ValuationDashboardProps {
  certificates: ValuationCertificate[];
  onSelectCertificate: (cert: ValuationCertificate, mode?: "builder" | "preview") => void;
  onCreateNew: () => void;
  onDuplicate: (cert: ValuationCertificate) => void;
  onDelete: (id: string) => void;
  onQuickPrint: (cert: ValuationCertificate) => void;
}

export const ValuationDashboard: React.FC<ValuationDashboardProps> = ({
  certificates,
  onSelectCertificate,
  onCreateNew,
  onDuplicate,
  onDelete,
  onQuickPrint
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [valuerFilter, setValuerFilter] = useState<string>("ALL");
  const [deleteModalCert, setDeleteModalCert] = useState<ValuationCertificate | null>(null);

  // Summary Metrics
  const totalCount = certificates.length;
  const totalValuationSum = certificates.reduce(
    (sum, c) => sum + (c.grandTotalValuation || 0),
    0
  );
  const totalAreaSqFt = certificates.reduce((sum, c) => sum + (c.areaSqFt || 0), 0);
  const uniqueOffices = new Set(certificates.map((c) => c.subRegistryOffice).filter(Boolean)).size;

  // Filtered List
  const uniqueValuers = Array.from(
    new Set(certificates.map((c) => c.valuerName).filter(Boolean))
  );

  const filtered = certificates.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    const matchSearch =
      !term ||
      (c.ownerName || "").toLowerCase().includes(term) ||
      (c.propertyAddress || "").toLowerCase().includes(term) ||
      (c.subRegistryOffice || "").toLowerCase().includes(term) ||
      (c.valuerName || "").toLowerCase().includes(term) ||
      (c.doorNo || "").toLowerCase().includes(term) ||
      (c.certificateNo || "").toLowerCase().includes(term);

    const matchSection = sectionFilter === "ALL" || c.sectionType === sectionFilter;
    const matchValuer = valuerFilter === "ALL" || c.valuerName === valuerFilter;

    return matchSearch && matchSection && matchValuer;
  });

  const formatLakhsCrores = (num: number) => {
    if (num >= 10000000) {
      return `₹ ${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹ ${(num / 100000).toFixed(2)} L`;
    }
    return `₹ ${num.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800 uppercase inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>KERALA STAMP ACT 1959 • SECTION 28B / 28C</span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              CPWD PLINTH RATES
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white font-sans uppercase">
            Valuation Certificates Dashboard
          </h2>
          <p className="text-xs text-slate-400 font-mono max-w-2xl">
            Directory of statutory property valuation certificates for Kerala Sub Registrar Offices. Automatically stored and synchronized with engineering rubber seals and calculations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onCreateNew}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-mono text-xs md:text-sm font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Valuation Certificate</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Certificates Issued</span>
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalCount}</div>
          <div className="text-[10px] text-slate-500 font-mono">Total stored online</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Total Valuation Certified</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatLakhsCrores(totalValuationSum)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            ₹ {totalValuationSum.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Total Plinth Area</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalAreaSqFt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}{" "}
            <span className="text-xs text-slate-400 font-normal">sq.ft</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {(totalAreaSqFt / 10.7639).toFixed(1)} m² constructed
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center justify-between">
            <span>Sub Registry Offices</span>
            <MapPin className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{uniqueOffices}</div>
          <div className="text-[10px] text-slate-500 font-mono">Jurisdictions registered</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by owner, property, sub-registry, door no..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Sections (28B / 28C)</option>
            <option value="28B">Section 28B (Apartments)</option>
            <option value="28C">Section 28C (Buildings)</option>
            <option value="General">General Valuations</option>
          </select>

          {/* Valuer Filter */}
          {uniqueValuers.length > 0 && (
            <select
              value={valuerFilter}
              onChange={(e) => setValuerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Valuers</option>
              {uniqueValuers.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}

          <span className="text-xs font-mono text-slate-500 ml-2">
            Showing <strong className="text-white">{filtered.length}</strong> of {totalCount}
          </span>
        </div>
      </div>

      {/* Certificates Directory List / Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-mono font-bold text-slate-300">
            No Valuation Certificates Found
          </h3>
          <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
            {searchTerm || sectionFilter !== "ALL"
              ? "No certificates match the active search or filters. Try adjusting your search query."
              : "No valuation certificates created yet. Click 'New Valuation Certificate' to generate your first Kerala Stamp Act valuation."}
          </p>
          <button
            onClick={onCreateNew}
            className="mt-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Valuation Certificate</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((cert) => (
            <div
              key={cert.id}
              className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded">
                    Sec {cert.sectionType}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {cert.certificateNo || cert.id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    • Date: {cert.certificateDate}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded ml-auto lg:ml-0">
                    {cert.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white font-sans truncate">
                    {cert.ownerName || "Unnamed Property Owner"}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans line-clamp-1">
                    {cert.propertyAddress || cert.ownerAddress || "Property location not specified"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-400 pt-1">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Building className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {cert.areaSqFt} sq.ft ({cert.areaSqM} m²)
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>SRO: {cert.subRegistryOffice}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Valuer: {cert.valuerName}</span>
                  </span>
                  {cert.doorNo && (
                    <span className="text-slate-500">Door: {cert.doorNo}</span>
                  )}
                  {cert.ageOfBuilding > 0 && (
                    <span className="text-amber-400">
                      Age: {cert.ageOfBuilding} Yrs (Depr: {cert.totalDepreciationPct}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Right Valuation Amount & Actions */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800 shrink-0">
                <div className="text-left lg:text-right">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Total Certified Value
                  </div>
                  <div className="text-lg lg:text-xl font-black text-emerald-400 font-mono">
                    ₹ {cert.grandTotalValuation.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    Rate: ₹{cert.effectiveRatePerSqFt}/sq.ft
                  </div>
                </div>

                {/* Actions Toolbar */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectCertificate(cert, "preview")}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-800 rounded-xl transition-all cursor-pointer"
                    title="View Official Certificate"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectCertificate(cert, "builder")}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Edit in Certificate Builder"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onQuickPrint(cert)}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Print Certificate"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDuplicate(cert)}
                    className="p-2 bg-slate-950 hover:bg-slate-800 text-blue-400 hover:text-blue-300 border border-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Duplicate Certificate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteModalCert(cert)}
                    className="p-2 bg-slate-950 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-800 rounded-xl transition-all cursor-pointer"
                    title="Delete Valuation Certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dedicated Delete Confirmation Modal */}
      {deleteModalCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-sans">
                  Delete Valuation Certificate
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  {deleteModalCert.certificateNo || deleteModalCert.id}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs font-sans">
              <div className="text-slate-300">
                Are you sure you want to permanently delete this valuation record?
              </div>
              <div className="font-semibold text-white">
                Property Owner: {deleteModalCert.ownerName || "Unnamed Owner"}
              </div>
              {deleteModalCert.propertyAddress && (
                <div className="text-slate-400 text-[11px]">
                  Location: {deleteModalCert.propertyAddress}
                </div>
              )}
              <div className="text-[11px] font-mono text-amber-400 pt-1">
                Value: ₹{deleteModalCert.grandTotalValuation?.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalCert(null)}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-mono font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteModalCert.id);
                  setDeleteModalCert(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold cursor-pointer transition-all shadow-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
