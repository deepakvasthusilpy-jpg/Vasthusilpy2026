import React from "react";
import { OccupancyComparisonRow } from "../../data/occupancyComparisonData";
import {
  X,
  Layers,
  MapPin,
  Car,
  Maximize2,
  FileCheck,
  ShieldAlert,
  Bot,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";

interface OccupancyDetailDrawerProps {
  occupancy: OccupancyComparisonRow | null;
  onClose: () => void;
  onAskAI?: (prompt: string) => void;
}

export const OccupancyDetailDrawer: React.FC<OccupancyDetailDrawerProps> = ({
  occupancy,
  onClose,
  onAskAI
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!occupancy) return null;

  const handleCopy = () => {
    const text = `KPBR 2019 (Amended 2025) - ${occupancy.groupCode}: ${occupancy.titleEn} (${occupancy.titleMl})
Coverage: ${occupancy.maxCoverage.display}
FSI: ${occupancy.fsi.display}
Setbacks (up to 10m): ${occupancy.setbacksUpTo10m.display}
Min Road Width: ${occupancy.minRoadWidth.range} (${occupancy.minRoadWidth.details})
Parking: ${occupancy.carParkingRate.summary}
CTP/DTP Approval Threshold: ${occupancy.ctpDtpThreshold.threshold} (${occupancy.ctpDtpThreshold.details})
Highlights:
${occupancy.highlights.map((h) => "• " + h).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/80 sticky top-0 z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg border ${occupancy.badgeColor.bg} ${occupancy.badgeColor.border} ${occupancy.badgeColor.text}`}>
                {occupancy.groupCode}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Classification: {occupancy.categoryType}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white font-sans">
              {occupancy.titleEn} ({occupancy.titleMl})
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              {occupancy.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Statutory Matrix Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Coverage */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Max Permissible Coverage
              </span>
              <div className="text-base font-mono font-black text-emerald-300">
                {occupancy.maxCoverage.display}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Cat I: <strong className="text-white">{occupancy.maxCoverage.catI}</strong> • Cat II: <strong className="text-white">{occupancy.maxCoverage.catII}</strong>
              </div>
            </div>

            {/* FSI */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Floor Space Index (FSI)
              </span>
              <div className="text-base font-mono font-black text-cyan-300">
                {occupancy.fsi.display}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                Basic / Max with Fee escalation provisions
              </div>
            </div>

            {/* Setbacks */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Exterior Yard Setbacks (Up to 10m Height)
              </span>
              <div className="text-sm font-mono font-bold text-amber-300">
                {occupancy.setbacksUpTo10m.display}
              </div>
              {occupancy.setbacksUpTo10m.conditions && (
                <div className="text-[11px] text-slate-400 font-sans">
                  {occupancy.setbacksUpTo10m.conditions}
                </div>
              )}
            </div>

            {/* Road Width */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Minimum Access Road Width
              </span>
              <div className="text-sm font-mono font-bold text-white">
                {occupancy.minRoadWidth.range}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {occupancy.minRoadWidth.details}
              </div>
            </div>

            {/* Parking Rate */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                Off-Street Parking Mandate
              </span>
              <div className="text-xs font-mono font-bold text-emerald-400">
                {occupancy.carParkingRate.summary}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {occupancy.carParkingRate.details}
              </div>
            </div>

            {/* DTP / CTP Layout Approval */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 sm:col-span-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                DTP / CTP Layout Approval Threshold
              </span>
              <div className="text-xs font-mono font-bold text-rose-300">
                {occupancy.ctpDtpThreshold.threshold}
              </div>
              <div className="text-[11px] text-slate-400 font-sans">
                {occupancy.ctpDtpThreshold.details}
              </div>
            </div>
          </div>

          {/* Key Highlights */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-slate-300 block">
              Key Compliance Notes & Exceptions:
            </span>
            <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              {occupancy.highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-sans">
                  <span className="text-cyan-400 font-mono text-xs leading-none mt-1">•</span>
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ask AI quick question */}
          {onAskAI && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-sans">
                Have specific layout questions about {occupancy.groupCode}?
              </span>
              <button
                onClick={() => {
                  onClose();
                  onAskAI(`Under KPBR 2019, explain the latest permit rules, setbacks, and CTP layout requirements for ${occupancy.groupCode} (${occupancy.titleEn}).`);
                }}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask AI Agent</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
