import React, { useState, useMemo } from "react";
import {
  OCCUPANCY_COMPARISON_DATA,
  OccupancyComparisonRow
} from "../../data/occupancyComparisonData";
import {
  Search,
  Download,
  Printer,
  Eye,
  Filter,
  Layers,
  ArrowUpDown,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";

interface OccupancyComparisonTableProps {
  onSelectOccupancy: (row: OccupancyComparisonRow) => void;
  onAskAI?: (prompt: string) => void;
}

export const OccupancyComparisonTable: React.FC<OccupancyComparisonTableProps> = ({
  onSelectOccupancy,
  onAskAI
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [categoryPanchayat, setCategoryPanchayat] = useState<"ALL" | "CAT_I" | "CAT_II">("ALL");

  const categories = [
    { id: "ALL", label: "All Groups (A1 - J)" },
    { id: "Residential", label: "Residential (A1, A2)" },
    { id: "Institutional", label: "Institutional (B, C)" },
    { id: "Assembly", label: "Assembly & Rec (D, D1)" },
    { id: "Commercial", label: "Commercial & Office (E, F)" },
    { id: "Industrial", label: "Industrial & Farm (G1, G2, G3)" },
    { id: "Storage", label: "Storage (H)" },
    { id: "Hazardous", label: "Hazardous (I)" },
    { id: "Special", label: "Multiplex (J)" }
  ];

  const filteredData = useMemo(() => {
    return OCCUPANCY_COMPARISON_DATA.filter((row) => {
      // Category filter
      if (selectedCategory !== "ALL" && row.categoryType !== selectedCategory) {
        return false;
      }

      // Search term filter
      if (searchTerm.trim() === "") return true;

      const q = searchTerm.toLowerCase();
      return (
        row.groupCode.toLowerCase().includes(q) ||
        row.titleEn.toLowerCase().includes(q) ||
        row.titleMl.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        row.maxCoverage.display.toLowerCase().includes(q) ||
        row.fsi.display.toLowerCase().includes(q) ||
        row.setbacksUpTo10m.display.toLowerCase().includes(q) ||
        row.minRoadWidth.range.toLowerCase().includes(q) ||
        row.carParkingRate.summary.toLowerCase().includes(q) ||
        row.ctpDtpThreshold.threshold.toLowerCase().includes(q)
      );
    });
  }, [searchTerm, selectedCategory]);

  const handleExportCSV = () => {
    const headers = [
      "Occupancy Group & Classification",
      "Title",
      "Description / Primary Usage",
      "Max Coverage (Cat I / Cat II)",
      "Floor Space Index - FSI (Basic / Max with Fee)",
      "Exterior Yard Setbacks up to 10m Height (Front / Rear / Side)",
      "Minimum Access Road Width",
      "Off-Street Car Parking Rate",
      "DTP / CTP Layout Approval Threshold"
    ];

    const rows = filteredData.map((r) => [
      `"${r.groupCode}"`,
      `"${r.titleEn} (${r.titleMl})"`,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.maxCoverage.display}"`,
      `"${r.fsi.display}"`,
      `"${r.setbacksUpTo10m.display}"`,
      `"${r.minRoadWidth.range}"`,
      `"${r.carParkingRate.summary.replace(/"/g, '""')}"`,
      `"${r.ctpDtpThreshold.threshold.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KPBR_Occupancies_Comparison_A1_to_J_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 uppercase">
                  KPBR 2019 • SRO NO. 1241/2025
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Showing {filteredData.length} of {OCCUPANCY_COMPARISON_DATA.length} Occupancies
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-sans">
                Comparative Table of Building Occupancies (Group A1 to Group J)
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Panchayat Category Highlight */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs font-mono">
              <span className="text-slate-500 text-[10px] px-2 uppercase font-bold">Panchayat:</span>
              <button
                type="button"
                onClick={() => setCategoryPanchayat("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryPanchayat === "ALL"
                    ? "bg-cyan-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCategoryPanchayat("CAT_I")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryPanchayat === "CAT_I"
                    ? "bg-emerald-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Cat I
              </button>
              <button
                type="button"
                onClick={() => setCategoryPanchayat("CAT_II")}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  categoryPanchayat === "CAT_II"
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Cat II
              </button>
            </div>

            {/* Export & Print */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print View"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Search and Category Filter Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-1 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code, occupancy type, road width, setbacks, or parking (e.g., A1, Hospital, 15m, CTP)..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Wrapper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="p-3.5 font-bold text-cyan-300 min-w-[160px]">
                  Occupancy Group &amp; Classification
                </th>
                <th className="p-3.5 font-bold text-slate-300 min-w-[200px]">
                  Description / Primary Usage
                </th>
                <th className="p-3.5 font-bold text-emerald-300 min-w-[140px]">
                  Max Coverage
                  <span className="block text-[9px] text-slate-500 lowercase">Cat I / Cat II</span>
                </th>
                <th className="p-3.5 font-bold text-cyan-300 min-w-[140px]">
                  Floor Space Index (FSI)
                  <span className="block text-[9px] text-slate-500 lowercase">Basic / Max with Fee</span>
                </th>
                <th className="p-3.5 font-bold text-amber-300 min-w-[200px]">
                  Setbacks up to 10m
                  <span className="block text-[9px] text-slate-500 lowercase">Front / Rear / Side (m)</span>
                </th>
                <th className="p-3.5 font-bold text-indigo-300 min-w-[130px]">
                  Min Access Road Width
                </th>
                <th className="p-3.5 font-bold text-emerald-400 min-w-[200px]">
                  Off-Street Car Parking Rate
                </th>
                <th className="p-3.5 font-bold text-rose-300 min-w-[160px]">
                  DTP / CTP Layout Approval
                </th>
                <th className="p-3.5 text-center w-12 text-slate-500">
                  Inspect
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-mono text-xs">
                    No matching occupancies found for &quot;{searchTerm}&quot;.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const isCatI = categoryPanchayat === "CAT_I";
                  const isCatII = categoryPanchayat === "CAT_II";

                  return (
                    <tr
                      key={row.groupCode}
                      onClick={() => onSelectOccupancy(row)}
                      className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? "bg-slate-900/40" : "bg-slate-900/80"
                      }`}
                    >
                      {/* Occupancy Group & Classification */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-mono font-black px-2 py-0.5 rounded border ${row.badgeColor.bg} ${row.badgeColor.border} ${row.badgeColor.text}`}
                            >
                              {row.groupCode}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white font-sans">
                            {row.titleEn}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans">
                            {row.titleMl}
                          </div>
                        </div>
                      </td>

                      {/* Description / Primary Usage */}
                      <td className="p-3.5 align-top text-slate-300 leading-relaxed font-sans text-xs">
                        {row.description}
                      </td>

                      {/* Max Coverage */}
                      <td className="p-3.5 align-top font-mono">
                        {isCatI ? (
                          <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-xs">
                            {row.maxCoverage.catI}
                          </span>
                        ) : isCatII ? (
                          <span className="text-blue-300 font-bold bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800 text-xs">
                            {row.maxCoverage.catII}
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs font-black text-emerald-300">
                              {row.maxCoverage.display}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Cat I: {row.maxCoverage.catI} | Cat II: {row.maxCoverage.catII}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* FSI */}
                      <td className="p-3.5 align-top font-mono">
                        {row.fsi.isUnrestricted ? (
                          <span className="text-lime-300 font-bold bg-lime-950/80 px-2 py-0.5 rounded border border-lime-800 text-[11px]">
                            Unrestricted
                          </span>
                        ) : isCatI ? (
                          <div className="space-y-0.5">
                            <span className="text-cyan-300 font-bold text-xs">
                              {row.fsi.catI.display}
                            </span>
                            <span className="block text-[10px] text-slate-500">Cat I</span>
                          </div>
                        ) : isCatII ? (
                          <div className="space-y-0.5">
                            <span className="text-blue-300 font-bold text-xs">
                              {row.fsi.catII.display}
                            </span>
                            <span className="block text-[10px] text-slate-500">Cat II</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-cyan-300">
                              {row.fsi.catI.display}{" "}
                              <span className="text-[10px] text-slate-400 font-normal">(Cat I)</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {row.fsi.catII.display}{" "}
                              <span className="text-[10px] text-slate-500 font-normal">(Cat II)</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Exterior Yard Setbacks up to 10m */}
                      <td className="p-3.5 align-top font-mono text-[11px] text-amber-300/90 leading-tight">
                        <div className="space-y-1">
                          <div className="font-bold text-amber-200">
                            {row.setbacksUpTo10m.display}
                          </div>
                          {row.setbacksUpTo10m.conditions && (
                            <div className="text-[10px] text-slate-400 font-sans">
                              {row.setbacksUpTo10m.conditions}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Minimum Access Road Width */}
                      <td className="p-3.5 align-top font-mono">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800 block w-max">
                            {row.minRoadWidth.range}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                            {row.minRoadWidth.details}
                          </span>
                        </div>
                      </td>

                      {/* Off-Street Car Parking Rate */}
                      <td className="p-3.5 align-top font-sans text-xs">
                        <div className="space-y-1">
                          <div className="font-bold text-emerald-300 font-mono text-[11px]">
                            {row.carParkingRate.summary}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            {row.carParkingRate.details}
                          </div>
                        </div>
                      </td>

                      {/* DTP / CTP Layout Approval */}
                      <td className="p-3.5 align-top">
                        <div className="space-y-1 font-mono">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border block w-max ${
                              row.ctpDtpThreshold.isAllMandatory
                                ? "bg-red-950 text-red-300 border-red-800"
                                : "bg-rose-950/80 text-rose-300 border-rose-800/80"
                            }`}
                          >
                            {row.ctpDtpThreshold.threshold}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block leading-tight">
                            {row.ctpDtpThreshold.details}
                          </span>
                        </div>
                      </td>

                      {/* Inspect Action */}
                      <td className="p-3.5 align-middle text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOccupancy(row);
                          }}
                          className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title={`View details for ${row.groupCode}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary note */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              All values aligned with Kerala Panchayat Building Rules (KPBR) 2019 up to SRO No. 1241/2025.
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Click any row to open the complete statutory compliance dossier.
          </div>
        </div>
      </div>
    </div>
  );
};
